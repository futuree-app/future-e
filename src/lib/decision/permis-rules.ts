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
  DecisionRule, RuleEvaluation, VerificationFact, EvidenceRef,
} from "./decision-fact.ts";
import type { PermisSnapshot } from "../logement-autour-types.ts";
import { dateFr } from "./autour-permis.ts";

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

/**
 * POURQUOI futur•e SIGNALE ce fait, ET DEPUIS QUAND IL LE SAIT.
 *
 * ── LA SÉPARATION AVEC LE CONSTAT EST STRICTE ────────────────────────────────────────────────
 * Le `statement` porte ce qui a été TROUVÉ (nombre, états, rayon) ; la convention porte ce qui a
 * été CHOISI (la fenêtre, et le fait de ne retenir que les non achevées). Mettre le rayon et la
 * fenêtre dans les deux recréerait, à l'intérieur d'une seule carte, la redondance que la
 * vérification à l'écran du 01/08/2026 a révélée entre le bloc des permis et la conclusion.
 *
 * ── LA FENÊTRE SE DÉRIVE DES DEUX CHAMPS GELÉS, JAMAIS D'UN SEUL ─────────────────────────────
 * `permisAMontrer` retient `annee >= anneeCourante - ANCIENNETE_MAX_ANS`, et `anneeCourante` est
 * l'`anneeReference` figée dans le snapshot. Écrire « dans les trois années précédant l'analyse »
 * à partir du seul `ancienneteMaxAns` décrirait une période flottante : rouvert en 2029, un dossier
 * de 2026 laisserait croire qu'on a regardé jusqu'en 2026. L'année calculée est datée, elle.
 * Elle règle du même coup le « dans les une années » qu'un compte en toutes lettres produisait à
 * `ancienneteMaxAns === 1`.
 *
 * ── LA DATE DE CONSULTATION EST ICI, PARCE QUE C'EST ICI QU'ELLE SE VOIT ──────────────────────
 * `observedAt` la porte dans le DOMAINE, mais aucun composant ne le lit aujourd'hui : `EvidenceRow`
 * ne rend que label, valeur et lien, et `factSources` écarte même les preuves qui portent une
 * valeur observée. La convention, elle, est rendue dans « Données et limites »
 * (`ControlesDuDossier.tsx:82`, `DossierDecisionSection.tsx:285`). Sans cette phrase, la carte
 * dirait au présent, en 2029, ce qui a été constaté en 2026.
 */
function conventionPermis(p: PermisSnapshot): string {
  const depuis = p.anneeReference - p.ancienneteMaxAns;
  const jour = dateFr(p.consulteLe);
  const base = `futur•e signale les autorisations non achevées déposées depuis ${depuis}.`;
  return jour ? `${base} Registre consulté le ${jour}.` : base;
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
      signalConvention: conventionPermis(p),
      evidence: [{
        factId: "autour.permis",
        module: "logement",
        label: `Autorisations d'urbanisme · parcelles à moins de ${p.rayonMeters} m`,
        observedValue: `${total} dossier${total > 1 ? "s" : ""} non achevé${total > 1 ? "s" : ""}` +
          (ouverts > 0 ? `, dont ${ouverts} chantier${ouverts > 1 ? "s" : ""} déclaré${ouverts > 1 ? "s" : ""} ouvert${ouverts > 1 ? "s" : ""}` : ""),
        // ANCRE `adresse`, RELATION `proximite` : la mesure part de l'adresse et décrit son
        // ENVIRONNEMENT, donc l'échelle dérivée est le QUARTIER (cf. `echelles.ts`). Le test du
        // fichier tranche dans ce sens : ce que le lecteur vivra autour, pas ce qui atteint son bien.
        grain: "adresse",
        relation: "proximite",
        // AUCUN `href` DANS CE LOT, ET C'EST DÉLIBÉRÉ. `/rapport/autour` sans `dossierId` ne
        // retombe sur le bon bien que par `getSoleDossier`, donc uniquement quand le compte n'en a
        // qu'un ; au-delà, il renvoie vers la liste des biens. La preuve ne connaît pas
        // l'identifiant du dossier, et l'ajouter à `ModuleFacts` y ferait entrer une clé Supabase
        // dans un contrat de faits. Une preuve non cliquable vaut mieux qu'un lien qui ouvre le
        // mauvais bien.
        // LA DATE DE CONSULTATION EST UNE PROPRIÉTÉ DE LA PREUVE, pas un invariant de mise en page.
        // Le fait la porte partout où il est projeté : carte, liste, conclusion, export futur.
        sourceMode: "persisted_snapshot",
        observedAt: p.consulteLe,
      } satisfies EvidenceRef],
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
