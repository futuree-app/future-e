"""FUT-83 : profil du fichier RNIC publié sur data.gouv.fr (Anah), en lecture seule.

Usage : python3 -I scripts/fut83/profil_rnic.py <rnic-quotidien.csv> <rnic-t3-2025.csv> > profil.json

Le fichier quotidien (depuis avril 2026) et le millésime T3 2025 n'ont pas les mêmes noms de colonnes :
on les ramène au même vocabulaire (`COLONNES_T3`) avant de comparer.
"""
import csv, json, re, sys, collections, datetime

csv.field_size_limit(10**7)
AUJ = datetime.date(2026, 10, 27)

COLONNES_T3 = {  # nom T3 2025 -> nom quotidien
    "numero_d_immatriculation": "numero_immatriculation",
    "date_d_immatriculation": "date_immatriculation",
    "date_de_la_derniere_maj": "date_derniere_maj",
    "type_de_syndic_benevole_professionnel_non_connu": "type_syndic",
    "mandat_en_cours_dans_la_copropriete": "mandat_en_cours",
    "nombre_total_de_lots": "nombre_total_lots",
    "nombre_total_de_lots_a_usage_d_habitation_de_bureaux_ou_de_comm": "nombre_lots_habitation_bureaux_commerces",
    "nombre_de_lots_a_usage_d_habitation": "nombre_lots_habitation",
    "nombre_de_lots_de_stationnement": "nombre_lots_stationnement",
    "periode_de_construction": "periode_construction",
    "reference_cadastrale_1": "reference_cadastrale_1",
    "adresse_de_reference": "adresse_reference",
    "syndicat_principal_ou_syndicat_secondaire": "syndicat_principal_ou_secondaire",
    "long": "longitude", "lat": "latitude",
    "copro_aidee": "copro_aidee",
    "nombre_de_parcelles_cadastrales": "nombre_parcelles",
    "residence_service": "residence_service", "syndicat_cooperatif": "syndicat_cooperatif",
}

def lire(chemin, renommer=None):
    with open(chemin, encoding="utf-8", errors="replace", newline="") as f:
        for r in csv.DictReader(f):
            if renommer:
                r = {renommer.get(k, k): v for k, v in r.items()}
            yield r

def entier(v):
    try:
        return int(float(v))
    except (TypeError, ValueError):
        return None

def date(v):
    try:
        return datetime.date.fromisoformat(v[:10])
    except (TypeError, ValueError):
        return None

def profil(chemin, renommer=None):
    n = 0
    rempli = collections.Counter()
    valeurs = {k: collections.Counter() for k in (
        "type_syndic", "mandat_en_cours", "periode_construction", "syndicat_principal_ou_secondaire",
        "copro_aidee", "residence_service", "syndicat_cooperatif", "nombre_parcelles")}
    age_maj = collections.Counter()
    annee_immat = collections.Counter()
    lots = collections.Counter()
    incoherences = collections.Counter()
    par_parcelle = collections.defaultdict(list)
    par_adresse = collections.defaultdict(list)
    numeros = collections.Counter()
    colonnes = None
    vus = set()
    lignes = 0
    for r in lire(chemin, renommer):
        if colonnes is None:
            colonnes = list(r.keys())
        lignes += 1
        # Le fichier quotidien répète des lignes à l'identique : chaque copropriété n'est comptée qu'une fois.
        if r["numero_immatriculation"] in vus:
            numeros[r["numero_immatriculation"]] += 1
            continue
        vus.add(r["numero_immatriculation"])
        n += 1
        for k, v in r.items():
            if v not in ("", None):
                rempli[k] += 1
        for k in valeurs:
            valeurs[k][r.get(k, "")] += 1
        numeros[r["numero_immatriculation"]] += 1
        d = date(r["date_derniere_maj"])
        if d:
            j = (AUJ - d).days
            age_maj["< 1 an" if j < 365 else "1-2 ans" if j < 730 else "2-3 ans" if j < 1095 else ">= 3 ans"] += 1
        else:
            age_maj["absente"] += 1
        di = date(r["date_immatriculation"])
        annee_immat[str(di.year) if di else "absente"] += 1
        t = entier(r["nombre_total_lots"]); h = entier(r["nombre_lots_habitation"])
        p = entier(r["nombre_lots_stationnement"]); hbc = entier(r["nombre_lots_habitation_bureaux_commerces"])
        if h is None:
            lots["habitation absente"] += 1
        else:
            lots["0" if h == 0 else "1-10" if h <= 10 else "11-49" if h <= 49 else "50-199" if h <= 199 else ">= 200"] += 1
        if t is not None and hbc is not None and hbc > t: incoherences["hbc > total"] += 1
        if hbc is not None and h is not None and h > hbc: incoherences["habitation > hbc"] += 1
        if t is not None and h is not None and p is not None and h + p > t: incoherences["habitation + stationnement > total"] += 1
        if h == 0: incoherences["0 lot d'habitation"] += 1
        if t is not None and t <= 1: incoherences["total <= 1"] += 1
        if t is not None and hbc is not None and h is not None and hbc > h:
            incoherences["avec lots de bureaux ou commerces (hbc > habitation)"] += 1
        ref = r["reference_cadastrale_1"].strip()
        if ref:
            par_parcelle[ref].append(r["numero_immatriculation"])
        adr = r["adresse_reference"].strip().lower()
        if not re.match(r"^\s*\d", adr):
            incoherences["adresse de reference sans numero"] += 1
        if adr:
            par_adresse[adr].append(r["numero_immatriculation"])
    multi_parcelle = collections.Counter(min(len(v), 5) for v in par_parcelle.values())
    multi_adresse = collections.Counter(min(len(v), 5) for v in par_adresse.values())
    return {
        "fichier": chemin.split("/")[-1], "lignes": lignes, "coproprietes": n, "colonnes": colonnes,
        "numeros_distincts": len(numeros), "numeros_en_double": sum(1 for c in numeros.values() if c > 1),
        "taux_remplissage": {k: round(rempli[k] / n, 4) for k in colonnes},
        "valeurs": {k: dict(v.most_common(15)) for k, v in valeurs.items()},
        "anciennete_derniere_maj": dict(age_maj),
        "annee_immatriculation": dict(sorted(annee_immat.items())),
        "lots_habitation": dict(lots),
        "incoherences_lots": dict(incoherences),
        "copros_par_reference_cadastrale_1": {str(k): v for k, v in sorted(multi_parcelle.items())},
        "copros_par_adresse_de_reference": {str(k): v for k, v in sorted(multi_adresse.items())},
    }

def comparer(quotidien, t3):
    a = {r["numero_immatriculation"]: r for r in lire(quotidien)}
    b = {r["numero_immatriculation"]: r for r in lire(t3, COLONNES_T3)}
    communs = a.keys() & b.keys()
    ch = collections.Counter()
    exemples = collections.defaultdict(list)
    for num in communs:
        x, y = a[num], b[num]
        for k in ("nombre_total_lots", "nombre_lots_habitation", "periode_construction", "type_syndic", "mandat_en_cours", "reference_cadastrale_1", "adresse_reference"):
            vx, vy = (x.get(k) or "").strip(), (y.get(k) or "").strip()
            if k == "periode_construction":
                vx, vy = norm_periode(vx), norm_periode(vy)
            if k == "adresse_reference":
                vx, vy = vx.lower(), vy.lower()
            if vx != vy:
                ch[k] += 1
                if len(exemples[k]) < 5:
                    exemples[k].append({"numero": num, "t3_2025": vy, "27_10_2026": vx})
        if x.get("date_derniere_maj") != y.get("date_derniere_maj"):
            ch["date_derniere_maj"] += 1
    return {
        "dans_t3_2025": len(b), "dans_quotidien": len(a), "communs": len(communs),
        "seulement_quotidien": len(a.keys() - b.keys()), "seulement_t3_2025": len(b.keys() - a.keys()),
        "champs_modifies_sur_les_communs": dict(ch), "exemples": exemples,
    }

PERIODES = {
    "avant 1949": "AVANT_1949", "de 1949 à 1960": "DE_1949_A_1960", "de 1961 à 1974": "DE_1961_A_1974",
    "de 1975 à 1993": "DE_1975_A_1993", "de 1994 à 2000": "DE_1994_A_2000", "de 2001 à 2010": "DE_2001_A_2010",
    "après 2010": "APRES_2011", "a partir de 2011": "APRES_2011", "non connue": "NON_CONNUE",
}
def norm_periode(v):
    return PERIODES.get(v.strip().lower(), v.strip().upper())

if __name__ == "__main__":
    quotidien, t3 = sys.argv[1], sys.argv[2]
    json.dump({"quotidien": profil(quotidien), "t3_2025": profil(t3, COLONNES_T3), "comparaison": comparer(quotidien, t3)},
              sys.stdout, ensure_ascii=False, indent=1)
