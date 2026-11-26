---
title: Lizenz
description: NetSluice steht unter der MIT-Lizenz. Was es nutzt, behält seine eigenen Lizenzen.
lang: de
updated: 2026-11-26
---

## NetSluice

Code und Dokumentation von NetSluice stehen unter der **MIT-Lizenz**. Kurz gesagt: Du darfst es nutzen, kopieren, ändern, veröffentlichen und verkaufen, solange der Urheberrechtsvermerk und der Lizenztext dabeibleiben. Eine Gewährleistung gibt es nicht.

Rechtlich gilt der englische Originaltext:

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

Die Lizenzdatei liegt im [Repository](https://github.com/Anarki-LNX/netsluice/blob/main/LICENSE).

## Worauf NetSluice aufbaut

Aus [`THIRD-PARTY.md`](https://github.com/Anarki-LNX/netsluice/blob/main/THIRD-PARTY.md):

| Was | Wofür | Lizenz | Quelle |
|---|---|---|---|
| AdGuard Home | der DNS-Filter-Motor, bei der Installation heruntergeladen | GPL-3.0 | <https://github.com/AdguardTeam/AdGuardHome> |
| Caddy | Webserver, aus Debian installiert | Apache-2.0 | <https://caddyserver.com> |
| Armbian / Debian | Grundsystem | verschiedene, meist GPL | <https://www.armbian.com> |
| IP to Country Lite von DB-IP | Land einer Adresse für die Weltkarte, bei der Installation heruntergeladen | CC BY 4.0 | <https://db-ip.com>, verpackt von <https://github.com/sapics/ip-location-db> |
| world-atlas `countries-110m.json` | Ländergrenzen (`web/data/`) | ISC. Daten von Natural Earth, gemeinfrei | <https://github.com/topojson/world-atlas> |
| Ländercodes nach ISO 3166-1 | `web/data/iso.json`, abgeleitet aus dem Projekt iso-codes | Tatsachen. iso-codes steht unter LGPL-2.1-or-later | <https://salsa.debian.org/iso-codes-team/iso-codes> |
| Feather Icons, `settings` | das Zahnrad in der Kopfzeile (`web/index.html`) | MIT | <https://github.com/feathericons/feather> |

**Filterlisten** werden nicht mitgeliefert. Das Gerät lädt sie von ihren Betreibern, und sie behalten ihre eigenen Lizenzen.

## Das fertige Abbild

Das Abbild an einem Release ist ein unverändertes Armbian-Community-Abbild für den NanoPi R2S (Debian 13 „trixie“), ergänzt um die Hardware-Beschreibung unten, die NetSluice-Dateien und ein Skript für den ersten Start. Die Armbian- und Debian-Pakete darin behalten ihre eigenen Lizenzen. Ihre Quellen gibt es unter <https://github.com/armbian/build> und <https://www.debian.org/distrib/packages>.

Das Abbild bringt außerdem mit, was der erste Start braucht: die Debian-Pakete von Caddy und avahi samt Abhängigkeiten, das Release von AdGuard Home für arm64 (GPL-3.0, Quellcode unter <https://github.com/AdguardTeam/AdGuardHome>), die Länderliste von DB-IP und die IEEE-Liste der Netzwerkkarten-Hersteller. `SOURCES.txt` im Paket nennt Herkunft und Prüfsumme jeder Datei.

## Die Hardware-Beschreibung

Die Hardware-Beschreibung (Device Tree), die `dts/patch_dts.py` erzeugt, ist eine veränderte Kopie des `rk3328-nanopi-r2`-Device-Trees aus dem Linux-Kernel und bleibt unter dessen Lizenz (GPL-2.0-or-later OR MIT).

## Diese Website

Der Code der Website gehört zum selben Repository, im Ordner `website/`, unter derselben MIT-Lizenz. Sie nutzt diese Schriften, ausgeliefert von dieser Website:

| Schrift | Lizenz |
|---|---|
| Instrument Serif | SIL Open Font License 1.1 |
| Geist und Geist Mono | SIL Open Font License 1.1 |

Die Bildschirmfotos zeigen die NetSluice-Demo mit erfundenen Daten.
