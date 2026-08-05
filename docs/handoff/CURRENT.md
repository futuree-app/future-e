> ## ⚠ CE BRIEF EST DÉPASSÉ — état réel au 05/08/2026, fin de journée
>
> Il décrit la matinée du 04/08 et n'avait jamais été commité : il est conservé pour sa trace
> (les mesures de la charte, la recherche de source d'`acces_services`, les pièges du worktree).
> **Son « État git » est faux** : il annonce 2 commits non poussés, il y en a eu neuf de plus.
>
> **Ce qui a été fait depuis, et qui est en production ou en attente de push :**
>
> - **Charte v1.7, les 4 lots** : logo à 22 px, échelle typographique (plafonds baissés, 55 titres
>   ramenés sur les tokens), orange `#E8823A`, six registres aux valeurs de la charte, doctrine
>   corrigée dans `DESIGN.md`, le vault et l'ADR-0005.
> - **Ligne « Services »** remplacée par le niveau de centralité ANCT (`centralite-services.ts`).
>   Piège trouvé : les 45 arrondissements PLM portent `equip: null` sans être des non-pôles.
> - **Conformité de la vente** : page `/conditions-generales-de-vente`, encadré réglementaire de
>   l'annexe D. 211-3 reproduit mot pour mot, renoncement exprès à la rétractation recueilli dans
>   `PaymentForm`, confirmation sur la facture ET dans les e-mails. Le plafond de responsabilité,
>   clause noire, a été retiré.
> - **Cinq promesses retirées des écrans de vente** (export PDF, régénération annuelle, partage par
>   lien, accès permanent, téléchargement) : aucune n'existait dans le code.
> - **Le dossier daté et versionné** : `decision_artifact` en base, génération au webhook et
>   rattrapage à l'ouverture pour les dossiers déjà achetés. Spec :
>   `docs/superpowers/specs/2026-08-05-dossier-date-et-versionne-design.md`.
> - **Vigieau** : une panne de l'API annonçait « aucune restriction en cours ». Corrigé à la source.
>
> **Chantier C (permis dans le moteur)** : toujours dans son worktree, 9 commits, non fusionné.
> Il attend la vérification à l'écran décrite en fin de plan.
>
> **Ouverture au crawl** : plan prêt, non appliqué, en attente du feu vert du porteur
> (`docs/superpowers/plans/2026-08-04-ouverture-indexation.md`).
>
> ---

# Passation — 2026-08-04, branche `main`

**Horodatage** : 2026-08-04 · **Branche** : `main` = `edda76c`, **2 commits non poussés**.

> ⚠ **TROIS CHANTIERS VIVENT EN PARALLÈLE, SUR TROIS TERMINAUX.** Ce brief les porte tous les trois.
> Ne pas supposer qu'un `git status` sale vient de son propre travail.
>
> - **Chantier A — charte de marque v1.7** (terminal « charte », sur `main`) : lot 1 fait,
>   **27 fichiers modifiés non commités**, plus 12 fichiers nouveaux. Rien n'est commité : **c'est le
>   travail le plus exposé du dépôt**, il ne survit à rien d'autre qu'à ce brief.
> - **Chantier B — données du comparateur** (terminal « données », sur `main`) : 2 commits faits, non
>   poussés, plus un rapport d'audit non suivi.
> - **Chantier C — les permis dans le moteur** (terminal « permis ») : **il n'est PAS sur `main`.**
>   Il vit dans un worktree, `​.claude/worktrees/permis-dans-le-moteur`, sur la branche
>   `worktree-permis-dans-le-moteur`, avec **3 commits propres** et un arbre net. **Un `git status`
>   dans le dépôt principal n'en montre rien**, et ses fichiers n'apparaissent pas dans
>   `~/Desktop/Futur·e/docs/` tant que la branche n'est pas fusionnée.
>
> Un push sur `main` déploie en production, sans étape Preview. Relire `git status` avant tout
> `git add`, et stager **nommément**, jamais `git add -A`.

Le handoff qui portait le chantier OSM est archivé sous
`docs/handoff/2026-08-03-osm-emprise-relations.md` (**non suivi par git, à committer**). Il contient
le chantier des relations multipolygones et l'observation « point de référence » (fiche
`project_futuree_point_de_reference`), qui ne sont repris ici qu'en renvoi.

---

## Objectif en cours

**Chantier A** : intégrer la charte de marque v1.7 (pack dans `CHARTE/`, non versionné) en 4 lots :
le logo, l'orange, les six registres de décision, la doctrine. Lot 1 fait et vérifié, lots 2 à 4 non
commencés.

**Chantier B** : assainir les critères du comparateur dont la donnée ne porte pas ce que le texte
affirme. Le critère `acces_services` a été instruit de bout en bout ; son injection automatique est
retirée, et sa source primaire vient d'être recherchée. Reste à décider du sort de la ligne
« Services ».

**Chantier C** : faire entrer les autorisations d'urbanisme dans le `REGISTRY` du moteur de décision.
Le registre est appelé, gelé, affiché et doté d'une doctrine complète depuis le 01/08, mais il n'a ni
`DecisionFact`, ni règle, ni grain déclaré : il est donc absent du verdict, de la minute et de la
liste des contrôles. Spec et plan écrits et relus, **implémentation non commencée**.

---

# CHANTIER A — Charte de marque v1.7

## Ce que la charte a coûté avant d'être acceptée

Quatre versions auditées. Les rapports sont dans `docs/rapports-agents/design-critic/` et portent les
mesures ; ce brief ne garde que la conclusion.

- **v1.2** — 17/40. PDF d'exemples composés en Helvetica sans police embarquée, master du logo en
  autotrace de bitmap, tables `name` d'Archivo cassées, point « circulaire » ovale à 3,22 %.
- **v1.4** — corrections réelles sauf une : le SVG annoncé « en courbes de Bézier » était l'autotrace
  **décimé de 520 à 166 sommets et ré-étiqueté en `C`**. Flèche maximale 0,684 px sur 968 px de
  large : le contour *était* son polygone d'ancres.
- **v1.6** — vrai redessin, mais 48 % des ancres encore reprises du polygone.
- **v1.7** — validée : 50/53 droites axées, 7 fûts à exactement 35,000, les deux `u` identiques par
  translation à 0,000000 px, 12/12 jonctions G1 à 0,000°, 28/28 extrema sur une ancre.

**Reste ouvert sur le master (P3, non bloquant)** : la dérive cumulée depuis le candidat approuvé est
de **3,2 %** (IoU 96,759 %) et n'est écrite nulle part dans la charte ; l'apex du `e` est 6,5 unités à
gauche du centre de sa panse — **assumé** comme axe incliné par le README du pack, à ne pas
« corriger » par erreur.

## Fait — lot 1, le logo

- **`src/components/Logo.tsx` créé.** Mot-symbole et signe compact inlinés. Le lettrage prend
  `currentColor` (il suit le thème), le point prend `var(--accent)`. Props : `variant` (`mot` |
  `compact`), `height`, `mono`, `title` (`null` = décoratif, quand un `aria-label` parent porte déjà
  le nom).
- **Deux vérifications, pas une** : les 6 tracés sont identiques au master caractère pour caractère
  après normalisation des espaces ; et le rendu du composant **tel que servi par le serveur** est
  identique au pixel près au rendu du master du pack (**0 octet de différence sur 643 448**).
- **16 brandmarks remplacés** : `Navbar`, `AccountNav`, `AuthForms`, `(auth)/layout`, footers de
  `compte` et `rapport`, `professionnels` ×2, `mentions-legales`, `politique-confidentialite`,
  `savoir/maladies-emergentes` ×2, `savoir/preparation-catastrophes`,
  `savoir/pollutions-invisibles`, `agir/canicule`, `agir/pollutions-invisibles`, footer de
  `FutureELanding`.
- **2 occurrences laissées en texte volontairement**, dans `compte/memoire/page.tsx` (« Ce que
  futur•e sait de vous », « les réponses de futur•e ») : c'est le nom dans une phrase, pas le logo.
- **Instrument Serif a quitté le produit** : `@font-face` supprimé, token `--font-brand` supprimé et
  nettoyé dans 16 fichiers, `public/fonts/InstrumentSerif-Italic.ttf` (70 Ko) supprimé. Vérifié
  d'abord que **`--font-serif` vaut Archivo malgré son nom** — ses 270 usages sont intacts.
- **Icônes** : `src/app/favicon.ico`, `src/app/apple-icon.png` (180 px), `src/app/icon.svg`. Next.js
  émet les trois balises seul, vérifié dans le HTML servi. `icon.svg` a reçu **un fond nuit ajouté à
  la main** : le SVG du pack est en lettrage nuit sur transparent et serait invisible dans un onglet
  en thème sombre.
- **SVG de marque copiés** dans `public/logo/` pour les usages hors React (OG, e-mails, PDF).

**Vérifications passées** : `npx tsc --noEmit` exit 0 · `npx eslint src/` — 20 problèmes, **exactement
les mêmes qu'avant** (comparé par `git stash`, aucun ajouté) · `npm run build` exit 0 · `npm run
start` : page en 200, SVG présent dans le HTML, ancienne police en 404, les trois icônes en 200.

## Les deux retours du porteur, mesurés — à traiter en priorité

### 1. Le titre de la landing déborde. Confirmé au chiffre.

`FutureELanding.tsx:2561` rend `<h1>Où vivre demain ?</h1>` avec `styles.h1` (ligne 1742) :
`fontSize: 'clamp(42px, 5vw, 68px)'`, `letterSpacing: -1.5`.

Le hero est une grille `1fr 1fr` dans 1100 px, padding 28, gap 64 → **la colonne gauche fait 490 px**.
Largeur réelle du titre, mesurée sur les métriques d'`Archivo-Regular.ttf` (table `hmtx`,
`unitsPerEm = 1000`) :

| taille | largeur | verdict |
|---|---:|---|
| **68 px (plafond actuel)** | **516,9 px** | **déborde de 27 px** → le `?` tombe à la ligne |
| 60 px | 453,1 px | tient |
| 56 px | 421,2 px | tient |
| 48 px | 357,3 px | tient |

**Ne pas corriger en posant un `max-w` sur le `h1`** : ce serait l'anti-patron décrit dans `AGENTS.md`
(« ne pas couper une phrase au milieu d'un bloc »). Deux voies légitimes : baisser le plafond du
`clamp` à ~60 px, ou élargir la colonne gauche de la grille. **Le porteur trouve les titres trop gros
en général** — l'échelle typographique mérite une passe entière plutôt qu'un correctif ponctuel.

### 2. Le logo est trop gros dans la navbar. Fondé, mais en tension avec la charte.

Posé à `height={26}` dans `Navbar.tsx`. Géométrie réelle (viewBox 968×240) :

| `height` | largeur | hauteur d'x |
|---|---:|---:|
| 22 px | 88,7 px | 14,2 px |
| 24 px | 96,8 px | 15,5 px |
| **26 px (actuel)** | **104,9 px** | **16,8 px** |
| 28 px (minimum charte) | 112,9 px | 18,1 px |

L'ancien logo texte (Instrument Serif italique 22 px) faisait ~75 px de large pour une hauteur d'x
d'environ 11 px. Le ressenti est exact. **Mais la charte v1.7 (page 5) fixe 28 px comme minimum, et
il est déjà posé à 26.** Arbitrage à trancher par le porteur, pas un réglage : réviser le minimum
dans la charte, assumer une marque plus présente, ou basculer la navbar sur le signe compact `r•`
(la charte donne priorité au mot-symbole dès que la place existe, et elle existe ici).

---

# CHANTIER B — Données du comparateur

## Fait dans cette session

- **Commit `ce71f36`** (déjà poussé et en production le 03/08) : correctif de l'emprise OSM, cf. le
  handoff archivé.
- **Commit `eedb23d`** : passation précédente. **Non poussé.**
- **Commit `edda76c` — « Élever nos enfants » ne demande pas ce que ce critère mesure. Non poussé.**
  Retrait de l'injection automatique `famille → acces_services (poids 2)` dans
  `src/app/api/comparateur-vie/parse/route.ts`, plus une **règle négative explicite** (l'omission ne
  suffit pas : le modèle refait l'association par raisonnement culturel). Deux gardes qui ne prouvent
  pas la même chose : `src/lib/comparateur-parse-prompt.test.ts` (lit le prompt, protège la règle
  contre une réintroduction par édition, vérifié rouge en la remettant) et
  `scripts/sonde-parse-famille.mjs` (appelle le vrai parseur sur `npm run dev`, **3/3 conformes**).
  Aucun test positif « services proches → `acces_services` » : il graverait la correspondance
  précisément mise en cause. `eviter_isolement` et `faible_pression_agricole` inchangés, pour isoler
  la correction. `tsc` exit 0, **1 234 tests** verts, eslint propre.
- **`docs/audits/2026-08-04-source-acces-services.md`** (non suivi) : recherche de la source primaire.

## Ce que la recherche de source a établi

| | |
|---|---|
| **L'ADEME ne documente pas le champ** | `data_communes` déclare 7 sources ; aucune ne couvre l'éloignement à 20 min. Le champ n'a ni titre ni description dans le schéma. **Établi.** |
| **Un indicateur homonyme existe à l'ANCT, sur la SANTÉ** | « …d'au moins un des services **de santé de proximité** », Observatoire des Territoires. Pas de variante « tous services » au catalogue. **Établi.** |
| **Les ordres de grandeur concordent** | 0,83 % de la population nationale (repère publié 0,5 %) ; 11,81 % sous 25 hab/km² (repère ~8 %). **Faisceau, pas preuve.** |
| **Deux tests discriminants ont ÉCHOUÉ** | Troncature du nom **infirmée** (un autre champ fait 88 caractères) ; corrélation **non concluante** (r = −0,254 avec l'APL contre **−0,338 avec la densité**). |
| **`agri.equip` est identifié et COMPLET** | « Niveau de centres d'équipements et de services des communes » (INRAE-CESAER / ANCT). Décomptes appariés : 24 027/24 064 non-pôles, 7 001/7 011, 2 879/2 880, 742/742, 139/142. **Le `null` = non-pôle, catégorie explicite : couverture 100 %, pas 30,9 %.** |

**Conséquence : la décision sur la ligne « Services » n'a plus besoin d'attendre.** Les deux branches
restantes mènent au même endroit. Si le champ est l'indicateur santé, « Services » est un doublon
dégradé d'`acces_soins` (qui utilise déjà l'APL de la DREES) et son libellé est faux. Si c'est un
panier plus large, il reste un indicateur de queue, plafonné à 80,1 %, palier intermédiaire vide, avec
le même libellé faux.

**Ce qui manquerait pour prouver** : l'export commune par commune de l'indicateur ANCT, à comparer aux
valeurs de l'index. Pas d'API publique (`api.observatoire-des-territoires.gouv.fr` ne répond pas,
`/api/indicateurs` renvoie 404) ; le téléchargement passe par le bouton de la fiche, donc par
l'interface web. Une fois le fichier obtenu, la comparaison prend dix minutes et tranche.

---

# CHANTIER C — Les permis dans le moteur de décision

> ⚠ **CE CHANTIER N'EST PAS DANS L'ARBRE PRINCIPAL.** Tout ce qui suit vit dans
> `.claude/worktrees/permis-dans-le-moteur`, branche `worktree-permis-dans-le-moteur`.
> Pour le reprendre : `cd .claude/worktrees/permis-dans-le-moteur`. Le dossier commence par un point,
> donc le Finder le masque (`Cmd + Shift + .` pour l'afficher). Le worktree a son propre
> `node_modules` (installé) et une copie de `.env.local`.

## Ce qui a été livré avant, et qui est déjà en production

Deux lots antérieurs, faits sur `main` et poussés :

- **Le chantier SITADEL n'est pas clos**, contrairement à ce que sa spec affirmait. La vérification a
  donné raison au porteur : tout ce qui est annoncé livré l'est réellement, mais la spec s'était
  déclarée complète **sur sa propre liste de tâches, pas sur l'intégration du module**. Quatre points
  restent ouverts, listés en tête de
  `docs/superpowers/specs/2026-08-01-permis-autour-adresse-design.md`.
- **La charnière temporelle de la conclusion Autour** (point 2 des quatre) est **livrée et corrigée
  deux fois**, après vérification à l'écran sur des dossiers réels. Elle dit désormais
  « Cette configuration peut encore changer : au moins un chantier est déclaré ouvert. » ou
  « … : aucune ouverture de chantier n'est déclarée. », sans un seul chiffre. Le libellé
  `LIBELLE_ETAT.autorise_non_commence` est devenu « autorisé, sans ouverture de chantier déclarée
  dans le registre consulté ».

## Fait dans cette session : la spec et le plan du point 1

Trois commits dans le worktree, **aucune ligne de code produit** :

| Commit | Contenu |
|---|---|
| `8497802` | la spec, `docs/superpowers/specs/2026-08-03-permis-dans-le-moteur-design.md` |
| `1e34aa3` | le plan, `docs/superpowers/plans/2026-08-03-permis-dans-le-moteur.md` |
| `7cd6879` | neuf corrections du plan après relecture, dont deux qui le rendaient inexécutable |

**Ce que la relecture a rattrapé, et qui mordait vraiment :**

- **`observedAt` n'aurait jamais atteint l'écran.** Zéro occurrence dans `src/components/`, et
  `factSources` (`DecisionFactRenderParts.tsx:98`) écarte en plus les preuves qui portent un
  `observedValue`. La date de consultation passe donc par `signalConvention`, qui **est** rendue dans
  « Données et limites » (`ControlesDuDossier.tsx:82`, `DossierDecisionSection.tsx:285`).
- **Le lien `/rapport/autour#permis` ouvrait le mauvais bien.** Sans `dossierId`, la page ne retombe
  sur le bon dossier que par `getSoleDossier`, donc uniquement quand le compte n'en a qu'un. Le
  `href` est retiré du lot, et l'ancre avec lui : les deux reviendront quand l'identité du dossier
  remontera jusqu'à la projection.
- **Le `status` défaisait la correction de la veille.** « Autorisation non commencée » affirme une
  absence de travaux là où la source établit une absence de **déclaration**, exactement ce qui venait
  d'être retiré de `LIBELLE_ETAT`. Devenu « Sans ouverture déclarée ».
- **Les trois silences n'en étaient que deux** : même `outcome` ET même `reason` pour « registre
  vide » et « tous achevés ».
- **La fenêtre n'était gelée qu'à moitié** : `anneeReference` était ignorée, donc un dossier rouvert
  en 2029 aurait laissé croire qu'on avait regardé jusque-là.

## Le lot en une table

```text
permis absent (registre non consulté) → uncertain,       aucun fait
registre consulté, aucun dossier      → not_applicable,  reason « aucune autorisation recensée »
uniquement des achevés                → not_applicable,  reason « toutes achevées »
au moins un non achevé                → verification,    UN fait agrégé, secondary, échelle quartier
```

---

## Décisions prises, pas encore dans le vault

**Chantier A**

1. **Porteur** : ordre d'intégration = logo, puis orange, puis registres, puis doctrine.
2. **Porteur** : variante **A** du `e` (construction circulaire) en production ; la variante B ovale
   reste archivée comme trace de décision.
3. **Proposé, appliqué** : un composant React unique plutôt que les 8 SVG du pack importés tels quels
   (ils ne diffèrent que par leurs deux `fill` ; les importer figerait la couleur).
4. **Proposé, appliqué** : fond nuit ajouté à `icon.svg`, absent du pack.
5. **Proposé, appliqué** : le nom dans une phrase reste du texte ; seul le logo devient un SVG.

**Chantier B**

6. **Porteur** : le retrait de l'injection famille part en commit **isolé**, et il est nommé pour ce
   qu'il est : il **ne répare pas** `acces_services`. Il ne crée aucun trou, il **cesse d'en masquer
   un** (`eviter_isolement` mesure la taille du bassin, jamais la desserte).
7. **Porteur** : `access` OSM ne servira **qu'en `private|no`**, filtre négatif ; `barrier` stocké mais
   non exploité (une clôture est souvent un objet séparé du polygone).
8. **Porteur** : ne pas laisser durablement « Services » dans la matrice en attendant une recherche
   indéfinie. La recherche étant close côté décision, l'arbitrage est mûr.
9. **Porteur, doctrine à graver** : « **Ne pas être très éloigné d'un service ne signifie pas en être
   proche.** » Le mauvais résultat parle, le bon reste neutre. Même forme que `named_absence` dans le
   registre de matérialité.
10. **Proposé, non tranché** : instruire la source primaire **avant** `agri.equip`, l'inverse de
    l'ordre initial du porteur, parce que la source décide seule du sort de la ligne. La recherche
    ayant abouti, le point est caduc : les deux sont mûrs.

**Chantier C**

11. **Porteur** : traiter **les permis seuls**, pas les trois familles de faits d'adresse restées hors
    moteur. L'ÎCU vient ensuite et réutilisera le patron ; l'espace vert attend en plus l'audit de la
    sémantique de distance, déjà décidé.
12. **Porteur** : activation **inconditionnelle** (`projectKeys: []`), comme les risques du logement.
    Personne ne déclare « je veux savoir ce qui va se construire à côté ». L'accrochage à
    `cadre_calme` est écarté : cette préférence mesure la densité au grain commune.
13. **Porteur, doctrine à graver** : « **Un permis non achevé est toujours un fait `secondary`.
    L'ouverture du chantier augmente la certitude temporelle du constat, jamais sa matérialité
    décisionnelle**, faute d'information sur l'ampleur et les effets. » `structuring` redeviendra
    défendable le jour où une donnée objectivera l'effet (volume, emprise, nature).
14. **Porteur** : le geste de la carte est **« Demandez en mairie à consulter le dossier »**. Le
    dossier déposé porte la nature de l'opération, la hauteur et la surface de plancher, c'est-à-dire
    exactement les trois informations que le registre SDES ne publie pas. Le panneau sur place est
    écarté : il n'existe pas sur un dossier dormant.

## État git

- Branche `main`, HEAD = `edda76c`, **2 commits en avance sur `origin/main`** (`eedb23d`, `edda76c`),
  tous deux du chantier B. **Ne pas pousser sans le porteur** : un push déploie, et le chantier A a
  27 fichiers en cours dans le même arbre.
- **Chantier A, non commité** : 27 fichiers modifiés, plus `src/components/Logo.tsx`,
  `src/app/icon.svg`, `src/app/apple-icon.png`, 8 SVG dans `public/logo/`, et la suppression de
  `public/fonts/InstrumentSerif-Italic.ttf`.
- **Non suivis, à committer** : `docs/audits/2026-08-04-source-acces-services.md`,
  `docs/handoff/2026-08-03-osm-emprise-relations.md`,
  `docs/rapports-agents/design-critic/2026-08-03-identite-charte-v1-2.md`,
  `docs/rapports-agents/design-critic/2026-08-04-logo-v1-4-qualite-du-trace.md`.
- **Non suivis, volontairement hors dépôt** : `CHARTE/`, `.impeccable/`, `Futur.e Design System.zip`.
- **Chantier C, dans un WORKTREE** : `.claude/worktrees/permis-dans-le-moteur`, branche
  `worktree-permis-dans-le-moteur`, **3 commits** (`8497802`, `1e34aa3`, `7cd6879`), **arbre propre**,
  base `47dfadc`. Ces commits ne sont ni sur `main` ni sur `origin`. Une branche de sauvegarde locale
  existe aussi, `backup/main-2026-08-03-avant-passe-editoriale`.
- Aucune PR ouverte.

## Prochaine étape immédiate

**Elle dépend du terminal.**

**Chantier A** : trancher les deux retours mesurés ci-dessus avec le porteur (échelle des titres,
taille du logo), puis le **lot 2 — l'orange** : `#fb923c` → `#E8823A`, et en thème clair
`--orange-ink` `#b04f00` → `#994000`. **Ne pas le faire au `grep` sur `fb923c` seul** : la valeur vit
aussi en `rgba(251, 146, 60, …)` dans `--glow-orange`, `--orb-orange`, `--shadow-card-hover`,
`--orange-tint`, `--orange-tint-2`, `--orange-ring`. Chercher les **deux** formes avant de toucher
quoi que ce soit. 25 fichiers portent la forme hexadécimale. Tant que le lot 2 n'est pas fait, le
point du logo reste à l'ancien orange, puisqu'il consomme `var(--accent)`.

**Chantier B** : trancher le sort de la ligne « Services » avec le porteur, entre retrait de la ligne
et du critère, ou remplacement par `agri.equip`. Le remplacement est **prêt côté donnée** (échelle à
5 classes, couverture 100 %, source publique) mais demande d'abord d'instruire : ce que classent
exactement les niveaux 1 à 4, le millésime servi par l'ADEME (l'ANCT annonce 2025 pour un socle
INRAE-CESAER 2021), et les 62 communes sans `viv`. Puis, en petit commit séparé, **l'assertion de
coordonnées dans `scripts/lib/absence-attestations.mjs`** : aucune commune ne peut recevoir
`measured: true` sans coordonnées permettant de tenter la mesure (le producteur jette déjà si une
commune manque du record, il lui manque ce cas).

**Chantier C** : exécuter le plan, `docs/superpowers/plans/2026-08-03-permis-dans-le-moteur.md`,
depuis le worktree. Quatre tâches, chacune avec son code et sa commande : le contrat et les trois
silences, le fait et ses quatre états, la preuve, puis le branchement au `REGISTRY`. **Relever le
total de tests AVANT la Task 1** (`node --test src/lib/**/*.test.ts | grep "^ℹ pass"`) et le noter :
vingt de plus sont attendus à la fin. **Ne jamais mesurer par `git stash`**, la pile est partagée
entre le dépôt principal et tous les worktrees, et deux autres sessions y travaillent.

Le chantier des **relations multipolygones OSM** reprend après, tel que spécifié dans
`docs/handoff/2026-08-03-osm-emprise-relations.md`, section « Prochaine étape » (six cas à trancher,
dont la déduplication des ways membres et le test Fontainebleau).

## À lire d'abord à la reprise

1. `MEMORY.md`, puis `project_module_logement` (paragraphe daté du 03/08, en fin de fiche) et
   `project_futuree_point_de_reference`.
2. `docs/handoff/2026-08-03-osm-emprise-relations.md` — tout ce qui n'est pas la charte, dont
   l'observation « point de référence » et l'audit OSM.
3. **Chantier A** : `docs/rapports-agents/design-critic/2026-08-04-logo-v1-4-qualite-du-trace.md`
   (476 lignes, trois évaluations datées, porte les mesures de géométrie) ; puis
   `2026-08-03-identite-charte-v1-2.md` ; puis `CHARTE/futur-e-charte-v1/02-couleurs-et-tokens/`
   (`futur-e-tokens.css`, `contrastes.md`) et `05-edito/charte-editoriale.md` ; puis
   `CHARTE/futur-e-logo-v1-7-final/README.md` pour ce qui est **décidé** dans le master.
4. **Chantier B** : `docs/audits/2026-08-04-source-acces-services.md` (dont la section « ce qui a été
   vérifié, et comment », qui distingue établi / faisceau / infirmé) et
   `docs/audits/2026-08-03-osm-semantique-distance.md`.
5. Le code : `src/components/Logo.tsx` (ses commentaires disent pourquoi un composant et pas 8
   fichiers), `src/app/design-tokens.css`, `src/components/Navbar.tsx` ;
   `src/lib/comparateur-scores.ts:22`, `src/lib/comparateur-vie.ts:1242` et `:1381`.
6. **Chantier C**, dans le worktree : `docs/superpowers/specs/2026-08-03-permis-dans-le-moteur-design.md`
   (les sections « La table des cas » et « Le contenu du fait » portent toutes les décisions), puis le
   plan homonyme sous `docs/superpowers/plans/`. Le code à connaître :
   `src/lib/decision/secteur-rules.ts` (le patron exact à suivre),
   `src/lib/decision/decision-fact.ts:361` (la sémantique des `outcome`, qui décide de
   `uncertain` contre `not_applicable`) et `src/lib/decision/echelles.ts:63` (le grain qui range le
   fait sous « Autour de l'adresse »).
7. `docs/vault/doctrine/data.md` et `docs/vault/modules/logement.md`.
8. `docs/handoff/AUTO-SNAPSHOT.md` pour vérifier la fraîcheur.

## Pièges et fils ouverts

**Chantier A**

- **`DESIGN.md` affirme encore qu'Instrument Serif porte le logo.** C'est faux depuis cette session.
  Tant que ce n'est pas corrigé, un futur agent recréera l'ancien logo texte en toute bonne foi.
  C'est le lot 4, mais c'est le piège le plus coûteux de la liste.
- **`/dev/logo` et `/dev/typo` documentent une exploration close** et référencent les 4 anciens SVG
  `futuree-*.svg`, supprimés puis **restaurés** pour ne pas casser la page : `public/logo/` contient
  les deux générations. Leur suppression est une décision du porteur.
- **La charte interdit le monospace par défaut** (page 9) alors que `--font-mono` (JetBrains Mono)
  porte les surtitres partout. Arbitrage du lot 4, pas un oubli.
- **Les six registres de la charte** (incompatibilité, alignement, compromis, écart, non su, contrôle
  à mener) n'existent pas dans `design-tokens.css`. Le rapport a cinq registres colorés, **aux
  valeurs de la charte près** : à réconcilier au lot 3, surtout pas à recréer en parallèle.
- **Ne pas mesurer un PNG avec un décodeur maison.** Les proportions de favicons données le 03/08
  venaient d'un décodeur qui **ignore les filtres de ligne PNG** : elles ne valent rien. Utiliser
  `sips` ou une vraie bibliothèque. Le reste des audits ne passait pas par ce décodeur et tient.

**Chantier B**

- **`acces_services` reste plein exercice dans la matrice payante et le comparateur gratuit.** Seuls
  le mismatch (bande à deux bornes) et la Découverte le neutralisent. 80,1 % des communes au palier
  haut, **palier intermédiaire vide (0 sur 34 788)**, deux communes tirées au hasard à égalité dans
  **64 %** des cas. C'est le patron d'`AGENTS.md` : point de décision protégé, points de citation non.
- **La ligne dégénérée porte le label le plus générique du thème**, « Services », donc la plus grande
  autorité apparente, à côté de quatre lignes qui, elles, mesurent (soins par APL, écoles et culture
  par BPE, isolement par taille de bassin).
- **`inondation.tri` est codé en dur à `False`** (`scripts/populate-inondation.py:93`) et alimente
  l'index : présenté comme une donnée alors qu'il n'en est pas une. Vérifié sur une commune réellement
  couverte par un TRI. Soit le renseigner, soit le retirer du rendu.
- **`distance_cote_km` est faux sur des communes littorales** : Lannion à 58 km, Morlaix à 54 km de la
  mer (approximation « V1 » par haversine vers une liste de villes côtières). À remplacer par le trait
  de côte IGN.
- **Deux producteurs écrivent `reseauLocalMeasured` avec deux sémantiques** : `populate-reseau-local.py:345`
  pose `ins in geoloc`, `absence-attestations.mjs:32` pose `true` inconditionnellement, et c'est lui
  qui a tourné. **Aucun mensonge aujourd'hui** (les 34 788 communes sont géolocalisées, `reseauLocal:
  null` est une absence attestée), mais l'invariant n'est pas protégé.
- **`status: "failed"` d'Overpass n'a pas été instruit** : une liste vide ne doit jamais se présenter
  comme complète. **Le défaut n'est PAS établi**, il n'a pas été vérifié dans le rendu. Ne pas le
  corriger sans preuve.
- **La vérification en production du correctif d'emprise reste ouverte** : ouvrir un dossier sur une
  adresse **lilloise** et recharger (le cache est en v3, la première ouverture recollecte la cellule).
  `POST /api/logement-autour` exige une session et un dossier accessible.

**Chantier C**

- **Le worktree rend le travail invisible depuis `main`.** Ni les fichiers, ni les commits, ni un
  `git status` dans le dépôt principal n'en montrent quoi que ce soit. C'est l'effet recherché, mais
  une session froide qui ne lit que `main` conclura que le chantier n'existe pas.
- **Le fait disparaîtra si le chargement Logement échoue.** Dans `DossierAvecLogement`, tout
  l'assemblage au grain adresse vit dans un `try` : sur `LogementDataUnavailableError`, le composant
  retombe au dossier communal, et le permis partirait avec les autres faits d'adresse alors qu'il est
  gelé et indépendant de cet appel. Non corrigé, nommé dans le plan.
- **Une réponse « fichier vide » erronée se gèle définitivement.** `fetchPermisAutour` traite un
  `400 « Le fichier est vide »` comme zéro ligne, ce qui est juste dans le cas normal. Si l'API
  répondait ainsi à tort, le snapshot figerait une absence, et le rattrapage ne repasserait pas : il
  ne se déclenche que sur `permis === undefined`.
- **Le soupçon de non-déterminisme du snapshot est ÉCARTÉ**, ne pas le rouvrir sans preuve neuve :
  trois lectures du même `dossierId` ont rendu exactement le même bloc et la même date. La divergence
  observée le 01/08 venait d'un pilote de test qui comparait deux dossiers différents.
- **Le compte du verdict est en jeu.** Ce lot ajoute un contrôle à la liste, et la promesse gravée le
  01/08 (« le lecteur compte les cartes et retombe sur le chiffre ») casse si le nouveau fait n'est
  pas compté. C'est la troisième vérification à l'écran prévue par le plan.

**Transverses**

- Le site est **fermé au crawl** (`robots.txt` en `Disallow: /`) et **aucune CGV n'existe** ; les deux
  points survivent aux handoffs successifs.
- Les pièges design antérieurs restent valides : `--orange` sur du texte échoue en thème clair
  (2,13:1), et le sable `#c8b89a` subsiste dans `professionnels/page.tsx`, `ProForm.tsx`,
  `globals.css` alors que `DESIGN.md` déclare sa suppression.
