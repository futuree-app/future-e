import { requireCurrentUser } from "@/lib/user-account";
import {
  buildDpeSelectionFields,
  getDossier,
  type DpeSelectionStatus,
} from "@/lib/address-dossier-store";
import { updateOwnedAddressDossier } from "@/lib/server/address-dossier-write";
import { findDpeByNumero, getDpeCandidatesByBanId } from "@/lib/dpe";
import { normaliserNumeroDpe, rapprocher } from "@/lib/dpe-rapprochement";

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
   * voisine du même bâtiment et refuse tout le reste. Sans cette distinction, la vérification par
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
    const rapprochement = rapprocher(
      { id_ban: trouve.dpe.id_ban, adresse: trouve.dpe.adresse },
      { ban_id: dossier.ban_id, address_label: dossier.address_label, insee: dossier.insee },
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

  const fields = buildDpeSelectionFields(body.status, dpe, new Date().toISOString());
  const updated = await updateOwnedAddressDossier(user.id, body.dossierId, fields);

  if (!updated) {
    return Response.json({ error: "DOSSIER_NOT_ACCESSIBLE" }, { status: 403 });
  }

  // La fiche canonique revient au client : c'est elle qui est en base, et l'écran doit afficher ce
  // qui a été enregistré, pas ce qu'il avait sous la main avant l'appel.
  return Response.json({ ok: true, dpe: updated.selected_dpe_snapshot });
}
