# Third-party data and software

NetSluice builds on the work of others. This file lists what is shipped with it
or downloaded by it.

| What | Used for | Licence | Source |
|---|---|---|---|
| AdGuard Home | the DNS filter engine, downloaded at install time | GPL-3.0 | https://github.com/AdguardTeam/AdGuardHome |
| Caddy | web server, installed from Debian | Apache-2.0 | https://caddyserver.com |
| Armbian / Debian | base system | various, mostly GPL | https://www.armbian.com |
| IP to Country Lite by DB-IP | country of an address for the world map, downloaded at install time | CC BY 4.0 | https://db-ip.com, packaged by https://github.com/sapics/ip-location-db |
| world-atlas `countries-110m.json` | country shapes (`web/data/`) | ISC; data from Natural Earth, public domain | https://github.com/topojson/world-atlas |
| ISO 3166-1 country codes | `web/data/iso.json`, derived from the iso-codes project | facts; iso-codes is LGPL-2.1-or-later | https://salsa.debian.org/iso-codes-team/iso-codes |

Filter lists are not shipped. They are downloaded by the device from their
maintainers and keep their own licences.

## The ready-made image

The image attached to a release is an unmodified Armbian community image for
the NanoPi R2S (Debian 13 "trixie"), with the device tree below, the NetSluice
files and a first-boot script added by `scripts/build-image.sh`. Armbian and
Debian packages in it keep their own licences; their sources are available
from https://github.com/armbian/build and https://www.debian.org/distrib/packages.
The image also carries what the first start needs, collected by
`scripts/fetch-bundle.py`: the Debian packages of Caddy and avahi with their
dependencies, the AdGuard Home release for arm64 (GPL-3.0, source at
https://github.com/AdguardTeam/AdGuardHome), the DB-IP country list and the
IEEE list of network card makers. `SOURCES.txt` inside the bundle names the
origin and checksum of every file.

## The device tree

The device tree produced by `dts/patch_dts.py` is a modified copy of the Linux
kernel's `rk3328-nanopi-r2` device tree and stays under that file's licence
(GPL-2.0-or-later OR MIT).
