# Dossier de décision + registre de matérialité (slice 1)

**Date** : 2026-07-11 · **Statut** : design validé (brainstorm porteur), prêt pour plan.
**Ascendance** : `docs/rapports-agents/researcher/2026-07-11-architecture-rapport-payant.md`
(pistes 1 « dossier de décision » + 10 « seuil de matérialité »), sous l'arbitrage
`docs/vault/arbitrages/moat-assemblage-largeur-en-tunnel.md` (« le payant vend la décision, jamais
la donnée vue gratuitement »). Suite de la clé de voûte
`docs/superpowers/specs/2026-07-11-user-project-persistance-design.md` (le `UserProject` persisté).

---

## 1. Objectif

Poser, au-dessus des modules de la vue payante, une page **« En une minute »** qui répond à une
seule question pour le lecteur qui vient de payer : **ce lieu-ci tient-il pour SON projet ?**
La page hiérarchise, pour ce projet déclaré, les faits déjà produits par l'usine (modules) selon
cinq rôles décisionnels canoniques. La valeur payante devient visible dans la STRUCTURE : un
sommaire qui ne peut exister que pour ce lecteur.

La vraie nouveauté n'est pas l'écran. C'est la capacité à dire, de façon déterministe et auditable :
« parmi tous les faits produits par les modules, lesquels remontent pour ce projet précis, dans
quel rôle décisionnel, et avec quel degré de preuve ? » Cette logique vit hors du composant, dans
un **registre de règles de matérialité**.

## 2. Cadrage doctrinal (trois arbitrages, gravés au vault dans cette session)

1. **« Éliminatoire » = incompatibilité avec une contrainte non négociable DÉCLARÉE**, jamais un
   jugement absolu du territoire. Le critère vient du lecteur (il a posé la contrainte), futur•e
   ne fait que constater la contradiction. Résout la tension avec l'invariant n°1 (« on ne décide
   jamais à la place ») et avec « on ne juge jamais un territoire dans l'absolu ».
2. **Le déterministe sélectionne, impose preuve et limite ; l'IA (slice 2) formule seulement.**
   La sortie déterministe reste le fallback permanent. L'IA ne pourra jamais changer un rôle,
   inventer une incompatibilité, masquer une inconnue, modifier un niveau de preuve, introduire
   une priorité absente du projet, ni supprimer un lien de preuve.
3. **Un seul produit structurel, sémantique par posture.** La structure canonique en cinq sections
   est commune à toutes les postures (`recherche`, `adresse`, `habitant`, `recherche_quartier`) ;
   seuls les titres et le verbe d'engagement changent.

Registre, pas score. On ne calcule JAMAIS `importance × gravité × confiance` : un score, même non
affiché, décide mécaniquement et devient infalsifiable sur les cas limites. Chaque remontée est le
produit d'une règle explicable, testable une à une.

## 3. Frontière slice 1 / slice 1.5 (la décision structurante)

Le profil stocke `home_insee_code` / `active_insee_code`, **jamais une adresse**. Le rapport
Logement se calcule à la volée quand l'utilisateur tape une adresse sur `/rapport/logement` ; il
n'est pas persisté. Donc au niveau du hub `/rapport`, on a **toujours la commune, rarement une
adresse**.

- **Slice 1** : source de faits = **Territoire au grain commune** (attributs de l'index par INSEE,
  la donnée que le comparateur score déjà). Disponible, déterministe et homogène pour 100 % des
  hubs. La conclusion porte **explicitement sur la commune** (§7.4).
- **Slice 1.5** : quand une adresse est renseignée, on **branche un second fournisseur de faits**
  (les faits Logement, dont `src/lib/logement-checklist.ts` est déjà le gabarit). Le registre, les
  `DecisionFact`, l'assembleur et la page sont **identiques**. L'adresse ne crée ni page ni dossier
  nouveau : elle **augmente la résolution du dossier existant**.

Ce n'est pas une réduction opportuniste. Le slice 1 valide réellement la chaîne d'assemblage ; le
slice 1.5 ne la réécrit pas, il ajoute un producteur de faits.

## 4. Architecture et flux

```
Attributs commune (INSEE, index)  +  UserProject
                    ↓
          Registre de règles          ← la doctrine projet-relative vit ICI
                    ↓
     DecisionFact[] résolus (bêtes)    ← rôle / preuve / limite déjà tranchés
                    ↓
        Assembleur canonique           ← 5 états de conclusion + tri des sections
                    ↓
   Page « En une minute » (gabarits)   ← entre ProjectSummaryCard et la grille modules
```

Trois libs pures neuves, chacune testable en isolation, aucune dépendance réseau :

- `src/lib/decision/decision-fact.ts` : les contrats `DecisionFact`, `DecisionRule`, `ModuleFacts`.
- `src/lib/decision/materiality-rules.ts` : le registre (les six règles d'amorçage) + le moteur
  `runRules(moduleFacts, project) → { facts: DecisionFact[]; diagnostics: DiagnosticEntry[] }`.
- `src/lib/decision/decision-assembler.ts` : `assembleDossier(facts, project, scope) → Dossier`
  (les cinq sections + l'état de conclusion).

Un adaptateur `src/lib/decision/territory-facts.ts` charge les attributs de la commune active par
INSEE (via l'accès index existant, cf. `commune-data.ts` / `comparateur-vie.ts`) et les projette
dans `ModuleFacts`. C'est le seul point qui touche la donnée ; les règles ne connaissent que
`ModuleFacts`.

## 5. Les contrats

`DecisionRule` porte la doctrine (constante, projet-relative, auditable en un seul endroit). C'est
la généralisation directe de `logement-checklist.ts` : `active()` = éligibilité, `resolve()` émet
désormais **cinq rôles** au lieu de la seule vérification.

```ts
type DecisionModule = "territoire" | "logement";
type DecisionRole =
  | "incompatibility"      // contredit une contrainte non négociable déclarée
  | "compromise"           // tension explicite entre deux dimensions du projet
  | "unknown"              // une donnée déterminante manque
  | "verification"         // à vérifier / surveiller avant de s'engager
  | "supporting_context";  // RÉSERVÉ : aucune règle du slice 1 ne l'émet, aucune section
                           // ne l'accueille encore. Présent pour ne pas rouvrir le type
                           // plus tard. Un fait qui « éclaire sans peser » reste, en slice 1,
                           // dans le module Territoire (cf. §6 règle 6), pas dans le dossier.

type EvidenceStrength = "established" | "indicative" | "incomplete";

type DecisionFact = {
  id: string;
  ruleId: string;              // toute phrase de la page porte un ruleId (test de doctrine)
  sourceFactId: string;        // le fait module d'origine (lien de preuve)
  module: DecisionModule;
  role: DecisionRole;
  statement: string;           // le constat, déjà résolu (gabarit déterministe)
  evidence: EvidenceRef[];     // au moins un lien vers le module / la donnée source
  limitation?: string;         // la limite de lecture, quand elle existe
  evidenceStrength: EvidenceStrength;
  action?: { type: VerificationActionType; label: string };
  relatedProjectKeys: string[];// PreferenceKey ou clés de hardConstraints déclarées
  // Rôle "unknown" seulement : une donnée manquante BLOQUE la conclusion, ou LIMITE
  // seulement une dimension / un grain. La doctrine reste dans la règle ; ceci est
  // la propriété RÉSOLUE que l'assembleur lit.
  impact?: "blocking" | "scoped";
};

type DecisionRule = {
  id: string;
  module: DecisionModule;
  sourceFacts: string[];                 // documente la donnée lue (audit)
  appliesToPostures: ProjectPosture[];   // filtre par posture
  active: (facts: ModuleFacts, project: UserProject) => boolean;
  resolve: (facts: ModuleFacts, project: UserProject) => DecisionFact | DecisionFact[];
};
```

`ModuleFacts` est un sac de faits normalisés, volontairement plat et pauvre : les règles lisent des
champs, jamais des objets métier. En slice 1 il ne contient que le grain commune (climat, littoral,
altitude, taille, historique CatNat, scores de préférence). En slice 1.5 il gagne un bloc
`logement?` optionnel. Aucune règle Territoire ne change quand `logement` apparaît.

Le `DecisionFact` reste **bête** : il contient le résultat de la doctrine, jamais la doctrine.

## 6. Le registre : six règles d'amorçage (toutes sur des champs réels de l'index)

Elles couvrent la matrice des cas, sur de la donnée déjà présente. Chacune est une fixture de test.

| # | ruleId | Rôle / force | Déclencheur (champ réel) | Émet |
|---|--------|--------------|--------------------------|------|
| 1 | `territoire.mer-hors-seuil` | incompatibility / `established` | `hardConstraints.nearSea{active,maxKm}` × `distance_cote_km > maxKm` | « Cette commune est à {d} km du littoral, au-delà de la limite de {maxKm} km que vous avez posée. » |
| 2 | `territoire.altitude-limite` | incompatibility / `indicative` | `hardConstraints.montagne:{strength:'hard'}` (altitude ≥ ~600 m) × altitude commune en bande grise (450–600 m) | « L'altitude ici approche votre seuil sans l'atteindre, à confirmer sur le terrain. » |
| 3 | `territoire.compromis-transport-chaleur` | compromise | deux `preferences` déclarées (poids ≥ 2) en tension réelle : une bien satisfaite, une mal satisfaite, preuve des deux côtés (ex. `acces_transports` fort × `faible_chaleur` faible) | « Meilleure accessibilité quotidienne, mais exposition estivale plus marquée. » |
| 4 | `territoire.logement-sans-adresse` | unknown / `impact:'scoped'` | posture `achat`/`adresse` + priorité qui dépend du grain Logement (ex. `faible_chaleur` = confort d'été bâti, DPE) + aucune adresse au dossier | « Votre priorité de confort d'été ne peut pas être évaluée au grain du bâtiment sans adresse. » |
| 5 | `territoire.risque-a-verifier` | verification | `faible_risque_inondation` déclaré × historique CatNat notable de la commune | « Demandez l'état des risques avant de vous engager : la commune a connu des sinistres indemnisés. » |
| 6 | `territoire.non-materiel` (fixture) | **n'émet AUCUN DecisionFact** | un attribut qui score notablement sur une dimension NON déclarée | rien de visible ; une `DiagnosticEntry` interne (§10) |

**Discipline compromis (règle 3)**, gravée : aucun compromis n'est émis sans nommer la dimension
préservée, la dimension fragilisée, leur relation aux priorités déclarées, et une preuve de CHAQUE
côté. Sinon le fait redevient réserve (`verification`) ou contexte. La section compromis peut rester
honnêtement vide : on ne la remplit jamais parce que l'interface prévoit trois lignes.

**Fait non matériel (règle 6)** : la règle ne produit AUCUN `DecisionFact` utilisateur. Pas
d'annexe visible « vérifié, sans enjeu pour votre projet » (elle recréerait l'encyclopédie sous une
autre forme et alourdirait chaque règle). Le fait reste naturellement visible dans le module
Territoire existant, son espace légitime. La page décisionnelle n'a pas à expliquer tout ce qu'elle
a choisi de ne pas sélectionner. Le moteur conserve seulement un **journal de diagnostic interne**
(non rendu) pour prouver, par test, que le fait a bien été vu et écarté.

## 7. L'assembleur

### 7.1 Les cinq sections canoniques

1. `conclusion` — la conclusion conditionnelle (§7.3), à périmètre de preuve annoncé (§7.4).
2. `incompatibilities` — contraintes non négociables contredites (rôle `incompatibility`).
3. `compromises` — compromis structurants (rôle `compromise`).
4. `unknowns` — inconnues (rôle `unknown`), distinguées `blocking` / `scoped` (§7.2).
5. `verifications` — à vérifier avant de s'engager (rôle `verification`).

Chaque élément renvoie au module ou à la preuve d'origine. Bornes par section (max 3 en slice 1,
tri par force de preuve puis par poids de la priorité déclarée). Toute section peut rester vide.

### 7.2 Inconnues bloquantes vs scopées

Une adresse manquante **ne fait pas** basculer la conclusion globale en « preuves insuffisantes ».

- `impact: 'scoped'` : la donnée manquante limite une dimension ou un grain. La conclusion reste
  possible, assortie d'une réserve (« sous réserve d'une analyse du logement »).
- `impact: 'blocking'` : la donnée manquante empêche de statuer sur **une contrainte dure
  déterminante à l'échelle de la décision examinée**. Seul ce cas déclenche l'état global
  `insufficient_evidence`.

La règle 4 (absence d'adresse) émet `impact: 'scoped'` : elle ne bloque jamais seule la conclusion.

### 7.3 Les cinq états de conclusion

- `established_incompatibility` — au moins un fait `incompatibility` / `established`.
- `compatible_with_reserves` — pas d'incompatibilité établie, mais des réserves (incompatibilités
  `indicative`, inconnues `scoped`, ou vérifications) à examiner.
- `no_incompatibility_with_compromise` — aucune incompatibilité, la décision se joue sur un
  compromis nommé.
- `no_hard_constraint_declared` — le projet ne déclare **aucune** contrainte non négociable. État
  DISTINCT du précédent : « vous n'avez déclaré aucune contrainte non négociable ; les données ne
  permettent donc pas d'identifier de point éliminatoire ; elles font toutefois ressortir… ».
- `insufficient_evidence` — au moins une inconnue `blocking` sur une contrainte dure déterminante.

Les deux vides restent séparés : projet sans contrainte dure (`no_hard_constraint_declared`) n'est
jamais confondu avec données muettes (`insufficient_evidence`).

### 7.4 Périmètre de preuve : la conclusion du slice 1 est explicitement communale

Tant qu'aucune adresse n'est connue, futur•e n'écrit jamais « ce lieu convient à votre projet »
(« ce lieu » pourrait être compris comme le logement). La conclusion annonce son grain :

> « À l'échelle de la commune, les données examinées indiquent que… »
> « Cette commune paraît compatible avec votre projet sur les dimensions examinables à ce grain. »

L'assembleur porte un `scope: 'commune' | 'commune+adresse'`. En slice 1.5, quand l'adresse est là,
il distingue : conclusion à l'échelle de la commune / réserves propres à l'adresse et au bâtiment /
divergences éventuelles entre profil communal et bien.

## 8. Posture

Une seule structure ; titres et verbe d'engagement adaptés. Table `POSTURE_LABELS` par
`ProjectPosture` :

- `recherche` / `adresse` / intent `achat` : section 5 « À vérifier avant de vous engager » ; verbe
  « s'engager ».
- `habitant` : conclusion reformulée « ce qu'il faut comprendre et surveiller » ; section 5 « ce
  qu'il reste utile de vérifier ou de surveiller » ; verbe « décider de rester / d'adapter ».
- `recherche_quartier` : réservée (payload non conçu, cf. clé de voûte) ; retombe sur les libellés
  `recherche` via `rawText`.

Le moteur est le même ; seuls les libellés changent.

## 9. La page

Composant serveur `DossierDecisionSection` (aucun JS client, aucun LLM). Sur `/rapport`
(`src/app/(account)/rapport/page.tsx`), **payant uniquement** (`fullReport`), inséré **après**
`ProjectSummaryCard` (ligne ~216) et **avant** la grille des six modules. Ordre du hub : Hero →
HorizonBar → carte Projet → **Dossier de décision** → grille modules. Le rapport existant reste
intégralement fonctionnel dessous.

Rendu : la conclusion en tête, puis les quatre sections non vides, chaque fait en une ligne
`constat + lien-preuve + limite éventuelle + action éventuelle`. Gabarits déterministes (pas de
prose libre) : le `statement` vient du `resolve()` de la règle.

CTA en pied de dossier, décisionnel (pas un « complétez votre rapport » générique) :

> **Affiner avec une adresse** — Vérifiez le bâtiment, les risques localisés, les contraintes
> réglementaires et l'environnement immédiat.

Il pointe vers `/rapport/logement`. C'est l'amorce visible du slice 1.5.

## 10. Tests de doctrine (fixtures)

Le slice est fortement testable par fixtures (`node --test`, comme `logement-checklist.test.ts`).
À entrées identiques (mêmes `ModuleFacts` + même `UserProject`) :

- mêmes `DecisionFact` émis, même rôle, même ordre ;
- même état de conclusion ;
- aucune variation de formulation (déterministe) ;
- **aucune phrase sans `ruleId` ni preuve correspondante** (invariant de test) ;
- règle 6 : `facts` ne contient rien, `diagnostics` contient l'entrée du fait vu-et-écarté ;
- règle 4 : l'inconnue est `scoped`, la conclusion n'est PAS `insufficient_evidence` ;
- les deux vides (`no_hard_constraint_declared` vs `insufficient_evidence`) sont testés séparément.

`DiagnosticEntry = { ruleId: string; sourceFactId: string; decision: "emitted" | "skipped"; reason: string }`.
Non rendu ; sérialisable pour les tests et un futur dashboard.

## 11. Hors périmètre (explicitement)

- **L'IA de formulation** (slice 2) : reçoit les sections déjà résolues, peut seulement fusionner,
  reformuler, fluidifier, adapter à la posture. Ne peut ni changer un rôle, ni inventer une
  incompatibilité, ni masquer une inconnue, ni modifier une preuve. Le déterministe reste le
  fallback permanent (jamais du travail jeté). Plomberie streaming / cache / artefact calquée sur
  la synthèse Logement, au slice 2.
- **Les faits Logement** (slice 1.5) : DPE, risques du bâti au point, patrimoine, autour immédiat.
  Le gabarit de leurs règles existe déjà (`logement-checklist.ts`) et migrera dans le registre.
- **Une annexe visible du non-matériel** : jamais (§6, règle 6).
- **La comparaison multi-options** (« lequel des trois ») : reste le Pack Décision, surface
  distincte. Le dossier porte toujours sur UN territoire actif × le projet.

## 12. Fichiers

Neufs :
- `src/lib/decision/decision-fact.ts` (contrats + types)
- `src/lib/decision/materiality-rules.ts` (registre + `runRules`)
- `src/lib/decision/decision-assembler.ts` (`assembleDossier`)
- `src/lib/decision/territory-facts.ts` (adaptateur INSEE → `ModuleFacts`)
- `src/lib/decision/materiality-rules.test.ts` (les six fixtures)
- `src/lib/decision/decision-assembler.test.ts` (états de conclusion, vides, blocking/scoped)
- `src/components/report/DossierDecisionSection.tsx` (rendu déterministe)

Touchés :
- `src/app/(account)/rapport/page.tsx` (insertion payant, après `ProjectSummaryCard`)

Vault (arbitrages, cette session) :
- `docs/vault/arbitrages/dossier-decision-eliminatoire-contrainte-declaree.md` (arbitrage n°1)
- `docs/vault/arbitrages/deterministe-selectionne-ia-formule.md` (arbitrage n°2)
- `docs/vault/arbitrages/rapport-un-produit-semantique-par-posture.md` (arbitrage n°3)

## 13. Critère de réussite du slice 1

Sur trois `UserProject` réels contrastés (un `recherche` sans contrainte dure, un `achat` avec
`nearSea`, un `habitant`) et trois communes réelles, le dossier généré :

1. produit des sorties visiblement différentes d'un projet à l'autre (preuve de personnalisation) ;
2. ne place jamais un fait dans le mauvais rôle ;
3. annonce toujours son périmètre de preuve communal ;
4. laisse honnêtement vides les sections sans matière ;
5. chaque phrase est traçable à un `ruleId` et à une preuve.

Le manque d'élégance temporaire (pas de prose IA) est ici un outil de contrôle : on prouve d'abord
que futur•e pense juste, on lui apprend à mieux le dire au slice 2.
