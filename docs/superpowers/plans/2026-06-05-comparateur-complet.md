# Comparaison complète (Pack Décision) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construire la vue de comparaison complète des 3 communes (matrice d'arbitrages, 27 dimensions, 7 thèmes) et la sortie moteur déterministe qui l'alimente.

**Architecture:** Une table unique `DIMENSIONS` (27 dimensions, leur thème, leur clé moteur et leurs paliers absolus) dérive à la fois le regroupement en 7 thèmes et le rendu. Une fonction `buildComparaisonComplete(picks, byInsee)` calcule, pour le trio affiché, un palier incarné absolu par commune (seuils nationaux via `bandIndex`, déjà dans le fichier), un avantage relatif au trio (règle d'égalité sur `COMPROMIS_GAP`), une phrase de synthèse honnête par thème, et un chapeau de divergences. Le résultat est attaché au `MatchOutcome` et rendu par un composant client `ComparaisonCompleteView` en liste empilée par dimension.

**Tech Stack:** TypeScript, Next.js 16 (App Router), React 19, Tailwind v4. Pas de framework de test : vérification par `npx tsc --noEmit`, `npm run lint`, et une sonde HTTP contre le dev server (idiome `scripts/sonde-*.mjs`).

**Spec :** `docs/superpowers/specs/2026-06-05-comparateur-complet-design.md`

**Doctrine non négociable :** aucun chiffre ni jauge affiché ; mot du palier = vérité nationale absolue ; avantage = relatif au trio ; « À égalité » honnête ; pas de tiret cadratin ; pas de récit profond dans la comparaison ; largeur de texte = bloc bordé (pas de `max-w` étroit).

---

## File Structure

- `src/lib/comparateur-vie.ts` (modifier) — types `ComparaisonComplete` & co, table `DIMENSIONS`, ordre `THEME_ORDER`, fonction `buildComparaisonComplete`, champ `comparaisonComplete` sur `MatchOutcome`, appel dans `matchProjects`.
- `scripts/sonde-comparateur-complet.mjs` (créer) — sonde de calibrage sur projets réels.
- `src/app/(public)/ou-vivre/ComparaisonCompleteView.tsx` (créer) — composant de rendu, liste empilée par dimension.
- `src/app/(public)/ou-vivre/OuVivreClient.tsx` (modifier) — nouvel état de vue `"complete"` + entrée temporaire d'aperçu (le paywall est hors périmètre).

Tout le moteur reste dans `comparateur-vie.ts` (fichier déjà central du domaine, on suit le pattern existant `assignSignaux`/`AMBIENT_DIMENSIONS`).

---

## Task 1: Types et table des dimensions

**Files:**
- Modify: `src/lib/comparateur-vie.ts` (ajouter après le bloc `AMBIENT_DIMENSIONS`, vers la ligne 929 ; types près de `MatchOutcome` ligne 231)

- [ ] **Step 1: Ajouter les types de sortie**

Dans `src/lib/comparateur-vie.ts`, juste avant `export type MatchOutcome = {` (ligne 231), insérer :

```typescript
// ── Comparaison complète (Pack Décision, narratif, hors score/tri) ────────────
// Matrice d'arbitrages du trio affiché : 27 dimensions groupées en 7 thèmes stables.
// Mot du palier = ABSOLU (seuils nationaux), avantage = RELATIF au trio. cf. spec
// 2026-06-05-comparateur-complet-design.
export type ComparaisonAvantage =
  | { type: "avantage"; insee: string } // une commune mène nettement
  | { type: "egalite" }; // les trois se rejoignent (ou dimension non directionnelle)

export type ComparaisonCellule = {
  insee: string;
  palier: string; // mot incarné absolu (« Très préservé »)
  qualifier: string | null; // suffixe court non chiffré (« marqué par un axe routier ») ou null
  disponible: boolean; // false = donnée non mesurée pour cette commune
};

export type ComparaisonLigne = {
  id: string; // id de dimension
  label: string; // « Calme sonore »
  avantage: ComparaisonAvantage;
  cellules: ComparaisonCellule[]; // 3, ordre des picks
};

export type ComparaisonTheme = {
  id: string;
  titre: string; // « SANTÉ ENVIRONNEMENTALE »
  synthese: string; // phrase honnête (cf. Task 3)
  lignes: ComparaisonLigne[];
};

export type ComparaisonComplete = {
  themes: ComparaisonTheme[];
  chapeau: string[]; // 0 à 4 libellés courts « ce qui les sépare vraiment »
};
```

- [ ] **Step 2: Déclarer le champ sur `MatchOutcome`**

Dans `export type MatchOutcome`, après `results: MatchResult[];` (ligne 236), ajouter :

```typescript
  // Comparaison complète du trio affiché (Pack Décision). Calculée sur les 3 premiers
  // results, narratif, hors score/tri. cf. buildComparaisonComplete.
  comparaisonComplete: ComparaisonComplete;
```

- [ ] **Step 3: Ajouter la table des dimensions et l'ordre des thèmes**

Après la fermeture de `AMBIENT_DIMENSIONS` (`];` ligne 929), insérer. `key` = clé `subScore` ; `id`/`label`/`themeId` portent le rendu ; `taille_ville` est la seule dimension `special` (taille factuelle, non directionnelle) :

```typescript
// ── Dimensions de la comparaison complète ────────────────────────────────────
// 27 dimensions (la taille de ville fusionne eviter/prefere_grande_ville). Chaque
// dimension porte 3 paliers ABSOLUS [favorable (>=66), intermédiaire, notable (<34)],
// alignés sur les seuils de bandIndex. Mot autoportant, jamais un score. Les paliers
// sont un PREMIER JET éditorial, à calibrer avec le porteur (sonde Task 4).
type ComparaisonDim = {
  id: string;
  label: string;
  themeId: string;
  key: PreferenceKey | "taille_ville"; // "taille_ville" = palier factuel via tailleVille
  paliers: [string, string, string]; // [hi, mid, lo]
};

const THEME_ORDER: { id: string; titre: string }[] = [
  { id: "climat", titre: "Climat" },
  { id: "risques", titre: "Risques naturels" },
  { id: "sante_env", titre: "Santé environnementale" },
  { id: "cadre", titre: "Nature & cadre" },
  { id: "mobilite", titre: "Mobilité" },
  { id: "services", titre: "Services & proximité" },
  { id: "vitalite", titre: "Vitalité & dynamique" },
];

// paliers = placeholder "" ici ; remplis en Task 2 (séparé pour garder les diffs lisibles).
const DIMENSIONS: ComparaisonDim[] = [
  { id: "etes_frais", label: "Étés frais", themeId: "climat", key: "faible_chaleur", paliers: ["", "", ""] },
  { id: "douceur", label: "Douceur du climat", themeId: "climat", key: "douceur_climat", paliers: ["", "", ""] },
  { id: "ensoleillement", label: "Ensoleillement", themeId: "climat", key: "ensoleillement_recherche", paliers: ["", "", ""] },
  { id: "inondation", label: "Inondation", themeId: "risques", key: "faible_risque_inondation", paliers: ["", "", ""] },
  { id: "feu", label: "Feu", themeId: "risques", key: "faible_risque_feu", paliers: ["", "", ""] },
  { id: "pluies", label: "Pluies intenses", themeId: "risques", key: "faible_precip_extremes", paliers: ["", "", ""] },
  { id: "secheresse", label: "Sécheresse", themeId: "risques", key: "faible_secheresse", paliers: ["", "", ""] },
  { id: "air", label: "Air", themeId: "sante_env", key: "air_sain", paliers: ["", "", ""] },
  { id: "calme_sonore", label: "Calme sonore", themeId: "sante_env", key: "calme_sonore", paliers: ["", "", ""] },
  { id: "industrie", label: "Sites industriels", themeId: "sante_env", key: "faible_exposition_industrielle", paliers: ["", "", ""] },
  { id: "agriculture", label: "Agriculture intensive", themeId: "sante_env", key: "faible_pression_agricole", paliers: ["", "", ""] },
  { id: "nature", label: "Espaces naturels", themeId: "cadre", key: "nature", paliers: ["", "", ""] },
  { id: "mer", label: "Mer", themeId: "cadre", key: "proximite_mer", paliers: ["", "", ""] },
  { id: "cadre_calme", label: "Cadre calme", themeId: "cadre", key: "cadre_calme", paliers: ["", "", ""] },
  { id: "sans_voiture", label: "Sans voiture", themeId: "mobilite", key: "faible_dependance_auto", paliers: ["", "", ""] },
  { id: "train", label: "Train / gares", themeId: "mobilite", key: "acces_transports", paliers: ["", "", ""] },
  { id: "tc_quotidien", label: "TC du quotidien", themeId: "mobilite", key: "mobilite_quotidienne", paliers: ["", "", ""] },
  { id: "soins", label: "Soins", themeId: "services", key: "acces_soins", paliers: ["", "", ""] },
  { id: "services", label: "Services", themeId: "services", key: "acces_services", paliers: ["", "", ""] },
  { id: "ecoles", label: "Collèges / lycées", themeId: "services", key: "acces_ecoles", paliers: ["", "", ""] },
  { id: "culture", label: "Culture", themeId: "services", key: "acces_culture", paliers: ["", "", ""] },
  { id: "isolement", label: "Isolement", themeId: "services", key: "eviter_isolement", paliers: ["", "", ""] },
  { id: "emploi", label: "Emploi", themeId: "vitalite", key: "viabilite_emploi", paliers: ["", "", ""] },
  { id: "vie_locale", label: "Vie locale", themeId: "vitalite", key: "vie_locale", paliers: ["", "", ""] },
  { id: "vie_etudiante", label: "Vie étudiante", themeId: "vitalite", key: "vie_etudiante", paliers: ["", "", ""] },
  { id: "demographie", label: "Démographie", themeId: "vitalite", key: "croissance_demographique", paliers: ["", "", ""] },
  { id: "taille_ville", label: "Taille de ville", themeId: "vitalite", key: "taille_ville", paliers: ["", "", ""] },
];
```

- [ ] **Step 4: Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: des erreurs « Property 'comparaisonComplete' is missing » sur CHAQUE objet `MatchOutcome` retourné par `matchProjects` (le retour principal ET les retours anticipés « aucun résultat »). C'est ATTENDU ici, levé en Task 3. Toute AUTRE erreur (sur les nouveaux types eux-mêmes) signale un problème de typage à corriger maintenant.

- [ ] **Step 5: Commit**

```bash
git add src/lib/comparateur-vie.ts
git commit -m "feat(comparateur-complet): types + table des 27 dimensions / 7 themes"
```

---

## Task 2: Paliers incarnés (premier jet éditorial)

**Files:**
- Modify: `src/lib/comparateur-vie.ts` (remplir les `paliers` de `DIMENSIONS` posés en Task 1)

- [ ] **Step 1: Renseigner les paliers de chaque dimension**

Remplacer chaque `paliers: ["", "", ""]` par les libellés ci-dessous (ordre [favorable, intermédiaire, notable]). Direction : `subScore` rend une favorabilité (haut = favorable au sens du critère), donc le 1er palier est toujours le « bon » côté. `taille_ville` est factuel (rempli mais non utilisé tel quel, cf. Task 3 special-case).

```typescript
  // climat
  etes_frais:     ["Étés frais", "Étés tempérés", "Étés chauds"]
  douceur:        ["Climat doux", "Climat contrasté", "Hivers rigoureux"]
  ensoleillement: ["Chaud et ensoleillé", "Ensoleillement modéré", "Frais et humide"]
  // risques (favorable = risque faible)
  inondation:     ["Risque faible", "Risque modéré", "Risque plus marqué"]
  feu:            ["Risque faible", "Risque modéré", "Risque plus marqué"]
  pluies:         ["Peu de pluies intenses", "Pluies intenses modérées", "Pluies intenses fréquentes"]
  secheresse:     ["Sols peu exposés", "Exposition modérée", "Sols exposés"]
  // santé environnementale
  air:            ["Air pur", "Air intermédiaire", "Air plus chargé"]
  calme_sonore:   ["Très préservé", "Modéré", "Exposé"]
  industrie:      ["À l'écart des sites industriels", "Présence industrielle modérée", "Environnement industriel marqué"]
  agriculture:    ["Peu d'agriculture intensive", "Agriculture intensive modérée", "Agriculture intensive marquée"]
  // nature & cadre
  nature:         ["Beaucoup de nature autour", "Nature présente", "Peu de nature autour"]
  mer:            ["En bord de mer", "Proche du littoral", "Loin de la mer"]
  cadre_calme:    ["Cadre paisible", "Cadre intermédiaire", "Cadre dense"]
  // mobilité
  sans_voiture:   ["Peu dépendant de la voiture", "Dépendance modérée", "Voiture indispensable"]
  train:          ["Bien relié par le train", "Desserte ferroviaire modérée", "Peu relié par le train"]
  tc_quotidien:   ["Réseau du quotidien présent", "Desserte partielle", "Peu de transports du quotidien"]
  // services & proximité
  soins:          ["Bon accès aux soins", "Accès intermédiaire", "Accès limité"]
  services:       ["Services accessibles", "Accès intermédiaire", "Services plus éloignés"]
  ecoles:         ["Collèges et lycées bien accessibles", "Accès intermédiaire", "Accès plus limité"]
  culture:        ["Offre culturelle présente", "Offre intermédiaire", "Offre plus limitée"]
  isolement:      ["Bassin de vie bien pourvu", "Bassin de proximité", "Plutôt isolé"]
  // vitalité & dynamique
  emploi:         ["Bassin d'emploi dynamique", "Bassin intermédiaire", "Bassin restreint"]
  vie_locale:     ["Vie locale animée", "Vie locale intermédiaire", "Vie locale plus discrète"]
  vie_etudiante:  ["Forte présence étudiante", "Présence étudiante intermédiaire", "Présence étudiante limitée"]
  demographie:    ["Gagne des habitants", "Population stable", "Perd des habitants"]
  taille_ville:   ["Grande agglomération", "Ville moyenne", "Petite ville ou rural"]
```

(Appliquer dans la table `DIMENSIONS` : par exemple la ligne `etes_frais` devient `{ id: "etes_frais", label: "Étés frais", themeId: "climat", key: "faible_chaleur", paliers: ["Étés frais", "Étés tempérés", "Étés chauds"] },`.)

- [ ] **Step 2: Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: même état qu'en Task 1 step 4 (uniquement les erreurs `comparaisonComplete` manquant sur les retours de `matchProjects`). Aucune NOUVELLE erreur introduite par les libellés.

- [ ] **Step 3: Commit**

```bash
git add src/lib/comparateur-vie.ts
git commit -m "feat(comparateur-complet): paliers incarnes (premier jet, a calibrer)"
```

---

## Task 3: Moteur `buildComparaisonComplete` + branchement

**Files:**
- Modify: `src/lib/comparateur-vie.ts` (nouvelle fonction après `assignSignaux`/`DIMENSIONS` ; appel dans `matchProjects`)

- [ ] **Step 1: Écrire la fonction d'assemblage**

Après la table `DIMENSIONS` (Task 1), ajouter. Les helpers `bandIndex`, `tailleVille`, `calmeSonoreRecit`, `expoIndustrielleRecit`, `COMPROMIS_GAP` existent déjà dans le fichier ; ne pas les redéfinir.

```typescript
// Palier factuel de taille d'agglomération (dimension non directionnelle).
function tailleVillePalier(c: IndexCommune): string {
  const t = tailleVille(c) ?? 0;
  return t >= 100_000 ? "Grande agglomération"
    : t >= 25_000 ? "Ville moyenne"
    : t >= 5_000 ? "Petite ville"
    : "Plutôt rural";
}

// Suffixe court non chiffré pour les dimensions qui portent une source dominante nommable.
// Réutilise les récits existants (sans chiffre) et les abrège en suffixe de palier.
function dimQualifier(dimId: string, c: IndexCommune): string | null {
  if (dimId === "calme_sonore") {
    const src = c.calmeSonore?.sourceDominante;
    return src === "auto" ? "axe routier proche"
      : src === "rail" ? "voie ferrée proche"
      : src === "aeroport" ? "aéroport proche"
      : null;
  }
  if (dimId === "industrie") {
    const src = c.expoIndustrielle?.sourceDominante;
    return src == null ? null
      : (src === "seveso_haut" || src === "seveso_bas") ? "site à risque majeur proche"
      : "site industriel proche";
  }
  return null;
}

const CHAPEAU_SPREAD = 25; // écart min (max-min subScore) pour qu'une dimension « sépare »
const CHAPEAU_MAX = 4;

// Construit la comparaison complète du trio. Déterministe, hors score/tri.
function buildComparaisonComplete(
  picks: MatchResult[],
  byInsee: Map<string, IndexCommune>,
): ComparaisonComplete {
  const trio = picks.slice(0, 3);
  const cols = trio.map((r) => byInsee.get(r.insee) ?? null);

  // subScore par dimension, aligné sur le trio (null = donnée absente pour la commune)
  const rawByDim = new Map<string, (number | null)[]>();
  for (const dim of DIMENSIONS) {
    if (dim.key === "taille_ville") {
      rawByDim.set(dim.id, cols.map((c) => (c ? tailleVille(c) ?? null : null)));
    } else {
      rawByDim.set(dim.id, cols.map((c) => (c ? subScore(dim.key, c) : null)));
    }
  }

  // une ligne par dimension : palier absolu + avantage relatif au trio
  const ligneByDim = new Map<string, ComparaisonLigne>();
  for (const dim of DIMENSIONS) {
    const raw = rawByDim.get(dim.id)!;
    const cellules: ComparaisonCellule[] = trio.map((r, i) => {
      const c = cols[i];
      const s = raw[i];
      if (c == null || s == null) {
        return { insee: r.insee, palier: "Non mesuré ici", qualifier: null, disponible: false };
      }
      const palier = dim.key === "taille_ville" ? tailleVillePalier(c) : dim.paliers[bandIndex(s)];
      return { insee: r.insee, palier, qualifier: dimQualifier(dim.id, c), disponible: true };
    });

    // avantage : taille de ville = jamais directionnel ; sinon meilleure favorabilité,
    // « À égalité » si l'écart leader/2e est sous le seuil OU si tous au même palier.
    let avantage: ComparaisonAvantage = { type: "egalite" };
    if (dim.key !== "taille_ville") {
      const scored = trio
        .map((r, i) => ({ insee: r.insee, s: raw[i] }))
        .filter((x): x is { insee: string; s: number } => x.s != null)
        .sort((a, b) => b.s - a.s);
      if (scored.length >= 2) {
        const gap = scored[0].s - scored[1].s;
        const palierIdx = cellules.filter((c) => c.disponible).map((c) => c.palier);
        const tousMemePalier = new Set(palierIdx).size <= 1;
        if (gap >= COMPROMIS_GAP && !tousMemePalier) {
          avantage = { type: "avantage", insee: scored[0].insee };
        }
      } else if (scored.length === 1) {
        avantage = { type: "avantage", insee: scored[0].insee };
      }
    }
    ligneByDim.set(dim.id, { id: dim.id, label: dim.label, avantage, cellules });
  }

  // thèmes : phrase de synthèse honnête à partir des avantages du thème
  const nomByInsee = new Map(trio.map((r) => [r.insee, r.nom]));
  const themes: ComparaisonTheme[] = THEME_ORDER.map((th) => {
    const lignes = DIMENSIONS.filter((d) => d.themeId === th.id).map((d) => ligneByDim.get(d.id)!);
    const winners = new Map<string, string[]>(); // insee -> labels menés
    for (const l of lignes) {
      if (l.avantage.type === "avantage") {
        const arr = winners.get(l.avantage.insee) ?? [];
        arr.push(l.label.toLowerCase());
        winners.set(l.avantage.insee, arr);
      }
    }
    const ranked = [...winners.entries()].sort((a, b) => b[1].length - a[1].length);
    let synthese: string;
    if (ranked.length === 0) {
      synthese = "Sur ce thème, les trois territoires se ressemblent.";
    } else if (ranked.length === 1) {
      const [insee, labels] = ranked[0];
      synthese = `${nomByInsee.get(insee)} prend l'avantage (${labels.slice(0, 2).join(", ")}).`;
    } else {
      const [a, b] = ranked;
      synthese = `${nomByInsee.get(a[0])} se distingue (${a[1][0]}), ${nomByInsee.get(b[0])} sur ${b[1][0]}.`;
    }
    return { id: th.id, titre: th.titre, synthese, lignes };
  });

  // chapeau : dimensions au plus fort écart dans le trio (outil de navigation)
  const spreads = DIMENSIONS
    .filter((d) => d.key !== "taille_ville")
    .map((d) => {
      const present = rawByDim.get(d.id)!.filter((s): s is number => s != null);
      const spread = present.length >= 2 ? Math.max(...present) - Math.min(...present) : 0;
      return { label: d.label, spread };
    })
    .filter((x) => x.spread >= CHAPEAU_SPREAD)
    .sort((a, b) => b.spread - a.spread)
    .slice(0, CHAPEAU_MAX)
    .map((x) => x.label);

  return { themes, chapeau: spreads };
}
```

- [ ] **Step 2: Brancher dans `matchProjects` (tous les points de retour)**

Dans `matchProjects`, juste après la ligne `assignDecouverte(shownPicks, byInsee, requestedKeys);` (ligne 1894), ajouter :

```typescript
  const comparaisonComplete = buildComparaisonComplete(shownPicks, byInsee);
```

Puis, dans l'objet `MatchOutcome` du retour PRINCIPAL (celui qui porte `results: ...`), ajouter `comparaisonComplete,`.

Enfin, repérer TOUS les autres `return {` de `matchProjects` (les retours anticipés « aucun résultat / aucune commune », par ex. autour de la ligne 1866 avec `results: []`) et ajouter sur chacun un champ vide :

```typescript
    comparaisonComplete: { themes: [], chapeau: [] },
```

Vérifier qu'aucun `return` de `matchProjects` n'omet le champ (la vue ne rend la comparaison que lorsque `results.length > 0`, donc le défaut vide ne s'affiche jamais ; il satisfait juste le type).

- [ ] **Step 3: Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: PASS, zéro erreur (l'erreur attendue des Tasks 1-2 est maintenant résolue, le champ est renseigné).

- [ ] **Step 4: Vérifier le lint**

Run: `npm run lint`
Expected: PASS (pas de nouvelle erreur eslint).

- [ ] **Step 5: Commit**

```bash
git add src/lib/comparateur-vie.ts
git commit -m "feat(comparateur-complet): moteur buildComparaisonComplete + branchement MatchOutcome"
```

---

## Task 4: Sonde de calibrage

**Files:**
- Create: `scripts/sonde-comparateur-complet.mjs`

- [ ] **Step 1: Écrire la sonde**

Calque exact de `scripts/sonde-comparateur-3.mjs` (parse puis match contre le dev server). Imprime le chapeau, et par thème la synthèse + les lignes (palier par commune + avantage). Sert à calibrer les paliers et vérifier les « À égalité ».

```javascript
// Sonde de la comparaison complète : pour des projets réels, imprime le chapeau et,
// par thème, la phrase de synthèse puis chaque dimension (palier par commune + avantage).
// Sert à calibrer les paliers incarnés et la règle d'égalité avec le porteur.
// Prérequis : npm run dev (port 3000). Usage : node scripts/sonde-comparateur-complet.mjs
const BASE = process.env.SONDE_BASE ?? "http://localhost:3000";

const PROJETS = [
  "Un coin calme près de la mer pour ma retraite, avec de bons médecins.",
  "Je cherche une petite ville vivante avec une gare et un climat supportable l'été.",
  "Rester dans le Sud sans subir les canicules, près de la nature.",
];

async function probe(text) {
  const pr = await fetch(`${BASE}/api/comparateur-vie/parse`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!pr.ok) return { text, error: `parse ${pr.status}` };
  const { parsed } = await pr.json();
  const mr = await fetch(`${BASE}/api/comparateur-vie/match`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ parsed }),
  });
  if (!mr.ok) return { text, error: `match ${mr.status}` };
  const out = await mr.json();
  return { text, cc: out.comparaisonComplete, trio: (out.results ?? []).slice(0, 3) };
}

function nom(trio, insee) {
  return trio.find((r) => r.insee === insee)?.nom ?? insee;
}

async function main() {
  for (const text of PROJETS) {
    const r = await probe(text);
    console.log("\n==================================================");
    console.log("PROJET » " + r.text);
    if (r.error) { console.log("  ERREUR:", r.error); continue; }
    console.log("  TRIO : " + r.trio.map((c) => c.nom).join(" · "));
    console.log("  CE QUI LES SÉPARE : " + (r.cc.chapeau.join(" · ") || "(rien de net)"));
    for (const th of r.cc.themes) {
      console.log(`\n  ${th.titre}`);
      console.log(`    » ${th.synthese}`);
      for (const l of th.lignes) {
        const av = l.avantage.type === "avantage" ? `Avantage ${nom(r.trio, l.avantage.insee)}` : "À égalité";
        console.log(`    ${l.label}  [${av}]`);
        for (const cell of l.cellules) {
          const q = cell.qualifier ? `, ${cell.qualifier}` : "";
          console.log(`        ${nom(r.trio, cell.insee)} : ${cell.palier}${q}`);
        }
      }
    }
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Lancer la sonde contre le dev server**

Dans un terminal : `npm run dev` (laisser tourner). Dans un autre :

Run: `node scripts/sonde-comparateur-complet.mjs`
Expected: pour chaque projet, le trio, un chapeau, et les 7 thèmes avec synthèse + lignes. Vérifier à l'oeil : (a) aucun chiffre n'apparaît, (b) les « À égalité » tombent quand les trois partagent un palier, (c) les synthèses ne fabriquent pas de faux gagnant, (d) les paliers incarnés sonnent juste. Noter les ajustements de wording pour la revue porteur (ne pas bloquer le plan dessus).

- [ ] **Step 3: Commit**

```bash
git add scripts/sonde-comparateur-complet.mjs
git commit -m "test(comparateur-complet): sonde de calibrage des paliers et avantages"
```

---

## Task 5: Composant de rendu `ComparaisonCompleteView`

**Files:**
- Create: `src/app/(public)/ou-vivre/ComparaisonCompleteView.tsx`

- [ ] **Step 1: Écrire le composant**

Liste empilée par dimension, style maison (`.glass`, Instrument Serif via les classes existantes, accent orange). Aucune jauge. Respecte la doctrine de largeur (texte remplit le bloc).

```tsx
"use client";

import type { ComparaisonComplete, ComparaisonLigne, MatchResult } from "@/lib/comparateur-vie";

// Comparaison complète (Pack Décision) : matrice d'arbitrages, 7 thèmes stables, palier
// incarné absolu + en-tête d'avantage relatif au trio. Aucun chiffre, aucune jauge.
// Présentation pure de outcome.comparaisonComplete. cf. spec 2026-06-05-comparateur-complet.

type Props = {
  data: ComparaisonComplete;
  trio: MatchResult[]; // pour insee -> nom
  onBack: () => void;
};

function nomByInsee(trio: MatchResult[]): Map<string, string> {
  return new Map(trio.map((r) => [r.insee, r.nom]));
}

function Ligne({ ligne, noms }: { ligne: ComparaisonLigne; noms: Map<string, string> }) {
  const avantage =
    ligne.avantage.type === "avantage"
      ? `Avantage ${noms.get(ligne.avantage.insee) ?? ""}`
      : "À égalité";
  return (
    <div className="py-3 border-t border-black/5 first:border-t-0">
      <div className="flex items-baseline justify-between gap-4 mb-1.5">
        <span className="text-[15px] text-label">{ligne.label}</span>
        <span className="font-mono text-[10px] tracking-[0.12em] uppercase text-accent shrink-0">
          {avantage}
        </span>
      </div>
      <ul className="space-y-0.5">
        {ligne.cellules.map((c) => (
          <li key={c.insee} className="flex items-baseline gap-3 text-[14px]">
            <span className="text-muted w-28 shrink-0">{noms.get(c.insee) ?? ""}</span>
            <span className={c.disponible ? "text-label" : "text-muted italic"}>
              {c.palier}
              {c.qualifier ? <span className="text-muted">, {c.qualifier}</span> : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ComparaisonCompleteView({ data, trio, onBack }: Props) {
  const noms = nomByInsee(trio);
  return (
    <div className="pt-10">
      <button
        onClick={onBack}
        className="font-mono text-[11px] tracking-[0.1em] text-muted hover:text-label mb-6 inline-flex items-center gap-2"
      >
        <span aria-hidden>←</span> Revenir aux territoires
      </button>

      <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-accent mb-3">
        Comparaison complète
      </p>
      <h2 className="font-normal text-[clamp(24px,3.4vw,34px)] leading-[1.15] tracking-[-0.6px] text-label mb-7">
        Les trois territoires, sur tous les critères
      </h2>

      {data.chapeau.length > 0 && (
        <div className="glass rounded-2xl px-6 py-5 mb-8">
          <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted mb-2">
            Ce qui les sépare vraiment
          </p>
          <p className="text-[16px] text-label">{data.chapeau.join(" · ")}</p>
        </div>
      )}

      <div className="space-y-6">
        {data.themes.map((th) => (
          <section key={th.id} className="glass rounded-2xl px-6 py-6">
            <h3 className="font-mono text-[11px] tracking-[0.14em] uppercase text-label mb-2">
              {th.titre}
            </h3>
            <p className="text-[15px] text-muted mb-4">{th.synthese}</p>
            <div>
              {th.lignes.map((l) => (
                <Ligne key={l.id} ligne={l} noms={noms} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: PASS (le composant n'est pas encore importé ; il compile seul). Si `text-muted`/`text-label`/`text-accent`/`.glass` n'existent pas comme classes, c'est faux : elles sont déjà utilisées dans `CompareView.tsx`, donc réutilisables.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(public\)/ou-vivre/ComparaisonCompleteView.tsx
git commit -m "feat(comparateur-complet): vue liste empilee par dimension"
```

---

## Task 6: Branchement de la vue (entrée d'aperçu, paywall hors périmètre)

**Files:**
- Modify: `src/app/(public)/ou-vivre/OuVivreClient.tsx` (état de vue + rendu + entrée temporaire)

Le déverrouillage payant est une spec séparée. Ici on rend la vue ATTEIGNABLE pour pouvoir la voir (ordre imposé : construire la comparaison d'abord). Entrée temporaire d'aperçu depuis la CompareView.

- [ ] **Step 1: Élargir l'état de vue**

Ligne 151, remplacer :

```typescript
  const [view, setView] = useState<"results" | "compare">("results");
```

par :

```typescript
  const [view, setView] = useState<"results" | "compare" | "complete">("results");
```

- [ ] **Step 2: Importer le composant**

Près de l'import de `CompareView` (ligne 14), ajouter :

```typescript
import { ComparaisonCompleteView } from "./ComparaisonCompleteView";
```

- [ ] **Step 3: Rendre la vue complète**

Juste avant le bloc `if (view === "compare" && outcome?.results?.length) {` (ligne 608), ajouter :

```tsx
  if (view === "complete" && outcome?.results?.length) {
    return (
      <main className="mx-auto max-w-[920px] px-5 pb-24">
        <ComparaisonCompleteView
          data={outcome.comparaisonComplete}
          trio={topCards(outcome.results)}
          onBack={() => setView("results")}
        />
      </main>
    );
  }
```

(Vérifier le conteneur de page réellement utilisé par le bloc `compare` voisin et calquer son wrapper/`max-w` exact plutôt que de présumer `max-w-[920px]`.)

- [ ] **Step 4: Ajouter l'entrée temporaire d'aperçu dans la CompareView**

Dans le rendu de `<CompareView ... />` (ligne 611), la prop `onPackDecision` déclenche aujourd'hui la waitlist. Pour l'aperçu, ajouter un déclencheur secondaire. Repérer dans `CompareView.tsx` le placeholder Pack Décision (`onPackDecision`) et ajouter à côté un lien d'aperçu. Le plus simple sans toucher l'UX existante : passer une nouvelle prop optionnelle `onPreviewComplete?: () => void` à `CompareView`, l'afficher comme petit lien mono sous le placeholder (« Voir la comparaison complète (aperçu) »), et la câbler ici :

Dans `OuVivreClient.tsx`, sur `<CompareView ...>` ajouter :

```tsx
          onPreviewComplete={() => setView("complete")}
```

Dans `CompareView.tsx`, ajouter à `Props` :

```typescript
  onPreviewComplete?: () => void;
```

et dans la signature `export function CompareView({ results, onBack, onExploreReport, onPackDecision, onPreviewComplete }: Props)`, puis près du placeholder Pack Décision :

```tsx
      {onPreviewComplete && (
        <button
          onClick={onPreviewComplete}
          className="font-mono text-[11px] tracking-[0.1em] text-accent hover:underline mt-4"
        >
          Voir la comparaison complète (aperçu) →
        </button>
      )}
```

- [ ] **Step 5: Vérifier compilation + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: PASS, zéro erreur.

- [ ] **Step 6: Vérifier dans le navigateur**

Avec `npm run dev` : sur `/ou-vivre`, lancer une recherche réelle, ouvrir « Comparer ces territoires », cliquer « Voir la comparaison complète (aperçu) ». Vérifier : les 7 thèmes s'affichent dans l'ordre, chaque dimension a un palier par commune + un en-tête d'avantage ou « À égalité », le chapeau s'affiche, aucun chiffre ni jauge, le bouton retour fonctionne, et le rendu est correct en largeur mobile.

- [ ] **Step 7: Commit**

```bash
git add src/app/\(public\)/ou-vivre/OuVivreClient.tsx src/app/\(public\)/ou-vivre/CompareView.tsx
git commit -m "feat(comparateur-complet): vue atteignable via apercu (paywall hors scope)"
```

---

## Notes de fin de plan

- **Calibrage éditorial** : les paliers (Task 2), les phrases de synthèse (Task 3) et le seuil `CHAPEAU_SPREAD` sont un premier jet. Après Task 4/Task 6, faire une passe avec le porteur sur quelques trios témoins (montagne, littoral, périurbain) et ajuster les mots, comme pour `sonde-comparateur-3`.
- **Hors périmètre rappelé** : serrure du paywall, AskFuture du pack, 3 nouvelles pistes, teaser de conversion. L'entrée d'aperçu de Task 6 est temporaire et sera remplacée par le déverrouillage payant dans sa propre spec.
- **Frontière** : aucun récit profond (héritage, littoral, pression éco) n'est rendu ici ; ils restent au rapport. Le chapeau V1 est piloté par l'écart de subScore ; l'augmentation narrative du chapeau (spec §8) est un raffinement à ajouter si la sonde montre des trios homogènes mal couverts.
```
