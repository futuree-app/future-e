# Face 1 Logement — socle « niveaux de preuve et lecture thermique » — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter à la Face 1 du module Logement une section « Faire face à la chaleur » qui lit le DPE attribué et rend trois niveaux de preuve (A logement / B1 bâtiment / C non qualifiable), en lecture pure.

**Architecture:** Une lib pure `thermal-evidence` dérive un niveau de preuve déterministe depuis le `DpeRecord` attribué (règle ordonnée : méthode × attribution × champs, la méthode prime). Un composant `ThermalComfortSection` rend l'ossature asymétrique (conclusion + preuves / à-confirmer statut / climat futur en face ; source + limites au tiroir). L'intégration dans `LogementModule` alimente la section depuis le DPE confirmé uniquement, et la synthèse reçoit un résumé descriptif sous le même verrou.

**Tech Stack:** TypeScript, React (Next.js App Router), `node --test --experimental-strip-types` pour les libs pures, Tailwind + styles inline (patterns `ReportSection`/`GlassCard`/`Disclosure` existants).

## Global Constraints

- **Lecture pure, id BAN exact seulement.** Aucun repli `getDpeByCoordinates`, aucune écriture, aucun bouton actif. `B2_NEARBY_UNCONFIRMED` et `ConfirmationState ∈ {UNCONFIRMED, CONFIRMED, CORRECTED}` sont RÉSERVÉS spec B et jamais produits ici.
- **Le jugement est attribué au DPE**, jamais à futur•e : toujours « indicateur réglementaire de confort d'été **du DPE** ».
- **La méthode prime** : un DPE immeuble-généré → B1 même si le bloc confort est présent. Un DPE bâtiment n'est jamais présenté comme propre au logement.
- **Chips descriptives** issues de la source, positives OU négatives, **jamais** une appréciation (`Très protecteur`, `Résilient` interdits), **max 4** en face.
- **`DPE : {classe}` interdit** dans le bloc chaleur (classe globale = consommation/émissions, hors sujet).
- **Aucune température intérieure prédite, aucun horizon 2030/2050/2100 chiffré** dans la section. Climat futur = phrase qualitative de croisement, **aucun chiffre DRIAS**.
- **Étage / position sous toiture jamais déduits** automatiquement (donnée publique non fiable).
- Le lien « Voir la trajectoire climatique de {commune} » est **prop-driven optionnel, NON câblé dans ce socle** (cible Territoire à confirmer plus tard). La section rend la phrase seule.
- Convention de test des libs pures : `import test from "node:test"; import assert from "node:assert/strict";`, imports en `.ts`, exécution `node --test --experimental-strip-types src/lib/<fichier>.test.ts`.
- Vérification finale globale : `npx tsc --noEmit` + `npx eslint` + `npm run build`.

---

### Task 1: Étendre la lecture DPE (champs confort + enveloppe + méthode)

**Files:**
- Modify: `src/lib/dpe-attribution.ts` (type `DpeRecord`, ~lignes 7-21)
- Modify: `src/lib/dpe.ts` (`SELECT_LOGEMENT` ~89-104, `ApiRecord` ~106-121, `toRecord` ~123-139 ; `toRecordLegacy` ~39-55 met les nouveaux champs à `null`)

**Interfaces:**
- Produces: `DpeRecord` gagne les champs optionnels normalisés consommés par la Task 2 :
  `confort_ete: "bon" | "moyen" | "insuffisant" | null`,
  `traversant: boolean | null`, `protection_solaire: boolean | null`,
  `ventilation: string | null`, `inertie: string | null`,
  `isolation_toiture: string | null`, `brasseur_air: boolean | null`,
  `isolation_murs: string | null`, `isolation_menuiseries: string | null`,
  `methode_dpe: string | null`.

- [ ] **Step 1: Ajouter les champs au type `DpeRecord`**

Dans `src/lib/dpe-attribution.ts`, à la fin du type `DpeRecord` (après `complement: string | null;`) :

```ts
  // Bloc confort d'été + enveloppe + méthode (lecture thermique, Face 1). Normalisés à la
  // lecture (toRecord) : booléens pour les champs 0/1, chaînes brutes ADEME sinon.
  confort_ete: "bon" | "moyen" | "insuffisant" | null;
  traversant: boolean | null;
  protection_solaire: boolean | null;
  ventilation: string | null;
  inertie: string | null;
  isolation_toiture: string | null;
  brasseur_air: boolean | null;
  isolation_murs: string | null;
  isolation_menuiseries: string | null;
  methode_dpe: string | null;
```

- [ ] **Step 2: Étendre `SELECT_LOGEMENT`**

Dans `src/lib/dpe.ts`, remplacer le tableau `SELECT_LOGEMENT` (lignes ~89-104) par :

```ts
const SELECT_LOGEMENT = [
  "numero_dpe",
  "identifiant_ban",
  "etiquette_dpe",
  "etiquette_ges",
  "adresse_ban",
  "annee_construction",
  "surface_habitable_logement",
  "type_batiment",
  "numero_etage_appartement",
  "complement_adresse_logement",
  "date_etablissement_dpe",
  "conso_5_usages_par_m2_ep",
  "emission_ges_5_usages_par_m2",
  "indicateur_confort_ete",
  "logement_traversant",
  "protection_solaire_exterieure",
  "type_ventilation",
  "classe_inertie_batiment",
  "isolation_toiture",
  "presence_brasseur_air",
  "qualite_isolation_murs",
  "qualite_isolation_menuiseries",
  "methode_application_dpe",
  "_geopoint",
].join(",");
```

- [ ] **Step 3: Étendre `ApiRecord`**

Dans `src/lib/dpe.ts`, ajouter au type `ApiRecord` (avant `_geopoint`) :

```ts
  indicateur_confort_ete?: string | null;
  logement_traversant?: string | number | null;
  protection_solaire_exterieure?: string | number | null;
  type_ventilation?: string | null;
  classe_inertie_batiment?: string | null;
  isolation_toiture?: string | null;
  presence_brasseur_air?: string | number | null;
  qualite_isolation_murs?: string | null;
  qualite_isolation_menuiseries?: string | null;
  methode_application_dpe?: string | null;
```

- [ ] **Step 4: Normaliser dans `toRecord`**

Dans `src/lib/dpe.ts`, ajouter un helper au-dessus de `toRecord` puis mapper les champs. Insérer avant `function toRecord` :

```ts
// 0/1 ADEME -> booléen ; null si non renseigné. Tolère string ("1") ou number (1).
function toBool01(v: string | number | null | undefined): boolean | null {
  if (v == null || v === "") return null;
  return String(v) === "1";
}

function toConfort(v: string | null | undefined): DpeRecord["confort_ete"] {
  return v === "bon" || v === "moyen" || v === "insuffisant" ? v : null;
}
```

Puis dans le `return` de `toRecord`, après `complement: r.complement_adresse_logement ?? null,` :

```ts
    confort_ete:          toConfort(r.indicateur_confort_ete),
    traversant:           toBool01(r.logement_traversant),
    protection_solaire:   toBool01(r.protection_solaire_exterieure),
    ventilation:          r.type_ventilation ?? null,
    inertie:              r.classe_inertie_batiment ?? null,
    isolation_toiture:    r.isolation_toiture ?? null,
    brasseur_air:         toBool01(r.presence_brasseur_air),
    isolation_murs:       r.qualite_isolation_murs ?? null,
    isolation_menuiseries: r.qualite_isolation_menuiseries ?? null,
    methode_dpe:          r.methode_application_dpe ?? null,
```

- [ ] **Step 5: Compléter `toRecordLegacy` (nouveaux champs à null)**

Dans `src/lib/dpe.ts`, dans le `return` de `toRecordLegacy`, après `complement: null,` :

```ts
    confort_ete: null, traversant: null, protection_solaire: null, ventilation: null,
    inertie: null, isolation_toiture: null, brasseur_air: null, isolation_murs: null,
    isolation_menuiseries: null, methode_dpe: null,
```

- [ ] **Step 6: Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected: PASS (aucune erreur ; les nouveaux champs sont obligatoires sur `DpeRecord`, donc tsc force les deux `toRecord*` à les fournir — c'est la vérification).

- [ ] **Step 7: Commit**

```bash
git add src/lib/dpe-attribution.ts src/lib/dpe.ts
git commit -m "feat(logement): lecture DPE étendue (bloc confort d'été + enveloppe + méthode)"
```

---

### Task 2: Lib pure `thermal-evidence` (dérivation + résumé synthèse) — TDD

**Files:**
- Create: `src/lib/thermal-evidence.ts`
- Test: `src/lib/thermal-evidence.test.ts`

**Interfaces:**
- Consumes: `DpeRecord` (Task 1).
- Produces:
  ```ts
  type ThermalEvidenceLevel = "A_EXACT_UNIT" | "B1_EXACT_BUILDING" | "B2_NEARBY_UNCONFIRMED" | "C_NO_DATA";
  type ThermalFactor = { key: string; label: string; polarity: "favorable" | "defavorable" | "neutre" };
  type ThermalEvidence = {
    level: ThermalEvidenceLevel;
    indicator: "bon" | "moyen" | "insuffisant" | null;
    methodWording: "immeuble" | "individuel_sans_bloc" | null;
    factors: ThermalFactor[];       // <= 4, pour les chips en face
    drawerFields: ThermalFactor[];  // débordement, pour le tiroir
  };
  function deriveThermalEvidence(dpe: DpeRecord | null): ThermalEvidence;
  function thermalEvidenceSummary(ev: ThermalEvidence): string; // texte descriptif pour la synthèse
  ```

- [ ] **Step 1: Écrire les tests (échec attendu)**

Créer `src/lib/thermal-evidence.test.ts` :

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { deriveThermalEvidence, thermalEvidenceSummary } from "./thermal-evidence.ts";
import type { DpeRecord } from "./dpe-attribution.ts";

function dpe(over: Partial<DpeRecord>): DpeRecord {
  return {
    id_dpe: "X", date_dpe: "2024-05-01", id_ban: null, adresse: null,
    etiquette_dpe: "D", etiquette_ges: "D", conso_ep_m2: null, emission_ges_m2: null,
    surface_m2: 60, annee_construction: 1990, type_batiment: "appartement", etage: null, complement: null,
    confort_ete: null, traversant: null, protection_solaire: null, ventilation: null,
    inertie: null, isolation_toiture: null, brasseur_air: null, isolation_murs: null,
    isolation_menuiseries: null, methode_dpe: "dpe appartement individuel",
    ...over,
  };
}

test("null -> C_NO_DATA", () => {
  assert.equal(deriveThermalEvidence(null).level, "C_NO_DATA");
});

test("type non résidentiel -> C_NO_DATA", () => {
  assert.equal(deriveThermalEvidence(dpe({ type_batiment: "tertiaire" })).level, "C_NO_DATA");
});

test("individuel + bloc confort présent -> A avec indicateur", () => {
  const ev = deriveThermalEvidence(dpe({ confort_ete: "bon", traversant: true, protection_solaire: true, inertie: "lourde" }));
  assert.equal(ev.level, "A_EXACT_UNIT");
  assert.equal(ev.indicator, "bon");
});

test("A expose les facteurs positifs ET négatifs", () => {
  const ev = deriveThermalEvidence(dpe({ confort_ete: "moyen", traversant: false, protection_solaire: true, inertie: "légère" }));
  const labels = ev.factors.map((f) => f.label);
  assert.ok(labels.some((l) => l.includes("non traversant")));
  const trav = ev.factors.find((f) => f.key === "traversant");
  assert.equal(trav?.polarity, "defavorable");
});

test("A cappe les chips à 4, déborde dans drawerFields", () => {
  const ev = deriveThermalEvidence(dpe({ confort_ete: "bon", traversant: true, protection_solaire: true, inertie: "lourde", ventilation: "VMC SF Hygro B après 2012", brasseur_air: true }));
  assert.ok(ev.factors.length <= 4);
  assert.ok(ev.drawerFields.length >= 1);
});

test("méthode immeuble-généré -> B1 wording immeuble, MÊME avec bloc présent", () => {
  const ev = deriveThermalEvidence(dpe({ methode_dpe: "dpe appartement généré à partir des données DPE immeuble", confort_ete: "bon" }));
  assert.equal(ev.level, "B1_EXACT_BUILDING");
  assert.equal(ev.methodWording, "immeuble");
  assert.equal(ev.indicator, null);
});

test("individuel SANS bloc confort -> B1 wording individuel_sans_bloc", () => {
  const ev = deriveThermalEvidence(dpe({ methode_dpe: "dpe appartement individuel", confort_ete: null, inertie: "moyenne", ventilation: "VMC simple flux" }));
  assert.equal(ev.level, "B1_EXACT_BUILDING");
  assert.equal(ev.methodWording, "individuel_sans_bloc");
});

test("B1 expose les facteurs d'enveloppe (inertie, ventilation, isolation)", () => {
  const ev = deriveThermalEvidence(dpe({ methode_dpe: "dpe appartement généré à partir des données DPE immeuble", inertie: "lourde", ventilation: "VMC SF Hygro B après 2012", isolation_murs: "bonne", isolation_menuiseries: "moyenne" }));
  assert.ok(ev.factors.some((f) => f.key === "inertie"));
  assert.ok(ev.factors.some((f) => f.key === "ventilation"));
});

test("summary attribue au DPE et ne prédit rien (A)", () => {
  const s = thermalEvidenceSummary(deriveThermalEvidence(dpe({ confort_ete: "insuffisant", traversant: false })));
  assert.ok(/DPE/.test(s));
  assert.ok(/insuffisant/.test(s));
});

test("summary C = absence honnête", () => {
  const s = thermalEvidenceSummary(deriveThermalEvidence(null));
  assert.ok(/ne permettent pas|non/i.test(s));
});
```

- [ ] **Step 2: Lancer les tests (échec attendu)**

Run: `node --test --experimental-strip-types src/lib/thermal-evidence.test.ts`
Expected: FAIL (`Cannot find module './thermal-evidence.ts'`).

- [ ] **Step 3: Écrire l'implémentation**

Créer `src/lib/thermal-evidence.ts` :

```ts
// Dérivation PURE du niveau de preuve thermique depuis le DPE attribué. Aucun réseau, pas de
// `server-only` (appelée aussi côté client). Règle ordonnée : méthode × attribution × champs,
// la MÉTHODE PRIME (un DPE immeuble-généré est B1 même s'il porte le bloc confort).

import type { DpeRecord } from "./dpe-attribution.ts";

export type ThermalEvidenceLevel =
  | "A_EXACT_UNIT"
  | "B1_EXACT_BUILDING"
  | "B2_NEARBY_UNCONFIRMED" // réservé spec B, jamais produit ici
  | "C_NO_DATA";

export type ThermalFactor = { key: string; label: string; polarity: "favorable" | "defavorable" | "neutre" };

export type ThermalEvidence = {
  level: ThermalEvidenceLevel;
  indicator: "bon" | "moyen" | "insuffisant" | null;
  methodWording: "immeuble" | "individuel_sans_bloc" | null;
  factors: ThermalFactor[];
  drawerFields: ThermalFactor[];
};

const MAX_CHIPS = 4;

function isResidential(t: string | null): boolean {
  const s = (t ?? "").toLowerCase();
  return s.includes("maison") || s.includes("appartement") || s.includes("appart");
}

function classifyMethod(m: string | null): "immeuble" | "individuel" | "autre" {
  const s = (m ?? "").toLowerCase();
  if (s.includes("immeuble")) return "immeuble";
  if (s.includes("individuel")) return "individuel";
  return "autre";
}

// Inertie : classe ADEME -> polarité. Les valeurs vues : "très lourde", "lourde", "moyenne",
// "légère", "très légère". Favorable = capacité à amortir la chaleur.
function inertiePolarity(v: string): ThermalFactor["polarity"] {
  const s = v.toLowerCase();
  if (s.includes("lourde")) return "favorable";
  if (s.includes("légère") || s.includes("legere")) return "defavorable";
  return "neutre";
}

// Ventilation : type_ventilation ADEME -> libellé court lisible (fallback = valeur brute).
function ventilationLabel(v: string): string {
  const s = v.toLowerCase();
  if (s.includes("double flux")) return "VMC double flux";
  if (s.includes("hygro")) return "VMC hygroréglable";
  if (s.includes("vmc")) return "VMC simple flux";
  if (s.includes("ouverture des fenêtres") || s.includes("naturelle")) return "Ventilation naturelle";
  return v;
}

function boolFactor(key: string, val: boolean | null, favLabel: string, defLabel: string): ThermalFactor | null {
  if (val == null) return null;
  return val
    ? { key, label: favLabel, polarity: "favorable" }
    : { key, label: defLabel, polarity: "defavorable" };
}

function cap(factors: ThermalFactor[]): Pick<ThermalEvidence, "factors" | "drawerFields"> {
  return { factors: factors.slice(0, MAX_CHIPS), drawerFields: factors.slice(MAX_CHIPS) };
}

function empty(level: ThermalEvidenceLevel, methodWording: ThermalEvidence["methodWording"]): ThermalEvidence {
  return { level, indicator: null, methodWording, factors: [], drawerFields: [] };
}

// Facteurs du bloc confort (état A) : traversant, protections, inertie, ventilation, brasseur.
function confortFactors(dpe: DpeRecord): ThermalFactor[] {
  const out: (ThermalFactor | null)[] = [
    boolFactor("traversant", dpe.traversant, "Logement traversant", "Logement non traversant"),
    boolFactor("protection", dpe.protection_solaire, "Protections solaires renseignées", "Protections solaires non renseignées"),
    dpe.inertie ? { key: "inertie", label: `Inertie ${dpe.inertie.toLowerCase()}`, polarity: inertiePolarity(dpe.inertie) } : null,
    dpe.ventilation ? { key: "ventilation", label: ventilationLabel(dpe.ventilation), polarity: "neutre" } : null,
    boolFactor("brasseur", dpe.brasseur_air, "Brasseurs d'air", "Sans brasseur d'air"),
  ];
  return out.filter((f): f is ThermalFactor => f != null);
}

// Facteurs d'enveloppe (état B1) : inertie, ventilation, isolation murs, isolation menuiseries.
function envelopeFactors(dpe: DpeRecord): ThermalFactor[] {
  const out: (ThermalFactor | null)[] = [
    dpe.inertie ? { key: "inertie", label: `Inertie ${dpe.inertie.toLowerCase()}`, polarity: inertiePolarity(dpe.inertie) } : null,
    dpe.ventilation ? { key: "ventilation", label: ventilationLabel(dpe.ventilation), polarity: "neutre" } : null,
    dpe.isolation_murs ? { key: "murs", label: `Isolation des murs : ${dpe.isolation_murs.toLowerCase()}`, polarity: "neutre" } : null,
    dpe.isolation_menuiseries ? { key: "menuiseries", label: `Menuiseries : ${dpe.isolation_menuiseries.toLowerCase()}`, polarity: "neutre" } : null,
  ];
  return out.filter((f): f is ThermalFactor => f != null);
}

export function deriveThermalEvidence(dpe: DpeRecord | null): ThermalEvidence {
  // 1. Aucun DPE résidentiel attribué -> C.
  if (dpe == null || !isResidential(dpe.type_batiment)) return empty("C_NO_DATA", null);

  const method = classifyMethod(dpe.methode_dpe);

  // 2. Méthode immeuble-généré -> B1 (prime, même si le bloc confort est présent).
  if (method === "immeuble") {
    return { level: "B1_EXACT_BUILDING", indicator: null, methodWording: "immeuble", ...cap(envelopeFactors(dpe)) };
  }

  // 3. Bloc confort absent (individuel non renseigné, ou méthode "autre") -> B1.
  if (dpe.confort_ete == null || method !== "individuel") {
    return { level: "B1_EXACT_BUILDING", indicator: null, methodWording: "individuel_sans_bloc", ...cap(envelopeFactors(dpe)) };
  }

  // 4. Méthode individuelle + bloc confort présent -> A.
  return { level: "A_EXACT_UNIT", indicator: dpe.confort_ete, methodWording: null, ...cap(confortFactors(dpe)) };
}

// Résumé descriptif pour la synthèse Logement : attribué au DPE, sans verdict ni prédiction.
export function thermalEvidenceSummary(ev: ThermalEvidence): string {
  if (ev.level === "C_NO_DATA") {
    return "Les données publiques retrouvées ne permettent pas de qualifier le confort d'été de ce logement.";
  }
  const factorList = ev.factors.map((f) => f.label).join(", ");
  if (ev.level === "A_EXACT_UNIT") {
    const head =
      ev.indicator === "insuffisant"
        ? "Le DPE signale une capacité limitée à préserver le confort d'été (conditions conventionnelles d'évaluation)."
        : `Le DPE classe l'indicateur réglementaire de confort d'été de ce logement comme ${ev.indicator}.`;
    return `${head} Caractéristiques renseignées : ${factorList}. Indicateur conventionnel, ne mesure pas la température vécue.`;
  }
  // B1
  const scope =
    ev.methodWording === "immeuble"
      ? "Ce diagnostic reprend principalement des caractéristiques de l'immeuble et ne qualifie pas le confort d'été de ce logement."
      : "Ce diagnostic ne renseigne pas le confort d'été de ce logement.";
  return `${scope} Caractéristiques du bâtiment : ${factorList}.`;
}
```

- [ ] **Step 4: Lancer les tests (succès attendu)**

Run: `node --test --experimental-strip-types src/lib/thermal-evidence.test.ts`
Expected: PASS (10 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/thermal-evidence.ts src/lib/thermal-evidence.test.ts
git commit -m "feat(logement): lib pure thermal-evidence (niveaux A/B1/C + résumé synthèse)"
```

---

### Task 3: Composant `ThermalComfortSection`

**Files:**
- Create: `src/components/report/ThermalComfortSection.tsx`

**Interfaces:**
- Consumes: `ThermalEvidence` + `deriveThermalEvidence` (Task 2), `ReportSection` (`src/components/report/kit`).
- Produces:
  ```ts
  function ThermalComfortSection(props: {
    evidence: ThermalEvidence;
    communeName: string;
    dpeYear: string | null;      // année du DPE attribué, pour le statut "à confirmer" (état A)
    territoireHref?: string;     // NON fourni par le socle -> lien non rendu
  }): JSX.Element
  ```

- [ ] **Step 1: Écrire le composant**

Créer `src/components/report/ThermalComfortSection.tsx` :

```tsx
import React from "react";
import { ReportSection } from "@/components/report/kit";
import type { ThermalEvidence, ThermalFactor } from "@/lib/thermal-evidence";

// Tiroir natif <details> (même pattern que Disclosure de LogementModule), local à cette section.
function Drawer({ summary, children }: { summary: string; children: React.ReactNode }) {
  return (
    <details className="group" style={{ borderTop: "1px solid var(--border-1)", marginTop: 4 }}>
      <summary
        className="[&::-webkit-details-marker]:hidden"
        style={{ cursor: "pointer", listStyle: "none", display: "flex", alignItems: "center", gap: 8, padding: "13px 0", fontSize: 13, fontWeight: 500, color: "var(--fg-3)" }}
      >
        <span className="transition-transform group-open:rotate-90" aria-hidden style={{ display: "inline-block", fontSize: 11, color: "var(--fg-4)" }}>▸</span>
        {summary}
      </summary>
      <div style={{ marginTop: 2, marginBottom: 13, display: "grid", gap: 10, fontSize: 12.5, color: "var(--fg-3)", lineHeight: 1.6 }}>
        {children}
      </div>
    </details>
  );
}

const POLARITY_COLOR: Record<ThermalFactor["polarity"], string> = {
  favorable: "var(--fg-2)",
  defavorable: "var(--fg-3)",
  neutre: "var(--fg-3)",
};

function Chips({ factors }: { factors: ThermalFactor[] }) {
  if (factors.length === 0) return null;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
      {factors.map((f) => (
        <span
          key={f.key}
          style={{
            fontSize: 12.5, padding: "5px 11px", borderRadius: 999,
            border: "1px solid var(--border-1)", background: "var(--bg-elev)",
            color: POLARITY_COLOR[f.polarity],
          }}
        >
          {f.label}
        </span>
      ))}
    </div>
  );
}

function ClimateFuture({ communeName, level }: { communeName: string; level: ThermalEvidence["level"] }) {
  const text =
    level === "A_EXACT_UNIT"
      ? `Avec la progression des nuits chaudes à ${communeName}, les caractéristiques décrites ci-dessus prendront davantage d'importance.`
      : level === "B1_EXACT_BUILDING"
        ? `Avec la progression des nuits chaudes à ${communeName}, les caractéristiques thermiques du bâtiment compteront davantage. La capacité propre de ce logement à évacuer la chaleur reste à documenter.`
        : `Avec la progression des nuits chaudes à ${communeName}, la capacité du logement à limiter puis évacuer la chaleur deviendra plus importante. Les données retrouvées ne permettent pas encore de la qualifier.`;
  return (
    <div style={{ borderTop: "1px solid var(--border-1)", marginTop: 16, paddingTop: 14 }}>
      <div style={{ fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--fg-4)", marginBottom: 6 }}>
        Dans le climat futur
      </div>
      <p style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.6, margin: 0 }}>{text}</p>
    </div>
  );
}

export function ThermalComfortSection({
  evidence, communeName, dpeYear,
}: {
  evidence: ThermalEvidence;
  communeName: string;
  dpeYear: string | null;
  territoireHref?: string;
}) {
  const { level, indicator, methodWording, factors, drawerFields } = evidence;

  return (
    <ReportSection eyebrow="Faire face à la chaleur" tone="accent">
      <div style={{ padding: "4px 0" }}>
        {level === "A_EXACT_UNIT" && (
          <>
            <p style={{ fontSize: 15.5, fontWeight: 500, color: "var(--fg-hi)", lineHeight: 1.5, margin: 0 }}>
              {indicator === "insuffisant"
                ? "Le DPE signale une capacité limitée à préserver le confort d'été dans ses conditions conventionnelles d'évaluation."
                : `Le DPE classe l'indicateur réglementaire de confort d'été de ce logement comme ${indicator}.`}
            </p>
            <p style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.6, marginTop: 6 }}>
              Plusieurs caractéristiques renseignées contribuent à cette évaluation.
            </p>
            <Chips factors={factors} />
            <div style={{ borderTop: "1px solid var(--border-1)", marginTop: 16, paddingTop: 14 }}>
              <div style={{ fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--fg-4)", marginBottom: 6 }}>
                À confirmer
              </div>
              <p style={{ fontSize: 13.5, color: "var(--fg-3)", lineHeight: 1.6, margin: 0 }}>
                Ces caractéristiques proviennent du DPE établi en {dpeYear ?? "sa date d'établissement"}. Elles peuvent avoir changé depuis.
              </p>
            </div>
          </>
        )}

        {level === "B1_EXACT_BUILDING" && (
          <>
            <p style={{ fontSize: 15.5, fontWeight: 500, color: "var(--fg-hi)", lineHeight: 1.5, margin: 0 }}>
              Ce que le diagnostic décrit du bâtiment
            </p>
            <Chips factors={factors} />
            <p style={{ fontSize: 13.5, color: "var(--fg-3)", lineHeight: 1.6, marginTop: 14 }}>
              {methodWording === "immeuble"
                ? "Ce diagnostic reprend principalement des caractéristiques de l'immeuble. Elles ne permettent pas de qualifier précisément le confort d'été de ce logement."
                : "Ce diagnostic ne renseigne pas le confort d'été de ce logement."}
            </p>
          </>
        )}

        {level === "C_NO_DATA" && (
          <>
            <p style={{ fontSize: 15.5, fontWeight: 500, color: "var(--fg-hi)", lineHeight: 1.5, margin: 0 }}>
              Les données publiques retrouvées ne permettent pas de qualifier le confort d'été de ce logement.
            </p>
            <p style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.6, marginTop: 8 }}>
              La position sous toiture, les protections solaires et la capacité du logement à se rafraîchir la nuit permettraient d'affiner cette lecture.
            </p>
            <Drawer summary="Pourquoi cette information manque-t-elle ?">
              <p style={{ margin: 0 }}>
                Aucun diagnostic de performance énergétique attribuable à cette adresse, ou suffisamment renseigné, n'a été retrouvé dans les données publiques. Ce n'est pas une anomalie : la couverture des DPE reste partielle.
              </p>
            </Drawer>
          </>
        )}

        <ClimateFuture communeName={communeName} level={level} />

        {(level === "A_EXACT_UNIT" || level === "B1_EXACT_BUILDING") && (
          <Drawer summary="Comprendre cette lecture">
            <div>
              <div style={{ fontWeight: 500, color: "var(--fg-2)", marginBottom: 4 }}>D'où vient cette lecture ?</div>
              <p style={{ margin: 0 }}>
                {level === "A_EXACT_UNIT"
                  ? `Diagnostic individuel attribué à ce logement${dpeYear ? `, établi en ${dpeYear}` : ""}. L'indicateur « bon / moyen / insuffisant » est celui du DPE, pas une catégorie calculée par futur•e. Source : ADEME (base DPE logements existants).`
                  : `Diagnostic attribué à cette adresse${dpeYear ? `, établi en ${dpeYear}` : ""}${methodWording === "immeuble" ? ", à partir des caractéristiques de l'immeuble" : ""}. Champs utilisés : ${drawerFields.concat(factors).map((f) => f.label).join(", ") || "aucun renseigné"}. Source : ADEME.`}
              </p>
            </div>
            <div>
              <div style={{ fontWeight: 500, color: "var(--fg-2)", marginBottom: 4 }}>Ce qu'elle ne permet pas de conclure</div>
              <p style={{ margin: 0 }}>
                Aucune température intérieure mesurée, aucun contrôle de l'état actuel des équipements, aucune prédiction du confort en 2030, 2050 ou 2100, aucune prise en compte du comportement réel des occupants.
              </p>
            </div>
            {drawerFields.length > 0 && level === "A_EXACT_UNIT" && (
              <div>
                <div style={{ fontWeight: 500, color: "var(--fg-2)", marginBottom: 4 }}>Autres caractéristiques renseignées</div>
                <p style={{ margin: 0 }}>{drawerFields.map((f) => f.label).join(", ")}.</p>
              </div>
            )}
          </Drawer>
        )}
      </div>
    </ReportSection>
  );
}
```

- [ ] **Step 2: Vérifier compilation + lint**

Run: `npx tsc --noEmit && npx eslint src/components/report/ThermalComfortSection.tsx`
Expected: PASS (aucune erreur).

- [ ] **Step 3: Commit**

```bash
git add src/components/report/ThermalComfortSection.tsx
git commit -m "feat(logement): composant ThermalComfortSection (états A/B1/C + tiroir)"
```

---

### Task 4: Intégration dans `LogementModule` (après le Passeport)

**Files:**
- Modify: `src/components/report/LogementModule.tsx` (imports ~10-14 ; calcul `dpe` ~879 ; rendu après Passeport ~977)

**Interfaces:**
- Consumes: `deriveThermalEvidence` (Task 2), `ThermalComfortSection` (Task 3), la variable locale `dpe` (DPE attribué ou null) et `address.city` déjà présentes.

- [ ] **Step 1: Ajouter les imports**

Dans `src/components/report/LogementModule.tsx`, après l'import de `DpeSelector` (~ligne 13) :

```ts
import { ThermalComfortSection } from "@/components/report/ThermalComfortSection";
import { deriveThermalEvidence } from "@/lib/thermal-evidence";
```

- [ ] **Step 2: Dériver l'évidence thermique**

Juste après la ligne `const dpe = (dpeStatus === "auto_confirmed" || dpeStatus === "confirmed") ? selectedDpe : null;` (~879), ajouter :

```ts
  const thermalEvidence = deriveThermalEvidence(dpe);
  const communeName = address?.city ?? defaultCommune ?? "cette commune";
  const dpeYear = dpe?.date_dpe ? dpe.date_dpe.slice(0, 4) : null;
```

- [ ] **Step 3: Monter la section après le Passeport**

Localiser le rendu du Passeport (commentaire `{/* Passeport du bien : identité au grain adresse, DPE en sceau. */}` ~977) et son composant `<PasseportLogement ... />`. Immédiatement APRÈS la fermeture de ce composant, insérer :

```tsx
          <ThermalComfortSection
            evidence={thermalEvidence}
            communeName={communeName}
            dpeYear={dpeYear}
          />
```

(Ne pas passer `territoireHref` : le lien n'est pas câblé dans le socle.)

- [ ] **Step 4: Vérifier compilation + lint + build**

Run: `npx tsc --noEmit && npx eslint src/components/report/LogementModule.tsx && npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/report/LogementModule.tsx
git commit -m "feat(logement): monte la lecture thermique en Face 1 (DPE attribué uniquement)"
```

---

### Task 5: Alimenter la synthèse Logement (sous verrou confirmé)

**Files:**
- Modify: `src/app/api/synthesize-logement/route.ts` (bloc `dpe:` ~79-89)

**Interfaces:**
- Consumes: `deriveThermalEvidence`, `thermalEvidenceSummary` (Task 2), `data.selectedDpe` + `data.dpeSelectionStatus` déjà reçus.

- [ ] **Step 1: Importer la lib**

En tête de `src/app/api/synthesize-logement/route.ts`, avec les autres imports :

```ts
import { deriveThermalEvidence, thermalEvidenceSummary } from "@/lib/thermal-evidence";
```

- [ ] **Step 2: Ajouter le résumé thermique sous le même verrou**

Le bloc existant construit `dpe: (data.dpeSelectionStatus === "auto_confirmed" || "user_confirmed") && data.selectedDpe ? {...} : ...`. Ajouter, à côté de ce bloc `dpe`, un champ `confortEte` calculé sous la même condition de verrou :

```ts
      confortEte:
        (data.dpeSelectionStatus === "auto_confirmed" || data.dpeSelectionStatus === "user_confirmed") && data.selectedDpe
          ? thermalEvidenceSummary(deriveThermalEvidence(data.selectedDpe))
          : null,
```

(Placer cette clé dans le même objet de contexte que `dpe:`. Si le prompt est assemblé plus bas en texte, insérer `confortEte` dans la section descriptive du logement, en texte brut, sans le transformer en verdict.)

- [ ] **Step 3: Vérifier que le prompt n'invente pas de verdict**

Relire le prompt système du fichier : s'assurer qu'aucune consigne ne demande de conclure « le logement sera confortable ». Le résumé est déjà défensif (attribué au DPE, « ne mesure pas la température vécue »). Aucune modification du prompt système si la contrainte y figure déjà ; sinon ajouter une phrase : « L'indicateur de confort d'été est réglementaire et conventionnel ; ne jamais le présenter comme une garantie de confort vécu. »

- [ ] **Step 4: Vérifier compilation + build**

Run: `npx tsc --noEmit && npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/synthesize-logement/route.ts
git commit -m "feat(logement): la synthèse reçoit le résumé confort d'été (verrou DPE confirmé)"
```

---

### Task 6: Vérification finale intégrée

**Files:** aucun (vérification).

- [ ] **Step 1: Suite de tests libs**

Run: `node --test --experimental-strip-types src/lib/thermal-evidence.test.ts src/lib/dpe.test.ts src/lib/dpe-attribution.test.ts`
Expected: PASS (thermal-evidence 10/10 ; dpe + dpe-attribution inchangés, toujours verts).

- [ ] **Step 2: Type + lint + build complet**

Run: `npx tsc --noEmit && npx eslint . && npm run build`
Expected: PASS.

- [ ] **Step 3: (manuel, session payante) Vérifier les 3 états à l'œil**

Adresses de contrôle : (A) une maison avec DPE individuel récent ; (B1) un appartement en immeuble (ex. adresse dense multi-DPE) ; (C) une adresse sans DPE. Vérifier : conclusion attribuée au DPE, chips descriptives ≤4, statut « à confirmer » sans bouton (A), limite « pour le bâtiment » (B1), cadre noble + micro-info (C), bloc climat futur adapté, tiroir « Comprendre cette lecture » fermé par défaut (A/B1).

---

## Self-Review

**Spec coverage :** périmètre socle ✓ (Task 1-5) ; contrat d'état + règle de dérivation ordonnée ✓ (Task 2) ; anatomie asymétrique + 3 états ✓ (Task 3) ; A dynamique bon/moyen/insuffisant ✓ ; chips descriptives cap 4 ✓ ; `DPE:classe` retiré ✓ (jamais rendu) ; statut sans bouton ✓ ; climat futur adapté sans chiffre ✓ ; tiroir source+limites ✓ ; extension lecture DPE ✓ (Task 1) ; synthèse sous verrou ✓ (Task 5) ; hors-socle B2/intake non touchés ✓ ; étage jamais déduit ✓ (aucune lecture de `etage` dans thermal-evidence).

**Placeholder scan :** aucun TBD/TODO ; le lien Territoire est une décision de périmètre explicite (non rendu), pas un placeholder.

**Type consistency :** `deriveThermalEvidence`/`thermalEvidenceSummary`/`ThermalEvidence`/`ThermalFactor` identiques entre Task 2 (déf), Task 3 et Task 5 (conso) ; champs `DpeRecord` de Task 1 (`confort_ete`, `traversant`, `methode_dpe`…) consommés tels quels par Task 2.
