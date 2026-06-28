# Explorer à partir d'une commune — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre à « une ville comme {commune} [+ contraintes] » de produire un trio `/ou-vivre` pertinent, porté par les traits de vie de la commune-ancre, sans jamais calculer de similarité ni changer le moteur.

**Architecture:** Deux ajouts en AMONT du moteur, le reste inchangé. (1) Le LLM du parse extrait une `communeAncre` (label seul). (2) Une dérivation DÉTERMINISTE, dans la route parse APRÈS le LLM, traduit l'ancre en préférences NOMMÉES (signature distinctive + faits identitaires) fusionnées dans le `ParsedProject`. `matchProjects` reçoit un projet déjà enrichi (préférences + `excludePlace`) et ne sait même pas qu'une ancre existait. Aucun score de similarité entre communes.

**Tech Stack:** Next.js (App Router, route handlers `nodejs`), TypeScript, Anthropic tool-use (parse), index national déterministe `data/comparateur-index.json`.

## Global Constraints

- **Doctrine ANCRAGE ≠ similarité** : le mot « similaire » est BANNI en sortie (reformulation), même si l'utilisateur l'emploie en entrée. Aucun score de similarité affiché ni caché (invariant n°2 / ADR-0001).
- **Moteur inchangé** : `matchProjects` n'est PAS modifié. Aucune nouvelle page, sortie = trio `/ou-vivre` habituel.
- **L'ancre n'hérite NI de la région NI du climat** (décision porteur). La géographie reste pilotée par les `zones` explicites ; le climat par ce que l'utilisateur dit.
- **L'explicite écrase le dérivé** en cas de conflit (même `key` de préférence ; taille via `communeSize`/`sizeRelativeTo`).
- **Plusieurs ancres → INTERSECTION** des signatures (ce qu'elles ont en commun), pas l'union. Taille = fourchette englobante.
- **Voix** : vouvoiement, AUCUN tiret cadratin (`—`), pas de point d'exclamation, jamais « résoudre votre choix ». cf. mémoire `feedback_no_em_dash`.
- **Vérification** : pas de framework de test (décision porteur). On vérifie via une route de debug TEMPORAIRE + appels runtime sur le serveur de dev, supprimée en fin de plan.
- **tsc** : une erreur pré-existante `.next/types/validator.ts` (route `suivi-bientot`) est SANS rapport — l'ignorer.

---

### Task 1: Dérivation déterministe ancre → préférences (cœur, dans la lib)

**Files:**
- Modify: `src/lib/comparateur-vie.ts` (ajout d'un bloc après `getCommuneDistinctive`, ~ligne 2282 ; type `ParsedProject` ~ligne 139)
- Create (TEMPORAIRE, supprimée Task 3): `src/app/api/debug-anchor/route.ts`

**Interfaces:**
- Consumes (déjà présents dans le fichier) : `subScore(key, c)`, `tailleVille(c)`, `reasonText(key, c)`, `listFr(items)`, `nameIndex()`, `normalizeName(s)`, types `IndexCommune`, `Preference`, `PreferenceKey`.
- Produces (exporté pour la route parse) :
  - `type AnchorDerivation = { preferences: Preference[]; communeSize: { min: number; max: number } | null; traits: string[] }`
  - `communeToPreferences(entry: IndexCommune): AnchorDerivation`
  - `deriveAnchorPreferences(entries: IndexCommune[]): AnchorDerivation`
  - `resolveCommuneByName(label: string): Promise<IndexCommune | null>`
  - `anchorReformulationSuffix(anchorLabels: string[], traits: string[]): string`
  - champ ajouté à `ParsedProject` : `communeAncre?: { label: string }[]`

- [ ] **Step 1 : Ajouter le champ `communeAncre` au type `ParsedProject`**

Dans `src/lib/comparateur-vie.ts`, dans `export type ParsedProject = { ... }` (~ligne 139), ajouter après `horsMesure?: ...` :

```ts
  // Communes-ANCRES (« une ville comme {commune} »). Le LLM n'extrait que le label ;
  // la dérivation des traits est déterministe, dans la route parse (post-LLM).
  // ANCRAGE, pas similarité : traduit en préférences nommées, jamais en score. cf. Pari #7.
  communeAncre?: { label: string }[];
```

- [ ] **Step 2 : Ajouter le bloc de dérivation après `getCommuneDistinctive`**

Dans `src/lib/comparateur-vie.ts`, juste après la fonction `getCommuneDistinctive` (qui se termine ~ligne 2282, avant le commentaire `// Paris / Lyon / Marseille`), insérer :

```ts
// ════════════════════════════════════════════════════════════════════════════
// Explorer à partir d'une commune (ANCRAGE, pas similarité) — Pari #7.
// On dérive d'une commune-ancre des PRÉFÉRENCES NOMMÉES (signature distinctive +
// faits identitaires) que matchProjects consomme comme n'importe quel projet.
// Aucun score de similarité entre communes. N'hérite NI de la région NI du climat.
// ════════════════════════════════════════════════════════════════════════════

// Critères de « signature » candidats : traits de vie distinctifs, SANS climat (non
// hérité) ni géographie (pilotée par les zones explicites). Liste verrouillée au spec.
const SIGNATURE_KEYS: PreferenceKey[] = [
  "vie_locale", "calme_sonore", "nature", "mobilite_quotidienne",
  "acces_transports", "vie_etudiante", "croissance_demographique",
  "faible_exposition_industrielle",
];
const SIGNATURE_MIN = 70;      // percentile minimal pour qu'un trait « distingue » la commune
const SIGNATURE_MAX_KEYS = 4;  // 1 dominant (poids 3) + jusqu'à 3 secondaires (poids 2)
const ANCRE_COAST_KM = 15;     // au-delà, pas « au bord de la mer » (aligné sur buildSignature)
const ANCRE_SIZE_BAND = 2.5;   // gabarit : [pop/2.5, pop*2.5] autour de la taille d'agglo

// subScore mais SANS ses valeurs par défaut (donnée absente) : on n'invente pas une
// signature à partir d'un champ manquant. Dans subScore, calme_sonore/expo défaut=100,
// vie_locale/mobilite défaut=0 ; ici on les neutralise si la donnée brute manque.
function signatureScore(key: PreferenceKey, c: IndexCommune): number | null {
  switch (key) {
    case "calme_sonore": if (c.calmeSonore?.score == null) return null; break;
    case "faible_exposition_industrielle": if (c.expoIndustrielle?.score == null) return null; break;
    case "mobilite_quotidienne": if (c.reseauLocal?.acces == null) return null; break;
    case "vie_locale": if (c.vieLocale?.score == null) return null; break;
  }
  return subScore(key, c);
}

export type AnchorDerivation = {
  preferences: Preference[];
  communeSize: { min: number; max: number } | null;
  // Phrases humaines == EXACTEMENT les traits dérivés (pour la reformulation honnête).
  traits: string[];
};

// Dérivation déterministe d'UNE commune-ancre. Lit l'index déjà chargé (server-only) :
// l'appelant a résolu le label via resolveCommuneByName, donc loadIndex a tourné.
export function communeToPreferences(entry: IndexCommune): AnchorDerivation {
  const preferences: Preference[] = [];
  const traits: string[] = [];

  // 1) Signature distinctive : critères où la commune se distingue au national.
  const ranked = SIGNATURE_KEYS
    .map((key) => ({ key, s: signatureScore(key, entry) }))
    .filter((x): x is { key: PreferenceKey; s: number } => x.s != null && x.s >= SIGNATURE_MIN)
    .sort((a, b) => b.s - a.s)
    .slice(0, SIGNATURE_MAX_KEYS);
  ranked.forEach((x, i) => {
    preferences.push({ key: x.key, weight: i === 0 ? 3 : 2 });
    traits.push(reasonText(x.key, entry));
  });

  // 2) Faits identitaires évidents. Bord de mer -> proximite_mer (poids selon distance).
  if (entry.distance_cote_km != null && entry.distance_cote_km <= ANCRE_COAST_KM) {
    preferences.push({ key: "proximite_mer", weight: entry.distance_cote_km <= 5 ? 3 : 2 });
    traits.push(reasonText("proximite_mer", entry));
  }

  // 3) Gabarit de taille (taille d'AGGLOMÉRATION), fourchette large autour de l'ancre.
  const pop = tailleVille(entry);
  const communeSize = pop != null
    ? { min: Math.round(pop / ANCRE_SIZE_BAND), max: Math.round(pop * ANCRE_SIZE_BAND) }
    : null;

  return { preferences, communeSize, traits };
}

// Plusieurs ancres (« comme Brest ou Lorient ») -> INTERSECTION des signatures (ce que
// les ancres ont en COMMUN), poids = min (prudence), taille = fourchette englobante.
export function deriveAnchorPreferences(entries: IndexCommune[]): AnchorDerivation {
  if (entries.length === 0) return { preferences: [], communeSize: null, traits: [] };
  if (entries.length === 1) return communeToPreferences(entries[0]);

  const per = entries.map(communeToPreferences);
  const weightsByKey = new Map<PreferenceKey, number[]>();
  for (const d of per) {
    for (const p of d.preferences) {
      const arr = weightsByKey.get(p.key) ?? [];
      arr.push(p.weight);
      weightsByKey.set(p.key, arr);
    }
  }
  const preferences: Preference[] = [];
  const traits: string[] = [];
  for (const [key, weights] of weightsByKey) {
    if (weights.length !== entries.length) continue; // pas partagée par TOUTES les ancres
    preferences.push({ key, weight: Math.min(...weights) });
    traits.push(reasonText(key, entries[0])); // trait partagé, phrasé sur la 1re ancre
  }
  const sizes = per
    .map((d) => d.communeSize)
    .filter((s): s is { min: number; max: number } => s != null);
  const communeSize = sizes.length
    ? { min: Math.min(...sizes.map((s) => s.min)), max: Math.max(...sizes.map((s) => s.max)) }
    : null;
  return { preferences, communeSize, traits };
}

// Résolution nom d'ancre -> entrée d'index (réutilise nameIndex partagé). Paris / Lyon /
// Marseille (index par arrondissement, absents de nameIndex) -> null : ancre ignorée (spec A.5).
export async function resolveCommuneByName(label: string): Promise<IndexCommune | null> {
  const key = normalizeName(label ?? "");
  if (!key) return null;
  const names = await nameIndex();
  return names.get(key) ?? null;
}

// Suffixe de reformulation DÉTERMINISTE : nomme EXACTEMENT les traits dérivés de l'ancre.
// Jamais « similaire », jamais de score. Vouvoiement, pas de tiret cadratin.
export function anchorReformulationSuffix(anchorLabels: string[], traits: string[]): string {
  if (anchorLabels.length === 0) return "";
  const villes = listFr(anchorLabels);
  if (traits.length === 0) {
    return `Vous partez de ${villes}. Voici des communes à explorer dans cet esprit.`;
  }
  const objet = anchorLabels.length > 1 ? "ce que ces villes ont en commun" : `ce qui fait ${anchorLabels[0]}`;
  return `Vous aimez ${villes} pour ${listFr(traits)}. Voici des communes qui portent ${objet}.`;
}
```

- [ ] **Step 3 : Créer la route de debug TEMPORAIRE**

Créer `src/app/api/debug-anchor/route.ts` (sera supprimée en Task 3) :

```ts
// TEMPORAIRE — vérification manuelle de la dérivation d'ancre. Supprimée en fin de plan.
import { NextResponse, type NextRequest } from "next/server";
import {
  resolveCommuneByName,
  deriveAnchorPreferences,
  type IndexCommune,
} from "@/lib/comparateur-vie";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const labels = (req.nextUrl.searchParams.get("q") ?? "")
    .split(",").map((s) => s.trim()).filter(Boolean);
  const entries: IndexCommune[] = [];
  const unresolved: string[] = [];
  for (const l of labels) {
    const e = await resolveCommuneByName(l);
    if (e) entries.push(e); else unresolved.push(l);
  }
  return NextResponse.json({
    resolved: entries.map((e) => e.nom),
    unresolved,
    derivation: deriveAnchorPreferences(entries),
  });
}
```

- [ ] **Step 4 : Lancer le serveur de dev**

Run (en arrière-plan) : `npm run dev`
Attendre « Ready » / « compiled ». Le port par défaut est 3000.

- [ ] **Step 5 : Vérifier la dérivation sur des communes réelles**

Run :
```bash
curl -s "http://localhost:3000/api/debug-anchor?q=Brest" | npx --yes json
curl -s "http://localhost:3000/api/debug-anchor?q=Sare" | npx --yes json   # village rural basque
curl -s "http://localhost:3000/api/debug-anchor?q=Brest,Lorient" | npx --yes json
curl -s "http://localhost:3000/api/debug-anchor?q=Paris" | npx --yes json
```
Attendu :
- `Brest` : `resolved:["Brest"]`, `derivation.preferences` contient `proximite_mer` (poids 2 ou 3) et 1 à 4 traits de signature avec un dominant à poids 3 ; `communeSize` = fourchette autour de la taille d'agglo de Brest (centre ~200 000) ; `traits` = phrases humaines correspondant EXACTEMENT aux préférences, SANS aucun terme climatique.
- `Sare` (village rural) : signature orientée `nature` / calme, `communeSize` étroit autour d'une petite taille ; pas de bruit climatique.
- `Brest,Lorient` : `resolved:["Brest","Lorient"]`, `preferences` = INTERSECTION (uniquement les clés présentes pour les deux), poids = min ; `communeSize` englobe les deux.
- `Paris` : `resolved:[]`, `unresolved:["Paris"]`, `derivation.preferences:[]` (ancre ignorée, spec A.5).

Si la signature contient une clé climatique, ou une clé dont la donnée est absente (ex. `calme_sonore` sur une commune sans calcul), corriger `SIGNATURE_KEYS` / `signatureScore` avant de continuer.

- [ ] **Step 6 : Vérifier la compilation TypeScript**

Run : `npx tsc --noEmit`
Attendu : aucune NOUVELLE erreur. (Ignorer l'erreur pré-existante `.next/types/validator.ts` sur la route `suivi-bientot`, sans rapport.)

- [ ] **Step 7 : Commit**

```bash
git add src/lib/comparateur-vie.ts src/app/api/debug-anchor/route.ts
git commit -m "feat(comparateur): dérivation ancre→préférences (Explorer à partir d'une commune)

communeToPreferences/deriveAnchorPreferences : signature distinctive + faits
identitaires, intersection multi-ancres, sans héritage région/climat. Route de
debug temporaire pour vérif. Pari #7, moteur inchangé.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Extraction de l'ancre par le LLM (schéma + règles SYSTEM du parse)

**Files:**
- Modify: `src/app/api/comparateur-vie/parse/route.ts` (`TOOL_INPUT_SCHEMA` ~ligne 19, `SYSTEM` ~ligne 157)

**Interfaces:**
- Consumes : type `ParsedProject` (champ `communeAncre` ajouté en Task 1).
- Produces : le LLM renvoie désormais `communeAncre: { label }[]` quand l'utilisateur part d'une ville qu'il aime. Aucune dérivation ici (Task 3).

- [ ] **Step 1 : Ajouter `communeAncre` au `TOOL_INPUT_SCHEMA`**

Dans `src/app/api/comparateur-vie/parse/route.ts`, dans `TOOL_INPUT_SCHEMA.properties`, au même niveau que `reformulation` / `hardConstraints` / `preferences` (PAS dans `hardConstraints`), ajouter après le bloc `preferences` (~ligne 120) :

```ts
    communeAncre: {
      type: "array",
      description:
        "Communes-ANCRES : l'utilisateur PART d'une ville qu'il aime / connaît pour en chercher d'autres dans le même esprit. Déclencheurs : « une ville comme {ville} », « dans le genre de {ville} », « le même esprit que {ville} », « à la {ville} », « j'aime {ville}, je veux retrouver ça ailleurs ». DISTINCT de : nearPlace (être PRÈS de la ville), excludePlace (QUITTER la ville), sizeRelativeTo (sa TAILLE relative). Plusieurs ancres possibles (« comme Brest ou Lorient »). « surtout pas comme {ville} » n'est PAS une ancre : ignorez le négatif. Donnez le nom de la ville tel quel, sans décrire ses qualités (le système les calcule).",
      items: {
        type: "object",
        properties: { label: { type: "string" } },
        required: ["label"],
      },
    },
```

- [ ] **Step 2 : Ajouter la section COMMUNE-ANCRE au prompt `SYSTEM`**

Dans le même fichier, dans la constante `SYSTEM`, juste avant la ligne `PRÉFÉRENCES DISPONIBLES (liste fermée)` (~ligne 193), insérer :

```
COMMUNE-ANCRE (communeAncre) : « partir d'une ville qu'on aime »
- Quand l'utilisateur s'appuie sur une ville comme POINT DE DÉPART de ses goûts (« une ville comme Brest », « dans le genre de Lorient », « le même esprit que Bayonne », « j'aime Brest, je veux retrouver ça ailleurs »), ajoutez-la dans communeAncre:[{label:"Brest"}]. Le système en dérivera lui-même des préférences ; vous n'extrayez QUE le label.
- NE DÉCRIVEZ PAS vous-même les qualités de la ville (sa mer, son calme, sa taille) et n'ajoutez aucune préférence à sa place : la dérivation est déterministe et faite après vous. Dans la reformulation, mentionnez la ville sobrement, sans en lister les mérites.
- N'employez JAMAIS le mot « similaire » ni « identique » dans la reformulation, même si l'utilisateur l'emploie.
- Quatre champs VOISINS à ne pas confondre :
  • « comme Brest » = communeAncre (le même effet de vie).
  • « près de Brest » = nearPlace (proximité géographique).
  • « quitter Brest » / « partir de Brest » = excludePlace.
  • « plus petit que Brest » = sizeRelativeTo.
- Une ville peut cumuler les rôles : « une ville comme Brest mais dans le Sud » = communeAncre:[{label:"Brest"}] + zones:[{zone:"sud",strength:"hard"}]. L'ancre ne porte PAS la géographie (« dans le Sud » reste une zone) ni le climat.
- « surtout pas comme Brest » : ce n'est pas une ancre positive. Ne la mettez pas dans communeAncre (ignorez le négatif), ne fabriquez pas d'exclusion à partir d'elle.
```

- [ ] **Step 3 : Relancer le serveur de dev si besoin**

Le serveur de dev recharge le route handler à chaud. Vérifier qu'il a recompilé `parse/route.ts` sans erreur.

- [ ] **Step 4 : Vérifier l'extraction (cas nominal + non-régression)**

Run :
```bash
curl -s -X POST http://localhost:3000/api/comparateur-vie/parse \
  -H 'content-type: application/json' \
  -d '{"text":"une ville comme Brest mais dans le Sud et moins chère"}' | npx --yes json parsed.communeAncre parsed.hardConstraints.zones

curl -s -X POST http://localhost:3000/api/comparateur-vie/parse \
  -H 'content-type: application/json' \
  -d '{"text":"je veux vivre près de Brest, pas trop loin de ma famille"}' | npx --yes json parsed.communeAncre parsed.hardConstraints.nearPlace

curl -s -X POST http://localhost:3000/api/comparateur-vie/parse \
  -H 'content-type: application/json' \
  -d '{"text":"une ville comme Brest ou Lorient, dans le Sud"}' | npx --yes json parsed.communeAncre parsed.hardConstraints.zones
```
Attendu :
- Cas 1 : `communeAncre:[{label:"Brest"}]`, `zones` contient `sud` (force hard), et PAS `nearPlace`.
- Cas 2 (non-régression) : `nearPlace` renseigné, `communeAncre` ABSENT ou vide.
- Cas 3 : `communeAncre` = 2 entrées (Brest, Lorient), `zones` = `sud`, SANS Bretagne.

Si l'extraction confond `communeAncre` et `nearPlace`, renforcer la distinction dans la section SYSTEM avant de continuer.

- [ ] **Step 5 : Commit**

```bash
git add src/app/api/comparateur-vie/parse/route.ts
git commit -m "feat(parse): extraction de la commune-ancre (« une ville comme {ville} »)

Champ communeAncre au schéma tool-use + règles SYSTEM distinguant ancre /
nearPlace / excludePlace / sizeRelativeTo. Le LLM n'extrait que le label ;
la dérivation reste déterministe et postérieure.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Dérivation + fusion dans la route parse (post-LLM) + nettoyage

**Files:**
- Modify: `src/app/api/comparateur-vie/parse/route.ts` (imports ~ligne 12 ; bloc POST avant `return NextResponse.json({ parsed })` ~ligne 301)
- Delete: `src/app/api/debug-anchor/route.ts` (route de debug temporaire de Task 1)

**Interfaces:**
- Consumes : `resolveCommuneByName`, `deriveAnchorPreferences`, `anchorReformulationSuffix`, `type IndexCommune` (Task 1) ; `ParsedProject.communeAncre` (Task 1/2).
- Produces : la réponse de `/parse` renvoie un `ParsedProject` enrichi (préférences dérivées + `communeSize` gabarit + `excludePlace` de l'ancre + reformulation honnête). `matchProjects` (via `/match`) le consomme INCHANGÉ.

- [ ] **Step 1 : Étendre l'import depuis la lib**

Dans `src/app/api/comparateur-vie/parse/route.ts`, remplacer la ligne d'import (~ligne 12) :

```ts
import { PREFERENCE_KEYS, type ParsedProject } from "@/lib/comparateur-vie";
```
par :
```ts
import {
  PREFERENCE_KEYS,
  resolveCommuneByName,
  deriveAnchorPreferences,
  anchorReformulationSuffix,
  type ParsedProject,
  type IndexCommune,
} from "@/lib/comparateur-vie";
```

- [ ] **Step 2 : Insérer le bloc d'ancrage avant le `return`**

Dans la fonction `POST`, remplacer :

```ts
    const parsed = toolBlock.input as ParsedProject;
    return NextResponse.json({ parsed });
```
par :
```ts
    const parsed = toolBlock.input as ParsedProject;

    // ── Ancrage « une ville comme {commune} » ─────────────────────────────────
    // Dérivation DÉTERMINISTE post-LLM : le LLM n'a extrait que le label. On traduit
    // l'ancre en préférences nommées que le moteur conforme consomme. matchProjects
    // reste inchangé. cf. spec 2026-06-28-explorer-depuis-commune-design.md (A.3/A.4/A.5).
    const ancres = Array.isArray(parsed.communeAncre) ? parsed.communeAncre : [];
    if (ancres.length > 0) {
      const resolved: IndexCommune[] = [];
      const unresolved: string[] = [];
      for (const a of ancres) {
        const label = a?.label?.trim();
        if (!label) continue;
        const entry = await resolveCommuneByName(label);
        if (entry) resolved.push(entry);
        else unresolved.push(label);
      }

      if (resolved.length > 0) {
        const deriv = deriveAnchorPreferences(resolved);
        const hc = (parsed.hardConstraints ??= {});
        if (!Array.isArray(parsed.preferences)) parsed.preferences = [];

        // Fusion préférences : l'EXPLICITE écrase le dérivé (même key -> garder l'explicite).
        const explicitKeys = new Set(parsed.preferences.map((p) => p.key));
        for (const p of deriv.preferences) {
          if (!explicitKeys.has(p.key)) parsed.preferences.push(p);
        }

        // Taille : l'explicite (communeSize / sizeRelativeTo) écrase le gabarit dérivé.
        if (deriv.communeSize && !hc.communeSize && !hc.sizeRelativeTo) {
          hc.communeSize = deriv.communeSize;
        }

        // Ancre exclue du trio : ne pas proposer {ville} en réponse à « comme {ville} ».
        // Réutilise l'exclusion d'agglomération existante du moteur (excludePlace).
        hc.excludePlace = [
          ...(hc.excludePlace ?? []),
          ...resolved.map((e) => ({ label: e.nom })),
        ];

        // Transparence : on NOMME exactement les traits dérivés. Jamais « similaire ».
        const suffix = anchorReformulationSuffix(resolved.map((e) => e.nom), deriv.traits);
        if (suffix) parsed.reformulation = `${parsed.reformulation ?? ""} ${suffix}`.trim();
      }

      if (unresolved.length > 0) {
        parsed.reformulation =
          `${parsed.reformulation ?? ""} Je n'ai pas pu lire ${unresolved.join(", ")} ; dites-moi plutôt ce qui compte pour vous.`.trim();
      }
    }

    return NextResponse.json({ parsed });
```

- [ ] **Step 3 : Vérifier le bout-en-bout parse (ancre dérivée)**

S'assurer que le serveur de dev tourne (Task 1 Step 4 ; sinon `npm run dev`). Run :
```bash
curl -s -X POST http://localhost:3000/api/comparateur-vie/parse \
  -H 'content-type: application/json' \
  -d '{"text":"une ville comme Brest mais dans le Sud et moins chère"}' | npx --yes json parsed
```
Attendu :
- `parsed.preferences` contient les préférences dérivées de Brest (signature + `proximite_mer`) EN PLUS de ce que le LLM a mis ; aucune préférence climatique ajoutée par la dérivation.
- `parsed.hardConstraints.zones` contient `sud` (intact), `hardConstraints.communeSize` = gabarit dérivé (puisque ni `communeSize` ni `sizeRelativeTo` explicites), `hardConstraints.excludePlace` contient `{label:"Brest"}`.
- `parsed.reformulation` se termine par la phrase d'ancre nommant EXACTEMENT les traits dérivés ; AUCUN « similaire », aucun tiret cadratin.

- [ ] **Step 4 : Vérifier le bout-en-bout parse → match (trio)**

Run (chaîne parse puis match, la sortie de parse alimente match) :
```bash
P=$(curl -s -X POST http://localhost:3000/api/comparateur-vie/parse \
  -H 'content-type: application/json' \
  -d '{"text":"une ville comme Brest mais dans le Sud et moins chère"}')
echo "$P" | curl -s -X POST http://localhost:3000/api/comparateur-vie/match \
  -H 'content-type: application/json' --data-binary @- | npx --yes json results
```
Attendu : un trio de communes méridionales portant les traits de vie de Brest, **sans Brest ni son agglomération** dans les résultats. Vérifier qu'aucun résultat n'est Brest/Brest-agglo.

- [ ] **Step 5 : Vérifier l'explicite-écrase-le-dérivé et l'ancre introuvable**

Run :
```bash
curl -s -X POST http://localhost:3000/api/comparateur-vie/parse \
  -H 'content-type: application/json' \
  -d '{"text":"une ville comme Brest mais une grande métropole"}' | npx --yes json parsed.hardConstraints parsed.preferences

curl -s -X POST http://localhost:3000/api/comparateur-vie/parse \
  -H 'content-type: application/json' \
  -d '{"text":"une ville comme Paris mais plus au calme"}' | npx --yes json parsed.communeAncre parsed.reformulation parsed.hardConstraints.excludePlace
```
Attendu :
- Cas 1 : `prefere_grande_ville` (explicite) présent et la dérivation de taille de Brest N'A PAS écrasé l'intention « grande ville » (le gabarit dérivé ne doit pas brider vers une taille moyenne quand l'explicite demande grand — vérifier que `communeSize` dérivé n'est pas appliqué si l'utilisateur a exprimé la taille autrement ; si `communeSize`/`sizeRelativeTo` absents mais `prefere_grande_ville` présent, le gabarit dérivé s'applique encore : confirmer que le trio reste cohérent, sinon noter pour calibration porteur).
- Cas 2 : Paris ignorée comme ancre (`excludePlace` ne contient pas Paris via ce chemin), reformulation comporte la note « je n'ai pas pu lire Paris ; dites-moi plutôt ce qui compte pour vous. »

- [ ] **Step 6 : Supprimer la route de debug temporaire**

Run : `rm src/app/api/debug-anchor/route.ts`

- [ ] **Step 7 : Vérifier la compilation et arrêter le serveur de dev**

Run : `npx tsc --noEmit`
Attendu : aucune NOUVELLE erreur (ignorer `.next/types/validator.ts` `suivi-bientot`).
Puis arrêter le serveur de dev.

- [ ] **Step 8 : Commit**

```bash
git add src/app/api/comparateur-vie/parse/route.ts
git rm src/app/api/debug-anchor/route.ts
git commit -m "feat(parse): fusion ancre→préférences post-LLM + reformulation honnête

Résolution du label d'ancre, dérivation déterministe, fusion (explicite écrase
dérivé), exclusion de l'agglo-ancre, suffixe de reformulation nommant les traits
réels (jamais « similaire »). Ancre introuvable annoncée. matchProjects inchangé.
Retire la route de debug temporaire.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review

**1. Spec coverage :**
- A.1 Extraction de l'ancre → Task 2 (schéma `communeAncre` + règles SYSTEM, distinction nearPlace/excludePlace/sizeRelativeTo, polarité négative ignorée). ✓
- A.2 Dérivation ancre → préférences (`communeToPreferences`, signature 3-4 critères poids 3/2, faits identitaires mer + taille UU, PAS de région, PAS de climat, multi-ancres = intersection) → Task 1. ✓
- A.3 Fusion dans le ParsedProject (explicite écrase dérivé, communeSize/taille, zones intactes) → Task 3 Step 2. ✓
- A.4 Transparence (reformulation déterministe nommant les traits, jamais « similaire ») → Task 1 `anchorReformulationSuffix` + Task 3 append. ✓
- A.5 Cas limites (ancre exclue via excludePlace ; ancre introuvable/arrondissement annoncée ; ancre seule) → Task 3 Step 2 + Task 1 `resolveCommuneByName` (PLM → null). ✓
- B (phase 2 guidée) → explicitement hors périmètre (non-but). ✓
- Vérification (unitaire déterministe + parse + bout-en-bout) → adaptée en route de debug + appels runtime (décision porteur : pas de framework). ✓
- Fichiers touchés (comparateur-vie.ts, parse/route.ts ; matchProjects inchangé) → conforme. ✓

**2. Placeholder scan :** aucun « TBD/TODO/handle edge cases » ; tout le code est écrit. Les seuils (`SIGNATURE_MIN`=70, `ANCRE_SIZE_BAND`=2.5, `ANCRE_COAST_KM`=15) sont fixés et nommés (calibrables par le porteur).

**3. Type consistency :** `AnchorDerivation { preferences, communeSize, traits }` produit en Task 1 et consommé en Task 3 ; `resolveCommuneByName`/`deriveAnchorPreferences`/`anchorReformulationSuffix` signatures identiques entre définition (Task 1) et usage (Task 3) ; `communeAncre?: { label: string }[]` cohérent entre type (Task 1), schéma (Task 2) et lecture (Task 3).

**Point de calibration laissé au porteur (signalé, non bloquant) :** la TAILLE dérivée s'applique en `communeSize` (filtre dur, fourchette LARGE). C'est le choix du spec (« fourchette communeSize autour »). Si en test le gabarit dur sur-filtre (peu de résultats dans la zone demandée), élargir `ANCRE_SIZE_BAND` ou rétrograder la taille en préférence souple (`eviter_grandes_villes`/`prefere_grande_ville`). À trancher avec le porteur au vu des trios réels (Task 3 Step 4/5).

---

## Execution Handoff

Plan complet, sauvegardé dans `docs/superpowers/plans/2026-06-28-explorer-depuis-commune.md`.
