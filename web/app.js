// NetSluice web interface, development preview.
// Talks to the filter (AdGuard Home) through the /control/ proxy on the device.

import { createSluice } from './sluice.js';
import { createWorldMap } from './worldmap.js';

const T = {
  en: {
    'nav.overview': 'Overview', 'nav.devices': 'Devices', 'nav.filters': 'Filters', 'nav.map': 'World map', 'nav.tunnel': 'Tunnel', 'nav.settings': 'Settings',
    'status.on': 'Filter running', 'status.off': 'Filter paused', 'status.err': 'Filter not reachable',
    'ov.passed': 'requests passed', 'ov.blocked': 'stopped', 'ov.sub': 'In the last 24 hours, counted live. A dot is one request that just went through this device.',
    'ov.home': 'Home network', 'ov.internet': 'Internet', 'ov.flowAria': 'Live view: requests arrive blue, are checked inside the sluice, leave green or burst in red',
    'lg.incoming': 'on the way to the sluice', 'lg.passed': 'passed', 'lg.blocked': 'caught in the sluice',
    'ov.last24': 'The last 24 hours', 'ov.barsAria': 'Requests per hour',
    'ov.share': (p) => `${p} % of all requests were stopped.`, 'ov.shareNone': 'No requests yet. Point a device at this filter to see it work.',
    'ov.topDevices': 'Most active devices', 'ov.allDevices': 'All devices', 'ov.recent': 'Stopped most recently', 'ov.topBlocked': 'Stopped most often',
    'empty.devices': 'No device has asked yet.', 'empty.recent': 'Nothing has been stopped yet.', 'empty.blocked': 'Nothing has been stopped yet.',
    'requests': 'requests', 'times': 'times',
    'dv.title': (n) => n === 1 ? 'One device uses the filter' : `${n} devices use the filter`, 'dv.sub': 'Every device that asked this filter for an address in the last 24 hours, the busiest first.',
    'dv.place': (n) => `No. ${n}`, 'dv.requests': 'Requests', 'dv.share': 'Share of all traffic', 'dv.address': 'Address', 'dv.mac': 'MAC', 'dv.firmware': 'Firmware',
    'dv.private': 'private (randomised) MAC', 'dv.nothing': 'This device tells nothing about itself.',
    'kind.phone': 'Phone', 'kind.tablet': 'Tablet', 'kind.computer': 'Computer', 'kind.tv': 'TV', 'kind.speaker': 'Speaker', 'kind.iot': 'Smart home', 'kind.network': 'Network gear',
    'kind.printer': 'Printer', 'kind.vm': 'Virtual machine', 'kind.server': 'Server', 'kind.console': 'Console', 'kind.private': 'Phone or laptop', 'kind.self': 'This device', 'kind.unknown': 'Unknown',
    'fl.title': 'Filter lists', 'fl.sub': 'A list names hosts that should not be reachable. NetSluice reads the same list formats as AdGuard Home and Pi-hole.',
    'fl.refresh': 'Update all now',
    'fl.custom': 'Add another list', 'fl.customSub': 'Paste the address of any hosts file or adblock-style list. It appears as a tile above.', 'fl.name': 'Name', 'fl.url': 'Address of the list', 'fl.add': 'Add list',
    'fl.rules': 'rules', 'fl.about': 'about', 'fl.total': (lists, n) => `${lists} lists are on, ${n} rules in total.`, 'fl.lists': 'Lists', 'fl.okOn': 'List is on.', 'fl.okOff': 'List is off.', 'fl.on': 'on', 'fl.off': 'off', 'fl.remove': 'Remove',
    'fl.okAdd': 'List added and loaded.', 'fl.working': 'Working', 'fl.wait': 'One moment, a large list can take half a minute.', 'fl.have': 'That list is already in your lists.', 'fl.okRemove': 'List removed.', 'fl.okRefresh': 'Lists are being updated.', 'fl.fail': (m) => `That did not work: ${m}`,
    'mp.title': (n) => n === 0 ? 'Where your network talks to' : n === 1 ? 'Your network talked to one country today' : `Your network talked to ${n} countries today`,
    'mp.sub': 'Every dot is a real lookup from your home network, drawn the moment it happens. Red ones were stopped by the filter before they left.',
    'mp.aria': 'World map: lines run from your location to the countries your network contacted; stopped requests burst in red',
    'mp.home': 'your location', 'mp.leaving': 'leaving home', 'mp.arrived': 'reached its country', 'mp.stopped': 'stopped by the filter',
    'mp.rank': 'Countries by traffic, last 24 hours', 'mp.tip': (name, ok, no) => `${name}: ${ok} passed, ${no} stopped`, 'mp.row': (ok, no) => `${ok} passed, ${no} stopped`,
    'mp.empty': 'No destinations yet. They appear as soon as a device looks something up.',
    'mp.howTitle': 'How to read this', 'mp.how': 'The country is where the answering server is registered. Large networks such as Cloudflare, Google or Amazon answer from the nearest data centre, so much of the traffic shown for the USA never leaves Europe.',
    'mp.credit': 'IP geolocation by',
    'soon.tunnel': 'The tunnel is not built yet', 'soon.tunnelSub': 'WireGuard will let phones and laptops use this filter while away from home.',
    'kd.title': 'Children and schedules', 'kd.sub': 'Internet on or off for chosen devices', 'kd.text': 'A device that is switched off gets no answers from the filter, so nothing new loads. A page or video that is already open can keep running for a moment. A child who enters a different DNS server on the device gets around this.',
    'kd.add': 'Add a device', 'kd.addSub': 'Only devices that have used the filter appear here.', 'kd.addBtn': 'Add', 'kd.none': 'No devices yet. Add one below.', 'kd.badge': (n, off) => n ? `${n} devices, ${off} off` : 'none',
    'kd.on': 'Always on', 'kd.plan': 'By schedule', 'kd.off': 'Off', 'kd.isOn': 'Internet on', 'kd.isOff': 'Internet off', 'kd.from': 'allowed from', 'kd.to': 'to', 'kd.remove': 'Remove from list',
    'kd.plus30': '+30 minutes', 'kd.plus60': '+1 hour', 'kd.endExtra': 'End extra time', 'kd.extra': (t) => `extra time until ${t}`, 'kd.days': ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], 'kd.noMac': 'no MAC known, bound to the address',
    'ld.title': 'Button and LEDs', 'ld.sub': 'What the device itself shows and does', 'ld.mode': 'LEDs', 'ld.modeSub': 'Green blinks while the device runs.', 'ld.on': 'On', 'ld.nightMode': 'Off at night', 'ld.off': 'Off',
    'ld.night': 'Dark between', 'ld.nightSub': 'Both LEDs stay off during this time.', 'ld.flash': 'Red flash for every stopped request', 'ld.flashSub': 'You see the filter working without opening this page.',
    'ld.button': 'Button pauses the filter', 'ld.buttonSub': 'One press on the button of the device: filter off for ten minutes. A second press switches it back on. The red LED blinks three times as a receipt.',
    'ld.hwOk': 'This board has both LEDs and the button.', 'ld.hwNo': 'This board does not offer LEDs or a button to the service, the settings have no effect here.', 'ld.badge': { on: 'on', night: 'off at night', off: 'off' },
    'nt.title': 'Messages to your phone', 'nt.sub': 'When something happens that you should know', 'nt.text': 'Messages leave your home through the service you choose, including device names and host names. With ntfy, anyone who knows the name of your topic can read along, so pick one that cannot be guessed.',
    'nt.way': 'Send through', 'nt.off': 'Off', 'nt.ntfy': 'ntfy', 'nt.webhook': 'Webhook', 'nt.url': 'Address', 'nt.save': 'Save address', 'nt.test': 'Send a test message',
    'nt.hint': { off: 'No messages are sent.', ntfy: 'Install the ntfy app, subscribe to a topic and enter its address here, for example https://ntfy.sh/your-topic.', webhook: 'Each message is sent as JSON (event, title, text) to this address, for Home Assistant, Telegram bridges or your own scripts.' },
    'nt.newdev': 'A new device uses the filter', 'nt.newdevSub': 'A hardware address that was never seen before.', 'nt.malware': 'A dangerous host was stopped', 'nt.malwareSub': 'Hits on malware and phishing lists, at most once an hour per device and host.', 'nt.down': 'The filter does not answer', 'nt.downSub': 'After a minute without an answer, and again when it is back.',
    'nt.sent': 'Test message sent. Check your phone.', 'nt.notSent': (m) => m === 'off' ? 'Choose a way and save an address first.' : `The message did not go out: ${m}`, 'nt.badUrl': 'That is not a usable address. It must start with https:// or http://.',
    'lk.title': 'Appearance', 'lk.sub': 'For this browser only', 'lk.accent': 'Accent colour', 'lk.accentSub': 'Used for buttons, the selected section and the sluice.', 'lk.motion': 'Animations', 'lk.motionSub': 'Off: no moving dots, no flying packets, no transitions. The page reloads once.',
    'ex.title': 'Export and import', 'ex.sub': 'Take your setup with you', 'ex.out': 'Save everything to a file', 'ex.outSub': 'Filter lists, resolver, privacy, children\'s rules, LEDs and messages. Not the password, not the log.', 'ex.outBtn': 'Export',
    'ex.in': 'Load a file', 'ex.inSub': 'Adds what is missing and overwrites the settings named in the file. Lists you added since are kept.', 'ex.done': (n) => `Imported: ${n} parts applied.`, 'ex.bad': 'This is not a NetSluice settings file.',
    'nw.title': 'Network', 'nw.sub': 'Name and addresses of this device', 'nw.name': 'Name on the network', 'nw.save': 'Change name', 'nw.fixed': 'Fixed address', 'nw.dhcp': 'Address from the router', 'nw.open': 'Reachable as',
    'nw.later': 'Changing the fixed address and switching to sluice or listening mode are not offered here yet. Your whole network asks this address, and a change that goes wrong takes the house offline.', 'nw.badName': 'Only letters, digits and hyphens, no hyphen at the start or end.',
    'up.title': 'Updates', 'up.sub': 'New versions of NetSluice and security fixes', 'up.now': 'Update now', 'up.check': 'Look for updates', 'up.run': 'Install', 'up.auto': 'Install security updates automatically', 'up.autoSub': 'Debian then installs security fixes by itself every night.',
    'up.none': 'The system is up to date.', 'up.some': (n) => n === 1 ? 'One update is waiting.' : `${n} updates are waiting.`, 'up.badge': (n) => n ? `${n} waiting` : 'up to date', 'up.checked': (d) => d ? `last looked ${d}` : 'never looked',
    'up.held': 'Held back on purpose: the system core. It only works on this board together with the adapted hardware description, so it is updated by hand.', 'up.running': 'Updates are being installed. This can take a few minutes; the filter keeps working.', 'up.started': 'Installation started.',
    'up.system': 'System underneath (Debian)',
    'ap.check': 'Look for a new version', 'ap.run': (v) => `Install ${v}`, 'ap.current': 'Up to date', 'ap.version': (v) => v ? `Installed: version ${v}` : 'Installed: a version from before updates existed',
    'ap.available': (v) => `Version ${v} is available on GitHub.`, 'ap.none': 'This is the newest version.', 'ap.never': 'Not looked yet.', 'ap.checked': (d) => `last looked ${d}`,
    'ap.running': 'Installing the new version. The filter keeps working; this page reloads by itself when it is done.', 'ap.started': 'Update started.', 'ap.done': (v) => `Updated to version ${v}. Reloading.`,
    'ap.failed': (m) => `The last update did not work: ${m}. The previous version is still running.`, 'ap.rolledBack': 'The last update was undone: the new version did not start, so the previous one was put back.',
    'ap.auto': 'Install new versions automatically', 'ap.autoSub': 'Looks on GitHub once a day, early in the morning. The filter keeps working during an update.',
    'ap.badge': (a) => a ? 'new version' : 'up to date', 'up.checking': 'Looking for updates, this takes up to a minute',
    'st.title': 'Settings', 'st.sub': 'Open a tile to change it. Changes apply at once.',
    'st.dns': 'Secure DNS', 'st.dnsSub': 'Who the filter itself asks, and how', 'st.dnsText': 'The filter forwards what it lets through to a resolver. With DNS over HTTPS (DoH) that question is encrypted, so neither your internet provider nor anyone on the line can read or alter it.',
    'st.dnssec': 'Verify answers (DNSSEC)', 'st.dnssecSub': 'Reject forged answers for domains that are signed.', 'st.dnsOk': 'Resolver changed and tested.', 'st.dnsFail': (m) => `This resolver did not answer, nothing was changed: ${m}`, 'st.dnsTesting': 'Testing the resolver', 'st.encrypted': 'encrypted', 'st.saved': 'Saved.',
    'dns.quad9': 'Blocks known malware. Non-profit, Switzerland.', 'dns.quad9u': 'No blocking of its own. Non-profit, Switzerland.', 'dns.cloudflare': 'Fast, worldwide. USA.', 'dns.dns4eu': 'Public European resolver, unfiltered.', 'dns.dns4eup': 'European resolver with protection against malware.', 'dns.mullvad': 'Run by a privacy-focused VPN provider. Sweden.',
    'st.privacy': 'Privacy', 'st.privacySub': 'What is remembered, and for how long', 'st.keep': 'Keep the request log for', 'st.keepSub': 'The log shows which device asked for which address. The world map and the lists on the overview are built from it.',
    'st.k1': '24 hours', 'st.k7': '7 days', 'st.k30': '30 days', 'st.k90': '90 days', 'st.days': (n) => n === 1 ? '24 hours' : `${n} days`,
    'st.anon': 'Hide which device asked', 'st.anonSub': 'Stores shortened addresses. Devices can then no longer be told apart in the interface.',
    'st.wipe': 'Delete everything collected', 'st.wipeSub': 'Empties the log and resets all counters. Lists and settings stay.', 'st.wipeBtn': 'Delete now', 'st.wipeAsk': 'Delete the complete log and all counters? This cannot be undone.', 'st.wiped': 'Log and counters are empty.',
    'st.access': 'Access', 'st.accessSub': 'Password and sign-out', 'st.protected': 'protected', 'st.pwOld': 'Current password', 'st.pwNew': 'New password, 8 characters or more', 'st.pwBtn': 'Change password', 'st.pwOk': 'Password changed. All other browsers were signed out.',
    'st.logout': 'Sign out of this browser', 'st.logoutSub': 'The session otherwise lasts 30 days.', 'st.logoutBtn': 'Sign out',
    'st.deviceSub': 'Filter engine and addresses', 'st.planned': 'Not built yet', 'st.plannedSub': 'Decided, but not working yet. Nothing here does anything so far.', 'st.soon': 'planned',
    'pl.kids': 'Children and schedules', 'pl.kidsText': 'Switch the internet on and off for chosen devices, by hand or by time of day. In filter mode this works through name lookups; a child who changes the DNS setting gets around it.',
    'pl.led': 'Button and LEDs', 'pl.ledText': 'The button on the device pauses the filter for ten minutes. The red LED flashes for every stopped request. Night mode turns the LEDs off.',
    'pl.notify': 'Messages to your phone', 'pl.notifyText': 'A new device joined, a device tried to reach a malware host, the filter stopped, an update is ready.',
    'pl.backup': 'Back up and install', 'pl.backupText': 'Back up the original system, download it, restore it, and install NetSluice permanently. It can only be built and tested on a device that still runs from the card; this one is already installed.',
    'pl.net': 'Network', 'pl.netText': 'Change address and name here, and choose between filter, sluice and listening mode. A wrong entry would cut the device off, so this needs a safe way back first.',
    'pl.look': 'Appearance', 'pl.lookText': 'Light or dark, accent colour, animations on or off.',
    'pl.export': 'Export and import', 'pl.exportText': 'Save all settings, lists and device names to a file and load them on another device.',
    'gate.setupTitle': 'Choose a password', 'gate.setupSub': 'This device filters your whole network. From now on only someone with this password can change it. There is no reset by e-mail, so keep it safe.',
    'gate.loginTitle': 'Sign in', 'gate.loginSub': 'Enter the password you chose for this NetSluice.',
    'gate.pw': 'Password', 'gate.pwNew': 'Password, 8 characters or more', 'gate.pw2': 'Repeat it', 'gate.setupBtn': 'Set password and start', 'gate.loginBtn': 'Sign in',
    'gate.mismatch': 'The two entries differ.', 'gate.short': 'Use 8 characters or more.', 'gate.wrong': 'That password is wrong.', 'gate.wait': 'Too many wrong tries. Wait five minutes.', 'gate.down': 'The NetSluice service does not answer. Try again in a moment.', 'gate.configured': 'A password already exists. Reload the page to sign in.',
    'st.device': 'This device', 'st.version': 'Filter engine', 'st.dnsPort': 'DNS port', 'st.addresses': 'Answers on', 'st.since': 'Running since',
  },
  de: {
    'nav.overview': 'Übersicht', 'nav.devices': 'Geräte', 'nav.filters': 'Filter', 'nav.map': 'Weltkarte', 'nav.tunnel': 'Tunnel', 'nav.settings': 'Einstellungen',
    'status.on': 'Filter läuft', 'status.off': 'Filter pausiert', 'status.err': 'Filter nicht erreichbar',
    'ov.passed': 'Anfragen durchgelassen', 'ov.blocked': 'aufgehalten', 'ov.sub': 'In den letzten 24 Stunden, live gezählt. Ein Punkt ist eine Anfrage, die gerade durch dieses Gerät ging.',
    'ov.home': 'Heimnetz', 'ov.internet': 'Internet', 'ov.flowAria': 'Live-Ansicht: Anfragen kommen blau an, werden in der Schleuse geprüft, verlassen sie grün oder zerplatzen rot',
    'lg.incoming': 'unterwegs zur Schleuse', 'lg.passed': 'durchgelassen', 'lg.blocked': 'in der Schleuse erwischt',
    'ov.last24': 'Die letzten 24 Stunden', 'ov.barsAria': 'Anfragen pro Stunde',
    'ov.share': (p) => `${p} % aller Anfragen wurden aufgehalten.`, 'ov.shareNone': 'Noch keine Anfragen. Stell bei einem Gerät diesen Filter ein, dann siehst du ihn arbeiten.',
    'ov.topDevices': 'Aktivste Geräte', 'ov.allDevices': 'Alle Geräte', 'ov.recent': 'Zuletzt aufgehalten', 'ov.topBlocked': 'Am häufigsten aufgehalten',
    'empty.devices': 'Noch hat kein Gerät gefragt.', 'empty.recent': 'Bisher wurde nichts aufgehalten.', 'empty.blocked': 'Bisher wurde nichts aufgehalten.',
    'requests': 'Anfragen', 'times': 'mal',
    'dv.title': (n) => n === 1 ? 'Ein Gerät nutzt den Filter' : `${n} Geräte nutzen den Filter`, 'dv.sub': 'Jedes Gerät, das diesen Filter in den letzten 24 Stunden nach einer Adresse gefragt hat, das aktivste zuerst.',
    'dv.place': (n) => `Platz ${n}`, 'dv.requests': 'Anfragen', 'dv.share': 'Anteil am Verkehr', 'dv.address': 'Adresse', 'dv.mac': 'MAC', 'dv.firmware': 'Firmware',
    'dv.private': 'private (zufällige) MAC', 'dv.nothing': 'Dieses Gerät verrät nichts über sich.',
    'kind.phone': 'Handy', 'kind.tablet': 'Tablet', 'kind.computer': 'Rechner', 'kind.tv': 'Fernseher', 'kind.speaker': 'Lautsprecher', 'kind.iot': 'Smart Home', 'kind.network': 'Netzwerkgerät',
    'kind.printer': 'Drucker', 'kind.vm': 'Virtuelle Maschine', 'kind.server': 'Server', 'kind.console': 'Spielkonsole', 'kind.private': 'Handy oder Laptop', 'kind.self': 'Dieses Gerät', 'kind.unknown': 'Unbekannt',
    'fl.title': 'Filterlisten', 'fl.sub': 'Eine Liste nennt Gegenstellen, die nicht erreichbar sein sollen. NetSluice liest dieselben Listenformate wie AdGuard Home und Pi-hole.',
    'fl.refresh': 'Alle jetzt aktualisieren',
    'fl.custom': 'Weitere Liste hinzufügen', 'fl.customSub': 'Füge die Adresse einer beliebigen Hosts-Datei oder Adblock-Liste ein. Sie erscheint oben als Kachel.', 'fl.name': 'Name', 'fl.url': 'Adresse der Liste', 'fl.add': 'Liste hinzufügen',
    'fl.rules': 'Regeln', 'fl.about': 'rund', 'fl.total': (lists, n) => `${lists} Listen sind an, zusammen ${n} Regeln.`, 'fl.lists': 'Listen', 'fl.okOn': 'Liste ist an.', 'fl.okOff': 'Liste ist aus.', 'fl.on': 'an', 'fl.off': 'aus', 'fl.remove': 'Entfernen',
    'fl.okAdd': 'Liste hinzugefügt und geladen.', 'fl.working': 'Läuft', 'fl.wait': 'Einen Moment, eine große Liste kann eine halbe Minute brauchen.', 'fl.have': 'Diese Liste ist schon bei deinen Listen.', 'fl.okRemove': 'Liste entfernt.', 'fl.okRefresh': 'Die Listen werden aktualisiert.', 'fl.fail': (m) => `Das hat nicht geklappt: ${m}`,
    'mp.title': (n) => n === 0 ? 'Wohin dein Netz spricht' : n === 1 ? 'Dein Netz sprach heute mit einem Land' : `Dein Netz sprach heute mit ${n} Ländern`,
    'mp.sub': 'Jeder Punkt ist eine echte Anfrage aus deinem Heimnetz, gezeichnet in dem Moment, in dem sie passiert. Rote hat der Filter aufgehalten, bevor sie das Haus verließen.',
    'mp.aria': 'Weltkarte: Linien führen von deinem Standort zu den Ländern, mit denen dein Netz gesprochen hat; aufgehaltene Anfragen zerplatzen rot',
    'mp.home': 'dein Standort', 'mp.leaving': 'verlässt das Haus', 'mp.arrived': 'im Zielland angekommen', 'mp.stopped': 'vom Filter aufgehalten',
    'mp.rank': 'Länder nach Verkehr, letzte 24 Stunden', 'mp.tip': (name, ok, no) => `${name}: ${ok} durchgelassen, ${no} aufgehalten`, 'mp.row': (ok, no) => `${ok} durch, ${no} aufgehalten`,
    'mp.empty': 'Noch keine Ziele. Sie erscheinen, sobald ein Gerät etwas nachschlägt.',
    'mp.howTitle': 'So liest du die Karte', 'mp.how': 'Das Land ist der Ort, an dem der antwortende Server registriert ist. Große Netze wie Cloudflare, Google oder Amazon antworten vom nächstgelegenen Rechenzentrum; vieles, was hier bei den USA steht, verlässt Europa also gar nicht.',
    'mp.credit': 'Länderzuordnung der Adressen von',
    'soon.tunnel': 'Der Tunnel ist noch nicht gebaut', 'soon.tunnelSub': 'Mit WireGuard nutzen Handy und Laptop diesen Filter später auch unterwegs.',
    'kd.title': 'Kinder und Zeitpläne', 'kd.sub': 'Internet an oder aus für ausgewählte Geräte', 'kd.text': 'Ein ausgeschaltetes Gerät bekommt vom Filter keine Antworten mehr, es lädt also nichts Neues. Eine schon geöffnete Seite oder ein laufendes Video kann noch einen Moment weiterlaufen. Ein Kind, das am Gerät einen anderen DNS-Server einträgt, kommt daran vorbei.',
    'kd.add': 'Gerät hinzufügen', 'kd.addSub': 'Hier erscheinen nur Geräte, die den Filter schon benutzt haben.', 'kd.addBtn': 'Hinzufügen', 'kd.none': 'Noch keine Geräte. Füge unten eines hinzu.', 'kd.badge': (n, off) => n ? `${n} Geräte, ${off} aus` : 'keine',
    'kd.on': 'Immer an', 'kd.plan': 'Nach Zeitplan', 'kd.off': 'Aus', 'kd.isOn': 'Internet an', 'kd.isOff': 'Internet aus', 'kd.from': 'erlaubt von', 'kd.to': 'bis', 'kd.remove': 'Aus der Liste nehmen',
    'kd.plus30': '+30 Minuten', 'kd.plus60': '+1 Stunde', 'kd.endExtra': 'Zusatzzeit beenden', 'kd.extra': (t) => `Zusatzzeit bis ${t}`, 'kd.days': ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'], 'kd.noMac': 'keine MAC bekannt, an die Adresse gebunden',
    'ld.title': 'Taster und LEDs', 'ld.sub': 'Was das Gerät selbst zeigt und tut', 'ld.mode': 'LEDs', 'ld.modeSub': 'Grün blinkt, solange das Gerät läuft.', 'ld.on': 'An', 'ld.nightMode': 'Nachts aus', 'ld.off': 'Aus',
    'ld.night': 'Dunkel zwischen', 'ld.nightSub': 'In dieser Zeit bleiben beide LEDs aus.', 'ld.flash': 'Rotes Aufblitzen bei jeder aufgehaltenen Anfrage', 'ld.flashSub': 'Du siehst den Filter arbeiten, ohne diese Seite zu öffnen.',
    'ld.button': 'Taster pausiert den Filter', 'ld.buttonSub': 'Ein Druck auf den Knopf am Gerät: Filter zehn Minuten aus. Ein zweiter Druck schaltet ihn wieder ein. Die rote LED blinkt zur Bestätigung dreimal.',
    'ld.hwOk': 'Diese Platine hat beide LEDs und den Taster.', 'ld.hwNo': 'Diese Platine stellt dem Dienst weder LEDs noch Taster bereit, die Einstellungen wirken hier nicht.', 'ld.badge': { on: 'an', night: 'nachts aus', off: 'aus' },
    'nt.title': 'Meldungen aufs Handy', 'nt.sub': 'Wenn etwas passiert, das du wissen solltest', 'nt.text': 'Meldungen verlassen dein Haus über den Dienst, den du wählst, mit Gerätenamen und Adressen. Bei ntfy kann jeder mitlesen, der den Namen deines Themas kennt; wähle also einen, der sich nicht erraten lässt.',
    'nt.way': 'Senden über', 'nt.off': 'Aus', 'nt.ntfy': 'ntfy', 'nt.webhook': 'Webhook', 'nt.url': 'Adresse', 'nt.save': 'Adresse speichern', 'nt.test': 'Testmeldung senden',
    'nt.hint': { off: 'Es werden keine Meldungen gesendet.', ntfy: 'Installiere die ntfy-App, abonniere ein Thema und trag seine Adresse hier ein, zum Beispiel https://ntfy.sh/dein-thema.', webhook: 'Jede Meldung geht als JSON (event, title, text) an diese Adresse, für Home Assistant, Telegram-Brücken oder eigene Skripte.' },
    'nt.newdev': 'Ein neues Gerät nutzt den Filter', 'nt.newdevSub': 'Eine MAC, die noch nie gesehen wurde.', 'nt.malware': 'Eine gefährliche Adresse wurde aufgehalten', 'nt.malwareSub': 'Treffer auf Listen für Schadsoftware und Phishing, höchstens einmal pro Stunde je Gerät und Adresse.', 'nt.down': 'Der Filter antwortet nicht', 'nt.downSub': 'Nach einer Minute ohne Antwort, und noch einmal, wenn er wieder da ist.',
    'nt.sent': 'Testmeldung gesendet. Sieh auf dein Handy.', 'nt.notSent': (m) => m === 'off' ? 'Wähle erst einen Weg und speichere eine Adresse.' : `Die Meldung ging nicht raus: ${m}`, 'nt.badUrl': 'Das ist keine brauchbare Adresse. Sie muss mit https:// oder http:// beginnen.',
    'lk.title': 'Aussehen', 'lk.sub': 'Gilt nur für diesen Browser', 'lk.accent': 'Akzentfarbe', 'lk.accentSub': 'Für Knöpfe, den gewählten Bereich und die Schleuse.', 'lk.motion': 'Animationen', 'lk.motionSub': 'Aus: keine wandernden Punkte, keine fliegenden Pakete, keine Übergänge. Die Seite lädt einmal neu.',
    'ex.title': 'Export und Import', 'ex.sub': 'Nimm deine Einrichtung mit', 'ex.out': 'Alles in eine Datei speichern', 'ex.outSub': 'Filterlisten, Auflöser, Datenschutz, Kinderregeln, LEDs und Meldungen. Nicht das Passwort, nicht das Protokoll.', 'ex.outBtn': 'Exportieren',
    'ex.in': 'Datei einlesen', 'ex.inSub': 'Ergänzt, was fehlt, und überschreibt die Einstellungen, die in der Datei stehen. Seitdem hinzugefügte Listen bleiben.', 'ex.done': (n) => `Eingelesen: ${n} Teile übernommen.`, 'ex.bad': 'Das ist keine NetSluice-Einstellungsdatei.',
    'nw.title': 'Netzwerk', 'nw.sub': 'Name und Adressen dieses Geräts', 'nw.name': 'Name im Netz', 'nw.save': 'Namen ändern', 'nw.fixed': 'Feste Adresse', 'nw.dhcp': 'Adresse vom Router', 'nw.open': 'Erreichbar unter',
    'nw.later': 'Die feste Adresse ändern und auf Schleuse oder Mithören umstellen lässt sich hier noch nicht. Dein ganzes Netz fragt diese Adresse, und eine Änderung, die schiefgeht, legt das Haus lahm.', 'nw.badName': 'Nur Buchstaben, Ziffern und Bindestriche, kein Bindestrich am Anfang oder Ende.',
    'up.title': 'Updates', 'up.sub': 'Neue NetSluice-Versionen und Sicherheitskorrekturen', 'up.now': 'Jetzt aktualisieren', 'up.check': 'Nach Updates suchen', 'up.run': 'Installieren', 'up.auto': 'Sicherheitsupdates automatisch einspielen', 'up.autoSub': 'Debian installiert Sicherheitskorrekturen dann jede Nacht selbst.',
    'up.none': 'Das System ist aktuell.', 'up.some': (n) => n === 1 ? 'Ein Update wartet.' : `${n} Updates warten.`, 'up.badge': (n) => n ? `${n} warten` : 'aktuell', 'up.checked': (d) => d ? `zuletzt gesucht ${d}` : 'noch nie gesucht',
    'up.held': 'Absichtlich zurückgehalten: der Systemkern. Er läuft auf dieser Platine nur zusammen mit der angepassten Hardware-Beschreibung und wird deshalb von Hand aktualisiert.', 'up.running': 'Updates werden installiert. Das kann einige Minuten dauern; der Filter arbeitet weiter.', 'up.started': 'Installation gestartet.',
    'up.system': 'System darunter (Debian)',
    'ap.check': 'Nach neuer Version suchen', 'ap.run': (v) => `${v} installieren`, 'ap.current': 'Aktuell', 'ap.version': (v) => v ? `Installiert: Version ${v}` : 'Installiert: eine Fassung von vor den Updates',
    'ap.available': (v) => `Version ${v} ist auf GitHub verfügbar.`, 'ap.none': 'Das ist die neueste Version.', 'ap.never': 'Noch nicht gesucht.', 'ap.checked': (d) => `zuletzt gesucht ${d}`,
    'ap.running': 'Die neue Version wird installiert. Der Filter arbeitet weiter; die Seite lädt neu, sobald es fertig ist.', 'ap.started': 'Update gestartet.', 'ap.done': (v) => `Auf Version ${v} aktualisiert. Lade neu.`,
    'ap.failed': (m) => `Das letzte Update hat nicht geklappt: ${m}. Die bisherige Version läuft weiter.`, 'ap.rolledBack': 'Das letzte Update wurde rückgängig gemacht: Die neue Version startete nicht, also läuft wieder die bisherige.',
    'ap.auto': 'Neue Versionen automatisch installieren', 'ap.autoSub': 'Sieht einmal am Tag frühmorgens auf GitHub nach. Der Filter arbeitet während eines Updates weiter.',
    'ap.badge': (a) => a ? 'neue Version' : 'aktuell', 'up.checking': 'Suche nach Updates, das dauert bis zu einer Minute',
    'st.title': 'Einstellungen', 'st.sub': 'Klapp eine Kachel auf, um etwas zu ändern. Änderungen gelten sofort.',
    'st.dns': 'Sicheres DNS', 'st.dnsSub': 'Wen der Filter selbst fragt, und wie', 'st.dnsText': 'Was der Filter durchlässt, reicht er an einen Auflöser weiter. Mit DNS über HTTPS (DoH) ist diese Frage verschlüsselt: Weder dein Internetanbieter noch jemand auf der Leitung kann sie mitlesen oder verändern.',
    'st.dnssec': 'Antworten prüfen (DNSSEC)', 'st.dnssecSub': 'Gefälschte Antworten für signierte Adressen werden verworfen.', 'st.dnsOk': 'Auflöser gewechselt und getestet.', 'st.dnsFail': (m) => `Dieser Auflöser hat nicht geantwortet, es wurde nichts geändert: ${m}`, 'st.dnsTesting': 'Auflöser wird getestet', 'st.encrypted': 'verschlüsselt', 'st.saved': 'Gespeichert.',
    'dns.quad9': 'Sperrt bekannte Schadseiten. Gemeinnützig, Schweiz.', 'dns.quad9u': 'Ohne eigene Sperren. Gemeinnützig, Schweiz.', 'dns.cloudflare': 'Schnell, weltweit. USA.', 'dns.dns4eu': 'Öffentlicher europäischer Auflöser, ungefiltert.', 'dns.dns4eup': 'Europäischer Auflöser mit Schutz vor Schadseiten.', 'dns.mullvad': 'Betrieben von einem auf Privatsphäre ausgerichteten VPN-Anbieter. Schweden.',
    'st.privacy': 'Datenschutz', 'st.privacySub': 'Was gemerkt wird, und wie lange', 'st.keep': 'Anfrageprotokoll aufbewahren für', 'st.keepSub': 'Das Protokoll zeigt, welches Gerät nach welcher Adresse gefragt hat. Daraus entstehen Weltkarte und die Listen der Übersicht.',
    'st.k1': '24 Stunden', 'st.k7': '7 Tage', 'st.k30': '30 Tage', 'st.k90': '90 Tage', 'st.days': (n) => n === 1 ? '24 Stunden' : `${n} Tage`,
    'st.anon': 'Verbergen, welches Gerät gefragt hat', 'st.anonSub': 'Speichert gekürzte Adressen. Geräte lassen sich in der Oberfläche dann nicht mehr unterscheiden.',
    'st.wipe': 'Alles Gesammelte löschen', 'st.wipeSub': 'Leert das Protokoll und setzt alle Zähler zurück. Listen und Einstellungen bleiben.', 'st.wipeBtn': 'Jetzt löschen', 'st.wipeAsk': 'Das komplette Protokoll und alle Zähler löschen? Das lässt sich nicht rückgängig machen.', 'st.wiped': 'Protokoll und Zähler sind leer.',
    'st.access': 'Zugang', 'st.accessSub': 'Passwort und Abmelden', 'st.protected': 'geschützt', 'st.pwOld': 'Bisheriges Passwort', 'st.pwNew': 'Neues Passwort, mindestens 8 Zeichen', 'st.pwBtn': 'Passwort ändern', 'st.pwOk': 'Passwort geändert. Alle anderen Browser wurden abgemeldet.',
    'st.logout': 'In diesem Browser abmelden', 'st.logoutSub': 'Sonst hält die Anmeldung 30 Tage.', 'st.logoutBtn': 'Abmelden',
    'st.deviceSub': 'Filter-Motor und Adressen', 'st.planned': 'Noch nicht gebaut', 'st.plannedSub': 'Beschlossen, aber noch ohne Funktion. Hier lässt sich bisher nichts einstellen.', 'st.soon': 'geplant',
    'pl.kids': 'Kinder und Zeitpläne', 'pl.kidsText': 'Das Internet für ausgewählte Geräte an- und abschalten, von Hand oder nach Uhrzeit. Im Filterbetrieb läuft das über das Nachschlagen von Adressen; ein Kind, das die DNS-Einstellung ändert, kommt daran vorbei.',
    'pl.led': 'Taster und LEDs', 'pl.ledText': 'Der Knopf am Gerät pausiert den Filter für zehn Minuten. Die rote LED blitzt bei jeder aufgehaltenen Anfrage. Der Nachtmodus schaltet die LEDs ab.',
    'pl.notify': 'Meldungen aufs Handy', 'pl.notifyText': 'Ein neues Gerät ist im Netz, ein Gerät wollte eine Schadseite aufrufen, der Filter steht, ein Update liegt bereit.',
    'pl.backup': 'Sichern und Installieren', 'pl.backupText': 'Das Originalsystem sichern, herunterladen, zurückspielen und NetSluice fest installieren. Das lässt sich nur auf einem Gerät bauen und testen, das noch von der Karte läuft; dieses ist schon installiert.',
    'pl.net': 'Netzwerk', 'pl.netText': 'Adresse und Name hier ändern und zwischen Filter, Schleuse und Mithören wählen. Eine falsche Eingabe würde das Gerät abschneiden, deshalb braucht das erst einen sicheren Rückweg.',
    'pl.look': 'Aussehen', 'pl.lookText': 'Hell oder dunkel, Akzentfarbe, Animationen an oder aus.',
    'pl.export': 'Export und Import', 'pl.exportText': 'Alle Einstellungen, Listen und Gerätenamen in eine Datei speichern und auf einem anderen Gerät einlesen.',
    'gate.setupTitle': 'Wähle ein Passwort', 'gate.setupSub': 'Dieses Gerät filtert dein ganzes Netz. Ab jetzt kann es nur noch ändern, wer dieses Passwort kennt. Es gibt kein Zurücksetzen per E-Mail, bewahr es gut auf.',
    'gate.loginTitle': 'Anmelden', 'gate.loginSub': 'Gib das Passwort ein, das du für dieses NetSluice gewählt hast.',
    'gate.pw': 'Passwort', 'gate.pwNew': 'Passwort, mindestens 8 Zeichen', 'gate.pw2': 'Wiederholen', 'gate.setupBtn': 'Passwort setzen und starten', 'gate.loginBtn': 'Anmelden',
    'gate.mismatch': 'Die beiden Eingaben unterscheiden sich.', 'gate.short': 'Nimm mindestens 8 Zeichen.', 'gate.wrong': 'Das Passwort stimmt nicht.', 'gate.wait': 'Zu viele Fehlversuche. Warte fünf Minuten.', 'gate.down': 'Der NetSluice-Dienst antwortet nicht. Versuch es gleich noch einmal.', 'gate.configured': 'Es gibt schon ein Passwort. Lade die Seite neu, um dich anzumelden.',
    'st.device': 'Dieses Gerät', 'st.version': 'Filter-Motor', 'st.dnsPort': 'DNS-Port', 'st.addresses': 'Antwortet auf', 'st.since': 'Läuft seit',
  },
};

const CATALOG = [
  { name: 'AdGuard DNS filter', rules: 192000, en: 'Ads and trackers, balanced. A good first list.', de: 'Werbung und Tracker, ausgewogen. Eine gute erste Liste.', url: 'https://adguardteam.github.io/HostlistsRegistry/assets/filter_1.txt' },
  { name: 'HaGeZi Pro', rules: 244000, en: 'Ads, tracking, telemetry. Stricter than the default.', de: 'Werbung, Tracking, Telemetrie. Strenger als der Standard.', url: 'https://cdn.jsdelivr.net/gh/hagezi/dns-blocklists@latest/adblock/pro.txt' },
  { name: 'OISD Big', rules: 227000, en: 'Broad list built to avoid breaking sites.', de: 'Breite Liste, die möglichst nichts kaputt machen soll.', url: 'https://big.oisd.nl' },
  { name: 'HaGeZi Threat Intelligence (medium)', rules: 384000, en: 'Malware, phishing and scam hosts.', de: 'Schadsoftware, Phishing und Betrugsseiten.', url: 'https://cdn.jsdelivr.net/gh/hagezi/dns-blocklists@latest/adblock/tif.medium.txt' },
  { name: 'HaGeZi Encrypted DNS bypass', rules: 3600, en: 'Stops apps and devices from going around this filter with their own encrypted DNS.', de: 'Hindert Apps und Geräte daran, diesen Filter mit eigenem verschlüsseltem DNS zu umgehen.', url: 'https://cdn.jsdelivr.net/gh/hagezi/dns-blocklists@latest/adblock/doh.txt' },
  { name: 'Smart-TV blocklist', rules: 160, en: 'Telemetry and ads of smart TVs.', de: 'Telemetrie und Werbung von Smart-TVs.', url: 'https://raw.githubusercontent.com/Perflyst/PiHoleBlocklist/master/SmartTV-AGH.txt' },
  { name: 'Amazon devices', rules: 380, en: 'Built-in tracking of Echo, Fire TV and Kindle.', de: 'Eingebautes Tracking von Echo, Fire TV und Kindle.', url: 'https://cdn.jsdelivr.net/gh/hagezi/dns-blocklists@latest/adblock/native.amazon.txt' },
  { name: 'Samsung devices', rules: 200, en: 'Built-in tracking of Samsung phones and TVs.', de: 'Eingebautes Tracking von Samsung-Handys und -Fernsehern.', url: 'https://cdn.jsdelivr.net/gh/hagezi/dns-blocklists@latest/adblock/native.samsung.txt' },
  { name: 'Apple devices', rules: 100, en: 'Built-in tracking of iPhone, iPad and Mac.', de: 'Eingebautes Tracking von iPhone, iPad und Mac.', url: 'https://cdn.jsdelivr.net/gh/hagezi/dns-blocklists@latest/adblock/native.apple.txt' },
  { name: 'Xiaomi devices', rules: 410, en: 'Built-in tracking of Xiaomi phones and gadgets.', de: 'Eingebautes Tracking von Xiaomi-Handys und -Geräten.', url: 'https://cdn.jsdelivr.net/gh/hagezi/dns-blocklists@latest/adblock/native.xiaomi.txt' },
  { name: 'LG webOS TVs', rules: 460, en: 'Built-in tracking of LG televisions.', de: 'Eingebautes Tracking von LG-Fernsehern.', url: 'https://cdn.jsdelivr.net/gh/hagezi/dns-blocklists@latest/adblock/native.lgwebos.txt' },
  { name: 'Windows and Office', rules: 400, en: 'Telemetry of Windows and Microsoft Office.', de: 'Telemetrie von Windows und Microsoft Office.', url: 'https://cdn.jsdelivr.net/gh/hagezi/dns-blocklists@latest/adblock/native.winoffice.txt' },
  { name: 'HaGeZi Threat Intelligence (full)', rules: 1510000, heavy: true, en: 'The complete feed. Needs about 500 MB of memory on its own.', de: 'Der komplette Bestand. Braucht allein rund 500 MB Arbeitsspeicher.', url: 'https://cdn.jsdelivr.net/gh/hagezi/dns-blocklists@latest/adblock/tif.txt' },
];

// ?lang=en or ?lang=de in the address wins, then what this browser chose before, then the browser's language
let lang = (() => { const q = new URLSearchParams(location.search).get('lang'); return q === 'en' || q === 'de' ? q : null; })()
  || (() => { try { return localStorage.getItem('netsluice.lang'); } catch { return null; } })()
  || ((navigator.language || 'en').toLowerCase().startsWith('de') ? 'de' : 'en');
let screen = 'overview';
const state = { stats: null, status: null, clients: {}, devices: {}, filters: [], recent: [], reachable: true, last: null };
const SCREENS = ['overview', 'devices', 'filters', 'map', 'tunnel', 'settings'];

const $ = (id) => document.getElementById(id);
const t = (key, ...args) => { const v = (T[lang] && T[lang][key]) ?? T.en[key] ?? key; return typeof v === 'function' ? v(...args) : v; };
const fmt = (n) => Number(n || 0).toLocaleString(lang === 'de' ? 'de-DE' : 'en-US');
function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) { e.textContent = text; if (tag === 'b' || tag === 'small') e.title = text; } return e; }
function fill(node, children, emptyKey) { node.replaceChildren(...(children.length ? children : [el('div', 'empty', t(emptyKey))])); }

async function api(path, body, method = 'POST') {
  const opt = body === undefined ? {} : { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
  const r = await fetch('/control/' + path, opt);
  if (r.status === 401) { gate('login'); throw new Error('login'); }
  if (!r.ok) throw new Error((await r.text()).trim().slice(0, 200) || ('HTTP ' + r.status));
  // The filter answers some actions with plain text ("OK 227145 rules"), not JSON.
  const txt = await r.text();
  return txt && (r.headers.get('content-type') || '').includes('json') ? JSON.parse(txt) : txt;
}

function applyLang() {
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach((n) => { n.textContent = t(n.dataset.i18n); });
  document.querySelectorAll('[data-i18n-aria]').forEach((n) => { n.setAttribute('aria-label', t(n.dataset.i18nAria)); });
  $('lang').textContent = lang === 'de' ? 'EN' : 'DE';
  render();
  if (screen === 'settings') { renderSettings(); renderKids(); renderDevice(); renderSystem(); }
  if (screen === 'filters') renderFilters();
  if (screen === 'map') renderMap();
}

function show(name) {
  if (!SCREENS.includes(name)) name = 'overview';
  screen = name;
  // keep the section in the address, so a reload or the back button returns to it
  if (location.hash.slice(1) !== name) history.replaceState(null, '', name === 'overview' ? location.pathname : '#' + name);
  document.querySelectorAll('.screen').forEach((s) => { s.hidden = s.id !== 'screen-' + name; });
  document.querySelectorAll('#nav button').forEach((b) => { b.setAttribute('aria-current', b.dataset.screen === name ? 'page' : 'false'); });
  if (name === 'filters') loadFilters();
  if (name === 'settings') loadSettings();
  if (name === 'map') { renderMap(); if (geo.map) geo.map.layout(); pollGeo(); }
  render();
}

function clientName(ip) { const d = state.devices[ip]; return (d && d.name) || state.clients[ip] || ip; }
function pairs(list) { return (list || []).map((o) => { const k = Object.keys(o)[0]; return [k, o[k]]; }); }

const sluice = createSluice($('flow'));

// ---- world map ----
const geo = { map: null, seq: 0, primed: false, countries: {}, home: null, busy: false };
const regionName = (a2) => { try { return new Intl.DisplayNames([lang], { type: 'region' }).of(a2) || a2; } catch { return a2; } };
createWorldMap($('map'), $('mapTip'), { label: (a2, ok, no) => t('mp.tip', regionName(a2), fmt(ok), fmt(no)) })
  .then((m) => { geo.map = m; m.setData(geo.countries, geo.home); })
  .catch(() => { /* the map data could not be loaded; the ranking still works */ });

function renderMap() {
  const rows = Object.entries(geo.countries).map(([a2, v]) => [a2, v[0], v[1]]).sort((a, b) => (b[1] + b[2]) - (a[1] + a[2]));
  $('mapTitle').textContent = t('mp.title', rows.length);
  const top = Math.max(1, ...rows.map((r) => r[1] + r[2]));
  fill($('mapRank'), rows.slice(0, 12).map(([a2, ok, no]) => {
    const row = el('div', 'rank'); row.append(el('b', '', regionName(a2)));
    const m = el('div', 'meter'); const a = el('i'); a.style.width = (ok / top * 100) + '%'; const b = el('i', 'no'); b.style.width = (no / top * 100) + '%'; m.append(a, b);
    row.append(m, el('span', 'num', t('mp.row', fmt(ok), fmt(no))));
    return row;
  }), 'mp.empty');
}

async function pollGeo() {
  if (geo.busy || screen !== 'map') return;
  geo.busy = true;
  try {
    const r = await fetch('/api/geo?since=' + geo.seq);
    if (r.ok) {
      const d = await r.json();
      geo.countries = d.countries || {}; geo.home = d.home && d.home.cc;
      if (geo.map) {
        geo.map.setData(geo.countries, geo.home);
        // what happened before the map was opened is history, not live traffic
        if (geo.primed) for (const ev of d.events || []) setTimeout(() => geo.map.addEvent(ev), Math.random() * 1100);
      }
      geo.seq = d.seq || geo.seq; geo.primed = true;
      renderMap();
    }
  } catch { /* shown by the status dot */ }
  geo.busy = false;
}
const spawn = (kind) => sluice.add(kind);

// Roll a number to its new value instead of jumping.
const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function countTo(node, target) {
  const from = node._shown ?? target;
  node._target = target;
  if (still || from === target || document.hidden) { node._shown = target; node.textContent = fmt(target); return; }
  if (node._rolling) return;
  node._rolling = true;
  const t0 = performance.now(), start = from;
  const tick = (now) => {
    const k = Math.min(1, (now - t0) / 450);
    node._shown = Math.round(start + (node._target - start) * k);
    node.textContent = fmt(node._shown);
    if (k < 1) requestAnimationFrame(tick); else { node._rolling = false; node._shown = node._target; node.textContent = fmt(node._target); }
  };
  requestAnimationFrame(tick);
}

// Keep the headline on one line and as large as the tile allows.
function fitHero() {
  const h = document.querySelector('.tile.hero h1');
  if (!h || !h.clientWidth) return;
  const MAX = 46, MIN = 18;
  h.style.fontSize = MAX + 'px';
  if (h.scrollWidth > h.clientWidth) h.style.fontSize = Math.max(MIN, Math.floor(MAX * h.clientWidth / h.scrollWidth)) + 'px';
}

function render() {
  const s = state.stats;
  const dot = $('statusDot');
  const on = state.status ? state.status.protection_enabled : true;
  dot.className = 'dot' + (!state.reachable ? ' err' : on ? '' : ' off');
  $('statusText').textContent = t(!state.reachable ? 'status.err' : on ? 'status.on' : 'status.off');
  if (!s) return;

  const total = s.num_dns_queries || 0, blocked = s.num_blocked_filtering || 0;
  countTo($('numPassed'), total - blocked);
  countTo($('numBlocked'), blocked);
  $('shareText').textContent = total ? t('ov.share', Math.round(blocked / total * 100)) : t('ov.shareNone');
  fitHero();

  const q = s.dns_queries || [], b = s.blocked_filtering || [];
  const max = Math.max(1, ...q);
  const bars = $('bars');
  if (bars.childElementCount !== q.length) bars.replaceChildren(...q.map(() => { const c = el('div'); c.append(el('i', 'no'), el('i', 'ok')); return c; }));
  q.forEach((v, i) => {
    const col = bars.children[i];
    col.children[0].style.height = ((b[i] || 0) / max * 100) + '%';
    col.children[1].style.height = (Math.max(0, v - (b[i] || 0)) / max * 100) + '%';
  });

  // the filter's own lookups (clock, updates, list downloads) are not a device of yours
  const own = new Set([location.hostname, '127.0.0.1', '::1', ...((state.status && state.status.dns_addresses) || []).map((a) => a.split('%')[0])]);
  const isSelf = (ip) => own.has(ip) || (state.devices[ip] && state.devices[ip].kind === 'self');
  const clients = pairs(s.top_clients).filter(([ip]) => !isSelf(ip));
  const cmax = Math.max(1, ...clients.map((c) => c[1]));
  fill($('topDevices'), clients.slice(0, 5).map(([ip, n]) => {
    const row = el('div', 'item'); const main = el('div', 'main');
    main.append(el('b', '', clientName(ip)));
    const m = el('div', 'meter'); const bar = el('i'); bar.style.width = (n / cmax * 100) + '%'; m.append(bar); main.append(m);
    main.style.flex = '1 1 auto';
    row.append(main, el('div', 'side', fmt(n)));
    return row;
  }), 'empty.devices');

  fill($('recent'), state.recent.slice(0, 6).map((r) => {
    const row = el('div', 'item'); const main = el('div', 'main');
    main.append(el('b', '', r.host), el('small', '', clientName(r.client)));
    row.append(main, el('div', 'side', new Date(r.time).toLocaleTimeString(lang === 'de' ? 'de-DE' : 'en-US', { hour: '2-digit', minute: '2-digit' })));
    return row;
  }), 'empty.recent');

  fill($('topBlocked'), pairs(s.top_blocked_domains).slice(0, 6).map(([host, n]) => {
    const row = el('div', 'item'); const main = el('div', 'main'); main.append(el('b', '', host));
    row.append(main, el('div', 'side', `${fmt(n)} ${t('times')}`));
    return row;
  }), 'empty.blocked');

  $('devicesTitle').textContent = t('dv.title', clients.length);
  // busiest device first, with its place in the top right corner
  const ranked = [...clients].sort((a, b) => b[1] - a[1]);
  $('deviceGrid').replaceChildren(...ranked.map(([ip, n], i) => {
    const d = state.devices[ip] || {};
    const c = el('div', 'card');
    const head = el('div', 'cardhead'); head.append(el('h3', '', clientName(ip)), el('span', 'place' + (i < 3 ? ' top' + (i + 1) : ''), t('dv.place', i + 1)));
    c.append(head);
    c.append(el('span', 'badge ' + (d.kind && d.kind !== 'unknown' ? '' : 'off'), t('kind.' + (d.kind || 'unknown'))));
    const what = [d.model, d.vendor || (d.private ? t('dv.private') : null)].filter(Boolean).join(' · ');
    c.append(el('p', 'muted', what || t('dv.nothing')));
    const kv = (k, v) => { const r = el('div', 'kv'); r.append(el('span', '', k), el('span', '', v)); return r; };
    if (d.firmware) c.append(kv(t('dv.firmware'), d.firmware));
    c.append(kv(t('dv.requests'), fmt(n)), kv(t('dv.share'), (total ? Math.round(n / total * 100) : 0) + ' %'), kv(t('dv.address'), ip));
    if (d.mac) c.append(kv(t('dv.mac'), d.mac));
    return c;
  }));

  if (state.status) {
    const st = state.status;
    const kv = (k, v) => { const r = el('div', 'item'); const m = el('div', 'main'); m.append(el('b', '', k)); r.append(m, el('div', 'side', v)); return r; };
    $('deviceInfo').replaceChildren(
      kv(t('st.version'), 'AdGuard Home ' + (st.version || '')),
      kv(t('st.dnsPort'), String(st.dns_port || '')),
      kv(t('st.addresses'), (st.dns_addresses || []).filter((a) => !a.startsWith('fe80') && a !== '::1' && a !== '127.0.0.1').join(', ')),
      kv(t('st.since'), st.start_time ? new Date(st.start_time).toLocaleString(lang === 'de' ? 'de-DE' : 'en-US') : ''),
    );
  }
}

function note(kind, text) { const n = $('filterNote'); n.className = 'note ' + kind; n.textContent = text; }
let busy = false;
// Run one change to the filter lists at a time; a large list takes a while to download.
async function act(fn, okKey, button, keepLabel) {
  if (busy) return;
  busy = true;
  const label = button && button.textContent;
  if (button) { button.disabled = true; if (!keepLabel) button.textContent = t('fl.working'); }
  note('', t('fl.wait'));
  try { await fn(); note('ok', t(okKey)); }
  catch (e) {
    // asking for a list that is already there is not a failure
    if (/already exists/i.test(e.message)) note('ok', t('fl.have'));
    else { note('bad', t('fl.fail', e.message)); if (button && !keepLabel) { button.disabled = false; button.textContent = label; } }
  }
  busy = false;
  await loadFilters();
}

// One tile per list: the well-known ones first, then the ones added by address.
function renderFilters() {
  const byUrl = new Map(state.filters.map((f) => [f.url, f]));
  const known = new Set(CATALOG.map((c) => c.url));
  const sum = state.filters.filter((f) => f.enabled).reduce((n, f) => n + (f.rules_count || 0), 0);
  const active = state.filters.filter((f) => f.enabled).length;
  $('listTotal').textContent = t('fl.total', active, fmt(sum));

  const tile = (name, text, url, approx, heavy, custom) => {
    const f = byUrl.get(url), on = !!(f && f.enabled);
    const card = el('div', 'card' + (on ? ' on' : ''));
    card.append(el('h3', '', name));
    if (text) card.append(el('p', 'muted', text));
    const count = on && f.rules_count ? `${fmt(f.rules_count)} ${t('fl.rules')}` : approx ? `${t('fl.about')} ${fmt(approx)} ${t('fl.rules')}` : null;
    if (count) card.append(el('span', heavy ? 'badge heavy' : on ? 'badge' : 'badge off', count));
    const foot = el('div', 'cardfoot');
    const sw = el('button', 'switch'); sw.type = 'button'; sw.setAttribute('role', 'switch'); sw.setAttribute('aria-checked', on ? 'true' : 'false');
    sw.setAttribute('aria-label', name);
    const label = el('span', '', on ? t('fl.on') : t('fl.off'));
    sw.append(el('span', 'track'), label);
    sw.onclick = () => {
      if (busy) return;
      sw.setAttribute('aria-checked', on ? 'false' : 'true'); label.textContent = t('fl.working');   // answer the click at once
      act(() => f ? api('filtering/set_url', { url, whitelist: false, data: { name: f.name, url, enabled: !on } })
                  : api('filtering/add_url', { name, url, whitelist: false }), on ? 'fl.okOff' : 'fl.okOn', sw, true);
    };
    foot.append(sw);
    if (custom) {
      const rm = el('button', 'link danger', t('fl.remove')); rm.type = 'button';
      rm.onclick = () => act(() => api('filtering/remove_url', { url, whitelist: false }), 'fl.okRemove', rm);
      foot.append(rm);
    }
    card.append(foot);
    return card;
  };

  const tiles = CATALOG.map((c) => tile(c.name, c[lang] || c.en, c.url, c.rules, c.heavy, false));
  for (const f of state.filters) if (!known.has(f.url)) tiles.push(tile(f.name || f.url, f.url, f.url, 0, false, true));
  $('listGrid').replaceChildren(...tiles);
}

async function loadFilters() {
  try { const f = await api('filtering/status'); state.filters = f.filters || []; renderFilters(); } catch { /* shown via status dot */ }
}

// Two loops: the counters and the sluice follow the filter once a second,
// the slower lists (names, recent blocks) every five seconds.
const FAST = 1000, SLOW = 5000;
let fastBusy = false;

async function pollStats() {
  if (fastBusy) return;            // never queue up requests behind a slow answer
  fastBusy = true;
  try {
    const stats = await api('stats');
    if (state.last) {
      const dq = Math.max(0, (stats.num_dns_queries || 0) - state.last.q);
      const db = Math.max(0, (stats.num_blocked_filtering || 0) - state.last.b);
      // spread the new requests over the interval so the stream looks continuous
      const kinds = [...Array(Math.min(db, 25)).fill('no'), ...Array(Math.min(dq - db, 60)).fill('ok')];
      for (const k of kinds) setTimeout(() => spawn(k), Math.random() * (FAST - 100));
    }
    state.last = { q: stats.num_dns_queries || 0, b: stats.num_blocked_filtering || 0 };
    state.stats = stats; state.reachable = true;
  } catch { state.reachable = false; }
  fastBusy = false;
  render();
}

async function pollRest() {
  try {
    const [status, log, clients] = await Promise.all([api('status'), api('querylog?limit=20&response_status=blocked'), api('clients')]);
    const names = {};
    for (const c of (clients && clients.auto_clients) || []) if (c.name && c.name !== c.ip) names[c.ip] = c.name.replace(/\.(localdomain|lan|local|home)$/i, '');
    state.clients = names;
    state.recent = ((log && log.data) || []).map((e) => ({ host: e.question && e.question.name, client: e.client, time: e.time }));
    state.status = status;
  } catch { /* the fast loop reports reachability */ }
  try { const r = await fetch('/api/devices'); if (r.ok) state.devices = (await r.json()).devices || {}; } catch { /* names are optional */ }
  render();
}

$('nav').addEventListener('click', (e) => { const b = e.target.closest('button[data-screen]'); if (b) show(b.dataset.screen); });
document.addEventListener('click', (e) => { const b = e.target.closest('[data-goto]'); if (b) show(b.dataset.goto); });
$('lang').addEventListener('click', () => { lang = lang === 'de' ? 'en' : 'de'; try { localStorage.setItem('netsluice.lang', lang); } catch { /* private mode */ } applyLang(); });
$('refreshLists').addEventListener('click', (e) => act(() => api('filtering/refresh', { whitelist: false }), 'fl.okRefresh', e.currentTarget));
$('customForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const name = $('customName').value.trim(), url = $('customUrl').value.trim();
  act(() => api('filtering/add_url', { name, url, whitelist: false }), 'fl.okAdd').then(() => { $('customName').value = ''; $('customUrl').value = ''; });
});

new ResizeObserver(fitHero).observe(document.querySelector('.tile.hero'));
if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitHero);

// ---- sign-in -------------------------------------------------------------
let gateMode = null, started = false;
function gate(mode) {
  gateMode = mode;
  $('shell').hidden = true; $('gate').hidden = false;
  const setup = mode === 'setup';
  $('gateTitle').textContent = t(setup ? 'gate.setupTitle' : 'gate.loginTitle');
  $('gateSub').textContent = t(setup ? 'gate.setupSub' : 'gate.loginSub');
  $('gateLabel1').textContent = t(setup ? 'gate.pwNew' : 'gate.pw');
  $('gateLabel2').textContent = t('gate.pw2');
  $('gateRepeat').hidden = !setup; $('gatePw2').required = setup;
  $('gatePw').autocomplete = setup ? 'new-password' : 'current-password';
  $('gateBtn').textContent = t(setup ? 'gate.setupBtn' : 'gate.loginBtn');
  $('gateLang').textContent = lang === 'de' ? 'EN' : 'DE';
}
async function post(path, body) {
  const r = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) });
  let d = {}; try { d = await r.json(); } catch { /* no body */ }
  return { ok: r.ok, status: r.status, error: d.error };
}
$('gateForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const pw = $('gatePw').value, n = $('gateNote'); n.className = 'note bad';
  if (pw.length < 8 && gateMode === 'setup') { n.textContent = t('gate.short'); return; }
  if (gateMode === 'setup' && pw !== $('gatePw2').value) { n.textContent = t('gate.mismatch'); return; }
  $('gateBtn').disabled = true;
  let r; try { r = await post(gateMode === 'setup' ? '/auth/setup' : '/auth/login', { password: pw }); } catch { r = { error: 'down' }; }
  $('gateBtn').disabled = false;
  if (r.ok) { $('gatePw').value = ''; $('gatePw2').value = ''; n.textContent = ''; enter(); return; }
  n.textContent = t('gate.' + ({ short: 'short', wrong: 'wrong', wait: 'wait', configured: 'configured' }[r.error] || 'down'));
});
$('gateLang').addEventListener('click', () => { lang = lang === 'de' ? 'en' : 'de'; try { localStorage.setItem('netsluice.lang', lang); } catch { /* private mode */ } applyLang(); gate(gateMode); });

function enter() {
  $('gate').hidden = true; $('shell').hidden = false;
  show(location.hash.slice(1) || 'overview');
  pollStats(); pollRest();
  if (started) return;
  started = true;
  window.addEventListener('hashchange', () => show(location.hash.slice(1) || 'overview'));
  setInterval(() => { if (!$('shell').hidden) pollStats(); }, FAST);
  setInterval(() => { if (!$('shell').hidden) pollRest(); }, SLOW);
  setInterval(() => { if (!$('shell').hidden) pollGeo(); }, 1200);
  // keep the on/off state of the children's devices current, but never while someone is typing a time
  setInterval(async () => {
    if ($('shell').hidden || screen !== 'settings' || (document.activeElement && document.activeElement.type === 'time')) return;
    try { kids.rules = (await svc('kids')).rules || {}; renderKids(); } catch { /* next round */ }
  }, 15000);
}

// ---- settings --------------------------------------------------------------
const RESOLVERS = [
  { id: 'quad9', name: 'Quad9', url: 'https://dns.quad9.net/dns-query', boot: ['9.9.9.9', '149.112.112.112'] },
  { id: 'quad9u', name: 'Quad9 (unfiltered)', url: 'https://dns10.quad9.net/dns-query', boot: ['9.9.9.10', '149.112.112.10'] },
  { id: 'dns4eup', name: 'DNS4EU Protective', url: 'https://protective.joindns4.eu/dns-query', boot: ['9.9.9.9', '1.1.1.1'] },
  { id: 'dns4eu', name: 'DNS4EU', url: 'https://unfiltered.joindns4.eu/dns-query', boot: ['9.9.9.9', '1.1.1.1'] },
  { id: 'mullvad', name: 'Mullvad', url: 'https://dns.mullvad.net/dns-query', boot: ['9.9.9.9', '1.1.1.1'] },
  { id: 'cloudflare', name: 'Cloudflare', url: 'https://cloudflare-dns.com/dns-query', boot: ['1.1.1.1', '1.0.0.1'] },
];
const cfg = { dns: null, log: null, working: false };
const say = (id, kind, text) => { const n = $(id); n.className = 'note ' + kind; n.textContent = text; };
const setSwitch = (b, on) => { b.setAttribute('aria-checked', on ? 'true' : 'false'); b.lastElementChild.textContent = on ? t('fl.on') : t('fl.off'); };

function renderSettings() {
  if (cfg.dns) {
    const cur = (cfg.dns.upstream_dns || [])[0] || '';
    const hit = RESOLVERS.find((r) => r.url === cur);
    $('dnsBadge').textContent = hit ? hit.name : cur.replace(/^https?:\/\//, '').split('/')[0];
    $('dnsChoices').replaceChildren(...RESOLVERS.map((r) => {
      const b = el('button', 'choice'); b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', r.url === cur ? 'true' : 'false');
      b.append(el('b', '', r.name), el('small', '', t('dns.' + r.id)));
      b.onclick = async () => {
        if (cfg.working || r.url === cur) return;
        cfg.working = true; b.disabled = true; say('dnsNote', '', t('st.dnsTesting'));
        try {
          const res = await api('test_upstream_dns', { upstream_dns: [r.url], bootstrap_dns: r.boot, fallback_dns: [], private_upstream: [] });
          const bad = Object.values(res || {}).find((v) => v !== 'OK');
          if (bad) throw new Error(String(bad).slice(0, 120));
          await api('dns_config', { upstream_dns: [r.url], bootstrap_dns: r.boot });
          say('dnsNote', 'ok', t('st.dnsOk'));
        } catch (e) { say('dnsNote', 'bad', t('st.dnsFail', e.message)); }
        cfg.working = false; loadSettings();
      };
      return b;
    }));
    setSwitch($('dnssec'), !!cfg.dns.dnssec_enabled);
  }
  if (cfg.log) {
    const days = Math.round(cfg.log.interval / 86400000);
    $('privacyBadge').textContent = t('st.days', days);
    $('keepLog').value = String(cfg.log.interval);
    setSwitch($('anon'), !!cfg.log.anonymize_client_ip);
  }
  $('plannedGrid').replaceChildren(...['backup'].map((k) => {
    const c = el('div', 'card'); const h = el('div', 'cardhead'); h.append(el('h3', '', t('pl.' + k)), el('span', 'badge off', t('st.soon')));
    c.append(h, el('p', 'muted', t('pl.' + k + 'Text'))); return c;
  }));
}
// ---- children and schedules ---------------------------------------------------
const kids = { rules: {} };
async function svc(path, body) {
  const r = await fetch('/api/' + path, body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (r.status === 401) { gate('login'); throw new Error('login'); }
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}
async function kidCall(path, body) {
  try { kids.rules = (await svc(path, body)).rules || {}; say('kidsNote', 'ok', t('st.saved')); } catch (e) { say('kidsNote', 'bad', t('fl.fail', e.message)); }
  renderKids();
}
function renderKids() {
  const keys = Object.keys(kids.rules);
  $('kidsBadge').textContent = t('kd.badge', keys.length, keys.filter((k) => kids.rules[k].blocked).length);
  $('kidsBadge').className = 'badge' + (keys.some((k) => kids.rules[k].blocked) ? ' no' : keys.length ? '' : ' off');
  fill($('kidsList'), keys.map((key) => {
    const r = kids.rules[key];
    const box = el('div', 'kid' + (r.blocked ? ' blocked' : ''));
    const head = el('div', 'kidhead'); head.append(el('b', '', r.name || key), el('span', 'badge' + (r.blocked ? ' no' : ''), t(r.blocked ? 'kd.isOff' : 'kd.isOn')));
    const seg = el('div', 'seg'); seg.setAttribute('role', 'radiogroup');
    for (const [mode, label] of [['on', 'kd.on'], ['schedule', 'kd.plan'], ['off', 'kd.off']]) {
      const b = el('button', '', t(label)); b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', r.mode === mode ? 'true' : 'false');
      b.onclick = () => kidCall('kids', { key, mode });
      seg.append(b);
    }
    box.append(head, seg);
    if (r.mode === 'schedule') {
      const days = el('div', 'days');
      t('kd.days').forEach((d, i) => {
        const b = el('button', '', d); b.type = 'button'; b.setAttribute('aria-pressed', r.days.includes(i) ? 'true' : 'false');
        b.onclick = () => kidCall('kids', { key, mode: 'schedule', days: r.days.includes(i) ? r.days.filter((x) => x !== i) : [...r.days, i] });
        days.append(b);
      });
      const plan = el('div', 'plan');
      const time = (val, field) => { const i = el('input'); i.type = 'time'; i.value = val; i.setAttribute('aria-label', t(field === 'from' ? 'kd.from' : 'kd.to')); i.onchange = () => kidCall('kids', { key, mode: 'schedule', [field]: i.value }); return i; };
      plan.append(el('span', '', t('kd.from')), time(r.from, 'from'), el('span', '', t('kd.to')), time(r.to, 'to'));
      box.append(days, plan);
    }
    const foot = el('div', 'kidfoot');
    const extra = r.until && r.until * 1000 > Date.now();
    if (extra) {
      foot.append(el('span', 'badge', t('kd.extra', new Date(r.until * 1000).toLocaleTimeString(lang === 'de' ? 'de-DE' : 'en-US', { hour: '2-digit', minute: '2-digit' }))));
      const end = el('button', 'btn ghost', t('kd.endExtra')); end.type = 'button'; end.onclick = () => kidCall('kids/extend', { key, minutes: 0 }); foot.append(end);
    } else if (r.mode !== 'on') {
      for (const [m, label] of [[30, 'kd.plus30'], [60, 'kd.plus60']]) { const b = el('button', 'btn ghost', t(label)); b.type = 'button'; b.onclick = () => kidCall('kids/extend', { key, minutes: m }); foot.append(b); }
    }
    const rm = el('button', 'link danger', t('kd.remove')); rm.type = 'button'; rm.onclick = () => kidCall('kids/remove', { key }); foot.append(rm);
    if (key.startsWith('ip:')) foot.append(el('small', 'muted', t('kd.noMac')));
    box.append(foot);
    return box;
  }), 'kd.none');
  // devices that can still be added
  const taken = new Set(keys);
  const opts = Object.entries(state.devices).filter(([, d]) => d.kind !== 'self').map(([ip, d]) => ({ key: d.mac || 'ip:' + ip, label: (d.name || ip) + (d.name ? ' (' + ip + ')' : '') }))
    .filter((o) => !taken.has(o.key)).sort((a, b) => a.label.localeCompare(b.label));
  const pick = $('kidPick'), keep = pick.value;
  pick.replaceChildren(...opts.map((o) => { const e = el('option', '', o.label); e.value = o.key; e.dataset.name = o.label.replace(/ \(.*\)$/, ''); return e; }));
  if (opts.some((o) => o.key === keep)) pick.value = keep;
  $('kidAdd').disabled = !opts.length;
}
$('kidAdd').addEventListener('click', () => {
  const o = $('kidPick').selectedOptions[0];
  if (o) kidCall('kids', { key: o.value, name: o.dataset.name, mode: 'on' });
});

// ---- button, LEDs, messages, appearance, export ---------------------------------
const dev = { s: null };
const segment = (node, options, current, onPick) => node.replaceChildren(...options.map(([val, label]) => {
  const b = el('button', '', label); b.type = 'button'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', val === current ? 'true' : 'false'); b.onclick = () => onPick(val); return b;
}));
async function devSave(change, noteId) {
  try { dev.s = await svc('settings', change); say(noteId, 'ok', t('st.saved')); } catch (e) { say(noteId, 'bad', t('fl.fail', e.message)); }
  renderDevice();
}
const ACCENTS = ['#F5C451', '#5EE6F2', '#B79CFF', '#FF8FB1', '#B6F36A'];
const stored = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const store = (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } };
function renderDevice() {
  const cur = (stored('netsluice.accent') || ACCENTS[0]).toUpperCase();
  $('accents').replaceChildren(...ACCENTS.map((c) => {
    const b = el('button'); b.type = 'button'; b.style.background = c; b.setAttribute('role', 'radio'); b.setAttribute('aria-label', c); b.setAttribute('aria-checked', c === cur ? 'true' : 'false');
    b.onclick = () => { store('netsluice.accent', c); location.reload(); };
    return b;
  }));
  setSwitch($('motion'), stored('netsluice.still') !== '1');
  const s = dev.s; if (!s) return;
  $('ledHw').textContent = t(s.hardware.leds && s.hardware.button ? 'ld.hwOk' : 'ld.hwNo');
  $('ledBadge').textContent = t('ld.badge')[s.led.mode];
  segment($('ledMode'), [['on', t('ld.on')], ['night', t('ld.nightMode')], ['off', t('ld.off')]], s.led.mode, (v) => devSave({ led: { mode: v } }, 'ledNote'));
  $('ledNight').hidden = s.led.mode !== 'night';
  if (document.activeElement !== $('ledFrom')) $('ledFrom').value = s.led.night_from;
  if (document.activeElement !== $('ledTo')) $('ledTo').value = s.led.night_to;
  setSwitch($('ledFlash'), s.led.flash); setSwitch($('btnOn'), s.button);
  $('ntBadge').textContent = t('nt.' + s.notify.kind); $('ntBadge').className = 'badge' + (s.notify.kind === 'off' ? ' off' : '');
  segment($('ntKind'), [['off', t('nt.off')], ['ntfy', t('nt.ntfy')], ['webhook', t('nt.webhook')]], s.notify.kind, (v) => devSave({ notify: { kind: v } }, 'ntNote'));
  $('ntHint').textContent = t('nt.hint')[s.notify.kind];
  if (document.activeElement !== $('ntUrl')) $('ntUrl').value = s.notify.url;
  setSwitch($('ntNewdev'), s.notify.newdev); setSwitch($('ntMalware'), s.notify.malware); setSwitch($('ntDown'), s.notify.down);
}
$('motion').addEventListener('click', () => { store('netsluice.still', stored('netsluice.still') === '1' ? '0' : '1'); location.reload(); });
$('ledFrom').addEventListener('change', (e) => devSave({ led: { night_from: e.target.value } }, 'ledNote'));
$('ledTo').addEventListener('change', (e) => devSave({ led: { night_to: e.target.value } }, 'ledNote'));
$('ledFlash').addEventListener('click', () => dev.s && devSave({ led: { flash: !dev.s.led.flash } }, 'ledNote'));
$('btnOn').addEventListener('click', () => dev.s && devSave({ button: !dev.s.button }, 'ledNote'));
for (const [id, key] of [['ntNewdev', 'newdev'], ['ntMalware', 'malware'], ['ntDown', 'down']]) $(id).addEventListener('click', () => dev.s && devSave({ notify: { [key]: !dev.s.notify[key] } }, 'ntNote'));
$('ntForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const url = $('ntUrl').value.trim();
  if (url && !/^https?:\/\/\S+$/.test(url)) { say('ntNote', 'bad', t('nt.badUrl')); return; }
  devSave({ notify: { url } }, 'ntNote');
});
$('ntTest').addEventListener('click', async () => {
  try { const r = await svc('notify/test', {}); say('ntNote', r.ok ? 'ok' : 'bad', r.ok ? t('nt.sent') : t('nt.notSent', r.error)); } catch (e) { say('ntNote', 'bad', t('fl.fail', e.message)); }
});
$('exOut').addEventListener('click', async () => {
  try {
    const [f, d, q, k, st] = await Promise.all([api('filtering/status'), api('dns_info'), api('querylog/config'), svc('kids'), svc('settings')]);
    const out = {
      netsluice: 1, exported: new Date().toISOString(),
      filters: (f.filters || []).map((x) => ({ name: x.name, url: x.url, enabled: x.enabled })),
      dns: { upstream_dns: d.upstream_dns, bootstrap_dns: d.bootstrap_dns, dnssec_enabled: d.dnssec_enabled },
      log: { interval: q.interval, anonymize_client_ip: q.anonymize_client_ip },
      kids: Object.fromEntries(Object.entries(k.rules || {}).map(([key, r]) => [key, { name: r.name, mode: r.mode, days: r.days, from: r.from, to: r.to }])),
      device: { led: st.led, button: st.button, notify: st.notify },
    };
    const a = el('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' })); a.download = 'netsluice-settings.json';
    document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    say('exNote', 'ok', t('st.saved'));
  } catch (e) { say('exNote', 'bad', t('fl.fail', e.message)); }
});
$('exFile').addEventListener('change', async (e) => {
  const file = e.target.files[0]; if (!file) return;
  let d; try { d = JSON.parse(await file.text()); } catch { d = null; }
  e.target.value = '';
  if (!d || d.netsluice !== 1) { say('exNote', 'bad', t('ex.bad')); return; }
  let n = 0;
  try {
    const have = new Map(((await api('filtering/status')).filters || []).map((x) => [x.url, x]));
    for (const x of d.filters || []) {
      if (typeof x.url !== 'string' || !/^https?:\/\//.test(x.url)) continue;
      if (!have.has(x.url)) { await api('filtering/add_url', { name: String(x.name || x.url).slice(0, 80), url: x.url, whitelist: false }); n++; }
      if (have.has(x.url) ? have.get(x.url).enabled !== !!x.enabled : !x.enabled) { await api('filtering/set_url', { url: x.url, whitelist: false, data: { name: String(x.name || x.url).slice(0, 80), url: x.url, enabled: !!x.enabled } }); n++; }
    }
    if (d.dns && Array.isArray(d.dns.upstream_dns)) { await api('dns_config', { upstream_dns: d.dns.upstream_dns, bootstrap_dns: d.dns.bootstrap_dns || [], dnssec_enabled: !!d.dns.dnssec_enabled }); n++; }
    if (d.log && cfg.log) { await api('querylog/config/update', { ...cfg.log, interval: Number(d.log.interval) || cfg.log.interval, anonymize_client_ip: !!d.log.anonymize_client_ip }, 'PUT'); n++; }
    for (const [key, r] of Object.entries(d.kids || {})) { await svc('kids', { key, name: r.name, mode: r.mode, days: r.days, from: r.from, to: r.to }); n++; }
    if (d.device) { await svc('settings', d.device); n++; }
    say('exNote', 'ok', t('ex.done', n));
  } catch (err) { say('exNote', 'bad', t('fl.fail', err.message)); }
  loadSettings();
});

// ---- network and updates -------------------------------------------------------------
const sys = { d: null, busy: false };
function renderSystem() {
  const d = sys.d; if (!d) return;
  const n = d.net || {}, u = d.updates || {};
  const row = (k, v) => { const r = el('div', 'item'); const m = el('div', 'main'); m.append(el('b', '', k)); r.append(m, el('div', 'side', v)); return r; };
  $('nwBadge').textContent = n.hostname || '';
  $('nwInfo').replaceChildren(row(t('nw.fixed'), (n.fixed || []).map((a) => a.split('/')[0]).join(', ') || '-'), row(t('nw.dhcp'), (n.dhcp || []).join(', ') || '-'), row(t('nw.open'), (n.hostname || '') + '.local'));
  if (document.activeElement !== $('nwName')) $('nwName').value = n.hostname || '';
  const pending = u.pending || [];
  $('upBadge').textContent = u.running ? '…' : t('up.badge', pending.length); $('upBadge').className = 'badge' + (pending.length ? ' no' : '');
  $('upText').textContent = u.running ? t('up.running') : pending.length ? t('up.some', pending.length) : t('up.none');
  $('upList').replaceChildren(...pending.slice(0, 12).map((p) => row(p, '')), ...((u.held || []).length ? [row(t('up.held'), (u.held || []).length + '')] : []));
  $('upChecked').textContent = t('up.checked', u.checked ? new Date(u.checked * 1000).toLocaleString(lang === 'de' ? 'de-DE' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '');
  $('upRun').disabled = !pending.length || u.running || sys.busy; $('upCheck').disabled = !!u.running || sys.busy;
  setSwitch($('upAuto'), !!u.auto); $('upAuto').disabled = sys.busy;
  renderApp();
}
const when = (s) => new Date(s * 1000).toLocaleString(lang === 'de' ? 'de-DE' : 'en-US', { dateStyle: 'medium', timeStyle: 'short' });
function renderApp() {
  const a = (sys.d && sys.d.app) || {}, l = a.latest || {}, last = a.last || {};
  if (sys.appFrom === undefined && !a.error) sys.appFrom = a.version || null;
  // the service restarts during an update: once it reports a newer version, load the new interface
  if (sys.appWatch && !a.running && a.version && a.version !== sys.appFrom) { say('apNote', 'ok', t('ap.done', a.version)); setTimeout(() => location.reload(), 1500); }
  $('upBadge').textContent = a.running || (sys.d.updates || {}).running ? '…' : a.available ? t('ap.badge', true) : t('up.badge', ((sys.d.updates || {}).pending || []).length);
  if (a.available) $('upBadge').className = 'badge no';
  $('apVersion').textContent = t('ap.version', a.version);
  $('apChecked').textContent = a.checked ? t('ap.checked', when(a.checked)) : t('ap.never');
  $('apText').textContent = a.running ? t('ap.running') : last.result === 'failed' && !a.available ? '' : a.available ? t('ap.available', l.version) : a.checked ? t('ap.none') : '';
  if (!a.running && last.done && last.done > (sys.appSeen || 0)) {
    if (last.result === 'failed') say('apNote', 'bad', t('ap.failed', last.error || '?'));
    else if (last.result === 'rolled-back') say('apNote', 'bad', t('ap.rolledBack'));
  }
  $('apRun').textContent = t('ap.run', l.version || ''); $('apRun').hidden = !a.available;   // nothing to install: no button that looks like one
  $('apRun').disabled = !a.available || a.running || sys.busy; $('apCheck').disabled = !!a.running || sys.busy;
  setSwitch($('apAuto'), !!a.auto); $('apAuto').disabled = sys.busy;
  clearTimeout(sys.appTimer);
  if (a.running || sys.appWatch) sys.appTimer = setTimeout(async () => { try { sys.d = await svc('system'); } catch { /* restarting */ } renderSystem(); }, 3000);
}
async function sysCall(path, body, noteId, okKey) {
  if (sys.busy) return;
  sys.busy = true; renderSystem();
  try {
    const r = await fetch('/api/system/' + path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) });
    if (r.status === 401) { gate('login'); throw new Error('login'); }
    const d = await r.json();
    if (!r.ok) throw new Error(d.error === 'name' ? t('nw.badName') : d.error || ('HTTP ' + r.status));
    say(noteId, 'ok', t(okKey));
  } catch (e) { say(noteId, 'bad', t('fl.fail', e.message)); }
  sys.busy = false;
  try { sys.d = await svc('system'); } catch { /* keep the old view */ }
  renderSystem();
}
$('nwForm').addEventListener('submit', (e) => { e.preventDefault(); sysCall('hostname', { name: $('nwName').value.trim().toLowerCase() }, 'nwNote', 'st.saved'); });
$('upCheck').addEventListener('click', () => { say('upNote', '', t('up.checking')); sysCall('updates/check', {}, 'upNote', 'st.saved'); });
$('upRun').addEventListener('click', () => sysCall('updates/run', {}, 'upNote', 'up.started'));
$('upAuto').addEventListener('click', () => sys.d && sysCall('updates/auto', { on: !sys.d.updates.auto }, 'upNote', 'st.saved'));
$('apCheck').addEventListener('click', () => { say('apNote', '', t('up.checking')); sysCall('app/check', {}, 'apNote', 'st.saved'); });
$('apRun').addEventListener('click', () => { sys.appWatch = true; sys.appSeen = Date.now() / 1000; sysCall('app/run', {}, 'apNote', 'ap.started'); });
$('apAuto').addEventListener('click', () => sys.d && sysCall('app/auto', { on: !(sys.d.app || {}).auto }, 'apNote', 'st.saved'));

async function loadSettings() {
  svc('system').then((d) => { sys.d = d; renderSystem(); }).catch(() => { /* shown by the status dot */ });
  try { dev.s = await svc('settings'); } catch { /* shown by the status dot */ }
  renderDevice();
  try { kids.rules = (await svc('kids')).rules || {}; } catch { /* shown by the status dot */ }
  renderKids();
  try { [cfg.dns, cfg.log] = await Promise.all([api('dns_info'), api('querylog/config')]); } catch { /* the status dot tells */ }
  renderSettings();
}
$('dnssec').addEventListener('click', async () => {
  if (!cfg.dns) return;
  try { await api('dns_config', { dnssec_enabled: !cfg.dns.dnssec_enabled }); say('dnsNote', 'ok', t('st.saved')); } catch (e) { say('dnsNote', 'bad', t('fl.fail', e.message)); }
  loadSettings();
});
async function saveLog(change) {
  if (!cfg.log) return;
  try { await api('querylog/config/update', { ...cfg.log, ...change }, 'PUT'); say('privacyNote', 'ok', t('st.saved')); } catch (e) { say('privacyNote', 'bad', t('fl.fail', e.message)); }
  loadSettings();
}
$('keepLog').addEventListener('change', (e) => saveLog({ interval: Number(e.target.value) }));
$('anon').addEventListener('click', () => saveLog({ anonymize_client_ip: !(cfg.log && cfg.log.anonymize_client_ip) }));
$('wipe').addEventListener('click', async () => {
  if (!confirm(t('st.wipeAsk'))) return;
  try { await api('querylog_clear', {}); await api('stats_reset', {}); state.last = null; say('privacyNote', 'ok', t('st.wiped')); } catch (e) { say('privacyNote', 'bad', t('fl.fail', e.message)); }
});
$('pwForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const r = await post('/auth/password', { old: $('pwOld').value, new: $('pwNew').value });
  if (r.ok) { $('pwOld').value = ''; $('pwNew').value = ''; say('pwNote', 'ok', t('st.pwOk')); }
  else say('pwNote', 'bad', t('gate.' + ({ short: 'short', wrong: 'wrong', wait: 'wait' }[r.error] || 'down')));
});
$('logout').addEventListener('click', async () => { await post('/auth/logout'); gate('login'); });

// ---- start -----------------------------------------------------------------
applyLang();
(async () => {
  try {
    const r = await fetch('/auth/state'); const a = await r.json();
    if (!a.configured) gate('setup'); else if (!a.authenticated) gate('login'); else enter();
  } catch { gate('login'); say('gateNote', 'bad', t('gate.down')); }
})();
