---
title: Install with the ready-made image
description: Ten steps from download to a filtered home network. No soldering, no opening the case.
lang: en
section: install
order: 20
updated: 2026-11-26
---

This is the easy way. You write an image to a microSD card, put the card into the Mini, and NetSluice sets itself up. Nothing on the device is changed. Remove the card and the original system starts again, wallet included.

> **Before you start:** if your device holds a wallet, make sure you have its seed phrase or keystore.

## The ten steps

1. **Download the image.** Get the newest `netsluice-<version>-deeper-connect-mini.img.xz` and the `.sha256` file next to it from the [downloads page](/en/downloads/) or the [releases on GitHub](https://github.com/Anarki-LNX/netsluice/releases). Not every release brings an image. Small releases reach a running device as an update.

2. **Check the download.** In the folder with both files:

   ```bash
   sha256sum -c netsluice-*.img.xz.sha256
   ```

   It must say `OK`. On macOS and Windows see [Releases and checksums](/en/docs/releases-and-checksums/). There are checksums, no signatures.

3. **Write it to the card** with [balenaEtcher](https://etcher.balena.io/) or the Raspberry Pi Imager ("Use custom"). Both take the `.xz` file as it is.

4. **Optional: SSH.** If you want to log in to the system underneath, put your public key on the card now. See [SSH access](/en/docs/ssh/). Without it, SSH stays off.

5. **Unplug the Mini and insert the card.**

6. **Connect one Ethernet port to your router and power the Mini up.**

7. **Wait for the green LED.** It blinks while NetSluice sets itself up. This takes a few minutes and needs no internet: the image brings everything along. When the green LED is steady, it is ready. While it works, the device shows a page with the current step at the same address as the interface later.

8. **Open the interface** at **`http://netsluice.local/`**, or at the address your router shows for the device "netsluice".

9. **Choose the password right away.** The first visitor chooses it, so do this before anyone else can. Use 8 characters or more. There is no reset by e-mail.

10. **Make the filter your network's DNS server.** Enter the device's address as the DNS server in your router. From then on every device at home is filtered. The filter lists are downloaded as soon as the device reaches the internet. Until then nothing is stopped.

## What the LEDs say during the setup

| LED | Meaning |
|---|---|
| Green blinking | NetSluice is setting itself up |
| Green steady | Ready |
| Red steady | A step failed. It is tried again every minute. The page on the device says what is wrong. |

In normal use, the green LED blinks while the device runs, and the red LED flashes for every stopped request. Both can be changed under Settings, Button and LEDs.

## Good to know

- **Nothing on the device is changed.** NetSluice runs from the card. When you are sure, Settings → "Back up and install" keeps a copy of the original system and moves NetSluice to the internal storage. See [Back up and install](/en/docs/backup-and-install/).
- **There is no login to the system underneath.** SSH is off and the system account is locked, unless you put a key on the card.
- **Updates** arrive through the interface, under Settings → Updates. See [Updates](/en/docs/updates/).
- **Tip:** the device gets its address from your router. Many routers can reserve an address for a device, so that it keeps the same one. Changing the fixed address from the NetSluice interface is not implemented yet.

## If something does not work

See [Troubleshooting and recovery](/en/docs/troubleshooting/).
