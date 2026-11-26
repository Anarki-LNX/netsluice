---
title: Sichern und Installieren
description: Eine Kopie des Originalsystems behalten, NetSluice auf den internen Speicher bringen und die Kopie zurückspielen, wenn du es dir anders überlegst.
lang: de
section: install
order: 22
updated: 2026-11-26
---

NetSluice läuft von der microSD-Karte. Die Karte ist langsam (etwa 24 MB/s). Der interne Speicher (eMMC) liest etwa fünfmal so schnell. Unter Einstellungen bringt **Sichern und Installieren** NetSluice in drei Schritten dorthin.

> **Die Installation löscht das Originalsystem.** Mach zuerst die Sicherung und lade sie auf deinen Rechner.

Diese Schritte gehen nur, solange NetSluice von der Karte läuft. Es läuft immer nur eine Aufgabe, im Hintergrund, mit Fortschrittsbalken.

## 1. Internen Speicher sichern

Eine vollständige Kopie des internen Speichers wird gepackt auf die Karte geschrieben. Damit lässt sich das Gerät genau so wiederherstellen, wie es war.

- Die Oberfläche prüft zuerst, ob auf der Karte Platz ist. Im ungünstigsten Fall ist die Kopie so groß wie der Speicher. Ist kein Platz, nimm eine größere Karte, oder installiere ohne Sicherung.
- Wenn sie fertig ist, **lade sie zusätzlich herunter** (`netsluice-backup-internal-storage.img.gz`). Eine Karte kann kaputtgehen oder überschrieben werden.
- Die Sicherung bleibt auf der Karte. Sie wird nicht mit auf den internen Speicher kopiert.

## 2. Auf dem internen Speicher installieren

NetSluice wird von der Karte auf den internen Speicher kopiert, mit allem, was du eingerichtet hast. Was jetzt auf dem internen Speicher liegt, wird gelöscht.

- Du bestätigst das noch einmal. Ohne Sicherung startet es nur, wenn du „Ohne Sicherung installieren“ einschaltest.
- Es dauert ein paar Minuten. Der Filter pausiert gegen Ende für ein paar Sekunden.
- Danach wähl „Jetzt ausschalten“, zieh die Karte heraus und schließ den Strom wieder an. Das Gerät startet dann vom internen Speicher, und schneller.

## 3. Sicherung zurückspielen

Das schreibt die Sicherung von der Karte zurück auf den internen Speicher. Das Gerät ist dann wieder wie vorher und startet dieses System, sobald du die Karte ziehst.

- Die Sicherung wird zuerst geprüft. Ist sie beschädigt, wird nichts geschrieben.
- Sie geht nur auf einen Speicher derselben Größe zurück, von dem sie stammt.
- Nach dem Schreiben wird alles zurückgelesen und mit der Sicherung verglichen.

Ist NetSluice auf dem internen Speicher installiert, startet es von dort. Zurück zum Originalsystem kommst du, indem du das Gerät von einer NetSluice-Karte mit deiner Sicherung startest und die Sicherung dort zurückspielst.

## Der Bootloader wird nie beschrieben

Der Bootloader des Herstellers liegt in den ersten 16 MiB des internen Speichers, in den Sektoren 64 bis 32767. Geht er kaputt, lässt sich dieses Gerät nur schwer retten.

- Die Installation schreibt nie dorthin. Sie vergleicht diesen Bereich vorher und nachher und bricht ab, wenn er sich verändert hat.
- Auch das Zurückspielen einer Sicherung lässt diesen Bereich in Ruhe. Es prüft zuerst, ob der Bootloader auf dem Gerät derselbe ist wie in der Sicherung, und schreibt sonst nichts.

## Von Hand

Auf einem Gerät, das von der Karte läuft, als root:

```bash
CONFIRM=erase-emmc bash /usr/share/netsluice/service/netsluice-install.sh
```

Das erledigt nur Schritt 2. Eine Sicherung macht es nicht.
