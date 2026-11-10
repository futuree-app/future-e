"""FUT-182 · phase A, reprise · sensibilité de C1 au choix du point, sur le raster réel, pour un ÉCHANTILLON de cas extrêmes.

REMPLACÉ PAR b2_preparation.py (10/11/2026, contre-revue) : ici la dispersion p10-p90 n'est PAS pondérée, les
cellules sans dénominateur gardent leur poids et les pixels hors de France comptent. Conservé tel quel pour la
traçabilité des chiffres de la partie II.

Lecture seule, aucun calcul national. Dépendances : numpy, rasterio, shapely, pyproj.

Usage :
    python docs/audits/2026-11-09-fut182-oso-phase-a/point_echantillon_raster.py OCS_2023.tif CACHE_DIR GEOAPI_POINTS_JSON [--out JSON]

Pour chaque commune de l'échantillon, on lit une fenêtre du raster (emprise de la commune + 16 km), on l'agrège en
cellules de 100 m (comptes par famille), puis on calcule la part d'espaces naturels terrestres (définition actuelle :
forêts, prairies, landes et pelouses, roche, dunes, glaciers) rapportée aux TERRES (classes 1-22 et 24 serres ; eau 23
et non classé 0/255 exclus) :
  - dans un disque de 15 km autour de quatre points : point de l'index (= `centre` geo.api.gouv.fr), mairie, centroïde
    du contour, centre bâti (barycentre des pixels bâtis 1-2 de la commune) ;
  - « secteur habité » : la moyenne, sur les cellules bâties de la commune pondérées par leur nombre de pixels bâtis,
    de la part naturelle dans 15 km autour de chacune. Aucune dépendance à un point unique.
Le disque est discrétisé en cellules de 100 m (centre de cellule à ≤ 15 km) : erreur de bord négligeable.
On rapporte aussi la part de surface non mesurée dans chaque disque (hors raster classé : mer hors emprise, étranger,
0, 255), qui n'est comptée ni comme nature ni comme terre.
"""
import json
import sys
from pathlib import Path

import numpy as np
import rasterio
import shapely
from pyproj import Transformer
from rasterio.features import geometry_mask

args = [a for a in sys.argv[1:] if not a.startswith("--")]
if len(args) < 3:
    sys.exit(__doc__)
TIF, CACHE_DIR, GEO = Path(args[0]), Path(args[1]), Path(args[2])
OUT = Path(sys.argv[sys.argv.index("--out") + 1]) if "--out" in sys.argv else None

ds = rasterio.open(TIF)
T = Transformer.from_crs("EPSG:4326", "EPSG:2154", always_xy=True)
geo = {g["code"]: g for g in json.load(open(GEO, encoding="utf8"))}
contours, noms = {}, {}
for f in sorted((CACHE_DIR / "contours").glob("*.json")):
    for c in json.load(open(f, encoding="utf8")):
        if c.get("contour"):
            g = shapely.geometry.shape(c["contour"])
            contours[c["code"]] = shapely.transform(g, lambda xy: np.column_stack(T.transform(xy[:, 0], xy[:, 1])))
            noms[c["code"]] = c.get("nom")

CAS = ["13004", "13096", "77186", "50218", "74056", "2B096", "33063", "59350", "34301", "74010", "50129", "49092",
       "33529", "33236", "83069", "85113", "17094", "02100", "13055", "75056", "69123", "13041", "40046", "05023"]
NAT = [13, 16, 17, 18, 19, 20, 21, 22]
TERRES = list(range(1, 23)) + [24]
BATI = [1, 2]
CELL = 10  # 10 pixels de 10 m = 100 m
RAYON = 15000
MARGE = 16000

r_cells = RAYON // (CELL * 10)
yy, xx = np.mgrid[-r_cells:r_cells + 1, -r_cells:r_cells + 1]
NOYAU = ((xx * 100) ** 2 + (yy * 100) ** 2 <= RAYON ** 2).astype(np.float64)


def conv(a, k):
    """Convolution 2D par FFT (même taille que a)."""
    sh = (a.shape[0] + k.shape[0] - 1, a.shape[1] + k.shape[1] - 1)
    f = np.fft.irfft2(np.fft.rfft2(a, sh) * np.fft.rfft2(k, sh), sh)
    oy, ox = k.shape[0] // 2, k.shape[1] // 2
    return f[oy:oy + a.shape[0], ox:ox + a.shape[1]]


res = {}
for code in CAS:
    if code not in contours:
        res[code] = {"absent": True}
        continue
    G = contours[code]
    minx, miny, maxx, maxy = G.bounds
    win = rasterio.windows.from_bounds(minx - MARGE, miny - MARGE, maxx + MARGE, maxy + MARGE, ds.transform).round_offsets().round_lengths()
    a = ds.read(1, window=win, boundless=True, fill_value=0)
    h, w = (a.shape[0] // CELL) * CELL, (a.shape[1] // CELL) * CELL
    a = a[:h, :w]
    wt = ds.window_transform(win)
    blocs = lambda m: m.reshape(h // CELL, CELL, w // CELL, CELL).sum(axis=(1, 3)).astype(np.float64)
    nat = blocs(np.isin(a, NAT)); ter = blocs(np.isin(a, TERRES)); bati = blocs(np.isin(a, BATI))
    eau = blocs(a == 23); mesure = ter + eau
    # Masque de la commune au pas de 100 m (centre de cellule dans le contour).
    t100 = wt * rasterio.Affine.scale(CELL)
    dedans = ~geometry_mask([G], out_shape=nat.shape, transform=t100, invert=False)
    cnat, cter, cmes = conv(nat, NOYAU), conv(ter, NOYAU), conv(mesure, NOYAU)
    disque_px = NOYAU.sum() * CELL * CELL

    def au_point(x, y):
        col, row = ~t100 * (x, y)
        r, c = int(row), int(col)
        if not (0 <= r < nat.shape[0] and 0 <= c < nat.shape[1]):
            return None
        return {"naturel_terres_pct": round(100 * cnat[r, c] / cter[r, c], 1) if cter[r, c] > 0 else None,
                "non_mesure_pct_du_disque": round(100 * (1 - cmes[r, c] / disque_px), 1)}

    pts = {}
    g = geo.get(code, {})
    if g.get("centre"):
        pts["index_ou_centre_geoapi"] = T.transform(*g["centre"]["coordinates"])
    if g.get("mairie"):
        pts["mairie"] = T.transform(*g["mairie"]["coordinates"])
    pts["centroide"] = (G.centroid.x, G.centroid.y)
    bb = bati * dedans
    if bb.sum() > 0:
        rr, cc = np.nonzero(bb)
        wts = bb[rr, cc]
        x, y = t100 * (np.average(cc + 0.5, weights=wts), np.average(rr + 0.5, weights=wts))
        pts["centre_bati"] = (x, y)
    out = {"nom": noms[code], "surface_km2": round(G.area / 1e6, 1), "bati_ha": round(float(bb.sum()) / 100, 1)}
    for k, (x, y) in pts.items():
        out[k] = au_point(x, y)
        out[k]["distance_au_point_index_km"] = round(float(np.hypot(x - pts.get("index_ou_centre_geoapi", (x, y))[0], y - pts.get("index_ou_centre_geoapi", (x, y))[1]) / 1000), 2)
    if bb.sum() > 0:
        m = bb > 0
        part = np.where(cter > 0, cnat / np.where(cter > 0, cter, 1), np.nan)
        out["secteur_habite"] = {"naturel_terres_pct": round(float(100 * np.nansum(part[m] * bb[m]) / bb[m].sum()), 1),
                                 "dispersion_p10_p90": [round(float(100 * np.nanpercentile(part[m], 10)), 1), round(float(100 * np.nanpercentile(part[m], 90)), 1)]}
    res[code] = out
    print(code, json.dumps(out, ensure_ascii=False), flush=True)

if OUT:
    OUT.write_text(json.dumps(res, ensure_ascii=False, indent=1) + "\n", encoding="utf8")
    print("écrit :", OUT)
