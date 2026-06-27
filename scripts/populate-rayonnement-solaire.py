#!/usr/bin/env python3
"""
populate-rayonnement-solaire.py — ensoleillement réel (rayonnement solaire ERA5).

POURQUOI. Le critère `ensoleillement_recherche` AFFICHE « ensoleillé » mais MESURE
température d'été + faible pluie (attribution fausse, cf. doctrine/editoriale.md et
docs/cadrage-ensoleillement-attribution.md). On le répare avec une donnée qui est
*vraiment* du soleil : le rayonnement solaire reçu au sol (surface_solar_radiation_
downwards, ERA5-Land), couverture nationale complète sur grille ~9 km.

HONNÊTETÉ. C'est du RAYONNEMENT (énergie), pas un nombre d'heures de soleil. Le récit
reste qualitatif (« très / peu ensoleillé »), on n'invente jamais un nombre d'heures
(ça, ce serait les normales stations Météo-France). Rayonnement et durée d'insolation
sont très corrélés : même gradient nord/sud, même classement (le rayonnement accentue
juste un peu l'écart, effet latitude/jour long). À VALIDER empiriquement (étape QA)
avant de livrer : corréler sur ~30 villes contre les heures publiées.

QUOI.
  1) Télécharge ssrd mensuel ERA5-Land 1991-2020 (normale OMM), metropole, → .nc.
  2) Moyenne annuelle par maille, puis plus-proche maille pour chaque commune
     (lat/lon déjà dans data/comparateur-index.json — aucun appel réseau centroïdes).
  3) Écrit data/communes-rayonnement.json { insee: indice_rayonnement }.

La valeur est un INDICE RELATIF (l'unité ERA5 brute importe peu : le critère n'utilisera
que le percentile national). L'injection dans l'index + la réparation du critère sont
des étapes SÉPARÉES (après la validation QA).

Prérequis : ~/.cdsapirc (compte CDS + token), licence ERA5-Land acceptée, cdsapi + xarray.
  python3 scripts/populate-rayonnement-solaire.py
"""
from __future__ import annotations
import json
import sys
from pathlib import Path

import numpy as np
import xarray as xr

try:
    import cdsapi
    HAS_CDSAPI = True
except ImportError:
    HAS_CDSAPI = False

CDS_DATASET = "reanalysis-era5-land-monthly-means"
VARIABLE = "surface_solar_radiation_downwards"
# Normale OMM 1991-2020. Fenêtre réduisable si le download est trop long.
YEARS = [str(y) for y in range(1991, 2021)]
MONTHS = [f"{m:02d}" for m in range(1, 13)]
METRO_BBOX = [51.5, -5.5, 41.0, 10.0]  # [N, W, S, E] France métro + Corse

DATA_DIR = Path("data/era5")
NC_PATH = DATA_DIR / "era5_ssrd_metro.nc"
INDEX_PATH = Path("data/comparateur-index.json")
OUT_PATH = Path("data/communes-rayonnement.json")

PROBE = {"29019": "Brest", "56121": "Lorient", "06088": "Nice", "13055": "Marseille"}


def download() -> bool:
    """Télécharge le .nc ssrd si absent. False si impossible (pas de clé)."""
    if NC_PATH.exists() and NC_PATH.stat().st_size > 100_000:
        print(f"✓ déjà téléchargé : {NC_PATH} ({NC_PATH.stat().st_size / 1e6:.1f} Mo)")
        return True
    if not HAS_CDSAPI:
        print("⚠ cdsapi non installé.")
        return False
    print(f"→ Téléchargement {VARIABLE} {YEARS[0]}-{YEARS[-1]} (queue CDS : 10-60 min)…")
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    client = cdsapi.Client()
    request = {
        "product_type": ["monthly_averaged_reanalysis"],
        "variable": [VARIABLE],
        "year": YEARS,
        "month": MONTHS,
        "time": ["00:00"],
        "area": METRO_BBOX,
        "data_format": "netcdf",
        "download_format": "unarchived",
    }
    client.retrieve(CDS_DATASET, request).download(str(NC_PATH))
    print(f"✓ téléchargé : {NC_PATH} ({NC_PATH.stat().st_size / 1e6:.0f} Mo)")
    return True


def aggregate() -> None:
    ds = xr.open_dataset(NC_PATH)
    # Nom de variable robuste (ssrd / nom long).
    varname = "ssrd" if "ssrd" in ds.data_vars else list(ds.data_vars)[0]
    da = ds[varname]
    # Coordonnées spatiales robustes.
    latname = "latitude" if "latitude" in da.coords else "lat"
    lonname = "longitude" if "longitude" in da.coords else "lon"
    # Moyenne sur toutes les dimensions non spatiales (temps).
    time_dims = [d for d in da.dims if d not in (latname, lonname)]
    annual = da.mean(dim=time_dims)  # 2D (lat, lon), indice relatif

    # ERA5-Land masque les océans (NaN). Les communes côtières tomberaient sur une
    # maille « mer » avec un simple plus-proche → on cherche la maille TERRESTRE
    # (non-NaN) la plus proche. KDTree-like en numpy pur (pas de scipy).
    glat = annual[latname].values
    glon = annual[lonname].values
    grid = annual.values  # (nlat, nlon)
    LON, LAT = np.meshgrid(glon, glat)
    valid = ~np.isnan(grid)
    vlat = LAT[valid].astype(np.float64)
    vlon = LON[valid].astype(np.float64)
    vval = grid[valid].astype(np.float64)
    coslat = np.cos(np.deg2rad(np.mean(glat)))  # isotropie lon approx

    communes = json.loads(INDEX_PATH.read_text())["communes"]
    geo = [(c["insee"], c["lat"], c["lon"]) for c in communes if c.get("lat") is not None]
    insees = [g[0] for g in geo]
    clat = np.array([g[1] for g in geo], dtype=np.float64)
    clon = np.array([g[2] for g in geo], dtype=np.float64)

    # Plus-proche maille valide, par paquets pour limiter la mémoire.
    picked = np.empty(len(insees), dtype=np.float64)
    CHUNK = 1000
    for i in range(0, len(insees), CHUNK):
        dlat = clat[i:i + CHUNK, None] - vlat[None, :]
        dlon = (clon[i:i + CHUNK, None] - vlon[None, :]) * coslat
        nearest = np.argmin(dlat * dlat + dlon * dlon, axis=1)
        picked[i:i + CHUNK] = vval[nearest]

    out: dict[str, float] = {}
    for insee, val in zip(insees, picked):
        out[insee] = None if np.isnan(val) else round(float(val), 1)

    OUT_PATH.write_text(json.dumps(out))
    n = sum(1 for v in out.values() if v is not None)
    print(f"✓ rayonnement écrit : {OUT_PATH} — {n}/{len(out)} communes.")
    for ic, nom in PROBE.items():
        if ic in out:
            print(f"   {nom:<10} indice rayonnement = {out[ic]}")


def main() -> None:
    if not download():
        sys.exit(
            "Téléchargement impossible. Configure ~/.cdsapirc (compte CDS + token) "
            "et accepte la licence ERA5-Land, puis relance."
        )
    aggregate()


if __name__ == "__main__":
    main()
