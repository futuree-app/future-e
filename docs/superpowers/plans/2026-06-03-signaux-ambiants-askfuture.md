# Signaux ambiants AskFuture — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Donner à AskFuture comparateur un petit jeu de signaux qualitatifs ambiants par territoire (max 5, contrastés dans le groupe affiché) pour répondre aux « et côté X ? » hors critères de recherche, sans jamais exposer de métrique brute.

**Architecture:** Le moteur déterministe (`comparateur-vie.ts`) calcule, après l'assemblage du groupe affiché et à côté du trait distinctif, un champ `signaux: Record<string,string>` par `MatchResult`. Il réutilise `subScore(key, c)` (favorabilité 0–100, direction déjà gérée), bande en terciles nationaux, filtre les dimensions sans contraste de groupe, garde les 5 plus discriminantes. Le champ transite MatchResult → client → contexte scellé d'AskFuture. Les prompts d'AskFuture (et une règle de synthèse) sont ajustés.

**Tech Stack:** TypeScript, Next.js App Router (routes `api/comparateur-vie/*`), React client `OuVivreClient.tsx`. Vérification : `npx tsc --noEmit` + `npm run lint` + `curl` réels sur le serveur dev (port 3000). PAS de runner de test (cf. AGENTS.md).

**Référence spec :** `docs/superpowers/specs/2026-06-03-signaux-ambiants-askfuture-design.md`

**Pré-requis serveur :** un serveur dev doit tourner sur le port 3000 pour les témoins curl (`npm run dev`). Vérifier : `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/` → `200`. Note : l'index est mémoïsé en mémoire (`indexCache`) ; après une modification de `comparateur-vie.ts`, Next recompile le module en dev, ce qui réinitialise le cache. Si un témoin curl renvoie une donnée incohérente, redémarrer le serveur dev.

---

## File Structure

- **`src/lib/comparateur-vie.ts`** (modifier) : type `MatchResult` (+`signaux`), table `AMBIENT_DIMENSIONS`, helpers `bandIndex` + `assignSignaux`, init `signaux: {}` dans le littéral de résultat, appel `assignSignaux` après le trait distinctif. Cœur de la feature.
- **`src/app/(public)/ou-vivre/OuVivreClient.tsx`** (modifier) : transmettre `r.signaux` dans le payload `territoires` envoyé à `/api/comparateur-vie/ask`.
- **`src/app/api/comparateur-vie/ask/route.ts`** (modifier) : type `Territoire` (+`signaux`), `buildContextBlock` (exposer `signaux`), réécriture des règles de prompt (section 124-131 + nouvelle section signaux + ton).
- **`src/app/api/comparateur-vie/synthesize/route.ts`** (modifier) : une règle de prompt (couverture obligatoire des critères demandés). PAS de signaux ici.

---

## Task 1 : champ `signaux` sur `MatchResult` + initialisation

**Files:**
- Modify: `src/lib/comparateur-vie.ts` (type `MatchResult` ~113-149 ; littéral de résultat ~1029)

- [ ] **Step 1 : Ajouter le champ au type `MatchResult`**

Dans `src/lib/comparateur-vie.ts`, juste après le champ `distinctive: string | null;` (ligne ~140), ajouter :

```ts
  // Signaux ambiants (NARRATIF, hors score, hors tri) : 0 à 5 phrases qualitatives
  // descriptives par territoire (bande nationale, filtrées par contraste de groupe),
  // pour qu'AskFuture réponde aux « et côté X ? » hors critères. clé dimension lisible
  // -> phrase. Jamais de chiffre. cf. assignSignaux + AMBIENT_DIMENSIONS.
  signaux: Record<string, string>;
```

- [ ] **Step 2 : Initialiser `signaux: {}` dans le littéral de résultat**

Dans le `scored = candidates.map(...)`, dans l'objet `result: { ... } as MatchResult`, juste après la ligne `distinctive: null, // renseigné après l'assemblage final (relatif au groupe affiché)` (ligne ~1029), ajouter :

```ts
        signaux: {}, // rempli après l'assemblage final sur le groupe affiché (cf. assignSignaux)
```

- [ ] **Step 3 : Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: aucune erreur (tous les `MatchResult` ont désormais `signaux: {}`).

- [ ] **Step 4 : Commit**

```bash
git add src/lib/comparateur-vie.ts
git commit -m "feat(comparateur): champ signaux sur MatchResult (init vide)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2 : table `AMBIENT_DIMENSIONS` + helpers `bandIndex` / `assignSignaux` + branchement

On ajoute le calcul ET son appel dans la même tâche : un helper non utilisé ferait échouer `npm run lint` (`@typescript-eslint/no-unused-vars`).

**Files:**
- Modify: `src/lib/comparateur-vie.ts` (nouvelle table + helpers près de `subScore`/`buildDistinctive` ~573 ; appel dans `matchProjects` ~1162)

- [ ] **Step 1 : Ajouter la table et les helpers**

Dans `src/lib/comparateur-vie.ts`, après la fonction `subScore` (qui se termine ligne ~573, juste avant la définition suivante), insérer :

```ts
// ── Signaux ambiants (narratif, hors score) ──────────────────────────────────
// Petit jeu de dimensions que la recherche n'a pas forcément classées, pour qu'AskFuture
// réponde aux « et côté X ? » de façon qualitative et comparative. Réutilise subScore
// (favorabilité 0-100, direction gérée par dimension). Bandes = terciles nationaux ;
// phrases DESCRIPTIVES (décrire, pas juger). cf. spec 2026-06-03-signaux-ambiants-askfuture.
type AmbientDim = { id: string; key: PreferenceKey; bands: [string, string, string] };
// bands = [ >=66 favorable, 34-65 intermédiaire, <34 notable ]. Ordre = priorité de départage.
const AMBIENT_DIMENSIONS: AmbientDim[] = [
  { id: "inondation", key: "faible_risque_inondation", bands: ["historique d'inondation plus faible", "historique d'inondation intermédiaire", "historique d'inondation plus marqué"] },
  { id: "chaleur", key: "faible_chaleur", bands: ["étés généralement plus supportables", "étés intermédiaires", "étés généralement plus chauds"] },
  { id: "secheresse", key: "faible_secheresse", bands: ["sols moins exposés à la sécheresse", "exposition intermédiaire à la sécheresse", "sols plus exposés à la sécheresse"] },
  { id: "feu", key: "faible_risque_feu", bands: ["risque de feu plus faible", "risque de feu intermédiaire", "risque de feu plus marqué"] },
  { id: "nature", key: "nature", bands: ["davantage de nature autour", "présence de nature intermédiaire", "moins de nature autour"] },
  { id: "soins", key: "acces_soins", bands: ["accès aux soins plus facile", "accès aux soins intermédiaire", "accès aux soins plus limité"] },
  { id: "emploi", key: "viabilite_emploi", bands: ["bassin d'emploi plus dynamique", "bassin d'emploi intermédiaire", "bassin d'emploi moins dynamique"] },
  { id: "ecoles", key: "acces_ecoles", bands: ["accès aux écoles plus facile", "accès aux écoles intermédiaire", "accès aux écoles plus limité"] },
  { id: "culture", key: "acces_culture", bands: ["offre culturelle plus présente", "offre culturelle intermédiaire", "offre culturelle plus limitée"] },
  { id: "air", key: "air_sain", bands: ["air généralement plus sain", "qualité de l'air intermédiaire", "air généralement moins sain"] },
];
const SIGNAUX_MAX = 5;

function bandIndex(score: number): 0 | 1 | 2 {
  return score >= 66 ? 0 : score < 34 ? 2 : 1;
}

// Calcule les signaux ambiants sur le GROUPE affiché (mutation in place de r.signaux).
// 1) score par (dim, commune) hors critères demandés et hors données absentes ;
// 2) filtre de contraste de groupe (>=2 communes : la dim doit s'étaler sur >=2 bandes) ;
// 3) par commune, classer par |score - moyenne de groupe| (ou |score - 50| si une seule
//    commune), garder 5, mapper la phrase de bande.
function assignSignaux(
  picks: MatchResult[],
  communeByInsee: Map<string, IndexCommune>,
  requestedKeys: Set<PreferenceKey>,
): void {
  const cols = picks.map((r) => communeByInsee.get(r.insee) ?? null);

  // 1. scores alignés sur picks, par dimension (null = critère demandé OU donnée absente)
  const scoresByDim = new Map<string, (number | null)[]>();
  for (const dim of AMBIENT_DIMENSIONS) {
    if (requestedKeys.has(dim.key)) {
      scoresByDim.set(dim.id, picks.map(() => null));
    } else {
      scoresByDim.set(dim.id, cols.map((c) => (c ? subScore(dim.key, c) : null)));
    }
  }

  // 2. filtre de contraste de groupe
  const groupContrast = picks.length >= 2;
  const kept = new Set<string>();
  for (const dim of AMBIENT_DIMENSIONS) {
    const present = scoresByDim.get(dim.id)!.filter((s): s is number => s != null);
    if (present.length === 0) continue;
    if (!groupContrast) {
      kept.add(dim.id);
    } else if (new Set(present.map(bandIndex)).size >= 2) {
      kept.add(dim.id);
    }
  }

  // 3. moyenne de groupe par dimension retenue
  const meanByDim = new Map<string, number>();
  for (const id of kept) {
    const present = scoresByDim.get(id)!.filter((s): s is number => s != null);
    meanByDim.set(id, present.reduce((a, b) => a + b, 0) / present.length);
  }

  // 4. sélection par commune (Array.sort est stable -> égalité = ordre du tableau §1)
  picks.forEach((r, i) => {
    const ranked = AMBIENT_DIMENSIONS
      .filter((dim) => kept.has(dim.id))
      .map((dim) => ({ dim, s: scoresByDim.get(dim.id)![i] }))
      .filter((x): x is { dim: AmbientDim; s: number } => x.s != null)
      .map((x) => ({
        dim: x.dim,
        s: x.s,
        dist: groupContrast ? Math.abs(x.s - (meanByDim.get(x.dim.id) ?? 50)) : Math.abs(x.s - 50),
      }))
      .sort((a, b) => b.dist - a.dist)
      .slice(0, SIGNAUX_MAX);
    const signaux: Record<string, string> = {};
    for (const x of ranked) signaux[x.dim.id] = x.dim.bands[bandIndex(x.s)];
    r.signaux = signaux;
  });
}
```

- [ ] **Step 2 : Brancher l'appel dans `matchProjects`**

Dans `matchProjects`, juste après la boucle qui pose le trait distinctif :

```ts
  for (const r of shownPicks) r.distinctive = distinctiveMap[r.insee] ?? null;
```

ajouter :

```ts
  // Signaux ambiants (narratif, hors score) sur le groupe affiché. requestedKeys = clés
  // EXPLICITEMENT demandées (hors baseline auto) : un critère pesé n'est pas redondé ici,
  // sa raison le porte déjà. byInsee est déjà construit ci-dessus pour le trait distinctif.
  const requestedKeys = new Set<PreferenceKey>(
    parsed.preferences.filter((p) => PREFERENCE_KEYS.includes(p.key)).map((p) => p.key),
  );
  assignSignaux(shownPicks, byInsee, requestedKeys);
```

- [ ] **Step 3 : Vérifier la compilation et le lint**

Run: `npx tsc --noEmit && npm run lint 2>&1 | grep -i "comparateur-vie" || echo "pas d'erreur lint sur comparateur-vie.ts"`
Expected: tsc sans erreur ; aucune ligne d'erreur lint mentionnant `comparateur-vie.ts` (le repo a des erreurs lint préexistantes ailleurs, sans rapport).

- [ ] **Step 4 : Témoin curl — signaux présents, plafonnés, contrastés**

Run :
```bash
curl -s -X POST http://localhost:3000/api/comparateur-vie/match -H 'Content-Type: application/json' \
 -d '{"parsed":{"preferences":[{"key":"climat_doux","weight":2}],"hardConstraints":{}}}' \
 | python3 -c "
import sys,json
d=json.load(sys.stdin)
for c in d.get('results',[])[:3]:
    print(c['nom'], '->', c.get('signaux'))
# témoin contraste : une dim où toutes les communes affichées ont la MÊME bande ne doit
# apparaître dans aucun signaux ; une dim où elles diffèrent peut apparaître.
"
```
Expected : chaque commune affiche un objet `signaux` de 0 à 5 entrées, phrases descriptives (« historique d'inondation plus faible », « accès aux soins plus facile », etc.), aucun chiffre.

- [ ] **Step 5 : Témoin curl — dédoublonnage avec un critère demandé**

Run :
```bash
curl -s -X POST http://localhost:3000/api/comparateur-vie/match -H 'Content-Type: application/json' \
 -d '{"parsed":{"preferences":[{"key":"faible_risque_inondation","weight":3}],"hardConstraints":{}}}' \
 | python3 -c "
import sys,json
d=json.load(sys.stdin)
dup=[c['nom'] for c in d.get('results',[]) if 'inondation' in (c.get('signaux') or {})]
print('communes avec signal inondation alors que c\'est le critère (attendu 0):', len(dup), dup)
"
```
Expected : `0` (la dimension `inondation` n'apparaît jamais dans `signaux` quand `faible_risque_inondation` était le critère ; sa `reason` la porte déjà).

- [ ] **Step 6 : Commit**

```bash
git add src/lib/comparateur-vie.ts
git commit -m "feat(comparateur): signaux ambiants (bande nationale, contraste de groupe, 5 max)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3 : transmettre `signaux` du client au contexte AskFuture

**Files:**
- Modify: `src/app/(public)/ou-vivre/OuVivreClient.tsx` (payload `territoires` du fetch `/ask` ~429-439)

- [ ] **Step 1 : Ajouter `signaux` au mapping du payload ask**

Dans `OuVivreClient.tsx`, dans le `territoires: top.map((r, i) => ({ ... }))` envoyé à `/api/comparateur-vie/ask`, juste après la ligne :

```ts
              distinctive: r.distinctive, // trait distinctif relatif au groupe (narratif, hors-score), firewall préservé
```

ajouter :

```ts
              signaux: r.signaux, // signaux ambiants qualitatifs (hors-score), firewall préservé
```

- [ ] **Step 2 : Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: aucune erreur (`r.signaux` existe sur `MatchResult` depuis Task 1).

- [ ] **Step 3 : Commit**

```bash
git add "src/app/(public)/ou-vivre/OuVivreClient.tsx"
git commit -m "feat(comparateur): transmettre signaux ambiants au contexte AskFuture

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4 : exposer `signaux` dans la route ask + réécrire les règles de prompt

**Files:**
- Modify: `src/app/api/comparateur-vie/ask/route.ts` (type `Territoire` ~42-52 ; `buildContextBlock` ~199-209 ; système prompt section ~124-131)

- [ ] **Step 1 : Ajouter `signaux` au type `Territoire`**

Dans `ask/route.ts`, dans le type `Territoire`, juste après la ligne :

```ts
  distinctive?: string | null; // trait distinctif relatif au groupe affiché (narratif, hors-score)
```

ajouter :

```ts
  signaux?: Record<string, string>; // signaux ambiants qualitatifs (hors-score, hors critères)
```

- [ ] **Step 2 : Exposer `signaux` dans le contexte scellé**

Dans `buildContextBlock`, dans le `.map((t) => ({ ... }))` qui construit `territoires`, juste après la ligne :

```ts
    trait_distinctif: t.distinctive ?? null,
```

ajouter :

```ts
    signaux: t.signaux ?? {},
```

- [ ] **Step 3 : Réécrire la section « SI LA QUESTION DEMANDE LE DÉTAIL DU RAPPORT »**

Remplacer le bloc existant (système prompt, ~124-131) :

```
SI LA QUESTION DEMANDE LE DÉTAIL DU RAPPORT
Si on vous demande un niveau de précision que vous n'avez pas (risque d'inondation
précis, potabilité de l'eau, pollution des sols, jours de canicule, projections
datées, n'importe quel module), mettez routes_to_report=true. Dans answer : dites en
une phrase que cette lecture précise appartient au rapport du territoire, puis
revenez à ce que le comparateur, lui, permet de comprendre (pourquoi ce territoire
ressort, le compromis qu'il représente). Vous ne donnez aucune donnée, vous ne
faites aucune estimation.
```

par :

```
SI LA QUESTION DEMANDE LE DÉTAIL DU RAPPORT
Deux niveaux, ne les confondez pas :
- Signal QUALITATIF présent dans "signaux" d'un territoire (cf. section dédiée) : vous
  POUVEZ répondre, qualitativement et en comparant les communes affichées. Ce n'est
  pas du ressort du rapport.
- Précision FINE, à l'adresse, ou CHIFFRÉE (cartographie de l'aléa, intensité locale,
  valeur exacte, potabilité de l'eau, pollution des sols, projections datées,
  n'importe quel module) : vous ne l'avez pas. Mettez routes_to_report=true, dites en
  une phrase que cette lecture précise appartient au rapport du territoire, puis
  revenez à ce que le comparateur permet de comprendre. Aucune donnée, aucune estimation.
```

- [ ] **Step 4 : Ajouter la section « SI DES signaux SONT DONNÉS »**

Juste après le bloc réécrit à l'étape 3, insérer une nouvelle section :

```
SI DES "signaux" SONT DONNÉS POUR LES TERRITOIRES
Chaque territoire peut porter des "signaux" : de courtes lectures qualitatives sur des
dimensions que la recherche n'a pas forcément classées (inondation, chaleur, sécheresse,
risque de feu, nature, soins, emploi, écoles, culture, air). Ils existent pour répondre
aux questions du type « et côté inondation ? », « laquelle est la plus exposée à la
chaleur ? », même hors critères de recherche.
RÈGLES :
- Qualitatif et relatif UNIQUEMENT. Comparez les communes affichées entre elles (« parmi
  les trois, X semble … que Y »). Jamais un chiffre, jamais un classement nouveau.
- N'utilisez QUE le contenu exact des "signaux". N'inventez jamais une dimension absente,
  ne devinez pas une commune qui n'a pas le signal (son absence n'est pas un verdict).
- Signaux moins favorables AUTORISÉS : vous pouvez dire qu'une commune est plus exposée
  ou moins dotée qu'une autre. Ne lissez pas tout en positif.
- TON : un constat, jamais une alerte, jamais une recommandation. Décrire, pas corriger.
  Acceptable : « Parmi les trois, Narbonne semble plus exposée à la chaleur estivale que
  Quimper. » Jamais : « attention », « évitez », « privilégiez ».
- Restez SÉLECTIF : un seul signal pertinent suffit pour répondre. N'égrenez pas la liste,
  ne transformez pas la réponse en inventaire (sinon vous refaites un rapport).
```

- [ ] **Step 5 : Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 6 : Témoin curl — AskFuture répond « et côté inondation ? » qualitativement**

Run (contexte minimal avec des signaux qui contrastent) :
```bash
curl -s -X POST http://localhost:3000/api/comparateur-vie/ask -H 'Content-Type: application/json' \
 -d '{"question":"et côté inondation ?","context":{"territoires":[
   {"rang":1,"nom":"Quimper","region":"Bretagne","raisons":["proximité de la mer"],"compromis":null,"signaux":{"inondation":"historique d'\''inondation plus faible","soins":"accès aux soins plus facile"}},
   {"rang":2,"nom":"Arles","region":"PACA","raisons":["proximité de la mer"],"compromis":null,"signaux":{"inondation":"historique d'\''inondation plus marqué","chaleur":"étés généralement plus chauds"}}
 ]}}' \
 | python3 -c "import sys,json; d=json.load(sys.stdin); print('answer:', d.get('answer','')); print('routes_to_report:', d.get('routes_to_report'))"
```
Expected : une réponse qualitative et comparative (Arles plus exposée que Quimper), SANS chiffre, sans esquive systématique vers le rapport ; ton constat (ni « attention » ni « évitez »).

- [ ] **Step 7 : Témoin curl — dimension hors signaux → renvoi honnête au rapport**

Run :
```bash
curl -s -X POST http://localhost:3000/api/comparateur-vie/ask -H 'Content-Type: application/json' \
 -d '{"question":"quelle est la potabilité de l'\''eau exactement ?","context":{"territoires":[
   {"rang":1,"nom":"Quimper","region":"Bretagne","raisons":["proximité de la mer"],"compromis":null,"signaux":{"inondation":"historique d'\''inondation plus faible"}}
 ]}}' \
 | python3 -c "import sys,json; d=json.load(sys.stdin); print('answer:', d.get('answer','')); print('routes_to_report:', d.get('routes_to_report'))"
```
Expected : `routes_to_report` vrai (ou renvoi clair au rapport dans `answer`), aucune invention de donnée.

- [ ] **Step 8 : Commit**

```bash
git add src/app/api/comparateur-vie/ask/route.ts
git commit -m "feat(comparateur): AskFuture mobilise les signaux ambiants (qualitatif, ton constat)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5 : synthèse — couverture obligatoire des critères demandés

Pas de signaux ambiants dans la synthèse. Seule l'exception du §6 de la spec : tout critère explicitement demandé et utilisé au classement doit apparaître au moins une fois.

**Files:**
- Modify: `src/app/api/comparateur-vie/synthesize/route.ts` (système prompt, après le bloc « NE COMMENTEZ QUE CE QUI A ÉTÉ MESURÉ » ~78)

- [ ] **Step 1 : Ajouter le bloc de couverture obligatoire**

Dans `synthesize/route.ts`, juste après la dernière ligne du bloc « NE COMMENTEZ QUE CE QUI A ÉTÉ MESURÉ » (la ligne se terminant par « On n'invente pas un verdict sur une donnée qui n'existe pas. », ~78), insérer une ligne vide puis :

```
CRITÈRES EXPLICITEMENT DEMANDÉS (couverture obligatoire)
Tout critère listé dans "ce_que_l_utilisateur_cherche" a été demandé par l'utilisateur ET
utilisé au classement. Chacun doit apparaître AU MOINS UNE FOIS dans votre récit, au moins
qualitativement (vous pouvez en regrouper plusieurs dans une même phrase). Ne laissez jamais
un critère demandé totalement absent du texte : l'utilisateur l'a formulé, il doit se
retrouver dans la lecture. Cela vaut surtout pour les critères concrets faciles à oublier
(par exemple l'accès aux écoles ou à la culture). Cette règle n'autorise PAS à inventer un
verdict sur une dimension non mesurée : elle impose seulement de ne pas omettre ce qui a été
demandé et mesuré.
```

- [ ] **Step 2 : Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 3 : Témoin curl — un critère concret demandé apparaît dans la synthèse**

Run (synthèse en streaming texte ; on lit le flux entier) :
```bash
curl -s -N -X POST http://localhost:3000/api/comparateur-vie/synthesize -H 'Content-Type: application/json' \
 -d '{"project":"je cherche une ville avec un bon accès à la culture","reformulation":"accès à la culture","preferences":[{"key":"acces_culture","weight":3}],"results":[
   {"nom":"Nantes","region":"Pays de la Loire","reasons":["offre culturelle riche"],"tradeoff":null},
   {"nom":"Rennes","region":"Bretagne","reasons":["offre culturelle riche"],"tradeoff":null}
 ],"outcome":{"perfectMatch":true}}' \
 | python3 -c "import sys; t=sys.stdin.read().lower(); print('mentionne la culture:', 'cultur' in t); print(t[:400])"
```
Expected : `mentionne la culture: True` (le critère demandé n'est pas omis du récit).

- [ ] **Step 4 : Commit**

```bash
git add src/app/api/comparateur-vie/synthesize/route.ts
git commit -m "feat(comparateur): synthese couvre toujours les criteres explicitement demandes

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6 : vérification finale + intégration

**Files:** aucun (vérification transversale)

- [ ] **Step 1 : tsc + lint global**

Run: `npx tsc --noEmit && npm run lint 2>&1 | tail -3`
Expected: tsc sans erreur. Lint : les problèmes préexistants du repo subsistent (theme provider, react-hooks dans des `.tsx` sans rapport) ; aucune NOUVELLE erreur sur les 4 fichiers touchés. Confirmer en filtrant :
`npm run lint 2>&1 | grep -E "comparateur-vie\.ts|ask/route\.ts|synthesize/route\.ts|OuVivreClient\.tsx" || echo "aucune erreur lint sur les fichiers touchés"`

- [ ] **Step 2 : Témoin transversal — aucun chiffre dans une réponse AskFuture mobilisant un signal**

Run :
```bash
curl -s -X POST http://localhost:3000/api/comparateur-vie/ask -H 'Content-Type: application/json' \
 -d '{"question":"et la qualité de l'\''air ?","context":{"territoires":[
   {"rang":1,"nom":"Quimper","region":"Bretagne","raisons":["proximité de la mer"],"compromis":null,"signaux":{"air":"air généralement plus sain"}},
   {"rang":2,"nom":"Lyon","region":"Auvergne-Rhône-Alpes","raisons":["dynamisme"],"compromis":null,"signaux":{"air":"air généralement moins sain"}}
 ]}}' \
 | python3 -c "import sys,json,re; a=json.load(sys.stdin).get('answer',''); print('answer:', a); print('contient un chiffre:', bool(re.search(r'[0-9]', a)))"
```
Expected : réponse comparative qualitative ; `contient un chiffre: False`.

- [ ] **Step 3 : Vérifier l'état git (tout committé)**

Run: `git status --short`
Expected: aucune modification non committée sur les fichiers source.

- [ ] **Step 4 : finishing-a-development-branch**

Invoquer la skill `superpowers:finishing-a-development-branch` pour présenter les options (merge `--ff-only` sur `main` + push, sur « push sur main » du porteur). Ne pas merger sans le feu vert explicite.

---

## Self-review (rempli par l'auteur du plan)

- **Couverture spec :** §1 dimensions → Task 2 table (10 dims, proximite_mer absent ✓). §2 bandes/phrases → Task 2 `bandIndex` + table. §3 dédoublonnage → Task 2 `requestedKeys` + témoin Task 2 Step 5. §4 contraste de groupe + 5 max + cas mono-commune → Task 2 `assignSignaux`. §5 où calculé → Task 2 branchement après distinctive. §6 ask (contexte + 2 sections prompt + ton + négatifs) → Task 4 ; synthèse exception → Task 5. Vérification §1-6 → Tasks 2/4/5/6.
- **Placeholders :** aucun TODO/TBD ; tout le code est explicite.
- **Cohérence des types :** `signaux: Record<string,string>` identique partout (MatchResult, Territoire, payload client) ; `assignSignaux(picks, communeByInsee, requestedKeys)` appelé avec `shownPicks`, `byInsee`, `requestedKeys` tous définis avant l'appel ; `bandIndex` utilisé dans `assignSignaux` et la sélection ; `subScore(key, c)` signature respectée.
