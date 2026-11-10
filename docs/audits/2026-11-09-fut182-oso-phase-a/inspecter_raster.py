"""FUT-182 · phase A, reprise · inspection du raster OSO 2023 (OCS_2023.tif). Lecture seule, AUCUN recalcul national.

Usage (depuis la racine du dépôt) :
    python docs/audits/2026-11-09-fut182-oso-phase-a/inspecter_raster.py OCS_2023.tif CACHE_DIR [--out RESULTATS_JSON]

Ce que fait le script, et seulement cela :
  1. histogramme national des valeurs 0-255 du raster (une lecture séquentielle, ligne à ligne) ;
  2. sur un ÉCHANTILLON de communes (cas témoins, communes à couverture < 97 %, 200 communes tirées au hasard à graine
     fixe, communes dont la forêt des terres estimée est entre 67 et 73 %) : comptes de pixels par valeur, avec le masque
     de `populate-nature.py` (`rasterio.mask`, `all_touched=False`, contours geo.api.gouv.fr du cache, reprojetés de
     EPSG:4326 vers le CRS du raster). Les comptes 1-23 et « naturel élargi » sont comparés au cache : c'est la preuve
     que ce fichier est celui qui a produit l'index.
  3. pour les communes proches de 70 % de forêt : la part exacte des forêts dans les terres, avant arrondi.
Rien n'est écrit hors du fichier de résultats.
"""
import json
import random
import sys
import time
from collections import Counter
from pathlib import Path

import numpy as np
import rasterio
from rasterio.mask import mask
from rasterio.warp import transform_geom

args = [a for a in sys.argv[1:] if not a.startswith("--")]
if len(args) < 2:
    sys.exit(__doc__)
TIF, CACHE_DIR = Path(args[0]), Path(args[1])
OUT = Path(sys.argv[sys.argv.index("--out") + 1]) if "--out" in sys.argv else None
R = {}
ds = rasterio.open(TIF)
R["entete"] = {"crs": str(ds.crs), "epsg": ds.crs.to_epsg(), "pas_m": ds.res, "largeur": ds.width, "hauteur": ds.height,
               "dtype": ds.dtypes[0], "nodata_declare": ds.nodata, "compression": ds.profile.get("compress"),
               "tuile": ds.profile.get("tiled"), "emprise": tuple(ds.bounds)}
print(R["entete"], flush=True)

# ── 1. Histogramme national ───────────────────────────────────────────────────────────────────────────────
if "--sans-histogramme" not in sys.argv:
    t0 = time.time()
    h = np.zeros(256, dtype=np.int64)
    pas = 512
    for r0 in range(0, ds.height, pas):
        w = rasterio.windows.Window(0, r0, ds.width, min(pas, ds.height - r0))
        h += np.bincount(ds.read(1, window=w).ravel(), minlength=256)
        if (r0 // pas) % 40 == 0:
            print(f"  histogramme {r0}/{ds.height} ({time.time() - t0:.0f}s)", flush=True)
    R["histogramme"] = {str(v): int(n) for v, n in enumerate(h) if n}
    classes = h[1:25].sum()
    R["histogramme_km2"] = {"classes_1_23": round(float(h[1:24].sum()) / 1e4, 1), "serres_24": round(float(h[24]) / 1e4, 1),
                            "valeur_0": round(float(h[0]) / 1e4, 1), "valeur_255": round(float(h[255]) / 1e4, 1),
                            "autres_valeurs": {str(v): int(h[v]) for v in range(25, 255) if h[v]}}
    print(json.dumps(R["histogramme_km2"]), f"({time.time() - t0:.0f}s)", flush=True)

# ── 2. Échantillon de communes ────────────────────────────────────────────────────────────────────────────
rec = json.load(open(CACHE_DIR / "communes-nature.json", encoding="utf8"))
geom, noms = {}, {}
for f in sorted((CACHE_DIR / "contours").glob("*.json")):
    for c in json.load(open(f, encoding="utf8")):
        if c.get("contour"):
            geom[c["code"]] = c["contour"]; noms[c["code"]] = c.get("nom")

ELARGI = {13, 16, 17, 18, 19, 20, 21, 22, 23}
TEMOINS = ["13004", "13096", "85113", "17094", "34301", "34192", "17299", "74010", "44116", "02100", "28199", "2B096", "33063",
           "59350", "13054", "34198", "44010", "73091", "77186", "50218", "13027", "13083", "13036", "76353", "85255"]
random.seed(182)
alea = random.sample(sorted(k for k in rec if k in geom), 200)
# Communes proches du seuil de forêt (estimé depuis le cache, terres = 100 − eau).
pres_70 = [k for k, r in rec.items() if k in geom and 67 <= r["composition"]["foret"] * 100 / (100 - r["composition"]["eau"]) <= 73]
echantillon = list(dict.fromkeys(TEMOINS + alea + pres_70))
print("échantillon :", len(echantillon), "dont proches de 70 % :", len(pres_70), flush=True)

lignes = {}
t0 = time.time()
for n, k in enumerate(echantillon):
    g = transform_geom("EPSG:4326", ds.crs, geom[k])
    # filled=False : seuls les pixels dont le centre tombe dans le contour, comme populate-nature.py (qui lit ensuite
    # 1-23 dans le tableau rempli de 0 hors contour : mêmes pixels classés). Les 0 comptés ici sont donc DANS le contour.
    inside, _ = mask(ds, [g], crop=True, filled=False)
    a = inside[0].compressed()
    cnt = np.bincount(a, minlength=256)
    tot = int(cnt[1:24].sum()); nat = int(sum(cnt[c] for c in ELARGI))
    lignes[k] = {"nom": noms[k], "px_1_23": tot, "nat_px": nat, "cache_tot_px": rec[k]["tot_px"], "cache_nat_px": rec[k]["nat_px"],
                 "identique": tot == rec[k]["tot_px"] and nat == rec[k]["nat_px"],
                 "px_0": int(cnt[0]), "px_24_serres": int(cnt[24]), "px_255": int(cnt[255]),
                 "px_autres": int(cnt[25:255].sum()), "px_dans_contour": int(cnt.sum()),
                 "foret_terres_pct_exact": round(100 * float(cnt[16] + cnt[17]) / float(tot - cnt[23]), 3) if tot - cnt[23] else None,
                 "eau_px": int(cnt[23])}
    if n % 100 == 0:
        print(f"  {n}/{len(echantillon)} ({time.time() - t0:.0f}s)", flush=True)
R["echantillon"] = lignes
ok = sum(v["identique"] for v in lignes.values())
R["identite"] = {"communes": len(lignes), "identiques_au_cache": ok,
                 "ecarts": [(k, v["nom"], v["px_1_23"] - v["cache_tot_px"], v["nat_px"] - v["cache_nat_px"]) for k, v in lignes.items() if not v["identique"]][:30]}
print(json.dumps(R["identite"], ensure_ascii=False), flush=True)

def part(k, champ):
    v = lignes[k]
    return round(100 * v[champ] / v["px_dans_contour"], 3) if v["px_dans_contour"] else None

R["couverture_echantillon"] = sorted(
    [(k, v["nom"], part(k, "px_0"), part(k, "px_24_serres"), part(k, "px_255"), part(k, "px_autres")) for k, v in lignes.items()],
    key=lambda x: -(x[2] + x[3] + x[4] + x[5]))[:30]
print("déficits (0 / serres / 255 / autres, % du contour) :", R["couverture_echantillon"][:15], flush=True)
tous = Counter()
for v in lignes.values():
    tous.update({"0": v["px_0"], "24": v["px_24_serres"], "255": v["px_255"], "autres": v["px_autres"]})
R["echantillon_totaux_hors_1_23"] = dict(tous)
f70 = {k: lignes[k]["foret_terres_pct_exact"] for k in pres_70}
R["foret_pres_70"] = {"communes": len(f70), "ge70_exact": sum(1 for v in f70.values() if v is not None and v >= 70),
                      "entre_69_5_et_70_5": sorted([(k, noms[k], v) for k, v in f70.items() if v is not None and 69.5 <= v < 70.5], key=lambda x: x[2])}
print(json.dumps(R["foret_pres_70"], ensure_ascii=False)[:3000], flush=True)
if OUT:
    OUT.write_text(json.dumps(R, ensure_ascii=False, indent=1, default=lambda o: o.item() if hasattr(o, "item") else str(o)) + "\n", encoding="utf8")
    print("écrit :", OUT)
