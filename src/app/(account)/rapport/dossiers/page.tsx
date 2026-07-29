export const dynamic = "force-dynamic";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import { requireCurrentUser } from "@/lib/user-account";
import { listDossiers } from "@/lib/address-dossier-store";
import { isAdminDossierCreator } from "@/lib/server/admin-dossier";
import { AdminDossierCreator } from "@/components/report/AdminDossierCreator";

// ════════════════════════════════════════════════════════════════════════════
// Choisir parmi les dossiers qu'on possède.
//
// Cette page existe parce qu'on refuse de deviner. Deux appartements d'un même immeuble sont deux
// dossiers légitimes, et `updated_at` bouge à chaque écriture technique : « le dernier touché » ne
// désigne pas « celui que je regardais » dès qu'il y en a deux. Ouvrir le 2e étage quand le lecteur
// visait le 4e est exactement le défaut que l'identité en uuid corrige.
//
// AUCUN BOUTON PAYANT ici. Elle ne fait que rouvrir ce qui est déjà possédé. Le panneau « vous avez
// déjà un dossier à cette adresse », avec la création d'un nouveau bien et son prix, appartient au
// parcours de qualification, seul endroit qui connaîtra l'adresse soumise et le tarif applicable.
// ════════════════════════════════════════════════════════════════════════════

const DATE_FMT = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });

export default async function RapportDossiersPage() {
  const { supabase, user } = await requireCurrentUser();
  const dossiers = await listDossiers(supabase, user.id);
  const canCreate = isAdminDossierCreator(user.email);

  return (
    <div
      className="min-h-screen bg-canvas text-label relative overflow-hidden"
      style={{ fontFamily: "'Instrument Sans', sans-serif" }}
    >
      <Navbar ctas={{ secondary: { href: "/compte", label: "Mon compte" }, primary: { href: "/rapport", label: "Mon rapport" } }} />

      <div className="relative z-[2] max-w-[920px] mx-auto px-7 pb-24 pt-14">
        <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-ghost mb-2">Vos dossiers</p>
        <h1
          className="font-normal text-[clamp(26px,3vw,40px)] leading-[1.15] tracking-[-0.5px] text-label mb-8"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          {dossiers.length === 0
            ? "Aucun bien analysé pour l'instant."
            : dossiers.length === 1
              ? "Le bien que vous avez analysé."
              : "Quel bien voulez-vous ouvrir ?"}
        </h1>

        {canCreate && <AdminDossierCreator />}

        {dossiers.length === 0 ? (
          <div className="glass rounded-xl p-8">
            <p className="text-[15px] text-muted leading-relaxed mb-6">
              Aucun bien analysé pour l&apos;instant. Un dossier porte une adresse précise : ce
              qu&apos;elle a autour d&apos;elle, et ce que dit le bâtiment lui-même.
            </p>
            <Link
              href="/rapport"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent/[0.12] text-accent text-[14px] no-underline border border-accent/[0.25]"
            >
              Retour au rapport
            </Link>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {dossiers.map((d) => {
              // De quoi RECONNAÎTRE le bien quand deux dossiers partagent une adresse. La classe du
              // diagnostic est ce qui les distingue le plus sûrement ; à défaut, on le dit.
              const dpe = d.selected_dpe_snapshot?.etiquette_dpe ?? null;
              return (
                <div key={d.id} className="glass rounded-xl p-6">
                  <p className="text-[16.5px] text-label leading-snug mb-1.5">{d.address_label}</p>
                  <p className="font-mono text-[12px] text-ghost mb-5">
                    {dpe ? `DPE ${dpe}` : "logement à préciser"} · créé le{" "}
                    {DATE_FMT.format(new Date(d.created_at))}
                  </p>
                  {/* Les trois échelles du bien, et elles passent TOUTES par `ouvrir` : le clic
                      pose le territoire de lecture sur la commune du dossier, sans quoi le lecteur
                      obtenait Logement et Autour sur Nantes pendant que la commune restait sa
                      résidence.

                      <a> ET PAS <Link>, PARCE QUE LA CIBLE EST UNE ROUTE HANDLER. Avec <Link>, le
                      router demande un payload RSC, la Route Handler répond une redirection vers
                      une page HTML, et le router abandonne sans rien faire : le clic restait sans
                      effet. Constaté en production le 30/07/2026, la MÊME URL collée dans la barre
                      d'adresse fonctionnant parfaitement, ce qui a désigné le routing client et
                      disculpé le serveur. Un <a> natif fait une vraie navigation et suit le 307.
                      `prefetch` n'a plus d'objet : un <a> n'est jamais préfetché. */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                    <a
                      href={`/rapport/dossiers/ouvrir?id=${encodeURIComponent(d.id)}&vers=logement`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent/[0.12] text-accent text-[13.5px] no-underline border border-accent/[0.25]"
                    >
                      Le logement
                    </a>
                    <a
                      href={`/rapport/dossiers/ouvrir?id=${encodeURIComponent(d.id)}&vers=autour`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/[0.05] text-muted text-[13.5px] no-underline border border-white/[0.08]"
                    >
                      Autour de l&apos;adresse
                    </a>
                    <a
                      href={`/rapport/dossiers/ouvrir?id=${encodeURIComponent(d.id)}&vers=territoire`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/[0.05] text-muted text-[13.5px] no-underline border border-white/[0.08]"
                    >
                      {d.city ? `La commune : ${d.city}` : "La commune"}
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
