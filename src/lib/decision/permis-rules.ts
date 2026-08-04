// LES RÈGLES DES AUTORISATIONS D'URBANISME. PURES.
//
// POURQUOI ELLES EXISTENT. Le registre SDES est appelé, gelé dans le snapshot, rendu à l'écran et
// doté d'une doctrine complète depuis le 01/08/2026, et il n'existait pas pour le moteur. Ni
// `DecisionFact`, ni règle, ni grain déclaré, donc absent du verdict, de la minute et de la liste
// des contrôles, dont le groupe « Autour de l'adresse » ne portait qu'un seul item.
//
// ── CE QUE CETTE RÈGLE NE FAIT PAS, ET POURQUOI ───────────────────────────────────────────────
//
//  1. ELLE NE DÉPEND D'AUCUNE PRÉFÉRENCE (`projectKeys: []`). Personne ne déclare « je veux savoir
//     ce qui va se construire à côté » : c'est l'inconnu décisif type, celui que le lecteur ne sait
//     pas demander. L'accrocher à `cadre_calme` a été écarté, cette préférence étant définie comme
//     « environnement peu dense » au grain COMMUNE, quand un permis ne mesure ni le bruit ni la
//     densité.
//
//  2. ELLE NE MONTE JAMAIS AU-DESSUS DE `secondary`. Le registre ne dit ni le volume, ni l'emprise,
//     ni la nature, ni les effets : un chantier peut être une maison individuelle comme un immeuble
//     de trente logements, et rien dans le snapshot ne les distingue. L'ouverture du chantier
//     augmente la CERTITUDE TEMPORELLE du constat, jamais sa MATÉRIALITÉ DÉCISIONNELLE.
//
//  3. ELLE N'ÉMET QU'UN SEUL FAIT, quel que soit le nombre de dossiers. Un fait par permis
//     produirait plusieurs cartes portant le même geste.
//
// Pure, testée sous `node --test`.

import type {
  DecisionRule, RuleEvaluation, VerificationFact,
} from "./decision-fact.ts";
import type { PermisSnapshot } from "../logement-autour-types.ts";

const RULE_PERMIS = "autour.permis";

/**
 * Les nombres du constat, EN TOUTES LETTRES, avec une majuscule initiale.
 *
 * Table locale plutôt que partagée avec `autour-permis.ts` : là-bas la table sert un lead au
 * FÉMININ (« Une autorisation… »), ici le même nombre ouvre aussi des groupes au masculin
 * (« deux chantiers »). Deux besoins d'accord et de casse différents, deux tables, et aucune ne
 * dépend de l'autre.
 *
 * Au-delà de neuf, le chiffre : « quatorze autorisations » se lit moins bien que « 14 ».
 */
const NOMBRE = ["", "Une", "Deux", "Trois", "Quatre", "Cinq", "Six", "Sept", "Huit", "Neuf"];
const NOMBRE_MIN = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"];

const enTete = (n: number): string => (n < NOMBRE.length ? NOMBRE[n]! : String(n));
const dedans = (n: number): string => (n < NOMBRE_MIN.length ? NOMBRE_MIN[n]! : String(n));

/**
 * L'ÉTAT ÉTABLI, EN DEUX À QUATRE MOTS, et il doit résumer TOUT ce que le fait agrège.
 *
 * Quatre formes, pas deux : un fait portant trois dossiers mixtes qui afficherait « Chantier ouvert »
 * serait vrai d'une partie des données et faux comme résumé de la carte.
 *
 * ET AUCUNE N'AFFIRME PLUS QUE LA SOURCE. « Autorisation non commencée » a été écarté le 03/08 :
 * l'état se déduit de l'ABSENCE d'une déclaration d'ouverture de chantier, et un chantier peut avoir
 * commencé sans que sa déclaration soit parvenue au registre. C'est exactement la correction faite la
 * veille sur `LIBELLE_ETAT`, où « travaux non commencés » est devenu « sans ouverture de chantier
 * déclarée » : la réintroduire ici aurait défait dans le moteur ce qu'on venait de corriger dans le
 * module.
 */
function statusPermis(total: number, ouverts: number): string {
  if (ouverts === 0) return "Sans ouverture déclarée";
  if (ouverts === total) return total === 1 ? "Chantier déclaré ouvert" : "Chantiers déclarés ouverts";
  return "Autorisations non achevées";
}

/**
 * LE CONSTAT. Contrairement à la charnière de la conclusion Autour, il PORTE les chiffres : c'est
 * une carte autonome, lue dans une liste, pas une phrase posée sous une autre qui les dit déjà.
 *
 * Le rayon vient du SNAPSHOT : un dossier créé sous un ancien périmètre doit continuer de décrire
 * celui qui l'a réellement sélectionné.
 */
function statementPermis(total: number, ouverts: number, rayonMeters: number): string {
  const perimetre = `à moins de ${rayonMeters} m`;
  if (total === 1) {
    return ouverts === 1
      ? `Une autorisation créant des logements est recensée ${perimetre}, et son chantier est déclaré ouvert.`
      : `Une autorisation créant des logements est recensée ${perimetre}, sans ouverture de chantier déclarée.`;
  }
  const tete = `${enTete(total)} autorisations créant des logements sont recensées ${perimetre}`;
  if (ouverts === total) return `${tete}, et leurs chantiers sont déclarés ouverts.`;
  if (ouverts === 0) return `${tete}, sans ouverture de chantier déclarée.`;
  return `${tete}, dont ${dedans(ouverts)} chantier${ouverts > 1 ? "s" : ""} ` +
    `déclaré${ouverts > 1 ? "s" : ""} ouvert${ouverts > 1 ? "s" : ""}.`;
}

const permisRule: DecisionRule = {
  id: RULE_PERMIS,
  // Le module dit d'où VIENT la donnée ; l'échelle se dérive de la preuve (cf. `echelles.ts`).
  module: "logement",
  evaluate: (f): RuleEvaluation => {
    const ret = (
      outcome: RuleEvaluation["outcome"], facts: VerificationFact[], reason: string,
    ): RuleEvaluation => ({ ruleId: RULE_PERMIS, projectKeys: [], outcome, facts, reason });

    const p: PermisSnapshot | undefined = f.permis;

    // LE REGISTRE N'A PAS ÉTÉ CONSULTÉ, ce qui n'est pas la même chose que « il n'y a rien ».
    // `not_applicable` dirait que la question ne se pose pas pour cette adresse ; `uncertain` dit
    // que la règle s'applique et que la donnée manque, sans même un fait à montrer.
    if (!p) return ret("uncertain", [], "registre des autorisations non consulté");

    // DEUX SILENCES DISTINCTS SOUS LE MÊME OUTCOME. Le contrat n'offre que `not_applicable` pour
    // les deux, donc la RAISON porte la différence : un audit qui lirait « aucune autorisation non
    // achevée » ne saurait pas si le quartier est calme ou si tout y est déjà construit.
    if (p.permis.length === 0) {
      return ret("not_applicable", [], "registre consulté, aucune autorisation recensée");
    }
    const retenus = p.permis.filter((x) => x.etat !== "acheve");
    if (retenus.length === 0) {
      return ret("not_applicable", [], "autorisations recensées, toutes achevées");
    }

    const total = retenus.length;
    const ouverts = retenus.filter((x) => x.etat === "chantier_ouvert").length;

    const fact: VerificationFact = {
      id: `${f.insee}:autour-permis`,
      ruleId: RULE_PERMIS,
      sourceFactIds: ["autour.permis"],
      module: "logement",
      role: "verification",
      // JAMAIS `structuring`, même sur un chantier ouvert : cf. en-tête, point 2.
      materialityTier: "secondary",
      topic: "les autorisations d'urbanisme récentes",
      statement: statementPermis(total, ouverts, p.rayonMeters),
      status: statusPermis(total, ouverts),
      // LA LIMITATION DIT D'ABORD LE MANQUE DÉCISIF, celui qui explique pourquoi ce fait reste
      // `secondary` et pourquoi l'action existe : le registre ne qualifie ni l'ampleur ni les
      // effets. La couverture du jeu vient ensuite. Dans l'autre ordre, l'action semblait posée à
      // côté du constat au lieu de répondre à sa limite.
      limitation:
        "Le registre ne précise ni l'ampleur ni les effets de l'opération. Il ne couvre ici que " +
        "les autorisations créant des logements : un commerce, un entrepôt ou une extension sans " +
        "logement nouveau n'y figurent pas.",
      evidence: [],
      action: {
        type: "obtenir_document",
        // LE GESTE COMBLE LE MANQUE DE LA DONNÉE. Le dossier déposé porte la nature de l'opération,
        // la hauteur et la surface de plancher, c'est-à-dire exactement les trois informations que
        // le registre ne publie pas et qui décideraient de la matérialité.
        //
        // « Demandez à consulter » décrit une PRATIQUE ; « demandez l'accès » énoncerait un DROIT,
        // ce que `detail` s'interdit. « Repérez notamment » plutôt que « pour connaître » : rien ne
        // garantit que chaque pièce soit complète ni immédiatement lisible.
        label: total === 1
          ? "Demandez en mairie à consulter le dossier de l'autorisation"
          : "Demandez en mairie à consulter les dossiers des autorisations",
        detail:
          "Repérez notamment la nature de l'opération, la hauteur et la surface de plancher " +
          "indiquées dans le dossier.",
      },
    };
    return ret("verification", [fact], "au moins une autorisation non achevée");
  },
};

export const PERMIS_RULES: DecisionRule[] = [permisRule];
