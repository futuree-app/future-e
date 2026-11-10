"""FUT-182 · B2 · comparaison de deux pondérations du secteur habité : surface bâtie OSO (retenue, proxy des lieux bâtis)
contre population Filosofi 2021 carroyée à 200 m (Insee). Échantillon ciblé ; la population n'entre PAS dans le moteur.

Lecture seule ; n'écrit que le fichier de résultats (--out). Dépendances : numpy, rasterio, shapely, pyproj.

Usage :
    python -I b2_filosofi.py OCS_2023.tif CACHE_DIR carreaux_200m_met.csv [--out JSON]

Source : Insee, « Revenus, pauvreté et niveau de vie en 2021 — données carroyées », carreaux de 200 m (y compris données
imputées), fichier Filosofi2021_carreaux_200m_csv.zip, page https://www.insee.fr/fr/statistiques/8735162. Variables
lues : idcar_200m (coin sud-ouest en EPSG:3035), ind (individus), i_est_200 (1 = carreau imputé). Les carreaux de
moins de 11 ménages fiscaux sont imputés par l'Insee : leur population est une estimation, et une population
fiscale ne dit pas la présence réelle (résidences secondaires, saisonniers, étudiants).

Pour chaque commune : la même grille que b2_preparation.py (100 m, disque de 15 km, pixels sous contour français,
terres = 1-22 et 24, naturel = 13 et 16-22). Deux moyennes de la part naturelle des terres :
  - « bâti » : pondérée par les pixels bâtis OSO 1-2 des cellules dont le centre est dans la commune (comme § 39) ;
  - « population » : pondérée par `ind`, évaluée à la cellule de 100 m qui contient le centre de chaque carreau dont
    le centre est dans la commune.
"""
import csv
import gzip
import json
import re
import sys
from pathlib import Path

import numpy as np
import rasterio
import shapely
from pyproj import Transformer
from rasterio.features import rasterize

args = [a for a in sys.argv[1:] if not a.startswith("--")]
if len(args) < 3:
    sys.exit(__doc__)
TIF, CACHE_DIR, CARREAUX = Path(args[0]), Path(args[1]), Path(args[2])
OUT = Path(sys.argv[sys.argv.index("--out") + 1]) if "--out" in sys.argv else None

NAT = [13, 16, 17, 18, 19, 20, 21, 22]
TERRES = list(range(1, 23)) + [24]
CELL, RAYON, MARGE = 10, 15000, 16000
CAS = {
    "multipolaire": ["13004", "49092", "49228", "22046", "13096"],
    "centre_dense": ["75056", "69123", "13055", "59350", "33063"],
    "touristique": ["83069", "33236", "74056", "73257", "33529", "40046"],
    "autre": ["50218", "34301", "74010", "30189", "77186"],
}

ds = rasterio.open(TIF)
T = Transformer.from_crs("EPSG:4326", "EPSG:2154", always_xy=True)
T3035 = Transformer.from_crs("EPSG:3035", "EPSG:2154", always_xy=True)
contours, noms = {}, {}
for f in sorted((CACHE_DIR / "contours").glob("*.json")):
    for c in json.load(open(f, encoding="utf8")):
        if c.get("contour"):
            g = shapely.geometry.shape(c["contour"])
            contours[c["code"]] = shapely.transform(g, lambda xy: np.column_stack(T.transform(xy[:, 0], xy[:, 1])))
            noms[c["code"]] = c.get("nom")
codes_all = sorted(contours)
arbre = shapely.STRtree([contours[k] for k in codes_all])

# ── Carreaux : centre en Lambert-93 ───────────────────────────────────────────────────────────────────────
rx = re.compile(r"N(\d+)E(\d+)$")
N, E, IND, EST = [], [], [], []
with open(CARREAUX, encoding="utf8") as f:
    for r in csv.DictReader(f):
        m = rx.search(r["idcar_200m"])
        N.append(int(m.group(1)) + 100); E.append(int(m.group(2)) + 100)
        IND.append(float(r["ind"])); EST.append(r["i_est_200"] == "1")
X, Y = T3035.transform(np.array(E, dtype=float), np.array(N, dtype=float))
IND, EST = np.array(IND), np.array(EST)
print("carreaux :", len(IND), "population totale", round(IND.sum()), flush=True)

r_cells = RAYON // (CELL * 10)
yy, xx = np.mgrid[-r_cells:r_cells + 1, -r_cells:r_cells + 1]
NOYAU = ((xx * 100) ** 2 + (yy * 100) ** 2 <= RAYON ** 2).astype(np.float64)


def conv(a, k):
    sh = (a.shape[0] + k.shape[0] - 1, a.shape[1] + k.shape[1] - 1)
    f = np.fft.irfft2(np.fft.rfft2(a, sh) * np.fft.rfft2(k, sh), sh)
    oy, ox = k.shape[0] // 2, k.shape[1] // 2
    return f[oy:oy + a.shape[0], ox:ox + a.shape[1]]


def qp(v, w, q):
    o = np.argsort(v); v, w = v[o], w[o]
    return float(v[np.searchsorted(np.cumsum(w) / w.sum(), q, side="left")])


res = {}
for groupe, lst in CAS.items():
    for code in lst:
        G = contours[code]
        minx, miny, maxx, maxy = G.bounds
        win = rasterio.windows.from_bounds(minx - MARGE, miny - MARGE, maxx + MARGE, maxy + MARGE, ds.transform).round_offsets().round_lengths()
        a = ds.read(1, window=win, boundless=True, fill_value=0)
        h, w_ = (a.shape[0] // CELL) * CELL, (a.shape[1] // CELL) * CELL
        a = a[:h, :w_]
        wt = ds.window_transform(win)
        zone = shapely.box(*rasterio.windows.bounds(win, ds.transform))
        fr = rasterize([(contours[codes_all[i]], 1) for i in arbre.query(zone)], out_shape=a.shape, transform=wt, fill=0, dtype="uint8").astype(bool)
        aa = np.where(fr, a, 0)
        blocs = lambda m: m.reshape(h // CELL, CELL, w_ // CELL, CELL).sum(axis=(1, 3)).astype(np.float64)
        t100 = wt * rasterio.Affine.scale(CELL)
        cnat, cter = conv(blocs(np.isin(aa, NAT)), NOYAU), conv(blocs(np.isin(aa, TERRES)), NOYAU)
        valide = cter > 0.5
        part = np.where(valide, cnat / np.where(valide, cter, 1), np.nan)
        dedans = rasterize([(G, 1)], out_shape=part.shape, transform=t100, fill=0, dtype="uint8").astype(bool)
        pb = blocs(np.isin(a, [1, 2])) * dedans
        m = (pb > 0) & valide
        bati = float((part[m] * pb[m]).sum() / pb[m].sum())
        # Carreaux dont le centre est dans la commune.
        sel = np.where((X >= minx) & (X <= maxx) & (Y >= miny) & (Y <= maxy))[0]
        dans = shapely.contains_xy(G, X[sel], Y[sel])
        sel = sel[dans]
        col, row = ~t100 * (X[sel], Y[sel])
        r_, c_ = np.floor(row).astype(int), np.floor(col).astype(int)
        ok = (r_ >= 0) & (r_ < part.shape[0]) & (c_ >= 0) & (c_ < part.shape[1])
        ok[ok] &= valide[r_[ok], c_[ok]]
        v, wpop = part[r_[ok], c_[ok]], IND[sel][ok]
        pop = float((v * wpop).sum() / wpop.sum())
        res[code] = {"nom": noms[code], "groupe": groupe,
                     "bati_pct": round(100 * bati, 2), "population_pct": round(100 * pop, 2),
                     "ecart_population_moins_bati_pts": round(100 * (pop - bati), 2),
                     "p10_p90_bati": [round(100 * qp(part[m], pb[m], q), 2) for q in (0.1, 0.9)],
                     "p10_p90_population": [round(100 * qp(v, wpop, q), 2) for q in (0.1, 0.9)],
                     "carreaux": int(len(sel)), "population_carroyee": round(float(IND[sel].sum())),
                     "part_population_imputee_pct": round(100 * float(IND[sel][EST[sel]].sum() / IND[sel].sum()), 1)}
        print(code, json.dumps(res[code], ensure_ascii=False), flush=True)

e = np.array([r["ecart_population_moins_bati_pts"] for r in res.values()])
SYN = {"communes": len(res), "ecart_abs_max_pts": round(float(np.abs(e).max()), 2), "ecart_abs_median_pts": round(float(np.median(np.abs(e))), 2),
       "ecart_moyen_signe_pts": round(float(e.mean()), 2),
       "par_groupe": {g: {"ecart_moyen_pts": round(float(np.mean([r["ecart_population_moins_bati_pts"] for r in res.values() if r["groupe"] == g])), 2),
                          "ecart_abs_max_pts": round(float(np.max([abs(r["ecart_population_moins_bati_pts"]) for r in res.values() if r["groupe"] == g])), 2)} for g in CAS}}
print("SYNTHÈSE", json.dumps(SYN, ensure_ascii=False), flush=True)
if OUT:
    OUT.write_text(json.dumps({"synthese": SYN, "communes": res}, ensure_ascii=False, indent=1) + "\n", encoding="utf8")
