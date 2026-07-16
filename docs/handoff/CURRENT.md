# Passation — chantier « composition narrative de faits liés », Task 5/6 en cours

**Horodatage** : 2026-07-17 · **Branche** : `feat/composition-faits-lies` (4 commits feat au-dessus de
`main` ; spec + plan commités SUR `main` avant branchement : `203c7c8`, `084fa88`, `be58a0d`).
**Rien n'est poussé** (ni main ni la branche). Aucune PR ouverte.

## Objectif en cours

Implémenter la couche de composition post-évaluation du dossier de décision : deux patrons
(`seasonal_climate_tradeoff` : douceur satisfaite × réserve chaleur ; `territory-size-multiple-consequences` :
deux mismatchs taille du même état village) qui composent des cartes plus intelligibles SANS toucher
couverture/outcome/orientation. Spec `docs/superpowers/specs/2026-07-17-composition-faits-lies-design.md`
(10 invariants), plan v2 `docs/superpowers/plans/2026-07-17-composition-faits-lies.md` (6 tâches TDD),
exécution INLINE (choix porteur), tâche par tâche.

## Fait dans cette session

- Clôture lot 4b : seuil identitaire 80 vérifié figé ; impact-B minimal prouvé au matcher réel
  (douceur seule → Antibes/41 j chauds ; douceur+chaleur → Gouesnou/Cherbourg, façade Manche).
- Mémoire : fiche `mismatch_formes_fondement` gravée, `project_dossier_decision` mise à jour (27/28),
  `MEMORY.md` compacté 19,8 → 12,7 Ko, fiche `feedback_questions_doctrinales_developpees` ajoutée.
- Spec écrite + validée porteur (brainstorm complet, 3 AskUserQuestion tranchées) ; plan v1 puis v2
  après revue croisée ChatGPT (6 points intégrés, 4 rejetés preuve au code, 1 rejet doctrinal).
- **Tasks 1-4 TERMINÉES et commitées** (tests verts 281/281 decision, tsc 0 à chaque commit) :
  - `e5cadd0` : `fact-composition.ts` (types), `fact-compositions.ts` (patron 1 + `buildWinterMildnessEvidence`
    + `assertCompositionsValid`), exports `RULE_CHALEUR`/`mismatchRuleId`/`bandValide`.
  - `1207be6` : patron 2 (basis `categorical_state` requis, catégorie `village` seule, tri déterministe
    tie-break projectKey/id, `eviter_grandes_villes` exclu).
  - `5e59c03` : assembleur (param 5 `compositions`, `DossierCard` liste unique triée `cardTier` puis
    cappée, absorbés retirés avant caps → `dossier.absorbedFacts`, comptes `presentation`,
    `conclusionBasis` enrichi, 4 fichiers e2e adaptés à `section.cards` via helper `sectionFacts`).
  - `2b85a46` : plan narratif (`shownCompositions` REQUIS dans `ConclusionPlanInput`, registre
    `compositions_found` entre unexamined et reserves, `selectLead(facts, comps)` candidats tradeoff
    UNIQUEMENT, skip du bloc si lead single composé), prompt v11 (paragraphe compositions_found),
    sonde : 7 cas existants + `planCompositionLead` + `planCompositionBloc`.

## Décisions prises (porteur, pas encore au vault)

- `FactComposition` = VUE hors `DecisionFact` ; gates poids ≥ 2 partout ; jamais repêcher un silencieux.
- Liste unique de cartes triée par tier puis cappée ; à tier égal la composition passe d'abord.
- Lead : tradeoff oui, shared_evidence JAMAIS (les mismatchs sont exclus du lead par doctrine).
- Titre retenu : « Des hivers doux, avec une exposition estivale à arbitrer ».
- Constructeur : outcome depuis l'évaluation seule ; preuve favorable par helper canonique, jamais re-dérivée.

## État git

- Branche `feat/composition-faits-lies`, 4 commits feat NON poussés ; `main` local a 3 commits docs
  NON poussés (spec + plan x2).
- **Non commité (Task 5 en cours, step 4 interrompu avant build)** :
  - `src/components/report/DecisionFactRenderParts.tsx` (NOUVEAU : Chip/EvidenceRow/FactBody extraits, exportés)
  - `src/components/report/FactCompositionCard.tsx` (NOUVEAU : 2 variantes + dépliable `<details>`)
  - `src/components/report/DossierDecisionSection.tsx` (modifié : importe les briques + rend les
    compositions dans la boucle `s.cards`)
- `Futur.e Design System.zip` : fichier étranger du porteur à la racine, NE PAS committer.

## Prochaine étape immédiate

Terminer Task 5 step 4 : `npx tsc --noEmit && npm run build` (le build a été interrompu par le porteur,
PAS en échec). Si vert : committer les 3 fichiers rendu
(`feat(dossier): FactCompositionCard (2 variantes + dépliable d'audit) sur briques partagées`).
Puis Task 6 (plan §Task 6) : brancher `composeFacts` dans `territory-facts.ts:158` et
`DossierAvecLogement.tsx:46`, suites complètes, vérification vivante (Antibes 06004 douceur 3 + chaleur 3 ;
Gouesnou 29061 ; un village avec prefere_grande_ville 3 + eviter_isolement 2), sonde
`node --env-file=.env.local scripts/probe-conclusion.ts` (2 cas composés ajoutés).

## À lire d'abord à la reprise

1. `MEMORY.md` (index mémoire, compacté cette session).
2. La spec `docs/superpowers/specs/2026-07-17-composition-faits-lies-design.md` puis le plan
   `docs/superpowers/plans/2026-07-17-composition-faits-lies.md` (v2 : les révisions y sont notées en tête).
3. `docs/handoff/AUTO-SNAPSHOT.md` pour vérifier la fraîcheur.

## Pièges / fils ouverts

- `node --test` : jamais value-importer `comparateur-vie.ts` (server-only) depuis un fichier testé.
- Écart spec assumé (noté dans l'auto-revue du plan) : `DossierSection.cards` remplace `facts` ;
  reporter dans la spec au moment du merge.
- Après merge : bump prompt v11 invalide les artefacts narratifs existants (voulu) ; la sonde doit
  tourner AVANT livraison (cas composés jamais encore éprouvés face au vrai modèle).
- `mismatchShown` (ConclusionPlanInput) n'est consommé par aucun texte ; sémantique désormais
  « cartes mismatch visibles » (fait simple + shared_evidence), documentée dans l'assembleur.
- Le porteur n'utilise PAS les Preview Vercel ; prod = push `main`. Ne pas pousser `main` sans demande.
- Mémoire : les décisions de composition (vue vs fait, gates, lead) mériteront une fiche `/memory` +
  éventuel passage archiviste une fois le chantier livré.
