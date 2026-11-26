---
title: Hardware notes
description: What is known about the Deeper Connect Mini (mini_v21), how it boots, how to probe a board, and the serial console.
lang: en
section: hardware
order: 40
updated: 2026-11-26
---

Everything here was read from one device with the board marking `mini_v21_20210521`. Treat it as a description of that revision. The full notes are in [`docs/hardware.md`](https://github.com/Anarki-LNX/netsluice/blob/main/docs/hardware.md).

## Overview

| Part | Finding |
|---|---|
| SoC | Rockchip RK3328, 4 × Cortex-A53, up to 1.3 GHz, AES/SHA extensions |
| RAM | 2 GB |
| Storage | 8 GB eMMC (Samsung), microSD slot |
| Ethernet 1 | RK3328 GMAC with a Motorcomm YT8521 PHY at MDIO address 3 |
| Ethernet 2 | Realtek RTL8153 on USB 3.0 |
| USB | one USB-A host port (USB 2.0), USB-C for power |
| Serial console | 3 pads marked `G TX RX` next to the microSD slot, 3.3 V, 1,500,000 baud |
| LEDs | green on gpio0 pin 2, red on gpio2 pin 18 |
| Button | reset key on gpio0 pin 0, shows up as a `gpio-keys` input |
| PMIC | RK805 |

Measured on Armbian with kernel 6.18:

| | |
|---|---|
| AES-256-GCM | about 520 MB/s on one core |
| ChaCha20-Poly1305 | about 215 MB/s on one core |
| eMMC sequential read | about 133 MB/s |
| microSD sequential read | about 24 MB/s |
| Idle temperature | 53 to 56 °C |

## What works and what does not

| | Status |
|---|---|
| Deeper Connect Mini, board `mini_v21_20210521` | Tested |
| Other revisions of the Mini | Untested |
| Deeper Connect Pico, Nano, Air | Not supported. Different hardware |
| Both Ethernet ports at 1 Gbit/s, LEDs, button | Tested |
| USB-C as a data port | Not supported. It still powers the device |

## How the device boots

The bootloader on the eMMC is U-Boot 2020.07 from an Armbian build. It tries the boot targets in this order:

```
boot_targets=mmc1 mmc0 usb0 pxe dhcp
```

`mmc1` is the microSD card and `mmc0` the eMMC, so the card is tried first. That is why a card is all NetSluice needs.

The vendor system on the eMMC is Armbian with kernel 5.9.11. Its root file system is LUKS-encrypted. NetSluice does not touch or need it.

## Three differences from a NanoPi R2S

A stock NanoPi R2S image starts the kernel but never comes up. NetSluice changes the device tree in three places:

1. **The microSD card disappears.** The NanoPi tree switches the card to 1.8 V through a regulator that is wired differently on this board. The fix runs the card at 3.3 V, as the vendor tree does.
2. **Wrong PHY address.** The PHY sits at address 3, not 1, with the vendor's reset timings.
3. **The PHY clock output is switched off.** A current kernel turns off the 125 MHz clock the network controller needs. The link comes up, but not a single packet is sent. The fix keeps the clock on.

The details, with the exact properties, are in [`docs/hardware.md`](https://github.com/Anarki-LNX/netsluice/blob/main/docs/hardware.md).

## Probing a board

Before you flash anything you can ask the bootloader what it is. The probe is a boot script that exports the U-Boot settings to a text file on the card and then lets the normal boot continue. It writes to the card only and changes nothing on the device.

```bash
python3 scripts/probe/mkscr.py scripts/probe/boot.cmd boot.scr
```

Format a card with one FAT32 partition, mark it bootable, copy `boot.scr` to its root, boot the device with it once, then read `probe-env.txt` from the card. On the tested board the interesting lines are:

```
board=evb_rk3328
soc=rk3328
fdtfile=rockchip/rk3328-nanopi-r2-rev00.dtb
boot_targets=mmc1 mmc0 usb0 pxe dhcp
baudrate=1500000
```

If yours match, NetSluice has a good chance of working. If no file appears, your bootloader does not run scripts from the card, and this method will not work as it is.

> `probe-env.txt` contains your device's serial number and MAC addresses. Remove them before you post the file anywhere.

## Serial console

Not needed for installation, useful for debugging. Use a 3.3 V USB-UART adapter that handles 1,500,000 baud. Connect `G`, `TX` and `RX` only, cross TX and RX, and **never connect the adapter's VCC pin**.

## Recovery

- The card is the only thing NetSluice writes to. Remove it and the device boots its original system.
- If a card stops booting after a kernel upgrade, see [Troubleshooting](/en/docs/troubleshooting/#a-card-stops-booting-after-a-kernel-upgrade).
