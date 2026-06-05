# MAJ texte richesse du moteur (/ou-vivre) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Réécrire la copy de positionnement de `/ou-vivre` pour passer du récit « moteur climat enrichi » à « moteur de compatibilité territoriale, climat composante centrale », avec un sous-titre centré décision (compromis) et un compteur qui porte la preuve (le différenciant nuisances/risques invisibles).

**Architecture:** Chantier 100 % copy dans un seul fichier (`src/app/(public)/ou-vivre/OuVivreClient.tsx`), zéro changement de moteur. Quatre surfaces : sous-titre du hero, compteur de micro-réassurance, chips `EXAMPLES`, phrases machine à écrire `PLACEHOLDER_PHRASES`. Les chips et phrases sont des PROMESSES : aucune n'est figée sans avoir été passée dans le moteur réel (parse + match sur le dev), set final validé par le porteur après lecture des sorties.

**Tech Stack:** Next.js (App Router), React, TypeScript. Validation : sonde Node (fetch natif) contre le dev local sur le port 3000, puis `npx tsc --noEmit` + `npx eslint`.

**Doctrine de vérif (pas de runner de test) :** la « preuve » d'une tâche copy = la sonde live (matrice parse+match) pour le set de phrases, et `tsc`/`eslint`/curl de rendu pour le patch. Aucun tiret cadratin. Aucun chiffre faux. Aucune promesse d'un signal absent.

**Spec :** `docs/superpowers/specs/2026-06-05-maj-texte-richesse-moteur-design.md`

---

## File Structure

- **Modify** `src/app/(public)/ou-vivre/OuVivreClient.tsx`
  - `EXAMPLES` (lignes ~61-66) : tableau des chips.
  - `PLACEHOLDER_PHRASES` (lignes ~72-82) : tableau des phrases machine à écrire.
  - Sous-titre du hero (ligne ~617-621).
  - Compteur micro-réassurance (ligne ~654-659).
- **Create** `scripts/sonde-richesse-chips.mjs` : sonde de validation (parse+match) du corpus de candidats. Réutilisable, committée pour reproductibilité.

---

## Task 1: Sonde de validation des candidats (gate data)

**Files:**
- Create: `scripts/sonde-richesse-chips.mjs`

Le moteur de parse appelle Anthropic : le dev doit tourner avec `ANTHROPIC_API_KEY` dans l'environnement. La sonde chaîne parse → match pour chaque candidat et imprime, par phrase : les clés de critères détectées, les notions hors-mesure (signal absent), et le top 3 des communes (nom + compatibilité + 1re reason). C'est la matrice que le porteur relit.

- [ ] **Step 1: Vérifier que le dev tourne**

Run: `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/ou-vivre`
Expected: `200`. Si autre chose, démarrer le dev (`npm run dev`) dans un autre terminal et attendre le 200.

- [ ] **Step 2: Écrire la sonde**

Create `scripts/sonde-richesse-chips.mjs` :

```js
// Sonde de validation des chips/phrases de /ou-vivre : chaque candidat est une
// PROMESSE, on vérifie qu'il parse vers de vrais critères et sort un résultat
// fort et divergent sur le moteur réel. Usage : node scripts/sonde-richesse-chips.mjs
const BASE = process.env.SONDE_BASE ?? "http://localhost:3000";

// Corpus = chips (8) + phrases machine à écrire (5). « pollutions industrielles »
// déjà corrigé en « sites industriels à risque » (honnêteté : le critère mesure
// la présence de sites à risque, pas une pollution mesurée).
const CHIPS = [
  "Je veux vivre sans voiture au quotidien",
  "Une petite ville vivante près de l'océan",
  "Élever mes enfants dans un environnement sain",
  "Un coin calme avec gare et vie étudiante",
  "Rester dans le Sud sans subir les canicules",
  "Une ville qui attire de nouveaux habitants",
  "Près de la nature mais avec des médecins accessibles",
  "Préparer ma retraite dans un climat tempéré",
];
const PHRASES = [
  "Je cherche une petite ville vivante, avec une gare, des médecins accessibles et un climat supportable l'été.",
  "Nous voulons élever nos enfants loin des sites industriels à risque, sans être isolés des services.",
  "Je voudrais vivre sans voiture, près de l'océan, dans une ville qui attire encore de nouveaux habitants.",
  "Un endroit calme pour la retraite, avec des étudiants, des commerces et peu de risque d'inondation.",
  "Rester dans le Sud, mais éviter les canicules les plus intenses.",
];

async function probe(text) {
  const pr = await fetch(`${BASE}/api/comparateur-vie/parse`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!pr.ok) return { text, error: `parse ${pr.status}` };
  const parsed = await pr.json();
  const mr = await fetch(`${BASE}/api/comparateur-vie/match`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ parsed }),
  });
  if (!mr.ok) return { text, error: `match ${mr.status}` };
  const out = await mr.json();
  return {
    text,
    keys: (parsed.preferences ?? []).map((p) => p.key),
    horsMesure: (parsed.horsMesure ?? []).map((h) => h.term),
    top: (out.results ?? []).slice(0, 3).map((r) => ({
      nom: r.nom,
      compat: r.compatibility,
      reason: r.reasons?.[0] ?? "",
    })),
  };
}

async function main() {
  const corpus = [...CHIPS, ...PHRASES];
  for (const text of corpus) {
    const r = await probe(text);
    console.log("\n========================================");
    console.log("» " + r.text);
    if (r.error) { console.log("  ERREUR:", r.error); continue; }
    console.log("  critères:", r.keys.join(", ") || "(aucun)");
    if (r.horsMesure.length) console.log("  HORS-MESURE:", r.horsMesure.join(", "));
    for (const t of r.top) console.log(`  - ${t.nom} (${t.compat}) ${t.reason}`);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 3: Lancer la sonde**

Run: `node scripts/sonde-richesse-chips.mjs`
Expected: pour chaque candidat, une ligne `critères:` non vide, pas de `HORS-MESURE:` inattendu (un signal absent comme prix/tempête/maladie = candidat à rejeter), et un top 3 avec des compatibilités hautes et des communes divergentes (pas 3 communes du même coin avec la même reason).

- [ ] **Step 4: Commit de la sonde**

```bash
git add scripts/sonde-richesse-chips.mjs
git commit -m "chore(texte-richesse): sonde validation chips/phrases (parse+match)"
```

---

## Task 2: Gate porteur sur le set final (checkpoint humain)

**Files:** aucun (décision)

- [ ] **Step 1: Présenter la matrice au porteur**

Recopier la sortie de la sonde sous forme de tableau lisible (candidat → critères détectés → top 3 communes/compat). Pointer explicitement :
- les candidats à critères faibles ou résultat plat (1 seul critère, communes peu divergentes) ;
- tout `HORS-MESURE` (promesse d'un signal absent) ;
- les candidats les plus forts et les plus divergents (têtes d'affiche).

- [ ] **Step 2: Obtenir l'arbitrage**

Le porteur tranche : 5 à 6 chips retenues, 6 à 8 phrases retenues (cf. spec). Noter le set final EXACT (libellés au mot près) avant de toucher la copy. Ne pas avancer sans cette validation.

---

## Task 3: Patch des 4 surfaces de copy

**Files:**
- Modify: `src/app/(public)/ou-vivre/OuVivreClient.tsx`

Appliquer les 4 modifications. Les libellés de chips/phrases ci-dessous sont le corpus candidat complet : remplacer par le SET FINAL validé en Task 2 (mêmes structures de tableau, seuls les éléments changent).

- [ ] **Step 1: Sous-titre du hero**

Remplacer le bloc `<p>` du sous-titre (ligne ~617-621) :

```tsx
        <p className="mt-5 text-[17px] leading-[1.72] text-muted text-pretty">
          {bindOrphans(
            "futur•e vous aide à identifier les territoires les plus compatibles avec votre projet de vie, en révélant les compromis entre climat, santé, cadre de vie, mobilité et accès aux services.",
          )}
        </p>
```

- [ ] **Step 2: Compteur de micro-réassurance**

Remplacer le bloc `<p>` du compteur (ligne ~654-659) :

```tsx
      {/* ── Micro-réassurance (crédibilité du socle de données) ── */}
      <p className="mt-3 text-[12px] leading-[1.7] text-ghost">
        Près de 30 critères publics croisés sur les 34 000 communes de France
        métropolitaine, avec les projections climatiques à l&apos;horizon 2050 :
        chaleur, inondations, qualité de l&apos;air, bruit et risques industriels,
        mais aussi soins, mobilité, services et vie locale.
      </p>
```

- [ ] **Step 3: Chips `EXAMPLES`**

Remplacer le tableau `EXAMPLES` (lignes ~61-66) par le set final validé (exemple avec le corpus complet, à réduire au set retenu) :

```tsx
const EXAMPLES = [
  "Je veux vivre sans voiture au quotidien",
  "Une petite ville vivante près de l'océan",
  "Élever mes enfants dans un environnement sain",
  "Un coin calme avec gare et vie étudiante",
  "Rester dans le Sud sans subir les canicules",
  "Une ville qui attire de nouveaux habitants",
  "Près de la nature mais avec des médecins accessibles",
  "Préparer ma retraite dans un climat tempéré",
];
```

- [ ] **Step 4: Phrases machine à écrire `PLACEHOLDER_PHRASES`**

Remplacer le tableau `PLACEHOLDER_PHRASES` (lignes ~72-82) par le set final validé. Conserver le commentaire de discipline au-dessus (mettre à jour la date de validation : `vérifié via la route de parse, 2026-06-05`) :

```tsx
const PLACEHOLDER_PHRASES = [
  "Je cherche une petite ville vivante, avec une gare, des médecins accessibles et un climat supportable l'été.",
  "Nous voulons élever nos enfants loin des sites industriels à risque, sans être isolés des services.",
  "Je voudrais vivre sans voiture, près de l'océan, dans une ville qui attire encore de nouveaux habitants.",
  "Un endroit calme pour la retraite, avec des étudiants, des commerces et peu de risque d'inondation.",
  "Rester dans le Sud, mais éviter les canicules les plus intenses.",
];
```

- [ ] **Step 5: Garde-fou tiret cadratin**

Run: `grep -n "—" src/app/\(public\)/ou-vivre/OuVivreClient.tsx`
Expected: aucune ligne nouvelle introduite par ce patch (le fichier peut en contenir d'avant ; vérifier qu'aucune des 4 zones modifiées n'en a). Si une zone modifiée en contient, la corriger (virgule/deux points).

---

## Task 4: Vérification

**Files:** aucun (vérif)

- [ ] **Step 1: TypeScript**

Run: `npx tsc --noEmit`
Expected: aucune erreur impliquant `OuVivreClient.tsx`. (Le projet peut avoir des erreurs préexistantes ailleurs ; s'assurer qu'aucune nouvelle n'est liée au fichier touché.)

- [ ] **Step 2: ESLint sur le fichier**

Run: `npx eslint "src/app/(public)/ou-vivre/OuVivreClient.tsx"`
Expected: aucune nouvelle erreur/warning sur ce fichier.

- [ ] **Step 3: Rendu live du sous-titre et du compteur**

Run: `curl -s http://localhost:3000/ou-vivre | grep -o "en révélant les compromis"`
Expected: `en révélant les compromis` (le nouveau sous-titre est servi).

Run: `curl -s http://localhost:3000/ou-vivre | grep -o "Près de 30 critères publics"`
Expected: `Près de 30 critères publics`.

- [ ] **Step 4: Sanity chips/placeholder en clair**

Vérifier visuellement dans le navigateur sur `http://localhost:3000/ou-vivre` : les chips affichent le set final, la machine à écrire tourne les nouvelles phrases, aucun débordement de ligne disgracieux des chips (flex-wrap). Cliquer une chip protection (ex. « Élever mes enfants dans un environnement sain ») et confirmer un résultat fort.

- [ ] **Step 5: Commit du patch**

```bash
git add "src/app/(public)/ou-vivre/OuVivreClient.tsx"
git commit -m "feat(texte-richesse): positionnement compatibilite territoriale sur /ou-vivre"
```

---

## Task 5: Finition

- [ ] **Step 1: Invoquer la skill de finition**

REQUIRED SUB-SKILL: `superpowers:finishing-a-development-branch`. Le merge `--ff-only` sur `main` et le push ne se font QUE sur instruction explicite du porteur (« push sur main »).

- [ ] **Step 2: Mémoire**

Mettre à jour la mémoire : noter dans `project_roadmap.md` que le chantier 1 (MAJ texte richesse) est livré, et créer/mettre à jour une mémoire de doctrine de positionnement (« futur•e = site sur les choix de vie qui utilise les risques pour les éclairer ; sous-titre = arbitrage/compromis, compteur = preuve/différenciant ; près de 30 critères, jamais un nombre rond faux »).

---

## Self-Review

**Spec coverage :**
- Thèse positionnement → Tasks 3.1 (sous-titre) + 3.2 (compteur), portée par la doctrine en tête de plan. ✓
- Sous-titre décision → Task 3.1. ✓
- Compteur « près de 30 critères » + preuve → Task 3.2. ✓
- Chips → Tasks 1 + 2 + 3.3. ✓
- Phrases machine à écrire (dont correction « sites industriels à risque ») → Tasks 1 + 2 + 3.4. ✓
- Gate data (parse+match live, signal absent, force+divergence) → Tasks 1 + 2. ✓
- Gate porteur (20-30 sorties) → Task 2. ✓
- Hors-scope (FutureELanding, /comparateur, H1, moteur) → respecté : un seul fichier touché. ✓
- Vérif (tsc, eslint, curl, pas de tiret cadratin) → Tasks 3.5 + 4. ✓

**Placeholder scan :** les libellés de chips/phrases en Task 3 sont le corpus candidat complet, explicitement à réduire au set validé en Task 2 ; ce n'est pas un placeholder mais une dépendance de gate humain assumée. Aucun TODO/TBD. ✓

**Type consistency :** la sonde lit `parsed.preferences[].key`, `parsed.horsMesure[].term`, `out.results[].nom/.compatibility/.reasons`, conformes aux types `ParsedProject` / `MatchOutcome` / `MatchResult` de `src/lib/comparateur-vie.ts`. ✓
