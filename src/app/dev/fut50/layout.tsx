// FUT-50 · GABARIT DES PROTOTYPES D'ACCUEIL. DEV UNIQUEMENT.
//
// Deux gardes, comme FUT-87 : ce gabarit ET chaque page renvoient une 404 en production, côté serveur.
// `prototypes.test.ts` vérifie les deux.
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Prototype FUT-50 · accueil · futur•e",
  robots: { index: false, follow: false },
};

export default function Fut50Layout({ children }: { children: ReactNode }) {
  if (process.env.NODE_ENV === "production") notFound();
  return children;
}
