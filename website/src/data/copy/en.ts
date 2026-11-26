// English copy for the structured pages. Sources: WEBSITE_CONTENT_AUDIT.md.
import type { Copy } from './types';

const diagram = ` browser ──HTTP──▶ Caddy :80 ──┬─ static files            web/
                               ├─ /auth/*  ─────────────▶ netsluiced :3002   (no session needed)
                               └─ /control/*, /api/*
                                    │  forward_auth: GET /auth/check on netsluiced
                                    ├─ /control/* ──────▶ AdGuard Home :3001  (the filter engine)
                                    └─ /api/*     ──────▶ netsluiced :3002

 devices ──DNS :53──▶ AdGuard Home

 netsluiced ──request file──▶ netsluice-root (started by systemd, runs as root)`;

export const en: Copy = {
  locale: 'en',

  common: {
    productName: 'NetSluice',
    demoLabel: 'Demo · invented data',
    statusLabels: {
      tested: 'Tested',
      experimental: 'Experimental',
      untested: 'Untested',
      notSupported: 'Not supported',
      notImplemented: 'Not implemented',
    },
    docSections: {
      start: 'Start',
      install: 'Install',
      use: 'Use',
      hardware: 'Hardware',
      develop: 'Develop',
    },
    faqCategories: {
      basics: 'The basics',
      install: 'Installing',
      use: 'Using it',
      updates: 'Updates',
      security: 'Security',
      project: 'The project',
    },
    screenshots: {
      overview: {
        alt: 'Overview: requests arrive, are checked in the sluice, and pass or are stopped',
        caption: 'Overview with the live view. Demo · invented data',
      },
      devices: {
        alt: 'Devices, the one stopped most often first, with name, maker and kind',
        caption: 'Devices. Demo · invented data',
      },
      filters: {
        alt: 'Filter lists with one switch each',
        caption: 'Filter lists. Demo · invented data',
      },
      map: {
        alt: 'World map of where the network talks to',
        caption: 'World map. Demo · invented data',
      },
      settings: {
        alt: 'Settings as tiles',
        caption: 'Settings. Demo · invented data',
      },
    },
    localUiNote:
      'http://netsluice.local/ only works inside your home network, where your NetSluice runs. This website never connects to it.',
    trademark:
      'NetSluice is not affiliated with, endorsed by, or supported by Deeper Network. "Deeper Connect" is their trademark and is used here only to say which hardware NetSluice runs on.',
    disclaimerShort:
      'No warranty. You are modifying a network device at your own risk, and a filter that fails takes the name lookups of your network with it.',
    updated: (date) => `Updated ${date}`,
    sourceLink: 'Source in the repository',
  },

  meta: {
    home: {
      title: 'NetSluice: your network, your rules',
      description:
        'Open-source DNS filter for the Deeper Connect Mini. Plain Debian, AdGuard Home and an interface of its own, running from a microSD card.',
    },
    features: {
      title: 'Features',
      description:
        'Network-wide filtering, a live overview, devices, a world map, schedules for children, encrypted DNS, updates with rollback and more.',
    },
    howItWorks: {
      title: 'How it works',
      description:
        'How a lookup passes the sluice, how NetSluice gets onto the device, which parts it is made of, and which data leaves the device.',
    },
    hardware: {
      title: 'Hardware',
      description:
        'The Deeper Connect Mini (mini_v21): specifications, what was tested, what is not supported, and what is not built yet.',
    },
    gettingStarted: {
      title: 'Getting started',
      description: 'From download to a filtered home network in ten steps, with the warnings you should read first.',
    },
    docs: {
      title: 'Documentation',
      description: 'Installing, using, updating and building NetSluice, in detail.',
    },
    downloads: {
      title: 'Downloads',
      description: 'The newest NetSluice image for the microSD card, with its SHA-256 checksum, and how to check it.',
    },
    changelog: {
      title: 'Changelog',
      description: 'Every NetSluice release with its notes, as published on GitHub.',
    },
    faq: {
      title: 'Questions and answers',
      description: 'Short answers about hardware, installation, privacy, updates, security and the project.',
    },
    demo: {
      title: 'Live demo',
      description: 'The real NetSluice interface in your browser, with invented data. It contacts no device.',
    },
    security: {
      title: 'Security',
      description:
        'What protects a NetSluice, what does not, why the interface stays at home, and how to report a problem.',
    },
    privacy: {
      title: 'Privacy',
      description:
        'What this website does with your data, what stays on your NetSluice, and which outside services come into play.',
    },
    about: {
      title: 'About',
      description: 'Where NetSluice comes from, who makes it, and the principles it is built on.',
    },
    contributing: {
      title: 'Contributing',
      description: 'Reports from other boards, bug reports, ideas and pull requests.',
    },
    license: {
      title: 'Licence',
      description: 'NetSluice is under the MIT licence. What it builds on keeps its own licences.',
    },
    support: {
      title: 'Support and contact',
      description: 'Where to ask, where to report, and how to support NetSluice with a donation.',
    },
  },

  home: {
    hero: {
      eyebrow: 'Open source · for the Deeper Connect Mini',
      headline: 'Your Network. Your Rules.',
      subline:
        'Turn your Deeper Connect Mini into a Debian-powered network filter. See what your devices request, decide what gets through, and keep control of your network.',
      primary: { label: 'Get started', to: { route: 'gettingStarted' } },
      secondary: { label: 'Try the live demo', to: { route: 'demo' } },
      tertiary: { label: 'Source on GitHub', to: { external: 'repo' } },
      note: 'Early version, tested on one device. Free and open source under the MIT licence.',
    },
    tenSeconds: {
      title: 'NetSluice in 10 seconds',
      items: [
        { label: 'What', value: 'A DNS filter for every device in your home network, with its own interface.' },
        { label: 'Runs on', value: 'The Deeper Connect Mini, from a microSD card.' },
        { label: 'Changes', value: 'Nothing on the device. Remove the card and the original system starts.' },
        { label: 'Engine', value: 'AdGuard Home, on plain Debian. Lists in AdGuard Home and Pi-hole format.' },
        { label: 'Costs', value: 'Nothing. MIT licence, no accounts, no paid features.' },
        { label: 'Status', value: 'Early. Tested on one board, mini_v21_20210521.' },
      ],
    },
    sluice: {
      title: 'Why a sluice',
      text: 'A sluice is a gate that lets water through or holds it back. NetSluice does that for the traffic of a home network. It answers the DNS lookups of every device, stops the ones on your block lists, and shows you what happened.',
    },
    howItWorks: {
      title: 'How it works',
      intro: 'No soldering, no opening the case. The vendor bootloader looks for the card first.',
      steps: [
        {
          title: 'Write the card',
          text: 'Download the image, check its checksum, write it to a microSD card of 8 GB or more.',
        },
        {
          title: 'Insert and power up',
          text: 'NetSluice sets itself up in a few minutes. It needs no internet for that. The green LED is steady when it is ready.',
        },
        {
          title: 'Choose your password',
          text: 'Open http://netsluice.local/ at home. The first visitor chooses the password, so do it right away.',
        },
        {
          title: 'Point your router at it',
          text: 'Enter the device as DNS server in your router. Every lookup now passes the sluice: let through, or stopped.',
        },
      ],
      more: { label: 'How it works in detail', to: { route: 'howItWorks' } },
    },
    highlights: {
      title: 'What it does',
      intro: 'Everything below runs on the device in your home.',
      features: ['filter', 'overview', 'devices', 'map', 'kids', 'updates'],
      more: { label: 'All features', to: { route: 'features' } },
    },
    privacy: {
      title: 'Decided at home',
      text: 'The filter decides on the device in your home. The request log, the counters and the device list stay there. What does leave the device, and when, is written down: lookups that are let through go to the resolver you choose, and the device asks GitHub about once a day for a new version.',
      more: { label: 'Every data flow, listed', to: { doc: 'privacy-and-dns', hash: 'what-leaves-the-device' } },
    },
    status: {
      title: 'Status: early, tested on one device',
      intro:
        "Everything was developed and tested on a single Deeper Connect Mini with the board marking mini_v21_20210521. It runs its owner's home network.",
      rows: [
        { item: 'Ready-made image, boot from microSD', status: 'tested', note: 'Write the card, insert it, done.' },
        {
          item: 'Backup, install to internal storage, put the backup back',
          status: 'tested',
          note: 'All from the interface.',
        },
        { item: 'Both Ethernet ports at 1 Gbit/s, LEDs, button', status: 'tested', note: 'On the tested board.' },
        { item: 'Other revisions of the Mini', status: 'untested', note: 'Please report what you find.' },
        { item: 'Deeper Connect Pico, Nano, Air', status: 'notSupported', note: 'Different hardware.' },
        { item: 'Inline ("sluice") mode, listening mode', status: 'notImplemented', note: 'Not built yet.' },
        { item: 'Changing the fixed address from the interface', status: 'notImplemented', note: 'Not built yet.' },
        { item: 'USB-C as a data port', status: 'notSupported', note: 'Does not work. It still powers the device.' },
      ],
      note: 'A WireGuard tunnel, to use the filter away from home, is an idea for later. It is not planned and not built.',
      more: { label: 'Hardware and compatibility', to: { route: 'hardware' } },
    },
    openSource: {
      title: 'Open source, and small on purpose',
      text: 'The whole project is on GitHub under the MIT licence, built from few and plain parts.',
      points: [
        'The service is one Python file, standard library only.',
        'The interface is plain HTML, CSS and JavaScript. No framework, no build step.',
        'AdGuard Home filters, Caddy serves, Debian is the base.',
        'Only a small helper with a short list of commands has root rights.',
        'Smoke tests for sign-in, settings and the web server configuration.',
      ],
      repo: { label: 'Read the source', to: { external: 'repo' } },
      contribute: { label: 'How to contribute', to: { route: 'contributing' } },
    },
  },

  features: {
    title: 'Features',
    intro:
      'What NetSluice does today, on the tested board. Each feature links to the guide that explains it. The pictures are from the demo, with invented data.',
    items: [
      {
        id: 'filter',
        title: 'Filtering for the whole network',
        summary:
          'Every device that asks NetSluice is filtered, with the block lists known from AdGuard Home and Pi-hole.',
        details: [
          'AdGuard Home is the filter engine.',
          'Reads the list formats of AdGuard Home and Pi-hole: hosts files and adblock-style lists.',
          'One switch per list.',
          'A choice of well-known lists, among them lists against the built-in tracking of TVs, phones and Windows.',
          'Add any list by its address.',
          '"Update all now" refreshes every list, with a progress bar.',
        ],
        caveat: 'A device with its own DNS setting does not ask NetSluice and is not filtered.',
        screenshot: 'filters',
        doc: 'first-steps',
      },
      {
        id: 'overview',
        title: 'Live overview',
        summary: 'Lookups arrive, are checked inside the sluice, and pass or burst.',
        details: [
          'Arriving lookups in blue, let through in green, stopped ones burst in red.',
          'The last 24 hours as bars per hour, with the share that was stopped.',
          'The devices stopped most often, and the names stopped most recently and most often.',
          '"Live" in the top bar while the device feeds the page.',
          'A switch in the top bar pauses the filter for ten minutes.',
        ],
        screenshot: 'overview',
        doc: 'first-steps',
      },
      {
        id: 'devices',
        title: 'Devices, and a page for each',
        summary:
          'Every device that used the filter, the one stopped most often first, with what can be found out about it.',
        details: [
          'Names from the router and from what devices announce on the network (mDNS).',
          'The maker from the hardware address, the kind of device (phone, TV, printer, smart home and more).',
          'Model and firmware, where a device announces them.',
          'Randomised ("private") hardware addresses are shown as such.',
          'A click opens the device page: requests per hour, names stopped and let through most often, which list stopped them, and the newest requests one by one.',
        ],
        screenshot: 'devices',
        doc: 'first-steps',
      },
      {
        id: 'map',
        title: 'World map',
        summary:
          'Where your network talks to, drawn the moment it happens, coloured by traffic and by how much was stopped.',
        details: [
          'Countries ranked by traffic over the last 24 hours.',
          'The country data (IP to Country Lite by DB-IP) is on the device.',
          'The country shown is where the answering server is registered. Large networks answer from a data centre near you.',
        ],
        caveat:
          'The map covers IPv4 only and counts one event per A lookup. It shows fewer requests than the overview and is not a record of every connection.',
        screenshot: 'map',
        doc: 'first-steps',
      },
      {
        id: 'kids',
        title: 'Children and schedules',
        summary: 'Internet on or off per device, by hand or by time of day, with extra time at the press of a button.',
        details: [
          'Always on, by schedule, or off.',
          'A schedule per device: days of the week and a time window.',
          'Extra time: +30 minutes or +1 hour, and "End extra time".',
          'A rule follows the device by its hardware address when its IP address changes.',
        ],
        caveat: "It works by refusing the device's DNS lookups. A device with its own DNS setting gets around it.",
        doc: 'children-and-schedules',
      },
      {
        id: 'dns',
        title: 'Privacy and encrypted DNS',
        summary: 'Choose who the filter asks and how, and how long anything is kept.',
        details: [
          'Six resolvers with DNS over HTTPS: Quad9, Quad9 unfiltered, DNS4EU Protective, DNS4EU, Mullvad, Cloudflare.',
          'A new resolver is tested before it is used.',
          'DNSSEC to reject forged answers.',
          'Keep the request log for 24 hours, 7, 30 or 90 days.',
          'Hide which device asked, or delete everything collected.',
        ],
        screenshot: 'settings',
        doc: 'privacy-and-dns',
      },
      {
        id: 'notify',
        title: 'Messages to your phone',
        summary: 'Through ntfy or a webhook, when something happens that you should know.',
        details: [
          'A new device uses the filter.',
          'A dangerous host was stopped, at most once an hour per device and host.',
          'The filter does not answer, and again when it is back.',
          'A test message to check it arrives.',
        ],
        caveat: 'Messages leave your home through the service you choose, including device names and host names.',
        doc: 'notifications',
      },
      {
        id: 'backup',
        title: 'Back up and install',
        summary:
          'Keep a copy of the original system, move NetSluice to the internal storage, and put the copy back if you change your mind.',
        details: [
          'A complete, checked copy of the internal storage, written to the card and ready to download.',
          'Installation to the internal storage, which reads about five times faster than the card.',
          'Putting the backup back checks it first, and reads everything back afterwards.',
          'The vendor bootloader is never written. Its area is compared before and after.',
        ],
        caveat: 'Installing erases the original system. Make the backup first.',
        doc: 'backup-and-install',
      },
      {
        id: 'updates',
        title: 'Updates with a way back',
        summary:
          'NetSluice updates itself from its GitHub releases, by hand or once a day. If the new version does not start, the old one is put back.',
        details: [
          'Looks for a new version about once a day. Looking installs nothing.',
          'Install with one click, or automatically (off by default).',
          'Downloads only from GitHub. The VERSION file must match the release tag.',
          'Only the interface and the service are replaced. The filter keeps answering throughout.',
          'Updates of the Debian system underneath, with optional nightly security updates.',
        ],
        caveat: 'Releases are not signed. There are checksums, no signatures.',
        doc: 'updates',
      },
      {
        id: 'https',
        title: 'HTTPS in your own network',
        summary: 'If you switch it on, the device signs its own certificate and offers the root certificate to import.',
        details: [
          'A certificate for whatever name or address you open the device under.',
          'Root certificate to download, with its SHA-256 fingerprint to compare.',
          'Plain HTTP keeps working, so nobody is locked out.',
        ],
        doc: 'https',
      },
      {
        id: 'leds',
        title: 'LEDs and button',
        summary: 'The device shows what it does, without opening a page.',
        details: [
          'Green blinks while the device runs.',
          'Red flashes for every stopped request, if you want.',
          'LEDs on, off, or off at night.',
          'The button pauses the filter for ten minutes. A second press switches it back on.',
          'During the first start, the LEDs show the setup: green blinking, green steady when ready, red steady when a step failed.',
        ],
        doc: 'first-steps',
      },
      {
        id: 'appearance',
        title: 'Three designs, dark and light',
        summary: 'Sluice, Glass and Graphite, each in dark and light.',
        details: [
          'Sluice: deep water, green tiles. Glass: frosted panes over soft colour. Graphite: calm and flat, the overview becomes a stage with your devices.',
          'Size, accent colour, animations on or off.',
          'Kept per browser.',
        ],
        doc: 'first-steps',
      },
      {
        id: 'export',
        title: 'Export and import',
        summary: 'Take your setup to a file and back.',
        details: [
          "Filter lists, resolver, privacy settings, children's rules, LEDs and messages.",
          'Not the password, not the log.',
          'Importing adds what is missing and keeps lists you added since.',
        ],
        doc: 'privacy-and-dns',
      },
      {
        id: 'languages',
        title: 'English and German',
        summary: 'The interface speaks both, and switches with one click.',
        details: ['A language switch in the top bar.', "Follows the browser's language until you choose."],
      },
    ],
    limits: {
      title: 'What it does not do yet',
      intro: 'Written down so nobody has to find out the hard way.',
      rows: [
        {
          item: 'Inline ("sluice") mode',
          status: 'notImplemented',
          note: 'NetSluice filters as the DNS server of the network.',
        },
        { item: 'Listening mode', status: 'notImplemented', note: 'Not built yet.' },
        {
          item: 'Changing the fixed address from the interface',
          status: 'notImplemented',
          note: 'The interface shows the address. A change that goes wrong takes the house offline, so this needs a safe way back first.',
        },
        {
          item: 'WireGuard tunnel for use away from home',
          status: 'notImplemented',
          note: 'An idea for later. Not planned.',
        },
        { item: 'Signed releases', status: 'notImplemented', note: 'There are SHA-256 checksums, no signatures.' },
        { item: 'Tests for the interface', status: 'notImplemented', note: 'Smoke tests exist for the service only.' },
      ],
    },
    demo: { label: 'See it in the live demo', to: { route: 'demo' } },
  },

  howItWorks: {
    title: 'How it works',
    intro:
      'A DNS filter answers the question every device asks before it connects anywhere: which address belongs to this name? NetSluice answers it, or holds it back.',
    lookup: {
      title: 'The way of one lookup',
      steps: [
        {
          title: 'A device asks',
          text: 'Your router hands out NetSluice as DNS server, so every device asks it for the address of a name.',
        },
        {
          title: 'The sluice checks',
          text: 'AdGuard Home compares the name with your switched-on lists and with the rules for this device.',
        },
        {
          title: 'Let through',
          text: 'If nothing speaks against it, the question goes on to the resolver set under Secure DNS, and the answer comes back. All six resolvers offered there use DNS over HTTPS.',
        },
        {
          title: 'Or stopped',
          text: 'If the name is on a list, or the device is switched off by a schedule, the device does not get the address. Nothing is loaded from there.',
        },
        {
          title: 'You see it',
          text: "The NetSluice service reads the filter's log and turns it into the live view, the counters, the device pages and the world map.",
        },
      ],
    },
    boot: {
      title: 'How it gets onto the device',
      text: 'The Mini is a close relative of the FriendlyELEC NanoPi R2S (Rockchip RK3328), and its original system is built on Armbian. The vendor bootloader looks for a boot script on the microSD card before it starts the internal system. So a suitable card is all it takes.',
      points: [
        'No soldering, no opening the case.',
        'Nothing on the device is changed. Remove the card and the original system starts, wallet included.',
        'A stock NanoPi R2S image does not boot on the Mini. Three things differ on this board, and NetSluice corrects them in the device tree.',
        'Later, if you want, NetSluice moves to the internal storage. The vendor bootloader is never written.',
      ],
    },
    firstStart: {
      title: 'The first start',
      intro:
        'The ready-made image sets itself up without internet. A page on the device shows each step, and the LEDs show the state.',
      steps: [
        { title: 'Waiting for the system', text: 'Debian finishes its own first start. The green LED blinks.' },
        { title: 'Unpacking', text: 'The NetSluice files from the image are put in place.' },
        { title: 'Installing the web server', text: 'From the packages the image brings along.' },
        { title: 'Setting up the filter', text: 'AdGuard Home, the service, the helper and the data files.' },
        {
          title: 'Starting',
          text: 'When everything answers, the green LED is steady. A failed step lights the red LED and is tried again every minute.',
        },
      ],
    },
    parts: {
      title: 'What it is made of',
      intro: 'Five parts, each doing one job.',
      items: [
        {
          title: 'AdGuard Home',
          text: 'The filter engine. Answers DNS on port 53. Its own interface listens on localhost only, without an account of its own.',
        },
        {
          title: 'Caddy',
          text: 'The web server. Serves the interface and lets nothing through to the engine or the service without a valid session.',
        },
        {
          title: 'netsluiced',
          text: 'Everything the engine does not do: sign-in, world map, device recognition, schedules, LEDs and button, messages. One Python file, standard library only, no privileges.',
        },
        {
          title: 'netsluice-root',
          text: 'The only part with root rights. Accepts a short list of commands, validates every argument, and drops requests older than 20 seconds.',
        },
        {
          title: 'The interface',
          text: 'Plain HTML, CSS and JavaScript modules, in English and German. The live view and the map are drawn on canvases.',
        },
      ],
      diagramCaption: 'From docs/development.md in the repository',
      diagram,
    },
    dataFlows: {
      title: 'What leaves the device',
      intro:
        'The decisions are made on the device. These are the connections it makes to the outside, all of them from the code.',
      columns: { what: 'What', to: 'Where to', when: 'When' },
      rows: [
        {
          what: 'Lookups the filter lets through',
          to: 'The resolver you chose under Secure DNS',
          when: 'When a name is not in the cache',
        },
        {
          what: 'Stopped names, to place them on the world map',
          to: "Quad9's unfiltered resolver (9.9.9.10), plain DNS",
          when: 'At most once an hour per name',
        },
        {
          what: 'A question for your public address, to place your home on the map',
          to: "Google's name server, plain DNS",
          when: 'At the start, then about every six hours',
        },
        { what: 'Filter lists', to: 'The maintainers of the lists you switched on', when: 'When lists are refreshed' },
        {
          what: 'A look for a new version (your address and the installed version)',
          to: 'GitHub',
          when: 'About once a day',
        },
        { what: 'Updates of NetSluice', to: 'GitHub', when: 'When you install one, or daily if you switched that on' },
        {
          what: 'Updates of the system underneath',
          to: "The system's package sources (Debian, Armbian)",
          when: 'When you look for or install them, or nightly if you switched that on',
        },
        {
          what: 'Messages to your phone',
          to: 'The ntfy server or webhook you entered',
          when: 'Only if you switched them on',
        },
      ],
      note: 'The request log, the counters, the device list, the schedules and your settings stay on the device.',
    },
    updates: {
      title: 'How an update works',
      steps: [
        {
          title: 'Look',
          text: 'About once a day the device asks GitHub for the newest release, pre-releases included.',
        },
        {
          title: 'Download and check',
          text: 'Only from GitHub, over HTTPS, at most 30 MB. The VERSION file must match the release tag, and the code must compile.',
        },
        { title: 'Replace', text: 'Only the interface and the service. The filter engine keeps answering.' },
        {
          title: 'Verify or roll back',
          text: 'If the service does not answer within about 40 seconds, the previous version is put back.',
        },
      ],
    },
    homeOnly: {
      title: 'Made for your home network',
      text: "The interface at http://netsluice.local/ is for your home network only. Never forward it, or the device's DNS port, to the internet.",
    },
  },

  hardware: {
    title: 'Hardware',
    intro:
      'NetSluice runs on the Deeper Connect Mini. Everything here was read from one device with the board marking mini_v21_20210521. Treat it as a description of that revision.',
    specs: {
      title: 'Deeper Connect Mini (mini_v21)',
      columns: { part: 'Part', value: 'Finding' },
      rows: [
        { label: 'SoC', value: 'Rockchip RK3328, 4 × Cortex-A53, up to 1.3 GHz, AES/SHA extensions' },
        { label: 'RAM', value: '2 GB' },
        { label: 'Storage', value: '8 GB eMMC (Samsung), microSD slot' },
        { label: 'Ethernet 1', value: 'RK3328 GMAC with a Motorcomm YT8521 PHY at MDIO address 3' },
        { label: 'Ethernet 2', value: 'Realtek RTL8153 on USB 3.0' },
        { label: 'USB', value: 'one USB-A host port (USB 2.0), USB-C for power' },
        { label: 'Serial console', value: '3 pads marked G TX RX next to the microSD slot, 3.3 V, 1,500,000 baud' },
        { label: 'LEDs', value: 'green on gpio0 pin 2, red on gpio2 pin 18' },
        { label: 'Button', value: 'reset key on gpio0 pin 0, shows up as a gpio-keys input' },
        { label: 'PMIC', value: 'RK805' },
      ],
    },
    measured: {
      title: 'Measured',
      note: 'On Armbian with kernel 6.18.',
      rows: [
        { label: 'AES-256-GCM', value: 'about 520 MB/s on one core' },
        { label: 'ChaCha20-Poly1305', value: 'about 215 MB/s on one core' },
        { label: 'eMMC sequential read', value: 'about 133 MB/s' },
        { label: 'microSD sequential read', value: 'about 24 MB/s' },
        { label: 'Idle temperature', value: '53 to 56 °C' },
      ],
    },
    compatibility: {
      title: 'Which devices',
      intro: 'NetSluice was developed and tested on exactly one board.',
      columns: { item: 'Device', status: 'Status', note: 'Note' },
      rows: [
        {
          item: 'Deeper Connect Mini, board mini_v21_20210521',
          status: 'tested',
          note: "Developed and tested on this board. It runs its owner's home network.",
        },
        {
          item: 'Deeper Connect Mini, other board revisions',
          status: 'untested',
          note: 'Probe the board first. Please report what you find, including failures.',
        },
        { item: 'Deeper Connect Pico', status: 'notSupported', note: 'Different hardware.' },
        { item: 'Deeper Connect Nano', status: 'notSupported', note: 'Different hardware.' },
        { item: 'Deeper Connect Air', status: 'notSupported', note: 'Different hardware.' },
      ],
    },
    functions: {
      title: 'On the tested board',
      rows: [
        {
          item: 'Boot from the microSD card',
          status: 'tested',
          note: 'The card is tried before the internal storage.',
        },
        {
          item: 'Both Ethernet ports at 1 Gbit/s',
          status: 'tested',
          note: 'Loopback test between both ports: 5000 pings of 1400 bytes, no loss.',
        },
        { item: 'LEDs and button', status: 'tested', note: 'Green and red LED, reset button.' },
        {
          item: 'Backup, installation to the eMMC, putting the backup back',
          status: 'tested',
          note: 'From the interface.',
        },
        { item: 'USB-C as a data port', status: 'notSupported', note: 'Does not work. USB-C still powers the device.' },
      ],
    },
    limitations: {
      title: 'Not built yet',
      intro: 'Known gaps, as the project itself lists them.',
      rows: [
        { item: 'Inline ("sluice") mode', status: 'notImplemented', note: 'Not built yet.' },
        { item: 'Listening mode', status: 'notImplemented', note: 'Not built yet.' },
        {
          item: 'Changing the fixed address from the interface',
          status: 'notImplemented',
          note: 'A change that goes wrong would take the house offline, so it needs a safe way back first.',
        },
        {
          item: 'WireGuard tunnel',
          status: 'notImplemented',
          note: 'An idea for later. Not planned. The device would need to be reachable from outside, which NetSluice cannot arrange by itself.',
        },
      ],
    },
    boot: {
      title: 'How the device boots',
      text: 'The bootloader on the eMMC is U-Boot 2020.07 from an Armbian build. mmc1 is the microSD card and mmc0 the eMMC, so the card is tried first. The vendor system on the eMMC is Armbian with kernel 5.9.11 and a LUKS-encrypted root file system. NetSluice does not touch or need it.',
      code: 'boot_targets=mmc1 mmc0 usb0 pxe dhcp',
    },
    differences: {
      title: 'Three differences from a NanoPi R2S',
      intro:
        'A stock NanoPi R2S image starts the kernel but never comes up. NetSluice changes the device tree in three places.',
      items: [
        {
          title: 'The microSD card disappears',
          text: 'The NanoPi tree switches the card to 1.8 V through a regulator that is wired differently here. The fix runs the card at 3.3 V, as the vendor tree does.',
        },
        {
          title: 'Wrong PHY address',
          text: "The Ethernet PHY sits at address 3, not 1. The fix also uses the vendor's reset timings.",
        },
        {
          title: 'The PHY clock is switched off',
          text: 'A current kernel turns off the 125 MHz clock the network controller needs. The link comes up, but not a single packet is sent. The fix keeps the clock on.',
        },
      ],
    },
    probe: {
      title: 'Probe your board first',
      text: 'A tiny boot script makes the bootloader write its settings to the card and then lets the normal boot continue. It writes to the card only and changes nothing on the device. Format a card with one FAT32 partition, mark it bootable, copy boot.scr to it, boot once, then read probe-env.txt.',
      command: 'python3 scripts/probe/mkscr.py scripts/probe/boot.cmd boot.scr',
      expectedIntro: 'On the tested board the interesting lines are:',
      expected:
        'board=evb_rk3328\nsoc=rk3328\nfdtfile=rockchip/rk3328-nanopi-r2-rev00.dtb\nboot_targets=mmc1 mmc0 usb0 pxe dhcp\nbaudrate=1500000',
      warning:
        "probe-env.txt contains your device's serial number and MAC addresses. Remove them before you post the file anywhere.",
    },
    serial: {
      title: 'Serial console',
      text: "Not needed for installation, useful for debugging. Use a 3.3 V USB-UART adapter that handles 1,500,000 baud. Connect G, TX and RX only, cross TX and RX, and never connect the adapter's VCC pin.",
    },
    report: {
      title: 'Tried another board?',
      text: 'Please report what you find, including failures. The board marking, probe-env.txt without serial number and MACs, and what worked help most.',
      cta: { label: 'How to report a board', to: { route: 'contributing' } },
    },
  },

  gettingStarted: {
    title: 'Getting started',
    intro:
      'The easy way: write the ready-made image to a card, insert it, and NetSluice sets itself up. Read the warnings first.',
    prerequisites: {
      title: 'What you need',
      items: [
        'A Deeper Connect Mini. Tested on the board mini_v21_20210521.',
        'A microSD card of 8 GB or more.',
        'A network cable to your router.',
        'Any computer with balenaEtcher or the Raspberry Pi Imager.',
        'A router whose DNS server you can set.',
      ],
    },
    steps: {
      title: 'Ten steps',
      items: [
        {
          title: 'Download the image',
          text: 'Get the newest netsluice-<version>-deeper-connect-mini.img.xz and the .sha256 file next to it.',
        },
        {
          title: 'Check the download',
          text: 'In the folder with both files. It must say OK.',
          code: 'sha256sum -c netsluice-*.img.xz.sha256',
        },
        {
          title: 'Write it to the card',
          text: 'With balenaEtcher or the Raspberry Pi Imager ("Use custom"). Both take the .xz file as it is.',
        },
        {
          title: 'Optional: SSH',
          text: 'To log in to the system underneath, put your public key on the card as /boot/netsluice-ssh.pub. The card is ext4, so this needs a Linux computer.',
        },
        { title: 'Insert the card', text: 'Unplug the Mini first, then insert the card.' },
        { title: 'Connect and power up', text: 'Connect one Ethernet port to your router and power the Mini up.' },
        {
          title: 'Wait for the green LED',
          text: 'It blinks while NetSluice sets itself up. This takes a few minutes and needs no internet. Steady green means ready.',
        },
        {
          title: 'Open the interface',
          text: 'At http://netsluice.local/, or at the address your router shows for the device "netsluice".',
        },
        {
          title: 'Choose the password right away',
          text: 'The first visitor chooses it. Use 8 characters or more. There is no reset by e-mail.',
        },
        {
          title: "Set your router's DNS",
          text: "Enter the device's address as the DNS server in your router. The filter lists are downloaded as soon as the device reaches the internet. Until then nothing is stopped.",
        },
      ],
    },
    leds: {
      title: 'What the LEDs say during the setup',
      columns: { led: 'LED', meaning: 'Meaning' },
      rows: [
        { label: 'Green blinking', value: 'NetSluice is setting itself up.' },
        { label: 'Green steady', value: 'Ready.' },
        {
          label: 'Red steady',
          value: 'A step failed. It is tried again every minute. The page on the device says what is wrong.',
        },
      ],
      normal:
        'In normal use the green LED blinks while the device runs, and the red LED flashes for every stopped request. Both can be changed in the settings.',
    },
    warnings: {
      title: 'Read this first',
      items: [
        {
          title: 'Make a backup before you install to the internal storage',
          text: 'Running from the card changes nothing. Before you move NetSluice to the internal storage, back the storage up from the interface and download the backup.',
        },
        {
          title: 'Installing to the internal storage erases the original system',
          text: 'Without a backup it cannot be brought back.',
        },
        {
          title: 'Your wallet',
          text: 'If your device holds a wallet, make sure you have its seed phrase or keystore before you install.',
        },
        {
          title: 'Putting a backup back needs a valid backup',
          text: 'It is checked before anything is written, and it only goes back to the storage it came from.',
        },
        {
          title: 'Your board may differ',
          text: 'Only mini_v21_20210521 was tested. Other revisions are untested. The Pico, Nano and Air are not supported.',
        },
        { title: 'Keep the interface at home', text: 'Never forward it, or the DNS port, to the internet.' },
        {
          title: 'At your own risk',
          text: "There is no warranty. A filter that fails takes the name lookups of your network with it. Removing the card, or setting the router's DNS back, is the way out.",
        },
      ],
    },
    after: {
      title: 'Then',
      items: [
        'Choose your filter lists under Filters.',
        'Look at the overview, the devices and the world map.',
        'Under Settings, Updates, decide whether new versions install themselves.',
        'When you are sure, move NetSluice to the internal storage, with a backup first.',
      ],
    },
    buildYourself: {
      title: 'Rather build it yourself?',
      text: 'Adapt a stock Armbian image for the NanoPi R2S and install NetSluice on it over SSH. You need a Linux computer and a card of 16 GB or more.',
      cta: { label: 'Build from source', to: { doc: 'build-from-source' } },
    },
    help: {
      title: 'If something does not work',
      text: 'Remove the card and the original system starts again. The troubleshooting guide covers the setup, the interface, the filter and recovery.',
      cta: { label: 'Troubleshooting and recovery', to: { doc: 'troubleshooting' } },
    },
  },

  downloads: {
    title: 'Downloads',
    intro: 'The ready-made image for the microSD card. Write it, check it, and update from the interface afterwards.',
    latestVersion: {
      title: 'Newest version',
      text: 'The newest release. A running device updates itself to this one, under Settings, Updates.',
    },
    latestImage: {
      title: 'Newest image',
      text: 'The newest release that brings a card image. Not every release does: small releases only carry the update archive and reach a running device as an update.',
    },
    sameRelease: (version) => `Right now the newest version, ${version}, also brings the newest image.`,
    differentRelease: (imageVersion, latestVersion) =>
      `The newest image is ${imageVersion}. Write it to the card, then update to ${latestVersion} in the interface.`,
    noImage: 'No image could be found in the release data. The releases on GitHub list every file.',
    updateOnly:
      'Releases without an image carry netsluice-<version>.tar.gz, the update archive a device downloads by itself. You do not need to download it.',
    labels: {
      image: 'Card image',
      checksumFile: 'SHA-256 checksum file',
      updateArchive: 'Update archive',
      sha256: 'SHA-256',
      size: 'Size',
      published: 'Published',
      prerelease: 'Pre-release',
      releaseNotes: 'Release notes',
      allReleases: 'All releases on GitHub',
      olderImages: 'Older images',
      download: 'Download',
    },
    verify: {
      title: 'Check your download',
      intro: 'Put the image and its .sha256 file in the same folder, then:',
      platforms: [
        { os: 'Linux', command: 'sha256sum -c netsluice-*.img.xz.sha256', note: 'It must say OK.' },
        { os: 'macOS', command: 'shasum -a 256 -c netsluice-*.img.xz.sha256', note: 'It must say OK.' },
        {
          os: 'Windows (PowerShell)',
          command: 'Get-FileHash -Algorithm SHA256 .\\netsluice-<version>-deeper-connect-mini.img.xz',
          note: 'Compare the printed hash with the one in the .sha256 file. Upper and lower case do not matter.',
        },
      ],
      noSignature:
        'A checksum shows that the file arrived complete and unchanged. Releases are not signed: there are checksums, no signatures.',
    },
    source: {
      live: (date) => `Release data from GitHub, fetched ${date} when this page was built.`,
      cache: (date) =>
        `GitHub could not be reached when this page was built. Showing the last known data, from ${date}.`,
      none: 'Release data is not available right now. All releases are on GitHub.',
    },
  },

  changelog: {
    title: 'Changelog',
    intro: 'Every release, newest first, as published on GitHub.',
    notesLanguage: 'Release notes are written in English.',
    imageBadge: 'With image',
    prereleaseBadge: 'Pre-release',
    noFiles: 'No files attached.',
    empty: 'No release data available right now. All releases are on GitHub.',
  },

  demo: {
    title: 'Live demo',
    intro:
      'This is the interface of NetSluice itself, running in your browser with invented data. Click around: nothing you do here reaches any device.',
    points: [
      'The same interface code a device serves.',
      'A made-up household with invented devices and destinations.',
      'Switches answer but change nothing.',
      'It contacts no device and no outside service.',
    ],
    open: 'Open the demo full screen',
    local: {
      title: 'Run it on your own computer',
      text: 'With python3 and a copy of the repository. Then open http://127.0.0.1:8099/ (add ?lang=de for German).',
      command: 'python3 scripts/demo.py',
    },
  },

  donate: {
    title: 'Support NetSluice',
    text: 'NetSluice is free and open source under the MIT licence. There are no paid features. If it is useful to you, a donation via PayPal helps keep it going.',
    button: 'Donate via PayPal',
    points: ['No accounts, no paid features.', 'Reports and pull requests help just as much.'],
    note: 'Opens PayPal. No payment happens on this site.',
  },

  faq: {
    title: 'Questions and answers',
    intro: 'Short answers. The documentation has the details.',
  },

  docs: {
    title: 'Documentation',
    intro:
      'Installing, using, updating and building NetSluice. Written from the repository, which is right if the two ever disagree.',
  },
};
