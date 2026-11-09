#!/usr/bin/env python3
"""
populate-unite-urbaine.py — patche l'index avec l'unité urbaine 2020 ET le statut Insee de chaque commune.

SOURCE. Base des unités urbaines 2020 de l'Insee, PUBLIÉE DANS LA GÉOGRAPHIE DE L'INDEX (COG au 01/01/2025) :
    https://www.insee.fr/fr/statistiques/fichier/4802589/UU2020_au_01-01-2025.zip
    (contient UU2020_au_01-01-2025.xlsx, à déposer sous data/source/, non versionné)
Feuille Composition_communale ; lecture XML brute (openpyxl bute sur la feuille de styles Insee).

FUT-176. L'ancien import lisait la version « géographie au 01/01/2023 » et ne gardait que le code `uu` :
  - le STATUT de la commune (C ville-centre, B banlieue, I ville isolée, H hors unité urbaine) était perdu ;
  - une commune ABSENTE du fichier (11 communes nouvelles de 2024-2025, dont Orée d'Anjou, ville isolée,
    et Porte des Pierres Dorées, banlieue de Lyon) recevait `uu = None`, c'est-à-dire « hors unité urbaine ».
Désormais :
  - `uu`        : code de l'unité urbaine, None si hors unité urbaine OU si la commune est inconnue du fichier ;
  - `uu_statut` : "C" | "B" | "I" | "H", ou None quand le fichier ne connaît pas la commune (statut INCONNU,
                  jamais « hors unité urbaine » par défaut) ;
  - Paris, Lyon, Marseille : l'index porte les arrondissements ; ils reçoivent l'unité urbaine et le statut de
    leur commune (ville-centre).
Le script REFUSE un fichier dont la géographie n'est pas celle de l'index (01/01/2025) ou dont l'empreinte
diffère de celle relevée le 09/11/2026.

Définitions Insee (onglet Documentation du fichier, statut calculé sur la population 2017) :
  - unité urbaine : commune ou ensemble de communes avec une zone de bâti continu (pas de coupure de plus de
    200 m) d'au moins 2 000 habitants ;
  - ville isolée (I) : unité urbaine constituée d'une seule commune ;
  - ville-centre (C) / banlieue (B) : communes d'une unité urbaine de plusieurs communes. Une commune qui pèse
    plus de 50 % de la population est seule ville-centre ; sinon, toutes celles qui dépassent la moitié de la
    plus peuplée le sont aussi. Les autres forment la banlieue ;
  - hors unité urbaine (H) : aucune zone de bâti continu de 2 000 habitants. Ce n'est PAS une « ville isolée ».

Usage (stdlib seule) :
    python3 scripts/populate-unite-urbaine.py                # diff seulement
    python3 scripts/populate-unite-urbaine.py --write-index  # patche data/comparateur-index.json
puis : node scripts/populate-uu-pop.mjs && npm run index:pack
"""
import argparse, hashlib, json, os, re, sys, zipfile
import xml.etree.ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX = os.path.join(ROOT, "data", "comparateur-index.json")
XLSX = os.path.join(ROOT, "data", "source", "UU2020_au_01-01-2025.xlsx")
SOURCE_URL = "https://www.insee.fr/fr/statistiques/fichier/4802589/UU2020_au_01-01-2025.zip"
# Empreintes relevées le 09/11/2026 : xlsx extrait (contrôlée) ; archive bc43d62e67c5dc6a…be44840, pour mémoire.
EMPREINTE = "f2e14a9ad965ce219e8c1d68e1ac73a88685266bd8bdd836f7be061cf8439772"
GEOGRAPHIE = "Géographie au 01/01/2025"
STATUTS = {"C", "B", "I", "H"}
NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
RNS = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"


def parent_plm(code):
    """Arrondissement -> commune (Paris, Lyon, Marseille). Plages Insee."""
    if "75101" <= code <= "75120": return "75056"
    if "69381" <= code <= "69389": return "69123"
    if "13201" <= code <= "13216": return "13055"
    return None


def colnum(ref):
    c = re.match("[A-Z]+", ref).group(); n = 0
    for ch in c: n = n * 26 + (ord(ch) - 64)
    return n


def read_sheet(z, ss, rid2tgt, wb, name):
    fn = None
    for s in wb.iter(NS + "sheet"):
        if s.get("name") == name:
            fn = "xl/" + rid2tgt[s.get(RNS + "id")].lstrip("/")
    if fn is None:
        raise SystemExit(f"REFUS : feuille {name} absente du fichier")
    rows = []
    for row in ET.fromstring(z.read(fn)).iter(NS + "row"):
        cells = {}
        for c in row.iter(NS + "c"):
            v = c.find(NS + "v"); val = v.text if v is not None else None
            if c.get("t") == "s" and val is not None:
                val = ss[int(val)]
            cells[colnum(c.get("r"))] = val
        rows.append(cells)
    return rows


def read_composition(path):
    """Retourne {CODGEO: (uu|None, statut)} et vérifie la géographie et l'en-tête."""
    z = zipfile.ZipFile(path)
    sst = ET.fromstring(z.read("xl/sharedStrings.xml"))
    ss = ["".join(t.text or "" for t in si.iter(NS + "t")) for si in sst.iter(NS + "si")]
    wb = ET.fromstring(z.read("xl/workbook.xml"))
    rels = ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))
    rid2tgt = {r.get("Id"): r.get("Target") for r in rels}
    rows = read_sheet(z, ss, rid2tgt, wb, "Composition_communale")
    if GEOGRAPHIE not in (rows[2].get(1) or ""):
        raise SystemExit(f"REFUS : le fichier n'est pas en « {GEOGRAPHIE} » ({rows[2].get(1)!r})")
    header = [rows[5].get(i) for i in range(1, 7)]
    if header != ["CODGEO", "LIBGEO", "UU2020", "LIBUU2020", "TYPE_COMMUNE_UU", "STATUT_COM_UU"]:
        raise SystemExit(f"REFUS : en-tête inattendu {header}")
    out = {}
    for cells in rows[6:]:
        cod, uu, statut = cells.get(1), cells.get(3), cells.get(6)
        if not cod:
            continue
        if statut not in STATUTS:
            raise SystemExit(f"REFUS : statut inconnu {statut!r} pour {cod}")
        if (statut == "H") != (cells.get(5) == "Hors unité urbaine"):
            raise SystemExit(f"REFUS : type et statut incohérents pour {cod}")
        out[cod] = (None if statut == "H" else uu, statut)
    return out


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def resolve(index_communes, comp):
    """{insee: (uu, statut|None)} pour chaque entrée de l'index, et les comptes."""
    patch, comptes, inconnues = {}, {"fichier": 0, "arrondissements": 0, "inconnues": 0}, []
    for c in index_communes:
        code = c["insee"]
        if code in comp:
            patch[code] = comp[code]; comptes["fichier"] += 1
            continue
        par = parent_plm(code)
        if par and par in comp:
            patch[code] = comp[par]; comptes["arrondissements"] += 1
            continue
        # Commune inconnue du fichier : statut INCONNU. Jamais « hors unité urbaine » par défaut.
        patch[code] = (None, None); comptes["inconnues"] += 1; inconnues.append(f"{code} {c['nom']}")
    return patch, comptes, inconnues


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--write-index", action="store_true")
    ap.add_argument("--xlsx", default=XLSX)
    args = ap.parse_args()

    empreinte = sha256_file(args.xlsx)
    if empreinte != EMPREINTE:
        raise SystemExit(f"REFUS : empreinte du fichier {empreinte} ≠ {EMPREINTE} (nouvelle publication Insee ? relire avant d'importer)")
    comp = read_composition(args.xlsx)
    idx = json.load(open(INDEX))
    patch, comptes, inconnues = resolve(idx["communes"], comp)

    avant = {c["insee"]: c.get("uu") for c in idx["communes"]}
    changes = [f"{k} : {avant[k]} -> {v[0]} ({v[1]})" for k, v in patch.items() if avant.get(k) != v[0]]
    statuts = {}
    for _, s in patch.values():
        statuts[s or "inconnu"] = statuts.get(s or "inconnu", 0) + 1
    print(f"table : {len(comp)} communes ; {comptes} ; statuts {statuts}", file=sys.stderr)
    for line in changes:
        print(f"  code uu modifié · {line}", file=sys.stderr)
    for line in inconnues:
        print(f"  statut inconnu · {line}", file=sys.stderr)

    if args.write_index:
        for c in idx["communes"]:
            c["uu"], c["uu_statut"] = patch[c["insee"]]
        idx["meta"]["uniteUrbaine"] = {
            "source": "Insee, base des unités urbaines 2020, géographie au 01/01/2025 (mise en ligne le 21/03/2025)",
            "url": SOURCE_URL,
            "sha256Xlsx": EMPREINTE,
            "champs": "uu (code de l'unité urbaine, null si hors unité urbaine ou statut inconnu), uu_statut (C ville-centre, B banlieue, I ville isolée, H hors unité urbaine, null inconnu)",
            "statutPopulation": "statut calculé par l'Insee sur la population 2017",
            "arrondissements": "Paris, Lyon, Marseille : unité urbaine et statut de leur commune",
            "comptes": statuts,
        }
        json.dump(idx, open(INDEX, "w"), ensure_ascii=False, separators=(",", ":"))
        print("✓ index patché (champs uu, uu_statut, meta.uniteUrbaine)", file=sys.stderr)
    return patch


if __name__ == "__main__":
    main()
