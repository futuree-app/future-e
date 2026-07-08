# Design Critic — Module Logement : design, UI, structure

Date : 2026-07-08 · Branche : feat/logement-hotfix-confiance
Matière : 2 captures réelles en session payante (logement-full, territoire-full) + code.
Question-mère : cet écran sert-il la décision du lecteur, dans la voix et la DA de futur•e,
ou ajoute-t-il du bruit ?

Fichiers lus : `src/components/report/LogementModule.tsx`,
`src/components/report/logement/{kit,PropertyPassport,AutourSection,SinistraliteSection}.tsx`,
`src/components/report/LogementSynthesis.tsx`, `src/components/report/QuartierClimatData.tsx`
(référence Territoire), `src/components/AskFutureInlineMount.tsx`, `src/components/AskFuture.tsx`,
`docs/vault/modules/logement.md`, `docs/vault/recherches/inventaire-design.md`.

---

## Écran

Module 02 · Logement, rapport peuplé (7 rue du Taur, Toulouse, DPE D). Sert le moment
« que dois-je engager sur CE logement ? » (acheter / négocier / renoncer / rénover / rester).
Parcours : après Territoire, au grain adresse (le moat). Décision éclairée = un engagement
sur un bien précis, jamais une note.

Structure en 5 beats : Passeport (identité) → Synthèse IA streamée → preuves par grain
(Énergie, Confort chaleur / Risques bâti, Réglementaire, Sinistralité) → Autour de l'adresse
→ sonde projet + checklist « À vérifier ».

---

## Ce qui fonctionne (à préserver avant de réparer)

- **Le passeport est le bon opener.** Grain adresse en Serif grande échelle, sceau DPE jaune
  officiel (#ffff00), tilt 3D partagé (`PassportTiltScene`) : c'est le SEUL punch visuel du
  module et il est juste. Il dit « ce logement-là », il raconte le lieu (invariant n°7). Le
  sceau jaune est la seule couleur franche de tout l'écran — légitime (échelle DPE réglementaire),
  distinctive, honnête.
- **L'ordre identité → synthèse tient.** Il faut savoir QUEL logement avant de lire une lecture
  à son sujet. La synthèse en beat 2 (prose streamée « Ce logement ne traverse pas… ») fait
  bien son travail de récit-porteur (signature n°1 : on raconte avant d'expliquer). Ne pas la
  faire ouvrir avant le passeport.
- **La divulgation progressive est saine.** Phrase courante en tête → métriques → `<details>`
  méthode/sources. La sinistralité (métriques coût/fréquence + classes ONRN reformatées, pédagogie
  CatNat non prédictive) est un modèle d'honnêteté du signal : elle dit l'échelle (« dans la
  commune »), ne prédit rien, gate sur la représentativité. À NE PAS toucher côté honnêteté.
- **La checklist « À vérifier » comme sortie** (déterministe par posture) est la bonne clôture
  décisionnelle : elle rend actionnable sans conclure à la place du lecteur (invariant n°1).
- **Zéro interdit éditorial visible** dans la capture : pas de tiret cadratin, pas d'exclamation,
  pas d'emoji, pas de score global. Conforme.

---

## Le diagnostic « monotone » : ce que montrent les deux captures côte à côte

C'est le cœur du sujet. La différence n'est pas une question de goût, elle est structurelle.

**Territoire (référence) a une COLONNE VERTÉBRALE visuelle :**
1. un bloc-passeport avec **sélecteur d'horizon 2030/2050/2100** ;
2. la **timeline CatNat** (frise des années de reconnaissance, data-viz distinctive) ;
3. **« Les grands signaux »** = trois grilles de cartes **codées par famille couleur**
   (LE TERRITOIRE vert / LE CLIMAT orange / LES RISQUES bleu), 4 colonnes, chaque carte
   **cliquable → drawer** (chiffre phare → barres → récit → sources repliées) ;
4. le bloc **« Une question ? »** (AskFuture, suggestions + champ).
Le rythme alterne prose → frise → grilles scannables → question. L'œil a des points d'ancrage,
de la couleur qui ORGANISE (pas qui dramatise), et une profondeur (drawer) sans quitter la page.

**Logement empile 6-7 panneaux glass pleine largeur, tous taupe (#c8b89a), tous menés par la
prose, aucun en grille, aucune couleur de famille, aucun drawer, aucune data-viz.** Dans la
capture, tout le tiers central (Énergie → Confort → Risques bâti → Réglementaire → Sinistralité
→ Autour) est un long scroll de blocs quasi identiques. C'est ça, le monotone : ce n'est pas
« trop de texte », c'est **l'absence de hiérarchie visuelle et de variation de rythme**. Le
signal fort (le DPE, le +7 °C d'îlot de chaleur) est noyé au même niveau que le contexte.

Trois causes précises, chacune actionnable :
- **A. Pas de code-famille.** Logement a pourtant déjà ses familles (`FamilyHeading` :
  « Le logement lui-même » / « Ce à quoi cette adresse est exposée »). Mais elles sont rendues
  en filet gris neutre, jamais coloré (cf. `kit.tsx` : « SANS puce, jamais coloré »). Résultat :
  aucun repère visuel de bascule entre familles. Territoire, lui, colore ses en-têtes de famille.
- **B. Pas de langage de cartes.** Chaque preuve est un panneau pleine largeur au lieu d'un
  jeu de cartes-indicateurs scannables. L'œil ne peut pas balayer, il doit tout lire.
- **C. Pas de drawer.** Toute la profondeur passe par `<details>` inline (repli vertical) au
  lieu du drawer glissant qui est LA primitive de futur•e (signature n°5). Le module se prive
  du geste signature du produit.

---

## Ce que Logement DOIT reprendre de Territoire (et ce qu'il ne doit PAS singer)

### Transposable (à reprendre)

1. **Le code-famille couleur sur les en-têtes de famille.** Donner à chaque `FamilyHeading` sa
   puce + son filet accentués. Les familles Logement s'y prêtent : « Le logement » (taupe, le
   bien) / « L'exposition de l'adresse » (bleu, comme les risques Territoire) / « Autour »
   (vert, le territoire immédiat). Ce n'est PAS dramatiser (la couleur ORGANISE, elle ne colore
   pas un verdict — invariant n°3 respecté tant qu'on ne met pas de rouge alarmiste). Gain de
   scannabilité immédiat, effort faible.
2. **Le langage de cartes-indicateurs + drawer pour le beat exposition.** Convertir Risques bâti
   / Réglementaire / (résumé) Sinistralité en une grille de cartes (face = le fait à l'adresse,
   ex. « Retrait-gonflement · Exposition moyenne », « Zone soumise à prescriptions »), chaque
   carte ouvrant le drawer glissant qui porte le détail + méthode. C'est le plus gros levier
   anti-monotone : il remplace 3 panneaux verticaux par une grille balayable et récupère la
   primitive drawer. La prose longue descend dans le drawer, pas à l'écran.
3. **Le bloc AskFuture.** Voir section dédiée. Oui, en fin de module.

### À NE PAS singer (le grain adresse l'interdit)

1. **Le sélecteur d'horizon 2030/2050/2100 : NON.** Doctrine « modules-calques » (logement.md,
   invariant central) : le climat ne change jamais le diagnostic, il change seulement le POIDS
   d'une caractéristique du bâti. Un sélecteur d'horizon réimporterait la trajectoire climatique
   de Territoire DANS Logement et referait du climat le sujet. Le croisement climat×bâti reste un
   signal qualitatif curé dans la synthèse (« à mesure que les étés se réchauffent »), jamais un
   graphe pilotable. Danger : fausse certitude + violation de grain.
2. **Une timeline data-viz sur la sinistralité : NON, danger.** La sinistralité Logement est
   COMMUNALE, gatée par la représentativité, en classes verbatim. Une frise à la CatNat la
   dramatiserait et la ferait lire comme une exposition de l'adresse, exactement ce que la
   doctrine interdit (« toujours dire l'échelle »). La timeline CatNat de Territoire est légitime
   parce qu'elle est communale ET affichée comme telle ; transposée à Logement elle mentirait sur
   le grain.
3. **La couleur « rassurante » (vert) sur un signal de risque.** Le vert de l'« Autour » est
   acceptable (territoire immédiat, registre neutre), jamais pour dire « ce logement va bien ».

---

## Le bloc AskFuture — recommandation : OUI, avec une réserve à trancher

Recommandation nette : **ajouter le bloc inline en fin de module** (après beat 5 « À vérifier »,
avant le footer), en miroir exact de Territoire. Le composant existe déjà
(`AskFutureInlineMount`, variante `inline`, gating de plan identique). Valeur pour la décision :
après avoir lu l'énergie, l'exposition et l'autour, le lecteur a des questions résiduelles
d'engagement (« ce DPE D, je négocie combien ? », « l'assurance sur cette adresse ? », « je
rénove d'abord quoi ? ») que la lecture figée ne couvre pas. C'est du service, pas du gadget.

Questions suggérées propres au logement (vouvoiement, zéro exclamation, sujet = le logement) —
posées comme matière, l'Editorial Writer arbitrera la formulation :
- « Ce DPE change-t-il ce que je peux négocier ? »
- « Que vérifier avant d'acheter ce logement ? »
- « Comment l'exposition de cette adresse pèse-t-elle sur l'assurance ? »

**RÉSERVE À NOMMER (non tranchée, pour le porteur).** `AskFutureInlineMount` résout la commune
via `resolveReadableTerritory` (la commune de RÉSIDENCE de l'utilisateur), et `AskFuture` répond
« sur {communeName} ». Or Logement analyse parfois un bien en PROSPECTION dans une AUTRE commune
(cas payant explicite : bien à Toulouse, résidence à Paris — le code gère déjà `lockedCommune` et
la note « votre commune principale reste Paris »). Le bloc AskFuture poserait alors des questions
sur Paris sous un rapport qui parle de Toulouse : incohérence de contexte. Ce n'est pas à moi de
coder le fix ; je signale que l'ajout d'AskFuture à Logement suppose de brancher son scope sur
l'ADRESSE analysée, pas sur la résidence. Sans ça, le bloc ment sur son objet en mode prospection.

---

## Le « wow honnête » — 1 à 3 moments, dans le design system

Le wow doit venir de la clarté et d'un ou deux moments forts, pas d'ornement (signatures n°1
et n°6). Trois occasions, chiffrées :

1. **[FLAGSHIP] Le DPE en dette datée (échéance légale) dans EnergieSection.** Aujourd'hui
   EnergieSection affiche « Étiquette D, Peu performant » + conso/émissions : plat, non
   distinctif. Le moat de Logement, c'est le DPE lu comme **dette datée** (logement.md, Face 1).
   Une échelle légale honnête — où se situe CE logement (D) et quand le mur réglementaire tombe
   (calendrier passoires : G/F/E déjà ou bientôt interdits à la location) — est une data-viz
   **distinctive, décisionnelle, et non prédictive** (c'est la loi, pas une supposition de marché,
   donc hors ADR-0001). C'est LE graphe que seul Logement peut porter. Impact fort / effort moyen.
2. **Promouvoir l'îlot de chaleur « +7,0 °C ».** Actuellement enterré tout en bas de
   `AutourSection`, en prose grise, alors que c'est le chiffre le plus viscéral et le plus
   spécifique à l'adresse de tout le module. Lui donner un moment visuel (bloc accentué, le
   nombre mis à l'échelle avec un repère « zone peu urbanisée = référence ») = wow honnête,
   effort faible. GARDE-FOU : conserver la mention « environnement urbain proche, pas la
   température à l'intérieur » (grain grand-IRIS, pas l'adresse stricte) — ne pas laisser le
   visuel sur-affirmer une précision au logement.
3. **Le passeport, déjà là.** Ne pas en ajouter un deuxième ailleurs ; le tilt est le moment
   d'ouverture, il suffit. (Note : le badge « D » jaune apparaît deux fois — passeport +
   EnergieSection ; léger doublon, tolérable, mais si le point 1 refond EnergieSection, unifier.)

Tension à nommer explicitement : **wow vs sobriété** (signature n°2). Le risque en ajoutant
couleur + cartes + 2 data-viz est de basculer dans la densité. Garde-fou : chaque ajout doit
REMPLACER de la prose empilée, pas s'y ajouter. Le wow ici = mieux hiérarchisé, pas plus chargé.

---

## Conformité aux patterns

- **Carte/drawer** : ÉCART. Le pattern central de futur•e (carte-porte → drawer glissant,
  signature n°5) est absent de Logement ; tout passe par `<details>` inline. C'est le principal
  écart de conformité.
- **Kit partagé** : Logement consomme bien `ReportSection`/`GlassCard` (kit.tsx). Mais
  l'inventaire (section « Kit de cartes ») dit qu'un module doit se tenir au registre de
  Territoire (~15-16px) et reprendre l'effet 3D du passeport : le passeport est conforme (tilt),
  la prose de section aussi (~14-16px). En revanche la masse de `style={{var(--)}}` inline
  (~85 selon la dette connue) n'est PAS mon sujet (méthode, pas incohérence vue) — je ne la
  flague pas.
- **Hero** : conforme au gabarit (kicker mono, Serif italic, sous-titre mesuré). La 2e ligne
  « Énergie, risques, entourage. » est une liste de thèmes, exactement comme Territoire
  (« Territoire, climat, risques. ») : cohérent avec le pattern maison. Voir signalement
  éditorial ci-dessous.
- **Divulgation progressive** : conforme et exemplaire (sinistralité, réglementaire).

## Honnêteté du signal

- **Aucune affirmation chiffrée sans source** : chaque bloc porte son accordéon/footer sources.
  Conforme.
- **Pas de fausse certitude** dans l'état actuel : pas de score, pas de jauge rouge, l'îlot de
  chaleur porte son garde-fou de grain. Conforme — et c'est justement ce qu'il faut PROTÉGER en
  ajoutant du visuel (le point de vigilance des recommandations wow).
- **Élément distinctif** : le passeport raconte le lieu (bien). L'îlot +7 °C aussi. Rien d'inerte
  repéré.

## Incohérences visibles (et seulement visibles)

- **Sinistralité : « 10 000 à 20 000 € » affiché à l'IDENTIQUE pour sécheresse ET inondation.**
  Visuellement, deux valeurs strictement identiques côte à côte dans un bloc de comparaison se
  lisent comme un bug de copie. C'est en réalité une coïncidence de classes verbatim ONRN
  légitimes (je ne touche pas à la donnée). Signalement de forme : quand deux sous-valeurs d'une
  compare tombent identiques, la mise en page gagnerait à ne pas les présenter en parallèle
  strict (ou à porter le fait « même classe » explicitement). À l'appréciation du porteur.
- Pas de radius qui jure, pas de thème cassé (tout sombre, cohérent), pas de phrase coupée à
  mi-bloc (la prose remplit les glass, largeurs conformes à la règle).

## Signalements éditoriaux (sans réécrire)

- **2e ligne du hero = liste de thèmes, pas le compromis.** « Énergie, risques, entourage »
  nomme les faces (donnée-catégorie) plutôt que la décision/le compromis (doctrine
  positionnement : le sous-titre dit la décision). MAIS c'est le même parti que Territoire, donc
  c'est un choix de pattern assumé, pas une régression Logement. Posé pour cohérence, pas comme
  défaut isolé.
- Rien d'autre : pas d'interdit visible, tooltips dans leur rôle (pas de source/méthode dans les
  MetricTooltip vus).

---

## Verdict : À AJUSTER

Le module est HONNÊTE et bien structuré au fond (beats justes, signal protégé, zéro fausse
certitude). Son défaut est de FORME et de RYTHME : il se prive du langage visuel de futur•e
(familles colorées, cartes, drawer, un moment data-viz distinctif) et lit donc « plus plat » et
« moins de futur•e » que Territoire. Ce n'est pas un problème de beauté, c'est que la platitude
NOIE le signal fort (DPE, +7 °C) au même niveau que le contexte : l'écran affiche bien mais
hiérarchise mal. Rien à supprimer pour cause d'ornement (le module pèche par défaut, pas par
excès) ; l'enjeu est de HIÉRARCHISER et de RÉVÉLER ce qui est déjà là.

---

## Priorisation

**Quick wins (faible effort) :**
1. Colorer les en-têtes de famille (`FamilyHeading` accentué par famille) → scannabilité
   immédiate. [effort faible / impact moyen-fort]
2. Promouvoir l'îlot de chaleur +7 °C en moment visuel (bloc accentué, nombre à l'échelle,
   garde-fou de grain conservé). [faible / fort]
3. Ajouter le bloc AskFuture inline en fin de module — CONDITIONNÉ à trancher le scope
   commune-vs-adresse (réserve ci-dessus). [faible côté UI / décision produit à prendre]

**Chantiers :**
4. DPE en dette datée (échéance légale) dans EnergieSection = le flagship wow, distinctif et
   honnête. [effort moyen / impact fort]
5. Convertir le beat exposition (Risques bâti + Réglementaire + résumé Sinistralité) en grille
   de cartes-indicateurs + drawer glissant = le plus gros levier anti-monotone, récupère la
   primitive signature. [effort élevé / impact fort]

Ordre conseillé : 1 → 2 → 4 → 5, avec 3 en parallèle une fois le scope AskFuture tranché.

---

## Cohérence (tensions non tranchées, posées au porteur)

- **Wow vs sobriété (signature n°2).** Chaque ajout visuel doit REMPLACER de la prose empilée,
  jamais s'y additionner. À surveiller à l'implémentation.
- **Couleur d'organisation vs émotion par le récit (signature n°3).** Coder les familles par
  couleur est permis tant que la couleur ORGANISE ; interdiction de rouge alarmiste / vert
  flatteur sur un verdict. Ligne à tenir.
- **Scope AskFuture (résidence vs adresse analysée).** Vraie décision produit à prendre avant
  d'ajouter le bloc en mode prospection. Non tranché.
- **Drawer sombre en page claire** (tension ouverte n°2 de l'inventaire) : si on introduit le
  drawer dans Logement, il hérite du sombre figé de `MetricDrawer`. Cohérent tant que le rapport
  est sombre ; à re-vérifier si un mode clair du rapport arrive.

## Mise à jour de l'inventaire (prêt à écrire par Claude principal)

Deux entrées candidates pour `inventaire-design.md` :
1. **Pattern stabilisable** : « Un module de rapport hérite du langage de FAMILLES colorées +
   cartes-porte + drawer de Territoire, MAIS jamais des dispositifs liés au grain communal
   (sélecteur d'horizon, timeline CatNat) quand son grain est l'adresse. Le grain décide quels
   dispositifs sont transposables. » (généralise aux futurs Santé, Mobilité).
2. **Tension nouvelle** : « AskFuture inline est scopé sur la commune de résidence ; un module au
   grain adresse en prospection (bien dans une autre commune) crée une incohérence de contexte.
   Scope AskFuture = résidence ou objet analysé ? — à trancher. »

---

## Réflexes de clôture

**Version minimale (~90 % de la valeur).** Les deux quick wins 1 + 2 : colorer les en-têtes de
famille + promouvoir l'îlot de chaleur +7 °C en moment visuel. À eux seuls ils cassent la
monotonie perçue et révèlent le signal fort, SANS toucher à la structure, aux données, ni à
l'honnêteté. Le reste (DPE daté, cartes+drawer, AskFuture) est de l'amplification, pas le socle.

**Quand rouvrir ce sujet.**
- Si `AUTO_SYNTHESIS` repasse OFF en payant : le beat 2 devient un bouton « Générer », le module
  perd son porteur de récit → rejuger le rythme.
- Si la conversion en cartes+drawer (chantier 5) commence à faire lire l'exposition comme un
  score/palier : re-vérifier ADR-0001 sur place.
- Si l'îlot de chaleur, mis en avant, se met à sur-affirmer une précision à l'adresse (retours
  support « ma chambre fait +7 °C ») : re-border le garde-fou de grain.
- Si AskFuture est ajouté sans trancher le scope commune/adresse : rouvrir dès le premier retour
  d'un utilisateur en prospection.
- Si le porteur tranche la retokenisation des primitives (tension ouverte n°1) : sans objet pour
  ma lentille, mais à re-lire l'inventaire.
