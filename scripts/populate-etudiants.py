#!/usr/bin/env python3
"""populate-etudiants.py — dynamisme étudiant (part d'étudiants par UU, MESR).

Effectifs étudiants par commune (effectif_atlas, rentrée RENTREE) agrégés à l'unité urbaine
via le mapping commune->UU de l'index ; part étudiante = effectifs_UU / popUU. Rang national
parmi les communes MESURÉES -> c.etudes_dyn. Venv .venv-bpe (urllib stdlib).

FUT-135 · TROIS ÉTATS, JAMAIS CONFONDUS :
  - bassin de moins de MIN_BASSIN habitants : la part n'est pas représentative -> null (non mesuré).
    Avant FUT-135, ces bassins recevaient une part conventionnelle de 0, que le percentile classait au
    haut de son groupe d'ex æquo : 30 771 communes valaient 88, un village de 2 habitants était noté
    comme une ville étudiante ;
  - bassin sans population connue : null (donnée absente) ;
  - bassin mesuré sans aucun étudiant recensé par l'atlas : vrai zéro, mesuré, classé au bas.
LES EX ÆQUO SONT RANGÉS PAR LE MILIEU (midrank, même convention que src/lib/rang-national.ts) : un
plateau lit la position du plateau, ni son bas ni son haut. Seules les communes mesurées entrent dans
l'échelle : une abstention ne déplace le rang de personne.

LA RENTRÉE EST FIGÉE (RENTREE) : la source publie chaque année une rentrée de plus, et la prendre
d'office mêlerait en silence une mise à jour de la source à toute correction de méthode. Changer de
rentrée est un acte déclaré (--rentree), dont l'effet se mesure à part.

Usage :
    .venv-bpe/bin/python scripts/populate-etudiants.py --selftest
    .venv-bpe/bin/python scripts/populate-etudiants.py                # résumé
    .venv-bpe/bin/python scripts/populate-etudiants.py --write-index  # + patche l'index
Source mise en cache dans data/.cache/mesr-atlas-effectifs.json (--refresh pour la retélécharger).
"""
import json, os, sys, argparse, bisect, hashlib, math, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX = os.path.join(ROOT, "data", "comparateur-index.json")
CACHE = os.path.join(ROOT, "data", ".cache", "mesr-atlas-effectifs.json")
DATASET = "fr-esr-atlas_regional-effectifs-d-etudiants-inscrits_agregeables"
EXPORT_URL = ("https://data.enseignementsup-recherche.gouv.fr/api/explore/v2.1/catalog/datasets/"
              f"{DATASET}/exports/json")

# Rentrée de l'index publié au 25/10/2026 (rejeu exact de main). La rentrée 2025 est disponible depuis :
# son effet se mesure séparément (cf. docs/audits/2026-10-25-fut135-part-etudiante.md).
RENTREE = "2024"
# « Ville étudiante » suppose un bassin réel : sous ce seuil, le ratio n'est pas représentatif
# (village-campus hors UU -> part aberrante). cf. spec 2026-06-03-vie-etudiante / arbitrage porteur.
MIN_BASSIN = 5000


def fetch_rows(refresh=False):
    if refresh or not os.path.exists(CACHE):
        req = urllib.request.Request(EXPORT_URL, headers={"User-Agent": "futur-e/populate-etudiants"})
        with urllib.request.urlopen(req, timeout=300) as r:
            brut = r.read()
        os.makedirs(os.path.dirname(CACHE), exist_ok=True)
        with open(CACHE, "wb") as f:
            f.write(brut)
    with open(CACHE, "rb") as f:
        brut = f.read()
    return json.loads(brut.decode("utf-8")), hashlib.sha256(brut).hexdigest()


def eff_by_commune(rows, rentree):
    """Effectifs (effectif_atlas) par code commune de l'établissement, pour UNE rentrée déclarée."""
    disponibles = sorted({r.get("rentree") for r in rows if r.get("rentree") is not None})
    if rentree not in disponibles:
        raise ValueError(f"rentrée {rentree} absente de la source (disponibles : {', '.join(disponibles)})")
    eff = {}
    for r in rows:
        if r.get("rentree") != rentree:
            continue
        com = r.get("com_id")
        v = r.get("effectif_atlas")
        if not com or v is None:
            continue
        eff[com] = eff.get(com, 0) + int(v)
    return eff, disponibles


def bassins(communes, eff):
    """popUU + effUU (agrégation par UU via le mapping de l'index)."""
    popUU, effUU = {}, {}
    for c in communes:
        uu = c.get("uu")
        if uu and c.get("population") is not None:
            popUU[uu] = popUU.get(uu, 0) + c["population"]
            effUU[uu] = effUU.get(uu, 0) + eff.get(c["insee"], 0)
    return popUU, effUU


def part_etudiante(base_pop, base_eff):
    """Part étudiante du bassin, ou None quand elle n'est pas mesurée.

    None : population inconnue ou nulle (absence), ou bassin sous MIN_BASSIN (non représentatif).
    0.0 : bassin mesuré sans étudiant recensé, un vrai zéro."""
    if not base_pop:
        return None
    if base_pop < MIN_BASSIN:
        return None
    return min(base_eff / base_pop, 1.0)  # plafond 100 %


def part(c, popUU, effUU, eff):
    uu = c.get("uu")
    if uu and popUU.get(uu):
        return part_etudiante(popUU[uu], effUU[uu])
    return part_etudiante(c.get("population"), eff.get(c["insee"], 0))


def rang_moyen(valeurs):
    """Rang national 0-100 par le milieu des ex æquo, sur les seules valeurs mesurées (None exclus).

    rang(x) = 100 × (nb < x + nb ≤ x) / 2 / n : un plateau reçoit le rang de son milieu. Le groupe des
    zéros, bas de l'échelle, reçoit la moitié de sa propre part, jamais le haut de son groupe. Arrondi au
    demi supérieur (Math.round), pas à l'entier pair de round()."""
    vals = sorted(v for v in valeurs if v is not None)
    n = len(vals)

    def rang(x):
        if x is None or n == 0:
            return None
        return math.floor(100 * (bisect.bisect_left(vals, x) + bisect.bisect_right(vals, x)) / 2 / n + 0.5)

    return rang


def calculer(communes, eff):
    """{insee: (part, etudes_dyn)} pour toutes les communes de l'index."""
    popUU, effUU = bassins(communes, eff)
    parts = {c["insee"]: part(c, popUU, effUU, eff) for c in communes}
    rang = rang_moyen(parts.values())
    return {k: (p, rang(p)) for k, p in parts.items()}


def selftest():
    # Les trois états : abstention (petit bassin, population inconnue), vrai zéro, part mesurée.
    assert part_etudiante(4999, 3000) is None              # petit bassin, même avec des étudiants
    assert part_etudiante(2, 0) is None                     # village sans étudiant : pas un zéro mesuré
    assert part_etudiante(None, 0) is None and part_etudiante(0, 0) is None
    assert part_etudiante(5000, 0) == 0.0                   # vrai zéro, mesuré
    assert part_etudiante(10000, 2500) == 0.25
    assert part_etudiante(6000, 9000) == 1.0                # plafond
    # Rang moyen : les ex æquo prennent le milieu de leur plateau ; les absents ne comptent pas.
    r = rang_moyen([0.0, 0.0, 0.0, 0.1, 0.2, None, None])
    assert r(0.0) == 30 and r(0.1) == 70 and r(0.2) == 90 and r(None) is None
    assert rang_moyen([0.0] * 4)(0.0) == 50                 # un seul plateau : son milieu, pas 100
    assert rang_moyen([])(0.1) is None
    # De bout en bout : bassins par UU, communes hors UU, abstentions.
    communes = [
        {"insee": "A1", "uu": "U1", "population": 30000}, {"insee": "A2", "uu": "U1", "population": 10000},
        {"insee": "B1", "uu": "U2", "population": 8000},
        {"insee": "C1", "uu": None, "population": 6000},
        {"insee": "D1", "uu": None, "population": 2},
        {"insee": "E1", "uu": None, "population": None},
    ]
    out = calculer(communes, {"A1": 4000, "C1": 300, "D1": 50})
    assert out["A1"] == out["A2"] == (0.1, 75)               # même UU, même part
    assert out["B1"] == (0.0, 13)                            # vrai zéro : bas de l'échelle
    assert out["C1"] == (0.05, 38)
    assert out["D1"] == (None, None) and out["E1"] == (None, None)
    try:
        eff_by_commune([{"rentree": "2024", "com_id": "X", "effectif_atlas": 1}], "2025")
        raise AssertionError("une rentrée absente doit être refusée")
    except ValueError:
        pass
    print("✓ selftest OK", file=sys.stderr)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--write-index", action="store_true")
    ap.add_argument("--selftest", action="store_true")
    ap.add_argument("--refresh", action="store_true", help="retélécharger la source MESR")
    ap.add_argument("--rentree", default=RENTREE, help=f"rentrée MESR (défaut figé : {RENTREE})")
    args = ap.parse_args()
    if args.selftest:
        selftest()
        return

    rows, empreinte = fetch_rows(args.refresh)
    eff, disponibles = eff_by_commune(rows, args.rentree)
    print(f"rentrée retenue : {args.rentree} (disponibles : {', '.join(disponibles)}) | communes avec étudiants : "
          f"{len(eff)} | total : {sum(eff.values())} | source sha256 {empreinte[:12]}…", file=sys.stderr)
    if args.rentree != disponibles[-1]:
        print(f"  la source publie aussi la rentrée {disponibles[-1]} : non retenue (changement déclaré par --rentree)",
              file=sys.stderr)

    idx = json.load(open(INDEX))
    communes = idx["communes"]
    res = calculer(communes, eff)
    popUU, effUU = bassins(communes, eff)
    petits = sum(1 for c in communes if res[c["insee"]][0] is None and (popUU.get(c.get("uu")) or c.get("population")))
    sans_pop = sum(1 for c in communes if res[c["insee"]][0] is None) - petits
    mesurees = [k for k, (p, _) in res.items() if p is not None]
    zeros = [k for k in mesurees if res[k][0] == 0.0]
    rang_zero = res[zeros[0]][1] if zeros else None
    print(f"mesurées : {len(mesurees)} | bassin < {MIN_BASSIN} hab. : {petits} | sans population : {sans_pop} | "
          f"vrai zéro : {len(zeros)} (rang {rang_zero})", file=sys.stderr)

    top = sorted(((c["nom"], res[c["insee"]][0]) for c in communes if res[c["insee"]][0] is not None),
                 key=lambda kv: kv[1], reverse=True)[:6]
    print("plus forte part étudiante :", file=sys.stderr)
    for nom, p in top:
        print(f"  {nom}  {p:.1%}", file=sys.stderr)

    if args.write_index:
        for c in communes:
            c["etudes_dyn"] = res[c["insee"]][1]
        idx["meta"]["etudesDyn"] = {
            "source": f"MESR, {DATASET}, effectif_atlas",
            "rentree": args.rentree,
            "sourceSha256": empreinte,
            "bassin": f"unité urbaine de l'index (uu, populations communales sommées), sinon la commune hors unité urbaine",
            "regle": f"part = effectifs du bassin / population du bassin, plafonnée à 100 % ; non mesurée (null) sous {MIN_BASSIN} habitants de bassin ou sans population ; 0 = aucun étudiant recensé par l'atlas dans un bassin mesuré",
            "rang": "rang national des communes mesurées, ex æquo par le milieu (midrank) : 100 × (nb < x + nb ≤ x) / 2 / n, arrondi au demi supérieur",
            "communesMesurees": len(mesurees),
            "nonMesurees": {"bassinTropPetit": petits, "sansPopulation": sans_pop},
            "vraiZero": {"communes": len(zeros), "rang": rang_zero},
        }
        json.dump(idx, open(INDEX, "w"))
        print(f"✓ index patché : {len(mesurees)}/{len(communes)} communes avec etudes_dyn (rentrée {args.rentree})",
              file=sys.stderr)


if __name__ == "__main__":
    main()
