# future-e

Site de futur•e.

## Développement local

```bash
npm install
npm run dev
```

Puis ouvrir `http://localhost:3000`.

## DRIAS

### Fonctionnement actuel

Le fonctionnement du site n'a pas changé côté application.

Le site lit toujours `public/data_climat.json` via [src/lib/drias-json.ts](/Users/quentinbrache/Desktop/Futur·e/src/lib/drias-json.ts).

Autrement dit :

- les routes et composants continuent de consommer un fichier JSON local
- Next.js ne lit pas directement les fichiers `.txt` DRIAS
- Next.js ne lit pas directement un fichier `.parquet`

Ce qui a changé, c'est uniquement la manière de **générer** `public/data_climat.json`.

### Source actuellement utilisée

`public/data_climat.json` est désormais généré à partir des 17 modèles DRIAS présents dans `data/source`, pour les 3 scénarios :

- `gwl15`
- `gwl20`
- `gwl30`

Le script calcule, pour chaque `commune x scénario x indicateur`, la **médiane inter-modèles**.

Le rattachement géographique reste le même principe qu'avant :

- on part des coordonnées communales dans `data/communes-france-coords.csv`
- on rattache chaque commune au point DRIAS le plus proche
- on produit ensuite une ligne par `commune x scénario`

### Script de génération

Le script de génération est :

- [scripts/build-drias-median.js](/Users/quentinbrache/Desktop/Futur·e/scripts/build-drias-median.js)

Il :

1. lit les 51 fichiers DRIAS de `data/source`
2. détecte le modèle et le scénario depuis les métadonnées du fichier
3. parse les 28 indicateurs annuels
4. rattache chaque commune au point DRIAS le plus proche
5. calcule la médiane sur les 17 modèles
6. réécrit `public/data_climat.json`
7. écrit un méta-fichier de contrôle dans `data/drias_median_metadata.json`

### Régénérer le dataset

```bash
node scripts/build-drias-median.js
```

Sorties générées :

- `public/data_climat.json`
- `data/drias_median_metadata.json`

### Important

- Le site utilise bien la médiane des 17 modèles **uniquement si** `public/data_climat.json` a été régénéré avec ce script.
- Le `.parquet` n'est pas encore la source lue en runtime par le site.
- Si on veut un export compressé de référence en plus du JSON, il faut ajouter une étape dédiée pour produire un nouveau `.parquet` médian.

## Variables d'environnement

Le projet utilise actuellement :

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `ANTHROPIC_API_KEY` pour l'étape 10 du module Q&R
- `ANTHROPIC_MODEL` optionnel, sinon `claude-sonnet-4-6`
- `GEORISQUES_API_TOKEN` optionnel, côté serveur uniquement, pour activer les endpoints Géorisques `v2`

## Géorisques

### État actuel

Le projet utilise deux modes d'accès :

- `v1` sans jeton pour les résumés communaux
- `v2` avec jeton Bearer pour les lectures au point géocodé utiles au module logement

Résumé :

- [src/lib/georisques.ts](/Users/quentinbrache/Desktop/Futur·e/src/lib/georisques.ts) gère les deux couches
- `getGeorisquesSummary(insee)` = lecture communale `v1`
- `getGeorisquesAddressSummary(latitude, longitude)` = lecture `v2` au point géocodé, si `GEORISQUES_API_TOKEN` est défini

### Configuration du jeton v2

Ajouter dans `.env.local` côté serveur :

```bash
GEORISQUES_API_TOKEN=...
```

Ne jamais exposer ce jeton dans du code client ni dans une variable `NEXT_PUBLIC_*`.

### Endpoint logement

Le projet expose :

- `/api/georisques-logement?q=12 rue de la paix paris`

Cette route :

1. géocode l'adresse via BAN
2. tente de résoudre une parcelle cadastrale via API Carto
3. retourne toujours un résumé communal Géorisques
4. retourne aussi une lecture `v2` au point géocodé si `GEORISQUES_API_TOKEN` est configuré
5. retourne une lecture `v2` par parcelle si la parcelle a pu être résolue

### Limites actuelles

- la lecture `v2` actuelle couvre le **point géocodé** et, quand possible, la **parcelle cadastrale**
- la lecture **ERRIAL complète** n'est pas encore intégrée comme restitution finale
- certaines couches retournent des signaux réglementaires ou territoriaux, mais pas encore un diagnostic complet de transaction immobilière
