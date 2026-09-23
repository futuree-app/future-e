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
import { TYPE_GENERALISTE, TYPE_PHARMACIE } from "./autour-facts.ts";
import { avecArticle, TYPEQU_LABEL } from "../logement-autour-types.ts";

const RULE_SANTE = "autour.acces-soins";
const autourHref = "/rapport/autour";

/**
 * LE GESTE DÉPEND DE LA SITUATION, et il n'est pas gravé dans la règle.
 *
 * Vérifier une disponibilité avant de s'engager n'a de sens que pour qui s'engage. Quelqu'un qui habite
 * déjà là n'a pas la même question, et un professionnel qui prépare un dossier pour son client
 * encore moins.
 *
 * ── UN GESTE SE COMPREND SEUL (22/09/2026) ──────────────────────────────────────────────────
 * Il s'écrivait « Vérifiez la disponibilité avant de vous engager ». Sous la carte, le sujet
 * précède et la phrase se comprend ; mais le geste est AUSSI repris en tête de dossier, dans
 * « À contrôler en priorité », où il se lit SANS la carte qui le porte. Le lecteur y trouvait la
 * disponibilité de rien.
 *
 * Le produit appliquait déjà cette règle sans l'avoir écrite : ses vingt-quatre autres gestes
 * nomment tous leur objet (« Demandez l'historique des fissures », « Consultez le règlement de la
 * zone en mairie »). Elle vaut pour tout geste cloné sur ce patron : un libellé d'action nomme ce
 * sur quoi il porte, parce qu'il voyagera hors de son contexte.
 *
 * ── LE GESTE SUIT LE TYPE TROUVÉ, PAS LA CATÉGORIE (22/09/2026) ─────────────────────────────
 * Ils parlaient de « professionnels de santé » parce que la catégorie mélange les généralistes et
 * les pharmacies. Le résultat était absurde dès que le lieu trouvé était une pharmacie :
 * « vérifiez que les professionnels de santé proches prennent de nouveaux patients » ne veut rien
 * dire d'une officine, et la limitation parlait de délais de rendez-vous.
 *
 * Il y a donc DEUX jeux de gestes, choisis sur le code du type. Une pharmacie ne se vérifie pas
 * comme un médecin : ce qui manque alors au lecteur n'est pas une disponibilité, c'est un endroit
 * où consulter.
 */
// JAMAIS LE MOT « CABINET » (21/09/2026). La BPE recense un LIEU et le nombre d'établissements qui
// s'y trouvent. Cinq médecins à la même adresse peuvent être une maison de santé comme cinq
// praticiens indépendants dans le même immeuble : « ce cabinet » trancherait une question que la
// source ne tranche pas. On parle donc du lieu, ou des professionnels qui y sont recensés.
const GESTE_MEDECIN: Record<Bucket, { label: string; detail: string }> = {
  achat: {
    // 70 CARACTÈRES AU PLUS, sans point final : c'est un repère d'une ligne, et le moteur refuse
    // tout le dossier au-delà (`assertFactValid`). « … avant de vous engager » en faisait 73, et
    // la mise à jour du dossier échouait en production sans que les tests l'aient vu.
    label: "Vérifiez qu'un médecin prend de nouveaux patients avant l'achat",
    detail:
      "La saturation locale ne se lit dans aucune base : un lieu recensé peut être fermé aux nouveaux patients depuis des années.",
  },
  location: {
    label: "Vérifiez qu'un médecin accepte de nouveaux patients avant de signer",
    detail:
      "La présence d'un médecin ne dit rien de sa disponibilité. Un appel suffit à le savoir.",
  },
  reside: {
    label: "Vérifiez que le médecin le plus proche prend de nouveaux patients",
    detail:
      "Utile avant d'en avoir besoin : la disponibilité change, et elle ne se lit dans aucune base.",
  },
  neutre: {
    label: "Renseignez-vous sur les délais de rendez-vous des médecins du secteur",
    detail:
      "La BPE recense les lieux, jamais leurs délais de rendez-vous ni leur ouverture aux nouveaux patients.",
  },
};

// CE QUI MANQUE QUAND SEULE UNE PHARMACIE EST LÀ n'est pas une disponibilité : c'est un endroit où
// consulter. Le geste porte donc sur le médecin absent du périmètre, jamais sur l'officine, dont
// ni les horaires ni les services ne sont dans cette base.
const GESTE_PHARMACIE: Record<Bucket, { label: string; detail: string }> = {
  achat: {
    label: "Repérez où consulter un médecin avant de vous engager",
    detail:
      "Une pharmacie dépanne, elle ne remplace pas un médecin traitant : la recherche d'un généraliste se fait avant d'en avoir besoin.",
  },
  location: {
    label: "Repérez où consulter un médecin avant de signer",
    detail:
      "Une pharmacie dépanne, elle ne remplace pas un médecin traitant.",
  },
  reside: {
    label: "Repérez le médecin généraliste le plus proche",
    detail:
      "Une pharmacie ne remplace pas un médecin traitant, et trouver un généraliste qui prend de nouveaux patients demande parfois du temps.",
  },
  neutre: {
    label: "Repérez où consulter un médecin dans le secteur",
    detail:
      "La BPE recense les officines et les cabinets, jamais leurs horaires ni leur ouverture aux nouveaux patients.",
  },
};

// CE QUE LA PRÉSENCE N'ÉTABLIT PAS, et ce n'est pas la même chose selon le type. Un médecin pose
// la question de sa disponibilité ; une pharmacie, celle de ce qu'elle ne remplace pas.
const LIMITE_MEDECIN =
  "Cette présence ne dit ni la disponibilité du praticien, ni ses délais de rendez-vous, ni s'il accepte de nouveaux patients. La distance est à vol d'oiseau.";
const LIMITE_PHARMACIE =
  "Une pharmacie ne remplace pas un médecin traitant, et ses horaires ne figurent pas dans cette base. La distance est à vol d'oiseau.";

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
function constatSante(
  e: EquipementProche,
  contexte: { pharmacieEnPlus?: EquipementProche; aucunMedecinEtabli?: boolean } = {},
): string {
  const quoi = e.typeLabel ? avecArticle(e.typeLabel) : "un équipement de santé";
  const ou = `à environ ${distanceArrondie(e.distanceMeters)} de cette adresse`;
  const nomme = e.nom ? ` (${e.nom})` : "";

  // MÊME DISTANCE, UNE SEULE PHRASE (23/09/2026, proposition du porteur).
  // ══════════════════════════════════════════════════════════════════════════════════════════
  // Sur l'adresse de Châtelaillon, le médecin et la pharmacie sont au même endroit, et le texte
  // disait « Un médecin généraliste se trouve à environ 550 m […] La pharmacie la plus proche est
  // à environ 550 m. » : deux fois la même distance, dans deux phrases.
  //
  // Le critère est la distance ARRONDIE, celle que la phrase affiche : c'est le seul qui rend
  // « à environ 550 m » vrai pour les deux à la fois.
  //
  // Dans la phrase commune, les praticiens se comptent comme « médecins » et plus comme
  // « professionnels » : à côté d'une pharmacie, « professionnels » laisserait croire qu'elle est
  // comptée dedans. Les shards rangent chaque lieu par TYPE, donc les exploitants d'un lieu de
  // généralistes sont des généralistes.
  const pharmacie = contexte.pharmacieEnPlus;
  if (pharmacie && distanceArrondie(pharmacie.distanceMeters) === distanceArrondie(e.distanceMeters)) {
    const praticiens = e.exploitants && e.exploitants > 1
      ? ` ${capitale(nombre(e.exploitants))} médecins y sont recensés.`
      : "";
    return `${capitale(quoi)}${nomme} et une pharmacie se trouvent ${ou}.${praticiens}`;
  }
  // CE QUI S'AJOUTE, DANS L'ORDRE DE CE QUE ÇA APPREND. Plusieurs praticiens au même point disent
  // qu'on n'y dépend pas d'une seule personne ; plusieurs LIEUX à portée de pas disent qu'on a le
  // choix. Les deux ne se valent pas, et les dire ensemble alourdirait pour rien.
  const suite =
    e.exploitants && e.exploitants > 1
      ? ` ${capitale(nombre(e.exploitants))} professionnels y sont recensés.`
      : e.lieuxAPortee > 1
        ? ` ${capitale(nombre(e.lieuxAPortee))} lieux de santé sont recensés à moins de ${e.rayonPasMeters} m.`
        : "";
  // LA PHARMACIE EN COMPLÉMENT, jamais à la place : le lecteur qui déclare l'accès aux soins pense
  // d'abord au médecin, et savoir où est l'officine complète la réponse sans la remplacer.
  const appoint = contexte.pharmacieEnPlus
    ? ` La pharmacie la plus proche est à environ ${distanceArrondie(contexte.pharmacieEnPlus.distanceMeters)}.`
    : "";
  // L'ABSENCE DE MÉDECIN SE DIT quand elle a été CHERCHÉE, et alors elle est le vrai sujet : une
  // officine à 200 m ne dit rien de l'endroit où consulter.
  const manque = contexte.aucunMedecinEtabli
    ? " Aucun médecin généraliste n'apparaît dans le périmètre cherché."
    : "";
  return `${capitale(quoi)}${nomme} se trouve ${ou}.${suite}${appoint}${manque}`;
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

    // QUEL LIEU RACONTER : LE TYPE, PAS LA CATÉGORIE (22/09/2026).
    // ════════════════════════════════════════════════════════════════════════════════════════
    // La catégorie « santé » mélange les généralistes et les pharmacies, et ne gardait que le plus
    // proche des deux. Une pharmacie à 150 m masquait donc un médecin à 900 m : le dossier de
    // quelqu'un qui avait déclaré l'accès aux soins racontait l'officine et taisait le médecin.
    //
    // Quand le snapshot porte la ventilation, le MÉDECIN mène le constat : c'est lui qui répond à
    // la priorité déclarée, la pharmacie ne le remplace pas. Elle est nommée en complément quand
    // elle existe, et elle prend le constat seulement quand aucun médecin n'est recensé.
    //
    // Sur un dossier figé AVANT la ventilation, on retombe sur le plus proche de la catégorie et
    // la formulation suit son `typeLabel` : moins fin, jamais faux.
    const ventile = f.autour?.ventileParType === true;
    const medecin = ventile ? f.autour?.parType?.[TYPE_GENERALISTE] : undefined;
    const pharmacie = ventile ? f.autour?.parType?.[TYPE_PHARMACIE] : undefined;
    const e = medecin ?? pharmacie ?? equipements.sante;
    // UN MÉDECIN, au sens de cette règle : celui que la ventilation désigne, ou, sur un dossier
    // ancien, le plus proche de la catégorie quand son libellé dit qu'il en est un.
    const estMedecin = medecin !== undefined
      || (!ventile && e.typeLabel === TYPEQU_LABEL[TYPE_GENERALISTE]);
    // L'ABSENCE DE MÉDECIN NE SE DIT QUE SI ELLE A ÉTÉ CHERCHÉE. Sur un dossier non ventilé, on ne
    // sait pas si un généraliste existe dans le périmètre : le taire est la seule honnêteté.
    const aucunMedecinEtabli = ventile && medecin === undefined;

    // LA PASTILLE PORTE LA MESURE, PAS LA PHRASE (22/09/2026).
    // ════════════════════════════════════════════════════════════════════════════════════════
    // Elle disait « Preuve · Médecin généraliste à 550 m » sous une phrase qui venait de dire la
    // même chose en toutes lettres. La doctrine de la pastille (lot A, `DecisionFactRenderParts`)
    // la réserve à une preuve ÉTABLIE, CHIFFRÉE : ce qu'elle apporte est la valeur mesurée et le
    // lien vers la démonstration, jamais un résumé du constat.
    //
    // Le type de l'équipement reste dans la phrase, où il se lit ; la pastille garde la distance,
    // qui est ce que la source mesure.
    const evidence: EvidenceRef = {
      factId: "autour.sante",
      module: "logement",
      label: "Équipements de santé · autour de l'adresse",
      observedValue: distanceArrondie(e.distanceMeters),
      // ANCRE `adresse`, RELATION `proximite` : la mesure est une distance DEPUIS le point, à vol
      // d'oiseau. Ni un attribut de l'adresse, ni une donnée de secteur.
      grain: "adresse",
      relation: "proximite",
      href: autourHref,
    };

    // LA SOURCE ET SON MILLÉSIME, SANS VALEUR MESURÉE : cette référence ne prétend rien établir,
    // elle dit d'où vient la donnée. Le rendu la range donc sous « Données et limites » plutôt que
    // d'en faire une seconde pastille (cf. `factSources`). Le millésime vient de la donnée elle-même,
    // jamais d'une constante : un dossier figé il y a six mois porte le sien.
    const source: EvidenceRef | null = f.autour?.bpeMillesime
      ? {
          factId: "autour.sante.source",
          module: "logement",
          label: `Base permanente des équipements (INSEE), millésime ${f.autour.bpeMillesime}`,
          grain: "adresse",
          relation: "proximite",
        }
      : null;

    const geste = (estMedecin ? GESTE_MEDECIN : GESTE_PHARMACIE)[bucketDuProjet(p)];
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
      statement: constatSante(e, {
        ...(estMedecin && pharmacie ? { pharmacieEnPlus: pharmacie } : {}),
        aucunMedecinEtabli: !estMedecin && aucunMedecinEtabli,
      }),
      status: "À proximité",
      limitation: estMedecin ? LIMITE_MEDECIN : LIMITE_PHARMACIE,
      evidence: source ? [evidence, source] : [evidence],
      action: { type: "verifier_sur_place", label: geste.label, detail: geste.detail },
    };
    return ret("verification", [fact], "équipement de santé recensé à proximité");
  },
};

// ════════════════════════════════════════════════════════════════════════════════════════════
// LA GARE LA PLUS PROCHE (23/09/2026), deuxième bloc du rail.
//
// ── CE QUE LA SOURCE DIT, ET RIEN DE PLUS ────────────────────────────────────────────────────
// La BPE recense trois classes de gares de voyageurs (intérêt national, régional, local). Aucune
// ne mesure la desserte : une gare « locale » peut avoir des trains toutes les demi-heures, une
// gare « régionale » quelques-uns par jour. La règle ne crée donc AUCUNE hiérarchie entre elles
// et raconte la plus proche, quelle que soit sa classe. La ventilation par type existe dans le
// snapshot : elle permettra un jour de nommer deux gares si cela apprend quelque chose, jamais de
// décider que l'une « mène ».
//
// ── CE QUI RESTE HORS DE CETTE RÈGLE ─────────────────────────────────────────────────────────
// Les bus, trams et métros : c'est un autre critère (`mobilite_quotidienne`), et la BPE ne les
// connaît pas. Les écoles : la priorité `acces_ecoles` parle de collèges et de lycées, et le
// voisinage ne recense aujourd'hui que les maternelles et les élémentaires. Raconter une
// maternelle à qui cherche un lycée serait vrai et hors sujet ; la règle attend que les shards
// portent les collèges (C201) et les lycées (C301, C302…).
// ════════════════════════════════════════════════════════════════════════════════════════════
const RULE_GARE = "autour.gare";

// UN SEUL GESTE, QUELLE QUE SOIT LA SITUATION. Contrairement au médecin, la question ne change pas
// selon qu'on achète, loue ou habite déjà : les horaires et les destinations se vérifient de la
// même façon. Il nomme son objet, puisqu'il remonte seul dans « À contrôler en priorité ».
const GESTE_GARE = {
  label: "Vérifiez les horaires et destinations de la gare la plus proche",
  detail:
    "La base recense les gares de voyageurs, jamais la fréquence des trains ni les lignes qui y passent.",
};
const LIMITE_GARE =
  "La présence d'une gare ne dit ni la fréquence des trains, ni les destinations desservies, ni les horaires. La distance est à vol d'oiseau.";

/** La source et son millésime, sans valeur mesurée : elle descend sous « Données et limites ». */
function sourceBpeDe(f: { autour?: { bpeMillesime?: string } }, factId: string): EvidenceRef | null {
  return f.autour?.bpeMillesime
    ? {
        factId,
        module: "logement",
        label: `Base permanente des équipements (INSEE), millésime ${f.autour.bpeMillesime}`,
        grain: "adresse",
        relation: "proximite",
      }
    : null;
}

const gareRule: DecisionRule = {
  id: RULE_GARE,
  module: "logement",
  evaluate: (f, p): RuleEvaluation => {
    const ret = (
      outcome: RuleEvaluation["outcome"],
      facts: VerificationFact[],
      reason: string,
    ): RuleEvaluation => ({ ruleId: RULE_GARE, projectKeys: ["acces_transports"], outcome, facts, reason });

    if (preferenceWeight(p, "acces_transports") < 2) {
      return ret("not_applicable", [], "priorité non déclarée");
    }
    const equipements = f.autour?.equipements;
    if (!equipements || equipements.transports === undefined) {
      return ret("not_applicable", [], "voisinage non analysé");
    }

    // LA SOURCE A RÉPONDU, ET IL N'Y A PAS DE GARE DANS LE PÉRIMÈTRE. C'est une information pour
    // qui a déclaré le train en priorité, bornée au rayon cherché.
    if (equipements.transports === null) {
      const source = sourceBpeDe(f, "autour.gare.source");
      const fact: VerificationFact = {
        id: `${f.insee}:autour-gare-absente`,
        ruleId: RULE_GARE,
        sourceFactIds: ["autour.transports"],
        module: "logement",
        role: "verification",
        materialityTier: "secondary",
        topic: "le train autour de cette adresse",
        statement: "Aucune gare de voyageurs n'apparaît dans le périmètre cherché autour de cette adresse.",
        status: "Aucune dans le périmètre",
        limitation:
          "Le périmètre de recherche est borné : une gare située au-delà n'apparaît pas ici, et la commune peut rester bien desservie.",
        evidence: [
          {
            factId: "autour.transports",
            module: "logement",
            label: "Gares · autour de l'adresse",
            observedValue: "aucune dans le périmètre cherché",
            grain: "adresse",
            relation: "proximite",
            href: autourHref,
          },
          ...(source ? [source] : []),
        ],
        action: {
          type: "verifier_sur_place",
          label: "Repérez la gare la plus proche et ses destinations",
          detail: "La recherche s'arrête à un rayon : au-delà, la distance se mesure sur une carte.",
        },
      };
      return ret("verification", [fact], "aucune gare dans le périmètre");
    }

    const e = equipements.transports;
    const source = sourceBpeDe(f, "autour.gare.source");
    const fact: VerificationFact = {
      id: `${f.insee}:autour-gare`,
      ruleId: RULE_GARE,
      sourceFactIds: ["autour.transports"],
      module: "logement",
      role: "verification",
      // JAMAIS `structuring` : une gare recensée ne dit pas qu'on peut se passer de voiture.
      materialityTier: "secondary",
      topic: "le train autour de cette adresse",
      statement: `Une gare se trouve à environ ${distanceArrondie(e.distanceMeters)} de cette adresse.`,
      status: "À proximité",
      limitation: LIMITE_GARE,
      evidence: [
        {
          factId: "autour.transports",
          module: "logement",
          label: "Gares · autour de l'adresse",
          observedValue: distanceArrondie(e.distanceMeters),
          grain: "adresse",
          relation: "proximite",
          href: autourHref,
        },
        ...(source ? [source] : []),
      ],
      action: { type: "verifier_sur_place", label: GESTE_GARE.label, detail: GESTE_GARE.detail },
    };
    return ret("verification", [fact], "gare recensée à proximité");
  },
};

export const AUTOUR_RULES: DecisionRule[] = [accesSoinsRule, gareRule];
