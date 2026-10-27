# FUT-82 · Preuves reproductibles

Toutes les mesures ont été prises le **27/10/2026**, en lecture seule, depuis un poste en France
(Géorisques ne répond qu'aux adresses IP françaises). Les scripts n'ont **aucune dépendance** (Node 22+,
`curl` et `unzip` du système). Ils se lancent depuis la racine du dépôt.

## Les échantillons

| Fichier | Contenu | Comment il est construit |
|---|---|---|
| `echantillon.json` | 45 points : 33 adresses **ciblées** (cas d'usage écrits avant la mesure : aéroports, Seveso, feux historiques, nappes, montagne, littoral, outre-mer) et 12 communes **tirées** (graine 82) | Géocodage Géoplateforme ; repli explicite (`repli: "search citycode"`) quand aucune adresse n'est proche du point tiré |
| `discrimination-logements.json` | 200 adresses de logements diagnostiqués dans 100 communes tirées au prorata de la population (graine 8282) | DPE existants ADEME, espacés dans le fichier ; seuls le code commune et les résultats sont conservés (pas les adresses) |

Ni l'un ni l'autre n'est représentatif de la France. Le premier montre ce qu'une source dit quand le cas
existe ; le second donne un ordre de grandeur de la part de logements qu'elle signale.

## Rejouer

```bash
# 1. Échantillon (≈ 1 min)
node scripts/research/fut82/echantillon.mjs

# 2. Sondes au point sur les 45 points (≈ 10 min ; Géorisques, BRGM, Hub'Eau, Géoplateforme, FCU, PVGIS)
node scripts/research/fut82/sondes-adresses.mjs
node scripts/research/fut82/sondes-adresses.mjs --seul villeneuve-le-roi-orly   # un seul point

# 3. Part de logements signalés (≈ 15 min, 200 adresses)
node scripts/research/fut82/discrimination-logements.mjs --communes 100 --par-commune 2
node scripts/research/fut82/discrimination-logements.mjs --recalcul <json existant>  # sans réseau

# 4. IREP : registre officiel 2024 contre l'extrait ADEME 2019 (zip de 7,5 Mo en dossier temporaire)
node scripts/research/fut82/irep-2024.mjs [--annee 2024] [--tmp <dossier>]

# 5. BDIFF 2006-2025, feux de forêt (20 exports, pause de 3 s ; agrégat complet hors dépôt)
node scripts/research/fut82/bdiff-export.mjs [--de 2006] [--a 2025] [--tmp <dossier>]

# 6. Contre-épreuves : stabilité au voisinage, cohérence ADEME/BDIFF
node scripts/research/fut82/contre-epreuves.mjs --bdiff <dossier tmp>/bdiff-communes-complet.json

# 7. POC de lecture : PEB/PGS, débroussaillement, nappe, avec la chaîne fait → limites → vérification
node scripts/research/fut82/poc-zones-reglementaires.mjs --adresse "12 Avenue de la République 94290 Villeneuve-le-Roi"
node scripts/research/fut82/poc-zones-reglementaires.mjs --lat 44.63 --lon -1.19 --json
```

Inventaire du code (niveaux d'intégration de chaque source) :

```bash
for lib in irep cartofriches gissol pollen baignade vigieau eaufrance atmo radon icu zfe renovation rge; do
  grep -rlE "[\"'/]${lib}(\.ts)?[\"']" src --include='*.ts' --include='*.tsx' | grep -v '\.test\.' | grep -v "^src/lib/${lib}.ts$"
done
```

## Ce que contient chaque fichier

| Fichier | Contenu | Volume |
|---|---|---|
| `sondes-adresses.json` | Par point : rapport Géorisques, nappe BRGM (classe, fiabilités, masques), piézométrie, PEB, PGS, LCZ, 12 couches de protection, lignes HTB, débroussaillement, potentiel solaire du bâti, IRVE, FCU, CBS (Ardennes), PVGIS ; latences agrégées ; échecs | 168 Ko |
| `discrimination-logements.json` | Parts de logements signalés par candidate (nappes, Natura 2000, PNR, parc national, ZNIEFF, lignes à 100/300 m, OLD, PEB, FCU) + points bruts sans adresse | 80 Ko |
| `irep-2024.json` | Volumes du registre officiel, part « sous le seuil », polluants les plus déclarés, comparaison à 5 km avec l'extrait ADEME pour 41 points, et la page publique `PollutionLookup` rejouée (10 km du centre de commune) pour 38 communes | 24 Ko |
| `bdiff-communes.json` | Totaux 2006-2025, série annuelle, couverture nationale ; communes de l'échantillon seulement (licence de l'export à arbitrer, dépôt public) | 5 Ko |
| `contre-epreuves.json` | Stabilité à 25, 50, 100 m (18 points) ; champ ADEME « incendies » contre BDIFF (119 communes) | 24 Ko |

## Pièges techniques rencontrés (à reprendre dans toute intégration)

1. Projection native par couche (Patrinat en EPSG:3857, OLD et solaire en EPSG:2154) : un filtre CQL dans
   la mauvaise projection rend « 0 » en HTTP 200.
2. Carte des nappes : WMS muet à grande échelle, tolérance de clic trompeuse, masques non interrogeables
   (exception servie en HTTP 200) : lecture WFS et point-dans-polygone.
3. Géorisques `resultats_rapport_risque` : connexions coupées (26/45 réponses).
4. BDIFF : chaîne TLS incomplète (Node refuse), filtre de type de feu implicite, Marseille en 13055,
   ligne d'avertissement supplémentaire avant 2023 dans l'export.
5. Le code de classe « ni débordement ni cave » de la carte des nappes est **0** (et non 3) : la première
   exécution de la mesure de discrimination l'avait mal compté, les parts ont été recalculées sans
   nouvel appel (`--recalcul`).
