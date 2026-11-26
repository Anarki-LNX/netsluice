---
question: Why does the world map show fewer requests than the overview?
lang: en
category: use
order: 22
---
The map only covers IPv4 and counts one event per `A` lookup. One lookup often reaches the filter as several requests (IPv4, IPv6, HTTPS record). The overview counts all of them. The map is not a record of every connection.

The country shown is where the answering server is registered. Large networks answer from a data centre near you, so much of what is shown for the USA may never leave Europe.
