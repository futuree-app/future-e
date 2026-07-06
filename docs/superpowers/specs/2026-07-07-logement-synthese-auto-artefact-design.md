# Spec 1a — Synthèse Logement : auto, streamée, artefact

**Date** : 2026-07-07 · **Module** : Logement · **Statut** : design validé, prêt pour plan d'implémentation.

## Contexte

Chantier #1 de reprise du module Logement = « synthèse + réordonnancement ». Découpé en deux specs (décision porteur 2026-07-07) : **1a (ce spec) = la synthèse**, **1b = réordonnancement de l'écran** (séparé, brainstorm ultérieur). Dépendance gravée : la synthèse d'abord, car elle est le héros de la future colonne vertébrale.

État actuel de la synthèse Logement : structurée JSON `{verdict, signals[], reading, actions[]}`, **non streamée**, **manuelle** (bouton « Générer la lecture »), **ignore le flag `AUTO_SYNTHESIS`**. La référence de qualité dans le produit = la synthèse **Quartier** (`api/synthesize-quartier`) : prose streamée, prompt éditorial exigeant (paradoxe issu des chiffres, ≤3 phénomènes, « renoncer aux signaux », jamais un « verdict de vie »). Ce spec aligne Logement sur ce modèle.

## Périmètre

**Dans 1a :**
- Passage de la synthèse Logement au **modèle Quartier** : prose streamée, auto-déclenchée sous `AUTO_SYNTHESIS`.
- Traitement en **artefact** : régénérée seulement quand un fait du logement change ; cache par hash de faits ; persistance durable.
- Réécriture du prompt à la qualité Quartier, avec les garde-fous ci-dessous.
- Nettoyage de frontière du payload (ajout du snapshot autour, retrait IREP/friches).

**Hors 1a :**
- **Réordonnancement du module** (remonter la synthèse en tête, remonter le `DpeSelector`, ordre des faces) = **spec 1b**. En 1a la synthèse reste à sa position actuelle ; on remplace seulement le bloc bouton par l'auto-stream.
- **Mini-intake / vécu / B2 proximité** = spec B (« résolution, actualisation et vécu »).

## Forme et voix de la synthèse

**Prose coulée streamée** (abandon du JSON `{verdict, signals, actions}` ; le bloc « Actions documentées » reste séparé et inchangé).

**Progression mentale fixe, longueur variable** : la synthèse suit toujours la progression **le logement → ses expositions → son environnement immédiat**. Le nombre de paragraphes et la longueur de chaque partie **dépendent uniquement de la matière disponible** (un petit appartement récent : partie « expositions » courte ; une vieille maison argile + nappe + PPR : partie « expositions » longue). Ne PAS graver « 3 temps » : la progression est fixe, le découpage ne l'est pas.

**Clôture posture-neutre** : la synthèse finit sur « ce qui mérite attention pour ce logement », valable quelle que soit la posture. La spécificité par projet (j'achète / j'y vis / je loue) est **déjà portée par le bloc déterministe « Ce que cela mérite de vérifier »** (`Face2Implication` + `POSTURE_FOR_PROJET`). La posture ne touche jamais le prompt.

**Garde-fous de prompt (gravés) :**
- **Oriente, n'introduit aucun fait absent d'un bloc déterministe** en dessous. Aucune donnée neuve, aucun chiffre inventé.
- **Ni exhaustivité, ni équilibre artificiel** : « La synthèse ne cherche jamais à être exhaustive ni à équilibrer artificiellement le récit. Elle retient seulement les éléments qui structurent réellement la lecture de ce logement. » Interdit les fausses symétries (« Malgré ces points… », « En contrepartie… », « À l'inverse… ») quand les données ne les portent pas. Prolonge le « renoncer aux signaux » de Quartier et la doctrine « révéler, pas équilibrer ».
- **≤ 3 phénomènes** structurants sur l'ensemble de la synthèse.
- **Le DPE est lu comme une photographie réglementaire datée du logement** (pas « dette datée » : cette lecture reste à la Face Énergie, où elle est juste ; un C récent ou un A ne sont pas des dettes).
- **Aucune température intérieure prédite** ; l'indicateur de confort d'été reste réglementaire et conventionnel (jamais une garantie de vécu).
- **Aucun score ni verdict global calculé** (ADR-0001), jamais un « verdict de vie ».
- **Nuance plutôt que négation** (« l'enjeu tient moins à X qu'à Y » plutôt que « ce n'est pas X, c'est Y »).
- **Voix futur•e** : vouvoiement, pas de tirets cadratin, pas de tournures IA, pas d'alarmisme ni de minimisation, sources inline quand pertinent.

**Squelette de prompt (à affiner, base = `synthesize-quartier`) :**
```
Tu es l'analyste éditorial de futur•e. Tu écris la synthèse d'un LOGEMENT précis à partir de
données publiques déjà présentées à l'utilisateur (DPE, confort d'été, Géorisques, ONRN, BPE/OSM).

STRUCTURE (progression, pas gabarit) : le logement lui-même, puis ses expositions, puis son
environnement immédiat. Un ou plusieurs paragraphes par partie selon la matière ; une partie
sans matière réelle est écourtée ou fondue, jamais gonflée. Termine sur ce qui mérite attention
pour CE logement, sans t'adresser à un projet particulier (achat/résidence/location).

RÈGLES : [garde-fous ci-dessus, verbatim].

L'utilisateur te transmet un payload JSON. Utilise-le sans le réciter.
```

## Déclenchement (règle artefact)

**La synthèse est régénérée uniquement lorsqu'un FAIT du logement change** (règle d'architecture, survivra aux évolutions du module).

- **Génère** quand les données sont stabilisées ET le DPE dans un état terminal : `auto_confirmed`, `confirmed`, ou `not_found` (le cas C a sa propre synthèse). Tant que `dpeStatus === "selection_required"`, on **attend** le choix utilisateur (le `DpeSelector` invite déjà).
- **Régénère** au changement de fait : nouveau DPE choisi → le hash de faits change → nouvel appel. Demain, une correction via mini-intake déclenchera au même titre, **sans réécrire la règle**.
- **La posture ne déclenche jamais d'appel LLM.** Changement de posture, ouverture de tiroir, navigation : aucun effet sur la synthèse.
- **Respecte `AUTO_SYNTHESIS`** (`src/lib/auto-synthesis.ts`) : auto seulement si le flag vaut `"true"` (posé au lancement) ; sinon déclenchement manuel, comme Quartier aujourd'hui.
- **Bouton « régénérer » conservé** (comme Quartier), même quand l'auto est active.

## Cache / artefact

**Clé de faits** : `factHash = hash(pointGéocodé, dpeId | "none", versionSources, versionPrompt)`.
- `versionPrompt` : constante bumpée quand on muscle le prompt → invalide les caches.
- `versionSources` : capte un recalcul du snapshot autour (aligné sur `SOURCES_VERSION` Face 3).
- La posture n'entre PAS dans le hash (garantit qu'elle ne régénère jamais).

**Gating en session** : le client garde le dernier `factHash` ; il ne relance le fetch que si le hash change.

**Persistance durable** : migration `supabase/20_logement_synthese.sql` ajoute à la table `logement` (clé `(user_id, insee)`, RLS own déjà en place) :
```sql
alter table public.logement
  add column if not exists synthesis_text        text,
  add column if not exists synthesis_fact_hash   text,
  add column if not exists synthesis_generated_at timestamptz;
```
- **Cache touché** (`synthesis_fact_hash` stocké == `factHash` courant) → rendu **instantané du texte figé, zéro LLM**, y compris entre sessions. Sert le reload et le PDF.
- **Cache raté** → on **streame** la prose ET on **persiste** le texte final + le hash + la date via `after()` (Fluid Compute), exactement le patron de la Face 3.

## Architecture

- **Route `src/app/api/synthesize-logement/route.ts`** : passe de la réponse JSON à un **`ReadableStream`** (patron `synthesize-quartier/route.ts:381`). En entrée du handler : lit le cache par `factHash` (hit → renvoie le texte figé ; miss → streame + `after()` persiste). Prompt système = le squelette ci-dessus.
- **Payload** (sérialisé dans la route, faits déjà montrés uniquement) :
  - **Ajouter** le snapshot **autour** (Face 3 : BPE + espaces verts), absent aujourd'hui, indispensable au mouvement « environnement immédiat ».
  - **Retirer** `irep` (industrie) et `friches` (sols pollués) : frontière Santé, hors du mouvement « autour » (qui est BPE/vert). Nettoyage de frontière au passage.
  - Conserver : DPE + `confortEte` (via `thermalEvidenceSummary`, sous verrou confirmé), risques RGA/PPRN, sinistralité ONRN, commune.
- **Lib pure `src/lib/logement-synthesis-cache.ts`** : `buildFactHash(input)` déterministe ; `buildSynthesisPayload(data)` (assemble les faits, inclut autour, exclut posture + IREP/friches). Sans `server-only` si utile au client pour le gating ; sinon `server-only`.
- **Composant `src/components/report/LogementSynthesis.tsx`** : miroir de `QuartierSynthesis.tsx`. Gère le fetch stream (`getReader`/`TextDecoder`, accumulation dans `synthText`), les états `idle`/`streaming`/`done`/`error`, le **gating par `factHash`** (ne relance que si le hash change), le **bouton régénérer**, l'instrumentation PostHog (`logement_ai_summary_started`/`completed`/`failed`), et le respect de `AUTO_SYNTHESIS`. Remplace le bloc « Lecture personnalisée » + bouton manuel actuel dans `LogementModule.tsx`, **à sa position actuelle** (le déplacement = 1b).
- **Persistance** : endpoint ou write direct sous RLS own `(user_id, insee)`, déclenché par `after()` à la fin du stream. Réutilise le canal d'écriture de la table `logement` déjà en place.

## Doctrine / frontières

- Frontière **Logement / Santé** tenue : IREP + friches quittent le payload synthèse (ils iront à Santé). Le mouvement « environnement immédiat » = BPE + espaces verts, pas pollution/industrie.
- Aucune nouvelle donnée créée : la synthèse **relit** des blocs déterministes déjà affichés.

## Tests

- **Lib pure `logement-synthesis-cache.test.ts`** (`node --test --experimental-strip-types`) :
  - `buildFactHash` : mêmes faits → même hash ; changement de `dpeId` → hash différent ; changement de `versionPrompt`/`versionSources` → hash différent ; **changement de posture → MÊME hash** (régression-garde de « la posture ne déclenche jamais »).
  - `buildSynthesisPayload` : inclut le snapshot autour ; **exclut** la posture, `irep`, `friches` ; inclut `confortEte` seulement sous verrou DPE confirmé.
- Route streamée + composant : **pas de test unitaire** (aligné sur Quartier, non testé). Vérification par `tsc` + build.
- Migration + `after()` : vérifiés par `tsc` + `npm run build`.

## Séquence d'implémentation (indicative)

1. Migration `20_logement_synthese.sql` (colonnes cache).
2. Lib pure `logement-synthesis-cache.ts` (`buildFactHash` + `buildSynthesisPayload`) + tests.
3. Route `synthesize-logement` → `ReadableStream` + prompt réécrit + lecture/écriture cache (`after()`).
4. Composant `LogementSynthesis.tsx` (miroir Quartier) + gating + régénérer + PostHog.
5. Câblage dans `LogementModule.tsx` (remplace le bloc manuel, position inchangée), déclenchement sur état DPE terminal, respect `AUTO_SYNTHESIS`.
6. Vérifs `tsc` / `eslint` (fichiers touchés) / `build` / tests libs.

## Ouvert (hors 1a)

- Wordsmithing fin du prompt : peut passer une revue **Editorial Writer** avant de figer.
- Réordonnancement (spec 1b) : remontée de la synthèse en tête + `DpeSelector` avant toute lecture + ordre des faces.
- Migration IREP/friches vers le futur module Santé (ils quittent seulement le payload synthèse ici, restent affichés ailleurs tant que Santé n'existe pas).
