#!/usr/bin/env python3
"""NetSluice helper with system rights.

The web service runs without privileges. For the few things that need root it
drops a request file into /var/lib/netsluice/req; systemd starts this helper,
which checks every request against a short list of allowed actions, carries it
out and writes the answer to /var/lib/netsluice/res.

Nothing in a request is trusted: only known commands, every argument validated.

    net-status                      name, addresses, running trial
    hostname      { name }
    addr-try      { ip }            add a second fixed address for five minutes
    addr-confirm                    keep the new address, drop the old one
    addr-revert                     drop the new address
    upd-status                      pending system updates, automatic updates on?
    upd-check                       refresh the package lists, then upd-status
    upd-auto      { on }
    upd-run                         install pending updates in the background

Called with --revert it ends a trial that nobody confirmed.
"""
import ipaddress, json, os, re, subprocess, sys, time

BASE = "/var/lib/netsluice"
REQ, RES, TRIAL = BASE + "/req", BASE + "/res", BASE + "/net-trial.json"
NETPLAN = "/etc/netplan/20-netsluice.yaml"
TRIAL_SECONDS = 300


def sh(cmd, timeout=120):
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        return r.returncode, (r.stdout + r.stderr).strip()
    except (OSError, subprocess.SubprocessError) as e:
        return 1, str(e)


# ---------- network -----------------------------------------------------------
def fixed():
    """The fixed addresses written by NetSluice, e.g. ['192.168.1.2/24']."""
    try:
        return re.findall(r"\d+\.\d+\.\d+\.\d+/\d+", open(NETPLAN).read())
    except OSError:
        return []


def write_fixed(addrs):
    body = ("# NetSluice: fixed addresses in addition to the one from DHCP, on whichever\n"
            "# Ethernet port is plugged in. Written by netsluice-root, do not edit by hand.\n"
            "network:\n  version: 2\n  ethernets:\n    all-eth-interfaces:\n      addresses: [%s]\n" % ", ".join(addrs))
    tmp = NETPLAN + ".tmp"
    fd = os.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w") as f:
        f.write(body)
    os.replace(tmp, NETPLAN)
    code, out = sh(["netplan", "generate"])
    if code:
        return out
    code, out = sh(["netplan", "apply"])
    return out if code else None


def trial():
    try:
        return json.load(open(TRIAL))
    except (OSError, ValueError):
        return None


def net_status(_=None):
    t = trial()
    if t:
        t["seconds_left"] = max(0, int(t["expires"] - time.time()))
    dhcp = []
    try:
        for i in json.loads(sh(["ip", "-j", "-4", "addr"])[1] or "[]"):
            dhcp += [a["local"] for a in i.get("addr_info", []) if a.get("dynamic")]
    except ValueError:
        pass
    return {"hostname": os.uname().nodename, "fixed": fixed(), "dhcp": dhcp, "trial": t}


def set_hostname(a):
    name = str(a.get("name", "")).lower()
    if not re.fullmatch(r"[a-z0-9]([a-z0-9-]{0,30}[a-z0-9])?", name):
        return {"error": "name"}
    code, out = sh(["hostnamectl", "set-hostname", name])
    if code:
        return {"error": out[:200]}
    try:
        hosts = open("/etc/hosts").read()
        hosts = re.sub(r"^127\.0\.1\.1.*$", "127.0.1.1\t" + name, hosts, flags=re.M) if re.search(r"^127\.0\.1\.1", hosts, re.M) else hosts + "127.0.1.1\t%s\n" % name
        open("/etc/hosts", "w").write(hosts)
    except OSError:
        pass
    sh(["systemctl", "restart", "avahi-daemon"])
    return net_status()


def addr_try(a):
    cur = fixed()
    if trial():
        return {"error": "trial"}
    if not cur:
        return {"error": "nofixed"}
    net = ipaddress.ip_interface(cur[0]).network
    try:
        ip = ipaddress.ip_address(str(a.get("ip", "")))
    except ValueError:
        return {"error": "ip"}
    if ip.version != 4 or ip not in net or ip in (net.network_address, net.broadcast_address):
        return {"error": "range", "network": str(net)}
    new = "%s/%d" % (ip, net.prefixlen)
    if new in cur:
        return {"error": "same"}
    if sh(["ping", "-c", "2", "-W", "1", str(ip)], 10)[0] == 0:      # somebody already answers there
        return {"error": "taken"}
    err = write_fixed(cur + [new])
    if err:
        write_fixed(cur)
        return {"error": err[:200]}
    json.dump({"old": cur, "new": new, "expires": time.time() + TRIAL_SECONDS}, open(TRIAL, "w"))
    os.chmod(TRIAL, 0o644)
    sh(["systemctl", "stop", "netsluice-net-revert.timer"]); sh(["systemctl", "reset-failed", "netsluice-net-revert.service"])
    sh(["systemd-run", "--quiet", "--unit=netsluice-net-revert", "--on-active=%d" % TRIAL_SECONDS, sys.executable, os.path.abspath(__file__), "--revert"])
    return net_status()


def addr_end(keep_new):
    t = trial()
    if not t:
        return {"error": "notrial"}
    err = write_fixed([t["new"]] if keep_new else t["old"])
    if err:
        return {"error": err[:200]}
    try:
        os.remove(TRIAL)
    except OSError:
        pass
    sh(["systemctl", "stop", "netsluice-net-revert.timer"])
    return net_status()


# ---------- system updates ------------------------------------------------------
AUTO = "/etc/apt/apt.conf.d/20auto-upgrades"


def upd_status(_=None):
    code, out = sh(["apt", "list", "--upgradable"], 60)
    held = set(sh(["apt-mark", "showhold"])[1].split())
    pending = [l.split("/")[0] for l in out.splitlines() if "/" in l and "upgradable" in l]
    auto = False
    try:
        auto = 'Unattended-Upgrade "1"' in open(AUTO).read() and sh(["dpkg", "-s", "unattended-upgrades"])[0] == 0
    except OSError:
        pass
    try:
        checked = int(os.path.getmtime("/var/lib/apt/periodic/update-success-stamp"))
    except OSError:
        try:
            checked = int(os.path.getmtime("/var/lib/apt/lists"))
        except OSError:
            checked = 0
    return {"pending": [p for p in pending if p not in held], "held": sorted(p for p in pending if p in held), "auto": auto, "checked": checked,
            "running": sh(["systemctl", "is-active", "netsluice-upgrade.service"])[1] == "active"}


def upd_check(_=None):
    code, out = sh(["apt-get", "update", "-q"], 240)
    s = upd_status()
    if code:
        s["error"] = out[-200:]
    return s


def upd_auto(a):
    on = bool(a.get("on"))
    if on and sh(["dpkg", "-s", "unattended-upgrades"])[0] != 0:
        code, out = sh(["apt-get", "install", "-y", "-q", "unattended-upgrades"], 300)
        if code:
            return {"error": out[-200:]}
    with open(AUTO, "w") as f:
        f.write('APT::Periodic::Update-Package-Lists "1";\nAPT::Periodic::Unattended-Upgrade "%d";\n' % (1 if on else 0))
    return upd_status()


def upd_run(_=None):
    sh(["systemctl", "reset-failed", "netsluice-upgrade.service"])
    code, out = sh(["systemd-run", "--quiet", "--unit=netsluice-upgrade", "--setenv=DEBIAN_FRONTEND=noninteractive", "sh", "-c",
                    "apt-get update -q && apt-get -y -q -o Dpkg::Options::=--force-confold upgrade"])
    s = upd_status()
    if code:
        s["error"] = out[-200:]
    return s


COMMANDS = {"net-status": net_status, "hostname": set_hostname, "addr-try": addr_try, "addr-confirm": lambda a: addr_end(True),
            "addr-revert": lambda a: addr_end(False), "upd-status": upd_status, "upd-check": upd_check, "upd-auto": upd_auto, "upd-run": upd_run}


def main():
    if "--revert" in sys.argv:
        t = trial()
        if t and t["expires"] <= time.time() + 5:
            addr_end(False)
        return
    os.makedirs(RES, exist_ok=True)
    def age(n):
        try:
            return os.path.getmtime(os.path.join(REQ, n))
        except OSError:
            return 0
    # oldest first: the order in which they were asked
    for name in sorted(os.listdir(REQ), key=age) if os.path.isdir(REQ) else []:
        path = os.path.join(REQ, name)
        m = re.fullmatch(r"([0-9a-f]{16})\.json", name)
        # A request nobody is waiting for any more must never be carried out later:
        # on a network box, an old "change the address" arriving out of the blue cuts the house off.
        stale = age(name) < time.time() - 20
        try:
            fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW)          # never follow a link somebody planted
            with os.fdopen(fd) as f:
                req = json.loads(f.read(4096))
        except (OSError, ValueError):
            req = None
        try:
            os.remove(path)
        except OSError:
            pass
        if not m or not isinstance(req, dict) or stale:
            continue
        fn = COMMANDS.get(req.get("cmd"))
        try:
            res = fn(req.get("args") if isinstance(req.get("args"), dict) else {}) if fn else {"error": "command"}
        except Exception as e:
            res = {"error": str(e)[:200]}
        out = os.path.join(RES, m.group(1) + ".json")
        with open(out + ".tmp", "w") as f:
            json.dump(res, f)
        os.chmod(out + ".tmp", 0o644)
        os.replace(out + ".tmp", out)
    # answers nobody fetched
    for name in os.listdir(RES):
        p = os.path.join(RES, name)
        if os.path.getmtime(p) < time.time() - 600:
            os.remove(p)


if __name__ == "__main__":
    main()
