---
title: Build from source
description: Boot Armbian on the Mini, install NetSluice on it, or build the ready-made image yourself.
lang: en
section: develop
order: 50
updated: 2026-11-26
---

The other way to NetSluice: you adapt a stock Armbian image yourself and install NetSluice on it over SSH.

## Before you start

- **Your wallet.** If your device holds a wallet, make sure you have its seed phrase or keystore.
- **Check your board (optional, recommended).** `scripts/probe` builds a tiny boot script that makes the bootloader write its settings to the card. It changes nothing on the device. See [Probing a board](/en/docs/hardware/#probing-a-board).

## What you need

- A Linux computer
- A microSD card, 16 GB or more
- `python3`, `dtc`, `e2fsprogs`, `util-linux`, `xz`
- The Armbian image for the NanoPi R2S (Debian, minimal) from <https://www.armbian.com/nanopi-r2s/>
- A copy of the repository:

```bash
git clone https://github.com/Anarki-LNX/netsluice.git
cd netsluice
```

## 1. Boot Armbian from a card

```bash
scripts/build-image.sh Armbian_*_Nanopi-r2s_*_minimal.img.xz
sudo dd if=deeper-connect-mini-armbian.img of=/dev/sdX bs=4M conv=fsync status=progress
```

> **Double-check the device name.** `dd` erases whatever `/dev/sdX` is. Pick the card, not your own disk.

`build-image.sh` needs no root. It edits the image file in place and writes the corrected device tree into it.

Unplug the Mini, insert the card, connect one Ethernet port and power it up. The first boot takes two to three minutes. Log in over SSH as `root`. Armbian asks for a new password on the first login. Its default password is public, so do this right away.

## 2. Install NetSluice on it

```bash
scripts/deploy-dev.sh root@<device>                          # the interface and the service
ssh root@<device> 'sh -s' < provision/install-stack.sh       # everything they need
```

`install-stack.sh` is safe to run again. Finished steps are skipped. Without the bundle of the ready-made image it downloads AdGuard Home (checked against the project's checksums), the country database and the list of network card makers.

Open `http://<device>/`. The first visitor chooses the password. Then either enter the device's address as the DNS server in your router, or give the device the address your old filter had.

## 3. Optional: move to the internal storage

Under Settings, **Back up and install**. See [Back up and install](/en/docs/backup-and-install/).

## Building the ready-made image yourself

```bash
scripts/build-image.sh --netsluice Armbian_*_Nanopi-r2s_*_minimal.img.xz
```

With `--netsluice` the result is the ready-made image: NetSluice sets itself up on the first start, SSH is off, and the root account is locked. This needs the internet, because it collects everything the first start would otherwise download (`scripts/fetch-bundle.py`): the Debian packages of Caddy and avahi, AdGuard Home, the DB-IP country list and the IEEE list of network card makers. `SOURCES.txt` inside the bundle names the origin and checksum of every file.

The output is `netsluice-<version>-deeper-connect-mini.img`, compressed to `.img.xz`, with a `.sha256` next to it.
