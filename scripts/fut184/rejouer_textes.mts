// FUT-184 · Exécute le VRAI code Territoire d'une révision (aucune réimplémentation) sur chaque entrée de l'index et sur
// Paris, Lyon, Marseille : registre (buildTerritoireSnapshot), carte d'identité (buildTerritoryIdentity), projection
// de synthèse, synthèse déterministe et ses contrôles (checkSynthesis). Une ligne JSON par commune.
//
// Usage : node --no-warnings scripts/fut184/rejouer_textes.mts <racine_du_code> <index.json.gz> <sortie.jsonl>
//   <racine_du_code> : la copie de travail, ou un `git archive <rév> src package.json` (node_modules lié).
//
// Les entrées sont celles de `loadTerritoireSnapshot`, limitées à ce qui se lit hors réseau : index (population,
// densité, nature, démographie, position), statut d'unité urbaine, typologie (deriveTerritoryMood), densité Insee
// PLM et grille de densité. ADEME, DRIAS, Géorisques, VigiEau, ERA5 : absents (ils ne touchent pas l'identité).
// Une commune sans densité dans l'index en aurait une d'ADEME en production : elle est comptée à part.
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { readFileSync, writeFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";

const [racineCode, indexGz, sortie] = process.argv.slice(2);
if (!racineCode || !indexGz || !sortie) throw new Error("usage : rejouer_textes.mts <racine_du_code> <index.json.gz> <sortie.jsonl>");
const racine = pathToFileURL(`${racineCode.replace(/\/$/, "")}/`).href;
const hook = `
export async function resolve(spec, ctx, next) {
  if (spec === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
  if (spec.startsWith("@/")) return next(${JSON.stringify(racine)} + "src/" + spec.slice(2) + ".ts", ctx);
  if ((spec.startsWith("./") || spec.startsWith("../")) && !/\\.[cm]?[jt]s$|\\.json$/.test(spec)) {
    try { return await next(spec + ".ts", ctx); } catch { return next(spec, ctx); }
  }
  return next(spec, ctx);
}`;
register(`data:text/javascript,${encodeURIComponent(hook)}`);

// Le code d'une révision quelconque est importé sans ses types : ses formes ne sont connues qu'à l'exécution.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type M = Record<string, any>;
const imp = (p: string): Promise<M> => import(`${racine}src/lib/${p}`);
const [facts, identity, contrat, deter, checks, statut, plmCommunal, plmDensite, mood, vie, hash] = await Promise.all([
  imp("territoire/facts.ts"), imp("territory-identity.ts"), imp("territoire/synthesis-contract.ts"),
  imp("territoire/synthesis-deterministe.ts"), imp("territoire/synthesis-checks.ts"), imp("territoire/statut-urbain.ts"),
  imp("territoire/plm-communal.ts"), imp("territoire/plm-densite.ts"), imp("territory-mood.ts"), imp("comparateur-vie.ts"),
  imp("facts/hash.ts"),
]);
// La grille vient de la branche FUT-184 (absente à une révision plus ancienne : son registre ignore le champ).
let grille: M | null = null;
try { grille = await imp("territoire/grille-densite.ts"); } catch { grille = null; }

const communes: M[] = JSON.parse(gunzipSync(readFileSync(indexGz)).toString("utf8")).communes;
const LABELS: Map<string, string> = plmCommunal.libellesAgglomeration(communes);
const T0 = "2026-11-10T00:00:00.000Z";

function inputs(insee: string, nom: string, e: M | null, role: M | null, typoEntree: M | null): M {
  const m = mood.deriveTerritoryMood({ communeName: nom, inseeCode: insee, territoire: null, categories: typoEntree ? vie.deriveCategoriesFromEntry(typoEntree) : undefined });
  return {
    insee, communeName: nom, entry: e, urbanRole: role, typology: { type: m.type, label: m.typeLabel },
    ademe: null, scenarios: null, georisques: null, catnat: null, catnatInondationIndex: null, vigieau: null, drought: null,
    littoral: null, era5: null, saisonnalitePct: null, distinctiveTrait: null,
    densiteInsee: plmDensite.densiteInseePLM(insee),
    grilleDensite: grille ? grille.grilleDensiteDe(insee) : null,
  };
}

function ligne(insee: string, i: M, extra: M) {
  const s = hash.withHash(facts.buildTerritoireSnapshot(i, T0));
  const id = identity.buildTerritoryIdentity(s);
  const p = contrat.projectForSynthesis(s, "gwl20");
  const texte: string = deter.deterministicSynthesis(p, "gwl20");
  const bloc1 = texte.split("\n").find((l: string) => /habitants/.test(l) && !l.startsWith("#")) ?? null;
  const violations = checks.checkSynthesis(texte, p).map((v: M) => v.rule).filter((r: string) => !r.startsWith("format:"));
  const cat = s.derived.find((d: M) => d.key === "density.category") ?? null;
  return {
    insee, ...extra,
    hash: s.hash, registre: s.registryVersion,
    categorie: cat?.label ?? null, regle: cat?.rule ?? null,
    resume: id.summary, role: id.role,
    // Avant FUT-184 : `densite` = { label, value } ; après : `grille` (classe) et `densite` (chiffre).
    carte_grille: id.grille ?? null,
    carte_densite: typeof id.densite === "string" ? id.densite : id.densite?.label ?? null,
    bloc1, violations,
    projection_densite: p.commune?.densite ?? null, projection_grille: p.commune?.grille_densite_insee ?? null,
  };
}

const out: string[] = [];
for (const c of communes) {
  const arr = plmCommunal.villeDeArrondissement(c.insee);
  const role = { role: statut.roleUrbain(c.uu ?? null, c.uu_statut ?? null), uuLabel: c.uu ? LABELS.get(c.uu) ?? null : null, uuPop: c.uu_pop ?? null, ...(arr ? { arrondissementDe: arr.nom } : {}) };
  const e = {
    population: c.population ?? null, densite: c.densite ?? null, mer_centre_km: c.mer_centre_km ?? null,
    relief_proximite: c.relief_proximite ?? null, altitude: c.altitude ?? null,
    nature: c.nature ? { brut_pct: c.nature.brut_pct ?? null, radius_pct: c.nature.radius_pct ?? null, composition: c.nature.composition ?? null } : null,
    demographie: c.demographie ? { taux_total: c.demographie.taux_total ?? null, part_nouveaux: c.demographie.part_nouveaux ?? null, recit: c.demographie.recit ?? null } : null,
  };
  out.push(JSON.stringify(ligne(c.insee, inputs(c.insee, c.nom, e, role, c), {
    nom: c.nom, population: c.population ?? null, densite: c.densite ?? null, uu_statut: c.uu_statut ?? null, arrondissement: Boolean(arr),
  })));
}
for (const [insee, nom] of [["75056", "Paris"], ["69123", "Lyon"], ["13055", "Marseille"]]) {
  const l = plmCommunal.lectureCommunalePLM(insee, communes);
  const e = { population: l.population, densite: null, mer_centre_km: null, relief_proximite: null, altitude: null, nature: null, demographie: l.demographie };
  const role = { role: statut.roleUrbain(l.uu, l.uuStatut), uuLabel: l.uu ? LABELS.get(l.uu) ?? null : null, uuPop: l.uuPop };
  out.push(JSON.stringify(ligne(insee, inputs(insee, nom, e, role, null), { nom, population: l.population, densite: null, uu_statut: l.uuStatut, arrondissement: false, ville_plm: true })));
}
writeFileSync(sortie, out.join("\n") + "\n");
console.log(`${out.length} lignes -> ${sortie}`);
