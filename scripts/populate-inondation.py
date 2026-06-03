#!/usr/bin/env python3
"""
populate-inondation.py — risque inondation par commune depuis GASPAR CatNat.

Compte les arrêtés de catastrophe naturelle de type INONDATION FLUVIALE/PLUVIALE
(débordement, ruissellement, coulées de boue) par commune via l'API georisques
/gaspar/catnat. EXCLUT la submersion marine (« chocs mécaniques liés à l'action des
vagues »), qui relève du chantier littoral. Normalise en percentile national -> risque.

Loop ~35k communes avec CACHE/REPRISE (relançable). Aucune dépendance (stdlib).
Usage :
    python3 scripts/populate-inondation.py                # remplit/complète le cache
    python3 scripts/populate-inondation.py --write-index  # + patche comparateur-index.json
"""
import json, os, sys, time, argparse, bisect
import urllib.request, urllib.parse, urllib.error

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX = os.path.join(ROOT, "data", "comparateur-index.json")
CACHE_DIR = os.path.join(ROOT, "data", ".cache")
CACHE = os.path.join(CACHE_DIR, "communes-inondation.json")
BASE = "https://georisques.gouv.fr/api/v1/gaspar/catnat"


def is_flood(label):
    l = (label or "").lower()
    return "inondation" in l and "vague" not in l


def fetch_count(insee):
    """Nombre d'arrêtés inondation (hors submersion marine) pour une commune. None si échec."""
    qs = urllib.parse.urlencode({"code_insee": insee, "page": "1", "page_size": "500"})
    url = f"{BASE}?{qs}"
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "futur-e/populate-inondation"})
            with urllib.request.urlopen(req, timeout=30) as r:
                d = json.loads(r.read().decode("utf-8"))
            data = d.get("data") or []
            return sum(1 for it in data if is_flood(it.get("libelle_risque_jo")))
        except (urllib.error.URLError, TimeoutError, ValueError):
            time.sleep(1.5 * (attempt + 1))
    return None


def load_cache():
    if os.path.exists(CACHE):
        return json.load(open(CACHE))
    return {}


def save_cache(cache):
    os.makedirs(CACHE_DIR, exist_ok=True)
    json.dump(cache, open(CACHE, "w"))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--write-index", action="store_true")
    args = ap.parse_args()

    idx = json.load(open(INDEX))
    communes = idx["communes"]
    cache = load_cache()  # { insee: count(int) }

    todo = [c["insee"] for c in communes if cache.get(c["insee"]) is None]
    print(f"communes : {len(communes)} | déjà en cache : {len(communes) - len(todo)} | à faire : {len(todo)}", file=sys.stderr)

    t0 = time.time()
    for i, insee in enumerate(todo):
        cnt = fetch_count(insee)
        if cnt is not None:
            cache[insee] = cnt
        time.sleep(0.05)  # politesse
        if (i + 1) % 500 == 0:
            save_cache(cache)
            print(f"  {i+1}/{len(todo)} ({time.time()-t0:.0f}s)", file=sys.stderr)
    save_cache(cache)
    done = sum(1 for c in communes if cache.get(c["insee"]) is not None)
    print(f"✓ cache : {done}/{len(communes)} communes renseignées", file=sys.stderr)

    # Percentile national du comptage -> risque (plus haut = plus exposé).
    counts = sorted(int(cache[c["insee"]]) for c in communes if cache.get(c["insee"]) is not None)
    n = len(counts)

    def risque(cnt):
        return round(100 * bisect.bisect_right(counts, int(cnt)) / n) if n else 0

    if args.write_index:
        for c in communes:
            cnt = cache.get(c["insee"])
            c["inondation"] = (
                {"catnat": int(cnt), "tri": False, "risque": risque(cnt)} if cnt is not None else None
            )
        json.dump(idx, open(INDEX, "w"))
        print("✓ index patché (champ inondation : catnat + tri + risque)", file=sys.stderr)


if __name__ == "__main__":
    main()
