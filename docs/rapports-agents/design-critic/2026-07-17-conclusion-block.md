# Design Critic : le bloc de conclusion du dossier « En une minute » (/rapport)

Date : 2026-07-17. Agent : Design Critic (read-only). Périmètre : les trois défauts constatés
sur le dossier Toulouse, plus ce que la lecture du code a révélé en chemin.

## Écran

- **Nom** : bloc de conclusion du dossier de décision « En une minute », et l'intertitre de la
  section de cartes « verifications » qui le suit.
- **Fichiers lus** : `src/components/report/ConclusionBlock.tsx`,
  `src/lib/decision/conclusion-plan.ts`, `src/lib/decision/decision-assembler.ts` (l. 13-18 et
  84-92), `src/components/report/DossierDecisionSection.tsx`,
  `src/components/report/FactCompositionCard.tsx`, `src/components/report/ConclusionRedigee.tsx`,
  `src/lib/decision/conclusion-validate.ts`, `src/app/design-tokens.css`, `src/app/globals.css`,
  CSS compilé de `.next/static/chunks`. Doctrine : `docs/vault/recherches/inventaire-design.md`.
- **Moment du parcours** : le sommet du rapport payant, la première chose lue après le titre.
  C'est l'écran qui répond à la question du lecteur (« ce lieu me convient-il ? ») et qui
  hiérarchise ce qu'il doit regarder ensuite.
- **Décision éclairée** : s'engager, creuser, ou écarter la commune. Chaque strate a un rôle
  épistémique distinct (verdict prouvé / condition non testée / poids relatif / non couvert), et
  c'est exactement ce que la forme doit rendre lisible sans mentir.

## Ce qui fonctionne (à préserver)

1. **L'architecture en strates étiquetées.** Verdict en 21px, strates en 17/15/12.5px, eyebrows
   mono uppercase qui nomment la NATURE de chaque bloc : c'est la traduction visuelle exacte de
   la hiérarchie du plan. La dégradation typographique fait le travail de hiérarchie sans un seul
   ornement. Ne pas y toucher.
2. **Le verdict jamais généré, la structure DOM identique déterministe/générée** (substitution
   Suspense atomique, `minHeight: 132px` anti-saut). Les deux chemins passent par le même
   `ConclusionBlock` : toute correction rendue ici couvre les deux. C'est du design honnête au
   sens fort.
3. **La boîte encadrée pour la contrainte non examinée.** Le PRINCIPE d'un traitement encadré,
   distinct des strates nues, est juste : une condition qui borne le verdict n'est pas un
   registre parmi d'autres, c'est une annotation attachée au verdict. Seuls sa position, son
   étiquette et sa teinte sont en cause (défaut 2).
4. **`uncovered_priorities` en ghost 12.5px, dernier, sans étiquette.** Exactement le poids
   visuel que mérite « réduit la personnalisation, n'invalide pas le verdict ». Rien à ajouter.
5. **Le scope (« commune + adresse ») en haut à droite**, mono discret : dit le périmètre sans
   le dramatiser.
6. **La suppression déjà actée du décompte-intertitre** (commentaire de
   `DossierDecisionSection.tsx` l. 20-24) : la philosophie « le lecteur compte les cartes
   lui-même » est la bonne, la garder en tête pour ne pas réintroduire un compteur.

## Verdicts par défaut

### Défaut 1 : « 4 points » puis « Trois points » : contradiction apparente

**Verdict : la correction texte décidée SUFFIT. Aucun apparat visuel à ajouter.**

La question posée était : la strate doit-elle porter la relation visuellement (étiquette,
position) ? Non, pour trois raisons :

- La relation « 3 parmi 4 » est un lien LOGIQUE entre deux phrases. Un dispositif visuel
  (badge « 3/4 », connecteur, indentation, compteur) exposerait la tuyauterie des tiers de
  matérialité, que le lecteur n'a pas à connaître, et violerait la signature n°2 de
  l'inventaire (peu d'éléments, chacun avec un rôle). Le commentaire de `conclusion-plan.ts`
  (l. 393-397) a déjà tranché ce principe pour la phrase : il vaut aussi pour le pixel.
- Les deux comptes vivent dans la MÊME carte glass, à ~40px l'un de l'autre. La proximité est
  déjà le lien visuel. C'est la phrase qui manquait, pas la forme.
- L'étiquette actuelle « Ce qui demande votre attention » reste juste avec la nouvelle phrase
  (« Parmi ces quatre points, trois pèsent le plus : … »). NE PAS l'unifier avec « Ce qui pèse
  le plus » (le libellé du cas `single`) : l'eyebrow répéterait mot pour mot le verbe de la
  première phrase, juste au-dessus d'elle.

**Deux implications techniques à ne pas rater** (pour l'orchestrateur, hors de mon mandat mais
visibles depuis le code) :

- Le « quatre » de la nouvelle phrase doit venir de LA MÊME source que le « 4 » du verdict
  (`input.reservesShown`, qui inclut les tradeoffs affichés, cf. `decision-assembler.ts`
  l. 127-130), jamais d'un recomptage local, sinon un futur changement de cap recrée la
  contradiction. Et la phrase relationnelle ne vaut que si `lead.facts.length <
  reservesShown` : « Parmi ces trois points, trois pèsent le plus » serait ridicule quand les
  comptes coïncident. Garder la phrase actuelle dans ce cas.
- `conclusion-validate.ts` (l. 100) autorise automatiquement les nombres présents dans le
  fallback, mais « quatre » en lettres n'autorise pas « 4 » en chiffres : ajouter
  `numberForms(reservesShown)` aux `allowedNumbers` du bloc `reserves_found`, sinon une
  reformulation IA en chiffres sera rejetée à tort.

Le cas `single` n'a pas besoin de la relation : « Un point pèse plus que les autres » la porte
déjà (« les autres »).

### Défaut 2 : la contrainte dure non examinée, mal placée et mal nommée

**Verdict : remonter, renommer, ET changer la teinte. Le bandeau orangé ment.**

**Position.** Le code se contredit lui-même : le commentaire de `ConclusionBlock.tsx` l. 87
affirme « elle se lit juste sous lui [le verdict] », le commentaire de
`DossierDecisionSection.tsx` l. 128-131 le répète, l'en-tête de `conclusion-plan.ts` (l. 6-8)
place le registre en position 2… et le JSX la rend APRÈS la strate de poids (l. 80-99). La
remontée est une mise en conformité du rendu avec sa propre doctrine, pas un choix nouveau.
Ordre cible : verdict → condition → poids → non couvert.

**Étiquette.** « Limite de ce constat » désigne une réserve méthodologique de futur•e ; or c'est
une condition posée PAR LE LECTEUR, non encore testée. La proposition « Une condition reste à
vérifier » corrige la nature, mais a deux défauts :

- Elle est au singulier codé en dur alors que le bloc peut porter plusieurs contraintes (le
  fallback gère le pluriel : « X et Y restent à vérifier », `conclusion-plan.ts` l. 331-335).
- Elle répète mot pour mot le verbe de la phrase qu'elle coiffe (« reste à vérifier » /
  « … reste à vérifier à ce niveau de détail ») : l'étiquette doit dire la nature, la phrase
  l'instance.

**Proposition** : « Condition à vérifier » / « Conditions à vérifier » (pluriel par
`sourceIds.length`, que `RenderedBlock` porte déjà ; il suffit que le composant cesse de jeter
les `sourceIds` dans sa `Map`). Nominal, court, au registre des autres eyebrows, et il garde
« à vérifier » qui est la seule formulation non ambiguë. Écarter « Condition non vérifiée » :
en français, « la condition n'est pas vérifiée » se lit aussi « la condition n'est pas
REMPLIE », ce qui ferait lire une incompatibilité là où il n'y a qu'une absence d'examen. La
répétition résiduelle de « à vérifier » entre étiquette et fallback est acceptable (le texte
généré, lui, variera).

**Teinte.** Le bandeau orangé actuel (`var(--orange)` à 30%/6%) est une fausse certitude par la
couleur. Dans le langage visible de cette page même, l'orange dit un problème ÉTABLI (verdict
`caution`, section « Ce qui départage vraiment »). Or ce bloc dit exactement l'inverse : rien
n'a été établi, l'examen n'a pas eu lieu. Colorer un non-savoir avec la teinte de l'alerte
établie affirme au-delà de la preuve (invariant n°5) et fait porter l'émotion par la couleur au
lieu du récit (signature n°3 de l'inventaire). La sémantique cohérente de la page est :

- rouge : incompatibilité établie ;
- orange : compromis/réserve établi, qui pèse ;
- violet/améthyste : ce qu'on ne sait pas encore (section « Ce que nous ne savons pas
  encore ») ;
- bleu/info : établi, conséquence à contrôler (section verifications).

Une condition non examinée appartient à la famille du non-savoir : **`var(--violet)`** (défini
dans `design-tokens.css` l. 36, même teinte que l'améthyste des unknowns), même recette
color-mix 30%/6%, boîte conservée. La gravité vient de la POSITION (collée au verdict) et de
l'encadré, pas d'une teinte d'alarme. Réserve : je ne vois pas les pixels ; un violet à 6% de
fond peut être trop discret sur le verre sombre, à vérifier au navigateur (test humain).

### Défaut 3 : « À examiner avant de vous engager » sur des faits établis

**Verdict : le titre trompe, modérément mais réellement. À renommer.**

Les cartes de la section `verifications` portent un `statement` ÉTABLI (exposition inondation
communale prouvée, chips de preuve à l'appui) dont seule la conséquence au grain du bien reste
à contrôler. Coiffer le tout de « À examiner » applique le doute au constat entier : le lecteur
peut ranger un fait prouvé parmi les hypothèses, c'est-à-dire SOUS-évaluer le signal. Défaut
d'honnêteté inversé mais défaut quand même.

Le problème est aggravé par une collision lexicale à l'échelle de l'écran : après la correction
du défaut 2, « à vérifier » désignera la condition NON EXAMINÉE dans la conclusion, et
« examiner » désignerait des faits ÉTABLIS trente centimètres plus bas. Un même champ lexical
pour deux états épistémiques opposés, sur un seul écran.

**Proposition** : « Ce qui est établi, à contrôler avant de vous engager »
(`decision-assembler.ts` l. 17, branche non-habitant). Elle :

- garde l'ancrage décisionnel « avant de vous engager », qui relie la section à la décision
  (invariant n°4) et doit survivre ;
- dit le statut (« établi ») AVANT l'action (« à contrôler »), dans la famille des titres
  existants (« Ce qui correspond moins bien », « Ce que nous ne savons pas encore ») ;
- réserve « vérifier » au non-examiné et « contrôler » à la conséquence d'un fait établi : la
  distinction lexicale fait à elle seule le travail que le lecteur attendait du design.

Ne pas asseoir le titre sur le grain (« établi pour la commune, à vérifier pour l'adresse ») :
en scope commune+adresse, des faits de grain adresse peuvent vivre dans cette section, et le
titre mentirait. Le grain est déjà dit carte par carte (eyebrow « À l'échelle de la commune » /
« À cette adresse », `DossierDecisionSection.tsx` l. 28-32) : c'est le bon endroit, ne pas le
dupliquer. La variante habitant (« Ce que ces données invitent à comprendre ou surveiller »)
n'a pas le défaut : ne pas y toucher.

## Ce qui peut disparaître

Rien à retrancher dans le bloc lui-même : chaque strate a un rôle épistémique distinct et
gagne sa place. Le retrait a déjà eu lieu (décompte-intertitre supprimé, lead `tied` réduit aux
sujets). C'est un écran qui a déjà été édité, et ça se voit. En revanche :

- **Du code mort ou de l'invisible payé** : voir « Honnêteté du signal », point 1. Si les blocs
  `compositions_found` et `mismatches_found` ne doivent pas s'afficher, ils ne devraient ni
  partir au modèle ni être stockés ; s'ils doivent s'afficher, c'est un signal enfoui à révéler.

## Conformité aux patterns

- Carte glass à filet gauche coloré par l'état, eyebrows mono 10px uppercase, cartes-sections à
  filet haut : conforme au kit du rapport et au gabarit des modules. Aucun `max-w` fautif dans
  le bloc (la largeur vient du conteneur de page).
- La hiérarchie des registres du plan (`conclusion-plan.ts` l. 5-12) EST le pattern tranché ;
  le rendu actuel y déroge sur la position du registre 2. La correction décidée est une remise
  en conformité.
- `FactCompositionCard` : cohérent avec les cartes simples (mêmes briques FactBody/EvidenceRow,
  dépliable d'audit). Rien à signaler dans ce périmètre.

## Honnêteté du signal

1. **Deux registres du plan ne sont JAMAIS rendus.** `ConclusionBlock` ne lit que quatre clés
   (l. 48-51) ; `compositions_found` et `mismatches_found` sont construits par le plan, confiés
   au modèle (coût Sonnet), validés, stockés en base… et jamais affichés, ni en déterministe ni
   en généré (les deux chemins passent par ce composant). Sur un dossier `arbitration`, le
   verdict dit « 2 de vos priorités sont nettement moins bien servies » mais la phrase qui les
   NOMME (`mismatches_found`) n'apparaît nulle part dans la conclusion, alors que le commentaire
   du plan (l. 412-414) promet « le lecteur apprend ici, en une phrase, QUELLES priorités ».
   Soit c'est un choix (les cartes mismatch les nomment plus bas) et alors le plan ne devrait ni
   les générer ni les stocker, soit c'est une omission de rendu. À trancher par le porteur ; en
   l'état, l'écran affirme un compte sans nommer ses objets, et le produit paie une génération
   invisible.
2. **Des couleurs qui ne se résolvent probablement pas** (constat de code, à confirmer au
   navigateur : je ne vois pas les pixels). `var(--accent)`, `var(--ghost)`, `var(--info)`,
   `var(--amethyst)` n'existent nulle part comme custom properties : le `@theme` Tailwind v4
   n'émet que `--color-accent`, `--color-ghost`, etc. (vérifié dans `globals.css` l. 4-14 ET
   dans le CSS compilé de `.next`), et les déclarations locales `--accent:` ne vivent que sur
   les pages savoir/agir, pas sur /rapport. Conséquences visibles attendues : eyebrow « Ce qui
   demande votre attention » rendu couleur texte au lieu d'orange (alors que « En une minute »,
   en classe `text-accent`, EST orange : deux oranges censés être identiques, un seul rendu) ;
   filet gauche du verdict `neutral` en couleur de texte au lieu de ghost ; filets hauts des
   sections unknowns/verifications/mismatches en blanc cassé au lieu de violet/bleu, pastilles
   invisibles (background invalide = transparent), glow absent. Ce n'est pas de la plomberie de
   tokens : c'est une sémantique de couleurs qui s'éteint en silence sur la moitié de l'écran,
   pendant que rouge et orange (définis dans `design-tokens.css`) fonctionnent. Correctif
   évident au passage de l'orchestrateur : `var(--blue)`, `var(--violet)`, ou les classes
   `text-*` du thème. Si le rendu réel est correct, c'est qu'une définition m'a échappé, et ce
   point tombe.
3. Aucun graphique, aucun chiffre décoratif, aucun score implicite : les seuls nombres à
   l'écran sont des comptes de faits, gouvernés par `conclusion-validate`. C'est la partie la
   plus honnête du produit, et les trois défauts constatés sont précisément les trois endroits
   où la forme était en retard sur cette exigence.

## Incohérences visibles

- La contradiction 4/3 (défaut 1) : deux comptes voisins sans relation dite. Corrigée par la
  phrase décidée.
- Le point 2 ci-dessus, si le rendu le confirme : accents résolus et non résolus côte à côte
  sur le même écran.
- Rien d'autre : radius, verre, espacements sont homogènes dans ce périmètre.

## Signalements éditoriaux (je ne réécris pas)

- Le fallback du bloc condition dit « à ce niveau de détail » : c'est une périphrase de
  tuyauterie (le « grain » vu du lecteur). Compréhensible, mais l'Editorial Writer pourrait
  trouver mieux le jour où il passera ; je le note, sans réécrire.
- Veiller, dans la nouvelle phrase du défaut 1, à ne pas produire d'antithèse (« ce ne sont pas
  quatre points égaux, mais trois qui pèsent ») : interdit éditorial connu. La formulation
  décidée (« Parmi ces quatre points, trois pèsent le plus ») est saine.
- Aucun tiret cadratin, exclamation ou emoji dans les textes déterministes lus ; la
  normalisation typographique de `conclusion-validate.ts` (l. 54-60) protège le chemin généré.

## Verdict global : À AJUSTER

L'architecture est bonne et déjà éditée ; les trois défauts sont des défauts de fidélité du
rendu à sa propre doctrine, pas des défauts de conception. Hiérarchie des corrections :

1. **Défaut 2** (position + étiquette + teinte de la condition) : c'est le seul qui fait MENTIR
   l'écran (une absence d'examen colorée en alerte établie, placée comme une note de bas de
   page alors qu'elle borne le verdict).
2. **Défaut 1** (phrase relationnelle) : contradiction apparente, corrosive pour la confiance,
   mais la correction est déjà décidée et purement textuelle.
3. **Défaut 3** (titre de section) : tromperie douce, un libellé à changer.
4. Les deux découvertes annexes (registres jamais rendus, variables non résolues) sont à
   trancher/vérifier par le porteur ; la seconde est probablement la plus visible de toutes si
   elle se confirme au navigateur.

## Rendu cible précis

Dans la carte de conclusion (`ConclusionBlock.tsx`), de haut en bas :

1. Ligne d'en-tête : eyebrow du verdict (couleur du tone) + scope à droite. Inchangée.
2. **Verdict**, 21px. Inchangé, jamais généré.
3. **Boîte condition** (si `unexamined_hard_constraints`) : encadré arrondi conservé,
   `border color-mix(var(--violet) 30%)`, `background color-mix(var(--violet) 6%)`, eyebrow
   violet « Condition à vérifier » (pluriel « Conditions à vérifier » si
   `sourceIds.length > 1`), texte 15px muted inchangé. Marge haute resserrée si besoin (mt-4)
   pour lire comme une annotation du verdict.
4. **Strate de poids** (si lead) : eyebrow accent « Ce qui pèse le plus » (single) / « Ce qui
   demande votre attention » (tied), texte 17px. Étiquettes INCHANGÉES ; seule la phrase tied
   change (décidé), avec le compte total tiré de `reservesShown` et `allowedNumbers` complété.
5. **Non couvert** : ghost 12.5px, dernier, sans étiquette. Inchangé.

Plus bas, section de cartes : titre non-habitant « Ce qui est établi, à contrôler avant de vous
engager » ; titre habitant inchangé ; accents de sections sur des variables qui existent
(`var(--blue)`, `var(--violet)`) si le point 2 d'honnêteté se confirme.

## Ce qu'il ne faut PAS toucher

- La hiérarchie typographique 21/17/15/12.5 et les eyebrows mono 10px uppercase.
- Le verdict déterministe mot pour mot, le `minHeight: 132px`, la structure DOM commune aux
  deux chemins (déterministe/généré).
- L'étiquette « Ce qui pèse le plus » du cas single, et l'absence d'affichage du lead en
  verdict `critical` (le blocage EST la réponse).
- Le traitement ghost sans étiquette de `uncovered_priorities`.
- Le principe de la boîte encadrée pour la condition (seuls position/étiquette/teinte changent).
- La variante habitant du titre de section, et les eyebrows de grain par carte.
- L'absence de tout compteur/badge/score : ne rien AJOUTER pour porter la relation 4/3.

## Cohérence (tensions non tranchées, je ne tranche pas)

- **Registres construits jamais rendus** (compositions_found, mismatches_found) : afficher, ou
  cesser de générer/stocker ? Les deux sont défendables (les cartes nomment déjà les mismatchs
  plus bas ; mais le plan promet la phrase). Choix au porteur.
- **Teinte de la condition** : violet (famille non-savoir) est ma recommandation ; bleu
  (famille « à contrôler ») est défendable si le porteur préfère souligner l'action plutôt que
  l'état. Orange est le seul choix indéfendable.
- La tension ouverte n°2 de l'inventaire (mode clair des primitives) ne s'aggrave pas ici : le
  bloc utilise des classes de thème et des color-mix, pas de sombre codé en dur.

## Mise à jour de l'inventaire (prêt à écrire, si le porteur valide)

Dans « Les patterns d'écran déjà tranchés », ajouter :

> **La conclusion du dossier de décision (strates étiquetées).** Verdict déterministe en tête,
> puis les registres dans l'ordre épistémique du plan : condition non examinée (encadré teinté
> non-savoir, jamais une teinte d'alerte établie) collée au verdict, poids relatif, non couvert
> en ghost. Règle de teinte : rouge = établi éliminatoire, orange = établi qui pèse,
> violet = pas encore su, bleu = établi à contrôler. Règle lexicale visible : « à vérifier » se
> réserve au non-examiné, « à contrôler » à la conséquence d'un fait établi. Aucun compteur ni
> badge : les relations entre comptes se disent dans la phrase.

## Version minimale (~90 % de la valeur)

Trois retouches sans refonte : (1) déplacer le JSX de la boîte condition au-dessus de la strate
de poids et remplacer l'étiquette par « Condition à vérifier » avec la teinte violette (mêmes
recettes color-mix, une couleur changée) ; (2) la phrase tied décidée, avec `reservesShown`
comme source du total et `allowedNumbers` complété ; (3) le titre de section non-habitant
remplacé dans `labels()`. Tout le reste (registres non rendus, variables non résolues) peut
attendre une vérification au navigateur.

## Quand rouvrir ce sujet

- Si la vérification au navigateur montre que `var(--accent)`/`var(--info)`/`var(--amethyst)`
  se résolvent bien quelque part : retirer mon point d'honnêteté n°2 et documenter d'où vient
  la définition (elle m'a échappé, elle échappera au prochain lecteur).
- Si un dossier réel produit PLUSIEURS contraintes non examinées : vérifier que le pluriel de
  l'étiquette et la lisibilité de l'énumération tiennent (le fallback les joint en une phrase).
- Si le violet à 6% est illisible sur le verre sombre au rendu réel : remonter l'opacité avant
  de changer de teinte, l'orange ne redevient pas une option.
- Si les cartes mismatch quittent un jour la page (ou passent sous un cap plus sévère) : la
  question du bloc `mismatches_found` non rendu devient urgente, le verdict compterait des
  priorités que plus rien ne nomme.
- Si le lead `tied` s'étend aux mismatchs composés (décision réservée dans
  `conclusion-plan.ts` l. 131-135) : revalider l'étiquette « Ce qui demande votre attention »,
  qui suppose aujourd'hui des points « à vérifier ».
- Si un test lecteur montre que « contrôler » n'est pas compris comme distinct de « vérifier » :
  la distinction lexicale était mon pari, l'Editorial Writer devra trouver la sienne.
