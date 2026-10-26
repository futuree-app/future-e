import { requireCurrentUser } from "@/lib/user-account";
import {
  buildDpeSelectionFields,
  getDossier,
  type DpeSelectionStatus,
} from "@/lib/address-dossier-store";
import { updateOwnedAddressDossier, updateOwnedAddressDossierSi } from "@/lib/server/address-dossier-write";
import { findDpeByNumero, getDpeCandidatesByBanId, lookupDpeCandidatesByBanId } from "@/lib/dpe";
import { normaliserNumeroDpe, rapprocherAvecBatiment } from "@/lib/dpe-rapprochement";
import { lookupBatimentByBanId } from "@/lib/rnb";
import { refusDAttribution } from "@/lib/dpe-grain";
import { CONDITION_ECRITURE_AUTO, controlerAttributionAuto, estVierge } from "@/lib/dpe-attribution-auto";
import { lireDerniereVersion } from "@/lib/server/logement-report-versions";
import type { AddressDossierRow } from "@/lib/address-dossier-store";
import type { DpeRecord } from "@/lib/dpe-attribution";

export const dynamic = "force-dynamic";

/**
 * LE CLIENT DÉSIGNE, IL NE DÉCRIT PAS (19/08/2026).
 *
 * Le corps portait le `DpeRecord` entier, et la route n'en vérifiait que l'identifiant avant de
 * persister le reste tel quel. Une étiquette, une surface ou une consommation modifiées dans le
 * navigateur partaient donc en base sous un numéro parfaitement valide, et figeaient un rapport
 * payant dont la classe, les coûts et les échéances découlent. Le client envoie désormais le seul
 * numéro ; la fiche est relue à la source et figée telle que l'ADEME la rend.
 */
type Body = {
  dossierId: string;
  status: DpeSelectionStatus;
  dpeId?: string | null;
  /**
   * D'OÙ VIENT LE DIAGNOSTIC DÉSIGNÉ, et donc comment le vérifier.
   *
   * `liste` (le défaut) : une ligne de la liste de l'adresse, vérifiée par appartenance.
   * `numero` : un numéro lu sur un document, vérifié par `rapprocher`, qui autorise l'entrée
   * voisine du même bâtiment et refuse tout le reste. FUT-80 : c'est aussi la voie des diagnostics
   * « du même bâtiment, à une autre adresse », que l'écran propose à part : ils ne sont pas dans la
   * liste de l'adresse, et l'identifiant RNB qui les relie est vérifié ici. Sans cette distinction, la vérification par
   * appartenance rejetterait le seul cas que la saisie du numéro existe pour servir.
   */
  source?: "liste" | "numero";
};

/**
 * `pending` EST UN STATUT QU'ON PEUT ÉCRIRE, et c'est ce qui rend un choix réversible. Il manquait :
 * l'écran offrait bien un « ce n'est pas le bon diagnostic », mais il ne remettait que l'état du
 * navigateur, si bien que le mauvais diagnostic revenait au rechargement suivant. Un clic ne peut
 * pas devenir irréversible dans un dossier payé.
 */
const ALLOWED: DpeSelectionStatus[] = [
  "auto_confirmed", "user_confirmed", "not_in_list", "not_found", "pending",
];

/** Les deux seuls statuts qui figent un diagnostic. Les autres en exigent l'absence. */
const PORTE_UN_DPE: DpeSelectionStatus[] = ["auto_confirmed", "user_confirmed"];

// Persiste le choix DPE dans le dossier. Mise à jour CIBLÉE des seules colonnes DPE : ne touche ni
// au snapshot ni à l'identité de l'adresse.
//
// Le droit n'est plus un flag de plan doublé d'une commune : c'est le DOSSIER lui-même. Le helper
// vérifie la propriété et la non-révocation, et un null de sa part est un refus explicite. L'ancien
// no-op silencieux quand la ligne manquait disparaît : le choix de diagnostic structure un rapport
// payant, le perdre sans rien dire n'est pas acceptable.
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body?.dossierId || !body.status || !ALLOWED.includes(body.status)) {
    return Response.json({ error: "dossierId/status requis" }, { status: 400 });
  }

  const porteUnDpe = PORTE_UN_DPE.includes(body.status);
  const dpeId = typeof body.dpeId === "string" ? body.dpeId.trim() : "";
  // Le statut et sa pièce doivent se répondre. Un `not_in_list` accompagné d'un numéro, ou un
  // `user_confirmed` sans numéro, décrit un état que la table ne peut pas représenter.
  if (porteUnDpe !== Boolean(dpeId)) {
    return Response.json({ error: "STATUT_ET_DIAGNOSTIC_INCOHERENTS" }, { status: 400 });
  }

  const { supabase, user } = await requireCurrentUser();

  const dossier = await getDossier(supabase, user.id, body.dossierId);
  if (!dossier) {
    return Response.json({ error: "DOSSIER_NOT_ACCESSIBLE" }, { status: 403 });
  }

  // UNE ATTRIBUTION AUTOMATIQUE NE VIENT QUE DE LA LISTE DE L'ADRESSE (revue indépendante du 26/10/2026).
  // Un diagnostic apporté par son numéro, ou trouvé à une autre entrée du même bâtiment, est toujours à
  // confirmer : l'écrire `auto_confirmed` donnait à un candidat lointain le statut d'une convergence forte.
  if (body.status === "auto_confirmed" && body.source === "numero") {
    return Response.json({ error: "AUTO_HORS_LISTE" }, { status: 422 });
  }
  if (body.status === "auto_confirmed") {
    return attribuerAutomatiquement(user.id, supabase, dossier, dpeId);
  }

  // Le diagnostic n'est JAMAIS accepté sur parole. Sans ce contrôle, n'importe quel identifiant de
  // DPE, y compris celui d'un autre bâtiment, pourrait être figé dans un dossier payant : la
  // classe, la surface, les coûts et les échéances du rapport en découlent.
  //
  // C'est la fiche RENDUE PAR L'ADEME qui est figée, jamais celle que le navigateur a envoyée.
  let dpe = null;
  if (porteUnDpe && body.source === "numero") {
    // LA RECHERCHE EST REFAITE ICI. Le navigateur a déjà interrogé `/numero` pour montrer la fiche
    // au lecteur, mais ce qu'il a vu ne prouve rien de ce qu'il envoie : la seule fiche qui entre
    // dans le dossier est celle que ce serveur vient de lire.
    const numero = normaliserNumeroDpe(dpeId);
    const trouve = numero ? await findDpeByNumero(numero) : { status: "introuvable" as const };
    if (trouve.status === "indisponible") {
      return Response.json({ error: "SOURCE_INDISPONIBLE" }, { status: 503 });
    }
    if (trouve.status !== "trouve") {
      return Response.json({ error: "DPE_INTROUVABLE" }, { status: 422 });
    }
    // FUT-80 : même vérification que `/numero`, par la même fonction. Le bâtiment est RELU ICI, au
    // référentiel : ce que le navigateur a montré ne prouve rien de ce qu'il envoie. Un diagnostic que le
    // bâtiment contredit reste rattachable à la main (`contredit`, confirmé à l'écran avec la mention),
    // jamais automatiquement (ci-dessus).
    const rapprochement = await rapprocherAvecBatiment(
      { id_ban: trouve.dpe.id_ban, adresse: trouve.dpe.adresse, id_rnb: trouve.dpe.id_rnb },
      { ban_id: dossier.ban_id, address_label: dossier.address_label, insee: dossier.insee },
      lookupBatimentByBanId,
    );
    if (!rapprochement.attachable) {
      return Response.json(
        { error: "DPE_NOT_AT_ADDRESS", niveau: rapprochement.niveau },
        { status: 422 },
      );
    }
    dpe = trouve.dpe;
  } else if (porteUnDpe) {
    const candidates = await getDpeCandidatesByBanId(dossier.ban_id);
    dpe = candidates.find((c) => c.id_dpe === dpeId) ?? null;
    if (!dpe) {
      return Response.json({ error: "DPE_NOT_AT_ADDRESS" }, { status: 422 });
    }
  }

  // SEUL UN DIAGNOSTIC DE LOGEMENT DEVIENT CELUI DU LOGEMENT (FUT-74). Le contrôle porte sur la fiche
  // relue à la source, quelle que soit sa provenance : la liste de l'adresse ne propose plus le DPE de
  // l'immeuble, et la saisie par numéro ne le rattache pas, mais le serveur ne présume ni de l'un ni de
  // l'autre. Un DPE d'immeuble retenu donnait sa classe au logement jusque dans le moteur ; un grain
  // indéterminé n'est la preuve de rien.
  const refus = refusDAttribution(dpe);
  if (refus) return Response.json(refus, { status: 422 });

  // UN GESTE EXPLICITE S'ÉCRIT SANS CONDITION : c'est le plus récent qui vaut, et une attribution
  // automatique encore en vol ne pourra plus l'écraser (sa propre écriture exige une ligne vierge).
  const fields = buildDpeSelectionFields(body.status, dpe, new Date().toISOString());
  const updated = await updateOwnedAddressDossier(user.id, body.dossierId, fields);

  if (!updated) {
    return Response.json({ error: "DOSSIER_NOT_ACCESSIBLE" }, { status: 403 });
  }

  // La fiche canonique revient au client : c'est elle qui est en base, et l'écran doit afficher ce
  // qui a été enregistré, pas ce qu'il avait sous la main avant l'appel.
  return Response.json({ ok: true, dpe: updated.selected_dpe_snapshot });
}

/**
 * L'ATTRIBUTION AUTOMATIQUE, DÉCIDÉE ET ÉCRITE PAR LE SERVEUR (revue indépendante du 26/10/2026).
 *
 * Le navigateur PROPOSE ; le serveur relit tout et refait la décision avec la règle de l'écran
 * (`controlerAttributionAuto`) :
 *   - la liste ADEME de l'adresse, complète (les deux jeux ont répondu) et non tronquée ;
 *   - l'identité du bâtiment, relue au référentiel : une panne n'est pas une absence de contradiction,
 *     et elle refuse ; plusieurs bâtiments, aucun bâtiment existant, un bâtiment en ruine ou un
 *     diagnostic qui en désigne un autre refusent aussi ;
 *   - le type d'adresse que la version du rapport a enregistré (le navigateur ne le décrit pas).
 * Puis il écrit SOUS CONDITION : la ligne doit être encore vierge de tout geste au moment même de
 * l'UPDATE. Un refus, un retrait ou un choix arrivés pendant les lectures gagnent toujours.
 */
async function attribuerAutomatiquement(
  userId: string,
  supabase: Parameters<typeof getDossier>[0],
  dossier: AddressDossierRow,
  dpeId: string,
): Promise<Response> {
  const dejaFait = (row: AddressDossierRow) =>
    row.dpe_selection_status === "auto_confirmed" && row.selected_dpe_id === dpeId;
  // Une proposition envoyée deux fois (double effet, onglet rechargé) n'est pas une erreur : la ligne
  // porte déjà exactement ce choix, rien n'est réécrit.
  if (!estVierge(dossier)) {
    return dejaFait(dossier)
      ? Response.json({ ok: true, dpe: dossier.selected_dpe_snapshot })
      : Response.json({ error: "DECISION_DEJA_PRISE" }, { status: 409 });
  }

  const [liste, identite, version] = await Promise.all([
    lookupDpeCandidatesByBanId(dossier.ban_id).catch(() => ({ status: "unavailable" as const, candidates: [] as DpeRecord[], tronque: false })),
    lookupBatimentByBanId(dossier.ban_id),
    lireDerniereVersion(supabase, dossier.id),
  ]);
  const controle = controlerAttributionAuto({
    dpeId,
    row: dossier,
    candidates: liste.candidates,
    listeComplete: liste.status !== "unavailable" && !liste.tronque,
    banFeatureType: version?.report.banFeatureType ?? null,
    identite,
  });
  if (!controle.ok) {
    return Response.json(
      { error: "AUTO_NON_ADMISSIBLE", refus: controle.refus, ...(controle.veto ? { veto: controle.veto } : {}) },
      { status: 422 },
    );
  }
  // Défense en profondeur : la règle l'exige déjà (`attribuableAuLogement`).
  const refus = refusDAttribution(controle.dpe);
  if (refus) return Response.json(refus, { status: 422 });

  const fields = buildDpeSelectionFields("auto_confirmed", controle.dpe, new Date().toISOString());
  const ecrit = await updateOwnedAddressDossierSi(userId, dossier.id, fields, CONDITION_ECRITURE_AUTO);
  if (ecrit === null) return Response.json({ error: "DOSSIER_NOT_ACCESSIBLE" }, { status: 403 });
  if (ecrit === "etat_change") {
    const actuel = await getDossier(supabase, userId, dossier.id);
    if (actuel && dejaFait(actuel)) return Response.json({ ok: true, dpe: actuel.selected_dpe_snapshot });
    return Response.json({ error: "DECISION_PLUS_RECENTE" }, { status: 409 });
  }
  return Response.json({ ok: true, dpe: ecrit.selected_dpe_snapshot });
}
