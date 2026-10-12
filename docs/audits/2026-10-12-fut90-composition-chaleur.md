# FUT-90 : échec d'assemblage quand la chaleur (ou le feu) est une condition sans compromis

12/10/2026, branche `fix/fut-90-composition-chaleur`.

## Cause confirmée

`runRules` (`materiality-rules.ts`) produit deux listes :

- `run.evaluations[].facts` : la **trace** de ce que chaque règle a établi ;
- `run.facts` : ce que le dossier **émet**.

Quand une préférence est confirmée comme condition (FUT-7), `conditionsDePreference` (`condition-rules.ts`) réunit les faits du critère dans une carte « À confirmer » et les **retire de `run.facts`**. La trace, elle, les garde, et c'est voulu : `criteria-registry` s'en sert pour la couverture.

Trois compositions (`fact-compositions.ts`) cherchaient leur fait dans la **trace** : confort d'été, tradeoff saisonnier et danger d'incendie. Elles absorbaient donc un fait que la carte condition avait déjà repris. `assertCompositionsValid` vérifie les absorptions contre `run.facts` et a correctement rejeté la composition : `fait absorbé inexistant : 30189:climat-chaleur (30189:composition-confort-ete)`.

Reproduit sur les vraies données de Nîmes (30189), au niveau commune et au niveau adresse (BAN + `assembleAddressDossier`) :

| Condition confirmée | Poids | Avant la correction |
|---|---|---|
| `faible_chaleur` | 2, 3 | échec (`composition-confort-ete`) ; échec aussi via `composition-climat-saisons` si `douceur_climat` ≥ 2 et hivers doux |
| `faible_chaleur` | 1 | OK (aucun fait émis) |
| `faible_risque_feu` | 1, 2, 3 | échec (`composition-danger-incendie`, sans seuil de poids) |

Le défaut n'était donc pas propre à la chaleur : le feu échouait aussi, et à tous les poids.

## Conséquences possibles

- **Dossier payé** : `generate-decision-artifact.ts` appelle `buildCommuneDossier`, qui levait l'erreur. Aucune version n'était figée après l'achat.
- **`/rapport`** : `buildCommuneDossier` y est appelé sans `catch`, donc la page plantait pour un lecteur qui avait confirmé ces conditions.
- **`/rapport/quartier`** : l'erreur y est rattrapée (`.catch(() => null)`), si bien que le dossier disparaissait sans aucun message.

## Correction

`fact-compositions.ts` : un helper `emittedFact(run, ruleId, role)` lit le fait dans `run.facts`. Les quatre lectures de faits passent désormais par lui : chaleur ×2, feu, et argiles/PPR (ce dernier n'était pas touché aujourd'hui, mais avait la même fragilité). L'**issue** d'une règle (`outcome`, par exemple la douceur `satisfied`) se lit toujours dans l'évaluation.

Ce qui ne change pas :

- `assertCompositionsValid` (son test d'absorption fantôme ou double tourne toujours) ;
- `conditionsDePreference` ;
- la trace des évaluations, et donc la couverture.

Une composition ne repêche plus un fait réuni : la carte condition le porte seule, avec ses preuves.

## Tests réalisés

- `src/lib/decision/fut90-conditions-climat.test.ts` (13 tests, sur la vraie chaîne règles → conditions → compositions → assemblage → artefact). 8 échouaient avant la correction, sur l'erreur du ticket. Cas couverts :
  - poids 1, 2 et 3 ;
  - condition contredite, satisfaite et non tranchable (couverture non examinée, jamais favorable) ;
  - avec et sans tradeoff saisonnier ;
  - feu seul, feu recensé, chaleur et feu ensemble ;
  - grain adresse ;
  - artefact sérialisé.
- Suite complète : 2542/2542.
- `tsc --noEmit` vert, et le nouveau test typé lui aussi.
- `next build --webpack` vert (285 pages).
- Vraies données de Nîmes, avant et après la correction : commune (chaleur et feu, poids 1 à 3) et adresse réelle (place de l'Hôtel de Ville) jusqu'à `buildDecisionArtifact`. Aucune écriture, aucun achat.

## Hors périmètre, à trancher

1. **Le geste disparaît.** Une chaleur ou un feu confirmés ne portent plus le renvoi au confort d'été ou à la végétation (`summerComfortAction`, `wildfireExposureAction`) : la carte condition ne reprend que l'action des `verification`.
2. **La limite climatique (1976-2005, grain commune) n'est pas reprise par la carte condition.** Seul `whyNotDecided` dit « à l'échelle de la commune ». C'est le comportement de FUT-7 pour toutes les préférences.
3. **La douceur peut se lire deux fois.** Avec `douceur_climat` confirmée et des hivers doux, la douceur apparaît dans la carte condition (favorable) et dans le côté favorable du tradeoff saisonnier. C'est une redite, pas un échec.
