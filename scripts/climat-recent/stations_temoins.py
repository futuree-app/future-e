#!/usr/bin/env python3
"""LES THERMOMÈTRES DE LA COMMUNE, SUR LA PÉRIODE DU CLIMAT RÉCENT (FUT-170, contre-revue du 08/11/2026).

POURQUOI. Le climat récent (SAFRAN) et la projection (DRIAS) se lisent sur une maille de 8 km. En vallée de
montagne, la maille peut être bien plus haute et plus fraîche que la ville : à Chamonix, la station Météo-France
relève ~16 journées au-dessus de 30 °C par an sur 2016-2025, quand la maille n'en compte aucune, même en 2050.
L'accueil doit alors dire, au premier niveau, que le chiffre de la maille sous-estime la chaleur du lieu habité.

CE QUE CE SCRIPT PRODUIT. Pour chaque station Météo-France de métropole (« Données climatologiques de base -
quotidiennes », Licence Ouverte 2.0), sur 2016-2025 et avec LES MÊMES DÉFINITIONS que SAFRAN et DRIAS :
  tx35  jours TX >= 35 °C        tx30  jours TX >= 30 °C        tr20  nuits TN > 20 °C (strict)
moyennés sur les années COMPLÈTES (au moins 90 % de TX et de TN valides de mai à septembre ; au moins 8 années
complètes sur 10, sinon la station est écartée). La station est rattachée à la commune de son numéro
(NUM_POSTE = code INSEE de la commune d'implantation + numéro d'ordre) ; un code absent du COG de l'index
(commune fusionnée, Corse « 20 ») est rattaché par la table des successeurs, ou écarté et compté.
Sortie : data/climat-recent/stations-2016-2025.json (versionné, petit). Rien n'est écrit ailleurs.

CE QUE CE N'EST PAS. Un indicateur d'altitude ni une correction : un TÉMOIN. La règle qui l'utilise est dans
`src/lib/accueil/pastilles.ts` (`stationContredit`) : une réserve quand le thermomètre de la commune relève déjà,
sur 2016-2025, plus que ce que la maille projette pour 2050.

Usage (lecture en flux, ~17 Mo par département, ~96 départements) :
  python3 -P scripts/climat-recent/stations_temoins.py
puis : node scripts/build-climat-recent.mjs --ecrire
"""
import gzip
import hashlib
import io
import json
import os
import urllib.request
from datetime import datetime, timezone

import pandas as pd

RACINE = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))
URL = "https://meteofrance.s3.sbg.io.cloud.ovh.net/data/synchro_ftp/BASE/QUOT/Q_{d}_{p}_RR-T-Vent.csv.gz"
PERIODES = ["previous-1950-2024", "latest-2025-2026"]
JEU = "https://www.data.gouv.fr/datasets/donnees-climatologiques-de-base-quotidiennes"
DEBUT, FIN = 2016, 2025
COMPLETUDE = 0.9  # part des jours de mai à septembre avec TX et TN valides
ANNEES_MIN = 8
JOURS_ETE = 153  # 1er mai - 30 septembre


def departements():
    d = [f"{i:02d}" for i in range(1, 96) if i != 20]
    return d + ["20"]  # Corse : un seul fichier « 20 » chez Météo-France


def communes_connues():
    f = json.load(open(os.path.join(RACINE, "src", "data", "accueil-communes.json"), encoding="utf-8"))
    return set(f["communes"])


def successeurs():
    chemin = os.path.join(RACINE, "data", "successeurs-cog2026.json")
    return json.load(open(chemin, encoding="utf-8"))["rattaches"]  # FUT-137 : code disparu -> commune de l'index


def rattacher(num, connues, succ):
    code = str(int(num)).zfill(8)[:5]
    candidats = [code] if not code.startswith("20") else ["2A" + code[2:], "2B" + code[2:]]
    for c in candidats:
        if c in connues:
            return c
        s = succ.get(c)
        if s in connues:
            return s
    return None


def main():
    connues, succ = communes_connues(), successeurs()
    fichiers, stations, ecartees = [], {}, {"sans_commune": 0, "incompletes": 0}
    for dep in departements():
        morceaux = []
        for per in PERIODES:
            url = URL.format(d=dep, p=per)
            with urllib.request.urlopen(url, timeout=900) as r:
                brut = r.read()
                modifie = r.headers.get("Last-Modified")
            fichiers.append({"url": url, "last_modified": modifie, "sha256": hashlib.sha256(brut).hexdigest()})
            df = pd.read_csv(io.BytesIO(gzip.decompress(brut)), sep=";", low_memory=False,
                             usecols=["NUM_POSTE", "NOM_USUEL", "LAT", "LON", "ALTI", "AAAAMMJJ", "TN", "TX"])
            del brut
            df["annee"] = df.AAAAMMJJ // 10000
            morceaux.append(df[df.annee.between(DEBUT, FIN)])
        df = pd.concat(morceaux, ignore_index=True).drop_duplicates(["NUM_POSTE", "AAAAMMJJ"], keep="last")
        df["mois"] = (df.AAAAMMJJ // 100) % 100
        df["ete_ok"] = df.mois.between(5, 9) & df.TX.notna() & df.TN.notna()
        g = df.groupby(["NUM_POSTE", "annee"]).agg(
            nom=("NOM_USUEL", "first"), lat=("LAT", "first"), lon=("LON", "first"), alti=("ALTI", "first"),
            ete=("ete_ok", "sum"),
            tx35=("TX", lambda s: int((s >= 35).sum())), tx30=("TX", lambda s: int((s >= 30).sum())),
            tr20=("TN", lambda s: int((s > 20).sum())),
        ).reset_index()
        g = g[g.ete >= COMPLETUDE * JOURS_ETE]
        n_dep = 0
        for num, s in g.groupby("NUM_POSTE"):
            if len(s) < ANNEES_MIN:
                ecartees["incompletes"] += 1
                continue
            insee = rattacher(num, connues, succ)
            if insee is None:
                ecartees["sans_commune"] += 1
                continue
            der = s.iloc[-1]
            stations[str(int(num)).zfill(8)] = {
                "insee": insee, "nom": str(der.nom), "alti": int(der.alti) if pd.notna(der.alti) else None,
                "lat": float(der.lat), "lon": float(der.lon), "annees": int(len(s)),
                "tx35": round(float(s.tx35.mean()), 2), "tx30": round(float(s.tx30.mean()), 2),
                "tr20": round(float(s.tr20.mean()), 2),
            }
            n_dep += 1
        print(dep, n_dep, "stations retenues", flush=True)

    sortie = {
        "schema": 1,
        "periode": [DEBUT, FIN],
        "source": {
            "producteur": "Météo-France",
            "jeu": "Données climatologiques de base - quotidiennes (RR-T-Vent)",
            "licence": "Licence Ouverte 2.0",
            "page": JEU,
            "fichiers": fichiers,
            "genere_le": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        },
        "definitions": {
            "tx35": "jours TX >= 35 °C", "tx30": "jours TX >= 30 °C", "tr20": "nuits TN > 20 °C (strict)",
            "annee_complete": f"au moins {int(COMPLETUDE * 100)} % des jours de mai à septembre avec TX et TN",
            "station_retenue": f"au moins {ANNEES_MIN} années complètes sur {FIN - DEBUT + 1}",
            "commune": "NUM_POSTE[:5] (commune d'implantation), via les successeurs COG si fusionnée",
        },
        "ecartees": ecartees,
        "stations": dict(sorted(stations.items())),
    }
    chemin = os.path.join(RACINE, "data", "climat-recent", f"stations-{DEBUT}-{FIN}.json")
    with open(chemin, "w", encoding="utf-8") as f:
        json.dump(sortie, f, ensure_ascii=False, separators=(",", ":"))
    print(f"écrit : {os.path.relpath(chemin, RACINE)} ({len(stations)} stations ; écartées : {ecartees})", flush=True)


if __name__ == "__main__":
    main()
