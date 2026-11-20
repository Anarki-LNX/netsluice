#!/usr/bin/env bash
# Start the service on localhost with throw-away state and a tiny web server
# as message target, then check settings and message delivery.
set -u
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
T="$(mktemp -d)"; trap 'kill "$PID" "$HOOK" 2>/dev/null; rm -rf "$T"' EXIT
printf '1.0.0.0,1.0.0.255,AU\n' > "$T/db.csv"
python3 - "$T/hook.log" <<'PY' & HOOK=$!
import sys, http.server
class H(http.server.BaseHTTPRequestHandler):
    def do_POST(self):
        body = self.rfile.read(int(self.headers.get("Content-Length") or 0))
        open(sys.argv[1], "ab").write((self.headers.get("Title") or "-").encode() + b" | " + body + b"\n")
        self.send_response(200); self.send_header("Content-Length", "0"); self.end_headers()
    def log_message(self, *a): pass
http.server.HTTPServer(("127.0.0.1", 3903), H).serve_forever()
PY
NETSLUICE_STATE="$T/state/geo.json" NETSLUICE_GEODB="$T/db.csv" NETSLUICE_PORT=3902 NETSLUICE_AGH=http://127.0.0.1:9 \
  python3 "$HERE/service/netsluiced.py" > "$T/log.txt" 2>&1 & PID=$!
sleep 2
U=http://127.0.0.1:3902; J='Content-Type: application/json'
fail=0; check() { if [ "$2" = "$3" ]; then echo "ok   $1"; else echo "FAIL $1: got $2, want $3"; fail=1; fi; }
get() { curl -sS -m 5 "$U/api/settings" | python3 -c "import sys,json; d=json.load(sys.stdin); print($1)"; }
set_() { curl -sS -m 5 -o /dev/null -w '%{http_code}' -X POST -H "$J" -d "$1" "$U/api/settings"; }
check "defaults"                 "$(get 'd["led"]["mode"], d["button"], d["notify"]["kind"]')" "on True off"
check "test without target"      "$(curl -sS -m 5 -X POST "$U/api/notify/test")" '{"ok": false, "error": "off"}'
check "set night mode"           "$(set_ '{"led":{"mode":"night","night_from":"21:30","night_to":"06:15","flash":false}}')" 200
check "night mode stored"        "$(get 'd["led"]["mode"], d["led"]["night_from"], d["led"]["night_to"], d["led"]["flash"]')" "night 21:30 06:15 False"
check "bad time ignored"         "$(set_ '{"led":{"night_from":"25:99"}}'; get 'd["led"]["night_from"]')" "20021:30"
check "bad mode ignored"         "$(set_ '{"led":{"mode":"disco"}}'; get 'd["led"]["mode"]')" "200night"
check "bad address refused"      "$(set_ '{"notify":{"kind":"ntfy","url":"file:///etc/passwd"}}'; get 'd["notify"]["url"]')" "200"
check "set ntfy target"          "$(set_ '{"notify":{"kind":"ntfy","url":"http://127.0.0.1:3903/topic"}}')" 200
check "ntfy test delivered"      "$(curl -sS -m 10 -X POST "$U/api/notify/test")" '{"ok": true, "error": null}'
check "ntfy message content"     "$(grep -c 'NetSluice: test message | If you can read this' "$T/hook.log")" 1
check "set webhook target"       "$(set_ '{"notify":{"kind":"webhook","url":"http://127.0.0.1:3903/hook"}}')" 200
check "webhook test delivered"   "$(curl -sS -m 10 -X POST "$U/api/notify/test")" '{"ok": true, "error": null}'
check "webhook is JSON"          "$(tail -1 "$T/hook.log" | grep -c '"event": "test"')" 1
check "dead target reports why"  "$(set_ '{"notify":{"url":"http://127.0.0.1:9/x"}}' >/dev/null; curl -sS -m 12 -X POST "$U/api/notify/test" | grep -c '"ok": false')" 1
check "settings file mode"       "$(stat -c '%a' "$T/state/settings.json")" 600
check "survives a restart"       "$(kill "$PID"; sleep 1; NETSLUICE_STATE="$T/state/geo.json" NETSLUICE_GEODB="$T/db.csv" NETSLUICE_PORT=3902 NETSLUICE_AGH=http://127.0.0.1:9 python3 "$HERE/service/netsluiced.py" >/dev/null 2>&1 & sleep 2; get 'd["led"]["mode"], d["notify"]["kind"]'; kill $! 2>/dev/null)" "night webhook"
grep -i traceback "$T/log.txt" && fail=1
exit $fail
