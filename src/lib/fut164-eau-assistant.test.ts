// FUT-164 · L'assistant du dossier lit l'eau potable réseau par réseau (lecture FUT-152), et ne rattache jamais
// un réseau à une adresse.
//
// Avant : l'ancien résumé `eaufrance.ts` prenait la conformité de la première des 20 dernières lignes de la
// commune, tous réseaux mêlés, sur six mois, limites seules, et cherchait les nitrites sous le code 1350
// (phosphore total). Rejoué le 30/10/2026 : Marseille « conforme » sur 1 réseau de 16 dont le prélèvement ne
// respectait pas une référence de qualité ; Paris 1 réseau sur 4 ; L'Abergement-Clémenciat « pas de relevé
// récent » malgré un prélèvement du 05/02/2026.
//
// Les fixtures sont des lectures RÉELLES (`scripts/fut164/capturer-eau.mts`, Hub'Eau, 30/10/2026). Le test
// porte sur le texte exact transmis au modèle.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { formatEauPotableBlock, formatEnrichmentBlock, aDesDonneesDetaillees } from "./ask/system-prompt.ts";
import type { EauPotableCommune } from "./eau-potable.ts";

const F = JSON.parse(readFileSync(new URL("./__fixtures__/fut164/eau-potable-communes.json", import.meta.url), "utf8")) as Record<string, { nom: string; lu: EauPotableCommune }>;
const bloc = (insee: string) => formatEauPotableBlock(F[insee]!.lu);

test("Paris : les quatre réseaux sont nommés, avec la zone que la source leur donne", () => {
  const b = bloc("75056");
  assert.match(b, /desservie par 4 réseaux de distribution/);
  for (const nom of ["CENTRE", "NORD OUEST", "SUD OUEST", "EST"]) assert.match(b, new RegExp(`Réseau « ${nom} » \\(zone desservie selon la source : `));
});

test("Marseille : une référence de qualité non respectée est dite, jamais résumée en « conforme »", () => {
  const b = bloc("13055");
  assert.match(b, /desservie par 16 réseaux/);
  assert.match(b, /Réseau « MARSEILLE ST BARNABE »[^\n]*25\/08\/2026[^\n]*référence de qualité non respectée/);
  assert.doesNotMatch(b, /Conformité (bactériologique|physico-chimique) : oui/);
});

test("Marseille : un réseau en panne pendant la lecture est dit indisponible, et la lecture partielle", () => {
  const b = bloc("13055");
  assert.match(b, /Lecture PARTIELLE/);
  assert.match(b, /résultat indisponible lors de la consultation\. Ne concluez rien pour ce réseau\./);
});

test("Metz : la conclusion de l'ARS est transmise telle quelle", () => {
  const lu = F["57463"]!.lu;
  assert.ok(lu.etat === "disponible" || lu.etat === "partiel");
  const conclusions = lu.reseaux.flatMap((r) => (r.dernier && r.dernier !== "indisponible" && r.dernier.conclusion ? [r.dernier.conclusion] : []));
  assert.ok(conclusions.length > 0);
  for (const c of conclusions) assert.ok(bloc("57463").includes(`« ${c} »`));
});

test("L'Abergement-Clémenciat : le prélèvement de février est daté, jamais « pas de relevé récent »", () => {
  const b = bloc("01001");
  assert.match(b, /Réseau « BDS ST DIDIER\/CHALARONNE » : dernier prélèvement publié le 05\/02\/2026/);
  assert.doesNotMatch(b, /récent/);
});

test("les nitrites sont lus sous le code 1339 ; le phosphore n'apparaît plus sous leur nom", () => {
  for (const insee of Object.keys(F).filter((k) => !k.startsWith("_"))) {
    const lu = F[insee]!.lu;
    if (lu.etat !== "disponible" && lu.etat !== "partiel") continue;
    for (const p of lu.parametres.filter((x) => x.libelle === "Nitrites")) assert.equal(p.code, "1339");
  }
  assert.doesNotMatch(readFileSync(new URL("./eaufrance.ts", import.meta.url), "utf8"), /"1350"|drinkingWater/);
});

test("la consigne de non-rattachement à une adresse accompagne toute lecture", () => {
  for (const insee of ["75056", "13055", "57463", "01001"]) {
    assert.match(bloc(insee), /Ne rattachez JAMAIS un réseau à une adresse ou à un logement/);
  }
  assert.match(formatEauPotableBlock({ etat: "absent_dans_source", consulteLe: "2026-10-30T10:00:00Z" }), /Ne rattachez JAMAIS/);
});

test("le plomb est dit propre au bâtiment prélevé", () => {
  assert.match(bloc("75056"), /Plomb : 13 µg\/L[^\n]*AU-DELÀ de la limite de qualité \(10 µg\/L\)/);
  assert.match(bloc("75056"), /Le plomb dépend surtout des canalisations du bâtiment/);
});

test("une panne n'est jamais une absence de contrôle ; une source vide est dite telle", () => {
  const panne = formatEauPotableBlock({ etat: "indisponible" });
  assert.match(panne, /n'a pas pu être lue lors de cette consultation/);
  assert.match(panne, /ne parlez jamais d'absence de contrôle/);
  assert.doesNotMatch(panne, /aucun prélèvement publié/);
  assert.match(formatEauPotableBlock({ etat: "absent_dans_source", consulteLe: "2026-10-30T10:00:00Z" }), /la source ne publie aucun prélèvement pour cette commune/);
  assert.match(formatEauPotableBlock(undefined), /Non consultée/);
});

test("au-delà de 20 réseaux, les réseaux tus sont comptés", () => {
  const r = { code: "x", nom: "R", zone: null, dernier: null };
  const lu: EauPotableCommune = { etat: "disponible", consulteLe: "2026-10-30T10:00:00Z", reseaux: Array.from({ length: 23 }, (_, i) => ({ ...r, nom: `R${i}` })), parametres: [] };
  const b = formatEauPotableBlock(lu);
  assert.match(b, /3 autres réseaux ne sont pas détaillés ici/);
  assert.equal(b.match(/^- Réseau « /gm)?.length, 20);
});

test("l'eau potable compte comme donnée détaillée, sauf en panne ; le bloc entre dans le prompt", () => {
  const vide = { ademe: null, drias: null, eau: null, vigieau: null, georisques: null, catnat: null, littoral: null, baignade: null, indisponibles: { georisques: false, catnat: false } };
  assert.equal(aDesDonneesDetaillees({ ...vide, eauPotable: F["75056"]!.lu }), true);
  assert.equal(aDesDonneesDetaillees({ ...vide, eauPotable: { etat: "indisponible" } }), false);
  assert.match(formatEnrichmentBlock({ ...vide, eauPotable: F["01001"]!.lu }), /BDS ST DIDIER/);
});

test("les deux routes de l'assistant demandent l'eau potable ; la synthèse Territoire, non", () => {
  const sans = (f: string) => readFileSync(new URL(f, import.meta.url), "utf8").replace(/\/\/.*$/gm, "");
  assert.match(sans("../app/api/ask/route.ts"), /gatherCommuneEnrichment\(communeInsee, \{ avecEauPotable: true \}\)/);
  assert.match(sans("../app/api/ask/context/route.ts"), /gatherCommuneEnrichment\(insee, \{ avecEauPotable: true \}\)/);
  assert.doesNotMatch(sans("./server/territoire-snapshot.ts"), /avecEauPotable/);
});
