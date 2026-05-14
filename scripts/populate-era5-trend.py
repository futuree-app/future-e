#!/usr/bin/env python3
"""
populate-era5-trend.py

Calcule pour chaque commune française (métropole + Corse + DOM) la tendance
de température locale à partir de la réanalyse ERA5-Land (Copernicus CDS).

Méthodologie
------------
1. Téléchargement CDS de la variable 2m_temperature, moyennes mensuelles,
   1961 → dernière année complète, sur 4 zones bbox couvrant France + DOM.
2. Conversion Kelvin → Celsius, agrégation en moyenne annuelle par cellule grille.
3. Pour chaque commune (centroïde via geo.api.gouv.fr) :
   - sélection de la cellule grille la plus proche
   - baseline_mean_c = moy. annuelle 1961-1990 (norme OMM)
   - recent_mean_c   = moy. annuelle des 10 dernières années complètes
   - delta_c         = recent - baseline (signal principal narratif)
   - trend_per_decade_c = pente OLS °C/décennie sur la série complète (interne)
4. Upsert dans Supabase `commune_era5_trend`.

Prérequis
---------
- Compte CDS configuré : ~/.cdsapirc avec url + key
- Licence dataset acceptée : https://cds.climate.copernicus.eu/datasets/reanalysis-era5-land-monthly-means
- Variables d'environnement : NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

Dépendances Python
------------------
    pip install cdsapi xarray netCDF4 numpy requests supabase

Usage
-----
    python scripts/populate-era5-trend.py

Premier run : ~30 min à 2h (téléchargements CDS dans la queue).
Runs suivants : les .nc déjà téléchargés ne sont pas re-téléchargés.
"""

import os
import sys
import time
from pathlib import Path

try:
    import xarray as xr
    import numpy as np
    import requests
    from supabase import create_client
except ImportError as e:
    sys.exit(f"Dépendance manquante : {e}. Installer avec : pip install xarray netCDF4 numpy requests supabase")

# cdsapi est optionnel : seulement requis si on doit télécharger une zone manquante.
try:
    import cdsapi
    HAS_CDSAPI = True
except ImportError:
    HAS_CDSAPI = False


# ─── Configuration ──────────────────────────────────────────────────────────

CDS_DATASET = "reanalysis-era5-land-monthly-means"

# Période couverte : 1961 → dernière année complète disponible sur CDS.
# Ajuster YEAR_END selon la disponibilité (~3 mois de lag CDS).
YEAR_START = 1961
YEAR_END   = 2025
YEARS      = [str(y) for y in range(YEAR_START, YEAR_END + 1)]
MONTHS     = [f"{m:02d}" for m in range(1, 13)]

# Normales climatiques de référence
BASELINE_START, BASELINE_END = 1961, 1990  # norme OMM
RECENT_YEARS = 10                          # moyenne glissante des 10 dernières années

# 4 bbox CDS au format [North, West, South, East]
ZONES = {
    "metro":        [51.5, -5.5, 41.0, 10.0],   # France métropolitaine + Corse
    "antilles":     [18.5, -63.5, 14.0, -60.5], # Martinique, Guadeloupe, St-Martin, St-Barth
    "guyane":       [ 6.0, -55.0,  2.0, -51.5], # Guyane
    "ocean_indien": [-12.0, 44.0, -22.0, 56.0], # Réunion, Mayotte
}

# Départements INSEE par zone (utilisé pour récupérer les centroïdes communes)
METRO_DEPTS  = [f"{d:02d}" for d in range(1, 96)] + ["2A", "2B"]
DOM_DEPTS    = ["971", "972", "973", "974", "976"]  # Guadeloupe, Martinique, Guyane, Réunion, Mayotte
ALL_DEPTS    = METRO_DEPTS + DOM_DEPTS

# Stockage local des NetCDF téléchargés
DATA_DIR = Path("data/era5")
DATA_DIR.mkdir(parents=True, exist_ok=True)


# ─── 1. Téléchargement CDS par zone ─────────────────────────────────────────

def download_zone(zone_name: str, bbox: list[float]) -> Path | None:
    """Télécharge le NetCDF ERA5-Land pour une zone bbox. Skip si déjà fait.
    Renvoie None si le fichier n'existe pas et que cdsapi n'est pas configuré."""
    target = DATA_DIR / f"era5_{zone_name}.nc"
    if target.exists() and target.stat().st_size > 100_000:
        print(f"  ✓ {zone_name} déjà téléchargé : {target} ({target.stat().st_size / 1e6:.1f} Mo)")
        return target

    if not HAS_CDSAPI:
        print(f"  ⚠ {zone_name} absent · cdsapi non installé · zone ignorée")
        return None

    print(f"  → Téléchargement {zone_name} bbox={bbox} (peut prendre 30-90 min en queue CDS)…")
    try:
        client = cdsapi.Client()
        request = {
            "product_type":   ["monthly_averaged_reanalysis"],
            "variable":       ["2m_temperature"],
            "year":           YEARS,
            "month":          MONTHS,
            "time":           ["00:00"],
            "area":           bbox,
            "data_format":    "netcdf",
            "download_format": "unarchived",
        }
        client.retrieve(CDS_DATASET, request).download(str(target))
        print(f"  ✓ {zone_name} téléchargé : {target} ({target.stat().st_size / 1e6:.0f} Mo)")
        return target
    except Exception as exc:
        print(f"  ⚠ {zone_name} échec téléchargement : {exc} · zone ignorée")
        return None


# ─── 2. Récupération des centroïdes des communes (INSEE) ────────────────────

def fetch_commune_centroids() -> dict[str, tuple[float, float, str]]:
    """Récupère lat/lon de toutes les communes via geo.api.gouv.fr.
    Retourne {insee_code: (lat, lon, nom)}."""
    print("Récupération des centroïdes communes (geo.api.gouv.fr)…")
    communes: dict[str, tuple[float, float, str]] = {}

    for dept in ALL_DEPTS:
        url = f"https://geo.api.gouv.fr/communes?codeDepartement={dept}&fields=code,nom,centre&format=json"
        try:
            r = requests.get(url, timeout=30)
            r.raise_for_status()
            for c in r.json():
                centre = c.get("centre")
                if centre and centre.get("coordinates"):
                    lon, lat = centre["coordinates"]
                    communes[c["code"]] = (float(lat), float(lon), c["nom"])
        except Exception as exc:
            print(f"  ⚠ dept {dept} : {exc}")
        time.sleep(0.05)

    print(f"  ✓ {len(communes)} communes trouvées")
    return communes


def find_zone_for_commune(lat: float, lon: float) -> str | None:
    """Détermine quelle zone (et donc quel NetCDF) couvre cette commune."""
    for zone_name, (N, W, S, E) in ZONES.items():
        if S <= lat <= N and W <= lon <= E:
            return zone_name
    return None


# ─── 3. Calcul des tendances ────────────────────────────────────────────────

def detect_time_dim(ds: xr.Dataset) -> str:
    """ERA5-Land récents utilisent 'valid_time', anciens 'time'."""
    for name in ("valid_time", "time"):
        if name in ds.dims:
            return name
    raise ValueError(f"Pas de dimension temporelle trouvée. Dims : {list(ds.dims)}")


def compute_annual_means(ds: xr.Dataset) -> xr.DataArray:
    """Convertit t2m (K) → moyenne annuelle (°C) par cellule grille.
    Filtre les années incomplètes (< 12 mois) pour éviter de biaiser la moyenne récente."""
    t2m = ds["t2m"] - 273.15
    time_dim = detect_time_dim(ds)

    # Compte de mois par année (basé uniquement sur la dimension temporelle, indépendant des cellules NaN)
    times = ds[time_dim].values  # datetime64[ns]
    years_per_step = np.array([np.datetime64(t, "Y").astype(int) + 1970 for t in times])
    unique_years, counts = np.unique(years_per_step, return_counts=True)
    complete_years = set(unique_years[counts == 12].tolist())

    annual = t2m.groupby(f"{time_dim}.year").mean(dim=time_dim)
    keep = [y for y in annual["year"].values if int(y) in complete_years]
    return annual.sel(year=keep)


def extract_cell_with_fallback(annual: xr.DataArray, lat: float, lon: float, max_radius_deg: float = 0.5) -> np.ndarray | None:
    """Extrait la série temporelle annuelle pour la cellule la plus proche.
    Si la cellule la plus proche est NaN (commune côtière sur pixel mer),
    cherche la cellule terre la plus proche dans un rayon max_radius_deg."""
    cell = annual.sel(latitude=lat, longitude=lon, method="nearest")
    vals = np.asarray(cell.values, dtype=float)
    if not np.isnan(vals).all():
        return vals

    # Fallback : grille 5×5 autour du point, cherche la plus proche cellule valide
    lats = annual["latitude"].values
    lons = annual["longitude"].values
    # cellules dans le rayon
    lat_mask = np.abs(lats - lat) <= max_radius_deg
    lon_mask = np.abs(lons - lon) <= max_radius_deg
    candidate_lats = lats[lat_mask]
    candidate_lons = lons[lon_mask]

    best_dist = np.inf
    best_vals = None
    for cl in candidate_lats:
        for cn in candidate_lons:
            test = annual.sel(latitude=cl, longitude=cn, method="nearest").values
            test = np.asarray(test, dtype=float)
            if np.isnan(test).all():
                continue
            d = (cl - lat) ** 2 + (cn - lon) ** 2
            if d < best_dist:
                best_dist = d
                best_vals = test
    return best_vals


def compute_trends(
    communes: dict[str, tuple[float, float, str]],
    zone_annuals: dict[str, xr.DataArray],
) -> list[dict]:
    """Pour chaque commune, calcule baseline / recent / delta / trend."""
    print("Calcul des tendances…")
    results = []
    skipped = 0

    for insee, (lat, lon, name) in communes.items():
        zone = find_zone_for_commune(lat, lon)
        if zone is None or zone not in zone_annuals:
            skipped += 1
            continue

        annual = zone_annuals[zone]
        vals = extract_cell_with_fallback(annual, lat, lon)
        if vals is None:
            skipped += 1
            continue
        years = np.asarray(annual["year"].values, dtype=int)

        # Baseline 1961-1990
        bmask = (years >= BASELINE_START) & (years <= BASELINE_END)
        bvals = vals[bmask]
        bvals = bvals[~np.isnan(bvals)]
        if len(bvals) < 20:  # exiger au moins 20 années valides sur la baseline
            skipped += 1
            continue
        baseline_mean = float(np.mean(bvals))

        # Récent : 10 dernières années complètes
        valid_years = years[~np.isnan(vals)]
        if len(valid_years) == 0:
            skipped += 1
            continue
        latest_year = int(np.max(valid_years))
        rmask = (years >= latest_year - RECENT_YEARS + 1) & (years <= latest_year)
        rvals = vals[rmask]
        rvals = rvals[~np.isnan(rvals)]
        if len(rvals) < 5:
            skipped += 1
            continue
        recent_mean = float(np.mean(rvals))

        # Tendance OLS sur la série complète (°C/décennie)
        full_mask = ~np.isnan(vals)
        if full_mask.sum() >= 30:
            slope, _ = np.polyfit(years[full_mask], vals[full_mask], 1)
            trend = float(slope * 10)
        else:
            trend = None

        results.append({
            "insee_code":        insee,
            "baseline_mean_c":   round(baseline_mean, 2),
            "recent_mean_c":     round(recent_mean, 2),
            "delta_c":           round(recent_mean - baseline_mean, 2),
            "trend_per_decade_c": round(trend, 2) if trend is not None else None,
            "data_through_year": latest_year,
        })

    print(f"  ✓ {len(results)} communes calculées · {skipped} ignorées (zone, données insuffisantes)")
    return results


# ─── 4. Upsert Supabase ─────────────────────────────────────────────────────

def upsert_results(results: list[dict]):
    print("Upsert Supabase…")
    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = (
        os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
        or os.environ.get("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")
    )
    if not url or not key:
        sys.exit("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")

    sb = create_client(url, key)

    batch_size = 1000
    for i in range(0, len(results), batch_size):
        chunk = results[i:i + batch_size]
        sb.table("commune_era5_trend").upsert(chunk, on_conflict="insee_code").execute()
        print(f"  ✓ upserted {i + len(chunk)}/{len(results)}")


# ─── Main ───────────────────────────────────────────────────────────────────

def main():
    print(f"Période : {YEAR_START}-{YEAR_END}")
    print(f"Baseline : {BASELINE_START}-{BASELINE_END} (norme OMM)")
    print(f"Recent   : moyenne glissante {RECENT_YEARS} dernières années\n")

    # 1. Téléchargement des 4 zones (skip celles déjà présentes ou indispos)
    print("=== Vérification des fichiers ERA5 ===")
    paths = {}
    for name, bbox in ZONES.items():
        p = download_zone(name, bbox)
        if p is not None:
            paths[name] = p

    if not paths:
        sys.exit("Aucun fichier ERA5 disponible. Place un .nc dans data/era5/ ou installe cdsapi + configure ~/.cdsapirc.")

    # 2. Ouverture des NetCDF + agrégation annuelle
    print(f"\n=== Agrégation annuelle ({len(paths)} zone(s)) ===")
    zone_annuals = {}
    for name, p in paths.items():
        ds = xr.open_dataset(p)
        zone_annuals[name] = compute_annual_means(ds)
        print(f"  ✓ {name} : {len(zone_annuals[name]['year'])} années")

    # 3. Centroïdes communes
    print()
    communes = fetch_commune_centroids()

    # 4. Calcul tendances
    print()
    results = compute_trends(communes, zone_annuals)

    # 5. Upsert
    print()
    upsert_results(results)

    print(f"\n✓ Terminé. {len(results)} communes en base.")


if __name__ == "__main__":
    main()
