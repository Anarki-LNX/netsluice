#!/usr/bin/env python3
"""Collect everything the first start of the ready-made image would otherwise download.

    scripts/fetch-bundle.py <dpkg status file of the image> <output directory>

Writes into the output directory:
    debs/*.deb            Caddy, avahi and what they need beyond the packages
                          already in the image, from Debian, checked against the
                          SHA-256 in Debian's package index
    AdGuardHome_linux_arm64.tar.gz   checked against the project's checksums.txt
    dbip-country-ipv4.csv            country database for the world map
    oui.csv                          makers of network cards
    SOURCES.txt                      where each file came from, with its checksum

Standard library only. Files already present and correct are not downloaded again.
"""
import hashlib, lzma, os, re, sys, urllib.request

SUITE, ARCH = "trixie", "arm64"
MIRROR = "https://deb.debian.org/debian"
WANT = ["caddy", "avahi-daemon", "avahi-utils", "ieee-data"]
AGH_VER = os.environ.get("AGH_VER", "v1.0.0")
AGH = "https://github.com/AdguardTeam/AdGuardHome/releases/download/" + AGH_VER
GEO = "https://cdn.jsdelivr.net/npm/@ip-location-db/dbip-country/dbip-country-ipv4.csv"
OUI = "https://standards-oui.ieee.org/oui/oui.csv"


def get(url, limit=80 * 1024 * 1024):
    req = urllib.request.Request(url, headers={"User-Agent": "netsluice-build"})
    with urllib.request.urlopen(req, timeout=120) as r:
        data = r.read(limit + 1)
    if len(data) > limit:
        raise SystemExit("too large: " + url)
    return data


def sha(data):
    return hashlib.sha256(data).hexdigest()


def stanzas(text):
    for block in text.split("\n\n"):
        d, key = {}, None
        for line in block.splitlines():
            if line[:1] in " \t" and key:
                d[key] += "\n" + line
            elif ":" in line:
                key, _, v = line.partition(":")
                d[key] = v.strip()
        if d:
            yield d


def names(field):
    """Package names of a Depends/Provides field; of alternatives (a | b) all of them, in order."""
    out = []
    for part in (field or "").split(","):
        alts = [re.sub(r"[\s(:].*", "", a.strip()) for a in part.split("|")]
        if alts and alts[0]:
            out.append([a for a in alts if a])
    return out


def main():
    status_file, out = sys.argv[1], sys.argv[2]
    os.makedirs(os.path.join(out, "debs"), exist_ok=True)
    have = set()
    for s in stanzas(open(status_file, encoding="utf-8", errors="replace").read()):
        if "install ok installed" in s.get("Status", ""):
            have.add(s["Package"])
            have.update(n for alts in names(s.get("Provides")) for n in alts)

    print("reading Debian's package index for %s/%s" % (SUITE, ARCH))
    index = {}
    for s in stanzas(lzma.decompress(get("%s/dists/%s/main/binary-%s/Packages.xz" % (MIRROR, SUITE, ARCH))).decode("utf-8", "replace")):
        index[s["Package"]] = s
    provided = {}
    for s in index.values():
        for alts in names(s.get("Provides")):
            for n in alts:
                provided.setdefault(n, s["Package"])

    chosen, todo = {}, list(WANT)
    while todo:
        name = todo.pop()
        if name in chosen or name in have:
            continue
        s = index.get(name) or index.get(provided.get(name, ""))
        if not s:
            raise SystemExit("not in Debian %s: %s" % (SUITE, name))
        chosen[s["Package"]] = s
        for alts in names((s.get("Pre-Depends", "") + "," + s.get("Depends", "")).strip(",")):
            # satisfied by the image, by something chosen, or take the first alternative
            if not any(a in have or a in chosen for a in alts):
                todo.append(alts[0])

    sources = []
    for name in sorted(chosen):
        s = chosen[name]
        path = os.path.join(out, "debs", os.path.basename(s["Filename"]))
        if not (os.path.exists(path) and sha(open(path, "rb").read()) == s["SHA256"]):
            data = get("%s/%s" % (MIRROR, s["Filename"]))
            if sha(data) != s["SHA256"]:
                raise SystemExit("checksum mismatch: " + s["Filename"])
            open(path, "wb").write(data)
        print("  %-24s %s" % (name, s["Version"]))
        sources.append("%s  debs/%s  %s/%s" % (s["SHA256"], os.path.basename(s["Filename"]), MIRROR, s["Filename"]))
    keep = {os.path.basename(s["Filename"]) for s in chosen.values()}
    for f in os.listdir(os.path.join(out, "debs")):
        if f not in keep:
            os.remove(os.path.join(out, "debs", f))

    print("AdGuard Home " + AGH_VER)
    name = "AdGuardHome_linux_arm64.tar.gz"
    sums = get(AGH + "/checksums.txt").decode()
    want = next((l.split()[0] for l in sums.splitlines() if l.strip().endswith(name)), None)
    path = os.path.join(out, name)
    if not (os.path.exists(path) and sha(open(path, "rb").read()) == want):
        data = get(AGH + "/" + name)
        if not want or sha(data) != want:
            raise SystemExit("checksum mismatch: " + name)
        open(path, "wb").write(data)
    open(os.path.join(out, "AGH_VERSION"), "w").write(AGH_VER + "\n")
    sources.append("%s  %s  %s/%s" % (want, name, AGH, name))

    for name, url, least in (("dbip-country-ipv4.csv", GEO, 2_000_000), ("oui.csv", OUI, 1_000_000)):
        print(name)
        path = os.path.join(out, name)
        if not (os.path.exists(path) and os.path.getsize(path) > least):
            data = get(url)
            if len(data) < least:
                raise SystemExit("suspiciously small: " + url)
            open(path, "wb").write(data)
        sources.append("%s  %s  %s" % (sha(open(path, "rb").read()), name, url))

    open(os.path.join(out, "SOURCES.txt"), "w").write("\n".join(sources) + "\n")
    total = sum(os.path.getsize(os.path.join(d, f)) for d, _, fs in os.walk(out) for f in fs)
    print("bundle: %d files, %.1f MB in %s" % (len(sources), total / 1048576, out))


if __name__ == "__main__":
    main()
