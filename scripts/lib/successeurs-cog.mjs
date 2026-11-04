// FUT-137 · LA TABLE DES SUCCESSEURS DU COG : à quelle commune ACTUELLE appartient le territoire d'un code
// disparu ? Logique PURE, testée sans les fichiers nationaux (successeurs-cog.test.mjs).
//
// Le RNA range une association sous le code de la commune de son adresse, souvent un code disparu depuis une
// fusion ou un changement de code. FUT-109 rattachait les seuls codes repris depuis le 01/01/2024 ; les codes
// disparus plus tôt restaient orphelins (~10 000 associations actives comptées nulle part).
//
// LA RÈGLE, dans cet ordre :
//  1. Un code encore commune déléguée ou associée dans le COG en vigueur (COMD/COMA) : son territoire est dans
//     sa commune de rattachement (COMPARENT). C'est la déclaration officielle actuelle.
//  2. Sinon, la chaîne des fusions et changements de code (`chaineCog`, la règle unique du dépôt : mouvements
//     31, 32, 33, 34, 41 et 50), jusqu'à une commune existante.
//  3. ABSTENTION quand une commune d'arrivée de la chaîne a été DÉCOUPÉE par un rétablissement (21) APRÈS
//     l'arrivée du code : son territoire peut être dans la commune rétablie comme dans celle qui reste, et le
//     code ne le dit pas. Exemple : La Neuville-Garnier (60455) entre en 2019 dans Les Hauts-Talican (60054) ;
//     en 2024, Beaumont-les-Nonains est rétablie sous 60054 et Les Hauts-Talican passe sous 60694. La chaîne
//     mène à 60054, qui n'a gardé que le CODE : le territoire de La Neuville-Garnier est dans 60694 (règle 1).
//     Un découpage ANTÉRIEUR à l'arrivée ne crée aucune ambiguïté (Le Bois, 2019, dans Grand-Aigueblanche
//     découpée en 1988) : le diagnostic du 24/10/2026 les écartait aussi, par excès de prudence.
//  4. Quand la chaîne est univoque ET que le code est délégué, les deux doivent désigner la même commune :
//     sinon REFUS (la table ne s'écrit pas), plutôt que de choisir entre deux sources officielles.
//  5. La commune actuelle doit être dans l'index (France métropolitaine, Paris, Lyon et Marseille par
//     arrondissement) : sinon abstention `hors_index` (outre-mer, ville à arrondissements).
import { chaineCog } from "../../src/lib/data/bdiff-incendies.ts";

// Les mouvements que suit `chaineCog` (fusions 31 à 34, changements de code 41 et 50) : contrôlés ici.
const RATTACHANTS = new Set(["31", "32", "33", "34", "41", "50"]);

export const REGLE_SUCCESSEURS =
  "code disparu rattaché à sa commune de rattachement s'il est commune déléguée ou associée au COG en vigueur ; " +
  "sinon à l'aboutissement de sa chaîne de fusions et changements de code (mouvements 31, 32, 33, 34, 41, 50) ; " +
  "abstention si une commune d'arrivée a été découpée par un rétablissement (21) après l'arrivée du code, " +
  "ou si la commune actuelle est hors de l'index ; refus si la chaîne univoque et la commune de rattachement divergent";

/**
 * @param {object} p
 * @param {Set<string>} p.communes codes des communes (COM) du COG en vigueur
 * @param {Map<string, string>} p.parents code COMD/COMA -> COMPARENT, du COG en vigueur
 * @param {Array<{MOD: string, DATE_EFF: string, TYPECOM_AV: string, COM_AV: string, TYPECOM_AP: string, COM_AP: string}>} p.mouvements
 * @param {Set<string>} p.referentiel codes de l'index (communes et arrondissements)
 * @returns {{ rattaches: Record<string, string>, parRattachementOfficiel: string[], abstentions: Record<string, object>, communesHorsIndex: string[] }}
 *   `rattaches` : code disparu -> commune de l'index ; `parRattachementOfficiel` : les codes dont la chaîne est
 *   ambiguë ou absente, rattachés par la seule règle 1 ; `abstentions` : code disparu -> { motif, ... } ;
 *   `communesHorsIndex` : les communes EN VIGUEUR absentes de l'index (outre-mer, Paris, Lyon, Marseille).
 */
export function construireSuccesseurs({ communes, parents, mouvements, referentiel }) {
  // `chaineCog` garde le mouvement le plus récent d'un code : deux successeurs différents à la même date
  // rendraient la table dépendante de l'ordre du fichier. Jamais vu (COG 2026) : REFUS si cela arrive.
  const vus = new Map();
  for (const m of mouvements) {
    if (m.TYPECOM_AV !== "COM" || m.TYPECOM_AP !== "COM" || m.COM_AV === m.COM_AP || !RATTACHANTS.has(m.MOD)) continue;
    const cle = `${m.COM_AV}@${m.DATE_EFF}`;
    if (vus.has(cle) && vus.get(cle) !== m.COM_AP) throw new Error(`${m.COM_AV} : deux successeurs le ${m.DATE_EFF} (${vus.get(cle)}, ${m.COM_AP})`);
    vus.set(cle, m.COM_AP);
  }
  const chaine = chaineCog(communes, mouvements);
  const decoupages = new Map();
  for (const m of mouvements) {
    if (m.MOD !== "21" || m.TYPECOM_AV !== "COM") continue;
    if (!decoupages.has(m.COM_AV)) decoupages.set(m.COM_AV, new Set());
    decoupages.get(m.COM_AV).add(m.DATE_EFF);
  }
  const disparus = [...new Set(mouvements.filter((m) => m.TYPECOM_AV === "COM" && !communes.has(m.COM_AV)).map((m) => m.COM_AV))].sort();

  const rattaches = {};
  const parRattachementOfficiel = [];
  const abstentions = {};
  for (const code of disparus) {
    const ch = chaine(code);
    // L'étape où la chaîne devient ambiguë : une commune d'arrivée découpée après l'arrivée du code.
    const coupe = ch?.etapes.find((e) => [...(decoupages.get(e.code) ?? [])].some((d) => d > e.date)) ?? null;
    const parent = parents.get(code) ?? null;
    let actuel;
    if (parent) {
      if (ch && !coupe && ch.actuel !== parent) {
        throw new Error(`${code} : la chaîne du COG mène à ${ch.actuel}, le COG en vigueur le rattache à ${parent}`);
      }
      actuel = parent;
      if (!ch || coupe) parRattachementOfficiel.push(code);
    } else if (!ch) {
      abstentions[code] = { motif: "sans_successeur" };
      continue;
    } else if (coupe) {
      const dates = [...decoupages.get(coupe.code)].filter((d) => d > coupe.date).sort();
      abstentions[code] = { motif: "retablissement_posterieur", commune: coupe.code, arrivee: coupe.date, decoupage: dates };
      continue;
    } else {
      actuel = ch.actuel;
    }
    if (!referentiel.has(actuel)) {
      abstentions[code] = { motif: "hors_index", commune: actuel };
      continue;
    }
    rattaches[code] = actuel;
  }
  const communesHorsIndex = [...communes].filter((c) => !referentiel.has(c)).sort();
  return { rattaches, parRattachementOfficiel, abstentions, communesHorsIndex };
}
