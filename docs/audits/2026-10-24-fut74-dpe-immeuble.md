# FUT-74 · Le rôle des DPE d'immeuble dans la sélection d'un logement

Audit du 24/10/2026. Branche locale `bonjourfuturee/fut-74-clarifier-le-role-des-dpe-dimmeuble-dans-la-selection-dun`, partie de `main` (`3af53c3c`). Rien n'est poussé, rien n'est câblé dans le parcours de production.

## En une minute

1. **Les données ADEME distinguent le grain sans ambiguïté.** Le champ `type_batiment` (énuméré : `appartement`, `maison`, `immeuble`) correspond une pour une à la méthode d'application sur les 17,3 millions de lignes des deux jeux depuis juillet 2021. Aucune contradiction observée.
2. **Premier défaut, le plus répandu : futur•e présente des DPE d'appartement comme des DPE d'immeuble.** Le grain est lu en cherchant le mot « immeuble » dans la méthode. Or ce mot figure aussi dans « dpe appartement généré à partir des données DPE immeuble », qui désigne **le DPE d'un appartement** (4,2 millions de lignes, 26,6 % du jeu des logements existants). À l'écran, ces lignes s'intitulent « Immeuble entier » et déclenchent la phrase « Un diagnostic concerne l'immeuble entier ».
3. **Deuxième défaut, plus rare et plus grave : un vrai DPE d'immeuble peut devenir « le DPE de ce logement ».** Rien ne l'empêche : ni la liste, ni la saisie par numéro, ni le serveur. Une fois retenu, son étiquette s'affiche dans le Passeport du logement, et le moteur écrit « À cette adresse, le diagnostic choisi classe ce logement F, une passoire énergétique » (fait *structurant*, repris par le Relevé et la synthèse).
4. **Ce qui est déjà juste :** l'attribution automatique (réservée à une maison seule), les statistiques de classes et de surfaces de l'adresse (elles n'agrègent que des logements), et la lecture du confort d'été (FUT-20), qui refuse de qualifier un logement depuis un DPE d'immeuble.
5. **Recommandation :** un DPE d'immeuble n'est **jamais** sélectionnable comme celui d'un logement ; il reste **visible** comme information sur le bâtiment, nommée comme telle ; quand il est seul, la section dit qu'aucun DPE de logement n'est enregistré et montre celui de l'immeuble à part. Le grain se lit sur `type_batiment`, jamais sur un mot de la méthode.

Le correctif est préparé : un module pur `src/lib/dpe-grain.ts`, des fixtures synthétiques, 12 tests qui passent et 5 tests `todo` qui décrivent la doctrine attendue et échouent aujourd'hui. Le câblage touche des fichiers hors PR #83, sauf deux libellés qui l'attendront.

---

## 1. Ce que les données ADEME permettent d'établir

### 1.1 Les jeux consommés

futur•e interroge l'API data-fair de l'ADEME (`src/lib/dpe.ts`) :

| Jeu | Rôle dans futur•e | Lignes au 24/10/2026 |
|---|---|---|
| `dpe03existant` · DPE logements existants depuis juillet 2021 | candidats de l'adresse, recherche par numéro | 15 854 388 |
| `dpe02neuf` · DPE logements neufs depuis juillet 2021 | idem | 1 452 378 |
| `dpe-france` · avant juillet 2021 | recherche par numéro seulement, jamais attribuable (tous expirés) | 10 728 950 |
| `dpe01tertiaire` | déclaré, non appelé sur le chemin Logement | |

Les candidats d'une adresse sont les lignes dont `identifiant_ban` égale celui du dossier (`getDpeCandidatesByBanId`, `lookupDpeCandidatesByBanId`), dédupliquées par numéro.

### 1.2 Le dictionnaire de données officiel

Source : `DPE_dictionnaire_de_données_JDD.xlsx`, pièce jointe officielle du jeu `dpe03existant` (mise à jour 08/09/2025). Citations exactes :

| Champ | Définition ADEME | Ce qu'il établit |
|---|---|---|
| `type_batiment` | « Type de bâtiment (Appartement/immeuble/maison individuelle) » | **le grain du diagnostic**, énuméré |
| `methode_application_dpe` | « méthode d'application du DPE logement » | la méthode, 6 valeurs (existant) et 10 (neuf) |
| `numero_dpe_immeuble_associe` | « numéro du DPE immeuble associé au DPE **logement** utilisant la méthode de génération des DPE à l'appartement à partir du DPE immeuble » | le lien d'un appartement généré vers son immeuble |
| `appartement_non_visite` | « est ce que l'appartement est un appartement non visité dans le cas d'un DPE appartement généré à partir d'un immeuble. (application de système individuel **les moins performants** de l'immeuble) » | la fiabilité d'un appartement généré |
| `surface_habitable_logement` | « surface habitable du logement renseignée **sauf dans le cas du dpe à l'immeuble** » | absent sur un DPE d'immeuble |
| `surface_habitable_immeuble` | « surface habitable totale de l'immeuble dans le cas d'un DPE appartement avec usage collectif ou d'un DPE immeuble » | la taille de l'immeuble |
| `nombre_appartement` | « nombre d'appartements de l'immeuble dans le cas d'un DPE appartement avec usage collectif ou d'un DPE immeuble » | idem |
| `complement_adresse_logement` | « complement d'adresses » (texte libre) | rien de garanti |

Le dictionnaire ne dit pas en toutes lettres qu'un appartement généré est « le DPE de cet appartement ». Il le qualifie de « DPE logement », et les données le confirment (§ 1.4).

### 1.3 La répartition réelle, sur la base entière

Agrégats serveur (`values_agg`), aucune ligne collectée :

**`dpe03existant`**

| `methode_application_dpe` | `type_batiment` | Lignes | Part |
|---|---|---|---|
| dpe appartement individuel | appartement | 6 486 345 | 40,9 % |
| dpe maison individuelle | maison | 4 733 027 | 29,9 % |
| **dpe appartement généré à partir des données DPE immeuble** | **appartement** | **4 211 200** | **26,6 %** |
| dpe immeuble collectif | immeuble | 413 041 | 2,6 % |
| RT2012 bâtiment : appartement | appartement | 10 495 | |
| RT2012 bâtiment : immeuble | immeuble | 280 | |

**`dpe02neuf`** : mêmes trois grains, sept méthodes RT2012/RE2020 (`bâtiment : appartement / maison individuelle / immeuble`), plus 50 529 appartements générés et 1 286 DPE d'immeuble collectif.

Correspondance méthode → type : **une pour une, sans exception**, sur les deux jeux.

Taux de remplissage mesurés :

| | Appartements générés | DPE d'immeuble | Appartements individuels |
|---|---|---|---|
| `identifiant_ban` présent | 93,6 % | 95,1 % | 97,7 % |
| `surface_habitable_logement` présente | 100 % | **0,27 %** | 99,96 % |
| `numero_dpe_immeuble_associe` présent | 97,8 % | 0,13 % | ≈ 0 |
| `appartement_non_visite = 1` | **61,3 %** | | |
| confort d'été renseigné | 7,7 % | 4,9 % | 93,7 % |

### 1.4 Échantillons réels (24/10/2026)

Cinq immeubles remontés depuis leurs appartements générés, trois immeubles récents descendus vers leurs enfants (aucun enfant publié), seize adresses portant un DPE d'immeuble pour la coexistence. Constats :

- **Un appartement généré a ses propres valeurs.** Dans un immeuble de 1 130 m², quinze appartements générés vont de **C 155,6** à **D 191,1** kWh/m²/an, chacun avec sa surface (25 à 70,7 m²) et son lot. Dans le Bas-Rhin, l'immeuble est classé C 159,1 et ses six appartements vont de C 136 à **D 184,8**. Ce sont des diagnostics de logement, calculés à partir des données de l'immeuble.
- **L'immeuble et ses appartements partagent souvent le même `identifiant_ban`** (Nord, Bas-Rhin) : la liste des candidats d'une adresse les mélange.
- **Un DPE d'immeuble porte parfois des champs « logement » parasites** : `typologie_logement: T1`, `position_logement_dans_immeuble: RDC`, `complement_adresse_logement: "2-DPE-1-LogZone"`. Ces champs ne peuvent donc servir à rien pour établir le grain.
- **Coexistence à l'adresse** (16 adresses portant un DPE d'immeuble) : 12 fois avec des DPE d'appartements individuels, 4 fois seul (dont 3 dont l'`identifiant_ban` est un code commune, `2A008`, jamais égal à celui d'un dossier).
- **Les DPE remplacés disparaissent du jeu ouvert** (5 sur 5 vérifiés via `numero_dpe_remplace`) : pas de doublon remplacé/remplaçant dans une liste.
- **Le jeu d'avant 2021** a trois types : « Logement » (5,3 M), « Maison Individuelle » (4,6 M), « Bâtiment collectif à usage principal d'habitation » (0,9 M). Sans conséquence sur le chemin payant (jamais attribuable), mais le module de grain les lit.

### 1.5 Ce que la donnée ne permet pas

- Savoir **lequel** des appartements d'un immeuble est celui du lecteur : seuls le numéro du document ou une reconnaissance par le lecteur le permettent (doctrine FUT-68, inchangée).
- Déduire le grain d'un libellé libre, d'une surface ou d'un complément d'adresse.
- Dire si un appartement généré « non visité » est représentatif : la règle ADEME applique les systèmes individuels les moins performants, donc l'étiquette peut être pessimiste. C'est une propriété documentée, que l'écran peut dire, sans la corriger.

---

## 2. Le comportement de futur•e, du jeu ADEME à l'écran

```
ADEME (dpe03existant, dpe02neuf)
  └─ dpe.ts · toRecord : type_batiment ✔, methode_application_dpe ✔ (methode_dpe),
     surface_habitable_logement ✔ ; surface_habitable_immeuble, nombre_appartement,
     numero_dpe_immeuble_associe, appartement_non_visite : NON COLLECTÉS
  └─ dpe-attribution.ts · dpeAttributionStatus : auto seulement pour 1 maison  ✔
  └─ dpe-address-context.ts · isCollective(methode) = includes("immeuble")    ✖ bug 1
       ├─ buildAddressDpeContext : stats sur type maison|appartement            ✔
       └─ hasCollective                                                        ✖ bug 1
  └─ dpe-selection-vue.ts · ligneCandidat : « Immeuble entier »                  ✖ bug 1
  └─ DpeSelector / AddressDiagnosticsBlock : toutes les lignes cliquables        ✖ bug 2
  └─ SaisieNumeroDpe + /api/logement-dpe/numero : un numéro d'immeuble est attachable ✖ bug 2
  └─ /api/logement-dpe POST : aucun contrôle de grain, fige le snapshot          ✖ bug 2
  └─ selected_dpe_snapshot (address_dossiers)
       ├─ LogementModule · dpe → energyState, dpeLabel, Passeport, Énergie        ✖ bug 2
       ├─ logement-facts.ts · buildLogementFacts → dpeLabel                       ✖ bug 2 (fichier #83)
       ├─ logement-rules.ts · ruleDpe « classe ce logement F »                    ✖ bug 2 (fichier #83)
       ├─ thermal-evidence.ts · type immeuble → C_NO_DATA ; généré → B1           ✔
       ├─ chaleur-logement.ts (FUT-20) · généré : « il décrit le bâtiment, pas ce logement » ✖ libellé
       └─ logement-synthesis-cache.ts · payload.dpe (type « immeuble » transmis)  ✖ bug 2
                                       · diagnostics_adresse.immeuble_entier      ✖ bug 1
```

### 2.1 Bugs avérés

**Bug 1 · Les appartements générés sont étiquetés « immeuble ».** `isCollective` (`src/lib/dpe-address-context.ts:37`) cherche « immeuble » dans la méthode. Conséquences mesurées sur les fixtures avec le code actuel :

- chaque ligne générée porte le détail « diagnostic de l'immeuble » ; sans complément d'adresse, elle s'intitule « Immeuble entier » ;
- `hasCollective` est vrai dès qu'un appartement généré est présent : l'écran affiche « Un diagnostic concerne l'immeuble entier » alors qu'aucun ne le concerne, et la synthèse reçoit `immeuble_entier: true` ;
- en revanche, la ligne reste cliquable et, retenue, alimente correctement le moteur (son type est `appartement`). Le défaut est d'affichage et de récit, et il touche le quart des diagnostics de logement de France.

**Bug 2 · Un DPE d'immeuble peut être retenu comme celui du logement.** Aucun des trois verrous n'existe : la liste le propose comme les autres, la saisie par numéro le trouve et le déclare attachable, la route `POST /api/logement-dpe` le fige. Ensuite :

- Passeport du logement : sceau à l'étiquette de l'immeuble, « Type de bâti : immeuble » ;
- section Énergie : « Étiquette F, … », « Vous avez désigné ce diagnostic parmi ceux de cette adresse » ;
- moteur : `dpeLabel = "F"`, `ruleDpe` émet « À cette adresse, le diagnostic choisi classe ce logement F, une passoire énergétique. » au rang *structurant*, repris par le Relevé ;
- synthèse : le modèle reçoit l'étiquette de l'immeuble sous `dpe`, avec seulement `type: "immeuble"` pour s'en méfier, et aucune consigne du prompt ne porte sur ce cas ;
- incohérence interne : la composition chaleur FUT-20 dit au même moment « Aucun diagnostic rattaché à ce logement ne qualifie son confort d'été ».

Le test `BUG 3` de `dpe-grain.test.ts` le prouve : `buildLogementFacts(…, DPE d'immeuble).dpeLabel` vaut `"F"`.

**Bug 2 bis · L'immeuble est compté parmi les lignes à reconnaître.** « 4 diagnostics sont enregistrés à cette adresse. Reconnaissez-vous celui de ce logement ? » invite à choisir parmi quatre lignes dont une ne peut pas être la bonne. Avec un DPE d'immeuble seul : « Un diagnostic est enregistré à cette adresse. Est-ce celui de ce logement ? »

### 2.2 Ambiguïtés produit (à trancher, § 5)

- un numéro de document qui désigne le DPE de l'immeuble ;
- un grain indéterminé (jamais observé sur les jeux actuels, possible sur un snapshot ancien) ;
- l'appartement généré non visité, à l'étiquette potentiellement pessimiste ;
- les dossiers historiques qui auraient déjà retenu un DPE d'immeuble.

### 2.3 Comportements déjà corrects

- **Pas de repli automatique** sur un DPE d'immeuble : l'attribution automatique exige une maison seule.
- **Statistiques d'adresse** (`buildAddressDpeContext`) : répartition des classes et surfaces sur les seuls types `maison`/`appartement` ; le DPE d'immeuble n'y entre pas. Les appartements générés y entrent, et c'est juste : ce sont des logements. Aucune moyenne n'est calculée.
- **Confort d'été (FUT-20)** : un DPE d'immeuble retenu donne le niveau `aucun` ; un appartement généré reste au niveau `batiment` même s'il porte l'indicateur, ce qui est prudent et cohérent avec un remplissage de 7,7 %. Seul le libellé est à corriger.
- **Audit énergétique (FUT-62)** : le grain logement/immeuble y est déjà lu sur les surfaces, et un audit d'immeuble n'est jamais attribué au logement.
- **Données contradictoires ou absentes** : une panne ADEME reste `non_verifie` (FUT-65), jamais une absence.

### 2.4 Statistiques communales

`getDpeSummaryForCommune` agrège `etiquette_dpe` sur tout `dpe03existant`, DPE d'immeuble compris (2,6 % des lignes), soit un immeuble compté comme un logement. La route `/api/dpe/[insee]` qui l'expose n'a aucun appelant dans `src/`. Défaut latent, sans effet visible aujourd'hui.

---

## 3. Exemples avant / après

Rendus **réels** du code actuel sur les fixtures (`src/lib/dpe-grain.fixtures.ts`), puis rendu attendu.

### Cas 1 · Immeuble et six appartements générés, même adresse, sans complément

| Avant | Après |
|---|---|
| « 7 diagnostics sont enregistrés à cette adresse. Reconnaissez-vous celui de ce logement ? » | « 6 diagnostics de logement sont enregistrés à cette adresse. Reconnaissez-vous celui de ce logement ? » |
| 7 lignes « Immeuble entier · diagnostic de l'immeuble · 57,7 m² · DPE 2025 · classe D » | 6 lignes « Sans identifiant de logement · 57,7 m² · établi à partir des données de l'immeuble · DPE 2025 · classe D » |
| la ligne de l'immeuble, cliquable | hors de la liste : « Le diagnostic de l'immeuble entier est classé C (2025). Il décrit le bâtiment dans son ensemble, et ne donne la classe d'aucun logement en particulier. » |

### Cas 2 · Trois appartements générés, avec identifiant de lot

| Avant | Après |
|---|---|
| « Un diagnostic concerne l'immeuble entier… » | phrase absente : aucun ne concerne l'immeuble |
| « Lot : 900001 - Porte : 2 · diagnostic de l'immeuble · 52,8 m² » | « Lot : 900001 - Porte : 2 · 52,8 m² · établi à partir des données de l'immeuble » |

### Cas 3 · Un DPE d'immeuble seul

| Avant | Après |
|---|---|
| « Un diagnostic est enregistré à cette adresse. Est-ce celui de ce logement ? » + ligne cliquable « Immeuble entier · classe F » | « Aucun diagnostic de logement n'est enregistré à cette adresse dans la base ouverte. Le diagnostic de l'immeuble entier est classé F (2026) : il renseigne sur le bâtiment, sans donner la classe de ce logement. » + saisie par numéro |
| s'il est cliqué : Passeport scellé F, « le diagnostic choisi classe ce logement F, une passoire énergétique » | impossible : la ligne n'est pas proposée, et le serveur refuse `DPE_IMMEUBLE` |

### Cas 4 · Immeuble et trois appartements individuels

| Avant | Après |
|---|---|
| « 4 diagnostics… », première ligne « 2-DPE-1-LogZone · diagnostic de l'immeuble · classe D » cliquable | « 3 diagnostics de logement… », trois lignes ; l'immeuble à part |

### Composition chaleur FUT-20, appartement généré retenu

- Avant : « Le diagnostic retrouvé, daté du 3 juin 2025, a été généré à partir des données de l'immeuble : il décrit le bâtiment, pas ce logement, et ne qualifie pas son confort d'été. »
- Après : « Le diagnostic retenu, daté du 3 juin 2025, a été établi à partir des données de l'immeuble : les caractéristiques qu'il décrit sont celles du bâtiment, et il ne qualifie pas le confort d'été de ce logement. »

L'ancienne phrase contredit la section Énergie, qui présente à juste titre son étiquette comme celle du logement.

---

## 4. Doctrine proposée

**Principe.** Le grain d'un diagnostic se lit sur `type_batiment`. Seul un diagnostic au grain *logement* peut devenir « le diagnostic de ce logement ». Un diagnostic d'immeuble est une information sur le bâtiment : il se montre, nommé comme tel, et ne nourrit jamais une conclusion sur le logement.

**A. Le DPE d'un immeuble est-il sélectionnable comme celui d'un appartement ?** Non. Un DPE d'immeuble ne porte ni surface de logement, ni identification d'un lot, et son étiquette moyenne des appartements qui, mesurés, s'en écartent d'une classe (C 159 pour l'immeuble, D 185 pour un de ses appartements). Le laisser choisir, même avec un avertissement, revient à laisser l'utilisateur fabriquer une preuve que la donnée ne porte pas, et le moteur en tire une réserve structurante. Le verrou est triple : la liste ne le propose pas, la saisie par numéro ne le rattache pas, le serveur le refuse.

**B. Peut-il rester visible ?** Oui, comme information du bâtiment, hors de la liste à reconnaître, avec sa classe, son année et, une fois collectés, la taille de l'immeuble et son nombre de logements. Il a une valeur réelle de décision en copropriété : il situe le bâti commun et se lit avec l'audit d'immeuble (FUT-62).

**C. Que faire s'il n'existe qu'un DPE d'immeuble ?** La section dit qu'aucun diagnostic de logement n'est enregistré, montre celui de l'immeuble à part, offre la saisie par numéro, et le moteur ne reçoit aucune étiquette. Le geste « obtenir le diagnostic du logement » reste proposé. Aucun repli.

**D. Quelles statistiques peuvent l'utiliser ?** Aucune statistique de logements : ni répartition des classes, ni bornes de surfaces, ni compte de « diagnostics à reconnaître ». Il peut être compté à part (« et un diagnostic de l'immeuble ») et décrit pour lui-même. Les appartements générés, eux, sont des logements et restent dans les statistiques d'adresse. Pour les statistiques communales, filtrer `type_batiment` sur `appartement` et `maison` si la route est un jour utilisée.

**E. Comment le formuler ?**

- Nommer l'objet avant la valeur : « Le diagnostic de l'immeuble entier est classé C », jamais « classe C » seul sur une ligne parmi celles des logements.
- Dire ce qu'il ne fait pas en une proposition, sans antithèse : « il ne donne la classe d'aucun logement en particulier ».
- Ne jamais écrire « Immeuble entier » pour un appartement généré ; le dire « établi à partir des données de l'immeuble », en détail secondaire.
- Compter séparément : « 6 diagnostics de logement », puis l'immeuble.

### Tableau des cas

| Situation à l'adresse | Liste « reconnaître son logement » | Information « immeuble » | Attribution possible | Moteur (`dpeLabel`) | Statistiques d'adresse |
|---|---|---|---|---|---|
| Logements seuls (individuels) | tous | absente | par choix ; auto si une maison seule | étiquette du choix | tous |
| Logements générés seuls | tous, détail « établi à partir des données de l'immeuble » | absente | par choix | étiquette du choix | tous |
| Immeuble + générés | les générés | présente | un généré, par choix | étiquette du choix | les générés |
| Immeuble + individuels | les individuels | présente | un individuel, par choix | étiquette du choix | les individuels |
| Immeuble seul | vide, phrase « aucun diagnostic de logement » | présente | aucune ; numéro d'un logement seulement | `null` | aucune |
| Numéro saisi = DPE d'immeuble | | montré comme celui de l'immeuble | refusée (`DPE_IMMEUBLE`) | inchangé | |
| Grain indéterminé (type et méthode absents ou contradictoires) | à part, « nature du diagnostic non précisée » | | refusée (D3) | `null` | exclu |
| Dossier historique ayant retenu un DPE d'immeuble | rouverte | présente | reprise par le lecteur | `null` à la lecture | |
| Base ADEME en panne | inchangé (FUT-65) | | | | |

---

## 5. Correctif proposé

### 5.1 Ce qui est préparé dans la branche

| Fichier | Contenu | État |
|---|---|---|
| `src/lib/dpe-grain.ts` | `grainDpe`, `attribuableAuLogement`, `issuDesDonneesDeLImmeuble`, `repartirParGrain` ; pur, client et serveur | neuf, non câblé |
| `src/lib/dpe-grain.fixtures.ts` | 6 adresses synthétiques à la forme des lignes réelles (identifiants inventés `FUT74…`, BAN `99999_`) | neuf |
| `src/lib/dpe-grain.test.ts` | 12 tests qui passent (grain des 13 méthodes, type prioritaire, ambigus, jeu d'avant 2021, neuf, répartition, champ parasite, 4 non-régressions) ; 5 tests `todo` sur la doctrine attendue du code actuel | neuf |

`npm test` : 2 973 tests, 2 968 réussis, 0 échec, 5 `todo`. Les `todo` échouent aujourd'hui sans casser la suite ; le câblage retire le marqueur et ils deviennent la non-régression.

### 5.2 Le câblage, fichier par fichier

**Urgent (fiabilité), hors fichiers de la PR #83, faisable dès la décision :**

| # | Fichier | Modification |
|---|---|---|
| U1 | `src/app/api/logement-dpe/route.ts` | refuser `auto_confirmed`/`user_confirmed` quand `!attribuableAuLogement(dpe)`, pour les deux sources (`liste`, `numero`) : `422 DPE_IMMEUBLE` |
| U2 | `src/lib/dpe-address-context.ts` | `isCollective` → `grainDpe(c) === "immeuble"` ; `total` et `hasCollective` sur le grain ; ajout d'un compte `logements` |
| U3 | `src/lib/dpe-selection-vue.ts` | `ligneCandidat` sur `grainDpe` ; détail « établi à partir des données de l'immeuble » pour les générés ; phrases de compte par grain |
| U4 | `src/components/report/logement/AddressDiagnosticsBlock.tsx`, `DpeSelector.tsx` | ne passer au sélecteur que `repartirParGrain(c).logements` ; bloc immeuble à part ; état « immeuble seul » |
| U5 | `src/components/report/logement/SaisieNumeroDpe.tsx`, `src/app/api/logement-dpe/numero/route.ts` | un numéro d'immeuble rend `status: "immeuble"`, montré, jamais rattachable |
| U6 | `src/components/report/LogementModule.tsx` (l. 331), `src/lib/server/assemble-address-dossier.ts` (l. 80), `src/lib/logement-synthesis-cache.ts` | neutralisation à la lecture : un snapshot non attribuable n'est pas « le DPE du logement » (`dpe = null` côté moteur, Passeport, Énergie, synthèse), avec un message et la reprise |

**Éditorial, secondaire :**

| # | Fichier | Modification |
|---|---|---|
| E1 | `src/lib/decision/chaleur-logement.ts` | libellé du niveau `batiment` pour un généré (§ 3) ; `fut20-chaleur-logement.test.ts` est modifié par #83 sur 2 lignes : rebaser après fusion |
| E2 | `src/lib/dpe.ts` + `DpeRecord` (champs optionnels) | collecter `surface_habitable_immeuble`, `nombre_appartement`, `numero_dpe_immeuble_associe`, `appartement_non_visite` pour décrire l'immeuble et nuancer un généré non visité |
| E3 | `src/lib/dpe.ts` · `getDpeSummaryForCommune` | filtrer `type_batiment` (route sans appelant) |
| E4 | `src/app/api/synthesize-logement/route.ts` | rien d'urgent une fois U6 fait (l'immeuble n'atteint plus `dpe`) ; corriger le sens de `immeuble_entier` vient de U2 |

**Après fusion de la PR #83 (ne pas toucher avant) :**

| # | Fichier | Modification |
|---|---|---|
| P1 | `src/lib/decision/logement-rules.ts:232` | limite de `ruleDiagnosticNonAttribue` : « Un diagnostic généré à l'immeuble ne décrit pas un logement en particulier. » est faux pour un généré ; remplacer par « Un diagnostic de l'immeuble entier ne décrit pas un logement en particulier. » |
| P2 | `src/lib/decision/logement-facts.ts` | défense en profondeur : `buildLogementFacts` ignore l'étiquette d'un snapshot non attribuable. Redondant avec U6, mais protège tout futur appelant |

`logement-coverage.ts` et `decision-assembler.ts` ne sont pas concernés.

### 5.3 Conflits avec la PR #83

La PR #83 modifie `logement-rules.ts` (21 lignes), `logement-facts.ts` (2), `logement-coverage.ts` (10), `decision-assembler.ts` (20) et `fut20-chaleur-logement.test.ts` (2), sans toucher à `ruleDpe`, à `ruleDiagnosticNonAttribue`, à `buildLogementFacts` ni à la dérivation du confort d'été. Le câblage urgent (U1 à U6) ne touche aucun de ces fichiers : aucun conflit. P1, P2 et E1 attendent la fusion ; le conflit serait textuel, pas de sens.

### 5.4 Compatibilité des anciens dossiers

- **Aucune migration, aucune réécriture de la base.** Un choix explicite du lecteur reste inscrit tel quel (`user_confirmed` et son snapshot).
- **Neutralisation à la lecture (U6).** Un dossier qui aurait retenu un DPE d'immeuble l'affiche comme information du bâtiment, avec : « Vous aviez retenu le diagnostic de l'immeuble entier. Il décrit le bâtiment, et futur•e ne l'attribue pas à ce logement. » et la reprise de la sélection. Le moteur ne reçoit plus d'étiquette.
- **Versions figées et artefacts de décision : inchangés.** Ils restent la trace de ce qui a été lu ; aucune régénération n'est déclenchée. La prochaine actualisation demandée par le lecteur produit des faits corrigés.
- **Synthèses.** Le correctif change le payload, donc l'empreinte, pour deux familles de dossiers : ceux qui avaient retenu un DPE d'immeuble (`dpe` devient `null`) et ceux dont l'adresse ne porte que des appartements générés (`immeuble_entier` passe de vrai à faux). Leur synthèse serait régénérée à la prochaine ouverture, soit un appel au modèle par dossier concerné (décision D5).
- **Mesurer avant de décider.** Requête en lecture seule, sans donnée personnelle, à lancer par le porteur :

```sql
select
  count(*) filter (where selected_dpe_snapshot->>'type_batiment' = 'immeuble')                    as immeuble_retenu,
  count(*) filter (where selected_dpe_snapshot->>'methode_dpe' ilike '%généré à partir des données%') as genere_retenu,
  count(*) filter (where selected_dpe_snapshot is not null
                     and coalesce(selected_dpe_snapshot->>'type_batiment', '') = '')               as type_absent,
  count(*) filter (where selected_dpe_snapshot is not null)                                        as dpe_retenu
from address_dossiers
where dpe_selection_status in ('auto_confirmed', 'user_confirmed');
```

### 5.5 Tests à activer au câblage

Les 5 `todo` de `dpe-grain.test.ts`, plus, à écrire avec le câblage :

- route `POST /api/logement-dpe` : `422 DPE_IMMEUBLE` en `liste` et en `numero`, pour un grain `immeuble` et `indetermine` ;
- `AddressDiagnosticsBlock` : l'immeuble n'apparaît jamais parmi les boutons « Retenir ce diagnostic » (libellé accessible) ;
- `vueSectionDpe` : un état distinct pour « immeuble seul » ;
- dossier historique : un snapshot d'immeuble restauré donne `dpe = null` côté moteur et le message de reprise ;
- synthèse : `immeuble_entier` faux sur `GENERES_SEULS`, vrai sur `IMMEUBLE_ET_INDIVIDUELS`.

---

## 6. Décisions qui reviennent au porteur

| # | Question | Options | Recommandation |
|---|---|---|---|
| D1 | Le DPE d'immeuble est-il sélectionnable ? | (a) jamais ; (b) oui, avec avertissement | **(a)** : l'avertissement n'empêche pas le moteur d'en tirer une réserve structurante |
| D2 | Un numéro de document qui désigne l'immeuble | (a) le montrer comme celui de l'immeuble, sans rattacher ; (b) refuser comme « introuvable » | **(a)** : le numéro existe, le dire faux enverrait chercher une faute de frappe |
| D3 | Grain indéterminé (0 cas dans les jeux actuels) | (a) jamais attribuable ; (b) sélectionnable avec mention | **(a)** : aucun cas réel n'est perdu, et la règle protège les snapshots anciens |
| D4 | Dossiers historiques | (a) neutraliser à la lecture, message, reprise ; (b) migration | **(a)**, après la requête du § 5.4 |
| D5 | Synthèses dont l'empreinte change | (a) accepter la régénération ; (b) figer l'ancien payload | **(a)** si la requête montre peu de dossiers |
| D6 | Dire qu'un appartement généré n'a pas été visité | (a) oui, en détail (« logement non visité : les équipements les moins performants de l'immeuble ont été appliqués ») ; (b) non | **(a)**, en secondaire (E2) : c'est une propriété documentée qui change la lecture d'une étiquette |
| D7 | Contenu de l'information « immeuble » | classe + année seulement, ou + surface et nombre de logements | classe + année en urgent ; le reste avec E2 |

---

## Sources

- Dictionnaire de données officiel ADEME, `DPE_dictionnaire_de_données_JDD.xlsx`, pièce jointe du jeu [DPE Logements existants (depuis juillet 2021)](https://data.ademe.fr/datasets/dpe03existant).
- API data-fair ADEME, jeux `dpe03existant`, `dpe02neuf`, `dpe-france` : agrégats `values_agg` et lignes interrogées le 24/10/2026 (une soixantaine d'appels, aucune collecte massive, aucune donnée d'utilisateur).
- Présentation des deux méthodes de DPE en appartement (DPE de l'appartement ou adaptation des données de l'immeuble) : [Préfecture du Var, fiche DPE](https://www.var.gouv.fr/contenu/telechargement/27839/188954/file/f03_dpe_web.pdf) ; principe de la note fondée sur l'immeuble et un échantillon de lots : [Selectra, DPE collectif](https://entreprises.selectra.info/energie/profils/copropriete/dpe-collectif) (source commerciale, citée pour le principe seulement).
- Code lu : `src/lib/dpe.ts`, `dpe-attribution.ts`, `dpe-address-context.ts`, `dpe-selection-vue.ts`, `dpe-candidate-match.ts`, `dpe-rapprochement.ts`, `thermal-evidence.ts`, `logement-synthesis-cache.ts`, `decision/logement-facts.ts`, `decision/logement-rules.ts`, `decision/chaleur-logement.ts`, `api/logement-dpe/*`, `api/synthesize-logement/route.ts`, `components/report/LogementModule.tsx`, `DpeSelector.tsx`, `logement/AddressDiagnosticsBlock.tsx`, `EnergieSection.tsx`, `PropertyPassport.tsx`.
- Tickets : FUT-68 (sélection compacte, livrée), FUT-65 (absence et panne), FUT-62 (audit énergétique), FUT-20 (chaleur × logement).

---

## 7. Livraison (24/10/2026, après arbitrages du porteur)

### 7.1 Arbitrages retenus

| # | Décision du porteur | Mise en œuvre |
|---|---|---|
| D1 | jamais sélectionnable | la liste ne propose que `repartirParGrain(c).logements` ; la route refuse `422 DPE_NON_ATTRIBUABLE` (`refusDAttribution`) |
| D2 | numéro d'immeuble : montré, jamais rattaché | `/api/logement-dpe/numero` rend `grain` et `attachable: false` ; `SaisieNumeroDpe` dit « Ce numéro est celui du diagnostic de l'immeuble entier » |
| D3 | grain indéterminé : non attribué | `grainDpe` rend `indetermine` pour un type absent sans méthode lisible, un type hors énumération, ou un type et une méthode contradictoires ; la liste les nomme à part (`phraseIndetermines`), sans les compter comme absence de diagnostic |
| D4 | historiques immuables, réserve explicite, nouvelle sélection | `dpeDuLogement` neutralise à la lecture (moteur, écran, synthèse) ; la base n'est pas réécrite ; la section dit `phraseChoixEcarte` et offre « Retirer ce choix et désigner le diagnostic du logement » |
| D5 | pas de régénération à la consultation ; mesurer d'abord | comptage ci-dessous ; aucune empreinte de synthèse existante ne change (§ 7.3) ; procédure § 7.4 |
| D6 | « appartement non visité » si renseigné | collecte de `appartement_non_visite` pour les seuls générés ; détail de ligne et phrase de la section Énergie, sans jugement sur le diagnostic |
| D7 | fiche immeuble distincte | `ficheImmeuble` : classe, date, source ; « immeuble de N logements » seulement si N ≥ 2 (4,9 % des DPE d'immeuble déclarent 0 ou 1), surface si > 0 ; statistiques d'adresse sur les seuls logements (classes, surfaces, années, types) |

### 7.2 Comptage des dossiers (lecture seule)

Requêtes `HEAD` avec `Prefer: count=exact` sur l'API Supabase du projet de `.env.local` : aucune ligne transférée, aucune écriture possible, seuls des nombres affichés. Versionné dans `scripts/admin/fut74-compter-dpe-hors-logement.mjs`. Contrôles positifs passés (les filtres retrouvent bien les appartements individuels et la maison retenus).

| Mesure | Résultat |
|---|---|
| Dossiers à DPE retenu dont le DPE est celui d'un immeuble | **0** |
| … dont le grain est indéterminé ou le type hors énumération | **0** |
| … dont le DPE est un appartement généré | 0 (tous les DPE retenus sont des appartements individuels ou des maisons) |
| Versions de rapport dont un candidat est un DPE d'immeuble | quelques-unes : montré dans la liste, jamais retenu |
| Versions de rapport dont un candidat est un appartement généré | 0 |
| Artefacts de décision issus d'un DPE d'immeuble retenu | **0** |

Les volumes exacts (dossiers, versions, artefacts par version du moteur) sont consignés dans FUT-74 sur Linear : le dépôt est public, et ils décrivent l'activité.

Aucun dossier ne demande de nouvelle sélection ni d'actualisation. Aucune version du moteur n'est impliquée.

### 7.3 Compatibilité historique

- **Base** : rien n'est réécrit, aucune migration.
- **Artefacts figés** : inchangés ; aucun n'est concerné.
- **`ENGINE_VERSION`** : reste `engine-7`. Le moteur ne change de conclusion que pour un dossier ayant retenu un DPE d'immeuble ; il n'en existe aucun, et la route empêche d'en créer. La raison est écrite au-dessus de la constante, dans la forme des précédents FUT-20 et FUT-96.
- **Synthèses** : les champs que lit le modèle (`dpe`, `diagnostics_adresse.total`, `ecart_classes`, `immeuble_entier`) gardent leur valeur pour toutes les données en base. Les versions à DPE d'immeuble candidat ont un vrai DPE d'immeuble : `immeuble_entier` y reste vrai. Aucune empreinte ne bouge, aucune régénération n'est déclenchée.
- **Rapports versionnés** : les DPE d'immeuble et les appartements générés portent désormais `surface_immeuble_m2`, `nombre_appartements` ou `appartement_non_visite`. Ces champs ne sont posés que pour ces grains : un appartement individuel ou une maison garde sa forme exacte. Pour les adresses à DPE d'immeuble, la prochaine actualisation **demandée par le lecteur** produira une nouvelle version (l'empreinte du rapport change) ; c'est le comportement voulu d'une actualisation (FUT-13), jamais déclenché à la consultation.
- **Statistiques communales** (`getDpeSummaryForCommune`) : filtrées sur `type_batiment:(appartement OR maison)`, syntaxe vérifiée sur l'API (La Rochelle : 33 051 logements + 1 197 immeubles = 34 248). La route n'a pas d'appelant.

### 7.4 Procédure d'actualisation, si un comptage futur trouvait un cas

1. Relancer `node scripts/admin/fut74-compter-dpe-hors-logement.mjs` avant et après le déploiement.
2. Un dossier compté lit, dès le déploiement, la réserve et l'offre de nouvelle sélection ; son étiquette n'entre plus dans les faits, son artefact figé reste tel qu'il a été vendu.
3. Aucun geste automatique : la nouvelle sélection et l'actualisation restent des gestes du lecteur. Une actualisation pour son compte, s'il fallait la faire, passerait par la route d'actualisation existante, version par version, et serait décidée dossier par dossier par le porteur.

### 7.5 Tests

`npm test` sur `main` à jour (après #83 et #84) : **3 043 tests, 0 échec, 0 todo** ; fusion simulée avec #82 : 3 055, 0 échec. Les 5 `todo` de l'audit sont devenus des tests effectifs, vérifiés en échec sur le code d'avant puis en succès. `src/lib/dpe-grain.test.ts` compte 27 tests : grain des 13 méthodes, type prioritaire, type hors énumération, ambigus, jeu d'avant 2021, neuf, répartition, champ parasite ; non-régressions (attribution automatique, confort d'été FUT-20, statistiques) ; défauts 1 à 3 ; chaîne serveur, liste, compte replié, phrases inchangées sans immeuble, D6, D7, persistance, moteur (`runRules` : plus de « classe ce logement F » pour un immeuble, toujours pour un généré F), synthèse.

Tests existants ajustés, et pourquoi :
- `dpe-selection-vue.test.ts`, `logement-synthesis-cache.test.ts` : leurs fixtures combinaient le type « appartement » et la méthode « dpe immeuble collectif », que l'ADEME ne publie jamais ; elles portent désormais le type « immeuble » ;
- `logement-facts.test.ts` : la fixture n'avait pas de type ; elle en reçoit un, et un test ajouté vérifie qu'un snapshot sans grain ne donne plus son étiquette ;
- `fut20-chaleur-logement.test.ts`, `fut17-relecture-semantique.test.ts` : le nouveau libellé de la composition chaleur pour un appartement établi à partir de l'immeuble.

Banc de développement `/dev/dpe-selection` : six cas `fut74-*` ajoutés, rendus et relus sur le serveur de développement (`fut74-generes`, `fut74-generes-lots`, `fut74-individuels`, `fut74-immeuble-seul`, `fut74-ancien-choix`, `fut74-genere-retenu`). Aucun bouton « Retenir » ne porte un DPE d'immeuble. La saisie d'un numéro d'immeuble n'a pas été rendue en navigateur (elle exige un dossier authentifié) ; sa logique est couverte par `grainDpe` et la route.
