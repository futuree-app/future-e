#!/usr/bin/env node
/**
 * FUT-82 — construit l'échantillon d'adresses des sondes (lecture seule).
 *
 * Deux parts, et elles ne disent pas la même chose :
 *   - CIBLÉE : des adresses choisies parce qu'elles exercent un cas (aéroport, Seveso, feu
 *     historique, nappe, montagne, littoral, outre-mer). Elles montrent ce que la donnée sait dire
 *     quand le cas existe. Elles ne mesurent AUCUNE fréquence.
 *   - TIRÉE : des communes tirées par un générateur déterministe (graine fixe) dans
 *     data/communes-france-coords.csv, puis l'adresse BAN la plus proche de leur point de
 *     référence. Elles donnent une idée de ce qui arrive « en général » sur un petit nombre :
 *     jamais une statistique nationale.
 *
 *   node scripts/research/fut82/echantillon.mjs [--graine 82] [--tirees 12] [--out <fichier>]
 *
 * Géocodage : Géoplateforme (même service que src/lib/geocodeur-ban.ts).
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { timedFetch, tryJson, rng, parseArgs, sleep } from "./lib.mjs";

const args = parseArgs(process.argv);
const GRAINE = Number(args.graine ?? 82);
const N_TIREES = Number(args.tirees ?? 12);
const OUT = args.out ?? "docs/audits/2026-10-27-fut82/mesures/echantillon.json";
const GEOCODEUR = "https://data.geopf.fr/geocodage";

// id, requête BAN, ce que le cas exerce. Les intentions sont écrites AVANT la mesure.
const CIBLES = [
  ["paris-hotel-de-ville", "Place de l'Hôtel de Ville 75004 Paris", "métropole dense, Seine, nappe alluviale, EAIP"],
  ["lyon-gerland", "60 avenue Tony Garnier 69007 Lyon", "métropole, Rhône, ancien secteur industriel"],
  ["la-rochelle-centre", "1 rue du Palais 17000 La Rochelle", "commune de démonstration, littoral"],
  ["marseille-chateau-gombert", "Route de Château-Gombert 13013 Marseille", "interface urbain / massif, feu"],
  ["grenoble-centre", "Place Grenette 38000 Grenoble", "métropole, réseau de chaleur, montagne proche"],
  ["strasbourg-neudorf", "Route du Polygone 67100 Strasbourg", "Alsace-Moselle, réseau de chaleur"],
  ["goussainville-cdg", "Rue de Paris 95190 Goussainville", "aéroport Paris-CDG (PEB/PGS)"],
  ["villeneuve-le-roi-orly", "Avenue de la République 94290 Villeneuve-le-Roi", "aéroport Orly (PEB)"],
  ["blagnac-aeroport", "Avenue du Parc 31700 Blagnac", "aéroport Toulouse-Blagnac"],
  ["bouguenais-aeroport", "Rue de la Commune de 1871 44340 Bouguenais", "aéroport Nantes-Atlantique"],
  ["feyzin-raffinerie", "Rue de la Raffinerie 69320 Feyzin", "Seveso seuil haut, IREP"],
  ["gonfreville-industrie", "Rue Jean Jaurès 76700 Gonfreville-l'Orcher", "zone industrielle du Havre"],
  ["fos-sur-mer", "Avenue Jean Moulin 13270 Fos-sur-Mer", "complexe industrialo-portuaire"],
  ["grande-synthe", "Place François Mitterrand 59760 Grande-Synthe", "sidérurgie, Dunkerque"],
  ["la-teste-pyla", "Avenue du Figuier 33115 La Teste-de-Buch", "forêt littorale, incendie 2022"],
  ["landiras-bourg", "Le Bourg 33720 Landiras", "forêt des Landes, incendie 2022"],
  ["gonfaron-bourg", "Place de la Victoire 83590 Gonfaron", "Maures, incendie 2021"],
  ["abbeville-somme", "Boulevard Vauban 80100 Abbeville", "vallée de la Somme, remontées de nappe 2001"],
  ["chamonix", "Place du Triangle de l'Amitié 74400 Chamonix-Mont-Blanc", "haute montagne, parc ?"],
  ["briancon", "Avenue de la République 05100 Briançon", "montagne, parc national proche"],
  ["saintes-maries", "Avenue Frédéric Mistral 13460 Saintes-Maries-de-la-Mer", "Camargue, PNR, Natura 2000"],
  ["fontainebleau-lisiere", "Boulevard du Maréchal Joffre 77300 Fontainebleau", "lisière de massif Natura 2000"],
  ["lacanau-ocean", "Boulevard de la Plage 33680 Lacanau", "littoral atlantique, forêt"],
  ["charleville-mezieres", "Avenue de la Gare 08000 Charleville-Mézières", "Ardennes : seule CBS nationale sur la Géoplateforme"],
  ["gueret", "Place Bonnyaud 23000 Guéret", "ville moyenne rurale"],
  ["janville-beauce", "Place du Martroi 28310 Janville-en-Beauce", "plaine agricole"],
  ["montlouis-sur-loire", "Rue de Tours 37270 Montlouis-sur-Loire", "périurbain, Loire"],
  ["saint-amand-montrond", "Rue Nationale 18200 Saint-Amand-Montrond", "petite ville du centre"],
  ["ploubazlanec", "Rue de Pors Even 22620 Ploubazlanec", "bourg littoral breton"],
  ["metz-centre", "Place d'Armes 57000 Metz", "Alsace-Moselle, ville moyenne"],
  ["saint-denis-reunion", "Rue de Paris 97400 Saint-Denis", "outre-mer : La Réunion"],
  ["pointe-a-pitre", "Rue Frébault 97110 Pointe-à-Pitre", "outre-mer : Guadeloupe"],
  ["fort-de-france", "Rue Victor Hugo 97200 Fort-de-France", "outre-mer : Martinique"],
];

async function geocode(q) {
  const r = await timedFetch(`${GEOCODEUR}/search?q=${encodeURIComponent(q)}&limit=1`);
  const f = tryJson(r.body)?.features?.[0];
  if (!f) return { ok: false, ms: r.ms, status: r.status };
  const p = f.properties;
  return {
    ok: true, ms: r.ms, label: p.label, score: Math.round(p.score * 100) / 100, type: p.type,
    citycode: p.citycode, banId: p.id, lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0],
  };
}

async function reverse(lat, lon) {
  const r = await timedFetch(`${GEOCODEUR}/reverse?lat=${lat}&lon=${lon}&limit=1&index=address`);
  const f = tryJson(r.body)?.features?.[0];
  if (!f) return { ok: false, ms: r.ms, status: r.status };
  const p = f.properties;
  return {
    ok: true, ms: r.ms, label: p.label, score: Math.round((p.score ?? 0) * 100) / 100, type: p.type,
    citycode: p.citycode, banId: p.id, lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0],
  };
}

const points = [];
for (const [id, q, cas] of CIBLES) {
  const g = await geocode(q);
  points.push({ id, part: "ciblee", cas, requete: q, ...g });
  process.stderr.write(`${g.ok ? "✓" : "✗"} ${id} ${g.label ?? ""} (score ${g.score ?? "-"})\n`);
  await sleep(120);
}

// Tirage : graine fixe, communes de métropole et d'outre-mer confondues (le fichier les contient).
const lignes = readFileSync("data/communes-france-coords.csv", "utf8").trim().split("\n").slice(1);
const alea = rng(GRAINE);
const deja = new Set();
while (points.filter((p) => p.part === "tiree").length < N_TIREES) {
  const [insee, nom, lat, lon] = lignes[Math.floor(alea() * lignes.length)].split(",");
  if (deja.has(insee)) continue;
  deja.add(insee);
  let g = await reverse(Number(lat), Number(lon));
  // Le géocodage inverse ne rend rien quand aucune adresse n'est proche du point de référence
  // (centroïde en pleine campagne). Repli explicite, consigné : la première voie de la commune.
  if (!g.ok) {
    const s = await timedFetch(`${GEOCODEUR}/search?q=${encodeURIComponent(nom)}&citycode=${insee}&limit=1`);
    const f = tryJson(s.body)?.features?.[0];
    if (f) g = { ok: true, repli: "search citycode", ms: s.ms, label: f.properties.label, score: Math.round(f.properties.score * 100) / 100, type: f.properties.type, citycode: f.properties.citycode, banId: f.properties.id, lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0] };
  }
  points.push({ id: `tiree-${insee}`, part: "tiree", cas: `commune tirée : ${nom}`, inseeTire: insee, ...g });
  process.stderr.write(`${g.ok ? "✓" : "✗"} tirée ${insee} ${nom} → ${g.label ?? "aucune adresse"}\n`);
  await sleep(120);
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify({
  genere: new Date().toISOString(), graine: GRAINE, geocodeur: GEOCODEUR,
  avertissement: "Échantillon de sondes. La part ciblée exerce des cas ; la part tirée est petite et ne représente pas la France.",
  points,
}, null, 1));
console.log(`${points.length} points → ${OUT}`);
