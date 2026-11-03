import { test, before } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";
import { createHash } from "node:crypto";
import { caseDe, cleCase, cleTuileDe, classeDe, FORMAT_PRIX_AUTOUR, tuilesPour, type ManifestePrixAutour } from "./prix-autour.ts";
import type { LecturePrix } from "./prix-immobiliers.ts";

// FUT-138 · LE LECTEUR SERVEUR DES VENTES AUTOUR (pointeur, manifeste, empreintes, pannes) ET LE RENDU DE LA SECTION.
// Tuiles FABRIQUÉES : le dépôt est public, aucune tuile réelle n'y entre (une case de 100 m peut ne porter qu'une vente).
// Les lectures réelles sont dans docs/audits/2026-11-03-fut138-ventes-autour-recette.json (chiffres groupés seulement).

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
  if (spec.startsWith("next/") && !spec.includes(".")) return next(spec + ".js", ctx);
  if (spec.startsWith("@/")) {
    const b = ${JSON.stringify(racine)} + "src/" + spec.slice(2);
    return premier([b + ".ts", b + ".tsx", b], ctx, next);
  }
  if ((spec.startsWith("./") || spec.startsWith("../")) && !/\\.[cm]?[jt]sx?$|\\.json$|\\.css$/.test(spec)) {
    return premier([spec + ".ts", spec + ".tsx", spec], ctx, next);
  }
  return next(spec, ctx);
}
export async function load(url, ctx, next) {
  if (url.endsWith(".module.css")) return { format: "module", source: "export default new Proxy({}, { get: (_, k) => String(k) });", shortCircuit: true };
  if (!url.endsWith(".tsx")) return next(url, ctx);
  const fichier = fileURLToPath(url);
  const { outputText } = ts.transpileModule(readFileSync(fichier, "utf8"), {
    fileName: fichier,
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  return { format: "module", source: outputText, shortCircuit: true };
}`;

let lecteur: typeof import("./server/prix-autour-tuiles.ts");
let rendre: (props: unknown) => string;
before(async () => {
  register(`data:text/javascript,${encodeURIComponent(hook)}`);
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { createElement } = await import("react");
  const { VentesAutourBloc } = await import("../components/report/VentesAutourBloc.tsx");
  lecteur = await import("./server/prix-autour-tuiles.ts");
  rendre = (p) => renderToStaticMarkup(createElement(VentesAutourBloc, p as never))
    .replace(/<[^>]+>/g, " ").replace(/&#x27;/g, "'").replace(/[  ]/g, " ").replace(/\s+/g, " ").trim();
});

const P = { lat: 46.158, lon: -1.153 };
const sha = (b: Buffer) => createHash("sha256").update(b).digest("hex");

const LA_ROCHELLE: LecturePrix = {
  code: "17300", nom: "La Rochelle", meta: { achat: { periode: { debut: "2022-01-01", fin: "2025-12-31" } } },
  logement: { achat: { dispo: true, maison: { eur_m2: 4507, maille: "commune", ventes: 2033 }, appart: { eur_m2: 5000, maille: "commune", ventes: 3707 } }, location: null },
};

/** Un bucket en mémoire : 40 appartements à 5 000 €/m² dans le carré de l'adresse, et un compteur d'appels. */
function bucket({ casser }: { casser?: "tuile" | "communes" | "pointeur" } = {}) {
  const c = caseDe(P);
  const kt = cleTuileDe(c);
  const tuile = gzipSync(Buffer.from(JSON.stringify({ format: FORMAT_PRIX_AUTOUR, edition: "2026-10-20", tuile: kt, cases: { [cleCase(c)]: { a: [classeDe(5000), 40] } } })));
  const communes = gzipSync(Buffer.from(JSON.stringify({
    format: FORMAT_PRIX_AUTOUR, edition: "2026-10-20", meta: { achat: { periode: { debut: "2022-01-01", fin: "2025-12-31" } } },
    communes: { "17300": { nom: "La Rochelle", achat: LA_ROCHELLE.logement!.achat } },
  })));
  const m: ManifestePrixAutour = {
    format: FORMAT_PRIX_AUTOUR, edition: "2026-10-20", livraison: "2026-10-20", periode: { debut: "2022-01-01", fin: "2025-12-31" },
    case_m: 100, tuile_cases: 50, pas_classe: 1.02, tuiles: { [kt]: { octets: tuile.length, sha256: sha(tuile), ventes: 40 } },
    communes: { octets: communes.length, sha256: sha(communes), nombre: 1 },
  };
  const manifeste = Buffer.from(JSON.stringify(m));
  const objets = new Map<string, Buffer>([
    ["courant.json", Buffer.from(JSON.stringify({ format: FORMAT_PRIX_AUTOUR, edition: "2026-10-20", manifeste: casser === "pointeur" ? "0".repeat(64) : sha(manifeste) }))],
    ["2026-10-20/manifest.json", manifeste],
    [`2026-10-20/t/${kt}.json.gz`, casser === "tuile" ? Buffer.concat([tuile, Buffer.from([0])]) : tuile],
    ["2026-10-20/communes.json.gz", casser === "communes" ? Buffer.concat([communes, Buffer.from([0])]) : communes],
  ]);
  const appels: string[] = [];
  const f = (async (url: string, init: RequestInit) => {
    const chemin = decodeURIComponent(new URL(url).pathname).replace("/storage/v1/object/prix-autour/", "");
    appels.push(chemin);
    assert.equal((init.headers as Record<string, string>).Authorization, "Bearer cle-serveur");
    const o = objets.get(chemin);
    return o ? new Response(new Uint8Array(o)) : new Response("absent", { status: 400 });
  }) as unknown as typeof fetch;
  return { f, appels, kt };
}
const ENV = { PRIX_AUTOUR_BUCKET: "prix-autour", NEXT_PUBLIC_SUPABASE_URL: "https://projet.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "cle-serveur" } as unknown as NodeJS.ProcessEnv;

test("non activée sans bucket : undefined, aucun appel réseau", async () => {
  const { f, appels } = bucket();
  assert.equal(await lecteur.lireVentesAutour(P, "17300", { ...ENV, PRIX_AUTOUR_BUCKET: undefined } as never, f), undefined);
  assert.equal(appels.length, 0);
});

test("lecture : pointeur, manifeste, seules les tuiles existantes ; puis la mémoire de l'instance", async () => {
  lecteur.oublierPrixAutour();
  const { f, appels, kt } = bucket();
  const r = await lecteur.lireVentesAutour(P, "17300", ENV, f);
  assert.ok(r);
  assert.equal(r!.appart.statut, "ventes");
  assert.equal(r!.appart.statut === "ventes" && r!.appart.ventes, 40);
  assert.equal(r!.maison.statut, "trop_peu");
  assert.equal(r!.commune?.nom, "La Rochelle");
  // les tuiles absentes du manifeste (zones sans vente) ne sont jamais demandées
  assert.deepEqual(appels.filter((a) => a.includes("/t/")), [`2026-10-20/t/${kt}.json.gz`]);
  assert.ok(tuilesPour(P).length >= 1);
  const avant = appels.length;
  await lecteur.lireVentesAutour(P, "17300", ENV, f);
  assert.equal(appels.length, avant, "pointeur, manifeste et tuile gardés en mémoire");
});

test("panne : tuile altérée, pointeur faux, réseau coupé => null (indisponible), jamais « trop peu »", async () => {
  for (const casser of ["tuile", "communes", "pointeur"] as const) {
    lecteur.oublierPrixAutour();
    assert.equal(await lecteur.lireVentesAutour(P, "17300", ENV, bucket({ casser }).f), null, casser);
  }
  lecteur.oublierPrixAutour();
  const coupe = (async () => { throw new Error("réseau"); }) as unknown as typeof fetch;
  assert.equal(await lecteur.lireVentesAutour(P, "17300", ENV, coupe), null);
});


test("rendu Autour : le type filtre les ventes ; sans type fiable, les deux marchés ; lecture désactivée, rien", async () => {
  lecteur.oublierPrixAutour();
  const autour = await lecteur.lireVentesAutour(P, "17300", ENV, bucket().f);
  const appart = rendre({ autour, type: { type: "appart" } });
  assert.match(appart, /Les ventes à proximité/);
  assert.match(appart, /40 appartements se sont vendus à moins de 500 m environ de l'adresse/);
  assert.doesNotMatch(appart, /maisons/i);
  const maison = rendre({ autour, type: { type: "maison" } });
  assert.match(maison, /Moins de 10 ventes de maisons de 2022 à 2025 à moins de 2 km : pas de médiane locale\./);
  assert.doesNotMatch(maison, /4 507/);
  const deux = rendre({ autour, type: { abstention: "sans_diagnostic" } });
  assert.match(deux, /Appartements .*40 appartements.*Maisons .*Moins de 10 ventes de maisons/);
  assert.equal(rendre({ autour: undefined, type: { type: "appart" } }), "");
});
