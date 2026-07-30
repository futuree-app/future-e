import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import { DossierQualificationClient } from "./DossierQualificationClient";

export const metadata: Metadata = {
  title: "Analyser une adresse : ce que devient ce lieu | futur•e",
  description:
    "Ce qui entoure une adresse, ce que dit le bâtiment, et comment la commune évolue. Nous vérifions d'abord que nous savons de quel bien il s'agit.",
};

// LA PORTE PAR L'ADRESSE. Publique et indexable, appelée depuis les pages commune (là où le SEO
// dépose le trafic), depuis la landing et depuis /rapport. Elle prend place à côté des deux autres
// portes : /ou-vivre départage des territoires, celle-ci qualifie un bien, /rapport/dossiers
// retrouve les dossiers possédés.
export default function DossierPage() {
  return (
    <div
      className="min-h-screen bg-canvas text-label relative overflow-hidden"
      style={{ fontFamily: "'Instrument Sans', sans-serif" }}
    >
      <Navbar />

      <div className="relative z-[2] max-w-[920px] mx-auto px-7 pb-24 pt-14">
        <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-ghost mb-2">
          Une adresse précise
        </p>
        <h1
          className="font-normal text-[clamp(26px,3vw,40px)] leading-[1.15] tracking-[-0.5px] text-label mb-5"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          Quel bien voulez-vous faire examiner&nbsp;?
        </h1>
        <p className="text-[15.5px] text-muted leading-relaxed mb-9">
          Avant de vous proposer quoi que ce soit, nous vérifions que nous savons de quel bien il
          s&apos;agit, et nous vous disons ce que nous trouverons à cette adresse.
        </p>

        <DossierQualificationClient />
      </div>
    </div>
  );
}
