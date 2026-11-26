---
title: HTTPS im eigenen Netz
description: Verschlüssel den Weg zwischen Browser und Gerät mit einem Zertifikat, das das Gerät selbst ausstellt. HTTP bleibt daneben erreichbar.
lang: de
section: use
order: 35
updated: 2026-11-26
---

Die Oberfläche funktioniert über gewöhnliches HTTP. Willst du den Weg zwischen Browser und Gerät verschlüsseln, schalte HTTPS unter Einstellungen, **Zugang**, ein.

## Was dann passiert

- Der Webserver im Gerät stellt ein Zertifikat für den Namen oder die Adresse aus, unter der du es öffnest.
- Sein Stammzertifikat steht zum Herunterladen bereit. Es heißt „Caddy Local Authority“, nach dem Webserver im Gerät (`netsluice-root.crt`).
- **HTTP bleibt erreichbar.** Browser werden nicht auf HTTPS umgeleitet. Niemand wird von einem Browser ausgesperrt, der dem Zertifikat misstraut.
- Startet der Webserver mit der neuen Einstellung nicht, kommt die vorherige zurück.
- Wer sich über HTTPS anmeldet, dessen Anmeldung wird nie über gewöhnliches HTTP geschickt.

## Die Warnung des Browsers abstellen

Solange ein Gerät das Stammzertifikat nicht kennt, warnt sein Browser, die Verbindung sei nicht privat. Verschlüsselt ist sie trotzdem. Der Browser weiß nur nicht, wer unterschrieben hat.

1. Lade das Stammzertifikat unter Einstellungen, Zugang, herunter.
2. Importier es einmal auf jedem Rechner und Handy, im Browser oder in den Systemeinstellungen unter „Zertifizierungsstellen“. Vertrau ihm für Websites.
3. Vergleich den Fingerabdruck. Die Oberfläche zeigt den SHA-256-Fingerabdruck des Stammzertifikats, damit du prüfen kannst, ob du das richtige importiert hast.

## Bleib damit zu Hause

HTTPS schützt hier den Weg innerhalb deines eigenen Netzes. Es macht die Oberfläche nicht fit fürs Internet. Leite die Oberfläche nie ins Internet weiter. Siehe [Sicherheit](/de/security/).
