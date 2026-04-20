# Supabase

Scripts SQL de base pour `futur•e`.

Ordre recommandé :

1. Ouvrir `Supabase > SQL Editor`
2. Copier-coller le contenu de `01_init_catalog.sql`
3. Lancer le script
4. Copier-coller le contenu de `02_init_qna.sql`
5. Lancer le script
6. Copier-coller le contenu de `03_init_indicators.sql`
7. Lancer le script
8. Vérifier que les tables `tensions_catalog`, `commune_categories`, `communes_categorization`, `tension_answers`, `source_datasets`, `indicator_definitions`, `drias_grid_points` et `commune_indicators` existent

`01_init_catalog.sql` sert à sortir le catalogue et les communes de démo du code front.
`02_init_qna.sql` sert à sortir les réponses Q&R de démo du code front.
`03_init_indicators.sql` crée une couche de données normalisée pour brancher DRIAS puis d'autres sources.

Import DRIAS recommandé :

1. Préparer un CSV de communes géolocalisées avec les colonnes `insee_code,commune_name,latitude,longitude`
2. Depuis `Desktop/Futur·e/Data-test`, lancer :
   `npm run drias:sql -- --communes <communes.csv> --out drias-import.sql`
3. Coller le SQL généré dans `Supabase > SQL Editor`
