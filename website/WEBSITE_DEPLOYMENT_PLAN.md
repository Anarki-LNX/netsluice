# Website deployment plan

Stand: 2026-11-26 · Nothing here is deployed or switched on. Every step on the server, in DNS and
in the wetter-crinitz repository is the owner's (see `WEBSITE_DEPLOYMENT_GUIDE.md`).

## 1. Shape

```
GitHub Actions (website.yml)                     IONOS VPS 85.215.241.66
  push to main / release published|edited|         Caddy (wetter-crinitz compose, ports 80/443)
  deleted / daily 04:23 UTC / manual                 └─ block netsluice.loopout.tech
  → check, test, build, check:security, audit            file_server /srv/netsluice/current  (read-only mount
  → artifact "netsluice-website-site" (14 days)                                               of /opt/netsluice-web)
                    ▲                               /opt/netsluice-web/          owner netsluice-web
                    │ HTTPS, read-only token          current -> releases/<id>   (atomic symlink)
                    └──────── netsluice-web-pull ◀──  previous, state.json, releases/<5 newest builds>
                              (systemd timer, 15 min)
Owner's desktop: deploy/deploy.sh --yes (rsync over SSH :13377) and deploy/rollback.sh --yes
```

Visitors only ever talk to Caddy. Caddy only reads files. The VPS never builds (the owner's rule
since the memory incident of 2026-11-06), and GitHub never gets access to the VPS.

## 2. Why this refresh mechanism

The downloads page needs fresh release data after a new release. Options considered:

| Option | For | Against |
|---|---|---|
| A. Timer on the VPS runs a build container every 30 min | simple, self-contained | **builds on the VPS** (2 GB RAM, a build froze the server on 2026-11-06, owner removed all VPS builds since); needs Node image updates there |
| B. Scheduled GitHub workflow builds **and pushes** over SSH | no server code | CI would hold an SSH key of a user with docker/sudo (root-equivalent); an automatic deploy job in CI is excluded by the workplan |
| C. Desktop/LXC cron runs deploy.sh | reuses deploy.sh | needs an always-on home machine and a root-equivalent key there |
| **D. CI builds, VPS pulls (chosen)** | no build on the VPS; no inbound credentials for CI; the server decides when to switch; health check and automatic switch-back on the server; triggered by the release event itself | a small script on the VPS; a read-only GitHub token on the VPS (needed for artifact downloads) |

D gives: a release → CI (~3 min, `release` trigger) → picked up within 15 min → live. A daily
scheduled build is the safety net. Builds from pull requests are never fetched (separate artifact
name, branch, event and repository checked).

## 3. Atomic deploy and rollback

- New build goes to `/opt/netsluice-web/.incoming-<id>/`, is checked (no symlinks, no `..`, no
  hidden files, size limits, `index.html` + `build.json` present, commit matches the CI run,
  release data not `none`), then renamed to `releases/<id>/`.
- Switch: a new symlink `.current.tmp → releases/<id>` is `rename(2)`d over `current`: Caddy serves
  either the old or the new tree, never a mix.
- `previous` remembers the build before; 5 builds are kept (current and previous always).
- Verify: `https://netsluice.loopout.tech/build.json` must show the new `builtAt` within a minute;
  otherwise the switch is undone automatically (deploy.sh and the puller both do this).
- Rollback: `deploy/rollback.sh --yes` (previous) or `--to <id>`; `--status` lists builds.
- `deploy.sh`, `rollback.sh` and the puller share one lock (`/opt/netsluice-web/.lock`).

## 4. Health check

`GET https://netsluice.loopout.tech/build.json` (`Cache-Control: no-store`):

```json
{ "site": "netsluice-website", "commit": "<sha>", "builtAt": "<ISO>", "run": 123,
  "releases": { "source": "live|cache|none", "fetchedAt": "<ISO>", "count": 29, "latest": "0.1.28", "latestImage": "0.1.28" },
  "demo": { "version": "0.1.28", "commit": "7b4f597" } }
```

Monitoring idea: alert when the URL is not 200, when `releases.source` is not `live` for more
than a day, or when `builtAt` is older than 2 days (the daily build should refresh it).

## 5. Files

| File | Where it goes |
|---|---|
| `deploy/caddy/netsluice.loopout.tech.caddy` | appended to `wetter-crinitz/server/caddy/Caddyfile` |
| volume line `- /opt/netsluice-web:/srv/netsluice:ro` | `wetter-crinitz/docker-compose.yml`, service `caddy` |
| `deploy/deploy.sh`, `deploy/rollback.sh`, `deploy/remote-switch.sh` | stay in the repo, run from the owner's desktop |
| `deploy/server/netsluice-web-pull` | `/usr/local/bin/` (755) |
| `deploy/server/netsluice-web-pull.service`, `.timer` | `/etc/systemd/system/` |
| `deploy/server/pull.env.example` | as `/etc/netsluice-web/pull.env` (root 600) with the token |
| `.github/workflows/website.yml` | repository root; runs on GitHub after the owner pushes |

## 6. Trade-offs accepted

- The token on the VPS can read public repositories only. If it leaks, an attacker can read what
  is public anyway. It expires after a year; renew it (the timer then fails visibly in the journal).
- Scheduled GitHub workflows are paused after 60 days without repository activity; the release
  trigger and push trigger still work. Re-enable in the Actions tab if needed.
- The caddy container must be recreated once to get the new volume (a few seconds of downtime for
  all sites on the VPS; coordinate like the loopout.tech rollout).
