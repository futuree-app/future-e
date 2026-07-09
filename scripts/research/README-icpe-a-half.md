# Sonde ICPE A1/2

Outil de recherche data pour mesurer le potentiel de la couche A1/2 du Fil futur-e a partir des ICPE Georisques.

Le script repond a deux questions :

- combien de nouveaux evenements ICPE apparaissent par commune et par an ;
- si les mises en demeure / arretes sont assez visibles dans `documentsHorsInspection` pour servir de filet officiel.

Cette v1 ne lit jamais les PDF. Elle mesure le filet structure expose par l'API, pas la qualification editoriale. Un evenement brut reste distinct d'un evenement a relire humainement (`review_hint`).

## Commandes

```bash
node scripts/research/icpe-a-half-crawl.mjs \
  --insee 17300,31555,13055,06088,44109 \
  --since 2025-07-09 \
  --out tmp/icpe-a-half.json
```

```bash
node scripts/research/icpe-a-half-crawl.mjs \
  --file scripts/research/communes.txt \
  --since 2025-07-09 \
  --out tmp/icpe-a-half.json \
  --limit 50
```

Verification syntaxique :

```bash
node --check scripts/research/icpe-a-half-crawl.mjs
```

## Sorties

`--out` ecrit un JSON detaille et un CSV resume au meme emplacement, avec l'extension `.csv`.

Mesures principales par commune :

- `nb_installations`
- `inspections_12m`
- `documents_hors_inspection_12m`
- `documents_mise_en_demeure_12m`
- `review_hint_count`
- `inspections_with_formal_followup_hint`
- `formal_doc_found_nearby`
- `formal_doc_missing_or_ambiguous`
- `events_by_year`

En cas d'erreur reseau ou de 429 persistant, `fetch_status` passe a `partial_or_failed` et les compteurs sont `null`, pour ne jamais confondre un fetch echoue avec une absence d'evenement.
