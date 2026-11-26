#!/usr/bin/env node
// Copies the device interface (../web) into public/demo/app/ and turns it into the
// website's live demo: every request it makes is answered in the browser by
// demo-mock.js (a port of ../scripts/demo.py) with invented data.
//
//   npm run demo:sync
//
// ../web is only read, never changed. The copy is changed so that it works under
// the site's Content-Security-Policy (no inline script) and carries a visible
// "Demo · invented data" banner. public/demo/ is generated and not committed.

import { execFileSync } from 'node:child_process';
import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const site = resolve(here, '..');
const repo = resolve(site, '..');
const src = resolve(repo, 'web');
const dest = resolve(site, 'public', 'demo', 'app');
const own = resolve(here, 'demo');

const ALLOWED = new Set(['.html', '.js', '.css', '.json', '.svg', '.png', '.webp', '.ico', '.woff2']);
const MAX_BYTES = 8 * 1024 * 1024;

function fail(msg) {
  console.error(`demo:sync: ${msg}`);
  process.exit(1);
}

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isSymbolicLink()) fail(`symbolic link in web/: ${relative(src, p)}`);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

try {
  await stat(join(src, 'index.html'));
} catch {
  fail(`no device interface at ${src}`);
}

const files = await walk(src);
let total = 0;
for (const f of files) {
  if (!ALLOWED.has(extname(f).toLowerCase())) fail(`unexpected file type in web/: ${relative(src, f)}`);
  total += (await stat(f)).size;
}
if (total > MAX_BYTES) fail(`web/ is larger than ${MAX_BYTES} bytes`);

await rm(dest, { recursive: true, force: true });
await mkdir(dest, { recursive: true });
await cp(src, dest, {
  recursive: true,
  filter: (p) => p === src || ALLOWED.has(extname(p).toLowerCase()) || !extname(p),
});

// ---- index.html: no inline script, mock first, banner ---------------------------------
let html = await readFile(join(dest, 'index.html'), 'utf8');

const inline = [...html.matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/gi)];
if (inline.length !== 1) fail(`expected exactly one inline <script> in web/index.html, found ${inline.length}`);
const [whole, body] = inline[0];
await writeFile(
  join(dest, 'boot.js'),
  `// Moved out of index.html by the website's demo:sync so the page runs under a strict Content-Security-Policy.\n${body.trim()}\n`,
);
html = html.replace(
  whole,
  '<script src="demo-mock.js"></script>\n<script src="boot.js"></script>\n<link rel="stylesheet" href="demo.css">',
);

if (/\son[a-z]+\s*=/i.test(html)) fail('web/index.html has an inline event handler (on...=); the CSP would block it');
if (/\sstyle\s*=/i.test(html)) fail('web/index.html has an inline style attribute; the CSP would block it');

html = html
  .replace(/<title>[^<]*<\/title>/, '<title>NetSluice · Demo</title>\n<meta name="robots" content="noindex">')
  // the one outside link opens in a new tab instead of inside the demo frame
  .replace(/<a href="(https:\/\/[^"]+)" rel="noopener">/g, '<a href="$1" target="_blank" rel="noopener noreferrer">')
  .replace(
    /<body>/,
    `<body>
<div class="demo-banner" id="demoBanner" role="note">
  <span class="demo-text">Demo · invented data — nothing here is a real network</span>
  <a class="demo-back" href="/en/demo/" target="_top">Back to the website</a>
  <span class="demo-toast" id="demoToast" role="status" hidden></span>
</div>`,
  );
if (!html.includes('id="demoBanner"')) fail('could not place the demo banner');
await writeFile(join(dest, 'index.html'), html);

// ---- the website's own demo files ---------------------------------------------------
let version = 'unknown';
let commit = 'unknown';
try {
  version = (await readFile(join(repo, 'VERSION'), 'utf8')).trim();
} catch {
  /* keep unknown */
}
try {
  commit = execFileSync('git', ['-C', repo, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
} catch {
  /* not a git checkout */
}
// the mock reports the product's real VERSION as installed (only digits and dots get through)
const safeVersion = /^\d+(\.\d+){1,3}$/.test(version) ? version : '0.0.0';
await writeFile(
  join(dest, 'demo-mock.js'),
  (await readFile(join(own, 'demo-mock.js'), 'utf8')).replaceAll('__NETSLUICE_VERSION__', safeVersion),
);
await cp(join(own, 'demo.css'), join(dest, 'demo.css'));
await writeFile(
  join(dest, 'demo-source.json'),
  JSON.stringify({ product: 'NetSluice', version, commit, data: 'invented' }, null, 2) + '\n',
);

console.log(`demo:sync: web/ (NetSluice ${version}, ${commit}) → ${relative(site, dest)}/ (${files.length} files)`);
