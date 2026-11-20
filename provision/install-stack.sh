#!/bin/sh
# NetSluice: turn a running Armbian on the device into a NetSluice: the filter
# engine (AdGuard Home), the web server (Caddy), the NetSluice service and its
# helper, mDNS, and the data files they need. Safe to run again; finished steps
# are skipped.
# Runs as root on the device.
set -eu

AGH_VER="${AGH_VER:-v1.0.0}"
AGH_URL="https://github.com/AdguardTeam/AdGuardHome/releases/download/$AGH_VER"
# The ready-made image brings everything along (scripts/fetch-bundle.py), so that
# a first start needs no internet. Without a bundle the files are downloaded.
BUNDLE="${NETSLUICE_BUNDLE:-/usr/share/netsluice/setup/bundle}"
mkdir -p /etc/netsluice /srv/netsluice/www

echo "==> freeing port 53 (systemd-resolved stub listener off)"
mkdir -p /etc/systemd/resolved.conf.d
printf '[Resolve]\nDNSStubListener=no\n' > /etc/systemd/resolved.conf.d/netsluice.conf
ln -sf /run/systemd/resolve/resolv.conf /etc/resolv.conf
systemctl restart systemd-resolved

if [ ! -x /opt/AdGuardHome/AdGuardHome ]; then
  echo "==> installing AdGuard Home $AGH_VER"
  if [ -f "$BUNDLE/AdGuardHome_linux_arm64.tar.gz" ]; then
    tar -C /opt --warning=no-timestamp -xzf "$BUNDLE/AdGuardHome_linux_arm64.tar.gz"      # checked when the bundle was made
  else
    T="$(mktemp -d)"
    curl -fsSL -o "$T/agh.tar.gz" "$AGH_URL/AdGuardHome_linux_arm64.tar.gz"
    curl -fsSL -o "$T/checksums.txt" "$AGH_URL/checksums.txt"
    want="$(grep 'AdGuardHome_linux_arm64.tar.gz' "$T/checksums.txt" | awk '{print $1}')"
    have="$(sha256sum "$T/agh.tar.gz" | awk '{print $1}')"
    [ -n "$want" ] && [ "$want" = "$have" ] || { echo "checksum mismatch for AdGuard Home" >&2; exit 1; }
    tar -C /opt --warning=no-timestamp -xzf "$T/agh.tar.gz"
    rm -rf "$T"
  fi
  /opt/AdGuardHome/AdGuardHome -s install
fi

# The setup wizard listens on :3000; the configured interface moves to 127.0.0.1:3001.
if [ ! -f /etc/netsluice/agh-configured ]; then
  echo "==> first-time configuration of AdGuard Home"
  n=0; until curl -fsS -o /dev/null http://127.0.0.1:3000/ 2>/dev/null; do n=$((n+1)); [ $n -lt 40 ] || { echo "AdGuard Home did not start" >&2; exit 1; }; sleep 1; done
  # The wizard insists on an account. It is removed again right below.
  curl -fsS -X POST -H 'Content-Type: application/json' \
    -d "{\"web\":{\"ip\":\"127.0.0.1\",\"port\":3001},\"dns\":{\"ip\":\"0.0.0.0\",\"port\":53},\"username\":\"setup\",\"password\":\"$(openssl rand -hex 16)\"}" \
    http://127.0.0.1:3000/control/install/configure >/dev/null
  # AdGuard Home listens on localhost only, and NetSluice does the access control
  # in front of it. With an account, AdGuard Home checks a bcrypt hash on every
  # single request, which costs about 0.4 s each on this CPU.
  Y=/opt/AdGuardHome/AdGuardHome.yaml
  systemctl stop AdGuardHome
  cp -p "$Y" "$Y.tmp"
  awk 'BEGIN{skip=0} /^users:/{print "users: []"; skip=1; next} skip && /^[ ]+/{next} {skip=0; print}' "$Y.tmp" > "$Y"
  rm -f "$Y.tmp"; chmod 600 "$Y"
  systemctl start AdGuardHome
  touch /etc/netsluice/agh-configured
fi

echo "==> country database for the world map"
# IP to Country Lite by DB-IP (https://db-ip.com), CC BY 4.0, via the ip-location-db project.
GEO=/usr/share/netsluice/geo
mkdir -p "$GEO" /usr/share/netsluice/service
if [ ! -s "$GEO/dbip-country-ipv4.csv" ] && [ -s "$BUNDLE/dbip-country-ipv4.csv" ]; then
  cp "$BUNDLE/dbip-country-ipv4.csv" "$GEO/dbip-country-ipv4.csv"
fi
if [ ! -s "$GEO/dbip-country-ipv4.csv" ]; then
  curl -fsSL -o "$GEO/dbip-country-ipv4.csv.tmp" https://cdn.jsdelivr.net/npm/@ip-location-db/dbip-country/dbip-country-ipv4.csv
  mv "$GEO/dbip-country-ipv4.csv.tmp" "$GEO/dbip-country-ipv4.csv"
fi
id netsluice >/dev/null 2>&1 || useradd --system --no-create-home --home-dir /nonexistent --shell /usr/sbin/nologin netsluice
# The helper with system rights: started by systemd whenever the service leaves a request.
install -d -o netsluice -g netsluice -m 700 /var/lib/netsluice/req
install -d -o root -g root -m 755 /var/lib/netsluice/res
cat > /etc/systemd/system/netsluice-root.path <<'UNIT'
[Unit]
Description=NetSluice: requests for the helper with system rights

[Path]
PathExistsGlob=/var/lib/netsluice/req/*.json
# several requests in a row are normal, not a fault
TriggerLimitIntervalSec=0

[Install]
WantedBy=multi-user.target
UNIT
cat > /etc/systemd/system/netsluice-root.service <<'UNIT'
[Unit]
Description=NetSluice helper with system rights
ConditionPathExists=/usr/share/netsluice/service/netsluice-root.py
StartLimitIntervalSec=0

[Service]
Type=oneshot
ExecStart=/usr/bin/python3 /usr/share/netsluice/service/netsluice-root.py
UNIT
# The service may switch the two LEDs and read the button, nothing else on the board.
usermod -aG input netsluice
cat > /etc/udev/rules.d/60-netsluice-leds.rules <<'RULE'
SUBSYSTEM=="leds", KERNEL=="led_red|led_green", RUN+="/bin/sh -c 'chgrp netsluice /sys%p/brightness /sys%p/trigger && chmod g+w /sys%p/brightness /sys%p/trigger'"
RULE
udevadm control --reload && udevadm trigger --subsystem-match=leds --action=add
# left over from the bring-up of the board: it switched the red LED on at every start
systemctl disable -q --now deeper-report.service 2>/dev/null || true
# after the switch from a transient user the state directory still belongs to the old one
[ ! -d /var/lib/netsluice ] || chown -R netsluice:netsluice /var/lib/netsluice/
# Current list of network card makers from the IEEE; the Debian package is the fallback.
if [ ! -s /usr/share/netsluice/oui.csv ] && [ -s "$BUNDLE/oui.csv" ]; then
  cp "$BUNDLE/oui.csv" /usr/share/netsluice/oui.csv
fi
if [ ! -s /usr/share/netsluice/oui.csv ] || [ -n "$(find /usr/share/netsluice/oui.csv -mtime +30 2>/dev/null)" ]; then
  curl -fsSL -m 60 -o /usr/share/netsluice/oui.csv.tmp https://standards-oui.ieee.org/oui/oui.csv && mv /usr/share/netsluice/oui.csv.tmp /usr/share/netsluice/oui.csv || rm -f /usr/share/netsluice/oui.csv.tmp
fi
cat > /etc/systemd/system/netsluiced.service <<'UNIT'
[Unit]
Description=NetSluice service (access, world map, devices, schedules, board, messages)
After=network-online.target AdGuardHome.service
ConditionPathExists=/usr/share/netsluice/service/netsluiced.py

[Service]
ExecStart=/usr/bin/python3 /usr/share/netsluice/service/netsluiced.py
# A fixed account, not DynamicUser: the mDNS lookup talks to avahi over D-Bus,
# which refuses transient users.
User=netsluice
Group=netsluice
SupplementaryGroups=input
StateDirectory=netsluice
Restart=on-failure
RestartSec=5
NoNewPrivileges=yes
ProtectSystem=strict
ProtectHome=yes
PrivateTmp=yes

[Install]
WantedBy=multi-user.target
UNIT

echo "==> installing Caddy and avahi"
# ieee-data: who made a network card; avahi-utils: what devices announce about themselves
if ! dpkg -s caddy avahi-daemon avahi-utils ieee-data >/dev/null 2>&1; then
  DEBIAN_FRONTEND=noninteractive apt-get -o DPkg::Lock::Timeout=600 install -y -q caddy avahi-daemon avahi-utils ieee-data >/dev/null
fi

cat > /etc/caddy/Caddyfile <<'CADDY'
{
	admin off
}

:80 {
	encode zstd gzip

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
	}
}
CADDY
rm -rf /etc/systemd/system/caddy.service.d/netsluice.conf /etc/netsluice/agh.env
[ -f /srv/netsluice/www/index.html ] || echo '<!doctype html><title>NetSluice</title><p>NetSluice is installed. The interface has not been deployed yet.</p>' > /srv/netsluice/www/index.html
systemctl daemon-reload
# devices set up before the service was renamed
if [ -e /etc/systemd/system/netsluice-geo.service ]; then systemctl disable -q --now netsluice-geo.service 2>/dev/null || true; rm -f /etc/systemd/system/netsluice-geo.service /usr/share/netsluice/service/netsluice-geo.py; fi
systemctl enable -q caddy avahi-daemon netsluiced
systemctl reset-failed netsluice-root.service netsluice-root.path 2>/dev/null || true
systemctl enable -q netsluice-root.path && systemctl restart netsluice-root.path
# on a first start from the ready-made image a small page holds port 80 until here
[ ! -f /run/netsluice-setup/page.pid ] || kill "$(cat /run/netsluice-setup/page.pid)" 2>/dev/null || true
[ ! -f /run/netsluice-setup/page.pid ] || sleep 1
systemctl restart caddy avahi-daemon
[ ! -f /usr/share/netsluice/service/netsluiced.py ] || systemctl restart netsluiced

if [ "$(hostname)" != "netsluice" ]; then
  echo "==> setting the hostname to netsluice"
  hostnamectl set-hostname netsluice
  sed -i 's/^127\.0\.1\.1.*/127.0.1.1\tnetsluice/' /etc/hosts
  systemctl restart avahi-daemon
fi
echo "==> done"
