// FUT-41 / FUT-22 · PROTOTYPE V4.1 DU CENTRE DE DÉCISION. DEV UNIQUEMENT : 404 en production.
// Données fictives ; la V4 reste sur /dev/centre-decision pour la comparaison directe.
import { notFound } from "next/navigation";
import { CentreDecision41 } from "@/components/prototypes/fut41-v41/CentreDecision41";

export const dynamic = "force-dynamic";
export const metadata = { title: "Centre de décision · prototype V4.1", robots: { index: false, follow: false } };

export default function PrototypeCentreDecisionV41() {
  if (process.env.NODE_ENV === "production") notFound();
  return <CentreDecision41 />;
}
