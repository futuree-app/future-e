# Design Critic — Hiérarchie de la phase « results » de /ou-vivre

Date : 2026-06-28
Écran : phase `results` de `/ou-vivre`
Fichier : `src/app/(public)/ou-vivre/OuVivreClient.tsx`
Composant clé : `InterpretationPanel` (l.218-409), rendu de results (l.1113-1289+)
Moment du parcours : aboutissement du flux un-clic `parse → match → results` (le gate `confirm` a été retiré).
Décision éclairée : « lesquels de ces 3 territoires j'explore / je compare ? »

---

## Question tranchée
Le porteur : « Les territoires à regarder se mélange beaucoup au reste, on ne comprend pas
tout de suite que c'est le cœur de la réponse. » Hypothèse : fond de couleur derrière les 3 cartes.

Verdict : **À AJUSTER**. Le diagnostic de l'orchestrateur est juste. Le problème est une
**absence de hiérarchie**, pas une absence de couleur. Le fond de couleur seul aggraverait.

---

## Ce qui fonctionne (à préserver)
- **Les cartes territoires elles-mêmes sont bien construites** : identité en italique accent,
  nom en Serif, `matchTier` en mono, forces préfixées `+` vert, compromis séparé par un filet,
  CTA sobre. Bon pattern « révélateur d'arbitrages » (zéro score, conforme ADR-0001). Ne pas y toucher.
- **La reformulation toujours visible** (l.277-283, hors du bloc `open`) : c'est le « il m'a
  compris », elle survit même panneau replié. Juste.
- **L'honnêteté du périmètre** (appliedZones, l.1135-1148) : ghost 12px, dur vs souple
  distingués. Conforme invariant n°3/n°5. À garder tel quel.
- **La voix** : « Mais ils ne racontent pas la même histoire. » (italic accent) — pas de tiret
  cadratin, pas d'exclamation, pas d'emoji. Conforme.
- **Largeur** : aucun `max-w` fautif ; le `max-w-[520px]` du Pack (l.1268) est en flex-row
  partagé avec le bouton, donc légitime (doctrine interface §1). RAS.

---

## La cause réelle : une pile de surfaces de même registre
En results, l'œil descend une **pile de blocs `glass rounded-2xl p-7` strictement équivalents** :
1. `InterpretationPanel` — glass p-7, **ouvert par défaut** (`useState(true)`, l.241) → affiche
   chips critères + périmètre + « ce qui reste ouvert ». **Masse visuelle la plus lourde de la page.**
2. appliedZones — ghost 12px (léger, OK).
3. Synthèse « Ce que votre recherche révèle » — glass p-7, eyebrow mono + paragraphe 16px.
4. Territoires — h2 Serif 24px + 3 `<article>` **glass p-7** (mêmes radius/padding/élévation),
   `borderTop: 2px accent` (signal faible).
5. Pack Décision — glass p-7 **avec bordure accent pleine + `boxShadow: 0 0 0 1px accent`** (l.1256).
6. « Lire les arbitrages » — glass p-7.

Deux conséquences :
- **Tous les blocs ont le même poids** (radius, padding, élévation, fond verre). Le titre Serif
  des territoires ne suffit pas : la section n'a pas de conteneur, pas de séparateur, pas de
  respiration distincte (mt-9 vs mt-7 ailleurs). L'œil lit 6 cartes égales, pas 1 réponse + 5 appuis.
- **Pire : le bloc le plus emphatique visuellement n'est pas la réponse, c'est l'upsell.** Le
  Pack (l.1253-1289) porte la seule bordure accent pleine + halo de la page ; les territoires
  (le cœur honnête) n'ont qu'un filet de 2px en haut. **La forme met en avant le payant avant la
  réponse** — tension directe avec « la forme sert le fond » (doctrine/design.md, principe de tête).

---

## Ce qui peut disparaître / s'alléger (premier réflexe)
Avant d'ajouter quoi que ce soit : **réduire la masse en tête**.
- **Replier `InterpretationPanel` par défaut** (`useState(false)`, l.241). La reformulation
  reste visible (hors du `open`), le détail (chips/périmètre/ouvert) se range derrière « Détail ».
  Cohérent avec le passage en un-clic : la reformulation valide la compréhension, le reste est
  secondaire — c'est exactement ce que « repliable » devait servir. Gain : le premier bloc
  devient un bandeau mince au lieu d'un pavé qui rivalise avec la réponse.
- La synthèse n'a pas besoin d'être une carte verre pleine au même niveau que les cartes
  territoires : un bloc à filet gauche (ou fond plus discret) la ferait lire comme un appui, pas
  comme une réponse parallèle. Optionnel mais cohérent.

---

## Conformité aux patterns
- Cartes territoires = pattern « révélateur d'arbitrages » : **conforme** (zéro score).
- Hiérarchie des gloses (ChipTooltip N2, pas de N3 méthodo) : **conforme** (l.298-310).
- Paywall de conviction : le Pack est ici un pont, pas un mur — OK. Mais son **emphase visuelle
  excède sa place dans la hiérarchie de la décision** (cf. ci-dessus).
- Pattern manquant : **aucun marquage de point focal** pour « la réponse ». La grammaire de
  futur•e a un hero, des cartes, un paywall — mais pas (encore) de convention « voici LA charge
  utile dans une pile de blocs ». C'est la tension à nommer (voir inventaire).

## Honnêteté du signal
- Pas de fausse certitude, pas de score implicite, pas de chiffre nu non sourcé. RAS sur le fond.
- Seul accroc d'honnêteté **visuelle** : l'upsell crie plus fort que la réponse (déséquilibre
  d'emphase). À rééquilibrer.

## Incohérences visibles
- Aucune incohérence de couleur/radius/thème entre voisins (tous cohérents en verre sombre).
  Le problème n'est pas une discordance, c'est une **uniformité excessive**.

## Signalements éditoriaux (sans réécrire)
- `✓` (emerald), `⚠` (amber), `→`, `✎` servent d'icônes monochromes textuelles. Bord limite
  vis-à-vis du « zéro emoji ». Pratique ancienne et discrète ; je le pose en observation, pas en
  faute. (Le `✎ Écrivez ici` est hors périmètre — phase idle.)

---

## Sur l'idée « fond de couleur » (tranché)
**Non comme premier mouvement.** Signature n°3 : « l'émotion vient du récit, jamais des
couleurs ; la palette pose une atmosphère, elle ne dramatise pas la donnée. » Et signature n°2 :
peu d'éléments. Ajouter une bande teintée derrière les cartes, c'est **poser une surface de plus
sur une pile de surfaces** — on alourdit là où il faut soustraire. Un fond accent très faible
n'est acceptable qu'**après** l'allègement du haut, et seulement comme marqueur de zone focale
discret, pas comme effet. La hiérarchie se gagne d'abord par le contraste et le vide, pas par le
remplissage.

---

## Traitements recommandés (classés)

### Option A — RECOMMANDÉE : hiérarchiser par soustraction + séparation (90 % de la valeur)
1. `InterpretationPanel` replié par défaut (`useState(false)`, l.241). Le haut devient léger.
2. Marquer la section territoires comme point focal **sans nouvelle surface** : filet pleine
   largeur ou respiration franche au-dessus (mt-12/14), et un kicker mono accent au-dessus du h2
   pour signer « la réponse » (registre des autres eyebrows : `font-mono text-[10px]
   tracking-[0.14em] uppercase text-accent`). Le h2 Serif reste.
3. Rééquilibrer l'emphase : **retirer le halo/bordure accent pleine du Pack** (l.1256) pour qu'il
   ne dépasse plus les cartes ; les cartes (filet accent 2px) redeviennent le point le plus fort.
Compromis : aucune perte ; demande de toucher 3 endroits. C'est l'option fidèle à la doctrine.

### Option B — Renforcer l'élévation des cartes contre le verre neutre
Donner aux 3 cartes un poids visuel supérieur aux blocs voisins (bordure/verre légèrement plus
marqués, le filet accent conservé). Compromis : risque d'ornement si poussé ; à doser. Bon
complément d'A, médiocre seul (les blocs voisins restent lourds).

### Option C — Fond teinté de zone (l'idée du porteur)
Section enveloppant titre + grille avec `bg-accent/[0.04]` et padding généreux. Compromis :
n'est acceptable qu'**en plus** de l'allègement A ; seul, il ajoute du bruit. Rang le plus bas.

---

## Version minimale (le plus petit geste, ~90 %)
**Replier `InterpretationPanel` par défaut** (`useState(true)` → `false`, l.241) **+ un
séparateur/respiration nette avant la section territoires.** Le premier geste supprime la masse
qui rivalise en tête ; le second détache la réponse de la synthèse. Si un seul geste : le repli
par défaut, c'est lui qui débloque le plus de lisibilité. (Code : rôle de l'orchestrateur.)

---

## Cohérence / tensions
- Tension nommée (non tranchée) : **emphase du Pack vs emphase de la réponse**. Réduire le Pack
  est mon avis ; le porteur peut vouloir garder l'upsell saillant pour la conversion. C'est un
  arbitrage business/design, pas à moi de le trancher — je signale que la forme actuelle place
  le payant au-dessus de la réponse honnête.
- Tension : faut-il un fond de zone à terme ? Lié à la tension « largeur/registre » de la
  page-mère. À rouvrir après test.

## Mise à jour de l'inventaire (prêt à écrire par Claude principal)
Ajouter aux patterns d'écran un point « **Marquer le point focal dans une pile de blocs** » :
quand un écran empile plusieurs blocs `glass` de même registre (interprétation, synthèse,
réponse, upsell), la charge utile doit ressortir par **soustraction et contraste** (replier le
secondaire, séparer, kicker), pas par l'ajout d'une surface colorée. Et règle d'honnêteté
visuelle : **l'upsell ne doit jamais porter une emphase visuelle supérieure à la réponse.**

## Quand rouvrir ce sujet
- Test utilisateur : les gens repèrent-ils les cartes en < 3 s sans scroll-hunt ? (scroll-depth,
  time-to-first-card-hover, taux de clic « Explorer le rapport »).
- Si le repli par défaut fait que personne n'ouvre « Détail » alors que la compréhension fine est
  demandée → réenvisager l'état ouvert.
- Si A+B ne suffisent pas en test, alors seulement tester C (fond teinté) en A/B.
- Si la conversion Pack chute après rééquilibrage d'emphase → arbitrer avec Business Strategist.
