// FUT-176 · LES STATUTS URBAINS INSEE, DE L'IMPORT AU TEXTE.
//
// Avant : l'import ne gardait que le code de l'unité urbaine. Une commune sans code (hors unité urbaine, OU absente
// de l'ancien fichier) devenait « Commune isolée, hors agglomération » et « structure la vie locale d'un territoire
// plus rural » ; la commune la plus peuplée de son unité urbaine devenait « Principal pôle urbain local », qui
// « concentre les fonctions urbaines de son bassin de vie » ; toute commune d'une unité urbaine était une « Ville ».
// Ici, six familles d'assertions : distinctions de statut, très petites communes, données manquantes, incohérences
// de codes, absence de surinterprétation, compatibilité avec les anciennes lectures. Chacune vérifie ce que le texte
// DIT, pas seulement qu'il apparaît (AGENTS.md).
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { buildTerritoireSnapshot, type UrbanRole } from "./territoire/facts.ts";
import { chatelaillonInputs } from "./territoire/__fixtures__/chatelaillon.ts";
import { buildTerritoryIdentity } from "./territory-identity.ts";
import {
  projectForSynthesis, ROLE_TEXT, ROLE_TEXT_ARRONDISSEMENT, roleTerritorialPourSynthese, SYNTHESIS_CONTRACT_VERSION, SYNTHESIS_SYSTEM,
} from "./territoire/synthesis-contract.ts";
import { AGGLOMERATION_SIZE_CONVENTION, categoryStatementFragment, labelForCategory } from "./decision/agglomeration-facts.ts";
import { deterministicSynthesis } from "./territoire/synthesis-deterministe.ts";
import { checkAssertions } from "./territoire/synthesis-checks.ts";
import {
  normaliserRoleUrbain, peutDireVille, roleUrbain, ROLES_URBAINS, SEUIL_HABITANTS_VILLE, type RoleUrbain,
} from "./territoire/statut-urbain.ts";
import { lireTaille, type Lieu } from "./accueil/pastilles.ts";

/* eslint-disable @typescript-eslint/no-explicit-any */
type M = any;
let V: M;

const racine = pathToFileURL(`${process.cwd()}/`).href;
const hook = `
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
  return next(spec, ctx);
}`;

before(async () => {
  register(`data:text/javascript,${encodeURIComponent(hook)}`);
  V = await import("./comparateur-vie.ts");
});

const INDEX = JSON.parse(gunzipSync(readFileSync("data/comparateur-index.json.gz")).toString("utf8")) as { meta: M; communes: M[] };
const PAR_INSEE = new Map(INDEX.communes.map((c) => [c.insee, c]));
const PLM = /^(751(0[1-9]|1\d|20)|6938[1-9]|132(0[1-9]|1[0-6]))$/;
const T0 = "2026-11-09T00:00:00.000Z";

// Ce qu'un texte de statut ne doit JAMAIS dire : un isolement, un rôle de pôle, une offre de services, une animation.
const SURINTERPRETATION = /isolée?s?\b|\bpôle|structure la vie|concentre|fonctions urbaines|services|commerces|anim|vivante|rural|bassin de vie/i;

/** La carte d'identité telle que la page Territoire la construit, pour un rôle et une population donnés. */
function identite(nom: string, population: number | null, urbanRole: UrbanRole | null, typo = { type: "interieur", label: "Intérieur" }) {
  const i = chatelaillonInputs();
  i.communeName = nom;
  i.typology = typo as M;
  i.entry = { ...i.entry!, population, densite: 100 };
  i.urbanRole = urbanRole;
  const s = buildTerritoireSnapshot(i, T0);
  return { id: buildTerritoryIdentity(s), projection: projectForSynthesis(s, "gwl20") as M, s };
}

/** La même chose, depuis l'index réel, par le même accesseur que la page (getTerritoryContext). */
async function identiteReelle(insee: string) {
  const ctx = await V.getTerritoryContext(insee);
  assert.ok(ctx, insee);
  const role: UrbanRole = { role: ctx.role, uuLabel: ctx.uuLabel, uuPop: ctx.uuPop, ...(ctx.arrondissementDe ? { arrondissementDe: ctx.arrondissementDe } : {}) };
  return { ctx, ...identite(ctx.entry.nom, ctx.entry.population ?? null, role) };
}

// ── 1. Les données officielles : l'index porte le statut Insee de CHAQUE commune ─────────────────────────────

test("index : chaque commune porte un statut Insee, et le code suit le statut (hors unité urbaine ⟺ pas de code)", () => {
  const comptes: Record<string, number> = {};
  for (const c of INDEX.communes) {
    assert.ok(["C", "B", "I", "H"].includes(c.uu_statut), `${c.insee} : statut ${c.uu_statut}`);
    assert.equal(c.uu == null, c.uu_statut === "H", `${c.insee} : code ${c.uu}, statut ${c.uu_statut}`);
    assert.equal(c.hors_uu, c.uu_statut === "H", `${c.insee} : hors_uu`);
    comptes[c.uu_statut] = (comptes[c.uu_statut] ?? 0) + 1;
  }
  // Fichier Insee « géographie au 01/01/2025 » : H 27 279, C 1 496, B 4 746, I 1 222 ; + 45 arrondissements (C).
  assert.deepEqual(comptes, { H: 27279, C: 1541, B: 4746, I: 1222 });
  assert.deepEqual(INDEX.meta.uniteUrbaine.comptes, comptes);
  assert.match(INDEX.meta.uniteUrbaine.source, /géographie au 01\/01\/2025/);
  assert.equal(INDEX.meta.uniteUrbaine.url, "https://www.insee.fr/fr/statistiques/fichier/4802589/UU2020_au_01-01-2025.zip");
});

test("index : une ville isolée est seule dans son unité urbaine ; ville-centre et banlieue appartiennent à une agglomération de plusieurs communes", () => {
  const membres = new Map<string, M[]>();
  for (const c of INDEX.communes) if (c.uu) membres.set(c.uu, [...(membres.get(c.uu) ?? []), c]);
  for (const [uu, cs] of membres) {
    const statuts = new Set(cs.map((c) => c.uu_statut));
    if (statuts.has("I")) assert.equal(cs.length, 1, `UU ${uu} : ville isolée avec ${cs.length} communes`);
    else assert.ok(cs.length >= 2, `UU ${uu} : une seule commune, statut ${[...statuts]}`);
    if (cs.length >= 2) assert.ok(statuts.has("C"), `UU ${uu} : aucune ville-centre`);
  }
});

test("index : Paris, Lyon, Marseille — chaque arrondissement porte le statut et l'unité urbaine de sa ville", () => {
  const attendu: Record<string, string> = { "75": "00851", "69": "00760", "13": "00759" };
  const arr = INDEX.communes.filter((c) => PLM.test(c.insee));
  assert.equal(arr.length, 45);
  for (const c of arr) assert.deepEqual([c.uu_statut, c.uu], ["C", attendu[c.insee.slice(0, 2)]], c.insee);
});

test("codes : les communes nouvelles absentes de l'ancien fichier reçoivent le statut officiel, jamais « hors unité urbaine » par défaut", () => {
  const cas: Record<string, [string, string | null]> = {
    "49126": ["I", "49305"], // Orée d'Anjou : ville isolée (était « Commune isolée, hors agglomération »)
    "69114": ["B", "00760"], // Porte des Pierres Dorées : banlieue de Lyon (était hors unité urbaine)
    "85165": ["B", "85139"], // L'Oie, rétablie le 01/01/2024
    "85212": ["C", "85139"], // Sainte-Florence, rétablie le 01/01/2024
    // Hors unité urbaine, ET le fichier officiel le dit :
    "12218": ["H", null], "14581": ["H", null], "15031": ["H", null], "15035": ["H", null],
    "15047": ["H", null], "15171": ["H", null], "60694": ["H", null],
  };
  for (const [insee, [statut, uu]] of Object.entries(cas)) {
    const c = PAR_INSEE.get(insee)!;
    assert.deepEqual([c.uu_statut, c.uu ?? null], [statut, uu], `${insee} ${c.nom}`);
  }
  // Les six exemples du ticket.
  const exemples: Record<string, [string, string | null]> = {
    "2B096": ["I", "2B202"], "02100": ["H", null], "05082": ["B", "05104"],
    "49126": ["I", "49305"], "28085": ["C", "28501"], "92044": ["B", "00851"],
  };
  for (const [insee, [statut, uu]] of Object.entries(exemples)) {
    const c = PAR_INSEE.get(insee)!;
    assert.deepEqual([c.uu_statut, c.uu ?? null], [statut, uu], `${insee} ${c.nom}`);
  }
});

test("codes : la population des agglomérations corrigées suit leur nouvelle composition", () => {
  const sommeUU = (uu: string) => INDEX.communes.filter((c) => c.uu === uu).reduce((t, c) => t + (c.population ?? 0), 0);
  for (const insee of ["69114", "85165", "85212", "49126"]) {
    const c = PAR_INSEE.get(insee)!;
    assert.equal(c.uu_pop, sommeUU(c.uu), insee);
  }
  assert.equal(PAR_INSEE.get("49126")!.uu_pop, PAR_INSEE.get("49126")!.population, "une ville isolée est sa propre agglomération");
  assert.equal(PAR_INSEE.get("85212")!.uu_count, 2);
});

test("couverture nationale : l'index reproduit le fichier Insee commune par commune (contrôle sauté sans le fichier source)", (t) => {
  if (!existsSync("data/source/UU2020_au_01-01-2025.xlsx")) return t.skip("data/source/UU2020_au_01-01-2025.xlsx absent (non versionné)");
  if (!existsSync("data/comparateur-index.json")) return t.skip("copie de travail de l'index absente (npm run index:unpack)");
  // Le compte rendu du script part sur stderr ; sans --write-index, il ne touche à rien.
  const err = execFileSync("sh", ["-c", "python3 scripts/populate-unite-urbaine.py 2>&1 >/dev/null"], { encoding: "utf8" });
  assert.match(err, /'fichier': 34743, 'arrondissements': 45, 'inconnues': 0/);
  assert.doesNotMatch(err, /code uu modifié|statut inconnu ·/, "l'index diverge du fichier officiel");
});

// ── 2. Du statut au rôle : des distinctions, jamais une déduction ─────────────────────────────────────────

test("statut → rôle : les quatre statuts Insee restent distincts, et les incohérences ne se tranchent pas", () => {
  assert.equal(roleUrbain("28501", "C"), "ville_centre");
  assert.equal(roleUrbain("00851", "B"), "banlieue");
  assert.equal(roleUrbain("2B202", "I"), "ville_isolee");
  assert.equal(roleUrbain(null, "H"), "hors_uu");
  // Hors unité urbaine et ville isolée ne se confondent jamais.
  assert.notEqual(roleUrbain("2B202", "I"), roleUrbain(null, "H"));
  // Incohérences de codes : statut H avec un code, statut urbain sans code, statut inconnu du référentiel.
  assert.equal(roleUrbain("02000", "H"), "inconnu");
  assert.equal(roleUrbain(null, "C"), "inconnu");
  assert.equal(roleUrbain("  ", "B"), "inconnu");
  assert.equal(roleUrbain("28501", "X"), "dans_agglomeration");
  // Donnée manquante : ni code ni statut, c'est inconnu, jamais « hors unité urbaine ».
  assert.equal(roleUrbain(null, null), "inconnu");
  assert.equal(roleUrbain(undefined, undefined), "inconnu");
  assert.equal(roleUrbain("28501", null), "dans_agglomeration");
});

test("très petites communes : « ville » exige un centre (ou une agglomération à elle seule) ET 2 000 habitants", () => {
  assert.equal(SEUIL_HABITANTS_VILLE, 2000);
  assert.equal(peutDireVille("ville_centre", 2000), true);
  assert.equal(peutDireVille("ville_centre", 1999), false);
  assert.equal(peutDireVille("ville_isolee", 7654), true); // Corte
  assert.equal(peutDireVille("banlieue", 68009), false); // Levallois-Perret : commune de banlieue
  assert.equal(peutDireVille("banlieue", 171), false); // Mont-Dauphin
  assert.equal(peutDireVille("hors_uu", 50000), false);
  assert.equal(peutDireVille("dans_agglomeration", 50000), false);
  assert.equal(peutDireVille("ville_centre", null), false);
});

// ── 3. Ce que la carte d'identité dit, sur les exemples du ticket (index réel) ──────────────────────────────

test("identité : Corte, Bony, Mont-Dauphin, Orée d'Anjou, Chartres, Levallois-Perret — avant / après", async () => {
  const attendus: Record<string, { role: RoleUrbain; ligne: string; resume: string }> = {
    // Avant : « Principal pôle urbain local » ; « Corte concentre les fonctions urbaines de son bassin de vie ».
    "2B096": { role: "ville_isolee", ligne: "Forme à elle seule une agglomération", resume: "Ville de l'intérieur, Corte forme à elle seule une agglomération." },
    // Avant : « Commune isolée, hors agglomération » ; « Bony structure la vie locale d'un territoire plus rural ».
    "02100": { role: "hors_uu", ligne: "Hors agglomération : aucun ensemble bâti continu de 2 000 habitants", resume: "Commune de l'intérieur, Bony se situe hors de toute agglomération." },
    // Avant : « Ville de l'intérieur, Mont-Dauphin s'inscrit dans l'agglomération de Guillestre » (171 habitants).
    "05082": { role: "banlieue", ligne: "Commune de banlieue de l'agglomération de Guillestre (3 258 habitants)", resume: "Commune de l'intérieur, Mont-Dauphin s'inscrit dans l'agglomération de Guillestre." },
    // Avant : « Commune isolée, hors agglomération » — la donnée manquait, l'Insee la classe ville isolée.
    "49126": { role: "ville_isolee", ligne: "Forme à elle seule une agglomération", resume: "Ville de l'intérieur, Orée d'Anjou forme à elle seule une agglomération." },
    // Avant : « Principal pôle d'une agglomération de 88 891 habitants » ; « concentre les fonctions urbaines… ».
    "28085": { role: "ville_centre", ligne: "Ville-centre de l'agglomération de Chartres (88 891 habitants)", resume: "Ville de l'intérieur, Chartres est au centre de son agglomération." },
    // Avant : « Ville de l'intérieur, Levallois-Perret s'inscrit dans l'agglomération de Paris ».
    "92044": { role: "banlieue", ligne: "Commune de banlieue de l'agglomération de Paris (10 893 507 habitants)", resume: "Commune de l'intérieur, Levallois-Perret s'inscrit dans l'agglomération de Paris." },
  };
  for (const [insee, a] of Object.entries(attendus)) {
    const { ctx, id } = await identiteReelle(insee);
    assert.equal(ctx.role, a.role, insee);
    assert.equal(id.role, a.ligne, insee);
    assert.equal(id.summary, a.resume, insee);
    assert.doesNotMatch(`${id.role} ${id.summary}`, SURINTERPRETATION, insee);
  }
});

test("identité : un arrondissement porte le statut de sa ville sans être lui-même la ville-centre", async () => {
  const { ctx, id } = await identiteReelle("75101");
  assert.equal(ctx.arrondissementDe, "Paris");
  assert.equal(id.role, "Arrondissement de Paris, ville-centre de son agglomération (10 893 507 habitants)");
  assert.equal(id.summary, "Arrondissement de l'intérieur, Paris 1er Arrondissement appartient à Paris, ville-centre de son agglomération.");
  // Une commune ordinaire n'est jamais un arrondissement.
  assert.equal((await V.getTerritoryContext("28085")).arrondissementDe, null);
  // Paris, Lyon, Marseille lus à la commune : ville-centre.
  for (const insee of ["75056", "69123", "13055"]) assert.equal((await V.getLectureCommunalePLM(insee)).role, "ville_centre", insee);
});

test("identité : un statut inconnu ne produit aucune ligne de rôle et aucun verbe, jamais « hors agglomération »", () => {
  const { id, projection } = identite("Orée d'Anjou", 17162, { role: "inconnu", uuLabel: null, uuPop: null });
  assert.equal(id.role, null);
  assert.equal(id.summary, "Orée d'Anjou, commune de l'intérieur.");
  assert.equal(projection.commune.role_territorial, null, "rien n'est dit au modèle");
  assert.doesNotMatch(deterministicSynthesis(projection, "gwl20"), /agglomération/);
});

test("surinterprétation : aucun rôle, à aucune taille, ne dit isolement, pôle, services ou animation", () => {
  for (const role of ROLES_URBAINS) {
    for (const pop of [50, 1999, 2000, 25000, 250000]) {
      const { id, projection } = identite("Commune test", pop, { role, uuLabel: role === "hors_uu" ? null : "Agglo test", uuPop: 300000 });
      const texte = [id.role ?? "", id.summary, projection.commune.role_territorial?.role ?? "", deterministicSynthesis(projection, "gwl20").split("\n")[4] ?? ""].join(" | ");
      assert.doesNotMatch(texte, SURINTERPRETATION, `${role} ${pop} : ${texte}`);
      // « Ville » seulement pour un centre ou une ville isolée d'au moins 2 000 habitants.
      assert.equal(/^Ville\b/.test(id.summary), peutDireVille(role, pop), `${role} ${pop} : ${id.summary}`);
    }
  }
});

// ── 4. Synthèse rédigée : ce qui est dit au modèle, et ce que le contrôle refuse ─────────────────────────────

test("synthèse : le rôle transmis est le statut en mots courants ; hors agglomération, aucune agglomération n'est nommée", () => {
  assert.equal(SYNTHESIS_CONTRACT_VERSION.split(":")[0], "territoire-synthese@6", "le cache des anciennes synthèses est invalidé");
  for (const r of ROLES_URBAINS) if (ROLE_TEXT[r]) assert.doesNotMatch(ROLE_TEXT[r]!, SURINTERPRETATION, r);
  const hors = identite("Bony", 139, { role: "hors_uu", uuLabel: "Bony", uuPop: 139 }).projection.commune.role_territorial;
  assert.deepEqual(hors, { role: ROLE_TEXT.hors_uu, agglomeration: null, population_agglomeration: null });
  const centre = identite("Chartres", 38447, { role: "ville_centre", uuLabel: "Chartres", uuPop: 88891 });
  assert.match(deterministicSynthesis(centre.projection, "gwl20"), /Chartres, 38.447 habitants, au centre de son agglomération,/);
  const isolee = identite("Corte", 7654, { role: "ville_isolee", uuLabel: "Corte", uuPop: 7654 });
  assert.match(deterministicSynthesis(isolee.projection, "gwl20"), /Corte, 7.654 habitants, seule commune de son agglomération,/);
  assert.match(SYNTHESIS_SYSTEM, /N'en déduisez jamais la présence de services ou de commerces, l'animation, l'isolement/);
});

test("contrôle : « commune isolée », « principal pôle », des services déduits sont refusés ; une négation ou une « année isolée » non", () => {
  const p = identite("Bony", 139, { role: "hors_uu", uuLabel: null, uuPop: null }).projection;
  const refuse = (t: string) => checkAssertions(t, p).some((v) => v.rule === "interdit:statut-urbain-surinterprete");
  assert.equal(refuse("Bony est une commune isolée, loin de tout."), true);
  assert.equal(refuse("La commune reste assez isolée."), true);
  assert.equal(refuse("Chartres, principal pôle de son agglomération, voit ses étés se réchauffer."), true);
  assert.equal(refuse("Corte concentre les services de la vallée."), true);
  assert.equal(refuse("Ville-centre, elle structure la vie locale."), true);
  assert.equal(refuse("Bony n'est pas une commune isolée au sens de cette donnée."), false);
  assert.equal(refuse("Une année isolée peut s'écarter de la moyenne."), false);
});

// ── 5. Compatibilité : les lectures d'avant FUT-176 ne disent pas plus qu'elles ne savaient ─────────────────

test("compatibilité : un snapshot ancien (« isolee », « pole », « agglo ») ne dit ni isolement, ni pôle", () => {
  assert.equal(normaliserRoleUrbain("isolee"), "inconnu", "« isolee » mêlait hors unité urbaine et donnée absente");
  assert.equal(normaliserRoleUrbain("pole"), "dans_agglomeration");
  assert.equal(normaliserRoleUrbain("agglo"), "dans_agglomeration");
  assert.equal(normaliserRoleUrbain("banlieue"), "banlieue");
  assert.equal(normaliserRoleUrbain(42), "inconnu");

  const isolee = identite("Bony", 139, { role: "isolee", uuLabel: null, uuPop: null });
  assert.equal(isolee.id.role, null);
  assert.equal(isolee.id.summary, "Bony, commune de l'intérieur.");
  assert.equal(isolee.projection.commune.role_territorial, null);

  const pole = identite("Chartres", 38447, { role: "pole", uuLabel: "Chartres", uuPop: 88891 });
  assert.equal(pole.id.role, "Dans l'agglomération de Chartres (88 891 habitants)");
  assert.equal(pole.id.summary, "Commune de l'intérieur, Chartres s'inscrit dans une agglomération.");

  // La Châtelaillon figée (« agglo ») garde son empreinte de snapshot (cf. fut147-non-regression).
  const chat = buildTerritoireSnapshot(chatelaillonInputs(), T0);
  assert.equal(buildTerritoryIdentity(chat).role, "Dans l'agglomération de La Rochelle (138 236 habitants)");
});

test("compatibilité : une projection en cache aux anciens libellés ne fait rien dire au patron déterministe", () => {
  const p = identite("Bony", 139, { role: "hors_uu", uuLabel: null, uuPop: null }).projection;
  for (const ancien of ["commune isolée, hors agglomération", "principal pôle de son agglomération"]) {
    const vieille = { ...p, commune: { ...p.commune, role_territorial: { role: ancien, agglomeration: "Bony", population_agglomeration: 139 } } };
    const phrase = deterministicSynthesis(vieille, "gwl20").split("\n")[4]!;
    assert.match(phrase, /^Bony, 139 habitants, est une commune peu dense/, phrase);
  }
});

// ── 6. Comparateur et accueil : les mêmes distinctions ───────────────────────────────────────────────────────

test("comparateur : « petite ville » et « aux portes d'une grande ville » suivent la commune et son statut", async () => {
  const PETITE_VILLE = "Pour une petite ville qui reste vraiment vivante.";
  const PERI = "Pour vivre aux portes d'une grande ville, sans en habiter le centre.";
  // Mont-Dauphin (171 habitants, banlieue d'une agglomération de 3 258) n'est jamais une « petite ville ».
  const md = await V.getCommuneEntry("05082");
  assert.ok(!V.buildIdentiteCandidates({ ...md, vieLocale: { score: 99 } }).includes(PETITE_VILLE));
  assert.equal(V.buildIdentiteCandidates(md).includes(PETITE_VILLE), false);
  // Béthune est ville-centre de son agglomération : « sans en habiter le centre » y était faux.
  assert.equal(V.buildIdentiteCandidates(await V.getCommuneEntry("62119")).includes(PERI), false);
  // Une commune de banlieue la garde (Sceaux).
  assert.equal(V.buildIdentiteCandidates(await V.getCommuneEntry("92071"))[0], PERI);
});

test("comparateur : la dimension « Isolement » parle d'une taille d'agglomération, ni d'un bassin de vie ni de services", async () => {
  const dim = V.DIMENSIONS.find((d: M) => d.key === "eviter_isolement");
  assert.deepEqual(dim.paliers, ["Grande agglomération", "Agglomération moyenne", "Petite agglomération ou commune"]);
  assert.match(dim.aide, /ne mesure pas à lui seul l'accès aux services/);
  for (const t of [dim.gp, dim.forte, ...dim.paliers]) assert.doesNotMatch(t, /bassin de vie|dessert/, t);
  assert.equal(V.reasonText("eviter_isolement", await V.getCommuneEntry("92044")), "dans une grande agglomération");
  assert.equal(V.reasonText("eviter_isolement", await V.getCommuneEntry("02100")), "commune hors agglomération");
  assert.equal(V.reasonText("eviter_isolement", await V.getCommuneEntry("05082")), "dans une petite agglomération");
  assert.equal(V.raisonNeg("eviter_isolement", null), "commune ou agglomération plus petite que souhaité");
  assert.doesNotMatch(V.REASON_NEG_INTERMEDIAIRE.eviter_isolement, /bassin/);
});

test("accueil : l'agglomération n'est jamais nommée d'après la commune lue", () => {
  const lieu: Lieu = { type: "commune", libelle: "Levallois-Perret", commune: "Levallois-Perret", insee: "92044" };
  const l = lireTaille(lieu, { issue: "mismatch", phraseTaille: null, population: 10893507, source: "urban_unit" } as M);
  assert.equal(l.fait!.texte, `Environ ${(10893507).toLocaleString("fr-FR")} habitants dans l'agglomération dont fait partie Levallois-Perret.`);
  assert.doesNotMatch(l.fait!.texte, /agglomération de Levallois-Perret/);
  const bony = lireTaille({ ...lieu, libelle: "Bony", commune: "Bony", insee: "02100" }, { issue: "favorable", phraseTaille: null, population: 139, source: "commune" } as M);
  assert.equal(bony.fait!.texte, "Environ 139 habitants à Bony.");
});

// ── 7. Contre-revue : arrondissements dans la synthèse, mot « ville » canonique, statut inconnu ─────────────

test("synthèse : Paris 20e, Lyon 9e, Marseille 16e — la projection dit l'arrondissement, le statut reste celui de la ville", async () => {
  for (const [insee, ville] of [["75120", "Paris"], ["69389", "Lyon"], ["13216", "Marseille"]] as const) {
    const { ctx, projection } = await identiteReelle(insee);
    const r = projection.commune.role_territorial;
    assert.equal(r.role, ROLE_TEXT_ARRONDISSEMENT, insee);
    assert.notEqual(r.role, ROLE_TEXT.ville_centre, `${insee} : l'arrondissement n'est pas lui-même au centre`);
    assert.equal(r.commune, ville);
    assert.equal(r.agglomeration, ctx.uuLabel);
    // Les faits propres à l'arrondissement restent à leur grain : la population est la sienne, pas celle de la ville.
    assert.equal(projection.commune.population_habitants, ctx.entry.population);
    assert.ok(projection.commune.population_habitants < r.population_agglomeration);
    const texte = deterministicSynthesis(projection, "gwl20");
    assert.match(texte, new RegExp(`, arrondissement de ${ville} \\(ville-centre de son agglomération\\),`), insee);
    assert.doesNotMatch(texte, /au centre de (son |l')agglomération/, insee);
    assert.doesNotMatch(texte, /est une commune (dense|peu dense)/, `${insee} : un arrondissement n'est pas une commune`);
    assert.deepEqual(checkAssertions(texte, projection).filter((v) => v.rule.startsWith("interdit:arrondissement")), [], insee);
  }
  // Un rôle d'arrondissement incohérent (autre que ville-centre) ne se dit pas.
  assert.equal(roleTerritorialPourSynthese({ role: "banlieue", uuLabel: "Paris", uuPop: 1, arrondissementDe: "Paris" }), null);
  assert.match(SYNTHESIS_SYSTEM, /n'écrivez jamais que l'arrondissement est une ville-centre/);
});

test("contrôle : un arrondissement présenté comme ville-centre est refusé ; la ville elle-même peut l'être", async () => {
  const { projection } = await identiteReelle("75120");
  const refuse = (t: string) => checkAssertions(t, projection).some((v) => v.rule === "interdit:arrondissement-ville-centre");
  assert.equal(refuse("Paris 20e Arrondissement est au centre de son agglomération."), true);
  assert.equal(refuse("L'arrondissement est la ville-centre de l'agglomération parisienne."), true);
  assert.equal(refuse("Cet arrondissement, ville-centre de son agglomération, compte 190 000 habitants."), true);
  assert.equal(refuse("Paris est au centre de son agglomération ; le 20e en est un arrondissement."), false);
  assert.equal(refuse("L'arrondissement n'est pas lui-même une ville-centre."), false);
  // Pour une commune ordinaire, la règle ne s'applique pas.
  const chartres = identite("Chartres", 38447, { role: "ville_centre", uuLabel: "Chartres", uuPop: 88891 }).projection;
  assert.equal(checkAssertions("Chartres est au centre de son agglomération.", chartres).some((v) => v.rule === "interdit:arrondissement-ville-centre"), false);
});

test("comparateur : « petite ville » suit `peutDireVille` — banlieue, ville-centre en grande agglomération, statut inconnu, arrondissements", async () => {
  const PETITE_VILLE = "Pour une petite ville qui reste vraiment vivante.";
  const PERI = "Pour vivre aux portes d'une grande ville, sans en habiter le centre.";
  const ids = (c: M) => V.buildIdentiteCandidates(c) as string[];
  // Lucé : banlieue de Chartres, 15 602 habitants, vie locale forte (82), agglomération moyenne. Plus de 2 000 habitants
  // ne suffit pas : ce n'est pas « une petite ville ».
  const luce = await V.getCommuneEntry("28218");
  assert.equal(luce.uu_statut, "B");
  assert.equal(ids(luce).includes(PETITE_VILLE), false);
  // La même commune lue ville-centre ou ville isolée le serait (contrôle : c'est bien le statut qui décide).
  assert.equal(ids({ ...luce, uu_statut: "C" }).includes(PETITE_VILLE), true);
  assert.equal(ids({ ...luce, uu_statut: "I" }).includes(PETITE_VILLE), true);
  // Audincourt : ville-centre de 13 944 habitants dans une grande agglomération (112 810) : ni « aux portes d'une
  // grande ville », ni « petite ville » (l'agglomération est grande).
  const aud = await V.getCommuneEntry("25031");
  assert.equal(aud.uu_statut, "C");
  assert.equal(ids({ ...aud, vieLocale: { score: 99 } }).includes(PERI), false);
  assert.equal(ids({ ...aud, vieLocale: { score: 99 } }).includes(PETITE_VILLE), false);
  // Statut inconnu : il ne prouve ni la banlieue (« aux portes… ») ni le centre (« petite ville »).
  const sceaux = await V.getCommuneEntry("92071");
  assert.equal(ids(sceaux)[0], PERI);
  assert.equal(ids({ ...sceaux, uu_statut: null }).includes(PERI), false);
  assert.equal(ids({ ...luce, uu_statut: null }).includes(PETITE_VILLE), false);
  // Arrondissements : jamais « aux portes », jamais « petite ville », même lus avec le statut de leur ville.
  for (const insee of ["75120", "69389", "13216", "13202"]) {
    const a = await V.getCommuneEntry(insee);
    assert.equal(a.uu_statut, "C", insee);
    const l = ids({ ...a, vieLocale: { score: 99 } });
    assert.equal(l.includes(PERI), false, insee);
    assert.equal(l.includes(PETITE_VILLE), false, insee);
  }
});

test("comparateur : sans code ni statut, la raison « Isolement » ne dit jamais « hors agglomération »", async () => {
  const bony = await V.getCommuneEntry("02100");
  assert.equal(V.reasonText("eviter_isolement", bony), "commune hors agglomération");
  const inconnue = { ...bony, uu: null, uu_statut: null };
  const r = V.reasonText("eviter_isolement", inconnue);
  assert.equal(r, "commune de moins de 25 000 habitants");
  assert.doesNotMatch(r, /hors agglomération|agglomération/);
  // Un statut H incohérent avec un code ne vaut pas « hors agglomération » non plus (rôle inconnu, code présent).
  assert.equal(V.reasonText("eviter_isolement", { ...bony, uu: "02000", uu_statut: "H" }), "dans une petite agglomération");
});

test("libellés de taille : en source agglomération, jamais « une ville moyenne » pour la commune", () => {
  assert.equal(labelForCategory("moyenne", "urban_unit"), "une agglomération moyenne");
  assert.equal(labelForCategory("moyenne", "commune"), "une ville moyenne");
  assert.equal(
    categoryStatementFragment("Lucé", "moyenne", "urban_unit"),
    "Lucé appartient à une agglomération moyenne selon la population de son agglomération et la convention de taille utilisée par futur•e",
  );
  // Seuils de FUT-8 inchangés.
  assert.deepEqual(AGGLOMERATION_SIZE_CONVENTION.thresholds, { villageMaxExclusive: 2000, petiteMaxExclusive: 25000, moyenneMaxExclusive: 100000, grandeMaxExclusive: 500000 });
});
