// LE BANC DE REVUE DE L'AUDIT ÉNERGÉTIQUE (FUT-62).
//
// Voir l'audit d'un immeuble, d'un logement ou d'une adresse qui en porte plusieurs suppose un compte,
// un dossier payé et la bonne adresse. Ici, la section Énergie de la production, sur les fixtures de
// `audit-lecture.fixtures.ts` (format exact des lignes ADEME), dans chacun des états qu'elle sait rendre.
// Aucun appel, aucune écriture.
//
// `?cas=logement|immeuble|ouvert|copro|incomplet|plusieurs|plusieurs-lie|sans-dpe|habitant|panne`,
// et `&ouvert=1` pour déplier les parcours. Sans paramètre : le sommaire.
//
// DEV UNIQUEMENT : 404 en production.
import { notFound } from "next/navigation";
import { BancAudit } from "./BancAudit";

export default async function Page({ searchParams }: { searchParams: Promise<{ cas?: string; ouvert?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { cas, ouvert } = await searchParams;
  return <BancAudit cas={cas ?? null} ouvert={ouvert === "1"} />;
}
