---
question: Where are my DNS lookups processed?
lang: en
category: use
order: 20
---
On the device in your home. The filter decides there, and the request log, the counters and the device list stay there.

Lookups that are let through are passed on to the resolver set under Settings, Secure DNS. All six resolvers offered there use DNS over HTTPS. To place stopped names on the world map, the device asks Quad9's unfiltered resolver for their address. About every six hours it asks Google's name server for your public address, to put your home on the map. Messages, if you switch them on, go through the service you chose. The [privacy guide](/en/docs/privacy-and-dns/) lists every way data leaves the device.
