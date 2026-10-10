# Benchmark données : Où Vivre et ClimaScore face à futur•e

Établi le 10 octobre 2026. Sources : fichier de configuration public de la carte Où Vivre (`app.ou-vivre.fr/map/apps/explore.fr.xml`) et deux fiches de métadonnées, page d'accueil ClimaScore, dépôt `futuree-app/future-e` (branche main : `DATA_SOURCES.md`, `src/lib`, `scripts`).

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

Concurrent le plus proche du Dossier adresse : rapport PDF à 19,90 €, cinq notes de A à F (dangers, environnement, quartier, bâtiment, 2050), lecture annoncée à la parcelle.

Volumes revendiqués : 1 745 indicateurs, 32 millions de bâtiments (BDNB), 14,5 millions de transactions, 34 875 communes.

Sources déclarées que futur•e n'exploite pas encore :
- BDNB (CSTB) : année, matériaux, copropriété au bâtiment.
- RGE ALTI 1 m (IGN) : profil du terrain au point.
- Carte BRGM 2026 des remontées de nappe.
- Carte BRGM 2026 de l'exposition aux argiles (en polygones, en plus de l'API).
- Piézomètres Hub'Eau en temps réel.
- Zones de vent Eurocode.
- Zonage PLU du Géoportail de l'urbanisme.

Sources communes aux deux : DRIAS, DVF, DPE ADEME, Géorisques (PPR, ICPE, sols pollués), GASPAR CatNat, ONRN, BAN, cadastre, Sitadel, îlots de chaleur urbains, trait de côte Cerema, BPE, ATMO, Hub'Eau. ClimaScore ajoute aussi les revenus carroyés Filosofi et les feux BDIFF, absents de futur•e.

Différences de doctrine : ClimaScore note, chiffre une décote en euros et un « coût annuel du risque ». futur•e refuse les scores et gradue la certitude. Leur méthode de projection climatique n'est pas précisée sur la page d'accueil (119 fichiers NetCDF DRIAS, nombre de modèles inconnu).
