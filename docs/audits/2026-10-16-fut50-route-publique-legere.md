# FUT-50 · Une lecture publique légère pour l'accueil

16 octobre 2026 · branche `feat/fut-50-socleom-integration` (départ `9b5cad8f`).

**Hors périmètre** :
- aucune PR, fusion, prévisualisation ni déploiement ; aucune écriture en base ;
- l'accueil public actuel n'est pas remplacé ;
- FUT-105, FUT-106, FUT-107 et FUT-108 ne sont pas touchés.

## 1. Architecture retenue

**Un service, deux jeux de sources, les mêmes règles.**

```
/api/accueil/commune      ┐                                      ┌─ sourcesLegeres  : src/data/accueil-communes.json (2,7 Mo)
/api/accueil/lecture      ├─► src/lib/accueil/lecture-accueil.ts ┤                    src/data/apercu-climat-communes.json (4,4 Mo)
/dev/fut50/api/commune    │   (identité, intrants, lecture,      └─ sourcesCompletes : index du comparateur, data_climat.json,
/dev/fut50/api/lecture    ┘    politique de cache)                                     buildCommuneDossier (preuves et mesure « avant »)
                                       │
                                       ├─ dossierDepuisFaits (territory-facts.ts) : LES règles du dossier payant
                                       ├─ buildClimatFacts / classifyClimateComfort : LA classification de la chaleur
                                       ├─ @/lib/outremer : COG et SocleOM (chemin ultramarin distinct)
                                       └─ gaspar-accueil.ts : GASPAR en 3 s, panne distinguée
```

- **Les fichiers légers portent des intrants, jamais des résultats.** Les verdicts sortent toujours des règles du moteur, rappelées à la demande.
- **Les sources légères ne chargent jamais l'index du comparateur ni `data_climat.json`.** Les sources complètes ne sont chargées que par import dynamique, pour les preuves et la mesure « avant ».
- **Les routes de développement et publiques partagent le même service.** Le prototype voit exactement ce que verra l'accueil.

### Alternatives écartées

| Alternative | Pourquoi écartée |
| --- | --- |
| Stocker les verdicts précalculés | Ce serait un second moteur figé : une règle qui change ne se verrait pas. |
| Un second extrait climatique dédié à l'accueil | L'extrait de l'aperçu du paywall (FUT-30, même problème, même format, empreinte vérifiée) existait déjà : il est étendu de 4 colonnes. Un seul extrait. |
| Réécrire les règles « taille » et « hivers » pour l'accueil | Duplication métier. Les règles du dossier sont rappelées sur des faits reconstitués. |
| Lire les fichiers légers par `readFile` | Chemin à déclarer au traçage. L'`import` JSON les empaquette avec la fonction, comme l'aperçu. |
| Cache serveur (`use cache`) | `cacheComponents` n'est pas activé dans le projet. Le CDN, par en-têtes, suffit et ne touche pas la configuration globale. |

## 2. Les fichiers générés

| Fichier | Taille | Contenu | Provenance |
| --- | --- | --- | --- |
| `src/data/accueil-communes.json` (nouveau) | 2,7 Mo | Pour les 34 788 communes de l'index : nom, département, coordonnées, unité urbaine, population, **taille résolue et sa provenance** (`tailleVilleResolvedOf` : population de l'unité urbaine, sinon de la commune), **bande de rang « douceur des hivers »** | `data/comparateur-index.json.gz` (sha256 inscrit dans le fichier), par `getCommuneEntry` et `tailleVilleResolvedOf` |
| `src/data/apercu-climat-communes.json` (étendu) | 4,4 Mo (contre 2,6 Mo) | 10 colonnes DRIAS × 3 horizons. **Ajouts** : `NORTX30D_yr`, `ATX30D_yr` (bascule 30 °C), `NORTMm_seas_DJF`, `ATMm_seas_DJF` (hiver) | `data/data_climat.json` (sha256 inscrit), par la table de colonnes de `drias-json.ts` |

**Colonnes établies par le code, pas choisies** :
- la chaleur lit `buildClimatFacts`, à savoir les jours au-dessus de 35 °C et les nuits tropicales, avec valeur et écart ;
- la bascule lit `NORTX30D_yr` et `ATX30D_yr` ;
- l'hiver lit `construireFaitsCommune`, avec `NORTMm_seas_DJF` et `ATMm_seas_DJF` ;
- la référence 1976-2005 se reconstruit avec `reconstructReference`, médiane des trois horizons : les trois horizons sont donc gardés.

**Outre-mer** : il n'est dans aucun de ces fichiers. Il garde son propre référentiel : COG, SocleOM, seuils territoriaux, référence 1991-2020 et motifs des 36 entités non couvertes.

## 3. Régénération et contrôle

| Commande | Effet |
| --- | --- |
| `npm run accueil:verifier` | Reconstruit en mémoire et compare octet pour octet, **sans rien écrire**. Échoue si l'index ou DRIAS ont changé depuis la génération, si un fichier a été modifié à la main, ou en cas d'effectif faux, de doublon, de code 97/98, de valeur non finie, d'extrait sans les colonnes de l'accueil, ou de commune absente de l'extrait. Environ 6 s. |
| `npm run accueil:generer` | Régénère `src/data/accueil-communes.json`. Ensuite, relire le diff. |
| `node scripts/build-apercu-climat.mjs` | Régénère l'extrait climatique (inchangé depuis FUT-30), après un changement de `data_climat.json`. |
| `npm run build` | `prebuild` lance `index-verify` **puis `accueil:verifier`** : un fichier périmé ne peut pas partir en production. |
| `node scripts/accueil/verifier-equivalence.mjs [--reseau]` | Preuve d'équivalence exhaustive (§ 5), environ 80 s. |

Les tests (`src/lib/accueil/accueil-public.test.ts`, `src/lib/apercu-territoire.test.ts`) vérifient aussi l'empreinte des sources : un fichier désynchronisé fait échouer la suite.

## 4. Fonctions métier partagées avec le moteur

| Fonction | Rôle | Changement |
| --- | --- | --- |
| `dossierDepuisFaits` (`territory-facts.ts`) | La partie pure de `buildCommuneDossier` (projet effectif, contexte des contraintes, `runRules`, assemblage), extraite telle quelle | Le dossier payant l'appelle toujours ; l'accueil aussi. Aucune règle modifiée. |
| `annuaireNecessaire` (`hard-constraints-hydrate.ts`) | `buildHardContext` ne charge plus l'annuaire (l'index complet) que si une contrainte le lit (« près de… », « hors de… », taille relative) | Les mêmes trois conditions que les gardes `&& dir` existantes : sans elles, l'hydratation est identique. |
| `projetDeTest` | Déplacé de `src/app/dev/fut87/` vers `src/lib/decision/projet-de-test.ts` (réexporté à l'ancien chemin) | Code identique. |
| `mapCommuneToModuleFacts`, `buildClimatFacts`, `classifyClimateComfort`, `classifyAgglomerationSize`, `categoryStatementFragment`, `reconstructReference`, `construireFaitsCommune`, `scenariosDepuisExtrait` | Réutilisées sans changement | — |

**Champs lus par les deux règles** : `eviter_grandes_villes` lit la taille et sa provenance ; `douceur_climat` lit le rang de douceur. Aucune des deux ne lit les intrants réseau du dossier (feu déclaré Géorisques, radon) ni les scores : vérifié dans leur code.

## 5. Preuves d'équivalence

**Comparaison exhaustive hors réseau** (`verifier-equivalence.mjs`), sur 34 791 codes (les 34 788 communes, plus Paris, Lyon et Marseille).
- **Référence** : moteur complet, avec l'entrée complète de l'index, `data_climat.json` et `dossierDepuisFaits`.
- **Intrants réseau** : Géorisques et radon valent `null`, comme lors d'une panne réelle.

| Contrôle | Identiques | Répartition |
| --- | --- | --- |
| Identité (nom canonique) | 34 791 / 34 791 | — |
| Intrants chaleur (verdict, valeurs, références, seuils, 30 °C) | 34 791 / 34 791 | sous les seuils 29 327 · défavorable 5 464 |
| Intrants « Petite ville » (issue, phrase, taille, provenance) | 34 791 / 34 791 | favorable 31 496 · mismatch 2 085 · indéterminé 1 193 · absent 17 |
| Intrants « Hivers doux » (issue, phrase, limite, température de référence) | 34 791 / 34 791 | indéterminé 21 253 · mismatch 6 799 · favorable 6 736 · absent 3 |
| **Lectures rendues** (texte, mesures, méthode, sources, durabilité) | **104 373 / 104 373** | — |

**Panel en ligne**, avec le vrai `buildCommuneDossier`, Géorisques et radon compris : **24/24 identiques**. Le panel couvre Nîmes, La Rochelle, Nantes, Annecy, Guéret, Ajaccio, Paris 11e, Lyon 1er, Marseille 1er, Paris, Vannes et Briançon, sur la taille et l'hiver.

**Non comparé exhaustivement** :
- les risques (GASPAR, réseau). Le chemin est inchangé, hormis le délai ; il est couvert par des tests de comportement (§ 8) ;
- l'outre-mer, dont le chemin est inchangé (COG, SocleOM).

## 6. Routes publiques

| Route | Paramètres | Réponses |
| --- | --- | --- |
| `GET /api/accueil/commune` | `insee` | 200 `{ insee, nom }` · 400 `requete_invalide` · 404 `commune_inconnue` |
| `GET /api/accueil/lecture` | `insee`, `cle` ∈ `chaleur, hivers, taille, risques, voiture` | 200 `{ lecture }` (même contrat que le prototype) · 400 · 404 |

**Pourquoi `/api/accueil/*`** : le projet range ses routes de lecture sous `/api/<domaine>` (`/api/territoire`, `/api/landing-signals`…), et l'accueil devient un domaine. La région est celle du projet (`vercel.json` : `cdg1`), aucune configuration n'est ajoutée.

**Ce que les routes garantissent** :
- validation stricte du code et de la priorité ;
- identité résolue côté serveur : outre-mer par le COG, puis Paris/Lyon/Marseille, puis le fichier léger ;
- le nom envoyé par le navigateur n'est jamais lu ;
- aucun compte, aucune IA, aucun paiement, aucun dossier complet (testé par lecture du code).

**Le prototype** `/dev/fut50/c` fonctionne toujours, par les routes de développement (404 en production), branchées sur le même service.

## 7. Politique de cache et comportement réel

| Situation | `Cache-Control` | Raison |
| --- | --- | --- |
| Lecture tirée de données publiées, y compris une indisponibilité **structurelle** (hors couverture GASPAR, critère non défini outre-mer, chaleur ultramarine non couverte) | `public, max-age=0, s-maxage=86400, stale-while-revalidate=86400` | déterministe, commune à tous les visiteurs |
| **Panne GASPAR** (délai, 4xx/5xx, réponse illisible), même en HTTP 200 | `no-store` | une panne n'est jamais servie durablement |
| Commune inconnue (404) | `public, max-age=0, s-maxage=3600` | structurelle, mais courte |
| Requête invalide (400) | `no-store` | |
| Paramètre superflu (par exemple `commune=…`) | `no-store` | une variante d'URL ne fragmente pas le cache |

**Vérifié sur un build de production local** (`banc-production.mjs`) : les 9 cas d'en-tête sont conformes, et l'en-tête `X-Accueil-Cache` donne la raison.
- La variation du cache se fait par l'URL, réduite à `insee` et `cle` ; le client du prototype n'envoie plus que ces deux paramètres.
- Aucune donnée personnelle dans les réponses.

**Renouvellement après une correction** :
- les données sont empaquetées, elles ne changent donc qu'avec un déploiement ;
- le cache CDN de Vercel est propre à chaque déploiement : **à vérifier sur Vercel** (§ 14) ;
- la fenêtre « stale » ne joue qu'à l'intérieur d'un même déploiement.

## 8. GASPAR : délai de 3 s

**Mesures réelles depuis une IP française** (`mesurer-gaspar.mjs`, 40 appels) : p50 53 ms, p90 83 ms, **p95 147 ms**, maximum 161 ms, 0 panne. Le délai de 3 s représente environ 20 fois le p95.

**Coût d'une panne** : 3 005 ms (serveur muet). La lecture dit « Donnée indisponible », jamais « aucun risque », et n'est pas mise en cache. Chaque visiteur paie donc ces 3 s tant que dure la panne.
- **Piste, non appliquée** : 1 à 1,5 s, après mesure sur Vercel.

**Tests sans réseau, contre un faux serveur** :

| Cas | Résultat |
| --- | --- |
| Réponse normale | risques lus, `panne=false` |
| Vide valide (`data: []`) | `[]`, `panne=false` |
| 404 | `panne=true` |
| 500 | `panne=true` |
| JSON malformé | `panne=true` |
| Réponse incomplète (`risques_detail` absent) | `panne=true` |
| Délai dépassé | rendu en environ 300 ms pour un délai de 300 ms, `risques=null` |

**Inchangés** : la classification par code (naturel, technologique, minier, autre) et la couverture ultramarine (codes 98 hors GASPAR, durable). `getGeorisquesSummary` (dossiers payants) n'est pas modifiée.

## 9. Annulation et concurrence

**Client du prototype** :
- un `AbortController` par lecture en cours (code × priorité), et un pour la confirmation d'identité ;
- **changer de commune** interrompt les requêtes des autres communes ;
- **reprendre la saisie** ou cliquer « Changer de commune » interrompt tout ;
- **démonter le composant** interrompt tout ;
- **deux priorités de la même commune** ne s'annulent pas : une lecture en cours est réutilisée ;
- **une requête annulée** n'affiche jamais d'erreur.

**Banc navigateur** (`verifier-identite-navigateur.mjs`) : **13/13**.
- 9 cas d'identité et de désordre ;
- 0 annulation entre deux priorités de Nîmes ;
- changement pour La Rochelle : `30189:chaleur` et `30189:hivers` en `net::ERR_ABORTED` ;
- aucun nom ni chiffre de Nîmes affiché ensuite ;
- aucune requête de La Rochelle annulée.

**Serveur** : 30 lectures simultanées sur un serveur **neuf** donnent 30/30 justes, en 145 ms au total. Les chargeurs partagent une seule promesse (`memoizePromise`) et les JSON sont des modules : aucun double chargement.

## 10 et 11. Performances et mémoire, avant et après

### Processus Node isolés, même service, seules les sources changent (`mesurer-route-lecture.mjs`)

Le premier appel inclut le chargement des modules. La mémoire comprend environ 50 Mo dus à l'outil de chargement (jiti), dans les deux cas.

| Parcours | Avant : à froid | Avant : mémoire | Après : à froid | Après : mémoire | Appels réseau (avant → après) |
| --- | --- | --- | --- | --- | --- |
| Identité métropolitaine | 1 898 ms | +633 Mo | **312 ms** | **+97 Mo** | 0 → 0 |
| Chaleur métropolitaine | 2 596 ms | +912 Mo | **402 ms** | **+100 Mo** | 0 → 0 |
| Hivers doux | 2 465 ms | +935 Mo | **335 ms** | **+94 Mo** | **3 → 0** |
| Petite ville | 2 282 ms | +946 Mo | **360 ms** | **+89 Mo** | **3 → 0** |
| Risques | 1 776 ms | +609 Mo | **517 ms** | **+122 Mo** | 1 → 1 |
| Chaleur ultramarine couverte | — | — | 313 ms | +87 Mo | 0 |
| Chaleur ultramarine non couverte | — | — | 337 ms | +90 Mo | 0 |

**Fichiers de données ouverts** :
- **avant** : `comparateur-index.json.gz` (11 Mo, 67 Mo décompressés) et `data_climat.json` (60 Mo) ;
- **après** : les deux JSON légers (2,7 et 4,4 Mo) et les données ultramarines (1,4 Mo).

**À chaud** : « Hivers » et « Petite ville » passent de 50 à 60 ms à 1 ms. Les autres restent sous la milliseconde, hors réseau.

### Build de production local (`next start`, `banc-production.mjs`)

- **Premier appel sur un serveur neuf** : 29 à 46 ms ; risques 171 ms, GASPAR compris.
- **À chaud**, sur 27 communes dont 12 ultramarines : chaleur, hivers et taille p95 ≤ 6 ms ; identité p95 3 ms ; risques p95 96 ms.
- **Mémoire du serveur** : 277 à 329 Mo au repos, 391 Mo après toutes les lectures.
  - Next 16 **précharge au démarrage** les modules de toutes les pages (documentation, *Memory usage*, `preloadEntriesOnStart`) : le coût des JSON de l'accueil est compris dans la mémoire au repos.
  - L'ancienne route n'existant pas en production (404), sa comparaison au même niveau n'est possible qu'en processus isolés, ci-dessus.

**Gain réel, pas un cache réchauffé** :
- chaque mesure « à froid » part d'un processus ou d'un serveur neuf ;
- la sonde de démarrage du banc lit `/robots.txt` : un premier essai sondait la route elle-même, et les chiffres en étaient faussés.

## 12. Résultats des tests

| Vérification | Résultat |
| --- | --- |
| Suite complète | **2 676 / 2 676** (dont 10 nouveaux, plus FUT-50, FUT-104 et l'aperçu) |
| `tsc`, `eslint` (fichiers touchés) | OK |
| `next build --webpack`, `prebuild` compris (vérification des données) | OK |
| Équivalence exhaustive | 104 373 / 104 373 lectures ; panel en ligne 24/24 |
| Banc de production (`banc-production.mjs`) | conforme : en-têtes, nom falsifié, identité, concurrence, 404 des fichiers internes et du prototype |
| Bancs du prototype | identité HTTP 45/45, navigateur 13/13, clavier, mouvement réduit et viewports 40/40 |

**Tests qui échouent si…** (`accueil-public.test.ts`) :
- un fichier dérivé n'est plus synchronisé ;
- l'outre-mer passe par la métropole ;
- une absence devient 0 ;
- une commune inconnue est acceptée (banc) ;
- un nom falsifié devient officiel (banc) ;
- une panne GASPAR devient durable ;
- un fichier interne est exposé ;
- une route publique appelle le moteur complet ;
- des lignes DRIAS ultramarines réapparaissent ;
- un artefact manque au build (import, donc échec de compilation).

## 13. Limites et risques résiduels

- **Trois communes de taille 0** (60694 Les Hauts-Talican, 85165 L'Oie, 85212 Sainte-Florence) : population de 0 dans l'**index lui-même**, recopiée fidèlement. Probablement d'anciennes communes déléguées. À traiter dans l'index, hors FUT-50.
- **Taille des bundles** : l'extrait climatique passe de 2,6 à 4,4 Mo, et l'aperçu du paywall l'embarque aussi. Coût mesuré en mémoire au repos, à suivre sur Vercel.
- **Modules de mise en forme** (`pastilles.ts`, `outremer.ts`) : ils restent sous `src/components/prototypes/fut50/c/`, et le service public les importe de là. Les déplacer sous `src/lib/accueil/` fait partie de l'intégration définitive.
- **Délai GASPAR** : une panne coûte 3 s à chaque visiteur (non mise en cache). Une valeur plus basse est défendable : à décider après les mesures Vercel.
- **Panne GASPAR sur le build de production** : non simulée localement (aucun point d'injection en production). Elle est prouvée au niveau du service et de la politique de cache.
- **Mémoire réelle d'une fonction Vercel** : inconnue tant qu'elle n'est pas mesurée en préproduction.

## 14. Protocole de validation Vercel

Aucun déploiement n'a été fait : la prévisualisation demande ton accord.

1. **Prévisualisation de la branche.** Rappel : les variables Supabase sont réservées à la production, la prévisualisation est donc partiellement rouge. Les routes `/api/accueil/*` n'en dépendent pas.
2. **À froid** : premier appel de chaque route après le déploiement (8 parcours de `banc-production.mjs`). Relever `x-vercel-id`, la durée et la mémoire maximale dans *Observability → Functions*.
3. **À chaud et CDN** : 200 requêtes (10 communes × 5 priorités × 4 passages). Relever `x-vercel-cache` (`MISS` puis `HIT`), le p50 et le p95 hors cache, puis en cache.
4. **Pannes** : vérifier que `X-Accueil-Cache: indisponibilite_temporaire` n'est jamais suivi d'un `HIT`. Simuler la panne par un code GASPAR lent, ou relever une panne réelle.
5. **Nouveau déploiement** : après un redéploiement, `x-vercel-cache` repart à `MISS`. C'est la preuve qu'une correction n'est pas masquée par l'ancien cache.
6. **Métropole et outre-mer** : mêmes mesures sur 97411, 97209, 98735 et 98736. Vérifier la région (`cdg1`) et la réponse de Géorisques.
7. **Encore inconnus** : mémoire et durée réelles d'une instance froide sur Vercel, taux de `HIT`, comportement de `stale-while-revalidate` sur Vercel.

## 15. Étapes restantes avant l'accueil définitif

1. Décision sur la prévisualisation, puis le protocole du § 14.
2. Déplacer `pastilles.ts` et `outremer.ts` sous `src/lib/accueil/` ; brancher la version C de production sur `/api/accueil/*`.
3. Fusionner dans l'ordre : hotfix P0 FUT-104 (toujours non déployé), consolidation FUT-104, puis FUT-50.
4. FUT-106 et FUT-107 (dossiers payants et doctrine ultramarine) avant toute ouverture ultramarine ; FUT-108 avant le lancement.
5. Corriger dans l'index la population des trois communes déléguées (hors FUT-50).
