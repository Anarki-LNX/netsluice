#!/usr/bin/env bash
# Turn a stock Armbian image for the NanoPi R2S into one that boots on the
# Deeper Connect Mini. Needs no root: the image file is edited in place with debugfs.
#
#   scripts/build-image.sh [--netsluice] Armbian_..._Nanopi-r2s_..._minimal.img[.xz] [output.img]
#
# Without --netsluice the result is plain Armbian for this board: you log in over
# SSH and install NetSluice yourself. With it the result is the ready-made image:
# NetSluice sets itself up on the first start, SSH is off, and the output is also
# compressed to <output>.xz with a .sha256 next to it.
#
# Requires: bash, python3, dtc (device-tree-compiler), debugfs and e2fsck (e2fsprogs),
#           sfdisk (util-linux), xz. With --netsluice also the internet, for the bundle.
set -euo pipefail

FULL=0
if [[ "${1:-}" == "--netsluice" ]]; then FULL=1; shift; fi
SRC="${1:-}"
[[ -f "$SRC" ]] || { echo "usage: $0 [--netsluice] <armbian-nanopi-r2s-image.img[.xz]> [output.img]" >&2; exit 2; }
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION="$(tr -d '[:space:]' < "$HERE/VERSION")"
if [[ $FULL == 1 ]]; then OUT="${2:-$PWD/netsluice-$VERSION-deeper-connect-mini.img}"; else OUT="${2:-$PWD/deeper-connect-mini-armbian.img}"; fi
DTB_NAME=rk3328-nanopi-r2-rev00.dtb

for tool in python3 dtc debugfs e2fsck sfdisk xz; do
  command -v "$tool" >/dev/null || { echo "missing tool: $tool" >&2; exit 1; }
done

WORK="$(mktemp -d)"; trap 'rm -rf "$WORK"' EXIT

echo "==> copying image to $OUT"
case "$SRC" in
  *.xz) xz -dc "$SRC" > "$OUT" ;;
  *)    cp --reflink=auto "$SRC" "$OUT" ;;
esac

# First partition of the image holds the whole system, /boot included.
START="$(sfdisk -d "$OUT" | awk -F'[=,]' '/start=/ {gsub(/ /,"",$2); print $2; exit}')"
[[ "$START" =~ ^[0-9]+$ ]] || { echo "could not read the partition table of $OUT" >&2; exit 1; }
FS="$OUT?offset=$((START * 512))"
dbg()  { debugfs -R "$1" "$FS" 2>/dev/null; }
dbgw() { debugfs -w -R "$1" "$FS" >/dev/null 2>&1; }
# debugfs keeps the owner of the file it copies, which is whoever builds the image.
# Everything in the image belongs to root.
put()  { dbgw "rm $2"; dbgw "write $1 $2"; dbgw "sif $2 uid 0"; dbgw "sif $2 gid 0"; dbgw "sif $2 mode ${3:-0100644}"; }
mkd()  { dbg "stat $1" | grep -q "Type: directory" || { dbgw "mkdir $1"; dbgw "sif $1 uid 0"; dbgw "sif $1 gid 0"; dbgw "sif $1 mode 040755"; }; }
enable() { dbgw "symlink /etc/systemd/system/multi-user.target.wants/$1 /etc/systemd/system/$1"; }

echo "==> checking that this is a NanoPi R2S image"
dbg "cat /boot/armbianEnv.txt" | grep -q "^fdtfile=rockchip/$DTB_NAME\$" \
  || { echo "armbianEnv.txt does not use rockchip/$DTB_NAME - wrong image?" >&2; exit 1; }
DTBDIR="$(dbg "ls -p /boot" | awk -F/ '$6 ~ /^dtb-/ {print $6; exit}')"
[[ -n "$DTBDIR" ]] || { echo "no /boot/dtb-* directory found in the image" >&2; exit 1; }
RK="/boot/$DTBDIR/rockchip"

echo "==> patching the device tree ($RK/$DTB_NAME)"
dbg "dump $RK/$DTB_NAME $WORK/stock.dtb"
[[ -s "$WORK/stock.dtb" ]] || { echo "could not read $DTB_NAME from the image" >&2; exit 1; }
dtc -I dtb -O dts -q -o "$WORK/stock.dts" "$WORK/stock.dtb"
python3 "$HERE/dts/patch_dts.py" "$WORK/stock.dts" "$WORK/dcm.dts"
dtc -I dts -O dtb -q -o "$WORK/dcm.dtb" "$WORK/dcm.dts"
chmod 644 "$WORK/stock.dtb" "$WORK/dcm.dtb"

echo "==> writing files into the image"
put "$WORK/stock.dtb" "$RK/$DTB_NAME.armbian-original"
put "$WORK/dcm.dtb" "$RK/$DTB_NAME"
put "$WORK/dcm.dtb" /boot/deeper-connect-mini.dtb
put "$HERE/rootfs/dcm-dtb-restore" /usr/local/sbin/dcm-dtb-restore 0100755
put "$HERE/rootfs/dcm-firstboot" /usr/local/sbin/dcm-firstboot 0100755
put "$HERE/rootfs/99-dcm-dtb" /etc/apt/apt.conf.d/99-dcm-dtb
put "$HERE/rootfs/dcm-firstboot.service" /etc/systemd/system/dcm-firstboot.service
enable dcm-firstboot.service
CHECK=(/usr/local/sbin/dcm-dtb-restore /usr/local/sbin/dcm-firstboot /etc/apt/apt.conf.d/99-dcm-dtb /etc/systemd/system/dcm-firstboot.service /boot/deeper-connect-mini.dtb)

if [[ $FULL == 1 ]]; then
  echo "==> adding NetSluice $VERSION and its first-boot setup"
  # what a device runs: the same package a release carries
  tar -C "$HERE" --owner=0 --group=0 --numeric-owner --mode='u+rwX,go+rX,go-w' --transform "s,^,netsluice-$VERSION/," \
      --exclude=__pycache__ -czf "$WORK/netsluice.tar.gz" VERSION web service
  printf 'PasswordAuthentication no\nKbdInteractiveAuthentication no\nPermitRootLogin prohibit-password\n' > "$WORK/sshd.conf"
  mkd /usr/share/netsluice; mkd /usr/share/netsluice/setup; mkd /etc/ssh/sshd_config.d
  # everything the first start would otherwise download, so that it needs no internet
  echo "==> collecting the bundle (Debian packages, AdGuard Home, data files)"
  BUNDLE="$(dirname "$OUT")/bundle"
  dbg "cat /var/lib/dpkg/status" > "$WORK/status"
  python3 "$HERE/scripts/fetch-bundle.py" "$WORK/status" "$BUNDLE"
  tar -C "$BUNDLE" --owner=0 --group=0 --numeric-owner --mode='u+rwX,go+rX,go-w' -cf "$WORK/bundle.tar" .
  put "$WORK/bundle.tar" /usr/share/netsluice/setup/bundle.tar
  put "$WORK/netsluice.tar.gz" /usr/share/netsluice/setup/netsluice.tar.gz
  put "$HERE/provision/install-stack.sh" /usr/share/netsluice/setup/install-stack.sh 0100755
  put "$HERE/rootfs/netsluice-firstboot" /usr/local/sbin/netsluice-firstboot 0100755
  put "$HERE/rootfs/setup-page.html" /usr/share/netsluice/setup/setup-page.html
  put "$HERE/rootfs/netsluice-firstboot.service" /etc/systemd/system/netsluice-firstboot.service
  put "$HERE/rootfs/netsluice-lists" /usr/local/sbin/netsluice-lists 0100755
  put "$HERE/rootfs/netsluice-lists.service" /etc/systemd/system/netsluice-lists.service
  put "$HERE/rootfs/netsluice-sshkey" /usr/local/sbin/netsluice-sshkey 0100755
  put "$HERE/rootfs/netsluice-sshkey.service" /etc/systemd/system/netsluice-sshkey.service
  # Armbian's default password is public: no password logins, and SSH stays off
  # until the owner puts a key on the card (see rootfs/netsluice-sshkey).
  put "$WORK/sshd.conf" /etc/ssh/sshd_config.d/10-netsluice.conf
  dbgw "rm /etc/systemd/system/multi-user.target.wants/ssh.service"
  # Armbian logs root in on every console without a password until its first-login
  # wizard has run. An appliance has no wizard: no automatic login, and no password
  # that opens the account. This is done here and not on the device, because changing
  # the consoles while somebody is logged in on them made the service manager hang.
  dbgw "rm /etc/systemd/system/getty@.service.d/override.conf"
  dbgw "rm /etc/systemd/system/serial-getty@.service.d/override.conf"
  dbgw "rm /root/.not_logged_in_yet"
  dbg "cat /etc/shadow" > "$WORK/shadow"
  grep -q '^root:' "$WORK/shadow" || { echo "no root entry in /etc/shadow of the image" >&2; exit 1; }
  sed -i -E 's/^root:[^:]*:/root:!:/' "$WORK/shadow"
  put "$WORK/shadow" /etc/shadow 0100640; dbgw "sif /etc/shadow gid 42"
  enable netsluice-firstboot.service; enable netsluice-sshkey.service; enable netsluice-lists.service
  CHECK+=(/usr/share/netsluice/setup/bundle.tar /usr/local/sbin/netsluice-lists /etc/systemd/system/netsluice-lists.service /usr/share/netsluice/setup/setup-page.html /usr/share/netsluice/setup/netsluice.tar.gz /usr/share/netsluice/setup/install-stack.sh /usr/local/sbin/netsluice-firstboot
          /etc/systemd/system/netsluice-firstboot.service /usr/local/sbin/netsluice-sshkey /etc/systemd/system/netsluice-sshkey.service /etc/ssh/sshd_config.d/10-netsluice.conf)
fi

echo "==> verifying"
dbg "dump $RK/$DTB_NAME $WORK/check.dtb"
cmp -s "$WORK/check.dtb" "$WORK/dcm.dtb" || { echo "device tree in the image does not match" >&2; exit 1; }
for f in "${CHECK[@]}"; do
  st="$(dbg "stat $f")"
  grep -q "Type: regular" <<<"$st" || { echo "missing in image: $f" >&2; exit 1; }
  grep -Eq "User: +0 +Group: +0" <<<"$st" || { echo "not owned by root in image: $f" >&2; exit 1; }
done
if [[ $FULL == 1 ]]; then
  dbg "stat /etc/systemd/system/multi-user.target.wants/ssh.service" | grep -q "Type:" && { echo "SSH is still enabled in the image" >&2; exit 1; }
  for f in /root/.not_logged_in_yet /etc/systemd/system/getty@.service.d/override.conf /etc/systemd/system/serial-getty@.service.d/override.conf; do
    dbg "stat $f" | grep -q "Type:" && { echo "still in the image: $f" >&2; exit 1; }
  done
  dbg "cat /etc/shadow" | grep -q '^root:!:' || { echo "the root account is not locked in the image" >&2; exit 1; }
  dbg "stat /etc/shadow" | grep -Eq "User: +0 +Group: +42" || { echo "/etc/shadow has the wrong owner in the image" >&2; exit 1; }
  dbg "dump /usr/share/netsluice/setup/netsluice.tar.gz $WORK/check.tar.gz"
  cmp -s "$WORK/check.tar.gz" "$WORK/netsluice.tar.gz" || { echo "the NetSluice package in the image does not match" >&2; exit 1; }
  dbg "dump /usr/share/netsluice/setup/bundle.tar $WORK/check.tar"
  cmp -s "$WORK/check.tar" "$WORK/bundle.tar" || { echo "the bundle in the image does not match" >&2; exit 1; }
fi
e2fsck -fn "$FS" >/dev/null 2>&1 || { echo "filesystem check failed" >&2; exit 1; }

if [[ $FULL == 1 && -z "${NETSLUICE_NO_XZ:-}" ]]; then
  echo "==> compressing (this takes a few minutes)"
  xz -T0 -6 -k -f "$OUT"
  ( cd "$(dirname "$OUT")" && sha256sum "$(basename "$OUT").xz" > "$(basename "$OUT").xz.sha256" )
  echo "==> done: $OUT.xz"
else
  echo "==> done: $OUT"
fi
echo "    write it to a microSD card, for example:"
echo "    sudo dd if=$OUT of=/dev/sdX bs=4M conv=fsync status=progress"
