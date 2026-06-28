# Frontière gratuit/payant : moteur, moat, allocation

> Business Strategist (contre-pouvoir rentabilité durable / allocation de la ressource rare).
> Question-mère : cette frontière renforce-t-elle le moteur et le moat, ou les dilue / détourne ?
> Daté 2026-06-28. Lentille volontairement en TENSION avec le Product Strategist (valeur/simplicité).
> Terrain lu : vision/modele-economique.md, ADR-0007 + addendum, ADR-0008, paris.md (#1 à #5),
> code réel des surfaces payantes (PackConvictionView.tsx, debloquer/page.tsx, instrumentation PostHog).

---

## Le goulot aujourd'hui

Le goulot n'est PAS le taux de conversion, et ce n'est pas non plus la finesse de la frontière
gratuit/payant. C'est le **débit d'inconnus qualifiés en décision active qui atteignent une
surface payante** — et, en amont de toute statistique, l'**absence d'un premier faisceau de
signaux d'achat réels** (pari #1, statut « non testé », confiance faible).

Justification par la preuve : le funnel est déjà instrumenté de bout en bout
(`life_synthesis_shown` → `pack_decision_cta_clicked` → `checkout_viewed` →
`pack_payment_submitted` ; attribution `source`/`rank` portée sur le paywall 14 €). L'outillage
de mesure n'est donc pas le manque. Ce qui manque, c'est l'**intrant** : un trafic d'amis et de
curieux SEO ne produit ni une conversion lisible, ni le pari #2 (catégorie comprise), qui se
joue dans des conversations d'inconnus, pas dans un dashboard. Tout le reste se lit à travers ce
goulot.

## Décision évaluée

Le doute fondateur : « les gens paient-ils vraiment 39 € pour le Pack Décision ? », recadré en
« on ne paie pas l'information, on paie le travail de décision déjà fait ». Quatre questions
confiées : (1) la frontière gratuit/payant protège-t-elle le moteur ou le gratuit
cannibalise-t-il le payant ? (2) quel est le vrai goulot ? (3) coût d'opportunité entre tension
gratuit/payant, découvrabilité, B2B, autre. (4) faut-il toucher au 39 € / 14 € ?

## La vraie question

La question posée (« paie-t-on 39 € ? ») est **prématurée, pas fausse**. La variable dominante
n'est pas le prix ni le placement du paywall : c'est le **débit d'inconnus qualifiés**. On ne
peut pas répondre à « paie-t-on ? » avec un dénominateur composé d'amis et de curieux SEO. Le
benchmark « 3-5 ventes / 100 qualifiés » suppose 100 qualifiés ; à ma lecture, on ne les a pas.
Donc la bonne séquence de questions est :

1. **Est-ce que QUELQU'UN paie ?** (binaire, pari #1) — ne demande pas 100 qualifiés, demande
   ~10-30 inconnus en décision active + des conversations. C'est le plus petit apprentissage utile.
2. **À quel taux ?** (le 3-5/100) — demande du volume, vient APRÈS.
3. **Où régler la frontière / le prix ?** — demande de l'optimisation, vient APRÈS le taux.

Débattre aujourd'hui de la frontière gratuit/payant ou de 39→19 €, c'est optimiser l'étape 3
alors qu'on n'a pas franchi l'étape 1. Mauvaise question, dans ce sens précis.

## Q1 — La frontière gratuit/payant protège-t-elle le moteur ?

**Constat sur pièces.** Le gratuit (`/ou-vivre`) livre les 3 territoires ET la synthèse : il
répond à « OÙ regarder » et « POURQUOI ces communes ressortent ». Le payant (Pack 39 €) répond
à « LEQUEL trancher » et « quels compromis » (matrice 7 thèmes / 27 dims). Le moat de futur•e
(profondeur climat × croisement × transformation, ADR-0002) vit donc bien **du côté payant** :
la frontière exploite le moat plutôt qu'elle ne le dilue. Bon point structurel.

**Risque de cannibalisation, segment-dépendant (posé en HYPOTHÈSE, pas asséné — invariant n°8) :**
- Pour le **découvreur** (« je n'ai aucune idée où aller ») : la synthèse gratuite nomme 3
  communes et explique pourquoi. Elle peut **résoudre assez l'inquiétude** pour qu'il reparte
  satisfait sans acheter. Risque de cannibalisation réel à tester.
- Pour le **départageur** (mode choix, « j'ai déjà 2 villes ») : le gratuit ne tranche pas, la
  douleur du compromis reste ouverte → frontière mieux placée. (Mais pari #4 conteste que ce
  moment se monétise : réassurance vs vraie incertitude. Angle mort assumé.)

**Doctrine de frontière que je défends (et c'est ici ma tension probable avec le Product
Strategist) :** le gratuit doit **résoudre « comprendre » et OUVRIR « trancher »**, jamais
fermer les deux. Le Product Strategist défendra à juste titre la générosité du gratuit (confiance,
boucle de prescription). Moi je dis : une synthèse gratuite qui referme l'arbitrage est du revenu
détruit, pas de la générosité. Le point de réglage n'est pas « donner plus ou moins », c'est
**laisser la tension de l'arbitrage intacte**. Réconciliable, mais la ligne de partage est là.

## Marché et coût

Qui paie et pourquoi sortir sa carte : un ménage en engagement long (achat, mutation, retraite),
au moment où l'erreur coûte cher (un aller-retour, une commune mal choisie). Le recadrage « on
paie le travail de décision déjà fait » est **juste et load-bearing** : c'est ce qui sort futur•e
du marché de l'info (gratuit, cannibalisé) pour entrer dans le marché de la décision (rare,
solvable). Le copy du paywall 14 € le porte déjà bien (« vous ne payez pas l'accès aux données
publiques, vous payez leur croisement, leur mise en perspective et leur lecture »).

Le coût n'est PAS le levier ici : marge brute SaaS ~91 %, coût variable dominant = l'API Claude
(~0,015 €/appel). À 14/39 €, l'élasticité-prix n'est pas la contrainte. Inutile d'en faire un
sujet.

## Q4 — Faut-il toucher au 39 € / 14 € ?

**Non. D'accord avec le porteur, sans réserve.** Trois raisons :
- Une baisse réflexe à 19 € **confond deux variables** : si la conversion bouge, on ne saura
  jamais si c'est le prix ou autre chose. On détruit la lisibilité de l'expérience #1 avant de
  l'avoir faite.
- Le pari n'est presque jamais le prix. Le pari est « la catégorie est comprise et la disposition
  à payer existe » (paris #1, #2). Baisser le prix ne répare ni une promesse mal comprise, ni un
  gratuit trop complet.
- L'ancre est doctrinalement saine : 14 € contre 600-800 € de diagnostics, 39 € contre le coût
  d'une commune mal choisie. Baisser, c'est affaiblir l'ancre et **graver un second prix avant la
  première vente** (exactement ce que l'addendum ADR-0007 refuse pour le palier « 2 communes »).

Une nuance utile : si après volume réel la conversion est quasi nulle, le premier réflexe ne doit
PAS être « baisser le prix » mais « tester la compréhension de la catégorie » (pari #2).

## Effet sur le moteur

La frontière actuelle améliore le « pourquoi il paie » (travail de décision fait) et le « quand »
(moment d'engagement). Elle ne touche ni le « pourquoi il revient » (Le Fil, non livré, maillon
faible reconnu) ni le débit d'entrée. Donc : bonne structure, mais elle agit sur un étage qui
n'est pas le goulot. Régler la frontière maintenant = optimiser une variable hors goulot.

## Effet sur le moat et les actifs

Le payant côté matrice compose bien (capital de compréhension = boucle d'apprentissage). MAIS la
boucle d'apprentissage ne tourne **que** si des décisions réelles d'inconnus sont observées. Sans
débit qualifié, le moat-accumulation est à l'arrêt : on n'accumule ni compréhension d'usage, ni
preuve B2C (qui conditionne le B2B, ADR-0008). C'est la confirmation que le goulot est l'intrant,
pas la frontière.

## Effet sur les boucles

Boucle d'apprentissage : gelée tant que pas de décisions d'inconnus observées. Boucle de
prescription : un gratuit généreux la nourrit (argument Product), mais la prescription d'un
non-acheteur reste à prouver (pari, pas acquis). Aucune des deux boucles ne tourne sans débit
qualifié → encore le même goulot.

## Niveau de preuve

Tout repose sur des paris « non testés, confiance faible » : #1 (paiement B2C), #2 (catégorie),
#3 (valeur d'arbitrage du Pack), #4 (le départage se monétise), #5 (volume du mode choix). Le
danger serait de traiter la frontière actuelle comme validée et d'en débattre le réglage fin :
ce serait optimiser une hypothèse jamais testée. Le registre paris.md est honnête là-dessus ; il
faut s'y tenir.

## Invariants et principes

- **Invariant n°8** (preuves > intérêts / espoirs) : central. Régler prix/frontière maintenant =
  avancer avec l'espoir d'un funnel qu'on n'a pas mesuré. À refuser.
- **ADR-0008** (B2C d'abord, B2B relais) : investir en B2B maintenant violerait l'ordre — la
  preuve B2C doit précéder. Le B2B « valorise une preuve, il ne la fabrique pas ».
- Invariants n°1/n°2 (on éclaire, pas de score ; le verbe qui tranche reste côté lecteur) : la
  frontière actuelle les respecte (« Tranchez, sans deviner »).

## Risques structurants

Aggravés si on reste sur l'optimisation de la frontière : risque #2 (paiement non démontré reste
non démontré) et surtout risque #1 (catégorie mal comprise) — qui ne se révèle QUE par des
inconnus. Atténués si on injecte du débit qualifié : on commence à lever #1 et #2 ensemble.

## Coût d'opportunité et pourquoi maintenant

Pendant qu'on débat la frontière gratuit/payant et le prix, on ne va PAS chercher les premiers
inconnus qualifiés. C'est le pire troc : on raffine l'étage 3 (optimisation) en laissant l'étage
1 (existence du paiement) non testé. Le meilleur usage du temps du porteur n'est ni le réglage
de paywall, ni le SEO programmatique (12 mois de latence, modele-economique.md), ni le B2B
(prématuré, ADR-0008). C'est la **distribution founder-led vers ~20-30 inconnus en décision
active** + les conversations qui vont avec (paris #1 et #2 se lisent là).

Pourquoi maintenant : le funnel est instrumenté, le produit payant est livré (Pack + paywall
14 €), la seule chose absente est l'intrant humain qualifié. Tout est prêt SAUF le débit. C'est
exactement le moment d'aller le chercher, pas de re-régler ce qui est déjà construit.

## Le vrai pari

En une phrase : **« des inconnus en décision active, qui ne me connaissent pas, comprendront la
catégorie et paieront pour du travail de décision déjà fait. »** Le prix n'est pas le pari ; le
débit qualifié et la compréhension de la catégorie le sont.

## Vue extérieure

Si j'étais l'investisseur : je ne demanderais ni le prix ni le taux de conversion, je demanderais
« combien d'inconnus ont payé, et qu'ont-ils dit ? ». Tant que la réponse est « zéro / mes amis »,
tout débat sur la frontière est du polish prématuré. Si j'étais le concurrent (portail immobilier,
risque #4) : je ne crains pas le prix de futur•e, je crains qu'elle accumule de la compréhension
d'usage — ce qui n'arrive pas sans débit. Donc le débit est aussi ma meilleure défense.

## Verdict

- **Q1 (frontière)** : AJUSTER la DOCTRINE, pas le réglage. Graver « le gratuit résout
  *comprendre*, ouvre *trancher* ». Ne pas re-trancher le placement maintenant (hors goulot).
- **Q2 (goulot)** : la variable dominante est le **débit d'inconnus qualifiés** + les premiers
  signaux d'achat. Hypothèse du porteur **confirmée**, précisée : avant les 100 qualifiés, viser
  les 10-30 premiers + conversations.
- **Q3 (allocation)** : PRIORITÉ à la découvrabilité/arrivée d'inconnus, version founder-led
  d'abord. DIFFÉRER B2B (ADR-0008) et SEO lourd. DIFFÉRER le réglage gratuit/payant.
- **Q4 (prix)** : REFUSER toute modification de 39 €/14 € maintenant. D'accord avec le porteur.

---

## Si refus/report : la victoire stratégique

**Dilution évitée :** on n'a pas brûlé le temps rare du porteur à re-régler un paywall et un prix
qui sont déjà livrés et doctrinalement sains, ni gravé un second prix (19 €) qui aurait affaibli
l'ancre et confondu l'expérience #1. **Pari prématuré écarté :** on a refusé d'optimiser le taux
de conversion avant d'avoir prouvé qu'une conversion existe. On a requalifié le doute fondateur
(« paie-t-on 39 € ? ») en sa vraie forme actionnable (« ai-je mis le produit devant assez
d'inconnus qualifiés pour le savoir ? »).

## Cohérence (tensions non tranchées, posées à l'humain)

- **Avec le Product Strategist** : générosité du gratuit (sa thèse : confiance + prescription)
  vs tension d'arbitrage préservée (ma thèse : ne pas refermer le « trancher »). Non tranché :
  jusqu'où le gratuit peut être généreux sans cannibaliser. À arbitrer quand on aura du débit —
  pas avant, faute de données.
- **Pari #4 (le départage se monétise) reste disputé** : je ne le tranche pas, il se lira dans la
  conversion par porte d'entrée une fois le débit présent.

## Mise à jour de doctrine (prêt à écrire par Claude principal)

Dans `vision/modele-economique.md`, section « Hiérarchie de preuve » ou « Risques » : ajouter que
le **goulot opérationnel actuel est le débit d'inconnus qualifiés**, en amont du taux de
conversion ; que l'instrumentation est en place mais l'intrant manque ; que le premier
apprentissage visé est binaire (~10-30 inconnus + conversations), pas le 3-5/100. Dans
`paris.md` #1 : préciser la « source de preuve » par « founder-led distribution avant PostHog de
masse ». Optionnel : noter en doctrine de frontière « le gratuit résout *comprendre*, ouvre
*trancher* » (à valider avec le Product Strategist).

---

## La version minimale (≈90 % de la valeur au moindre coût)

Mettre le Pack/paywall devant **20-30 inconnus en décision active** (groupes déménagement/
expatriation, r/immobilier, sous-Reddits régionaux, une accroche presse locale climat) et avoir
**5-10 conversations** directes. Coût : quelques jours du porteur, zéro euro d'acquisition payante
(cohérent avec « paid seulement à M+13 »). Cela lève le doute dominant (quelqu'un paie-t-il ? la
catégorie est-elle comprise ?) sans toucher au produit, au prix ni à la frontière. Asymétrie
forte : coût faible, information décisive.

## Table d'allocation

| | |
|---|---|
| **Goulot actuel** | Débit d'inconnus qualifiés en décision active devant une surface payante (+ absence de premiers signaux d'achat). La disposition à payer est non mesurée parce que l'intrant manque, pas parce que l'outil manque. |
| **Variable dominante** | Le nombre d'inconnus qualifiés exposés au payant. Le prix et le placement du paywall sont des variables secondaires (hors goulot). |
| **Temps à investir** | Quelques jours porteur : distribution founder-led + 5-10 conversations. |
| **Impact attendu** | Fort : lève en partie paris #1 et #2 d'un coup, débloque la boucle d'apprentissage et la preuve B2C qui conditionne le B2B. |
| **Temps à NE PAS investir** | Baisser/ajuster 39 € ou 14 € ; re-régler la frontière gratuit/payant ; lancer le B2B ; lancer le SEO programmatique de masse. Tout cela est hors goulot aujourd'hui. |
| **Priorité suivante** | Une fois ~10-30 ventes/refus observés : analyser la conversion par porte d'entrée (découverte vs mode choix, paris #3/#4), PUIS seulement régler la frontière et envisager le SEO. |
| **Sujet à rouvrir** | Frontière gratuit/payant et prix : rouvrir après 100 inconnus qualifiés exposés OU ~30 ventes, dès qu'une conversion par porte est lisible. Prix : rouvrir seulement si conversion quasi nulle ET catégorie déjà prouvée comprise. |

**Si j'étais CEO :** je ne touche ni au prix ni à la frontière cette semaine ; je mets le Pack
devant 20-30 inconnus en décision active et je leur parle, et je ne rouvre aucun débat de réglage
avant d'avoir vu si quelqu'un sort sa carte.

## Quand rouvrir ce sujet (signaux datés)

- **Rouvrir la frontière gratuit/payant** si : des inconnus disent en conversation « la synthèse
  gratuite m'a suffi » (cannibalisation confirmée), OU si `life_synthesis_shown` → CTA payant
  s'effondre malgré une intention forte en amont.
- **Rouvrir le prix** si : conversion durablement quasi nulle ALORS QUE le pari #2 (catégorie
  comprise) est validé en conversations — alors et seulement alors le prix devient suspect.
- **Rouvrir l'ordre B2C/B2B (ADR-0008)** si : la preuve B2C échoue après débit réel, OU si un
  accord-cadre B2B (réseau, éditeur logiciel, chambre) se présente.
- **Re-prioriser vers le SEO de masse** si : le founder-led plafonne en volume mais que la
  conversion observée sur les premiers qualifiés est encourageante (alors le goulot devient
  l'acquisition scalable).

## Limite de mon regard

Je n'ai pas accès aux données PostHog/Stripe réelles : j'infère « trafic d'amis + curieux SEO »
de l'état du projet et du registre paris.md (tous « non testés »), pas d'un dashboard. Si le
porteur a déjà un flux d'inconnus qualifiés non documenté ici, mon goulot se déplace vers la
conversion et une partie de ce rapport bascule. Par ailleurs je raisonne en allocateur, pas en
spécialiste acquisition : « où trouver les 20-30 inconnus » relève d'un autre regard (le
Discoverability Strategist pour le durable, le porteur pour le founder-led immédiat). Enfin, la
psychologie de l'acheteur que j'avance (découvreur rassasié vs départageur en douleur) est une
hypothèse à tester, pas un fait.
