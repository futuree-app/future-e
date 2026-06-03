#!/usr/bin/env python3
"""
populate-unite-urbaine.py — patche l'index avec l'unité urbaine (UU2020) par commune.

Source : data/uu2020.xlsx (table d'appartenance INSEE, feuille Composition_communale).
Lecture XML brute (openpyxl bute sur la feuille de styles INSEE). Hors unité urbaine
(STATUT_COM_UU == "H") -> uu = None. Paris/Lyon/Marseille : l'index a les arrondissements,
pas le code commune ; on leur attribue l'UU parente.
Usage (venv .venv-bpe) :
    python scripts/populate-unite-urbaine.py                # diff seulement
    python scripts/populate-unite-urbaine.py --write-index  # patche l'index
"""
import json, os, sys, argparse, re, zipfile
import xml.etree.ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX = os.path.join(ROOT, "data", "comparateur-index.json")
XLSX = os.path.join(ROOT, "data", "uu2020.xlsx")
NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
RNS = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"


# Arrondissements -> commune parente (PLM). Ranges INSEE.
def parent_plm(code):
    if "75101" <= code <= "75120": return "75056"
    if "69381" <= code <= "69389": return "69123"
    if "13201" <= code <= "13216": return "13055"
    return None


def colnum(ref):
    c = re.match("[A-Z]+", ref).group(); n = 0
    for ch in c: n = n * 26 + (ord(ch) - 64)
    return n


def read_composition():
    """Retourne {CODGEO: uu|None} depuis la feuille Composition_communale."""
    z = zipfile.ZipFile(XLSX)
    sst = ET.fromstring(z.read("xl/sharedStrings.xml"))
    ss = ["".join(t.text or "" for t in si.iter(NS + "t")) for si in sst.iter(NS + "si")]
    wb = ET.fromstring(z.read("xl/workbook.xml"))
    rels = ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))
    rid2tgt = {r.get("Id"): r.get("Target") for r in rels}
    fn = None
    for s in wb.iter(NS + "sheet"):
        if s.get("name") == "Composition_communale":
            fn = "xl/" + rid2tgt[s.get(RNS + "id")].lstrip("/")
    sh = ET.fromstring(z.read(fn))
    out = {}
    for ri, row in enumerate(sh.iter(NS + "row")):
        if ri < 6:  # 4 lignes de titre + 1 libellé + 1 en-tête VAR
            continue
        cells = {}
        for c in row.iter(NS + "c"):
            v = c.find(NS + "v"); val = v.text if v is not None else None
            if c.get("t") == "s" and val is not None:
                val = ss[int(val)]
            cells[colnum(c.get("r"))] = val
        cod, uu, statut = cells.get(1), cells.get(3), cells.get(6)
        if not cod:
            continue
        out[cod] = None if statut == "H" else uu
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--write-index", action="store_true")
    args = ap.parse_args()

    comp = read_composition()
    print(f"table : {len(comp)} communes", file=sys.stderr)
    idx = json.load(open(INDEX))

    matched = plm = missing = 0
    patch = {}
    for c in idx["communes"]:
        code = c["insee"]
        if code in comp:
            patch[code] = comp[code]; matched += 1
        else:
            par = parent_plm(code)
            if par and par in comp:
                patch[code] = comp[par]; plm += 1
            else:
                patch[code] = None; missing += 1
    print(f"matched={matched} plm_arrond={plm} sans_uu/absents={missing}", file=sys.stderr)

    if args.write_index:
        for c in idx["communes"]:
            c["uu"] = patch.get(c["insee"])
        json.dump(idx, open(INDEX, "w"))
        print("✓ index patché (champ uu)", file=sys.stderr)
    return patch


if __name__ == "__main__":
    main()
