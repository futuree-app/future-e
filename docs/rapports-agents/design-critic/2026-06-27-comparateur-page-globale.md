# Critique design — Comparateur « mode choix », page résultat globale

> Design Critic, 2026-06-27. Read-only. Commit de référence : main 99ab154 (branche
> feat/comparateur-mode-choix). Code lu, pixels non vus : les verdicts de largeur et de
> contraste sont dérivés du code et à confirmer à l'œil.

## Écran

- **Nom** : résultat de comparaison « mode choix » (le lecteur a nommé 2-3 communes).
- **Fichiers** : `src/app/(public)/comparateur/page.tsx` (composition, espacements,
  hiérarchie), `ModeChoixSynthese.tsx`, `ThemeExplorer.tsx`, `ThemeMatrix.tsx`,
  `ModeChoixSearch.tsx`, `ModeChoixAsk.tsx`.
- **Moment du parcours** : porte 2 du comparateur (départage de communes connues), aperçu
  gratuit qui doit convertir vers le Pack 39 €.
- **Décision éclairée** : « laquelle de ces communes me ressemble le plus, et sur quel
  compromis je tranche ? » — pas un classement, pas un score (conforme ADR-0001).

## Séquence réelle (7 blocs, de haut en bas)

1. Hero compact : kicker mono accent + 1 phrase muted (mb-6).
2. Saisie (carte glass).
3. Synthèse « En un coup d'œil » (mt-10) : kicker accent + phrase d'arbitrage **serif 18px
   label** + narratif IA **sans 17px muted** streamé (machine à écrire).
4. Cartes face-à-face (mt-8) : par commune, n° mono + nom **serif 20px** + identité accent
   italic 14.5 + compromis muted 13.
5. Explorateur « Là où ça se joue » (mt-12) : kicker accent + titre thème **serif 23px** +
   synthèse italic muted + matrice + vitrine de cartes verrouillées (cadenas, hover).
6. Ask futur•e (mt-12) : kicker + **serif 22px** « Demandez à futur•e » + chips + zone de saisie.
7. CTA Pack (mt-10) : carte glass border accent, texte **plafonné à 640px**, bouton 39 €.

---

## Ce qui fonctionne (à préserver)

- **La grammaire futur•e est respectée et lisible.** Kickers mono capitales accent à chaque
  section : rythme repérable, navigation verticale claire. C'est la signature, pas du bruit.
- **Aucun score, aucun couronnement.** Hiérarchisation par une phrase d'arbitrage
  déterministe + « Avantage X » ligne par ligne, cellule leader en accent. Le critère reste au
  lecteur. Conforme invariant n°2 / ADR-0001 / `project_comparateur_complet`.
- **Discipline des sources tenue.** Le narratif ne cite aucune base ; la matrice porte des
  paliers, le tooltip `LabelTip` reste « pourquoi ça aide à comprendre ». Conforme.
- **Le compteur est honnête.** « N critères comparés » (chiffre vrai) et « près de 30
  critères » dans la saisie (jamais un rond faux) : conforme `feedback_positionnement_compatibilite`.
- **L'espacement croît vers le bas** (mb-6 → mt-8 → mt-10 → mt-12) : le haut est dense, le bas
  respire. Intention de rythme présente.
- **Le hover des cartes verrouillées est juste, pas gadget** (voir plus bas).

---

## Ce qui peut disparaître / se simplifier (par priorité)

1. **Redondance identité+compromis : synthèse narrative vs cartes face-à-face.** Le narratif IA
   (bloc 3) est construit à partir de `identite` + `compromis` + `distinctive` ; les cartes
   (bloc 4) affichent `identite` (accent italic) + `compromis` (muted) **mot pour mot**. La même
   matière passe deux fois, en prose puis en structuré. C'est la source n°1 de la sensation de
   surcharge que ChatGPT a sentie. Ce n'est pas forcément à couper : les deux modes de lecture
   (gestalt en prose / scan côte-à-côte) sont légitimes. MAIS le narratif ne gagne sa place que
   s'il fait le travail **relationnel** que les cartes ne peuvent pas faire (« X l'emporte sur Y
   sauf si vous tenez à Z »). S'il re-liste les identités commune par commune, il double les
   cartes et devient le premier candidat au retrait. À regarder sur sortie réelle (relève en
   partie du prompt, donc de l'éditorial — je le pose, je ne tranche pas).

2. **Le ralentissement « machine à écrire » est de l'ornement posé sur un vrai stream.** Le
   commentaire de code l'assume : « effet wow ». La synthèse streame déjà (latence réelle, OK) ;
   par-dessus, l'effet retombe volontairement à un rythme caractère-par-caractère « au bord
   vivant » (`tick`, stride dégressif). Ce throttling théâtral n'aide pas la décision, il met en
   scène une persona qui « tape pour vous » (renforcé par le placeholder « futur•e regarde vos
   communes… »). Tension avec la voix sobre (invariant n°6, intelligence pas spectacle).
   Proposition : laisser le texte s'afficher au rythme où il arrive du réseau, sans throttle
   décoratif. Le stream reste, le théâtre part.

---

## Conformité aux patterns

- **Comparateur = révélateur d'arbitrages** : conforme. Identité / forces (offre) / compromis
  par commune, matrice premium honnête, narratifs au rapport.
- **Paywall de conviction** : le bloc CTA est court mais oriente sur la valeur (« là où ça
  décide votre choix »), honnête sur ce que le Pack ajoute. Conforme à l'esprit
  `project_paywall_territoire` (version condensée, acceptable en fin de page gratuite).
- **Hiérarchie des gloses** : `LabelTip` (label souligné pointillé, max-w 240, « pourquoi ça
  aide ») reprend l'esprit ChipTooltip. À VÉRIFIER sur données : le contenu de `ligne.aide` ne
  doit pas glisser vers méthode/source/seuil chiffré (sinon il déborde son rôle, cf.
  `feedback_tooltip_no_sources`). Non vérifiable depuis le code.

---

## Honnêteté du signal

- **Cellule `alerte` rendue en `text-danger` (rouge).** `paletteTone` colore une cellule en
  rouge quand `cell.alerte`. La doctrine (signature n°3) refuse « le rouge alarmiste pour faire
  peur » : l'émotion vient du récit, pas de la couleur. Selon quand `alerte` se déclenche, ce
  rouge peut dramatiser un palier par la teinte au lieu de le dire. À regarder : le rouge est-il
  gagné (un vrai signal de risque qu'on assume) ou décoratif/alarmiste ? Je le pose comme point
  d'honnêteté à trancher, je ne vois pas la règle de déclenchement.
- **Pas de fausse certitude détectée** dans la structure : compteurs vrais, paliers absolus +
  avantage relatif au trio, pas de score implicite.

---

## Incohérences visibles (et seulement visibles)

1. **CTA Pack : texte plafonné à 640px dans une carte large de 1100px → cas interdit par la
   règle gravée.** `page.tsx:190,193` : les deux paragraphes du CTA portent `max-w-[640px]`
   alors que la carte glass qui les entoure occupe toute la largeur (1100). C'est exactement
   l'effet « phrase coupée en plein milieu, vide à droite » que `AGENTS.md` /
   `feedback_text_maxwidth` interdit : *texte dans une carte bordée large = il remplit le bloc,
   aucun max-w propre*. À REVOIR : retirer les `max-w-[640px]` (le texte remplit la carte) ou
   resserrer la carte elle-même.

2. **Synthèse : prose ouverte sans aucune mesure → lignes trop larges (~1100px).** `Synthèse`
   n'a aucun `max-w` ; l'arbitrage (18px) et le narratif (17px) courent sur toute la largeur du
   conteneur (1100px), soit largement plus de 90 caractères par ligne. Ici la règle joue dans
   l'AUTRE sens : ce texte n'est PAS dans une carte bordée, c'est de la prose en espace ouvert —
   le cas où un `max-w` est **légitime et souhaitable** (« sous-titre mesuré en espace ouvert »).
   À AJUSTER : donner une mesure de lecture (~680px) à la synthèse. Verdict de confort exact à
   confirmer à l'œil, mais 1100px de prose courante est trop large par construction.

Aucune incohérence de radius / orange / thème entre éléments voisins repérée.

---

## Hiérarchie visuelle : quel bloc doit dominer ?

**Constat : l'apex de sens n'est pas l'apex typographique.** Sur une page résultat, le bloc qui
porte la décision est la synthèse (la phrase d'arbitrage = la lecture du choix). Or sa phrase
serif est en **18px**, plus petite que le nom de commune des cartes (**20px**) et surtout que le
titre de thème de l'explorateur (**23px**), qui devient le plus gros texte de la page. La
hiérarchie est plate, voire inversée : l'œil est tiré vers l'explorateur, pas vers la lecture du
choix.

Proposition (révéler) : faire de la **phrase d'arbitrage** le plus grand moment typographique de
la page résultat (au moins ≥ au titre de thème), pour que le premier regard tombe sur « voici
comment ça se départage » avant « voici un thème ». C'est cohérent avec « un écran raconte avant
d'expliquer » : la synthèse raconte, l'explorateur explique.

## Les deux registres typo de la synthèse (serif arbitrage / sans narratif)

Cohabitation **défendable et même juste** : le serif label porte l'ancre déterministe (stable,
autoritaire), le sans muted porte l'élaboration IA (plus tendre, secondaire). La hiérarchie
serif-label > sans-muted fonctionne. Deux réserves : (a) avec seulement `mb-3` entre eux, on peut
lire l'arbitrage comme un « titre » du narratif — acceptable si c'est voulu ; (b) le risque réel
n'est pas typographique mais sémantique : que la première phrase du narratif redise l'arbitrage.
À surveiller sur sortie réelle.

## Hover des cartes verrouillées : subtil et juste, ou gadget ?

**Juste, pas gadget.** Le cadenas dont l'anse se soulève + l'élévation (translate-y-0.5, shadow,
border accent, 300ms) **encodent un état fonctionnel** : la carte est ouvrable (on peut révéler
ce thème). Quand la redirection est consommée, les cartes non-ouvrables gardent un cadenas
statique, cursor-default : la distinction ouvrable / vraiment-verrouillé est honnête. C'est de
l'affordance, pas de la décoration. À préserver.

Réserve mineure de cohérence DA (à poser au porteur, pas à trancher) : le porteur a rejeté
icônes/emojis sur les chips par sobriété ; le cadenas est une icône. Différence de rôle
(indicateur d'état vs ornement) qui le justifie ici, mais c'est la même famille de décision —
au porteur de confirmer que l'icône d'état est admise là où l'icône décorative est refusée.

---

## Signalements éditoriaux (sans réécrire)

- **Placeholder « futur•e regarde vos communes… »** : met en scène une persona qui observe en
  direct. Couplé au throttle machine-à-écrire, ça pousse vers le registre « performance » plutôt
  que sobriété. Observation pour le porteur / futur agent éditorial.
- Aucun interdit visible repéré (pas de tiret cadratin, pas d'exclamation, pas d'emoji, pas de
  comparaison de foyers, pas de score).
- Le sous-titre du hero compact dit bien le compromis (« ce que chacune vous fait gagner ou
  perdre »), pas une donnée : conforme.

---

## Verdict global : À AJUSTER

La page sert la décision, dans la voix et la DA de futur•e : grammaire respectée, zéro score,
sources tenues, sobriété globale. Elle n'ajoute pas de bruit *gratuit*. Mais elle porte cinq
points à reprendre, par ordre d'importance :

1. **(visible, règle gravée) CTA Pack** : retirer le `max-w-[640px]` dans la carte large
   (texte coupé à mi-bloc). — À REVOIR.
2. **(hiérarchie) Faire de la phrase d'arbitrage l'apex typographique** de la page résultat,
   au lieu du titre d'explorateur. — À AJUSTER.
3. **(visible, lecture) Donner une mesure (~680px) à la prose ouverte de la synthèse**
   (1100px de large = lignes trop longues). — À AJUSTER.
4. **(densité / redondance) Vérifier que le narratif fait du relationnel** et ne redouble pas
   les cartes identité+compromis ; sinon, c'est le candidat au retrait. — À AJUSTER (zone
   frontière avec l'éditorial).
5. **(voix / ornement) Retirer le throttle théâtral « machine à écrire »** (garder le stream
   réseau, lâcher l'effet wow). — À AJUSTER.

Sur la question « ça respire ? » : la sensation de surcharge ne vient pas du NOMBRE de blocs
(chacun a un rôle distinct : lire / scanner / explorer / approfondir / convertir), elle vient de
(a) la redondance identité-compromis du haut de page, (b) l'absence de mesure de lecture qui
laisse la prose s'étaler, et (c) la hiérarchie plate qui ne dit pas où regarder d'abord. Régler
2-3-4 fait respirer la page sans rien retirer de structurant.

---

## Cohérence (tensions que je ne tranche pas)

- **Rouge `text-danger` dans la matrice vs « pas de couleur qui dramatise »** (signature n°3) :
  tension d'honnêteté à arbitrer selon la règle de déclenchement de `alerte`.
- **Icône d'état (cadenas) vs rejet des icônes décoratives** (décision porteur sur les chips) :
  cohérence DA à confirmer.
- **Frontière Critic / Éditorial** : le narratif streamé et son placeholder relèvent en partie
  du prompt/de la prose. Je signale la forme (redondance, throttle, persona) ; la réécriture
  revient au porteur / futur agent éditorial.

## Mise à jour de l'inventaire (prêt à écrire par Claude principal, si retenu)

- **Pattern stabilisé** à graver dans `inventaire-design.md` (section patterns) : *l'aperçu
  gratuit du comparateur = synthèse (lire le choix) → cartes face-à-face (scanner) → explorateur
  1 thème ouvert + vitrine verrouillée ouvrable (1 redirection) → Ask borné → CTA Pack.* Le
  cadenas qui s'ouvre au survol = indicateur d'état d'ouvrabilité, admis (icône d'état ≠ icône
  décorative).
- **Tension nouvelle** à ajouter aux tensions ouvertes : *effets de “révélation live” (machine à
  écrire, placeholder-persona) — où s'arrête le stream utile, où commence l'ornement de
  performance ?* Touche la voix autant que l'écran.
- **Rappel de règle** : la règle largeur vaut dans les DEUX sens — pas de `max-w` plus étroit
  que le bloc bordé (CTA), MAIS la prose en espace ouvert (synthèse) DOIT être mesurée. Les deux
  fautes coexistent sur cette page : utile comme exemple-type.
