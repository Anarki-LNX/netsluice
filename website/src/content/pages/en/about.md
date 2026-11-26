---
title: About NetSluice
description: Where NetSluice comes from, who makes it, and the principles it is built on.
lang: en
updated: 2026-11-26
---

## Where it comes from

The Deeper Connect Mini is a small network box with good hardware: a quad-core RK3328, 2 GB of memory, 8 GB of internal storage and two Ethernet ports. NetSluice gives it a second life as a network filter for a home, with plain Debian instead of the vendor's system.

It started with one device. Its bootloader looks for a boot script on the microSD card before it starts the internal system. A stock image for the closely related NanoPi R2S started the kernel but never came up. Three differences in the board had to be found and fixed. The [hardware notes](/en/docs/hardware/) tell that story.

The first public version, 0.1.0, came out on 20 November 2026. Version 0.1.4 brought the first ready-made image.

## Who makes it

NetSluice is a project of [LOOP OUT TECH](https://loopout.tech/projekte/netsluice). It was developed and tested on a single Deeper Connect Mini, which runs its owner's home network. The code is published on [GitHub](https://github.com/Anarki-LNX/netsluice) under the MIT licence, by "The NetSluice contributors".

## How it is built

- **Small.** The service is one Python file using only the standard library. The interface is plain HTML, CSS and JavaScript, with no framework and no build step.
- **Proven parts.** AdGuard Home does the filtering, Caddy serves the interface, Debian is the base.
- **Safe to try.** It runs from a card and leaves the device alone until you decide otherwise. The vendor bootloader is never written.
- **Honest about its state.** What works, what is not built and what is untested is written down, in the [README](https://github.com/Anarki-LNX/netsluice#status-early-tested-on-one-device) and on this site.
- **Two languages.** The interface and this site are in English and German.

## Status

Early, tested on one device. The [hardware page](/en/hardware/) lists what works, what is not built and what is untested.

## Not affiliated

NetSluice is not affiliated with, endorsed by, or supported by Deeper Network. "Deeper Connect" is their trademark and is used here only to say which hardware this runs on.
