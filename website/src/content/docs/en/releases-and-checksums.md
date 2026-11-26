---
title: Releases and checksums
description: Newest version and newest image are two different things. How to check a download, and what is checked on an update.
lang: en
section: install
order: 21
updated: 2026-11-26
---

All releases are published on [GitHub](https://github.com/Anarki-LNX/netsluice/releases). The [downloads page](/en/downloads/) of this website lists them.

## Newest version and newest image

A release can carry up to three files:

| File | What it is |
|---|---|
| `netsluice-<version>-deeper-connect-mini.img.xz` | the ready-made image for the microSD card |
| `netsluice-<version>-deeper-connect-mini.img.xz.sha256` | the SHA-256 checksum of that image |
| `netsluice-<version>.tar.gz` | the update archive a running device downloads |

Not every release brings an image. A new image is only built when something below the interface and the service changed: the system setup, the first start, or the bundled packages. Everything else reaches a card written from an older image as an update.

So the newest version and the newest image can be different releases. Write the newest image, then update from the interface.

## Checking an image

The `.sha256` file holds the checksum of the image. Keep both files in the same folder.

**Linux**

```bash
sha256sum -c netsluice-*.img.xz.sha256
```

**macOS**

```bash
shasum -a 256 -c netsluice-*.img.xz.sha256
```

**Windows (PowerShell)**

```powershell
Get-FileHash -Algorithm SHA256 .\netsluice-<version>-deeper-connect-mini.img.xz
```

Compare the long number it prints with the one in the `.sha256` file. Upper and lower case do not matter.

A checksum tells you that the file arrived complete and unchanged from the release. **Releases are not signed.** There are checksums, no signatures.

## What a device checks on an update

A device takes the newest release by version number, pre-releases included. It downloads only from GitHub, over HTTPS, and refuses an archive

- that is larger than 30 MB,
- whose `VERSION` file does not match the release tag,
- that lacks the interface or the service,
- whose Python files do not compile.

If the new version does not answer after the update, the previous one is put back. See [Updates](/en/docs/updates/).

## Version numbers

Versions are `x.y.z`, for example `0.1.28`. The tag of a release is `v` and the version, for example `v0.1.28`.
