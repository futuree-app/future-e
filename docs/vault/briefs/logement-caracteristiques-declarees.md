# Brief · ce que le lecteur sait de son logement

**20 août 2026 · chantier de conception, rien n'est codé · le module Logement ne bouge pas d'ici là.**

---

## Ce qu'on demande, en une phrase

Permettre à quelqu'un qui **connaît son logement** de le décrire lui-même quand aucun diagnostic ne
lui est attribuable, **sans jamais que sa parole prenne le statut d'une donnée sourcée**.

## Le problème, mesuré

**75 à 86 % des adresses** n'ont aucun diagnostic attribuable (mesure du 31/07/2026, portée par
`DossierQualificationClient`). Ce n'est pas un cas limite, c'est le cas ordinaire d'un dossier
d'adresse payé 39 €.

Ces dossiers affichent aujourd'hui une échelle Logement à moitié vide, alors que leur propriétaire
connaît sa surface, son année de construction et son mode de chauffage. Le produit préfère donc le
vide à ce que le lecteur sait, et il le fait sur la moitié la plus chère de l'offre.

La saisie du numéro de diagnostic (livrée le 20/08) rattrape une partie de ces cas, ceux où le
document existe et où il est postérieur à juillet 2021. Elle ne rattrape ni les logements dont le
diagnostic n'a jamais été versé, ni ceux dont le document a expiré, ni les locataires qui n'ont
jamais reçu de dossier de diagnostic technique.

## La ligne qui ne se franchit pas

**Une donnée déclarée ne devient jamais une donnée sourcée.** Tout ce qu'affiche le module Logement
vient aujourd'hui d'une base publique et peut être vérifié par un tiers. C'est ce qui distingue
futur•e d'un formulaire.

Trois interdits en découlent, et ils ne se négocient pas :

1. Une caractéristique déclarée ne s'affiche jamais sans être marquée comme telle.
2. Elle n'entre pas dans le **dossier de décision** comme une preuve : `housing.energy_label` et les
   autres `DecisionFact` restent alimentés par le diagnostic attribué, jamais par une déclaration.
3. Le dossier continue de dire qu'**aucun diagnostic n'est attribué**. Une déclaration ne comble pas
   cette absence, elle vit à côté.

Corollaire : la couverture annoncée AVANT l'achat (`expectedCoverage`) ne doit pas se mettre à
promettre ce qu'une saisie ultérieure pourrait produire. On vend ce que les bases portent.

## Ce que chaque champ débloquerait, réellement

Relevé dans le code, pour ne pas demander au lecteur des informations qui ne serviraient à rien.

| Champ | Fiabilité de la mémoire | Ce qu'il alimente aujourd'hui |
|---|---|---|
| **Surface habitable** | haute (sur le bail, l'acte) | `PropertyPassport`, la synthèse rédigée |
| **Année de construction** | moyenne (souvent une décennie) | `PropertyPassport`, la synthèse, la lecture thermique |
| **Type de bâtiment** (maison / appartement) | certaine | `PropertyPassport`, `thermal-evidence` (porte d'entrée : `isResidential`) |
| **Logement traversant** | haute (on le sait en y vivant) | `thermal-evidence`, facteur de confort d'été |
| **Protections solaires** (volets, stores) | haute | `thermal-evidence` |
| **Brasseurs d'air** | certaine | `thermal-evidence` |
| **Type de ventilation** | faible (peu de gens savent) | `thermal-evidence` |
| **Inertie du bâti** | nulle (notion de diagnostiqueur) | `thermal-evidence` |
| **Isolation des murs / menuiseries** | faible à moyenne | `thermal-evidence` |
| **Étiquette DPE** | trompeuse (voir ci-dessous) | `energyState`, `housing.energy_label`, la synthèse |

Deux enseignements immédiats.

**Le confort d'été est le vrai gisement.** `deriveThermalEvidence` rend `C_NO_DATA` dès qu'aucun
diagnostic n'est attribué, et il consomme surtout des faits qu'un habitant connaît mieux qu'un
diagnostiqueur : son logement est-il traversant, a-t-il des volets, un brasseur d'air. C'est la
section qui gagnerait le plus, et sur la matière la plus fiable.

**L'étiquette déclarée est le champ le plus dangereux.** Elle est un résultat de calcul, pas une
caractéristique observable. Quelqu'un la donne de mémoire, ou lit celle d'une annonce immobilière,
ou celle d'un diagnostic expiré dont la méthode de calcul a changé en juillet 2021. Elle nourrirait
`energyState`, donc le vocabulaire « passoire thermique » d'un dossier payant.

**Position proposée : ne pas la demander.** Le produit sait déjà dire « aucune étiquette n'est
attribuée à ce logement », et cette phrase est vraie. La remplacer par une étiquette de mémoire
échangerait une vérité contre une vraisemblance, sur le seul point où le lecteur ira chercher un
chiffre à opposer à un vendeur. À trancher.

## Entrée de lecture, jamais fait de décision

La formulation du brief laissait une tension : la déclaration « n'entre jamais comme preuve », et
pourtant elle « change la lecture thermique et la synthèse ». Les deux sont vrais, et la distinction
doit être **architecturale**, pas éditoriale.

```
DecisionFact              → sourcé, et rien d'autre
CaracteristiqueDeclaree   → non sourcée, portée par le dossier
LectureThermique          → consomme les deux, garde la provenance de chacun,
                            ne convertit JAMAIS la seconde en premier
```

Le test d'acceptation du chantier tient en deux phrases. Celle-ci est autorisée :

> D'après ce que vous avez indiqué, le logement est traversant et dispose de volets extérieurs.
> Ces éléments jouent en faveur du confort d'été. Aucun diagnostic attribué ne permet ici de
> caractériser le bâti.

Celle-là ne l'est jamais :

> Le logement présente un bon confort d'été.

## La provenance voyage avec la valeur, jamais avec le bloc

`declared_features` ne peut pas être un sac de valeurs :

```json
{ "surface": 72, "traversant": true }
```

Six mois plus tard, quelqu'un écrira `dpe.traversant ?? declared.traversant`, et trois fonctions
plus loin personne ne saura d'où vient l'information. C'est très exactement le piège que documente
`AGENTS.md` : un champ dérivé en amont est une décision figée qui se déguise en donnée.

Chaque valeur porte donc son origine, et les fonctions de lecture rendent des facteurs qui portent
la leur :

```
declared_features
├── schema_version
└── traversant
    ├── valeur      : true
    ├── provenance  : "lecteur"        (l'autre valeur possible : "ademe")
    └── declare_le  : 2026-08-21T...
```

**Deux valeurs de provenance, pas quatre.** Distinguer en base ce que le lecteur OBSERVE (ses volets)
de ce qu'il RAPPORTE (son année de construction) est juste épistémiquement, et n'entre pas dans le
schéma tant qu'aucune décision n'en dépend : une gradation que rien ne consomme est une complexité
qui se déguise en rigueur. Cette distinction sert ailleurs, et mieux : elle décide **quels champs on
demande**. On ne demande que ce qui se regarde, ou ce qui se lit sur un document qu'on a en main.
C'est ce critère qui écarte l'étiquette DPE, l'inertie et la ventilation.

## Le prompt ne tiendra pas la provenance

Ce dépôt l'a déjà payé. Le 11/08/2026, **les trois synthèses Logement stockées en base enfreignaient
toutes les trois au moins un interdit écrit en toutes lettres dans leur prompt**
(`docs/audits/2026-08-11-syntheses-logement-fautives.md`). D'où `synthesis-guardrails.ts`, et sa
règle : *un prompt n'est pas une frontière de sûreté*.

Structurer le payload en deux blocs et écrire « attribuez toujours ces éléments au lecteur » est donc
nécessaire, et notoirement insuffisant. Il faut une **famille de garde-fou déterministe** qui refuse
un texte affirmant une caractéristique déclarée sans l'attribuer, sur le modèle des familles
existantes (`altitude`, `absence_conclue`, `protection_supposee`). Un modèle qui fond plusieurs
éléments en prose fluide efface la provenance : c'est le comportement attendu, pas l'accident.

## Toute question admet l'inconnu, sans pénalité

Un formulaire transforme l'incertitude en fausse donnée par le seul fait d'attendre une réponse.
Chaque question porte donc « je ne sais pas », et cette réponse **se stocke** : elle vaut réponse
donnée, elle n'est pas un champ vide. Sans cette distinction, l'écran redemanderait indéfiniment ce
que le lecteur a déjà dit ignorer.

## Les questions ouvertes

**1. Où vit la déclaration ?** Elle appartient au dossier d'adresse (une colonne `declared_features`
en JSON sur `address_dossiers`, à côté de `selected_dpe_snapshot`), et jamais au profil : deux
dossiers du même compte décrivent deux biens différents.

**2. Que devient-elle quand un diagnostic est attribué plus tard ?** Le diagnostic gagne toujours sur
la déclaration pour les champs qu'il porte. Reste à décider si la déclaration est effacée ou
conservée en dessous.

Un écart ne se signale que si les deux valeurs décrivent la même chose **sous la même définition**,
et c'est plus exigeant que le même grain. Une surface déclarée de 75 m² face à 62 m² au diagnostic
n'est probablement pas une contradiction : c'est la loi Carrez contre la surface habitable, qui
excluent des choses différentes. La signaler apprendrait au lecteur à se méfier d'un document qui a
raison.

**3. Ce chantier fait-il bouger `dpe_selection_at` ?** Toute donnée matérielle qui change après le
figement d'un artefact doit le périmer, sinon la conclusion vendue ignore ce que le lecteur vient
d'apporter. C'est la leçon du 19/08. Une déclaration change la lecture thermique et la synthèse :
elle doit donc être datée et périmer l'artefact au même titre.

**4. Jusqu'où va le marquage à l'écran ?** Un liseré, une mention « d'après vous », un bloc distinct.
La règle doit tenir dans le passeport, dans le confort d'été, dans la synthèse rédigée et dans le
PDF, sans transformer l'écran en champ de notes de bas de page.

**5. La synthèse rédigée peut-elle citer une déclaration ?** Oui, à la condition posée plus haut :
payload séparé en deux blocs, ET une famille de garde-fou déterministe qui vérifie le texte produit.
Reste à écrire les motifs de cette famille, ce qui demande de connaître les formulations que le
modèle produit réellement. À faire sur des textes générés, jamais de mémoire.

**6. Que se passe-t-il si personne ne remplit rien ?** L'écran ne doit pas devenir un formulaire qui
attend. La saisie est une possibilité offerte, jamais une dette affichée.

## La V1, et rien de plus

Le but immédiat est de faire sortir `deriveThermalEvidence` de `C_NO_DATA` proprement, sur la matière
que l'occupant connaît mieux que la base :

- type de logement (maison / appartement) ;
- logement traversant : oui / non / je ne sais pas ;
- protections solaires extérieures : oui / non / partiellement ;
- brasseur d'air fixe : oui / non.

Surface et année de construction enrichissent le passeport et la synthèse ; elles peuvent suivre,
elles ne changent pas la lecture thermique. L'étage n'est PAS demandé : `thermal-evidence` ne le lit
pas, et demander une information que rien ne consomme est le début d'un formulaire.

## Une forme d'écran qui vaut mieux que des cases remplies

Plutôt que de combler les trous du passeport, l'écran peut rendre lisible ce qui est établi, ce qui
est déclaré, et ce qui reste inconnu :

> **Ce que les sources établissent** · Exposition au retrait-gonflement forte. Aucun diagnostic attribué.
> **Ce que vous avez indiqué** · Appartement, traversant, volets extérieurs.
> **Ce que cela permet de lire** · […]
> **Ce qui reste inconnu** · Isolation, inertie, performance énergétique documentée.

Cette forme sert le moat au lieu de le diluer : elle montre ce que futur•e sait, ce qu'il tient du
lecteur, et ce que personne ne sait. Un formulaire qui remplit des cases ferait l'inverse.

## Hors périmètre

Rien de tout ceci ne change la qualification d'avant-vente, le prix, ni la promesse commerciale. Un
lecteur qui déclare son logement n'achète pas plus de données : il complète sa propre lecture.

## Ce qui est acquis avant de commencer

Le grain reste l'adresse, la déclaration se rattache au dossier. Le diagnostic attribué prime. Le
déclaré se voit. Le dossier de décision reste sourcé.
