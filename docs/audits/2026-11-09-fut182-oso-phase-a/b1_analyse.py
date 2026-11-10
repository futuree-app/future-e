"""FUT-182 · B1 · validation et analyse des comptes nationaux (sortie de b1_comptes.py). Hors ligne, hors application.

Lecture seule. N'écrit que le fichier de résultats (--out) et, si --parts est donné, le fichier des parts terrestres
par commune (hors dépôt). Dépendance : numpy.

Usage (depuis la racine du dépôt) :
    python -I docs/audits/2026-11-09-fut182-oso-phase-a/b1_analyse.py COMPTES_CSV_GZ CACHE_JSON [--out JSON] [--parts CSV_GZ]

  COMPTES_CSV_GZ  comptes-pixels.csv.gz de b1_comptes.py (toutes les valeurs du raster, par contour).
  CACHE_JSON      data/cache-nature/communes-nature.json du dépôt principal (ce qui a produit l'index).

TOUT EST EXACT ICI : les parts se calculent sur des comptes entiers, avant tout arrondi. Les seuils s'appliquent aux
valeurs non arrondies (arbitrage D). Les seules approximations restantes sont celles de la MÉTHODE A elle-même
(sélection de communes entières par la distance de leur centre), reproduite à l'identique pour mesurer l'effet de
l'eau à méthode constante ; ce n'est pas la méthode retenue (secteur habité, B2).

Conventions du contrat révisé (rapport § 27, arbitrages du 10/11/2026) :
  terres            = classes 1-22 et 24 (serres) ; l'eau (23) est à part ; 0, 255 et le hors emprise sont NON MESURÉS
  naturel terrestre = 13 prairies (poste distinct), 16-17 forêts, 18 pelouses, 19 landes, 20 roche, 21 dunes, 22 glaciers
  cultures          = 5-12 grandes cultures, 14 vergers, 15 vignes, 24 serres (poste distinct)
  urbanisé          = 1-4
Variante S0 (« serres exclues », la règle implicite de l'index actuel) : terres = 1-22, serres ignorées.
"""
import bisect
import csv
import gzip
import json
import math
import sys
from collections import Counter
from pathlib import Path

import numpy as np

RACINE = Path(__file__).resolve().parents[3]
args = [a for a in sys.argv[1:] if not a.startswith("--")]
if len(args) < 2:
    sys.exit(__doc__)
COMPTES, CACHE = Path(args[0]), Path(args[1])
opt = lambda k: Path(sys.argv[sys.argv.index(k) + 1]) if k in sys.argv else None
OUT, PARTS = opt("--out"), opt("--parts")
R = {}

# ── Lecture ───────────────────────────────────────────────────────────────────────────────────────────────
lignes = list(csv.DictReader(gzip.open(COMPTES, "rt", encoding="utf8")))
V = list(range(25)) + [255]
COM = {l["code"]: l for l in lignes if l["type"] == "commune"}
ARR = {l["code"]: l for l in lignes if l["type"] == "arrondissement"}
vec = lambda l: np.array([int(l[f"v{v}"]) for v in V] + [int(l["v_autres"])], dtype=np.int64)  # 27 cases
rec = json.load(open(CACHE, encoding="utf8"))
idx = json.load(gzip.open(RACINE / "data/comparateur-index.json.gz"))
par_code = {c["insee"]: c for c in idx["communes"]}
print(f"comptes : {len(COM)} communes, {len(ARR)} arrondissements | cache : {len(rec)} | index : {len(par_code)}", flush=True)

S = lambda a, cls: int(sum(a[c] for c in cls))  # a indexé par la valeur 0-24 ; 25 = 255, 26 = autres
ARTI, GDC, PRA, VER, VIG, FOR = [1, 2, 3, 4], list(range(5, 13)), [13], [14], [15], [16, 17]
PEL, LAN, MIN_, DUN, GLA, EAU, SER = [18], [19], [20], [21], [22], [23], [24]
ELARGI_CACHE = [13, 16, 17, 18, 19, 20, 21, 22, 23]
NAT_T = [13, 16, 17, 18, 19, 20, 21, 22]
CULT = GDC + VER + VIG  # sans serres
CATS_CACHE = {"foret": FOR, "prairies": PRA, "landes_pelouses": LAN + PEL, "mineral_dunes": MIN_ + DUN + GLA, "eau": EAU,
              "agricole": CULT, "artificialise": ARTI}

# ── 1. Identité avec le cache, sur les champs comparables ─────────────────────────────────────────────────
ecarts = Counter()
ex = {}
for k, r in rec.items():
    if k not in COM:
        ecarts["absent_des_comptes"] += 1
        continue
    a = vec(COM[k])
    tot = S(a, range(1, 24)); nat = S(a, ELARGI_CACHE)
    if tot != r["tot_px"]:
        ecarts["tot_px"] += 1; ex.setdefault("tot_px", []).append((k, tot - r["tot_px"]))
    if nat != r["nat_px"]:
        ecarts["nat_px"] += 1; ex.setdefault("nat_px", []).append((k, nat - r["nat_px"]))
    if round(100 * nat / tot, 1) != r["brut_pct"]:
        ecarts["brut_pct"] += 1
    comp = {c: round(100 * S(a, s) / tot, 1) for c, s in CATS_CACHE.items()}
    if comp != r["composition"]:
        ecarts["composition"] += 1; ex.setdefault("composition", []).append(k)
hors_cache = sorted(set(COM) - set(rec))
R["identite_cache"] = {"communes_cache": len(rec), "communes_comptees": len(COM), "ecarts": dict(ecarts),
                       "exemples": {k: v[:10] for k, v in ex.items()},
                       "comptees_hors_cache": [(k, COM[k]["nom"], int(COM[k]["px_contour"])) for k in hors_cache]}
print("1. identité :", json.dumps(R["identite_cache"], ensure_ascii=False)[:1500], flush=True)

# ── 2. Couverture ─────────────────────────────────────────────────────────────────────────────────────────
def couverture(l):
    a = vec(l); aire_px = float(l["aire_contour_m2"]) / 100
    classes = S(a, range(1, 25)); px = int(l["px_contour"])
    hors = max(0.0, aire_px - px)
    return {"aire_px": aire_px, "classes_1_24": classes, "v0": int(a[0]), "v255": int(a[25]), "autres": int(a[26]),
            "hors_emprise_px": hors, "mesure_pct": 100 * classes / aire_px if aire_px else None}

cov = {k: couverture(l) for k, l in COM.items()}
m = np.array([c["mesure_pct"] for c in cov.values()])
tot_aire = sum(c["aire_px"] for c in cov.values())
R["couverture"] = {
    "regle": "mesuré = pixels 1-24 (serres comprises : elles sont classées) ; non mesuré = 0, 255, autres valeurs, et la part "
             "du contour sans pixel (hors emprise du raster), rapportés à l'aire du contour",
    "national_km2": {"aire_contours": round(tot_aire / 1e4, 1),
                     "classes_1_24": round(sum(c["classes_1_24"] for c in cov.values()) / 1e4, 1),
                     "v0_dans_contours": round(sum(c["v0"] for c in cov.values()) / 1e4, 2),
                     "v255": sum(c["v255"] for c in cov.values()), "autres_valeurs": sum(c["autres"] for c in cov.values()),
                     "hors_emprise": round(sum(c["hors_emprise_px"] for c in cov.values()) / 1e4, 2)},
    "quantiles_mesure_pct": {q: round(float(np.percentile(m, q)), 3) for q in (0.1, 1, 5, 50)},
    "communes_sous": {s: int((m < s).sum()) for s in (99.5, 99, 98, 95, 90)},
    "plus_basses": sorted([(k, COM[k]["nom"], round(c["mesure_pct"], 2), c["v0"], round(c["hors_emprise_px"]))
                           for k, c in cov.items()], key=lambda x: x[2])[:20],
}
print("2. couverture :", json.dumps(R["couverture"], ensure_ascii=False)[:2500], flush=True)

# ── 3. Paris, Lyon, Marseille : arrondissements contre commune parente ────────────────────────────────────
plm = {}
for p in ("75056", "69123", "13055"):
    enf = [a for a in ARR.values() if a["parent"] == p]
    somme = sum(vec(a) for a in enf); par = vec(COM[p])
    d = somme - par
    aire_s = sum(float(a["aire_contour_m2"]) for a in enf); aire_p = float(COM[p]["aire_contour_m2"])
    def parts(a):
        t = S(a, list(range(1, 23)) + SER)
        return {"naturel_terres": round(100 * S(a, NAT_T) / t, 2), "foret_terres": round(100 * S(a, FOR) / t, 2),
                "urbanise_terres": round(100 * S(a, ARTI) / t, 2), "eau_pct_mesure": round(100 * a[23] / (t + a[23]), 2)}
    plm[p] = {"nom": COM[p]["nom"], "arrondissements": len(enf), "pixels_commune": int(par.sum()), "pixels_somme": int(somme.sum()),
              "ecart_total_px": int(d.sum()), "ecart_abs_par_valeur_px": int(np.abs(d).sum()),
              "ecart_relatif": round(float(np.abs(d).sum()) / float(par.sum()), 6),
              "aire_somme_moins_commune_m2": round(aire_s - aire_p, 1),
              "parts_commune": parts(par), "parts_somme_arrondissements": parts(somme),
              "par_arrondissement": {a["code"]: {"nom": a["nom"], **parts(vec(a)), "mesure_pct": round(couverture(a)["mesure_pct"], 2)} for a in sorted(enf, key=lambda x: x["code"])}}
R["plm"] = plm
for p, x in plm.items():
    print("3. PLM", p, {k: v for k, v in x.items() if k != "par_arrondissement"}, flush=True)

# ── 4. Parts terrestres exactes (S1 : serres dans les cultures) et S0 (serres exclues) ────────────────────
codes = sorted(k for k in COM if k in rec)
A = np.array([vec(COM[k]) for k in codes], dtype=np.float64)
col = lambda cls: A[:, cls].sum(axis=1)
eau, ser = A[:, 23], A[:, 24]
ter1 = col(list(range(1, 23))) + ser          # S1
ter0 = col(list(range(1, 23)))                # S0
nat_t, foret, cult0, urb = col(NAT_T), col(FOR), col(CULT), col(ARTI)
cult1 = cult0 + ser
pct = lambda num, den: np.where(den > 0, 100 * num / np.where(den > 0, den, 1), np.nan)
P1 = {"naturel": pct(nat_t, ter1), "foret": pct(foret, ter1), "cultures": pct(cult1, ter1), "urbanise": pct(urb, ter1),
      "serres": pct(ser, ter1), "prairies": pct(col(PRA), ter1)}
P0 = {"naturel": pct(nat_t, ter0), "foret": pct(foret, ter0), "cultures": pct(cult0, ter0), "urbanise": pct(urb, ter0)}
eau_pct = pct(eau, ter1 + eau)
couv = np.array([cov[k]["mesure_pct"] for k in codes])
N = len(codes)
pos = {k: i for i, k in enumerate(codes)}

# Valeurs ACTUELLES de l'application, depuis l'index arrondi (facts.ts `readLandShares`, comparateur-vie.ts, materiality).
comp = [rec[k]["composition"] for k in codes]
r1 = lambda x: math.floor(x * 10 + 0.5) / 10  # Math.round(n * 10) / 10 (JS), pour des valeurs positives
cur_foret_contour = np.array([c["foret"] for c in comp])          # boisement Projet, rural_forestier : % du contour, eau comprise
cur_agri_contour = np.array([c["agricole"] for c in comp])        # rural_agricole : % du contour, eau comprise
land = np.array([100 - c["eau"] for c in comp])
cur_t = {"naturel": np.array([r1(max(0, (rec[k]["brut_pct"] - c["eau"]) * 100 / l)) for k, c, l in zip(codes, comp, land)]),
         "urbanise": np.array([r1(c["artificialise"] * 100 / l) for c, l in zip(comp, land)]),
         "cultures": np.array([r1(c["agricole"] * 100 / l) for c, l in zip(comp, land)])}

if PARTS:
    with gzip.open(PARTS, "wt", encoding="utf8", newline="") as f:
        w = csv.writer(f)
        w.writerow(["code", "nom", "mesure_pct_contour", "eau_pct_mesure", "naturel_terres", "dont_prairies", "foret_terres",
                    "cultures_terres", "dont_serres", "urbanise_terres", "naturel_terres_S0", "cultures_terres_S0"])
        for i, k in enumerate(codes):
            w.writerow([k, COM[k]["nom"], f"{couv[i]:.4f}", f"{eau_pct[i]:.4f}", f"{P1['naturel'][i]:.4f}", f"{P1['prairies'][i]:.4f}",
                        f"{P1['foret'][i]:.4f}", f"{P1['cultures'][i]:.4f}", f"{P1['serres'][i]:.4f}", f"{P1['urbanise'][i]:.4f}",
                        f"{P0['naturel'][i]:.4f}", f"{P0['cultures'][i]:.4f}"])
    print("parts écrites :", PARTS, flush=True)

# ── 5. Seuils : qui franchit, exactement ──────────────────────────────────────────────────────────────────
dens = np.array([par_code[k].get("densite") if par_code.get(k) and par_code[k].get("densite") is not None else np.nan for k in codes], dtype=float)
peu_dense = ~np.isnan(dens) & (dens < 1500)
nom = lambda i: par_code.get(codes[i], {}).get("nom") or COM[codes[i]]["nom"]


def bascule(avant, apres, liste=15, cle=None):
    entre = np.where(~avant & apres)[0]; sort = np.where(avant & ~apres)[0]
    fmt = lambda ii: [(codes[i], nom(i)) + ((round(float(cle[i]), 3),) if cle is not None else ()) for i in ii[:liste]]
    return {"avant": int(avant.sum()), "apres": int(apres.sum()), "entrent": len(entre), "sortent": len(sort),
            "exemples_entrent": fmt(entre), "exemples_sortent": fmt(sort)}


f1 = P1["foret"]
R["seuils"] = {
    "boisement_70": {
        "regle": "avant : composition.foret (contour, eau comprise, arrondi) ≥ 70 ; après : forêt / terres, non arrondi, ≥ 70",
        **bascule(cur_foret_contour >= 70, f1 >= 70, 20, f1),
        "part_apres": round(float((f1 >= 70).mean()), 4),
        "p90_foret_terres": round(float(np.nanpercentile(f1, 90)), 2),
        "phrase_10_pct_vraie": bool((f1 >= 70).mean() <= 0.10),
        "arrondi_change_le_verdict": [(codes[i], nom(i), round(float(f1[i]), 3)) for i in np.where((np.round(f1, 1) >= 70) != (f1 >= 70))[0]],
        "entre_69_5_et_70_5": int(((f1 >= 69.5) & (f1 < 70.5)).sum()),
    },
    "rural_agricole_30": {"regle": "peu dense (< 1 500 hab/km²) ; avant : agricole du contour, eau comprise, sans serres ; après : cultures / terres, serres comprises",
                          **bascule(peu_dense & (cur_agri_contour >= 30), peu_dense & (P1["cultures"] >= 30))},
    "rural_forestier_35": {"regle": "peu dense ; avant : forêt du contour, eau comprise ; après : forêt / terres",
                           **bascule(peu_dense & (cur_foret_contour >= 35), peu_dense & (f1 >= 35))},
}


def categorie(nat, urb, cul):
    return np.where(urb >= 50, "mostly_built", np.where(nat >= 45, "high_natural", np.where(cul >= 50, "agricultural",
                    np.where(nat < 20, "low_natural", "mixed"))))


cat_avant = categorie(cur_t["naturel"], cur_t["urbanise"], cur_t["cultures"])
cat_s1 = categorie(P1["naturel"], P1["urbanise"], P1["cultures"])
cat_s0 = categorie(P0["naturel"], P0["urbanise"], P0["cultures"])
R["seuils"]["land_category"] = {
    "regle": "avant : parts de l'application (index arrondi, eau retirée, serres ignorées, arrondi au dixième) ; après : comptes exacts S1",
    "changements": int((cat_avant != cat_s1).sum()),
    "transitions": dict(Counter(f"{a}->{b}" for a, b in zip(cat_avant, cat_s1) if a != b)),
    "dont_effet_arrondi_seul_S0": int((cat_avant != cat_s0).sum()),
}
for k, v in R["seuils"].items():
    print("5.", k, json.dumps(v, ensure_ascii=False)[:1200], flush=True)

# ── 6. Serres : S0 (exclues) contre S1 (cultures) ─────────────────────────────────────────────────────────
s_pct = P1["serres"]
d_cult = P1["cultures"] - P0["cultures"]; d_nat = P1["naturel"] - P0["naturel"]
ordre = np.argsort(-np.nan_to_num(s_pct))
R["serres"] = {
    "national_km2": round(float(ser.sum()) / 1e4, 1),
    "communes_avec_serres": int((ser > 0).sum()),
    "communes_serres_ge": {s: int((s_pct >= s).sum()) for s in (1, 2, 5, 10, 20)},
    "delta_cultures_pts": {"max": round(float(np.nanmax(d_cult)), 2), "ge_1": int((d_cult >= 1).sum()), "ge_5": int((d_cult >= 5).sum())},
    "delta_naturel_pts": {"min": round(float(np.nanmin(d_nat)), 2), "le_moins_1": int((d_nat <= -1).sum())},
    "categorie_change_S0_S1": int((cat_s0 != cat_s1).sum()),
    "categorie_transitions_S0_S1": dict(Counter(f"{a}->{b}" for a, b in zip(cat_s0, cat_s1) if a != b)),
    "seuils_S0_S1": {
        "boisement_70": int(((P0["foret"] >= 70) != (f1 >= 70)).sum()),
        "rural_agricole_30": int((peu_dense & ((P0["cultures"] >= 30) != (P1["cultures"] >= 30))).sum()),
        "rural_forestier_35": int((peu_dense & ((P0["foret"] >= 35) != (f1 >= 35))).sum()),
    },
    "top": [(codes[i], nom(i), round(float(s_pct[i]), 2), round(float(P0["cultures"][i]), 2), round(float(P1["cultures"][i]), 2),
             str(cat_s0[i]), str(cat_s1[i])) for i in ordre[:25]],
    "cas_nommes": {k: {"nom": nom(pos[k]), "serres_pct_terres": round(float(s_pct[pos[k]]), 2),
                       "cultures_S0": round(float(P0["cultures"][pos[k]]), 2), "cultures_S1": round(float(P1["cultures"][pos[k]]), 2),
                       "naturel_S0": round(float(P0["naturel"][pos[k]]), 2), "naturel_S1": round(float(P1["naturel"][pos[k]]), 2),
                       "categorie_S0": str(cat_s0[pos[k]]), "categorie_S1": str(cat_s1[pos[k]]), "categorie_avant": str(cat_avant[pos[k]]),
                       "mesure_pct_contour": round(float(couv[pos[k]]), 2)}
                   for k in ("76353", "13083", "13027")},
}
print("6. serres :", json.dumps(R["serres"], ensure_ascii=False)[:3000], flush=True)

# ── 7. Retrait de l'eau, à méthode A constante (exact) ────────────────────────────────────────────────────
pts = [k for k in codes if par_code.get(k, {}).get("lat") is not None]
pi = np.array([pos[k] for k in pts])
lats = np.array([par_code[k]["lat"] for k in pts]); lons = np.array([par_code[k]["lon"] for k in pts])
M = len(pts)


def hav(la, lo, LA, LO):
    r = math.pi / 180
    a = np.sin((LA - la) * r / 2) ** 2 + math.cos(la * r) * np.cos(LA * r) * np.sin((LO - lo) * r / 2) ** 2
    return 2 * 6371 * np.arcsin(np.sqrt(a))


def selections(cell):
    g = {}
    for i in range(M):
        g.setdefault((int(lats[i] // cell), int(lons[i] // cell)), []).append(i)
    out = []
    for i in range(M):
        ci, cj = int(lats[i] // cell), int(lons[i] // cell)
        ids = np.array(sum((g.get((ci + a, cj + b), []) for a in (-1, 0, 1) for b in (-1, 0, 1)), []))
        out.append(ids[hav(lats[i], lons[i], lats[ids], lons[ids]) <= 15])
    return out


def rayon(sel, num, den):
    return np.array([round(100 * num[s].sum() / den[s].sum(), 1) if den[s].sum() > 0 else np.nan for s in sel])


def score(v):
    srt = sorted(x for x in v if not np.isnan(x)); n = len(srt)
    return np.array([round(100 * bisect.bisect_right(srt, x) / n) if not np.isnan(x) else -1 for x in v])


def verdict(s):
    srt = np.sort(s)
    lo = np.searchsorted(srt, s, side="left") / len(s); hi = np.searchsorted(srt, s, side="right") / len(s)
    return np.where(hi <= 0.2, "mismatch", np.where(lo >= 0.8, "satisfied", "neutral"))


tot_c = col(range(1, 24))[pi]; nat_c = col(ELARGI_CACHE)[pi]
SEL = {"A": selections(0.18), "B": selections(0.5)}
RP = {"A_eau": rayon(SEL["A"], nat_c, tot_c), "A_terres": rayon(SEL["A"], nat_t[pi], ter1[pi]),
      "B_eau": rayon(SEL["B"], nat_c, tot_c), "B_terres": rayon(SEL["B"], nat_t[pi], ter1[pi]),
      "A_terres_S0": rayon(SEL["A"], nat_t[pi], ter0[pi])}
SC = {k: score(v) for k, v in RP.items()}
rp_idx = np.array([par_code[k]["nature"]["radius_pct"] for k in pts]); sc_idx = np.array([par_code[k]["nature"]["score"] for k in pts])
R["reproduction_A_depuis_comptes"] = {"communes": M, "radius_pct_ecarts": int((np.abs(RP["A_eau"] - rp_idx) > 0.05).sum()),
                                      "score_ecarts": int((SC["A_eau"] != sc_idx).sum())}
print("7. reproduction A :", R["reproduction_A_depuis_comptes"], flush=True)
VE = {k: verdict(v) for k, v in SC.items()}


def effet(a, b):
    ds = SC[b] - SC[a]
    tr = Counter(f"{x}->{y}" for x, y in zip(VE[a], VE[b]) if x != y)
    return {"score_change": int((ds != 0).sum()), "abs_ge_5": int((np.abs(ds) >= 5).sum()), "abs_ge_10": int((np.abs(ds) >= 10).sum()),
            "delta_min_max": [int(ds.min()), int(ds.max())],
            "seuils": {t: int(((SC[a] >= t) != (SC[b] >= t)).sum()) for t in (34, 40, 50, 55, 60, 66, 70, 88)},
            "verdict_rang_change": int((VE[a] != VE[b]).sum()), "transitions": dict(tr),
            "plus_forts": [(pts[i], nom(pi[i]), float(RP[a][i]), float(RP[b][i]), int(SC[a][i]), int(SC[b][i]))
                           for i in np.argsort(-np.abs(ds))[:8]]}


R["effet_eau_exact"] = {
    "eau_seule_A": effet("A_eau", "A_terres"),
    "geographie_seule_B": effet("A_eau", "B_eau"),
    "combinaison_B_terres": effet("A_eau", "B_terres"),
    "serres_a_methode_A": effet("A_terres_S0", "A_terres"),
    "rappel_estimation_phase_A": {"eau_seule_A_score_change": 10141, "eau_seule_A_verdicts": 248},
}
for k, v in R["effet_eau_exact"].items():
    print("7.", k, json.dumps(v, ensure_ascii=False)[:900], flush=True)

if OUT:
    OUT.write_text(json.dumps(R, ensure_ascii=False, indent=1, default=lambda o: o.item() if hasattr(o, "item") else str(o)) + "\n", encoding="utf8")
    print("écrit :", OUT)
