// FUT-75 · INTÉGRATION MOTION N° 1 : PAGE DE CONTRÔLE. DEV UNIQUEMENT (404 en production).
//
// Q4 et Q5 se voient À LEUR VRAIE PLACE : Q4 dans la vraie carte du relevé (banc `/dev/fut92`, gabarit de
// /rapport), Q5 dans le vrai `QuartierSynthesis` (banc `/dev/synthese-territoire`, réponses de l'API
// simulées dans le navigateur par l'outil de test, sans appel au modèle). Ici : l'aperçu de Q1 (composant
// prêt, non raccordé tant que FUT-10 n'est pas fusionné) et les trois durées de Q2.
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import { Apercu } from "./Apercu";

export default function PageMotion() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--fg-2)" }}>
      <Navbar />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 20px 120px", display: "grid", gap: 40 }}>
        <header style={{ display: "grid", gap: 10 }}>
          <h1 style={{ fontSize: 32, fontWeight: 600, color: "var(--fg-hi)", margin: 0 }}>Intégration motion n° 1</h1>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6 }}>
            Q4 dans la vraie carte : <Link href="/dev/fut92?vue=releve&lieu=1%20Place%20de%20l%27H%C3%B4tel%20de%20Ville%2030000%20N%C3%AEmes">banc du relevé</Link> (« Données et limites »).
            Q5 dans le vrai composant : <code>/dev/synthese-territoire?snapshot=…</code> (réponses simulées par l&apos;outil de test).
          </p>
        </header>
        <Apercu />
      </div>
    </main>
  );
}
