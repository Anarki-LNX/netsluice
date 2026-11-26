---
title: First steps in the interface
description: Sign in, read the overview, choose filter lists and find your way around the devices, the world map and the settings.
lang: en
section: use
order: 30
updated: 2026-11-26
---

Open **`http://netsluice.local/`**, or the address your router shows for the device "netsluice".

## Sign in

- **The first visitor chooses the password.** Do it right away. Use 8 characters or more.
- There is no reset by e-mail. Keep the password safe.
- After five wrong tries in five minutes, sign-in waits. Try again after five minutes.
- A session lasts 30 days. Under Settings, Access, you can sign out or change the password. Changing it signs out every other browser.

## The top bar

- **Filter on / off.** One click pauses the filter for ten minutes. It then shows when it comes back, and "Keep it off" if you want it to stay off.
- **Live** with a pulsing point while the device feeds the page. It turns to "Offline" when it does not.
- A hint when a new version of NetSluice is available.
- The language switch (English, German) and the half circle for dark and light.

## Overview

Lookups arrive blue, are checked inside the sluice, and leave green or burst in red. Below the live view: the last 24 hours as bars per hour, the share that was stopped, the devices that were stopped most often, and the names that were stopped most recently and most often.

## Devices

Every device that asked the filter in the last 24 hours. The one with the most stopped requests comes first. NetSluice names a device from what the router knows about it, from what the device announces on the network (mDNS), and from the maker of its network card. Where a device announces it, you also see model and firmware. A randomised ("private") hardware address is shown as such.

**A click on a device** opens its page: requests per hour, the names stopped and let through most often, which list stopped them, the kinds of request, and the newest requests one by one.

## Filters

A list names hosts that should not be reachable. NetSluice reads the same list formats as AdGuard Home and Pi-hole.

- One switch per list.
- A choice of well-known lists, each with a line about what it covers.
- **Add another list**: paste the address of any hosts file or adblock-style list.
- **Update all now** refreshes every list, with a progress bar.

Larger lists need more memory. The full HaGeZi Threat Intelligence feed alone needs about 500 MB, as its description in the list says.

## World map

Where your network talks to, drawn the moment it happens, with the countries ranked by traffic over the last 24 hours. Red ones were stopped.

Two things to know when you read it:

- **The country is where the answering server is registered.** Large networks answer from the nearest data centre. Much of what is shown for the USA may never leave Europe.
- **The map counts fewer requests than the overview.** It only covers IPv4 and counts one event per `A` lookup. It is not a record of every connection.

## Settings

Each tile opens its own page:

| Tile | What it holds |
|---|---|
| Children and schedules | internet on or off per device. See [Children and schedules](/en/docs/children-and-schedules/) |
| Secure DNS | the resolver the filter asks, DNS over HTTPS, DNSSEC. See [Privacy and encrypted DNS](/en/docs/privacy-and-dns/) |
| Privacy | how long the request log is kept, hiding which device asked, deleting everything collected |
| Access | password, sign-out, HTTPS. See [HTTPS in your own network](/en/docs/https/) |
| Button and LEDs | what the device itself shows and does |
| Messages to your phone | ntfy or webhook. See [Notifications](/en/docs/notifications/) |
| Appearance | design, dark or light, size, accent colour, animations. For this browser only |
| Export and import | take your setup to a file and back |
| Network | the device's name. The address is shown but cannot be changed here yet |
| Updates | NetSluice itself and the system underneath. See [Updates](/en/docs/updates/) |
| Back up and install | see [Back up and install](/en/docs/backup-and-install/) |

## Button and LEDs

- **Green** blinks while the device runs.
- **Red** flashes for every stopped request, if you leave that on.
- **LEDs**: on, off, or off at night between two times you choose.
- **The button** on the device pauses the filter for ten minutes. A second press switches it back on. The red LED blinks three times as a receipt. You can switch the button off.

## Appearance

Three designs, each in dark and light: **Sluice** (the original: deep water, green tiles), **Glass** (frosted panes over soft colour) and **Graphite** (calm and flat, the overview becomes a stage with your devices). Also a size, an accent colour, and animations on or off. These choices are kept in this browser only.
