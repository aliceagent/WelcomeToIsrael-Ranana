#!/usr/bin/env python3
"""Write simple PNG icons and OG card without extra deps."""
from __future__ import annotations
import struct, zlib, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
PUB = ROOT / "public"
PUB.mkdir(exist_ok=True)
(PUB / "og").mkdir(exist_ok=True)

OLIVE = (28, 74, 60)
CREAM = (243, 234, 217)
TERR = (196, 92, 62)

def chunk(tag: bytes, data: bytes) -> bytes:
    return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

def png(w: int, h: int, pixel) -> bytes:
    rows = []
    for y in range(h):
        row = bytearray([0])
        for x in range(w):
            row.extend(pixel(x, y))
        rows.append(bytes(row))
    raw = b"".join(rows)
    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(raw, 9))
        + chunk(b"IEND", b"")
    )

def icon(size: int, maskable=False) -> bytes:
    pad = int(size * 0.12) if maskable else 0
    def px(x, y):
        if x < pad or y < pad or x >= size - pad or y >= size - pad:
            return CREAM
        cx, cy = size / 2, size / 2
        if (x - cx) ** 2 + (y - cy) ** 2 < (size * 0.28) ** 2:
            return CREAM
        return OLIVE
    return png(size, size, px)

def og() -> bytes:
    w, h = 1200, 630
    def px(x, y):
        if y < 18 or y > h - 18 or x < 18 or x > w - 18:
            return TERR
        if x < 90:
            return OLIVE
        return CREAM
    return png(w, h, px)

(PUB / "icon-192.png").write_bytes(icon(192))
(PUB / "icon-512.png").write_bytes(icon(512))
(PUB / "icon-maskable-512.png").write_bytes(icon(512, True))
(PUB / "apple-touch-icon.png").write_bytes(icon(180))
(PUB / "og" / "default.png").write_bytes(og())
print("wrote icons")
