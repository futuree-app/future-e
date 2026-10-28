/* eslint-disable @typescript-eslint/no-explicit-any -- outil de balayage : modules chargés dynamiquement (deux racines de code) */
// FUT-154 · Inventaire des compromis : chaque compromis rendu (trio et pistes), classé par portée (absolue ou
// comparative) et confronté aux sous-scores réels du trio. Même balayage que FUT-151 (20 périmètres × 11 projets).
// Usage : node scripts/fut154/inventaire.mts <sortie.json> [racine du code ; défaut ../.. = cette branche]
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
const sortie = process.argv[2];
if (!sortie) throw new Error("usage : inventaire.mts <sortie.json> [racine]");
const racineCode = process.argv[3] ?? "../..";
register(`data:text/javascript,${encodeURIComponent(hook)}`);
const V: any = await import(`${racineCode}/src/lib/comparateur-vie.ts`);
const K = V.PREFERENCE_KEYS as string[];
// Le texte rendu, ramené à sa dimension et à sa portée, avec les tables de la racine lue.
const lire = (t: string, c: any): { key: string; portee: "comparative" | "absolue"; leader: string | null } | null => {
  const x = t.replace(/^En échange, /, "").replace(/\.$/, "");
  for (const k of K) {
    const neg = V.COMPROMIS_NEG[k];
    if (neg && x.startsWith(neg + " qu'à ")) return { key: k, portee: "comparative", leader: x.slice(neg.length + 6) };
    if (V.COMPROMIS_NUANCE?.[k] && x.startsWith(V.COMPROMIS_NUANCE[k] + " qu'à ")) return { key: k, portee: "comparative", leader: x.slice(V.COMPROMIS_NUANCE[k].length + 6) };
  }
  for (const k of K) if (V.raisonNeg(k, c) === x) return { key: k, portee: "absolue", leader: null };
  return null;
};
const PROJ = [
  [{ key: "faible_risque_feu", weight: 3 }], [{ key: "faible_chaleur", weight: 3 }, { key: "acces_soins", weight: 2 }],
  [{ key: "acces_soins", weight: 3 }, { key: "calme_sonore", weight: 2 }, { key: "air_sain", weight: 1 }],
  [{ key: "nature", weight: 3 }, { key: "vie_locale", weight: 2 }, { key: "faible_secheresse", weight: 2 }],
  [{ key: "acces_transports", weight: 3 }, { key: "faible_dependance_auto", weight: 2 }, { key: "acces_services", weight: 2 }],
  [{ key: "viabilite_emploi", weight: 3 }, { key: "acces_ecoles", weight: 2 }, { key: "douceur_climat", weight: 1 }],
  [{ key: "faible_chaleur", weight: 3 }], [{ key: "acces_soins", weight: 3 }], [{ key: "proximite_mer", weight: 3 }], [{ key: "faible_risque_inondation", weight: 3 }], [],
];
const DEPTS = [null, "13","84","06","29","59","63","33","67","2A","48","75","17","65","64","31","44","35","69","38"];
const band = (s: number) => (s >= 66 ? 0 : s < 34 ? 2 : 1);
const lignes: any[] = [];
const cartes: any[] = [];
// Ce que le classement décide, par recherche : doit rester identique d'une racine à l'autre.
const classements: Record<string, unknown> = {};
for (const d of DEPTS) for (const p of PROJ) {
  const o = await V.matchProjects({ reformulation: "x", hardConstraints: d ? { departements: [d] } : {}, preferences: p } as never);
  classements[`${d ?? "FR"} · ${p.map((x: any) => x.key).join("+") || "-"}`] = {
    perfectMatch: o.perfectMatch, bestCompatibility: o.bestCompatibility, candidates: o.candidates, couverture: o.couverture,
    results: o.results.map((r: any) => [r.insee, r.compatibility, r.couverture?.etat ?? null, r.sansPrioriteFavorable ?? false]),
    pistes: o.pistes.map((r: any) => [r.insee, r.compatibility]),
    paliers: o.comparaisonComplete.themes.flatMap((t: any) => t.lignes.map((l: any) => [l.id, l.avantage, l.cellules.map((x: any) => x.palier)])),
  };
  const groupes: [string, any[]][] = [["trio", o.results.slice(0, 3)], ["piste", o.pistes]];
  for (const [g, rs] of groupes) {
    const cs = await Promise.all(rs.map((r: any) => V.getCommuneEntry(r.insee)));
    for (const [i, r] of rs.entries()) {
      const c = cs[i];
      const recherche = `${d ?? "FR"} · ${p.map((x: any) => x.key).join("+") || "-"}`;
      const l = r.compromis ? lire(r.compromis, c) : null;
      cartes.push({ recherche, groupe: g, nom: r.nom, compromis: r.compromis, cle: l?.key ?? null, portee: l?.portee ?? null });
      if (!r.compromis) continue;
      if (!l) { lignes.push({ recherche, groupe: g, nom: r.nom, compromis: r.compromis, illisible: true }); continue; }
      const self = V.subScore(l.key, c);
      const autres = rs.map((o2: any, j: number) => ({ nom: o2.nom, s: j === i ? null : V.subScore(l.key, cs[j]) })).filter((x: any) => x.s != null);
      const leader = autres.sort((a: any, b: any) => b.s - a.s)[0] ?? null;
      const ligne = g === "trio" ? o.comparaisonComplete.themes.flatMap((t: any) => t.lignes).find((x: any) => x.key === l.key || x.id === V.DIMENSIONS.find((dd: any) => dd.key === l.key)?.id) : null;
      lignes.push({
        recherche, groupe: g, nom: r.nom, compromis: r.compromis, cle: l.key, portee: l.portee,
        demandee: p.some((x: any) => x.key === l.key),
        self: self == null ? null : Math.round(self), palier: self == null ? null : band(self), brut: self, insee: r.insee, leader: leader ? { nom: leader.nom, s: Math.round(leader.s) } : null,
        ecart: leader && self != null ? Math.round(leader.s - self) : null,
        memePalier: leader && self != null ? band(self) === band(leader.s) : null,
        matrice: ligne ? { avantage: ligne.avantage, paliers: ligne.cellules.map((x: any) => x.palier) } : null,
        raisons: r.reasons, decouverte: r.decouverte, distinctive: r.distinctive, signal: r.signaux?.[V.DIMENSIONS.find((dd: any) => dd.key === l.key)?.id] ?? null,
        signaux: r.signaux,
      });
    }
  }
}
writeFileSync(sortie, JSON.stringify({ classements, lignes, cartes }, null, 1) + "\n");
const t = (f: (x: any) => boolean) => lignes.filter(f).length;
console.log(`cartes ${cartes.length} · compromis ${lignes.length} · illisibles ${t((x) => x.illisible)}`);
console.log(`absolue <50 ${t((x) => x.portee === "absolue" && x.self < 50)} · absolue ≥50 ${t((x) => x.portee === "absolue" && x.self >= 50)}`);
console.log(`absolue par palier : défavorable ${t((x) => x.portee === "absolue" && x.palier === 2)} · intermédiaire ${t((x) => x.portee === "absolue" && x.palier === 1)}`);
console.log(`comparative <50 ${t((x) => x.portee === "comparative" && x.self < 50)} · comparative 50-54 ${t((x) => x.portee === "comparative" && x.self >= 50 && x.self < 55)} · comparative ≥55 ${t((x) => x.portee === "comparative" && x.self >= 55)}`);
