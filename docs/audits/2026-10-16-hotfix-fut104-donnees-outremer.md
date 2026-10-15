# Hotfix P0 : fausses projections climatiques servies à l'outre-mer

16 octobre 2026 · branche `hotfix/fut104-exposition-donnees-outremer`, depuis `origin/main` (6c496676). Rien n'est ouvert, fusionné ni déployé. FUT-50 et la branche FUT-104 ne sont pas touchés.

## Vérification négative

**Après déploiement de cette branche, aucune donnée climatique ultramarine issue du fichier DRIAS métropolitain n'est servie par une surface publique connue.**

La preuve tient en trois volets :

- **HTTP :** le banc `scripts/verifier-hotfix-outremer.mjs` passe 123 vérifications sur 123 contre le build de production local. Contre la production actuelle, il échoue 86 fois, soit sur toutes les vérifications ultramarines.
- **Exhaustivité :** `src/lib/outremer/garde-fous-outremer.test.ts` couvre une à une les surfaces recensées au § 3. La comparaison avant/après donne 218 codes servis avant, 0 après.
- **Données persistées :** aucun dossier, snapshot, synthèse, paiement ni rapport ultramarin en base (§ 6).

**Risques résiduels :**

- Les copies déjà téléchargées de `/data_climat.json` par des tiers ne peuvent pas être rappelées.
- Trois lignes erronées restent en base (`communes_tension`). Elles ne sont plus servies, et leur suppression attend une validation (§ 6).
- Une surface qui n'existe pas encore pourrait rouvrir le défaut. Le test de surface ne protège que les chemins recensés.

## 1. Cause racine (confirmée)

`scripts/build-drias-median.js` associait chaque commune au point de grille DRIAS le plus proche, en degrés bruts et **sans distance maximale**. Or la grille DRIAS-TRACC (17 couples EURO-CORDEX, 8 981 points) ne couvre que l'Hexagone et la Corse. Toutes les communes d'un territoire ultramarin recevaient donc la ligne d'un même point métropolitain :

| Territoires | Point reçu |
|---|---|
| Antilles, Saint-Martin, Saint-Barthélemy, Saint-Pierre-et-Miquelon, Wallis-et-Futuna, Polynésie, Clipperton | Le Conquet / Ouessant (29), copie exacte |
| Guyane | Côte basque |
| La Réunion, Mayotte | Sud de la Corse |
| Nouvelle-Calédonie | Est de la Corse |

Analyse complète : `docs/audits/2026-10-15-fut104-climat-outremer.md`, branche FUT-104.

## 2. Entités concernées

**218 entités** (654 lignes, 3 horizons) de `data_climat.json` :

| Collectivité | Entités |
|---|---|
| Guadeloupe (971) | 32 |
| Martinique (972) | 34 |
| Guyane (973) | 22 |
| La Réunion (974) | 24 |
| Saint-Pierre-et-Miquelon (975) | 2 |
| Mayotte (976) | 17 |
| Saint-Barthélemy (977) | 1 |
| Saint-Martin (978) | 1 |
| Wallis-et-Futuna (986) | 3 |
| Polynésie (987) | 48 |
| Nouvelle-Calédonie (988) | 33 |
| Clipperton (989) | 1 |

À cela s'ajoutent **3 scores dérivés** dans Supabase (`communes_tension`, thème « sécheresse », 97401 à 97403).

## 3. Surfaces de diffusion, et correctif de chacune

| Surface | Diffusait ? | Public ? | En production ? | Nature | Correctif |
|---|---|---|---|---|---|
| **`/data_climat.json`** (fichier sous `public/`) | Oui, les 654 lignes | Oui, par URL directe (63 Mo, HTTP 200) | Oui | Statique, CDN | **Fichier déplacé vers `data/data_climat.json`**, contenu inchangé. Il n'est plus distribué ; les 24 fonctions serveur qui le lisent l'embarquent dans leur trace (`.nft.json`, vérifié) |
| `/api/climat/[insee]` | Oui, ligne brute | Oui | Oui | Lecture du fichier | 404 pour un code ultramarin, **avant** la lecture du fichier |
| `/drias?insee=` (landing) | Oui, carte DRIAS | Oui | Oui | `getClimatDataCommune` | Couvert par le garde-fou de `getClimatDataCommune` (404) |
| `getClimatDataCommune` | Oui | Via tous ses appelants | Oui | Calculé, index en mémoire | `null` pour un code ultramarin, **avant** de charger l'index |
| `getRangNational` | Oui (rang sur 35 006) | Via les pages | Oui | Calculé | `null` pour un code ultramarin, avant l'index |
| `deriveClimatProjete` (synthèse Logement) | Oui, si appelé | Non (compte) | Oui | Calculé | Couvert par `getClimatDataCommune` |
| `/qna` (accueil, IA) | Oui, faits de contexte | Oui | Oui | `getClimatDataCommune` | Couvert. Non testé en HTTP (appel Anthropic payant) |
| `/api/wizard-preview` | Oui : bloc DRIAS **et** score « sécheresse » | Oui | Oui | `getClimatDataCommune` et `communes_tension` | DRIAS couvert ; les thèmes `canicule`, `submersion`, `feux` et `secheresse` sont filtrés pour un code ultramarin |
| `/chaleur/[insee]` | Oui : tuiles, rangs, titre « projections 2050 », appel au dossier | Oui (sitemap) | Oui | ISR 24 h ; 8 pages ultramarines préconstruites | **404**, page d'explication, métadonnées neutres en `noindex`, retrait de la préconstruction |
| `/inondation/[insee]` | Oui : pluie, rangs | Oui | Oui | SSG + ISR | Idem |
| `sitemap.xml` | 223 URL `/chaleur/97…/98…` | Oui | Oui | Statique, 30 j | URL ultramarines retirées |
| Aperçu (`apercu-climat-communes.json`, `/territoire/[insee]/debloquer`) | Oui : faits chaleur, plus « le dossier lit la trajectoire climatique » | Oui | Oui | Extrait embarqué côté serveur | `scenariosDepuisExtrait` renvoie `null` ; nouvel état `hors_couverture` qui dit l'absence |
| Dossiers Territoire et Adresse (`commune-enrichment`, `territory-facts`, webhook Stripe, actualisation, synthèses) | Potentiellement | Non (paiement) | Oui | Calculé, puis persisté | Couverts par `getClimatDataCommune`. **Aucun dossier ultramarin en base** (§ 6) |
| Pages « villes les plus exposées » | Non | — | — | Listes métropolitaines figées | Rien |
| Comparateur, « Où vivre » | Non | — | — | Index sans outre-mer (0 code 97/98, vérifié) | Rien |
| Constructeurs (`build-drias-median.js`, `populate-communes-tension.js`) | À la régénération | — | — | Scripts | Exclusion de l'outre-mer et distance maximale (§ 7) ; `communes_tension` n'en tire plus de score |

## 4. Fort-de-France (97209), avant et après

| Surface | Avant (production, 16/10) | Après (build de production local) |
|---|---|---|
| `/chaleur/97209` | 200, « Chaleur et canicule à Fort-de-France : projections 2050 ». « 3 j » au-dessus de 30 °C en 2050, « 0 j » au-dessus de 35 °C, « parmi les 3 % des communes françaises les moins exposées », bouton « Ouvrir le dossier » | **404**. Titre « Projections climatiques indisponibles · futur•e », `noindex`. Aucune tuile, aucun rang, aucun appel au dossier |
| `/api/climat/97209` | 200, ligne du Conquet (`column04` = 12,94 °C) | 404 |
| `/drias?insee=97209` | 200, carte DRIAS | 404 |
| `/data_climat.json` | 200, 63 Mo | 404 |
| `/territoire/97209/debloquer` | « Le dossier de Fort-de-France lit ensemble la trajectoire climatique… » | « Les projections climatiques du dossier (DRIAS-TRACC, Météo-France) couvrent l'Hexagone et la Corse : elles ne s'appliquent pas à Fort-de-France. Le dossier ne contient donc pas de trajectoire climatique. » |

**Limite constatée.** Le HTML initial des pages 404 n'a pas de corps : la page d'explication est dans la charge utile React et s'affiche après hydratation. C'est vérifié dans Chrome (titre et texte affichés).

- *Ce qui ne dépend pas de cette limite :* statut 404, `noindex`, titre neutre, aucune donnée dans le HTML ni dans la charge utile.
- *Cause non identifiée :* ni la `Navbar` (testé), ni les métadonnées (testé), ni les layouts. Probablement un comportement de Next 16 avec un `not-found` de segment.

## 5. Non-régression métropolitaine

**Données.** La comparaison est exhaustive entre `origin/main` et la branche, sur 34 791 codes (dont Paris, Lyon et Marseille) :

- `getClimatDataCommune` (dossier et accueil), `deriveClimatProjete` ;
- `getRangNational` : **626 238 rangs** (9 indicateurs × 2 horizons) ;
- aperçu : 34 788 communes.

**0 écart.** L'échelle nationale est inchangée (35 006 valeurs).

**HTTP**, sur le build de production local :

- `/api/climat`, `/drias` et `/drias?dataset=landing` sont identiques **octet pour octet** à la production pour Le Conquet, La Rochelle et Ajaccio ;
- les tuiles et rangs affichés sont identiques à la production pour `/chaleur` (La Rochelle, Le Conquet, Ajaccio, Paris) et `/inondation` (Nîmes, Nantes) ;
- les 16 pages métropolitaines testées (La Rochelle, Nantes, Nîmes, Le Conquet, Ajaccio, Paris, Lyon, Marseille, × 2 gabarits) répondent en 200 avec leurs titres.

**Constructeur.** Le constructeur corrigé, relancé en entier vers un répertoire temporaire, reproduit **à l'identique les 104 364 lignes métropolitaines** du fichier livré. Il ne produit aucune ligne ultramarine. Seul `commune_count` change dans les métadonnées (35 006 → 34 788).

## 6. Données persistées

Requêtes en lecture seule sur la base de production, le 16/10 :

| Table | Total | Lignes 97/98 |
|---|---|---|
| `address_dossiers` | 26 | 0 |
| `decision_artifact` | 65 | 0 |
| `decision_narrative` | 6 | 0 |
| `territory_facts_snapshot` | 17 | 0 |
| `territory_synthesis` | 28 | 0 |
| `report_context` | 9 | 0 |
| `report_grants` | 0 | 0 |
| `dossier_intents` | 26 | 0 |
| `payments` | 14 | 0 |
| `ask_conversations` | 56 | 0 |
| `user_profiles` (domicile, actif) | 17 | 0 |
| **`communes_tension`** | 1 271 | **50** |
| `commune_era5_trend` | 34 875 | 129 |

**Aucun dossier, snapshot, synthèse, rapport ni paiement ultramarin.** L'incident n'a atteint aucun livrable.

`communes_tension` :

- **47 lignes `dependance-auto`** : source INSEE, sans lien avec DRIAS. Elles sont légitimes.
- **3 lignes `secheresse`** (97401, 97402, 97403) : score 74, identique pour les trois, calculé sur les colonnes DRIAS du sud de la Corse. Elles étaient renvoyées par `/api/wizard-preview` et sont désormais filtrées. **Suppression proposée, non exécutée, à valider :**

  ```sql
  delete from communes_tension
  where slug = 'secheresse' and insee_code in ('97401', '97402', '97403');
  ```

`commune_era5_trend` (129 lignes ultramarines) : il s'agit d'observations ERA5-Land, calculées sur des zones propres (Antilles, Guyane, océan Indien) avec un rayon borné. Ce n'est pas DRIAS. Non audité en détail, et hors du périmètre de ce correctif.

## 7. Constructeur : règle et tests

La règle est désormais : **aucune commune ne reçoit une valeur d'une grille qui ne couvre pas son territoire** (`scripts/lib/drias-jointure.mjs`).

1. Les codes ultramarins sont exclus avant la jointure, quelle que soit la distance.
2. Une commune dont le point le plus proche dépasse **0,25°** fait échouer la construction.
   - *Distances mesurées sur la grille réelle :* médiane 0,035°, 99ᵉ centile 0,060°, maximum 0,155° (île de Sein) ; Ouessant 0,147°, Granville 0,100°.
   - *Marge :* le seuil laisse 1,6 fois le maximum, et la commune ultramarine la plus proche de la grille en est à 51°.

**Tests** (`scripts/lib/drias-jointure.test.mjs`) :

- exclusion de l'outre-mer, même posé sur un point de la grille ;
- refus d'une coordonnée corrompue et de part et d'autre du seuil ;
- sur la grille réelle : 34 788 communes associées et 218 exclues ; cas limites Sein, Ouessant, Granville, Le Conquet, Bonifacio, Aléria, Biriatou.

## 8. Caches et contenus préconstruits

- **Nouveau build :** suffisant. Sur Vercel, les fichiers statiques, les pages ISR et SSG et le sitemap appartiennent au déploiement. Le nouveau déploiement ne contient plus `data_climat.json` sous `public/` et ne préconstruit plus les 8 pages ultramarines (97411, 97415, 98818, 97416, 97422, 97209, 97611, 97302). Le cache CDN du domaine de production est invalidé à la promotion d'un déploiement.
- **Aucune purge manuelle n'est nécessaire.** Je n'en ai fait aucune.
- **Data cache Next :** `unstable_cache` ne garde que l'identité de la commune (`chaleur-commune` : nom et département), jamais une valeur climatique. Rien à invalider.
- **Navigateurs :** les fichiers de `public/` sont servis par Vercel avec revalidation. Une copie déjà téléchargée reste hors de portée.

## 9. Stratégie SEO temporaire

- **Option retenue : B, 404** avec page d'explication, pour `/chaleur/[insee]` et `/inondation/[insee]` sur les codes ultramarins.
  - *Pourquoi pas l'option A :* tout l'appareil de ces pages repose sur DRIAS (titre, description, Open Graph, introduction « +2,7 °C en France » et « parmi l'ensemble des communes françaises », tuiles, rangs, appel au dossier). Le réécrire dans un correctif urgent laissait un risque élevé d'affirmation fausse résiduelle.
  - *Pourquoi 404 et pas 410 :* ces pages reviendront avec SocleOM ; 410 annonce une suppression définitive.
- **Coût SEO nul aujourd'hui :** le site est fermé au crawl (`robots.txt` en `Disallow: /`, `noindex, nofollow`), vérifié en production le 16/10.
- **Sitemap :** les URL ultramarines sont retirées (223 → 0). Aucune balise canonical ni donnée structurée n'existait sur ces pages.
- **Ce qui reste accessible :** les communes ultramarines restent dans la recherche et dans le reste du produit. Seul le périmètre climatique DRIAS est fermé.

## 10. Tests

| Vérification | Résultat |
|---|---|
| Suite complète, lancée seule | **2 587 tests, 0 échec** (2 575 sur `origin/main` + 12 nouveaux) |
| TypeScript (`tsc --noEmit`) | OK |
| ESLint, fichiers modifiés | OK |
| Build de production (`next build --webpack`) | OK |
| Banc HTTP, build de production local | 123 sur 123 |
| Banc HTTP, production actuelle | 28 réussites (métropole), 86 échecs (tout l'outre-mer) : le défaut est reproduit |

Le build Turbopack échoue dans un worktree imbriqué, pour une raison d'environnement local. C'est déjà constaté sur FUT-93 et indépendant de ce correctif.

## 11. Déploiement et validation

**Les commits :**

| Commit | Contenu | Retour arrière |
|---|---|---|
| 1, garde-fous | Pages, API, sitemap, aperçu, constructeurs, tests | — |
| 2, fichier | Déplacement `public/` → `data/` | Peut être annulé seul : le fichier redevient public, tout le reste reste gardé |

**Procédure :**

1. Revue, puis fusion dans `main` (procédure distincte, après validation).
2. **Avant promotion**, sur l'URL de prévisualisation du déploiement :
   ```
   node scripts/verifier-hotfix-outremer.mjs <url-preview> https://futur-e.fr
   ```
   Attendu : 123 sur 123, dont l'égalité octet pour octet des réponses métropolitaines avec la production.
3. Après promotion : `node scripts/verifier-hotfix-outremer.mjs https://futur-e.fr`, puis le contrôle manuel de `https://futur-e.fr/data_climat.json` (404) et de `https://futur-e.fr/chaleur/97209` (404, aucun chiffre).
4. Surveiller les erreurs d'exécution des routes climatiques (`/chaleur`, `/inondation`, `/drias`, `/qna`, dossiers) pendant 24 h. Un « fichier introuvable » signalerait un défaut de trace ; la trace est vérifiée localement pour les 24 consommateurs.
5. Valider puis exécuter la suppression SQL du § 6.

**Retour arrière, sans réactiver les données fausses :**

- **Ne pas utiliser le retour arrière instantané de Vercel** vers le déploiement précédent : il republierait `/data_climat.json` et les pages ultramarines fausses.
- **Si les fonctions ne trouvent plus le fichier :** annuler le seul commit 2 (`git revert`) et redéployer. Le fichier redevient public, mais les pages, les API et l'aperçu restent gardés ; on corrige ensuite la trace (`outputFileTracingIncludes`).
- **Si une page métropolitaine régresse :** corriger en avant. Les garde-fous ne touchent aucun chemin métropolitain (0 écart sur 626 238 rangs).

## 12. Actions restant dans FUT-104

1. **Rebaser FUT-104 sur ce correctif une fois fusionné.** Conflits attendus dans :
   - `drias-json.ts`, `apercu-territoire.ts` et son test, `api/climat/route.ts`, `build-drias-median.js`, `outremer/code-outremer.ts` ;
   - le test de contamination de FUT-104, qui lit `public/data_climat.json`.
2. **Rouvrir les pages ultramarines avec SocleOM** : contenu propre au territoire, retour au sitemap si elles deviennent indexables.
3. **Décider la purge des 218 lignes.** Le fichier régénéré est prêt (métropole identique ligne à ligne). Elle changerait l'échelle nationale (34 788 communes comparées au lieu de 35 006, percentiles ±0,34 point au plus) et imposerait de régénérer l'extrait de l'aperçu.
4. **Décider de la vente des dossiers ultramarins.** La page `debloquer` dit désormais l'absence de trajectoire climatique, mais son argument « où elle se situe parmi les 34 000 communes françaises » reste faux pour l'outre-mer, absent du comparateur. 0 dossier ultramarin vendu à ce jour.
5. Supprimer les 3 lignes `secheresse` (§ 6).
