// FUT-50 · LA LECTURE PUBLIQUE DE L'ACCUEIL : intégrité des données légères, garde-fous des routes, cache, GASPAR.
//
// L'équivalence EXHAUSTIVE avec le moteur complet (34 791 codes, toutes lectures) vit dans
// `scripts/accueil/verifier-equivalence.mjs` (80 s) ; la fraîcheur octet pour octet dans
// `scripts/accueil/donnees-accueil.mjs` (lancé par le build). Ici : ce qui doit casser vite et sans réseau.
import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { politiqueCache, PARAMETRES_LECTURE, PARAMETRES_COMMUNE } from "./cache-accueil.ts";
import { risquesGaspar, DELAI_GASPAR_MS } from "./gaspar-accueil.ts";

const sha = (f: string) => createHash("sha256").update(readFileSync(f)).digest("hex");
const sansCommentaires = (f: string) => readFileSync(f, "utf8").replace(/^\s*\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
const communes = JSON.parse(readFileSync("src/data/accueil-communes.json", "utf8")) as { schema: number; source: { fichier: string; sha256: string; communes: number }; champs: string[]; communes: Record<string, unknown[]> };
const extrait = JSON.parse(readFileSync("src/data/apercu-climat-communes.json", "utf8")) as { source: { sha256: string }; cles: string[]; horizons: string[]; communes: Record<string, (number | null)[]> };

// ── Données légères ─────────────────────────────────────────────────────────────────────────────────────

test("données légères : dérivées de l'index et de DRIAS ACTUELS (sinon le build et ce test échouent)", () => {
  assert.equal(communes.source.sha256, sha("data/comparateur-index.json.gz"), "src/data/accueil-communes.json est périmé : npm run accueil:generer");
  assert.equal(extrait.source.sha256, sha("data/data_climat.json"), "l'extrait climatique est périmé : node scripts/build-apercu-climat.mjs");
  for (const k of ["NORTX35D_yr", "ATX35D_yr", "NORTR_yr", "ATR_yr", "NORTX30D_yr", "ATX30D_yr", "NORTMm_seas_DJF", "ATMm_seas_DJF"]) assert.ok(extrait.cles.includes(k), `extrait sans ${k}`);
  assert.deepEqual(extrait.horizons, ["gwl15", "gwl20", "gwl30"]);
});

test("données légères : 34 788 communes, aucun doublon, aucun code ultramarin, aucune valeur non finie, identité complète", () => {
  const codes = Object.keys(communes.communes);
  assert.equal(codes.length, 34788);
  assert.equal(communes.source.communes, 34788);
  assert.equal(codes.filter((c) => /^9[78]/.test(c)).length, 0, "l'outre-mer a son propre référentiel");
  assert.equal(Object.keys(extrait.communes).filter((c) => /^9[78]/.test(c)).length, 0, "aucune ancienne ligne DRIAS ultramarine");
  const i = Object.fromEntries(communes.champs.map((c, n) => [c, n])) as Record<string, number>;
  for (const [code, l] of Object.entries(communes.communes)) {
    assert.ok(typeof l[i.nom!] === "string" && (l[i.nom!] as string).trim(), `${code} : nom`);
    for (const champ of ["lat", "lon"]) assert.ok(Number.isFinite(l[i[champ]!]), `${code} : ${champ}`);
    for (const champ of ["population", "tailleVille"]) assert.ok(l[i[champ]!] === null || Number.isFinite(l[i[champ]!]), `${code} : ${champ}`);
    assert.ok(["urban_unit", "commune", null].includes(l[i.tailleVilleSource!] as string | null), `${code} : provenance de la taille`);
    assert.ok(extrait.communes[code], `${code} : absent de l'extrait climatique`);
  }
});

test("données légères : une donnée absente reste ABSENTE (null), jamais 0", () => {
  // La taille d'une commune sans population connue reste null, avec une provenance nulle.
  const i = Object.fromEntries(communes.champs.map((c, n) => [c, n])) as Record<string, number>;
  const sansTaille = Object.entries(communes.communes).filter(([, l]) => l[i.tailleVille!] === null);
  assert.ok(sansTaille.length > 0 && sansTaille.length < 50, `${sansTaille.length} communes sans taille`);
  for (const [code, l] of sansTaille) assert.equal(l[i.tailleVilleSource!], null, `${code} : provenance sans valeur`);
  // Une taille à 0 n'existe que là où l'INDEX porte une population de 0 (trois communes déléguées : 60694, 85165,
  // 85212) : recopie fidèle de la source, signalée dans le compte rendu, jamais un 0 fabriqué pour une absence.
  for (const [code, l] of Object.entries(communes.communes).filter(([, l]) => l[i.tailleVille!] === 0)) {
    assert.equal(l[i.population!], 0, `${code} : taille 0 sans population 0 dans l'index`);
    assert.equal(l[i.uu!], null, `${code} : taille 0 dans une unité urbaine`);
  }
  // Et la lecture légère d'une valeur DRIAS absente ne la change pas en 0 (scenariosDepuisExtrait ignore null).
  assert.match(sansCommentaires("src/lib/apercu-territoire.ts"), /typeof x === "number" && Number\.isFinite\(x\)\) v\[cle\] = x/);
});

test("données légères : aucun fichier interne servi en public, et les fichiers du runtime sont empaquetés (import)", () => {
  for (const f of ["accueil-communes.json", "apercu-climat-communes.json", "data_climat.json", "comparateur-index.json.gz"]) {
    assert.ok(!existsSync(`public/${f}`), `public/${f} ne doit pas exister`);
  }
  const legeres = sansCommentaires("src/lib/accueil/donnees-legeres.ts");
  assert.match(legeres, /import communesBrutes from "@\/data\/accueil-communes\.json"/);
  assert.match(legeres, /import extraitBrut from "@\/data\/apercu-climat-communes\.json"/);
  assert.doesNotMatch(legeres, /readFile|comparateur-index|data_climat/, "aucune lecture des gros fichiers");
});

// ── Routes ──────────────────────────────────────────────────────────────────────────────────────────────

const ROUTES_PUBLIQUES = ["src/app/api/accueil/lecture/route.ts", "src/app/api/accueil/commune/route.ts"];

test("routes publiques : aucun moteur complet, aucun gros fichier, aucun compte, aucune IA, aucun paiement", () => {
  for (const r of ROUTES_PUBLIQUES) {
    const s = sansCommentaires(r);
    assert.doesNotMatch(s, /buildCommuneDossier|getClimatDataCommune|getCommuneEntry|comparateur-vie|drias-json|georisques"|supabase|anthropic|stripe|ai-sdk|"ai"/i, r);
    assert.doesNotMatch(s, /searchParams\.get\("(commune|libelle|type)"\)/, `${r} : aucun nom ni type venu du navigateur`);
    assert.doesNotMatch(s, /NODE_ENV === "production"/, `${r} : route publique, sans garde de développement`);
  }
  // Le service : le chemin léger n'appelle jamais le moteur complet ni les gros fichiers ; les sources complètes
  // (preuves, mesure « avant ») ne sont chargées que dynamiquement, à la demande.
  const svc = sansCommentaires("src/lib/accueil/lecture-accueil.ts");
  const legeres = svc.slice(svc.indexOf("export const sourcesLegeres"), svc.indexOf("export async function sourcesCompletes"));
  assert.doesNotMatch(legeres, /buildCommuneDossier|getCommuneEntry|getClimatDataCommune/);
  const importsReels = svc.slice(0, svc.indexOf("export const CLES_ACCUEIL")).split("\n").filter((l) => /^import (?!type )/.test(l));
  assert.ok(!importsReels.some((l) => /comparateur-vie|drias-json/.test(l)), "aucun import statique des sources complètes (un `import type` est effacé à la compilation)");
  assert.match(svc, /import\("\.\.\/comparateur-vie\.ts"\), import\("\.\.\/drias-json\.ts"\)/);
});

test("routes : l'outre-mer passe par le COG et SocleOM avant toute donnée métropolitaine", () => {
  const svc = sansCommentaires("src/lib/accueil/lecture-accueil.ts");
  const canon = svc.slice(svc.indexOf("export async function communeCanonique"));
  assert.ok(canon.indexOf("estCodeOutremer(insee)") > 0 && canon.indexOf("estCodeOutremer(insee)") < canon.indexOf("sources.nomCommune"), "COG avant l'index");
  const lire = svc.slice(svc.indexOf("export async function lireAccueil"));
  const branche = lire.slice(lire.indexOf("if (om) {"), lire.indexOf("if (cle === \"chaleur\") return ok(lireChaleur("));
  assert.match(branche, /lireChaleurOutremer\(lieu, lireClimatOutremer\(insee\)!\)/);
  assert.doesNotMatch(branche, /entreesChaleur|classifyClimateComfort|buildClimatFacts|scenarios|entreesHivers|entreesTaille|dossier/);
  const legeres = sansCommentaires("src/lib/accueil/donnees-legeres.ts");
  assert.equal((legeres.match(/if \(\/\^9\[78\]\/\.test\(insee\)\) return null;/g) ?? []).length, 2, "les deux lectures légères refusent 97/98");
});

test("routes de développement : même service, toujours 404 en production", () => {
  for (const r of ["src/app/dev/fut50/api/lecture/route.ts", "src/app/dev/fut50/api/commune/route.ts"]) {
    const s = sansCommentaires(r);
    assert.match(s, /if \(process\.env\.NODE_ENV === "production"\) return new NextResponse\(null, \{ status: 404 \}\);/);
    assert.match(s, /from "@\/lib\/accueil\/lecture-accueil"/);
    assert.doesNotMatch(s, /buildCommuneDossier|getClimatDataCommune|getCommuneEntry/);
  }
  assert.ok(!existsSync("src/components/prototypes/fut50/c/identite.ts"), "plus de seconde résolution d'identité");
});

test("aucune autre route ne sert les fichiers internes", () => {
  const routes = (d: string): string[] => readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? routes(`${d}/${e.name}`) : e.name === "route.ts" ? [`${d}/${e.name}`] : []));
  for (const r of routes("src/app")) {
    assert.doesNotMatch(readFileSync(r, "utf8"), /accueil-communes\.json|apercu-climat-communes\.json/, `${r} ne doit pas exposer un fichier interne`);
  }
});

// ── Cache ───────────────────────────────────────────────────────────────────────────────────────────────

test("cache : durable 24 h au CDN ; une panne jamais, même en 200 ; paramètres superflus jamais stockés", () => {
  const durable = politiqueCache({ statut: 200, durable: true }, ["insee", "cle"], PARAMETRES_LECTURE);
  assert.equal(durable.cacheControl, "public, max-age=0, s-maxage=86400, stale-while-revalidate=86400");
  assert.equal(politiqueCache({ statut: 200, durable: false }, ["insee", "cle"], PARAMETRES_LECTURE).cacheControl, "no-store", "panne GASPAR en 200");
  assert.equal(politiqueCache({ statut: 400 }, ["insee"], PARAMETRES_LECTURE).cacheControl, "no-store");
  assert.equal(politiqueCache({ statut: 404 }, ["insee", "cle"], PARAMETRES_LECTURE).cacheControl, "public, max-age=0, s-maxage=3600");
  const frag = politiqueCache({ statut: 200, durable: true }, ["insee", "cle", "commune"], PARAMETRES_LECTURE);
  assert.deepEqual(frag, { cacheControl: "no-store", raison: "parametres_superflus:commune" });
  assert.equal(politiqueCache({ statut: 200 }, ["insee"], PARAMETRES_COMMUNE).cacheControl, durable.cacheControl);
  assert.match(sansCommentaires("src/lib/accueil/lecture-accueil.ts"), /const lecture = lireRisques\(lieu, g\.risques\);\s*return ok\(suite \? \{ \.\.\.lecture, suite \} : lecture, !g\.panne,/, "la panne GASPAR rend la lecture non durable");
});

// ── GASPAR ──────────────────────────────────────────────────────────────────────────────────────────────

async function fauxGaspar(comportement: (res: import("node:http").ServerResponse) => void) {
  const s = createServer((_req, res) => comportement(res));
  await new Promise<void>((r) => s.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${(s.address() as AddressInfo).port}`;
  return { base, fermer: () => new Promise<void>((r) => { s.closeAllConnections(); s.close(() => r()); }) };
}
const json = (corps: string, statut = 200) => (res: import("node:http").ServerResponse) => { res.writeHead(statut, { "content-type": "application/json" }); res.end(corps); };

test("GASPAR : réponse normale, vide valide, 4xx/5xx, délai, JSON malformé, réponse incomplète", async () => {
  assert.equal(DELAI_GASPAR_MS, 3000);
  const cas: [string, (res: import("node:http").ServerResponse) => void, { panne: boolean; risques: unknown }][] = [
    ["normale", json(JSON.stringify({ data: [{ risques_detail: [{ num_risque: "11", libelle_risque_long: "Inondation" }] }] })), { panne: false, risques: [{ code: "11", libelle: "Inondation" }] }],
    ["vide valide", json(JSON.stringify({ results: 0, data: [] })), { panne: false, risques: [] }],
    ["404", json("{}", 404), { panne: true, risques: null }],
    ["500", json("{}", 500), { panne: true, risques: null }],
    ["malformée", json("{ ceci n'est pas du JSON"), { panne: true, risques: null }],
    ["incomplète", json(JSON.stringify({ data: [{ code_insee: "44109" }] })), { panne: true, risques: null }],
  ];
  for (const [nom, comportement, attendu] of cas) {
    const g = await fauxGaspar(comportement);
    const r = await risquesGaspar("44109", { base: g.base, delaiMs: 1000 });
    await g.fermer();
    assert.deepEqual({ panne: r.panne, risques: r.risques }, attendu, nom);
  }
  // Délai dépassé : la réponse arrive après le délai, la lecture n'attend pas.
  const lent = await fauxGaspar((res) => { setTimeout(() => json("{\"data\":[]}")(res), 2000); });
  const r = await risquesGaspar("44109", { base: lent.base, delaiMs: 300 });
  await lent.fermer();
  assert.equal(r.panne, true);
  assert.equal(r.risques, null, "une panne n'est jamais « aucun risque »");
  assert.ok(r.ms >= 290 && r.ms < 1000, `rendu en ${r.ms} ms`);
});

// ── L'accueil public (`/`) monte la version C, sans rien du prototype ──────────────────────────────────────────────
test("accueil public : version C par les routes publiques, ni maquette, ni bandeau, ni route de développement", () => {
  const page = readFileSync("src/app/(public)/page.tsx", "utf8");
  const code = sansCommentaires("src/app/(public)/page.tsx");
  assert.match(code, /from "@\/components\/accueil\/HeroLieu"/);
  assert.match(code, /<HeroLieu \/>/, "le hero lit sa base par défaut, publique");
  assert.match(code, /<DossierAdresse \/>/, "place réservée, sans maquette");
  assert.doesNotMatch(code, /maquette|BandeauPrototype|prototypes\/|\/dev\/|FutureELanding/);
  for (const s of ["<Pourquoi />", "<Echelles />", "<Offres />", "<Savoir />", "<Pied />"]) assert.ok(page.includes(s), s);
  const hero = readFileSync("src/components/accueil/HeroLieu.tsx", "utf8");
  assert.match(hero, /api = "\/api\/accueil"/);
  assert.doesNotMatch(sansCommentaires("src/components/accueil/HeroLieu.tsx"), /\/dev\//, "aucune route de développement en dur");
  // Le prototype garde ses routes de développement et sa maquette, avec les MÊMES composants.
  const proto = sansCommentaires("src/app/dev/fut50/c/page.tsx");
  assert.match(proto, /<HeroLieu composition=\{composition\} api="\/dev\/fut50\/api" \/>/);
  assert.match(proto, /from "@\/components\/accueil\/SectionsAccueil"/);
  assert.ok(existsSync("src/app/api/accueil/lecture/route.ts") && existsSync("src/app/api/accueil/commune/route.ts"));
  // Aucun composant de production n'importe un prototype.
  for (const f of readdirSync("src/components/accueil")) {
    if (f.endsWith(".css")) continue;
    assert.doesNotMatch(readFileSync(`src/components/accueil/${f}`, "utf8"), /from "[^"]*prototypes\//, f);
  }
});
