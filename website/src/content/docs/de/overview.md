---
title: Was NetSluice ist
description: Ein zweites Leben für den Deeper Connect Mini. Ein schlichtes Debian und darauf ein Netzwerkfilter mit eigener Oberfläche.
lang: de
section: start
order: 10
updated: 2026-11-26
---

NetSluice gibt dem Deeper Connect Mini ein zweites Leben. Statt AtomOS, dem System des Herstellers, läuft ein schlichtes Debian. Darauf arbeitet ein Netzwerkfilter mit eigener Weboberfläche.

Eine Schleuse lässt Wasser durch oder hält es zurück. NetSluice macht das mit dem Verkehr eines Heimnetzes. Es beantwortet die DNS-Anfragen aller Geräte, hält die auf deinen Sperrlisten auf und zeigt dir, was passiert ist.

## Was es kann

- **Filter** für das ganze Netz, mit den Sperrlisten, die du von AdGuard Home und Pi-hole kennst. Ein Schalter pro Liste.
- **Übersicht** mit Live-Ansicht: Anfragen kommen an, werden geprüft und laufen durch oder zerplatzen.
- **Geräte**, das am häufigsten aufgehaltene zuerst, mit Name, Hersteller, Art und, wo ein Gerät es verrät, Modell und Firmware. Ein Klick auf ein Gerät öffnet seine eigene Seite.
- **Weltkarte**, wohin dein Netz spricht, eingefärbt nach Verkehr und nach dem Anteil, der aufgehalten wurde.
- **Kinder und Zeitpläne**: Internet an oder aus je Gerät, von Hand oder nach Uhrzeit, mit Zusatzzeit auf Knopfdruck.
- **Einstellungen** für verschlüsseltes DNS (DoH, DNSSEC), Datenschutz, die LEDs und den Taster der Platine, Meldungen aufs Handy (ntfy oder Webhook), Aussehen, Export und Import, Name und Systemupdates.
- **Updates von NetSluice selbst** aus den Releases auf GitHub, von Hand oder einmal am Tag. Startet die neue Version nicht, kommt die alte zurück.
- **Sichern und Installieren**: eine Kopie des Originalsystems behalten, NetSluice auf den internen Speicher bringen und die Kopie zurückspielen, wenn du es dir anders überlegst.
- **HTTPS** im eigenen Netz, wenn du es einschaltest.
- Deutsch und Englisch.

## Wie es auf das Gerät kommt

Der Mini ist ein naher Verwandter des FriendlyELEC NanoPi R2S (Rockchip RK3328). Der Bootloader des Herstellers sucht auf der microSD-Karte nach einem Startskript, **bevor** er das interne System startet. Eine passende Karte genügt also: kein Löten, kein Öffnen des Gehäuses. Ohne Karte startet wieder das Originalsystem.

Ein unverändertes NanoPi-R2S-Abbild startet auf dem Mini allerdings nicht. Drei Dinge sind auf dieser Platine anders, und NetSluice korrigiert sie. Die [Hardware-Notizen](/de/docs/hardware/) erklären sie.

## Stand: früh, getestet auf einem Gerät

Alles wurde auf einem einzigen Deeper Connect Mini mit der Platinenbezeichnung `mini_v21_20210521` entwickelt und getestet. Er läuft im Heimnetz seines Besitzers.

| | |
|---|---|
| Funktioniert | fertiges Abbild für die microSD-Karte, Start von microSD, Sicherung des internen Speichers, Installation darauf und Zurückspielen der Sicherung (alles aus der Oberfläche), beide Ethernet-Anschlüsse mit 1 Gbit/s, LEDs, Taster, alles oben Genannte |
| Nicht umgesetzt | Inline-Betrieb („Schleuse“), Mithören, die feste Adresse in der Oberfläche ändern |
| Nicht unterstützt | USB-C als Datenanschluss (er versorgt das Gerät weiter mit Strom) |
| Ungetestet | andere Platinenversionen des Mini |
| Nicht unterstützt | die anderen Deeper-Modelle (Pico, Nano, Air). Sie sind andere Hardware |

Ein WireGuard-Tunnel, damit ein Handy den Filter auch unterwegs nutzt, ist eine Idee für später. Er ist weder geplant noch gebaut.

## Woraus es besteht

- **AdGuard Home** ist der Filter-Motor.
- **Caddy** liefert die Oberfläche aus und prüft die Anmeldung, bevor etwas den Motor erreicht.
- **netsluiced** ist eine einzige Python-Datei, nur mit der Standardbibliothek. Sie macht, was der Motor nicht macht: Anmeldung, Weltkarte, Geräteerkennung, Zeitpläne, LEDs und Taster, Meldungen.
- **netsluice-root** ist ein kleiner Helfer mit Root-Rechten und einer kurzen Liste erlaubter Befehle.
- **Die Oberfläche** ist schlichtes HTML, CSS und JavaScript. Kein Framework, kein Build-Schritt.
- **Die Grundlage** ist ein Armbian-Community-Abbild für den NanoPi R2S mit Debian 13 „trixie“.

Die Seite [Aufbau](/de/docs/architecture/) zeigt, wie die Teile zusammenspielen.

> NetSluice steht in keiner Verbindung zu Deeper Network und wird von Deeper Network weder unterstützt noch empfohlen. „Deeper Connect“ ist deren Marke und nennt hier nur die Hardware, auf der NetSluice läuft.
