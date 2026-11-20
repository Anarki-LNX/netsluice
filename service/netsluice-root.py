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
    app-status                      installed and newest NetSluice version
    app-check                       ask GitHub for the newest release
    app-run                         install it in the background (--app-update)
    app-auto      { on }            look and install once a day (--app-auto)

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


# ---------- NetSluice itself ------------------------------------------------------
# New versions come only from the releases of the project on GitHub, over HTTPS.
# An update replaces the interface and the service, never the filter engine, so
# name lookups keep working throughout. If the service does not answer afterwards,
# the previous version is put back.
REPO = "Anarki-LNX/netsluice"
SHARE, WWW = "/usr/share/netsluice", "/srv/netsluice/www"
VERSION_FILE, PREVIOUS = SHARE + "/VERSION", SHARE + "/previous"
APP_LATEST, APP_LAST = BASE + "/app-latest.json", BASE + "/app-update.json"
APP_PROGRESS = BASE + "/app-progress.json"          # read directly by the service, for the progress bar
GITHUB = ("https://api.github.com/", "https://codeload.github.com/", "https://github.com/",
          "https://objects.githubusercontent.com/", "https://release-assets.githubusercontent.com/")
WORK = "/var/lib/netsluice-update"
APP_UNIT = "netsluice-app-update"
AUTO_TIMER = "/etc/systemd/system/netsluice-app-auto.timer"
MAX_DOWNLOAD = 30 * 1024 * 1024


def vtuple(v):
    m = re.fullmatch(r"v?(\d{1,4})\.(\d{1,4})\.(\d{1,4})", str(v or "").strip())
    return tuple(int(x) for x in m.groups()) if m else None


def installed():
    try:
        v = open(VERSION_FILE).read().strip()
        return v if vtuple(v) else None
    except OSError:
        return None


def read_json(path, default=None):
    try:
        return json.load(open(path))
    except (OSError, ValueError):
        return default


def write_json(path, data):
    with open(path + ".tmp", "w") as f:
        json.dump(data, f)
    os.chmod(path + ".tmp", 0o644)
    os.replace(path + ".tmp", path)


def fetch(url, limit, timeout=30, progress=None):
    """Download from GitHub only. progress(done, total) is called while the bytes arrive."""
    import urllib.request
    if not url.startswith(GITHUB):
        raise ValueError("refusing to download from " + url[:80])
    req = urllib.request.Request(url, headers={"User-Agent": "NetSluice/" + (installed() or "0"), "Accept": "application/vnd.github+json"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        if not r.geturl().startswith(GITHUB):
            raise ValueError("redirected away from GitHub")
        total = int(r.headers.get("Content-Length") or 0) or None
        chunks, done, shown = [], 0, 0
        while True:
            chunk = r.read(65536)
            if not chunk:
                break
            chunks.append(chunk); done += len(chunk)
            if done > limit:
                raise ValueError("download too large")
            if progress and time.time() - shown > 0.2:
                progress(done, total); shown = time.time()
        if progress:
            progress(done, total or done)
    return b"".join(chunks)


def set_progress(phase, to=None, done=None, total=None):
    try:
        old = read_json(APP_PROGRESS, {}) if phase != "start" else {}
        write_json(APP_PROGRESS, {"phase": phase, "to": to or old.get("to"), "done": done, "total": total, "at": time.time()})
    except OSError:
        pass


def latest_release():
    """The newest published release, pre-releases included (the project is young)."""
    best = None
    for r in json.loads(fetch("https://api.github.com/repos/%s/releases?per_page=30" % REPO, 2 * 1024 * 1024)):
        v = vtuple(r.get("tag_name"))
        if r.get("draft") or not v:
            continue
        if best is None or v > best[0]:
            best = (v, r)
    if not best:
        return None
    r = best[1]
    version = ".".join(map(str, best[0]))
    # the package we attach to every release; its size is known, so the download can show a percentage
    asset = next(({"url": a["browser_download_url"], "size": a.get("size")} for a in r.get("assets") or []
                  if a.get("name") == "netsluice-%s.tar.gz" % version and str(a.get("browser_download_url", "")).startswith("https://github.com/")), None)
    return {"tag": r["tag_name"], "asset": asset, "version": ".".join(map(str, best[0])), "name": (r.get("name") or "")[:120],
            "url": r.get("html_url", ""), "published": r.get("published_at", ""), "prerelease": bool(r.get("prerelease")),
            "notes": (r.get("body") or "")[:1500]}


def app_status(_=None):
    latest = read_json(APP_LATEST, {})
    cur, new = installed(), (latest.get("release") or {}).get("version")
    return {"version": cur, "latest": latest.get("release"), "checked": latest.get("checked", 0), "error": latest.get("error"),
            "available": bool(new and (cur is None or vtuple(new) > vtuple(cur))),
            "running": sh(["systemctl", "is-active", APP_UNIT + ".service"])[1] == "active",
            "auto": os.path.exists(AUTO_TIMER), "last": read_json(APP_LAST)}


def app_check(_=None):
    try:
        write_json(APP_LATEST, {"release": latest_release(), "checked": int(time.time())})
    except Exception as e:
        old = read_json(APP_LATEST, {})
        old.update(error=str(e)[:200], checked=int(time.time()))
        write_json(APP_LATEST, old)
    return app_status()


def app_run(_=None):
    if app_status()["running"]:
        return {"error": "running"}
    sh(["systemctl", "reset-failed", APP_UNIT + ".service"])
    set_progress("start", to=((read_json(APP_LATEST, {}).get("release") or {}).get("version")))
    code, out = sh(["systemd-run", "--quiet", "--unit=" + APP_UNIT, sys.executable, os.path.abspath(__file__), "--app-update"])
    s = app_status()
    if code:
        s["error"] = out[-200:]
    return s


def app_auto(a):
    if a.get("on"):
        with open("/etc/systemd/system/netsluice-app-auto.service", "w") as f:
            f.write("[Unit]\nDescription=NetSluice: install a new version if there is one\n\n[Service]\nType=oneshot\n"
                    "ExecStart=/usr/bin/python3 %s/service/netsluice-root.py --app-auto\n" % SHARE)
        with open(AUTO_TIMER, "w") as f:
            f.write("[Unit]\nDescription=NetSluice: look for a new version once a day\n\n[Timer]\nOnCalendar=*-*-* 04:00\n"
                    "RandomizedDelaySec=2h\nPersistent=true\n\n[Install]\nWantedBy=timers.target\n")
        sh(["systemctl", "daemon-reload"])
        code, out = sh(["systemctl", "enable", "--now", "netsluice-app-auto.timer"])
    else:
        sh(["systemctl", "disable", "--now", "netsluice-app-auto.timer"])
        for p in (AUTO_TIMER, "/etc/systemd/system/netsluice-app-auto.service"):
            try:
                os.remove(p)
            except OSError:
                pass
        code, out = sh(["systemctl", "daemon-reload"])
    s = app_status()
    if code:
        s["error"] = out[-200:]
    return s


def service_answers(seconds=40):
    import urllib.request
    end = time.time() + seconds
    while time.time() < end:
        try:
            with urllib.request.urlopen("http://127.0.0.1:3002/auth/state", timeout=3) as r:
                if r.status == 200 and "configured" in json.loads(r.read(4096)):
                    return True
        except Exception:
            pass
        time.sleep(1)
    return False


def swap_in(src, dst):
    """Replace directory dst by a copy of src in one rename."""
    import shutil
    new, old = dst + ".new", dst + ".old"
    shutil.rmtree(new, ignore_errors=True); shutil.rmtree(old, ignore_errors=True)
    shutil.copytree(src, new)
    sh(["chmod", "-R", "a+rX,go-w", new])
    if os.path.isdir(dst):
        os.rename(dst, old)
    os.rename(new, dst)
    shutil.rmtree(old, ignore_errors=True)


def app_update():
    """Runs in the background (systemd-run): download, check, install, verify, or roll back."""
    import io, shutil, tarfile
    last = {"at": int(time.time()), "from": installed()}
    try:
        rel = latest_release()
        write_json(APP_LATEST, {"release": rel, "checked": int(time.time())})
        if not rel:
            raise ValueError("no release found")
        cur = installed()
        if cur and vtuple(rel["version"]) <= vtuple(cur):
            last.update(result="current", to=cur); return
        last["to"] = to = rel["version"]
        set_progress("download", to, 0, (rel.get("asset") or {}).get("size"))
        url = (rel.get("asset") or {}).get("url") or "https://codeload.github.com/%s/tar.gz/refs/tags/%s" % (REPO, rel["tag"])
        size = (rel.get("asset") or {}).get("size")
        blob = fetch(url, MAX_DOWNLOAD, 120, lambda d, t: set_progress("download", to, d, t or size))
        set_progress("check", to)
        shutil.rmtree(WORK, ignore_errors=True)
        os.makedirs(WORK, mode=0o700)
        with tarfile.open(fileobj=io.BytesIO(blob), mode="r:gz") as tf:
            tf.extractall(WORK, filter="data")                       # no links out, no absolute paths, no devices
        tops = os.listdir(WORK)
        if len(tops) != 1:
            raise ValueError("unexpected archive layout")
        src = os.path.join(WORK, tops[0])
        if not os.path.isfile(os.path.join(src, "VERSION")):
            raise ValueError("release %s cannot be installed from the interface" % rel["tag"])
        if open(os.path.join(src, "VERSION")).read().strip() != rel["version"]:
            raise ValueError("the archive does not contain version " + rel["version"])
        for need in ("web/index.html", "web/app.js", "service/netsluiced.py", "service/netsluice-root.py"):
            if not os.path.isfile(os.path.join(src, need)):
                raise ValueError("missing in the archive: " + need)
        for py in ("netsluiced.py", "netsluice-root.py"):
            code, out = sh([sys.executable, "-m", "py_compile", os.path.join(src, "service", py)])
            if code:
                raise ValueError("%s does not compile: %s" % (py, out[-120:]))
        set_progress("install", to)
        # keep what runs now, to go back to
        shutil.rmtree(PREVIOUS, ignore_errors=True)
        os.makedirs(PREVIOUS)
        shutil.copytree(WWW, PREVIOUS + "/www"); shutil.copytree(SHARE + "/service", PREVIOUS + "/service")
        if cur:
            shutil.copy2(VERSION_FILE, PREVIOUS + "/VERSION")
        swap_in(os.path.join(src, "web"), WWW)
        swap_in(os.path.join(src, "service"), SHARE + "/service")
        shutil.copy2(os.path.join(src, "VERSION"), VERSION_FILE + ".tmp"); os.chmod(VERSION_FILE + ".tmp", 0o644)
        os.replace(VERSION_FILE + ".tmp", VERSION_FILE)
        set_progress("restart", to)
        sh(["systemctl", "restart", "netsluiced"])
        if service_answers():
            last.update(result="ok"); return
        # the new version does not come up: put the old one back
        swap_in(PREVIOUS + "/www", WWW)
        swap_in(PREVIOUS + "/service", SHARE + "/service")
        if os.path.exists(PREVIOUS + "/VERSION"):
            shutil.copy2(PREVIOUS + "/VERSION", VERSION_FILE)
        else:
            os.remove(VERSION_FILE)
        sh(["systemctl", "restart", "netsluiced"])
        last.update(result="rolled-back", error="the service did not answer after the update")
    except Exception as e:
        last.update(result="failed", error=str(e)[:200])
    finally:
        shutil.rmtree(WORK, ignore_errors=True)
        last["done"] = int(time.time())
        write_json(APP_LAST, last)
        set_progress({"ok": "done", "current": "done"}.get(last.get("result"), last.get("result", "failed")), last.get("to"))


COMMANDS = {"net-status": net_status, "hostname": set_hostname, "addr-try": addr_try, "addr-confirm": lambda a: addr_end(True),
            "addr-revert": lambda a: addr_end(False), "upd-status": upd_status, "upd-check": upd_check, "upd-auto": upd_auto, "upd-run": upd_run,
            "app-status": app_status, "app-check": app_check, "app-run": app_run, "app-auto": app_auto}


def main():
    if "--app-update" in sys.argv:
        app_update(); return
    if "--app-auto" in sys.argv:
        s = app_check()
        if s["available"] and not s["running"]:
            app_update()
        return
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
