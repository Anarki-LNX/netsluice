// Deutsche Texte für die strukturierten Seiten. Quellen: WEBSITE_CONTENT_AUDIT.md.
// Begriffe wie in web/app.js: Anfrage, aufgehalten, durchgelassen, Schleuse, Filter-Motor, Auflöser, Taster.
import type { Copy } from './types';

const diagram = ` browser ──HTTP──▶ Caddy :80 ──┬─ static files            web/
                               ├─ /auth/*  ─────────────▶ netsluiced :3002   (no session needed)
                               └─ /control/*, /api/*
                                    │  forward_auth: GET /auth/check on netsluiced
                                    ├─ /control/* ──────▶ AdGuard Home :3001  (the filter engine)
                                    └─ /api/*     ──────▶ netsluiced :3002

 devices ──DNS :53──▶ AdGuard Home

 netsluiced ──request file──▶ netsluice-root (started by systemd, runs as root)`;

export const de: Copy = {
  locale: 'de',

  common: {
    productName: 'NetSluice',
    demoLabel: 'Demo · erfundene Daten',
    statusLabels: {
      tested: 'Getestet',
      experimental: 'Experimentell',
      untested: 'Ungetestet',
      notSupported: 'Nicht unterstützt',
      notImplemented: 'Nicht umgesetzt',
    },
    docSections: {
      start: 'Start',
      install: 'Installieren',
      use: 'Benutzen',
      hardware: 'Hardware',
      develop: 'Entwickeln',
    },
    faqCategories: {
      basics: 'Das Wichtigste',
      install: 'Installieren',
      use: 'Im Betrieb',
      updates: 'Updates',
      security: 'Sicherheit',
      project: 'Das Projekt',
    },
    screenshots: {
      overview: {
        alt: 'Übersicht: Anfragen kommen an, werden in der Schleuse geprüft und durchgelassen oder aufgehalten',
        caption: 'Übersicht mit Live-Ansicht. Demo · erfundene Daten',
      },
      devices: {
        alt: 'Geräte, das am häufigsten aufgehaltene zuerst, mit Name, Hersteller und Art',
        caption: 'Geräte. Demo · erfundene Daten',
      },
      filters: {
        alt: 'Filterlisten mit je einem Schalter',
        caption: 'Filterlisten. Demo · erfundene Daten',
      },
      map: {
        alt: 'Weltkarte, wohin das Netz spricht',
        caption: 'Weltkarte. Demo · erfundene Daten',
      },
      settings: {
        alt: 'Einstellungen als Kacheln',
        caption: 'Einstellungen. Demo · erfundene Daten',
      },
    },
    localUiNote:
      'http://netsluice.local/ funktioniert nur in deinem Heimnetz, dort, wo dein NetSluice läuft. Diese Website verbindet sich nie damit.',
    trademark:
      'NetSluice steht in keiner Verbindung zu Deeper Network und wird von Deeper Network weder unterstützt noch empfohlen. „Deeper Connect“ ist deren Marke und nennt hier nur die Hardware, auf der NetSluice läuft.',
    disclaimerShort:
      'Keine Gewährleistung. Du veränderst ein Netzwerkgerät auf eigenes Risiko, und ein Filter, der ausfällt, nimmt die Namensauflösung deines Netzes mit.',
    updated: (date) => `Stand ${date}`,
    sourceLink: 'Quelle im Repository',
  },

  meta: {
    home: {
      title: 'NetSluice: Dein Netzwerk, deine Regeln',
      description:
        'Quelloffener DNS-Filter für den Deeper Connect Mini. Schlichtes Debian, AdGuard Home und eine eigene Oberfläche, gestartet von einer microSD-Karte.',
    },
    features: {
      title: 'Funktionen',
      description:
        'Filter fürs ganze Netz, Live-Übersicht, Geräte, Weltkarte, Zeitpläne für Kinder, verschlüsseltes DNS, Updates mit Rückweg und mehr.',
    },
    howItWorks: {
      title: 'So funktioniert es',
      description:
        'Wie eine Anfrage durch die Schleuse geht, wie NetSluice aufs Gerät kommt, woraus es besteht und welche Daten das Gerät verlassen.',
    },
    hardware: {
      title: 'Hardware',
      description:
        'Der Deeper Connect Mini (mini_v21): Daten, was getestet ist, was nicht unterstützt wird und was noch nicht gebaut ist.',
    },
    gettingStarted: {
      title: 'Loslegen',
      description:
        'Vom Download zum gefilterten Heimnetz in zehn Schritten, mit den Warnungen, die du vorher lesen solltest.',
    },
    docs: {
      title: 'Dokumentation',
      description: 'NetSluice installieren, benutzen, aktualisieren und selbst bauen, ausführlich.',
    },
    downloads: {
      title: 'Downloads',
      description: 'Das neueste NetSluice-Abbild für die microSD-Karte, mit SHA-256-Prüfsumme, und wie du es prüfst.',
    },
    changelog: {
      title: 'Änderungen',
      description: 'Jedes NetSluice-Release mit seinen Notizen, wie auf GitHub veröffentlicht.',
    },
    faq: {
      title: 'Fragen und Antworten',
      description: 'Kurze Antworten zu Hardware, Installation, Datenschutz, Updates, Sicherheit und dem Projekt.',
    },
    demo: {
      title: 'Live-Demo',
      description:
        'Die echte NetSluice-Oberfläche in deinem Browser, mit erfundenen Daten. Sie spricht mit keinem Gerät.',
    },
    security: {
      title: 'Sicherheit',
      description:
        'Was ein NetSluice schützt, was nicht, warum die Oberfläche zu Hause bleibt und wie du ein Problem meldest.',
    },
    privacy: {
      title: 'Datenschutz',
      description:
        'Was diese Website mit deinen Daten macht, was auf deinem NetSluice bleibt und welche Dienste von außen ins Spiel kommen.',
    },
    about: {
      title: 'Über NetSluice',
      description: 'Woher NetSluice kommt, wer es macht und nach welchen Grundsätzen es gebaut ist.',
    },
    contributing: {
      title: 'Mitmachen',
      description: 'Berichte von anderen Platinen, Fehlerberichte, Ideen und Pull Requests.',
    },
    license: {
      title: 'Lizenz',
      description: 'NetSluice steht unter der MIT-Lizenz. Was es nutzt, behält seine eigenen Lizenzen.',
    },
    support: {
      title: 'Hilfe und Kontakt',
      description: 'Wo du fragst, wo du meldest und wie du NetSluice mit einer Spende unterstützt.',
    },
  },

  home: {
    hero: {
      eyebrow: 'Open Source · für den Deeper Connect Mini',
      headline: 'Dein Netzwerk. Deine Regeln.',
      subline:
        'Verwandle deinen Deeper Connect Mini in einen Debian-basierten Netzwerkfilter. Sieh, welche Anfragen deine Geräte stellen, entscheide, was durchgelassen wird, und behalte die Kontrolle über dein Netzwerk.',
      primary: { label: 'Loslegen', to: { route: 'gettingStarted' } },
      secondary: { label: 'Live-Demo ausprobieren', to: { route: 'demo' } },
      tertiary: { label: 'Quelltext auf GitHub', to: { external: 'repo' } },
      note: 'Früher Stand, getestet auf einem Gerät. Kostenlos und quelloffen unter der MIT-Lizenz.',
    },
    tenSeconds: {
      title: 'NetSluice in 10 Sekunden',
      items: [
        { label: 'Was', value: 'Ein DNS-Filter für jedes Gerät in deinem Heimnetz, mit eigener Oberfläche.' },
        { label: 'Läuft auf', value: 'Dem Deeper Connect Mini, von einer microSD-Karte.' },
        { label: 'Verändert', value: 'Nichts am Gerät. Ohne Karte startet wieder das Originalsystem.' },
        { label: 'Motor', value: 'AdGuard Home auf schlichtem Debian. Listen im Format von AdGuard Home und Pi-hole.' },
        { label: 'Kostet', value: 'Nichts. MIT-Lizenz, keine Konten, keine kostenpflichtigen Funktionen.' },
        { label: 'Stand', value: 'Früh. Getestet auf einer Platine, mini_v21_20210521.' },
      ],
    },
    sluice: {
      title: 'Warum Schleuse',
      text: 'Eine Schleuse lässt Wasser durch oder hält es zurück. NetSluice macht das mit dem Verkehr eines Heimnetzes. Es beantwortet die DNS-Anfragen aller Geräte, hält die auf deinen Sperrlisten auf und zeigt dir, was passiert ist.',
    },
    howItWorks: {
      title: 'So funktioniert es',
      intro: 'Kein Löten, kein Öffnen des Gehäuses. Der Bootloader des Herstellers sieht zuerst auf der Karte nach.',
      steps: [
        {
          title: 'Karte schreiben',
          text: 'Abbild herunterladen, Prüfsumme prüfen, auf eine microSD-Karte mit 8 GB oder mehr schreiben.',
        },
        {
          title: 'Einstecken und einschalten',
          text: 'NetSluice richtet sich in ein paar Minuten selbst ein. Internet braucht es dafür nicht. Leuchtet die grüne LED dauerhaft, ist es fertig.',
        },
        {
          title: 'Passwort wählen',
          text: 'Öffne zu Hause http://netsluice.local/. Wer zuerst kommt, legt das Passwort fest. Mach das also gleich.',
        },
        {
          title: 'Router darauf zeigen lassen',
          text: 'Trag das Gerät im Router als DNS-Server ein. Jede Anfrage geht jetzt durch die Schleuse: durchgelassen oder aufgehalten.',
        },
      ],
      more: { label: 'So funktioniert es im Einzelnen', to: { route: 'howItWorks' } },
    },
    highlights: {
      title: 'Was es kann',
      intro: 'Alles hier läuft auf dem Gerät bei dir zu Hause.',
      features: ['filter', 'overview', 'devices', 'map', 'kids', 'updates'],
      more: { label: 'Alle Funktionen', to: { route: 'features' } },
    },
    privacy: {
      title: 'Entschieden wird zu Hause',
      text: 'Der Filter entscheidet auf dem Gerät bei dir zu Hause. Anfrageprotokoll, Zähler und Geräteliste bleiben dort. Was das Gerät doch verlässt und wann, steht geschrieben: Durchgelassene Anfragen gehen an den Auflöser, den du wählst, und etwa einmal am Tag fragt das Gerät bei GitHub nach einer neuen Version.',
      more: { label: 'Jeder Datenweg, aufgelistet', to: { doc: 'privacy-and-dns', hash: 'was-das-gerät-verlässt' } },
    },
    status: {
      title: 'Stand: früh, getestet auf einem Gerät',
      intro:
        'Alles wurde auf einem einzigen Deeper Connect Mini mit der Platinenbezeichnung mini_v21_20210521 entwickelt und getestet. Er läuft im Heimnetz seines Besitzers.',
      rows: [
        { item: 'Fertiges Abbild, Start von microSD', status: 'tested', note: 'Karte schreiben, einstecken, fertig.' },
        {
          item: 'Sichern, auf den internen Speicher installieren, Sicherung zurückspielen',
          status: 'tested',
          note: 'Alles aus der Oberfläche.',
        },
        {
          item: 'Beide Ethernet-Anschlüsse mit 1 Gbit/s, LEDs, Taster',
          status: 'tested',
          note: 'Auf der getesteten Platine.',
        },
        { item: 'Andere Versionen des Mini', status: 'untested', note: 'Bitte berichte, was du findest.' },
        { item: 'Deeper Connect Pico, Nano, Air', status: 'notSupported', note: 'Andere Hardware.' },
        { item: 'Inline-Betrieb („Schleuse“), Mithören', status: 'notImplemented', note: 'Noch nicht gebaut.' },
        { item: 'Die feste Adresse in der Oberfläche ändern', status: 'notImplemented', note: 'Noch nicht gebaut.' },
        {
          item: 'USB-C als Datenanschluss',
          status: 'notSupported',
          note: 'Funktioniert nicht. Er versorgt das Gerät weiter mit Strom.',
        },
      ],
      note: 'Ein WireGuard-Tunnel, um den Filter unterwegs zu nutzen, ist eine Idee für später. Er ist weder geplant noch gebaut.',
      more: { label: 'Hardware und Kompatibilität', to: { route: 'hardware' } },
    },
    openSource: {
      title: 'Open Source, und mit Absicht klein',
      text: 'Das ganze Projekt liegt auf GitHub, unter der MIT-Lizenz, gebaut aus wenigen, schlichten Teilen.',
      points: [
        'Der Dienst ist eine Python-Datei, nur mit der Standardbibliothek.',
        'Die Oberfläche ist schlichtes HTML, CSS und JavaScript. Kein Framework, kein Build-Schritt.',
        'AdGuard Home filtert, Caddy liefert aus, Debian ist die Grundlage.',
        'Root-Rechte hat nur ein kleiner Helfer mit einer kurzen Liste von Befehlen.',
        'Smoke-Tests für Anmeldung, Einstellungen und die Webserver-Konfiguration.',
      ],
      repo: { label: 'Quelltext lesen', to: { external: 'repo' } },
      contribute: { label: 'So machst du mit', to: { route: 'contributing' } },
    },
  },

  features: {
    title: 'Funktionen',
    intro:
      'Was NetSluice heute kann, auf der getesteten Platine. Jede Funktion führt zur Anleitung, die sie erklärt. Die Bilder stammen aus der Demo, mit erfundenen Daten.',
    items: [
      {
        id: 'filter',
        title: 'Filter für das ganze Netz',
        summary:
          'Jedes Gerät, das NetSluice fragt, wird gefiltert, mit den Sperrlisten, die du von AdGuard Home und Pi-hole kennst.',
        details: [
          'AdGuard Home ist der Filter-Motor.',
          'Liest die Listenformate von AdGuard Home und Pi-hole: Hosts-Dateien und Adblock-Listen.',
          'Ein Schalter pro Liste.',
          'Eine Auswahl bekannter Listen, darunter Listen gegen das eingebaute Tracking von Fernsehern, Handys und Windows.',
          'Jede Liste lässt sich über ihre Adresse hinzufügen.',
          '„Alle jetzt aktualisieren“ frischt alle Listen auf, mit Fortschrittsbalken.',
        ],
        caveat: 'Ein Gerät mit eigener DNS-Einstellung fragt NetSluice nicht und wird nicht gefiltert.',
        screenshot: 'filters',
        doc: 'first-steps',
      },
      {
        id: 'overview',
        title: 'Live-Übersicht',
        summary: 'Anfragen kommen an, werden in der Schleuse geprüft und laufen durch oder zerplatzen.',
        details: [
          'Ankommende Anfragen blau, durchgelassene grün, aufgehaltene zerplatzen rot.',
          'Die letzten 24 Stunden als Balken pro Stunde, mit dem Anteil, der aufgehalten wurde.',
          'Die meist aufgehaltenen Geräte, und die Adressen, die zuletzt und am häufigsten aufgehalten wurden.',
          '„Live“ in der Kopfzeile, solange das Gerät die Seite mit Daten versorgt.',
          'Ein Schalter in der Kopfzeile pausiert den Filter für zehn Minuten.',
        ],
        screenshot: 'overview',
        doc: 'first-steps',
      },
      {
        id: 'devices',
        title: 'Geräte, und eine Seite für jedes',
        summary:
          'Jedes Gerät, das den Filter benutzt hat, das am häufigsten aufgehaltene zuerst, mit dem, was sich über es herausfinden lässt.',
        details: [
          'Namen vom Router und aus dem, was Geräte im Netz über sich verraten (mDNS).',
          'Der Hersteller aus der Hardware-Adresse, die Art des Geräts (Handy, Fernseher, Drucker, Smart Home und mehr).',
          'Modell und Firmware, wo ein Gerät sie verrät.',
          'Zufällige („private“) MAC-Adressen werden als solche angezeigt.',
          'Ein Klick öffnet die Geräteseite: Anfragen pro Stunde, die am häufigsten aufgehaltenen und durchgelassenen Adressen, welche Liste aufgehalten hat, und die neuesten Anfragen einzeln.',
        ],
        screenshot: 'devices',
        doc: 'first-steps',
      },
      {
        id: 'map',
        title: 'Weltkarte',
        summary:
          'Wohin dein Netz spricht, gezeichnet in dem Moment, in dem es passiert, eingefärbt nach Verkehr und nach dem Anteil, der aufgehalten wurde.',
        details: [
          'Die Länder nach Verkehr der letzten 24 Stunden.',
          'Die Länderdaten (IP to Country Lite von DB-IP) liegen auf dem Gerät.',
          'Das angezeigte Land ist der Ort, an dem der antwortende Server registriert ist. Große Netze antworten aus einem Rechenzentrum in deiner Nähe.',
        ],
        caveat:
          'Die Karte erfasst nur IPv4 und zählt ein Ereignis pro A-Anfrage. Sie zeigt weniger Anfragen als die Übersicht und ist keine Aufzeichnung aller Verbindungen.',
        screenshot: 'map',
        doc: 'first-steps',
      },
      {
        id: 'kids',
        title: 'Kinder und Zeitpläne',
        summary: 'Internet an oder aus je Gerät, von Hand oder nach Uhrzeit, mit Zusatzzeit auf Knopfdruck.',
        details: [
          'Immer an, nach Zeitplan oder aus.',
          'Ein Zeitplan je Gerät: Wochentage und ein Zeitfenster.',
          'Zusatzzeit: +30 Minuten oder +1 Stunde, und „Zusatzzeit beenden“.',
          'Eine Regel folgt dem Gerät über seine Hardware-Adresse, auch wenn sich seine IP-Adresse ändert.',
        ],
        caveat:
          'Es funktioniert, indem die DNS-Anfragen des Geräts abgelehnt werden. Ein Gerät mit eigener DNS-Einstellung kommt daran vorbei.',
        doc: 'children-and-schedules',
      },
      {
        id: 'dns',
        title: 'Datenschutz und verschlüsseltes DNS',
        summary: 'Wähle, wen der Filter fragt und wie, und wie lange etwas aufbewahrt wird.',
        details: [
          'Sechs Auflöser mit DNS über HTTPS: Quad9, Quad9 ungefiltert, DNS4EU Protective, DNS4EU, Mullvad, Cloudflare.',
          'Ein neuer Auflöser wird getestet, bevor er zum Einsatz kommt.',
          'DNSSEC verwirft gefälschte Antworten.',
          'Anfrageprotokoll aufbewahren für 24 Stunden, 7, 30 oder 90 Tage.',
          'Verbergen, welches Gerät gefragt hat, oder alles Gesammelte löschen.',
        ],
        screenshot: 'settings',
        doc: 'privacy-and-dns',
      },
      {
        id: 'notify',
        title: 'Meldungen aufs Handy',
        summary: 'Über ntfy oder einen Webhook, wenn etwas passiert, das du wissen solltest.',
        details: [
          'Ein neues Gerät nutzt den Filter.',
          'Eine gefährliche Adresse wurde aufgehalten, höchstens einmal pro Stunde je Gerät und Adresse.',
          'Der Filter antwortet nicht, und noch einmal, wenn er wieder da ist.',
          'Eine Testmeldung, um zu prüfen, ob sie ankommt.',
        ],
        caveat: 'Meldungen verlassen dein Haus über den Dienst, den du wählst, mit Gerätenamen und Adressen.',
        doc: 'notifications',
      },
      {
        id: 'backup',
        title: 'Sichern und Installieren',
        summary:
          'Eine Kopie des Originalsystems behalten, NetSluice auf den internen Speicher bringen und die Kopie zurückspielen, wenn du es dir anders überlegst.',
        details: [
          'Eine vollständige, geprüfte Kopie des internen Speichers, auf die Karte geschrieben und bereit zum Herunterladen.',
          'Installation auf den internen Speicher, der etwa fünfmal so schnell liest wie die Karte.',
          'Das Zurückspielen prüft die Sicherung zuerst und liest danach alles zurück.',
          'Der Bootloader des Herstellers wird nie beschrieben. Sein Bereich wird vorher und nachher verglichen.',
        ],
        caveat: 'Die Installation löscht das Originalsystem. Mach zuerst die Sicherung.',
        doc: 'backup-and-install',
      },
      {
        id: 'updates',
        title: 'Updates mit Rückweg',
        summary:
          'NetSluice aktualisiert sich aus seinen Releases auf GitHub, von Hand oder einmal am Tag. Startet die neue Version nicht, kommt die alte zurück.',
        details: [
          'Sieht etwa einmal am Tag nach einer neuen Version. Nachsehen installiert nichts.',
          'Installieren mit einem Klick oder automatisch (anfangs aus).',
          'Lädt nur von GitHub. Die VERSION-Datei muss zum Tag des Release passen.',
          'Nur Oberfläche und Dienst werden ersetzt. Der Filter antwortet die ganze Zeit weiter.',
          'Updates des Debian-Systems darunter, auf Wunsch mit nächtlichen Sicherheitsupdates.',
        ],
        caveat: 'Releases sind nicht signiert. Es gibt Prüfsummen, keine Signaturen.',
        doc: 'updates',
      },
      {
        id: 'https',
        title: 'HTTPS im eigenen Netz',
        summary:
          'Wenn du es einschaltest, stellt das Gerät sein eigenes Zertifikat aus und bietet das Stammzertifikat zum Importieren an.',
        details: [
          'Ein Zertifikat für den Namen oder die Adresse, unter der du das Gerät öffnest.',
          'Das Stammzertifikat zum Herunterladen, mit seinem SHA-256-Fingerabdruck zum Vergleichen.',
          'HTTP bleibt erreichbar, niemand wird ausgesperrt.',
        ],
        doc: 'https',
      },
      {
        id: 'leds',
        title: 'LEDs und Taster',
        summary: 'Das Gerät zeigt, was es tut, ohne dass du eine Seite öffnest.',
        details: [
          'Grün blinkt, solange das Gerät läuft.',
          'Rot blitzt bei jeder aufgehaltenen Anfrage, wenn du willst.',
          'LEDs an, aus oder nachts aus.',
          'Der Taster pausiert den Filter für zehn Minuten. Ein zweiter Druck schaltet ihn wieder ein.',
          'Beim ersten Start zeigen die LEDs die Einrichtung: grün blinkend, grün dauerhaft, wenn es fertig ist, rot dauerhaft, wenn ein Schritt gescheitert ist.',
        ],
        doc: 'first-steps',
      },
      {
        id: 'appearance',
        title: 'Drei Designs, dunkel und hell',
        summary: 'Schleuse, Glas und Graphit, jedes in Dunkel und Hell.',
        details: [
          'Schleuse: tiefes Wasser, grüne Kacheln. Glas: Milchglas-Scheiben über weichen Farben. Graphit: ruhig und flach, die Übersicht wird zur Bühne mit deinen Geräten.',
          'Größe, Akzentfarbe, Animationen an oder aus.',
          'Gilt je Browser.',
        ],
        doc: 'first-steps',
      },
      {
        id: 'export',
        title: 'Export und Import',
        summary: 'Deine Einrichtung in eine Datei und zurück.',
        details: [
          'Filterlisten, Auflöser, Datenschutz, Kinderregeln, LEDs und Meldungen.',
          'Nicht das Passwort, nicht das Protokoll.',
          'Beim Einlesen kommt dazu, was fehlt, und seitdem hinzugefügte Listen bleiben.',
        ],
        doc: 'privacy-and-dns',
      },
      {
        id: 'languages',
        title: 'Deutsch und Englisch',
        summary: 'Die Oberfläche spricht beides und wechselt mit einem Klick.',
        details: ['Ein Sprachschalter in der Kopfzeile.', 'Folgt der Sprache des Browsers, bis du wählst.'],
      },
    ],
    limits: {
      title: 'Was es noch nicht kann',
      intro: 'Aufgeschrieben, damit es niemand auf die harte Tour herausfinden muss.',
      rows: [
        {
          item: 'Inline-Betrieb („Schleuse“)',
          status: 'notImplemented',
          note: 'NetSluice filtert als DNS-Server des Netzes.',
        },
        { item: 'Mithören', status: 'notImplemented', note: 'Noch nicht gebaut.' },
        {
          item: 'Die feste Adresse in der Oberfläche ändern',
          status: 'notImplemented',
          note: 'Die Oberfläche zeigt die Adresse. Eine Änderung, die schiefgeht, legt das Haus lahm. Deshalb braucht das erst einen sicheren Rückweg.',
        },
        {
          item: 'WireGuard-Tunnel für unterwegs',
          status: 'notImplemented',
          note: 'Eine Idee für später. Nicht geplant.',
        },
        { item: 'Signierte Releases', status: 'notImplemented', note: 'Es gibt SHA-256-Prüfsummen, keine Signaturen.' },
        { item: 'Tests für die Oberfläche', status: 'notImplemented', note: 'Smoke-Tests gibt es nur für den Dienst.' },
      ],
    },
    demo: { label: 'In der Live-Demo ansehen', to: { route: 'demo' } },
  },

  howItWorks: {
    title: 'So funktioniert es',
    intro:
      'Ein DNS-Filter beantwortet die Frage, die jedes Gerät stellt, bevor es sich irgendwohin verbindet: Welche Adresse gehört zu diesem Namen? NetSluice beantwortet sie, oder hält sie auf.',
    lookup: {
      title: 'Der Weg einer Anfrage',
      steps: [
        {
          title: 'Ein Gerät fragt',
          text: 'Dein Router verteilt NetSluice als DNS-Server. Jedes Gerät fragt es also nach der Adresse zu einem Namen.',
        },
        {
          title: 'Die Schleuse prüft',
          text: 'AdGuard Home vergleicht den Namen mit deinen eingeschalteten Listen und mit den Regeln für dieses Gerät.',
        },
        {
          title: 'Durchgelassen',
          text: 'Spricht nichts dagegen, geht die Frage weiter an den Auflöser, der unter Sicheres DNS eingestellt ist, und die Antwort kommt zurück. Alle sechs Auflöser, die dort zur Wahl stehen, nutzen DNS über HTTPS.',
        },
        {
          title: 'Oder aufgehalten',
          text: 'Steht der Name auf einer Liste oder ist das Gerät per Zeitplan ausgeschaltet, bekommt es die Adresse nicht. Von dort lädt nichts.',
        },
        {
          title: 'Du siehst es',
          text: 'Der NetSluice-Dienst liest das Protokoll des Filters und macht daraus die Live-Ansicht, die Zähler, die Geräteseiten und die Weltkarte.',
        },
      ],
    },
    boot: {
      title: 'Wie es auf das Gerät kommt',
      text: 'Der Mini ist ein naher Verwandter des FriendlyELEC NanoPi R2S (Rockchip RK3328), und sein Originalsystem baut auf Armbian auf. Der Bootloader des Herstellers sucht auf der microSD-Karte nach einem Startskript, bevor er das interne System startet. Eine passende Karte genügt also.',
      points: [
        'Kein Löten, kein Öffnen des Gehäuses.',
        'Am Gerät ändert sich nichts. Ohne Karte startet das Originalsystem, die Wallet eingeschlossen.',
        'Ein unverändertes NanoPi-R2S-Abbild startet auf dem Mini nicht. Drei Dinge sind auf dieser Platine anders, und NetSluice korrigiert sie in der Hardware-Beschreibung.',
        'Später zieht NetSluice auf Wunsch auf den internen Speicher um. Der Bootloader des Herstellers wird nie beschrieben.',
      ],
    },
    firstStart: {
      title: 'Der erste Start',
      intro:
        'Das fertige Abbild richtet sich ohne Internet ein. Eine Seite auf dem Gerät zeigt jeden Schritt, und die LEDs zeigen den Zustand.',
      steps: [
        { title: 'Warten auf das System', text: 'Debian beendet seinen eigenen ersten Start. Die grüne LED blinkt.' },
        { title: 'Auspacken', text: 'Die NetSluice-Dateien aus dem Abbild kommen an ihren Platz.' },
        { title: 'Webserver installieren', text: 'Aus den Paketen, die das Abbild mitbringt.' },
        { title: 'Filter einrichten', text: 'AdGuard Home, der Dienst, der Helfer und die Datendateien.' },
        {
          title: 'Starten',
          text: 'Antwortet alles, leuchtet die grüne LED dauerhaft. Ein gescheiterter Schritt lässt die rote LED leuchten und wird jede Minute neu versucht.',
        },
      ],
    },
    parts: {
      title: 'Woraus es besteht',
      intro: 'Fünf Teile, jedes mit einer Aufgabe.',
      items: [
        {
          title: 'AdGuard Home',
          text: 'Der Filter-Motor. Beantwortet DNS auf Port 53. Seine eigene Schnittstelle lauscht nur auf localhost, ohne eigenes Konto.',
        },
        {
          title: 'Caddy',
          text: 'Der Webserver. Liefert die Oberfläche aus und lässt ohne gültige Anmeldung nichts zum Motor oder zum Dienst durch.',
        },
        {
          title: 'netsluiced',
          text: 'Alles, was der Motor nicht macht: Anmeldung, Weltkarte, Geräteerkennung, Zeitpläne, LEDs und Taster, Meldungen. Eine Python-Datei, nur Standardbibliothek, ohne Sonderrechte.',
        },
        {
          title: 'netsluice-root',
          text: 'Der einzige Teil mit Root-Rechten. Nimmt nur eine kurze Liste von Befehlen an, prüft jedes Argument und verwirft Anfragen, die älter als 20 Sekunden sind.',
        },
        {
          title: 'Die Oberfläche',
          text: 'Schlichtes HTML, CSS und JavaScript-Module, auf Deutsch und Englisch. Live-Ansicht und Karte werden auf Canvas gezeichnet.',
        },
      ],
      diagramCaption: 'Aus docs/development.md im Repository (englisch beschriftet)',
      diagram,
    },
    dataFlows: {
      title: 'Was das Gerät verlässt',
      intro:
        'Entschieden wird auf dem Gerät. Das sind die Verbindungen, die es nach draußen aufbaut, alle aus dem Code.',
      columns: { what: 'Was', to: 'Wohin', when: 'Wann' },
      rows: [
        {
          what: 'Anfragen, die der Filter durchlässt',
          to: 'Der Auflöser, den du unter Sicheres DNS gewählt hast',
          when: 'Wenn ein Name nicht im Zwischenspeicher liegt',
        },
        {
          what: 'Aufgehaltene Adressen, um sie auf der Weltkarte einzuordnen',
          to: 'Der ungefilterte Auflöser von Quad9 (9.9.9.10), gewöhnliches DNS',
          when: 'Höchstens einmal pro Stunde je Adresse',
        },
        {
          what: 'Eine Frage nach deiner öffentlichen Adresse, um dein Zuhause auf der Karte einzuordnen',
          to: 'Der Nameserver von Google, gewöhnliches DNS',
          when: 'Beim Start, dann etwa alle sechs Stunden',
        },
        {
          what: 'Filterlisten',
          to: 'Die Betreiber der Listen, die du eingeschaltet hast',
          when: 'Wenn die Listen aufgefrischt werden',
        },
        {
          what: 'Nachsehen nach einer neuen Version (deine Adresse und die installierte Version)',
          to: 'GitHub',
          when: 'Etwa einmal am Tag',
        },
        {
          what: 'Updates von NetSluice',
          to: 'GitHub',
          when: 'Wenn du eins installierst, oder täglich, wenn du das eingeschaltet hast',
        },
        {
          what: 'Updates des Systems darunter',
          to: 'Die Paketquellen des Systems (Debian, Armbian)',
          when: 'Wenn du danach suchst oder sie installierst, oder nachts, wenn du das eingeschaltet hast',
        },
        {
          what: 'Meldungen aufs Handy',
          to: 'Der ntfy-Server oder Webhook, den du eingetragen hast',
          when: 'Nur, wenn du sie eingeschaltet hast',
        },
      ],
      note: 'Anfrageprotokoll, Zähler, Geräteliste, Zeitpläne und deine Einstellungen bleiben auf dem Gerät.',
    },
    updates: {
      title: 'Wie ein Update abläuft',
      steps: [
        {
          title: 'Nachsehen',
          text: 'Etwa einmal am Tag fragt das Gerät GitHub nach dem neuesten Release, Vorabversionen eingeschlossen.',
        },
        {
          title: 'Laden und prüfen',
          text: 'Nur von GitHub, über HTTPS, höchstens 30 MB. Die VERSION-Datei muss zum Tag passen, und der Code muss sich übersetzen lassen.',
        },
        { title: 'Ersetzen', text: 'Nur Oberfläche und Dienst. Der Filter-Motor antwortet weiter.' },
        {
          title: 'Bestätigen oder zurück',
          text: 'Antwortet der Dienst nicht innerhalb von etwa 40 Sekunden, kommt die vorherige Version zurück.',
        },
      ],
    },
    homeOnly: {
      title: 'Gemacht für dein Heimnetz',
      text: 'Die Oberfläche unter http://netsluice.local/ ist nur für dein Heimnetz. Leite sie, oder den DNS-Port des Geräts, nie ins Internet weiter.',
    },
  },

  hardware: {
    title: 'Hardware',
    intro:
      'NetSluice läuft auf dem Deeper Connect Mini. Alles hier wurde an einem Gerät mit der Platinenbezeichnung mini_v21_20210521 ausgelesen. Versteh es als Beschreibung dieser Version.',
    specs: {
      title: 'Deeper Connect Mini (mini_v21)',
      columns: { part: 'Teil', value: 'Befund' },
      rows: [
        { label: 'SoC', value: 'Rockchip RK3328, 4 × Cortex-A53, bis 1,3 GHz, AES/SHA-Erweiterungen' },
        { label: 'RAM', value: '2 GB' },
        { label: 'Speicher', value: '8 GB eMMC (Samsung), microSD-Steckplatz' },
        { label: 'Ethernet 1', value: 'RK3328 GMAC mit einem Motorcomm-YT8521-PHY an MDIO-Adresse 3' },
        { label: 'Ethernet 2', value: 'Realtek RTL8153 an USB 3.0' },
        { label: 'USB', value: 'ein USB-A-Anschluss (USB 2.0), USB-C für den Strom' },
        {
          label: 'Serielle Konsole',
          value: '3 Lötpunkte mit der Aufschrift G TX RX neben dem microSD-Steckplatz, 3,3 V, 1.500.000 Baud',
        },
        { label: 'LEDs', value: 'grün an gpio0 Pin 2, rot an gpio2 Pin 18' },
        { label: 'Taster', value: 'Reset-Taste an gpio0 Pin 0, erscheint als gpio-keys-Eingabe' },
        { label: 'PMIC', value: 'RK805' },
      ],
    },
    measured: {
      title: 'Gemessen',
      note: 'Unter Armbian mit Kernel 6.18.',
      rows: [
        { label: 'AES-256-GCM', value: 'etwa 520 MB/s auf einem Kern' },
        { label: 'ChaCha20-Poly1305', value: 'etwa 215 MB/s auf einem Kern' },
        { label: 'eMMC, sequenziell lesen', value: 'etwa 133 MB/s' },
        { label: 'microSD, sequenziell lesen', value: 'etwa 24 MB/s' },
        { label: 'Temperatur im Leerlauf', value: '53 bis 56 °C' },
      ],
    },
    compatibility: {
      title: 'Welche Geräte',
      intro: 'NetSluice wurde auf genau einer Platine entwickelt und getestet.',
      columns: { item: 'Gerät', status: 'Status', note: 'Hinweis' },
      rows: [
        {
          item: 'Deeper Connect Mini, Platine mini_v21_20210521',
          status: 'tested',
          note: 'Auf dieser Platine entwickelt und getestet. Sie läuft im Heimnetz ihres Besitzers.',
        },
        {
          item: 'Deeper Connect Mini, andere Platinenversionen',
          status: 'untested',
          note: 'Frag die Platine zuerst ab. Bitte berichte, was du findest, auch wenn es nicht klappt.',
        },
        { item: 'Deeper Connect Pico', status: 'notSupported', note: 'Andere Hardware.' },
        { item: 'Deeper Connect Nano', status: 'notSupported', note: 'Andere Hardware.' },
        { item: 'Deeper Connect Air', status: 'notSupported', note: 'Andere Hardware.' },
      ],
    },
    functions: {
      title: 'Auf der getesteten Platine',
      rows: [
        {
          item: 'Start von der microSD-Karte',
          status: 'tested',
          note: 'Die Karte kommt vor dem internen Speicher dran.',
        },
        {
          item: 'Beide Ethernet-Anschlüsse mit 1 Gbit/s',
          status: 'tested',
          note: 'Schleifentest zwischen beiden Anschlüssen: 5000 Pings mit 1400 Byte, ohne Verlust.',
        },
        { item: 'LEDs und Taster', status: 'tested', note: 'Grüne und rote LED, Reset-Taste.' },
        {
          item: 'Sichern, Installation auf die eMMC, Sicherung zurückspielen',
          status: 'tested',
          note: 'Aus der Oberfläche.',
        },
        {
          item: 'USB-C als Datenanschluss',
          status: 'notSupported',
          note: 'Funktioniert nicht. USB-C versorgt das Gerät weiter mit Strom.',
        },
      ],
    },
    limitations: {
      title: 'Noch nicht gebaut',
      intro: 'Bekannte Lücken, wie das Projekt selbst sie auflistet.',
      rows: [
        { item: 'Inline-Betrieb („Schleuse“)', status: 'notImplemented', note: 'Noch nicht gebaut.' },
        { item: 'Mithören', status: 'notImplemented', note: 'Noch nicht gebaut.' },
        {
          item: 'Die feste Adresse in der Oberfläche ändern',
          status: 'notImplemented',
          note: 'Eine Änderung, die schiefgeht, würde das Haus lahmlegen. Deshalb braucht das erst einen sicheren Rückweg.',
        },
        {
          item: 'WireGuard-Tunnel',
          status: 'notImplemented',
          note: 'Eine Idee für später. Nicht geplant. Das Gerät müsste von außen erreichbar sein, und das kann NetSluice nicht selbst einrichten.',
        },
      ],
    },
    boot: {
      title: 'Wie das Gerät startet',
      text: 'Der Bootloader auf der eMMC ist U-Boot 2020.07 aus einem Armbian-Build. mmc1 ist die microSD-Karte und mmc0 die eMMC, die Karte kommt also zuerst dran. Das Herstellersystem auf der eMMC ist Armbian mit Kernel 5.9.11 und einem mit LUKS verschlüsselten Wurzeldateisystem. NetSluice fasst es nicht an und braucht es nicht.',
      code: 'boot_targets=mmc1 mmc0 usb0 pxe dhcp',
    },
    differences: {
      title: 'Drei Unterschiede zum NanoPi R2S',
      intro:
        'Ein unverändertes NanoPi-R2S-Abbild startet den Kernel, kommt aber nie hoch. NetSluice ändert die Hardware-Beschreibung an drei Stellen.',
      items: [
        {
          title: 'Die microSD-Karte verschwindet',
          text: 'Die NanoPi-Beschreibung schaltet die Karte über einen Spannungsregler auf 1,8 V, der hier anders verdrahtet ist. Die Korrektur betreibt die Karte mit 3,3 V, wie die Beschreibung des Herstellers.',
        },
        {
          title: 'Falsche PHY-Adresse',
          text: 'Der Ethernet-PHY sitzt an Adresse 3, nicht 1. Die Korrektur übernimmt auch die Reset-Zeiten des Herstellers.',
        },
        {
          title: 'Der PHY-Takt ist abgeschaltet',
          text: 'Ein aktueller Kernel schaltet den 125-MHz-Takt ab, den der Netzwerk-Controller braucht. Die Verbindung steht, aber kein einziges Paket geht raus. Die Korrektur lässt den Takt an.',
        },
      ],
    },
    probe: {
      title: 'Frag deine Platine zuerst ab',
      text: 'Ein winziges Startskript lässt den Bootloader seine Einstellungen auf die Karte schreiben und den normalen Start dann weiterlaufen. Es schreibt nur auf die Karte und ändert nichts am Gerät. Formatier eine Karte mit einer FAT32-Partition, markier sie als startfähig, kopier boot.scr darauf, starte einmal und lies dann probe-env.txt.',
      command: 'python3 scripts/probe/mkscr.py scripts/probe/boot.cmd boot.scr',
      expectedIntro: 'Auf der getesteten Platine sind das die interessanten Zeilen:',
      expected:
        'board=evb_rk3328\nsoc=rk3328\nfdtfile=rockchip/rk3328-nanopi-r2-rev00.dtb\nboot_targets=mmc1 mmc0 usb0 pxe dhcp\nbaudrate=1500000',
      warning:
        'probe-env.txt enthält die Seriennummer und die MAC-Adressen deines Geräts. Entfern sie, bevor du die Datei irgendwo veröffentlichst.',
    },
    serial: {
      title: 'Serielle Konsole',
      text: 'Für die Installation nicht nötig, zur Fehlersuche nützlich. Nimm einen USB-UART-Adapter für 3,3 V, der 1.500.000 Baud schafft. Verbinde nur G, TX und RX, kreuze TX und RX, und schließ nie den VCC-Pin des Adapters an.',
    },
    report: {
      title: 'Eine andere Platine ausprobiert?',
      text: 'Bitte berichte, was du findest, auch wenn es nicht klappt. Am meisten helfen die Platinenbezeichnung, probe-env.txt ohne Seriennummer und MACs, und was funktioniert hat.',
      cta: { label: 'So meldest du eine Platine', to: { route: 'contributing' } },
    },
  },

  gettingStarted: {
    title: 'Loslegen',
    intro:
      'Der einfache Weg: das fertige Abbild auf eine Karte schreiben, einstecken, und NetSluice richtet sich selbst ein. Lies vorher die Warnungen.',
    prerequisites: {
      title: 'Was du brauchst',
      items: [
        'Einen Deeper Connect Mini. Getestet auf der Platine mini_v21_20210521.',
        'Eine microSD-Karte mit 8 GB oder mehr.',
        'Ein Netzwerkkabel zu deinem Router.',
        'Irgendeinen Rechner mit balenaEtcher oder dem Raspberry Pi Imager.',
        'Einen Router, bei dem du den DNS-Server einstellen kannst.',
      ],
    },
    steps: {
      title: 'Zehn Schritte',
      items: [
        {
          title: 'Abbild herunterladen',
          text: 'Hol dir das neueste netsluice-<version>-deeper-connect-mini.img.xz und die .sha256-Datei daneben.',
        },
        {
          title: 'Download prüfen',
          text: 'Im Ordner mit beiden Dateien. Es muss OK dastehen.',
          code: 'sha256sum -c netsluice-*.img.xz.sha256',
        },
        {
          title: 'Auf die Karte schreiben',
          text: 'Mit balenaEtcher oder dem Raspberry Pi Imager (in der englischen Oberfläche „Use custom“). Beide nehmen die .xz-Datei, wie sie ist.',
        },
        {
          title: 'Optional: SSH',
          text: 'Um dich am System darunter anzumelden, leg deinen öffentlichen Schlüssel als /boot/netsluice-ssh.pub auf die Karte. Die Karte ist ext4, dafür brauchst du einen Linux-Rechner.',
        },
        { title: 'Karte einstecken', text: 'Trenn den Mini erst vom Strom, dann steck die Karte ein.' },
        {
          title: 'Verbinden und einschalten',
          text: 'Verbinde einen Ethernet-Anschluss mit deinem Router und schalte den Mini ein.',
        },
        {
          title: 'Auf die grüne LED warten',
          text: 'Sie blinkt, während sich NetSluice einrichtet. Das dauert ein paar Minuten und braucht kein Internet. Leuchtet sie dauerhaft, ist es fertig.',
        },
        {
          title: 'Oberfläche öffnen',
          text: 'Unter http://netsluice.local/, oder unter der Adresse, die dein Router für das Gerät „netsluice“ anzeigt.',
        },
        {
          title: 'Sofort das Passwort wählen',
          text: 'Wer zuerst kommt, legt es fest. Nimm mindestens 8 Zeichen. Ein Zurücksetzen per E-Mail gibt es nicht.',
        },
        {
          title: 'DNS im Router einstellen',
          text: 'Trag die Adresse des Geräts im Router als DNS-Server ein. Die Filterlisten werden geladen, sobald das Gerät das Internet erreicht. Bis dahin wird nichts aufgehalten.',
        },
      ],
    },
    leds: {
      title: 'Was die LEDs bei der Einrichtung sagen',
      columns: { led: 'LED', meaning: 'Bedeutung' },
      rows: [
        { label: 'Grün blinkt', value: 'NetSluice richtet sich ein.' },
        { label: 'Grün leuchtet', value: 'Fertig.' },
        {
          label: 'Rot leuchtet',
          value:
            'Ein Schritt ist fehlgeschlagen. Er wird jede Minute neu versucht. Die Seite auf dem Gerät sagt, was nicht stimmt.',
        },
      ],
      normal:
        'Im normalen Betrieb blinkt die grüne LED, solange das Gerät läuft, und die rote blitzt bei jeder aufgehaltenen Anfrage. Beides lässt sich in den Einstellungen ändern.',
    },
    warnings: {
      title: 'Lies das zuerst',
      items: [
        {
          title: 'Sichern, bevor du auf den internen Speicher installierst',
          text: 'Von der Karte zu starten, ändert nichts. Bevor du NetSluice auf den internen Speicher bringst, sichere ihn in der Oberfläche und lade die Sicherung herunter.',
        },
        {
          title: 'Die Installation auf den internen Speicher löscht das Originalsystem',
          text: 'Ohne Sicherung lässt es sich nicht zurückholen.',
        },
        {
          title: 'Deine Wallet',
          text: 'Wenn auf deinem Gerät eine Wallet liegt, sorg vor der Installation dafür, dass du ihre Seed-Phrase oder den Keystore hast.',
        },
        {
          title: 'Zurückspielen braucht eine gültige Sicherung',
          text: 'Sie wird geprüft, bevor etwas geschrieben wird, und geht nur auf den Speicher zurück, von dem sie stammt.',
        },
        {
          title: 'Deine Platine kann anders sein',
          text: 'Getestet ist nur mini_v21_20210521. Andere Versionen sind ungetestet. Pico, Nano und Air werden nicht unterstützt.',
        },
        { title: 'Lass die Oberfläche zu Hause', text: 'Leite sie, oder den DNS-Port, nie ins Internet weiter.' },
        {
          title: 'Auf eigenes Risiko',
          text: 'Es gibt keine Gewährleistung. Ein Filter, der ausfällt, nimmt die Namensauflösung deines Netzes mit. Karte ziehen oder den DNS-Server im Router zurückstellen ist der Ausweg.',
        },
      ],
    },
    after: {
      title: 'Danach',
      items: [
        'Wähl deine Filterlisten unter Filter.',
        'Sieh dir Übersicht, Geräte und Weltkarte an.',
        'Entscheide unter Einstellungen, Updates, ob neue Versionen sich selbst installieren.',
        'Wenn du dir sicher bist, bring NetSluice auf den internen Speicher, mit Sicherung vorab.',
      ],
    },
    buildYourself: {
      title: 'Lieber selbst bauen?',
      text: 'Pass ein unverändertes Armbian-Abbild für den NanoPi R2S an und installiere NetSluice darauf über SSH. Du brauchst einen Linux-Rechner und eine Karte mit 16 GB oder mehr.',
      cta: { label: 'Selbst bauen', to: { doc: 'build-from-source' } },
    },
    help: {
      title: 'Wenn etwas nicht klappt',
      text: 'Zieh die Karte, und das Originalsystem startet wieder. Die Anleitung zum Probleme lösen deckt Einrichtung, Oberfläche, Filter und den Weg zurück ab.',
      cta: { label: 'Probleme lösen und zurückkommen', to: { doc: 'troubleshooting' } },
    },
  },

  downloads: {
    title: 'Downloads',
    intro: 'Das fertige Abbild für die microSD-Karte. Schreib es, prüf es, und aktualisiere danach in der Oberfläche.',
    latestVersion: {
      title: 'Neueste Version',
      text: 'Das neueste Release. Ein laufendes Gerät aktualisiert sich darauf, unter Einstellungen, Updates.',
    },
    latestImage: {
      title: 'Neuestes Abbild',
      text: 'Das neueste Release mit einem Abbild für die Karte. Nicht jedes Release bringt eins mit: Kleine Releases enthalten nur das Update-Archiv und erreichen ein laufendes Gerät als Update.',
    },
    sameRelease: (version) => `Gerade bringt die neueste Version, ${version}, auch das neueste Abbild mit.`,
    differentRelease: (imageVersion, latestVersion) =>
      `Das neueste Abbild ist ${imageVersion}. Schreib es auf die Karte und aktualisiere danach in der Oberfläche auf ${latestVersion}.`,
    noImage: 'In den Release-Daten ließ sich kein Abbild finden. Die Releases auf GitHub listen jede Datei.',
    updateOnly:
      'Releases ohne Abbild enthalten netsluice-<version>.tar.gz, das Update-Archiv, das ein Gerät selbst herunterlädt. Du musst es nicht herunterladen.',
    labels: {
      image: 'Abbild für die Karte',
      checksumFile: 'SHA-256-Prüfsummendatei',
      updateArchive: 'Update-Archiv',
      sha256: 'SHA-256',
      size: 'Größe',
      published: 'Veröffentlicht',
      prerelease: 'Vorabversion',
      releaseNotes: 'Release-Notizen',
      allReleases: 'Alle Releases auf GitHub',
      olderImages: 'Ältere Abbilder',
      download: 'Herunterladen',
    },
    verify: {
      title: 'Prüf deinen Download',
      intro: 'Leg das Abbild und seine .sha256-Datei in denselben Ordner, dann:',
      platforms: [
        { os: 'Linux', command: 'sha256sum -c netsluice-*.img.xz.sha256', note: 'Es muss OK dastehen.' },
        { os: 'macOS', command: 'shasum -a 256 -c netsluice-*.img.xz.sha256', note: 'Es muss OK dastehen.' },
        {
          os: 'Windows (PowerShell)',
          command: 'Get-FileHash -Algorithm SHA256 .\\netsluice-<version>-deeper-connect-mini.img.xz',
          note: 'Vergleich den ausgegebenen Wert mit dem in der .sha256-Datei. Groß- und Kleinschreibung spielen keine Rolle.',
        },
      ],
      noSignature:
        'Eine Prüfsumme zeigt, dass die Datei vollständig und unverändert angekommen ist. Releases sind nicht signiert: Es gibt Prüfsummen, keine Signaturen.',
    },
    source: {
      live: (date) => `Release-Daten von GitHub, abgerufen am ${date} beim Bauen dieser Seite.`,
      cache: (date) =>
        `GitHub war beim Bauen dieser Seite nicht erreichbar. Gezeigt werden die letzten bekannten Daten, vom ${date}.`,
      none: 'Release-Daten sind gerade nicht verfügbar. Alle Releases stehen auf GitHub.',
    },
  },

  changelog: {
    title: 'Änderungen',
    intro: 'Jedes Release, das neueste zuerst, wie auf GitHub veröffentlicht.',
    notesLanguage: 'Die Release-Notizen gibt es nur auf Englisch, so wie sie auf GitHub stehen.',
    imageBadge: 'Mit Abbild',
    prereleaseBadge: 'Vorabversion',
    noFiles: 'Keine Dateien angehängt.',
    empty: 'Gerade sind keine Release-Daten verfügbar. Alle Releases stehen auf GitHub.',
  },

  demo: {
    title: 'Live-Demo',
    intro:
      'Das ist die Oberfläche von NetSluice selbst, in deinem Browser, mit erfundenen Daten. Klick dich durch: Nichts, was du hier tust, erreicht ein Gerät.',
    points: [
      'Derselbe Code der Oberfläche, den ein Gerät ausliefert.',
      'Ein ausgedachter Haushalt mit erfundenen Geräten und Zielen.',
      'Schalter antworten, ändern aber nichts.',
      'Sie spricht mit keinem Gerät und keinem Dienst von außen.',
    ],
    open: 'Demo im Vollbild öffnen',
    local: {
      title: 'Auf deinem eigenen Rechner',
      text: 'Mit python3 und einer Kopie des Repositorys. Dann öffne http://127.0.0.1:8099/?lang=de.',
      command: 'python3 scripts/demo.py',
    },
  },

  donate: {
    title: 'NetSluice unterstützen',
    text: 'NetSluice ist kostenlos und Open Source unter der MIT-Lizenz. Es gibt keine kostenpflichtigen Funktionen. Wenn es dir nützt, hilft eine Spende über PayPal, dass es weitergeht.',
    button: 'Über PayPal spenden',
    points: ['Keine Konten, keine kostenpflichtigen Funktionen.', 'Berichte und Pull Requests helfen genauso.'],
    note: 'Öffnet PayPal. Auf dieser Website findet keine Zahlung statt.',
  },

  faq: {
    title: 'Fragen und Antworten',
    intro: 'Kurze Antworten. Die Einzelheiten stehen in der Dokumentation.',
  },

  docs: {
    title: 'Dokumentation',
    intro:
      'NetSluice installieren, benutzen, aktualisieren und selbst bauen. Geschrieben nach dem Repository, und das hat recht, falls beide sich einmal widersprechen.',
  },
};
