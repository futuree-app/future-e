#!/usr/bin/env python3
"""
populate-nature.py — caractère naturel du territoire (critère scoré opt-in).

PRÉCALCUL OFFLINE, environnement géospatial Python requis (rasterio + numpy).
Ce n'est PAS du runtime : il produit un champ `nature` ajouté à l'index ; le
moteur (node) ne fait que lire ce champ. cf. NATURE_TERRITORIAL.md (doctrine V1).

Doctrine figée (2026-06-02) :
 - Source : OSO 2023 (CESBIO/Théia, raster 10 m, EPSG:2154).
 - Définition ÉLARGIE « perçu comme naturel » = naturel strict + PRAIRIES.
   Exclus : artificialisé, grandes cultures intensives, vignes, vergers.
 - Maille : « nature à proximité », rayon 15 km pondéré surface (pas la commune).
 - On mesure un PAYSAGE perçu naturel, pas la biodiversité (cf. limites du doc).

Sorties (pas de courbe de score figée ici, volontairement) :
 - brut_pct      : % couvert naturel élargi DANS la commune
 - radius_pct    : % couvert naturel élargi dans 15 km (pondéré surface)
 - composition   : ventilation (forêt / prairies / landes-pelouses / minéral-dunes /
                   eau / agricole / artificialisé), en % de la surface terrestre
Le mapping de classes reste lisible/ajustable (vignes/vergers en exclusion par défaut).

Entrées attendues (cache gitignoré data/cache-nature/) :
 - oso2023.tif                 (OSO 2023, GeoTIFF)
 - contours/<dep>.json         (geo.api.gouv.fr : communes du dept avec contour)
Usage : python3 populate-nature.py            (calcule, écrit le cache, imprime l'analyse)
        python3 populate-nature.py --write-index   (en plus, patche data/comparateur-index.json)
"""
import json, os, sys, time, argparse, math, bisect
import numpy as np
import rasterio
from rasterio.mask import mask
from rasterio.warp import transform_geom

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, "data", "cache-nature")
INDEX = os.path.join(ROOT, "data", "comparateur-index.json")
TIF = os.path.join(CACHE, "oso2023.tif")
CONTOURS = os.path.join(CACHE, "contours")
OUT = os.path.join(CACHE, "communes-nature.json")
RAYON_KM = 15

# Nomenclature OSO standard (codes 1-23).
ARTI = {1, 2, 3, 4}
GDCULT = {5, 6, 7, 8, 9, 10, 11, 12}     # colza, céréales, protéagineux, soja, tournesol, maïs, riz, tubercules
PRAIRIE = {13}
VERGER = {14}
VIGNE = {15}
FORET = {16, 17}
PELOUSE = {18}
LANDE = {19}
MINERAL = {20}
DUNE = {21}
GLACIER = {22}
EAU = {23}
NAT_STRICT = FORET | PELOUSE | LANDE | MINERAL | DUNE | GLACIER | EAU
ELARGI = NAT_STRICT | PRAIRIE        # définition V1 figée

def load_contours():
    geom = {}
    for f in os.listdir(CONTOURS):
        if not f.endswith(".json"):
            continue
        try:
            for c in json.load(open(os.path.join(CONTOURS, f))):
                if c.get("contour"):
                    geom[c["code"]] = c["contour"]
        except Exception as e:
            print(f"  ! {f}: {e}", file=sys.stderr)
    return geom

def haversine_np(lat0, lon0, lats, lons):
    R = 6371.0
    r = math.pi / 180
    dla = (lats - lat0) * r
    dlo = (lons - lon0) * r
    a = np.sin(dla/2)**2 + math.cos(lat0*r) * np.cos(lats*r) * np.sin(dlo/2)**2
    return 2 * R * np.arcsin(np.sqrt(a))

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--write-index", action="store_true")
    ap.add_argument("--recompute", action="store_true", help="refait le zonal même si le cache existe")
    args = ap.parse_args()

    idx = json.load(open(INDEX))
    communes = idx["communes"]

    # Réutilise le cache si présent (le zonal coûte ~6 min) sauf --recompute.
    if os.path.exists(OUT) and not args.recompute:
        rec = json.load(open(OUT))
        print(f"cache rechargé : {len(rec)} communes (zonal sauté)", file=sys.stderr)
        finalize(rec, idx, communes, args)
        return rec, communes

    geom = load_contours()
    print(f"contours chargés : {len(geom)} | communes index : {len(communes)}", file=sys.stderr)

    ds = rasterio.open(TIF)
    cats = {"foret": FORET, "prairies": PRAIRIE, "landes_pelouses": LANDE | PELOUSE,
            "mineral_dunes": MINERAL | DUNE | GLACIER, "eau": EAU,
            "agricole": GDCULT | VIGNE | VERGER, "artificialise": ARTI}

    rec = {}
    t0 = time.time(); done = 0; missing = 0
    for c in communes:
        code = c["insee"]
        g = geom.get(code)
        if not g:
            missing += 1
            continue
        try:
            g2 = transform_geom("EPSG:4326", ds.crs, g)
            arr, _ = mask(ds, [g2], crop=True)
            a = arr[0]
            v = a[(a > 0) & (a <= 23)]
            tot = int(v.size)
            if tot == 0:
                continue
            nat = int(np.isin(v, list(ELARGI)).sum())
            comp = {k: round(100 * int(np.isin(v, list(s)).sum()) / tot, 1) for k, s in cats.items()}
            rec[code] = {"nat_px": nat, "tot_px": tot,
                         "brut_pct": round(100 * nat / tot, 1), "composition": comp}
            done += 1
            if done % 5000 == 0:
                print(f"  {done} communes... ({time.time()-t0:.0f}s)", file=sys.stderr)
        except Exception:
            pass
    print(f"zonal : {done} communes en {time.time()-t0:.0f}s ; {missing} sans contour", file=sys.stderr)

    # Rayon : centroïdes depuis l'index, grille spatiale ~0,15°.
    pts = [(c["insee"], c.get("lat"), c.get("lon")) for c in communes if c["insee"] in rec and c.get("lat") is not None]
    lats = np.array([p[1] for p in pts]); lons = np.array([p[2] for p in pts])
    codes = [p[0] for p in pts]
    natpx = np.array([rec[c]["nat_px"] for c in codes], dtype=np.int64)
    totpx = np.array([rec[c]["tot_px"] for c in codes], dtype=np.int64)
    cell = 0.18
    grid = {}
    for i, c in enumerate(codes):
        grid.setdefault((int(lats[i]//cell), int(lons[i]//cell)), []).append(i)
    for i, c in enumerate(codes):
        ci, cj = int(lats[i]//cell), int(lons[i]//cell)
        idxs = []
        for di in (-1, 0, 1):
            for dj in (-1, 0, 1):
                idxs += grid.get((ci+di, cj+dj), [])
        idxs = np.array(idxs)
        d = haversine_np(lats[i], lons[i], lats[idxs], lons[idxs])
        near = idxs[d <= RAYON_KM]
        nsum = int(natpx[near].sum()); tsum = int(totpx[near].sum())
        rec[c]["radius_pct"] = round(100 * nsum / tsum, 1) if tsum else None

    finalize(rec, idx, communes, args)
    return rec, communes

def finalize(rec, idx, communes, args):
    # Score = percentile national du rayon (ranking), distinct du brut (réalité physique).
    rp = sorted(r["radius_pct"] for r in rec.values() if r.get("radius_pct") is not None)
    n = len(rp)
    for r in rec.values():
        v = r.get("radius_pct")
        r["score"] = round(100 * bisect.bisect_right(rp, v) / n) if (v is not None and n) else None
    json.dump(rec, open(OUT, "w"))
    print(f"✓ cache écrit : {OUT} ({len(rec)} communes, score percentile ajouté)", file=sys.stderr)

    if args.write_index:
        for c in communes:
            r = rec.get(c["insee"])
            c["nature"] = ({"score": r["score"], "brut_pct": r["brut_pct"],
                            "radius_pct": r.get("radius_pct"), "composition": r["composition"]}
                           if r and r.get("score") is not None else None)
        json.dump(idx, open(INDEX, "w"))
        print("✓ index patché (champ nature : score + brut_pct + radius_pct + composition)", file=sys.stderr)

if __name__ == "__main__":
    main()
