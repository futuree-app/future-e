# FUT-157 · Sites et sols pollués au terrain de l'adresse, dans Logement

30/10/2026 · branche `bonjourfuturee/fut-157-sites-sols-pollues-au-point` · base `main` `82cbc171` · non fusionnée, non déployée.

## En une minute

- **Le dossier Logement lit désormais, au terrain de l'adresse, les trois inventaires de l'État qui ont une portée sur un terrain** : secteurs d'information sur les sols (SIS), servitudes d'utilité publique (SUP) et sites suivis par l'administration (instructions, ex-BASOL). Une seule section, « Sols pollués sur ce terrain », à côté des risques du bâti. Rien dans Autour ni dans le comparateur.
- **Une intersection, jamais une distance.** L'API cherche autour d'un point : c'est un préfiltre. Chaque périmètre est confronté au point de l'adresse et à sa parcelle cadastrale. Aucun seuil de distance n'est affiché, et aucun ne décide de rien.
- **Le cas de référence ne dit pas ce que le ticket supposait.** Aucun des 25 numéros BAN du boulevard de la Solidarité (Metz) n'a son point dans le SIS Sotrameuse. Le 94 a, le 96 et le 96 b sont posés sur la voie, à 2 ou 3 m du périmètre, hors de toute parcelle ; le cadastre les rattache par proximité à des parcelles que le SIS couvre entièrement. Une recherche par rayon disait « dans le SIS », le point seul dirait « rien ». La section dit « à vérifier », avec la raison.
- **Une panne n'est jamais une absence.** Six issues distinctes : concerné, à vérifier, aucun (tout lu, à la parcelle attribuée), terrain non situé, incomplet, indisponible. Un résultat attesté est gardé si un autre inventaire tombe.
- **Deux défauts de la source, mesurés et traités** : 11 % des périmètres portent des « trous » d'aire nulle qui les rendaient illisibles ; et l'API ne rend **jamais** une fiche localisée par un simple point dans une recherche géographique (même à 10 m de son point).
- **Coût** : 6 à 12 appels Géorisques gratuits par dossier, au plus 250 Ko, en parallèle du reste ; la lecture communale est mise en cache une journée. Aucun appel Anthropic, aucune écriture Supabase, aucun changement du moteur de décision.
- **Signalés à part (hors périmètre)** : la synthèse Logement affiche le HTML de la page de connexion si la session expire (§9) ; Cartofriches est chargé sans être affiché et peut faire refuser une actualisation (§8) ; l'horodatage du bâtiment (FUT-80) empêche probablement la règle « collecte identique » de jouer (§9).

## 1. Audit de l'existant

| Élément | Ce qui existait sur `main` (`82cbc171`) | Réutilisé |
|---|---|---|
| `src/lib/sites-sols.ts` (FUT-152) | Lecture **communale** des quatre inventaires : périmètre PLM et anciens codes, lots de 10 codes, pagination vérifiée (`lotIncomplet`), dédoublonnage, états `disponible / partiel / absent_dans_source / indisponible`, liens filtrés (`lienFicheSur`). Les géométries étaient jetées. | Oui. Le cœur de lecture est factorisé (`lireLignes`) : `lireCategorie` (page publique) est inchangé, `lireCategorieGeo` garde la géométrie. |
| `src/lib/server/sites-sols.ts` (FUT-152) | Appels `code_insee` seulement. | Oui. La même fonction `page` sert la recherche par point (`latlon`, `rayon`). |
| `src/lib/georisques-http.ts` (FUT-158) | `EN_TETES_GEORISQUES` (dont `Accept-Encoding: identity`), `tracerEchecGeorisques`. | Oui : les nouveaux appels passent par la même fonction `page`, donc par ces en-têtes et cette trace. Le garde-fou FUT-158 (`fut158-georisques-entetes.test.ts`) les couvre. |
| `/api/georisques-logement` | Fan-out parallèle ; Cartofriches chargé dans un rayon de 1 km ; aucune lecture SIS, SUP ou instruction. | Un appel de plus, derrière la parcelle, comme le bruit aérien. |
| Géométrie (FUT-81, FUT-146) | `geometrie-parcelle.ts` (Clipper, aires exactes, `regionMesurable`), conventions de rattachement (`point` / `repli` / `candidatsAuPoint`) et de part (2 % / 25 m²). | Oui, sans modification. |
| Couverture, versions | `deriveLogementCoverage`, `sourcesAbsentes`, `issueActualisation`, `pertesUrbanisme`. | Étendus (§5). |

## 2. La source officielle

**Service** : `https://georisques.gouv.fr/api/v1/ssp/{conclusions_sis|conclusions_sup|instructions}`, sans jeton, spécification OpenAPI v1 relue le 30/10/2026 (`/api/v3/api-docs/georisques-api-v1`). Recherche par `code_insee` (10 au plus), ou par `latlon` (« lon,lat ») et `rayon` (mètres, 10 000 au plus, 1 000 par défaut), paginée (`page`, `page_size`, `results`, `total_pages`). Chaque fiche porte `identifiant_ssp`, un nom, une adresse, `statut` (instructions : « En cours » ou « Clôturée »), `fiche_risque` (fiche BRGM), `date_maj` et `geom` (WGS84).

**Ce que la recherche par point fait réellement (mesuré)** :

| Question | Mesure | Conséquence |
|---|---|---|
| Distance au centroïde ou au tracé ? | Sotrameuse, bord à 2 m du point : `rayon=1` → rien, `rayon=3` → la fiche. Centroïde à 223 m. | Le rayon est une distance **au tracé**. C'est un préfiltre utilisable. |
| Les géométries | SIS et SUP : `MultiPolygon` (199 et 14 sur Paris, Lyon, Marseille, Metz). Instructions : 64 points sur 295, 2 sans géométrie (Metz). | Un point ne prouve aucune emprise ; une fiche sans géométrie ne se situe pas. |
| Les fiches ponctuelles dans une recherche par point | GIVAUDAN (Lyon) : absente d'une recherche à 10 m et à 100 m **de son propre point** ; à 1 km, seules des fiches à polygone sortent. | L'API ne rend jamais une fiche ponctuelle autour d'un point. Elles sont lues à la commune (§3). |
| Les doublons | 107 fiches répétées sous la ville et l'arrondissement : seule la commune diffère, la géométrie est identique. | Dédoublonnage par identifiant sûr ; deux géométries différentes sous un même identifiant rendent la catégorie `partielle`. |
| Les tracés | 35 périmètres sur 327 portent des anneaux d'aire nulle (`[a, a, b, a]`). 4 sont réellement invalides (RHODIACETA, BUIRE AUTOMOBILE, Lyon). | Anneaux nuls écartés (288 → 323 lisibles) ; les invalides restent « à vérifier » s'ils touchent le terrain. |
| Les positions ponctuelles | 61 instructions ponctuelles : 14 à moins de 20 m du géocodage de leur propre adresse, d'autres à plus d'un kilomètre. | Une distance à une fiche ponctuelle ne prouve rien. Seule l'adresse publiée est un fait. |
| Disponibilité | Le 30/10 vers 12 h 40 : `HTTP/2 INTERNAL_ERROR` sur toutes les requêtes pendant quelques minutes, puis des délais dépassés sur SIS et SUP à Marseille. | Les pannes réelles ont été vues ; elles donnent `indisponible` ou `incomplet`, jamais `aucun`. |

**Les six situations à distinguer**, et comment elles sortent :

| Situation | Issue |
|---|---|
| Intersection géométrique démontrée | `point_dans` (le point dans le périmètre) ou `parcelle_recoupe` (au moins 2 % de la parcelle attribuée) → **concerné** |
| Simple proximité d'une fiche | Jamais retenue. Le voisin d'un SIS (Metz 98, Lyon 14 Tony Garnier) → **aucun** |
| Localisation approximative | `localisation_ponctuelle` (point de la fiche dans la parcelle), `adresse_publiee` (fiche sans emprise publiée à cette adresse), `parcelle_incertaine` (parcelle par proximité ou sur une limite), `point_en_limite`, `parcelle_bordure`, `geometrie_illisible` → **à vérifier** |
| Absence après consultation complète | Trois inventaires et la liste communale lus en entier, parcelle attribuée → **aucun**, avec sa limite |
| Couverture incomplète | Un inventaire ou la liste communale non lus en entier → **incomplet** (ou la réserve « Non lus en entier » sous un résultat) ; parcelle non attribuable → **terrain non situé** |
| Source indisponible | Aucun inventaire lu → **indisponible** |

## 3. Arbitrages méthodologiques retenus

Aucune règle nouvelle n'a été inventée là où une convention validée existait. Les points ci-dessous sont à relire en contre-revue.

1. **Le grain de la preuve (FUT-81, FUT-146)**. La parcelle est **attribuée** seulement si l'adresse est géocodée au numéro, que son point tombe dans une parcelle et une seule, et que la parcelle se mesure. Trouvée par proximité (`repli`) ou sur une limite (`candidatsAuPoint > 1`), elle est **incertaine** : elle fonde un « à vérifier », jamais un « concerné ». C'est la règle du bruit aérien, la plus récente et la plus stricte.
2. **Point et parcelle n'ont pas la même portée.** « Cette adresse est dans… » (point) ; « La parcelle de cette adresse est (en partie) dans… » (parcelle). La part de la parcelle est dite, et le dépliable rappelle qu'une parcelle peut être bien plus grande que le logement.
3. **La part (convention du bruit aérien, FUT-146)** : recoupe à partir de 2 % ; bordure dite à partir de 25 m² ; en deçà, liseré de tracé non retenu. Mesuré à Lyon : les parcelles voisines d'un SIS en touchent 0,1 à 0,6 m². Les compter aurait mis tout le voisinage « à vérifier ».
4. **Le rayon de recherche** = le sommet de la parcelle le plus éloigné du point + 5 m (une marge technique de mesure, jamais affichée) ; sans parcelle, 5 m. Une parcelle qui exigerait plus de 10 km n'est pas utilisée.
5. **Les fiches sans emprise** (point ou rien) sont lues à la commune, avec arrondissements et anciens codes (périmètre de FUT-152). Leur point est confronté à la parcelle ; à défaut, leur **adresse publiée** est comparée à celle du logement : même numéro, même voie après normalisation, plage du même côté de la voie. Elles ne fondent qu'un « à vérifier ». Leur nombre borne toute absence (« 9 fiches de la commune n'ont pas d'emprise publiée… Aucune n'est publiée à cette adresse »).
6. **Une adresse géocodée à la voie** n'est pas un terrain : un périmètre qui contient le point de la voie est « à vérifier », et l'absence vaut pour le point seulement (« terrain non situé »).
7. **Exclusions tenues** : CASIAS, IREP et Cartofriches ne sont pas lus par la section, et le dépliable le dit. Aucun seuil de 50 m. Aucune distance n'est affichée, sauf celle du repli cadastral (« la plus proche, à 2 m »), qui décrit le rattachement de la parcelle et non un danger.
8. **Doctrine** : « Logement garde ce qui menace le bâti, Santé ce qui expose le corps » (board du 03/07/2026). La section parle du **statut du terrain** et de ce qu'il change à l'achat. Elle ne parle jamais d'exposition ni de santé (testé).

**Blocage documenté, non résolu par une règle inventée** : une instruction localisée par un point posé **hors** de la parcelle, et publiée à une autre adresse, n'est pas rapprochée du terrain. Aucune règle de distance ne serait défendable (§2) ; elle reste comptée parmi les fiches sans emprise.

## 4. Restitution éditoriale et juridique

**Textes vérifiés le 30/10/2026** (Code de l'environnement ; Légifrance étant protégé contre les robots, textes relus dans des reproductions officielles et recoupés) :

| Inventaire | Obligation réelle | Source |
|---|---|---|
| SIS | Le vendeur ou le bailleur informe par écrit l'acquéreur ou le locataire, et l'acte l'atteste. À défaut, recours possible dans les deux ans de la découverte d'une pollution qui rend le terrain impropre à sa destination. | L. 125-7 (version en vigueur depuis le 25/08/2021, loi n° 2021-1104), L. 125-6 |
| SIS | Un projet de construction ou de lotissement **soumis à permis de construire ou d'aménager** joint l'attestation d'une étude de sols par un bureau d'études certifié. Exceptions : lotissement déjà attesté, opération sous déclaration d'utilité publique. Rien n'est exigé d'un simple achat sans travaux. | L. 556-2, R. 556-2 |
| SUP | Restrictions d'usage instituées par arrêté préfectoral sur un terrain pollué ; annexées au plan d'urbanisme, elles s'imposent aux autorisations. Le contenu est celui de l'arrêté : il n'est pas résumé. | L. 515-12 ; annexes du PLU |
| Instructions | Aucune obligation attachée à l'inscription elle-même. | — |
| Tous | Le certificat d'urbanisme indique si le terrain figure sur la carte des anciens sites industriels. | L. 125-6 IV |

Depuis le 01/01/2023 (décret n° 2022-1289), l'information sur un SIS peut être remise dans un document **distinct** de l'état des risques (rapport du 120e Congrès des notaires). La proposition de texte du ticket (« l'information doit figurer dans l'état des risques ») n'est donc pas reprise. Aucune phrase ne mentionne l'état des risques (testé).

**Ordre de lecture** : le fait (titre, au grain où il est établi) ; les sites en cause (nom, situation, inventaire, date de mise à jour de la fiche, lien officiel) ; ce que cela change (obligations **propres** à l'inventaire, au conditionnel quand rien n'est démontré : « Si c'est le cas, … ») ; les limites ; « Ce que vous pouvez vérifier » ; le dépliable (définitions, méthode, exclusions, références). Une instruction qui double un SIS ou une servitude n'ajoute pas ses phrases.

**Interdits testés** sur les 17 cas réels et les cas construits : « logement pollué » ou « sain », « aucune pollution », exposition, santé, « obligatoire », « état des risques », CASIAS, IREP, friche au premier niveau ; obligations d'un SIS dites sans SIS, d'une servitude sans servitude ; toute distance autre que celle du repli cadastral.

Le texte n'a pas encore été relu par l'Editorial Writer, comme le ticket le prévoyait.

## 5. Modifications de code

| Fichier | Rôle |
|---|---|
| `src/lib/sites-sols.ts` | Cœur de lecture factorisé (`lireLignes`) ; `lireCategorieGeo` (géométrie gardée, contradiction de géométrie → `partiel`). `lireCategorie` inchangé. |
| `src/lib/server/sites-sols.ts` | `page` accepte une recherche par codes ou par point ; `getSitesSolsAutour` (3 appels), `lireSansEmprise` (lecture communale des fiches ponctuelles ou sans géométrie), `lireSitesSolsAdresse` (ne lève jamais). |
| `src/lib/sites-sols-etat.ts` | Types et règles de lecture **sans dépendance** (l'écran et la couverture n'embarquent pas Clipper) : `ficheDemontree`, `etatSitesSols`, calculés à la lecture et jamais enregistrés. |
| `src/lib/sites-sols-terrain.ts` | Plan de recherche, situation de chaque fiche, anneaux nuls, adresses publiées. Pur. |
| `src/lib/sites-sols-texte.ts` | Les phrases. Pur. |
| `src/app/api/georisques-logement/route.ts` | `sitesSolsP` derrière la parcelle, en parallèle du reste ; `sitesSols` posé dans le rapport et passé à la couverture. |
| `src/lib/logement-report-types.ts` | `sitesSols?: LectureSitesSols` (convention `fut157-2026-10-30`). Absent d'un rapport antérieur : rien ne s'affiche. |
| `src/lib/decision/logement-coverage.ts` | `sitesSols?: { coverage, etat }`, posé **seulement** quand la lecture est fournie. Le moteur de décision (`fetchLogementDecisionData`) ne la fournit pas : sa sortie est inchangée (testé). |
| `src/lib/logement-report-version.ts` | Sous-sources `sites_sols*` ; `pertesSitesSols` compare les deux rapports, comme l'urbanisme : un dossier antérieur reçoit la lecture même si Géorisques tombe, et une lecture complète ou à la parcelle attribuée ne cède pas la place à une lecture dégradée. Aucune date dans la lecture : deux collectes identiques gardent la même empreinte. |
| `src/components/report/logement/SitesSolsSection.tsx`, `sites-sols.module.css` | La section, dans la grammaire du Relevé (comme la fibre, FUT-156). Liens isolés à 44 px de haut sur écran tactile. |
| `src/components/report/LogementModule.tsx` | La section, après « Risques du bâti » ; libellés des sources muettes. |
| `src/app/dev/fut157/page.tsx` | Banc : les cas figés, rendus par les composants de production (404 en production). |
| `scripts/fut157/` | Capture des cas, rejeu, lecture réelle, coût, recherche de parcelles traversées, lisibilité des tracés, diagnostic d'une géométrie, recette navigateur. |
| `src/lib/logement-sources-bornees.test.ts` | Le compte des dépendances chaînées de la route passe de 7 à 8 (sols pollués derrière la parcelle). |

Aucune génération Anthropic : tout est déterministe. La synthèse rédigée n'est pas touchée (son empreinte ignore la lecture, testé).

## 6. Tests et contre-épreuves

**`src/lib/fut157-sites-sols-terrain.test.ts` : 67 tests.**

Dix-sept adresses réelles, rejouées hors réseau depuis les réponses brutes figées le 30/10/2026 (`src/lib/__fixtures__/fut157/cas.json`). L'attendu a été fixé avant le rejeu :

| Adresse | Issue | Pourquoi |
|---|---|---|
| 96 b et 94 a bd de la Solidarité, Metz | à vérifier | Point sur la voie ; parcelle Sotrameuse rattachée par proximité (2,1 et 2,5 m), couverte à 100 % |
| 98 bd de la Solidarité, Metz | aucun | SIS et instruction à moins de 42 m ; la parcelle BT 214 ne les touche pas |
| Boulevard Solidarité (voie), Metz | terrain non situé | Polygone à 2 m du point de voie ; une voie n'est pas un terrain |
| 13 rue des Alliés, Metz | concerné | Dans la servitude du dépôt BP-Total ; l'instruction du même dépôt, publiée à cette adresse, est pointée à 958 m (à vérifier) |
| 18 avenue Tony Garnier, Lyon | concerné | SIS CHIMICOLOR et instruction, point dedans |
| 14 avenue Tony Garnier, Lyon | concerné | Dans le SIS TOTAL Gerland ; CHIMICOLOR, voisin à un liseré, n'est pas listé |
| 50 rue Saint-Jean-de-Dieu, Lyon | concerné | Servitude de l'ancienne usine à gaz, 95 % de la parcelle |
| 5 rue du 3-Septembre-1944, Lyon | concerné | Point dehors, parcelle attribuée dedans (99,9 %) |
| 98 rue Saint-Pierre-de-Vaise, Lyon | concerné | Point dehors, parcelle traversée (7 %) |
| 38 rue Sainte-Anne-de-Baraban, Lyon | à vérifier | Parcelle rattachée par proximité (0,1 m) |
| 30 rue du Chapeau-Rouge, Lyon | à vérifier | Périmètre RHODIACETA invalide (anneaux qui se croisent) |
| 62 rue Paul-Cazeneuve, Lyon | à vérifier | Instruction GIVAUDAN pointée dans la parcelle, sans emprise |
| 56 rue Paul-Cazeneuve, Lyon | à vérifier | Instruction GIVAUDAN LAVIROTTE publiée au 56, pointée ailleurs |
| 64 rue de Grenelle, Paris | concerné | SIS et instruction AVIA-RASPAIL, toute la parcelle |
| 10 rue de Rivoli, Paris | aucun | Rien après lecture complète (Paris : 3 lots, 21 codes) |
| 9 av. Maurice-Chevance-Bertin, Marseille | concerné | SIS TLM, lisible une fois l'anneau nul écarté |

Cas construits : parcelle traversée, voisin au contact, liseré de 0,5 m², bordure de 30 m², point sur la limite, voie, deux parcelles au point, repli, parcelle illisible ou trop étendue, périmètre illisible proche ou lointain, anneau nul, fiche ponctuelle dans ou hors de la parcelle, fiche publiée à l'adresse, voie sans numéro ; une, deux ou trois sources en panne, liste communale absente ou partielle, total annoncé sans données, ligne sans identifiant, page tronquée, identifiant à deux géométries, réponse de forme inattendue ; adresses publiées (plages, listes, parenthèses, « face au ») ; couverture, versions, empreinte, câblage de la route, en-têtes FUT-158 ; rendu (rapport antérieur, liens, échappement d'un nom hostile et d'un lien `javascript:`).

**Mutations** : treize garde-fous retirés un à un (géométries contradictoires, portée de la voie, repli, limite, anneaux nuls, panne lue comme absence, liseré, fiches sans emprise, parité des plages, perte à l'actualisation, illisible ignoré, obligations SIS partout, limite lue comme dedans). Chacun fait échouer entre 1 et 7 tests.

**Comparaison avec les données officielles, pas seulement les mocks** : les attendus réels ont été établis indépendamment du code, par un script Python sur les géométries téléchargées (inclusion du point, distance au bord), puis par le vrai rattachement cadastral du dossier (`scripts/fut157/rattachement.mjs`).

## 7. Navigateur, non-régression, coût

**Recette navigateur** (`scripts/fut157/recette.mjs`, Chrome réel, vrai module Logement) : **261 vérifications, 0 échec**, à 1 440 px (souris et clavier), 390 px et 360 px (toucher). Neuf états (Sotrameuse, voisin, voie, SIS parisien, servitude lyonnaise, parcelle traversée, adresse publiée, panne partielle, panne totale) et un rapport antérieur, qui n'affiche rien.

Vérifié dans chaque cas : le texte attendu et les interdits ; aucun défilement horizontal ; la section tient dans la fenêtre ; cibles tactiles d'au moins 44 px ; toutes les cibles atteintes au clavier avec un focus visible ; « En savoir plus » s'ouvre à la touche Entrée ou au toucher ; aucune erreur de page. Captures dans `2026-10-30-fut157-sites-sols-terrain/`.

**Non-régression** : `tsc` 0 erreur ; `eslint` sur les fichiers touchés, 0 erreur. FUT-152, FUT-158, FUT-156, FUT-146, FUT-81, FUT-127 et versions Logement : 266 tests sur 266. **Suite complète (`--test-concurrency=1`) : 3 975 tests, 0 échec.** Deux garde-fous existants ont d'abord échoué, à raison, et ont été traités : les scripts de recette appelaient l'ancien géocodeur BAN (corrigé : `geocodeur-ban.ts`), et la route compte une dépendance chaînée de plus (`logement-sources-bornees.test.ts`, de 7 à 8). **Build de production** réussi ; aucun fichier client ne contient Clipper (la section n'importe que `sites-sols-etat.ts` et `sites-sols-texte.ts`).

**Coût mesuré** (`scripts/fut157/cout.mjs`, à froid, sans aucun cache) :

| Adresse | Autour du point | Lecture communale |
|---|---|---|
| Metz | 3 appels, 2 Ko, 170 ms | 3 appels, 21 Ko, 325 ms |
| Paris 7e | 3 appels, 2 Ko, 174 ms | 9 appels, 131 Ko, 1,35 s |
| Lyon 7e | 3 appels, 7 Ko, 125 ms | 6 appels, 226 Ko, 2,5 s |
| Marseille 15e | 3 appels, 9 Ko, 79 ms | 6 appels, 233 Ko, 2,1 s |
| Saintes, L'Abergement-Clémenciat | 3 appels, 0 Ko, 47 ms | 3 appels, 0 à 3 Ko, 60 ms |

Les deux lectures partent en parallèle, et en parallèle de tout le fan-out. En production, `fetch` est mis en cache une journée par URL : la lecture communale ne coûte qu'une fois par commune et par jour. Le délai par appel est de 8 s. L'API est gratuite, sans jeton, sans quota publié. Aucun appel Anthropic, aucune lecture ni écriture Supabase, aucun service payant.

## 8. Cartofriches : proposition de suppression du chargement

`georisques-logement` charge Cartofriches dans un rayon de 1 km (un appel par dossier). Le rapport le transporte, mais **aucun composant ne l'affiche**, aucune règle ne le lit, et la synthèse l'ignore. Il a pourtant un effet : une panne de Cartofriches met « friches » dans les sources absentes, et `issueActualisation` **refuse alors l'actualisation** d'un dossier dont la version précédente l'avait lu. Une source que personne ne lit peut donc bloquer la mise à jour des sources qu'on lit.

Un affichage « sous la même règle » n'est pas défendable : une friche ne dit pas une pollution avérée, et la seule qualification de pollution de Cartofriches est déclarative.

**Proposition (non appliquée, à arbitrer)** : retirer l'appel de la route, le champ `cartofriches` des nouveaux rapports et « friches » de `sourcesAbsentes`. Garder le type optionnel pour lire les rapports déjà enregistrés. La route `/api/cartofriches` et la lib peuvent rester pour un usage futur.

## 9. Signalés, hors périmètre

1. **`LogementSynthesis` affiche le HTML de la page de connexion si la session expire.** Sans session, `/api/synthesize-logement` répond 307 vers la connexion ; `fetch` suit la redirection, la réponse est `ok`, et le composant diffuse ce HTML comme synthèse. Ses jetons insécables élargissent alors **tout le module** à 3 828 px, coupé par un `overflow: hidden` (vu sur les bancs FUT-156 et FUT-157). Correctif probable : refuser `res.redirected` ou un `content-type` autre que texte. À traiter dans un ticket dédié.
2. **L'horodatage du bâtiment (FUT-80, `batiment.consulteLe`) entre dans l'empreinte du rapport.** Deux collectes identiques n'ont donc probablement jamais la même empreinte, et « Aucune donnée n'a changé depuis cette collecte » ne s'affiche plus. La lecture des sols ne porte aucune date pour ne pas aggraver ce point. À vérifier en contre-revue.
3. **Geste dans « À vérifier avant de décider »** : la section porte ses propres vérifications. Ajouter un geste au `DecisionChecklist` relèverait du moteur de décision, exclu de ce ticket.

## 10. Reproduire

```
node scripts/fut157/capturer-cas.mjs src/lib/__fixtures__/fut157/cas.json "<adresse>" [...]   # réseau
node scripts/fut157/rejouer.mjs                                                            # hors réseau
node scripts/fut157/lire.mjs --texte "<adresse>"                                           # chaîne réelle
node scripts/fut157/cout.mjs "<adresse>"                                                   # coût à froid
node --test src/lib/fut157-sites-sols-terrain.test.ts
BASE=http://localhost:3157 node scripts/fut157/recette.mjs                                 # avec next dev -p 3157
```
