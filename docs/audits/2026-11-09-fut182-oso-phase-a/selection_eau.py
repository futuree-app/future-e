"""FUT-182 · phase A · effets séparés de la SÉLECTION GÉOGRAPHIQUE (méthodes A et B) et de l'EAU sur `nature`.

Lecture seule. Aucune écriture hors du fichier de résultats passé en option. Dépendance : numpy.

Usage (depuis la racine du dépôt) :
    python3 docs/audits/2026-11-09-fut182-oso-phase-a/selection_eau.py CACHE_JSON [--out RESULTATS_JSON]

  CACHE_JSON  cache gitignoré de scripts/populate-nature.py (data/cache-nature/communes-nature.json du dépôt
              principal) : pixels naturels (`nat_px`) et classés (`tot_px`) par commune, composition au dixième.

Ce qui est EXACT et ce qui est ESTIMÉ :
  - A (méthode en vigueur) et B (tous les centres à ≤ 15 km) « eau comprise » sont exacts : ils ne lisent que des
    comptes de pixels entiers.
  - Toute variante « hors eau » est une ESTIMATION : le cache ne garde pas le compte de pixels d'eau, seulement la
    part `composition.eau` arrondie au dixième. Pixels d'eau estimés = eau/100 × tot_px, à ± 0,05 % de tot_px près.
    Le script calcule aussi les deux bornes (eau minimale, eau maximale) et rapporte l'écart qu'elles produisent.
    Le calcul exact exige le raster (phase B).
"""
import bisect
import gzip
import json
import math
import sys
from collections import Counter
from pathlib import Path

import numpy as np

RACINE = Path(__file__).resolve().parents[3]
args = [a for a in sys.argv[1:] if not a.startswith("--")]
if not args:
    sys.exit(__doc__)
CACHE = Path(args[0])
OUT = Path(sys.argv[sys.argv.index("--out") + 1]) if "--out" in sys.argv else None

rec = json.load(open(CACHE, encoding="utf8"))
idx = json.load(gzip.open(RACINE / "data/comparateur-index.json.gz"))
C = idx["communes"]
par_code = {c["insee"]: c for c in C}
R = {}  # résultats publiés


def section(titre):
    print(f"\n## {titre}")


# ── 0. L'index publié est-il bien le cache ? ──────────────────────────────────────────────────────────────
section("0. Index publié = cache de populate-nature.py")
diff = Counter()
for c in C:
    n, r = c.get("nature"), rec.get(c["insee"])
    if n is None and r is None:
        continue
    if (n is None) != (r is None):
        diff["presence"] += 1
        continue
    for k in ("score", "brut_pct", "radius_pct"):
        if n[k] != r.get(k):
            diff[k] += 1
    if n["composition"] != r["composition"]:
        diff["composition"] += 1
sans = [c["insee"] for c in C if not c.get("nature")]
print("entrées index", len(C), "| avec nature", len(C) - len(sans), "| sans", len(sans), "| écarts index/cache", dict(diff))
R["index"] = {"entrees": len(C), "avec_nature": len(C) - len(sans), "sans_nature": len(sans),
              "sans_nature_codes_prefixes": sorted(Counter(s[:2] for s in sans).items()), "ecarts_index_cache": dict(diff)}

# ── Points et comptes ─────────────────────────────────────────────────────────────────────────────────────
pts = [c for c in C if c["insee"] in rec and c.get("lat") is not None]
codes = [c["insee"] for c in pts]
N = len(codes)
lats = np.array([c["lat"] for c in pts])
lons = np.array([c["lon"] for c in pts])
nat = np.array([rec[k]["nat_px"] for k in codes], dtype=np.float64)
tot = np.array([rec[k]["tot_px"] for k in codes], dtype=np.float64)
eau_pct = np.array([rec[k]["composition"]["eau"] for k in codes])
eau = eau_pct / 100 * tot                       # estimation centrale
eau_lo = np.clip(eau_pct - 0.05, 0, None) / 100 * tot
eau_hi = np.clip(eau_pct + 0.05, None, 100) / 100 * tot
eau_lo[eau_pct == 0] = 0                         # 0,0 affiché : au plus 0,05 %, au moins 0
foret = np.array([rec[k]["composition"]["foret"] for k in codes])
agri = np.array([rec[k]["composition"]["agricole"] for k in codes])


def hav(la, lo, LA, LO):
    r = math.pi / 180
    a = np.sin((LA - la) * r / 2) ** 2 + math.cos(la * r) * np.cos(LA * r) * np.sin((LO - lo) * r / 2) ** 2
    return 2 * 6371 * np.arcsin(np.sqrt(a))


def selections(cell):
    g = {}
    for i in range(N):
        g.setdefault((int(lats[i] // cell), int(lons[i] // cell)), []).append(i)
    out = []
    for i in range(N):
        ci, cj = int(lats[i] // cell), int(lons[i] // cell)
        ids = np.array(sum((g.get((ci + a, cj + b), []) for a in (-1, 0, 1) for b in (-1, 0, 1)), []))
        out.append(ids[hav(lats[i], lons[i], lats[ids], lons[ids]) <= 15])
    return out


# 0,18° : grille du précalcul. 0,5° : à 51° N, 0,5° de longitude ≈ 35 km > 15 km, donc ±1 cellule couvre le disque.
SEL = {"A": selections(0.18), "B": selections(0.5)}


def rayon(sel, num, den):
    return np.array([round(100 * num[s].sum() / den[s].sum(), 1) if den[s].sum() > 0 else np.nan for s in sel])


def score(v):
    """Percentile national, à l'identique de populate-nature.py (bisect_right sur valeurs arrondies au dixième)."""
    srt = sorted(x for x in v if not np.isnan(x))
    n = len(srt)
    return np.array([round(100 * bisect.bisect_right(srt, x) / n) if not np.isnan(x) else -1 for x in v])


def bandes(s):
    srt = np.sort(s)
    lo = np.searchsorted(srt, s, side="left") / len(s)
    hi = np.searchsorted(srt, s, side="right") / len(s)
    return lo, hi


SC = {}
RP = {}
for m in ("A", "B"):
    RP[m + "_eau"] = rayon(SEL[m], nat, tot)
    RP[m + "_terres"] = rayon(SEL[m], nat - eau, tot - eau)
    # Bornes de l'estimation hors eau : eau minimale (naturel terrestre maximal) et maximale.
    RP[m + "_terres_lo"] = rayon(SEL[m], nat - eau_hi, tot - eau_hi)
    RP[m + "_terres_hi"] = rayon(SEL[m], nat - eau_lo, tot - eau_lo)
for k in RP:
    SC[k] = score(RP[k])

section("1. Reproduction de l'index (méthode A, eau comprise)")
rp_idx = np.array([par_code[k]["nature"]["radius_pct"] for k in codes])
sc_idx = np.array([par_code[k]["nature"]["score"] for k in codes])
bd_idx = np.array([par_code[k]["rankBands"]["nature"] for k in codes])
lo, hi = bandes(SC["A_eau"])
rep = {
    "radius_pct_ecarts": int((np.abs(RP["A_eau"] - rp_idx) > 0.05).sum()),
    "score_ecarts": int((SC["A_eau"] != sc_idx).sum()),
    "rankBands_ecarts": int(((np.round(lo * 10000) != bd_idx[:, 0]) | (np.round(hi * 10000) != bd_idx[:, 1])).sum()),
}
print(rep)
R["reproduction_A"] = rep

section("2. Sélections : taille, communes seules, omissions")
tA = np.array([len(s) for s in SEL["A"]])
tB = np.array([len(s) for s in SEL["B"]])
seulesA = [codes[i] for i in range(N) if tA[i] == 1]
seulesB = [codes[i] for i in range(N) if tB[i] == 1]
omis = tB - tA
inc = np.where(omis > 0)[0]
lat_inc = lats[inc]
sel_info = {
    "communes": N,
    "taille_A": {"mediane": int(np.median(tA)), "p5": int(np.percentile(tA, 5)), "p95": int(np.percentile(tA, 95))},
    "taille_B": {"mediane": int(np.median(tB)), "p5": int(np.percentile(tB, 5)), "p95": int(np.percentile(tB, 95))},
    "seules_A": [(k, par_code[k]["nom"]) for k in seulesA],
    "seules_B": [(k, par_code[k]["nom"]) for k in seulesB],
    "selection_incomplete_A": int(len(inc)),
    "B_contient_A_partout": bool(all(set(SEL["A"][i]).issubset(set(SEL["B"][i])) for i in range(N))),
    "communes_omises": {"mediane": int(np.median(omis[inc])), "max": int(omis.max()), "total_paires": int(omis.sum())},
    "latitude_des_incompletes": {"min": float(lat_inc.min()), "mediane": float(np.median(lat_inc)),
                                  "part_au_nord_de_47N": round(float((lat_inc >= 47).mean()), 3)},
    "par_departement_top": Counter(par_code[codes[i]]["dept"] for i in inc).most_common(12),
}
print(json.dumps(sel_info, ensure_ascii=False))
R["selection"] = sel_info


def comparer(a, b, nom):
    """Différences de b par rapport à a (A eau comprise = l'état publié)."""
    ra, rb, sa, sb = RP[a], RP[b], SC[a], SC[b]
    d = rb - ra
    ds = sb - sa
    lo_a, hi_a = bandes(sa)
    lo_b, hi_b = bandes(sb)

    def verdict(lo, hi):
        return np.where(hi <= 0.2, "mismatch", np.where(lo >= 0.8, "satisfied", "neutral"))

    va, vb = verdict(lo_a, hi_a), verdict(lo_b, hi_b)
    seuils = {}
    for t in (34, 40, 50, 55, 60, 66, 70, 88):
        seuils[f"franchit_{t}"] = int(((sa >= t) != (sb >= t)).sum())
    band3 = lambda s: np.where(s >= 66, 0, np.where(s < 34, 2, 1))
    q3 = lambda s: np.where(s >= 70, 0, np.where(s >= 40, 1, 2))
    trans = Counter(f"{x}->{y}" for x, y in zip(va, vb) if x != y)
    out = {
        "radius_pct_change": int((np.abs(d) >= 0.05).sum()),
        "delta_radius_signe": {"min": round(float(np.nanmin(d)), 1), "p1": round(float(np.nanpercentile(d, 1)), 1),
                               "p5": round(float(np.nanpercentile(d, 5)), 1), "mediane": round(float(np.nanmedian(d)), 1),
                               "p95": round(float(np.nanpercentile(d, 95)), 1), "p99": round(float(np.nanpercentile(d, 99)), 1),
                               "max": round(float(np.nanmax(d)), 1)},
        "score_change": int((ds != 0).sum()),
        "delta_score_signe": {"min": int(ds.min()), "p1": int(np.percentile(ds, 1)), "mediane": int(np.median(ds)),
                              "p99": int(np.percentile(ds, 99)), "max": int(ds.max()),
                              "abs_ge_5": int((np.abs(ds) >= 5).sum()), "abs_ge_10": int((np.abs(ds) >= 10).sum())},
        "palier_comparateur_34_66_change": int((band3(sa) != band3(sb)).sum()),
        "niveau_qna_40_70_change": int((q3(sa) != q3(sb)).sum()),
        "seuils": seuils,
        "verdict_projet_rang_change": int((va != vb).sum()),
        "verdict_projet_transitions": dict(trans),
        "spearman_score": round(float(np.corrcoef(sa, sb)[0, 1]), 4),
    }
    # Top 100 national et top 20 par région, sur le score (ordre d'un tri « nature » seul).
    def top(s, rp, n, mask=None):
        ii = np.arange(N) if mask is None else np.where(mask)[0]
        # tri par score puis rayon (départage) : l'ordre exact du moteur dépend aussi des autres critères.
        return set(ii[np.lexsort((-rp[ii], -s[ii]))[:n]])
    out["top100_national_communs"] = len(top(sa, ra, 100) & top(sb, rb, 100))
    regions = sorted(set(par_code[k]["region"] for k in codes))
    reg = np.array([par_code[k]["region"] for k in codes])
    ov = [len(top(sa, ra, 20, reg == r) & top(sb, rb, 20, reg == r)) for r in regions]
    out["top20_regional_communs"] = {"min": min(ov), "mediane": float(np.median(ov)), "regions": len(regions)}
    ex = sorted(range(N), key=lambda i: -abs(d[i]))[:8]
    out["plus_forts_ecarts"] = [(codes[i], par_code[codes[i]]["nom"], float(ra[i]), float(rb[i]), int(sa[i]), int(sb[i])) for i in ex]
    print(nom, json.dumps(out, ensure_ascii=False))
    return out


section("3. Effets séparés et combinés (référence : A eau comprise, l'index publié)")
R["effets"] = {
    "geographie_seule_B_eau": comparer("A_eau", "B_eau", "géographie seule (B, eau comprise)"),
    "eau_seule_A_terres": comparer("A_eau", "A_terres", "eau seule (A, hors eau, estimé)"),
    "combinaison_B_terres": comparer("A_eau", "B_terres", "combinaison (B hors eau, estimé)"),
}
# Incertitude de l'estimation hors eau : écart entre les deux bornes.
for m in ("A", "B"):
    w = RP[m + "_terres_hi"] - RP[m + "_terres_lo"]
    sw = np.abs(SC[m + "_terres_hi"] - SC[m + "_terres_lo"])
    R["effets"][f"incertitude_{m}_terres"] = {"largeur_radius_max": round(float(np.nanmax(w)), 2),
                                              "largeur_radius_p99": round(float(np.nanpercentile(w, 99)), 2),
                                              "score_ecart_max": int(sw.max()), "score_ecart_non_nul": int((sw > 0).sum())}
print("incertitude hors eau", R["effets"]["incertitude_A_terres"], R["effets"]["incertitude_B_terres"])
# Interaction : la combinaison est-elle la somme des deux effets ?
inter = (RP["B_terres"] - RP["A_eau"]) - ((RP["B_eau"] - RP["A_eau"]) + (RP["A_terres"] - RP["A_eau"]))
R["effets"]["interaction_radius_abs_max"] = round(float(np.nanmax(np.abs(inter))), 2)
print("interaction (non-additivité) |max| :", R["effets"]["interaction_radius_abs_max"])

section("4. Trait distinctif (place.distinctive_trait)")
LAB_NAT = "compte parmi les communes les plus entourées d'espaces naturels"


def moy(c, ch):
    v = [c["pct"].get(f) for f in ch if c["pct"].get(f) is not None]
    return sum(v) / len(v) if v else None


def trait(c, nat_score):
    traits = [
        (moy(c, ["NORTX30D_yr", "NORTX35D_yr", "NORTR_yr"]), "high", "chaud"),
        (c["pct"].get("NORRR_yr"), "high", "pluie"),
        (moy(c, ["NORRRq99_yr", "NORRx1d_yr"]), "high", "pluie_intense"),
        (c["pct"].get("NORSWI04_yr"), "high", "secheresse"),
        (c["pct"].get("NORIFM40_yr"), "high", "feu"),
        (nat_score, "high", "nature"),
        ((c.get("demographie") or {}).get("croissance"), "high", "croissance"),
        ((c.get("demographie") or {}).get("croissance"), "low", "declin"),
        (c.get("relief_proximite"), "high", "relief"),
    ]
    best = None
    for p, d, lab in traits:
        if p is None:
            continue
        e = p if (d == "high" and p >= 88) else (100 - p if (d == "low" and p <= 12) else None)
        if e is None:
            continue
        if best is None or e > best[1]:
            best = (lab, e)
    return best[0] if best else None


tr = {}
for m in ("A_eau", "B_eau", "A_terres", "B_terres"):
    tr[m] = [trait(par_code[codes[i]], int(SC[m][i])) for i in range(N)]
# Les arrondissements PLM n'ont pas de score nature : leur trait ne dépend pas de ce calcul.
td = {"trait_nature_A_eau": sum(t == "nature" for t in tr["A_eau"])}
for m in ("B_eau", "A_terres", "B_terres"):
    td[f"trait_nature_{m}"] = sum(t == "nature" for t in tr[m])
    td[f"trait_change_vs_A_eau_{m}"] = sum(a != b for a, b in zip(tr["A_eau"], tr[m]))
print(td)
R["trait_distinctif"] = td

section("5. Forêt (Projet, seuil 70 %) et catégories rurales d'Où vivre (agricole ≥ 30, forêt ≥ 35)")
terres = 100 - eau_pct
foret_t = np.round(foret * 100 / terres, 1)
agri_t = np.round(agri * 100 / terres, 1)
dens = np.array([par_code[k].get("densite") if par_code[k].get("densite") is not None else np.nan for k in codes], dtype=float)
peu_dense = ~np.isnan(dens) & (dens < 1500)
fo = {
    "foret_ge70_contour": int((foret >= 70).sum()),
    "foret_ge70_terres": int((foret_t >= 70).sum()),
    "foret_ge70_nouvelles": int(((foret_t >= 70) & (foret < 70)).sum()),
    "part_ge70_contour": round(float((foret >= 70).mean()), 4),
    "part_ge70_terres": round(float((foret_t >= 70).mean()), 4),
    "mediane_foret_contour": float(np.median(foret)),
    "seuil_top10_contour": float(np.percentile(foret, 90)),
    "seuil_top10_terres": float(np.percentile(foret_t, 90)),
    "rural_agricole_contour": int((peu_dense & (agri >= 30)).sum()),
    "rural_agricole_terres": int((peu_dense & (agri_t >= 30)).sum()),
    "rural_agricole_change": int((peu_dense & ((agri >= 30) != (agri_t >= 30))).sum()),
    "rural_forestier_contour": int((peu_dense & (foret >= 35)).sum()),
    "rural_forestier_terres": int((peu_dense & (foret_t >= 35)).sum()),
    "rural_forestier_change": int((peu_dense & ((foret >= 35) != (foret_t >= 35))).sum()),
    "densite_inconnue_hors_plm": int(np.isnan(dens).sum()),
}
nouv = np.where((foret_t >= 70) & (foret < 70))[0]
fo["nouvelles_exemples"] = sorted([(codes[i], par_code[codes[i]]["nom"], float(foret[i]), float(foret_t[i]), float(eau_pct[i])) for i in nouv],
                                  key=lambda x: -x[4])[:10]
fo["nouvelles_marge_au_seuil"] = {"foret_contour_min": float(foret[nouv].min()), "foret_contour_max": float(foret[nouv].max()),
                                  "eau_min": float(eau_pct[nouv].min()), "eau_mediane": float(np.median(eau_pct[nouv]))}
print(json.dumps(fo, ensure_ascii=False))
R["foret_rural"] = fo

section("6. Catégorie Territoire (land.category) : contrôle de la reproduction FUT-175")


def cat(nat_, urb, agr):
    if urb >= 50: return "mostly_built"
    if nat_ >= 45: return "high_natural"
    if agr >= 50: return "agricultural"
    if nat_ < 20: return "low_natural"
    return "mixed"


avant, apres = [], []
for k in codes:
    comp = rec[k]["composition"]; b = rec[k]["brut_pct"]; e = comp["eau"]; land = 100 - e
    avant.append(cat(b, comp["artificialise"], comp["agricole"]))
    apres.append(cat(round(max(0, (b - e) * 100 / land), 1), round(comp["artificialise"] * 100 / land, 1), round(comp["agricole"] * 100 / land, 1)))
ch = Counter(f"{a}->{b}" for a, b in zip(avant, apres) if a != b)
R["land_category"] = {"changements": sum(ch.values()), "transitions": dict(ch)}
print(R["land_category"])

section("7. Fixture FUT-178 (24 cas témoins) : reproduction")
fx = json.load(open(RACINE / "src/lib/__fixtures__/fut178-selection-nature.json", encoding="utf8"))
pos = {k: i for i, k in enumerate(codes)}
ko = []
for e in fx["selection_incomplete"]["echantillon"]:
    i = pos[e["insee"]]
    got = (int(tA[i]), int(tB[i]), float(RP["A_eau"][i]), float(RP["B_eau"][i]))
    exp = (e["retenues"], e["a_15_km"], e["radius_pct"], e["radius_pct_complet"])
    if got != exp:
        ko.append((e["insee"], exp, got))
R["fixture_fut178"] = {"cas": len(fx["selection_incomplete"]["echantillon"]), "ecarts": ko,
                       "total_annonce": fx["selection_incomplete"]["total"], "seules_annoncees": [s["insee"] for s in fx["seules"]]}
print(R["fixture_fut178"])

section("8. Cas témoins nommés (ticket) et communes ayant un snapshot Territoire persisté")
TEMOINS = {
    "ticket": ["13004", "13096", "85113", "17094", "34301", "34192", "17299", "17093", "74010", "44116", "02100", "28199",
               "2B096", "33063", "59350", "13054", "34198", "44010"],
    # Communes des 34 snapshots `territoire-facts@1` en base (lecture seule, 10/11/2026) ; 75056 n'a pas d'OSO.
    "snapshots_persistes": ["01281", "15014", "17094", "17299", "17300", "17385", "17415", "24479", "31555", "44109", "59407",
                            "66008", "69266", "79191", "83129"],
}
cas = {}
for grp, lst in TEMOINS.items():
    for k in lst:
        if k not in pos:
            cas[k] = {"groupe": grp, "absent": True}
            continue
        i = pos[k]
        lo_a, hi_a = bandes(SC["A_eau"]); lo_b, hi_b = bandes(SC["B_terres"])
        v = lambda lo, hi: "mismatch" if hi[i] <= 0.2 else ("satisfied" if lo[i] >= 0.8 else "neutral")
        cas[k] = {"groupe": grp, "nom": par_code[k]["nom"], "selection_A": int(tA[i]), "selection_B": int(tB[i]),
                  "eau_commune_pct": float(eau_pct[i]),
                  **{f"rayon_{m}": float(RP[m][i]) for m in ("A_eau", "B_eau", "A_terres", "B_terres")},
                  **{f"score_{m}": int(SC[m][i]) for m in ("A_eau", "B_eau", "A_terres", "B_terres")},
                  "verdict_rang_A_eau": v(lo_a, hi_a), "verdict_rang_B_terres": v(lo_b, hi_b),
                  "trait_A_eau": tr["A_eau"][i], "trait_B_terres": tr["B_terres"][i],
                  "foret_contour": float(foret[i]), "foret_terres": float(foret_t[i]),
                  "categorie_avant": avant[i], "categorie_apres_fut175": apres[i]}
R["cas"] = cas
for k, x in cas.items():
    print(k, json.dumps(x, ensure_ascii=False))

if OUT:
    OUT.write_text(json.dumps(R, ensure_ascii=False, indent=1, default=lambda o: o.item() if hasattr(o, "item") else str(o)) + "\n", encoding="utf8")
    print("\nécrit :", OUT)
