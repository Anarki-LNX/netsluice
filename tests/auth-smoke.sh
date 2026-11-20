#!/usr/bin/env bash
# Start the service on localhost with throw-away state and walk through the
# whole login life cycle. Uses random passwords and prints only status codes.
set -u
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
T="$(mktemp -d)"; trap 'kill "$PID" 2>/dev/null; rm -rf "$T"' EXIT
printf '1.0.0.0,1.0.0.255,AU\n' > "$T/db.csv"
NETSLUICE_STATE="$T/state/geo.json" NETSLUICE_GEODB="$T/db.csv" NETSLUICE_PORT=3902 NETSLUICE_AGH=http://127.0.0.1:9 \
  python3 "$HERE/service/netsluiced.py" > "$T/log.txt" 2>&1 & PID=$!
sleep 2
U=http://127.0.0.1:3902; J='Content-Type: application/json'
PW1="$(openssl rand -hex 9)"; PW2="$(openssl rand -hex 9)"
code() { curl -sS -m 5 -o /dev/null -w '%{http_code}' "$@"; }
fail=0; check() { if [ "$2" = "$3" ]; then echo "ok   $1 ($2)"; else echo "FAIL $1: got $2, want $3"; fail=1; fi; }
check "fresh state"            "$(curl -sS -m 5 $U/auth/state)" '{"configured": false, "authenticated": false}'
check "check without session"  "$(code $U/auth/check)" 401
check "password too short"     "$(code -X POST -H "$J" -d '{"password":"short"}' $U/auth/setup)" 400
check "setup"                  "$(code -c "$T/a" -X POST -H "$J" -d "{\"password\":\"$PW1\"}" $U/auth/setup)" 200
check "check with session"     "$(code -b "$T/a" $U/auth/check)" 204
check "second setup refused"   "$(code -X POST -H "$J" -d "{\"password\":\"$PW2\"}" $U/auth/setup)" 409
check "wrong password"         "$(code -X POST -H "$J" -d '{"password":"wrongwrong"}' $U/auth/login)" 401
check "right password"         "$(code -c "$T/b" -X POST -H "$J" -d "{\"password\":\"$PW1\"}" $U/auth/login)" 200
check "change password"        "$(code -b "$T/b" -c "$T/c" -X POST -H "$J" -d "{\"old\":\"$PW1\",\"new\":\"$PW2\"}" $U/auth/password)" 200
check "old session is gone"    "$(code -b "$T/a" $U/auth/check)" 401
check "new session works"      "$(code -b "$T/c" $U/auth/check)" 204
check "logout"                 "$(code -b "$T/c" -X POST $U/auth/logout)" 200
check "session after logout"   "$(code -b "$T/c" $U/auth/check)" 401
for i in 1 2 3 4; do code -X POST -H "$J" -d '{"password":"wrongwrong"}' $U/auth/login >/dev/null; done
check "locked after 5 misses"  "$(code -X POST -H "$J" -d "{\"password\":\"$PW2\"}" $U/auth/login)" 429
check "file mode"              "$(stat -c '%a' "$T/state/auth.json")" 600
check "no clear text on disk"  "$(grep -c -e "$PW1" -e "$PW2" "$T/state/auth.json")" 0
check "cookie is HttpOnly"     "$(curl -sS -m 5 -D - -o /dev/null -X POST $U/auth/logout | grep -c 'HttpOnly; SameSite=Strict')" 1
exit $fail
