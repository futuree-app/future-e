# Vercel Storage et préparation FUT-147 / FUT-148 — 28 octobre 2026

## Conclusion et périmètre

Le coût provient du stockage de l'historique des bundles, pas de leur exécution. Deux facteurs sont démontrés : 365 déploiements Ready encore listés et un lecteur ONRN dont le chemin variable fait tracer tout `data/` dans neuf points d'entrée. La correction préparée réduit de 73,3 % les octets de données cumulés dans ces neuf traces locales. Elle ne réduit pas rétroactivement les anciens bundles.

La rétention a été changée par le porteur le 28/10 vers 01 h, heure de Paris. Les durées courtes sont enregistrées. Il est trop tôt pour conclure à un échec du nettoyage. Aucune suppression, modification de rétention, mutation d'alias, fusion GitHub ni création de déploiement n'a été effectuée pendant l'audit.

Projet `future-e`, équipe `futuree-apps-projects` (Pro), `prj_k4X3A1e5ovsQTEfdBTu2sdI8g5uf`. Production active : `dpl_47Kp6S3s5RDJHVUkFHPf6MNDfQUp`, SHA `4d75603f0839c73962cce4ba1a169a31bc827531`, région `cdg1`. Les domaines de production pointent toujours sur ce déploiement.

## 1. Facturation : ce qui est établi et ce qui ne l'est pas

- Relevé fourni par le porteur : Function Storage 360,09 Go, 1,2003 $/jour ; Deployment Storage environ 0,14 $/jour.
- L'interface Usage consultée pendant l'audit affiche 361,35 GB pour `future-e`, et 0 B pour l'autre projet de l'équipe. Cette valeur est un relevé d'Usage, pas une mesure indépendante de l'occupation instantanée.
- L'API de facturation confirme un poste Function Storage à 1,1190805 $ sur une journée antérieure disponible, et Deployment Storage à 0,1341503 $. Son échantillon borné ne permet pas d'attribuer chaque octet à un déploiement.
- Prix catalogue Pro : 0,10 $/Go-mois pour chacun des deux postes. Vercel retient **le maximum stocké par projet pendant chaque journée de facturation**, puis additionne les journées. Les montants déjà accumulés ne disparaissent pas après une purge.
- `Resources` affiche des routes et tailles de fonctions, pas une ventilation du montant facturé. Additionner les 342 lignes de routes comme 342 bundles indépendants serait injustifié : des sorties peuvent partager un bundle. Ni l'API disponible ni Usage n'exposent une ventilation exhaustive des 360 Go par déploiement ou identifiant de bundle.

**Limite explicite :** l'accumulation et le surtraçage sont prouvés ; la part exacte des 360,09 Go imputable à ONRN, à chaque génération ou aux autres dépendances reste inconnue. La baisse en dollars du correctif n'est pas déduite mécaniquement des -73,3 % locaux.

Sources : [Deployment Storage](https://vercel.com/docs/deployment-storage), [guide d'optimisation](https://vercel.com/docs/deployment-storage/optimize), dashboard Usage authentifié, API Vercel. Le guide précise qu'Usage n'identifie pas le déploiement, fichier ou bundle responsable du total.

## 2. Rétention réelle et inventaire

Réglages lus dans Settings > Build and Deployment > Deployment Retention Policy :

| État | Durée enregistrée | Recommandation immédiate |
|---|---|---|
| Canceled | 1 jour | Conserver |
| Errored | 1 jour | Conserver |
| Pre-Production | 1 jour | Conserver, puisque les nouvelles previews Git sont désactivées |
| Production | 1 semaine | Conserver ; ne pas raccourcir davantage avant d'observer le nettoyage |

La sécurité d'accès est distincte de la rétention : SSO activé pour `all_except_custom_domains`, protection des sources/build logs activée. Une preview protégée par authentification peut toujours consommer du stockage.

Inventaire paginé complet des déploiements retournés lors de cette collecte, du 24/09 au 28/10 :

| Groupe | Nombre |
|---|---:|
| Tous états | 431 |
| Ready | 365 |
| Production Ready | 99 |
| Preview Ready | 266 |
| Error | 65 |
| Blocked | 1 |

Les previews les plus récentes datent du 27/10, avant la protection production-only. Aucun déploiement des têtes #104 et #105 n'a été observé. Désactiver les futurs builds de branches ne supprime pas les anciens bundles.

Les 109 aliases retournés correspondent à 103 cibles distinctes ; 100 cibles sont dans l'inventaire. Trois anciens aliases générés pointent vers des déploiements répondant 404 à l'inspection : ils ne sont pas une preuve de stockage de fonctions encore facturé. Ils n'ont pas été supprimés. Les quatre aliases de domaines personnalisés de production pointent sur la production active.

Exceptions documentées pour Pro : dix derniers déploiements, vingt dernières productions Ready, vingt dernières previews Ready, production aliasée, certains aliases personnalisés/environnements, dernière preview d'une branche active. Une branche avec une PR fusionnée ou fermée n'est pas active au sens de cette dernière exception, même si sa référence Git subsiste.

Le rapprochement avec les branches Git et les 105 PR donne **51 déploiements avec une exception étayée**, dont **13 dernières previews de branches encore actives**. Deux sont les études ouvertes #55 et #57 ; d'autres sont des branches d'exploration/documentation sans PR associée. Ces 51 sont un minimum étayé, pas une garantie que tous les autres seront supprimés : le type exact de certains aliases et l'état interne du nettoyage ne sont pas exposés.

**314 déploiements Ready n'ont pas d'exception explicite retrouvée.** Beaucoup sont des générations remplacées de PR déjà fermées/fusionnées. Ils sont les premiers à observer après le passage du nettoyage. L'inventaire joint conserve ID, SHA, branche, PR, aliases et justification d'exception ; `cleanupCandidate` est une proposition, jamais une autorisation de suppression.

## 3. Délais : demain sera plus instructif, pas une échéance garantie

La documentation actuelle annonce un marquage en suppression généralement dans les 48 h après éligibilité. Une politique nouvellement activée peut prendre quelques jours. Une exception cessant de s'appliquer peut nécessiter une réévaluation allant jusqu'à 30 jours.

- **29 octobre** : premier point utile, après plus de 24 h depuis le changement ; comparer surtout le nombre de Ready et le niveau quotidien de stockage.
- **30 octobre** : meilleur repère pour le premier passage de nettoyage, après environ 48 h ; tenir compte du rafraîchissement d'Usage et du maximum journalier.
- Pas de promesse de baisse à 00:01, ni de disparition des frais cumulés du cycle. L'heure exacte de clôture de la journée de facturation n'a pas été établie.

Le marquage en suppression, la période de récupération, la libération physique des bundles et la publication de la métrique ne sont pas le même événement. La documentation consultée ne garantit pas le délai exact de retrait des octets du compteur après suppression. Il ne faut donc ni annoncer une baisse instantanée, ni affirmer sans preuve que tous les objets récupérables restent facturés pendant 30 jours.

Source : [Deployment Retention](https://vercel.com/docs/deployment-retention), lue directement ; les résultats de recherche plus anciens présentent des règles de récupération différentes. La page actuelle prévoit une récupération plus courte pour les déploiements récents supprimés sous une politique inférieure à 30 jours.

## 4. Bundles : cause et correction locale

Sur la production active, Resources affiche 342 routes de fonctions : webhook Stripe à 125 MB, `/rapport` et plusieurs bancs `/dev/` à 124 MB, actualisation et Géorisques à 123 MB. La preview représentative `dpl_G1naBs78zsT2cpQmcBPUoELMKJr1` du 27/10 présente déjà les mêmes groupes à 120–121 MB. Des routes simples affichent 32,8 MB, les synthèses les plus légères 10,4 MB. Ces tailles ne sont pas les tailles brutes des données dans les traces locales.

`next.config.ts` comporte surtout des inclusions étroites nécessaires au runtime. Le glob BPE concerne les shards lus dynamiquement autour de l'adresse ; le supprimer sans autre architecture casserait des lectures. Aucun include global `data/**` n'y force les 2 313 fichiers.

La cause isolée est `src/lib/onrn-sinistralite.ts` :

```ts
fs.readFile(path.join(process.cwd(), "data", file), "utf8")
```

Le paramètre est une chaîne ; le traceur ne démontre pas qu'il n'existe que deux noms. En traçant ce lecteur seul après transpilation, le même `@vercel/nft` que Next.js inclut **2 313 fichiers, 300 701 408 octets**. Sources ONRN XLSX/JSON, NetCDF ERA5, parquet, données de construction et shards BPE sont alors embarqués sans être utilisés par ce lecteur.

La correction borne le type aux deux noms existants et choisit entre **deux chemins littéraux**. Le lecteur seul ne trace plus que les deux JSON ONRN, **8 775 205 octets**. Même lecture, mêmes caches, mêmes états d'indisponibilité ; aucune exclusion globale, aucune modification de données ou de config Vercel.

Comparaison de deux builds locaux sur la même base `4d75603f` :

| Point d'entrée | Avant : données tracées | Après : données tracées | Fichiers après |
|---|---:|---:|---:|
| `/api/georisques-logement` | 300,70 Mo | 20,54 Mo | 3 |
| `/api/stripe/webhook` | 300,70 Mo | 91,18 Mo | 10 |
| `/api/dossier/actualiser` | 300,70 Mo | 91,18 Mo | 10 |
| `/rapport` | 300,70 Mo | 131,14 Mo | 2 230 |
| `/dev/fut127` | 300,70 Mo | 23,93 Mo | 7 |
| quatre autres bancs `/dev/` | 300,70 Mo chacun | 91,18 Mo chacun | 10 chacun |
| **Cumul des neuf traces** | **2 706,31 Mo** | **722,66 Mo** | **−73,3 % en octets** |

163 traces comparées ; seules ces neuf changent pour leurs données. Les lecteurs légitimes conservent DRIAS, l'index, rivage, GASPAR, bruit aérien, ONRN, etc. `/rapport` conserve notamment les shards BPE requis par ses dépendances. Le cumul inclut les répétitions entre routes et ne constitue pas une mesure de facturation.

**Validation :**

- Builds `next build` avant et après réussis, TypeScript inclus. Prérequis `prebuild` vérifiés sur la base. Variables Supabase/Stripe factices pour compiler sans secrets de production ; les lectures Supabase absentes se dégradent comme prévu. Aucun appel modèle payant.
- 8 tests ONRN existants verts.
- Nouveau test de non-régression du traçage : deux fichiers exacts, puis exécution du lecteur dans un dossier isolé ne contenant que ces fichiers ; toutes les communes des deux tables sont comparées aux classes attendues. Ce test échoue sur la base et passe après correction. Total ciblé : **9/9**.
- ESLint ciblé et `git diff --check` passent.
- Pas de recette authentifiée complète du parcours d'achat ni de nouvelle recette visuelle : PR préparée en draft pour revue et recette avant intégration. Aucun changement d'interface ou de contrat métier.

Pour la suite, supprimer les bancs du build de production pourrait encore réduire l'output, mais cela demande un chantier distinct et une mesure des groupes réels. Déplacer les données runtime hors déploiement demanderait un contrat de disponibilité/cache ; ce n'est pas nécessaire pour corriger le surtraçage identifié.

## 5. Actions et estimations de coût

### Maintenant, sans suppression

1. Garder les réglages courts enregistrés ce matin et la protection `git.deploymentEnabled = {"**": false, "main": true}`.
2. Attendre le premier nettoyage et comparer les 29–30 octobre au relevé joint. Ne pas multiplier les builds pour vérifier.
3. Revoir puis intégrer le correctif ONRN dans la prochaine livraison groupée autorisée. Cela empêche les prochaines générations d'embarquer inutilement tout `data/`.

### Après observation, avec autorisation explicite

Si le stockage reste élevé, nettoyer les générations remplacées de branches fermées/fusionnées et les productions anciennes, sur manifeste rafraîchi. **349 Ready sont des candidats** en conservant la production active, deux rollbacks et les 13 dernières previews encore liées à des branches actives. L'utilité de ces 13 previews reste à arbitrer séparément ; leur suppression ne serait pas implicite.

À conserver pour rollback :

| Rôle | ID | SHA |
|---|---|---|
| Production active, domaines | `dpl_47Kp6S3s5RDJHVUkFHPf6MNDfQUp` | `4d75603f` |
| Rollback immédiat | `dpl_6qnexKfY3HVDbUsMxu2ptGbiPE8v` | `06295f3d` |
| Second rollback | `dpl_9LBrSVvu7Z6yedC9RoMYfAw1cSwE` | `4556ca11` |

Avant toute suppression : revalider les domaines, l'activité des branches, les usages de recette et les cibles d'aliases ; présenter le manifeste exact et obtenir l'accord. Une suppression retire la possibilité de rollback et peut rendre les anciennes URLs inaccessibles. Aucun alias ni branche ne sera supprimé automatiquement par ce correctif.

### Ordres de grandeur, hors abonnement Pro et autres consommations

Hypothèses explicites : 30 jours, 0,10 $/Go-mois, moyenne simplifiée de 360,09 / 365 ≈ 0,987 Go de fonctions par Ready ; Deployment Storage suit la même proportion. Les générations ont des tailles différentes et le compteur est temporel : ces projections servent à comparer des scénarios, pas à prédire une facture exacte. L'effet supplémentaire du correctif ONRN n'est pas chiffré en dollars sans mesure Vercel future.

| Scénario stabilisé | Fonctions estimées | Fonctions / jour | Fonctions / 30 j | Avec Deployment Storage / 30 j |
|---|---:|---:|---:|---:|
| Relevé initial | 360,09 Go | 1,2003 $ | 36,01 $ | ≈ 40,21 $ |
| 51 Ready conservés, hypothèse d'exceptions seules | ≈ 50,3 Go | ≈ 0,168 $ | ≈ 5,03 $ | ≈ 5,62 $ |
| 16 Ready après nettoyage autorisé : actif + 2 rollbacks + 13 previews | ≈ 15,8 Go | ≈ 0,053 $ | ≈ 1,58 $ | ≈ 1,76 $ |

Le scénario 51 n'est ni un plafond garanti ni un objectif de politique configurable : d'autres exceptions/aliases et le délai de récupération peuvent retenir davantage. Le scénario 16 nécessite une suppression manuelle autorisée, car la rétention automatique Pro protège notamment vingt productions Ready. Le correctif seul ne libère aucun ancien bundle ; le nettoyage seul ne diminue pas la taille des futures générations. Il faut les deux leviers pour une baisse durable.

## 6. FUT-147, FUT-148 et livraison unique

| Sujet | État vérifié |
|---|---|
| #104 / FUT-147 | Ouverte, non draft, fusionnable isolément ; tête exacte `46c73eeb237a2c925d87ced3e2905c91e3391149` |
| Correctifs #104 | Années inconnues et limites des cellules sans feu notable, feu venu d'une voisine, chef-lieu, phrases et lecture robuste présents dans le dernier commit |
| Validation #104 | Rapport après correction : 3 702 tests, tsc, lint ciblé, build et recette bureau/mobile. **47 tests FUT-147 rejoués : 47/47** |
| GitHub #104 | Aucune approbation formelle ; seul check Supabase Preview completed/skipped, pas de CI de tests ni statut Vercel. Ce n'est pas une CI verte |
| Linear FUT-147 | **In Review**, compte rendu et arbitrage gratuit consignés |
| Arbitrage produit | **« Incendies observés » reste visible dans l'aperçu gratuit** ; troncature gratuit/payant inchangée |
| #105 / FUT-148 | Ouverte, non draft, fusionnable isolément, tête `f9e491385365fa2b40bbebcba5091ee352b61cc4` ; aucune approbation formelle retrouvée, reste en revue |
| FUT-156 | Statut fibre/opérateurs à l'adresse dans Logement ; ticket distinct en cours, **hors du lot** |

La revue indépendante de #104 portait sur `39f11013` et avait deux bloquants. Leurs correctifs et contre-épreuves sont dans `46c73eeb` ; aucune nouvelle revue exhaustive n'a été lancée. La décision de licence déjà consignée par le porteur n'a pas été réouverte.

Simulation locale, sans commit d'intégration distant : #104 puis #105. **Six conflits réels**, résolus en conservant les deux ajouts :

| Fichier | Résolution à conserver |
|---|---|
| `next.config.ts` | Includes BDIFF + Arcep, chacun sur ses routes nécessaires |
| page `/rapport/quartier` | Deux lectures hors snapshot et deux props, `incendies` et `fibre` |
| `OuVivreClient.tsx` | Deux lignes indépendantes, conditions existantes préservées |
| `MetricDrawer.tsx` | `sections` et `lien` optionnels, rendus tous deux conservés |
| `QuartierClimatData.tsx` | Volet feu et carte fibre ; `incendies` transmis à buildFactors, rang fibre préservé |
| `comparateur-vie.ts` | Deux champs optionnels, sans modification du score/classement |

**90 tests ciblés FUT-147 + FUT-148 et `tsc --noEmit` passent sur la simulation.** Cela prouve une compatibilité technique initiale, pas une approbation de #105 ni une recette visuelle du lot final. La résolution est conservée dans `integration-104-105.patch` pour être rejouée sur les mêmes SHAs.

Ordre proposé :

1. Attendre la validation indépendante de la tête finale de #105 ; ne pas mélanger FUT-156.
2. Repartir du `main` courant dans une branche de regroupement ; intégrer #104, puis #105 avec les six résolutions, puis le correctif ONRN validé. Si les têtes bougent, refaire les contrôles concernés.
3. Ouvrir une PR de regroupement vers `main`, en maintenant les previews Git désactivées. La créer maintenant pendant la revue de #105 ajouterait une tête rapidement périmée ; aucune PR de regroupement distante n'est donc ouverte par cette mission.
4. Recetter le lot final localement : Territoire (feu + fibre et volets), Où vivre, Dossier comparatif gratuit/payant inchangé, classement/synthèses/cache, parcours ONRN et données tracées. Rejouer tests, TypeScript, build et contrôles visuels nécessaires.
5. Après **autorisation de livraison explicite**, une seule fusion de cette PR de regroupement sur `main`, donc un seul événement Git de production prévu. Ne pas fusionner #104 et #105 séparément sur `main`. Aucun déploiement CLI ou rebuild de mesure.

## Pièces jointes

- `2026-10-28-vercel-storage/deployments.json` : inventaire et classification préparatoire, horodatés ; à rafraîchir avant suppression.
- `2026-10-28-vercel-storage/traces-comparison.json` : neuf différences de traces, tailles brutes et données runtime restantes.
- `2026-10-28-vercel-storage/integration-104-105.patch` : résolution locale cumulée des six fichiers communs, par rapport à #104 ; à appliquer après intégration des ajouts non conflictuels de #105.
- `scripts/vercel/onrn-file-tracing.test.mjs` : test du traceur et recette isolée des deux tables ONRN.
