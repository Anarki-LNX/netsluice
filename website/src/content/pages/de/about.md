---
title: Über NetSluice
description: Woher NetSluice kommt, wer es macht und nach welchen Grundsätzen es gebaut ist.
lang: de
updated: 2026-11-26
---

## Woher es kommt

Der Deeper Connect Mini ist eine kleine Netzwerkbox mit guter Hardware: ein RK3328 mit vier Kernen, 2 GB Arbeitsspeicher, 8 GB interner Speicher und zwei Ethernet-Anschlüsse. NetSluice gibt ihm ein zweites Leben als Netzwerkfilter für zu Hause, mit einem schlichten Debian statt dem System des Herstellers.

Angefangen hat es mit einem Gerät. Sein Bootloader sucht auf der microSD-Karte nach einem Startskript, bevor er das interne System startet. Ein unverändertes Abbild für den eng verwandten NanoPi R2S startete den Kernel, kam aber nie hoch. Drei Unterschiede auf der Platine mussten gefunden und behoben werden. Die [Hardware-Notizen](/de/docs/hardware/) erzählen davon.

Die erste öffentliche Version, 0.1.0, erschien am 20. November 2026. Version 0.1.4 brachte das erste fertige Abbild.

## Wer es macht

NetSluice ist ein Projekt von [LOOP OUT TECH](https://loopout.tech/projekte/netsluice). Entwickelt und getestet wurde es auf einem einzigen Deeper Connect Mini, der im Heimnetz seines Besitzers läuft. Der Code liegt auf [GitHub](https://github.com/Anarki-LNX/netsluice), unter der MIT-Lizenz, von „The NetSluice contributors“.

## Wie es gebaut ist

- **Klein.** Der Dienst ist eine Python-Datei, nur mit der Standardbibliothek. Die Oberfläche ist schlichtes HTML, CSS und JavaScript, ohne Framework und ohne Build-Schritt.
- **Bewährte Teile.** AdGuard Home filtert, Caddy liefert die Oberfläche aus, Debian ist die Grundlage.
- **Gefahrlos auszuprobieren.** Es läuft von einer Karte und lässt das Gerät in Ruhe, bis du dich anders entscheidest. Der Bootloader des Herstellers wird nie beschrieben.
- **Ehrlich über den Stand.** Was funktioniert, was nicht gebaut und was ungetestet ist, steht geschrieben, in der [README](https://github.com/Anarki-LNX/netsluice#status-early-tested-on-one-device) und auf dieser Website.
- **Zwei Sprachen.** Die Oberfläche und diese Website gibt es auf Deutsch und Englisch.

## Stand

Früh, getestet auf einem Gerät. Die [Hardware-Seite](/de/hardware/) listet, was funktioniert, was nicht gebaut und was ungetestet ist.

## Keine Verbindung zu Deeper Network

NetSluice steht in keiner Verbindung zu Deeper Network und wird von Deeper Network weder unterstützt noch empfohlen. „Deeper Connect“ ist deren Marke und nennt hier nur die Hardware, auf der NetSluice läuft.
