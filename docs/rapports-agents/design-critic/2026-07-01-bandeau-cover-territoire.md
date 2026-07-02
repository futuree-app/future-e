# Critique — Bandeau de couverture Territoire (`TerritoryCover`)

Date : 2026-07-01 · Agent : Design Critic · Exemple : La Rochelle (17300)

## Écran
- **Composant** : `src/components/report/TerritoryCover.tsx`
- **Placement** : `src/app/(account)/rapport/quartier/page.tsx:152`, entre le titre du
  rapport et le passeport (`TerritoryIdentityCard`), avant la synthèse IA.
- **Rôle revendiqué** (commentaire du fichier) : « pose l'identité du territoire sans
  concurrencer la synthèse ». Bande ultra-wide 5:1, image résolue par chaîne de repli
  bespoke → archétype → générique → placeholder `skyHorizon`.
- **Décision éclairée** : aucune, par construction. C'est un ancrage d'ambiance, pas un
  élément décisionnel. Ce n'est pas disqualifiant en soi (la page-mère autorise un hero
  identitaire), mais ça relève la barre : un élément qui n'aide pas à décider doit au moins
  être cohérent, honnête, et gracieux en son absence. Aujourd'hui il échoue sur les trois.

## Ce qui fonctionne
- L'intention est saine : pas de texte gravé dans l'image (cartouche HTML dynamique prévu),
  fondu vers le canvas sombre + bordure pour s'enchâsser dans le thème. La plomberie
  d'intégration est propre.
- La cover La Rochelle est **bien exécutée** : style plat vectoriel, palette crème/bleu
  doux, cohérente avec la DA sombre par contraste maîtrisé. Prise isolément, elle est belle.
- Le placement (avant la synthèse, sous le titre) est juste : elle ne vole pas la vedette au
  texte qui porte le sens (signature n°1/n°6).

## Ce qui peut disparaître
Mon premier réflexe : **pour ~34 900 communes sur 35 000, ce bandeau doit purement et
simplement ne pas s'afficher.** Aujourd'hui il s'affiche quand même, en aplat de couleur uni
(voir Honnêteté). Le retrait conditionnel est la correction à ~90 % de la valeur (cf. version
minimale). Ce n'est pas l'illustration qui est de trop ; c'est son **fantôme coloré** qui est
du bruit pur, un rectangle décoratif qui ne gagne pas sa place et signale « image manquante ».

## Conformité aux patterns
- **Signature n°7 (l'élément distinctif raconte le lieu)** : partiellement. Une illustration
  du Vieux-Port raconte La Rochelle. Mais pour les 4 archétypes (`littoral_atlantique`,
  `mediterranee`, `montagne`, `plaine`), une même image s'afficherait à l'identique sur des
  milliers de communes — exactement la « signature qui pourrait s'afficher sur dix communes »
  que la doctrine refuse. Le repli archétype, s'il existait, serait déjà en tension avec n°7.
- **Signature n°2 (peu d'éléments, chacun un rôle)** : l'aplat de repli n'a aucun rôle.
- **Signature n°3 (l'émotion vient du récit, pas des couleurs / pas d'image qui flatte)** :
  voir Honnêteté.

## Honnêteté du signal
Deux problèmes, l'un de fond, l'autre grave.

1. **Le repli est cassé (dette dure).** `public/covers/archetypes/` est **vide** (vérifié :
   `total 0`). Aucun `littoral_atlantique.webp`, aucun `all.webp`. La chaîne de repli
   n'atteint jamais un fichier : bespoke absent → archétype 404 → all.webp 404 → `failed=true`
   → `<img>` retiré → le `<div>` reste avec `background: mood.colors.skyHorizon`. Résultat pour
   toute commune non couverte : **une bande 5:1 d'aplat de couleur uni**, avec bordure et
   dégradé bas. Ce n'est pas un vide gracieux : c'est un rectangle coloré en pleine zone noble,
   juste sous le titre, qui lit comme « l'image n'a pas chargé ». Promesse cassée. En prime,
   deux requêtes réseau 404 sont émises à chaque rendu avant abandon.

2. **La cover idéalise, là où le produit vend la lucidité.** La Rochelle est un port
   **exposé à la submersion** (cœur du module Territoire). L'illustration montre un port serein,
   eau calme, ciel clair, drapeau au vent : une carte postale. Poser une image de rêve en tête
   d'un rapport qui doit dire un risque climatique, c'est vendre la carte postale là où futur•e
   vend le constat. Tension directe avec la signature n°3 (l'émotion vient du récit, pas de
   l'ornement flatteur) et avec la voix « intelligence, pas peur… mais pas déni non plus ».

## Incohérences visibles (série bespoke)
J'ai lu 4 covers. Elles **ne forment pas une série**. Deux familles visuelles au moins :
- **La Rochelle (17300)** : illustration **plate/vectorielle**, aplats mats, peu de tons,
  crème + bleu doux, registre moderne/minimal.
- **Brest (29019), Nice (06088), Marseille (13055)** : **gravure/aquarelle texturée** façon
  affiche ancienne, grain de papier, détail dense. Et même entre elles, les palettes divergent :
  Brest vire au **sépia doré** (heure dorée), Marseille à un **ciel bleu froid** réaliste.

Mises côte à côte (un lecteur qui compare deux communes, ou qui voit plusieurs rapports), ces
covers **jurent** : niveau d'abstraction, texture et température de couleur incohérents. C'est
une incohérence qu'on voit à l'œil, dans mon mandat. Avant d'étendre le set bespoke, il faut
verrouiller **un** style et **une** logique de palette, sinon chaque ajout aggrave la dérive.

## La question de fond : 71 / 35 000
Position tranchée : **c'est un problème de fond, pas un détail.** L'argument « les 71 sont les
grandes villes = l'essentiel du trafic » est à moitié vrai (le set couvre Paris, Lyon,
Marseille, arrondissements, petite couronne, DOM). Mais la thèse stratégique de futur•e est la
**longue traîne** : entrée par sa propre commune, adresse tapée, ~35k pages programmatiques,
découvrabilité. Le cas différenciant, ce n'est pas « je regarde Paris », c'est « je tape
l'adresse de ma commune moyenne ». Pour ce lecteur-là — le cœur de cible — le rapport s'ouvre
aujourd'hui sur un aplat de couleur. La cover casse la promesse précisément là où le produit
doit être irréprochable.

Donc : ni « générer 35 000 illustrations » (coût absurde, et n°7 interdit l'archétype générique
réutilisé), ni « garder le repli aplat ». La sortie honnête est le **retrait gracieux** : le
bandeau n'existe que là où une cover bespoke existe vraiment. Le premium visuel des 71 grandes
villes reste un bonus assumé ; les autres n'ont pas un défaut à la place, elles ont un rapport
qui démarre directement sur le passeport (qui, lui, raconte le lieu par la donnée).

## Verdict : À REVOIR
Non pas parce que l'illustration est mauvaise (elle est bonne), mais parce qu'à l'échelle réelle
du produit elle produit surtout un aplat cassé (99,8 % des communes), une série incohérente, et
une carte postale en tension avec la voix. L'ornement séduisant mais creux est ici littéral.

## Version minimale (~90 % de la valeur)
**Ne rendre `<TerritoryCover>` que si une cover bespoke existe pour l'INSEE.** Concrètement :
garder une liste/set des 71 INSEE couverts (ou un manifeste), et conditionner l'affichage
du bloc `{communeName && hasBespoke && <TerritoryCover/>}`. Supprimer le repli archétype/aplat
(code mort qui produit le rectangle coloré et deux 404). Coût quasi nul, supprime la promesse
cassée immédiatement. Le reste (harmoniser la série, trancher la carte-postale-vs-lucidité)
peut suivre, à froid.

## Cohérence / tensions posées (non tranchées par moi)
- **Ancrage identitaire vs sobriété « rien sans rôle ».** Un hero illustré est-il légitime dans
  un produit sobre ? Défendable SI série cohérente + honnête + absence gracieuse. À trancher par
  le porteur : assume-t-on la cover comme un privilège des grandes villes, ou renonce-t-on ?
- **Carte postale vs constat climatique.** Une illustration sereine en tête d'un rapport de
  risque : ancrage bienvenu ou déni visuel ? Choix éditorial/DA à poser, pas à moi de trancher.

## Mise à jour de l'inventaire (prêt à écrire)
Tension nouvelle pour `inventaire-design.md` : « **Cover Territoire — l'illustration
identitaire à l'épreuve de l'échelle.** Un ancrage visuel bespoke n'est légitime que s'il est
(1) cohérent en série (un seul style, une logique de palette), (2) honnête (pas de carte postale
qui contredit le constat climatique), (3) gracieux en son absence (pas d'aplat de repli qui lit
comme image manquante). État 2026-07-01 : 71/35000 couvertes, archétypes vides, série
incohérente → À REVOIR, retrait conditionnel recommandé. »

## Quand rouvrir ce sujet
- Un **set d'illustrations cohérent** (un style unique, palettes accordées) couvrant la longue
  traîne est produit → réévaluer l'affichage généralisé.
- Les **analytics** montrent que le trafic Territoire se concentre sur les 71 communes couvertes
  → la cover-privilège-grandes-villes devient défendable telle quelle.
- Un test d'usage montre que la cover **augmente la compréhension ou l'engagement** (vs son
  absence) → l'ornement gagne un rôle, la critique s'assouplit.
- Les archétypes sont produits ET jugés distinctifs (n°7) → rouvrir le repli.
