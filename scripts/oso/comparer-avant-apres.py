#!/usr/bin/env python3
"""FUT-182 · B3 · tableau national AVANT / APRÈS du champ `nature` de l'index. Lecture seule ; n'écrit que --out.

Usage (depuis la racine du dépôt) :
    git show <commit-avant>:data/comparateur-index.json.gz > /tmp/avant.json.gz
    python3 scripts/oso/comparer-avant-apres.py /tmp/avant.json.gz data/comparateur-index.json.gz --out RESULTATS_JSON

Avant = index de `main` (méthode A : communes entières par la distance de leur centre, eau comprise ; parts du contour,
eau comprise, arrondies au dixième). Après = index intégré par scripts/oso/integrer-oso-2023.py (secteur habité ;
parts des terres non arrondies, serres comprises). Les règles d'application sont REPRODUITES ici depuis le code (les
lignes de référence sont citées) ; un test de la PR vérifie que les seuils cités sont ceux du code.

Ce qui est compté : effectifs par statut du secteur ; scores changés, écarts, seuils franchis (paliers 34/66, /qna
40/70, raisons 55/50, signature 60/70, trait 88) ; verdicts de rang (bandes ≤ 20 % / ≥ 80 %) ; communes qui perdent
leur classement (et leur verdict d'avant) ; catégories `land.category`, `rural_agricole`, `rural_forestier` ; seuil de
boisement 70 % ; trait distinctif nature ; et les cas de recette.
"""
import gzip
import json
import sys
from collections import Counter
from pathlib import Path

args = [a for a in sys.argv[1:] if not a.startswith("--")]
if len(args) < 2:
    sys.exit(__doc__)
OUT = Path(sys.argv[sys.argv.index("--out") + 1]) if "--out" in sys.argv else None
A = {c["insee"]: c for c in json.load(gzip.open(args[0]))["communes"]}
B = {c["insee"]: c for c in json.load(gzip.open(args[1]))["communes"]}
R = {}
r1 = lambda x: int(x * 10 + 0.5) / 10 if x >= 0 else -int(-x * 10 + 0.5) / 10


def verdict(c):
    b = (c.get("rankBands") or {}).get("nature")
    if not b:
        return "sans_rang"
    lo, hi = b[0] / 10000, b[1] / 10000
    return "defavorable" if hi <= 0.2 else ("favorable" if lo >= 0.8 else "neutre")


# comparateur-vie.ts : `dense = densite >= 1500` ; catégories rurales réservées aux communes peu denses.
peu_dense = lambda c: c.get("densite") is not None and c["densite"] < 1500


def cats_avant(c):
    n = c.get("nature") or {}
    comp = n.get("composition")
    if not (peu_dense(c) and comp):
        return set()
    return {k for k, ok in (("rural_agricole", comp.get("agricole", 0) >= 30), ("rural_forestier", comp.get("foret", 0) >= 35)) if ok}


def cats_apres(c):
    t = (c.get("nature") or {}).get("terres")
    if not (peu_dense(c) and t):
        return set()
    return {k for k, ok in (("rural_agricole", t["cultures"] + t["serres"] >= 30), ("rural_forestier", t["foret"] >= 35)) if ok}


def land_cat(nat, urb, agri):
    # territoire/facts.ts `landCategory`.
    if urb >= 50: return "mostly_built"
    if nat >= 45: return "high_natural"
    if agri >= 50: return "agricultural"
    if nat < 20: return "low_natural"
    return "mixed"


def land_avant(c):
    n = c.get("nature") or {}
    comp, b = n.get("composition"), n.get("brut_pct")
    if not comp or b is None:
        return None
    land = 100 - comp["eau"]
    return land_cat(r1(max(0, (b - comp["eau"]) * 100 / land)), r1(comp["artificialise"] * 100 / land), r1(comp["agricole"] * 100 / land))


def land_apres(c):
    t = (c.get("nature") or {}).get("terres")
    return land_cat(t["naturel"], t["urbanise"], t["cultures"] + t["serres"]) if t else None


communes = sorted(set(A) | set(B))
statuts = Counter(((B.get(k) or {}).get("nature") or {}).get("secteur", {}).get("statut", "absent") for k in communes)
R["effectifs"] = {"entrees_index": len(B), "statuts_secteur": dict(statuts),
                  "score_avant": sum(1 for k in A if (A[k].get("nature") or {}).get("score") is not None),
                  "score_apres": sum(1 for k in B if (B[k].get("nature") or {}).get("score") is not None),
                  "nature_avant": sum(1 for k in A if A[k].get("nature")), "nature_apres": sum(1 for k in B if B[k].get("nature"))}

sc = lambda c: (c.get("nature") or {}).get("score")
both = [k for k in communes if k in A and k in B and sc(A[k]) is not None and sc(B[k]) is not None]
d = [sc(B[k]) - sc(A[k]) for k in both]
SEUILS = {34: "palier 34", 40: "/qna 40", 50: "faiblesse 50", 55: "raison 55", 60: "promesse 60", 66: "palier 66", 70: "/qna et signature 70", 88: "trait 88"}
R["scores"] = {
    "communes_comparees": len(both), "changes": sum(1 for x in d if x), "abs_ge_5": sum(1 for x in d if abs(x) >= 5),
    "abs_ge_10": sum(1 for x in d if abs(x) >= 10), "abs_ge_20": sum(1 for x in d if abs(x) >= 20),
    "min_max": [min(d), max(d)],
    "seuils_franchis": {f"{t} ({lib})": sum(1 for k in both if (sc(A[k]) >= t) != (sc(B[k]) >= t)) for t, lib in SEUILS.items()},
}
perdu = [k for k in communes if k in A and k in B and sc(A[k]) is not None and sc(B[k]) is None]
R["classement_perdu"] = {
    "communes": len(perdu),
    "par_statut": dict(Counter(B[k]["nature"]["secteur"]["statut"] if B[k].get("nature") else "absent" for k in perdu)),
    "verdict_avant": dict(Counter(verdict(A[k]) for k in perdu)),
    "verdict_apres": dict(Counter(verdict(B[k]) for k in perdu)),
    "score_avant_ge_88": sum(1 for k in perdu if sc(A[k]) >= 88),
}
va = {k: verdict(A[k]) for k in communes if k in A}
vb = {k: verdict(B[k]) for k in communes if k in B}
trans = Counter(f"{va.get(k, 'absent')}->{vb.get(k, 'absent')}" for k in communes if va.get(k) != vb.get(k))
R["verdicts_rang"] = {"changes": sum(trans.values()), "transitions": dict(trans)}

ca = {k: cats_avant(A[k]) for k in A}
cb = {k: cats_apres(B[k]) for k in B}
R["categories_couvert"] = {cat: {"avant": sum(cat in v for v in ca.values()), "apres": sum(cat in v for v in cb.values()),
                                 "entrent": sum(1 for k in B if cat in cb[k] and cat not in ca.get(k, set())),
                                 "sortent": sum(1 for k in A if cat in ca[k] and cat not in cb.get(k, set()))}
                           for cat in ("rural_agricole", "rural_forestier")}
la = {k: land_avant(A[k]) for k in A}
lb = {k: land_apres(B[k]) for k in B}
tl = Counter(f"{la.get(k)}->{lb.get(k)}" for k in communes if la.get(k) != lb.get(k))
R["land_category"] = {"changes": sum(tl.values()), "transitions": dict(tl)}
fa = {k: (A[k].get("nature") or {}).get("composition", {}).get("foret") for k in A}
fb = {k: ((B[k].get("nature") or {}).get("terres") or {}).get("foret") for k in B}
R["boisement_70"] = {"avant": sum(1 for v in fa.values() if v is not None and v >= 70), "apres": sum(1 for v in fb.values() if v is not None and v >= 70),
                     "entrent": sum(1 for k in B if (fb[k] or 0) >= 70 and not (fa.get(k) or 0) >= 70),
                     "sortent": sum(1 for k in A if (fa[k] or 0) >= 70 and not (fb.get(k) or 0) >= 70)}
univers = [k for k in B if (B[k].get("nature") or {}).get("score") is not None]
R["boisement_70"]["part_apres_dans_l_univers_des_communes_valorisees"] = round(R["boisement_70"]["apres"] / sum(1 for v in fb.values() if v is not None), 4)
R["trait_nature_score_ge_88"] = {"avant": sum(1 for k in A if (sc(A[k]) or 0) >= 88), "apres": sum(1 for k in B if (sc(B[k]) or 0) >= 88)}

RECETTE = {"29155": "Ouessant", "56085": "Hœdic", "85113": "L'Île-d'Yeu", "17019": "Ars-en-Ré", "17121": "La Couarde-sur-Mer",
           "17318": "Saint-Clément-des-Baleines", "08106": "Charnois", "08122": "Chooz", "25386": "Montancy", "13004": "Arles",
           "13096": "Saintes-Maries-de-la-Mer", "50218": "Granville", "17034": "Barzan", "85104": "Grues", "76353": "Héberville",
           "2B045": "Bustanico", "31081": "Bourg-d'Oueil", "65208": "Grailhen", "75119": "Paris 19e", "69381": "Lyon 1er",
           "13211": "Marseille 11e", "34301": "Sète", "83069": "Hyères"}
cas = {}
for k, nom in RECETTE.items():
    a, b = A.get(k, {}), B.get(k, {})
    s = ((b.get("nature") or {}).get("secteur") or {})
    cas[k] = {"nom": nom, "score_avant": sc(a) if a else None, "score_apres": sc(b) if b else None,
              "verdict_avant": verdict(a) if a else None, "verdict_apres": verdict(b) if b else None,
              "statut": s.get("statut"), "valeur": s.get("valeur"), "couvert_fr_pct": s.get("couvert_fr_pct"), "cause": s.get("cause"),
              "land_avant": la.get(k), "land_apres": lb.get(k)}
R["cas_de_recette"] = cas
# Voisins des paliers de couverture (± 1 point de 50 et de 75).
vois = sorted(((k, B[k]["nature"]["secteur"]["couvert_fr_pct"]) for k in B
               if (B[k].get("nature") or {}).get("secteur", {}).get("couvert_fr_pct") is not None
               and (abs(B[k]["nature"]["secteur"]["couvert_fr_pct"] - 50) <= 1 or abs(B[k]["nature"]["secteur"]["couvert_fr_pct"] - 75) <= 1)),
              key=lambda x: x[1])
R["voisins_des_paliers"] = [(k, B[k]["nom"], v, B[k]["nature"]["secteur"]["statut"], sc(B[k])) for k, v in vois]
print(json.dumps({k: v for k, v in R.items() if k not in ("cas_de_recette", "voisins_des_paliers")}, ensure_ascii=False, indent=1))
if OUT:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(R, ensure_ascii=False, indent=1) + "\n", encoding="utf8")
    print("écrit :", OUT)
