# Passation — reprise sur la COUVERTURE du dossier de décision

**Horodatage** : 2026-07-14 · **Branche** : `main` (propre, à jour, rien en attente)
**Dernier commit** : `1d986f4` (merge PR #19) · **Aucune PR ouverte.**

---

## Objectif en cours

Le dossier de décision (« En une minute », hub `/rapport`) sait désormais **décider honnêtement** et
**bien dire** ce qu'il décide. Il ne sait pas encore **regarder grand-chose** : le moteur n'examine que
3 contraintes dures sur 11, et sur un projet réel la moitié des priorités déclarées ne sont examinées
par **aucune règle**.

**Le chantier à ouvrir est donc la COUVERTURE : ajouter des règles.** C'est ce qui rend le verdict
tiède aujourd'hui, et aucune amélioration de la prose ne le corrigera.

---

## Fait dans la session précédente (livré et mergé sur `main`)

**Slices 2 + 2.1 du dossier de décision**, PR #19 mergée (`1d986f4`). Spec et plan :
`docs/superpowers/specs/2026-07-13-dossier-decision-slice-2-1-verdict-correspondance-design.md`
`docs/superpowers/plans/2026-07-13-dossier-decision-slice-2-1-verdict-correspondance.md`

- **Slice 2** : la conclusion est rédigée par un LLM sous contrat strict. Le déterministe DÉCIDE
  (`conclusion-plan.ts` : présence, ordre gravé, sources, matière obligatoire, texte de repli), l'IA
  ARTICULE, et `conclusion-validate.ts` VÉRIFIE (9 motifs de rejet, récupération bloc par bloc, repli
  permanent). **Le verdict n'est jamais généré.** Artefact persisté (`decision_narrative`).
- **Slice 2.1** : le déterministe gagne le droit de dire qu'un lieu **correspond**, à condition de le
  prouver. `criteria-registry.ts` mesure **couverture × orientation** sur les critères DÉCLARÉS.
- **Production** : flag `DOSSIER_NARRATIVE=true` posé sur Vercel (Production) et **redéployé**. La
  conclusion rédigée est donc **ACTIVE en prod**.

---

## Décisions prises (porteur), pas encore dans le vault

1. **Le verdict répond à la correspondance, plus à l'absence de contradiction.** « Aucune contrainte
   n'est contredite » décrivait l'absence d'un problème ; le lecteur demande si le lieu lui convient.
   Le déterministe le dit, **adossé à deux mesures** (couverture × orientation), jamais à une intuition.
2. **Ce n'est PAS un solde** : rien ne compense. Un critère satisfait ne rachète jamais une réserve
   critique. **Couperet** : tant qu'une contrainte dure n'a pas été testée, la couverture ne peut pas
   être dite « élevée », quel que soit le ratio.
3. **Aucune phrase ne promet un positif qui n'existe pas** (`hasFavorable`, `favorableCount ≥ 2` pour
   « plusieurs dimensions », cas « rien d'examiné »).
4. **La conclusion NOMME, les cartes DÉMONTRENT.** D'où `DecisionFact.topic`. Et on nomme **tout** :
   la commune (« Toulouse », pas « ce lieu »), les contraintes telles que le lecteur les a posées
   (« la gare Matabiau », pas « un lieu »).
5. **Le `lead` (single/tied) est de la TUYAUTERIE.** Ne JAMAIS écrire « aucun ne prend le dessus » /
   « des poids comparables » : le lecteur demande quoi regarder, pas comment le moteur trie. On LISTE.

---

## PROCHAINE ÉTAPE IMMÉDIATE : élargir la couverture

**Le geste à faire** : ajouter des règles au registre (`src/lib/decision/materiality-rules.ts`), en
priorité sur les critères que les lecteurs déclarent le plus et que personne n'examine.

### Ce qui manque, mesuré sur un projet réel (Toulouse, 7 rue du Taur)

Projet de test enregistré sur le compte de test : *« rester impérativement en Haute-Garonne, à moins de
30 minutes de la gare Matabiau, étés supportables, faible risque d'inondation, cadre calme, collèges et
lycées, vie locale, espaces naturels. »*

| Critère déclaré | Examiné ? |
|---|---|
| `departements` (Haute-Garonne) | ✅ règle `territoire.departement-hors-liste` |
| `nearPlace` (gare Matabiau) | ❌ **aucune règle** (il faudrait géocoder le label + les coords commune) |
| `faible_risque_inondation` | ✅ règle `territoire.inondation-exposition` |
| `faible_chaleur` (étés plus frais) | ❌ **plus examinée dès qu'une adresse est renseignée** (piège ci-dessous) |
| `cadre_calme` | ❌ aucune règle (le score `calme_sonore` existe pourtant) |
| `acces_ecoles` | ❌ aucune règle (score BPE existant) |
| `vie_locale` | ❌ aucune règle (score existant) |
| `nature` | ❌ aucune règle (score existant) |

**Le gisement est là** : l'index du comparateur porte déjà ~28 scores de préférence (cf.
`PREFERENCE_LABELS` dans `src/lib/comparateur-labels.ts`), et `ModuleFacts.scores` les expose **déjà**
aux règles. Beaucoup de critères peuvent être couverts par une règle de quelques lignes, **sans
nouvelle source de données**. Commencer par là avant de chercher de la donnée neuve.

Contraintes dures couvertes : 3 sur 11 (`nearSea`, `communeSize`, `departements`). Non couvertes :
`zones`, `excludeZones`, `montagne`, `reliefProche`, `excludeSea`, `nearPlace`, `excludePlace`,
`sizeRelativeTo`.

### Comment ajouter une règle (le contrat, à respecter à la lettre)

Dans `src/lib/decision/materiality-rules.ts`, ajouter un `DecisionRule` et l'inscrire dans `REGISTRY`.

```ts
const RULE_X = "territoire.mon-critere";
const ruleX: DecisionRule = {
  id: RULE_X,
  module: "territoire",
  hardConstraint: "maCleDure",           // SEULEMENT si la règle examine une contrainte dure
  evaluate: (f, p): RuleEvaluation => {
    // f = ModuleFacts (insee, nom, scores, population, logement?…) ; p = UserProject
    if (/* le critère n'est pas déclaré */) {
      return { ruleId: RULE_X, projectKeys: ["ma_cle"], outcome: "not_applicable", facts: [], reason: "non déclaré" };
    }
    if (/* la donnée manque */) {
      return { ruleId: RULE_X, projectKeys: ["ma_cle"], outcome: "uncertain", facts: [], reason: "donnée absente" };
    }
    if (/* tout va bien */) {
      return { ruleId: RULE_X, projectKeys: ["ma_cle"], outcome: "satisfied", facts: [], reason: "rien à redire" };
    }
    const fact: VerificationFact = { /* … */ topic: "…", statement: "…", /* … */ };
    return { ruleId: RULE_X, projectKeys: ["ma_cle"], outcome: "verification", facts: [fact], reason: "…" };
  },
};
```

**Les quatre invariants qui mordent, et qui sont testés :**

1. **`not_applicable` = HORS SUJET** (le critère n'est pas déclaré, la règle ne s'applique pas).
   **`satisfied` = déclaré, examiné, rien à redire** : silencieux (aucun fait), mais c'est un point
   **favorable** et il **fait monter la couverture**. Ne JAMAIS rendre `not_applicable` pour dire « tout
   va bien » : c'était le bug corrigé en 2.1 (une exposition inondation faible était comptée comme un
   trou de couverture, et aucun point favorable n'existait jamais).
2. **`projectKeys` liste les critères que la règle ÉVALUE**, jamais ceux auxquels elle est vaguement
   « reliée ». Le registre marque ces critères EXAMINÉS : y lister un critère qu'on ne regarde pas
   gonfle la couverture d'un mensonge.
3. **Tout fait porte un `topic`** : son SUJET, 3-6 mots, distinct du constat, **sans le grain**
   (« le retrait-gonflement des argiles », pas « … sous cette adresse » : deux faits d'adresse cités
   côte à côte répétaient le grain). `assertFactValid` **jette** si le topic manque, dépasse 70
   caractères ou contient une ponctuation de phrase. Le topic peut porter le nom de la commune quand
   c'est ELLE qu'il décrit (`` topic: `l'exposition de ${f.nom} à l'inondation` ``).
4. **Une règle Logement ne peut jamais émettre `incompatibility`** (arbitrage slice 1.5, garde runtime).

**Après toute règle ajoutée** :
```bash
node --test src/lib/decision/*.test.ts src/lib/*.test.ts   # 262 verts aujourd'hui
npx tsc --noEmit                                            # doit rendre 0
```

---

## État git

- Branche `main`, **propre**, à jour avec `origin/main`. Rien de non commité, rien de non poussé.
- **Aucune PR ouverte.** PR #19 mergée (`1d986f4`).
- L'historique a été réécrit une fois (purge d'un mot de passe qui traînait dans le dépôt).
  **N'écrire aucun identifiant dans le dépôt**, jamais, y compris dans un handoff ou un script de
  vérification (mettre les scripts jetables hors du dépôt, identifiants par variables d'environnement).

---

## À lire d'abord à la reprise

1. `/memory/MEMORY.md`, puis la fiche `project_dossier_decision` (elle porte toute la doctrine des
   slices 1 → 2.1).
2. `docs/superpowers/specs/2026-07-13-dossier-decision-slice-2-1-verdict-correspondance-design.md` :
   **§3.1** (le contrat `not_applicable` / `satisfied`, indispensable AVANT d'écrire une règle),
   **§4** (couverture × orientation), **§5** (la table de vérité du verdict).
3. `docs/vault/arbitrages/deterministe-selectionne-ia-formule.md` et
   `docs/vault/arbitrages/dossier-decision-eliminatoire-contrainte-declaree.md`.
4. `docs/handoff/AUTO-SNAPSHOT.md` (fraîcheur).

Code à lire dans cet ordre : `decision-fact.ts` (les contrats) → `materiality-rules.ts` (les 6 règles
existantes, à imiter) → `criteria-registry.ts` (ce que la couverture mesure) → `conclusion-plan.ts`
(comment un fait devient une phrase).

---

## Pièges / fils ouverts

- **`faible_chaleur` cesse d'être examinée dès qu'une adresse est renseignée.** La règle
  `territoire.confort-ete-sans-adresse` se désactive sur `hasAddress`, et la règle de compromis exige
  que `acces_transports` soit AUSSI déclaré. Résultat : un lecteur qui déclare « des étés supportables »
  et donne son adresse voit sa priorité listée comme **non couverte**, à l'écran. C'est honnête, et
  **c'est le premier trou à boucher**.
- **La sonde est l'outil de non-régression du prompt** : `node --env-file=.env.local
  scripts/probe-conclusion.ts` (5 tirages sur le vrai modèle, attendu 15/15). Elle a rattrapé **5
  contraintes qui ne tenaient pas** alors que tous les tests unitaires étaient verts. **Toute retouche
  du prompt impose de bumper `DECISION_NARRATIVE_PROMPT_VERSION`** (`conclusion-hash.ts`, actuellement
  `v6`), et `DECISION_NARRATIVE_CONTRACT_VERSION` (`c2`) si `conclusion-validate` change de contrat.
  Sans bump, les artefacts déjà écrits continuent d'être servis comme s'ils étaient courants.
- **Ajouter des règles CHANGE le verdict**, mécaniquement : la couverture monte, l'orientation bouge, et
  des cases jusqu'ici inatteignables (« Toulouse semble bien correspondre à votre projet ») vont
  commencer à s'afficher. **Vérifier à l'écran, pas seulement en tests** : les trois derniers défauts de
  la slice 2.1 (conclusion qui parlait d'elle-même, puis qui recopiait les cartes, puis qui disait « ce
  lieu » à quelqu'un qui regarde Toulouse) étaient **invisibles en lisant le code**.
- **`server-only` n'est pas résolvable par `node --test`** : `comparateur-vie.ts` le porte, donc un test
  qui le VALUE-importe casse (les imports type-only passent). C'est pourquoi le mapping pur vit dans
  `module-facts-map.ts`.
- **Aucune génération quand `logementStatus === "pending"`** : le dossier n'est pas final, ce serait un
  appel Sonnet jeté. À préserver dans `DossierDecisionSection`.
- **La conclusion rédigée est ACTIVE en production** (`DOSSIER_NARRATIVE=true` sur Vercel). Chaque
  dossier riche d'un lecteur payant coûte un appel Sonnet, une fois, puis il est persisté et resservi.
- `run.coveredHardConstraints` (dans `RunResult`) est **legacy et faux** : il marque une contrainte
  « couverte » dès que l'outcome n'est pas `not_applicable`, donc un `unknown` la déclare examinée.
  L'assembleur ne s'en sert plus (il passe par le registre). **Ne pas s'y fier ; envisager de le
  supprimer.**
