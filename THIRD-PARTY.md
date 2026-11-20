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
