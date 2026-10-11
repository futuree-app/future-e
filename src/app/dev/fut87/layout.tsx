// FUT-87 · GABARIT DES PROTOTYPES DE DIRECTION ARTISTIQUE. DEV UNIQUEMENT.
//
// Deux gardes, et pas une : ce gabarit ET chaque page renvoient une 404 en production, côté serveur.
// Une page ajoutée plus tard sans sa propre garde reste ainsi protégée par le gabarit, et un gabarit
// déplacé laisse les pages protégées. Le test `lecture-dossier.test.ts` (I1) vérifie les deux.
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Prototype FUT-87 · futur•e",
  robots: { index: false, follow: false },
};

export default function Fut87Layout({ children }: { children: ReactNode }) {
  if (process.env.NODE_ENV === "production") notFound();
  return children;
}
