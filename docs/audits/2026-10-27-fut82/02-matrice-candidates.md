# FUT-82 · 2. Matrice des candidates

> Une ligne par candidate, les 23 colonnes demandées. Version filtrable : `matrice-candidates.csv`
> (séparateur `;`, UTF-8). Aucun score composite : le verdict est qualitatif et justifié. Les chiffres
> viennent des mesures de `mesures/` (45 points de sonde, 200 logements tirés) ; ils sont des ordres de
> grandeur, pas des statistiques nationales.
>
> Lecture des verdicts : **Intégrer (vague A)** · **Approfondir (vague B)** · **Expérimenter (vague C)** ·
> **Veille** · **Écarter**.

## 2.1 Verdicts en un coup d'œil

| Donnée candidate | Grain | Existant | Moat | Verdict | Justification |
|---|---|---|---|---|---|
| Plan d'exposition au bruit (PEB) des aérodromes | Zone (A, B, C, D) lue au point | Aucun : calmeSonore communal désigne le rail à Villeneuve-le-Roi et Goussainville ; Autour ignore les aéroports | Incertitude actionnable, Projet (extension, calme), Composition (nuits chaudes × fenêtres) | Intégrer (vague A) | Rare mais décisif, effet légal vérifié, lecture rapide et stable, aucun équivalent dans le produit |
| Plan de gêne sonore (PGS) | Zone (1, 2, 3) au point | Aucun | Incertitude actionnable | Intégrer avec le PEB (vague A) | Même lecture, même bloc, valeur concrète |
| Cartes de bruit stratégiques (Lden, Ln) | Zone isophone | calmeSonore, infrastructures Autour | Composition | Veille | Chantier de données, pas une source ; réévaluer si agrégat national |
| Zonage informatif des obligations légales de débroussaillement (OLD) | Zone au point et à la parcelle | Danger feu DRIAS, GASPAR feu ; geste générique « débroussaillement » | Composition (feu projeté × obligation), Incertitude actionnable, Projet (maison) | Intégrer (vague A) | Effet légal et financier, rattaché à l'adresse, compose avec le feu déjà lu, rapide |
| Feux de forêt observés (BDIFF) | Commune (code INSEE), sans point ni contour | DRIAS IFM (projection), GASPAR feu (déclaratif) ; champ ADEME « incendies » sans provenance | Composition (avec OLD et DRIAS) | Approfondir (vague B), après accord écrit du producteur | Valeur réelle mais grain communal et licence bloquante |
| Sensibilité aux remontées de nappe | Polygones ~250 m, au point | Lecture inondation FUT-127/129 ; péril « nappe » CatNat communal | Projet (sous-sol), Incertitude actionnable | Approfondir (vague B, conditionnelle) | Ne trie pas en général ; décisif pour un sous-sol |
| Piézométrie (niveaux de nappe) | Station (forage) | Aucun | — | Écarter pour l'adresse ; veille (bulletins régionaux) | Non attribuable |
| Rapport de risques Géorisques au point (champ remonteeNappe) | Adresse (selon couches) | Non lu | — | Écarter comme source ; garder comme référence de règle | Instable ; la carte BRGM porte la même information avec la fiabilité |
| Registre officiel des émissions polluantes (IREP 2024, détail par polluant) | Établissement (point) | ICPE/Seveso (moteur, commune) ; extrait ADEME 2019 sur une page publique | Composition (faible) | Veille (et corriger l'outil public) | Le détail existe mais n'informe pas sur l'air respiré |
| Extrait IREP ADEME (data_risk_IREP) | Établissement | Lu par PollutionLookup (page publique) | — | Remplacer ou retirer (dette) | Source périmée et tronquée |
| Protections fortes (Natura 2000 SIC/ZPS, parc national, RNN/RNR, APB, réserves biologiques) | Périmètre au point ou à la parcelle | OSO (nature perçue), Cartofriches zonage_enviro non lu | Projet (nature), Composition | Approfondir (vague B) | Rare au logement ; valeur de voisinage et de terrain |
| Parc naturel régional (PNR) | Commune / périmètre | Aucun | Projet (signature identitaire) | Approfondir (vague B, signature territoriale) | Distinctif et identitaire, peu décisionnel |
| ZNIEFF 1 et 2 | Zone | Aucun | — | Écarter | Inventaire sans effet juridique, confusion probable |
| Réseaux de chaleur (éligibilité, PDP) | Point (distance au réseau) | Aucun | Composition (DPE × réseau), Continuité (rénovation) | Approfondir (vague B) | Utile en rénovation et en ville, sans urgence de décision |
| Lignes électriques aériennes HTB | Ligne | Aucun (servitude I4 explorée en script) | — | Veille | Rare, effet faible, risque d'anxiété injustifiée |
| Servitude I4 (lignes électriques, GPU) | Emprise | Servitudes AC1/AC2/AC4 lues | — | Veille (avec FUT-81) | Relève du droit de la parcelle |
| Antennes radioélectriques (ANFR) | Support (point) | Aucun | — | Écarter | Ne sert aucune décision défendable |
| Mesures d'exposition aux ondes (ANFR) | Point de mesure | Aucun | — | Écarter | Couverture anecdotique |
| Production photovoltaïque estimée (PVGIS) | Point | Rayonnement communal ERA5 | Projet (spécialisé) | Expérimenter (vague C) | Spécialisé, ordre de grandeur utile |
| Potentiel solaire du bâti (méthode simplifiée) | Bâtiment BD TOPO | Aucun | Composition (avec RNB) | Expérimenter (vague C, après FUT-80) | Méthode faite pour la planification, pas pour un toit |
| Fibre et technologies à l'adresse (Ma connexion internet) | Immeuble | Aucun | Projet (télétravail) | Expérimenter (vague C) | Moat faible, coût d'ingestion |
| Couverture mobile théorique | Maille | Aucun | — | Veille | Peu décisionnel |
| Bornes de recharge (IRVE) | Point | ZFE | — | Écarter | Peu de poids dans un choix de lieu |
| Prix et qualité du service de l'eau (SISPEA) | Service d'eau | Qualité de l'eau Hub'Eau (AskFuture) | — | Veille | Budget, pas décision |
| AZI / EAIP | Commune / enveloppe | Lecture inondation FUT-127/129 | — | Écarter | Redondant avec la lecture inondation |
| Annuaire de l'éducation | Établissement | BPE (accès) | — | Veille | Peu d'apport au-delà de la BPE |
| IPS, IVAL, IVAC | Établissement | Aucun (décision du 09/07) | — | Écarter | Décision éditoriale confirmée |
| Délinquance enregistrée (SSMSI) | Commune | Aucun (décision) | — | Écarter | Ne répond pas à la question posée |
| Fiscalité locale (taux votés) | Commune | Aucun | — | Écarter | Non attribuable au bien |
| Zones climatiques locales (LCZ) | Îlot urbain | ICU CSTB (596 communes) | Composition (confort d'été) | Veille | Déjà couvert par l'ICU là où c'est utile |
| Pollution lumineuse | Raster | Aucun | — | Écarter | Pas de source nationale officielle |
| Accidents industriels (ARIA) | Établissement / commune | ICPE/Seveso | — | Veille | Non sondée en détail |

## 2.2 Source, nature, couverture, fraîcheur, accès

| Donnée candidate | Producteur | Source | Nature | Couverture | Fraîcheur | Qualité | Accès | Licence |
|---|---|---|---|---|---|---|---|---|
| Plan d'exposition au bruit (PEB) des aérodromes | DGAC | data.geopf.fr/wms-v couche dgac_peb_plan_wmsv ; arrêtés : WFS dgac_peb_arrete_wfs | Réglementation (servitude d'urbanisme fondée sur des prévisions de trafic) | 224 aérodromes dotés d'un PEB ; 3,0 % des logements tirés en zone, 1,5 % en A/B/C | Métadonnées 16/12/2025 ; arrêtés anciens possibles (Roissy 2007, Orly 2012) | Zonage net ; bords proches : la zone change à 25-50 m dans 1-3 directions sur 8 | WMS GetFeatureInfo, sans clé | À confirmer auprès de la DGAC (jeux PEB des DDT en Licence Ouverte 2.0) |
| Plan de gêne sonore (PGS) | DGAC | data.geopf.fr/wms-v couche dgac_pgs_plan_wmsv | Réglementation (zones d'aide à l'insonorisation) | Grands aéroports seulement | Selon arrêtés (Roissy 2013, MAJ 2018) | Idem PEB | WMS, sans clé | À confirmer (DGAC) |
| Cartes de bruit stratégiques (Lden, Ln) | DDT et agglomérations (Cerema) | data.gouv.fr par département ; Géoplateforme : Ardennes seulement | Modélisation | Fragmentée ; aucun agrégat national | 4e échéance 2022-2024 | Bonne localement | ~100 jeux départementaux + agglomérations | Licence Ouverte (jeux DDT) |
| Zonage informatif des obligations légales de débroussaillement (OLD) | IGN pour le ministère de l'Agriculture | data.geopf.fr/wfs DEBROUSSAILLEMENT:debroussaillement (zonage=2) | Réglementation (zonage informatif ; l'arrêté fait foi) | 45 départements ; 10,0 % des logements tirés | Fiche data.gouv 08/09/2026 ; arrêtés jusqu'à 10/2025 ; données sources 2008-2023 | Zone diffusée nette ; secteurs hachurés non distingués par attribut | WFS (EPSG:2154), sans clé | Licence Ouverte 2.0 |
| Feux de forêt observés (BDIFF) | Ministère de l'Agriculture, IGN | bdiff.agriculture.gouv.fr (export CSV par recherche) | Observation (déclarations SDIS) | Depuis 2006 ; 9 675 communes avec ≥ 1 feu ; 20,8 % de la population dans une commune avec un feu > 1 ha | Annuel (2025 publié) | Surfaces estimées à 93 % ; cause renseignée à 51 % ; définitions changées en 2023 | Formulaire GET + session ; chaîne TLS incomplète (Node échoue) ; Marseille en 13055 | CONTRADICTOIRE : lov2 sur data.gouv, usage commercial exclu dans les mentions légales de l'export |
| Sensibilité aux remontées de nappe | BRGM (Géorisques) | mapsref.brgm.fr/wxs/georisques/risques, WFS ms:REMNAPPE | Modélisation (sensibilité) | Métropole seulement ; 60 % des logements tirés « sujets », 39 % en fiabilité moyenne ou forte | Carte nationale (non datée dans le service) | Fiabilité faible fréquente ; règle Géorisques : faible = « risque inconnu » (25/25) | WFS (WMS inutilisable au point), sans clé | Licence Ouverte (Géorisques) |
| Piézométrie (niveaux de nappe) | BRGM, Hub'Eau | hubeau.eaufrance.fr/api/v1/niveaux_nappes | Observation | Stations actives souvent à plus de 5 km (médiane 5,0 km) ; 9 points sur 45 sans station active à 13 km | Quotidienne pour les stations actives | Nappe mesurée ≠ nappe sous la maison | API, sans clé | Licence Ouverte |
| Rapport de risques Géorisques au point (champ remonteeNappe) | Géorisques | georisques.gouv.fr/api/v1/resultats_rapport_risque | Synthèse de couches | Nationale | Continue | Libellés sans classe ni fiabilité | API instable : 26/45 réponses, médiane 3,3 s | Licence Ouverte |
| Registre officiel des émissions polluantes (IREP 2024, détail par polluant) | Ministère de la Transition écologique (Géorisques) | files.georisques.fr/irep/2024.zip | Déclaration (exploitants) | 13 507 établissements ; 2 186 avec un rejet dans l'air chiffré | Annuel (2024 publié le 16/09/2026) | 89 % des lignes « < seuil » ; CO₂ et NH₃ dominent ; 984 coordonnées partagées | Fichiers CSV annuels | Licence Ouverte |
| Extrait IREP ADEME (data_risk_IREP) | ADEME (dérivé Géorisques) | data.ademe.fr dataset 085ipnlpj9awm78hikh1nakj | Déclaration (extrait) | 1 495 établissements | 2019 | Incomplet (×9 sous le registre) | API data-fair | Non précisée |
| Protections fortes (Natura 2000 SIC/ZPS, parc national, RNN/RNR, APB, réserves biologiques) | MNHN / OFB (Patrinat) | data.geopf.fr/wfs patrinat_* | Réglementation | Logements tirés : Natura 0 %, parc national 0 % | Variable (modifications 2008-2023) | Précision variable (1:25 000 à 1:100 000) | WFS (EPSG:3857 !), sans clé | Licence Ouverte (INPN) |
| Parc naturel régional (PNR) | Fédération des PNR (Patrinat) | patrinat_pnr:pnr | Contractuel (charte) | 8 % des logements tirés | Stable | Bonne | WFS | Licence Ouverte |
| ZNIEFF 1 et 2 | MNHN (INPN) | patrinat_znieff1/2 | Inventaire (aucune protection) | 3 % des logements tirés | Variable | Bonne | WFS | Licence Ouverte |
| Réseaux de chaleur (éligibilité, PDP) | France Chaleur Urbaine (MTE) | france-chaleur-urbaine.beta.gouv.fr/api/v1/eligibility | Déclaration des gestionnaires + règle de distance | 21,5 % des logements tirés « éligibles », 11 % en PDP | Continue | Seuils « volontairement élevés » (100 m Paris, 200 m ailleurs) | API, sans clé, OpenAPI publié | Licence Ouverte |
| Lignes électriques aériennes HTB | IGN (BD TOPO, source RTE) | data.geopf.fr/wfs BDTOPO_V3:ligne_electrique | Observation (référentiel) | 14 497 lignes de transport ; 1 % des logements à < 100 m | BD TOPO continue (RTE 2024) | Précision 2,5 m ; distribution Enedis absente | WFS, sans clé | Licence Ouverte |
| Servitude I4 (lignes électriques, GPU) | Gestionnaires de réseau (GPU) | apicarto.ign.fr/api/gpu assiette-sup | Réglementation | Variable selon versement | Variable | Versement incomplet | API Carto | Licence Ouverte |
| Antennes radioélectriques (ANFR) | ANFR | data.gouv.fr (fichiers mensuels) ; data.anfr.fr en maintenance (503) le 27/10 | Déclaration | Nationale | Mensuelle (10/2026) | Bonne | Fichiers 66 Mo | Licence Ouverte |
| Mesures d'exposition aux ondes (ANFR) | ANFR | data.gouv.fr (mesures ponctuelles, sondes) | Observation | Très partielle | Variable | Mesures ponctuelles | Fichiers | Licence Ouverte |
| Production photovoltaïque estimée (PVGIS) | Commission européenne (JRC) | re.jrc.ec.europa.eu/api/v5_3/PVcalc | Modélisation (SARAH-3) | Mondiale, outre-mer compris | Base 2005-2023 | Bonne en ordre de grandeur | API, sans clé ; 0,9 s médiane, 4 s max | Libre réutilisation (JRC) |
| Potentiel solaire du bâti (méthode simplifiée) | Cerema / IGN | data.geopf.fr/wfs POTENTIEL.SOLAIRE.BATIMENT:bati | Modélisation simplifiée | 49 053 505 bâtiments | Mise à jour 2024 | Sans ombrage fin ; rattachement ambigu au point BAN (2 à 4 bâtiments à 15 m) | WFS (EPSG:2154) | Licence Ouverte |
| Fibre et technologies à l'adresse (Ma connexion internet) | ARCEP | data.arcep.fr/fixe/maconnexioninternet (base immeubles, éligibilité) | Déclaration des opérateurs | Nationale | Trimestrielle (T2 2026) | Éligibilité ≠ débit réel | Fichiers nationaux (centaines de Mo), pas d'API | Licence Ouverte 2.0 |
| Couverture mobile théorique | ARCEP | data.arcep.fr/mobile | Modélisation des opérateurs | Nationale | Trimestrielle | Couverture ≠ qualité intérieure | Fichiers lourds | Licence Ouverte |
| Bornes de recharge (IRVE) | Etalab (consolidation transport.data.gouv) | data.geopf.fr/wfs irve_geojson_30-09-2026_wfs:irve | Déclaration | 222 018 points de charge | 30/09/2026 | Hétérogène | WFS | Licence Ouverte |
| Prix et qualité du service de l'eau (SISPEA) | OFB | data.ofb.fr (extractions annuelles, 2024) | Déclaration des services | Nationale (déclarations incomplètes) | Annuel | Hétérogène | Fichiers 7z | Licence Ouverte |
| AZI / EAIP | DGPR (Géorisques) | API gaspar/azi (commune) ; WMS EAIP | Modélisation enveloppe | Nationale | Ancienne (AZI 1999-2015) | Enveloppe large | API / WMS | Licence Ouverte |
| Annuaire de l'éducation | Ministère de l'Éducation nationale | data.education.gouv.fr fr-en-annuaire-education | Référentiel | Nationale | Quotidienne (25/10/2026) | Bonne | API, sans clé | Licence Ouverte |
| IPS, IVAL, IVAC | Ministère de l'Éducation nationale | data.education.gouv.fr | Indicateur social / valeur ajoutée | Nationale | 2023+ (01/09/2026) | Robuste mais lu comme classement | API | Licence Ouverte / non précisée |
| Délinquance enregistrée (SSMSI) | Ministère de l'Intérieur | data.gouv.fr base communale 2016-2025 | Enregistrement administratif | 48 % des couples commune × indicateur non diffusés en 2025 | Annuel (09/07/2026) | Biais de plainte, taux rapportés aux résidents | Fichiers | Licence Ouverte 2.0 |
| Fiscalité locale (taux votés) | DGFiP | data.economie.gouv.fr fiscalite-locale-des-particuliers | Réglementation (taux) | Nationale | Annuel (21/05/2026) | Le taux sans la base ne donne pas le montant | API | Licence Ouverte |
| Zones climatiques locales (LCZ) | Cerema | data.gouv.fr (93 territoires) ; Géoplateforme : Toulouse seulement | Classification satellitaire | 93 territoires > 50 000 hab. | 2022 (publié 07/2026) | Bonne | Fichiers ; WMS partiel | Licence Ouverte 2.0 |
| Pollution lumineuse | Collectivités (pas de national) | Jeux régionaux (Grand Paris, Occitanie 2019) | Modélisation / mesure satellitaire | Régionale | Hétérogène | — | — | Variable |
| Accidents industriels (ARIA) | BARPI (MTE) | aria.developpement-durable.gouv.fr | Observation | Nationale | Continue | Hétérogène | Recherche web | Non vérifiée |

## 2.3 Valeur pour la décision

| Donnée candidate | Nouveauté | Question acheteur | Effet décisionnel | Incertitude actionnable | UX |
|---|---|---|---|---|---|
| Plan d'exposition au bruit (PEB) des aérodromes | Fait réglementaire au bon grain, absent du produit | Mon futur logement est-il dans une zone de bruit aérien, avec quelles conséquences ? | Pièce exigible (art. L112-11), constructibilité d'une extension (L112-10), aide à l'insonorisation (PGS) | Demander l'état des nuisances sonores aériennes ; visiter aux heures de passage | Logement / Autour : ligne « Zone B du PEB d'Orly (2012) » + à vérifier |
| Plan de gêne sonore (PGS) | Une aide financière possible | Puis-je être aidé pour isoler du bruit ? | Ouvre une démarche d'aide | Se renseigner auprès de l'exploitant de l'aéroport | Sous-ligne du PEB |
| Cartes de bruit stratégiques (Lden, Ln) | Niveau sonore modélisé à la façade | Mon logement est-il exposé au bruit routier ou ferré ? | Fort si disponible | Visite à heures de pointe | — |
| Zonage informatif des obligations légales de débroussaillement (OLD) | Obligation légale à l'adresse | Devrai-je débroussailler, combien, chez qui ? | Charge annuelle, information obligatoire du vendeur (annonce, ERP), arbitrage lisière/bourg | Profondeur fixée par l'arrêté, coût, voisins | Logement : « Terrain soumis à l'obligation de débroussailler » + à vérifier |
| Feux de forêt observés (BDIFF) | Mémoire observée ; nuance la projection (1 198 communes à danger bas avec un feu > 1 ha) | Cette commune a-t-elle déjà brûlé ? | Modéré : contexte communal, jamais adresse | Aucune directe | Territoire : « 93 feux depuis 2006, le plus étendu en 2022 (5 709 ha) » |
| Sensibilité aux remontées de nappe | Sensibilité de secteur | Ma cave ou mon sous-sol peuvent-ils être inondés par la nappe ? | Seulement si cave ou sous-sol | Questions au vendeur et aux voisins | Logement conditionnel : affiché si cave/sous-sol déclaré et fiabilité ≥ moyenne |
| Piézométrie (niveaux de nappe) | Niveau observé régional | La nappe est-elle haute cette année ? | Faible à l'adresse | — | — |
| Rapport de risques Géorisques au point (champ remonteeNappe) | Règle de lecture officielle (fiabilité) | — | — | — | Référence de contrôle seulement |
| Registre officiel des émissions polluantes (IREP 2024, détail par polluant) | Nature des rejets d'un site déjà signalé | Que rejette l'usine voisine ? | Faible : rejets déclarés ≠ exposition | — | Au mieux une précision sur un site déjà affiché |
| Extrait IREP ADEME (data_risk_IREP) | — | — | — | — | — |
| Protections fortes (Natura 2000 SIC/ZPS, parc national, RNN/RNR, APB, réserves biologiques) | Statut juridique | Ce terrain est-il protégé ? Y a-t-il un site naturel majeur à côté ? | Pour terrain/travaux : évaluation d'incidences, règles de cœur de parc ; logement : cadre de vie | Service urbanisme, charte | Autour : « Site Natura 2000 à 400 m » ; Logement : seulement si parcelle significativement incluse |
| Parc naturel régional (PNR) | Identité territoriale | Suis-je dans un parc ? | Faible (charte peu contraignante pour un particulier) | — | Territoire : signature « dans le PNR du Verdon » |
| ZNIEFF 1 et 2 | Richesse naturelle inventoriée | — | Très faible | — | — |
| Réseaux de chaleur (éligibilité, PDP) | Option de chauffage, obligation de raccordement (PDP) | Puis-je me chauffer par un réseau ? L'immeuble y est-il obligé ? | Plan de rénovation, question au syndic | Gestionnaire du réseau, syndic | Logement : « Réseau de chaleur à 72 m (80 % EnR&R) » |
| Lignes électriques aériennes HTB | Infrastructure visible | Y a-t-il une ligne à haute tension près de la maison ? | Paysage, vente ; sanitaire non concluant | Visite | Autour au mieux : fait de paysage, sans mot sanitaire |
| Servitude I4 (lignes électriques, GPU) | Contrainte de construction sous la ligne | — | Pour un terrain | — | Avec FUT-81 |
| Antennes radioélectriques (ANFR) | Présence | Y a-t-il une antenne près de chez moi ? | Aucun établi | — | — |
| Mesures d'exposition aux ondes (ANFR) | — | — | — | — | — |
| Production photovoltaïque estimée (PVGIS) | kWh par kWc au point | Des panneaux seraient-ils rentables ici ? | Pour un Projet solaire | Étude d'installateur | Logement conditionnel au Projet |
| Potentiel solaire du bâti (méthode simplifiée) | Potentiel du toit | — | Faible sans rattachement sûr | — | Après lien RNB ↔ BD TOPO (FUT-80) |
| Fibre et technologies à l'adresse (Ma connexion internet) | Raccordabilité déclarée | Pourrai-je télétravailler ? | Pour un Projet télétravail rural | Test d'éligibilité opérateur | Logement conditionnel au Projet |
| Couverture mobile théorique | — | Aurai-je du réseau ? | Faible | Test sur place | — |
| Bornes de recharge (IRVE) | Présence de bornes | Puis-je recharger une voiture électrique près de chez moi ? | Faible | — | — |
| Prix et qualité du service de l'eau (SISPEA) | Coût de l'eau | Combien paierai-je l'eau ? | Faible (budget) | — | — |
| AZI / EAIP | Peu | — | Faible | — | — |
| Annuaire de l'éducation | Secteur public/privé, type | Quelles écoles près de chez moi ? | Faible (BPE suffit) | — | — |
| IPS, IVAL, IVAC | — | Quelle école est « bonne » ? | — | — | — |
| Délinquance enregistrée (SSMSI) | — | Le quartier est-il sûr ? | — | — | — |
| Fiscalité locale (taux votés) | — | Combien de taxe foncière paierai-je ? | — | Avis de taxe foncière du vendeur | — |
| Zones climatiques locales (LCZ) | Morphologie du quartier | Mon quartier retient-il la chaleur ? | Faible en plus de l'ICU | — | — |
| Pollution lumineuse | — | Verrai-je les étoiles ? | Très faible | — | — |
| Accidents industriels (ARIA) | Mémoire d'accidents | — | Faible | — | — |

## 2.4 Coût, maintenance, performance, fiabilité

| Donnée candidate | Coût initial | Maintenance | Performance | Fiabilité |
|---|---|---|---|---|
| Plan d'exposition au bruit (PEB) des aérodromes | Faible (1 appel, 1 règle, 1 bloc) | Faible (couche nationale maintenue par la DGAC) | Médiane 43-90 ms | Faible si « zone réglementaire » ; élevé si traduit en « bruyant » |
| Plan de gêne sonore (PGS) | Nul si fait avec le PEB | Faible | Médiane 45 ms | Faible |
| Cartes de bruit stratégiques (Lden, Ln) | Très élevé (collecte, fusion, échéances) | Élevée (tous les 5 ans, autorités multiples) | — | Moyen (modèle, façade non précisée) |
| Zonage informatif des obligations légales de débroussaillement (OLD) | Faible | Faible (base nationale IGN) | Médiane 42 ms | Faible si « selon le zonage publié » ; élevé si absence = « non concerné » hors des 45 départements |
| Feux de forêt observés (BDIFF) | Moyen (import annuel, table PLM) | Moyenne (annuelle, certificat, licence) | Hors ligne | Élevé si lu à l'adresse ou si « aucun feu » sans couverture |
| Sensibilité aux remontées de nappe | Moyen (WFS + règle + condition Projet) | Faible | Médiane 346-417 ms ; pointe à 27 s | Élevé sans la règle de fiabilité et sans condition |
| Piézométrie (niveaux de nappe) | Moyen | Moyenne | Médiane 104 ms | Élevé si attribué à l'adresse |
| Rapport de risques Géorisques au point (champ remonteeNappe) | — | — | Lente, instable | — |
| Registre officiel des émissions polluantes (IREP 2024, détail par polluant) | Moyen (import annuel) | Faible | Hors ligne | Élevé (masses non comparables, « pollution » non mesurée) |
| Extrait IREP ADEME (data_risk_IREP) | — | — | — | Élevé : phrase de vide fausse |
| Protections fortes (Natura 2000 SIC/ZPS, parc national, RNN/RNR, APB, réserves biologiques) | Moyen (12 couches, seuils) | Faible | 39 ms par couche | Élevé si intersection marginale lue « terrain protégé » |
| Parc naturel régional (PNR) | Faible | Faible | 39 ms | Faible |
| ZNIEFF 1 et 2 | — | — | — | Élevé si lu comme protection |
| Réseaux de chaleur (éligibilité, PDP) | Faible | Faible | Médiane 28-65 ms | Moyen si « raccordable » |
| Lignes électriques aériennes HTB | Faible | Faible | 40 ms | Élevé si vocabulaire sanitaire |
| Servitude I4 (lignes électriques, GPU) | Faible | Faible | — | Faible |
| Antennes radioélectriques (ANFR) | Moyen | Moyenne | Hors ligne | Très élevé (présence lue comme exposition) |
| Mesures d'exposition aux ondes (ANFR) | — | — | — | Élevé |
| Production photovoltaïque estimée (PVGIS) | Faible | Faible | Lente (différée) | Moyen si présenté comme production du toit |
| Potentiel solaire du bâti (méthode simplifiée) | Moyen | Faible | 63 ms | Élevé si « votre toit produira » |
| Fibre et technologies à l'adresse (Ma connexion internet) | Élevé (import, index trimestriel) | Élevée | Hors ligne | Moyen |
| Couverture mobile théorique | Élevé | Élevée | — | Moyen |
| Bornes de recharge (IRVE) | Faible | Moyenne | — | Faible |
| Prix et qualité du service de l'eau (SISPEA) | Moyen | Moyenne | Hors ligne | Faible |
| AZI / EAIP | — | — | — | Élevé (enveloppe ≠ aléa) |
| Annuaire de l'éducation | Faible | Faible | — | Faible |
| IPS, IVAL, IVAC | — | — | — | Très élevé (évitement scolaire, ségrégation) |
| Délinquance enregistrée (SSMSI) | — | — | — | Très élevé (stigmatisation, grain) |
| Fiscalité locale (taux votés) | — | — | — | Élevé (taux lu comme montant) |
| Zones climatiques locales (LCZ) | Moyen | Faible | — | Moyen |
| Pollution lumineuse | — | — | — | — |
| Accidents industriels (ARIA) | — | — | — | Élevé |
