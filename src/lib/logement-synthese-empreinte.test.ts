// FUT-60 × FUT-13 : une synthèse enregistrée ne se réaffiche que pour les faits qu'elle a lus.
//
// FUT-13 versionne le rapport et sa synthèse, mais la page ne filtrait la synthèse enregistrée que sur
// le DPE, et le module la tenait pour valide sous l'empreinte COURANTE. Le renommage du payload
// (« arretes_* » → « reconnaissances_* ») n'aurait donc régénéré aucune synthèse déjà écrite.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ligneVersionSuivanteSynthese, metaDe, rangementSynthese, sourcesAbsentes, syntheseEnregistreeUtilisable,
  type VersionLogement,
} from "./logement-report-version.ts";
import { buildFactHash, type ClimatProjete } from "./logement-synthesis-cache.ts";
import type { LogementReport } from "./logement-report-types.ts";

const rapport = { address: { citycode: "99999" } } as unknown as LogementReport;
const versionAvecSynthese = (hash: string | null): VersionLogement => ({
  numero: 3, collecteeLe: "2026-10-01T10:00:00.000Z", sourcesAbsentes: sourcesAbsentes({ ...rapport, parcel: {}, altitude: 1, zfe: {}, cartofriches: {} } as never),
  report: rapport, reportHash: "rep:abc", synthese: "Texte écrit sous l'ancien contrat.", syntheseHash: hash, syntheseDpe: null,
});
// Le cas exact de FUT-60 : même dossier, payload d'avant (« arretes_* ») et d'après (« reconnaissances_* »).
const donnees = (climatProjete: ClimatProjete | null = null) => ({
  dpeSelectionStatus: null, selectedDpe: null, georisques: null, communeData: { commune: { nom: "X", population: 1 } },
  sinistralite: { inondation: { kind: "aucun" } }, catnatInondationCount: 5, climatProjete,
}) as Parameters<typeof buildFactHash>[0];
const HASH_ANCIEN_CONTRAT = "syn:v10:f96dbb22"; // relevé avec main avant le renommage (cf. L2)

test("E1. empreinte identique : le texte enregistré s'affiche, sans génération", () => {
  const courant = buildFactHash(donnees());
  assert.equal(syntheseEnregistreeUtilisable("Texte.", courant, courant), true);
  // La métadonnée de version porte maintenant l'empreinte jusqu'au module (elle était jetée).
  assert.equal(metaDe(versionAvecSynthese(courant)).syntheseHash, courant);
});

test("E2. empreinte ancienne : le texte n'est pas resservi, une lecture est générée puis rangée en nouvelle version, mêmes faits collectés", () => {
  const courant = buildFactHash(donnees());
  assert.notEqual(courant, HASH_ANCIEN_CONTRAT);
  assert.equal(syntheseEnregistreeUtilisable("Texte.", HASH_ANCIEN_CONTRAT, courant), false);
  // La lecture générée se range : la dernière version a déjà une synthèse, d'une autre empreinte.
  const derniere = versionAvecSynthese(HASH_ANCIEN_CONTRAT);
  assert.equal(rangementSynthese(derniere, courant, 3), "nouvelle_version");
  const ligne = ligneVersionSuivanteSynthese(derniere, "u1", "d1", {
    synthesis_text: "Nouveau texte.", synthesis_fact_hash: courant, synthesis_generated_at: "2026-10-06T09:00:00.000Z", synthesis_dpe_numero: null,
  });
  assert.equal(ligne.version, 4);
  assert.equal(ligne.report_hash, derniere.reportHash, "même rapport");
  assert.equal(ligne.collected_at, derniere.collecteeLe, "même collecte");
  assert.equal(ligne.report, derniere.report);
  assert.equal(ligne.synthesis_fact_hash, courant);
});

test("E3. une empreinte absente ne vaut pas une empreinte compatible", () => {
  assert.equal(syntheseEnregistreeUtilisable("Texte.", null, buildFactHash(donnees())), false);
  assert.equal(syntheseEnregistreeUtilisable(null, buildFactHash(donnees()), buildFactHash(donnees())), false);
});

test("E4. l'empreinte du module égale celle du serveur, climat compris, après l'aller-retour JSON de la requête", () => {
  const climat = { chaleur: "marquee" } as unknown as ClimatProjete;
  // Serveur : reçoit les données sérialisées, puis injecte le climat de la commune avant de hacher.
  const serveur = (c: ClimatProjete | null) => {
    const recu = JSON.parse(JSON.stringify({ ...donnees(), climatProjete: undefined }));
    recu.climatProjete = c;
    return buildFactHash(recu);
  };
  for (const c of [null, climat]) assert.equal(buildFactHash(donnees(c)), serveur(c), `climat ${c ? "présent" : "absent"}`);
  // Sans le climat transmis par la page, le module divergerait sur les communes où il est émis.
  assert.notEqual(buildFactHash(donnees(null)), serveur(climat));
});
