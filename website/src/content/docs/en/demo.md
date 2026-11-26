---
title: Try the demo
description: The real interface with invented data, on your own computer or on this website. No device needed.
lang: en
section: start
order: 12
updated: 2026-11-26
---

You can look at the interface before you touch a device. The demo is the interface of NetSluice itself, fed with invented data: a made-up household, its devices and where they talk to.

## On this website

The [demo page](/en/demo/) runs the same interface in your browser. It is marked "Demo · invented data". It does not contact any device, and switches answer but change nothing.

## On your own computer

You need `python3` and a copy of the repository.

```bash
git clone https://github.com/Anarki-LNX/netsluice.git
cd netsluice
python3 scripts/demo.py
```

Then open `http://127.0.0.1:8099/`. Add `?lang=de` for German, or `?lang=en` for English.

To use another port, give it as the first argument:

```bash
python3 scripts/demo.py 8100
```

## What the demo is

- It serves the `web/` folder and answers every request of the interface with invented data.
- No device, no filter engine and no password are needed.
- Switches answer but change nothing.
- The screenshots in the README and on this website were taken from it.

## What the demo is not

It does not show your network, and the numbers mean nothing. On a real device, every figure comes from the filter's own log.
