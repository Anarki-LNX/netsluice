---
title: Datenschutz
description: Was diese Website mit deinen Daten macht, was auf deinem NetSluice bleibt und welche Dienste von außen ins Spiel kommen.
lang: de
updated: 2026-11-26
---

Vier Dinge geraten leicht durcheinander. Diese Seite hält sie auseinander: diese Website, dein NetSluice-Gerät, die Meldedienste, die du vielleicht wählst, und GitHub und PayPal.

## 1. Diese Website

Diese Website besteht aus statischen Seiten. Sie hat

- **keine Cookies,**
- **keine Statistik und kein Tracking,**
- **keine Formulare und keine Konten,**
- **keine Skripte von Dritten.** Die Schriften kommen von dieser Website selbst, nicht von Google oder einem anderen Schriftendienst.

Die Verbindung ist verschlüsselt (HTTPS).

Den Server betreibt LOOP OUT TECH. Wer das ist und wie du sie erreichst, steht im [Impressum](https://loopout.tech/impressum). Der Webserver führt **keine Zugriffsprotokolle**. Er protokolliert nur Zertifikatsvorgänge und Anfragen, die einen Serverfehler ausgelöst haben.

**Release-Daten.** Die Seiten Downloads und Änderungen zeigen die Releases von NetSluice auf GitHub. Der Server holt sie ab, wenn die Website gebaut wird. Dein Browser spricht nie mit der Schnittstelle von GitHub, und GitHub erfährt nicht, dass du nachgesehen hast.

**Die Live-Demo** läuft komplett in deinem Browser, mit erfundenen Daten. Sie spricht mit keinem Gerät und keinem Dienst von außen. Wie die echte Oberfläche merkt sie sich deine Wahl von Sprache und Aussehen im lokalen Speicher deines Browsers. Das bleibt in deinem Browser und wird nirgendwohin geschickt. <!-- verify: demo mock keeps web/app.js localStorage keys and makes no requests beyond its own origin -->

Die allgemeine Datenschutzerklärung von LOOP OUT TECH steht unter [loopout.tech/datenschutz](https://loopout.tech/datenschutz).

## 2. Dein NetSluice-Gerät

NetSluice sieht, welches Gerät in deinem Netz nach welcher Adresse fragt. So arbeitet ein DNS-Filter. Das Anfrageprotokoll, die Zähler, die Geräteliste, die Zeitpläne und deine Einstellungen **bleiben auf dem Gerät**. Diese Website und ihr Betreiber bekommen nichts davon.

Ein paar Dinge verlassen das Gerät absichtlich: Anfragen, die der Filter durchlässt, gehen an den Auflöser, den du gewählt hast. Aufgehaltene Adressen werden beim ungefilterten Auflöser von Quad9 nachgeschlagen, um sie auf der Weltkarte einzuordnen. Und etwa alle sechs Stunden fragt das Gerät den Nameserver von Google nach deiner öffentlichen Adresse. Die [Datenschutz-Anleitung](/de/docs/privacy-and-dns/) listet jeden dieser Wege und die Einstellungen, die du hast.

Zu Hause ist das deine Entscheidung. Wenn andere dein Netz nutzen, sag es ihnen.

## 3. Meldedienste, die du wählst

Meldungen aufs Handy sind aus, bis du sie einschaltest. Tust du das, verlassen sie dein Haus über den Dienst, den du gewählt hast (einen ntfy-Server oder einen Webhook), mit Gerätenamen und Adressen. Dieser Dienst hat seine eigene Datenschutzerklärung.

## 4. GitHub und PayPal

- **Updates.** Etwa einmal am Tag fragt dein NetSluice bei GitHub, ob es eine neue Version gibt. GitHub sieht deine Adresse und die installierte Version. Updates und Filterlisten kommen von ihren Quellen.
- **Downloads.** Klickst du auf dieser Website auf einen Download, holt dein Browser die Datei von GitHub.
- **Spenden.** Der Spendenlink führt zu PayPal. Bis du ihn anklickst, geht nichts an PayPal.

GitHub und PayPal sind eigene Dienste mit eigenen Datenschutzerklärungen.
