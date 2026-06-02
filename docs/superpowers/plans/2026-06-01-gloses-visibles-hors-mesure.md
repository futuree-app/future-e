# Gloses visibles + honnêteté hors-mesure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendre les gloses du gate nettement plus lisibles, et reconnaître honnêtement au gate les notions sans critère dans le moteur (nature, authentique...) au lieu de les abandonner en silence.

**Architecture:** Trois couches. (1) Pur CSS sur la glose existante au gate. (2) Un nouveau champ `horsMesure` produit par la route de parse (tool use Anthropic), porté par le type `ParsedProject`, mappé vers des phrases fixes par un helper pur client-safe. (3) Affichage de ces phrases dans le bloc « ⚠ Ce qui reste ouvert » déjà présent. Aucun changement de score, aucune donnée nouvelle.

**Tech Stack:** Next.js (App Router), TypeScript, Anthropic SDK (tool use), Tailwind.

**Note de vérification :** ce dépôt n'a aucun runner de test (seuls `npm run lint` et `npm run build` existent). La vérification de chaque tâche se fait donc par `npm run lint`, `npm run build` (typecheck) et contrôle manuel au gate `/ou-vivre`. Pas de framework de test introduit (hors convention du projet, disproportionné ici).

---

## File Structure

- `src/app/(public)/ou-vivre/OuVivreClient.tsx` — gate UI : traitement visuel de la glose (A) + rendu des phrases hors-mesure (B.3).
- `src/lib/comparateur-vie.ts` — type `ParsedProject` : ajout du champ `horsMesure` (B.1).
- `src/lib/comparateur-labels.ts` — helper pur `horsMesureToPhrases` + table de phrases (B.2). Fichier client-safe déjà existant.
- `src/app/api/comparateur-vie/parse/route.ts` — schéma tool use + prompt système : détection des notions hors-mesure (B.3 parse).

---

## Task 1 : A — Glose visible (pur UI)

**Files:**
- Modify: `src/app/(public)/ou-vivre/OuVivreClient.tsx` (bloc « Les critères identifiés », span de glose, ~lignes 519-523)

- [ ] **Step 1 : Modifier le span de la glose**

Remplacer le span actuel :

```tsx
                    {c.gloss && (
                      <span className="px-1 text-[10.5px] leading-tight text-ghost">
                        {c.gloss}
                      </span>
                    )}
```

par :

```tsx
                    {c.gloss && (
                      <span
                        className="px-1 text-[12px] leading-tight text-muted italic"
                        style={{ fontFamily: "'Instrument Serif', serif" }}
                      >
                        → {c.gloss}
                      </span>
                    )}
```

- [ ] **Step 2 : Typecheck + lint**

Run: `npm run build` puis `npm run lint`
Expected: build OK, lint sans erreur.

- [ ] **Step 3 : Contrôle manuel**

Run: `npm run dev`, ouvrir `/ou-vivre`, soumettre « un climat doux, au calme, proche de la mer ».
Expected: sous chaque puce concernée, la glose apparaît en serif italique, taille 12px, teinte muted, préfixée `→`. Nettement plus lisible qu'avant, sans écraser la puce.

- [ ] **Step 4 : Commit**

```bash
git add src/app/\(public\)/ou-vivre/OuVivreClient.tsx
git commit -m "feat(comparateur): gloses du gate plus lisibles (écho serif)"
```

---

## Task 2 : B.1 — Champ `horsMesure` sur le type `ParsedProject`

**Files:**
- Modify: `src/lib/comparateur-vie.ts` (type `ParsedProject`, ~lignes 75-83)

- [ ] **Step 1 : Ajouter le champ au type**

Dans le type `ParsedProject`, après la ligne `emploiHorsSujet?: boolean;`, ajouter :

```ts
  // Notions exprimées par l'utilisateur SANS critère dans le moteur (audit
  // sémantique, familles C/D). Pur affichage honnête au gate, aucun impact score.
  // donnee_absente : une donnée publique pourrait l'approcher un jour (nature →
  // couvert forestier). non_mesurable : notion affective, aucun proxy crédible.
  horsMesure?: { term: string; kind: "donnee_absente" | "non_mesurable" }[];
```

- [ ] **Step 2 : Typecheck**

Run: `npm run build`
Expected: build OK (le champ est optionnel, aucun consommateur cassé).

- [ ] **Step 3 : Commit**

```bash
git add src/lib/comparateur-vie.ts
git commit -m "feat(comparateur): champ horsMesure sur ParsedProject"
```

---

## Task 3 : B.2 — Helper `horsMesureToPhrases` (pur, client-safe)

**Files:**
- Modify: `src/lib/comparateur-labels.ts` (ajout en fin de fichier)

- [ ] **Step 1 : Ajouter la table de phrases + le helper**

À la fin de `src/lib/comparateur-labels.ts`, ajouter :

```ts
// Phrases honnêtes affichées au gate pour les notions sans critère dans le moteur
// (audit sémantique). Formulation FIXE par famille : on n'interpole pas le mot brut
// de l'utilisateur, pour éviter les accords bancals (« Le caractère convivial relève… »).
// donnee_absente = une donnée pourrait l'approcher un jour ; non_mesurable = jamais.
const HORS_MESURE_PHRASES: Record<"donnee_absente" | "non_mesurable", string> = {
  donnee_absente:
    "La proximité de la nature n'est pas encore un critère mesuré par futur•e.",
  non_mesurable:
    "Le caractère authentique ou chaleureux relève d'une expérience personnelle, pas d'une donnée territoriale.",
};

// Convertit les notions hors-mesure en phrases à afficher, sans doublon de phrase
// (deux termes non_mesurable se replient sur une seule phrase). Ignore les kinds inconnus.
export function horsMesureToPhrases(
  items: { term: string; kind: string }[] | null | undefined,
): string[] {
  if (!items) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const it of items) {
    const phrase = HORS_MESURE_PHRASES[it.kind as "donnee_absente" | "non_mesurable"];
    if (phrase && !seen.has(phrase)) {
      seen.add(phrase);
      out.push(phrase);
    }
  }
  return out;
}
```

- [ ] **Step 2 : Typecheck + lint**

Run: `npm run build` puis `npm run lint`
Expected: build et lint OK.

- [ ] **Step 3 : Commit**

```bash
git add src/lib/comparateur-labels.ts
git commit -m "feat(comparateur): helper horsMesureToPhrases (phrases honnêtes)"
```

---

## Task 4 : B.3 (parse) — Schéma tool use + prompt

**Files:**
- Modify: `src/app/api/comparateur-vie/parse/route.ts` (`TOOL_INPUT_SCHEMA`, ~lignes 92-100 ; `SYSTEM`, après le bloc « TRADUCTION AUTOMATIQUE » ~ligne 163)

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
          kind: { type: "string", enum: ["donnee_absente", "non_mesurable"] },
        },
        required: ["term", "kind"],
      },
    },
```

- [ ] **Step 2 : Ajouter le guidage au prompt système**

Dans la constante `SYSTEM`, juste avant la dernière phrase (« Dans la reformulation, restez en langage humain... »), insérer ce bloc :

```
HORS-MESURE (notions sans critère dans le moteur) : remplissez horsMesure, ne fabriquez JAMAIS de proxy.
- "nature", "verdure", "forêts", "espaces naturels", "préservé", "au vert", "proche de la nature" → { term, kind: "donnee_absente" }. NE LA RABATTEZ PAS sur cadre_calme ni faible_pression_agricole.
- "authentique", "chaleureux", "accueillant", "convivial", "esprit de village", "du caractère", "âme" → { term, kind: "non_mesurable" }.
- Ne remplissez horsMesure QUE si la notion est réellement exprimée par l'utilisateur. Vide sinon. Ces notions n'ajoutent aucune préférence.
```

- [ ] **Step 3 : Typecheck + lint**

Run: `npm run build` puis `npm run lint`
Expected: build et lint OK.

- [ ] **Step 4 : Contrôle manuel du parse**

Run: `npm run dev`, ouvrir `/ou-vivre`, soumettre « je veux vivre proche de la nature, dans un village authentique et chaleureux ».
Expected (vérifier le payload `parsed` renvoyé, via l'onglet réseau ou un log) : `horsMesure` contient `{ term:"nature", kind:"donnee_absente" }` et au moins un `{ kind:"non_mesurable" }`. « nature » n'a PAS créé de préférence `cadre_calme` / `faible_pression_agricole` à elle seule.

- [ ] **Step 5 : Commit**

```bash
git add src/app/api/comparateur-vie/parse/route.ts
git commit -m "feat(comparateur): parse détecte les notions hors-mesure"
```

---

## Task 5 : B.3 (UI) — Affichage des phrases hors-mesure au gate

**Files:**
- Modify: `src/app/(public)/ou-vivre/OuVivreClient.tsx` (import en tête ~ligne 6 ; bloc « ⚠ Ce qui reste ouvert » ~lignes 578-596)

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

Près de la dérivation `const criteres = parsed ? preferencesToInterpreted(...) : [];` (~ligne 281), ajouter :

```tsx
  const horsMesurePhrases = parsed ? horsMesureToPhrases(parsed.horsMesure) : [];
```

- [ ] **Step 3 : Afficher les phrases dans le bloc « Ce qui reste ouvert »**

Remplacer la condition et le contenu du bloc (actuellement gardé par `parsed.ambiguities && parsed.ambiguities.length > 0`) par une version qui s'affiche si l'un OU l'autre est présent, et qui rend d'abord les phrases hors-mesure puis les ambiguïtés :

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

Run: `npm run build` puis `npm run lint`
Expected: build et lint OK.

- [ ] **Step 5 : Contrôle manuel de bout en bout**

Run: `npm run dev`, ouvrir `/ou-vivre`, soumettre « proche de la nature, dans un village authentique et chaleureux ».
Expected : sous « ⚠ Ce qui reste ouvert » apparaissent les deux phrases (« La proximité de la nature n'est pas encore un critère mesuré... » et « Le caractère authentique ou chaleureux relève d'une expérience personnelle... »). Deux termes non_mesurable ne produisent qu'une seule phrase. Aucun tiret cadratin, aucune clé technique à l'écran.

- [ ] **Step 6 : Commit**

```bash
git add src/app/\(public\)/ou-vivre/OuVivreClient.tsx
git commit -m "feat(comparateur): affiche les notions hors-mesure au gate"
```

---

## Self-Review

**Spec coverage :**
- A (gloses visibles) → Task 1. ✓ (12px, muted, connecteur, italique serif)
- B.1 (type) → Task 2. ✓
- B.2 (helper phrases) → Task 3. ✓
- B.3 parse (schéma + prompt) → Task 4. ✓
- B.3 UI (rendu sous « ce qui reste ouvert ») → Task 5. ✓
- Wording fixe par kind (pas d'interpolation) → Task 3 (table figée). ✓
- Critère succès « aucun changement de score » → garanti par construction (aucune tâche ne touche le moteur/scoring) ; vérifiable au contrôle manuel.
- Hors périmètre (couvert forestier, firewall synthèse) → aucune tâche, conforme. ✓

**Placeholder scan :** aucun TBD/TODO ; chaque step porte le code exact.

**Type consistency :** `horsMesure?: { term: string; kind: "donnee_absente" | "non_mesurable" }[]` (Task 2) est structurellement compatible avec le paramètre de `horsMesureToPhrases({ term: string; kind: string }[])` (Task 3) et avec le schéma tool use (Task 4, enum identique). Les `kind` `"donnee_absente"` / `"non_mesurable"` sont identiques partout. ✓
