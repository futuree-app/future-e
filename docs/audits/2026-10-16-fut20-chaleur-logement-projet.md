# FUT-20 — Premier croisement climat × logement × Projet

**16/10/2026** · branche `feat/fut-20-chaleur-logement-projet`, partie de `main` à `8d02e190`.
Référence : cadrage FUT-85 v2 (`explore/fut-85-cadrage-compositions`, `e71db050`), §F et §G.

## Ce qui change pour le lecteur

Avant, à Nîmes, quelqu'un qui veut éviter les fortes chaleurs voyait deux cartes sans lien :
- dans « Ce qui correspond moins bien », la trajectoire de la commune et le geste « Regardez comment le logement tient l'été » ;
- dans « À contrôler », une autre carte : « Le diagnostic classe l'indicateur réglementaire de confort d'été de ce logement comme insuffisant », avec un autre geste.

Après : **une seule carte**, deux échelles nommées, un seul geste ciblé.

> **De fortes chaleurs projetées, et un confort d'été classé insuffisant**
> *À l'échelle de la commune* : les jours au-dessus de 35 °C passeraient de 3 par an (1976-2005) à 14 à l'horizon 2050 ; les nuits tropicales, de 33 à 69.
> *À cette adresse* : Le diagnostic de ce logement, daté du 18 mars 2024, classe son confort d'été comme insuffisant. Le logement n'est pas traversant et son inertie est légère. Le diagnostic ne dit pas si le logement dispose de protections solaires. Face aux fortes chaleurs projetées ici, ce classement et ces caractéristiques méritent une attention particulière.
> *Limite* : l'indicateur est réglementaire ; il ne prédit pas la température que vous connaîtrez à l'intérieur.
> **Demandez si les fenêtres ont des volets ou des stores**
> *Données et limites, à vérifier* : Volets, stores ou brise-soleil limitent la chaleur qui entre dans la journée. Demandez aussi si l'on peut aérer les chambres la nuit. L'aération de nuit ne rafraîchit que lorsque l'air extérieur est plus frais qu'à l'intérieur.

## Les trois niveaux de preuve

| Niveau | Ce que la carte dit du logement | Geste |
|---|---|---|
| **A** (DPE du logement) | L'indicateur (bon / moyen / insuffisant), les caractéristiques documentées, la date. « Bon » : « ce classement ne change rien à l'exposition de la commune ». | Ce qui n'est pas renseigné, puis l'aération de nuit |
| **B1** (DPE de l'immeuble, ou sans bloc confort) | Les caractéristiques que le diagnostic décrit, **du bâtiment**, « pas ce logement » ; il ne dit ni s'il est traversant, ni s'il a des protections solaires | Traversant et protections, puis aération, étage |
| **C** (rien d'attribué) | « Aucun diagnostic rattaché à ce logement ne qualifie son confort d'été » ; rien n'est qualifié ; **aucune preuve DPE** (voir §Corrections) | Idem B1 |

Une information non renseignée n'est jamais dite absente (`protection_solaire: false` = « non renseignées », comme `deriveThermalEvidence`).

## Où le côté logement s'ajoute

Il ne s'ajoute **qu'à une carte chaleur déjà émise par le moteur**, au-dessus de ses seuils :
1. l'écart déclaré (`climate_comfort`, « Ce qui correspond moins bien ») ;
2. le compromis hivers doux / étés chauds (`seasonal_climate_tradeoff`) : le geste passe du côté défavorable au côté logement ;
3. le constat non demandé (D5) : nouvelle variante `ambient_heat_housing` du patron `grouped_verification`, deux items (commune, adresse), `secondary`, rangée avec les contrôles du territoire ;
4. la condition confirmée (D4) : la carte « Vos conditions sans compromis » reçoit le même côté et le geste ; son signal, son constat et sa raison sont inchangés (FUT-110).

Dans les quatre cas, la carte « Confort d'été insuffisant » est absorbée ou réunie (plus de seconde carte ni de second geste). Le fait reste émis et lisible : dépliable d'audit, `absorbedFacts`, preuves de la conclusion.

## Où rien ne change

- Sous le seuil (La Rochelle : 23,4 nuits pour 25) : aucune composition (D2 / FUT-103 non tranché).
- Briançon, Jausiers : aucune composition, aucune phrase de progression.
- Climat absent, entièrement illisible, outre-mer : aucune composition. Un axe seul illisible : la carte suit le moteur (un axe défavorable suffit) et ne cite jamais l'axe non lu.
- `faible_chaleur` au poids 1 : aucune carte chaleur (comme avant).
- Sans adresse : dossier identique octet pour octet.

## Résultats (19/10/2026)

Suite complète lancée seule : **2 754 / 2 754** (2 726 sur `main` + 28). `tsc` OK, `next build` OK, `eslint` sans erreur sur les fichiers touchés.

## Invariants vérifiés (matrice de 96 dossiers : 4 communes × 4 logements × 6 projets)

Identiques avant / après : état de conclusion, étiquette et ton du verdict, titre du verdict, orientation, couverture, registre des critères, nombre de cartes « Ce qui correspond moins bien ». Au plus une carte chaleur ; aucun geste en double ; aucun fait absorbé deux fois ; aucun geste au-delà de 70 caractères ; aucune phrase de vécu.

**Ce qui bouge, volontairement** : le compte des contrôles affiché suit les cartes visibles. Quand la carte logement est absorbée, « N constats restent à contrôler » perd une unité (règle existante : le lecteur doit pouvoir compter les cartes). Et « À contrôler en priorité » peut reprendre le geste ciblé (compromis) au lieu du renvoi générique.

## Corrections de la revue (19/10/2026)

**1. Éditorial** (relecture de l'Editorial Writer : `docs/rapports-agents/editorial-writer/2026-10-19-fut20-gestes-titres.md`).
- Titres : « Des étés très chauds » affirmait une saison entière ; la classification lit un **niveau projeté** à 2050, parfois par les seules nuits. Nouveaux titres :
  - A insuffisant / moyen : « De fortes chaleurs projetées, et un confort d'été classé insuffisant » (ou « classé moyen ») ;
  - A bon : « De fortes chaleurs projetées, et ce qu'en dit le diagnostic » (« classé bon » se lirait « problème réglé » sous « Ce qui correspond moins bien ») ;
  - B1 / C : « De fortes chaleurs projetées, et un confort d'été encore à vérifier ».
  « Classé » rappelle que l'indicateur est une classe réglementaire, pas une mesure.
- Gestes : « aérable la nuit » est retiré. On coordonne des **questions**, chacune avec son sujet (volets ou stores, traversant, aération des chambres la nuit, sous les toits), jamais des attributs sous un même sujet. **Une seule question dans le libellé** pour toutes les postures (≤ 70 caractères), les autres dans le détail.
  - A : « Demandez si les fenêtres ont des volets ou des stores » (ou « … si le logement est traversant », ou « … si l'on peut aérer les chambres la nuit » quand tout est renseigné) ;
  - B1 / C : « Demandez si le logement est traversant », puis au détail : volets ou stores, aération de nuit, sous les toits.
- L'aération n'est plus présentée comme rafraîchissante en soi : « L'aération de nuit ne rafraîchit que lorsque l'air extérieur est plus frais qu'à l'intérieur. »
- Signalé par la relecture, **hors périmètre et non modifié** : le titre de repli sans adresse, « Des étés plus difficiles à concilier avec votre projet » (antérieur à FUT-20), dit une évolution que la classification ne lit pas. Le modifier changerait le rendu des artefacts déjà vendus ; à traiter à part si souhaité.

**2. Provenance au niveau C.** La carte citait « Source : Base DPE (ADEME) » (`persisted_snapshot`) alors qu'aucun diagnostic n'est rattaché. Désormais, en C, le côté logement ne porte **aucune preuve** ; sa limite dit ce qui manque : « Aucun diagnostic n'étant rattaché à ce logement, futur•e ne qualifie pas son confort d'été. Ce qui n'est pas renseigné n'est pas absent : c'est ce qui reste à vérifier. » A et B1 gardent leur preuve, datée et rattachée à un diagnostic précis. Test sur le rendu des trois cartes chaleur et de la condition : ni « Base DPE », ni « ADEME », ni date, et aucune preuve DPE dans les fondements de la conclusion.

**3. Versioning.** Voir ci-dessous, complété.

## Versioning

- L'artefact fige le `Dossier` entier (compositions et plan compris) et se relit tel quel. Le nouveau champ `logement` est **optionnel** : une composition engine-5 d'avant FUT-20 se rend **à l'identique** (texte épinglé contre le composant de `main` 8d02e190).
- **La doctrine** (`decision-artifact.ts`) : `ENGINE_VERSION` se relève « quand une règle, un seuil ou une formulation change ce que le moteur CONCLUT ». FUT-20 change la **présentation** (cartes réunies, gestes, compte des contrôles affichés, donc le plan narratif), pas la **conclusion** : état de conclusion, étiquette, ton et titre du verdict, orientation, couverture, registre des critères et nombre d'écarts sont identiques avant et après sur la matrice de 96 dossiers. Le comparatif de deux analyses (`comparaison-candidats.ts`) ne rapproche que les registres : un dossier FUT-20 et un dossier antérieur restent comparables sans réserve fausse.
- **Pourquoi l'ancienne version reste figée** : l'artefact enregistre le `Dossier` complet (cartes, compositions, plan, faits absorbés) et se relit tel quel, sans repasser par le moteur. Le côté `logement` est optionnel et absent des artefacts antérieurs. Vérification exhaustive du 19/10 : 64 dossiers d'avant FUT-20 (4 communes × 3 logements × 5 projets, plus 4 sans adresse), sérialisés puis relus, **361 cartes rendues au HTML près identiques** par les composants de `main` 8d02e190 et par ceux de la branche (sonde ponctuelle, non conservée car elle lit l'historique git). Trois rendus restent épinglés dans le test permanent : écart déclaré, compromis, condition confirmée.
- Le raisonnement est consigné au-dessus de `ENGINE_VERSION`. Si une évolution future faisait dépendre un verdict ou un registre du logement, elle exigerait `engine-6`.
- Conclusion : **pas d'incrément `engine-5` → `engine-6`**, aucune migration, aucune régénération.
- Effet de bord à connaître : sur un dossier **vivant** (non figé) dont la carte chaleur s'enrichit, le plan narratif change, donc son hash : la conclusion rédigée sera régénérée à la prochaine ouverture (un appel Sonnet par dossier concerné, comme pour toute évolution du plan). Les artefacts figés gardent leur plan et leur narration.

## Hors périmètre

Pas de bloc « Dans le climat futur » (FUT-112), pas de modification de `deriveClimatProjete` ni des seuils, pas d'outre-mer, pas d'îlot de chaleur (v2), pas de synthèse IA supplémentaire.

## Reproduire

- Tests : `node --test src/lib/fut20-chaleur-logement.test.ts` (28 tests, vraies données DRIAS, fixtures FUT-87, rendu `react-dom/server`).
- Banc : `DOSSIER_NARRATIVE=false npm run dev`, puis `/dev/fut20?cas=nimes-a` (cas : `nimes-avant`, `nimes-a`, `nimes-b1`, `nimes-c`, `nimes-ambiant`, `nimes-compromis`, `nimes-condition`, `montpellier-a`, `larochelle-a`, `briancon-a`).
