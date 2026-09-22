// ════════════════════════════════════════════════════════════════════════════════════════════
// CE QUE LE VOISINAGE APPORTE À LA DÉCISION.
//
// ── LE TROU QUE CETTE RÈGLE FERME (21/09/2026) ───────────────────────────────────────────────
// Sur une adresse de Châtelaillon, le module Autour annonçait un médecin généraliste à 553 m, et
// le dossier de décision, pour un projet qui déclarait l'accès aux soins en priorité, répondait
// « parmi les 20 % de communes les plus favorables ». Deux échelles, deux écrans, aucune
// rencontre. Le produit mesurait à l'adresse et concluait à la commune.
//
// ── CE QUE CETTE RÈGLE N'EST PAS ─────────────────────────────────────────────────────────────
// Elle ne remplace pas le constat communal, elle le COMPLÈTE. Les deux vérités restent séparées :
// un rang national dit où se situe la commune, un équipement recensé dit ce qu'il y a au pied de
// l'immeuble, et aucun des deux ne vaut pour l'autre.
//
// Elle ne conclut RIEN sur l'accès. La BPE recense une présence : elle ne dit ni la disponibilité,
// ni les délais de rendez-vous, ni l'acceptation de nouveaux patients. C'est la raison pour
// laquelle ce fait est une VÉRIFICATION et jamais un alignement : il donne quelque chose à faire,
// pas une réponse.
//
// ── PREMIÈRE TRANCHE D'UN RAIL ───────────────────────────────────────────────────────────────
// Le patron vaudra pour les écoles, les transports et le reste du voisinage. Il tient en cinq
// pièces : un fait canonique projeté du snapshot (`autour-facts.ts`), une activation par le projet
// déclaré, une preuve au grain de l'adresse, une limite qui borne ce que le fait établit, et une
// action qui dépend de la situation du lecteur. Aucune de ces pièces ne lit la prose du module.
// ════════════════════════════════════════════════════════════════════════════════════════════
import type { DecisionRule, EvidenceRef, RuleEvaluation, VerificationFact } from "./decision-fact.ts";
import { preferenceWeight } from "./project-view.ts";
import { bucketDuProjet, type Bucket } from "./logement-gestes.ts";
import type { EquipementProche } from "./autour-facts.ts";
import { avecArticle } from "../logement-autour-types.ts";

const RULE_SANTE = "autour.acces-soins";
const autourHref = "/rapport/autour";

/**
 * LE GESTE DÉPEND DE LA SITUATION, et il n'est pas gravé dans la règle.
 *
 * Vérifier une disponibilité avant de s'engager n'a de sens que pour qui s'engage. Quelqu'un qui habite
 * déjà là n'a pas la même question, et un professionnel qui prépare un dossier pour son client
 * encore moins.
 */
// JAMAIS LE MOT « CABINET » (21/09/2026). La BPE recense un LIEU et le nombre d'établissements qui
// s'y trouvent. Cinq médecins à la même adresse peuvent être une maison de santé comme cinq
// praticiens indépendants dans le même immeuble : « ce cabinet » trancherait une question que la
// source ne tranche pas. On parle donc du lieu, ou des professionnels qui y sont recensés.
const GESTE_SOINS: Record<Bucket, { label: string; detail: string }> = {
  achat: {
    label: "Vérifiez la disponibilité avant de vous engager",
    detail:
      "La saturation locale ne se lit dans aucune base : un lieu recensé peut être fermé aux nouveaux patients depuis des années.",
  },
  location: {
    label: "Vérifiez qu'un médecin vous accepte avant de signer",
    detail:
      "La présence d'un lieu de santé ne dit rien de sa disponibilité. Un appel suffit à le savoir.",
  },
  reside: {
    label: "Vérifiez que les professionnels recensés prennent de nouveaux patients",
    detail:
      "Utile avant d'en avoir besoin : la disponibilité change, et elle ne se lit dans aucune base.",
  },
  neutre: {
    label: "Renseignez-vous sur les disponibilités des professionnels recensés",
    detail:
      "La BPE recense les lieux, jamais leurs délais de rendez-vous ni leur ouverture aux nouveaux patients.",
  },
};

/** « à 550 m » plutôt que « à 553 m » : la précision au mètre serait un faux témoignage. */
function distanceArrondie(m: number): string {
  if (m < 100) return `${Math.round(m / 10) * 10} m`;
  if (m < 1000) return `${Math.round(m / 50) * 50} m`;
  return `${(m / 1000).toFixed(1).replace(".", ",")} km`;
}

/** Les nombres se disent en lettres jusqu'à dix, comme partout ailleurs dans le dossier. */
const EN_LETTRES = ["zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix"];
function nombre(n: number): string {
  return EN_LETTRES[n] ?? String(n);
}

/**
 * CE QUE LE LECTEUR LIT, et rien de plus que ce que la source établit.
 *
 * Le type précis est préféré à la catégorie (« un médecin généraliste » plutôt que « un
 * équipement de santé »), et le nom prend la place du type quand un seul exploitant est recensé.
 *
 * ── DEUX CORRECTIONS DE LANGUE (22/09/2026), VUES À L'ÉCRAN ─────────────────────────────────
 * Le libellé de la BPE était repris tel quel, sans article : « médecin généraliste est recensé ».
 * L'article vient maintenant de `avecArticle`, qui connaît le genre de chaque libellé.
 *
 * Et « recensé » revenait trois fois en deux lignes, statut compris. Le mot reste là où il porte
 * une précaution utile, sur le DÉNOMBREMENT, qui est ce que la base établit vraiment. La première
 * phrase, elle, constate simplement une présence.
 */
function constatSante(e: EquipementProche): string {
  const quoi = e.typeLabel ? avecArticle(e.typeLabel) : "un équipement de santé";
  const ou = `à environ ${distanceArrondie(e.distanceMeters)} de cette adresse`;
  const nomme = e.nom ? ` (${e.nom})` : "";
  // CE QUI S'AJOUTE, DANS L'ORDRE DE CE QUE ÇA APPREND. Plusieurs praticiens au même point disent
  // qu'on n'y dépend pas d'une seule personne ; plusieurs LIEUX à portée de pas disent qu'on a le
  // choix. Les deux ne se valent pas, et les dire ensemble alourdirait pour rien.
  const suite =
    e.exploitants && e.exploitants > 1
      ? ` ${capitale(nombre(e.exploitants))} professionnels y sont recensés.`
      : e.lieuxAPortee > 1
        ? ` ${capitale(nombre(e.lieuxAPortee))} lieux de santé sont recensés à moins de ${e.rayonPasMeters} m.`
        : "";
  return `${capitale(quoi)}${nomme} se trouve ${ou}.${suite}`;
}

function capitale(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const accesSoinsRule: DecisionRule = {
  id: RULE_SANTE,
  // Le module dit d'où vient la donnée ; l'échelle se dérive de la preuve.
  module: "logement",
  evaluate: (f, p): RuleEvaluation => {
    const ret = (
      outcome: RuleEvaluation["outcome"],
      facts: VerificationFact[],
      reason: string,
    ): RuleEvaluation => ({ ruleId: RULE_SANTE, projectKeys: ["acces_soins"], outcome, facts, reason });

    // L'ACTIVATION VIENT DU PROJET. Sans priorité déclarée, ce constat n'aide personne à décider,
    // et l'ajouter à tous les dossiers ferait du bruit dans la décision de ceux qui n'ont rien
    // demandé. Le module Autour, lui, l'affiche pour tout le monde : c'est sa fonction.
    if (preferenceWeight(p, "acces_soins") < 2) {
      return ret("not_applicable", [], "priorité non déclarée");
    }

    const equipements = f.autour?.equipements;
    // Pas de voisinage exploitable (dossier sans adresse, snapshot absent, source en échec) : la
    // règle SE TAIT. La lecture communale, elle, a bien eu lieu et reste affichée.
    if (!equipements || equipements.sante === undefined) {
      return ret("not_applicable", [], "voisinage non analysé");
    }

    // LA SOURCE A RÉPONDU, ET IL N'Y A RIEN. C'est une information, et elle vaut d'être dite à qui
    // a déclaré cette priorité. Elle reste une absence DANS UN PÉRIMÈTRE, jamais une absence de
    // soins : un lieu de santé peut être à 3 km, hors du rayon cherché.
    if (equipements.sante === null) {
      const fact: VerificationFact = {
        id: `${f.insee}:autour-acces-soins-absent`,
        ruleId: RULE_SANTE,
        sourceFactIds: ["autour.sante"],
        module: "logement",
        role: "verification",
        materialityTier: "secondary",
        topic: "les soins autour de cette adresse",
        statement:
          "Autour de cette adresse, aucun équipement de santé n'est recensé dans le périmètre cherché.",
        status: "Aucun dans le périmètre",
        limitation:
          "Le périmètre de recherche est borné : un lieu de santé situé au-delà n'apparaît pas ici, et la commune peut rester bien dotée.",
        evidence: [
          {
            factId: "autour.sante",
            module: "logement",
            label: "Équipements de santé · autour de l'adresse",
            observedValue: "aucun dans le périmètre cherché",
            grain: "adresse",
            relation: "proximite",
            href: autourHref,
          },
        ],
        action: {
          type: "verifier_sur_place",
          label: "Repérez le lieu de santé le plus proche avant de décider",
          detail: "La recherche s'arrête à un rayon : au-delà, la distance se mesure sur une carte.",
        },
      };
      return ret("verification", [fact], "aucun équipement de santé dans le périmètre");
    }

    const e = equipements.sante;
    const evidence: EvidenceRef = {
      factId: "autour.sante",
      module: "logement",
      label: "Équipements de santé · autour de l'adresse",
      observedValue: `${e.typeLabel ?? "équipement de santé"} à ${distanceArrondie(e.distanceMeters)}`,
      // ANCRE `adresse`, RELATION `proximite` : la mesure est une distance DEPUIS le point, à vol
      // d'oiseau. Ni un attribut de l'adresse, ni une donnée de secteur.
      grain: "adresse",
      relation: "proximite",
      href: autourHref,
    };

    const geste = GESTE_SOINS[bucketDuProjet(p)];
    const fact: VerificationFact = {
      id: `${f.insee}:autour-acces-soins`,
      ruleId: RULE_SANTE,
      sourceFactIds: ["autour.sante"],
      module: "logement",
      role: "verification",
      // JAMAIS `structuring`, quel que soit le poids de la priorité : une présence ne conclut pas
      // seule. C'est la même règle que pour l'équipement automobile du secteur.
      materialityTier: "secondary",
      topic: "les soins autour de cette adresse",
      statement: constatSante(e),
      status: "À proximité",
      limitation:
        "Cette présence ne dit ni la disponibilité du praticien, ni ses délais de rendez-vous, ni s'il accepte de nouveaux patients. La distance est à vol d'oiseau.",
      evidence: [evidence],
      action: { type: "verifier_sur_place", label: geste.label, detail: geste.detail },
    };
    return ret("verification", [fact], "équipement de santé recensé à proximité");
  },
};

export const AUTOUR_RULES: DecisionRule[] = [accesSoinsRule];
