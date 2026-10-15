"""FUT-104 · Téléchargement CIBLÉ des indicateurs SocleOM-Climat-2025 (Météo-France).

Source : bucket public `meteofrance-drias` sur object.files.data.gouv.fr, publié par Météo-France sous
Licence Ouverte 2.0 (jeu data.gouv « Projections climatiques pour le Hackathon 2025 - Socle Outre-Mer »).
Le jeu complet pèse ~272 Go (séries quotidiennes, mensuel, saisonnier, chaque modèle). On n'en prend que
les archives « Indicateurs-Annuel_Absolue_Centiles » : moyennes annuelles, centiles de l'ensemble multi-modèle,
pour la période de référence et pour chaque niveau de réchauffement TRACC. ~1,6 Go au total.

Chaque archive téléchargée est consignée dans un manifeste (clé, taille, ETag, sha256, date de mise en ligne),
pour que l'extraction (`extraire_climat_outremer.py`) puisse dire de quel fichier vient chaque chiffre et
refuser un fichier qui aurait changé.

Usage :
    python3 -P scripts/outremer/telecharger_socleom.py [--cache DIR]
Le cache est hors du dépôt (défaut : ~/.cache/futuree/socleom). Rien n'est téléchargé deux fois.
"""
import argparse
import hashlib
import json
import os
import re
import sys
import urllib.parse
import urllib.request

BUCKET = "https://object.files.data.gouv.fr/meteofrance-drias/"
PREFIXE = "SocleOM-Climat-2025/"
# Indicateurs annuels, centiles d'ensemble : valeurs absolues (« Absolue ») et écarts à 1991-2020 (« Ecart »).
# Les écarts sont pris tels que publiés : la médiane des écarts n'est pas l'écart des médianes, on ne les
# recalcule jamais. (Seule La Réunion range ses écarts dans l'archive « Absolue » ; on prend les deux partout.)
MOTIF = re.compile(r"Climat-2025-IND/(?:[^/]+/)?Indicateurs-Annuel_(Absolue|Ecart)_Centiles-([A-Za-z-]+)_SocleOM_Moyenne-(\d+)ans_(RWL\d+|historical)_Netcdf\.tar$")


def lister(prefixe):
    objets, jeton = [], None
    while True:
        q = {"list-type": "2", "prefix": prefixe, "max-keys": "1000"}
        if jeton:
            q["continuation-token"] = jeton
        x = urllib.request.urlopen(BUCKET + "?" + urllib.parse.urlencode(q), timeout=60).read().decode()
        for bloc in re.findall(r"<Contents>(.*?)</Contents>", x, re.S):
            cle = re.search(r"<Key>(.*?)</Key>", bloc).group(1)
            objets.append({
                "cle": cle,
                "taille": int(re.search(r"<Size>(\d+)</Size>", bloc).group(1)),
                "etag": re.search(r"<ETag>(.*?)</ETag>", bloc).group(1).replace("&#34;", "").replace('"', ""),
                "mis_en_ligne": re.search(r"<LastModified>(.*?)</LastModified>", bloc).group(1),
            })
        t = re.search(r"<NextContinuationToken>(.*?)</NextContinuationToken>", x)
        if not t:
            return objets
        jeton = t.group(1)


def sha256(chemin):
    h = hashlib.sha256()
    with open(chemin, "rb") as f:
        for bloc in iter(lambda: f.read(1 << 20), b""):
            h.update(bloc)
    return h.hexdigest()


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--cache", default=os.path.expanduser("~/.cache/futuree/socleom"))
    a = p.parse_args()
    os.makedirs(a.cache, exist_ok=True)

    cibles = []
    for o in lister(PREFIXE):
        m = MOTIF.search(o["cle"])
        if not m:
            continue
        if o["taille"] < 1000:
            # Archive vide publiée par erreur (ex. Guyane « Mensuel historical », 0 octet) : signalée, pas prise.
            print(f"ignorée (vide) : {o['cle']}", file=sys.stderr)
            continue
        # `niveau_annonce` est le niveau ÉCRIT DANS LE NOM DE L'ARCHIVE. Il peut être faux (Mayotte : l'archive
        # « RWL20 » contient les fichiers RWL-15) ; l'extraction lit le niveau dans les fichiers eux-mêmes.
        cibles.append({**o, "nature": m.group(1), "zone": m.group(2), "fenetre_ans": int(m.group(3)), "niveau_annonce": m.group(4)})

    manifeste = []
    for c in sorted(cibles, key=lambda c: c["cle"]):
        local = os.path.join(a.cache, os.path.basename(c["cle"]))
        if not (os.path.exists(local) and os.path.getsize(local) == c["taille"]):
            print(f"↓ {c['cle']} ({c['taille'] / 1e6:.1f} Mo)", flush=True)
            urllib.request.urlretrieve(BUCKET + urllib.parse.quote(c["cle"]), local + ".part")
            os.replace(local + ".part", local)
        if os.path.getsize(local) != c["taille"]:
            sys.exit(f"taille inattendue pour {local}")
        manifeste.append({**c, "fichier": os.path.basename(local), "sha256": sha256(local)})

    chemin = os.path.join(a.cache, "manifeste.json")
    with open(chemin, "w") as f:
        json.dump({"bucket": BUCKET, "prefixe": PREFIXE, "archives": manifeste}, f, indent=1, ensure_ascii=False)
    print(f"{len(manifeste)} archives, {sum(c['taille'] for c in manifeste) / 1e9:.2f} Go → {chemin}")


if __name__ == "__main__":
    main()
