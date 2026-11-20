#!/usr/bin/env python3
"""Wrap boot.cmd into a U-Boot script image (legacy uImage, type script).
Does what `mkimage -A arm64 -T script -C none -d boot.cmd boot.scr` does, without u-boot-tools.
Usage: mkscr.py boot.cmd boot.scr"""
import struct, sys, time, zlib
src, dst = sys.argv[1], sys.argv[2]
script = open(src, "rb").read()
data = struct.pack(">II", len(script), 0) + script
name = b"deeper probe".ljust(32, b"\0")
def hdr(hcrc):
    return struct.pack(">IIIIIII4B32s", 0x27051956, hcrc, int(time.time()), len(data),
                       0, 0, zlib.crc32(data) & 0xffffffff, 5, 22, 6, 0, name)
h = hdr(0)
# reuse the timestamp so both header passes are identical
t = struct.unpack(">I", h[8:12])[0]
def hdr2(hcrc):
    return struct.pack(">IIIIIII4B32s", 0x27051956, hcrc, t, len(data),
                       0, 0, zlib.crc32(data) & 0xffffffff, 5, 22, 6, 0, name)
h = hdr2(zlib.crc32(hdr2(0)) & 0xffffffff)
open(dst, "wb").write(h + data)
print(f"{dst}: {len(h)+len(data)} bytes")
