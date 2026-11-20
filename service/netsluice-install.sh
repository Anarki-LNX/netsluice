#!/bin/bash
# NetSluice: copy the running system from the microSD card to the internal storage (eMMC).
#
# The vendor bootloader lives in the first 16 MiB of the eMMC, before the first
# partition. This script never writes there: it only replaces the partition
# table entry and creates one file system starting at sector 32768. It compares
# that area before and after and fails loudly if it changed.
#
# Everything else on the eMMC is destroyed. Back it up first (Settings, "Back up
# and install", does both). Started by netsluice-root.py; by hand, as root on a
# device that runs from the card:
#     CONFIRM=erase-emmc bash /usr/share/netsluice/service/netsluice-install.sh
#
# Lines starting with PROGRESS are for the interface: a step and a percentage.
set -euo pipefail

START=32768; MNT=/mnt/netsluice-internal
say()  { echo "PROGRESS $1 $2"; }
fail() { echo "$*" >&2; exit 1; }

[[ "${CONFIRM:-}" == "erase-emmc" ]] || { echo "refusing: set CONFIRM=erase-emmc" >&2; exit 2; }
[[ $EUID -eq 0 ]] || fail "run as root"
say check 1
ROOTDEV="$(findmnt -no SOURCE /)"
ROOTDISK="/dev/$(lsblk -no PKNAME "$ROOTDEV" | head -1 | tr -d ' ')"
# NETSLUICE_INTERNAL_DISK names the target in an emulator; on the device it is found.
EMMC="${NETSLUICE_INTERNAL_DISK:-}"
if [[ -z "$EMMC" ]]; then
  for d in /sys/block/mmcblk*; do
    n="$(basename "$d")"; [[ "$n" =~ ^mmcblk[0-9]+$ ]] || continue
    [[ "$(cat "$d/device/type" 2>/dev/null)" == "MMC" ]] && EMMC="/dev/$n"
  done
fi
[[ -n "$EMMC" && -b "$EMMC" ]] || fail "no internal storage found"
[[ "$EMMC" != "$ROOTDISK" ]] || fail "refusing: the system already runs from the internal storage ($ROOTDISK)"
PART="$EMMC"; [[ "$EMMC" =~ [0-9]$ ]] && PART="${EMMC}p"; PART="${PART}1"
if grep -q "^$EMMC" /proc/mounts; then fail "refusing: part of the internal storage is mounted"; fi
SKIP="${NETSLUICE_SKIP:-/var/lib/netsluice-backup}"        # the backup stays on the card
used="$(( $( { du -sxk --exclude="$SKIP" / 2>/dev/null || true; } | cut -f1) * 1024 ))"
room="$(( $(cat "/sys/block/$(basename "$EMMC")/size") * 512 - START * 512 ))"
(( used + 256 * 1024 * 1024 <= room )) || fail "the system ($((used / 1048576)) MB) does not fit on the internal storage ($((room / 1048576)) MB)"

echo "==> remembering the bootloader area, to compare afterwards"
BEFORE="$(dd if="$EMMC" bs=512 skip=64 count=$((START-64)) status=none | sha256sum | cut -d' ' -f1)"

say partition 4
echo "==> new partition table: one partition from sector $START to the end"
for p in $(lsblk -rno PATH "$EMMC" | tail -n +2); do wipefs -q -a "$p" 2>/dev/null || true; done
printf 'label: dos\nstart=%s, type=83, bootable\n' "$START" | sfdisk --quiet --no-reread "$EMMC"
partprobe "$EMMC"; udevadm settle
[[ -b "$PART" ]] || fail "the new partition did not appear"
[[ "$(cat "/sys/class/block/$(basename "$PART")/start")" == "$START" ]] || fail "the partition does not start at $START"

say format 7
echo "==> creating the file system"
# Same feature set as the card, which this bootloader is known to read.
mkfs.ext4 -q -F -L netsluice_root -O '^orphan_file' "$PART"
want="$(tune2fs -l "$ROOTDEV" | sed -n 's/^Filesystem features: *//p' | tr ' ' '\n' | grep -v needs_recovery | sort)"
have="$(tune2fs -l "$PART" | sed -n 's/^Filesystem features: *//p' | tr ' ' '\n' | grep -v needs_recovery | sort)"
extra="$(comm -13 <(echo "$want") <(echo "$have") | tr '\n' ' ')"
[[ -z "${extra// }" ]] || fail "the new file system has features the card does not: $extra"

say copy 10
echo "==> copying the system"
mkdir -p "$MNT"; mount "$PART" "$MNT"
STOPPED=0
cleanup() {
  [[ $STOPPED == 0 ]] || systemctl start AdGuardHome 2>/dev/null || true
  mountpoint -q "$MNT" && umount "$MNT" 2>/dev/null || true
  rmdir "$MNT" 2>/dev/null || true
}
trap cleanup EXIT
# First everything while the filter keeps working; this is the long part.
set +e
rsync -aHAXx --numeric-ids --info=progress2 --no-inc-recursive \
      --exclude="$MNT" --exclude="$SKIP" --exclude='/var/lib/netsluice/st-progress.json' \
      --exclude='/var/lib/netsluice/req/*' --exclude='/var/lib/netsluice/res/*' / "$MNT/" \
  | tr '\r' '\n' | while read -r _ pct _; do
      [[ "$pct" =~ ^([0-9]+)%$ ]] && say copy $((10 + ${BASH_REMATCH[1]} * 75 / 100))
    done
rc=${PIPESTATUS[0]}
set -e
# 24: files vanished while copying, normal on a running system
[[ $rc == 0 || $rc == 24 ]] || fail "copying failed (rsync $rc)"
# Then, with the filter stopped for a moment, what it changed meanwhile.
say copy 88
if systemctl is-active -q AdGuardHome 2>/dev/null; then systemctl stop AdGuardHome; STOPPED=1; fi
if [[ -d /opt/AdGuardHome ]]; then rsync -aHAX --numeric-ids --delete /opt/AdGuardHome/ "$MNT/opt/AdGuardHome/"; fi
if [[ $STOPPED == 1 ]]; then systemctl start AdGuardHome; STOPPED=0; fi

say finish 92
echo "==> pointing the copy at its own file system"
OLD="$(blkid -s UUID -o value "$ROOTDEV")"; NEW="$(blkid -s UUID -o value "$PART")"
[[ -n "$OLD" && -n "$NEW" && "$OLD" != "$NEW" ]] || fail "could not read the file system ids"
sed -i "s/$OLD/$NEW/g" "$MNT/etc/fstab" "$MNT/boot/armbianEnv.txt"
grep -q "UUID=$NEW" "$MNT/etc/fstab" && grep -q "rootdev=UUID=$NEW" "$MNT/boot/armbianEnv.txt" || fail "could not update fstab/armbianEnv.txt"
[[ -s "$MNT/boot/boot.scr" && -e "$MNT/boot/Image" && -e "$MNT/boot/uInitrd" ]] || fail "boot files are missing on the internal storage"
sync; umount "$MNT"; rmdir "$MNT"

say verify 95
e2fsck -fn "$PART" >/dev/null || fail "the file system check failed"
AFTER="$(dd if="$EMMC" bs=512 skip=64 count=$((START-64)) status=none | sha256sum | cut -d' ' -f1)"
[[ "$BEFORE" == "$AFTER" ]] || fail "THE BOOTLOADER AREA CHANGED - do not restart, investigate"
echo "==> bootloader area unchanged ($AFTER)"
echo "==> installed. New root UUID: $NEW"
say verify 99
