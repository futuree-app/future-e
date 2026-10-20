// FUT-118 · TÉMOIN 04 · L'ÉNONCÉ D'UN CRITÈRE QUI DÉPARTAGE, GABARIT DÉTERMINISTE. DEV UNIQUEMENT.
//
// Ce n'est pas `ceQuiDepartage` (FUT-41 / FUT-22) : c'est l'écriture minimale dont le témoin a besoin,
// gardée ici pour être TESTÉE SUR CE QU'ELLE DIT (leçon du 25/07, AGENTS.md). La première version
// du témoin rangeait chaque critère dans la bonne classe et écrivait pourtant « reste à vérifier »
// pour une possibilité que la marge disait « non examinée ».
export type Mot = "tient" | "ne tient pas" | "à vérifier" | "non examiné";
export type Classe = "departage" | "departage_possible" | "accord";

export const ETABLIE: Record<Mot, boolean> = { tient: true, "ne tient pas": true, "à vérifier": false, "non examiné": false };

export const liste = (noms: string[]): string =>
  noms.length <= 1 ? noms.join("") : `${noms.slice(0, -1).join(", ")} et ${noms[noms.length - 1]}`;

/** À 2 possibilités, l'énoncé nomme tout ; à 5 et plus, il nomme la MINORITÉ (cadrage FUT-41 § C). */
export function enonce(sujet: string, issues: { nom: string; mot: Mot }[]): { classe: Classe; texte: string } {
  const motsEtablis = new Set(issues.filter((x) => ETABLIE[x.mot]).map((x) => x.mot));
  const nonEtablies = issues.filter((x) => !ETABLIE[x.mot]);
  const aVerifier = issues.filter((x) => x.mot === "à vérifier").map((x) => x.nom);
  const nonExamine = issues.filter((x) => x.mot === "non examiné").map((x) => x.nom);
  const inconnu = [
    aVerifier.length ? `reste à vérifier pour ${liste(aVerifier)}` : "",
    nonExamine.length ? `non examiné pour ${liste(nonExamine)}` : "",
  ].filter(Boolean).join(" ; ");

  if (motsEtablis.size <= 1 && nonEtablies.length === 0) {
    return { classe: "accord", texte: `${sujet} : toutes vos possibilités ont la même issue, ce critère ne les départage pas.` };
  }
  if (motsEtablis.size <= 1) return { classe: "departage_possible", texte: `${sujet} : pourrait encore départager ; ${inconnu}.` };

  const tiennent = issues.filter((x) => x.mot === "tient").map((x) => x.nom);
  const neTiennentPas = issues.filter((x) => x.mot === "ne tient pas").map((x) => x.nom);
  const reste = inconnu ? ` Par ailleurs, ${inconnu}.` : "";
  if (issues.length >= 5) {
    if (neTiennentPas.length <= tiennent.length) {
      return { classe: "departage", texte: `${sujet} : ${liste(neTiennentPas)} ${neTiennentPas.length > 1 ? "ne tiennent pas" : "ne tient pas"}.${reste}` };
    }
    return { classe: "departage", texte: `${sujet} : ${tiennent.length > 1 ? "seules tiennent" : "seule tient"} ${liste(tiennent)}.${reste}` };
  }
  return { classe: "departage", texte: `${sujet} : ${liste(tiennent)} ${tiennent.length > 1 ? "tiennent" : "tient"} ; ${liste(neTiennentPas)} non.${reste}` };
}
