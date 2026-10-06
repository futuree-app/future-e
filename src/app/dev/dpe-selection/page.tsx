// LA BOUCLE DE VÉRIFICATION de la sélection du diagnostic (FUT-68).
//
// Pourquoi elle existe : voir la section Énergie d'un dossier à 34 diagnostics suppose un compte, un
// dossier payé et la bonne adresse. Ici, les mêmes composants que la production, sur des fiches
// fabriquées, dans chacun des états que la section sait rendre. Les gestes (choisir, refuser,
// revenir) changent l'état LOCALEMENT : aucun appel, aucune écriture.
//
// `?cas=1|3|34|immeuble|refus|aucun|panne|partielle|auto|choisi`. Sans paramètre : le sommaire.
//
// DEV UNIQUEMENT : 404 en production.
import { notFound } from "next/navigation";
import { BancDpe } from "./BancDpe";

export default async function Page({ searchParams }: { searchParams: Promise<{ cas?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { cas } = await searchParams;
  return <BancDpe cas={cas ?? null} />;
}
