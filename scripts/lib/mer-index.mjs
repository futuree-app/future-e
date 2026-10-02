// FUT-33, phase 2A : la vérité littorale ajoutée à l'index du comparateur, À CÔTÉ de distance_cote_km.
//
// Lit data/mer/ (publié par scripts/mer/publier_mer.py) et ajoute à chaque commune :
//   mer_centre_km       distance du point de référence de la commune au rivage marin (km, 10 m près) ;
//   mer_territoire_km   distance du territoire communal au rivage marin (0 si contact) ;
//   loi_littoral        classement DGALN brut (["Mer"], ["Estuaire"], ["Lac"], combinaisons) ou null ;
//   loi_effective       classement après héritage PLM (un arrondissement hérite de sa commune) ;
//   loi_source_commune  code de la commune dont le classement est hérité, ou null.
// distance_cote_km n'est PAS touché : les consommateurs migreront un par un (phase 2B).
// Aucune commune de l'index ne doit manquer dans data/mer : l'ajout échoue plutôt que de laisser un trou.
import { readFileSync } from "node:fs";
import path from "node:path";

export const MER_CHAMPS = ["mer_centre_km", "mer_territoire_km", "loi_littoral", "loi_effective", "loi_source_commune"];

export function lireMer(racine = process.cwd()) {
  const dossier = path.join(racine, "data", "mer");
  const table = JSON.parse(readFileSync(path.join(dossier, "mer-communes.json"), "utf8"));
  const provenance = JSON.parse(readFileSync(path.join(dossier, "provenance.json"), "utf8"));
  return { table, provenance };
}

export function ajouterMer(communes, { table, provenance }) {
  const colonnes = table.colonnes;
  if (colonnes.join() !== MER_CHAMPS.join()) throw new Error(`data/mer : colonnes inattendues (${colonnes.join()})`);
  const manquantes = [];
  for (const c of communes) {
    const v = table.communes[c.insee];
    if (!v) { manquantes.push(c.insee); continue; }
    MER_CHAMPS.forEach((champ, i) => { c[champ] = v[i]; });
  }
  if (manquantes.length > 0) throw new Error(`data/mer : ${manquantes.length} communes de l'index sans mesure (${manquantes.slice(0, 5).join(", ")}…)`);
  return {
    version: provenance.version,
    champs: MER_CHAMPS,
    definition: provenance.definition,
    attribution: provenance.attribution,
    limites: provenance.limites,
    loi_littoral: provenance.loi_littoral,
  };
}
