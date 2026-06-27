# Rapport stratégique — Internationalisation de futur•e

> Business Strategist (contre-pouvoir : moteur + moat). Question exploratoire du porteur :
> « si futur•e devait s'internationaliser, quels pays, quels potentiels, quels enjeux, quelles
> ambitions ». Ce rapport est une RÉFÉRENCE à rouvrir, pas une décision imminente.
> Daté 2026-06-28. À relire à la lumière de la condition de réouverture (fin du doc).

---

## Le goulot aujourd'hui

Le goulot d'étranglement de futur•e n'est pas géographique, il est probatoire : **la disposition
à payer B2C en France n'est pas mesurée.** C'est le pari central du modèle (modele-economique.md,
section « Hiérarchie de preuve », et ADR-0008), avec un précédent défavorable nommé (CityScan,
parti en B2B faute de payeur B2C). Tant que ce chiffre n'existe pas, futur•e n'a pas prouvé
qu'elle a UN marché solvable ; la question « combien de marchés » est en aval d'une question non
résolue.

Tout le reste de ce rapport se lit à travers ce goulot.

---

## Décision évaluée

Explorer l'expansion internationale : choix des pays, séquence, ambition (« futur•e France
profonde » vs « couche européenne de décision de vie face au climat »). Porteur = exploration ;
analyse de départ avancée par Claude principal (substrat national comme unité d'expansion, Tier 1
UK + Méditerranée, dorsale Copernicus, séquence francophone-test d'abord).

Ce que ça changerait concrètement : nature du moat (national → multi-national), allocation du
temps du fondateur solo, ambition affichée, et la définition même du produit (un substrat France
profond vs une couche européenne mince).

---

## La vraie question

**Mauvaise question pour maintenant — et je peux nommer pourquoi.**

La variable dominante de futur•e à cette date est **le taux de conversion paywall → paiement en
France** (et le clic sur les CTA payants). Aucune décision d'internationalisation ne déplace cette
variable. Pire : l'internationalisation est le type même de chantier qui *consomme* la ressource
rare (le temps du fondateur solo) sans toucher au goulot.

La vraie question n'est donc pas « quel pays d'abord ? » mais : **« le portage existe-t-il comme
problème ? »** Or un portage ne se pose que si DEUX preuves sont acquises, et aucune ne l'est :
1. qu'un substrat national de futur•e génère du revenu récurrent prouvé (le moteur tourne en
   France) ;
2. que le coût de reconstruction d'un substrat national est connu (jamais mesuré — futur•e n'a
   jamais porté son moteur de données sur un second pays, même francophone).

Tant que ces deux preuves manquent, « quels pays » est une question dont toutes les réponses ont
la même valeur opérationnelle : zéro pour les 12-18 prochains mois.

Cela ne veut pas dire que l'exercice est sans valeur. Comme **note de référence datée**, il est
légitime (il structure une optionalité future). Comme **chantier**, il serait une faute
d'allocation aujourd'hui. Je traite donc ce rapport comme une carte à ranger, pas comme un cap à
suivre.

---

## Coût d'opportunité (le cœur de mon objection)

Un mois passé à porter un pays = un mois NON passé sur l'une de ces trois choses, qui toutes
touchent le goulot ou l'étage suivant :

- **Instrumenter et lever le pari B2C** (clic CTA, paywall → paiement sur 1 000 sessions). C'est
  la dépense la moins chère qui débloque TOUT le reste, y compris la légitimité de
  l'international. Coût : faible. Impact : décisif.
- **Approfondir le moat France** (le récurrent « Le Fil » non livré, qui est nommé comme le
  maillon le plus faible du moteur : le « pourquoi il revient »). Sans récurrent, futur•e n'a pas
  de moteur composé, juste un one-shot. Porter ce one-shot à l'étranger ne fait que dupliquer une
  fragilité.
- **Démarrer le relais B2B France** (CGP, automne 2026, le produit actuel suffit déjà selon
  ADR-0008). C'est du revenu adjacent à coût marginal faible, qui valorise la preuve B2C au lieu
  de reconstruire un substrat à zéro.

Asymétrie brutale : l'international est un pari CHER à tester (reconstruire un substrat de ~30
signaux sur des sources nationales nouvelles, en langue parfois nouvelle, avec une réglementation
data nouvelle) pour un upside qui n'existe que SI la France est déjà prouvée. C'est exactement
l'inverse du pari que veut un solo : peu coûteux à tester, gros upside. Le bon pari peu coûteux,
ici, c'est la mesure du paywall France, pas un portage.

---

## Critique du classement pays

Sur le fond géographique, l'analyse de départ est bien raisonnée. Mes désaccords portent sur des
angles morts, pas sur le palmarès.

**Ce que l'analyse voit juste :**
- Le substrat de données ne traverse pas les frontières. C'est l'intuition la plus importante du
  document, et elle est correcte : le moat de futur•e est l'ingénierie de croisement sur des
  sources NATIONALES (DRIAS, Géorisques, INSEE, IGN, ADEME, BPE…). Aucune ne se rejoue ailleurs.
- L'unité d'expansion = un substrat national. Exact, et c'est ce qui rend l'international cher.
- Tester d'abord un francophone adjacent pour MESURER le coût de portage avant d'engager un vrai
  marché. C'est la seule partie du plan qui respecte la discipline « réduire l'incertitude au coût
  le plus faible » (paris.md). À conserver.

**Ce que l'analyse sous-estime ou rate :**

1. **Le portage francophone n'est PAS « zéro traduction = quasi gratuit ».** Belgique et Suisse
   ont des écosystèmes de données radicalement différents (fédéralisme belge : données régionalisées
   Flandre/Wallonie/Bruxelles ; Suisse : cantons, OFS, pas DRIAS). La langue est le COÛT LE PLUS
   FAIBLE d'un portage ; le substrat est le coût dominant. Donc un test Belgique/Suisse mesure
   surtout… le coût du substrat — ce qui est précisément l'inconnue qu'on veut chiffrer. C'est donc
   un bon test, mais pour la bonne raison (mesurer le substrat), pas celle annoncée (« zéro
   traduction »). Ne pas vendre ce test comme facile : sa valeur est de révéler qu'il ne l'est pas.

2. **RGPD / licences de données par pays : risque traité comme nul, alors qu'il est structurant.**
   Les jeux français sont massivement en Licence Ouverte / open data réutilisable commercialement.
   Ce n'est PAS garanti ailleurs : certaines données cadastrales, de risque ou statistiques
   européennes sont sous licence restrictive ou payante (ex. registres fonciers UK partiellement
   payants, données IGN-équivalentes parfois sous licence commerciale). L'avantage « ingénierie de
   données » de futur•e repose en partie sur la GRATUITÉ et la réutilisabilité du substrat français.
   Cet avantage peut ne pas exister ailleurs. C'est une variable éliminatoire, pas un détail — à
   confier au Data Curator avant tout pays.

3. **USA écarté trop vite, pour la mauvaise raison.** First Street / Risk Factor n'occupe PAS le
   créneau de futur•e : ils font du risque-immobilier (un score de risque par adresse), pas de la
   DÉCISION DE LIEU DE VIE multi-critère (le positionnement explicite de futur•e : « pas un site de
   risques »). L'adversaire de futur•e n'est pas un fournisseur de risque, c'est « la décision prise
   avec des infos éclatées ». Donc l'argument « créneau pris » confond la catégorie de futur•e avec
   celle de First Street — exactement le risque structurant n°1 (catégorie mal comprise) appliqué à
   soi-même. Cela dit, les USA restent à éviter, mais pour de VRAIES raisons : substrat fédéral
   éclaté (50 États), coût d'acquisition payant obligatoire, distance d'exécution pour un solo. La
   conclusion est bonne ; le raisonnement est faux et doit être corrigé dans la note.

4. **Sur-estimation possible de la Méditerranée (mission) au regard du payeur.** Salience maximale
   (Espagne/Italie/Portugal vivent déjà la chaleur et la sécheresse) ≠ disposition à payer maximale.
   La salience nourrit le trafic, pas forcément la carte bancaire. Or le pari non résolu de futur•e
   EST la disposition à payer. Ouvrir d'abord un marché « mission » à fort trafic / faible payer,
   c'est risquer de répéter en plus grand l'angle mort français. Le Tier 1 « UK (revenu) » est plus
   honnête vis-à-vis du goulot que le Tier 1 « Méditerranée (mission) ».

5. **Concurrence locale non auditée.** L'analyse vérifie les US (First Street) mais pas l'Europe.
   Avant d'adouber UK ou l'Allemagne, il faut un audit concurrentiel local (un acteur immobilier-
   climat UK, un comparateur de communes allemand). Non vérifié ici = à ne pas tenir pour vide.

---

## Le moat se transfère-t-il, ou se re-paie-t-il ?

Réponse nuancée, et c'est la partie la plus intéressante du dossier.

**Ce qui se transfère (coût quasi nul) :** la couche haute — UX, doctrine éditoriale, moteur de
compatibilité, prompts IA, architecture de code, le capital de compréhension (« comment les gens
choisissent un lieu de vie »). C'est réel et c'est l'argument fort de l'international.

**Ce qui se re-paie intégralement :** le substrat de données national (~30 signaux), la marque
locale, le SEO local (34 000 pages → à recréer pour chaque pays), les relations B2B locales, la
confiance. C'est le gros du coût ET le gros du moat.

**La synthèse honnête :** le moat de futur•e est explicitement défini comme une *accumulation*
(`sources → croisements → interprétation → UX → marque → confiance → temps accumulé`, ADR-0002).
L'international transfère les maillons amont (méthode, UX) mais REMET À ZÉRO les maillons aval qui
font la défense (marque, SEO, confiance, temps). Donc par défaut : **dilution.** Un second pays au
jour 1 est aussi peu défendable qu'était la France au jour 1.

**MAIS il existe une version où l'international renforce le moat** — c'est l'angle Copernicus, et il
mérite d'être pris au sérieux comme OPTIONALITÉ :
- Copernicus / ERA5 est une dorsale climat PAN-EUROPÉENNE, déjà câblée chez futur•e (ensoleillement).
  La couche climat prospective est donc, elle, partiellement mutualisable à l'échelle européenne —
  contrairement aux couches territoriales (INSEE, BPE…) qui restent nationales.
- Cela crée un actif de connaissance réutilisable (le pipeline climat européen) qui, lui, COMPOSE
  d'un pays à l'autre. C'est le seul effet d'échelle réel du dossier.
- Crédibilité B2B : « la couche européenne de décision face au climat » est un récit de levée de
  fonds / de partenariat plus puissant que « un comparateur de communes françaises ». Valeur
  stratégique réelle — mais c'est une valeur de NARRATIF, encaissable seulement si la preuve
  d'usage existe d'abord.

Conclusion : l'international DILUE le moat tant que la France n'est pas prouvée ; il pourrait le
RENFORCER (via la dorsale Copernicus et le récit européen) une fois la France prouvée. L'ordre est
non négociable. Le seul actif qui compose à l'avance, c'est de garder le pipeline climat
architecturé « européen-compatible » dès maintenant — ça, c'est gratuit et ça crée de l'optionalité
sans rien dépenser.

---

## Effet sur le moteur et les boucles

- **Moteur (qui paie / pourquoi / quand / pourquoi il revient) :** l'international n'améliore aucun
  des quatre. Il duplique un moteur dont le maillon « pourquoi il revient » (le récurrent) n'est
  même pas livré en France. On ne duplique pas un moteur qu'on n'a pas fini de construire.
- **Boucle d'apprentissage :** un second pays FRAGMENTE les décisions réelles observées (deux
  petits corpus valent moins qu'un gros pour comprendre les arbitrages). À ce stade, l'international
  ralentit l'apprentissage au lieu de l'accélérer.
- **Boucle de prescription :** le bouche-à-oreille est local (on prescrit à son notaire, sa famille,
  dans son pays). Aucun effet de réseau transfrontalier. La prescription ne traverse pas plus que
  les données.

---

## Niveau de preuve

L'analyse de départ empile des hypothèses non démontrées traitées comme acquises :
- « le moteur se transfère quasi gratuitement » → vrai pour la couche haute, FAUX pour le substrat
  (l'essentiel du coût). Hypothèse à requalifier.
- « créneau vide en Europe » → non vérifié (aucun audit concurrentiel UK/DE).
- « disponibilité de données ouvertes granulaires par pays » → asséné, jamais testé ; c'est
  précisément l'inconnue éliminatoire (licences, RGPD).
- le payeur B2C international → hérite à 100 % du pari non résolu en France, en l'aggravant (marché
  inconnu).

Le dossier international est donc, en l'état, un **pari empilé sur un pari** : il suppose résolu ce
qui ne l'est pas (payer en France) ET ajoute ses propres inconnues (substrat, licences, concurrence
locale). C'est la définition du pari déguisé en exploration prudente.

---

## Invariants et principes

- **Invariant n°8 (les preuves, pas les espoirs)** : ouvrir un pays avant d'avoir mesuré le payeur
  France serait avancer avec l'espoir, pas la preuve. Frontal.
- **Principe stratégique B2C-d'abord (ADR-0008)** : l'international ne doit pas détourner le moteur
  B2C. Tant qu'il disperse le temps du solo loin de la preuve B2C France, il le détourne.
- Pas de tension avec n°1, n°2, n°7 : l'international ne touche ni l'indépendance ni le refus du
  score. C'est un arbitrage d'ALLOCATION, pas de principe.

---

## Risques structurants

L'international AGGRAVE plusieurs risques déjà nommés :
- **Paiement B2C non démontré (n°2)** : dupliqué et amplifié sur un marché inconnu.
- **Catégorie mal comprise (n°1)** : refaire en langue étrangère le travail de positionnement (« pas
  un site de risques ») sans la marque accumulée.
- Il en ATTÉNUE théoriquement un seul, et seulement à terme : **le portail immobilier acquéreur**
  (n°4) — un récit européen rend futur•e plus stratégique donc plus chère à racheter. Mais c'est un
  bénéfice de sortie, pas de moteur.

---

## L'ambition : « France profonde » vs « couche européenne »

Je tranche, comme demandé.

**Aujourd'hui et pour les 12-18 prochains mois : « futur•e France, profonde ».** Raisons :
1. C'est le seul chemin qui touche le goulot (prouver le payeur sur le marché qu'on connaît).
2. La profondeur (récurrent livré, B2B France amorcé, ~30 critères qui deviennent 40, boucle
   d'apprentissage qui tourne) est ce qui CONSTRUIT le moat. La largeur géographique le DILUE avant
   qu'il existe.
3. Un futur•e France profond et rentable est la CONDITION de tout le reste, y compris d'une levée
   pour financer l'Europe. Un futur•e large et mince n'a aucun moat dans aucun pays.

**« La couche européenne » est la bonne ambition de RÉCIT et de phase 2** — à garder vivante comme
cap, à préparer gratuitement (architecture Copernicus européenne-compatible), à n'exécuter qu'après
preuve. Ce n'est pas une ambition concurrente, c'est l'ambition d'APRÈS. Les confondre dans le temps
est l'erreur ; les opposer sur le fond aussi. Réponse nette : profondeur d'abord, largeur ensuite,
jamais l'inverse.

---

## Le vrai pari

Le vrai pari de l'internationalisation n'est PAS « quel pays » ni même « combien coûte un portage ».
C'est : **« le capital de compréhension de futur•e (comment les gens choisissent un lieu de vie) est
assez universel pour qu'on le rejoue ailleurs en n'ayant à re-payer que le substrat de données. »**
Si c'est vrai, l'international est un produit ; si la façon de choisir un lieu de vie est trop
culturellement française (rapport à la propriété, à la ruralité, à l'administration), alors chaque
pays est un nouveau produit à inventer, et l'international n'existe pas comme levier. Ce pari ne se
teste qu'avec un premier portage réel — donc pas avant que la France paie.

---

## Vue extérieure

**Si j'étais investisseur :** je verrais un fondateur solo, avec un produit non encore monétisé sur
son marché domestique, en train de cartographier 5 pays. Le signal serait : « il fuit la question
difficile (faire payer en France) vers une question excitante (la carte d'Europe) ». Je financerais
la profondeur France, jamais la largeur prématurée. La carte d'Europe avant le premier euro récurrent
prouvé est un drapeau rouge classique de dispersion de fondateur.

**Si j'étais concurrent (portail immobilier) :** je serais ravi de voir futur•e se disperser sur
5 substrats nationaux pendant que j'ajoute un score climat sur mon trafic France existant.

---

## Verdict : DIFFÉRER

Différer l'internationalisation comme chantier. La maintenir comme NOTE DE RÉFÉRENCE (ce document)
et comme OPTIONALITÉ gratuite (architecture climat européenne-compatible).

Condition de preuve qui lèverait le report (voir « quand rouvrir »).

---

## Si je devais rédiger la victoire stratégique (pour arbitrages/)

> **Dispersion évitée.** En refusant d'ouvrir un second marché avant d'avoir mesuré le payeur B2C
> France et chiffré le coût réel d'un portage, futur•e évite de dupliquer un moteur inachevé (le
> récurrent n'est pas livré) sur des substrats nationaux à reconstruire de zéro. L'international
> reste une optionalité préparée gratuitement (dorsale Copernicus pan-européenne, architecture
> climat européenne-compatible) et un récit de phase 2 (« la couche européenne de décision de vie
> face au climat »), à exécuter APRÈS la preuve France, jamais comme substitut à celle-ci. Pari
> prématuré écarté ; cap conservé.

---

## Cohérence (tensions non tranchées, posées à l'humain)

1. **Mission vs revenu dans le choix du 1er vrai marché.** La Méditerranée sert la mission (climat
   salient), UK sert le goulot (payeur). Le porteur devra trancher quel critère prime LE JOUR où la
   France est prouvée. Je penche revenu (UK) parce que le goulot est le payeur ; mais c'est un
   arbitrage de valeurs, pas de logique, donc il revient à l'humain.
2. **Optionalité gratuite vs scope creep.** « Garder l'architecture européenne-compatible » est
   sain SI ça reste gratuit. Si ça commence à coûter du temps de design aujourd'hui, ça devient de
   la dispersion déguisée. Frontière à surveiller.

---

## Mise à jour de la doctrine (prêt à écrire si décision)

Si le porteur valide ce cadrage, ajouter à `modele-economique.md` (ou en arbitrage dédié) :
- une ligne dans les **risques structurants** : « Dispersion géographique prématurée — l'expansion
  internationale dilue le moat (substrat + marque + SEO à reconstruire par pays) tant que le payeur
  B2C France n'est pas prouvé. International = levier d'après-preuve, jamais substitut. »
- une note d'**optionalité** : la dorsale Copernicus/ERA5 est le seul actif de connaissance qui
  compose à l'échelle européenne ; garder le pipeline climat architecturé européen-compatible (coût
  nul) préserve l'option sans la financer.
- un **pari** dans `paris.md` : « Le capital de compréhension de futur•e est assez universel pour
  être rejoué hors de France en ne re-payant que le substrat. » Statut : non testé. Confiance :
  faible (doctrine, aucune donnée). Critère de mort : un premier portage francophone révèle que la
  façon de choisir un lieu de vie est trop spécifiquement française.

---

## Limites de mon regard

- Je ne peux PAS chiffrer le coût réel d'un portage (jours-homme pour reconstruire un substrat
  national) : c'est l'inconnue centrale, et elle ne se lève que par un test, pas par un raisonnement.
- Je ne peux PAS évaluer la disponibilité / licence / granularité des jeux de données par pays —
  **c'est le domaine du Data Curator**, et c'est le filtre éliminatoire avant tout choix de pays.
- Je ne peux PAS trancher la taille de marché réelle par pays sans étude (le dimensionnement France
  lui-même est en fourchettes non mesurées).
- L'audit concurrentiel local (UK, DE, Med) n'est pas fait ; je signale qu'il manque, je ne le
  remplace pas par une affirmation marché.

---

## Table d'allocation

| | |
|---|---|
| **Goulot actuel** | Disposition à payer B2C France, non mesurée (paywall → paiement) |
| **Variable dominante** | Le taux de conversion payant France — que l'international ne touche pas |
| **Temps à investir (international, maintenant)** | ~0 au-delà de ce rapport ; garder l'archi climat européenne-compatible = coût nul |
| **Impact attendu sur le CA (12-18 mois)** | Quasi nul, voire négatif (dispersion du solo) |
| **Temps à NE PAS investir** | Choix de pays, portages, audits data pays, design « multi-pays » |
| **Priorité suivante** | Instrumenter et lever le pari B2C (1 000 sessions), puis livrer le récurrent (Le Fil), puis amorcer le B2B CGP |
| **Sujet à rouvrir** | Quand le payeur B2C France est prouvé ET un test de portage francophone a chiffré le coût du substrat |

**Si j'étais CEO :** je rangerais cette carte d'Europe comme une option pour dans 18 mois, et je
ne rouvrirais pas le sujet avant d'avoir vu un euro récurrent prouvé en France et chiffré, sur un
test Belgique/Suisse, ce que coûte vraiment de reconstruire un substrat.

---

## Version minimale (le test le moins coûteux qui lève le doute dominant)

La plus petite incarnation qui capture ~90 % de la valeur du dossier international n'est PAS un
pays : c'est **un audit de faisabilité du substrat sur UN territoire francophone adjacent** (une
région belge ou un canton suisse), mené par le Data Curator, répondant à une seule question :
« combien de mes ~30 signaux puis-je recâbler, à quelle granularité, sous quelle licence ? ». Cet
audit coûte des jours, pas des mois, et chiffre l'inconnue éliminatoire (le coût du substrat) sans
construire quoi que ce soit. Mais même ce test n'est à lancer qu'APRÈS la mesure du payeur France :
il est le second domino, pas le premier.

## Quand rouvrir ce sujet (signaux concrets)

Rouvrir l'internationalisation comme chantier si l'UN de ces signaux apparaît :
- **Déclencheur principal :** payeur B2C France prouvé — conversion paywall → paiement stable et
  positive sur ≥ 1 000 sessions instrumentées, ET un premier flux de revenu récurrent (Le Fil)
  vivant. C'est le « maintenant, vas-y ».
- **Déclencheur opportuniste :** un accord-cadre transfrontalier (réseau B2B européen, éditeur
  logiciel multi-pays, financement fléché Europe) se présente — l'optionalité s'encaisse alors par
  la demande, pas par l'initiative.
- **Déclencheur défensif :** un acteur européen occupe explicitement le créneau « décision de lieu
  de vie face au climat » (pas un fournisseur de risque comme First Street, mais un vrai homologue)
  dans un marché cible — réévaluer le « pourquoi maintenant ».
- **À l'inverse, signal qui ENTERRE le sujet :** un test de portage francophone révèle que > la
  moitié du substrat est non réplicable (licences fermées, pas de granularité commune) OU que la
  façon de choisir un lieu de vie est trop culturellement spécifique — alors l'international n'est
  pas un levier, et « France profonde » devient la seule stratégie.

---

## Addendum — critique externe (ChatGPT, 2026-06-28) et raffinements acceptés

Une relecture externe (ChatGPT, mode avancé) a noté le rapport 9/10 comme analyse d'allocation,
7,5/10 comme stratégie d'internationalisation. **La décision opérationnelle est inchangée** (ne pas
internationaliser maintenant), mais la critique corrige des prémisses jugées trop rigides. Greffes
**acceptées** (porteur + Claude principal) :

**(a) Découpler l'international du succès du Fil.** L'erreur la plus nette du rapport : exiger un
récurrent vivant comme prérequis. Le Pack one-shot ou le B2B peuvent financer le test suivant sans
Le Fil. C'était empiler deux paris indépendants (prouver le paiement, PUIS la rétention).

**(b) Reformuler le gate en preuve décisionnelle, pas en chiffre rond.** Remplacer « conversion
stable sur ≥ 1 000 sessions + récurrent vivant » par : **« un moteur économique France assez
démontré pour financer/justifier le test suivant »** (B2C one-shot OU récurrent OU B2B OU un mix).
« 1 000 sessions » est arbitraire : ce qui compte, ce sont les expositions paywall + transactions +
qualité des cohortes (150 personnes réellement exposées et quelques ventes peuvent suffire).

**(c) Deux portes d'expansion, pas une.** Distinguer l'expansion **initiée par futur•e** (exige une
preuve France forte) de l'expansion **tirée par un partenaire** (B2B multi-pays, financement
européen, licence, acteur immobilier qui apporte la distribution) — rationnelle beaucoup plus tôt si
le partenaire absorbe le coût de portage/distribution. Le rapport le mentionnait trop tard.

**(d) L'international est aussi un TEST DE VÉRITÉ produit, pas qu'une décision de croissance.**
Question stratégique à ne pas laisser en suspens 18 mois : « futur•e a-t-il un moteur généralisable,
ou seulement une excellente compilation du système français ? ». D'où le plan en 3 niveaux :
  - **Niveau 1 (maintenant)** : hygiène de portabilité, presque gratuite — séparer la logique métier
    des adaptateurs de sources FR, éviter « commune française » dans les concepts centraux (`territory`
    suffit), garder un id pays, documenter les dépendances nationales. **PAS d'abstraction préventive.**
  - **Niveau 2 (après lancement France)** : audit borné de quelques jours sur 2 terrains contrastés
    (un proche, un complexe) pour estimer le coût de portage SANS construire de produit.
  - **Niveau 3 (expansion réelle)** : seulement si moteur économique FR démontré OU demande
    partenaire qui absorbe le coût OU opportunité financée OU fenêtre concurrentielle.

**(e) Choisir un futur 1er test par similarité du SYSTÈME DE DONNÉES, pas par la langue.**
Belgique/Suisse (proposés pour le francophone) sont un **piège** : complexité fédérale/cantonale qui
ferait échouer un portage pour une raison propre au pays → fausse conclusion « le modèle ne se
transpose pas ». Le bon labo distingue méthode universelle / spécificité FR / complexité exceptionnelle
du pays testé.

**Nuance ajoutée par Claude principal (que ChatGPT ne réconcilie pas) :** « le moat est dans
l'ontologie/le moteur plutôt que le substrat national » a un revers — ce qui rend le moteur portable
est exactement ce qui le rend **copiable** (risque structurant n°4 du board : armer le portail immo).
Le substrat lourd protège EN France ; l'ontologie transférable s'expose. Les deux « moats » ne sont
pas interchangeables. Tenir cette tension avant de conclure que porter un pays « renforce » le moat.

**Reformulation du verdict** : remplacer « DIFFÉRER » (trop passif) par **« Ne pas ouvrir de marché
étranger. Préserver et tester à faible coût la portabilité du moteur. La France reste le seul terrain
d'exécution ; l'international est un objet d'architecture et de preuve, pas de roadmap commerciale. »**

**Hors-international (input adjacent du modèle de revenu ChatGPT) :** réordonner le segment B2B Pro —
**chasseurs immobiliers / consultants relocation / mobilité d'entreprise AVANT les CGP**, car payés
pour défendre l'intérêt du client (alignés avec l'honnêteté des compromis), là où l'agent vendeur est
en conflit. **Contredit l'hypothèse vault « relais B2B = CGP d'abord »** ; à reverser au dossier B2B
quand il s'ouvrira. Palier stratégique clé du modèle : **500 k€ France** (preuve que le moteur B2C
public alimente un revenu pro/institutionnel), pas 10 M€.
