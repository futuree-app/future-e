# Comparateur mode choix — Synthèse + explorateur de thèmes (résultat v3)

**Date :** 2026-06-26
**Branche :** feat/comparateur-mode-choix
**Statut :** design validé (brainstorm porteur), à transformer en plan d'implémentation.

Évolution du résultat « wow » (v2 : fracture à deux pôles + face-à-face + 1 thème dévoilé +
6 verrouillés). La v2 reste en place sauf les points ci-dessous. Cette spec corrige trois
défauts relevés par le porteur à l'écran et ajoute la synthèse générée.

---

## 1. Problèmes constatés (point de départ)

1. **Accueil vide / copie d'initié.** Avant de nommer des communes, la page est creuse et le
   hero dit « pas un score de plus » : positionnement d'initié que le visiteur ne peut pas
   décoder (il n'a jamais vu le « score » qu'on rejette). La page ne montre pas *ce qu'elle
   compare*.
2. **« Il manque une commune ».** La ligne de fracture ne stocke que `leaderInsee` (meilleur
   palier) et `exposeInsee` (pire). Avec 3 communes, la commune du milieu disparaît → effet
   d'oubli. (`comparateur-vie.ts` ~1247-1356.)
3. **Thème de fracture trop spécifique (« feu »).** L'algo choisit le thème au plus grand
   `spread` de palier, et privilégie même les risques en cas d'égalité. Le risque feu gagne
   donc *mécaniquement* alors que personne n'arbitre un lieu de vie là-dessus. L'algo optimise
   l'écart statistique, pas la pertinence décisionnelle.

---

## 2. Décisions de conception (validées)

### 2.1 Accueil (avant communes)
- **Réécrire le hero** : retirer « pas un score de plus ». Dire ce qu'on compare et la valeur.
  Direction (copie finale à valider par l'agent éditorial) : nommer les grands domaines
  (climat, risques, cadre de vie, mobilité, services, vitalité) et la promesse (montrer ce que
  chaque commune fait gagner ou perdre).
- **Afficher les 7 thèmes** sous le champ de saisie (ce que l'outil regarde) : remplit la page,
  explique l'outil. Présentation simple, non interactive à ce stade (pas de sélection avant
  génération — cf. 2.4, la sélection vit dans les résultats).

### 2.2 Résultats — ordre (de haut en bas)
1. **Synthèse streamée** (effet wow). Route dédiée, modèle léger. Nomme l'arbitrage central,
   **jamais une gagnante**. Voir 2.3.
2. **3 cartes villes** (identité + compromis). Inchangé par rapport à la v2.
3. **« Là où ça se joue » = l'explorateur de thèmes.** Remplace la phrase à deux pôles de la
   v2 (qui causait le bug « commune manquante »). Voir 2.4.
4. **AskFuture** (2 questions, inchangé) → **CTA Pack** (inchangé, cf. §4 parking).

La phrase de fracture à deux pôles (`div.domine` / leader-exposé) est **supprimée de l'UI**.
Le calcul de divergence reste utile mais seulement pour **choisir le thème par défaut** de
l'explorateur (cf. 2.5).

### 2.3 Synthèse (nouvelle route dédiée)
- **Pourquoi une route dédiée** : la route existante `api/comparateur-vie/synthesize` est
  bâtie pour /ou-vivre (projet + préférences + raisons/compromis du match). Le mode choix n'a
  pas de projet : l'entrée, ce sont 2-3 communes nommées avec leur `identite`, `compromis`,
  `distinctive`, et les `themes` déterministes. Prompt fondamentalement différent → nouvelle
  route (ex. `api/comparateur-vie/synthesize-choix`).
- **Plomberie réutilisée telle quelle** : `streamText` (AI SDK), probe du 1er chunk → 502 si
  l'IA est down, `ReadableStream` encodé, header `no-store`. Copier le squelette de la route
  existante.
- **Modèle** : léger (parcours gratuit). Politique mémoire « gratuit/court » : Sonnet/Haiku,
  effort `low`, thinking `disabled`. (À caler ; viser latence < ~4s.)
- **Garde-fous d'honnêteté (système)** — repris de l'esprit de la route existante mais
  recentrés départage :
  - Le moteur a déjà tout décidé ; la synthèse INTERPRÈTE, ne classe pas, n'ajoute aucune
    commune.
  - **Jamais de gagnante / « la meilleure » / « top » / classement** (invariant n°2). Nommer
    l'arbitrage et les compromis, pas un vainqueur. Le cas `domine` (une commune ressort
    presque partout) peut être DÉCRIT (« ressort sur presque tous les plans, peu d'arbitrage
    réel ») mais jamais prescrit.
  - Qualitatif uniquement : aucun chiffre, pourcentage, horizon daté.
  - Ne commenter que ce qui est mesuré (les thèmes/critères du moteur) ; ne pas inventer un
    verdict sur une dimension absente.
  - Vouvoiement. **Aucun tiret cadratin** (virgule / deux points). Aucun point d'exclamation.
  - Court : ~110-170 mots, 1-2 paragraphes. Crée une question, n'épuise pas le sujet.
- **Fallback client** : si la route répond 502, afficher un repli déterministe sobre (assemblé
  depuis les `identite`/`compromis` du moteur), comme le fait /ou-vivre.

#### 2.3.bis — Garde-fous validés (stress-test éditorial, 2026-06-26)

Réf. complète : `docs/rapports-agents/editorial-writer/2026-06-26-comparateur-synthese-choix.md`.
Verdict de l'agent : **réécrire le SYSTEM de zéro** (le prompt /ou-vivre est inadaptable, sa
colonne vertébrale « projet » est absente). Décisions porteur tranchées :

- **Payload sobre, validé.** Par commune : `{ nom, region, identite, compromis, distinctive }`.
  Plus `divergence` réduit à `{ domine, dominatorInsee }`. **On NE passe PAS** les
  `themes.synthese` au LLM (sinon récitation des thèmes → redite avec l'explorateur). Aucun
  chiffre.
- **Nuances gatées coupées par défaut** (inondation, calme sonore, industrie, démographie,
  littoral) : en mode choix le lecteur n'a rien demandé, on n'introduit pas d'alarme non
  sollicitée. Elles ne passent que si déjà portées par le `distinctive` (relatif et sobre).
- **Ne JAMAIS prêter de projet au lecteur.** Interdit : « vous cherchez… », « votre priorité
  semble… ». Il n'a donné que des noms. La synthèse décrit les OPTIONS et l'arbitrage entre
  elles, jamais les motivations du lecteur. (Le miroir, ici, c'est l'hésitation reconnue.)
- **Registre de couronnement interdit** (en plus des interdits /ou-vivre) : « la plus
  équilibrée », « le meilleur compromis », « coche le plus de cases », « ressort en tête », « le
  juste milieu idéal », « globalement », « en résumé », classement par énumération, et toute
  prescription (« vous ne vous tromperez pas avec… », « autant partir sur… »).
- **Cas `domine`, ligne exacte.** Autorisé : décrire qu'une commune ressort sur la plupart des
  plans + pointer la seule dimension où une AUTRE mène + reformuler en question, en rendant la
  main. Interdit (première phrase de trop) : « peu à hésiter », « le choix le plus sûr »,
  « s'impose naturellement », tout superlatif absolu. Test : si la phrase peut être remplacée
  par « donc prenez celle-là », elle est de trop.
- **Cas communes très proches** : le dire simplement, situer l'arbitrage sur les nuances, ne
  jamais fabriquer une divergence pour le spectacle.
- **Structure (110-170 mots)** : (1) ces communes ne proposent pas la même vie, caractériser ;
  (2) le compromis honnête de chacune ; (3) reformuler en arbitrage, pas en classement ;
  (4) renvoi aux thèmes sans inventaire ; (5) décision rendue au lecteur. Varier la
  construction à la 3e commune (éviter le tempo mécanique « identité, mais compromis » ×3).
- **Avant de figer le prompt** : re-juger 10-15 générations réelles du modèle léger (les
  dérapages réels de Sonnet/Haiku effort low peuvent différer des exemples imaginés).

### 2.4 Explorateur de thèmes — règle de déverrouillage (le cœur)
- Sous « Là où ça se joue » : les **7 thèmes** présentés. **Un seul thème ouvert à la fois**
  (matrice complète `ThemeMatrix`, montrant **les 2-3 communes** → règle le bug « commune
  manquante »).
- **Défaut** : le thème de plus forte divergence **repondérée** (cf. 2.5), déjà **ouvert** à
  l'arrivée (substance immédiate, sans clic). Le défaut ne « consomme » pas le choix.
- **Une seule redirection, puis verrouillage.** Le lecteur peut cliquer UN autre thème
  (« 🔒 dévoiler celui-ci ») : il devient l'unique thème ouvert, le défaut se referme. Ce clic
  délibéré est **son choix**, et il **verrouille le sélecteur** : les thèmes restants deviennent
  non-cliquables (→ Pack). Donc au plus **2 thèmes** voient leur contenu sur une page (le
  suggéré + le sien). Mental model porteur : « le thème suggéré + le vôtre ».
  - Pas de swap illimité : autoriser le lecteur à déplacer sa sélection en boucle reviendrait à
    lui donner les 7 thèmes un par un (fuite du Pack). Le verrouillage après une redirection
    l'empêche.
  - Misclic : récupérable par rechargement (reset doux, cf. ci-dessous). Pas de confirmation
    bloquante à l'écran (le reset doux suffit).
- **Paywall préservé** : on ne dévoile jamais plus d'un thème complet à la fois (2 distincts au
  total). Les autres restent en **vitrine verrouillée** (titres + libellés de critères visibles,
  verdict caché), comme la v2. La vitrine EST le sélecteur (cliquer une carte verrouillée
  l'ouvre, dans la limite de l'unique redirection).
- **Pas de persistance dure.** Un thème par **chargement de page**. Recharger les mêmes
  communes = nouveau choix (rattrape un misclic). Changer de commune = nouvelle comparaison =
  nouveau choix (déjà une nouvelle page, rien de spécial à coder).
- **Persistance cross-session = OPTION DIFFÉRÉE, sur preuve.** Verrouiller à travers les
  rechargements exigerait un stockage par jeu-de-communes, fragile et trivialement contourné
  (navigation privée, cache vidé). Gain marginal. On l'ajoutera seulement si PostHog montre un
  grappillage réel par rechargements répétés.
- Tout est **déterministe** côté thèmes : changer de thème ouvert ne déclenche **aucune**
  régénération LLM. Seule la synthèse (2.3) coûte, et une seule fois par comparaison.

### 2.5 Défaut de l'explorateur — divergence repondérée
- Garder le calcul de `spread` mais **repondérer pour la pertinence décisionnelle** : éviter
  qu'un risque de niche à fort écart (ex. feu) l'emporte sur un thème largement décisif
  (climat, mobilité, cadre, services, vitalité).
- Approche simple : pénaliser/dé-prioriser les dimensions risque très spécifiques dans le tri
  du défaut, ou pondérer par un poids de pertinence par thème. **À détailler dans le plan**
  (rester minimal : un poids par thème, pas un modèle). Le tri actuel privilégie `risque` en
  cas d'égalité ; cette priorité est retirée ou inversée pour le défaut.
- Comme le lecteur peut de toute façon rediriger en un clic, le défaut n'a pas besoin d'être
  parfait, juste **rarement absurde**.

---

## 3. Composants / fichiers concernés (indicatif, à préciser au plan)

- `src/app/(public)/comparateur/page.tsx` — accueil (hero + 7 thèmes), ordre des résultats,
  suppression de la phrase de fracture, montage synthèse + explorateur.
- `src/app/(public)/comparateur/ModeChoixSearch.tsx` — inchangé (déjà corrigé : z-index,
  sélection ✓). Éventuel rappel des 7 thèmes côté accueil (ou nouveau petit composant).
- **Nouveau** `ThemeExplorer` (client) — état « thème ouvert », rendu de la vitrine cliquable +
  `ThemeMatrix` du thème ouvert. Encapsule la règle 2.4.
- **Nouveau** `ModeChoixSynthese` (client) — fetch streamé de la route dédiée + fallback.
- **Nouveau** `src/app/api/comparateur-vie/synthesize-choix/route.ts` — synthèse départage.
- `src/lib/comparateur-vie.ts` — repondération du défaut de divergence (2.5) ; le type
  `Divergence` peut être simplifié (on n'a plus besoin de leader/exposé pour l'UI, seulement le
  `themeId` par défaut). Vérifier les autres consommateurs avant de retirer des champs.
- (Composant des 7 thèmes d'accueil : réutiliser `THEME_ORDER`.)

---

## 4. Hors périmètre / parqué (NE PAS coder dans ce chantier)

- **Cadrage de la valeur du Pack.** Décalage connu : le CTA fait croire qu'on paie 39€ pour
  « le reste du tableau », alors que le Pack vaut surtout par les **rapports complets par module
  et par commune** (la matrice est la partie la plus fine de sa valeur). Notre gratuit plus
  riche aggrave le décalage. **On ne touche pas au CTA ici** pour ne pas graver la mauvaise
  promesse. → chantier Business/Produit séparé (le prix capte-t-il la valeur, rendre le moat
  visible).
- **Rapport-de-preuve sur une commune.** Aperçu d'un dossier profond pour matérialiser la
  valeur du Pack. À faire plus tard (signalé par le porteur).
- **Suppression du module Métier (6 → 5 modules).** Décision produit ouverte, hors de cette
  spec.

---

## 5. Ce que ça règle

| Défaut | Résolution |
|---|---|
| Accueil vide / copie d'initié | Hero réécrit + 7 thèmes affichés (2.1) |
| « Il manque une commune » | Matrice du thème ouvert montre toujours les 2-3 communes (2.4) ; phrase à deux pôles supprimée |
| « Feu trop spécifique » | Défaut repondéré (2.5) + le lecteur redirige en un clic (2.4) |
| Pas d'effet wow | Synthèse streamée en tête (2.3) |
| Vitrine / paywall | Préservés : un seul thème ouvert, le reste verrouillé (2.4) |
| Coût LLM | 1 appel léger par comparaison ; clics de thème gratuits (2.4) |

---

## 6. Risques / points de vigilance

- **Honnêteté de la synthèse** : c'est le point chaud. Une synthèse générée peut déraper vers
  le couronnement. À stress-tester par l'agent éditorial (et produit) avant de coder le prompt.
- **Redite synthèse / explorateur** : la synthèse ne doit pas être un inventaire des thèmes
  (ça, c'est l'explorateur). Elle reste au niveau de l'arbitrage d'ensemble.
- **Latence** : viser < ~4s pour la synthèse ; le reste de la page (déterministe) doit
  s'afficher immédiatement, la synthèse se remplit ensuite (ne pas bloquer le rendu).
- **Simplification du type `Divergence`** : retirer des champs peut casser d'autres
  consommateurs (Pack, /ou-vivre). Vérifier avant de toucher.
