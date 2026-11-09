// FUT-94 · LE BANC DU RETOUR D'UTILITÉ, AVEC LA FIN DE `/rapport`. DEV UNIQUEMENT.
//
// La même racine que `/rapport` (fond, colonne de 1 100 px, `data-theme` du Relevé), le vrai dossier de
// test (`dossierDeTest`, comme les bancs FUT-87/93), puis exactement ce qui le suit sur la page : le
// geste de clôture d'un dossier de commune seule, la question d'utilité, le pied.
//   vue=classique|releve        la présentation (Relevé par défaut)
//   deja=oui|pas_vraiment|pas_encore_lu   un retour déjà enregistré (avec `commentaire=1` : avec texte)
//   panne=toujours|commentaire  le stockage simulé échoue (toujours, ou au seul envoi du commentaire)
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import { DossierDecisionSection } from "@/components/report/DossierDecisionSection";
import { RetourUtilite } from "@/components/report/RetourUtilite";
import { TrackedAddressCta } from "@/app/(account)/rapport/RapportTrackedLinks";
import { releve as r } from "@/components/releve/primitives";
import autour from "@/components/report/autour-du-releve.module.css";
import { estReponseUtilite } from "@/lib/retour-utilite";
import { dossierDeTest } from "../fut87/dossier-de-test";

export const dynamic = "force-dynamic";

type Params = { vue?: string; deja?: string; commentaire?: string; panne?: string; insee?: string; prefs?: string };

export default async function BancFut94({ searchParams }: { searchParams: Promise<Params> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const sp = await searchParams;
  const t = await dossierDeTest({ ...sp, adresse: "0" });
  if (!t) notFound();
  const presentation = sp.vue === "classique" ? "classique" : "releve";
  const initial = estReponseUtilite(sp.deja)
    ? { answer: sp.deja, comment: sp.commentaire === "1" ? "La carte des écoles m'a servi." : null }
    : null;
  const endpoint = `/dev/fut94/api${sp.panne ? `?panne=${encodeURIComponent(sp.panne)}` : ""}`;
  return (
    <div className="min-h-screen bg-canvas text-label relative overflow-hidden" style={{ fontFamily: "var(--font-sans)" }}>
      <Navbar />
      <div className="relative z-[2] max-w-[1100px] mx-auto px-5 sm:px-7 pb-24" data-theme={presentation === "releve" ? "dark" : undefined}>
        <DossierDecisionSection
          presentation={presentation} dossier={t.dossier} logementStatus="none" insee={t.insee} scopeKey="commune"
          generatedAt="2026-11-02T10:00:00.000Z" versionServie={1} espacement="mt-6"
        />
        <TrackedAddressCta commune="Nantes" inseeCode={t.insee} presentation={presentation} />
        <RetourUtilite key={`${presentation}-${sp.deja ?? ""}`} insee={t.insee} dossierId={null} initial={initial} presentation={presentation} endpoint={endpoint} />
        <div className="border-t border-[var(--border-1)] mt-12" />
        {presentation === "releve" ? (
          <div className={`${r.releveSection} ${autour.pied} mt-12 pt-7 border-t border-[var(--border-1)]`}>
            <Link href="/compte" className={r.bouton}>Mon compte</Link>
            <Link href="/" className={r.lien}>Retour au site</Link>
          </div>
        ) : (
          <div className="flex items-center gap-3 flex-wrap mt-12 pt-7 border-t border-[var(--border-1)]">
            <Link href="/compte" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[var(--bg-elev-2)] text-muted text-[14px] no-underline border border-[var(--border-1)]">Mon compte</Link>
            <Link href="/" className="font-mono text-[11px] tracking-[0.06em] uppercase text-ghost no-underline py-2 ml-auto">Retour au site</Link>
          </div>
        )}
      </div>
    </div>
  );
}
