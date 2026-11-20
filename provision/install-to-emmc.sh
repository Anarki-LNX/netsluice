#!/bin/bash
# NetSluice: copy the running system from the microSD card to the internal eMMC.
#
# The vendor bootloader lives in the first 16 MiB of the eMMC, before the first
# partition. This script never writes there: it only replaces the partition
# table entry and creates one file system starting at sector 32768.
#
# Everything else on the eMMC (the original vendor system) is destroyed.
# Back it up first.  Usage, as root on the device:  CONFIRM=erase-emmc install-to-emmc.sh
set -euo pipefail

SD=/dev/mmcblk1; EMMC=/dev/mmcblk0; PART=${EMMC}p1; START=32768; MNT=/mnt/netsluice-emmc
[[ "${CONFIRM:-}" == "erase-emmc" ]] || { echo "refusing: set CONFIRM=erase-emmc" >&2; exit 2; }
[[ $EUID -eq 0 ]] || { echo "run as root" >&2; exit 1; }
ROOTDEV="$(findmnt -no SOURCE /)"
[[ "$ROOTDEV" == ${SD}p* ]] || { echo "refusing: the system must be running from the microSD card (root is $ROOTDEV)" >&2; exit 1; }
[[ -b "$EMMC" ]] || { echo "no eMMC found" >&2; exit 1; }
if grep -q "^$EMMC" /proc/mounts; then echo "refusing: part of the eMMC is mounted" >&2; exit 1; fi

echo "==> saving the bootloader area for comparison afterwards"
BEFORE="$(dd if=$EMMC bs=512 skip=64 count=$((START-64)) status=none | sha256sum | cut -d' ' -f1)"

echo "==> new partition table: one partition from sector $START to the end"
wipefs -q -a ${EMMC}p* 2>/dev/null || true
printf 'label: dos\nstart=%s, type=83, bootable\n' "$START" | sfdisk --quiet --no-reread "$EMMC"
partprobe "$EMMC"; udevadm settle
[[ "$(cat /sys/class/block/$(basename $PART)/start)" == "$START" ]] || { echo "partition does not start at $START" >&2; exit 1; }

echo "==> creating the file system"
# Same feature set as the card, which this bootloader is known to read.
mkfs.ext4 -q -F -L netsluice_root -O '^orphan_file' "$PART"
want="$(tune2fs -l ${ROOTDEV} | sed -n 's/^Filesystem features: *//p' | tr ' ' '\n' | grep -v needs_recovery | sort)"
have="$(tune2fs -l ${PART} | sed -n 's/^Filesystem features: *//p' | tr ' ' '\n' | grep -v needs_recovery | sort)"
extra="$(comm -13 <(echo "$want") <(echo "$have") | tr '\n' ' ')"
[[ -z "${extra// }" ]] || { echo "new file system has features the card does not: $extra" >&2; exit 1; }

echo "==> copying the system"
mkdir -p "$MNT"; mount "$PART" "$MNT"
systemctl stop AdGuardHome 2>/dev/null || true
rsync -aHAXx --numeric-ids --exclude='/root/atomos-backup' --exclude='/root/dcmtest' --exclude="$MNT" / "$MNT/"
systemctl start AdGuardHome 2>/dev/null || true

echo "==> pointing the copy at its own file system"
OLD="$(blkid -s UUID -o value "$ROOTDEV")"; NEW="$(blkid -s UUID -o value "$PART")"
sed -i "s/$OLD/$NEW/g" "$MNT/etc/fstab" "$MNT/boot/armbianEnv.txt"
grep -q "UUID=$NEW" "$MNT/etc/fstab" && grep -q "rootdev=UUID=$NEW" "$MNT/boot/armbianEnv.txt" || { echo "could not update fstab/armbianEnv.txt" >&2; exit 1; }
[[ -s "$MNT/boot/boot.scr" && -e "$MNT/boot/Image" && -e "$MNT/boot/uInitrd" ]] || { echo "boot files missing on the eMMC" >&2; exit 1; }
sync; umount "$MNT"; rmdir "$MNT"
e2fsck -fn "$PART" >/dev/null || { echo "file system check failed" >&2; exit 1; }

AFTER="$(dd if=$EMMC bs=512 skip=64 count=$((START-64)) status=none | sha256sum | cut -d' ' -f1)"
[[ "$BEFORE" == "$AFTER" ]] || { echo "BOOTLOADER AREA CHANGED - do not reboot, investigate" >&2; exit 1; }
echo "==> bootloader area unchanged ($AFTER)"
echo "==> installed. New root UUID: $NEW"
