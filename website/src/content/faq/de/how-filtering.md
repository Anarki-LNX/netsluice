---
question: Wie funktioniert das Filtern?
lang: de
category: basics
order: 5
---
Der Filter-Motor ist AdGuard Home. Jedes Gerät, das NetSluice als DNS-Server nutzt, fragt es nach der Adresse zu einem Namen. Steht der Name auf einer deiner eingeschalteten Listen, wird die Anfrage aufgehalten, und das Gerät bekommt die Adresse nicht. Alles andere geht weiter an den Auflöser, den du gewählt hast.

NetSluice liest dieselben Listenformate wie AdGuard Home und Pi-hole: Hosts-Dateien und Adblock-Listen. Du schaltest Listen einzeln an und aus und kannst jede Liste über ihre Adresse hinzufügen.
