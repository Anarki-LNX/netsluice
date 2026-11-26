---
title: Privacy
description: What this website does with your data, what stays on your NetSluice, and which outside services come into play.
lang: en
updated: 2026-11-26
---

Four things are easy to mix up. This page keeps them apart: this website, your NetSluice device, the notification services you may choose, and GitHub and PayPal.

## 1. This website

This website is a set of static pages. It has

- **no cookies,**
- **no analytics and no tracking,**
- **no forms and no accounts,**
- **no third-party scripts.** The fonts are served from this site itself, not from Google or any other font service.

The connection is encrypted (HTTPS).

The server is operated by LOOP OUT TECH. Who that is and how to reach them is in the [imprint](https://loopout.tech/impressum). The web server keeps **no access logs**. It only logs certificate events and requests that caused a server error.

**Release data.** The downloads and changelog pages show the releases of NetSluice from GitHub. The server fetches them when the site is built. Your browser never contacts GitHub's API, and GitHub does not learn that you looked.

**The live demo** runs entirely in your browser, with invented data. It contacts no device and no outside service. Like the real interface, it remembers your choice of language and appearance in your browser's local storage. That stays in your browser and is never sent anywhere. <!-- verify: demo mock keeps web/app.js localStorage keys and makes no requests beyond its own origin -->

The general privacy policy of LOOP OUT TECH is at [loopout.tech/datenschutz](https://loopout.tech/datenschutz).

## 2. Your NetSluice device

NetSluice sees which device on your network asks for which host. That is how a DNS filter works. The request log, the counters, the device list, the schedules and your settings **stay on the device**. This website and its operator never receive any of it.

A few things leave the device by design: lookups the filter lets through go to the resolver you chose, stopped names are looked up at Quad9's unfiltered resolver to place them on the world map, and the device asks Google's name server for your public address about every six hours. The [privacy guide](/en/docs/privacy-and-dns/) lists every one of these, and the settings you have.

At home this is your call. If other people use your network, tell them.

## 3. Notification services you choose

Messages to your phone are off until you switch them on. If you do, they leave your home through the service you chose (an ntfy server or a webhook), including device names and host names. That service has its own privacy policy.

## 4. GitHub and PayPal

- **Updates.** About once a day your NetSluice asks GitHub whether there is a new version. GitHub sees your address and the installed version. Updates and filter lists are downloaded from their sources.
- **Downloads.** When you click a download link on this site, your browser fetches the file from GitHub.
- **Donations.** The donate link leads to PayPal. Nothing is sent to PayPal until you click it.

GitHub and PayPal are separate services with their own privacy policies.
