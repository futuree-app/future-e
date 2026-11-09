# FUT-41 · V5 consolidée : revue contradictoire des retours de Work

9 novembre 2026 · branche `explore/fut-41-v4-centre-decision`, commit local `79c834d5`. Rien n'est fusionné ni déployé, Linear n'est pas modifié. Les moteurs, les droits, Supabase, les paiements et les données réelles ne sont pas touchés. Les architectures V4, V4.1 et V5 sont conservées ; aucune V6.

## En bref

Les quatre critiques de Work sont **fondées**. Trois tiennent au prototype lui-même (rubriques vides, statut historique, synthèses). La quatrième (le médecin) tient aux **données fictives** héritées de la V4.1 : le moteur de production traite déjà la présence de médecins comme une simple présence (`src/lib/decision/autour-facts.ts`, ligne 21).

Deux points sont **nuancés** :
- la conclusion ancienne de Rennes n'est pas invalidée en entier, car seule la condition « gare » a changé depuis ;
- « Restent valables » était défendable pour une mesure à jour, mais le libellé disait plus que la mesure.

Sur l'effet « wow », je retiens la piste 3 (« Et si » près de la comparaison) en **essai limité**, et une version **incarnée** de la piste 1. Je ne retiens pas un titre d'arbitrage spectaculaire, que les données de la situation de référence ne permettent pas d'écrire.

**Vérifié** :
- 51 tests du modèle (16 V5, dont 9 nouveaux ; 12 V4.1 ; 23 V4) ;
- recette navigateur : 78 captures sans débordement ni erreur, 50 vérifications sur 50 (8 nouvelles), clavier, mouvement réduit.

**Non vérifié** : aucune personne réelle ; Safari, lecteur d'écran et téléphone physique non testés.

**Recommandation : GO conditionnel** (§ 7).

## 1. Matrice : retour de Work, vérification, verdict, décision

| # | Retour de Work | Vérification (code, scénario) | Verdict | Décision |
|---|---|---|---|---|
| A | « Apporte », « Demande d'accepter » et « Pourrait changer l'arbitrage » affichent « rien » alors que des conditions ne sont pas évaluées | `Comparer5.tsx` affichait « rien » pour toute liste vide. Situation de référence : le T3 près du Thabor (une seule condition lue sur cinq) affichait « Demande d'accepter : rien », et paraissait donc plus simple que le quai de la Fosse, lu sur ses cinq conditions | **Problème confirmé** | Trois états distingués (§ 2.1) ; nombre de conditions lues sous chaque nom |
| B1 | Saint-Félix : « à revoir » dans la fiche, mais « Correspond » sur la condition | `Confrontation.tsx` affichait l'issue du dossier (favorable, écrite sous la limite de 30 min) sans marque d'ancienneté, et la règle colorait la mesure de 23 min comme un dépassement de la limite actuelle | **Problème confirmé**, avec deux défauts : l'issue ancienne présentée comme actuelle, la mesure ancienne présentée comme une preuve de dépassement | Issue affichée « À revoir », suivie de « concluait « correspond » sous votre Projet d'alors » ; règle sans couleur de dépassement, mesure datée |
| B2 | Rennes : conclusion historique positive reprise sur l'accueil | `Ensemble.tsx` citait « Rennes répond à votre Projet. » sans date ni réserve | **Problème confirmé** | Citation datée, « écrite sous votre Projet d'alors », avec la condition à revoir |
| B3 | Rennes : toute la lecture est-elle douteuse ? | Contrat V4 : la péremption se juge condition par condition (`critereAJour`). Entre les révisions 2 et 3, seule la gare a changé ; les nuits, le calme et le quartier ont été lus sous les mêmes exigences | **Rejeté en partie** | Les nuits fraîches et le calme restent comparables entre Nantes et Rennes ; la gare ne l'est pas, et c'est dit |
| B4 | « Restent valables » dans « Et si » affirme trop | `etSi()` (V4.1) range dans ce groupe un lieu dont la mesure est du même côté des deux seuils. C'est juste pour une mesure à jour, mais « valables » sous-entend une conclusion | **Problème confirmé** (de libellé) | « Resteraient du même côté, d'après leur mesure » ; raison réécrite (« sous 20 comme sous 30 min, d'après cette mesure ») par `etSi5`, sans toucher la V4.1 |
| C | « Un médecin disponible » favorable sur la seule présence de généralistes | Données : le rapport de Rennes, le dossier de Saint-Félix et l'analyse simulée de Sainte-Anne le disaient « favorable ». Aucune règle du modèle V5 ne le déduisait. Le moteur de production le refuse déjà | **Confirmé dans les données ; rejeté comme défaut du modèle ou du moteur** | Données corrigées (« à vérifier », « leur disponibilité n'est pas connue ») ; garde `prudente()` dans la V5, pour qu'une donnée future ne refasse pas l'erreur |
| D1 | « Aucun ne bloque…, d'après ce qui est lu » alors que plusieurs logements ne sont pas analysés | `enBref()` écrivait cette phrase dès qu'aucune alerte n'existait, même si la gare n'était mesurée que pour un logement sur trois | **Problème confirmé** | `phraseSansCompromis()` : qui la tient, qui ne la tient pas, qui est à revoir, pour qui elle reste à mesurer |
| D2 | « Ce qui les distingue vraiment » quand seuls des faits communaux se comparent | Entre des logements de Nantes et de Rennes, les seules différences sûres étaient communales ; la phrase ne le disait pas | **Problème confirmé** | « À la commune : … (Nantes moins bien, Rennes correspond) ; cela situe les logements, sans rien dire de chacun » |
| D3 | Différences et inconnues peu incarnées | Les synthèses nommaient des conditions, pas les communes et logements concernés ni l'issue | **Problème confirmé** | Chaque différence nomme qui, à quelle échelle, avec quelle issue ; ce qui manque dit à quoi il servirait |
| P1 | Faire ressortir un arbitrage concret dès la première lecture | Voir § 5 | **Amélioration retenue sous une forme prudente** | Ligne « Entre Nantes et Rennes » incarnée ; pas de titre d'arbitrage |
| P2 | Lieux visibles plus tôt sur l'accueil | La section des lieux commence à environ 1 100 px sur un écran de 1 440 px. Sur l'accueil, la phrase « ce qui manque » répétait « À faire maintenant » | **Amélioration optionnelle, en partie faite** | Répétition supprimée ; inverser synthèse et lieux reste à tester (§ 6) |
| P3 | Rapprocher « Et si » de la comparaison | `etSi5` filtré sur les colonnes affichées, sans état nouveau | **Essai limité retenu** | Bloc replié dans Comparer ; l'adoption reste dans Mon Projet |

## 2. Corrections effectuées

### 2.1 Rubriques vides (A)

La distinction métier comporte trois états, et l'écran les affiche désormais tous les trois :

| État | Ce qu'il veut dire | Ce qui est affiché |
|---|---|---|
| Aucun compromis établi, tout est lu | Les conditions ont été lues ; aucune n'est un compromis | « aucun » |
| Aucun parmi ce qui est lu | Certaines conditions ne sont pas lues : l'absence de compromis ne vaut que pour celles qui le sont | « aucun, parmi ce qui est lu », et sous le nom « lu : 1 condition sur 5 » |
| Pas encore recherché | La condition n'a pas été lue à l'échelle où elle se décide | La rubrique « Pas encore lu », qui dit « tout est lu » quand elle est vide |

Une réserve de la commune reste rappelée comme point à vérifier ; une lecture favorable de la commune n'est jamais créditée au logement (S7, inchangé).

### 2.2 Ancien Projet (B)

- **Dans la confrontation**, une case porte `perime` quand sa ligne a été écrite sous une autre version de la condition. Elle affiche « À revoir » et « concluait « correspond » sous votre Projet d'alors ». La règle montre la mesure, la limite actuelle et la limite d'alors, sans couleur de dépassement, avec la mention « une mise à jour dirait où il en est aujourd'hui ».
- **Le fait, la lecture et le geste restent distincts** :
  - le fait historique : « mesuré le 2 sept. à 23 min, quand la limite était de 30 min » ;
  - la lecture actuelle : « pourrait ne plus tenir la limite de 20 min » ;
  - le geste : « Mettre à jour (gratuit) ».
  Une mesure ancienne au-dessus de la nouvelle limite n'est jamais dite « ne tient pas » (test B).
- **Sur l'accueil**, la conclusion de Rennes est datée et dite à revoir pour la gare.
- **« Et si »** ne promet plus « valables ».

### 2.3 Médecin (C)

Les trois lignes concernées des données fictives sont corrigées. La garde `prudente()` relit toute ligne favorable sur « un médecin disponible » comme « à vérifier ». Elle ne touche aucun autre critère et aucune règle du moteur. En production, il n'y a rien à corriger : `autour-facts.ts` documente déjà que la présence ne dit ni la disponibilité, ni les délais, ni l'acceptation de nouveaux patients.

### 2.4 Synthèses (D)

`enBref()` et `ouVousEnEtes()` rendent des **lignes titrées**. Dans Comparer, trois lignes :
- **Votre condition sans compromis** : qui la tient, qui ne la tient pas, qui est à revoir, pour qui elle reste à mesurer. Au-delà de deux noms, on compte (« pour cinq logements »).
- **Ce qui les distingue** : par échelle, avec les noms et les issues ; à la commune, entre des logements, la phrase rappelle que cela ne dit rien de chacun. S'il n'y a rien : « Rien ne les distingue encore à méthode égale : les autres conditions ne sont pas lues, ou pas de la même façon des deux côtés. »
- **Ce qui manque** : les gestes qui permettraient de comparer au même niveau.

Sur l'accueil, trois lignes au plus : votre recherche, ce qui distingue (seulement entre des communes lues pour le Projet), votre condition sans compromis. Ce qui manque n'est plus répété, puisque « À faire maintenant » le porte.

Exemple, situation de référence, mode logements :

> **Votre condition sans compromis** · Une gare à moins de 20 min : T3 quai de la Fosse (9 min) la tient ; pour T4 rue de la Convention et T3 près du Thabor, elle reste à mesurer depuis l'adresse.
> **Ce qui les distingue** · À la commune : des nuits fraîches l'été (Nantes moins bien, Rennes correspond) et le calme (Nantes compromis, Rennes correspond) ; cela situe les logements, sans rien dire de chacun.
> **Ce qui manque** · L'analyse du T4 rue de la Convention et l'adresse du T3 près du Thabor permettraient de comparer au même niveau.

### 2.5 « Et si » près de la comparaison (P3, essai limité)

Dans Comparer, un bloc **replié** : « Et si votre limite pour la gare changeait ? ». Il reprend les groupes de Mon Projet, restreints aux colonnes affichées. Il est marqué « Essai · votre Projet n'est pas modifié » et renvoie à Mon Projet pour adopter.

## 3. Tests ajoutés et résultats

**Tests du modèle**, `modele5.test.ts` : 9 nouveaux, 16 au total, tous verts. Avec la V4.1 et la V4 : 51 sur 51.

| Test | Ce qu'il garantit |
|---|---|
| A · logement peu documenté | La Fosse est lue sur 5 conditions sur 5 ; Convention et Thabor non ; le « rien à accepter » du Thabor vient de ce qui n'est pas lu |
| B · case périmée | Saint-Félix : `perime`, limite d'alors 30, **pas** `bloque` ; la Fosse n'est pas périmée |
| B · synthèse à revoir | « T3 Saint-Félix (23 min), mesuré sous une ancienne limite, est à revoir », jamais « la tient » ni « ne la tient pas » |
| B · Et si | Aucun libellé « valables » ; la Fosse : « sous 20 comme sous 30 min, d'après cette mesure » |
| C · médecin | Dans toutes les situations, aucune case « médecin » favorable, aucun médecin dans « Apporte » ; la garde relit une ligne favorable en « à vérifier » |
| D · pas de « aucun ne bloque » | La phrase dit pour qui la gare est mesurée et pour qui elle ne l'est pas |
| D · différence communale | « À la commune : … ; cela situe les logements, sans rien dire de chacun » |
| D · communes seules | La gare « se mesure depuis une adresse » ; Rennes dite à revoir |
| D · dix logements | « pour cinq logements, elle reste à mesurer » ; synthèse de moins de 700 caractères |

**Recette navigateur**, `outils/recette5.cjs`, résultat dans `recette-v5.json` : 78 captures, 50 vérifications sur 50.

Ajouts :
- conclusion de Rennes datée sur l'accueil ;
- « aucun, parmi ce qui est lu » et « lu : 1 condition sur 5 » ;
- pas de « aucun ne bloque » ;
- issue ancienne « à revoir » ;
- mesure datée ;
- plus de « restent valables » ;
- « Et si » près de la comparaison ;
- Z12 adapté à la nouvelle phrase (« T2 place Viarme (24 min) ne la tient pas », dite une seule fois).

## 4. Avant / après

Planches dans `consolidation-v5/` (V5 initiale à gauche, consolidée à droite) :

| Planche | Ce qui change |
|---|---|
| 1 · Accueil | Lignes titrées ; la différence entre communes nomme les issues ; Rennes datée ; la gare dite pour qui elle est connue ; plus de répétition avec « À faire » |
| 2 · Comparer des logements | « aucun, parmi ce qui est lu » ; « lu : n conditions sur 5 » sous chaque nom ; médecin « à vérifier » partout |
| 3 · Saint-Félix | « Correspond » devient « À revoir » ; la règle n'est plus rouge ; mesure datée |
| 4 · Même commune | La gare : tenue, à revoir, à mesurer ; « Et si » replié près de la comparaison |
| 5 · Nantes contre Rennes | La gare se mesure depuis une adresse ; Rennes à revoir ; différences communales nommées |

## 5. L'effet « wow » : ce que la V5 révèle vraiment

**Ce que la V5 peut faire percevoir dès maintenant, sans dépasser les preuves :**

1. **Une même commune ne départage pas ses logements.** La case partagée le montre sans phrase. Une annonce ou un comparateur de quartiers ne le dit pas.
2. **Pour qui la condition sans compromis est réellement connue.** « La Fosse la tient (9 min) ; pour les deux autres, elle reste à mesurer » transforme une incertitude diffuse en geste précis.
3. **Ce qu'une analyse apprendra, et ce qu'elle ne dira pas.** La valeur du geste payant est visible avant de payer.
4. **La différence entre un fait daté et une lecture actuelle.** Saint-Félix « à revoir », Rennes datée : la mémoire de la recherche devient un avantage, sans masquer l'ancienneté.

**Ce que je n'ai pas fait, et pourquoi.** Un titre du type « Rennes, plus fraîche et plus calme » est vrai à la commune. Mais en tête d'un écran de logements, il invite à le transférer au T3 près du Thabor, dont on ne sait presque rien. Dans la situation de référence, aucune différence n'est encore établie **entre logements** : un « arbitrage concret vérifié » au niveau des logements serait inventé. La ligne incarnée de la piste 1 est le maximum honnête.

**Ce qui demande de vraies données ou de vraies personnes :**
- un effet fort entre logements suppose au moins deux adresses analysées dans la même condition, sur des données réelles ;
- l'effet de révélation lui-même : on ne sait pas encore ce qu'une personne remarque en premier, et je ne prétends pas connaître sa préférence initiale ;
- la disposition à payer pour l'analyse ou le Pass.

## 6. Questions à tester avec trois à cinq personnes

1. En lisant l'accueil, la personne peut-elle redire **pour qui la gare est connue** et pour qui elle ne l'est pas ?
2. Comprend-elle « **aucun, parmi ce qui est lu** » comme une absence de preuve, et non comme un bon point ?
3. « **À revoir** » et « concluait « correspond » sous votre Projet d'alors » : le comprend-elle comme ni bon ni mauvais, et voit-elle le geste « Mettre à jour » ?
4. « **Cela situe les logements, sans rien dire de chacun** » : la phrase est-elle comprise, ou ignorée ?
5. Ouvre-t-elle le bloc « **Et si** » de Comparer ? Comprend-elle qu'il ne modifie rien ?
6. **Ordre de l'accueil** : préfère-t-elle voir ses lieux avant la synthèse ? (variante à tester, non construite)
7. Qu'est-ce qui la surprend ou lui apprend quelque chose en moins d'une minute ? À noter sans suggérer de réponse.

## 7. Recommandation

**GO conditionnel** pour considérer la V5 consolidée comme référence du développement :

- **GO pour les lots A à C** du plan (`V5-convergence.md` § 7) :
  - socle commune, logement, dossier ;
  - contrat de comparabilité servi par le moteur ;
  - Vue d'ensemble et Mon Projet.
  Les incohérences de sens relevées par Work sont corrigées et couvertes par des tests ; les règles en jeu (péremption par critère, présence ≠ disponibilité, S7, Z12) sont celles du moteur ou de la note FUT-22.
- **NO GO, pour l'instant, pour figer Comparer (lot D) comme spécification de production**, tant que deux conditions ne sont pas réunies :
  1. le test avec trois à cinq personnes (§ 6), en particulier sur la case partagée et « aucun, parmi ce qui est lu » ;
  2. le contrat de comparabilité servi par le moteur (FUT-22, préalable FUT-173). Sans lui, la confrontation de production ne pourrait pas être alimentée honnêtement.

À votre accord : reconstruire la version statique et pousser la branche pour que ChatGPT voie la V5 consolidée. Le lien actuel montre encore la V5 initiale.

## 8. Second retour de Work : lisibilité et scénario d'arbitrage

Work confirme les nuances de la revue (gare et péremption par critère, médecin = défaut des données). Il conteste un point : la synthèse n'est pas « le maximum honnête ». La prudence borne ce qu'on peut affirmer, pas la façon de le rendre clair. **Il a raison.**

| Retour | Vérification | Verdict | Décision |
|---|---|---|---|
| Intitulés en colonne dans la synthèse : phrases comprimées, texte haut | Constaté sur l'accueil (encadré étroit à côté de « À faire ») | **Confirmé** | Intitulés au-dessus de la phrase, qui garde toute la largeur |
| « Nantes moins bien, Rennes correspond » expose les catégories du système | Constaté | **Confirmé** | Phrase courante, par condition nommée : « À l'échelle des communes, Rennes répond mieux que Nantes pour les nuits fraîches l'été et le calme. » |
| Réserve proposée : « Pour les logements, ces deux points restent à vérifier » | Faux pour le quai de la Fosse, dont le calme est lu à l'adresse (compromis) | **Rejeté tel quel, corrigé** | « Pour vos logements, cela se lit à l'adresse : c'est fait pour T3 quai de la Fosse seulement. » |
| « Lu : 5 sur 5 » peut se lire « tout est connu » | La Fosse affichait « tout est lu » avec deux conditions à vérifier | **Confirmé** | « 5 examinées sur 5 · 2 à vérifier » ; « toutes examinées » ; « aucun, parmi ce qui est examiné » |
| Un scénario fictif conçu pour éprouver un arbitrage | Il manquait : aucune situation n'avait deux adresses analysées dans les mêmes conditions | **Retenu** | Situation « Deux adresses analysées : un vrai arbitrage » (données inventées, annoncées comme telles) |
| Une première lecture plus visuelle | La comparaison commençait par du texte | **Retenu** | Bloc « Ce qui change votre choix » : les seules conditions où les logements diffèrent à méthode égale, et celles qui pourraient encore tout changer, avec ce que dit chaque dossier et le poids que vous avez déclaré |
| « Et si » pour l'effet d'un changement de priorité | L'essai de Comparer ne portait que sur la limite de la gare | **Retenu** | L'essai propose aussi « faire d'une priorité une condition sans compromis » (au conditionnel, Projet inchangé) |

**Ce que l'arbitrage montre** (données fictives) : les deux adresses tiennent la gare. Aux abords, la Convention répond mieux pour le calme, qui compte pour vous ; la Fosse répond mieux pour la vie de quartier, qui compte un peu. Les nuits fraîches, qui comptent beaucoup, correspondent à la Convention et restent à vérifier pour la Fosse, avec deux questions prêtes pour la visite. Et si la vie de quartier devenait sans compromis, la Convention pourrait ne plus tenir. Aucun total, aucun gagnant : chaque écart est dit dans les deux sens, et le poids vient de la personne.

**Nouvelles règles du modèle** :
- `ecarts()` compare condition par condition (favorable, puis compromis, puis moins bien), jamais en somme ;
- une différence encore possible n'est jamais rangée parmi les écarts établis ;
- une issue « à revoir » n'entre dans aucun écart.

**Tests** : 4 nouveaux (examinées et à vérifier ; deux écarts opposés sans total ; une différence possible exclue des écarts ; « Et si » sur une priorité). Au total 20 tests V5, et 55 sur 55 avec la V4.1 et la V4.

**Recette** : 84 captures (une vue de plus), 54 vérifications sur 54, dont 4 sur l'arbitrage.

**Ce qui reste ouvert.** Sur un écran de 1 440 px, l'accueil place encore les lieux juste sous le premier écran. Inverser la synthèse et les lieux est une question de test (§ 6, question 6), pas de doctrine. Pour la question « je comprends ce qui change mon choix », la situation d'arbitrage est désormais celle à faire lire en premier aux trois à cinq personnes.

**Recommandation mise à jour** : GO pour le socle et le contrat moteur ; marge d'ajustement de présentation pour la Vue d'ensemble et Mon Projet ; Comparer figé seulement après le test, en commençant par la situation d'arbitrage.
