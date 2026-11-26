---
title: Releases und Prüfsummen
description: Neueste Version und neuestes Abbild sind zwei verschiedene Dinge. Wie du einen Download prüfst und was bei einem Update geprüft wird.
lang: de
section: install
order: 21
updated: 2026-11-26
---

Alle Releases erscheinen auf [GitHub](https://github.com/Anarki-LNX/netsluice/releases). Die [Download-Seite](/de/downloads/) dieser Website listet sie auf.

## Neueste Version und neuestes Abbild

Ein Release kann bis zu drei Dateien mitbringen:

| Datei | Was es ist |
|---|---|
| `netsluice-<version>-deeper-connect-mini.img.xz` | das fertige Abbild für die microSD-Karte |
| `netsluice-<version>-deeper-connect-mini.img.xz.sha256` | die SHA-256-Prüfsumme dieses Abbilds |
| `netsluice-<version>.tar.gz` | das Update-Archiv, das ein laufendes Gerät herunterlädt |

Nicht jedes Release bringt ein Abbild mit. Ein neues Abbild entsteht nur, wenn sich unterhalb von Oberfläche und Dienst etwas geändert hat: die Systemeinrichtung, der erste Start oder die mitgelieferten Pakete. Alles andere erreicht eine Karte, die mit einem älteren Abbild beschrieben wurde, als Update.

Neueste Version und neuestes Abbild können also verschiedene Releases sein. Schreib das neueste Abbild auf die Karte und aktualisiere danach in der Oberfläche.

## Ein Abbild prüfen

Die `.sha256`-Datei enthält die Prüfsumme des Abbilds. Leg beide Dateien in denselben Ordner.

**Linux**

```bash
sha256sum -c netsluice-*.img.xz.sha256
```

**macOS**

```bash
shasum -a 256 -c netsluice-*.img.xz.sha256
```

**Windows (PowerShell)**

```powershell
Get-FileHash -Algorithm SHA256 .\netsluice-<version>-deeper-connect-mini.img.xz
```

Vergleich die lange Zahl mit der in der `.sha256`-Datei. Groß- und Kleinschreibung spielen keine Rolle.

Eine Prüfsumme sagt dir, dass die Datei vollständig und unverändert aus dem Release angekommen ist. **Releases sind nicht signiert.** Es gibt Prüfsummen, keine Signaturen.

## Was ein Gerät bei einem Update prüft

Ein Gerät nimmt das neueste Release nach Versionsnummer, Vorabversionen eingeschlossen. Es lädt nur von GitHub, über HTTPS, und lehnt ein Archiv ab,

- das größer als 30 MB ist,
- dessen `VERSION`-Datei nicht zum Tag des Release passt,
- in dem Oberfläche oder Dienst fehlen,
- dessen Python-Dateien sich nicht übersetzen lassen.

Antwortet die neue Version nach dem Update nicht, kommt die vorherige zurück. Siehe [Updates](/de/docs/updates/).

## Versionsnummern

Versionen haben die Form `x.y.z`, zum Beispiel `0.1.28`. Der Tag eines Release ist `v` plus Version, zum Beispiel `v0.1.28`.
