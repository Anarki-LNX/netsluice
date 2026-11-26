// Facts every part of the site shares. Change a link here, not in a page.
// Only URLs that really exist belong here (checked 2026-11-26).

export const SITE_URL = 'https://netsluice.loopout.tech';

export const REPO = {
  owner: 'Anarki-LNX',
  name: 'netsluice',
  url: 'https://github.com/Anarki-LNX/netsluice',
  issues: 'https://github.com/Anarki-LNX/netsluice/issues',
  newIssue: 'https://github.com/Anarki-LNX/netsluice/issues/new',
  releases: 'https://github.com/Anarki-LNX/netsluice/releases',
  pulls: 'https://github.com/Anarki-LNX/netsluice/pulls',
  license: 'https://github.com/Anarki-LNX/netsluice/blob/main/LICENSE',
  thirdParty: 'https://github.com/Anarki-LNX/netsluice/blob/main/THIRD-PARTY.md',
  hardwareDoc: 'https://github.com/Anarki-LNX/netsluice/blob/main/docs/hardware.md',
  developmentDoc: 'https://github.com/Anarki-LNX/netsluice/blob/main/docs/development.md',
  // GitHub Discussions are switched off for this repository: do not link them.
} as const;

/** The only way to support the project with money. A plain link, no PayPal script on this site. */
export const DONATE_URL = 'https://www.paypal.me/HenryMeinekat';

/** Public contact of LOOP OUT TECH, as listed on https://loopout.tech/impressum. */
export const CONTACT_EMAIL = 'hallo@loopout.tech';

export const LOOPOUT = {
  home: 'https://loopout.tech',
  project: 'https://loopout.tech/projekte/netsluice',
  imprint: 'https://loopout.tech/impressum',
  privacy: 'https://loopout.tech/datenschutz',
} as const;

/** Where the device's own interface lives: inside the visitor's home network only. Never linked as a live link. */
export const LOCAL_UI = 'http://netsluice.local/';

/** The one board revision NetSluice was developed and tested on. */
export const TESTED_BOARD = 'mini_v21_20210521';
