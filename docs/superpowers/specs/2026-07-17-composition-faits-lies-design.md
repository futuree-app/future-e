# Composition narrative de faits liés (dossier de décision, chantier B suite)

**Date** : 2026-07-17 · **Statut** : spec validée (porteur, brainstorm) · **Prérequis** : chantier climat
mismatch terminé et mergé (27/28, lot 4b douceur hivernale inclus).

Le moteur sait produire presque tous les signaux utiles ; le problème suivant est leur **mise en sens**.
Aujourd'hui, « hivers parmi les plus doux » (satisfied silencieux) et « exposition estivale forte »
(VerificationFact) sont deux constats exacts présentés séparément : le lecteur doit reconstruire lui-même
l'arbitrage. De même, un village déclenche deux mismatchs (`prefere_grande_ville`, `eviter_isolement`) qui sont
deux interprétations du MÊME état territorial, affichées comme deux faiblesses indépendantes.

Ce chantier ajoute une **couche de composition post-évaluation** : après `runRules`, avant les sections et la
conclusion, elle compose plusieurs évaluations liées en une carte plus intelligible, sans jamais toucher à la
vérité établie.

---

## 1. La décision fondatrice : une VUE, jamais un fait

> **`FactComposition` est un plan de présentation, hors de l'union `DecisionFact`. Les règles continuent de
> produire leurs évaluations et leurs faits séparément ; la composition référence les objets canoniques
> (factIds, ruleIds, evidence) et ne recopie jamais leur vérité sous une seconde forme indépendante.**

La séparation est la même que registre-de-règles / conclusion : l'évaluation établit, la composition présente.
`CompromiseFact` reste un fait produit par une règle quand le compromis est lui-même établi par cette règle
(ex. transport×chaleur) ; il ne devient jamais le conteneur d'une recomposition éditoriale postérieure. Les
faits sources restent dans le dossier interne pour la couverture, l'orientation, l'audit, les preuves et le
débogage.

**V1 strictement bornée à deux patrons codés en dur** : `seasonal_climate_tradeoff` et
`territory-size-multiple-consequences`. Aucune généralisation automatique par `sourceFactId` : deux faits
partageant une source technique ne se composent que si un patron du registre déclare explicitement cette
relation (source canonique + clés autorisées). Une relation se DÉCLARE, elle ne se découvre pas.

## 2. Contrats (`src/lib/decision/fact-composition.ts`, NOUVEAU, types purs)

```ts
export type FactComposition = TradeoffComposition | SharedEvidenceComposition;

export type CompositionSide = {
  label: string;                 // « Ce qui correspond » / « Ce qui appelle un arbitrage »
  statement: string;
  evidence: EvidenceRef[];
  ruleIds: string[];             // les évaluations référencées (RuleEvaluation n'a pas d'id propre)
  factIds: string[];             // [] pour un côté satisfait (aucun fait émis)
  action?: { type: VerificationActionType; label: string }; // invariant 8 : l'action survit
  limitation?: string;           // la limitation du fait absorbé reste sur SON côté
};

export type TradeoffComposition = {
  id: string;
  kind: "tradeoff";
  patternId: "seasonal_climate_tradeoff";
  title: string;
  summary: string;
  favorableSide: CompositionSide;
  unfavorableSide: CompositionSide;
  absorbedFactIds: string[];
  referencedRuleIds: string[];
  materialityTier: MaterialityTier;   // hérité du côté défavorable, jamais aggravé par le favorable
  displaySection: "compromises";
};

export type SharedEvidenceConsequence = {
  projectKey: PreferenceKey;
  statement: string;
  materialityTier: MaterialityTier;   // le tier PROPRE de chaque conséquence est conservé
  factId: string;
  limitation?: string;                // ex. eviter_isolement : « la taille seule ne conclut pas »
};

export type SharedEvidenceComposition = {
  id: string;
  kind: "shared_evidence";
  patternId: "territory-size-multiple-consequences";
  title: string;
  summary: string;
  sharedEvidence: EvidenceRef[];      // l'état commun (classification, population, provenance)
  consequences: SharedEvidenceConsequence[];
  absorbedFactIds: string[];
  referencedRuleIds: string[];
  materialityTier: MaterialityTier;   // max des tiers absorbés
  displaySection: "mismatches";
};
```

`absorbedFactIds` est distinct de la simple référence : un fait ABSORBÉ quitte sa section d'origine ; un fait
seulement référencé (contexte) reste une carte autonome. En v1, les deux patrons n'ont que des absorbés.

## 3. Constructeur (`src/lib/decision/fact-compositions.ts`, NOUVEAU, pur)

```ts
export function composeFacts(
  run: RunResult,
  facts: ModuleFacts,
  project: UserProject,
): FactComposition[];
```

Appelé là où `runRules` tourne (l'assembleur ne reçoit que le résultat et reste ignorant des patrons). Il
reçoit les `ModuleFacts` parce que le côté satisfait n'a AUCUNE preuve portable : `RuleEvaluation` d'un
satisfied vaut `{ outcome: "satisfied", facts: [], reason }`.

> **Précision gravée (porteur)** : le constructeur ne re-dérive JAMAIS la vérité du côté favorable depuis les
> `ModuleFacts`. Pour le tradeoff saisonnier, l'outcome `satisfied` vient exclusivement de l'évaluation
> existante (`territoire.mismatch-douceur_climat`). La preuve favorable est construite par un **helper
> canonique dédié** (ex. `buildWinterMildnessEvidence(facts)` dans le module du patron, appuyé sur
> `rankBands.douceur_climat`, `temp_hiver` et `WINTER_MILDNESS_CONVENTION`), sans recalculer aucun seuil ni
> aucun résultat. Si la bande manque alors que l'outcome est satisfied, on ne fabrique rien : le patron ne se
> déclenche pas (jamais une preuve inventée pour satisfaire une carte).

Les textes des cartes composées sont 100 % déterministes (titres, statements, labels de côtés).

## 4. Patron 1 : `seasonal_climate_tradeoff`

Côté défavorable réel dans le code : `faible_chaleur` est couvert par `territoire.climat-chaleur`
(`materiality-rules.ts`), qui émet un **VerificationFact** (pas un mismatch) portant une action
(« Renseignez une adresse pour évaluer le confort d'été » / « Vérifiez le confort d'été : orientation… ») et la
limitation climat commune. La composition absorbe donc une carte de la section « À examiner avant de vous
engager » et la déplace, recomposée, dans « Ce qui départage vraiment ».

**Gate** (tous les éléments narrés à poids ≥ 2) :

```ts
preferenceWeight(project, "douceur_climat") >= 2
  && douceurEval.outcome === "satisfied"          // exige déjà rankBand.low >= 0,80 (classifyPosition)
  && preferenceWeight(project, "faible_chaleur") >= 2
  && chaleurEval.facts.length > 0                  // un fait défavorable RÉELLEMENT produit
```

Le test porte sur le FAIT émis, jamais sur un outcome négatif : on ne compose que ce qui aurait été affichable
seul. Un « satisfied fort » supplémentaire serait redondant : `classifyPosition` ne rend satisfied que si tout
le groupe d'ex æquo est dans le cinquième supérieur.

**Pourquoi le poids 1 ne suffit jamais** : le poids 1 est « examiné mais silencieux ». Narrer une douceur de
poids 1 ferait de la composition une porte dérobée vers la narration principale, et surinterpréterait le
projet (une mention en passant devient la moitié d'un arbitrage structurant).

**Matérialité et action** : la carte hérite du tier du fait chaleur absorbé (secondary/structuring). La douceur
donne le sens du compromis ; elle n'aggrave jamais la réserve. L'action du VerificationFact survit sur le côté
défavorable.

**Table de comportement** :

| Douceur | Chaleur | Affichage |
|---|---|---|
| poids ≥ 2, satisfied | poids ≥ 2, fait émis | tradeoff composé |
| poids 1, satisfied | poids 3, fait émis | carte chaleur seule |
| poids ≥ 2, neutral/uncertain | poids ≥ 2, fait émis | carte chaleur seule |
| poids ≥ 2, satisfied | poids 1 (not_applicable, aucun fait) | rien ; douceur reste silencieuse |
| poids ≥ 2, mismatch douceur | poids ≥ 2, fait émis | deux cartes séparées (deux déceptions, pas une tension) |
| douceur non déclarée | fait chaleur émis | carte chaleur seule |
| satisfied mais rankBand douceur absente | fait émis | pas de composition (preuve non fabricable) |

Cas réels (sonde du 2026-07-16) : Antibes (satisfied, 41 j chauds) compose ; Gouesnou (satisfied, 3 j chauds,
aucun fait chaleur) ne compose pas.

## 5. Patron 2 : `territory-size-multiple-consequences`

Les 3 règles de taille partagent `TERRITORY_SIZE_FACT_ID` dans `sourceFactIds`. Concrètement : `village`
déclenche `prefere_grande_ville` (mismatch) ET `eviter_isolement` (mismatch) ; `petite` ne déclenche que
`prefere_grande_ville`. Le patron ne composera donc en pratique que sur les villages, quand les deux
préférences sont à poids ≥ 2. `eviter_grandes_villes` et `prefere_grande_ville` ont des outcomes opposés par
construction et ne sont jamais composables ensemble.

**Gate** : au moins **2 faits mismatch MATÉRIELS ÉMIS** (donc poids ≥ 2 chacun) partageant la source canonique
déclarée par le patron. Une seule conséquence matérielle = carte simple ; l'évaluation silencieuse de poids 1
n'est JAMAIS repêchée ni mentionnée dans le résumé (sinon : 1 fait affiché mais 2 conséquences racontées, les
comptes deviennent illisibles).

**Matérialité** : la carte hérite du tier MAX des absorbés ; chaque conséquence conserve son tier propre et le
rendu reflète la hiérarchie (conséquence structurante d'abord, point secondaire ensuite, jamais homogénéisés).
La `limitation` d'`eviter_isolement` (« la taille seule ne permet pas de conclure à l'isolement effectif »)
reste attachée à SA conséquence, jamais généralisée à la carte.

**Table de comportement** :

| Faits taille émis | Résultat |
|---|---|
| prefere structuring seul | carte simple |
| prefere structuring + isolement poids 1 silencieux | carte simple |
| prefere structuring + isolement secondary | composition structuring |
| prefere secondary + isolement secondary | composition secondary |
| 2 faits émis, sources différentes | deux cartes simples |
| 2 faits, source partagée mais hors patron | deux cartes simples |

## 6. Assembleur (`decision-assembler.ts`, modifié)

`assembleDossier` gagne une entrée `compositions: FactComposition[]`.

- **Avant les caps** : les `absorbedFactIds` sont retirés des sections ; chaque composition est insérée dans sa
  `displaySection` où elle **compte pour UNE carte** dans le cap (mismatches 3, compromises 3), triée par son
  tier hérité parmi les autres cartes. Composer peut libérer une place pour un fait qui aurait été plafonné :
  c'est souhaitable (moins de redondance, plus d'information à l'écran).
- `Dossier` gagne `compositions` (les affichées) et des comptes de présentation :
  `{ elementaryFactShown, compositionShown, absorbedFactTotal }`.
- **Couverture et orientation intouchées** : `criteria-registry` lit les évaluations, la composition n'y touche
  pas. Invariant testé : même run, avec et sans composition, mêmes `coverage`/`orientation`.
- **Écart assumé à l'implémentation** (revue plan v2, reporté ici au merge) : `DossierSection` ne porte plus
  `facts` + `compositions` séparés mais UNE liste `cards: DossierCard[]` (fait simple ou composition), triée
  par tier puis cappée ; à tier égal la composition passe d'abord. C'est la manière correcte de faire « compte
  pour une carte » : une composition secondary ne déplace jamais un fait structurant.

## 7. Plan narratif (`conclusion-plan.ts`, modifié)

- Les compositions affichées entrent comme **objets narratifs principaux** : le lead peut désigner une
  composition par son titre ; les faits absorbés ne fournissent plus de bloc, seulement des preuves (sinon le
  modèle répète le contenu).
- Les comptes du verdict passent sur les **cartes visibles** : « 1 compromis et 2 autres points d'attention »,
  jamais « 4 points d'attention » quand deux sont réunis dans une carte.
- L'`input_hash` de l'artefact narratif inclut les compositions ; bump `DECISION_NARRATIVE_PROMPT_VERSION`.
- L'IA reçoit une composition déjà décidée et ne fait que la formuler ; elle ne relie jamais deux cartes
  elle-même. Sonde `scripts/probe-conclusion.ts` étendue avec au moins un cas composé.

## 8. Rendu (`src/components/report/FactCompositionCard.tsx`, NOUVEAU)

Un composant, deux variantes par `kind`, dans l'idiome existant (glass, filet accent de la section hôte,
chips de preuve, grain). Pas de code couleur bon/mauvais tranché.

- **tradeoff** : titre, puis deux blocs nommés « Ce qui correspond » / « Ce qui appelle un arbitrage »,
  chacun avec statement, chips de preuve, action éventuelle affichée comme sur les cartes verification.
- **shared_evidence** : état observé (chips), puis conséquences hiérarchisées par tier propre, limitation sous
  sa conséquence.
- **Dépliable « Voir les constats détaillés »** : rend les cartes élémentaires absorbées dans leur forme
  d'origine (réutilise `FactBody`/`EvidenceRow`). Deux niveaux de lecture : carte composée (intelligible),
  faits élémentaires (audit).

## 9. Invariants (gravés, testés)

1. `FactComposition` n'appartient pas à `DecisionFact`.
2. Elle référence des faits et évaluations existants (factIds/ruleIds/evidence canoniques), sans recopier leur
   vérité.
3. Elle ne change ni couverture, ni outcome, ni orientation.
4. Elle déclare explicitement ses absorbés ; un fait absorbé quitte la vue principale mais reste accessible au
   dépliable.
5. Elle ne combine que des relations enregistrées dans le registre de patrons (v1 : les deux patrons, en dur).
6. Elle doit réduire une redondance visible ou révéler un arbitrage ; sinon les cartes restent séparées.
7. Une composition réorganise ce qui aurait été visible séparément ; elle ne rend JAMAIS visible ce qui était
   silencieux (poids 1, neutral, uncertain).
8. Elle n'avale ni les actions ni les limitations des faits absorbés : chacune reste portée par son côté ou sa
   conséquence, avec son tier propre.
9. Le côté favorable n'est jamais re-dérivé : outcome depuis l'évaluation, preuve par helper canonique sur les
   données/conventions existantes, aucun seuil recalculé ; preuve non fabricable = patron non déclenché.
10. Jamais un score moyen ni un verdict global (« climat favorable ») : la composition nomme la tension, elle
    ne la solde pas.

## 10. Tests et vérification

- **Constructeur (purs)** : les deux tables de comportement ci-dessus, cas par cas ; helper de preuve favorable
  (bande présente/absente).
- **Invariants** : couverture/orientation identiques avec et sans composition sur le même run ; aucun absorbé
  invisible (chaque absorbedFactId retrouvable au dépliable) ; action et limitation survivantes ; tier hérité
  correct dans les deux patrons.
- **Assembleur** : retrait des absorbés avant caps, composition = une carte dans le cap, comptes de
  présentation.
- **Plan narratif** : comptes sur les cartes visibles, lead composable, hash incluant les compositions.
- **Sonde** : `probe-conclusion.ts` avec un cas Antibes-like (douceur 3 + chaleur 3).
- **Bout en bout** : `/api` + page rapport sur une commune méditerranéenne (profil douceur 3 + chaleur 3) et
  sur un village (prefere_grande_ville + eviter_isolement à poids ≥ 2).

## 11. Hors périmètre v1

- Tout patron supplémentaire (préférences contradictoires déclarées, deux faits négatifs qui se recouvrent).
- Toute découverte automatique de relations par `sourceFactId`.
- Un second niveau de satisfaction (« satisfied fort ») dans les règles.
- La refonte des comptes au-delà de ce que la composition impose.
