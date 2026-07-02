# Rapport produit — Cadrage du module Logement (fond)

> Product Strategist, 2026-07-02. Read-only. Question-mère : quel est l'archétype du module
> Logement, que doit-il faire réellement décider, et qu'est-ce qui manque en valeur vs ce qui
> ajoute de la complexité creuse ? Terrain lu : `vision/archetype-lecteur.md`,
> `vision/positionnement.md`, `principes/invariants.md`, `modules/territoire.md`,
> `arbitrages/loisirs-pas-de-module-autonome.md`, code réel (`LogementModule.tsx`,
> `rapport/quartier/page.tsx`), socle de contexte `_contexte-module-logement-2026-07-02.md`.

---

## L'idée (ce qui existe, sous quelle forme)

Le module Logement est arrivé sous forme de **solution** (« un module qui lit le bien : DPE,
risques, assurance, valeur »), pas d'un besoin formulé. Il fonctionne ainsi : l'utilisateur
**tape une adresse**, un fetch renvoie toute la payload, trois onglets (Synthèse / Détails /
Agir), une synthèse IA **optionnelle** derrière un bouton « Générer la lecture ». Le hero promet
« Ce que votre habitat devient. Confort, risques, valeur. » et met en avant **quatre briques** :
Performance énergétique, Risques par adresse, **Pression d'assurance**, **Valeur à 20 ans**.

Constat central que je pose d'emblée : **les deux briques les plus mises en avant (assurance,
valeur) sont les deux seules qui ne reposent sur aucune donnée réelle.** `getInsuranceOutlook`
déduit « Sous pression / À surveiller / Plus stable » des seuls *labels* de risque.
`getValueOutlook` fabrique « Fragilisée / À arbitrer / Plus résiliente » d'un mélange
DPE+risques+friche+passoires. Le hero vend donc en vitrine ce qui est le plus creux dessous.

---

## Le vrai besoin derrière

Le moment déclencheur de l'archétype est concret : ouvrir un portail immobilier, hériter d'une
maison, envisager d'acheter/louer, ou se demander si le bien qu'on habite tient encore la route.
La question fondatrice de l'archétype (« qu'est-ce que je risque d'oublier dans cette
décision ? ») appliquée à un bien précis devient : **est-ce que ce logement est un bon pari à 20
ans, et qu'est-ce qui va vraiment me coûter que l'annonce et le notaire ne disent pas ?**

Le besoin réel n'est **pas** « comprendre mon logement ». C'est **décider ce que j'y engage** :
acheter / renoncer / négocier le prix / provisionner des travaux / rénover ou vendre / anticiper
l'assurabilité. Le lecteur ne paie pas une fiche technique du bien (le DPE est déjà public, l'annonce
le donne). Il paie la **tranquillité de s'engager sur 300 000 € et vingt ans sans l'impression
d'avoir oublié un coût caché** — rénovation devenue obligatoire, prime d'assurance qui décroche,
revente contrainte par un DPE ou un risque. C'est exactement le moat de futur•e : **le coût futur
que le marché ignore**, pas le prix que le marché sait déjà donner.

---

## Archétype proposé pour le module

**Logement = la lecture du bien que je vise ou que j'habite, pour décider ce que j'y engage.**

Territoire pose le décor macro (et `modules/territoire.md` lui **interdit explicitement** la
valeur du bien et le confort thermique, qu'il **renvoie à Logement**). Logement traduit ce décor
**dans les murs** : ce bien précis, à cette adresse, à cette parcelle. C'est le **seul module à
la granularité adresse/parcelle**, et le **seul qui parle d'argent qu'on engage dans un actif**.
Sa question cible n'est pas « quels risques autour de moi » (Territoire) ni « qui est vulnérable
ici » (Santé), c'est : **« ce bien, dois-je m'y engager, à quel prix, avec quels travaux et
quelle assurabilité devant moi ? »**

Corollaire décisif, aujourd'hui absent : **l'archétype se dédouble selon la relation au bien**,
exactement comme Territoire s'est dédoublé résidence/découverte.
- **Acheteur** qui évalue un bien candidat : décision = acheter / négocier / renoncer. Posture =
  vérifier avant de s'engager.
- **Résident/propriétaire** de son bien : décision = rénover / provisionner / rester. Posture =
  arbitrer sur un actif qu'on possède déjà.
Même donnée, posture opposée. Le module traite tout le monde en acheteur anonyme.

---

## Valeur pour le lecteur : ce qui sert la décision vs ce qui donne à voir

**Sert vraiment la décision (le socle à garder et renforcer) :**
- **DPE + audit + calendrier passoires.** C'est la brique décisionnelle par excellence :
  interdiction de location progressive (2025/2028/2034), coût de rénovation, MaPrimeRénov, ordre
  des travaux. Factuel, à l'adresse, change réellement un achat (négocier), une location
  (renoncer), une détention (provisionner). C'est la colonne vertébrale, pas une brique parmi
  quatre.
- **RGA (retrait-gonflement des argiles) à la parcelle.** Première cause émergente de sinistres
  et de tension assurantielle sur les maisons individuelles ; pertinent au point, pas à la
  commune. C'est le vrai socle du volet assurabilité.
- **Inondation / submersion à l'adresse** (quand présent) : idem, décisionnel au point.

**Donne à voir sans aider à arbitrer (à retirer ou reléguer) :**
- **Qualité de l'air commune** (PM2.5/PM10/NO2/O3) : c'est le terrain de **Santé**. Inerte ici.
- **Incendies, taux de boisement, densité, revenu médian, vieillissement** : c'est **Territoire**.
  Redondant, hors sujet « les murs ».
- **ZFE** : c'est la voiture, pas le bien. Relève de **Mobilité**. Marginal en headline Logement.
- **IRIS motorisation / transports en commun / suroccupation** : Territoire/Mobilité.
- **HLM** : déjà tranché EXCLU par le porteur (`project_module_logement`). Ne pas surfacer.
- **Altitude** : inerte hors contexte inondation (fuite de donnée, cf. `feedback_signature_identitaire`).

**Zone grise (contexte utile au bien, à manier prudemment) :** passoires_taux et précarité
énergétique de l'IRIS peuvent éclairer la revente/rénovation (« quartier de passoires »), mais
risquent l'inventaire d'indicateurs. À n'utiliser qu'en appui de la synthèse, jamais en tuile
autonome.

---

## Les deux briques vedettes : mon verdict séparé

### « Pression d'assurance » → REFORMULER (le besoin est réel, la surface heuristique ne l'est pas)

C'est ma signature réutilisable : **le besoin est réel, la surface autonome ne l'est pas.**
L'assurabilité est probablement **l'inconnu décisif émergent** d'un bien (réforme CatNat,
sinistres RGA, assureurs qui se retirent de zones). Le besoin est central et différenciant. Mais
la brique actuelle **invente un verdict** à partir de labels — c'est exactement le module-promesse
qui impressionne sans rien savoir, et il **érode l'actif que le lecteur paie : la rigueur**.

Réponse juste : **fonder ce volet sur la donnée réelle déjà prête** — ONRN sécheresse (coût moyen
+ fréquence), sinistralité ONRN/CCR, balances comptables assurance communes (rapports data-curator
du 2026-07-02). Énoncer un **signal observé sans palier inventé** (invariant n°5), pas un verdict
« Sous pression à 20 ans ». Nuance honnête : ces données sont **communales**, pas à l'adresse ;
le module doit dire l'échelle et ne pas déguiser du communal en lecture d'adresse. Si le
raccordement propre n'est pas mûr, **DIFFÉRER en hypothèse parquée** (voir plus bas), jamais
garder l'heuristique en attendant.

### « Valeur à 20 ans » → REFUSER en tant que brique-vitrine (dissoudre en contraintes factuelles)

Celle-ci est la plus dangereuse. « Fragilisée / Plus résiliente » est **un score déguisé**
(invariant n°2 : pas de note synthétique) posé **au-delà de toute preuve** (invariant n°5) sur la
décision financière la plus lourde d'une vie. futur•e n'a **aucune donnée de marché** pour
prédire une valeur. Pire : c'est **la feature la plus copiable** (n'importe quel site sait
afficher un « score de valeur » bidon) et **hors moat**. Elle rend futur•e plus riche en apparence
et moins digne de confiance en réalité.

Le besoin sous-jacent (« vais-je pouvoir revendre, est-ce que je surpaie ? ») est légitime, mais
sa **forme honnête n'est pas une prévision de valeur** : c'est **nommer les contraintes factuelles
sur la revente/location future** — calendrier DPE, assurabilité, exposition au risque. Ce sont les
leviers réels ; « valeur » n'en est que l'agrégat vague. **Dissoudre** la brique dans ses
composantes factuelles, ne pas la garder en tuile de verdict.

---

## Coût de complexité (ce qui pourrait NE PAS exister)

- **Les deux tuiles vedettes** (assurance heuristique, valeur prédite) : promesses à tenir qu'on
  ne peut pas tenir. Les retirer *réduit* la surface et *augmente* la confiance.
- **Le géste « taper une adresse »** est un coût, mais **gagné** ici : le bien EST intrinsèquement
  à l'adresse (DPE, parcelle, RGA au point) — Territoire ne peut pas le faire. À conserver, mais
  cadrer par la relation (visé vs habité).
- **L'onglet Détails** est un empilement de `Block label/value` : c'est l'**inventaire
  d'indicateurs** que `modules/territoire.md` proscrit explicitement (« le danger n'est pas de
  manquer de données, c'est de perdre le récit »). C'est le risque SIG que le positionnement
  refuse. Périmètre à trancher (mon terrain) ; la forme exacte revient au Design Critic.
- **La synthèse IA optionnelle derrière un bouton** : le récit qui transforme la donnée en
  décision est **le produit**, il est mis en option ; les grilles brutes (l'accessoire, le SIG)
  sont le défaut. C'est inversé. (Frontière Design Critic pour le *comment*, mais le *quoi* —
  qu'est-ce qui est le cœur — est mon arbitrage : le récit décisionnel est le cœur.)

---

## Cohérence avec la vision et les invariants

- **« La décision, pas la compréhension »** : le socle DPE/rénovation/assurabilité sert la
  décision ; les tuiles assurance/valeur *donnent à voir* un verdict sans le fonder. Écart net.
- **« Pas un SIG »** : l'onglet Détails + les grilles brutes penchent vers le SIG. À surveiller.
- **Invariant n°2 (pas de score)** : « Valeur : Fragilisée/Résiliente » et le `computeQuickVerdict`
  good/medium/bad sont des scores synthétiques déguisés. Contradiction directe.
- **Invariant n°5 (jamais au-delà de la preuve)** : les deux heuristiques affirment une trajectoire
  à 20 ans sans donnée. Contradiction directe.
- **Invariant n°3 (observé/modélisé/incertain)** : le prompt de synthèse le respecte ; les tuiles
  déterministes ne distinguent rien.
- **Aucun arbitrage n'interdit le module** ; `heritage-industriel-non-score` et
  `score-hybride-inondation-rejete` sont au contraire des **précédents** qui soutiennent mon refus
  de la valeur prédite et de l'assurance scorée.

---

## Frontière nette Logement / Territoire / Santé

Règle de non-redondance, par **granularité et par nature de décision** :
- **Territoire (commune, le décor)** : « cette commune est exposée au RGA / à la sécheresse » au
  niveau macro. N'entre jamais dans le bien.
- **Logement (adresse/parcelle, l'engagement financier)** : « votre parcelle est en zone RGA
  niveau X, voici ce que ça implique pour l'assurabilité, les travaux, la revente ». Le RGA et
  l'inondation **apparaissent des deux côtés sans redondance** *à condition* que Logement ajoute
  le niveau adresse + le coût/l'action que Territoire ne peut pas donner. Sinon, c'est de la
  répétition : la valeur de Logement = ce que Territoire ne peut structurellement pas dire.
- **Santé** : air, personnes vulnérables. **La qualité de l'air n'a rien à faire dans Logement.**
- Axe distinctif à graver : Logement = **le seul module à l'adresse + le seul module de l'argent
  engagé dans l'actif**. Tout ce qui n'est ni à l'adresse ni relatif à l'engagement financier
  appartient à un autre module.

---

## Différenciation et moat (hypothèses concurrents à vérifier)

- DPE, risques Géorisques à l'adresse : **données commodité**. Un concurrent crédible les affiche
  déjà (portails d'annonces, ERRIAL, Géorisques lui-même). Les afficher brut ne creuse aucun moat.
- Le moat est **identique au reste de futur•e** : la traduction en lecture décisionnelle à 20 ans
  de CE bien, honnête sur la trajectoire d'assurabilité, branchée sur la décision réelle du
  lecteur. **La valeur prédite rend futur•e plus copiable et moins fiable ; l'assurabilité
  fondée sur ONRN/CCR — que peu d'acteurs câblent — la rend plus difficile à copier.**
- Hypothèse à vérifier (WebFetch, non fait ici) : des acteurs type « assurermaville » (veille
  business 2026-07-02) ou Callendar opèrent sur le risque climat du bien. À instruire avant de
  sur-investir la brique assurabilité comme différenciant unique.

---

## L'hypothèse porteuse de mon verdict (à contester si elle est fausse)

Mon refus de la « valeur à 20 ans » et ma priorité au coût caché reposent sur une croyance non
dite : **l'inconnu décisif du lecteur sur un bien est le COÛT/CONTRAINTE caché (rénovation
obligatoire, assurabilité, revente contrainte), pas une estimation de prix de marché** — parce
que le prix est déjà servi en abondance (annonces, estimateurs) et que le moat de futur•e est le
coût-climat que le marché ignore. **Si cette croyance est fausse** (le lecteur veut d'abord un
chiffre de valeur), alors la brique valeur est le cœur et j'ai tort. C'est cette hypothèse, pas
ma conclusion, qu'il faut tester.

---

## Transformation

Le socle DPE/assurabilité/contraintes de revente **change la façon de décider** : le lecteur
cesse de lire un bien comme un prix + une photo, il le lit comme **un actif à trajectoire** (ce
qu'il coûtera, ce qu'il faudra y engager, ce qu'il vaudra de pouvoir revendre). C'est la
transformation de l'archétype (« lire un territoire comme une trajectoire ») appliquée aux murs.
Les tuiles heuristiques, elles, n'ajoutent qu'une **capacité d'affichage** sans changer la façon
de décider — ornement fonctionnel.

---

## Ce qu'on ne sait pas (à tester avant de construire)

- **L'utilisateur arrive-t-il en acheteur ou en résident ?** Hypothèse non vérifiée. Test :
  PostHog sur la comparaison adresse tapée vs commune déclarée (le garde-fou « adresse hors
  commune » existe déjà), + une sonde « quel est votre projet sur ce logement ? » (acheter /
  louer / je l'habite). Sans cette réponse, on ne peut pas régler la posture.
- **L'assurabilité communale ONRN est-elle assez lisible pour être décisionnelle à l'adresse ?**
  À éprouver en dogfood avant de la mettre en headline.
- **Le lecteur veut-il un chiffre de valeur ou une lecture de contraintes ?** (l'hypothèse
  porteuse). Sonde qualitative ou entretien.

---

## Verdict (hiérarchisé)

1. **REFUSER** la brique « Valeur à 20 ans » comme verdict-vitrine (invariants n°2 et n°5,
   copiable, hors moat). La **dissoudre** dans ses contraintes factuelles (DPE, assurabilité,
   exposition). *Victoire produit : une fausse prédiction retirée d'une décision à 300 000 €.*
2. **REFORMULER** « Pression d'assurance » : besoin réel, surface heuristique fausse → fonder sur
   ONRN sécheresse + sinistralité ONRN/CCR, signal observé sans palier inventé, échelle dite.
3. **DIFFÉRER** (hypothèse parquée, ne pas supprimer du vault) le volet assurabilité si le
   raccordement à l'adresse n'est pas mûr — déclencheur de réévaluation ci-dessous.
4. **CONSTRUIRE / renforcer** le socle DPE + calendrier + rénovation comme colonne vertébrale
   (déjà là, à mettre au centre, pas en une brique sur quatre).
5. **CONSTRUIRE** le contexte de relation au bien (visé vs habité), plus grande valeur manquante,
   sur le modèle du `ReportRelationBanner` de Territoire.
6. **REFUSER** dans Logement les données de Territoire/Santé (air, incendies, densité, revenu,
   ZFE en headline) : simplification, non-redondance.
7. **RETIRER** le caractère optionnel de la synthèse (le récit décisionnel est le cœur, pas une
   option) et **trancher le périmètre** de l'onglet Détails contre le risque SIG — *quoi* à moi,
   *comment* au Design Critic.

Distinction mauvaise idée vs idée prématurée : la « valeur prédite » est une **mauvaise idée**
(contredit deux invariants, hors moat) → REFUSER franchement. L'« assurabilité » est une **idée
juste dont la donnée n'est pas encore mûre à l'adresse** → REFORMULER maintenant sur le communal,
DIFFÉRER l'adresse, garder le besoin au vault.

---

## Rédigé comme victoire produit (prêt pour `arbitrages/`)

**Arbitrage proposé : la valeur d'un bien n'est pas prédite.** futur•e n'affiche pas de prévision
de valeur immobilière (« Fragilisée / Résiliente »). Il n'a pas de donnée de marché, une telle
prévision est un score déguisé (invariant n°2) posé au-delà de la preuve (invariant n°5), elle est
triviale à copier et hors moat. Le besoin réel — anticiper la revente/location — est servi par ses
**contraintes factuelles** (calendrier DPE, assurabilité, exposition au risque), jamais par un
verdict agrégé. Complexité évitée : une tuile de vitrine spéculative retirée ; confiance préservée
sur la décision la plus lourde du lecteur. Parent : `heritage-industriel-non-score`,
`score-hybride-inondation-rejete`.

---

## Tension avec le Business Strategist (non tranchée)

Le Business défendra probablement de **garder** les briques assurance et valeur : l'assurabilité
est le pont B2B (assureurs, veille « assurermaville ») et « Valeur à 20 ans » est un aimant de
conversion B2C (le chiffre qui fait cliquer). Ma lentille s'y oppose frontalement : **une
prédiction fabriquée sur une décision à 300 000 € est le moyen le plus rapide de perdre la
rigueur — l'actif exact que le lecteur paie.** Le Business dira « l'heuristique est assez bonne
pour vendre » ; je tiens qu'elle vend au prix de la confiance. Point d'arbitrage pour un
`/board` : peut-on porter la **promesse** d'assurabilité (vraie valeur B2C+B2B) **sans** la
fausse **précision** actuelle ? Je crois que oui, et que c'est la seule version défendable.

---

## Mise à jour de doctrine (prête à écrire par Claude principal)

- **Créer `modules/logement.md`** sur le modèle de `modules/territoire.md` : objet (le bien
  qu'on vise/habite, l'engagement financier), périmètre (DPE/rénovation, risque à l'adresse,
  assurabilité, contraintes de revente), exclusions (air→Santé, macro commune→Territoire,
  véhicule/ZFE→Mobilité), axe distinctif (seul module à l'adresse + seul module de l'argent
  engagé), règle de non-redondance RGA/inondation avec Territoire.
- **Nouvel `arbitrages/valeur-bien-non-predite.md`** (texte ci-dessus).
- **Étendre le modèle de relation** (`report-context`, `ReportRelationBanner`) à Logement :
  visé (achat/location) vs habité (résidence), pilotant la posture de la synthèse.
- **`project_module_logement`** (memory) à enrichir : archétype tranché, deux heuristiques
  statuées, frontière posée.

---

## Quatre questions de clôture

1. **Reconstruirait-on ça aujourd'hui à partir de zéro ?** Le socle DPE/risque à l'adresse : oui,
   c'est le seul module à la parcelle. Les tuiles assurance/valeur heuristiques : **non** — on ne
   construirait pas volontairement une prédiction sans donnée sur une décision engageante.
2. **Qu'est-ce qu'on perd si on les supprime ?** En retirant « Valeur à 20 ans » : rien de réel
   (aucune donnée derrière), on gagne en confiance. En retirant « Pression d'assurance »
   heuristique : on perd une *promesse* qu'on ne tenait pas — mais le besoin reste, on le
   re-sert avec ONRN. On ne perd un utilisateur que si sa demande était le chiffre magique, ce
   qui est l'hypothèse à tester.
3. **Version dix fois plus simple ?** Oui : **une synthèse décisionnelle en défaut** (pas en
   option) qui dit, en prose disciplinée, ce que ce bien coûtera et contraindra, adossée au DPE
   réel et au RGA réel — au lieu de quatre tuiles dont deux inventées et deux onglets de grilles.
4. **Plus difficile à copier, ou seulement plus riche ?** En l'état : **seulement plus riche**
   (données commodité + verdicts copiables). Réorienté sur l'assurabilité fondée + la décision au
   bien : **plus difficile à copier**.

---

## Si j'étais le gardien du produit

Je **supprimerais aujourd'hui la brique « Valeur à 20 ans »** et je **remplacerais « Pression
d'assurance » par la sinistralité ONRN réelle énoncée sans palier inventé** ; je remettrais la
**synthèse décisionnelle en défaut** autour du DPE et du RGA ; et **avant tout autre travail**, je
testerais **si le lecteur arrive en acheteur ou en résident**, parce que c'est ce qui règle tout
le reste. Je ne construirais rien de neuf tant que cette réponse manque.

---

## Quand rouvrir ce sujet

- **Rouvrir la brique assurabilité (la construire enfin)** le jour où une donnée de sinistralité
  ou d'assurabilité **exploitable à l'adresse/parcelle** existe (pas seulement communale), ou si
  la réforme CatNat produit un signal public réutilisable.
- **Rouvrir la « valeur » (me contredire)** si une sonde/entretien montre que l'inconnu décisif
  du lecteur est bien un chiffre de valeur et non le coût caché — l'hypothèse porteuse tomberait.
- **Rouvrir la posture (relation)** dès que PostHog mesure la répartition acheteur/résident : si
  elle est massivement d'un côté, simplifier vers ce cas plutôt que dédoubler.
- **Rouvrir la frontière** si Santé ou Mobilité tardent : la tentation de re-loger l'air ou la ZFE
  dans Logement reviendra ; l'arbitrage doit tenir.
- **Rouvrir tout le module** si le pivot B2B (assureurs) devient prioritaire : la cible changerait
  et l'archétype B2C ici posé serait à réviser (cf. note d'ouverture de `archetype-lecteur.md`).
