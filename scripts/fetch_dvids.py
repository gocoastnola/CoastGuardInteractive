#!/usr/bin/env python3
"""
One-off DVIDS asset fetch for the Polar Star patrol phase.
Downloads public-domain DoD imagery (1600px server-generated thumbs) into
public/media/ and writes an attribution manifest used by ASSET_LICENSES.md.

Usage: DVIDS_KEY=key-xxxx python3 scripts/fetch_dvids.py
"""
import json
import os
import sys
import urllib.parse
import urllib.request

KEY = os.environ.get("DVIDS_KEY", "")
if not KEY:
    sys.exit("DVIDS_KEY env var required")

OUT = os.path.join(os.path.dirname(__file__), "..", "public", "media")
os.makedirs(OUT, exist_ok=True)

# (file-stem, search query, extra params)
TARGETS = [
    # Landing mission mosaic
    ("mission-aviation", "coast guard MH-65 helicopter hoist", {}),
    ("mission-sar", "coast guard rescue swimmer training", {}),
    ("mission-drug", "coast guard drug interdiction offload cocaine", {}),
    ("mission-ice", "polar star icebreaking antarctica ice", {}),
    # Polar Star ship intro
    ("polar-star-hero", "polar star underway", {}),
    ("polar-star-bow", "polar star icebreaker bow ice", {}),
    ("polar-star-crew", "polar star crew", {}),
    # Patrol port calls
    ("port-seattle", "polar star seattle", {}),
    ("port-honolulu", "polar star honolulu pearl harbor", {}),
    ("port-hobart", "polar star hobart australia", {}),
    ("port-wellington", "polar star new zealand", {}),
    ("port-punta-arenas", "polar star punta arenas chile", {}),
    ("port-cape-horn", "polar star south america", {}),
    ("port-rio", "coast guard cutter brazil rio", {}),
    ("port-panama", "coast guard cutter panama canal transit", {}),
    ("port-homecoming", "polar star returns seattle homecoming families", {}),
]

BASE = "https://api.dvidshub.net/search"
manifest = {}

def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "CoastGuardInteractive-demo/1.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read()

for stem, query, extra in TARGETS:
    params = {
        "q": query,
        "type": "image",
        "max_results": "8",
        "thumb_width": "1600",
        "api_key": KEY,
    }
    params.update(extra)
    url = BASE + "?" + urllib.parse.urlencode(params)
    try:
        data = json.loads(fetch(url))
    except Exception as e:
        print(f"MISS  {stem}: search failed: {e}")
        continue
    results = data.get("results", [])
    got = False
    for r in results:
        thumb = (r.get("thumbnail") or "").replace("\\/", "/")
        if not thumb:
            continue
        try:
            blob = fetch(thumb)
        except Exception:
            continue
        if len(blob) < 30000 or not blob[:3] == b"\xff\xd8\xff":
            continue  # too small or not a JPEG
        path = os.path.join(OUT, f"{stem}.jpg")
        with open(path, "wb") as f:
            f.write(blob)
        manifest[stem] = {
            "dvids_id": r.get("id"),
            "title": r.get("title"),
            "credit": r.get("credit"),
            "unit": r.get("unit_name"),
            "date": r.get("date"),
            "page": (r.get("url") or "").replace("\\/", "/"),
            "bytes": len(blob),
        }
        print(f"OK    {stem}: {r.get('id')} {len(blob)//1024}KB — {r.get('title')[:60]}")
        got = True
        break
    if not got:
        print(f"MISS  {stem}: no usable result for '{query}'")

with open(os.path.join(OUT, "dvids-manifest.json"), "w") as f:
    json.dump(manifest, f, indent=2)
print(f"\nwrote {len(manifest)} assets + manifest")
