# Nature / caractère naturel — conception (avant toute implémentation)

Chantier déclenché par un angle mort identifié dans
[DONNEES_CANDIDATES_CEREMA.md](DONNEES_CANDIDATES_CEREMA.md) : l'**accès à la nature
(le positif)** est invisible dans futur•e. L'audit sémantique l'avait déjà flaggé
(« nature » = famille C, donnée absente). On fige d'abord le cadre, les sources et
les arbitrages. **Aucune implémentation, aucune acquisition, aucun code avant
arbitrage produit.** Même process que le logement.

Date : 2026-06-02. Esprit des autres notes
([LOGEMENT_TERRITORIAL.md](LOGEMENT_TERRITORIAL.md),
[PRESSION_CLIMATIQUE_ECONOMIE.md](PRESSION_CLIMATIQUE_ECONOMIE.md)) : rigueur,
sources, honnêteté sur les trous.

## DOCTRINE V1 FIGÉE (2026-06-02)

Figée après validation sur données réelles CLC 2018 puis **OSO 2023** (calcul zonal
par commune sur un panel emblématique). Cette section fait foi ; les sections
suivantes gardent le raisonnement et l'historique.

### Décisions verrouillées

- **Source : OSO 2023** (CESBIO/Théia, raster 10 m). Gain réel prouvé sur CLC :
  récence, et finesse 10 m qui rattrape le bocage (Vire : 11 % de forêt en OSO vs
  2 % en CLC, les petits bois des haies invisibles à 25 ha).
- **Maille : « nature à proximité » (rayon ≈ 15 km, pondéré surface)**, pas la
  commune administrative. Grenoble : 7 % (CLC) / 17 % (OSO) intra-commune → ~55 % en
  rayon. Jumeau du relief.
- **Définition élargie = « perçu comme naturel »** = naturel strict + **prairies**.
  Couvert naturel/semi-naturel : forêts, pelouses, landes, surfaces minérales
  naturelles, dunes/plages, glaciers, eaux + **prairies extensives/pastorales**.
- **Inclus : prairies.** Décisif : l'Aubrac tombe à 11 % en strict OSO (classé
  « prairies »), 100 % en élargi. Un territoire emblématiquement naturel ne doit pas
  dépendre du caprice de classification pelouse/prairie → on inclut les prairies.
- **Exclus : grandes cultures intensives** (la Beauce reste à ~4 %, on ne réintroduit
  pas l'agriculture intensive), **vignes**, **vergers**.
- **Vignes/vergers exclus (choix documenté, réversible).** Les chiffres l'imposent :
  inclure les vignes ferait passer Meursault (village 100 % viticole) de 18 % à 65 %
  « naturel ». Or « proche de la nature » ≠ monoculture viticole. Distinction
  **nature ≠ paysage** : un vignoble peut être magnifique et patrimonial sans être
  « naturel » au sens recherché. À ré-ouvrir si des tests utilisateurs montrent un
  décalage de perception.
- **Critère SCORÉ opt-in** (pesé seulement si l'utilisateur formule la nature),
  distinct de `cadre_calme` et `faible_pression_agricole`. Glose visible obligatoire.

### Limite assumée : « naturel » vs « peu artificialisé »

La métrique vaut ≈ (1 − artificialisé − cultures intensives − vignes/vergers). Elle
mesure donc un **caractère naturel / paysage peu transformé**, PAS la wilderness ni
la biodiversité. Cas qu'elle raconte mal, actés :
- **Prairies intensives** : l'élevage industriel sur ray-grass (Bretagne/Normandie
  laitière) lit « naturel ». Coût direct de l'inclusion des prairies (nécessaire pour
  l'Aubrac) ; OSO ne sépare pas extensif/intensif ; `faible_pression_agricole` (IFT)
  ne le rattrape pas (l'herbe utilise peu de pesticides). **Principal angle mort.**
- **Forêt = aussi les plantations** (pin des Landes en monoculture lit « très
  naturel »). Forêt ≠ biodiversité.
- **Eau = aussi retenues/gravières ; minéral = aussi carrières.** Mineur (faibles
  surfaces).
- **Linéaires sous-pondérés** : une commune dont l'attrait est une rivière/un
  littoral (trait fin) est sous-classée ; le rayon atténue, pas totalement.

**Conséquence de wording (règle stricte)** : la glose et la synthèse disent
« forêts, prairies et milieux naturels autour », **jamais « biodiversité »,
« sauvage » ni « préservé »** (non mesurés). On décrit un paysage perçu comme
naturel, on ne certifie pas une qualité écologique.

### Reste à faire

Conception du **pipeline national OSO** (précalcul du caractère naturel élargi +
rayon → champ `nature` de l'index ; critère scoré opt-in + glose), dans la discipline
des chantiers relief/logement. Mapping des classes laissé lisible et ajustable
(vignes/vergers en exclusion par défaut, réversible).

## Ce qui distingue ce chantier du logement

Le logement est resté **narratif non scoré** parce qu'un prix bas n'est pas
« mieux » : scorer aurait imposé un jugement de valeur universel. **La nature est
différente** : quand un utilisateur dit « je veux du vert / la campagne / proche de
la nature », ranker les communes par couvert naturel **répond exactement à son
souhait formulé**, sans jugement imposé ni biais social. La nature est donc
**candidate légitime à un critère SCORÉ opt-in**, pesé seulement quand l'utilisateur
l'exprime (comme le climat, le calme, l'emploi). C'est l'arbitrage central du doc.

Ce serait le **premier critère bâti spécifiquement pour combler un trou sémantique**
connu.

## Le mot « nature » est polysémique (le cœur à trancher)

Quand l'utilisateur dit « nature », il peut vouloir dire des choses différentes :

| Sens | Ce que ça veut dire | Mesurable ? |
|---|---|---|
| **Couvert végétal / forêt** | « du vert », des arbres, des bois autour | **Oui** (occupation du sol) |
| **Campagne (vs ville)** | espaces non urbains, champs, prairies | partiellement (recoupe densité = `cadre_calme`) |
| **Espaces naturels préservés** | parcs, réserves, biodiversité protégée | partiellement (aires protégées, V2) |
| **Accès / usage** | pouvoir s'y promener, sentiers, rivières baignables | **Non** (présence ≠ accès) |
| **Eau / montagne** | littoral, lacs, relief | déjà couvert (`distance_cote`, relief) |

**Recommandation de définition V1 (révisée 2026-06-02)** : « nature » = **caractère
naturel du territoire** = part en **couverts naturels ET semi-naturels**, pas le seul
couvert forestier. La première version (« forêts + prairies ») était trop forestière :
beaucoup de territoires vécus comme très naturels le sont sans être boisés.

Périmètre élargi (OSO le permet, sa nomenclature distingue ces milieux) :
- forêts (feuillus, conifères) ;
- milieux ouverts semi-naturels : landes, pelouses, **garrigues**, maquis, causses ;
- **zones humides et marais** (intérieurs et maritimes : Camargue, Marais poitevin,
  Brière) ;
- **dunes, plages, rochers**, végétation clairsemée ;
- **eaux naturelles** (rivières, lacs, étangs) ;
- prairies / pelouses pastorales semi-naturelles (vallées pastorales).

En une phrase : **≈ 1 − artificialisé − cultures intensives**. On exclut le bâti, les
grandes cultures annuelles. Cas à trancher au mapping des classes (Phase 1) : vignes,
vergers, **bocage** (vert perçu mais agricole), prairies permanentes.

La **part forestière fine** reste disponible au **rapport**, pour le sens strict
« verdure / boisé ». On **exclut explicitement** ce qu'on ne mesure pas (accès réel,
biodiversité, protection) et on distingue de la « campagne » (densité) déjà captée
par `cadre_calme`. Glose visible obligatoire (faux-ami, cf. audit).

Distinction nette et utile :
- une **petite ville dense entourée de forêts** = forte nature, faible calme ;
- une **plaine de grandes cultures peu dense** = fort calme, faible nature (et
  souvent forte pression agricole).

Donc nature ≠ calme ≠ pression agricole : trois axes distincts. Le couvert naturel
**exclut les cultures intensives** (classées « agricole », pas « naturel »), ce qui
sépare proprement la vraie nature de la plaine céréalière.

## Éviter le piège « naturel = vide » (note conceptuelle dédiée)

Risque produit majeur : un territoire serait considéré « naturel » uniquement parce
qu'il est désert. À graver avant tout code.

**Le principe qui désamorce.** Le signal mesure un **COUVERT**, pas une absence
d'habitants. Un couvert naturel élevé existe dans deux familles très différentes,
que la métrique « % naturel » ne distingue PAS :
- **naturel ET vivant** : Annecy (lac + montagne), Aix-en-Provence (Sainte-Victoire,
  garrigue), Pau / Foix (Pyrénées), Fontainebleau (forêt), Gérardmer (Vosges),
  Arcachon (bassin + forêt), La Rochelle / Rochefort (littoral + marais) ;
- **naturel ET mort** : hameaux de Lozère / Creuse, villages d'altitude sans
  services, intérieur corse.

Le vide n'est donc pas dans le signal nature : c'est une **autre variable**
(population, services, emploi). La protection vient de l'**orthogonalité** : nature
reste strictement séparé de la viabilité, et les garde-fous existants font contrepoids.

**Cas favorisés à juste titre** : les communes qui cumulent nature ET vie locale (le
« sweet spot » ci-dessus). C'est la cible produit, et le **multi-critères la fait
remonter naturellement** : un projet « nature + services + emploi » privilégie le
naturel-vivant sur le naturel-mort.

**Cas injustement pénalisés (deux angles morts réels)** :
1. **Bocage et viticole** : verts perçus, mais classés « agricole » par l'occupation
   du sol → sous-classement possible. À arbitrer au mapping des classes.
2. **La maille (le plus important)** : une ville compacte **adossée à une grande
   forêt / un massif naturel situé sur les communes voisines** aura un faible % DANS
   ses limites, alors qu'elle est perçue comme très nature. **C'est exactement la
   leçon du relief** (Grenoble à 214 m mais entourée de montagnes). → probable besoin
   d'une **« nature à proximité » (dans un rayon)**, pas seulement intra-communale.
   Question ouverte majeure (V1 intra-communal assumé, ou rayon dès le départ ?).

**Effets de bord avec les autres signaux** :
- nature ↘ services / transports / emploi (corrélation rurale) : un projet « nature »
  seul skewe vers le rural. Le **plancher de viabilité** et le mécanisme de
  **compromis** nomment déjà ce trade-off ; le multi-critères l'arbitre.
- nature ↗ **air sain** : synergie positive (cohérent).
- nature recoupe **`faible_pression_agricole`** (toutes deux récompensent le
  non-intensif) : **risque de double comptage** à surveiller (ce sont des facettes
  distinctes, mais une commune forestière score haut sur les deux).
- nature ↗ **dépendance voiture** (futur signal mobilité) : tension à assumer.

**Le garde-fou décisif** : nature reste **opt-in et orthogonal**. `POP_FLOOR` et la
baseline de viabilité (isolement + bassin, même non demandés) empêchent déjà un
micro-hameau à 95 % de forêt de dominer. On n'y touche pas. **Règle à graver : on ne
récompense jamais un territoire parce qu'il est vide, seulement parce qu'il est
couvert de nature, ce qui n'est pas la même chose.** Affichage cohérent : la glose et
la synthèse parlent de « forêts et espaces naturels autour », jamais de « préservé
parce que peu habité ».

## Sources (vérifiées juin 2026)

| Source | Producteur | Maille / résolution | Couverture | Fréquence | Force / limite |
|---|---|---|---|---|---|
| **Théia OSO** [recommandé] | CESBIO / CNES (Théia) | raster **10 m**, 17-23 classes | métropole entière | **annuelle** (2016→) | fin (capte le vert local), simple, gratuit Etalab, automatisable ; pas l'outre-mer, classes génériques |
| **OCS GE** | IGN / DGALN | parcellaire (vecteur), très fin | **France entière** (oct 2025), 70 dépts diffusés + suite | 3 ans (2017-20, 2021-23, 2024-26) | le plus précis et officiel ; lourd (vecteur), pensé artificialisation/ZAN ; idéal rapport + dynamique |
| **Corine Land Cover** | UE Copernicus / SDES-IGN | raster 100 m, **unité min. 25 ha** | Europe | ~6 ans (≤2018) | standard européen, longue série ; **trop grossier** (aveugle au vert <25 ha), millésime ancien |
| BD Forêt | IGN | vecteur, type de peuplement | nationale | — | détail forêt (essences), pour le rapport |
| INPN / aires protégées | MNHN / OFB | vecteur (Natura 2000, parcs, réserves, ZNIEFF) | nationale | — | sens « préservé / protégé », V2 narratif (présence ≠ accès) |

**Source la plus robuste pour le signal communal** : **Théia OSO** (10 m, annuel,
national, gratuit, agrégeable en % par commune). CLC trop grossier (25 ha rate le
vert de proximité). OCS GE = la référence fine pour le **rapport** et la **dynamique
d'artificialisation** (V2), un peu lourd pour un % communal V1.

Avantage majeur sur le logement : l'occupation du sol **couvre tout le territoire,
sans trou** (pas d'équivalent Alsace-Moselle) et **sans problème de petit
échantillon** (un raster couvre chaque commune entièrement). Le signal nature est
donc structurellement plus robuste que le logement.

## Maille

**Commune** (raster OSO agrégé en pourcentages par commune). Pas de repli nécessaire
(couverture exhaustive, pas de secret statistique). Pas d'IRIS (sur-précision
inutile pour « y a-t-il du vert autour »).

## Signaux produit envisageables (sans formule)

1. **Part de couvert naturel et forestier** (le cœur) : % forêts + milieux
   semi-naturels + prairies. Lisible (« territoire très boisé / peu végétalisé »),
   national, robuste. **Candidat critère scoré opt-in + narratif.**
2. **Caractère préservé / artificialisation** (le négatif, dynamique) : part
   artificialisée et son évolution (OCS GE / ZAN). Plutôt **narratif** (« territoire
   qui se bétonne »), rejoint la piste artificialisation du doc candidates.
3. **(V2) Nature protégée** : présence d'aires protégées (parcs, Natura 2000).
   Narratif, prudent (présence ≠ accès, peut même être une contrainte).
4. **(V2) Détail** : forêt vs prairie vs eau, essences (BD Forêt), pour le rapport.

## MVP réaliste

- Un champ d'index `nature` préparé par script statique committé (discipline
  emploi / relief / logement) : **part de couvert naturel et forestier** par commune,
  depuis OSO, + paliers relatifs (percentiles nationaux) pour l'affichage.
- **Critère scoré opt-in** : le parse détecte « nature / du vert / la campagne /
  proche de la nature / forêts » → préférence `nature` (poids selon l'intensité),
  pesée SEULEMENT si formulée. Glose visible au gate (« interprété comme : part de
  forêts et d'espaces naturels autour de la commune »).
- **Rapport** : le % réel de couvert naturel, la composition (forêt / prairie / eau),
  éventuellement l'artificialisation.
- Honnêteté : on dit qu'on mesure le **couvert**, pas l'**accès** ni la
  **biodiversité**.

## Ce qui relève d'une V2

- Artificialisation **dynamique** (rythme de bétonnage, OCS GE / ZAN).
- Aires protégées / biodiversité (INPN).
- **Accès / usage** réel (sentiers, baignade, forêts publiques accessibles) : le vrai
  trou, comme « l'accès au sentier » pour le relief.
- Détail essences (BD Forêt), distinction qualitative (forêt naturelle vs plantation).

## Recommandations explicites

1. **Source : Théia OSO 10 m** pour le signal communal (fin, annuel, gratuit,
   automatisable). OCS GE réservé au rapport + dynamique d'artificialisation (V2).
2. **Définition V1 : part de couvert naturel et forestier** (forêts + semi-naturel +
   prairies), hors cultures intensives. Glose visible obligatoire.
3. **Critère SCORÉ opt-in** (pesé seulement si l'utilisateur formule la nature),
   distinct de `cadre_calme` et `faible_pression_agricole`. C'est l'inverse du
   logement, et c'est justifié : préférence formulée, pas jugement de valeur imposé.
4. **Maille commune**, sans repli (couverture exhaustive).
5. **Narratif + rapport** : % réel et composition au rapport ; au comparateur, le
   critère pèse et une glose rend le sens visible.

## Risques

- **Polysémie « nature »** : campagne (densité) vs forêt (couvert) vs préservé
  (protection). Risque de répondre à un autre sens que voulu. → glose visible,
  définition affichée, et question d'affinage au gate si l'ambiguïté est forte.
- **Doublon avec `cadre_calme`** : « campagne » peut vouloir dire les deux. Ne pas
  double-compter ; le parse doit distinguer « calme » (densité) de « nature »
  (couvert). Un même projet peut légitimement activer les deux.
- **Couvert ≠ accès** : une forêt privée ou clôturée compte en couvert mais n'est pas
  « accessible ». Limite assumée (V2).
- **Couvert ≠ qualité écologique** : une monoculture de pins compte comme forêt.
  Honnête, à ne pas survendre comme « biodiversité ».
- **Scorer la nature** : même opt-in, vérifier que ça ne tire pas mécaniquement vers
  l'isolement (les communes très boisées sont souvent peu desservies). Le plancher de
  viabilité existant et les autres préférences doivent rester un contrepoids.

## Décisions à arbitrer (avant toute implémentation)

1. **Scoré opt-in (recommandé) ou narratif seulement ?** C'est la décision-pivot.
   Mon avis : scoré opt-in, car c'est une préférence formulée qui comble un trou
   sémantique réel, sans le biais qui interdisait de scorer le logement.
2. **Source** : Théia OSO 10 m (recommandé) vs OCS GE (plus fin mais lourd) vs CLC
   (trop grossier) ?
3. **Définition « perçu comme naturel » (élargie)** : [VALIDÉ provisoirement
   2026-06-02] naturel strict + prairies extensives + mosaïque bocagère, hors
   grandes cultures intensives. **⏸ EN PAUSE (à trancher sur OSO)** : vignes, vergers,
   pastoral spécialisé, bocage complexe (mapping laissé paramétrique).
4. **Articulation avec `cadre_calme` et `faible_pression_agricole`** : trois axes
   distincts confirmés ? règle de parse pour ne pas confondre « calme » et « nature » ?
   Surveiller le double comptage nature / pression agricole. [À confirmer]
5. **Maille : « à proximité » (rayon)** [VALIDÉ provisoirement] — abandon du strict
   communal (cas Grenoble 7 %→55 %). Rayon ≈ 15 km pondéré surface, à caler sur OSO.
6. **Anti-« vide »** : baseline de viabilité + opt-in comme contrepoids [direction
   retenue] ; à reconfirmer sur les résultats OSO.
7. **Source** : OSO 10 m en production (récence + finesse) ; CLC n'a servi qu'à la
   validation conceptuelle. [VALIDÉ]
8. **Nom du critère** : « nature », « cadre naturel », « espaces naturels », « du
   vert » ? (faux-ami à neutraliser par la glose). [Ouvert]

## Validation provisoire et Phase 1 (2026-06-02)

Test sur données réelles **CLC 2018, 44 postes** (OSO non agrégé par commune et aucun
outillage géo dans l'environnement de test ; OSO reste la source de production). Le
test a tranché les deux grandes questions ; il laisse ouvertes les classes agricoles
spécialisées, à revalider sur OSO.

### Maille : proximité, pas commune [VALIDÉ provisoirement]

Grenoble : **7 % naturel intra-commune → 55 % dans un rayon de 15 km** (cerné de
massifs). Jumeau exact du cas relief : la nature est une caractéristique de
l'environnement VÉCU, pas de la commune administrative. → logique de **rayon**
(≈ 15 km, pondérée surface), **abandon de la lecture strictement communale**.

### Définition : « perçu comme naturel », pas « non-agricole et boisé » [VALIDÉ provisoirement]

La bonne question n'est pas « qu'est-ce qui est naturel ? » mais « qu'est-ce qu'un
humain perçoit comme naturel quand il dit vouloir vivre proche de la nature ? ». Test
**strict** (naturel non-agricole) vs **élargi** (naturel + prairies + bocage/mosaïque,
hors monoculture intensive) :

| Commune (profil) | strict | élargi |
|---|---|---|
| Coulon (Marais poitevin) | 0 % | 37 % |
| Vire (bocage normand) | 2 % | 63 % |
| Nasbinals (Aubrac) | 77 % | 99 % |
| Saintes-Maries (Camargue) | 87 % | 92 % |
| Plogoff (littoral préservé) | 59 % | 81 % |
| Nant (Larzac) | 69 % | 94 % |
| Beaune / Meursault (vignobles) | 16 / 11 % | 22 / 15 % |
| Outarville (Beauce) | 0 % | 0 % |

L'élargi fait remonter les paysages perçus comme naturels (marais, bocage, pastoral,
littoral) tout en gardant **la Beauce à 0 % et les vignobles bas**. C'est une question
de DÉFINITION, pas de millésime : OSO classerait aussi les prairies du marais en
« prairies » ; ce qui change tout, c'est de **décider** que l'extensif/semi-naturel
compte comme naturel.

### Classes : verrouillé vs en pause

- **Verrouillé (naturel)** : forêts, landes, garrigue, pelouses, marais / zones
  humides, dunes / roches, eaux. **Exclu** : grandes cultures intensives. **Inclus
  (cœur de l'élargi)** : prairies extensives, mosaïque bocagère simple.
- **⏸ EN PAUSE, à revalider sur OSO réel (ne PAS graver)** : vignobles, vergers,
  paysages pastoraux spécialisés, systèmes bocagers complexes (CLC 242/243/244).
  Intuition retenue : certains territoires viticoles/agricoles sont perçus très
  naturels ; « vigne = non naturel » n'est pas acquis.

### Phase suivante : pipeline OSO (production)

Monter un environnement géo (rasterio / GDAL), acquérir OSO (millésime récent),
calcul zonal par commune, calculer le **caractère naturel élargi + rayon**, et
**trancher les classes en pause sur données OSO réelles** : le mapping des classes
contestées (vigne, verger, pastoral, bocage complexe) restera **PARAMÉTRIQUE** pour
voir leur effet avant décision. Gains attendus d'OSO sur CLC : **récence** (objection
2018) et **finesse 10 m** (petits bois du bocage, mosaïques humides). Effort réel
(outillage + dalles OSO), ce n'est plus une simple vérification CSV.

## Trous de données actés

- **Accès / usage** de la nature (sentiers, baignade, forêts publiques) : pas de
  source communale simple ; vrai trou, V2.
- **Qualité écologique / biodiversité** : non mesurée par l'occupation du sol seule.
- **Outre-mer** : OSO = métropole ; cohérent avec le périmètre actuel de l'index.

Sources : Théia OSO (CESBIO/CNES, theia.cnes.fr, licence Etalab) ; OCS GE (IGN,
géoservices, open data) ; Corine Land Cover (UE Copernicus / SDES-IGN, data.gouv.fr) ;
BD Forêt (IGN) ; INPN (MNHN/OFB). État vérifié en juin 2026.
