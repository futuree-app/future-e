# Cadrage — Bande-trajectoire (remplacement de la cover Territoire)

Date : 2026-07-02. Statut : **CHOISI par le porteur = la ligne des années** (la mémoire du lieu),
avec deux enrichissements validés : apparition animée chronologique des années (un passage,
gauche→droite, puis figé ; `prefers-reduced-motion` → état final direct) et **code couleur par
famille de catastrophe** (palette sobre, jamais de rouge : inondation/submersion = bleu #60a5fa,
sécheresse = ocre #d9a441, tempête = violet #a78bfa, mouvement de terrain/autres = gris #9ba3b4).
Maquette de référence : `scratchpad/bande-trajectoire-v4.html` (session 2e0188a2). Le ciseau
gel×chaleur reste au banc (pipeline ERA5 à construire, réévaluable plus tard).

## Le problème

La cover illustrée du rapport Territoire (`TerritoryCover`) est condamnée par deux constats
(audit Design Critic, `docs/rapports-agents/design-critic/2026-07-01-bandeau-cover-territoire.md`) :
71 covers bespoke sur ~35 000 communes avec un repli archétype cassé (dossier vide, aplat de
couleur en zone noble), et une carte postale sereine en tête d'un rapport de lucidité climatique.

## Le chemin parcouru

1. Researcher « ancrage identité commune » (2026-07-01) : 20 pistes, verdict carte-à-point =
   inerte-localisateur, pistes fortes = mouvement / voix / objet-document.
2. Maquettes v1/v2 porteur+Claude : bande-trajectoire croisant deux données, 4 traitements.
3. Trois Researchers en parallèle (2026-07-02) : données à croiser / forme et geste / sens et
   signature (`docs/rapports-agents/researcher/2026-07-02-bande-*.md`).
4. Challenge Fable (directeur de création) : verdict ci-dessous.

## Le verdict du challenge (retenu par le porteur : « fais comme tu le sens »)

- **Piège central nommé : le test d'inertie à l'échelle.** La France entière se réchauffe ; un
  dégradé frais→chaud est quasi identique pour 35 000 communes. Toute variante qui habille ce
  gradient universel en signal local déguise une donnée inerte en information (interdit doctrine).
  Le « nom qui chauffe » (magnifique) échoue là-dessus : typographie superbe, contenu informationnel
  proche de zéro.
- **Seule variante courbe qui survit : le ciseau gel×chaleur** (même unité jours/an, même source
  observée, figures authentiquement différentes par commune : montagne vs méditerranée vs plaine).
- **Améliorations actées sur le ciseau** : nom DANS la bande (un seul objet), pas de dégradé dans
  les lettres, pas de filet démographique (la pop vit au passeport), pas de pointillé futur → la
  bande **se dissout à droite dans le fond** (le futur est l'affaire du rapport, pas d'une courbe ;
  règle l'interdit DRIAS par le design), phrase-légende gabarisée (4-5 gabarits selon la figure :
  croisé depuis longtemps / croisement en cours / jamais de gel / régime qui tient).
- **Mode de rupture n°1 : le bruit interannuel.** Lissage moyennes 5 ans, règle divulguée en
  méthodologie, et QA sur ~30 communes stratifiées AVANT généralisation. Si les figures ne se
  distinguent pas à l'œil sur l'échantillon, la bande meurt.
- **Alternative hors-cadre sortie du challenge : la ligne des années.** La mémoire du lieu en pur
  typographique : toutes les années depuis 1982 en fantôme, les années d'arrêté CatNat / étés
  records en orange. Faits datés, zéro projection, zéro adjectif, jamais vide, authentiquement
  locale (deux communes n'ont jamais la même ligne). Une commune épargnée = ligne presque grise =
  information enviable.

## La réalité des données (vérifiée dans le code, 2026-07-02)

- **Ciseau gel×chaleur : la donnée N'EXISTE PAS aujourd'hui.** `commune_era5_trend` (Supabase) ne
  stocke qu'un delta de température moyenne (baseline 1961-1990 vs 10 dernières années,
  `src/lib/era5-trend.ts`). Pas de séries annuelles, pas de comptes de jours par seuil. Chantier
  pipeline : étendre `scripts/populate-era5-trend.py` (comptes jours gel <0°C et chaleur >30°C par
  an, moyennes 5 ans, 35k communes).
- **Ligne des années : la donnée EXISTE DÉJÀ.** Les arrêtés CatNat portent leur année
  (`src/lib/georisques.ts`, `byDecade` est déjà dérivé des années individuelles). Exposer la liste
  des années = trivial. Années d'étés records : à définir (ERA5 ou liste nationale fixe).

## Les deux finalistes (maquette v3)

Maquette comparative : `scratchpad/bande-trajectoire-v3.html` (session 2e0188a2), 2 concepts × 4
communes contrastées (Briançon montagne / La Rochelle littoral / Marseille méditerranée / Guéret
plaine stable), données plausibles-réalistes (années La Rochelle réelles : Martin 1999, Xynthia 2010).

1. **Le ciseau dépouillé** — plus riche en signal climatique, demande un pipeline data nouveau.
2. **La ligne des années** — mémoire vécue, viscérale, honnête à l'os, faisable immédiatement.
   Risque : litanie de catastrophes (tenir par la sobriété : des dates, aucun adjectif, et les
   années calmes présentes en fantôme).

Recommandation Fable : prototyper les deux sur ~30 communes réelles et laisser les vraies données
départager, pas le goût.

## Décisions déjà prises en chemin (indépendantes du choix final)

- Animation : au plus UN geste (balayage gauche→droite, joué une fois, figé ensuite,
  `prefers-reduced-motion` → état final direct). Jamais de boucle, jamais de séquentiel deux-courbes.
- Pas de cadre-carte : la bande émerge du fond sombre et s'y dissout (pattern « sans bordure »
  assumé, en écart au pattern carte bordée).
- Version minimale toujours valable si tout échoue : retrait conditionnel de la cover (ne l'afficher
  que pour les 71 INSEE bespoke), recommandation Design Critic du 2026-07-01.

## Implémentation (2026-07-02, codée)

- `GasparCatnatSummary.years` (`src/lib/georisques.ts`) : années marquées + famille dominante
  par année (la plus fréquente dans l'année ; égalité tranchée inondation > sécheresse >
  tempête > autre). Mapping familles : Inondations/Submersion/Vagues → bleu ; Sécheresse des
  sols → ocre ; Tempête/Cyclone → violet ; tout le reste (mouvement de terrain, séisme,
  avalanche, grêle, neige) → gris.
- `TerritoryYearsBand` (`src/components/report/TerritoryYearsBand.tsx`) : SVG fidèle à la v4,
  nom dans la bande (taille adaptée aux noms longs), années 1982→courante, ticks fantômes,
  animation WAAPI un passage (fill backwards : sans JS ou en reduced-motion la bande est
  complète d'emblée), phrase-légende déterministe gabarisée (0/1 année = « C'est rare » ;
  ≥4 avec majorité sur les 15 dernières années = « de plus en plus rapprochées ») + légende
  des familles présentes.
- Montée dans `rapport/quartier/page.tsx` à la place de `TerritoryCover` (supprimé), rendue
  seulement si GASPAR a répondu : bande vide = commune épargnée, jamais donnée en panne.
  Les webp `/covers/bespoke` et `/covers/archetypes` restent dans `public/` (à nettoyer un jour).
- Pas d'« été record » : la v4 retenue est pur CatNat (faits administratifs datés).

### Ajustements porteur (2026-07-02, après premier visuel)

- **Emplacement : sous le passeport** (la carte d'identité ouvre le rapport, la mémoire suit).
- **Nom de commune retiré de la bande** (il apparaissait 4 fois en quelques scrolls) : les
  années occupent toute la largeur, hauteur réduite (aspect 5/0.9, viewBox 187).
- **En-tête ajouté** (sans nom ni cadre, la bande arrivait sans annonce) : titre de section
  « La mémoire du lieu » + une phrase (« Toutes les années depuis 1982. Celles où la commune
  a été reconnue en état de catastrophe naturelle ressortent, à la couleur de l'événement. ») ;
  le suffixe « · arrêtés de catastrophe naturelle » de la légende, devenu redondant, est retiré.
- **Comparaison nationale dans la légende** : distribution calculée sur le fichier GASPAR
  national du 2026-06-29 (247 701 arrêtés ≥1982, 34 969 communes, 99 % touchées) → médiane
  **4 années marquées** par commune, p90 = **10**. Légende : « La commune française médiane
  en compte quatre. » ; au-delà de 10 : « Une commune sur dix dépasse dix années. »
  Constantes documentées dans le composant (à recalculer si le fichier GASPAR évolue fort).
- **Bug d'arrivée en bas de page corrigé** (`AskFuture.tsx`) : en variante inline le panel
  est ouvert au montage, donc le `scrollIntoView` du fil vide + le `focus()` d'ouverture
  faisaient défiler la page jusqu'au bloc « une question ». Gardés désormais : scroll
  seulement quand il y a du contenu, focus seulement hors inline.

## QA données (29 communes stratifiées, API GASPAR réelle, 2026-07-02)

Les figures se distinguent nettement : Marseille 31 années marquées (dense, dominante bleue),
Toulouse/Agen dominés par l'ocre sécheresse (argiles), Briançon 4 années, Guéret 5,
Noirmoutier 4, la tempête de 1999 visible en violet à Saint-Malo et Quimper. Le gabarit
« de plus en plus rapprochées » ne se déclenche que là où c'est vrai (Guéret, Lons-le-Saunier,
sécheresses récentes). Nuance assumée : Lothar/Martin 1999 apparaissent souvent en bleu
(les arrêtés post-tempête sont « inondations/coulées »), c'est le fait administratif.
Script : scratchpad session 2ab961b4, `qa-bande-annees.py`.

## Reste à faire

1. Vérification visuelle dans l'app par le porteur (page authentifiée payante).
2. Commit (à séparer du chantier tranche A non commité qui touche la même page).
