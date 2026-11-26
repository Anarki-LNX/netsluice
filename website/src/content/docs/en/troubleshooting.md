---
title: Troubleshooting and recovery
description: What to do when the setup stops, the interface cannot be found, the filter fails, or a card no longer boots.
lang: en
section: hardware
order: 41
updated: 2026-11-26
---

## The way back always exists

The card is the only thing NetSluice writes to, unless you install it to the internal storage yourself. **Remove the card and the device starts its original system.**

If the household depends on the filter, set your router's DNS server back to what it was before. Then every device at home has name lookups again, whatever the state of the Mini.

## During the first start

| What you see | What it means |
|---|---|
| Green LED blinks | NetSluice is setting itself up. This takes a few minutes. Please do not unplug it |
| Green LED steady | Ready |
| Red LED steady | A step failed. It is tried again every minute |

While it works, the device shows a page with the current step at `http://netsluice.local/,` and what is wrong if a step fails. Everything is also written to `/var/lib/netsluice-setup/setup.log` on the card. It survives a power cut. You can read it on a Linux computer, since the card is ext4.

## The interface cannot be found

- Try the address your router shows for the device "netsluice" instead of `netsluice.local`.
- Check that the network cable goes to your router or a switch.

## Nothing is stopped

- The filter lists are downloaded as soon as the device reaches the internet. Until then nothing is stopped.
- Check under Filters that at least one list is switched on.
- Check that your router hands out the device's address as DNS server, or that the device you test with asks NetSluice directly.

## A device is not filtered

A device with its own DNS setting does not ask NetSluice and gets around the filter. The list "HaGeZi Encrypted DNS bypass" under Filters stops apps and devices that use their own encrypted DNS.

## The filter does not answer

If you switched on messages, NetSluice tells you after a minute without an answer from the filter engine. Your network may be without DNS then. Set the router's DNS back, or restart the device.

## An update did not work

The interface says what happened. If the new version did not start, the previous one was put back by itself. If an update failed earlier, the previous version keeps running. See [Updates](/en/docs/updates/).

## The wrong password, too often

After five wrong tries in five minutes, sign-in waits. Try again after five minutes. There is no reset by e-mail.

## A card stops booting after a kernel upgrade

The kernel packages are held on purpose, and after every package installation the adapted device tree is put back automatically. If a card still stops booting after a kernel upgrade, mount it on a computer and copy

```
/boot/deeper-connect-mini.dtb
```

over

```
/boot/dtb/rockchip/rk3328-nanopi-r2-rev00.dtb
```

## Going back to the original system after an installation

If you installed NetSluice to the internal storage, start the device from a NetSluice card that holds your backup and put the backup back. See [Back up and install](/en/docs/backup-and-install/).

## Still stuck

The [serial console](/en/docs/hardware/#serial-console) shows what the device does while it starts. Then open an [issue on GitHub](https://github.com/Anarki-LNX/netsluice/issues) and say what you see. See [Contributing](/en/contributing/) for what helps.
