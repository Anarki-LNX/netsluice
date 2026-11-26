---
title: Security
description: The public website and the interface on your device are two separate things. What protects the device, what does not, and how to report a problem.
lang: en
updated: 2026-11-26
---

## Two separate things

**This website** is a set of static pages. It has no sign-in, no forms and no connection to any NetSluice device. The demo on it runs in your browser with invented data.

**The interface of your NetSluice** lives at `http://netsluice.local/`, inside your home network. This website never contacts it, and it never contacts this website.

## Keep the interface at home

The interface is made for your home network. **Never forward it to the internet**, and never forward the device's DNS port either. Concretely: do not set up port forwarding on your router for ports 80, 443 or 53 to the NetSluice.

Why:

- **The first visitor sets the password.** A device that is reachable before you chose one can be taken over by whoever comes first.
- **One password guards everything.** There are no user accounts and no second factor.
- **The filter answers DNS on every address of the device**, and the engine's limit of 20 answers a second per device is lifted, so that busy pages load quickly. On the internet, an open DNS server like that gets abused.
- **NetSluice cannot make itself reachable from outside** and is not built for it. Using the filter away from home would need a tunnel. That is an idea for later, not a feature.

## What protects the device

Everything below is in the code of the [repository](https://github.com/Anarki-LNX/netsluice).

**Sign-in**

- The password needs 8 characters or more. It is stored as a salted scrypt hash.
- After five wrong tries in five minutes, sign-in waits. A smoke test (`tests/auth-smoke.sh`) checks this.
- A session is a random token. Only its hash is kept on the device. It lasts 30 days, and its cookie is `HttpOnly` and `SameSite=Strict`. Signed in over HTTPS, the cookie is never sent over plain HTTP.
- Changing the password ends every other session.
- **Choose the password right away** after the first start. There is no reset by e-mail.

**The gate in front**

- The web server (Caddy) asks the service for a valid session before any request reaches the filter engine or the service. Only sign-in and first-time setup are reachable without one, and the static files of the interface, which hold nothing secret.
- The filter engine (AdGuard Home) and the NetSluice service listen on `127.0.0.1` only. They cannot be reached from the network directly.

**Few rights**

- The service runs as its own user without privileges, with systemd's protections (`NoNewPrivileges`, `ProtectSystem=strict`, `ProtectHome`, `PrivateTmp`).
- Only a small helper has root rights. It accepts a short list of commands, validates every argument, does not follow links, and drops any request older than 20 seconds instead of carrying it out late.

**No login to the system underneath**

- On the ready-made image SSH is off, the root account is locked, and the consoles log nobody in.
- SSH only comes on if you put a public key on the card, and then only for keys, never passwords.

**Updates**

- New versions come only from the project's releases on GitHub, over HTTPS. A redirect away from GitHub is refused. A download may be at most 30 MB.
- The archive is refused unless its `VERSION` file matches the release tag, the interface and service are complete, and the Python files compile. It is unpacked without links, absolute paths or device files.
- If the new version does not answer, the previous one is put back.

**Images and their contents**

- Every image comes with a SHA-256 checksum file.
- When an image is built, AdGuard Home is checked against its project's checksums, and the Debian packages against Debian's package index. `SOURCES.txt` in the image's bundle names the origin and checksum of every file.

**The bootloader**

- Backup, installation and putting a backup back never write the vendor bootloader (sectors 64 to 32767). The installation compares that area before and after. Putting a backup back first checks that the backup is intact and belongs to this bootloader.

## What is not there

- **No signatures.** Releases and images are not signed. There are checksums, no digital signatures.
- **No user accounts, no second factor.** One password for everything.
- **Plain HTTP stays on.** HTTPS is optional, and HTTP keeps working next to it.
- **The device rules can be bypassed.** A device with its own DNS setting gets around the filter and around schedules.

## Reporting a vulnerability

The repository has no separate security policy yet.

- **For anything sensitive**, write to **hallo@loopout.tech**. Describe what you found, on which version, and how to see it. Please give some time for a fix before you publish details.
- **For everything else**, open an [issue on GitHub](https://github.com/Anarki-LNX/netsluice/issues). Leave out working exploit details there.

## This website

This website is served as static files. It sets no cookies, has no forms and loads no third-party scripts. Pages are not allowed to connect anywhere but this site itself. <!-- verify: CSP connect-src 'self' and the other headers in agent 3's Caddy config --> The release data shown here is fetched by the server when the site is built, so your browser never talks to GitHub's API. See [Privacy](/en/privacy/).
