# Tableau des capacités : de la source fetchée au geste de vérification (30/07/2026)

Audit par lecture du code, famille par famille. Il répond à une question et une seule :

> Pour chaque source, où s'arrête-t-elle dans la chaîne
> **fetchée → affichée → lue par une règle → pèse sur l'orientation → produit un geste** ?

Il met à jour le §4.4 et le §6 du `cadrage-sources-par-echelle.md` (28/07), qui sont **périmés sur
trois points** : le confort d'été, le radon et l'IREP ont bougé les 29 et 30/07.

## Les cinq colonnes, définies

| Colonne | Ce qu'elle vaut |
|---|---|
| **Fetchée** | un appel réseau ou un artefact est lu pour ce dossier |
| **Affichée** | un composant du rapport la rend au lecteur |
| **Règle** | une `DecisionRule` du `REGISTRY` la lit |
| **Oriente** | son outcome peut être `mismatch` / `satisfied` / `incompatible` / `compromise`, donc il bouge la **couverture** et la conclusion |
| **Geste** | elle produit un « à vérifier » (outcome `verification`, ou entrée de `logement-checklist`) |

La distinction **Oriente / Geste** est le cœur du tableau. Dans ce moteur, `verification` est un
outcome à part entière : un fait peut être pleinement interprété, porter une action, et ne peser sur
aucun verdict. Tout le module Logement est dans ce régime, par arbitrage (slice 1.5 : une règle
Logement ne peut pas émettre `incompatibility`).

---

## 1. Grain COMMUNE

| Famille | Fetchée | Affichée | Règle | Oriente | Geste |
|---|:--:|:--:|---|:--:|:--:|
| **DRIAS-TRACC** (chaleur, feu, pluies) | ✅ | ✅ | `ruleChaleur`, `ruleFeu`, `rulePluies` | ✅ | ✅ (`ruleChaleurAmbiante`, `ruleFeuAmbiant`) |
| **GASPAR risques déclarés** | ✅ | ✅ | `ruleFeu` (via `risquesDeclares`) | ✅ | — |
| **GASPAR CatNat inondation** | ✅ | ✅ | `ruleInondation` | ✅ | — |
| **Radon** (Géorisques) | ✅ | ✅ | `RADON_RULES` | ✅ | — |
| **Santé : air** (moyennes ADEME) | ✅ | ✅ | `ruleAir` | ✅ | — |
| **Santé : bruit** (`calmeSonore`) | ✅ | ✅ | `ruleBruit` | ✅ | — |
| **Santé : industrie** (ICPE/Seveso) | ✅ | ✅ | `ruleIndustrie` | ✅ | — |
| **Scores comparateur** (13 clés de `MISMATCH_KEYS`) | ✅ | ✅ | `MISMATCH_RULES` + `ALIGNMENT_RULES` | ✅ | — |
| **Absences attestées** (réseau local, enseignement sup.) | ✅ | ✅ | `ABSENCE_RULES` | ✅ | — |
| **Littoral** | ✅ | ✅ | `COAST_RULES` | ✅ | — |
| **Taille de ville / unité urbaine** | ✅ | ✅ | `AGGLOMERATION_RULES` | ✅ | — |
| **Boisement (OSO)** | ✅ | ✅ | lu par `ruleFeu` comme **garde**, jamais comme signal | partiel | — |
| **ERA5** (tendance observée) | ✅ | ✅ | aucune | ❌ | ❌ |
| **VigiEau** (niveau du jour) | ✅ | ✅ | aucune | ❌ | ❌ |
| **Eaufrance ONDE** (assecs) | ✅ | ✅ | aucune | ❌ | ❌ |
| **Eaufrance eau potable** (nitrates, nitrites) | ✅ | ❌ **rapport** | aucune | ❌ | ❌ |
| **ADEME communal** (vacance, saisonnalité, éloignement services) | ✅ | ✅ | aucune | ❌ | ❌ |
| **Baignade** | ✅ | ❌ **rapport** | aucune | ❌ | ❌ |
| **Atmo (indice du jour), Pollen** | ✅ hors rapport | ❌ | aucune | ❌ | ❌ |

**Lecture.** Le territoire est le module le mieux branché : onze familles orientent la décision.
Les six dernières lignes sont le vrai gisement, et elles sont presque toutes « eau ».

**Eaufrance porte deux choses.** `EaufranceSummary` contient `drought` (ONDE) **et** la qualité de
l'eau potable (`resultats_dis`, paramètres 1340/1350). `QuartierClimatData` n'importe que
`EaufranceSummary["drought"]`. La partie eau potable est fetchée à chaque dossier et n'atteint le
lecteur que par `/api/ask` et `PollutionLookup`, hors rapport.

---

## 2. Grain SECTEUR

| Famille | Fetchée | Affichée | Règle | Oriente | Geste |
|---|:--:|:--:|---|:--:|:--:|
| **Équipement automobile du quartier** (IRIS du point, RP 2022) | ✅ | ✅ | `SECTEUR_RULES` | ❌ **par conception** | ✅ |
| **ICU CSTB** (596 communes) | ✅ | ✅ | aucune | ❌ | ❌ |
| **Autres indicateurs IRIS** (passoires, précarité, HLM, suroccupation…) | ✅ | ✅ | aucune | ❌ | ❌ |

**Une seule règle à cette échelle**, et elle refuse volontairement de trancher : elle rend
`verification`, jamais `mismatch` ni `satisfied`, et se plafonne à `secondary`. Le motif est écrit
dans `secteur-rules.ts` : « un fait qui ne peut pas conclure ne doit pas peser comme s'il le
pouvait. » C'est exactement le « niveau 2 avant niveau 3 » de la conversation, appliqué avant d'avoir
été nommé.

Les autres indicateurs IRIS sont sous la réserve du §4.1bis du cadrage : **estimés** (ENL 2022 par
sondage, GEODIP 2017), affichables avec leur provenance, jamais fondement d'un verdict.

---

## 3. Grain ADRESSE

| Famille | Fetchée | Affichée | Règle | Oriente | Geste |
|---|:--:|:--:|---|:--:|:--:|
| **DPE étiquette** | ✅ | ✅ | `ruleDpe` (`structuring`) | ❌ | ✅ + checklist |
| **DPE confort d'été** | ✅ | ✅ | `ruleConfortEte` (`secondary`) | ❌ | ✅ + checklist |
| **RGA (argiles)** | ✅ | ✅ | `exposition-bati` | ❌ | ✅ + checklist |
| **PPRN / plans réglementaires** | ✅ | ✅ | `zone-reglementee` | ❌ | ✅ + checklist |
| **Cavités BRGM** | ✅ | ✅ | `cavite` | ❌ | ✅ + checklist |
| **Patrimoine / ABF (GPU)** | ✅ | ✅ | `patrimoine` | ❌ | ✅ + checklist |
| **Sinistralité ONRN** | ✅ | ✅ | `sinistralite` (`grain: commune`) | ❌ | ✅ + checklist |
| **Audit énergétique + scénarios** | ✅ | ✅ (`EnergieSection`) | aucune | ❌ | ❌ |
| **Sismicité** | ✅ | ✅ | aucune | ❌ | ❌ |
| **Mouvements de terrain** | ✅ | ✅ | aucune | ❌ | ❌ |
| **Cadastre / parcelle** | ✅ | ✅ | aucune | ❌ | ❌ |
| **Altitude IGN** | ✅ | ✅ | contraintes dures (relief) | ✅ | — |
| **ZFE** | ✅ | ❌ | aucune | ❌ | ❌ |
| **Cartofriches** (dont `sol_pollue`) | ✅ | ❌ | aucune | ❌ | ❌ |
| **IREP** | ❌ débranché le 29/07 | ❌ | aucune | ❌ | ❌ |

### 3.1 — Deux familles sont du payload mort

`zfe` et `cartofriches` sont fetchés par `/api/georisques-logement`, transportés dans
`LogementReport`, et lus par **aucun composant et aucune règle**. Vérifié par recherche exhaustive
sur `src/` : zéro occurrence hors de la route qui les produit.

C'est **le défaut exact** pour lequel l'IREP a été débranché le 29/07, et le commentaire qui explique
ce débranchement est écrit dix lignes au-dessus de `cartofriches` dans le même fichier. Deux appels
réseau par dossier, deux dépendances qui peuvent tomber, et l'impression que la pollution des sols et
la réglementation ZFE sont couvertes.

Deux issues, symétriques : les débrancher comme l'IREP (avec le même commentaire), ou leur donner une
règle. Le statu quo est le seul mauvais choix.

### 3.2 — Les deux chemins « à vérifier » sont redondants à 100 %

`logement-checklist.ts` et `LOGEMENT_RULES` couvrent **les sept mêmes familles**, à partir des
**mêmes booléens** (`ChecklistFacts` est un sous-ensemble exact de `LogementFacts`) :

| id de checklist | règle correspondante |
|---|---|
| `energie` | `logement.dpe-faible` |
| `confort` | `logement.confort-ete` |
| `bati` | `logement.exposition-bati` |
| `reglementaire` | `logement.zone-reglementee` |
| `sinistralite` | `logement.sinistralite` |
| `cavite` | `logement.cavite` |
| `patrimoine` | `logement.patrimoine` |

Le même fait est donc raconté deux fois, par deux moteurs de texte différents, dans le même module.
L'unification n'est pas un refactor spéculatif : c'est la suppression d'un doublon complet.

Portée actuelle de la checklist : `DecisionChecklist` n'est appelé que par `LogementModule.tsx`
(beat 5). Le territoire et le quartier ne peuvent rien y déposer, alors que `RULE_CHALEUR_AMBIANTE`,
`RULE_FEU_AMBIANT` et `SECTEUR_RULES` produisent déjà des `verification` à leurs échelles.

---

## 4. Ce que le cadrage du 28/07 disait de faux aujourd'hui

| Affirmation du §6 | État réel au 30/07 |
|---|---|
| « Brancher le confort d'été » | **fait le 29/07** : `ruleConfortEte`, `secondary`, avec limitation |
| « Trancher le radon » | **fait** : `radon-facts.ts`, `radon-rules.ts`, chargé dans `territory-facts.ts`, dans le `REGISTRY` |
| « IREP fetché et affiché » | **débranché le 29/07**, lib conservée |
| « Brancher `sol_pollue` et ZFE » | toujours vrai, et pire que décrit : ils ne sont même pas **affichés** |
| « Brancher l'audit » | toujours vrai (affiché, aucune règle) |

## 5. Ce que le tableau désigne

Trois chantiers, par ordre de rapport sur l'effort.

1. **Unifier les deux chemins « à vérifier » et porter la liste au rapport.** Doublon intégral à
   supprimer, et c'est le geste qui fait sortir `echelles.ts` du domaine : la fonction
   `echelleDuFait` n'a **aucun appelant** hors de son propre test. Une liste « à vérifier avant de
   décider » alimentée par les trois échelles est la forme la plus sûre de composition
   inter-échelles, sans une donnée nouvelle.
2. **Trancher `zfe` et `cartofriches`.** Règle ou débranchement, une heure dans les deux cas.
3. **Choisir ce qui monte d'affichée à interprétée.** Les candidats sérieux sont l'audit
   énergétique (déjà affiché, scénarios chiffrés, geste évident) et l'ICU (limité à 596 communes,
   donc à concevoir avec sa dégradation).

## Réserves de méthode

Lecture de code uniquement, aucun appel d'API. Les colonnes **Fetchée** et **Affichée** sont établies
par recherche exhaustive sur `src/` ; les colonnes **Règle**, **Oriente** et **Geste** par lecture du
`REGISTRY` de `materiality-rules.ts` et des fichiers de règles qu'il agrège. Ce qui n'est pas vérifié
ici : le **taux de remplissage réel** des familles affichées (combien de dossiers portent un audit,
un confort d'été renseigné, un ICU). Une famille branchée qui répond une fois sur dix est une
capacité sur le papier.
