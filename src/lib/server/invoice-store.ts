import "server-only";
import { createClient } from "@supabase/supabase-js";
import {
  designationFor, normalizeBuyerName, sellerSnapshot,
  type Invoice, type InvoiceProductType, type SellerSnapshot,
} from "@/lib/invoice";
import { LEGAL_ENTITY } from "@/lib/legal-entity";

// ════════════════════════════════════════════════════════════════════════════════════════════
// ÉMISSION ET LECTURE DES FACTURES.
//
// L'ÉMISSION PASSE PAR UNE FONCTION SQL, pas par un `insert` suivi d'un `select`. Le numéro doit
// être alloué et la ligne écrite dans la MÊME transaction, sinon une allocation suivie d'un échec
// laisserait un trou dans la numérotation, ce qui est une non-conformité irrattrapable après coup.
// La fonction rend toujours la facture de cet encaissement, et un booléen qui dit si elle vient
// d'être créée : c'est lui qui gouverne l'envoi de l'e-mail, pour qu'un rejeu du webhook ne
// renvoie pas la facture au client.
//
// LA FACTURE N'EST PAS UNE CONDITION DE LIVRAISON. Si l'émission échoue, le client garde son
// accès : il a payé. Le webhook journalise et continue. La facture manquante se rattrape, un accès
// refusé après encaissement ne se rattrape pas.
//
// CE MODULE POSSÈDE SON CLIENT ADMIN ET NE LE REND JAMAIS (même patron que
// `address-dossier-write.ts`). `authenticated` n'a AUCUN droit sur `invoices` : une route qui
// passerait le client de l'utilisateur lirait zéro ligne sans la moindre erreur, et afficherait
// « aucune facture » à quelqu'un qui en a. Le filtre par compte vit donc ici, il n'est pas une
// convention à répéter dans chaque appelant.
// ════════════════════════════════════════════════════════════════════════════════════════════

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

type AllocateRow = { id: string; number: string; issued_at: string; created: boolean };

export type IssueResult =
  | { status: "issued"; invoice: Invoice; created: boolean }
  | { status: "skipped"; reason: "no_buyer_name" | "amount_zero" }
  | { status: "failed"; error: string };

/**
 * Émet la facture d'un encaissement, ou rend celle qui existe déjà.
 *
 * `buyerNameRaw` vient des métadonnées du compte, donc DÉCLARÉ par le client : c'est la règle
 * normale d'une facture, le vendeur ne certifie pas l'identité de l'acheteur. Sans nom
 * exploitable, on N'ÉMET PAS : une facture « à l'ordre de quentin@exemple.fr » ne serait pas
 * conforme, donc inutile là où une facture sert. Le parcours d'achat demande le nom avant le
 * paiement précisément pour que ce cas n'arrive pas.
 */
export async function issueInvoice(
  input: {
    userId: string | null;
    buyerNameRaw: unknown;
    buyerEmail: string;
    productType: InvoiceProductType;
    /** La commune ou l'adresse achetée, qui entre dans la désignation. */
    subject: string | null;
    /** Ce que Stripe déclare avoir encaissé. Jamais un tarif catalogue. */
    amountCents: number;
    paymentIntentId: string;
  },
): Promise<IssueResult> {
  const buyerName = normalizeBuyerName(input.buyerNameRaw);
  if (!buyerName) return { status: "skipped", reason: "no_buyer_name" };
  if (!Number.isFinite(input.amountCents) || input.amountCents <= 0) {
    return { status: "skipped", reason: "amount_zero" };
  }

  const seller = sellerSnapshot();
  const designation = designationFor(input.productType, input.subject);

  const { data, error } = await admin().rpc("allocate_invoice", {
    p_user_id: input.userId,
    p_buyer_name: buyerName,
    p_buyer_email: input.buyerEmail,
    p_seller: seller,
    p_product_type: input.productType,
    p_designation: designation,
    p_amount_cents: input.amountCents,
    p_vat_mention: LEGAL_ENTITY.vatMention,
    p_pi: input.paymentIntentId,
  });

  if (error) return { status: "failed", error: error.message };
  const row = (Array.isArray(data) ? data[0] : data) as AllocateRow | undefined;
  if (!row) return { status: "failed", error: "allocate_invoice n'a rien rendu" };

  return {
    status: "issued",
    created: row.created,
    invoice: {
      number: row.number,
      issuedAt: row.issued_at,
      buyerName,
      buyerEmail: input.buyerEmail,
      seller,
      designation,
      amountCents: input.amountCents,
      vatMention: LEGAL_ENTITY.vatMention,
    },
  };
}

type InvoiceRow = {
  number: string; issued_at: string; buyer_name: string; buyer_email: string;
  seller: SellerSnapshot; designation: string; amount_cents: number; vat_mention: string;
};

function toInvoice(r: InvoiceRow): Invoice {
  return {
    number: r.number,
    issuedAt: r.issued_at,
    buyerName: r.buyer_name,
    buyerEmail: r.buyer_email,
    // L'identité du vendeur vient de la LIGNE, jamais de `legal-entity.ts` : une facture doit
    // rester lisible telle qu'elle a été remise, même après un déménagement ou un changement de
    // forme juridique.
    seller: r.seller,
    designation: r.designation,
    amountCents: r.amount_cents,
    vatMention: r.vat_mention,
  };
}

const SELECT = "number, issued_at, buyer_name, buyer_email, seller, designation, amount_cents, vat_mention";

/** Les factures d'un compte, la plus récente d'abord. */
export async function listInvoices(userId: string): Promise<Invoice[]> {
  const { data, error } = await admin()
    .from("invoices").select(SELECT).eq("user_id", userId).order("issued_at", { ascending: false });
  if (error) throw new Error(`Lecture des factures impossible : ${error.message}`);
  return (data ?? []).map((r) => toInvoice(r as unknown as InvoiceRow));
}

/**
 * Une facture précise, FILTRÉE PAR COMPTE. Le numéro seul ne donne accès à rien : il est
 * devinable (FE-2026-0002 suit FE-2026-0001), donc la propriété se vérifie ici, jamais côté
 * appelant.
 */
export async function getInvoice(
  userId: string, number: string,
): Promise<Invoice | null> {
  const { data, error } = await admin()
    .from("invoices").select(SELECT).eq("user_id", userId).eq("number", number).maybeSingle();
  if (error) throw new Error(`Lecture de la facture impossible : ${error.message}`);
  return data ? toInvoice(data as unknown as InvoiceRow) : null;
}
