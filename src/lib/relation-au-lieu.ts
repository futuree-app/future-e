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

/** La relation du lecteur au lieu ÉVALUÉ, à l'échelle de ce lieu. `null` partout = inconnue. */
export type RelationAuLieu =
  | { echelle: "commune"; relation: CommuneRelation; origine: CommuneRelationSource }
  | { echelle: "adresse"; relation: AddressRelation | null };

/** La relation à l'adresse d'un dossier, lue sur sa ligne. Une valeur hors liste vaut inconnue. */
export function relationDeLAdresse(row: { place_relation?: unknown } | null | undefined): RelationAuLieu {
  const r = row?.place_relation;
  return { echelle: "adresse", relation: isAddressRelation(r) ? r : null };
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
 * LIMITE CONNUE, laissée à FUT-10 : le locataire qui ACHÈTE le logement qu'il occupe et déclare
 * « j'y habite » reçoit la voix d'un habitant, pas celle d'un acheteur. Il habite ET envisage
 * d'acheter : ce sont deux informations, la relation effective au bien et l'objectif de l'analyse de
 * ce bien, et seule la première existe aujourd'hui. Une intention propre à l'adresse pourra primer sur
 * l'intention globale sans effacer le fait qu'il y habite.
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
  if (habiteCeBien(r)) return "habitant";
  if (intent === "achat" || intent === "location") return "engagement";
  if (habiteLeLieu(r)) return "habitant";
  if (envisageDeclare(r)) return "engagement";
  return "neutre";
}

/** « J'y habite » déclaré à l'adresse prime-t-il sur l'intention globale ? Partagé avec les gestes. */
export const habiteCeBienDeclare = habiteCeBien;

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
 * L'ENREGISTREMENT D'UNE RELATION À L'ADRESSE, dépendances injectées (route `PATCH /api/dossier/relation`).
 *
 * Extrait de la route pour être testé sans base : `lireDossier` rend le dossier SEULEMENT s'il
 * appartient au lecteur et n'est pas révoqué (en vrai : `getDossier`, sous RLS) ; `ecrire` rend
 * `null` sur un refus (en vrai : `updateOwnedAddressDossier`, filtré par utilisateur et révocation).
 * Ces tests vérifient NOTRE logique ; ils ne remplacent pas un test des politiques Supabase (RLS).
 *
 * Rien d'autre n'est écrit que la ligne du dossier : aucune dépendance ne permet de toucher au projet.
 */
export async function enregistrerRelationAdresse(
  body: unknown,
  deps: {
    now: Date;
    lireDossier: (dossierId: string) => Promise<{ id: string } | null>;
    ecrire: (dossierId: string, patch: { place_relation: AddressRelation | null; place_relation_set_at: string | null }) => Promise<{ place_relation?: unknown } | null>;
  },
): Promise<{ status: 200 | 400 | 403; body: Record<string, unknown> }> {
  const b = (body ?? {}) as { dossierId?: unknown; relation?: unknown };
  const dossierId = typeof b.dossierId === "string" && b.dossierId.length > 0 ? b.dossierId : null;
  if (!dossierId) return { status: 400, body: { error: "dossierId requis" } };
  const patch = patchRelationAdresse(b.relation, deps.now);
  if (!patch) return { status: 400, body: { error: "relation invalide" } };
  const dossier = await deps.lireDossier(dossierId);
  if (!dossier) return { status: 403, body: { error: "DOSSIER_NOT_ACCESSIBLE" } };
  const ecrit = await deps.ecrire(dossier.id, patch);
  if (!ecrit) return { status: 403, body: { error: "DOSSIER_NOT_ACCESSIBLE" } };
  return { status: 200, body: { ok: true, relation: isAddressRelation(ecrit.place_relation) ? ecrit.place_relation : null } };
}
