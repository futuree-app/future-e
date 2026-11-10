"""FUT-182 · phase A, reprise · D'où vient le point de référence de l'index, et que changerait un autre point pour C1 ?

Lecture seule. Dépendances : numpy, shapely ≥ 2, pyproj.

Usage (depuis la racine du dépôt) :
    python docs/audits/2026-11-09-fut182-oso-phase-a/point_reference.py CACHE_DIR GEOAPI_POINTS_JSON [--out RESULTATS_JSON]

  CACHE_DIR            data/cache-nature/ du dépôt principal (communes-nature.json + contours/).
  GEOAPI_POINTS_JSON   https://geo.api.gouv.fr/communes?fields=code,nom,centre,mairie,surface,population&format=json
                       (~6,5 Mo, sans contours).

Candidats comparés : le point de l'index (`data_climat.json`, column01/02), le `centre` de geo.api.gouv.fr, la `mairie` de
geo.api.gouv.fr, le centroïde du contour, le centre de son emprise, un point intérieur (`point_on_surface`).
C1 est recalculé de façon APPROCHÉE (surfaces, composition moyenne par commune, comme tampon_contours.py) au point de la
mairie, pour mesurer la sensibilité de la mesure au choix du point. Le « centre bâti » (barycentre des pixels OSO bâtis)
exige le raster : il n'est pas calculé ici.
"""
import bisect
import gzip
import json
import sys
import time
from collections import Counter
from pathlib import Path

import numpy as np
import shapely
from pyproj import Transformer

RACINE = Path(__file__).resolve().parents[3]
args = [a for a in sys.argv[1:] if not a.startswith("--")]
if len(args) < 2:
    sys.exit(__doc__)
CACHE_DIR, GEO = Path(args[0]), Path(args[1])
OUT = Path(sys.argv[sys.argv.index("--out") + 1]) if "--out" in sys.argv else None
R = {}

rec = json.load(open(CACHE_DIR / "communes-nature.json", encoding="utf8"))
idx = json.load(gzip.open(RACINE / "data/comparateur-index.json.gz"))
par_code = {c["insee"]: c for c in idx["communes"]}
geo = {g["code"]: g for g in json.load(open(GEO, encoding="utf8"))}
T = Transformer.from_crs("EPSG:4326", "EPSG:2154", always_xy=True)


def proj_geom(gj):
    g = shapely.geometry.shape(gj)
    return shapely.transform(g, lambda xy: np.column_stack(T.transform(xy[:, 0], xy[:, 1])))


contours = {}
for f in sorted((CACHE_DIR / "contours").glob("*.json")):
    for c in json.load(open(f, encoding="utf8")):
        if c.get("contour"):
            contours[c["code"]] = proj_geom(c["contour"])

codes = [k for k in sorted(contours) if k in rec and par_code.get(k, {}).get("lat") is not None]
N = len(codes)
G = np.array([contours[k] for k in codes])


def pts(lonlat):
    x, y = T.transform([p[0] for p in lonlat], [p[1] for p in lonlat])
    return shapely.points(np.column_stack([x, y]))


P_index = pts([(par_code[k]["lon"], par_code[k]["lat"]) for k in codes])
avec_geo = np.array([k in geo and geo[k].get("centre") is not None for k in codes])
avec_mairie = np.array([k in geo and geo[k].get("mairie") is not None for k in codes])
P_centre = pts([tuple(geo[k]["centre"]["coordinates"]) if a else (par_code[k]["lon"], par_code[k]["lat"]) for k, a in zip(codes, avec_geo)])
P_mairie = pts([tuple(geo[k]["mairie"]["coordinates"]) if a else (par_code[k]["lon"], par_code[k]["lat"]) for k, a in zip(codes, avec_mairie)])
P_centroide = shapely.centroid(G)
b = shapely.bounds(G)
P_emprise = shapely.points((b[:, 0] + b[:, 2]) / 2, (b[:, 1] + b[:, 3]) / 2)
P_surface = shapely.point_on_surface(G)

# ── 1. Identité du point de l'index ───────────────────────────────────────────────────────────────────────
egal_centre = np.array([avec_geo[i] and abs(geo[k]["centre"]["coordinates"][1] - par_code[k]["lat"]) < 1e-9
                        and abs(geo[k]["centre"]["coordinates"][0] - par_code[k]["lon"]) < 1e-9 for i, k in enumerate(codes)])


def dist(a, bb):
    return shapely.distance(a, bb)


def q(v):
    v = np.asarray(v)
    return {"mediane": round(float(np.median(v))), "p90": round(float(np.percentile(v, 90))), "p99": round(float(np.percentile(v, 99))), "max": round(float(v.max()))}


ident = {
    "communes": N,
    "geoapi_centre_disponible": int(avec_geo.sum()),
    "geoapi_mairie_disponible": int(avec_mairie.sum()),
    "index_egal_geoapi_centre_4_decimales": int(egal_centre.sum()),
    "distance_index_vers_m": {
        "geoapi_centre": q(dist(P_index, P_centre)[avec_geo]),
        "centroide_contour": q(dist(P_index, P_centroide)),
        "centre_emprise": q(dist(P_index, P_emprise)),
        "point_interieur": q(dist(P_index, P_surface)),
        "mairie": q(dist(P_index, P_mairie)[avec_mairie]),
    },
    "index_a_moins_de_20m_du": {
        "centroide": int((dist(P_index, P_centroide) < 20).sum()),
        "centre_emprise": int((dist(P_index, P_emprise) < 20).sum()),
        "point_interieur": int((dist(P_index, P_surface) < 20).sum()),
    },
    "dans_le_contour": {
        "index": int(shapely.contains(G, P_index).sum()),
        "mairie": int(shapely.contains(G, P_mairie)[avec_mairie].sum()),
        "centroide": int(shapely.contains(G, P_centroide).sum()),
    },
    "hors_contour_a_plus_de_50m": {
        "index": int((shapely.distance(G, P_index) > 50).sum()),
        "mairie": int(((shapely.distance(G, P_mairie) > 50) & avec_mairie).sum()),
        "centroide": int((shapely.distance(G, P_centroide) > 50).sum()),
    },
}
print(json.dumps(ident, ensure_ascii=False))
R["identite"] = ident

d_m = dist(P_index, P_mairie)
loin = np.argsort(-np.where(avec_mairie, d_m, 0))[:20]
R["mairie_la_plus_loin_du_point"] = [(codes[i], par_code[codes[i]]["nom"], round(float(d_m[i] / 1000), 2),
                                       round(float(shapely.area(G[i]) / 1e6), 1)) for i in loin]
print("mairie la plus éloignée :", R["mairie_la_plus_loin_du_point"][:10])
seuils = [500, 1000, 2000, 5000]
R["mairie_distance_paliers"] = {f">{s}m": int(((d_m > s) & avec_mairie).sum()) for s in seuils}
print(R["mairie_distance_paliers"])

# ── 2. Sensibilité de C1 au point (approché) ──────────────────────────────────────────────────────────────
nat = np.array([rec[k]["nat_px"] for k in codes], dtype=float)
tot = np.array([rec[k]["tot_px"] for k in codes], dtype=float)
eau = np.array([rec[k]["composition"]["eau"] for k in codes]) / 100 * tot
A_area = shapely.area(G)
tree = shapely.STRtree(G)


def c1(points, nom):
    t0 = time.time()
    num_t = np.zeros(N); den_t = np.zeros(N)
    discs = shapely.buffer(points, 15000, quad_segs=16)
    for i in range(N):
        cand = tree.query(discs[i])
        w = np.clip(shapely.area(shapely.intersection(discs[i], G[cand])) / A_area[cand], 0, 1)
        num_t[i] = (w * (nat[cand] - eau[cand])).sum(); den_t[i] = (w * (tot[cand] - eau[cand])).sum()
    print(f"  C1 {nom} : {time.time() - t0:.0f}s", flush=True)
    return np.round(100 * num_t / den_t, 1)


def score(v):
    srt = sorted(v)
    return np.array([round(100 * bisect.bisect_right(srt, x) / len(srt)) for x in v])


def bandes(s):
    srt = np.sort(s)
    return np.searchsorted(srt, s, "left") / len(s), np.searchsorted(srt, s, "right") / len(s)


V = {"index": c1(P_index, "index"), "mairie": c1(P_mairie, "mairie")}
S = {k: score(v) for k, v in V.items()}
d = V["mairie"] - V["index"]; ds = S["mairie"] - S["index"]
la, ha = bandes(S["index"]); lb, hb = bandes(S["mairie"])
va = np.where(ha <= 0.2, "m", np.where(la >= 0.8, "s", "n")); vb = np.where(hb <= 0.2, "m", np.where(lb >= 0.8, "s", "n"))
sens = {
    "delta_radius_terres": {"abs_mediane": round(float(np.median(np.abs(d))), 2), "p99_abs": round(float(np.percentile(np.abs(d), 99)), 1),
                            "abs_ge_2": int((np.abs(d) >= 2).sum()), "abs_ge_5": int((np.abs(d) >= 5).sum()), "abs_ge_10": int((np.abs(d) >= 10).sum()),
                            "min": round(float(d.min()), 1), "max": round(float(d.max()), 1)},
    "score_change": int((ds != 0).sum()), "score_abs_ge_5": int((np.abs(ds) >= 5).sum()), "score_abs_ge_10": int((np.abs(ds) >= 10).sum()),
    "verdict_rang_change": int((va != vb).sum()),
    "plus_forts": [(codes[i], par_code[codes[i]]["nom"], round(float(d_m[i] / 1000), 1), float(V["index"][i]), float(V["mairie"][i]), int(S["index"][i]), int(S["mairie"][i]))
                   for i in np.argsort(-np.abs(d))[:15]],
}
print(json.dumps(sens, ensure_ascii=False))
R["sensibilite_C1_mairie_vs_index"] = sens
cas = ["13004", "13096", "77186", "50218", "74056", "2B096", "33063", "17094", "34301", "85113", "38185", "06088", "45234", "49092", "50129"]
R["cas"] = {k: {"nom": par_code[k]["nom"], "distance_mairie_km": round(float(d_m[codes.index(k)] / 1000), 2),
                "C1_terres_index": float(V["index"][codes.index(k)]), "C1_terres_mairie": float(V["mairie"][codes.index(k)])}
            for k in cas if k in codes}
print(json.dumps(R["cas"], ensure_ascii=False))
if OUT:
    OUT.write_text(json.dumps(R, ensure_ascii=False, indent=1, default=lambda o: o.item() if hasattr(o, "item") else str(o)) + "\n", encoding="utf8")
    print("écrit :", OUT)
