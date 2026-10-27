"""FUT-83 : la fiche registre (deux millésimes) des copropriétés citées dans `rattachement.md`.
Usage : python3 -I scripts/fut83/cas.py <rnic-quotidien.csv> <rnic-t3-2025.csv> NUM1 NUM2 … > cas.json
"""
import json, sys
sys.path.insert(0, __file__.rsplit("/", 1)[0])
from rnic_index import lire_rnic  # noqa: E402
from profil_rnic import COLONNES_T3, lire  # noqa: E402

CHAMPS = ["numero_immatriculation", "nom_usage_copropriete", "commune", "adresse_reference", "adresse_complementaire_1",
          "adresse_complementaire_2", "adresse_complementaire_3", "nombre_adresses_complementaires", "nombre_total_lots",
          "nombre_lots_habitation_bureaux_commerces", "nombre_lots_habitation", "nombre_lots_stationnement",
          "periode_construction", "date_immatriculation", "date_derniere_maj", "type_syndic", "raison_sociale_representant_legal",
          "mandat_en_cours", "date_fin_dernier_mandat", "syndicat_principal_ou_secondaire",
          "numero_immatriculation_syndicat_principal", "nombre_asl", "nombre_aful", "residence_service", "copro_aidee",
          "reference_cadastrale_1", "reference_cadastrale_2", "reference_cadastrale_3", "nombre_parcelles", "latitude", "longitude"]

def main(q, t3, numeros):
    a = lire_rnic(q)
    b = {r["numero_immatriculation"]: r for r in lire(t3, COLONNES_T3) if r["numero_immatriculation"] in numeros}
    sortie = {}
    for n in numeros:
        x = a.get(n)
        sortie[n] = {"27_10_2026": {k: x.get(k) for k in CHAMPS} if x else None,
                     "t3_2025": {k: b[n].get(k) for k in CHAMPS if k in b[n]} if n in b else None}
    json.dump(sortie, sys.stdout, ensure_ascii=False, indent=1)

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2], sys.argv[3:])
