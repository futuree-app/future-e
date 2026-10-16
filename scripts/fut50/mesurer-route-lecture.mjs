// FUT-50 · Mesure, à froid puis à chaud, de ce que coûte chaque source de la route de lecture.
// Chaque mesure à froid tourne dans un PROCESSUS NEUF (aucun cache hérité). Machine locale, Node, hors Next :
// ces chiffres comparent les sources entre elles ; ils ne prédisent pas exactement une fonction serverless.
// Usage : node scripts/fut50/mesurer-route-lecture.mjs            (lance toutes les mesures)
//         node scripts/fut50/mesurer-route-lecture.mjs <mesure>  (une seule, dans ce processus)
import { createJiti } from "jiti";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const racine = process.cwd() + "/";
const mesure = process.argv[2];

if (!mesure) {
  const toutes = ["index", "drias", "outremer", "outremer-sans-index", "dossier-taille", "gaspar", "identite-om", "identite-metro"];
  for (const m of toutes) {
    const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url), m], { encoding: "utf8", cwd: process.cwd(), timeout: 180000 });
    process.stdout.write((r.stdout || "").split("\n").filter((l) => l.startsWith("|")).join("\n") + "\n");
    if (r.status !== 0) process.stdout.write(`| ${m} | ÉCHEC | ${(r.stderr || "").split("\n").find((l) => /Error/.test(l)) ?? ""} |\n`);
  }
  process.exit(0);
}

const jiti = createJiti(racine, { alias: { "server-only": racine + "scripts/mer/etude-courbe/vide.mjs", "@/": racine + "src/" } });
const mo = () => Math.round(process.memoryUsage().rss / 1048576);
const t = async (f) => { const d = performance.now(); const v = await f(); return [Math.round(performance.now() - d), v]; };
// Espion de lecture de fichiers : quels gros fichiers une mesure ouvre-t-elle vraiment ?
const lus = new Set();
for (const nom of ["readFile", "readFileSync", "createReadStream"]) {
  const o = fs[nom]; fs[nom] = function (p, ...a) { if (typeof p === "string" && /data\/|\.json|\.gz/.test(p)) lus.add(p.replace(racine, "")); return o.call(this, p, ...a); };
  if (nom === "readFile") { const op = fs.promises.readFile; fs.promises.readFile = function (p, ...a) { if (typeof p === "string") lus.add(p.replace(racine, "")); return op.call(this, p, ...a); }; }
}
const ligne = (nom, froid, chaud, memoire, note = "") => console.log(`| ${nom} | ${froid} ms | ${chaud} ms | +${memoire} Mo | ${[...lus].filter((f) => /data|json|gz/.test(f)).map((f) => `\`${f}\``).join(", ") || "aucun gros fichier"} | ${note} |`);

const m0 = mo();
if (mesure === "index") {
  const { getCommuneEntry } = await jiti.import(racine + "src/lib/comparateur-vie.ts");
  const [f] = await t(() => getCommuneEntry("30189"));
  const [c] = await t(() => getCommuneEntry("17300"));
  ligne("Index des communes (identité métropolitaine, taille)", f, c, mo() - m0);
} else if (mesure === "drias") {
  const { getClimatDataCommune } = await jiti.import(racine + "src/lib/drias-json.ts");
  const [f] = await t(() => getClimatDataCommune("30189"));
  const [c] = await t(() => getClimatDataCommune("17300"));
  ligne("DRIAS (chaleur métropolitaine)", f, c, mo() - m0);
} else if (mesure === "outremer") {
  const L = await jiti.import(racine + "src/lib/outremer/index.ts");
  const [f] = await t(() => L.lireClimatOutremer("97411"));
  const [c] = await t(() => L.lireClimatOutremer("97209"));
  ligne("SocleOM (chaleur ultramarine)", f, c, mo() - m0);
} else if (mesure === "outremer-sans-index" || mesure === "identite-om") {
  const { communeCanonique } = await jiti.import(racine + "src/components/prototypes/fut50/c/identite.ts");
  const [f, v] = await t(() => communeCanonique("97411"));
  const [c] = await t(() => communeCanonique("98735"));
  const indexLu = [...lus].some((p) => /comparateur-index/.test(p));
  ligne("Identité ultramarine (COG embarqué)", f, c, mo() - m0, `« ${v?.nom} » ; index métropolitain chargé : ${indexLu ? "OUI" : "non"}`);
} else if (mesure === "identite-metro") {
  const { communeCanonique } = await jiti.import(racine + "src/components/prototypes/fut50/c/identite.ts");
  const [f, v] = await t(() => communeCanonique("30189"));
  const [c] = await t(() => communeCanonique("17300"));
  ligne("Identité métropolitaine (index)", f, c, mo() - m0, `« ${v?.nom} »`);
} else if (mesure === "dossier-taille") {
  const { buildCommuneDossier } = await jiti.import(racine + "src/lib/decision/territory-facts.ts");
  const { projetDeTest } = await jiti.import(racine + "src/app/dev/fut87/projet-de-test.ts");
  const appels = [];
  const of = globalThis.fetch; globalThis.fetch = (u, ...a) => { appels.push(String(u).replace(/\?.*/, "")); return of(u, ...a); };
  const [f] = await t(() => buildCommuneDossier("30189", projetDeTest("eviter_grandes_villes:2").projet, { hasAddress: false }));
  const n1 = appels.length;
  const [c] = await t(() => buildCommuneDossier("17300", projetDeTest("eviter_grandes_villes:2").projet, { hasAddress: false }));
  ligne("Moteur complet pour « Petite ville »", f, c, mo() - m0, `${n1} appels réseau à froid (${[...new Set(appels)].map((a) => a.replace(/^https?:\/\//, "")).join(", ")})`);
} else if (mesure === "gaspar") {
  const d = [];
  for (const c of ["30189", "17300", "30189"]) {
    const [ms, r] = await t(() => fetch(`https://georisques.gouv.fr/api/v1/gaspar/risques?code_insee=${c}`, { signal: AbortSignal.timeout(8000) }).then((x) => x.status).catch((e) => e.name));
    d.push(`${c} ${ms} ms (${r})`);
  }
  ligne("GASPAR (risques, réseau)", d[0], d[1], mo() - m0, `sans cache hors Next ; 3e appel (même commune) : ${d[2]}`);
}
