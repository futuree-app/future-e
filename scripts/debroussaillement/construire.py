#!/usr/bin/env python3
"""
construire.py (FUT-149) : construit les tuiles du ZONAGE INFORMATIF DES OBLIGATIONS LÉGALES DE DÉBROUSSAILLEMENT
(base DÉBROUSSAILLEMENT de l'IGN, pour le ministère chargé des forêts), lues par l'application à la parcelle et au
point (`src/lib/debroussaillement.ts`).

── POURQUOI DES TUILES SUR SUPABASE STORAGE, ET PAS UN FICHIER DANS LES FONCTIONS ─────────────────────────────────
 La publication complète pèse 1,76 Go (590 Mo compressés) ; ses 4 237 zones publiées comptent 9,5 millions de
 sommets sur 128 000 km². Embarquer ne serait-ce que la géométrie (≈ 33 Mo compressés) dans les fonctions de
 Logement et d'Autour défairait l'optimisation du traçage de #106/#107. Découpée en tuiles de 0,1° (≈ 2 200
 objets immuables, 9 Ko en médiane), une analyse ne lit qu'une à quatre tuiles. Même patron que la fibre à
 l'adresse (FUT-156) : préfixe neuf par édition, pointeur `courant.json` écrit en dernier.

── LA SOURCE ──────────────────────────────────────────────────────────────────────────────────────────────────
 Version COMPLÈTE (GeoPackage, Lambert-93), seule à porter la date de l'arrêté préfectoral, le millésime des
 données sources et le lien de la préfecture. On garde les objets `ZONAGE = 2` (les zones à OLD : massifs et bande
 de 200 m, documentation IGN v7.0 § 3.2.2) ; les objets `ZONAGE = 1` (massifs seuls) ne sont pas diffusés.
 `DIFFUSION` vaut « Oui » pour les 4 236 objets de la carte officielle ; un objet vaut « O » (Savoie, édition du
 01/03/2026) et n'est pas affiché par la carte : il est gardé, marqué `ambigu`, et l'application n'en conclut
 rien (« données imprécises »), ni « dans la zone » ni « hors zone ».

── LES CONTRÔLES (le script s'arrête au lieu d'écrire une édition douteuse) ──────────────────────────────────
 - Les départements présents sont EXACTEMENT ceux des arrêtés de classement en vigueur (`DEPARTEMENTS_ARRETES`) ;
   un écart arrête la construction (`--accepter-ecart-arrete` pour construire quand même, en le disant).
 - Chaque zone est un polygone valide (Shapely) dans sa projection d'origine.
 - Chaque morceau de tuile, une fois arrondi au 1e-7 degré, reste un polygone valide ; sinon il est marqué
   non mesurable (`v: 0`) et l'application rend la lecture incertaine près de lui, jamais « hors zone ».
 - La surface totale des tuiles retrouve celle des zones (à 0,01 % près).
 - L'écriture est faite dans un dossier temporaire, renommé à la fin.

── LE FORMAT (`debroussaillement-1`) ─────────────────────────────────────────────────────────────────────────
 <sortie>/<édition>/manifest.json        couverture, profils (département, source, arrêté…), tuiles et empreintes
 <sortie>/<édition>/t/<ix>_<iy>.json.gz  les morceaux de zone de la cellule [ix/10, (ix+1)/10[ × [iy/10, (iy+1)/10[
 Coordonnées WGS84 (pyproj, EPSG:2154 → EPSG:4326) en entiers de 1e-7 degré, chaque anneau codé en différences.
 Les bords de cellule sont des droites exactes (ix × 1 000 000) : l'application les reconnaît comme des coupes
 de tuile, pas comme des limites de zone. Une cellule entièrement dans une zone n'a pas de fichier : le manifeste
 la marque `plein`. Une cellule absente du manifeste ne contient aucune zone publiée.

 Usage :
   python3 -I scripts/debroussaillement/construire.py --archive <DEBROUSSAILLEMENT_…_2026-03-01.7z> --sortie <dossier>
   python3 -I scripts/debroussaillement/construire.py --gpkg <fichier.gpkg> --edition 2026-03-01 --sortie <dossier>
 Dépendances épinglées : scripts/debroussaillement/requirements.txt (dans un environnement virtuel).
"""
import argparse
import datetime as dt
import gzip
import hashlib
import json
import math
import os
import re
import shutil
import sqlite3
import sys
import tempfile

import numpy
import shapely
from pyproj import Transformer
from shapely import wkb
from shapely.geometry import box
from shapely.strtree import STRtree

FORMAT = "debroussaillement-1"
PAS = 1_000_000  # 0,1 degré en unités de 1e-7 degré
ECHELLE = 1e7

# LES DÉPARTEMENTS DONT DES BOIS ET FORÊTS SONT CLASSÉS À RISQUE D'INCENDIE (code forestier, L132-1 et L133-1).
# Arrêté du 6 février 2024, article 3 (25 départements, en entier sauf exclusions de l'annexe 2), et annexe 1
# remplacée par l'arrêté du 20 mai 2025 puis par celui du 13 avril 2026 (JO du 28/04/2026, 27 départements, en
# partie). Relevé le 28/10/2026 (docs/audits/2026-10-28-fut149-debroussaillement/01-source.md).
DEPARTEMENTS_ARRETES = {
    "article 3 (L133-1)": "04 05 06 07 09 11 12 13 2A 2B 24 26 30 33 34 40 46 47 48 64 65 66 81 83 84".split(),
    "annexe 1 (L132-1)": "16 17 18 19 22 27 28 29 31 32 35 36 37 38 41 42 43 45 49 56 72 73 77 79 82 86 91".split(),
}
SOURCE_URL = "https://data.geopf.fr/telechargement/resource/DEBROUSSAILLEMENT"


def journal(*a):
    print(*a, file=sys.stderr, flush=True)


def sha256_fichier(chemin):
    h = hashlib.sha256()
    with open(chemin, "rb") as f:
        for bloc in iter(lambda: f.read(1 << 20), b""):
            h.update(bloc)
    return h.hexdigest()


def geometrie(blob):
    """Une géométrie GeoPackage : en-tête « GP », enveloppe de taille variable, puis WKB."""
    if blob[:2] != b"GP":
        raise ValueError("en-tête GeoPackage absent")
    enveloppe = {0: 0, 1: 32, 2: 48, 3: 48, 4: 64}[(blob[3] >> 1) & 7]
    return wkb.loads(bytes(blob[8 + enveloppe:]))


def departement(code):
    """« 004 » → « 04 », « 02A » → « 2A » : le code Insee du département, celui des communes."""
    code = code.strip()
    return code[1:] if len(code) == 3 and code[0] == "0" else code


def date_iso(v):
    """« 17/10/25 » → « 2025-10-17 » ; toute autre forme (« Mi-juin 2023 », vide) : None, le texte brut reste."""
    m = re.fullmatch(r"(\d{2})/(\d{2})/(\d{2})", (v or "").strip())
    if not m:
        return None
    j, mo, a = map(int, m.groups())
    try:
        return dt.date(2000 + a, mo, j).isoformat()
    except ValueError:
        return None


def lire_zones(gpkg):
    con = sqlite3.connect(f"file:{gpkg}?mode=ro", uri=True)
    tables = [r[0] for r in con.execute("select table_name from gpkg_contents where data_type = 'features'")]
    if len(tables) != 1:
        raise SystemExit(f"une seule table attendue dans le GeoPackage, trouvé : {tables}")
    srs = con.execute("select srs_id from gpkg_geometry_columns").fetchone()[0]
    if srs != 2154:
        raise SystemExit(f"projection inattendue (srs {srs}) : la version complète est publiée en EPSG:2154")
    cols = "geom, ID, DEPT, SOURCE, MILLESIME, ORIGINE, ZONAGE, DIFFUSION, URL, DATE_INTEG, DAT_AP_OLD"
    zones = []
    diffusions = {}
    for row in con.execute(f"select {cols} from {tables[0]} where ZONAGE = 2"):
        g, ident, dept, source, millesime, origine, _, diffusion, url, integ, arrete = row
        diffusions[diffusion] = diffusions.get(diffusion, 0) + 1
        if diffusion not in ("Oui", "O"):
            raise SystemExit(f"valeur de DIFFUSION inconnue pour {ident} : {diffusion!r}")
        geom = geometrie(g)
        if geom.is_empty or not geom.is_valid:
            raise SystemExit(f"zone {ident} : géométrie vide ou invalide ({shapely.is_valid_reason(geom)})")
        zones.append({
            "id": ident, "geom": geom, "ambigu": diffusion != "Oui",
            "profil": (departement(dept), (source or "").strip(), (origine or "").strip(), (millesime or "").strip() or None,
                       (arrete or "").strip() or None, (url or "").strip() or None, (integ or "").strip() or None),
        })
    total = con.execute(f"select count(*) from {tables[0]}").fetchone()[0]
    return zones, {"table": tables[0], "objets": total, "zones": len(zones), "diffusion": diffusions}


def verifier_departements(zones, accepter):
    presents = {z["profil"][0] for z in zones}
    attendus = {d for l in DEPARTEMENTS_ARRETES.values() for d in l}
    manque, en_trop = sorted(attendus - presents), sorted(presents - attendus)
    if manque or en_trop:
        msg = f"départements : absents de la base {manque}, absents des arrêtés {en_trop}"
        if not accepter:
            raise SystemExit(msg + " (relire les arrêtés de classement, ou --accepter-ecart-arrete)")
        journal("ATTENTION", msg)
    return sorted(presents), {"absentsDeLaBase": manque, "absentsDesArretes": en_trop}


def anneau_code(coords):
    """Un anneau fermé → [x0, y0, dx1, dy1, …] en entiers de 1e-7 degré, sans le sommet de fermeture."""
    pts = [(round(x * ECHELLE), round(y * ECHELLE)) for x, y in coords[:-1]]
    propres = []
    for p in pts:
        if not propres or propres[-1] != p:
            propres.append(p)
    if len(propres) > 1 and propres[0] == propres[-1]:
        propres.pop()
    if len(propres) < 3:
        return None, None
    plat = [propres[0][0], propres[0][1]]
    for a, b in zip(propres, propres[1:]):
        plat += [b[0] - a[0], b[1] - a[1]]
    return plat, propres


def polygones(g):
    if g.is_empty:
        return []
    if g.geom_type == "Polygon":
        return [g]
    if g.geom_type in ("MultiPolygon", "GeometryCollection"):
        return [p for x in g.geoms for p in polygones(x)]
    return []  # lignes et points nés de la découpe : aucune surface


def construire(gpkg, edition, sortie, accepter_ecart, exclusions):
    t0 = dt.datetime.now()
    journal("empreinte de la source…")
    empreinte = sha256_fichier(gpkg)
    zones, lecture = lire_zones(gpkg)
    couverture, ecart = verifier_departements(zones, accepter_ecart)
    journal(f"{lecture['zones']} zones publiées sur {lecture['objets']} objets ; {len(couverture)} départements")

    # Les profils : ce qui est dit d'une zone (département, nature de la source, arrêté, millésime, lien).
    profils, index_profil = [], {}
    for z in zones:
        if z["profil"] not in index_profil:
            dept, source, origine, millesime, arrete, url, integ = z["profil"]
            index_profil[z["profil"]] = len(profils)
            profils.append({
                "departement": dept, "source": source, "origine": origine or None, "millesime": millesime,
                "arrete": date_iso(arrete), "arreteBrut": arrete, "url": url, "integration": date_iso(integ), "integrationBrut": integ,
            })
        z["p"] = index_profil[z["profil"]]

    # Projection : WGS84 en ordre lon, lat. Transformation de chaque sommet (aucune densification : la base
    # est déjà simplifiée par l'IGN et ses segments sont courts ; l'écart d'une corde Lambert projetée en
    # WGS84 reste sub-centimétrique à cette échelle).
    vers_wgs84 = Transformer.from_crs(2154, 4326, always_xy=True)
    journal("projection en WGS84…")
    aire_source = sum(z["geom"].area for z in zones)
    for z in zones:
        z["wgs"] = shapely.transform(z["geom"], lambda c: _transformer(vers_wgs84, c))
    arbre = STRtree([z["wgs"] for z in zones])
    x0, y0, x1, y1 = shapely.total_bounds([z["wgs"] for z in zones])

    tmp = tempfile.mkdtemp(prefix=f".{edition}-", dir=sortie)
    os.makedirs(os.path.join(tmp, "t"))
    tuiles, nmorceaux, invalides, sommets = {}, 0, 0, 0
    aire_tuiles = 0.0  # en Lambert-93, pour comparer à la source
    vers_l93 = Transformer.from_crs(4326, 2154, always_xy=True)
    for ix in range(math.floor(x0 * 10), math.floor(x1 * 10) + 1):
        for iy in range(math.floor(y0 * 10), math.floor(y1 * 10) + 1):
            cellule = (ix / 10, iy / 10, (ix + 1) / 10, (iy + 1) / 10)
            idx = arbre.query(box(*cellule), predicate="intersects")
            if len(idx) == 0:
                continue
            morceaux, plein = [], None
            aire_cellule = box(*cellule).area
            for k in sorted(idx, key=lambda i: zones[i]["id"]):
                z = zones[k]
                # Arrondi à la grille de 1e-7 degré par GEOS (`set_precision`, arrondi topologique) : un arrondi
                # sommet par sommet créait des auto-intersections minuscules (26 morceaux sur l'édition du
                # 01/03/2026, jusqu'à 72 km²), qui auraient rendu « incertaine » toute une commune.
                for p in polygones(shapely.set_precision(shapely.clip_by_rect(z["wgs"], *cellule), 1 / ECHELLE)):
                    if p.area <= 0:
                        continue
                    if abs(p.area - aire_cellule) <= 1e-12 * aire_cellule and len(p.interiors) == 0:
                        plein = {"p": z["p"], "o": z["id"], **({"a": 1} if z["ambigu"] else {})}
                        continue
                    anneaux, valide = [], True
                    ext, pts_ext = anneau_code(list(p.exterior.coords))
                    if ext is None:
                        continue
                    anneaux.append(ext)
                    trous_pts = []
                    for trou in p.interiors:
                        t, pts = anneau_code(list(trou.coords))
                        if t is not None:
                            anneaux.append(t)
                            trous_pts.append(pts)
                    # Le polygone arrondi doit rester valide : sinon on le dit non mesurable.
                    q = shapely.Polygon([(a / ECHELLE, b / ECHELLE) for a, b in pts_ext], [[(a / ECHELLE, b / ECHELLE) for a, b in t] for t in trous_pts])
                    if not q.is_valid:
                        valide = False
                        invalides += 1
                    sommets += len(pts_ext) + sum(len(t) for t in trous_pts)
                    morceaux.append({"p": z["p"], "o": z["id"], "r": anneaux, **({"v": 0} if not valide else {}), **({"a": 1} if z["ambigu"] else {})})
            if plein is None and not morceaux:
                continue
            cle = f"{ix}_{iy}"
            if plein is not None and not morceaux:
                tuiles[cle] = {"plein": plein}
                aire_tuiles += shapely.transform(box(*cellule), lambda c: _transformer(vers_l93, c)).area
                continue
            if plein is not None:
                # Une cellule pleine ET d'autres morceaux : deux zones se recouvrent. Le rectangle devient un morceau.
                carre = [ix * PAS, iy * PAS, PAS, 0, 0, PAS, -PAS, 0]
                morceaux.append({**{k: v for k, v in plein.items()}, "r": [carre]})
            contenu = {"format": FORMAT, "edition": edition, "ix": ix, "iy": iy, "morceaux": morceaux}
            octets = gzip.compress(json.dumps(contenu, separators=(",", ":")).encode(), compresslevel=9, mtime=0)
            with open(os.path.join(tmp, "t", f"{cle}.json.gz"), "wb") as f:
                f.write(octets)
            tuiles[cle] = {"octets": len(octets), "sha256": hashlib.sha256(octets).hexdigest()}
            nmorceaux += len(morceaux)
            for m in morceaux:
                aire_tuiles += _aire_l93(m["r"], vers_l93)

    ecart_aire = abs(aire_tuiles - aire_source) / aire_source
    journal(f"tuiles : {len(tuiles)} ; morceaux : {nmorceaux} ; non mesurables : {invalides} ; écart d'aire {ecart_aire:.6%}")
    if ecart_aire > 1e-4:
        shutil.rmtree(tmp)
        raise SystemExit(f"la surface des tuiles s'écarte de celle des zones de {ecart_aire:.4%} : construction refusée")

    tailles = sorted(t["octets"] for t in tuiles.values() if "octets" in t)
    manifeste = {
        "format": FORMAT,
        "edition": edition,
        "construitLe": dt.date.today().isoformat(),
        "producteur": "IGN, pour le ministère chargé des forêts",
        "diffuseur": "IGN (Géoplateforme)",
        "licence": "Licence Ouverte 2.0 (Etalab)",
        "source": {"url": SOURCE_URL, "fichier": os.path.basename(gpkg), "sha256": empreinte, "octets": os.path.getsize(gpkg), **lecture},
        "couverture": couverture,
        "arretes": DEPARTEMENTS_ARRETES,
        # Communes où l'arrêté exclut tous les massifs mais où la base publie des zones : l'application n'y conclut rien.
        "exclusionsArretes": {c: v["commune"] for c, v in exclusions["communes"].items()},
        "exclusionsTexte": exclusions["texte"],
        "ecartArretes": ecart,
        "profils": profils,
        "tuiles": tuiles,
        "stats": {
            "tuiles": len(tuiles), "fichiers": len(tailles), "pleines": sum(1 for t in tuiles.values() if "plein" in t),
            "octets": sum(tailles), "medianeOctets": tailles[len(tailles) // 2] if tailles else 0, "maxOctets": tailles[-1] if tailles else 0,
            "morceaux": nmorceaux, "nonMesurables": invalides, "sommets": sommets, "ecartAire": round(ecart_aire, 8),
            "aireKm2": round(aire_source / 1e6),
        },
    }
    with open(os.path.join(tmp, "manifest.json"), "w") as f:
        json.dump(manifeste, f, ensure_ascii=False, separators=(",", ":"))
    final = os.path.join(sortie, edition)
    if os.path.exists(final):
        shutil.rmtree(final)
    os.rename(tmp, final)
    journal(f"écrit : {final} ({(dt.datetime.now() - t0).seconds} s)")
    print(json.dumps(manifeste["stats"], ensure_ascii=False))


def _transformer(t, coords):
    x, y = t.transform(coords[:, 0], coords[:, 1])
    return numpy.column_stack([x, y])


def _aire_l93(anneaux, t):
    rings = []
    for plat in anneaux:
        x, y = plat[0], plat[1]
        pts = [(x, y)]
        for i in range(2, len(plat), 2):
            x += plat[i]
            y += plat[i + 1]
            pts.append((x, y))
        lon = [p[0] / ECHELLE for p in pts]
        lat = [p[1] / ECHELLE for p in pts]
        X, Y = t.transform(lon, lat)
        rings.append(list(zip(X, Y)))
    return shapely.Polygon(rings[0], rings[1:]).area


def extraire(archive, dossier):
    import py7zr
    with py7zr.SevenZipFile(archive) as z:
        noms = [n for n in z.getnames() if n.endswith(".gpkg")]
        if len(noms) != 1:
            raise SystemExit(f"un seul GeoPackage attendu dans l'archive, trouvé : {noms}")
        z.extract(path=dossier, targets=noms)
    return os.path.join(dossier, noms[0])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--archive")
    ap.add_argument("--gpkg")
    ap.add_argument("--edition")
    ap.add_argument("--sortie", required=True)
    ap.add_argument("--accepter-ecart-arrete", action="store_true")
    ap.add_argument("--revision", type=int, help="numéro de révision (2, 3…) quand le même millésime IGN est reconstruit")
    ap.add_argument("--exclusions", default=os.path.join(os.path.dirname(os.path.abspath(__file__)), "exclusions-arretes.json"))
    a = ap.parse_args()
    os.makedirs(a.sortie, exist_ok=True)
    extraction = None
    if a.archive:
        m = re.search(r"_(\d{4}-\d{2}-\d{2})\.7z$", a.archive)
        edition = a.edition or (m and m.group(1))
        extraction = tempfile.mkdtemp(dir=a.sortie, prefix=".extraction-")
        gpkg = extraire(a.archive, extraction)
    else:
        gpkg, edition = a.gpkg, a.edition
    if not gpkg or not edition or not re.fullmatch(r"\d{4}-\d{2}-\d{2}", edition):
        raise SystemExit("--archive <…_AAAA-MM-JJ.7z>, ou --gpkg <fichier> --edition AAAA-MM-JJ")
    # Une édition publiée est immuable : reconstruire le même millésime IGN avec un contenu différent (exclusions,
    # correction du script) demande une révision, publiée sous un identifiant neuf (`2026-03-01.2`).
    if a.revision:
        edition = f"{edition}.{a.revision}"
    with open(a.exclusions) as f:
        exclusions = json.load(f)
    if exclusions.get("editionVerifiee") != edition.split(".")[0]:
        journal(f"ATTENTION : les exclusions ont été vérifiées sur l'édition {exclusions.get('editionVerifiee')}, pas {edition} : refaire la contre-épreuve des arrêtés")
    try:
        construire(gpkg, edition, a.sortie, a.accepter_ecart_arrete, exclusions)
    finally:
        # L'extraction (1,8 Go pour l'édition nationale) ne reste pas dans le dossier de sortie (contre-revue du 30/10/2026).
        if extraction:
            shutil.rmtree(extraction, ignore_errors=True)


if __name__ == "__main__":
    main()
