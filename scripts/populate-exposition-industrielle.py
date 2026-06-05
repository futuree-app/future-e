#!/usr/bin/env python3
"""Critère faible_exposition_industrielle : éloignement aux sites industriels à risque.

Source : Géorisques ICPE (installations_classees), 137k sites nationaux géolocalisés.
Filtre : Seveso (haut/bas) + IED + industrie (autorisation/enregistrement). EXCLUT élevages,
éoliennes, carrières, déclaratif. Pondéré par GRAVITÉ (le compte brut mentirait : Paris 1427
ICPE / 0 Seveso vs Marseille 411 / Seveso).
Exposition HYBRIDE : E = dominant(max poids*proximité) + λ*bassin(somme). Le site le plus
préoccupant proche domine ; la concentration ajuste. Loin de tout = 100, jamais null.
Récit (langage courant, sans chiffre) : Seveso -> « site industriel à risque majeur » ;
IED/industrie -> « site industriel ». Distance interne. Géométrie (PLM contourné).
cf. docs/superpowers/specs/2026-06-05-exposition-industrielle-design.md

Usage :
    .venv-bpe/bin/python scripts/populate-exposition-industrielle.py --selftest
    .venv-bpe/bin/python scripts/populate-exposition-industrielle.py --summary
    .venv-bpe/bin/python scripts/populate-exposition-industrielle.py --probe
    .venv-bpe/bin/python scripts/populate-exposition-industrielle.py --matrix
    .venv-bpe/bin/python scripts/populate-exposition-industrielle.py --write-index
"""
import json, os, sys, math, argparse, urllib.request, urllib.parse, time
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX = os.path.join(ROOT, "data", "comparateur-index.json")
CACHE = os.path.join(ROOT, "data", ".cache")
ICPE_CACHE = os.path.join(CACHE, "georisques-icpe-national.json")

R_EARTH = 6371.0

# ── Boutons FIGÉS PAR SONDE (gate porteur). Valeurs de départ provisoires. ──────
R_EXPO = 8.0     # rayon d'exposition (km) : un site industriel « pèse » dans ce rayon
H_HALF = 6.0     # demi-vie : score = 100 * 0.5^(E/H). Plus H petit, plus c'est sévère.
LAMBDA = 0.15    # poids du terme « bassin » (concentration). FAIBLE : garantit l'invariant.

# Poids de gravité (départ brutal, sonde réduira l'écart si besoin).
WEIGHT = {"seveso_haut": 10.0, "seveso_bas": 5.0, "ied": 3.0, "industrie": 1.0}

def hav_km(lat0, lon0, lats, lons):
    p0 = math.radians(lat0); lp = np.radians(lats)
    a = np.sin((lp - p0) / 2) ** 2 + math.cos(p0) * np.cos(lp) * np.sin(np.radians(lons - lon0) / 2) ** 2
    return 2 * R_EARTH * np.arcsin(np.sqrt(a))

def icpe_class(p):
    """Classe de gravité d'une installation, ou None si exclue. p = dict de propriétés Géorisques."""
    if p.get("eolienne") or p.get("bovins") or p.get("porcs") or p.get("volailles") or p.get("carriere"):
        return None  # hors sujet (agriculture/éolien) ou nuisance locale (carrière, V2)
    s = p.get("statutSeveso")
    if s == "Seveso seuil haut":
        return "seveso_haut"
    if s == "Seveso seuil bas":
        return "seveso_bas"
    if p.get("ied"):
        return "ied"
    if p.get("industrie") and p.get("regime") in ("Autorisation", "Enregistrement"):
        return "industrie"
    return None  # déclaratif / banal : exclu

def exposure(sites):
    """sites = liste de (classe, distance_km). Retourne (E, classe_dominante) ou (0.0, None).

    E = dominant(max poids*proximité) + LAMBDA*bassin(somme poids*proximité). Le site qui
    réalise le dominant donne la classe nommée au récit.
    """
    best_c, best_contrib, total = None, 0.0, 0.0
    for cls, d in sites:
        w = WEIGHT[cls]
        contrib = w * max(0.0, 1.0 - d / R_EXPO)
        if contrib <= 0.0:
            continue
        total += contrib
        if contrib > best_contrib:
            best_contrib, best_c = contrib, cls
    if best_c is None:
        return 0.0, None
    return best_contrib + LAMBDA * total, best_c

def score_from_E(E):
    """Saturant : E=0 -> 100 (loin de tout, jamais null). Score haut = éloigné des sites."""
    return round(100 * 0.5 ** (E / H_HALF))

def selftest():
    assert icpe_class({"statutSeveso": "Seveso seuil haut"}) == "seveso_haut"
    assert icpe_class({"statutSeveso": "Seveso seuil bas"}) == "seveso_bas"
    assert icpe_class({"ied": True}) == "ied"
    assert icpe_class({"industrie": True, "regime": "Autorisation"}) == "industrie"
    assert icpe_class({"industrie": True, "regime": "Déclaration"}) is None  # déclaratif exclu
    assert icpe_class({"eolienne": True}) is None
    assert icpe_class({"porcs": True}) is None
    assert icpe_class({"carriere": True}) is None
    assert icpe_class({"statutSeveso": "Non Seveso"}) is None
    # score : loin de tout -> 100
    assert score_from_E(0.0) == 100
    assert score_from_E(H_HALF) == 50
    # INVARIANT PORTEUR (le coeur du critère) : 1 Seveso seuil haut à 1 km doit être PLUS
    # exposé que 60 petites ICPE à 2 km. Garantit que la gravité bat la quantité.
    E_major, c_major = exposure([("seveso_haut", 1.0)])
    E_pile, _ = exposure([("industrie", 2.0)] * 60)
    assert c_major == "seveso_haut"
    assert E_major > E_pile, f"INVARIANT CASSÉ : Seveso {E_major:.2f} <= pile {E_pile:.2f} (baisser LAMBDA)"
    # le récit nomme la classe du site dominant
    _, c = exposure([("industrie", 1.0), ("seveso_haut", 0.5)])
    assert c == "seveso_haut"
    print("✓ selftest OK", file=sys.stderr)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--selftest", action="store_true")
    ap.add_argument("--summary", action="store_true")
    ap.add_argument("--probe", action="store_true")
    ap.add_argument("--matrix", action="store_true")
    ap.add_argument("--write-index", action="store_true")
    ap.add_argument("--refresh", action="store_true")
    args = ap.parse_args()
    if args.selftest:
        selftest()
        return
    print("acquisition/calcul : voir Task 2+", file=sys.stderr)

if __name__ == "__main__":
    main()
