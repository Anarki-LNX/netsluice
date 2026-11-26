---
title: Sicherheit
description: Die öffentliche Website und die Oberfläche auf deinem Gerät sind zwei getrennte Dinge. Was das Gerät schützt, was nicht, und wie du ein Problem meldest.
lang: de
updated: 2026-11-26
---

## Zwei getrennte Dinge

**Diese Website** besteht aus statischen Seiten. Sie hat keine Anmeldung, keine Formulare und keine Verbindung zu irgendeinem NetSluice-Gerät. Die Demo darauf läuft in deinem Browser, mit erfundenen Daten.

**Die Oberfläche deines NetSluice** liegt unter `http://netsluice.local/`, in deinem Heimnetz. Diese Website spricht nie mit ihr, und sie spricht nie mit dieser Website.

## Lass die Oberfläche zu Hause

Die Oberfläche ist für dein Heimnetz gemacht. **Leite sie nie ins Internet weiter**, und auch nicht den DNS-Port des Geräts. Konkret: Richte im Router keine Portweiterleitung für die Ports 80, 443 oder 53 auf das NetSluice ein.

Warum:

- **Wer zuerst kommt, legt das Passwort fest.** Ein Gerät, das erreichbar ist, bevor du eins gewählt hast, kann übernehmen, wer zuerst da ist.
- **Ein Passwort schützt alles.** Es gibt keine Benutzerkonten und keinen zweiten Faktor.
- **Der Filter beantwortet DNS auf jeder Adresse des Geräts**, und die Grenze des Motors von 20 Antworten pro Sekunde und Gerät ist aufgehoben, damit volle Seiten schnell laden. Im Internet wird so ein offener DNS-Server missbraucht.
- **NetSluice kann sich nicht selbst von außen erreichbar machen** und ist dafür nicht gebaut. Den Filter unterwegs zu nutzen, bräuchte einen Tunnel. Das ist eine Idee für später, keine Funktion.

## Was das Gerät schützt

Alles hier steht im Code des [Repositorys](https://github.com/Anarki-LNX/netsluice).

**Anmeldung**

- Das Passwort braucht mindestens 8 Zeichen. Es wird als gesalzener scrypt-Hash gespeichert.
- Nach fünf Fehlversuchen in fünf Minuten wartet die Anmeldung. Ein Smoke-Test (`tests/auth-smoke.sh`) prüft das.
- Eine Anmeldung ist ein zufälliges Token. Auf dem Gerät liegt nur sein Hash. Sie hält 30 Tage, und ihr Cookie ist `HttpOnly` und `SameSite=Strict`. Wer sich über HTTPS anmeldet, dessen Cookie wird nie über gewöhnliches HTTP geschickt.
- Eine Passwortänderung beendet alle anderen Anmeldungen.
- **Wähl das Passwort gleich nach dem ersten Start.** Ein Zurücksetzen per E-Mail gibt es nicht.

**Die Pforte davor**

- Der Webserver (Caddy) fragt den Dienst nach einer gültigen Anmeldung, bevor eine Anfrage den Filter-Motor oder den Dienst erreicht. Ohne Anmeldung erreichbar sind nur Anmelden und die erste Einrichtung, dazu die statischen Dateien der Oberfläche, in denen nichts Geheimes steht.
- Der Filter-Motor (AdGuard Home) und der NetSluice-Dienst lauschen nur auf `127.0.0.1`. Aus dem Netz sind sie nicht direkt erreichbar.

**Wenig Rechte**

- Der Dienst läuft als eigener Benutzer ohne Sonderrechte, mit den Schutzmaßnahmen von systemd (`NoNewPrivileges`, `ProtectSystem=strict`, `ProtectHome`, `PrivateTmp`).
- Root-Rechte hat nur ein kleiner Helfer. Er nimmt nur eine kurze Liste von Befehlen an, prüft jedes Argument, folgt keinen Verknüpfungen und verwirft jede Anfrage, die älter als 20 Sekunden ist, statt sie verspätet auszuführen.

**Keine Anmeldung am System darunter**

- Beim fertigen Abbild ist SSH aus, das Root-Konto gesperrt, und an den Konsolen meldet sich niemand an.
- SSH geht nur an, wenn du einen öffentlichen Schlüssel auf die Karte legst, und dann nur mit Schlüssel, nie mit Passwort.

**Updates**

- Neue Versionen kommen nur aus den Releases des Projekts auf GitHub, über HTTPS. Eine Umleitung weg von GitHub wird abgelehnt. Ein Download darf höchstens 30 MB groß sein.
- Das Archiv wird abgelehnt, wenn seine `VERSION`-Datei nicht zum Tag des Release passt, Oberfläche oder Dienst unvollständig sind oder sich die Python-Dateien nicht übersetzen lassen. Entpackt wird ohne Verknüpfungen, absolute Pfade oder Gerätedateien.
- Antwortet die neue Version nicht, kommt die vorherige zurück.

**Abbilder und ihr Inhalt**

- Zu jedem Abbild gibt es eine Datei mit der SHA-256-Prüfsumme.
- Beim Bau eines Abbilds wird AdGuard Home gegen die Prüfsummen seines Projekts geprüft und werden die Debian-Pakete gegen den Paketindex von Debian. `SOURCES.txt` im Paket des Abbilds nennt Herkunft und Prüfsumme jeder Datei.

**Der Bootloader**

- Sichern, Installieren und Zurückspielen beschreiben nie den Bootloader des Herstellers (Sektoren 64 bis 32767). Die Installation vergleicht diesen Bereich vorher und nachher. Das Zurückspielen prüft zuerst, ob die Sicherung unversehrt ist und zu diesem Bootloader gehört.

## Was es nicht gibt

- **Keine Signaturen.** Releases und Abbilder sind nicht signiert. Es gibt Prüfsummen, keine digitalen Signaturen.
- **Keine Benutzerkonten, kein zweiter Faktor.** Ein Passwort für alles.
- **HTTP bleibt an.** HTTPS ist freiwillig, und HTTP funktioniert daneben weiter.
- **Die Geräteregeln lassen sich umgehen.** Ein Gerät mit eigener DNS-Einstellung kommt am Filter und an Zeitplänen vorbei.

## Eine Schwachstelle melden

Das Repository hat noch keine eigene Sicherheitsrichtlinie.

- **Für alles Heikle** schreib an **hallo@loopout.tech**. Beschreib, was du gefunden hast, in welcher Version und wie man es sieht. Lass bitte etwas Zeit für eine Korrektur, bevor du Einzelheiten veröffentlichst.
- **Für alles andere** eröffne ein [Issue auf GitHub](https://github.com/Anarki-LNX/netsluice/issues). Lass dort funktionierende Angriffsdetails weg.

## Diese Website

Diese Website wird als statische Dateien ausgeliefert. Sie setzt keine Cookies, hat keine Formulare und lädt keine Skripte von Dritten. Die Seiten dürfen sich mit nichts verbinden außer mit dieser Website selbst. <!-- verify: CSP connect-src 'self' and the other headers in agent 3's Caddy config --> Die Release-Daten hier holt der Server beim Bauen der Website ab. Dein Browser spricht also nie mit der Schnittstelle von GitHub. Siehe [Datenschutz](/de/privacy/).
