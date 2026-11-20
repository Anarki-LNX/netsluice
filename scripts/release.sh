#!/usr/bin/env bash
# Publish a release that devices can update themselves to.
#   scripts/release.sh notes.md [--prerelease]
# Takes the version from VERSION, which must be committed and pushed. Builds
# netsluice-<version>.tar.gz with what a device replaces (VERSION, web/, service/)
# and attaches it: its size is known, so devices can show download progress.
set -euo pipefail
NOTES="${1:?usage: $0 notes.md [--prerelease]}"; shift
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$HERE"
V="$(tr -d '[:space:]' < VERSION)"
[[ "$V" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || { echo "VERSION is not x.y.z: $V" >&2; exit 1; }
[[ -z "$(git status --porcelain)" ]] || { echo "commit your changes first" >&2; exit 1; }
git fetch -q origin
[[ "$(git rev-parse HEAD)" == "$(git rev-parse '@{u}')" ]] || { echo "push first: HEAD is not on the remote" >&2; exit 1; }
OUT="$(mktemp -d)"; trap 'rm -rf "$OUT"' EXIT
git archive --format=tar.gz --prefix="netsluice-$V/" -o "$OUT/netsluice-$V.tar.gz" HEAD VERSION web service
gh release create "v$V" --target "$(git rev-parse HEAD)" --title "NetSluice $V" --notes-file "$NOTES" "$@" "$OUT/netsluice-$V.tar.gz"
