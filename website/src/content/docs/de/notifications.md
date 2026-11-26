---
title: Meldungen
description: Meldungen aufs Handy über ntfy oder einen Webhook, wenn ein neues Gerät auftaucht, eine gefährliche Adresse aufgehalten wird oder der Filter nicht mehr antwortet.
lang: de
section: use
order: 33
updated: 2026-11-26
---

Unter Einstellungen sagt dir **Meldungen aufs Handy** Bescheid, wenn etwas passiert, das du wissen solltest. Es ist aus, bis du einen Weg wählst.

## Zwei Wege

- **ntfy.** Installiere die ntfy-App, abonniere ein Thema und trag seine Adresse ein, zum Beispiel `https://ntfy.sh/dein-thema`.
- **Webhook.** Jede Meldung geht als JSON mit `event`, `title` und `text` an die Adresse, die du einträgst. Gut für Home Assistant, Telegram-Brücken oder eigene Skripte.

Die Adresse muss mit `https://` oder `http://` beginnen. „Testmeldung senden“ prüft, ob sie ankommt.

## Worüber es dich informiert

Jede dieser Meldungen lässt sich einzeln abschalten:

| Meldung | Wann |
|---|---|
| Ein neues Gerät nutzt den Filter | eine MAC, die noch nie gesehen wurde. Beim allerersten Durchlauf lernt NetSluice nur die Geräte, die schon da sind |
| Eine gefährliche Adresse wurde aufgehalten | ein Treffer auf einer Liste für Schadsoftware oder Phishing, höchstens einmal pro Stunde je Gerät und Adresse |
| Der Filter antwortet nicht | nach einer Minute ohne Antwort, und noch einmal, wenn er wieder da ist |

## Datenschutz

**Meldungen verlassen dein Haus über den Dienst, den du wählst**, mit Gerätenamen und Adressen. Bei ntfy kann jeder mitlesen, der den Namen deines Themas kennt. Wähl also einen, der sich nicht erraten lässt.

Die Adresse liegt auf dem Gerät in einer Datei, die nur der Dienst lesen kann. Sie steckt auch in einem [Export](/de/docs/privacy-and-dns/#export-und-import). Geh mit einer Exportdatei also genauso vorsichtig um.
