import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  AUDIT_SELECT, formatKwhEpM2, libelleObjet, objetAudite, toAuditRecord, type AuditApiRow,
} from "./audit-record.ts";

// FUT-59 : LE CONTRAT DE L'AUDIT ÉNERGÉTIQUE ADEME.
//
// Fixture SYNTHÉTIQUE, construite sur la structure de l'incident du 03/10/2026 (un audit d'IMMEUBLE, une
// ligne par étape, le total égal à la valeur par m² multipliée par la surface habitable de l'immeuble).
// Les nombres réels ne sont pas recopiés : ils retrouveraient l'audit public, donc une adresse.

const S_IMMEUBLE = 400;
const etape = (etape: string, m2: number): AuditApiRow & { ep_conso_5_usages: number; emission_ges_5_usages: number } => ({
  n_audit: "A-SYNTHETIQUE-0001",
  date_etablissement_audit: "2025-05-30",
  classe_bilan_dpe: "G",
  categorie_scenario: "état initial",
  etape_travaux: etape,
  ep_conso_5_usages_m2: m2,
  emission_ges_5_usages_m2: m2 / 6,
  surface_habitable_immeuble: S_IMMEUBLE,
  // Les TOTAUX, tels que l'API les rend si on les demande : ils ne doivent jamais être lus.
  ep_conso_5_usages: m2 * S_IMMEUBLE,
  emission_ges_5_usages: (m2 / 6) * S_IMMEUBLE,
});
const incident = [etape("état initial", 512.345678901234), etape("étape finale", 54.0317951950841)];

// ── T1 : le cas fautif ──────────────────────────────────────────────────────────────────────────────
test("T1 : le total annuel n'est plus affiché sous l'unité par m²", () => {
  const a = toAuditRecord(incident)!;
  assert.equal(a.scenarios[0].conso_ep_m2, 512.345678901234);
  const rendu = formatKwhEpM2(a.scenarios[0].conso_ep_m2!);
  assert.equal(rendu, "512,3 kWh EP/m²/an");
  assert.doesNotMatch(rendu, /204\s?938/); // 512,345… × 400 : le total de l'objet audité
});

test("T1 : les colonnes demandées à la source sont celles par m², jamais les totaux", () => {
  assert.ok(AUDIT_SELECT.includes("ep_conso_5_usages_m2"));
  assert.ok(AUDIT_SELECT.includes("emission_ges_5_usages_m2"));
  assert.ok(!(AUDIT_SELECT as readonly string[]).includes("ep_conso_5_usages"));
  assert.ok(!(AUDIT_SELECT as readonly string[]).includes("emission_ges_5_usages"));
});

// ── T2 : une valeur valide reste visible ────────────────────────────────────────────────────────────
test("T2 : un audit de logement garde sa valeur, correctement écrite", () => {
  const a = toAuditRecord([{ n_audit: "A-SYNTHETIQUE-0002", ep_conso_5_usages_m2: 187, surface_habitable_logement: 62 }])!;
  assert.equal(formatKwhEpM2(a.scenarios[0].conso_ep_m2!), "187 kWh EP/m²/an");
  assert.deepEqual(a.objet, { grain: "logement", surface_m2: 62 });
});

// ── T3 : unité ──────────────────────────────────────────────────────────────────────────────────────
test("T3 : l'écran écrit l'unité de la grandeur lue, par le même formatter pour l'audit et le DPE", () => {
  assert.match(formatKwhEpM2(1), /kWh EP\/m²\/an$/);
  const ecran = readFileSync("src/components/report/logement/EnergieSection.tsx", "utf8");
  assert.match(ecran, /formatKwhEpM2\(s\.conso_ep_m2\)/);
  assert.match(ecran, /formatKwhEpM2\(dpe\.conso_ep_m2\)/);
  // Plus aucune unité écrite à la main derrière une valeur brute.
  assert.doesNotMatch(ecran, /\}\s*kWh/);
  assert.doesNotMatch(ecran, /s\.conso_ep\b(?!_m2)/);
});

// ── T4 : précision ──────────────────────────────────────────────────────────────────────────────────
test("T4 : jamais plus d'une décimale, la précision des diagnostics publiés", () => {
  for (const v of [503.544762809564, 0.06, 418.3, 1234.56789]) {
    const nombre = formatKwhEpM2(v).split(" kWh")[0];
    assert.match(nombre, /^[\d ]+(,\d)?$/, nombre);
  }
  assert.equal(formatKwhEpM2(418.3), "418,3 kWh EP/m²/an");
});

// ── T5 : absence ────────────────────────────────────────────────────────────────────────────────────
test("T5 : null, champ manquant ou valeur non finie ne deviennent jamais un nombre", () => {
  assert.equal(toAuditRecord([]), null);
  const a = toAuditRecord([
    { n_audit: "A-SYNTHETIQUE-0003", ep_conso_5_usages_m2: null },
    { n_audit: "A-SYNTHETIQUE-0003" },
    { n_audit: "A-SYNTHETIQUE-0003", ep_conso_5_usages_m2: Number.NaN },
  ])!;
  for (const s of a.scenarios) {
    assert.equal(s.conso_ep_m2, null);
    assert.equal(s.emission_ges_m2, null);
  }
  // L'écran ne rend une valeur que si elle existe.
  const ecran = readFileSync("src/components/report/logement/EnergieSection.tsx", "utf8");
  assert.match(ecran, /s\.conso_ep_m2 != null &&/);
  // Sans surface publiée, l'objet audité n'est pas deviné.
  assert.equal(a.objet, null);
  assert.equal(libelleObjet(null), "Objet audité non précisé par la source");
});

// ── T6 : attribution ────────────────────────────────────────────────────────────────────────────────
test("T6 : un audit d'immeuble n'est jamais présenté comme celui du logement", () => {
  const a = toAuditRecord(incident)!;
  assert.deepEqual(a.objet, { grain: "immeuble", surface_m2: S_IMMEUBLE });
  assert.match(libelleObjet(a.objet), /^Audit de l'immeuble entier \(400 m² habitables\), pas de ce seul logement$/);
  // Un audit de logement trouvé par l'adresse n'est pas dit « de ce logement » : l'adresse peut en compter plusieurs.
  const l = libelleObjet({ grain: "logement", surface_m2: 62 });
  assert.match(l, /^Audit d'un logement de 62 m², rattaché à cette adresse$/);
  assert.doesNotMatch(l, /ce logement/);
  // La surface du logement prime quand elle est publiée : c'est à elle que se rapportent les valeurs par m².
  assert.deepEqual(objetAudite({ n_audit: "x", surface_habitable_logement: 55, surface_habitable_immeuble: 900 }), { grain: "logement", surface_m2: 55 });
  const ecran = readFileSync("src/components/report/logement/EnergieSection.tsx", "utf8");
  assert.match(ecran, /libelleObjet\(audit\.objet\)/);
});

// ── T7 : usages frères ──────────────────────────────────────────────────────────────────────────────
test("T7 : les émissions suivent le même contrat, et le chargeur ne relit pas les colonnes à la main", () => {
  const a = toAuditRecord(incident)!;
  assert.equal(a.scenarios[0].emission_ges_m2, 512.345678901234 / 6);
  const chargeur = readFileSync("src/lib/audit.ts", "utf8");
  assert.match(chargeur, /AUDIT_SELECT\.join/);
  assert.match(chargeur, /toAuditRecord\(rows\)/);
  assert.doesNotMatch(chargeur, /ep_conso_5_usages|emission_ges_5_usages/);
  // Le contrat du rapport Logement est celui-ci, et pas une copie.
  assert.match(readFileSync("src/lib/logement-report-types.ts", "utf8"), /audit\?: AuditRecord \| null;/);
  // La route autonome rend le même enregistrement.
  assert.match(readFileSync("src/app/api/audit/[insee]/route.ts", "utf8"), /getAuditByBanId/);
});
