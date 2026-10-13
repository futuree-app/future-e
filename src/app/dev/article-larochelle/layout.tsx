// PRÉVISUALISATION DE L'ARTICLE PILOTE MOBILITÉ LA ROCHELLE. DEV UNIQUEMENT : gabarit ET page en 404 en
// production, jamais dans le sitemap (`src/app/sitemap.ts` ne liste pas /dev).
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Prévisualisation · article mobilité La Rochelle · futur•e",
  robots: { index: false, follow: false },
};

export default function ArticleLaRochelleLayout({ children }: { children: ReactNode }) {
  if (process.env.NODE_ENV === "production") notFound();
  return children;
}
