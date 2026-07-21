# Lot A : désengorger les cartes du dossier « En une minute »

Branche : `feat/lot-a-depate-en-une-minute` (partie de `main` @ c844b49).
Périmètre : présentation des cartes du dossier de décision en tête de `/rapport`.
NON touché : le verdict / `ConclusionBlock.tsx` (Lot B), la structure DOM déterministe, aucun
compteur/badge/score, la teinte violet du non-savoir, le TEXTE des labels (règles, éditorial).

## Fichiers modifiés (3)

### 1. `src/components/report/DecisionFactRenderParts.tsx`
- **`FactBody`** : la ligne `signalConvention` a été RETIRÉE de la face. La face garde le constat et
  UNE seule ligne ghost (la `limitation`). C'était la 2e ligne ghost, cœur du « pâté ».
- **Nouveau `MethodDetails({ conventions })`** (exporté) : un `<details>` discret « Méthode et détails »,
  même langage visuel que le `<details>` « Voir le constat détaillé » des cartes composées (summary mono
  10px uppercase text-muted, filet gauche). Il déduplique les conventions (Set) et ne rend rien si la
  liste est vide. C'est là que `signalConvention` atterrit désormais, à un clic. Rien ne disparaît.
- **Nouveau `ActionCue({ label, color })`** (exporté) : le repère d'action, restyle présentation (point 3).
- **`EvidenceRow`** restructuré en deux rangées empilées (`flex-col`) : rangée des chips de preuve, puis
  l'action sur SA propre ligne via `ActionCue`. Avant, preuve et action partageaient une seule rangée
  `flex-wrap`, d'où la collision « PREUVE / ACTION » du point 2.

### 2. `src/components/report/FactCompositionCard.tsx`
- **`SideBlock`** : ligne `signalConvention` retirée de la face ; evidence + action re-structurées comme
  `EvidenceRow` (chips sur une rangée, `ActionCue` en dessous).
- **Nouveau `compositionConventions(composition)`** : collecte les `signalConvention` des côtés (tradeoff)
  ou des items (grouped_verification), filtrées non vides. Le shared_evidence n'en porte pas.
- La carte composée rend UN `<MethodDetails>` (conventions dédupliquées) juste avant le `<details>`
  « Voir le constat détaillé » existant. Comme la convention d'un côté vient du fait absorbé
  (fact-compositions.ts la recopie), rien n'est perdu et rien n'est dupliqué : la face n'a plus la
  ligne, le dépliable méthode la porte une fois.
- Les chips (SideBlock + branche shared_evidence) reçoivent le correctif du point 2.

### 3. `src/components/report/DossierDecisionSection.tsx`
- Import `Fragment` + `MethodDetails`.
- **Carte élémentaire** : après `FactBody` + `EvidenceRow`, ajout d'un `<MethodDetails>` alimenté par
  `f.signalConvention` (verification uniquement). Ces cartes n'avaient PAS de dépliable : elles en ont
  un maintenant, discret, seulement quand une convention existe.
- **Grain en intertitre de groupe (point 4)** : l'eyebrow de grain ne se répète plus sur chaque carte.
  Logique dans une IIFE par section :
  - on calcule les grains des cartes ÉLÉMENTAIRES de la section ;
  - `showGrain = (nb de grains distincts) > 1` : le grain ne s'affiche QUE si la section mélange les grains ;
  - quand il s'affiche, un intertitre de groupe (`<li>` mono 10px uppercase ghost, `list-none`) est posé
    au-dessus d'une carte SEULEMENT quand son grain change par rapport à la carte élémentaire précédente.
  - Aucun tri : l'ordre des cartes est strictement préservé (déterministe et stable). Les cartes
    composées n'ont pas de grain et n'interrompent pas le suivi.

## Point 2 : traitement exact retenu (À VALIDER)
Règle appliquée dans le `Chip` : `label = (e.href && e.observedValue) ? "Preuve" : e.label`.
- href + valeur -> « Preuve · valeur » (inchangé : preuve établie, chiffrée).
- href SANS valeur -> le libellé de la SOURCE (ex. l'adresse « 12 rue des Argiles »), en lien cliquable.
  C'était le cas buggé où « PREUVE » nu se lisait comme l'étiquette de l'action juste à côté.
- pas de href -> `e.label` (inchangé).
Distinction preuve / action désormais nette par TROIS moyens cumulés : (a) la preuve est un chip bordé,
l'action est du texte sans bordure ; (b) elles sont sur des lignes séparées ; (c) l'action est en casse
basse avec une flèche colorée en tête, la preuve en capitales mono.
Choix vs l'alternative « lien source discret séparé » : conservé le chip (cohérent avec les autres
preuves) mais renommé par sa source. Si le porteur préfère un vrai style « source » distinct des chips
chiffrés, c'est un petit ajout localisé.

## Point 3 : restyle action (CONSERVATEUR, À RELIRE)
`ActionCue` : `→ {label}` sur sa propre ligne, flèche teintée de la couleur d'état de la section, label
en mono 10px CASSE BASSE (le `uppercase` a sauté) text-muted. Avant : `{label} →` en mono 10px
MAJUSCULES, dans la rangée des preuves, wrappant pleine largeur.
- Le TEXTE du label n'est pas touché (éditorial). Seule la présentation change.
- Version conservatrice : l'action reste VISIBLE sur la face (pas cachée dans le dépliable), mais
  dé-emphasée pour ne plus rivaliser avec le constat.
- SIGNAL ÉDITORIAL : certains labels d'action sont de vraies phrases longues (ex.
  « Regardez la position exacte du logement par rapport aux axes routiers, et la façade sur laquelle
  donnent les chambres », `materiality-rules.ts:342` ; « Demandez l'historique des fissures et
  sinistres, faites vérifier les fondations. », `logement-rules.ts:59`). Même dé-emphasées elles
  restent longues. NON réécrites (interdit). À arbitrer par l'Editorial Writer si l'on veut un label
  d'action court + détail long déporté dans « Méthode et détails ».

## Point 5 : largeur de lecture — RAPPORT, NON APPLIQUÉ
État mesuré :
- Conteneur de page `/rapport` : `max-w-[1100px] mx-auto px-7` (`src/app/(account)/rapport/page.tsx:102`).
  PARTAGÉ avec Territoire (même page) et avec `/rapport/quartier` (`:117`). Donc NE PAS le resserrer
  globalement (casserait la largeur des autres modules).
- Les cartes du dossier vivent dans `<div className="grid gap-3.5">` (DossierDecisionSection) et
  remplissent ~1100-56 px : lignes longues sur desktop.
- Le hero de `/rapport` est `grid grid-cols-[1fr_400px]` (`:162`), le dossier est en pleine largeur en dessous.

Recommandation (NON appliquée, à trancher par le porteur) :
Le levier doctrine-safe ET module-safe est un `max-w` sur le CONTENEUR DES CARTES du dossier (le
`grid gap-3.5`), PAS sur chaque paragraphe. Ça rétrécit les cartes bordées elles-mêmes ; le texte
continue de REMPLIR chaque carte -> doctrine `feedback_text_maxwidth` respectée (aucune phrase coupée
à mi-bloc). Ça n'affecte ni le conteneur de page, ni Territoire, ni Logement. Valeur suggérée à tester :
`max-w-[860px]` (à caler à l'œil).
Pourquoi je ne l'applique pas : (a) c'est un choix visuel de fond que le porteur doit valider ;
(b) le verdict (`ConclusionBlock`, Lot B) est dans la même section juste au-dessus des cartes : si l'on
veut une colonne de lecture cohérente, il faudrait décider si le verdict suit la même largeur, et le
verdict est hors de mon périmètre. Je laisse donc la décision + l'éventuelle coordination avec le Lot B.

## Vérifications
- `npx tsc --noEmit` : 0 erreur.
- `node --test src/lib/decision/*.test.ts` : 294 pass, 0 fail (je n'ai touché aucun type de lib).
- Build : le worktree n'a pas de `node_modules` ; Turbopack refuse un symlink hors racine FS. Build
  lancé via `npx next build --webpack` (webpack suit le symlink vers le node_modules du checkout
  principal) : **« ✓ Compiled successfully in 22.7s »**. L'étape suivante « Collecting page data »
  échoue sur `supabaseUrl is required` (`/api/logement-autour`), un défaut d'ENV du worktree isolé,
  sans rapport avec les composants UI de ce lot (aucune route API / Supabase touchée). Analogue aux
  timeouts SSG environnementaux à ignorer. La compilation, elle, passe.

## Résumé des points à jugement à relire
1. Point 2 : renommer le chip par sa source vs style « source » distinct. Retenu : renommer.
2. Point 3 : action visible mais dé-emphasée. Labels longs signalés pour l'Editorial Writer.
3. Point 5 : recommandation `max-w` sur le grid des cartes, NON appliquée (choix porteur + coord Lot B).
