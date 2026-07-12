# Dossier de décision slice 1.5 (faits Logement) — Implementation Plan v2

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (exécution inline). Steps en `- [ ]`.

**Goal:** Enrichir le dossier « En une minute » avec les faits Logement au grain adresse (DPE, RGA, PPRN, cavités, patrimoine, sinistralité) quand une analyse logement existe pour la commune active, via une augmentation serveur différée sous `<Suspense>`, avec un statut par famille (présent / rien-trouvé / indisponible), sans ralentir le hub ni figer le statut réglementaire.

**Architecture:** Une lean-fetch `fetchLogementDecisionData` (fetchers bas niveau, statut par famille) ; `ModuleFacts.logement?` ; six règles Logement statut-aware (verification si présent, unknown scopée si indisponible, rien si rien-trouvé ; jamais incompatibility) au MÊME `runRules`/assembleur ; augmentation streamée sous Suspense avec erreur typée (les bugs remontent). La route reste intacte.

**Tech Stack:** TypeScript, Next.js App Router (Server Components, Suspense), tests `node --test`.

**Spec:** `docs/superpowers/specs/2026-07-12-dossier-logement-slice-1-5-design.md` (v2).

## Global Constraints

- **Statut par famille, jamais un booléen qui écrase l'absence.** `unavailable` (panne) → `unknown` scopée. `none` (source a répondu, rien) → aucun fait. `present` → `verification`. Une panne ne devient JAMAIS « aucun risque ».
- **Aucune règle Logement n'émet `incompatibility`** (fabriques + garde runtime + test).
- **Bloc `logement` absent → dossier communal STRICTEMENT inchangé.**
- **Erreur typée** : seule `LogementDataUnavailableError` → `unavailable`. Un bug d'adaptateur/règle/assembleur REMONTE.
- **DPE = fait persisté (`sourceMode: "persisted_snapshot"`)**, réglementaire = `live_fetch` + `observedAt`. `factId` distinct.
- **Faits communs réutilisés** (pas de second `loadModuleFacts`).
- Conventions : imports `.ts` en lib, `@/` en composant/page. FR sans tiret cadratin, sans antithèse « X, pas Y ».
- Piège `server-only` : les libs serveur (`logement-decision-data.ts`) et `DossierAvecLogement` ne sont pas node-testées ; `logement-facts.ts` et `logement-rules.ts` restent purs (imports type-only + `energyState` de `logement-checklist.ts`, pur).

**Vérif :** `npx tsc --noEmit` · `node --test src/lib/decision/*.test.ts` · `npm run build`.

---

## Task 1: Lean-fetch `fetchLogementDecisionData` + erreur typée

**Files:**
- Create: `src/lib/server/logement-decision-data.ts`

**Interfaces produced:** `ResolvedAddress`, `SourceCoverage`, `LogementDecisionData`, `LogementDataUnavailableError`, `fetchLogementDecisionData(address)`, `fetchLogementDecisionDataWithTimeout(address, ms?)`.

**Note:** lib serveur (import de fetchers server-only) → non node-testée (frontière d'intégration, comme `territory-facts`). Vérifiée par tsc + build + comportement (Task 6).

- [ ] **Step 1: Écrire la lib**

Create `src/lib/server/logement-decision-data.ts` :

```ts
// Données de décision Logement (lean) : appelle les fetchers BAS NIVEAU directement, ce qui donne le
// STATUT par famille (present / none / unavailable) — la donnée le porte déjà (heritage.sourceStatus,
// 4 kinds sinistralité, null/[] cavités). Statut réglementaire FRAIS (aucun cache CDN : appel direct).
import { findCadastreParcelByPoint } from "@/lib/cadastre";
import { getGeorisquesAddressSummary, getGeorisquesParcelSummary, fetchCavitesNearPoint } from "@/lib/georisques";
import { fetchHeritageProtections } from "@/lib/gpu";
import { getOnrnSinistralite } from "@/lib/onrn-sinistralite";

export type ResolvedAddress = {
  id: string | null; label: string; city: string | null; citycode: string | null;
  postcode: string | null; latitude: number; longitude: number;
};
export type SourceCoverage = "present" | "none" | "unavailable"; // none = source a répondu, rien trouvé

export type LogementDecisionData = {
  rga: { coverage: SourceCoverage; label: string | null };
  pprn: { coverage: SourceCoverage; count: number };
  cavites: { coverage: SourceCoverage; count: number };
  patrimoine: { coverage: SourceCoverage; count: number };
  sinistralite: { coverage: SourceCoverage; active: boolean };
  fetchedAt: string;
};

export class LogementDataUnavailableError extends Error {
  constructor(public readonly reason: "timeout" | "upstream_error" | "insufficient_address") {
    super(`logement-data-unavailable:${reason}`);
    this.name = "LogementDataUnavailableError";
  }
}

export async function fetchLogementDecisionData(address: ResolvedAddress): Promise<LogementDecisionData> {
  if (address.latitude == null || address.longitude == null) throw new LogementDataUnavailableError("insufficient_address");
  const token = process.env.GEORISQUES_API_TOKEN;
  const parcel = await findCadastreParcelByPoint(address.longitude, address.latitude).catch(() => null);
  const [gAddr, gParcel, cavites, heritage, sini] = await Promise.all([
    token ? getGeorisquesAddressSummary(address.latitude, address.longitude).catch(() => null) : Promise.resolve(null),
    token && parcel?.parcelCode ? getGeorisquesParcelSummary(parcel.parcelCode).catch(() => null) : Promise.resolve(null),
    fetchCavitesNearPoint(address.latitude, address.longitude), // [] vide | [...] | null (panne)
    fetchHeritageProtections(address.latitude, address.longitude).catch(() => ({ items: [], sourceStatus: "unavailable" as const })),
    address.citycode ? getOnrnSinistralite(address.citycode).catch(() => null) : Promise.resolve(null),
  ]);

  const rgaLabel = gParcel?.rga?.label ?? gAddr?.rga?.label ?? null; // champ par champ : parcelle puis adresse
  const plans = gParcel?.regulatoryPlans ?? gAddr?.regulatoryPlans ?? [];
  const georisquesDown = gAddr == null && gParcel == null; // résumé indisponible (token absent ou panne)

  const siniActive = sini != null && [sini.secheresse.kind, sini.inondation.kind].some((k) => k === "lecture" || k === "faible_repr");
  const siniDown = sini == null || (sini.secheresse.kind === "indispo" && sini.inondation.kind === "indispo");

  return {
    rga: { coverage: georisquesDown ? "unavailable" : rgaLabel ? "present" : "none", label: rgaLabel },
    pprn: { coverage: georisquesDown ? "unavailable" : plans.length > 0 ? "present" : "none", count: plans.length },
    cavites: { coverage: cavites == null ? "unavailable" : cavites.length > 0 ? "present" : "none", count: cavites?.length ?? 0 },
    patrimoine: { coverage: heritage.sourceStatus === "unavailable" ? "unavailable" : heritage.items.length > 0 ? "present" : "none", count: heritage.items.length },
    sinistralite: { coverage: siniDown ? "unavailable" : siniActive ? "present" : "none", active: siniActive },
    fetchedAt: new Date().toISOString(),
  };
}

// Timeout d'AFFICHAGE (Promise.race) : les appels sous-jacents continuent (annulation par AbortSignal
// = suite documentée). Rejette avec une erreur typée, seule captée par l'augmentation.
export function fetchLogementDecisionDataWithTimeout(address: ResolvedAddress, ms = 4000): Promise<LogementDecisionData> {
  return Promise.race([
    fetchLogementDecisionData(address).catch((e) => {
      if (e instanceof LogementDataUnavailableError) throw e;
      throw new LogementDataUnavailableError("upstream_error");
    }),
    new Promise<never>((_, reject) => setTimeout(() => reject(new LogementDataUnavailableError("timeout")), ms)),
  ]);
}
```

- [ ] **Step 2: Fraîcheur du cache (audit large)**

`grep -rn "revalidate\|force-cache\|next:" src/lib/{georisques,gpu,onrn-sinistralite,cadastre}.ts`. Si un fetcher réglementaire pose un data-cache Next, ajouter `cache: "no-store"`. Sinon (défaut Next = non caché), ne rien changer et le noter dans le commit.

- [ ] **Step 3: Typecheck + commit**

`npx tsc --noEmit` → 0.

```bash
git add src/lib/server/logement-decision-data.ts
git commit -m "feat(logement): lean-fetch des données de décision (statut par famille + erreur typée)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Contrats + adaptateur `buildLogementFacts`

**Files:**
- Modify: `src/lib/decision/decision-fact.ts`
- Create: `src/lib/decision/logement-facts.ts`
- Create: `src/lib/decision/logement-facts.test.ts`

**Interfaces produced:** `SourceCoverage`, `LogementFacts`, `ModuleFacts.logement?`, `EvidenceRef.sourceMode?/observedAt?`, `buildLogementFacts(data, savedDpe): LogementFacts`.

- [ ] **Step 1: Types dans `decision-fact.ts`**

Ajouter le type et étendre `EvidenceRef` + `ModuleFacts` :

```ts
export type SourceCoverage = "present" | "none" | "unavailable";
```

Dans `EvidenceRef`, ajouter deux champs optionnels (absents sur les preuves Territoire, présents sur Logement) :

```ts
  href?: string;
  sourceMode?: "persisted_snapshot" | "live_fetch";
  observedAt?: string; // pour live_fetch
};
```

Ajouter avant `ModuleFacts` :

```ts
export type LogementFacts = {
  dpe: "passoire" | "energivore" | "correct" | "absent";
  dpeLabel: string | null;
  rga: SourceCoverage; expositionBati: boolean;
  pprn: SourceCoverage; zoneReglementee: boolean;
  cavites: SourceCoverage; caviteProche: boolean;
  patrimoine: SourceCoverage; perimetrePatrimonial: boolean;
  sinistralite: SourceCoverage; sinistraliteActive: boolean;
  addressLabel: string;
};
```

et le champ optionnel dans `ModuleFacts` :

```ts
  hasAddress: boolean;
  logement?: LogementFacts;
};
```

- [ ] **Step 2: Test de l'adaptateur (échoue)**

Create `src/lib/decision/logement-facts.test.ts` :

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { buildLogementFacts } from "./logement-facts.ts";
import type { LogementDecisionData } from "../server/logement-decision-data.ts";
import type { DpeRecord } from "../dpe.ts";

function data(over: Partial<LogementDecisionData> = {}): LogementDecisionData {
  return {
    rga: { coverage: "none", label: null }, pprn: { coverage: "none", count: 0 },
    cavites: { coverage: "none", count: 0 }, patrimoine: { coverage: "none", count: 0 },
    sinistralite: { coverage: "none", active: false }, fetchedAt: "2026-07-12T00:00:00.000Z", ...over,
  };
}

test("DPE depuis l'artefact sauvegardé + label", () => {
  const f = buildLogementFacts(data(), { etiquette_dpe: "G" } as DpeRecord);
  assert.equal(f.dpe, "passoire");
  assert.equal(f.dpeLabel, "G");
});

test("RGA present + label notable -> expositionBati vrai ; coverage transmis", () => {
  const f = buildLogementFacts(data({ rga: { coverage: "present", label: "Aléa moyen" } }), null);
  assert.equal(f.rga, "present");
  assert.equal(f.expositionBati, true);
});

test("RGA present mais label faible -> expositionBati faux", () => {
  const f = buildLogementFacts(data({ rga: { coverage: "present", label: "Aléa faible" } }), null);
  assert.equal(f.expositionBati, false);
});

test("cavités unavailable -> coverage unavailable, booléen faux", () => {
  const f = buildLogementFacts(data({ cavites: { coverage: "unavailable", count: 0 } }), null);
  assert.equal(f.cavites, "unavailable");
  assert.equal(f.caviteProche, false);
});

test("patrimoine present -> perimetrePatrimonial vrai", () => {
  const f = buildLogementFacts(data({ patrimoine: { coverage: "present", count: 2 } }), null);
  assert.equal(f.perimetrePatrimonial, true);
});
```

- [ ] **Step 3: Lancer, vérifier l'échec** — `node --test src/lib/decision/logement-facts.test.ts` → FAIL.

- [ ] **Step 4: Écrire l'adaptateur**

Create `src/lib/decision/logement-facts.ts` :

```ts
// Adaptateur PUR : données de décision (statut par famille) + DPE sauvegardé -> LogementFacts. Sans
// project (faits intrinsèques ; la doctrine projet-relative vit dans les règles). Value-import
// energyState (logement-checklist.ts, pur) ; type-only le reste -> node-testable.
import { energyState } from "../logement-checklist.ts";
import type { LogementDecisionData } from "../server/logement-decision-data.ts";
import type { DpeRecord } from "../dpe.ts";
import type { LogementFacts } from "./decision-fact.ts";

export function buildLogementFacts(data: LogementDecisionData, savedDpe: DpeRecord | null, addressLabel = "cette adresse"): LogementFacts {
  const rgaNotable = data.rga.coverage === "present" && !!data.rga.label && /moyen|fort|élev/i.test(data.rga.label);
  return {
    dpe: energyState(savedDpe?.etiquette_dpe ?? null),
    dpeLabel: savedDpe?.etiquette_dpe ?? null,
    rga: data.rga.coverage, expositionBati: rgaNotable,
    pprn: data.pprn.coverage, zoneReglementee: data.pprn.coverage === "present" && data.pprn.count > 0,
    cavites: data.cavites.coverage, caviteProche: data.cavites.coverage === "present" && data.cavites.count > 0,
    patrimoine: data.patrimoine.coverage, perimetrePatrimonial: data.patrimoine.coverage === "present" && data.patrimoine.count > 0,
    sinistralite: data.sinistralite.coverage, sinistraliteActive: data.sinistralite.coverage === "present" && data.sinistralite.active,
    addressLabel,
  };
}
```

- [ ] **Step 5: Succès + typecheck + commit**

`node --test src/lib/decision/logement-facts.test.ts` → PASS (5). `npx tsc --noEmit` → 0.

```bash
git add src/lib/decision/decision-fact.ts src/lib/decision/logement-facts.ts src/lib/decision/logement-facts.test.ts
git commit -m "feat(decision): LogementFacts (statut par famille) + adaptateur sans project

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Six règles Logement statut-aware + garde runtime

**Files:**
- Create: `src/lib/decision/logement-rules.ts`
- Create: `src/lib/decision/logement-rules.test.ts`
- Modify: `src/lib/decision/materiality-rules.ts` (REGISTRY + garde runtime)

- [ ] **Step 1: Tests (échoue)**

Create `src/lib/decision/logement-rules.test.ts` :

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { runRules } from "./materiality-rules.ts";
import type { ModuleFacts, LogementFacts } from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";

function lf(over: Partial<LogementFacts> = {}): LogementFacts {
  return { dpe: "correct", dpeLabel: null, rga: "none", expositionBati: false, pprn: "none", zoneReglementee: false, cavites: "none", caviteProche: false, patrimoine: "none", perimetrePatrimonial: false, sinistralite: "none", sinistraliteActive: false, addressLabel: "7 Rue du Taur", ...over };
}
function facts(logement?: LogementFacts): ModuleFacts {
  return { insee: "31555", nom: "Toulouse", distanceCoteKm: 150, population: 500000, altitude: 146, catnatInondation: 0, inondationRisque: 10, scores: {}, hasAddress: true, logement };
}
function project(over: Partial<UserProject> = {}): UserProject {
  return { posture: "recherche", intent: null, rawText: null, parsed: { reformulation: "x", hardConstraints: {}, preferences: [] } as UserProject["parsed"], updatedAt: null, ...over };
}

test("bloc logement absent -> aucune règle Logement", () => {
  assert.equal(runRules(facts(undefined), project()).facts.some((f) => f.ruleId.startsWith("logement.")), false);
});

test("DPE passoire -> verification, preuve persisted_snapshot, classe exacte", () => {
  const f = runRules(facts(lf({ dpe: "passoire", dpeLabel: "G" })), project({ intent: "achat" })).facts.find((x) => x.ruleId === "logement.dpe-faible");
  assert.ok(f && f.role === "verification");
  assert.equal(f.evidence[0].sourceMode, "persisted_snapshot");
  assert.match(f.statement, /G/);
  assert.match(f.statement, /passoire/i);
});

test("cavités unavailable -> unknown scopée (n'a pas pu être vérifié), pas verification", () => {
  const r = runRules(facts(lf({ cavites: "unavailable" })), project());
  const f = r.facts.find((x) => x.ruleId === "logement.cavite");
  assert.ok(f && f.role === "unknown");
  assert.equal(f.impact, "scoped");
});

test("cavités none -> aucun fait", () => {
  assert.equal(runRules(facts(lf({ cavites: "none" })), project()).facts.some((x) => x.ruleId === "logement.cavite"), false);
});

test("PPRN present -> verification, preuve live_fetch", () => {
  const f = runRules(facts(lf({ pprn: "present", zoneReglementee: true })), project({ intent: "achat" })).facts.find((x) => x.ruleId === "logement.zone-reglementee");
  assert.ok(f && f.role === "verification");
  assert.equal(f.evidence[0].sourceMode, "live_fetch");
});

test("patrimoine present : pas de fait en location", () => {
  assert.equal(runRules(facts(lf({ patrimoine: "present", perimetrePatrimonial: true })), project({ intent: "location" })).facts.some((x) => x.ruleId === "logement.patrimoine"), false);
});

test("aucune règle Logement n'émet incompatibility", () => {
  const r = runRules(facts(lf({ dpe: "passoire", rga: "present", expositionBati: true, pprn: "present", zoneReglementee: true, cavites: "present", caviteProche: true, patrimoine: "present", perimetrePatrimonial: true, sinistralite: "present", sinistraliteActive: true })), project({ intent: "achat" }));
  assert.equal(r.facts.some((f) => f.ruleId.startsWith("logement.") && f.role === "incompatibility"), false);
});

test("texte posture-aware : achat parle de travaux/fondations, location de bailleur (RGA)", () => {
  const achat = runRules(facts(lf({ rga: "present", expositionBati: true })), project({ intent: "achat" })).facts.find((x) => x.ruleId === "logement.exposition-bati");
  const loc = runRules(facts(lf({ rga: "present", expositionBati: true })), project({ intent: "location" })).facts.find((x) => x.ruleId === "logement.exposition-bati");
  assert.match(achat!.action.label, /fondation|sinistre|antécédent/i);
  assert.match(loc!.action.label, /bailleur/i);
});
```

- [ ] **Step 2: Lancer, vérifier l'échec** — FAIL.

- [ ] **Step 3: Écrire les règles + fabriques**

Create `src/lib/decision/logement-rules.ts` :

```ts
// Règles Logement (slice 1.5). Statut-aware : present -> verification, unavailable -> unknown scopée,
// none -> rien. Les fabriques ne produisent QUE verification/unknown (jamais incompatibility).
// Posture-aware. Chaque fait porte le constat établi (statement) + l'action propre.
import type { DecisionRule, VerificationFact, UnknownFact, EvidenceRef, RuleEvaluation, MaterialityTier, LogementFacts, SourceCoverage, VerificationActionType } from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";

type Bucket = "neutre" | "achat" | "reside" | "location";
function bucket(p: UserProject): Bucket {
  if (p.intent === "achat") return "achat";
  if (p.intent === "location") return "location";
  if (p.posture === "habitant") return "reside";
  return "neutre";
}
function ev(l: LogementFacts, factId: string, mode: "persisted_snapshot" | "live_fetch", observedValue?: string): EvidenceRef {
  return { factId, module: "logement", label: l.addressLabel, observedValue, grain: "adresse", href: "/rapport/logement", sourceMode: mode };
}
function logementVerification(id: string, evidence: EvidenceRef, tier: MaterialityTier, statement: string, actionType: VerificationActionType, actionLabel: string, limitation?: string): VerificationFact {
  return { id: `logement:${id}`, ruleId: `logement.${id}`, sourceFactIds: [`logement.${id}`], module: "logement", role: "verification", materialityTier: tier, statement, evidence: [evidence], action: { type: actionType, label: actionLabel }, ...(limitation ? { limitation } : {}) };
}
function logementScopedUnknown(id: string, evidence: EvidenceRef, statement: string): UnknownFact {
  return { id: `logement:${id}:unknown`, ruleId: `logement.${id}`, sourceFactIds: [`logement.${id}`], module: "logement", role: "unknown", impact: "scoped", materialityTier: "secondary", statement, evidence: [evidence] };
}
const verifOut = (id: string, fact: VerificationFact | UnknownFact): RuleEvaluation => ({ ruleId: `logement.${id}`, projectKeys: [], outcome: fact.role === "unknown" ? "unknown" : "verification", facts: [fact], reason: fact.role });
const na = (id: string): RuleEvaluation => ({ ruleId: `logement.${id}`, projectKeys: [], outcome: "not_applicable", facts: [], reason: "rien à signaler" });

// Règle statut-aware générique pour les cinq familles réglementaires.
function coverageRule(cfg: {
  id: string; tier: MaterialityTier; buckets?: Bucket[];
  coverage: (l: LogementFacts) => SourceCoverage; flag: (l: LogementFacts) => boolean;
  statement: string; limitation?: string; actionType: VerificationActionType; action: Record<Bucket, string>;
  observedValue?: (l: LogementFacts) => string | undefined; unavailableStatement: string;
}): DecisionRule {
  return {
    id: `logement.${cfg.id}`, module: "logement",
    evaluate: (f, p): RuleEvaluation => {
      const l = f.logement;
      if (!l) return na(cfg.id);
      const b = bucket(p);
      if (cfg.buckets && !cfg.buckets.includes(b)) return na(cfg.id);
      const cov = cfg.coverage(l);
      if (cov === "unavailable") return verifOut(cfg.id, logementScopedUnknown(cfg.id, ev(l, `logement.${cfg.id}`, "live_fetch"), cfg.unavailableStatement));
      if (cov === "present" && cfg.flag(l)) {
        return verifOut(cfg.id, logementVerification(cfg.id, ev(l, `logement.${cfg.id}`, "live_fetch", cfg.observedValue?.(l)), cfg.tier, cfg.statement, cfg.actionType, cfg.action[b], cfg.limitation));
      }
      return na(cfg.id);
    },
  };
}

const batiAction: Record<Bucket, string> = { achat: "Demandez l'historique des fissures et sinistres, faites vérifier les fondations.", location: "Signalez au bailleur toute fissure apparente.", reside: "Surveillez et photographiez d'éventuelles fissures dans le temps.", neutre: "Regardez les signes visibles sur le bâti." };
const pprnAction: Record<Bucket, string> = { achat: "Consultez le règlement de la zone en mairie avant tout projet de travaux ou d'extension.", location: "Demandez au bailleur si le logement est concerné par des prescriptions particulières.", reside: "Vérifiez le règlement de la zone avant une extension ou une rénovation lourde.", neutre: "Lisez le règlement de la zone en mairie." };
const caviteAction: Record<Bucket, string> = { achat: "Faites vérifier l'état du sol et des fondations avant de vous engager.", location: "Signalez au bailleur tout affaissement ou fissure.", reside: "Surveillez tout signe d'affaissement ou de fissure.", neutre: "Renseignez-vous sur les cavités recensées et leur suivi." };
const patrimoineAction: Record<Bucket, string> = { achat: "Avant des travaux extérieurs, vérifiez en mairie ce que le périmètre autorise (avis de l'ABF possible).", location: "", reside: "Avant des travaux extérieurs, vérifiez en mairie ce que le périmètre autorise.", neutre: "Renseignez-vous en mairie sur ce que le périmètre patrimonial autorise." };
const siniAction: Record<Bucket, string> = { achat: "Demandez l'état des risques et l'historique des sinistres du bien.", location: "Demandez au bailleur l'état des risques et signalez tout sinistre survenu.", reside: "Conservez les déclarations de sinistres et d'indemnisation du bien.", neutre: "Consultez l'état des risques de la commune." };

// DPE : fait PERSISTÉ (pas de coverage), jamais unavailable. Formulé depuis la classe exacte.
const ruleDpe: DecisionRule = {
  id: "logement.dpe-faible", module: "logement",
  evaluate: (f, p): RuleEvaluation => {
    const l = f.logement;
    if (!l || (l.dpe !== "passoire" && l.dpe !== "energivore")) return na("dpe-faible");
    const desc = l.dpe === "passoire" ? "une passoire énergétique" : "un logement énergivore";
    const cls = l.dpeLabel ? `${l.dpeLabel}, ${desc}` : desc;
    const action: Record<Bucket, string> = { achat: "Faites chiffrer les travaux d'amélioration avant de vous engager.", location: "Vérifiez la date du diagnostic et les charges auprès du bailleur avant signature.", reside: "Documentez les travaux d'amélioration engagés.", neutre: "Regardez le détail du diagnostic énergétique et sa date." };
    const evidence = ev(l, "logement.dpe", "persisted_snapshot", l.dpeLabel ? `DPE ${l.dpeLabel}` : undefined);
    return verifOut("dpe-faible", logementVerification("dpe-faible", evidence, "structuring", `Le diagnostic choisi classe ce logement ${cls}.`, "demander_confirmation", action[bucket(p)]));
  },
};

export const LOGEMENT_RULES: DecisionRule[] = [
  ruleDpe,
  coverageRule({ id: "exposition-bati", tier: "structuring", coverage: (l) => l.rga, flag: (l) => l.expositionBati,
    statement: "Cette adresse est exposée au retrait-gonflement des argiles (aléa moyen ou fort).",
    limitation: "L'exposition de la zone ne prouve pas un dommage sur ce bien.", actionType: "verifier_sur_place", action: batiAction,
    unavailableStatement: "L'exposition du bâti (retrait-gonflement des argiles) n'a pas pu être vérifiée à cette adresse." }),
  coverageRule({ id: "zone-reglementee", tier: "structuring", coverage: (l) => l.pprn, flag: (l) => l.zoneReglementee,
    statement: "Cette adresse relève d'au moins un plan de prévention des risques.", actionType: "obtenir_document", action: pprnAction,
    unavailableStatement: "Le zonage réglementaire (plans de prévention) n'a pas pu être vérifié à cette adresse." }),
  coverageRule({ id: "cavite", tier: "structuring", coverage: (l) => l.cavites, flag: (l) => l.caviteProche,
    statement: "Une ou plusieurs cavités souterraines sont recensées à moins de 500 m.",
    limitation: "Recensement d'ouvrages/événements proches, pas une preuve sous ce logement.", actionType: "verifier_sur_place", action: caviteAction,
    unavailableStatement: "Les cavités souterraines n'ont pas pu être vérifiées à cette adresse." }),
  coverageRule({ id: "patrimoine", tier: "secondary", buckets: ["neutre", "achat", "reside"], coverage: (l) => l.patrimoine, flag: (l) => l.perimetrePatrimonial,
    statement: "Cette adresse est dans un périmètre patrimonial protégé.", actionType: "obtenir_document", action: patrimoineAction,
    unavailableStatement: "Les protections patrimoniales n'ont pas pu être vérifiées à cette adresse." }),
  coverageRule({ id: "sinistralite", tier: "secondary", coverage: (l) => l.sinistralite, flag: (l) => l.sinistraliteActive,
    statement: "La commune a connu des sinistres indemnisés lisibles à son échelle (sécheresse ou inondation).",
    limitation: "Lu à l'échelle de la commune, pas de ce logement.", actionType: "obtenir_document", action: siniAction,
    unavailableStatement: "La sinistralité de la commune n'a pas pu être établie." }),
];
```

- [ ] **Step 4: REGISTRY + garde runtime**

Dans `src/lib/decision/materiality-rules.ts` : importer et concaténer, et ajouter la garde runtime dans `assertFactValid` (les règles `logement.*` ne peuvent pas émettre `incompatibility`).

```ts
import { LOGEMENT_RULES } from "./logement-rules.ts";
```

`export const REGISTRY: DecisionRule[] = [ruleMer, ruleTaille, ruleCompromis, ruleConfort, ruleInondation, ...LOGEMENT_RULES];`

Dans `assertFactValid`, tout en haut du corps :

```ts
  if (fact.ruleId.startsWith("logement.") && fact.role === "incompatibility") {
    throw new Error(`[decision] ${fact.ruleId}: une règle Logement ne peut pas émettre incompatibility (arbitrage slice 1.5)`);
  }
```

- [ ] **Step 5: Succès + typecheck + commit**

`node --test src/lib/decision/*.test.ts` → tout PASS. `npx tsc --noEmit` → 0.

```bash
git add src/lib/decision/logement-rules.ts src/lib/decision/logement-rules.test.ts src/lib/decision/materiality-rules.ts
git commit -m "feat(decision): six règles Logement statut-aware (verification/unknown, jamais incompatibility)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Assembleur — conclusion double grain + titre neutralisé

**Files:**
- Modify: `src/lib/decision/decision-assembler.ts`, `src/lib/decision/decision-assembler.test.ts`

- [ ] **Step 1: Test (échoue)** — append à `decision-assembler.test.ts` :

```ts
test("scope commune+adresse : conclusion préfixée « commune et de l'adresse »", () => {
  const d = assembleDossier(run([verif()], ["nearSea"]), project(WITH_HC), "commune+adresse");
  assert.match(d.conclusion, /commune et de l'adresse/i);
});

test("titre vérifications non-habitant : « À examiner avant de vous engager »", () => {
  const d = assembleDossier(run([verif()]), project(NO_HC), "commune");
  assert.match(d.sections.find((s) => s.key === "verifications")!.title, /à examiner/i);
});
```

- [ ] **Step 2: Lancer, échec** — FAIL.

- [ ] **Step 3: Implémenter**

Dans `decision-assembler.ts` : `labels()` non-habitant `verifTitle` → `"À examiner avant de vous engager"`. `conclusionText(...)` prend le `scope` et préfixe `"À l'échelle de la commune et de l'adresse,"` quand `scope==="commune+adresse"` (remplacer la constante locale `"À l'échelle de la commune,"` par ce choix ; passer `scope` depuis `assembleDossier`).

- [ ] **Step 4: Succès + typecheck + commit**

`node --test src/lib/decision/decision-assembler.test.ts` → PASS. `npx tsc --noEmit` → 0.

```bash
git add src/lib/decision/decision-assembler.ts src/lib/decision/decision-assembler.test.ts
git commit -m "feat(decision): conclusion double grain (commune+adresse) + titre section neutralisé

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: Composant — `logementStatus`

**Files:**
- Modify: `src/components/report/DossierDecisionSection.tsx`

- [ ] **Step 1: Prop + bannières**

Ajouter `logementStatus?: "none" | "pending" | "done" | "unavailable"` (défaut `"none"`) à la signature. Insérer, après l'en-tête (avant la carte verdict) :

```tsx
      {logementStatus === "pending" ? (
        <div className="glass rounded-xl p-4 mb-3.5 flex items-center gap-3" style={{ borderLeft: "2px solid var(--info)" }}>
          <span className="w-1.5 h-1.5 rounded-full bg-info shrink-0 animate-pulse" />
          <p className="text-[13px] text-muted">Première lecture à l&apos;échelle de la commune. L&apos;analyse du logement et de son environnement immédiat est en cours.</p>
        </div>
      ) : null}
      {logementStatus === "unavailable" ? (
        <div className="glass rounded-xl p-4 mb-3.5" style={{ borderLeft: "2px solid var(--ghost)" }}>
          <p className="text-[13px] text-muted">L&apos;analyse réglementaire de cette adresse n&apos;a pas pu être actualisée. La conclusion ci-dessous reste limitée à la commune.</p>
        </div>
      ) : null}
```

Signature : `export function DossierDecisionSection({ dossier, logement, logementStatus = "none" }: { dossier: Dossier; logement?: { href: string; label: string } | null; logementStatus?: "none" | "pending" | "done" | "unavailable" })`.

- [ ] **Step 2: Typecheck + commit**

`npx tsc --noEmit` → 0.

```bash
git add src/components/report/DossierDecisionSection.tsx
git commit -m "feat(decision): bannières logementStatus (pending/unavailable)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: `buildCommuneDossier → { moduleFacts, dossier }` + augmentation streamée

**Files:**
- Modify: `src/lib/decision/territory-facts.ts`
- Create: `src/components/report/DossierAvecLogement.tsx`
- Modify: `src/app/(account)/rapport/page.tsx`

- [ ] **Step 1: `buildCommuneDossier` retourne les faits communs**

Dans `src/lib/decision/territory-facts.ts`, changer la signature de retour :

```ts
export async function buildCommuneDossier(insee: string, project: UserProject, opts?: { hasAddress?: boolean }): Promise<{ moduleFacts: ModuleFacts; dossier: Dossier } | null> {
  const facts = await loadModuleFacts(insee, { hasAddress: opts?.hasAddress ?? false });
  if (!facts) return null;
  return { moduleFacts: facts, dossier: assembleDossier(runRules(facts, project), project, "commune") };
}
```

- [ ] **Step 2: Le Server Component async**

Create `src/components/report/DossierAvecLogement.tsx` :

```tsx
// Augmentation Logement streamée (Server Component async). Suspense gère le "pending" (fallback) ;
// ce catch TYPÉ gère le "unavailable" (un bug d'adaptateur/règle/assembleur remonte). Faits communs
// reçus en prop (mêmes que le fallback, pas de reload). Statut réglementaire FRAIS.
import { fetchLogementDecisionDataWithTimeout, LogementDataUnavailableError, type ResolvedAddress } from "@/lib/server/logement-decision-data";
import { buildLogementFacts } from "@/lib/decision/logement-facts";
import { runRules } from "@/lib/decision/materiality-rules";
import { assembleDossier } from "@/lib/decision/decision-assembler";
import { DossierDecisionSection } from "@/components/report/DossierDecisionSection";
import type { Dossier, ModuleFacts } from "@/lib/decision/decision-fact";
import type { DpeRecord } from "@/lib/dpe";
import type { UserProject } from "@/lib/user-project";

export async function DossierAvecLogement({
  project, address, savedDpe, communeFacts, communeDossier, logementLink,
}: {
  project: UserProject; address: ResolvedAddress; savedDpe: DpeRecord | null;
  communeFacts: ModuleFacts; communeDossier: Dossier; logementLink: { href: string; label: string } | null;
}) {
  try {
    const data = await fetchLogementDecisionDataWithTimeout(address);
    const logement = buildLogementFacts(data, savedDpe, address.label);
    const facts: ModuleFacts = { ...communeFacts, hasAddress: true, logement };
    const dossier = assembleDossier(runRules(facts, project), project, "commune+adresse");
    return <DossierDecisionSection dossier={dossier} logement={logementLink} logementStatus="done" />;
  } catch (error) {
    if (error instanceof LogementDataUnavailableError) {
      return <DossierDecisionSection dossier={communeDossier} logement={logementLink} logementStatus="unavailable" />;
    }
    throw error; // bug de code : reste visible (frontière d'erreur / observabilité)
  }
}
```

- [ ] **Step 3: Câbler le hub sous Suspense**

Dans `src/app/(account)/rapport/page.tsx` :

Imports :

```ts
import { Suspense } from "react";
import { DossierAvecLogement } from "@/components/report/DossierAvecLogement";
import type { ResolvedAddress } from "@/lib/server/logement-decision-data";
```

Adapter la consommation de `buildCommuneDossier` (retourne désormais `{ moduleFacts, dossier }`) :

```ts
  const communeResult =
    fullReport && inseeCode && userProject
      ? await buildCommuneDossier(inseeCode, userProject, { hasAddress: Boolean(logementForCommune) })
      : null;
  const dossier = communeResult?.dossier ?? null;
  const dossierAddress: ResolvedAddress | null = logementForCommune
    ? { id: logementForCommune.logement_id, label: logementForCommune.address_label, city: logementForCommune.city, citycode: logementForCommune.insee, postcode: logementForCommune.postcode, latitude: logementForCommune.latitude, longitude: logementForCommune.longitude }
    : null;
```

Remplacer le rendu `{dossier ? <DossierDecisionSection dossier={dossier} logement={dossierLogementLink} /> : null}` par :

```tsx
        {dossier && communeResult ? (
          dossierAddress && logementForCommune ? (
            <Suspense fallback={<DossierDecisionSection dossier={dossier} logement={dossierLogementLink} logementStatus="pending" />}>
              <DossierAvecLogement
                project={userProject!}
                address={dossierAddress}
                savedDpe={logementForCommune.selected_dpe_snapshot}
                communeFacts={communeResult.moduleFacts}
                communeDossier={dossier}
                logementLink={dossierLogementLink}
              />
            </Suspense>
          ) : (
            <DossierDecisionSection dossier={dossier} logement={dossierLogementLink} logementStatus="none" />
          )
        ) : null}
```

- [ ] **Step 4: Typecheck + build**

`npx tsc --noEmit` → 0. `npm run build` → « ✓ Compiled successfully » (timeouts SSG legacy hors sujet).

- [ ] **Step 5: Vérification comportementale (skill verify, compte payant avec adresse)**

Sur `/rapport` (compte avec analyse logement, ex. `bonjourfuturee`, 7 Rue du Taur Toulouse) : le dossier communal apparaît d'abord (bannière « analyse en cours »), puis la section se remplace en `commune+adresse` (conclusion « à l'échelle de la commune et de l'adresse », points « à examiner » au logement, preuves DPE persisté vs réglementaire frais) ; en simulant une panne réglementaire, la bannière `unavailable` s'affiche, scope communal conservé. Noter l'observé.

- [ ] **Step 6: Commit**

```bash
git add src/lib/decision/territory-facts.ts src/components/report/DossierAvecLogement.tsx "src/app/(account)/rapport/page.tsx"
git commit -m "feat(decision): augmentation Logement streamée sous Suspense (commune+adresse)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Vérification finale (invariants spec §10)

- [ ] `npx tsc --noEmit` → 0 ; `node --test src/lib/decision/*.test.ts` → tout PASS ; `npm run build` → compile.
- [ ] Bloc absent → dossier commune inchangé ; règle Logement jamais `incompatibility` (garde runtime) ; `present`→verification, `unavailable`→unknown scopée, `none`→rien ; échec typé → `commune`+`unavailable` ; bug → remonte ; succès → `commune+adresse` avec faits communs identiques ; preuve DPE `persisted_snapshot` vs réglementaire `live_fetch`+`observedAt` ; textes achat/location/habitant distincts.
