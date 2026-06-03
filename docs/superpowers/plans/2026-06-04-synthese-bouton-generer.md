# Synthèse IA derrière un bouton « Générer » (flag) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mettre les deux synthèses Claude auto-déclenchées (comparateur + quartier) derrière un flag `AUTO_SYNTHESIS` (défaut OFF) et un bouton « Générer la synthèse », pour ne plus brûler de tokens pendant la phase de test.

**Architecture:** Un helper client-safe `AUTO_SYNTHESIS = process.env.NEXT_PUBLIC_AUTO_SYNTHESIS === "true"`. Les deux `useEffect` qui déclenchent une synthèse ne le font que si `AUTO_SYNTHESIS` ; sinon un bouton rejoue exactement la même fonction de génération. On ne touche QUE le déclencheur (ni prompt, ni streaming, ni firewall, ni scoring).

**Tech Stack:** React/Next (App Router, client components), TypeScript. Vérification : `npx tsc --noEmit` + `npm run lint` + contrôle sur le dev (port 3000), flag absent puis `=true`. PAS de runner de test (cf. AGENTS.md). `grep -c` renvoie exit 1 sur 0 match (ne pas chaîner en `&&`).

**Spec :** `docs/superpowers/specs/2026-06-04-synthese-bouton-generer-design.md`

---

## Task 1 : Flag `AUTO_SYNTHESIS`

**Files:**
- Create: `src/lib/auto-synthesis.ts`

- [ ] **Step 1 : Créer le helper**

```ts
// Auto-déclenchement des synthèses Claude (comparateur + quartier). Par défaut OFF :
// le défaut sûr pendant la phase de test (plateforme non indexée) est « ne dépense pas ».
// L'auto ne s'active que si NEXT_PUBLIC_AUTO_SYNTHESIS vaut explicitement "true" (à poser
// au lancement, côté Vercel, par environnement). NEXT_PUBLIC_ = lisible client, inliné au build.
export const AUTO_SYNTHESIS = process.env.NEXT_PUBLIC_AUTO_SYNTHESIS === "true";
```

- [ ] **Step 2 : Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected : clean.

Run: `npm run lint 2>&1 | grep -i "auto-synthesis"; echo "exit:$?"`
Expected : aucune ligne (exit 1).

- [ ] **Step 3 : Commit**

```bash
git add src/lib/auto-synthesis.ts
git commit -m "feat: flag AUTO_SYNTHESIS (defaut OFF) pour gater les syntheses Claude

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2 : Synthèse comparateur derrière le bouton (`OuVivreClient.tsx`)

**Files:**
- Modify: `src/app/(public)/ou-vivre/OuVivreClient.tsx` (import ~l.12 ; `useEffect` ~l.311 ; handler après ~l.359 ; rendu synthèse ~l.877)

- [ ] **Step 1 : Importer le flag**

Après l'import `ChipTooltip` (~l.12), ajouter :

```tsx
import { AUTO_SYNTHESIS } from "@/lib/auto-synthesis";
```

- [ ] **Step 2 : Gater l'auto-déclenchement dans le `useEffect`**

Remplacer le bloc (~l.311-317) :

```tsx
    // SYNTHÈSE (streamée, non bloquante pour les cartes)
    void streamSynthesis(seq, submittedText, parsed, top, {
      perfectMatch: matchOutcome.perfectMatch,
      message: matchOutcome.message,
      perimetre: matchOutcome.appliedZones?.filter((z) => z.strength === "hard").map((z) => z.label),
      orientation: matchOutcome.appliedZones?.filter((z) => z.strength !== "hard").map((z) => z.label),
    });
```

par :

```tsx
    // SYNTHÈSE (streamée, non bloquante pour les cartes). Auto seulement si AUTO_SYNTHESIS ;
    // sinon l'utilisateur la déclenche via le bouton « Générer » (generateSynthesis).
    if (AUTO_SYNTHESIS) {
      void streamSynthesis(seq, submittedText, parsed, top, {
        perfectMatch: matchOutcome.perfectMatch,
        message: matchOutcome.message,
        perimetre: matchOutcome.appliedZones?.filter((z) => z.strength === "hard").map((z) => z.label),
        orientation: matchOutcome.appliedZones?.filter((z) => z.strength !== "hard").map((z) => z.label),
      });
    }
```

- [ ] **Step 3 : Ajouter le handler manuel**

Juste après `const top = topCards(outcome?.results);` (~l.359), insérer :

```tsx
  // Déclenchement manuel de la synthèse (quand l'auto est coupé, cf. AUTO_SYNTHESIS).
  // Rejoue le corps du useEffect à partir de l'état courant (outcome déjà calculé).
  const generateSynthesis = useCallback(() => {
    if (!parsed || !outcome?.results?.length) return;
    void streamSynthesis(runSeq.current, submittedText, parsed, topCards(outcome.results), {
      perfectMatch: outcome.perfectMatch,
      message: outcome.message,
      perimetre: outcome.appliedZones?.filter((z) => z.strength === "hard").map((z) => z.label),
      orientation: outcome.appliedZones?.filter((z) => z.strength !== "hard").map((z) => z.label),
    });
  }, [parsed, outcome, submittedText, streamSynthesis]);
```

- [ ] **Step 4 : Afficher le bouton dans la zone de synthèse**

Remplacer le bloc de rendu (~l.877-888) :

```tsx
            {synthesis ? (
              <p className="text-[16px] leading-[1.8] text-label whitespace-pre-line">
                {synthesis}
                {synthesizing && <span className="inline-block w-1.5 h-4 ml-0.5 align-middle bg-accent/70 animate-pulse" />}
              </p>
            ) : (
              <p className="flex items-center gap-2.5 text-[15px] text-ghost">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                {waitingPhrase}
              </p>
            )}
```

par :

```tsx
            {synthesis ? (
              <p className="text-[16px] leading-[1.8] text-label whitespace-pre-line">
                {synthesis}
                {synthesizing && <span className="inline-block w-1.5 h-4 ml-0.5 align-middle bg-accent/70 animate-pulse" />}
              </p>
            ) : !AUTO_SYNTHESIS && !synthesizing ? (
              <button
                type="button"
                onClick={generateSynthesis}
                className="text-[14px] text-label border border-accent/40 bg-accent/[0.08] rounded-full px-4 py-2 hover:bg-accent/[0.14] transition-colors"
              >
                Générer la synthèse
              </button>
            ) : (
              <p className="flex items-center gap-2.5 text-[15px] text-ghost">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                {waitingPhrase}
              </p>
            )}
```

- [ ] **Step 5 : Vérifier compilation + lint**

Run: `npx tsc --noEmit`
Expected : clean.

Run: `npm run lint 2>&1 | grep -i "OuVivreClient"; echo "exit:$?"`
Expected : aucune ligne (exit 1).

- [ ] **Step 6 : Contrôle sur le dev (flag absent = défaut)**

Sur `/ou-vivre`, lancer une recherche. Vérifier (onglet réseau navigateur) :
- les cartes s'affichent ; **aucun** `POST /api/comparateur-vie/synthesize` n'est émis automatiquement ;
- la zone « Ce que votre recherche révèle » montre un bouton **« Générer la synthèse »** ;
- au clic : un `POST /api/comparateur-vie/synthesize` part et le texte stream.

- [ ] **Step 7 : Commit**

```bash
git add src/app/\(public\)/ou-vivre/OuVivreClient.tsx
git commit -m "feat(ou-vivre): synthese comparateur derriere bouton Generer (flag AUTO_SYNTHESIS)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3 : Synthèse quartier derrière le bouton (`QuartierSynthesis.tsx`)

**Files:**
- Modify: `src/components/report/QuartierSynthesis.tsx` (import ~l.1-10 ; `useEffect` ~l.201 ; rendu idle ~l.277)

- [ ] **Step 1 : Importer le flag**

Avec les autres imports en tête de fichier, ajouter :

```tsx
import { AUTO_SYNTHESIS } from "@/lib/auto-synthesis";
```

- [ ] **Step 2 : Gater l'auto-déclenchement dans le `useEffect`**

Remplacer le bloc (~l.201-210) :

```tsx
  useEffect(() => {
    if (!inseeCode || !communeName) return;
    const cleanup = fetchSynthesis(workbook, false);
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inseeCode, communeName, horizon]);
```

par :

```tsx
  useEffect(() => {
    if (!inseeCode || !communeName) return;
    // Auto seulement si AUTO_SYNTHESIS ; sinon l'utilisateur la déclenche via le bouton.
    if (!AUTO_SYNTHESIS) return;
    const cleanup = fetchSynthesis(workbook, false);
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inseeCode, communeName, horizon]);
```

- [ ] **Step 3 : Afficher le bouton à l'état idle**

Juste après le bloc `{synthState === "error" && <FallbackPanel text={fallbackSummary} />}` (~l.277), insérer :

```tsx
        {!AUTO_SYNTHESIS && synthState === "idle" && (
          <div className="mt-2">
            <button
              type="button"
              onClick={() => fetchSynthesis(workbook, false)}
              className="quartier-regen-btn"
            >
              Générer la synthèse
            </button>
          </div>
        )}
```

(`quartier-regen-btn` est déjà stylé dans le `<style>` de ce composant — réutilisé tel quel.)

- [ ] **Step 4 : Vérifier compilation + lint**

Run: `npx tsc --noEmit`
Expected : clean.

Run: `npm run lint 2>&1 | grep -i "QuartierSynthesis"; echo "exit:$?"`
Expected : aucune ligne (exit 1).

- [ ] **Step 5 : Contrôle sur le dev (flag absent = défaut)**

Ouvrir un rapport quartier. Vérifier (onglet réseau) :
- **aucun** `POST /api/synthesize-quartier` automatique à l'ouverture ;
- un bouton **« Générer la synthèse »** est présent à la place du texte ;
- au clic : un `POST /api/synthesize-quartier` part et le texte stream ;
- changer d'horizon **ne relance pas** automatiquement la synthèse.

- [ ] **Step 6 : Commit**

```bash
git add src/components/report/QuartierSynthesis.tsx
git commit -m "feat(report): synthese quartier derriere bouton Generer (flag AUTO_SYNTHESIS)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4 : Vérification finale + intégration

**Files:** aucun (vérification) puis mémoire.

- [ ] **Step 1 : Vérifier le mode AUTO (flag = true)**

```bash
NEXT_PUBLIC_AUTO_SYNTHESIS=true npx tsc --noEmit; echo "tsc exit:$?"
```
Expected : clean (le flag n'altère pas les types).

Puis, manuellement : relancer le dev avec `NEXT_PUBLIC_AUTO_SYNTHESIS=true` dans l'environnement, et confirmer que le comportement d'origine revient (synthèse comparateur après recherche, synthèse quartier à l'ouverture, sans bouton). Documenter le résultat. (Le porteur posera cette variable sur Vercel au lancement.)

- [ ] **Step 2 : Lint global sur les fichiers touchés**

```bash
npm run lint 2>&1 | grep -iE "auto-synthesis|OuVivreClient|QuartierSynthesis"; echo "exit:$?"
```
Expected : aucune ligne (exit 1).

- [ ] **Step 3 : git status + log**

```bash
git status --short; git log --oneline -5
```
Expected : working tree propre, 3 commits feature + le commit de spec.

- [ ] **Step 4 : finishing-a-development-branch**

Invoquer `superpowers:finishing-a-development-branch`, présenter les options. Sur « push sur main » du porteur :

```bash
git checkout main && git merge --ff-only feat/synthese-bouton-generer && git push origin main && git branch -d feat/synthese-bouton-generer
```

- [ ] **Step 5 : Mémoire (après merge)**

Mettre à jour [[synthesis_model_routing]] (ou créer une note dédiée) : flag `NEXT_PUBLIC_AUTO_SYNTHESIS` (défaut OFF) gate l'auto-déclenchement des synthèses comparateur + quartier ; bouton « Générer la synthèse » sinon ; **à poser `=true` sur Vercel au lancement**. Pointer dans `MEMORY.md`.

---

## Self-review (couverture spec)

- Flag `AUTO_SYNTHESIS`, défaut OFF, opt-in `=true` → Task 1.
- Synthèse comparateur gatée + bouton → Task 2 (gate useEffect Step 2, handler Step 3, bouton Step 4).
- Synthèse quartier gatée + bouton idle → Task 3 (gate Step 2, bouton Step 3).
- Régénération préservée → quartier : bouton « Régénérer » existant intact (non touché) ; comparateur : re-clic possible (le bouton réapparaît tant que `!synthesis`).
- Vérif des deux modes (absent / `=true`) → Task 2 Step 6, Task 3 Step 5, Task 4 Step 1.
- Hors-périmètre (parse, Logement, AskFuture, prompts, firewall, scoring) → aucune tâche ne les touche.
