"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

// ════════════════════════════════════════════════════════════════════════════════════════════
// UN DOSSIER ACHETÉ SANS PROJET, QUAND LE COMPTE EN A UN DEPUIS (FUT-10, décision du porteur).
//
// Le dossier reste FACTUEL jusqu'à ce que le lecteur demande explicitement une lecture personnalisée :
// créer un projet ailleurs ne réinterprète pas un achat fait sans lui. Cet écran remplace donc le
// verdict, qui n'existe pas pour cette vente, par ce qui est vrai :
//   - ce que le dossier contient (les faits sur le logement, ses alentours et sa commune, dans les
//     modules), et ce qu'il ne fait pas (les rapprocher de priorités qui n'étaient pas renseignées) ;
//   - le geste qui produit, à la demande, une lecture personnalisée DATÉE de ce jour, par le mécanisme
//     de mise à jour existant (`/api/dossier/actualiser`, version suivante, l'historique le dira).
//
// Il n'affiche AUCUN artefact factuel figé : il n'en existe pas pour un achat sans projet, et le
// prétendre serait inventer une version qui n'a jamais été produite.
// ════════════════════════════════════════════════════════════════════════════════════════════

export function LectureFactuelleDuBien({
  insee, scopeKey, adresse, acheteLe, supportingPane,
}: {
  insee: string;
  scopeKey: string;
  adresse: string;
  /** Date d'achat déjà mise en forme, ou `null`. */
  acheteLe: string | null;
  supportingPane?: ReactNode;
}) {
  const [etat, setEtat] = useState<"repos" | "encours" | "ailleurs" | "echec">("repos");
  const router = useRouter();

  async function demander() {
    setEtat("encours");
    try {
      const res = await fetch("/api/dossier/actualiser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ insee, scopeKey }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const corps = (await res.json().catch(() => null)) as { statut?: string } | null;
      if (corps?.statut === "en_cours") {
        setEtat("ailleurs");
        return;
      }
      router.refresh();
      setEtat("repos");
    } catch {
      setEtat("echec");
    }
  }

  return (
    <section className="mt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-x-10 lg:items-start" id="dossier-decision">
      <div>
        <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-ghost mb-3">Votre dossier</p>
        <h1
          className="font-[var(--weight-display)] text-[length:clamp(23px,2.9vw,36px)] leading-[1.12] tracking-[-0.8px] text-label"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          Ce dossier a été ouvert sans projet.
        </h1>
        <p className="text-[16px] leading-[1.7] text-muted mt-4">
          Il présente ce que nos sources établissent sur {adresse}, ses alentours et sa commune, sans
          juger s&apos;il correspond à vos priorités : elles n&apos;étaient pas renseignées
          {acheteLe ? ` lors de l'achat, le ${acheteLe}` : " lors de l'achat"}.
        </p>
        <div className="glass rounded-xl p-5 mt-6">
          <p className="text-[15px] text-label leading-snug mb-1.5">Votre projet est maintenant renseigné.</p>
          <p className="text-[14px] text-muted leading-relaxed mb-4">
            Vous pouvez demander une lecture de ce bien à travers lui. Elle sera datée d&apos;aujourd&apos;hui,
            et ce dossier gardera la trace de son achat sans projet.
          </p>
          <button
            type="button"
            onClick={demander}
            disabled={etat === "encours"}
            aria-busy={etat === "encours"}
            className="rounded-lg bg-accent px-5 py-2.5 text-[14px] font-medium text-[#12172a] disabled:opacity-60"
          >
            {etat === "encours" ? "Lecture en cours…" : "Lire ce bien avec mon projet"}
          </button>
          {etat === "ailleurs" && (
            <p className="text-[13px] text-muted mt-3" role="status">Une lecture est déjà en cours. Rechargez la page dans un instant.</p>
          )}
          {etat === "echec" && (
            <p className="text-[13px] text-muted mt-3" role="alert">
              La lecture n&apos;a pas abouti. Votre dossier reste consultable tel qu&apos;il a été acheté ; réessayez dans un moment.
            </p>
          )}
        </div>
      </div>
      {supportingPane ? <div className="mt-6 lg:mt-0">{supportingPane}</div> : null}
    </section>
  );
}
