// ════════════════════════════════════════════════════════════════════════════════════════════
// LA RELATION AU LIEU (FUT-26) : le lien entre le lecteur et LE lieu qu'il examine.
//
// Quatre objets ne se confondent pas (spec 2026-09-25, décision 3 de FUT-25) :
//   - le PROJET dit ce que la personne cherche, durablement (`user_profiles.user_project`) ; son
//     objectif dit POURQUOI elle utilise futur•e (« j'y habite déjà » en est un) ;
//   - la RECHERCHE est l'exploration jetable de « Où vivre » ;
//   - la RELATION AU LIEU dit son lien avec CE lieu-ci : une par commune, une par adresse ;
//   - la CAPACITÉ dit ce que futur•e sait trancher.
//
// LE DÉFAUT CORRIGÉ. Faute de relation lisible, le moteur réglait le ton sur l'OBJECTIF du projet :
// quelqu'un qui avait coché « j'y habite déjà » recevait le registre d'un habitant (« À connaître et à
// surveiller », les gestes de qui occupe le logement) sur N'IMPORTE QUEL lieu examiné, y compris une
// adresse étudiée dans une autre ville. Et la relation à l'adresse (`address_dossiers.posture`) valait
// « résidence » en dur, écrite à chaque ouverture, lue par personne.
//
// LA RÈGLE : seule une relation CONNUE fait parler à un habitant. L'absence d'information ne devient
// jamais « j'habite ici » ; elle donne une voix neutre, ou celle de l'intention déclarée.
//
// Pur, sans `server-only` : lu par le moteur, les pages et les tests.
// ════════════════════════════════════════════════════════════════════════════════════════════

/**
 * La relation à une COMMUNE, telle que `report_context` la range depuis la migration 16 :
 * j'y vis / j'envisage d'y vivre / je la découvre / inconnue.
 */
export type CommuneRelation = "current_residence" | "considering_living" | "information_only" | "unknown";

/** D'où vient la relation à une commune : DÉDUITE (de la commune de résidence déclarée) ou CONFIRMÉE. */
export type CommuneRelationSource = "inferred" | "confirmed_by_user";

/**
 * La relation à une ADRESSE (un bien précis), toujours DÉCLARÉE par la personne :
 *   - `lives_here` : j'y habite (locataire ou propriétaire occupant) ;
 *   - `studying`   : j'étudie ce bien, je le visite, j'envisage d'y vivre.
 *
 * Aucune n'est déduite : ni la commune de résidence (on peut acheter un second logement dans sa
 * ville), ni l'ancienne `posture` (écrite « résidence » en dur). Sans déclaration, elle est inconnue.
 *
 * « J'en suis propriétaire » (bailleur, sans y vivre), que la spec mentionne, n'est pas un état :
 * aucun consommateur ne le distingue aujourd'hui, et un propriétaire occupant est `lives_here`.
 */
export type AddressRelation = "lives_here" | "studying";

export const ADDRESS_RELATIONS: readonly AddressRelation[] = ["lives_here", "studying"];

export function isAddressRelation(v: unknown): v is AddressRelation {
  return typeof v === "string" && (ADDRESS_RELATIONS as readonly string[]).includes(v);
}

/**
 * L'OBJECTIF DE L'ANALYSE DE CE BIEN (FUT-10) : pourquoi la personne ouvre CE dossier. Distinct de la
 * relation (son lien effectif avec le bien) et de l'intention du projet (ce qu'elle cherche partout) :
 *   - `buy`        : je souhaite l'acheter ;
 *   - `rent`       : je souhaite le louer ;
 *   - `understand` : je souhaite mieux connaître le logement où je vis (la réponse porte sa propre
 *                    déclaration : elle donne la voix d'un habitant sans écrire de relation) ;
 *   - `other`      : je l'examine pour une autre raison. Ce n'est pas une absence : la personne dit
 *                    qu'elle n'est ni en train d'acheter ni de louer CE bien, ce qui neutralise
 *                    l'intention globale pour lui (un bailleur qui examine le logement qu'il loue).
 *
 * Toujours DÉCLARÉ, jamais déduit (ni de l'intention globale, ni de la relation). `null` = non dit, et
 * l'ordre de FUT-26 s'applique alors sans changement. Il ne vaut que pour ce dossier : il n'est jamais
 * recopié dans le projet, donc jamais propagé à un autre bien.
 */
export type AddressObjective = "buy" | "rent" | "understand" | "other";

export const ADDRESS_OBJECTIVES: readonly AddressObjective[] = ["buy", "rent", "understand", "other"];

export function isAddressObjective(v: unknown): v is AddressObjective {
  return typeof v === "string" && (ADDRESS_OBJECTIVES as readonly string[]).includes(v);
}

/**
 * La relation du lecteur au lieu ÉVALUÉ, à l'échelle de ce lieu. `null` partout = inconnue.
 * À l'adresse, `objectif` (FUT-10) accompagne la relation : optionnel, absent = non dit.
 */
export type RelationAuLieu =
  | { echelle: "commune"; relation: CommuneRelation; origine: CommuneRelationSource }
  | { echelle: "adresse"; relation: AddressRelation | null; objectif?: AddressObjective | null };

/**
 * La relation à l'adresse d'un dossier, lue sur sa ligne. Une valeur hors liste vaut inconnue.
 * L'objectif (`place_objective`, FUT-10) est lu de la même façon ; une base sans la colonne le rend inconnu.
 */
export function relationDeLAdresse(row: { place_relation?: unknown; place_objective?: unknown } | null | undefined): RelationAuLieu {
  const r = row?.place_relation;
  const o = row?.place_objective;
  return { echelle: "adresse", relation: isAddressRelation(r) ? r : null, objectif: isAddressObjective(o) ? o : null };
}

/** L'objectif déclaré pour le bien évalué, ou `null` (non dit, ou lieu évalué à l'échelle commune). */
export function objectifDeLAnalyse(r: RelationAuLieu | null | undefined): AddressObjective | null {
  return r?.echelle === "adresse" && isAddressObjective(r.objectif) ? r.objectif : null;
}

/** La relation à une commune, depuis la relation EFFECTIVE de `resolveRelation` (report-context). */
export function relationDeLaCommune(r: { relation: CommuneRelation; source: CommuneRelationSource }): RelationAuLieu {
  return { echelle: "commune", relation: r.relation, origine: r.source };
}

/** Le lecteur habite-t-il le lieu évalué ? Vrai seulement sur une relation CONNUE qui le dit. */
export function habiteLeLieu(r: RelationAuLieu | null | undefined): boolean {
  if (!r) return false;
  return r.echelle === "commune" ? r.relation === "current_residence" : r.relation === "lives_here";
}

/** Le lecteur envisage-t-il de vivre dans le lieu évalué (ou étudie-t-il ce bien) ? */
export function envisageLeLieu(r: RelationAuLieu | null | undefined): boolean {
  if (!r) return false;
  return r.echelle === "commune" ? r.relation === "considering_living" : r.relation === "studying";
}

/**
 * LA VOIX DU DOSSIER, pour ce lecteur et ce lieu :
 *   - `engagement` : il s'apprête à acheter ou louer, ou envisage ce lieu → « avant de vous engager » ;
 *   - `habitant`   : il y vit (relation connue) → « à connaître et à surveiller » ;
 *   - `neutre`     : on ne sait pas → ni l'un ni l'autre n'est supposé.
 *
 * L'ORDRE, DU PLUS SPÉCIFIQUE AU PLUS GÉNÉRAL (décisions du porteur, 11/10/2026) :
 *   1. « j'y habite » DÉCLARÉ À L'ADRESSE prime sur l'intention GLOBALE du projet. Une intention
 *      d'acheter à Nantes ne fait pas parler du logement occupé à La Rochelle comme d'un bien à acheter ;
 *   2. l'intention (achat, location) : elle vaut pour tout lieu dont on ne sait rien de plus précis, et
 *      prime sur la résidence COMMUNALE (on achète souvent dans sa propre ville) ;
 *   3. la résidence communale, déclarée ou DÉDUITE de la commune de résidence que la personne a
 *      elle-même renseignée : une déduction solide, qui garde la voix d'habitant ;
 *   4. « j'envisage d'y vivre » : CONFIRMÉE seulement. Déduite, elle ne dit que « ce n'est pas votre
 *      commune » : quelqu'un qui consulte une commune pour s'informer n'est pas en train de s'engager ;
 *      « j'étudie ce bien », toujours déclaré, compte aussi ;
 *   5. sinon, neutre.
 *
 * 0. (FUT-10) AVANT TOUT CELA, l'objectif DÉCLARÉ pour ce bien (`voixDeLObjectif`). Le locataire qui
 *    ACHÈTE le logement qu'il occupe déclare « j'y habite » ET « je souhaite l'acheter » : deux
 *    informations, et il reçoit la voix d'un acheteur sans renoncer à la première. Sans objectif
 *    déclaré, l'ordre 1 à 5 s'applique exactement comme à FUT-26.
 */
export type Voix = "engagement" | "habitant" | "neutre";

/** « J'y habite », déclaré à l'ADRESSE : la seule relation qui prime sur l'intention globale. */
function habiteCeBien(r: RelationAuLieu | null | undefined): boolean {
  return r?.echelle === "adresse" && r.relation === "lives_here";
}

/** Une relation qui dit l'engagement : « j'étudie ce bien », ou « j'envisage d'y vivre » CONFIRMÉE. */
function envisageDeclare(r: RelationAuLieu | null | undefined): boolean {
  if (!r) return false;
  return r.echelle === "adresse" ? r.relation === "studying" : r.relation === "considering_living" && r.origine === "confirmed_by_user";
}

export function voixDuLecteur(intent: string | null | undefined, r: RelationAuLieu | null | undefined): Voix {
  // FUT-10 : l'objectif DÉCLARÉ pour ce bien passe avant tout le reste, sans effacer la relation.
  const parObjectif = voixDeLObjectif(r);
  if (parObjectif) return parObjectif;
  if (habiteCeBien(r)) return "habitant";
  if (intent === "achat" || intent === "location") return "engagement";
  if (habiteLeLieu(r)) return "habitant";
  if (envisageDeclare(r)) return "engagement";
  return "neutre";
}

/** « J'y habite » déclaré à l'adresse prime-t-il sur l'intention globale ? Partagé avec les gestes. */
export const habiteCeBienDeclare = habiteCeBien;

/**
 * LA VOIX QUE DONNE L'OBJECTIF DE L'ANALYSE (FUT-10), ou `null` quand aucun objectif n'est déclaré.
 *
 * L'objectif dit ce que la personne veut faire de CE bien ; il prime donc sur l'intention globale ET sur
 * la relation, sans les effacer : le locataire qui achète le logement qu'il occupe garde `lives_here`
 * et reçoit la voix d'un acheteur (la limite laissée par FUT-26 est levée ici).
 *
 *   - `buy`, `rent`  → engagement, quelle que soit la relation ;
 *   - `understand`   → habitant (la réponse dit « le logement où je vis »), SAUF si la personne a aussi
 *                      déclaré étudier ce bien : les deux réponses se contredisent, on ne suppose rien ;
 *   - `other`        → habitant si elle y habite, sinon neutre : ni l'intention d'acheter ailleurs, ni
 *                      « j'étudie ce bien » ne font d'une autre raison un engagement.
 */
function voixDeLObjectif(r: RelationAuLieu | null | undefined): Voix | null {
  const o = objectifDeLAnalyse(r);
  if (!o) return null;
  const relation = r?.echelle === "adresse" ? r.relation : null;
  if (o === "buy" || o === "rent") return "engagement";
  if (o === "understand") return relation === "studying" ? "neutre" : "habitant";
  return relation === "lives_here" ? "habitant" : "neutre";
}

/**
 * LE CONTEXTE DU BIEN, tel qu'un artefact le fige (FUT-10) : la relation et l'objectif qu'il a lus.
 * Il permet de dire, après coup, que la version affichée repose sur un contexte antérieur.
 */
export type ContexteDuBien = { relation: AddressRelation | null; objectif: AddressObjective | null };

/** Le contexte à figer, depuis la relation évaluée. `null` hors échelle adresse : rien à figer. */
export function contexteDuBien(r: RelationAuLieu | null | undefined): ContexteDuBien | null {
  if (r?.echelle !== "adresse") return null;
  return { relation: isAddressRelation(r.relation) ? r.relation : null, objectif: objectifDeLAnalyse(r) };
}

/**
 * LE CONTEXTE DU BIEN A-T-IL CHANGÉ *POUR LA DÉCISION* depuis la version figée ?
 *
 * Même doctrine que `projetAChangeMateriellement` : on compare ce que le moteur en FAIT, pas les
 * valeurs. Deux contextes qui donnent la même voix ET les mêmes gestes concluent pareil ; signaler leur
 * différence dérangerait le lecteur pour rien. `posture` n'entre pas ici : elle vient du projet.
 *
 * `false` sans contexte figé (artefacts antérieurs à FUT-10) : sans point de comparaison, rien à affirmer.
 * Le calcul des gestes est injecté (`bucket`) pour ne pas faire dépendre ce module pur du moteur.
 */
export function contexteAChangeMateriellement(
  fige: ContexteDuBien | null | undefined,
  actuel: RelationAuLieu | null | undefined,
  intent: string | null | undefined,
  bucket: (p: { intent?: string | null }, r: RelationAuLieu | null) => string,
): boolean {
  if (!fige) return false;
  const avant: RelationAuLieu = { echelle: "adresse", relation: fige.relation ?? null, objectif: fige.objectif ?? null };
  const maintenant: RelationAuLieu = actuel?.echelle === "adresse"
    ? actuel
    : { echelle: "adresse", relation: null, objectif: null };
  return voixDuLecteur(intent, avant) !== voixDuLecteur(intent, maintenant)
    || bucket({ intent }, avant) !== bucket({ intent }, maintenant);
}

/**
 * LA MODIFICATION EXPLICITE d'une relation à l'adresse, traduite en colonnes. `null` en entrée efface
 * (la relation redevient inconnue) ; toute autre valeur hors liste est refusée (`null` en sortie).
 * La date n'est posée que sur une déclaration : effacer remet aussi la date à `null`.
 */
export function patchRelationAdresse(
  relation: unknown,
  now: Date,
): { place_relation: AddressRelation | null; place_relation_set_at: string | null } | null {
  if (relation === null) return { place_relation: null, place_relation_set_at: null };
  if (!isAddressRelation(relation)) return null;
  return { place_relation: relation, place_relation_set_at: now.toISOString() };
}

/**
 * LA MODIFICATION EXPLICITE de l'objectif de l'analyse (FUT-10), même contrat que la relation : `null`
 * efface (redevient non dit, date comprise), une valeur hors liste est refusée.
 */
export function patchObjectifAdresse(
  objectif: unknown,
  now: Date,
): { place_objective: AddressObjective | null; place_objective_set_at: string | null } | null {
  if (objectif === null) return { place_objective: null, place_objective_set_at: null };
  if (!isAddressObjective(objectif)) return null;
  return { place_objective: objectif, place_objective_set_at: now.toISOString() };
}

/** Les colonnes qu'une déclaration au bien peut écrire. Rien d'autre : ni le projet, ni le droit. */
export type PatchContexteAdresse = Partial<{
  place_relation: AddressRelation | null;
  place_relation_set_at: string | null;
  place_objective: AddressObjective | null;
  place_objective_set_at: string | null;
}>;

/**
 * L'ENREGISTREMENT D'UNE DÉCLARATION AU BIEN, dépendances injectées (route `PATCH /api/dossier/relation`).
 *
 * Corps : `{ dossierId, relation?, objectif? }`. PATCH PARTIEL (FUT-10) : seule une clé PRÉSENTE est
 * écrite. Changer l'objectif ne touche pas la relation, et inversement ; une clé absente n'efface rien.
 * Un corps sans aucune des deux clés est refusé (il n'y a rien à enregistrer).
 *
 * Extrait de la route pour être testé sans base : `lireDossier` rend le dossier SEULEMENT s'il
 * appartient au lecteur et n'est pas révoqué (en vrai : `getDossier`, sous RLS) ; `ecrire` rend
 * `null` sur un refus (en vrai : `updateOwnedAddressDossier`, filtré par utilisateur et révocation).
 * Ces tests vérifient NOTRE logique ; ils ne remplacent pas un test des politiques Supabase (RLS).
 *
 * Rien d'autre n'est écrit que la ligne du dossier : aucune dépendance ne permet de toucher au projet.
 * Aucune génération n'est déclenchée : un dossier figé signale l'écart et propose la mise à jour.
 */
export async function enregistrerRelationAdresse(
  body: unknown,
  deps: {
    now: Date;
    lireDossier: (dossierId: string) => Promise<{ id: string } | null>;
    ecrire: (dossierId: string, patch: PatchContexteAdresse) => Promise<{ place_relation?: unknown; place_objective?: unknown } | null>;
  },
): Promise<{ status: 200 | 400 | 403; body: Record<string, unknown> }> {
  const b = (body && typeof body === "object" ? body : {}) as { dossierId?: unknown; relation?: unknown; objectif?: unknown };
  const dossierId = typeof b.dossierId === "string" && b.dossierId.length > 0 ? b.dossierId : null;
  if (!dossierId) return { status: 400, body: { error: "dossierId requis" } };
  const aRelation = "relation" in b;
  const aObjectif = "objectif" in b;
  if (!aRelation && !aObjectif) return { status: 400, body: { error: "relation invalide" } };
  const patch: PatchContexteAdresse = {};
  if (aRelation) {
    const r = patchRelationAdresse(b.relation, deps.now);
    if (!r) return { status: 400, body: { error: "relation invalide" } };
    Object.assign(patch, r);
  }
  if (aObjectif) {
    const o = patchObjectifAdresse(b.objectif, deps.now);
    if (!o) return { status: 400, body: { error: "objectif invalide" } };
    Object.assign(patch, o);
  }
  const dossier = await deps.lireDossier(dossierId);
  if (!dossier) return { status: 403, body: { error: "DOSSIER_NOT_ACCESSIBLE" } };
  const ecrit = await deps.ecrire(dossier.id, patch);
  if (!ecrit) return { status: 403, body: { error: "DOSSIER_NOT_ACCESSIBLE" } };
  return {
    status: 200,
    body: {
      ok: true,
      relation: isAddressRelation(ecrit.place_relation) ? ecrit.place_relation : null,
      objectif: isAddressObjective(ecrit.place_objective) ? ecrit.place_objective : null,
    },
  };
}
