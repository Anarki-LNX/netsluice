---
title: Updates
description: Wie sich NetSluice von GitHub aktualisiert, was passiert, wenn ein Update scheitert, und wie das System darunter aktuell bleibt.
lang: de
section: use
order: 31
updated: 2026-11-26
---

Unter Einstellungen geht es bei **Updates** um zwei Dinge: NetSluice selbst und das Debian-System darunter.

## NetSluice selbst

**Nachsehen.** Etwa einmal am Tag fragt das Gerät bei GitHub, ob es ein neues Release gibt. Nachsehen installiert nichts. Gibt es eins, steht in der Kopfzeile „Update auf …“. Du kannst auch von Hand nachsehen: „Nach neuer Version suchen“.

**Installieren.** „… installieren“ startet das Update. Oder du schaltest **Neue Versionen automatisch installieren** ein. Das ist anfangs aus. Eingeschaltet sieht das Gerät einmal am Tag frühmorgens nach und installiert eine neue Version, wenn es eine gibt.

Was bei einem Update passiert:

1. Das Gerät nimmt das neueste Release nach Versionsnummer, Vorabversionen eingeschlossen.
2. Es lädt das Update-Archiv herunter, nur von GitHub und über HTTPS, höchstens 30 MB. Hat ein Release kein Update-Archiv, nimmt es das Quellarchiv des Tags und zeigt den Download ohne Prozentangabe.
3. Es prüft das Archiv. Die `VERSION`-Datei darin muss zum Tag passen. Oberfläche und Dienst müssen da sein, und die Python-Dateien müssen sich übersetzen lassen. Sonst wird nichts installiert.
4. Es behält eine Kopie von dem, was gerade läuft.
5. Es ersetzt Oberfläche und Dienst. **Der Filter-Motor bleibt unberührt**, die Namensauflösung läuft also durchgehend weiter.
6. Es startet den Dienst neu und wartet, bis er antwortet.

**Antwortet die neue Version nicht** innerhalb von etwa 40 Sekunden, kommt die vorherige von selbst zurück. Die Oberfläche sagt dann: „Das letzte Update wurde rückgängig gemacht.“ Scheitert ein Update früher, etwa beim Download, läuft die bisherige Version einfach weiter.

**Gut zu wissen**

- Releases sind nicht signiert. Geprüft werden die passende Version, die Dateien und dass der Download nur von GitHub kommt.
- Ein Update ersetzt nur `web/` und `service/`. Änderungen an der Systemeinrichtung brauchen weiterhin `provision/install-stack.sh` von Hand.
- Etwa einmal am Tag sieht GitHub deine Adresse und die installierte Version. Sonst wird nichts gesendet.

## Das System darunter (Debian)

- **Nach Updates suchen** frischt die Paketlisten auf und zeigt, wie viele Updates warten.
- **Installieren** spielt sie im Hintergrund ein. Der Filter arbeitet weiter.
- **Sicherheitsupdates automatisch einspielen**: Debian installiert Sicherheitskorrekturen dann jede Nacht selbst. Das schaltest du selbst ein.

**Absichtlich zurückgehalten: der Systemkern.** Die Kernel-Pakete laufen auf dieser Platine nur zusammen mit der angepassten Hardware-Beschreibung (Device Tree). Sie sind festgehalten und werden von Hand aktualisiert. Nach jeder Paketinstallation wird die angepasste Hardware-Beschreibung automatisch zurückgelegt.

## Ein neues Abbild

Für ein Update musst du keine neue Karte schreiben. Ein neues Abbild erscheint nur, wenn sich unterhalb von Oberfläche und Dienst etwas geändert hat. Siehe [Releases und Prüfsummen](/de/docs/releases-and-checksums/).
