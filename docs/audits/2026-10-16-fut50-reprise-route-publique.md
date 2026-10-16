# FUT-50 · Reprise après FUT-104 : corrections ciblées et diagnostic de la route publique

16 octobre 2026 · branche `feat/fut-50-socleom-integration` (départ `13efe706`).

**Hors périmètre de cette passe** : aucune PR, fusion ni déploiement ; aucune écriture en base ; FUT-106 et FUT-107 non traités.

**Inchangés** : direction artistique, textes validés, animations et composition.

## 1. FUT-104 clôturé, responsabilités transférées

- **FUT-104 passe en Done**, avec un commentaire de clôture. Le périmètre initial est vérifié point par point :
  - purge des 218 entrées ;
  - pipeline SocleOM reproductible ;
  - 187 entités couvertes, 36 entités sans couverture avec leur motif ;
  - contrôles et non-régression ;
  - contrat `@/lib/outremer` ;
  - intégration au prototype.
- **Le commentaire précise que rien n'est fusionné dans `main` ni déployé.** `origin/main` est toujours à `6c496676`.
- **FUT-108 est créé** : la purge SQL des 3 scores « sécheresse » ultramarins de production. Il est lié à FUT-104 et FUT-106, avec ses contrôles et une validation humaine obligatoire. **SQL non exécuté.**
- **⚠ Le hotfix P0 `hotfix/fut104-exposition-donnees-outremer` n'est pas déployé.** La production sert donc encore les fausses projections ultramarines (`/chaleur/97xxx`, `/data_climat.json`…), même si le site reste fermé aux moteurs de recherche. Ce déploiement relève désormais de l'intégration FUT-50 et du lancement.
- **Responsabilités transférées** :
  - FUT-106 : dossiers payants, checkout, CTA ultramarins ;
  - FUT-107 : doctrine ultramarine ;
  - FUT-105 : fourchettes et climat récent ;
  - FUT-50 : accueil.

## 2. FUT-50 : corrections réalisées

### A. Identité harmonisée dès la confirmation

- **Avant** : à gauche, « Saint-Denis » (le libellé de la recherche) ; à droite, « Saint-Denis (La Réunion) ».
- **Après** : dès la sélection, et sans priorité choisie, la nouvelle route `/dev/fut50/api/commune` renvoie le nom canonique.
  - Le nom remplace l'étiquette dans le champ et dans la confirmation.
  - L'attribut `data-identite` passe de `provisoire` à `canonique` (ou `inconnue`).
- **Une seule résolution** : `src/components/prototypes/fut50/c/identite.ts`, partagée par la confirmation et les lectures. Le COG ultramarin y est consulté avant l'index métropolitain.
- **Réponses dans le désordre** : un jeton écarte toute réponse arrivée après un changement de commune ou une reprise de saisie.
- **Banc navigateur** `scripts/fut50/verifier-identite-navigateur.mjs` : **9/9**.
  - Saint-Denis (La Réunion), Fort-de-France (Martinique), Papeete (Polynésie française), Nîmes ;
  - Saint-Denis (93) inchangé ;
  - deux scénarios de désordre (réponse retardée de 2,5 s) ;
  - lecture sous la même identité ;
  - commune inconnue.
- **Banc HTTP** `verifier-identite.mjs` : **45/45**.

### B. GASPAR hors couverture (codes 98)

L'affirmation « ne couvre pas » est **confirmée par la source publiée**, et plus seulement par une réponse vide de l'API.
- L'édition officielle GASPAR (`files.georisques.fr/GASPAR/gaspar.zip`, référencée par data.gouv.fr, millésime 2026-10-05) contient des communes 971 à 978 dans ses tables, et **aucun code 98 dans aucune de ses huit tables** : recensement des risques, CatNat, AZI, DICRIM, TIM, PPRN, PPRM, PPRT.
- La raison avancée jusqu'ici (« qui a ses propres dispositifs de prévention ») n'était pas vérifiée : elle est **retirée**.

**Texte** :

> La base nationale des risques (GASPAR) ne couvre pas la Polynésie française : son édition officielle n'y recense aucune commune. Cette absence ne dit rien des risques du lieu : nous n'en tirons aucune conclusion.

Les tests vérifient l'absence de toute raison non vérifiée et de toute formule « aucun risque ». La classification GASPAR des communes couvertes n'est pas touchée.

### C. Clavier : parcours complet, testé dans un vrai Chrome

| Étape | Résultat |
| --- | --- |
| Champ de recherche | atteint au clavier ; focus visible (anneau orange de 3 px et bordure, portés par le cadre du champ) |
| Liste de suggestions | `aria-expanded`, `aria-controls`, `aria-activedescendant` suivent les flèches ; le focus reste dans le champ |
| Échap | ferme la liste, le focus reste dans le champ (la saisie la rouvre ; la flèche bas ne la rouvre pas) |
| Entrée | choisit ; l'identité devient canonique |
| Priorités | à 2 tabulations ; Espace et Entrée basculent `aria-pressed` |
| Plusieurs priorités | onglets : flèches, `tabindex` 0/-1, panneau lié |
| « Comment lire ce résultat ? » | atteint, s'ouvre et se ferme au clavier, contour visible |
| CTA et lien secondaire | atteints (`/dossier`, `/ou-vivre`) |
| Sortie | aucun piège : Tab sort du hero vers la suite de la page |
| « Changer de commune » | au clavier, focus rendu au champ |

Aucun défaut constaté, aucune correction.

### D. Mouvement réduit, réellement émulé

- **Défaut constaté et corrigé** : en mouvement réduit, le défilement automatique était **supprimé**. À 390 × 844, la lecture naissait hors de l'écran (titre à 1 076 px), sans aucun signe de son apparition.
  - Le défilement est désormais **instantané** (`behavior: "auto"`) au lieu d'être supprimé.
  - Mesuré : titre à 108 px, sous l'en-tête.
- **Vérifié** :
  - 0 animation en cours après les interactions et au basculement 30 °C ;
  - 0 transition non nulle dans l'accueil ;
  - aucun défilement `smooth`.
- **Hors FUT-50, signalé** : l'en-tête global du site garde 9 transitions en mouvement réduit (couleurs des liens en 0,15 s, flèche du menu « Explorer » en 0,2 s, bouton menu).

### E. Vrais viewports

Chrome est piloté à la taille testée, sans cadre dans une page plus large.

| Viewport | Débordement | Grands chiffres | Titre de la lecture | Cibles < 24 px hors exceptions WCAG 2.5.8 | Changement de commune |
| --- | --- | --- | --- | --- | --- |
| 360 × 800 | 0 px | 32 px | 108 px (en-tête 65) | aucune | conforme, aucune trace de la précédente |
| 390 × 844 | 0 px | 32 px | 108 px | aucune | conforme |
| Tablette 820 × 1180 | 0 px | 32 px | 788 px, visible sans défilement | aucune | conforme |
| Ordinateur 1440 × 900 | 0 px | 40 px | 208 px | aucune | conforme |

**Les petites cibles relèvent des exceptions de 2.5.8.**
- Liens dans une phrase : « Examiner cette adresse », bandeau du prototype, cookies.
- Liens isolés à plus de 24 px de toute autre cible : « Pourquoi futur•e existe », « Vous utilisez beaucoup votre voiture… ».

**Correction typographique** : la ligne de source passe par `fr()`, et « +2,0 °C » ne se coupe plus en fin de ligne à 360 px.

**Captures** : `docs/audits/2026-10-16-fut50-clavier-mobile/`.

**Bancs** : `scripts/fut50/verifier-clavier-mobile.mjs`, **40/40**.

## 3. FUT-50 : architecture et performance de la future route publique

### Mesures réelles

**Script** : `scripts/fut50/mesurer-route-lecture.mjs`. Chaque mesure à froid tourne dans un processus Node neuf, sur la machine locale, hors Next.
- La mémoire inclut environ 30 à 50 Mo propres à l'outil de chargement.
- GASPAR a été mesuré depuis une adresse IP française : depuis l'Irlande, il dépasse son délai à chaque appel.

| Source | À froid | À chaud | Mémoire | Fichiers lus |
| --- | --- | --- | --- | --- |
| Identité ultramarine (COG) | ≤ 1 ms | 0 ms | +27 à 52 Mo | `src/data/outremer/*.json`, **jamais l'index métropolitain** (vérifié) |
| SocleOM (chaleur ultramarine) | 1 ms | 0 ms | +66 Mo | idem |
| Index des communes (identité et taille métropolitaines) | **1,3 à 1,6 s** | 0 ms | **+620 Mo** | `data/comparateur-index.json.gz` (11 Mo compressé) |
| DRIAS (chaleur métropolitaine) | **0,8 s** | 0 ms | **+430 Mo** | `data/data_climat.json` (63 Mo) |
| Moteur complet (« Petite ville », « Hivers ») | **2,9 s** | 111 ms (autre commune) | **+930 Mo** | index + DRIAS, plus **3 appels Géorisques** (GASPAR, zonage sismique, radon) |
| GASPAR (« Risques ») | 140 à 260 ms | même ordre (pas de cache hors Next) | négligeable | réseau |

**Route du prototype, à chaud (serveur de développement)** :
- chaleur, risques, voiture : 10 à 20 ms ;
- hivers et taille : 70 à 80 ms (moteur complet) ;
- outre-mer : environ 11 ms pour toutes les priorités.

**Estimations, non mesurées** :
- **Une instance froide qui sert les cinq priorités métropolitaines** charge l'index, DRIAS et le moteur, soit plus de 1 Go de mémoire résidente et 3 à 4 s de premier appel.
- **Avec le moteur complet sous Fluid Compute**, la mémoire et le délai de Géorisques (8 s au maximum) deviennent les vrais risques.

### Constats

1. **« Petite ville » et « Hivers » lancent le moteur complet pour un seul fait.** Un fait de l'index attend donc Géorisques sur le réseau, jusqu'à 8 s si le service ralentit.
2. **La chaleur métropolitaine charge les 63 Mo de DRIAS** pour 4 colonnes d'une commune.
3. **L'identité métropolitaine charge l'index entier** (620 Mo), alors qu'il suffit d'un nom par code.
4. **L'outre-mer est déjà léger et isolé** : `estCodeOutremer` court-circuite tout chargement métropolitain.
5. **Pas de cache de réponse** : `Cache-Control: no-store`. Sans `cacheComponents`, une route `GET` à paramètres n'est pas mise en cache par Next (documentation Next 16, *Route Handlers*). Le levier simple est le CDN, par `Cache-Control: s-maxage`.
6. **Requêtes simultanées** :
   - les chargeurs d'index et de DRIAS partagent une seule promesse (`memoizePromise`, `indexPromise`) : des appels concurrents ne chargent qu'une fois ;
   - côté client, une réponse tardive d'une ancienne commune est rangée sous son propre code et ne s'affiche pas. Elle reste cependant demandée : aucune annulation (`AbortController`).
7. **Précédent en production** : l'accueil actuel passe déjà par `/qna` (DRIAS et GASPAR). La nouvelle route peut s'y substituer.

### Proposition : le plus petit ensemble de changements

| # | Changement | Effet attendu | Taille |
| --- | --- | --- | --- |
| 1 | Route publique `GET /api/accueil/lecture?insee&cle` : copie de la route du prototype sans la garde de production, région `cdg1` (Géorisques), validation stricte du code, identité par `communeCanonique` déplacée dans `src/lib/accueil/` | même comportement, public | petite |
| 2 | **« Petite ville » et « Hivers » sans le moteur complet** : appeler directement les fonctions pures sur l'entrée de l'index (`classifyAgglomerationSize`, convention de douceur), sans Géorisques ni radon | 2,9 s et 3 appels réseau → coût de l'index seul | moyenne : extraire l'évaluation d'un critère, tester l'égalité avec le moteur sur un panel |
| 3 | **Cache CDN** : `Cache-Control: public, s-maxage=86400, stale-while-revalidate=604800` sur les 200 ; `no-store` sur les erreurs et les « indisponible » dus à une panne GASPAR | une instance froide ne sert qu'une fois chaque couple commune × priorité | petite |
| 4 | **GASPAR** : délai de 3 s au lieu de 8 s, et réponse « indisponible » non mise en cache | aucune lecture bloquée longtemps | petite |
| 5 | **Client** : `AbortController` sur les lectures d'une commune quittée | moins de requêtes inutiles | petite |
| 6 | *(Option, à décider)* **Fichiers allégés générés au build** : identité (code → nom, environ 1 Mo) et chaleur de l'accueil (4 colonnes × 3 horizons, environ 3 Mo) | −1 Go de mémoire, premier appel en dizaines de ms | moyenne ; un **nouvel artefact**, donc soumis à décision |

**Tests à prévoir** :
- banc HTTP sur la route publique (identité, codes invalides et inconnus, outre-mer, PLM) ;
- égalité stricte entre la nouvelle lecture « taille » / « hivers » et le moteur, sur un panel de 200 communes ;
- en-têtes de cache par statut ;
- délai GASPAR simulé ;
- mesure à froid sur une préproduction.

**Non fait ici** : l'accueil public n'est pas activé.

## 4. FUT-106 et FUT-107 : ce qui reste aux tickets payants

Constaté dans le prototype et laissé tel quel, conformément à la décision du porteur :
- **FUT-106** :
  - le CTA « Examiner une adresse » est proposé pour toute commune ultramarine, Pirae compris ;
  - aucune route payante ne consomme SocleOM ;
  - `/dossier` et le checkout ne connaissent pas la couverture ultramarine ;
  - les autres thèmes ultramarins ne sont pas audités.
- **FUT-107** :
  - « futur•e ne les classe pas encore en favorable ou défavorable : les règles… » reste tel quel ;
  - « Hivers doux » outre-mer est indisponible et motivé ;
  - « Petite ville » outre-mer s'appuie sur la population communale, sans critère ;
  - la doctrine d'interprétation est à définir.

## 5. Points bloquants avant lancement

1. **Déployer le hotfix P0** (`hotfix/fut104-exposition-donnees-outremer`). La production sert encore de fausses projections ultramarines. Ne jamais revenir en arrière vers un déploiement antérieur.
2. **Exécuter FUT-108** après validation humaine.
3. **Fusionner dans l'ordre** : hotfix, puis consolidation FUT-104, puis FUT-50.
4. **Route publique** : changements 1 à 5, puis une décision sur l'option 6. Mesurer à froid en préproduction.
5. **FUT-106 et FUT-107** : bloquants pour toute offre ultramarine.
6. **Hors FUT-50** : transitions de l'en-tête global en mouvement réduit.

## Fichiers modifiés

| Fichier | Changement |
| --- | --- |
| `src/components/prototypes/fut50/c/identite.ts` | nouveau : identité partagée |
| `src/app/dev/fut50/api/commune/route.ts` | nouveau : confirmation |
| `src/app/dev/fut50/api/lecture/route.ts` | importe l'identité partagée |
| `src/components/prototypes/fut50/c/HeroLieu.tsx` | confirmation à jeton, défilement instantané en mouvement réduit, source passée par `fr()` |
| `src/components/prototypes/fut50/c/outremer.ts` | formulation GASPAR sourcée |
| `outremer.test.ts` | identité partagée, formulation |

**Bancs** : `verifier-identite-navigateur.mjs`, `verifier-clavier-mobile.mjs`, `mesurer-route-lecture.mjs`.

## Vérifications

- Suite complète : **2 666/2 666** (assertions ajoutées à des tests existants).
- `tsc` et `eslint` : OK.
- `next build --webpack` : OK (275 pages).
- En production, `/dev/fut50/c` et les deux routes du prototype renvoient 404.
- Bancs : identité HTTP 45/45, identité navigateur 9/9, clavier, mouvement réduit et viewports 40/40.
- **Environnement** : Chrome système en mode headless (le cache Playwright n'est plus présent sur la machine).
