# Rapport Product Strategist — Deux rapports & rôle du wizard

**Date** : 2026-06-28
**Agent** : Product Strategist (lentille VALEUR/SIMPLICITÉ ; en tension avec Business)
**Sujet** : (A) clarté des deux rapports « ma commune » vs « commune explorée » ; (B) rôle du wizard dans le parcours mûri.
**Statut** : avis read-only. Aucune décision prise, aucun code écrit.

---

## Terrain lu (citations vérifiées)

- `docs/vault/vision/archetype-lecteur.md` — le vrai besoin = « la conviction de ne pas avoir
  oublié l'essentiel » ; le lecteur **rejette l'alarmisme** et valorise compromis + trajectoire ;
  achat = bénéfice émotionnel (paix), donné **par la rigueur, pas par l'affect**.
- `docs/vault/vision/positionnement.md` — « la décision, pas la compréhension » ; « pas une app
  green », pas un site de risques.
- `docs/vault/doctrine/positionnement.md` — **« futur•e n'est PAS un site sur les risques »** ;
  toute copy ouvre par le projet de vie (positif), **jamais par un danger** ; le risque de
  sous-vendre est de « basculer dans l'imaginaire site des risques (anxiogène) ».
- `docs/vault/principes/invariants.md` — n°2 **pas de score synthétique** ; n°6 **on parle à une
  intelligence, pas à une peur** ; n°1 on éclaire, on n'alarme pas.
- `docs/vault/arbitrages/wizard-non-universel.md` — le wizard reste **attaché à « commune
  connue »**, jamais universel (tranché printemps 2026).
- `docs/vault/arbitrages/comparateur-un-moteur-trois-portes.md` — le moteur **legacy scoré a été
  tué** précisément parce qu'il affichait « Score X/100 » (viole l'invariant n°2).
- `/memory/parcours_doctrine.md` — **deux rampes distinctes** déjà actées : « commune connue »
  (commune → wizard → aperçu perso → rapport) et « territoires découverts » (/ou-vivre → INSEE →
  paywall territoire → rapport généré sur l'INSEE seul, **profil collecté ensuite DANS le rapport
  payant**, le CTA explorer n'ouvre PAS le wizard).

## Réel lu (code)

- `src/components/FutureELanding.tsx` — hero à **deux CTA** : « Trouver où vivre » (→ `/ou-vivre`,
  exploration) et « Analyser ma commune » (ouvre le champ commune → questions → « Créer mon
  rapport interactif » → wizard → `/checkout/rapport-complet`). Le mot « **rapport interactif** »
  est employé partout, indistinctement, pour les deux rampes (l.155-185, 2716, 3389-3416).
- `src/components/wizard/ReportWizard.tsx` / `WizardStep.tsx` — 6 étapes ; les **questions** sont
  neutres (« Quel est votre type de logement… »). Le problème de voix n'est pas là.
- `src/components/wizard/WizardTeaser.tsx` — **le foyer du problème de voix** : titre « Analyse de
  **votre exposition** en cours… », « Votre situation fait déjà ressortir **N points d'attention** »,
  « logement **énergivore** », « **Achat à risque** climatique », et surtout
  **`Score ${score}/100 · exposition élevée`** (l.211) + « point d'attention **verrouillé** ».
- `src/app/(public)/territoire/[insee]/debloquer/page.tsx` — page d'exploration **déjà au bon
  niveau de maturité** : titrée « **Rapport de territoire** », voix décisionnelle (« regardez ce
  que les données racontent vraiment »), ligne explicite **« Débloquer ce rapport ne modifie pas
  votre commune de résidence »** (l.183-187), `PersonalTouch` reprend les priorités du projet.
- Section pricing (l.3389-3468) : « Rapport interactif 14€ » et « Pack Décision 39€ » qui bundle
  **« les trois rapports interactifs complets, par commune »** = 3 rapports d'**exploration** (le
  trio comparé), PAS le rapport de résidence.

---

# A. Clarté des deux rapports

## L'idée
Rendre lisible, au front et au back, la distinction entre **« rapport de MA commune »**
(résidence, personnalisé par le wizard, recommandé mais optionnel) et **« débloquer une commune
que je considère »** (exploration, par INSEE, souvent via le Pack). Crainte du porteur : une
fourche dès l'accueil qui paralyse.

## Le vrai besoin
Le besoin n'est pas « afficher deux produits ». C'est que **le visiteur reconnaisse
instantanément SA situation** — celui qui sait déjà où il vit, et celui qui cherche. La doctrine
de l'archétype est nette : le déclencheur est **un moment, pas une catégorie**. La bonne fourche
n'est donc pas « choisis ton SKU », c'est « dans quel moment es-tu ? ».

**Constat : cette fourche existe déjà, et elle est bien faite.** Le hero propose deux verbes —
**« Trouver où vivre »** (je cherche) vs **« Analyser ma commune »** (je sais où). C'est une
fourche par **intention/moment**, pas par produit. C'est exactement la bonne grammaire. Le besoin
A est donc **à 80 % déjà servi par la structure**. Il ne manque pas une surface, il manque un
**nommage** qui empêche les deux sorties de se confondre.

## Valeur pour le lecteur
La distinction est **réelle et utile**, pas une complexité fabriquée : les deux rapports
répondent à **deux questions différentes** —
- résidence = « **que devient MA vie ici ?** » (croise un profil de personne avec un INSEE
  unique — d'où le wizard, cf. `wizard-non-universel.md`) ;
- exploration = « **est-ce que ce lieu que je considère tient la route ?** » (l'INSEE suffit, le
  profil/projet vient ensuite).

Ce ne sont pas deux emballages du même contenu : ce sont deux **contrats narratifs** distincts.
Les fusionner appauvrirait les deux. La distinction crée donc de la valeur.

## Le coût de complexité — et où il est vraiment
Le coût n'est PAS dans « deux rampes » (justifiées). Il est dans **une collision de vocabulaire** :
- la rampe résidence s'appelle « rapport interactif » / « rapport complet » et coûte 14€ vers
  `/checkout/rapport-complet` ;
- la rampe exploration s'appelle aussi « rapport » et coûte 14€ vers
  `/territoire/[insee]/debloquer`.

Même nom, même prix, deux destinations. **C'est ça qui peut perdre le visiteur** — pas la
fourche, le fait que les deux sorties portent le même nom. La page débloquer a déjà tranché le bon
mot (**« Rapport de territoire »**) ; la landing ne l'a pas suivie.

## Ce que je recommande sur A (sans nouvelle surface ni module)
1. **Ne pas créer d'écran « choisissez votre rapport ».** Ce serait précisément la fourche
   paralysante redoutée. La fourche par verbe au hero est supérieure : elle laisse le moment
   décider, pas l'utilisateur arbitrer un catalogue.
2. **Nommer les deux sorties distinctement, par la question qu'elles répondent**, pas par le SKU :
   - résidence → « **le rapport de ma commune** » / « **mon rapport** » (possessif = ancré dans la
     vie du lecteur) ;
   - exploration → « **le rapport de {commune}** » / « **rapport de territoire** » (déjà en place
     côté débloquer ; à propager dans la landing l.155-185, 3389).
   Le *comment* exact des libellés est à border avec **l'Editorial** (la voix) et le **Design
   Critic** (la hiérarchie visuelle des deux CTA). Moi je tranche le **quoi** : deux noms, deux
   questions, une fourche implicite par le moment.
3. **« Analyser ma commune » est tiède.** « Analyser » est un verbe d'outil (« app green » /
   dashboard), pas de décision. Le moment résidence, c'est « **que devient ma vie ici** ». Je
   signale le besoin ; l'Editorial tranche le mot.

## Le Pack doit-il proposer (jamais imposer) le rapport de résidence ?
**Oui, proposer ; et structurellement, le piège est déjà évité.** Le Pack bundle **trois rapports
d'exploration** (le trio comparé), **pas** le rapport de résidence. Donc « acheter le Pack
n'impose pas le rapport de résidence » est **déjà vrai dans la structure** — la crainte du porteur
porte sur la **copy de cross-sell**, pas sur l'architecture.

Règle de valeur pour que l'upsell n'ait pas l'air d'un bundle forcé :
- **Proposer le rapport de résidence par la QUESTION, pas par le panier.** Pas « complétez votre
  achat », mais « **Vous savez déjà où vous vivez ? Lisez aussi ce que votre commune devient.** »
  Réponse à une autre question, pas un add-on tarifaire.
- **Jamais coché par défaut, jamais pré-ajouté, jamais une étape de plus avant paiement.** Une
  ligne discrète, post-décision ou en marge, qui se laisse ignorer sans friction. Un upsell qui
  ralentit la décision du Pack viole ma lentille (coût cognitif > valeur).
- **Honnêteté de pertinence** : ne le proposer avec insistance que si le signal existe (l'utilisateur
  a renseigné/laissé deviner une résidence). Le proposer à froid à quelqu'un qui compare trois
  villes lointaines, c'est du besoin fabriqué.

## Verdict A
- Fourche deux rampes : **CONSTRUIRE (déjà construite) — la garder**, c'est de la vraie valeur.
- Lisibilité : **REFORMULER le nommage** (deux noms par la question), **PAS de nouvelle surface,
  PAS d'écran de choix**. Le bug est lexical, pas architectural.
- Upsell Pack → résidence : **CONSTRUIRE une proposition douce, REFUSER le bundle**. Le refus du
  bundle est déjà acquis structurellement ; reste à border la copy.

---

# B. Rôle du wizard dans le parcours mûri

## L'idée
Le wizard (6 étapes) est la rampe d'engagement de « ma commune » : il implique la personne, puis
montre un aperçu personnalisé (1-2 signaux dévoilés, reste flouté) avant l'ask. Le porteur tient à
cet effet. Question : valeur réelle (lève la disposition à payer) ou étape qui fait fuir ?
Garder / recadrer / repenser ?

## Le vrai besoin
Deux besoins distincts se cachent ici, et il faut les séparer :
1. **Besoin de l'escalier d'engagement** (impliquer → montrer du perso → demander). C'est un
   mécanisme de conversion + une **matérialisation de la question « que devient ma vie ici »**.
   Ce besoin est **réel** : sans implication, l'aperçu perso n'existe pas, et l'aperçu perso est
   ce qui distingue ce rapport d'une fiche générique.
2. **Besoin de voix juste**. Le produit a mûri vers décision + trajectoire ; le teaser est resté
   à un cadrage « exposition / risque » de tout début de projet.

Ne pas confondre les deux. **L'escalier est sain ; sa peau est datée.**

## Valeur pour le lecteur — l'escalier
L'escalier crée de la valeur **si et seulement si** l'aperçu perso fait sentir « on a compris MA
situation » (le cœur du besoin de l'archétype : la paix de ne rien avoir oublié). C'est sa
justification décisionnelle. **MAIS** : que l'escalier **lève la disposition à payer** est une
**hypothèse, pas un fait**. Il peut tout aussi bien ajouter 6 étapes qui font fuir. On ne sait
pas — et on a les événements pour le savoir (voir « ce qu'on ne sait pas »).

## Le coût de complexité — et un coût doctrinal grave
Au-delà du coût « 6 étapes », il y a **deux passifs précis** :

1. **Violation directe de l'invariant n°2.** `WizardTeaser.tsx` l.211 affiche
   **`Score ${score}/100 · exposition élevée`**. C'est un **score synthétique communal** — exactement
   ce que l'arbitrage `comparateur-un-moteur-trois-portes.md` vient de **tuer** dans le legacy, en
   citant l'invariant n°2. Le wizard est le **dernier endroit du produit** qui affiche encore un
   score. Ce n'est pas une préférence de ton : c'est un invariant violé, donc un arbitrage de fond
   (au sens de `invariants.md` : « remonte au porteur »). **À corriger indépendamment de tout le
   reste.**

2. **Régression d'imaginaire vers « site des risques ».** « votre exposition », « N points
   d'attention », « énergivore », « achat à risque », « verrouillé ». `doctrine/positionnement.md`
   est explicite : on **ouvre par le projet de vie, jamais par le danger**, sous peine de basculer
   dans « l'imaginaire site des risques (anxiogène) ». Le teaser fait l'inverse — au **moment le
   plus décisif du parcours** (juste avant le paiement). C'est le **revenu anxiogène** que le
   Business a signalé : une vente obtenue par l'angoisse. Or l'archétype **rejette l'alarmisme** et
   paie la paix **par la rigueur** : un teaser anxiogène vend probablement *moins bien* à CE
   lecteur, pas plus. L'hypothèse « la peur convertit » est doublement coûteuse : elle érode le
   moat ET n'est probablement pas vraie pour cette cible.

3. **Dette de cohérence** : il existe maintenant **deux moteurs narratifs**. La landing
   (`getPreviewCards`, l.618-764) porte la voix mûrie — horizon-aware, trajectoire, sans score. Le
   teaser (`SLUG_HEADLINES_FORT/MODERE`, `dpeFromAge`) porte la **vieille voix** figée. Deux
   dictionnaires à maintenir, deux registres pour le même lecteur. (Le *comment* converger relève
   du Software Architect ; moi je signale que la divergence est un coût.)

## Cohérence avec la vision
- L'escalier d'engagement : **compatible** avec « la décision, pas la compréhension » à condition
  que l'aperçu serve l'arbitrage (que devient ma vie ici), pas la contemplation de données.
- La voix actuelle du teaser : **incompatible** (invariant n°2 violé, invariant n°6 frôlé,
  `doctrine/positionnement.md` contredite). Recadrer n'est donc **pas cosmétique** : c'est aligner
  le moment de conversion sur la transformation promise.

## Où le wizard se situe vs les deux intentions
- Il sert **« ma commune » uniquement** — et c'est **déjà tranché** (`wizard-non-universel.md`,
  `parcours_doctrine.md`). Il croise un profil de personne avec un INSEE unique.
- Il **ne sert pas l'exploration** et **ne doit pas** : la rampe exploration génère depuis l'INSEE
  seul, profil collecté **dans** le rapport payant ; le CTA explorer n'ouvre pas le wizard. La page
  débloquer le confirme (« ne passe jamais par le wizard, doctrine 5.12 »). **Garde-fou** : si
  quelqu'un propose de rendre le wizard universel pour « unifier », c'est un écarté — refuser sans
  rejouer le débat.

## Différenciation et moat
L'escalier rend-il futur•e plus difficile à copier, ou seulement plus riche ? La **mécanique**
(form → preview floutée → paywall) est copiable par n'importe qui — c'est un pattern growth banal.
Ce qui n'est **pas** copiable, c'est **la justesse de l'aperçu perso** (le bon signal, ancré,
honnête, en trajectoire). Donc : la valeur de moat n'est pas dans l'escalier, elle est dans **ce
qu'il révèle**. Un teaser anxiogène et scoré, c'est le pattern copiable SANS le moat. Recadrer la
voix, c'est remettre le moat dans l'escalier.

## L'hypothèse porteuse de mon verdict
**Croyance non dite** : *pour CET archétype (esprit rationnel qui cherche une paix émotionnelle,
rejette l'alarmisme), la rigueur décisionnelle convertit au moins aussi bien que la peur — et la
peur érode l'actif de confiance.* Si cette croyance est fausse (si la peur convertit
nettement mieux, même ici), alors le Business a raison de défendre le registre actuel, et mon
verdict s'inverse. C'est **cette hypothèse**, pas ma conclusion, qu'il faut tester.

## Transformation
La voix actuelle **empêche** la transformation visée (lire un territoire comme une trajectoire,
arbitrer dans l'incertitude) : « points d'attention / exposition » ramène le lecteur à la photo
figée du danger. Une voix recadrée (trajectoire + compromis) fait l'inverse. Donc recadrer sert la
transformation, pas seulement le confort.

## Ce qu'on ne sait pas (à tester AVANT de « repenser profondément »)
- **L'escalier lève-t-il vraiment la disposition à payer ?** Hypothèse non vérifiée. PostHog a déjà
  `wizard_step_viewed` (par étape), `wizard_completed`, `report_generated`. Mesurer : (a) le
  **drop-off par étape** (l'escalier fait-il fuir, et où ?) ; (b) le taux **completed → checkout**
  vs les entrées directes sans wizard.
- **Le registre anxiogène aide-t-il ou nuit-il ?** Seul un A/B (voix « exposition » vs voix
  « décision/trajectoire ») le tranche. Tant qu'on n'a pas la donnée, **ne pas repenser
  profondément** : on ne refait pas un mécanisme dont on n'a pas mesuré la valeur.

## Verdict B
- **RECADRER, pas repenser.** L'escalier d'engagement est **gardé** (besoin réel, structure saine).
- **CORRIGER en priorité et indépendamment** : supprimer le `Score X/100` du teaser
  (`WizardTeaser.tsx` l.211) — **invariant n°2, non négociable**, dernier score résiduel du produit.
- **RECADRER la voix** du teaser vers décision + trajectoire (sortir de « exposition / points
  d'attention / énergivore / achat à risque »). Le **quoi** (sortir du registre risque) est mon
  ressort ; le **comment exact des phrases** est celui de **l'Editorial**.
- **DIFFÉRER** tout « repenser profondément » jusqu'à la lecture PostHog du drop-off et un A/B de
  voix. Le besoin (escalier d'engagement) **reste au vault** comme acquis ; c'est la refonte qui
  est parquée, pas le besoin.
- **CONVERGER** les deux moteurs narratifs (teaser ↔ landing) : signalé comme dette ; arbitrage
  technique au Software Architect.

---

# Frontières (2e vague)
- **Moi (Product, quoi/valeur)** : les deux rapports sont distincts et tous deux légitimes ; fourche
  par le moment, pas par un écran ; nommer par la question ; proposer-jamais-imposer le rapport de
  résidence ; garder l'escalier du wizard ; tuer le score (invariant) ; sortir du registre risque ;
  différer la refonte tant qu'on n'a pas la donnée.
- **Design Critic (comment/écran)** : hiérarchie des deux CTA au hero ; pattern blur/lock du teaser ;
  1 ou 2 signaux dévoilés ; placement visuel de la proposition « rapport de résidence » dans le Pack.
- **Editorial (la voix)** : libellés exacts des deux rapports ; remplacement de « Analyser ma
  commune » ; réécriture des headlines du teaser (« exposition » → décision/trajectoire) ;
  formulation de l'upsell par la question.

# Tension avec le Business (nommée, non tranchée)
- **Escalier d'engagement** : le Business le défend comme rampe de conversion (revenu) ; moi je le
  garde MAIS subordonne sa *voix* à l'invariant. Accord sur la structure, désaccord potentiel sur
  le registre.
- **Registre anxiogène** : le Business peut arguer que « la peur convertit ». Moi : pour cet
  archétype, la rigueur convertit et la peur érode le moat. **Non résolu** → A/B de voix + PostHog.
- **Upsell Pack → résidence** : le Business voudra le rendre visible/insistant (panier) ; moi je le
  veux discret et cadré par la question (jamais coché, jamais une étape de plus). → matériau `/board`.

# Mise à jour de doctrine proposée (à écrire par Claude principal)
- **Nouvel `arbitrages/deux-rapports-residence-vs-exploration.md`** : graver que futur•e a DEUX
  rapports distincts par la **question** (« que devient ma vie ici » vs « ce lieu tient-il la
  route »), fourche par le **moment** (verbe du hero), **pas d'écran de choix**, nommage distinct,
  le Pack **propose sans imposer** le rapport de résidence (jamais bundle/coché). Victoire produit :
  complexité d'un 3e écran évitée, collision lexicale corrigée.
- **Addendum à `arbitrages/comparateur-un-moteur-trois-portes.md`** ou note dans
  `principes/invariants.md` (usage) : le `Score X/100` du `WizardTeaser` est le **dernier score
  résiduel** ; sa suppression clôt l'application de l'invariant n°2.
- **`/memory/parcours_doctrine.md`** : ajouter que la voix du teaser doit suivre la voix mûrie
  (trajectoire/décision), et que toute « refonte profonde du wizard » est **parquée** jusqu'à
  donnée PostHog (drop-off) + A/B de voix.

---

# Si refus/report rédigés comme victoires produit
- **Écran « choisissez votre rapport » : NON construit.** Complexité d'une fourche explicite
  évitée ; le moment (verbe du hero) décide à la place du lecteur, sans lui imposer un arbitrage de
  catalogue. Parcours préservé.
- **Bundle forcé Pack + résidence : refusé** (déjà structurellement). On garde une proposition par
  la question, ignorable sans friction. La décision du Pack n'est pas alourdie.
- **Refonte profonde du wizard : différée**, pas supprimée. Le besoin (escalier d'engagement) reste
  au vault ; on ne reconstruit pas un mécanisme dont la valeur n'est pas mesurée.

# Mes quatre questions de clôture
1. **Reconstruirait-on ça de zéro aujourd'hui ?** Les deux rapports : **oui** (deux questions
   réelles). L'escalier du wizard : **oui, mais avec la voix mûrie d'emblée**, pas la voix
   « exposition » de 2026-début. Le `Score X/100` : **non, jamais** (on ne le reconstruirait pas).
2. **Qu'est-ce qu'on perd si on supprime ?** Supprimer le wizard = perdre la matérialisation de
   « que devient ma vie ici » et l'aperçu perso (le ressenti « on m'a compris ») → on garde.
   Supprimer le score = on ne perd **rien** (un signal inerte non conforme) → on supprime.
   Supprimer la distinction des deux rapports = on perd deux contrats narratifs → on garde.
3. **Version dix fois plus simple ?** Pour A : **oui** — pas un nouvel écran, juste deux noms et un
   verbe juste. Pour B : recadrer la voix > repenser le mécanisme. La version simple est ici la
   bonne.
4. **Plus difficile à copier, ou seulement plus riche ?** L'escalier *mécanique* = copiable.
   L'aperçu *juste, en trajectoire, sans score* = moat. Recadrer met le moat dans l'escalier.

# Si j'étais le gardien du produit
Je garderais les deux rapports et la fourche par le moment, je leur donnerais **deux noms par la
question** (sans créer d'écran de choix), je proposerais le rapport de résidence dans le Pack
**comme une autre question, jamais comme un add-on de panier**. Je **tuerais immédiatement le
`Score X/100`** du teaser (invariant), je **recadrerais sa voix** hors du registre « exposition »,
et je **ne toucherais pas au mécanisme** de l'escalier tant que PostHog n'a pas dit s'il convertit
et où il fait fuir.

# Quand rouvrir ce sujet
- **Rouvrir B (refonte) si** : le drop-off PostHog par étape du wizard est élevé (l'escalier fait
  fuir avant l'ask) ; OU l'A/B « voix exposition vs voix décision » montre que le recadrage fait
  chuter la conversion de façon nette et reproductible (alors mon hypothèse porteuse est fausse,
  le Business a raison, on réévalue).
- **Rouvrir A (nommage/upsell) si** : des sondes/entretiens montrent que des visiteurs confondent
  encore les deux rapports après renommage, OU que l'upsell résidence dans le Pack est perçu comme
  forcé (taux d'abandon du Pack qui monte après son introduction).
- **Rouvrir le garde-fou wizard-non-universel si** : le pivot B2B (CGP/assureurs/notaires) arrive
  avec une adresse + un besoin de profil sur un lieu non-résidence — alors « profil × INSEE
  non-résidence » redevient une question ouverte légitime.
- **Ne PAS rouvrir** : la suppression du score (définitive) et le refus du bundle forcé (invariant
  de simplicité), sauf changement de nature du produit.
