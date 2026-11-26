---
title: Mit dem fertigen Abbild installieren
description: Zehn Schritte vom Download zum gefilterten Heimnetz. Kein Löten, kein Öffnen des Gehäuses.
lang: de
section: install
order: 20
updated: 2026-11-26
---

Das ist der einfache Weg. Du schreibst ein Abbild auf eine microSD-Karte, steckst die Karte in den Mini, und NetSluice richtet sich selbst ein. Am Gerät ändert sich nichts. Ziehst du die Karte, startet wieder das Originalsystem, die Wallet eingeschlossen.

> **Bevor du anfängst:** Wenn auf deinem Gerät eine Wallet liegt, sorg dafür, dass du ihre Seed-Phrase oder den Keystore hast.

## Die zehn Schritte

1. **Lade das Abbild herunter.** Hol dir das neueste `netsluice-<version>-deeper-connect-mini.img.xz` und die `.sha256`-Datei daneben von der [Download-Seite](/de/downloads/) oder aus den [Releases auf GitHub](https://github.com/Anarki-LNX/netsluice/releases). Nicht jedes Release bringt ein Abbild mit. Kleine Releases erreichen ein laufendes Gerät als Update.

2. **Prüf den Download.** Im Ordner mit beiden Dateien:

   ```bash
   sha256sum -c netsluice-*.img.xz.sha256
   ```

   Es muss `OK` dastehen. Für macOS und Windows siehe [Releases und Prüfsummen](/de/docs/releases-and-checksums/). Es gibt Prüfsummen, keine Signaturen.

3. **Schreib es auf die Karte**, mit [balenaEtcher](https://etcher.balena.io/) oder dem Raspberry Pi Imager (Menüpunkt „Use custom“ in der englischen Oberfläche). Beide nehmen die `.xz`-Datei, wie sie ist.

4. **Optional: SSH.** Wenn du dich am System darunter anmelden willst, leg jetzt deinen öffentlichen Schlüssel auf die Karte. Siehe [SSH-Zugang](/de/docs/ssh/). Ohne ihn bleibt SSH aus.

5. **Trenn den Mini vom Strom und steck die Karte ein.**

6. **Verbinde einen Ethernet-Anschluss mit deinem Router und schalte den Mini ein.**

7. **Warte auf die grüne LED.** Sie blinkt, während sich NetSluice einrichtet. Das dauert ein paar Minuten und braucht kein Internet: Das Abbild bringt alles mit. Leuchtet die grüne LED dauerhaft, ist es fertig. Währenddessen zeigt das Gerät eine Seite mit dem aktuellen Schritt, unter derselben Adresse wie später die Oberfläche.

8. **Öffne die Oberfläche** unter **`http://netsluice.local/`**, oder unter der Adresse, die dein Router für das Gerät „netsluice“ anzeigt.

9. **Wähl sofort das Passwort.** Wer zuerst kommt, legt es fest. Mach das also, bevor es jemand anderes kann. Nimm mindestens 8 Zeichen. Es gibt kein Zurücksetzen per E-Mail.

10. **Mach den Filter zum DNS-Server deines Netzes.** Trag die Adresse des Geräts in deinem Router als DNS-Server ein. Ab dann wird jedes Gerät zu Hause gefiltert. Die Filterlisten werden geladen, sobald das Gerät das Internet erreicht. Bis dahin wird nichts aufgehalten.

## Was die LEDs bei der Einrichtung sagen

| LED | Bedeutung |
|---|---|
| Grün blinkt | NetSluice richtet sich ein |
| Grün leuchtet | Fertig |
| Rot leuchtet | Ein Schritt ist fehlgeschlagen. Er wird jede Minute neu versucht. Die Seite auf dem Gerät sagt, was nicht stimmt |

Im normalen Betrieb blinkt die grüne LED, solange das Gerät läuft, und die rote blitzt bei jeder aufgehaltenen Anfrage. Beides lässt sich unter Einstellungen, Taster und LEDs ändern.

## Gut zu wissen

- **Am Gerät ändert sich nichts.** NetSluice läuft von der Karte. Wenn du dir sicher bist, behält Einstellungen → „Sichern und Installieren“ eine Kopie des Originalsystems und bringt NetSluice auf den internen Speicher. Siehe [Sichern und Installieren](/de/docs/backup-and-install/).
- **Es gibt keine Anmeldung am System darunter.** SSH ist aus und das Systemkonto gesperrt, außer du legst einen Schlüssel auf die Karte.
- **Updates** kommen über die Oberfläche, unter Einstellungen → Updates. Siehe [Updates](/de/docs/updates/).
- **Tipp:** Das Gerät bekommt seine Adresse von deinem Router. Viele Router können einem Gerät eine Adresse fest zuweisen, damit es immer dieselbe behält. Die feste Adresse in der NetSluice-Oberfläche zu ändern, ist noch nicht umgesetzt.

## Wenn etwas nicht klappt

Siehe [Probleme lösen](/de/docs/troubleshooting/).
