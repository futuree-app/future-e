# FUT-138 · Les ventes à proximité de l'adresse, dans « Autour » (03/11/2026, mis à jour pour la contre-revue)

Preuves jointes (même dossier) :
- `…-recette.json` : 13 contextes réels, contre-épreuve sur les fichiers DVF bruts, référence communale vs index ;
- `…-diagnostic.json` : géolocalisation, volumes, découpage ;
- `…-lecture.json` : coût et latence d'une lecture à froid et à chaud ;
- `…-voisins.json` : interrogations répétées de carrés voisins ;
- `…-captures/` : rendu réel du module Autour, bureau (1 280 px) et mobile (390 px), 7 états chacun.

## 1. Décisions du porteur appliquées

| Échelle | Prix affichés | Question |
|---|---|---|
| Territoire | marché de la commune (inchangé) | « Combien coûtent les logements dans cette ville ? » |
| **Autour** | **ventes à proximité** : médiane, fourchette, écart observé avec la commune | « Ce secteur se vend-il plus cher que le reste de la ville ? » |
| Logement | **aucun** (module identique à `main`) | « Que dois-je savoir sur ce logement ? » |

- Périmètre principal 500 m ; 1 km puis 2 km seulement s'il manque des ventes, **dit en premier** (« ces ventes décrivent un secteur plus large que le voisinage immédiat »).
- Médiane à partir de 10 ventes ; avertissement sous 20 ; écart avec la commune à partir de 20 ; quartiles à partir de 30 ; sous 10 ventes à 2 km, « pas de médiane locale », sans repli communal.
- **Écart OBSERVÉ, jamais qualifié** (décision du 03/11) : « Écart observé avec la médiane de La Rochelle (5 000 €/m², échelle : commune, 3 707 ventes) : +350 €/m², soit +7 %. » La méthode précise : « un écart observé entre deux médianes, pas la preuve que les deux marchés diffèrent ». L'intervalle de confiance a été retiré du code.
- Type filtré si le diagnostic **confirmé** dit explicitement maison ou appartement au grain du logement ; sinon **les deux marchés séparés** (validé par le porteur).
- Dossier d'adresse payant seulement.

## 2. Corrections de cette passe

1. **Phrase des 100 m** : « deux adresses situées dans le même carré d'environ 100 m lisent exactement les mêmes ventes » (la condition est le carré, pas la distance). Code, méthode affichée et ce document.
2. **Écart observé** au lieu de « plus cher / proche / net » (ci-dessus).
3. **Lecture à froid allégée** : le manifeste national (2,4 Mo) et le fichier communal (572 Ko) sont découpés. Le manifeste ne liste plus que 260 blocs (~50 km, 40 Ko) ; chaque bloc liste ses tuiles (~11 Ko) ; la référence communale est par département (96 fichiers, ~6 Ko).
4. **Lecture différée** : le bloc est rendu par un composant serveur dans sa propre frontière de Suspense (`VentesAutourServeur`) ; la page Autour ne l'attend plus. Au-delà de 6 s, il dit l'indisponibilité.
5. **Défaut trouvé par la recette visuelle, aussi présent dans la PR du 02/11** : l'« espace insécable » des nombres était une espace ordinaire, dans `prix-autour-texte.ts` et dans `prix-immobiliers.ts` (carte Territoire, ligne du comparateur) ; sur mobile, « 4 507 €/m² » se coupait en « 4 » / « 507 €/m² ». Corrigé (U+00A0), et deux tests vérifient désormais le caractère réel (les tests précédents normalisaient les espaces, d'où l'angle mort).

## 3. Coût et latence d'une lecture Supabase à froid (point 2 du porteur)

Le vrai lecteur (`lireVentesAutour`) contre une imitation locale du stockage, sur les 12 points distincts de la recette :

| | À froid (instance neuve) | À chaud |
|---|---|---|
| Requêtes | 3 à 8 | 0 (déjà vu) |
| Octets | 45 à 130 Ko | 0 |
| Calcul | — | 1,7 ms (médiane), 2,5 ms (max) |
| Étapes réseau successives | 4 : pointeur → manifeste → index de bloc + fichier communal → tuiles | — |

Avant le découpage : environ 3 Mo à froid (manifeste 2,4 Mo + communes 572 Ko).

Latence réseau réelle de Supabase Storage, mesurée en **lecture seule** sur le bucket privé déjà en production `debroussaillement` (objets de tailles comparables), depuis un poste en France, 12 séries : petite requête fraîche 130 ms (médiane), tuile non encore en cache 318 ms, quatre tuiles en parallèle 302 ms (médiane), 726 ms (9e décile). **Lecture à froid estimée : environ 1,0 s en médiane, 2,0 s au 9e décile.** Les fonctions tournent à Paris (`cdg1`) ; l'ordre de grandeur devrait être comparable ou meilleur. Grâce au point 4, cette latence ne retarde pas la page.

Coût : quelques dizaines de Ko de sortie de stockage par dossier ouvert à froid, rien à chaud. Mille ouvertures à froid représentent environ 130 Mo, négligeable au regard du quota Supabase. Stockage : 12,3 Mo par édition.

## 4. Interrogations répétées de carrés voisins (point 3)

Mesure sur les tuiles réelles : grilles de 41 × 41 carrés (~4 km) autour de trois points ; pour chaque paire de carrés voisins, on cherche les paires « isolantes », où l'ensemble lu par l'un contient exactement celui de l'autre plus **une seule** vente.

| Zone | Paires voisines | Isolantes | Dont un chiffre publié change | Écart max de médiane |
|---|---|---|---|---|
| La Rochelle, centre | 6 312 | 104 (1,6 %) | 69 | 550 €/m² |
| Paris 11e | 6 038 | 430 (7,1 %) | 378 | 1 500 €/m² |
| Royère-de-Vassivière (rural) | 2 622 | 464 (17,7 %) | 206 | 350 €/m² |

**Constat honnête : la protection n'est pas absolue.** Deux dossiers payés sur deux carrés voisins bien choisis peuvent situer une vente par rapport à la médiane, et, quand l'effectif est petit et impair, approcher son prix à la classe et à l'arrondi près (environ ±2 % et ±50 €/m²).

Ce qui limite le risque :
- il faut deux dossiers payés (2 × 39 €) par vente visée, sur des adresses réelles ;
- aucune route n'accepte de coordonnées ;
- le stockage ne contient ni adresse, ni date, ni surface, ni parcelle ;
- la base source publie déjà chaque vente avec son adresse et son prix (DVF Etalab, consultable sur une carte publique). L'information obtenue n'est donc pas nouvelle ; la restriction DVF vise la réidentification des **personnes**, qu'aucune donnée de futur•e ne permet.

Parade mesurée, **non appliquée** (choix porteur) : un centre de lecture par bloc de 300 m au lieu de 100 m fait tomber les paires isolantes à 0,8 % (La Rochelle) et 1,4 % (Paris), mais seulement à 15,7 % en rural, au prix d'un « 500 m » moins centré sur l'adresse (jusqu'à environ 210 m d'écart).

## 5. Droits d'accès (point 3)

- Un dossier d'adresse n'est créé que par le webhook Stripe après paiement (`address_dossiers`, upsert sur le PaymentIntent) ou par la route d'administration (démonstrations).
- `/rapport/autour` exige une session (`requireCurrentUser`), n'ouvre que `getDossier(supabase, user.id, id)` (compte connecté, dossier non révoqué), sinon redirige ; la position lue est celle du dossier.
- Verrouillé par `src/lib/prix-autour-acces.test.ts` :
  - le lecteur des tuiles n'est importé que par `VentesAutourServeur` et le banc de recette, qui renvoie une 404 en production ;
  - `VentesAutourServeur` n'est monté que par la page Autour et le banc ;
  - aucune `route.ts` ne touche aux ventes ;
  - le module client ne lit rien.
- Le Pass territoire (14 €) ne crée pas de dossier : il ne donne pas accès au bloc.

## 6. Recette du rendu réel (point 4)

Le **vrai** `AutourModule`, avec le bloc rendu par `VentesAutourServeur` en Suspense (comme en production), contre l'imitation locale du stockage, via `next dev` et Chrome sans fenêtre. Captures dans `…-captures/`, à 1 280 px et 390 px :

| État | Bureau | Mobile |
|---|---|---|
| La Rochelle, appartement (écart, fourchette) | ✓ | ✓ |
| Paris 11e, maison (périmètre élargi à 2 km, dit) | ✓ | ✓ |
| Limite La Rochelle / Aytré (74 maisons, dont 50 à Aytré) | ✓ | ✓ |
| Montagne, pas de médiane locale | ✓ | ✓ |
| Strasbourg, hors DVF | ✓ | ✓ |
| Type inconnu, deux marchés | ✓ | ✓ |
| Lecture en panne (« n'ont pas pu être lues ») | ✓ | ✓ |

Aucun débordement horizontal dans les 14 cas. Secteurs à plusieurs communes : la contre-épreuve brute ventile les ventes par commune (Aytré 50 / La Rochelle 24 ; Lyon 3e 269 / 6e 48 ; Paris 20e 476 / Bagnolet 2). Le bloc ne nomme pas les communes voisines ; la méthode dit qu'elles comptent.

## 7. Données, reproductibilité, recette réelle

- 3 297 971 ventes (le même ensemble que l'index), dont 99,31 % géolocalisées ; aucun empilement de parcelles différentes au même point ; 21 130 tuiles.
- Deux constructions successives donnent le même manifeste (empreinte dans `…-diagnostic.json` et section 9).
- Référence communale publiée identique à l'index pour 34 788 communes sur 34 788.
- Recette sur 13 contextes : effectifs identiques au recomptage brut, médiane à moins de 2 % de la médiane exacte.

## 8. Function Storage (`next build` local, aucun déploiement)

| Fonction | Avant la PR (`d31e894d`) | Maintenant | Fichiers de ventes |
|---|---|---|---|
| `/rapport/autour` | 178 fichiers, 21,7 Mo | 181 fichiers, 21 739 206 octets | aucun |
| `/rapport/logement` | — | 85,3 Mo, module identique à `main` | aucun |

## 9. Livraison unique en production (sur GO final, dans cet ordre)

1. Supabase (production), à la main : créer le bucket **privé** `prix-autour`.
2. Construire l'édition (reproductible) : `node --max-old-space-size=8192 scripts/dvf-autour/construire.mjs`.
3. Publier puis basculer, avec `PRIX_AUTOUR_SUPABASE_URL` et `PRIX_AUTOUR_SUPABASE_CLE` du projet de production :
   - `node scripts/dvf-autour/publier.mjs envoyer --cible production --confirmer-production --source data/cache-logement/dvf-autour/2026-10-20` ;
   - `node scripts/dvf-autour/publier.mjs basculer --cible production --confirmer-production --edition 2026-10-20` ;
   - `node scripts/dvf-autour/publier.mjs etat --cible production` doit afficher le pointeur sur `2026-10-20`.
4. Vercel, variables de **Production** : ajouter `PRIX_AUTOUR_BUCKET=prix-autour`.
5. Fusionner la PR #125 sur `main` : un seul déploiement de production, aucune Preview.
6. Contrôle après mise en ligne : ouvrir `/rapport/autour` d'un dossier payé et vérifier que le bloc apparaît, puis comparer ses chiffres avec ceux de la recette pour le même secteur.

Retour arrière :
- retirer `PRIX_AUTOUR_BUCKET` : le bloc disparaît, sans autre effet ;
- ou basculer le pointeur sur une autre édition.

## 10. Réserves

1. Interrogations de carrés voisins : risque résiduel décrit en section 4, à accepter ou à réduire par la lecture par bloc de 300 m.
2. Latence à froid : environ 1 s en médiane, sans effet sur l'affichage de la page.
3. Une nouvelle livraison DVF exige de régénérer l'index puis les tuiles, sous une nouvelle édition ; la construction refuse un index d'une autre livraison.
