import "server-only";
import { createClient } from "@supabase/supabase-js";
import { requireCurrentUser } from "@/lib/user-account";
import { isAdminDossierCreator } from "@/lib/server/admin-dossier";
import { getResend } from "@/lib/resend";
import { getInvoice } from "@/lib/server/invoice-store";
import { renderInvoicePdf } from "@/lib/server/invoice-pdf";
import { invoiceFileName } from "@/lib/invoice";
import { ouvrirEnvoi, fermerEnvoi } from "@/lib/server/email-log";
import {
  renderTransactionalEmail,
  TRANSACTIONAL_EMAIL_FROM,
  TRANSACTIONAL_EMAIL_REPLY_TO,
} from "@/lib/transactional-email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// ════════════════════════════════════════════════════════════════════════════════════════════
// RENVOYER UNE FACTURE DÉJÀ ÉMISE.
//
// POURQUOI ELLE EXISTE. À la première vente réelle, la facture a bien été émise et l'acheteuse n'a
// rien reçu. Il n'existait alors aucun moyen de lui renvoyer son document : l'envoi est déclenché
// par la CRÉATION du dossier, un rejeu Stripe ne le refait donc pas (`created` vaut faux), et rien
// d'autre ne parle à Resend. Le seul recours était d'écrire un script à la main, dans l'urgence,
// contre la base de production.
//
// ELLE NE CRÉE RIEN, ELLE RELIT. Aucune facture n'est émise ici, aucun numéro n'est consommé : la
// séquence légale reste sans trou, et renvoyer dix fois le même document ne produit jamais dix
// factures. C'est la différence entre un renvoi et une réémission, et elle n'est pas cosmétique.
//
// L'ADRESSE EST CELLE DU COMPTE PROPRIÉTAIRE, jamais une adresse fournie par l'appelant : une route
// d'administration qui accepterait un destinataire arbitraire enverrait les pièces comptables d'un
// client à qui le demande.
//
// CELLE DU COMPTE, ET NON CELLE FIGÉE SUR LA FACTURE, et la distinction vient d'un cas réel : la
// première acheteuse s'est inscrite avec une adresse mal orthographiée. La facture porte donc une
// adresse qui n'existe pas, et elle ne se réécrit pas (une pièce émise est figée). Le canal de
// contact, lui, est celui du COMPTE, qui se corrige : renvoyer sur l'adresse de la facture aurait
// réexpédié le document exactement là où il s'était perdu.
//
// DEUX VERROUS, les mêmes que le créateur de dossiers : `ENABLE_ADMIN_DOSSIER_CREATION` à "true" ET
// l'e-mail de session dans `FUTUREE_ADMIN_EMAILS`. En production, la variable est absente : la
// route y répond 404, et son ouverture est une décision explicite, prise le jour où l'on en a
// besoin.
// ════════════════════════════════════════════════════════════════════════════════════════════

const NOT_FOUND = new Response(null, { status: 404 });

export async function POST(req: Request) {
  const { user } = await requireCurrentUser();
  if (!isAdminDossierCreator(user.email)) return NOT_FOUND;

  const body = (await req.json().catch(() => null)) as
    | { number?: string; userId?: string }
    | null;
  const number = typeof body?.number === "string" ? body.number.trim() : "";
  const userId = typeof body?.userId === "string" ? body.userId.trim() : "";
  if (!number || !userId) {
    return Response.json({ error: "number et userId sont requis." }, { status: 400 });
  }

  // La facture est lue POUR SON PROPRIÉTAIRE : le couple (userId, number) est la clé, et un numéro
  // seul ne désigne donc jamais la pièce de quelqu'un d'autre.
  const invoice = await getInvoice(userId, number);
  if (!invoice) return Response.json({ error: "Facture introuvable." }, { status: 404 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );

  // L'adresse ACTUELLE du propriétaire. Repli sur celle de la facture si le compte a disparu : le
  // document reste dû, même si le compte ne l'est plus.
  const { data: compte } = await supabase.auth.admin.getUserById(userId);
  const destinataire = compte?.user?.email ?? invoice.buyerEmail;

  const trace = await ouvrirEnvoi(supabase, {
    // Le type public d'une facture ne porte pas le PaymentIntent : la trace se rattache donc au
    // numéro de facture, qui est ce qu'on cherche quand on enquête sur un renvoi.
    paymentIntentId: null,
    kind: "facture_renvoi",
    toEmail: destinataire,
  });

  try {
    const pdf = await renderInvoicePdf(invoice);
    const email = renderTransactionalEmail({
      preheader: `La facture ${invoice.number} est jointe à ce message.`,
      eyebrow: `Facture ${invoice.number}`,
      title: "Votre facture est jointe",
      paragraphs: [
        "Bonjour,",
        `Voici, en pièce jointe, votre facture ${invoice.number} pour ${invoice.designation}.`,
        "Elle reste également disponible dans votre compte, à la rubrique Vos factures.",
      ],
      cta: { label: "Ouvrir mon compte", href: "https://futur-e.fr/compte" },
    });
    const { data, error } = await getResend().emails.send({
      from: TRANSACTIONAL_EMAIL_FROM,
      replyTo: TRANSACTIONAL_EMAIL_REPLY_TO,
      to: destinataire,
      subject: `Votre facture futur•e ${invoice.number}`,
      // Le message dit ce qu'il est : un RENVOI. Prétendre à une première émission ferait douter
      // quelqu'un qui aurait finalement reçu les deux.
      ...email,
      attachments: [{ filename: invoiceFileName(invoice.number), content: pdf }],
    });

    if (error) {
      console.error("[facture] renvoi refusé", { number, error });
      await fermerEnvoi(supabase, trace, { erreur: `${error.name}: ${error.message}` });
      return Response.json({ error: `${error.name}: ${error.message}` }, { status: 502 });
    }

    await fermerEnvoi(supabase, trace, { providerId: data?.id ?? null });
    return Response.json({ envoye: true, a: destinataire, providerId: data?.id ?? null });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Renvoi impossible.";
    console.error("[facture] renvoi en échec", { number, error: err });
    await fermerEnvoi(supabase, trace, { erreur: message });
    return Response.json({ error: message }, { status: 500 });
  }
}
