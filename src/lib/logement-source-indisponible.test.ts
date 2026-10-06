import { test, before, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { resultatAudit, voisinAutorise, type AuditLookup } from "./audit-record.ts";
import {
  consulterOuActualiser, issueActualisation, jsonCanonique, sourcesAbsentes,
  type Dependances, type VersionLogement,
} from "./logement-report-version.ts";
import { buildFactHash, buildSynthesisPayload, SYNTHESIS_PROMPT_VERSION, SYNTHESIS_PROMPT_VERSION_FUT65, type SynthesisData } from "./logement-synthesis-cache.ts";
import type { LogementReport } from "./logement-report-types.ts";

// ════════════════════════════════════════════════════════════════════════════════════════════
// FUT-65 (06/10/2026) : UNE SOURCE EN PANNE N'EST PAS UNE ABSENCE, AUDIT ET DIAGNOSTICS ADEME.
//
// Reproduit sur main 4aa39635 avant correction, `fetch` bouchonné : pour l'audit exact, un 500, un
// délai dépassé, une réponse illisible et une réponse sans liste finissaient tous en `audit: null`,
// comme une vraie réponse vide, et CHACUN lançait la recherche d'un audit voisin. Pour les
// diagnostics, un 500 rendait `[]` et l'écran Énergie écrivait « Aucun diagnostic de performance
// énergétique n'est rattaché à cette adresse ». `sourcesAbsentes` ne suivait aucune des deux.
//
// Les fonctions des sources portent `server-only` et des alias `@/` : même hook de résolution que
// `logement-sources-bornees.test.ts`. Aucun appel réseau réel, aucun appel Anthropic.
// ════════════════════════════════════════════════════════════════════════════════════════════

const racine = pathToFileURL(`${process.cwd()}/`).href;
const hook = `
export async function resolve(spec, ctx, next) {
  if (spec === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
  if (spec.startsWith("@/")) return next(${JSON.stringify(racine)} + "src/" + spec.slice(2) + ".ts", ctx);
  if ((spec.startsWith("./") || spec.startsWith("../")) && !/\\.[cm]?[jt]s$|\\.json$/.test(spec)) {
    try { return await next(spec + ".ts", ctx); } catch { return next(spec, ctx); }
  }
  return next(spec, ctx);
}`;

const fetchOriginal = globalThis.fetch;
const timeoutOriginal = AbortSignal.timeout;
let requetes: string[] = [];

before(() => { register(`data:text/javascript,${encodeURIComponent(hook)}`); });
afterEach(() => { globalThis.fetch = fetchOriginal; AbortSignal.timeout = timeoutOriginal; requetes = []; });

const BAN = "99999_test_00001";
const LIGNE_AUDIT = {
  n_audit: "A-SYNTH-1", identifiant_ban: BAN, date_etablissement_audit: "2025-01-01",
  categorie_scenario: "état initial", etape_travaux: "état initial", ep_conso_5_usages_m2: 300,
};
const LIGNE_DPE = {
  numero_dpe: "2475E0000000X", identifiant_ban: BAN, etiquette_dpe: "D", etiquette_ges: "C",
  date_etablissement_dpe: "2024-03-01", type_batiment: "appartement",
};

type Mode = "lignes" | "vide" | "500" | "delai" | "illisible" | "sans_liste";
/** Une source ADEME bouchonnée. `voisins` : ce que rend la recherche par emprise (bbox). */
function ademe(mode: Mode, lignes: unknown[] = [], parJeu?: Record<string, Mode>) {
  requetes = [];
  AbortSignal.timeout = ((_: number) => timeoutOriginal.call(AbortSignal, 30)) as typeof AbortSignal.timeout;
  globalThis.fetch = ((url: string, init?: { signal?: AbortSignal }) => {
    const u = String(url);
    requetes.push(u.includes("bbox=") ? "voisin" : u.includes("dpe03existant") ? "dpe_existant" : u.includes("dpe02neuf") ? "dpe_neuf" : "exact");
    const m = (parJeu && Object.entries(parJeu).find(([k]) => u.includes(k))?.[1]) ?? mode;
    if (m === "delai") return new Promise((_, rejeter) => init?.signal?.addEventListener("abort", () => rejeter(init.signal!.reason)));
    if (m === "500") return Promise.resolve(new Response(JSON.stringify({ error: "boom" }), { status: 500 }));
    if (m === "illisible") return Promise.resolve(new Response("<html>maintenance</html>", { status: 200 }));
    if (m === "sans_liste") return Promise.resolve(new Response(JSON.stringify({ erreur: "x" }), { status: 200 }));
    if (m === "vide" || u.includes("bbox=")) return Promise.resolve(new Response(JSON.stringify({ results: u.includes("bbox=") ? [{ n_audit: "A-VOISIN", identifiant_ban: "99999_test_00009", _geopoint: "48.0001,2" }] : [] }), { status: 200 }));
    return Promise.resolve(new Response(JSON.stringify({ results: lignes }), { status: 200 }));
  }) as typeof fetch;
}

/** La chaîne exact → voisin, composée EXACTEMENT comme la route (vérifié textuellement en A8). */
async function chaineAudit(): Promise<{ exact: AuditLookup; rendu: ReturnType<typeof resultatAudit> }> {
  const { getAuditByBanId, getNearbyAuditCandidate } = await import("./audit.ts");
  const exactP: Promise<AuditLookup> = getAuditByBanId(BAN).catch((): AuditLookup => ({ status: "unavailable" }));
  const procheP = exactP.then((exact) => voisinAutorise(exact) ? getNearbyAuditCandidate(48.0, 2.0, BAN).catch(() => null) : null);
  const [exact, proche] = await Promise.all([exactP, procheP]);
  return { exact, rendu: resultatAudit(exact, proche) };
}

// ── A1 à A5 : la recherche exacte dit ce qu'elle a établi ────────────────────────────────────────────
test("A1 : HTTP 200 avec un audit de l'adresse exacte → present", async () => {
  const { getAuditByBanId } = await import("./audit.ts");
  ademe("lignes", [LIGNE_AUDIT]);
  const r = await getAuditByBanId(BAN);
  assert.equal(r.status, "present");
  assert.equal(r.status === "present" && r.audit.correspondance, "exact_address");
});

test("A2 : HTTP 200 avec `results: []` → absent (et des lignes d'un autre BAN aussi)", async () => {
  const { getAuditByBanId } = await import("./audit.ts");
  ademe("vide");
  assert.deepEqual(await getAuditByBanId(BAN), { status: "absent" });
  ademe("lignes", [{ ...LIGNE_AUDIT, identifiant_ban: "99999_test_00002" }]);
  assert.deepEqual(await getAuditByBanId(BAN), { status: "absent" });
});

test("A3 / A4 / A5 : HTTP 500, délai dépassé, réponse illisible ou sans liste → unavailable, sans lever", { timeout: 5_000 }, async () => {
  const { getAuditByBanId } = await import("./audit.ts");
  for (const mode of ["500", "delai", "illisible", "sans_liste"] as const) {
    ademe(mode);
    assert.deepEqual(await getAuditByBanId(BAN), { status: "unavailable" }, mode);
  }
});

// ── A6 à A8 : le voisin n'est cherché que sur une absence établie ────────────────────────────────────
test("A6 : audit exact présent → aucune recherche voisine", async () => {
  ademe("lignes", [LIGNE_AUDIT]);
  const { rendu } = await chaineAudit();
  assert.deepEqual(requetes, ["exact"]);
  assert.equal(rendu.auditStatus, "present");
  assert.equal(rendu.auditProche, null);
});

test("A7 : audit exact absent → la recherche voisine est autorisée (doctrine FUT-59 inchangée)", async () => {
  ademe("vide");
  const { rendu } = await chaineAudit();
  assert.deepEqual(requetes, ["exact", "voisin"]);
  assert.equal(rendu.auditStatus, "absent");
  assert.equal(rendu.audit, null, "un voisin n'est jamais l'audit du logement");
  assert.deepEqual(Object.keys(rendu.auditProche!).sort(), ["correspondance", "date_audit", "distance_m", "n_audit"]);
});

test("A8 : audit exact non vérifiable → AUCUNE recherche voisine, et la route compose la même règle", { timeout: 5_000 }, async () => {
  for (const mode of ["500", "delai", "illisible", "sans_liste"] as const) {
    ademe(mode);
    const { rendu } = await chaineAudit();
    assert.deepEqual(requetes, ["exact"], `${mode} : aucune requête voisine`);
    assert.deepEqual(rendu, { audit: null, auditProche: null, auditStatus: "unavailable" }, mode);
  }
  // Même un candidat passé de force n'est pas rendu sur une panne.
  assert.equal(resultatAudit({ status: "unavailable" }, { correspondance: "nearby_candidate", n_audit: "X", date_audit: null, distance_m: 10 }).auditProche, null);
  const route = readFileSync("src/app/api/georisques-logement/route.ts", "utf8");
  assert.match(route, /getAuditByBanId\(address\.id\)\.catch\(\(\): AuditLookup => \(\{ status: "unavailable" \}\)\)/);
  assert.match(route, /auditExactP\.then\(\(exact\) =>\s*voisinAutorise\(exact\)\s*\?\s*getNearbyAuditCandidate/);
  assert.match(route, /const \{ audit, auditProche: candidat, auditStatus \} = resultatAudit\(auditExact, auditProche\);/);
  assert.match(route, /\n\s+auditStatus,\n/);
});

// ── A9 à A14 : le statut survit jusqu'à la version persistée ─────────────────────────────────────────
const rapport = (r: Partial<LogementReport> = {}): LogementReport => ({
  address: { id: BAN, label: "1 rue de l'Exemple 99999 Testville", city: "Testville", citycode: "99999", postcode: "99999", latitude: 48, longitude: 2 },
  parcel: { parcelCode: "999990000A0001" } as never, altitude: 35,
  zfe: { inZfe: false, zones: [] }, cartofriches: { count: 0, tronque: false, sansCoordonnees: 0, friches: [] },
  communeData: {} as never, sinistralite: {} as never,
  georisques: { commune: {} as never, address: {} as never, parcel: null },
  heritage: { items: [], sourceStatus: "ok" } as never,
  audit: null, auditStatus: "absent", dpeCandidates: [], dpeCandidatesStatus: "absent",
  ...r,
} as LogementReport);
const empreinte = (r: LogementReport) => createHash("sha256").update(jsonCanonique(r)).digest("hex");
const version = (r: LogementReport): VersionLogement => ({
  numero: 1, collecteeLe: "2026-10-05T10:00:00.000Z", sourcesAbsentes: sourcesAbsentes(r), report: r, reportHash: empreinte(r),
  synthese: null, syntheseHash: null, syntheseDpe: null,
});

test("A9 / A10 / A11 : seule une panne établie entre dans `sources_absentes`", () => {
  assert.ok(sourcesAbsentes(rapport({ auditStatus: "unavailable" })).includes("audit_energetique"));
  assert.ok(!sourcesAbsentes(rapport({ auditStatus: "absent" })).includes("audit_energetique"));
  assert.ok(!sourcesAbsentes(rapport({ auditStatus: "present" })).includes("audit_energetique"));
  assert.deepEqual(sourcesAbsentes(rapport()), [], "un rapport complet n'a aucune source muette");
  const module = readFileSync("src/components/report/LogementModule.tsx", "utf8");
  assert.match(module, /audit_energetique: "audit énergétique ADEME"/);
  assert.match(module, /diagnostics_dpe: "diagnostics de performance énergétique ADEME"/);
});

test("A12 : N vérifiable, puis l'audit tombe à l'actualisation → refusée, N reste", async () => {
  const n = version(rapport({ auditStatus: "absent" }));
  const nouveau = rapport({ auditStatus: "unavailable" });
  assert.equal(issueActualisation(nouveau, empreinte(nouveau), n), "refusee");
  let ecrit = 0;
  const d: Dependances = {
    lire: async () => n, construire: async () => nouveau, empreinte,
    enregistrer: async () => { ecrit++; return null; },
  };
  const r = await consulterOuActualiser(true, d);
  assert.equal(r.actualisation, "refusee");
  assert.equal(ecrit, 0);
  assert.equal(r.auditStatus, "absent", "la version affichée reste N");
  // Même garde-fou pour les diagnostics.
  const sansDpe = rapport({ dpeCandidatesStatus: "unavailable" });
  assert.equal(issueActualisation(sansDpe, empreinte(sansDpe), version(rapport({ dpeCandidatesStatus: "present", dpeCandidates: [LIGNE_DPE as never] }))), "refusee");
});

test("A13 : première génération avec l'audit en panne → version écrite, panne nommée, aucune absence affirmée", async () => {
  const premier = rapport({ auditStatus: "unavailable", audit: null });
  let ecrite: VersionLogement | null = null;
  const d: Dependances = {
    lire: async () => null, construire: async () => premier, empreinte,
    enregistrer: async (r, h) => (ecrite = { ...version(r), reportHash: h }),
  };
  const r = await consulterOuActualiser(false, d);
  assert.ok(ecrite, "le rapport partiel est enregistré");
  assert.deepEqual(r.version?.sourcesAbsentes, ["audit_energetique"]);
  assert.equal(JSON.parse(jsonCanonique(ecrite!.report)).auditStatus, "unavailable", "le statut est persisté dans le JSON");
  const ecran = readFileSync("src/components/report/logement/EnergieSection.tsx", "utf8");
  assert.match(ecran, /\{auditStatus === "unavailable" && \(/);
  assert.match(ecran, /Audit énergétique non vérifiable pour le moment/);
  assert.doesNotMatch(ecran, /aucun audit/i);
});

test("A14 : un rapport antérieur sans statut n'est jamais lu comme une absence confirmée", () => {
  const ancien = rapport({ audit: null, dpeCandidates: [] });
  delete ancien.auditStatus;
  delete ancien.dpeCandidatesStatus;
  assert.deepEqual(sourcesAbsentes(ancien), [], "aucune panne inventée");
  // Ni absence : aucune phrase d'absence d'audit n'existe, et seul `unavailable` déclenche une phrase.
  const ecran = readFileSync("src/components/report/logement/EnergieSection.tsx", "utf8");
  assert.doesNotMatch(ecran, /auditStatus === "absent"|auditStatus !== /);
  // Et `resultatAudit` ne fabrique pas `absent` à partir de `audit === null`.
  assert.doesNotMatch(readFileSync("src/lib/audit-record.ts", "utf8"), /audit == null|audit === null/);
});

// ── D1 à D5 : les diagnostics du chemin payant ───────────────────────────────────────────────────────
test("D1 : les deux jeux répondent vide → absent ; une ligne → present", async () => {
  const { lookupDpeCandidatesByBanId } = await import("./dpe.ts");
  ademe("vide");
  assert.deepEqual(await lookupDpeCandidatesByBanId(BAN), { status: "absent", candidates: [] });
  ademe("lignes", [LIGNE_DPE]);
  const r = await lookupDpeCandidatesByBanId(BAN);
  assert.equal(r.status, "present");
  assert.equal(r.candidates[0].id_dpe, "2475E0000000X");
});

test("D2 / D3 / D4 : HTTP 500, délai dépassé, réponse illisible ou sans liste → unavailable", { timeout: 5_000 }, async () => {
  const { lookupDpeCandidatesByBanId } = await import("./dpe.ts");
  for (const mode of ["500", "delai", "illisible", "sans_liste"] as const) {
    ademe(mode);
    assert.deepEqual(await lookupDpeCandidatesByBanId(BAN), { status: "unavailable", candidates: [] }, mode);
  }
  // Un seul jeu en panne : ce que l'autre a rendu reste montré, mais la liste n'est pas complète.
  ademe("lignes", [LIGNE_DPE], { dpe02neuf: "500" });
  const partiel = await lookupDpeCandidatesByBanId(BAN);
  assert.equal(partiel.status, "unavailable");
  assert.equal(partiel.candidates.length, 1);
  ademe("vide", [], { dpe02neuf: "delai" });
  assert.equal((await lookupDpeCandidatesByBanId(BAN)).status, "unavailable", "une absence ne s'affirme que si les deux jeux ont répondu");
  assert.ok(!sourcesAbsentes(rapport({ dpeCandidatesStatus: "absent" })).includes("diagnostics_dpe"));
  assert.ok(sourcesAbsentes(rapport({ dpeCandidatesStatus: "unavailable" })).includes("diagnostics_dpe"));
});

test("D5 : le rendu distingue l'absence de la panne, à chaque endroit qui la citait", () => {
  const route = readFileSync("src/app/api/georisques-logement/route.ts", "utf8");
  assert.match(route, /lookupDpeCandidatesByBanId\(address\.id\)\.catch\(\(\) => \(\{ status: "unavailable" as const, candidates: \[\] \}\)\)/);
  assert.match(route, /dpeCandidatesStatus: dpeLookup\.status,/);
  assert.doesNotMatch(route, /getDpeCandidatesByBanId\(address\.id\)\.catch\(\(\) => \[\]\)/);
  const module = readFileSync("src/components/report/LogementModule.tsx", "utf8");
  assert.match(module, /const dpeNonVerifiable = result\?\.dpeCandidatesStatus === "unavailable" && dpeCandidates\.length === 0;/);
  assert.match(module, /diagnosticNonAttribue: dpeNonVerifiable \? undefined : /);
  assert.equal((module.match(/dpeNonVerifiable=\{dpeNonVerifiable\}/g) ?? []).length, 2, "Énergie et confort d'été");
  const energie = readFileSync("src/components/report/logement/EnergieSection.tsx", "utf8");
  assert.match(energie, /\{dpeNonVerifiable \? \(\s*<p[^>]*>\s*La base des diagnostics de performance énergétique \(ADEME\) n&apos;a pas répondu/);
  const confort = readFileSync("src/components/report/ThermalComfortSection.tsx", "utf8");
  assert.match(confort, /\{dpeNonVerifiable\s*\?\s*"La base des diagnostics de performance énergétique \(ADEME\) n'a pas répondu/);
});

// ── Empreinte et synthèse ────────────────────────────────────────────────────────────────────────────
test("Empreinte : absent et non vérifiable donnent deux rapports, donc deux empreintes", () => {
  assert.notEqual(empreinte(rapport({ auditStatus: "absent" })), empreinte(rapport({ auditStatus: "unavailable" })));
  assert.notEqual(empreinte(rapport({ dpeCandidatesStatus: "absent" })), empreinte(rapport({ dpeCandidatesStatus: "unavailable" })));
  // L'empreinte des versions est celle du JSON canonique ENTIER : aucune exclusion de champ.
  assert.match(readFileSync("src/lib/server/logement-report-versions.ts", "utf8"), /createHash\("sha256"\)\.update\(jsonCanonique\(report\)\)/);
});

test("Synthèse : une base des diagnostics en panne ne devient jamais « l'adresse n'en porte aucun »", () => {
  const base: SynthesisData = { address: rapport().address, dpeSelectionStatus: "pending", selectedDpe: null, dpeCandidates: [] };
  assert.equal(buildSynthesisPayload({ ...base, dpeCandidatesStatus: "absent" }).diagnostics_adresse, null);
  assert.deepEqual(buildSynthesisPayload({ ...base, dpeCandidatesStatus: "unavailable" }).diagnostics_adresse, { source_indisponible: true });
  // Les payloads existants ne changent pas : absent, présent ou statut inconnu gardent leur empreinte.
  assert.equal(buildFactHash({ ...base, dpeCandidatesStatus: "absent" }), buildFactHash(base));
  // L'audit n'entre pas dans le payload de synthèse : rien à corriger de ce côté.
  assert.doesNotMatch(JSON.stringify(Object.keys(buildSynthesisPayload(base))), /audit/i);
  const prompt = readFileSync("src/app/api/synthesize-logement/route.ts", "utf8");
  assert.match(prompt, /vaut \\`\{ source_indisponible: true \}\\`, la base des diagnostics n'a pas\nrépondu : vous ne dites ni qu'il en existe à cette adresse, ni qu'il n'en existe pas\./);
});

// ── Revue du 06/10 : une liste de diagnostics INCOMPLÈTE n'est ni attribuée seule, ni dite exhaustive ──
test("P1 : un candidat unique sur une liste incomplète n'est jamais attribué automatiquement", async () => {
  const { dpeAttributionStatus } = await import("./dpe-attribution.ts");
  const maison = { id_dpe: "2475E0000000X", type_batiment: "maison", etiquette_dpe: "D" } as never;
  assert.equal(dpeAttributionStatus([maison], "housenumber").status, "auto_confirmed", "liste complète : inchangé");
  assert.equal(dpeAttributionStatus([maison], "housenumber", false).status, "selection_required");
  const module = readFileSync("src/components/report/LogementModule.tsx", "utf8");
  assert.match(module, /dpeAttributionStatus\(candidates, payload\.banFeatureType \?\? null, payload\.dpeCandidatesStatus !== "unavailable"\)/);
});

test("P2 : l'écran ne présente pas une liste incomplète comme le total de l'adresse", () => {
  const module = readFileSync("src/components/report/LogementModule.tsx", "utf8");
  assert.match(module, /listeDpeIncomplete=\{result\.dpeCandidatesStatus === "unavailable" && dpeCandidates\.length > 0\}/);
  assert.match(readFileSync("src/components/report/logement/EnergieSection.tsx", "utf8"), /listeIncomplete=\{listeDpeIncomplete\}/);
  const bloc = readFileSync("src/components/report/logement/AddressDiagnosticsBlock.tsx", "utf8");
  assert.match(bloc, /\{listeIncomplete && \(\s*<p[^>]*>\s*La base ADEME n&apos;a répondu qu&apos;en partie/);
});

test("P3 : la synthèse reçoit un minimum, pas un total, et seuls ces payloads changent", () => {
  const candidat = { ...LIGNE_DPE, id_dpe: "2475E0000000X", type_batiment: "appartement" } as never;
  const base: SynthesisData = { address: rapport().address, dpeSelectionStatus: "pending", selectedDpe: null, dpeCandidates: [candidat] };
  const partiel = buildSynthesisPayload({ ...base, dpeCandidatesStatus: "unavailable" }).diagnostics_adresse as Record<string, unknown>;
  assert.equal(partiel.liste_incomplete, true);
  assert.equal(partiel.total, 1);
  assert.equal("liste_incomplete" in (buildSynthesisPayload({ ...base, dpeCandidatesStatus: "present" }).diagnostics_adresse as object), false);
  assert.equal(buildFactHash({ ...base, dpeCandidatesStatus: "present" }), buildFactHash(base));
  assert.notEqual(buildFactHash({ ...base, dpeCandidatesStatus: "unavailable" }), buildFactHash(base));
  assert.match(readFileSync("src/app/api/synthesize-logement/route.ts", "utf8"), /\\`total\\` est un minimum, ne le présentez\npas comme le nombre de diagnostics de l'adresse\./);
});

test("P4 : la consigne FUT-65 est tracée par un tampon ciblé, sans régénérer les autres synthèses", () => {
  const candidat = { ...LIGNE_DPE, id_dpe: "2475E0000000X", type_batiment: "appartement" } as never;
  const base: SynthesisData = { address: rapport().address, dpeSelectionStatus: "pending", selectedDpe: null, dpeCandidates: [] };
  assert.equal(SYNTHESIS_PROMPT_VERSION, "v10", "aucun bump global");
  assert.equal(SYNTHESIS_PROMPT_VERSION_FUT65, "v10.1");
  assert.match(buildFactHash({ ...base, dpeCandidatesStatus: "unavailable" }), /^syn:v10\.1:/);
  assert.match(buildFactHash({ ...base, dpeCandidates: [candidat], dpeCandidatesStatus: "unavailable" }), /^syn:v10\.1:/);
  for (const statut of [undefined, "absent", "present"] as const) {
    assert.match(buildFactHash({ ...base, dpeCandidatesStatus: statut }), /^syn:v10:/, String(statut));
    assert.match(buildFactHash({ ...base, dpeCandidates: [candidat], dpeCandidatesStatus: statut }), /^syn:v10:/, String(statut));
  }
});
