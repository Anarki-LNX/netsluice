#!/usr/bin/env bash
# Turn a stock Armbian image for the NanoPi R2S into one that boots on the
# Deeper Connect Mini. Needs no root: the image file is edited in place with debugfs.
#
#   scripts/build-image.sh Armbian_..._Nanopi-r2s_..._minimal.img[.xz] [output.img]
#
# Requires: bash, python3, dtc (device-tree-compiler), debugfs and e2fsck (e2fsprogs),
#           sfdisk (util-linux), xz.
set -euo pipefail

SRC="${1:-}"
[[ -f "$SRC" ]] || { echo "usage: $0 <armbian-nanopi-r2s-image.img[.xz]> [output.img]" >&2; exit 2; }
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="${2:-$PWD/deeper-connect-mini-armbian.img}"
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
dbgw "write $WORK/stock.dtb $RK/$DTB_NAME.armbian-original"
dbgw "rm $RK/$DTB_NAME"
dbgw "write $WORK/dcm.dtb $RK/$DTB_NAME"
dbgw "write $WORK/dcm.dtb /boot/deeper-connect-mini.dtb"
dbgw "write $HERE/rootfs/dcm-dtb-restore /usr/local/sbin/dcm-dtb-restore"
dbgw "write $HERE/rootfs/dcm-firstboot /usr/local/sbin/dcm-firstboot"
dbgw "write $HERE/rootfs/99-dcm-dtb /etc/apt/apt.conf.d/99-dcm-dtb"
dbgw "write $HERE/rootfs/dcm-firstboot.service /etc/systemd/system/dcm-firstboot.service"
dbgw "symlink /etc/systemd/system/multi-user.target.wants/dcm-firstboot.service /etc/systemd/system/dcm-firstboot.service"

echo "==> verifying"
dbg "dump $RK/$DTB_NAME $WORK/check.dtb"
cmp -s "$WORK/check.dtb" "$WORK/dcm.dtb" || { echo "device tree in the image does not match" >&2; exit 1; }
for f in /usr/local/sbin/dcm-dtb-restore /usr/local/sbin/dcm-firstboot /etc/apt/apt.conf.d/99-dcm-dtb /etc/systemd/system/dcm-firstboot.service /boot/deeper-connect-mini.dtb; do
  dbg "stat $f" | grep -q "Type: regular" || { echo "missing in image: $f" >&2; exit 1; }
done
e2fsck -fn "$FS" >/dev/null 2>&1 || { echo "filesystem check failed" >&2; exit 1; }

echo "==> done: $OUT"
echo "    write it to a microSD card, for example:"
echo "    sudo dd if=$OUT of=/dev/sdX bs=4M conv=fsync status=progress"
