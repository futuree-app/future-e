export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import { requireCurrentUser } from "@/lib/user-account";
import { DossierMerciClient } from "./DossierMerciClient";

export default async function DossierMerciPage({
  searchParams,
}: {
  searchParams: Promise<{ payment_intent?: string }>;
}) {
  await requireCurrentUser();
  const { payment_intent: pi } = await searchParams;
  // Sans identifiant de paiement, il n'y a rien à attendre : la liste des dossiers dit la vérité.
  if (!pi) redirect("/rapport/dossiers");

  return (
    <div
      className="min-h-screen bg-canvas text-label relative overflow-hidden"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      {/* « Mes biens » partout : la même destination portait deux noms, et le lecteur qui vient
          d'acheter est le moins bien placé pour deviner qu'ils désignent la même page. */}
      <Navbar ctas={{ primary: { href: "/rapport/dossiers", label: "Mes biens" } }} />

      <div className="relative z-[2] max-w-[920px] mx-auto px-7 pb-24 pt-14">
        <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-ghost mb-2">
          Paiement enregistré
        </p>
        <h1
          className="font-[var(--weight-title)] text-[length:var(--text-title)] leading-[1.15] tracking-[-0.5px] text-label mb-6"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          Merci.
        </h1>
        <DossierMerciClient paymentIntentId={pi} />
      </div>
    </div>
  );
}
