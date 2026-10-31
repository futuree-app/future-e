# FUT-157 · Sites et sols pollués au terrain de l'adresse, dans Logement

30/10/2026 · branche `bonjourfuturee/fut-157-sites-sols-pollues-au-point` · base `main` `82cbc171` · non fusionnée, non déployée.

## En une minute

- **Le dossier Logement lit désormais, au terrain de l'adresse, les trois inventaires de l'État qui ont une portée sur un terrain** : secteurs d'information sur les sols (SIS), servitudes d'utilité publique (SUP) et sites suivis par l'administration (instructions, ex-BASOL). Une seule section, « Sols pollués sur ce terrain », à côté des risques du bâti. Rien dans Autour ni dans le comparateur.
- **Une intersection, jamais une distance.** L'API cherche autour d'un point : c'est un préfiltre. Chaque périmètre est confronté au point de l'adresse et à sa parcelle cadastrale. Aucun seuil de distance n'est affiché, et aucun ne décide de rien.
- **Le cas de référence ne dit pas ce que le ticket supposait.** Aucun des 25 numéros BAN du boulevard de la Solidarité (Metz) n'a son point dans le SIS Sotrameuse. Le 94 a, le 96 et le 96 b sont posés sur la voie, à 2 ou 3 m du périmètre, hors de toute parcelle ; le cadastre les rattache par proximité à des parcelles que le SIS couvre entièrement. Une recherche par rayon disait « dans le SIS », le point seul dirait « rien ». La section dit « à vérifier », avec la raison.
- **Une panne n'est jamais une absence.** Six issues distinctes : concerné, à vérifier, aucun (tout lu, à la parcelle attribuée), terrain non situé, incomplet, indisponible. Un résultat attesté est gardé si un autre inventaire tombe.
- **Deux défauts de la source, mesurés et traités** : 11 % des périmètres portent des « trous » d'aire nulle qui les rendaient illisibles ; et l'API ne rend **jamais** une fiche localisée par un simple point dans une recherche géographique (même à 10 m de son point).
- **Revue du 30/10 (§11)** : la preuve est désormais une **profondeur de 2 m**, et non plus les seuils du bruit aérien (2 %, 25 m²), qui se trompaient dans les deux sens face aux listes officielles de parcelles. Aucun recoupement n'est plus écarté pour sa petite taille. Les 327 périmètres se lisent (deux réparés à moins de 0,01 m²). Cartofriches n'est plus chargé. Les textes sont relus (éditorial et droit).
- **Coût** : 6 à 12 appels Géorisques gratuits par dossier, au plus 250 Ko, en parallèle du reste ; la lecture communale est mise en cache une journée. Aucun appel Anthropic, aucune écriture Supabase, aucun changement du moteur de décision.
- **Signalés à part (hors périmètre)** : la synthèse Logement affiche le HTML de la page de connexion si la session expire (§9, reproduit) ; l'horodatage du bâtiment (FUT-80) empêche la règle « collecte identique » de jouer (§9, reproduit). Cartofriches : retiré (§8).

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
| Les tracés | 35 périmètres sur 327 portent des anneaux d'aire nulle (`[a, a, b, a]`). 4 sont invalides (RHODIACETA, BUIRE AUTOMOBILE, Lyon) : des replis de quelques centimètres carrés. | Anneaux nuls écartés (288 → 323 lisibles), replis réparés à 0,1 m² au plus (327 sur 327, §11.2). Un tracé illisible qui peut toucher le terrain reste « à vérifier ». |
| Les positions ponctuelles | 61 instructions ponctuelles : 14 à moins de 20 m du géocodage de leur propre adresse, d'autres à plus d'un kilomètre. | Une distance à une fiche ponctuelle ne prouve rien. Seule l'adresse publiée est un fait. |
| Disponibilité | Le 30/10 vers 12 h 40 : `HTTP/2 INTERNAL_ERROR` sur toutes les requêtes pendant quelques minutes, puis des délais dépassés sur SIS et SUP à Marseille. | Les pannes réelles ont été vues ; elles donnent `indisponible` ou `incomplet`, jamais `aucun`. |

**Les six situations à distinguer**, et comment elles sortent :

| Situation | Issue |
|---|---|
| Intersection géométrique démontrée | `point_dans` (le point à plus de 2 m dans le périmètre) ou `parcelle_recoupe` (le périmètre entre de plus de 2 m dans la parcelle attribuée) → **concerné** (§11.1) |
| Simple proximité d'une fiche | Jamais retenue. Le voisin d'un SIS (Metz 98) → **aucun** ; un liseré sur la parcelle (Lyon 14 Tony Garnier, CHIMICOLOR) → **à vérifier**, jamais démontré |
| Localisation approximative | `localisation_ponctuelle` (point de la fiche dans la parcelle), `adresse_publiee` (fiche sans emprise publiée à cette adresse), `parcelle_incertaine` (parcelle par proximité ou sur une limite), `point_en_limite`, `parcelle_bordure`, `geometrie_illisible` → **à vérifier** |
| Absence après consultation complète | Trois inventaires et la liste communale lus en entier, parcelle attribuée → **aucun**, avec sa limite |
| Couverture incomplète | Un inventaire ou la liste communale non lus en entier → **incomplet** (ou la réserve « Non lus en entier » sous un résultat) ; parcelle non attribuable → **terrain non situé** |
| Source indisponible | Aucun inventaire lu → **indisponible** |

## 3. Arbitrages méthodologiques retenus

Aucune règle nouvelle n'a été inventée là où une convention validée existait. Les points ci-dessous sont à relire en contre-revue.

1. **Le grain de la preuve (FUT-81, FUT-146)**. La parcelle est **attribuée** seulement si l'adresse est géocodée au numéro, que son point tombe dans une parcelle et une seule, et que la parcelle se mesure. Trouvée par proximité (`repli`) ou sur une limite (`candidatsAuPoint > 1`), elle est **incertaine** : elle fonde un « à vérifier », jamais un « concerné ». C'est la règle du bruit aérien, la plus récente et la plus stricte.
2. **Point et parcelle n'ont pas la même portée.** « Cette adresse est dans… » (point) ; « La parcelle de cette adresse est (en partie) dans… » (parcelle). La part de la parcelle est dite, et le dépliable rappelle qu'une parcelle peut être bien plus grande que le logement.
3. ~~**La part (convention du bruit aérien, FUT-146)**~~ : remplacée le 30/10 par la profondeur de 2 m (§11.1). Les seuils de 2 % et 25 m² écartaient des parcelles que l'administration déclare concernées.
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

Relecture éditoriale (Editorial Writer) et juridique faites le 30/10 : §11.4.

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

**`src/lib/fut157-sites-sols-terrain.test.ts` : 67 tests au premier passage, 82 après la revue du 30/10 (§11.5).**

Dix-sept adresses réelles, rejouées hors réseau depuis les réponses brutes figées le 30/10/2026 (`src/lib/__fixtures__/fut157/cas.json`). L'attendu a été fixé avant le rejeu :

| Adresse | Issue | Pourquoi |
|---|---|---|
| 96 b et 94 a bd de la Solidarité, Metz | à vérifier | Point sur la voie ; parcelle Sotrameuse rattachée par proximité (2,1 et 2,5 m), couverte à 100 % |
| 98 bd de la Solidarité, Metz | aucun | SIS et instruction à moins de 42 m ; la parcelle BT 214 ne les touche pas |
| Boulevard Solidarité (voie), Metz | terrain non situé | Polygone à 2 m du point de voie ; une voie n'est pas un terrain |
| 13 rue des Alliés, Metz | concerné | Dans la servitude du dépôt BP-Total ; l'instruction du même dépôt, publiée à cette adresse, est pointée à 958 m (à vérifier) |
| 18 avenue Tony Garnier, Lyon | concerné | SIS CHIMICOLOR et instruction, point dedans |
| 14 avenue Tony Garnier, Lyon | concerné | Dans le SIS TOTAL Gerland (sa fiche cite BZ 244) ; CHIMICOLOR, qui ne touche la parcelle que d'un liseré de 0,1 m² et ne la cite pas, est dit « à vérifier » (revu le 30/10) |
| 50 rue Saint-Jean-de-Dieu, Lyon | concerné | Servitude de l'ancienne usine à gaz, 95 % de la parcelle |
| 5 rue du 3-Septembre-1944, Lyon | concerné | Point dehors, parcelle attribuée dedans (99,9 %) |
| 98 rue Saint-Pierre-de-Vaise, Lyon | à vérifier (revu le 30/10 ; avant : concerné) | 7 % de la parcelle, mais une bande de moins d'1 m de large ; la fiche ne cite pas BP 80 parmi ses 9 parcelles |
| 38 rue Sainte-Anne-de-Baraban, Lyon | à vérifier | Parcelle rattachée par proximité (0,1 m) |
| 30 rue du Chapeau-Rouge, Lyon | concerné (revu le 30/10 ; avant : à vérifier) | Périmètre RHODIACETA réparé (0,008 m²) ; point à 5,8 m à l'intérieur ; la fiche cite BT 141 |
| 62 rue Paul-Cazeneuve, Lyon | à vérifier | Instruction GIVAUDAN pointée dans la parcelle, sans emprise |
| 56 rue Paul-Cazeneuve, Lyon | à vérifier | Instruction GIVAUDAN LAVIROTTE publiée au 56, pointée ailleurs |
| 64 rue de Grenelle, Paris | concerné | SIS et instruction AVIA-RASPAIL, toute la parcelle ; le point est à 1 m de la limite : la preuve passe par la parcelle (revu le 30/10) |
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

**Appliqué le 30/10, sur accord de principe du porteur, dans un commit distinct de FUT-157** : voir §11.3.

## 9. Signalés, hors périmètre

1. **`LogementSynthesis` affiche le HTML de la page de connexion si la session expire.** Reproduit et proposé en ticket séparé le 30/10 (§11.6). Sans session, `/api/synthesize-logement` répond 307 vers la connexion ; `fetch` suit la redirection, la réponse est `ok`, et le composant diffuse ce HTML comme synthèse. Ses jetons insécables élargissent alors **tout le module** à 3 828 px, coupé par un `overflow: hidden` (vu sur les bancs FUT-156 et FUT-157). Correctif probable : refuser `res.redirected` ou un `content-type` autre que texte. À traiter dans un ticket dédié.
2. **L'horodatage du bâtiment (FUT-80, `batiment.consulteLe`) entre dans l'empreinte du rapport.** Confirmé le 30/10 (§11.6). Deux collectes identiques n'ont donc probablement jamais la même empreinte, et « Aucune donnée n'a changé depuis cette collecte » ne s'affiche plus. La lecture des sols ne porte aucune date pour ne pas aggraver ce point. À vérifier en contre-revue.
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

## 11. Revue du porteur du 30/10/2026 : derniers arbitrages

### 11.1 Les seuils géométriques : une profondeur de 2 m, plus de part ni d'aire

**La question.** Les seuils repris du bruit aérien (2 % de la parcelle pour « recouper », 25 m² pour une « bordure », un liseré plus petit écarté) avaient été faits pour d'autres données. Conviennent-ils aux SIS, aux servitudes et aux instructions ?

**L'oracle indépendant.** Chaque fiche officielle (SIS, SUP, instruction) publie un tableau « Parcelle(s) concernée(s) ». C'est la base réglementaire : la liste des SIS « précis[e] les parcelles concernées » (R. 125-24, 3°). `scripts/fut157/parcelles-officielles.mjs` lit ce tableau pour les 327 périmètres de Paris, Lyon, Marseille et Metz : 318 listes lues, 2 559 numéros déclarés. Il charge aussi les parcelles cadastrales de chaque emprise (API Carto) ; tout est gardé en cache dans `~/Documents/futuree-fut157/officielles/`. `profondeur.mjs` mesure ensuite, pour chaque parcelle recoupée, la **profondeur** du recoupement : la plus grande tolérance e pour laquelle le périmètre, rétréci de e (érosion exacte, Clipper), recoupe encore la parcelle. Chiffres complets : `officielles/analyse-seuils.txt`.

**Ce que montrent les données** (325 périmètres qui recoupent au moins une parcelle, 4 268 recoupements d'au moins 0,05 m²) :

| Profondeur atteinte (m) | 0 | 0,1 | 0,25 | 0,5 | 0,75 | 1 | 1,5 | 2 | 3 | 5 | 10 | 20 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| SIS, parcelles déclarées | 5 | 0 | 2 | 4 | 5 | 7 | 6 | 14 | 29 | 79 | 180 | 684 |
| SIS, non déclarées | 578 | 21 | 34 | 10 | 8 | 5 | 1 | **0** | 7 | 21 | 44 | 141 |
| SUP, déclarées | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 2 | 6 | 50 |
| SUP, non déclarées | 68 | 5 | 0 | 0 | 2 | 1 | 0 | 1 | 3 | 13 | 13 | 113 |
| Instructions, déclarées | 5 | 0 | 2 | 4 | 5 | 7 | 6 | 13 | 31 | 93 | 207 | 691 |
| Instructions, non déclarées | 686 | 22 | 37 | 11 | 10 | 8 | 1 | **0** | 11 | 23 | 53 | 177 |

(La colonne « 2 » compte les recoupements dont la profondeur est comprise entre 2 et 3 m.)

- Les recoupements de parcelles non déclarées forment deux populations : des liserés de moins de 2 m (578 SIS de moins de 10 cm), puis, **après un vide entre 2 et 3 m**, des emprises profondes. Ces dernières sont des parcelles renumérotées depuis la fiche : 358 des 2 559 numéros déclarés n'existent plus au cadastre. La liste officielle peut donc confirmer un recoupement, jamais l'exclure.
- **Les seuils de 2 % et 25 m² se trompaient dans les deux sens** :
  - ils **écartaient 8 parcelles déclarées** (14 recoupements) : CRE Lyon CH 321, 449, 452 et 501 (0,26 à 3,4 m²), Rebellet BK 92 (0,34 m²), La Charbonnière BV 18 (0,36 m²), Sylviana BH 57 (2,1 m²), Danzel CJ 9 (17,7 m², 3 m de profondeur) ;
  - ils disaient **« concernés » 81 recoupements** (38 de SIS) où le périmètre n'entre pas de 2 m : des parcelles de 1 à 266 m² couvertes le long d'une limite, et la bande de 7 % du 98 rue Saint-Pierre-de-Vaise, que la fiche ne cite pas.
- Une aire ou une part ne sépare pas ces populations : un liseré de 0,26 m² peut être déclaré, une parcelle de 2 m² couverte à 100 % le long d'une limite ne l'est pas. La profondeur les sépare.

**Décision appliquée** (`TOLERANCE_TRACE_M = 2`, `sites-sols-terrain.ts`) :

| Situation | Issue |
|---|---|
| Point de l'adresse à plus de 2 m à l'intérieur d'un périmètre valide, point dans la parcelle attribuée | **concerné** (`point_dans`) |
| Même point, mais parcelle trouvée par proximité, sur une limite, ou absente (contre-revue du 31/10) | **à vérifier** (`point_dans` gardé comme fait, non démontré) |
| Parcelle attribuée dans laquelle le périmètre entre de plus de 2 m | **concerné** (`parcelle_recoupe`), « en partie » avec la part si elle n'est pas entière (« moins de 1 % » sous 1 %), et le geste « regardez si la parcelle figure sur la liste de la fiche » |
| Recoupement de la parcelle attribuée de moins de 2 m de profondeur, **quelle que soit son aire** | **à vérifier** (`parcelle_bordure`), jamais écarté |
| Point sur la limite, ou dedans à moins de 2 m, sans parcelle qui tranche | **à vérifier** (`point_en_limite`) |
| Parcelle trouvée par proximité ou sur une limite | **à vérifier** (`parcelle_incertaine`), jamais la parcelle certaine de l'adresse |
| Contact sans surface : aire indiscernable de zéro à la précision du calcul (`mesureIntersection`, ≤ 10⁻³ m²) | rien |
| Intersection positive au-delà de cette précision, même sous 0,05 m² (contre-revue du 31/10) | **à vérifier** (`parcelle_bordure` ou `parcelle_incertaine`) |

Jusqu'au SHA 971e423a, le contact était « moins de 0,05 m² », et la seule parcelle déclarée en deçà (BC 208, Lyon Confluence, 0,007 m²) était supprimée. Elle est désormais « à vérifier » (§12).

Avec la nouvelle règle, aucune parcelle déclarée n'est plus écartée, et aucun recoupement de moins de 2 m n'est plus dit « concerné ». 29 parcelles déclarées d'un SIS, recoupées sur moins de 2 m, passent à « à vérifier », jamais à l'absence.

**SIS, SUP et instructions : une seule règle.** Leurs distributions sont les mêmes ; les instructions reprennent souvent le périmètre du SIS. Les 14 servitudes mesurées n'en montrent pas d'autre (un seul cas entre 2 et 3 m : NEXANS BN 200, 21 m² couverts en entier, « concerné »). Rien ne justifie une règle distincte.

**Le coût, assumé et dit.** Un SIS a en moyenne 4,8 parcelles voisines touchées par un liseré (23 au plus). Elles passent de « aucun » à « à vérifier ». Le texte le dit sans alarmer : « Ce peut n'être qu'un écart entre deux cartes… », puis donne le geste décisif : chercher la parcelle dans la liste de la fiche. **Option restante, non appliquée (décision produit)** : lire nous-mêmes cette liste, pour dire au lecteur si sa parcelle y figure. C'est un appel gratuit par fiche à vérifier, mais une page HTML à analyser et non une API. La liste confirme ; elle n'infirme pas (358 numéros obsolètes).

**Cas réels qui changent** (revus contre les listes officielles, un oracle indépendant de la géométrie) : 98 rue Saint-Pierre-de-Vaise (concerné → à vérifier ; BP 80 non citée), 30 rue du Chapeau-Rouge (à vérifier → concerné ; BT 141 citée), 14 avenue Tony Garnier (CHIMICOLOR désormais dit, à vérifier ; BZ 244 non citée par CHIMICOLOR, citée par TOTAL), 64 rue de Grenelle (concerné par la parcelle et non plus par le point, à 1 m de la limite).

### 11.2 Les quatre périmètres illisibles, et les 35 aux anneaux nuls

| Fiche | Inventaire | Localisation | Anomalie | Écart lacets / surface couverte |
|---|---|---|---|---|
| SSP00005690101 RHODIACETA | SIS | ZAC Saint-Pierre de Vaise, Lyon 9e (86 360 m² publiés) | Le trou de la partie 0 est un aller-retour de 30 m sur une ligne, qui se croise une fois (4,806983 ; 45,771504) | 0,0078 m² |
| SSP000056901 RHODIACETA | instruction | même tracé | même défaut | 0,0078 m² |
| SSP00005770101 SOCIÉTÉ NOUVELLE DE LA BUIRE AUTOMOBILE | SIS | 74 avenue Félix-Faure, Lyon 3e (2 945 m²) | Le contour se replie sur quelques centimètres au premier sommet (4,856611 ; 45,752617) | 0,0011 m² |
| SSP000057701 BUIRE AUTOMOBILE | instruction | même tracé | même défaut | 0,0011 m² |

Diagnostic : `scripts/fut157/croisements.mjs`. Ce sont des replis de quelques centimètres carrés nés de l'arrondi des coordonnées publiées (six décimales, une dizaine de centimètres).

**Traitement.** Un tracé qui n'est pas un polygone valide est remplacé par la surface qu'il recouvre (union Clipper), **seulement si** celle-ci ne s'écarte pas de plus de 0,1 m² de l'aire de ses anneaux (`TOLERANCE_REPARATION_M2`, `reparer` dans `geometrie-parcelle.ts`). Cette borne est inférieure aux plus petits recoupements déclarés (0,26 à 0,36 m²) : une réparation ne peut ni créer ni effacer un liseré que la liste contredirait. Au-delà, le tracé reste illisible. **Résultat : 327 périmètres lisibles sur 327.**

**Effet sur les adresses.** RHODIACETA recoupe 56 parcelles, dont 51 sur plus de 2 m ; BUIRE en recoupe 4, dont 2 sur plus de 2 m. Avant, toute parcelle de leur emprise élargie (112 et 16 parcelles) était « à vérifier, périmètre illisible ». Désormais, elles sont lues comme les autres. Parmi les 17 adresses réelles, une seule change : le 30 rue du Chapeau-Rouge, désormais « concerné », et sa fiche cite BT 141.

**Un périmètre illisible ne produit jamais « aucun »**, testé :
- un tracé illisible dont l'emprise touche la parcelle ou le point donne « à vérifier », même quand tout le reste est lu en entier, avec ou sans parcelle ;
- un tracé illisible dont **tous** les sommets sont loin est ignoré : quelle que soit sa forme, il reste dans leur emprise ;
- **défaut corrigé** : un sommet illisible était ignoré dans le calcul de l'emprise, qui pouvait alors se croire loin du terrain. Désormais, un seul sommet illisible suffit à compter le périmètre ;
- vingt formes illisibles construites (papillons de 1 à 100 m², parties superposées) : jamais « aucun », jamais « terrain non situé ».

**Les 35 périmètres aux anneaux nuls** (66 anneaux) : écarter ces anneaux change l'aire de 2·10⁻¹⁰ m², c'est-à-dire rien (`scripts/fut157/surfaces.mjs`, `~/Documents/futuree-fut157/surfaces-apres.json`). Contrôle externe : pour les 155 périmètres qui publient une superficie, notre aire, après nettoyage et réparation, s'en écarte de **0,12 % en médiane et de 0,63 % au plus**. Pour les périmètres aux anneaux nuls, l'écart maximal est de 0,23 %, comme les autres ; pour les deux réparés, il est de 0,19 et 0,20 %. Ces écarts tiennent à la projection et à l'arrondi, pas au nettoyage.

### 11.3 Cartofriches : chargement retiré (commit distinct de FUT-157)

- **Consommateurs** (`grep -rni "cartofriche\|friche" src scripts supabase`) : la route le chargeait et le posait dans le rapport ; `sourcesAbsentes` en faisait une source ; `LogementModule` en nommait l'absence. Aucun composant, aucune règle, aucune décision, aucune couverture et aucune synthèse ne le lisaient (`logement-synthesis-cache` l'écartait déjà). `/api/cartofriches` n'est appelé par aucun écran.
- **Le défaut reproduit** (`scripts/fut157/cartofriches-refus.mjs`, sur `5ba4dcaa`) : une version N avec Cartofriches, puis une collecte N+1 où seul Cartofriches tombe et où une autre donnée change. Résultat : `{"sourcesAbsentesN1":["friches"],"issue":"refusee"}`. Après le retrait : `{"sourcesAbsentesN1":[],"issue":"nouvelle_version"}`.
- **Modifié** : l'appel retiré de la route ; « friches » retiré de `sourcesAbsentes` ; le champ du type gardé et marqué historique ; le libellé « friches (Cartofriches) » gardé pour les versions qui l'ont noté absent ; le test de la route mis à jour (elle n'appelle plus Cartofriches). La lib et ses tests de délai restent, pour `/api/cartofriches`.
- **Rapports historiques** (testé) : une version enregistrée avec `cartofriches` et « friches » dans ses sources absentes se relit telle quelle. Son actualisation n'est pas refusée faute de friches. La première actualisation crée une nouvelle version, l'empreinte ayant changé, ce qui est attendu.
- **Aucun changement transversal** : la route, la version, le type, un libellé et deux tests.

### 11.4 Relecture éditoriale et juridique

Rapport de l'Editorial Writer : `docs/rapports-agents/editorial-writer/2026-10-30-fut157-sites-sols.md`. Ses 3 points bloquants, 12 importants et 10 mineurs ont été appliqués, sauf ceux notés ci-dessous.

- **Surtitre** : « Pollution des sols sur ce terrain » (un sujet, pas un constat, puisqu'il s'affiche aussi au-dessus d'une absence ou d'une panne).
- **Le premier mot porte l'état** : « Le terrain n'a pas pu être situé : rien ne peut être conclu pour lui… » ; « Aucun des trois inventaires de sols pollués consultés ne concerne la parcelle de cette adresse. »
- **Inventaires distingués** : la servitude n'est plus placée « dans » le SIS. « Site suivi par l'administration pour une pollution des sols » (et non « site pollué » : la pollution peut n'être que suspectée). « Suivi en cours / terminé » remplace « instruction en cours / clôturée ».
- **Le locataire** n'est plus oublié : « vendeur ou bailleur » dans chaque geste.
- **Un site déclaré à l'adresse, ou repéré dans la parcelle**, a un titre propre : « … est déclaré à cette adresse. On ne sait pas jusqu'où il s'étend : c'est à vérifier. »
- **Liseré** : « Ce peut n'être qu'un écart entre deux cartes, qui ne se superposent pas au mètre près : la carte seule ne permet pas de trancher. » La version précédente disait « le plus souvent », une fréquence non mesurée et rassurante.
- **Le geste décisif dans futur•e** : la liste des parcelles de la fiche, en nommant la fiche et la parcelle (« La fiche officielle « CHIMICOLOR » liste les parcelles concernées : regardez si la parcelle BZ 244 en fait partie »). Il est aussi proposé quand un SIS ne couvre qu'une partie de la parcelle. Pour une adresse sans numéro : « refaites la recherche avec l'adresse complète ».
- **Exposition** : « Ces inventaires disent ce que l'administration sait du sol, pas ce à quoi les occupants sont exposés. » La phrase est visible dès qu'un site est signalé (c'est la première question d'un acheteur) et repliée sinon. Elle est la seule mention de l'exposition, et elle dit ce que l'inventaire ne mesure pas (testé).

**Droit, relu dans le texte** (extrait officiel de la préfecture de Lozère, reproductions OPPBTP, en plus des sources du §4) :

| Point | Avant | Après |
|---|---|---|
| L. 556-2 al. 1 et 2 | « un projet … soumis à permis devra comporter l'attestation… » | Tout projet de construction ou de lotissement dans un SIS fait l'objet d'une étude des sols ; l'attestation d'un bureau certifié est exigée « en principe » pour un permis (deux exceptions : lotissement déjà attesté, DUP) |
| L. 125-7 al. 2 | absent | Dans le dépliable, seulement si un SIS est en cause : sans information écrite, et si une pollution rend le terrain impropre à l'usage prévu, résolution, restitution d'une partie du prix ou baisse du loyer dans les deux ans de la découverte. Texte relu, et non cité de mémoire |
| L. 514-20 | absent | Instructions, au conditionnel, pour la vente seulement : « Si une installation classée soumise à autorisation ou à enregistrement a été exploitée sur ce terrain, le vendeur doit toutefois vous en informer par écrit. » L'inscription ne le prouve pas |
| Servitude | « s'impose aux autorisations d'urbanisme » (jargon) | « Lesquels : c'est l'arrêté du préfet qui le dit, à lire depuis la fiche. Tout permis de construire ou de travaux doit le respecter. » Le contenu de l'arrêté n'est jamais résumé |
| Certificat d'urbanisme | « … sur la carte des anciens sites industriels » | « … carte des anciennes activités industrielles et de services » (L. 125-6 IV) |

**Non appliqués, à trancher** :
1. En `incomplet`, dire l'absence partielle (« les autres inventaires ont été lus en entier : aucun SIS… »). La prudence est gardée (« ce terrain n'a pas pu être vérifié en entier »), parce qu'une absence partielle est une décision de doctrine, pas de style.
2. Afficher dans futur•e la description de la fiche officielle (polluants, activité passée) : décision produit.
3. Lire nous-mêmes la liste des parcelles des fiches (§11.1).

### 11.5 Tests et contre-épreuves après la revue

- `fut157-sites-sols-terrain.test.ts` : **82 tests** (67 avant). Ajouts : les cas de profondeur, chacun en défaut sous les anciens seuils (liseré de 0,5 m², bande de 1,5 m à 7,5 %, emprise de 36 m² au cœur d'un hectare, contact) ; les trois inventaires sous la même règle ; le point à moins de 2 m ; le périmètre illisible (touche, loin, sommet illisible, réparable ou non, vingt formes) ; la réparation de RHODIACETA bornée à 0,01 m² ; les textes relus (titres, liste des parcelles, recours de L. 125-7 seulement pour un SIS, L. 514-20 jamais pour un bailleur, exposition).
- `logement-report-version.test.ts` : deux tests Cartofriches (absence non comptée, rapports historiques relus).
- **Mutations** : 20 garde-fous retirés un à un (`~/Documents/futuree-fut157/scripts/mutations.py`), tous détectés. Parmi eux, 8 nouveaux : tolérance à 0 (11 échecs), retour au seuil de 2 % (5), liseré écarté (8), point près de la limite lu dedans (3), sommet illisible ignoré (1), réparation sans borne (1), réparation retirée (3), « friches » redevenue une source absente (1).
- **Recette navigateur** (`scripts/fut157/recette.mjs`, vrai module Logement, Chrome) : 12 états, dont 4 nouveaux (bande de moins de 2 m, liseré CHIMICOLOR, RHODIACETA réparé, site déclaré à l'adresse) et le rapport antérieur, à 1 440 px, 390 et 360 px. **378 vérifications sur 378.** Le premier passage a relevé une erreur de page isolée à 360 px (`Cannot read properties of null (reading 'sequence')`) ; elle ne s'est reproduite ni en 12 chargements ciblés du même cas, ni au passage complet suivant, et rien n'apparaît dans le journal du serveur. Elle vient vraisemblablement du runtime de développement, mais ce n'est pas démontré. Un premier passage avait aussi compté des sections absentes à 360 px avant leur rendu ; la recette attend désormais la section avant de compter.
- **Non-régression** : `tsc` 0 erreur ; `eslint` sur les fichiers touchés, 0 erreur et 0 avertissement (4 variables inutilisées des scripts du premier passage retirées). Voisins (FUT-81, 127, 146, 152, 156, 157, 158, géométrie, versions Logement) : 520 sur 520. **Suite complète (`--test-concurrency=1`, motifs de `npm test`) : 3 992 tests, 0 échec** (3 975 + 15 FUT-157 + 2 Cartofriches). **Build de production** réussi ; aucun fichier client ne contient Clipper.
- Moteur de décision : `git diff origin/main -- src/lib/decision` ne touche que `logement-coverage.ts` (le champ optionnel `sitesSols`, inchangé depuis `5ba4dcaa`). `fetchLogementDecisionData` ne fournit pas la lecture : sa sortie est inchangée (testé).
- **Compatibilité** : `main` est toujours à `82cbc171`. La PR #111 (FUT-149, `87c1cca2`) touche aussi la route et `LogementModule.tsx`. Une fusion simulée (`git merge-tree`) donne **deux conflits mécaniques**, déjà présents sur `5ba4dcaa` : chaque branche ajoute une source au même `Promise.all` de la route, et au compte des dépendances chaînées de `logement-sources-bornees.test.ts`. La branche fusionnée en second les résout en gardant les deux sources. FUT-149 n'est pas modifié.

### 11.6 Défauts hors périmètre : reproduits, proposés en tickets

Les deux propositions détaillées : `~/Documents/futuree-fut157/tickets-hors-perimetre.md`.

- **A. Session expirée** (gravité haute). `requireCurrentUser` (`src/lib/user-account.ts:14`) fait `redirect("/connexion")` dans les routes d'API (11 routes). Reproduit le 30/10 : `POST /api/synthesize-logement` sans session répond `307 location: /connexion` ; suivi comme le fait `fetch`, il donne `200 text/html`, 41 974 octets, que `LogementSynthesis.tsx` diffuse comme synthèse (débordement à 3 828 px).
- **B. Empreinte et heure du RNB** (gravité moyenne). Reproduit par `scripts/fut157/empreinte-batiment.mjs` : deux collectes aux faits identiques, à 5 minutes d'écart, ont deux empreintes différentes (`6dbd1808` ≠ `5ea77111`), et l'actualisation écrit une version 2 au lieu de répondre « identique ». La synthèse n'est pas touchée : son cache dépend de l'empreinte des faits, sans `batiment`.


## 12. Contre-revue indépendante du 31/10/2026 (SHA refusé 971e423a)

Trois défauts, corrigés sans changer le reste de la règle. Reproductions : `src/lib/fut157-contre-revue.test.ts`, 24 tests, dont 13 échouent au SHA refusé.

**1. Le point dans un SIS ne dit pas le terrain si la parcelle est incertaine.** `point_dans` démontrait le terrain dès que le point était à plus de 2 m à l'intérieur, même posé sur la voie et rattaché par proximité à une parcelle voisine HORS du SIS. Désormais `ficheDemontree` (`sites-sols-etat.ts`) exige la parcelle attribuée. Le fait géographique est gardé (`point_dans`) ; le texte le dit, puis ce qui manque (« sur le plan cadastral il ne tombe dans aucune parcelle. La plus proche, à 3 m, est hors de ce périmètre… »). La règle est dérivée à la lecture : une lecture enregistrée sous `fut157-2026-10-30b` est relue avec elle. Les 17 adresses réelles ne changent pas : aucune n'était dans ce cas.

**2. Une intersection positive sous 0,05 m² n'est plus supprimée.** Le seuil `SURFACE_CONTACT_M2` (FUT-81) écartait toute intersection plus petite. La frontière est maintenant la précision du calcul lui-même (`mesureIntersection`, `geometrie-parcelle.ts` : l'écart d'arrondi au micromètre que Clipper admet, `ecartAdmis`). Ce n'est pas une règle réglementaire nouvelle : en deçà, l'aire ne se distingue pas de zéro. `aireIntersection` est inchangée pour FUT-81 et FUT-146. Contre-épreuve sur les 327 périmètres et leurs listes officielles (`scripts/fut157/contacts-infimes.mjs`, cache du 30/10) :

| Classe | Déclarées par la fiche | Non déclarées |
|---|---|---|
| Contact (aire ≤ incertitude, au plus 8,3·10⁻⁴ m²) | 0 | 27 |
| Infime (au-delà, sous 0,05 m²) : supprimée avant, « à vérifier » désormais | 2 (BC 208, SIS et instruction) | 433 |
| Au-delà de 0,05 m² (inchangé) | 2 140 | 2 128 |

Aucune parcelle déclarée n'est un contact. Coût : 433 recoupements infimes non déclarés passent de « aucun » à « à vérifier ». C'est le coût que la contre-revue a demandé d'assumer.

**Parcelle officiellement désignée : non lue à l'exécution.** L'API ne publie pas la liste des parcelles ; elle n'est que sur la fiche HTML. Elle sert ici d'oracle hors ligne. Au lecteur, elle reste le geste proposé (« regardez si la parcelle … en fait partie »).

**3. Une panne partielle de la lecture communale ne vide plus les fiches.** `lireSansEmprise` rendait `{ indisponible, [] }` dès qu'un inventaire était en panne. L'assemblage est maintenant pur et testé (`assemblerSansEmprise`) : les fiches lues sont gardées ; l'état est `partiel` dès qu'un inventaire manque ou est tronqué, `indisponible` seulement si aucun n'a répondu. Sans fiche, l'état reste `incomplet`, jamais `aucun`, et la phrase « aucun n'est déclaré à cette adresse » n'est dite que sur une liste complète. Huit combinaisons sont testées par appels simulés au vrai module serveur.

Recette en vrai Chrome (`scripts/fut157/recette.mjs`) : 16 cas × ordinateur 1440, mobile 390 et 360, 507 vérifications. Les quatre nouveaux cas du banc `/dev/fut157` sont `voie-dans-sis`, `infime`, `communal-partiel` et `incomplet`. Leurs captures sont dans `2026-10-31-fut157-contre-revue/`.
