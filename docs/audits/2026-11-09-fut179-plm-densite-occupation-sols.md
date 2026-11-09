# FUT-179 : densité et occupation des sols de Paris, Lyon, Marseille et de leurs arrondissements (09/11/2026)

Base : `main` bab5eb49. Branche : `bonjourfuturee/fut-179-paris-lyon-marseille-completer-les`.
Règle tenue partout : **une donnée sur Paris entière ne devient jamais une donnée sur le 11e**, et l'inverse.

## 1. Verdict

- **Densité : corrigée, au grain attesté.** L'Insee publie la population et la superficie de chaque arrondissement
  et de chaque commune. La méthode d'ADEME (population municipale 2022 / superficie Insee), qui donne la densité
  de toutes les autres communes, est reproduite. Elle a été vérifiée sur 34 728 communes de l'index avant d'être appliquée.
  Territoire affiche désormais la densité de la commune entière pour 75056, 69123 et 13055, et celle de l'arrondissement pour 75101 à 13216.
- **Occupation des sols (OSO) : absence maintenue.** Aucune source légère ne la donne au bon grain. Le calcul se fait
  sur le raster OSO, qui n'est plus en cache. Il entre naturellement dans FUT-182 (recalcul OSO national), pour un coût marginal.
- **OCS GE (Mon Diagnostic Artificialisation) : non retenue pour la V1.** Le fichier n'existe qu'à la commune entière,
  ses millésimes s'étalent de 2016 à 2023, et sa définition (artificialisation au sens légal) n'est pas celle de l'OSO.
  Ce serait un indicateur réservé à trois villes, différent de celui de toutes les autres.
- **Index du comparateur (Où vivre) : inchangé, volontairement** (cf. § 6, option B).

## 2. Les lacunes, reproduites

### Dans l'index (`data/comparateur-index.json.gz`, 45 arrondissements contre 34 743 autres communes)

Ces champs sont nuls pour **les 45** arrondissements, alors qu'ils sont présents pour au moins 30 % des autres communes :

| Champ | Arrondissements | Autres communes | Producteur |
|---|---|---|---|
| `densite` | 0 % | 100 % | ADEME (Insee) |
| `nature.*` (score, composition OSO, rayon 15 km) | 0 % | 100 % | CESBIO, OSO 2023 |
| `rankBands.nature`, `rankBands.cadre_calme` | 0 % | 100 % | dérivés de `nature` et `densite` |
| `viv.pm25`, `viv.no2`, `viv.eloignement` | 0 % | ≥ 99,8 % | ADEME |
| `agri.*`, `pression_agricole` | 0 % | 31 à 99 % | ADEME |
| `hlm_pct`, `hlm_nb` | 0 % | 48 à 99,8 % | ADEME (RPLS) |
| `historiqueInondation` | 0 % | 100 % | CCR / ONRN |

L'index n'a aucune ligne pour 75056, 69123 et 13055 : FUT-43 les reconstitue par agrégation, champ par champ.

### Dans le snapshot Territoire (réel, sans modèle, `scripts/fut179/reproduire.mjs`)

| Fait | Paris / Lyon / Marseille, avant | Arrondissement (75111…), avant | Après |
|---|---|---|---|
| `place.density` | absent | absent | **Insee, au périmètre lu** |
| `density.category` | absent | absent | **dérivée** (« Commune dense », « Arrondissement dense », « Densité intermédiaire ») |
| `land.composition`, `land.natural_share`, `land.water_share`, `land.natural_share_15km` | absents | absents | absents (`missing`, jamais 0) |
| `land.forest_ademe`, `housing.vacancy_share`, `demography.ageing_65` | absents | absents | absents (hors lot, cf. § 7) |
| `place.position`, `place.distinctive_trait` (ville) | absents (FUT-43 : ne s'agrègent pas) | présents | inchangés |

Une absence est toujours un `null` au statut `missing`. Aucun zéro n'est écrit : les tests D7 le vérifient.

### Comment les surfaces traitent ces absences aujourd'hui

- **Carte d'identité** : la ligne « Densité » disparaissait, et la ligne « Occupation des sols » aussi (elle reste absente).
- **Cartes Territoire** : faute d'OSO, la carte « Espaces naturels » se replie sur « Taux de boisement » (ADEME). Elle
  s'affiche grisée, avec « — ». C'est une absence visible, mais pas expliquée (cf. § 6, option E).
- **Synthèse déterministe** : la phrase de densité et celle des sols manquaient. Paris se réduisait à la population.
- **Comparateur** : `deriveCategoriesFromEntry` traite `densite: null` d'un arrondissement comme « urbain dense »
  (`estArrondissementPLM`). `cadre_calme` et `nature` sont *non mesurés* : jamais promus ni pénalisés, conformément à la
  doctrine de couverture. `hard-constraints` laisse la taille de commune `unexamined` pour un arrondissement.
- **Dossiers de décision** : ils ne lisent pas `place.density`. Les dossiers existants ne sont pas touchés.

## 3. Les sources examinées

| Source | Producteur | Millésime | Maille | Couverture PLM | Codes | Intégration | Limites | Valeur pour le lecteur |
|---|---|---|---|---|---|---|---|---|
| Base du comparateur de territoires, mesure `SUP` | Insee | géographie 2026 (SUP 2023) | COM **et ARM** | 3 communes + 45 arrondissements | COG (`GEO_OBJECT` COM / ARM) | légère : CSV 193 Mo, lu en flux, 48 valeurs gardées | superficie totale (bois, parcs, massifs compris) | dénominateur officiel de la densité |
| Populations légales 2022, `PMUN` | Insee | RP 2022, géographie 01/01/2024 | commune, les **arrondissements à la place** des trois villes | 45 arrondissements (la ville = leur somme) | COG | légère : CSV 2 Mo | — | numérateur, **le même qu'ADEME** |
| ADEME `data_communes` (`densite_de_population_2022`) | ADEME (Insee) | 2022 | commune | **aucune** : ni ligne ville, ni densité d'arrondissement | COG | déjà intégrée | trou exact du ticket | — |
| OSO 2023 (`populate-nature.py`) | CESBIO / Theia | 2023 | raster 10 m, zonal par contour | absente : les contours `geo.api.gouv.fr` lus ne comprennent pas les arrondissements | contour par code | **lourde** : raster absent du cache, rasterio non installé | — | composition des terres, nature à 15 km |
| Mon Diagnostic Artificialisation, `artif-commune.csv` | Cerema / DGALN (OCS GE) | **2016 → 2023**, selon le département | **commune seulement** | 75056 (83,3 % en 2021), 69123 (84,7 % en 2020), 13055 (49,7 % en 2023) ; **aucun arrondissement** (vérifié sur les 34 931 lignes) | `commune_code` COG | légère : CSV 5,9 Mo | définition légale (loi Climat et résilience, seuils de surface) ≠ OSO satellitaire ; millésimes disparates | un taux communal d'artificialisation, sans équivalent ailleurs dans futur•e |
| Grille communale de densité Insee 2025 (FUT-180, FUT-184) | Insee | 2025 | commune | non vérifiée ici pour les arrondissements | COG | traitée par FUT-184 | — | typologie, pas un chiffre |

**OSO et OCS GE ne sont pas interchangeables.** L'OSO classe des pixels de 10 m vus par satellite (bâti, routes,
cultures, forêts…). L'OCS GE mesure l'artificialisation au sens du décret, avec des seuils de surface et une
nomenclature d'usage. Paris à 83,3 % d'artificialisation OCS GE ne dit pas « 83 % d'espaces urbanisés » au sens de la carte OSO.

## 4. Preuve de méthode (densité)

`scripts/fut179/densite-plm.mjs` refuse d'écrire si la méthode ne retrouve pas ADEME :

- Calcul : `PMUN 2022 / SUP` pour chaque commune de l'index qui a une densité ADEME. On le compare à `densite_de_population_2022`.
- Résultat sur 34 728 communes : écart médian **0,2 %**, p90 0,7 %, 95,5 % des communes à moins de 1 %. Les écarts
  restants sont des communes nouvelles (géographie 2024 face à 2026).
- Exemples : Toulouse 511 684 / 118,3 = 4 325,3 (ADEME 4 325,31) ; Nice 4 918 (ADEME 4 919).
- Contrôles de grain : la superficie de chaque ville égale la somme de celles de ses arrondissements (105,40 km² pour Paris,
  47,87 pour Lyon, 240,62 pour Marseille). La densité de la ville est un rapport de sommes, jamais une moyenne de densités.

| Périmètre | Population 2022 | Superficie | Densité |
|---|---|---|---|
| Paris (75056), commune entière | 2 113 705 | 105,40 km² | 20 054 |
| Paris 11e (75111) | 139 983 | 3,67 km² | 38 143 |
| Paris 16e (75116, bois de Boulogne compris) | 159 733 | 16,37 km² | 9 758 |
| Lyon (69123), commune entière | 520 774 | 47,87 km² | 10 879 |
| Lyon 1er (69381) | 29 040 | 1,51 km² | 19 232 |
| Marseille (13055), commune entière | 877 215 | 240,62 km² | 3 646 |
| Marseille 9e (13209, massif des Calanques compris) | 76 347 | 63,27 km² | 1 207 |
| Marseille 16e (13216) | 15 415 | 16,30 km² | 946 |

Empreintes des fichiers sources : population `bd3a4b80…` (CSV extrait de `ensemble.zip`, sha256 du zip `603df7b8…`) ;
superficie `f0a04a8c…` (CSV extrait de `comparateur_csv.zip`, zip `6d7fff2d…`). Copie durable :
`~/Documents/futuree-fut179/telechargements/`.

## 5. La correction

- `src/lib/territoire/plm-densite.generated.ts` : 48 périmètres (3 communes, 45 arrondissements), avec leur méthode, leurs sources et la validation.
- `src/lib/territoire/plm-densite.ts` (pur) : `densiteInseePLM(insee)` et **la seule décision**, `densiteInseeRetenue`. La densité Insee
  ne sert qu'à défaut de densité ADEME. Le registre et la provenance lisent cette même fonction, pour ne jamais diverger.
- `facts.ts` : `place.density` prend la valeur Insee à défaut. Sa **source** devient `INSEE / Populations légales 2022 ;
  superficie… / PMUN / SUP`, et ses **limites** disent le périmètre. Pour la ville : « Densité moyenne de toute la commune de Paris (2 113 705 habitants sur 105,4 km², parcs, bois et espaces non bâtis compris) : elle ne décrit aucun
  arrondissement en particulier ». Pour un arrondissement : « …de l'arrondissement… ; celle de Paris entière est différente ».
- `provenances.ts` : provenance Insee (sans ADEME comme diffuseur), avec la même limite.
- `territoire-snapshot.ts` : transmet `densiteInsee` du code lu (75056 ou 75111).
- `territory-identity.ts` : un arrondissement lit « Arrondissement dense », plus « Commune dense ». C'était un libellé
  latent tant que la densité d'arrondissement était nulle : la règle « un champ qui devient présent rend présent tout ce qui le cite » s'applique.
- Garde `fut147-non-regression` : les 25 lignes changées du registre sont figées dans `__fixtures__/fut179-lignes-admises.json`
  (multiensemble, avec contrôle des lignes orphelines). Aucune ne parle des feux.

Rendu réel (synthèse déterministe, `scripts/fut179/reproduire.mjs`) :
- « Paris, 2 133 111 habitants, au centre de son agglomération, est une commune dense (20 054 habitants au km²). »
- « Paris 11e Arrondissement, 142 583 habitants, arrondissement de Paris (ville-centre de son agglomération), est un
  arrondissement dense (38 143 habitants au km²). »
- « Marseille 9e Arrondissement, … a une densité intermédiaire (1 207 habitants au km²). »
- Toulouse : **empreinte identique** avant et après (`a3ef7edd…`).

## 6. Options non engagées, avec leur coût

| Option | Ce qu'elle apporte | Coût | Risque | Recommandation |
|---|---|---|---|---|
| **B. Densité dans l'index du comparateur** (45 arrondissements) | `cadre_calme` mesuré, catégories d'accueil | léger (une jointure, puis recalcul des `rankBands`) | **promotion trompeuse** : avec la densité moyenne, le cadre calme vaudrait 92/100 au 16e de Marseille (946 hab/km², L'Estaque, port et zone industrielle) et 86 au 9e (Calanques comprises). Ces deux arrondissements basculeraient aussi de « urbain dense » vers « rural / périurbain ». | **Pas avant la V1.** À reprendre avec une garde propre aux arrondissements |
| **C. OSO des arrondissements et des trois villes** | composition des terres, catégorie d'occupation des sols, nature à 15 km | marginal **dans FUT-182** (48 contours `geo.api.gouv.fr/communes?type=arrondissement-municipal` ajoutés au zonal). Seul : raster OSO 2023 de plusieurs Go et environnement rasterio | une composition de ville pour Paris = somme des pixels, pas une moyenne d'arrondissements | **L'inscrire dans FUT-182** |
| **D. OCS GE (MDA) en contexte communal** | un taux d'artificialisation légal, trois villes seulement | léger | confusion d'échelle pour un lecteur du 11e ; indicateur différent de toutes les autres communes ; millésimes disparates | **Non pour la V1.** Seulement comme fait national, si un jour on le veut (34 931 communes couvertes) |
| **E. Expliquer l'absence d'OSO** sur la carte grisée | « non mesuré pour Paris, Lyon et Marseille » au lieu de « — » | petit (une prop dans `QuartierClimatData`) | aucun | à faire si FUT-182 ne passe pas avant l'ouverture |

## 7. Limites restantes

- **Projection vers le modèle.** Pour un arrondissement, `commune.densite.categorie` vaut encore « Commune dense ». Le
  contrat de synthèse n'a pas été touché : le changer invaliderait tout le cache national. Le rôle transmis dit
  « arrondissement » et la consigne (FUT-176) le cadre, mais le modèle peut écrire « une commune dense » au lieu
  d'« un arrondissement dense ». Le chiffre reste juste ; le mot est imprécis. Une correction propre passe par une version de contrat.
- **Millésimes.** La densité porte sur 2022, la population affichée sur 2021. C'est déjà la convention nationale (Toulouse : 504 078 habitants affichés, densité calculée sur 511 684).
- **Moyenne sur toute la superficie.** Le 16e de Paris (bois de Boulogne), le 12e (bois de Vincennes) et le 9e de Marseille
  (Calanques) sont moins denses que leur bâti. La limite le dit, sans chiffrer la part non bâtie.
- **Vieillissement, vacance, boisement** restent absents pour les trois villes et leurs arrondissements (ADEME). La base
  du comparateur Insee les porte à la commune et à l'arrondissement : c'est un candidat direct au même traitement, hors de ce lot.

## 8. Impacts

- **Snapshots** : l'empreinte change pour 48 périmètres (3 villes, 45 arrondissements). Leur synthèse rédigée sera
  régénérée à la prochaine visite, soit au plus 48 appels modèle, à la visite seulement. Toutes les autres communes gardent la même empreinte.
- **Index, Où vivre, comparateur, dossiers** : inchangés. Aucune donnée distante ni migration.
- **Suite** (`--test-concurrency=1`, seule) : `main` 4 525 tests, tête 4 540 (+15, `fut179-plm-densite.test.ts`). Les deux
  ont les mêmes 5 échecs locaux connus (fut27, chemin avec « · »).

## 9. Reproduire

```
node scripts/fut179/densite-plm.mjs <comparateur.csv> <donnees_communes.csv>   # régénère la table (refuse si la méthode diverge)
node scripts/fut179/reproduire.mjs /tmp/fut179.json                             # snapshots réels, sans modèle
node --test src/lib/territoire/fut179-plm-densite.test.ts src/lib/territoire/plm-communal.test.ts src/lib/fut147-non-regression.test.ts
```
