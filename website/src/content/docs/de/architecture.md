---
title: Aufbau für Entwickler
description: Wie Oberfläche, Webserver, Filter-Motor, Dienst und Root-Helfer zusammenspielen, und wie du daran arbeitest.
lang: de
section: develop
order: 51
updated: 2026-11-26
---

Die vollständigen Entwicklernotizen stehen in [`docs/development.md`](https://github.com/Anarki-LNX/netsluice/blob/main/docs/development.md) (englisch).

## Wie die Teile zusammenspielen

```
 browser ──HTTP──▶ Caddy :80 ──┬─ static files            web/
                               ├─ /auth/*  ─────────────▶ netsluiced :3002   (no session needed)
                               └─ /control/*, /api/*
                                    │  forward_auth: GET /auth/check on netsluiced
                                    ├─ /control/* ──────▶ AdGuard Home :3001  (the filter engine)
                                    └─ /api/*     ──────▶ netsluiced :3002

 devices ──DNS :53──▶ AdGuard Home

 netsluiced ──request file──▶ netsluice-root (started by systemd, runs as root)
```

- **AdGuard Home** filtert. Es lauscht für DNS auf jeder Adresse und für seine Schnittstelle nur auf localhost. Ein eigenes Konto hat es nicht: Mit einem prüft es bei jeder Anfrage einen bcrypt-Hash, und das kostet auf dieser CPU 0,4 s pro Anfrage.
- **Caddy** liefert die Oberfläche aus und lässt ohne gültige Anmeldung nichts zum Motor oder zum Dienst durch.
- **netsluiced** (`service/netsluiced.py`) ist alles, was der Motor nicht macht: Anmeldung, Weltkarte, Geräteerkennung, Zeitpläne, LEDs und Taster, Meldungen, und die Übergabe an den Helfer für Updates, Speicher und HTTPS. Eine Python-Datei, nur Standardbibliothek, ohne Sonderrechte. Ihr Kopf listet die Abschnitte und die HTTP-Schnittstelle.
- **netsluice-root** (`service/netsluice-root.py`) ist der einzige Teil mit Root-Rechten. Der Dienst legt eine Anfragedatei ab, und systemd startet den Helfer. Der Helfer nimmt nur eine kurze Liste von Befehlen an und prüft jedes Argument. Anfragen, die älter als 20 Sekunden sind, verfallen. Sie werden nie verspätet ausgeführt.
- **Die Oberfläche** (`web/`) ist schlichtes HTML, CSS und JavaScript-Module. Kein Framework, kein Build-Schritt. `app.js` enthält die Texte in beiden Sprachen und die Logik jedes Bereichs. `sluice.js`, `worldmap.js` und `scene.js` zeichnen auf Canvas.

## Aufteilung

| Pfad | Was |
|---|---|
| `web/` | die Oberfläche |
| `service/` | `netsluiced.py`, der Root-Helfer und `netsluice-install.sh`, das das System von der Karte auf die eMMC bringt |
| `provision/install-stack.sh` | macht aus einem laufenden Armbian ein NetSluice. Beliebig oft ausführbar |
| `scripts/build-image.sh` | passt ein unverändertes Armbian-Abbild an diese Platine an. Mit `--netsluice` baut es das fertige Abbild |
| `scripts/deploy-dev.sh` | kopiert `web/` und `service/` auf ein Gerät |
| `scripts/demo.py` | die Oberfläche auf deinem eigenen Rechner, mit erfundenen Daten |
| `scripts/probe/` | Startskript, das den Bootloader ausliest |
| `dts/patch_dts.py` | die Änderungen an der Hardware-Beschreibung für diese Platine |
| `rootfs/` | Dateien, die `build-image.sh` ins Abbild legt, darunter die Einrichtung beim ersten Start des fertigen Abbilds |
| `tests/` | Smoke-Tests, die auf deinem eigenen Rechner laufen |
| `docs/hardware.md` | was über die Platine bekannt ist |

## Daran arbeiten

```bash
scripts/deploy-dev.sh root@<gerät>      # nach Änderungen an web/ oder service/
ssh root@<gerät> 'sh -s' < provision/install-stack.sh    # nach Änderungen an provision/
```

Der Webserver sagt Browsern, dass sie neu nachfragen sollen. Ein Neuladen zeigt also die neue Fassung. Der Dienst startet nur neu, wenn sich seine Dateien geändert haben.

Auf dem Gerät antwortet der Dienst unter `http://127.0.0.1:3002` und der Motor unter `http://127.0.0.1:3001`, beide ohne Anmeldung. Das ist praktisch zum Testen über SSH.

Um ohne Gerät an der Oberfläche zu arbeiten: `python3 scripts/demo.py`. Siehe [Die Demo ausprobieren](/de/docs/demo/).

## Tests

```bash
bash tests/auth-smoke.sh        # Anmeldung: Einrichtung, Anmelden, Ändern, Abmelden, Sperre
bash tests/settings-smoke.sh    # Einstellungen und Zustellung von Meldungen an einen lokalen Empfänger
bash tests/caddyfile.sh         # die Webserver-Konfiguration ist an beiden Stellen derselbe Text
```

Die Smoke-Tests starten den Dienst auf localhost mit Wegwerf-Zustand und zufälligen Passwörtern. Sie brauchen `python3`, `curl` und `openssl`. Tests für die Oberfläche gibt es noch nicht.

## Releases

Ein Gerät aktualisiert sich aus den Releases des Repositorys. Für ein Release also:

1. `VERSION` erhöhen (Form `x.y.z`), committen und pushen,
2. `scripts/release.sh notes.md` ausführen (mit `--prerelease` für eine Testversion). Das setzt den Tag und hängt `netsluice-<version>.tar.gz` an. Dessen bekannte Größe lässt Geräte anzeigen, wie weit der Download ist.

Ein neues Abbild (`scripts/build-image.sh --netsluice`, als weitere Argumente an `release.sh` angehängt) braucht es nur, wenn sich unterhalb von `web/` und `service/` etwas geändert hat.

## Gut zu wissen, bevor du etwas änderst

- **Ein NetSluice im Einsatz ist der DNS-Server eines Haushalts.** Ein Neustart des Motors kostet etwa zehn Sekunden Namensauflösung, ein Neustart des Geräts etwa vierzig. Teste Änderungen an Adressen oder an netplan nicht auf einem Gerät, auf das Menschen angewiesen sind.
- **Die Hardware-Beschreibung ist nicht im Upstream.** `rootfs/dcm-dtb-restore` legt sie nach Paketinstallationen zurück, und die Kernel-Pakete sind festgehalten. Richtige Unterstützung der Platine in Armbian würde beide Notlösungen überflüssig machen.
- **Der Bootloader gehört dem Hersteller und wird nie beschrieben.** Sichern, Installieren und Zurückspielen lassen die Sektoren 64 bis 32767 in Ruhe, die letzten beiden prüfen sie. Um das in QEMU auszuprobieren, häng eine zweite Platte an und setz `NETSLUICE_INTERNAL_DISK` für `netsluice-root.service`. Ohne das wird nur eine echte eMMC als Ziel angenommen.
- **Die Länderzuordnung kennt nur IPv4** und zählt ein Ereignis pro `A`-Anfrage. Die Karte zeigt also weniger Anfragen als die Übersicht.
- **Ein Gerät sperren** heißt, seine DNS-Anfragen abzulehnen. Ein Gerät mit eigener DNS-Einstellung kommt daran vorbei.
- **Texte werden zuerst auf Englisch geschrieben.** Der deutsche Text steht daneben in `web/app.js`.
