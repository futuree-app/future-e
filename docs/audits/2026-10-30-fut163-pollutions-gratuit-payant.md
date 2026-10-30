# FUT-163 · Pollutions : ce que montre la page gratuite, ce que montrent les dossiers payants

30/10/2026 · audit sur `origin/main` 82cbc171 (production, FUT-152 fusionné) · lecture seule : aucun commit, aucune PR, aucune modification Linear. FUT-157 et FUT-149 non touchés (seul l'état du worktree FUT-157 a été regardé, sans modification).

## En une minute

- **Le dossier payant ne dit rien de faux sur l'air, les sols ou IREP.** Il en dit peu, mais ce peu est juste et bien borné : l'air de fond et les sites Seveso entrent dans la décision seulement quand le lecteur les a déclarés comme priorités.
- **Le défaut grave concerne l'eau, et il est dans le payant.** L'assistant du dossier Territoire (AskFuture, réservé aux acheteurs) lit encore l'ancien résumé eau potable que FUT-152 a corrigé sur la page gratuite. Ce résumé présente un seul réseau comme toute la commune, déclare « conforme » une eau qui ne respecte pas une référence de qualité (Marseille, 25/08/2026), dit « pas de relevé récent » d'une commune contrôlée deux fois par an, et lit le phosphore total sous le nom « nitrites ». **La page gratuite est aujourd'hui plus juste que le dossier payant sur l'eau.**
- **Un second défaut, hors pollution mais dans le même fichier, rend une fausse réassurance dans Territoire.** La carte « L'eau et les sols » ne peut jamais afficher un cours d'eau à sec : le champ qui porte l'assec n'est jamais demandé à Hub'Eau. Vérifié le 30/10 : à la commune 16016, la source dit « Assec » le 28/10, et la carte affiche « Pas de cours d'eau à sec ».
- **Deux promesses ne sont pas tenues.** La page gratuite annonce que « IREP, sites pollués, qualité de l'air, eau potable » entrent dans le choix d'une commune : c'est faux pour IREP et l'eau potable. Et les preuves « air » et « industrie » du dossier mènent vers le module Territoire, qui n'a aucune carte qui les montre.
- **Ce qu'il ne faut pas ajouter** : l'indice ATMO du jour, IREP, les décomptes de sites et sols à la commune, une « eau de votre logement ». Les sols au point d'adresse et Cartofriches sont déjà dans FUT-157.

## 1. Matrice de couverture, gratuit contre payant réellement visible

Légende des verdicts : **ajouter**, **clarifier**, **corriger** (le payant affiche ou transmet une information fausse), **conserver séparé** (reste sur la page gratuite), **écarter**.

### 1.1 IREP (rejets industriels déclarés)

| | Contenu |
|---|---|
| Source, millésime | Export officiel Géorisques 2025, index local `data/irep-registre.json` (1,4 Mo, 13 811 établissements) |
| Grain | Point déclaré de l'établissement ; recherche à 10 km du centre de la commune |
| Gratuit | Liste des établissements avec rejet chiffré (nom, distance, milieux, polluants), décompte des autres, limite « ne mesure pas l'exposition d'un logement voisin » (`src/components/PollutionLookup.tsx:126-185`) |
| Payant, collecté | Rien. L'appel a été débranché de Logement le 29/07 (`src/app/api/georisques-logement/route.ts:196-205`) |
| Payant, affiché | Rien sous ce nom. Le fait voisin et opposable, la **catégorie légale Seveso / IED / autorisation**, est lu à la commune dans l'index du comparateur (`expoIndustrielle`) |
| Rôle dans la décision | Critère `faible_exposition_industrielle` (Où vivre, palier « Sites industriels ») ; règle `territoire.sante-industrie` du dossier, seulement si la priorité est déclarée (`src/lib/decision/materiality-rules.ts:1111-1147`) ; récit « la proximité d'un site industriel » en synthèse comparateur |
| Fait manquant pertinent | Aucun démontré. Un rejet déclaré n'ouvre aucun geste de vérification que l'acheteur puisse faire |
| Risque | Doublon avec Seveso/IED ; transformer une proximité en danger |
| Verdict | **Conserver séparé.** Arbitrage NO GO de FUT-152 maintenu. **Clarifier** la promesse de la page gratuite (§2.3) |

### 1.2 Sites et sols (SIS, ex-BASOL, SUP, CASIAS)

| | Contenu |
|---|---|
| Source | API Géorisques v1 `/ssp/*`, consultée en direct ; Cartofriches (Cerema) côté Logement |
| Grain | Fiches rattachées à un code commune (gratuit) ; point ou parcelle possible par `latlon` |
| Gratuit | Quatre inventaires par commune, chacun avec son sens et ses états (disponible, partiel, absent, indisponible), CASIAS dit « activité passée, pas de pollution constatée » (`PollutionLookup.tsx:188-288`) |
| Payant, collecté | Logement : Cartofriches autour de l'adresse, avec l'état de pollution normalisé en six valeurs (`route.ts:143`, `src/lib/cartofriches-pollution.ts`). Où vivre : site ex-BASOL instruit le plus proche du chef-lieu, précalculé (`scripts/populate-heritage-industriel.py`, rayon 3 km) |
| Payant, affiché | Logement : **rien**. Cartofriches n'est lu par aucun composant ni aucune règle ; il n'apparaît que dans le bandeau des sources muettes quand il tombe en panne (`src/components/report/LogementModule.tsx:775`, `src/lib/logement-report-version.ts:95`). Où vivre : une phrase au passé (« une ancienne usine à gaz est recensée à proximité »), seulement si le lecteur a exprimé l'intention « héritage industriel » (`src/lib/comparateur-vie.ts:2039-2052`). Territoire, Autour : rien |
| Rôle dans la décision | Narratif hors score au comparateur ; aucun dans le dossier de décision |
| Fait manquant pertinent | **SIS / SUP / instruction intersectant l'adresse** : c'est le seul fait qui change ce que l'acheteur doit vérifier. Déjà instruit par **FUT-157** (en cours), qui couvre aussi le sort de Cartofriches |
| Risque | Décomptes communaux anxiogènes et sans geste (Paris : 8 248 fiches CASIAS) ; doubles comptes entre inventaires ; CASIAS lu comme pollution |
| Verdict | **Ajouter au point : FUT-157, sans l'élargir.** **Écarter** les décomptes communaux du payant. **Conserver séparé** la vue communale sur la page gratuite |

### 1.3 Qualité de l'air

| | Contenu |
|---|---|
| Sources | (a) ATMO France, indice du jour par commune, en direct ; (b) moyennes annuelles communales PM2,5 et NO₂ du jeu ADEME `data_communes`, figées dans l'index du comparateur |
| Grain | Commune dans les deux cas |
| Gratuit | Indice ATMO du jour ou de la veille, détail par polluant, organisme publiant ; la description dit déjà qu'il sert aux épisodes, moins à l'exposition chronique (`PollutionLookup.tsx:290-332`) |
| Payant, collecté | (b) dans l'index et dans le contexte AskFuture (`src/lib/ask/system-prompt.ts:126-130`) ; (a) jamais |
| Payant, affiché | Où vivre : palier « Air pur / Qualité de l'air moyenne / Air pollué » par rang national (`comparateur-vie.ts:1534`), critère `air_sain` (70 % PM2,5, 30 % NO₂, `comparateur-vie.ts:1377-1381`). Dossier : constat chiffré seulement si `air_sain` est déclaré ET si NO₂ ≥ 10 µg/m³ (OMS) ou PM2,5 ≥ 10 µg/m³ (UE 2030), avec la limite « moyenne communale, le NO₂ varie d'une rue à l'autre » (`materiality-rules.ts:975-1048`). **Territoire : aucune carte air** ; la puce de preuve « NO₂ 15,9 µg/m³ » renvoie vers `/rapport/quartier` (`materiality-rules.ts:71`), où rien ne la démontre. Pas d'ancre de preuve « air » dans `src/lib/decision/evidence-targets.ts` |
| Fait manquant pertinent | Aucun dans les données. Le millésime des moyennes ADEME n'est ni affiché ni documenté dans le schéma du jeu (vérifié le 30/10) |
| Risque | Confondre le jour et l'année ; un `satisfied` lu comme « air pur » (le code le sait et le dit en commentaire) |
| Verdict | **Conserver** le moteur tel quel (ne pas recréer). **Écarter** ATMO du payant. **Clarifier** la preuve orpheline (§2.3) |

### 1.4 Eau potable

| | Contenu |
|---|---|
| Sources | Hub'Eau « qualité de l'eau potable » (contrôle sanitaire des ARS). Deux implémentations : l'ancienne `src/lib/eaufrance.ts` et la nouvelle `src/lib/eau-potable.ts` + `src/lib/server/eau-potable.ts` (FUT-152) |
| Grain | Réseau de distribution (UDI). Une commune peut en avoir plusieurs (Paris 4, Metz 2, Marseille 16). Aucune géométrie publique nationale ne rattache une adresse à un réseau |
| Gratuit (nouvelle lib) | Chaque réseau, sa zone quand la source la nomme, son dernier prélèvement et sa date, la conclusion officielle de l'ARS, limites ET références de qualité ; cinq paramètres avec leur réseau et leur date ; « un prélèvement décrit l'eau à sa date » |
| Payant, collecté (ancienne lib) | `gatherCommuneEnrichment` appelle `getEaufranceSummary` (`src/lib/commune-enrichment.ts:52`) pour Territoire et AskFuture |
| Payant, affiché | **Écran Territoire : rien sur l'eau potable** ; seul `drought` (cours d'eau) entre au snapshot (`src/lib/server/territoire-snapshot.ts:103`). **AskFuture** (monté sur `/rapport/quartier`, réservé aux acheteurs) reçoit le bloc « Dernier prélèvement, conformité bactériologique / physico-chimique, nitrates, nitrites » (`src/lib/ask/system-prompt.ts:217-247`). Logement, Autour, Où vivre, dossier de décision : rien |
| Fait manquant pertinent | Une non-conformité réglementaire récente sur un réseau de la commune serait matérielle pour un foyer avec nourrisson ou femme enceinte (nitrates). Non démontré comme omission de lancement : voir §4 |
| Risque | **Réalisé dans l'assistant** (§2.1). Au-delà : présenter la mesure d'un réseau comme celle du robinet d'une adresse |
| Verdict | **Corriger** l'assistant avant lancement. **Écarter** toute « eau du logement ». Restitution dans Territoire : à reporter, sous condition (§4) |

## 2. Manques et défauts réels, avec preuves

### 2.1 L'assistant payant lit l'ancien résumé eau potable (gravité haute)

`getEaufranceSummary` (`src/lib/eaufrance.ts:84-121`) interroge `resultats_dis` par commune, fenêtre de six mois, 20 lignes, toutes UDI mélangées, puis :

1. prend la conformité de la **première ligne**, quel que soit son réseau ;
2. ne lit que les **limites** de qualité, jamais les références ni la conclusion de l'ARS ;
3. cherche les nitrites sous le code **1350**, qui est le phosphore total (Hub'Eau, vérifié le 30/10 : `1350 → « Phosphore total (exprimé en mg(P2O5)/L) »`, `1339 → « Nitrites (en NO2) »`) ;
4. rend `null` hors fenêtre de six mois, ce que le prompt traduit en « Pas de relevé eau potable récent disponible ».

Rejoué le 30/10 avec la requête exacte de l'ancienne lib :

| Commune | Ce que l'assistant reçoit | Ce que dit la source |
|---|---|---|
| Marseille (13055) | « Conformité physico-chimique : oui », prélèvement du 25/08 | Ce prélèvement est du seul réseau ST BARNABE, et il **ne respecte pas une référence de qualité** (`conformite_references_pc = N`). La commune a 16 réseaux |
| Paris (75056) | Prélèvement du 30/06, conforme | Réseau SUD OUEST seulement, sur 4 réseaux |
| L'Abergement-Clémenciat (01001) | « Pas de relevé eau potable récent disponible » | Réseau BDS ST DIDIER/CHALARONNE, dernier prélèvement 05/02/2026 |
| Metz (57463) | Nitrates 4,9 mg/L, conforme | Les 2 réseaux sont prélevés ensemble ; la conclusion ARS du 28/08 signale le carbone organique total, que l'ancienne lib tait |

Le défaut des nitrites n'apparaît que lorsque le phosphore figure parmi les 20 dernières lignes ; je ne l'ai pas observé sur ces quatre communes. Le code est faux, l'occurrence est rare.

Le prompt système affiche déjà « eau potable » parmi les domaines de l'assistant (`system-prompt.ts:23`) : un lecteur qui demande « l'eau du robinet est-elle bonne ? » reçoit une réponse fondée sur ces lignes.

### 2.2 La carte Territoire « L'eau et les sols » ne voit jamais un cours d'eau à sec (gravité haute, hors pollution)

`loadDrought` demande `fields=date_observation,libelle_observation,libelle_cours_eau` (`src/lib/eaufrance.ts:132`) puis lit `libelle_ecoulement` (`:150-151`). Le correctif du 25/07 a changé la lecture, pas la requête : le champ n'est jamais renvoyé, donc `status` vaut `null` et `isDry` vaut toujours `false`. Le test (`src/lib/eaufrance.test.ts`) vérifie la lecture d'une réponse fabriquée, jamais la requête.

Vérifié le 30/10 sur la commune 16016 : la requête du code renvoie `{libelle_cours_eau: "le Mas", date_observation: "2026-10-28"}` sans état ; la même requête avec `libelle_ecoulement` renvoie `"Assec"`. La carte rend « Pas de cours d'eau à sec » (`src/components/report/QuartierClimatData.tsx:551`), et AskFuture ne dit jamais « (assec) ».

Compatibilité historique : tous les snapshots Territoire déjà enregistrés portent ce `isDry: false`. Ils sont reconnaissables : `status` y vaut `null` alors que `lastObservationDate` est renseigné. C'est la marque exacte du défaut, utilisable pour afficher « état non vérifiable » sans tout recollecter.

### 2.3 Deux promesses que le produit ne tient pas (gravité moyenne)

1. **Page gratuite** (`src/app/(public)/agir/pollutions-invisibles/page.tsx:390`) : « IREP, sites pollués, qualité de l'air, eau potable : ces signaux entrent dans le choix d'une commune où vivre », avec un bouton vers `/ou-vivre`. Réalité : l'air oui ; les sites Seveso/IED oui (ce n'est pas IREP) ; les sites pollués seulement en récit, et sur demande ; l'eau potable et IREP **non**.
2. **Preuves orphelines du dossier** : les constats « air » et « industrie » portent une preuve qui mène vers `/rapport/quartier`. Le module Territoire n'a ni carte air ni carte industrie, et `evidence-targets.ts` n'a aucune clé pour ces phénomènes. Le lecteur qui vérifie la preuve ne retrouve pas ce qu'il vient de lire, soit le défaut que ce fichier a été créé pour éviter.

### 2.4 Données collectées sans être restituées

| Donnée | Où | État | Suite |
|---|---|---|---|
| Cartofriches autour de l'adresse | `georisques-logement/route.ts:143` | Chargé à chaque dossier, affiché nulle part, cité seulement quand il tombe en panne | Déjà dans FUT-157 (« l'afficher sous la même règle, ou cesser de le charger ») |
| `drinkingWater` de l'ancienne lib | `commune-enrichment.ts` | Lu seulement par AskFuture, faux (§2.1) | Lot 1 |
| `qualite_air.pm10`, `.o3` | `src/lib/logement-report-types.ts:90` | Typés, lus nulle part à l'écran | Rien à faire avant lancement (pas de seuil opposable retenu) |

## 3. Ce qui existe déjà et qu'il ne faut pas dupliquer

- **L'air chronique** : critère `air_sain`, règle `territoire.sante-air`, seuils officiels et absolus, limite de grain écrite. Ne pas recréer, ne pas y substituer ATMO.
- **L'industrie à risque** : catégorie légale Seveso/IED lue à la commune, critère et règle dédiés. IREP la doublerait sans geste nouveau.
- **L'héritage industriel au comparateur** : le site ex-BASOL instruit le plus proche, en récit au passé, sur demande.
- **Les sols au point d'adresse et Cartofriches** : FUT-157.
- **La lecture eau par réseau** : `src/lib/eau-potable.ts` est juste et testée. Toute restitution payante doit la réutiliser, jamais `eaufrance.ts`.

## 4. Classement : trois améliorations avant lancement

### 1. AskFuture lit l'eau par réseau (corriger)

- **Échelle** : commune, réseau par réseau.
- **Source** : Hub'Eau, via `getEauPotableCommune` (FUT-152).
- **Utilité** : l'acheteur d'un dossier Territoire qui interroge l'assistant sur l'eau reçoit la même vérité que la page gratuite (chaque réseau, sa date, la conclusion ARS, limites et références), au lieu d'un réseau présenté comme la commune.
- **Contenu** : remplacer `drinkingWater` dans `gatherCommuneEnrichment` par la lecture FUT-152 ; réécrire `formatEauBlock` réseau par réseau ; une consigne explicite dans le prompt : « ne jamais attribuer un réseau à une adresse ; si la commune a plusieurs réseaux, dire lesquels et renvoyer à la zone desservie » ; supprimer ensuite la partie eau potable de `eaufrance.ts`.
- **Limites** : un dernier prélèvement par réseau ne dit rien d'une tendance ; publication ARS avec environ deux mois de retard.
- **Complexité** : faible (une demi-journée à une journée, tests compris : Paris, Marseille, Metz, 01001, panne).
- **Coût Vercel** : 1 + n réseaux + 5 appels Hub'Eau par commune (Paris 10, Marseille 22), mis en cache une journée. Temps d'attente réseau, très peu de calcul : négligeable en tarification au CPU actif. Latence de la première question du jour sur une commune : environ +0,5 à 2 s, en parallèle des autres sources.
- **Alternative plus courte** : retirer simplement le bloc eau potable du prompt (une heure). L'assistant dirait alors qu'il n'a pas la donnée, ce qui vaut mieux qu'une donnée fausse.

### 2. La carte « L'eau et les sols » voit l'assec (corriger)

- **Échelle** : commune (station ONDE rattachée).
- **Source** : Hub'Eau écoulement (réseau ONDE de l'OFB).
- **Utilité** : la carte cesse de rassurer à tort ; un cours d'eau à sec observé dans la commune devient visible.
- **Contenu** : demander `libelle_ecoulement` ; un test qui vérifie la **requête** (le champ demandé est celui qui est lu) ; pour les snapshots existants, `status === null` avec une date d'observation ⇒ « état du cours d'eau non vérifiable », sans recollecte forcée.
- **Limites** : relevé ponctuel, à sa date ; une station par commune au mieux.
- **Complexité** : très faible.
- **Coût Vercel** : nul (même appel).
- Ce défaut sort du thème pollution, mais il est dans le fichier que le ticket demandait d'auditer, et il rend une fausse conclusion dans le payant. Je le signale plutôt que de le laisser en silence.

### 3. Les promesses et les preuves disent vrai (clarifier)

- **Échelle** : texte de la page gratuite ; lien de preuve du dossier.
- **Utilité** : le lecteur qui passe du gratuit au payant ne découvre pas qu'une promesse était fausse ; celui qui clique une preuve retrouve ce qu'il a lu.
- **Contenu** : (a) réécrire la phrase de `/agir/pollutions-invisibles:390` pour dire ce qui entre réellement dans Où vivre (air de fond, sites industriels classés, ancien site pollué sur demande), sans citer IREP ni l'eau potable. Texte à faire relire par l'Editorial Writer. (b) Pour les preuves air et industrie, deux options à arbitrer : un lien vers la source publique (Géorisques pour la catégorie Seveso), avec la valeur et le grain dans la puce ; ou une petite carte « santé environnementale » dans Territoire qui montre ce que le moteur lit déjà (PM2,5, NO₂, catégorie industrielle), **après** vérification du millésime ADEME.
- **Limites** : l'option carte ajoute un écran ; elle ne doit apparaître que sur des faits déjà calculés, sans nouveau seuil.
- **Complexité** : (a) très faible ; (b) faible pour le lien, moyenne pour la carte.
- **Coût Vercel** : nul.

## 5. À reporter après lancement

| Évolution | Pourquoi plus tard | Condition pour la lancer |
|---|---|---|
| Eau du robinet dans Territoire, réseau par réseau | Le dernier prélèvement seul n'est pas une information de décision ; le fait utile serait « au moins une non-conformité aux **limites** réglementaires sur 12 ou 24 mois, sur tel réseau ». C'est un fait dérivé, qui demande l'historique par réseau | Le porteur valide la convention (période, limites réglementaires seules ; le repère « vigilance » à 25 mg/L de nitrates est une convention futur•e, pas un seuil réglementaire, et se discute avant d'être codé) |
| Eau à l'adresse | Aucune preuve publique de rattachement adresse → réseau | Seul cas défendable : une commune à **un seul** réseau, où le rattachement est établi par construction (hors puits privé, à dire). Mesurer d'abord la part de ces communes |
| Millésime de l'air affiché | Non documenté dans le schéma ADEME | Retrouver la source primaire (probablement modélisation INERIS) avant toute carte air |
| Réseaux non résidentiels sur la page gratuite | Marseille liste 10 réseaux « Grand port maritime », sans intérêt pour un logement | Vérifier leur nature auprès de l'ARS avant de les filtrer |
| Nettoyage de `eaufrance.ts` | Après le lot 1, la partie eau potable devient du code mort | Avec le lot 1 |

**Écarté** : ATMO du jour dans le payant ; IREP dans Territoire, Autour ou Logement (réouverture possible sur un cas réel de geste concret, comme prévu par FUT-152) ; décomptes communaux de sites et sols dans le payant ; tout score composite « pollution ».

## 6. Tickets complémentaires proposés (à créer seulement après arbitrage)

1. **AskFuture : l'eau potable lue par réseau, jamais attribuée à une adresse.** Nécessité démontrée au §2.1 (quatre communes rejouées). Priorité haute, avant lancement.
2. **Territoire : l'assec des cours d'eau jamais demandé à Hub'Eau.** Nécessité démontrée au §2.2 (commune 16016, 28/10). Priorité haute, avant lancement ; inclut la règle pour les snapshots déjà enregistrés.
3. **Promesses et preuves de santé environnementale.** Nécessité démontrée au §2.3. Priorité moyenne ; la partie (a) peut passer seule.

Aucun ticket proposé pour IREP, l'air, les sols communaux ou l'eau dans Territoire : leur nécessité n'est pas démontrée à ce jour.

## 7. Recette attendue pour les lots 1 et 2

- Lot 1 : Paris (4 réseaux nommés, zones citées), Marseille (16 réseaux, référence non respectée dite), Metz (conclusion ARS reprise), 01001 (prélèvement de février affiché avec sa date, jamais « pas de relevé récent »), Hub'Eau en panne (« indisponible », jamais « aucun relevé »). Question test : « l'eau de mon futur logement rue X est-elle bonne ? » ⇒ l'assistant refuse d'attribuer un réseau à l'adresse.
- Lot 2 : 16016 affiche l'assec avec sa date ; une commune sans station ne dit rien ; un snapshot ancien affiche « non vérifiable » ; le test échoue si le champ demandé et le champ lu divergent.
