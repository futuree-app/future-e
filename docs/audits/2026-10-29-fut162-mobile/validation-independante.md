# FUT-162 — validation indépendante de la PR #113
29 octobre 2026 · **GO de revue** sur `3d33638ac868e3d91dde539fdeaae7d308948b85`.

## Résultat
Le script **non modifié** `scripts/fut162/responsive.mjs` a été exécuté avec Next et Chromium dans le même environnement local : **20 scénarios après correction, exit 0**. Un contrôle complémentaire du contenu des autres sections de résultats de Logement passe aussi sur les vingt combinaisons.
Aucun correctif de code supplémentaire, aucune donnée modifiée, aucune opération Supabase, fusion ou déploiement. Le SHA de #113 est préservé.

| Largeur CSS | États fibre | Textes fibre hors écran | Autres sections : textes hors écran | Largeur fibre après |
|---|---|---:|---:|---:|
| 320 px | 5/5 | 0 | 0 | 280 px |
| 360 px | 5/5 | 0 | 0 | 320 px |
| 390 px | 5/5 | 0 | 0 | 350 px |
| 1440 px | 5/5 | 0 | 0 | 1044 px |

Les cinq états sont déployé, ambigu, plage d'opérateurs, non rattaché et indisponible. Le texte attendu est vérifié ; aucun état déployé ou opérateur chiffré n'est inventé dans les états dégradés. Les fixtures et les collecteurs ne sont pas modifiés.

## Accès au texte et à la méthode
Les rectangles de chaque nœud de texte sont contrôlés, avec le dépliable ouvert lorsqu'il existe ; la section fibre reste entièrement dans le viewport. Le contrôle ne repose donc pas seulement sur scrollWidth, qui était masqué par overflow-hidden.
Le lien garde l'URL exacte https://maconnexioninternet.arcep.fr/ et reçoit effectivement le focus clavier dans **20/20** situations. Les **16 dépliables existants** sont ouverts ; l'état indisponible n'a pas de dépliable par conception (4 largeurs). Toutes les sections de résultats du vrai module sont présentes, sans doublures de présentation : passeport, diagnostic, chaleur, fibre, risques, urbanisme, sinistres et vérifications. Aucun rectangle de texte visible n'y dépasse à cause du titre.

## Témoin avant et ordinateur
La même recette en mode avant passe sur la base `760955985dbb773957745332d21bb06208043969` et retrouve le défaut :
- 320 px : 3 à 12 nœuds de texte coupés selon l'état ;
- 360 px : des nœuds coupés pour ambigu (2), non rattaché (2) et indisponible (3) ; le bloc mesure 364 px pour un viewport de 360 px ;
- 390 et 1440 px : pas de texte fibre coupé dans ce témoin.

La mesure locale de 364 px diffère des 378 px constatés dans le navigateur de production, selon la police monospace de repli et la plateforme. La reproduction à 360 px reste positive ; aucune largeur du navigateur n'est déduite d'un zoom supposé.
Après correction, les cinq états passent aux quatre largeurs. À 1440 px, les rectangles de la fibre sont identiques avant/après (x=198, largeur=1044, droite=1242). La zone principale des captures, rectangle (0,0)-(1440,800), est **identique pixel pour pixel**. Le pied de capture avec consentement/outils DEV n'est pas inclus dans cette comparaison ; aucune identité des pages intégrales n'est revendiquée.

## Captures et mesures
Chaque paire provient du vrai LogementModule dans le banc DEV existant, mêmes fixtures, Chromium et viewport :
- [Avant 320](revue/captures/avant-320.jpg) · [Après 320](revue/captures/apres-320.jpg)
- [Avant 360](revue/captures/avant-360.jpg) · [Après 360](revue/captures/apres-360.jpg)
- [Avant 390](revue/captures/avant-390.jpg) · [Après 390](revue/captures/apres-390.jpg)
- [Avant 1440](revue/captures/avant-1440.jpg) · [Après 1440](revue/captures/apres-1440.jpg)

[Mesures après](revue/mesures-apres.json) · [Témoin avant](revue/mesures-avant.json) · [Autres sections et accès](revue/autres-sections.json) · [Synthèse](revue/synthese.json).

## Conditions de recette et limites
Checkout exact du SHA demandé ; serveur Next 16.2.4, Node 24.22.1, Chromium 153.0.8010.0 fourni par le paquet @sparticuz/chromium 153.0.0. Le téléchargement standard de Chrome for Testing avait fourni une archive invalide ; ce paquet a permis l'exécution locale.
Le viewport CSS réel est vérifié à chaque scénario et devicePixelRatio vaut 1 (contexte neuf à 100 %). La police Archivo est servie par les fichiers locaux du dépôt ; aucune réduction de police n'est appliquée.
Le lancement utilise uniquement des valeurs factices pour satisfaire l'initialisation de développement. Les lectures viennent du banc et des fixtures FUT-156. Une enveloppe de recette bloque la télémétrie /ingest et les connexions hors localhost ; elle ne modifie ni le script testé, ni le module, ni les assertions. Les premières tentatives interrompues et les erreurs de compilation liées aux anciens caches déplacés ne sont pas comptées comme des passages. Les pièces jointes correspondent aux exécutions complètes.
Les avertissements de télémétrie bloquée et la synthèse locale sans clé (HTTP 500) ne sont pas présentés comme des incidents de production ; aucune synthèse externe n'a été générée.

Cette revue porte sur la correction responsive et l'accès au contenu dans le banc du vrai module, pas sur une nouvelle collecte en production. Le GO données de FUT-156 reste acquis. La refonte transversale reste dans FUT-118.

## Décision
**Je propose le passage de #113 hors brouillon.** La PR est laissée en brouillon conformément à la demande de proposition ; aucune fusion ni livraison n'est autorisée par cette revue. FUT-162 peut passer In Review ; la clôture de FUT-156 attend la livraison séparément autorisée.

