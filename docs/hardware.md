# Hardware notes: Deeper Connect Mini (mini_v21)

Everything here was read from one device with the board marking
`mini_v21_20210521`. Treat it as a description of that revision.

## Overview

| Part | Finding |
|---|---|
| SoC | Rockchip RK3328, 4 × Cortex-A53, up to 1.3 GHz, AES/SHA extensions |
| RAM | 2 GB |
| Storage | 8 GB eMMC (Samsung), microSD slot |
| Ethernet 1 | RK3328 GMAC with a **Motorcomm YT8521** PHY at MDIO address 3 |
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

## How the device boots

The bootloader on the eMMC is U-Boot 2020.07 from an Armbian build. It runs
the standard distro boot sequence with this order:

```
boot_targets=mmc1 mmc0 usb0 pxe dhcp
```

`mmc1` is the microSD card and `mmc0` the eMMC, so the card is tried first.
On each target U-Boot looks for `extlinux/extlinux.conf`, then `boot.scr.uimg`
and `boot.scr`, in `/` and `/boot/` of the first bootable partition. It loads
`rockchip/rk3328-nanopi-r2-rev00.dtb` as the device tree.

The vendor system on the eMMC is Armbian with kernel 5.9.11. Its root file
system is LUKS-encrypted; this project does not touch or need it.

## The three differences from a NanoPi R2S

A stock NanoPi R2S image starts the kernel but never comes up. The green LED
blinks, yet nothing appears on the network and the card shows no sign of a
first boot. These are the causes, in the order you run into them.

### 1. The microSD card disappears

*Symptom:* kernel runs (heartbeat LED), the root file system is never mounted,
the partition is not resized, no logs are written.

The NanoPi tree enables UHS modes and switches the card to 1.8 V signalling
through a GPIO-controlled regulator. On this board that regulator is wired to
a different pin, so the card is lost after the switch. The vendor tree simply
runs the card at 3.3 V.

*Fix:* drop `sd-uhs-sdr50` and `sd-uhs-sdr104`, supply `vqmmc` from the fixed
3.3 V rail, and point the `vccio_sd` regulator at gpio0 pin 27.

### 2. Wrong PHY address

*Symptom:* not observed on its own, because the address was corrected from
the vendor tree before the network was first tested. With the NanoPi value the
kernel would look for the PHY at an address where there is none.

*Fix:* PHY `reg = <3>` instead of `<1>`, `rx_delay = <0>`, and the vendor's
reset timings (20 ms assert, 50 ms deassert).

### 3. The PHY clock output is switched off

*Symptom:* this one is easy to misread. The link comes up at 1 Gbit/s, but:

```
rk_gmac-dwmac ff540000.ethernet end0: Failed to reset the dma, device will work with reduced throughput
rk_gmac-dwmac ff540000.ethernet end0: NETDEV WATCHDOG: CPU: 2: transmit queue 0 timed out
rk_gmac-dwmac ff540000.ethernet end0: Reset adapter.
```

It repeats every ten seconds and not a single packet is transmitted.

The GMAC takes its 125 MHz clock from the PHY's clock output. The vendor
kernel has no Motorcomm driver at all, so the PHY runs on its power-on
defaults, which provide that clock. A current kernel does have the driver,
and without a `motorcomm,clk-out-frequency-hz` property it turns the output
off.

*Fix:* on the PHY node

```dts
motorcomm,clk-out-frequency-hz = <125000000>;
motorcomm,keep-pll-enabled;
motorcomm,auto-sleep-disabled;
```

and `phy-mode = "rgmii-rxid"`. With the clock fixed, `rgmii-rxid` was the
first mode tried and passed a loopback test between both ports (5000 pings of
1400 bytes, no loss, no errors). The other RGMII modes were only tried before
the clock fix, when nothing could work, so they are untested rather than
known bad.

### Smaller changes

- eMMC and PWM2 are enabled, as in the vendor tree.
- The NanoPi's `lan_led` is removed; that pin is not an LED here.

## Probing a board

Before flashing anything you can ask the bootloader what it is. The probe is
a boot script that exports the U-Boot environment to a text file on the card
and then lets the normal boot continue. It writes to the card only.

```bash
python3 scripts/probe/mkscr.py scripts/probe/boot.cmd boot.scr
```

Format a card with one FAT32 partition, mark it bootable, copy `boot.scr` to
its root, boot the device with it once, then read `probe-env.txt` from the
card. On the tested board the interesting lines are:

```
board=evb_rk3328
soc=rk3328
fdtfile=rockchip/rk3328-nanopi-r2-rev00.dtb
boot_targets=mmc1 mmc0 usb0 pxe dhcp
baudrate=1500000
```

If yours match, the image from this repository has a good chance of working.
If no file appears, your bootloader does not run scripts from the card and
this method will not work as is.

`probe-env.txt` contains your device's serial number and MAC addresses.
Remove them before you post the file anywhere.

## Serial console

Not needed for installation, useful for debugging. Use a 3.3 V USB-UART
adapter that handles 1,500,000 baud, connect `G`, `TX` and `RX` only (cross TX
and RX), and never connect the adapter's VCC pin.

## Recovery

- The card is the only thing this project writes to. Remove it and the device
  boots its original system.
- If a card stops booting after a kernel upgrade, mount it on a computer and
  copy `/boot/deeper-connect-mini.dtb` over
  `/boot/dtb/rockchip/rk3328-nanopi-r2-rev00.dtb`.
