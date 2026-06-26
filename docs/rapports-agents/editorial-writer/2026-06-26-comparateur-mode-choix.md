# RAPPORT ÉDITORIAL — Résultat « wow » du comparateur (mode choix)
**Agent : editorial-writer · 2026-06-26 · branche feat/comparateur-mode-choix**

Bilan : **la copie est très majoritairement dans la voix.** Trois points seulement à arbitrer : un crochet de peur dans le CTA, deux eyebrows qui décrivent l'architecture, la répétition de « départage ». Aucun tiret cadratin trouvé.

## 1. Hero (`page.tsx:47-53`) — **DANS LA VOIX**
« Vous hésitez entre plusieurs communes ? Comparez-les, tranchez sans deviner. » + « pas un score de plus ». S'ouvre sur la situation du lecteur. Ne pas toucher.

## 2. Fracture (`page.tsx:122-156`) — **DANS LA VOIX, avec garde-fou lexical**
Variante écart : nomme le compromis, cœur honnête. Variante `domine` (`129-134`) : seul endroit qui frôle le couronnement. Sauvé par (a) « ressort » descriptif pas prescriptif, (b) « Ce n'est pas vraiment un compromis » travaille *contre* la vente. **Garde-fou : ne jamais laisser dériver « ressort » vers un verbe de victoire.** Vigilance : « contre-point » un peu précieux → possible « Le seul vrai bémol ».

## 3. Face-à-face (`page.tsx:170-173`) — **DANS LA VOIX** (gabarit)
Identité avant revers, revers assumé par commune. Repli à surveiller `comparateur-vie.ts:1561` « Le bon compromis des trois, sans faiblesse marquée » frôle l'optimisme par défaut (rare, acceptable).

## 4. « Le détail, sur un thème » (`page.tsx:180`) — **À RETOUCHER (léger)**
Eyebrow parle du **format**, pas du lieu du lecteur (réflexe ciblé par `editoriale.md:49-55`). Options : « Regardons de près » / « Critère par critère » / « Là, dans le détail ».

## 5. « Les 6 autres thèmes » (`page.tsx:193-195`) — **DANS LA VOIX (limite basse)**
Énumération de structure mais compte honnête et utile (dit la profondeur derrière le cadenas). Pas de suppression. Si on veut tirer vers le lecteur : « Ce qui se joue aussi » / « Le reste de l'écart ».

## 6. CTA Pack (`page.tsx:232-239`) — ⚠️ **À RETOUCHER (le point dur)**
« c'est peu, **contre une commune mal choisie.** » = crochet de **regret/peur** (loss aversion), heurte l'invariant n°6 (« intelligence, pas peur »). La 1re phrase (« Vous voyez où chacune penche ») est bonne. Réécritures de la 2e :
- A : « …c'est peu pour la trancher les yeux ouverts. »
- B : « …autant la prendre sur des faits, pas sur une intuition. »
- C : « …Au regard des années qu'une telle décision engage. »

## 7. AskFuture (`ModeChoixAsk.tsx`) — **DANS LA VOIX**
Eyebrow/titre/sous-titre (`131-138`) et limite gratuite (`186-189` « d'une intuition à une décision éclairée ») justes. Suggestions (`51-54`) dans la voix. Point mineur `179` : « futur•e réfléchit… » anthropomorphise (non bloquant) → « futur•e cherche… ».

## 8. ThemeMatrix (`119, 130`) — **DANS LA VOIX**
« Avantage X » factuel/relatif, « se valent » honnête.

## Rythme
- **« départage/départager » 4× sur l'écran** (hero 52, CTA 234, Ask 138, meta) : leitmotif assumé mais commence à s'user. Varier le CTA (« ce qui les sépare ») suffit.
- Flux juste, AskFuture bien placé au pic de curiosité. Aucune suppression recommandée.

## Doctrine à ajouter (si §6 validé) — `editoriale.md` « Formules interdites »
> Bannir la vente par le regret : « contre une commune mal choisie », « avant de le regretter », « ne vous trompez pas ». Le Pack se justifie par la valeur de décider sur des faits, jamais par la peur d'un mauvais résultat (invariant n°6).

## Limites du regard
Pas de rendu visuel (insécables manquantes sur phrases dynamiques = sujet Design). Prose générée par le moteur (`identite`, `compromis`, `synthese`) non évaluée sur cas réels : gabarits jugés, pas chaque sortie données-dépendante.
