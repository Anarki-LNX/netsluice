# Release checklist: netsluice.loopout.tech

Tick from top to bottom. Nothing here is done automatically.
Details for each server step: `WEBSITE_DEPLOYMENT_GUIDE.md`.

## A. Before the first publication (owner decisions)

- [ ] Read through the site locally (`cd website && npm run build && npx astro preview`), both languages
- [ ] Hero buttons: keep "Explore features · Get NetSluice · Read the docs" (current) or switch to "Get started · Live demo · GitHub"
- [ ] Answer the content questions in `WEBSITE_FINAL_REPORT.md` (section "Open questions")
- [ ] Decide whether the product README's privacy section should mention the Quad9 lookup of stopped names, the Google address lookup and the version in the update check (the website already says so)
- [ ] Privacy page: name the hosting provider (IONOS) if wanted
- [ ] Commit `website/` and `.github/workflows/website.yml`, push, check that the "Website" workflow is green

## B. Server (once)

- [ ] DNS at IONOS: `A netsluice → 85.215.241.66` (no AAAA)
- [ ] VPS: system user `netsluice-web`, web root `/opt/netsluice-web/releases`
- [ ] wetter-crinitz repo: Caddy volume `/opt/netsluice-web:/srv/netsluice:ro` + site block from `website/deploy/caddy/netsluice.loopout.tech.caddy`; back up the live files as `.vor-netsluice`; `caddy validate`
- [ ] Restart Caddy at a quiet moment (all sites on the VPS are briefly away)

## C. Every publication

- [ ] `npm ci && npm run check && npm test && npm run build && npm run check:security` — all green
- [ ] Release data in `dist/build.json` says `"source": "live"`
- [ ] `deploy/deploy.sh --yes` (keeps 5 builds, rolls back by itself if the health check fails)
- [ ] `curl -sI https://netsluice.loopout.tech/en/ | grep -iE 'content-security|strict-transport|x-content-type'`
- [ ] Open `/en/`, `/de/`, `/de/downloads/`, `/de/demo/` on a phone
- [ ] If anything is wrong: `deploy/rollback.sh --yes`

## D. Optional afterwards

- [ ] Automatic refresh after new releases: install `deploy/server/netsluice-web-pull` + timer with a read-only token (guide §7)
- [ ] Uptime check on `https://netsluice.loopout.tech/build.json`
- [ ] Link the site from `https://loopout.tech/projekte/netsluice` and from the README
