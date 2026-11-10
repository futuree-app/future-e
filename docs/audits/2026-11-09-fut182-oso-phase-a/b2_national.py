"""FUT-182 · B2 · « secteur habité » NATIONAL, hors ligne et hors application. Aucun score ni verdict n'est publié.

Lecture seule du raster et des contours ; n'écrit que dans SORTIE_DIR (hors dépôt). Dépendances : numpy, rasterio, shapely.

Usage :
    python -I b2_national.py OCS_2023.tif CACHE_DIR ARRONDISSEMENTS_JSON SORTIE_DIR [--bandes 2000]

LA MESURE (rapport § 31 et § 39) : pour chaque commune, la moyenne, pondérée par ses pixels bâtis (OSO classes 1-2,
proxy de la répartition des lieux bâtis), de la part des milieux naturels terrestres (13, 16-22) dans les terres
(1-22 et 24) situées à 15 km au plus de chaque cellule bâtie de 100 m. Seuls comptent les pixels dont le centre tombe
dans un contour communal français. Moyenne et quantiles p10, p50, p90 sont pondérés de la même façon. Une cellule
bâtie sans terre mesurée dans son disque sort du numérateur et du dénominateur ; son poids est rapporté.

DIFFÉRENCE AVEC b2_preparation.py : ici, un pixel bâti appartient à la commune dont le contour contient son CENTRE
(étiquette au pas de 10 m), et une cellule partagée entre deux communes donne à chacune ses propres pixels. Dans
l'échantillon, la cellule entière allait à la commune qui contenait son centre. L'écart attendu est faible ; il est
mesuré sur les 87 communes de l'échantillon (b2_analyse.py).

LA COUVERTURE DU DISQUE, décomposée (demande de la contre-revue du 10/11/2026). En part de la surface du disque,
moyenne pondérée par le bâti :
  terres_fr            terres sous un contour français (le dénominateur de la mesure)
  eaux_fr              eau (23) sous un contour français : mesurée, à part, jamais naturelle
  eaux_hors_contours   eau (23) classée hors des contours français : mer au large, lacs frontaliers
  terres_etrangeres    terres classées hors des contours français : exclues (décision C)
  non_classe_fr        valeur 0 sous un contour français : le seul vrai « non classé »
  hors_carte           valeur 0 hors des contours, et disque au-delà de l'emprise du raster : rien n'y est cartographié
                       (le plus souvent la mer au-delà de la bande côtière classée)
Les six parts somment à 100 (au bord exact du raster près).

Étapes : (1) bandes de lignes de 10 m : étiquette de commune par rasterisation, comptes par famille sur la grille
nationale de 100 m, pixels bâtis par (commune, cellule) ; (2) convolutions par FFT, en tuiles, avec le disque de 15 km ;
(3) agrégation par commune ; puis les 45 arrondissements, sur leurs propres pixels.
"""
import csv
import gzip
import hashlib
import json
import platform
import sys
import time
from pathlib import Path

import numpy as np
import rasterio
import shapely
from rasterio.features import rasterize
from rasterio.warp import transform_geom

args = [a for a in sys.argv[1:] if not a.startswith("--")]
if len(args) < 4:
    sys.exit(__doc__)
TIF, CACHE_DIR, ARR, SORTIE = Path(args[0]), Path(args[1]), Path(args[2]), Path(args[3])
BANDE = int(sys.argv[sys.argv.index("--bandes") + 1]) if "--bandes" in sys.argv else 2000
SORTIE.mkdir(parents=True, exist_ok=True)
t0 = time.time()
log = lambda *m: print(f"[{time.time() - t0:6.0f}s]", *m, flush=True)

NAT = [13, 16, 17, 18, 19, 20, 21, 22]
TERRES = list(range(1, 23)) + [24]
BATI = [1, 2]
CELL, RAYON = 10, 15000

ds = rasterio.open(TIF)
H, W = ds.height, ds.width
NR, NC = -(-H // CELL), -(-W // CELL)
NCELL = NR * NC
log("raster", H, W, "grille 100 m", NR, NC)

# Famille de chaque valeur : 0 = non classé (0), 1 = naturel terrestre, 2 = autre terre, 3 = eau, 4 = autre valeur.
LUT = np.full(256, 4, dtype=np.uint8)
LUT[0] = 0
LUT[NAT] = 1
LUT[[v for v in TERRES if v not in NAT]] = 2
LUT[23] = 3
EST_BATI = np.zeros(256, dtype=bool); EST_BATI[BATI] = True

# ── Contours ──────────────────────────────────────────────────────────────────────────────────────────────
codes, noms, geoms = [], [], []
for f in sorted((CACHE_DIR / "contours").glob("*.json")):
    for c in json.load(open(f, encoding="utf8")):
        if c.get("contour"):
            codes.append(c["code"]); noms.append(c.get("nom", ""))
            geoms.append(transform_geom("EPSG:4326", ds.crs, c["contour"]))
assert len(codes) < 65535
shp = [shapely.geometry.shape(g) for g in geoms]
arbre = shapely.STRtree(shp)
log("contours", len(codes))

FAM = ["terres_nat_fr", "terres_autres_fr", "eaux_fr", "non_classe_fr", "terres_hors", "eaux_hors", "zero_hors", "autres"]
G = {k: np.zeros((NR, NC), dtype=np.int32) for k in FAM}
paires = []  # (étiquette, cellule, pixels bâtis)

for r0 in range(0, H, BANDE):
    h = min(BANDE, H - r0)
    win = rasterio.windows.Window(0, r0, W, h)
    a = ds.read(1, window=win)
    hp, wp = -(-h // CELL) * CELL, NC * CELL
    if (hp, wp) != a.shape:
        a = np.pad(a, ((0, hp - h), (0, wp - W)), constant_values=0)
    bt = ds.window_transform(win)
    zone = shapely.box(*rasterio.windows.bounds(win, ds.transform))
    ids = arbre.query(zone)
    lab = rasterize(((geoms[i], int(i) + 1) for i in ids), out_shape=(hp, wp), transform=bt, fill=0, dtype="uint16") if len(ids) else np.zeros((hp, wp), dtype=np.uint16)
    # Les pixels de remplissage (au-delà de l'emprise) ne sont ni français ni classés : ils ne comptent nulle part.
    if hp > h or wp > W:
        vrai = np.zeros((hp, wp), dtype=bool); vrai[:h, :W] = True
    else:
        vrai = None
    fam = LUT[a]
    fr = lab > 0
    cr0 = r0 // CELL
    blocs = lambda m: m.reshape(hp // CELL, CELL, NC, CELL).sum(axis=(1, 3), dtype=np.int32)
    hors = ~fr if vrai is None else (~fr & vrai)
    G["terres_nat_fr"][cr0:cr0 + hp // CELL] += blocs(fr & (fam == 1))
    G["terres_autres_fr"][cr0:cr0 + hp // CELL] += blocs(fr & (fam == 2))
    G["eaux_fr"][cr0:cr0 + hp // CELL] += blocs(fr & (fam == 3))
    G["non_classe_fr"][cr0:cr0 + hp // CELL] += blocs(fr & (fam == 0))
    G["terres_hors"][cr0:cr0 + hp // CELL] += blocs(hors & ((fam == 1) | (fam == 2)))
    G["eaux_hors"][cr0:cr0 + hp // CELL] += blocs(hors & (fam == 3))
    G["zero_hors"][cr0:cr0 + hp // CELL] += blocs(hors & (fam == 0))
    G["autres"][cr0:cr0 + hp // CELL] += blocs(fam == 4)
    rr, cc = np.nonzero(fr & EST_BATI[a])
    if len(rr):
        cle = lab[rr, cc].astype(np.int64) * NCELL + ((rr // CELL + cr0).astype(np.int64) * NC + cc // CELL)
        u, n = np.unique(cle, return_counts=True)
        paires.append(np.stack([u // NCELL, u % NCELL, n], axis=1))
    log(f"bande {r0}/{H} : {len(ids)} contours, {len(rr)} pixels bâtis")
    del a, lab, fam, fr, hors

P = np.concatenate(paires)
log("paires (commune, cellule bâtie)", len(P), "| pixels « autres valeurs »", int(G["autres"].sum()))

# ── Convolutions en tuiles ────────────────────────────────────────────────────────────────────────────────
rc = RAYON // (CELL * 10)
yy, xx = np.mgrid[-rc:rc + 1, -rc:rc + 1]
NOYAU = ((xx * 100) ** 2 + (yy * 100) ** 2 <= RAYON ** 2).astype(np.float64)
DISQUE_PX = float(NOYAU.sum() * CELL * CELL)
TUILE = 1024


def conv_tuiles(g):
    out = np.zeros(g.shape, dtype=np.float64)
    gp = np.pad(g.astype(np.float64), rc)
    sh = (TUILE + 4 * rc, TUILE + 4 * rc)
    K = np.fft.rfft2(NOYAU, sh)
    for ty in range(0, g.shape[0], TUILE):
        for tx in range(0, g.shape[1], TUILE):
            th, tw = min(TUILE, g.shape[0] - ty), min(TUILE, g.shape[1] - tx)
            src = gp[ty:ty + th + 2 * rc, tx:tx + tw + 2 * rc]
            f = np.fft.irfft2(np.fft.rfft2(src, sh) * K, sh)
            out[ty:ty + th, tx:tx + tw] = f[2 * rc:2 * rc + th, 2 * rc:2 * rc + tw]
    return np.rint(out)


cellules = np.unique(P[:, 1])
C = {}
for k in FAM:
    C[k] = conv_tuiles(G[k]).ravel()[cellules]
    log("convolution", k)
pos = np.searchsorted(cellules, P[:, 1])


def aggreger(idx_cell, w):
    """idx_cell : indices dans `cellules` ; w : pixels bâtis. Rend la mesure et sa couverture."""
    nat = C["terres_nat_fr"][idx_cell]; ter = nat + C["terres_autres_fr"][idx_cell]
    valide = ter > 0
    tout = w.sum()
    out = {"poids_bati_px": int(tout), "cellules": int(len(w)),
           "poids_sans_mesure_pct": round(100 * float(w[~valide].sum() / tout), 4) if tout else None}
    if not valide.any():
        return out
    v = nat[valide] / ter[valide]; ww = w[valide].astype(np.float64)
    o = np.argsort(v); vs, ws = v[o], ww[o]
    cum = np.cumsum(ws) / ws.sum()
    q = lambda p: round(100 * float(vs[np.searchsorted(cum, p, side="left")]), 3)
    out.update({"valeur": round(100 * float((v * ww).sum() / ww.sum()), 3), "p10": q(0.1), "p50": q(0.5), "p90": q(0.9)})
    wv = ww / ww.sum()
    parts = {
        "terres_fr": ter[valide], "eaux_fr": C["eaux_fr"][idx_cell][valide],
        "eaux_hors_contours": C["eaux_hors"][idx_cell][valide], "terres_etrangeres": C["terres_hors"][idx_cell][valide],
        "non_classe_fr": C["non_classe_fr"][idx_cell][valide],
    }
    somme = sum(parts.values()) + C["autres"][idx_cell][valide]
    # Valeur 0 hors contours, et disque au-delà de l'emprise : tout ce qui n'est compté dans aucune autre famille.
    parts["hors_carte"] = DISQUE_PX - somme
    for k, x in parts.items():
        out[f"couv_{k}"] = round(100 * float((x / DISQUE_PX * wv).sum()), 3)
    # Centre bâti (repli nommé) : la cellule du barycentre bâti, si elle est bâtie et mesurée ; sinon la plus proche.
    rr, cc = cellules[idx_cell] // NC, cellules[idx_cell] % NC
    by, bx = np.average(rr, weights=w), np.average(cc, weights=w)
    j = int(np.argmin((rr - by) ** 2 + (cc - bx) ** 2))
    out["centre_bati_valeur"] = round(100 * float(nat[j] / ter[j]), 3) if ter[j] > 0 else None
    return out


ordre = np.argsort(P[:, 0], kind="stable")
P, pos = P[ordre], pos[ordre]
bornes = np.searchsorted(P[:, 0], np.arange(1, len(codes) + 2))
res = []
for i, code in enumerate(codes):
    s, e = bornes[i], bornes[i + 1]
    r = {"code": code, "type": "commune", "nom": noms[i]}
    r.update(aggreger(pos[s:e], P[s:e, 2]) if e > s else {"poids_bati_px": 0, "cellules": 0})
    res.append(r)
log("communes agrégées", len(res), "| sans bâti :", sum(1 for r in res if not r["poids_bati_px"]))

# ── Arrondissements, sur leurs propres pixels ─────────────────────────────────────────────────────────────
for a_ in json.load(open(ARR, encoding="utf8")):
    g = transform_geom("EPSG:4326", ds.crs, a_["contour"])
    b = shapely.geometry.shape(g).bounds
    win = rasterio.windows.from_bounds(*b, ds.transform).round_offsets().round_lengths()
    a = ds.read(1, window=win, boundless=True, fill_value=0)
    m = rasterize([(g, 1)], out_shape=a.shape, transform=ds.window_transform(win), fill=0, dtype="uint8").astype(bool) & EST_BATI[a]
    rr, cc = np.nonzero(m)
    gc = ((rr + int(win.row_off)) // CELL).astype(np.int64) * NC + (cc + int(win.col_off)) // CELL
    u, n = np.unique(gc, return_counts=True)
    k = np.searchsorted(cellules, u)
    ok = (k < len(cellules)) & (cellules[np.minimum(k, len(cellules) - 1)] == u)
    r = {"code": a_["code"], "type": "arrondissement", "nom": a_["nom"]}
    r.update(aggreger(k[ok], n[ok]))
    r["pixels_bati_hors_cellules_communales"] = int(n[~ok].sum())
    res.append(r)
log("arrondissements agrégés")

cols = ["code", "type", "nom", "valeur", "p10", "p50", "p90", "poids_bati_px", "cellules", "poids_sans_mesure_pct",
        "couv_terres_fr", "couv_eaux_fr", "couv_eaux_hors_contours", "couv_terres_etrangeres", "couv_non_classe_fr",
        "couv_hors_carte", "centre_bati_valeur"]
out = SORTIE / "secteur-habite-2023.csv.gz"
with gzip.open(out, "wt", encoding="utf8", newline="") as f:
    w = csv.DictWriter(f, fieldnames=cols, extrasaction="ignore")
    w.writeheader()
    for r in res:
        w.writerow(r)


def sha(p):
    h = hashlib.sha256()
    with open(p, "rb") as fh:
        for blk in iter(lambda: fh.read(1 << 22), b""):
            h.update(blk)
    return h.hexdigest()


meta = {"objet": "FUT-182 B2 : secteur habité national, hors application ; aucune publication",
        "methode": "oso-secteur-habite@1 (rapport FUT-182 § 31, § 39) ; poids : pixels bâtis OSO 1-2 ; disque 15 km sur grille 100 m ; "
                   "pixels sous contour communal français seulement ; quantiles pondérés",
        "lignes": len(res), "grille": [NR, NC], "disque_px_10m": DISQUE_PX, "paires_commune_cellule": int(len(P)),
        "pixels_autres_valeurs": int(G["autres"].sum()),
        "sources": {"raster_sha256": sha(TIF), "arrondissements_sha256": sha(ARR)},
        "sortie": {"fichier": out.name, "sha256": sha(out)}, "script_sha256": sha(Path(__file__)),
        "environnement": {"python": platform.python_version(), "numpy": np.__version__, "rasterio": rasterio.__version__,
                          "gdal": rasterio.__gdal_version__, "shapely": shapely.__version__},
        "duree_s": round(time.time() - t0), "date": time.strftime("%Y-%m-%dT%H:%M:%S%z")}
(SORTIE / "secteur-habite-2023.meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=1) + "\n", encoding="utf8")
log("écrit", out)
