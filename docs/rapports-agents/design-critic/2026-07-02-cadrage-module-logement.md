# Design Critic — Cadrage de la forme du module Logement et harmonisation avec Territoire

Date : 2026-07-02
Question-mère : l'écran Logement sert-il la décision du lecteur dans la voix et la DA de futur•e,
et comment l'harmoniser avec le langage visuel de Territoire sans effacer « le bien, pas le territoire » ?

Fichiers lus : `src/components/report/LogementModule.tsx` (906 l.) ;
Territoire : `QuartierSynthesis.tsx`, `TerritoryIdentityCard.tsx`, `TerritoryYearsBand.tsx`,
`ReportRelationBanner.tsx`, `src/app/(account)/rapport/quartier/page.tsx`.
Terrain : `inventaire-design.md`, invariants, ADR-0001, `_contexte-module-logement-2026-07-02.md`.

---

## Écran

Module 02 · Logement. Parcours : le lecteur tape une adresse, un fetch renvoie tout, trois onglets
Synthèse / Détails / Agir. Décision éclairée : rénover, provisionner des travaux, acheter/renoncer,
négocier un prix, anticiper une contrainte (DPE 2034, ZFE). C'est le bon périmètre décisionnel.
Mais l'écran, tel qu'il est, aide moins qu'il ne le prétend, et il ment par sa forme à deux
endroits précis.

---

## Ce qui fonctionne (à préserver)

- **Le hero est déjà de futur•e.** Kicker mono à puce, « Module 02 · Logement », H1 Instrument
  Serif avec la ligne accent italic, sous-titre mesuré `max-w-[560px]`, glass sur l'aside. C'est
  le même moule que le hero Territoire. Le haut de page n'est pas le problème.
- **La property card (l. 452-472) est le bon socle.** Adresse réelle, parcelle, contenance,
  altitude, surface, année : de la donnée dure qui ancre le bien. C'est ce qui incarne « le bien,
  pas le territoire ». À garder, c'est même l'embryon d'un passeport.
- **Le DPE badge (couleur officielle, l. 61-64/172-184)** est une donnée réelle rendue dans son
  code couleur réglementaire : légitime, lisible, honnête.
- **La règle « ce module lit le bien lui-même, il ne raconte pas tout le territoire »** (sous-titre
  hero + garde-fou « Adresse hors commune » l. 474-489) est juste et doit survivre à toute refonte.
- **La synthèse à la demande** (bouton « Générer la lecture ») plutôt qu'auto : économe, honnête
  (rien n'est affirmé tant que le lecteur ne le demande pas).

---

## Ce qui peut disparaître sans perte (premier réflexe)

Hiérarchisé, du plus urgent au détail :

1. **Le verdict compté** (`computeQuickVerdict` l. 72-87 + `Verdict` l. 519-532). Compter des
   signaux et rendre un niveau good/medium/bad affiché en bandeau coloré « Plusieurs signaux
   convergents sur cette adresse », c'est **un score de risque global déguisé** — exactement ce
   qu'interdit ADR-0001. Le score n'est pas moins un score parce qu'il est verbal et coloré.
   À retirer.

2. **Les deux dimensions heuristiques dans le gabarit des dimensions réelles.** « Coût d'assurance
   projeté » (`getInsuranceOutlook`) et « Valeur immobilière » (`getValueOutlook`) sont des
   déductions à partir des seuls labels de risque et du DPE. Elles sont affichées dans le **même
   `RiskCard`** (badge coloré, valeur Serif 28px, niveau bad/warn/good) que le DPE, qui lui est
   mesuré. Rien ne distingue à l'œil une mesure d'une supposition. À sortir de ce gabarit (voir
   Honnêteté).

3. **Le doublon Synthèse ↔ Détails.** Le bloc « Assurance & valeur » de l'onglet Détails
   (l. 752-770) réaffiche mot pour mot les deux `RiskCard` déjà montrés en Synthèse (l. 642-656).
   Le même contenu spéculatif, deux fois. Un des deux doit disparaître.

4. **L'aside hero « Les briques du module »** (l. 375-396) : quatre pastilles colorées dont deux
   (« Pression d'assurance : Sous pression », « Valeur à 20 ans : Fragilisée ») affichent un
   verdict spéculatif **avant même toute analyse**, dès le chargement. La brique promet un résultat
   qu'elle n'a pas encore. À réduire aux deux briques réelles (DPE, risques) ou à neutraliser en
   promesses de lecture, pas en valeurs.

5. **Le CTA « Voir la Synthèse » de l'onglet Agir** (l. 856-872) : une invitation à changer
   d'onglet pour aller chercher un bouton. Frottement sans gain.

---

## Conformité aux patterns

- **Pas de passeport, pas d'identité du bien.** Territoire ouvre sur `TerritoryIdentityCard`
  (passeport, grand nom, sceau, champs). Logement ouvre sur une property card plate. Écart : le
  bien n'a pas d'objet-identité, alors qu'il en a la matière (type de bâtiment, année, surface,
  DPE, parcelle). C'est le composant signature à transposer (voir Harmonisation).
- **Onglets au lieu de lecture continue.** La signature n°5 (« le drawer remplace le changement
  de page ») pose la lecture continue comme grammaire. Ici, trois onglets fragmentent la lecture
  et cachent la moitié du contenu. Ce n'est pas un drawer, ce n'est pas non plus un scroll
  narratif comme Territoire (passeport → bande → synthèse → grands signaux). Écart de grammaire.
- **Pas de carte-porte / drawer.** Les `RiskCard` sont des culs-de-sac : pas de clic, pas
  d'approfondissement, pas de sources repliées. Le pattern central de futur•e (carte = porte
  d'entrée vers un drawer référence→trajectoire→récit) est absent.
- **Pas de renvoi de sources.** Territoire clôt sa synthèse par « **Sources** · … » (l. 480-484
  de QuartierSynthesis). Logement n'a aucun renvoi de provenance structuré. Invariant n°3 (source
  et limites) non tenu à l'écran.
- **Conforme** : le SectionLabel à filet (l. 163-170) est sobre et juste ; le hero suit le moule.

---

## Honnêteté du signal (le cœur du problème)

Deux fautes de fond, ce sont elles qui font passer le verdict de « à ajuster » à « à revoir » :

1. **Fausse certitude : l'heuristique porte le costume de la mesure.** `RiskCard` rend « DPE F /
   Passoire thermique » (mesuré, officiel) et « Sous pression / lecture qualitative à 20 ans »
   (déduit de 3 mots-clés) **dans le même composant, avec le même badge coloré, la même valeur en
   Serif 28px**. La micro-unité « lecture qualitative à 20 ans » ne suffit pas à désamorcer :
   l'œil lit une donnée. C'est précisément la fausse certitude que le Critic refuse. Ces deux
   sorties doivent, tant qu'elles restent des heuristiques, quitter le gabarit-carte-chiffre et
   devenir des **phrases narratives explicitement conditionnelles**, sans niveau coloré, sans
   valeur cadrée — une observation, pas un verdict.

2. **Score global implicite** (déjà dit en retrait n°1) : `computeQuickVerdict` viole ADR-0001.
   Je ne tranche pas l'ADR, je constate l'écart : la doctrine dit « pas de score synthétique, ni
   à l'écran ni par un dispositif qui le suggère », et un bandeau good/medium/bad compté est ce
   dispositif.

3. **La couleur dramatise la donnée** (viole signature n°3 : l'émotion vient du récit, pas des
   couleurs). `RiskCard` « bad » en rouge, badge « Élevé », halo coloré : c'est le rouge alarmiste
   / vert rassurant que la doctrine bannit. Le DPE a une échelle couleur légitime (elle est
   réglementaire et externe) ; l'assurance et la valeur, non — leur rouge est une émotion fabriquée
   à partir d'une déduction.

4. **Chiffres sans source accessible.** Aucun drawer, aucun accordéon « Sources », aucun renvoi.
   Le DPE affiche une date mais pas sa provenance ADEME structurée. Invariant n°3 non tenu.

---

## Incohérences visibles (et seulement visibles)

Ce n'est pas de la plomberie de tokens (option A) : c'est une **rupture d'esthétique qui saute
aux yeux à l'intérieur d'un même écran**.

- **Le haut est vitré et arrondi, le bas est plat et anguleux.** Hero + aside + champ de
  recherche : `.glass`, `rounded-2xl` / `rounded-xl` (16px), fond translucide. Dès la property
  card et tout le bloc résultats (l. 449+) : `background: var(--bg-card)` opaque, `border: 1px
  solid`, **radius 0** (ou 1px/4px sur les micro-éléments). On voit deux produits collés : la
  moitié haute de futur•e 2026, la moitié basse d'un design antérieur. C'est l'incohérence n°1 à
  lever.
- **Discontinuité de radius entre voisins** : `rounded-xl` du champ de recherche (l. 414) juste
  au-dessus des cartes résultats à angles vifs. Le coin arrondi jure avec son voisin — cas
  explicitement cité comme signalable.
- **Aucune surface glass dans les résultats** : la property card et les RiskCard sont opaques,
  elles ne participent pas à l'atmosphère verre sombre du reste du produit.

---

## Signalements éditoriaux (observations, sans réécrire)

- **Emoji interdit visible** : le message d'erreur affiche `⚠ {error}` (l. 442-443). Zéro emoji
  est un interdit doctrine. À signaler au porteur / futur agent éditorial.
- **Le sous-titre du hero dit la donnée, pas le compromis.** « lit le bien lui-même : DPE, risques
  par adresse, pression assurantielle et trajectoire de valeur » : il énumère des dimensions (dont
  deux spéculatives) au lieu de nommer la décision que le module éclaire. La doctrine hero veut le
  compromis / la décision, pas la liste de données. Défaut de forme qui révèle un défaut d'écriture.
- Le glyphe « ! » dans les signaux IA (l. 600) sonne comme une alarme ; à surveiller, non bloquant.

---

## Verdict : À REVOIR

Pas un simple ajustement : deux défauts de fond (score implicite ADR-0001 ; heuristiques déguisées
en mesures) plus une rupture visuelle interne franche. Le hero et la property card sont bons et
servent de point d'appui ; le bloc résultats est à reprendre.

---

## Harmonisation avec Territoire : quoi transposer, quoi ne pas transposer

**À transposer (le bien mérite le même soin que le territoire) :**

- **Un passeport DU BIEN**, pendant de `TerritoryIdentityCard`. La property card en est déjà la
  matière. Champs naturels : type de bâtiment, année de construction, surface, DPE comme « sceau »
  (le badge couleur existe déjà et fait un excellent glyphe de document), parcelle comme numéro de
  document, altitude. Donnée 100 % réelle, incarne le bien, ouvre le module comme le passeport
  ouvre Territoire. C'est le geste d'harmonisation le plus rentable.
- **Le langage visuel** : basculer tout le bloc résultats sur `.glass` + Instrument Serif + Tailwind
  + les radius du reste (16px), pour lever la rupture. Le hero prouve que le module sait déjà le
  faire.
- **La synthèse hiérarchisée streamée** (grammaire `QuartierSynthesis` : titre Serif, blocs à
  caption mono, streaming, renvoi « Sources · … », discipline de preuve) à la place du couple
  [verdict compté + bouton « Générer la lecture » + RiskCards]. Même moteur éditorial, même
  honnêteté. La synthèse Logement existe déjà côté API, il lui manque ce châssis.
- **Le renvoi de sources** sous la synthèse.
- **Un bandeau de relation au bien**, pendant de `ReportRelationBanner`, mais avec les postures du
  logement : « J'y vis / J'envisage d'acheter / Je loue / Je le possède et le loue ». La relation
  au bien change radicalement la décision (rénover pour soi vs négocier le prix d'achat vs
  arbitrer un investissement locatif). Spécifique et utile.

**À NE PAS transposer :**

- **La bande des années (`TerritoryYearsBand`)** : c'est la mémoire CatNat *communale*. La coller
  au module Logement dupliquerait Territoire et raconterait la commune, pas le bien. Piège
  supplémentaire : sur un bien peu exposé la bande serait quasi vide et lirait comme « donnée en
  panne ». Si un jour la sécheresse ONRN (coût moyen + fréquence, déjà prête) alimente le volet
  RGA à l'adresse, ce serait une **micro-trajectoire du bien**, pas une bande d'années, et ce
  serait de la donnée réelle — à instruire séparément.
- **Le sceau territorial** (typologie littoral/montagne/plaine) : n'a pas de sens pour un logement.
  Le « sceau » du bien, c'est son étiquette DPE.

**Spécificité à protéger** (ne pas la noyer dans l'harmonisation) : l'entrée par adresse tapée, la
lecture à la parcelle, le DPE/audit, les risques au point. Et la **frontière avec Territoire** :
RGA, qualité de l'air, incendies apparaissent des deux côtés — Logement doit les lire *à l'adresse*
(exposition du bien), Territoire *à la commune* (phénomène du lieu), sans se répéter.

---

## Version minimale (~90 % de la valeur, le plus petit geste)

Sans attendre le passeport ni la refonte de la synthèse, trois coupes qui capturent l'essentiel :

1. **Supprimer le verdict compté** (bandeau good/medium/bad). Retire le score implicite.
2. **Sortir « assurance » et « valeur » du gabarit RiskCard** : les rendre en une ou deux phrases
   narratives explicitement conditionnelles, sans badge coloré ni valeur cadrée, et supprimer leur
   doublon dans l'onglet Détails. Retire la fausse certitude.
3. **Basculer le bloc résultats sur `.glass` + radius arrondis** comme le hero. Lève la rupture
   visuelle interne.

Ces trois gestes ne touchent ni l'architecture, ni l'API, ni le parcours : ils enlèvent le
mensonge de forme et l'incohérence. Le passeport du bien et la synthèse hiérarchisée sont le
chantier suivant, plus lourd, mais non requis pour cesser de nuire.

---

## Cohérence et tensions (posées, non tranchées)

- **ADR-0001 (pas de score synthétique)** : `computeQuickVerdict` est en tension directe. Je pose,
  le porteur tranche.
- **Tension ouverte** : jusqu'où le bien doit-il « raconter » (passeport, identité, relation) à
  l'image du territoire, vs rester une fiche technique sobre ? L'harmonisation ne doit pas
  transformer une fiche honnête en récit ornemental. À arbitrer produit.
- **Frontière Logement / Territoire / Santé** (RGA, air, incendies redondants) : question de
  périmètre, relève du Product Strategist ; je la signale car elle a un impact visible (répétition
  d'un même signal sur deux écrans).

## Mise à jour de l'inventaire (prêt à écrire par Claude principal)

Deux entrées candidates pour `inventaire-design.md` :

1. **Le passeport est un pattern généralisable, pas propre à Territoire.** Tout module qui ouvre
   sur un objet identifiable (un bien, plus tard un foyer) peut recevoir son passeport : grand nom,
   sceau/glyphe, champs de document, sur donnée réelle uniquement. À formaliser comme pattern
   d'écran transverse.
2. **Règle d'honnêteté du gabarit** : une valeur heuristique/déduite ne porte jamais le même
   gabarit visuel (carte-chiffre, badge de niveau coloré) qu'une donnée mesurée. La déduction se
   dit en prose conditionnelle ; la mesure se montre en carte. Corollaire pixel de l'invariant n°5.

## Quand rouvrir ce sujet

- Si une **donnée assurantielle ou de valeur réelle** est branchée (sinistralité, sécheresse ONRN
  déjà prête, marché) : les dimensions assurance/valeur peuvent revenir en face avant, dans le bon
  gabarit, avec source. Le verdict de fausse certitude tombe.
- Si le module passe **premium-gaté** comme Territoire : revoir le paywall (pattern conviction).
- Si une **mesure d'usage** montre que les onglets Synthèse/Détails/Agir perdent les lecteurs
  (Détails jamais ouvert) : reconsidérer le scroll narratif continu à la Territoire.
- Si le **passeport du bien** est codé : rejuger l'ensemble, la property card actuelle disparaît.
