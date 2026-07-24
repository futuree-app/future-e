# Passation — Lot D, `priorityControl` et la NAVIGATION vers les preuves EN PROD. Lot FEU en cours.

**Horodatage** : 2026-07-25 · **Branche** : `main` = `03ebd4c` (poussé). **Tree propre** côté code : il ne
reste que ce fichier et deux non suivis à NE JAMAIS committer — `Futur.e Design System.zip` et
`src/app/dev/` (harnais de rendu, voir plus bas).

## Ce qui est EN PROD (poussé sur main)

### Lot D chaleur, tâches 0 → 4 (`43ae027`, `5ac5492`, `c3208bc`, `9df695d`)
La chaleur défavorable sur priorité déclarée = **mismatch** (« Ce qui correspond moins bien », arbitrage),
plus verification. Composition `climate_comfort` (fallback) / `seasonal_climate_tradeoff` (avec douceur),
**une seule composition climatique par dossier**. Le héros nomme le mismatch absorbé. Verification
**ambiante** (chaleur non déclarée, règle séparée, poids 0). Validé à l'écran sur Toulouse.
Task 5 (intro de section) : no-op assumé. Increment 2 (chaleur FAVORABLE) : différé, bloqué données.

### `priorityControl` déterministe (`e562d51`, `cbac598`)
Le résiduel sous le verdict ne nommait qu'un SUJET (« Ce qu'impose le sol argileux. ») : aucune démarche,
et sous un verdict d'arbitrage il se lisait comme un second point défavorable. Le registre généré
`reserves_found` **disparaît** (retiré de `BlockKey`, du plan, du prompt ; hash bumpé **v16**). À sa place :

- `conclusion-plan.ts` — type `PriorityControl { sourceIds; actions[] }` + `priorityControlFrom`. **TOUS**
  les candidats de tête sont parcourus dans l'ordre déterministe, pas seulement le premier (`tied` veut
  dire à égalité, et une composition obtenait déjà deux lignes là où deux faits ex æquo n'en obtenaient
  qu'une). Déduplication sur une forme normalisée du libellé (`actionKey` : casse, espaces, point final),
  **affichage verbatim**, plafond global à **2**. `sourceIds` ne reçoit les ancres d'un candidat que si
  une de ses actions a survécu.
- `ConclusionBlock.tsx` — étiquette bleue (`var(--info)`) « À contrôler en priorité », ou « ensuite » quand
  `headline.consumedFrom === "reserves"`. Une ou deux lignes verbatim, `space-y-1`, « Puis » + minuscule
  ajoutés par le renderer. Corps en **15 px** : une démarche se lit après le verdict, pas à sa place.
- Accord « écart(s) relevé(s) » sur le compte dans la branche arbitrage (un mismatch unique donnait
  « les écarts relevés » au singulier réel).

**Validé à l'écran** (navigateur, six cas) : une action ; deux actions via la composition argiles + PPR
(« Regardez les signes visibles sur le bâti / Puis lisez le règlement de la zone en mairie ») ; deux faits
ex æquo ; dédoublonnage ; bascule « À contrôler ensuite » ; absence de bloc sans action.

### Navigation vers les preuves (`65a523b`, `03ebd4c`)
Deux liens de natures DIFFÉRENTES, à ne pas confondre : `priorityControl` dit **où continuer dans le
dossier** ; une chip « Preuve » mène **à l'endroit où la donnée est démontrée**. Le dossier résume la
preuve, il n'en est pas la source détaillée.

- **Intra-dossier** — chaque ligne de « À contrôler en priorité » renvoie à SA carte (scroll centré,
  focus, liseré bref). L'ancre est portée **par action** (`actions[].anchorId`) : `sourceIds` aplatit
  les ancres de deux candidats de tête en une liste où plus rien ne dit laquelle va à quelle ligne.
  `dossier-anchors.ts` POSE et VISE l'ancre par la même fonction (un `:` d'id de composition casse
  `querySelector`). Le lien n'est actif que vers une carte réellement rendue : `ancresRendues(dossier)`
  descend depuis la section — le serveur SAIT, le client n'a pas à deviner par le DOM.
- **Vers les modules** — `EvidenceTargetKey` nomme le PHÉNOMÈNE (ni la règle ni la carte). Déclarée des
  deux côtés : `targetKey` sur la preuve, `targets` / `evidenceAnchorId(…)` sur la carte. Fragment
  NATIF (`#evidence-risk-flooding`) : le saut marche sans JS, `EvidenceArrival` n'ajoute que focus et
  repère. Sans clé, repli sur le module. **Neuf phénomènes** reliés bout en bout.

## Doctrine (à ne pas re-litiger)
- **Une action = une seule source de vérité** : la carte porte l'`action` (relue, posture-aware) ; la ligne
  bleue la RÉUTILISE mot pour mot, jamais une copie éditoriale.
- **Ce bloc n'est PAS généré par le LLM** : une action doit être exacte, le modèle la paraphraserait.
- **La gate ne compte que les registres GÉNÉRABLES** (invariant écrit sur `shouldGenerateNarrative`). Un bloc
  déterministe n'y participe jamais. Conséquence assumée : un dossier « réserves + contrainte non examinée »
  n'a plus qu'un registre à écrire et ne part plus au modèle.
- **`sourceIds` = ancres de NAVIGATION vers les cartes visibles**, pas la provenance stricte de chaque
  action : une composition est UNE carte qui porte son id + ses `absorbedFactIds`.
- Lexique : un constat ÉTABLI se **contrôle**, une condition non testée se **vérifie**.
- **Pas de bump manuel du hash** pour un champ du plan : `hashPayload` sérialise le plan entier, il
  s'invalide seul. Les versions manuelles ne couvrent que le prompt et le contrat de validation.
- Sonde `probe-conclusion.ts` : **NE PAS lancer** (45 appels LLM facturés, jugé trop coûteux par le porteur).
- **Le catalogue de clés n'accepte que ce qui est relié des DEUX bouts** : une preuve qui la vise ET une
  carte qui la démontre. `evidence-targets.test.ts` le fait échouer sinon — il a d'emblée écarté cinq
  clés (submersion, feu, sécheresse des sols, boisement, historique CatNat) qui avaient une carte mais
  aucune preuve. Elles reviendront AVEC la preuve qui les portera.
- **Un repère posé hors de React se pose en `data-`, jamais en classe** : React réécrit `className` à la
  réconciliation et effaçait le halo dans la milliseconde (vu au MutationObserver).
- **`prefers-reduced-motion` gouverne le défilement ET le halo** — un réglage anti-vertige ne se respecte
  pas à moitié. L'anneau de focus, lui, est ASSUMÉ : Chrome classe un focus programmatique comme
  focus-visible, et il dit où le focus est parti.

## Le harnais `/dev/conclusion` (local, NON commité — décision du porteur)
`src/app/dev/conclusion/page.tsx` : six dossiers fictifs passés dans le VRAI `buildConclusionPlan` et rendus
par le VRAI `ConclusionBlock`, sur une page. Ni Supabase, ni compte payant, ni appel LLM. C'est ce qui a fait
apparaître en trente secondes le défaut d'espacement des deux démarches (invisible dans le HTML seul).
`notFound()` hors développement. **Ne pas le committer** ; il n'est protégé par rien contre un `git add -A`.

## La suite
1. **LE LOT FEU — EN COURS** (le plus gros gain produit). Le risque de feu de forêt déclaré + trajectoire
   sévère traité en **mismatch**, sur le patron du lot D chaleur. Buildable, aucune donnée nouvelle.
   Cf. `project_futuree_feu_mismatch`. Ramènera `risk.wildfire` au catalogue de clés (la carte
   « Conditions favorables au feu » existe déjà côté module, il ne manque que la preuve).
2. **Dette lint** : `npx eslint` sort ~5400 erreurs / 70000 warnings sur le dépôt (préexistant, hors de
   ce chantier). Plus personne ne peut s'en servir comme signal. À traiter à part.
3. **Ordre faits-avant-compositions** dans `rankLeadCandidates` : il ne reflète pas forcément l'ordre des
   cartes à l'écran. Sans conséquence visible tant que le plafond de démarches est à 2 — mais c'est ce
   qui produira un jour une ligne bleue dans un ordre que l'écran contredit.

## Pièges
- `tsconfig.json` exclut `**/*.test.ts` du typecheck : une fixture mal formée ne casse pas tsc, seulement le run.
- eslint **ignore aussi les `*.test.ts`** : un lint vert ne dit rien d'eux.
- Un commentaire JSX `{/* … */}` DANS un ternaire y met deux enfants et casse le build (fait, réparé).
- Chrome **headless** ne reproduit pas tout : mesurer un halo de 2 s après `networkidle` le rate (il est
  déjà retiré). Attendre l'état (`waitForFunction`), pas une durée.
- Le hook pre-commit lance `index:verify` (OK).
- Push direct sur `main`, pas de PR.
