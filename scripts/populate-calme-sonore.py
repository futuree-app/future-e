#!/usr/bin/env python3
"""Critère calme_sonore : éloignement aux grandes sources de bruit.

Sources V1 (noyau dur incontestable) :
  - autoroutes / voies rapides : OSM highway=motorway|trunk (+ _link)
  - rail principal             : OSM railway=rail filtré (cf. classify_rail)
  - aéroports commerciaux      : OSM aeroway=aerodrome dont iata in WHITELIST_IATA

Modèle : distance du CHEF-LIEU (lat/lon de l'index) à la source la plus proche de
chaque classe ; décroissance linéaire ABSOLUE par classe (rayons distincts) ;
combinaison MAX (source dominante) ; score = 100*(1-expo). Loin de tout = 100, JAMAIS null.
Descriptif (proximité), pas acoustique (dB). cf. docs/superpowers/specs/2026-06-04-calme-sonore-design.md

Usage :
    .venv-bpe/bin/python scripts/populate-calme-sonore.py --selftest
    .venv-bpe/bin/python scripts/populate-calme-sonore.py --summary
    .venv-bpe/bin/python scripts/populate-calme-sonore.py --probe
    .venv-bpe/bin/python scripts/populate-calme-sonore.py --matrix
    .venv-bpe/bin/python scripts/populate-calme-sonore.py --write-index
"""
import json, os, sys, math, argparse, urllib.request, urllib.parse
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX = os.path.join(ROOT, "data", "comparateur-index.json")
CACHE = os.path.join(ROOT, "data", ".cache")
OSM_TILE_DIR = os.path.join(CACHE, "osm-calme-tiles")
OUT_CACHE = os.path.join(CACHE, "communes-calme-sonore.json")

R_EARTH = 6371.0

# ── Rayons caractéristiques par classe (km) : décroissance linéaire absolue. ────
# Valeurs INITIALES indicatives, à CONFIRMER/AJUSTER par la sonde (gate porteur)
# avant la matrice témoins. Un aéroport porte plus loin qu'une autoroute (R_AUTO<R_RAIL<R_AERO).
R_AUTO = 1.5
R_RAIL = 3.0
R_AERO = 8.0

# ── Whitelist aéroports COMMERCIAUX (codes IATA) ───────────────────────────────
# Liste de référence stable et vérifiable (trafic passagers commercial significatif FR).
# Les coordonnées NE sont PAS codées en dur : récupérées depuis OSM (aeroway=aerodrome[iata])
# en n'acceptant QUE les iata de cette liste. On ne note JAMAIS aéroclubs/ULM.
WHITELIST_IATA = {
    "CDG", "ORY", "BVA",                       # Paris
    "NCE", "MRS", "LYS", "TLS", "BOD", "NTE",  # grandes métropoles
    "MLH", "LIL", "MPL", "BIQ", "AJA", "BIA",  # Bâle-Mulhouse, Lille, Montpellier, Biarritz, Corse
    "FSC", "CLY", "PGF", "RNS", "BES", "SXB",  # Figari, Calvi, Perpignan, Rennes, Brest, Strasbourg
    "CFE", "LRH", "TLN", "EGC", "PUF", "LDE",  # Clermont, La Rochelle, Toulon, Bergerac, Pau, Tarbes
    "GNB", "CMF", "BZR", "RDZ", "DCM", "CCF",  # Grenoble, Chambéry, Béziers, Rodez, Castres, Carcassonne
    "ETZ", "EPL", "DIJ", "QXB", "AUF", "BVE",  # Metz, Épinal, Dijon, Aix, Auxerre, Brive
    "LIG", "URO", "DOL", "ANG", "CET", "LBI",  # Limoges, Rouen, Dole, Angoulême, Cholet, Albi
    "NCY", "AVN", "VAF", "TUF", "PIS", "LRT",  # Annecy, Avignon, Valence, Tours, Poitiers, Lorient
    "QUI", "DNR", "LAI", "UIP", "CER", "BOL",  # Quimper, Dinard, Lannion, Quimper, Cherbourg, Bastia
}

def hav_km(lat0, lon0, lats, lons):
    """Distances haversine d'un point (lat0,lon0) à des arrays (lats,lons), en km."""
    p0 = math.radians(lat0); lp = np.radians(lats)
    a = np.sin((lp - p0) / 2) ** 2 + math.cos(p0) * np.cos(lp) * np.sin(np.radians(lons - lon0) / 2) ** 2
    return 2 * R_EARTH * np.arcsin(np.sqrt(a))

def expo_class(d_km, r_km):
    """Exposition d'une classe : 1 au contact, décroît linéairement, 0 au-delà du rayon."""
    if d_km is None:
        return 0.0
    return max(0.0, min(1.0, 1.0 - d_km / r_km))

def score_from_dists(d_auto, d_rail, d_aero):
    """Combinaison MAX (source dominante) -> (score 0-100, classe dominante, distance dominante).

    Loin de toute source -> expo 0 -> score 100. Ne renvoie JAMAIS None (calme = mesure, pas absence).
    """
    cands = [
        ("auto", d_auto, expo_class(d_auto, R_AUTO)),
        ("rail", d_rail, expo_class(d_rail, R_RAIL)),
        ("aero", d_aero, expo_class(d_aero, R_AERO)),
    ]
    src, dist, e = max(cands, key=lambda x: x[2])
    score = round(100 * (1 - e))
    if e <= 0.0:
        return 100, None, None  # calme : aucune source dominante à nommer
    return score, src, round(dist, 1)

def selftest():
    assert expo_class(0.0, 1.5) == 1.0
    assert expo_class(1.5, 1.5) == 0.0
    assert abs(expo_class(0.75, 1.5) - 0.5) < 1e-9
    assert expo_class(99.0, 8.0) == 0.0
    assert expo_class(None, 1.5) == 0.0
    # loin de tout -> 100, pas de source dominante, jamais None
    assert score_from_dists(50.0, 50.0, 50.0) == (100, None, None)
    # autoroute proche domine une voie ferrée plus lointaine (en expo)
    s, src, d = score_from_dists(0.75, 2.0, None)  # expo_auto .5 vs expo_rail .33
    assert (src, d) == ("auto", 0.8), (src, d)
    assert s == 50
    # aéroport à 4 km : expo .5 sur R_AERO=8
    s, src, d = score_from_dists(None, None, 4.0)
    assert (s, src, d) == (50, "aero", 4.0), (s, src, d)
    print("✓ selftest OK", file=sys.stderr)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--selftest", action="store_true")
    ap.add_argument("--summary", action="store_true")
    ap.add_argument("--probe", action="store_true")
    ap.add_argument("--matrix", action="store_true")
    ap.add_argument("--write-index", action="store_true")
    ap.add_argument("--refresh-osm", action="store_true")
    args = ap.parse_args()
    if args.selftest:
        selftest()
        return
    print("acquisition/calcul : voir Task 2-5", file=sys.stderr)

if __name__ == "__main__":
    main()
