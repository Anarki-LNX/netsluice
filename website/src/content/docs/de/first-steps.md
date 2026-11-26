---
title: Erste Schritte in der Oberfläche
description: Anmelden, die Übersicht lesen, Filterlisten wählen und dich bei Geräten, Weltkarte und Einstellungen zurechtfinden.
lang: de
section: use
order: 30
updated: 2026-11-26
---

Öffne **`http://netsluice.local/`**, oder die Adresse, die dein Router für das Gerät „netsluice“ anzeigt.

## Anmelden

- **Wer zuerst kommt, wählt das Passwort.** Mach das sofort. Nimm mindestens 8 Zeichen.
- Es gibt kein Zurücksetzen per E-Mail. Bewahr das Passwort gut auf.
- Nach fünf Fehlversuchen in fünf Minuten wartet die Anmeldung. Versuch es nach fünf Minuten wieder.
- Eine Anmeldung hält 30 Tage. Unter Einstellungen, Zugang, kannst du dich abmelden oder das Passwort ändern. Eine Änderung meldet alle anderen Browser ab.

## Die Kopfzeile

- **Filter an / aus.** Ein Klick pausiert den Filter für zehn Minuten. Dann steht dort, wann er wieder angeht, und „Aus lassen“, falls er aus bleiben soll.
- **Live** mit pulsierendem Punkt, solange das Gerät die Seite mit Daten versorgt. Tut es das nicht, steht dort „Offline“.
- Ein Hinweis, wenn es eine neue Version von NetSluice gibt.
- Der Sprachschalter (Deutsch, Englisch) und der Halbkreis für dunkel und hell.

## Übersicht

Anfragen kommen blau an, werden in der Schleuse geprüft und verlassen sie grün oder zerplatzen rot. Unter der Live-Ansicht: die letzten 24 Stunden als Balken pro Stunde, der Anteil, der aufgehalten wurde, die meist aufgehaltenen Geräte und die Adressen, die zuletzt und am häufigsten aufgehalten wurden.

## Geräte

Jedes Gerät, das in den letzten 24 Stunden beim Filter angefragt hat. Das mit den meisten aufgehaltenen Anfragen steht vorn. NetSluice benennt ein Gerät nach dem, was der Router über es weiß, was das Gerät im Netz über sich verrät (mDNS), und nach dem Hersteller seiner Netzwerkkarte. Wo ein Gerät es verrät, siehst du auch Modell und Firmware. Eine zufällige („private“) MAC wird als solche angezeigt.

**Ein Klick auf ein Gerät** öffnet seine Seite: Anfragen pro Stunde, die am häufigsten aufgehaltenen und durchgelassenen Adressen, welche Liste sie aufgehalten hat, die Arten von Anfragen und die neuesten Anfragen einzeln.

## Filter

Eine Liste nennt Gegenstellen, die nicht erreichbar sein sollen. NetSluice liest dieselben Listenformate wie AdGuard Home und Pi-hole.

- Ein Schalter pro Liste.
- Eine Auswahl bekannter Listen, jede mit einer Zeile dazu, was sie abdeckt.
- **Weitere Liste hinzufügen**: Füge die Adresse einer beliebigen Hosts-Datei oder Adblock-Liste ein.
- **Alle jetzt aktualisieren** frischt alle Listen auf, mit Fortschrittsbalken.

Größere Listen brauchen mehr Arbeitsspeicher. Der komplette Bestand von HaGeZi Threat Intelligence braucht allein rund 500 MB, wie seine Beschreibung in der Liste sagt.

## Weltkarte

Wohin dein Netz spricht, gezeichnet in dem Moment, in dem es passiert, dazu die Länder nach Verkehr der letzten 24 Stunden. Rote Punkte wurden aufgehalten.

Zwei Dinge solltest du beim Lesen wissen:

- **Das Land ist der Ort, an dem der antwortende Server registriert ist.** Große Netze antworten vom nächstgelegenen Rechenzentrum. Vieles, was bei den USA steht, verlässt Europa vielleicht gar nicht.
- **Die Karte zählt weniger Anfragen als die Übersicht.** Sie erfasst nur IPv4 und zählt ein Ereignis pro `A`-Anfrage. Sie ist keine Aufzeichnung aller Verbindungen.

## Einstellungen

Jede Kachel öffnet eine eigene Seite:

| Kachel | Was drin ist |
|---|---|
| Kinder und Zeitpläne | Internet an oder aus je Gerät. Siehe [Kinder und Zeitpläne](/de/docs/children-and-schedules/) |
| Sicheres DNS | der Auflöser, den der Filter fragt, DNS über HTTPS, DNSSEC. Siehe [Datenschutz und verschlüsseltes DNS](/de/docs/privacy-and-dns/) |
| Datenschutz | wie lange das Anfrageprotokoll bleibt, verbergen, welches Gerät gefragt hat, alles Gesammelte löschen |
| Zugang | Passwort, Abmelden, HTTPS. Siehe [HTTPS im eigenen Netz](/de/docs/https/) |
| Taster und LEDs | was das Gerät selbst zeigt und tut |
| Meldungen aufs Handy | ntfy oder Webhook. Siehe [Meldungen](/de/docs/notifications/) |
| Aussehen | Design, dunkel oder hell, Größe, Akzentfarbe, Animationen. Gilt nur für diesen Browser |
| Export und Import | deine Einrichtung in eine Datei und zurück |
| Netzwerk | der Name des Geräts. Die Adresse wird angezeigt, lässt sich hier aber noch nicht ändern |
| Updates | NetSluice selbst und das System darunter. Siehe [Updates](/de/docs/updates/) |
| Sichern und Installieren | siehe [Sichern und Installieren](/de/docs/backup-and-install/) |

## Taster und LEDs

- **Grün** blinkt, solange das Gerät läuft.
- **Rot** blitzt bei jeder aufgehaltenen Anfrage, wenn du das eingeschaltet lässt.
- **LEDs**: an, aus, oder nachts aus zwischen zwei Uhrzeiten, die du wählst.
- **Der Taster** am Gerät pausiert den Filter für zehn Minuten. Ein zweiter Druck schaltet ihn wieder ein. Die rote LED blinkt zur Bestätigung dreimal. Du kannst den Taster abschalten.

## Aussehen

Drei Designs, jedes in Dunkel und Hell: **Schleuse** (das Original: tiefes Wasser, grüne Kacheln), **Glas** (Milchglas-Scheiben über weichen Farben) und **Graphit** (ruhig und flach, die Übersicht wird zur Bühne mit deinen Geräten). Dazu eine Größe, eine Akzentfarbe und Animationen an oder aus. Diese Wahl gilt nur für diesen Browser.
