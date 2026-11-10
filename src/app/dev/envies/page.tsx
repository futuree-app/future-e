// FUT-190 · PROTOTYPE « J'AIMERAIS DONNER PLUS DE PLACE À… ». DEV UNIQUEMENT : 404 en production.
// Faits communaux réels et sourcés (Angers, Chalonnes-sur-Loire) ; personne, Projet et annonces fictifs.
import { notFound } from "next/navigation";
import { Envies } from "@/components/prototypes/fut190-envies/Envies";

export const dynamic = "force-dynamic";
export const metadata = { title: "Envies · prototype FUT-190", robots: { index: false, follow: false } };

export default function PrototypeEnvies() {
  if (process.env.NODE_ENV === "production") notFound();
  return <Envies />;
}
