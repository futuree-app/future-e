// FUT-67 (11/10/2026) : PREMIER LOT DE LA PASSE ÉDITORIALE DU DOSSIER ADRESSE.
//
// Ce que ces tests verrouillent, constaté sur des dossiers réels (Paris 7e, Châtelaillon-Plage) :
//  1. L'audit énergétique listait les lignes brutes de la source (« scénario multi étapes "principal" »,
//     « étape intermédiaire 1 ») dans l'ordre de l'API : état initial en dernier, étape intermédiaire
//     avant la première. Il se lit maintenant comme un point de départ et des parcours ordonnés.
//  2. Les valeurs du logement s'écrivaient à l'anglaise (« 194.7 m² », « 9.7 kg ») et la date du
//     diagnostic en ISO (« 2025-07-04 »).
//  3. Le module Autour rendait sa conclusion tout en bas, sous cinq blocs, et répétait l'adresse.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { formatGesM2, formatSurfaceM2, parcoursAudit, type AuditScenario } from "./audit-record.ts";
import { dateFr } from "./decision/autour-permis.ts";

const lire = (p: string) => readFileSync(p, "utf8");
const code = (p: string) => lire(p).split("\n").filter((l) => !l.trimStart().startsWith("//") && !l.trimStart().startsWith("*")).join("\n");
const contient = (src: string, re: RegExp, quoi: string) => assert.ok(re.test(src), `absent : ${quoi} (${re})`);
const neContientPas = (src: string, re: RegExp, quoi: string) => assert.ok(!re.test(src), `présent : ${quoi} (${re})`);

const sc = (categorie: string | null, etape: string | null, conso: number | null): AuditScenario =>
  ({ categorie, etape, travaux: null, conso_ep_m2: conso, emission_ges_m2: null });

// Les cinq lignes de l'audit réel du 1 rue Saint-Dominique (Paris 7e), dans l'ordre où l'API les rend.
const PARIS = [
  sc('scénario multi étapes "principal"', "étape intermédiaire 1", 115.1),
  sc('scénario multi étapes "principal"', "étape finale", 53),
  sc('scénario en une étape "principal"', "étape finale", 53),
  sc('scénario multi étapes "principal"', "étape première", 167.3),
  sc("état initial", "état initial", 503.5),
];

test("A1. l'audit se lit comme un point de départ et des parcours ordonnés", () => {
  const l = parcoursAudit(PARIS);
  assert.equal(l.depart?.conso_ep_m2, 503.5);
  assert.deepEqual(
    l.parcours.map((p) => [p.titre, p.etapes.map((e) => `${e.libelle} ${e.scenario.conso_ep_m2}`)]),
    [
      ["Rénovation par étapes", ["Étape 1 167.3", "Étape 2 115.1", "Étape finale 53"]],
      ["Rénovation en une seule fois", ["Après travaux 53"]],
    ],
  );
});

test("A2. rien n'est perdu ni inventé : chaque ligne de la source se retrouve une fois, sans classe ni coût", () => {
  const l = parcoursAudit(PARIS);
  const rendues = [l.depart!, ...l.parcours.flatMap((p) => p.etapes.map((e) => e.scenario))];
  assert.equal(rendues.length, PARIS.length);
  assert.deepEqual(new Set(rendues), new Set(PARIS), "les mêmes objets, pas des copies réinterprétées");
  const texte = JSON.stringify(l.parcours.map((p) => [p.titre, p.etapes.map((e) => e.libelle)]));
  assert.doesNotMatch(texte, /classe|étiquette|€|coût|gain|économie/i);
});

test("A3. variantes, intermédiaires multiples, catégories inconnues et absence d'état initial", () => {
  const l = parcoursAudit([
    sc('scénario multi étapes "complémentaire"', "étape finale", 60),
    sc('scénario multi étapes "principal"', "étape intermédiaire 2", 90),
    sc('scénario multi étapes "principal"', "étape première", 150),
    sc('scénario multi étapes "principal"', "étape intermédiaire 1", 120),
    sc("scénario particulier", "état projeté", 80),
    sc(null, null, 70),
  ]);
  assert.equal(l.depart, null, "pas d'état initial : pas de point de départ inventé");
  assert.deepEqual(l.parcours.map((p) => p.titre), [
    "Rénovation par étapes", "Rénovation par étapes (variante)", "Scénario particulier", "Parcours non précisé par la source",
  ]);
  assert.deepEqual(l.parcours[0]!.etapes.map((e) => e.scenario.conso_ep_m2), [150, 120, 90]);
  assert.deepEqual(l.parcours[0]!.etapes.map((e) => e.libelle), ["Étape 1", "Étape 2", "Étape 3"]);
  assert.equal(l.parcours[2]!.etapes[0]!.libelle, "état projeté", "une étape inconnue garde le libellé de la source");
  assert.deepEqual(parcoursAudit([]), { depart: null, parcours: [] });
});

test("A4. l'écran rend les parcours, plus jamais les libellés bruts de la source", () => {
  const ecran = code("src/components/report/logement/EnergieSection.tsx");
  contient(ecran, /const lecture = parcoursAudit\(audit\.scenarios\);/, "EnergieSection");
  neContientPas(ecran, /\{s\.categorie\}|\{s\.etape\}/, "EnergieSection");
  neContientPas(ecran, /audit\.scenarios\.length\} scénarios/, "EnergieSection");
  // Ce qui borne la lecture reste à côté d'elle : l'objet audité, et ce que le bloc ne montre pas.
  contient(ecran, /libelleObjet\(audit\.objet\)/, "EnergieSection");
  contient(ecran, /Le coût des travaux et l&apos;étiquette visée ne figurent pas ici\./, "EnergieSection");
});

test("F1. les valeurs du logement s'écrivent à la française", () => {
  assert.equal(formatSurfaceM2(194.7), "194,7 m²");
  assert.equal(formatSurfaceM2(2877), "2\u00a0877 m²", "séparateur de milliers insécable, comme formatKwhEpM2");
  assert.equal(formatSurfaceM2(109), "109 m²");
  assert.equal(formatGesM2(9.7), "9,7 kg CO₂/m²/an");
  assert.equal(formatGesM2(75), "75 kg CO₂/m²/an");
  assert.equal(dateFr("2025-07-04"), "4 juillet 2025");
  const ecran = code("src/components/report/logement/EnergieSection.tsx");
  contient(ecran, /formatGesM2\(dpe\.emission_ges_m2\)/, "EnergieSection");
  contient(ecran, /dateFr\(dpe\.date_dpe\)/, "EnergieSection");
  neContientPas(ecran, /date_dpe\?\.slice\(0, 10\)|\$\{dpe\.emission_ges_m2\} kg/, "EnergieSection");
  const passeport = code("src/components/report/logement/PropertyPassport.tsx");
  contient(passeport, /formatSurfaceM2\(dpe\.surface_m2\)/, "PropertyPassport");
  contient(passeport, /formatSurfaceM2\(parcel\.contenance\)/, "PropertyPassport");
  neContientPas(passeport, /\$\{dpe\.surface_m2\} m²/, "PropertyPassport");
});

test("U1. Autour : l'essentiel d'abord, la phrase sur les autorisations sous la date qui la borne", () => {
  const m = code("src/components/report/AutourModule.tsx");
  const conclusion = m.indexOf('eyebrow="Ce que ce secteur met à portée"');
  const faits = m.indexOf("<Face3Block s={autour} car={carOwnership} />");
  const permis = m.indexOf('eyebrow="Ce qui est autorisé autour"');
  assert.ok(conclusion > 0 && faits > 0 && permis > 0, "blocs trouvés");
  assert.ok(conclusion < faits, "la conclusion précède les faits qu'elle résume");
  // La phrase « Cette configuration peut encore changer » (`mouvement`) ne se lit que sous la date
  // de consultation du registre, dans le bloc des autorisations.
  const blocPermis = m.slice(permis, m.indexOf("</ReportSection>", permis));
  const consultation = blocPermis.indexOf("{p.consultation}");
  const mouvement = blocPermis.indexOf("buildAutourConclusion(autour)?.mouvement");
  assert.ok(consultation > 0 && mouvement > consultation, "le mouvement suit la date de consultation");
  const blocConclusion = m.slice(conclusion, m.indexOf("</ReportSection>", conclusion));
  neContientPas(blocConclusion, /c\.mouvement/, "conclusion en tête");
  // L'adresse n'est plus répétée, et l'encadré vide autour du seul lien a disparu.
  neContientPas(m, /Adresse analysée/, "AutourModule");
  contient(m, /\{\(loading \|\| error\) && \(\s*<div className="glass rounded-xl p-8"/, "AutourModule");
});
