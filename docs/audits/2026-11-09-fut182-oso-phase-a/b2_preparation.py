"""FUT-182 · préparation de B2 · « secteur habité » sur un ÉCHANTILLON stratifié, avec les contrôles demandés avant
tout calcul national. Lecture seule ; aucun calcul national ; n'écrit que le fichier de résultats (--out).

Usage (depuis la racine du dépôt) :
    python -I docs/audits/2026-11-09-fut182-oso-phase-a/b2_preparation.py OCS_2023.tif CACHE_DIR GEOAPI_POINTS_JSON \
        COMPTES_CSV_GZ [--out JSON] [--max N]

LA MESURE (contrat révisé, arbitrages du 10/11/2026) : autour des zones bâties de la commune, la part moyenne des
milieux naturels terrestres dans les TERRES situées à 15 km au plus.
  - Pixels pris en compte : ceux dont le centre tombe dans un contour de commune française (contours geo.api du
    cache). Tout le reste (mer au-delà des contours, étranger, valeur 0) est NON MESURÉ : ni nature, ni terre.
  - Terres = classes 1-22 et 24 (serres, rattachées aux cultures) ; naturel = 13, 16-22 ; l'eau (23) est à part.
  - Grille de calcul : cellules de 100 m (comptes de pixels 10 m par famille). Disque : cellules dont le centre est à
    15 km au plus du centre de la cellule bâtie (convolution par FFT).
  - Poids : le nombre de pixels bâtis de la cellule (proxy de la RÉPARTITION DES LIEUX BÂTIS, pas des habitants).
    Variante par défaut : classes 1-2 (bâti dense et diffus) ; sensibilité : 1 seule, et 1-4 (avec zones d'activité
    et routes).
  - Une cellule bâtie dont le disque n'a AUCUNE terre mesurée n'a pas de part : elle sort du numérateur ET du
    dénominateur, et son poids est rapporté (`poids_sans_mesure_pct`).
  - Moyenne et dispersion sont pondérées de la même façon : quantiles pondérés p10, p50, p90 (plus petite valeur
    dont le poids cumulé atteint q).
  - Couverture du résultat : moyenne pondérée, sur les cellules retenues, de la part du disque qui est mesurée.

LES CONTRÔLES :
  1. cohérence moyenne / dispersion (même poids ; p10 ≤ moyenne ≤ p90 n'est pas garanti, mais attendu) ;
  2. cellules sans mesure ;
  3. couverture des disques en mer et aux frontières (avec et sans la limitation aux contours français) ;
  4. sensibilité aux classes bâties ;
  5. échantillon stratifié : urbain dense, intermédiaire, rural, littoral, montagne, grande commune, frontalière, îles,
     et les 24 cas extrêmes de la phase A ;
  6. 100 m contre 10 m : sur un tirage de pixels bâtis 10 m (classes 1-2, tirage uniforme = même pondération), le
     disque exact au pas de 10 m (sommes cumulées par ligne) ; écart à la valeur 100 m, avec l'erreur-type du tirage.
"""
import csv
import gzip
import json
import random
import sys
import time
from pathlib import Path

import numpy as np
import rasterio
import shapely
from pyproj import Transformer
from rasterio.features import rasterize

RACINE = Path(__file__).resolve().parents[3]
args = [a for a in sys.argv[1:] if not a.startswith("--")]
if len(args) < 4:
    sys.exit(__doc__)
TIF, CACHE_DIR, GEO, COMPTES = Path(args[0]), Path(args[1]), Path(args[2]), Path(args[3])
OUT = Path(sys.argv[sys.argv.index("--out") + 1]) if "--out" in sys.argv else None
MAX = int(sys.argv[sys.argv.index("--max") + 1]) if "--max" in sys.argv else 10 ** 9

NAT = [13, 16, 17, 18, 19, 20, 21, 22]
TERRES = list(range(1, 23)) + [24]
BATI = {"1_2": [1, 2], "1": [1], "1_4": [1, 2, 3, 4]}
CELL, RAYON, MARGE = 10, 15000, 16000
K_REF = 1500  # pixels bâtis tirés pour la référence 10 m

ds = rasterio.open(TIF)
T = Transformer.from_crs("EPSG:4326", "EPSG:2154", always_xy=True)
geo = {g["code"]: g for g in json.load(open(GEO, encoding="utf8"))}
idx = {c["insee"]: c for c in json.load(gzip.open(RACINE / "data/comparateur-index.json.gz"))["communes"]}
aire = {l["code"]: float(l["aire_contour_m2"]) for l in csv.DictReader(gzip.open(COMPTES, "rt", encoding="utf8")) if l["type"] == "commune"}
contours, noms = {}, {}
for f in sorted((CACHE_DIR / "contours").glob("*.json")):
    for c in json.load(open(f, encoding="utf8")):
        if c.get("contour"):
            g = shapely.geometry.shape(c["contour"])
            contours[c["code"]] = shapely.transform(g, lambda xy: np.column_stack(T.transform(xy[:, 0], xy[:, 1])))
            noms[c["code"]] = c.get("nom")
codes_all = sorted(contours)
arbre = shapely.STRtree([contours[k] for k in codes_all])
print("contours :", len(contours), flush=True)

# ── Échantillon stratifié (graine fixe) ───────────────────────────────────────────────────────────────────
EXTREMES = ["13004", "13096", "77186", "50218", "74056", "2B096", "33063", "59350", "34301", "74010", "50129", "49092",
            "33529", "33236", "83069", "85113", "17094", "02100", "13055", "75056", "69123", "13041", "40046", "05023"]
FRONT = {"08", "54", "55", "57", "59", "67", "68", "25", "39", "01", "74", "73", "05", "04", "06", "64", "65", "31", "09", "66", "90", "02"}
ILES = ["29155", "29083", "56069", "56152", "85113", "17093", "17486", "83069", "22016", "2A247"]
rng = random.Random(182)
base = [k for k, c in idx.items() if k in contours and c.get("nature")]
dens = lambda k: idx[k].get("densite")
strates = {
    "urbain_dense": [k for k in base if (dens(k) or 0) >= 1500],
    "intermediaire": [k for k in base if dens(k) is not None and 150 <= dens(k) < 1500],
    "rural": [k for k in base if dens(k) is not None and dens(k) < 50],
    "littoral": [k for k in base if "Mer" in (idx[k].get("loi_effective") or [])],
    "montagne": [k for k in base if (idx[k].get("altitude") or 0) >= 800],
    "grande_commune": [k for k in base if aire.get(k, 0) >= 150e6],
    "frontaliere": [k for k in base if idx[k].get("dept") in FRONT],
}
ech = {}
for s, l in strates.items():
    for k in rng.sample(sorted(l), 8):
        ech.setdefault(k, []).append(s)
for k in ILES:
    if k in contours:
        ech.setdefault(k, []).append("ile")
for k in EXTREMES:
    if k in contours:
        ech.setdefault(k, []).append("extreme_phase_A")
ech = dict(list(ech.items())[:MAX])
print("échantillon :", len(ech), {s: sum(s in v for v in ech.values()) for s in list(strates) + ["ile", "extreme_phase_A"]}, flush=True)

r_cells = RAYON // (CELL * 10)
yy, xx = np.mgrid[-r_cells:r_cells + 1, -r_cells:r_cells + 1]
NOYAU = ((xx * 100) ** 2 + (yy * 100) ** 2 <= RAYON ** 2).astype(np.float64)
DISQUE_PX = NOYAU.sum() * CELL * CELL
# Demi-largeurs du disque exact au pas de 10 m (référence) : |dx| ≤ w(dy), centres de pixels à 15 km au plus.
R10 = RAYON // 10
DEMI = np.floor(np.sqrt(np.maximum(0, R10 ** 2 - np.arange(-R10, R10 + 1) ** 2))).astype(np.int64)


def conv(a, k):
    sh = (a.shape[0] + k.shape[0] - 1, a.shape[1] + k.shape[1] - 1)
    f = np.fft.irfft2(np.fft.rfft2(a, sh) * np.fft.rfft2(k, sh), sh)
    oy, ox = k.shape[0] // 2, k.shape[1] // 2
    return f[oy:oy + a.shape[0], ox:ox + a.shape[1]]


def quantile_pondere(v, w, q):
    o = np.argsort(v); v, w = v[o], w[o]
    c = np.cumsum(w) / w.sum()
    return float(v[np.searchsorted(c, q, side="left")])


def resume(part, poids, valide, frac_mes, frac_ter):
    tout = poids.sum()
    ok = valide & (poids > 0)
    w = poids[ok]; v = part[ok]
    if w.sum() == 0:
        return {"secteur_habite_pct": None, "poids_sans_mesure_pct": 100.0}
    return {"secteur_habite_pct": round(100 * float((v * w).sum() / w.sum()), 2),
            "p10_p50_p90_ponderes": [round(100 * quantile_pondere(v, w, q), 2) for q in (0.1, 0.5, 0.9)],
            "p10_p90_non_ponderes": [round(100 * float(np.percentile(v, q)), 2) for q in (10, 90)],
            "cellules_baties": int(ok.sum()),
            "poids_sans_mesure_pct": round(100 * float(poids[~valide].sum() / tout), 3) if tout else None,
            "disque_mesure_pct": round(100 * float((frac_mes[ok] * w).sum() / w.sum()), 2),
            "disque_terres_pct": round(100 * float((frac_ter[ok] * w).sum() / w.sum()), 2)}


res = {}
t0 = time.time()
for n, (code, strs) in enumerate(ech.items()):
    G = contours[code]
    minx, miny, maxx, maxy = G.bounds
    win = rasterio.windows.from_bounds(minx - MARGE, miny - MARGE, maxx + MARGE, maxy + MARGE, ds.transform).round_offsets().round_lengths()
    a = ds.read(1, window=win, boundless=True, fill_value=0)
    h, w_ = (a.shape[0] // CELL) * CELL, (a.shape[1] // CELL) * CELL
    a = a[:h, :w_]
    wt = ds.window_transform(win)
    # Masque France : pixels dont le centre est dans un contour de commune française.
    zone = shapely.box(*rasterio.windows.bounds(win, ds.transform))
    voisins = [contours[codes_all[i]] for i in arbre.query(zone)]
    fr = rasterize([(g, 1) for g in voisins], out_shape=a.shape, transform=wt, fill=0, dtype="uint8").astype(bool)
    hors_france_classe = int(((a > 0) & ~fr).sum())
    blocs = lambda m: m.reshape(h // CELL, CELL, w_ // CELL, CELL).sum(axis=(1, 3)).astype(np.float64)
    t100 = wt * rasterio.Affine.scale(CELL)
    dedans = rasterize([(G, 1)], out_shape=(h // CELL, w_ // CELL), transform=t100, fill=0, dtype="uint8").astype(bool)
    out = {"nom": noms[code], "strates": strs, "surface_km2": round(G.area / 1e6, 1),
           "pixels_classes_hors_france_dans_la_fenetre": hors_france_classe}
    for limite in ("france", "sans_limite"):
        aa = a if limite == "sans_limite" else np.where(fr, a, 0)
        nat = blocs(np.isin(aa, NAT)); ter = blocs(np.isin(aa, TERRES)); mes = ter + blocs(aa == 23)
        cnat, cter, cmes = conv(nat, NOYAU), conv(ter, NOYAU), conv(mes, NOYAU)
        valide = cter > 0.5
        part = np.where(valide, cnat / np.where(valide, cter, 1), np.nan)
        for vb, cls in BATI.items():
            if limite == "sans_limite" and vb != "1_2":
                continue
            poids = (blocs(np.isin(a, cls)) * dedans)
            m = poids > 0
            out[f"{limite}_bati_{vb}"] = resume(part[m], poids[m], valide[m], (cmes / DISQUE_PX)[m], (cter / DISQUE_PX)[m])
        if limite == "france":
            # Point de l'index (C1) et centre bâti (repli), pour situer le secteur habité.
            def au_point(x, y):
                col_, row = ~t100 * (x, y)
                r, c = int(row), int(col_)
                if not (0 <= r < nat.shape[0] and 0 <= c < nat.shape[1]) or not valide[r, c]:
                    return None
                return round(100 * float(part[r, c]), 2)
            g = geo.get(code, {})
            if g.get("centre"):
                out["point_index_pct"] = au_point(*T.transform(*g["centre"]["coordinates"]))
            pb = blocs(np.isin(a, [1, 2])) * dedans
            if pb.sum() > 0:
                rr, cc = np.nonzero(pb)
                x, y = t100 * (np.average(cc + 0.5, weights=pb[rr, cc]), np.average(rr + 0.5, weights=pb[rr, cc]))
                out["centre_bati_pct"] = au_point(x, y)
            # ── Référence 10 m : disques exacts sur un tirage de pixels bâtis (classes 1-2) de la commune ──────────
            dedans10 = rasterize([(G, 1)], out_shape=a.shape, transform=wt, fill=0, dtype="uint8").astype(bool)
            by, bx = np.nonzero(dedans10 & np.isin(a, [1, 2]))
            if len(by):
                rs = np.random.default_rng(182)
                sel = rs.choice(len(by), size=min(K_REF, len(by)), replace=False)
                cn = np.cumsum(np.pad(np.isin(aa, NAT), ((0, 0), (1, 0))).astype(np.int32), axis=1)
                ct = np.cumsum(np.pad(np.isin(aa, TERRES), ((0, 0), (1, 0))).astype(np.int32), axis=1)
                H, W = a.shape
                parts10 = []
                dys = np.arange(-R10, R10 + 1)
                for i in sel:
                    y, x = by[i], bx[i]
                    rows = y + dys
                    ok = (rows >= 0) & (rows < H)
                    r_ = rows[ok]; d_ = DEMI[ok]
                    x0 = np.clip(x - d_, 0, W); x1 = np.clip(x + d_ + 1, 0, W)
                    sn = (cn[r_, x1] - cn[r_, x0]).sum(); st = (ct[r_, x1] - ct[r_, x0]).sum()
                    if st > 0:
                        parts10.append(sn / st)
                p10 = np.array(parts10)
                out["reference_10m"] = {"pixels_tires": int(len(sel)), "pixels_bati_commune": int(len(by)), "sans_mesure": int(len(sel) - len(p10)),
                                        "secteur_habite_pct": round(100 * float(p10.mean()), 2),
                                        "erreur_type_pts": round(100 * float(p10.std(ddof=1) / np.sqrt(len(p10))), 3) if len(p10) > 1 else None}
                v100 = out["france_bati_1_2"]["secteur_habite_pct"]
                out["reference_10m"]["ecart_100m_moins_10m_pts"] = round(v100 - out["reference_10m"]["secteur_habite_pct"], 2) if v100 is not None else None
    res[code] = out
    print(f"{n + 1}/{len(ech)} {code} {noms[code]} ({time.time() - t0:.0f}s)", json.dumps({k: v for k, v in out.items() if k in ("france_bati_1_2", "reference_10m", "point_index_pct")}, ensure_ascii=False), flush=True)

# ── Synthèse des contrôles ────────────────────────────────────────────────────────────────────────────────
vals = [v for v in res.values() if v.get("france_bati_1_2", {}).get("secteur_habite_pct") is not None]
ecarts10 = np.array([v["reference_10m"]["ecart_100m_moins_10m_pts"] for v in vals if v.get("reference_10m", {}).get("ecart_100m_moins_10m_pts") is not None])
se10 = np.array([v["reference_10m"]["erreur_type_pts"] for v in vals if v.get("reference_10m", {}).get("erreur_type_pts") is not None])
d = lambda a, b: np.array([v[a]["secteur_habite_pct"] - v[b]["secteur_habite_pct"] for v in vals if v.get(a, {}).get("secteur_habite_pct") is not None and v.get(b, {}).get("secteur_habite_pct") is not None])
d_lim = d("sans_limite_bati_1_2", "france_bati_1_2"); d_b1 = d("france_bati_1", "france_bati_1_2"); d_b14 = d("france_bati_1_4", "france_bati_1_2")
q = lambda x: {"n": int(len(x)), "abs_max": round(float(np.abs(x).max()), 2), "abs_p90": round(float(np.percentile(np.abs(x), 90)), 2), "mediane": round(float(np.median(x)), 2)} if len(x) else None
f = [v["france_bati_1_2"] for v in vals]
SYN = {
    "communes": len(res), "avec_resultat": len(vals),
    "1_moyenne_dans_p10_p90_ponderes": sum(1 for x in f if x["p10_p50_p90_ponderes"][0] <= x["secteur_habite_pct"] <= x["p10_p50_p90_ponderes"][2]),
    "1_ecart_p10_p90_pondere_vs_non_pondere_max_pts": round(max(max(abs(x["p10_p50_p90_ponderes"][0] - x["p10_p90_non_ponderes"][0]), abs(x["p10_p50_p90_ponderes"][2] - x["p10_p90_non_ponderes"][1])) for x in f), 2),
    "2_poids_sans_mesure_pct_max": max(x["poids_sans_mesure_pct"] for x in f),
    "2_communes_avec_poids_sans_mesure": sum(1 for x in f if x["poids_sans_mesure_pct"] > 0),
    "3_disque_mesure_pct": {"min": min(x["disque_mesure_pct"] for x in f), "communes_sous_80": sum(1 for x in f if x["disque_mesure_pct"] < 80),
                            "communes_sous_60": sum(1 for x in f if x["disque_mesure_pct"] < 60)},
    "3_effet_limitation_france_pts": q(d_lim),
    "4_sensibilite_bati_1_seul_pts": q(d_b1), "4_sensibilite_bati_1_4_pts": q(d_b14),
    "6_ecart_100m_10m_pts": q(ecarts10), "6_erreur_type_tirage_pts_max": round(float(se10.max()), 3) if len(se10) else None,
    "6_ecarts_au_dela_de_2_erreurs_types": int(sum(1 for v in vals if v.get("reference_10m") and v["reference_10m"].get("erreur_type_pts") and abs(v["reference_10m"]["ecart_100m_moins_10m_pts"]) > 2 * v["reference_10m"]["erreur_type_pts"])),
}
print("SYNTHÈSE", json.dumps(SYN, ensure_ascii=False), flush=True)
if OUT:
    OUT.write_text(json.dumps({"synthese": SYN, "communes": res}, ensure_ascii=False, indent=1) + "\n", encoding="utf8")
    print("écrit :", OUT)
