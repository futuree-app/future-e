// ATELIER DES TROIS ÉCHELLES. Les deux directions viennent de la veille Pinterest conservée dans
// `docs/recherche-visuelle/2026-08-21-trois-echelles-pinterest.md`. Elles sont rendues dans le vrai
// gabarit du rapport (224 px dans une colonne de 280 px) et à 112 px pour tester leur dégradation.
//
// Cette route ne choisit ni n'installe une direction dans `/rapport`. Elle permet de comparer le
// repos, les trois états actifs, le focus de la liste et les cibles de clic avant de modifier le
// composant de production. DEV UNIQUEMENT : 404 en production.

import { notFound } from "next/navigation";
import { EchellePrototypesClient } from "./EchellePrototypesClient";

export const dynamic = "force-dynamic";

export default function DevEchellePrototypesPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <EchellePrototypesClient />;
}
