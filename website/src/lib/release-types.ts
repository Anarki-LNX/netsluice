// The shape every page uses for release data. The loader that fills it
// (src/lib/releases.ts) validates GitHub's answer with zod; pages only ever
// see these types. Release notes are untrusted text: pages render `notes`
// through the safe renderer, never as raw HTML.

export interface ReleaseAsset {
  name: string;
  /** bytes */
  size: number;
  /** https://github.com/... browser download URL */
  url: string;
  contentType: string;
}

export interface Release {
  tag: string; // "v0.1.28"
  version: string; // "0.1.28"
  name: string;
  publishedAt: string; // ISO 8601
  prerelease: boolean;
  /** the release page on GitHub */
  htmlUrl: string;
  /** release notes as written on GitHub (Markdown, untrusted) */
  notes: string;
  assets: ReleaseAsset[];
  /** netsluice-<v>-deeper-connect-mini.img.xz, if this release brings an image */
  image?: ReleaseAsset;
  /** the .sha256 file next to the image, if attached */
  checksumFile?: ReleaseAsset;
  /** the hex digest read from that file at build time, only if it could be read and parsed */
  sha256?: string;
  /** netsluice-<v>.tar.gz, the update archive devices download */
  updateArchive?: ReleaseAsset;
}

export interface ReleaseData {
  /** when GitHub was last asked successfully (ISO 8601), or null if never */
  fetchedAt: string | null;
  /** live: fetched during this build; cache: last good answer from disk; none: nothing available */
  source: 'live' | 'cache' | 'none';
  /** short, non-sensitive reason when source is not "live" */
  error?: string;
  /** newest first */
  releases: Release[];
  /** the newest release overall (devices update to this one) */
  latest?: Release;
  /** the newest release that carries a card image */
  latestImage?: Release;
}
