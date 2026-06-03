# Trait distinctif dans synthèse + AskFuture — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transmettre `MatchResult.distinctive` (déjà calculé par le moteur) à `/api/comparateur-vie/synthesize` et `/api/comparateur-vie/ask`, et instruire leurs prompts pour qu'ils s'en servent, de façon sélective, à raconter ce qui distingue les territoires.

**Architecture:** Pur transport + prompt. Le champ `distinctive` (mono-trait, relatif au groupe affiché, narratif, hors-score) existe déjà sur `MatchResult` et est rendu sur les cartes. On l'ajoute aux deux payloads sortants du client, aux types `Body` des deux routes, et à leurs prompts SYSTEM. Aucun changement de `buildDistinctive`, du scoring, du tri, ni du fallback déterministe.

**Tech Stack:** Next.js (App Router, voir `node_modules/next/dist/docs/`), TypeScript, Vercel AI SDK (`streamText` pour synthesize), `@anthropic-ai/sdk` (tool use pour ask). Vérification : `npx tsc --noEmit`, `npm run lint`, `curl` sur le serveur dev (port 3000). PAS de runner de test (cf. AGENTS.md) : on n'en introduit pas.

**Doctrine à respecter (rappel) :** jamais de tiret cadratin (virgule / deux points), vouvoiement, aucun chiffre/date/horizon dans les prompts ajoutés, le scoring ne passe jamais par l'IA. `grep -c` renvoie exit 1 sur 0 match : ne pas le chaîner en `&&`.

---

## Fichiers touchés

- Modify: `src/app/api/comparateur-vie/synthesize/route.ts` — type `Body.results[]`, payload `territoires`, prompt SYSTEM.
- Modify: `src/app/api/comparateur-vie/ask/route.ts` — type `Territoire`, `buildContextBlock`, prompt SYSTEM.
- Modify: `src/app/(public)/ou-vivre/OuVivreClient.tsx` — les deux payloads (`/synthesize` ~ligne 187, `/ask` ~ligne 428).

Aucun fichier créé. `src/lib/comparateur-vie.ts` non modifié.

---

### Task 1 : Route synthesize — type, payload, prompt

**Files:**
- Modify: `src/app/api/comparateur-vie/synthesize/route.ts`

- [ ] **Step 1 : Ajouter `distinctive` au type `Body.results[]`**

Remplacer la ligne du type (actuellement) :

```ts
  results?: { nom: string; region?: string | null; reasons?: string[]; tradeoff?: string | null; pressionEco?: string | null; logement?: string | null; littoral?: string | null }[];
```

par :

```ts
  results?: { nom: string; region?: string | null; reasons?: string[]; tradeoff?: string | null; pressionEco?: string | null; logement?: string | null; littoral?: string | null; distinctive?: string | null }[];
```

- [ ] **Step 2 : Ajouter `trait_distinctif` au payload `territoires`**

Dans `payload.territoires = results.map((r) => ({ ... }))`, après la ligne `littoral: r.littoral ?? null,`, ajouter :

```ts
      trait_distinctif: r.distinctive ?? null,
```

- [ ] **Step 3 : Liste blanche — autoriser le commentaire du trait distinctif**

Dans la constante `SYSTEM`, section « NE COMMENTEZ QUE CE QUI A ÉTÉ MESURÉ », repérer la phrase qui énumère les signaux mesurés (« ..."perimetre_geographique" et "orientation_geographique", plus les "raisons" et "compromis" de chaque territoire. »). La remplacer par :

```
Le moteur n'a évalué QUE les critères listés dans "ce_que_l_utilisateur_cherche",
"perimetre_geographique" et "orientation_geographique", plus les "raisons", les
"compromis" et le "trait_distinctif" de chaque territoire. Le champ "projet" est le
texte brut de l'utilisateur : il vous sert à capter le ton et l'intention, il n'est
JAMAIS une liste de critères à vérifier.
```

(Seul ajout : « et le "trait_distinctif" ». Conserver le reste de la section à l'identique.)

- [ ] **Step 4 : Ajouter le bloc doctrine « TRAIT DISTINCTIF »**

Toujours dans `SYSTEM`, juste AVANT la section `FRONTIÈRE AVEC LE RAPPORT`, insérer ce bloc :

```
TRAIT DISTINCTIF (signal mesuré, à manier avec parcimonie)
Chaque territoire peut porter un champ "trait_distinctif" : un signal MESURÉ par le
moteur, relatif aux seules communes affichées (par exemple « la plus pluvieuse des
trois » ou « le meilleur accès aux médecins des trois »). Vous pouvez vous en servir
pour dire ce qui distingue un territoire des autres, même si l'utilisateur ne l'a pas
demandé : c'est une vraie différence, ce n'est pas un critère de classement.
Règles : ne commentez que le contenu exact du champ, n'inventez aucun second trait,
n'en faites pas un critère de tri, présentez-le comme une différence relative entre
les options proposées, n'extrapolez pas au-delà du libellé.
Usage SÉLECTIF : servez-vous d'un trait distinctif seulement quand il aide vraiment à
raconter l'arbitrage. Ne les listez pas, n'en faites pas l'inventaire, ne paraphrasez
pas les cartes. Si un trait n'éclaire rien ou alourdit le récit, ignorez-le. Certains
territoires n'en ont pas : n'en inventez aucun pour eux.
```

- [ ] **Step 5 : Beat différenciation dans STRUCTURE**

Dans `SYSTEM`, section `STRUCTURE`, remplacer la ligne :

```
2. La logique d'ensemble des territoires proposés (l'arbitrage qu'ils représentent).
```

par :

```
2. La logique d'ensemble des territoires proposés (l'arbitrage qu'ils représentent),
   et ce qui distingue les uns des autres quand un trait distinctif le permet. Ne
   lissez pas les territoires : s'ils se ressemblent, dites aussi ce qui les sépare.
```

- [ ] **Step 6 : Vérifier la compilation et l'absence de tiret cadratin**

```bash
npx tsc --noEmit
grep -n "—" src/app/api/comparateur-vie/synthesize/route.ts
```

Attendu : `tsc` ne renvoie aucune erreur. Le `grep` ne renvoie aucune ligne (exit 1, c'est normal : aucun tiret cadratin). Si une ligne `—` apparaît, la corriger.

- [ ] **Step 7 : Commit**

```bash
git add src/app/api/comparateur-vie/synthesize/route.ts
git commit -m "feat(comparateur): trait distinctif transmis à la synthèse (prompt + payload)"
```

---

### Task 2 : Route ask — type, contexte, prompt

**Files:**
- Modify: `src/app/api/comparateur-vie/ask/route.ts`

- [ ] **Step 1 : Ajouter `distinctive` au type `Territoire`**

Dans le type `Territoire`, après la ligne `littoral?: string | null; // signal recul du trait de côte (binaire, sans vitesse)`, ajouter :

```ts
  distinctive?: string | null; // trait distinctif relatif au groupe affiché (narratif, hors-score)
```

- [ ] **Step 2 : Mapper `trait_distinctif` dans `buildContextBlock`**

Dans `buildContextBlock`, dans le `.map((t) => ({ ... }))` qui construit `territoires`, après la ligne `littoral: t.littoral ?? null,`, ajouter :

```ts
    trait_distinctif: t.distinctive ?? null,
```

- [ ] **Step 3 : Ajouter le bloc doctrine au prompt SYSTEM**

Dans la constante `SYSTEM`, juste APRÈS la section `SI UNE NOTE "littoral" EST DONNÉE POUR UN TERRITOIRE` (qui se termine par « ... Si la note est absente, ne l'inventez pas. ») et AVANT `SI LA QUESTION SORT DU SUJET futur•e`, insérer :

```
SI UN "trait_distinctif" EST DONNÉ POUR UN TERRITOIRE
C'est un signal MESURÉ par le moteur, relatif aux seules communes affichées (par
exemple « la plus pluvieuse des trois »). Servez-vous-en surtout quand la question
porte sur les différences entre territoires, les compromis, ou le choix de l'un
plutôt que l'autre : il aide à expliquer ce qui distingue une commune. Ne le déroulez
pas spontanément à chaque réponse. Mêmes règles que le reste : ne commentez que le
contenu exact du champ, n'inventez aucun trait, n'en faites pas un nouveau classement,
un seul compromis.
```

- [ ] **Step 4 : Vérifier la compilation et l'absence de tiret cadratin**

```bash
npx tsc --noEmit
grep -n "—" src/app/api/comparateur-vie/ask/route.ts
```

Attendu : `tsc` sans erreur ; `grep` sans ligne (exit 1 normal).

- [ ] **Step 5 : Commit**

```bash
git add src/app/api/comparateur-vie/ask/route.ts
git commit -m "feat(comparateur): trait distinctif transmis à AskFuture (prompt + contexte)"
```

---

### Task 3 : Client — transport du champ vers les deux routes

**Files:**
- Modify: `src/app/(public)/ou-vivre/OuVivreClient.tsx`

- [ ] **Step 1 : Ajouter `distinctive` au payload `/synthesize`**

Dans l'appel `fetch("/api/comparateur-vie/synthesize", ...)`, dans `results: top.map((r) => ({ ... }))`, après la ligne `littoral: r.littoral, // narratif littoral (recul du trait de côte), firewall préservé`, ajouter :

```ts
              distinctive: r.distinctive, // trait distinctif relatif au groupe (narratif, hors-score), firewall préservé
```

- [ ] **Step 2 : Ajouter `distinctive` au payload `/ask`**

Dans l'appel `fetch("/api/comparateur-vie/ask", ...)`, dans `territoires: top.map((r, i) => ({ ... }))`, après la ligne `littoral: r.littoral, // narratif littoral (recul du trait de côte), firewall préservé`, ajouter :

```ts
              distinctive: r.distinctive, // trait distinctif relatif au groupe (narratif, hors-score), firewall préservé
```

- [ ] **Step 3 : Vérifier compilation + lint**

```bash
npx tsc --noEmit
npm run lint
```

Attendu : aucune erreur de type, lint propre (ou seulement des avertissements préexistants sans rapport avec ces lignes).

- [ ] **Step 4 : Commit**

```bash
git add "src/app/(public)/ou-vivre/OuVivreClient.tsx"
git commit -m "feat(comparateur): le client transmet distinctive à la synthèse et AskFuture"
```

---

### Task 4 : Vérification end-to-end (serveur dev)

**Files:** aucun (vérification manuelle).

- [ ] **Step 1 : Lancer le serveur dev (s'il ne tourne pas déjà)**

```bash
npm run dev
```

Attendu : serveur prêt sur `http://localhost:3000`. (Si déjà lancé, passer.)

- [ ] **Step 2 : Tester `/synthesize` avec des traits distinctifs variés (un présent, un autre, un null)**

```bash
curl -s -N -X POST http://localhost:3000/api/comparateur-vie/synthesize \
  -H 'Content-Type: application/json' \
  -d '{
    "project":"Je cherche un cadre nature pour ma famille, proche des médecins",
    "preferences":[{"key":"nature","weight":70},{"key":"acces_soins","weight":60}],
    "results":[
      {"nom":"Aurillac","region":"Cantal","reasons":["proximité de grands espaces naturels"],"tradeoff":"hivers frais","distinctive":"la plus pluvieuse des trois"},
      {"nom":"Mende","region":"Lozère","reasons":["nature préservée"],"tradeoff":"un peu isolée","distinctive":"la plus proche de grands espaces naturels des trois"},
      {"nom":"Rodez","region":"Aveyron","reasons":["bon accès aux soins"],"tradeoff":null,"distinctive":null}
    ],
    "outcome":{"perfectMatch":false}
  }'
```

Attendu (contrôle manuel du texte streamé) :
- la synthèse peut évoquer ce qui distingue Aurillac (plus pluvieuse) ou Mende (plus proche de la nature) QUAND c'est utile à l'arbitrage ;
- elle n'invente RIEN pour Rodez (distinctive null) ;
- pas de liste mécanique des trois traits, pas de paraphrase des cartes ;
- aucun chiffre, aucune date, pas de tiret cadratin, vouvoiement.

- [ ] **Step 3 : Tester `/ask` sur une question de différence (doit utiliser distinctive)**

```bash
curl -s -X POST http://localhost:3000/api/comparateur-vie/ask \
  -H 'Content-Type: application/json' \
  -d '{
    "question":"Quelle différence entre Aurillac et Mende ?",
    "context":{
      "reformulation":"Un cadre nature pour une famille, proche des soins",
      "criteres":["des grands espaces naturels","un bon accès aux soins"],
      "territoires":[
        {"rang":1,"nom":"Aurillac","region":"Cantal","raisons":["proximité de grands espaces naturels"],"compromis":"hivers frais","distinctive":"la plus pluvieuse des trois"},
        {"rang":2,"nom":"Mende","region":"Lozère","raisons":["nature préservée"],"compromis":"un peu isolée","distinctive":"la plus proche de grands espaces naturels des trois"},
        {"rang":3,"nom":"Rodez","region":"Aveyron","raisons":["bon accès aux soins"],"compromis":null,"distinctive":null}
      ]
    },
    "focus":null
  }'
```

Attendu : JSON `{ "answer": ..., "routesToReport": ..., ... }`. L'`answer` s'appuie sur les traits distinctifs pour distinguer Aurillac de Mende, un seul compromis, pas de chiffre, pas de tiret cadratin.

- [ ] **Step 4 : Tester `/ask` sur une question générique (ne doit PAS dérouler distinctive)**

Note : le compteur gratuit est de 2 questions par cookie ; `curl` sans cookie repart à zéro à chaque appel, donc l'appel passe.

```bash
curl -s -X POST http://localhost:3000/api/comparateur-vie/ask \
  -H 'Content-Type: application/json' \
  -d '{
    "question":"Pourquoi ces territoires ressortent-ils ?",
    "context":{
      "reformulation":"Un cadre nature pour une famille, proche des soins",
      "criteres":["des grands espaces naturels","un bon accès aux soins"],
      "territoires":[
        {"rang":1,"nom":"Aurillac","region":"Cantal","raisons":["proximité de grands espaces naturels"],"compromis":"hivers frais","distinctive":"la plus pluvieuse des trois"},
        {"rang":2,"nom":"Mende","region":"Lozère","raisons":["nature préservée"],"compromis":"un peu isolée","distinctive":"la plus proche de grands espaces naturels des trois"},
        {"rang":3,"nom":"Rodez","region":"Aveyron","raisons":["bon accès aux soins"],"compromis":null,"distinctive":null}
      ]
    },
    "focus":null
  }'
```

Attendu : l'`answer` explique la logique du résultat sans dérouler spontanément les traits distinctifs (ils ne sont pas le sujet de la question).

- [ ] **Step 5 : Contrôle manuel dans l'UI (optionnel mais recommandé)**

Ouvrir `http://localhost:3000/ou-vivre`, lancer une vraie recherche (ex. « un coin nature pour ma famille, pas trop loin d'un hôpital »), vérifier que la synthèse différencie les communes quand c'est pertinent et que l'effet « cartes jumelles » a disparu du texte. Poser une question dans AskFuture sur la différence entre deux territoires.

- [ ] **Step 6 : Si tout est conforme, rien à committer (Task 4 = vérification). Sinon, corriger dans la route concernée et re-committer.**

---

## Self-Review (effectuée)

- **Couverture spec :** transport client (Task 3) ✓ ; types `Body` des 2 routes (Task 1 step 1, Task 2 step 1) ✓ ; payloads (Task 1 step 2, Task 2 step 2) ✓ ; prompt synthèse liste blanche + bloc doctrine + beat différenciation (Task 1 steps 3-5) ✓ ; prompt ask bloc doctrine conditionnel (Task 2 step 3) ✓ ; nuance éditoriale « sélectif, pas de liste, pas de paraphrase » (Task 1 step 4, Task 2 step 3) ✓ ; `buildDistinctive`/scoring/fallback non touchés (absents du plan) ✓ ; vérification tsc/lint/curl/manuel (Task 1 step 6, Task 3 step 3, Task 4) ✓.
- **Placeholders :** aucun ; tout le texte de prompt est fourni mot pour mot.
- **Cohérence des noms :** champ client `distinctive` (sur `MatchResult`) → clé payload `distinctive` → clé prompt/contexte `trait_distinctif` (libellé exposé au LLM). Cohérent entre les 3 fichiers.
