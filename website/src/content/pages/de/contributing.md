---
title: Mitmachen
description: Berichte von anderen Platinen, Fehlerberichte, Ideen und Pull Requests. Was hineingehört und wie du testest.
lang: de
updated: 2026-11-26
---

NetSluice ist jung und wurde auf einem Gerät getestet. Jeder Bericht von einem anderen Gerät macht es besser, gerade die, bei denen etwas schiefgeht.

Alles läuft über GitHub: [Issues](https://github.com/Anarki-LNX/netsluice/issues) für Berichte und Ideen, [Pull Requests](https://github.com/Anarki-LNX/netsluice/pulls) für Änderungen. Ein Forum oder einen Chat gibt es nicht.

## Einen Fehler melden

Eröffne ein [Issue](https://github.com/Anarki-LNX/netsluice/issues/new) und schreib hinein:

- **die Version**, aus Einstellungen, Updates,
- **was du gemacht hast**, Schritt für Schritt,
- **was du erwartet hast, und was stattdessen passiert ist**,
- ob NetSluice **von der Karte oder vom internen Speicher** läuft,
- bei einem Problem beim ersten Start: was die LEDs gemacht haben, den Text auf der Einrichtungsseite und, wenn möglich, `/var/lib/netsluice-setup/setup.log` von der Karte.

Sieh dir Text, den du einfügst, vorher an. Er kann Namen deiner Geräte oder Adressen aus deinem Netz enthalten.

**Sicherheitsprobleme:** Lass die Einzelheiten aus öffentlichen Issues heraus und schreib an hallo@loopout.tech. Siehe [Sicherheit](/de/security/).

## Eine andere Platine melden

Berichte von anderen Versionen des Deeper Connect Mini helfen am meisten. Bitte nenn:

- **die Platinenbezeichnung**, die auf der Platine aufgedruckt ist,
- **`probe-env.txt`** aus der [Abfrage](/de/docs/hardware/#eine-platine-abfragen). Sie enthält die Seriennummer und die MAC-Adressen deines Geräts. **Entfern sie, bevor du die Datei veröffentlichst.**
- **was funktioniert hat und was nicht**: Start von der Karte, beide Ethernet-Anschlüsse, LEDs, Taster,
- **Protokolle**, wenn du welche hast: das Protokoll des ersten Starts oder die Ausgabe der [seriellen Konsole](/de/docs/hardware/#serielle-konsole).

## Ideen

Eröffne ein Issue und beschreib, wofür du es nutzen würdest. Würdest du den [WireGuard-Tunnel](https://github.com/Anarki-LNX/netsluice#an-idea-for-later-the-tunnel) nutzen, sag es dort. Er ist eine Idee für später und noch nicht geplant.

## Pull Requests

- Lies zuerst [`docs/development.md`](https://github.com/Anarki-LNX/netsluice/blob/main/docs/development.md) (englisch). Dort steht, wie die Teile zusammenspielen.
- **Halt es klein.** Der Dienst nutzt nur die Standardbibliothek von Python. Die Oberfläche hat kein Framework und keinen Build-Schritt.
- **Texte in beiden Sprachen.** Schreib den englischen Text zuerst und stell den deutschen daneben in `web/app.js`.
- **Lass die Tests** in `tests/` laufen:

  ```bash
  bash tests/auth-smoke.sh
  bash tests/settings-smoke.sh
  bash tests/caddyfile.sh
  ```

  Sie brauchen `python3`, `curl` und `openssl` und laufen auf deinem eigenen Rechner. Tests für die Oberfläche gibt es noch nicht.
- **Probier die Oberfläche** ohne Gerät aus: `python3 scripts/demo.py`.
- **Vorsicht mit dem Netz.** Ein NetSluice im Einsatz ist der DNS-Server eines Haushalts. Teste Änderungen an Adressen oder an netplan nicht auf einem Gerät, auf das Menschen angewiesen sind.

## Gesucht

Aus der Liste des Projekts:

- Berichte von anderen Platinenversionen,
- Tests für die Oberfläche,
- Unterstützung der Platine in Armbian.

## Lizenz von Beiträgen

Das Projekt steht unter der MIT-Lizenz. Beiträge erscheinen unter derselben Lizenz.
