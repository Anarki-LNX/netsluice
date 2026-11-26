---
title: What you need
description: The device, a microSD card, a network cable, a computer to write the card, and a router whose DNS setting you can change.
lang: en
section: start
order: 11
updated: 2026-11-26
---

## For the ready-made image

- **A Deeper Connect Mini.** NetSluice was tested on one board with the marking `mini_v21_20210521`. Other revisions of the Mini are untested. The Pico, Nano and Air are different hardware and not supported.
- **A microSD card, 8 GB or more.**
- **A network cable** from the Mini to your router.
- **Any computer** to write the card, with [balenaEtcher](https://etcher.balena.io/) or the Raspberry Pi Imager.
- **A router whose DNS server you can set.** NetSluice filters the devices that ask it. The simplest way is to enter its address as the DNS server in your router.
- **Internet, later.** The setup on the first start needs none, the image brings everything along. The filter lists are downloaded as soon as the device reaches the internet.

## If you want to keep a backup on the card

Before you move NetSluice to the internal storage, the interface can write a complete copy of the internal storage (8 GB on the tested board) to the card. In the worst case the copy is as large as the storage itself. The interface checks the free space before it starts and tells you how much must be free. A larger card helps.

## Before you start

- **Your wallet.** If your device holds a wallet, make sure you have its seed phrase or keystore. Running NetSluice from the card changes nothing on the device. Installing it to the internal storage erases the original system.
- **SSH (optional).** To log in to the system underneath, you put a public key on the card. The card is ext4, so this needs a Linux computer. See [SSH access](/en/docs/ssh/).

## For building it yourself

A Linux computer, a microSD card of 16 GB or more, and `python3`, `dtc`, `e2fsprogs`, `util-linux` and `xz`. See [Build from source](/en/docs/build-from-source/).

## Warranty

There is none. You are modifying a network device at your own risk, and a filter that fails takes the name lookups of your network with it.
