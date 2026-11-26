---
title: Privacy and encrypted DNS
description: Which resolver the filter asks, how long the request log is kept, and every way data leaves the device.
lang: en
section: use
order: 34
updated: 2026-11-26
---

NetSluice sees which device on your network asks for which host. That is how a DNS filter works. This page shows what stays on the device, what leaves it, and what you can set.

## Secure DNS

The filter forwards what it lets through to a resolver. With DNS over HTTPS (DoH) that question is encrypted, so neither your internet provider nor anyone on the line can read or alter it.

Under Settings, **Secure DNS**, you choose one of these:

| Resolver | In the interface's words |
|---|---|
| Quad9 | Blocks known malware. Non-profit, Switzerland. |
| Quad9 (unfiltered) | No blocking of its own. Non-profit, Switzerland. |
| DNS4EU Protective | European resolver with protection against malware. |
| DNS4EU | Public European resolver, unfiltered. |
| Mullvad | Run by a privacy-focused VPN provider. Sweden. |
| Cloudflare | Fast, worldwide. USA. |

A new resolver is tested before it is used. If it does not answer, nothing is changed.

**Verify answers (DNSSEC)** rejects forged answers for domains that are signed.

## Privacy settings

- **Keep the request log for** 24 hours, 7, 30 or 90 days. The log shows which device asked for which address. The world map and the lists of the overview are built from it.
- **Hide which device asked** stores shortened addresses. Devices can then no longer be told apart in the interface.
- **Delete everything collected** empties the log and resets all counters. Lists and settings stay. This cannot be undone.

## What stays on the device

The request log, the counters, the device list, the schedules and your settings. Nothing of this is sent anywhere by NetSluice.

## What leaves the device

| What | Where to | When |
|---|---|---|
| Lookups the filter lets through | the resolver you chose | every time a device looks up a name that is not in the cache |
| Stopped names, to place them on the world map | Quad9's unfiltered resolver (`9.9.9.10`), as a plain DNS query | for a stopped name, at most once an hour per name |
| A question for your own public address, to place your home on the map | Google's name server, as a plain DNS query | at the start and about every six hours |
| Filter lists | the maintainers of the lists you switched on | when lists are refreshed |
| A look for a new version | GitHub. It sees your address and the installed version | about once a day |
| The update itself | GitHub | when you install one, or daily if you switched that on |
| System updates | the package sources of the system (Debian, Armbian) | when you look for or install them, or every night if you switched that on |
| Messages | the ntfy server or webhook you entered | only if you switched them on |

The device's clock is set over the internet by Debian's own time service, as on any Debian system.

At home this is your call. If other people use the network, tell them.

## Export and import

Under Settings, **Export and import**:

- **Export** saves filter lists, resolver, privacy settings, children's rules, LEDs and messages to a file (`netsluice-settings.json`). Not the password, not the log. The file contains the message address, so keep it private.
- **Import** adds what is missing and overwrites the settings named in the file. Lists you added since are kept.
