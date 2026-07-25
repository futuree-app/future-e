# Passation — le dossier « En une minute » : une JOURNÉE DE FAUX POSITIFS fermés. Outil de vérification livré.

**Horodatage** : 2026-07-25 (soir) · **Branche** : `main` = `596a2c9` (poussé). **Tree propre** côté code : il ne
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

### Lot FEU (`6157d31`)
Le danger d'incendie DÉCLARÉ (poids ≥ 2) + trajectoire défavorable = **mismatch**, plus une verification :
orientation `arbitration`, carte dans les mismatchs, enjeu nommable par le héros. Calqué tâche par tâche sur
le lot D : `classifyWildfireDanger` (classifieur pur MONO-AXE) → `ruleFeu` (mismatch / silencieux à poids 1)
→ `ruleFeuAmbiant` (non déclaré, verification secondary, `projectKeys` vides) → `composeWildfireExposure`.

- `headlineSubject` = « un environnement peu exposé aux incendies ». MESURÉ : l'indice dit un danger
  météorologique, jamais une probabilité d'incendie. **Copie jamais relue par le porteur.**
- Le kind `climate_comfort` devient **`mismatch_with_action`** : le lot feu a montré que ce patron n'avait
  rien de climatique. Le `patternId` dit toujours quel patron a produit la carte.
- `risk.wildfire` revient au catalogue de clés (la carte existait, la preuve manquait).
- **Jamais vu à l'écran** : 783 tests dont un d'intégration bout en bout, mais aucune lecture sur un dossier
  réel. Une commune du Sud exposée (IFM projeté > 9 j/an) le montrerait.

### LA JOURNÉE DU 25/07 : neuf correctifs, tous nés d'UN dossier à l'écran
Le porteur ouvre Lège-Cap-Ferret **pendant que la commune brûle**, sur un projet qui demande d'être
« à l'abri des risques d'incendie ». Le dossier affiche **« Bonne correspondance »**. Enquête :

1. `flags.wildfire` cherchait « feux de foret » AU PLURIEL ; GASPAR écrit « Feu de forêt » au SINGULIER.
   Le drapeau était faux **pour toutes les communes de France**, depuis toujours (`5674613`). La
   dérivation vivait dans une fonction d'I/O `server-only`, donc intestable : elle est passée dans un
   module PUR (`georisques-flags.ts`) avec les libellés RÉELS de l'API en fixtures.
2. Le moteur ne voyait AUCUN risque recensé : `risquesDeclares` est né (`498a66b`).
3. Le risque recensé était émis en `verification` — donc rangé sous « **au-delà de vos priorités** »
   alors que c'était LA priorité du lecteur. C'est un mismatch, avec un fondement propre
   `declared_hazard` qui dit une reconnaissance officielle au lieu de se déguiser en mesure (`ee13539`).
4. À poids 1 il redevenait muet. Un écart GRADUÉ se tait légitimement ; un risque RECENSÉ est binaire.
   **Aucune exception inventée** : le fait sort en `secondary`, et un mismatch secondaire seul ne bascule
   pas l'orientation (`8b15f5e`). → **Le poids décide si un écart TRANCHE, pas s'il a le droit d'EXISTER.**
5. Copie : antécédent ambigu, barre du héros transposée à tort, titre de carte plus fort que le verdict,
   accord « cette correspondance / ces correspondances » (`03ad249`, `4bda61e`, `9869423`, `596a2c9`).
6. Trouvés ENSUITE par le harnais, sur d'autres communes : la preuve de l'air était PM2,5 en dur (Lille
   affichait une valeur qui ne dépassait rien, sur un polluant dont le constat ne parlait pas), et un
   compromis était compté comme « constat à contrôler » alors qu'il a sa propre section (`b15d2ae`).

**AUCUN de ces neuf défauts n'était visible dans les ~800 tests.** Tous ont été vus à l'écran.

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
- **LE SILENCE EST UN MENSONGE quand il porte sur une priorité.** Un `satisfied` muet sur un risque que
  le lecteur a nommé produit une affirmation invérifiable : il lit « bonne correspondance » sans pouvoir
  savoir sur quoi le produit s'est prononcé. Vaut aussi à poids 1 pour un risque RECENSÉ (binaire), pas
  pour un écart gradué.
- **Le rôle d'un fait suit sa NATURE pour le lecteur, jamais la forme de sa preuve.** Émettre une
  verification faute de mesure chiffrée range un écart au projet sous « au-delà de vos priorités ».
- **AVANT D'AJOUTER UN SIGNAL, MESURER SA FRÉQUENCE.** Un signal qui se déclenche partout ne dit rien.
  Mesuré le 25/07 sur 14 communes : feu recensé 6/14 (discriminant, croisement légitime) ; inondation
  **12/14**, mouvement de terrain **11/12** (universels — les croiser produirait du bruit) ; submersion
  2/12 mais AUCUN critère déclarable. Boisement ≥ 70 % = 9,4 % des communes (discriminant).
- **Un croisement avec une source externe ne vaut que si elle SAIT ce que notre indicateur ne peut pas
  voir.** Vrai pour le feu (indice météo aveugle au massif). Faux pour l'inondation, où notre score est
  gradué là où GASPAR est binaire : le croisement dégraderait le signal.
- **Une bascule verification -> mismatch FAIT PERDRE l'action** que la verification portait (un mismatch n'en
  a pas). Sans composition pour la restaurer, c'est une régression pour le lecteur au nom d'une justesse de
  registre. Vrai pour la chaleur, vrai pour le feu, vrai pour le prochain.
- **`prefers-reduced-motion` gouverne le défilement ET le halo** — un réglage anti-vertige ne se respecte
  pas à moitié. L'anneau de focus, lui, est ASSUMÉ : Chrome classe un focus programmatique comme
  focus-visible, et il dit où le focus est parti.

## LES DEUX HARNAIS (locaux, NON commités — décision du porteur)
**`/dev/dossier` — LA BOUCLE DE VÉRIFICATION, à utiliser en premier.** Un code INSEE + des priorités
(`cle:poids`) et le VRAI dossier apparaît : mêmes données (index, DRIAS, Géorisques), mêmes règles, même
composant. Aucun appel LLM. **Sa table « Ce que chaque règle a conclu » est le cœur de l'outil** : un
critère muet à l'écran y montre son outcome et sa règle. C'est là qu'on aurait lu `satisfied` en deux
secondes le matin du 25/07. Une campagne sur 11 dossiers a trouvé 2 défauts de plus en quelques minutes.
Le bandeau « analyse du logement en cours » est un artefact du mode déterministe, pas un état.

## Le harnais `/dev/conclusion` (local, NON commité)
`src/app/dev/conclusion/page.tsx` : six dossiers fictifs passés dans le VRAI `buildConclusionPlan` et rendus
par le VRAI `ConclusionBlock`, sur une page. Ni Supabase, ni compte payant, ni appel LLM. C'est ce qui a fait
apparaître en trente secondes le défaut d'espacement des deux démarches (invisible dans le HTML seul).
`notFound()` hors développement. **Ne pas le committer** ; il n'est protégé par rien contre un `git add -A`.

## La suite
1. **Le BOISEMENT comme facteur de contexte** (mesuré : ≥ 70 % = 9,4 % des communes, médiane 27 %,
   Lège-Cap-Ferret à 84,7 %). JAMAIS un mismatch : un boisement élevé est un facteur d'exposition, pas
   une reconnaissance de risque — l'affirmer serait le symétrique du bug du 25/07. Table de vérité :
   risque recensé -> mismatch (fait) ; pas recensé + boisement élevé -> `verification` de contexte ET
   **veto à un « priorité satisfaite »** ; ni l'un ni l'autre -> aucun signal. Rend le feu indépendant
   du bon vouloir de GASPAR. ~1 h.
2. **Contrats de données externes** : le bug GASPAR a tenu des mois faute de tests sur les chaînes
   RÉELLES des API. Géorisques est fait ; restent DRIAS, BAN, ADEME/DPE, Eaufrance, BPE. 10-20 valeurs
   figées par source, formes nulles et variantes déjà observées comprises. ~1/2 journée.
3. **Cadrer le reclassement Territoire / Quartier / Logement.** Le module « quartier » est à EXTRAIRE du
   module Logement (l'Autour, l'ÎCU, le confort thermique), pas à créer. Décision structurante à
   prendre : ces données entrent-elles dans le MOTEUR ? Sinon le dossier continuera de les ignorer,
   comme aujourd'hui.
4. **NE PAS étendre le croisement GASPAR aux autres risques** (mesuré, cf. doctrine). Pour l'inondation,
   le levier est le grain ADRESSE (le PPRN y est déjà lu), pas un drapeau communal universel.
5. Sécheresse : le seuil manquant existe (150 j/an = 10,4 % des communes) mais l'axe est PEU
   discriminant (médiane 115) et « 150 jours de sol sec » ne parle pas. Le seuil n'était peut-être pas
   le seul obstacle. Décision produit en attente.

## Pièges
- `tsconfig.json` exclut `**/*.test.ts` du typecheck : une fixture mal formée ne casse pas tsc, seulement le run.
- eslint **ignore aussi les `*.test.ts`** : un lint vert ne dit rien d'eux.
- Un commentaire JSX `{/* … */}` DANS un ternaire y met deux enfants et casse le build (fait, réparé).
- Chrome **headless** ne reproduit pas tout : mesurer un halo de 2 s après `networkidle` le rate (il est
  déjà retiré). Attendre l'état (`waitForFunction`), pas une durée.
- Le hook pre-commit lance `index:verify` (OK).
- Push direct sur `main`, pas de PR.
