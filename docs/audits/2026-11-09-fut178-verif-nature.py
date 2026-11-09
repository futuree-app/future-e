"""FUT-178 · Vérification de la sélection de communes derrière `nature.radius_pct` (scripts/populate-nature.py).

Usage (depuis n'importe quel dossier) :
    python3 docs/audits/2026-11-09-fut178-verif-nature.py [CACHE_JSON] [--fixture]

  CACHE_JSON  cache gitignoré produit par populate-nature.py (pixels naturels / totaux par commune).
              Par défaut : <dépôt>/data/cache-nature/communes-nature.json. Dans un worktree, passer celui du
              dépôt principal.
  --fixture   réécrit src/lib/__fixtures__/fut178-selection-nature.json (communes sans voisine retenue et
              échantillon de communes où la grille omet des voisines), lu par src/lib/fut178-portee-nature.test.ts.

Aucun recalcul n'est publié : on rejoue la sélection du précalcul (grille 0,18°, ±1 cellule, centres à ≤ 15 km)
et on la compare à une sélection complète (grille 0,5°), pour mesurer ce que la première oublie. Dépendance : numpy.
"""
import gzip
import json
import math
import sys
from pathlib import Path

import numpy as np

RACINE = Path(__file__).resolve().parents[2]
args = [a for a in sys.argv[1:] if not a.startswith("--")]
CACHE = Path(args[0]) if args else RACINE / "data/cache-nature/communes-nature.json"
FIXTURE = RACINE / "src/lib/__fixtures__/fut178-selection-nature.json"

rec = json.load(open(CACHE, encoding="utf8"))
idx = json.load(gzip.open(RACINE / "data/comparateur-index.json.gz"))
C = idx["communes"]
noms = {c["insee"]: c.get("nom") for c in C}
pts = [(c["insee"], c["lat"], c["lon"]) for c in C if c["insee"] in rec and c.get("lat") is not None]
codes = [p[0] for p in pts]
lats = np.array([p[1] for p in pts])
lons = np.array([p[2] for p in pts])
nat = np.array([rec[c]["nat_px"] for c in codes], dtype=np.int64)
tot = np.array([rec[c]["tot_px"] for c in codes], dtype=np.int64)


def hav(la, lo, LA, LO):
    r = math.pi / 180
    dla = (LA - la) * r
    dlo = (LO - lo) * r
    a = np.sin(dla / 2) ** 2 + math.cos(la * r) * np.cos(LA * r) * np.sin(dlo / 2) ** 2
    return 2 * 6371 * np.arcsin(np.sqrt(a))


def grille(cell):
    g = {}
    for i in range(len(codes)):
        g.setdefault((int(lats[i] // cell), int(lons[i] // cell)), []).append(i)
    return g


def selection(g, cell, i):
    ci, cj = int(lats[i] // cell), int(lons[i] // cell)
    ids = np.array(sum((g.get((ci + a, cj + b), []) for a in (-1, 0, 1) for b in (-1, 0, 1)), []))
    return ids[hav(lats[i], lons[i], lats[ids], lons[ids]) <= 15]


G1, G2 = grille(0.18), grille(0.5)  # 0,18° = la grille du précalcul ; 0,5° couvre tout le disque de 15 km
out = {}
ecart_index = 0
for i, c in enumerate(codes):
    near, near2 = selection(G1, 0.18, i), selection(G2, 0.5, i)
    rp = round(100 * nat[near].sum() / tot[near].sum(), 1)
    rp2 = round(100 * nat[near2].sum() / tot[near2].sum(), 1)
    if abs(rp - (rec[c].get("radius_pct") or -1)) > 0.05:
        ecart_index += 1
    out[c] = (len(near), len(near2), rp, rp2)

seules = sorted(c for c, v in out.items() if v[0] == 1)
manques = {c: v for c, v in out.items() if v[1] > v[0]}
ecarts = [abs(v[3] - v[2]) for v in manques.values()]
ns = np.array([v[0] for v in out.values()])
print("communes", len(codes))
print("radius_pct recalculé ≠ cache :", ecart_index)
print("communes dont la sélection ne contient qu'elles-mêmes :", len(seules), [(c, noms.get(c)) for c in seules])
print("communes où la grille 0,18° omet des centres à ≤ 15 km :", len(manques),
      "écart médian/max (pts) :", float(np.median(ecarts)) if ecarts else 0, max(ecarts) if ecarts else 0)
print("nb communes dans la sélection : médiane", int(np.median(ns)), "p5", int(np.percentile(ns, 5)), "p95", int(np.percentile(ns, 95)))
for c in ["17094", "02100", "28199", "2B096", "13096", "34301", "74056", "33063", "59350"]:
    print(c, noms.get(c), rec[c]["brut_pct"], rec[c]["radius_pct"], out[c])

if "--fixture" in sys.argv:
    # Échantillon reproductible : les 12 plus gros écarts, puis 12 communes réparties sur le reste (pas d'aléa).
    tri = sorted(manques, key=lambda c: (-abs(out[c][3] - out[c][2]), c))
    reste = tri[12:]
    pas = max(1, len(reste) // 12)
    echantillon = tri[:12] + reste[::pas][:12]
    FIXTURE.write_text(json.dumps({
        "_source": "docs/audits/2026-11-09-fut178-verif-nature.py --fixture (cache OSO 2023 de populate-nature.py)",
        "communes": len(codes),
        "ecart_index": ecart_index,
        "seules": [{"insee": c, "nom": noms.get(c), "radius_pct": rec[c]["radius_pct"], "brut_pct": rec[c]["brut_pct"]} for c in seules],
        "selection_incomplete": {
            "total": len(manques),
            "ecart_median_pts": round(float(np.median(ecarts)), 2),
            "ecart_max_pts": round(max(ecarts), 1),
            "echantillon": [{"insee": c, "nom": noms.get(c), "retenues": out[c][0], "a_15_km": out[c][1],
                             "radius_pct": out[c][2], "radius_pct_complet": out[c][3]} for c in echantillon],
        },
    }, ensure_ascii=False, indent=1) + "\n", encoding="utf8")
    print("écrit :", FIXTURE.relative_to(RACINE))
