# Passation — session en cours

**Horodatage** : 2026-07-13 · **Branche courante** : `feat/dossier-slice-2-conclusion-redigee`
(10 commits d'avance sur `origin/main`, **rien de poussé**, aucune PR ouverte).

## Objectif en cours

**Slice 2 du dossier de décision** (« En une minute », hub `/rapport`) : l'IA **rédige** les registres
de nuance de la conclusion, le déterministe **décide** tout le reste. Le code est **écrit, testé
(100 tests verts), buildé, et validé sur le vrai modèle** (sonde : 15/15 blocs retenus sur 5 tirages).
Il reste la **vérification à l'écran, flag allumé** : elle a été interrompue en plein milieu.

## Fait dans cette session

1. **Spec** `docs/superpowers/specs/2026-07-13-dossier-decision-slice-2-conclusion-redigee-design.md`
   et **plan** `docs/superpowers/plans/2026-07-13-dossier-decision-slice-2-conclusion-redigee.md`
   (commits `2e62b37`, `132731e`, durcis en `f2fc12f` après revue adversariale ChatGPT).
2. **Moteur** (6 commits, `76c7121` → `3efdd97`) :
   - `src/lib/stable-stringify.ts` (universel, **jette sur `undefined`**) + `src/lib/server/sha256.ts` ;
     `logement-synthesis-cache.ts` dédupliqué et rendu **total** (`?? null` explicites).
   - `src/lib/decision/conclusion-plan.ts` : `ConclusionNarrativePlan` porté par le `Dossier`
     (présence, ORDRE, `sourceIds`, `requiredPhrases`, `allowedNumbers`, `fallbackText`, `generable`),
     `selectLead` (single/tied/none), `shouldGenerateNarrative` (le gate).
   - `src/lib/decision/conclusion-validate.ts` : le vrai contrat de sortie, 9 motifs de rejet,
     récupération **bloc par bloc**.
   - `src/lib/decision/conclusion-hash.ts` : SHA-256 (plan + prompt + modèle + contrat).
   - `src/lib/decision/conclusion-prompt.ts` : le prompt, partagé composant ↔ sonde.
   - `src/lib/server/decision-narrative-store.ts` : lecture validée, upsert **convergent**, pruning.
   - `src/components/report/{ConclusionBlock,ConclusionRedigee}.tsx` + branchement
     `DossierDecisionSection` / `DossierAvecLogement` / `rapport/page.tsx`.
   - `scripts/probe-conclusion.ts` : la **sonde** (mesure le taux de survie sur le vrai modèle).
3. **Migration appliquée en base** (MCP Supabase, projet `xkewgsccadjmondzmjxj`) :
   `supabase/23_decision_narrative.sql` → table `decision_narrative` créée, RLS + 3 policies, 0 ligne.
4. **Corrections trouvées par la sonde** (`3efdd97`) : au premier passage, **1 bloc sur 3** survivait,
   tests au vert. Trois contraintes à moi ne tenaient pas (noyau du libellé sans article, copie du
   constat du lead exigée à tort, nombres en toutes lettres). Après correction : **15/15**.

## Décisions prises (porteur, hors vault)

- **Le verdict n'est JAMAIS généré** (`generable: false`). C'est la phrase qui peut renverser une
  décision perçue (« ce lieu vous correspond »). Le modèle le reçoit en lecture seule pour que les
  registres suivants s'y articulent.
- **Hiérarchie éditoriale des réserves** (ordre gravé) : `verdict` → `unexamined_hard_constraints` →
  `reserves_found` → `uncovered_priorities`. Une contrainte dure non examinée et une préférence non
  couverte ne partagent jamais un bloc.
- **Gate par complexité narrative**, jamais pour maquiller un dossier pauvre. Conséquence assumée :
  sur la couverture actuelle (2 contraintes Territoire sur 11), le gate rend souvent `false` et le
  déterministe reste affiché. **Le slice 2 améliore la voix, pas la matière.**
- **L'invariant des nombres est « aucun nombre FAUX »**, pas « aucun nombre absent du repli ».
- **Artefact durable** (`await upsert` puis relecture canonique), clé
  `(user, insee, scope_key, input_hash)`.
- **Flag serveur `DOSSIER_NARRATIVE`, OFF par défaut.**

## État git

- Branche `feat/dossier-slice-2-conclusion-redigee`, **10 commits non poussés**, aucune PR.
- Non commité : **`verif-slice2.mjs`** (script Playwright de vérif live, à la racine ; à déplacer dans
  `scripts/` ou à supprimer avant de finir).
- `npx tsc --noEmit` → 0. `node --test src/lib/decision/*.test.ts src/lib/*.test.ts` → **100 verts**.
  `npm run build` → compile (les « Retrying » sur `/inondation/[insee]` sont du SSG lent, préexistant).

## Prochaine étape immédiate

**Terminer la vérification à l'écran, flag allumé.** Le compte de test a un projet SANS contrainte
dure : le gate reste donc fermé et rien ne se génère. Il faut un dossier riche. Séquence :

1. Ajouter `DOSSIER_NARRATIVE=true` dans `.env.local`, puis **redémarrer** le serveur de dev
   (Next refuse un second serveur pour le même répertoire : `kill` l'existant d'abord).
2. Donner au compte un projet riche (contrainte dure non couverte + priorités non couvertes) :
   la colonne est **`user_profiles.user_project`** (jsonb), PAS `profiles` (cette table n'existe pas).
   **Sauvegarder la valeur d'origine avant de la remplacer, et la restaurer après.**
   Ou, plus simple et sans toucher la base : éditer le projet depuis l'UI (`ProjectSummaryCard`).
3. Ouvrir `/rapport` (compte `<compte de test local>` / `<identifiant retiré>`, Toulouse, adresse
   7 Rue du Taur déjà analysée) et vérifier : le déterministe s'affiche, puis est **remplacé d'un
   bloc** ; le verdict est **mot pour mot** celui du déterministe ; les registres restent distincts et
   dans l'ordre ; aucun nombre faux ; une ligne apparaît dans `decision_narrative` ; **recharger ne
   relance aucun appel LLM** et rend le texte identique.
4. Vérifier le gate sur un dossier pauvre (aucune génération, aucune ligne écrite).
5. Puis : mettre à jour `/memory/project_dossier_decision.md`, pousser la branche, ouvrir la PR.
   **Ne pas oublier `DOSSIER_NARRATIVE` côté Vercel** si on veut que ça vive en production.

## À lire d'abord à la reprise

1. `/memory/MEMORY.md`, puis la fiche `project_dossier_decision` (slices 1 et 1.5).
2. `docs/superpowers/specs/2026-07-13-dossier-decision-slice-2-conclusion-redigee-design.md` (§3 le
   périmètre, §5 le gate, §6 le flux, §8 l'artefact).
3. `docs/vault/arbitrages/deterministe-selectionne-ia-formule.md`.
4. `docs/handoff/AUTO-SNAPSHOT.md` (fraîcheur).

## Pièges / fils ouverts

- **La sonde est l'outil de non-régression du prompt.** `node --env-file=.env.local
  scripts/probe-conclusion.ts`. Toute retouche du prompt impose de **bumper
  `DECISION_NARRATIVE_PROMPT_VERSION`** (`conclusion-hash.ts`), sinon les artefacts déjà écrits
  continuent d'être servis comme s'ils étaient courants. Idem `DECISION_NARRATIVE_CONTRACT_VERSION`
  si `conclusion-validate` change de contrat.
- **`server-only` n'est pas résolvable par Node** (piège maison `comparateur-vie`). C'est pourquoi
  `src/lib/server/sha256.ts` ne porte PAS la directive : un test le value-importe. La garantie est
  conventionnelle (un import client échouerait de toute façon au build sur `node:crypto`).
- **`stableStringify` jette désormais sur `undefined`** et il tourne AUSSI dans le navigateur (gate en
  session de `LogementSynthesis`). `buildSynthesisPayload` a été rendu total pour ça. Toute nouvelle
  clé optionnelle dans ce payload doit être `?? null`, jamais laissée à `undefined`.
- **Aucune génération quand `logementStatus === "pending"`** : le dossier n'est pas final, ce serait un
  second appel Sonnet jeté. À préserver si on touche à `DossierDecisionSection`.
- **Le vrai levier produit reste la COUVERTURE** (5-8 dimensions Territoire) et le module **Santé**,
  qui devra entrer dans « En une minute » : le plan narratif l'absorbera sans changement
  d'architecture (un fait Santé est un `DecisionFact` de plus, donc une réserve de plus).
- Un serveur de dev tournait sur `:3000` (PID observé 16531) et un autre a été tenté sur `:3001` ;
  vérifier qu'il n'en reste pas un orphelin (`lsof -i :3000`).
