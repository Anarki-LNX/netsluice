---
title: Probleme lösen und zurückkommen
description: Was du tust, wenn die Einrichtung stockt, die Oberfläche nicht auftaucht, der Filter ausfällt oder eine Karte nicht mehr startet.
lang: de
section: hardware
order: 41
updated: 2026-11-26
---

## Der Weg zurück ist immer da

Die Karte ist das Einzige, worauf NetSluice schreibt, außer du installierst es selbst auf den internen Speicher. **Zieh die Karte, und das Gerät startet sein Originalsystem.**

Hängt dein Haushalt am Filter, stell den DNS-Server im Router zurück auf den alten Wert. Dann hat jedes Gerät zu Hause wieder Namensauflösung, egal in welchem Zustand der Mini ist.

## Beim ersten Start

| Was du siehst | Was es bedeutet |
|---|---|
| Grüne LED blinkt | NetSluice richtet sich ein. Das dauert ein paar Minuten. Bitte nicht vom Strom trennen |
| Grüne LED leuchtet | Fertig |
| Rote LED leuchtet | Ein Schritt ist fehlgeschlagen. Er wird jede Minute neu versucht |

Währenddessen zeigt das Gerät unter `http://netsluice.local/` eine Seite mit dem aktuellen Schritt, und was nicht stimmt, wenn ein Schritt scheitert. Alles steht außerdem in `/var/lib/netsluice-setup/setup.log` auf der Karte. Es übersteht auch einen Stromausfall. Lesen kannst du es an einem Linux-Rechner, denn die Karte ist ext4.

## Die Oberfläche taucht nicht auf

- Versuch statt `netsluice.local` die Adresse, die dein Router für das Gerät „netsluice“ anzeigt.
- Prüf, ob das Netzwerkkabel zum Router oder zu einem Switch führt.

## Es wird nichts aufgehalten

- Die Filterlisten werden geladen, sobald das Gerät das Internet erreicht. Bis dahin wird nichts aufgehalten.
- Prüf unter Filter, ob mindestens eine Liste eingeschaltet ist.
- Prüf, ob dein Router die Adresse des Geräts als DNS-Server verteilt, oder ob das Gerät, mit dem du testest, NetSluice direkt fragt.

## Ein Gerät wird nicht gefiltert

Ein Gerät mit eigener DNS-Einstellung fragt NetSluice nicht und kommt am Filter vorbei. Die Liste „HaGeZi Encrypted DNS bypass“ unter Filter hält Apps und Geräte auf, die eigenes verschlüsseltes DNS nutzen.

## Der Filter antwortet nicht

Hast du Meldungen eingeschaltet, sagt NetSluice dir nach einer Minute ohne Antwort vom Filter-Motor Bescheid. Dein Netz ist dann womöglich ohne DNS. Stell den DNS-Server im Router zurück, oder starte das Gerät neu.

## Ein Update hat nicht geklappt

Die Oberfläche sagt, was passiert ist. Startete die neue Version nicht, wurde die vorherige von selbst zurückgeholt. Scheiterte ein Update früher, läuft die bisherige Version weiter. Siehe [Updates](/de/docs/updates/).

## Zu oft das falsche Passwort

Nach fünf Fehlversuchen in fünf Minuten wartet die Anmeldung. Versuch es nach fünf Minuten wieder. Ein Zurücksetzen per E-Mail gibt es nicht.

## Eine Karte startet nach einem Kernel-Update nicht mehr

Die Kernel-Pakete sind absichtlich festgehalten, und nach jeder Paketinstallation wird die angepasste Hardware-Beschreibung automatisch zurückgelegt. Startet eine Karte nach einem Kernel-Update trotzdem nicht mehr, häng sie an einem Rechner ein und kopier

```
/boot/deeper-connect-mini.dtb
```

über

```
/boot/dtb/rockchip/rk3328-nanopi-r2-rev00.dtb
```

## Zurück zum Originalsystem nach einer Installation

Hast du NetSluice auf den internen Speicher installiert, starte das Gerät von einer NetSluice-Karte mit deiner Sicherung und spiel die Sicherung zurück. Siehe [Sichern und Installieren](/de/docs/backup-and-install/).

## Immer noch festgefahren

Die [serielle Konsole](/de/docs/hardware/#serielle-konsole) zeigt, was das Gerät beim Start tut. Dann eröffne ein [Issue auf GitHub](https://github.com/Anarki-LNX/netsluice/issues) und beschreib, was du siehst. Was dabei hilft, steht unter [Mitmachen](/de/contributing/).
