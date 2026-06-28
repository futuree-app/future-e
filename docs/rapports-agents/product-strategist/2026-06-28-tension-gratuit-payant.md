# Rapport Product Strategist — La tension gratuit / payant est-elle réelle ?

> Date : 2026-06-28. Question confiée (porteur) : le gratuit produit-il un vrai moment de
> valeur, ET rend-il évident, honnêtement, ce qui reste indécidable sans le Pack ?
> Phrase-étalon à confronter au réel : « Les trois communes sont crédibles. Mais la décision se
> joue maintenant sur la mobilité, les services, la santé environnementale et leur trajectoire,
> et je ne connais pas encore la réponse. »
> Lecture du CODE réel (pas d'abstraction) + doctrine vault. Read-only, je ne construis rien.

## Surfaces lues (vérité du code)

- Découverte gratuite : `src/app/(public)/ou-vivre/OuVivreClient.tsx` (panneau « Ce que nous
  avons compris » l.265-413 ; cartes réponses l.1156-1233 ; synthèse l.1237-1260 ; upsell Pack
  l.1283-1319 ; AskFuture 2 questions l.1322-1420).
- Synthèse gratuite (le « miroir ») : `src/app/api/comparateur-vie/synthesize/route.ts`
  (SYSTEM l.55-193 : « créer l'effet ce produit a compris mon projet », « avare sur le détail
  des communes », « le manque crée la curiosité »).
- Comparateur mode choix gratuit : `src/app/(public)/comparateur/page.tsx` (arbitrage l.142 ;
  face-à-face l.147-167 ; explorateur l.170 ; AskFuture l.173 ; upsell l.190-203),
  `ModeChoixSynthese.tsx` (phrase d'arbitrage 26px, narratif IA retiré par le board), 
  `ThemeExplorer.tsx` (1 thème ouvert + cartes verrouillées, règle « 2 thèmes max »),
  `ThemeMatrix.tsx` (paliers + avantage relatif), `ModeChoixAsk.tsx` (2 questions).
- Paywall territoire 14 € : `src/app/(public)/territoire/[insee]/debloquer/page.tsx`.
- Pack 39 € : `pack-decision/PackConvictionView.tsx` (aperçu tronqué 2 thèmes + « 5 autres
  thèmes une fois débloqué », bundle).
- Doctrine : `vision/archetype-lecteur.md`, `vision/positionnement.md`,
  `arbitrages/comparateur-un-moteur-trois-portes.md`.

---

## 1. Le gratuit produit-il un vrai moment de valeur ? OUI, et il est bien situé.

Le moment de valeur existe et il est même doublé. À nommer précisément :

- **Le miroir (« il m'a compris »).** Dans `/ou-vivre`, le panneau « ✓ Ce que nous avons
  compris » affiche la reformulation du projet en serif 19px, TOUJOURS visible (l.293-299), avec
  les critères en chips. Le prompt de synthèse est explicitement réglé pour ça (« créer l'effet
  ce produit a compris mon projet », route synthesize l.61). C'est le vrai « ah » : le lecteur
  se sent reconnu. C'est exactement le bénéfice émotionnel de l'archétype (« la tranquillité de
  décider sans l'impression d'avoir oublié »). Solide.

- **La tension nommée (mode choix).** Dans `/comparateur`, la phrase d'arbitrage en 26px
  (`ModeChoixSynthese`) NOMME sur quoi se joue le départage sans le trancher. C'est, mot pour
  mot, la PREMIÈRE moitié de la phrase-étalon : « les trois sont crédibles, mais ça se joue sur
  X ». Le board a retiré le narratif IA qui « dénouait le choix » (commentaire l.14-17) : geste
  doctrinal juste, anti-cannibalisation.

- **La grammaire en action (un thème dévoilé).** `ThemeExplorer` ouvre par défaut le thème de
  divergence (`comparaison.divergence`, page l.126) et montre la vraie matrice : paliers absolus
  + « Avantage X » + cellule leader en accent. Le lecteur VOIT comment le comparateur tranche,
  sur le thème qui le concerne. Utile, pas une démo creuse.

Verdict face 1 : **le gratuit n'est pas une coquille**. Il y a un vrai moment de valeur, et il
sert la décision (pas la contemplation). Rien à refuser ici.

---

## 2. Le gratuit rend-il évident ce qui reste INDÉCIDABLE ? Partiellement, et de la mauvaise façon.

C'est ici que je tranche un problème de fond. **Le produit produit aujourd'hui une tension de
RICHESSE (« il y a plus à voir », « vous avez atteint votre quota »), pas une tension
DÉCISIONNELLE (« la décision se joue sur X, et vous ne connaissez pas encore X »).** La
phrase-étalon n'est donc reproduite qu'à moitié.

### Où le gratuit montre l'indécidable (bien)

- `ThemeExplorer` est la meilleure surface : les cartes verrouillées affichent le NOM des thèmes
  cachés + « N critères comparés » + les libellés des critères (l.90-93). Le lecteur voit le
  TERRITOIRE de l'inconnu (« Mobilité », « Services »…). C'est concret.
- Le paywall 14 € est honnête sur le « pourquoi payant » (« vous payez le croisement, pas
  l'accès aux données », debloquer l.171-175). Bon.

### Où il NE le montre pas, alors qu'il le devrait

1. **L'upsell vend de la quantité, pas l'inconnu décisif.** L'upsell `/ou-vivre` (l.1298-1301)
   dit « les trois territoires sur l'ensemble des critères » ; celui du comparateur (page
   l.192) « les sept thèmes critère par critère ». Le Pack (`PackConvictionView`) promet « 5
   autres thèmes une fois débloqué » (l.105). C'est un argument de COMPLÉTUDE. Or l'archétype ne
   paie pas pour « tout voir », il paie pour « ne pas avoir oublié l'ESSENTIEL ». La copy ne
   nomme jamais, pour CE lecteur, le thème précis où ses communes divergent et qu'il n'a pas
   ouvert. La deuxième moitié de la phrase-étalon (« et je ne connais pas encore la réponse »)
   n'est jamais prononcée.

2. **`/ou-vivre` n'a AUCUNE surface de divergence par thème.** Les cartes montrent un
   « Compromis : … » par commune (l.1213-1217), pas « voici le thème qui les départage ». Le
   moteur connaît pourtant la divergence (utilisée dans le comparateur). Le parcours découverte
   — le plus fréquenté — laisse donc le lecteur sans la tension « ça se joue sur X ».

3. **La trajectoire, mot porteur de l'étalon, est quasi absente du cadrage de tension.** Le
   gratuit montre des paliers de PRÉSENT (qualitatif, « faible/modéré/élevé »). Le « ce que ça
   DEVIENT » — la lecture-trajectoire qui est le cœur de la transformation de l'archétype (« il
   ne lit plus un territoire comme une photo, il le lit comme une trajectoire ») et le moat le
   plus dur à copier — n'est jamais dramatisé comme la limite honnête du gratuit. On ne dit
   jamais « vous avez vu ce qu'elles SONT, pas ce qu'elles DEVIENNENT ».

---

## 3. Cannibalisation ou frustration artificielle ? Je tranche : ni l'un ni l'autre proprement.

- **Cannibalisation : non, le gratuit est honnêtement retenu** (narratif dénoueur retiré,
  synthèse « avare sur le détail », matrice complète interdite par l'arbitrage). Sur cet axe, le
  board a bien travaillé — peut-être même trop : le miroir + 3 cartes forces/compromis + 2
  questions AskFuture peuvent SUFFIRE à apaiser l'inquiétude de présent, et le lecteur repart
  « merci, j'ai compris l'essentiel » parce que la tension de FUTUR n'a jamais été rendue vive.
  Ce n'est pas une cannibalisation par excès d'information, c'est une **désamorce par défaut de
  tension** : le risque réel.

- **Frustration artificielle : oui, sur un point précis — la règle « 2 thèmes max ».**
  `ThemeExplorer` interdit d'ouvrir un 3e thème après un clic (l.15-32). C'est un QUOTA, pas une
  limite honnête. Le lecteur n'a pas reçu un « vous ne connaissez pas X », il a reçu « vous avez
  épuisé vos dévoilements ». L'archétype (rationnel, « rejette les outils qui paraissent
  crédibles sans l'être ») peut lire ça comme un rationnement arbitraire et rebondir. Le cap 2
  questions AskFuture a la même odeur mais se défend par le coût compute ; le cap thèmes ne se
  défend par rien de réel (la donnée est déjà calculée et envoyée au client).

**Synthèse du verdict : le gratuit ne résout pas trop ; il tensionne mal.** Il crée de la
curiosité (« il y a plus ») et un quota (« vous avez atteint la limite ») là où il devrait créer
un manque décisionnel nommé (« la décision se joue sur la mobilité / la santé / leur trajectoire,
et tu ne l'as pas encore vu »). « Les trois sont crédibles » est livré. « Et je ne connais pas
encore la réponse » ne l'est pas.

---

## 4. Cinq propositions concrètes — sans nouveau critère, sans nouveau module

Toutes s'appuient sur de la donnée DÉJÀ calculée par le moteur (`comparaison.divergence`,
`ligne.avantage`, les `synthese` de thème). Zéro surface en plus.

1. **Convertir l'upsell de la quantité vers l'inconnu nommé.** Remplacer « l'ensemble des
   critères » / « les sept thèmes critère par critère » par les 2-3 thèmes où le trio diverge
   réellement et que le gratuit n'a pas ouverts. Copy cible : « Vous avez vu qu'elles se
   départagent sur la mobilité. Restent les services, la santé environnementale et leur
   trajectoire — là où, sur VOS communes, l'écart est réel et que vous n'avez pas encore vu. »
   C'est la phrase-étalon, générée déterministement. (Touche `OuVivreClient` l.1298 et
   `comparateur/page.tsx` l.192.)

2. **Rendre le verrou honnête : un signal de divergence par thème caché.** Dans les cartes
   verrouillées de `ThemeExplorer`, remplacer « N critères comparés » (quantité) par un mot dérivé
   du `avantage` déjà calculé : « Les communes s'écartent ici » vs « Profils proches ici ». Le
   lecteur voit alors que le Pack vaut le coup LÀ OÙ ça diverge, et que les thèmes où elles sont
   identiques ne sont pas retenus en otage. Tue l'odeur de rationnement. (Rendu exact = frontière
   Design Critic, à lui renvoyer.)

3. **Faire de la trajectoire l'arête du gratuit.** Ajouter UNE ligne (synthèse ou upsell) : le
   gratuit dit ce que ces lieux SONT, le Pack ce qu'ils DEVIENNENT. C'est la limite la plus
   honnête (un lecteur ne l'obtient ni dans le gratuit ni sur une page SEO concurrente) et le
   moat le plus vrai. Aucune donnée nouvelle : la trajectoire vit déjà dans le rapport/Pack.

4. **Reconsidérer le quota « 2 thèmes max » au profit d'une porte de PROFONDEUR.** Laisser le
   lecteur lire la `synthese` (une phrase) de TOUS les thèmes — elle existe déjà, elle est même
   montrée dans l'aperçu du Pack (`PackConvictionView` l.99-103) — mais garder la MATRICE
   critère par critère verrouillée. On échange un quota (malhonnête) contre une porte de
   profondeur (honnête : « vous payez le croisement », cohérent debloquer l.171-175). Le lecteur
   voit la forme de chaque tension, paie le détail des paliers.

5. **Porter la divergence dans `/ou-vivre` aussi.** Le parcours découverte n'a aucune surface
   « ça se joue sur X ». Injecter le thème le plus divergent (déjà connu du moteur) dans l'upsell
   `/ou-vivre` : « Sur vos trois territoires, c'est surtout la mobilité qui les sépare — et vous
   ne l'avez pas encore vue. » La phrase-étalon, déterministe, dans le parcours le plus fréquenté.

---

## L'hypothèse porteuse (la croyance non dite de mon verdict)

Mon verdict repose sur la croyance que **l'inquiétude du lecteur est DÉCISIONNELLE (« ai-je
oublié un facteur décisif ? ») et non INFORMATIONNELLE (« y a-t-il plus à lire ? »).** Si, en
réalité, le moteur d'achat est l'anxiété de complétude (« avant d'engager une maison je veux
TOUT voir »), alors le cadrage actuel par la quantité (« l'ensemble des critères », « 5 autres
thèmes ») pourrait convertir MIEUX que mon cadrage par l'inconnu nommé. Je penche pour la
première (c'est l'archétype documenté), mais c'est une hypothèse, pas un fait.

## Transformation

Le cadrage actuel ajoute une CAPACITÉ (« voir plus »). Le cadrage « inconnu nommé + trajectoire »
change la FAÇON de décider : il apprend au lecteur que sa décision se joue sur un point précis
qu'il n'avait pas vu, et que la question n'est pas « laquelle est la meilleure » mais « qu'est-ce
que chacune devient ». C'est la transformation de l'archétype, pas un ornement.

## Différenciation / moat

Un concurrent (comparateur de villes SEO) sait afficher « 7 thèmes, 27 critères » : la quantité
est copiable. Il ne sait PAS dire « sur VOS communes, la décision se joue sur la trajectoire de
la santé environnementale ». Le cadrage par l'inconnu décisionnel + la trajectoire rend futur•e
plus DUR à copier, pas seulement plus riche. (Affirmation concurrents = hypothèse, à vérifier
WebFetch avant de la graver.)

## Tension avec le Business Strategist (à porter au /board, non tranchée)

Mes propositions 1, 3 et surtout 4 DONNENT PLUS gratuitement (synthèses de tous les thèmes,
trajectoire évoquée, inconnu nommé). Le Business dira : risque de « merci j'ai compris, je
pars », et le quota « 2 thèmes » est un levier de conversion à ne pas lâcher. Ma lentille dit
l'inverse : le quota convertit le curieux mais fait fuir l'archétype rationnel qui flaire le
rationnement ; la tension honnête convertit le BON lecteur. Aucun de nous deux n'a raison a
priori — c'est un A/B de funnel, pas un débat de doctrine. Matériau pour `/board`.

## Ce qu'on ne sait pas (et comment l'apprendre AVANT de construire)

- **Le « merci j'ai compris, je pars » existe-t-il vraiment ?** PostHog : funnel résultats→Pack,
  temps passé après résultats, usage AskFuture avant rebond. L'arbitrage lui-même note « à
  confirmer sur données une fois le funnel instrumenté ».
- **Nommer le thème divergent augmente-t-il les clics Pack vs « l'ensemble des critères » ?**
  A/B sur la seule copy d'upsell : le test le moins cher, livrer les deux versions.
- **Le verrou « 2 thèmes » provoque-t-il un drop-off au moment du clic verrouillé ?** Event
  PostHog sur clic-carte-après-quota.

## Mise à jour de doctrine (prête à écrire par Claude principal)

- `modules/comparateur.md` : graver la distinction « tension de richesse vs tension
  décisionnelle » et la règle « l'upsell nomme l'inconnu décisif du lecteur, jamais une
  quantité ».
- Candidat `arbitrages/` : « la tension gratuit→payant se cadre par l'inconnu nommé et la
  trajectoire, pas par le quota » (si le porteur tranche en ce sens après A/B).

---

## Mes quatre questions de clôture

1. **Reconstruirait-on ça à partir de zéro ?** Le moment de valeur (miroir + tension nommée) :
   oui, sans hésiter. Le verrou « 2 thèmes max » : non, on partirait d'une porte de profondeur,
   pas d'un quota.
2. **Qu'est-ce qu'on perd si on supprime le quota ?** Un levier de rareté brut. On gagne la
   crédibilité auprès de l'archétype rationnel et une tension honnête. Le pari : la profondeur
   (matrice critère par critère) est un paywall plus défendable que le comptage de dévoilements.
3. **Version 10× plus simple ?** Oui : UNE phrase déterministe (« sur vos communes, ça se joue
   sur X, et vous ne l'avez pas encore vu ») injectée dans l'upsell des deux parcours. Pas un
   module, pas une carte. C'est la proposition 1+5.
4. **Plus dur à copier, ou seulement plus riche ?** Le cadrage actuel (quantité) = plus riche,
   copiable. Le cadrage proposé (inconnu nommé + trajectoire) = plus dur à copier.

## Si j'étais le gardien du produit

Je ne toucherais à aucun critère ni module. Je réécrirais la copy d'upsell pour qu'elle nomme,
sur les communes du lecteur, le thème décisif qu'il n'a pas encore vu, et j'ouvrirais la
trajectoire comme arête honnête du gratuit — puis je remplacerais le quota « 2 thèmes » par une
porte de profondeur, et je laisserais un A/B PostHog trancher entre la quantité et l'inconnu
nommé avant de graver quoi que ce soit.

## Quand rouvrir ce sujet

- **Rouvrir / re-prioriser** si le funnel instrumenté montre un drop-off marqué au verrou
  « 2 thèmes » ou un rebond post-résultats élevé avec AskFuture peu utilisé (signe de désamorce).
- **Construire** si l'A/B « inconnu nommé » vs « ensemble des critères » donne un uplift de clic
  Pack > bruit.
- **Abandonner ma reco** si l'A/B montre que la copy de quantité convertit mieux (mon hypothèse
  porteuse serait fausse : l'anxiété serait informationnelle, pas décisionnelle).
- **Réévaluer la trajectoire** le jour où un concurrent crédible affiche une lecture-trajectoire
  par commune (le moat se déplacerait) — à surveiller par WebFetch périodique.

## Limite honnête de mon regard

Je lis du CODE et de la COPY, pas des sessions réelles. Tout l'arc émotionnel (« il m'a
compris », « merci je pars », « rationnement ») est INFÉRÉ de la mise en page et des textes, pas
observé. Je n'ai aucune donnée de funnel — l'arbitrage lui-même reporte la décision « sur données
une fois le funnel instrumenté ». Ma distinction « curiosité vs tension décisionnelle » est une
lecture doctrinale forte qui pourrait peser moins qu'elle ne le prétend chez un humain en plein
achat immobilier. Et mes affirmations sur les concurrents (quantité copiable, trajectoire non) sont
des hypothèses non vérifiées par WebFetch.
