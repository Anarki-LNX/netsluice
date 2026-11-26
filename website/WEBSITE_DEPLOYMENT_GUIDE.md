# Website deployment guide (for the owner)

Stand: 2026-11-26. Step by step, in order. Nothing below has been done by an agent: no DNS change,
no server login, no deploy, no push. Commands with `ssh vps` assume your existing SSH alias
(port 13377, user `anarki`, key `id_ed25519_anarki`).

**The guarantee:** the site is static files served by Caddy. No NetSluice device API, no admin
port, no home-network service is exposed or proxied. The live demo answers its own requests
inside the visitor's browser with invented data.

---

## REQUIRES MY APPROVAL

Each of these changes something public or on the shared VPS. Do them yourself, in this order:

1. Publishing the site at all (content and legal texts approved).
2. DNS record `netsluice.loopout.tech` (step 1).
3. Server setup: user, directory, volume line, Caddy block, Caddy restart (steps 2–4). The Caddy
   restart briefly interrupts **all** sites on the VPS (wetter-crinitz.de, elwa, gym, loopout.tech);
   agree on the time with the SUNA/other sessions as for loopout.tech.
4. First deploy (step 5).
5. Pushing `website/` and `.github/workflows/website.yml` to GitHub (CI then runs on GitHub).
6. Switching on automatic refresh (step 7): creating the GitHub token, enabling the timer.

## BLOCKED — REQUIRES ACCESS

An agent could not and did not do these; they need your accounts:

- **IONOS DNS** for loopout.tech (domain panel).
- **SSH to the VPS** (85.215.241.66:13377) and `sudo` there.
- **The wetter-crinitz repository** (Caddyfile and docker-compose.yml live there; agents must not edit it).
- **GitHub**: pushing, creating the fine-grained token, repository settings.
- Checking the live headers over the real domain (no DNS record yet).

---

## 0. Before you start (desktop)

```bash
cd ~/Projekte/netsluice/website
nice -n 19 npm ci
nice -n 19 npx astro check && nice -n 19 npx vitest run
nice -n 19 npm run build && node scripts/write-build-info.mjs --require-release-data
nice -n 19 npm run check:security        # must say 0 failure(s)
nice -n 19 npm audit --omit=dev          # 2026-11-26: found 0 vulnerabilities
```

## 1. DNS (IONOS, domain loopout.tech)

| Type | Host | Value | TTL |
|---|---|---|---|
| A | `netsluice` | `85.215.241.66` | 3600 (or default) |

**No AAAA record**: none of the sites on this VPS has one, and the server's IPv6 address is not
documented. Add AAAA only after checking the VPS has a working public IPv6 address and the IONOS
firewall allows it. Optional, recommended (also listed in the server README): CAA on loopout.tech
`0 issue "letsencrypt.org"` and `0 issuewild ";"`.

Check: `dig +short netsluice.loopout.tech A` → `85.215.241.66`.

## 2. Server: user and web root

```bash
ssh vps
sudo useradd --system --home-dir /opt/netsluice-web --no-create-home --shell /usr/sbin/nologin netsluice-web
sudo install -d -o netsluice-web -g netsluice-web -m 755 /opt/netsluice-web /opt/netsluice-web/releases
```

Files must stay world-readable (dirs 755, files 644): Caddy runs with `cap_drop: ALL` and cannot
read anything else. The deploy scripts set these modes.

## 3. Caddy: volume and site block (repository wetter-crinitz)

On the desktop, in `~/Projekte/wetter-crinitz`:

1. `docker-compose.yml`, service `caddy`, under `volumes:` add
   ```yaml
         # NetSluice website (static files, /opt/netsluice-web/current → releases/<id>), read-only
         - /opt/netsluice-web:/srv/netsluice:ro
   ```
2. Append the whole content of `netsluice/website/deploy/caddy/netsluice.loopout.tech.caddy` to
   the end of `server/caddy/Caddyfile` (after the `gym.loopout.tech` block). Change nothing else.
3. Validate:
   ```bash
   docker run --rm -v "$PWD/server/caddy/Caddyfile:/etc/caddy/Caddyfile:ro" caddy:2.11-alpine \
     caddy validate --config /etc/caddy/Caddyfile
   ```
4. Back up the live config, then roll out (Caddy runs with `admin off`, so it needs a restart;
   the new volume needs the container to be recreated):
   ```bash
   ssh vps 'cp /opt/wetter-crinitz/server/caddy/Caddyfile /opt/wetter-crinitz/server/caddy/Caddyfile.vor-netsluice && cp /opt/wetter-crinitz/docker-compose.yml /opt/wetter-crinitz/docker-compose.yml.vor-netsluice'
   git commit -am "Caddy: netsluice.loopout.tech (static files)" && git push
   ssh vps 'cd /opt/wetter-crinitz && git pull --ff-only && docker compose up -d --no-build caddy'
   ```
   Until the first deploy, the site answers with a plain 404 (current does not exist yet).
5. Update `server/README.md` there (table of sites) when it works.

## 4. (once) Server can be reached by the deploy scripts

`deploy.sh` uses `sudo -n -u netsluice-web` on the server (your `anarki` has passwordless sudo).
Test: `ssh vps 'sudo -n -u netsluice-web true && echo ok'`.

## 5. First deploy (desktop)

```bash
cd ~/Projekte/netsluice/website
deploy/deploy.sh --yes
```

It builds, writes `dist/build.json`, runs `check:security`, uploads with rsync over SSH (port 13377)
into `/opt/netsluice-web/.incoming-<id>/`, switches `current` atomically and checks
`https://netsluice.loopout.tech/build.json`. If that does not show the new build within a minute,
it switches back by itself. Options: `--no-build`, `--host`, `--port`, `--user`, `--dir`, `--keep`.

## 6. Verify

```bash
curl -sI https://netsluice.loopout.tech/en/ | sed -n '1p;/strict-transport/Ip;/content-security/Ip;/x-content-type/Ip;/referrer/Ip;/permissions/Ip;/cross-origin/Ip;/cache-control/Ip;/^server/Ip'
curl -sI http://netsluice.loopout.tech/ | head -3            # 308 to https
curl -sI https://netsluice.loopout.tech/does-not-exist/ | head -1   # 404, same headers
curl -s  https://netsluice.loopout.tech/build.json             # commit, builtAt, releases.source "live"
curl -sI --http3-only https://netsluice.loopout.tech/ | head -1 # HTTP/3 (as for the other sites)
```

Expected: `HTTP/2 200`, HSTS `max-age=31536000; includeSubDomains`, the CSP from
`WEBSITE_SECURITY_PLAN.md`, `nosniff`, `strict-origin-when-cross-origin`, the Permissions-Policy,
COOP and CORP `same-origin`, **no `Server` header**, `Cache-Control: no-cache` for pages and
`public, max-age=31536000, immutable` for `/_astro/…`. Online second opinion (optional):
securityheaders.com and the Mozilla HTTP Observatory.

In a browser: open `/en/demo/`, check the yellow "Demo · invented data" banner, the developer
console shows no CSP errors, the network tab shows no request to `/api`, `/control` or `/auth`.

## 7. Automatic refresh after a release (optional, off until you do this)

Status 2026-11-27: prepared, **not installed** on the server. Step 1 is done (green run on
`main`, artifact present). The script was tested on a desktop against a scratch folder: it found
run 45875776146, downloaded and unpacked the artifact and switched the symlink. What is left is
steps 2 and 3, which need your token and your approval.

1. Push `website/` and `.github/workflows/website.yml`; wait for a green **Website** run on `main`
   (Actions tab). It uploads the artifact `netsluice-website-site`.
2. GitHub → Settings → Developer settings → Fine-grained tokens → new token: owner `Anarki-LNX`,
   repository access **Public repositories (read-only)**, no other permissions, expiry 1 year.
   Put a reminder in your calendar to renew it.
3. On the server:
   ```bash
   sudo install -d -m 700 /etc/netsluice-web
   sudo install -m 600 /dev/null /etc/netsluice-web/pull.env
   sudoedit /etc/netsluice-web/pull.env        # content as deploy/server/pull.env.example, token after GITHUB_TOKEN=
   # copy the three files from the repo (scp -P 13377 … or git checkout on the server), then:
   sudo install -m 755 netsluice-web-pull /usr/local/bin/
   sudo install -m 644 netsluice-web-pull.service netsluice-web-pull.timer /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemd-run --pipe --wait -p User=netsluice-web -p EnvironmentFile=/etc/netsluice-web/pull.env /usr/local/bin/netsluice-web-pull --check
   sudo systemctl start netsluice-web-pull.service && journalctl -u netsluice-web-pull -n 30 --no-pager
   sudo systemctl enable --now netsluice-web-pull.timer
   ```
   The first real run downloads the newest CI build and switches to it (with health check and
   automatic switch-back). If the artifact download host is refused ("unexpected artifact host"),
   tell an agent the host name from the journal; the allowed list is in the script.
4. To stop it: `sudo systemctl disable --now netsluice-web-pull.timer`.

## 8. Rollback

```bash
deploy/rollback.sh --status                 # builds on the server, current and previous
deploy/rollback.sh --yes                    # back to the previous build
deploy/rollback.sh --yes --to <id>          # to a named build
```

The switch is atomic and immediate. If the timer is on, it will not re-deploy the same CI run
again; it switches only when a *newer* successful run exists. To pause it during an incident:
`sudo systemctl stop netsluice-web-pull.timer`.

Without the scripts (on the server): `cd /opt/netsluice-web && sudo -u netsluice-web ln -sfn releases/<id> .current.tmp && sudo -u netsluice-web mv -T .current.tmp current`.

Removing the site entirely: delete the Caddy block and volume line (restore the `.vor-netsluice`
backups), restart Caddy, delete the DNS record.

## 9. Backup of configuration

- Everything needed to rebuild the site is in git (`website/`); builds are reproducible from a commit.
- On the server only these are not in git: `/etc/netsluice-web/pull.env` (token, renewable, no
  backup needed) and the `.vor-netsluice` copies. The builds in `/opt/netsluice-web/releases`
  are disposable (redeploy with `deploy.sh`).
- The Caddyfile and docker-compose.yml are versioned in the wetter-crinitz repository.

## 10. Monitoring suggestion

- Uptime check (any external monitor, or the wetter-status service) on
  `https://netsluice.loopout.tech/build.json`: alert on non-200, on `releases.source` ≠ `live`
  for more than a day, and on `builtAt` older than 2 days.
- `systemctl list-timers netsluice-web-pull.timer` and `journalctl -u netsluice-web-pull`;
  optionally `OnFailure=` to your existing Telegram notifier (as for the other timers).
- Certificate: renewed by Caddy like the other sites; the status service already reads
  certificates for names in the Caddyfile.
