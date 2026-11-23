#!/usr/bin/env python3
"""Generate same-origin XYZ tiles from NASA Blue Marble Next Generation.

The basemap-data package includes NASA's 5400 x 2700 Blue Marble texture.
Convert from equirectangular to Web Mercator; browsers never contact NASA.
"""
from __future__ import annotations
import argparse
import glob
import math
import site
from pathlib import Path
import numpy as np
from PIL import Image

def find_blue_marble() -> Path:
    paths = [*site.getsitepackages(), site.getusersitepackages()]
    candidates = [p for root in paths for p in Path(root).glob("mpl_toolkits/basemap_data/bmng.jpg")]
    candidates += [Path(p) for p in glob.glob("/opt/pyvenv/lib/python*/site-packages/mpl_toolkits/basemap_data/bmng.jpg")]
    for p in candidates:
        if p.is_file():
            return p
    raise FileNotFoundError("NASA Blue Marble bmng.jpg missing; install basemap-data")

def render_tiles(source: Path, output: Path, max_zoom: int = 4) -> int:
    pixels = np.asarray(Image.open(source).convert("RGB"))
    height, width = pixels.shape[:2]
    if width != height * 2:
        raise ValueError("Expected 2:1 equirectangular imagery")
    half_pixel = (np.arange(256, dtype=np.float64) + 0.5) / 256
    count = 0
    for zoom in range(max_zoom + 1):
        n = 1 << zoom
        for tile_y in range(n):
            mercator_y = (tile_y + half_pixel) / n
            lat = np.degrees(np.arctan(np.sinh(math.pi * (1 - 2 * mercator_y))))
            sy = np.clip((90 - lat) / 180 * height - 0.5, 0, height - 1)
            y0 = np.floor(sy).astype(np.int32)
            y1 = np.minimum(y0 + 1, height - 1)
            wy = (sy - y0)[:, None, None]
            for tile_x in range(n):
                sx = ((tile_x + half_pixel) / n * width - 0.5) % width
                x0 = np.floor(sx).astype(np.int32)
                x1 = (x0 + 1) % width
                wx = (sx - x0)[None, :, None]
                a = pixels[y0[:, None], x0[None, :]].astype(np.float32)
                b = pixels[y0[:, None], x1[None, :]].astype(np.float32)
                c = pixels[y1[:, None], x0[None, :]].astype(np.float32)
                d = pixels[y1[:, None], x1[None, :]].astype(np.float32)
                tile = (a * (1 - wx) + b * wx) * (1 - wy) + (c * (1 - wx) + d * wx) * wy
                path = output / str(zoom) / str(tile_x) / f"{tile_y}.jpg"
                path.parent.mkdir(parents=True, exist_ok=True)
                Image.fromarray(np.clip(tile, 0, 255).astype(np.uint8)).save(
                    path, "JPEG", quality=84, optimize=True, subsampling=0)
                count += 1
    return count

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", default="public/earth-tiles")
    parser.add_argument("--max-zoom", type=int, default=4)
    args = parser.parse_args()
    print(f"Generated {render_tiles(find_blue_marble(), Path(args.output), args.max_zoom)} Blue Marble tiles")
