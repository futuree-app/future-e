# Chantier C — taille de ville / isolement sur l'UU — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Faire basculer la taille de ville / l'isolement / le bassin de vie de la commune vers l'unité urbaine (UU), et ajouter deux préférences graduées de taille (`eviter_grandes_villes`, `prefere_grande_ville`), le `cadre_calme` restant local.

**Architecture:** Une table `uu → population` est calculée au chargement de l'index (somme de `c.population` par `c.uu`, mémoïsée). Un helper `tailleVille(c)` renvoie la pop d'UU si la commune est dans une UU, sinon sa pop communale. `eviter_isolement`, `sizeRelativeTo`/`communeSize` et deux nouvelles clés s'appuient dessus. La « cloche » petite/moyenne ville émerge de la composition plancher (isolement) + plafond (eviter_grandes_villes).

**Tech Stack:** TypeScript (moteur `comparateur-vie.ts` + parse route). Vérification : `npx tsc --noEmit` + `npm run lint` + `curl` réels (port 3000) + témoins Python sur l'index. PAS de runner de test (cf. AGENTS.md). Pas de regénération de l'index ni de script de données (la pop d'UU est dérivée au chargement).

**Référence spec :** `docs/superpowers/specs/2026-06-03-taille-ville-uu-design.md`

**Pré-requis serveur :** dev sur port 3000. Après une modification de `comparateur-vie.ts`, Next recompile et réinitialise `indexCache`/`uuPopCache` ; pas de patch d'index ici donc pas de piège de cache de données.

---

## File Structure

- **`src/lib/comparateur-vie.ts`** : `uuPopCache` + `buildUuPop` (appelé dans `loadIndex`) + `tailleVille` ; `eviter_isolement` (subScore + reasons) ; courbes `GRANDE_VILLE_MIN`/`MAX` + 2 clés (`PREFERENCE_KEYS`, `subScore`, `REASON_POS`/`NEG`) ; `passesHard` (communeSize → `tailleVille`) ; résolution `sizeRelativeTo` (réf en pop d'UU).
- **`src/lib/comparateur-labels.ts`** : `PREFERENCE_LABELS` (+2), `PREFERENCE_INTERPRETATIONS` (+2).
- **`src/app/api/comparateur-vie/parse/route.ts`** : descriptions + règles de routage taille.

Décision : on **conserve le nom de champ `communeSize`** (autorisé par la spec) en changeant sa sémantique (évalué via `tailleVille`), pour éviter un renommage transverse (type `ParsedProject`, schéma parse, client). Documenté par commentaire.

---

## Task 1 : table pop d'UU + `tailleVille` + isolement sur l'UU

**Files:** Modify `src/lib/comparateur-vie.ts`

- [ ] **Step 1 : Déclarer le cache pop d'UU**

Juste après la ligne `let nameCache: Map<string, IndexCommune> | null = null;` (~297), ajouter :

```ts
// Population d'unité urbaine = somme des populations communales par code UU. Dérivée au
// chargement de l'index (pas de source externe, pas de regénération de l'index). Sert à
// mesurer la TAILLE D'AGGLOMÉRATION (isolement, taille de ville) plutôt que la commune seule.
let uuPopCache: Map<string, number> | null = null;
function buildUuPop(communes: IndexCommune[]): void {
  const m = new Map<string, number>();
  for (const c of communes) {
    if (c.uu && c.population != null) m.set(c.uu, (m.get(c.uu) ?? 0) + c.population);
  }
  uuPopCache = m;
}
// Taille du « bassin de ville » : pop d'UU si la commune est dans une UU, sinon sa pop
// communale (une commune hors UU est son propre bassin). cf. spec chantier C.
function tailleVille(c: IndexCommune): number | null {
  if (c.uu && uuPopCache) {
    const p = uuPopCache.get(c.uu);
    if (p != null) return p;
  }
  return c.population ?? null;
}
```

- [ ] **Step 2 : Construire la table dans `loadIndex`**

Dans `loadIndex`, remplacer :
```ts
  indexCache = parsed.communes;
  return indexCache;
```
par :
```ts
  indexCache = parsed.communes;
  buildUuPop(indexCache);
  return indexCache;
```

- [ ] **Step 3 : `eviter_isolement` sur `tailleVille`**

Dans `subScore`, remplacer :
```ts
    case "eviter_isolement":
      return lerp(ISOLEMENT, c.population);
```
par :
```ts
    case "eviter_isolement":
      return lerp(ISOLEMENT, tailleVille(c)); // taille d'agglomération, pas la commune seule
```

- [ ] **Step 4 : Reasons d'isolement reformulées (bassin de vie)**

Dans `REASON_POS`, remplacer :
```ts
  eviter_isolement: (c) => `vie locale réelle (${(c.population ?? 0).toLocaleString("fr-FR")} hab.)`,
```
par :
```ts
  eviter_isolement: (c) => `bassin de vie de ${(tailleVille(c) ?? 0).toLocaleString("fr-FR")} hab.`,
```

Dans `REASON_NEG`, remplacer :
```ts
  eviter_isolement: "commune de petite taille",
```
par :
```ts
  eviter_isolement: "bassin de vie réduit, plus isolé",
```

- [ ] **Step 5 : tsc + lint**

Run: `npx tsc --noEmit && npm run lint 2>&1 | grep -i "comparateur-vie" || echo "pas d'erreur lint sur comparateur-vie.ts"`
Expected: tsc sans erreur ; aucune ligne lint sur `comparateur-vie.ts`.

- [ ] **Step 6 : Témoin data — pop d'UU et tailleVille**

Run :
```bash
python3 -c "
import json, collections
idx=json.load(open('data/comparateur-index.json'))['communes']
pop=collections.defaultdict(int)
for c in idx:
    if c.get('uu') and c.get('population'): pop[c['uu']]+=c['population']
by={c['insee']:c for c in idx}
lyon_uu=by['69381']['uu']  # Lyon 1er -> UU de Lyon
print('UU Lyon', lyon_uu, '-> pop UU', pop[lyon_uu])
# une petite commune dans l'UU de Lyon : tailleVille = pop UU >> pop communale
small=[c for c in idx if c.get('uu')==lyon_uu and (c.get('population') or 0)<5000][:3]
for c in small:
    print(' ', c['nom'], 'pop commune', c['population'], '-> tailleVille', pop[c['uu']])
# une commune hors UU : tailleVille = pop communale
iso=[c for c in idx if not c.get('uu') and (c.get('population') or 0)<2000][:2]
for c in iso:
    print(' hors UU:', c['nom'], 'pop', c['population'])
"
```
Expected : l'UU de Lyon affiche une pop d'agglo ≫ 1 M ; les petites communes de cette UU ont `tailleVille` = pop d'UU (donc non isolées) ; les communes hors UU gardent leur pop communale.

- [ ] **Step 7 : Commit**

```bash
git add src/lib/comparateur-vie.ts
git commit -m "feat(comparateur): isolement et bassin de vie sur l'unite urbaine (tailleVille)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2 : préférences graduées de taille (`eviter_grandes_villes`, `prefere_grande_ville`)

**Files:** Modify `src/lib/comparateur-vie.ts`, `src/lib/comparateur-labels.ts`

- [ ] **Step 1 : Courbes de taille d'UU**

Juste après la ligne `const ISOLEMENT: Anchors = [...]` (~207), ajouter :

```ts
// Taille d'UU -> préférence. Bornes éditoriales (cf. spec) : village <2k, petite 2-25k,
// moyenne 25-100k, grande 100-500k, métropole >500k. GRANDE_VILLE_MIN décroît (favorise le
// petit), GRANDE_VILLE_MAX croît (favorise le grand). La cloche petite/moyenne émerge de la
// composition avec eviter_isolement (plancher).
const GRANDE_VILLE_MIN: Anchors = [[0, 100], [2000, 100], [25000, 85], [100000, 55], [300000, 25], [500000, 12], [1000000, 3]];
const GRANDE_VILLE_MAX: Anchors = [[0, 0], [25000, 10], [100000, 40], [300000, 70], [500000, 85], [1000000, 97], [2000000, 100]];
```

- [ ] **Step 2 : Ajouter les deux clés à `PREFERENCE_KEYS`**

Remplacer :
```ts
  "acces_transports",
] as const;
```
par :
```ts
  "acces_transports",
  // Taille de ville (UU). eviter_grandes_villes = préférer le petit (cloche petite/moyenne ville
  // avec le plancher eviter_isolement) ; prefere_grande_ville = préférer le grand. cf. chantier C.
  "eviter_grandes_villes",
  "prefere_grande_ville",
] as const;
```

- [ ] **Step 3 : Ajouter les deux cas à `subScore`**

Juste après le cas `acces_transports` (`return c.transport?.desserte ?? null;`), ajouter :

```ts
    case "eviter_grandes_villes":
      return lerp(GRANDE_VILLE_MIN, tailleVille(c));
    case "prefere_grande_ville":
      return lerp(GRANDE_VILLE_MAX, tailleVille(c));
```

- [ ] **Step 4 : `REASON_POS`** (après `acces_transports: "bien reliée par le train",`)

```ts
  eviter_grandes_villes: "ville à taille humaine",
  prefere_grande_ville: "grande ville animée",
```

- [ ] **Step 5 : `REASON_NEG`** (après `acces_transports: "desserte ferroviaire limitée",`)

```ts
  eviter_grandes_villes: "grande agglomération",
  prefere_grande_ville: "petit bassin urbain",
```

- [ ] **Step 6 : Libellés (`comparateur-labels.ts`, `PREFERENCE_LABELS`)** (après `acces_transports: "l'accès au train et aux gares",`)

```ts
  eviter_grandes_villes: "une ville à taille humaine",
  prefere_grande_ville: "une grande ville",
```

- [ ] **Step 7 : Gloses (`comparateur-labels.ts`, `PREFERENCE_INTERPRETATIONS`)** (après `acces_transports: "desserte ferroviaire accessible alentour (présence et fréquentation des gares), pas le détail des horaires",`)

```ts
  eviter_grandes_villes: "taille de l'agglomération (unité urbaine), pas de la seule commune",
  prefere_grande_ville: "taille de l'agglomération (unité urbaine), pas de la seule commune",
```

- [ ] **Step 8 : tsc + lint**

Run: `npx tsc --noEmit && npm run lint 2>&1 | grep -iE "comparateur-vie|comparateur-labels" || echo "pas d'erreur lint sur les fichiers touchés"`
Expected: tsc sans erreur ; aucune ligne lint sur ces fichiers.

- [ ] **Step 9 : Témoins curl /match**

Run :
```bash
echo "=== eviter_grandes_villes (petites villes, pas villages ni métropoles) ==="
curl -s -X POST http://localhost:3000/api/comparateur-vie/match -H 'Content-Type: application/json' \
 -d '{"parsed":{"preferences":[{"key":"eviter_grandes_villes","weight":3}],"hardConstraints":{}}}' \
 | python3 -c "import sys,json; d=json.load(sys.stdin); [print(' ',c['nom'],c['compatibility'],c['reasons']) for c in d.get('results',[])[:3]]"
echo "=== prefere_grande_ville (métropoles) ==="
curl -s -X POST http://localhost:3000/api/comparateur-vie/match -H 'Content-Type: application/json' \
 -d '{"parsed":{"preferences":[{"key":"prefere_grande_ville","weight":3}],"hardConstraints":{}}}' \
 | python3 -c "import sys,json; d=json.load(sys.stdin); [print(' ',c['nom'],c['compatibility'],c['reasons']) for c in d.get('results',[])[:3]]"
```
Expected : `eviter_grandes_villes` → des petites villes / villes moyennes autonomes en tête (le plancher de viabilité évite les hameaux), avec « ville à taille humaine » ; `prefere_grande_ville` → grandes agglos / métropoles en tête avec « grande ville animée ». (Note : si la recompilation Next n'a pas relu, refaire un appel.)

- [ ] **Step 10 : Commit**

```bash
git add src/lib/comparateur-vie.ts src/lib/comparateur-labels.ts
git commit -m "feat(comparateur): preferences graduees de taille de ville (UU) + libelles/gloses

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3 : taille relative et filtre de taille sur l'UU (limite B)

**Files:** Modify `src/lib/comparateur-vie.ts`

- [ ] **Step 1 : `passesHard` — filtre `communeSize` sur `tailleVille`**

Dans `passesHard`, remplacer :
```ts
  if (hc.communeSize) {
    if (hc.communeSize.min != null && (c.population ?? 0) < hc.communeSize.min) return false;
    if (hc.communeSize.max != null && (c.population ?? Infinity) > hc.communeSize.max) return false;
  }
```
par :
```ts
  if (hc.communeSize) {
    // Évalué en TAILLE D'AGGLOMÉRATION (UU), pas en population communale (cf. chantier C).
    const t = tailleVille(c);
    if (hc.communeSize.min != null && (t ?? 0) < hc.communeSize.min) return false;
    if (hc.communeSize.max != null && (t ?? Infinity) > hc.communeSize.max) return false;
  }
```

- [ ] **Step 2 : Résolution `sizeRelativeTo` — référence en pop d'UU**

Dans `matchProjects`, remplacer le bloc :
```ts
  if (hc.sizeRelativeTo?.label && names) {
    const raw = hc.sizeRelativeTo.label;
    const key = normalizeName(raw);
    const refPop = PLM_VILLES[key]?.pop ?? names.get(key)?.population ?? null;
```
par :
```ts
  if (hc.sizeRelativeTo?.label && names) {
    const raw = hc.sizeRelativeTo.label;
    const key = normalizeName(raw);
    // Référence en TAILLE D'AGGLOMÉRATION : pop d'UU (PLM via leur UU parente ; sinon
    // tailleVille de la commune de référence). Corrige la limite B (comparaison communale).
    const plm = PLM_VILLES[key];
    const refHit = names.get(key);
    const refPop = plm
      ? uuPopCache?.get(plm.uu) ?? null
      : refHit
        ? tailleVille(refHit)
        : null;
```

(Le reste du bloc — `if (refPop != null) { ... cs.max/min ... hc.communeSize = cs; }` — est inchangé.)

- [ ] **Step 3 : tsc + lint**

Run: `npx tsc --noEmit && npm run lint 2>&1 | grep -i "comparateur-vie" || echo "pas d'erreur lint sur comparateur-vie.ts"`
Expected: tsc sans erreur ; aucune ligne lint.

- [ ] **Step 4 : Témoin curl — « plus petit que Lyon » compare les agglos**

Run :
```bash
echo "=== plus petit que Lyon (taille relative en UU) ==="
curl -s -X POST http://localhost:3000/api/comparateur-vie/match -H 'Content-Type: application/json' \
 -d '{"parsed":{"preferences":[{"key":"eviter_isolement","weight":2}],"hardConstraints":{"sizeRelativeTo":{"label":"Lyon","direction":"smaller"}}}}' \
 | python3 -c "
import sys,json
d=json.load(sys.stdin)
print('candidats:', d.get('candidates'))
print('appliedPlaces:', d.get('appliedPlaces'))
[print(' ',c['nom'],c['compatibility']) for c in d.get('results',[])[:3]]
"
```
Expected : la contrainte s'applique (`appliedPlaces` mentionne « communes plus petites que Lyon ») ; les résultats sont des communes dont l'**agglomération** est plus petite que celle de Lyon (une commune de la grande agglo lyonnaise est exclue, pas seulement Lyon-commune).

- [ ] **Step 5 : Commit**

```bash
git add src/lib/comparateur-vie.ts
git commit -m "feat(comparateur): taille relative et filtre de taille evalues en population d'UU (limite B)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4 : parse — intentions de taille de ville

**Files:** Modify `src/app/api/comparateur-vie/parse/route.ts`

- [ ] **Step 1 : Descriptions de clés** (après la ligne décrivant `acces_transports`)

```
- eviter_grandes_villes : préférer une ville à taille humaine (taille de l'agglomération / unité urbaine). Pour « une petite ville », « une ville à taille humaine », « pas une métropole », « pas une grande ville », « éviter les grandes villes », « loin de l'agitation urbaine »
- prefere_grande_ville : préférer une grande ville (taille de l'agglomération). Pour « une grande ville », « une métropole », « une grande agglomération », « du dynamisme urbain », « l'animation d'une grande ville »
```

- [ ] **Step 2 : Règles de routage** (dans « TRADUCTION AUTOMATIQUE », après les règles mobilité ajoutées au chantier précédent — repère : la ligne `... → acces_transports (poids 2 à 3).`)

```
- "petite ville", "ville à taille humaine", "pas une métropole", "pas une grande ville", "éviter les grandes villes" → eviter_grandes_villes (poids 2 à 3).
- "ville moyenne", "ville de taille moyenne" → eviter_grandes_villes (poids 2) ET eviter_isolement (poids 2) : plafond + plancher font émerger la ville moyenne.
- "grande ville", "métropole", "grande agglomération", "dynamisme urbain", "animation urbaine" → prefere_grande_ville (poids 2 à 3).
- "plus petit que {ville}", "plus grand que {ville}", "moins de N habitants" → contrainte dure (sizeRelativeTo / communeSize), désormais évaluée en taille d'agglomération (UU). Ne créez PAS de préférence eviter_grandes_villes/prefere_grande_ville en plus dans ce cas.
```

- [ ] **Step 3 : tsc**

Run: `npx tsc --noEmit`
Expected: aucune erreur (enum tiré de `PREFERENCE_KEYS`).

- [ ] **Step 4 : Témoins curl /parse**

Run :
```bash
for q in "je veux une petite ville à taille humaine" "plutôt une ville moyenne" "une grande ville dynamique" "une ville plus petite que Bordeaux"; do
  printf "Q: %s\n" "$q"
  curl -s -X POST http://localhost:3000/api/comparateur-vie/parse -H 'Content-Type: application/json' -d "{\"text\":\"$q\"}" \
   | python3 -c "import sys,json; d=json.load(sys.stdin); p=d.get('parsed',d); print('  prefs:', [x['key'] for x in p.get('preferences',[])], '| sizeRelativeTo:', p.get('hardConstraints',{}).get('sizeRelativeTo'), '| communeSize:', p.get('hardConstraints',{}).get('communeSize'))"
done
```
Expected : « petite ville » → `eviter_grandes_villes` ; « ville moyenne » → `eviter_grandes_villes` + `eviter_isolement` ; « grande ville dynamique » → `prefere_grande_ville` ; « plus petite que Bordeaux » → `sizeRelativeTo` (smaller, Bordeaux), sans préférence de taille en doublon.

- [ ] **Step 5 : Commit**

```bash
git add src/app/api/comparateur-vie/parse/route.ts
git commit -m "feat(comparateur): parse route les intentions de taille de ville (UU)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5 : vérification finale + intégration

**Files:** aucun

- [ ] **Step 1 : tsc + lint global**

Run: `npx tsc --noEmit && npm run lint 2>&1 | grep -E "comparateur-vie\.ts|comparateur-labels\.ts|parse/route\.ts" && echo "(erreurs ci-dessus)" || echo "aucune erreur lint sur les fichiers touchés"`
Expected: tsc sans erreur ; aucune nouvelle erreur lint sur les fichiers touchés.

- [ ] **Step 2 : Témoin — rural non pénalisé sans intention de taille**

Run :
```bash
curl -s -X POST http://localhost:3000/api/comparateur-vie/match -H 'Content-Type: application/json' \
 -d '{"parsed":{"preferences":[{"key":"nature","weight":2}],"hardConstraints":{}}}' \
 | python3 -c "import sys,json; d=json.load(sys.stdin); bad=[c['nom'] for c in d.get('results',[]) if any('agglom' in r or 'taille humaine' in r or 'bassin urbain' in r for r in c.get('reasons',[]))]; print('reasons taille hors critère (attendu 0):', len(bad), bad)"
```
Expected : `0` (aucune reason de taille quand la taille n'est pas demandée).

- [ ] **Step 3 : Témoin — cohérence isolement recadré**

Run :
```bash
curl -s -X POST http://localhost:3000/api/comparateur-vie/match -H 'Content-Type: application/json' \
 -d '{"parsed":{"preferences":[{"key":"eviter_isolement","weight":3}],"hardConstraints":{}}}' \
 | python3 -c "import sys,json; d=json.load(sys.stdin); [print(' ',c['nom'],c['compatibility'],c['reasons']) for c in d.get('results',[])[:3]]"
```
Expected : en tête, des communes de grandes agglos (la reason « bassin de vie de N hab. » affiche la taille d'agglo).

- [ ] **Step 4 : État git** — Run: `git status --short` — Expected: aucun fichier source non committé.

- [ ] **Step 5 : finishing-a-development-branch** — Invoquer `superpowers:finishing-a-development-branch`. Ne pas merger sur `main` sans « push sur main ».

---

## Self-review (auteur du plan)

- **Couverture spec :** donnée pop d'UU + tailleVille → Task 1 Step 1-2. #1 isolement → Task 1 Step 3-4. #2 taille relative + filtre → Task 3. #3 deux clés graduées + courbes → Task 2 ; cloche par composition (plancher isolement + plafond) → émerge, parse « ville moyenne » = 2 clés (Task 4 Step 2). parse → Task 4. labels/gloses/reasons → Task 2 Step 4-7 + Task 1 Step 4. cadre_calme inchangé (non touché). bornes d'UU → courbes Task 2 Step 1. vérif → Tasks 1/2/3/4/5.
- **Placeholders :** aucun ; toutes les anchors, diffs et commandes sont explicites. Choix « conserver communeSize » documenté.
- **Cohérence des types :** `tailleVille(c)` défini Task 1, utilisé dans `subScore` (eviter_isolement, 2 nouvelles clés), `REASON_POS`, `passesHard`, résolution `sizeRelativeTo` — toujours `(c: IndexCommune) => number | null`. `uuPopCache` rempli par `buildUuPop` dans `loadIndex` avant tout appel (matchProjects appelle loadIndex en tête). Clés `eviter_grandes_villes`/`prefere_grande_ville` ajoutées de façon cohérente à `PREFERENCE_KEYS`, `subScore`, `REASON_POS/NEG`, `PREFERENCE_LABELS`, `PREFERENCE_INTERPRETATIONS`, parse. `GRANDE_VILLE_MIN/MAX` de type `Anchors`.
