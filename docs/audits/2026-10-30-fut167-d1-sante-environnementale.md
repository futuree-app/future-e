# FUT-167 · D1 · Carte « Santé environnementale » dans Territoire

30/10/2026 · branche `bonjourfuturee/fut-167-d1-sante-environnementale-territoire` · décision du porteur du 30/10 (description de FUT-163 et FUT-167).

## Ce que voit le lecteur

Une carte dans le groupe « Les risques », avec quatre lignes :

| Ligne | Grain | Ce qui est montré | Mis « à vérifier » quand |
|---|---|---|---|
| Air de fond | moyenne annuelle de la commune | PM2,5 et NO₂, repères OMS et UE 2030, période non démontrée, limite de la rue | NO₂ ≥ 10 ou PM2,5 ≥ 10 µg/m³ (règle `territoire.sante-air`) |
| Sites industriels | 8 km autour du centre de la commune | catégorie retenue par le calcul d'exposition, puis les sites Seveso nommés avec leur distance et la date d'extraction | score d'exposition ≤ 50 (règle `territoire.sante-industrie`) |
| Bruit des infrastructures | depuis le centre de la commune | infrastructure, distance, convention | distance de convention (règle `territoire.sante-bruit`) |
| Radon | classement réglementaire de la commune | catégorie 1 à 3, sens, mesure à faire | catégorie 3 (règle `territoire.radon`) |

Les seuils viennent de `sante-facts.ts` et `radon-facts.ts`, jamais recopiés : un test vérifie, valeur par valeur, que le signal de la carte est le `notable` des règles.

Les quatre preuves du dossier portent désormais une clé (`health.*`) : chacune ouvre le volet sur SA ligne, mise en évidence (vérifié en navigateur, bureau et mobile).

## Données

- **Air** : index (ADEME `data_communes`, modélisation Ineris). **Période non démontrée** : la fiche ADEME indique « Ineris, Year: 2023 », renvoie à une méthode « en date de février 2020 » et à une réanalyse 2000-2015. Aucune de ces dates n'est l'année mesurée de façon établie : la carte le dit, sans date inventée. Solution possible plus tard : intégrer les indicateurs communaux annuels de la cartothèque Ineris (année explicite). Paris, Lyon, Marseille : l'ADEME ne publie l'air ni pour la ville ni pour les arrondissements (vérifié par l'API) ; la ligne dit « non publié ».
- **Sites Seveso** : nouvel index local `data/installations-seveso.json` (171 Ko), construit depuis l'extraction nationale complète des installations classées (Géorisques, 30/10/2026 : 138 860 lignes sur 138 860, 0 illisible ; 1 360 sites Seveso, 734 seuil haut, 626 seuil bas). Trois fiches sans position exploitable (une publiée en Italie, deux à Mayotte sans coordonnées) sont placées au centre de leur commune et dites « position approchée ». Scripts : `scripts/fut167/extraire-icpe.mjs` puis `construire-seveso.mjs` ; actualisation trimestrielle suffisante, la date d'extraction est affichée.
- **Calcul d'exposition et bruit** : index, inchangé.
- **Radon** : Géorisques, cache 30 jours, déjà appelé par le moteur.

## Le site « retenu » n'est pas le plus proche

Le calcul d'exposition retient le site qui pèse le plus (gravité × proximité). La carte dit la catégorie retenue, puis les sites Seveso réellement présents, lus dans l'index. Aucune absence de Seveso ne se déduit du score ; une absence ne s'affirme que sur l'index lu, avec sa date ; un index illisible dit « non lus ».

## Règle industrie à l'adresse (engine-8)

Avec une adresse, l'absence de signal ne rend plus `satisfied` mais `uncertain`, comme le bruit depuis le 29/07. Le registre des critères change : `ENGINE_VERSION` passe à `engine-8`. Conséquence : le comparatif ne rapproche pas un dossier engine-7 d'un dossier engine-8.

## Anciens dossiers

La carte est lue à côté du relevé Territoire, jamais dedans (comme les incendies et la fibre) : aucun relevé ni synthèse n'est réécrit, le cache des synthèses n'est pas invalidé. Le volet porte « Lecture faite le JJ/MM/AAAA, à côté de votre dossier : elle ne modifie aucun constat déjà produit ».

## Coût

Aucun appel nouveau pour l'air, l'industrie et le bruit. Index Seveso lu une fois par instance. Radon : un appel par commune (Paris, Lyon, Marseille : un par arrondissement), cache 30 jours. Toute panne rend « non lu », jamais une absence.

## Recette

- `src/lib/fut167-sante-environnementale.test.ts` (20 tests), règles dans `materiality-rules.test.ts`.
- Lecture réelle : `node scripts/fut167/lire-carte.mts` (Fos, 16016, La Rochelle, Lille, Lacq, Lyon, Feyzin, Paris).
- Navigateur : `scripts/fut167/capturer-carte.mjs` sur `/dev/fut167` (404 en production), captures dans ce dossier.
