---
title: Was du brauchst
description: Das Gerät, eine microSD-Karte, ein Netzwerkkabel, einen Rechner zum Beschreiben der Karte und einen Router, bei dem du den DNS-Server einstellen kannst.
lang: de
section: start
order: 11
updated: 2026-11-26
---

## Für das fertige Abbild

- **Einen Deeper Connect Mini.** Getestet wurde NetSluice auf einer Platine mit der Bezeichnung `mini_v21_20210521`. Andere Versionen des Mini sind ungetestet. Pico, Nano und Air sind andere Hardware und werden nicht unterstützt.
- **Eine microSD-Karte mit 8 GB oder mehr.**
- **Ein Netzwerkkabel** vom Mini zu deinem Router.
- **Irgendeinen Rechner**, um die Karte zu beschreiben, mit [balenaEtcher](https://etcher.balena.io/) oder dem Raspberry Pi Imager.
- **Einen Router, bei dem du den DNS-Server einstellen kannst.** NetSluice filtert die Geräte, die es fragen. Am einfachsten trägst du seine Adresse im Router als DNS-Server ein.
- **Internet, später.** Die Einrichtung beim ersten Start braucht keins, das Abbild bringt alles mit. Die Filterlisten werden geladen, sobald das Gerät das Internet erreicht.

## Wenn du eine Sicherung auf der Karte behalten willst

Bevor du NetSluice auf den internen Speicher bringst, kann die Oberfläche eine vollständige Kopie des internen Speichers (8 GB beim getesteten Gerät) auf die Karte schreiben. Im ungünstigsten Fall ist die Kopie so groß wie der Speicher selbst. Die Oberfläche prüft den freien Platz, bevor sie anfängt, und sagt dir, wie viel frei sein muss. Eine größere Karte hilft.

## Bevor du anfängst

- **Deine Wallet.** Wenn auf deinem Gerät eine Wallet liegt, sorg dafür, dass du ihre Seed-Phrase oder den Keystore hast. NetSluice von der Karte zu starten, ändert nichts am Gerät. Die Installation auf den internen Speicher löscht das Originalsystem.
- **SSH (optional).** Um dich am System darunter anzumelden, legst du einen öffentlichen Schlüssel auf die Karte. Die Karte ist ext4, dafür brauchst du einen Linux-Rechner. Siehe [SSH-Zugang](/de/docs/ssh/).

## Zum Selberbauen

Einen Linux-Rechner, eine microSD-Karte mit 16 GB oder mehr und `python3`, `dtc`, `e2fsprogs`, `util-linux` und `xz`. Siehe [Selbst bauen](/de/docs/build-from-source/).

## Gewährleistung

Es gibt keine. Du veränderst ein Netzwerkgerät auf eigenes Risiko, und ein Filter, der ausfällt, nimmt die Namensauflösung deines Netzes mit.
