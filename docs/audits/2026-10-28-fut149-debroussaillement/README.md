# FUT-149 · Le zonage du débroussaillement obligatoire (OLD) dans Autour et Logement

> 28/10/2026. Branche `bonjourfuturee/fut-149-debroussaillement`, partie de `main` 61dcaf15 (#107 inclus).
> Rien n'est fusionné, déployé ni publié ; aucune infrastructure créée.
>
> - `01-source.md` : la source, sa licence, sa nature juridique, sa couverture et ses dates par département.
> - `02-contre-epreuves.md` : lecture contre l'oracle (20 000 points), contre la carte officielle (300 points), contre
>   les arrêtés de classement (commune par commune), et les adresses de recette.
> - `captures/` et `recette-textes.json` : rendu réel, ordinateur (1 280 px) et mobile (390 px).

## Décision : **GO** pour la revue, sous deux conditions de mise en service

La source est ouverte (Licence Ouverte 2.0), récente (édition du 01/03/2026), couvre **exactement** les 52
départements des arrêtés de classement en vigueur, et l'application la lit sans écart (20 000 / 20 000 points
contre les polygones d'origine, 300 / 300 contre le service officiel). Une seule contradiction avec les arrêtés
(trois communes du Vaucluse), neutralisée en « incertain ». Le seuil de NO GO (« zonages trop incomplets ou
contredisant les arrêtés dans des cas significatifs ») n'est pas atteint.

Mise en service, hors de cette PR :
1. **Créer le bucket privé `debroussaillement`** sur Supabase Storage (Free, aucun coût), y publier l'édition
   (`scripts/debroussaillement/publier.mjs envoyer`, puis `basculer`), d'abord sur le projet de test.
2. **Définir `DEBROUSSAILLEMENT_BUCKET=debroussaillement`** sur Vercel. Sans cette variable, rien n'est lu ni
   affiché : la PR peut être fusionnée et déployée sans effet visible.

## Ce que le lecteur obtient

| | Autour (le secteur, point seul) | Logement (le bien) |
|---|---|---|
| Question | « Ce secteur est-il dans le zonage publié ? » | « Ce terrain est-il dans le zonage publié, et que dois-je vérifier ? » |
| Place | Bloc sous le bruit des avions | Section « Statut réglementaire à cette adresse », après le bruit aérien |
| Grain | Point du dossier | Parcelle si rattachée au point, unique, mesurable et géocodée au numéro ; sinon le point, dit |
| Vérification | Règles du préfet en mairie / préfecture ; zonage officiel | Zonage officiel (Géorisques), arrêté du préfet, état des risques du vendeur ou du bailleur, entretien fait |
| Jamais | parcelle, vendeur, état des risques | un nombre de mètres pour ce propriétaire, un certificat, « pas d'obligation » |

Aucun score, aucun critère de Projet, aucune alerte, aucune synthèse IA, aucun appel au modèle (l'empreinte de la
synthèse ne voit pas le champ). La méthode, la règle générale (50 m, 200 m), le décret et les dates sont dans
« En savoir plus ».

### Les états

| État | Quand | Phrase (Logement, parcelle) |
|---|---|---|
| `en_zone` | parcelle dans le zonage à plus de 98 % ; point à plus de 50 m d'une limite, dedans | « Selon le zonage publié par l'État, la parcelle est dans une zone où le débroussaillement est obligatoire. Qui doit l'entretenir dépend de la situation (le plus souvent le propriétaire de la construction)… » |
| `en_limite` · à cheval | parcelle dedans pour 2 à 98 % | « …environ 19 % de la parcelle est dans une zone… : selon les règles qui s'appliquent à ce terrain, tout ou partie du bien peut être concerné. » + vérification des règles en mairie |
| `en_limite` · bordure | moins de 2 %, ou contact | « La parcelle ne touche qu'en bordure une zone… (environ 40 m²) » / « touche la limite » |
| `en_limite` · proche | sans contact, à moins de 50 m | « La parcelle est à environ 20 m d'une zone… » |
| `hors_zone` | département couvert, rien à moins de 50 m | « La parcelle n'est pas dans le zonage… publié pour ce département. » + « de petits bois peuvent y manquer » |
| `non_couvert` | département sans zone publiée (ou commune inconnue) | « La base nationale… ne contient aucune zone pour ce département : rien n'en est conclu pour ce logement. » |
| `incertain` | objet à diffusion ambiguë ; commune exclue par l'arrêté ; géométrie non mesurable | « …ne permet pas de conclure pour ce logement : [cause]. » |
| `indisponible` | Storage muet, tuile tronquée, délai | « Le zonage… n'a pas pu être lu pour ce logement. » ; actualisation refusée |

Conventions (`fut149-1`) : seuils de FUT-81 dans les deux sens (2 % ; 98 % ; contact 0,05 m² ; surface dite à
partir de 25 m²), limite proche 50 m (valeur arbitrée pour FUT-146), cartes des bois dites anciennes au-delà de
dix ans. Une parcelle à cheval est « en limite », pas « en zone » : l'obligation suit les constructions, dont
l'emplacement n'est pas connu (choix fait sur les cas réels de Gonfaron, Fréjus, Cazaux et Nîmes, à valider en revue).

## Architecture

```
GeoPackage IGN (1,76 Go)  ──  scripts/debroussaillement/construire.py  (Python, versions épinglées, 3 min)
   contrôles : 52 départements = arrêtés ; validité ; surface conservée ; exclusions des arrêtés
            │
   <édition>/manifest.json  +  <édition>/t/<ix>_<iy>.json.gz   (2 453 tuiles de 0,1°, 32,8 Mo, médiane 8,8 Ko)
            │  scripts/debroussaillement/publier.mjs  (préfixe neuf, empreintes relues, pointeur écrit en dernier)
   Supabase Storage, bucket privé `debroussaillement`  (non créé)
            │
   src/lib/server/debroussaillement-tuiles.ts   (pointeur et manifeste 10 min en mémoire, 64 tuiles, 4 s, ne lève jamais)
            │
   src/lib/debroussaillement.ts   (pur : point, parcelle, coupes de tuile, départements, exclusions)
      │                                         │
   /api/georisques-logement (parcelle)       autour-response.ts (point, relu au rendu)
   LogementReport.debroussaillement (figé)   AutourResponse.debroussaillement
      │                                         │
   src/lib/debroussaillement-texte.ts   (pur : ce que l'écran dit)  →  DebroussaillementBlocs.tsx
```

**Pourquoi hors de Vercel.** 4 237 zones, 9,5 millions de sommets : même découpée, la géométrie pèse 32,8 Mo
compressés. L'embarquer dans les fonctions de Logement et d'Autour (comme les 11,8 Mo du bruit aérien) aurait
défait #106/#107. Un appel au WFS à chaque dossier aurait été plus simple (105 ms), mais dépendant d'un service
déjà vu en panne (FUT-146) et ne donnant pas l'aire d'intersection. Même patron que la fibre (FUT-156, #108).

**Les coupes de tuile.** Une zone coupée par la grille garde des arêtes posées exactement sur une droite de la
grille ; la lib les écarte avant toute distance (sinon un point au milieu d'une forêt serait « en limite »).
Une cellule entièrement couverte n'a pas de fichier (« pleine », 40) ; une cellule absente du manifeste ne
contient aucune zone (absence établie) ; une tuile listée et non lue est une panne.

**Arrondi.** Coordonnées WGS84 en entiers de 1e-7 degré, arrondies par GEOS (`set_precision`) : l'arrondi sommet
par sommet créait 26 polygones invalides (jusqu'à 72 km²), qui auraient rendu des communes entières « incertaines ».

## Mesures et coûts

| | Mesure |
|---|---|
| Fonctions Vercel (build de production, tête contre `main`) | `/api/georisques-logement` 157 → 158 fichiers, 22,76 → 22,77 Mo ; `/api/logement-autour` 2 368 → 2 369 ; `/rapport/autour` 177 → 178. Le fichier ajouté est le code compilé ; **aucune donnée**, aucun glob `data/**`. La page de banc `/dev/fut149` (404 en production) embarque ses fixtures (0,35 Mo), comme `/dev/fut146`. |
| Lecture par analyse | 1 à 4 tuiles, 8,8 Ko médiane, 128 Ko au plus ; calcul 2 ms (tuiles en mémoire). Latence Storage mesurée par FUT-156 : 81 ms médiane, 692 ms à froid (pointeur, manifeste, tuile). En parallèle des ~14 sources du Logement. |
| Stockage | 32,8 Mo par édition ; deux éditions gardées : 66 Mo du quota Free de 1 Go, **partagé** entre test et production et avec la fibre (≈ 150 Mo). |
| Egress | Autour relit au rendu (tuile gardée en mémoire de l'instance) ; ordre de grandeur 10 à 40 Ko par ouverture : 5 Go/mois couvrent plus de 100 000 lectures. |
| Construction | 3 min (Python), 590 Mo à télécharger. Envoi : ~2 450 objets, à mesurer à la première publication. |
| Coût monétaire | Nul (Free). Aucun achat, aucun changement de tarif. |
| Maintenance | Une édition IGN tous les 6 à 12 mois (5 en 3 ans) ; contre-épreuve des arrêtés à rejouer à chaque édition et à chaque arrêté ministériel. |

## Recommandation d'actualisation

- **Surveiller** le flux `data.geopf.fr/telechargement/resource/DEBROUSSAILLEMENT` une fois par mois (nouvelle
  `editionDate`) et le Journal officiel (arrêté modifiant celui du 6 février 2024 : 2025, 2026…).
- **Reconstruire** à chaque nouvelle édition : `construire.py` (refuse un écart avec la liste des départements des
  arrêtés), `scripts/research/fut149/` (oracle, arrêtés), mise à jour d'`exclusions-arretes.json`, `publier.mjs
  envoyer`, puis `basculer`. Retour arrière : `basculer --edition <précédente>`.
- **Un rapport Logement** reste figé dans sa version (la lecture fait partie du rapport) ; **Autour** relit
  l'édition courante et affiche sa date.

## Recette

- **Tests** : `src/lib/fut149-debroussaillement.test.ts`, 80 tests (géométrie synthétique : contact, 1 cm, liseré,
  coupe de tuile, vraie limite alignée sur la grille, cellule pleine, parcelle invalide, voisine, point hors de la
  parcelle, rue, immense ; départements ; pannes et versions ; textes rendus et interdits ; lecteur Storage ; 24
  adresses réelles contre deux oracles) et `scripts/debroussaillement/publier.test.mjs`, 8 scénarios de
  publication sur Storage simulé. Suite complète, seule, `--test-concurrency=1`, après réintégration de `main`
  (#108, #110, #112) : `main` 3 826 → tête 3 914 (+88), 0 échec. `tsc` propre ; ESLint identique à `main` (6 erreurs
  et 8 avertissements préexistants ; 0 erreur dans les fichiers de la PR).
- **Rendu** : banc `/dev/fut149?vue=section|autour|logement&cas=…` capturé par Chrome sans interface
  (`scripts/research/fut149-captures.mjs`) : 16 cas × 2 largeurs, **aucun défilement horizontal**, bloc à 814 px
  (bureau) et 300 px (mobile) dans la section Logement, 1 044 / 350 px dans Autour ; un rapport antérieur n'affiche
  rien. Textes affichés : `recette-textes.json` (le dépliable, fermé, n'y figure pas).
- **Non-régression** : danger météorologique (DRIAS) et incendies observés (BDIFF) intouchés (aucun de leurs
  fichiers modifié) ; bruit aérien : seule l'exportation de son corps de bloc (`CorpsZonage`) change. Les tests
  FUT-146 et FUT-147 (92) passent, comme toute la suite.

## Revue du 28/10/2026 : trois corrections de restitution

| Demande | Correction |
|---|---|
| Parcelle à cheval : pas seulement l'emplacement des constructions (L134-6, 3° : en zone urbaine, le terrain) | Part gardée ; « selon les règles qui s'appliquent à ce terrain, tout ou partie du bien peut être concerné » ; vérification : « l'obligation peut viser les abords des constructions ou, en zone urbaine, le terrain lui-même » |
| 50 → 100 m : le maire (1° de L134-6) | Règle générale : « en général sur 50 m, que le maire peut porter à 100 m » ; vérifications : « arrêté du préfet, décisions du maire sur la distance » |
| Responsable selon L134-8 | « L'entretien est à la charge du propriétaire » retiré ; « Qui doit l'entretenir dépend de la situation (le plus souvent le propriétaire de la construction) : l'arrêté du préfet et la mairie le précisent » |

Validés par la revue : « en limite » pour les parcelles à cheval, le cas de Gonfaron, le décret n° 2024-405.
Géométrie, tuiles et états inchangés : seuls les textes et leurs tests changent.

## Revue indépendante du 29/10/2026 (NO GO sur `4f27d07d`) : corrections

| Point | Défaut | Correction | Preuve |
|---|---|---|---|
| 1. Frontières alignées sur la grille (bloquant) | Toute arête posée sur le bord d'une cellule était écartée comme coupe de tuile, y compris une vraie limite : un point à 10 m pouvait être « en zone » ou « hors zone » | L'arête n'est écartée que là où la cellule voisine est couverte juste de l'autre côté (examen tous les ~5 m ; cellule absente = vraie limite ; cellule non chargée = vraie limite, par prudence) | 5 tests (vraie limite à 10 m des deux côtés, coupe contre une cellule pleine, couverture partielle de l'autre côté, autre objet de l'autre côté, parcelle contre la limite) : **échouent sur `4f27d07d`**, passent sur la tête. Édition nationale : 64 220 km d'arêtes alignées, **vraies limites alignées : 3 segments de 1 à 3 cm** (`scripts/research/fut149/limites-alignees.mjs`) : aucune lecture réelle ne change |
| 2. Publication atomique (bloquant) | `envoyer` pouvait remplacer le manifeste d'une édition active (dépôt `x-upsert: true`) | Aucun remplacement hors `courant.json` (le client le refuse) ; manifeste et tuiles déjà en ligne : identiques à l'octet, sinon refus **avant toute écriture** ; reprise idempotente ; contenu nouveau sous une révision `AAAA-MM-JJ.N` (`construire.py --revision`) ; bascule après vérification de toutes les empreintes | `publier.test.mjs`, 8 scénarios avec le vrai publieur et le vrai lecteur : republication différente (manifeste seul, ou tuile) sous l'édition active refusée, zéro écriture, lecteurs inchangés ; reprise identique sans dépôt ; envoi coupé après une tuile : lecteurs inchangés, bascule refusée, reprise aboutie ; tuile corrompue : bascule refusée. Rejoué sur `4f27d07d` : **6 échecs sur 7**, dont « Missing expected rejection » pour le manifeste seul (l'ancien code le remplaçait) |
| 3. Attribution des parcelles | `rattachement: "point"` suffisait | Le point doit être **dans** la parcelle (`classer`, tolérance nommée `TOLERANCE_POINT_PARCELLE_M` = 1 cm, celle de FUT-81) ; dehors : `hors_point` ; sur le trait : `limite` ; lecture au point, dite | Tests : parcelle voisine marquée « point » (zonage de la voisine jamais attribué), point sur le trait, oracle indépendant sur les 24 adresses réelles (aucune parcelle attribuée sans contenir le point). Seul changement réel : **Bordeaux, place de la Bourse**, point à **8 mm** du tracé, un seul candidat transmis : lu au point (reste « hors zone ») |
| 4. Précision juridique | Les deux obligations étaient fondues dans une phrase | « deux obligations distinctes » : abords des constructions (50 m, que le maire peut porter à 100 m, propriétaire des constructions) ; terrains en zone urbaine d'un PLU (terrain entier, quelle que soit cette distance, propriétaire du terrain) ; « selon le zonage **informatif** publié par l'État » | Texte relu dans l'édition consolidée du code forestier (13/10/2026) ; tests éditoriaux dédiés |

Cas réels rejoués avant/après (Gonfaron, Fréjus, Cazaux, Nîmes, Saint-Denis-d'Oléron et les 19 autres) : états et
parts identiques, sauf Bordeaux (grain parcelle → point, même état). Aucune attribution voisine dans Logement.

## Réserves

1. **Décret n° 2024-405** : référence vérifiée sur Légifrance par la revue du 28/10/2026.
2. **Dates d'arrêté** : la base date trois arrêtés de 2011-2013 (Ardèche, Isère, Loire) ; neuf départements n'en ont
   pas. L'écran dit « date indiquée par la base ».
3. **Parcelle à cheval = en limite** : validé par la revue du 28/10/2026.
4. **Banc** : le module Logement complet déborde dans les bancs (défaut antérieur, cf. FUT-146) ; captures faites
   sur la section seule.
5. **Bloc Autour** : grammaire historique de l'écran qui l'accueille (exception déclarée au cliquet du Relevé,
   comme FUT-146), à migrer avec FUT-118.
6. **PR #108 (FUT-156)** : fusionnée sur `main` le 28/10/2026, réintégrée ici. Quatre conflits, tous additifs,
   résolus en gardant les deux côtés (`route.ts`, `LogementModule.tsx`, `logement-report-types.ts`,
   `logement-report-version.ts`) ; contre `main`, seules les deux lignes de déstructuration de la route sont
   réécrites (`…, bruitAerien, debroussaillement, fibre]`) ; les fichiers de la fibre sont identiques à `main`.
