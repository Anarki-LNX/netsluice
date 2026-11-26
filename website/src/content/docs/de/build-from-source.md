---
title: Selbst bauen
description: Armbian auf dem Mini starten, NetSluice darauf installieren oder das fertige Abbild selbst bauen.
lang: de
section: develop
order: 50
updated: 2026-11-26
---

Der andere Weg zu NetSluice: Du passt ein unverändertes Armbian-Abbild selbst an und installierst NetSluice darauf über SSH.

## Bevor du anfängst

- **Deine Wallet.** Wenn auf deinem Gerät eine Wallet liegt, sorg dafür, dass du ihre Seed-Phrase oder den Keystore hast.
- **Prüf deine Platine (optional, empfohlen).** `scripts/probe` baut ein winziges Startskript, das den Bootloader seine Einstellungen auf die Karte schreiben lässt. Am Gerät ändert es nichts. Siehe [Eine Platine abfragen](/de/docs/hardware/#eine-platine-abfragen).

## Was du brauchst

- Einen Linux-Rechner
- Eine microSD-Karte mit 16 GB oder mehr
- `python3`, `dtc`, `e2fsprogs`, `util-linux`, `xz`
- Das Armbian-Abbild für den NanoPi R2S (Debian, minimal) von <https://www.armbian.com/nanopi-r2s/>
- Eine Kopie des Repositorys:

```bash
git clone https://github.com/Anarki-LNX/netsluice.git
cd netsluice
```

## 1. Armbian von einer Karte starten

```bash
scripts/build-image.sh Armbian_*_Nanopi-r2s_*_minimal.img.xz
sudo dd if=deeper-connect-mini-armbian.img of=/dev/sdX bs=4M conv=fsync status=progress
```

> **Prüf den Gerätenamen doppelt.** `dd` löscht, was auch immer `/dev/sdX` ist. Nimm die Karte, nicht deine eigene Festplatte.

`build-image.sh` braucht keine Root-Rechte. Es bearbeitet die Abbilddatei direkt und schreibt die korrigierte Hardware-Beschreibung hinein.

Trenn den Mini vom Strom, steck die Karte ein, verbinde einen Ethernet-Anschluss und schalte ihn ein. Der erste Start dauert zwei bis drei Minuten. Melde dich über SSH als `root` an. Armbian verlangt bei der ersten Anmeldung ein neues Passwort. Sein Standardpasswort ist öffentlich bekannt, also mach das sofort.

## 2. NetSluice darauf installieren

```bash
scripts/deploy-dev.sh root@<gerät>                          # Oberfläche und Dienst
ssh root@<gerät> 'sh -s' < provision/install-stack.sh       # alles, was sie brauchen
```

`install-stack.sh` darfst du beliebig oft laufen lassen. Erledigte Schritte werden übersprungen. Ohne das Paket des fertigen Abbilds lädt es AdGuard Home (geprüft gegen die Prüfsummen des Projekts), die Länderdatenbank und die Liste der Netzwerkkarten-Hersteller herunter.

Öffne `http://<gerät>/`. Wer zuerst kommt, wählt das Passwort. Dann trag entweder die Adresse des Geräts im Router als DNS-Server ein, oder gib dem Gerät die Adresse, die dein alter Filter hatte.

## 3. Optional: auf den internen Speicher umziehen

Unter Einstellungen, **Sichern und Installieren**. Siehe [Sichern und Installieren](/de/docs/backup-and-install/).

## Das fertige Abbild selbst bauen

```bash
scripts/build-image.sh --netsluice Armbian_*_Nanopi-r2s_*_minimal.img.xz
```

Mit `--netsluice` entsteht das fertige Abbild: NetSluice richtet sich beim ersten Start selbst ein, SSH ist aus, und das Root-Konto ist gesperrt. Dafür braucht es Internet, denn es sammelt alles ein, was der erste Start sonst herunterladen würde (`scripts/fetch-bundle.py`): die Debian-Pakete von Caddy und avahi, AdGuard Home, die Länderliste von DB-IP und die IEEE-Liste der Netzwerkkarten-Hersteller. `SOURCES.txt` im Paket nennt Herkunft und Prüfsumme jeder Datei.

Heraus kommt `netsluice-<version>-deeper-connect-mini.img`, gepackt zu `.img.xz`, mit einer `.sha256` daneben.
