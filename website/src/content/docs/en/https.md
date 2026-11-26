---
title: HTTPS in your own network
description: Encrypt the way between your browser and the device with a certificate the device signs itself. Plain HTTP keeps working.
lang: en
section: use
order: 35
updated: 2026-11-26
---

The interface works over plain HTTP. If you want the way between your browser and the device encrypted, switch on HTTPS under Settings, **Access**.

## What happens

- The web server in the device signs a certificate for whatever name or address you open it under.
- Its root certificate is offered for download, called "Caddy Local Authority", after the web server in the device (`netsluice-root.crt`).
- **Plain HTTP keeps working.** Browsers are not sent to HTTPS. Nobody is locked out by a browser that distrusts the certificate.
- If the web server does not start with the new setting, the previous one is put back.
- Signed in over HTTPS, the session is never sent over plain HTTP.

## Stopping the browser warning

Until a device has the root certificate, its browser warns that the connection is not private. The connection is encrypted all the same. The browser just cannot tell who signed it.

1. Download the root certificate under Settings, Access.
2. Import it once on every computer and phone, in the browser or the system settings, under "certificate authorities". Trust it for websites.
3. Compare the fingerprint. The interface shows the SHA-256 fingerprint of the root certificate, so you can check you imported the right one.

## Keep it at home

HTTPS here protects the way inside your own network. It does not make the interface fit for the internet. Never forward the interface to the internet. See [Security](/en/security/).
