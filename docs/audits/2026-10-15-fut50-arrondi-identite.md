# FUT-50 · Fiabilisation : arrondi aux seuils et identité des communes

15 octobre 2026 · prototype seulement.

**Inchangés** : direction artistique, textes, parcours, seuils, classifications.

## 1. Arrondi

**Cause** :
- `valeurAffichee` contrôlait l'entier, mais pas la décimale de secours (24,96 → « 25,0 »).
- La méthode (« Comment lire ce résultat ? ») arrondissait de son côté (24,96 → « 25 pour un repère de 25 », juste après « aucun repère atteint »).

**Règle** : la valeur affichée est la première forme, l'entier puis une décimale, qui reste du même côté du seuil que la valeur non arrondie. Si aucune ne convient : « moins de 25 », ou « au moins N » pour un seuil non entier.
- La méthode garde sa décimale (« 23,4 pour un repère de 25 »), sous la même garantie.
- Une valeur non finie lève une erreur dans `valeurAffichee` et vaut « donnée absente » dans `lireChaleur`.

**Cas limites** :

| Valeur | Seuil 8 | Seuil 25 |
| --- | --- | --- |
| juste sous le seuil | 7,6 → 7,6 · 7,99 → moins de 8 · 7,999 → moins de 8 | 24,4 → 24 · 24,6 → 24,6 · 24,96, 24,99, 24,999 → moins de 25 |
| seuil atteint | 8 → 8 · 8,01 → 8 | 25 → 25 · 25,01 → 25 |

**Tests** :
- balayage au pas de 0,0001 sur ±3 autour de 8, de 25 et d'un seuil non entier, pour les deux précisions (affichage et méthode) ;
- non-régression de La Rochelle, Nantes, Bordeaux et Nîmes.

**Données réelles** : DRIAS ne donne qu'une décimale, donc « moins de 25 » n'y apparaît jamais. Bâgé-Dommartin (01025) affiche bien « 24,9 nuits ».

## 2. Identité

**Cause** : la route reprenait le paramètre `commune` du navigateur.
- **Avant** : `insee=30189&commune=La Rochelle` renvoyait « La Rochelle », avec 14 jours et 69 nuits (Nîmes) et le bouton « Examiner une adresse à La Rochelle ».
- **Après** : la même requête renvoie « Nîmes ».

**Règle** :
- format strict : 5 chiffres, ou `2A` / `2B` suivis de 3 chiffres ; sinon 400 `requete_invalide` (l'ancienne expression acceptait « 1A234 ») ;
- nom canonique : `villePLM` pour 75056, 69123 et 13055, puis l'index des communes du moteur (`getCommuneEntry`), en mémoire et sans réseau ;
- `commune` et `libelle` ne sont plus lus ;
- code absent de ces référentiels : 404 `commune_inconnue`. Le navigateur affiche alors « Cette commune n'est pas encore couverte par l'aperçu. », sans « Réessayer ». C'est la seule modification visible.

**Banc** `scripts/fut50/verifier-identite.mjs` : 35 vérifications, toutes conformes.
- Nîmes sur les cinq priorités, avec trois noms fournis différents ;
- La Rochelle ; la Corse (2A, 2B, minuscules) ;
- Paris, Lyon et Marseille, en ville et en arrondissement ;
- 7 codes malformés ; 99999, 50173 (commune fusionnée) et 97411.

**Navigateur** : le parcours Nîmes → deux priorités → onglet → nouvelle recherche La Rochelle → onglet garde la bonne identité à chaque étape.

## Limites

- **Outre-mer** : les 133 communes d'outre-mer que couvre DRIAS sont absentes de l'index. Elles affichent désormais « pas encore couverte », alors qu'avant la chaleur s'affichait sous le nom envoyé par le navigateur. La recherche les propose pourtant : à décider (référentiel outre-mer, ou filtre de la recherche).
- **Anciens codes de communes fusionnées** : refusés. L'index ne garde pas les correspondances.
- **Premier appel à froid** : la résolution charge l'index (11 Mo compressé) une fois par processus.
