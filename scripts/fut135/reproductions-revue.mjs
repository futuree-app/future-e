// FUT-135 (revue du 25/10) · LES TROIS REPRODUCTIONS DE LA REVUE, sur le vrai moteur, hors réseau.
//   A. Pont-Salomon dans « vie étudiante + nature en Auvergne » : sa raison étudiante.
//   B. seedComparaison(Thurins, Pont-Salomon, Poitiers) : ligne « Vie étudiante », aide, avantage, résumé.
//   C. seedComparaison(Thurins, Saint-Jean-des-Vignes, Mondouzil) : identités finales.
// Sorties avant/après : docs/audits/2026-10-25-fut135-part-etudiante/reproductions-revue.txt
//   node scripts/fut135/reproductions-revue.mjs
import { createJiti } from "jiti";
const racine = process.cwd() + "/";
const jiti = createJiti(racine, { alias: { "server-only": racine + "scripts/mer/etude-courbe/vide.mjs", "@/": racine + "src/" } });
const V = await jiti.import(racine + "src/lib/comparateur-vie.ts");
const o = await V.matchProjects({ reformulation: "Recherche de recette auvergne", hardConstraints: { departements: ["03", "15", "43", "63"] }, preferences: [{ key: "vie_etudiante", weight: 2 }, { key: "nature", weight: 2 }] });
const ps = o.results.find((r) => r.insee === "43153");
console.log("A:", o.results.slice(0,3).map(r=>r.nom).join(" · "), "|", JSON.stringify(ps.reasons), ps.couverture.etat, "vie", V.subScore("vie_etudiante", await V.getCommuneEntry("43153")));
const ligne = (cc) => cc.themes.flatMap((t) => t.lignes).find((l) => l.id === "vie_etudiante");
const b = await V.seedComparaison(["69249", "43153", "86194"]);
const lb = ligne(b.comparaison);
console.log("B:", JSON.stringify(lb.cellules.map(c=>[c.insee,c.palier,c.qualifier ?? null])), JSON.stringify(lb.avantage), "| aide:", lb.aide);
console.log("   resume:", JSON.stringify(b.comparaison.resume), "| arbitrage:", JSON.stringify(b.comparaison.arbitrage));
const c = await V.seedComparaison(["69249", "69212", "31352"]);
console.log("C:", c.trio.map(r=>`${r.nom}: ${r.identite} | ${JSON.stringify(r.reasons)} | déc ${r.decouverte}`).join("\n   "));
