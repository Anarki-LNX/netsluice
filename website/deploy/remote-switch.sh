# Runs ON THE SERVER, sent over SSH by deploy.sh and rollback.sh (never copied there).
# Executed as the owner of the web root:  bash -s -- <command> <dir> [args]
#
#   activate <dir> <id> <keep>   .incoming-<id> → releases/<id>, point current at it, keep <keep> builds
#   rollback <dir> [<id>]        point current at <id>, or at the build before the current one
#   status   <dir>               show current, previous and the builds on disk
#
# The switch is atomic: a new symlink is renamed over "current" (rename(2)), so Caddy
# serves either the old or the new build, never a mix.
set -Eeuo pipefail
umask 022

cmd=${1:?command}; dir=${2:?dir}
[[ "$dir" == /* && "$dir" != *..* ]] || { echo "bad dir: $dir" >&2; exit 2; }
cd "$dir"
exec 9>"$dir/.lock"
flock -w 120 9 || { echo "another deploy is running" >&2; exit 3; }

valid_id() { [[ "$1" =~ ^[0-9A-Za-z][0-9A-Za-z._-]{0,79}$ ]]; }
current_id() { local t; t=$(readlink current 2>/dev/null || true); echo "${t#releases/}"; }
switch_to() {
  local id=$1
  [[ -f "releases/$id/index.html" && -f "releases/$id/build.json" ]] || { echo "releases/$id is not a complete build" >&2; exit 4; }
  local before; before=$(current_id)
  ln -sfn "releases/$id" .current.tmp
  mv -T .current.tmp current
  if [[ -n "$before" && "$before" != "$id" ]]; then printf '%s\n' "$before" > previous; fi
  echo "current → releases/$id (before: ${before:-none})"
}

case "$cmd" in
  activate)
    id=${3:?id}; keep=${4:-5}
    valid_id "$id" || { echo "bad id: $id" >&2; exit 2; }
    [[ "$keep" =~ ^[0-9]+$ && "$keep" -ge 2 ]] || keep=5
    [[ -d ".incoming-$id" ]] || { echo "nothing uploaded for $id" >&2; exit 4; }
    [[ ! -e "releases/$id" ]] || { echo "releases/$id exists already" >&2; exit 4; }
    if [[ -n "$(find ".incoming-$id" -type l -print -quit)" ]]; then echo "upload contains symlinks, refused" >&2; exit 4; fi
    chmod -R u=rwX,go=rX ".incoming-$id"
    mkdir -p releases
    mv -T ".incoming-$id" "releases/$id"
    switch_to "$id"
    # keep the newest $keep builds, and always current and previous
    cur=$(current_id); prev=$(cat previous 2>/dev/null || true)
    for old in $(ls -1 releases | sort -r | tail -n +"$((keep + 1))"); do
      if [[ "$old" == "$cur" || "$old" == "$prev" ]] || ! valid_id "$old"; then continue; fi
      rm -rf -- "releases/$old"; echo "removed releases/$old"
    done
    rm -rf -- .incoming-* 2>/dev/null || true
    ;;
  rollback)
    to=${3:-}
    if [[ -z "$to" ]]; then
      to=$(cat previous 2>/dev/null || true)
      cur=$(current_id)
      if [[ -z "$to" || ! -d "releases/$to" || "$to" == "$cur" ]]; then
        to=$(ls -1 releases | sort -r | awk -v c="$cur" 'f{print; exit} $0==c{f=1}')
      fi
    fi
    [[ -n "$to" ]] && valid_id "$to" || { echo "no earlier build to go back to" >&2; exit 4; }
    switch_to "$to"
    ;;
  status)
    echo "current:  $(current_id)"
    echo "previous: $(cat previous 2>/dev/null || echo none)"
    echo "builds:"; ls -1 releases 2>/dev/null | sort -r | sed 's/^/  /'
    ;;
  *) echo "unknown command: $cmd" >&2; exit 2 ;;
esac
