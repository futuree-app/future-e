#!/usr/bin/env python3
"""FUT-33, phase 1.5 : effet réel des fermetures LTM incertaines (et non accrochées).

Une fermeture « incertaine » est une fermeture dont la règle géométrique n'a pas su dire quel côté est l'amont.
On mesure ce que cela change : pour chaque côté de la fermeture (morceaux conservés touchant ses extrémités, hors
fermeture elle-même), on simule son retrait et on recalcule la distance au rivage des centres communaux situés à
moins de 30 km. Un côté dont le retrait n'éloigne aucune commune n'a pas d'effet pratique (A). Un écart d'au plus
3 km est local (B). Au-delà, la fermeture peut fausser fortement la distance (C), et on regarde de près.
Le côté retenu comme « amont plausible » est le plus court ; le plus long est presque toujours la côte.

Entrées : l'état de coupure (build_mer.py --sauver-etat) et l'index du comparateur.
"""
import argparse
import collections
import gzip
import json
import pickle
from pathlib import Path

import numpy as np
import shapely
from pyproj import Transformer

GRILLE = 0.05
cle = lambda xy: (round(xy[0] / GRILLE), round(xy[1] / GRILLE))


def principal():
    ap = argparse.ArgumentParser()
    ap.add_argument("--etat", type=Path, required=True)
    ap.add_argument("--index", type=Path, required=True)
    ap.add_argument("--out", type=Path, required=True)
    a = ap.parse_args()
    e = pickle.loads(a.etat.read_bytes())
    morceaux, comp, retire, decisions, ltm, extremites = e["morceaux"], e["comp"], e["retire"], e["decisions"], e["ltm"], e["extremites"]
    vers93 = Transformer.from_crs(4326, 2154, always_xy=True)
    index = json.loads(gzip.open(a.index).read())["communes"]
    centres = np.array([vers93.transform(c["lon"], c["lat"]) for c in index])
    pts = shapely.points(centres)
    garde = np.array([not r for r in retire])
    longueur = shapely.length(np.array(morceaux, dtype=object))
    long_comp = collections.Counter()
    for i in range(len(morceaux)):
        if garde[i]:
            long_comp[comp[i]] += longueur[i]
    noeud = collections.defaultdict(list)
    for i, m in enumerate(morceaux):
        cs = shapely.get_coordinates(m)
        noeud[cle(cs[0])].append(i)
        noeud[cle(cs[-1])].append(i)
    rivage_idx = [i for i in range(len(morceaux)) if garde[i]]
    rivage = [morceaux[i] for i in rivage_idx] + [f["geom"] for f in ltm]
    arbre = shapely.STRtree(rivage)
    d0 = shapely.distance(pts, np.array(rivage, dtype=object)[arbre.query_nearest(pts, all_matches=False)[1]])
    par_ferm = collections.defaultdict(list)
    for fi, k in extremites:
        par_ferm[fi].append(k)
    vers84 = Transformer.from_crs(2154, 4326, always_xy=True)
    sorties = []
    for d in decisions:
        if d["statut"] not in ("incertain", "non_accrochee"):
            continue
        fi = d["fermeture"]
        ks = [k for k in par_ferm.get(fi, []) if k]
        if not ks:  # non accrochée : on prend les morceaux les plus proches de ses extrémités
            cs = shapely.get_coordinates(ltm[fi]["geom"])
            ks = []
            for xy in (cs[0], cs[-1]):
                j = int(shapely.STRtree(morceaux).query_nearest(shapely.Point(xy))[0])
                ks.append(cle(shapely.get_coordinates(morceaux[j])[0]))
        cotes = sorted({comp[i] for k in ks for i in noeud.get(k, []) if garde[i]}, key=lambda c: long_comp[c])
        effets = []
        for c in cotes:
            sans = [morceaux[i] for i in rivage_idx if comp[i] != c] + [f["geom"] for f in ltm]
            ar = shapely.STRtree(sans)
            geom_c = shapely.union_all([morceaux[i] for i in rivage_idx if comp[i] == c])
            proches = np.nonzero(shapely.distance(pts, geom_c) < 30000)[0]
            if len(proches) == 0:
                effets.append({"cote_km": round(long_comp[c] / 1000, 1), "communes": 0, "delta_max_km": 0.0, "touchees": []})
                continue
            d1 = shapely.distance(pts[proches], np.array(sans, dtype=object)[ar.query_nearest(pts[proches], all_matches=False)[1]])
            delta = (d1 - d0[proches]) / 1000
            ordre = np.argsort(-delta)
            touchees = [{"insee": index[proches[j]]["insee"], "nom": index[proches[j]]["nom"], "pop": index[proches[j]].get("population"),
                         "avant_km": round(d0[proches[j]] / 1000, 2), "apres_km": round(d1[j] / 1000, 2)}
                        for j in ordre[:6] if delta[j] > 0.3]
            effets.append({"cote_km": round(long_comp[c] / 1000, 1), "communes": int((delta > 0.3).sum()),
                           "delta_max_km": round(float(delta.max()), 2), "touchees": touchees})
        amont = effets[0] if effets else None
        dm = amont["delta_max_km"] if amont else 0.0
        classe = "A" if dm < 0.5 else ("B" if dm <= 3 else "C")
        sorties.append({"fermeture": fi, "statut": d["statut"], "lon": d["lon"], "lat": d["lat"], "largeur_m": d["largeur_m"],
                        "commentaire": d["commentaire"], "facade": d["facade"], "classe": classe,
                        "cote_amont_plausible": amont, "autres_cotes_km": [x["cote_km"] for x in effets[1:]]})
        print(classe, d["lon"], d["lat"], d["largeur_m"], "amont", amont and amont["cote_km"], "km, Δmax", dm, [t["nom"] for t in (amont or {}).get("touchees", [])][:4])
    a.out.write_text(json.dumps(sorties, ensure_ascii=False, indent=1))
    print(collections.Counter(s["classe"] for s in sorties))


if __name__ == "__main__":
    principal()
