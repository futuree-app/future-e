// FUT-50 · AVANT / APRÈS : ce que coûte chaque lecture de l'accueil, sources complètes contre sources légères.
//
// Chaque mesure tourne dans un PROCESSUS NEUF (aucun cache hérité), avec le MÊME service
// (`src/lib/accueil/lecture-accueil.ts`) : seules les sources changent (`sourcesCompletes` = l'ancienne route ;
// `sourcesLegeres` = la nouvelle). Machine locale, Node, hors Next : ces chiffres comparent deux chemins entre eux,
// ils ne prédisent pas une fonction Vercel. La mémoire inclut le chargement des modules (dont jiti).
// Usage : node scripts/fut50/mesurer-route-lecture.mjs           (tout)
//         node scripts/fut50/mesurer-route-lecture.mjs <mesure>  (une seule, dans ce processus)
import { createJiti } from "jiti";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const racine = process.cwd() + "/";
const mesure = process.argv[2];
const PARCOURS = [
  ["identite", "Identité métropolitaine", "30189", "17300"],
  ["chaleur", "Chaleur métropolitaine", "30189", "17300"],
  ["hivers", "Hivers doux", "30189", "17300"],
  ["taille", "Petite ville", "30189", "17300"],
  ["risques", "Risques (GASPAR)", "30189", "17300"],
  ["om-chaleur", "Chaleur ultramarine couverte", "97411", "97209"],
  ["om-sans", "Chaleur ultramarine non couverte", "98736", "98713"],
];

if (!mesure) {
  console.log("| Parcours | Sources | À froid | À chaud | Mémoire | Fichiers de données ouverts | Appels réseau |");
  console.log("|---|---|---|---|---|---|---|");
  for (const [cle] of PARCOURS) for (const src of ["completes", "legeres"]) {
    if (cle.startsWith("om") && src === "completes") continue; // l'outre-mer n'a qu'un chemin (COG, SocleOM)
    const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url), `${cle}:${src}`], { encoding: "utf8", cwd: process.cwd(), timeout: 180000 });
    process.stdout.write((r.stdout || "").split("\n").filter((l) => l.startsWith("|")).join("\n") + "\n");
    if (r.status !== 0) process.stdout.write(`| ${cle} | ${src} | ÉCHEC | ${(r.stderr || "").split("\n").find((l) => /Error/.test(l)) ?? ""} | | | |\n`);
  }
  process.exit(0);
}

// Espions : fichiers de données ouverts (lecture fs ou module JSON), appels réseau.
const fichiers = new Set();
for (const nom of ["readFileSync", "readFile"]) {
  const o = fs[nom];
  fs[nom] = function (p, ...a) { if (typeof p === "string" && /\.(json|gz)$/.test(p) && /data\//.test(p)) fichiers.add(p.replace(racine, "")); return o.call(this, p, ...a); };
}
const op = fs.promises.readFile;
fs.promises.readFile = function (p, ...a) { if (typeof p === "string" && /\.(json|gz)$/.test(p) && /data\//.test(p)) fichiers.add(p.replace(racine, "")); return op.call(this, p, ...a); };
const appels = [];
const of = globalThis.fetch;
globalThis.fetch = (u, ...a) => { appels.push(String(u).replace(/^https?:\/\/([^/?]+).*/, "$1")); return of(u, ...a); };

const [cle, src] = mesure.split(":");
const [, nom, a, b] = PARCOURS.find((p) => p[0] === cle);
const mo = () => process.memoryUsage().rss / 1048576;
const m0 = mo();
const debut = performance.now();
const jiti = createJiti(racine, { alias: { "server-only": racine + "scripts/mer/etude-courbe/vide.mjs", "@/": racine + "src/" } });
const S = await jiti.import(racine + "src/lib/accueil/lecture-accueil.ts");
const sources = src === "completes" ? await S.sourcesCompletes() : S.sourcesLegeres;
const lire = async (code) => {
  if (cle === "identite") return S.communeCanonique(code, sources);
  const c = cle.startsWith("om") ? "chaleur" : cle;
  return S.lireAccueil(code, c, { sources });
};
const t0 = performance.now();
const r1 = await lire(a);
const froid = performance.now() - debut; // import compris : c'est le vrai coût d'une instance neuve
const appelsFroid = appels.length;
const t1 = performance.now();
await lire(b);
const chaud = performance.now() - t1;
const taille = [...fichiers].map((f) => { try { return `\`${f}\` (${(fs.statSync(racine + f).size / 1048576).toFixed(1)} Mo)`; } catch { return `\`${f}\``; } });
const json = (await jiti.import(racine + "src/lib/accueil/donnees-legeres.ts").then(() => true).catch(() => false)) && src === "legeres" ? " + modules JSON empaquetés (2,7 + 4,6 Mo)" : "";
void t0; void r1;
console.log(`| ${nom} | ${src === "completes" ? "avant (complètes)" : "après (légères)"} | ${Math.round(froid)} ms | ${chaud < 1 ? chaud.toFixed(1) : Math.round(chaud)} ms | +${Math.round(mo() - m0)} Mo | ${taille.join(", ") || "aucun"}${json} | ${appelsFroid} (${[...new Set(appels)].join(", ") || "—"}) |`);
