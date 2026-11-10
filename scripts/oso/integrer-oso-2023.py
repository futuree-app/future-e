#!/usr/bin/env python3
"""FUT-182 · B3 · écrit le champ `nature` de l'index (méthode `oso-2023-secteur-habite@1`) depuis les sorties B1 et B2.

PRÉCALCUL OFFLINE. Ce script ne lit pas le raster : il relit les comptes et le secteur habité calculés par les scripts
versionnés de l'audit (docs/audits/2026-11-09-fut182-oso-phase-a/b1_comptes.py et b2_national.py), stockés HORS DÉPÔT,
et vérifie leurs empreintes avant d'écrire quoi que ce soit. Il remplace `scripts/populate-nature.py` (méthode A,
retirée : eau comptée comme nature, sélection de communes entières par la distance de leur centre).

Usage (depuis la racine du dépôt, après `npm run index:unpack`) :
    python3 scripts/oso/integrer-oso-2023.py COMPTES_CSV_GZ SECTEUR_CSV_GZ
    node --experimental-strip-types scripts/populate-mismatch-rank.mts --recalculer nature
    npm run index:pack

Entrées et empreintes attendues (rapport FUT-182, § 32 et § 48) :
    comptes-pixels.csv.gz        1b0c484957d3f29cb73eba8411d72a8b2d76e174091a1b7e2a203b4df034da81
    secteur-habite-2023.csv.gz   2c2c2ff3bd2a8128dba765047f1ae67cbf1fcbe9405fa675695b465918c22eda  (avec --gisco)

LE CHAMP ÉCRIT, pour chaque commune et chaque arrondissement de l'index qui a un contour :
    nature = {
      methode: "oso-2023-secteur-habite@1",
      score: percentile national du secteur habité (0-100), ou null hors classement,
      terres: { naturel, foret, prairies, landes_pelouses, mineral_dunes, cultures, serres, urbanise },  % des terres
      eau_pct: eau / (terres + eau), en % de la surface cartographiée de la commune,
      couverture_pct: pixels classés (1-24) / aire du contour,
      secteur: { statut, valeur, p10, p90, couvert_fr_pct, hors_fr: { mer, etranger, non_attribue }, cause },
    }
  - terres = classes 1-22 et 24 ; naturel = 13 (prairies) + 16-17 (forêts) + 18-19 (pelouses, landes) + 20-22 ;
    cultures = 5-12, 14, 15 ; serres = 24 (poste distinct, rattaché aux cultures) ; urbanisé = 1-4. Valeurs NON
    ARRONDIES (trois décimales) : les seuils se comparent avant arrondi, l'affichage arrondit au dixième (FUT-183).
  - statut du secteur (convention de comparabilité validée le 10/11/2026) : part du disque couverte par des données
    françaises (terres et eaux sous contour français) ≥ 75 % « classe », 50 à 75 % « classe_limite », < 50 %
    « non_classe » (valeur gardée, AUCUN score ni rang), et « non_calculable » sans aucun pixel bâti OSO (ni valeur,
    ni score, ni rang).
  - cause (masque GISCO, jamais déduite de l'absence de pixel) : « mer » ou « etranger » si elle fait au moins 80 %
    de ce qui manque au disque ; « mer_et_etranger » si les deux font 80 %, chacune 20 % ; sinon « non_attribuee » ;
    null quand il manque moins de 1 % du disque.
  - score : percentile `bisect_right` sur la valeur arrondie au dixième (même convention que l'ancien score), calculé
    sur les seules communes « classe » et « classe_limite ». Arrondissements : hors de l'univers, score null.
"""
import bisect
import csv
import gzip
import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
INDEX = ROOT / "data" / "comparateur-index.json"
METHODE = "oso-2023-secteur-habite@1"
EMPREINTES = {
    "comptes-pixels.csv.gz": "1b0c484957d3f29cb73eba8411d72a8b2d76e174091a1b7e2a203b4df034da81",
    "secteur-habite-2023.csv.gz": "2c2c2ff3bd2a8128dba765047f1ae67cbf1fcbe9405fa675695b465918c22eda",
}

if len(sys.argv) < 3:
    sys.exit(__doc__)
COMPTES, SECTEUR = Path(sys.argv[1]), Path(sys.argv[2])


def sha(p: Path) -> str:
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for b in iter(lambda: f.read(1 << 22), b""):
            h.update(b)
    return h.hexdigest()


for p in (COMPTES, SECTEUR):
    attendu = EMPREINTES.get(p.name)
    if attendu and sha(p) != attendu:
        sys.exit(f"REFUS : empreinte de {p.name} inattendue")
meta_secteur = json.loads((SECTEUR.parent / SECTEUR.name.replace(".csv.gz", ".meta.json")).read_text(encoding="utf8"))
if meta_secteur["sortie"]["sha256"] != sha(SECTEUR):
    sys.exit("REFUS : le secteur habité ne correspond pas à son fichier de métadonnées")
if not (meta_secteur["sources"].get("gisco") or {}).get("sha256"):
    sys.exit("REFUS : le secteur habité doit porter l'attribution GISCO (b2_national.py --gisco)")

# ── Parts des terres, depuis les comptes B1 ───────────────────────────────────────────────────────────────
r3 = lambda x: round(x, 3)
TERRES = {"urbanise": [1, 2, 3, 4], "cultures": list(range(5, 13)) + [14, 15], "prairies": [13], "foret": [16, 17],
          "landes_pelouses": [18, 19], "mineral_dunes": [20, 21, 22], "serres": [24]}
parts = {}
for l in csv.DictReader(gzip.open(COMPTES, "rt", encoding="utf8")):
    v = {k: sum(int(l[f"v{c}"]) for c in cls) for k, cls in TERRES.items()}
    ter = sum(v.values()); eau = int(l["v23"])
    if ter == 0:
        continue
    t = {k: r3(100 * x / ter) for k, x in v.items()}
    t["naturel"] = r3(100 * (v["prairies"] + v["foret"] + v["landes_pelouses"] + v["mineral_dunes"]) / ter)
    parts[l["code"]] = {
        "terres": {k: t[k] for k in ("naturel", "foret", "prairies", "landes_pelouses", "mineral_dunes", "cultures", "serres", "urbanise")},
        "eau_pct": r3(100 * eau / (ter + eau)),
        "couverture_pct": r3(min(100.0, 100 * sum(int(l[f"v{c}"]) for c in range(1, 25)) * 100 / float(l["aire_contour_m2"]))),
    }

# ── Secteur habité, depuis B2 ─────────────────────────────────────────────────────────────────────────────
f = lambda x: float(x) if x not in ("", None) else None


def cause(l):
    etr, mer, na = (max(0.0, f(l[k])) for k in ("couv_hors_fr_etranger", "couv_hors_fr_mer", "couv_hors_fr_non_attribue"))
    hors = etr + mer + na
    if hors + max(0.0, f(l["couv_non_classe_fr"])) < 1:
        return None
    if hors <= 0:
        return "non_attribuee"
    if mer / hors >= 0.8:
        return "mer"
    if etr / hors >= 0.8:
        return "etranger"
    if (mer + etr) / hors >= 0.8 and mer / hors >= 0.2 and etr / hors >= 0.2:
        return "mer_et_etranger"
    return "non_attribuee"


secteur = {}
for l in csv.DictReader(gzip.open(SECTEUR, "rt", encoding="utf8")):
    if f(l["valeur"]) is None:
        secteur[l["code"]] = {"statut": "non_calculable"}
        continue
    fr = f(l["couv_terres_fr"]) + f(l["couv_eaux_fr"])
    statut = "classe" if fr >= 75 else ("classe_limite" if fr >= 50 else "non_classe")
    secteur[l["code"]] = {
        "statut": statut, "valeur": r3(f(l["valeur"])), "p10": r3(f(l["p10"])), "p90": r3(f(l["p90"])),
        "couvert_fr_pct": r3(fr),
        "hors_fr": {"mer": r3(f(l["couv_hors_fr_mer"])), "etranger": r3(f(l["couv_hors_fr_etranger"])),
                    "non_attribue": r3(f(l["couv_hors_fr_non_attribue"]))},
        "cause": cause(l),
    }

# ── Écriture ──────────────────────────────────────────────────────────────────────────────────────────────
PLM = lambda k: k.startswith("751") or k.startswith("6938") or k.startswith("132")
idx = json.loads(INDEX.read_text(encoding="utf8"))
communes = idx["communes"]
classables = sorted(round(secteur[c["insee"]]["valeur"], 1) for c in communes
                    if not PLM(c["insee"]) and secteur.get(c["insee"], {}).get("statut") in ("classe", "classe_limite"))
N = len(classables)
compte = {"ecrites": 0, "sans_contour": 0, "score": 0}
for c in communes:
    k = c["insee"]
    if k not in parts or k not in secteur:
        if c.get("nature") is not None:
            c["nature"] = None
        compte["sans_contour"] += 1
        continue
    s = secteur[k]
    score = None
    if not PLM(k) and s["statut"] in ("classe", "classe_limite"):
        score = round(100 * bisect.bisect_right(classables, round(s["valeur"], 1)) / N)
        compte["score"] += 1
    c["nature"] = {"methode": METHODE, "score": score, **parts[k], "secteur": s}
    compte["ecrites"] += 1

# Paris, Lyon, Marseille en ville entière : pas d'entrée d'index (seulement leurs arrondissements). Leur lecture
# communale (Territoire) a besoin de leurs propres parts et de leur secteur, jamais d'un score (hors univers des rangs).
communes_plm = {k: {"methode": METHODE, "score": None, **parts[k], "secteur": secteur[k]} for k in ("75056", "69123", "13055")}

idx["meta"]["nature"] = {
    "communes_plm": communes_plm,
    "methode": METHODE,
    "source": "OSO 2023, THEIA / CES OSO (CESBIO), CNES-GEODES, mise à jour du 20/09/2024, Licence Ouverte 2.0 ; traitements futur•e",
    "comptes_sha256": sha(COMPTES), "secteur_sha256": sha(SECTEUR),
    "gisco": meta_secteur["sources"]["gisco"],
    "univers_score": N,
    "rapport": "docs/audits/2026-11-09-fut182-oso-national-phase-a.md (FUT-182)",
}
INDEX.write_text(json.dumps(idx, ensure_ascii=False, separators=(",", ":")), encoding="utf8")
print(json.dumps({**compte, "univers_score": N}, ensure_ascii=False))
