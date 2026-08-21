// HARNAIS DE RENDU du bloc « Ce que ce dossier examine », rendu juste avant le paiement.
//
// Le parcours réel exige un compte, une adresse vérifiée par la BAN et un devis serveur : le bloc
// n'était donc pas regardable avant la production, sur la surface la plus sensible du produit. Cette
// page le montre dans le MÊME conteneur que la page de paiement (`max-w-[920px] mx-auto px-7`), avec
// et sans nom de commune, pour contrôler la largeur, la coupe des phrases et la hauteur ajoutée
// au-dessus du bouton de paiement.
//
// Même convention que `/dev/conclusion`. DEV UNIQUEMENT : 404 en production.
import { notFound } from "next/navigation";
import { CeQueLeDossierExamine } from "@/components/CeQueLeDossierExamine";

export const dynamic = "force-dynamic";

export default function DevCheckoutEchelles() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className="min-h-screen bg-canvas text-label" style={{ fontFamily: "var(--font-sans)" }}>
      <div className="max-w-[920px] mx-auto px-7 pb-24 pt-14">
        <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-ghost mb-2">
          Le dossier de ce bien
        </p>
        <h1
          className="font-[var(--weight-title)] text-[length:var(--text-title)] leading-[1.15] tracking-[-0.5px] text-label mb-8"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          2 Chemin des Pierrières 17290 Ciré-d&apos;Aunis
        </h1>

        <CeQueLeDossierExamine city="Ciré-d'Aunis" />

        {/* Le panneau de paiement n'est pas rejouable hors session Stripe : ce cadre en tient la
            place, à sa hauteur réelle, pour juger ce que le bloc repousse sous la ligne de flottaison. */}
        <div className="glass rounded-xl p-6 text-ghost text-[14px]">
          (panneau de paiement, non rejouable ici)
        </div>

        <div className="mt-16 pt-8 border-t border-[var(--border-1)]">
          <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-ghost mb-4">
            Sans commune résolue
          </p>
          <CeQueLeDossierExamine city={null} />
        </div>
      </div>
    </div>
  );
}
