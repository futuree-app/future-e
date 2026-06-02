# Littoral et projet de vie, note de conception (avant toute implémentation)

Chantier déclenché par un recadrage du porteur (2026-06-02). On était parti d'une
mauvaise question (« faut-il ajouter un critère submersion au comparateur ? »).
L'analyse de faisabilité submersion (voir plus bas) a montré que la donnée actuelle
ne tient pas. Le porteur retourne le problème par le bon bout :

> Le sujet n'est pas la submersion. Le sujet est : comment représenter la viabilité
> d'un projet de vie sur le littoral dans un monde qui change ?

**Aucune implémentation, aucune acquisition, aucun code avant arbitrage produit.**
On fige d'abord le cadre, les sources, la couverture réelle et les usages. Même
process que [LOGEMENT_TERRITORIAL.md](LOGEMENT_TERRITORIAL.md),
[NATURE_TERRITORIAL.md](NATURE_TERRITORIAL.md) et
[PRESSION_CLIMATIQUE_ECONOMIE.md](PRESSION_CLIMATIQUE_ECONOMIE.md) : rigueur,
sources publiques, honnêteté sur les trous, valeur utilisateur avant richesse de
données.

Objectif de la note : déterminer si **le littoral mérite de devenir un axe
structurant de futur•e** (au même titre que nature, climat, santé, emploi,
mobilité, relief), et si oui sous quelle forme.

## Avertissement de vocabulaire (à trancher avant tout)

Le titre de travail « littoral résilient » bute sur une décision fondatrice déjà
prise : dans [PRESSION_CLIMATIQUE_ECONOMIE.md](PRESSION_CLIMATIQUE_ECONOMIE.md), le
porteur a **abandonné le mot « résilience »** faute de données pour le défendre
sérieusement. On préfère renoncer à un mot qu'on ne peut pas tenir plutôt que
bâtir un proxy fragile. Le même réflexe s'applique ici : « résilient » promet une
mesure de capacité d'adaptation qu'aucune donnée publique ne nous donne à la maille
commune.

Pistes de nom défendables (à arbitrer) : **« vivre sur le littoral »**, **« littoral
et risques »**, **« le littoral face au changement »**. Le reste de la note dit
« littoral » sans préjuger du nom final.

## Ce qui a motivé le recadrage : la submersion ne tient pas (faits vérifiés 2026-06-02)

- En production, seules **35 communes** portent un score de submersion côtière.
  La France compte environ 900 communes littorales : ce n'est pas une couverture,
  c'est un échantillon-jeton.
- Ce score n'est pas un indicateur de submersion : c'est un **proxy altimétrique
  maison** (`scripts/populate-coastal-submersion.js`, EU DEM 25 m via OpenTopoData,
  `score = 100 − altitude×100/15`), plus quelques scores manuels (Nord). Aucun
  niveau marin extrême, aucune période de retour, aucune projection d'élévation.
- Répartition par façade des 35 : Manche/Mer du Nord ~9, Atlantique ~14,
  Méditerranée ~12. Méthodologiquement uniforme, mais grossier partout.

Verdict : **aucun chantier « submersion » autonome à ce stade.** La submersion peut
n'être qu'une composante d'un objet plus large, le littoral.

Note d'attribution : la source « Callendar » évoquée dans la mémoire projet
**n'apparaît nulle part dans le code** et n'est pas une source primaire. Callendar
est une surcouche de données publiques (SHOM, GIEC). À ne jamais citer dans l'UI
(cf. doctrine source publique).

## Q1. Quels risques littoraux sont réellement pertinents pour un projet de vie ?

Ordonnés par pertinence « projet de vie » (et non par richesse de donnée).

1. **Recul du trait de côte / érosion.** Le risque le plus tangible pour un projet
   de vie : un bien peut littéralement disparaître ou devenir inconstructible. La
   loi Climat et Résilience impose déjà à certaines communes une carte d'exposition.
   C'est lent, prévisible, irréversible : exactement le registre « monde qui change »
   de futur•e. Candidat n°1.
2. **Submersion marine.** Inondation temporaire de la zone côtière par la mer
   (dépression + vent de mer + forte marée). Couverte par le régime CatNat, mais
   coût des dommages estimé ×2 à ×10 d'ici 2050. Anxiogène, épisodique, difficile à
   mailler proprement à la commune. Composante, pas pilier.
3. **Pression assurantielle.** Angle sous-estimé et très différenciant. **L'érosion
   n'est PAS couverte par le régime CatNat** (jugée prévisible) : un trou
   assurantiel réel sur le littoral, là où l'utilisateur croit être protégé. La
   submersion, elle, est couverte mais sous tension de coût. C'est la traduction la
   plus concrète, « projet de vie », du risque côtier (« pourrai-je m'assurer, à
   quel prix, mon bien gardera-t-il sa valeur ? »).
4. **Surcote / tempêtes côtières (vent, houle).** Le moteur n'a aucun critère vent
   (cf. exclusion confirmée des exemples comparateur). Donnée diffuse, peu de signal
   commune. Probablement narratif au mieux.
5. **Autres, mineurs ou de niche :** intrusion saline des nappes (eau potable),
   qualité des eaux de baignade, pression immobilière touristique (déjà notée dans
   [DONNEES_CANDIDATES_CEREMA.md](DONNEES_CANDIDATES_CEREMA.md), à rattacher au
   module logement), trait de côte « naturel vs artificialisé » (digues : protège
   mais fige).

Hiérarchie produit : **érosion/recul ≫ submersion ≈ assurabilité ≫ le reste.**

## Q2. Quelles données publiques nationales existent réellement ?

| Source | Donnée | Statut |
|---|---|---|
| **Cerema, indicateur national d'érosion côtière** (Géolittoral) | Évolution du trait de côte sur 50+ ans, vitesses de recul, 1/100 000 | **Le meilleur socle** : première cartographie nationale homogène |
| **Loi Climat et Résilience, liste des communes (décret 29 avr. 2022, art. L321-15)** (data.gouv.fr) | Liste officielle de communes exposées au recul, obligation de carte locale | National, officiel, mais **volontaire et partiel** |
| **BRGM** | Aléa submersion marine (cartographies régionales), visualiseur national « niveau de la mer à marée haute » (sealevelrise.brgm.fr) | Submersion : produit **région par région**, pas uniforme |
| **SHOM** | Niveaux marins extrêmes, références altimétriques maritimes | Atlas historiquement **Manche et Atlantique** ; Méditerranée à part |
| **Géorisques / GASPAR** | TRI (2013/2020), PPRL, Atlas des Zones submersibles, arrêtés CatNat | Déjà partiellement exploité dans futur•e (module inondation) |
| **CCR (réassureur public)** | Régime CatNat, périls couverts, sinistralité | Cadre assurantiel, pas une donnée commune fine |

L'érosion (Cerema) est de loin la donnée la plus mûre. La submersion reste
fragmentée. L'assurabilité est un cadre réglementaire, pas un indice par commune.

## Q3. Quelle couverture réelle ?

- **Érosion (Cerema) :** **national et homogène** sur la métropole continentale
  (6 000+ km de linéaire interprété), compléments Corse / outre-mer en cours.
  ~20 % des côtes en recul, fortes disparités géographiques. C'est la seule donnée
  littorale à couverture comparable d'une façade à l'autre.
- **Liste loi Climat et Résilience :** officielle mais **partielle et biaisée par
  façade** : ~121 communes volontaires, **quasi toutes Atlantique/Manche, 5
  seulement en Méditerranée**. Utile comme signal binaire « commune concernée »,
  pas comme mesure d'intensité, et non exhaustive.
- **Submersion :** **partielle et hétérogène** (BRGM régional, SHOM Manche/Atlantique,
  Méditerranée traitée différemment). L'homogénéité inter-façades n'est pas tenue.
- **Synthèse :** seul le **recul du trait de côte** est aujourd'hui couvert de façon
  défendable à l'échelle nationale. C'est lui qui peut ancrer un axe ; le reste est
  contextuel.

## Q4. Quelle maille pertinente ?

Point clé qui disqualifie la commune comme maille naturelle :

- **L'érosion est un linéaire** (le trait de côte), pas une surface communale. Deux
  communes voisines, l'une en recul, l'autre stable.
- **La submersion est infra-communale** (les zones basses, polders, estuaires), pas
  la commune entière.
- La **bande côtière** (les premières centaines de mètres / le front de mer) porte
  l'essentiel du risque ; l'arrière-pays de la même commune n'est pas concerné.

Conséquence : la **commune est une mauvaise maille** pour un risque côtier. La maille
honnête est la **bande côtière / le linéaire**, donc un objet **infra-communal**.
Cela pousse vers le **rapport** et le **module Quartier** (intra-communal), et
**contre** un critère de classement au comparateur (national et communal, où une
maille infra-communale fabrique une fausse comparabilité, piège OLL déjà documenté).

## Q5. Comparateur, rapport, ou les deux ?

- **Rapport (et Quartier) d'abord, en narratif honnête.** C'est la place naturelle :
  contextualiser, nuancer par la bande côtière, raconter le territoire sans imposer
  un score à une maille qui ne s'y prête pas. Conforme à la doctrine
  « narratif d'abord » du logement et de la pression éco.
- **Comparateur : au plus un flag conditionnel binaire, jamais un score
  submersion.** Le seul élément défendable au comparateur serait un **drapeau
  qualitatif** issu de la liste officielle (« commune engagée dans l'adaptation au
  recul du trait de côte »), national et factuel, **et seulement si une intention
  littorale est exprimée** (cf. Q6). Pas de score d'intensité, pas de proxy
  altimétrique, pas de classement des communes côtières entre elles tant que la
  donnée d'intensité n'est pas homogène.
- Cela rejoint le patron déjà en prod : **signaux conditionnels / opt-in** (nature
  par proximité OSO, `reliefProche`). Un signal littoral ne s'active que sur un
  projet littoral.

## Q6. Comment l'utilisateur exprime-t-il réellement ce besoin ?

Personne n'écrit « je veux éviter la submersion marine ». L'utilisateur dit :

- « vivre près de la mer » ;
- « préparer ma retraite sur la côte » ;
- « rester proche de l'océan » ;
- « habiter sur le littoral atlantique » ;
- « au bord de la mer, mais sans accumuler les risques ».

Implications de conception fortes :

1. **Le besoin est second, pas premier.** L'utilisateur exprime une **envie de mer**
   (déjà captée : `nearSea`, `proximite_mer`, façades). Le risque littoral est une
   **lucidité qu'on lui apporte**, pas un critère qu'il pose. Le signal doit donc
   **se déclencher en réaction à une intention littorale**, jamais s'imposer.
2. **Le ton compte.** « monde qui change » sans anxiogène. On n'effraie pas, on rend
   lucide : « vous visez la côte ; voici ce qu'un projet de vie littoral implique à
   horizon 2050 ». Registre futur•e : projeter, pas alarmer.
3. **L'arbitrage de vie**, lui, est exactement notre force : « près de la mer **mais**
   pas sur un front de côte qui recule », « la côte **et** un bien encore assurable
   dans 20 ans ». C'est ce qu'un comparateur de villes classique ne sait pas dire.

## Verdict (avis PM, à valider)

**Le littoral ne doit pas devenir un 7e axe universel** au même rang que climat ou
nature. Différence de nature : climat, nature, relief, santé, emploi, mobilité
s'appliquent aux 34 000 communes avec des données homogènes ; le littoral ne
concerne qu'une frange côtière, avec des données partielles et infra-communales.
En faire un axe universel rejouerait le piège submersion à plus grande échelle.

**Mais le littoral mérite d'exister, comme enrichissement conditionnel** (un
« module littoral » / une couche du rapport), activé uniquement sur intention
littorale. Sa forme défendable aujourd'hui :

- **Pilier : le recul du trait de côte** (Cerema, national homogène). Seule donnée
  assez mûre pour porter le signal.
- **Composante narrative : la pression assurantielle** (érosion hors CatNat) :
  l'angle le plus concret « projet de vie », différenciant, sans exiger un score.
- **Submersion : narratif et contextuel seulement**, tant que la couverture n'est
  pas homogène. On ne ressort pas le proxy altimétrique.
- **Maille : bande côtière / linéaire**, donc rapport + Quartier ; au comparateur,
  au plus un flag conditionnel binaire issu de la liste officielle.
- **Déclenchement : opt-in sur intention littorale** (`nearSea`, façade, proximité
  mer forte), jamais une préférence universelle.

Autrement dit : **oui, un axe littoral, mais conditionnel, narratif d'abord, ancré
sur l'érosion, et nommé sans « résilience ».**

## Risques transverses et pièges

- **Fausse comparabilité (OLL).** Tout score littoral à couverture partielle traité
  comme national. Déjà la cause de l'échec submersion.
- **Anxiogène.** Un axe risque mal dosé fait basculer futur•e du « projeter » vers
  l'alarmisme. Garde-fou de ton explicite.
- **Mauvaise maille.** Scorer une commune entière pour un risque de front de mer :
  faux à la fois pour la commune basse (sur-pénalisée) et l'arrière-pays
  (faussement rassuré).
- **Attribution de source.** Ne jamais citer Callendar ; citer SHOM / BRGM / Cerema /
  Géorisques, sources publiques primaires.
- **Le mot « résilience ».** Précédent tranché : on ne l'emploie pas sans données
  pour le tenir.

## À instruire si le chantier est validé

1. **Trait de côte (Cerema) :** récupérer la couche Géolittoral, définir comment
   passer d'un linéaire à un signal lisible par commune côtière (part du linéaire
   communal en recul, vitesse max), tester l'homogénéité réelle Atlantique / Manche /
   Méditerranée sur un panel.
2. **Liste loi Climat et Résilience :** ingérer la liste officielle (data.gouv.fr)
   comme flag binaire ; mesurer sa couverture et son biais façade.
3. **Assurabilité :** instruire comment formuler un narratif défendable (érosion hors
   CatNat) sans donnée commune fine ni conseil financier.
4. **Submersion :** rouvrir seulement si BRGM (couche marée haute) + IGN RGE Alti
   permettent une couverture côtière homogène ; sinon rester narratif.
5. **Nom du signal :** trancher le vocabulaire (sans « résilience »).
6. **Place :** confirmer rapport/Quartier d'abord, flag conditionnel comparateur
   ensuite.

Tout le reste : conservé ici, documenté, non instruit.
