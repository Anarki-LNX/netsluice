---
title: Hardware-Notizen
description: Was über den Deeper Connect Mini (mini_v21) bekannt ist, wie er startet, wie du eine Platine abfragst, und die serielle Konsole.
lang: de
section: hardware
order: 40
updated: 2026-11-26
---

Alles hier wurde an einem Gerät mit der Platinenbezeichnung `mini_v21_20210521` ausgelesen. Versteh es als Beschreibung dieser Version. Die vollständigen Notizen stehen in [`docs/hardware.md`](https://github.com/Anarki-LNX/netsluice/blob/main/docs/hardware.md) (englisch).

## Überblick

| Teil | Befund |
|---|---|
| SoC | Rockchip RK3328, 4 × Cortex-A53, bis 1,3 GHz, AES/SHA-Erweiterungen |
| RAM | 2 GB |
| Speicher | 8 GB eMMC (Samsung), microSD-Steckplatz |
| Ethernet 1 | RK3328 GMAC mit einem Motorcomm-YT8521-PHY an MDIO-Adresse 3 |
| Ethernet 2 | Realtek RTL8153 an USB 3.0 |
| USB | ein USB-A-Anschluss (USB 2.0), USB-C für den Strom |
| Serielle Konsole | 3 Lötpunkte mit der Aufschrift `G TX RX` neben dem microSD-Steckplatz, 3,3 V, 1.500.000 Baud |
| LEDs | grün an gpio0 Pin 2, rot an gpio2 Pin 18 |
| Taster | Reset-Taste an gpio0 Pin 0, erscheint als `gpio-keys`-Eingabe |
| PMIC | RK805 |

Gemessen unter Armbian mit Kernel 6.18:

| | |
|---|---|
| AES-256-GCM | etwa 520 MB/s auf einem Kern |
| ChaCha20-Poly1305 | etwa 215 MB/s auf einem Kern |
| eMMC, sequenziell lesen | etwa 133 MB/s |
| microSD, sequenziell lesen | etwa 24 MB/s |
| Temperatur im Leerlauf | 53 bis 56 °C |

## Was geht und was nicht

| | Status |
|---|---|
| Deeper Connect Mini, Platine `mini_v21_20210521` | Getestet |
| Andere Versionen des Mini | Ungetestet |
| Deeper Connect Pico, Nano, Air | Nicht unterstützt. Andere Hardware |
| Beide Ethernet-Anschlüsse mit 1 Gbit/s, LEDs, Taster | Getestet |
| USB-C als Datenanschluss | Nicht unterstützt. Er versorgt das Gerät weiter mit Strom |

## Wie das Gerät startet

Der Bootloader auf der eMMC ist U-Boot 2020.07 aus einem Armbian-Build. Er probiert die Startziele in dieser Reihenfolge:

```
boot_targets=mmc1 mmc0 usb0 pxe dhcp
```

`mmc1` ist die microSD-Karte und `mmc0` die eMMC. Die Karte kommt also zuerst dran. Deshalb braucht NetSluice nur eine Karte.

Das Herstellersystem auf der eMMC ist Armbian mit Kernel 5.9.11. Sein Wurzeldateisystem ist mit LUKS verschlüsselt. NetSluice fasst es nicht an und braucht es nicht.

## Drei Unterschiede zum NanoPi R2S

Ein unverändertes NanoPi-R2S-Abbild startet den Kernel, kommt aber nie hoch. NetSluice ändert die Hardware-Beschreibung (Device Tree) an drei Stellen:

1. **Die microSD-Karte verschwindet.** Die NanoPi-Beschreibung schaltet die Karte über einen Spannungsregler auf 1,8 V, der auf dieser Platine anders verdrahtet ist. Die Korrektur betreibt die Karte mit 3,3 V, wie die Beschreibung des Herstellers.
2. **Falsche PHY-Adresse.** Der PHY sitzt an Adresse 3, nicht 1, mit den Reset-Zeiten des Herstellers.
3. **Der Taktausgang des PHY ist abgeschaltet.** Ein aktueller Kernel schaltet den 125-MHz-Takt ab, den der Netzwerk-Controller braucht. Die Verbindung steht, aber kein einziges Paket geht raus. Die Korrektur lässt den Takt an.

Die Einzelheiten mit den genauen Eigenschaften stehen in [`docs/hardware.md`](https://github.com/Anarki-LNX/netsluice/blob/main/docs/hardware.md).

## Eine Platine abfragen

Bevor du etwas aufspielst, kannst du den Bootloader fragen, was er ist. Die Abfrage ist ein Startskript, das die U-Boot-Einstellungen in eine Textdatei auf der Karte schreibt und dann den normalen Start weiterlaufen lässt. Es schreibt nur auf die Karte und ändert nichts am Gerät.

```bash
python3 scripts/probe/mkscr.py scripts/probe/boot.cmd boot.scr
```

Formatier eine Karte mit einer FAT32-Partition, markier sie als startfähig, kopier `boot.scr` in ihr Hauptverzeichnis, starte das Gerät einmal damit und lies dann `probe-env.txt` von der Karte. Auf der getesteten Platine sind das die interessanten Zeilen:

```
board=evb_rk3328
soc=rk3328
fdtfile=rockchip/rk3328-nanopi-r2-rev00.dtb
boot_targets=mmc1 mmc0 usb0 pxe dhcp
baudrate=1500000
```

Stimmen deine überein, hat NetSluice gute Chancen. Erscheint keine Datei, führt dein Bootloader keine Skripte von der Karte aus, und dieser Weg funktioniert so nicht.

> `probe-env.txt` enthält die Seriennummer und die MAC-Adressen deines Geräts. Entfern sie, bevor du die Datei irgendwo veröffentlichst.

## Serielle Konsole

Für die Installation nicht nötig, zur Fehlersuche nützlich. Nimm einen USB-UART-Adapter für 3,3 V, der 1.500.000 Baud schafft. Verbinde nur `G`, `TX` und `RX`, kreuze TX und RX, und **schließ nie den VCC-Pin des Adapters an**.

## Zurückkommen

- Die Karte ist das Einzige, worauf NetSluice schreibt. Zieh sie, und das Gerät startet sein Originalsystem.
- Startet eine Karte nach einem Kernel-Update nicht mehr, siehe [Probleme lösen](/de/docs/troubleshooting/#eine-karte-startet-nach-einem-kernel-update-nicht-mehr).
