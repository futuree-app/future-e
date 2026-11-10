"""FUT-182 · B2 · analyse du secteur habité national (sortie de b2_national.py). Hors ligne ; AUCUN score publié.

Lecture seule. N'écrit que le fichier de résultats (--out). Dépendance : numpy.

Usage (depuis la racine du dépôt) :
    python -I docs/audits/2026-11-09-fut182-oso-phase-a/b2_analyse.py SECTEUR_CSV_GZ [--out JSON]

Ce que le script mesure, sans rien trancher :
  1. la couverture des disques, en paliers provisoires (≥ 75 %, 50-75 %, < 50 % du disque couvert par des données
     françaises = terres et eaux sous contour français), et la CAUSE dominante de ce qui manque : mer et eaux hors
     contours, rien de cartographié (hors carte), terres étrangères exclues, pixels non classés ;
  2. l'accord avec l'échantillon de 87 communes (b2_preparation.py) ;
  3. les rangs SIMULÉS : percentile national du secteur habité (même formule que populate-nature.py), avec et sans les
     communes sous 50 % ; ce que leur exclusion change pour les autres ; l'écart à l'index publié (méthode A, eau
     comprise). Les verdicts de rang (≤ 0,2 / ≥ 0,8) et les seuils de score sont recomptés. Rien n'entre dans l'index.
"""
import bisect
import csv
import gzip
import json
import sys
from collections import Counter
from pathlib import Path

import numpy as np

RACINE = Path(__file__).resolve().parents[3]
args = [a for a in sys.argv[1:] if not a.startswith("--")]
if not args:
    sys.exit(__doc__)
OUT = Path(sys.argv[sys.argv.index("--out") + 1]) if "--out" in sys.argv else None
lignes = list(csv.DictReader(gzip.open(args[0], "rt", encoding="utf8")))
f = lambda x: float(x) if x not in ("", None) else None
idx = {c["insee"]: c for c in json.load(gzip.open(RACINE / "data/comparateur-index.json.gz"))["communes"]}
R = {}

com = [l for l in lignes if l["type"] == "commune" and l["code"] in idx and idx[l["code"]].get("nature")]
arr = [l for l in lignes if l["type"] == "arrondissement"]
sans_bati = [l for l in lignes if l["type"] == "commune" and f(l["valeur"]) is None]
R["perimetre"] = {"lignes": len(lignes), "communes_de_l_univers_nature": len(com), "arrondissements": len(arr),
                  "communes_sans_valeur": [(l["code"], l["nom"], l["poids_bati_px"]) for l in sans_bati]}
print("périmètre", json.dumps(R["perimetre"], ensure_ascii=False)[:800], flush=True)

# ── 1. Couverture ─────────────────────────────────────────────────────────────────────────────────────────
CAUSES = {"couv_eaux_hors_contours": "mer_et_eaux_hors_contours", "couv_hors_carte": "hors_carte",
          "couv_terres_etrangeres": "terres_etrangeres", "couv_non_classe_fr": "non_classe_fr"}


def couverture(l):
    fr = f(l["couv_terres_fr"]) + f(l["couv_eaux_fr"])
    manque = {v: f(l[k]) for k, v in CAUSES.items()}
    # Une cause n'est nommée que si ce qui manque atteint 1 % du disque : en deçà, ce sont des bords de pixels.
    cause = max(manque, key=manque.get) if sum(max(0.0, v) for v in manque.values()) >= 1 else "aucune"
    return fr, cause, manque


cv = [(l, *couverture(l)) for l in com if f(l["valeur"]) is not None]
palier = lambda x: "ge75" if x >= 75 else ("50_75" if x >= 50 else "lt50")
R["couverture"] = {
    "paliers": dict(Counter(palier(x[1]) for x in cv)),
    "cause_dominante_par_palier": {p: dict(Counter(x[2] for x in cv if palier(x[1]) == p)) for p in ("ge75", "50_75", "lt50")},
    "national_moyen_pct": {k: round(float(np.mean([f(x[0][k]) for x in cv])), 3) for k in ["couv_terres_fr", "couv_eaux_fr"] + list(CAUSES)},
    "non_classe_fr_max_pct": round(max(f(x[0]["couv_non_classe_fr"]) for x in cv), 3),
    "terres_etrangeres_ge_10pct": sum(1 for x in cv if f(x[0]["couv_terres_etrangeres"]) >= 10),
    "lt50_liste": sorted([(x[0]["code"], x[0]["nom"], round(x[1], 1), x[2], {k: round(v, 1) for k, v in x[3].items()}) for x in cv if x[1] < 50], key=lambda t: t[2]),
    "50_75_exemples": sorted([(x[0]["code"], x[0]["nom"], round(x[1], 1), x[2]) for x in cv if 50 <= x[1] < 75], key=lambda t: t[2])[:40],
    "poids_sans_mesure_max_pct": max(f(x[0]["poids_sans_mesure_pct"]) for x in cv),
}
print("couverture", json.dumps({k: v for k, v in R["couverture"].items() if not k.endswith("liste") and k != "50_75_exemples"}, ensure_ascii=False), flush=True)

# ── 2. Accord avec l'échantillon ──────────────────────────────────────────────────────────────────────────
ech = json.load(open(Path(__file__).with_name("resultats-b2-preparation.json"), encoding="utf8"))["communes"]
par = {l["code"]: l for l in lignes if l["type"] == "commune"}
d = np.array([f(par[k]["valeur"]) - v["france_bati_1_2"]["secteur_habite_pct"] for k, v in ech.items() if k in par and f(par[k]["valeur"]) is not None])
R["accord_echantillon"] = {"communes": int(len(d)), "ecart_abs_max_pts": round(float(np.abs(d).max()), 3),
                           "ecart_abs_p90_pts": round(float(np.percentile(np.abs(d), 90)), 3), "ecart_median_pts": round(float(np.median(d)), 3),
                           "plus_forts": sorted([(k, v["nom"], round(f(par[k]["valeur"]) - v["france_bati_1_2"]["secteur_habite_pct"], 3)) for k, v in ech.items() if k in par and f(par[k]["valeur"]) is not None], key=lambda t: -abs(t[2]))[:6]}
print("accord échantillon", R["accord_echantillon"], flush=True)

# ── 3. Rangs simulés ──────────────────────────────────────────────────────────────────────────────────────
codes = [x[0]["code"] for x in cv]
val = np.array([round(f(x[0]["valeur"]), 1) for x in cv])
fr = np.array([x[1] for x in cv])
sc_idx = np.array([idx[k]["nature"]["score"] for k in codes])


def score(v, univers):
    srt = sorted(v[univers]); n = len(srt)
    return np.array([round(100 * bisect.bisect_right(srt, x) / n) if u else -1 for x, u in zip(v, univers)])


def verdict(s, univers):
    srt = np.sort(s[univers])
    lo = np.searchsorted(srt, s, side="left") / len(srt); hi = np.searchsorted(srt, s, side="right") / len(srt)
    return np.where(~univers, "incertain", np.where(hi <= 0.2, "mismatch", np.where(lo >= 0.8, "satisfied", "neutral")))


tout = np.ones(len(codes), dtype=bool)
garde = fr >= 50
S_all, S_ex = score(val, tout), score(val, garde)
V_all, V_ex = verdict(S_all, tout), verdict(S_ex, garde)
V_idx = verdict(sc_idx, tout)


def ecart(sa, sb, va, vb, masque):
    ds = (sb - sa)[masque]
    return {"communes": int(masque.sum()), "score_change": int((ds != 0).sum()), "abs_ge_5": int((np.abs(ds) >= 5).sum()),
            "abs_ge_10": int((np.abs(ds) >= 10).sum()), "abs_ge_20": int((np.abs(ds) >= 20).sum()),
            "delta_p1_p99": [int(np.percentile(ds, 1)), int(np.percentile(ds, 99))],
            "seuils": {t: int(((sa >= t) != (sb >= t))[masque].sum()) for t in (34, 40, 50, 55, 60, 66, 70, 88)},
            "verdict_change": int((va != vb)[masque].sum()), "transitions": dict(Counter(f"{a}->{b}" for a, b in zip(va[masque], vb[masque]) if a != b))}


R["rangs_simules"] = {
    "avertissement": "simulation hors ligne : aucun de ces scores n'est publié ni écrit dans l'index",
    "exclusion_lt50_effet_sur_les_autres": ecart(S_all, S_ex, V_all, V_ex, garde),
    "index_publie_vers_secteur_habite_tous": ecart(sc_idx, S_all, V_idx, V_all, tout),
    "index_publie_vers_secteur_habite_exclusion_lt50": ecart(sc_idx, np.where(garde, S_ex, sc_idx), V_idx, V_ex, tout),
    "communes_lt50_verdict_index": dict(Counter(V_idx[~garde])),
    "trait_score_ge_88": {"index": int((sc_idx >= 88).sum()), "secteur_tous": int((S_all >= 88).sum()), "secteur_exclusion": int((S_ex >= 88).sum())},
    "plus_forts_ecarts_index_secteur": sorted([(codes[i], idx[codes[i]]["nom"], int(sc_idx[i]), int(S_all[i]), float(val[i]), round(float(fr[i]), 1))
                                                for i in range(len(codes))], key=lambda t: -abs(t[3] - t[2]))[:20],
}
print("rangs", json.dumps({k: v for k, v in R["rangs_simules"].items() if k != "plus_forts_ecarts_index_secteur"}, ensure_ascii=False)[:3000], flush=True)

# ── 4. Distribution, dispersion, centre bâti, arrondissements ─────────────────────────────────────────────
larg = np.array([f(x[0]["p90"]) - f(x[0]["p10"]) for x in cv])
cb = np.array([(f(x[0]["centre_bati_valeur"]) - f(x[0]["valeur"])) if f(x[0]["centre_bati_valeur"]) is not None else np.nan for x in cv])
R["distribution"] = {"quantiles_valeur": {q: round(float(np.percentile(val, q)), 1) for q in (1, 10, 25, 50, 75, 90, 99)},
                     "largeur_p10_p90": {"mediane": round(float(np.median(larg)), 2), "p90": round(float(np.percentile(larg, 90)), 2),
                                         "ge_20_pts": int((larg >= 20).sum()), "max": round(float(larg.max()), 2)},
                     "centre_bati_moins_secteur_pts": {"abs_median": round(float(np.nanmedian(np.abs(cb))), 2), "abs_p90": round(float(np.nanpercentile(np.abs(cb), 90)), 2),
                                                       "abs_ge_5": int((np.abs(cb) >= 5).sum()), "max": round(float(np.nanmax(np.abs(cb))), 2)}}
R["arrondissements"] = {l["code"]: {"nom": l["nom"], "valeur": f(l["valeur"]), "p10": f(l["p10"]), "p90": f(l["p90"]),
                                    "couvert_fr": round(f(l["couv_terres_fr"]) + f(l["couv_eaux_fr"]), 2)} for l in arr}
print("distribution", json.dumps(R["distribution"], ensure_ascii=False), flush=True)
if OUT:
    OUT.write_text(json.dumps(R, ensure_ascii=False, indent=1, default=lambda o: o.item() if hasattr(o, "item") else str(o)) + "\n", encoding="utf8")
    print("écrit :", OUT)
