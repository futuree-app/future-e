# FUT-99 — intégration ciblée B104, 22 octobre 2026

Base : main `68f29dbdb75781d3509a2278c7b7fe5af344e1e6`.
Branche isolée : `fix/fut-99-bpe-hypermarches`.
L'utilisateur a explicitement validé l'intégration des 833 fichiers.

## Source et décision

Extrait assaini sur `data/bpe25-b104-v2`, commit
`aeb8ed8c856da8a834a67f23cb6a2a7174648f21`, fichiers sous `data/extraits/` :

- `bpe25_B104_v2.csv`, SHA-256 `e7c5f0f30c1034a8a18c9dd10e348dc9ea744c6b9ae887dd197ea88be0896580`
- `bpe25_B104_v2.parquet`, SHA-256 `b17571f84ee6a59ef8c5a5b71774ece6d721da72fdc90fa7b555ad27e9ce77cf`

Empreintes contrôlées. Seule la v2 a servi à l'intégration ; aucun extrait brut ajouté à cette PR.
2 256 lignes : 2 242 O, 14 P. Les P n'ont pas de coordonnées exploitables.

B104 désigne « Hypermarché et grand magasin », pas seulement l'alimentaire.
Sélection : B104 ET APET=4711F. 197 grands magasins 4719A exclus ;
2 059 lignes d'activité hypermarché dont 2 047 géolocalisées retenues.
Le libellé « Hypermarché (magasin ou drive) » conserve la réserve de la nomenclature.
Pas de sélection par enseigne. Les statuts de diffusion sont contrôlés, la protection P conservée.

Références officielles vérifiées lors du diagnostic :
- https://www.insee.fr/fr/metadonnees/source/fichier/BPE25_liste_hierarchisee_TYPEQU.html
- https://www.insee.fr/fr/metadonnees/source/fichier/BPE25_anonymisee_dessin_fichier.html
- https://www.insee.fr/fr/metadonnees/nafr2/sousClasse/47.11f

## Delta exact et reproduction

```sh
python scripts/populate-bpe.py --append-b104 /chemin/bpe25_B104_v2.parquet --output-dir data/bpe-points
python scripts/test_populate_bpe_b104.py
python scripts/populate-bpe.py --selftest
node --test src/lib/logement-bpe*.test.ts
node_modules/.bin/tsc --noEmit
```

833 fichiers existants modifiés, zéro créé ; 1 384 cellules intactes.
2 007 lieux ajoutés après déduplication existante, dont 29 multi-exploitants.
302 069 octets supplémentaires (30 720 563 → 31 022 632 dans les cellules concernées).
Comparaison exhaustive avec Git : retirer les B104 de chaque nouveau JSON rend exactement
l'ancien objet, points, métadonnées et ordre compris. Aucun autre fichier de données modifié.
Deuxième exécution réelle : zéro cellule modifiée. Aucun recalcul comparateur/cache/index.
Ne pas utiliser `--face3-shards` sur un extrait : ce mode remplace les cellules.

## Preuve fonctionnelle

Test permanent utilisant `loadBpePointsAround` et `nearestByCategory` sur les shards intégrés :
point BPE du 163 boulevard André-Sautel, La Rochelle (46.17078, -1.12522).

| Mesure | Avant (B104 retirés) | Après |
|---|---:|---:|
| Plus proche alimentaire | Primeur, 264 m | Hypermarché (magasin ou drive), 210 m |
| Lieux à 500 m | 2 | 3 |
| Plus proche B105 | 709 m | 709 m |

B104 : SAUTEL DISTRIBUTION au 124 boulevard André-Sautel.
Les coordonnées désignent un point BPE, pas une entrée physique vérifiée.
Distances à vol d'oiseau, pas des trajets. Déduplication inchangée : même type,
point arrondi à cinq décimales ou même adresse à moins de 100 m, dans une cellule.
La donnée ne prouve ni ouverture ni accès piéton. Aucun test navigateur ou production effectué.

## Contrôles

- 4 tests Python permanents : sélection, grands magasins/activité inconnue exclus,
  déduplication, masquage P même avec coordonnées, refus de statut inconnu/extrait mixte,
  conservation des points et idempotence, refus de millésime incompatible.
- 30 tests TypeScript BPE réussis : contrats sur toutes les cellules, libellé/genre,
  cas réel, comptage des multi-exploitants, anciens snapshots lisibles.
- Autotest Python : OK. TypeScript `--noEmit` : OK.
- ESLint fichier de logique : aucune erreur ; tests vérifiés aussi avec `--no-ignore` : OK.
- `git diff --check` : OK.

Les anciens dossiers figés restent inchangés ; les nouvelles analyses utilisent les nouveaux points
après livraison. Aucun composant Relevé, aucune règle/formulation mobilité modifiée.
Aucune écriture Supabase, aucun appel Anthropic, aucune fusion ni déploiement lancé.
