#!/usr/bin/env bash
# The configuration of the web server exists twice: install-stack.sh writes it on a
# new device, netsluice-root.py writes it when HTTPS is switched. Without HTTPS both
# must be the same text, or switching HTTPS off would change a device.
set -u
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
python3 - "$HERE" <<'PY'
import importlib.util, re, sys
here = sys.argv[1]
spec = importlib.util.spec_from_file_location("helper", here + "/service/netsluice-root.py")
helper = importlib.util.module_from_spec(spec); spec.loader.exec_module(helper)
stock = re.search(r"cat > /etc/caddy/Caddyfile <<'CADDY'\n(.*?\n)CADDY\n", open(here + "/provision/install-stack.sh").read(), re.S).group(1)
bad = 0
def check(name, ok):
    global bad
    print(("ok   " if ok else "FAIL ") + name); bad += not ok
check("plain configuration equals install-stack.sh", helper.caddyfile(False) == stock)
on = helper.caddyfile(True)
check("with HTTPS: both ports, own certificate, no redirect", ":80, :443 {" in on and "tls internal" in on and "auto_https disable_redirects" in on)
check("with HTTPS: same routes", stock.split(":80 {\n", 1)[1] in on)
sys.exit(1 if bad else 0)
PY
