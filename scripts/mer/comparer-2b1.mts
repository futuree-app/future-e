// FUT-33 phase 2B.1 : comparaison ancien / nouveau comportement de la recherche, sur l'index réel.
// Usage : node scripts/mer/comparer-2b1.mts > scripts/mer/fixtures/comparaison-2b1.json
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { scoreProximiteMer, communeLittoraleMer, ancreLittorale } from "../../src/lib/mer-recherche.ts";

type C = { insee: string; nom: string; dept: string; population?: number | null; distance_cote_km: number; mer_centre_km: number; loi_effective: string[] | null };
const communes = (JSON.parse(gunzipSync(readFileSync("data/comparateur-index.json.gz")).toString("utf8")).communes) as C[];
const par = new Map(communes.map((c) => [c.nom + "|" + c.dept, c]));
const cas = ["Lannion|22", "Perros-Guirec|22", "Morlaix|29", "Châtelaillon-Plage|17", "La Rochelle|17", "Bordeaux|33", "Nantes|44", "Caen|14", "Montpellier|34", "Arles|13", "Narbonne|11", "Vannes|56", "Annecy|74", "Rochefort|17", "Brest|29", "Lacanau|33", "Carcans|33", "Marseille 7e Arrondissement|13", "Parentis-en-Born|40"];
const ancien = (c: C) => Math.max(0, Math.min(100, 100 - c.distance_cote_km / 1.5));
const top = (l: C[]) => l.sort((a, b) => (b.population ?? 0) - (a.population ?? 0)).slice(0, 6).map((c) => `${c.nom} (${c.dept})`);
const out = {
  preference: cas.map((k) => { const c = par.get(k)!; return { commune: c.nom, ancienne_km: c.distance_cote_km, mer_centre_km: c.mer_centre_km, score_avant: Math.round(ancien(c)), score_apres: Math.round(scoreProximiteMer(c)!) }; }),
  numerique: [2, 5, 10, 15, 30].map((n) => {
    const avant = communes.filter((c) => c.distance_cote_km <= n), apres = communes.filter((c) => c.mer_centre_km <= n);
    const sa = new Set(avant.map((c) => c.insee)), sp = new Set(apres.map((c) => c.insee));
    return { maxKm: n, avant: avant.length, apres: apres.length, entrants: top(apres.filter((c) => !sa.has(c.insee))), sortants: top(avant.filter((c) => !sp.has(c.insee))) };
  }),
  hors_littoral: (() => {
    const avantOk = communes.filter((c) => c.distance_cote_km >= 15).length, apresOk = communes.filter((c) => !communeLittoraleMer(c)).length;
    return { satisfaites_avant: avantOk, satisfaites_apres: apresOk,
      cas: cas.map((k) => { const c = par.get(k)!; return { commune: c.nom, avant: c.distance_cote_km >= 15 ? "acceptée" : "écartée", apres: communeLittoraleMer(c) ? "écartée" : "acceptée", loi: c.loi_effective }; }) };
  })(),
  ancres: ["Brest|29", "Lannion|22", "La Rochelle|17", "Narbonne|11", "Arles|13", "Bordeaux|33", "Vannes|56", "Annecy|74", "Caen|14", "Lacanau|33", "Carcans|33"].map((k) => {
    const c = par.get(k)!; return { ancre: c.nom, avant: c.distance_cote_km <= 15 ? `proximite_mer poids ${c.distance_cote_km <= 5 ? 3 : 2}` : "rien", apres: ancreLittorale(c) ? "suggestion « proximité du littoral » (poids 2)" : "rien" };
  }),
  ancres_national: { avant: communes.filter((c) => c.distance_cote_km <= 15).length, apres: communes.filter((c) => ancreLittorale(c)).length },
};
console.log(JSON.stringify(out, null, 1));
