# FUT-7 : « non négociable » et capacité à trancher

30 septembre 2026. **Phase 1 : audit et proposition. Rien n'est codé.** Aucune migration, aucune
modification de Linear, aucun commit d'implémentation. Base : `main` à `57e36bb4` (FUT-6 mergé).

Lu : `docs/superpowers/specs/2026-09-25-schema-cible-projet-design.md`, `src/lib/user-project.ts`,
`ParsedProject` (`src/lib/comparateur-vie.ts:137`), `src/lib/hard-constraint-schema.ts`,
`src/app/api/comparateur-vie/parse/route.ts`, `src/lib/decision/project-view.ts`,
`src/lib/hard-constraints.ts`, `src/lib/hard-constraints-hydrate.ts`,
`src/lib/decision/hard-constraint-rules.ts`, `src/lib/decision/materiality-rules.ts`,
`src/lib/decision/criteria-registry.ts`, `src/lib/decision/decision-assembler.ts`,
`src/lib/decision/conclusion-plan.ts`, `src/lib/decision/decision-fact.ts`,
`src/lib/decision/projet-materiel.ts`, `src/lib/hard-constraints-filter.ts`,
`src/lib/geo-zones.ts`, les règles de préférence, les surfaces qui écrivent le projet, et les tests
associés (liste au §9).

---

## 1. Résumé exécutif

**Aujourd'hui, la dureté d'un critère n'est jamais décidée par le lecteur.** Elle vient de trois
sources, et aucune n'est un acte de confirmation :

1. **Le parseur (un LLM)** lit une force dans le texte. Sa consigne rend « dure » une mention nue
   (« en Bretagne », « à la montagne »), sans aucun mot fort.
2. **La famille du critère** vaut dureté à elle seule. `nearPlace`, `communeSize`, `excludePlace`,
   `sizeRelativeTo` et `excludeSea` n'ont pas de champ de force : leur simple présence en fait une
   condition éliminatoire.
3. **Le code lui-même** en fabrique. Pour « une ville comme Brest », la route du parseur ajoute
   d'office une exclusion de l'agglomération de Brest et une fourchette de taille.

Ensuite, la chaîne est mécanique : toute famille présente est « déclarée », toute évaluation
incompatible devient un `IncompatibilityFact` `decision_critical`, et le registre passe l'orientation
à `incompatible`. Le lecteur lit **« Condition non respectée »**.

**Reproduit par exécution** (§3, script en annexe) : neuf cas, tous confirmés sur le code de `main`.
Le plus grave :

> Quelqu'un écrit « une ville comme Brest ». Son dossier sur Brest affiche « Condition non
> respectée : Cette commune fait partie de l'agglomération de Brest, que vous souhaitez quitter. »

**L'erreur inverse existe aussi.** Des conditions « tranchées » reposent sur des conventions du produit
(« la montagne » = 600 m, « la façade atlantique » = une liste de départements, « petite ville » =
5 000 à 25 000 habitants). Le texte dit pourtant « que vous avez posés comme limite ».

**Ce que je recommande**, en une phrase par pièce :

- **La capacité** est une fonction pure et fixe du critère, de sa formulation et du grain évalué. Ce
  n'est pas une table `clé → capacité`.
- **La confirmation** est un acte du lecteur, stocké **à côté** de `parsed` et jamais dedans, lié à
  l'empreinte exacte du critère confirmé. Absente, illisible ou périmée, elle vaut « non confirmé ».
- **La règle du verdict** vit dans l'adaptateur dossier, jamais dans le noyau partagé. La Recherche
  continue de filtrer exactement comme aujourd'hui.

---

## 2. Le chemin actuel, étape par étape

Pour chaque étape : ce qui s'y passe, où la dureté se décide, et d'où elle vient.

Légende d'origine : **U** = explicitement l'utilisateur ; **P** = déduction du parseur ;
**M** = transformation moteur ; **L** = convention legacy.

| # | Étape | Fichier | Ce qui décide la dureté | Origine |
|---|---|---|---|---|
| 1 | Texte libre → outil `projet_structure` | `api/comparateur-vie/parse/route.ts:30-191` | Schéma de l'outil : `zones[].strength`, `montagne.strength`, `reliefProche.strength` ∈ {hard, preferred, inspiration} ; `nearSea.active` ; `excludeSea` ; présence de `nearPlace`, `communeSize`, `excludePlace`, `sizeRelativeTo` | **P** |
| 1a | Consigne : « hard = nécessité **ou mention nue** » | `parse/route.ts:214` (« Une mention nue sans marqueur … est hard par défaut ») | Une zone citée sans aucun mot fort devient dure | **P + L** |
| 1b | Consigne `communeSize` : « petite ville = {min:5000,max:25000} » | `parse/route.ts:104-107` | Des bornes que le lecteur n'a jamais dites deviennent une condition. La consigne dit aussi, ligne 302, « petite ville → eviter_grandes_villes » : deux lectures contradictoires du même mot | **P + L** |
| 1c | `nearPlace`, `excludePlace`, `sizeRelativeTo` | `parse/route.ts:92-130, 226-248` | Aucun champ de force : « près de Brest » est dur par nature | **L** |
| 2 | Dérivation d'ancre, après le LLM | `parse/route.ts:385-440` | « comme Brest » → `hc.communeSize = [pop/2,5 ; pop×2,5]` **et** `hc.excludePlace += Brest` | **M** |
| 3a | La Recherche devient le Projet | `OuVivreProjectSync.tsx:30-37` → `PATCH user_project_if_empty` | La sortie du parse de « Où vivre » (un filtre de recherche) est écrite telle quelle comme Projet durable | **M** (hors FUT-7, c'est FUT-8) |
| 3b | L'éditeur du projet | `ProjectSummaryCard.tsx:175-201` | Un texte modifié est reparsé, puis `parsed` est **remplacé en entier** | **P** |
| 4 | Persistance | `user-project.ts:59-92` | `coerceParsed` garde `hardConstraints` tel quel ; `schemaVersion: 1` ; **aucun champ de confirmation** | reprend P/M/L |
| 5 | Qu'est-ce qui est « déclaré » ? | `project-view.ts:137-155` (`declaredHardConstraintKeys`) | Présence de la famille ; `strength === "hard"` pour zones, montagne et relief seulement | **L** |
| 6 | Hydratation (partagée avec le comparateur) | `hard-constraints-hydrate.ts:88-158` | Mêmes règles de présence ; tout seuil est marqué `source: "user"` (commentaire l. 43-45 : « un seuil présent vient toujours du parse, donc du texte du lecteur »), **faux pour `communeSize`** (1b et 2) | **L** |
| 7 | Évaluation canonique | `hard-constraints.ts:334-980` | Aucune : elle mesure. Mais ses phrases affirment l'origine (« que vous avez posé(e)s comme limite / condition ») | écrit **U** sans l'être |
| 8 | Adaptateur dossier | `hard-constraint-rules.ts:84-119` | `incompatible` → `IncompatibilityFact`, `evidenceStrength: "established"`, `materialityTier: "decision_critical"`, **sans condition** | **M** |
| 9 | Validation | `materiality-rules.ts:960-965` (`assertFactValid`) | Vérifie seulement que la famille est « déclarée » (étape 5) | **M** |
| 10 | Registre des critères | `criteria-registry.ts:106-189` | `kind: "hard_constraint"` ; une issue `incompatible` place l'orientation en tête (`incompatible`) ; **couperet** : une contrainte dure non examinée interdit la couverture « élevée » | **M** |
| 11 | Assembleur | `decision-assembler.ts:86-93, 128, 168-174` | `conclusionState = established_incompatibility` ; section « Vos conditions non négociables » ; `hasAnyHardConstraint` → `no_hard_constraint_declared` | **M** |
| 12 | Plan de conclusion | `conclusion-plan.ts:758-775, 873-879, 1181-1199` | Libellé « Condition non respectée », titre « Une condition de votre projet n'est pas remplie à X : … » ; bloc « … reste à vérifier » ; « Aucune de vos conditions n'est contredite ici » | **M** |
| 13 | Écran | `ConclusionBlock.tsx:86, 150` ; `dossier-view.ts:28-57, 101` ; `minute-selection.ts:53-56` ; `comparaison-candidats.ts:133` | Rendu de « Condition(s) à vérifier » ; l'incompatibilité passe en tête de la minute ; le comparatif la range dans « contredit » | aval |

**Aucune étape ne contient un acte de confirmation.** Le lecteur ne voit même jamais la liste de ses
conditions avant le verdict : la carte « Votre projet » affiche la reformulation, pas les conditions
(`ProjectSummaryCard.tsx:291`), et aucun composant n'appelle `hardConstraintLabel`.

### Les quatre affirmations à vérifier

1. **« UserProject est en schemaVersion 1, sans notion de confirmation explicite. »** **Confirmé.**
   `user-project.ts:17-20` (type), `:84-86` (`stampUserProject`), `:88-92` (`normalizeUserProject`,
   qui force `schemaVersion: 1` en lecture). `ParsedProject` n'en porte pas non plus. La seule trace de
   la volonté du lecteur est son texte.
2. **« `declaredHardConstraintKeys()` déclare à partir de `active`, `strength === "hard"`, de la
   présence de valeurs… »** **Confirmé, avec une nuance.** `strength` ne compte que pour `zones`,
   `montagne` et `reliefProche` (`project-view.ts:143-146`) ; `active` que pour `nearSea` (`:147`).
   Pour les six autres familles, la **présence** suffit (`:141-151`).
   Écart supplémentaire : cette définition diverge du noyau. `communeSize: {min:null,max:null}` et
   `nearPlace` sans libellé sont « déclarés » ici, mais `not_declared` pour le noyau. Le registre les
   annonce alors comme « aucune règle ne sait l'examiner » (R7).
3. **« `HARD_CONSTRAINT_RULES` transforme une évaluation incompatible en `IncompatibilityFact`
   `decision_critical`. »** **Confirmé.** `hard-constraint-rules.ts:103-118`. Nuance :
   `evidenceStrength` vaut toujours `"established"`. La branche `"indicative"` est prévue dans le type
   et dans le tri de l'assembleur (`decision-assembler.ts:61`), mais aucune règle ne la produit.
4. **« `criteria-registry` fait passer l'orientation globale à `incompatible`. »** **Confirmé.**
   `criteria-registry.ts:176`. Nuance : le registre part de l'**issue de l'évaluation**
   (`assess`, `:111-113`), l'état de conclusion part du **fait émis**
   (`decision-assembler.ts:88`). Les deux convergent aujourd'hui, et toute porte de FUT-7 doit agir
   sur les deux, sinon ils divergeront.

**Réponse à la question posée : oui.** Une inférence du parseur, et même une dérivation déterministe
du code, devient « Condition non respectée » sans aucun acte séparé du lecteur. Reproduit ci-dessous.

---

## 3. Bugs et ambiguïtés reproduits

Script : annexe A. Il fait tourner la vraie chaîne `normalizeUserProject → hydrateHardConstraints →
runRules → assembleDossier`, sur `main`, sans rien modifier. **9/9 cas passent**, c'est-à-dire que le
comportement décrit est bien celui du code.

| # | Entrée | Ce que rend le dossier aujourd'hui | Diagnostic |
|---|---|---|---|
| R1 | « Je veux **impérativement** vivre en Bretagne » (`zones:[bretagne, hard]`), dossier à Nantes | **Condition non respectée** : « Cette commune est hors de la Bretagne, le périmètre que vous avez posé comme condition. » | Aucun acte de confirmation. Le projet porte `posture, intent, rawText, parsed, schemaVersion, updatedAt`, rien d'autre |
| R2 | « en Bretagne », **sans aucun mot fort** | **Même verdict** | La consigne rend une mention nue dure (1a) : impossible de distinguer R1 de R2 en aval |
| R3 | « une ville **comme** Brest » (dérivation 2), dossier **sur Brest** | **Condition non respectée** : « Cette commune fait partie de l'agglomération de Brest, que vous souhaitez quitter. » | Une exclusion inventée par le code, prêtée au lecteur, et qui contredit sa phrase. Il suffit que ce parse soit enregistré comme Projet (3a ou 3b) |
| R4 | « petite ville » (`communeSize` 5 000-25 000, convention de la consigne), agglomération de 26 000 hab. | **Condition non respectée** : « … au-dessus des 25 000 que vous avez posés comme limite. » | Le lecteur n'a jamais dit 25 000 |
| R5 | `proximite_mer` poids 3, commune à 240 km de la mer | **Arbitrage**, jamais incompatible | Déjà correct : un poids n'élimine jamais. Garde-fou à conserver |
| R6 | « il nous faut absolument la mer » (`nearSea.active`, sans distance) | Critère **non examiné** ; couverture « aucune » ; verdict « Lecture non disponible » | La condition la plus fortement dite n'est jamais évaluée, alors que la distance est connue (240 km) : aucune capacité intermédiaire n'existe entre « trancher » et « rien » |
| R7 | `communeSize: {min:null,max:null}` | Non examiné, raison `no_rule`, listé « reste à vérifier : la taille de la commune » | Divergence entre `project-view` et le noyau (§2, point 2) |
| R8 | Projet sans condition, un écart de poids 3 | Pas de phrase « Aucune de vos conditions… » | Déjà correct (`conclusion-plan.ts:877`), à préserver |
| R9 | `air_sain` poids 1, puis poids 2 | Poids 1 : **« aucune règle ne sait l'examiner »** (`no_rule`). Poids 2 : « non concluant ici » (`inconclusive`) | L'importance décide de la capacité affichée : `ruleAir` rend `not_applicable` sous le poids 2 (`materiality-rules.ts:713`), comme `rulePluies`, `ruleBruit`, `ruleIndustrie`, `ruleInondation` et les règles Autour |

### Ambiguïtés relevées sans reproduction dédiée

- **Le périmètre « Bretagne »** est la région administrative (`geo-zones.ts:89`, « la région
  Bretagne »). Pour quelqu'un qui pense à la Bretagne historique, Nantes est en Bretagne. Même un
  critère tranchable dépend de la lecture de son libellé.
- **Les façades et massifs** sont des listes de départements (`geo-zones.ts:151, 179`). Une commune de
  l'intérieur de la Gironde est « sur la façade atlantique » ; une commune des Landes au bord de l'eau
  n'est « près des Pyrénées » que si son département est dans la liste.
- **La distance à la mer** est celle du point de référence de la commune, même quand une adresse est
  connue (`toCommuneAttributes` lit `distance_cote_km` de l'index).
- **L'altitude** est celle du point de référence : une commune « de montagne » peut être à 540 m au
  chef-lieu et monter à 2 000 m.
- **`materialityTier` porte deux axes à la fois** : `decision_critical` = dureté ; `structuring` =
  poids 3 ; `secondary` = poids 2 ; poids 1 = silencieux.
- **Les contraintes dures n'ont pas de poids** : l'axe « importance » n'existe pas pour elles.
- **Le test de parité** (`src/lib/parity.test.ts:79-241`) pose en principe « incompatible au filtre ⇒
  incompatible au dossier ». FUT-7 doit le **reformuler** (l'évaluation reste la même, pas le
  verdict). Le supprimer serait une erreur.

---

## 4. Inventaire des critères que le Projet peut déclarer

Colonnes : clé ; forme dans `ParsedProject` ; règle(s) ; grain réellement utilisé ; issues possibles ;
données ; limites ; **capacité candidate** ; justification.

La question posée à chaque ligne : **la donnée et la règle sont-elles assez précises, et adaptées à
la formulation, pour dire oui ou non ?** Le fait que le code rende déjà un verdict ne compte pas.

### 4.1 Géographie et périmètre (aujourd'hui « contraintes dures »)

| Clé | Forme | Règle | Grain | Issues | Données | Limites | Capacité candidate | Justification |
|---|---|---|---|---|---|---|---|---|
| `departements` | `string[]` | `territoire.hard.departements` | commune (appartenance) ; identique à l'adresse | satisfait / incompatible / non examiné (département absent) | code INSEE | aucune | **trancher** | Appartenance administrative exacte ; une adresse est dans sa commune |
| `zones` : région | `{zone, strength}` jeton région | `territoire.hard.zones` | commune | idem | table jeton → départements | libellé : région administrative (cf. Bretagne) | **trancher** si le libellé nommé est la région administrative | Exact sur la définition affichée |
| `zones` : macro-zone (« le Sud », « le Sud-Ouest », « le Grand Ouest ») | idem | idem | commune | idem | liste de départements choisie par le produit | convention (`geo-zones.ts:34-79`) | **apprécier** | Le mot du lecteur est flou ; la frontière est la nôtre |
| `zones` : façade (atlantique, manche, méditerranée, côte basque) | idem | idem | commune | idem | départements côtiers | un département côtier n'est pas la côte | **apprécier** | « Sur la côte atlantique » ne se tranche pas par département |
| `zones` : massif (alpes, pyrénées…) | idem | idem | commune | idem | départements du massif | appartenance ≠ proximité | **apprécier** | Idem |
| `excludeZones` | `string[]` jetons | `territoire.hard.excludeZones` | commune | idem | idem | dépend du jeton (paris/idf quasi exacts, « le Nord » conventionnel) | **trancher** (région, Paris, IDF) / **apprécier** (macro-zone) | Même règle que `zones` |
| `montagne` | `{strength}` | `territoire.hard.montagne` | commune (point de référence) | satisfait / incompatible / non examiné | altitude de référence ≥ 600 m | seuil = convention produit ; altitude du chef-lieu | **apprécier** (à trancher par le produit, §12 Q3) | « Vivre à la montagne » n'a pas de seuil dit par le lecteur |
| `reliefProche` | `{strength}` | `territoire.hard.reliefProche` | commune + 35 km | idem | note de relief ≈ 1 250 m à portée | convention ; altitudes de référence, pas de sommets | **apprécier** | Idem, et plus indirect encore |
| `nearSea` avec `maxKm` | `{active, maxKm}` | `territoire.hard.nearSea` | point de référence de la commune (même avec adresse) | satisfait / incompatible / non examiné | distance à la côte (index) | le point de référence n'est pas toute la commune | **trancher** à l'adresse (à construire : la distance est aujourd'hui communale) ; **à décider** à la commune (§12 Q4) | Seuil dit par le lecteur, mesure absolue |
| `nearSea` sans `maxKm` | `{active:true}` | idem → `missing_parameter` | commune | non examiné (R6) | la distance existe | aucun seuil | **apprécier** (via la distance, comme `coast-rules`) | La distance éclaire sans conclure |
| `excludeSea` | `boolean` | `territoire.hard.excludeSea` | commune | idem | distance ≥ 15 km | seuil = convention | **apprécier** | « Pas le littoral » n'a pas de seuil dit |
| `nearPlace` + km | `{label, maxKm}` | `territoire.hard.nearPlace` | commune (point de réf.) ou adresse | idem | distance à vol d'oiseau | vol d'oiseau ; référence résolue ou non | **trancher** (adresse) ; **à décider** (commune, §12 Q4) | Seuil dit, mesure absolue |
| `nearPlace` + minutes + voiture/à pied | `{label, maxMinutes, mode}` | idem (estimation, puis isochrone) | idem | satisfait / incompatible / non examiné (frontière, panne) | routage IGN | temps estimé, sans trafic ; bande de tolérance 300 m | **trancher** hors de la bande | Déjà borné honnêtement par le noyau |
| `nearPlace` + minutes sans mode | idem, `mode:null` | → `missing_parameter` | s.o. | non examiné | s.o. | paramètre manquant | **ne pas mesurer** tant que le mode n'est pas dit | La formulation est incomplète |
| `nearPlace` + vélo | `mode:"bike"` | → `unsupported_metric` | s.o. | non examiné | l'API rend 400 | limite stable | **ne pas mesurer** | Limite du moteur |
| `nearPlace` sans chiffre (« près de Brest ») | `{label}` | → `missing_parameter` | s.o. | non examiné | la distance serait calculable | aucun seuil | **apprécier** (distance connue, aucune limite) | Comme `nearSea` sans km |
| `communeSize` chiffrée par le lecteur (« moins de 20 000 hab. ») | `{min,max}` | `territoire.hard.communeSize` | agglomération (UU) | idem | population d'UU | le lecteur dit peut-être « commune » quand le moteur lit l'agglomération | **trancher**, sous réserve de l'unité (§12 Q5) | Seuil dit |
| `communeSize` conventionnelle (« petite ville ») | idem, bornes de la consigne | idem | idem | idem | idem | bornes inventées (R4) | **apprécier** | Le seuil n'est pas du lecteur |
| `communeSize` dérivée d'une ancre | idem, bornes calculées | idem | idem | idem | idem | aucune demande du lecteur (R3) | **ce n'est pas un critère du Projet** | Doit disparaître du Projet (FUT-8) |
| `excludePlace` dit (« quitter Lyon ») | `{label}[]` | `territoire.hard.excludePlace` | agglomération | idem | UU de la ville | ville non résolue → non examiné | **trancher** | Appartenance exacte à l'UU, définition affichée |
| `excludePlace` dérivé d'une ancre | idem | idem | idem | idem | idem | R3 | **ce n'est pas un critère du Projet** | Sert seulement la recherche (« ne pas me proposer Brest ») |
| `sizeRelativeTo` | `{label, direction}` | `territoire.hard.sizeRelativeTo` | agglomération | idem | UU comparée | unité agglomération | **trancher** | Comparaison exacte, définition affichée |

### 4.2 Préférences pondérées

Constat structurant : **aucune préférence ne porte de seuil**. Le schéma (`Preference = {key, weight}`)
ne sait pas dire « un médecin à moins de 10 minutes ». Avec le modèle actuel, **aucune préférence ne
peut donc être tranchée** : elles vont d'« apprécier » à « ne pas mesurer ».

| Clé | Règle(s) | Grain | Issues | Données / fondement | Capacité | Justification |
|---|---|---|---|---|---|---|
| `faible_chaleur` | `ruleChaleur` (+ ambiante, compromis) | commune | satisfait / écart / incertain | DRIAS, seuil de signalement (`climate_threshold`) | **apprécier** | Climat communal projeté. « Ne pas avoir chaud chez moi » relève du logement |
| `douceur_climat` | mismatch/alignment | commune | écart / correspond / neutre | rang national (`relative_position`) | **apprécier** | Position relative |
| `ensoleillement_recherche` | idem | commune | idem | rang ERA5-Land | **apprécier** | Idem |
| `faible_secheresse` | aucune au dossier | s.o. | s.o. | exclu (mémoire « mismatch 27/28 ») | **ne pas mesurer** | Pas de règle |
| `faible_risque_feu` | `ruleFeu` | commune (+ couvert) | satisfait / écart / à contrôler / incertain | IFM projeté, aléa déclaré | **apprécier** | Indice et déclaration, pas un aléa à l'adresse |
| `faible_precip_extremes` | `rulePluies` | commune | satisfait / à contrôler | DRIAS | **apprécier** | |
| `proximite_mer` | `coast-rules` | commune (point de réf.) | écart / neutre / correspond | distance en km (`absolute_measure`) | **apprécier** | Mesure absolue, mais sans seuil du lecteur |
| `cadre_calme` | mismatch/alignment | commune | idem | rang de densité | **apprécier** | |
| `eviter_isolement`, `eviter_grandes_villes`, `prefere_grande_ville` | `agglomeration-rules` | agglomération | écart / correspond | catégorie de taille (`categorical_state`) | **apprécier** | Catégories = conventions |
| `viabilite_emploi` | mismatch | zone d'emploi | idem | rang | **apprécier** | |
| `air_sain` | `ruleAir` | commune (modélisé) | satisfait / à contrôler / incertain | seuils sanitaires officiels | **apprécier** | Concentrations modélisées, pas à l'adresse |
| `acces_soins` | mismatch (APL) + `autour-rules` (adresse) | commune ; adresse | écart / à contrôler | APL ; distance au médecin | **apprécier** | « Trouver un médecin » ne se mesure pas (cas cité par la spec) |
| `acces_services` | mismatch | commune | idem | centralité ANCT | **apprécier** | |
| `faible_pression_agricole` | aucune | s.o. | s.o. | décision documentée (`sante-facts.ts`) | **ne pas mesurer** | |
| `nature` | mismatch/alignment | 15 km | idem | rang OSO | **apprécier** | |
| `acces_ecoles`, `acces_culture` | mismatch | bassin 5-25 km | idem | rang BPE (accès) | **apprécier** ; la **qualité** : **ne pas mesurer** (`horsMesure`) | |
| `faible_risque_inondation` | `ruleInondation` | commune | satisfait / à contrôler / incertain | score d'exposition + CatNat | **apprécier** | Historique communal, pas l'aléa à l'adresse |
| `faible_dependance_auto` | mismatch + `secteur-rules` (IRIS) | commune ; secteur | idem | MOBPRO ; équipement IRIS | **apprécier** | |
| `acces_transports` | mismatch + `autour-rules` (gare) | commune ; adresse | idem | rang ; distance à la gare | **apprécier** | Sans seuil dit, aucune limite à trancher |
| `mobilite_quotidienne`, `vie_etudiante` | `absence-rules` + mismatch | commune/UU | écart / correspond | absence nommée, rang | **apprécier** | |
| `vie_locale`, `croissance_demographique` | mismatch | commune | idem | rang | **apprécier** | |
| `calme_sonore` | `ruleBruit` | commune ; refuse de conclure à l'adresse | satisfait / à contrôler / incertain | infrastructures bruyantes | **apprécier** | « Un logement calme » ne se tranche pas par un indicateur communal |
| `faible_exposition_industrielle` | `ruleIndustrie` | commune | idem | ICPE actives | **apprécier** | Présence administrative, pas une exposition |

### 4.3 Ce que le Projet ne peut pas exprimer comme critère

- `horsMesure` (qualité des écoles, vitalité culturelle, attachement affectif) : **ne pas mesurer**,
  déjà affiché honnêtement.
- `communeAncre`, `emploiHorsSujet`, `heritageIntent`, `suppressNarrativeKeys` : ce sont des
  paramètres, pas des critères. Aucun ne peut devenir une condition.
- **Logement et adresse** (DPE, jardin, étage, bruit du logement) : aucun champ dans `ParsedProject`.
  Ces demandes restent dans `rawText`. Si le lecteur veut en faire une condition, la capacité sera
  **ne pas mesurer** tant que le Projet ne les représente pas. Hors périmètre de FUT-7.

---

## 5. Le registre de capacité proposé

### 5.1 Ce dont la capacité dépend (vérifié)

| Facteur | Dépend ? | Preuve |
|---|---|---|
| **La clé** | oui | `departements` ≠ `montagne` |
| **La formulation / les paramètres** | **oui, souvent décisif** | `nearPlace` : km → trancher ; minutes sans mode → ne pas mesurer ; vélo → ne pas mesurer ; sans chiffre → apprécier. `zones` : région → trancher, façade → apprécier. `communeSize` : chiffrée → trancher, conventionnelle → apprécier |
| **Le grain évalué** | oui, pour les distances | Une distance depuis le point de référence d'une commune n'est pas celle d'une adresse (§12 Q4) |
| **La présence d'une adresse** | seulement à travers le grain | Une adresse change le grain, rien d'autre |
| **Projet ou Recherche** | **non** | La capacité décrit ce que futur•e sait mesurer, dans les deux contextes. Seule la **conséquence** diffère : la Recherche peut filtrer sur une appréciation, le Projet ne peut pas en tirer un verdict |
| **La donnée de ce lieu** | **non** | Une donnée qui manque ici est une **issue locale** (`unexamined` / `inconclusive`, déjà modélisée), pas une capacité. La mélanger ferait dire « futur•e ne sait pas » là où il faut dire « la donnée manque ici » |

### 5.2 Le plus petit modèle honnête

La capacité est une **fonction pure et fixe**, sans donnée de lieu. Ce n'est ni une donnée
utilisateur ni une valeur persistée :

```ts
type Capability = "trancher" | "apprecier" | "ne_pas_mesurer";
type EvaluationGrain = "commune" | "adresse";

// Pourquoi : une raison fermée, qui sert aux tests et à la phrase affichée.
type CapabilityReason =
  | "perimetre_administratif"   // département, région, agglomération nommée
  | "seuil_du_lecteur"          // km, minutes + mode, habitants, dits par le lecteur
  | "convention_produit"        // « la montagne », « la façade atlantique », « petite ville »
  | "sans_seuil"                // « près de Brest », « il nous faut la mer »
  | "parametre_manquant"        // minutes sans mode
  | "metrique_non_supportee"    // vélo, transports en commun
  | "position_relative"         // rang, catégorie, indicateur communal
  | "aucune_regle";             // faible_pression_agricole, horsMesure

type CapabilityAssessment = { capability: Capability; reason: CapabilityReason };

// Le critère TEL QU'IL EST DÉCLARÉ (clé + valeur), pas seulement sa clé.
function criterionCapability(criterion: DeclaredCriterion, grain: EvaluationGrain): CapabilityAssessment;
```

**Pourquoi pas `Record<CriterionKey, Capability>`** : la moitié des contraintes géographiques changent
de capacité selon leurs paramètres (§4.1). Une table par clé forcerait à choisir la capacité la plus
haute (erreur inverse) ou la plus basse (plus aucun verdict possible).

**Pourquoi pas plus** : la plupart des entrées restent constantes. Concrètement, c'est une table par
clé, dont quatre entrées sont des petites fonctions (`zones`/`excludeZones` selon le type de jeton,
`nearPlace`, `nearSea`, `communeSize`). Les préférences valent toutes « apprécier », sauf deux qui
valent « ne pas mesurer » (§4.2).

**Un invariant à tester** : `criterionCapability` ne lit jamais `ModuleFacts`. Sinon, elle mélangerait
capacité et issue locale.

### 5.3 Comment elle s'articule avec `no_rule` et `inconclusive`

Quatre situations, que le code confond partiellement aujourd'hui :

| Situation | Aujourd'hui | Avec FUT-7 |
|---|---|---|
| futur•e **ne sait pas** mesurer ce critère | `unexaminedReason: "no_rule"`, **mais aussi** quand le poids est 1 (R9) | capacité `ne_pas_mesurer`. `no_rule` ne se déduit plus d'un `not_applicable` de poids |
| futur•e sait le mesurer, la donnée **manque ici** | `inconclusive` | inchangé : issue locale, quelle que soit la capacité |
| futur•e sait l'**apprécier**, sans le trancher | n'existe pas ; ou bien tranché à tort (R4), ou bien jamais examiné (R6) | capacité `apprecier` + issue (favorable, défavorable, neutre) |
| futur•e sait le **trancher** et obtient une réponse | `satisfied` / `incompatible` | capacité `trancher` + issue |

`no_rule` et `inconclusive` restent : ils décrivent l'issue sur ce lieu. La capacité s'ajoute
à côté et ne remplace rien. Correction nécessaire au passage : une règle qui se tait **à cause du
poids** doit rendre une issue qui ne se confond pas avec « aucune règle » (§12 Q7).

---

## 6. Où stocker la confirmation : trois options

Contrainte commune : **legacy, champ absent ou `undefined` = non confirmé. Jamais l'inverse.**

### Option A : le drapeau sur le critère, dans `parsed`

```ts
zones: [{ zone: "bretagne", strength: "hard", nonNegotiable: { confirmed: true, at: "…" } }]
preferences: [{ key: "acces_soins", weight: 3, nonNegotiable: { confirmed: true, at: "…" } }]
```

- **Legacy** : compatible (champ absent = non confirmé).
- **FUT-8** : le parseur doit **ne jamais** émettre ce champ. Il faudrait l'exclure du schéma de
  l'outil et le filtrer à l'entrée. L'objet produit par le LLM contiendrait alors aussi l'acte du
  lecteur.
- **Double vérité** : **risque élevé.** `parsed` est **remplacé en entier** à chaque reparse
  (`ProjectSummaryCard.tsx:192-201`). La confirmation disparaît en silence quand le lecteur corrige une
  virgule. À l'inverse, un parse qui recopierait le drapeau le ferait survivre à un changement de sens.
- **Lecture moteur** : la plus simple (le drapeau est là où on lit le critère).
- **Historique** : aucun (écrasé au reparse).
- **Migration** : aucune.
- **Champ absent** : non confirmé.

### Option B : une collection séparée au niveau du Projet

```ts
type UserProject = {
  …, parsed: ParsedProject | null,
  conditions?: ConditionConfirmation[];
};
type ConditionConfirmation = {
  criterion: { kind: "hard"; key: HardConstraintKey } | { kind: "preference"; key: PreferenceKey };
  confirmedAt: string;            // estampille serveur
  source: "user";                 // la seule valeur admise
};
```

- **Legacy** : compatible (collection absente = aucune condition).
- **FUT-8** : contrat clair. Le parseur n'y touche jamais, et un geste explicite l'écrit.
- **Double vérité** : **moyenne.** La confirmation vise une **clé**, pas une **valeur**. « Bretagne »
  confirmée, puis le texte corrigé en « Normandie » : la clé `zones` reste confirmée, et la Normandie
  devient éliminatoire sans que personne ne l'ait confirmée.
- **Lecture moteur** : un `find` de plus, simple.
- **Historique** : possible (`confirmedAt`, retrait par suppression).
- **Migration** : aucune donnée à migrer. `schemaVersion` passe à 2 pour dire que le champ existe.
- **Champ absent** : non confirmé.

### Option C : B, épinglée à l'empreinte de la valeur confirmée

B, plus une empreinte de **ce qui a été confirmé** : la valeur décisionnelle du critère au moment du
geste.

```ts
type ConditionConfirmation = {
  criterion: CriterionRef;        // clé (+ instance si la famille en porte plusieurs)
  fingerprint: string;            // empreinte de la valeur décisionnelle confirmée
  confirmedAt: string;
  source: "user";
};
```

Une confirmation **ne vaut que si son empreinte égale l'empreinte actuelle du critère.** Sinon, elle
est **périmée** : lue comme « non confirmée », et gardée pour proposer « Vous aviez fait de la
Bretagne une condition ; est-ce aussi le cas de la Normandie ? ».

L'empreinte **existe déjà** : `valeurDecisionnelle` dans `projet-materiel.ts:124-152` calcule, par
famille, exactement ce que le moteur lit (ancres dures seules, seuil appliqué, libellé du lieu).
C'est la même définition que la signature qui périme les dossiers vendus. Elle serait réutilisée,
sans nouvelle règle.

- **Legacy** : compatible.
- **FUT-8** : contrat le plus précis : « écrire une confirmation = écrire la clé et l'empreinte
  courante ».
- **Double vérité** : **faible.** La valeur confirmée ne peut pas changer sans que la confirmation
  cesse de valoir. Et la confirmation ne vit jamais dans l'objet écrit par le LLM.
- **Lecture moteur** : `isConfirmed(project, criterion)` compare deux empreintes. Une seule fonction,
  pure, testée une fois.
- **Historique** : oui, y compris les confirmations périmées.
- **Migration** : aucune. `schemaVersion: 2` pour la présence du champ.
- **Champ absent / illisible / empreinte différente** : non confirmé, dans les trois cas.

Pour les préférences, l'empreinte est la clé seule. Le poids n'est pas la condition : passer de 3 à 2
n'annule pas « je n'envisage pas ce lieu sans médecin ». C'est un choix à valider (§12 Q2).

---

## 7. Recommandation

**Option C.** Trois raisons, par ordre de poids :

1. **C'est la seule qui rend impossible la situation que FUT-7 doit empêcher.** Un reparse, qu'il
   vienne de l'éditeur, de « Où vivre » ou de FUT-8, ne peut ni créer ni transporter une confirmation :
   elle vit hors de `parsed` et ne vaut que pour la valeur exacte que le lecteur a vue.
2. **Elle ne crée pas de troisième vérité.** Le critère reste dans `parsed` (ce que le lecteur a dit,
   lu par le parseur). La confirmation vit dans `conditions` (ce que le lecteur a fait). La capacité est
   calculée par le code (ce que futur•e sait faire). Chacune a un seul écrivain.
3. **Elle réutilise une définition existante** (`valeurDecisionnelle`), celle qui décide déjà si un
   dossier vendu est périmé. La confirmation et la péremption ne peuvent donc pas diverger.

**Ce que devient `strength: "hard"`** : il garde **un seul sens**, celui de la Recherche : « cette
ancre filtre ». Il cesse de dire quoi que ce soit au dossier sur le caractère éliminatoire. Le dossier
lit « critère déclaré » (présent dans `parsed`) et « condition » (confirmée dans `conditions`).

**Où poser la porte** : dans l'**adaptateur dossier**, jamais dans le noyau ni dans l'hydratation.

- `hard-constraints.ts` et `hard-constraints-hydrate.ts` : **inchangés.** Ils mesurent, et le
  comparateur en dépend.
- `hard-constraint-rules.ts` : l'issue canonique `incompatible` ne devient un `IncompatibilityFact` que
  si `isConfirmed ∧ capability === "trancher"`. Sinon, elle devient un **écart au projet** (§8).
- `assertFactValid` : un `IncompatibilityFact` sans confirmation valide et sans capacité « trancher »
  **lève une erreur**. C'est l'invariant de FUT-7, dans le type et à l'exécution, comme le reste du
  moteur.

**Pas de branche d'implémentation tant que les décisions du §12 ne sont pas prises.**

---

## 8. Table de vérité cible

Légende des colonnes : **Fait** = rôle du `DecisionFact` ; **Tier** = `materialityTier` ; **Registre**
= `CriterionOutcome` ; **Orientation** = effet sur `orientation` ; **Section** = section du dossier ;
**s.o.** = sans objet (aussi dans les tableaux du §4).

| Confirmé | Capacité | Évaluation | Fait | Tier | Registre | Orientation | Section | Texte lecteur | Conclusion |
|---|---|---|---|---|---|---|---|---|---|
| non | trancher | incompatible | `mismatch` (écart au projet) | selon l'importance (§12 Q1) | `mismatch` | `arbitration` | « Ce qui correspond moins bien » | « Nantes répond moins bien à une de vos priorités : la Bretagne. » + le constat mesuré, **sans** « que vous avez posé comme condition » | **jamais** « Condition non respectée » |
| **oui** | **trancher** | **incompatible** | `incompatibility`, `established` | `decision_critical` | `incompatible` | `incompatible` | « Vos conditions non négociables » | « Condition non respectée » + constat | héros bloquant (inchangé) |
| oui | trancher | satisfait | aucun (silencieux) ; carte « Condition remplie » à décider (§12 Q6) | s.o. | `favorable` | compte favorable | aucune, ou section des conditions (Q6) | « Condition remplie : la Bretagne. » si Q6 = oui | peut dire « vos conditions sont remplies » |
| oui | trancher | non examiné ici (donnée, frontière, panne) | aucun | s.o. | `indeterminate`, `inconclusive` | inchangé | bloc « Condition à vérifier » | « La Bretagne reste à vérifier à ce niveau de détail. » (existant) | **couperet** : couverture jamais « élevée » |
| oui | apprécier | signal défavorable | **condition à confirmer** (§8.1) | `decision_critical` | `to_confirm` (nouveau) | `condition_to_confirm` (nouveau, juste après `incompatible`) | « Vos conditions non négociables », étiquette « À confirmer » | « Point non négociable à confirmer : l'accès aux soins. Les données sont défavorables à l'échelle de la commune… » + geste de vérification | héros dédié, **jamais éliminatoire** |
| oui | apprécier | signal favorable ou neutre | condition à confirmer | `structuring` | `to_confirm` | `condition_to_confirm` | idem | « Point non négociable à confirmer : … Les données sont favorables, mais rien ne permet d'établir… » (exemple de la spec) | idem, ton neutre |
| oui | apprécier | inconclusif (donnée absente ici) | aucun | s.o. | `indeterminate`, `inconclusive` | inchangé | bloc « Condition à vérifier » | « … reste à vérifier : la donnée manque ici. » | couperet |
| oui | ne pas mesurer | s.o. | aucun | s.o. | `indeterminate`, capacité `ne_pas_mesurer` | inchangé | bloc « Condition à vérifier » (formulation distincte) | « futur•e ne sait pas encore évaluer : … » (la spec : « dit comme tel ») | couperet |
| non | apprécier | défavorable | `mismatch` (existant) | poids 3 → `structuring`, 2 → `secondary`, 1 → silencieux | `mismatch` | `arbitration` si matériel | « Ce qui correspond moins bien » | inchangé | inchangé |
| non | ne pas mesurer | s.o. | aucun | s.o. | `indeterminate`, `no_rule` | inchangé | bloc « priorités non couvertes » | inchangé | inchangé |

### 8.1 Représenter « confirmé mais seulement apprécié »

Ce cas ne doit **ni éliminer ni se noyer**. Le modèle actuel n'offre pas la bonne case :

- `incompatible` éliminerait (erreur inverse).
- `verification` avec `decision_critical` passerait en `major_reserves`, au milieu des constats
  « à contrôler » que le lecteur n'a pas demandés.
- `mismatch` le rangerait parmi les priorités « moins bien servies », au même rang qu'un poids 2.

Proposition minimale : **un rôle `condition_check`**, distinct, qui porte le signal (favorable,
défavorable, neutre), sa preuve et **une action obligatoire** (comment le lecteur confirme lui-même).
Il s'ajoute à une **orientation `condition_to_confirm`**, classée juste après `incompatible`. Une
condition à confirmer pèse plus qu'un arbitrage ordinaire, et moins qu'un blocage établi.

Alternative plus légère, à comparer : réutiliser `VerificationFact` avec un marqueur
`condition: true`, et une orientation dédiée. Moins de types, mais un « à contrôler » demandé et un
« à contrôler » non demandé partageraient le même rôle, la même confusion que FUT-7 veut défaire. Je
recommande le rôle distinct (§12 Q8).

### 8.2 Ce qu'un critère non confirmé devient

Aujourd'hui, un critère géographique **ne peut pas** devenir un écart : `MismatchFact.projectKey` est
une `PreferenceKey`, et `assertFactValid` exige une préférence déclarée (`materiality-rules.ts:1043`).
Il faut donc :

- élargir la clé de `MismatchFact` à une `CriterionKey = PreferenceKey | HardConstraintKey` ;
- ajouter un fondement qui dise ce qu'on a mesuré : `declared_perimeter` (appartenance administrative)
  à côté d'`absolute_measure`, qui porte déjà les km ;
- donner une **importance** au critère géographique, qui n'en a pas (§12 Q1).

Sans ces trois points, un critère non confirmé retomberait dans le silence. Ce serait l'échec inverse :
le lecteur qui voulait la Bretagne ne saurait plus que Nantes n'y est pas.

### 8.3 Effets sur la conclusion globale

| Élément | Aujourd'hui | Avec FUT-7 |
|---|---|---|
| `coverage` | ratio examinés / déclarés, couperet sur toute contrainte dure non examinée | ratio inchangé ; le **couperet ne porte plus que sur les conditions confirmées** non examinées ou non mesurables. Un critère non confirmé compte comme une préférence |
| `orientation` | `incompatible` > `indeterminate` > `arbitration` > `major_reserves` > `minor_reserves` > `favorable` > `neutral` | `incompatible` (confirmé ∧ trancher) > **`condition_to_confirm`** > `indeterminate` > `arbitration` > … inchangé |
| `incompatible` | dès qu'une famille présente est violée | seulement confirmé ∧ trancher ∧ incompatible |
| `arbitration` | mismatchs matériels | + les critères non confirmés violés (§8.2) |
| `major_reserves` | réserve de tier ≠ secondaire | inchangé ; les conditions à confirmer n'y entrent **pas** (orientation propre) |
| `uncoveredConstraints` | contraintes dures non examinées, raison confondue | devient **les conditions confirmées** non examinées **ou** non mesurables, avec la raison (capacité ou donnée) ; les critères non confirmés non examinés passent dans `uncoveredPreferences` / `inconclusivePreferences` |
| `hasAnyHardConstraint` | toute famille présente | remplacé par `hasAnyConfirmedCondition` ; c'est lui qui gouverne `no_hard_constraint_declared` |
| couperet de couverture élevée | toute contrainte dure non examinée | toute **condition confirmée** non examinée ou `ne_pas_mesurer` |
| blocs du `conclusion-plan` | `verdict`, `unexamined_hard_constraints`, `compositions_found`, `uncovered_priorities` | `verdict` (+ branche `condition_to_confirm`) ; `unexamined_hard_constraints` ne liste que des conditions confirmées ; libellé distinct pour `ne_pas_mesurer` |
| « Aucune de vos conditions n'est contredite ici » | si l'état n'est pas `no_hard_constraint_declared` | seulement si au moins **une condition confirmée** existe (cas 10) |

---

## 9. Impacts fichier par fichier

**Ne changent pas** (garantie de la Recherche) : `hard-constraints.ts` (sauf les phrases, voir plus
bas), `hard-constraints-hydrate.ts`, `hard-constraints-filter.ts`, `hard-constraints-external.ts`,
`comparateur-vie.ts` (`matchProjects`), `OuVivreClient.tsx`, `api/comparateur-vie/*`.

| Fichier | Changement FUT-7 | Test(s) touché(s) |
|---|---|---|
| `src/lib/user-project.ts` | `conditions?: ConditionConfirmation[]` ; `normalizeUserProject` le lit en tolérant (illisible → `[]`) ; `schemaVersion: 2`. **Aucune écriture** dans FUT-7 (FUT-8 fournit le geste) | `user-project.test.ts` |
| `src/lib/decision/capability.ts` (nouveau) | `criterionCapability(criterion, grain)`, table §4 | nouveau |
| `src/lib/decision/conditions.ts` (nouveau) | `isConfirmed(project, criterion)` par empreinte ; `hasAnyConfirmedCondition` | nouveau |
| `src/lib/decision/projet-materiel.ts` | exporter `valeurDecisionnelle` (empreinte) ; faire entrer les confirmations **valides** dans la signature décisionnelle (confirmer périme le dossier, comme un changement de critère) | `projet-materiel.test.ts` (14 occurrences) |
| `src/lib/decision/project-view.ts` | aligner `declaredHardConstraintKeys` sur le noyau (R7) ; `hasAnyHardConstraint` → `hasAnyConfirmedCondition` pour la conclusion | `project-view.test.ts` |
| `src/lib/decision/hard-constraint-rules.ts` | la porte : `incompatible` → incompatibilité si confirmé ∧ trancher ; sinon écart (§8.2) ; `satisfied` et `unexamined` inchangés | `hard-constraint-rules.test.ts` (18) |
| `src/lib/decision/decision-fact.ts` | `MismatchFact.projectKey: CriterionKey` ; fondement `declared_perimeter` ; rôle `condition_check` (si Q8) | typecheck |
| `src/lib/decision/materiality-rules.ts` | `assertFactValid` : incompatibilité ⇒ confirmé ∧ trancher ; écart sur critère géographique ⇒ critère déclaré ; règles de poids : issue distincte de `not_applicable` sous le poids 2 (R9) | `materiality-rules.test.ts` (41) |
| `src/lib/decision/criteria-registry.ts` | `capability` et `confirmed` sur chaque ligne du registre ; issue `to_confirm` ; orientation `condition_to_confirm` ; couperet sur les conditions confirmées ; `uncoveredConstraints` → conditions | `criteria-registry.test.ts` |
| `src/lib/decision/decision-assembler.ts` | `conclusionState` via `hasAnyConfirmedCondition` ; section « Vos conditions non négociables » = incompatibilités + conditions à confirmer | `decision-assembler.test.ts` (27) |
| `src/lib/decision/conclusion-plan.ts` | branche de verdict `condition_to_confirm` ; libellés `ne_pas_mesurer` ; « Aucune de vos conditions » gardé par les conditions confirmées | `conclusion-plan.test.ts` (52) |
| `src/lib/decision/conclusion-prompt.ts` / `conclusion-validate.ts` | nouveau registre, phrases obligatoires | `conclusion-validate.test.ts` |
| `src/lib/decision/minute-selection.ts`, `dossier-view.ts`, `comparaison-candidats.ts` | rang de `condition_check` ; masquage du doublon héros/section ; « contredit » n'inclut `incompatible` que confirmé | tests respectifs |
| `src/lib/hard-constraints.ts` | **phrases seulement** : « que vous avez posé(e)s comme limite / condition » n'est vrai que confirmé. Le noyau ne connaît pas la confirmation : la formule passe dans l'adaptateur, le noyau garde le constat mesuré | `hard-constraints.test.ts` (61, dont une partie sur les phrases) |
| `src/lib/parity.test.ts` | reformuler : l'**évaluation** est identique dans les deux chaînes ; le **verdict** dossier dépend en plus de la confirmation | 12 |
| `src/components/report/ConclusionBlock.tsx`, `DecisionFactRenderParts.tsx` | rendu du rôle `condition_check` et de l'étiquette « À confirmer » | revue visuelle |
| `decision-artifact.ts` | `ENGINE_VERSION` `engine-1` → `engine-2` : les dossiers figés gardent leur verdict et savent sous quel moteur ils ont été produits | `decision-artifact.test.ts` |

**Hors FUT-7** (confirmés dans le code, laissés à FUT-8) : la consigne du parseur (1a, 1b), la
dérivation d'ancre qui écrit `excludePlace`/`communeSize` (2), `OuVivreProjectSync` (3a), l'éditeur
(3b), le geste de confirmation lui-même, la migration.

---

## 10. Interaction avec FUT-8

**Après FUT-7, FUT-8 devra produire / migrer exactement ces champs :**

1. **`UserProject.conditions[]`**, et **seulement** par un geste explicite du lecteur :
   `{ criterion, fingerprint, confirmedAt, source: "user" }`, où `fingerprint` est calculée par la
   fonction de FUT-7 sur la valeur **affichée au moment du geste**. FUT-8 ne calcule aucune empreinte
   lui-même.
2. **Aucune écriture de `conditions` par le parseur**, ni par « Où vivre », ni par l'amorçage
   `user_project_if_empty`. Le test de contrat : la sortie brute de `/parse` ne contient jamais
   `conditions`, et `normalizeUserProjectInput` rejette un `conditions` venu du client hors de la route
   dédiée.
3. **Les mots forts deviennent une suggestion**, dans `parsed` et jamais dans `conditions`. Proposition
   de forme : `parsed.forceMarkers?: { criterion: CriterionRef; phrase: string }[]`, la citation exacte
   (« impérativement »), qui ne sert qu'à **proposer** la confirmation. FUT-7 ne lit pas ce champ.
4. **Les projets existants** : **aucune confirmation n'est créée.** La règle « absent = non confirmé »
   de FUT-7 rétrograde d'office toutes les anciennes contraintes, sans réécrire une ligne. C'est
   l'option A de la spec du 25/09, obtenue sans migration de données.
5. **Les critères dérivés d'une ancre** (`excludePlace` de l'ancre, `communeSize` de l'ancre) : FUT-8
   doit cesser de les écrire dans le **Projet** (ils restent des filtres de la Recherche), et nettoyer
   ceux déjà écrits. Tant que ce n'est pas fait, FUT-7 les rend inoffensifs (jamais éliminatoires),
   mais ils restent **affichés comme écarts** (R3 deviendrait « Brest répond moins bien à une de vos
   priorités : quitter Brest »). **C'est le cas le plus urgent de FUT-8.**
6. **`schemaVersion: 2`** écrite par FUT-7 en lecture ; FUT-8 s'appuie dessus pour savoir qu'un projet
   a été vu par le nouveau modèle.
7. **L'importance des critères géographiques** (§12 Q1) : si la décision est « un poids », FUT-8 le
   fait produire par le parseur et le migre.

Ce que FUT-8 **n'a pas à faire** : décider des capacités (FUT-7), changer le noyau, toucher au
verdict.

---

## 11. Plan de tests

Chaque test vérifie **ce que dit la carte**, et pas seulement **qu'elle apparaît** (règle d'AGENTS.md
du 25/07). Les dix cas demandés, puis ceux que le code réel impose.

| # | Scénario | Assertions |
|---|---|---|
| T1 | « impérativement en Bretagne » parsé fort, **jamais confirmé**, dossier à Nantes | orientation ≠ `incompatible` ; aucun `IncompatibilityFact` ; libellé ≠ « Condition non respectée » ; un écart nommé « la Bretagne » **existe** dans « Ce qui correspond moins bien » ; le texte ne contient pas « posé comme condition » |
| T2 | Même critère **confirmé** (empreinte valide), dossier à Nantes | « Condition non respectée » ; constat « hors de la Bretagne » ; section conditions |
| T3 | Condition confirmée **appréciée** (`acces_soins`), signal défavorable, puis favorable | orientation `condition_to_confirm` ; jamais `incompatible` ; carte « À confirmer » en tête, action présente ; le texte favorable ne dit jamais « respectée » |
| T4 | Condition confirmée **non mesurable** (`faible_pression_agricole`) | aucun fait ; bloc « Condition à vérifier » avec la formulation « futur•e ne sait pas encore évaluer » ; couverture jamais « élevée » |
| T5 | Poids 3 défavorable, non confirmé (R5) | `mismatch`, `arbitration`, jamais `incompatible` (garde-fou existant) |
| T6 | Projet **legacy** avec anciennes `hardConstraints`, sans `conditions` | aucun verdict éliminatoire sur aucune des 11 familles ; `schemaVersion` lu = 2 ; aucune écriture |
| T7 | `conditions` absent, `null`, non-tableau, entrée malformée, `source ≠ "user"` | toutes → non confirmé |
| T8 | Condition **confirmée et tranchable**, donnée manquante ici (département absent) | `inconclusive` ; bloc « Condition à vérifier » ; couperet ; pas d'incompatibilité |
| T9 | **Recherche** avec filtre strict (`zones` hard) | `evaluateHardFilter` inchangé : même `eligible` / `complete` qu'avant FUT-7 sur une table de communes ; `matchProjects` n'importe ni `conditions` ni la capacité |
| T10 | Projet **sans condition confirmée**, avec écarts | aucune phrase « Aucune de vos conditions… » ; état `no_hard_constraint_declared` |
| T11 | **Empreinte périmée** : « Bretagne » confirmée, texte changé en « Normandie » | non confirmé ; aucun verdict éliminatoire ; la confirmation reste stockée |
| T12 | **Ancre** « comme Brest », dossier sur Brest (R3) | jamais « Condition non respectée » |
| T13 | **Convention** : `communeSize` 5 000-25 000 **confirmée**, capacité `apprecier` (R4) | jamais « Condition non respectée » ; « à confirmer » |
| T14 | `nearSea` confirmée **sans km** (R6) | capacité `apprecier` ; la distance mesurée est dite ; jamais tranché |
| T15 | Poids 1 d'une préférence mesurable (R9) | l'issue ne se déclare pas `no_rule` |
| T16 | **Invariant de validation** | `assertFactValid` lève sur une incompatibilité non confirmée ou non tranchable |
| T17 | **Capacité pure** | `criterionCapability` ne reçoit jamais de `ModuleFacts` (signature) ; table exhaustive par clé (le typecheck échoue si une clé manque) |
| T18 | **Signature décisionnelle** | confirmer ou retirer une condition change la signature ; une confirmation périmée ne la change pas |
| T19 | **Parité reformulée** | pour les 11 familles, l'évaluation canonique est identique au filtre et au dossier ; seul le rôle du fait dépend de la confirmation |
| T20 | **Grain** | `nearPlace` km à l'adresse : `trancher` ; au point de référence : selon la décision Q4 |

---

## 12. Décisions à prendre (Quentin / ChatGPT) avant l'implémentation

Chacune avec ce que je propose et ce qu'elle change. Aucune n'est tranchée en silence dans ce
document.

**Q1. Quelle importance pour un critère géographique non confirmé ?** Il n'a pas de poids aujourd'hui.
Options : (a) poids implicite 3 (`structuring`, carte visible, arbitrage) ; (b) poids implicite 2
(`secondary`, carte visible, arbitrage seulement à deux) ; (c) un vrai poids, produit par FUT-8.
*Proposition* : (a) pour FUT-7, puisque le lecteur l'a nommé en premier dans la plupart des projets ;
(c) ensuite. Conséquence de (a) : les dossiers qui disaient « Condition non respectée » diront
« Arbitrage » avec l'écart en tête.

**Q2. L'empreinte d'une condition sur une préférence inclut-elle le poids ?** *Proposition* : non.
Changer l'importance ne retire pas « sans compromis ».

**Q3. Les conventions du produit peuvent-elles trancher ?** « À la montagne » (600 m), « pas le
littoral » (15 km), façades, massifs, macro-zones. *Proposition* : non, capacité `apprecier`. Elles
restent des filtres de Recherche. Conséquence : « Je veux absolument vivre à la montagne », confirmé,
donnera « à confirmer » et plus jamais « non respectée ». L'alternative : les laisser trancher en
affichant la convention dans le verdict.

**Q4. Une distance au point de référence d'une commune tranche-t-elle ?** « À moins de 30 km de
Brest », une commune dont le centre est à 32 km, mais dont une partie est à 25 km. C'est un **seuil à
discuter avant d'être codé**. Options : (a) oui, comme aujourd'hui, avec le grain dit ; (b) seulement
au-delà d'une marge égale au rayon de la commune, sinon `apprecier` ; (c) jamais au grain commune,
seulement à l'adresse. *Proposition* : (b). La marge demande un chiffre, à présenter avec des
exemples réels avant tout code.

**Q5. `communeSize` chiffrée : agglomération ou commune ?** « Une commune de moins de 20 000
habitants » est lue sur l'agglomération (doctrine du chantier C). Tranche-t-on quand l'unité dite
et l'unité lue diffèrent ? *Proposition* : trancher seulement si l'unité est non ambiguë ; sinon
`apprecier`.

**Q6. Une condition remplie se montre-t-elle ?** Aujourd'hui, `satisfied` est silencieux. La spec
écrit « Condition remplie ». *Proposition* : oui, une ligne sobre dans la section des conditions,
parce qu'une condition confirmée est ce que le lecteur regarde en premier.

**Q7. Le poids 1 et la capacité (R9).** Faut-il une issue distincte de `not_applicable`
(« examinable, non signalé à ce poids ») ? *Proposition* : oui, dans FUT-7, parce que c'est le
même défaut (importance confondue avec capacité). Le périmètre grandit d'environ six règles.

**Q8. Rôle `condition_check` distinct, ou `VerificationFact` marqué ?** *Proposition* : rôle distinct
(§8.1).

**Q9. Les critères dérivés d'une ancre déjà enregistrés (R3)** : les rendre inoffensifs dans FUT-7
(ils deviennent des écarts), ou les ignorer dès FUT-7 quand ils sont reconnaissables ? Ils ne le sont
pas toujours : `excludePlace` d'une ancre ne se distingue pas d'un « quitter Brest » dit par le
lecteur, sauf par la présence de la même ville dans `communeAncre`. *Proposition* : ignorer un
`excludePlace` dont le libellé figure dans `communeAncre` dès FUT-7 (règle de lecture, sans
migration), et laisser le nettoyage à FUT-8.

**Q10. Le libellé.** « Condition sans compromis » (ton brief), « non négociable » (le code, la spec),
« condition » (le verdict). *Proposition* : « condition » dans le verdict, « non négociable » dans le
geste de confirmation (« En faire une condition non négociable »), à faire relire par l'Editorial
Writer avant FUT-8.

---

## Annexe A. Script de reproduction

Hors dépôt (`scratchpad/fut7/repro.test.ts`), lancé par `node --test` depuis la racine du projet.
Extrait des deux cas les plus parlants ; le script complet construit R1 à R9 de la même façon.

```ts
const BREST = { insee: "29019", nom: "Brest", lat: 48.39, lon: -4.48, uu: "29701", tailleVille: 202_000 };
const DIR = { byName: (k: string) => (k === "brest" ? BREST : null), plmByName: () => null };

function dossier(e, hc, prefs = []) {
  const p = normalizeUserProject({ posture: "recherche", intent: null, rawText: "…",
    parsed: { reformulation: "x", hardConstraints: hc, preferences: prefs } })!;
  const mf = mapCommuneToModuleFacts(e, {}, { hasAddress: false,
    tailleVille: e.tailleVille ?? e.population, tailleVilleSource: e.uu ? "urban_unit" : "commune" });
  const ctx = { constraints: hydrateHardConstraints(p.parsed!.hardConstraints, DIR),
    point: { lat: e.lat, lon: e.lon, grain: "commune_reference", source: "commune_centroid", label: e.nom },
    conventionsVersion: PRODUCT_CONVENTIONS_VERSION };
  return assembleDossier(runRules(mf, p, ctx), p, "commune", e.nom);
}

// R1 : « impérativement en Bretagne », Nantes
dossier(nantes, { zones: [{ zone: "bretagne", strength: "hard" }] });
// → Condition non respectée | « Cette commune est hors de la Bretagne, le périmètre que vous avez posé comme condition. »

// R3 : « une ville comme Brest », dossier sur Brest (ce qu'écrit parse/route.ts après dérivation)
dossier(brest, { communeSize: { min: 80_800, max: 505_000 }, excludePlace: [{ label: "Brest" }] });
// → Condition non respectée | « Cette commune fait partie de l'agglomération de Brest, que vous souhaitez quitter. »
```

Sortie du 30/09/2026 sur `main` à `57e36bb4` : 9 tests, 9 réussis.

---

## Addendum du 1er octobre 2026 : ce qui a été implémenté (phase 2)

Décisions de Quentin et ChatGPT appliquées, sur la branche
`bonjourfuturee/fut-7-introduire-la-regle-non-negociable-capacite-a-trancher`.

**Confirmation (option C).** `UserProject.conditions[]`, à côté de `parsed`, épinglée à l'empreinte de
`valeurDecisionnelle` (déplacée dans `criterion-value.ts`, partagée avec la signature décisionnelle). Le
poids d'une préférence n'entre pas dans l'empreinte. Absent, illisible, autre provenance, empreinte
périmée, legacy : non confirmé. Le navigateur ne peut pas en écrire ; la route d'écriture du projet relit
et reporte celles qui existent. `schemaVersion: 2` décrit la forme du contrat, rien d'autre.

**Capacité (`capability.ts`).** Fonction pure du critère, de ses paramètres et du grain. Avec le schéma
actuel, ne tranchent que : un département, une région administrative nommée (son exclusion comprise), un
temps de trajet avec mode explicite évalué à l'adresse. « La région parisienne » (`idf`) s'apprécie : la
frontière est nette, mais elle traduit une expression vernaculaire. Tout le reste
s'apprécie (conventions de futur•e, distances en kilomètres, mer, tailles, « quitter une ville ») ou ne se
mesure pas (temps sans mode, vélo, `faible_secheresse`, `faible_pression_agricole`).

**Porte du verdict.** Dans l'adaptateur dossier (`hard-constraint-rules.ts`) et `condition-rules.ts`
(préférences confirmées). Le noyau, l'hydratation et le filtre de la recherche sont inchangés, sauf les
phrases des constats, qui disent « ce qu'indique votre projet » au lieu de « ce que vous avez posé comme
condition ». `assertFactValid` rejette toute incompatibilité sans confirmation valide ou sans capacité
« trancher ».

**Rôles et orientation.** `condition_check` (« À confirmer », avec signal, raison, conséquence et geste
quand il est connu) et `condition_met` (« Condition remplie »). Orientation `condition_to_confirm`, juste
après `incompatible`. Un critère géographique non confirmé et non rempli devient un écart structurant
(`MismatchFact`, fondement `declared_criterion`).

**Ancres.** Le dossier neutralise à la lecture (`ancres-derivees.ts`, appelé par `projetDeLecture`)
l'exclusion de la ville d'ancrage et la fourchette de taille quand elle est exactement
`[taille ÷ 2,5 ; taille × 2,5]` (`ancre-gabarit.ts`, le calcul même du parseur). La recherche garde son
comportement.

**Poids 1 (R9).** Les règles de santé, de pluies et d'inondation examinent le poids 1 (`not_surfaced`) au
lieu de rendre `not_applicable`. La visibilité d'une carte (`preferenceSurfaced`) vaut « poids ≥ 2 ou
condition confirmée » ; le tier reste celui du poids.

**Signature décisionnelle.** Elle porte les conditions confirmées VALIDES : confirmer ou retirer une
condition périme un dossier figé ; un projet sans condition signe comme avant.

**Version du moteur.** `engine-2`. Les dossiers figés en `engine-1` gardent leur verdict d'origine.

### Correctifs du 1er octobre (revue de la V1)

- La confirmation ne change plus l'importance : une préférence confirmée garde le tier de son poids. Le
  statut de condition vient du rôle (`condition_check`) et de l'orientation (`condition_to_confirm`).
- Les gestes proposés affinent la mesure sans prétendre lever l'ambiguïté du projet (seuil de la
  montagne, métrique d'une distance).
- `idf` (« région parisienne ») passe de `trancher` à `apprecier`.

### La cible n'est pas cette prudence

La table actuelle est prudente parce que le schéma perd de l'information. La cible produit est de
**trancher le plus possible** : dès qu'une demande se traduit en une définition opérationnelle exacte,
transparente et défendable, soit par une mesure qui correspond exactement à la formulation du lecteur,
soit par une convention de futur•e justifiée, précise, versionnée, visible et **acceptée par le lecteur
comme le sens de sa condition** (« Pour cette analyse, vivre à la montagne veut dire […]. Est-ce bien
votre condition ? »).

Rien dans FUT-7 ne l'empêche :
- `criterionCapability` lit déjà les **paramètres** du critère, pas sa seule famille : une branche
  « définition acceptée → trancher » s'ajoute sans rien déconstruire ;
- l'empreinte de confirmation porte la **valeur décisionnelle** : une définition acceptée y entrera, et
  la confirmation portera sur elle, pas sur le seul mot ;
- la porte du verdict et `assertFactValid` demandent une capacité « trancher », jamais une famille de
  critère : un critère promu tranchable produira « Condition non respectée » sans autre changement.

FUT-8 devra donc enrichir le projet (unité d'une taille, métrique d'une distance, définition acceptée
d'une convention, distinction région nommée / expression vernaculaire), et `capability.ts` suivra.
