#!/usr/bin/env node
// Security check of the built site (dist/), run after `npm run build`:
//
//   npm run check:security            (or: node scripts/check-security.mjs [dist-dir])
//
// Fails (exit 1) when the output would break the Content-Security-Policy in
// deploy/caddy/netsluice.loopout.tech.caddy or the site's rules: inline scripts
// or styles, event-handler attributes, resources from other origins, http://
// resources, requests to private addresses or netsluice.local, things that look
// like secrets, unsafe set:html, target="_blank" without rel="noopener", forms
// outside the demo, and the forbidden product name.

import { readFile, readdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const site = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(process.argv[2] || join(site, 'dist'));

/** sha256 hashes ('sha256-…') of inline scripts/styles that are allowed. Keep empty: the CSP has none. */
const ALLOWED_INLINE_HASHES = new Set([]);
/** Inline <script> types that are data, not code (CSP script-src does not apply to them). */
const DATA_SCRIPT_TYPES = new Set(['application/ld+json', 'application/json']);
const TEXT_EXT = new Set([
  '.html',
  '.htm',
  '.js',
  '.mjs',
  '.css',
  '.json',
  '.xml',
  '.txt',
  '.svg',
  '.webmanifest',
  '.map',
]);
const DEMO_PREFIX = 'demo/app/';
/**
 * Reviewed set:html uses besides renderNotes() and JSON-LD: "<file>|<expression>" → why it is safe.
 * Add an entry only after reading the code: the value must be a constant of the site, never input.
 */
const REVIEWED_SET_HTML = new Map([
  [
    'src/components/Icon.astro|paths[name]',
    'SVG path markup from a constant table in the same file; name is a typed IconName',
  ],
]);

const PRIVATE_URL =
  /\b(?:https?|wss?):\/\/(?:localhost|127(?:\.\d{1,3}){3}|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2}|169\.254(?:\.\d{1,3}){2}|\[(?:::1|f[cd][0-9a-f]{2}:[^\]]*|fe80:[^\]]*)\]|[a-z0-9-]+\.local|[a-z0-9-]+\.lan|[a-z0-9-]+\.home\.arpa)\b/gi;
const SECRETS = [
  ['GitHub token', /\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{60,})\b/g],
  ['AWS access key', /\bAKIA[0-9A-Z]{16}\b/g],
  ['private key', /-----BEGIN [A-Z ]*PRIVATE KEY-----/g],
  ['Slack token', /\bxox[abprs]-[A-Za-z0-9-]{10,}/g],
  ['Google API key', /\bAIza[0-9A-Za-z_-]{35}\b/g],
  ['OpenAI/Anthropic-style key', /\bsk-(?:ant-)?[A-Za-z0-9_-]{32,}\b/g],
  ['JSON web token', /\beyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g],
  [
    'credential assignment',
    /["']?(?:api[_-]?key|client[_-]?secret|access[_-]?token|auth[_-]?token|password|passwd)["']?\s*[:=]\s*["'][^"'\s]{16,}["']/gi,
  ],
];

const failures = [];
const warnings = [];
const fail = (file, line, msg) => failures.push(`${file}${line ? `:${line}` : ''}  ${msg}`);
const warn = (file, line, msg) => warnings.push(`${file}${line ? `:${line}` : ''}  ${msg}`);
const lineOf = (text, index) => text.slice(0, index).split('\n').length;

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

function attrs(src) {
  const map = new Map();
  for (const m of src.matchAll(/([^\s=/>"']+)(?:\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
    map.set(m[1].toLowerCase(), m[3] ?? m[4] ?? m[5] ?? '');
  }
  return map;
}

const isExternal = (url) => /^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(url.trim()) && !/^data:/i.test(url.trim());
const RESOURCE_ATTRS = {
  script: ['src'],
  img: ['src', 'srcset'],
  source: ['src', 'srcset'],
  iframe: ['src'],
  frame: ['src'],
  video: ['src', 'poster'],
  audio: ['src'],
  track: ['src'],
  embed: ['src'],
  object: ['data'],
  input: ['src'],
  image: ['href', 'xlink:href'],
  use: ['href', 'xlink:href'],
};
const RESOURCE_LINK_RELS = /\b(stylesheet|preload|modulepreload|prefetch|icon|apple-touch-icon|manifest|mask-icon)\b/i;

function checkHtml(rel, text) {
  const inDemo = rel.startsWith(DEMO_PREFIX);
  // inline scripts and styles
  for (const m of text.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
    const a = attrs(m[1]);
    if (a.has('src')) continue;
    const type = (a.get('type') || '').toLowerCase();
    if (DATA_SCRIPT_TYPES.has(type)) {
      if (/<\/script|<!--/i.test(m[2]))
        fail(rel, lineOf(text, m.index), `${type} block contains "</script" or "<!--" (not escaped)`);
      continue;
    }
    const hash = `sha256-${createHash('sha256').update(m[2]).digest('base64')}`;
    if (!ALLOWED_INLINE_HASHES.has(hash))
      fail(rel, lineOf(text, m.index), `inline <script> (${hash}); move it to a file (CSP script-src 'self')`);
  }
  for (const m of text.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style\s*>/gi)) {
    const hash = `sha256-${createHash('sha256').update(m[1]).digest('base64')}`;
    if (!ALLOWED_INLINE_HASHES.has(hash))
      fail(
        rel,
        lineOf(text, m.index),
        `inline <style> (${hash}); CSP style-src 'self' blocks it (build.inlineStylesheets: 'never')`,
      );
  }
  // every tag and its attributes
  for (const m of text.matchAll(/<([a-zA-Z][\w:-]*)(\s[^>]*?)?\/?>/g)) {
    const tag = m[1].toLowerCase();
    const a = attrs(m[2] || '');
    const at = lineOf(text, m.index);
    for (const [name, value] of a) {
      if (/^on[a-z]+$/.test(name)) fail(rel, at, `event handler attribute ${name}= on <${tag}>`);
      if (name === 'style') fail(rel, at, `style= attribute on <${tag}>; CSP style-src 'self' blocks it`);
      if (
        /^\s*(?:javascript|vbscript|data:text\/html)/i.test(value) &&
        /^(href|src|action|formaction|xlink:href|data|srcdoc)$/.test(name)
      )
        fail(rel, at, `${name}="${value.slice(0, 40)}" on <${tag}>`);
      if (name === 'srcdoc') fail(rel, at, `srcdoc on <${tag}>`);
      for (const p of value.matchAll(PRIVATE_URL))
        fail(rel, at, `${name}= points into the home network / private range: ${p[0]}`);
    }
    if (tag === 'base') fail(rel, at, '<base> element (CSP base-uri none)');
    if (tag === 'form' && !inDemo) fail(rel, at, '<form> outside the demo (the site has no forms)');
    if (tag === 'meta' && /refresh/i.test(a.get('http-equiv') || '') && /url=/i.test(a.get('content') || ''))
      warn(rel, at, 'meta refresh redirect');
    // resources
    const resAttrs = RESOURCE_ATTRS[tag] || [];
    if (tag === 'link' && RESOURCE_LINK_RELS.test(a.get('rel') || '')) resAttrs.push('href');
    for (const name of resAttrs) {
      const v = a.get(name);
      if (!v) continue;
      for (const part of name === 'srcset' ? v.split(',').map((s) => s.trim().split(/\s+/)[0]) : [v]) {
        if (/^http:\/\//i.test(part)) fail(rel, at, `http:// resource on <${tag} ${name}>: ${part}`);
        else if (isExternal(part)) fail(rel, at, `resource from another origin on <${tag} ${name}>: ${part}`);
      }
    }
    if (tag === 'a' || tag === 'area') {
      const href = a.get('href') || '';
      if (/^http:\/\//i.test(href))
        fail(rel, at, `link with http:// (use https, or show the address as text): ${href}`);
      if ((a.get('target') || '').toLowerCase() === '_blank' && !/\bnoopener\b/i.test(a.get('rel') || ''))
        fail(rel, at, `target="_blank" without rel="noopener": ${href}`);
    }
  }
}

function checkCss(rel, text) {
  for (const m of text.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi)) {
    const u = m[2].trim();
    if (/^http:/i.test(u) || isExternal(u)) fail(rel, lineOf(text, m.index), `CSS url() from another origin: ${u}`);
  }
  for (const m of text.matchAll(/@import\s+(?:url\()?\s*['"]?([^'");\s]+)/gi)) {
    if (isExternal(m[1]) || /^http:/i.test(m[1]))
      fail(rel, lineOf(text, m.index), `CSS @import from another origin: ${m[1]}`);
  }
}

function checkJs(rel, text) {
  for (const m of text.matchAll(
    /\b(?:fetch|EventSource|WebSocket|importScripts|sendBeacon)\s*\(\s*[`'"]((?:https?|wss?):)?\/\/([^`'"/]+)/g,
  )) {
    fail(rel, lineOf(text, m.index), `request to another origin in code: ${m[0].slice(0, 80)}`);
  }
  if (/\beval\s*\(|\bnew\s+Function\s*\(/.test(text)) fail(rel, 0, 'eval() or new Function(): blocked by the CSP');
}

function checkAll(rel, text, isHtml) {
  // In pages, http://netsluice.local/ may be shown as text; only attributes (checked in checkHtml) count there.
  if (!isHtml)
    for (const m of text.matchAll(PRIVATE_URL))
      fail(rel, lineOf(text, m.index), `address in the home network / private range: ${m[0]}`);
  for (const [name, re] of SECRETS)
    for (const m of text.matchAll(re))
      if (name !== 'credential assignment' || /\d/.test(m[0].split(/[:=]/).pop()))
        fail(rel, lineOf(text, m.index), `looks like a secret (${name}): ${m[0].slice(0, 12)}…`);
  const token = process.env.GITHUB_TOKEN;
  if (token && token.length >= 8 && text.includes(token)) fail(rel, 0, 'contains the value of GITHUB_TOKEN');
  if (/jarvis/i.test(text)) fail(rel, lineOf(text, text.search(/jarvis/i)), 'contains a forbidden name');
}

// set:html is allowed only for renderNotes() output and for JSON-LD data blocks.
async function checkSources() {
  const src = join(site, 'src');
  let files = [];
  try {
    files = (await walk(src)).filter((f) => /\.(astro|tsx|jsx|mdx)$/.test(f));
  } catch {
    return;
  }
  for (const f of files) {
    const text = await readFile(f, 'utf8');
    for (const m of text.matchAll(/set:html\s*=\s*\{([^}]*)\}/g)) {
      const before = text.slice(Math.max(0, text.lastIndexOf('<', m.index)), m.index);
      const ok =
        /^\s*renderNotes\s*\(/.test(m[1]) ||
        /<script\b[^>]*type=["']application\/ld\+json["']/i.test(before) ||
        REVIEWED_SET_HTML.has(`${relative(site, f).split('\\').join('/')}|${m[1].trim()}`);
      if (!ok)
        fail(
          relative(site, f),
          lineOf(text, m.index),
          `set:html={${m[1].trim().slice(0, 40)}} — only renderNotes() output or JSON-LD may be set as HTML`,
        );
    }
    if (/\bis:inline\b/.test(text)) {
      for (const m of text.matchAll(/<(script|style)\b[^>]*\bis:inline\b[^>]*>/g)) {
        if (!/application\/ld\+json/.test(m[0]))
          fail(relative(site, f), lineOf(text, m.index), `<${m[1]} is:inline> becomes inline code; CSP blocks it`);
      }
    }
  }
}

try {
  await stat(join(dist, 'index.html'));
} catch {
  console.error(`check:security: no built site at ${dist} (run npm run build first)`);
  process.exit(2);
}

const all = await walk(dist);
let checked = 0;
for (const file of all) {
  const rel = relative(dist, file).split('\\').join('/');
  if (rel.split('/').some((p) => p.startsWith('.'))) fail(rel, 0, 'hidden file in the build output');
  const ext = extname(file).toLowerCase();
  if (ext === '.map') warn(rel, 0, 'source map in the build output');
  if (!TEXT_EXT.has(ext)) continue;
  const text = await readFile(file, 'utf8');
  checked++;
  if (ext === '.html' || ext === '.htm') checkHtml(rel, text);
  if (ext === '.css') checkCss(rel, text);
  if (ext === '.js' || ext === '.mjs') checkJs(rel, text);
  checkAll(rel, text, ext === '.html' || ext === '.htm');
}
await checkSources();

for (const w of warnings) console.warn(`warn  ${w}`);
for (const f of failures) console.error(`FAIL  ${f}`);
console.log(
  `check:security: ${checked} files checked in ${relative(site, dist) || dist}, ${failures.length} failure(s), ${warnings.length} warning(s)`,
);
process.exit(failures.length ? 1 : 0);
