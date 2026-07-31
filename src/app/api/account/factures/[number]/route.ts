import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getInvoice } from "@/lib/server/invoice-store";
import { renderInvoicePdf } from "@/lib/server/invoice-pdf";
import { invoiceFileName } from "@/lib/invoice";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ════════════════════════════════════════════════════════════════════════════════════════════
// LE TÉLÉCHARGEMENT D'UNE FACTURE.
//
// LE NUMÉRO NE DONNE ACCÈS À RIEN. « FE-2026-0002 » suit « FE-2026-0001 » : un numéro se devine.
// La propriété se vérifie donc en base, par `getInvoice(user.id, number)`, jamais en faisant
// confiance à l'URL.
//
// LE PDF EST REGÉNÉRÉ À LA DEMANDE depuis les champs FIGÉS de la ligne, il n'est pas stocké.
// Rien n'est perdu : ce qui doit rester immuable, ce sont les valeurs, et elles le sont en base.
// Stocker le binaire ajouterait un espace de stockage à gérer et à sauvegarder pour un document
// que trois valeurs suffisent à reconstruire à l'identique.
//
// EN LIGNE, PAS EN PIÈCE JOINTE (`inline`) : le lecteur veut d'abord la voir. Le nom de fichier
// est fourni pour l'enregistrement.
// ════════════════════════════════════════════════════════════════════════════════════════════
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ number: string }> },
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });

  const { number } = await params;
  // Le format est connu : le valider ici évite d'envoyer n'importe quelle chaîne à la base.
  if (!/^FE-\d{4}-\d{4,}$/.test(number)) {
    return NextResponse.json({ error: "Facture introuvable." }, { status: 404 });
  }

  const invoice = await getInvoice(user.id, number);
  if (!invoice) return NextResponse.json({ error: "Facture introuvable." }, { status: 404 });

  const pdf = await renderInvoicePdf(invoice);
  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${invoiceFileName(invoice.number)}"`,
      // Une facture ne change jamais, mais elle est nominative : jamais de cache partagé.
      "Cache-Control": "private, max-age=3600",
    },
  });
}
