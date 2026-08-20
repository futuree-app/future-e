import { requireCurrentUser } from "@/lib/user-account";
import { getDossier } from "@/lib/address-dossier-store";
import { findDpeByNumero } from "@/lib/dpe";
import { normaliserNumeroDpe, rapprocher } from "@/lib/dpe-rapprochement";

export const dynamic = "force-dynamic";

/**
 * ════════════════════════════════════════════════════════════════════════════════════════════
 * CHERCHER LE DIAGNOSTIC DONT LE LECTEUR TIENT LE NUMÉRO.
 *
 * Cette route ne RATTACHE rien. Elle cherche, elle rapproche, elle rend ce qu'elle a trouvé avec
 * l'adresse enregistrée à l'ADEME, et l'écran demande alors une confirmation. Le rattachement passe
 * par `/api/logement-dpe`, comme toute autre désignation, avec le geste humain qui la déclenche.
 *
 * Séparer les deux tient à une raison simple : montrer avant d'écrire. Une route qui chercherait et
 * rattacherait d'un coup ferait entrer dans un dossier payant un diagnostic que personne n'a vu.
 * ════════════════════════════════════════════════════════════════════════════════════════════
 */
type Body = { dossierId: string; numero: string };

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Body | null;
  if (!body?.dossierId || typeof body.numero !== "string") {
    return Response.json({ error: "dossierId/numero requis" }, { status: 400 });
  }

  // La forme est vérifiée AVANT l'appel réseau : une saisie qui n'a pas la taille d'un numéro ne
  // mérite pas trois requêtes à l'ADEME, et le lecteur mérite une réponse immédiate.
  const numero = normaliserNumeroDpe(body.numero);
  if (!numero) {
    return Response.json({ status: "forme_invalide" });
  }

  const { supabase, user } = await requireCurrentUser();
  const dossier = await getDossier(supabase, user.id, body.dossierId);
  if (!dossier) {
    return Response.json({ error: "DOSSIER_NOT_ACCESSIBLE" }, { status: 403 });
  }

  const trouve = await findDpeByNumero(numero);

  // Une source en panne ne se présente jamais comme une absence : le lecteur retenterait sa saisie
  // en cherchant une faute de frappe qui n'existe pas.
  if (trouve.status === "indisponible") {
    return Response.json({ status: "indisponible" });
  }
  if (trouve.status === "introuvable") {
    return Response.json({ status: "introuvable" });
  }
  // Retrouvé dans le jeu d'avant juillet 2021 : le document existe, et il a expiré au plus tard le
  // 31/12/2024. Le dire vaut mieux que « ce numéro n'existe pas », qui serait faux, et mieux que
  // l'attribuer, qui donnerait pour actuelle une étiquette qui ne l'est plus.
  if (trouve.status === "expire") {
    return Response.json({ status: "expire", date: trouve.date, adresse: trouve.adresse });
  }

  const rapprochement = rapprocher(
    { id_ban: trouve.dpe.id_ban, adresse: trouve.dpe.adresse },
    { ban_id: dossier.ban_id, address_label: dossier.address_label, insee: dossier.insee },
  );

  return Response.json({
    status: "trouve",
    niveau: rapprochement.niveau,
    attachable: rapprochement.attachable,
    confirmationRequise: rapprochement.confirmationRequise,
    // L'ADRESSE ENREGISTRÉE À L'ADEME VOYAGE AVEC LE DIAGNOSTIC, toujours, y compris quand elle
    // coïncide avec celle du dossier. C'est elle qui permet au lecteur de voir qu'il s'est trompé
    // de numéro, et c'est la seule chose qu'on puisse lui montrer pour qu'il tranche lui-même.
    adresse: trouve.dpe.adresse,
    dpe: trouve.dpe,
  });
}
