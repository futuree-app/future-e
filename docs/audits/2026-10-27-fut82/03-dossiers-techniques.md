# FUT-82 · 3. Dossiers techniques par famille

> Toutes les mesures citées sont dans `mesures/` et se rejouent avec les scripts de
> `scripts/research/fut82/` (commandes dans `mesures/README.md`). Deux échantillons distincts :
> **45 points de sonde** (33 adresses ciblées dont 3 en outre-mer, 12 communes tirées) pour voir ce que
> chaque source dit quand le cas existe ; **200 adresses de logements diagnostiqués** (DPE ADEME) dans
> 100 communes tirées au prorata de la population, pour mesurer la part de logements qu'une source
> « signale ». Aucun des deux n'est représentatif de la France : ce sont des ordres de grandeur.

---

## 1. Bruit aérien réglementaire : PEB et PGS ★ vague A

**Source primaire.** DGAC, couches « Plan d'Exposition au Bruit (PEB) » et « Plan de Gêne Sonore (PGS) »
diffusées sur la Géoplateforme (`data.geopf.fr/wms-v`, couches `dgac_peb_plan_wmsv`,
`dgac_pgs_plan_wmsv`) ; liste des arrêtés : WFS `dgac_peb_arrete_wfs` (**224 aérodromes** dotés d'un
PEB). Métadonnées CSW du PEB mises à jour le 16/12/2025. Attributs lus au point : zone (A, B, C, D pour
le PEB ; 1, 2, 3 pour le PGS), indices Lden, aérodrome (code OACI), date de l'arrêté, lien vers l'arrêté.

**Nature.** Réglementation (servitude d'urbanisme, code de l'urbanisme art. L112-3 et suivants), fondée
sur des **prévisions** de trafic à long terme. Ce n'est ni une mesure ni une modélisation du bruit
actuel.

**Effet juridique vérifié (Légifrance, version en vigueur au 27/10/2026).** Art. **L112-11** du code de
l'urbanisme (loi n° 2019-1428, en vigueur depuis le 01/06/2020) : pour une vente ou une location
d'habitation en zone de bruit d'un PEB, un document informant de la zone est joint au dossier de
diagnostic technique, annexé à la promesse ou à l'acte ; à défaut, l'acquéreur peut demander la
résolution du contrat ou une diminution du prix. Le PGS délimite les zones où les riverains peuvent
bénéficier d'une **aide à l'insonorisation** (résumé de la couche DGAC).

**Mesures.**

| | Résultat |
|---|---|
| Latence au point (WMS GetFeatureInfo) | médiane **90 ms**, max 120 ms (45 points) ; médiane 43 ms, p90 63 ms (200 points) |
| Disponibilité | 245 appels sur 245 en HTTP 200 |
| Part de logements en zone | **3,0 %** (6/200), dont **1,5 %** en zones A, B ou C |
| Cas ciblés | Goussainville : PEB **C** et PGS **3** de Roissy ; Villeneuve-le-Roi : PEB **B** et PGS **1-2** d'Orly ; Bouguenais : PEB **D** de Nantes |
| Adresses tirées en zone | Marignane, Écouen (×2), Pontoy (×2), Albi |
| Stabilité au voisinage | voir `04-contre-epreuves.md` : la zone change dans **1 à 3 directions sur 8 à 50-100 m** |

**Ce que futur•e sait déjà, et pourquoi ce n'est pas la même chose.** La mesure communale `calmeSonore`
désigne le **rail** comme source dominante à Villeneuve-le-Roi et à Goussainville, deux communes en
zone B et C ; à La Rochelle, elle désigne l'**aéroport** alors que l'adresse testée n'est dans aucune
zone de PEB. Le module Autour ne liste pas les aéroports. Le PEB apporte donc un fait que le produit ne
porte nulle part, au bon grain, avec un effet légal.

**Contre-exemples et limites.** Le PEB ne couvre que les aérodromes qui en ont un ; il date parfois
(Roissy : 2007 ; Orly : 2012) ; il ne dit rien du bruit routier ou ferroviaire ; une adresse en zone D
peut être peu gênée et une adresse hors zone peut être survolée. Un point près d'une limite peut
basculer de zone à 25-50 m : la loi retient alors la zone la plus exposée, et le dossier doit dire « en
limite ».

**Gain décisionnel.** Un fait réglementaire, rare (≈ 3 % des logements) mais **décisif quand il existe** :
il conditionne la constructibilité (zones A, B, C), la qualité acoustique attendue, l'aide à
l'insonorisation (PGS), et une pièce que le vendeur doit fournir. futur•e peut l'annoncer **avant la
visite** et dire quoi demander.

**Conditions d'intégration.** Lecture au point synchrone (≤ 150 ms), zone la plus exposée retenue,
« en limite » si la parcelle croise une autre zone, aucune conclusion sur le bruit vécu. Licence à
confirmer (couche diffusée sans restriction par la Géoplateforme ; les jeux PEB des DDT sont en
Licence Ouverte 2.0).

### Cartes de bruit stratégiques (Lden, Ln) : veille

Une seule CBS départementale (Ardennes, échéance 2022) est diffusée sur la Géoplateforme ; ailleurs, les
cartes vivent par département et par agglomération (data.gouv, geo-ide). À Charleville-Mézières, le point
testé n'est dans aucune zone de bruit des trois couches (route Lden, route Ln, fer Lden). Le diagnostic du
28/07 (« chantier de données, pas une API ») reste vrai. **Veille**, réévaluer si un agrégat national
apparaît.

---

## 2. Feu : zonage des obligations légales de débroussaillement (OLD) ★ vague A, et BDIFF (vague B)

### 2a. OLD

**Source primaire.** Base **DÉBROUSSAILLEMENT** (IGN pour le ministère de l'Agriculture), Licence Ouverte
2.0 (fiche data.gouv mise à jour le 08/09/2026), WFS `DEBROUSSAILLEMENT:debroussaillement` (projection
native EPSG:2154). 45 départements selon la fiche data.gouv (48 selon un résumé de la version 6.0 de la
documentation IGN, mai 2025 : écart à lever). Deux familles d'objets, déduites par comptage faute de documentation
accessible (la fiche IGN redirige vers cartes.gouv.fr sans la publier) :

| `zonage` | `diffusion` | Objets | Signification déduite |
|---|---|---|---|
| 1 | Non | 243 011 | massifs forestiers sources (bois, landes), non diffusés au Géoportail |
| 2 | Oui | 4 236 | **zone d'application publiée** (massifs et bande de 200 m) |

Attributs utiles : département, type de source (« Zonage local » préfectoral ou « Zonage IGN +
traitements locaux »), millésime des données sources (de **2008** à 2023 sur l'échantillon), **date de
l'arrêté préfectoral** (`dat_ap_old`, ex. 17/10/2025 en Gironde).

**Effet juridique.** Obligation de débroussailler autour des constructions (code forestier, art. L131-10
et L134-6 : en général 50 m, profondeur précisée par arrêté) ; depuis la loi n° 2023-580, information de
l'acquéreur et du locataire, **dès l'annonce depuis le 01/01/2025** et dans l'état des risques (sources
secondaires concordantes : notaires.fr, projet de décret soumis à consultation ; **le numéro exact du
décret d'application reste à vérifier sur Légifrance**).

**Mesures.**

| | Résultat |
|---|---|
| Latence au point (WFS) | médiane **42 ms**, p90 97 ms |
| Part de logements en zone | **10,0 %** (20/200), très régional : Digne, Les Pennes-Mirabeau, Fréjus, Nîmes, Aramon, Nyons, Saint-Denis-d'Oléron, Villenave-d'Ornon, Le Bugue… |
| Cas ciblés | La Teste-de-Buch, Landiras : en zone ; Agel (Hérault), Vérignon (Var), Serres-Gaston (Landes) : en zone |
| Contre-exemple | **Gonfaron** : la commune a brûlé sur 6 832 ha en 2021 (BDIFF), le bourg testé est **hors** zone |
| Stabilité | stable à 25-50 m sur les trois points testés ; La Teste change dans 3 directions sur 8 à 100 m |

**Ce que futur•e sait déjà.** Le danger météorologique projeté (DRIAS) et le risque « Feu de forêt »
déclaré pour la commune (GASPAR) ; une composition « exposition au danger d'incendie » dont le geste
mentionne déjà le débroussaillement **sans savoir si l'adresse y est soumise**
(`decision/climat-facts.ts`).

**Gain décisionnel.** Transforme une mention générique en fait de l'adresse, avec une charge concrète
(entretien annuel, coût, bande qui peut déborder chez un voisin, contrôle et amende) et une pièce que le
vendeur doit fournir. Compose naturellement avec le feu déjà lu (Projet × Territoire × Logement).

**Limites.** Zonage **informatif** : seuls l'arrêté et le code font foi ; hachures (secteurs imprécis)
non distinguables par attribut sur le WFS ; départements hors liste = « pas de zonage publié », pas
« aucune obligation » ; millésime des données sources parfois ancien.

### 2b. BDIFF (feux de forêt observés)

**Source primaire.** Base de données des incendies de forêt en France (ministère de l'Agriculture, IGN),
`bdiff.agriculture.gouv.fr`. Export CSV par recherche (formulaire GET + session), une année par requête.

**Mesures (2006-2025, feux de forêt « type F », 20 exports).** 52 811 feux. Communes avec au moins un
feu recensé : **9 675** ; avec un feu de plus d'1 ha : **5 383** ; de plus de 10 ha : **1 459**. Pondéré
par la population : 37,6 % des habitants vivent dans une commune avec au moins un feu, 20,8 % avec un feu
de plus d'1 ha, 7,0 % de plus de 10 ha. Surfaces « mesurées » : 3 508 feux sur 52 811 ; nature (cause)
renseignée : 27 191 ; bâtiments touchés ou décès : 63.

**Pièges relevés.**
1. **Grain commune seulement** (code INSEE) : ni point, ni contour. Aucun feu ne se rattache à une adresse.
2. **Deux périmètres** : sans filtre de date explicite, l'export 2025 compte **21 141** feux (tous feux de
   végétation) ; avec le filtre, **2 541** (forêt seulement, « Type de feu : F »). Confondre les deux
   multiplie par huit.
3. **Marseille** est codée **13055** (217 feux, dont 56 de plus d'1 ha) : la lecture par arrondissement
   rend « aucun feu ». Même piège que FUT-60 pour GASPAR.
4. **Chaîne de certificats incomplète** côté serveur : un appel Node échoue (« unable to verify the
   first certificate »).
5. **Licence contradictoire** : data.gouv déclare la Licence Ouverte 2.0 ; les mentions légales jointes
   à **chaque export** excluent « toutes diffusions ou utilisations à des fins commerciales ». futur•e
   vend des dossiers. **Bloquant tant que le producteur n'a pas tranché.**

**Complémentarité avec l'existant.** Parmi les communes au danger projeté **bas** (IFM, tiers inférieur),
1 198 ont pourtant connu un feu de plus d'1 ha ; parmi celles au danger **haut**, 7 730 n'en ont connu
aucun. La mémoire observée ne double donc pas la projection : elle la nuance. Mais au grain commune, elle
ne dit rien d'une adresse (Gonfaron).

**Verdict.** Vague B, sous condition : licence écrite du producteur, puis fait **communal** daté
(« X feux de plus d'1 ha depuis 2006, le plus étendu en AAAA ») composé avec l'OLD à l'adresse.

---

## 3. Remontées de nappe et piézométrie : vague B, conditionnée au Projet

**Source primaire.** BRGM, carte nationale de sensibilité aux remontées de nappe, servie par Géorisques
(`mapsref.brgm.fr/wxs/georisques/risques`, couche `REMNAPPE`, WFS `ms:REMNAPPE`). Attributs : classe
(`gridcode` **1** débordement de nappe, **2** inondation de cave, **0** ni l'un ni l'autre), fiabilité
totale, fiabilité du MNT, fiabilité des données souterraines. Polygones à maille d'environ 250 m.
Masques (EAIP, entités imperméables BDLISA, étude en cours) non interrogeables. Métropole seulement.

**Trois pièges techniques, mesurés.**
1. La lecture WMS « au point » ne répond **qu'à petite échelle** : à moins de ±0,01° de fenêtre, elle rend
   « aucun résultat » partout ; à l'échelle où elle répond, la tolérance de clic ramène **plusieurs
   polygones voisins de classes différentes** dont les emprises contiennent toutes le point. Seule la
   lecture vectorielle (WFS) avec un vrai test point-dans-polygone donne une classe univoque.
2. Ajouter les masques à la requête la fait échouer **avec un HTTP 200** dont le corps est une
   exception.
3. Le rapport Géorisques au point (`resultats_rapport_risque`) n'a répondu qu'à **26 appels sur 45**
   (connexions coupées), médiane 3,3 s.

**Règle de lecture officielle, retrouvée.** Sur les 25 points où les deux sources ont répondu, la
correspondance est **parfaite** :

| Carte BRGM au point | Rapport Géorisques à l'adresse |
|---|---|
| « sujet » (1 ou 2), fiabilité **forte ou moyenne** | « Risque Existant » (9/9) |
| « sujet », fiabilité **faible** | « Risque **Inconnu** » (7/7) |
| « ni l'un ni l'autre » (0) | « Risque non Connu » (9/9) |

Géorisques lui-même refuse donc de conclure en fiabilité faible. Toute restitution doit reprendre cette
règle.

**Discrimination (200 logements).** Classés « sujets » : **60 %** (28 % débordement, 32 % cave) ; en
fiabilité moyenne ou forte : **39 %** ; débordement en fiabilité forte : **7 %**. Outre-mer : non couvert.
La carte **ne trie pas** à l'échelle du lecteur moyen (comparable à l'inondation « universelle » écartée
le 28/07).

**Piézométrie (Hub'Eau).** Stations nombreuses mais souvent historiques : à Paris, 188 stations à moins de
10 km et **aucune active à moins de 5 km** ; la plus proche date de 1972. Médiane de la station active la
plus proche : plusieurs kilomètres. Un niveau mesuré à 5 km dans une autre nappe n'est pas attribuable à
une cave. **Écartée** pour l'adresse ; veille sur les bulletins de situation hydrogéologique (BRGM) pour un
contexte saisonnier.

**Gain décisionnel.** Réel **seulement si le Projet ou le bien comporte un sous-sol ou une cave** (maison
de plain-pied sur dalle : sans objet). D'où la recommandation : pas de carte systématique ; une lecture
conditionnelle, en fiabilité moyenne ou forte, quand le lecteur déclare un sous-sol (qualification ou
Projet).

---

## 4. IREP (cas obligatoire)

**Où l'IREP vit réellement.** `src/lib/irep.ts` interroge le jeu ADEME `085ipnlpj9awm78hikh1nakj`
(« data_risk_IREP », **millésime 2019**, **1 495** lignes, champs : nom, coordonnées, `nombre_polluants`,
`milieu_emission`, `top`, `others`). Appelants : `/api/irep` (aucun appelant, route orpheline) et
`/api/proxy/irep` → `PollutionLookup` sur `/agir/pollutions-invisibles` (page publique), interrogé
depuis le **centre de la commune** dans un rayon de **10 km**. Débranché du dossier le 29/07/2026 (motif
écrit dans la route : fetché, transporté, lu par aucun composant).

**Le registre officiel.** Géorisques publie le registre complet, annuel, au format CSV
(`files.georisques.fr/irep/2024.zip`, 7,5 Mo, mis à jour le 16/09/2026, millésimes 2019 à 2024).

| | Extrait ADEME lu par futur•e | Registre officiel 2024 |
|---|---|---|
| Millésime | 2019 | **2024** |
| Établissements | 1 495 | **13 507** (coordonnées WGS84 pour tous) |
| Détail polluant par polluant | champ texte `top` (quelques polluants) | **63 935 lignes** (milieu, polluant, quantité kg/an) |
| Établissements avec au moins un rejet dans l'air chiffré | non calculable | **2 186** |

**Le détail polluant par polluant existe, et il déçoit pour une décision résidentielle.**
- **89 %** des lignes d'émission sont « < seuil » (56 755 sur 63 935) : sous le seuil de déclaration, la
  quantité n'est pas publiée.
- Les rejets dans l'air les plus déclarés sont du **CO₂** (866 établissements), de l'**ammoniac** (695 :
  élevages, **1 989** établissements d'élevage dans le registre), des COVNM, des HFC, du méthane. Les
  polluants de santé de proximité (NOx 162, SOx 60, benzène 39, métaux) sont minoritaires.
- Les quantités ne sont **pas comparables entre polluants** (un kilo de dioxine et un kilo de CO₂) : un
  classement par masse met le CO₂ d'une chaufferie en tête (Lyon Gerland : « Métropole de Lyon, 237 000 t
  de CO₂ »), ce qui n'informe pas sur l'air respiré.
- **984** établissements partagent exactement les coordonnées d'un autre : géocodage approximatif pour
  une part.

**Ce que l'outil public affiche aujourd'hui.** Autour des 41 adresses de l'échantillon (5 km), l'extrait
2019 trouve souvent **zéro** établissement là où le registre 2024 en compte plusieurs (Grenoble 0 contre
19, Villeneuve-le-Roi 0 contre 26, Metz 0 contre 13). La page publique, elle, interroge l'extrait à
**10 km du centre de la commune** ; rejoué exactement : **Metz 0** (registre 2024 dans le même rayon :
**25** établissements, dont 3 avec des rejets dans l'air chiffrés), **Montlouis-sur-Loire 0** (23),
**Abbeville 0** (7), **Saint-Amand-Montrond 0** (6), **Guéret 0** (5) ; Grenoble 4 (registre : 45). Sur
les 38 communes métropolitaines de l'échantillon, la page rend zéro pour **20**, dont **17** où le
registre officiel compte au moins un établissement déclarant dans le même rayon
(`mesures/irep-2024.json`, `pagePubliqueRejouee`).
Quand l'extrait rend zéro, `PollutionLookup` affiche : « Aucune installation industrielle classée ICPE
recensée dans un rayon de 10 km autour de cette commune selon les données ADEME. » La phrase est
doublement fausse (IREP n'est pas l'inventaire des ICPE ; l'extrait est incomplet). **Dette hors
périmètre**, consignée au journal d'arbitrage.

**Le détail apporterait-il plus que la présence de sites ?** Rarement, et au prix d'un risque de lecture
élevé : futur•e lit déjà ICPE et Seveso (classe légale, gravité), et la qualité de l'air de fond. Le
registre dit ce qu'un site **déclare émettre**, pas ce qu'un riverain **respire**. Seule exception
défendable : nommer, pour un site déjà signalé au voisinage, la **nature** de ses rejets dans l'air
au-dessus du seuil (ex. Feyzin : raffinerie TotalEnergies à 719 m, SOx 1 980 t/an, NOx 1 140 t/an), sans
quantité comparée ni jugement sanitaire.

**Verdict.** **Ne pas réactiver** l'appel dans le dossier. Corriger l'outil public (source officielle ou
retrait de la phrase de vide). Garder en **veille** un usage « nature des rejets d'un site déjà signalé »
pour la refonte Autour.

---

## 5. Espaces naturels protégés (Patrinat / INPN) : vague B

**Source primaire.** Couches Patrinat (MNHN/OFB) sur la Géoplateforme : SIC et ZPS (Natura 2000), parcs
nationaux (cœur, aire d'adhésion), PNR, RNN, RNR, APB, réserves biologiques, Ramsar, CEN, ZNIEFF 1 et 2.
WFS, projection native **EPSG:3857** : un filtre écrit en degrés rend « zéro site » sans erreur (vérifié
sur la forêt de Fontainebleau, Natura 2000).

**Mesures.** Latence médiane 39 ms par couche (12 couches = 12 appels). Part des logements **dans** un
périmètre : Natura 2000 **0 %**, parc national 0 %, PNR **8 %**, ZNIEFF 3 %. Cas : Saintes-Maries-de-la-
Mer (Natura SIC et ZPS, PNR, Ramsar, ZNIEFF 2), Agel (Natura « Causses du Minervois »), communes rurales
en PNR (Verdon, Scarpe-Escaut, Marais du Cotentin).

**Lecture.** Les protections fortes concernent rarement le logement lui-même ; leur valeur résidentielle
est surtout **de voisinage** (cadre de vie) et, pour un **terrain** ou des **travaux**, réglementaire
(cœur de parc national, APB, évaluation d'incidences Natura 2000 pour certains projets). Distinguer
strictement : statut (réglementaire), inventaire (ZNIEFF : aucune protection), couverture naturelle
réelle (OSO, déjà lue), biodiversité observée (non mesurée), accès au public (non garanti).

**Verdict.** Vague B : un fait de voisinage (« site Natura 2000 à X m ») composé avec le critère `nature`
et un fait réglementaire à la parcelle pour le cœur de parc national et les APB (à coordonner avec
FUT-81). Jamais « terrain protégé » sur une intersection marginale.

---

## 6. Réseaux de chaleur (France Chaleur Urbaine) : vague B

**Source primaire.** API France Chaleur Urbaine (ministère de la Transition écologique), Licence Ouverte,
schéma OpenAPI `france-chaleur-urbaine.beta.gouv.fr/openapi-schema.yaml`. `GET /api/v1/eligibility?lat&lon`.
Selon la documentation : `isEligible` vrai si le réseau le plus proche est à moins de **100 m à Paris,
200 m ailleurs**, seuils « volontairement élevés », « le gestionnaire du réseau sera le seul à même
d'évaluer la faisabilité du raccordement » ; `inPDP` : périmètre de développement prioritaire d'un réseau
classé, **obligation de raccordement pour certains bâtiments** ; taux d'EnR&R et contenu CO₂ du réseau.

**Mesures.** Latence médiane **28-65 ms**, 245/245 réponses. Logements « éligibles » : **21,5 %** ; dans un
PDP : **11 %**. Exemples : Grenoble centre à 72 m (80,9 % d'EnR&R), Metz à 8 m (PDP), Paris à 0 m (PDP),
La Rochelle centre à 501 m (non éligible).

**Gain décisionnel.** Pour une rénovation de chauffage (passoire, chaudière fioul ou gaz à remplacer), un
réseau voisin ouvre une option que le DPE ne dit pas ; en immeuble, savoir si la copropriété est déjà
raccordée change la facture et les travaux. **Composition** naturelle avec le DPE (FUT-143) et l'audit.

**Limites.** Proximité n'est pas raccordabilité ; `distance` peut être nulle (« null ») quand le réseau
est connu sans tracé ; données déclaratives des gestionnaires.

---

## 7. Lignes électriques et antennes : veille

**Lignes.** BD TOPO `ligne_electrique` (**14 497** lignes, source « RTE 2024 », tension, précision
planimétrique 2,5 m) : seulement le **transport** (63 à 400 kV) ; la distribution Enedis (HTA, BT) n'y est
pas. Logements à moins de 100 m : **1 %** ; à moins de 300 m : 3 %. Cas : Fos-sur-Mer 225 kV à 71 m,
Bouguenais 225 kV à 254 m. La servitude I4 (GPU) dit l'emprise légale, pas l'exposition. L'interprétation
sanitaire des champs à très basse fréquence est incertaine (association statistique discutée pour de
très hautes tensions et de très faibles distances) : un dossier qui l'évoquerait ferait peur sans
pouvoir conclure. **Veille** ; au mieux, un fait de paysage dans Autour, au même titre que les
infrastructures de transport, sans mot sanitaire.

**Antennes (ANFR).** Portail `data.anfr.fr` **en maintenance** le 27/10/2026 (HTTP 503) ; fichiers
mensuels en Licence Ouverte sur data.gouv (supports, antennes, émetteurs : 66 Mo, octobre 2026) et
mesures d'exposition ponctuelles. La présence d'une antenne n'est pas une exposition ; les mesures sont
rares et ponctuelles. **Écartée** (risque d'assertion trompeuse supérieur à la valeur).

---

## 8. Solaire : vague C (profil « rénovation / photovoltaïque »)

**PVGIS 5.3 (JRC).** Production annuelle d'1 kWc à orientation optimale, base de rayonnement
**SARAH-3** (y compris outre-mer). Mesuré : **1 113** kWh/kWc (Metz, Ploubazlanec) à **1 602** (Marseille),
1 539 à Saint-Denis de La Réunion. Latence médiane 0,9 s, jusqu'à 4 s : appel **différé**, jamais
synchrone.

**Potentiel solaire du bâti (Cerema, « méthode simplifiée »).** Couche `POTENTIEL.SOLAIRE.BATIMENT`
(**49 053 505** bâtiments BD TOPO, puissance estimée, bâtiment présumé public). Méthode uniforme pour la
planification des zones d'accélération des énergies renouvelables, sans ombrage fin : impropre à dire ce
qu'un toit produira. Le rattachement au bâtiment de l'adresse est **ambigu** au point BAN (2 à 4 bâtiments
à moins de 15 m dans la plupart des cas) ; il deviendrait sûr via le lien RNB ↔ BD TOPO (FUT-80).

**Verdict.** Vague C : PVGIS en ordre de grandeur pour un Projet « panneaux solaires », jamais un devis ;
le potentiel du bâti seulement après rattachement RNB et avec la mention « estimation simplifiée ».

---

## 9. Connectivité (ARCEP) : vague C (profil « télétravail »)

**Sources.** « Ma connexion internet » (Licence Ouverte 2.0, trimestriel, données au 30/06/2026) : base
immeubles et table d'éligibilité par technologie et opérateur ; jeu « déploiements » (immeubles :
**835 Mo** compressés au T2 2026). **Pas d'API publique** documentée : il faudrait importer et indexer un
fichier national chaque trimestre.

**Lecture.** Éligibilité déclarée par les opérateurs ≠ débit réel ; une carte de couverture mobile ≠
qualité dans le logement. Moat faible (présente chez cinq concurrents). Valeur réelle pour un Projet
télétravail en zone rurale. **Vague C**, conditionnée à un profil télétravail déclaré ; aucune donnée n'a
été lue à l'adresse dans cet audit (volume), le scénario n'est donc pas démontré.

---

## 10. Autres candidates

| Candidate | Constat mesuré | Verdict |
|---|---|---|
| **SISPEA** (prix et service de l'eau) | Extractions annuelles 7z (dernière : 2024), grain service d'eau ; pas d'API | Veille : intéresse le budget, peu la décision |
| **AZI / EAIP** | AZI listés par commune via l'API Géorisques ; EAIP en WMS (masque de la carte nappes) | Écartée : redondante avec la lecture inondation FUT-127/129 |
| **Annuaire de l'éducation** | Licence Ouverte, mis à jour le 25/10/2026 | Veille : la BPE couvre la présence ; secteur public/privé utile mais secondaire |
| **IPS des collèges** | Jeu 2023+ mis à jour le 01/09/2026 | Écartée (décision éditoriale du 09/07 confirmée : classement social des familles) |
| **SSMSI** (délinquance enregistrée) | Base communale 2016-2025 (09/07/2026) ; **48 %** des couples commune × indicateur **non diffusés** en 2025 (secret statistique) ; faits enregistrés, non vécus | Écartée : grain, biais de plainte, stigmatisation |
| **Fiscalité locale** | Taux votés (data.economie, 21/05/2026) | Écartée : le taux ne donne pas le montant d'un bien (base locative) |
| **LCZ** (Cerema) | 93 territoires de plus de 50 000 habitants (Licence Ouverte, juillet 2026), mais la couche Géoplateforme ne répond qu'à Toulouse | Veille : confort d'été, déjà couvert par l'ICU sur 596 communes |
| **IRVE** | 222 018 points de charge (WFS, 30/09/2026) | Écartée : faible effet décisionnel |
| **Pollution lumineuse** | Aucune source nationale officielle (jeux régionaux : Grand Paris, Occitanie 2019) | Écartée |
| **ARIA** (accidents industriels) | Non sondée en détail | Veille |
