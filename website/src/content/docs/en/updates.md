---
title: Updates
description: How NetSluice updates itself from GitHub, what happens if an update fails, and how the system underneath is updated.
lang: en
section: use
order: 31
updated: 2026-11-26
---

Under Settings, **Updates** covers two things: NetSluice itself, and the Debian system underneath.

## NetSluice itself

**Looking.** About once a day the device asks GitHub whether there is a new release. Looking installs nothing. If there is one, the top bar shows "Update to …". You can also look by hand: "Look for a new version".

**Installing.** "Install …" starts the update. Or switch on **Install new versions automatically**. It is off by default. Switched on, the device looks once a day, early in the morning, and installs a new version if there is one.

What happens during an update:

1. The device takes the newest release by version number, pre-releases included.
2. It downloads the update archive, only from GitHub and over HTTPS, at most 30 MB. If a release has no update archive, it falls back to the source archive of the tag and shows the download without a percentage.
3. It checks the archive. The `VERSION` file inside must match the tag. The interface and the service must be there, and the Python files must compile. Otherwise nothing is installed.
4. It keeps a copy of what runs now.
5. It replaces the interface and the service. **The filter engine is not touched**, so name lookups keep working throughout.
6. It restarts the service and waits for it to answer.

**If the new version does not answer** within about 40 seconds, the previous version is put back by itself. The interface then says: "The last update was undone." If an update fails earlier, for example during the download, the previous version simply keeps running.

**Good to know**

- Releases are not signed. The check is the version match, the file check and the download from GitHub only.
- An update replaces only `web/` and `service/`. Changes to the system setup still need `provision/install-stack.sh` by hand.
- About once a day GitHub sees your address and the installed version. Nothing else is sent.

## The system underneath (Debian)

- **Look for updates** refreshes the package lists and shows how many updates are waiting.
- **Install** installs them in the background. The filter keeps working.
- **Install security updates automatically**: Debian then installs security fixes by itself every night. You switch this on yourself.

**Held back on purpose: the system core.** The kernel packages only work on this board together with the adapted device tree. They are held and updated by hand. After every package installation the adapted device tree is put back automatically.

## A new image

You do not need to write a new card for an update. A new image is only published when something below the interface and the service changed. See [Releases and checksums](/en/docs/releases-and-checksums/).
