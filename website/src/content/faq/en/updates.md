---
question: How do updates work?
lang: en
category: updates
order: 30
---
About once a day the device asks GitHub whether there is a new release. Looking installs nothing. You install with one click under Settings, Updates, or switch on automatic installation, which is off by default.

An update replaces only the interface and the service. The filter engine keeps running, so name lookups keep working. The device downloads only from GitHub, over HTTPS, and refuses an archive whose `VERSION` file does not match the release tag. See [Updates](/en/docs/updates/).
