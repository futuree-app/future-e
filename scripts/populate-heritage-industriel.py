#!/usr/bin/env python3
"""Précompute le signal NARRATIF 'héritage industriel' (SSP/ex-BASOL) par commune.

Source : API Géorisques GET /api/v1/ssp, sous-clé `instructions` UNIQUEMENT (ex-BASOL curé).
casias/conclusions_sis/conclusions_sup IGNORÉS. NON scoré : on écrit juste, par commune, le
site instruit le plus proche du chef-lieu (activité dérivée du nom, pluralité, distance).

Usage :
    .venv-bpe/bin/python scripts/populate-heritage-industriel.py --selftest
    .venv-bpe/bin/python scripts/populate-heritage-industriel.py --fetch         # boucle géo, cache
    .venv-bpe/bin/python scripts/populate-heritage-industriel.py --matrix        # témoins, sonde 3 vs 5
    .venv-bpe/bin/python scripts/populate-heritage-industriel.py --summary --rayon 3
    .venv-bpe/bin/python scripts/populate-heritage-industriel.py --write-index --rayon 3
"""
import json, os, sys, math, argparse, urllib.request, unicodedata, time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX = os.path.join(ROOT, "data", "comparateur-index.json")
CACHE = os.path.join(ROOT, "data", ".cache")
SSP_CACHE = os.path.join(CACHE, "georisques-ssp-instructions.json")  # {insee: [site,...]}

R_EARTH = 6371.0
SSP_URL = "https://www.georisques.gouv.fr/api/v1/ssp"
FETCH_RAYON_M = 5000   # fetch large : couvre la sonde 3 ET 5 km en une passe
R_KM = 3.0             # rayon du SIGNAL, PROVISOIRE — figé par sonde (gate porteur, Task 4)

# (catégorie, genre, mots-clés normalisés) — ordre = priorité. cf. spec §3bis.
ACTIVITE = [
    ("usine_gaz", "f", ["gdf", "gaz de france", "usine a gaz", "edf gdf", "edf  gdf", "edf/gdf"]),
    ("raffinerie_hydrocarbures", "m", ["esso", "raffinerie", "petrol", "hydrocarbure",
                                       "depot petrolier", "shell", "total ", "antar"]),
    ("chimie", "m", ["chimi", "chimique"]),
    ("metallurgie", "f", ["fonderie", "metallurg", "siderurg", "acierie", "aciers", "forge"]),
    ("decharge", "f", ["decharge", "ordures", "dechets menagers"]),
]


def norm(s):
    s = unicodedata.normalize("NFD", s or "")
    s = "".join(ch for ch in s if unicodedata.category(ch) != "Mn")
    return s.lower()


def activite_of(nom):
    """Catégorie grand public du site d'après son nom_etablissement. Repli 'generique'."""
    n = norm(nom)
    for cat, _genre, kws in ACTIVITE:
        if any(k in n for k in kws):
            return cat
    return "generique"


def centroid(geom):
    """Centroïde (lat, lon) d'un geom GeoJSON Point/MultiPolygon, ou None."""
    if not geom:
        return None
    t = geom.get("type")
    coords = geom.get("coordinates")
    if t == "Point":
        return (coords[1], coords[0])
    pts = []
    stack = [coords]
    while stack:
        x = stack.pop()
        if (isinstance(x, list) and len(x) == 2
                and all(isinstance(v, (int, float)) for v in x)):
            pts.append(x)  # [lon, lat]
        elif isinstance(x, list):
            stack.extend(x)
    if not pts:
        return None
    lon = sum(p[0] for p in pts) / len(pts)
    lat = sum(p[1] for p in pts) / len(pts)
    return (lat, lon)


def hav_km(lat1, lon1, lat2, lon2):
    p1, p2 = math.radians(lat1), math.radians(lat2)
    a = (math.sin((p2 - p1) / 2) ** 2
         + math.cos(p1) * math.cos(p2) * math.sin(math.radians(lon2 - lon1) / 2) ** 2)
    return 2 * R_EARTH * math.asin(math.sqrt(a))


def selftest():
    assert activite_of("Agence EDF / GDF Services") == "usine_gaz"
    assert activite_of("Centre EDF  GDF Services") == "usine_gaz"
    assert activite_of("ESSO SERVICE PORTE ROYALE") == "raffinerie_hydrocarbures"
    assert activite_of("TRIAXE INDUSTRIES") == "generique"
    assert activite_of("SNC DELFAU ET CIE") == "generique"
    assert activite_of("") == "generique"
    c = centroid({"type": "MultiPolygon", "coordinates":
                  [[[[-1.2, 46.0], [-1.0, 46.0], [-1.0, 46.2], [-1.2, 46.2], [-1.2, 46.0]]]]})
    assert abs(c[0] - 46.08) < 0.06 and abs(c[1] + 1.12) < 0.06, c
    assert centroid({"type": "Point", "coordinates": [-1.15, 46.16]}) == (46.16, -1.15)
    assert centroid(None) is None
    assert round(hav_km(46.16, -1.15, 46.16, -1.15), 3) == 0.0
    print("✓ selftest OK", file=sys.stderr)


# ── Acquisition géo par commune (instructions seulement, cache + reprise) ───────
def _http_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": "futur-e/populate-heritage"})
    for attempt in (1, 2, 3):
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.loads(r.read())
        except Exception as e:  # noqa: BLE001 (résilience réseau volontaire)
            print(f"    essai {attempt} : {e}", file=sys.stderr)
            time.sleep(2)
    return None


def fetch_commune_instructions(lat, lon):
    """Sites `instructions` (ex-BASOL) dans FETCH_RAYON_M autour de (lat,lon).
    Ne lit QUE la sous-clé instructions. page_size=1000 -> couche curée tient en page 1."""
    url = f"{SSP_URL}?latlon={lon},{lat}&rayon={int(FETCH_RAYON_M)}&page=1&page_size=1000"
    doc = _http_json(url)
    if not doc:
        return None  # échec réseau : ne pas cacher, on retentera
    blk = doc.get("instructions") or {}
    data = list(blk.get("data") or [])
    out, seen = [], set()
    for rec in data:
        sid = rec.get("identifiant_ssp")
        if sid in seen:
            continue
        seen.add(sid)
        cen = centroid(rec.get("geom"))
        if cen is None:
            continue
        out.append({"id": sid, "nom": rec.get("nom_etablissement"),
                    "statut": rec.get("statut"), "lat": cen[0], "lon": cen[1]})
    return out


def fetch_all(refresh=False):
    """Boucle sur toutes les communes de l'index ; cache {insee: [sites]} avec reprise."""
    idx = json.load(open(INDEX))
    communes = [c for c in idx["communes"]
                if c.get("lat") is not None and c.get("lon") is not None]
    os.makedirs(CACHE, exist_ok=True)
    cache = {} if refresh else (json.load(open(SSP_CACHE)) if os.path.exists(SSP_CACHE) else {})
    todo = [c for c in communes if c["insee"] not in cache]
    print(f"{len(cache)} en cache, {len(todo)} à récupérer", file=sys.stderr)
    for n, c in enumerate(todo, 1):
        sites = fetch_commune_instructions(c["lat"], c["lon"])
        if sites is None:
            continue  # réseau KO : laissé hors cache, repris au prochain run
        cache[c["insee"]] = sites
        if n % 200 == 0:
            json.dump(cache, open(SSP_CACHE, "w"))
            print(f"  {n}/{len(todo)} (cumul {len(cache)})", file=sys.stderr)
    json.dump(cache, open(SSP_CACHE, "w"))
    print(f"✓ cache écrit : {SSP_CACHE} ({len(cache)} communes)", file=sys.stderr)
    return cache


# ── Calcul par commune ─────────────────────────────────────────────────────────
def commune_heritage(c, sites, rayon_km):
    """{activite, plusieurs, distanceKm} pour une commune, ou None si aucun site dans rayon_km."""
    near = []
    for s in sites:
        d = hav_km(c["lat"], c["lon"], s["lat"], s["lon"])
        if d <= rayon_km:
            near.append((d, s))
    if not near:
        return None
    near.sort(key=lambda x: x[0])
    d, s = near[0]
    return {"activite": activite_of(s["nom"]), "plusieurs": len(near) >= 2,
            "distanceKm": round(d, 2)}


def load_communes():
    idx = json.load(open(INDEX))
    communes = [c for c in idx["communes"]
                if c.get("lat") is not None and c.get("lon") is not None]
    return idx, communes


# Témoins VÉRIFIÉS par nom dans l'index (piège PLM = arrondissements).
TEMOINS = {
    "17300": "La Rochelle (Marcel-Paul, usine a gaz — OBLIGATOIRE non-null)",
    "59350": "Lille (bassin industriel ancien)",
    "57463": "Metz (Lorraine siderurgique)",
    "69123": "Lyon (vallee de la chimie proche)",
    "48095": "Mende (rural, attendu null)",
    "15014": "Aurillac (rural, attendu null)",
}


def _matrix(communes, cache):
    by = {c["insee"]: c for c in communes}
    print(f"\n{'commune':52} {'3km':>22} {'5km':>22}", file=sys.stderr)
    for ins, lib in TEMOINS.items():
        c = by.get(ins)
        if not c:
            print(f"{lib:52} {'ABSENT (insee?)':>22}", file=sys.stderr)
            continue
        sites = cache.get(ins, [])

        def fmt(r):
            return ("null" if r is None
                    else f"{r['activite']}{'+' if r['plusieurs'] else ''}@{r['distanceKm']}")
        print(f"{lib:52} {fmt(commune_heritage(c, sites, 3.0)):>22} "
              f"{fmt(commune_heritage(c, sites, 5.0)):>22}", file=sys.stderr)


def _summary(communes, cache, rayon_km):
    n_nonnull, cats = 0, {}
    for c in communes:
        r = commune_heritage(c, cache.get(c["insee"], []), rayon_km)
        if r:
            n_nonnull += 1
            cats[r["activite"]] = cats.get(r["activite"], 0) + 1
    print(f"R={rayon_km}km : {n_nonnull}/{len(communes)} communes non-null", file=sys.stderr)
    print("  par catégorie :", dict(sorted(cats.items(), key=lambda x: -x[1])), file=sys.stderr)


def write_index(communes, idx, cache, rayon_km):
    for c in idx["communes"]:
        if c.get("lat") is None or c.get("lon") is None:
            c["heritageIndustriel"] = None
            continue
        c["heritageIndustriel"] = commune_heritage(c, cache.get(c["insee"], []), rayon_km)
    json.dump(idx, open(INDEX, "w"), ensure_ascii=False)
    print(f"✓ index écrit (R={rayon_km}km)", file=sys.stderr)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--selftest", action="store_true")
    ap.add_argument("--fetch", action="store_true")
    ap.add_argument("--matrix", action="store_true")
    ap.add_argument("--summary", action="store_true")
    ap.add_argument("--write-index", action="store_true")
    ap.add_argument("--refresh", action="store_true")
    ap.add_argument("--rayon", type=float, default=R_KM)
    args = ap.parse_args()

    if args.selftest:
        selftest()
        return
    if args.fetch:
        fetch_all(refresh=args.refresh)
        return

    cache = json.load(open(SSP_CACHE)) if os.path.exists(SSP_CACHE) else {}
    idx, communes = load_communes()
    if args.matrix:
        _matrix(communes, cache)
        return
    if args.summary:
        _summary(communes, cache, args.rayon)
        return
    if args.write_index:
        write_index(communes, idx, cache, args.rayon)
        return
    print("rien à faire (voir --selftest / --fetch / --matrix / --write-index)", file=sys.stderr)


if __name__ == "__main__":
    main()
