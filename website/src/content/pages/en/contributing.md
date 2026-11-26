---
title: Contributing
description: Reports from other boards, bug reports, ideas and pull requests. What to include, and how to test.
lang: en
updated: 2026-11-26
---

NetSluice is young and was tested on one device. Every report from another device makes it better, especially the ones where something fails.

All of it happens on GitHub: [issues](https://github.com/Anarki-LNX/netsluice/issues) for reports and ideas, [pull requests](https://github.com/Anarki-LNX/netsluice/pulls) for changes. There is no forum or chat.

## Reporting a bug

Open an [issue](https://github.com/Anarki-LNX/netsluice/issues/new) and include:

- **the version**, from Settings, Updates,
- **what you did**, step by step,
- **what you expected, and what happened instead**,
- whether NetSluice runs **from the card or from the internal storage**,
- for a problem during the first start: what the LEDs did, the text on the setup page, and if you can, `/var/lib/netsluice-setup/setup.log` from the card.

Look through the text you paste before you post it. It may contain names of your devices or addresses from your network.

**Security problems:** leave the details out of public issues and write to hallo@loopout.tech. See [Security](/en/security/).

## Reporting another board

Reports from other revisions of the Deeper Connect Mini help most. Please include:

- **the board marking** printed on the board,
- **`probe-env.txt`** from the [probe](/en/docs/hardware/#probing-a-board). It contains your device's serial number and MAC addresses. **Remove them before you post the file.**
- **what worked and what did not**: boot from the card, both Ethernet ports, LEDs, button,
- **logs**, if you have them: the first-start log, or the output of the [serial console](/en/docs/hardware/#serial-console).

## Ideas

Open an issue and describe what you would use it for. If you would use the [WireGuard tunnel](https://github.com/Anarki-LNX/netsluice#an-idea-for-later-the-tunnel), say so there. It is an idea for later and not planned yet.

## Pull requests

- Read [`docs/development.md`](https://github.com/Anarki-LNX/netsluice/blob/main/docs/development.md) first. It explains how the parts fit together.
- **Keep it small.** The service uses the Python standard library only. The interface has no framework and no build step.
- **Texts in both languages.** Write the English text first, and put the German one next to it in `web/app.js`.
- **Run the tests** in `tests/`:

  ```bash
  bash tests/auth-smoke.sh
  bash tests/settings-smoke.sh
  bash tests/caddyfile.sh
  ```

  They need `python3`, `curl` and `openssl` and run on your own computer. There are no tests for the interface yet.
- **Try the interface** without a device: `python3 scripts/demo.py`.
- **Be careful with the network.** A NetSluice in use is the DNS server of a household. Do not test changes to addresses or to netplan on a device people depend on.

## Wanted

From the project's own list:

- reports from other board revisions,
- tests for the interface,
- board support in Armbian.

## Licence of contributions

The project is under the MIT licence. Contributions are published under the same licence.
