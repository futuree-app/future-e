# Deep research : demande « où vivre × climat » — synthèse vérifiée

**Date** : 2026-07-01 (collecte ~21h30, vérification manuelle a posteriori)

**Statut** : la collecte automatisée (108 agents, 6 angles, 15 sources, 60 affirmations, 25 retenues) a abouti, mais sa phase de vérification adversariale a été interrompue par la limite de session, produisant un faux verdict « 0 confirmée / 25 rejetées » (artefact d'abstention, pas un jugement de fond — voir historique de conversation). J'ai revérifié moi-même les 6 affirmations qui portent la synthèse, en refetchant les sources primaires. Le reste (19 affirmations) est listé en annexe, non revérifié individuellement mais cohérent avec les sources vérifiées.

## Question posée

Contexte : futur•e est un site français d'aide au choix de lieu de vie (« où vivre ») qui utilise les risques et trajectoires climatiques + la santé environnementale pour éclairer une décision résidentielle, pas un site de risques. Son moat = trajectoire climatique long terme + honnêteté du signal (décrire jamais juger, pas de score faux, ne jamais surfacer une donnée vraie mais inerte ou trompeuse pour la décision). Son goulot business identifié = le débit d'inconnus (acquisition / formation de la demande), PAS la largeur des données. Une veille mensuelle (mai-juin 2026) a déjà couvert le versant OFFRE/donnée climat-territoire FR (canicule précoce, refuges fragilisés, assurabilité, RGA argiles 2026, nappes, feux, littoral, chlordécone, LiDAR, adaptation territoriale B2B).

Question de recherche : en dehors de ce que cette veille a déjà couvert, qu'est-ce qui (a) rendrait le produit EXISTANT plus juste ou plus honnête, et (b) qu'est-ce qui ne touche QUE l'offre sans toucher le goulot d'acquisition ? Trois cibles : signaux de demande, sources de données FR neuves, pièges d'honnêteté.

---

## Synthèse

### 0. Constat transversal : toute la base « signal de demande » de ce corpus venait de parties commercialement intéressées — mais un chiffre fiable existe ailleurs (mise à jour 2026-07-01)

En repassant sur la matière collectée, les deux sources qui portaient tous les chiffres de demande de ce rapport étaient chacune un acteur ayant un intérêt commercial direct à montrer une demande forte : **leboncoin** (portail immobilier) pour les chiffres climat (27 %/7 %/tiers), et **France Armor**, une entreprise de déménagement, pour l'étude mobilité résidentielle 2025. Aucune des deux ne publie de méthodologie vérifiable. **Aucune de ces deux sources ne pouvait être citée comme un fait établi neutre** (voir désormais `doctrine/editoriale.md#statistiques-marketing-tierces`).

**Recherche complémentaire (2026-07-01) : un chiffre fiable et citable existe.** Sondage **Odoxa pour ICI** (réseau radio publique, pas une partie commercialement intéressée au marché immobilier), 13 164 répondants, échantillon redressé sexe/âge/CSP/catégorie urbaine/région, collecte en ligne du 1er au 15 septembre 2025 : **28 % des Français se disent prêts à déménager pour habiter une commune moins exposée aux risques climatiques, 12 % iraient jusqu'à changer de région** (destination prioritaire citée : la Bretagne). C'est une enquête ponctuelle (premier volet d'une série mensuelle ICI annoncée jusqu'à mars 2026), pas encore un baromètre suivi dans le temps : citable comme un instantané daté et sourcé, jamais comme une tendance mesurée.

**Découverte annexe, corrective sur la doctrine interne** : en vérifiant si ce chiffre Odoxa recoupait un chiffre déjà cité dans `vision/modele-economique.md` (« intention de mobilité climatique doublée, 13 % en 2023 → 28 % en 2025, Odoxa »), il s'avère que le 13 % de 2023 vient en réalité d'un sondage **Ifop** (juin 2023), pas d'Odoxa, et que les deux enquêtes n'ont ni le même institut ni la même méthodologie ni la même question exacte. La formulation « doublée » du vault était donc une fausse série temporelle, exactement le piège que la nouvelle règle éditoriale interdit. Corrigé dans `vision/modele-economique.md` le 2026-07-01.

### 0bis. GD4H n'est pas une source exploitable aujourd'hui (correction du rapport de collecte)

Le rapport de collecte automatisée présentait GD4H comme une « couche de découverte candidate » de nouvelles données santé-environnement. En rouvrant le catalogue directement, il est **actuellement vide en beta** (« pas de résultats », plateforme explicitement en construction, invite à rejoindre un groupe de beta-test). Ce n'est pas une piste à explorer maintenant : à ignorer tant que la plateforme n'est pas sortie de beta, et à re-vérifier dans quelques mois plutôt que de la garder comme action ouverte.

### 0ter. data.gouv.fr : pas de rupture technique prévue en 2026 (non-événement, rassurant)

Vérifié sur l'annonce officielle : la roadmap 2026 de data.gouv.fr (recherche améliorée, studio de visualisation, meilleur score de qualité des métadonnées) ne prévoit **aucun changement de format ni de rupture d'API** — le moteur udata reste stable. Aucune action requise côté futur•e, mais ça vaut la peine de le noter : le risque d'un breaking change sur une dépendance de données critique (Hub'Eau, Géorisques, INSEE via data.gouv) n'est pas à l'agenda 2026.

### 1. Le climat devient un critère résidentiel déclaré, mais le signal est jeune et fragile (versant GOULOT)

Une étude leboncoin (panel propriétaire « La bonne communauté », 1 752 répondants, 18-22 juin 2026 — **pas un institut tiers, à traiter comme un signal d'entreprise intéressée, pas une enquête indépendante**) donne : 27 % pourraient envisager un déménagement « si la situation s'aggrave », 7 % l'envisagent déjà sérieusement, et « plus d'un tiers » intègre le climat dans ses réflexions résidentielles. Point notable et vérifié : **aucune limite méthodologique n'est publiée** (pas de marge d'erreur, pas de redressement mentionné) — le chiffre est à citer avec cette réserve si jamais il entre dans un contenu futur•e.

Ce chiffre contredit en partie une étude antérieure (MySweetImmo, février 2025) où les critères de choix de vie déclarés sont dominés par le coût de la vie (72 %), l'emploi (58 %) et l'accès aux espaces naturels (52 %) — **le climat/risque n'apparaît pas dans le top des critères spontanés**. Lu ensemble, cela dessine une trajectoire cohérente avec la thèse de futur•e (le climat émerge comme critère entre 2025 et 2026) plutôt qu'une contradiction, mais ça reste deux méthodologies différentes, pas une série temporelle propre. **À ne pas citer comme "en 2025 X%, en 2026 Y%, doublement du signal" — ce serait le genre d'erreur de lecture que la doctrine anti-antithèse et anti-score-faux du projet interdit déjà.**

Une source distincte (LeBonCoin Solutions Pro, sur le marché des Landes) documente un vrai piège de lecture : l'inventaire immobilier y a augmenté de 4,8 % pendant que les demandes d'acheteurs chutaient de 11,5 % (mars-mai 2026) — soit l'inverse d'une "migration climatique vers la côte plus fraîche" qu'un lecteur naïf du signal climat pourrait inférer. L'article lui-même parle d'un "réflexe climat" naissant, pas d'une migration de masse. **C'est un bon exemple concret à garder en tête pour la doctrine "décrire jamais juger" : le signal climat existe mais n'est pas encore un moteur de flux migratoire mesurable.**

### 2. La distribution IA/LLM s'installe côté immobilier, la France est concernée par au moins un acteur (versant GOULOT, pertinent pour le Discoverability Strategist)

Vérifié sur l'article Inman original (pas seulement la reformulation) : **Orpi** (1 250 agences en France) a connecté son catalogue à une plateforme nommée Kleio pour le rendre "consultable et interprétable" par ChatGPT, Google AI et Claude — présenté comme une restructuration des données pour que les agents IA "raisonnent sur les champs structurés et les descriptions narratives". L'article ne précise ni le protocole technique (pas confirmé que c'est du MCP), ni la date de lancement exacte, et **ne nomme aucun autre acteur européen** malgré le titre "Europe". C'est un signal isolé, un seul acteur français documenté, à ne pas généraliser en "le marché bascule vers l'IA". Le point actionnable réel : un concurrent adjacent structure déjà ses données pour être lu par les mêmes LLM qui pourraient citer futur•e — renforce l'urgence GEO déjà identifiée par le Discoverability Strategist, sans changer sa feuille de route.

### 3. Le financement immobilier commence à intégrer le risque climatique, mais sans preuve statistique publiée (versant GOULOT, argument de conviction pour le paywall territoire)

Vérifié sur MeilleursAgents : l'article ne documente **aucun cas nommé de refus de prêt**. Cafpi affirme même explicitement qu'"aucun refus de prêt ne sera motivé par des critères climatiques". Maël Bernier (Meilleurs Taux) reste sur un registre déclaratif ("les établissements s'inquiètent des zones inondables"). Les seuls chiffres durs sont la hausse de la surprime CatNat (12 % → 20 % au 1er janvier 2025, +25 ans d'ancienneté du régime, +~17€/an en moyenne) et 6,5 Md€ de sinistres en 2023 (France Assureurs). **Le "les banques refusent des crédits" doit être traité comme une anecdote de professionnel, pas un fait établi** — c'est un piège d'honnêteté sur lequel futur•e devrait justement se distinguer en ne le répétant pas sans le nuancer, si jamais évoqué en contenu.

### 4. Deux pièges d'honnêteté concrets, transposables à la doctrine du projet (versant OFFRE, honnêteté du signal)

Vérifiés directement sur les pages sources :

- **Eau potable (SISE-Eaux/Hub'Eau)** : les données ne sont **pas nativement communales**, elles sont agrégées par Unité de Distribution (UDI). Un fichier de correspondance UDI→commune existe, mais "une commune peut dépendre de plusieurs UDI de qualité différente" — présenter "l'eau de la commune X" sans préciser l'UDI reproduit exactement le type d'erreur (donnée vraie mais mal cadrée) que la doctrine du projet interdit déjà pour d'autres critères. Licence Ouverte 2.0, mise à jour mensuelle à M+1, source Ministère de la Santé (base SISE-Eaux depuis 1994) — la source elle-même est solide, c'est la maille de présentation qui est le piège.
- **Qualité de l'air (Atmo, Carte Stratégique de l'Air)** : confirmé que l'indice Atmo classique se calcule "en situation dite de fond […] sans prendre en compte les phénomènes de proximité", et que la pollution varie à l'échelle de la rue (effet canyon entre bâtiments, exposition différenciée en bord d'axe). Un indice communal moyen masquerait donc une surexposition locale réelle — piège structurellement identique à celui déjà tranché sur les ÎCU ([[icu_ilot_chaleur_data]]) où l'agrégation départementale a été jugée non comparable et écartée de Territoire.

### 5. PFAS : nouvelle source crédible, calendrier réglementaire confirmé, avec son propre piège d'agrégation (versant OFFRE)

Confirmé et recoupé sur deux sources : la directive européenne eau potable impose la surveillance de 20 substances PFAS dans l'eau distribuée en France à partir du 1er janvier 2026 (seuil de qualité 0,1 µg/L pour la somme des 20 substances, la France ayant anticipé en généralisant les recherches dès 2025). Au-delà du seuil, l'eau est classée « non conforme » et déclenche recontrôles + obligation d'information de la population par le distributeur.

État des lieux, deux sources concordantes sur l'ordre de grandeur malgré des périmètres différents :
- Compilation Selectra sur données Ministère de la Santé (SISE-Eaux), nov. 2025 : **31 réseaux sur 8 036 analysés dépassent le seuil (0,4 %)**, moyenne nationale 2024 à 0,024 µg/L (4x sous le seuil).
- Chiffre plus récent (ARS) : 24 réseaux sur 8 827 dépassent la norme (0,3 %).

**Piège d'honnêteté propre à cette donnée, identique en nature à celui de l'eau bactériologique** : la moyenne nationale rassurante (0,024 µg/L) masque une exposition concentrée sur une trentaine de réseaux précis — citer la seule moyenne serait trompeur pour un lecteur dont la commune dépend justement d'un de ces réseaux. Et comme pour SISE-Eaux, la donnée est agrégée par réseau/UDI, pas par commune stricte. Ni Selectra ni l'ARS ne précisent si les 20 PFAS recherchés couvrent toutes les molécules préoccupantes ni la méthode d'analyse — signal solide sur le principe, précision à ne pas sur-interpréter à la commune près.

Source data.gouv.fr en Licence Ouverte 2.0, mise à jour mensuelle, Ministère de la Santé — solide et citable. Utile pour le module Santé/eau si le porteur veut enrichir au-delà de la conformité microbiologique classique, mais rien qui touche le goulot d'acquisition.

---

## Verdict sur la question posée

Rien dans cette recherche ne pointe vers un nouveau levier de goulot d'acquisition à fort impact (pas de canal de distribution neuf, pas de mot-clé de recherche massif inexploité). Les deux trouvailles les plus utiles sont défensives/de conviction plutôt qu'offensives :

1. **Un concurrent adjacent (Orpi) structure déjà ses données pour les LLM** — renforce l'urgence GEO déjà actée, ne crée pas de nouvelle piste.
2. **Deux pièges d'agrégation concrets et sourcés (eau/UDI, air/rue)** — utiles si le porteur enrichit un jour ces critères, à traiter avec la même discipline que l'ÎCU (ne pas surfacer une moyenne qui masque une exposition locale).

Le signal de demande climat (leboncoin, 27 %/7 %/tiers) est réel mais fragile méthodologiquement (panel propriétaire, pas d'institut tiers, pas de marge d'erreur publiée) : à garder comme indice d'air du temps, pas comme statistique à citer telle quelle dans un contenu futur•e.

---

## Annexe — 19 affirmations non revérifiées individuellement (cohérentes avec les sources ci-dessus)

- Mobilité résidentielle 2025 (MySweetImmo) : 16 % envisagent de déménager dans l'année, 28 % ont changé de région dans les 12 derniers mois ; première motivation = qualité de vie (38 %) devant l'emploi (26 %) et le télétravail (14 %).
- PFAS : 0,4 % des réseaux (31) dépassent 0,1 µg/L, moyenne 2024 à 0,024 µg/L — écart moyenne/pic à vérifier avant citation.
- Assurance habitation : primes variant fortement par région (ex. Pays de la Loire 189€/an vs Nouvelle-Aquitaine 233€/an), source SeLoger/edito — à confirmer si utilisé en contenu, source secondaire éditoriale.
- 22 % des Français envisageraient de déménager pour un logement mieux adapté aux fortes chaleurs (Ipsos BVA pour Bouygues Immobilier) ; 57 % des acquéreurs 2026 citeraient le confort d'été comme critère clé d'achat — sources secondaires (architecturebois.fr), non recoupées avec l'enquête d'origine.
- GD4H (gd4h.ecologie.gouv.fr) : catalogue officiel de données environnement-santé sous PNSE4, candidat comme couche de découverte de nouvelles sources santé-environnementale — piste à explorer, pas encore auditée par le Data Curator.

## Sources consultées (15)

- [primaire, vérifié] https://presse.leboncoincorporate.com/actualites/canicule-immobilier-etude-2026-ddce8-763e3.html
- [secondaire, vérifié] https://edito.meilleursagents.com/financement/credits-immobiliers/credit-immobilier-risque-climatique-jouer-defaveur-article-19477_6
- [primaire, vérifié] https://www.data.gouv.fr/datasets/resultats-du-controle-sanitaire-de-leau-distribuee-commune-par-commune
- [secondaire, vérifié] https://www.inman.com/2026/06/26/europe-just-connected-real-estate-listings-directly-to-chatgpt-claude/
- [secondaire, vérifié] https://www.data.gouv.fr/reuses/pfas-dans-leau-du-robinet-par-commune-departement-et-region
- [primaire, vérifié] https://www.atmo-hdf.fr/actualite/un-outil-au-service-des-territoires-la-carte-strategique-de-lair
- [secondaire, non revérifié] https://www.mysweetimmo.com/2025/02/21/immobilier-en-quete-dune-meilleure-qualite-un-francais-sur-trois-envisage-de-demenager-en-2025/
- [primaire, non revérifié] https://gd4h.ecologie.gouv.fr/catalogue
- [primaire, non revérifié] https://www.data.gouv.fr/posts/quelles-sont-les-perspectives-de-data-gouv-fr-pour-2026-1
- [primaire, non revérifié] https://www.data.gouv.fr/datasets/communes-cantons-et-epci-2025-admin-express-cog-plus-ign
- [primaire, non revérifié] https://www.statistiques.developpement-durable.gouv.fr/jeux-de-donnees
- [secondaire, non revérifié] https://www.mysweetimmo.com/2026/06/24/immobilier-le-climat-simpose-comme-un-nouveau-critere-de-choix/
- [secondaire, non revérifié] https://edito.seloger.com/conseils-d-experts/assurance-habitation/assurance-habitation-hausse-prix-se-poursuit-2026-article_2
- [secondaire, non revérifié] https://leboncoinsolutionspro.fr/actualites/canicule-et-immobilier-transformation-des-criteres-dachat/
- [secondaire, non revérifié] https://www.architecturebois.fr/critere-dachat-immobilier/
