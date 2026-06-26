# RAPPORT PRODUIT — Résultat gratuit du mode choix (départage)
**Agent : product-strategist · 2026-06-26 · branche feat/comparateur-mode-choix**

Fichiers : `page.tsx`, `ThemeMatrix.tsx`, `ModeChoixAsk.tsx`.

## Le vrai besoin
Qui hésite entre 2 communes ne cherche pas « laquelle est la meilleure » (un score, dont il se méfie) mais **où le choix se joue et ce qu'il troque**. La fracture répond « sur quoi trancher ? », le face-à-face « qu'est-ce que je gagne/perds ? ». **Juste.**

## Valeur — où elle est réelle, où elle s'effiloche
- **Cœur (blocs 1-2) = valeur décisionnelle dense.** « Là où ça se joue » empêche de comparer sur du bruit. Cas `domine` courageux : on résout parfois la décision gratuitement plutôt que faux suspense.
- **Thème dévoilé non arbitraire** : le code révèle le thème de la **divergence** (`comparaison.divergence.themeId`). Force, pas hasard. Bonne décision.
- **Angle mort du 1-dévoilé** : c'est le thème que *nous* jugeons divergent, pas celui que *le lecteur* priorise. S'il hésite sur les écoles et qu'elles sont « à égalité », il ne le voit qu'au Pack ou en brûlant une question. AskFuture est une **béquille**, pas une réponse.

## Coût de complexité
Cinq sections verticales qui parlent toutes de « où elles diffèrent » à résolution croissante : risque de **même idée 3 fois** (la sensation de redite relève du Design Critic).

**Bloc qui gagne le moins sa place : les 6 verrouillés.** Montrer ce qu'on n'a pas = geste de funnel, pas de valeur. Seule légitimité = **signal de complétude** (« rien n'est oublié »), qui EST le besoin de l'archétype. Mais 6 cartes-cadenas = complétude payée trop cher (charge cognitive + théâtre de paywall). **Version 10× plus simple** : une ligne « Restent 6 thèmes — risques, mobilité, services… — départagés dans le Pack ». Même signal, sans la vitrine. C'est aussi le seul bloc **copiable** par n'importe quel SaaS → pas un actif de moat.

## Moat
Le refus de couronner + le « ce n'est pas vraiment un compromis » + le cadrage fracture-d'abord exigent moteur conforme **+** discipline éditoriale → durs à copier. Seule la grille verrouillée est générique.

## AskFuture — suggestions
- 2 chips excellents (« vieillira le mieux face au climat de 2050 », couple érosion/canicule).
- **Le 1er chip pose problème** : « Qu'est-ce qui sépare vraiment X et Y ? » = exactement ce que la fracture vient de répondre. Avec **2 questions gratuites seulement**, faire brûler la moitié du crédit sur un reformulé. Le remplacer par une question hors-page (module non dévoilé, ou « Pour un achat sur 20 ans, laquelle est le pari le plus sûr ? »).

## Hypothèse porteuse à tester
**Le lecteur qui hésite veut-il savoir _où_ trancher, ou qu'on lui désigne _qui gagne_ ?** Si la 2e, le face-à-face le laisse en plan. C'est ELLE qu'il faut tester (sonde post-résultat + PostHog passage Pack vs abandon).

## Verdict : **CONSTRUIRE le cœur, REFORMULER deux sous-éléments**
1. Grille des 6 verrouillés → une ligne de complétude.
2. 1er chip AskFuture → une question hors-page.
Laisser vivre le cas `domine` mais l'instrumenter avant de le défendre.

## Tensions avec le Business Strategist (non tranchées)
- Cas `domine` : produit applaudit (honnêteté) / business voit la punchline donnée gratis.
- 6 verrouillés : business les veut (faim) / produit ne les garde qu'allégés.
- 2 questions Ask : produit les veut max utiles / business = rampe vers paywall.
