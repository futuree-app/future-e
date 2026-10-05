# FUT-60 : la contradiction sur les arrêtés d'inondation dans Territoire (05/10/2026)

## 1. Symptôme

Sur un dossier parisien (audit du 03/10), le module Territoire disait « reconnue 20 fois… surtout au
titre de : inondations » puis « dont 0 arrêté inondation depuis 1982 ».

## 2. Cas reproduit

- **Paris** (adresse dans un arrondissement, Territoire lu sur 75056).
- **Relevé direct GASPAR** sur 75056 : 20 lignes. La répartition donne Inondations 16, puis Sécheresse,
  Mouvements de terrain, Tempête et Grêle (1 chacun). Première reconnaissance : 1983.
- **Index** (`data/comparateur-index.json.gz`) sur 75111 : `inondation.catnat = 0`, `risque = 1`.
- **Chaîne** :
  - le dossier est généré à l'adresse (75111) ;
  - `moduleFacts.catnatInondation = 0` est figé dans l'artefact `{count: 0, insee: "75056", version: "catnat-1"}` ;
  - la page Territoire affiche ce compte figé sous le total direct ;
  - d'où « 20 … surtout inondations » au-dessus de « dont 0 ».

## 3. Source

Un seul fournisseur et un seul jeu : Géorisques `/api/v1/gaspar/catnat?code_insee=…`.

- **Catégorie** : `libelle_risque_jo`.
- **Dates** : `date_debut_evt` et `date_fin_evt` (événement), `date_publication_arrete`, `date_publication_jo`.
- **Commune** : `code_insee`.
- **Arrêté** : `code_national_catnat`.
- **Période** : toute l'histoire du régime (loi du 13/07/1982).

**Grain** : GASPAR ne connaît Paris, Lyon et Marseille qu'au code de la commune. 75111 et 75115
renvoient 0 ligne, 75056 en renvoie 20. `/gaspar/risques` a le même grain (75056 recense
l'inondation, 75111 ne répond rien). Le zonage sismique a le grain inverse (voir §12).

## 4. Taxonomie

Libellés réels relevés sur 13 communes (Paris, Lyon, Marseille, Brest, Nice, Nîmes, Toulouse,
Bordeaux, Chamonix, Châtelaillon, La Faute-sur-Mer, Attignat, Ornex) :

| Libellé source | Index (`is_flood`, Python) | Relevé direct (`simplifyCatnatRisk`) | Où |
|---|---|---|---|
| Inondations et/ou Coulées de Boue | inondation | Inondations | index, carte, synthèse |
| Inondations Remontée Nappe | inondation | Inondations | idem |
| Chocs Mécaniques liés à l'action des Vagues | exclu | Chocs liés aux vagues | idem |
| Sécheresse | non | Sécheresse des sols | carte, synthèse |
| Mouvement de Terrain / Glissement de Terrain | non | Mouvements de terrain | idem |
| Tempête, Grêle, Poids de la Neige, Avalanche, Secousse Sismique | non | leur famille | idem |

Sur ces libellés, les deux classifieurs concordent. **La taxonomie n'est pas la cause.**

## 5. Périodes

| Métrique | Début affiché | Fin | Données |
|---|---|---|---|
| Total direct (« 20 arrêtés depuis 1983 ») | année de la 1re reconnaissance | relevé du jour | complètes |
| Synthèse (« reconnue 20 fois depuis 1983 ») | idem | idem | idem |
| Compte inondation (« dont 16 depuis 1982 ») | origine du régime | date de l'index | complètes |

- Les données couvrent la même histoire ; seul le « depuis » différait.
- Après correction, les trois disent « depuis 1982 », et l'année de la première reconnaissance reste dans le volet.

## 6. Unité de comptage

- **Une ligne GASPAR** = un arrêté × un phénomène × un événement, pour une commune.
- **Les deux chemins comptent des lignes**, sans déduplication :
  - Paris : 20 lignes pour 16 arrêtés distincts ;
  - Nice : 83 lignes pour 57 arrêtés.
- **Exemples de lignes multiples** :
  - `INTE1831446A` couvre deux événements (2017 et 2018) ;
  - `NOR19830910` couvre inondation, tempête et grêle d'un même événement.
- **Les deux compteurs sont donc comparables entre eux.** Le mot « arrêté » est inexact (voir §12).

## 7. Cause racine

**Grain de la source.** `scripts/populate-inondation.py` interrogeait GASPAR avec le code de chaque
entrée de l'index. Or l'index stocke Paris, Lyon et Marseille par arrondissement.

- **Effet** : 45 arrondissements à `catnat: 0, risque: 1`, c'est-à-dire faussement parmi les communes les moins
  exposées de France.
- **Portée** :
  - la phrase du dossier ;
  - la règle de décision « exposition à l'inondation », qui concluait « exposition non notable » ;
  - le critère « faible risque inondation » du comparateur ;
  - la preuve figée.

Pages publiques : `getGasparCatnatSummary(<arrondissement>)` avait le même défaut, ainsi que `/gaspar/risques`.

## 8. Règle canonique

- **Grain** : un compte CatNat se lit au grain de GASPAR, la commune. Un arrondissement porte le
  compte de sa commune (`communeParent`).
- **Unité** : la ligne GASPAR, la même partout.
- **Période** : depuis 1982, la même partout.
- **Groupe « inondation »** : `Inondations et/ou Coulées de Boue` et `Inondations Remontée Nappe`. Les
  chocs mécaniques des vagues sont exclus, comme les autres phénomènes.
- **Dominante** : un aléa « domine » à partir de 55 % des reconnaissances. Ce seuil est celui du résumé
  existant, désormais partagé par la carte et la synthèse. En dessous, aucun « surtout » ; une égalité se
  dit comme telle.

## 9. Correction

1. **Source** : `populate-inondation.py` et `georisques.ts` interrogent `communeParent(insee)` pour
   `/gaspar/catnat` et `/gaspar/risques`.
2. **Données** : les 45 arrondissements de l'index reçoivent le compte de leur commune (relevé du
   05/10 : Paris 16, Lyon 19, Marseille 29), et le rang est recalculé avec la formule du script.
   - L'aller-retour de l'index est octet pour octet.
   - 73 autres communes bougent d'un point par arrondi ; aucune ne franchit le seuil de décision (66).
3. **Dossiers figés** :
   - convention `catnat-2` ;
   - `catnatFigeAffichable` refuse un compte `catnat-1` de Paris, Lyon ou Marseille, faux par
     construction. Le dossier n'est pas modifié : la carte retombe sur l'index courant.
4. **Territoire PLM** : l'instantané lit le compte de la commune sur son premier arrondissement.
5. **Texte** :
   - période alignée sur 1982 ;
   - dominante par `aleaDominant` et `resumeCatnat` (purs, `georisques-flags.ts`) ;
   - un relevé vide n'est plus présenté comme une panne.
6. L'agrégation des lignes GASPAR est déplacée telle quelle dans `georisques-flags.ts`, pour être
   testable.

## 10. Autres phénomènes vérifiés

- **Même cause, même correction** : sécheresse, mouvements de terrain, tempête et autres (le relevé
  direct d'un arrondissement les perdait tous).
- **Même mécanisme de dominante** : Châtelaillon passait de « surtout au titre de : sécheresse des sols,
  inondations et chocs liés aux vagues » (5 reconnaissances sur 14) à aucune dominante.
- **Synthèse IA** : elle ne reçoit que le relevé direct (`catastrophes_naturelles_reconnues`), jamais le
  compte d'index. Elle ne voyait donc pas deux faits contradictoires.

## 11. Tests

`src/lib/fut60-catnat.test.ts` (T1 à T8), sur les vraies lignes GASPAR
(`src/lib/__fixtures__/fut60-gaspar-catnat-05-10.json`) et le vrai index.

Mutations : l'ancien index fait échouer 4 tests, la dominante sans seuil 1, la période « première
année » 2.

## 12. Limites

- **Le mot « arrêté »** désigne des lignes (Paris : « 20 arrêtés » pour 16 arrêtés distincts).
  Compter des arrêtés distincts exige de régénérer l'index de 35 000 communes. Dire
  « reconnaissances » change la phrase figée des pastilles vendues. C'est une décision à part.
- **Zonage sismique** : grain inverse (75056 ne répond rien, 75111 oui). Le Territoire de Paris n'a
  donc pas de zone sismique. Hors de ce lot.
- **Décisions déjà vendues** : un dossier Paris, Lyon ou Marseille avec la priorité inondation a figé
  « exposition non notable » sur un faux zéro. Il n'est pas modifié (version moteur figée).
  Recensement : lecture de production, à lancer par le porteur.
- **Données de l'index** : le reste de l'index date de sa dernière génération (Toulouse : 19 dans
  l'index, 20 dans GASPAR aujourd'hui). Le comptage Paris, Lyon et Marseille est du 05/10/2026.
- **Effet de taille** : le compte d'une grande commune s'applique à chaque arrondissement, comme pour
  toute grande commune non découpée (Toulouse, Nice). C'est le grain de la source, dit comme tel.
