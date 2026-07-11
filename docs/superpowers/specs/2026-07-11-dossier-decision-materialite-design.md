# Dossier de décision + registre de matérialité (slice 1) — v2

**Date** : 2026-07-11 · **Statut** : design v2 (révisé après revue adversariale), prêt pour relecture porteur puis plan.
**Ascendance** : `docs/rapports-agents/researcher/2026-07-11-architecture-rapport-payant.md`
(pistes 1 « dossier de décision » + 10 « seuil de matérialité »), sous
`docs/vault/arbitrages/moat-assemblage-largeur-en-tunnel.md`. Suite de la clé de voûte
`docs/superpowers/specs/2026-07-11-user-project-persistance-design.md` (le `UserProject` persisté).

## Changelog v1 → v2 (revue adversariale)

La v1 savait expliquer pourquoi une alerte remonte, pas prouver pourquoi aucune ne remonte. Corrigé :

1. **Modèle de couverture explicite.** Les règles retournent des ÉVALUATIONS (`RuleEvaluation`), plus
   seulement des faits. L'assembleur distingue « contrainte examinée et respectée » de « jamais
   examinée », et NOMME les contraintes déclarées qu'aucune règle ne sait encore évaluer.
2. **Absence de donnée jamais transformée en résultat.** `catnat ?? 0` supprimé (`number | null`).
   Aucun `try/catch` général sur `subScore` (les erreurs inattendues doivent exploser, seules les
   absences connues deviennent `null`).
3. **Règles doctrinalement prouvées.** Montagne (bande d'altitude incohérente) retirée, remplacée par
   `communeSize` (population au-delà du seuil déclaré = incompatibilité exactement démontrable). CatNat
   brut ≥ 3 retiré, remplacé par un croisement avec le score d'exposition actuel, période et limite
   nommées, « ERRIAL » corrigé (un service, pas le nom du document).
4. **`DecisionFact` en union discriminée** : le type IMPOSE la doctrine (un `unknown` a un `impact`,
   un `compromise` a deux côtés avec preuve chacun, une `verification` a une action). `sourceFactId`
   → `sourceFactIds[]`. `EvidenceRef` porte `observedValue` + `grain` (la valeur mesurée EST la preuve).
5. **États de conclusion honnêtes.** `compatible_with_reserves` → `no_incompatibility_established`.
   Ajout de `project_not_structured` (rawText sans parsed). Hiérarchie plafonnée (`materialityTier` +
   caps). Conclusion porteuse d'un `conclusionBasis` (ruleIds + factIds + preuves).
6. **Sonde non-matériel retirée** (code de démo), remplacée par des invariants génériques dans le
   moteur qui protègent toutes les futures règles.
7. **Posture réellement appliquée.** `intent === "achat"` seul déclenche la logique acquéreur
   (analyser une adresse n'est pas acheter). Les phrases sont posture-aware (habitant : comprendre et
   surveiller, jamais « avant de vous engager »).

**Décisions porteur (v2)** : le rôle reste « compromis » (texte honnête, preuve par côté) ; la page
est **ouverte à tous les payants dès la livraison** (pas de feature flag), donc le cas creux doit
rester digne et honnête.

## 1. Objectif

Poser, au-dessus des modules payants du hub `/rapport`, une page « En une minute » qui répond à une
seule question : **ce lieu-ci tient-il pour SON projet ?** Elle hiérarchise les faits Territoire
selon cinq rôles décisionnels, pour le projet déclaré, de façon **déterministe et auditable**, en
étant honnête sur ce qu'elle a examiné ET sur ce qu'elle n'a pas encore examiné. Aucun LLM dans ce
slice.

## 2. Cadrage doctrinal (arbitrages gravés au vault)

1. **« Éliminatoire » = incompatibilité avec une contrainte non négociable DÉCLARÉE**, jamais un
   jugement absolu. Le critère vient du lecteur.
2. **Le déterministe sélectionne et impose preuve/limite ; l'IA (slice 2) formule seulement.** Sortie
   déterministe = fallback permanent.
3. **Un seul produit structurel, sémantique par posture.**
4. **La couverture est déclarée, jamais supposée.** « Aucune incompatibilité » ne se dit QUE sur les
   contraintes réellement examinées. Une contrainte déclarée qu'aucune règle ne sait évaluer est
   nommée comme non couverte, jamais avalée en silence. Registre, jamais un score.

## 3. Frontière slice 1 / slice 1.5

Le profil stocke `home_insee_code`, jamais une adresse. Donc au hub : toujours la commune, rarement
une adresse.

- **Slice 1** : source = Territoire au grain commune (index par INSEE). Conclusion à périmètre
  **communal explicite**.
- **Slice 1.5** : quand une adresse est renseignée, on branche les faits Logement. Registre, contrats,
  assembleur et page identiques. `hasAddress` passe à `true`, `scope` à `"commune+adresse"`.

## 4. Architecture et flux

```
Attributs commune (INSEE, index)  +  UserProject
                    ↓
          Registre de règles          ← doctrine projet-relative
                    ↓
  { facts: DecisionFact[], evaluations: RuleEvaluation[] }   ← ÉMISSIONS + COUVERTURE
                    ↓
        Assembleur canonique          ← états honnêtes + contraintes non couvertes
                    ↓
   Page « En une minute » (gabarits)  ← entre ProjectSummaryCard et la grille
```

Libs pures neuves sous `src/lib/decision/` : `decision-fact.ts` (contrats), `project-view.ts`
(lecteurs `UserProject`), `territory-facts.ts` (adaptateur + orchestrateur), `materiality-rules.ts`
(registre + moteur), `decision-assembler.ts` (assembleur).

## 5. Contrats

### 5.1 ModuleFacts (absence honnête)

```ts
type ModuleFacts = {
  insee: string;
  nom: string;
  distanceCoteKm: number;            // toujours présent dans l'index
  population: number | null;
  altitude: number | null;
  catnatInondation: number | null;   // null = pas de bloc inondation dans l'index (jamais 0 par défaut)
  inondationRisque: number | null;   // score d'exposition 0-100 (haut = exposé), null si absent
  scores: Partial<Record<PreferenceKey, number | null>>; // subScore par clé ; null = non calculable
  hasAddress: boolean;               // slice 1 : toujours false
};
```

L'adaptateur ne met JAMAIS de valeur de repli. `subScore` n'est pas enveloppé de `try/catch` : une
erreur inattendue doit exploser (une régression n'est pas une « donnée indisponible »).

### 5.2 DecisionFact (union discriminée)

```ts
type MaterialityTier = "decision_critical" | "structuring" | "secondary";

type EvidenceRef = {
  factId: string;                                  // le fait module source
  module: DecisionModule;
  label: string;
  observedValue?: string;                          // la valeur mesurée : "42 km", "18 000 hab.", "72/100"
  grain: "commune" | "adresse" | "secteur";
  href?: string;                                   // optionnel slice 1 (module) ; ancre exacte = ultérieur
};

type BaseFact = {
  id: string;
  ruleId: string;
  sourceFactIds: string[];
  module: DecisionModule;
  statement: string;                               // gabarit déterministe, posture-aware
  materialityTier: MaterialityTier;
};

type IncompatibilityFact = BaseFact & {
  role: "incompatibility";
  evidenceStrength: "established" | "indicative";
  hardConstraintKey: HardConstraintKey;            // DOIT référencer une contrainte dure déclarée
  evidence: EvidenceRef[];                          // >= 1
  limitation?: string;
};

type CompromiseSide = { projectKey: PreferenceKey; statement: string; evidence: EvidenceRef[] };
type CompromiseFact = BaseFact & {
  role: "compromise";
  sides: [CompromiseSide, CompromiseSide];         // exactement deux, preuve de chaque côté
};

type UnknownFact = BaseFact & {
  role: "unknown";
  impact: "blocking" | "scoped";                   // requis
  evidence: EvidenceRef[];
  action?: { type: VerificationActionType; label: string };
};

type VerificationFact = BaseFact & {
  role: "verification";
  evidence: EvidenceRef[];
  action: { type: VerificationActionType; label: string };  // requise
  limitation?: string;
};

type DecisionFact = IncompatibilityFact | CompromiseFact | UnknownFact | VerificationFact;
```

### 5.3 Évaluation et règle

```ts
type HardConstraintKey =
  | "departements" | "zones" | "excludeZones" | "montagne" | "reliefProche"
  | "nearSea" | "excludeSea" | "nearPlace" | "communeSize" | "excludePlace" | "sizeRelativeTo";

type RuleOutcome =
  | "not_applicable"  // la cible n'est pas déclarée dans le projet
  | "satisfied"       // déclarée et respectée (aucun fait)
  | "incompatible"    // déclarée et contredite (émet un IncompatibilityFact)
  | "compromise"      // tension entre deux préférences déclarées (émet un CompromiseFact)
  | "verification"    // à vérifier (émet un VerificationFact)
  | "unknown"         // donnée déterminante manquante (émet un UnknownFact)
  | "uncertain";      // donnée présente mais insuffisante pour trancher (aucun fait)

type RuleEvaluation = {
  ruleId: string;
  projectKeys: string[];      // clés évaluées (HardConstraintKey ou PreferenceKey)
  outcome: RuleOutcome;
  facts: DecisionFact[];      // 0..n
  reason: string;             // trace de diagnostic
};

type DecisionRule = {
  id: string;
  module: DecisionModule;
  hardConstraint?: HardConstraintKey;  // si présent, la règle participe à la COUVERTURE de cette contrainte
  evaluate: (facts: ModuleFacts, project: UserProject) => RuleEvaluation;
};
```

`evaluate()` remplace `active()/resolve()` : une règle décrit toujours son verdict, même quand elle
ne produit aucun fait (satisfied / not_applicable / uncertain). C'est ce qui rend la couverture
observable. Généralise `src/lib/logement-checklist.ts` (dont chaque règle devient un `evaluate`).

### 5.4 Dossier (conclusion prouvée)

```ts
type ConclusionState =
  | "established_incompatibility"
  | "no_incompatibility_established"
  | "insufficient_evidence"
  | "no_hard_constraint_declared"
  | "project_not_structured";

type UncoveredConstraint = { key: HardConstraintKey; label: string };

type Dossier = {
  scope: "commune" | "commune+adresse";
  conclusionState: ConclusionState;
  conclusion: string;
  conclusionBasis: { ruleIds: string[]; factIds: string[]; evidence: EvidenceRef[] };
  sections: DossierSection[];
  uncovered: UncoveredConstraint[];   // contraintes déclarées qu'aucune règle ne sait examiner
};
```

## 6. Modèle de couverture

`declaredHardConstraintKeys(project): HardConstraintKey[]` énumère les contraintes dures présentes
dans `parsed.hardConstraints`. Le moteur collecte, parmi les règles portant un `hardConstraint`,
celles dont l'évaluation n'est pas `not_applicable` : ce sont les contraintes **couvertes**.

`uncovered = declaredHardConstraintKeys − coveredKeys`. Ces contraintes déclarées, qu'aucune règle du
slice ne sait évaluer, sont **nommées** dans le dossier (`uncovered[]`) et la conclusion s'y réfère
(« nous n'avons pas encore examiné, à ce grain : … »). Elles ne sont jamais avalées en silence.

En slice 1, seules `nearSea` (R1) et `communeSize` (R2) sont couvertes. Un projet déclarant
`departements`, `zones`, `nearPlace`, `excludePlace`, `sizeRelativeTo`, `montagne`, `reliefProche`
verra ces contraintes listées comme non couvertes. C'est le cœur de l'honnêteté du slice.

## 7. Le registre (5 règles v2)

Chaque règle est une fixture de test. Toutes lisent des champs réels de l'index.

| # | ruleId | hardConstraint | Comportement |
|---|--------|----------------|--------------|
| 1 | `territoire.mer-hors-seuil` | `nearSea` | `nearSea{maxKm}` déclaré : `distanceCoteKm > maxKm` → `incompatible` (établie, tier `decision_critical`, `observedValue` = distance). Sinon `satisfied`. Donnée absente → `unknown` scoped. |
| 2 | `territoire.taille-hors-seuil` | `communeSize` | `communeSize{min,max}` déclaré : `population` hors bornes → `incompatible` (établie, `decision_critical`, `observedValue` = population). Dans les bornes → `satisfied`. `population` null → `unknown` scoped. |
| 3 | `territoire.compromis-transport-chaleur` | — | `acces_transports` ET `faible_chaleur` déclarés (poids ≥ 2), scores présents, l'un ≥ 60 et l'autre ≤ 40 → `compromise` (tier `structuring`, `sides[2]` chacun avec `observedValue` = son score, texte honnête sans « meilleure » ni « train »). Sinon `not_applicable`. |
| 4 | `territoire.confort-ete-sans-adresse` | — | `faible_chaleur` déclaré (poids ≥ 2) ET `!hasAddress` → `unknown` **scoped** (tier `secondary`, action `renseigner_adresse`). Gate SUR LE GRAIN, pas sur l'intention d'achat. |
| 5 | `territoire.inondation-exposition` | — | `faible_risque_inondation` déclaré (poids ≥ 2) ET `inondationRisque >= 66` → `verification` (tier `structuring`, action `obtenir_document` « consultez l'état des risques via Géorisques », `observedValue` = score ; le `catnat` sert de contexte avec sa période 1982→présent et sa limite « comptage administratif, pas une probabilité »). Sinon `not_applicable`/`uncertain`. |

Texte du compromis (R3), gravé : `sides = [ { acces_transports : "L'accès aux transports ressort
favorablement à l'échelle de la commune." }, { faible_chaleur : "Votre priorité de faible exposition
à la chaleur est moins bien satisfaite ici." } ]`. Chaque côté porte son `observedValue` (le score).
Aucune comparaison à un référentiel externe (single-commune), l'arbitrage revient au lecteur.

## 8. Invariants du moteur

`runRules(facts, project): { facts, evaluations }` appelle chaque règle, collecte faits + évaluations,
calcule la couverture, puis **valide chaque fait** (`assertFactValid`). La validation JETTE (fail-fast,
dev) si :

- une `incompatibility` a un `hardConstraintKey` absent des contraintes déclarées ;
- un `compromise` a des `sides` dont un `projectKey` n'est pas une préférence déclarée, ou un côté
  sans preuve ;
- un fait a `evidence` vide ;
- un `unknown` sans `impact` ;
- une `verification` sans `action`.

Ces invariants remplacent la sonde non-matériel : ils protègent toutes les futures règles, pas un
exemple artificiel. Un fait non pertinent ne remonte pas parce qu'aucune règle ne l'émet (le
non-matériel reste dans le module Territoire) ; on ne fabrique aucune mécanique pour le « prouver ».

## 9. L'assembleur

### 9.1 États de conclusion (honnêtes)

- `project_not_structured` — `parsed === null` : on ne peut évaluer aucune contrainte. Conclusion :
  invitation à préciser le projet, aucune section fabriquée.
- `established_incompatibility` — au moins une `incompatibility` établie.
- `insufficient_evidence` — au moins un `unknown` `blocking` sur une contrainte dure déterminante.
- `no_hard_constraint_declared` — projet structuré, zéro contrainte dure déclarée.
- `no_incompatibility_established` — des contraintes dures examinées, aucune contredite. La conclusion
  se réfère AUX CONTRAINTES EXAMINÉES et nomme les non couvertes ; elle peut porter réserves,
  compromis, inconnues scopées. Ne dit jamais « compatible » (cinq prédicats qui ne déclenchent pas
  ne rendent pas compatible).

### 9.2 Hiérarchie plafonnée

`materialityTier` (posé par la règle) ordonne d'abord (`decision_critical` → `structuring` →
`secondary`), la force de preuve départage ensuite. Caps de rendu : **2** incompatibilités, **3**
compromis, **3** inconnues, **4** vérifications. Le reste demeure dans les modules. Sans plafond,
« En une minute » redevient encyclopédique.

### 9.3 conclusionBasis

La conclusion porte ses `ruleIds`, `factIds` et `evidence` : elle est auditable comme n'importe quelle
phrase de la page (résout la contradiction de la v1).

## 10. Posture

`isBuyer(project) = project.intent === "achat"` (analyser une adresse n'est pas acheter). Les phrases
sont posture-aware, produites par la règle (qui reçoit `project`) :

- `recherche` / `adresse` / intent `achat` : « avant de vous engager » ; titre section 5 « À vérifier
  avant de vous engager ».
- `habitant` : conclusion et vérifications reformulées « ce que ces données invitent à comprendre ou
  à surveiller » ; action « consultez l'état des risques applicable à votre adresse ». Jamais « avant
  de vous engager » ni « décider de rester » (le cas habitant peut seulement chercher à comprendre).
- `recherche_quartier` : réservée, retombe sur `recherche`.

## 11. La page

Composant serveur `DossierDecisionSection`, présentationnel (aucun LLM, aucun `"use client"`). Sur
`/rapport`, payant, inséré après `ProjectSummaryCard`, avant la grille des modules. **Ouverte à tous
les payants** (pas de flag). Rendu : conclusion (avec sa base auditable) → sections non vides
(plafonnées) → bloc « non encore examiné » listant `uncovered` → CTA « Affiner avec une adresse ».

Cas creux (fréquent, vu par de vrais utilisateurs) : `no_hard_constraint_declared` ou peu de faits.
La copie reste digne et honnête (elle dit ce qui a été examiné, ce qui reste à préciser, et propose
l'adresse), jamais un « aucune contrainte » sec et arbitraire. `project_not_structured` invite à
décrire le projet plutôt que d'afficher une conclusion fabriquée.

## 12. Tests de doctrine (fixtures)

À entrées identiques : mêmes faits, mêmes évaluations, même couverture, même ordre, même état de
conclusion, aucune phrase sans `ruleId` ni preuve, `assertFactValid` ne jette pas. Cas obligatoires :
incompatibilité établie (mer, taille) ; `satisfied` qui alimente la couverture ; contrainte déclarée
non couverte listée dans `uncovered` ; compromis à deux côtés prouvés ; inconnue scopée qui NE
bascule PAS en `insufficient_evidence` ; inconnue bloquante qui le fait ; `no_hard_constraint_declared`
vs `project_not_structured` vs `no_incompatibility_established` distincts ; caps de section respectés ;
`isBuyer` faux pour posture `adresse` sans intent achat ; phrases habitant sans « vous engager ».

## 13. Hors périmètre

IA de formulation (slice 2, fallback déterministe permanent) ; faits Logement (slice 1.5) ; annexe
visible du non-matériel (jamais) ; comparaison multi-options (reste le Pack) ; deep-links vers l'ancre
exacte d'un fait module (chantier Territoire ultérieur, `observedValue` porte la preuve d'ici là).

## 14. Fichiers

Neufs : `src/lib/decision/{decision-fact,project-view,territory-facts,materiality-rules,decision-assembler}.ts`
+ tests. `src/components/report/DossierDecisionSection.tsx`.
Touchés : `src/lib/comparateur-vie.ts` (export `subScore`), `src/app/(account)/rapport/page.tsx`.
Vault : trois arbitrages (§2), le 4e (couverture déclarée) inclus dans l'arbitrage éliminatoire.

## 15. Critère de réussite

Sur trois `UserProject` réels contrastés et trois communes réelles : dossiers visiblement différents ;
aucun fait dans le mauvais rôle ; conclusion à périmètre communal explicite ; contraintes non couvertes
nommées ; sections plafonnées ; chaque phrase traçable à un `ruleId` et une preuve avec `observedValue` ;
`assertFactValid` vert ; le cas creux reste digne. On prouve d'abord que futur•e pense juste ET qu'elle
sait dire ce qu'elle n'a pas examiné, on lui apprend à mieux le dire au slice 2.
