"""FUT-83 : ce qui change d'un millésime à l'autre pour une même copropriété (T3 2025 -> quotidien du 27/10/2026).
Usage : python3 -I scripts/fut83/millesimes.py <rnic-quotidien.csv> <rnic-t3-2025.csv> > millesimes.json
"""
import collections, json, sys
sys.path.insert(0, __file__.rsplit("/", 1)[0])
from rnic_index import lire_rnic  # noqa: E402
from profil_rnic import COLONNES_T3, lire  # noqa: E402

def entier(v):
    try:
        return int(float(v))
    except (TypeError, ValueError):
        return None

def main(q, t3):
    a = lire_rnic(q)
    b = {r["numero_immatriculation"]: r for r in lire(t3, COLONNES_T3)}
    trans = {k: collections.Counter() for k in ("copro_aidee", "mandat_en_cours", "type_syndic")}
    ecarts = collections.Counter()
    exemples = []
    for n in a.keys() & b.keys():
        x, y = a[n], b[n]
        for k in trans:
            trans[k][f"{y.get(k) or 'vide'} -> {x.get(k) or 'vide'}"] += 1
        h1, h2 = entier(y["nombre_lots_habitation"]), entier(x["nombre_lots_habitation"])
        if h1 is not None and h2 is not None and h1 != h2:
            rel = abs(h2 - h1) / max(h1, 1)
            ecarts["< 10 %" if rel < 0.1 else "10-50 %" if rel < 0.5 else ">= 50 %"] += 1
            if rel >= 1 and len(exemples) < 8:
                exemples.append({"numero": n, "nom": x["nom_usage_copropriete"], "t3_2025": h1, "27_10_2026": h2,
                                 "maj": x["date_derniere_maj"]})
    json.dump({"communs": len(a.keys() & b.keys()),
               "transitions": {k: dict(v.most_common(12)) for k, v in trans.items()},
               "lots_habitation_modifies": dict(ecarts), "exemples_ecart_double": exemples},
              sys.stdout, ensure_ascii=False, indent=1)

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
