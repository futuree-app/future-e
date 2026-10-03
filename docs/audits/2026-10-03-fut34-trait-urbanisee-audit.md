# FUT-34 : le trait « parmi les communes les plus urbanisées de France » (audit, phase 0)

Date : 03/10/2026. Base : `main` 0f609a8c. Aucun code produit modifié.

## Cause

`getCommuneDistinctive` (`src/lib/comparateur-vie.ts`) choisit, parmi dix percentiles nationaux, le plus extrême
au-delà de 88 / en deçà de 12. L'entrée `{ pct: nature.score, dir: "low" }` produit « compte parmi les communes les
plus urbanisées de France ». Or `nature.score` est le **percentile national du couvert naturel dans un rayon de
15 km** (OSO 2023, `scripts/populate-nature.py`). Son complément n'est pas le bâti : il contient surtout les cultures.

Sur l'index réel :
- 4 324 communes ont `nature.score` ≤ 12 ; **73 % ont moins de 100 hab./km²**, la part artificialisée DANS la commune
  y est en médiane de **5,9 %** et la part agricole de **70,9 %** ;
- seules 271 dépassent 1 000 hab./km² ;
- Bony (Aisne) : 17 hab./km², 4 % artificialisé, 89 % agricole ; Janville-en-Beauce : 59 hab./km² ;
  Châtelaillon-Plage : `nature.score` 8 à cause de la plaine d'Aunis.

Le moteur produit aujourd'hui ce trait pour **3 470 communes** (celles où c'est le trait le plus extrême).

## Textes réellement produits (vrai moteur, `scripts/fut34/traits-avant-apres.mjs`)

| Commune | Trait |
|---|---|
| Châtelaillon-Plage | compte parmi les communes les plus urbanisées de France |
| Bony (village agricole) | compte parmi les communes les plus urbanisées de France |
| Janville-en-Beauce (village agricole) | compte parmi les communes les plus urbanisées de France |
| Chartres | compte parmi les communes les plus urbanisées de France |
| Levallois-Perret (28 500 hab./km²) | compte parmi les communes les plus dynamiques sur le plan démographique |
| Reims | compte parmi les communes qui perdent le plus d'habitants |
| Corte (très naturelle) | compte parmi les communes les plus entourées d'espaces naturels |
| Briançon | compte parmi les communes les plus proches du relief |

## Surfaces

| Surface | Le trait y arrive-t-il ? |
|---|---|
| Module Territoire (snapshot) | oui : `territoire-snapshot.ts` le fige dans le fait `place.distinctive_trait` |
| Carte Territoire | non : fait marqué « aucune carte » |
| Synthèse Territoire (LLM) | non : exclu depuis FUT-6 (`synthesis: exclude`, filtré par `synthesisFacts`) |
| Où vivre, cartes, comparateur, prompts du comparateur (ask, synthesize, synthesize-choix) | non : leur « trait distinctif » vient de `buildDistinctive`, une AUTRE fonction qui compare les communes affichées entre elles (« la plus proche de grands espaces naturels des trois ») ; aucun libellé d'urbanisation |
| Dossier | non |
| Pages publiques | non |
| AskFuture | non |
| Snapshots déjà persistés | la chaîne y figure (exclue, sans carte) ; non réécrits |

Le trait faux est donc calculé et figé, mais plus montré nulle part. Le risque est qu'il revienne dès qu'une surface
lira le fait.

## Recommandation : C, supprimer

- A (reformuler) donnerait « compte parmi les communes les moins entourées d'espaces naturels dans un rayon de 15 km »
  : fidèle, mais sans valeur pour le lecteur (il désigne surtout des plaines agricoles) et facile à relire comme
  « urbaine ».
- B (vraie métrique communale) : l'index a bien la part artificialisée dans la commune (`nature.composition`,
  OSO 2023) et la densité ; mais en faire un classement national est un nouveau trait, pour un fait que rien
  n'affiche. Hors du ticket.
- **C** : retirer l'entrée. Le choix retombe sur le trait suivant le plus extrême (Châtelaillon : « compte parmi
  les communes les plus dynamiques sur le plan démographique », percentile 92), ou sur aucun trait (valeur `null`,
  déjà gérée : fait sans carte, exclu de la synthèse).

## Les autres traits de la même fonction

| Trait | Mesure | Verdict |
|---|---|---|
| étés les plus chauds, pluvieuses, pluies intenses, sécheresse, feu | percentiles nationaux DRIAS (commune) | fidèles |
| entourées d'espaces naturels | percentile du couvert naturel dans 15 km | fidèle (« entourées » dit le rayon) |
| dynamiques / perdent le plus d'habitants | percentile national du taux de croissance ; les 4 346 du bas ont toutes un taux négatif | fidèles |
| proches du relief | `relief_proximite` est un score (altitude max dans 35 km), pas un percentile ; ≥ 88 = 3,9 % des communes | wording de classement tenu par les faits ; pas le même défaut, hors FUT-34 |

Rien d'autre n'a le défaut « culture comptée comme bâti ».

## Périmètre proposé

1. Retirer le trait « urbanisées » de `getCommuneDistinctive`.
2. Sortir la liste des traits et la fonction dans un module pur (`src/lib/trait-distinctif.ts`), réexporté par
   `comparateur-vie.ts`, pour pouvoir tester sur l'index réel (le moteur est `server-only`).
3. Corriger la limite du fait `place.distinctive_trait` (elle décrit le trait retiré).
4. Tests négatifs : Châtelaillon, Bony, Janville-en-Beauce ; aucune commune de l'index ne reçoit « urbanisées » ;
   aucun libellé ne parle d'urbanisation ; Châtelaillon retombe sur un trait fidèle.
