// FUT-41 / FUT-22 · PROTOTYPE V4 DU CENTRE DE DÉCISION. DEV UNIQUEMENT : 404 en production.
//
// Rend la composition React du prototype (`src/components/prototypes/fut41-v4/`) sur des données
// FICTIVES. Aucun compte, aucune base, aucun paiement, aucun appel de modèle. Scénarios : `?s=s1` … `?s=s8`.
import { notFound } from "next/navigation";
import { CentreDecision } from "@/components/prototypes/fut41-v4/CentreDecision";

export const dynamic = "force-dynamic";

export const metadata = { title: "Centre de décision · prototype V4", robots: { index: false, follow: false } };

export default function PrototypeCentreDecision() {
  if (process.env.NODE_ENV === "production") notFound();
  return <CentreDecision />;
}
