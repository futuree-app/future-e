# FUT-16, phase 0 : les scores synthétiques hérités dans le contexte d'AskFuture

> Audit et proposition de correction. **Aucun code produit modifié.** Branche
> `bonjourfuturee/fut-16-retirer-les-scores-synthetiques-assistant`, partie de `main` `8792b56b`
> (FUT-37 inclus). Aucun fichier de FUT-33 touché.
>
> Doctrine du ticket : **un score synthétique ne devient pas un fait parce qu'il est fourni au modèle.**

Méthode : lecture de `src/app/api/ask/route.ts` et de tout ce qui l'alimente ; lecture de la migration
et des trois scripts qui remplissent `communes_tension` ; **lecture de la table en production** (requêtes
SQL en lecture seule, 02/10/2026) ; **recalcul** de chaque ligne climat à partir de
`public/data_climat.json` ; **reconstruction exacte** du bloc `DONNÉES TERRITORIALES DISPONIBLES` pour neuf
communes (fonctions de la route extraites telles quelles, `gatherCommuneEnrichment` réel) ; **trois appels
contrôlés** à Claude avec le prompt système exact d'AskFuture.

---

## 1. Résumé exécutif

**`communes_tension` ne contient aucune information que le contexte d'AskFuture ne porte pas déjà sous
une forme plus juste, et un tiers de ses lignes climat est faux.**

1. **Ce ne sont pas des indices de vulnérabilité ni d'adaptation.** La migration annonce
   « vulnérabilité socio-économique » et « capacité d'adaptation locale ». Le script de calcul y range en
   réalité des **colonnes DRIAS normalisées** : pour la canicule, « vulnérabilité » = nuits tropicales,
   « adaptation » = température moyenne d'été inversée ; pour les feux, « vulnérabilité » = jours de sol
   sec, et « adaptation » = **la même colonne inversée**. Pour la dépendance automobile, « exposition » =
   part des trajets domicile-travail motorisés (ADEME), et « occurrence » = **une copie du score**. Le
   `score` est la moyenne de ces quatre nombres. Aucun des cinq champs ne mesure ce que son nom annonce.
2. **Un tiers des lignes climat est faux.** Un lot écrit le 09/05/2026 contient 50 lignes « feux » (des
   communes de l'Ain, où l'indice forêt-météo vaut 3 à 10 jours par an) notées **exposition 100, score 75**,
   et 49 lignes « sécheresse » notées **exposition 1** là où DRIAS compte 160 à 190 jours de sol sec.
   Les autres lignes ont été calculées sur un ancien millésime : 0 ligne « sécheresse » sur 99, 12 « feux »
   sur 100 et 18 « canicule » sur 68 se recalculent à l'identique aujourd'hui.
3. **Le modèle reçoit le score ET la mesure, et il croit le score.** À Bourg-en-Bresse, le même prompt
   contient « feux : score 75 (exposition 100 …) » et « Jours risque feu (IFM > 40) : 3.5 j ». Claude a
   répondu : « exposition maximale (100/100) … le territoire présente des conditions favorables à
   l'éclosion de feux (Source : référentiel interne futur•e) ». À Monteux, il a conclu à partir d'une ligne
   corrompue que « le territoire n'est pas structurellement parmi les plus exposés » à la sécheresse, alors
   que le même prompt annonce 172 jours de sol sec. À Nice, il a fabriqué un classement : « l'une des plus
   faibles des territoires futur•e (score 19) ».
4. **La couverture est arbitraire.** 1 193 communes sur ~35 000 ont au moins une ligne (le top 50 par
   risque, le top 200 des villes pour la mobilité, 35 lignes de submersion dont des saisies manuelles).
   La présence d'une ligne est elle-même un classement implicite.
5. **Un seul chemin atteint un modèle** : `buildCommuneContext()` dans `/api/ask`. Le pré-warm
   `/api/ask/context` ne lit pas la table ; l'historique de conversation n'est pas rechargé depuis la base ;
   aucune autre route modèle (`/qna`, synthèses du comparateur, Territoire, Logement, conclusion) ne lit
   `communes_tension`.

**Recommandation** : retirer entièrement `communes_tension` du contexte AskFuture (décision A), sans
remplacement verbal, et cesser de mentionner l'existence de « scores de tension » (décision E). Toute
l'information utile est déjà dans les blocs DRIAS, ADEME, Géorisques et GASPAR du même prompt. Extraire le
contexte dans une petite fonction pure pour tester le `system` réellement envoyé (décision F).

**Bilan de l'inventaire** : 13 fichiers de code lisent ou écrivent la table (9 dans `src/`, 3 scripts,
1 migration) ; **1 seul atteint un modèle**. Statuts des cinq champs dans AskFuture : **5 🔴**.

---

## 2. Architecture actuelle d'AskFuture

```
AskFutureMount / AskFutureInlineMount (serveur : droits, quota)
  └─ AskFuture.tsx (client) ── POST /api/ask { messages[], communeInsee, communeName, sessionId }
                             ── GET  /api/ask/context?insee=  (pré-warm : ne renvoie que des booléens)

POST /api/ask
  ├─ auth, plan, quota, droit sur le territoire (canAccessTerritory)
  ├─ Promise.all
  │    ├─ buildCommuneContext(insee, supabase)
  │    │     ├─ communes_categorization (44 communes saisies) sinon deriveCategories(insee) (préfixe dépt)
  │    │     └─ communes_tension (slug, score, ind_exposition, ind_vulnerabilite, ind_adaptation, ind_occurrence)
  │    └─ gatherCommuneEnrichment(insee)
  │          ADEME (commune + IRIS), DRIAS, Hub'Eau, VigiEau, Géorisques, GASPAR CatNat, littoral, baignade
  ├─ formatEnrichmentBlock()  (le littoral est lu mais n'est pas mis en forme)
  ├─ buildUserProfileText(user_profiles)
  └─ anthropic.messages.create({ model: claude-sonnet-4-6, system: SYSTEM_PROMPT_BASE + données + profil,
                                 tools: futuree_reply, messages: <historique envoyé par le client> })
```

## 3. Chemin exact jusqu'au modèle

`route.ts`, assemblage du `system` :

```
${SYSTEM_PROMPT_BASE}

DONNÉES TERRITORIALES DISPONIBLES — ${communeName} (INSEE ${communeInsee})

[Référentiel interne futur•e]
${communeContext}                         ← buildCommuneContext
${hasTensionData ? "" : "\n(Pas de scores de tension détaillés en base interne pour cette commune.)"}

${enrichmentText}                         ← ADEME, DRIAS, Géorisques, GASPAR, VigiEau, Hub'Eau, baignade
${!anyEnrichmentData && !hasTensionData ? "\nIndication : aucune donnée détaillée …" : ""}

PROFIL UTILISATEUR CONNU
${profileText}
```

et `buildCommuneContext` produit, quand des lignes existent :

```
Tensions territoriales (table communes_tension, scores et indicateurs sur 100) :
- <slug> : score <score> (exposition <e>, vulnérabilité <v>, adaptation <a>, occurrence <o>)
```

Quand aucune ligne n'existe, la commune reçoit **deux fois** la même phrase : « Pas de scores de tension
détaillés disponibles dans futur•e pour cette commune. » (dans `buildCommuneContext`) puis « (Pas de scores
de tension détaillés en base interne pour cette commune.) » (dans la route). Le modèle apprend ainsi que
futur•e possède des scores de tension, et qu'il en manque ici.

Le commentaire de tête de la route annonce encore le périmètre : « on s'appuie uniquement sur les données
futur•e disponibles (communes_categorization, communes_tension, user_profiles) ».

## 4. Inventaire de tous les usages de `communes_tension`

| # | Fichier | Usage | Atteint un modèle ? | Statut FUT-16 |
|---|---|---|---|---|
| 1 | `src/app/api/ask/route.ts` (`buildCommuneContext`) | lit les 5 champs, les écrit dans le `system` | **oui** | 🔴 à supprimer |
| 2 | `src/app/api/wizard-preview/route.ts` | lit `score, ind_exposition, ind_vulnerabilite`, renvoie au navigateur | non | ⚪ (ticket séparé) |
| 3 | `src/components/wizard/WizardTeaser.tsx` (consomme #2) | affiche « Score X/100 · exposition élevée » et « Signal officiellement recensé dans votre territoire » | non | ⚪ (ticket séparé, problématique) |
| 4 | `src/app/(public)/chaleur/[insee_code]/page.tsx` | lit seulement `nom_commune, departement` (identité) | non | ⚪ (inoffensif) |
| 5 | `src/app/(public)/chaleur/villes-les-plus-exposees/page.tsx` | affiche « Score tension /100 » ; les scores (91, 87…) sont **écrits en dur**, la base plafonne à 71 | non | ⚪ (ticket séparé) |
| 6 | `src/app/(public)/inondation/[insee_code]/page.tsx` | lit `score` comme score côtier altimétrique (quand `ind_exposition` est null) | non | ⚪ |
| 7 | `src/app/(public)/inondation/villes-les-plus-exposees-submersion/page.tsx` | classement par `score` de submersion | non | ⚪ (ticket séparé) |
| 8 | `src/app/(public)/j-utilise-beaucoup-ma-voiture/villes-les-plus-dependantes/page.tsx` | classement par `score` dépendance auto | non | ⚪ (ticket séparé) |
| 9 | `src/components/LocalTensionContext.tsx` | lit la table ; **monté nulle part** (code mort) | non | ⚪ |
| 10 | `scripts/populate-communes-tension.js` | écrit canicule, feux, sécheresse, (submersion DRIAS) | non | ⚪ |
| 11 | `scripts/populate-coastal-submersion.js` | écrit submersion (altimétrie) | non | ⚪ |
| 12 | `scripts/populate-dependance-auto.js` | écrit dependance-auto (ADEME) | non | ⚪ |
| 13 | `src/lib/supabase/migrations/001_communes_tension.sql` | définition de la table | non | ⚪ |

Documents qui la qualifient déjà de legacy : `docs/vault/adr/ADR-0001-pas-de-score-synthetique.md`,
`docs/vault/arbitrages/comparateur-un-moteur-trois-portes.md` (« legacy `communes_tension` jeté »),
`docs/vault/modules/comparateur.md`, rapports agents du 29/06 (data-curator, discoverability,
business-strategist).

## 5. Origine et calcul de `score`

Trois scripts, trois formules, un même champ :

| Slug | Script | Formule du `score` |
|---|---|---|
| `canicule`, `feux`, `secheresse` | `populate-communes-tension.js` | moyenne simple des 4 sous-indices (chacun = une colonne DRIAS gwl20 normalisée par un maximum arbitraire) |
| `submersion` (variante DRIAS) | idem | moyenne **pondérée** (3 / 1 / 0,5 / 0,5) de 4 colonnes de pluie |
| `submersion` (variante côtière) | `populate-coastal-submersion.js` | `max(0, 100 − altitude × 100/15)`, altitude minimale de 5 points échantillonnés (OpenTopoData EU-DEM) |
| `submersion` (manuelle) | aucune | « scores manuels » saisis à la main (le script cite Gravelines 92, Dunkerque 86) |
| `dependance-auto` | `populate-dependance-auto.js` | moyenne de 3 composantes : part des trajets motorisés, transports en commun inversés (×3,5), densité inversée (/3 000) |

Les deux premiers scripts **n'écrasent jamais un score existant plus élevé** (« GREATEST »). Une même
ligne peut donc mélanger un score d'une méthode et, dans le cas de la submersion, des sous-indices
vidés par une autre.

- **Agrégat composite** : oui, de 3 à 4 grandeurs hétérogènes (jours, nuits, °C ; ou %, %, hab/km²).
- **Normalisation** : min-max sur des bornes choisies à la main (« max ~120 j/an »), non documentées.
- **Percentile** : non.
- **Comparable entre slugs** : non (méthodes différentes). **Entre communes** : seulement au sein d'un
  slug et d'un lot, et pas entre deux lots (§13).
- **Sens autonome d'un « 72/100 »** : aucun. Aucune source compréhensible ne s'y rattache directement.

**Verdict : 🔴 à supprimer.** C'est exactement le score composite qu'ADR-0001 interdit.

## 6. `ind_exposition`

| Slug | Colonne | Normalisation |
|---|---|---|
| canicule | jours > 30 °C (`NORTX30D_yr`) | /120 |
| feux | jours IFM ≥ 40 (`NORIFM40_yr`) | /60 |
| sécheresse | jours de sol sec (`NORSWI04_yr`) | /200 |
| submersion DRIAS | « p99 » lu dans `column15`, qui est en réalité `NORRx1d_yr` (décalage d'un rang par rapport au mapping canonique de `drias-json.ts`) | /150 |
| submersion côtière | null | |
| dependance-auto | part des trajets domicile-travail motorisés (ADEME `taux_motor_glob`, moyenne simple des IRIS appariés **par nom de commune**) | borné à 100 |

C'est **une mesure réelle normalisée** (pas un assemblage) pour chaque slug, mais rebaptisée
« exposition » et privée de son unité. Toutes ces mesures sont **déjà dans le prompt** sous leur vrai nom
et leur vraie unité (bloc DRIAS ; ligne ADEME « Actifs utilisant un mode motorisé pour aller travailler »,
qui lit **le même champ** `taux_motor_glob`).

**Verdict : 🔴 à supprimer** (catégorie A : doublon déformé d'une mesure présente).

## 7. `ind_vulnerabilite`

| Slug | Ce qu'il contient vraiment |
|---|---|
| canicule | nuits tropicales /60 |
| feux | jours de sol sec /180 |
| sécheresse | jours de sol sec /200 (**identique à `ind_exposition`**) |
| submersion DRIAS | pluie d'hiver /500 |
| dependance-auto | part des transports en commun, inversée et multipliée par 3,5 |

Aucune variable socio-économique, contrairement au commentaire de la migration. Claude, lui, en fait une
caractéristique du territoire : à Bourg-en-Bresse, il interprète « vulnérabilité 1/100 » comme reflétant
« un taux de boisement mesuré à 17,1 % seulement ». C'est une invention, construite sur un champ mal nommé.

**Verdict : 🔴 à supprimer** (A pour le climat : la mesure est dans DRIAS ; A pour la mobilité : « Usage
transports en commun (%) » est dans le bloc ADEME).

## 8. `ind_adaptation`

| Slug | Ce qu'il contient vraiment |
|---|---|
| canicule | température moyenne d'été, inversée sur [20 ; 40] °C |
| feux | jours de sol sec inversés (**le complément exact de `ind_vulnerabilite`**) |
| sécheresse | température moyenne d'été inversée |
| submersion DRIAS | cumul annuel de pluie /2 000 |
| dependance-auto | densité inversée (100 − densité/30) |

Rien ne mesure une capacité d'adaptation. Pour la mobilité, une ville dense obtient « adaptation 0 » (Nice,
la Rochelle « 6 », Brest « 5 ») : le modèle lit « aucune capacité d'adaptation » dans une densité de
population. Pour les feux, Fos-sur-Mer reçoit « adaptation 0 » parce que ses sols sont très secs.

**Verdict : 🔴 à supprimer sans équivalent.** Aucun nom de remplacement : le concept n'est pas mesuré.

## 9. `ind_occurrence`

| Slug | Ce qu'il contient vraiment |
|---|---|
| canicule, sécheresse | jours > 35 °C /40 |
| feux | jours IFM ≥ 40 /60 (**identique à `ind_exposition`**) |
| submersion DRIAS | `column16`, lu comme « évolution des pluies extrêmes », en réalité `NORRRq99refD_yr` (jours de pluie intense) |
| dependance-auto | **copie du `score`** |

Ce n'est ni une fréquence historique (rien de passé : tout vient de projections 2050), ni un nombre de
reconnaissances CatNat, ni une probabilité. L'historique réel est dans le bloc GASPAR.

**Verdict : 🔴 à supprimer** (A).

## 10. Tableau complet

| Champ | Source | Méthode | Unité | Grain | Nature | Utilisation actuelle | Information réellement apportée | Doublon explicite dans le même prompt | Statut | Cible |
|---|---|---|---|---|---|---|---|---|---|---|
| `score` | DRIAS gwl20 (millésime antérieur), ADEME, altimétrie OpenTopoData, saisies manuelles | moyenne (pondérée ou non) de sous-indices min-max ; GREATEST entre méthodes | « /100 » sans unité | commune (maille DRIAS / IRIS appariés par nom / 5 points d'altitude) | composite | « score X » dans le `system` | aucune au-delà des sous-indices ; la présence d'une ligne signale seulement un top-N | oui (via ses composantes) | 🔴 | supprimer |
| `ind_exposition` | une colonne DRIAS, ou ADEME `taux_motor_glob` | normalisation min-max | /100 | commune | mesure normalisée, renommée | « exposition X » | la mesure, déformée | DRIAS (jours > 30 °C, IFM, SWI) ; ADEME « mode motorisé » | 🔴 | supprimer (la mesure est déjà là) |
| `ind_vulnerabilite` | une colonne DRIAS, ou ADEME TC | min-max, parfois inversée | /100 | commune | mesure normalisée, mal nommée | « vulnérabilité X » | la mesure, déformée | DRIAS (nuits, SWI) ; ADEME « Usage transports en commun » | 🔴 | supprimer |
| `ind_adaptation` | une colonne DRIAS inversée, ou densité inversée | min-max inversée | /100 | commune | mesure inversée, sans rapport avec le nom | « adaptation X » | aucune (le nom ment) | DRIAS (Tmax été, SWI) ; ADEME « Densité » | 🔴 | supprimer, sans remplacement |
| `ind_occurrence` | une colonne DRIAS, ou copie du score | min-max | /100 | commune | mesure normalisée ou doublon | « occurrence X » | la mesure, déformée | DRIAS (jours > 35 °C, IFM) | 🔴 | supprimer |
| (catégories) | `communes_categorization` (44 saisies) ou `deriveCategories` (préfixe département) | règles par département | étiquettes | département | étiquette éditoriale | « Catégories territoriales : … » | un cadrage de questions ; **parfois faux** (§16, décision D) | — | ✅ hors FUT-16 (à décider) | laisser, ticket séparé |

## 11. Contextes AskFuture réels examinés

Neuf communes, bloc `[Référentiel interne futur•e]` reproduit **à l'identique** (fonctions de la route
extraites telles quelles ; lignes `communes_tension` lues en production le 02/10/2026).

**Fos-sur-Mer (13039)**, quatre lignes :
```
INSEE : 13039
Catégories territoriales : mediterranee, colonise_albopictus, littoral, littoral_mediterranee

Tensions territoriales (table communes_tension, scores et indicateurs sur 100) :
- dependance-auto : score 93 (exposition 87, vulnérabilité 96, adaptation 94, occurrence 93)
- feux : score 75 (exposition 100, vulnérabilité 100, adaptation 0, occurrence 100)
- secheresse : score 74 (exposition 100, vulnérabilité 100, adaptation 72, occurrence 22)
- submersion : score 93
```
Plus bas dans le même prompt : « Actifs utilisant un mode motorisé pour aller travailler : 87.5 % »,
« Jours risque feu (IFM > 40) : 72 j » (2050), « Jours sécheresse sol (SWI < 0.4) : 221 j », « Risques
recensés : inondation fluviale, submersion marine, … feux de forêt ».

**Bourg-en-Bresse (01053)**, ligne corrompue :
```
Catégories territoriales : colonise_albopictus
- dependance-auto : score 59 (exposition 59, vulnérabilité 76, adaptation 41, occurrence 59)
- feux : score 75 (exposition 100, vulnérabilité 1, adaptation 99, occurrence 100)
```
Même prompt : « Jours risque feu (IFM > 40) : 2 j (2030), 3.5 j (2050), 6 j (2100) » ; Géorisques ne
recense pas de risque de feu de forêt.

**Monteux (84080)**, ligne corrompue et catégorie fausse :
```
Catégories territoriales : mediterranee, colonise_albopictus, littoral, littoral_mediterranee
- canicule : score 70 (exposition 65, vulnérabilité 86, adaptation 72, occurrence 57)
- dependance-auto : score 87 (exposition 77, vulnérabilité 94, adaptation 89, occurrence 87)
- secheresse : score 33 (exposition 1, vulnérabilité 1, adaptation 72, occurrence 57)
```
Même prompt : « Jours sécheresse sol (SWI < 0.4) : 172 j » (2050). Monteux est dans les terres
(Vaucluse) : « littoral » vient du préfixe 84.

**Nice (06088)** : `dependance-auto : score 19 (exposition 45, vulnérabilité 11, adaptation 0, occurrence 19)` ; `submersion : score 58`.
**La Rochelle (17300)** : `dependance-auto : score 41 (… adaptation 6 …)` ; `submersion : score 80`.
**Brest (29019)** : `dependance-auto : score 38 (exposition 58, vulnérabilité 50, adaptation 5, occurrence 38)`.
**Blagnac (31069)** : `secheresse : score 74 (exposition 96, vulnérabilité 96, adaptation 81, occurrence 26)`.
**Rodez (12202)** : `dependance-auto : score 58 (exposition 66, vulnérabilité 79, adaptation 28, occurrence 58)`.
**Chamonix (74056)**, aucune ligne :
```
Pas de scores de tension détaillés disponibles dans futur•e pour cette commune.

(Pas de scores de tension détaillés en base interne pour cette commune.)
```

### Ce que Claude en fait (3 appels contrôlés, prompt système exact, 02/10/2026)

| Commune / question | Extrait de la réponse | Problème |
|---|---|---|
| Bourg-en-Bresse, « Les feux de forêt sont-ils un vrai sujet ? » | « un score de tension "feux" de 75 sur 100, avec une exposition maximale (100/100) et une occurrence évaluée à 100/100 … Ces scores signalent que le territoire présente des conditions favorables à l'éclosion de feux, même si la vulnérabilité propre à la commune est très faible (1/100), ce qui traduit notamment un taux de boisement mesuré à 17,1 % » | ligne corrompue citée comme source « référentiel interne futur•e » ; lien inventé entre « vulnérabilité » et boisement ; contredit la mesure DRIAS du même prompt |
| Monteux, « La sécheresse est-elle un problème ? » | « le score de tension sécheresse … est relativement modéré (33/100), ce qui s'explique par une exposition des sols et une vulnérabilité structurelle du territoire cotées très bas (1/100 chacune) … le territoire n'est pas structurellement parmi les plus exposés » | conclusion fausse tirée d'une ligne corrompue ; classement implicite ; contredit 172 jours de sol sec |
| Nice, « Nice est-elle bien adaptée au changement climatique ? » | « La tension de submersion est notée à 58 sur 100 … un risque significatif » ; « la dépendance automobile de Nice est l'une des plus faibles des territoires futur•e (score 19 sur 100) … un facteur d'adaptation » | note opaque convertie en « risque significatif » ; classement entre territoires ; « adaptation » tirée de la densité |

Réponses complètes : non versionnées (scratchpad), reproductibles par l'annexe.

## 12. Doublons score / mesure explicite

Tous les sous-indices climat **sont** une colonne DRIAS que le même prompt donne aussi, en clair, à trois
horizons. Exemple Fos-sur-Mer : « feux … exposition 100 » et « Jours risque feu (IFM > 40) : 72 j ».
Tous les sous-indices mobilité **sont** des champs ADEME que le même prompt donne aussi : « dependance-auto
… exposition 87 » et « Actifs utilisant un mode motorisé pour aller travailler (%) : 87.5 % » (même champ
`taux_motor_glob`, même moyenne d'IRIS). Le doublon est total, et il est pire qu'inutile : la note arrive
**en premier**, dans un bloc présenté comme le « référentiel interne futur•e », et Claude la cite comme
source (Bourg-en-Bresse, Monteux).

## 13. Contradictions et millésimes

Recalcul de chaque ligne climat avec les formules du script et `public/data_climat.json` actuel :

| Slug | Lot | Lignes | Identiques au recalcul | Exposition à plus de 30 points de la mesure DRIAS |
|---|---|---|---|---|
| canicule | 26/04 | 50 | partiel | 0 |
| canicule | 09/05 | 18 | partiel | 0 |
| feux | 26/04 | 50 | partiel | 0 |
| **feux** | **09/05** | **50** | 0 | **50** (ex. L'Abergement-Clémenciat : base 100, DRIAS 7) |
| sécheresse | 26/04 | 50 | 0 | 0 |
| **sécheresse** | **09/05** | **49** | 0 | **49** (ex. Monteux : base 1, DRIAS 86) |

Au total, 18/68 canicule, 12/100 feux, 0/99 sécheresse se recalculent à l'identique : le reste date d'un
ancien fichier DRIAS. **99 lignes climat sur 267 (37 %) contredisent frontalement la mesure** que le même prompt
transmet. Les lignes « dependance-auto » (969) reposent sur un appariement IRIS → commune **par nom**
(homonymes possibles) et une moyenne non pondérée ; les lignes « submersion » (35) mêlent altimétrie à
cinq points et saisies manuelles sans provenance, et n'ont plus aucun sous-indice.

Le score n'est donc pas seulement redondant : **il peut introduire des contradictions**, et il en
introduit.

## 14. Autres chemins possibles vers le modèle

| Chemin | Lit `communes_tension` ? | Conclusion |
|---|---|---|
| `GET /api/ask/context` (pré-warm) | non (`gatherCommuneEnrichment` seul, renvoie des booléens) | sain |
| `gatherCommuneEnrichment` (`commune-enrichment.ts`) | non | sain |
| historique de conversation | non rechargé depuis `ask_conversations` (les montages ne font qu'un `count`) ; l'historique vient de l'état du client pendant la session | pas de survie des scores après correction (une réponse antérieure de la même session peut encore les citer, le temps de la session) |
| suggestions d'AskFuture | statiques (`rapport/quartier/page.tsx`) | sain |
| `/qna`, `comparateur-vie/{ask,parse,synthesize,synthesize-choix}`, `synthesize-logement`, `territoire-snapshot`, `ConclusionRedigee`, `conclusion-validate` | non | sains vis-à-vis de FUT-16 |
| `wizard-preview` → `WizardTeaser` | oui | **aucun modèle**, mais affichage public d'un score (§19) |

Remarque adjacente (hors FUT-16) : l'historique `messages[]` est entièrement fourni par le navigateur,
y compris les tours « assistant ». Un visiteur peut donc faire « dire » au modèle des réponses antérieures
inventées. Même nature que l'autorité des faits corrigée dans FUT-37 pour `/qna` ; à traiter à part.

## 15. Comparaison avec la doctrine actuelle

| Doctrine | `communes_tension` dans AskFuture |
|---|---|
| ADR-0001 : aucun score synthétique | le contexte en transmet un par risque, présenté comme « référentiel interne » |
| Mesures explicites plutôt que notes opaques | la mesure est présente, la note arrive en premier et prime (§11) |
| Fait / fait dérivé / interprétation | « vulnérabilité », « adaptation » sont des interprétations sans fait |
| Source et limites visibles | la source citée par le modèle devient « référentiel interne futur•e » |
| Trancher / apprécier / ne pas mesurer (FUT-7, FUT-8) | « adaptation » prétend mesurer ce que futur•e ne mesure pas |
| Pas de classement sans fait (FUT-6 `interdit:classement-national`) | Claude produit « l'une des plus faibles des territoires futur•e » |
| Autorité des faits (FUT-37) : le serveur reconstruit les faits depuis les sources canoniques | AskFuture le fait déjà pour l'enrichissement ; seul le bloc `communes_tension` déroge |

Ce que FUT-37 apporte de réutilisable ici, sans rien refactorer : le principe (le modèle ne reçoit que des
faits reconstruits côté serveur depuis les sources canoniques) et, plus tard, les règles partagées de
`src/lib/garde-fous/assertions.ts` (classement, comparaison, durée…) pour un contrôle de sortie
d'AskFuture. Ce contrôle n'est **pas** proposé dans FUT-16 : le ticket corrige la donnée, pas la sortie.

## 16. Cible de contexte proposée

```
DONNÉES TERRITORIALES DISPONIBLES — <Commune> (INSEE <insee>)

[Référentiel interne futur•e]
INSEE : <insee>
Nom commune (référentiel interne) : <nom>          (si connu)
Catégories territoriales : <…>                      (décision D)

[ADEME — …]
[DRIAS-TRACC — …]
[Géorisques — …]
[GASPAR — …]
[VigiEau] …
[Hub'Eau — …]
[Baignade — …]

PROFIL UTILISATEUR CONNU
…
```

- **Plus aucune ligne** « Tensions territoriales », « score », « exposition / vulnérabilité / adaptation /
  occurrence », « sur 100 ».
- **Plus aucune phrase** sur l'absence de scores (les deux « Pas de scores de tension … » disparaissent) :
  futur•e ne revendique plus ces scores, il n'a pas à dire qu'il en manque.
- **Aucun remplacement verbal** (« élevé », « favorable », « vulnérable ») : la mesure correspondante est
  déjà dans les blocs suivants, avec son unité et sa source.
- L'indication « aucune donnée détaillée disponible » ne dépend plus que des blocs d'enrichissement.
- Le commentaire de tête de la route cesse de citer `communes_tension`.

**Information réellement perdue** :
- *climat* (canicule, feux, sécheresse) : rien ; les colonnes DRIAS sont déjà transmises, à jour.
- *mobilité* : rien ; les deux champs ADEME sont déjà transmis ; seule disparaît une densité inversée
  baptisée « adaptation ».
- *submersion* : l'altitude basse échantillonnée sur cinq points, présente seulement sous forme de score
  et **non stockée** en clair (catégorie B, mesure source indisponible) ; et des scores manuels sans
  provenance (catégorie D). Ce qui reste : le risque de submersion recensé (Géorisques) et l'historique
  CatNat (GASPAR). La vérité littorale chiffrée relève de FUT-33.
- *présence d'une ligne* (un top-N) : un classement implicite, contraire à la doctrine. Perte voulue.

## 17. Plan exact d'implémentation (proposé)

1. **Petite extraction pure** `src/lib/ask/contexte.ts` (sans `server-only`, imports relatifs, imports de
   types en `import type`) :
   - `construireReferentiel({ insee, nomCommune, categories }) : string` ;
   - `construireSystemPrompt({ base, communeName, insee, referentiel, blocsEnrichissement, profil }) :
     string` ;
   - déplacer tels quels `formatEnrichmentBlock` et ses sept `format*Block` (fonctions déjà pures).
   La route ne garde que les accès (Supabase, enrichissement, Anthropic) et appelle ces fonctions. Pas
   d'architecture générique de prompting.
2. **Retrait de `communes_tension`** de `buildCommuneContext` (la requête disparaît), du flag
   `hasTensionData`, des deux phrases « Pas de scores… », et du commentaire de tête.
3. **Rien d'autre** dans le prompt : pas de consigne « n'utilisez pas les scores » (il n'y en a plus).
4. Aucune migration, aucune suppression de table, aucun changement des pages publiques ni du wizard.

## 18. Matrice de tests

Tous sur la fonction pure qui produit **le `system` exactement passé** à `anthropic.messages.create()`.

| # | Test | Entrée | Assertion |
|---|---|---|---|
| T1 | Absence de score | référentiel construit pour une commune qui **a** des lignes en base (Fos-sur-Mer, Bourg-en-Bresse : fixture des lignes réelles) | le `system` final ne contient ni `communes_tension`, ni `score \d`, ni `sur 100`, ni `exposition \d`, `vulnérabilité \d`, `adaptation \d`, `occurrence \d`, ni « Tensions territoriales », ni « scores de tension » |
| T2 | Contrat d'entrée | signature de `construireReferentiel` | elle n'accepte aucune ligne de tension : un futur refactor ne peut pas en réintroduire sans changer le type (test de type ou d'arité) |
| T3 | Faits préservés | enrichissement de fixture (Fos-sur-Mer : ADEME, DRIAS, Géorisques, GASPAR, VigiEau, Hub'Eau, baignade) | le `system` contient « Jours risque feu (IFM > 40) : 72 j », « Actifs utilisant un mode motorisé … 87.5 % », « Risques recensés : … submersion marine … », « 11 reconnaissances … » |
| T4 | Pas de remplacement cosmétique | mêmes entrées | le bloc référentiel ne contient aucun de « faible », « moyen », « modéré », « élevé », « fort », « favorable », « défavorable », « vulnérable », « bien adapté » ; la différence entre le `system` avant/après se limite aux lignes retirées |
| T5 | Commune sans ligne | Chamonix | aucune phrase sur l'absence de scores ; pas de double ligne vide ; le référentiel reste `INSEE`, nom, catégories |
| T6 | Aucune donnée | enrichissement tout nul | l'indication « aucune donnée détaillée disponible » apparaît (elle ne dépend plus de `hasTensionData`) |
| T7 | Garde-fou de source | la route | `buildCommuneContext` ne lit plus `communes_tension` : test statique sur la source de la route (`.from("communes_tension")` absent de `src/app/api/ask/**`), accepté ici parce que c'est le seul moyen de verrouiller la requête sans base |

## 19. Usages hors périmètre à traiter ultérieurement (tickets proposés)

1. **`WizardTeaser` + `/api/wizard-preview`** : affiche au public « Score X/100 · exposition élevée » et
   « Signal officiellement recensé dans votre territoire » (faux : rien d'officiel), avec les lignes
   corrompues (Bourg-en-Bresse serait « exposition élevée » aux feux). **Le plus urgent des usages hors
   AskFuture.**
2. **`/chaleur/villes-les-plus-exposees`** : « Score tension /100 » écrits en dur (91, 87…), sans lien avec
   la base (max 71), présentés comme « score de tension canicule futur•e ».
3. **`/inondation/villes-les-plus-exposees-submersion`** et **`/j-utilise-beaucoup-ma-voiture/villes-les-plus-dependantes`** :
   classements publics par score, contraires à ADR-0001.
4. **Les lignes corrompues du 09/05** (99 lignes feux et sécheresse) : à purger si la table survit, et
   **le décalage de colonnes** de `populate-communes-tension.js` (`NORRRq99_yr` → `column15`).
5. **`LocalTensionContext.tsx`** : code mort à supprimer.
6. **Catégories d'AskFuture** (décision D) : `deriveCategories` donne « littoral » à toute commune d'un
   département méditerranéen ou atlantique (Monteux) ; à confier au chantier de vérité littorale (FUT-33)
   ou à basculer sur `deriveCategoriesFromEntry`.
7. **Libellé DRIAS d'AskFuture** « Jours risque feu (IFM > 40) » : la doctrine FUT-37 parle de « météo
   propice aux feux » ; à harmoniser à part.
8. **Historique `messages[]` fourni par le client** (§14).
9. À terme, la table elle-même : plus aucun lecteur légitime une fois 1 à 3 traités.

## 20. Risques et questions à valider

- **Décision A — supprimer entièrement `communes_tension` du contexte AskFuture ?** Recommandé : **oui**.
- **Décision B — un sous-indice apporte-t-il une information absente ailleurs ?** Seulement la submersion
  côtière (altitude échantillonnée), sous forme de score, et des saisies manuelles sans provenance.
- **Décision C — remonter à la mesure source ?** Non dans FUT-16 : l'altitude n'est pas stockée, et la
  vérité littorale chiffrée est l'objet de FUT-33. Le risque recensé (Géorisques) et GASPAR restent.
- **Décision D — garder les catégories ?** Elles ne sont pas un emballage des scores (règles par
  département, indépendantes). Recommandé : **les garder dans FUT-16** et ouvrir un ticket pour leur
  exactitude (Monteux « littoral »). Alternative : ne transmettre que les catégories de la table saisie à
  la main. À trancher.
- **Décision E — cesser de mentionner les « scores de tension » ?** Recommandé : **oui**, partout dans le
  `system` (y compris les deux phrases d'absence).
- **Décision F — petite extraction pure ?** Recommandé : **oui**, limitée au référentiel, aux blocs
  d'enrichissement et à l'assemblage du `system`.
- **Décision G — autres usages problématiques ?** Oui : §19, en priorité `WizardTeaser` (public, score
  affiché, lignes corrompues).
- **Risque** : AskFuture semblera « savoir moins » sur les 1 193 communes concernées. C'est une apparence :
  il ne perd que des notes, dont un tiers fausses ; les mesures restent.
- **Risque** : une session ouverte avant le déploiement peut encore citer un score dans un tour
  « assistant » rejoué par le client. Sans conséquence au-delà de la session.

---

## Annexe. Reproduction

1. Lignes de production : `select slug, insee_code, score, ind_exposition, ind_vulnerabilite,
   ind_adaptation, ind_occurrence, updated_at from communes_tension` (lecture seule).
2. Recalcul : formules de `scripts/populate-communes-tension.js` appliquées à `public/data_climat.json`
   (`gwl20`), comparaison champ par champ.
3. Contexte : `SYSTEM_PROMPT_BASE`, `buildCommuneContext` et les `format*Block` extraits de
   `src/app/api/ask/route.ts` sans modification ; client Supabase remplacé par les lignes lues en
   production ; `gatherCommuneEnrichment` réel (sources publiques en direct, 02/10/2026).
4. Appels : `claude-sonnet-4-6`, `thinking` désactivé, `effort: medium`, `system` = prompt de base +
   contexte reconstruit + « Profil non renseigné. », un message utilisateur. Trois appels.

---

## Addendum du 2 octobre 2026 : implémentation (phase 1)

### Décisions appliquées

| Décision | Appliqué |
|---|---|
| A | `/api/ask` ne lit plus `communes_tension` ; aucun de ses champs n'atteint Anthropic. |
| B | Aucun adjectif ne remplace les notes ; les blocs de sources sont inchangés. |
| C | Aucun sous-indice recréé. |
| D | L'altitude de submersion n'est pas remontée ; Géorisques et GASPAR restent ; FUT-33 traite la vérité littorale. |
| E | Catégories conservées, inchangées (Monteux « littoral » reste un reliquat). |
| F | Plus aucune mention de « scores de tension » ; les deux phrases d'absence ont disparu. |
| G | Extraction minimale `src/lib/ask/system-prompt.ts`. |

### Fichiers

- `src/lib/ask/system-prompt.ts` (nouveau) : `SYSTEM_PROMPT_BASE`, `construireReferentiel`, les blocs
  d'enrichissement, `buildUserProfileText`, `aDesDonneesDetaillees`, `construireSystemPrompt`. Déplacés tels
  quels (étape 1), puis débarrassés des tensions (étape 2).
- `src/app/api/ask/route.ts` : `lireReferentielInterne` (lit `communes_categorization` seulement) ;
  `system: construireSystemPrompt(...)`.
- `src/lib/ask/system-prompt.test.ts`, `src/lib/ask/__fixtures__/communes.json` (enrichissements et lignes
  réels du 02/10).
- `src/lib/territoire/synthesis-pipeline.test.ts` : l'assertion FUT-6 « AskFuture lit toujours
  `workbook_quartier` » cherche désormais aussi dans le module extrait (même intention).

### Architecture finale du contexte

```
[Référentiel interne futur•e]
INSEE : <insee>
Nom commune (référentiel interne) : <nom>      (si la commune est dans communes_categorization)
Catégories territoriales : <…>

[ADEME …] [DRIAS-TRACC …] [Géorisques …] [GASPAR …] [VigiEau …] [Hub'Eau …] [Baignade …]
(Indication d'absence de données, seulement si aucune de ces sources n'est disponible)

PROFIL UTILISATEUR CONNU
```

`construireReferentiel` et `construireSystemPrompt` refusent toute clé non prévue : une couche de notation
ne peut pas revenir par un argument existant.

### Tests

12 tests de contrat sur le `system` (T1 absence de toute note et de toute valeur ; T2 contrat fermé ; T3
faits DRIAS, ADEME, Géorisques, GASPAR, VigiEau, Hub'Eau, baignade et profil préservés ; T4 référentiel
réduit à l'identité et aux catégories, blocs de sources sans qualification ; T5 commune sans ligne ; T6
absence de données ; T7 la route ne lit plus la table, un seul `anthropic.messages.create`, `system:
systemPrompt`, pré-warm sain). Suite complète : 2 024/2 024. Typecheck, lint et build de production OK.

Deux appels contrôlés avec le nouveau `system` : à Bourg-en-Bresse, Claude cite « 3,5 jours vers 2050 » et
l'absence de risque incendie recensé par Géorisques (il écrivait « exposition maximale 100/100 ») ; à
Monteux, la sécheresse devient « un enjeu documenté » (GASPAR, VigiEau, 172 à 182 jours de sol sec) au lieu
de « pas structurellement parmi les plus exposés ».

### Reliquats renvoyés

- **FUT-28** (formulaire d'accueil) : `WizardTeaser` et `/api/wizard-preview` (« Score X/100 · exposition
  élevée », « Signal officiellement recensé »).
- **FUT-52** (articles SEO) : scores écrits en dur de `/chaleur/villes-les-plus-exposees`, classements par
  score (submersion, dépendance automobile).
- **FUT-51** (rôle d'AskFuture) : contrôle de sortie d'AskFuture (les réponses peuvent encore dire
  « aujourd'hui » d'une projection ou conclure sur la « ressource en eau ») ; historique `messages[]` fourni
  par le client ; libellé DRIAS « Jours risque feu » (doctrine FUT-37 : « météo propice aux feux »).
- **Ticket à créer** : catégories issues du préfixe de département (Monteux « littoral »).
- **Ticket à créer** (données) : les 99 lignes corrompues du 09/05 et le décalage de colonnes de
  `populate-communes-tension.js`, si la table survit à FUT-28 et FUT-52 ; `LocalTensionContext.tsx` (code
  mort, non touché).
