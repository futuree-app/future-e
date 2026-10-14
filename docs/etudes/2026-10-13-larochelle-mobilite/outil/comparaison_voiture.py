#!/usr/bin/env python3
"""comparaison_voiture.py — Repère de comparaison : part de la voiture d'une commune face à un groupe défini par une règle.

Ce n'est ni un classement des villes où vivre, ni un score de dépendance automobile. Il situe UNE valeur
(la part des actifs résidents allant travailler principalement en voiture) par rapport à la médiane d'un groupe
de communes choisi mécaniquement, sans regarder les résultats de voiture.

Règle de sélection (fixée le 14/10/2026 avant tout calcul de part de voiture ; ne pas l'ajuster commune par commune) :
  1. Population statistique, la même pour toutes les communes : actifs occupés de 15 ans ou plus résidant dans la
     commune, y compris ceux qui ne se déplacent pas, pondérés par IPONDI. INSEE, RP 2022, fichier détail
     « Mobilités professionnelles » (MOBPRO). Mode = TRANS (mode principal) ; voiture = TRANS 5 (voiture, camion,
     fourgonnette). Même définition que le fait `mobpro.modes.voiture` du dossier.
  2. Rôle territorial : même rôle que la commune étudiée parmi deux, tirés de l'unité urbaine INSEE 2020 (champ `uu`
     de l'index du comparateur) : « commune principale » = la commune qui compte le plus d'actifs occupés résidents
     de son unité urbaine ; « autre commune d'unité urbaine » ; les communes hors unité urbaine forment un troisième
     rôle. Ce n'est pas le statut INSEE de ville-centre (absent des données du dépôt) : c'est une approximation simple.
  3. Taille proche : actifs occupés résidents compris entre la moitié et le double de ceux de la commune étudiée
     (bornes incluses).
  4. Critère d'inclusion : au moins 150 lignes d'échantillon dans la commune (seuil « utilisable » des faits MOBPRO de la
     fiche). Ce n'est pas une garantie de précision statistique de la part communale.
  5. La commune étudiée est exclue de son groupe.
  6. Groupe de moins de 10 communes : repère INDISPONIBLE ; les critères ne sont pas élargis.
  Périmètre : France métropolitaine, Corse incluse (celui de l'index) ; DROM exclus.

Résultats : valeur de la commune, médiane des parts communales du groupe (chaque commune compte une fois : ce n'est
PAS la part de voiture de l'ensemble de leurs habitants), nombre et liste des communes, écart en points (différence des
valeurs arrondies à l'unité, comme les écarts du dossier).

    python outil/comparaison_voiture.py --insee 79191 --mobpro <checkout>/data/rp-mobpro-2022.parquet \
        --index <checkout>/data/comparateur-index.json.gz --out fiches/79191/comparaison_voiture.json

Le dossier de rédaction (`dossier_redaction.py`) reprend ce fichier s'il est à côté de la fiche.
"""
import argparse, datetime as dt, gzip, hashlib, json, os, statistics
from decimal import Decimal, ROUND_HALF_UP

import pyarrow.parquet as pq

BORNE_BASSE, BORNE_HAUTE, LIGNES_MIN, GROUPE_MIN = 0.5, 2.0, 150, 10
SOURCE = "INSEE, RP 2022, fichier détail Mobilités professionnelles (MOBPRO)"
POPULATION = "actifs occupés de 15 ans ou plus résidant dans la commune, y compris ceux qui ne se déplacent pas (pondération IPONDI)"
ROLES = {"principale": "commune principale de son unité urbaine (la plus grande par le nombre d'actifs occupés résidents)",
         "autre": "autre commune d'une unité urbaine", "hors_uu": "commune hors unité urbaine"}


def arrondi(x):
    return int(Decimal(repr(float(x))).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--insee", required=True); p.add_argument("--mobpro", required=True)
    p.add_argument("--index", required=True); p.add_argument("--out", required=True)
    a = p.parse_args()

    t = pq.read_table(a.mobpro, columns=["COMMUNE", "TRANS", "IPONDI"]).to_pandas()
    t["COMMUNE"] = t["COMMUNE"].astype(str)
    t["voit"] = (t["TRANS"].astype(int) == 5) * t["IPONDI"]
    g = t.groupby("COMMUNE").agg(actifs=("IPONDI", "sum"), voit=("voit", "sum"), lignes=("IPONDI", "size"))
    g["voiture"] = g["voit"] / g["actifs"]

    idx = {c["insee"]: c for c in json.load(gzip.open(a.index))["communes"]}
    g = g[g.index.isin(idx)].copy()  # périmètre de l'index : métropole
    g["nom"] = [idx[c]["nom"] for c in g.index]
    g["uu"] = [None if idx[c].get("hors_uu") or not idx[c].get("uu") else idx[c]["uu"] for c in g.index]
    principale = g[g["uu"].notna()].groupby("uu")["actifs"].idxmax()
    g["role"] = ["hors_uu" if not isinstance(u, str) else ("principale" if principale[u] == c else "autre") for c, u in zip(g.index, g["uu"])]

    if a.insee not in g.index:
        raise SystemExit(f"{a.insee} absent de MOBPRO ou de l'index")
    me = g.loc[a.insee]
    lo, hi = BORNE_BASSE * me["actifs"], BORNE_HAUTE * me["actifs"]
    grp = g[(g["role"] == me["role"]) & (g["actifs"] >= lo) & (g["actifs"] <= hi) & (g["lignes"] >= LIGNES_MIN) & (g.index != a.insee)]
    grp = grp.sort_values("nom")

    mille = lambda x: f"{arrondi(x):,}".replace(",", "\u202f")
    regle = (f"communes de même rôle que {me['nom']} ({ROLES[me['role']]}), comptant de la moitié au double de ses actifs occupés "
             f"résidents (de {mille(lo)} à {mille(hi)}), avec au moins {LIGNES_MIN} lignes d'échantillon ; {me['nom']} exclue ; "
             "France métropolitaine")
    res = {"commune": {"insee": a.insee, "nom": me["nom"], "role": me["role"], "actifs": arrondi(me["actifs"]),
                       "lignes": int(me["lignes"]), "voiture": round(float(me["voiture"]), 4)},
           "definition": {"indicateur": "part des actifs allant travailler principalement en voiture (TRANS = 5)",
                          "population": POPULATION, "source": SOURCE, "millesime": "2022 (collectes 2020 à 2024)"},
           "regle": {"texte": regle, "role": ROLES[me["role"]], "taille": [BORNE_BASSE, BORNE_HAUTE], "bornes_actifs": [arrondi(lo), arrondi(hi)],
                     "lignes_min": LIGNES_MIN, "groupe_min": GROUPE_MIN, "approximation_role": "commune la plus grande de son unité urbaine 2020 par les actifs occupés résidents, pas le statut INSEE de ville-centre",
                     "fixee_le": "2026-10-14"},
           "sources_fichiers": {"mobpro": {"chemin": os.path.basename(a.mobpro), "sha256": hashlib.sha256(open(a.mobpro, "rb").read()).hexdigest()[:16]},
                                "index": {"chemin": os.path.basename(a.index), "sha256": hashlib.sha256(open(a.index, "rb").read()).hexdigest()[:16]}},
           "genere_le": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")}
    if len(grp) < GROUPE_MIN:
        res["disponible"] = False
        res["raison"] = f"groupe de {len(grp)} communes, sous le minimum de {GROUPE_MIN} : repère indisponible, critères non élargis"
    else:
        med = float(statistics.median(grp["voiture"]))
        res["disponible"] = True
        res["groupe"] = {"n": int(len(grp)), "mediane_voiture": round(med, 4),
                         "communes": [{"insee": c, "nom": r["nom"], "actifs": arrondi(r["actifs"]), "voiture": round(float(r["voiture"]), 4)}
                                      for c, r in grp.iterrows()]}
        res["ecart_points"] = arrondi(me["voiture"] * 100) - arrondi(med * 100)
    os.makedirs(os.path.dirname(a.out) or ".", exist_ok=True)
    json.dump(res, open(a.out, "w"), ensure_ascii=False, indent=1)
    print(f"✓ {a.out} · {me['nom']} · {'groupe de ' + str(len(grp)) + ' communes' if res['disponible'] else res['raison']}")


if __name__ == "__main__":
    main()
