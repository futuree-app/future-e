// FUT-91 · BANC DE VÉRIFICATION DE « MA DÉCISION ». DEV UNIQUEMENT : gabarit ET page en 404 en production.
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";

export const metadata: Metadata = { title: "Banc FUT-91 · futur•e", robots: { index: false, follow: false } };

export default function Fut91Layout({ children }: { children: ReactNode }) {
  if (process.env.NODE_ENV === "production") notFound();
  return children;
}
