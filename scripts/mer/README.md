# Vérité littorale (FUT-33) : construction hors produit

Rien ici n'est branché à futur•e. Ces scripts construisent et mesurent la distance à la mer pour décider des
règles produit (rapport : `docs/audits/2026-10-02-fut33-phase1-mesures-littorales.md`).

## Dépendances

Python 3.12+ dans un environnement dédié (hors dépôt) :

```
python3 -m venv ~/futuree-fut33/venv
~/futuree-fut33/venv/bin/pip install "shapely>=2.0" pyproj pyogrio py7zr numpy
```

`pyogrio` embarque GDAL (lecture Shapefile, GeoPackage, GeoJSON gzip) ; `shapely` 2 fait les opérations
géométriques (index STRtree, distances exactes) ; `pyproj` projette en Lambert 93 (EPSG:2154, mètres). Aucun
calcul ne se fait en degrés.

## Sources (téléchargées hors dépôt)

| Source | URL | Poids |
|---|---|---|
| Limite terre-mer Shom-IGN 2021, France métropolitaine | https://services.data.shom.fr/INSPIRE/telechargement/prepackageGroup/LIMTM_PACK_DL/prepackage/Limite_terre_mer_France_metropolitaine/file/Limite_terre_mer_France_metropolitaine.7z | 255 Mo (7z), 1 Go décompressé |
| Contours communaux Etalab (ADMIN EXPRESS), 2026, simplifiés 5 m | https://etalab-datasets.geo.data.gouv.fr/contours-administratifs/2026/geojson/communes-5m.geojson.gz | 90 Mo |
| Communes loi Littoral, DGALN, COG 2022 | https://www.data.gouv.fr/fr/datasets/r/5da30edb-2854-47c6-9537-192ee9ca2a70 | 65 Ko |
| Planification maritime DGAMPA-Shom (façades) | https://services.data.shom.fr/INSPIRE/telechargement/prepackageGroup/PLANIFICATION_MARITIME_PACK_DL/prepackage/PLANIFICATION_MARITIME_PACK/file/PLANIFICATION_MARITIME_PACK.7z | 709 Mo |

## Étapes

```
D=~/futuree-fut33
python build_mer.py --limtm $D/sources/limtm --contours $D/sources/communes-5m-2026.geojson.gz \
  --loi-littoral $D/loi-littoral.xlsx --index data/comparateur-index.json.gz --out $D/out   # ~9 min
python rapport_mer.py --out $D/out            # chiffres + fixture des cas de référence
python lagunes_b.py --limtm $D/sources/limtm --index data/comparateur-index.json.gz \
  --contours $D/sources/communes-5m-2026.geojson.gz --rivage $D/out/rivage-marin.wkb --out $D/out/lagunes.json
python adresse_proto.py --rivage $D/out/rivage-marin.wkb --out $D/out/adresse.json
python facades_test.py --planif $D/sources/planif/PLANIFICATION_MARITIME_PACK --out $D/out
# phase 1.5 : sécurisation
python build_mer.py --limtm $D/sources/limtm --contours x --loi-littoral x --index x --out /tmp/x --sauver-etat $D/etat.pkl
python audit_ltm.py --etat $D/etat.pkl --index data/comparateur-index.json.gz --out $D/out/audit-ltm.json
python divergences.py --etat $D/etat.pkl --contours $D/sources/communes-5m-2026.geojson.gz --out $D/out
python export_node.py --rivage $D/out/rivage-marin.wkb --out $D/node     # (depuis scripts/mer)
node scripts/mer/adresse-node.mjs $D/node                                 # prototype adresse (phase 1.5)
# phase 2A : publication dans le dépôt, puis injection dans l'index
python publier_mer.py --out $D/out --dest ../../data/mer
# phase 2B.2 D : façade officielle des communes classées « Mer » (colonne mer_facade)
python facades_communes.py --planif $D/sources/planif/PLANIFICATION_MARITIME_PACK --rivage $D/out/rivage-marin.wkb --dest ../../data/mer
node scripts/mer/injecter-index.mjs                                        # (racine du dépôt) ajoute mer_*, retire distance_cote_km
# phase 2B.2 C : distances de référence des adresses de test
python reference_adresses.py --rivage $D/out/rivage-marin.wkb --out fixtures/adresses-test-2b2c.json
```

Seules de petites fixtures sont versionnées (`fixtures/`, moins de 100 Ko) ; elles sont relues par
`src/lib/fut33-mer-pipeline.test.ts` et `src/lib/fut33-mer-securisation.test.ts`.

## Attribution

« Limite terre-mer © Shom-IGN, 2021, http://dx.doi.org/10.17183/LIMTM » (descriptif Shom, §5.3), avec l'indication
des limites d'usage. Le descriptif demande aussi, sur un site, les logos du Shom et de l'IGN : le porteur a décidé
le 02/10/2026 que la mention suffit (risque connu). Façades : « DGAMPA-Shom, 2026. Planification maritime.
https://dx.doi.org/10.17183/MSP » (Licence Ouverte 2.0).
