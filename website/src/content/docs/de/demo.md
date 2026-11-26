---
title: Die Demo ausprobieren
description: Die echte Oberfläche mit erfundenen Daten, auf deinem eigenen Rechner oder auf dieser Website. Kein Gerät nötig.
lang: de
section: start
order: 12
updated: 2026-11-26
---

Du kannst dir die Oberfläche ansehen, bevor du ein Gerät anfasst. Die Demo ist die Oberfläche von NetSluice selbst, gefüttert mit erfundenen Daten: ein ausgedachter Haushalt, seine Geräte und wohin sie sprechen.

## Auf dieser Website

Die [Demo-Seite](/de/demo/) zeigt dieselbe Oberfläche in deinem Browser. Sie ist mit „Demo · erfundene Daten“ gekennzeichnet. Sie spricht mit keinem Gerät, und Schalter antworten, ändern aber nichts.

## Auf deinem eigenen Rechner

Du brauchst `python3` und eine Kopie des Repositorys.

```bash
git clone https://github.com/Anarki-LNX/netsluice.git
cd netsluice
python3 scripts/demo.py
```

Dann öffne `http://127.0.0.1:8099/`. Häng `?lang=de` für Deutsch an, oder `?lang=en` für Englisch.

Für einen anderen Port gib ihn als erstes Argument an:

```bash
python3 scripts/demo.py 8100
```

## Was die Demo ist

- Sie liefert den Ordner `web/` aus und beantwortet jede Anfrage der Oberfläche mit erfundenen Daten.
- Kein Gerät, kein Filter-Motor und kein Passwort nötig.
- Schalter antworten, ändern aber nichts.
- Die Bilder in der README und auf dieser Website stammen aus ihr.

## Was die Demo nicht ist

Sie zeigt nicht dein Netz, und die Zahlen bedeuten nichts. Auf einem echten Gerät kommt jede Zahl aus dem Protokoll des Filters.
