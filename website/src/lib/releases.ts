// Release data for the download centre, read from GitHub at build time only.
//
// Visitors never talk to GitHub: the build asks once, validates the answer,
// keeps the last good answer on disk (.cache/releases.json) and falls back to
// it when GitHub cannot be reached. Nothing here runs in the browser.
//
// Environment (all optional):
//   GITHUB_TOKEN                 raises the API rate limit. Sent only to api.github.com, never logged.
//   NETSLUICE_RELEASES_OFFLINE=1 do not ask GitHub, use the cache only (offline builds, tests).
//   NETSLUICE_RELEASES_CACHE     path of the cache file (default: <cwd>/.cache/releases.json).

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { z } from 'zod';
import type { Release, ReleaseAsset, ReleaseData } from './release-types';

export const RELEASES_API = 'https://api.github.com/repos/Anarki-LNX/netsluice/releases?per_page=100';
/** Asset URLs must start with this; anything else is dropped. */
export const DOWNLOAD_PREFIX = 'https://github.com/Anarki-LNX/netsluice/releases/download/';
const RELEASE_PAGE_PREFIX = 'https://github.com/Anarki-LNX/netsluice/releases/';
const IMAGE_RE = /^netsluice-(.+)-deeper-connect-mini\.img\.xz$/;
const SEMVER_RE = /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;
const API_TIMEOUT_MS = 15_000;
const CHECKSUM_TIMEOUT_MS = 10_000;
const CHECKSUM_MAX_BYTES = 4096;
/** Hosts a checksum download may end up on after GitHub's redirect. */
const CHECKSUM_HOSTS = /^(github\.com|objects\.githubusercontent\.com|release-assets\.githubusercontent\.com)$/;
const CACHE_FORMAT = 1;

// ---------- what GitHub sends (only the fields we use) ----------

const ghAssetSchema = z.object({
  name: z.string().min(1).max(255),
  size: z.number().int().nonnegative(),
  browser_download_url: z.url(),
  content_type: z.string().max(255),
  state: z.string().optional(),
});

const ghReleaseSchema = z.object({
  tag_name: z.string().min(1).max(100),
  name: z.string().max(300).nullable(),
  draft: z.boolean(),
  prerelease: z.boolean(),
  published_at: z.iso.datetime({ offset: true }).nullable(),
  html_url: z.url(),
  body: z.string().max(200_000).nullable(),
  assets: z.array(z.unknown()),
});

// ---------- what we keep on disk (re-validated when read) ----------

const assetSchema = z.object({
  name: z.string().min(1),
  size: z.number().int().nonnegative(),
  url: z.string().startsWith(DOWNLOAD_PREFIX),
  contentType: z.string(),
});

const releaseSchema = z.object({
  tag: z.string(),
  version: z.string().regex(SEMVER_RE),
  name: z.string(),
  publishedAt: z.string(),
  prerelease: z.boolean(),
  htmlUrl: z.string().startsWith(RELEASE_PAGE_PREFIX),
  notes: z.string(),
  assets: z.array(assetSchema),
  image: assetSchema.optional(),
  checksumFile: assetSchema.optional(),
  sha256: z
    .string()
    .regex(/^[0-9a-f]{64}$/)
    .optional(),
  updateArchive: assetSchema.optional(),
});

const cacheSchema = z.object({
  format: z.literal(CACHE_FORMAT),
  fetchedAt: z.string(),
  releases: z.array(releaseSchema),
});

// ---------- helpers ----------

type Semver = [number, number, number, string | null];

export function parseSemver(tag: string): Semver | null {
  const m = SEMVER_RE.exec(tag);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3]), m[4] ?? null];
}

/** Negative when a < b. Pre-releases sort below the release of the same number. */
export function compareSemver(a: string, b: string): number {
  const x = parseSemver(a);
  const y = parseSemver(b);
  if (!x || !y) return x ? 1 : y ? -1 : 0;
  for (let i = 0; i < 3; i++) {
    const d = (x[i] as number) - (y[i] as number);
    if (d !== 0) return d;
  }
  const [pa, pb] = [x[3], y[3]];
  if (pa === pb) return 0;
  if (pa === null) return 1;
  if (pb === null) return -1;
  const sa = pa.split('.');
  const sb = pb.split('.');
  for (let i = 0; i < Math.max(sa.length, sb.length); i++) {
    const ia = sa[i];
    const ib = sb[i];
    if (ia === undefined) return -1;
    if (ib === undefined) return 1;
    const na = /^\d+$/.test(ia);
    const nb = /^\d+$/.test(ib);
    if (na && nb) {
      const d = Number(ia) - Number(ib);
      if (d !== 0) return d;
    } else if (na !== nb) {
      return na ? -1 : 1;
    } else if (ia !== ib) {
      return ia < ib ? -1 : 1;
    }
  }
  return 0;
}

/**
 * Reads a sha256sum line ("<64 hex>  <file>" or "<64 hex> *<file>").
 * Returns the digest only when the file name is exactly the expected one.
 */
export function parseChecksum(text: string, expectedName: string): string | undefined {
  const lines = text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length !== 1) return undefined;
  const m = /^([0-9a-fA-F]{64})\s+\*?(.+)$/.exec(lines[0] as string);
  if (!m || m[2] !== expectedName) return undefined;
  return (m[1] as string).toLowerCase();
}

function toAsset(raw: unknown): ReleaseAsset | null {
  const r = ghAssetSchema.safeParse(raw);
  if (!r.success) return null;
  const a = r.data;
  if (a.state !== undefined && a.state !== 'uploaded') return null;
  if (!a.browser_download_url.startsWith(DOWNLOAD_PREFIX)) return null;
  // the URL must stay inside the release download path (no "..", no other host tricks)
  let u: URL;
  try {
    u = new URL(a.browser_download_url);
  } catch {
    return null;
  }
  if (u.href !== a.browser_download_url || u.search || u.hash) return null;
  return { name: a.name, size: a.size, url: a.browser_download_url, contentType: a.content_type };
}

/** Maps one validated GitHub release to our shape. Returns null for drafts and anything unusable. */
export function normaliseRelease(raw: unknown): Release | null {
  const r = ghReleaseSchema.safeParse(raw);
  if (!r.success) return null;
  const g = r.data;
  if (g.draft || !g.published_at) return null;
  if (!parseSemver(g.tag_name)) return null;
  if (!g.html_url.startsWith(RELEASE_PAGE_PREFIX)) return null;
  const version = g.tag_name.replace(/^v/, '');
  const assets = g.assets.map(toAsset).filter((a): a is ReleaseAsset => a !== null);
  const release: Release = {
    tag: g.tag_name,
    version,
    name: (g.name ?? '').trim() || g.tag_name,
    publishedAt: new Date(g.published_at).toISOString(),
    prerelease: g.prerelease,
    htmlUrl: g.html_url,
    notes: g.body ?? '',
    assets,
  };
  const image = assets.find((a) => IMAGE_RE.exec(a.name)?.[1] === version);
  if (image) {
    release.image = image;
    const sum = assets.find((a) => a.name === image.name + '.sha256');
    if (sum) release.checksumFile = sum;
  }
  const archive = assets.find((a) => a.name === `netsluice-${version}.tar.gz`);
  if (archive) release.updateArchive = archive;
  return release;
}

function withPointers(base: Omit<ReleaseData, 'latest' | 'latestImage'>): ReleaseData {
  const data: ReleaseData = { ...base };
  const latest = base.releases[0];
  const latestImage = base.releases.find((r) => r.image);
  if (latest) data.latest = latest;
  if (latestImage) data.latestImage = latestImage;
  return data;
}

// ---------- network ----------

export interface LoadOptions {
  fetch?: typeof globalThis.fetch;
  env?: Record<string, string | undefined>;
  cachePath?: string;
  now?: () => Date;
  /** set false in tests that must not touch the disk */
  writeCache?: boolean;
}

class SourceError extends Error {}

async function readCapped(res: Response, max: number): Promise<string> {
  const declared = Number(res.headers.get('content-length') ?? '0');
  if (declared > max) throw new SourceError('checksum file too large');
  if (!res.body) return '';
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > max) {
      await reader.cancel();
      throw new SourceError('checksum file too large');
    }
    chunks.push(value);
  }
  const all = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) {
    all.set(c, off);
    off += c.byteLength;
  }
  return new TextDecoder('utf-8', { fatal: false }).decode(all);
}

async function fetchChecksum(f: typeof globalThis.fetch, release: Release): Promise<void> {
  const file = release.checksumFile;
  const image = release.image;
  if (!file || !image) return;
  try {
    // no token here: the files are public, and the redirect leaves api/github.com
    const res = await f(file.url, {
      redirect: 'follow',
      headers: { 'User-Agent': 'netsluice-website-build', Accept: 'application/octet-stream' },
      signal: AbortSignal.timeout(CHECKSUM_TIMEOUT_MS),
    });
    if (!res.ok) return;
    if (res.url) {
      const host = new URL(res.url).hostname;
      if (!CHECKSUM_HOSTS.test(host) || !res.url.startsWith('https:')) return;
    }
    const digest = parseChecksum(await readCapped(res, CHECKSUM_MAX_BYTES), image.name);
    if (digest) release.sha256 = digest;
  } catch {
    // no digest shown; the page links the .sha256 file instead
  }
}

function rateLimitMessage(res: Response): string | null {
  if (res.status !== 403 && res.status !== 429) return null;
  const remaining = res.headers.get('x-ratelimit-remaining');
  const retryAfter = res.headers.get('retry-after');
  const reset = Number(res.headers.get('x-ratelimit-reset') ?? '');
  if (remaining !== '0' && retryAfter === null && res.status !== 429) return null;
  if (Number.isFinite(reset) && reset > 0) {
    return `GitHub rate limit reached (resets ${new Date(reset * 1000).toISOString().slice(11, 16)} UTC)`;
  }
  if (retryAfter !== null && /^\d{1,6}$/.test(retryAfter))
    return `GitHub rate limit reached (retry after ${retryAfter} s)`;
  return 'GitHub rate limit reached';
}

async function fetchLive(f: typeof globalThis.fetch, env: Record<string, string | undefined>): Promise<Release[]> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'netsluice-website-build',
  };
  const token = env['GITHUB_TOKEN']?.trim();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  let res: Response;
  try {
    // one request, no retries: a failed build falls back to the cache instead of hammering the API
    res = await f(RELEASES_API, { headers, redirect: 'error', signal: AbortSignal.timeout(API_TIMEOUT_MS) });
  } catch (e) {
    const timeout = e instanceof Error && (e.name === 'TimeoutError' || e.name === 'AbortError');
    throw new SourceError(timeout ? 'GitHub did not answer in time' : 'GitHub could not be reached');
  }
  const limited = rateLimitMessage(res);
  if (limited) throw new SourceError(limited);
  if (!res.ok) throw new SourceError(`GitHub answered HTTP ${res.status}`);
  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new SourceError('GitHub sent something that is not JSON');
  }
  const list = z.array(z.unknown()).max(1000).safeParse(json);
  if (!list.success) throw new SourceError('GitHub sent an unexpected answer');
  const releases = list.data.map(normaliseRelease).filter((r): r is Release => r !== null);
  if (list.data.length > 0 && releases.length === 0) throw new SourceError('GitHub sent no usable release');
  releases.sort((a, b) => compareSemver(b.version, a.version) || b.publishedAt.localeCompare(a.publishedAt));
  await Promise.all(releases.map((r) => fetchChecksum(f, r)));
  return releases;
}

// ---------- cache ----------

export function defaultCachePath(env: Record<string, string | undefined> = process.env): string {
  return resolve(env['NETSLUICE_RELEASES_CACHE'] || resolve(process.cwd(), '.cache', 'releases.json'));
}

async function readCache(path: string): Promise<z.infer<typeof cacheSchema> | null> {
  try {
    const parsed = cacheSchema.safeParse(JSON.parse(await readFile(path, 'utf8')));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

async function writeCache(path: string, fetchedAt: string, releases: Release[]): Promise<void> {
  try {
    await mkdir(dirname(path), { recursive: true });
    const tmp = `${path}.${process.pid}.tmp`;
    await writeFile(tmp, JSON.stringify({ format: CACHE_FORMAT, fetchedAt, releases }, null, 2) + '\n', 'utf8');
    await rename(tmp, path);
  } catch {
    // a read-only checkout still builds; the next build asks GitHub again
  }
}

// ---------- public API ----------

/** One full load without memoisation. Exported for tests; pages use getReleaseData(). */
export async function loadReleaseData(opts: LoadOptions = {}): Promise<ReleaseData> {
  const env = opts.env ?? process.env;
  const f = opts.fetch ?? globalThis.fetch;
  const now = opts.now ?? (() => new Date());
  const cachePath = opts.cachePath ?? defaultCachePath(env);
  let error: string;
  if (env['NETSLUICE_RELEASES_OFFLINE'] === '1') {
    error = 'offline build: GitHub was not asked';
  } else {
    try {
      const releases = await fetchLive(f, env);
      const fetchedAt = now().toISOString();
      if (opts.writeCache !== false) await writeCache(cachePath, fetchedAt, releases);
      return withPointers({ fetchedAt, source: 'live', releases });
    } catch (e) {
      error = e instanceof SourceError ? e.message : 'release data could not be read';
    }
  }
  const cached = await readCache(cachePath);
  if (cached) {
    const releases = cached.releases as Release[];
    return withPointers({ fetchedAt: cached.fetchedAt, source: 'cache', error, releases });
  }
  return { fetchedAt: null, source: 'none', error, releases: [] };
}

const MEMO = Symbol.for('netsluice.releaseData');
type MemoHolder = { [MEMO]?: Promise<ReleaseData> };

/** Release data for this build. GitHub is asked at most once per build, however many pages call this. */
export function getReleaseData(): Promise<ReleaseData> {
  const g = globalThis as MemoHolder;
  g[MEMO] ??= loadReleaseData().then(async (data) => {
    await writeStatus(data);
    return data;
  });
  return g[MEMO];
}

/**
 * Leaves a short note next to the cache saying where this build's release data came from.
 * scripts/write-build-info.mjs puts it into dist/build.json (the health check), and CI
 * refuses to publish a site that has no release data at all.
 */
async function writeStatus(d: ReleaseData): Promise<void> {
  const path = resolve(dirname(defaultCachePath()), 'release-status.json');
  const status = {
    source: d.source,
    fetchedAt: d.fetchedAt,
    ...(d.error ? { error: d.error } : {}),
    releases: d.releases.length,
    latest: d.latest?.version ?? null,
    latestImage: d.latestImage?.version ?? null,
  };
  try {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, JSON.stringify(status, null, 2) + '\n', 'utf8');
  } catch {
    // informational only
  }
}

/** Tests only: forget the memoised answer. */
export function resetReleaseDataMemo(): void {
  delete (globalThis as MemoHolder)[MEMO];
}

// ---------- formatting ----------

/** Sizes the way GitHub and the device interface show them (1 MB = 1024 × 1024 bytes). */
export function formatBytes(n: number, locale: 'en' | 'de'): string {
  if (!Number.isFinite(n) || n < 0) return '–';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  const digits = i === 0 || v >= 100 ? 0 : 1;
  const num = new Intl.NumberFormat(locale === 'de' ? 'de-DE' : 'en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  }).format(v);
  return `${num} ${units[i]}`;
}

// ---------- safe Markdown for release notes ----------

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ESC[c] as string);
}

const MAX_NOTES = 50_000;
// Placeholders use characters that are removed from the input first, so a note cannot forge one.
const PH_OPEN = '\u0001';
const PH_CLOSE = '\u0002';

function inline(src: string): string {
  const held: string[] = [];
  const hold = (html: string) => `${PH_OPEN}${held.push(html) - 1}${PH_CLOSE}`;

  // 1. code spans: their content is escaped and left alone
  let s = src.replace(/`([^`\n]+)`/g, (_m, code: string) => hold(`<code>${escapeHtml(code)}</code>`));
  // 2. everything else is escaped before any markup is added
  s = escapeHtml(s);
  // 3. links, https only; the text may carry emphasis, the URL is rebuilt from a parsed URL
  s = s.replace(/\[([^\]\n]{1,300})\]\(([^()\s]{1,2000})\)/g, (m, text: string, rawUrl: string) => {
    const url = rawUrl.replace(/&amp;/g, '&');
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return m;
    }
    if (parsed.protocol !== 'https:' || /[\u0000-\u001f]/.test(url) || url.includes('"') || url.includes('<')) return m;
    return hold(`<a href="${escapeHtml(parsed.href)}" rel="noopener noreferrer nofollow">${emphasis(text)}</a>`);
  });
  s = emphasis(s);
  // 4. put the held pieces back. A link may hold a code span, so restore until none is left;
  //    a held piece only ever refers to pieces held before it, so this ends.
  const ph = new RegExp(`${PH_OPEN}(\\d+)${PH_CLOSE}`, 'g');
  for (let depth = 0; depth < 4 && s.includes(PH_OPEN); depth++)
    s = s.replace(ph, (_m, i: string) => held[Number(i)] ?? '');
  return s.replace(/[\u0001\u0002]/g, '');
}

function emphasis(s: string): string {
  return s
    .replace(/\*\*(?=\S)([^*\n]*?\S)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^\w])__(?=\S)([^_\n]*?\S)__(?!\w)/g, '$1<strong>$2</strong>')
    .replace(/(^|[^*\w])\*(?=[^\s*])([^*\n]*?[^\s*])?\*(?!\*)/g, (m: string, pre: string, body?: string) =>
      body === undefined ? m : `${pre}<em>${body}</em>`,
    )
    .replace(/(^|[^\w])_(?=[^\s_])([^_\n]*?[^\s_])_(?!\w)/g, '$1<em>$2</em>');
}

/**
 * Renders untrusted release notes (Markdown) to safe HTML.
 * All input is escaped first; only these tags are ever produced: p, ul, ol, li,
 * h4, h5, pre, code, strong, em and a (https only, rel="noopener noreferrer nofollow").
 */
export function renderNotes(markdown: string): string {
  const text = String(markdown ?? '')
    .slice(0, MAX_NOTES)
    .replace(/\r\n?/g, '\n')
    // control characters (incl. the placeholder marks) never reach the output
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '');
  const lines = text.split('\n');
  const out: string[] = [];
  let para: string[] = [];
  let list: { kind: 'ul' | 'ol'; items: string[] } | null = null;

  const flushPara = () => {
    if (para.length) out.push(`<p>${inline(para.join(' '))}</p>`);
    para = [];
  };
  const flushList = () => {
    if (list) out.push(`<${list.kind}>${list.items.map((i) => `<li>${inline(i)}</li>`).join('')}</${list.kind}>`);
    list = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] as string;
    const fence = /^\s{0,3}(`{3,}|~{3,})/.exec(line);
    if (fence) {
      flushPara();
      flushList();
      const marker = fence[1] as string;
      const body: string[] = [];
      i++;
      while (i < lines.length && !(lines[i] as string).trimStart().startsWith(marker)) body.push(lines[i++] as string);
      out.push(`<pre><code>${escapeHtml(body.join('\n'))}</code></pre>`);
      continue;
    }
    if (!line.trim()) {
      flushPara();
      flushList();
      continue;
    }
    const heading = /^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line);
    if (heading) {
      flushPara();
      flushList();
      const tag = (heading[1] as string).length <= 2 ? 'h4' : 'h5';
      out.push(`<${tag}>${inline(heading[2] as string)}</${tag}>`);
      continue;
    }
    const ul = /^\s*[-*+]\s+(.*)$/.exec(line);
    const ol = ul ? null : /^\s*\d{1,9}[.)]\s+(.*)$/.exec(line);
    if (ul || ol) {
      flushPara();
      const kind = ul ? 'ul' : 'ol';
      if (list && list.kind !== kind) flushList();
      list ??= { kind, items: [] };
      list.items.push(((ul ?? ol) as RegExpExecArray)[1] as string);
      continue;
    }
    if (list && /^\s+\S/.test(line)) {
      // an indented line continues the last list item
      const items: string[] = list.items;
      items[items.length - 1] += ' ' + line.trim();
      continue;
    }
    flushList();
    para.push(line.trim());
  }
  flushPara();
  flushList();
  return out.join('\n');
}
