#!/usr/bin/env python3
"""netsluiced, the NetSluice service.

It sits between the web interface and the filter engine (AdGuard Home) and does
what the engine does not:

  access      one password, sessions, asked by the web server before every request
  world map   follows the engine's query log and looks up the country of each answer
  devices     names from the router and mDNS, maker from the hardware address,
              model and firmware where a device announces them
  children    internet on or off per device, by hand or by schedule
  board       the two LEDs and the button of the device
  messages    ntfy or a webhook when something happens
  system      name, addresses and updates, through the helper with root rights
  storage     back up the internal storage, install onto it, put the backup back

The service itself runs without privileges. Sections below follow this order;
search for "# ----------" to jump between them.

HTTP interface (all JSON, localhost only, the web server in front checks the session):

    GET  /auth/state | /auth/check          POST /auth/setup | login | logout | password
    GET  /api/geo?since=<seq>               countries, recent events
    GET  /api/devices
    GET  /api/flow?since=<seq>              the newest lookups: which device asked, and whether it was stopped
    GET  /api/kids                          POST /api/kids | /api/kids/extend | /api/kids/remove
    GET  /api/settings                      POST /api/settings | /api/notify/test
    GET  /api/storage | /api/storage/progress | /api/storage/backup/download
                                            POST /api/storage/backup[/delete] | install | restore | poweroff
    GET  /api/system | /api/system/app/progress | /api/system/app/hint | /api/system/updates/progress
    GET  /api/system/https | /api/system/https/ca     POST /api/system/https { on }
                                            POST /api/system/hostname | address[/confirm|/revert]
                                                 /api/system/updates/check | auto | run
                                                 /api/system/app/check | auto | run

Standard library only.
"""
import array, base64, bisect, csv, hashlib, hmac, json, os, re, secrets, shutil, signal, socket, struct, subprocess, sys, threading, time, urllib.parse, urllib.request
from datetime import datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

AGH = os.environ.get("NETSLUICE_AGH", "http://127.0.0.1:3001")
DB = os.environ.get("NETSLUICE_GEODB", "/usr/share/netsluice/geo/dbip-country-ipv4.csv")
STATE = os.environ.get("NETSLUICE_STATE", "/var/lib/netsluice/geo.json")
LISTEN = ("127.0.0.1", int(os.environ.get("NETSLUICE_PORT", "3002")))
RESOLVER = os.environ.get("NETSLUICE_RESOLVER", "9.9.9.10")   # unfiltered, to see where a blocked name would have gone
HOURS = 24
AUTH = os.path.join(os.path.dirname(STATE), "auth.json")
RULES = os.path.join(os.path.dirname(STATE), "rules.json")
SETTINGS = os.path.join(os.path.dirname(STATE), "settings.json")
LEDS = "/sys/class/leds"
REQ, RES = os.path.join(os.path.dirname(STATE), "req"), os.path.join(os.path.dirname(STATE), "res")
BUTTON = "/dev/input/by-path/platform-gpio-keys-event"
BACKUP = os.environ.get("NETSLUICE_BACKUP", "/var/lib/netsluice-backup/internal.img.gz")   # written by the helper, handed out here
SESSION_DAYS = 30
OUI = [os.environ.get("NETSLUICE_OUI", "/usr/share/netsluice/oui.csv"), "/usr/share/ieee-data/oui.csv"]   # current list first, packaged one as fallback


# ---------- country lookup -------------------------------------------------
class GeoDB:
    def __init__(self, path):
        self.starts, self.ends, self.cc = array.array("I"), array.array("I"), []
        with open(path, encoding="ascii", errors="replace") as f:
            for line in f:
                p = line.strip().split(",")
                if len(p) < 3:
                    continue
                try:
                    self.starts.append(ip2int(p[0])); self.ends.append(ip2int(p[1])); self.cc.append(sys.intern(p[2][:2].upper()))
                except (ValueError, OSError):
                    continue

    def lookup(self, ip):
        try:
            n = ip2int(ip)
        except (ValueError, OSError):
            return None
        i = bisect.bisect_right(self.starts, n) - 1
        if i >= 0 and self.ends[i] >= n:
            return self.cc[i]
        return None


def ip2int(ip):
    return struct.unpack("!I", socket.inet_aton(ip))[0]


def is_public(ip):
    try:
        a, b = [int(x) for x in ip.split(".")[:2]]
    except ValueError:
        return False
    return not (a in (0, 10, 127) or a >= 224 or (a == 172 and 16 <= b <= 31) or (a == 192 and b == 168) or (a == 169 and b == 254) or (a == 100 and 64 <= b <= 127))


# ---------- a very small DNS client ---------------------------------------
def dns_query(name, qtype, server, timeout=1.5):
    """Return the answers of one query as a list of (type, rdata bytes)."""
    qid = int.from_bytes(os.urandom(2), "big")
    q = struct.pack("!HHHHHH", qid, 0x0100, 1, 0, 0, 0)
    for label in name.strip(".").split("."):
        raw = label.encode("idna") if label else b""
        q += bytes([len(raw)]) + raw
    q += b"\0" + struct.pack("!HH", qtype, 1)
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
        s.settimeout(timeout)
        s.sendto(q, (server, 53))
        data, _ = s.recvfrom(2048)
    if len(data) < 12 or data[:2] != q[:2]:
        return []
    qd, an = struct.unpack("!HH", data[4:8])
    pos = 12

    def skip_name(p):
        while p < len(data):
            n = data[p]
            if n == 0:
                return p + 1
            if n & 0xC0 == 0xC0:
                return p + 2
            p += 1 + n
        return p

    for _ in range(qd):
        pos = skip_name(pos) + 4
    out = []
    for _ in range(an):
        pos = skip_name(pos)
        if pos + 10 > len(data):
            break
        rtype, _cls, _ttl, rlen = struct.unpack("!HHIH", data[pos:pos + 10])
        pos += 10
        out.append((rtype, data[pos:pos + rlen], data, pos))
        pos += rlen
    return out


def dns_name(data, pos):
    """Read a possibly compressed domain name out of a DNS message."""
    labels, hops = [], 0
    while pos < len(data) and hops < 20:
        n = data[pos]
        if n == 0:
            break
        if n & 0xC0 == 0xC0:
            if pos + 1 >= len(data):
                break
            pos = ((n & 0x3F) << 8) | data[pos + 1]; hops += 1
            continue
        labels.append(data[pos + 1:pos + 1 + n].decode("ascii", "replace")); pos += 1 + n
    return ".".join(labels)


def reverse_name(ip, server):
    try:
        q = ".".join(reversed(ip.split("."))) + ".in-addr.arpa"
        for rtype, _rdata, data, pos in dns_query(q, 12, server, timeout=1.0):
            if rtype == 12:
                return dns_name(data, pos)
    except (OSError, ValueError):
        pass
    return None


def resolve_a(name):
    try:
        for rtype, rdata, *_ in dns_query(name, 1, RESOLVER):
            if rtype == 1 and len(rdata) == 4:
                return socket.inet_ntoa(rdata)
    except OSError:
        pass
    return None


def public_ip():
    """Ask Google's name server which address we come from. No web service involved."""
    try:
        for rtype, rdata, *_ in dns_query("o-o.myaddr.l.google.com", 16, "216.239.32.10", timeout=3):
            if rtype == 16 and rdata:
                txt = rdata[1:1 + rdata[0]].decode("ascii", "replace")
                if txt.count(".") == 3:
                    return txt
    except OSError:
        pass
    return None


# ---------- state -----------------------------------------------------------
class State:
    def __init__(self):
        self.lock = threading.Lock()
        self.buckets = {}          # hour -> { cc: [ok, blocked] }
        self.events = []           # newest last
        self.seq = 0
        self.home = None
        self.seen = set()
        self.last_time = ""
        self.cache = {}            # blocked name -> (cc, expires)
        self.clients = set()       # addresses that asked the filter
        self.mine = {"127.0.0.1", "::1"}  # this device's own addresses
        self.devices = {}          # ip -> what we found out about it
        self.macs = {}             # ip -> hardware address, remembered
        self.flow = []             # the newest lookups, for the live stage: newest last
        self.flow_seq = 0
        self.blocked = {}          # hour -> { client: requests stopped }
        self.blocked_upto = ""     # time of the newest log entry counted there
        self.load()

    def load(self):
        try:
            with open(STATE) as f:
                d = json.load(f)
            self.buckets = {int(h): v for h, v in d.get("buckets", {}).items()}
            self.home = d.get("home")
            self.blocked = {int(h): v for h, v in d.get("blocked", {}).items()}
            self.blocked_upto = d.get("blocked_upto", "")
        except (OSError, ValueError):
            pass

    def save(self):
        with self.lock:
            d = {"buckets": self.buckets, "home": self.home, "blocked": self.blocked, "blocked_upto": self.blocked_upto}
        os.makedirs(os.path.dirname(STATE), exist_ok=True)
        tmp = STATE + ".tmp"
        with open(tmp, "w") as f:
            json.dump(d, f)
        os.replace(tmp, STATE)

    def add(self, cc, blocked, host, client):
        hour = int(time.time() // 3600)
        with self.lock:
            b = self.buckets.setdefault(hour, {}).setdefault(cc, [0, 0])
            b[1 if blocked else 0] += 1
            self.seq += 1
            self.events.append({"seq": self.seq, "cc": cc, "blocked": blocked, "host": host, "client": client})
            del self.events[:-400]
            for h in [h for h in self.buckets if h < hour - HOURS]:
                del self.buckets[h]

    def add_flow(self, client, blocked, host):
        """One lookup as it happened. The name asked for is kept only when it was stopped."""
        with self.lock:
            self.flow_seq += 1
            self.flow.append({"seq": self.flow_seq, "client": client, "blocked": blocked, "host": host if blocked else ""})
            del self.flow[:-300]

    def flow_since(self, since):
        with self.lock:
            return {"seq": self.flow_seq, "events": [e for e in self.flow if e["seq"] > since][-80:]}

    def count_blocked(self, client, when):
        """One request of this client was stopped, at this time of the query log."""
        hour = hour_of(when)
        with self.lock:
            per = self.blocked.setdefault(hour, {})
            per[client] = per.get(client, 0) + 1
            now = int(time.time() // 3600)
            for h in [h for h in self.blocked if h < now - HOURS]:
                del self.blocked[h]

    def blocked_totals(self):
        hour = int(time.time() // 3600)
        with self.lock:
            totals = {}
            for h, per in self.blocked.items():
                if h >= hour - HOURS:
                    for client, n in per.items():
                        totals[client] = totals.get(client, 0) + n
            return totals

    def snapshot(self, since):
        hour = int(time.time() // 3600)
        with self.lock:
            totals = {}
            for h, per in self.buckets.items():
                if h >= hour - HOURS:
                    for cc, (ok, no) in per.items():
                        t = totals.setdefault(cc, [0, 0]); t[0] += ok; t[1] += no
            ev = [e for e in self.events if e["seq"] > since][-120:]
            return {"home": self.home, "countries": totals, "events": ev, "seq": self.seq}


def hour_of(when):
    """The hour (since 1970) of a time as the query log writes it, e.g. 2026-01-02T03:04:05.123456789Z."""
    try:
        return int(datetime.fromisoformat(re.sub(r"\.\d+", "", when).replace("Z", "+00:00")).timestamp() // 3600)
    except ValueError:
        return int(time.time() // 3600)


def is_blocked(e):
    return str(e.get("reason", "")).startswith("Filtered")


def backfill(st):
    """Once, on a device that never counted: who was stopped how often in the last day,
    from the filter's query log. Pages are asked for by the time the previous one ended at."""
    older, newest, floor = "", "", int(time.time() // 3600) - HOURS
    for _ in range(400):
        try:
            url = AGH + "/control/querylog?limit=500&response_status=filtered" + ("&older_than=" + urllib.parse.quote(older) if older else "")
            with urllib.request.urlopen(url, timeout=20) as r:
                page = json.load(r)
        except (OSError, ValueError):
            return False                                  # the filter is not up yet: try again later
        entries = page.get("data") or []
        for e in entries:                                 # newest first
            when, client = e.get("time", ""), e.get("client", "")
            newest = newest or when
            if client and client not in st.mine and is_blocked(e) and hour_of(when) >= floor:
                st.count_blocked(client, when)
        nxt = page.get("oldest") or ""
        if not entries or not nxt or nxt == older or hour_of(nxt) < floor:
            break
        older = nxt
    st.blocked_upto = newest or time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    return True


def follow(db, st, cfg=None, leds=None):
    """Read new entries from the filter's query log, forever."""
    last_save = time.time()
    last_home = 0
    threat_ids, last_lists, told = set(), 0, {}
    while True:
        if time.time() - last_home > 6 * 3600 or (st.home is None and time.time() - last_home > 60):
            last_home = time.time()
            ip = public_ip()
            cc = db.lookup(ip) if ip else None
            if cc:
                st.home = {"cc": cc}
        if cfg and time.time() - last_lists > 600:      # which lists are about malware
            last_lists = time.time()
            try:
                threat_ids = {f["id"] for f in (agh("filtering/status") or {}).get("filters") or [] if re.search(r"threat|malware|phish|security", f.get("name", ""), re.I)}
            except Exception:
                pass
        try:
            with urllib.request.urlopen(AGH + "/control/querylog?limit=300", timeout=5) as r:
                entries = json.load(r).get("data") or []
        except (OSError, ValueError):
            time.sleep(3)
            continue
        if not st.blocked_upto:
            backfill(st)
        counted = st.blocked_upto
        fresh = []
        for e in entries:                       # newest first
            t = e.get("time", "")
            key = (t, (e.get("question") or {}).get("name"), e.get("client"))
            if t < st.last_time or key in st.seen:
                continue
            fresh.append((key, e))
        for key, e in reversed(fresh):
            st.seen.add(key)
            q = e.get("question") or {}
            # per device every stopped request counts, whatever its record type
            if counted and key[0] > counted and is_blocked(e) and e.get("client") and e.get("client") not in st.mine:
                st.count_blocked(e["client"], key[0])
            # the live stage shows every request, as the counters count them: also the ones
            # for IPv6 and HTTPS records, which the world map leaves out
            if st.last_time and e.get("client") and e.get("client") not in st.mine:
                st.add_flow(e["client"], is_blocked(e), q.get("name", ""))
            if q.get("type") != "A":            # one event per lookup, not one per record type
                continue
            host, client = q.get("name", ""), e.get("client", "")
            if client in st.mine:               # our own lookups do not belong on the map
                continue
            if client:
                st.clients.add(client)
            blocked = is_blocked(e)
            if blocked and st.last_time:                # not for the backlog read at start
                if leds:
                    leds.flash()
                bad = "SafeBrowsing" in str(e.get("reason", "")) or any(r.get("filter_list_id") in threat_ids for r in e.get("rules") or [])
                if cfg and bad and told.get((client, host), 0) < time.time() - 3600:
                    told[(client, host)] = time.time()
                    who = (st.devices.get(client) or {}).get("name") or client
                    notify_bg(cfg, "malware", "NetSluice: dangerous host stopped", f"{who} tried to reach {host}. The filter stopped it.")
            ip = next((a.get("value") for a in (e.get("answer") or []) if a.get("type") == "A" and is_public(str(a.get("value", "")))), None)
            cc = None
            if ip:
                cc = db.lookup(ip)
            elif blocked and host:
                hit = st.cache.get(host)
                if hit and hit[1] > time.time():
                    cc = hit[0]
                else:
                    real = resolve_a(host)
                    cc = db.lookup(real) if real and is_public(real) else None
                    st.cache[host] = (cc, time.time() + 3600)
                    if len(st.cache) > 5000:
                        st.cache.clear()
            if cc:
                st.add(cc, blocked, host, client)
        if entries:
            st.last_time = max(st.last_time, entries[0].get("time", ""))
            if counted:
                st.blocked_upto = max(st.blocked_upto, entries[0].get("time", ""))
        if len(st.seen) > 5000:
            st.seen = {k for k in st.seen if k[0] >= st.last_time[:16]}
        if time.time() - last_save > 300:
            last_save = time.time()
            try:
                st.save()
            except OSError:
                pass
        time.sleep(1)


# ---------- access ------------------------------------------------------------
class Auth:
    """One password for the interface, sessions kept as hashes so a stolen file opens nothing."""

    def __init__(self, path):
        self.path, self.lock, self.fails = path, threading.Lock(), []
        self.data = {"salt": None, "hash": None, "sessions": {}}
        try:
            with open(path) as f:
                self.data.update(json.load(f))
        except (OSError, ValueError):
            pass

    def _save(self):
        os.makedirs(os.path.dirname(self.path), exist_ok=True)
        tmp = self.path + ".tmp"
        fd = os.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
        with os.fdopen(fd, "w") as f:
            json.dump(self.data, f)
        os.replace(tmp, self.path)

    @staticmethod
    def _hash(password, salt):
        return hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt), n=2 ** 14, r=8, p=1, dklen=32).hex()

    @property
    def configured(self):
        return bool(self.data.get("hash"))

    def set_password(self, password):
        with self.lock:
            salt = secrets.token_hex(16)
            self.data.update(salt=salt, hash=self._hash(password, salt), sessions={})
            self._save()

    def verify(self, password):
        with self.lock:
            now = time.time()
            self.fails = [t for t in self.fails if t > now - 300]
            if len(self.fails) >= 5:
                return None                         # too many wrong tries, wait
            ok = self.configured and hmac.compare_digest(self._hash(password, self.data["salt"]), self.data["hash"])
            if not ok:
                self.fails.append(now)
            return ok

    def open_session(self):
        token = secrets.token_urlsafe(32)
        with self.lock:
            now = time.time()
            self.data["sessions"] = {k: v for k, v in self.data["sessions"].items() if v > now}
            self.data["sessions"][hashlib.sha256(token.encode()).hexdigest()] = now + SESSION_DAYS * 86400
            self._save()
        return token

    def valid(self, token):
        if not token:
            return False
        return self.data["sessions"].get(hashlib.sha256(token.encode()).hexdigest(), 0) > time.time()

    def close_session(self, token):
        with self.lock:
            if token and self.data["sessions"].pop(hashlib.sha256(token.encode()).hexdigest(), None):
                self._save()


# ---------- asking the helper with system rights ------------------------------------
def root_call(cmd, args=None, timeout=30):
    rid = secrets.token_hex(8)
    try:
        os.makedirs(REQ, exist_ok=True)
        tmp = os.path.join(REQ, rid + ".tmp")
        with open(tmp, "w") as f:
            json.dump({"cmd": cmd, "args": args or {}}, f)
        os.replace(tmp, os.path.join(REQ, rid + ".json"))
    except OSError as e:
        return {"error": "helper: " + str(e)[:100]}
    res, end = os.path.join(RES, rid + ".json"), time.time() + timeout
    while time.time() < end:
        try:
            with open(res) as f:
                return json.load(f)
        except (OSError, ValueError):
            time.sleep(0.2)
    try:
        os.remove(os.path.join(REQ, rid + ".json"))     # we gave up: it must not run later
    except OSError:
        pass
    return {"error": "timeout"}


# ---------- settings, LEDs, button, messages --------------------------------------
DEFAULTS = {
    "led": {"mode": "on", "flash": True, "night_from": "22:00", "night_to": "07:00"},   # mode: on | night | off
    "button": True,
    "notify": {"kind": "off", "url": "", "newdev": True, "malware": True, "down": True},  # kind: off | ntfy | webhook
    "known": None,                                                                        # hardware addresses seen so far
}


class Settings:
    def __init__(self, path):
        self.path, self.lock = path, threading.Lock()
        self.data = json.loads(json.dumps(DEFAULTS))
        try:
            with open(path) as f:
                saved = json.load(f)
            for k, v in saved.items():
                if isinstance(v, dict) and isinstance(self.data.get(k), dict):
                    self.data[k].update(v)
                else:
                    self.data[k] = v
        except (OSError, ValueError):
            pass

    def save(self):
        os.makedirs(os.path.dirname(self.path), exist_ok=True)
        tmp = self.path + ".tmp"
        fd = os.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)   # the notify address is a secret
        with os.fdopen(fd, "w") as f:
            json.dump(self.data, f)
        os.replace(tmp, self.path)

    def public(self):
        with self.lock:
            d = {k: self.data[k] for k in ("led", "button", "notify")}
        d = json.loads(json.dumps(d))
        d["hardware"] = {"leds": os.access(LEDS + "/led_red/brightness", os.W_OK), "button": os.access(BUTTON, os.R_OK)}
        return d

    def update(self, data):
        hm = lambda v, d: v if isinstance(v, str) and re.fullmatch(r"([01]\d|2[0-3]):[0-5]\d", v) else d
        with self.lock:
            led, cur = data.get("led"), self.data["led"]
            if isinstance(led, dict):
                if led.get("mode") in ("on", "night", "off"):
                    cur["mode"] = led["mode"]
                if isinstance(led.get("flash"), bool):
                    cur["flash"] = led["flash"]
                cur["night_from"], cur["night_to"] = hm(led.get("night_from"), cur["night_from"]), hm(led.get("night_to"), cur["night_to"])
            if isinstance(data.get("button"), bool):
                self.data["button"] = data["button"]
            n, cur = data.get("notify"), self.data["notify"]
            if isinstance(n, dict):
                if n.get("kind") in ("off", "ntfy", "webhook"):
                    cur["kind"] = n["kind"]
                if isinstance(n.get("url"), str) and len(n["url"]) <= 300 and (n["url"] == "" or re.match(r"https?://[^\s]+$", n["url"])):
                    cur["url"] = n["url"]
                for k in ("newdev", "malware", "down"):
                    if isinstance(n.get(k), bool):
                        cur[k] = n[k]
            self.save()


def notify(cfg, event, title, text, force=False):
    """Send one message. Returns None when it went out, otherwise why not."""
    with cfg.lock:
        n = dict(cfg.data["notify"])
    if n["kind"] == "off" or not n["url"]:
        return "off"
    if not force and not n.get(event, True):
        return "muted"
    try:
        if n["kind"] == "ntfy":
            req = urllib.request.Request(n["url"], data=text.encode(), headers={"Title": title.encode("ascii", "replace").decode(), "Tags": "shield"})
        else:
            req = urllib.request.Request(n["url"], data=json.dumps({"event": event, "title": title, "text": text}).encode(), headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=8) as r:
            return None if r.status < 300 else "HTTP %d" % r.status
    except Exception as e:
        return str(e)[:120]


def notify_bg(cfg, event, title, text):
    threading.Thread(target=notify, args=(cfg, event, title, text), daemon=True).start()


class Leds:
    """Green shows that the device is alive, red flashes for every request the filter stops."""

    def __init__(self, cfg):
        self.cfg, self.pending, self.state = cfg, threading.Event(), None

    @staticmethod
    def write(led, name, value):
        try:
            with open(f"{LEDS}/{led}/{name}", "w") as f:
                f.write(value)
            return True
        except OSError:
            return False

    def dark(self):
        with self.cfg.lock:
            led = dict(self.cfg.data["led"])
        if led["mode"] == "off":
            return True
        if led["mode"] == "night":
            t = time.localtime(); hm = "%02d:%02d" % (t.tm_hour, t.tm_min)
            a, b = led["night_from"], led["night_to"]
            return a <= hm < b if a <= b else (hm >= a or hm < b)
        return False

    def flash(self):
        self.pending.set()

    def run(self):
        while True:
            dark = self.dark()
            if dark != self.state:                      # apply the base state once per change
                self.state = dark
                self.write("led_red", "trigger", "none"); self.write("led_red", "brightness", "0")
                if dark:
                    self.write("led_green", "trigger", "none"); self.write("led_green", "brightness", "0")
                else:
                    self.write("led_green", "trigger", "heartbeat")
            if self.pending.wait(5):
                self.pending.clear()
                with self.cfg.lock:
                    want = self.cfg.data["led"]["flash"]
                if want and not self.dark():
                    self.write("led_red", "brightness", "1"); time.sleep(0.09); self.write("led_red", "brightness", "0"); time.sleep(0.06)


def button(cfg, leds):
    """A press pauses the filter for ten minutes, the next press switches it back on."""
    EV = struct.Struct("llHHi")
    while True:
        try:
            with open(BUTTON, "rb") as f:
                while True:
                    raw = f.read(EV.size)
                    if len(raw) < EV.size:
                        break
                    _s, _us, etype, _code, value = EV.unpack(raw)
                    if etype != 1 or value != 1:        # key press only, not release or repeat
                        continue
                    with cfg.lock:
                        if not cfg.data["button"]:
                            continue
                    on = (agh("status") or {}).get("protection_enabled", True)
                    agh("protection", {"enabled": not on, "duration": 0 if not on else 600000})
                    for _ in range(3):                    # acknowledge the press
                        leds.write("led_red", "brightness", "1"); time.sleep(0.12); leds.write("led_red", "brightness", "0"); time.sleep(0.12)
        except Exception:
            time.sleep(10)                                # no button on this board, or not readable


# ---------- internet on and off for chosen devices --------------------------
class Rules:
    """A device is known by its hardware address, so the rule follows it to a new IP address."""

    def __init__(self, path):
        self.path, self.lock = path, threading.Lock()
        self.data = {"rules": {}, "managed": []}
        try:
            with open(path) as f:
                self.data.update(json.load(f))
        except (OSError, ValueError):
            pass

    def save(self):
        os.makedirs(os.path.dirname(self.path), exist_ok=True)
        tmp = self.path + ".tmp"
        with open(tmp, "w") as f:
            json.dump(self.data, f)
        os.replace(tmp, self.path)

    @staticmethod
    def allowed(rule, now=None):
        now = now or time.time()
        if rule.get("until", 0) > now:
            return True
        mode = rule.get("mode", "on")
        if mode != "schedule":
            return mode == "on"
        t = time.localtime(now)
        hm = "%02d:%02d" % (t.tm_hour, t.tm_min)
        a, b = rule.get("from", "00:00"), rule.get("to", "00:00")
        if a <= b:
            return t.tm_wday in rule.get("days", []) and a <= hm < b
        # a window over midnight belongs to the day it starts on
        return (t.tm_wday in rule.get("days", []) and hm >= a) or ((t.tm_wday - 1) % 7 in rule.get("days", []) and hm < b)

    def view(self):
        with self.lock:
            return {k: dict(r, blocked=not self.allowed(r)) for k, r in self.data["rules"].items()}


def agh(path, body=None):
    req = urllib.request.Request(AGH + "/control/" + path, data=None if body is None else json.dumps(body).encode(), headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=5) as r:
        raw = r.read()
    try:
        return json.loads(raw) if raw else None
    except ValueError:
        return None


def enforce(rules, st):
    """Tell the filter which addresses get no answers right now. Touches only entries it added itself."""
    with rules.lock:
        blocked_keys = [k for k, r in rules.data["rules"].items() if not rules.allowed(r)]
        managed = set(rules.data.get("managed", []))
    want = set()
    for k in blocked_keys:
        if k.startswith("ip:"):
            want.add(k[3:])
        else:
            want.update(ip for ip, mac in st.macs.items() if mac == k)
    want -= st.mine
    cur = agh("access/list") or {}
    have = set(cur.get("disallowed_clients") or [])
    new = (have - managed) | want
    if new != have:
        agh("access/set", {"allowed_clients": cur.get("allowed_clients") or [], "disallowed_clients": sorted(new), "blocked_hosts": cur.get("blocked_hosts") or []})
    if want != managed:
        with rules.lock:
            rules.data["managed"] = sorted(want)
            rules.save()


VERSION_FILE = os.environ.get("NETSLUICE_VERSION", "/usr/share/netsluice/VERSION")
APP_LATEST = os.path.join(os.path.dirname(STATE), "app-latest.json")   # written by the helper when it looks on GitHub


def read_text(path, default=""):
    try:
        with open(path) as f:
            return f.read()
    except OSError:
        return default


def app_hint():
    """The running version and, if GitHub had a newer one at the last look, that one."""
    def parts(v):
        m = re.fullmatch(r"v?(\d{1,4})\.(\d{1,4})\.(\d{1,4})", str(v or "").strip())
        return tuple(int(x) for x in m.groups()) if m else None
    cur = read_text(VERSION_FILE).strip() or None
    try:
        new = (json.loads(read_text(APP_LATEST, "{}")).get("release") or {}).get("version")
    except (ValueError, AttributeError):
        new = None
    newer = bool(parts(new) and parts(cur) and parts(new) > parts(cur))
    return {"version": cur, "latest": new if newer else None}


CADDYFILE = os.environ.get("NETSLUICE_CADDYFILE", "/etc/caddy/Caddyfile")
HTTPS_CA = os.path.join(os.path.dirname(STATE), "https-ca.crt")           # copy of the root certificate, made by the helper
HTTPS_RESULT = os.path.join(os.path.dirname(STATE), "https-result.json")
https_busy = threading.Event()


def https_status():
    """Read from files, without the helper: the page asks while the web server restarts."""
    on = "tls internal" in read_text(CADDYFILE)
    try:
        last = json.loads(read_text(HTTPS_RESULT, "{}"))
    except ValueError:
        last = {}
    out = {"on": on, "busy": https_busy.is_set(), "error": last.get("error"), "ca": False, "fingerprint": None}
    try:
        with open(HTTPS_CA) as f:
            pem = f.read()
        der = base64.b64decode("".join(l for l in pem.split("-----END")[0].splitlines() if l and not l.startswith("-----")))
        digest = hashlib.sha256(der).hexdigest().upper()
        out.update(ca=on, fingerprint=":".join(digest[i:i + 2] for i in range(0, len(digest), 2)) if on else None)
    except (OSError, ValueError):
        pass
    return out


def https_switch(on):
    """Runs after the answer went out: switching restarts the web server the request came through."""
    try:
        time.sleep(0.5)
        root_call("https-set", {"on": on}, timeout=150)
    except Exception:
        pass
    finally:
        https_busy.clear()


def lookout():
    """Look on GitHub for a new version about once a day, so the top bar can say so.
    Looking installs nothing; that stays a click, or the daily automatic update."""
    time.sleep(120)
    while True:
        try:
            checked = json.loads(read_text(APP_LATEST, "{}")).get("checked", 0)
        except (ValueError, AttributeError):
            checked = 0
        if time.time() - checked > 20 * 3600:
            try:
                root_call("app-check", timeout=60)
            except Exception:
                pass
        time.sleep(3600)


def clock(rules, st, cfg=None):
    misses, down = 0, False
    while True:
        try:
            enforce(rules, st)
            misses = 0
            if down and cfg:
                down = False
                notify_bg(cfg, "down", "NetSluice: filter is back", "The filter answers again.")
        except Exception as e:
            misses += 1
            if misses == 3 and cfg:                     # a minute without an answer
                down = True
                notify_bg(cfg, "down", "NetSluice: filter does not answer", "The filter engine has not answered for a minute. Your network may be without DNS.")
            if misses == 1:
                print("netsluiced: could not apply device rules:", e, flush=True)
        time.sleep(20)


# ---------- who is on the network ------------------------------------------
KIND_BY_SERVICE = [
    ("_googlecast", "tv"), ("_airplay", "tv"), ("_raop", "speaker"), ("_spotify-connect", "speaker"), ("_sonos", "speaker"),
    ("_amzn-wplay", "tv"), ("_ipp", "printer"), ("_printer", "printer"), ("_pdl-datastream", "printer"), ("_scanner", "printer"),
    ("_esphomelib", "iot"), ("_shelly", "iot"), ("_wled", "iot"), ("_hap", "iot"), ("_homekit", "iot"), ("_matter", "iot"), ("_miio", "iot"),
    ("_smb", "computer"), ("_ssh", "computer"), ("_sftp-ssh", "computer"), ("_workstation", "computer"), ("_companion-link", "phone"),
]
KIND_BY_NAME = [
    (r"iphone|android|galaxy-?[saz]|pixel-?\d|oneplus|redmi|huawei-p|motorola|razr|moto-|phone", "phone"), (r"ipad|tablet|galaxy-?tab", "tablet"),
    (r"tv|bravia|webos|chromecast|firetv|fire-tv|roku|shield", "tv"), (r"echo|alexa|sonos|homepod|nest-?(mini|audio|hub)", "speaker"),
    (r"shelly|tasmota|esp[_-]?\w*|wled|zigbee|tuya|sonoff|hue|homeassistant|openhab|inverter|wechselrichter|miner|fuehler|sensor", "iot"),
    (r"printer|laserjet|officejet|deskjet|envy|brother|epson|canon", "printer"),
    (r"proxmox|pve|nas|synology|server|pihole|docker", "server"),
    (r"laptop|desktop|macbook|imac|thinkpad|pc$|^pc|arch|fedora|ubuntu|debian|windows|workstation", "computer"),
    (r"switch|usw|uap|u6|u7|udm|ucg|gateway|router|fritz|mikrotik|ap-", "network"),
    (r"playstation|ps[45]|xbox|nintendo|switch-?oled|steamdeck", "console"),
]
KIND_BY_VENDOR = [
    ("proxmox", "vm"), ("ubiquiti", "network"), ("routerboard", "network"), ("mikrotik", "network"), ("avm", "network"), ("tp-link", "network"), ("netgear", "network"), ("cisco", "network"),
    ("espressif", "iot"), ("allterco", "iot"), ("shelly", "iot"), ("tuya", "iot"), ("sonoff", "iot"), ("itead", "iot"), ("signify", "iot"), ("philips lighting", "iot"), ("texas instruments", "iot"),
    ("amazon", "speaker"), ("sonos", "speaker"), ("ugreen", "server"), ("synology", "server"), ("qnap", "server"), ("murata", "iot"), ("raspberry", "computer"), ("nintendo", "console"), ("sony interactive", "console"),
    ("lg electronics", "tv"), ("tcl", "tv"), ("hisense", "tv"), ("roku", "tv"),
    ("hewlett packard", "computer"), ("dell", "computer"), ("lenovo", "computer"), ("intel", "computer"), ("micro-star", "computer"), ("asustek", "computer"), ("gigabyte", "computer"), ("huawei", "computer"),
    ("brother", "printer"), ("seiko epson", "printer"), ("canon", "printer"), ("kyocera", "printer"),
    ("apple", "phone"), ("samsung", "phone"), ("xiaomi", "phone"), ("oneplus", "phone"), ("google", "phone"),
]


def load_oui(paths):
    out = {}
    for path in reversed(paths):                    # later files win, so the first path has priority
        try:
            with open(path, newline="", encoding="utf-8", errors="replace") as f:
                for row in csv.reader(f):
                    if len(row) >= 3 and len(row[1]) == 6:
                        out[row[1].upper()] = row[2].strip()
        except OSError:
            pass
    return out


def own_addresses():
    out = set()
    try:
        for i in json.loads(run(["ip", "-j", "addr"], 5) or "[]"):
            out.update(a.get("local") for a in i.get("addr_info", []))
    except ValueError:
        pass
    return out


def run(cmd, timeout):
    try:
        return subprocess.run(cmd, capture_output=True, text=True, timeout=timeout).stdout
    except (OSError, subprocess.SubprocessError):
        return ""


def neighbours():
    """IPv4 address -> hardware address, from the kernel's neighbour table."""
    out = {}
    try:
        for e in json.loads(run(["ip", "-j", "neigh"], 5) or "[]"):
            if e.get("lladdr") and ":" not in e.get("dst", ""):
                out[e["dst"]] = e["lladdr"].lower()
    except ValueError:
        pass
    return out


def gateway():
    try:
        for r in json.loads(run(["ip", "-j", "route", "show", "default"], 5) or "[]"):
            if r.get("gateway"):
                return r["gateway"]
    except ValueError:
        pass
    return None


def unescape(txt):
    return re.sub(r"\\(\d{3})", lambda m: chr(int(m.group(1))), txt).replace("\\.", ".")


def mdns():
    """What devices announce about themselves: address -> { host, services, txt }."""
    found = {}
    for line in run(["avahi-browse", "-atrpk"], 20).splitlines():
        p = line.split(";")
        if len(p) < 10 or p[0] != "=" or p[2] != "IPv4":
            continue
        d = found.setdefault(p[7], {"host": None, "label": None, "services": set(), "txt": {}})
        d["host"] = d["host"] or unescape(p[6]).removesuffix(".local")
        d["services"].add(p[4])
        # the name a device shows to people, e.g. "Brother MFC-9142CDN" or a name its owner gave it
        if not d["label"] and any(t in p[4] for t in ("_shelly", "_airplay", "_ipp", "_printer", "_googlecast", "_esphomelib", "_hap")):
            d["label"] = unescape(p[3])
        for kv in re.findall(r'"([^"]*)"', p[9]):
            k, _, v = kv.partition("=")
            if k and v and len(v) < 80:
                d["txt"].setdefault(k.lower(), unescape(v))
    return found


def describe(ip, mac, name, source, md, oui):
    vendor, private = None, False
    if mac:
        private = mac[1] in "26ae"                  # locally administered: a randomised "private" address
        vendor = None if private else oui.get(mac.replace(":", "")[:6].upper())
    txt = (md or {}).get("txt", {})
    services = sorted((md or {}).get("services", ()))
    model = next((txt[k] for k in ("md", "model", "am", "ty", "product", "app", "board", "mdl") if txt.get(k)), None)
    firmware = next((txt[k] for k in ("version", "ver", "fv", "sw", "fw", "firmware", "fw_id", "osxvers") if txt.get(k)), None)
    if firmware and "/" in firmware:
        firmware = firmware.split("/")[-1]            # Shelly: "20231107-164401/v1.14.1-..." -> the version part
    kind = None
    for needle, k in KIND_BY_SERVICE:
        if any(needle in s for s in services):
            kind = k; break
    if not kind and name:
        low = name.lower()
        kind = next((k for rx, k in KIND_BY_NAME if re.search(rx, low)), None)
    if not kind and vendor:
        low = vendor.lower()
        kind = next((k for needle, k in KIND_BY_VENDOR if needle in low), None)
    if not kind and private:
        kind = "private"
    return {"name": name, "source": source, "mac": mac, "vendor": vendor, "private": private,
            "kind": kind or "unknown", "model": model, "firmware": firmware, "services": [s.strip("_").split("._")[0] for s in services][:6]}


def discover(st, cfg=None):
    st.mine = own_addresses() | {"127.0.0.1", "::1"}
    oui = load_oui(OUI)
    names, md, last_md, macs = {}, {}, 0, {}
    while True:
        try:
            if time.time() - last_md > 600:
                last_md = time.time()
                md = mdns() or md
            gw, nb, mine = gateway(), neighbours(), own_addresses()
            macs.update(nb)                          # the kernel forgets quiet devices, we do not
            st.mine = mine | {"127.0.0.1", "::1"}
            st.macs = dict(macs)
            devices = {}
            for ip in sorted(st.clients):
                hit = names.get(ip)
                if not hit or hit[2] < time.time():
                    name = reverse_name(ip, gw) if gw else None
                    # ask again soon when the router had no answer, it may just have been slow
                    hit = (name.rstrip(".") if name else None, "router" if name else None, time.time() + (900 if name else 120))
                    names[ip] = hit
                name, source = hit[0], hit[1]
                if not name and (md.get(ip, {}).get("label") or md.get(ip, {}).get("host")):
                    name, source = md[ip].get("label") or md[ip]["host"], "mdns"
                if name and name.lower() in ("none", "localhost", "unknown", "device"):   # placeholders, not names
                    name, source = None, None
                if name:
                    name = re.sub(r"\.(localdomain|lan|local|home|fritz\.box)$", "", name, flags=re.I)
                devices[ip] = describe(ip, macs.get(ip), name, source, md.get(ip), oui)
                if ip in mine:
                    devices[ip].update(kind="self", name=socket.gethostname(), source="self")
            st.devices = devices
            if cfg:
                seen = {d["mac"] for d in devices.values() if d.get("mac")}
                with cfg.lock:
                    known = cfg.data.get("known")
                    fresh = set() if known is None else seen - set(known)   # the first round only learns
                    if known is None or fresh:
                        cfg.data["known"] = sorted(set(known or []) | seen)
                        cfg.save()
                for mac in fresh:
                    ip, d = next(((i, v) for i, v in devices.items() if v.get("mac") == mac), (None, {}))
                    what = " ".join(x for x in (d.get("name"), d.get("vendor"), ip) if x)
                    notify_bg(cfg, "newdev", "NetSluice: new device on your network", f"{what} ({mac}) used the filter for the first time.")
        except Exception as e:                      # never let discovery take the service down
            print("netsluiced: discovery failed:", e, flush=True)
        time.sleep(30)


def main():
    signal.signal(signal.SIGTERM, lambda *a: sys.exit(0))   # so the state is saved on shutdown
    db = GeoDB(DB)
    st = State()
    cfg = Settings(SETTINGS)
    leds = Leds(cfg)
    rules = Rules(RULES)
    threading.Thread(target=leds.run, daemon=True).start()
    threading.Thread(target=button, args=(cfg, leds), daemon=True).start()
    threading.Thread(target=follow, args=(db, st, cfg, leds), daemon=True).start()
    threading.Thread(target=discover, args=(st, cfg), daemon=True).start()
    threading.Thread(target=clock, args=(rules, st, cfg), daemon=True).start()
    threading.Thread(target=lookout, daemon=True).start()

    auth = Auth(AUTH)

    class Handler(BaseHTTPRequestHandler):
        def token(self):
            for part in (self.headers.get("Cookie") or "").split(";"):
                k, _, v = part.strip().partition("=")
                if k == "netsluice_session":
                    return v
            return None

        def body(self):
            try:
                n = int(self.headers.get("Content-Length") or 0)
                return json.loads(self.rfile.read(n)) if 0 < n <= 4096 else {}
            except (ValueError, OSError):
                return {}

        def reply(self, obj, status=200, cookie=None):
            body = json.dumps(obj).encode()
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Content-Length", str(len(body)))
            if cookie is not None:
                age = SESSION_DAYS * 86400 if cookie else 0
                # signed in over HTTPS, the session is never sent over plain HTTP
                secure = "; Secure" if self.headers.get("X-Forwarded-Proto") == "https" else ""
                self.send_header("Set-Cookie", f"netsluice_session={cookie}; Path=/; Max-Age={age}; HttpOnly; SameSite=Strict{secure}")
            self.end_headers()
            self.wfile.write(body)

        def do_GET(self):
            path, _, query = self.path.partition("?")
            if path == "/auth/state":
                self.reply({"configured": auth.configured, "authenticated": auth.valid(self.token())}); return
            if path == "/auth/check":
                self.send_response(204 if auth.valid(self.token()) else 401)
                self.send_header("Content-Length", "0"); self.end_headers(); return
            if path == "/api/flow":
                since = next((int(p[6:]) for p in query.split("&") if p.startswith("since=") and p[6:].isdigit()), 0)
                self.reply(st.flow_since(since)); return
            if path == "/api/devices":
                self.reply({"devices": st.devices, "blocked": st.blocked_totals()}); return
            if path == "/api/kids":
                self.reply({"rules": rules.view()}); return
            if path == "/api/settings":
                self.reply(cfg.public()); return
            if path == "/api/storage":
                self.reply(root_call("st-status")); return
            if path == "/api/storage/progress":
                try:
                    with open(os.path.join(os.path.dirname(STATE), "st-progress.json")) as f:
                        self.reply(json.load(f)); return
                except (OSError, ValueError):
                    self.reply({}); return
            if path == "/api/storage/backup/download":
                try:
                    f = open(BACKUP, "rb")
                except OSError:
                    self.send_error(404); return
                with f:
                    self.send_response(200)
                    self.send_header("Content-Type", "application/gzip")
                    self.send_header("Content-Length", str(os.fstat(f.fileno()).st_size))
                    self.send_header("Content-Disposition", 'attachment; filename="netsluice-backup-internal-storage.img.gz"')
                    self.send_header("Cache-Control", "no-store")
                    self.end_headers()
                    try:
                        shutil.copyfileobj(f, self.wfile, 1024 * 1024)
                    except OSError:
                        pass                               # the browser went away
                return
            if path == "/api/system/updates/progress":
                try:
                    with open(os.path.join(os.path.dirname(STATE), "sys-progress.json")) as f:
                        self.reply(json.load(f)); return
                except (OSError, ValueError):
                    self.reply({}); return
            if path == "/api/system/https":
                self.reply(https_status()); return
            if path == "/api/system/https/ca":
                try:
                    with open(HTTPS_CA, "rb") as f:
                        body = f.read()
                except OSError:
                    self.reply({"error": "none"}, 404); return
                self.send_response(200)
                self.send_header("Content-Type", "application/x-x509-ca-cert")
                self.send_header("Content-Disposition", 'attachment; filename="netsluice-root.crt"')
                self.send_header("Cache-Control", "no-store")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers(); self.wfile.write(body); return
            if path == "/api/system/app/hint":
                self.reply(app_hint()); return
            if path == "/api/system/app/progress":
                # straight from the files, without the helper: polled twice a second during an update
                def read(p, default):
                    try:
                        with open(p) as f:
                            return f.read()
                    except OSError:
                        return default
                try:
                    prog = json.loads(read(os.path.join(os.path.dirname(STATE), "app-progress.json"), "{}"))
                except ValueError:
                    prog = {}
                prog["version"] = read(os.environ.get("NETSLUICE_VERSION", "/usr/share/netsluice/VERSION"), "").strip() or None
                self.reply(prog); return
            if path == "/api/system":
                self.reply({"net": root_call("net-status"), "updates": root_call("upd-status", timeout=90), "app": root_call("app-status")}); return
            if path != "/api/geo":
                self.send_error(404); return
            since = 0
            for part in query.split("&"):
                if part.startswith("since="):
                    try:
                        since = int(part[6:])
                    except ValueError:
                        pass
            self.reply(st.snapshot(since))

        def do_POST(self):
            path, data = self.path.partition("?")[0], self.body()
            if path == "/auth/setup":
                pw = str(data.get("password") or "")
                if auth.configured:
                    self.reply({"error": "configured"}, 409); return
                if len(pw) < 8:
                    self.reply({"error": "short"}, 400); return
                auth.set_password(pw)
                self.reply({"ok": True}, cookie=auth.open_session()); return
            if path == "/auth/login":
                ok = auth.verify(str(data.get("password") or ""))
                if ok is None:
                    self.reply({"error": "wait"}, 429); return
                if not ok:
                    self.reply({"error": "wrong"}, 401); return
                self.reply({"ok": True}, cookie=auth.open_session()); return
            if path == "/auth/logout":
                auth.close_session(self.token())
                self.reply({"ok": True}, cookie=""); return
            if path == "/auth/password":
                if not auth.valid(self.token()):
                    self.reply({"error": "login"}, 401); return
                new = str(data.get("new") or "")
                if len(new) < 8:
                    self.reply({"error": "short"}, 400); return
                ok = auth.verify(str(data.get("old") or ""))
                if ok is None:
                    self.reply({"error": "wait"}, 429); return
                if not ok:
                    self.reply({"error": "wrong"}, 401); return
                auth.set_password(new)                 # ends every other session
                self.reply({"ok": True}, cookie=auth.open_session()); return
            if path == "/api/settings":
                cfg.update(data)
                leds.state = None; leds.flash()            # apply LED changes at once
                self.reply(cfg.public()); return
            system = {"/api/system/hostname": ("hostname", 30), "/api/system/address": ("addr-try", 60), "/api/system/address/confirm": ("addr-confirm", 60),
                      "/api/system/address/revert": ("addr-revert", 60), "/api/system/updates/check": ("upd-check", 280),
                      "/api/system/updates/auto": ("upd-auto", 320), "/api/system/updates/run": ("upd-run", 60),
                      "/api/system/app/check": ("app-check", 60), "/api/system/app/auto": ("app-auto", 30), "/api/system/app/run": ("app-run", 30),
                      "/api/storage/backup": ("st-backup", 30), "/api/storage/backup/delete": ("st-backup-delete", 30),
                      "/api/storage/install": ("st-install", 30), "/api/storage/restore": ("st-restore", 30), "/api/storage/poweroff": ("st-poweroff", 30)}
            if path == "/api/system/https":
                if https_busy.is_set():
                    self.reply({"error": "busy"}, 400); return
                https_busy.set()
                threading.Thread(target=https_switch, args=(bool(data.get("on")),), daemon=True).start()
                self.reply({"started": True}); return
            if path in system:
                cmd, wait = system[path]
                res = root_call(cmd, {k: data[k] for k in ("name", "ip", "on", "confirm", "no_backup") if k in data}, timeout=wait)
                self.reply(res, 400 if res.get("error") else 200); return
            if path == "/api/notify/test":
                why = notify(cfg, "test", "NetSluice: test message", "If you can read this, messages from your NetSluice arrive.", force=True)
                self.reply({"ok": why is None, "error": why}); return
            if path.startswith("/api/kids"):
                key = str(data.get("key") or "")
                if not re.fullmatch(r"([0-9a-f]{2}:){5}[0-9a-f]{2}|ip:\d{1,3}(\.\d{1,3}){3}", key):
                    self.reply({"error": "key"}, 400); return
                with rules.lock:
                    rule = rules.data["rules"].get(key)
                    if path == "/api/kids/remove":
                        rules.data["rules"].pop(key, None)
                    elif path == "/api/kids/extend":
                        if not rule:
                            self.reply({"error": "unknown"}, 404); return
                        minutes = max(0, min(int(data.get("minutes") or 0), 24 * 60))
                        rule["until"] = time.time() + minutes * 60 if minutes else 0
                    elif path == "/api/kids":
                        hm = lambda v, d: v if isinstance(v, str) and re.fullmatch(r"([01]\d|2[0-3]):[0-5]\d", v) else d
                        old = rule or {}
                        mode = data.get("mode") if data.get("mode") in ("on", "off", "schedule") else old.get("mode", "on")
                        days = data.get("days") if isinstance(data.get("days"), list) else old.get("days", [0, 1, 2, 3, 4, 5, 6])
                        rules.data["rules"][key] = {
                            "name": str(data.get("name") or old.get("name") or "")[:60], "mode": mode,
                            "days": sorted({int(d) for d in days if str(d).isdigit() and 0 <= int(d) <= 6}),
                            "from": hm(data.get("from"), old.get("from", "15:00")), "to": hm(data.get("to"), old.get("to", "19:00")),
                            "until": 0 if data.get("mode") else old.get("until", 0),
                        }
                    else:
                        self.send_error(404); return
                    rules.save()
                try:
                    enforce(rules, st)                 # do not wait for the clock
                except Exception:
                    pass
                self.reply({"rules": rules.view()}); return
            self.send_error(404)

        def log_message(self, *a):
            pass

    print(f"netsluiced: {len(db.cc)} address ranges loaded, listening on {LISTEN[0]}:{LISTEN[1]}", flush=True)
    try:
        ThreadingHTTPServer(LISTEN, Handler).serve_forever()
    finally:
        st.save()


if __name__ == "__main__":
    main()
