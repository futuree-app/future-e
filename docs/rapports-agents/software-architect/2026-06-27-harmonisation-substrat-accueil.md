# Software Architect — Harmonisation du substrat de données de l'accueil

Date : 2026-06-27
Périmètre : `src/components/FutureELanding.tsx` (C) vs `src/lib/comparateur-vie.ts` + `data/comparateur-index.json` (A) vs `src/lib/commune-enrichment.ts` (B).
Doctrine lue : ADR-0004 (stack), AGENTS.md (règle Next.js), invariants (sobriété, la forme sert le fond).
Contexte respecté : la forme « teaser léger » de l'accueil RESTE. Je ne juge que le substrat de données, pas le choix des questions à l'écran.

---

## 1. Cartographie réelle et vérifiée des 3 substrats

### A — Index national pré-calculé
- **Fichier** : `data/comparateur-index.json` — vérifié : `34 788` communes, ~40 champs/commune (`clim`, `inondation`, `demographie`, `calmeSonore`, `expoIndustrielle`, `nature`, `mobilite`, `reseauLocal`, `vieLocale`, `etudes_acces`, `uu`, `pct`, `vivpct`, `rayonnement`…). Granularité : **COMMUNE**, avec percentiles nationaux (`pct`).
- **Lecteur** : `src/lib/comparateur-vie.ts` (server-only, `fs`). Expose entre autres `loadIndex()`, `getCommuneEntry(insee)`, `getTerritoryContext(insee)`, `buildSignature(c)`.
- **Consommé par** : `/ou-vivre`, comparateur 3 communes, Pack Décision (`comparateur/*`, `rapport/quartier`). 10 fichiers importent `comparateur-vie`.
- C'est le substrat qui a **le plus grandi** : les ~25 critères de la roadmap (mobilité quotidienne, vie locale, calme sonore, exposition industrielle, croissance démographique, vie étudiante…) vivent ici.

### B — Enrichissement live commune
- **Fichier** : `src/lib/commune-enrichment.ts`, fonction `gatherCommuneEnrichment(insee)`. Agrège en parallèle 8 libs (`commune-data` ADEME, `drias-json`, `eaufrance`, `vigieau`, `georisques`, `catnat`, `littoral`, `baignade`). Granularité : **COMMUNE**, live (chaque lib a son cache).
- **Consommé par** : `rapport/quartier`, `api/ask`, `api/ask/context`, `api/synthesize-quartier`, `quartier-preview`. (5 appelants.)

### C — Le « moteur privé » de l'accueil
- **Fichier** : `src/components/FutureELanding.tsx` (client component, ~3500 lignes). Ses sources réelles :
  - **Supabase** : `tensions_catalog` (catalogue des questions), `communes_categorization` (catégories éditoriales MANUELLES, commune-level), `tension_answers` (réponses éditoriales).
  - **Endpoints live** : `/drias?insee=` (→ `getClimatDataCommune`, lignes 1258-1262), `/georisques?insee=`, `/api/gissol?insee=`.
  - **Claude** : `/qna` (génère le verdict par commune+tension).
  - **Fallback de catégories** : `deriveCategories(inseeCode)` dans `src/lib/commune-categories.ts` — bucketing **par préfixe DÉPARTEMENT** (montagne/mediterranee/littoral/vectoriel), utilisé quand `communes_categorization` n'a pas de ligne (ligne 1242).
  - **Fallback de réponses** : `STATIC_ANSWERS` (lignes 150-187), texte **codé en dur, spécifique à des communes** (La Rochelle, Bressuire, sols charentais).
  - **Moteur narratif privé** : `DRIAS_TENSION_CONFIG` (l.112-148) + ~12 fonctions `*Narrative()` + `getDriasCard`/`getPreviewCards` (l.515-732) qui ré-interprètent les indicateurs DRIAS en prose.

### Où C diverge réellement de A/B — la cartographie précise (ce qui corrige l'intuition du porteur)

Le diagnostic « C a un moteur entièrement séparé, granularité département » est **partiellement vrai et il faut être chirurgical**, sinon on corrige au mauvais endroit :

1. **Le climat de l'accueil N'EST PAS divergent à la source.** `/drias` (`src/app/drias/route.ts`) appelle `getClimatDataCommune` — **exactement la même lib que B** (`commune-enrichment` l.19). `/georisques` et `/api/gissol` sont aussi live, commune-level. Les **chiffres climat affichés sur l'accueil sont vrais pour la commune.** Le pont A/B/C existe déjà à la couche lib pour le climat.

2. **La vraie divergence est ailleurs, et elle est double :**
   - **(a) La sélection éditoriale + les cartes « profondeur » (Mobilité / Vie locale / Nature) sont du TEMPLATE dérivé du DÉPARTEMENT, pas de la donnée commune.** `deriveCategories` (préfixe dept) choisit quelles cartes montrer, puis `getPreviewCards` (l.662-687) remplit Mobilité/Vie locale/Nature avec des **chaînes fixes** (« À X, le quotidien dépend largement de la voiture ») choisies par catégorie de département. Pendant ce temps, A détient le **percentile commune réel** de `mobilite`, `faible_dependance_auto`, `vieLocale`, `nature` pour cette commune exacte. **C'est le cœur de la dette** : tout l'enrichissement scoré (A) est INVISIBLE à l'accueil. Une amélioration du moteur (nouveau critère, score corrigé) ne touche jamais l'accueil.
   - **(b) `STATIC_ANSWERS` est un mensonge de données potentiel.** `enfants_sante` (l.157) parle des « sols charentais chargés en cadmium » et de « La Rochelle » — affiché pour **n'importe quelle commune** si la ligne Supabase `tension_answers` manque ET que Claude échoue. C'est un triple-fallback (Supabase → Claude → statique), donc en marche nominale Claude produit du commune-spécifique ; le mensonge ne surgit qu'en panne Claude ou sur `default`. Risque réel mais borné.

3. **Nuance importante : `deriveCategories` n'est PAS privé à l'accueil.** Il est aussi importé par `src/app/api/ask/route.ts` (l.169) et `src/lib/territory-mood.ts` (l.113). Ce n'est donc pas « le moteur de la home » à supprimer, mais un **sélecteur éditoriel grossier partagé**. À traiter comme tel.

---

## 2. Diagnostic de dette — ce qui se paiera, et quand

| Dette | Nature | Coût à la reprise | Volontaire / Subie |
|---|---|---|---|
| **Cartes profondeur en template dept** (`getPreviewCards` l.662-687) + `deriveCategories` préfixe dept | Couplage absent : A et C ne se parlent pas | À chaque nouveau critère du moteur, le porteur devra se souvenir que **l'accueil a son propre set de cartes à mettre à jour à la main** — ou plus probablement l'oubliera. Aujourd'hui la réponse à « combien d'endroits pour refléter une amélioration sur l'accueil ? » est **« jamais, c'est un autre monde »**. | **Subie** : l'accueil a été figé avant que A grossisse. |
| **Moteur narratif DRIAS privé** (`*Narrative`, `DRIAS_TENSION_CONFIG`) | Duplication de l'interprétation climat | Le porteur a une **2e doctrine climat** (cf. memory « gabarit cartes climat », `buildClimatWhy`) qui ne suit pas la première. Si la façon de raconter la chaleur évolue, il faut la changer à deux endroits, dont un qu'il a oublié. | **Mi-subie** : c'était nécessaire au départ (pas de socle), c'est devenu une duplication. |
| **`STATIC_ANSWERS` commune-spécifiques** (l.150-187) | Mensonge de données en mode dégradé | Faible fréquence (panne Claude), mais **élevé en gravité de marque** : afficher « sols charentais » pour une commune alsacienne. | **Subie** : fallback de bootstrap jamais nettoyé. |
| **`@ts-nocheck` + 3500 lignes monofichier** (l.2) | Nommage/typage opaque | Le futur-moi relit un fichier géant sans filet de type. Hors périmètre de cette mission mais aggrave le coût de toute modification de C. | Subie. |

**Le préfixe département est-il un mensonge ?** Nuance : il ne ment pas sur les **chiffres climat** (live commune). Il ment sur le **cadrage éditorial** (un village alpin du 06 reçoit le cadre « méditerranée ») et sur les **cartes profondeur** (mobilité/vie locale dérivées du dept, pas du score commune). C'est un mensonge de **framing**, pas de valeur — moins grave qu'une donnée fausse, mais c'est exactement ce que l'invariant « signature distinctive ET identitaire » proscrit (donnée inerte/approximée présentée comme propre au lieu).

---

## 3. Options d'harmonisation, classées

### Option 0 — Ne rien faire
La dette croît mécaniquement : chaque critère ajouté à A élargit l'écart. Coût différé, jamais payé tant que personne ne regarde l'accueil. À rejeter parce que c'est précisément le scénario « futur-moi devant un moteur fantôme ».

### Option MINIMALE — RECOMMANDÉE : brancher les cartes profondeur + la catégorisation sur l'index A via un endpoint
La plomberie existe DÉJÀ : `comparateur-vie.ts` expose `getCommuneEntry(insee)`, `getTerritoryContext(insee)` et `buildSignature(c)` — des fonctions server-only qui lisent **une** commune de A. L'accueil est un client component : il doit passer par un endpoint (comme il le fait déjà pour `/drias`, `/georisques`, `/api/gissol`).

- **Geste** : créer **un** route handler `src/app/api/landing-signals/route.ts` (`GET ?insee=`) qui appelle `getCommuneEntry`/`getTerritoryContext` et renvoie : (1) des **catégories commune-vraies** (A a déjà `altitude`, `distance_cote_km`, `densite`, `uu`, `dept` — tout ce que `deriveCategories` approxime par préfixe peut être dérivé du vrai), (2) les **2-3 signaux les plus saillants** (percentiles `pct` les plus marqués parmi les ~30 critères) pour nourrir les cartes profondeur avec la **réalité de la commune**.
- L'accueil remplace : le fallback `deriveCategories` (l.1242) par cet appel, et les chaînes-template de `getPreviewCards` (Mobilité/Vie locale/Nature, l.662-687) par les signaux renvoyés.
- **Le climat reste tel quel** (déjà commune-vrai via `/drias`). On ne touche pas au switch d'horizon.
- **Forme inchangée** : mêmes 4 cartes, même légèreté, mêmes « questions en tension ». On ne change que **la vérité derrière les cartes**, pas l'écran.
- **Latence** : `getCommuneEntry` = `loadIndex()` (lecture fs du JSON, déjà fait pour `/ou-vivre`, caché en module-scope après 1er appel) + un `.find`/Map O(1). C'est **un fetch de plus en parallèle** des 3 existants (`Promise.allSettled` l.1258), pas un fetch en série → **pas de ralentissement perceptible** du premier écran. On peut même, plus tard, fusionner les 4 endpoints en un, mais ce n'est pas nécessaire.
- **Effort** : 1 route + ~2 points de branchement dans l'accueil + dérivation des catégories depuis l'index. **Risque faible**, isolé, réversible.
- **Bonus séparable** : neutraliser les `STATIC_ANSWERS` commune-spécifiques (les rendre génériques, sans « La Rochelle »/« charentais »). 20 minutes, supprime le mensonge en mode dégradé. À faire indépendamment.

### Option INTERMÉDIAIRE — router aussi le climat de l'accueil par l'index `clim`/`pct`
Remplacer les fetchs live `/drias` par les champs `clim` de A. **À NE PAS faire** : le live garantit déjà la vérité (même lib que B), permet le switch d'horizon, et le supprimer casserait une fonctionnalité pour un gain nul. Le climat n'est pas le problème.

### Ce qu'il NE faut PAS faire
- **Unifier les 3 substrats en un méga-loader** : sur-ingénierie. A (index statique scoré), B (live multi-API), C (teaser client) ont des contrats et des cycles de vie différents légitimes. Les fusionner créerait un couplage pire que la dette actuelle.
- **Transformer l'accueil en server component qui importe A directement** : tuerait la légèreté du teaser, alourdirait le SSR, casserait les interactions client (parallaxe, slots animés, recherche BAN). La frontière client/endpoint actuelle est SAINE — la garder.
- **Supprimer `deriveCategories`** : il sert aussi `api/ask` et `territory-mood`. Le garder comme fallback ultime, mais ne plus en faire la source primaire de l'accueil.
- **Réécrire le moteur narratif climat maintenant** : tentant mais hors du plus petit geste. À noter comme dette de 2e vague.

**Recommandation : Option minimale.** Elle attaque la dette au point exact où elle vit (cartes profondeur + catégorisation déconnectées de A), réutilise une plomberie déjà écrite (`getCommuneEntry`/`getTerritoryContext`), ne touche pas à la forme, et n'ajoute qu'un fetch parallèle.

---

## 4. Facile / difficile à changer après harmonisation

**Devient FACILE :**
- Refléter une amélioration du moteur sur l'accueil : un nouveau critère ajouté à A apparaît dans les signaux saillants de l'accueil **sans toucher l'accueil** (le endpoint lit l'index générique).
- Garder l'accueil honnête : la catégorisation et les cartes profondeur cessent de mentir sur le département.
- Une seule source de vérité pour « quels sont les signaux marquants de cette commune » : A.

**Reste DIFFICILE / rigide (assumé) :**
- Le **moteur narratif climat** reste dupliqué : faire évoluer la doctrine climat demande toujours deux endroits. Non traité par l'option minimale (volontairement).
- Le **catalogue des questions** (`tensions_catalog` Supabase) reste un substrat à part : changer les questions affichées passe par Supabase, pas par le code. C'est le terrain du Design/Product, pas une dette technique.
- Le **monofichier 3500 lignes `@ts-nocheck`** : toute modif de C reste coûteuse à relire. Hors périmètre.

---

## 5. Les paris de l'architecture et leurs seuils de bascule

- **Pari : « les ~30 critères de A se résument à 2-3 signaux saillants pour l'accueil ».** Tient tant que l'accueil reste un teaser à 4 cartes. **Bascule** : si l'accueil veut afficher une vue plus riche (≥6 signaux structurés), il faudra un contrat de données dédié, pas juste « les top percentiles ».
- **Pari : « l'index A tient en mémoire et se lit en O(1) par commune ».** Vrai à 34 788 communes / ~40 champs. **Bascule** : si l'index passe à des centaines de champs ou si on veut du temps réel par commune, il faudra une vraie base (Supabase/Postgres) au lieu d'un JSON fs — ce qui change aussi `/ou-vivre` et le Pack, pas seulement l'accueil.
- **Pari : « le climat live et le climat scoré (A.clim) ne divergeront pas ».** Aujourd'hui les deux passent par la même famille DRIAS. **Bascule** : si A.clim et `getClimatDataCommune` sont recalculés séparément, l'accueil (live) et le comparateur (A) pourraient afficher des chiffres différents pour la même commune — surveiller à chaque repopulation de l'index.
- **Pari : « Claude est presque toujours disponible, donc `STATIC_ANSWERS` est rarement vu ».** **Bascule** : une panne Claude prolongée expose le mensonge charentais à toutes les communes. D'où le correctif séparé recommandé.

---

## Réflexes de clôture

**La version minimale (≈90 % de la valeur)** : un seul route handler `/api/landing-signals?insee=` qui appelle `getCommuneEntry`/`getTerritoryContext` (déjà écrits) et renvoie catégories commune-vraies + 2-3 signaux saillants ; l'accueil branche ces signaux sur ses cartes profondeur et sa catégorisation, à la place du préfixe département et des chaînes-template. Climat inchangé. Forme inchangée. C'est le plus petit geste qui fait que « une amélioration du moteur se reflète sur l'accueil » devienne vrai.

**Quand rouvrir ce sujet ?**
- Si on ajoute un critère à A et qu'on se surprend à éditer `FutureELanding.tsx` pour le refléter → le branchement n'a pas été fait, dette intacte.
- Si une panne Claude expose `STATIC_ANSWERS` en prod → traiter le fallback générique en urgence.
- Si A.clim et le DRIAS live divergent (repopulation de l'index) → re-vérifier le pari de cohérence climat.
- Si l'accueil veut sortir du format « 4 cartes teaser » → re-architecturer le contrat de données (ce rapport ne couvre que le teaser actuel).

---

## Cohérence (tensions posées, non tranchées)
- Tension avec ADR-0004 / contrainte solo : l'option minimale ajoute UN endpoint et réutilise du code existant — coût d'ops nul, conforme. Aucune tension.
- La fusion éventuelle des 4 endpoints de l'accueil en un seul est une optimisation de cohérence, PAS une nécessité. À ne pas faire sous prétexte de propreté.

## Décision à graver (candidat ADR / note)
« L'accueil ne dérive plus ses signaux non-climat du préfixe département ni de chaînes-template : il lit la commune réelle de l'index A via un endpoint dédié. `comparateur-index.json` (A) devient la source de vérité unique des signaux saillants de l'accueil. Le climat reste live (même lib que le rapport). `deriveCategories` est rétrogradé en fallback ultime. » — Si retenu, mérite une note d'architecture courte (pas un ADR complet).

## Limites de mon regard
- **Je n'ai pas exécuté le code** : la latence du fetch index supplémentaire est raisonnée (lecture fs cachée + O(1)), pas mesurée. À profiler si le premier écran ralentit.
- **Je n'ai pas lu intégralement les 3500 lignes de `FutureELanding.tsx`** (lignes 1650-3574 non lues : surtout du JSX/styles d'après la structure) ni l'intégralité de `comparateur-vie.ts` (≥870 lignes). Si la couche de rendu contient une autre source de données que je n'ai pas vue, ma cartographie est incomplète sur ce point.
- **Je n'ai pas inspecté le contenu réel des tables Supabase** (`tensions_catalog`, `communes_categorization`, `tension_answers`) : je raisonne sur le code qui les lit, pas sur leur remplissage. Le taux réel de communes ayant une catégorisation MANUELLE (qui contourne le préfixe dept) m'est inconnu — s'il est élevé, la dette « préfixe département » est moins fréquente que je ne la décris.
- **Hors de mon mandat** : QUELLES questions afficher et leur formulation (= Design Critic / Product / Editorial). Je dis seulement comment les alimenter en vérité, pas lesquelles montrer. Le choix de garder le format « teaser 4 cartes » est tranché par le porteur, je le respecte.
- **Next.js** : j'ai vérifié le pattern route handler dans le repo (`src/app/drias/route.ts` : `export async function GET(request: Request)` + `NextResponse`) et la présence de la doc installée (`node_modules/next/dist/docs/01-app`). L'option minimale réutilise ce pattern existant, je n'introduis aucune API Next que je n'aie pas vue déjà fonctionner dans ce repo.
