#!/usr/bin/env python3
"""FUT-141 · Le plateau des communes sans établissement du supérieur, au rang par le milieu.

`etudes_acces` est le rang national de l'accès pondéré au supérieur (BPE). `populate-bpe.py` le rangeait
par `bisect_right` : tout groupe d'ex æquo reçoit le rang du HAUT du groupe. Les communes sans aucun
établissement dans leur rayon (accès exactement 0, compte 0) forment un plateau de 40 % du pays : il
valait 40, alors qu'un rang par le milieu (convention de `etudes_dyn`, FUT-135, et de `rang-national.ts`)
le place à 20. Ces 20 points d'accès fictif pesaient 8 points de `vie_etudiante` (40 %), assez pour
mettre au palier « forte » 244 communes sans établissement dans leur rayon.

Correctif arbitré par le porteur (29/10/2026) : SEUL ce plateau change. Aucun recalcul BPE général :
écoles, culture, `etudesSup`, les autres rangs d'`etudes_acces` et tous les rangs publiés restent identiques.

Le plateau est lu dans la SOURCE, pas dans l'index : `etudesSup.weightedAccess` y est arrondi à deux
décimales, et 94 communes à 0,00 ont en réalité un établissement à la limite des 25 km (accès > 0, compte
> 0). Le script recalcule l'accès avec les fonctions mêmes de `populate-bpe.py` et refuse d'écrire si la
convention publiée ne se rejoue pas à l'identique.

    npm run index:unpack
    .venv-bpe/bin/python scripts/fut141/plateau-etudes-acces.py --parquet <bpe25.parquet>                 # rapport seul
    .venv-bpe/bin/python scripts/fut141/plateau-etudes-acces.py --parquet <bpe25.parquet> --write-index   # patche
    npm run index:pack && npm run index:verify
"""
import argparse, bisect, collections, importlib.util, json, math, os, sys
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
INDEX = os.path.join(ROOT, "data", "comparateur-index.json")
spec = importlib.util.spec_from_file_location("bpe", os.path.join(ROOT, "scripts", "populate-bpe.py"))
bpe = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bpe)

ANCIEN_RANG = 40


def rang_milieu(srt, x):
    """Rang par le milieu, arrondi au demi supérieur (Math.round), comme etudes_dyn (populate-etudiants.py)."""
    n = len(srt)
    return int(math.floor(100 * (bisect.bisect_left(srt, x) + bisect.bisect_right(srt, x)) / 2 / n + 0.5))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--parquet", required=True)
    ap.add_argument("--write-index", action="store_true")
    args = ap.parse_args()
    bpe.PARQUET = args.parquet

    idx = json.load(open(INDEX))
    if any(c.get("lat") is None or c.get("lon") is None for c in idx["communes"]):
        sys.exit("REFUS : commune sans coordonnées, le rang ne se rejoue pas sur le même ensemble")
    communes = idx["communes"]
    clat = np.array([c["lat"] for c in communes], dtype="float64")
    clon = np.array([c["lon"] for c in communes], dtype="float64")
    uupop = bpe.build_uupop(communes)
    radius = np.array([bpe.radius_for(bpe.taille_ville(c, uupop)) for c in communes], dtype="float64")
    elat, elon = bpe.load_equip_points(bpe.SUP_TYPEQU)
    acces, compte = bpe.count_within_radius(clat, clon, elat, elon, radius)

    srt = sorted(float(x) for x in acces)
    haut = bpe.percentile_scores(acces)
    deja = (idx.get("meta", {}).get("etudesAcces") or {}).get("plateau")
    plateau = [i for i, x in enumerate(acces) if x == 0.0]
    nouveau = rang_milieu(srt, 0.0)
    # La règle du producteur (populate-bpe.py) rend le même rang : un futur recalcul ne remettra pas 40.
    assert {s for x, s in zip(acces, bpe.plateau_zero_au_milieu(acces, haut)) if x == 0.0} == {nouveau}

    # 1. La convention publiée se rejoue à l'identique (hors plateau déjà corrigé), sinon on ne touche à rien.
    ecarts = [c["insee"] for i, c in enumerate(communes)
              if c.get("etudes_acces") != haut[i] and not (deja and acces[i] == 0.0 and c.get("etudes_acces") == deja["rang"])]
    if ecarts:
        sys.exit(f"REFUS : {len(ecarts)} rangs publiés ne se rejouent pas (ex. {ecarts[:5]}) ; l'index ou la source a changé")
    # 2. Le plateau est bien « aucun établissement » : compte nul, rayon identique à l'attestation.
    assert all(compte[i] == 0 for i in plateau)
    assert all(communes[i]["etudesSup"]["radiusKm"] == int(radius[i]) and communes[i]["etudesSup"]["weightedAccess"] == 0 for i in plateau)
    assert all(haut[i] == ANCIEN_RANG for i in plateau)
    # Les arrondis à 0,00 qui ne sont pas des zéros : laissés à leur rang.
    arrondis = [i for i, c in enumerate(communes) if c["etudesSup"]["weightedAccess"] == 0 and acces[i] > 0]

    # Écart résiduel avec un rang par le milieu complet (hors plateau) : rapporté, pas appliqué.
    residuel = collections.Counter(rang_milieu(srt, float(acces[i])) - haut[i] for i in range(len(communes))
                                   if acces[i] > 0 and rang_milieu(srt, float(acces[i])) != haut[i])
    rapport = {
        "communes": len(communes),
        "conventionPublieeRejouee": True,
        "plateau": {"communes": len(plateau), "rangAvant": ANCIEN_RANG, "rangApres": nouveau},
        "arrondisA0NonNuls": {"communes": len(arrondis), "rangs": dict(collections.Counter(haut[i] for i in arrondis))},
        "ecartResiduelAvecUnMilieuComplet": {"communes": sum(residuel.values()), "ecarts": dict(residuel)},
        "dejaApplique": bool(deja),
    }
    print(json.dumps(rapport, indent=2, ensure_ascii=False))
    if not args.write_index:
        return

    for i in plateau:
        communes[i]["etudes_acces"] = nouveau
    idx["meta"]["etudesAcces"] = {
        "source": f"BPE {idx['meta'].get('bpeMillesime')} ({idx['meta'].get('bpeSource')}), types {sorted(bpe.SUP_TYPEQU)}",
        "regle": "rang national de l'accès pondéré (bisect_right, populate-bpe.py), sauf le plateau des communes sans établissement dans leur rayon",
        "plateau": {"communes": len(plateau), "rangAvant": ANCIEN_RANG, "rang": nouveau,
                    "convention": "ex æquo par le milieu : 100 × (nb < 0 + nb ≤ 0) / 2 / n, arrondi au demi supérieur",
                    "lu": "dans la source (accès exactement 0, compte 0), pas dans etudesSup.weightedAccess arrondi"},
        "ecartResiduel": f"{sum(residuel.values())} communes à 1 point d'un rang par le milieu complet (arrondi), non modifiées",
        "ticket": "FUT-141",
    }
    json.dump(idx, open(INDEX, "w"))
    print(f"✓ index patché : etudes_acces {ANCIEN_RANG} → {nouveau} sur {len(plateau)} communes", file=sys.stderr)


if __name__ == "__main__":
    main()
