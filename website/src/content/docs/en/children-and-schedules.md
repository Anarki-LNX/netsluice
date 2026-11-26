---
title: Children and schedules
description: Internet on or off per device, by hand or by time of day, with extra time at the press of a button. And how a device can get around it.
lang: en
section: use
order: 32
updated: 2026-11-26
---

Under Settings, **Children and schedules** switches the internet on and off for chosen devices.

## Adding a device

Only devices that have used the filter appear in the list. Choose one and add it.

A device is known by its hardware address (MAC), so its rule follows it when it gets a new IP address. If no MAC is known, the rule is bound to the address, and the interface says so.

## Three modes

| Mode | What it does |
|---|---|
| Always on | the device is filtered as usual |
| By schedule | internet only on the days you choose, between two times. A new schedule starts with 15:00 to 19:00 |
| Off | no internet for this device |

A time window that runs over midnight belongs to the day it starts on.

## Extra time

**+30 minutes** and **+1 hour** give a device internet right now, whatever its mode says. "End extra time" takes it back.

## How it works, and its limit

A device that is switched off gets no answers from the filter. So nothing new loads. A page or video that is already open can keep running for a moment.

**A device with its own DNS setting gets around this.** It then does not ask NetSluice at all. The filter list "HaGeZi Encrypted DNS bypass" under Filters stops apps and devices from going around the filter with their own encrypted DNS. A device that is set to a plain DNS server by hand still gets around it.

Changes apply at once. The device checks the rules again every 20 seconds, so a schedule switches on time.
