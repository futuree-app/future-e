# Extrait BPE 2025 : hypermarchés (B104), v2 assainie

Source : Insee, Base permanente des équipements 2025, fichier détail (Licence Ouverte).
Sélection : `TYPEQU = 'B104'`, sans autre filtre, ordre du fichier source.

## Contenu

- 2 256 lignes, 26 colonnes : les 25 colonnes de la v1, plus `STATUT_DIFFUSION` (valeur source, jamais déduite).
- `STATUT_DIFFUSION` : 2 242 `O`, 14 `P`, 0 valeur nulle, vide ou inconnue.

## Écart avec la v1 (validé par le porteur le 22/10/2026)

- Les 2 242 lignes `O` sont identiques à la v1 sur les 25 colonnes communes.
- Les 14 lignes `P` (diffusion partielle) : `SIRET`, `NOMRS` et `CNOMRS` sont vidés (chaîne vide) dans cette v2.
- Déjà vides à la source Insee pour ces 14 lignes : `NUMVOIE`, `INDREP`, `TYPVOIE`, `LIBVOIE`, `CADR`, `CODPOS`, `LONGITUDE`, `LATITUDE` (`QUALITE_XY` et `TR_DIST_PRECISION` valent `_U`).
- Conservés pour ces 14 lignes : commune, département, région, `APET`, `DCIRIS` (code de la commune quand l'IRIS est inconnu), `EPCI`, `UU2020`, `STATUT_DIFFUSION`.

Ces 14 lignes n'ont pas de coordonnées : elles n'entrent pas dans un traitement géographique.

## Empreintes SHA-256

```
e7c5f0f30c1034a8a18c9dd10e348dc9ea744c6b9ae887dd197ea88be0896580  bpe25_B104_v2.csv
b17571f84ee6a59ef8c5a5b71774ece6d721da72fdc90fa7b555ad27e9ce77cf  bpe25_B104_v2.parquet
```

CSV : séparateur virgule, UTF-8, en-tête, chaînes entre guillemets, coordonnées manquantes en champ vide.
