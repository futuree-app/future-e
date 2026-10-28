# Livraison groupée FUT-147, FUT-148 et optimisation ONRN

## Décision technique

**GO technique pour le regroupement de #104 + #105 + #106, sur les têtes ci-dessous.** Aucun défaut métier bloquant retrouvé. Aucune fusion sur `main`, aucun déploiement Vercel ni aucune suppression manuelle effectués. L'autorisation de production reste exclusivement celle du porteur.

Le contrôle des coûts des 29–30 octobre ne bloque ni la préparation ni une livraison autorisée. Les scénarios 5,62 $ et 1,76 $/mois ne sont pas des économies acquises.

| Référence | SHA validé | Décision |
|---|---|---|
| `main` de départ | `4d75603f0839c73962cce4ba1a169a31bc827531` | Production active inchangée |
| #104 / FUT-147 | `46c73eeb237a2c925d87ced3e2905c91e3391149` | Validation déjà acquise, SHA confirmé ; pas de nouvelle revue exhaustive |
| #105 / FUT-148 | `f9e491385365fa2b40bbebcba5091ee352b61cc4` | GO indépendant ciblé, aucune correction applicative requise |
| #106 / ONRN | `60409a97cb630b0cb43fcb819dd16f6c5b14a76c` | GO indépendant ciblé ; Draft → Ready for review effectué |
| Application intégrée locale | `2447b19860a3610e70b8e2c3d115c31436f9dfce` | Six conflits résolus, code applicatif validé comme ci-dessous |

Les rapports et scripts ajoutés après ce commit applicatif sont des preuves de recette et de suivi ; ils ne modifient aucun fichier applicatif, dépendance, configuration Next ou Vercel.

## Revues indépendantes

### #106

Un relecteur distinct de l'auteur a reconstruit localement, examiné 163 traces et exécuté le lecteur ONRN **minifié réellement produit par Next.js**, dans neuf paquets isolés construits depuis les `.nft.json` consommateurs.

- Les deux tables ONRN sont dans chacun des neuf paquets.
- **313 560 comparaisons strictes** base/tête : 34 839 codes réels + une sentinelle inconnue × 9 paquets. Aucune commune disponible ne devient `indispo`.
- Deux lectures disque puis cache ; le cas négatif du JSON absent conserve le comportement historique avant/après.
- **119 tests ciblés verts**, build complet et TypeScript réussis.
- Réduction reproduite : **2 706 312 672 → 722 663 203 octets de données cumulés**, sans hypothèse de partage, compression ou facturation des bundles Vercel.

Le `catch` historique de lecture reste volontairement identique. La présence des fichiers est vérifiée par les traces et par leur exécution isolée ; aucune panne réelle n'a été masquée pour faire passer les tests.

### #105

Un autre relecteur a retéléchargé les deux sources primaires Arcep et utilisé un parseur Python DBF/XML distinct de l'importeur de la PR.

- **34 919 lignes** recoupées entre publication communale, classeur et table : zéro écart métier ; **4 199** dénominateurs Insee.
- Oracle indépendant d'arrondi et de texte sur **34 917 communes mesurées**, puis cas sans locaux, absents, discordants et agrégations PLM.
- Job 3 %, Rochefourchat 91 %, Brasparts 97 % ; Chabreloche/Gelles sans local raccordable ; Thumeréville sans taux à cause de la discordance ; Beaumont-en-Verdunois sans taux car 0 local.
- **200 tests ciblés** et TypeScript verts ; cinq projets et quatre trios strictement identiques à la référence `main` pour scores, ordre, raisons, couvertures et comparatifs.
- Aucun taux Arcep injecté dans le snapshot/cache Territoire ou la synthèse Où vivre. La phrase générique des limites du Dossier pour « fibre » change volontairement : ne pas la décrire comme une prose octet pour octet inchangée.

Seule remarque non bloquante : le commentaire d'en-tête `arcep-fibre.ts` dit 4 201 au lieu de 4 199 ; la table et les rapports sont corrects. Aucun changement de tête imposé pour une coquille sans effet runtime.

Les deux verdicts ont été consignés dans des reviews GitHub de type COMMENT, au SHA exact, sans simuler une approbation par un autre compte. Rapports complets et contre-épreuves : `docs/rapports-agents/revue/2026-10-28-pr105-*` et `2026-10-28-pr106-*`.

## Résolution des six conflits

L'ancien patch de simulation ne s'applique qu'aux mêmes têtes, confirmées inchangées. Il a été réutilisé, puis relu indépendamment sur le commit applicatif intégré.

| Fichier | Résolution conservée |
|---|---|
| `next.config.ts` | Deux tables, includes étroits BDIFF et Arcep selon leurs consommateurs |
| `/rapport/quartier` | Deux lectures hors snapshot, deux props `incendies` + `fibre` |
| `OuVivreClient.tsx` | Deux lignes facultatives, conditions de chaque fonctionnalité conservées |
| `MetricDrawer.tsx` | `sections` et `lien` optionnels, leurs deux rendus conservés |
| `QuartierClimatData.tsx` | `incendies` transmis à `buildFactors`, facteur fibre ajouté ensuite et rang projet préservé |
| `comparateur-vie.ts` | Champs facultatifs des deux ajouts ; aucun changement du score pour la fibre |

Le relecteur de #105 a aussi confirmé les six résolutions sur `2447b198`, sans perte d'ajout ni défaut concret. Les vues aperçu et Pack sont identiques à #104 ; **« Incendies observés » reste dans l'aperçu gratuit**, sans modification de la troncature gratuit/payant. FUT-156, son POC et l'éligibilité fibre à l'adresse ne sont pas intégrés.

## Validation du lot final

| Contrôle | Résultat |
|---|---|
| Suite complète, `node --test --test-concurrency=1 'src/**/*.test.ts' 'scripts/**/*.test.mjs'` | **3 746 / 3 746**, 0 échec, 0 ignoré |
| `npm run build`, prébuild compris | **Réussi**, compilation, TypeScript, 283 pages |
| ESLint des fichiers applicatifs résolus/ONRN | **0 erreur**, un avertissement antérieur `tailleVilleFrom` inutilisé |
| `git diff --check` | Passe |
| Composants réels Territoire | SSR des deux cartes ensemble, fibre Brasparts 97 %, puis ouverture React en mémoire des deux volets ; récit BDIFF et lien Arcep correctement distincts |
| Composant réel Logement | Les deux périls ONRN de Toulouse sont rendus sans état indisponible |
| Route HTTP réelle `match` du build de production | Trois résultats ; ajout fibre après classement ; égalité stricte de tous les autres champs/ordre entre avec et sans le signal fibre |
| Aperçus HTTP | `/comparateur?communes=29016,29162,29103` et `/ou-vivre` répondent 200 ; ligne BDIFF présente dans le comparateur gratuit |
| Protection des données payantes | `comparaisonComplete` et `pistes` absents de la réponse gratuite `match` |
| Routes authentifiées | Sans session, `/rapport`, `/rapport/quartier`, `/rapport/logement` portent la redirection Next vers `/connexion` (possible HTTP 200 en streaming, donc contrôle du marqueur/cible, pas seulement du statut) |
| Bancs dev du build de production | `/dev/fut147`, `/dev/fut148` répondent 404 |
| Packaging ONRN intégré | **313 560 égalités** supplémentaires avec le lecteur compilé de la base, neuf paquets isolés, données disponibles préservées |
| Données BDIFF/Arcep dans les traces | Deux tables sur Territoire/match, BDIFF sur comparateur et Pack ; fichiers explicitement présents |

Le premier build intégré a été interrompu par l'environnement pendant la génération statique. La relance complète avec toutes les connexions de recette vers un port local fermé a réussi. Aucune vraie clé Supabase/Stripe/IA ni donnée client n'a été utilisée. Les messages ERA5/Supabase en contexte local indisponible sont des dégradations attendues et ne concernent pas le lecteur ONRN.

### Tailles intégrées

Les neuf consommateurs ONRN passent à **733 401 251 octets de données cumulés** après intégration. Le chiffre est légèrement supérieur aux 722,66 Mo de #106 seule parce que BDIFF, légitimement lu par des dépendances, s'ajoute à huit traces. Géorisques conserve trois fichiers ; webhook/actualisation en ont onze ; `/rapport` conserve ses shards BPE nécessaires.

Aucun fichier `data/source/` ni NetCDF ERA5 n'est retrouvé dans ces neuf traces. Les deux JSON ONRN sont présents partout où nécessaires. Le cumul brut, avec répétitions par route, n'est pas une taille de stockage facturée Vercel et ne présume aucun partage interne des bundles.

Preuves reproductibles : `2026-10-28-vercel-storage/integration-components.*`, `integration-http.*`, `integration-traces.json`, `integration-onrn-packaging.*`. Le harnais intégré exige un checkout de base distinct au SHA `4d75603f` ; `ONRN_BASE_BUILD_DIR` peut le désigner explicitement.

### Limite de recette à connaître avant autorisation

**Aucune nouvelle recette visuelle dans un navigateur ni session réelle de production n'est revendiquée.** La prévisualisation locale gérée a annoncé un serveur prêt, puis s'est arrêtée ; ses URLs ont refusé la connexion dans les navigateurs disponibles. Le lancement Next a été adapté uniquement dans le checkout temporaire de recette ; ce lanceur, son `package.json` et ses variables factices ne sont pas livrés.

Les composants réels ont été rendus et leurs volets actionnés en mémoire, et le build de production a été contrôlé en HTTP. Ces vérifications n'équivalent pas à une inspection des pixels bureau/mobile ou Safari. Les recettes individuelles documentées dans #104/#105 restent disponibles, mais ne sont pas présentées comme une nouvelle recette visuelle intégrée. Le GO technique ci-dessus est fondé sur les revues, l'égalité métier, le build, la suite complète et cette recette fonctionnelle ; le porteur doit connaître cette limite pour son GO de production. Une dernière recette navigateur du lot, dès qu'un serveur local accessible est disponible, reste recommandée avant la fusion.

## Livraison unique et garde-fous

La branche de regroupement est destinée à **une seule PR vers `main`**. Les trois têtes sont incluses dans son historique et son arbre final. Ne pas fusionner les trois PR séparément ; la seule opération de production proposée après GO du porteur est la fusion de la PR de regroupement, laissant l'intégration Git Vercel déclencher son unique build prévu.

`vercel.json`, `package.json` et le lockfile sont inchangés par rapport à `main`. La protection reste exactement :

```json
{"git":{"deploymentEnabled":{"**":false,"main":true}}}
```

Pas de CLI deploy, promotion, rebuild de mesure, changement de domaines ou alias. La production active et les rollbacks existants sont conservés. Juste avant une éventuelle fusion autorisée, revérifier `main`, la tête du regroupement, les trois SHAs source et l'absence de dérive ; un changement matériel exige les contrôles concernés.

## Coûts, chantier parallèle

Le 28 octobre : **365 Ready** toujours listés (99 productions, 266 previews) et **361,35 GB** affichés dans Usage sur le cycle courant. Pas de baisse démontrée des journées futures. Deux contrôles en lecture seule sont programmés les 29 et 30 octobre à 18 h Europe/Paris.

Le protocole distingue déploiements visibles, fichiers encore conservés et maximum journalier facturé ; il contient une démarche d'investigation et un brouillon de support non envoyé si la première purge n'entraîne pas de diminution. Voir `2026-10-28-suivi-retention-vercel.md`. Aucun de ces constats ne remet en cause le GO technique du lot ni n'impose d'attendre les relevés pour décider d'une livraison.
