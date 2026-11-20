#!/usr/bin/env python3
"""Adapt Armbian's NanoPi R2 device tree to the Deeper Connect Mini board (mini_v21).

Input : a decompiled rk3328-nanopi-r2-rev00.dtb   (dtc -I dtb -O dts)
Output: the same tree with the board differences applied.

The differences were found by comparing against the device tree the vendor
firmware ships on the eMMC (kernel 5.9.11). Every edit asserts that it matched,
so an unexpected input fails loudly instead of producing a half-patched tree.

Usage: patch_dts.py in.dts out.dts [phy-mode]
"""
import re, sys
src, dst = sys.argv[1], sys.argv[2]
phy_mode = sys.argv[3] if len(sys.argv) > 3 else "rgmii-rxid"
t = open(src).read()

def node(text, header_re):
    m = re.search(header_re, text)
    assert m, header_re
    i = text.index("{", m.start()); d = 0; j = i
    while True:
        if text[j] == "{": d += 1
        elif text[j] == "}":
            d -= 1
            if d == 0: break
        j += 1
    return m.start(), j + 1

def edit(text, header_re, fn):
    a, b = node(text, header_re)
    new = fn(text[a:b])
    assert new != text[a:b], "edit did not match: " + header_re
    return text[:a] + new + text[b:]

# 1) SD card: fixed 3.3 V like the vendor tree. With UHS (1.8 V) signalling the kernel
#    loses the card right after boot and never mounts the root filesystem.
vcc_sd = re.search(r"vcc_sd: regulator-sdmmc \{.*?phandle = <(0x[0-9a-f]+)>;", t, re.S).group(1)
def sd(n):
    n = re.sub(r"\n\s*sd-uhs-sdr50;", "", n)
    n = re.sub(r"\n\s*sd-uhs-sdr104;", "", n)
    return re.sub(r"vqmmc-supply = <0x[0-9a-f]+>;", f"vqmmc-supply = <{vcc_sd}>;", n)
t = edit(t, r"sdmmc: mmc@ff500000 \{", sd)

# 2) GMAC: the PHY sits at MDIO address 3 (not 1), rx_delay 0, vendor reset timings.
def gmac(n):
    n = n.replace("rtl8211e: ethernet-phy@1 {", "rtl8211e: ethernet-phy@3 {")
    n = n.replace("reg = <0x01>;", "reg = <0x03>;")
    n = n.replace("rx_delay = <0x18>;", "rx_delay = <0x00>;")
    # rgmii-rxid is the mode that passed a loopback test between both ports
    # (5000 x 1400-byte pings, no loss). The other RGMII modes passed no traffic.
    n = n.replace('phy-mode = "rgmii";', 'phy-mode = "%s";' % phy_mode)
    n = n.replace("snps,reset-delays-us = <0x00 0x2710 0x7530>;", "snps,reset-delays-us = <0x00 0x4e20 0xc350>;")
    n = n.replace("reset-assert-us = <0x2710>;", "reset-assert-us = <0x4e20>;")
    n = n.replace("reset-deassert-us = <0x7530>;", "reset-deassert-us = <0xc350>;")
    # The PHY is a Motorcomm YT8521, not an RTL8211E. The GMAC takes its 125 MHz clock from
    # the PHY's clock output. Without clk-out-frequency-hz the kernel driver switches that
    # output off: "Failed to reset the dma", TX watchdog resets, no packet ever leaves.
    n = n.replace("reg = <0x03>;", "reg = <0x03>;\n\t\t\t\tmotorcomm,auto-sleep-disabled;\n\t\t\t\tmotorcomm,keep-pll-enabled;\n\t\t\t\tmotorcomm,clk-out-frequency-hz = <125000000>;")
    n = n.replace("rtl8211e: ethernet-phy@3 {", "yt8521: ethernet-phy@3 {")
    return n
t = edit(t, r"gmac2io: ethernet@ff540000 \{", gmac)

# 3) Enable eMMC and PWM2, as in the vendor tree.
on = lambda n: n.replace('status = "disabled";', 'status = "okay";', 1)
t = edit(t, r"emmc: mmc@ff520000 \{", on)
t = edit(t, r"pwm2: pwm@ff1b0020 \{", on)

# 4) LEDs: the board has a green (gpio0 pin 2) and a red (gpio2 pin 0x12) LED only.
def leds(n):
    a, b = node(n, r"led@2 \{")
    assert n[b] == ";"
    n = n[:a].rstrip("\t ") + n[b+1:].lstrip("\n")        # the NanoPi lan_led pin is not an LED on this board
    n = n.replace('label = "status_led";', 'label = "led_green";')
    n = n.replace('label = "wan_led";', 'label = "led_red";')
    return n
t = edit(t, r"leds: gpio-leds \{", leds)

# 5) SD voltage select: the vendor tree uses gpio0 pin 0x1b, not gpio1 pin 0x1c.
gpio0 = re.search(r"gpio0: gpio@ff210000 \{.*?phandle = <(0x[0-9a-f]+)>;", t, re.S).group(1)
t = edit(t, r"vccio_sd: sdmmcio-regulator \{", lambda n: re.sub(r"gpios = <0x[0-9a-f]+ 0x1c 0x00>;", f"gpios = <{gpio0} 0x1b 0x00>;", n))

t = t.replace('model = "FriendlyElec NanoPi R2S";', 'model = "Deeper Connect Mini (mini_v21)";', 1)
open(dst, "w").write(t)
print("patched:", dst, "phy-mode", phy_mode)
