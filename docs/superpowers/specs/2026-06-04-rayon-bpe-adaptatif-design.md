# Rayon BPE adaptatif (chantier #5) — design

Date : 2026-06-04
Statut : design validé, prêt pour plan d'implémentation.

## Problème

L'accès aux équipements BPE (`ecoles`, `culture`, `etudes_acces`) est aujourd'hui
calculé par comptage des équipements dans un **rayon fixe de 15 km** (`RAYON_KM = 15`
dans `scripts/populate-bpe.py`), puis normalisé en percentile national.

Un rayon fixe applique implicitement une **norme urbaine** à des territoires très
différents. En zone dense, 15 km dépasse largement l'usage quotidien réel ; en rural,
15 km est plus étroit que le rayon de déplacement que les habitants acceptent
effectivement pour un lycée, un cinéma ou une université. Comparer ensuite tous les
comptages sur une même échelle de percentile national encode mécaniquement une
**pénalité rurale**, en tension directe avec la doctrine « ne jamais pénaliser le rural
par défaut ».

## Intention

Rapprocher la mesure d'accès des **comportements de mobilité réels selon le type de
territoire** :
- rayon plus large en rural ;
- rayon plus resserré en urbain ;
- **comparabilité nationale conservée** autant que possible.

Priorité : la **justice rurale** (motivation A), parce que c'est elle qui entre le plus
en tension avec la doctrine. Mais l'objectif est bien double (motivation C) : on ne
corrige pas seulement un biais, on rend la mesure plus réaliste aux deux extrémités.

Hors périmètre, idéal de long terme : un raisonnement en **temps d'accès** plutôt qu'en
distance à vol d'oiseau. Conceptuellement supérieur pour lycée / université / cinéma /
gare, mais trop lourd pour cette V1.

## Principe de conception

**Classes territoriales simples, pas de fonction continue de densité.** Une fonction
continue serait difficile à expliquer et à maintenir. On retient quatre classes
discrètes, lisibles, assises sur le **bassin de vie**.

La classe d'une commune est dérivée de `tailleVille(c)` : population de l'unité urbaine
(somme des populations communales par code `uu`) si la commune est dans une UU, sinon sa
population communale (une commune hors UU est son propre bassin). Cette fonction existe
déjà côté TS (`uuPopCache` / `tailleVille` dans `src/lib/comparateur-vie.ts`) ; on en
réplique la logique côté Python.

Choix assumé : le rayon suit la **logique de mobilité acceptée**, PAS la taxonomie de la
signature des cartes (100k / 30k / 10k). Les deux sémantiques sont distinctes (la
signature mesure la taille du bassin ; le rayon mesure la distance que les habitants
acceptent de parcourir), les coupler créerait une fausse cohérence.

### Table des classes

| `tailleVille` (pop d'UU, sinon pop communale) | Classe | Rayon |
|---|---|---|
| ≥ 500 000 | Vraie métropole | **5 km** |
| 100 000 – 500 000 | Grande ville régionale | **10 km** |
| 30 000 – 100 000 | Ville moyenne | **15 km** |
| < 30 000 **ou `tailleVille` null** | Rural / isolé | **25 km** |

- 25 km en rural est un choix qui **assume** la doctrine (priorité A), pas une demi-mesure.
  Même à 25 km, une métropole reste largement devant en nombre d'équipements : la
  comparabilité nationale n'est pas cassée.
- `tailleVille` null (population absente) → 25 km, par défaut rural, cohérent avec « ne
  jamais pénaliser le rural par défaut ».

## Périmètre

V1 = **uniquement le trio BPE** porté par `populate-bpe.py`, qui partage déjà le rayon et
la logique « comptage d'équipements accessibles » sur la même source `data/bpe24.parquet` :

- ✅ `ecoles` (collèges + lycées)
- ✅ `culture` (cinéma, médiathèque, musée, conservatoire, théâtre)
- ✅ `etudes_acces` (enseignement supérieur ; alimente `vie_etudiante` à 40 %)

Exclus de la V1 (justifications) :
- ❌ `nature` (`populate-nature.py`, couvert naturel 15 km) : accès **ambiant**, pas un
  accès-par-trajet. On ne se déplace pas « vers » du couvert naturel. Reste fixe.
- ❌ `transport` (`populate-transports.py`, gares / ferroviaire) : possède déjà sa propre
  pondération d'accès ferroviaire, et c'est le cœur du chantier #6 (GTFS). Le toucher ici
  mélangerait deux chantiers.
- ❌ `distance_cote_km` (proximité mer) : donnée géographique, pas un accès. Reste fixe.

## Mécanisme

1. **Rayon par commune.** Reconstruire la pop d'UU côté Python (somme des `population` par
   `uu` lue dans `data/comparateur-index.json`), dériver `tailleVille`, puis le rayon via la
   table. Produire un tableau `radius[i]` aligné sur l'ordre des communes.
2. **Comptage adaptatif.** `count_within_radius` reçoit le tableau `radius` au lieu du
   scalaire `RAYON_KM` : le test devient `d <= radius[i]`.
3. **Normalisation.** Percentile national **unique** sur les comptages adaptatifs
   (`bisect`, inchangé). C'est un **re-scoring global** des trois champs : le rayon urbain
   passant de 15 à 5/10 km, les comptages bruts urbains baissent ; les ruraux montent ; le
   percentile rééquilibre. Le moteur TS lit toujours un simple percentile, **zéro impact
   runtime**.

### Piège grille spatiale (à corriger)

La grille actuelle (`CELL = 0.18`, voisinage **±1 cellule**) couvre ±0.18° ≈ 20 km en
latitude. À 25 km (≈ 0.225° en latitude, et jusqu'à **≈ 0.357° en longitude** vers
Dunkerque à 51°N, où `cos(lat)` resserre les méridiens), le voisinage ±1 **raterait** des
équipements → sous-comptage rural, exactement l'inverse du but recherché.

Correctif : passer le voisinage à **±2 cellules** (±0.36°, couvre 25 km partout, métropole
+ DOM vérifiés). `CELL` inchangé. Coût : 25 cellules au lieu de 9 par commune, négligeable
sur 34 788 communes.

## Gloses honnêtes

Aucun texte user-facing dans `src/app` / `src/components` ne cite « 15 km » (vérifié :
seule occurrence = « 15 ans » sur la page pro, sans rapport). Les gloses à mettre à jour
sont donc :
- les commentaires `« dans ~15 km »` de `src/lib/comparateur-vie.ts` ;
- les docstrings et commentaires de `scripts/populate-bpe.py`.

Nouvelle formulation type : « rayon adapté au type de territoire (5 km en métropole à
25 km en rural) ». Re-grep du user-facing en fin de chantier pour ne laisser aucun
« 15 km » menteur. Les tooltips restent dans la doctrine (≤ 2 phrases, « pourquoi ça aide »,
sans méthodo/source) : a priori intouchés.

## Validation

Procédure : après `--write-index`, **toucher `src/lib/comparateur-vie.ts`** (un commentaire
suffit) pour invalider `indexCache`. Puis `npx tsc --noEmit` + `npm run lint` + curl réel
sur le dev (`:3000`).

Mais la validation décisive est qualitative, sur des **cas témoins concrets** : c'est là
qu'on voit si on corrige un biais ou si on déforme le signal.

| Cas | Attendu |
|---|---|
| Village à ~15 km d'une ville moyenne | Monte nettement |
| Village vraiment isolé | Monte peu ou pas |
| Petite commune de périphérie rennaise | Reste bien notée |
| Centre de Rennes | Baisse un peu mais reste haut |
| Paris | Baisse un peu mais reste excellent |
| Commune rurale très éloignée de tout | Reste faible |

Si une de ces lignes échoue (ex. un village isolé qui monte fort, ou Paris qui s'effondre),
le design déforme le signal et doit être revu avant merge.

## Hors périmètre

- Temps d'accès réel (isochrones) : idéal conceptuel, V2+.
- Rayon adaptatif pour `nature`, `transport`, proximité mer.
- Toute UI nouvelle : ce chantier est invisible pour l'utilisateur, il améliore la qualité
  des recommandations sans surface produit.
