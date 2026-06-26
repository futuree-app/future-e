# Module Comparateur

> Page de module. Documente l'objet du comparateur, son moteur unique, ses trois portes
> d'entrée et la frontière gratuit/payant. Décisions liées : `arbitrages/comparateur-un-moteur-trois-portes.md`,
> `adr/ADR-0007-pack-decision-bundle.md` (et son addendum), `adr/ADR-0002-pivot-compatibilite-territoriale.md`.

## Objet

Le comparateur aide le lecteur à **trancher entre des communes**, jamais à les noter. Il révèle
des **compromis** (chaque lieu a ses forces et ses faiblesses, aucune note globale ne les résume).
Question cible : « entre ces lieux où je projette ma vie, lequel, et au prix de quel compromis ? ».

## Un seul moteur

Tout passe par `src/lib/comparateur-vie.ts` (index national `comparateur-index.json`,
`buildComparaisonComplete` : 7 thèmes, 27 dimensions, palier **absolu** par seuils nationaux +
avantage **relatif** à l'ensemble comparé, « hors score/tri »). Conforme à l'invariant n°1/n°2 :
pas de score synthétique. L'ancien moteur `communes_tension` (scoré, cadre risque) a été retiré
(cf. `arbitrages/comparateur-un-moteur-trois-portes.md`).

## Trois portes, une sortie

- **Découverte (`/ou-vivre`)** : le lecteur exprime des préférences, le moteur **propose** un trio.
- **Départage (mode choix, `/comparateur`)** : le lecteur **nomme** 2-3 communes. Seule porte où
  il choisit ce qu'il compare. Modèle de contrôle distinct (choix vs proposition).
- **Pack Décision** : la matrice complète, payante 39 €, sortie des deux portes.

**Gratuit** = comparaison légère (identité / forces / compromis, zéro score). **Payant** = matrice
complète. Pas de comparaison complète gratuite (cannibaliserait le Pack).

## Cardinalité

Le Pack se définit par l'**arbitrage**, pas par le nombre : N ∈ {2, 3} communes, prix unique 39 €
(addendum `ADR-0007`). Deux modes de pack en base (`replay` = trio issu d'un projet ; `choix` =
INSEE nommés), distingués par une colonne `mode`. Au-delà de N=3, table enfant `decision_pack_communes`.

## Voix

La promesse reste côté lecteur : « Vous hésitez entre {…} ? Tranchez, sans deviner. » Jamais
« résoudre votre choix » (futur•e éclaire, ne décide pas). Voir `doctrine/editoriale.md`.

## Statut

- Moteur conforme et comparaison complète : **livrés** (cf. `/memory/project_comparateur_complet.md`).
- Mode choix (porte 2 reconstruite sur le moteur conforme) + redéfinition du Pack (modes, colonne
  `mode`, `insee_3` nullable) : **chantier de build à venir** (estimé moyen ~1-2 j ; piège de saisie
  PLM/arrondissements à border).

## Paris ouverts

Le moment « j'ai déjà 2 villes en tête » est-il solvable ou est-ce de la réassurance peu
monétisable ? a-t-il du volume ? Voir `paris.md` (paris #3, #4, #5).

## Liens

`arbitrages/comparateur-un-moteur-trois-portes.md`, `adr/ADR-0007-pack-decision-bundle.md`,
`adr/ADR-0001-pas-de-score-synthetique.md`, `adr/ADR-0002-pivot-compatibilite-territoriale.md`,
`doctrine/editoriale.md`, `vision/modele-economique.md`, `paris.md`,
`/memory/project_comparateur_complet.md`, `/memory/project_taille_ville.md`.
