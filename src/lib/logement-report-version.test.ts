import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  consulterOuActualiser, issueActualisation, jsonCanonique, lireLigneVersion, sourcesAbsentes,
  type Dependances, type VersionLogement,
} from "./logement-report-version.ts";
import type { LogementReport } from "./logement-report-types.ts";

// FUT-13, LOT B : OUVRIR UN DOSSIER VERSIONNÉ NE RECALCULE RIEN.
//
// La séquence de la route (`consulterOuActualiser`) reçoit ses dépendances : ces tests COMPTENT les
// appels aux sources (`construire`) et aux écritures (`enregistrer`), sans réseau ni base.

const rapport = (over: Partial<LogementReport> = {}): LogementReport => ({
  address: { id: "99999_test_00001", label: "1 rue Synthétique", city: "Testville", citycode: "99999", postcode: "99000", latitude: 46, longitude: 2 },
  parcel: { parcelCode: "99999000AA0001", nomCommune: "Testville", contenance: 500 },
  altitude: 12,
  zfe: { inZfe: false, zones: [] },
  cartofriches: { count: 0, tronque: false, sansCoordonnees: 0, friches: [] },
  communeData: {} as LogementReport["communeData"],
  sinistralite: {} as LogementReport["sinistralite"],
  georisques: { address: {} as never, parcel: null, commune: {} as never },
  heritage: { items: [], sourceStatus: "ok" } as unknown as LogementReport["heritage"],
  dpeCandidates: [],
  ...over,
});

const version = (numero: number, r: LogementReport, hash: string): VersionLogement => ({
  numero, collecteeLe: "2026-10-01T10:00:00.000Z", sourcesAbsentes: sourcesAbsentes(r), report: r, reportHash: hash,
});

/** Des dépendances qui comptent leurs appels. */
function deps(init: { existante?: VersionLogement | null; construit?: () => LogementReport; hash?: string; ecritureOk?: boolean }) {
  const appels = { lire: 0, construire: 0, enregistrer: 0, ordre: [] as string[] };
  let derniere = init.existante ?? null;
  const d: Dependances = {
    lire: async () => { appels.lire++; appels.ordre.push("lire"); return derniere; },
    construire: async () => { appels.construire++; appels.ordre.push("construire"); return (init.construit ?? (() => rapport()))(); },
    empreinte: () => init.hash ?? "h-nouveau",
    enregistrer: async (r, h) => {
      appels.enregistrer++; appels.ordre.push("enregistrer");
      if (init.ecritureOk === false) return null;
      derniere = version((derniere?.numero ?? 0) + 1, r, h);
      return derniere;
    },
  };
  return { d, appels, derniere: () => derniere };
}

// ── T1 / T9 : une version existe ────────────────────────────────────────────────────────────────────
test("T1 : un dossier versionné est rendu depuis sa version, sans aucune source", async () => {
  const v = version(3, rapport({ altitude: 99 }), "h-v3");
  const { d, appels } = deps({ existante: v });
  const r = await consulterOuActualiser(false, d);
  assert.equal(appels.construire, 0);
  assert.equal(appels.enregistrer, 0);
  assert.equal(r.altitude, 99);
  assert.equal(r.version?.numero, 3);
});

test("T9 : deux ouvertures successives d'un dossier versionné n'appellent aucune source", async () => {
  const { d, appels } = deps({ existante: version(1, rapport(), "h1") });
  await consulterOuActualiser(false, d);
  await consulterOuActualiser(false, d);
  assert.equal(appels.construire, 0);
  assert.equal(appels.lire, 2);
});

// ── T3 : aucune version (dossier neuf, ou antérieur au lot) ─────────────────────────────────────────
test("T3 : sans version, la collecte a lieu une fois et devient la version 1", async () => {
  const { d, appels, derniere } = deps({ existante: null });
  const r = await consulterOuActualiser(false, d);
  assert.deepEqual(appels.ordre, ["lire", "construire", "enregistrer"]);
  assert.equal(r.version?.numero, 1);
  assert.equal(derniere()?.numero, 1);
  // Et l'ouverture suivante ne collecte plus.
  await consulterOuActualiser(false, d);
  assert.equal(appels.construire, 1);
});

test("T3 : sans version et sans écriture possible (migration absente), le lecteur voit sa collecte", async () => {
  const { d } = deps({ existante: null, ecritureOk: false });
  const r = await consulterOuActualiser(false, d);
  assert.equal(r.version, null);
  assert.equal(r.address?.label, "1 rue Synthétique");
});

// ── T4 / T5 : source lente ou en erreur pendant une actualisation ───────────────────────────────────
test("T4 : une source qui dépasse son délai pendant l'actualisation laisse N intacte", async () => {
  const v = version(2, rapport(), "h-v2");
  // La source GPU a abandonné (délai) : `heritage` revient indisponible alors que N l'avait.
  const { d, appels, derniere } = deps({
    existante: v, hash: "h-different",
    construit: () => rapport({ heritage: { items: [], sourceStatus: "unavailable" } as unknown as LogementReport["heritage"] }),
  });
  const r = await consulterOuActualiser(true, d);
  assert.equal(r.actualisation, "refusee");
  assert.deepEqual(r.sourcesNonActualisees, ["patrimoine"]);
  assert.equal(r.version?.numero, 2);
  assert.equal(appels.enregistrer, 0);
  assert.equal(derniere()?.numero, 2);
});

test("T5 : une collecte qui échoue (500, panne) n'atteint jamais l'écriture", async () => {
  const v = version(2, rapport(), "h-v2");
  const { d, appels } = deps({ existante: v, construit: () => { throw new Error("500"); } });
  const r = await consulterOuActualiser(true, d);
  assert.equal(r.actualisation, "refusee");
  assert.equal(r.version?.numero, 2);
  assert.equal(appels.enregistrer, 0);
});

// ── T6 / T7 : actualisation ─────────────────────────────────────────────────────────────────────────
test("T6 : une actualisation réussie crée N+1, et seulement après la collecte complète", async () => {
  const { d, appels } = deps({ existante: version(2, rapport(), "h-v2"), hash: "h-v3", construit: () => rapport({ altitude: 40 }) });
  const r = await consulterOuActualiser(true, d);
  assert.deepEqual(appels.ordre, ["lire", "construire", "enregistrer"]);
  assert.equal(r.actualisation, "nouvelle_version");
  assert.equal(r.version?.numero, 3);
  assert.equal(r.altitude, 40);
});

test("T6 : une collecte identique ne crée pas de version", async () => {
  const { d, appels } = deps({ existante: version(2, rapport(), "h-meme"), hash: "h-meme" });
  const r = await consulterOuActualiser(true, d);
  assert.equal(r.actualisation, "identique");
  assert.equal(appels.enregistrer, 0);
});

test("T7 : une écriture qui échoue laisse N comme dernière version, sans ligne partielle", async () => {
  const { d, derniere } = deps({ existante: version(2, rapport(), "h-v2"), hash: "h-v3", ecritureOk: false });
  const r = await consulterOuActualiser(true, d);
  assert.equal(r.actualisation, "refusee");
  assert.equal(r.version?.numero, 2);
  assert.equal(derniere()?.numero, 2);
});

test("T7 : un rapport invalide n'est jamais écrit, même sans version précédente", async () => {
  const { d, appels } = deps({ existante: null, construit: () => ({ error: "boom" }) as LogementReport });
  const r = await consulterOuActualiser(false, d);
  assert.equal(appels.enregistrer, 0);
  assert.equal(r.version, null);
});

// ── La règle de décision, seule ─────────────────────────────────────────────────────────────────────
test("issueActualisation : invalide, première, identique, perte de source, nouvelle", () => {
  const n = version(1, rapport(), "h1");
  assert.equal(issueActualisation({ error: "x" } as LogementReport, "h", n), "refusee");
  assert.equal(issueActualisation(rapport(), "h", null), "nouvelle_version");
  assert.equal(issueActualisation(rapport(), "h1", n), "identique");
  assert.equal(issueActualisation(rapport({ altitude: null }), "h2", n), "refusee");
  assert.equal(issueActualisation(rapport({ altitude: 50 }), "h2", n), "nouvelle_version");
  // Une source qui MANQUAIT à N et manque encore n'empêche pas la nouvelle version.
  const nSansAlt = version(1, rapport({ altitude: null }), "h1");
  assert.equal(issueActualisation(rapport({ altitude: null, parcel: rapport().parcel }), "h2", nSansAlt), "nouvelle_version");
});

test("jsonCanonique : l'ordre des clés ne change pas l'empreinte ; lireLigneVersion refuse l'invalide", () => {
  assert.equal(jsonCanonique({ b: 1, a: [2, { d: 1, c: 2 }] }), jsonCanonique({ a: [2, { c: 2, d: 1 }], b: 1 }));
  assert.equal(lireLigneVersion({ version: 1, report: { error: "x" }, report_hash: "h", collected_at: "2026" }), null);
  assert.equal(lireLigneVersion(null), null);
  assert.equal(lireLigneVersion({ version: 2, report: rapport(), report_hash: "h", collected_at: "2026-10-01" })?.numero, 2);
});

// ── T2 : la synthèse enregistrée, sans appel ────────────────────────────────────────────────────────
test("T2 : ouvert depuis une version, la synthèse enregistrée s'affiche sans appeler le modèle", () => {
  const synthese = readFileSync("src/components/report/LogementSynthesis.tsx", "utf8");
  assert.match(synthese, /useState\(texteEnregistre \?\? ""\)/);
  assert.match(synthese, /if \(texteEnregistre && lastHashRef\.current === null\) \{\s*lastHashRef\.current = factHash;\s*return;/);
  const module = readFileSync("src/components/report/LogementModule.tsx", "utf8");
  assert.match(module, /texteEnregistre=\{versionInitiale \? dossier\?\.synthesis_text \?\? null : null\}/);
});

// ── La lecture passe par la version, sans appel au montage ──────────────────────────────────────────
test("T1 : la page lit la version et le module ne collecte pas quand elle existe", () => {
  const page = readFileSync("src/app/(account)/rapport/logement/page.tsx", "utf8");
  assert.match(page, /lireDerniereVersion\(supabase, dossier\.id\)/);
  assert.match(page, /versionInitiale=\{versionLogement \?/);
  const module = readFileSync("src/components/report/LogementModule.tsx", "utf8");
  assert.match(module, /if \(versionInitiale\) \{\s*void Promise\.resolve\(\)\.then\(\(\) => appliquerRapport\(versionInitiale, row, false\)\);\s*return;\s*\}/);
  const route = readFileSync("src/app/api/georisques-logement/route.ts", "utf8");
  assert.match(route, /consulterOuActualiser\(refresh, \{/);
});

// ── T8 : le diagnostic choisi n'est jamais dans la version ──────────────────────────────────────────
test("T8 : le DPE choisi vit sur le dossier ; une version ne peut pas le contredire", () => {
  const sql = readFileSync("supabase/35_logement_report_versions.sql", "utf8").replace(/--.*$/gm, "");
  assert.doesNotMatch(sql, /dpe/i);
  const module = readFileSync("src/components/report/LogementModule.tsx", "utf8");
  // Après une actualisation, le diagnostic choisi pendant la session reste celui affiché.
  assert.match(module, /appliquerRapport\(payload, row, true\)/);
  assert.match(module, /if \(garderDpe\) return;/);
});

// ── T10 : autorisation ──────────────────────────────────────────────────────────────────────────────
test("T10 : un lecteur ne lit que les versions de SES dossiers non révoqués, et n'en écrit aucune", () => {
  const sql = readFileSync("supabase/35_logement_report_versions.sql", "utf8").replace(/--.*$/gm, "");
  assert.match(sql, /enable row level security/);
  assert.doesNotMatch(sql, /using\s*\(\s*true\s*\)/i);
  assert.match(sql, /for select\s+using \(\s*auth\.uid\(\) = user_id\s+and exists \(/);
  assert.match(sql, /d\.user_id = auth\.uid\(\) and d\.access_revoked_at is null/);
  assert.doesNotMatch(sql, /for (insert|update|delete)/);
  assert.match(sql, /revoke insert, update, delete, truncate on public\.logement_report_versions from authenticated, anon/);
  assert.match(sql, /references public\.address_dossiers\(id\) on delete cascade/);
  assert.match(sql, /unique \(dossier_id, version\)/);
});
