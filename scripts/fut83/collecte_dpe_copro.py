"""FUT-83 : un échantillon de DPE et d'audits ADEME qui portent un numéro d'immatriculation de copropriété,
saisi par le diagnostiqueur ou l'auditeur. Ce numéro sert de référence INDÉPENDANTE du registre pour mesurer
le rattachement par l'adresse : il ne vient ni de la BAN, ni du RNB, ni de la BDNB.

Tirage reproductible : graine fixe, départements et mois tirés au hasard, 8 lignes au plus par tirage.
Lecture seule, environ 120 appels à l'API ADEME (data-fair), une pause entre deux.

Usage : python3 -I scripts/fut83/collecte_dpe_copro.py > dpe_copro.json
"""
import json, random, sys, time, urllib.parse, urllib.request

API = "https://data.ademe.fr/data-fair/api/v1/datasets/{}/lines"
DEPS = [f"{i:02d}" for i in range(1, 96) if i != 20] + ["2A", "2B", "971", "972", "974"]
CHAMPS_DPE = ["numero_dpe", "type_batiment", "date_etablissement_dpe", "identifiant_ban", "adresse_ban", "code_insee_ban",
              "numero_immatriculation_copropriete", "id_rnb", "provenance_id_rnb", "nombre_appartement", "score_ban",
              "methode_application_dpe"]
CHAMPS_AUDIT = ["n_audit", "date_etablissement_audit", "identifiant_ban", "adresse_ban", "code_insee_ban",
                "n_immatriculation_copro", "id_rnb", "nb_appartement", "score_ban"]

def lignes(jeu, qs, champs, n):
    q = urllib.parse.urlencode({"size": n, "qs": qs, "select": ",".join(champs)})
    with urllib.request.urlopen(f"{API.format(jeu)}?{q}", timeout=30) as r:
        return json.load(r).get("results", [])

def main():
    rnd = random.Random(83)
    dpe, audits, vus = [], [], set()
    for _ in range(100):
        dep, an, mois = rnd.choice(DEPS), rnd.choice([2022, 2023, 2024, 2025, 2026]), rnd.randint(1, 12)
        if an == 2026 and mois > 9:
            mois = rnd.randint(1, 9)
        fin = f"{an}-{mois:02d}-28"
        qs = (f"type_batiment:(appartement OR immeuble) AND code_departement_ban:{dep} AND "
              f"date_etablissement_dpe:[{an}-{mois:02d}-01 TO {fin}] AND _exists_:numero_immatriculation_copropriete")
        try:
            for l in lignes("dpe03existant", qs, CHAMPS_DPE, 8):
                if l["numero_dpe"] not in vus:
                    vus.add(l["numero_dpe"]); l["tirage"] = {"dep": dep, "mois": f"{an}-{mois:02d}"}; dpe.append(l)
        except Exception as e:  # noqa: BLE001
            dpe.append({"erreur": str(e), "tirage": {"dep": dep, "mois": f"{an}-{mois:02d}"}})
        time.sleep(0.3)
    vus = set()
    for dep in rnd.sample(DEPS, 25):
        try:
            for l in lignes("audit-opendata", f"n_departement_ban:{dep} AND _exists_:n_immatriculation_copro", CHAMPS_AUDIT, 40):
                if l["n_audit"] not in vus:
                    vus.add(l["n_audit"]); audits.append(l)
        except Exception as e:  # noqa: BLE001
            audits.append({"erreur": str(e), "dep": dep})
        time.sleep(0.3)
    json.dump({"date": time.strftime("%Y-%m-%d"), "graine": 83, "dpe": dpe, "audits": audits}, sys.stdout, ensure_ascii=False, indent=0)

if __name__ == "__main__":
    main()
