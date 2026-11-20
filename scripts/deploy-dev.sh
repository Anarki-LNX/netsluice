#!/usr/bin/env bash
# Copy the web interface from web/ to a NetSluice device for development.
#   scripts/deploy-dev.sh root@<device> [ssh options...]
set -euo pipefail
HOST="${1:-}"; shift || true
[[ -n "$HOST" ]] || { echo "usage: $0 root@<device> [ssh options...]" >&2; exit 2; }
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
tar -C "$HERE/web" -cf - . | ssh "$@" "$HOST" 'mkdir -p /srv/netsluice/www.new && tar -C /srv/netsluice/www.new -xf - && chmod -R a+rX /srv/netsluice/www.new && rm -rf /srv/netsluice/www.old && { [ ! -d /srv/netsluice/www ] || mv /srv/netsluice/www /srv/netsluice/www.old; } && mv /srv/netsluice/www.new /srv/netsluice/www && rm -rf /srv/netsluice/www.old && echo "deployed: $(ls /srv/netsluice/www | tr "\n" " ")"'
if [[ -d "$HERE/service" ]]; then
  # restart the service only when its files really changed
  tar -C "$HERE/service" -cf - . | ssh "$@" "$HOST" 'D=/usr/share/netsluice/service; mkdir -p $D; before=$(cat $D/* 2>/dev/null | sha256sum); tar -C $D -xf - && chmod -R a+rX $D; after=$(cat $D/* 2>/dev/null | sha256sum); if [ "$before" != "$after" ] && systemctl cat netsluiced >/dev/null 2>&1; then systemctl restart netsluiced; echo "service updated and restarted"; else echo "service unchanged"; fi'
fi
