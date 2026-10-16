// FUT-50 · Banc HTTP de l'identité communale de la route de lecture (serveur de développement local, port 3050).
// Le code INSEE validé décide du nom présenté ; le nom envoyé par le navigateur n'a aucune autorité.
// Usage : node scripts/fut50/verifier-identite.mjs
const BASE = process.env.BASE ?? "http://localhost:3050";
const CLES = ["chaleur", "hivers", "taille", "voiture", "risques"];
let echecs = 0;
const verifier = (ok, message) => { console.log(`${ok ? "ok  " : "ÉCHEC"} ${message}`); if (!ok) echecs++; };
async function lire(insee, cle, commune) {
  const q = new URLSearchParams({ insee, cle, type: "commune", ...(commune != null ? { commune, libelle: commune } : {}) });
  const r = await fetch(`${BASE}/dev/fut50/api/lecture?${q}`);
  return { statut: r.status, corps: await r.json().catch(() => null) };
}

// 1-2. Nîmes, avec son nom puis avec « La Rochelle » : même identité, jamais « La Rochelle ».
for (const fourni of ["Nîmes", "La Rochelle", undefined]) {
  for (const cle of CLES) {
    const { statut, corps } = await lire("30189", cle, fourni);
    const texte = JSON.stringify(corps?.lecture ?? {});
    verifier(statut === 200 && corps.lecture.commune === "Nîmes" && !texte.includes("Rochelle"),
      `30189 · ${cle} · nom fourni « ${fourni ?? "(aucun)"} » → « ${corps?.lecture?.commune} »`);
  }
}
// 3. La Rochelle avec son vrai code.
{ const { statut, corps } = await lire("17300", "chaleur", "Nîmes"); verifier(statut === 200 && corps.lecture.commune === "La Rochelle", `17300 · nom fourni « Nîmes » → « ${corps?.lecture?.commune} »`); }
// 4-5. Corse, Paris / Lyon / Marseille (ville et arrondissement).
for (const [insee, attendu] of [["2A004", "Ajaccio"], ["2B033", "Bastia"], ["2a004", "Ajaccio"], ["75056", "Paris"], ["69123", "Lyon"], ["13055", "Marseille"], ["75111", "Paris 11e Arrondissement"], ["13201", "Marseille 1er Arrondissement"]]) {
  const { statut, corps } = await lire(insee, "chaleur", "Ailleurs");
  verifier(statut === 200 && corps.lecture.commune === attendu, `${insee} → « ${corps?.lecture?.commune} » (attendu « ${attendu} »)`);
}
// 6. Codes malformés : 400, aucune lecture.
for (const insee of ["3018", "301890", "1A234", "2C004", "ABCDE", "", "30 189"]) {
  const { statut, corps } = await lire(insee, "chaleur", "Nîmes");
  verifier(statut === 400 && !corps?.lecture, `malformé « ${insee} » → ${statut} ${corps?.error ?? ""}`);
}
// 7. Codes bien formés mais inconnus des référentiels : 404, aucune identité devinée.
for (const [insee, quoi] of [["99999", "inexistant"], ["50173", "ancienne commune fusionnée"], ["97999", "format ultramarin, absent du COG"]]) {
  const { statut, corps } = await lire(insee, "chaleur", "Nîmes");
  verifier(statut === 404 && corps?.error === "commune_inconnue" && !corps?.lecture, `${insee} (${quoi}) → ${statut} ${corps?.error ?? ""}`);
}
// 8. Outre-mer (FUT-104) : l'identité vient du COG embarqué, désambiguïsée, quel que soit le nom envoyé.
for (const [insee, attendu] of [["97411", "Saint-Denis (La Réunion)"], ["97209", "Fort-de-France (Martinique)"], ["97611", "Mamoudzou (Mayotte)"],
  ["97302", "Cayenne (Guyane)"], ["98818", "Nouméa (Nouvelle-Calédonie)"], ["98735", "Papeete (Polynésie française)"],
  ["97801", "Saint-Martin"], ["97701", "Saint-Barthélemy"], ["98736", "Pirae (Polynésie française)"], ["97502", "Saint-Pierre (Saint-Pierre-et-Miquelon)"]]) {
  const { statut, corps } = await lire(insee, "chaleur", "Nîmes");
  verifier(statut === 200 && corps.lecture.commune === attendu, `${insee} → « ${corps?.lecture?.commune} » (attendu « ${attendu} »)`);
}
// Priorité inconnue.
{ const { statut } = await lire("30189", "inconnue", "Nîmes"); verifier(statut === 400, `priorité inconnue → ${statut}`); }
console.log(echecs ? `\n${echecs} échec(s)` : "\nTout est conforme.");
process.exit(echecs ? 1 : 0);
