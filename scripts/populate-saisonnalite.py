#!/usr/bin/env python3
"""Résidences secondaires par commune — proxy de saisonnalité / pression touristique.

Source INSEE « Logement en 2022 » (base communale logement, recensement, dernier
millésime) : https://www.insee.fr/fr/statistiques/8581474

Produit data/residences-secondaires.json : { insee: part_rsec_pct }, où
part_rsec = P22_RSECOCC / P22_LOG * 100 (résidences secondaires et logements
occasionnels sur l'ensemble des logements). Fichier latéral, lu au runtime par
src/lib/saisonnalite.ts ; ne touche pas à l'index du comparateur.

Sans dépendance externe (urllib + zipfile + csv). Mêmes conventions que
populate-demographie.py.
"""
import csv
import io
import json
import os
import sys
import urllib.request
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, "data", "cache-saisonnalite")
OUT = os.path.join(ROOT, "data", "residences-secondaires.json")
URL = "https://www.insee.fr/fr/statistiques/fichier/8581474/base-cc-logement-2022_csv.zip"
ZIP_PATH = os.path.join(CACHE, "base-cc-logement-2022_csv.zip")


def download(url, dest):
    if os.path.exists(dest) and os.path.getsize(dest) > 0:
        return
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    print(f"Téléchargement {url}", file=sys.stderr)
    req = urllib.request.Request(url, headers={"User-Agent": "futur-e/1.0"})
    with urllib.request.urlopen(req, timeout=180) as r, open(dest, "wb") as f:
        f.write(r.read())


def first(row, keys):
    for k in keys:
        if k in row and row[k] not in (None, ""):
            return row[k]
    return None


def main():
    download(URL, ZIP_PATH)
    out = {}
    with zipfile.ZipFile(ZIP_PATH) as z:
        name = next(n for n in z.namelist() if n.lower().endswith(".csv"))
        raw = z.read(name)
    text = raw.decode("utf-8", errors="replace")
    delimiter = ";" if text.split("\n", 1)[0].count(";") >= text.split("\n", 1)[0].count(",") else ","
    reader = csv.DictReader(io.StringIO(text), delimiter=delimiter)
    for row in reader:
        insee = (first(row, ["CODGEO", "codgeo", "COM"]) or "").strip()
        log = first(row, ["P22_LOG", "P21_LOG", "LOG"])
        rsec = first(row, ["P22_RSECOCC", "P21_RSECOCC", "RSECOCC"])
        if not insee or log in (None, "") or rsec in (None, ""):
            continue
        try:
            log_f = float(str(log).replace(",", "."))
            rsec_f = float(str(rsec).replace(",", "."))
        except ValueError:
            continue
        if log_f > 0:
            out[insee] = round(rsec_f / log_f * 100, 1)
    if not out:
        print("ERREUR : aucune commune appariée (colonnes inattendues ?)", file=sys.stderr)
        sys.exit(1)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))
    print(f"{len(out)} communes -> {OUT}", file=sys.stderr)


if __name__ == "__main__":
    main()
