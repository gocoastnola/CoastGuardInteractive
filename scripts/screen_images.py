#!/usr/bin/env python3
"""
Excitement screener for DVIDS Coast Guard imagery.

Scores every candidate photo for ACTION content (rescues, hoists, icebreaking,
fires, airborne use-of-force, boardings, heavy weather) and penalises
ceremonial/static content (awards, ceremonies, handshakes, podiums, meetings).
Only photos clearing the threshold get downloaded for the app.

Usage:
  python3 scripts/screen_images.py search "<query>" [--max 20]      # score search results
  python3 scripts/screen_images.py fetch "<query>" <out.jpg> [--min-score 4]  # grab best
  python3 scripts/screen_images.py audit                            # score what's in public/media via manifest
"""
import json, re, subprocess, sys, urllib.parse
from pathlib import Path

API = "https://api.dvidshub.net/search"
KEY = "key-6ad581d358178"

# Words that make a Coast Guard photo EXCITING (weighted).
ACTION = {
    5: ["rescue swimmer", "hoist", "breaking ice", "airborne use of force", "vessel fire",
        "boat fire", "medevac", "capsized", "sinking", "burning"],
    4: ["rescues", "rescued", "rescue", "icebreaking", "interdiction", "hitron",
        "heavy weather", "surf", "antarctica", "arctic", "deep freeze"],
    3: ["helicopter", "mh-65", "mh-60", "jayhawk", "dolphin", "boarding", "pursuit",
        "smuggler", "narco", "seizure", "icebreaker", "underway", "flight deck",
        "small boat", "response boat", "gunnery", "live fire", "fast rope"],
    2: ["training", "exercise", "operations", "patrol", "launch", "deploys",
        "offload", "storm", "hurricane", "waves", "at sea"],
}
# Words that make it BORING (negative weights).
BORING = {
    -8: ["award", "ceremony", "change of command", "retirement", "promotion",
         "ribbon cutting", "graduation", "reenlistment", "medal"],
    -5: ["meeting", "visits", "visit", "speaks", "speech", "conference", "signing",
         "handshake", "poses", "group photo", "portrait", "headshot"],
    -3: ["banquet", "luncheon", "reception", "museum", "anniversary", "celebrates"],
}

def score(text: str) -> int:
    t = text.lower()
    s = 0
    for w, words in ACTION.items():
        for kw in words:
            if kw in t:
                s += w
    for w, words in BORING.items():
        for kw in words:
            if kw in t:
                s += w
    return s

def search(query: str, maxr: int = 20):
    q = urllib.parse.quote(query)
    url = (f"{API}?q={q}&api_key={KEY}&branch=Coast%20Guard&type=image"
           f"&thumb_width=1600&thumb_height=1200&max_results={maxr}")
    out = subprocess.run(["curl", "-s", url], capture_output=True, text=True, timeout=20)
    data = json.loads(out.stdout)
    rows = []
    for r in data.get("results", []):
        blob = f"{r.get('title','')} {r.get('description','')} {' '.join(r.get('keywords') or []) if isinstance(r.get('keywords'), list) else r.get('keywords') or ''}"
        rows.append({
            "id": r.get("id"), "title": r.get("title", ""),
            "score": score(blob), "thumb": r.get("thumbnail", ""),
            "credit": r.get("credit", ""), "unit": r.get("unit_name", ""),
            "date": r.get("date", ""), "page": r.get("url", ""),
            "aspect": (r.get("width") or 0, r.get("height") or 0),
        })
    rows.sort(key=lambda x: -x["score"])
    return rows

def fetch_best(query: str, out_path: str, min_score: int = 4, skip_ids=None):
    skip_ids = skip_ids or set()
    for row in search(query, 25):
        if row["score"] < min_score or not row["thumb"] or row["id"] in skip_ids:
            continue
        dl = subprocess.run(["curl", "-sL", "-H", "Referer: https://www.dvidshub.net/",
                             row["thumb"], "-o", out_path], timeout=30)
        p = Path(out_path)
        if dl.returncode == 0 and p.exists() and p.stat().st_size > 30000:
            ftype = subprocess.run(["file", out_path], capture_output=True, text=True).stdout
            if "JPEG" in ftype:
                return row
        p.unlink(missing_ok=True)
    return None

if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "search"
    if cmd == "search":
        rows = search(sys.argv[2], int(sys.argv[4]) if len(sys.argv) > 4 else 20)
        for r in rows[:15]:
            print(f"{r['score']:+3d}  {r['id']}  {r['title'][:80]}")
    elif cmd == "fetch":
        row = fetch_best(sys.argv[2], sys.argv[3],
                         int(sys.argv[5]) if len(sys.argv) > 5 else 4)
        print(json.dumps(row, indent=2) if row else "NO MATCH", flush=True)
