#!/usr/bin/env python3
"""Run the NetSluice interface on your own computer with made-up data.

    python3 scripts/demo.py            then open http://127.0.0.1:8099/

No device, no filter engine and no password needed. Everything shown is
invented: the household, its devices and where they talk to. Switches answer
but change nothing. Good for working on the interface and for screenshots.
"""
import json, os, random, sys, time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

WEB = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "web")
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8099
T0 = time.time()
TYPES = {".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml"}

DEVICES = [   # ip, name, kind, vendor, model, firmware, mac, weight
    ("192.168.0.21", "living-room-tv", "tv", "LG Electronics", "OLED55C3", "23.20.56", "02:00:5e:10:00:21", 30),
    ("192.168.0.34", "annas-laptop", "computer", "Intel Corporate", None, None, "02:00:5e:10:00:34", 24),
    ("192.168.0.40", "Pixel-8", "phone", None, None, None, "02:00:5e:10:00:40", 17),
    ("192.168.0.52", "office-printer", "printer", "Brother Industries", "MFC-L3750CDW", "1.42", "02:00:5e:10:00:52", 3),
    ("192.168.0.60", "robot-vacuum", "iot", "Espressif Inc.", None, None, "02:00:5e:10:00:60", 9),
    ("192.168.0.61", "heat-pump-sensor", "iot", "Shelly", "S1PMG4", "2.1.0", "02:00:5e:10:00:61", 5),
    ("192.168.0.70", "kitchen-speaker", "speaker", "Amazon Technologies Inc.", None, None, "02:00:5e:10:00:70", 8),
    ("192.168.0.81", "toms-tablet", "tablet", None, None, None, "02:00:5e:10:00:81", 4),
]
COUNTRIES = [("US", 38, .22), ("DE", 30, .04), ("IE", 12, .02), ("NL", 9, .03), ("KR", 6, .7), ("SG", 4, .8), ("JP", 5, .05), ("GB", 6, .1), ("BR", 2, .9), ("CA", 4, 0), ("FR", 5, .05), ("CN", 3, .6)]
BLOCKED = ["telemetry.smart-tv.example", "ads.video-network.example", "metrics.app-analytics.example", "tracker.shop-widgets.example", "logs.robot-cloud.example", "pixel.social-button.example"]
LISTS = [("AdGuard DNS filter", "https://adguardteam.github.io/HostlistsRegistry/assets/filter_1.txt", 191933),
         ("HaGeZi Pro", "https://cdn.jsdelivr.net/gh/hagezi/dns-blocklists@latest/adblock/pro.txt", 243739),
         ("HaGeZi Threat Intelligence (medium)", "https://cdn.jsdelivr.net/gh/hagezi/dns-blocklists@latest/adblock/tif.medium.txt", 384158),
         ("Smart-TV blocklist", "https://raw.githubusercontent.com/Perflyst/PiHoleBlocklist/master/SmartTV-AGH.txt", 163)]
HOURS = [30, 34, 38, 40, 46, 58, 74, 92, 100, 88, 60, 36, 18, 10, 8, 7, 9, 16, 30, 44, 40, 36, 34, 32]


def now():
    return time.time() - T0


def stats():
    q = 18400 + int(now() * 7.5); b = 3100 + int(now() * 1.4)
    tot = sum(d[7] for d in DEVICES)
    return {"time_units": "hours", "num_dns_queries": q, "num_blocked_filtering": b, "avg_processing_time": 0.012,
            "dns_queries": [h * 9 for h in HOURS], "blocked_filtering": [int(h * 9 * (.12 + (i % 5) * .02)) for i, h in enumerate(HOURS)],
            "top_clients": [{d[0]: int(q * d[7] / tot)} for d in sorted(DEVICES, key=lambda d: -d[7])],
            "top_blocked_domains": [{h: 420 - i * 55} for i, h in enumerate(BLOCKED)], "top_queried_domains": []}


def geo(since):
    seq = int(now() * 3.2)
    rnd = lambda n: random.Random(n)
    pool = [c for c in COUNTRIES for _ in range(c[1])]
    ev = []
    for n in range(max(since + 1, seq - 40), seq + 1):
        c = rnd(n).choice(pool)
        ev.append({"seq": n, "cc": c[0], "blocked": rnd(n * 7).random() < c[2], "host": "", "client": ""})
    return {"home": {"cc": "DE"}, "seq": seq, "events": ev,
            "countries": {c[0]: [int(c[1] * 40 * (1 - c[2])), int(c[1] * 40 * c[2])] for c in COUNTRIES}}


REFRESH = {"before": time.time() - 90000, "at": time.time() - 3600}   # when the lists were last refreshed
HTTPS = {"on": False, "until": 0}
OFF = {"until": 0}        # the filter switch in the top bar: off until this time


def reply_for(path, query):
    if path == "/auth/state": return {"configured": True, "authenticated": True}
    if path == "/control/stats": return stats()
    if path == "/control/status": return {"version": "v1.0.0", "dns_port": 53, "protection_enabled": time.time() >= OFF["until"], "protection_disabled_duration": int(max(0, OFF["until"] - time.time()) * 1000) if OFF["until"] < 9e12 else 0, "dns_addresses": ["192.168.0.2"], "start_time": (T0 - 86400 * 12) * 1000}
    if path == "/control/clients": return {"clients": None, "auto_clients": []}
    if path == "/control/querylog":
        t = time.time()
        # like the real log: one lookup shows up as three requests (A, AAAA, HTTPS)
        return {"data": [{"question": {"name": BLOCKED[(i + int(now() / 4)) % len(BLOCKED)], "type": kind}, "client": DEVICES[(i * 3 + int(now() / 4)) % len(DEVICES)][0],
                          "time": time.strftime("%Y-%m-%dT%H:%M:%S", time.localtime(t - i * 37)) + "+00:00"} for i in range(8) for kind in ("A", "AAAA", "HTTPS")]}
    if path == "/control/filtering/status":
        stamp = lambda i: time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(REFRESH["at"] + i * 0.8 if time.time() >= REFRESH["at"] + i * 0.8 else REFRESH["before"] + i))
        return {"enabled": True, "filters": [{"id": i + 1, "name": n, "url": u, "rules_count": r, "enabled": True, "last_updated": stamp(i)} for i, (n, u, r) in enumerate(LISTS)]}
    if path == "/control/dns_info": return {"upstream_dns": ["https://dns.quad9.net/dns-query"], "bootstrap_dns": ["9.9.9.9"], "dnssec_enabled": True}
    if path == "/control/querylog/config": return {"enabled": True, "interval": 604800000, "anonymize_client_ip": False, "ignored": [], "ignored_enabled": False}
    if path == "/api/system/https": return {"on": HTTPS["on"], "busy": time.time() < HTTPS["until"], "error": None, "ca": HTTPS["on"], "fingerprint": "A1:B2:C3:D4:E5:F6:07:18:29:3A:4B:5C:6D:7E:8F:90:A1:B2:C3:D4:E5:F6:07:18:29:3A:4B:5C:6D:7E:8F:90" if HTTPS["on"] else None}
    if path == "/api/system/app/hint": return {"version": "0.1.7", "latest": "0.1.8"}
    if path == "/api/devices": return {"devices": {d[0]: {"name": d[1], "kind": d[2], "vendor": d[3], "model": d[4], "firmware": d[5], "mac": d[6], "private": d[3] is None, "source": "router", "services": []} for d in DEVICES}, "blocked": {d[0]: (k * 137 + int(now() / 3) * (k % 3)) % 900 for k, d in enumerate(DEVICES)}}
    if path == "/api/flow":                       # who asks right now, weighted like the devices' traffic
        since = next((int(p[6:]) for p in query.split("&") if p.startswith("since=") and p[6:].isdigit()), 0)
        seq = int(now() * 3.4)
        pool = [d for d in DEVICES for _ in range(d[7])]
        ev = []
        for n in range(max(since + 1, seq - 30), seq + 1):
            r = random.Random(n); d = r.choice(pool); bad = r.random() < (.45 if d[2] in ("tv", "speaker", "iot") else .12)
            ev.append({"seq": n, "client": d[0], "blocked": bad, "host": r.choice(BLOCKED) if bad else ""})
        return {"seq": seq, "events": ev}
    if path == "/api/geo":
        since = next((int(p[6:]) for p in query.split("&") if p.startswith("since=") and p[6:].isdigit()), 0)
        return geo(since)
    if path.startswith("/api/kids"):
        hour = time.localtime().tm_hour
        return {"rules": {"02:00:5e:10:00:81": {"name": "toms-tablet", "mode": "schedule", "days": [0, 1, 2, 3, 4], "from": "15:00", "to": "19:00", "until": 0, "blocked": not 15 <= hour < 19},
                          "02:00:5e:10:00:40": {"name": "Pixel-8", "mode": "on", "days": [0, 1, 2, 3, 4, 5, 6], "from": "15:00", "to": "19:00", "until": 0, "blocked": False}}}
    if path.startswith("/api/settings") or path == "/api/notify/test":
        return {"led": {"mode": "night", "flash": True, "night_from": "22:00", "night_to": "07:00"}, "button": True,
                "notify": {"kind": "ntfy", "url": "https://ntfy.sh/your-topic", "newdev": True, "malware": True, "down": True}, "hardware": {"leds": True, "button": True}, "ok": True}
    if path.startswith("/api/storage/progress"):
        return {}
    if path.startswith("/api/storage"):
        return {"where": "card", "running": False, "job": None, "free": 52 * 2**30, "room": True, "fits": True,
                "internal": {"size": 7818182656, "holds": "original"},
                "backup": {"created": int(time.time()) - 900, "size": 7818182656, "packed": 6442450944, "holds": "original",
                           "sha256": "3f1c9a7e52b08d44aa10c7e9b6f2d8315c0e4b7a9d2f6c1e8b3a5d7f0c2e4a6b"}}
    if path.startswith("/api/system"):
        return {"net": {"hostname": "netsluice", "fixed": ["192.168.0.2/24"], "dhcp": ["192.168.0.117"], "trial": None},
                "updates": {"pending": [], "held": ["linux-image-current-rockchip64"], "auto": True, "checked": int(time.time()) - 3600, "running": False},
                "app": {"version": "0.1.1", "latest": {"tag": "v0.1.1", "version": "0.1.1"}, "checked": int(time.time()) - 600, "available": False,
                        "running": False, "auto": True, "last": {"result": "ok", "from": "0.1.0", "to": "0.1.1", "done": int(time.time()) - 86400}}}
    if path.startswith("/control/") or path.startswith("/auth/"): return {"ok": True}
    return None


class Handler(BaseHTTPRequestHandler):
    def send(self, body, ctype, status=200):
        self.send_response(status); self.send_header("Content-Type", ctype); self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body))); self.end_headers(); self.wfile.write(body)

    def do_GET(self):
        path, _, query = self.path.partition("?")
        data = reply_for(path, query)
        if data is not None:
            self.send(json.dumps(data).encode(), "application/json"); return
        rel = os.path.normpath(path.lstrip("/") or "index.html")
        full = os.path.join(WEB, rel)
        if rel.startswith("..") or not os.path.isfile(full):
            self.send(b"not found", "text/plain", 404); return
        with open(full, "rb") as f:
            self.send(f.read(), TYPES.get(os.path.splitext(full)[1], "application/octet-stream"))

    def do_POST(self):
        body = self.rfile.read(int(self.headers.get("Content-Length") or 0))
        if self.path == "/control/filtering/refresh":      # like the real filter: one list after the other
            REFRESH["before"], REFRESH["at"] = REFRESH["at"], time.time()
            time.sleep(len(LISTS) * 0.8 + 0.5)
        if self.path == "/api/system/https":
            HTTPS["on"], HTTPS["until"] = bool(json.loads(body or b"{}").get("on")), time.time() + 4
        if self.path == "/control/protection":
            d = json.loads(body or b"{}")
            if d.get("enabled") and d.get("duration"):
                self.send_response(400); self.send_header("Content-Length", "0"); self.end_headers(); return
            OFF["until"] = 0 if d.get("enabled") else (time.time() + d["duration"] / 1000 if d.get("duration") else 9e12 + 1)
        self.do_GET()

    do_PUT = do_POST

    def log_message(self, *a):
        pass


if __name__ == "__main__":
    print(f"NetSluice demo with made-up data: http://127.0.0.1:{PORT}/")
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
