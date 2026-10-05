import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  AUDIT_PROCHE_SELECT, AUDIT_SELECT, candidatProche, formatKwhEpM2, libelleObjet, objetAudite, resultatAudit,
  toAuditRecord, type AuditApiRow, type AuditProcheApiRow,
} from "./audit-record.ts";

// FUT-59 : LE CONTRAT DE L'AUDIT ÉNERGÉTIQUE ADEME.
//
// Fixture SYNTHÉTIQUE, construite sur la structure de l'incident du 03/10/2026 (un audit d'IMMEUBLE, une
// ligne par étape, le total égal à la valeur par m² multipliée par la surface habitable de l'immeuble).
// Les nombres réels ne sont pas recopiés : ils retrouveraient l'audit public, donc une adresse.

const S_IMMEUBLE = 400;
const BAN = "99999_test_00001"; // identifiant BAN synthétique de l'adresse examinée
const etape = (etape: string, m2: number): AuditApiRow & { ep_conso_5_usages: number; emission_ges_5_usages: number } => ({
  n_audit: "A-SYNTHETIQUE-0001",
  identifiant_ban: BAN,
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
  const a = toAuditRecord(incident, BAN)!;
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
  const a = toAuditRecord([{ n_audit: "A-SYNTHETIQUE-0002", identifiant_ban: BAN, ep_conso_5_usages_m2: 187, surface_habitable_logement: 62 }], BAN)!;
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
  assert.equal(toAuditRecord([], BAN), null);
  const a = toAuditRecord([
    { n_audit: "A-SYNTHETIQUE-0003", identifiant_ban: BAN, ep_conso_5_usages_m2: null },
    { n_audit: "A-SYNTHETIQUE-0003", identifiant_ban: BAN },
    { n_audit: "A-SYNTHETIQUE-0003", identifiant_ban: BAN, ep_conso_5_usages_m2: Number.NaN },
  ], BAN)!;
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
  const a = toAuditRecord(incident, BAN)!;
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
  const a = toAuditRecord(incident, BAN)!;
  assert.equal(a.scenarios[0].emission_ges_m2, 512.345678901234 / 6);
  const chargeur = readFileSync("src/lib/audit.ts", "utf8");
  // Chaque requête porte SA liste de colonnes : les valeurs pour l'adresse exacte, aucune pour le voisin.
  assert.match(chargeur, /\{ qs: `identifiant_ban:"\$\{banId\}"`, size: "20" \}, AUDIT_SELECT\)/);
  assert.match(chargeur, /\{ bbox, size: "20" \}, AUDIT_PROCHE_SELECT\)/);
  assert.match(chargeur, /toAuditRecord\(rows, banId\)/);
  assert.doesNotMatch(chargeur, /ep_conso_5_usages|emission_ges_5_usages/);
  // Le contrat du rapport Logement est celui-ci, et pas une copie.
  assert.match(readFileSync("src/lib/logement-report-types.ts", "utf8"), /audit\?: AuditRecord \| null;/);
  // La route autonome rend le même enregistrement.
  assert.match(readFileSync("src/app/api/audit/[insee]/route.ts", "utf8"), /getAuditByBanId/);
});

// ── Phase 1.1 : attribution exacte, candidat voisin ─────────────────────────────────────────────────

// Point de l'adresse examinée, et deux audits voisins à environ 30 m et 45 m (synthétiques).
const POINT = { latitude: 48.0, longitude: 2.0 };
const voisin = (n: string, dLat: number, ban = "99999_test_00003"): AuditProcheApiRow => ({
  n_audit: n, identifiant_ban: ban, date_etablissement_audit: "2025-01-01", _geopoint: `${48.0 + dLat},2`,
});

// ── T8 : correspondance exacte ──────────────────────────────────────────────────────────────────────
test("T8 : un audit portant l'identifiant BAN exact de l'adresse est retenu, avec sa provenance", () => {
  const a = toAuditRecord(incident, BAN)!;
  assert.equal(a.correspondance, "exact_address");
  assert.equal(a.n_audit, "A-SYNTHETIQUE-0001");
  assert.equal(a.date_audit, "2025-05-30"); // l'audit reste identifiable (référence et date)
});

// ── T9 : un voisin n'est jamais l'audit de l'adresse ────────────────────────────────────────────────
test("T9 : un audit à moins de 50 m sans le même identifiant BAN n'est jamais exposé comme audit de l'adresse", () => {
  const lignesVoisines = incident.map((r) => ({ ...r, n_audit: "A-SYNTHETIQUE-VOISIN", identifiant_ban: "99999_test_00003" }));
  assert.equal(toAuditRecord(lignesVoisines, BAN), null);
  // Mélangé à l'audit de l'adresse, il est écarté même s'il est plus récent.
  assert.equal(toAuditRecord([...lignesVoisines, ...incident], BAN)!.n_audit, "A-SYNTHETIQUE-0001");
  // Sans audit exact, le module rend AUCUN audit, seulement un candidat.
  const r = resultatAudit(null, candidatProche([voisin("A-V1", 0.0003)], POINT, BAN));
  assert.equal(r.audit, null);
  assert.equal(r.auditProche?.correspondance, "nearby_candidate");
});

// ── T10 : le candidat voisin est détecté ────────────────────────────────────────────────────────────
test("T10 : le candidat voisin est détecté, le plus proche, avec sa référence et sa distance", () => {
  const c = candidatProche([voisin("A-LOIN", 0.0004), voisin("A-PRES", 0.00027)], POINT, BAN)!;
  assert.equal(c.correspondance, "nearby_candidate");
  assert.equal(c.n_audit, "A-PRES");
  assert.ok(c.distance_m! >= 29 && c.distance_m! <= 31, String(c.distance_m));
  // Un audit de l'adresse elle-même n'est pas un « voisin » : il relève de la correspondance exacte.
  assert.equal(candidatProche([voisin("A-MEME", 0.0001, BAN)], POINT, BAN), null);
  assert.equal(candidatProche([], POINT, BAN), null);
});

// ── T11 : l'exact gagne ─────────────────────────────────────────────────────────────────────────────
test("T11 : quand un audit exact et un candidat voisin coexistent, l'exact gagne systématiquement", () => {
  const exact = toAuditRecord(incident, BAN)!;
  const proche = candidatProche([voisin("A-PRES", 0.0001)], POINT, BAN)!;
  assert.deepEqual(resultatAudit(exact, proche), { audit: exact, auditProche: null });
  // La route ne cherche un voisin que sans audit exact, et passe par la même règle.
  const route = readFileSync("src/app/api/georisques-logement/route.ts", "utf8");
  // FUT-13 : la route est parallèle, la recherche du voisin reste CHAÎNÉE derrière l'audit exact.
  assert.match(route, /const auditProcheP = auditExactP\.then\(\(exact\) =>\s*exact\s*\?\s*null/);
  assert.match(route, /resultatAudit\(auditExact, auditProche\)/);
});

// ── T12 : aucune valeur du voisin dans l'écran ──────────────────────────────────────────────────────
test("T12 : aucune valeur énergétique d'un voisin n'existe, ni n'atteint EnergieSection", () => {
  const c = candidatProche([voisin("A-PRES", 0.0002)], POINT, BAN)!;
  assert.deepEqual(Object.keys(c).sort(), ["correspondance", "date_audit", "distance_m", "n_audit"]);
  // La recherche spatiale ne demande même pas les colonnes de valeur à la source.
  for (const col of AUDIT_PROCHE_SELECT) assert.doesNotMatch(col, /conso|emission|classe|surface|etape|scenario/);
  const ecran = readFileSync("src/components/report/logement/EnergieSection.tsx", "utf8");
  assert.doesNotMatch(ecran, /auditProche|nearby_candidate/);
  assert.match(ecran, /audit\.correspondance === "exact_address" &&/);
  // Et l'audit exact, lui, garde des noms qui rendent impossible la confusion total / par m².
  const cles = Object.keys(toAuditRecord(incident, BAN)!.scenarios[0]).sort();
  assert.deepEqual(cles, ["categorie", "conso_ep_m2", "emission_ges_m2", "etape", "travaux"]);
  for (const col of AUDIT_SELECT) assert.doesNotMatch(col, /^(ep_conso|emission_ges)_5_usages$/);
});

test("T10 : un audit d'immeuble exact dit explicitement son grain, un audit de logement reste « rattaché à cette adresse »", () => {
  assert.match(libelleObjet(toAuditRecord(incident, BAN)!.objet), /immeuble entier.*pas de ce seul logement/);
  const l = libelleObjet(toAuditRecord([{ n_audit: "A-SYNTHETIQUE-0004", identifiant_ban: BAN, ep_conso_5_usages_m2: 220, surface_habitable_logement: 48 }], BAN)!.objet);
  assert.match(l, /rattaché à cette adresse/);
  assert.doesNotMatch(l, /votre logement|ce logement|du logement/i);
});
