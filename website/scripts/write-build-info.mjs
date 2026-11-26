#!/usr/bin/env node
// Writes dist/build.json after a build: which commit, when, and where the release data
// came from. It is the health check of the live site (https://netsluice.loopout.tech/build.json)
// and what deploy.sh / netsluice-web-pull compare after switching to a new build.
//
//   node scripts/write-build-info.mjs [--require-release-data]
//
// --require-release-data exits 1 when the build had no release data at all (source "none"),
// so CI does not publish a site whose download page is empty.
// Contains nothing secret: no token, no environment, no paths.

import { execFileSync } from 'node:child_process';
import { readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const site = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(site, 'dist');
const requireData = process.argv.includes('--require-release-data');

async function json(path) {
  try {
    return JSON.parse(await readFile(path, 'utf8'));
  } catch {
    return null;
  }
}

try {
  await stat(join(dist, 'index.html'));
} catch {
  console.error('write-build-info: no dist/index.html (run the build first)');
  process.exit(2);
}

// The checked-out commit (in CI a release event builds main, not the tag GITHUB_SHA names).
let commit = 'unknown';
try {
  commit = execFileSync('git', ['-C', site, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
} catch {
  if (/^[0-9a-f]{40}$/.test(process.env.GITHUB_SHA || '')) commit = process.env.GITHUB_SHA;
}
const dirty = (() => {
  try {
    return execFileSync('git', ['-C', site, 'status', '--porcelain', '--', '.'], { encoding: 'utf8' }).trim() !== '';
  } catch {
    return null;
  }
})();

const status = await json(join(site, '.cache', 'release-status.json'));
const demo = await json(join(dist, 'demo', 'app', 'demo-source.json'));
const runId = /^\d+$/.test(process.env.GITHUB_RUN_ID || '') ? Number(process.env.GITHUB_RUN_ID) : null;

const info = {
  site: 'netsluice-website',
  commit,
  ...(dirty === null ? {} : { dirty }),
  builtAt: new Date().toISOString(),
  ...(runId ? { run: runId } : {}),
  releases: status
    ? {
        source: status.source,
        fetchedAt: status.fetchedAt,
        ...(status.error ? { error: String(status.error).slice(0, 120) } : {}),
        count: status.releases,
        latest: status.latest,
        latestImage: status.latestImage,
      }
    : { source: 'not-used' },
  demo: demo ? { version: demo.version, commit: demo.commit } : null,
};

await writeFile(join(dist, 'build.json'), JSON.stringify(info, null, 2) + '\n');
console.log(`write-build-info: dist/build.json (commit ${commit.slice(0, 7)}, releases ${info.releases.source})`);

if (info.releases.source === 'not-used') console.warn('write-build-info: no page asked for release data in this build');
if (requireData && info.releases.source === 'none') {
  console.error('write-build-info: GitHub could not be read and there is no cache; not publishing this build');
  process.exit(1);
}
