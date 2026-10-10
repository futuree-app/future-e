# Benchmark données : rétro-ingénierie des concurrents face à futur•e

Établi le 10 octobre 2026. Objet : **identifier les données réellement branchées par les concurrents, leur source, leur grain et leur fraîcheur, puis les confronter à l'état réel du repo futur•e**. Ce document n'est pas un benchmark de fonctionnalités ni une liste de choses à copier.

Sources principales : registres de sources, méthodologies, API publiques et fiches data.gouv.fr des services étudiés ; pour Où Vivre, configuration publique de la carte ; pour futur•e, branche main du dépôt (DATA_SOURCES.md, SOURCES_MODULES_MATRIX.md, src/lib, scripts, audits).

## Méthode

Statuts :
- **✅ déjà branché** : même source ou information équivalente active dans futur•e ;
- **🟡 partiel / autre grain** : futur•e couvre le thème mais pas la même donnée, la même finesse ou la même exploitation ;
- **❌ vrai trou** : source ou famille de données effectivement exploitée par le concurrent et non branchée dans futur•e ;
- **⚪ dérivé** : calcul, score ou présentation construite à partir de données que futur•e possède déjà ; ce n'est pas un nouveau branchement ;
- **? non vérifiable** : la fonctionnalité est visible, mais le concurrent ne publie pas assez d'information pour attribuer proprement un dataset.

Règle : **une source probable n'est jamais présentée comme confirmée**. Les mots « 1 745 indicateurs », « 120 indicateurs » ou « 50+ sources » ne sont pas assimilés à autant de jeux de données indépendants.

## Résultat transversal

La matière commune est déjà très commoditisée : **BAN + cadastre + DPE + DVF + Géorisques + CatNat + services + loyers + permis** reviennent partout. Les écarts techniques récurrents les plus nets face à futur•e sont plutôt : **identité bâtiment RNB/BDNB, PLU complet, copropriété RNIC, bruit réglementaire, nappes, fibre/mobile, lignes électriques**, puis quelques spécialisations comme le solaire de toiture.

## 1. Où Vivre (ou-vivre.fr, Altermap)

### Ce que révèle la configuration

- 119 couches distinctes réparties en 8 thèmes, dont 44 réservées au premium (attribut `secure="premium"`). Le chiffre public « 140+ / 150+ critères » compte les sous-indicateurs des cartes de synthèse.
- Serveur cartographique GeoServer propre (espaces `ouvivre` et `ouvivre_premium`), fond OSM servi par Agaric-IG, géocodage par la BAN.
- Grain : carte de France en rasters et en polygones communaux. Aucune donnée au bâtiment ni au logement. L'outil « Se projeter » calcule des isochrones depuis une adresse, sans lecture du bien.
- Climat projeté : un seul modèle, ALADIN63 / CNRM-CM5, niveau de réchauffement GWL30 (TRACC 2023), horizon 2100. Mise à jour le 16 juin 2025.
- Qualité de l'air : Ineris, moyenne 2017-2021, mise à jour en décembre 2024.

### Couverture comparée

| Thème | Où Vivre | futur•e |
|---|---|---|
| Projections climat | 5 indicateurs, 1 modèle, GWL30 à 2100 | 28 indicateurs, médiane de 17 modèles, 3 niveaux (GWL 1,5 / 2 / 3) |
| Climat observé | Typologie des 8 climats, jours > 30 °C, jours < -5 °C, pluie janvier/juillet, vent | ERA5-Land (réchauffement observé depuis 1961-1990), douceur hivernale, rayonnement solaire |
| Air | PM2.5, PM10, NO2, O3 (Ineris), trafic routier TMJA | PM2.5 et NO2 de fond (ADEME), indices ATMO quotidiens, pollens |
| Eau potable | Part d'analyses non conformes, restrictions de consommation | Hub'Eau qualité eau potable, Vigieau restrictions |
| Eaux naturelles | État écologique des rivières, baignade (UE et labelleplage) | Baignade (ministère de la Santé), Hub'Eau hydrologie |
| Sols | BASOL (premium) | SSP Géorisques, Cartofriches, cadmium GISSOL |
| Pesticides | IFT 2020-2022 (premium) | IFT croisé avec la part de SAU |
| Industrie | IREP détaillé par polluant (NOx, SOx, COVNM, NH3, HAP), élevages > 10 t d'ammoniac, accidents ARIA, éloignement des sites sensibles | IREP (nombre de polluants), ICPE 137 000 sites |
| Inondation | AZI, PPRi, EAIP cours d'eau et submersion | Géorisques au point et à la parcelle, zonage PPRN, ONRN coût des sinistres |
| Autres risques | CatNat, séisme, mouvements de terrain, incendies BDIFF depuis 2006, radon, argiles | CatNat avec chronologie, séisme, mouvements de terrain, PPRIF, radon, RGA à la parcelle |
| Littoral | Submersion (EAIP) | Trait de côte Cerema, submersion modélisée sur rivage 5 m |
| Chaleur urbaine | Absent | ICU CSTB |
| Santé vectorielle | Absent | Moustique tigre |
| Nuisances | Éoliennes, lignes électriques aériennes, pollution lumineuse, PEB aéroports | Proximité cumulée autoroutes, rail, aéroports (OSM) |
| Nature | Parcs nationaux, réserves, APB, PNR, Natura 2000, RAMSAR, conservatoires, CartNat, vue sur mer, Corine Land Cover, forêts publiques | OSO 2023 (CESBIO), espaces verts OSM |
| Emploi | BMO 2024, taux d'emploi, QPV/ZFU, ZRR | Emploi par zone d'emploi, France Travail |
| Services | BPE, isochrones 15 min (médecins, écoles, commerces, France Services, police, gares) | BPE, APL médecins, centralité, isochrones, gares SNCF et fréquentation |
| Éducation | IPS et IVA collèges et lycées (premium) | Non intégré (sondé) |
| Télécoms | Débit internet, couverture 4G | Non intégré (sondé) |
| Mobilité | ZFE, covoiturage, arrêts de bus, prix du gazole, abonnement transports | ZFE, arrêts OSM, dépendance automobile |
| Société | Densité et revenus carroyés, langues régionales, régions naturelles, présidentielle 2022, européennes 2024, maires 2020 | Démographie INSEE, revenu médian, étudiants, vie associative (RNA) |
| Sécurité | Délinquance SSMSI, cambriolages, accidents BAAC | Non intégré (sondé pour SSMSI) |
| Fiscalité | Taxes foncières, TH, TEOM, zonage ABC, TLV | Absent |
| Marché | DVF prix moyen, loyers maisons et appartements, HLM | DVF médian, carte des loyers, HLM, vacance, résidences secondaires |
| Urbanisme | Zones U et AU des PLU | Servitudes GPU (patrimoine), Sitadel permis autour de l'adresse |
| Logement | Absent | DPE à l'adresse (avant et après 2021), audits énergétiques, cadastre, altitude NGF, RGE, coûts de travaux |

### Lecture

- Où Vivre est plus large sur la nature réglementaire, la sociologie (élections, langues), la sécurité, la fiscalité et l'éducation.
- futur•e est plus profond sur le climat (17 modèles contre 1), l'adresse et le bâtiment, et sur plusieurs signaux santé absents chez eux (ICU, cadmium, pollens, moustique tigre, restrictions d'eau, sinistralité).
- Le premium Où Vivre (20 € par mois) se vend surtout sur des couches de confort (fiscalité, IPS, loyers, isochrones) et sur la précision des risques (AZI, PPRi, BASOL, IFT).

### Ajouts candidats pour futur•e, par effort

Faible effort, source déjà branchée :
- IREP par polluant et filtre élevages > 10 t NH3 (même dataset que `irep.ts`).
- Feux observés BDIFF (en plus du PPRIF).

Effort moyen, source publique documentée :
- Protections naturelles (Natura 2000, parcs, réserves, APB) : WFS INPN ou API Carto nature.
- Lignes électriques aériennes et pylônes : servitude I4 du GPU, déjà explorée dans `scripts/research/gpu-servitudes-adresse.mjs`.
- PEB des aérodromes : Géoportail de l'urbanisme.
- AZI et EAIP : Géorisques.
- IPS et IVA des établissements : data.education.gouv.fr, déjà sondé.
- Couverture fibre ARCEP, déjà sondée.

À arbitrer avec la ligne éditoriale :
- Délinquance SSMSI et résultats électoraux. Données demandées par les ménages, mais sensibles et éloignées de la doctrine de preuve sur l'exposition physique.

## 2. ClimaScore (climascore.fr)

ClimaScore est aujourd'hui le concurrent le plus proche du Dossier Adresse par la combinaison adresse/parcelle + bâtiment + risques + marché + climat futur. Sa documentation publique est devenue beaucoup plus précise depuis le premier relevé.

| Donnée | Source / branchement confirmé | Grain annoncé | futur•e | Verdict |
|---|---|---|---|---|
| Projections climat | Climadiag Commune / TRACC, min-moyenne-max d'un ensemble de modèles ; DRIAS 2020 RCP 4.5 / 8.5 pour séries journalières | commune / maille climat | DRIAS, médiane 17 modèles, GWL 1,5/2/3 | ✅ même famille |
| Bâtiments | BDNB CSTB, 32 M bâtiments | bâtiment | non actif ; audit seulement | ❌ **vrai trou majeur** |
| DPE | ADEME, réel ou parfois prédit via référentiel bâtiment | logement / bâtiment | ADEME DPE réel, attribution stricte | ✅ réel ; ⚪ le « prédit » est un dérivé |
| Transactions | DVF+ Cerema | parcelle / voisinage | DVF utilisé | ✅ famille commune ; 🟡 profondeur différente |
| RGA | carte BRGM 2026 en polygones | polygone / point | API Géorisques RGA au point/parcelle | ✅ équivalent |
| Remontées de nappe | carte BRGM 2026 GeoPackage | polygone | pas de couche adresse équivalente active | ❌ |
| Piézométrie | Hub'Eau / BRGM, ~2 400 piézomètres temps réel | station / nearest | Hub'Eau hydrologie, pas de piézométrie active | ❌ |
| Cours d'eau | Sandre / IGN + Hub'Eau hauteur/débit | tronçon / station | Hub'Eau présent | 🟡 autre exploitation |
| Relief | RGE ALTI 1 m lu au point / profil terrain | point / raster | altitude IGN NGF au point | 🟡 écart = profil terrain |
| Feux observés | Prométhée / BDIFF | commune × année | BDIFF seulement roadmap | ❌ |
| CatNat | registre national / GASPAR-CCR | commune | GASPAR actif et chronologie | ✅ |
| PPR / autres risques | Géorisques | zonage / point | Géorisques point/parcelle | ✅ |
| Air | ATMO | commune / station / indice | ATMO actif | ✅ |
| Revenus | Filosofi carroyé 200 m | carreau / quartier | revenu médian commune/IRIS | 🟡 finesse |
| Équipements | INSEE | commune / points | BPE actif | ✅ |
| Copropriété | informations issues du référentiel bâtiment / recensements publics | bâtiment / copropriété | non active | ❌ / source précise à distinguer de RNIC |

### Correction du benchmark initial

L'ancienne phrase « nombre de modèles inconnu / méthode climatique non précisée » est désormais fausse. La méthodologie actuelle indique explicitement **Climadiag/TRACC avec minimum, moyenne et maximum d'un ensemble de modèles**, complété par DRIAS RCP 4.5 et 8.5. En revanche, le nombre exact de modèles et les pondérations propriétaires des cinq axes ne sont pas publiés.

Les **1 745 indicateurs** ne doivent pas être lus comme 1 745 sources ou 1 745 faits indépendants utiles : ClimaScore annonce un peu plus de vingt sources publiques, puis produit de nombreux champs, dérivés, agrégats et scores.

Sources :
- https://climascore.fr/methodologie
- https://climascore.fr/professionnels
- https://climascore.fr/

---

## 3. Domky (domky.fr)

Domky est le concurrent qui a branché la **stack ouverte la plus large et la mieux documentée** parmi ceux audités. Son registre public liste plus de cinquante jeux ou services et donne producteur, licence et usage.

| Famille | Sources Domky confirmées | futur•e | Verdict |
|---|---|---|---|
| Équipements / services | INSEE BPE, accès aux équipements | BPE + isochrones | ✅ |
| Revenus / démographie | Filosofi, populations, recensement, IRIS, UU, bassins de vie | INSEE/ADEME commune-IRIS | ✅ / 🟡 |
| Entreprises / économie | SIRENE, France Travail | France Travail partiel / scripts | 🟡 |
| Transactions | DVF+ Cerema, indices Notaires-INSEE | DVF | 🟡 indices Notaires-INSEE non actifs |
| Loyers | ANIL carte des loyers | carte des loyers | ✅ |
| Fiscalité / coût | DGFiP comptes collectivités, zonage TLV, taux BCE | non intégré comme coût résidentiel | ❌ |
| DPE | ADEME V2/neuf/ancien | actif | ✅ |
| Bâtiment | BDNB dans l'estimateur : année, hauteur, logements, matériaux | pas actif | ❌ majeur |
| Cadastre | cadastre Etalab | actif | ✅ |
| Urbanisme | GPU PLU/PLUi/SCoT/SUP | seulement servitudes patrimoniales + Sitadel | ❌ PLU complet |
| Permis | Sitadel2 + permis géolocalisés | Sitadel adresse / voisinage | ✅ |
| Risques | Géorisques, érosion côtière, VigiEau | actif | ✅ |
| Eau potable | Hub'Eau / SISPEA : qualité et prix/service | qualité Hub'Eau, pas prix/service SISPEA | 🟡 / ❌ SISPEA |
| Nappes | Hub'Eau piézométrie / ADES | non actif | ❌ |
| Air | ATMO + Géod'Air par polluant | ATMO + fond ADEME | 🟡 |
| Éoliennes | RTE / ODRE | non | ❌ |
| Nature protégée | INPN Natura 2000 + ZNIEFF | OSO caractère naturel ; pas couche protégée nationale | ❌ |
| Occupation des sols | CORINE Land Cover | OSO 2023 10 m | ✅ futur•e plus fin |
| Climat observé | ERA5 | ERA5-Land tendance active | ✅ |
| Climat futur | CMIP6 CNRM-CM6-1-HR SSP2-4.5/SSP5-8.5 + DRIAS | DRIAS multi-modèles/GWL | ✅ famille différente |
| Santé | FINESS, Ameli LOV2 | APL médecins, FINESS partiel | 🟡 |
| Solaire toiture | IGN LiDAR HD + BD TOPO + SARAH-3 + PVGIS | rayonnement communal, pas toiture | ❌ stack spécifique forte |
| Éducation | annuaire + brevet/bac + IPS/IVAL/IVAC | BPE écoles, pas performance/IPS | ❌ si retenu éditorialement |
| Sécurité | SSMSI | sondé, non intégré | ❌ |
| Civique | RNE + résultats électoraux | non | ❌, probablement hors doctrine |
| Mobilité | SNCF + transport.data.gouv GTFS | SNCF + OSM / isochrones | ✅ / 🟡 |
| Antennes | ANFR | non | ❌ |
| Bruit | DREAL / cartes de bruit stratégiques Lden/Ln, routes/rail BD TOPO | signal calme OSM, pas CBS réglementaires | ❌ |
| Connectivité | ARCEP fibre/mobile | sondé, non actif | ❌ |

Leur potentiel solaire n'est pas un simple « indicateur solaire » : il combine géométrie de toiture LiDAR/BD TOPO, pente/orientation/ombrage, SARAH-3 et PVGIS. C'est un vrai branchement absent, mais spécialisé.

Sources :
- https://domky.fr/sources
- https://domky.fr/methodologie/estimation
- https://domky.fr/

---

## 4. Avertine

| Donnée | Source confirmée | Grain | futur•e | Verdict |
|---|---|---|---|---|
| Prix signés | DVF | voisinage / parcelle | DVF | ✅ |
| Risques terrain | Géorisques | adresse / zonage | actif | ✅ |
| Urbanisme | GPU | parcelle | servitudes seulement | ❌ PLU complet |
| Permis | Sitadel | voisin / adresse | actif | ✅ |
| DPE | ADEME | adresse / logement | actif | ✅ |
| Copropriété | **RNIC : lots, charges, procédures** | copropriété | non actif | ❌ **vrai trou très pertinent achat** |
| Bâtiment | RNB associé à la réutilisation | bâtiment | audit RNB seulement | ❌ / non actif |
| Eau | contrôle sanitaire | réseau / commune | Hub'Eau | ✅ |
| Fibre | ARCEP | adresse / immeuble | non actif | ❌ |
| Lignes électriques | source publique non nommée dans la description | proximité | non | ❌ |
| Écoles | Annuaire de l'éducation | points | BPE | 🟡 |
| Population / logement | INSEE | commune | actif | ✅ |
| Vue aérienne 1950-1965 | IGN historique, source implicite | parcelle | non | ❌ unique, faible priorité data |

Le **RNIC** est ici un écart particulièrement clair : ce n'est pas une réinterprétation de la BDNB, mais un registre distinct avec information de copropriété utile avant achat.

Source :
- https://www.data.gouv.fr/reuses/rapport-dinformation-avant-achat-immobilier-avertine

---

## 5. Parcelle Info

La page « Sources et licences » est générée depuis le registre des connecteurs. Ces branchements peuvent donc être considérés comme **confirmés dans le code**.

| Bloc | Source confirmée | Maille déclarée | futur•e | Verdict |
|---|---|---|---|---|
| Urbanisme | GPU API Carto | point/parcelle | servitudes patrimoniales | ❌ zonage/prescriptions complets |
| Risques | Géorisques | commune + point/polygone | actif | ✅ |
| DPE | ADEME | adresse | actif | ✅ |
| Bâti | BDNB open 2026-02a | bâtiment/groupe | non actif | ❌ |
| Réseau chaleur | France Chaleur Urbaine | nearest/réseau | non | ❌ |
| Eau | Hub'Eau SISE-Eaux | UDI/commune | actif | ✅ |
| Restrictions eau | VigiEau | zone/commune | actif | ✅ |
| Fibre | ARCEP Ma connexion internet | immeuble le plus proche | non actif | ❌ |
| IRVE | base nationale bornes | point/nearest | roadmap seulement | ❌ |
| Médecins | APL DREES | commune | actif | ✅ |
| DVF | DVF géolocalisé | commune + rayon | actif | ✅ |
| Loyers | carte des loyers | commune | actif | ✅ |
| Écoles | Annuaire de l'éducation | point | BPE écoles | 🟡 |
| Services | BPE | point/commune | actif | ✅ |
| Santé | FINESS | point | partiel | 🟡 |

L'API expose une nomenclature de jointure explicite : parcelle, RNB, BAN, immeuble, point-dans-polygone, rayon, UDI, commune, EPCI, IRIS, plus-proche et dérivé. C'est une **doctrine de grain**, pas une source supplémentaire.

Sources :
- https://parcelle-info.fr/sources
- https://parcelle-info.fr/docs

---

## 6. Aucadastre

Aucadastre est désormais l'un des concurrents les plus faciles à rétro-ingénier : sa fiche data.gouv.fr, son API JSON sans clé et son MCP publient une liste précise des registres consommés.

Sources confirmées :
- Base Adresse Nationale ;
- Plan cadastral informatisé ;
- Géoportail de l'urbanisme ;
- GASPAR et Géorisques ;
- DVF + DVF géolocalisé ;
- DPE ADEME ;
- Sitadel ;
- BD TOPO ;
- RGE ALTI ;
- Annuaire de l'Éducation nationale ;
- Sirene ;
- fichiers des locaux et parcelles des **personnes morales** (DGFiP) ;
- **RNIC** (Registre national d'immatriculation des copropriétés) ;
- bases statistiques **SSMSI** de délinquance enregistrée ;
- Carte des loyers ;
- zonage A/B/C ;
- **RNB** ;
- contrôle sanitaire de l'eau distribuée / Hub'Eau.

L'API `/street/{id}` expose parcelle et feuille, parcelles autour, zone PLU et document opposable, prescriptions et servitudes, risques, ventes, DPE, bâti, permis, relief/ensoleillement, écoles et établissements avec SIREN. Les endpoints commune et parcelle complètent cette lecture.

| Donnée / branchement | futur•e | Verdict |
|---|---|---|
| Zonage PLU + document opposable + prescriptions | servitudes GPU partielles, pas PLU complet | ❌ **vrai trou** |
| RNB comme identité bâtiment | audit/sonde, pas actif | ❌ **vrai trou** |
| RNIC copropriété | absent | ❌ **vrai trou achat** |
| BD TOPO bâti / environnement | usage ponctuel seulement | 🟡 |
| RGE ALTI / relief | altitude NGF au point | 🟡 |
| Annuaire Éducation | BPE écoles | 🟡 autre profondeur |
| SSMSI délinquance | sondé, non actif | ❌ arbitrage éditorial |
| Fichiers fonciers personnes morales | absent | ❌ mais hors cœur B2C |
| Zonage A/B/C | non actif | ❌ faible valeur directe |
| Eau distribuée | Hub'Eau actif | ✅ |
| Carte des loyers / DVF / DPE / Géorisques / cadastre / Sitadel | actifs | ✅ |

**Point notable :** Aucadastre ne se contente donc pas du cadastre/PLU. Sa stack est très proche d'une fiche technique nationale exhaustive et inclut deux trous structurants de futur•e : **RNB/RNIC**.

Sources :
- https://aucadastre.fr/api
- https://www.data.gouv.fr/reuses/aucadastre-une-adresse-tous-les-faits-publics-du-terrain
- https://www.data.gouv.fr/dataservices/api-aucadastre-une-adresse-francaise-tous-les-faits-publics-du-terrain-en-json

---

## 7. EcoBuilding

| Donnée | Source confirmée | futur•e | Verdict |
|---|---|---|---|
| Identité / caractéristiques bâtiment | BDNB CSTB | non actif | ❌ |
| DPE | ADEME | actif | ✅ |
| Transactions | DVF | actif | ✅ |
| Adresse | BAN | actif | ✅ |
| Risques | Géorisques | actif | ✅ |
| Cadastre | cadastre | actif | ✅ |
| Nappe phréatique | **ADES** | non actif | ❌ |
| Solaire | **PVGIS** | non actif à la toiture | ❌ |
| Éducation | Annuaire Éducation | BPE | 🟡 |

C'est un bon témoin de la commoditisation de la fiche bâtiment : BDNB + DPE + DVF + Géorisques + cadastre sont déjà assemblés gratuitement et exposés par API.

Source :
- https://www.data.gouv.fr/reuses/ecobuilding-la-carte-didentite-ecologique-de-chaque-batiment

---

## 8. Score Adresse

Les pages publiques actuelles sont **incohérentes sur le nombre de sources** : la page « À propos » annonce « 7 sources officielles » mais n'en nomme publiquement que quatre dans le contenu récupéré ; « Comment ça marche » parle de trois bases puis en liste également quatre. Le benchmark ne retient donc que les branchements explicitement nommés.

| Donnée | Source confirmée | Grain / usage annoncé | futur•e | Verdict |
|---|---|---|---|---|
| Prix réels | DVF | rayon / ventes comparables | actif | ✅ |
| DPE | ADEME | cascade adresse exacte → bâtiment → rue → commune | attribution stricte + commune | ✅ famille commune ; méthode différente |
| Risques | Géorisques | adresse / PPR / radon / ICPE | actif | ✅ |
| Géocodage | BAN | adresse → coordonnées | actif | ✅ |

**BDNB, PLU et cadastre ne sont pas comptés comme branchements confirmés** dans l'état actuel des pages méthodologiques publiques. S'ils apparaissent ailleurs dans l'interface, il faut une preuve technique ou une source publiée avant de les ajouter au benchmark.

Le score /100, le « score de négociation » et les éventuelles marges en euros sont des **dérivés** à partir des sources ci-dessus, pas des datasets supplémentaires.

Sources :
- https://score-adresse.fr/a-propos
- https://score-adresse.fr/comment-ca-marche

---

## 9. GoodPlaceTo.Live

GoodPlaceTo.Live expose beaucoup de familles d'information, mais pas un registre technique comparable à Domky ou Parcelle Info. On peut confirmer les thèmes, pas attribuer proprement chaque API.

Données visibles : prix et transactions, espaces verts, urbanisme, qualité de l'eau, transports, écoles, commerces/loisirs, santé, ERP/PPR/pollutions/CatNat, sécurité, bruit, permis de construire et densité touristique.

| Famille | futur•e | Verdict |
|---|---|---|
| Immobilier / transactions | DVF + loyers | ✅ |
| Risques / ERP | Géorisques/CatNat | ✅ |
| Permis | Sitadel | ✅ |
| POI transport/écoles/santé/commerces | BPE/OSM/APL | ✅ / 🟡 |
| Eau | Hub'Eau | ✅ |
| Sécurité | non active | ❌ |
| Bruit réglementaire ou calculé | calme OSM seulement | ? source non publiée ; écart possible |
| Densité touristique | non | ❌ mais source exacte non vérifiée |

Ne pas écrire « GoodPlace branche SSMSI » tant que leur source publique ne le dit pas.

Sources :
- https://goodplaceto.live/
- https://goodplaceto.live/nos-offres/

---

## 10. ImmoClimat

Stack confirmée : BAN, Géorisques/GASPAR, DVF géolocalisé, DPE ADEME, OpenStreetMap, calcul d'exposition des façades N/S/E/O. Les indicateurs climat 2050 sont présentés explicitement comme ordres de grandeur indicatifs, non comme projections officielles de référence.

**Verdict : aucun trou de source majeur** révélé ici. L'orientation de façade est surtout un fait dérivé géométrique, pas une nouvelle base externe. Sur la prospective climatique, futur•e est plus solide grâce à DRIAS/TRACC multi-modèles.

Source :
- https://www.data.gouv.fr/reuses/immoclimat-analyse-bioclimatique-risques-climat-dun-bien-immobilier

---

## 11. TOISE

Branchements confirmés :
- BAN ;
- PCI / cadastre ;
- GPU : PLU, PLUi, PSMV, carte communale, zones et prescriptions ;
- servitudes d'utilité publique ;
- GASPAR / Géorisques ;
- régime loi Littoral ;
- BD TOPO pour observations du bâti ;
- dans les autres outils/MCP : DVF, Sitadel, DPE, INSEE et fichiers des personnes morales.

TOISE calcule ensuite une enveloppe constructible en distinguant explicitement source / observation / hypothèse.

| Donnée | futur•e | Verdict |
|---|---|---|
| PLU / zone / prescriptions | servitudes GPU seulement | ❌ majeur |
| SUP | patrimoine déjà branché partiellement | 🟡 |
| Loi Littoral réglementaire parcellaire | géographie littorale mais pas ce raisonnement urbanisme | 🟡 / ❌ |
| BD TOPO bâti | non branché comme observation générale | ❌ |
| DVF / Sitadel / DPE / risques | présents | ✅ |
| Personnes morales propriétaires | non | ❌ mais hors cœur B2C |

Sources :
- https://www.data.gouv.fr/reuses/toise-que-peut-on-construire-sur-une-parcelle-zonage-du-plu-servitudes-risques-et-capacite-constructible
- https://www.data.gouv.fr/reuses/toise-mcp-donnees-foncieres-et-durbanisme-francaises-pour-claude-chatgpt-et-les-agents-ia

---

## 12. OUVI

Sources France publiées :
- INSEE : population, salaires, chômage, démographie ;
- DVF : prix de transaction ;
- CLAMEUR / SeLoger : loyers de marché ;
- Météo-France : température / ensoleillement ;
- Ministère de l'Intérieur : sécurité / délinquance ;
- ARS / DREES : soins / hôpitaux.

| Source / thème | futur•e | Verdict |
|---|---|---|
| INSEE démographie | actif | ✅ |
| DVF | actif | ✅ |
| Loyers | carte des loyers publique, pas CLAMEUR/SeLoger direct | 🟡 |
| Climat observé | ERA5/Météo-France selon variables | ✅ / 🟡 |
| Sécurité | non active | ❌ |
| Santé | APL / BPE / FINESS partiel | ✅ / 🟡 |
| Emploi / salaires | emploi et revenus présents mais architecture différente | 🟡 |

OUVI ne révèle pas de source bâtiment/adresse nouvelle.

Source :
- https://ouvi.fr/villes

---

## 13. Choisir sa ville

Stack explicitement publiée : INSEE, IGN, Météo-France SAFRAN/SIM, CORINE Land Cover 2018, carte des loyers, DVF, SSMSI.

- **SSMSI** est le seul vrai trou net.
- CORINE Land Cover n'est pas une avance : futur•e utilise OSO 2023 à 10 m, plus fin pour le caractère naturel.
- SAFRAN/SIM est une autre source de climat observé ; futur•e dispose déjà d'ERA5-Land et de DRIAS.

Sources :
- https://www.data.gouv.fr/organizations/choisir-sa-ville/presentation
- https://www.data.gouv.fr/reuses/choisir-sa-ville-comparateur-de-communes

---

## 14. CityScan

CityScan annonce environ 120 indicateurs et des API Data/POI/Maps, mais sa provenance est moins auditable publiquement : open data + partenaires privés + bases propres.

Données visibles : cartes de prix/mutations, POI, cartes de bruit, pollution électromagnétique, fibre, sécurité, santé, loisirs.

| Donnée visible | futur•e | Statut benchmark |
|---|---|---|
| Prix / mutations | DVF | ✅ |
| POI | BPE/OSM | ✅ |
| Fibre | non active | ❌, source CityScan non publiée |
| Bruit | pas CBS/PEB active | ❌, source non publiée |
| Pollution électromagnétique | non | ❌, source probable ANFR mais **non confirmée** |
| Sécurité | non | ❌, source exacte non confirmée |

Les 120 indicateurs ne sont donc pas 120 sources ouvertes copiables.

Sources :
- https://www.cityscan.fr/valorisation-de-bien/
- https://www.cityscan.fr/csapis/
- https://www.cityscan.fr/a-propos/

---

## 15. Aux Alentours par MAIF

La liste data.gouv.fr confirme notamment : Admin Express/COG, BPE, Géorisques, GASPAR, GéoLittoral, BD Carto/BD Topo, lignes électriques, monuments historiques, plans d'exposition au bruit, transports et radon, auxquels s'ajoutent des données internes MAIF.

| Donnée | futur•e | Verdict |
|---|---|---|
| Risques Géorisques / GASPAR | actif | ✅ |
| Trait de côte | actif / cadré | ✅ |
| BPE / transports | actif | ✅ |
| Monuments / servitudes | GPU patrimonial | ✅ / 🟡 |
| Lignes électriques | non | ❌ |
| PEB aéroports | non | ❌ |
| BD TOPO généraliste | non | 🟡 / ❌ |
| Scores propriétaires MAIF | non | ⚪ dérivé / donnée interne |

Sources :
- https://www.data.gouv.fr/pages/onboarding/aux-alentours-par-maif/
- https://www.data.gouv.fr/reuses/aux-alentours-par-maif

---

## 16. OneDPE et Bat-ADAPT : benchmarks adjacents

### OneDPE

Le baromètre confort d'été 2026 croise 11,18 M DPE ADEME, Climadiag/DRIAS-TRACC, LCZ/WUDAPT et IGN Admin Express. Il montre surtout que le champ réglementaire « confort d'été » du DPE décrit cinq caractéristiques du bâtiment et ne dépend pas du climat local.

Écart utile : LCZ/WUDAPT n'est pas actif nationalement chez futur•e, mais sa couverture et son usage avaient déjà été jugés trop limités pour devenir une brique centrale.

Source :
- https://www.data.gouv.fr/datasets/confort-dete-des-logements-diagnostiques-indicateurs-regionaux-millesime-2026

### Bat-ADAPT / R4RE

Bat-ADAPT est un benchmark de méthode : exposition climatique + sensibilité du bâtiment + matrices de vulnérabilité + actions d'adaptation. Il ne révèle pas une base publique unique manquante à futur•e ; sa valeur vient surtout de la composition et des matrices.

---

# 17. Matrice des vrais trous révélés par plusieurs concurrents

| Écart | Concurrents où il apparaît | État futur•e | Force du signal |
|---|---|---|---|
| **BDNB / attributs factuels bâtiment** | ClimaScore, Domky, Parcelle Info, EcoBuilding, Score Adresse | audit seulement | **Très fort** |
| **RNB comme identité bâtiment stable** | Avertine, Parcelle Info / écosystème BDNB | sonde réalisée, pas actif | **Très fort** |
| **PLU complet : zone + prescriptions + destinations** | Domky, Avertine, Parcelle Info, Aucadastre, Score Adresse, TOISE | servitudes seulement | **Très fort** |
| **RNIC copropriété** | Avertine, Aucadastre | absent | **Fort et très achat** |
| **Bruit réglementaire CBS / PEB** | Où Vivre, Domky, MAIF, CityScan | OSM/structurel seulement | **Fort** |
| **Nappes : remontée + piézométrie/ADES** | ClimaScore, Domky, EcoBuilding | hydrologie oui, nappes non | **Fort** |
| **BDIFF feux observés** | Où Vivre, ClimaScore, écosystème risques | roadmap seulement | **Fort / faible effort probable** |
| **ARCEP fibre/mobile** | Domky, Parcelle Info, Aucadastre, Avertine, CityScan | sondé, non actif | **Fort mais moat faible** |
| **ANFR antennes** | Domky ; services électromagnétiques possibles | non | **Moyen** |
| **Lignes électriques** | Où Vivre, Avertine, MAIF | non | **Moyen-fort** |
| **Nature protégée INPN** | Où Vivre, Domky | OSO naturel mais pas protection nationale | **Moyen** |
| **SSMSI sécurité** | Où Vivre, Domky, OUVI, Choisir sa ville, GoodPlace visible | sondé, non actif | **Très récurrent, arbitrage éditorial** |
| **Éducation détaillée IPS/IVAL/IVAC** | Où Vivre, Domky | écoles BPE seulement | **Moyen, arbitrage éditorial** |
| **SISPEA prix/service eau** | Domky | qualité eau active | **Moyen** |
| **France Chaleur Urbaine** | Parcelle Info | absent | **Faible récurrence, bon cas bâtiment** |
| **IRVE** | Parcelle Info | roadmap | **Faible récurrence** |
| **Solaire toiture LiDAR + SARAH-3 + PVGIS** | Domky, EcoBuilding, Aucadastre (PVGIS) | rayonnement communal seulement | **Technique fort, spécialisé** |
| **Fiscalité locale / taxe foncière** | Où Vivre, Domky | absente | **Moyen** |
| **BD TOPO généraliste** | TOISE, Domky, MAIF | usage ponctuel seulement | **Moyen** |

---

# 18. Faux trous à ne plus répéter

- **Permis de construire** : futur•e a déjà Sitadel autour de l'adresse.
- **Écoles / équipements** : BPE est déjà branchée. Le vrai écart est l'Annuaire Éducation ou IPS/IVAL/IVAC.
- **Altitude** : IGN NGF au point est déjà branché. Le vrai écart est profil de terrain / LiDAR.
- **Nature** : OSO 2023 à 10 m et le caractère naturel à ~15 km existent. Le vrai écart est le statut de protection INPN.
- **Bruit** : futur•e a déjà un signal structurel routes/rail/aéroports. Le vrai écart est exposition acoustique réglementaire Lden/Lnight / PEB.
- **Eau** : Hub'Eau et VigiEau existent. Les écarts sont SISPEA coût/service et nappe/piézométrie.
- **Marché** : DVF et carte des loyers existent. Les écarts sont indices, modèles de prix ou données privées.
- **Climat observé** : ERA5-Land est actif ; SAFRAN chez un concurrent n'est pas une avance en soi.
- **Cadmium, pollens, moustique tigre, ICU** : présents dans le repo.
- **CatNat / RGA / DPE / audits / cadastre / BAN / ICPE / Cartofriches / APL médecins** : déjà des briques fortes de futur•e.

---

# 19. Lecture technique finale

Si l'on retire scores et volumes marketing, les stacks concurrentes convergent vers un socle devenu banal :

**BAN → parcelle → DPE → DVF → Géorisques → CatNat → services → loyers → permis.**

Ce socle est déjà largement présent dans futur•e.

Les deux couches où futur•e est objectivement moins branché sont :

1. **le bâtiment comme entité** : RNB + BDNB + parfois RNIC ;
2. **le droit exact de la parcelle** : PLU, prescriptions, destinations, règlement.

Une troisième famille revient souvent mais doit être arbitrée couche par couche : bruit réglementaire, nappes, BDIFF, lignes électriques, fibre/antennes.

Ce constat ne signifie pas qu'il faut tout intégrer. Le benchmark répond uniquement à : **« qu'ont-ils branché que nous n'avons pas ? »**

La doctrine de choix vit séparément dans docs/vault/doctrine/positionnement.md : Projet personnel, Composition, Incertitude actionnable, Continuité de la décision.
