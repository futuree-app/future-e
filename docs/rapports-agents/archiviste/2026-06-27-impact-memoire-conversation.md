# Rapport d'impact mémoire — dogfood réel « Brest vs Lorient » (2026-06-27)

> Archiviste, read-only. Matière analysée : `docs/rapports-agents/_sources/2026-06-27-conversation-brest-lorient.md`.
> Vault inspecté : `vault/paris.md`, `vault/modules/comparateur.md`, `vault/vision/archetype-lecteur.md`,
> `vault/vision/positionnement.md`, `vault/doctrine/positionnement.md`, `vault/recherches/inventaire-sources.md`,
> `vault/arbitrages/carte-exploration-probleme-ouvert.md`. Mémoire inspectée : `MEMORY.md` (index complet),
> `project_comparateur_relation_spatiale.md`. Doublons jugés sur ces fichiers réellement ouverts.
>
> CADRE TRANSVERSAL (à appliquer à TOUTE capture ci-dessous) : c'est le FONDATEUR qui a dogfoodé, pas un
> client. Signal directionnel fort, mais preuve de marché FAIBLE. Toute confiance gravée = « anecdote /
> conviction » dans la taxonomie de `paris.md`, jamais « donnée ». N=1, juge et partie. À ne pas sur-vendre.

---

## CE QUI N'EST PAS UNE CAPTURE (cadrage)

Ce digest n'est pas du transitoire : c'est le **premier test d'usage réel** du produit, sur une vraie
décision engageante. Il a une valeur d'archive en soi et il est déjà persisté au bon endroit
(`docs/rapports-agents/_sources/`). On n'en grave pas tout : on en extrait les apprentissages durables et
non-obvies, on confirme/met à jour la doctrine existante, on alimente le registre des paris.

---

## CANDIDAT 1 — Quatre trous de données validés par une décision réelle

**Quoi.** Quatre données ont manqué *au moment de décider*, pas en théorie :
1. **Ensoleillement (h/an) + nombre de jours de pluie ≥ 1 mm** (fréquence, pas volume). futur•e a le cumul
   (mm DRIAS) et l'intensité (q99/Rx1d) mais ni la fréquence ni l'ensoleillement — or le cliché breton porte
   exactement là. Source candidate : normales Météo-France.
2. **Qualité des eaux de baignade** (manquant 2 fois). Donnée ouverte, classée (directive 2006/7/CE :
   Excellent/Bon/Suffisant/Insuffisant). Source : baignades.sante.gouv.fr / Ministère Santé. Hub'Eau ne
   l'expose pas. Critère de décision réel pour un produit de choix de vie **littoral**.
3. **Population de l'aire / unité urbaine (« taille vécue »)**. L'index a `population` (commune) + code `uu`
   mais PAS le nombre d'habitants de l'UU. « Est-ce une grande ville ? » se joue sur l'agglo (Brest 140k
   commune / ~210k aire). Correction manuelle 3-4 fois.
4. **Logement social / taux HLM**. Demandé explicitement (volet « politique du logement »). Absent de l'index
   comparateur (présent à l'IRIS dans une autre brique).

**Pourquoi durable.** Un besoin de donnée *constaté en situation de décision* est exactement le type de refus/
gap que l'inventaire des sources existe pour mémoriser (« on a appris ça au prix d'une vraie décision, on
l'oublierait dans six mois »). Non-obvie : le détail « fréquence ≠ volume de pluie » et « eaux de baignade ≠
Hub'Eau » sont des pièges qu'on rejouerait sinon.

**Destination.** `vault/recherches/inventaire-sources.md` (terrain du Data Curator) — section « Statut de la
roadmap » ou nouvelle sous-section « Gaps validés par l'usage réel ». Action : **update**. Pas de fiche
/memory dédiée (le Data Curator décidera de l'intégration ; l'Archiviste ne fait que tracer le besoin).

**Doublon.** Vérifié contre `inventaire-sources.md` (aucune de ces 4 dans l'inventaire ni dans la table des
refus), `MEMORY.md` (fiches `project_modules`, `ademe_datasets` ne couvrent ni baignade ni ensoleillement-
fréquence). Recouvrement PARTIEL pour la #3 : `project_taille_ville.md` / `project_exclusion_ville_uu.md`
scorent isolement/taille/bassin SUR l'UU — mais le **nombre d'habitants UU pour le récit « est-ce grand ? »**
n'y est pas exposé. À mentionner comme « complément de surface », pas comme nouveau chantier.

**Confiance.** Haute (constat factuel reproductible). **Validité.** Pérenne (gaps), jusqu'à intégration.

**Contenu exact proposé** (à insérer dans `inventaire-sources.md`, nouvelle sous-section avant « Liens ») :

> ## Gaps validés par une décision réelle (dogfood Brest/Lorient, 2026-06-27)
>
> Quatre manques constatés *en situation de décision* (pas en théorie), à instruire par le Data Curator
> (entrent-ils dans le système de décision, et comment honnêtement ?). N=1, signal directionnel.
>
> | Donnée manquante | Pourquoi décisionnelle | Source candidate | Note |
> |---|---|---|---|
> | Ensoleillement (h/an) + jours de pluie ≥ 1 mm | Le cliché « il pleut » porte sur la FRÉQUENCE et la lumière, pas le cumul mm qu'on a déjà | Normales Météo-France | distinct de DRIAS cumul (mm) / intensité (q99, Rx1d) |
> | Qualité des eaux de baignade | Critère réel pour un choix de vie littoral ; a manqué 2 fois | baignades.sante.gouv.fr / Min. Santé (directive 2006/7/CE) | Hub'Eau ne l'expose pas |
> | Population de l'unité/aire urbaine | « Est-ce une grande ville ? » se joue sur la taille vécue (agglo), pas la commune | INSEE (déjà câblé pour le scoring UU) | l'index a le code `uu`, pas le nombre d'habitants exposé au récit |
> | Logement social / taux HLM | Demandé pour « comparer la politique logement » | INSEE / RPLS | présent à l'IRIS, absent de l'index comparateur |

---

## CANDIDAT 2 — Signature de positionnement : « futur•e prépare la décision, il ne s'y substitue pas »

**Quoi.** Le meilleur moment du produit, en usage réel, fut celui où il a dit ce qu'il NE sait pas et **a
passé la main à la visite physique** (« passez une soirée dans chaque centre, c'est l'attachement au lieu
qui tranche »). À assumer comme **signature de positionnement** — futur•e prépare et désanxiété la décision,
il ne remplace ni le ressenti ni la visite — et non comme un aveu de faiblesse.

**Pourquoi durable.** C'est une articulation plus nette de l'identité que ce qui est gravé. La doctrine couvre
déjà « dire on ne sait pas » (voix honnête) et « arbitrer dans l'incertitude », mais pas explicitement la
**frontière de mission** : là où futur•e s'arrête volontairement et rend la main au réel. Pérenne, structurant.

**Destination.** `vault/vision/positionnement.md` (identité de marque), section « La décision, pas la
compréhension » ou nouveau paragraphe « Là où futur•e s'arrête ». Action : **update**. Pas de fiche /memory
nouvelle (l'index `feedback_positionnement_compatibilite` couvre la copy, pas cette frontière de mission ;
une ligne pourrait y être ajoutée si une session en a besoin, en RÉFÉRENÇANT le vault).

**Doublon.** Vérifié contre `vision/positionnement.md` (« la décision pas la compréhension » présent, mais
pas la frontière « rend la main à la visite »), `doctrine/positionnement.md` (copy rules, rien sur la
frontière), `archetype-lecteur.md` (« on ne sait pas » comme valeur, mais pas comme signature de mission),
`doctrine/editoriale.md` (non rouvert ici mais couvre la voix « on ne sait pas »). Pas de doublon : c'est un
cran plus haut (mission), pas la voix.

**Confiance.** Haute sur la cohérence doctrinale (s'aligne sur tout l'existant) ; à confirmer comme signal
marché (1 usage). **Validité.** Pérenne.

**Contenu exact proposé** (paragraphe à ajouter dans `vision/positionnement.md`, après « La décision, pas la
compréhension ») :

> ## Là où futur•e s'arrête
>
> futur•e prépare une décision de vie et la désanxiété ; il ne se substitue pas au ressenti ni à la visite.
> Le meilleur moment du produit est celui où il dit honnêtement ce qu'il ne sait pas et rend la main au réel
> (« passez une soirée dans chaque centre, l'attachement au lieu tranchera »). Cette frontière n'est pas un
> aveu de faiblesse : c'est la signature de confiance qui distingue futur•e d'un outil qui feint de tout
> trancher. Préparer, pas remplacer.

---

## CANDIDAT 3 — Registre des paris : trois paris nouveaux

`vault/paris.md` est le bon réceptacle (croyance + confiance + critère de mort). Les paris #1-#5 existants ne
recouvrent aucun des trois ci-dessous (vérifié). Tous en statut « non testé », confiance « faible (dogfood
N=1, juge et partie) ». Action : **update** de `paris.md` (+ la fiche miroir `/memory/project_paris_registre.md`
mentionne le registre globalement, pas chaque pari — pas besoin de la toucher).

### Pari #6 — Le verdict de seuil (la synthèse) crée la valeur émotionnelle, pas la donnée brute

- **Quoi.** Ce qui a soulagé le couple n'est pas un nombre mais un VERDICT de seuil porté par la synthèse
  (« si La Rochelle est vivable, Lorient l'est confortablement »). La valeur émotionnelle se cristallise dans
  la synthèse/AskFuture, pas dans la donnée.
- **Pourquoi durable.** Articulation testable du bénéfice émotionnel que l'archétype décrit (« être en paix »).
  Oriente où investir : la synthèse, pas l'accumulation de data.
- **Confiance.** Faible (1 anecdote forte), mais cohérente avec `archetype-lecteur.md` (bénéfice émotionnel).
- **Critère de mort.** Les lecteurs réclament des chiffres bruts et ignorent/sautent la synthèse → la valeur
  est dans la data, pas dans le verdict.
- **Signal attendu.** Les retours qualitatifs citent la phrase de synthèse comme le moment de soulagement.

### Pari #7 — Le besoin « comme ici, mais ailleurs » (similarité / territoires-jumeaux) existe

- **Quoi.** Le porteur a demandé « trouve des villes proches de Brest » ; Claude a dû fabriquer une
  heuristique à la main (55 % services / 45 % douceur climatique). Besoin de MILIEU de parcours, distinct des
  3 portes existantes : « comme ici, mais ailleurs / en mieux sur un axe ».
- **Pourquoi durable.** Premier signal d'usage réel sur un problème déjà tenu OUVERT par le board (pistes
  « constellation », « territoires-jumeaux » de l'arbitrage carte). Transforme une piste Researcher abstraite
  en besoin observé.
- **Confiance.** Faible (1 dogfood), mais converge avec une exploration déjà cadrée.
- **Critère de mort.** Personne d'autre n'exprime ce besoin ; reste une demande de power-user isolée.
- **Signal attendu.** Récurrence de « trouve-moi des villes comme X » dans les conversations / sondes.

### Pari #8 — La délibération de couple est un objet produit distinct

- **Quoi.** « Ma conjointe et moi » : préférences qui peuvent diverger, à peser ensemble. L'archétype/produit
  est centré décideur unique. Objet possible « notre arbitrage » (partagé).
- **Pourquoi durable.** Touche l'archétype fondateur (individuel) ; mérite d'être pesé, pas tranché.
- **Confiance.** Faible (1 cas, le sien).
- **Critère de mort.** Les décisions observées sont quasi toujours mono-décideur, ou le « partage » n'ajoute
  aucune valeur perçue → la délibération de couple est un détail d'usage, pas un objet.
- **Signal attendu.** Des lecteurs qui réclament de pondérer/confronter deux jeux de préférences.

> NOTE : les besoins de DONNÉES (ensoleillement/baignade decision-grade) ne sont PAS proposés en paris : un
> pari est une croyance sur laquelle on a déjà engagé du travail. Ces données ne sont pas intégrées. Elles
> restent au Candidat 1 (inventaire-sources) ; elles deviendront éventuellement des paris quand le travail
> d'intégration sera engagé.

---

## Refusé (et pourquoi)

- **Le déroulé pas-à-pas du parcours (13 étapes)** : transitoire, propre à cette session. La structure
  d'entonnoir est conservée (voir Cohérence), pas la liste.
- **Les chiffres comblés de mémoire** (Brest ~1550 h, La Rochelle ~2250 h, Bordeaux 820k…) : non sourcés,
  hors-produit. On grave le BESOIN de la donnée (Candidat 1), jamais la valeur devinée.
- **« Ce qui a bien fonctionné »** (profondeur data, voix honnête, valeur relationnelle) : ne crée pas de
  connaissance nouvelle — confirme la doctrine existante (`relation_spatiale`, `editoriale`, `positionnement`).
  Valeur = preuve de confirmation, à noter au fil du « ce qu'on a appris » des paris si on en fait un suivi,
  pas une nouvelle page.
- **L'émotionnel du couple, le contexte personnel** : transitoire, hors mémoire stratégique.

---

## Cohérence (tensions à poser à l'humain — l'Archiviste ne tranche pas)

1. **Cardinalité figée N∈{2,3} vs délibération fluide.** Le set de comparaison réel n'arrête pas de bouger
   (3→4→5, ajout/retrait/permutation, et la question change en cours de route). Le Pack/comparateur est gravé
   sur N∈{2,3} (`modules/comparateur.md` « Cardinalité » + addendum `ADR-0007`). Tension réelle entre une
   décision gravée et un usage observé. Choix à poser : (a) maintenir le trio figé et assumer que la
   délibération fluide se fait AVANT l'achat ; (b) documenter une exception/évolution ; (c) ouvrir un pari.
   Je ne tranche pas — je signale la collision.

2. **Archétype décideur unique vs décision à deux.** `archetype-lecteur.md` est centré sur un invariant
   comportemental individuel. Le dogfood est une décision de couple. Choix à poser : modifier l'archétype
   (élargir à la délibération partagée) / créer une exception documentée / laisser en pari #8 ouvert. Je
   pose, je ne tranche pas.

3. **Friction GWL/date (à confirmer).** « Horizon 2030/2050/2100 » est en réalité un niveau de réchauffement
   (+1,5/+2/+3 °C, GWL) ; afficher une DATE pour un GWL est lisible mais potentiellement trompeur (a dû être
   ré-expliqué plusieurs fois). Touche `doctrine/interface.md` (honnêteté du signal) et le gabarit climat
   (`/memory/climat_card_gabarit`). Durabilité moyenne : c'est une friction d'interface connue, pas
   nécessairement une nouvelle règle. À confirmer avec le porteur si ça mérite une note de doctrine ou si
   c'est déjà assumé. Je le signale sans proposer de gravure ferme.

---

## Pépites (signalées, non archivées d'office)

- **L'entonnoir comme forme du produit.** « région d'envie → finalistes → départage → préparation de
  visite ». La valeur tenait au FIL narratif dans la durée, pas à des requêtes isolées. Recoupe
  `parcours_doctrine` (trois portes) et la « continuité » de l'archétype, mais le mot « entonnoir » et la
  question « futur•e accompagne-t-il l'entonnoir dans la durée ? » sont une grille de lecture forte. Vaut un
  brainstorm produit, pas (encore) une gravure.
- **Ce digest est le premier dogfood réel** : artefact de référence pour le futur agent « gardien de la
  calibration » (`paris.md`, bas de page). Déjà persisté au bon endroit. À garder comme jalon.
- **« Comme ici, mais en mieux sur un axe »** : la formulation « en mieux sur un axe » (pas seulement
  « similaire ») est une nuance produit fine — la similarité orientée vers une amélioration ciblée. À ne pas
  perdre si le pari #7 mûrit.
