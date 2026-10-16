# FUT-50 · Intégration de la version C dans l'accueil public

16 octobre 2026 · branche `feat/fut-50-socleom-integration`. Aucune fusion, aucun déploiement en production, aucune écriture en base, aucun appel Anthropic.

## 1. Consolidation

| Étape | Commit | Contenu |
|---|---|---|
| Départ | `0b2d2b24` | FUT-50 version C, FUT-104 (hotfix P0 et consolidation), route publique légère |
| Micro-correctif | `053442b1` | Avance rapide : `verifier-equivalence.mjs --reseau` échoue en cas de divergence. Il était posé directement sur `0b2d2b24`, donc rien n'est dupliqué |
| `main` | `b6f65e6b` | Fusion de `6a00f85f` (FUT-62, FUT-110, FUT-112). Aucun conflit textuel |
| Intégration | `474950d7` et suivants | Accueil public, périmètre V1, bancs |

**Conflits sémantiques vérifiés** : aucun code de `main` ne lit plus `public/data_climat.json` (le fichier est sous `data/` depuis le hotfix). `npx tsc` passe. Les tests FUT-110 et FUT-112 passent sur la branche.

**FUT-104 sur cette branche** :
- le hotfix P0 (`25fc2754`, `b3e4342a`, repris par `cherry-pick -x` de `hotfix/fut104-exposition-donnees-outremer`) et la consolidation (`cf8ea2f1`) sont inclus. Ils ne sont **toujours pas en production** : cette PR les y amènera ;
- `data/data_climat.json` compte 104 364 lignes, sans aucune ligne ultramarine. Les lignes métropolitaines sont identiques octet pour octet à l'ancien fichier ;
- `npm run accueil:verifier` (dans `prebuild`) confirme que `src/data/accueil-communes.json` (34 788 communes) et l'extrait climatique sont à jour ;
- la purge SQL `supabase/maintenance/2026-10-16-fut104-purge-secheresse-outremer.sql` reste **préparée et non exécutée**. Elle demande ton accord ; aucune opération SQL n'a été lancée.

## 2. L'accueil public

`src/app/(public)/page.tsx` monte la version C : le hero en trois états, puis Pourquoi, Échelles, Offres, Savoir et le pied de page.

- **Le hero** lit `/api/accueil/commune` et `/api/accueil/lecture`, c'est-à-dire le service partagé `@/lib/accueil/lecture-accueil`, qui applique les règles du dossier. Le nom envoyé par le navigateur n'est jamais lu.
- **Les tarifs** sont ceux de l'ancien accueil, à l'identique : 0 €, 14 €, 39 € (ou 25 € après un dossier de territoire), comparatif à 39 €. Les ancres `/#pricing` et `/#savoir`, utilisées par `/compte`, `/rapport`, le paiement et la navigation, existent toujours.
- **La place du film** (FUT-56) est réservée : `DossierAdresse` ne rend rien tant que `FILM_DOSSIER` est nul. Il n'y a ni maquette ni donnée fictive.
- **`pricing_page_viewed`** est repris de `FutureELanding` à l'identique (`SuiviTarifs`). Aucun autre événement n'existait sur l'ancien accueil.
- **`FutureELanding.tsx`** n'est plus monté, mais le fichier est conservé. Le supprimer est un nettoyage à faire après la mise en ligne.

**Emplacements de production** :

| Avant (prototype) | Après |
|---|---|
| `prototypes/fut50/c/HeroLieu.tsx` | `src/components/accueil/HeroLieu.tsx` (prop `api`, `/api/accueil` par défaut) |
| `prototypes/fut50/c/SectionsC.tsx` | `src/components/accueil/SectionsAccueil.tsx` |
| `FilmDossier.tsx`, `PlansDossier.tsx`, `c.module.css` | `src/components/accueil/` (`accueil.module.css`) |
| `pastilles.ts`, `outremer.ts` et leurs tests | `src/lib/accueil/` |
| `fr()` (dans `commun.tsx`) | `src/lib/accueil/fr.ts`, réexporté par `commun.tsx` |

**Le prototype** `/dev/fut50/c` monte les mêmes composants par ses routes de développement (`api="/dev/fut50/api"`). Il garde la composition « mobilité » et la maquette du film. En production, il répond 404 (vérifié sur le build).

## 3. Périmètre V1 : l'Hexagone et la Corse

Avant ce lot, une lecture ultramarine finissait sur le bouton orange « Examiner une adresse à {commune} », vers `/dossier`. Le cas valait aussi pour les risques des DROM (lecture GASPAR de l'Hexagone) et pour « sans voiture », dont le texte promettait « Le dossier les mesure autour de l'adresse ».

Désormais :
- **Aucune lecture ultramarine ne mène au dossier.** `suite` vaut `{ horsOffre }`, et la lecture dit : « Les dossiers de futur•e couvrent pour l'instant l'Hexagone et la Corse. Ils ne sont pas encore proposés pour ce territoire. » Il n'y a pas de bouton ; le lien gratuit vers `/ou-vivre` reste.
- **Les risques des DROM** reçoivent la même suite. « Sans voiture » outre-mer garde la première phrase, sans la promesse du dossier.
- **La porte « Examiner cette adresse »** du hero se retire quand la commune choisie est ultramarine.
- **Les lectures gratuites, fiables et qualifiées restent** : chaleur SocleOM sans verdict, indisponibilités motivées, GASPAR hors couverture dit comme tel, jamais « aucun risque ».
- **Le blocage serveur des achats ultramarins** relève de FUT-18, non traité ici. `/dossier` et `/checkout` n'ont pas été modifiés.
- **Revue du 16/10** : trois lectures de donnée absente (chaleur sans indicateur publié, hivers, population non publiée) promettaient encore « Le dossier de la commune présentera… ». Elles disent désormais ce qui est vérifiable gratuitement :
  - chaleur sans indicateur : les projections sont publiées par Météo-France, et la chaleur ressentie dépend aussi du quartier et du logement ;
  - hivers : les projections sont publiées par Météo-France, par rapport à 1991-2020 ;
  - population non publiée : le bassin de vie peut être plus large que la commune.

  Les phrases reprises existaient déjà dans le module. Le test V1 vérifie leur texte exact et interdit toute mention du dossier dans le texte visible ; il échoue sur l'ancien module.

**Tests ajoutés** :
- `outremer.test.ts` : 6 lectures ultramarines, aucune vers `/dossier`, aucune promesse ;
- `accueil-public.test.ts` : `/` monte la version C par les routes publiques, sans maquette, bandeau ni route de développement, et aucun composant de production n'importe un prototype.

## 4. Vérifications

| Contrôle | Résultat |
|---|---|
| Suite complète, lancée seule (deux fois, compte stable) | **2 726 / 2 726** |
| `tsc --noEmit` | OK |
| `eslint` sur les fichiers touchés | OK. Le lint global garde 42 problèmes, tous antérieurs, dans des fichiers non touchés |
| `npm run build` (Turbopack, `prebuild` compris) | OK, `/` statique, `/api/accueil/*` dynamiques |
| Équivalence exhaustive hors réseau | 104 373 / 104 373 lectures ; identité, chaleur, taille et hivers 34 791 / 34 791 ; répartitions identiques au 16/10 |
| Panel en ligne (`--reseau`, vrai `buildCommuneDossier`) | 24 / 24 |
| `banc-production.mjs` (build de production) | Tout est conforme : en-têtes de cache, panne GASPAR jamais durable, nom falsifié ignoré, 30 lectures simultanées justes, fichiers internes en 404, prototype en 404 |
| `verifier-clavier-mobile.mjs` sur `/` (build de production) | **40 / 40** : clavier complet, focus visible, 360, 390, 820 et 1440 px sans débordement, cibles ≥ 24 px, mouvement réduit (0 animation, défilement instantané), changement de commune |
| `verifier-identite-navigateur.mjs` sur `/` | **13 / 13** : identités canoniques, réponses désordonnées, commune inconnue, annulation des requêtes d'une commune quittée |
| `interactions-c.mjs` sur `/` | Trois états à 1440, 390 et 360 px, geste de l'état 3 sans décalage (CLS 0), bascule 30 °C au clavier et en mouvement réduit, onglets, erreur de chargement avec « Réessayer », commune inconnue en 404 |

**Ajustements des bancs** :
- les bancs navigateur acceptent `PAGE` et `API`, avec le prototype par défaut. Pour l'accueil public : `PAGE=/ API=/api/accueil` ;
- le banc clavier attend, pour une commune ultramarine, l'absence de bouton vers `/dossier` (V1) au lieu du bouton ;
- le banc d'identité compte aussi les annulations sur `/api/accueil/*`. Son filtre ne voyait que les routes de développement, et l'échec initial venait de là, pas d'une annulation manquante ;
- les étapes réservées au prototype (composition « mobilité », storyboard) n'y sont jouées que sur le prototype.

**Environnement** : le premier build échouait (`Cannot find module '@vercel/turbopack/postcss'`) parce que le `node_modules` de ce worktree était une copie contenant un lien symbolique vers celui du dépôt principal. Après un `npm ci` propre, le build passe. L'ancien dossier est conservé hors du dépôt, et le code n'était pas en cause.

## 5. Performances (build de production local, `next start`)

| Mesure | 16/10, avant intégration (§ 11 du rapport précédent) | Maintenant |
|---|---|---|
| Premier appel sur un serveur neuf | 29 à 46 ms ; risques 171 ms | 30 à 49 ms ; risques 178 ms |
| À chaud : chaleur, hivers, taille (p95) | ≤ 6 ms | ≤ 7 ms |
| À chaud : risques (p95) | 96 ms | 64 ms (GASPAR) |
| Identité (p95) | 3 ms | 4 ms |
| Mémoire du serveur au repos | 277 à 329 Mo | 338 à 364 Mo |
| Mémoire après toutes les lectures | 391 Mo | 464 Mo |

Les temps sont stables. La mémoire au repos augmente d'environ 40 Mo. Next 16 précharge au démarrage les modules de toutes les pages, et `main` en a ajouté (FUT-62, FUT-110) ; l'accueil n'est plus le seul module chargé. La mesure qui compte reste celle d'une fonction Vercel (§ 7).

## 6. Limites connues, non corrigées ici

- **« … aux hivers les plus doux de France »** : la phrase vient de la règle `douceur_climat` du dossier, que l'accueil reprend à l'identique (équivalence). Le classement porte sur les 34 788 communes de l'Hexagone et de Corse. La corriger change le texte du dossier payant : c'est une décision moteur, hors FUT-50.
- **Outre-mer, « 13,59 à 24,18 °C »** : l'étendue communale SocleOM s'affiche avec deux décimales (texte FUT-104). C'est cosmétique.
- **Délai GASPAR à 3 s** : une panne coûte 3 s par visiteur, sans mise en cache. La valeur reste à décider après la mesure sur Vercel.
- **Trois communes de taille 0 dans l'index** (60694, 85165, 85212) : la donnée vient de l'index lui-même, hors FUT-50.
- **FUT-18** (blocage serveur des achats ultramarins), **FUT-106 et FUT-107** (dossiers ultramarins) : non traités.
- **`/territoire/[insee]/debloquer`** affiche encore un bouton de paiement (`TerritoryUnlockPanel`) pour un code ultramarin. Retirer les boutons de l'accueil n'interdit pas l'achat par une autre route : le verrou serveur, avant toute création de paiement Stripe, sur tous les parcours, relève de FUT-18. Il est à faire avant l'ouverture commerciale V1. Cette dette est antérieure à FUT-50.

## 7. Prévisualisation Vercel

Prévisualisation de la branche, sans aucun déploiement en production :
- déploiement : `dpl_44oosGWak7YEovDsQZRgJdvjtjLM`, `future-lhffelht0-futuree-apps-projects.vercel.app`, commit `2d3c078d` ;
- région : `cdg1` ;
- accès : la prévisualisation est protégée par l'authentification Vercel. Elle a été lue avec `vercel curl` (contournement officiel pour le propriétaire du projet). Le connecteur Vercel du poste répond 403 sur l'équipe `futuree-apps-projects` ; la CLI, elle, y a accès.

**Durées vues du client**, depuis Paris, réseau et TLS compris (environ 80 ms de trajet aller-retour) :

| Mesure | Résultat |
|---|---|
| Premiers appels après le déploiement (8 parcours) | identité 109 ms ; chaleur 411 ms (instance froide) ; hivers 151 ms ; taille 103 ms ; risques 273 ms ; chaleur ultramarine 259 ms et 123 ms ; `/` 474 ms (`PRERENDER`) |
| 50 lectures (10 communes, Corse et Martinique comprises, × 5 priorités), premier passage | 50 `MISS`, p50 110 ms, p95 169 ms, max 309 ms ; risques 145 à 309 ms |
| Les mêmes, second passage | **50 `HIT`**, p50 83 ms, p95 102 ms |
| `/` | `PRERENDER`, puis `HIT` |

Hors réseau, la fonction répond donc en 20 à 30 ms, ou 70 à 80 ms avec GASPAR. Ces durées sont cohérentes avec le build local.

**Cache, vérifié deux fois de suite** :
- les lectures durables passent de `MISS` à `HIT` ;
- un paramètre superflu ou une requête invalide (400) restent `MISS` aux deux passages : jamais servis depuis le cache ;
- une commune inconnue (404) devient `HIT`, comme prévu (1 h, structurelle) ;
- GASPAR hors couverture (98735) est durable, puis `HIT`.

**Exposition** : `/data_climat.json`, `/accueil-communes.json`, `/apercu-climat-communes.json`, `/data/data_climat.json`, `/dev/fut50/c` et `/dev/fut50/api/lecture` répondent tous 404 sur Vercel.

**Non mesurable ici** :
- **panne GASPAR réelle** : aucune ne s'est produite, et la production n'a pas de point d'injection. Le `no-store` d'une panne est prouvé par les tests du service et de la politique de cache ;
- **mémoire et durée d'une instance** : à relever dans *Observability → Functions* (non exposé par la CLI) ;
- **`stale-while-revalidate`** : son comportement demande d'attendre 24 h.
