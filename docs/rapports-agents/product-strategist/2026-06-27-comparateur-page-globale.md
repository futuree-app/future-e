# Rapport Product Strategist — Page comparateur « mode choix » (résultat)

- **Date** : 2026-06-27
- **État** : `main` (99ab154), 4 retouches post-analyse ChatGPT
- **Rendu** : http://localhost:3000/comparateur?communes=56121,35238
- **Terrain lu** : `vision/archetype-lecteur.md`, `vision/positionnement.md`, `vision/manifeste.md`,
  `doctrine/positionnement.md`, `principes/invariants.md` (n°1, 2, 4, 5),
  `arbitrages/comparateur-un-moteur-trois-portes.md`, `arbitrages/pricing-abonnements-reportes.md`.
- **Code lu** : `comparateur/page.tsx`, `ThemeExplorer.tsx`, `ModeChoixSynthese.tsx`,
  `ModeChoixAsk.tsx`, génération `arbitrage` dans `lib/comparateur-vie.ts` (l.1366-1407).

---

## Recadrage liminaire : « visibilité de la valeur » est un mot de conversion, pas un mot de valeur

Le diagnostic ChatGPT (« tu n'as pas un problème de prix, tu as un problème de visibilité de la
valeur ») est une **lentille business** (pourquoi le lecteur n'achète-t-il pas ?). Ma question
n'est pas celle-là. La mienne : le lecteur **perçoit-il honnêtement** ce qu'il y a derrière le
mur, ou doit-il deviner ? C'est une question d'honnêteté du signal (invariant n°5 : ne pas
surpromettre, mais aussi ne pas sous-montrer), pas de taux de clic.

La distinction commande tout le reste. Si le lecteur perçoit bien la profondeur mais n'achète pas,
c'est un sujet 100 % Business. Si le lecteur ne peut **pas savoir** ce qu'il achète, c'est un
sujet produit. Mon verdict : la page répond **déjà** au sujet produit. Ce que ChatGPT veut ajouter
relève du sujet business — et le fait avec les mauvais outils.

---

## (a) Le rejet de la grande section inventaire : VICTOIRE PRODUIT, à graver

**Tu as eu raison, et pas pour une raison de goût.** Les badges « ✓ 27 dimensions, ✓ centaines
d'indicateurs » vendent le **dataset**, pas l'arbitrage. C'est frontalement contraire à
`doctrine/positionnement.md` : « Les gens achètent un arbitrage, pas une liste de datasets ni un
danger. » Et à l'invariant n°4 : une donnée n'a de valeur que si elle aide une décision — un
compteur d'indicateurs est une donnée vraie mais **inerte**, exactement ce que l'invariant
interdit. « Centaines d'indicateurs » tombe en plus dans le piège du nombre rond qui devient faux
(doctrine : « plus de 30 serait un mensonge »).

La démo de thème flouté est **redondante** avec ce qui existe déjà. Le `ThemeExplorer` EST la démo
— mais en mieux : il dévoile **un vrai thème gratuit** (la vraie grammaire paliers + avantages
relatifs via `ThemeMatrix`) et montre le **contour réel** des autres (« N critères comparés » +
les labels : `Chaleur · Nuits tropicales · Feu`). Un flou ne montre rien ; il aguiche. Le lecteur
qui ouvre le thème gratuit **expérimente** la profondeur (« ah, chaque thème est une matrice de
paliers, pas un paragraphe »). C'est une preuve **vécue**, pas **assénée** — et l'archétype rejette
explicitement les « promesses technologiques vides ». La preuve vécue est plus convaincante ET plus
honnête pour cet esprit rationnel.

La contradiction de ChatGPT (« allège » puis empile 4 sections) n'est pas un détail : c'est le
réflexe même que j'existe pour arrêter. « Rendre la valeur visible » s'est traduit en « ajouter de
la surface ». C'est le mécanisme de fabrication de complexité.

**Mais je ne suis pas qu'un gardien — le besoin sous le diagnostic est réel.** Le lecteur doit
pouvoir distinguer « le Pack est plus profond » de « le Pack, c'est 6 thèmes qui ressemblent au
premier ». Question honnête : est-ce que cette peur de ChatGPT est *fausse* ? Pas tout à fait. Si
le thème gratuit affiche déjà la `ThemeMatrix` complète, alors la valeur ajoutée du Pack par thème
est… la **même** matrice pour les 6 autres thèmes + les narratifs. La vérité du Pack, c'est de la
**largeur** (tous les thèmes), pas une profondeur cachée. **Le bon réflexe n'est donc pas de
simuler une profondeur cachée avec des badges, c'est de dire honnêtement que la valeur est la
couverture complète.** Et c'est exactement ce que fait le CTA actuel : « reprend les sept thèmes
critère par critère ». C'est vrai, sobre, non trompeur. Aucune section d'inventaire nécessaire.

**Différenciation / moat (le point que j'oublie d'habitude, ici décisif).** Les badges « 27
critères » sont **trivialement copiables** : tout comparateur affiche son compteur de features.
L'expérience « un vrai thème dévoilé + phrase d'arbitrage conditionnelle + zéro score » exige le
moteur qualitatif et le firewall (aucune fuite de chiffre) : difficile à copier. Ajouter
l'inventaire aurait fait ressembler futur•e à n'importe quel comparateur faisant son marketing au
nombre de données. **Le rejet protège le moat, pas seulement la sobriété.**

> À graver dans `arbitrages/` : « inventaire-valeur-pack-ecarte » — la profondeur du Pack se
> *prouve en la faisant vivre* (un thème réel + le contour honnête des autres), jamais en
> l'assénant par des badges de comptage ; les badges vendent le dataset (contre
> `doctrine/positionnement`, invariant n°4) et sont copiables (érosion du moat).

---

## (b) La phrase de hiérarchisation : la MEILLEURE retouche, pas un gadget

« Si X compte d'abord pour vous, A prend l'avantage ; si vous regardez surtout Y, B reprend la
main. » C'est le cœur même du métier du lecteur : **arbitrer**. La forme conditionnelle rend le
critère au lecteur (invariant n°1 : on ne décide pas à sa place) et incarne « les compromis
plutôt que des certitudes » (archétype). Ce n'est pas un ornement : c'est la traduction la plus
pure de la promesse « la décision, pas la compréhension ».

**Une réserve à tester, pas à asséner.** La phrase est déterministe (`lib/comparateur-vie.ts`
l.1370-1388) : elle apparie le « thème de tête » de chaque commune par force de lead. La pénalité
anti-niche (`LOW_RELEVANCE_DIMS`) s'applique au thème **par défaut** de l'explorateur, **pas** à
cette phrase. Risque : la phrase peut apparier sur un thème statistiquement mené mais pas
réellement ce qui préoccupe le lecteur, produisant un « si X / si Y » juste mais tiède. La forme
conditionnelle protège (le lecteur s'auto-sélectionne : « si X compte POUR VOUS »), mais ne
garantit pas la résonance. **Hypothèse porteuse à tester** (PostHog / qual) : la paire de thèmes
proposée correspond-elle à ce qui départage vraiment le lecteur, ou faut-il pondérer l'appariement
par la pertinence décisionnelle comme on l'a fait pour le thème par défaut ?

Verdict : **garder, surveiller la qualité de l'appariement.** C'est le signal le plus distinctif
de la page.

---

## (c) Le moment Ask futur•e : bien placé, mais surveiller son instrumentalisation

Ask arrive en étape 6/7, après l'explorateur, juste avant le mur. Le commentaire du code l'assume :
« au point de curiosité maximale, avant le paywall ». Les chips sont décisionnelles (« le pari le
plus sûr sur 20 ans », « vieillira le mieux face au climat de 2050 »). C'est la surface la plus
décisionnelle de la page : elle laisse le lecteur poser **sa** question idiosyncratique — « et le
bruit ? », « et si je vieillis ici ? » — qui n'est dans aucun thème. C'est exactement le besoin
fondateur de l'archétype : « qu'est-ce que je risque d'oublier ? »

**Deux points de tension que je signale honnêtement.**

1. **Ask comme consolation du verrou, puis comme entonnoir.** La copie au 402 (« la comparaison
   complète prend le relais ») fait d'Ask un dispositif de conversion. Deux questions gratuites qui
   répondent à la vraie inquiétude du lecteur = vraie valeur. Plafonner à 2 l'interaction la plus
   précieuse (la question PROPRE du lecteur) pour pousser le Pack, c'est précisément là où ma
   lentille (valeur) diverge de celle du Business (conversion). Le cap à 2 est défendable (coût,
   budget partagé avec /ou-vivre), mais c'est un levier de rareté, pas un cadeau.

2. **Placement.** Ask étant la surface la plus décisionnelle, l'enterrer en avant-dernière position
   après une page longue la traite en outil d'entonnoir plus qu'en pièce maîtresse. Je ne la
   déplacerais PAS sans données (remonter casserait le crescendo et le relais paywall). Mais c'est
   un vrai arbitrage quoi/quand de ma lentille. **À instrumenter** : les 2 questions sont-elles
   utilisées ? avant ou après l'explorateur ? le 402 convertit-il ou frustre-t-il ?

Verdict : **placement défendable, garder ; surveiller que la copie du 402 reste utile et non
coercitive.**

---

## Le point qu'on ne m'a pas demandé mais que ma lentille relève : le narratif streamé

Dans `ModeChoixSynthese`, sous la phrase d'arbitrage (la ligne décisionnelle nette) se trouve un
**second** registre de synthèse : le narratif IA streamé en machine à écrire (commentaire du code :
« effet wow »). « Effet wow » est le drapeau exact de mon métier — le séduisant qui doit justifier
sa charge. Deux registres de synthèse empilés (arbitrage tranchant + narratif mou « Ces communes ne
proposent pas la même vie… »). Question : le narratif streamé ajoute-t-il de la **valeur
décisionnelle** au-delà de la phrase d'arbitrage + les cartes identité/compromis, ou est-il
l'ornement pendant que la phrase d'arbitrage est la substance ? Je ne tranche pas (la forme
machine-à-écrire est la lentille du Design Critic), mais **l'existence d'un bloc de prose qui
double la synthèse** est mon territoire, et je le signale comme le candidat n°1 à « ce qui pourrait
ne pas exister sans que le lecteur y perde » — bien plus que l'absence de section inventaire.

---

## Cohérence vision / invariants

- **« La décision, pas la compréhension »** : la page est conforme. Arbitrage conditionnel, Ask sur
  la vraie inquiétude, CTA « laquelle correspond à votre façon d'habiter » — tout est décisionnel.
- **« Pas un SIG, pas une app green »** : le rejet des badges de comptage PROTÈGE cet axe. Les
  badges auraient basculé vers le dashboard d'indicateurs.
- **Invariant n°2 (pas de score)** : respecté, firewall préservé dans Ask et la matrice.
- **Invariant n°4 (donnée inerte interdite)** : c'est l'argument central contre l'inventaire ; le
  compteur « N critères » survit parce qu'il est accompagné des **labels** (contour réel du thème),
  pas un nombre flottant. Si on devait alléger, garder les labels, le compteur est l'accessoire.

---

## L'hypothèse porteuse de mon verdict (nommée)

**La perception de profondeur d'un lecteur rationnel se construit mieux en lui faisant EXPÉRIMENTER
un thème réel + voir le contour honnête des autres, qu'en lui ASSÉNANT la profondeur par des
compteurs.** Si cette croyance est fausse — si les lecteurs n'extrapolent pas du thème gratuit vers
le Pack et ont besoin d'un échafaudage explicite — alors un échafaudage **minimal** (une phrase,
pas une section) pourrait se justifier. C'est la couture testable. À vérifier avant de rouvrir le
sujet : PostHog (ouverture du thème gratuit → scroll vers CTA → clic) ou une sonde « avez-vous
compris ce que contient le Pack ? ».

---

## Verdict global

- **Phrase de hiérarchisation** : CONSTRUIRE (déjà fait) — meilleure retouche. Surveiller la
  qualité de l'appariement de thèmes.
- **Compteur + labels sur cartes verrouillées** : CONSTRUIRE (déjà fait) — la réponse SOBRE et
  honnête au vrai besoin sous « visibilité de la valeur ». Les labels font le travail, pas le
  compteur.
- **Conclusions de thème honnêtes + CTA recentré** : CONSTRUIRE (déjà fait) — conformes invariant 5
  et `doctrine/positionnement`.
- **Grande section inventaire / badges / démo floutée** : REFUSER — fausse bonne idée, vend le
  dataset, copiable, contre invariant n°4 et `doctrine/positionnement`. Rejet = victoire produit.
- **Narratif streamé « effet wow »** : À INTERROGER — candidat à la suppression (double la
  synthèse), au-dessus de l'inventaire dans l'ordre des priorités de simplification.

---

## Tension explicite avec le Business Strategist

| Sujet | Ma lentille (valeur lecteur) | Lentille Business (conversion) |
|---|---|---|
| Badges « 27 dimensions » | Vend le dataset, copiable, contre invariant n°4. Refuser. | Rend la valeur « visible », peut lever le doute à l'achat. |
| Cap Ask à 2 questions | La question propre du lecteur est sa surface la plus précieuse ; la plafonner pour pousser le mur, c'est là que ça pince. | 2 free = teaser calibré, le 402 est un point de conversion. |
| Profondeur du Pack | Honnêteté : la valeur est la LARGEUR (tous les thèmes), le dire franchement. | Tentation de survendre une profondeur cachée pour justifier 39 €. |

Aucune de ces tensions n'est tranchée ici : c'est le matériau d'un `/board` (Product vs Business).
Je porte la valeur et la sobriété ; je signale que sur le **cap Ask** et le **placement**, ma
lentille n'est peut-être pas seule à pondérer.

---

## Mise à jour doctrine proposée

- **Nouvel `arbitrages/inventaire-valeur-pack-ecarte.md`** : la profondeur se prouve en la faisant
  vivre (un thème réel + contour honnête), jamais par badges de comptage (dataset, copiable, contre
  invariant n°4 et `doctrine/positionnement`). Lever de réouverture : sonde montrant que les
  lecteurs n'extrapolent pas du thème gratuit.
- **`modules/comparateur.md`** : noter que la phrase d'arbitrage conditionnelle est le signal
  décisionnel central du mode choix, et que son appariement de thèmes reste à valider (pertinence
  vs force de lead).

---

## Quatre questions de clôture

1. **Reconstruirait-on ça de zéro aujourd'hui ?** La phrase d'arbitrage, le thème gratuit dévoilé,
   le contour des verrouillés, Ask : oui, sans hésiter, c'est l'incarnation de la promesse. La
   section inventaire : non. Le narratif streamé : à reconsidérer.
2. **Qu'est-ce qu'on perd si on supprime l'inventaire (jamais construit) ?** Rien que le lecteur
   regrette : un échafaudage de comptage que l'archétype rejette. On perd un argument de vente
   copiable. On garde le moat.
3. **Version 10× plus simple du besoin « visibilité de la valeur » ?** Elle existe déjà : un vrai
   thème dévoilé + les labels des thèmes verrouillés + un CTA honnête sur la largeur. Pas de
   nouvelle surface.
4. **Plus difficile à copier, ou seulement plus riche ?** Les retouches gardées (arbitrage
   conditionnel, contour honnête, Ask) rendent futur•e plus difficile à copier. L'inventaire
   rejeté ne l'aurait rendu que plus riche, et de façon copiable.

---

## Si j'étais le gardien du produit

Je ne construirais pas la section inventaire — la profondeur se prouve en la faisant vivre, pas en
la comptant ; et avant de toucher quoi que ce soit d'autre, j'interrogerais le narratif streamé
« effet wow » qui double la phrase d'arbitrage, et je testerais si le cap d'Ask à 2 questions sert
le lecteur ou seulement le funnel.
