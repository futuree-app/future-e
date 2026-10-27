# FUT-83 · Reproduire les mesures

Tout est en lecture seule. Python 3, bibliothèque standard. Les fichiers téléchargés vont dans un dossier à part,
jamais dans le dépôt.

```sh
D=/chemin/vers/un/dossier/vide
# Registre quotidien (le nom change chaque jour : prendre l'URL de la ressource 3ea8e2c3-0038-464a-b17e-cd5c91f65ce2)
curl -o $D/rnic-20261027.csv https://static.data.gouv.fr/resources/registre-national-dimmatriculation-des-coproprietes/20261027-070546/20261027-rnc-data-gouv-with-qpv.csv
# Millésime T3 2025, ancien format de colonnes
curl -o $D/rnic-t3-2025.csv https://static.data.gouv.fr/resources/registre-national-dimmatriculation-des-coproprietes/20251029-083300/rnc-data-gouv-with-qpv.csv

M=docs/audits/2026-10-27-fut83-rnic/mesures
python3 -I scripts/fut83/profil_rnic.py $D/rnic-20261027.csv $D/rnic-t3-2025.csv > $M/profil.json
python3 -I scripts/fut83/millesimes.py  $D/rnic-20261027.csv $D/rnic-t3-2025.csv > $M/millesimes.json
# Réseau : ~200 appels BDNB (quota 10 000 par mois), ~125 appels ADEME
python3 -I scripts/fut83/collecte_bdnb_rnc.py docs/audits/2026-10-26-fut80-rnb/mesure.json.gz > $M/bdnb_rnc.json
python3 -I scripts/fut83/collecte_dpe_copro.py > $M/dpe_copro.json
# Hors ligne
python3 -I scripts/fut83/rattachement.py $D/rnic-20261027.csv docs/audits/2026-10-26-fut80-rnb/mesure.json.gz $M/bdnb_rnc.json > $M/rattachement.json
python3 -I scripts/fut83/verite_terrain.py $D/rnic-20261027.csv $M/dpe_copro.json > $M/verite_terrain.json
python3 -I scripts/fut83/cas.py $D/rnic-20261027.csv $D/rnic-t3-2025.csv AA2109551 AA2099810 … > $M/cas.json
```

| Fichier | Contenu |
|---|---|
| `profil.json` | Remplissage, valeurs, anciennetés, distributions ; fichier quotidien et T3 2025 ; comparaison des deux |
| `millesimes.json` | Transitions d'une même copropriété entre les deux millésimes (aide Anah, mandat, syndic, lots) |
| `bdnb_rnc.json` | Liens copropriété ↔ groupe de bâtiments de la BDNB, pour les 967 groupes rencontrés par FUT-80 |
| `rattachement.json` | Les 990 adresses de FUT-80 : candidates par l'adresse, la parcelle et la BDNB, et niveau retenu |
| `dpe_copro.json` | 382 DPE et 160 audits ADEME qui portent un numéro de copropriété (graine 83) |
| `verite_terrain.json` | Recherche par l'adresse confrontée à ce numéro |
| `cas.json` | Fiches complètes, deux millésimes, des copropriétés citées dans `rattachement.md` |

Les tirages au hasard sont reproductibles (graine fixe). Le registre change chaque jour : un nouveau téléchargement
donnera des comptes voisins, pas identiques.
