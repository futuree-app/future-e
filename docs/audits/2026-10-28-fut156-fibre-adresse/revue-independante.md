# FUT-156 — revue indépendante finale de #108

28 octobre 2026. SHA examiné : `895c2c85782a4fdcc6b60205ecb075779375aab4`.
Base de production comparée : `61dcaf152c9ba45a6f63b8e2fab3e785395ced2e`.
Revue du code, contre-épreuves locales, tests sur les SHA exacts et intégration locale sans commit de fusion.
Aucune fusion distante, aucun déploiement, aucune création de bucket, aucune écriture de données en production.
Aucune reconstruction ni nouvelle collecte des 26 millions d'adresses.

## Verdict

**GO technique après le correctif d'intégrité livré avec ce rapport.** Le SHA initial était **NO GO**
sur un seul défaut bloquant : un objet altéré de même taille pouvait passer la reprise puis la bascule.
Les deux contre-épreuves échouent sur l'implémentation initiale (« Missing expected rejection ») et passent
après correction. Aucun autre défaut bloquant établi dans le périmètre demandé.

Ce GO n'autorise ni fusion ni activation. La recette visuelle du parcours Logement complet reste non
acquise ; la limite est explicitée ci-dessous, sans transformer une recette facultative en défaut avéré.

## Rattachement, ambiguïtés, opérateurs et Corse

- `base_imb.addr_code` rattache la BAN ; `base_imb.imb_code` joint le code IPE du fichier Immeuble ;
  `base_imb.imb_id` joint les lignes d'offres du même trimestre. Les deux identifiants ne sont pas confondus.
- Le repli est limité aux immeubles fibre dont la source d'adresse n'est pas BAN : même commune, numéro,
  indice et voie normalisée. Une clé BAN existante sous une autre adresse ne devient pas un candidat textuel.
  La distance ne choisit jamais un voisin ; **150 m conservés**, uniquement comme veto à une conclusion.
- Un état absent ou contradictoire est incertain ; plusieurs états sous une BAN donnent une ambiguïté.
  Les 55 cas bruts conservés dans la fixture sont rejoués : Blair 10 = sur demande / zéro prouvé,
  Blair 11 = déployé / 5 ; Albatros et Ilate restent à vérifier ; bis/ter ne prennent pas le voisin.
- Les opérateurs sont des codes distincts des lignes FO par immeuble, pas un cumul des offres ni une union
  entre bâtiments. Absence de ligne = non établi ; présence sans FO = zéro ; pseudo-opérateur = non établi ;
  comptes différents sous la même adresse = plage. Ces branches et les doublons sont testés.
- Corse : la commune est normalisée en `2A`/`2B`, la clé BAN complète garde son suffixe. Une contre-épreuve
  supplémentaire traverse le pipeline avec BAN minuscule, repli textuel et indice bis dans les deux
  départements ; le compte dédupliqué et la méthode `libelle` sont conservés. Elle complète les tests de
  lecture et les mesures nationales existantes ; ce n'est pas un nouveau relevé exhaustif corse.
- Les contre-épreuves nationales Python documentées sur 17/57/75 ont été examinées comme preuves existantes,
  pas revendiquées comme réexécutées ici. Le code et les cas bruts disponibles suffisent à la revue ciblée.

## Correction d'intégrité

Le manifeste porte `empreintes[chemin] = { octets, sha256 }`, calculé depuis les octets gzip produits par
la construction. Le format des lots, leur découpage en **1 306 lots**, le lecteur et les données ne changent pas.

`envoyer` vérifie le lot local, puis les octets distants après nouvel upload ou reprise. Un objet de même
taille avec une autre empreinte est refusé ; aucun objet existant n'est écrasé. Le manifeste n'est publié
qu'après vérification de tous les lots. `basculer` exige un jeu complet d'empreintes et relit tous les lots
avant de toucher `courant.json`. Un manifeste ancien sans empreintes est refusé à la bascule.

L'index T2 déjà construit est réutilisable : `envoyer` récupère les empreintes déjà présentes dans les
bilans locaux `_departements/*.json`, vérifie les lots et publie le manifeste enrichi. **Aucun calcul des
adresses à refaire.** Les bilans et les lots d'origine doivent être conservés ensemble.

Sept tests de publication : corruption distante de même taille en reprise et en bascule (pointeur intact),
envoi/reprise/bascule valides, manifeste ancien ou lot absent refusé, récupération des bilans existants,
corruption locale et corruption au nouvel upload. Exécution exclusivement sur stockage simulé en mémoire.
Le nouveau coût de relecture est d'environ 74,2 Mo par envoi et par bascule ; les 31 secondes du pilote
initial ne mesurent pas ce contrôle supplémentaire. La documentation le précise désormais.

## Pourquoi 3 746 contre 3 704 tests

Même environnement Node **24.22.1**, mêmes dépendances du lockfile et exactement la même commande :

```sh
TZ=Europe/Paris node --test --test-concurrency=2 'src/**/*.test.ts' 'scripts/**/*.test.mjs'
```

| Arbre testé | Tests | Réussis | Échecs / ignorés |
|---|---:|---:|---:|
| #107 `f682fd1307e631a616f680383d06ff1d9cc63c10` | 3 746 | 3 746 | 0 / 0 |
| #108 initial `895c2c85782a4fdcc6b60205ecb075779375aab4` | 3 704 | 3 704 | 0 / 0 |
| #108 + main, correction et huit tests supplémentaires | **3 803** | **3 803** | **0 / 0** |

L'ancêtre commun est `4d75603f0839c73962cce4ba1a169a31bc827531`, avant #107 :
**3 655 + 91 (#107) = 3 746** ; **3 655 + 49 (FUT-156) = 3 704**.
Les 91 viennent des quatre fichiers de tests FUT-147/FUT-148 et du test de traçage ONRN, présents dans #107,
absents de l'ancienne base de branche de #108. Le différentiel de 42 ne correspond pas à des tests retirés
par FUT-156. L'intégration locale avec main se fait sans conflit et conserve les deux ensembles :
**3 746 + 49 + 7 publication + 1 Corse = 3 803**.

Une première exécution à concurrence par défaut a subi des arrêts de fichiers de tests et un décalage
de date sous le fuseau hôte. Elle n'est pas utilisée comme preuve de régression. Les exécutions ci-dessus
bornent la concurrence et fixent le fuseau français. TypeScript et ESLint ciblé passent, ainsi que
`git diff --check`. Aucun nouveau build national ou déploiement de recette n'a été nécessaire.

## Supabase indisponible et rapports enregistrés

Le lecteur serveur n'expose aucune clé au composant client. Les lectures ont un délai de 4 s par requête ;
un démarrage à froid peut lire successivement pointeur, manifeste et lot. La borne n'est donc pas une
promesse de 4 s pour toute la collecte. Sans configuration ou sans BAN exploitable, aucun accès n'a lieu.

Les tests simulent lot absent, gzip invalide, mauvais millésime/format, département absent et erreur réseau :
ils donnent `indisponible`, jamais « pas de fibre » ni zéro opérateur. Le composant dit la panne.
Une actualisation qui perd une lecture fibre est refusée avant écriture ; l'ancienne version est rendue.
La désactivation de la variable ne supprime pas non plus une lecture existante. La consultation normale
d'une version enregistrée ne recollecte aucune source. L'empreinte de synthèse IA ignore la fibre.

Vérifications Supabase **en lecture seule** sur `future-e-test` : bucket `fibre-adresse` privé, **1 308 objets**,
**74 208 863 octets** (lots + manifeste + pointeur), aucune politique sur `storage.objects`.
Les permissions temporaires du pilote ne sont donc plus présentes. Aucun secret demandé ni extrait.

## Linear et recette du module réel

FUT-156 était `In Progress` à l'ouverture de cette revue, malgré un bref passage en `In Review` dans
l'historique. Statut remis en **In Review**, puis relu et confirmé le 28/10/2026 à 18 h 10, heure de Paris.

`recette-module.ts` monte le **vrai LogementModule**, exécute ses effets React et garde réels la section
fibre et les primitives Relevé. Les présentations des autres domaines sont doublées. Sept situations
passent : déployé, sur demande, libellé, plage, éloignement, panne et ancien rapport. Le bloc est présent
dans les six premières, absent dans l'ancien rapport ; **aucune requête réseau** à l'ouverture.
Commande : `node docs/audits/2026-10-28-fut156-fibre-adresse/recette-module.ts` ; résultat joint en JSON.

Une requête HTTP réelle vers `/dev/fut156?vue=logement&cas=17415_0510_00011` rend 200 et transmet le
rapport D5 au module client. Le contenu fibre n'est posé qu'après hydratation : ce HTTP 200 ne prouve
pas le rendu visuel. Le navigateur de recette reçoit `ERR_CONNECTION_REFUSED` sur le serveur local.
**Pas de nouvelle capture du module complet, pas de recette Safari ni de vraie session authentifiée
revendiquée.** Les captures préexistantes restent celles de la section isolée. Aucun déploiement créé
pour contourner cette limite.

## Plan d'activation — un seul déploiement Vercel de production

Plan préparé seulement ; toutes les opérations suivantes restent à autoriser.

1. Avant fusion, créer le bucket privé `fibre-adresse` dans le projet Supabase de production existant.
   Aucun accès public ni politique anonyme ; utiliser la clé serveur existante côté publication/application.
2. Réutiliser les lots T2 et leurs bilans originaux. Exécuter l'outil corrigé `envoyer --cible production
   --confirmer-production --source <sortie>/2026T2`, puis `basculer --cible production --confirmer-production
   --millesime 2026T2`. Contrôler les 1 306 empreintes et le pointeur ; arrêter à toute discordance.
   Cette préparation Supabase ne nécessite aucun déploiement Vercel.
3. Définir **avant la fusion autorisée** la variable Vercel de portée Production
   `FIBRE_ADRESSE_BUCKET=fibre-adresse`, sans demander de redéploiement immédiat. Vérifier l'URL Supabase
   et la présence de la clé serveur de production, sans les exposer au client.
4. Après autorisation distincte de fusion/livraison, fusionner #108 dans main. Garder
   `git.deploymentEnabled = { "**": false, "main": true }` : le déploiement Git de main sera **l'unique
   déploiement de production**, avec code et variable ensemble. Pas de déploiement manuel préalable.
5. Après livraison : vraie session Logement bureau/mobile, Blair 10/11, Albatros, plage 4–5 et cas corse ;
   vérifier textes, méthode, millésime et absence de promesse d'éligibilité. Créer un dossier de recette
   explicitement autorisé, le rouvrir sans nouvelle lecture de lot, puis contrôler sa version enregistrée.
   Vérifier un rapport ancien, les scores/synthèses inchangés, l'absence de clés dans les ressources client,
   le refus des accès Storage anonymes et les erreurs/latences. Ne pas simuler une panne en cassant le bucket
   partagé de production : la contre-épreuve destructive reste locale ou sur environnement de test.
6. Garder le millésime précédent. Les bascules trimestrielles et retours à l'ancien pointeur se font ensuite
   dans Storage, sans déploiement Vercel (cache du pointeur : jusqu'à dix minutes). La toute première
   activation, sans millésime précédent de production, utiliserait un retour au déploiement antérieur en
   cas d'incident ; aucune stratégie ne suppose qu'un `2026T1` de production existe déjà.

La recette visuelle complète est à réaliser à la première surface accessible avant ouverture publique
de la fonctionnalité. Le GO technique porte sur la correction contrôlée et l'intégration testée.
