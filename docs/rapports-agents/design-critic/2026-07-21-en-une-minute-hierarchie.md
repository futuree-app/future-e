# Design Critic — « En une minute » : le problème d'ÉCHELLE (hiérarchie, exergue, secondaire replié)

Date : 2026-07-21. Agent : Design Critic (read-only). Mission : refonte de MISE EN FORME
du bloc conclusion du dossier de décision, en tête de `/rapport`. Je propose, je ne code pas.

> Ce rapport construit SUR celui du 2026-07-17 (`2026-07-17-conclusion-block.md`), il ne le
> répète pas. Le précédent traitait trois défauts de FIDÉLITÉ du rendu à sa doctrine (teinte de
> la condition, phrase 4/3, titre de section). Le porteur pose maintenant un problème
> d'ÉCHELLE : l'écran ENTIER fatigue et lit « AI slop / pâté », pas seulement trois points. Les
> corrections du 2026-07-17 restent valides et NE sont PAS reprises ici ; elles sont supposées
> appliquées ou en cours.

## Écran

- **Nom** : « En une minute », conclusion du dossier de décision.
- **Fichiers** : `src/components/report/DossierDecisionSection.tsx` (l'enveloppe : eyebrow + H2 +
  ConclusionBlock + grille de sections + CTA), `src/components/report/ConclusionBlock.tsx` (les
  strates du verdict), `src/components/report/DecisionFactRenderParts.tsx` (FactBody : statement
  + limitation + signalConvention ; EvidenceRow : chips), `src/components/report/FactCompositionCard.tsx`
  (carte composée + le `<details>` « Voir le constat détaillé » DÉJÀ existant),
  `src/components/report/ConclusionRedigee.tsx` (chemin généré vs déterministe, même DOM),
  `src/lib/decision/conclusion-plan.ts` (ordre des registres, l. 5-12).
  Contexte parcours : `src/app/(account)/rapport/page.tsx` l. 238-280 (la carte « Votre projet »
  juste au-dessus, puis « En une minute »).
- **Références de forme RÉUSSIE** (consigne du porteur) : `TerritoryIdentityCard.tsx` (passeport),
  `TerritoryYearsBand.tsx` (grand signal « La mémoire du lieu »), `QuartierSynthesis.tsx` (titre
  Serif hero + horizons repliés + sources en pied), `ThermalComfortSection.tsx` (chips à
  ChipTooltip + `<details>` Drawer pour le secondaire), `kit.tsx` (ReportSection / GlassCard).
- **Moment du parcours** : sommet du rapport payant, première chose lue après la carte projet.
  Répond à « ce lieu me convient-il ? » et hiérarchise ce qu'on regarde ensuite.
- **Décision servie** : s'engager, creuser, ou écarter la commune.

---

## 1. Le diagnostic d'ÉCHELLE : pourquoi ça lit « AI slop / pâté collé »

Le porteur a raison, et ce n'est pas un problème de contenu : c'est un problème de **figure /
fond**. L'écran n'a AUCUN point focal. Sept symptômes concrets, tous mesurables dans le code :

**a) La plus grande typo de l'écran ne porte pas le signal — elle décore.**
Le H2 « {Commune}, au regard de votre projet. » (`DossierDecisionSection.tsx` l. 60,
`clamp(26px,3vw,40px)` Instrument Serif) est le plus GROS texte de tout le bloc. Or il ne dit
rien que le lecteur ait besoin de lire : c'est un cartouche de cadrage. Pendant ce temps, LE
signal — le verdict (`ConclusionBlock.tsx` l. 78) — est un `text-[21px]` sans-serif. **Le
signal est plus petit que le cadre.** Chez Territoire, la plus grande typo EST l'identité (le
nom de commande en Serif 28-42px, `TerritoryIdentityCard.tsx` l. 155-160) : elle raconte le
lieu. Ici la grande typo est inerte (signature n°7 violée : « une donnée vraie mais inerte »,
transposée au cartouche).

**b) L'échelle typographique est écrasée et non hiérarchique.**
De haut en bas, on empile ~40 (H2 inerte) / 21 (verdict) / 17 (lead) / 17 (reformulation projet
juste au-dessus) / 15 (condition) / 14 (statement) / 12,5 (limitation) / 12,5 (signalConvention)
/ 10 (chips). Huit tailles dans une fourchette de ~30px, **aucune dominante**, et le maximum
utile (21) n'est ni le plus grand ni détaché. Chez Logement/Territoire, le titre hero est à
28-40px et le corps à 15-16px : UN saut franc, pas un dégradé continu. Ici le dégradé continu
est exactement ce qui produit le « tout au même poids ».

**c) Tout est le même objet : rectangle glass empilé.**
La carte projet (`glass rounded-2xl p-7`), la conclusion (`glass rounded-2xl p-7`), puis N
cartes de sections (`glass rounded-xl p-6`), puis le CTA (bordé) : quatre à six surfaces de
verre quasi identiques, séparées par `gap-3.5` (14px). Aucune ne se distingue comme « la
réponse ». Territoire ouvre au contraire sur un objet À PART : le passeport (surface teintée à
la couleur du territoire, dépliage 3D `passport-unfold`, sceau de cire, bordure teintée) — un
figure/fond immédiat. La conclusion n'a aucun ancrage visuel équivalent.

**d) Monochromie grise.**
`text-label` / `text-muted` / `text-ghost` : une rampe de gris à faible contraste sur tout
l'écran. La couleur de tone (le `borderLeft: 2px` du verdict) est un filet de 2px qu'on ne voit
presque pas. Rien n'attire l'œil vers la réponse.

**e) Le même motif décoratif répété cinq fois dilue sa valeur.**
L'eyebrow mono-uppercase + pastille apparaît à CHAQUE niveau : « En une minute » (section),
label du verdict, titre de chaque section, grain de chaque carte, chips. Le même geste graphique
répété perd son rôle de signal. Territoire l'emploie avec parcimonie (un eyebrow par grande
zone).

**f) Deux lignes ghost par carte de vérification — le pâté vient d'être épaissi.**
Depuis la passe éditoriale, `FactBody` (`DecisionFactRenderParts.tsx` l. 60-62) empile sous le
statement (14px) : la `limitation` (ghost 12,5px) PUIS la `signalConvention` (ghost 12,5px).
Idem `SideBlock` (`FactCompositionCard.tsx` l. 12-13). Résultat : **trois lignes grisâtres
empilées par carte**, deux d'entre elles au même poids, même couleur, même taille. C'est
littéralement de la densité secondaire non hiérarchisée, ajoutée récemment. C'est le cœur
visuel du « pâté ».

**g) Le grain répété à l'identique carte après carte.**
`À l'échelle de la commune` / `À cette adresse` (`DossierDecisionSection.tsx` l. 117) en tête de
CHAQUE carte : sur une section homogène, la même étiquette se répète et devient du bruit.

**Synthèse du diagnostic** : l'écran n'échoue pas parce qu'il dit trop de choses fausses, mais
parce qu'il les dit toutes **au même volume**. Il n'y a pas de « une minute » possible : le
lecteur ne sait pas où poser l'œil en premier, car rien n'est plus grand, plus isolé, ni plus
contrasté que le reste. Le WOW manquant, c'est un point focal manquant.

---

## 2. L'élément à mettre en EXERGUE : le VERDICT, traité comme un grand signal

**Un seul héros : le verdict.** C'est la réponse à la seule question de l'écran. Il doit
devenir l'objet dominant, sur le modèle du nom de commune du passeport et du titre Serif de la
synthèse Quartier/Logement.

Traitement proposé (forme, pas prose) :

- **Taille** : passer le verdict de `text-[21px]` sans-serif à **Instrument Serif, `clamp` ~26-34px**,
  interligne resserré (~1.2), comme le titre hero de `QuartierSynthesis` (l. 268-279) et le nom
  de commune du passeport. C'est le pattern « grand signal » déjà validé par le porteur ailleurs.
- **Air** : marge généreuse au-dessus et au-dessous (le passeport et la bande respirent ;
  `TerritoryYearsBand` « émerge du fond sans cadre »). Le verdict doit être ISOLÉ, pas collé à
  l'eyebrow ni au lead.
- **Couleur = accent discret, jamais un panneau plein.** Le tone (rouge/orange/neutre/vert) reste
  porté par le filet gauche et l'eyebrow de label, PAS par un fond coloré ni un texte
  intégralement teinté. Un verdict `caution` en grand orange plein dramatiserait par la couleur
  (signature n°3 violée, invariant n°6). Rappel du 2026-07-17 : rouge/orange sur le VERDICT est
  honnête (ce sont des états ÉTABLIS), à la différence de la condition non examinée (non-savoir →
  violet). Donc l'accent coloré du verdict est légitime ; il doit rester un accent.

**Un seul objet en exergue, pas deux.** Le lead (« Ce qui pèse le plus » / « Ce qui demande votre
attention ») est le signal SECONDAIRE : il reste juste sous le verdict, à ~17px, mais nettement
détaché (air), pour se lire comme « par où commencer ». Ne pas lui donner un traitement hero : deux
héros = aucun héros.

**Ne PAS mettre le cartouche en exergue.** Corollaire direct : le H2 « {Commune}, au regard de
votre projet. » doit **cesser d'être la plus grande typo**. Deux options pour le porteur :
(i) le réduire à une kicker/eyebrow modeste au-dessus de « En une minute », ou (ii) le
supprimer et laisser l'eyebrow « En une minute » + le verdict Serif porter l'entrée. Dans les
deux cas, le plus gros caractère de l'écran doit être le verdict. C'est la règle « le plus grand
élément gagne sa place » : aujourd'hui il ne la gagne pas.

**Réserve (à lever au navigateur, et par l'Editorial Writer) :** le WOW du verdict-hero suppose
un verdict COURT, lisible comme un titre. Si les verdicts déterministes courent sur 3-4 lignes,
le grand Serif produira un pavé, pas un signal. Deux issues : un `clamp` de taille qui décroît
avec la longueur, ou une forme éditoriale « verdict-titre court + nuance en 17px dessous ». La
seconde relève de l'Editorial Writer, pas de moi ; je la signale comme dépendance.

---

## 3. Ce qui doit DESCENDRE en tooltip / drawer (et pourquoi ce n'est pas une perte d'honnêteté)

Le mécanisme existe DÉJÀ dans le codebase : le `<details>` « Voir le constat détaillé » de
`FactCompositionCard.tsx` (l. 70-84) et le `Drawer` `<details>` de `ThermalComfortSection.tsx`
(l. 20-35). La doctrine Territoire est « face = signal, drawer = référence » (`/memory:
climat_card_gabarit`). Il s'agit d'appliquer ce pattern aux cartes de décision.

Par ordre de priorité de repliement :

**a) `signalConvention` — à replier SANS hésiter (priorité 1).**
« futur•e signale cette exposition à partir de… » est une **convention de seuil = de la
méthode**. Or la doctrine (`interface.md`, hiérarchie des gloses) réserve méthode/seuil au
drawer/accordéon, jamais à la face. C'est exactement ce que Territoire met en pied (« Sources ·
INSEE / OSO ») ou en drawer. La sortir de la face (l. 62 de FactBody, l. 13 de SideBlock) et la
loger dans un tooltip sur le statement OU dans le `<details>` de la carte : le double-ghost
disparaît, l'honnêteté est intacte (l'info reste à un clic). **C'est le point que le porteur a
nommément soulevé, et le gain le plus net.**

**b) `limitation` — la garder visible, mais SEULE (priorité 2).**
La limitation (« reste à vérifier à cette adresse ») est une RÉSERVE sur la portée du fait :
elle protège l'honnêteté du signal (invariant n°3, n°5), et nous sommes ici dans le RAPPORT (où
les limites ont droit de cité, contrairement à l'écran de validation des critères). Donc je NE
recommande PAS de la replier par défaut : une fois `signalConvention` partie, il ne reste qu'UNE
ligne ghost sous le statement, ce qui suffit à casser le pâté. Option pour le porteur si la
densité reste forte sur les dossiers à nombreuses cartes : replier AUSSI la limitation dans le
`<details>` par carte. À trancher selon le rendu réel (nombre de cartes typique).

**c) Le grain (« À l'échelle de la commune ») — dégrouper (priorité 3).**
Plutôt qu'un eyebrow répété sur chaque carte, l'afficher une seule fois quand il CHANGE (grouper
les cartes par grain, ou ne montrer le grain que lorsqu'il diffère de la carte précédente). Sur
une section où toutes les cartes sont « à cette adresse », l'étiquette n'apparaît qu'une fois.
Retrait de bruit pur, zéro perte d'information.

**d) Les chips de preuve (EvidenceRow) — tension, pas tranché par moi.**
Les chips « Preuve · valeur » sont le mécanisme « source accessible » (invariant n°3, signature
« sources visibles » de `design.md`). Territoire, lui, met la source en pied/drawer (source à un
clic, pas sur la face). Deux options cohérentes : (i) garder les chips sur la face (source
toujours visible, plus dense) ; (ii) pousser preuve + action dans le `<details>` de la carte
(face = le constat seul, comme la face climat), source à un clic. L'option (ii) donne l'écran le
plus épuré et reste conforme (Territoire l'a établi), mais déplace la signature « source
visible » vers « source à un clic ». **Je pose le choix, je ne le tranche pas** : c'est un
arbitrage entre deux valeurs doctrinales (densité vs source exposée).

**Principe commun** : rien ne DISPARAÎT. Tout ce qui descend reste à un clic (`<details>` déjà
en place) ou en tooltip. Le secondaire cesse d'être au MÊME niveau que le signal ; il ne cesse
pas d'exister. C'est la définition même de « replier », pas de « masquer ».

---

## 4. La hiérarchie cible de l'écran, de haut en bas

En réutilisant explicitement les patterns validés (passeport, grand signal, face/drawer) :

0. **Kicker de section** : eyebrow « En une minute » (mono accent + pastille) — CONSERVÉ, c'est
   la promesse. Le H2 cartouche est démoté (voir §2) : il ne doit plus dominer.

1. **HÉROS — le verdict** (dans `ConclusionBlock`). Instrument Serif ~26-34px, isolé par de
   l'air, accent de tone en filet + eyebrow de label. C'est l'équivalent du nom de commune du
   passeport / du titre Serif de la synthèse. Déterministe, jamais généré (INCHANGÉ sur ce
   point). C'est le point focal, le WOW.

2. **Signal secondaire — le lead** (« Ce qui pèse le plus » / « Ce qui demande votre
   attention »). ~17px, détaché du verdict par de l'air. Pointeur « par où commencer ».

3. **Annotations du verdict** — condition non examinée (encadré violet, du 2026-07-17) et
   non-couvert (ghost, dernier). Petites, calmes, aérées. INCHANGÉES quant à leur registre.

4. **Séparation de zone.** Entre la conclusion (la réponse) et les cartes (la preuve), une
   respiration franche (marge nettement plus grande que `gap-3.5`, ou un filet discret), pour que
   le lecteur perçoive DEUX zones : « la réponse » puis « les pièces ». Aujourd'hui c'est un
   continuum. Territoire sépare visiblement le passeport, la bande, la synthèse.

5. **Les cartes de sections = FACE + DRAWER** (pattern `climat_card_gabarit` / FactComposition).
   Face : le constat (statement) + son tone de section. Replié dans le `<details>` par carte
   (déjà codé pour les cartes composées, à étendre aux cartes élémentaires) : `signalConvention`
   (toujours), preuve + action (option d), limitation (option b). Grain dégroupé (§3c). Les
   sections gardent leur titre et leur ordre épistémique.

Effet visé : à l'ouverture, l'œil tombe sur UN grand verdict Serif coloré-discret ; sous lui, un
pointeur ; puis, clairement en second rang, les pièces à charge que l'on déplie si on veut. « Une
minute » devient possible parce qu'il y a un ordre de lecture imposé par la taille, l'air et le
contraste — pas par la volonté du lecteur.

---

## 5. Ce qu'il ne faut PAS casser

- **Le verdict jamais généré** : il part en lecture seule (`ConclusionRedigee.tsx` l. 90). Le
  passage en grand Serif est un changement de STYLE dans `ConclusionBlock`, il ne touche pas la
  provenance du texte.
- **La structure DOM commune déterministe/généré** : les deux chemins passent par le MÊME
  `ConclusionBlock` (fallback Suspense atomique, `minHeight` anti-saut). Toute promotion typo
  doit rester dans ce composant partagé, jamais dupliquée dans un seul chemin. Le `minHeight:
  132px` devra être réévalué si le verdict grandit (sinon il ne protège plus du saut) — note
  technique pour l'orchestrateur.
- **L'ordre épistémique des registres** : verdict → condition → poids → non-couvert
  (`conclusion-plan.ts` l. 5-12). La hiérarchie VISUELLE proposée le respecte exactement ; ne pas
  réordonner pour des raisons esthétiques.
- **Aucun compteur / badge / score.** L'exergue est faite de TAILLE, d'AIR et d'un ACCENT de
  couleur — jamais d'un badge « verdict », d'une note, d'un rond de score, d'une jauge. Le grand
  Serif n'est pas un score : c'est une phrase. Invariant n°2 / ADR-0001 préservés.
- **La couleur du non-savoir** (condition en violet, du 2026-07-17) : ne pas la rebasculer en
  orange à l'occasion de la refonte.
- **Le `<details>` d'audit des cartes composées** (« Voir le constat détaillé ») : c'est le
  patron à ÉTENDRE, pas à remplacer.

---

## 6. Version minimale (~90 % de la valeur)

Deux gestes, sans refonte complète :

1. **Promouvoir le verdict en héros** : `ConclusionBlock.tsx` l. 78 → Instrument Serif
   `clamp` ~26-34px, plus d'air au-dessus/dessous, tone en accent discret ; et **démoter le H2
   cartouche** (`DossierDecisionSection.tsx` l. 60) pour qu'il ne dépasse plus le verdict. Cela
   crée à lui seul le point focal / l'effet WOW manquant.
2. **Tuer le double-ghost** : sortir `signalConvention` de la face (`DecisionFactRenderParts.tsx`
   l. 62 et `FactCompositionCard.tsx` l. 13) vers le `<details>` de carte ou un tooltip sur le
   statement.

Ces deux gestes donnent un point focal ET suppriment le symptôme le plus dense du pâté. Le reste
(grain dégroupé, séparation de zone, arbitrage chips) suit, mais n'est pas requis pour lever
l'essentiel du reproche.

---

## 7. Tensions non tranchées (laissées au porteur)

- **Le H2 cartouche : réduire ou supprimer ?** (§2). Je recommande de ne PAS lui laisser la plus
  grande typo ; le choix réduire/supprimer est au porteur.
- **La limitation : visible ou repliée ?** (§3b). Je recommande visible (une seule ligne suffit
  une fois signalConvention partie) ; à revoir si le nombre de cartes typique reste élevé au
  rendu réel.
- **Les chips de preuve : sur la face ou dans le drawer ?** (§3d). Arbitrage entre « source
  visible » (design.md) et « face épurée » (climat_card_gabarit). Les deux sont doctrinalement
  défendables.
- **Verdict long** : si les verdicts déterministes sont longs, le héros Serif devient un pavé.
  Dépendance à l'Editorial Writer (forme courte titre + nuance) et/ou à un clamp adaptatif. À
  vérifier au navigateur sur des dossiers réels variés.
- Rappel : les deux points ouverts du 2026-07-17 (registres `compositions_found`/
  `mismatches_found` construits mais jamais rendus ; variables `--accent`/`--info`/`--amethyst`
  à confirmer au navigateur) restent ouverts et interagissent avec cette refonte (si les cartes
  mismatch portent le détail que le verdict NOMME, le repliement des cartes ne doit pas enterrer
  ce que la conclusion promet).

---

## 8. Mise à jour de l'inventaire (prêt à écrire, si le porteur valide)

Dans « Les patterns d'écran déjà tranchés », compléter l'entrée sur la conclusion du dossier :

> **La conclusion « En une minute » a un HÉROS unique : le verdict.** Comme le passeport met le
> nom de commune en grand Serif et la synthèse son titre, la conclusion met le VERDICT en grand
> Serif isolé (le point focal, l'effet « une minute »), tone en accent discret jamais en fond
> plein. Le lead est le signal secondaire (17px, détaché), les annotations (condition, non-couvert)
> restent petites. Les cartes de preuve appliquent face/drawer (`climat_card_gabarit`) : la
> convention de seuil (`signalConvention`) et la méthode descendent au `<details>` par carte ou en
> tooltip, jamais en lignes ghost empilées sous le constat. Règle transposée : sur cet écran, le
> plus grand caractère doit porter le SIGNAL, jamais un cartouche de cadrage ; deux lignes ghost
> par carte est un défaut de hiérarchie, pas d'écriture.

---

## 9. Quand rouvrir ce sujet

- Si, au navigateur, le verdict-héros produit des pavés de 3-4 lignes sur des dossiers réels :
  rouvrir avec l'Editorial Writer (forme courte) ou un clamp adaptatif ; ne pas revenir au 21px
  plat, qui n'avait pas de point focal.
- Si `minHeight: 132px` ne protège plus du saut Suspense une fois le verdict agrandi : recalibrer
  la hauteur réservée avant d'ajouter quoi que ce soit.
- Si le repliement des chips (option d) est retenu et qu'un test lecteur montre une perte de
  confiance (« où est la source ? ») : ré-exposer la preuve sur la face, la signature « source
  visible » l'emporte alors sur l'épure.
- Si les dossiers réels ont typiquement PEU de cartes (2-3) : la limitation peut rester en face
  sans pâté ; si BEAUCOUP (6+), replier aussi la limitation.
- Si la refonte réintroduit par accident un badge/compteur pour « faire signal » : c'est une
  régression doctrinale (ADR-0001), rouvrir immédiatement.
- Si les cartes mismatch/composition quittent la page ou changent de cap : revérifier que le
  repliement face/drawer n'enterre pas ce que le verdict NOMME (lien avec le point ouvert du
  2026-07-17).
