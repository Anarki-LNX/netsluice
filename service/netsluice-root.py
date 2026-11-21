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
    st-status                       internal storage: what is there, is there a backup, what is running
    st-backup                       copy the internal storage to the card (--st-backup)
    st-install    { confirm, no_backup }   move this system to the internal storage (--st-install)
    st-restore    { confirm }       write the backup back (--st-restore)
    st-backup-delete | st-poweroff

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


SYS_PROGRESS = BASE + "/sys-progress.json"           # read directly by the service, for the progress bar


def sys_progress(phase, percent=None, pkg=None, error=None):
    try:
        write_json(SYS_PROGRESS, {"phase": phase, "percent": percent, "pkg": pkg, "error": error, "at": time.time()})
    except OSError:
        pass


def sys_upgrade():
    """Runs in the background (systemd-run). apt reports its progress on a status channel;
    lists count for the first 10 %, downloads up to 50 %, unpacking and setting up the rest."""
    env = dict(os.environ, DEBIAN_FRONTEND="noninteractive")
    sys_progress("lists", 2)
    code, out = sh(["apt-get", "update", "-q"], 300)
    if code:
        sys_progress("failed", error=out[-200:]); return
    sys_progress("download", 10)
    p = subprocess.Popen(["apt-get", "-y", "-q", "-o", "Dpkg::Options::=--force-confold", "-o", "APT::Status-Fd=1", "upgrade"],
                         stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, env=env)
    tail, shown = [], 0
    for line in p.stdout:
        tail = (tail + [line.rstrip()])[-6:]
        m = re.match(r"(dlstatus|pmstatus):([^:]*):([\d.]+):", line)
        if not m or time.time() - shown < 0.3:
            continue
        pct = float(m.group(3))
        if m.group(1) == "dlstatus":
            sys_progress("download", round(10 + pct * 0.4, 1))                     # its second field is a counter, not a name
        else:
            sys_progress("install", round(50 + pct * 0.49, 1), m.group(2).split(":")[0] or None)
        shown = time.time()
    if p.wait():
        sys_progress("failed", error=" ".join(tail)[-200:])
    else:
        sys_progress("done", 100)


def upd_run(_=None):
    sh(["systemctl", "reset-failed", "netsluice-upgrade.service"])
    sys_progress("start", 1)
    code, out = sh(["systemd-run", "--quiet", "--unit=netsluice-upgrade", sys.executable, os.path.abspath(__file__), "--sys-upgrade"])
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


# ---------- internal storage: back up, install, put back ---------------------------
# The device starts from a card whenever one is inserted, so a NetSluice on a card
# leaves the internal storage (eMMC) alone. Here the owner can keep a copy of what
# is on it, move NetSluice onto it, and put the copy back. Three rules:
#   - nothing is written to it unless the system runs from the card;
#   - the 16 MiB behind the partition table hold the vendor's bootloader and are
#     never written, neither by the installation nor by putting a backup back;
#   - one job at a time, in the background, reporting its progress to a file.
BACKUP_DIR = "/var/lib/netsluice-backup"
BACKUP_IMG, BACKUP_META = BACKUP_DIR + "/internal.img.gz", BACKUP_DIR + "/backup.json"
ST_PROGRESS = BASE + "/st-progress.json"            # read directly by the service, for the progress bar
ST_UNIT = "netsluice-storage"
BOOT_FROM, BOOT_TO = 64 * 512, 32768 * 512          # the vendor bootloader
CHUNK = 4 * 1024 * 1024
MiB = 1024 * 1024
INSTALLER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "netsluice-install.sh")


def disk_of_root():
    src = sh(["findmnt", "-no", "SOURCE", "/"])[1].strip()
    code, out = sh(["lsblk", "-no", "PKNAME", src])
    name = out.split()[0] if code == 0 and out.split() else ""
    return "/dev/" + name if name else None


def internal_disk():
    """The built-in eMMC. NETSLUICE_INTERNAL_DISK names it in an emulator, where there is none."""
    forced = os.environ.get("NETSLUICE_INTERNAL_DISK")
    if forced:
        return forced if os.path.exists(forced) else None
    for name in sorted(os.listdir("/sys/block")):
        if re.fullmatch(r"mmcblk\d+", name):
            try:
                if open("/sys/block/%s/device/type" % name).read().strip() == "MMC":
                    return "/dev/" + name
            except OSError:
                pass
    return None


def disk_size(dev):
    try:
        return int(open("/sys/block/%s/size" % os.path.basename(dev)).read()) * 512
    except (OSError, ValueError):
        return 0


def holds(dev):
    """What is on a disk, as far as it can be told: original | netsluice | other | unknown."""
    kinds = sh(["lsblk", "-rno", "FSTYPE,LABEL", dev])[1].split()
    if "netsluice_root" in kinds:
        return "netsluice"
    if "crypto_LUKS" in kinds:
        return "original"
    return "other" if kinds else "unknown"


def in_use(dev):
    try:
        return any(line.startswith(dev) for line in open("/proc/mounts"))
    except OSError:
        return True


def st_progress(job, phase, percent=None, error=None, **more):
    try:
        d = {"job": job, "phase": phase, "percent": percent, "error": error, "at": time.time()}
        d.update(more)
        write_json(ST_PROGRESS, d)
    except OSError:
        pass


def st_running():
    return sh(["systemctl", "is-active", ST_UNIT + ".service"])[1] == "active"


def st_status(_=None):
    root, internal = disk_of_root(), internal_disk()
    where = "internal" if internal and internal == root else "card" if internal and root else "none"
    fs = os.statvfs("/")
    used, free = (fs.f_blocks - fs.f_bfree) * fs.f_frsize, fs.f_bavail * fs.f_frsize
    out = {"where": where, "running": st_running(), "job": read_json(ST_PROGRESS), "free": free}
    have = os.path.getsize(BACKUP_IMG) if os.path.isfile(BACKUP_IMG) else 0
    meta = read_json(BACKUP_META)
    if meta and have:
        out["backup"] = meta
    if where == "card":
        size = disk_size(internal)
        out["internal"] = {"size": size, "holds": holds(internal)}
        out["room"] = free + have >= size + 64 * MiB          # worst case: nothing compresses
        out["fits"] = used - have + 256 * MiB <= size - BOOT_TO
    return out


def st_start(job, a):
    s = st_status()
    why = None
    if s["running"]:
        why = "running"
    elif s["where"] != "card":
        why = "notcard"
    elif job == "backup" and not s["room"]:
        why = "noroom"
    elif job in ("install", "restore") and str(a.get("confirm")) != "erase":
        why = "confirm"
    elif job == "install" and not s["fits"]:
        why = "toobig"
    elif job == "install" and "backup" not in s and not a.get("no_backup"):
        why = "nobackup"
    elif job == "restore" and "backup" not in s:
        why = "nobackup"
    elif job == "restore" and s["backup"].get("size") != s["internal"]["size"]:
        why = "othersize"
    if why:
        return {"error": why}
    sh(["systemctl", "reset-failed", ST_UNIT + ".service"])
    st_progress(job, "start", 0)
    cmd = ["systemd-run", "--quiet", "--unit=" + ST_UNIT]
    if os.environ.get("NETSLUICE_INTERNAL_DISK"):
        cmd.append("--setenv=NETSLUICE_INTERNAL_DISK=" + os.environ["NETSLUICE_INTERNAL_DISK"])
    code, out = sh(cmd + [sys.executable, os.path.abspath(__file__), "--st-" + job])
    s = st_status()
    if code:
        s["error"] = out[-200:]
    return s


def st_backup_delete(_=None):
    if st_running():
        return {"error": "running"}
    for p in (BACKUP_IMG, BACKUP_META, BACKUP_IMG + ".tmp"):
        try:
            os.remove(p)
        except OSError:
            pass
    return st_status()


def st_poweroff(_=None):
    """Only offered after an installation: the owner then pulls the card and powers the device up again."""
    s = st_status()
    job = s.get("job") or {}
    if s["running"] or s["where"] != "card" or job.get("job") != "install" or job.get("phase") != "done":
        return {"error": "notnow"}
    sh(["systemd-run", "--quiet", "--on-active=3", "systemctl", "poweroff"])
    return {"ok": True}


def st_do_backup():
    import grp, hashlib, zlib
    dev = internal_disk()
    size = disk_size(dev) if dev else 0
    if not size:
        raise ValueError("no internal storage found")
    try:
        gid = grp.getgrnam("netsluice").gr_gid          # the service hands the file out for download
    except KeyError:
        gid = 0
    os.makedirs(BACKUP_DIR, exist_ok=True)
    os.chown(BACKUP_DIR, 0, gid); os.chmod(BACKUP_DIR, 0o750)
    what, tmp = holds(dev), BACKUP_IMG + ".tmp"
    free = os.statvfs(BACKUP_DIR)
    if free.f_bavail * free.f_frsize < size + 64 * MiB:      # no room for two: the old one goes first
        for p in (BACKUP_IMG, BACKUP_META):
            try:
                os.remove(p)
            except OSError:
                pass
    raw, packed, boot = hashlib.sha256(), hashlib.sha256(), hashlib.sha256()
    z = zlib.compressobj(1, zlib.DEFLATED, 31)               # gzip, fast: the card is the slow part
    done = written = shown = 0
    try:
        with open(dev, "rb", buffering=0) as src, open(tmp, "wb") as dst:
            while done < size:
                chunk = src.read(min(CHUNK, size - done))
                if not chunk:
                    raise ValueError("the internal storage ended early, at byte %d" % done)
                raw.update(chunk)
                lo, hi = max(done, BOOT_FROM), min(done + len(chunk), BOOT_TO)
                if lo < hi:
                    boot.update(chunk[lo - done:hi - done])
                out = z.compress(chunk)
                if out:
                    packed.update(out); dst.write(out); written += len(out)
                done += len(chunk)
                if time.time() - shown > 0.5:
                    left = os.statvfs(BACKUP_DIR)
                    if left.f_bavail * left.f_frsize < 48 * MiB:
                        raise ValueError("the card is full")
                    st_progress("backup", "read", round(done * 100 / size, 1), done=done, total=size, written=written)
                    shown = time.time()
            out = z.flush()
            packed.update(out); dst.write(out); written += len(out)
            dst.flush(); os.fsync(dst.fileno())
        os.chown(tmp, 0, gid); os.chmod(tmp, 0o640)
        os.replace(tmp, BACKUP_IMG)
        write_json(BACKUP_META, {"created": int(time.time()), "size": size, "packed": written, "holds": what,
                                 "sha256": packed.hexdigest(), "sha256_raw": raw.hexdigest(), "sha256_boot": boot.hexdigest()})
        os.chown(BACKUP_META, 0, gid); os.chmod(BACKUP_META, 0o640)
        os.sync()
    finally:
        try:
            os.remove(tmp)
        except OSError:
            pass


def unpack(path):
    """The bytes of a backup, in order, a few megabytes at a time whatever they compress to."""
    import zlib
    z = zlib.decompressobj(31)
    with open(path, "rb") as f:
        while True:
            c = f.read(256 * 1024)
            if not c:
                break
            while c:
                out = z.decompress(c, CHUNK)
                c = z.unconsumed_tail
                if out:
                    yield out
        out = z.flush()
        if out:
            yield out


def pwrite_all(fd, data, pos):
    view = memoryview(data)
    while view:
        n = os.pwrite(fd, view, pos)
        view, pos = view[n:], pos + n


def st_do_restore():
    import hashlib
    dev = internal_disk()
    size, meta = (disk_size(dev) if dev else 0), read_json(BACKUP_META) or {}
    if not size or meta.get("size") != size:
        raise ValueError("this backup was not made from this storage")
    if in_use(dev):
        raise ValueError("part of the internal storage is in use")
    # 1. Is the backup intact, and is the bootloader on the device the one in it?
    raw, boot, pos, shown = hashlib.sha256(), hashlib.sha256(), 0, 0
    for piece in unpack(BACKUP_IMG):
        raw.update(piece)
        lo, hi = max(pos, BOOT_FROM), min(pos + len(piece), BOOT_TO)
        if lo < hi:
            boot.update(piece[lo - pos:hi - pos])
        pos += len(piece)
        if time.time() - shown > 0.5:
            st_progress("restore", "check", round(pos * 30 / size, 1)); shown = time.time()
    if pos != size or raw.hexdigest() != meta.get("sha256_raw"):
        raise ValueError("the backup is damaged. Nothing was written.")
    now = hashlib.sha256()
    with open(dev, "rb", buffering=0) as f:
        f.seek(BOOT_FROM)
        left = BOOT_TO - BOOT_FROM
        while left:
            c = f.read(min(CHUNK, left))
            if not c:
                break
            now.update(c); left -= len(c)
    if now.hexdigest() != boot.hexdigest():
        raise ValueError("the bootloader on the device is not the one in the backup. Nothing was written.")
    # 2. Write everything except the bootloader.
    fd = os.open(dev, os.O_WRONLY | os.O_EXCL)               # fails if anything has the disk open or mounted
    try:
        pos = 0
        for piece in unpack(BACKUP_IMG):
            end = pos + len(piece)
            if pos < BOOT_FROM:
                pwrite_all(fd, piece[:min(end, BOOT_FROM) - pos], pos)
            if end > BOOT_TO:
                start = max(pos, BOOT_TO)
                pwrite_all(fd, piece[start - pos:], start)
            pos = end
            if time.time() - shown > 0.5:
                st_progress("restore", "write", round(30 + pos * 45 / size, 1)); shown = time.time()
        os.fsync(fd)
    finally:
        os.close(fd)
    sh(["partprobe", dev]); sh(["udevadm", "settle"])
    # 3. Read it back.
    back, pos = hashlib.sha256(), 0
    with open(dev, "rb", buffering=0) as f:
        while pos < size:
            c = f.read(min(CHUNK, size - pos))
            if not c:
                break
            back.update(c); pos += len(c)
            if time.time() - shown > 0.5:
                st_progress("restore", "verify", round(75 + pos * 24 / size, 1)); shown = time.time()
    if back.hexdigest() != meta.get("sha256_raw"):
        raise ValueError("what was written does not read back as the backup")


def st_do_install():
    dev = internal_disk()
    if not dev:
        raise ValueError("no internal storage found")
    env = dict(os.environ, CONFIRM="erase-emmc", NETSLUICE_INTERNAL_DISK=dev, NETSLUICE_SKIP=BACKUP_DIR)
    p = subprocess.Popen(["bash", INSTALLER], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, env=env)
    tail = []
    for line in p.stdout:
        m = re.match(r"PROGRESS (\w+) (\d+)", line)
        if m:
            st_progress("install", m.group(1), int(m.group(2)))
        else:
            print(line, end="", flush=True)                   # into the journal of the job
            if line.strip():
                tail = (tail + [line.strip()])[-4:]
    if p.wait():
        raise ValueError(" ".join(tail)[-300:] or "the installation failed")


def st_job(job):
    try:
        {"backup": st_do_backup, "install": st_do_install, "restore": st_do_restore}[job]()
        st_progress(job, "done", 100)
    except Exception as e:
        st_progress(job, "failed", None, str(e)[:300])
        raise


# ---------- HTTPS ---------------------------------------------------------------
# The web server can sign a certificate for this device itself. Its root certificate
# is offered for download, so that browsers which import it stop warning. Port 80
# keeps working, nobody is locked out by a browser that distrusts the certificate.
CADDYFILE = "/etc/caddy/Caddyfile"
CA_ROOT = "/var/lib/caddy/.local/share/caddy/pki/authorities/local/root.crt"
CA_COPY, HTTPS_RESULT = BASE + "/https-ca.crt", BASE + "/https-result.json"
SITE = """	encode zstd gzip

	# sign-in, sign-out and first-time setup are reachable without a session
	handle /auth/* {
		reverse_proxy 127.0.0.1:3002
	}

	# everything that reads or changes the filter needs a valid session
	@inside path /control/* /api/*
	handle @inside {
		forward_auth 127.0.0.1:3002 {
			uri /auth/check
		}
		handle /control/* {
			reverse_proxy 127.0.0.1:3001
		}
		handle /api/* {
			reverse_proxy 127.0.0.1:3002
		}
	}

	# the interface itself: static files, nothing secret in them
	handle {
		root * /srv/netsluice/www
		# always revalidate, so a new version of the interface shows up on reload
		header Cache-Control "no-cache"
		file_server
	}"""


def caddyfile(https):
    """The whole configuration of the web server. Without HTTPS it is, to the letter,
    what provision/install-stack.sh writes (tests/caddyfile.sh compares them)."""
    if not https:
        return "{\n\tadmin off\n}\n\n:80 {\n" + SITE + "\n}\n"
    return ("{\n\tadmin off\n\t# port 80 stays a way in of its own, it does not send browsers to HTTPS\n\tauto_https disable_redirects\n"
            "\t# the root certificate is offered in the interface, not put into this system\n\tskip_install_trust\n}\n\n"
            ":80, :443 {\n\t# a certificate for whatever name or address the device is opened under\n"
            "\ttls internal {\n\t\ton_demand\n\t}\n\n" + SITE + "\n}\n")


def https_on():
    try:
        return "tls internal" in open(CADDYFILE).read()
    except OSError:
        return False


def port_open(port, wait):
    import socket
    end = time.time() + wait
    while time.time() < end:
        try:
            socket.create_connection(("127.0.0.1", port), 1).close()
            return True
        except OSError:
            time.sleep(0.5)
    return False


def https_set(a):
    """Switch HTTPS on or off. The new configuration is checked first; if the web server
    does not come up with it, the previous one is put back."""
    on = bool(a.get("on"))
    result = lambda err=None: (write_json(HTTPS_RESULT, {"on": https_on(), "error": err, "at": int(time.time())}), {"on": https_on(), "error": err})[1]
    try:
        old = open(CADDYFILE).read()
    except OSError as e:
        return result(str(e)[:200])
    tmp = CADDYFILE + ".new"
    with open(tmp, "w") as f:
        f.write(caddyfile(on))
    os.chmod(tmp, 0o644)
    code, out = sh(["runuser", "-u", "caddy", "--", "env", "HOME=/var/lib/caddy", "caddy", "validate", "--config", tmp, "--adapter", "caddyfile"], 60)
    if code:
        os.remove(tmp)
        return result("check: " + out[-200:])
    os.replace(tmp, CADDYFILE)
    sh(["systemctl", "restart", "caddy"], 60)
    if not (port_open(80, 20) and (not on or port_open(443, 10))):
        with open(CADDYFILE, "w") as f:
            f.write(old)
        sh(["systemctl", "restart", "caddy"], 60)
        return result("the web server did not start with the new setting; the previous one is back")
    if on:
        end = time.time() + 15
        while time.time() < end and not os.path.exists(CA_ROOT):
            time.sleep(0.5)
        try:
            with open(CA_ROOT, "rb") as src, open(CA_COPY + ".tmp", "wb") as dst:
                dst.write(src.read())
            os.chmod(CA_COPY + ".tmp", 0o644)
            os.replace(CA_COPY + ".tmp", CA_COPY)
        except OSError as e:
            return result("HTTPS is on, but the root certificate could not be read: " + str(e)[:120])
    else:
        try:
            os.remove(CA_COPY)
        except OSError:
            pass
    return result()


COMMANDS = {"net-status": net_status, "hostname": set_hostname, "addr-try": addr_try, "addr-confirm": lambda a: addr_end(True),
            "addr-revert": lambda a: addr_end(False), "upd-status": upd_status, "upd-check": upd_check, "upd-auto": upd_auto, "upd-run": upd_run,
            "app-status": app_status, "app-check": app_check, "app-run": app_run, "app-auto": app_auto,
            "st-status": st_status, "st-backup": lambda a: st_start("backup", a), "st-install": lambda a: st_start("install", a),
            "st-restore": lambda a: st_start("restore", a), "st-backup-delete": st_backup_delete, "st-poweroff": st_poweroff,
            "https-set": https_set}


def main():
    for job in ("backup", "install", "restore"):
        if "--st-" + job in sys.argv:
            st_job(job); return
    if "--sys-upgrade" in sys.argv:
        sys_upgrade(); return
    if "--app-update" in sys.argv:
        app_update(); return
    if "--app-auto" in sys.argv:
        s = app_check()
        if s["available"] and not s["running"]:
            app_update()
        return
    if "--https-on" in sys.argv:              # for install-stack.sh, which writes the plain configuration
        print(https_set({"on": True})); return
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
