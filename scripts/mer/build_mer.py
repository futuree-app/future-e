#!/usr/bin/env python3
"""FUT-33, phase 1 : construire la vérité littorale (donnée seule, rien n'est branché au produit).

Entrées (téléchargées hors dépôt, cf. README.md) :
  - Limite terre-mer (LimTM) Shom-IGN, France métropolitaine, couches « ligne » et « fermeturesLIMAR » ;
  - contours communaux Etalab issus d'ADMIN EXPRESS (communes-5m, millésime explicite) ;
  - liste DGALN des communes « loi Littoral » (xlsx) ;
  - index du comparateur futur•e (pour le point de référence et l'ancienne distance).

Sorties (dans --out, hors dépôt) :
  - mer-communes.json : par commune, distances centre / territoire au rivage marin (coupé) et à la ligne
    brute, classement juridique, ancienne distance ;
  - estuaires.json : décision de coupure pour chaque fermeture LTM ;
  - rivage-marin.wkb : segments du rivage marin (EPSG:2154), pour le prototype adresse ;
  - build-meta.json : sources, millésimes, méthode, compteurs, durées.

MÉTHODE DE COUPURE (cf. rapport phase 1, §3). Le rivage de la mer s'arrête juridiquement à la limite transversale
de la mer (LTM). La LimTM brute remonte les estuaires jusqu'à la limite de la marée. On retire, dans l'ordre :
  A. CODAGE OFFICIEL : tout tronçon dont `limarc` contient 2 (« tronçon en amont de la LTM », annexe A du
     descriptif Shom-IGN). C'est la règle principale.
  B. TROUS DE CODAGE, GÉOMÉTRIE GARDÉE : la ligne est sectionnée aux extrémités de chaque fermeture LTM ; pour
     chaque fermeture, le côté amont est celui où les deux rives, suivies sur 500 m, restent proches. Le morceau
     amont n'est retiré que s'il est majoritairement NON codé (sinon la règle A suffit) ET passe trois
     garde-fous : au plus 5 km, aucun tronçon codé « aval de la LTM » (code 1), et un morceau côté mer plus
     long que lui. Sans ces garde-fous, la règle prend des côtes entières pour des estuaires (Corse, Provence,
     côte de l'Hérault).
  C. COMPLÉMENTS EXPLICITES (`COMPLEMENTS`) : estuaires non codés que la géométrie ne sait pas trancher
     (fermeture trop large), désignés par un point amont de référence, avec les mêmes garde-fous.
  D. ÎLES D'ESTUAIRE : une île (contour fermé) nettement plus proche des rives retirées que du rivage conservé, et
     à plus de 5 km de celui-ci, est retirée (îles de la Seine en amont, de la Loire, de la Gironde).
Les segments de fermeture LTM sont ajoutés au rivage (ils bordent la mer). Toute fermeture restée incertaine
est listée dans estuaires.json. Aucune table départementale n'intervient.
"""
from __future__ import annotations

import argparse
import collections
import gzip
import json
import math
import re
import time
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

import numpy as np
import pyogrio
import shapely
import shapely.ops
from pyproj import Transformer

LAMBERT93 = 2154
MARCHE_AMONT_M = 500.0      # longueur suivie sur chaque rive depuis une extrémité de fermeture
GRILLE_NOEUD_M = 0.05       # tolérance d'identité des extrémités (5 cm)
ACCROCHE_MAX_M = 1.0        # une extrémité de fermeture doit être à moins d'1 m de la ligne
GARDE_LONGUEUR_MAX_M = 400_000
# La règle géométrique (B) ne vaut que pour les petits estuaires non codés : au-delà, elle a pris 60 km de côte
# de l'Hérault pour un fleuve (Vias, Portiragnes). Les grands estuaires non codés passent par COMPLEMENTS.
GARDE_B_MAX_M = 5_000
# Une île n'est retirée que loin de tout rivage marin conservé : sinon bassins portuaires et lagunes (D2)
# seraient pris pour des îles de fleuve.
ILE_ESTUAIRE_MIN_MER_M = 5_000

# Estuaires dont la donnée officielle ne code pas l'amont et dont la fermeture est trop large pour la règle
# géométrique. Un point amont de référence désigne le morceau à retirer ; les garde-fous s'appliquent.
COMPLEMENTS = [
    {"nom": "Seine", "fermeture": (0.3536, 49.4585),
     # Points le long de la vallée, en amont de la LTM : les morceaux de ligne à moins de 2 km d'eux (les
     # deux rives, bras et darses) forment le fleuve à retirer.
     "points_amont": [(0.46, 49.475), (0.53, 49.47), (0.73, 49.525), (0.82, 49.43), (0.88, 49.48), (0.93, 49.35), (1.0993, 49.4432)],
     "motif": "rives de la Seine non codées entre la LTM (Tancarville / Honfleur) et Rouen ; fermeture de 4,8 km",
     "doivent_rester_mer": {"Honfleur": (0.235, 49.422), "Trouville": (0.075, 49.37), "Le Havre": (0.095, 49.495),
                            "Étretat": (0.205, 49.708), "Fécamp": (0.375, 49.765), "Dieppe": (1.08, 49.93)}},
]


def cle(xy) -> tuple[int, int]:
    return (round(xy[0] / GRILLE_NOEUD_M), round(xy[1] / GRILLE_NOEUD_M))


# ── Lecture des sources ───────────────────────────────────────────────────────────────────────────
def lire_limtm(dossier: Path):
    base = next(dossier.rglob("*_ligne.shp"))
    meta, _, geom, champs = pyogrio.raw.read(base, columns=["limarc"])
    lignes = list(shapely.from_wkb(geom))
    limarc = [(x or "") for x in champs[0]]
    ferm = next(dossier.rglob("*_fermeturesLIMAR.shp"))
    m2, _, g2, f2 = pyogrio.raw.read(ferm)
    noms = list(m2["fields"])
    nature = f2[noms.index("NATURE")]
    comment = f2[noms.index("COMMENTAIR")]
    facade = f2[noms.index("facade")]
    fermetures = [
        {"geom": g, "nature": nature[i], "commentaire": comment[i] or "", "facade": facade[i]}
        for i, g in enumerate(shapely.from_wkb(g2))
    ]
    return lignes, limarc, fermetures


def lire_loi_littoral(xlsx: Path) -> dict[str, list[str]]:
    """Classement DGALN (feuille des communes) : INSEE → [« Mer » | « Estuaire » | « Lac »]."""
    ns = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
    with zipfile.ZipFile(xlsx) as z:
        partages = ["".join(si.itertext()) for si in ET.fromstring(z.read("xl/sharedStrings.xml")).findall("m:si", ns)]
        lignes = ET.fromstring(z.read("xl/worksheets/sheet2.xml")).findall(".//m:row", ns)
    out: dict[str, list[str]] = collections.defaultdict(list)
    entete = None
    for r in lignes:
        vals = []
        for c in r.findall("m:c", ns):
            v = c.find("m:v", ns)
            vals.append(partages[int(v.text)] if (v is not None and c.get("t") == "s") else (v.text if v is not None else ""))
        if "INSEE_COM" in vals:
            entete = vals
            continue
        if entete and len(vals) >= len(entete):
            ligne = dict(zip(entete, vals))
            out[ligne["INSEE_COM"]].append(ligne["CLASSEMENT"])
    return dict(out)


def lire_index(chemin: Path) -> list[dict]:
    return json.loads(gzip.open(chemin).read())["communes"]


def lire_contours(chemin: Path) -> dict[str, shapely.Geometry]:
    vers93 = Transformer.from_crs(4326, LAMBERT93, always_xy=True)
    source = f"/vsigzip/{chemin}" if str(chemin).endswith(".gz") else str(chemin)
    meta, _, geom, champs = pyogrio.raw.read(source, columns=["code"])
    codes = champs[0]
    geoms = shapely.from_wkb(geom)
    out = {}
    for code, g in zip(codes, geoms):
        if not code or code.startswith("97") or code.startswith("98"):
            continue
        out[code] = shapely.transform(g, lambda xy: np.column_stack(vers93.transform(xy[:, 0], xy[:, 1])))
    return out


# ── Coupure aux fermetures LTM ────────────────────────────────────────────────────────────────────
def couper(lignes, limarc, fermetures):
    ltm = [f for f in fermetures if f["nature"] == "LTM"]
    arbre = shapely.STRtree(lignes)
    coupes = collections.defaultdict(list)     # indice de ligne -> distances curvilignes de coupe
    extremites = []                            # (fermeture, clé du point de coupe)
    non_accrochees = 0
    for fi, f in enumerate(ltm):
        cs = shapely.get_coordinates(f["geom"])
        for e in (cs[0], cs[-1]):
            p = shapely.Point(e)
            i = int(arbre.query_nearest(p)[0])
            if shapely.distance(p, lignes[i]) > ACCROCHE_MAX_M:
                non_accrochees += 1
                extremites.append((fi, None))
                continue
            s = lignes[i].project(p)
            coupes[i].append(s)
            extremites.append((fi, cle(shapely.get_coordinates(lignes[i].interpolate(s))[0])))
    morceaux, codes = [], []
    for i, ln in enumerate(lignes):
        abs_ = sorted({s for s in coupes.get(i, []) if 0.01 < s < ln.length - 0.01})
        bornes = [0.0, *abs_, ln.length]
        for a, b in zip(bornes, bornes[1:]):
            morceaux.append(shapely.ops.substring(ln, a, b) if (a, b) != (0.0, ln.length) else ln)
            codes.append(limarc[i])
    points_coupe = {k for _, k in extremites if k is not None}
    return ltm, morceaux, codes, extremites, points_coupe, non_accrochees


def composantes(morceaux, points_coupe):
    noeud = collections.defaultdict(list)
    tous = collections.defaultdict(list)
    for i, m in enumerate(morceaux):
        cs = shapely.get_coordinates(m)
        for e in (cs[0], cs[-1]):
            k = cle(e)
            tous[k].append(i)
            if k not in points_coupe:
                noeud[k].append(i)
    comp = [-1] * len(morceaux)
    n = 0
    for s in range(len(morceaux)):
        if comp[s] >= 0:
            continue
        pile = [s]
        comp[s] = n
        while pile:
            i = pile.pop()
            cs = shapely.get_coordinates(morceaux[i])
            for e in (cs[0], cs[-1]):
                for j in noeud.get(cle(e), ()):
                    if comp[j] < 0:
                        comp[j] = n
                        pile.append(j)
        n += 1
    return comp, noeud, tous


def marcher(depart_cle, morceau, morceaux, noeud):
    """Suit la ligne depuis une extrémité de fermeture sur MARCHE_AMONT_M ; rend le point atteint."""
    parcouru, i, cle_courante, vus = 0.0, morceau, depart_cle, set()
    point = None
    while i is not None and i not in vus:
        vus.add(i)
        cs = shapely.get_coordinates(morceaux[i])
        if cle(cs[0]) != cle_courante:
            cs = cs[::-1]
        ln = shapely.LineString(cs)
        reste = MARCHE_AMONT_M - parcouru
        if ln.length >= reste:
            return ln.interpolate(reste)
        parcouru += ln.length
        point = shapely.Point(cs[-1])
        cle_courante = cle(cs[-1])
        suivants = [j for j in noeud.get(cle_courante, ()) if j != i and j not in vus]
        i = suivants[0] if len(suivants) == 1 else None
    return point


def cote_amont(ltm, extremites, morceaux, codes, comp, noeud, tous):
    """Décide, fermeture par fermeture, quelles composantes sont en amont. Rend (amont, décisions)."""
    par_fermeture = collections.defaultdict(list)
    for fi, k in extremites:
        par_fermeture[fi].append(k)
    amont, decisions = set(), []
    vers84 = Transformer.from_crs(LAMBERT93, 4326, always_xy=True)
    for fi, f in enumerate(ltm):
        c = shapely.centroid(f["geom"])
        lon, lat = vers84.transform(c.x, c.y)
        d = {"fermeture": fi, "lon": round(lon, 4), "lat": round(lat, 4), "largeur_m": round(f["geom"].length, 1),
             "commentaire": f["commentaire"][:120], "facade": f["facade"]}
        ks = par_fermeture.get(fi, [])
        if len(ks) != 2 or None in ks:
            d["statut"] = "non_accrochee"
            decisions.append(d)
            continue
        a, b = ks
        pa = [(i, marcher(a, i, morceaux, noeud)) for i in tous.get(a, [])]
        pb = [(i, marcher(b, i, morceaux, noeud)) for i in tous.get(b, [])]
        pa = [(i, p) for i, p in pa if p is not None]
        pb = [(i, p) for i, p in pb if p is not None]
        if len(pa) != 2 or len(pb) != 2:
            # Extrémité commune aux deux rives, ou ligne qui s'arrête : on s'en remet au codage officiel.
            d["statut"] = "geometrie_insuffisante"
            d["pieces"] = [len(pa), len(pb)]
            decisions.append(d)
            continue
        paires = sorted(((shapely.distance(p, q), i, j) for i, p in pa for j, q in pb))
        proche, loin = paires[0], paires[-1]
        d["ecart_amont_m"] = round(proche[0], 1)
        d["ecart_aval_m"] = round(loin[0], 1)
        if proche[0] * 2 > loin[0]:
            d["statut"] = "incertain"
            decisions.append(d)
            continue
        cA, cB = comp[proche[1]], comp[proche[2]]
        amont.update({cA, cB})
        d["statut"] = "coupee"
        d["composantes_amont"] = sorted({cA, cB})
        decisions.append(d)
    return amont, decisions


# ── Mesures ───────────────────────────────────────────────────────────────────────────────────────
def distances(geoms, arbre, cibles):
    """Distance exacte (m) de chaque géométrie à la plus proche des cibles."""
    out = np.empty(len(geoms))
    for n, g in enumerate(geoms):
        i = int(arbre.query_nearest(g)[0])
        out[n] = shapely.distance(g, cibles[i])
    return out


def principal():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limtm", required=True, type=Path, help="dossier décompressé de la LimTM")
    ap.add_argument("--contours", required=True, type=Path, help="communes-5m.geojson(.gz) Etalab")
    ap.add_argument("--loi-littoral", required=True, type=Path, help="xlsx DGALN")
    ap.add_argument("--index", required=True, type=Path, help="data/comparateur-index.json.gz")
    ap.add_argument("--out", required=True, type=Path)
    ap.add_argument("--millesime-contours", default="2026")
    ap.add_argument("--cog-loi-littoral", default="2022")
    ap.add_argument("--coupure-seule", action="store_true", help="contrôle rapide : coupure et compteurs, sans mesures")
    args = ap.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)
    t = {"debut": time.time()}

    lignes, limarc, fermetures = lire_limtm(args.limtm)
    t["lecture_limtm_s"] = time.time() - t["debut"]
    ltm, morceaux, codes, extremites, points_coupe, non_accrochees = couper(lignes, limarc, fermetures)
    comp, noeud, tous = composantes(morceaux, points_coupe)
    amont_geo, decisions = cote_amont(ltm, extremites, morceaux, codes, comp, noeud, tous)

    code2 = np.array(["2" in c.split(",") for c in codes])
    code1 = np.array(["1" in c.split(",") for c in codes])
    longueur = shapely.length(np.array(morceaux, dtype=object))
    tot = collections.Counter(); tot2 = collections.Counter(); tot1 = collections.Counter()
    for i in range(len(morceaux)):
        tot[comp[i]] += longueur[i]
        if code2[i]:
            tot2[comp[i]] += longueur[i]
        if code1[i]:
            tot1[comp[i]] += longueur[i]
    par_ferm = collections.defaultdict(list)
    for fi, k in extremites:
        par_ferm[fi].append(k)

    def garde(comps, voisins):
        lg = sum(tot[c] for c in comps)
        cote_mer = max((tot[c] for c in voisins), default=0.0)
        return lg <= GARDE_LONGUEUR_MAX_M and sum(tot1[c] for c in comps) == 0 and cote_mer >= lg, round(lg / 1000, 1)

    amont_retenu = set()
    for d in decisions:
        if d["statut"] != "coupee":
            continue
        comps = set(d["composantes_amont"])
        if sum(tot2[c] for c in comps) >= 0.5 * sum(tot[c] for c in comps):
            d["regle"] = "A (codage officiel)"
            continue
        voisins = {comp[i] for k in par_ferm[d["fermeture"]] if k for i in tous.get(k, [])} - comps
        ok, km = garde(comps, voisins)
        ok = ok and km * 1000 <= GARDE_B_MAX_M
        d["regle"] = "B (géométrie gardée)" if ok else "refusée par les garde-fous"
        d["amont_km"] = float(km)
        if ok:
            amont_retenu |= comps
    vers93 = Transformer.from_crs(4326, LAMBERT93, always_xy=True)
    arbre_m = shapely.STRtree(morceaux)
    complements = []
    retire_complement = np.zeros(len(morceaux), dtype=bool)
    for cpl in COMPLEMENTS:
        # La fermeture désignée, prolongée en droite : on retire, DANS le morceau qui contient le point amont,
        # tout ce qui est du même côté de cette droite que le point amont. Une extrémité de fermeture qui
        # n'accroche pas la ligne (cas de la Seine) laisse sinon la côte aval soudée au fleuve.
        fx, fy = vers93.transform(*cpl["fermeture"])
        f = min(ltm, key=lambda x: shapely.distance(x["geom"], shapely.Point(fx, fy)))
        cs = shapely.get_coordinates(f["geom"])
        (x1, y1), (x2, y2) = cs[0], cs[-1]
        cote = lambda x, y: np.sign((x2 - x1) * (y - y1) - (y2 - y1) * (x - x1))
        pts = [shapely.Point(*vers93.transform(*q)) for q in cpl["points_amont"]]
        signe = cote(pts[-1].x, pts[-1].y)
        comps = {comp[int(i)] for p in pts for i in arbre_m.query(shapely.buffer(p, 2000), predicate="intersects")}
        idx = [i for i in range(len(morceaux)) if comp[i] in comps
               and cote(*shapely.get_coordinates(shapely.centroid(morceaux[i]))[0]) == signe]
        km = round(float(longueur[idx].sum()) / 1000, 1)
        ok = bool(idx) and km * 1000 <= GARDE_LONGUEUR_MAX_M and not code1[idx].any()
        controles = {}
        for nom, (lo, la) in cpl.get("doivent_rester_mer", {}).items():
            q = shapely.Point(*vers93.transform(lo, la))
            j = int(arbre_m.query_nearest(q)[0])
            controles[nom] = j not in set(idx)
        ok = ok and all(controles.values())
        complements.append({"nom": cpl["nom"], "motif": cpl["motif"], "amont_km": km, "applique": bool(ok), "controles": controles})
        if ok:
            retire_complement[idx] = True
    en_amont_geo = np.array([comp[i] in amont_retenu for i in range(len(morceaux))]) | retire_complement
    retire = en_amont_geo | code2

    # D. ÎLES D'ESTUAIRE. Une île est un contour fermé, sans lien avec les rives : la coupure, faite le long des
    # rives, ne l'atteint pas (îles de la Seine, de la Loire, de la Gironde). Une île non codée est retirée si
    # elle est nettement plus proche des rives retirées (fleuve) que du rivage marin conservé, et à plus de 5 km de celui-ci.
    extremites_par_comp = collections.defaultdict(collections.Counter)
    for i, m in enumerate(morceaux):
        cs = shapely.get_coordinates(m)
        extremites_par_comp[comp[i]][cle(cs[0])] += 1
        extremites_par_comp[comp[i]][cle(cs[-1])] += 1
    ile = {c for c, ext in extremites_par_comp.items() if all(n % 2 == 0 for n in ext.values())}
    garde_idx = [i for i in range(len(morceaux)) if not retire[i] and comp[i] not in ile]
    retire_idx = [i for i in range(len(morceaux)) if retire[i]]
    arbre_garde = shapely.STRtree([morceaux[i] for i in garde_idx])
    arbre_retire = shapely.STRtree([morceaux[i] for i in retire_idx])
    par_comp = collections.defaultdict(list)
    for i in range(len(morceaux)):
        if comp[i] in ile and not retire[i]:
            par_comp[comp[i]].append(i)
    iles_retirees = []
    for c, idx in par_comp.items():
        geom = shapely.union_all([morceaux[i] for i in idx])
        d_garde = shapely.distance(geom, morceaux[garde_idx[int(arbre_garde.query_nearest(geom)[0])]])
        d_retire = shapely.distance(geom, morceaux[retire_idx[int(arbre_retire.query_nearest(geom)[0])]])
        if d_garde > ILE_ESTUAIRE_MIN_MER_M and d_retire * 3 < d_garde:
            retire[idx] = True
            q = shapely.centroid(geom)
            lon, lat = Transformer.from_crs(LAMBERT93, 4326, always_xy=True).transform(q.x, q.y)
            iles_retirees.append({"km": round(geom.length / 1000, 2), "d_fleuve_m": round(d_retire), "d_mer_m": round(d_garde),
                                  "lon": round(lon, 3), "lat": round(lat, 3)})
    desaccords = {
        "retire_par_codage_km": round(float(longueur[code2].sum()) / 1000, 1),
        "retire_en_plus_par_geometrie_et_complements_km": round(float(longueur[en_amont_geo & ~code2].sum()) / 1000, 1),
    }
    rivage = [m for m, r in zip(morceaux, retire) if not r] + [f["geom"] for f in ltm]
    brut = list(lignes)
    t["coupure_s"] = time.time() - t["debut"] - t["lecture_limtm_s"]
    if args.coupure_seule:
        print("îles retirées :", len(iles_retirees), "longueur km :", round(sum(x["km"] for x in iles_retirees), 1))
        for x in sorted(iles_retirees, key=lambda x: -x["km"])[:20]:
            print("  île", x)
        riv = [m for m, r in zip(morceaux, retire) if not r] + [f["geom"] for f in ltm]
        ar = shapely.STRtree(riv)
        test_pts = {"Rouen": (1.0993, 49.4432), "Caudebec": (0.73, 49.525), "Le Havre": (0.10, 49.49), "Honfleur": (0.233, 49.418),
                    "Bordeaux": (-0.5848, 44.8624), "Nantes": (-1.5534, 47.2328), "Ré (Ars)": (-1.52, 46.21), "Oléron (Saint-Pierre)": (-1.31, 45.94),
                    "Belle-Île (Le Palais)": (-3.155, 47.347), "Île-aux-Moines": (-2.85, 47.595), "Île d'Arz": (-2.80, 47.59), "Noirmoutier": (-2.25, 47.0),
                    "Île de Batz": (-4.01, 48.745), "Île de Bréhat": (-3.00, 48.85),
                    "Portiragnes plage": (3.37, 43.278), "Vias plage": (3.415, 43.29), "Saint-Georges-de-Didonne": (-1.0, 45.6),
                    "Royan": (-1.03, 45.62)}
        for nom, q in test_pts.items():
            pt = shapely.Point(*vers93.transform(*q))
            print(nom, round(shapely.distance(pt, riv[int(ar.query_nearest(pt)[0])]) / 1000, 2), "km")
        print(json.dumps({"complements": complements, "desaccords": desaccords,
                          "longueur_retiree_km": round(float(longueur[retire].sum()) / 1000, 1)}, ensure_ascii=False, indent=1))
        return

    arbre_rivage = shapely.STRtree(rivage)
    arbre_brut = shapely.STRtree(brut)
    loi = lire_loi_littoral(args.loi_littoral)
    index = lire_index(args.index)
    contours = lire_contours(args.contours)
    t0 = time.time()
    resultats = []
    centres = [shapely.Point(*vers93.transform(c["lon"], c["lat"])) for c in index]
    d_centre = distances(centres, arbre_rivage, rivage)
    d_centre_brut = distances(centres, arbre_brut, brut)
    for n, c in enumerate(index):
        poly = contours.get(c["insee"])
        d_terr = d_terr_brut = None
        if poly is not None:
            i = int(arbre_rivage.query_nearest(poly)[0])
            d_terr = shapely.distance(poly, rivage[i])
            j = int(arbre_brut.query_nearest(poly)[0])
            d_terr_brut = shapely.distance(poly, brut[j])
        resultats.append({
            "insee": c["insee"], "nom": c["nom"], "dept": c.get("dept"),
            "ancienne_km": c.get("distance_cote_km"),
            "centre_km": round(d_centre[n] / 1000, 2),
            "territoire_km": None if d_terr is None else round(d_terr / 1000, 3),
            "centre_brut_km": round(d_centre_brut[n] / 1000, 2),
            "territoire_brut_km": None if d_terr_brut is None else round(d_terr_brut / 1000, 3),
            "loi": loi.get(c["insee"]),
            "contour": poly is not None,
        })
    # Communes PLM : la commune entière (13055, 69123, 75056), reconstruite depuis son contour.
    plm = []
    for code in ("13055", "69123", "75056"):
        poly = contours.get(code)
        if poly is None:
            continue
        i = int(arbre_rivage.query_nearest(poly)[0])
        ctr = shapely.centroid(poly)
        k = int(arbre_rivage.query_nearest(ctr)[0])
        plm.append({"insee": code, "territoire_km": round(shapely.distance(poly, rivage[i]) / 1000, 3),
                    "centre_contour_km": round(shapely.distance(ctr, rivage[k]) / 1000, 2), "loi": loi.get(code)})
    t["mesures_s"] = time.time() - t0

    (args.out / "mer-communes.json").write_text(json.dumps(resultats, ensure_ascii=False))
    (args.out / "mer-plm.json").write_text(json.dumps(plm, ensure_ascii=False, indent=1))
    (args.out / "estuaires.json").write_text(json.dumps(decisions, ensure_ascii=False, indent=1, default=float))
    (args.out / "rivage-marin.wkb").write_bytes(b"".join(
        len(w).to_bytes(4, "little") + w for w in shapely.to_wkb(np.array(rivage, dtype=object))))
    statuts = collections.Counter(d.get("regle", d["statut"]) for d in decisions)
    meta = {
        "sources": {
            "limtm": {"producteur": "Shom-IGN", "millesime": 2021, "attribution": "© Shom-IGN, 2021, http://dx.doi.org/10.17183/LIMTM",
                      "licence": "Licence Ouverte 2.0", "fichier": "Limite_terre_mer_France_metropolitaine.7z"},
            "contours": {"producteur": "IGN ADMIN EXPRESS via Etalab (contours-administratifs)", "millesime": args.millesime_contours,
                         "simplification": "5 m", "licence": "Licence Ouverte 2.0"},
            "loi_littoral": {"producteur": "DGALN - SIDAUH", "cog": args.cog_loi_littoral, "licence": "Licence Ouverte"},
        },
        "methode": "mer-v2 : LimTM coupée aux LTM (côté amont géométrique ∪ limarc 2), fermetures LTM ajoutées au rivage",
        "parametres": {"marche_amont_m": MARCHE_AMONT_M, "accroche_max_m": ACCROCHE_MAX_M, "grille_noeud_m": GRILLE_NOEUD_M},
        "compteurs": {
            "troncons_limtm": len(lignes), "morceaux_apres_coupe": len(morceaux), "composantes": max(comp) + 1,
            "fermetures_ltm": len(ltm), "extremites_non_accrochees": non_accrochees,
            "decisions": dict(statuts), "longueur_brute_km": round(float(longueur.sum()) / 1000, 1),
            "longueur_retiree_km": round(float(longueur[retire].sum()) / 1000, 1), "desaccords": desaccords,
            "iles_estuaire_retirees": len(iles_retirees), "iles_estuaire_km": round(sum(x["km"] for x in iles_retirees), 1),
            "segments_rivage": len(rivage), "communes_mesurees": len(resultats), "complements": complements,
        },
        "durees_s": {k: round(v, 1) for k, v in t.items() if k.endswith("_s")},
    }
    (args.out / "build-meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=1, default=lambda o: o.item() if hasattr(o, "item") else str(o)))
    print(json.dumps(meta["compteurs"], ensure_ascii=False, indent=1))
    print(json.dumps(meta["durees_s"]))


if __name__ == "__main__":
    principal()
