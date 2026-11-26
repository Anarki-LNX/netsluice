# Entscheidungsvorlage: Was das Gerät von sich aus nach außen schickt

Stand 27.11.2026. Die Doku (README, Website) nennt die drei Punkte jetzt ehrlich. Ob das Produkt sie
ändern soll, entscheidet der Eigentümer. Am Code ist nichts geändert.

## 1. Aufgehaltene Namen gehen an Quad9 (für die Weltkarte)

`service/netsluiced.py`, `resolve_a()`: Für jeden aufgehaltenen Namen fragt das Gerät `9.9.9.10`
(Quad9, ungefiltert) per **unverschlüsseltem** DNS, wohin der Name gezeigt hätte. Zwischenspeicher
eine Stunde je Name. Quad9 und jeder auf dem Weg sehen also genau die Namen, die der Filter stoppt,
also auch Tracker- und Schadseiten-Namen aus dem Heimnetz.

| Möglichkeit | Folge |
|---|---|
| A. So lassen (nur dokumentiert) | kein Aufwand |
| B. Über den eingestellten DoH-Auflöser fragen | verschlüsselt, geht an denselben Anbieter wie alles andere; mittlerer Aufwand |
| C. Schalter „Aufgehaltene Adressen auf der Karte“ (aus = keine Abfrage) | Nutzer entscheidet; kleiner Aufwand |
| D. Ganz weglassen, aufgehaltene Namen ohne Land zeigen | Karte zeigt weniger Rot |

Empfehlung: **B + C**.

## 2. Frage nach der öffentlichen Adresse bei Google

`public_ip()`: beim Start und etwa alle sechs Stunden eine unverschlüsselte DNS-Abfrage an
`216.239.32.10` (`o-o.myaddr.l.google.com`). Google sieht die Adresse des Anschlusses, keine
Gerätenamen und keine Anfragen.

| Möglichkeit | Folge |
|---|---|
| A. So lassen | kein Aufwand |
| B. Schalter, aus = kein „Zuhause“-Punkt auf der Karte | kleiner Aufwand |
| C. Land von Hand einstellen statt abfragen | kleiner Aufwand, keine Abfrage nötig |

Empfehlung: **C, mit A als Voreinstellung bis dahin**.

## 3. Version im User-Agent der Update-Prüfung

`service/netsluice-root.py`: `User-Agent: NetSluice/<version>` bei der täglichen Abfrage an
`api.github.com`. GitHub verlangt einen User-Agent. Mit Version kann GitHub veraltete und damit
eventuell angreifbare Geräte erkennen. Ohne Version: `NetSluice`.

Empfehlung: **so lassen** (geringes Risiko, hilft beim Unterscheiden) oder auf `NetSluice` kürzen.
Ein Wort genügt.

## Zu entscheiden

- [ ] 1: A / B / C / D
- [ ] 2: A / B / C
- [ ] 3: lassen / kürzen

Nach der Entscheidung README und Website-Abschnitte (`website/src/content/docs/*/privacy-and-dns.md`,
`pages/*/privacy.md`, `faq/*/where-processed.md`) mitziehen.
