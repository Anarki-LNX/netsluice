---
title: What NetSluice is
description: A second life for the Deeper Connect Mini. Plain Debian, and a network filter with its own interface on top.
lang: en
section: start
order: 10
updated: 2026-11-26
---

NetSluice gives the Deeper Connect Mini a second life. The vendor's AtomOS makes way for plain Debian, and on top of it runs a network filter with its own web interface.

A sluice is a gate that lets water through or holds it back. NetSluice does that for the traffic of a home network. It answers the DNS lookups of every device, stops the ones on your block lists, and shows you what happened.

## What it does

- **Filter** for the whole network, with the block lists known from AdGuard Home and Pi-hole. One switch per list.
- **Overview** with a live view: lookups arrive, are checked, and pass or burst.
- **Devices**, the one that is stopped most often first, with name, maker, kind and, where a device announces it, model and firmware. A click on a device opens its own page.
- **World map** of where the network talks to, coloured by traffic and by how much was stopped.
- **Children and schedules**: internet on or off per device, by hand or by time of day, with extra time at the press of a button.
- **Settings** for encrypted DNS (DoH, DNSSEC), privacy, the board's LEDs and button, messages to a phone (ntfy or webhook), appearance, export and import, name and system updates.
- **Updates of NetSluice itself** from the releases on GitHub, by hand or once a day. If the new version does not start, the old one is put back.
- **Back up and install**: keep a copy of the original system, move NetSluice to the internal storage, and put the copy back if you change your mind.
- **HTTPS** in your own network, if you switch it on.
- English and German.

## How it gets onto the device

The Mini is a close relative of the FriendlyELEC NanoPi R2S (Rockchip RK3328). The vendor bootloader looks for a boot script on the microSD card **before** it starts the internal system. So a suitable card is all it takes: no soldering, no opening the case. Remove the card and the original system starts again.

A stock NanoPi R2S image does not boot on the Mini, though. Three things differ on this board, and NetSluice corrects them. The [hardware notes](/en/docs/hardware/) explain them.

## Status: early, tested on one device

Everything was developed and tested on a single Deeper Connect Mini with the board marking `mini_v21_20210521`. It runs its owner's home network.

| | |
|---|---|
| Works | ready-made image for the microSD card, boot from microSD, backup of the internal storage, installation to it and putting the backup back (all from the interface), both Ethernet ports at 1 Gbit/s, LEDs, button, everything listed above |
| Not implemented | inline ("sluice") mode, listening mode, changing the fixed address from the interface |
| Not supported | USB-C as a data port (it still powers the device) |
| Untested | other board revisions of the Mini |
| Not supported | the other Deeper models (Pico, Nano, Air). They are different hardware |

A WireGuard tunnel, so that a phone uses the filter away from home, is an idea for later. It is not planned and not built.

## What it is made of

- **AdGuard Home** is the filter engine.
- **Caddy** serves the interface and checks the session before anything reaches the engine.
- **netsluiced** is one Python file, standard library only. It does what the engine does not: sign-in, world map, device recognition, schedules, LEDs and button, messages.
- **netsluice-root** is a small helper with root rights and a short list of allowed commands.
- **The interface** is plain HTML, CSS and JavaScript. No framework, no build step.
- **The base** is an Armbian community image for the NanoPi R2S with Debian 13 "trixie".

The [architecture page](/en/docs/architecture/) shows how they fit together.

> NetSluice is not affiliated with, endorsed by, or supported by Deeper Network. "Deeper Connect" is their trademark and is used here only to say which hardware this runs on.
