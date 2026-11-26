import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  compareSemver,
  formatBytes,
  loadReleaseData,
  normaliseRelease,
  parseChecksum,
  renderNotes,
  RELEASES_API,
} from '../src/lib/releases';

const DL = 'https://github.com/Anarki-LNX/netsluice/releases/download';
const PAGE = 'https://github.com/Anarki-LNX/netsluice/releases/tag';
const DIGEST = 'ffc2b72447ef7e6cd8f5fec2e52538bd98f35aec7daafeb35a8f9d076f83c420';

function asset(tag: string, name: string, size = 100) {
  return {
    name,
    size,
    content_type: 'application/octet-stream',
    state: 'uploaded',
    browser_download_url: `${DL}/${tag}/${name}`,
  };
}

function rel(
  v: string,
  opts: { image?: boolean; draft?: boolean; prerelease?: boolean; date?: string; body?: string } = {},
) {
  const tag = `v${v}`;
  const img = `netsluice-${v}-deeper-connect-mini.img.xz`;
  return {
    tag_name: tag,
    name: `NetSluice ${v}`,
    draft: opts.draft ?? false,
    prerelease: opts.prerelease ?? false,
    published_at: opts.date ?? '2026-11-21T07:27:08Z',
    html_url: `${PAGE}/${tag}`,
    body: opts.body ?? 'Notes',
    assets: [
      ...(opts.image ? [asset(tag, img, 427963112), asset(tag, img + '.sha256', 110)] : []),
      asset(tag, `netsluice-${v}.tar.gz`, 142451),
    ],
  };
}

function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });
}

/** fetch mock: the API answer, and checksum files from a map url → text */
function mockFetch(api: () => Response, sums: Record<string, string> = {}) {
  return vi.fn(async (input: string | URL | Request, _init?: RequestInit) => {
    const url = String(input);
    if (url === RELEASES_API) return api();
    if (url in sums) return new Response(sums[url], { status: 200 });
    return new Response('not found', { status: 404 });
  }) as unknown as typeof fetch & ReturnType<typeof vi.fn>;
}

let dir: string;
let n = 0;
const cacheFile = () => join(dir, `releases-${++n}.json`);

beforeAll(async () => {
  await mkdir(join(process.cwd(), '.cache'), { recursive: true });
  dir = await mkdtemp(join(process.cwd(), '.cache', 'test-'));
});
afterAll(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('schema and mapping', () => {
  it('drops drafts, invalid entries and non-semver tags', () => {
    expect(normaliseRelease(rel('0.1.0', { draft: true }))).toBeNull();
    expect(normaliseRelease({ ...rel('0.1.0'), tag_name: 'nightly' })).toBeNull();
    expect(normaliseRelease({ ...rel('0.1.0'), assets: 'nope' })).toBeNull();
    expect(normaliseRelease({ ...rel('0.1.0'), published_at: 'yesterday' })).toBeNull();
    expect(normaliseRelease({ ...rel('0.1.0'), html_url: 'https://evil.example/releases/x' })).toBeNull();
    expect(normaliseRelease(null)).toBeNull();
  });

  it('maps image, checksum file and update archive', () => {
    const r = normaliseRelease(rel('0.1.28', { image: true }));
    expect(r).not.toBeNull();
    expect(r!.version).toBe('0.1.28');
    expect(r!.image?.name).toBe('netsluice-0.1.28-deeper-connect-mini.img.xz');
    expect(r!.image?.size).toBe(427963112);
    expect(r!.checksumFile?.name).toBe('netsluice-0.1.28-deeper-connect-mini.img.xz.sha256');
    expect(r!.updateArchive?.name).toBe('netsluice-0.1.28.tar.gz');
    expect(r!.sha256).toBeUndefined();
  });

  it('only accepts asset URLs from the project release downloads', () => {
    const raw = rel('0.1.28', { image: true });
    raw.assets[0] = {
      ...raw.assets[0]!,
      browser_download_url: 'https://evil.example/netsluice-0.1.28-deeper-connect-mini.img.xz',
    };
    raw.assets[2] = { ...raw.assets[2]!, browser_download_url: `${DL}/v0.1.28/../../../x/netsluice-0.1.28.tar.gz` };
    const r = normaliseRelease(raw)!;
    expect(r.image).toBeUndefined();
    expect(r.checksumFile).toBeUndefined();
    expect(r.updateArchive).toBeUndefined();
    expect(r.assets.map((a) => a.name)).toEqual(['netsluice-0.1.28-deeper-connect-mini.img.xz.sha256']);
  });

  it('ignores an image whose file name carries another version', () => {
    const raw = rel('0.1.28');
    raw.assets.push(asset('v0.1.28', 'netsluice-0.1.27-deeper-connect-mini.img.xz'));
    expect(normaliseRelease(raw)!.image).toBeUndefined();
  });

  it('sorts by version number, pre-releases below their release', () => {
    const v = ['0.1.9', '0.1.10', '0.2.0-rc.1', '0.2.0', '0.1.10-beta'];
    expect([...v].sort((a, b) => compareSemver(b, a))).toEqual([
      '0.2.0',
      '0.2.0-rc.1',
      '0.1.10',
      '0.1.10-beta',
      '0.1.9',
    ]);
  });
});

describe('checksum parsing', () => {
  const name = 'netsluice-0.1.28-deeper-connect-mini.img.xz';
  it('reads sha256sum output', () => {
    expect(parseChecksum(`${DIGEST}  ${name}\n`, name)).toBe(DIGEST);
    expect(parseChecksum(`${DIGEST} *${name}`, name)).toBe(DIGEST);
    expect(parseChecksum(`${DIGEST.toUpperCase()}  ${name}`, name)).toBe(DIGEST);
  });
  it('refuses a different file name, a short digest or extra lines', () => {
    expect(parseChecksum(`${DIGEST}  netsluice-0.1.27-deeper-connect-mini.img.xz`, name)).toBeUndefined();
    expect(parseChecksum(`${DIGEST.slice(1)}  ${name}`, name)).toBeUndefined();
    expect(parseChecksum(`${DIGEST}  ${name}\n${DIGEST}  other`, name)).toBeUndefined();
    expect(parseChecksum('<html>not a checksum</html>', name)).toBeUndefined();
    expect(parseChecksum(`${DIGEST}  dir/${name}`, name)).toBeUndefined();
  });
});

describe('loadReleaseData', () => {
  it('fetches, sorts, reads checksums and writes the cache', async () => {
    const sumUrl = `${DL}/v0.1.28/netsluice-0.1.28-deeper-connect-mini.img.xz.sha256`;
    const f = mockFetch(
      () =>
        json([
          rel('0.1.27'),
          rel('0.1.28', { image: true }),
          rel('0.1.5', { image: true }),
          rel('0.1.0', { draft: true }),
        ]),
      {
        [sumUrl]: `${DIGEST}  netsluice-0.1.28-deeper-connect-mini.img.xz\n`,
        // 0.1.5's checksum names the wrong file: no digest for it
        [`${DL}/v0.1.5/netsluice-0.1.5-deeper-connect-mini.img.xz.sha256`]: `${DIGEST}  netsluice-0.1.4-deeper-connect-mini.img.xz\n`,
      },
    );
    const path = cacheFile();
    const d = await loadReleaseData({
      fetch: f,
      env: {},
      cachePath: path,
      now: () => new Date('2026-11-26T10:00:00Z'),
    });
    expect(d.source).toBe('live');
    expect(d.error).toBeUndefined();
    expect(d.fetchedAt).toBe('2026-11-26T10:00:00.000Z');
    expect(d.releases.map((r) => r.version)).toEqual(['0.1.28', '0.1.27', '0.1.5']);
    expect(d.latest?.version).toBe('0.1.28');
    expect(d.latestImage?.version).toBe('0.1.28');
    expect(d.releases[0]!.sha256).toBe(DIGEST);
    expect(d.releases[2]!.sha256).toBeUndefined();
    const cached = JSON.parse(await readFile(path, 'utf8'));
    expect(cached.releases).toHaveLength(3);
    // API request: headers right, no token when none is set
    const [, init] = f.mock.calls[0]!;
    const h = (init as RequestInit).headers as Record<string, string>;
    expect(h['Accept']).toBe('application/vnd.github+json');
    expect(h['X-GitHub-Api-Version']).toBeDefined();
    expect(h['User-Agent']).toBe('netsluice-website-build');
    expect(h['Authorization']).toBeUndefined();
  });

  it('sends the token to the API only, never to the download host', async () => {
    const f = mockFetch(() => json([rel('0.1.28', { image: true })]));
    await loadReleaseData({
      fetch: f,
      env: { GITHUB_TOKEN: 'test-token-value' },
      cachePath: cacheFile(),
      writeCache: false,
    });
    const calls = f.mock.calls as [string, RequestInit][];
    expect((calls[0]![1].headers as Record<string, string>)['Authorization']).toBe('Bearer test-token-value');
    for (const [url, init] of calls.slice(1)) {
      expect(url.startsWith(DL)).toBe(true);
      expect(JSON.stringify(init.headers)).not.toContain('test-token-value');
    }
  });

  it('keeps latest and latestImage apart when the newest release has no image', async () => {
    const f = mockFetch(() =>
      json([rel('0.1.29'), rel('0.1.28', { image: true }), rel('0.1.30-rc.1', { prerelease: true })]),
    );
    const d = await loadReleaseData({ fetch: f, env: {}, cachePath: cacheFile(), writeCache: false });
    expect(d.latest?.version).toBe('0.1.30-rc.1');
    expect(d.latest?.prerelease).toBe(true);
    expect(d.latestImage?.version).toBe('0.1.28');
  });

  it('caps the checksum download size', async () => {
    const big = `${DIGEST}  netsluice-0.1.28-deeper-connect-mini.img.xz\n`.padEnd(5000, ' ');
    const f = mockFetch(() => json([rel('0.1.28', { image: true })]), {
      [`${DL}/v0.1.28/netsluice-0.1.28-deeper-connect-mini.img.xz.sha256`]: big,
    });
    const d = await loadReleaseData({ fetch: f, env: {}, cachePath: cacheFile(), writeCache: false });
    expect(d.releases[0]!.sha256).toBeUndefined();
  });

  it('falls back to the cache on a rate limit, with one request only', async () => {
    const path = cacheFile();
    const good = mockFetch(() => json([rel('0.1.28', { image: true })]));
    await loadReleaseData({ fetch: good, env: {}, cachePath: path, now: () => new Date('2026-11-25T08:00:00Z') });

    const limited = mockFetch(() =>
      json({ message: 'API rate limit exceeded' }, 403, {
        'x-ratelimit-remaining': '0',
        'x-ratelimit-reset': '1795680000',
      }),
    );
    const d = await loadReleaseData({ fetch: limited, env: {}, cachePath: path });
    expect(limited).toHaveBeenCalledTimes(1);
    expect(d.source).toBe('cache');
    expect(d.error).toMatch(/rate limit/);
    expect(d.fetchedAt).toBe('2026-11-25T08:00:00.000Z');
    expect(d.latest?.version).toBe('0.1.28');
    expect(d.latestImage?.image?.name).toBe('netsluice-0.1.28-deeper-connect-mini.img.xz');

    const tooMany = mockFetch(() => json({}, 429, { 'retry-after': '60' }));
    const d2 = await loadReleaseData({ fetch: tooMany, env: {}, cachePath: path });
    expect(d2.source).toBe('cache');
    expect(d2.error).toBe('GitHub rate limit reached (retry after 60 s)');
  });

  it('reports none, without inventing data, when there is no cache', async () => {
    const down = vi.fn(async () => {
      throw new TypeError('fetch failed');
    }) as unknown as typeof fetch;
    const d = await loadReleaseData({ fetch: down, env: {}, cachePath: cacheFile() });
    expect(d).toEqual({ fetchedAt: null, source: 'none', error: 'GitHub could not be reached', releases: [] });
  });

  it('treats an unexpected answer as a failure', async () => {
    const f = mockFetch(() => json({ not: 'a list' }));
    const d = await loadReleaseData({ fetch: f, env: {}, cachePath: cacheFile() });
    expect(d.source).toBe('none');
    expect(d.error).toBe('GitHub sent an unexpected answer');
  });

  it('offline mode never calls fetch and rejects a tampered cache', async () => {
    const path = cacheFile();
    await writeFile(
      path,
      JSON.stringify({
        format: 1,
        fetchedAt: 'x',
        releases: [{ ...normaliseRelease(rel('0.1.28'))!, htmlUrl: 'https://evil.example/' }],
      }),
    );
    const f = mockFetch(() => json([]));
    const d = await loadReleaseData({ fetch: f, env: { NETSLUICE_RELEASES_OFFLINE: '1' }, cachePath: path });
    expect(f).not.toHaveBeenCalled();
    expect(d.source).toBe('none');
    expect(d.error).toMatch(/offline/);
  });
});

describe('renderNotes (untrusted Markdown)', () => {
  it('renders the supported subset', () => {
    const html = renderNotes(
      [
        'Intro with **bold**, *italic* and `code <b>`.',
        '',
        '## Fixed',
        '',
        '- one',
        '- two [docs](https://github.com/Anarki-LNX/netsluice)',
        '',
        '1. first',
        '2. second',
        '',
        '```sh',
        'echo "<hi>" && rm -rf /',
        '```',
      ].join('\n'),
    );
    expect(html).toContain('<p>Intro with <strong>bold</strong>, <em>italic</em> and <code>code &lt;b&gt;</code>.</p>');
    expect(html).toContain('<h4>Fixed</h4>');
    expect(html).toContain(
      '<ul><li>one</li><li>two <a href="https://github.com/Anarki-LNX/netsluice" rel="noopener noreferrer nofollow">docs</a></li></ul>',
    );
    expect(html).toContain('<ol><li>first</li><li>second</li></ol>');
    expect(html).toContain('<pre><code>echo &quot;&lt;hi&gt;&quot; &amp;&amp; rm -rf /</code></pre>');
    expect(renderNotes('#### deep')).toBe('<h5>deep</h5>');
  });

  const evil = [
    '<script>alert(1)</script>',
    '<img src=x onerror=alert(1)>',
    '<a href="javascript:alert(1)">x</a>',
    '[click](javascript:alert(1))',
    '[click](JaVaScRiPt:alert(1))',
    '[click](data:text/html;base64,PHNjcmlwdD4=)',
    '[click](http://insecure.example/)',
    '[x](https://ok.example/"onmouseover="alert(1))',
    '[x](https://ok.example/ "title" onclick=alert(1))',
    '**<svg onload=alert(1)>**',
    '`</code><script>alert(1)</script>`',
    '[`<script>`](https://ok.example/)',
    '[**x**](https://a.example/)[y](javascript:1)',
    '```\n</code></pre><script>alert(1)</script>\n```',
    '<!-- --><iframe src=//evil>',
    '\u0001' + '0' + '\u0002 placeholder forgery',
    '[a](https://ok.example/?q=<script>)',
    '&lt;script&gt;already escaped',
    '<style>body{display:none}</style>',
    '# <h1 onclick=x>head</h1>',
  ];

  it.each(evil)('neutralises %j', (src) => {
    const html = renderNotes(src);
    // no raw tag other than the whitelist, no event handler, no non-https link
    const tags = [...html.matchAll(/<\/?([a-zA-Z0-9]+)/g)].map((m) => m[1]!.toLowerCase());
    for (const t of tags) expect(['p', 'ul', 'ol', 'li', 'h4', 'h5', 'pre', 'code', 'strong', 'em', 'a']).toContain(t);
    expect(html).not.toMatch(/<[^>]+\son[a-z]+\s*=/i);
    expect(html).not.toMatch(/href="(?!https:\/\/)/);
    expect(html).not.toMatch(/href="[^"]*(javascript|data):/i);
    for (const m of html.matchAll(/<a ([^>]*)>/g))
      expect(m[1]).toMatch(/^href="https:\/\/[^"<>]*" rel="noopener noreferrer nofollow"$/);
    expect(html).not.toContain('\u0001');
  });

  it('keeps a javascript: link as visible text', () => {
    expect(renderNotes('[click](javascript:alert(1))')).toBe('<p>[click](javascript:alert(1))</p>');
  });

  it('escapes quotes inside URLs so they cannot leave the attribute', () => {
    const html = renderNotes('[x](https://ok.example/a&b=1)');
    expect(html).toBe('<p><a href="https://ok.example/a&amp;b=1" rel="noopener noreferrer nofollow">x</a></p>');
  });

  it('handles empty and huge input', () => {
    expect(renderNotes('')).toBe('');
    expect(renderNotes('a'.repeat(200_000)).length).toBeLessThan(60_000);
  });
});

describe('formatBytes', () => {
  it('formats in both languages', () => {
    expect(formatBytes(427963112, 'en')).toBe('408 MB');
    expect(formatBytes(142451, 'en')).toBe('139 KB');
    expect(formatBytes(1536, 'de')).toBe('1,5 KB');
    expect(formatBytes(110, 'de')).toBe('110 B');
    expect(formatBytes(5 * 1024 ** 3, 'en')).toBe('5 GB');
    expect(formatBytes(-1, 'en')).toBe('–');
  });
});
