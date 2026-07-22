# Passation — Refonte visuelle et éditoriale du dossier « En une minute » : TOUT EN PROD

**Horodatage** : 2026-07-23 · **Branche courante** : `main` (à jour avec `origin/main`, prod déployée sur push)

## Objectif en cours

Reprise après la refonte de la tête de `/rapport`. Le **rapport éditorial est désormais entièrement
traité** (`docs/rapports-agents/editorial-writer/2026-07-22-verdict-heros-copie.md`, §1 à §5). La
session a ensuite enchaîné sur des **défauts vus à l'écran sur des rapports réels** (Salers, Antibes,
Toulouse+adresse, Villeurbanne…), puis sur une **passe de lisibilité / design** du bloc des constats.
Le dernier livrable (états scannables + tradeoff en face-à-face) attend le retour visuel du porteur.

## Fait dans cette session (23 commits, tous poussés)

Enchaînement `8e0824f` → `2f4f9e2`. Groupés par thème :

**Le rapport éditorial, sections restantes.**
- §3 sujets par critère + retouches validées (`8e0824f`), §3.1 cause commune `headlineCause` (`b5a6f9a`).
- gate 110→130 + **lot D** (la strate `reserves_found` devient « À regarder d'abord/ensuite », un moule
  au lieu de quatre, `requiredPhrases`=subject, `allowedNumbers`=[], prompt v13) (`17690de`).
- **lot A2** : `DecisionAction { type, label, detail }`, 23 variantes posture-aware + 6 libellés
  réécrits, dépliable à deux zones nommées (« À vérifier » / « Méthode du signal »), prompt v14 (`3cf3307`).

**Défauts vus à l'écran (aucun n'était une erreur de logique : textes justes au mauvais endroit).**
- Nom de commune sorti des 8 topics de réserve (`e10e79b`) ; lexique « conditions » pas « contraintes »
  (`4445de7`) ; condition non remplie lue une fois, section masquée (`cb61ea5`) ; libellé priorité en
  bas de casse (`4c893ba`) ; sujet sans coordination interne (`07a51ae`) ; 4 défauts (faute d'accord
  communeSize, participe excludePlace, preuves dédupliquées à l'affichage, tier→priorité) (`5e03b38`) ;
  **une carte démontre, elle ne conclut pas** : conclusion retirée des 7 statements de mismatch (`ab665ad`) ;
  dépliable ne redit plus la face (`fcf3003`) ; preuve orpheline chaleur, adresse répétée (`b5a6f9a`).
- **Posture « j'y habite déjà »** : 6 fragments de vocabulaire, plus jamais « votre projet » pour un
  habitant, titre carte « Ce qui compte pour vous » (`b8a52bf`).

**Design.**
- Échelle typo à 4 rôles (11 utilitaire / 13 annexe / 15 corps / 16 titre / 17 bloc-tête) (`2ec33bc`).
- `.card-verdict` : liseré rendu au verdict, halo retiré (`e34fbe9`), écart de surface + **4 tons pour
  4 états** (`positive`→`--green`, avant collision avec orange) (`1a923f3`), **lavis de ton** color-mix
  (`d32c220`).
- Lisibilité : glyphe par nature de geste, action en fonte de lecture, filet entre constats, volets de
  composition en sous-titres, contraste limitations (`8acf172`) ; titre section = une idée (`8104455`).
- **Dernier livrable** (`2f4f9e2`) : **états scannables** (`status` produit par les règles, rendu en
  étiquette `StatusTag` avant le constat) ; **grain sur les compositions** (`cardGrain`, plus de 3e
  catégorie) ; **tradeoff en face-à-face** deux colonnes (favorable vert / arbitrage orange).

**Vérifs finales** : `tsc` 0, `eslint` 0 sur le périmètre touché, **695 tests**, `npm run build` 2255 pages.

## Décisions prises (non encore dans le vault)

**Tranchées par le porteur :**
- Gate du héros à **130** caractères (calibrée à l'écran).
- Minimalisme assumé : « donner les infos nécessaires, ne pas surcharger ». Le dépliable des
  compositions ne garde que ce que la face ne narre pas ; la section incompatibilité disparaît quand
  une seule condition établie est en cause.
- Design du verdict : **pas de halo** (tape-à-l'œil), la couleur suit le ton et **diffuse dans la
  surface** (lavis), jamais un décor.
- États scannables OUI (niveau 2 du retour), mais **produits par les règles**, jamais découpés dans le
  statement par l'UI.

**Proposées et appliquées (à valider a posteriori) :**
- **Doctrine « une carte démontre, elle ne conclut pas »** : le verdict conclut (et peut dire l'inverse
  d'une carte qui concluait). Les limites épistémiques ont migré du `statement` vers `limitation`.
- **Lexique par posture** : `habitant` est le seul aiguillage qui bascule, écrit comme un défaut
  d'aiguillage (6 fragments) plutôt qu'une seconde table de vérité.
- **Règles de présentation dans `src/lib/decision/dossier-view.ts`** (pur, testé), jamais dans le JSX :
  `conditionPorteeParLeBloc`, `sectionsAffichees`, `factsNonNarresParLaFace`.
- Écartés du retour design du porteur, argumentés dans `2f4f9e2` : micro-étiquettes de nature d'action
  (redondantes avec les glyphes), deux fonds par grain (boîtes dans des boîtes), face-à-face 2 colonnes
  pour argiles+PPR (relation **unidirectionnelle**, pas une opposition — le tradeoff, lui, l'est).

## État git

- `main` = `2f4f9e2`, **poussée**, prod déployée. **0 commit en attente.** Aucune PR ouverte.
- Non suivi : `Futur.e Design System.zip` (fichier porteur, **NE JAMAIS COMMITTER**).
- `docs/handoff/AUTO-SNAPSHOT.md` est **périmé** (2026-07-08) : ignorer, ce CURRENT.md fait foi.

## Prochaine étape immédiate

**Attendre le retour visuel du porteur sur `2f4f9e2`** (il rechargeait `/rapport` sur Salers / Antibes /
Toulouse+adresse). Deux points ouverts explicitement laissés à son œil :
1. l'étiquette `StatusTag` (« ALÉA MOYEN OU FORT ») fait-elle doublon avec le titre de composition juste
   au-dessus ?
2. le **tradeoff à 2 colonnes tient-il sur mobile** ? (s'empile sous 768px via `md:grid-cols-2`, non
   vérifié depuis le terminal — nécessite un vrai navigateur).

Si le porteur valide, le prochain gros chantier est le **lot C** (le côté FAVORABLE, prouvé et nommé) :
spec écrit, **non codé**. C'est le seul chantier qui ajoute de l'information au lecteur — aujourd'hui la
branche `favorable` du verdict ne nomme rien (« Toulouse semble bien correspondre à votre projet » sans
dire pourquoi), faute de fait favorable déterministe. Spec : `docs/superpowers/specs/2026-07-22-lot-c-ce-qui-correspond-design.md`.

## À lire d'abord à la reprise

- `MEMORY.md` (index), puis : `project_dossier_decision.md`, `project_composition_faits_lies.md`,
  `mismatch_formes_fondement.md`, `project_module_logement.md`.
- Doctrine voix : `feedback_no_em_dash.md`, `feedback_no_antithese.md`, `feedback_offre_pas_sujet.md`,
  `feedback_positionnement_compatibilite.md`, `feedback_tooltip_no_sources.md`.
- Specs du sujet : `docs/superpowers/specs/2026-07-22-lot-c-ce-qui-correspond-design.md` (prochain
  chantier), `2026-07-22-lot-d-strate-de-poids.md` (livré, Q1/Q2/Q3 tranchées dedans).
- Le rapport source, entièrement traité : `docs/rapports-agents/editorial-writer/2026-07-22-verdict-heros-copie.md`.

## Pièges / fils ouverts

- **`tsconfig.json` exclut `**/*.test.ts` du typecheck.** Les fixtures n'ont AUCUN filet de type : un
  champ obligatoire ajouté à un fait (ex. `headlineSubject`, `status`) ne fait pas échouer `tsc` sur les
  tests, et plante en `TypeError` à l'exécution. Trois défauts de la session venaient de là. Toujours
  ajouter une garde nommée dans `assertFactValid` / `assertCompositionsValid`.
- **Le terminal ne montre pas les défauts de COMPOSITION.** Tous les défauts de cette session étaient
  invisibles aux tests (qui vérifient un élément isolé) et sautaient aux yeux sur la vraie page (deux
  phrases justes côte à côte qui sonnent faux). Faire regarder l'écran, pas seulement le vert.
- **4 erreurs eslint préexistantes subsistent** (`ConclusionRedigee`, `DossierAvecLogement` = JSX in
  try/catch ; `HorizonBar` = `<a>` au lieu de `<Link>` ; `QuartierSynthesis` = ref pendant le rendu).
  Antérieures à la session, non introduites. `ProjectSummaryCard` en avait 3, tombées en sortant son
  composant du rendu (`b8a52bf`).
- **La sonde coûte des appels API réels** : ciblable via `PROBE_TIRAGES=2 PROBE_ONLY=strate-suite,réserves
  node --env-file=.env.local scripts/probe-conclusion.ts`. Non relancée depuis le lot D (le prompt v14 et
  la projection du lead ne changent que du déterministe validé par tests).
- **Le champ `status` (état scannable) n'existe que sur les 5 familles logement + DPE.** Les faits
  `territoire` (chaleur, air, bruit, industrie…) n'en portent pas encore : leur exposition est graduée,
  pas un état franc. À traiter si le porteur veut la même lisibilité côté territoire, avec la même
  honnêteté (ne dire que ce qu'on mesure).
- **Lot C** : spec prêt, la branche `favorable` du verdict ne nomme toujours rien de spécifique.
- **A1** (mécanique du lot A) : débloqué, jamais commencé.
- `node --test` : ne jamais value-importer `comparateur-vie.ts` (server-only) depuis un fichier testé.
- Doctrine : push direct sur `main` assumé (prod sur push, pas de Preview Vercel).
