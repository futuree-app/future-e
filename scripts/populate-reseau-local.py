#!/usr/bin/env python3
"""populate-reseau-local.py — mobilité du quotidien : accès à un réseau TC à portée de marche.

Couverture = somme pondérée (1 - d/R) des arrêts TC dédoublonnés dans un petit rayon R autour
du centroïde communal ; × facteur mode (tram/métro). Normalisé en percentile PARMI LES
COMMUNES DESSERVIES (zéro épinglé -> null). cf. spec 2026-06-04.

Source UNIQUE : OpenStreetMap via Overpass (bus_stop + platform + tram_stop + stations métro),
tuilée par bbox (métropole + DOM), cachée par tuile (résumable). Choisie après constat que le
CSV GTFS national a des trous par réseau (Lyon : 38 arrêts vs 2103 dans OSM). OSM est uniforme,
courant, et porte le mode dans ses tags.

Venv .venv-bpe (numpy). Modes :
    .venv-bpe/bin/python scripts/populate-reseau-local.py --selftest
    .venv-bpe/bin/python scripts/populate-reseau-local.py --summary
    .venv-bpe/bin/python scripts/populate-reseau-local.py --probe
    .venv-bpe/bin/python scripts/populate-reseau-local.py --matrix
    .venv-bpe/bin/python scripts/populate-reseau-local.py --write-index
"""
import json, os, sys, math, argparse, bisect, shutil, urllib.request, urllib.parse
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX = os.path.join(ROOT, "data", "comparateur-index.json")
CACHE = os.path.join(ROOT, "data", ".cache")
OSM_TILE_DIR = os.path.join(CACHE, "osm-stops-tiles")
OUT_CACHE = os.path.join(CACHE, "communes-reseau-local.json")

# Miroirs Overpass (le principal renvoie souvent 504) : essayés dans l'ordre, avec retry.
OVERPASS_MIRRORS = [
    "https://overpass.openstreetmap.fr/api/interpreter",
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
]
# Tuilage : France métropolitaine + DOM, tuiles de 2°, sautées si vides (océan).
METRO_BBOX = (41.0, -5.6, 51.6, 9.8)   # (S, W, N, E)
DOM_BBOXES = [
    (15.7, -61.9, 16.6, -60.9),   # Guadeloupe
    (14.3, -61.3, 14.9, -60.7),   # Martinique
    (2.0, -54.8, 6.0, -51.5),     # Guyane
    (-21.5, 55.1, -20.8, 56.0),   # Réunion
    (-13.1, 44.9, -12.5, 45.4),   # Mayotte
]
TILE_DEG = 2.0

# Rayon d'accès « pas de porte » (marche), en mètres. Figé par la sonde (Task 3) : 1000 m.
# À 500 m la détection du mode casse (centroïde rarement à <500 m d'un arrêt tram/métro) ;
# à 1500 m on sort du pas-de-porte. 1000 m = mode bien capté + échelle marchable (~12 min).
RADIUS_M = 1000
# Plancher de crédibilité : accès pondéré minimal (couverture × mode) pour être « desservie ».
# En-dessous -> non desservie (null). Évite que « 1 arrêt fantôme à 900 m » compte comme un
# réseau du quotidien (sinon un village marginal ressort à ~71/100). Choix produit, pas
# technique : le critère mesure « se déplacer sans voiture », pas « un arrêt existe quelque
# part ». 1.0 ≈ un arrêt vraiment proche, ou deux à ~500 m. cf. spec / sonde.
ACCESS_FLOOR = 1.0
DEDUP_DEG = 0.0005   # ~55 m : un arrêt unique par cellule (anti double-comptage OSM)
CELL = 0.02          # grille de recherche couverture (~2,2 km lat)
NEI = 2              # ±2 cellules couvrent 1,5 km partout (lon ~0.0215° à 51°N)
R_EARTH = 6371.0


def hav_km(lat0, lon0, lats, lons):
    p0 = math.radians(lat0); lp = np.radians(lats)
    a = np.sin((lp - p0) / 2) ** 2 + math.cos(p0) * np.cos(lp) * np.sin(np.radians(lons - lon0) / 2) ** 2
    return 2 * R_EARTH * np.arcsin(np.sqrt(a))


def weight(d_km, r_km):
    """Poids de proximité linéaire, fort (appelé uniquement pour d <= r)."""
    return 1.0 - d_km / r_km


def mode_factor(tram, metro):
    """Facteur de rehaussement par mode structurant. Métro > tram > bus."""
    return 2.0 if metro else (1.5 if tram else 1.0)


def normalize_access(raws, floor=ACCESS_FLOOR):
    """Sous le plancher -> None ; percentile 1-100 PARMI les communes desservies (raw >= floor)."""
    pos = sorted(r for r in raws if r >= floor)
    m = len(pos)
    out = []
    for r in raws:
        if r < floor or m == 0:
            out.append(None)
        else:
            out.append(max(1, round(100 * bisect.bisect_right(pos, r) / m)))
    return out


def cell_key(lat, lon, size):
    return (int(math.floor(lat / size)), int(math.floor(lon / size)))


# ── Acquisition OSM (tuilée, cachée) ─────────────────────────────────────────
def overpass_query(s, w, n, e):
    bb = f"({s},{w},{n},{e})"
    return (f'[out:json][timeout:180];('
            f'node["highway"="bus_stop"]{bb};'
            f'node["public_transport"="platform"]{bb};'
            f'node["railway"="tram_stop"]{bb};'
            f'node["railway"="station"]["station"="subway"]{bb};'
            f'node["railway"="station"]["subway"="yes"]{bb};'
            f'node["station"="subway"]{bb};'
            f');out body;')


def fetch_tile(query, dest):
    """Interroge les miroirs (2 essais chacun) jusqu'à un JSON Overpass valide (elements peut
    être vide pour une tuile océan = succès). Écrit la réponse brute dans dest, retourne elements."""
    payload = urllib.parse.urlencode({"data": query}).encode()
    last = None
    for url in OVERPASS_MIRRORS:
        for attempt in (1, 2):
            try:
                req = urllib.request.Request(url, data=payload,
                                             headers={"User-Agent": "futur-e/populate-reseau-local"})
                with urllib.request.urlopen(req, timeout=300) as r:
                    body = r.read()
                doc = json.loads(body)
                if "elements" in doc:
                    with open(dest, "wb") as f:
                        f.write(body)
                    return doc["elements"]
                last = f"{url}: pas d'elements"
            except Exception as e:  # noqa: BLE001 (résilience réseau volontaire)
                last = f"{url} (essai {attempt}) : {e}"
    raise RuntimeError(f"tuile Overpass échouée. Dernier : {last}")


def tiles():
    out = []
    s0, w0, n0, e0 = METRO_BBOX
    s = s0
    while s < n0:
        w = w0
        while w < e0:
            out.append((round(s, 3), round(w, 3), round(min(s + TILE_DEG, n0), 3), round(min(w + TILE_DEG, e0), 3)))
            w += TILE_DEG
        s += TILE_DEG
    return out + DOM_BBOXES


def classify(tags):
    """(is_tram, is_metro) depuis les tags OSM. Tout le reste = bus."""
    rw = tags.get("railway")
    is_tram = rw == "tram_stop"
    is_metro = tags.get("station") == "subway" or tags.get("subway") == "yes"
    return is_tram, is_metro


def load_osm(refresh=False):
    """Charge tous les arrêts TC d'OSM (tuilé, caché). Retourne :
    (slat, slon) arrêts dédoublonnés ~55 m ; (tlat, tlon) tram ; (mlat, mlon) métro."""
    if refresh and os.path.exists(OSM_TILE_DIR):
        shutil.rmtree(OSM_TILE_DIR)
    os.makedirs(OSM_TILE_DIR, exist_ok=True)
    seen = set()
    slat, slon, tlat, tlon, mlat, mlon = [], [], [], [], [], []
    tl = tiles()
    for i, (s, w, n, e) in enumerate(tl):
        dest = os.path.join(OSM_TILE_DIR, f"t_{s}_{w}.json")
        if os.path.exists(dest):
            elements = json.load(open(dest)).get("elements", [])
        else:
            elements = fetch_tile(overpass_query(s, w, n, e), dest)
            print(f"  tuile {i+1}/{len(tl)} ({s},{w}) : {len(elements)} nœuds", file=sys.stderr)
        for el in elements:
            la, lo = el.get("lat"), el.get("lon")
            if la is None or lo is None:
                continue
            is_tram, is_metro = classify(el.get("tags") or {})
            if is_tram:
                tlat.append(la); tlon.append(lo)
            if is_metro:
                mlat.append(la); mlon.append(lo)
            k = cell_key(la, lo, DEDUP_DEG)
            if k in seen:
                continue
            seen.add(k); slat.append(la); slon.append(lo)
    print(f"OSM arrêts dédoublonnés : {len(slat)} | tram : {len(tlat)} | métro : {len(mlat)}", file=sys.stderr)
    return (np.array(slat, "float64"), np.array(slon, "float64"),
            np.array(tlat, "float64"), np.array(tlon, "float64"),
            np.array(mlat, "float64"), np.array(mlon, "float64"))


def load_communes():
    idx = json.load(open(INDEX))
    communes = [c for c in idx["communes"] if c.get("lat") is not None and c.get("lon") is not None]
    return idx, communes


# ── Calcul ───────────────────────────────────────────────────────────────────
def compute_access(communes, slat, slon, tlat, tlon, mlat, mlon, radius_m):
    """Pour chaque commune : couverture pondérée des arrêts dans R, × facteur mode.
    Retourne (raws, trams, metros, arret_kms, nstops) alignés sur `communes`."""
    r_km = radius_m / 1000.0
    grid = {}
    for j in range(len(slat)):
        grid.setdefault(cell_key(slat[j], slon[j], CELL), []).append(j)
    raws, trams, metros, arret_kms, nstops = [], [], [], [], []
    for c in communes:
        clat, clon = c["lat"], c["lon"]
        ci, cj = cell_key(clat, clon, CELL)
        idxs = []
        for di in range(-NEI, NEI + 1):
            for dj in range(-NEI, NEI + 1):
                idxs += grid.get((ci + di, cj + dj), [])
        cov = 0.0; nearest = None; ns = 0
        if idxs:
            idxs = np.array(idxs)
            d = hav_km(clat, clon, slat[idxs], slon[idxs])
            win = d <= r_km
            ns = int(win.sum())
            if ns:
                cov = float(weight(d[win], r_km).sum())
                nearest = round(float(d[win].min()), 3)
        tram = bool(len(tlat) and (hav_km(clat, clon, tlat, tlon) <= r_km).any())
        metro = bool(len(mlat) and (hav_km(clat, clon, mlat, mlon) <= r_km).any())
        raws.append(cov * mode_factor(tram, metro))
        trams.append(tram); metros.append(metro); arret_kms.append(nearest); nstops.append(ns)
    return raws, trams, metros, arret_kms, nstops


# Communes témoins (INSEE) pour sonde + matrice (liste demandée par le porteur).
TEMOINS = {
    "75101": "Paris 1er",
    "69381": "Lyon 1er",
    "67482": "Strasbourg",
    "33063": "Bordeaux",
    "35238": "Rennes",
    "17300": "La Rochelle",
    "56260": "Vannes (petite ville desservie)",
    "56157": "Plaudren (village rural)",
}


def selftest():
    assert weight(0.0, 1.0) == 1.0
    assert weight(0.5, 1.0) == 0.5
    assert abs(weight(1.0, 1.0)) < 1e-9
    assert mode_factor(False, False) == 1.0
    assert mode_factor(True, False) == 1.5
    assert mode_factor(False, True) == 2.0
    assert mode_factor(True, True) == 2.0
    assert normalize_access([0, 0, 5, 10, 20]) == [None, None, 33, 67, 100]
    assert normalize_access([0, 0, 0]) == [None, None, None]
    # plancher : sous ACCESS_FLOOR (1.0) -> None ; percentile parmi les >= plancher.
    assert normalize_access([0.5, 1.0, 2.0, 5.0]) == [None, 33, 67, 100]
    assert cell_key(0.0, 0.0, 0.0005) == (0, 0)
    assert cell_key(0.00051, 0.0, 0.0005) == (1, 0)
    assert cell_key(-0.00001, 0.0, 0.0005) == (-1, 0)
    assert classify({"railway": "tram_stop"}) == (True, False)
    assert classify({"station": "subway"}) == (False, True)
    assert classify({"highway": "bus_stop"}) == (False, False)
    print("✓ selftest OK", file=sys.stderr)


def best_mode(tram, metro, served):
    return "métro" if metro else "tram" if tram else "bus" if served else "—"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--selftest", action="store_true")
    ap.add_argument("--summary", action="store_true")
    ap.add_argument("--probe", action="store_true")
    ap.add_argument("--matrix", action="store_true")
    ap.add_argument("--write-index", action="store_true")
    ap.add_argument("--refresh-osm", action="store_true")
    args = ap.parse_args()

    if args.selftest:
        selftest()
        return

    if args.summary:
        idx, communes = load_communes()
        print(f"communes géolocalisées : {len(communes)}", file=sys.stderr)
        load_osm(refresh=args.refresh_osm)
        return

    if args.probe:
        idx, communes = load_communes()
        data = load_osm(refresh=args.refresh_osm)
        by = {c["insee"]: c for c in communes}
        sel = [by[i] for i in TEMOINS if i in by]
        probe = {r: compute_access(sel, *data, r) for r in (500, 1000, 1500)}
        print(f"\n{'commune':30} " + "".join(f"{f'R={r}m (n/mode/cov)':>22}" for r in (500, 1000, 1500)), file=sys.stderr)
        for k, c in enumerate(sel):
            cells = []
            for r in (500, 1000, 1500):
                raws, trams, metros, aks, ns = probe[r]
                md = best_mode(trams[k], metros[k], raws[k] > 0)
                cells.append(f"{ns[k]:4d} {md:>5} {raws[k]:7.1f}")
            print(f"{TEMOINS[c['insee']]:30} " + "".join(f"{x:>22}" for x in cells), file=sys.stderr)
        raws_all, _, _, _, _ = compute_access(communes, *data, 1000)
        z = sum(1 for x in raws_all if x <= 0)
        print(f"\nmasse de zéros @1000m : {z}/{len(raws_all)} non desservies ({100*z//len(raws_all)} %)", file=sys.stderr)
        return

    # Calcul national complet (commun à --matrix et --write-index et défaut).
    idx, communes = load_communes()
    data = load_osm(refresh=args.refresh_osm)
    print(f"communes géolocalisées : {len(communes)} | rayon : {RADIUS_M} m", file=sys.stderr)
    raws, trams, metros, aks, nstops = compute_access(communes, *data, RADIUS_M)
    acces = normalize_access(raws)
    served = sum(1 for a in acces if a is not None)
    print(f"desservies : {served}/{len(communes)} ({100*served//len(communes)} %)", file=sys.stderr)

    rec = {}
    for i, c in enumerate(communes):
        rec[c["insee"]] = None if acces[i] is None else {
            "acces": acces[i], "tram": trams[i], "metro": metros[i], "arret_km": aks[i]}
    os.makedirs(CACHE, exist_ok=True)
    # Forme { meta, communes } : le meta de complétude autorise le patch d'attestations (lot 2a) à refuser un
    # cache partiel. Le patch accepte aussi la forme plate héritée (records = cache.communes ?? cache).
    json.dump({"meta": {"complete": True, "failedTiles": [], "communeCount": len(idx["communes"])}, "communes": rec}, open(OUT_CACHE, "w"))
    print(f"✓ cache écrit : {OUT_CACHE}", file=sys.stderr)

    if args.matrix:
        ridx = {c["insee"]: i for i, c in enumerate(communes)}
        served_scores = [a for a in acces if a is not None]
        print(f"\n{'commune':34} {'arrêts':>7} {'mode':>7} {'score':>6}", file=sys.stderr)
        for ins, lib in TEMOINS.items():
            if ins not in ridx:
                print(f"{lib:34} {'ABSENT':>7}", file=sys.stderr); continue
            i = ridx[ins]
            md = best_mode(trams[i], metros[i], acces[i] is not None)
            print(f"{lib:34} {nstops[i]:>7} {md:>7} {str(acces[i]):>6}", file=sys.stderr)
        import collections
        buckets = collections.Counter((s - 1) // 10 * 10 for s in served_scores)
        print(f"\ndistribution score (desservies) : {dict(sorted(buckets.items()))}", file=sys.stderr)
        print(f"desservies min/max : {min(served_scores)}/{max(served_scores)}", file=sys.stderr)

    if args.write_index:
        # Champ FRÈRE reseauLocalMeasured (lot 2a) : reseauLocal INCHANGÉ (résultat du scoring), on atteste
        # seulement la PROVENANCE (mesurée = géolocalisée). Une commune sous plancher a reseauLocal None ET
        # reseauLocalMeasured True (absence attestée) ; une commune non géolocalisée a measured False.
        geoloc = {c["insee"] for c in communes}
        for c in idx["communes"]:
            ins = c["insee"]
            c["reseauLocal"] = rec.get(ins)          # objet desservie, ou None sous plancher (inchangé)
            c["reseauLocalMeasured"] = ins in geoloc  # provenance : mesurée (True) / non géolocalisée (False)
        json.dump(idx, open(INDEX, "w"))
        print("✓ index patché (reseauLocal inchangé + reseauLocalMeasured)", file=sys.stderr)


if __name__ == "__main__":
    main()
