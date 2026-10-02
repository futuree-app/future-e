#!/usr/bin/env python3
"""FUT-33, phase 1 : chiffres du rapport à partir des sorties de build_mer.py.

Produit rapport-chiffres.json (agrégats, exceptions, matrice des cas) et fixture-cas.json (le petit jeu de
cas de référence committé pour les tests). Les anciennes listes départementales ne servent ICI qu'à mesurer
ce que l'ancien monde affirmait ; elles n'interviennent jamais dans le calcul de la vérité (build_mer.py).
"""
import argparse
import collections
import json
from pathlib import Path

SEUILS = [0, 2, 5, 8, 15, 30, 100]
# Ancien monde, pour comparaison seulement (src/lib/commune-categories.ts au 02/10/2026).
ANCIEN_DEPT_ATLANTIQUE = {"14", "17", "22", "29", "50", "56", "85"}
ANCIEN_DEPT_MEDITERRANEE = {"04", "06", "11", "13", "30", "34", "66", "83", "84", "2A", "2B"}

CAS = {
    "littorales": ["17094", "29019", "06088", "76217", "35288", "44184", "22168"],
    "proxy_tres_faux": ["22113", "29151", "29133", "22343"],
    "estuaires": ["33063", "44109", "14118", "17299", "76540"],
    "interieures_dept_cotier": ["17415", "17347", "35238", "56178", "29024"],
    "lagunes_bassins": ["33009", "56260", "34301", "34172", "34154", "34344"],
    "lac": ["74010"],
    "plm": ["13201", "13207", "13208", "13216"],
}


def compte(vals, seuil):
    return sum(1 for v in vals if v is not None and (v == 0 if seuil == 0 else v <= seuil))


def principal():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", type=Path, required=True)
    a = ap.parse_args()
    com = json.loads((a.out / "mer-communes.json").read_text())
    par = {c["insee"]: c for c in com}
    loi = lambda c: set(c["loi"] or [])

    dist = {}
    for champ in ("ancienne_km", "centre_km", "territoire_km", "centre_brut_km", "territoire_brut_km"):
        vals = [c[champ] for c in com]
        dist[champ] = {("= 0" if s == 0 else f"<= {s}"): compte(vals, s) for s in SEUILS}

    def bascules(champ, s):
        avant = lambda c: c["ancienne_km"] is not None and c["ancienne_km"] <= s
        apres = lambda c: c[champ] is not None and c[champ] <= s
        return {"entrent": sum(1 for c in com if apres(c) and not avant(c)),
                "sortent": sum(1 for c in com if avant(c) and not apres(c))}

    changements = {f"{champ} ~ {s} km": bascules(champ, s) for champ in ("centre_km", "territoire_km") for s in (5, 15)}

    ancien_littoral = [c for c in com if c["ancienne_km"] is not None and c["ancienne_km"] <= 5]
    ancien_dept = [c for c in com if (c["dept"] in ANCIEN_DEPT_ATLANTIQUE or c["dept"] in ANCIEN_DEPT_MEDITERRANEE)]
    mer = [c for c in com if "Mer" in loi(c)]
    faux_positifs_proxy = [c for c in ancien_littoral if "Mer" not in loi(c) and (c["territoire_km"] or 0) > 2]
    faux_positifs_dept = [c for c in ancien_dept if "Mer" not in loi(c) and (c["territoire_km"] or 0) > 5]
    rates = [c for c in mer if c["ancienne_km"] is not None and c["ancienne_km"] > 5]

    # Validation croisée géométrie / juridique
    tolerances = [0.05, 0.2, 0.5, 1.0]
    mer_hors = {t: [c for c in mer if c["territoire_km"] is not None and c["territoire_km"] > t] for t in tolerances}
    sans = [c for c in com if not loi(c)]
    sans_touchant = [c for c in sans if c["territoire_km"] is not None and c["territoire_km"] == 0]
    estuaire = [c for c in com if "Estuaire" in loi(c) and "Mer" not in loi(c)]
    lac = [c for c in com if loi(c) == {"Lac"}]

    def court(c):
        return {k: c.get(k) for k in ("insee", "nom", "dept", "ancienne_km", "centre_km", "territoire_km", "centre_brut_km", "territoire_brut_km", "loi")}

    plus_grosses = sorted(com, key=lambda c: -abs((c["centre_km"] or 0) - (c["ancienne_km"] or 0)))[:25]
    rapport = {
        "communes": len(com),
        "distributions": dist,
        "changements": changements,
        "ancien_monde": {
            "proxy_littoral_le_5km": len(ancien_littoral),
            "faux_positifs_proxy (≤5 km, non Mer, territoire > 2 km)": len(faux_positifs_proxy),
            "dept_listes_anciennes": len(ancien_dept),
            "faux_positifs_dept (non Mer, territoire > 5 km)": len(faux_positifs_dept),
            "communes_Mer_ratees_par_le_proxy (> 5 km)": len(rates),
        },
        "validation": {
            "communes_Mer": len(mer),
            "Mer_territoire_au_dela": {str(t): len(v) for t, v in mer_hors.items()},
            "Mer_exceptions_0.5km": [court(c) for c in mer_hors[0.5]],
            "sans_classement_touchant_le_rivage": len(sans_touchant),
            "sans_classement_touchant_exemples": [court(c) for c in sans_touchant[:60]],
            "Estuaire_seul": len(estuaire),
            "Estuaire_territoire_0": sum(1 for c in estuaire if c["territoire_km"] == 0),
            "Lac_seul": len(lac),
            "Lac_territoire_le_5km": [court(c) for c in lac if c["territoire_km"] is not None and c["territoire_km"] <= 5],
        },
        "plus_grosses_differences_centre": [court(c) for c in plus_grosses],
        "exemples_faux_positifs_dept": [court(c) for c in sorted(faux_positifs_dept, key=lambda c: -c["territoire_km"])[:15]],
        "cas": {g: [court(par[i]) if i in par else {"insee": i, "absent_index": True} for i in ids] for g, ids in CAS.items()},
    }
    (a.out / "rapport-chiffres.json").write_text(json.dumps(rapport, ensure_ascii=False, indent=1))
    fixture = {"source": "build_mer.py (FUT-33 phase 1)", "methode": json.loads((a.out / "build-meta.json").read_text())["methode"],
               "cas": {i: court(par[i]) for ids in CAS.values() for i in ids if i in par}}
    (a.out / "fixture-cas.json").write_text(json.dumps(fixture, ensure_ascii=False, indent=1))
    print(json.dumps({k: rapport[k] for k in ("communes", "distributions", "changements", "ancien_monde")}, ensure_ascii=False, indent=1))
    v = rapport["validation"]
    print(json.dumps({k: v[k] for k in ("communes_Mer", "Mer_territoire_au_dela", "sans_classement_touchant_le_rivage", "Estuaire_seul", "Estuaire_territoire_0", "Lac_seul")}, ensure_ascii=False))


if __name__ == "__main__":
    principal()
