# FUT-158 · Incident Géorisques : diagnostic, impact et correctif

28/10/2026 · branche `bonjourfuturee/fut-158-incident-georisques-verifier-et-corriger-les-appels-api-qui` · non fusionnée, non déployée.

## En une minute

- **L'incident est confirmé et reproduit.** Géorisques coupe la connexion (`ECONNRESET`, que `fetch` remonte en « fetch failed ») sur une partie des requêtes envoyées par le produit. Ce n'est ni une panne du fournisseur, ni un problème de DNS, de quota ou de jeton : la même requête aboutit dès qu'elle porte l'en-tête `Accept-Encoding: identity`.
- **Ce qui tombe dans le dossier payant :**
  - Géorisques au point d'adresse (risques recensés, plans de prévention au point, argile et sismicité au point) ;
  - Géorisques à la commune ;
  - les arrêtés CatNat ;
  - les cavités et les mouvements de terrain ;
  - le radon.
  - Seule la lecture à la parcelle (v2) répond encore.
- **Ce que voit le lecteur pendant l'incident :** des sources nommées « muettes » (« Géorisques (adresse) », « Géorisques (commune) ») et des cartes grisées. Aucune absence rassurante n'a été constatée. Les pages publiques `/inondation` et `/chaleur`, elles, **perdent leurs blocs GASPAR sans le dire**.
- **Dossiers touchés** (lecture seule de la base) :
  - 2 dossiers d'adresse du 24/10, enregistrés sans Géorisques à la commune ni au point ;
  - 4 dossiers de territoire, enregistrés sans risques recensés ni CatNat : 3 le 24/10 et 1 le 28/10 à 16 h 32.
  - Ceux du 26/10 sont complets. Aucun dossier d'adresse n'a été créé depuis.
- **Correctif :** un en-tête, partagé par tous les appels Géorisques ; une sonde qui teste enfin le chemin qui tombait ; une trace structurée de chaque échec. 54 appels réels sur 54 aboutissent, contre 18 échecs sur 18 avant.
- **GO pour déployer dès votre autorisation**, avec une vérification en production (§7).

## 1. Reproduction

### Production, le 28/10/2026 à 18 h 51

| Route | Ce qu'elle appelle | Réponse |
|---|---|---|
| `GET https://futur-e.fr/georisques?insee=57463` | GASPAR v1 et zonage sismique v1 | **500** `{"error":"fetch failed"}` |
| `GET https://futur-e.fr/api/sante/georisques` | cavités v1, argile v2 | 200, `disponible` |

La sonde restait verte parce qu'elle ne teste pas GASPAR.

### Local, en appels directs

Un processus Node neuf par appel, pour éviter que la réutilisation des connexions fausse la mesure. Les 9 chemins et paramètres sont ceux de `georisques.ts` (Metz). Les 2 domaines (`georisques.gouv.fr`, `www.georisques.gouv.fr`) sont testés. Matrices complètes : `2026-10-28-fut158-incident-georisques/matrice-avant.txt` et `matrice-apres.txt`. Scripts : `scripts/fut158/matrice.sh` et `un-appel.mjs`.

| Variante d'en-têtes | Résultat (9 chemins × 2 domaines) |
|---|---|
| En-têtes actuels (`Accept: application/json`, compression par défaut) | **18 échecs sur 18** |
| Sans `Accept` | 2 réussites sur 18 (zonage v2 seulement) |
| Sans `Accept`, User-Agent nommé | 12 sur 18. **GASPAR (par commune et au point) et zonage v1 échouent toujours** |
| `Accept` JSON + User-Agent nommé | 0 sur 18 |
| `Accept: */*` + User-Agent nommé | 2 sur 18 |
| **En-têtes actuels + `Accept-Encoding: identity`** | **54 sur 54** (3 répétitions) |

Isolement des en-têtes que `fetch` ajoute de lui-même (`accept-language`, `sec-fetch-mode`, `accept-encoding`) : seul `accept-encoding: identity` lève la coupure sur GASPAR et le zonage. `node:https` sans en-tête ajouté aboutit aussi.

`curl` reproduit la coupure indépendamment de Node : `-H "Accept: application/json"` seul coupe la connexion (code 92), et ajouter `-H "Accept-Encoding: identity"` la lève. La règle n'est pas documentée. C'est un filtrage du fournisseur sur certaines combinaisons d'en-têtes, que la requête sans compression traverse.

**Ce n'est pas** une panne du fournisseur (curl et la sonde répondent pendant l'incident), ni le DNS (les deux domaines résolvent), ni un quota (réponse immédiate, en environ 130 ms), ni le jeton v2 (la v2 répond avec ce même jeton dès que l'en-tête est corrigé).

### Sous Next.js, avant et après, avec le même code et la même adresse

Deux serveurs de développement : `main` (avant) et cette branche (après). Leur `fetch` est celui du framework, comme en production. Le comportement « avant » reproduit exactement la production : `/georisques` en 500, la sonde verte.

| Lecture | Avant | Après |
|---|---|---|
| `/georisques` sur 57463, 75056, 01001, 13055 | 500 « fetch failed » ×4 | 200 ×4 (Metz : 3 risques, sismicité 1) |
| Résumé au point (`getGeorisquesAddressSummary`) | échec | OK |
| Résumé à la parcelle (v2) | OK | OK |
| CatNat | échec | OK (Metz : 31 arrêtés, 1982-2024) |
| Cavités à 500 m | `null` (indisponible) | OK |
| Mouvements de terrain | `null` | OK |
| Radon | `null` | OK (classe 1) |
| GASPAR de l'accueil | OK | OK |

**Non vérifié depuis l'environnement Vercel** : y lancer une mesure demanderait un déploiement, que vous n'avez pas autorisé. La production montre le même symptôme sur la même route, et le serveur local reproduit à l'identique le contraste entre la sonde verte et `/georisques` en 500.

## 2. Impact réel sur les dossiers (lecture seule, sans identifiant)

La table `logement_report_versions` enregistre les sources muettes de chaque version (`sources_absentes`).

| Collecte | Versions | Sans Géorisques commune | Sans Géorisques au point |
|---|---:|---:|---:|
| 05/10, 11/10, 22/10 | 5 | 0 | 0 |
| **24/10** (13 h 39, 13 h 57) | **2** | **2** | **2** |
| 26/10 (21 h 58 – 22 h 02) | 3 | 0 | 0 |

Aucun dossier d'adresse n'a été créé après le 26/10.

Instantanés de territoire (`territory_facts_snapshot`) : les faits `risk.georisques` et `risk.catnat` sont « missing » dans **3 instantanés du 24/10** (le 4e de ce jour, à 13 h 42, est complet) et dans **celui du 28/10 à 16 h 32**. Ceux du 26/10 sont complets.

L'incident est donc **intermittent depuis au moins le 24/10, et continu le 28/10**.

**Ce que le lecteur de ces dossiers voit :**

- Logement : un bandeau qui nomme les sources muettes (« Géorisques (adresse) », « Géorisques (commune) »). L'argile et les plans de prévention restent établis par la parcelle, qui répondait. Les cavités et mouvements de terrain manquants sont « non vérifiés », jamais « rien trouvé ». Le lecteur peut actualiser son dossier une fois le correctif déployé : l'actualisation crée une nouvelle version sans toucher l'ancienne.
- Territoire : carte inondation grisée (« — »), carte CatNat sur la branche « relevé en panne ». Point à reprendre hors de ce ticket : le statut enregistré est `missing`, alors que VigiEau, dans le même cas, enregistre `source_unavailable`.
- Pages publiques `/inondation/[insee]` et `/chaleur/[insee]` : les blocs « Risques officiels reconnus » et « Ce que la commune a déjà vécu » **disparaissent sans message** (captures). C'est un défaut de présentation distinct, à ticketer : la page devrait dire « donnée indisponible ».

**Remédiation proposée, sans modification automatique de l'historique :**

- Les 2 dossiers d'adresse et les 4 instantanés de territoire ont été écrits avec des sources muettes nommées.
- Après déploiement, vous pouvez prévenir les titulaires et les inviter à actualiser, ou actualiser vous-même ces dossiers avec votre accord.
- Aucune version existante n'est réécrite.

## 3. Correctif (cause démontrée seulement)

| Fichier | Changement |
|---|---|
| `src/lib/georisques-http.ts` (nouveau) | `EN_TETES_GEORISQUES = { accept: "application/json", "accept-encoding": "identity" }`. Le commentaire porte la preuve. `tracerEchecGeorisques` écrit une ligne JSON `{"evenement":"georisques_echec","chemin":…,"statut":…,"erreur":…}`, sans jeton, sans paramètre ni coordonnée. |
| `src/lib/georisques.ts` | `fetchJson` (v1) et `fetchJsonV2` utilisent ces en-têtes et tracent chaque échec. Les états et les mises en cache sont inchangés : un échec n'est jamais mémorisé, une panne reste `null` ou une exception, jamais une liste vide. |
| `src/lib/radon.ts`, `src/lib/accueil/gaspar-accueil.ts` | Mêmes en-têtes. |
| `src/app/api/sante/georisques/route.ts` | La sonde envoie les en-têtes du produit et teste **aussi GASPAR v1 au point**, le chemin qui tombait. Réponse : `interfaces: { publique, risques, authentifiee }`. Le contrat du moniteur (200 / 503) est inchangé. |

Non modifié : le proxy SIS (`data.georisques.gouv.fr`, hôte inexistant), remplacé par la PR #109. Cette lib-là envoie un User-Agent sans `Accept` et fonctionne ; elle pourra adopter `EN_TETES_GEORISQUES` après fusion.

## 4. Tests

`src/lib/fut158-georisques-entetes.test.ts`, 8 tests. Le double de `fetch` **applique la règle du fournisseur** : il coupe toute requête sans `Accept-Encoding: identity`.

1. Toutes les lectures du dossier (commune, point, parcelle, CatNat, cavités, mouvements de terrain, radon, accueil) aboutissent sous cette règle. Chaque requête porte l'en-tête, et le jeton ne part que vers la v2.
2. Aucun fichier de production qui appelle l'API ne contourne les en-têtes partagés (analyse du code).
3. En panne réelle :
   - inventaires `null`, jamais `[]` ;
   - radon `null` ;
   - accueil `panne: true` ;
   - résumés en exception ;
   - un échec n'est pas mémorisé : la lecture suivante aboutit.
4. Les traces d'échec portent le chemin, le statut ou le code d'erreur, et jamais le jeton, les coordonnées, le code parcelle ou les paramètres.
5. La sonde passe en 503 quand GASPAR tombe seul ; elle est verte quand les trois interfaces répondent.

**Test de mutation** : en retirant l'en-tête, 4 tests échouent. **Suite complète** : 3 754 tests, 0 échec. `tsc` et `eslint` sont propres.

**Recette navigateur** (`scripts/fut158/recette.mjs`, Chrome, à 1440 et 390 px) : `/inondation/57463`, bloc « Ce que la commune a déjà vécu » absent avant et affiché après sur les deux formats, sans débordement horizontal. Captures dans `2026-10-28-fut158-incident-georisques/`.

La recette du dossier payant lui-même suppose un compte et un dossier. En créer un, ou en actualiser un existant, écrit en production : à faire après déploiement, avec votre accord (§7).

## 5. Coût

- Aucun appel en plus, sauf un GASPAR par passage de la sonde (3 essais au plus en cas d'échec).
- Les réponses ne sont plus compressées : quelques kilo-octets chacune (CatNat de Metz : 8 Ko), donc sans effet mesurable sur Vercel.
- Aucun accès à Supabase.

## 6. Ce qui reste hors de ce correctif

- Les pages `/inondation` et `/chaleur` masquent un bloc en panne au lieu de dire « indisponible ».
- Les instantanés de territoire enregistrent `missing` au lieu de `source_unavailable` pour Géorisques et CatNat.
- « 17fois » sans espace sur la page inondation (défaut d'affichage antérieur).
- Une alerte sur la trace `georisques_echec` dans les journaux Vercel, si vous voulez être prévenu sans attendre la sonde.

## 7. Déploiement minimal, sur votre autorisation

1. Fusionner cette PR seule ; elle ne dépend ni de #108 ni de #109. Le déploiement de production suit le push sur `main`.
2. Juste après :
   - `GET https://futur-e.fr/georisques?insee=57463` doit répondre 200 ;
   - `GET https://futur-e.fr/api/sante/georisques` doit répondre 200 avec `risques: "ok"`.
3. Lire les journaux : `vercel logs --environment production --query georisques_echec --since 1h` ne doit rien remonter d'anormal.
4. Avec votre accord : actualiser un dossier d'adresse de test, et vérifier que `sources_absentes` ne contient plus `georisques_*`.
