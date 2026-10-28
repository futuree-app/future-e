# 1. Sources, schémas, licences

> Lus le 28/10/2026.

## A. ARCEP, `2026T2-Immeuble` (cartefibre)

- Jeu data.gouv.fr « Le marché du haut et très haut débit fixe (déploiements) », licence `fr-lo`
  (Licence Ouverte). La carte cartefibre elle-même est en CC-BY-SA.
- Un ZIP de 834 742 670 octets (`last-modified` 20/10/2026) contenant **un seul CSV** de plus de 4 Go,
  `carte_fibre_immeubles_2026_T2_20260902.csv`, 25 298 583 lignes. Pas de découpage par département : il faut
  lire tout le fichier en flux (1 min 40 sur le poste du porteur, rien n'est stocké en entier).
- Schéma : `x, y` (WGS84), `imb_id` (code immeuble de l'IPE), `num_voie, cp_no_voie, type_voie, nom_voie,
  batiment, code_insee, code_poste, nom_com`, `catg_loc_imb`, **`imb_etat`**, `pm_ref, pm_etat, pm_date_mad`,
  `code_l331`, `type_imb` (PA pavillon, IM immeuble), `date_completude`, `date_completude_manquante`.
- **Aucune clé BAN.** L'adresse n'existe qu'en texte.
- Statuts nationaux : déployé 24 545 548 · cible 365 099 · en cours de déploiement 184 650 · raccordable
  sur demande 92 779 · signé 59 062 · RAD en cours de déploiement 30 544 · abandonné 20 450 (444 lignes mal
  formées, virgules dans un libellé).
- Libellés officiels (aide de cartefibre, lue dans la page) : « Études réalisées » (la carte y range `cible`
  et `signe`, même couleur), « Programmé », « Raccordable sur demande » (« ne sera réalisée qu'en cas de
  demande d'un opérateur commercial (et ce dans un délai d'au plus six mois) »), « Raccordable sur demande
  (en cours de déploiement) », « En cours de déploiement », « Déployé ».

## B. ARCEP, « Ma connexion internet » (MCI)

- Jeu data.gouv.fr `ma-connexion-internet`, licence `lov2` (Licence Ouverte 2.0), données au 30/06/2026.
- Fichiers par département sur `https://data.arcep.fr/fixe/maconnexioninternet/{base_imb,eligibilite}/last/departement/`
  (redirection 302 vers un stockage OVH : `curl -L`). Charente-Maritime : `base_imb_17.csv.gz` 19,3 Mo,
  `actuel_17.csv.gz` 20,4 Mo. National : 1,35 Go et 1,87 Go.
- Documentation officielle (PDF v2025T4, image seule, lue page par page) :
  - `base_imb` : un immeuble par ligne. `imb_id` (identifiant Arcep, « pas pérenne », change chaque
    trimestre), `imb_x/imb_y` (EPSG:3857), `imb_code` (« code immeuble de l'IPE lorsque imb_source='fo' »),
    `imb_nbr_logloc`, `imb_source` (`fo` IPE, `ban`, `cada` ; on observe aussi `fpb`, `fpban`, non
    documentés), `imb_type`, **`addr_code`** (« clef d'interopérabilité issue de la BAN quand
    addr_source='ban' »), champs d'adresse, `addr_source`.
  - `actuel` : triplets {immeuble ; technologie ; débit}, par opérateur. Technologies `FO` (fibre), `CU`
    (DSL), `COAX`, `4GF`, `THDR`, `WMX`, `SAT` ; classes de débit `INEL` à `THD1G` ; `limitation`,
    `saturation`.
- Code ouvert de l'algorithme : `github.com/Arcep-dev/algo_maconnexioninternet` (MIT). Il établit comment la
  clé BAN est posée sur un immeuble fibre (`sql/reverse_geocoding_fo.sql`) : **même commune, même numéro,
  et nom de voie à distance de Levenshtein ≤ 7 à moins de 70 m, ou ≤ 3 à moins de 500 m, le plus proche
  retenu**. Pour les points `fpb`, un dernier tour prend l'adresse BAN la plus proche à moins de 200 m
  (`data_workflow_db_addr_evol.sql`) : ces points ne portent aucune donnée fibre et ne sont pas utilisés.

## C. La jointure

`base_imb.imb_code` = `Immeuble.imb_id` : 406 217 des 406 220 codes IPE de la Charente-Maritime se
retrouvent dans le fichier cartefibre, et 0 des 280 doublons de ce fichier ne se contredit.

`actuel` (FO) contre `imb_etat`, par immeuble : **déployé ⇔ au moins une offre fibre** (400 434 contre 0 ;
aucun immeuble cible, signé, en cours ou raccordable sur demande n'a d'offre). MCI n'apporte donc, au-delà
de cartefibre, que la liste des opérateurs.

## D. API

Aucune API publique documentée, ni pour MCI ni pour cartefibre.

- MCI s'appuie sur un GeoServer (`maconnexioninternet.arcep.fr/geoserver/a2026_t2/wms`, couches
  `immeuble_filaire`, `eligibilite`, requêtes `GetFeatureInfo` filtrées par `immeuble_id`). Il est joignable,
  mais sans documentation, sans conditions d'usage ni engagement de service, et son espace de noms change à
  chaque trimestre (`a2026_t2`).
- cartefibre lit des tuiles Mapbox hébergées sur le compte d'un prestataire.

Le POC ne s'en est servi que pour **vérifier**, en lisant ce que les sites affichent. Le produit ne doit pas
en dépendre.
