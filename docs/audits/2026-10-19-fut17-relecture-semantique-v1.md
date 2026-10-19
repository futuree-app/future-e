# FUT-17 : relecture sémantique finale des compositions V1

Date : 19/10/2026. Branche `fix/fut-17-relecture-semantique-v1`, partie de `origin/main` `5358667f` (FUT-20 fusionné). PR #68.
Périmètre : ce que le dossier de décision **raconte** (titres, verdicts, résumés, gestes), composition par composition, sur le rendu réel de `DossierDecisionSection` (présentation classique, verdict déterministe) et les vraies données DRIAS.
Hors périmètre : fusion, déploiement, génération réelle de dossier, appel Anthropic, données de production.

**Verdict final : GO** sur la sûreté sémantique déterministe du périmètre testé (E). La première version du rapport concluait NO GO à cause de la règle transports × chaleur (D7). Le porteur l'a tranchée : règle retirée, moteur `engine-6` (B, A3).

---

## A. Inventaire de couverture

| Composition / surface | Verdict | Note |
|---|---|---|
| `ambient_heat_housing` (niveaux de preuve A, B1, C) | Conforme | |
| `wildfire_exposure` | Conforme | Deux fondements ; le geste suit le grain. |
| `territory-size-multiple-consequences` | Conforme | |
| `clay_regulation_grouped` | Conforme | Cas négatif d'un plan inondation contrôlé. |
| Cartes condition (FUT-110) | Conforme | Le sens est préservé. |
| Côté logement FUT-20 | Conforme | Nîmes, La Rochelle sous le seuil, A, B1, C. |
| FUT-112 | Conforme | Aucune progression affirmée dans le dossier rendu. |
| Îlot de chaleur × espace vert | Conforme | |
| Lecture inondation à trois sources | Conforme | |
| Conclusion Autour | Conforme | |
| `seasonal_climate_tradeoff` | **Corrigé** | Sujet du verdict (A1). |
| `climate_comfort` | **Corrigé** | Titre sans logement (A2). |
| Règle transports × chaleur (D7, FUT-85) | **Retirée** (engine-6) | A3, arbitrage du porteur. |

**Limites de couverture :**
- La présentation « Relevé » n'a pas été contrôlée : elle est éteinte en production (`DECISION_RELEVE` absent des variables Vercel).
- La conclusion rédigée par l'IA et la synthèse IA du module Logement ne sont pas contrôlées : elles ne sont pas déterministes et l'appel Anthropic est hors périmètre. Seul le repli déterministe a été vérifié.
- Aucun artefact réel de production n'a été inspecté. La compatibilité est prouvée sur des artefacts produits par le code de `main`, figés en fixture.
- L'outre-mer n'a pas été testé au-delà de l'absence de données DRIAS.

## B. Anomalies démontrées

### Corrigées dans cette branche

**A1. Sujet du compromis hivers doux / étés chauds. Gravité élevée.** `src/lib/decision/fact-compositions.ts`, `composeSeasonalClimateTradeoff`.
- Avant : « Nîmes répond moins bien à une de vos priorités : l'exposition aux fortes chaleurs. » La priorité déclarée du lecteur y était inversée.
- Après : « … : des étés supportables. » `headlineSubject` reprend celui du mismatch chaleur, comme `climate_comfort`.
- Atteignabilité : sur toutes les orientations atteignables, ce sujet n'est servi que dans les gabarits de priorité. Le gabarit « Le principal point à contrôler » est inatteignable pour ce compromis : un tradeoff structurant oriente toujours vers l'arbitrage, et un tradeoff secondaire est exclu.

**A2. Titre de la carte chaleur sans logement. Gravité faible.** Même fichier, `composeClimateComfort`.
- Avant : « Des étés plus difficiles à concilier avec votre projet ».
- Après : « De fortes chaleurs projetées à l'horizon 2050 » (via `CLIMAT_HORIZON_LABEL`).
- Motif : l'ancien titre affirmait une évolution que la classification ne lit pas (elle lit un niveau à 2050) et qualifiait une saison entière. À Montpellier, la carte est déclenchée par les seules nuits tropicales. Le nouveau titre suit la doctrine de la relecture éditoriale FUT-20 : nommer le niveau projeté.
- Portée historique : avant correction, ce titre n'apparaissait que dans les dossiers sans adresse et dans les artefacts d'avant FUT-20 (avec une adresse, `confortEte` est toujours fourni). Les données confirment l'évolution : les 5 461 communes défavorables ont une référence 1976-2005, et chaque axe retenu progresse d'au moins 5 jours ou nuits par an. Le défaut tenait à la seule formulation.

**A3. Règle transports × chaleur (D7 de FUT-85). Gravité moyenne. Retirée sur décision du porteur.**
- Le défaut : la règle `territoire.compromis-transport-chaleur` se déclenchait quand les deux priorités étaient déclarées (poids ≥ 2), avec l'indice interne transports ≥ 60 et l'indice interne chaleur ≤ 40. Elle affirmait « Votre priorité de faible exposition à la chaleur est moins bien satisfaite ici » sur un indice que le lecteur ne voit pas, sous une autre convention que la règle chaleur. Celle-ci lit DRIAS : 8 jours au-dessus de 35 °C et 25 nuits tropicales à 2050. Le verdict nommait ensuite « Le principal point à contrôler : la tension entre transports et chaleur », puis « Tant que ces points ne sont pas levés… ». Exemple réel : « Le principal point à contrôler à Strasbourg : la tension entre transports et chaleur. »
- **Correction de la première version du rapport :** La Rochelle y était citée comme cas vérifié. Sur l'index actuel, son indice chaleur vaut 40,5 et Nantes est à 42,75 : aucune des deux ne déclenche D7. Les exemples vérifiés de contradiction sont Strasbourg, Dijon, Grenoble, Saint-Étienne, Clermont-Ferrand et les 18e, 19e et 20e arrondissements de Paris.
- **Décision (porteur, 19/10/2026, consignée sur FUT-17) :** retrait complet, sans règle de remplacement. Aucun seuil de chaleur ni aucune convention de mobilité n'est modifié pour compenser.
- Justification : en harmonisant les seuils, la règle garderait un arbitrage fondé sur deux indices internes, sans démonstration de la desserte réelle. Là où elle ne contredisait pas la règle chaleur, elle répétait une information déjà présente (C).
- Implémentation :
  - `materiality-rules.ts` : retrait de la règle, de son enregistrement, des helpers `scoreEvidence` et `LIBELLE_INDICE`, et de l'import `CompromiseFact`, devenus inutilisés.
  - `decision-artifact.ts` : `ENGINE_VERSION` passe à `engine-6`, avec le motif du changement de contrat.
  - Le type `CompromiseFact` et son rendu restent : les artefacts vendus sous engine-5 en portent un.

### Non corrigées

**A4. Module Territoire (`QuartierClimatData.tsx`) : phrases non calculées.** Elles sont sorties de cette branche et confiées à **FUT-116**, sans travail ici.
- `:288` : « La progression s'accélère, elle ne fait pas que monter. »
- `:274` : « les nuits d'été gardent de plus en plus la chaleur du jour ».
- `:1021` : `buildParagraphs`, du code mort.

**A5. Défaut latent, non bloquant.** « Une trajectoire de danger d'incendie qui s'aggrave » (`fact-compositions.ts:200`) n'est pas conditionné à la hausse. Aucune commune n'est concernée sur les données actuelles.

**A6. Repli sans données logement, gravité faible, non bloquant.** Le dossier commune réutilisé demande « Renseignez votre adresse… » alors que l'adresse est connue (`assemble-address-dossier.ts:121`).

**Notes jugées conformes :**
- La douceur des hivers se lit deux fois quand elle est confirmée comme condition.
- Deux temporalités coexistent dans le compromis saisonnier : douceur sur 1976-2005, chaleur en 2050. La période est donnée dans la preuve.
- `whyNotDecided` de la condition chaleur dit « lecture faite à l'échelle de la commune » à côté du bloc « À cette adresse ».
- Résumé argiles : « Le sol argileux expose le bâti ».

**Note résiduelle pour le porteur, hors mandat :** l'indice interne `faible_chaleur` sert toujours au comparateur (palier « Étés frais / tempérés / chauds »). Sur les 2 796 communes de la contradiction, le comparateur et le dossier peuvent donc toujours juger la chaleur différemment : l'un par rang relatif, l'autre par seuil DRIAS absolu. Le retrait de D7 supprime cette divergence à l'intérieur du dossier, pas entre les surfaces.

## C. Mesure avant / après du retrait de D7

**Méthode :**
- Une sonde temporaire, non commitée, génère les dossiers sur l'index réel (`data/comparateur-index.json.gz`, 34 788 communes) et les vraies données DRIAS, avant puis après le retrait, sur les mêmes entrées. Aucun réseau, aucun appel Anthropic, aucune écriture en production.
- Entrées : les **4 932 communes** où D7 se déclenche, chacune avec 7 projets.
  - 4 combinaisons de poids (2 ou 3) pour transports et chaleur ;
  - avec l'accès aux soins en plus ;
  - avec la chaleur confirmée comme condition ;
  - avec une adresse (logement témoin).
- Soit **34 524 dossiers**.

| Mesure | Avant | Après |
|---|---|---|
| Dossiers qui portent la carte D7 | 34 524 | **0** |
| Communes en contradiction : D7 dit « moins bien satisfaite », la règle chaleur classe sous le seuil | 2 796 | **0** |
| Communes où D7 répétait la carte chaleur (écart déjà dit, preuves DRIAS) | 2 136 | 0 (la carte chaleur reste) |
| Priorités devenues non examinées | | **0** |
| Nouveaux résultats sans donnée (`uncertain`) | | **0** |
| Différences hors effets directs du retrait (sections, compositions, autres critères, règles citées) | | **0** |

**Registre des critères :**

| Critère | Avant | Après | Dossiers | Lecture |
|---|---|---|---|---|
| `faible_chaleur` | réserve structurante (D7) | favorable | 16 776 | Les 2 796 communes de la contradiction × 6 projets : la règle chaleur canonique s'applique. |
| `faible_chaleur` | écart, structurant | écart (sans réserve D7) | 12 816 | Les 2 136 communes du doublon : l'écart reste dit par la carte chaleur. |
| `faible_chaleur` | à confirmer | à confirmer | 4 932 | Projet « chaleur confirmée » : la condition reste ouverte. |
| `acces_transports` | réserve structurante (D7) | favorable | 15 631 | 2 233 communes : le rang et la gare le confirment. |
| `acces_transports` | réserve structurante (D7) | sans signal marqué (`indeterminate`) | 18 893 | 2 699 communes : examinées, rang au milieu, pas de signal marqué. D7 y affirmait « L'accès aux transports ressort favorablement » sur le seul indice interne. |

**Verdicts :** 21 048 dossiers changent d'étiquette, de ton, d'orientation et de héros. 13 476 gardent leur étiquette : 8 544 « Arbitrage » et 4 932 « Condition ouverte ».

| Avant | Après | Dossiers |
|---|---|---|
| Correspondance à nuancer | Bonne correspondance | 11 885 |
| Correspondance à nuancer | Correspondance favorable | 4 546 |
| Correspondance à nuancer | Correspondance avec un écart | 2 462 |
| Correspondance à nuancer | Correspondance sans signal marqué | 2 154 |
| Lecture encore partielle | Correspondance favorable | 1 |

- Le héros « Le principal point à contrôler à {commune} : la tension entre transports et chaleur. » disparaît. Strasbourg devient « Strasbourg répond à deux de vos priorités, dont l'accès au train. »
- Le cas unique « Lecture encore partielle » est Orée d'Anjou, avec un projet qui ajoute l'accès aux soins, non examiné. L'orientation favorable passe avant la couverture (`conclusion-plan.ts:1264`), comme ailleurs dans le moteur. Le détail dit toujours « La lecture reste incomplète : d'autres critères de votre projet n'ont pas encore pu être examinés. »

**Cartes et gestes :**
- La carte D7 disparaît. Elle ne portait pas de geste.
- Les contrôles changent sur 1 626 dossiers, tous avec adresse ou accès aux soins : la carte structurante D7 occupait une place plafonnée, et des contrôles déjà présents remontent en visibles. Le total ne change pas (par exemple 1 visible + 5 en plus devient 4 + 2).
- Pour la même raison, la minute de 3 123 dossiers se complète avec des constats déjà présents, et le détail de 4 dossiers « Arbitrage » dit qu'« un constat reste par ailleurs à contrôler ».

**Aucune conclusion artificiellement favorable :**
- Le « favorable » chaleur vient de la règle canonique, qui exige les deux axes DRIAS mesurés sous les seuils déclarés. Un axe non lu donne « non conclu », jamais « favorable ». Un test le vérifie, données climatiques absentes.
- Là où la chaleur dépasse le seuil (2 136 communes, dont Nîmes et Montpellier), l'écart reste dit avec ses preuves.
- Sur les transports, D7 seule affirmait un côté favorable, et 2 699 communes passent à « sans signal marqué ». Le retrait retire donc aussi une affirmation favorable non fondée.

**Contrôles nommés :**

| Commune | D7 avant | Après |
|---|---|---|
| Strasbourg (contradiction) | « Le principal point à contrôler… tension entre transports et chaleur » | Chaleur favorable (règle canonique), transports favorables, aucune trace de D7 |
| Nîmes, Montpellier (doublon) | Carte D7 + carte chaleur | Carte chaleur seule, « des étés supportables » nommé, écart maintenu |
| La Rochelle, Nantes | Non déclenchée (indice 40,5 et 42,75) | Inchangé : la règle chaleur seule, D7 sort de la trace du registre |

## D. Compatibilité et versionnement

- **`engine-6` justifié.** Le registre des critères change : issue de `faible_chaleur` et de `acces_transports`, règles citées. Pour tout projet qui déclare la chaleur, `territoire.compromis-transport-chaleur` quitte la liste `ruleIds`. Ce que le moteur conclut change donc, et le contrat de `ENGINE_VERSION` exige un incrément, comme pour FUT-110. Les conventions (`PRODUCT_CONVENTIONS_VERSION`) ne changent pas.
- **Artefacts engine-5 lisibles et inchangés :**
  - Les quatre artefacts figés d'avant FUT-17 (`fut17-artefacts-avant.json`, non modifiés) et trois nouveaux artefacts produits par `main` `5358667f` avec la carte D7 (`fut17-artefacts-d7-avant.json` : Strasbourg sans et avec adresse, Nîmes) sont relus et rendus mot pour mot. Héros et empreinte de conclusion restent inchangés.
  - Aucune réécriture, aucune migration, aucune régénération forcée.
- **Nouveaux artefacts sous `engine-6`.** Testé sur la génération neuve.
- **Plusieurs analyses de versions différentes.** Le choix de la version servie (`etatArtefact`, `dossierAServir`) ne lit jamais `engineVersion`, seulement le numéro et le statut.
  - Une v2 engine-6 prête se sert.
  - Une v2 en cours ou échouée ne masque jamais la v1 engine-5, qui se rend à l'identique.
  - Une autre commune du même lecteur, sous engine-6, n'interfère pas.
  - Ces quatre cas sont testés.
- **Base de données.** La colonne `decision_artifact.engine_version` est un texte libre, sans contrainte (`supabase/28_decision_artifact.sql`).
- **Comparatif payant (2 ou 3 communes, 39 €).** Il passe par `comparateur/pack-decision` → `comparateur-vie` (`matchProjects`, `ComparaisonComplete`, `decision-packs`), qui n'importe ni le moteur de règles ni `decision-artifact`. Il ne dépend pas de la version du moteur. `comparaison-candidats.ts`, qui refuse de rapprocher deux moteurs, n'est importé que par `decision-artifact.ts` et n'est pas rendu dans le parcours public. Rien n'a été développé dessus.
- **Dossiers vivants**, sans artefact : verdict et plan changent sur les cas de C, donc l'empreinte aussi. La conclusion rédigée sera régénérée une fois, à la prochaine ouverture, comme après FUT-20 et FUT-110.
- **Accueil.** Les données de l'accueil, qui passent par le moteur, sont reconstruites à l'identique par le build : D7 n'y intervenait pas.

## E. Tests et verdict

**Tests :**
- **Suite complète, lancée seule :** **2 773 / 2 773**, 0 échec. Le compte part de 2 768 : 2 anciens tests de la règle sont remplacés par 2 tests du nouveau comportement, et 5 tests D7 s'ajoutent au test sémantique.
- `tsc --noEmit` OK, eslint 0 erreur sur les fichiers touchés, `npm run build` OK (277 pages).
- `src/lib/fut17-relecture-semantique.test.ts` : 19 tests sur le rendu réel de `DossierDecisionSection`, avec les vraies données DRIAS et les scores réels de l'index.
  - 14 couvrent les corrections A1 et A2 et les compositions. Sur `main`, 5 de ces 14 échouaient.
  - 5 couvrent D7 :
    - les artefacts D7 figés ;
    - Strasbourg ;
    - Nîmes et Montpellier ;
    - La Rochelle et Nantes ;
    - plusieurs analyses sous deux moteurs.
- `materiality-rules.test.ts` : les deux tests de la règle sont remplacés.
  - D7 retirée, chaque priorité garde sa règle.
  - Sans DRIAS, la chaleur reste non conclue, jamais favorable.
- Tests de version FUT-110 et FUT-20 : la génération neuve porte `engine-6`.
- Le test FUT-17 de régénération des artefacts figés reste exact : seules les deux formulations corrigées et la trace D7 du registre changent.
- Fixtures :
  - `fut17-artefacts-avant.json` : figée, non régénérée ;
  - `fut17-artefacts-d7-avant.json` : nouvelle, générée par `main` `5358667f`, à ne jamais régénérer.
- Sondes temporaires : non commitées.
- **Effet de la sortie forcée :** lors d'un passage intermédiaire avec un test en échec, `--test-force-exit` a perdu les quatre derniers tests d'un fichier après un très long diff d'échec. Le passage final, entièrement vert, les compte tous.

**Verdict : GO** sur la sûreté sémantique déterministe du dossier, pour le périmètre testé :
- présentation classique ;
- verdict déterministe ;
- compositions V1 ;
- règles de matérialité ;
- compatibilité des artefacts.

Ce GO ne certifie pas :
- les textes produits par Anthropic (conclusion rédigée, synthèse Logement) ;
- la présentation « Relevé » ;
- les artefacts réels de production, non inspectés ;
- le module Territoire (FUT-116).

A5 et A6 restent documentés, non bloquants.

**Ne pas fusionner avant revue humaine.**
