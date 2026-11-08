#!/usr/bin/env python3
"""LE CLIMAT RÉCENT, PAR POINT DE LA GRILLE DRIAS (audit du 08/11/2026 : docs/audits/2026-11-08-reference-climatique-recente.md).

CE QUE CE SCRIPT PRODUIT. Pour chaque point de la grille DRIAS-TRACC et chaque année de la période, trois comptes
calculés sur la réanalyse quotidienne SAFRAN de Météo-France (jeu « Données changement climatique - SIM
quotidienne », Licence Ouverte 2.0) :
  tx35  jours où la température maximale (TSUP_H) atteint 35 °C   (DRIAS : NORTX35D_yr, « Tx >= 35 °C »)
  tx30  jours où elle atteint 30 °C                               (DRIAS : NORTX30D_yr)
  tr20  nuits où la température minimale (TINF_H) reste AU-DESSUS de 20 °C, strictement  (DRIAS : NORTR_yr, « nuits
        tropicales (température minimale > 20°C) », drias-climat.fr/accompagnement/section/401). SIM2 donne TINF_H au
        dixième : une nuit à 20,0 °C exactement n'est PAS tropicale. Jusqu'au 08/11/2026 (schéma 1), le script comptait
        `>= 20` ; corrigé après contre-revue (schéma 2).
Sortie : data/climat-recent/safran-<debut>-<fin>.json (versionné, ~1 Mo). Rien n'est écrit ailleurs.

POURQUOI SAFRAN, ET POURQUOI C'EST COMPARABLE À DRIAS. Les projections DRIAS-2020 (et donc DRIAS-TRACC) sont
corrigées de leurs biais par la méthode ADAMONT à partir de SAFRAN, et livrées SUR LA GRILLE SAFRAN de 8 km. Les
points DRIAS sont les mailles SAFRAN terrestres : le script les apparie par coordonnées et ÉCHOUE si un point ne
retrouve pas sa maille à moins de 0,002°. Vérifié le 08/11/2026 sur 1976-2005 : SAFRAN retrouve la référence DRIAS
point par point (corrélations 0,98 à 0,996 ; biais moyen +0,1 jour à 35 °C, +0,7 jour à 30 °C, +0,7 nuit avec
le seuil strict). Reproductible depuis le dépôt : `node scripts/climat-recent/comparer-drias.mjs` (lit
data/climat-recent/safran-1976-2005.json, produit par ce script, et data/source/).

CE QUE CE N'EST PAS. Une réanalyse : des observations interpolées sur une grille de 8 km, par massif et par tranche
d'altitude. Ce n'est ni la mesure d'une station, ni une valeur à l'adresse. En vallée de montagne, la maille peut
être bien plus haute (et plus fraîche) que la ville ; en Provence, une station peut compter deux fois plus de jours
à 35 °C que sa maille (Nîmes-Courbessac).

Usage (environ 40 s par année, lecture en flux : ~140 Mo par année téléchargés, rien n'est stocké) :
  python3 scripts/climat-recent/agreger_safran.py 2016 2025
puis : node scripts/build-climat-recent.mjs --ecrire
Dépendance : pandas.
"""
import gzip
import hashlib
import io
import json
import math
import os
import sys
import urllib.request
from datetime import datetime, timezone

import pandas as pd

RACINE = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
URL = "https://meteofrance.s3.sbg.io.cloud.ovh.net/data/REF_CC/SIM/QUOT_SIM2_{}.csv.gz"
URL_GRILLE = "https://meteofrance.s3.sbg.io.cloud.ovh.net/data/REF_CC/SIM/coordonnees_grille_safran_lambert-2-etendu.csv"
JEU = "https://www.data.gouv.fr/datasets/donnees-changement-climatique-sim-quotidienne"
METADONNEES_DRIAS = os.path.join(RACINE, "data", "drias_median_metadata.json")
ECART_MAX_DEG = 0.002


def telecharger(url):
    with urllib.request.urlopen(url, timeout=900) as r:
        return r.read(), r.headers.get("Last-Modified")


def points_drias():
    """Les points de la grille DRIAS, lus dans le fichier canonique de `build-drias-median.js`."""
    meta = json.load(open(METADONNEES_DRIAS, encoding="utf-8"))
    chemin = os.path.join(RACINE, "data", "source", meta["canonical_source_file"])
    pts = []
    for ligne in open(chemin, encoding="utf-8", errors="replace"):
        if ligne.startswith("#") or not ligne.strip():
            continue
        c = ligne.split(";")
        pts.append((c[0], float(c[1]), float(c[2])))
    return meta["canonical_source_file"], pts


def apparier(pts, grille):
    """Point DRIAS -> (LAMBX, LAMBY) de la maille SAFRAN de mêmes coordonnées. Échoue au-delà de ECART_MAX_DEG."""
    out = {}
    lat = grille.lat.values
    lon = grille.lon.values
    for pid, la, lo in pts:
        d = (lat - la) ** 2 + (lon - lo) ** 2
        i = int(d.argmin())
        e = math.sqrt(float(d[i]))
        if e > ECART_MAX_DEG:
            raise SystemExit(f"point DRIAS {pid} : aucune maille SAFRAN à moins de {ECART_MAX_DEG}° ({e:.4f}°)")
        out[pid] = (int(grille.LAMBX.values[i]), int(grille.LAMBY.values[i]))
    if len(set(out.values())) != len(out):
        raise SystemExit("deux points DRIAS tombent sur la même maille SAFRAN")
    return out


def une_annee(annee, mailles):
    brut, modifie = telecharger(URL.format(annee))
    empreinte = hashlib.sha256(brut).hexdigest()
    df = pd.read_csv(io.BytesIO(gzip.decompress(brut)), sep=";", usecols=["LAMBX", "LAMBY", "DATE", "TINF_H", "TSUP_H"])
    del brut
    if set((df.DATE // 10000).unique()) != {annee}:
        raise SystemExit(f"{annee} : le fichier contient d'autres années")
    df = df.merge(mailles, on=["LAMBX", "LAMBY"], how="inner")
    if df.TINF_H.isna().any() or df.TSUP_H.isna().any():
        raise SystemExit(f"{annee} : températures manquantes")
    jours = df.groupby("point").DATE.size()
    attendu = 366 if (annee % 4 == 0 and (annee % 100 != 0 or annee % 400 == 0)) else 365
    if (jours != attendu).any():
        raise SystemExit(f"{annee} : année incomplète pour {int((jours != attendu).sum())} points")
    g = df.assign(tx35=df.TSUP_H >= 35, tx30=df.TSUP_H >= 30, tr20=df.TINF_H > 20).groupby("point")[["tx35", "tx30", "tr20"]].sum()
    return g.astype(int), {"annee": annee, "url": URL.format(annee), "last_modified": modifie, "sha256": empreinte}


def main():
    debut, fin = int(sys.argv[1]), int(sys.argv[2])
    fichier_canonique, pts = points_drias()
    brut, _ = telecharger(URL_GRILLE)
    grille = pd.read_csv(io.BytesIO(brut), sep=";", decimal=",")
    grille.columns = ["LAMBX", "LAMBY", "lat", "lon"]
    appariement = apparier(pts, grille)
    mailles = pd.DataFrame([(p, x, y) for p, (x, y) in appariement.items()], columns=["point", "LAMBX", "LAMBY"])
    print(f"{len(appariement)} points DRIAS appariés à leur maille SAFRAN", flush=True)

    par_annee = []
    fichiers = []
    for a in range(debut, fin + 1):
        g, f = une_annee(a, mailles)
        par_annee.append(g)
        fichiers.append(f)
        print(a, "ok", flush=True)

    points = {}
    for pid in sorted(appariement, key=int):
        points[pid] = {k: [int(g.loc[pid, k]) for g in par_annee] for k in ("tx35", "tx30", "tr20")}

    sortie = {
        "schema": 2,
        "periode": [debut, fin],
        "source": {
            "producteur": "Météo-France",
            "jeu": "Données changement climatique - SIM quotidienne (réanalyse SAFRAN)",
            "licence": "Licence Ouverte 2.0",
            "page": JEU,
            "grille": URL_GRILLE,
            "fichiers": fichiers,
            "genere_le": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        },
        "definitions": {
            "tx35": "jours avec TSUP_H >= 35 °C (max des 24 températures horaires, 06-06 UTC)",
            "tx30": "jours avec TSUP_H >= 30 °C",
            "tr20": "nuits avec TINF_H > 20 °C, strictement (min des 24 températures horaires, 18-18 UTC ; DRIAS : Tmin > 20 °C)",
        },
        "grille_drias": {"fichier": fichier_canonique, "points": len(appariement), "ecart_max_deg": ECART_MAX_DEG},
        "points": points,
    }
    os.makedirs(os.path.join(RACINE, "data", "climat-recent"), exist_ok=True)
    chemin = os.path.join(RACINE, "data", "climat-recent", f"safran-{debut}-{fin}.json")
    with open(chemin, "w", encoding="utf-8") as f:
        json.dump(sortie, f, ensure_ascii=False, separators=(",", ":"))
    print(f"écrit : {os.path.relpath(chemin, RACINE)}", flush=True)


if __name__ == "__main__":
    main()
