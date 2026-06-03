# Trait distinctif → moment de différenciation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Donner à la synthèse (et confirmer dans AskFuture) un moment de différenciation explicite fondé sur les traits distinctifs, distinct du « pourquoi les communes ressortent », pour résoudre les « cartes jumelles ».

**Architecture:** Le champ `MatchResult.distinctive` est déjà calculé et transmis. Le travail est surtout du prompt engineering (synthèse : STRUCTURE + section TRAIT DISTINCTIF ; AskFuture : renfort léger), plus un fix de cohérence dans `buildDistinctive` (trait de taille sur l'UU, pas la commune).

**Tech Stack:** TypeScript (moteur + routes Next.js). Vérification : `npx tsc --noEmit` + `npm run lint` + `curl` réels (port 3000). PAS de runner de test (cf. AGENTS.md). Aucune donnée nouvelle.

**Référence spec :** `docs/superpowers/specs/2026-06-03-distinctive-synthese-design.md`

**Pré-requis serveur :** dev sur port 3000. Après modif d'une route ou du moteur, Next recompile ; pas de patch d'index ici.

---

## File Structure

- **`src/lib/comparateur-vie.ts`** : `buildDistinctive` — candidats « la plus grande/petite ville » sur `tailleVille` au lieu de `c.population`.
- **`src/app/api/comparateur-vie/synthesize/route.ts`** : prompt SYSTEM — STRUCTURE (point 2) + section TRAIT DISTINCTIF.
- **`src/app/api/comparateur-vie/ask/route.ts`** : prompt SYSTEM — section « SI UN trait_distinctif EST DONNÉ ».

---

## Task 1 : cohérence du trait de taille (UU)

**Files:** Modify `src/lib/comparateur-vie.ts`

- [ ] **Step 1 : `buildDistinctive` — taille sur `tailleVille`**

Dans `buildDistinctive`, remplacer les deux candidats de taille :
```ts
    { tier: 2, value: (c) => c.population ?? null, dir: "min", scale: 1, mode: "ratio", label: "la plus petite ville" },
    { tier: 2, value: (c) => c.population ?? null, dir: "max", scale: 1, mode: "ratio", label: "la plus grande ville" },
```
par :
```ts
    { tier: 2, value: (c) => tailleVille(c), dir: "min", scale: 1, mode: "ratio", label: "la plus petite ville" },
    { tier: 2, value: (c) => tailleVille(c), dir: "max", scale: 1, mode: "ratio", label: "la plus grande ville" },
```

- [ ] **Step 2 : tsc + lint**

Run: `npx tsc --noEmit && npm run lint 2>&1 | grep -i "comparateur-vie" || echo "pas d'erreur lint sur comparateur-vie.ts"`
Expected: tsc sans erreur ; aucune ligne lint sur `comparateur-vie.ts`.

- [ ] **Step 3 : Témoin — le trait de taille reflète l'agglomération**

Run :
```bash
curl -s -X POST http://localhost:3000/api/comparateur-vie/match -H 'Content-Type: application/json' \
 -d '{"parsed":{"preferences":[{"key":"acces_soins","weight":3},{"key":"proximite_mer","weight":2}],"hardConstraints":{}}}' \
 | python3 -c "import sys,json; d=json.load(sys.stdin); [print(' ',c['nom'],'| distinctive:',repr(c.get('distinctive'))) for c in d.get('results',[])[:3]]"
```
Expected : si un trait « la plus grande/petite ville » apparaît, il correspond à la taille d'**agglomération** (une commune de banlieue d'une grande UU n'est plus étiquetée « la plus petite ville » sur sa seule pop communale). Les autres traits (montagne, emploi, climat…) restent inchangés.

- [ ] **Step 4 : Commit**

```bash
git add src/lib/comparateur-vie.ts
git commit -m "fix(comparateur): trait distinctif de taille sur l'UU (coherence chantier C)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2 : synthèse — moment de différenciation explicite

**Files:** Modify `src/app/api/comparateur-vie/synthesize/route.ts`

- [ ] **Step 1 : STRUCTURE — point 2 avec moment de différenciation**

Remplacer :
```
2. La logique d'ensemble des territoires proposés (l'arbitrage qu'ils représentent),
   et ce qui distingue les uns des autres quand un trait distinctif le permet. Ne
   lissez pas les territoires : s'ils se ressemblent, dites aussi ce qui les sépare.
```
par :
```
2. La logique d'ensemble (l'arbitrage que les territoires représentent), PUIS un moment de
   différenciation explicite : dès que deux communes affichées ou plus portent un trait
   distinctif, consacrez une phrase à ce qui les SÉPARE (cf. TRAIT DISTINCTIF). Ne lissez
   jamais les territoires ; si moins de deux traits sont fournis, dites simplement que les
   profils sont proches.
```

- [ ] **Step 2 : Réécrire la section TRAIT DISTINCTIF**

Remplacer le bloc entier :
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
par :
```
TRAIT DISTINCTIF (le moment de différenciation)
Chaque territoire peut porter un champ "trait_distinctif" : un signal MESURÉ par le moteur,
relatif aux seules communes affichées (par exemple « la plus proche de la montagne des trois »,
« le bassin d'emploi le plus dynamique des trois »). Il sert à raconter CE QUI SÉPARE les
options, distinct des critères demandés.

Hiérarchie à respecter absolument :
- les critères demandés expliquent POURQUOI les communes ressortent (le score) ;
- les traits distinctifs expliquent CE QUI LES DIFFÉRENCIE ;
- un trait distinctif PEUT porter sur une dimension NON demandée : c'est une part importante de
  sa valeur (révéler des différences réelles qui n'ont pas pesé sur le score) ;
- il ne devient JAMAIS une justification du classement ni un avantage absolu ;
- il reste une DIFFÉRENCE RELATIVE entre les propositions affichées.

Quand au moins DEUX communes affichées portent un trait distinctif, consacrez UNE phrase à les
différencier. N'utilisez QUE les libellés fournis, sans extrapoler ni inventer. Une commune SANS
trait : dites simplement qu'elle ne se détache pas nettement, ne lui fabriquez aucun axe. Si moins
de deux traits sont fournis, dites honnêtement que les profils sont proches, sans forcer une
différence. Restez sobre : une phrase, jamais l'inventaire des cartes.

✔ « Aurillac est la plus proche de la montagne, tandis qu'Ussel propose un bassin de vie plus
compact. » / « Quimper présente les étés les plus supportables des options, tandis que Narbonne
bénéficie d'un ensoleillement plus marqué. »
✘ « Aurillac est meilleure car elle est proche de la montagne. » / « Quimper est préférable grâce
à son climat. »
```

- [ ] **Step 3 : tsc**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 4 : Témoin — moment de différenciation cohérent avec les cartes**

Run (on lit d'abord les traits du /match, puis on vérifie qu'ils apparaissent dans la synthèse) :
```bash
BODY='{"project":"un bon bassin d emploi et de la nature","reformulation":"emploi et nature","preferences":[{"key":"viabilite_emploi","weight":3},{"key":"nature","weight":2}],"results":[
   {"nom":"Tencin","region":"Auvergne-Rhône-Alpes","reasons":["bassin d emploi diversifié"],"tradeoff":null,"distinctive":"la plus proche de la montagne des trois"},
   {"nom":"La Broque","region":"Grand Est","reasons":["forêts et espaces naturels à proximité"],"tradeoff":null,"distinctive":"les étés les plus supportables des trois"},
   {"nom":"Saint-Médard-en-Jalles","region":"Nouvelle-Aquitaine","reasons":["bassin d emploi diversifié"],"tradeoff":null,"distinctive":"la plus grande ville des trois"}
 ],"outcome":{"perfectMatch":true}}'
curl -s -N -X POST http://localhost:3000/api/comparateur-vie/synthesize -H 'Content-Type: application/json' -d "$BODY" \
 | python3 -c "
import sys
t=sys.stdin.read(); low=t.lower()
print(t)
print('--- contrôle ---')
print('montagne:', 'montagne' in low, '| étés/supportable:', ('été' in low or 'supportab' in low), '| grande ville:', ('grande ville' in low or 'plus grande' in low))
print('avantage absolu (à éviter):', ('meilleure' in low or 'préférable' in low))
import re; print('chiffre:', bool(re.search(r'[0-9]', t)))
"
```
Expected : la synthèse comporte une phrase de différenciation nommant les traits réels (montagne / étés supportables / grande ville) ; pas de « meilleure »/« préférable » ; aucun chiffre.

- [ ] **Step 5 : Témoin — profils proches (moins de 2 traits)**

Run :
```bash
BODY='{"project":"un climat doux","reformulation":"climat doux","preferences":[{"key":"douceur_climat","weight":3}],"results":[
   {"nom":"Vannes","region":"Bretagne","reasons":["climat doux, hivers tempérés"],"tradeoff":null,"distinctive":null},
   {"nom":"Lorient","region":"Bretagne","reasons":["climat doux, hivers tempérés"],"tradeoff":null,"distinctive":null}
 ],"outcome":{"perfectMatch":true}}'
curl -s -N -X POST http://localhost:3000/api/comparateur-vie/synthesize -H 'Content-Type: application/json' -d "$BODY" \
 | python3 -c "import sys; t=sys.stdin.read().lower(); print('profils proches / se ressemblent:', ('proche' in t or 'ressembl' in t or 'similaire' in t or 'comparable' in t)); print(t[:400])"
```
Expected : la synthèse ne fabrique aucune différence ; elle dit que les profils sont proches (aucun trait inventé pour Vannes/Lorient).

- [ ] **Step 6 : Commit**

```bash
git add src/app/api/comparateur-vie/synthesize/route.ts
git commit -m "feat(comparateur): synthese, moment de differenciation explicite (traits distinctifs)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3 : AskFuture — renfort de la doctrine de différenciation

**Files:** Modify `src/app/api/comparateur-vie/ask/route.ts`

- [ ] **Step 1 : Réécrire la section « SI UN trait_distinctif EST DONNÉ »**

Remplacer :
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
par :
```
SI UN "trait_distinctif" EST DONNÉ POUR UN TERRITOIRE
C'est un signal MESURÉ par le moteur, relatif aux seules communes affichées (par exemple
« la plus pluvieuse des trois »). Il dit ce qui DIFFÉRENCIE les options, pas pourquoi elles
ressortent. Servez-vous-en quand la question porte sur les différences, les compromis, ou le
choix de l'une plutôt que l'autre. Règles : ne commentez que le contenu exact du champ ;
présentez-le comme une DIFFÉRENCE RELATIVE entre les options affichées, JAMAIS un avantage
absolu (« la plus proche de la montagne », jamais « meilleure grâce à ») ni une raison de
classement ; un trait peut porter sur une dimension non demandée ; n'inventez aucun trait, n'en
faites pas un nouveau classement. Ne le déroulez pas à chaque réponse.
```

- [ ] **Step 2 : tsc**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 3 : Témoin — AskFuture « qu'est-ce qui les distingue ? »**

Run :
```bash
curl -s -X POST http://localhost:3000/api/comparateur-vie/ask -H 'Content-Type: application/json' \
 -d '{"question":"qu est-ce qui distingue ces communes ?","context":{"territoires":[
   {"rang":1,"nom":"Aurillac","region":"Auvergne-Rhône-Alpes","raisons":["bassin d emploi diversifié"],"compromis":null,"distinctive":"la plus proche de la montagne des trois"},
   {"rang":2,"nom":"Ussel","region":"Nouvelle-Aquitaine","raisons":["bassin d emploi diversifié"],"compromis":null,"distinctive":"la plus petite ville des trois"}
 ]}}' \
 | python3 -c "import sys,json,re; a=json.load(sys.stdin).get('answer',''); print('answer:', a); print('avantage absolu (à éviter):', ('meilleure' in a.lower() or 'préférable' in a.lower())); print('chiffre:', bool(re.search(r'[0-9]', a)))"
```
Expected : réponse adossée aux traits fournis (montagne / petite ville), en différences relatives, sans « meilleure »/« préférable », sans chiffre.

- [ ] **Step 4 : Commit**

```bash
git add src/app/api/comparateur-vie/ask/route.ts
git commit -m "feat(comparateur): AskFuture, trait distinctif en difference relative (jamais avantage absolu)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4 : vérification finale + intégration

**Files:** aucun

- [ ] **Step 1 : tsc + lint global**

Run: `npx tsc --noEmit && npm run lint 2>&1 | grep -E "comparateur-vie\.ts|synthesize/route\.ts|ask/route\.ts" && echo "(erreurs ci-dessus)" || echo "aucune erreur lint sur les fichiers touchés"`
Expected: tsc sans erreur ; aucune nouvelle erreur lint sur les fichiers touchés.

- [ ] **Step 2 : Témoin de cohérence cartes ↔ synthèse (recherche réelle)**

Run (recherche réelle : on compare les traits du /match aux traits cités par la synthèse) :
```bash
P='{"preferences":[{"key":"acces_soins","weight":3},{"key":"proximite_mer","weight":2}],"hardConstraints":{}}'
echo "--- traits /match ---"
curl -s -X POST http://localhost:3000/api/comparateur-vie/match -H 'Content-Type: application/json' -d "{\"parsed\":$P}" \
 | python3 -c "import sys,json; d=json.load(sys.stdin); [print(' ',c['nom'],'->',repr(c.get('distinctive'))) for c in d.get('results',[])[:3]]"
```
Expected : noter les traits ; ils doivent ensuite se retrouver dans la synthèse réelle de la même recherche (cohérence cartes ↔ synthèse), sans avantage absolu ni chiffre.

- [ ] **Step 3 : État git** — Run: `git status --short` — Expected: aucun fichier source non committé.

- [ ] **Step 4 : finishing-a-development-branch** — Invoquer `superpowers:finishing-a-development-branch`. Ne pas merger sur `main` sans « push sur main ».

---

## Self-review (auteur du plan)

- **Couverture spec :** fix moteur taille→UU → Task 1. synthèse STRUCTURE + section TRAIT DISTINCTIF (hiérarchie, hors-critère autorisé, jamais avantage absolu, commune sans trait, profils proches, exemples ✔/✘) → Task 2. AskFuture renfort → Task 3. vérification (cohérence, profils proches, pas d'avantage absolu, pas de chiffre) → Tasks 1/2/3/4.
- **Placeholders :** aucun ; tous les blocs de prompt sont fournis en entier ; les témoins sont des commandes exactes.
- **Cohérence des types :** seul changement de code TS = `c.population` → `tailleVille(c)` dans `buildDistinctive` (`tailleVille` défini au chantier C, signature `(c: IndexCommune) => number | null`, compatible avec `value: (c) => number | null`). Le reste est du texte de prompt. Aucune nouvelle clé, aucun nouveau champ.
