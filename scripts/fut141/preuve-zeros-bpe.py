#!/usr/bin/env python3
"""FUT-141 · Contre-revue, réserve 2 : les vrais zéros de l'accès au supérieur, prouvés dans la BPE brute.

Reproduction INDÉPENDANTE : aucune fonction de `populate-bpe.py` ni de `plateau-etudes-acces.py` n'est importée.
Seules les CONVENTIONS du producteur sont reprises, écrites ici en clair et vérifiées contre l'index :
  - équipements : TYPEQU ∈ {C501, C502, C503, C504, C505, C509}, coordonnées WGS84 (LATITUDE, LONGITUDE)
    renseignées ; les enregistrements sans coordonnées sont listés à part (ils ne peuvent pas être comptés) ;
  - centre de la commune : lat/lon de l'index (le producteur lit les mêmes) ;
  - rayon : population de l'unité urbaine (somme des populations communales de l'index par code `uu`), sinon
    population communale ; ≥ 500 000 → 5 km, ≥ 100 000 → 10, ≥ 30 000 → 15, sinon 25 ;
  - distance : grand cercle, R = 6 371 km ; accès pondéré = Σ (1 − d / 25) sur les équipements à d ≤ rayon ;
  - rang publié sur main : 100 × (nombre d'accès ≤ x) / n, arrondi ; rang du plateau zéro après FUT-141 : par le
    milieu, 100 × (n0 / 2) / n, arrondi au demi supérieur.
Les distances sont calculées par FORCE BRUTE (chaque commune contre chaque établissement), sans la grille
spatiale du producteur : un défaut de voisinage dans la grille ne peut donc pas se répéter ici.

Pour chaque commune on retient aussi la distance au plus proche établissement, quel que soit le rayon. Un vrai
zéro est une commune dont le plus proche est AU-DELÀ de son rayon ; la marge (distance − rayon) dit à quel point
la conclusion est robuste à l'approximation sphérique (écart à l'ellipsoïde < 0,5 %, soit < 0,13 km à 25 km).

    .venv-bpe/bin/python -I scripts/fut141/preuve-zeros-bpe.py \
        --parquet <BPE25.parquet> --index-main <index de main .json.gz> --index <index de la branche .json.gz> \
        --sortie docs/audits/2026-10-29-fut141-vie-etudiante/preuve-zeros-bpe.json
Sortie non nulle si un seul contrôle échoue.
"""
import argparse, bisect, collections, gzip, hashlib, json, math, sys
import numpy as np
import pyarrow.parquet as pq

SUP = ("C501", "C502", "C503", "C504", "C505", "C509")
R_TERRE = 6371.0
DMAX = 25.0


def sha256(chemin):
    h = hashlib.sha256()
    with open(chemin, "rb") as f:
        for bloc in iter(lambda: f.read(1 << 20), b""):
            h.update(bloc)
    return h.hexdigest()


def rayon(taille):
    if taille is None:
        return 25.0
    return 5.0 if taille >= 500_000 else 10.0 if taille >= 100_000 else 15.0 if taille >= 30_000 else 25.0


def lire_index(chemin):
    with gzip.open(chemin, "rt", encoding="utf-8") as f:
        return json.load(f)


def vincenty_km(lat1, lon1, lat2, lon2):
    """Distance géodésique sur l'ellipsoïde WGS84 (Vincenty, formule inverse), en km. Sert à mesurer la
    SENSIBILITÉ des cas-frontières à la convention sphérique du producteur, pas à la remplacer."""
    a, f = 6378137.0, 1 / 298.257223563
    b = a * (1 - f)
    L = math.radians(lon2 - lon1)
    U1, U2 = math.atan((1 - f) * math.tan(math.radians(lat1))), math.atan((1 - f) * math.tan(math.radians(lat2)))
    sU1, cU1, sU2, cU2 = math.sin(U1), math.cos(U1), math.sin(U2), math.cos(U2)
    lam = L
    for _ in range(200):
        sl, cl = math.sin(lam), math.cos(lam)
        ss = math.hypot(cU2 * sl, cU1 * sU2 - sU1 * cU2 * cl)
        if ss == 0:
            return 0.0
        cs = sU1 * sU2 + cU1 * cU2 * cl
        sig = math.atan2(ss, cs)
        sa = cU1 * cU2 * sl / ss
        c2a = 1 - sa * sa
        c2sm = cs - 2 * sU1 * sU2 / c2a if c2a else 0.0
        C = f / 16 * c2a * (4 + f * (4 - 3 * c2a))
        prec, lam = lam, L + (1 - C) * f * sa * (sig + C * ss * (c2sm + C * cs * (-1 + 2 * c2sm * c2sm)))
        if abs(lam - prec) < 1e-12:
            break
    u2 = c2a * (a * a - b * b) / (b * b)
    A = 1 + u2 / 16384 * (4096 + u2 * (-768 + u2 * (320 - 175 * u2)))
    B = u2 / 1024 * (256 + u2 * (-128 + u2 * (74 - 47 * u2)))
    ds = B * ss * (c2sm + B / 4 * (cs * (-1 + 2 * c2sm * c2sm) - B / 6 * c2sm * (-3 + 4 * ss * ss) * (-3 + 4 * c2sm * c2sm)))
    return b * A * (sig - ds) / 1000


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--parquet", required=True)
    ap.add_argument("--index-main", required=True)
    ap.add_argument("--index", required=True)
    ap.add_argument("--sortie", required=True)
    a = ap.parse_args()
    fautes = []

    # 1. La source.
    t = pq.read_table(a.parquet, columns=["AN", "TYPEQU", "DEPCOM", "LIBCOM", "NOMRS", "SIRET", "LATITUDE", "LONGITUDE", "QUALITE_XY"])
    lignes = [r for r in t.to_pylist() if r["TYPEQU"] in SUP]
    ans = sorted(set(t.column("AN").to_pylist()))
    geo = [r for r in lignes if r["LATITUDE"] is not None and r["LONGITUDE"] is not None]
    sans_geo = [r for r in lignes if r["LATITUDE"] is None or r["LONGITUDE"] is None]
    elat = np.radians(np.array([r["LATITUDE"] for r in geo]))
    elon = np.radians(np.array([r["LONGITUDE"] for r in geo]))

    # 2. Les communes et leur rayon, recalculé.
    main_idx = lire_index(a.index_main)
    br_idx = lire_index(a.index)
    communes = main_idx["communes"]
    if [c["insee"] for c in communes] != [c["insee"] for c in br_idx["communes"]]:
        sys.exit("REFUS : les deux index ne portent pas les mêmes communes dans le même ordre")
    uupop = collections.Counter()
    for c in communes:
        if c.get("uu") and c.get("population") is not None:
            uupop[c["uu"]] += c["population"]
    n = len(communes)
    ray = np.array([rayon(uupop[c["uu"]] if c.get("uu") in uupop else c.get("population")) for c in communes])
    rayons_index = [c.get("etudesSup", {}).get("radiusKm") for c in communes]
    ecarts_rayon = [c["insee"] for c, r, ri in zip(communes, ray, rayons_index) if ri != int(r)]
    if ecarts_rayon:
        fautes.append(f"rayon recalculé ≠ etudesSup.radiusKm : {len(ecarts_rayon)}")

    # 3. Distances par force brute.
    clat = np.radians(np.array([c["lat"] for c in communes]))
    clon = np.radians(np.array([c["lon"] for c in communes]))
    acces = np.zeros(n); compte = np.zeros(n, dtype=np.int64); plus_proche = np.full(n, np.inf)
    for i0 in range(0, n, 2000):
        la, lo = clat[i0:i0 + 2000, None], clon[i0:i0 + 2000, None]
        h = np.sin((elat - la) / 2) ** 2 + np.cos(la) * np.cos(elat) * np.sin((elon - lo) / 2) ** 2
        d = 2 * R_TERRE * np.arcsin(np.sqrt(np.clip(h, 0, 1)))
        dans = d <= ray[i0:i0 + 2000, None]
        acces[i0:i0 + 2000] = np.where(dans, 1 - d / DMAX, 0).sum(axis=1)
        compte[i0:i0 + 2000] = dans.sum(axis=1)
        plus_proche[i0:i0 + 2000] = d.min(axis=1)

    # 4. Concordance avec l'accès publié (arrondi à 2 décimales dans l'index).
    wa = [c["etudesSup"]["weightedAccess"] for c in communes]
    ecarts_acces = [c["insee"] for c, x, w in zip(communes, acces, wa) if abs(round(float(x), 2) - w) > 0.005 + 1e-9]
    if ecarts_acces:
        fautes.append(f"accès recalculé ≠ weightedAccess publié : {len(ecarts_acces)}")

    # 5. Vrais zéros et arrondis.
    zero = acces == 0.0
    if not np.array_equal(zero, compte == 0):
        fautes.append("accès nul et compte nul ne coïncident pas")
    if not np.array_equal(zero, plus_proche > ray):
        fautes.append("accès nul et plus proche établissement au-delà du rayon ne coïncident pas")
    n0 = int(zero.sum())
    arrondis = [i for i in range(n) if not zero[i] and wa[i] == 0]

    # 6. Rangs : main se rejoue (convention bisect), la branche ne change QUE le plateau zéro.
    srt = sorted(float(x) for x in acces)
    rang_main = [round(100 * bisect.bisect_right(srt, float(x)) / n) for x in acces]
    rang_zero = math.floor(100 * n0 / 2 / n + 0.5)
    publies_main = [c.get("etudes_acces") for c in communes]
    publies_br = [c.get("etudes_acces") for c in br_idx["communes"]]
    if rang_main != publies_main:
        fautes.append(f"rang de main non rejoué : {sum(1 for x, y in zip(rang_main, publies_main) if x != y)} communes")
    attendu_br = [rang_zero if zero[i] else rang_main[i] for i in range(n)]
    changees = [i for i in range(n) if publies_br[i] != publies_main[i]]
    if attendu_br != publies_br:
        fautes.append(f"rang de la branche ≠ attendu : {sum(1 for x, y in zip(attendu_br, publies_br) if x != y)} communes")
    if set(changees) != set(np.flatnonzero(zero).tolist()):
        fautes.append("les communes modifiées ne sont pas exactement les vrais zéros")

    # 7. Les enregistrements sans coordonnées : tombent-ils dans une commune comptée zéro ?
    par_insee = {c["insee"]: i for i, c in enumerate(communes)}
    sans_geo_lus = [{
        "typequ": r["TYPEQU"], "depcom": r["DEPCOM"], "libcom": r["LIBCOM"], "nom": r["NOMRS"], "qualiteXY": r["QUALITE_XY"],
        "communeVraiZero": bool(zero[par_insee[r["DEPCOM"]]]) if r["DEPCOM"] in par_insee else None,
    } for r in sans_geo]

    # 8. Sensibilité à la convention sphérique : les communes dont le plus proche établissement est à moins de
    #    500 m du rayon, de part et d'autre, recomptées sur l'ellipsoïde WGS84.
    elat_deg, elon_deg = np.degrees(elat), np.degrees(elon)
    bascules = []
    frontiere = np.flatnonzero(np.abs(plus_proche - ray) < 0.5)
    for i in frontiere:
        la, lo = communes[i]["lat"], communes[i]["lon"]
        h = np.sin((elat - clat[i]) / 2) ** 2 + np.cos(clat[i]) * np.cos(elat) * np.sin((elon - clon[i]) / 2) ** 2
        proches = np.flatnonzero(2 * R_TERRE * np.arcsin(np.sqrt(np.clip(h, 0, 1))) <= ray[i] + 1.0)
        d_ell = min((vincenty_km(la, lo, float(elat_deg[j]), float(elon_deg[j])) for j in proches), default=math.inf)
        if (d_ell > ray[i]) != bool(zero[i]):
            bascules.append({"insee": communes[i]["insee"], "nom": communes[i]["nom"], "rayonKm": int(ray[i]),
                             "sphereKm": round(float(plus_proche[i]), 4), "ellipsoideKm": round(d_ell, 4),
                             "zeroSphere": bool(zero[i]), "zeroEllipsoide": bool(d_ell > ray[i])})

    marges = (plus_proche - ray)[zero]
    par_rayon = collections.Counter(int(r) for r in ray[zero])
    sortie = {
        "source": {
            "fichier": a.parquet.rsplit("/", 1)[-1], "sha256": sha256(a.parquet), "millesime": ans,
            "lignes": t.num_rows, "etablissementsSuperieur": len(lignes), "geolocalises": len(geo),
            "parType": dict(sorted(collections.Counter(r["TYPEQU"] for r in geo).items())),
            "sansCoordonnees": sans_geo_lus,
        },
        "index": {"main": sha256(a.index_main), "branche": sha256(a.index), "communes": n},
        "rayons": {"recalculesParRayon": dict(sorted(collections.Counter(int(r) for r in ray).items())), "ecartsAvecIndex": len(ecarts_rayon)},
        "acces": {"ecartsAvecPublie": len(ecarts_acces), "ecartMaxAbsolu": float(max(abs(round(float(x), 2) - w) for x, w in zip(acces, wa)))},
        "vraisZeros": {
            "communes": n0, "parRayon": dict(sorted(par_rayon.items())),
            "margeMinKm": round(float(marges.min()), 3), "margeMedianeKm": round(float(np.median(marges)), 3),
            "sousUnKm": int((marges < 1).sum()), "sousCentMetres": int((marges < 0.1).sum()),
            "plusFaiblesMarges": sorted(({"insee": communes[i]["insee"], "nom": communes[i]["nom"], "rayonKm": int(ray[i]),
                                          "plusProcheKm": round(float(plus_proche[i]), 3)} for i in np.flatnonzero(zero)),
                                         key=lambda x: x["plusProcheKm"] - x["rayonKm"])[:10],
        },
        "arrondisAZero": {
            "communes": len(arrondis),
            "accesMax": round(float(max(acces[i] for i in arrondis)), 5) if arrondis else None,
            "parCompte": dict(sorted(collections.Counter(int(compte[i]) for i in arrondis).items())),
            "plusProcheKm": [round(float(min(plus_proche[i] for i in arrondis)), 3), round(float(max(plus_proche[i] for i in arrondis)), 3)] if arrondis else None,
            "rangs": dict(sorted(collections.Counter(publies_br[i] for i in arrondis).items())),
            "inchangesSurLaBranche": all(publies_br[i] == publies_main[i] for i in arrondis),
            "liste": [{"insee": communes[i]["insee"], "nom": communes[i]["nom"], "rayonKm": int(ray[i]), "compte": int(compte[i]),
                       "acces": round(float(acces[i]), 5), "plusProcheKm": round(float(plus_proche[i]), 3), "rang": publies_br[i]} for i in arrondis],
        },
        "sensibiliteEllipsoide": {
            "communesAMoinsDe500mDuRayon": len(frontiere),
            "bascules": len(bascules), "zeroDevientPresence": sum(1 for b in bascules if b["zeroSphere"]),
            "presenceDevientZero": sum(1 for b in bascules if not b["zeroSphere"]), "detail": bascules,
        },
        "rangs": {"n": n, "plateauZeroAvant": rang_main[int(np.flatnonzero(zero)[0])], "plateauZeroApres": rang_zero,
                  "communesModifiees": len(changees), "mainRejoue": rang_main == publies_main, "brancheConforme": attendu_br == publies_br},
        "fautes": fautes,
    }
    with open(a.sortie, "w") as f:
        json.dump(sortie, f, ensure_ascii=False, indent=1)
        f.write("\n")
    resume = {k: v for k, v in sortie.items() if k != "arrondisAZero"}
    resume["arrondisAZero"] = {k: v for k, v in sortie["arrondisAZero"].items() if k != "liste"}
    print(json.dumps(resume, ensure_ascii=False, indent=1))
    if fautes:
        sys.exit(1)


if __name__ == "__main__":
    main()
