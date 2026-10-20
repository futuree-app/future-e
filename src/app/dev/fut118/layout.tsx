// FUT-118 · GABARIT DES ÉCRANS TÉMOINS DU RELEVÉ. DEV UNIQUEMENT.
//
// Même double garde que FUT-87 : ce gabarit ET chaque page renvoient une 404 en production, côté
// serveur. Les données sont FICTIVES et le disent (« Commune témoin », « Possibilité A ») : aucun
// dossier client, aucun appel au moteur, aucun appel au modèle, aucun paiement.
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Écrans témoins FUT-118 · futur•e",
  robots: { index: false, follow: false },
};

export default function Fut118Layout({ children }: { children: ReactNode }) {
  if (process.env.NODE_ENV === "production") notFound();
  return children;
}
