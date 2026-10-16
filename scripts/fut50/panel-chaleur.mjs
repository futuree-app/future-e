// FUT-50 · Imprime la lecture de chaleur de l'accueil pour un panel de communes, sur les vraies données du dépôt.
// Usage : node scripts/fut50/panel-chaleur.mjs 17300 30189 …
import { createJiti } from "jiti";
import { readFileSync } from "node:fs";
const racine = process.cwd() + "/";
const jiti = createJiti(racine, { alias: { "server-only": racine + "scripts/mer/etude-courbe/vide.mjs", "@/": racine + "src/" } });
const { lireChaleur, MOT_DU_SIGNAL } = await jiti.import(racine + "src/lib/accueil/pastilles.ts");
const { buildClimatFacts, classifyClimateComfort, reconstructReference } = await jiti.import(racine + "src/lib/decision/climat-facts.ts");
const L = JSON.parse(readFileSync("data/data_climat.json", "utf8"));
const COL = { NORTX35D_yr: "column08", NORTX30D_yr: "column09", NORTR_yr: "column10", ATX35D_yr: "column23", ATX30D_yr: "column24", ATR_yr: "column25" };
const un = (v) => (v == null ? "–" : v.toLocaleString("fr-FR", { maximumFractionDigits: 2 }));
for (const insee of process.argv.slice(2)) {
  const rows = L.filter((r) => String(r.insee_code).padStart(5, "0") === insee);
  const sc = {};
  for (const r of rows) sc[r.scenario] = { h: r.scenario, v: Object.fromEntries(Object.entries(COL).map(([k, c]) => [k, Number(r[c])])) };
  const f = rows.length ? buildClimatFacts(sc) : null;
  const e = {
    verdict: f ? classifyClimateComfort(f).verdict : "absent",
    jours: { projete: f?.joursTresChauds.projete ?? null, reference: f?.joursTresChauds.reference ?? null, seuil: 8 },
    nuits: { projete: f?.nuitsTropicales.projete ?? null, reference: f?.nuitsTropicales.reference ?? null, seuil: 25 },
    jours30: rows.length ? { projete: sc.gwl20?.v.NORTX30D_yr ?? null, reference: reconstructReference(sc, "NORTX30D_yr", "ATX30D_yr") } : undefined,
    referenceTexte: (v) => (v < 1 ? "moins d'une journée" : `${Math.round(v)} jours`), limite: "", gesteSansAdresse: "",
  };
  const l = lireChaleur({ commune: rows[0]?.commune_name ?? insee, insee }, e);
  console.log(`\n## ${rows[0]?.commune_name ?? insee} (${insee}) · moteur : ${e.verdict}`);
  console.log(`   > 35 °C : ${un(e.jours.projete)} (réf. ${un(e.jours.reference)}) · > 30 °C : ${un(e.jours30?.projete)} (réf. ${un(e.jours30?.reference)}) · nuits : ${un(e.nuits.projete)} (réf. ${un(e.nuits.reference)})`);
  console.log(`   PASTILLE ${MOT_DU_SIGNAL[l.pourVous.signal]} [${l.pourVous.signal}]\n   TEXTE    ${l.pourVous.texte}`);
  const b = l.fait?.mesures?.[0]?.bascule;
  console.log(`   30 °C   ${b ? `${b.valeur} ${b.unite} · ${b.legende}` : "(aucun contrôle)"}`);
}
