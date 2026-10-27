// FUT-151 · Les faux compromis : un critère favorable dans l'absolu (sous-score ≥ 55) présenté comme un compromis.
// Balaye 20 périmètres × 11 projets sur l'index réel ; une ligne TSV par carte fautive (trio et pistes).
// Usage : node scripts/fut151/faux-compromis.mts [racine du code, relative à ce dossier ; défaut ../.. = cette branche]
// La racine peut être un autre worktree (la base) : les textes y sont classés avec les tables de cette branche.
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { writeFileSync } from "node:fs";

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
const racineCode = process.argv[2] ?? "../..";
register(`data:text/javascript,${encodeURIComponent(hook)}`);
const V: any = await import(`${racineCode}/src/lib/comparateur-vie.ts`); // eslint-disable-line @typescript-eslint/no-explicit-any
const H: any = await import("../../src/lib/comparateur-vie.ts"); // eslint-disable-line @typescript-eslint/no-explicit-any
const K = H.PREFERENCE_KEYS as string[];
const negKeys = (t: string, c: any) => { const x = t.replace(/^En échange, /, "").replace(/\.$/, ""); return K.filter((k) => H.raisonNeg(k, c) === x || (H.COMPROMIS_NEG[k] && x.startsWith(H.COMPROMIS_NEG[k] + " qu'à "))); };
const PROJ = [
  [{ key: "faible_risque_feu", weight: 3 }], [{ key: "faible_chaleur", weight: 3 }, { key: "acces_soins", weight: 2 }],
  [{ key: "acces_soins", weight: 3 }, { key: "calme_sonore", weight: 2 }, { key: "air_sain", weight: 1 }],
  [{ key: "nature", weight: 3 }, { key: "vie_locale", weight: 2 }, { key: "faible_secheresse", weight: 2 }],
  [{ key: "acces_transports", weight: 3 }, { key: "faible_dependance_auto", weight: 2 }, { key: "acces_services", weight: 2 }],
  [{ key: "viabilite_emploi", weight: 3 }, { key: "acces_ecoles", weight: 2 }, { key: "douceur_climat", weight: 1 }],
  [{ key: "faible_chaleur", weight: 3 }], [{ key: "acces_soins", weight: 3 }], [{ key: "proximite_mer", weight: 3 }], [{ key: "faible_risque_inondation", weight: 3 }], [],
];
const DEPTS = [null, "13","84","06","29","59","63","33","67","2A","48","75","17","65","64","31","44","35","69","38"];
for (const d of DEPTS) for (const p of PROJ) {
  const o = await V.matchProjects({ reformulation: "x", hardConstraints: d ? { departements: [d] } : {}, preferences: p } as never);
  for (const [g, r] of [...o.results.slice(0, 3).map((r: any) => ["trio", r]), ...o.pistes.map((r: any) => ["piste", r])] as any) {
    if (!r.compromis) continue;
    const c = await H.getCommuneEntry(r.insee);
    for (const k of negKeys(r.compromis, c)) { const s = H.subScore(k, c); if (s != null && s >= Number(process.env.SEUIL ?? 55)) console.log([d ?? "FR", p.map((x: any) => x.key).join("+") || "-", g, r.nom, k, Math.round(s), r.compromis].join("\t")); }
  }
}
