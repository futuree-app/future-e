# Passation — Tradeoff à lavis, masquage du doublon de taille, verdict sans « Ils » orphelin : EN PROD

**Horodatage** : 2026-07-23 · **Branche courante** : `main` = `a447a7f`, **poussée**, prod déployée. **0 commit en attente.**

## Objectif de la session

Reprise sur le retour visuel attendu du porteur (handoff précédent, commit `2f4f9e2`). Le porteur a
regardé `/rapport` sur un projet climat (Toulouse) et deux points de design/copie ont été traités, plus
un correctif éditorial du verdict. Un seul commit couvre tout : `a447a7f`.

## Fait dans cette session (1 commit, poussé)

**1. Tradeoff en face-à-face — lavis de ton (Direction A validée par le porteur).**
- Chaque côté devient un **panneau à lavis** : la MÊME encre que `.card-verdict` en plus léger
  (12/3 % vs 15/4 %), `color-mix` derrière `@supports`, filet supérieur coloré 2px, **eyebrow mono
  capitale à son ton** (vert / orange). Le ton se VOIT enfin (avant il ne vivait que dans les pastilles).
- Filet central retiré (il disparaissait au stacking mobile) ; `md:grid-cols-2` + `items-start` : chaque
  panneau hugge son contenu et **s'auto-identifie une fois empilé**. `grouped_verification` reste SANS
  panneau (ses items se complètent, ne s'opposent pas).
- Fichiers : `src/components/report/FactCompositionCard.tsx` (prop `panel` sur `SideBlock`),
  `src/app/globals.css` (classe `.tradeoff-side`).

**2. Masquage du doublon de taille.**
- Le lecteur peut poser DEUX critères sur la même dimension : contrainte dure `communeSize` (fourchette)
  + priorité souple de taille. Quand la dure est établie incompatible, elle porte le verdict avec le même
  chiffre et la même conclusion que le mismatch souple (« Une métropole »). On **masque** ce mismatch.
- Lecteur PUR `sectionsAffichees` étendu dans `src/lib/decision/dossier-view.ts`
  (`tailleEtabliePorteeParLeVerdict`, `estCarteMismatchTailleSymetrique`), jumeau de
  `conditionPorteeParLeBloc`. **Le fait reste dans le dossier** (couverture, base de conclusion).
- Portée STRICTE : clés **symétriques** seulement (`eviter_grandes_villes` / `prefere_grande_ville`) ;
  `eviter_isolement` (asymétrique, limite propre « ne prouve pas un isolement effectif ») **jamais masqué**.
  Cartes-FAITS seulement (une composition shared_evidence peut porter aussi un fait non redondant).

**3. Unification du lexique du périmètre UU → « agglomération ».**
- Un seul mot face au lecteur : « agglomération » (celui du héros et de `labelForCategory`).
  « unité urbaine » reste le terme de PROVENANCE (commentaires, ligne source).
- Fichiers : `agglomeration-facts.ts` (`categoryStatementFragment`), `agglomeration-rules.ts` (`popText`).

**4. Verdict : « Ces points / Ce point » au lieu d'un « Ils » orphelin.**
- `conclusion-plan.ts`, branche `major_reserves` + favorable : le « Ils » (n = réserves) tombait juste
  après une clause favorable (« un élément favorable », singulier), lu comme désaccord de nombre et
  antécédent flottant. Sujet désormais NOMMÉ, renvoie aux points à contrôler comptés par le héros.

**Vérifs** : `tsc` 0, `eslint` 0, **700 tests** (695 + 5 nouveaux).

## Points du handoff précédent — résolus

- **Tradeoff 2 colonnes sur mobile** : traité par les panneaux à lavis auto-identifiants (`items-start`,
  plus de filet central qui disparaissait). Non re-vérifié sur mobile réel depuis le terminal, mais la
  structure ne dépend plus d'un séparateur qui saute au stacking.
- **StatusTag doublon** : le porteur a tranché **OK, on garde** (pas de doublon avec le titre de composition).

## Décisions prises (à verser au vault si utile)

- Design tradeoff = **lavis de ton par côté** (pas de fond plat, pas de filet central) : la couleur diffuse
  dans la surface, cohérente avec le verdict.
- Doublon dure+souple de taille : **on masque le souple** quand la dure porte le verdict (symétriques
  seulement). L'asymétrie de hauteur des deux côtés du tradeoff est **assumée** (le côté favorable a
  réellement moins à dire ; l'étirer laisserait une plaque teintée à moitié vide).
- Lexique : **« agglomération »** gagne face à « unité urbaine » pour la prose face-lecteur.

## Prochaine étape immédiate

Le gros chantier restant est le **lot C** (le côté FAVORABLE, prouvé et nommé) : spec écrit, **non codé**.
C'est le seul chantier qui AJOUTE de l'information au lecteur — aujourd'hui la branche `favorable` du
verdict ne nomme rien de spécifique (« Toulouse présente un élément favorable » sans dire lequel), faute
de fait favorable déterministe. Spec : `docs/superpowers/specs/2026-07-22-lot-c-ce-qui-correspond-design.md`.

## À lire d'abord à la reprise

- `MEMORY.md` (index), puis : `project_dossier_decision.md`, `project_composition_faits_lies.md`,
  `mismatch_formes_fondement.md`, `project_module_logement.md`.
- Doctrine voix : `feedback_no_em_dash.md`, `feedback_no_antithese.md`, `feedback_offre_pas_sujet.md`,
  `feedback_positionnement_compatibilite.md`, `feedback_tooltip_no_sources.md`.
- Specs : `docs/superpowers/specs/2026-07-22-lot-c-ce-qui-correspond-design.md` (prochain chantier).

## Pièges / fils ouverts

- **`tsconfig.json` exclut `**/*.test.ts` du typecheck.** Les fixtures n'ont aucun filet de type : un champ
  obligatoire ajouté à un fait ne fait pas échouer `tsc` sur les tests et plante à l'exécution. Toujours
  une garde nommée dans `assertFactValid` / `assertCompositionsValid`.
- **Le terminal ne montre pas les défauts de COMPOSITION.** Faire regarder l'écran, pas seulement le vert.
- **Masquage de taille = symétriques uniquement.** Ne jamais étendre à `eviter_isolement` (asymétrique,
  porte une limite propre) ni aux compositions (elles peuvent porter un fait non redondant).
- **Le champ `status` (état scannable)** n'existe que sur les 5 familles logement + DPE. Les faits
  `territoire` (chaleur, air…) n'en portent pas : exposition graduée, pas un état franc.
- **Lot C** : spec prêt, la branche `favorable` ne nomme toujours rien de spécifique.
- **A1** (mécanique du lot A) : débloqué, jamais commencé.
- `node --test` : ne jamais value-importer `comparateur-vie.ts` (server-only) depuis un fichier testé.
- Doctrine : push direct sur `main` assumé (prod sur push, pas de Preview Vercel). Suite : `node --test
  --experimental-strip-types "src/**/*.test.ts"`.
- Non suivi : `Futur.e Design System.zip` (fichier porteur, **NE JAMAIS COMMITTER**).
