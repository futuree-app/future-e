// FUT-41 / FUT-22 · PROTOTYPE V5 DU CENTRE DE DÉCISION. DEV UNIQUEMENT : 404 en production.
// Données fictives ; la V4 et la V4.1 restent sur /dev/centre-decision et /dev/centre-decision-v41.
import { notFound } from "next/navigation";
import { CentreDecision5 } from "@/components/prototypes/fut41-v5/CentreDecision5";

export const dynamic = "force-dynamic";
export const metadata = { title: "Centre de décision · prototype V5", robots: { index: false, follow: false } };

export default function PrototypeCentreDecisionV5() {
  if (process.env.NODE_ENV === "production") notFound();
  return <CentreDecision5 />;
}
