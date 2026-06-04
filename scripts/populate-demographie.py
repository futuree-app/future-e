#!/usr/bin/env python3
"""populate-demographie.py — croissance démographique (score) + nouveaux arrivants (narratif).

Source INSEE « Évolution et structure de la population 2021 » (recensement) :
  taux_total   = (P21_POP / P15_POP)^(1/6) - 1   (annualisé, fenêtre 2015-2021)
  part_nouveaux = (IRAN3+IRAN4+IRAN5+IRAN6+IRAN7) / P21_POP01P  (arrivées d'ailleurs sur 1 an)
Score = percentile national signé du taux. recit = code narratif (croissance × arrivées).
cf. spec 2026-06-04-croissance-demographique.

Venv .venv-bpe. Modes : --selftest --summary --probe --matrix --write-index.
"""
import json, os, sys, csv, io, math, argparse, bisect, zipfile, urllib.request
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX = os.path.join(ROOT, "data", "comparateur-index.json")
CACHE = os.path.join(ROOT, "data", ".cache")
INSEE_ZIP = os.path.join(CACHE, "insee-evol-pop.zip")
INSEE_URL = "https://www.insee.fr/fr/statistiques/fichier/8201904/base-cc-evol-struct-pop-2021_csv.zip"
INSEE_CSV = "base-cc-evol-struct-pop-2021.CSV"
OUT_CACHE = os.path.join(CACHE, "communes-demographie.json")

YEARS = 6  # 2015 -> 2021
# Zone morte autour de 0 pour « stable » (taux annualisé) ; seuil d'arrivée = tercile haut.
STABLE_BAND = 0.0015      # ±0,15 %/an = stable
# Lissage petites communes : taux *= pop/(pop+SHRINK_K). FIGÉ PAR SONDE (Task 3). 0 = désactivé.
SHRINK_K = 0


def growth_rate(p_old, p_new, years=YEARS):
    """Taux de croissance annualisé. None si données invalides."""
    if not p_old or not p_new or p_old <= 0:
        return None
    return (p_new / p_old) ** (1.0 / years) - 1.0


def part_nouveaux(iran_sum, pop01p):
    """Part des arrivants d'ailleurs (0-1). None si pop trop faible."""
    if not pop01p or pop01p <= 0:
        return None
    return iran_sum / pop01p


def effective_rate(taux, pop, k=SHRINK_K):
    """Lissage optionnel vers 0 pour les petites populations (masse critique)."""
    if taux is None:
        return None
    return taux if k <= 0 else taux * (pop or 0) / ((pop or 0) + k)


def percentile_signed(values):
    """Percentile national 1-100 d'une liste de taux SIGNÉS (déclin -> bas). None -> None."""
    valid = sorted(v for v in values if v is not None)
    n = len(valid)
    return [None if v is None else max(1, round(100 * bisect.bisect_right(valid, v) / n)) for v in values]


def recit_code(taux, part, part_hi):
    """Code narratif (croissance × arrivées). part_hi = seuil 'forte arrivée' (tercile haut)."""
    if taux is None:
        return None
    forte = part is not None and part >= part_hi
    if taux > STABLE_BAND:
        return "gagne_attire" if forte else "gagne_sans_renouv"
    if taux < -STABLE_BAND:
        return "perd"
    return "stable_renouv" if forte else "stable"


def download(url, dest):
    if not os.path.exists(dest):
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        req = urllib.request.Request(url, headers={"User-Agent": "futur-e/populate-demographie"})
        with urllib.request.urlopen(req, timeout=300) as r, open(dest, "wb") as f:
            f.write(r.read())
    return dest


def _num(s):
    s = (s or "").strip().replace(",", ".")
    try:
        return float(s)
    except ValueError:
        return None


def load_insee(valid_insee):
    """Retourne dict insee -> (taux_total, part_nouveaux) pour les communes de l'index."""
    download(INSEE_URL, INSEE_ZIP)
    out = {}
    z = zipfile.ZipFile(INSEE_ZIP)
    with z.open(INSEE_CSV) as f:
        rd = csv.DictReader(io.TextIOWrapper(f, encoding="latin-1"), delimiter=";")
        for row in rd:
            ins = (row.get("CODGEO") or "").strip()
            if ins not in valid_insee:
                continue
            p15 = _num(row.get("P15_POP")); p21 = _num(row.get("P21_POP"))
            taux = growth_rate(p15, p21)
            p01p = _num(row.get("P21_POP01P"))
            iran = sum(_num(row.get(f"P21_POP01P_IRAN{k}")) or 0.0 for k in (3, 4, 5, 6, 7))
            out[ins] = (taux, part_nouveaux(iran, p01p))
    print(f"INSEE : {len(out)} communes appariées", file=sys.stderr)
    return out


def load_communes():
    idx = json.load(open(INDEX))
    communes = [c for c in idx["communes"]]
    return idx, communes


def selftest():
    assert growth_rate(100, 100) == 0.0
    assert abs(growth_rate(1000, 1061, 6) - 0.01) < 1e-3   # ~ +1 %/an
    assert growth_rate(0, 100) is None
    assert growth_rate(None, 100) is None
    assert abs(part_nouveaux(50, 1000) - 0.05) < 1e-9
    assert part_nouveaux(5, 0) is None
    assert effective_rate(0.10, 50, 0) == 0.10            # lissage off
    assert effective_rate(0.10, 50, 1000) < 0.01          # petite commune écrasée
    assert percentile_signed([-0.02, 0.0, 0.03]) == [33, 67, 100]
    assert percentile_signed([None, 0.0]) == [None, 100]
    assert recit_code(0.02, 0.10, 0.06) == "gagne_attire"
    assert recit_code(0.02, 0.02, 0.06) == "gagne_sans_renouv"
    assert recit_code(0.0, 0.10, 0.06) == "stable_renouv"
    assert recit_code(-0.02, 0.10, 0.06) == "perd"
    assert recit_code(None, 0.10, 0.06) is None
    print("✓ selftest OK", file=sys.stderr)


def main():
    ap = argparse.ArgumentParser()
    for f in ("selftest", "summary", "probe", "matrix", "write-index"):
        ap.add_argument(f"--{f}", action="store_true")
    args = ap.parse_args()
    if args.selftest:
        selftest()
        return

    if args.summary:
        idx, communes = load_communes()
        valid = {c["insee"] for c in communes}
        data = load_insee(valid)
        taux = [data.get(c["insee"], (None, None))[0] for c in communes]
        nonnull = [t for t in taux if t is not None]
        import statistics
        print(f"communes avec taux : {len(nonnull)}/{len(communes)}", file=sys.stderr)
        print(f"taux médian : {statistics.median(nonnull)*100:.2f} %/an | "
              f"min {min(nonnull)*100:.1f} max {max(nonnull)*100:.1f}", file=sys.stderr)
        parts = [data.get(c['insee'], (None, None))[1] for c in communes]
        pv = sorted(p for p in parts if p is not None)
        print(f"part_nouveaux terciles : P33={pv[len(pv)//3]*100:.1f}% P66={pv[2*len(pv)//3]*100:.1f}%", file=sys.stderr)
        return


if __name__ == "__main__":
    main()
