#!/usr/bin/env node
// FUT-80 · Lit `mesure.json` (cf. `mesure-rnb-rattachement.mjs`) et rend les tableaux du rapport.
// Aucune requête réseau : tout se rejoue depuis le fichier.
//
// Usage : node scripts/fut80/analyser-mesure.mjs docs/audits/2026-10-26-fut80-rnb/mesure.json.gz

import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";

const brut = readFileSync(process.argv[2]);
const d = JSON.parse((process.argv[2].endsWith(".gz") ? gunzipSync(brut) : brut).toString("utf8"));
const pct = (n, t) => (t ? `${((100 * n) / t).toFixed(1)} %` : "—");
const ic = (n, t) => {
  // Intervalle de Wilson à 95 %, pour ne pas lire un écart de bruit comme un résultat.
  if (!t) return "";
  const z = 1.96, p = n / t;
  const c = (p + (z * z) / (2 * t)) / (1 + (z * z) / t);
  const h = (z * Math.sqrt((p * (1 - p)) / t + (z * z) / (4 * t * t))) / (1 + (z * z) / t);
  return ` [${(100 * Math.max(0, c - h)).toFixed(1)} ; ${(100 * Math.min(1, c + h)).toFixed(1)}]`;
};
const ligne = (cells) => `| ${cells.join(" | ")} |`;
const out = [];
const p = (s = "") => out.push(s);

p(`# Mesure FUT-80 — ${d.date}`);
p(`Paramètres : ${JSON.stringify(d.parametres)}`);
p(`Réseau : appels ${JSON.stringify(d.reseau.appels)}, échecs ${JSON.stringify(d.reseau.echecs)}, médiane ${JSON.stringify(d.reseau.latence_mediane_ms)} ms, p95 ${JSON.stringify(d.reseau.latence_p95_ms)} ms`);

// ── 1. Adresse BAN → bâtiment RNB ────────────────────────────────────────────────────────────
function tableRnb(titre, adresses) {
  p(`\n## ${titre}`);
  const strates = [...new Set(adresses.map((a) => a.strate))];
  p(ligne(["Strate", "n", "0 bâtiment", "1 bâtiment", "≥ 2 bâtiments", "indisponible"]));
  p(ligne(["---", "---", "---", "---", "---", "---"]));
  for (const s of [...strates, "TOTAL"]) {
    const xs = s === "TOTAL" ? adresses : adresses.filter((a) => a.strate === s);
    const c = (f) => xs.filter(f).length;
    const z = c((a) => a.rnb.status === "aucun"), u = c((a) => a.rnb.n === 1), m = c((a) => a.rnb.n >= 2), ind = c((a) => a.rnb.status === "indisponible");
    p(ligne([s, xs.length, `${z} (${pct(z, xs.length)})`, `${u} (${pct(u, xs.length)}${ic(u, xs.length)})`, `${m} (${pct(m, xs.length)})`, ind]));
  }
  const mult = adresses.filter((a) => a.rnb.n >= 2).map((a) => a.rnb.n);
  if (mult.length) p(`Adresses à plusieurs bâtiments : ${mult.length}, nombre de bâtiments médian ${mult.sort((a, b) => a - b)[Math.floor(mult.length / 2)]}, max ${Math.max(...mult)}.`);
}

tableRnb("1. Adresse BAN → bâtiment RNB, tirage uniforme (A)", d.A);
tableRnb("1 bis. Adresse BAN → bâtiment RNB, adresses collectives (B)", d.B);

// ── 2. DPE : jointure BAN actuelle vs identifiant RNB ────────────────────────────────────────
function tableDpe(titre, adresses) {
  p(`\n## ${titre}`);
  const dpe = adresses.flatMap((a) => a.dpe.map((x) => ({ ...x, adresse: a })));
  const parBan = dpe.filter((x) => x.par_ban);
  const rnbSeul = dpe.filter((x) => x.par_rnb && !x.par_ban);
  const adressesAvecBan = adresses.filter((a) => a.dpe.some((x) => x.par_ban));
  const adressesGagnees = adresses.filter((a) => !a.dpe.some((x) => x.par_ban) && a.dpe.some((x) => x.par_rnb));
  const adressesEnrichies = adresses.filter((a) => a.dpe.some((x) => x.par_ban) && a.dpe.some((x) => x.par_rnb && !x.par_ban));
  p(`- adresses : ${adresses.length} ; avec au moins un DPE par la jointure BAN actuelle : ${adressesAvecBan.length} (${pct(adressesAvecBan.length, adresses.length)})`);
  p(`- adresses SANS DPE par BAN mais avec un DPE du même bâtiment RNB : ${adressesGagnees.length} (${pct(adressesGagnees.length, adresses.length)}${ic(adressesGagnees.length, adresses.length)})`);
  p(`- adresses avec DPE par BAN ET des DPE supplémentaires du même bâtiment : ${adressesEnrichies.length}`);
  p(`- DPE trouvés par BAN : ${parBan.length} ; dont porteurs d'un id_rnb : ${parBan.filter((x) => x.id_rnb).length} (${pct(parBan.filter((x) => x.id_rnb).length, parBan.length)})`);
  const porteurs = parBan.filter((x) => x.id_rnb);
  const conc = porteurs.filter((x) => x.rnb_concorde === true).length;
  p(`- parmi eux, id_rnb = un bâtiment RNB de l'adresse : ${conc}/${porteurs.length} (${pct(conc, porteurs.length)}${ic(conc, porteurs.length)})`);
  const contra = porteurs.filter((x) => x.rnb_concorde === false);
  p(`- CONTRADICTIONS (DPE à l'adresse, id_rnb d'un AUTRE bâtiment) : ${contra.length} ; adresses concernées : ${new Set(contra.map((x) => x.adresse.banId)).size}`);
  for (const x of contra.slice(0, 12)) p(`    · ${x.adresse.banId} (${x.adresse.label}) — DPE ${x.numero} ${x.provenance} id_rnb=${x.id_rnb} ; bâtiments de l'adresse ${x.adresse.rnb.ids.join(",") || "aucun"} ; distance ${x.distance_batiment_m} m`);
  p(`- DPE ajoutés par l'id_rnb seul (même bâtiment, pas même identifiant BAN) : ${rnbSeul.length}`);
  const sansBan = rnbSeul.filter((x) => !x.identifiant_ban).length;
  const autreBan = rnbSeul.filter((x) => x.identifiant_ban).length;
  p(`    · sans identifiant BAN : ${sansBan} ; avec un AUTRE identifiant BAN : ${autreBan}`);
  const grains = (xs) => Object.entries(xs.reduce((m, x) => ((m[x.grain] = (m[x.grain] ?? 0) + 1), m), {})).map(([k, v]) => `${k} ${v}`).join(", ");
  p(`    · grains : ${grains(rnbSeul)} ; provenance : ${Object.entries(rnbSeul.reduce((m, x) => ((m[x.provenance] = (m[x.provenance] ?? 0) + 1), m), {})).map(([k, v]) => `${k} ${v}`).join(", ")}`);
  // Les DPE ajoutés, sur les adresses à UN bâtiment : candidats crédibles « autre entrée ».
  const ajoutUnBat = rnbSeul.filter((x) => x.adresse.rnb.n === 1);
  p(`    · dont sur une adresse à un seul bâtiment : ${ajoutUnBat.length} ; sur une adresse à plusieurs bâtiments : ${rnbSeul.length - ajoutUnBat.length}`);
  for (const x of rnbSeul.slice(0, 10)) p(`    ex. ${x.adresse.label} ← DPE ${x.numero} (${x.grain}, ${x.provenance}) enregistré à ${x.identifiant_ban ?? "sans BAN"}`);

  // Géométrie : le point du DPE (point BAN de SON adresse) et l'empreinte.
  const avecDist = parBan.filter((x) => x.distance_batiment_m != null);
  const dans = avecDist.filter((x) => x.distance_batiment_m === 0).length;
  const proches = avecDist.filter((x) => x.distance_batiment_m <= 5).length;
  p(`- géométrie (DPE par BAN, adresse à ≥ 1 bâtiment) : point dans l'empreinte ${dans}/${avecDist.length} (${pct(dans, avecDist.length)}) ; à ≤ 5 m ${proches} (${pct(proches, avecDist.length)})`);

  // Adresses à plusieurs bâtiments : les DPE se répartissent-ils ?
  const multi = adresses.filter((a) => a.rnb.n >= 2 && a.dpe.some((x) => x.par_ban));
  const reparties = multi.filter((a) => new Set(a.dpe.filter((x) => x.par_ban && x.id_rnb).map((x) => x.id_rnb)).size >= 2).length;
  p(`- adresses à ≥ 2 bâtiments avec DPE : ${multi.length} ; DPE répartis sur ≥ 2 bâtiments : ${reparties}`);
}

tableDpe("2. DPE — tirage uniforme (A)", d.A);
tableDpe("2 bis. DPE — adresses collectives (B)", d.B);

// ── 3. Du côté du DPE : que vaut l'id_rnb, par provenance ────────────────────────────────────
p(`\n## 3. DPE porteurs d'un id_rnb (C)`);
p(ligne(["Provenance", "n", "ID connu du RNB", "bâtiment actif", "ID ∈ bâtiments de l'adresse du DPE", "adresse du DPE ∈ adresses du bâtiment", "point dans l'empreinte", "point ≤ 5 m", "distance > 50 m"]));
p(ligne(Array(9).fill("---")));
for (const prov of ["Reprise RNB", "Logiciel"]) {
  const xs = d.C.filter((x) => x.provenance === prov);
  const c = (f) => xs.filter(f).length;
  const avecBan = xs.filter((x) => x.identifiant_ban && x.adresse_rnb_status !== "indisponible");
  const dans = c((x) => x.point_dans_batiment === true), pres = c((x) => x.distance_m != null && x.distance_m <= 5), loin = c((x) => x.distance_m != null && x.distance_m > 50);
  p(ligne([prov, xs.length, pct(c((x) => x.rnb_status === "trouve"), xs.length), pct(c((x) => x.rnb_actif === true), xs.length),
    `${avecBan.filter((x) => x.id_dans_adresse).length}/${avecBan.length} (${pct(avecBan.filter((x) => x.id_dans_adresse).length, avecBan.length)}${ic(avecBan.filter((x) => x.id_dans_adresse).length, avecBan.length)})`,
    pct(avecBan.filter((x) => x.ban_dans_adresses_du_batiment).length, avecBan.length),
    pct(dans, xs.length), pct(pres, xs.length), pct(loin, xs.length)]));
}
for (const prov of ["Reprise RNB", "Logiciel"]) {
  const xs = d.C.filter((x) => x.provenance === prov && x.identifiant_ban && x.id_dans_adresse === false);
  p(`\nDésaccords ${prov} (${xs.length}) : adresse du DPE sans bâtiment RNB ${xs.filter((x) => x.n_batiments_adresse === 0).length} ; adresse à d'autres bâtiments ${xs.filter((x) => x.n_batiments_adresse > 0).length}`);
  for (const x of xs.slice(0, 8)) p(`    · ${x.numero} ${x.identifiant_ban} bâtiments adresse=${x.n_batiments_adresse} etat=${x.rnb_etat} actif=${x.rnb_actif} distance=${x.distance_m} m`);
}
const multiC = d.C.filter((x) => x.n_batiments_adresse >= 2);
p(`\nDPE dont l'adresse compte ≥ 2 bâtiments : ${multiC.length} ; l'id_rnb est l'un d'eux : ${multiC.filter((x) => x.id_dans_adresse).length}`);

// ── 4. BDNB ──────────────────────────────────────────────────────────────────────────────────
p(`\n## 4. BDNB (millésime de l'API ouverte) pour les bâtiments RNB trouvés`);
const b = d.bdnb;
const avec = b.filter((x) => x.groupe);
p(`- bâtiments RNB : ${b.length} ; reliés à une construction BDNB : ${b.filter((x) => x.construction_fictive != null).length} (${pct(b.filter((x) => x.construction_fictive != null).length, b.length)}) ; avec groupe lu : ${avec.length}`);
const groupes = new Map(avec.map((x) => [x.groupe.batiment_groupe_id, x.groupe]));
const rnbParGroupe = new Map();
for (const x of avec) rnbParGroupe.set(x.groupe.batiment_groupe_id, (rnbParGroupe.get(x.groupe.batiment_groupe_id) ?? 0) + 1);
p(`- groupes BDNB distincts : ${groupes.size} ; groupes contenant ≥ 2 bâtiments RNB de l'échantillon : ${[...rnbParGroupe.values()].filter((n) => n >= 2).length}`);
const G = [...groupes.values()];
const rempli = (k, f = (v) => v != null && v !== "" && v !== "INDETERMINE") => G.filter((g) => f(g[k])).length;
p(ligne(["Champ", "renseigné", "remarque"]));
p(ligne(["---", "---", "---"]));
for (const k of ["annee_construction", "nb_niveau", "hauteur_mean", "nb_log", "nb_log_rnc", "mat_mur_txt", "mat_toit_txt", "usage_principal_bdnb_open", "numero_immat_principal", "fiabilite_hauteur", "fiabilite_emprise_sol", "fiabilite_cr_adr_niv_1"]) {
  let remarque = "";
  if (k === "annee_construction") {
    const ys = G.map((g) => g.annee_construction).filter((v) => v != null);
    const ronds = ys.filter((y) => y % 100 === 0 || y === 1800 || y === 1900 || y === 1000).length;
    remarque = `années « rondes » (siècle) : ${ronds}/${ys.length}`;
  }
  if (k === "fiabilite_hauteur" || k === "fiabilite_emprise_sol" || k === "fiabilite_cr_adr_niv_1") {
    remarque = Object.entries(G.reduce((m, g) => ((m[g[k] ?? "null"] = (m[g[k] ?? "null"] ?? 0) + 1), m), {})).map(([v, n]) => `${v}: ${n}`).join(" ; ");
  }
  if (k === "nb_log") {
    const both = G.filter((g) => g.nb_log != null && g.nb_log_rnc != null);
    const desacc = both.filter((g) => Math.abs(g.nb_log - g.nb_log_rnc) > Math.max(1, 0.2 * g.nb_log_rnc)).length;
    remarque = `écart > 20 % avec le RNIC sur ${desacc}/${both.length} groupes où les deux existent`;
  }
  if (k === "mat_mur_txt") remarque = `INDETERMINE : ${G.filter((g) => g.mat_mur_txt === "INDETERMINE").length}`;
  if (k === "usage_principal_bdnb_open") remarque = Object.entries(G.reduce((m, g) => ((m[g[k] ?? "null"] = (m[g[k] ?? "null"] ?? 0) + 1), m), {})).map(([v, n]) => `${v}: ${n}`).join(" ; ");
  p(ligne([k, `${rempli(k)}/${G.length} (${pct(rempli(k), G.length)})`, remarque]));
}
// Cohérence niveaux ↔ hauteur, à la main : 2,5 à 3,5 m par niveau.
const nh = G.filter((g) => g.nb_niveau > 0 && g.hauteur_mean > 0);
const coh = nh.filter((g) => g.hauteur_mean / g.nb_niveau >= 2 && g.hauteur_mean / g.nb_niveau <= 4.5).length;
p(`- niveaux (Fichiers fonciers) cohérents avec la hauteur (BD TOPO, 2 à 4,5 m par niveau) : ${coh}/${nh.length} (${pct(coh, nh.length)})`);

console.log(out.join("\n"));
