"""FUT-182 · phase A · couverture des pixels classés, contours, et méthode C APPROCHÉE (vrai disque ou vrai tampon).

Lecture seule. Dépendances : numpy, shapely ≥ 2, pyproj (environnement virtuel jetable, voir le rapport).

Usage (depuis la racine du dépôt) :
    python docs/audits/2026-11-09-fut182-oso-phase-a/tampon_contours.py CACHE_DIR ARRONDISSEMENTS_JSON [--out RESULTATS_JSON]

  CACHE_DIR             data/cache-nature/ du dépôt principal (communes-nature.json + contours/<dep>.json,
                        contours geo.api.gouv.fr utilisés par populate-nature.py, téléchargés le 02/06/2026).
  ARRONDISSEMENTS_JSON  réponse de https://geo.api.gouv.fr/communes?type=arrondissement-municipal&fields=code,nom,
                        surface,codeParent,centre,contour&format=json (45 arrondissements, ~0,3 Mo).

CE QUE C APPROCHÉE MESURE, ET CE QU'ELLE NE MESURE PAS. Sans raster, une commune coupée par le disque compte pour la
fraction de sa SURFACE comprise dans le disque, avec sa composition MOYENNE (hypothèse d'homogénéité interne). Le
calcul exact sur pixels (phase B) peut s'en écarter, surtout pour les grandes communes hétérogènes (Arles : mer,
étangs, rizières et ville). Ce script chiffre donc l'ordre de grandeur de l'écart géographique B → C, pas C lui-même.

  C1 : disque de 15 km autour du point de référence de l'index (lat/lon de data_climat.json, comme A et B).
  C2 : tampon de 15 km autour du CONTOUR de la commune (la commune entière plus 15 km au-delà de ses limites).
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
CACHE_DIR, ARR = Path(args[0]), Path(args[1])
OUT = Path(sys.argv[sys.argv.index("--out") + 1]) if "--out" in sys.argv else None
R = {}

rec = json.load(open(CACHE_DIR / "communes-nature.json", encoding="utf8"))
idx = json.load(gzip.open(RACINE / "data/comparateur-index.json.gz"))
par_code = {c["insee"]: c for c in idx["communes"]}
T = Transformer.from_crs("EPSG:4326", "EPSG:2154", always_xy=True)


def proj(geojson):
    g = shapely.geometry.shape(geojson)
    return shapely.transform(g, lambda xy: np.column_stack(T.transform(xy[:, 0], xy[:, 1])))


contours = {}
for f in sorted((CACHE_DIR / "contours").glob("*.json")):
    for c in json.load(open(f, encoding="utf8")):
        if c.get("contour"):
            contours[c["code"]] = (c.get("nom"), proj(c["contour"]))
arr = {a["code"]: a for a in json.load(open(ARR, encoding="utf8"))}
print("contours communes", len(contours), "| arrondissements", len(arr))

# ── 1. Validité des contours et couverture des pixels classés ─────────────────────────────────────────────
codes_all = sorted(contours)
geoms = np.array([contours[k][1] for k in codes_all])
aires = shapely.area(geoms)  # m², Lambert-93
invalides = [codes_all[i] for i in np.where(~shapely.is_valid(geoms))[0]]
print("contours invalides :", len(invalides), invalides[:10])
# Couverture = pixels classés 1-23 (10 m × 10 m) / surface du contour. Écart à 1 = pixels non classés (0, 24, 255,
# hors emprise du raster), plus l'effet de bord (pixels dont le centre tombe dans le contour).
cov = {k: rec[k]["tot_px"] * 100 / aires[i] for i, k in enumerate(codes_all) if k in rec}
v = np.array(list(cov.values()))
R["couverture"] = {
    "communes": len(v),
    "quantiles": {q: round(float(np.percentile(v, q)), 4) for q in (0.1, 1, 5, 25, 50, 75, 95, 99, 99.9)},
    "min": round(float(v.min()), 4), "max": round(float(v.max()), 4),
    "sous_99pct": int((v < 0.99).sum()), "sous_95pct": int((v < 0.95).sum()), "sous_90pct": int((v < 0.90).sum()),
    "au_dessus_101pct": int((v > 1.01).sum()),
    "surface_totale_km2": round(float(sum(aires[i] for i, k in enumerate(codes_all) if k in rec)) / 1e6, 1),
    "pixels_classes_km2": round(sum(rec[k]["tot_px"] for k in cov) * 100 / 1e6, 1),
}
basses = sorted(cov.items(), key=lambda kv: kv[1])[:15]
R["couverture"]["plus_basses"] = [(k, contours[k][0], round(x, 3), rec[k]["composition"]["eau"]) for k, x in basses]
print(json.dumps(R["couverture"], ensure_ascii=False))

# Les contours sans OSO : ce sont Paris, Lyon, Marseille (communes entières), absentes de l'index.
sans_oso = [k for k in codes_all if k not in rec]
R["contours_sans_oso"] = [(k, contours[k][0], round(float(aires[codes_all.index(k)]) / 1e6, 2)) for k in sans_oso]
print("contours sans OSO :", R["contours_sans_oso"])

# ── 2. Les 48 périmètres PLM ──────────────────────────────────────────────────────────────────────────────
plm = {}
for parent in ("75056", "69123", "13055"):
    g_parent = contours[parent][1]
    enfants = {k: proj(a["contour"]) for k, a in arr.items() if a["codeParent"] == parent}
    union = shapely.union_all(list(enfants.values()))
    somme = sum(g.area for g in enfants.values())
    plm[parent] = {
        "nom": contours[parent][0], "arrondissements": len(enfants),
        "invalides": [k for k, g in enfants.items() if not g.is_valid],
        "aire_commune_km2": round(g_parent.area / 1e6, 2), "somme_arrondissements_km2": round(somme / 1e6, 2),
        "union_arrondissements_km2": round(union.area / 1e6, 2),
        "recouvrement_entre_arrondissements_km2": round((somme - union.area) / 1e6, 3),
        "commune_hors_union_km2": round(g_parent.difference(union).area / 1e6, 3),
        "union_hors_commune_km2": round(union.difference(g_parent).area / 1e6, 3),
        "surface_api_ha_somme": round(sum(arr[k]["surface"] for k in enfants), 1),
        "aires_km2": {k: round(g.area / 1e6, 2) for k, g in sorted(enfants.items())},
    }
print(json.dumps(plm, ensure_ascii=False))
R["plm"] = plm

# ── 3. Point de référence de l'index ──────────────────────────────────────────────────────────────────────
pts_codes = [k for k in codes_all if k in rec and par_code.get(k, {}).get("lat") is not None]
P = shapely.points(np.column_stack(T.transform([par_code[k]["lon"] for k in pts_codes], [par_code[k]["lat"] for k in pts_codes])))
G = np.array([contours[k][1] for k in pts_codes])
dedans = shapely.contains(G, P)
dist_centroide = shapely.distance(P, shapely.centroid(G))
R["point_reference"] = {
    "communes": len(pts_codes), "hors_de_son_contour": int((~dedans).sum()),
    "hors_exemples": [(pts_codes[i], contours[pts_codes[i]][0], round(float(shapely.distance(P[i], G[i])), 0)) for i in np.where(~dedans)[0][:10]],
    "distance_au_centroide_m": {q: round(float(np.percentile(dist_centroide, q))) for q in (50, 90, 99)},
    "distance_au_centroide_max_m": round(float(dist_centroide.max())),
}
print(json.dumps(R["point_reference"], ensure_ascii=False))

# ── 4. Méthodes C1 (disque) et C2 (tampon du contour), surfaces pondérées ─────────────────────────────────
codes = pts_codes
N = len(codes)
nat = np.array([rec[k]["nat_px"] for k in codes], dtype=float)
tot = np.array([rec[k]["tot_px"] for k in codes], dtype=float)
eau = np.array([rec[k]["composition"]["eau"] for k in codes]) / 100 * tot
A_area = shapely.area(G)
tree = shapely.STRtree(G)
# Les contours sans OSO (PLM) entrent dans le calcul comme surface NON MESURÉE : on la chiffre, on ne l'invente pas.
G_plm = np.array([contours[k][1] for k in sans_oso])
tree_plm = shapely.STRtree(G_plm)


def ponderer(zones, nom):
    t0 = time.time()
    num, den, num_t, den_t, n_comm, plm_km2 = (np.zeros(N) for _ in range(6))
    for i in range(N):
        z = zones[i]
        cand = tree.query(z)
        inter = shapely.area(shapely.intersection(z, G[cand]))
        w = np.clip(inter / A_area[cand], 0, 1)
        num[i] = (w * nat[cand]).sum(); den[i] = (w * tot[cand]).sum()
        num_t[i] = (w * (nat[cand] - eau[cand])).sum(); den_t[i] = (w * (tot[cand] - eau[cand])).sum()
        n_comm[i] = (w > 0.001).sum()
        cp = tree_plm.query(z)
        plm_km2[i] = shapely.area(shapely.intersection(z, G_plm[cp])).sum() / 1e6 if len(cp) else 0
        if i % 5000 == 0:
            print(f"  {nom} {i}/{N} ({time.time() - t0:.0f}s)", flush=True)
    print(f"  {nom} terminé en {time.time() - t0:.0f}s")
    return np.round(100 * num / den, 1), np.round(100 * num_t / den_t, 1), n_comm, plm_km2


discs = shapely.buffer(P, 15000, quad_segs=16)
C1_eau, C1_terres, n1, plm1 = ponderer(discs, "C1")
simpl = shapely.simplify(G, 100)
bufs = shapely.buffer(simpl, 15000, quad_segs=8)
C2_eau, C2_terres, n2, plm2 = ponderer(bufs, "C2")


def score(v):
    srt = sorted(v)
    return np.array([round(100 * bisect.bisect_right(srt, x) / len(srt)) for x in v])


def bandes(s):
    srt = np.sort(s)
    return np.searchsorted(srt, s, "left") / len(s), np.searchsorted(srt, s, "right") / len(s)


# A et B, eau comprise, recalculés ici à l'identique de selection_eau.py.
import math
lats = np.array([par_code[k]["lat"] for k in codes]); lons = np.array([par_code[k]["lon"] for k in codes])


def hav(la, lo, LA, LO):
    r = math.pi / 180
    a = np.sin((LA - la) * r / 2) ** 2 + math.cos(la * r) * np.cos(LA * r) * np.sin((LO - lo) * r / 2) ** 2
    return 2 * 6371 * np.arcsin(np.sqrt(a))


def sel(cell):
    g = {}
    for i in range(N):
        g.setdefault((int(lats[i] // cell), int(lons[i] // cell)), []).append(i)
    out = []
    for i in range(N):
        ci, cj = int(lats[i] // cell), int(lons[i] // cell)
        ids = np.array(sum((g.get((ci + a, cj + b), []) for a in (-1, 0, 1) for b in (-1, 0, 1)), []))
        out.append(ids[hav(lats[i], lons[i], lats[ids], lons[ids]) <= 15])
    return out


SB = sel(0.5)
B_eau = np.array([round(100 * nat[s].sum() / tot[s].sum(), 1) for s in SB])
B_terres = np.array([round(100 * (nat[s] - eau[s]).sum() / (tot[s] - eau[s]).sum(), 1) for s in SB])
A_eau = np.array([par_code[k]["nature"]["radius_pct"] for k in codes])
V = {"A_eau": A_eau, "B_eau": B_eau, "B_terres": B_terres, "C1_eau": C1_eau, "C1_terres": C1_terres, "C2_eau": C2_eau, "C2_terres": C2_terres}
S = {k: score(x) for k, x in V.items()}
assert (S["A_eau"] == np.array([par_code[k]["nature"]["score"] for k in codes])).all(), "score A non reproduit"


def comparer(a, b):
    d = V[b] - V[a]; ds = S[b] - S[a]
    la, ha = bandes(S[a]); lb, hb = bandes(S[b])
    va = np.where(ha <= 0.2, "m", np.where(la >= 0.8, "s", "n")); vb = np.where(hb <= 0.2, "m", np.where(lb >= 0.8, "s", "n"))
    b3 = lambda s: np.where(s >= 66, 0, np.where(s < 34, 2, 1))
    ex = np.argsort(-np.abs(d))[:10]
    return {
        "delta_radius": {"min": round(float(d.min()), 1), "p1": round(float(np.percentile(d, 1)), 1), "p5": round(float(np.percentile(d, 5)), 1),
                         "mediane": round(float(np.median(d)), 1), "p95": round(float(np.percentile(d, 95)), 1),
                         "p99": round(float(np.percentile(d, 99)), 1), "max": round(float(d.max()), 1),
                         "abs_mediane": round(float(np.median(np.abs(d))), 2), "abs_ge_5": int((np.abs(d) >= 5).sum()), "abs_ge_10": int((np.abs(d) >= 10).sum())},
        "score_change": int((ds != 0).sum()), "score_abs_ge_5": int((np.abs(ds) >= 5).sum()), "score_abs_ge_10": int((np.abs(ds) >= 10).sum()),
        "palier_34_66_change": int((b3(S[a]) != b3(S[b])).sum()),
        "seuils": {t: int(((S[a] >= t) != (S[b] >= t)).sum()) for t in (40, 55, 60, 70, 88)},
        "verdict_rang_change": int((va != vb).sum()), "transitions": dict(Counter(f"{x}->{y}" for x, y in zip(va, vb) if x != y)),
        "spearman": round(float(np.corrcoef(S[a], S[b])[0, 1]), 4),
        "plus_forts": [(codes[i], par_code[codes[i]]["nom"], float(V[a][i]), float(V[b][i]), int(S[a][i]), int(S[b][i])) for i in ex],
    }


R["C"] = {
    "B_eau_vers_C1_eau": comparer("B_eau", "C1_eau"),
    "B_eau_vers_C2_eau": comparer("B_eau", "C2_eau"),
    "C1_eau_vers_C2_eau": comparer("C1_eau", "C2_eau"),
    "A_eau_vers_C1_terres": comparer("A_eau", "C1_terres"),
    "A_eau_vers_C2_terres": comparer("A_eau", "C2_terres"),
    "B_terres_vers_C1_terres": comparer("B_terres", "C1_terres"),
    "communes_ponderees_C1": {"mediane": float(np.median(n1)), "min": int(n1.min())},
    "communes_ponderees_C2": {"mediane": float(np.median(n2)), "min": int(n2.min())},
}
cas = ["13004", "13096", "85113", "17094", "34301", "34192", "17299", "74010", "44116", "02100", "28199", "2B096", "33063", "59350",
       "92012", "93048", "94080", "69259", "13041", "13022", "13005", "69266"]
R["cas"] = {k: {"nom": par_code[k]["nom"], **{m: float(V[m][codes.index(k)]) for m in V}, **{"score_" + m: int(S[m][codes.index(k)]) for m in V},
                "plm_km2_C1": round(float(plm1[codes.index(k)]), 2), "plm_km2_C2": round(float(plm2[codes.index(k)]), 2)}
            for k in cas if k in codes}
touchees1 = np.where(plm1 > 0.01)[0]; touchees2 = np.where(plm2 > 0.01)[0]
disque = np.pi * 15 ** 2
R["plm_voisinage"] = {
    "communes_dont_le_disque_C1_touche_PLM": int(len(touchees1)),
    "part_du_disque_sans_oso": {"mediane": round(float(np.median(plm1[touchees1] / disque)), 3), "max": round(float(plm1.max() / disque), 3)},
    "communes_dont_le_tampon_C2_touche_PLM": int(len(touchees2)),
    "par_ville_C1": dict(Counter(par_code[codes[i]]["dept"] for i in touchees1)),
}
# A et B ignorent aussi PLM : combien de communes ont un centre d'arrondissement à ≤ 15 km de leur centre ?
ar_pts = [(a["centre"]["coordinates"][1], a["centre"]["coordinates"][0]) for a in arr.values()]
n_ab = sum(1 for i in range(N) if any(hav(lats[i], lons[i], np.array([p[0]]), np.array([p[1]]))[0] <= 15 for p in ar_pts))
R["plm_voisinage"]["communes_avec_un_centre_arrondissement_a_15km"] = n_ab
print(json.dumps({k: R[k] for k in ("C", "plm_voisinage")}, ensure_ascii=False, default=str)[:6000])
print(json.dumps(R["cas"], ensure_ascii=False))
if OUT:
    OUT.write_text(json.dumps(R, ensure_ascii=False, indent=1, default=lambda o: o.item() if hasattr(o, "item") else str(o)) + "\n", encoding="utf8")
    print("écrit :", OUT)
