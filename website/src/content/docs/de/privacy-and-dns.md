---
title: Datenschutz und verschlüsseltes DNS
description: Welchen Auflöser der Filter fragt, wie lange das Anfrageprotokoll bleibt und auf welchen Wegen Daten das Gerät verlassen.
lang: de
section: use
order: 34
updated: 2026-11-26
---

NetSluice sieht, welches Gerät in deinem Netz nach welcher Adresse fragt. So arbeitet ein DNS-Filter. Diese Seite zeigt, was auf dem Gerät bleibt, was es verlässt und was du einstellen kannst.

## Sicheres DNS

Was der Filter durchlässt, reicht er an einen Auflöser weiter. Mit DNS über HTTPS (DoH) ist diese Frage verschlüsselt: Weder dein Internetanbieter noch jemand auf der Leitung kann sie mitlesen oder verändern.

Unter Einstellungen, **Sicheres DNS**, wählst du einen davon:

| Auflöser | In den Worten der Oberfläche |
|---|---|
| Quad9 | Sperrt bekannte Schadseiten. Gemeinnützig, Schweiz. |
| Quad9 (unfiltered) | Ohne eigene Sperren. Gemeinnützig, Schweiz. |
| DNS4EU Protective | Europäischer Auflöser mit Schutz vor Schadseiten. |
| DNS4EU | Öffentlicher europäischer Auflöser, ungefiltert. |
| Mullvad | Betrieben von einem auf Privatsphäre ausgerichteten VPN-Anbieter. Schweden. |
| Cloudflare | Schnell, weltweit. USA. |

Ein neuer Auflöser wird getestet, bevor er zum Einsatz kommt. Antwortet er nicht, wird nichts geändert.

**Antworten prüfen (DNSSEC)** verwirft gefälschte Antworten für signierte Adressen.

## Datenschutz-Einstellungen

- **Anfrageprotokoll aufbewahren für** 24 Stunden, 7, 30 oder 90 Tage. Das Protokoll zeigt, welches Gerät nach welcher Adresse gefragt hat. Daraus entstehen die Weltkarte und die Listen der Übersicht.
- **Verbergen, welches Gerät gefragt hat** speichert gekürzte Adressen. Geräte lassen sich in der Oberfläche dann nicht mehr unterscheiden.
- **Alles Gesammelte löschen** leert das Protokoll und setzt alle Zähler zurück. Listen und Einstellungen bleiben. Das lässt sich nicht rückgängig machen.

## Was auf dem Gerät bleibt

Das Anfrageprotokoll, die Zähler, die Geräteliste, die Zeitpläne und deine Einstellungen. Nichts davon schickt NetSluice irgendwohin.

## Was das Gerät verlässt

| Was | Wohin | Wann |
|---|---|---|
| Anfragen, die der Filter durchlässt | der Auflöser, den du gewählt hast | jedes Mal, wenn ein Gerät eine Adresse nachschlägt, die nicht im Zwischenspeicher liegt |
| Aufgehaltene Adressen, um sie auf der Weltkarte einzuordnen | der ungefilterte Auflöser von Quad9 (`9.9.9.10`), als gewöhnliche, unverschlüsselte DNS-Anfrage | für eine aufgehaltene Adresse, höchstens einmal pro Stunde je Adresse |
| Eine Frage nach deiner eigenen öffentlichen Adresse, um dein Zuhause auf der Karte einzuordnen | der Nameserver von Google (`216.239.32.10`), als gewöhnliche, unverschlüsselte DNS-Anfrage | beim Start und etwa alle sechs Stunden |
| Filterlisten | die Betreiber der Listen, die du eingeschaltet hast | wenn die Listen aufgefrischt werden |
| Nachsehen nach einer neuen Version | GitHub. Es sieht deine Adresse und die installierte Version (als `User-Agent: NetSluice/<version>` mitgeschickt) | etwa einmal am Tag |
| Das Update selbst | GitHub | wenn du eins installierst, oder täglich, wenn du das eingeschaltet hast |
| Systemupdates | die Paketquellen des Systems (Debian, Armbian) | wenn du danach suchst oder sie installierst, oder jede Nacht, wenn du das eingeschaltet hast |
| Meldungen | der ntfy-Server oder Webhook, den du eingetragen hast | nur, wenn du sie eingeschaltet hast |

Die Uhr des Geräts stellt sich über den Zeitdienst von Debian selbst, wie auf jedem Debian-System.

Zu Hause ist das deine Entscheidung. Wenn andere dein Netz nutzen, sag es ihnen.

## Export und Import

Unter Einstellungen, **Export und Import**:

- **Exportieren** speichert Filterlisten, Auflöser, Datenschutz, Kinderregeln, LEDs und Meldungen in eine Datei (`netsluice-settings.json`). Nicht das Passwort, nicht das Protokoll. Die Datei enthält die Adresse für Meldungen, behalte sie also für dich.
- **Datei einlesen** ergänzt, was fehlt, und überschreibt die Einstellungen, die in der Datei stehen. Seitdem hinzugefügte Listen bleiben.
