# Development

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

- **AdGuard Home** does the filtering. It listens for DNS on every address and
  for its API on localhost only. It has no account of its own: with one, it
  checks a bcrypt hash on every request, which costs 0.4 s each on this CPU.
- **Caddy** serves the interface and lets nothing through to the engine or the
  service without a valid session.
- **netsluiced** (`service/netsluiced.py`) is everything the engine does not
  do: sign-in, the world map, device recognition, schedules, LEDs and button,
  messages. One Python file, standard library only, no privileges. Its header
  lists the sections and the HTTP interface.
- **netsluice-root** (`service/netsluice-root.py`) is the only part with root
  rights. The service drops a request file; systemd starts the helper; the
  helper accepts a short list of commands and validates every argument.
  Requests older than 20 seconds are dropped, never carried out late.
- **The interface** (`web/`) is plain HTML, CSS and JavaScript modules. No
  framework, no build step. `app.js` holds the texts in both languages and the
  logic of every section; `sluice.js` and `worldmap.js` draw on canvases.

## Layout

| Path | What |
|---|---|
| `web/` | the interface |
| `service/` | `netsluiced.py` and the root helper |
| `provision/install-stack.sh` | turns a running Armbian into a NetSluice; safe to run again |
| `provision/install-to-emmc.sh` | moves the system from the card to the eMMC |
| `scripts/build-image.sh` | adapts a stock Armbian image to this board |
| `scripts/deploy-dev.sh` | copies `web/` and `service/` to a device |
| `scripts/demo.py` | the interface on your own computer, with made-up data |
| `scripts/probe/` | boot script that reads out the bootloader |
| `dts/patch_dts.py` | the device tree changes for this board |
| `rootfs/` | files `build-image.sh` puts into the image |
| `tests/` | smoke tests that run on your own computer |
| `docs/hardware.md` | what is known about the board |

## Working on it

```bash
scripts/deploy-dev.sh root@<device>      # after changing web/ or service/
ssh root@<device> 'sh -s' < provision/install-stack.sh    # after changing provision/
```

The web server tells browsers to revalidate, so a reload shows the new
version. The service restarts only when its files changed.

On the device the service answers on `http://127.0.0.1:3002` and the engine on
`http://127.0.0.1:3001`, both without a session, which is handy for testing
over SSH.

## Trying the interface without a device

```bash
python3 scripts/demo.py        # then open http://127.0.0.1:8099/  (add ?lang=de for German)
```

It serves `web/` and answers every request of the interface with invented
data. Switches answer but change nothing. The screenshots in the README were
taken from it with a headless browser:

```bash
chromium --headless=new --hide-scrollbars --window-size=1440,960 --virtual-time-budget=9000 \
  --screenshot=docs/screenshots/overview.png 'http://127.0.0.1:8099/?lang=en'
```

## Releases

A device updates itself from the releases of this repository. It takes the
newest one by version number, pre-releases included, downloads the source
archive of its tag and refuses it unless the `VERSION` file in it matches the
tag. Only `web/` and `service/` are replaced; changes to `provision/` still
need `install-stack.sh` by hand. So for a release:

1. raise `VERSION` (for example `0.1.3`), commit and push,
2. run `scripts/release.sh notes.md` (add `--prerelease` for a test version). It tags the commit and
   attaches `netsluice-<version>.tar.gz`, whose known size lets devices show
   how far the download is. Without it a device falls back to the source
   archive and shows the download without a percentage.

## Tests

```bash
bash tests/auth-smoke.sh        # sign-in: setup, login, change, logout, lock-out
bash tests/settings-smoke.sh    # settings and message delivery against a local receiver
```

Both start the service on localhost with throw-away state and random
passwords. They need `python3`, `curl` and `openssl`. There are no tests for
the interface yet.

## Things worth knowing before you change something

- **A NetSluice in use is the DNS server of a household.** Restarting the
  engine costs about ten seconds of name lookups, a reboot about forty. Do not
  test changes to addresses or to netplan on a device people depend on.
- **The device tree is not upstream.** `rootfs/dcm-dtb-restore` puts it back
  after package installs, and the kernel packages are held. Proper board
  support in Armbian would remove both workarounds.
- **The bootloader is the vendor's and is never written.** A broken bootloader
  on the eMMC is the one thing that makes this device hard to recover.
- **Country lookup is IPv4 only** and counts one event per `A` lookup, so the
  map shows fewer requests than the overview.
- **Blocking a device** is done by refusing its DNS lookups. A device with its
  own DNS setting gets around it.
- Texts are written in English first; the German text sits next to it in
  `web/app.js`.

## Wanted

Reports from other board revisions, a ready-made image, HTTPS, the WireGuard
tunnel, a light theme, tests for the interface, and board support in Armbian.
