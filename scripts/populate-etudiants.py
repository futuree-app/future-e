#!/usr/bin/env python3
"""populate-etudiants.py — dynamisme étudiant (part d'étudiants par UU, MESR).

Effectifs étudiants par commune (effectif_atlas, dernière rentrée) agrégés à l'unité urbaine
via le mapping commune->UU de l'index ; part étudiante = effectifs_UU / popUU. Percentile
national -> c.etudes_dyn. Venv .venv-bpe (urllib stdlib).

Usage :
    .venv-bpe/bin/python scripts/populate-etudiants.py                # résumé
    .venv-bpe/bin/python scripts/populate-etudiants.py --write-index  # + patche l'index
"""
import json, os, sys, argparse, bisect, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX = os.path.join(ROOT, "data", "comparateur-index.json")
EXPORT_URL = ("https://data.enseignementsup-recherche.gouv.fr/api/explore/v2.1/catalog/datasets/"
              "fr-esr-atlas_regional-effectifs-d-etudiants-inscrits_agregeables/exports/json")


def fetch_rows():
    req = urllib.request.Request(EXPORT_URL, headers={"User-Agent": "futur-e/populate-etudiants"})
    with urllib.request.urlopen(req, timeout=300) as r:
        return json.loads(r.read().decode("utf-8"))


def eff_by_commune(rows):
    rentrees = [r.get("rentree") for r in rows if r.get("rentree") is not None]
    last = max(rentrees)
    eff = {}
    for r in rows:
        if r.get("rentree") != last:
            continue
        com = r.get("com_id")
        v = r.get("effectif_atlas")
        if not com or v is None:
            continue
        eff[com] = eff.get(com, 0) + int(v)
    print(f"rentrée retenue : {last} | communes avec étudiants : {len(eff)} | total : {sum(eff.values())}", file=sys.stderr)
    return eff


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--write-index", action="store_true")
    args = ap.parse_args()

    rows = fetch_rows()
    eff = eff_by_commune(rows)

    idx = json.load(open(INDEX))
    communes = idx["communes"]

    # popUU + effUU (agrégation par UU via le mapping de l'index)
    popUU, effUU = {}, {}
    for c in communes:
        uu = c.get("uu")
        if uu and c.get("population") is not None:
            popUU[uu] = popUU.get(uu, 0) + c["population"]
            effUU[uu] = effUU.get(uu, 0) + eff.get(c["insee"], 0)

    # « Ville étudiante » suppose un bassin réel : sous ce seuil, le ratio n'est pas
    # représentatif (village-campus hors UU -> part aberrante). cf. spec / arbitrage porteur.
    MIN_BASSIN = 5000

    def part(c):
        uu = c.get("uu")
        if uu and popUU.get(uu):
            base_pop, base_eff = popUU[uu], effUU[uu]
        else:
            base_pop, base_eff = c.get("population"), eff.get(c["insee"], 0)
        if not base_pop:
            return None
        if base_pop < MIN_BASSIN:
            return 0.0  # bassin trop petit : pas une « ville étudiante »
        return min(base_eff / base_pop, 1.0)  # plafond 100 %

    parts = {c["insee"]: part(c) for c in communes}
    vals = sorted(p for p in parts.values() if p is not None)
    n = len(vals)

    def pct(x):
        return round(100 * bisect.bisect_right(vals, x) / n) if n else 0

    top = sorted(((c["nom"], parts[c["insee"]]) for c in communes if parts[c["insee"]] is not None),
                 key=lambda kv: kv[1], reverse=True)[:6]
    print("plus forte part étudiante :", file=sys.stderr)
    for nom, p in top:
        print(f"  {nom}  {p:.1%}", file=sys.stderr)

    if args.write_index:
        hit = 0
        for c in communes:
            p = parts[c["insee"]]
            if p is None:
                c["etudes_dyn"] = None
            else:
                c["etudes_dyn"] = pct(p)
                hit += 1
        json.dump(idx, open(INDEX, "w"))
        print(f"✓ index patché : {hit}/{len(communes)} communes avec etudes_dyn", file=sys.stderr)


if __name__ == "__main__":
    main()
