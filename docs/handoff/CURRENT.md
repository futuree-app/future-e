# Passation — session en cours

**Horodatage** : 2026-07-12 · **Branche courante** : `main`. Poussée jusqu'à `6c18eec` ; **`1fadcd5` (refonte visuelle) commité localement, à pousser**. Aucune PR ouverte.

## Objectif en cours
Chantier **« architecture décision motivée » du rapport payant**. Le **slice 1 du dossier de décision** (« En une minute ») est LIVRÉ, validé en live et poli au design system. La suite naturelle est le **slice 1.5** (brancher les faits Logement quand une adresse est présente) puis le **slice 2** (IA de formulation bornée, fallback déterministe permanent).

## Fait dans cette session (tout sur `main`)
1. **Merges de nettoyage** (`0e801f7`, `da807fb`) : les 2 dernières branches non mergées (Face 2 Logement patrimoine ABF + risques bâti au point) intégrées, conflits résolus, branches locales périmées supprimées, tag de sécurité `pre-merge-safety-2026-07-11`.
2. **Durcissement de la persistance du projet** (`3b6bc85`, `6c18eec`) : contrat `UserProjectInput`/`UserProject` séparés (schemaVersion + updatedAt serveur), `/api/profile` `if_empty` atomique (garde SQL `.is(null)`) et retourne le projet enregistré, `ProjectSummaryCard` sauvegarde honnête (`response.ok`, éditeur ouvert sur échec, projet retourné par le serveur) + `router.refresh` (régénère le dossier), `OuVivreProjectSync` persiste `rawText` sans `parsed` + `router.refresh`, sélecteur de posture (aucun défaut deviné), `mergeProjectEdit` retiré. Plan : `docs/superpowers/plans/2026-07-11-persistance-projet-durcissement.md`.
3. **Dossier de décision slice 1** (`5768229`, `42c8c95`, `0653358`) : moteur déterministe sous `src/lib/decision/` (contrats union discriminée, lecteurs projet + couverture, adaptateur `module-facts-map`/`territory-facts`, registre 5 règles `evaluate()`, invariants `assertFactValid`, assembleur), page serveur `DossierDecisionSection` insérée sur `/rapport` payant, 3 arbitrages vault. Spec v2 `docs/superpowers/specs/2026-07-11-dossier-decision-materialite-design.md`, plan v2 `.../plans/2026-07-11-dossier-decision-materialite.md`.
4. **Refonte visuelle** (`1fadcd5`, non poussé) : `ProjectSummaryCard` + `DossierDecisionSection` réécrites dans le design system futur•e (glass, eyebrow mono à pastille, Instrument Serif, verdict à filet d'état, preuves en chips) ; **bug de visibilité des boutons de posture en mode édition corrigé**.

## Décisions prises (porteur, non encore au vault au-delà des 3 arbitrages)
- **Slice 1 = Territoire au grain commune**, Logement en extension 1.5 déclenchée par la présence d'une adresse (le profil ne stocke pas d'adresse). Même registre/contrats/assembleur/page.
- **Compromis** conservé (pas « profil contrasté ») avec texte honnête et preuve par côté.
- **Page ouverte à tous les payants dès la livraison** (pas de feature flag) ; le cas creux doit rester digne.
- Revue adversariale (ChatGPT) intégrée en v2 : modèle de couverture explicite, absence de donnée en `null`, union discriminée, états de conclusion honnêtes, règles montagne/CatNat remplacées par communeSize/exposition inondation.

## État git
- `main`, arbre propre sauf ce fichier. **`1fadcd5` à pousser** (`git push origin main`).
- Tests : `node --test src/lib/decision/*.test.ts src/lib/user-project.test.ts` → 42 verts. `npx tsc --noEmit` → 0.
- Aucune PR ouverte.

## Validé en live (compte `<compte de test local>`, Toulouse, via Playwright headless-shell-1217)
Login → hub payant → dossier affiché ; cas creux digne ; cas riche (édition « petite commune < 20 000 hab, bord de mer ») → incompatibilité établie « 504 078 habitants » avec preuve, **couverture** « Non encore examiné : la proximité de la mer » ; sélecteur de posture visible ; sauvegarde honnête ; dossier régénéré après édition ; projet restauré. Design affichage + édition re-screenshotés OK.

## Prochaine étape immédiate
1. `git push origin main` (pousser `1fadcd5`).
2. Démarrer le **slice 1.5** : dans `buildCommuneDossier`/`loadModuleFacts`, passer `hasAddress: true` + charger les faits Logement quand une adresse est disponible, et migrer les règles de `src/lib/logement-checklist.ts` dans le registre (elles deviennent des `evaluate()` retournant des `verification`/`incompatibility`). Le contrat `ModuleFacts` gagne un bloc `logement?` optionnel ; aucune règle Territoire ne change.

## À lire d'abord à la reprise
1. `/memory/MEMORY.md` puis les fiches `project_dossier_decision`, `project_persistance_projet`, `business_moat_assemblage`.
2. Spec v2 `docs/superpowers/specs/2026-07-11-dossier-decision-materialite-design.md` (le changelog v1→v2 résume les 5 blocueurs corrigés).
3. Plan v2 `docs/superpowers/plans/2026-07-11-dossier-decision-materialite.md` (structure du moteur, tâches).
4. `docs/vault/arbitrages/{dossier-decision-eliminatoire-contrainte-declaree,deterministe-selectionne-ia-formule,rapport-un-produit-semantique-par-posture}.md`.
5. `docs/handoff/AUTO-SNAPSHOT.md` (fraîcheur).

## Pièges / fils ouverts
- **`comparateur-vie.ts` fait `import "server-only"`** : tout test `node --test` qui **value-importe** ce module casse (ERR_MODULE_NOT_FOUND). Les libs decision n'en prennent que des **types** (effacés), sauf l'adaptateur `territory-facts.ts` (value-import) qui n'est donc PAS testé en isolation ; sa logique pure vit dans `module-facts-map.ts` (testé). À respecter pour le slice 1.5.
- **Chromium Playwright** : version installée `chromium-1217`, mais playwright-core 1.61 veut `chromium_headless_shell-1228` absent. Lancer avec `executablePath` pointant `~/Library/Caches/ms-playwright/chromium_headless_shell-1217/chrome-headless-shell-mac-x64/chrome-headless-shell`.
- **`isBuyer`** (`project-view.ts`) n'est utilisé par aucune règle du slice 1 (les règles gatent sur le grain, pas l'intention). Gardé comme garde-fou doctrinal + testé ; le brancher quand une règle acheteur arrive, sinon candidat au retrait.
- **Couverture partielle** : seules `nearSea` et `communeSize` sont couvertes. Un projet déclarant d'autres contraintes dures les verra listées « non examinées » (comportement voulu). Élargir la couverture (5-8 dimensions) fait partie de la maturation avant de compter sur le cas riche fréquent.
- **Cas creux fréquent** : beaucoup de projets n'ont ni contrainte dure ni préférence couverte → dossier = conclusion seule. C'est honnête mais maigre ; l'ajout de règles (préférences → compromis/vérifications) est le levier.
