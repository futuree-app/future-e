# RAPPORT DE CRITIQUE — Résultat « wow » du comparateur, mode choix
**Agent : design-critic · 2026-06-26 · branche feat/comparateur-mode-choix**

Fichiers : `src/app/(public)/comparateur/page.tsx`, `ThemeMatrix.tsx`, `ModeChoixAsk.tsx`, moteur `src/lib/comparateur-vie.ts`.

## Ce qui fonctionne (à préserver)
- **Face-à-face honnête par construction** : chaque carte (`page.tsx:162-175`) porte `identite` (force) ET `compromis` (revers, filet `border-t`), tout déterministe. Suppression du « En résumé / rafle tout » tenue dans le code.
- **Le voile ne triche pas** : thèmes verrouillés (`page.tsx:197-210`) = vrai squelette (titre réel + labels de critères réels), jamais un verdict. Cadenas = SVG (`page.tsx:203-206`), pas l'emoji.
- **Grammaire des paliers conforme** : palier absolu d'abord, puis « Avantage X » / « À égalité » en kicker mono (`ThemeMatrix.tsx:113-121`). Fusion « se valent » (124-131) évite de fabriquer un écart.
- **Gloses au bon niveau** (`LabelTip` `ThemeMatrix.tsx:21-65`) : « pourquoi ça aide », sans source/méthode/seuil.
- **Voix juste** : « Là où ça se joue », « tranchez sans deviner… pas un score de plus » (`page.tsx:50-53`). Aucun tiret cadratin / exclamation / emoji.

## Ce qui peut disparaître
1. **Le hero vole la vedette à la fracture.** H1 « Vous hésitez… » en `clamp(28,4vw,44px)` (`page.tsx:43-44`) > fracture en `clamp(22,3vw,32px)` (`page.tsx:126`). Le lecteur a déjà répondu au hero (il a nommé ses communes). **Proposition** : condenser/retirer le hero en état « résultats » pour que « Là où ça se joue » devienne le premier grand bloc. **C'est le seul point vraiment structurant.**
2. **Le bloc de recherche `ModeChoixSearch` (`page.tsx:110`)** repoussé entre hero et fracture ajoute de la distance avant le payoff → replier/secondariser une fois des communes choisies.
3. **Redondance de la dimension de fracture** : deux mini-cartes leader/exposé (`page.tsx:145-154`) répètent le palier que `ThemeMatrix` (juste en dessous) contient déjà, car le thème dévoilé EST le thème de divergence. Candidates au retrait si ça se sent répétitif.

## Honnêteté du signal — deux tensions à trancher (l'agent ne tranche pas)
1. **Branche `domine` réintroduit une quasi-gagnante** : « X ressort sur presque tous les thèmes. Ce n'est pas vraiment un compromis. » (`page.tsx:129-130`, logique `dominator` ligne 1340). Factuellement honnête (domination thème-par-thème, pas score agrégé, contre-point nommé), mais c'est le registre « rafle tout » censé supprimé. Garde-fou : les cartes face-à-face gardent force+revers.
2. **Le rouge `text-danger` arrive dans le gratuit** (`ThemeMatrix.tsx:67-72`, `alerte` ligne 1241). Hérité du Pack, première apparition dans le flux gratuit. Signature n°3 / invariant n°6 : « pas de rouge alarmiste ».

## Incohérences / à vérifier au rendu
- Hiérarchie typo inversée hero(44) > fracture(32) : point le plus voyant.
- Contraste `text-ghost 11.5px` des critères verrouillés (`page.tsx:208`) + cadenas `text-ghost` : à valider à l'œil humain.
- Pas d'incohérence radius/orange/largeur. `max-w` (760/680/640) tous légitimes (sous-titres en espace ouvert / en-têtes), conforme règle de largeur.

## Verdict : **À AJUSTER**
Fond solide et honnête. Ce qui manque = la hiérarchie du haut de page (la fracture dominée par un hero devenu générique). Les deux tensions d'honnêteté à porter au porteur. Le reste = polissage.
