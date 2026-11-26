---
title: Licence
description: NetSluice is under the MIT licence. What it builds on keeps its own licences.
lang: en
updated: 2026-11-26
---

## NetSluice

The code and documentation of NetSluice are under the **MIT licence**. In short: you may use, copy, change, publish and sell it, as long as the copyright notice and the licence text stay with it. There is no warranty.

```
MIT License

Copyright (c) 2026 The NetSluice contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

The licence file is in the [repository](https://github.com/Anarki-LNX/netsluice/blob/main/LICENSE).

## What NetSluice builds on

From [`THIRD-PARTY.md`](https://github.com/Anarki-LNX/netsluice/blob/main/THIRD-PARTY.md):

| What | Used for | Licence | Source |
|---|---|---|---|
| AdGuard Home | the DNS filter engine, downloaded at install time | GPL-3.0 | <https://github.com/AdguardTeam/AdGuardHome> |
| Caddy | web server, installed from Debian | Apache-2.0 | <https://caddyserver.com> |
| Armbian / Debian | base system | various, mostly GPL | <https://www.armbian.com> |
| IP to Country Lite by DB-IP | country of an address for the world map, downloaded at install time | CC BY 4.0 | <https://db-ip.com>, packaged by <https://github.com/sapics/ip-location-db> |
| world-atlas `countries-110m.json` | country shapes (`web/data/`) | ISC. Data from Natural Earth, public domain | <https://github.com/topojson/world-atlas> |
| ISO 3166-1 country codes | `web/data/iso.json`, derived from the iso-codes project | facts. Iso-codes is LGPL-2.1-or-later | <https://salsa.debian.org/iso-codes-team/iso-codes> |
| Feather icons, `settings` | the gear in the top bar (`web/index.html`) | MIT | <https://github.com/feathericons/feather> |

**Filter lists** are not shipped. The device downloads them from their maintainers, and they keep their own licences.

## The ready-made image

The image attached to a release is an unmodified Armbian community image for the NanoPi R2S (Debian 13 "trixie"), with the device tree below, the NetSluice files and a first-boot script added. Armbian and Debian packages in it keep their own licences. Their sources are available from <https://github.com/armbian/build> and <https://www.debian.org/distrib/packages>.

The image also carries what the first start needs: the Debian packages of Caddy and avahi with their dependencies, the AdGuard Home release for arm64 (GPL-3.0, source at <https://github.com/AdguardTeam/AdGuardHome>), the DB-IP country list and the IEEE list of network card makers. `SOURCES.txt` inside the bundle names the origin and checksum of every file.

## The device tree

The device tree produced by `dts/patch_dts.py` is a modified copy of the Linux kernel's `rk3328-nanopi-r2` device tree and stays under that file's licence (GPL-2.0-or-later OR MIT).

## This website

The website's code is part of the same repository, in the folder `website/`, under the same MIT licence. It uses these fonts, served from this site:

| Font | Licence |
|---|---|
| Instrument Serif | SIL Open Font License 1.1 |
| Geist and Geist Mono | SIL Open Font License 1.1 |

The screenshots show the NetSluice demo with invented data.
