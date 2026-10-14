import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";

export const metadata: Metadata = { title: "Banc FUT-93 · futur•e", robots: { index: false, follow: false } };

export default function Fut93Layout({ children }: { children: ReactNode }) {
  if (process.env.NODE_ENV === "production") notFound();
  return children;
}
