# FUT-138 · Les ventes à proximité de l'adresse, dans « Autour » (03/11/2026)

Dossier de contre-revue. Preuves jointes :
- `2026-11-03-fut138-ventes-autour-recette.json` : 13 contextes réels, avec contre-épreuve sur les fichiers bruts ;
- `2026-11-03-fut138-ventes-autour-diagnostic.json` : mesures de la géolocalisation et du volume des tuiles.

## 1. Décisions du porteur appliquées

| Échelle | Ce qu'elle dit des prix | Question du lecteur |
|---|---|---|
| Territoire | prix de vente et loyers de la commune, maille réelle, effectifs, limites (inchangé, PR du 02/11) | « Combien coûtent les logements dans cette ville ? » |
| **Autour** | **les ventes à proximité de l'adresse, leur dispersion, leur écart avec la commune** | « Les logements se vendent-ils plus cher dans ce secteur que dans le reste de la ville ? » |
| Logement | **aucun prix** : la section « Le marché immobilier de la commune » est retirée (elle répétait Territoire) | « Que dois-je savoir sur ce logement lui-même ? » |

Conventions (porteur, 03/11) : périmètre principal 500 m ; 1 km puis 2 km seulement s'il manque des ventes, **avec mention explicite** que ces ventes décrivent un secteur plus large que le voisinage immédiat ; 10 ventes pour une médiane ; avertissement sous 20 ; écart à la commune qualifié à partir de 20 ; quartiles à partir de 30 ; moins de 10 ventes à 2 km : **pas de médiane locale, sans revenir au chiffre communal**. Visible dans le dossier d'adresse payant seulement (la page Autour exige un dossier).

Le type de logement **filtre** les ventes quand le diagnostic énergétique **confirmé** dit explicitement « maison » ou « appartement » au grain du logement. Sinon (pas de diagnostic confirmé, diagnostic d'immeuble, type ambigu ou contradictoire), **les deux marchés sont présentés séparément**, titrés, sans rien deviner. *Choix à valider par le porteur* : on aurait pu ne rien afficher ; présenter les deux marchés ne déduit aucun type et reste une information de secteur.

## 2. Ce qui est construit

| Fichier | Rôle |
|---|---|
| `src/lib/prix-autour.ts` | pur : carrés de ~100 m, classes de prix de 2 %, rayon progressif, médiane, quartiles, marge d'incertitude, validation des tuiles |
| `src/lib/prix-autour-texte.ts` | pur : type du logement (ou abstention), phrases du bloc |
| `src/lib/server/prix-autour-tuiles.ts` | lecture des tuiles et de la référence communale sur Supabase Storage (bucket privé), pointeur + manifeste + SHA-256, mémoire d'instance ; ne lève jamais |
| `src/components/report/VentesAutourBloc.tsx` | le bloc « Les ventes à proximité » du module Autour, écrit dans le Relevé (grain « secteur ») |
| `src/app/(account)/rapport/autour/page.tsx` | lit les ventes à la position **enregistrée** du dossier, le type depuis le diagnostic **enregistré et confirmé** |
| `scripts/dvf-autour/construire.mjs` | construit les tuiles depuis le **même ensemble de ventes** que l'index des communes (`agregerDvf`, fichiers épinglés), et `communes.json.gz`, la référence communale recopiée de l'index (refus si l'index n'est pas de la même livraison) |
| `scripts/dvf-autour/publier.mjs` | publication (bucket privé, sans écrasement, bascule par pointeur) ; **non exécuté** |
| `scripts/dvf-autour/recette.mjs`, `serveur-local.mjs` | recette réelle et contre-épreuve ; imitation locale du stockage pour `next dev` |
| `src/app/dev/fut138/page.tsx` | banc visuel (404 en production) |

`scripts/lib/dvf-prix.mjs` rend en plus la position de la parcelle (`lon`, `lat`) ; `agregerDvf` accepte un rappel par vente retenue. **L'index des communes ne change pas** (aucune ligne de calcul touchée).

## 3. Données

- 3 297 971 ventes retenues (identique à l'index), dont **3 275 379 géolocalisées (99,31 %)** ; 22 589 sans position sont exclues de la lecture à proximité (elles restent dans la médiane communale) ; 3 positions hors métropole écartées.
- **Aucun empilement suspect** : aucun point où 5 ventes ou plus sont sur des parcelles différentes. La géolocalisation n'a donc pas de repli « centre de commune ».
- Distance d'une vente au centre de sa commune : médiane 1,3 km, 99 % sous 6,9 km, une seule au-delà de 20 km.
- Tuiles : **21 130 fichiers, 11,6 Mo au total**, médiane 312 octets, maximum 32 Ko. Un rayon de 2 km lit au plus 4 tuiles.
- Référence communale : `communes.json.gz`, 572 Ko, 34 788 communes, **identique à l'index pour 34 788 sur 34 788** (vérifié par la recette).
- **Reproductible** : deux constructions successives donnent le même manifeste, `3f142a593dbf6a4d893ae4d672f5196f31306c083cadfd8775e4f9ee4f89efcd`.

## 4. Les conditions du porteur, une par une

1. **Ventes au-delà des frontières communales** : les tuiles ne connaissent pas les communes. Prouvé par la contre-épreuve : à la limite La Rochelle / Aytré, 50 des 74 maisons comptées sont à Aytré ; Lyon 3e compte 48 ventes du 6e ; porte de Bagnolet, 2 ventes de Bagnolet.
2. **Imprécision de la géolocalisation** : position = parcelle (Etalab), ramenée au centre d'un carré d'environ 100 m ; une vente est comptée si le centre de son carré est dans le rayon, donc jamais à plus de rayon + 71 m. Le texte dit « environ », la méthode le dit en clair. Mesures ci-dessus.
3. **Type non déduit d'un diagnostic ambigu** : statut confirmé exigé (`auto_confirmed`, `user_confirmed`), grain logement (`dpe-grain.ts`), `type_batiment` explicite ; la méthode seule ne suffit pas ; contradiction = abstention. Testé.
4. **Aucune estimation** : ni surface, ni montant total, ni « votre logement » ; tests de doctrine sur toutes les sorties (aucun « € » qui ne soit pas « €/m² », aucun « 100 m² », aucun « vaut », « estimation »…). Logement n'affiche plus aucun prix.
5. **Réidentification et requêtes successives** :
   - les tuiles ne gardent aucune vente : un histogramme par carré et par type, classes de 2 % ; ni date, ni surface, ni adresse, ni parcelle, ni prix exact ;
   - le centre de lecture est le centre du carré de l'adresse : deux adresses à moins de 100 m lisent les mêmes ventes (testé) ;
   - les chiffres publiés sont arrondis à 50 €/m², jamais sous 10 ventes, aucune vente montrée seule ;
   - le calcul est fait par la page serveur, sur la position enregistrée d'un dossier payé : **aucune route n'accepte de coordonnées** venues du navigateur ;
   - bucket privé, lu avec la clé serveur ; **aucune tuile réelle dans le dépôt public** (les tests utilisent des tuiles fabriquées) ;
   - limite assumée : deux dossiers payés sur deux carrés voisins voient deux ensembles qui diffèrent d'une couronne de carrés. La différence de deux médianes arrondies, sur des classes de 2 %, ne restitue pas le prix d'une vente.
6. **Rien dans les fonctions Vercel** : aucun fichier de ventes dans `outputFileTracingIncludes`, le lecteur ne lit pas le disque ; mesure de compilation en section 6.
7. **Contextes testés** : section 5.

## 5. Recette réelle (tuiles construites) et contre-épreuve brute

Pour chaque point, le nombre de ventes lu dans les tuiles est **identique** au recomptage direct dans les fichiers DVF, avec la même règle d'appartenance. L'écart de médiane, dû aux classes de 2 % et à l'arrondi à 50 €/m², reste sous 2 %.

| Contexte | Rayon | Ventes | Médiane (tuiles / exacte) | Lecture |
|---|---|---|---|---|
| La Rochelle, Vieux-Port, appart. | 500 m | 543 | 5 350 / 5 317 | +7 % que la commune (net) |
| La Rochelle, Laleu, maison | 500 m | 62 | 3 000 / 2 973 | −33 % (net) |
| Lyon 3e, Part-Dieu, appart. (dense) | 500 m | 317 | 4 750 / 4 787 | proche (non net) |
| Paris 11e, appart. | 500 m | 2 573 | 10 300 / 10 218 | proche (non net) |
| Paris 11e, maison | **2 km** (élargi, dit) | 85 | 12 050 / 12 071 | proche de toute la ville de Paris |
| Limite Paris 20e / Bagnolet | 500 m | 478 | 8 250 / 8 333 | −5 % (net) |
| Limite La Rochelle / Aytré, maison | 500 m | 74 | 3 800 / 3 820 | −16 % (net) |
| Rural, Royère-de-Vassivière, maison | 500 m | 17 | 950 / 933 | avertissement, non comparé |
| Rural, Royère, appart. | 2 km | 2 | — | pas de médiane locale |
| Montagne, Saint-Christophe-en-Oisans | 2 km | 3 | — | pas de médiane locale |
| Strasbourg (hors DVF) | — | 0 | — | raison dite (livre foncier) |
| L'Oie, appart. | 2 km | 2 | — | pas de médiane locale |
| Diagnostic d'immeuble (type inconnu) | 500 m | 543 + 34 | — | deux marchés séparés |

« Net » : la médiane de la commune sort de la marge d'incertitude de la médiane locale (intervalle de confiance à 95 %, par les rangs). **Convention à valider par le porteur** : elle évite un seuil arbitraire en pourcentage, mais à Paris un écart de quelques pourcents peut être net avec des milliers de ventes ; le pourcentage est alors affiché pour que le lecteur juge de son ampleur.

## 6. Function Storage (compilation locale, aucun déploiement)

`next build` local (aucun déploiement), fichiers que Vercel embarque par fonction (`page.js.nft.json`) :

| Fonction | Avant (tête de PR du 02/11, `d31e894d`) | Après | Fichiers de ventes |
|---|---|---|---|
| `/rapport/autour` | 178 fichiers, 21,7 Mo | 179 fichiers, 21,7 Mo (un fichier de code) | **aucun** |
| `/rapport/logement` | inchangée par rapport à `main` (module Logement remis à l'identique) | 85,3 Mo | **aucun** |

Une première version lisait la référence communale dans l'index national : la fonction Autour passait à **35,8 Mo (+14,1 Mo)**, à cause de l'index (12,2 Mo) et des fichiers qu'il entraîne. Corrigé avant livraison : la référence voyage avec les tuiles dans le stockage privé. Côté stockage : 12,2 Mo par édition (tuiles + référence), lus à la demande (une à quatre tuiles et la référence, une fois par instance).

## 7. Tests

- `src/lib/prix-autour.test.ts` (8) : classes, carrés, rayon progressif, type seul, seuils 10/20/30, arrondis, même carré = mêmes ventes, validation des tuiles.
- `src/lib/prix-autour-texte.test.ts` (13) : type (confirmé, grain, explicite), phrases de chaque cas, périmètre élargi dit en premier, pas de repli communal, deux marchés, panne, doctrine.
- `src/lib/prix-autour-serveur.test.ts` (4) : lecteur (non activé, mémoire, tuiles absentes jamais demandées, empreintes des tuiles, de la référence et du pointeur, panne = indisponible) et rendu du bloc.
- `scripts/dvf-autour/publier.test.mjs` (3) : garde de production, envoi puis bascule, reprise idempotente, refus d'un autre contenu sous la même édition.
- Suite complète : **4 290 tests, 0 échec** ; `tsc` sans erreur ; cliquet de la charte (K1) respecté.
- Rendu réel vérifié dans `next dev` (banc `/dev/fut138`) contre l'imitation locale du stockage, par le même chemin serveur que la page.
- `scripts/lib/dvf-prix.test.mjs` (+1) : position de la parcelle.

## 8. Ce qui reste, et qui exige le GO final

Tant que rien n'est fait, la production n'affiche **rien de nouveau** : sans la variable `PRIX_AUTOUR_BUCKET`, le bloc ne s'affiche pas, et Logement n'a plus de section prix.

1. Créer à la main le bucket **privé** `prix-autour` dans le projet Supabase de production.
2. `node --max-old-space-size=8192 scripts/dvf-autour/construire.mjs` (reproductible), puis `node scripts/dvf-autour/publier.mjs envoyer --cible production --confirmer-production --source data/cache-logement/dvf-autour/2026-10-20`, puis `basculer --cible production --confirmer-production --edition 2026-10-20`.
3. Ajouter `PRIX_AUTOUR_BUCKET=prix-autour` aux variables Vercel de **Production**.
4. Fusionner la PR #125.

## 9. Points soumis au porteur

1. **Type inconnu ou ambigu : deux marchés séparés** plutôt que rien (section 1).
2. **« Écart net »** par l'intervalle de confiance à 95 % de la médiane, sans seuil en pourcentage (section 5).
3. Une nouvelle livraison DVF exige de régénérer l'index (`populate-logement.mjs`) **puis** les tuiles, publiées sous une nouvelle édition : la construction refuse un index d'une autre livraison.
