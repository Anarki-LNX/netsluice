---
title: Notifications
description: Messages to your phone through ntfy or a webhook, when a new device appears, a dangerous host is stopped, or the filter stops answering.
lang: en
section: use
order: 33
updated: 2026-11-26
---

Under Settings, **Messages to your phone** tells you when something happens that you should know. It is off until you choose a way.

## Two ways

- **ntfy.** Install the ntfy app, subscribe to a topic, and enter its address, for example `https://ntfy.sh/your-topic`.
- **Webhook.** Each message is sent as JSON with `event`, `title` and `text` to the address you enter. Good for Home Assistant, Telegram bridges or your own scripts.

The address must start with `https://` or `http://`. "Send a test message" checks that it arrives.

## What it tells you

Each of these can be switched off on its own:

| Message | When |
|---|---|
| A new device uses the filter | a hardware address that was never seen before. On the very first run NetSluice only learns the devices that are there |
| A dangerous host was stopped | a hit on a malware or phishing list, at most once an hour per device and host |
| The filter does not answer | after a minute without an answer, and again when it is back |

## Privacy

**Messages leave your home through the service you choose**, including device names and host names. With ntfy, anyone who knows the name of your topic can read along, so pick one that cannot be guessed.

The address is kept on the device in a file only the service can read. It is also part of an [export](/en/docs/privacy-and-dns/#export-and-import), so treat an export file with the same care.
