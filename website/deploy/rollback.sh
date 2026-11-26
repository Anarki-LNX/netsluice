#!/usr/bin/env bash
# Switch the live website back to an earlier build that is still on the server.
#
#   website/deploy/rollback.sh --yes                 back to the build before the current one
#   website/deploy/rollback.sh --yes --to <id>       to a named build (see --status)
#   website/deploy/rollback.sh --status              list builds (read-only, no --yes needed)
#
# Same flags and NETSLUICE_DEPLOY_* variables as deploy.sh (--host, --port, --user, --dir).
# Only the owner runs this. The switch is atomic and takes effect for the next request.
set -Eeuo pipefail

here=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
HOST=${NETSLUICE_DEPLOY_HOST:-85.215.241.66}
PORT=${NETSLUICE_DEPLOY_PORT:-13377}
USER_=${NETSLUICE_DEPLOY_USER:-anarki}
DIR=${NETSLUICE_DEPLOY_DIR:-/opt/netsluice-web}
OWNER=${NETSLUICE_DEPLOY_OWNER:-netsluice-web}
URL=${NETSLUICE_DEPLOY_URL:-https://netsluice.loopout.tech}
YES=0
STATUS=0
TO=

while [[ $# -gt 0 ]]; do
  case "$1" in
    --yes) YES=1 ;;
    --status) STATUS=1 ;;
    --to) TO=${2:?}; shift ;;
    --host) HOST=${2:?}; shift ;;
    --port) PORT=${2:?}; shift ;;
    --user) USER_=${2:?}; shift ;;
    --dir) DIR=${2:?}; shift ;;
    -h|--help) sed -n '2,10p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "unknown option: $1" >&2; exit 2 ;;
  esac
  shift
done
[[ "$PORT" =~ ^[0-9]+$ && "$DIR" == /* && "$DIR" != *..* ]] || { echo "bad port or dir" >&2; exit 2; }
[[ -z "$TO" || "$TO" =~ ^[0-9A-Za-z][0-9A-Za-z._-]{0,79}$ ]] || { echo "bad build id" >&2; exit 2; }

remote() { ssh -p "$PORT" -o BatchMode=yes -o ConnectTimeout=15 "$USER_@$HOST" "sudo -n -u $(printf %q "$OWNER") bash -s -- $(printf '%q ' "$@")" < "$here/remote-switch.sh"; }

if [[ $STATUS -eq 1 ]]; then
  remote status "$DIR"
  exit 0
fi
if [[ $YES -ne 1 ]]; then
  echo "rollback.sh switches the live website at $URL to an earlier build."
  echo "Refusing to run without --yes. (--status lists the builds without changing anything.)"
  exit 2
fi
if [[ -n "$TO" ]]; then remote rollback "$DIR" "$TO"; else remote rollback "$DIR"; fi
curl -fsS --max-time 10 "$URL/build.json" && echo
