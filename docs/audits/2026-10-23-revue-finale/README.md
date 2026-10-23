# Revue finale FUT-127 / FUT-129 / FUT-126 — 23 octobre 2026

État constaté et recontrôlé : main `3af53c3ca1acf1572b7f0bbdd68c400e049c48ae`, PR #83 `a3851065`, #84 `8cfb3d91`, #82 `825280d5`, toutes ouvertes et fusionnables. Aucun changement distant de code depuis les dernières revues. #82 était antérieure à la livraison FUT-99 : actualisée localement par fusion de main (`44c1bd96`). Aucun accès à la branche ou au périmètre FUT-98.

Contrôles GitHub : Vercel success, Preview Comments success, Supabase Preview skipped (offre), aucune suite de tests GitHub présente. Ces contrôles portent sur les SHA distants d'origine, pas sur les correctifs locaux. Aucun push, aucune fusion de PR, aucun nouveau déploiement, aucune variable de production modifiée.

## FUT-127 / #83

Aucune anomalie nouvelle démontrée nécessitant un correctif métier. Les 2 989 tests passent ; TypeScript et lint ciblé sans erreur. La lecture de Charron (zone Rs2, réserve majeure), La Rochelle (dont plan à deux phénomènes, hors zone et divergence), Châtelaillon (point/parcelle), les aléas inconnus et les données indisponibles restent prudents. Aucun cas incertain ou hors zone ne devient favorable. Les limitations et la portée de l'état des risques sont visibles dans les deux présentations.

La détection des anciennes analyses est fondée sur leur contenu ; elle ajoute un avertissement, sans réécriture des artefacts. Les tests vérifient l'intégrité du dossier. Le cas visuel « ancien » simule une analyse engine-6 : ce n'est pas une lecture d'un dossier client réel.

16 rendus sur les relevés figés du 22/10, composants de production, deux interfaces × 1440/360 px × Charron/La Rochelle/Châtelaillon/ancien simulé : aucun débordement ; ouverture des contrôles au clavier et contour de focus vérifiés au Relevé. Voir `fixtures-visuelles.json` et les JPEG.

Limite non levée : la latence réelle du détail des plans à froid et à chaud depuis une fonction Vercel cdg1 n'est pas mesurée. Le délai à 3 s et le comportement prudent en échec sont testés ; le cache reste propre au processus. La carte spécialisée Territoire « Inondation fluviale », déjà reportée hors de ces PR, n'a pas été remaniée.

## FUT-129 / #84

Correctifs de présentation préparés :
- Les paliers de recherche précisent « sur vos autres critères » lorsque l'inondation est déclarée.
- En exploration inondation seule, le fait d'inondation reste au premier niveau ; identité, forces générales et compromis passent dans « Autres caractéristiques de la commune », dépliant secondaire.
- « Aucun plan de prévention » devient « aucun plan de prévention des inondations recensé ».
- La ligne fusionnée du comparatif dit « même information pour les deux/trois communes », sans prétendre que les territoires se valent.

Aucune modification de calcul : ONRN/CCR 1995-2021, seuil 5 ‰, représentativité au moins 30 %, λ=0,2, recul non positif et aucun favorable inondation conservés. Les cartes de recherche restent conditionnées à la priorité déclarée ; le comparatif nommé reste multithématique. Données, lecteur et extraction GASPAR identiques à #83 (diff vide).

2 974 tests passent, dont les propriétés exhaustives sur l'index et la conservation exacte du trio acheté dans son ordre. TypeScript et lint ciblé sans erreur. Les tests de date couvrent achat antérieur, jour de bascule, postérieur, date invalide et préparation sans date. Le jour de bascule se compare au format AAAA-MM-JJ : ce n'est pas une frontière à la seconde près.

La date hypothétique du 23/10 est retirée : `LECTURE_INONDATION_DEPUIS` reste null pendant la préparation. Lors de la livraison autorisée : `node scripts/fut129/bascule.mjs --fix-today` utilise la date Europe/Paris, puis `--check`. Le prebuild exécute `--check-production` et refuse la production si la date n'est pas celle du jour. Test négatif effectué : le refus est attendu tant que la date n'est pas renseignée. Les captures du pack ancien emploient une date explicitement simulée.

### Deux véritables synthèses, autorisées par le porteur

Deux appels, et seulement deux, effectués sur la preview existante #84 (`8cfb3d91`), via sa route `/api/comparateur-vie/synthesize` ; réponses HTTP 200. Modèle inchangé : claude-sonnet-4-6, thinking désactivé, effort medium. Estimation annoncée avant exécution : 0,05–0,08 USD au total (3 USD/M jetons entrants, 15 USD/M sortants). La route ne renvoie pas l'usage : coût réel non mesuré.

Les payloads viennent de la vraie route déterministe locale, sans parse payant :
1. Inondation + soins, Charente-Maritime : Aytré, Dompierre-sur-Mer, Lagord.
2. Inondation seule, Charente-Maritime : La Rochelle, Saintes, Rochefort.

Textes complets et entrées conservés dans ce répertoire. Aucun texte ne qualifie une commune de faible risque, sûre ou épargnée sur la base des sinistres ou de l'absence de plan. Les deux renvoient à l'adresse ; la seconde indique expressément l'absence de classement et invite à préciser d'autres critères. La première ajoute une généralisation sur la tension entre soins et inondation qui n'est pas établie par le payload ; elle reste à resserrer si cette tournure est retenue dans la recette éditoriale. Les textes dépassent la cible de longueur du prompt : point de qualité rédactionnelle, sans modification du classement.

Validation encore manquante : le rendu des deux synthèses dans une véritable session restaurée n'a pas été validé. Le navigateur local affiche le formulaire initial et ne restaure pas les cartes malgré le snapshot de test ; aucun résultat de capture vide n'est compté comme réussi. Le rendu des cartes corrigées (dont le nouveau dépliant) doit être repris dans une preview autorisée avant fusion #84. Aucun appel supplémentaire au modèle n'est nécessaire : réutiliser les deux textes déjà générés.

### EAIP

Brouillon de la section 7 complété : signature, référentiel communal, millésime, effectifs/dénominateurs, données manquantes, conditions de diffusion et limites EAIP. Destinataire SDES : bem.sdie.sdes.cgdd@developpement-durable.gouv.fr ; copie DGPR : bipcp.srnh.dgpr@developpement-durable.gouv.fr. Adresses confirmées dans les fiches officielles Cours d'eau 2024 et Fréquence inondation 1995-2021. Sources dans la section 7. Aucun email ni brouillon Gmail créé ; identité du compte expéditeur à vérifier uniquement avant un éventuel envoi explicitement autorisé. Cet envoi ne bloque pas la production.

## FUT-126 / #82

Main intégré localement sans conflit. 2 968 tests passent, dont les 12 tests de finitions ; TypeScript et lint ciblé sans erreur (CSS ignoré par ESLint, aucune erreur). Aucune nouvelle correction métier ni réouverture de la seconde passe éditoriale.

Nouvelle preuve classique : 12 rendus exacts avant/après (La Rochelle commune, Nîmes, banc fut91 ; 1440/390 px ; sombre/clair) : zéro pixel différent, aucun élément ni style calculé différent. Rapport : `fut126-classique-comparaison.md`. Le jeu historique de la PR comprend en plus l'adresse réelle, WebKit et 360 px ; ces anciennes captures ont été relues, sans les présenter comme une nouvelle exécution.

Les 16 rendus figés de l'intégration vérifient en plus les contrôles natifs du Relevé au clavier à 360 et 1440 px. La recette historique `clavier.mjs` sur une adresse géocodée en direct n'a pas pu être reproduite avec les services locaux neutralisés : elle n'est pas comptée comme un succès. Aucun test sur smartphone Android physique réalisé ici.

## Assemblage et livraison à autoriser

Assemblage local depuis main : #83 puis #84 corrigée puis #82 actualisée, sans conflit. 3 019 tests passent ; TypeScript et build Next réussissent. Le build utilise des valeurs factices pour les services externes, sans connexion aux données clients : les avertissements d'accès Supabase neutralisé ne prouvent pas un accès de production. Aucun secret de production n'a été lu ou modifié.

Avant de proposer une livraison sans réserve : terminer la validation de rendu des deux synthèses, resserrer si nécessaire les généralisations non mesurées de la prose, et relire les cartes corrigées sur preview autorisée. La mesure Géorisques réelle reste un contrôle de suivi à effectuer dans l'environnement adapté, sans générer ni modifier un dossier client.

Après feu vert explicite unique, dans l'ordre #83 → #84 → #82 :
1. Recontrôler main, têtes des PR, contrôles GitHub et déploiements actifs. Si FUT-98 fait évoluer main, attendre et revalider ; ne pas toucher sa branche.
2. Publier seulement les corrections préparées et terminer leur recette sur preview ; arrêter la séquence si une régression apparaît.
3. Fusionner #83 seulement, attendre son déploiement de production READY, vérifier commit, domaines configurés et contrôles non destructifs.
4. Actualiser #84 sur ce nouveau main, renseigner le jour réel, revalider tests/TS/build/contrôles ; fusionner seulement après succès, puis attendre READY et vérifier les domaines et la lecture publique.
5. Actualiser #82 sur le main issu de #84 et revalider ; fusionner, attendre READY et vérifier le Relevé et le classique.
6. Avant chaque fusion, aucun déploiement de production concurrent, y compris FUT-98. Clôturer les tickets seulement après livraison prouvée ; documenter chaque SHA, déploiement et résultat dans Linear.

Aucune donnée utilisateur ou analyse historique modifiée. Les deux appels de recette peuvent consommer les compteurs techniques de budget de la route ; aucune variable de production n'a changé. Aucun envoi externe.
