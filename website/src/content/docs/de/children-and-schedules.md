---
title: Kinder und Zeitpläne
description: Internet an oder aus je Gerät, von Hand oder nach Uhrzeit, mit Zusatzzeit auf Knopfdruck. Und wie ein Gerät daran vorbeikommt.
lang: de
section: use
order: 32
updated: 2026-11-26
---

Unter Einstellungen schaltet **Kinder und Zeitpläne** das Internet für ausgewählte Geräte an und aus.

## Ein Gerät hinzufügen

In der Liste erscheinen nur Geräte, die den Filter schon benutzt haben. Wähl eines aus und füg es hinzu.

Ein Gerät wird an seiner Hardware-Adresse (MAC) erkannt. Seine Regel folgt ihm also, wenn es eine neue IP-Adresse bekommt. Ist keine MAC bekannt, hängt die Regel an der Adresse, und die Oberfläche sagt das.

## Drei Betriebsarten

| Betriebsart | Was sie tut |
|---|---|
| Immer an | das Gerät wird wie gewohnt gefiltert |
| Nach Zeitplan | Internet nur an den Tagen, die du wählst, zwischen zwei Uhrzeiten. Ein neuer Zeitplan beginnt mit 15:00 bis 19:00 |
| Aus | kein Internet für dieses Gerät |

Ein Zeitfenster über Mitternacht gehört zu dem Tag, an dem es beginnt.

## Zusatzzeit

**+30 Minuten** und **+1 Stunde** geben einem Gerät sofort Internet, egal was seine Betriebsart sagt. „Zusatzzeit beenden“ nimmt sie zurück.

## Wie es funktioniert, und wo es endet

Ein ausgeschaltetes Gerät bekommt vom Filter keine Antworten mehr. Es lädt also nichts Neues. Eine schon geöffnete Seite oder ein laufendes Video kann noch einen Moment weiterlaufen.

**Ein Gerät mit eigener DNS-Einstellung kommt daran vorbei.** Es fragt NetSluice dann gar nicht. Die Filterliste „HaGeZi Encrypted DNS bypass“ unter Filter hindert Apps und Geräte daran, den Filter mit eigenem verschlüsseltem DNS zu umgehen. Ein Gerät, bei dem jemand von Hand einen gewöhnlichen DNS-Server einträgt, kommt trotzdem vorbei.

Änderungen gelten sofort. Das Gerät prüft die Regeln außerdem alle 20 Sekunden, ein Zeitplan schaltet also pünktlich.
