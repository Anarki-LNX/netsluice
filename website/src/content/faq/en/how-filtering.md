---
question: How does the filtering work?
lang: en
category: basics
order: 5
---
The filter engine is AdGuard Home. Every device that uses NetSluice as its DNS server asks it for the address of a name. If the name is on one of your switched-on lists, the lookup is stopped, and the device does not get the address. Everything else is passed on to the resolver you chose.

NetSluice reads the same list formats as AdGuard Home and Pi-hole: hosts files and adblock-style lists. You switch lists on and off one by one and can add any list by its address.
