// FUT-157 : le texte rendu de la section, état par état, pour la relecture éditoriale. Rejoue les 17 adresses réelles
// (fixtures) et ajoute les états qu'aucune adresse réelle ne produit (panne, lecture incomplète, illisible, liseré).
// Usage : node scripts/fut157/textes.mjs > textes.md
import { createJiti } from "jiti";
import fs from "node:fs";
const racine = process.cwd() + "/";
const jiti = createJiti(racine, { alias: { "server-only": racine + "scripts/mer/etude-courbe/vide.mjs", "@/": racine + "src/" } });
const S = await jiti.import(racine + "src/lib/sites-sols.ts");
const T = await jiti.import(racine + "src/lib/sites-sols-terrain.ts");
const X = await jiti.import(racine + "src/lib/sites-sols-texte.ts");
const CAS = JSON.parse(fs.readFileSync(racine + "src/lib/__fixtures__/fut157/cas.json", "utf8")).cas;
const cats = (r) => Object.fromEntries(Object.entries(r).map(([k, p]) => [k, S.lireCategorieGeo(p, p.every(Boolean) ? S.lotIncomplet(p, S.PAGES_MAX) : false)]));
const rendu = (titre, l) => {
  const t = X.texteSitesSols(l);
  const out = [`## ${titre}`, "", `**État : ${t.etat}** · marge : ${t.marge.grain} · ${t.marge.valeur} · ${t.marge.source}`, "", `> ${t.titre}`, ""];
  for (const s of t.sites) {
    out.push(`- **${s.nom}**${s.demontre ? " (démontré)" : ""} — ${s.situation}`);
    for (const i of s.inscriptions) out.push(`  - ${i.libelle}${i.miseAJour ? ` · fiche mise à jour le ${i.miseAJour}` : ""}${i.lien ? " · fiche officielle" : ""}`);
  }
  if (t.sites.length) out.push("");
  for (const c of t.change) out.push(c, "");
  for (const c of t.limites) out.push(`_${c}_`, "");
  out.push("**Ce que vous pouvez vérifier**", "", ...t.verifier.map((v) => `- ${v}`), "- Ouvrir la carte de Géorisques", "", "<details><summary>En savoir plus</summary>", "", ...t.savoirPlus.map((v) => `- ${v}`), "", "</details>", "");
  return out.join("\n");
};
const parties = ["# FUT-157 · texte rendu de « Sols pollués sur ce terrain »", ""];
for (const c of CAS) parties.push(rendu(c.adresse, T.lireSitesSolsTerrain(c.entree, { categories: cats(c.reponses), sansEmprise: c.sansEmprise })));
// Les états qu'aucune adresse réelle ne produit, construits sur l'adresse de Rivoli (aucun site).
const riv = CAS.find((c) => c.adresse.startsWith("10 Rue de Rivoli"));
const panne = (inv) => ({ ...riv.reponses, ...Object.fromEntries(inv.map((i) => [i, [null]])) });
parties.push(rendu("Construit · une servitude en panne, rien trouvé ailleurs (incomplet)", T.lireSitesSolsTerrain(riv.entree, { categories: cats(panne(["sup"])), sansEmprise: riv.sansEmprise })));
parties.push(rendu("Construit · les trois inventaires en panne (indisponible)", T.sitesSolsIndisponible(riv.entree)));
const sot = CAS.find((c) => c.adresse.startsWith("96b"));
const pa = { ...sot.reponses, sup: [null] };
parties.push(rendu("Construit · Sotrameuse, à vérifier, les servitudes en panne", T.lireSitesSolsTerrain(sot.entree, { categories: cats(pa), sansEmprise: sot.sansEmprise })));
console.log(parties.join("\n"));
