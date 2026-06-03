# Honnêteté hors-mesure au gate (écoles, culture, affectif) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Au gate `/ou-vivre`, reconnaître honnêtement les notions tapées par l'utilisateur que le moteur ne mesure pas (écoles, vie culturelle, caractère affectif), affichées dans « Ce qui reste ouvert », au lieu d'être avalées en silence (constat QA Cowork).

**Architecture:** Trois couches, aucun changement de score. (1) un champ `horsMesure` produit par la route de parse (tool use Anthropic), porté par le type `ParsedProject`. (2) un helper pur client-safe `horsMesureToPhrases` qui mappe chaque `kind` vers une phrase fixe (pas d'interpolation du mot brut). (3) affichage de ces phrases dans le bloc « ⚠ Ce qui reste ouvert » déjà présent au gate, avant les ambiguïtés.

**Tech Stack:** Next.js (App Router), TypeScript, Anthropic SDK (tool use), Tailwind.

**Note de vérification :** ce dépôt n'a aucun runner de test (seuls `npm run lint` et `npm run build`/`tsc --noEmit` existent). La vérification se fait par typecheck, lint, un appel réel à la route de parse (`curl` sur le serveur dev), et un contrôle manuel au gate. Pas de framework de test introduit.

**Hors périmètre (à NE PAS faire ici) :**
- Faire d'écoles / culture de vrais critères (chantier BPE séparé). Ici on les déclare seulement honnêtement.
- L'honnêteté du proxy inondation (`faible_precip_extremes`) : autre mécanisme (glose sur un critère actif), chantier distinct.
- `nature`, `cadre_calme`, `acces_services`, `acces_soins` sont MESURÉS : ils ne doivent jamais tomber en horsMesure.

---

## Décision de conception

Trois `kind`, chacun avec une phrase fixe (formulation figée pour éviter les accords bancals, conforme à la doctrine tooltips : court, pas de jargon) :

- **`ecoles`** (écoles, collège, lycée, scolarité) → « pas encore mesuré » (une donnée publique, BPE, pourrait l'approcher).
- **`culture`** (vie culturelle, cinéma, théâtre, musée, sorties) → « pas encore mesuré ».
- **`affectif`** (authentique, chaleureux, convivial, esprit de village, du caractère, de l'âme, qui bouge) → « relève d'une expérience personnelle » (jamais mesurable).

---

## File Structure

- Modify: `src/lib/comparateur-vie.ts` — type `HorsMesureKind` + champ `horsMesure` sur `ParsedProject`.
- Modify: `src/lib/comparateur-labels.ts` — helper pur `horsMesureToPhrases` + table de phrases (fichier client-safe existant).
- Modify: `src/app/api/comparateur-vie/parse/route.ts` — schéma tool use + prompt système (détection des notions hors-mesure).
- Modify: `src/app/(public)/ou-vivre/OuVivreClient.tsx` — dérivation + rendu dans « Ce qui reste ouvert ».

---

## Task 1 : Type `horsMesure` sur `ParsedProject`

**Files:**
- Modify: `src/lib/comparateur-vie.ts` (type `ParsedProject`, après `emploiHorsSujet?: boolean;`)

- [ ] **Step 1 : Ajouter le type kind + le champ**

Dans `src/lib/comparateur-vie.ts`, juste avant `export type ParsedProject = {`, ajouter le type kind :

```ts
export type HorsMesureKind = "ecoles" | "culture" | "affectif";
```

Puis dans le type `ParsedProject`, après la ligne `emploiHorsSujet?: boolean;`, ajouter :

```ts
  // Notions exprimées par l'utilisateur SANS critère dans le moteur (écoles, vie
  // culturelle, caractère affectif). Pur affichage honnête au gate, aucun impact
  // sur le score. cf. plan 2026-06-03 (constat QA : ces notions étaient avalées en silence).
  horsMesure?: { term: string; kind: HorsMesureKind }[];
```

- [ ] **Step 2 : Typecheck**

Run: `npx tsc --noEmit 2>&1 | grep -c "error TS"`
Expected: `0` (champ optionnel, aucun consommateur cassé).

- [ ] **Step 3 : Commit**

```bash
git add src/lib/comparateur-vie.ts
git commit -m "feat(comparateur): type horsMesure sur ParsedProject (écoles/culture/affectif)"
```

---

## Task 2 : Helper `horsMesureToPhrases` (pur, client-safe)

**Files:**
- Modify: `src/lib/comparateur-labels.ts` (ajout en fin de fichier)

- [ ] **Step 1 : Ajouter la table de phrases + le helper**

À la fin de `src/lib/comparateur-labels.ts`, ajouter (le `kind` est typé `string` ici pour rester découplé du module server-only `comparateur-vie.ts` ; les valeurs correspondent à `HorsMesureKind`) :

```ts
// Phrases honnêtes affichées au gate pour les notions sans critère dans le moteur.
// Formulation FIXE par kind (on n'interpole pas le mot brut de l'utilisateur, pour
// éviter les accords bancals). écoles / culture = « pas encore » (une donnée publique
// pourrait les approcher un jour, BPE) ; affectif = jamais (expérience personnelle).
const HORS_MESURE_PHRASES: Record<string, string> = {
  ecoles:
    "La présence d'écoles, de collèges et de lycées n'est pas encore un critère mesuré par futur•e.",
  culture:
    "L'accès à la vie culturelle (cinémas, théâtres, musées) n'est pas encore un critère mesuré par futur•e.",
  affectif:
    "Le caractère d'un lieu (authentique, chaleureux, vivant) relève d'une expérience personnelle, pas d'une donnée territoriale.",
};

// Convertit les notions hors-mesure en phrases à afficher, sans doublon de phrase
// (deux termes d'un même kind se replient sur une seule phrase). Ignore les kinds inconnus.
export function horsMesureToPhrases(
  items: { term: string; kind: string }[] | null | undefined,
): string[] {
  if (!items) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const it of items) {
    const phrase = HORS_MESURE_PHRASES[it.kind];
    if (phrase && !seen.has(phrase)) {
      seen.add(phrase);
      out.push(phrase);
    }
  }
  return out;
}
```

- [ ] **Step 2 : Typecheck + lint**

Run: `npx tsc --noEmit 2>&1 | grep -c "error TS"` puis `npm run lint 2>&1 | grep -c "comparateur-labels"`
Expected: `0` et `0`.

- [ ] **Step 3 : Commit**

```bash
git add src/lib/comparateur-labels.ts
git commit -m "feat(comparateur): helper horsMesureToPhrases (phrases honnêtes par kind)"
```

---

## Task 3 : Parse — schéma tool use + prompt

**Files:**
- Modify: `src/app/api/comparateur-vie/parse/route.ts` (`TOOL_INPUT_SCHEMA.properties`, après le bloc `ambiguities` ; `SYSTEM`)

- [ ] **Step 1 : Ajouter `horsMesure` au schéma**

Dans `TOOL_INPUT_SCHEMA.properties`, juste après le bloc `ambiguities: { ... },` (avant `emploiHorsSujet`), ajouter :

```ts
    horsMesure: {
      type: "array",
      description:
        "Notions exprimées par l'utilisateur qui n'ont AUCUN critère dans le moteur. Ne JAMAIS fabriquer de proxy. Maximum 3. Vide si aucune.",
      items: {
        type: "object",
        properties: {
          term: { type: "string", description: "le mot tel que l'utilisateur l'a dit" },
          kind: { type: "string", enum: ["ecoles", "culture", "affectif"] },
        },
        required: ["term", "kind"],
      },
    },
```

- [ ] **Step 2 : Rediriger écoles hors des ambiguities dans le prompt**

Dans `SYSTEM`, remplacer la ligne existante :

```
- N'inventez aucune donnée. Écoles, services, sécurité, prix : hors périmètre V1. Si l'utilisateur insiste dessus, mentionnez-le en ambiguities sans créer de préférence.
```

par :

```
- N'inventez aucune donnée. Services, sécurité, prix : hors périmètre V1, ne créez pas de préférence. Les écoles et la vie culturelle se déclarent en horsMesure (voir HORS-MESURE), jamais en préférence ni en ambiguities.
```

- [ ] **Step 3 : Ajouter le guidage hors-mesure au prompt**

Dans `SYSTEM`, juste avant la dernière phrase (« Dans la reformulation, restez en langage humain... »), insérer ce bloc :

```
HORS-MESURE (notions sans critère dans le moteur) : remplissez horsMesure, ne fabriquez JAMAIS de proxy.
- "écoles", "école", "collège", "lycée", "scolarité", "bon établissement scolaire" → { term, kind: "ecoles" }. NE rabattez PAS sur acces_services.
- "vie culturelle", "culture", "cinéma", "théâtre", "musée", "concerts", "sorties", "animée culturellement" → { term, kind: "culture" }. NE rabattez PAS sur eviter_isolement ni sur une grande ville.
- "authentique", "chaleureux", "accueillant", "convivial", "esprit de village", "du caractère", "de l'âme", "qui bouge", "vivante" → { term, kind: "affectif" }.
- Ne remplissez horsMesure QUE si la notion est réellement exprimée ; ces notions n'ajoutent AUCUNE préférence. La nature, le calme, les services et les soins SONT mesurés : ne les mettez jamais en horsMesure.
```

- [ ] **Step 4 : Typecheck + lint**

Run: `npx tsc --noEmit 2>&1 | grep -c "error TS"` puis `npm run lint 2>&1 | grep -c "parse/route"`
Expected: `0` et `0`.

- [ ] **Step 5 : Contrôle réel du parse**

Run (serveur dev sur :3000) :

```bash
curl -s "http://localhost:3000/api/comparateur-vie/parse" -X POST -H "Content-Type: application/json" \
 -d '{"text":"une ville pour ma famille, avec de bonnes écoles et une vraie vie culturelle, dans un village authentique"}' --max-time 60 \
 | node -e "let s=''; process.stdin.on('data',d=>s+=d); process.stdin.on('end',()=>{const p=JSON.parse(s).parsed; console.log('horsMesure:', JSON.stringify(p.horsMesure)); console.log('preferences:', JSON.stringify(p.preferences.map(x=>x.key)));});"
```

Expected : `horsMesure` contient un `{kind:"ecoles"}`, un `{kind:"culture"}` et un `{kind:"affectif"}`. Les `preferences` ne contiennent PAS `nature`/`cadre_calme` fabriqués à partir de « village authentique » (le calme peut venir de « village » si le sens le porte, mais « authentique » ne crée rien).

- [ ] **Step 6 : Commit**

```bash
git add src/app/api/comparateur-vie/parse/route.ts
git commit -m "feat(comparateur): parse détecte écoles/culture/affectif en horsMesure"
```

---

## Task 4 : UI — affichage dans « Ce qui reste ouvert »

**Files:**
- Modify: `src/app/(public)/ou-vivre/OuVivreClient.tsx` (import ~ligne 6 ; dérivation ~ligne 324 ; bloc « Ce qui reste ouvert » ~ligne 768)

- [ ] **Step 1 : Importer le helper**

Modifier l'import existant en tête de fichier :

```tsx
import { preferencesToLabels, preferencesToInterpreted } from "@/lib/comparateur-labels";
```

en :

```tsx
import {
  preferencesToLabels,
  preferencesToInterpreted,
  horsMesureToPhrases,
} from "@/lib/comparateur-labels";
```

- [ ] **Step 2 : Dériver les phrases hors-mesure**

Juste après la ligne `const criteres = parsed ? preferencesToInterpreted(parsed.preferences) : [];`, ajouter :

```tsx
  const horsMesurePhrases = parsed ? horsMesureToPhrases(parsed.horsMesure) : [];
```

- [ ] **Step 3 : Afficher les phrases dans le bloc « Ce qui reste ouvert »**

Remplacer le bloc actuel (gardé par `parsed.ambiguities && parsed.ambiguities.length > 0`) :

```tsx
          {parsed.ambiguities && parsed.ambiguities.length > 0 && (
            <div className="mt-6">
              <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-ghost mb-2.5">
                <span className="text-amber-400">⚠</span> Ce qui reste ouvert
              </p>
              <ul className="flex flex-col gap-2">
                {parsed.ambiguities.map((a, i) => (
                  <li
                    key={i}
                    className="text-[13px] leading-[1.6] text-muted border-l-2 border-amber-400/30 pl-3"
                  >
                    <span className="text-label">{a.topic}</span> : sans précision de votre
                    part, futur•e en retient une interprétation souple, sans en faire un
                    critère éliminatoire.
                  </li>
                ))}
              </ul>
            </div>
          )}
```

par :

```tsx
          {((parsed.ambiguities && parsed.ambiguities.length > 0) ||
            horsMesurePhrases.length > 0) && (
            <div className="mt-6">
              <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-ghost mb-2.5">
                <span className="text-amber-400">⚠</span> Ce qui reste ouvert
              </p>
              <ul className="flex flex-col gap-2">
                {horsMesurePhrases.map((phrase, i) => (
                  <li
                    key={`hm-${i}`}
                    className="text-[13px] leading-[1.6] text-muted border-l-2 border-amber-400/30 pl-3"
                  >
                    {phrase}
                  </li>
                ))}
                {parsed.ambiguities?.map((a, i) => (
                  <li
                    key={`amb-${i}`}
                    className="text-[13px] leading-[1.6] text-muted border-l-2 border-amber-400/30 pl-3"
                  >
                    <span className="text-label">{a.topic}</span> : sans précision de votre
                    part, futur•e en retient une interprétation souple, sans en faire un
                    critère éliminatoire.
                  </li>
                ))}
              </ul>
            </div>
          )}
```

- [ ] **Step 4 : Typecheck + lint**

Run: `npx tsc --noEmit 2>&1 | grep -c "error TS"` puis `npm run lint 2>&1 | grep -c "OuVivreClient"`
Expected: `0` et `0`.

- [ ] **Step 5 : Contrôle manuel de bout en bout**

Run: `npm run dev`, ouvrir `/ou-vivre`, soumettre « une ville pour ma famille avec de bonnes écoles et une vraie vie culturelle, dans un village authentique ».
Expected : sous « ⚠ Ce qui reste ouvert » apparaissent les trois phrases (écoles, culture, caractère). Deux termes d'un même kind ne produisent qu'une phrase. Aucun tiret cadratin, aucune clé technique à l'écran. Les critères mesurés (famille → services/soins…) restent dans « Les critères identifiés ».

- [ ] **Step 6 : Commit**

```bash
git add src/app/\(public\)/ou-vivre/OuVivreClient.tsx
git commit -m "feat(comparateur): afficher écoles/culture/affectif dans « Ce qui reste ouvert »"
```

---

## Self-Review

**Spec coverage :**
- Champ type `horsMesure` + `HorsMesureKind` → Task 1. ✓
- Helper phrases fixes + dédup → Task 2. ✓
- Parse schéma + prompt (écoles/culture/affectif ; écoles retiré des ambiguities) → Task 3. ✓
- Rendu au gate dans « Ce qui reste ouvert » → Task 4. ✓
- « nature/calme/services mesurés, jamais en horsMesure » → garde-fou explicite dans le prompt (Task 3 Step 3). ✓
- Aucun changement de score → garanti par construction (aucune tâche ne touche le moteur/scoring). ✓
- Glose CSS → déjà en place dans le code, hors plan (vérifié). ✓
- Inondation-proxy, écoles/culture comme vrais critères → hors périmètre, conformes. ✓

**Placeholder scan :** aucun TBD/TODO ; chaque step porte le code exact.

**Type consistency :** `horsMesure?: { term: string; kind: HorsMesureKind }[]` (Task 1) est structurellement compatible avec le paramètre `{ term: string; kind: string }[]` de `horsMesureToPhrases` (Task 2) et avec le schéma tool use (Task 3, enum `["ecoles","culture","affectif"]` identique aux clés de `HORS_MESURE_PHRASES`). ✓
