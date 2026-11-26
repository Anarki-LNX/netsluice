---
title: Back up and install
description: Keep a copy of the original system, move NetSluice to the internal storage, and put the copy back if you change your mind.
lang: en
section: install
order: 22
updated: 2026-11-26
---

NetSluice runs from the microSD card. The card is slow (about 24 MB/s). The internal storage (eMMC) reads about five times faster. Under Settings, **Back up and install** moves NetSluice there in three steps.

> **Installing erases the original system.** Make the backup first, and download it to your computer.

These steps only work while NetSluice runs from the card. Only one job runs at a time, in the background, with a progress bar.

## 1. Back up the internal storage

A complete copy of the internal storage is written to the card, compressed. With it the device can be put back exactly as it was.

- The interface checks first whether the card has room. In the worst case the copy is as large as the storage. If there is no room, use a larger card, or install without a backup.
- When it is done, **download it** as well (`netsluice-backup-internal-storage.img.gz`). A card can break or be overwritten.
- The backup stays on the card. It is not copied to the internal storage.

## 2. Install on the internal storage

NetSluice is copied from the card to the internal storage, with everything you have set up. Whatever is on the internal storage now is erased.

- You confirm it once more. Without a backup it only starts if you switch on "Install without a backup".
- It takes a few minutes. The filter pauses for a few seconds near the end.
- When it is done, choose "Switch off now", pull the card out, and connect the power again. The device then starts from the internal storage, and faster.

## 3. Put the backup back

This writes the backup from the card back to the internal storage. The device is then as it was before and starts that system when you remove the card.

- The backup is checked first. If it is damaged, nothing is written.
- It only goes back to a storage of the same size it was made from.
- After writing, everything is read back and compared with the backup.

Once NetSluice is installed on the internal storage, it starts from there. To go back to the original system, start the device from a NetSluice card that holds your backup, and put the backup back from there.

## The bootloader is never written

The vendor bootloader lives in the first 16 MiB of the internal storage, sectors 64 to 32767. It is the one thing that makes this device hard to recover if it breaks.

- The installation never writes there. It compares that area before and after and refuses to finish if it changed.
- Putting a backup back leaves that area alone too. It first checks that the bootloader on the device is the one in the backup, and writes nothing if not.

## By hand

On a device that runs from the card, as root:

```bash
CONFIRM=erase-emmc bash /usr/share/netsluice/service/netsluice-install.sh
```

This does step 2 only. It makes no backup.
