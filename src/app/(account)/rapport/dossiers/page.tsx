export const dynamic = "force-dynamic";

import Link from "next/link";
import Navbar from "@/components/Navbar";
import { requireCurrentUser } from "@/lib/user-account";
import { listDossiers } from "@/lib/address-dossier-store";
import { listTerritoiresSansBien } from "@/lib/active-territory";
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
  // LES TERRITOIRES ACHETÉS SEULS ONT LEUR PLACE ICI (13/08/2026). Cette page listait des BIENS, et
  // un territoire payé sans adresse n'y figurait donc pas : passé le jour de l'achat, son acheteur
  // n'avait plus aucun écran qui le nomme.
  const territoires = await listTerritoiresSansBien(supabase, user.id);
  const canCreate = isAdminDossierCreator(user.email);

  return (
    <div
      className="min-h-screen bg-canvas text-label relative overflow-hidden"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      <Navbar ctas={{ secondary: { href: "/compte", label: "Mon compte" }, primary: { href: "/rapport", label: "Mon rapport" } }} />

      <div className="relative z-[2] max-w-[920px] mx-auto px-7 pb-24 pt-14">
        <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-ghost mb-2">Vos dossiers</p>
        <h1
          className="font-[var(--weight-title)] text-[length:var(--text-title)] leading-[1.15] tracking-[-0.5px] text-label mb-8"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          {dossiers.length === 0 && territoires.length > 0
            ? "Ce que vous avez ouvert."
            : dossiers.length === 0
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
            {/* La porte par l'adresse, en premier : c'est le geste que cet écran vide appelle.
                Avant le 30/07/2026, il ne proposait que de revenir au rapport, donc un compte
                sans dossier n'avait aucun chemin vers la qualification. */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <Link
                href="/dossier"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent/[0.12] text-accent text-[14px] no-underline border border-accent/[0.25]"
              >
                Analyser une adresse
              </Link>
              <Link
                href="/rapport"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[var(--bg-elev-2)] text-muted text-[14px] no-underline border border-[var(--border-1)]"
              >
                Retour au rapport
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {dossiers.map((d) => {
              // De quoi RECONNAÎTRE le bien quand deux dossiers partagent une adresse. La classe du
              // diagnostic est ce qui les distingue le plus sûrement ; à défaut, on le dit.
              const dpe = d.selected_dpe_snapshot?.etiquette_dpe ?? null;
              return (
                <div key={d.id} className="glass rounded-xl p-6">
                  <p className="text-[length:var(--text-lede)] text-label leading-snug mb-1.5">{d.address_label}</p>
                  <p className="font-mono text-[12px] text-ghost mb-5">
                    {dpe ? `DPE ${dpe}` : "logement à préciser"} · créé le{" "}
                    {DATE_FMT.format(new Date(d.created_at))}
                  </p>
                  {/* CE QUI S'OUVRE D'ABORD EST LA RÉPONSE, PAS UNE ÉCHELLE (13/08/2026).
                      Cette page ne menait qu'aux modules. Le bouton « La commune » ouvrait bien
                      `/rapport`, donc le dossier de décision, mais sous un libellé qui annonçait le
                      module Territoire : le hub n'était nommé nulle part, et le module Territoire,
                      lui, n'était atteignable depuis aucun de ces boutons. Le verdict passe en tête,
                      les trois échelles suivent, chacune sous son nom.

                      <a> ET PAS <Link>, PARCE QUE LA CIBLE EST UNE ROUTE HANDLER. Avec <Link>, le
                      router demande un payload RSC, la Route Handler répond une redirection vers
                      une page HTML, et le router abandonne sans rien faire : le clic restait sans
                      effet. Constaté en production le 30/07/2026, la MÊME URL collée dans la barre
                      d'adresse fonctionnant parfaitement, ce qui a désigné le routing client et
                      disculpé le serveur. Un <a> natif fait une vraie navigation et suit le 307.
                      `prefetch` n'a plus d'objet : un <a> n'est jamais préfetché.

                      Toutes ces destinations passent par `ouvrir` : le clic pose le territoire de
                      lecture sur la commune du dossier, sans quoi le lecteur obtenait Logement et
                      Autour sur Nantes pendant que la commune restait sa résidence. */}
                  <a
                    href={`/rapport/dossiers/ouvrir?id=${encodeURIComponent(d.id)}&vers=dossier`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-canvas font-semibold text-[length:var(--text-dense)] no-underline"
                  >
                    Ouvrir le dossier
                  </a>

                  <p className="font-mono text-[11px] tracking-[0.1em] uppercase text-ghost mt-6 mb-2.5">
                    Ou une échelle en particulier
                  </p>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                    <a
                      href={`/rapport/dossiers/ouvrir?id=${encodeURIComponent(d.id)}&vers=commune`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--bg-elev-2)] text-muted text-[length:var(--text-dense)] no-underline border border-[var(--border-1)]"
                    >
                      {d.city ? `La commune : ${d.city}` : "La commune"}
                    </a>
                    <a
                      href={`/rapport/dossiers/ouvrir?id=${encodeURIComponent(d.id)}&vers=autour`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--bg-elev-2)] text-muted text-[length:var(--text-dense)] no-underline border border-[var(--border-1)]"
                    >
                      Autour de l&apos;adresse
                    </a>
                    <a
                      href={`/rapport/dossiers/ouvrir?id=${encodeURIComponent(d.id)}&vers=logement`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[var(--bg-elev-2)] text-muted text-[length:var(--text-dense)] no-underline border border-[var(--border-1)]"
                    >
                      Le logement
                    </a>
                  </div>
                </div>
              );
            })}

            {/* AJOUTER UN BIEN N'AVAIT AUCUNE PORTE DÈS QU'ON EN POSSÉDAIT UN (13/08/2026).
                « Analyser une adresse » n'existait que dans l'état VIDE : un compte qui avait déjà
                un dossier, donc exactement celui qui peut en vouloir un second, ne trouvait ici
                aucun chemin pour le demander. La liste montrait ce qu'il possède et taisait comment
                l'agrandir.

                LE PRIX N'EST PAS ANNONCÉ ICI, et c'est la règle de cette page : il vaut 39 € ou
                25 € selon que le territoire du bien est déjà payé, et `quoteForDossier` ne peut le
                trancher qu'une fois l'adresse connue. L'écrire ici serait faux une fois sur deux.
                Le parcours de qualification, lui, connaît l'adresse et affiche le montant exact. */}
            <div className="rounded-xl p-6" style={{ border: "1px dashed var(--border-2)" }}>
              <p className="text-[14px] text-muted leading-relaxed mb-4">
                Un autre bien à examiner ? Chaque dossier porte une adresse précise, et ouvre les
                trois échelles de sa commune.
              </p>
              <Link
                href="/dossier"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent/[0.12] text-accent text-[length:var(--text-dense)] no-underline border border-accent/[0.25]"
              >
                Analyser une autre adresse
              </Link>
            </div>
          </div>
        )}
        {/* ── VOS TERRITOIRES ─────────────────────────────────────────────────────────────
            Un territoire acheté seul (14 €) crée un droit et aucun bien : il n'apparaissait ni ici,
            ni dans le compte des communes ouvertes du hub, qui ne comptait que des dossiers. Seuls
            sont listés ceux qu'AUCUN bien ne porte déjà : ailleurs, c'est le bien qui est la porte,
            et il ouvre les trois échelles au lieu d'une. */}
        {territoires.length > 0 && (
          <div className="mt-10">
            <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-ghost mb-3">
              {territoires.length === 1 ? "Votre territoire" : "Vos territoires"}
            </p>
            <div style={{ display: "grid", gap: 12 }}>
              {territoires.map((t) => (
                <div
                  key={t.insee}
                  className="glass rounded-xl px-6 py-5 flex flex-wrap items-center justify-between gap-4"
                >
                  <span>
                    <span className="text-[length:var(--text-lede)] text-label">
                      {t.commune ?? `Commune ${t.insee}`}
                    </span>
                    <span className="font-mono text-[12px] text-ghost block mt-1">
                      ouvert le {DATE_FMT.format(new Date(t.createdAt))}
                    </span>
                  </span>
                  {/* <a> natif : la cible est une Route Handler (voir le commentaire plus haut). */}
                  <a
                    href={`/rapport/territoire?insee=${encodeURIComponent(t.insee)}${
                      t.commune ? `&nom=${encodeURIComponent(t.commune)}` : ""
                    }`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent/[0.12] text-accent text-[length:var(--text-dense)] no-underline border border-accent/[0.25]"
                  >
                    Ouvrir le dossier
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
