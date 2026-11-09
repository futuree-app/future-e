// FUT-41 / FUT-22 · PROTOTYPE V5.1 DU CENTRE DE DÉCISION. DEV UNIQUEMENT : 404 en production.
// Mêmes données fictives et mêmes règles que la V5 (/dev/centre-decision-v5) ; seule la présentation change.
import { notFound } from "next/navigation";
import { CentreDecision51 } from "@/components/prototypes/fut41-v51/CentreDecision51";

export const dynamic = "force-dynamic";
export const metadata = { title: "Centre de décision · prototype V5.1", robots: { index: false, follow: false } };

export default function PrototypeCentreDecisionV51() {
  if (process.env.NODE_ENV === "production") notFound();
  return <CentreDecision51 />;
}
