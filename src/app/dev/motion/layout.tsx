// FUT-75 · INTÉGRATION MOTION N° 1, PAGE DE CONTRÔLE. DEV UNIQUEMENT : gabarit ET page en 404 en production.
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
export default function Layout({ children }: { children: ReactNode }) {
  if (process.env.NODE_ENV === "production") notFound();
  return children;
}
