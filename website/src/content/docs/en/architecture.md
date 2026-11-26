---
title: Architecture for developers
description: How the interface, the web server, the filter engine, the service and the root helper fit together, and how to work on them.
lang: en
section: develop
order: 51
updated: 2026-11-26
---

The full developer notes are in [`docs/development.md`](https://github.com/Anarki-LNX/netsluice/blob/main/docs/development.md).

## How the parts fit together

```
 browser ──HTTP──▶ Caddy :80 ──┬─ static files            web/
                               ├─ /auth/*  ─────────────▶ netsluiced :3002   (no session needed)
                               └─ /control/*, /api/*
                                    │  forward_auth: GET /auth/check on netsluiced
                                    ├─ /control/* ──────▶ AdGuard Home :3001  (the filter engine)
                                    └─ /api/*     ──────▶ netsluiced :3002

 devices ──DNS :53──▶ AdGuard Home

 netsluiced ──request file──▶ netsluice-root (started by systemd, runs as root)
```

- **AdGuard Home** does the filtering. It listens for DNS on every address and for its API on localhost only. It has no account of its own: with one, it checks a bcrypt hash on every request, which costs 0.4 s each on this CPU.
- **Caddy** serves the interface and lets nothing through to the engine or the service without a valid session.
- **netsluiced** (`service/netsluiced.py`) is everything the engine does not do: sign-in, the world map, device recognition, schedules, LEDs and button, messages, and the hand-over to the helper for updates, storage and HTTPS. One Python file, standard library only, no privileges. Its header lists the sections and the HTTP interface.
- **netsluice-root** (`service/netsluice-root.py`) is the only part with root rights. The service drops a request file, and systemd starts the helper. The helper accepts a short list of commands and validates every argument. Requests older than 20 seconds are dropped, never carried out late.
- **The interface** (`web/`) is plain HTML, CSS and JavaScript modules. No framework, no build step. `app.js` holds the texts in both languages and the logic of every section. `sluice.js`, `worldmap.js` and `scene.js` draw on canvases.

## Layout

| Path | What |
|---|---|
| `web/` | the interface |
| `service/` | `netsluiced.py`, the root helper, and `netsluice-install.sh`, which moves the system from the card to the eMMC |
| `provision/install-stack.sh` | turns a running Armbian into a NetSluice. Safe to run again |
| `scripts/build-image.sh` | adapts a stock Armbian image to this board. With `--netsluice` it builds the ready-made image |
| `scripts/deploy-dev.sh` | copies `web/` and `service/` to a device |
| `scripts/demo.py` | the interface on your own computer, with made-up data |
| `scripts/probe/` | boot script that reads out the bootloader |
| `dts/patch_dts.py` | the device tree changes for this board |
| `rootfs/` | files `build-image.sh` puts into the image, among them the first-boot setup of the ready-made image |
| `tests/` | smoke tests that run on your own computer |
| `docs/hardware.md` | what is known about the board |

## Working on it

```bash
scripts/deploy-dev.sh root@<device>      # after changing web/ or service/
ssh root@<device> 'sh -s' < provision/install-stack.sh    # after changing provision/
```

The web server tells browsers to revalidate, so a reload shows the new version. The service restarts only when its files changed.

On the device the service answers on `http://127.0.0.1:3002` and the engine on `http://127.0.0.1:3001`, both without a session, which is handy for testing over SSH.

To work on the interface without a device: `python3 scripts/demo.py`. See [Try the demo](/en/docs/demo/).

## Tests

```bash
bash tests/auth-smoke.sh        # sign-in: setup, login, change, logout, lock-out
bash tests/settings-smoke.sh    # settings and message delivery against a local receiver
bash tests/caddyfile.sh         # the web server configuration is the same text in both places
```

The smoke tests start the service on localhost with throw-away state and random passwords. They need `python3`, `curl` and `openssl`. There are no tests for the interface yet.

## Releases

A device updates itself from the releases of the repository. So for a release:

1. raise `VERSION` (the form is `x.y.z`), commit and push,
2. run `scripts/release.sh notes.md` (add `--prerelease` for a test version). It tags the commit and attaches `netsluice-<version>.tar.gz`, whose known size lets devices show how far the download is.

A new image (`scripts/build-image.sh --netsluice`, attached as further arguments of `release.sh`) is only needed when something below `web/` and `service/` changed.

## Things worth knowing before you change something

- **A NetSluice in use is the DNS server of a household.** Restarting the engine costs about ten seconds of name lookups, a reboot about forty. Do not test changes to addresses or to netplan on a device people depend on.
- **The device tree is not upstream.** `rootfs/dcm-dtb-restore` puts it back after package installs, and the kernel packages are held. Proper board support in Armbian would remove both workarounds.
- **The bootloader is the vendor's and is never written.** Backup, installation and putting a backup back all leave sectors 64 to 32767 alone, and the last two check them. To try these in QEMU, attach a second disk and set `NETSLUICE_INTERNAL_DISK` for `netsluice-root.service`. Without it only a real eMMC is ever accepted as the target.
- **Country lookup is IPv4 only** and counts one event per `A` lookup, so the map shows fewer requests than the overview.
- **Blocking a device** is done by refusing its DNS lookups. A device with its own DNS setting gets around it.
- **Texts are written in English first.** The German text sits next to it in `web/app.js`.
