# FUT-20 — Premier croisement climat × logement × Projet

**16/10/2026** · branche `feat/fut-20-chaleur-logement-projet`, partie de `main` à `8d02e190`.
Référence : cadrage FUT-85 v2 (`explore/fut-85-cadrage-compositions`, `e71db050`), §F et §G.

## Ce qui change pour le lecteur

Avant, à Nîmes, quelqu'un qui veut éviter les fortes chaleurs voyait deux cartes sans lien :
- dans « Ce qui correspond moins bien », la trajectoire de la commune et le geste « Regardez comment le logement tient l'été » ;
- dans « À contrôler », une autre carte : « Le diagnostic classe l'indicateur réglementaire de confort d'été de ce logement comme insuffisant », avec un autre geste.

Après : **une seule carte**, deux échelles nommées, un seul geste ciblé.

> **Des étés très chauds, dans un logement au confort d'été insuffisant**
> *À l'échelle de la commune* : les jours au-dessus de 35 °C passeraient de 3 par an (1976-2005) à 14 à l'horizon 2050 ; les nuits tropicales, de 33 à 69.
> *À cette adresse* : Le diagnostic de ce logement, daté du 18 mars 2024, classe son confort d'été comme insuffisant. Le logement n'est pas traversant et son inertie est légère. Le diagnostic ne dit pas si le logement dispose de protections solaires. Face aux fortes chaleurs projetées ici, ce classement et ces caractéristiques méritent une attention particulière.
> *Limite* : l'indicateur est réglementaire ; il ne prédit pas la température que vous connaîtrez à l'intérieur.
> **Demandez si le logement est protégé du soleil et aérable la nuit**

## Les trois niveaux de preuve

| Niveau | Ce que la carte dit du logement | Geste |
|---|---|---|
| **A** (DPE du logement) | L'indicateur (bon / moyen / insuffisant), les caractéristiques documentées, la date. « Bon » : « ce classement ne change rien à l'exposition de la commune ». | Ce qui n'est pas renseigné, puis l'aération de nuit |
| **B1** (DPE de l'immeuble, ou sans bloc confort) | Les caractéristiques que le diagnostic décrit, **du bâtiment**, « pas ce logement » ; il ne dit ni s'il est traversant, ni s'il a des protections solaires | Traversant et protections, puis aération, étage |
| **C** (rien d'attribué) | « Aucun diagnostic rattaché à ce logement ne qualifie son confort d'été » ; rien n'est qualifié | Idem B1 |

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

## Invariants vérifiés (matrice de 96 dossiers : 4 communes × 4 logements × 6 projets)

Identiques avant / après : état de conclusion, étiquette et ton du verdict, titre du verdict, orientation, couverture, registre des critères, nombre de cartes « Ce qui correspond moins bien ». Au plus une carte chaleur ; aucun geste en double ; aucun fait absorbé deux fois ; aucun geste au-delà de 70 caractères ; aucune phrase de vécu.

**Ce qui bouge, volontairement** : le compte des contrôles affiché suit les cartes visibles. Quand la carte logement est absorbée, « N constats restent à contrôler » perd une unité (règle existante : le lecteur doit pouvoir compter les cartes). Et « À contrôler en priorité » peut reprendre le geste ciblé (compromis) au lieu du renvoi générique.

## Versioning

- L'artefact fige le `Dossier` entier (compositions et plan compris) et se relit tel quel. Le nouveau champ `logement` est **optionnel** : une composition engine-5 d'avant FUT-20 se rend **à l'identique** (texte épinglé contre le composant de `main` 8d02e190).
- Le moteur ne conclut pas autrement (verdict, orientation, registre inchangés), et le comparatif ne rapproche que les registres : **pas d'incrément `engine-5` → `engine-6`**, aucune migration, aucune régénération.
- Effet de bord à connaître : sur un dossier **vivant** (non figé) dont la carte chaleur s'enrichit, le plan narratif change, donc son hash : la conclusion rédigée sera régénérée à la prochaine ouverture (un appel Sonnet par dossier concerné, comme pour toute évolution du plan). Les artefacts figés gardent leur plan et leur narration.

## Hors périmètre

Pas de bloc « Dans le climat futur » (FUT-112), pas de modification de `deriveClimatProjete` ni des seuils, pas d'outre-mer, pas d'îlot de chaleur (v2), pas de synthèse IA supplémentaire.

## Reproduire

- Tests : `node --test src/lib/fut20-chaleur-logement.test.ts` (27 tests, vraies données DRIAS, fixtures FUT-87, rendu `react-dom/server`).
- Banc : `DOSSIER_NARRATIVE=false npm run dev`, puis `/dev/fut20?cas=nimes-a` (cas : `nimes-avant`, `nimes-a`, `nimes-b1`, `nimes-c`, `nimes-ambiant`, `nimes-compromis`, `nimes-condition`, `montpellier-a`, `larochelle-a`, `briancon-a`).
