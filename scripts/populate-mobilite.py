#!/usr/bin/env python3
"""populate-mobilite.py — dépendance auto (RP MOBPRO 2022).

Agrège la part voiture domicile-travail par COMMUNE de résidence, pondérée IPONDI :
  part_voiture = IPONDI[TRANS==5] / IPONDI_total
Pour Paris/Lyon/Marseille, la résidence est codée à l'arrondissement (ARM) : on l'utilise
comme clé pour coller à l'index (qui stocke les PLM par arrondissement). TRANS est numérique
(5.0 = voiture). Seuil MIN_TOTAL ; en deçà -> null. Percentile national -> c.mobilite.
Venv .venv-bpe (pyarrow).

Usage :
    .venv-bpe/bin/python scripts/populate-mobilite.py                # agrège + résumé
    .venv-bpe/bin/python scripts/populate-mobilite.py --write-index  # + patche l'index
"""
import json, os, sys, argparse, bisect
import pyarrow.parquet as pq

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX = os.path.join(ROOT, "data", "comparateur-index.json")
PARQUET = os.path.join(ROOT, "data", "rp-mobpro-2022.parquet")
MIN_TOTAL = 50.0


def commune_key(commune, arm):
    # ARM = arrondissement municipal pour PLM (13201…), 'ZZZZZ' sinon. On colle à l'index.
    if arm and arm not in ("ZZZZZ", "") and arm[:1].isdigit():
        return arm
    return commune


def aggregate():
    agg = {}  # insee -> [total, voiture]
    pf = pq.ParquetFile(PARQUET)
    for batch in pf.iter_batches(columns=["COMMUNE", "ARM", "TRANS", "IPONDI"], batch_size=200_000):
        d = batch.to_pydict()
        for c, arm, t, w in zip(d["COMMUNE"], d["ARM"], d["TRANS"], d["IPONDI"]):
            if c is None or w is None:
                continue
            insee = commune_key(c, arm)
            w = float(w)
            a = agg.get(insee)
            if a is None:
                a = agg[insee] = [0.0, 0.0]
            a[0] += w
            if t is not None and int(t) == 5:
                a[1] += w
    return agg


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--write-index", action="store_true")
    args = ap.parse_args()

    agg = aggregate()
    parts = {insee: v / tot for insee, (tot, v) in agg.items() if tot >= MIN_TOTAL}
    print(f"communes agrégées : {len(agg)} | fiables (>= {MIN_TOTAL:.0f}) : {len(parts)}", file=sys.stderr)

    pv_sorted = sorted(parts.values())
    n = len(parts)

    def pct(x):
        return round(100 * bisect.bisect_right(pv_sorted, x) / n) if n else 0

    preview = sorted(parts.items(), key=lambda kv: kv[1])[:5]
    print("moins dépendantes (part voiture la plus basse) :", file=sys.stderr)
    for insee, pv in preview:
        print(f"  {insee}  voiture={pv:.0%}", file=sys.stderr)

    if args.write_index:
        idx = json.load(open(INDEX))
        hit = 0
        for c in idx["communes"]:
            pv = parts.get(c["insee"])
            if pv is None:
                c["mobilite"] = None
            else:
                c["mobilite"] = {"part_voiture": round(pv, 4), "dependance": pct(pv)}
                hit += 1
        json.dump(idx, open(INDEX, "w"))
        print(f"✓ index patché : {hit}/{len(idx['communes'])} communes avec mobilité", file=sys.stderr)


if __name__ == "__main__":
    main()
