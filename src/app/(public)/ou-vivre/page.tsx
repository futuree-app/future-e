import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import { OuVivreClient } from "./OuVivreClient";

// Comparateur de vie · /ou-vivre
// Porte d'entrée « texte libre » du parcours : on décrit un projet de vie, le
// moteur V1.6 (parse → match déterministe) fait ressortir des territoires, la
// synthèse les interprète, AskFuture éclaire « pourquoi ici », et l'exploration
// d'un territoire renvoie au paywall. Page volontairement SANS chiffre climatique
// (frontière produit : les chiffres appartiennent au rapport).

export const metadata: Metadata = {
  title: "Où vivre demain · futur•e",
  description:
    "Décrivez votre projet de vie. futur•e cherche les territoires français qui s'en approchent le plus, au regard du climat qui vient.",
  alternates: { canonical: "/ou-vivre" },
};

export default function OuVivrePage() {
  return (
    <div
      className="min-h-screen bg-canvas text-label relative overflow-hidden"
      style={{ fontFamily: "'Instrument Sans', sans-serif" }}
    >
      {/* Retour arrière du navigateur : une navigation "back_forward" vers cette
          page (atteinte via window.location.href côté paywall) re-rend l'UI mais
          NE rejoue PAS les effets React, donc la réhydratation du parcours (cf.
          OuVivreClient) ne se déclenche pas. Ce script s'exécute au parse, avant
          tout affichage : si on arrive par retour arrière et qu'un instantané de
          session existe, on force un rechargement normal — où l'effet de montage
          restaure le parcours. La clé est la seule constante dupliquée (SESSION_KEY). */}
      <script
        dangerouslySetInnerHTML={{
          __html:
            "(function(){try{var n=performance.getEntriesByType('navigation')[0];if(n&&n.type==='back_forward'&&localStorage.getItem('futuree:ouvivre:session')){location.reload();}}catch(e){}})();",
        }}
      />

      {/* Orbs */}
      <div className="fixed top-[-160px] left-[-130px] w-[540px] h-[540px] rounded-full bg-accent/[0.14] blur-[100px] opacity-40 pointer-events-none z-0" />
      <div className="fixed bottom-[-100px] right-[-100px] w-[420px] h-[420px] rounded-full bg-amethyst/[0.12] blur-[90px] opacity-28 pointer-events-none z-0" />

      <Navbar />

      <main className="relative z-[2] max-w-[920px] mx-auto px-6 pb-28">
        <OuVivreClient />
      </main>
    </div>
  );
}
