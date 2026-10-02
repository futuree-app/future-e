# Vérité littorale (FUT-33, phase 1) : construction hors produit

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
```

Seule la fixture `fixtures/cas-reference.json` (cas de test, quelques Ko) est versionnée ; elle est relue par
`src/lib/fut33-mer-pipeline.test.ts`.

## Attribution obligatoire

« © Shom-IGN, 2021, http://dx.doi.org/10.17183/LIMTM » (descriptif Shom, §5.3), avec l'indication des limites
d'usage et, sur un site, les logos du Shom et de l'IGN liés à shom.fr et ign.fr.
