// Contre-revue FUT-149, R2 : octets téléchargés par le VRAI lecteur serveur (`debroussaillement-tuiles.ts`) d'un
// worktree, contre un Storage simulé qui sert une édition construite. Compte les octets par catégorie.
//   node egress.mjs <worktree> <sortie>/<édition>
// Scénarios (horloge simulée, une seule instance) : instance froide ; instance chaude, une lecture par minute
// pendant 24 h ; même chose avec une bascule vers une révision au bout de 12 h ; deux lectures simultanées à froid.
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { gunzipSync, gzipSync } from "node:zlib";
import path from "node:path";

const [W, ED] = process.argv.slice(2);
register(`data:text/javascript,${encodeURIComponent(`export async function resolve(s, c, n) {
  if (s === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
  if (s.startsWith("@/")) return n(${JSON.stringify(pathToFileURL(W + "/").href)} + "src/" + s.slice(2) + ".ts", c);
  return n(s, c);
}`)}`);
const lecteur = await import(`${W}/src/lib/server/debroussaillement-tuiles.ts`);
const sha = (b) => createHash("sha256").update(b).digest("hex");

// Deux éditions servies : l'édition construite, et une révision au même contenu (identifiant différent).
const A = path.basename(ED);
const B = `${A}.2`;
const objets = new Map();
const manA = JSON.parse(readFileSync(`${ED}/manifest.json`));
objets.set(`${A}/manifest.json`, readFileSync(`${ED}/manifest.json`));
const manB = { ...manA, edition: B, tuiles: {} };
for (const [k, t] of Object.entries(manA.tuiles)) {
  if ("plein" in t) { manB.tuiles[k] = t; continue; }
  const brut = readFileSync(`${ED}/t/${k}.json.gz`);
  objets.set(`${A}/t/${k}.json.gz`, brut);
  const tb = gzipSync(Buffer.from(JSON.stringify({ ...JSON.parse(gunzipSync(brut)), edition: B })));
  objets.set(`${B}/t/${k}.json.gz`, tb);
  manB.tuiles[k] = { octets: tb.length, sha256: sha(tb) };
}
objets.set(`${B}/manifest.json`, Buffer.from(JSON.stringify(manB)));
const pointeurVers = (e) => Buffer.from(JSON.stringify({ format: manA.format, edition: e, manifeste: sha(objets.get(`${e}/manifest.json`)) }));

const compte = { pointeur: 0, manifeste: 0, tuiles: 0, appels: 0 };
const f = async (url) => {
  const chemin = decodeURIComponent(new URL(url).pathname).replace(/^\/storage\/v1\/object\/debroussaillement\//, "");
  const b = objets.get(chemin);
  if (!b) return new Response("absent", { status: 400 });
  compte.appels++;
  compte[chemin === "courant.json" ? "pointeur" : chemin.endsWith("manifest.json") ? "manifeste" : "tuiles"] += b.length;
  return new Response(new Uint8Array(b));
};
const env = { DEBROUSSAILLEMENT_BUCKET: "debroussaillement", NEXT_PUBLIC_SUPABASE_URL: "https://simule.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "x" };

// Des points tirés dans des cellules au hasard (le pire cas pour la mémoire des tuiles), graine fixe.
const cles = Object.keys(manA.tuiles).filter((k) => !("plein" in manA.tuiles[k]));
let graine = 1;
const hasard = () => (graine = (graine * 16807) % 2147483647) / 2147483647;
const unPoint = () => {
  const [ix, iy] = cles[Math.floor(hasard() * cles.length)].split("_").map(Number);
  return { point: [(ix + 0.2 + 0.6 * hasard()) / 10, (iy + 0.2 + 0.6 * hasard()) / 10], geocodage: null, insee: null, parcelle: null };
};

const vrai = Date.now;
let decalage = 0;
Date.now = () => vrai() + decalage;
function remise() {
  for (const k in compte) compte[k] = 0;
  lecteur.oublierDebroussaillement();
  decalage = 0;
  graine = 1;
  objets.set("courant.json", pointeurVers(A));
}
const ko = (o) => Math.round(o / 102.4) / 10;
const bilan = (scenario, lectures, extra = {}) => console.log(JSON.stringify({
  scenario, lectures, appels: compte.appels, pointeurKo: ko(compte.pointeur), manifesteKo: ko(compte.manifeste),
  tuilesKo: ko(compte.tuiles), totalKo: ko(compte.pointeur + compte.manifeste + compte.tuiles), ...extra,
}));

remise();
await lecteur.lireDebroussaillementAdresse(unPoint(), env, f);
bilan("froide, 1 lecture", 1);

remise();
for (let i = 0; i < 1440; i++) { decalage = i * 60_000; await lecteur.lireDebroussaillementAdresse(unPoint(), env, f); }
bilan("chaude, 1 lecture par minute, 24 h", 1440);

remise();
const vues = {};
for (let i = 0; i < 1440; i++) {
  decalage = i * 60_000;
  if (i === 720) objets.set("courant.json", pointeurVers(B));
  const l = await lecteur.lireDebroussaillementAdresse(unPoint(), env, f);
  const cle = `${l.statut}:${l.source?.edition}`;
  vues[cle] = (vues[cle] ?? 0) + 1;
}
bilan("chaude, bascule vers la révision à 12 h", 1440, { lecturesParEdition: vues });

remise();
await Promise.all([lecteur.lireDebroussaillementAdresse(unPoint(), env, f), lecteur.lireDebroussaillementAdresse(unPoint(), env, f)]);
bilan("froide, 2 lectures simultanées", 2);
Date.now = vrai;
