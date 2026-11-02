#!/usr/bin/env node
// FUT-138 · Mesure SÉPARÉE des trois effets sur les prix d'achat de l'index.
//
//   E0  l'index de `main` (avant FUT-138)
//   E1  rejeu de l'algorithme d'avant ef77afdd (première ligne de logement d'une mutation), caches d'avril
//       2026, années 2021-2024, code_commune brut. Doit redonner E0 : preuve que l'écart vient de là.
//   E2  E1 + filtre « un seul logement » tel qu'écrit par ef77afdd           => effet MULTILOTS (ef77afdd)
//   E2b E2, une ligne répétée d'un même local n'est plus un 2e logement      => effet RÉPÉTITIONS (FUT-138)
//   E3  livraison du 20/10/2026, années 2022-2025, code de l'année de vente  => effet ACTUALISATION
//   E4  E3 avec la commune actuelle                                          => effet GÉOGRAPHIE
//   E5  E4, un arrondissement se replie sur sa ville avant l'EPCI (production) => effet REPLI PLM
//
//   node scripts/fut138/mesurer-effets.mjs --index-main /chemin/index-main.json --sortie docs/audits/...json
//
// Lecture seule : n'écrit jamais l'index.
import fs from "node:fs";
import fsp from "node:fs/promises";
import zlib from "node:zlib";
import readline from "node:readline";
import { agregerDvf, calculerLogement, fichiersDvf, lireAnil, mouvementsCog } from "../lib/logement-index.mjs";

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : d; };
const INDEX_MAIN = arg("index-main", null);
const SORTIE = arg("sortie", null);
if (!INDEX_MAIN || !SORTIE) { console.error("usage : --index-main <json> --sortie <json>"); process.exit(2); }

// L'algorithme de 2f026803 (juin 2026), recopié tel quel : dédoublonnage par id_mutation dans le fichier, la
// PREMIÈRE ligne Appartement/Maison valide porte le prix de toute la mutation.
function parseAvantEf77(file, achat) {
  return new Promise((res) => {
    const rl = readline.createInterface({ input: fs.createReadStream(file).pipe(zlib.createGunzip()) });
    let H = null, I = {};
    const seen = new Set();
    rl.on("line", (l) => {
      if (H === null) {
        H = l.split(",");
        const g = (n) => H.indexOf(n);
        I = { c: g("code_commune"), t: g("type_local"), v: g("valeur_fonciere"), s: g("surface_reelle_bati"), n: g("nature_mutation"), id: g("id_mutation") };
        return;
      }
      const c = l.split(",");
      if (c[I.n] !== "Vente") return;
      const t = c[I.t];
      if (t !== "Appartement" && t !== "Maison") return;
      const v = parseFloat(c[I.v]), s = parseFloat(c[I.s]);
      if (!(v > 0) || !(s > 0)) return;
      if (seen.has(c[I.id])) return;
      seen.add(c[I.id]);
      const pm = v / s;
      if (pm < 300 || pm > 20000) return;
      (achat[c[I.c]] ??= { maison: [], appart: [] })[t === "Maison" ? "maison" : "appart"].push(pm);
    });
    rl.on("close", res);
  });
}

// Ce qui se compare d'un état à l'autre : chiffres, mailles, niveaux. Pas les champs ajoutés par FUT-138.
const vue = (lg) => ({
  dispo: lg?.achat?.dispo ?? false,
  niveau: lg?.achat?.niveau ?? null,
  maison: lg?.achat?.maison ? [lg.achat.maison.eur_m2, lg.achat.maison.maille] : null,
  appart: lg?.achat?.appart ? [lg.achat.appart.eur_m2, lg.achat.appart.maille] : null,
  location: lg?.location ? [lg.location.niveau, lg.location.appart_eur_m2, lg.location.maison_eur_m2, lg.location.fiabilite] : null,
});

function comparer(avant, apres, codes, noms) {
  const r = { communesAchatChange: 0, prixChange: { maison: 0, appart: 0 }, mailleChange: { maison: {}, appart: {} }, niveauChange: 0, dispoChange: 0, locationChange: 0, ecartsRelatifs: { maison: [], appart: [] }, exemples: [] };
  for (const k of codes) {
    const a = vue(avant[k]), b = vue(apres[k]);
    let change = false;
    if (a.dispo !== b.dispo) { r.dispoChange++; change = true; }
    if (a.niveau !== b.niveau) r.niveauChange++;
    for (const t of ["maison", "appart"]) {
      const x = a[t], y = b[t];
      const mx = x?.[1] ?? "aucune", my = y?.[1] ?? "aucune";
      if (mx !== my) { const cle = `${mx}→${my}`; r.mailleChange[t][cle] = (r.mailleChange[t][cle] ?? 0) + 1; change = true; }
      if ((x?.[0] ?? null) !== (y?.[0] ?? null)) { r.prixChange[t]++; change = true; }
      if (x && y && mx === my) r.ecartsRelatifs[t].push((y[0] - x[0]) / x[0]);
    }
    if (JSON.stringify(a.location) !== JSON.stringify(b.location)) r.locationChange++;
    if (change) { r.communesAchatChange++; if (r.exemples.length < 3) r.exemples.push({ insee: k, nom: noms[k], avant: a, apres: b }); }
  }
  const q = (arr, p) => { if (!arr.length) return null; const s = [...arr].sort((x, y) => x - y); return Math.round(s[Math.min(s.length - 1, Math.floor(p * s.length))] * 10000) / 100; };
  for (const t of ["maison", "appart"]) {
    const abs = r.ecartsRelatifs[t].map(Math.abs);
    r.ecartsRelatifs[t] = { n: abs.length, mediane_pct: q(r.ecartsRelatifs[t], 0.5), abs_p50_pct: q(abs, 0.5), abs_p90_pct: q(abs, 0.9), abs_p99_pct: q(abs, 0.99), plus_de_5pct: abs.filter((x) => x > 0.05).length };
  }
  return r;
}

const CAS = ["17300", "08053", "49126", "93066", "85165", "85084", "67482", "57463", "75111", "69381", "13208"];

async function main() {
  const main = JSON.parse(await fsp.readFile(INDEX_MAIN, "utf8"));
  const codes = main.communes.map((c) => c.insee);
  const noms = Object.fromEntries(main.communes.map((c) => [c.insee, c.nom]));
  const referentiel = new Set(codes);
  const anil = await lireAnil();
  const { mouvements } = await mouvementsCog();
  const E = {};
  E.E0 = Object.fromEntries(main.communes.map((c) => [c.insee, c.logement]));

  const sans = { villePLM: false };
  const avril = await fichiersDvf("2026-05-18", [2021, 2022, 2023, 2024]);
  const a1 = {};
  for (const f of avril) { console.error(`E1 ${f.annee}`); await parseAvantEf77(f.chemin, a1); }
  E.E1 = calculerLogement(codes, a1, anil, { villePLM: false });

  console.error("E2");
  const e2 = await agregerDvf(avril, { geographie: "brute", referentiel, mouvements, repetitions: "ef77afdd" });
  E.E2 = calculerLogement(codes, e2.achat, anil, sans);
  console.error("E2b");
  const e2b = await agregerDvf(avril, { geographie: "brute", referentiel, mouvements });
  E.E2b = calculerLogement(codes, e2b.achat, anil, sans);

  const octobre = await fichiersDvf("2026-10-20", [2022, 2023, 2024, 2025]);
  console.error("E3");
  const e3 = await agregerDvf(octobre, { geographie: "vente", referentiel, mouvements });
  E.E3 = calculerLogement(codes, e3.achat, anil, sans);
  console.error("E4");
  const e4 = await agregerDvf(octobre, { geographie: "actuelle", referentiel, mouvements });
  E.E4 = calculerLogement(codes, e4.achat, anil, sans);
  E.E5 = calculerLogement(codes, e4.achat, anil);

  const res = {
    genere: new Date().toISOString().slice(0, 10),
    communes: codes.length,
    bilans: { E2: e2.bilan, E2b: e2b.bilan, E3: e3.bilan, E4: e4.bilan },
    reproduction_main: comparer(E.E0, E.E1, codes, noms),
    effet_multilots: comparer(E.E1, E.E2, codes, noms),
    effet_repetitions: comparer(E.E2, E.E2b, codes, noms),
    effet_actualisation: comparer(E.E2b, E.E3, codes, noms),
    effet_geographie: comparer(E.E3, E.E4, codes, noms),
    effet_repli_plm: comparer(E.E4, E.E5, codes, noms),
    total: comparer(E.E0, E.E5, codes, noms),
    cas: Object.fromEntries(CAS.filter((k) => E.E0[k] !== undefined || E.E4[k] !== undefined).map((k) => [k, { nom: noms[k], ...Object.fromEntries(Object.keys(E).map((e) => [e, vue(E[e][k])])) }])),
  };
  await fsp.writeFile(SORTIE, JSON.stringify(res, null, 1) + "\n");
  for (const k of ["reproduction_main", "effet_multilots", "effet_repetitions", "effet_actualisation", "effet_geographie", "effet_repli_plm", "total"]) {
    const x = res[k];
    console.error(`${k}: communes ${x.communesAchatChange}, prix maison ${x.prixChange.maison} appart ${x.prixChange.appart}, mailles ${JSON.stringify(x.mailleChange)}, niveau ${x.niveauChange}, dispo ${x.dispoChange}, location ${x.locationChange}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
