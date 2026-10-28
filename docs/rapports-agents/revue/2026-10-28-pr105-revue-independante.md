# PR #105 / FUT-148 — revue indépendante ciblée

## Verdict

**GO technique sur `f9e491385365fa2b40bbebcba5091ee352b61cc4`**, base `4d75603f0839c73962cce4ba1a169a31bc827531`. Aucun défaut métier bloquant démontré et aucun correctif applicatif nécessaire pour cette tête. La recette visuelle du lot intégré reste à terminer par le responsable de la livraison ; ce GO ne vaut ni fusion ni autorisation de déployer.

Revue effectuée indépendamment du chantier d'implémentation, dans un worktree détaché. Aucun accès en écriture à Vercel, aucun changement GitHub/Linear, aucune donnée de production modifiée, aucun appel à un modèle. FUT-156 et l'attribution d'un statut fibre à l'adresse restent exclus.

## 1. Sources primaires relues

Deux ressources officielles ont été retéléchargées, sans utiliser le cache ni le parseur de l'auteur :

- ZIP communal : `https://static.data.gouv.fr/resources/le-marche-du-haut-et-tres-haut-debit-fixe-deploiements/20260910-162103/2026t2-commune.zip` ; 32 714 735 octets ; SHA-256 `267604f9684d2cd04eba1f2b038ce2bda8c6077daed37f2a176e383d099eb468`.
- Classeur de contrôle : `https://static.data.gouv.fr/resources/le-marche-du-haut-et-tres-haut-debit-fixe-deploiements/20260910-162110/2026t2-obs-hd-thd-deploiement-vf.xlsx` ; 23 646 514 octets ; SHA-256 `507a94371f535d711fe96f8e1beb5cd4d1e7a5dd27ac6762f31867b35303c806`.

Les deux empreintes concordent avec les métadonnées embarquées. Le script Python de contre-lecture joint utilise `struct`, `zipfile` et le parseur XML standard ; il ne réutilise ni `lireDbf`, ni `construireTableFibre`, ni la lecture XLSX de la PR.

La méthode a également été vérifiée directement sur :

- [Carte officielle, aide « Taux de couverture FttH »](https://cartefibre.arcep.fr/) : ratio entre locaux raccordables déclarés et meilleure estimation des locaux par IPE ou Insee ; la maille commune et la maille adresse sont distinctes.
- [Observatoire T2 2026](https://www.arcep.fr/cartes-et-donnees/nos-publications-chiffrees/observatoire-des-abonnements-et-deploiements-du-haut-et-tres-haut-debit/derniers-chiffres.html), arrêté au 30 juin, publication du 10 septembre 2026.
- [PDF de l'observatoire T2 2026](https://www.arcep.fr/fileadmin/cru-1790833284/reprise/observatoire/HD-THD-2017/2026-t2/Observatoire_HD_THD_T2_2026.pdf), § 3.2, page 7 : les locaux raccordables sur demande figurent dans les 4,7 % restant à rendre raccordables. Ils ne doivent pas être additionnés au numérateur FttH.

## 2. Contre-lecture exhaustive des effectifs

Le parseur indépendant retrouve 34 919 enregistrements DBF. Pour tous les codes, comparaison des valeurs `Locaux`, `ftth`, origine du dénominateur, classe de couverture et somme nationale avec la table publiée :

| Contrôle indépendant | Résultat |
|---|---:|
| Écarts avec les 34 918 lignes publiées | **0** |
| Classes `couv` contredites par `ftth / Locaux` | **0** |
| Dénominateurs Insee, brut et table publiée | **4 199** |
| Total national locaux | **45 178 019** |
| Total national raccordables | **43 063 602** |
| Discordance volontairement exclue de la table mesurée | **Thumeréville, 54524** |
| Autre écart entre ZIP et classeur, sans effet sur le taux | **Haucourt-Moulaine, 54254** |

Les totaux nationaux incluent aussi la ligne source mise en discordance, ce qui est correct pour reproduire la somme de la publication. L'affichage local de cette ligne est néanmoins refusé.

Cas recoupés depuis les sources brutes :

| Commune | Locaux / raccordables | Conclusion |
|---|---:|---|
| Chabreloche | 742,10112 / 0 | Aucun local raccordable, pas « absence d'Internet » |
| Gelles | 828 / 0 | Même distinction |
| Job | 765,06062 / 22 | 2,88 %, affiché 3 % |
| Rochefourchat | 7,66667 / 7 | 91 %, dénominateur Insee estimé |
| Murat (15) | 1 650 / 1 579 | 96 % |
| Brasparts | 904 / 878 | 97 % |
| Thumeréville | ZIP 472 / 49 ; classeur 52 / 49 | Aucun taux affiché |
| Haucourt-Moulaine | ZIP 1 577,2693 / 0 ; classeur 1 686 / 0 | 0 raccordable dans les deux sources, dénominateur discordant sans effet sur la part |
| Beaumont-en-Verdunois | 0 / 0 | `sans_locaux`, aucun taux |

Les sommes des arrondissements redonnent indépendamment les lignes communales du classeur : Paris **1 811 579 / 1 744 131**, Lyon **389 332 / 381 720**, Marseille **544 863 / 489 661**. Aucune moyenne de pourcentages n'est utilisée.

## 3. Contre-cas de lecture et restitution

Le script JS distinct joint parcourt les **34 917 communes mesurées**, compare `partEntiere` à un oracle indépendant `floor(100*ftth/locaux + 0.5)` borné selon les décisions produit, et contrôle la présence de la réserve sur l'adresse dans chaque volet. Résultat : aucune divergence.

Sont aussi passés :

- 1 commune sans locaux : valeur « — », pas 0 % ;
- 4 codes absents, dont `__proto__` et Saint-Pierre-et-Miquelon : état `absente`, pas de taux ;
- 1 commune discordante : pas de taux ;
- Paris avec un arrondissement retiré : état `absente`, jamais une somme partielle ;
- Paris avec un arrondissement déclaré discordant : état `discordante`.

Le code de rendu pose la fibre dans un facteur séparé de `buildFactors`. La page Territoire lit la donnée après le snapshot ; le volet nomme sa portée communale, sa date, les limites et un lien officiel de vérification. La route Où vivre ajoute la ligne **après** `matchProjects` et après la coupe à trois, sans tri supplémentaire. Le texte d'une commune non raccordable préserve explicitement la possibilité d'autres technologies d'accès à Internet.

Aucune lecture du taux communal ne devient une éligibilité du logement, un débit garanti, un nombre d'opérateurs ou un statut de bâtiment. Le signal « télétravail » demeure celui arbitré (`horsMesure`), sans emploiHorsSujet ni nouveau critère.

## 4. Scores, classements et frontière IA

- Après effacement des types et commentaires TypeScript, le JavaScript de `comparateur-vie.ts` est **strictement identique** à la base. Le changement de ce fichier est seulement un champ optionnel de résultat.
- Cinq projets et quatre trios ont été rejoués et comparés strictement à la référence de `main 4d75603f` : communes, scores, raisons, compromis, couverture, paliers et comparatifs identiques. Les deux JSON ont le même SHA-256 : `f96fcd889664f5048db28910dde834805afe2099f4fbb863d3cccbef6a489b06`.
- Les sources du snapshot Territoire, des faits, du contrat et de la clé de cache de synthèse sont inchangées. Aucun taux Arcep n'y est transmis.
- La synthèse Où vivre reçoit la même projection explicite des résultats ; la nouvelle propriété `fibre` n'est pas copiée dans sa charge utile.
- Aucun appel de modèle dans la chaîne de lecture/construction fibre.

**Précision nécessaire :** la phrase des limites du Dossier est volontairement corrigée dans `conclusion-plan.ts` quand un projet mentionne la fibre. Ce texte générique peut participer au plan narratif et donc à son empreinte, conformément au fonctionnement existant. Il serait inexact d'affirmer que toute prose de conclusion Dossier reste octet pour octet identique dans ce cas. En revanche, aucune valeur de couverture fibre n'entre dans une synthèse IA ; aucun score, classement ou cache Territoire n'est modifié. Ce changement de phrase est explicitement dans le périmètre annoncé de #105, et ne constitue pas un nouveau moteur d'IA.

## 5. Compatibilité #104

Les six conflits déjà identifiés sont de composition, pas d'arbitrage métier : includes BDIFF/Arcep, deux lectures hors snapshot, deux lignes facultatives Où vivre, champs `sections` et `lien` du drawer, props `incendies` et `fibre`, champs facultatifs du résultat.

La compatibilité est favorable si les deux variantes sont conservées, notamment `incendies` transmis à `buildFactors` et le facteur fibre ajouté ensuite. La résolution antérieure ne doit pas écraser un des deux champs. Les têtes source doivent être verrouillées à `46c73eeb` et `f9e49138` pour réutiliser le patch existant. Le responsable de la livraison effectue la recette du lot et le build intégré.

L'arbitrage « Incendies observés » visible dans l'aperçu gratuit demeure acquis et n'a pas été réexaminé.

## 6. Commandes et résultats

```text
node --test src/lib/fut148-fibre.test.ts
43/43 PASS

node --test src/lib/decision/criteria-registry.test.ts src/lib/decision/conclusion-plan.test.ts
157/157 PASS

node node_modules/typescript/bin/tsc --noEmit
PASS, 0 erreur

python docs/rapports-agents/revue/2026-10-28-pr105-verifier-sources.py
PASS, 34 919 lignes primaires recoupées

node docs/rapports-agents/revue/2026-10-28-pr105-contre-cas.mjs
PASS, 34 917 lectures mesurées + états absents/discordants/PLM

node ../verify104/scripts/fut147/capturer-reference.mjs /tmp/review105-match-reference.json
puis comparaison deepStrictEqual avec la référence antérieure
PASS, 5 projets et 4 trios strictement identiques

git diff --check
PASS
```

Aucun nouveau build #105 isolé n'est nécessaire à ces contre-épreuves : le responsable de la livraison construit et inspecte le lot intégré, ce qui couvre les conflits effectivement livrés. Pas de nouvelle recette visuelle autonome de #105 par ce relecteur ; l'interface et les états seront vérifiés dans la recette intégrée du responsable. Les chiffres primaire/états métier ne dépendent pas des captures de l'auteur.

## 7. Remarque non bloquante

Le commentaire d'en-tête de `src/lib/data/arcep-fibre.ts` parle de **4 201** communes à dénominateur Insee. La source brute et la table donnent **4 199**, comme le rapport de la PR. C'est une coquille de commentaire, sans effet au runtime ; la documentation formelle et les données sont correctes. Elle peut être corrigée lors d'une retouche documentaire autorisée, sans retarder le lot.

## Preuves persistées

- `2026-10-28-pr105-verifier-sources.py` : parseur DBF/XML indépendant.
- `2026-10-28-pr105-sources-controle.json` : résultats source, effectifs et communes recoupés.
- `2026-10-28-pr105-contre-cas.mjs` : oracle et contre-cas exhaustifs.
- `2026-10-28-pr105-contre-cas.json` : résumé de cette exécution.

**Conclusion : GO sur la tête exacte, sans correctif applicatif bloquant. La revue ne fusionne, ne déploie et ne remplace pas la recette du lot final.**
