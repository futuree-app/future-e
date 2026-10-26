import { test, before } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { readFileSync } from "node:fs";

// ════════════════════════════════════════════════════════════════════════════════════════════
// FUT-80 (26/10/2026) : LE BÂTIMENT DE L'ADRESSE, ET CE QU'ON PEUT LUI RATTACHER.
//
// Ces tests suivent la VRAIE chaîne sur des réponses RÉELLES du Référentiel national des bâtiments et
// de l'ADEME, relevées le 26/10/2026 (`__fixtures__/fut80/`, `scripts/fut80/capturer-fixtures.mjs`) :
// lecture par les fonctions de production (`identiteDepuisRnb`, `toRecord`), rapprochement, attribution
// automatique, versions du rapport, puis rendu des composants de production. Aucun réseau, aucun appel
// Anthropic.
//
// « La carte apparaît » et « la carte dit vrai » sont deux assertions distinctes (AGENTS.md) : le texte
// rendu est lu, pas seulement la présence d'un bloc.
// ════════════════════════════════════════════════════════════════════════════════════════════

const racine = pathToFileURL(`${process.cwd()}/`).href;
const hook = `
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const ts = createRequire(${JSON.stringify(racine)} + "package.json")("typescript");
async function premier(candidats, ctx, next) {
  for (const c of candidats.slice(0, -1)) { try { return await next(c, ctx); } catch {} }
  return next(candidats[candidats.length - 1], ctx);
}
export async function resolve(spec, ctx, next) {
  if (spec === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
  if (spec.startsWith("@/")) {
    const b = ${JSON.stringify(racine)} + "src/" + spec.slice(2);
    return premier([b + ".ts", b + ".tsx", b], ctx, next);
  }
  if ((spec.startsWith("./") || spec.startsWith("../")) && !/\\.[cm]?[jt]sx?$|\\.json$/.test(spec)) {
    return premier([spec + ".ts", spec + ".tsx", spec], ctx, next);
  }
  if (spec === "next/link") return next("next/link.js", ctx);
  return next(spec, ctx);
}
export async function load(url, ctx, next) {
  if (!url.endsWith(".tsx")) return next(url, ctx);
  const fichier = fileURLToPath(url);
  const { outputText } = ts.transpileModule(readFileSync(fichier, "utf8"), {
    fileName: fichier,
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  return { format: "module", source: outputText, shortCircuit: true };
}`;

type M = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
let rnb: M, dpe: M, memeBat: M, rappr: M, attrib: M, auto: M, version: M, vue: M, grain: M;
let React: M, rendu: M, Energie: M, Passeport: M, MemeBat: M;

before(async () => {
  register(`data:text/javascript,${encodeURIComponent(hook)}`);
  const imp = (p: string) => import(`${racine}src/${p}`);
  [rnb, dpe, memeBat, rappr, attrib, auto, version, vue, grain] = await Promise.all([
    imp("lib/batiment-rnb.ts"), imp("lib/dpe.ts"), imp("lib/dpe-meme-batiment.ts"), imp("lib/dpe-rapprochement.ts"),
    imp("lib/dpe-attribution.ts"), imp("lib/dpe-attribution-auto.ts"), imp("lib/logement-report-version.ts"),
    imp("lib/dpe-selection-vue.ts"), imp("lib/dpe-grain.ts"),
  ]);
  React = await import("react");
  rendu = await import("react-dom/server");
  Energie = (await imp("components/report/logement/EnergieSection.tsx")).EnergieSection;
  Passeport = (await imp("components/report/logement/PropertyPassport.tsx")).PropertyPassport;
  MemeBat = (await imp("components/report/logement/DiagnosticsMemeBatiment.tsx")).DiagnosticsMemeBatiment;
});

type Fixture = {
  ban: string; label: string; insee: string;
  rnb: unknown; ademe_adresse: M[]; ademe_batiment: M[];
};
const fx = (nom: string): Fixture => JSON.parse(readFileSync(`src/lib/__fixtures__/fut80/${nom}.json`, "utf8"));
const LE = "2026-10-26T12:00:00.000Z";
const identite = (f: Fixture) => rnb.identiteDepuisRnb(f.rnb, LE);
const fiches = (lignes: M[]) => lignes.map((l) => dpe.toRecord(l));
const texte = (el: unknown) => rendu.renderToStaticMarkup(el).replace(/<[^>]+>/g, " ").replace(/&#x27;|&apos;/g, "'").replace(/ /g, " ").replace(/\s+/g, " ");

function energie(props: M) {
  return React.createElement(Energie, {
    dpeStatus: "not_found", dpe: null, audit: null, candidates: [], dossierId: "d1",
    onPick: () => {}, onNotInList: () => {}, onReselect: () => {}, onPickParNumero: () => {}, ...props,
  });
}

// ── 1. Le bâtiment de l'adresse ──────────────────────────────────────────────────────────────

test("rattachement exact et non ambigu : un bâtiment, son identifiant et ses autres adresses", () => {
  const f = fx("villeurbanne_angle");
  const id = identite(f);
  assert.equal(id.statut, "confirme");
  assert.equal(id.batiment.rnb_id, "ETRZP8JQ3DNK");
  assert.deepEqual(rnb.idsDesBatiments(id), ["ETRZP8JQ3DNK"]);
  const autres = rnb.autresAdresses(id, f.ban);
  assert.deepEqual(autres.map((a: M) => a.cle), ["69266_3620_00122"]);
  assert.equal(autres[0].libelle, "122 Avenue Roger Salengro, Villeurbanne");
  assert.equal(rnb.formatRnbId("ETRZP8JQ3DNK"), "ETRZ-P8JQ-3DNK");
  assert.equal(rnb.lienCarteRnb("ETRZP8JQ3DNK"), "https://rnb.beta.gouv.fr/carte?q=ETRZP8JQ3DNK");
});

test("plusieurs bâtiments pour une adresse : ambigu, aucun choisi, aucun diagnostic du « même bâtiment » cherché ni montré", () => {
  const id = identite(fx("puyravault_ambigu"));
  assert.equal(id.statut, "ambigu");
  assert.equal(id.batiments.length, 7);
  assert.equal(rnb.autresAdresses(id, "17293_0061_00003").length, 0);
  const l = rnb.ligneBatimentPasseport(id, "17293_0061_00003");
  assert.equal(l.lien, null);
  assert.match(l.valeur.replace(/ /g, " "), /^7 bâtiments rattachés à cette adresse$/);
  assert.match(l.complement, /ne dit pas lequel abrite le logement/);
  // Même si un appelant passait des candidats, le bloc ne se rend que derrière un bâtiment UNIQUE.
  const candidates = fiches(fx("villeurbanne_angle").ademe_batiment);
  const html = rendu.renderToStaticMarkup(React.createElement(MemeBat, {
    batiment: id, memeBatiment: { status: "present", candidates, tronque: false }, banId: "17293_0061_00003", onPick: () => {},
  }));
  assert.equal(html, "");
});

test("aucun bâtiment, ou référentiel muet : deux états distincts, et le second n'est jamais une absence", () => {
  assert.equal(identite(fx("bordeaux_aucun")).statut, "non_trouve");
  for (const corps of [null, {}, { results: "x" }, "<html>"]) {
    assert.deepEqual(rnb.identiteDepuisRnb(corps, LE), { statut: "indisponible" });
  }
  assert.equal(rnb.ligneBatimentPasseport({ statut: "non_trouve", consulteLe: LE }, "x"), null);
  assert.equal(rnb.ligneBatimentPasseport({ statut: "indisponible" }, "x"), null);
});

test("un bâtiment démoli, un projet ou un identifiant désactivé n'est pas le bâtiment de l'adresse", () => {
  const corps = { results: [
    { rnb_id: "AAAAAAAAAAAA", status: "demolished", is_active: true, addresses: [] },
    { rnb_id: "BBBBBBBBBBBB", status: "constructionProject", is_active: true, addresses: [] },
    { rnb_id: "CCCCCCCCCCCC", status: "constructed", is_active: false, addresses: [] },
    { rnb_id: "DDDDDDDDDDDD", status: "constructed", is_active: true, addresses: [] },
  ] };
  const id = rnb.identiteDepuisRnb(corps, LE);
  assert.equal(id.statut, "confirme");
  assert.equal(id.batiment.rnb_id, "DDDDDDDDDDDD");
});

// ── 2. Les diagnostics du même bâtiment ──────────────────────────────────────────────────────

test("plusieurs DPE candidats du même bâtiment : hors de la liste de l'adresse, logements et immeuble séparés", () => {
  const f = fx("villeurbanne_angle");
  const res = memeBat.memeBatimentHorsAdresse(
    { status: "present", candidates: memeBat.memeBatimentSeulement(fiches(f.ademe_batiment), f.ban), tronque: false },
    fiches(f.ademe_adresse),
  );
  assert.equal(res.status, "present");
  assert.equal(res.candidates.length, 19);
  const { logements, immeubles } = grain.repartirParGrain(res.candidates);
  assert.equal(logements.length, 18);
  assert.equal(immeubles.length, 1);
  assert.ok(res.candidates.every((c: M) => c.id_rnb === "ETRZP8JQ3DNK" && c.id_ban === "69266_3620_00122"));
});

test("un diagnostic déjà dans la liste de l'adresse n'est pas compté une seconde fois, et « présent » suit ce qui reste", () => {
  const f = fx("thenac_contradiction");
  const adresse = fiches(f.ademe_adresse);
  const parBatiment = fiches(f.ademe_batiment);
  const res = memeBat.memeBatimentHorsAdresse(
    { status: "present", candidates: memeBat.memeBatimentSeulement(parBatiment, f.ban), tronque: false }, adresse,
  );
  const vus = new Set(adresse.map((d: M) => d.id_dpe));
  assert.ok(res.candidates.every((c: M) => !vus.has(c.id_dpe) && c.id_ban !== f.ban));
  assert.deepEqual(memeBat.memeBatimentHorsAdresse({ status: "present", candidates: adresse, tronque: false }, adresse).status, "absent");
  assert.equal(memeBat.memeBatimentHorsAdresse({ status: "unavailable", candidates: [], tronque: false }, adresse).status, "unavailable");
});

test("le texte rendu dit de quel bâtiment on parle, combien, où, et la prudence avant le geste", () => {
  const f = fx("villeurbanne_angle");
  const id = identite(f);
  const candidates = memeBat.memeBatimentSeulement(fiches(f.ademe_batiment), f.ban);
  const t = texte(energie({ batiment: id, memeBatiment: { status: "present", candidates, tronque: false }, banId: f.ban }));
  assert.match(t, /Aucun diagnostic de performance énergétique n'est rattaché à cette adresse/);
  assert.match(t, /18 diagnostics de logement sont enregistrés à d'autres adresses du même bâtiment\./);
  assert.match(t, /rattache cette adresse à un bâtiment qui porte aussi 122 Avenue Roger Salengro\./);
  assert.match(t, /Ils ne sont pas enregistrés à cette adresse\./);
  assert.match(t, /maison mitoyenne/);
  assert.match(t, /N'en retenez un que si vous le reconnaissez\./);
  assert.match(t, /Voir ces diagnostics/);
  // Les lignes ne sont pas montrées d'emblée : aucune classe, aucun bouton « retenir » au premier niveau.
  assert.doesNotMatch(t, /classe [A-G]/);
  assert.doesNotMatch(t, /Retenir ce diagnostic/);
});

test("les lignes du même bâtiment disent où elles sont enregistrées, et le DPE d'immeuble n'est jamais une ligne à retenir", () => {
  const f = fx("villeurbanne_angle");
  const candidates = memeBat.memeBatimentSeulement(fiches(f.ademe_batiment), f.ban);
  const immeuble = candidates.find((c: M) => c.type_batiment === "immeuble");
  const appart = candidates.find((c: M) => c.type_batiment === "appartement");
  const champs = vue.champsVariables(candidates);
  assert.equal(vue.ligneCandidat(appart, champs, { banId: f.ban }).details[0], "enregistré au 122 Avenue Roger Salengro");
  assert.equal(grain.attribuableAuLogement(immeuble), false);
  assert.equal(grain.repartirParGrain(candidates).logements.includes(immeuble), false);
  // Sans contexte, la ligne est exactement celle d'avant FUT-80.
  assert.equal(vue.ligneCandidat(appart, champs).details.some((d: string) => d.startsWith("enregistré au")), false);
});

test("l'adresse se dit sur chaque ligne seulement quand elle peut varier", () => {
  const f = fx("villeurbanne_angle");
  const id = identite(f);
  const candidates = memeBat.memeBatimentSeulement(fiches(f.ademe_batiment), f.ban);
  // Une seule autre adresse, et tous les diagnostics y sont : l'introduction la nomme, les lignes non.
  assert.equal(rnb.adresseParLigne(candidates, rnb.autresAdresses(id, f.ban)), false);
  // Deux adresses possibles : chaque ligne dit la sienne.
  const deux = [...rnb.autresAdresses(id, f.ban), { cle: "69266_3620_00124", libelle: "124 Avenue Roger Salengro, Villeurbanne" }];
  assert.equal(rnb.adresseParLigne(candidates, deux), true);
  assert.equal(rnb.adresseParLigne([...candidates, { id_ban: null }], rnb.autresAdresses(id, f.ban)), true);
});

test("une maison : le seul diagnostic du bâtiment est à l'adresse voisine (58 pour 55), proposé, jamais attribué", () => {
  const f = fx("la_couarde_maison");
  const id = identite(f);
  assert.equal(id.statut, "confirme");
  const candidates = memeBat.memeBatimentSeulement(fiches(f.ademe_batiment), f.ban);
  assert.equal(candidates.length, 1);
  // La liste de l'adresse est vide : l'attribution d'avant dit « aucun », et le bâtiment n'y change rien.
  assert.equal(attrib.dpeAttributionStatus(fiches(f.ademe_adresse), "housenumber", true, rnb.idsDesBatiments(id)).status, "not_found");
  const t = texte(energie({ batiment: id, memeBatiment: { status: "present", candidates, tronque: false }, banId: f.ban }));
  assert.match(t, /Un diagnostic de logement est enregistré à une autre adresse du même bâtiment\./);
  assert.match(t, /porte aussi 58 Grande Rue\./);
  assert.match(t, /Voir ce diagnostic/);
});

// ── 3. Le rapprochement d'un diagnostic désigné ──────────────────────────────────────────────

const dossierVilleurbanne = { ban_id: "69266_0110_00002", address_label: "2 Rue des Alliés 69100 Villeurbanne", insee: "69266" };

test("même bâtiment, autre adresse : refusé avant FUT-80 (« commune »), rattachable après confirmation par l'ID-RNB", async () => {
  const appart = fiches(fx("villeurbanne_angle").ademe_batiment).find((c: M) => c.type_batiment === "appartement");
  assert.equal(rappr.rapprocher(appart, dossierVilleurbanne).niveau, "commune");
  const r = await rappr.rapprocherAvecBatiment(appart, dossierVilleurbanne, async () => ["ETRZP8JQ3DNK"]);
  assert.deepEqual(r, { niveau: "meme_batiment", attachable: true, confirmationRequise: true });
});

test("DPE proche mais d'un autre bâtiment : jamais rattaché par le bâtiment", async () => {
  const appart = { ...fiches(fx("villeurbanne_angle").ademe_batiment).find((c: M) => c.type_batiment === "appartement"), id_rnb: "ZZZZZZZZZZZZ" };
  const r = await rappr.rapprocherAvecBatiment(appart, dossierVilleurbanne, async () => ["ETRZP8JQ3DNK"]);
  assert.equal(r.niveau, "commune");
  assert.equal(r.attachable, false);
});

test("absence d'identifiant RNB : le référentiel n'est pas interrogé, et la réponse est celle d'avant", async () => {
  // Un DPE sans `id_rnb` à l'ADEME n'en porte pas la clé : sa forme (et l'empreinte des versions) ne change pas.
  const sans = dpe.toRecord({ ...fx("villeurbanne_angle").ademe_batiment[0], id_rnb: undefined, provenance_id_rnb: undefined });
  assert.equal("id_rnb" in sans, false);
  assert.equal("provenance_id_rnb" in sans, false);
  let appels = 0;
  const r = await rappr.rapprocherAvecBatiment(sans, dossierVilleurbanne, async () => { appels++; return ["ETRZP8JQ3DNK"]; });
  assert.equal(appels, 0);
  assert.equal(r.niveau, "commune");
});

test("un diagnostic à la bonne adresse n'a pas besoin du référentiel, même s'il désigne un autre bâtiment", async () => {
  const f = fx("thenac_contradiction");
  const contredit = fiches(f.ademe_adresse).find((c: M) => c.provenance_id_rnb === "Logiciel");
  let appels = 0;
  const r = await rappr.rapprocherAvecBatiment(contredit, { ban_id: f.ban, address_label: f.label, insee: f.insee }, async () => { appels++; return ["ASTCYQ4TDP38"]; });
  assert.equal(r.niveau, "adresse");
  assert.equal(appels, 0);
});

test("référentiel indisponible pendant la vérification : rien n'est refusé de plus ni accepté de plus qu'avant", async () => {
  const appart = fiches(fx("villeurbanne_angle").ademe_batiment).find((c: M) => c.type_batiment === "appartement");
  const r = await rappr.rapprocherAvecBatiment(appart, dossierVilleurbanne, async () => { throw new Error("RNB muet"); });
  assert.equal(r.niveau, "commune");
  assert.equal(r.attachable, false);
});

// ── 4. L'attribution automatique et les choix du lecteur ─────────────────────────────────────

test("une maison seule à l'adresse, rattachée par la base à un bâtiment à 78 m : plus retenue d'office", () => {
  const f = fx("monchaux_auto");
  const candidates = fiches(f.ademe_adresse);
  const batiments = rnb.idsDesBatiments(identite(f));
  assert.deepEqual(batiments, ["JHR966BZVKDA"]);
  assert.equal(candidates[0].id_rnb, "Z4ZCPFA4P9P2");
  // Avant FUT-80, et sur un rapport antérieur (aucun bâtiment connu) : retenue automatiquement.
  assert.equal(attrib.dpeAttributionStatus(candidates, "housenumber", true).status, "auto_confirmed");
  assert.equal(auto.departDpe({ dpe_selection_status: "pending", dpe_selection_at: null }, candidates, "housenumber", true).kind, "proposer_auto");
  // Avec le bâtiment : le lecteur choisit, et la ligne dit pourquoi.
  assert.equal(attrib.dpeAttributionStatus(candidates, "housenumber", true, batiments).status, "selection_required");
  assert.equal(auto.departDpe({ dpe_selection_status: "pending", dpe_selection_at: null }, candidates, "housenumber", true, batiments).kind, "a_choisir");
  const ligne = vue.ligneCandidat(candidates[0], vue.champsVariables(candidates), { batiments });
  assert.ok(ligne.details.includes("rattaché par la base ADEME à un autre bâtiment"));
});

test("le bâtiment n'ajoute jamais de certitude : un candidat concordant ne devient pas automatique pour autant", () => {
  const f = fx("thenac_contradiction");
  const concordant = fiches(f.ademe_adresse).filter((c: M) => c.id_rnb === "ASTCYQ4TDP38");
  assert.ok(concordant.length > 1);
  // Un appartement concordant reste à choisir : la règle d'avant ne retient que les maisons.
  assert.equal(attrib.dpeAttributionStatus([concordant[0]], "housenumber", true, ["ASTCYQ4TDP38"]).status, "selection_required");
});

test("les DPE saisis sur un autre bâtiment le disent, avec la bonne voix (diagnostiqueur ou base)", () => {
  const f = fx("thenac_contradiction");
  const adresse = fiches(f.ademe_adresse);
  const champs = vue.champsVariables(adresse);
  const logiciel = adresse.find((c: M) => c.provenance_id_rnb === "Logiciel");
  const reprise = adresse.find((c: M) => c.provenance_id_rnb === "Reprise RNB");
  assert.ok(vue.ligneCandidat(logiciel, champs, { batiments: ["ASTCYQ4TDP38"] }).details.includes("rattaché par son diagnostiqueur à un autre bâtiment"));
  assert.equal(vue.ligneCandidat(reprise, champs, { batiments: ["ASTCYQ4TDP38"] }).details.some((d: string) => d.startsWith("rattaché")), false);
  // Sans bâtiment connu (référentiel muet, rapport antérieur), rien n'est contredit.
  assert.equal(vue.ligneCandidat(logiciel, champs, { batiments: [] }).details.some((d: string) => d.startsWith("rattaché")), false);
});

test("une sélection explicite du lecteur est conservée, même si le bâtiment la contredit", () => {
  const f = fx("monchaux_auto");
  const candidates = fiches(f.ademe_adresse);
  const batiments = rnb.idsDesBatiments(identite(f));
  for (const row of [
    { dpe_selection_status: "user_confirmed", dpe_selection_at: "2026-10-01T00:00:00Z" },
    { dpe_selection_status: "auto_confirmed", dpe_selection_at: "2026-10-01T00:00:00Z" },
    { dpe_selection_status: "not_in_list", dpe_selection_at: "2026-10-01T00:00:00Z" },
  ]) {
    assert.equal(auto.departDpe(row, candidates, "housenumber", true, batiments).kind, "restaurer");
  }
});

// ── 5. Les versions du rapport et les anciens dossiers ───────────────────────────────────────

const rapportBase = { address: { id: "x", label: "x", city: null, citycode: null, postcode: null, latitude: 1, longitude: 1 } };

test("un rapport antérieur (sans bâtiment) ne s'invente ni panne ni absence", () => {
  assert.deepEqual(version.sourcesAbsentes(rapportBase).filter((s: string) => /batiment/.test(s)), []);
  assert.equal(rnb.ligneBatimentPasseport(undefined, "x"), null);
  assert.deepEqual(rnb.idsDesBatiments(undefined), []);
});

test("référentiel ou recherche du même bâtiment en panne : une source absente, dite comme telle", () => {
  const r = { ...rapportBase, batiment: { statut: "indisponible" }, dpeMemeBatiment: { status: "unavailable", candidates: [], tronque: false } };
  assert.deepEqual(version.sourcesAbsentes(r).filter((s: string) => /batiment/.test(s)), ["batiment", "diagnostics_meme_batiment"]);
  assert.deepEqual(version.sourcesAbsentes({ ...rapportBase, batiment: { statut: "non_trouve", consulteLe: LE } }).filter((s: string) => /batiment/.test(s)), []);
  const t = texte(React.createElement(MemeBat, {
    batiment: identite(fx("villeurbanne_angle")), memeBatiment: { status: "unavailable", candidates: [], tronque: false }, banId: "69266_0110_00002", onPick: () => {},
  }));
  assert.match(t, /n'ont pas pu être vérifiés lors de cette collecte/);
});

test("l'actualisation d'une version antérieure : le bâtiment trouvé fait une version nouvelle, le référentiel muet ne remplace rien", () => {
  const ancienne = { numero: 1, collecteeLe: LE, sourcesAbsentes: version.sourcesAbsentes(rapportBase), synthese: null, syntheseHash: null, syntheseDpe: null, report: rapportBase, reportHash: "h1" };
  const avec = { ...rapportBase, batiment: identite(fx("villeurbanne_angle")) };
  assert.equal(version.issueActualisation(avec, "h2", ancienne), "nouvelle_version");
  assert.equal(version.issueActualisation({ ...rapportBase, batiment: { statut: "indisponible" } }, "h3", ancienne), "refusee");
});

test("un ancien dossier se rend comme avant : ni ligne « Bâtiment », ni bloc du même bâtiment", () => {
  const address = { id: "69266_0110_00002", label: "2 Rue des Alliés 69100 Villeurbanne", city: "Villeurbanne", citycode: "69266", postcode: "69100", latitude: 45.77, longitude: 4.88 };
  const avant = texte(React.createElement(Passeport, { address, parcel: null, dpe: null }));
  assert.doesNotMatch(avant, /Bâtiment \(RNB\)/);
  const t = texte(energie({}));
  assert.doesNotMatch(t, /même bâtiment/);
  const apres = texte(React.createElement(Passeport, { address, parcel: null, dpe: null, batiment: identite(fx("villeurbanne_angle")) }));
  assert.match(apres, /Bâtiment \(RNB\) ETRZ-P8JQ-3DNK Il porte aussi 122 Avenue Roger Salengro\./);
  assert.match(rendu.renderToStaticMarkup(React.createElement(Passeport, { address, parcel: null, dpe: null, batiment: identite(fx("villeurbanne_angle")) })), /href="https:\/\/rnb\.beta\.gouv\.fr\/carte\?q=ETRZP8JQ3DNK"/);
});

// ── 6. Ce que le bâtiment ne dit jamais ──────────────────────────────────────────────────────

test("l'identité du bâtiment ne porte aucune performance, et ne donne aucune classe au logement", () => {
  const id = identite(fx("villeurbanne_angle"));
  const json = JSON.stringify(id);
  assert.doesNotMatch(json, /etiquette|classe|conso|dpe|bdnb/i);
  const t = texte(React.createElement(Passeport, { address: { id: "69266_0110_00002", label: "2 Rue des Alliés", city: null, citycode: null, postcode: null, latitude: 1, longitude: 1 }, parcel: null, dpe: null, batiment: id }));
  assert.doesNotMatch(t, /Classé|diagnostic énergétique/);
});

test("les phrases de prudence lient leurs petits mots (espaces insécables)", () => {
  assert.match(rnb.PHRASES_MEME_BATIMENT.prudence, /à cette adresse/);
  assert.match(rnb.PHRASES_MEME_BATIMENT.titre(3), /^3 diagnostics/);
  assert.equal(rnb.listeAdresses([{ cle: "a", libelle: "1 Rue A, X" }, { cle: "b", libelle: "2 Rue B, X" }, { cle: "c", libelle: "3 Rue C, X" }, { cle: "d", libelle: "4 Rue D, X" }, { cle: "e", libelle: "5 Rue E, X" }]).replace(/ /g, " "),
    "1 Rue A, 2 Rue B, 3 Rue C et 2 autres adresses");
  assert.equal(rnb.voieDuLibelle("122 Avenue Roger Salengro 69100 Villeurbanne"), "122 Avenue Roger Salengro");
});
