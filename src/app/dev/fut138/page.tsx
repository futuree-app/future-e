// FUT-138 · LES PRIX IMMOBILIERS DANS LES VRAIS COMPOSANTS, À CHAQUE ÉCHELLE. DEV UNIQUEMENT : 404 en production.
//
//   Territoire : la carte « Prix immobiliers » de la commune (`QuartierAside`).
//   Autour     : le bloc « Les ventes à proximité » (`VentesAutourBloc`), lu par `lireVentesAutour` comme la page.
//   Logement   : aucun prix (une vente à 300 m décrit le voisinage, pas le bien).
// Plus la ligne des cartes Où vivre et comparateur, et le bloc donné aux modèles.
//
// Les ventes à proximité exigent le serveur local de recette (rien n'est publié) :
//   node scripts/dvf-autour/serveur-local.mjs
//   PRIX_AUTOUR_BUCKET=prix-autour PRIX_AUTOUR_STORAGE_URL=http://localhost:54138 npm run dev
//   /dev/fut138?cas=0 …           Territoire, bloc Autour seul, ligne comparateur, bloc modèles
//   /dev/fut138?vue=autour&cas=0  le VRAI module Autour (AutourModule), bloc rendu par VentesAutourServeur en Suspense,
//                                 comme la page de production ; `etat=panne` : lecture en échec (bloc « indisponible »)
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import AutourModule from "@/components/report/AutourModule";
import { VentesAutourServeur } from "@/components/report/VentesAutourServeur";
import { SOURCES_VERSION, type AddressDossierRow } from "@/lib/address-dossier-store";
import type { Face3Snapshot } from "@/lib/logement-autour-types";
import { QuartierAside } from "@/components/report/QuartierClimatData";
import { VentesAutourBloc } from "@/components/report/VentesAutourBloc";
import { getLecturePrix } from "@/lib/prix-immobiliers-commune";
import { blocPrixPourModele, lignePrixComparateur, textePrix } from "@/lib/prix-immobiliers";
import { lireVentesAutour } from "@/lib/server/prix-autour-tuiles";
import { typeDuLogement } from "@/lib/prix-autour-texte";

export const dynamic = "force-dynamic";

const CAS = [
  { nom: "La Rochelle, appartement (Vieux-Port)", insee: "17300", lat: 46.158, lon: -1.153, dpe: "appartement" },
  { nom: "La Rochelle, maison (Laleu)", insee: "17300", lat: 46.1712, lon: -1.1912, dpe: "maison" },
  { nom: "Lyon 3e (dense)", insee: "69383", lat: 45.7605, lon: 4.857, dpe: "appartement" },
  { nom: "Paris 11e, appartement", insee: "75111", lat: 48.865, lon: 2.378, dpe: "appartement" },
  { nom: "Paris 11e, maison (2 km)", insee: "75111", lat: 48.865, lon: 2.378, dpe: "maison" },
  { nom: "Limite Paris 20e / Bagnolet", insee: "75120", lat: 48.8636, lon: 2.41, dpe: "appartement" },
  { nom: "Limite La Rochelle / Aytré", insee: "17300", lat: 46.1395, lon: -1.135, dpe: "maison" },
  { nom: "Rural, Royère-de-Vassivière", insee: "23165", lat: 45.84, lon: 1.91, dpe: "maison" },
  { nom: "Montagne, Saint-Christophe-en-Oisans", insee: "38375", lat: 44.956, lon: 6.178, dpe: "maison" },
  { nom: "Strasbourg (hors DVF)", insee: "67482", lat: 48.5839, lon: 7.7455, dpe: "appartement" },
  { nom: "La Rochelle, sans diagnostic confirmé", insee: "17300", lat: 46.158, lon: -1.153, dpe: null },
  { nom: "La Rochelle, diagnostic d'immeuble", insee: "17300", lat: 46.158, lon: -1.153, dpe: "immeuble" },
];

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const sp = await searchParams;
  const i = Math.min(CAS.length - 1, Math.max(0, Number(sp.cas ?? 0) || 0));
  const c = CAS[i];
  if (sp.vue === "autour") return <VueAutour c={c} i={i} panne={sp.etat === "panne"} />;
  const lecture = await getLecturePrix(c.insee);
  const autour = await lireVentesAutour({ lat: c.lat, lon: c.lon }, c.insee);
  const type = typeDuLogement(
    c.dpe ? "user_confirmed" : "pending",
    c.dpe ? { type_batiment: c.dpe, methode_dpe: c.dpe === "immeuble" ? "dpe immeuble collectif" : `dpe ${c.dpe} individuel` } : null,
  );

  return (
    <div className="min-h-screen bg-canvas text-label" style={{ fontFamily: "var(--font-sans)" }}>
      <div className="max-w-[1100px] mx-auto px-5 sm:px-7 py-12">
        <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-info mb-4">Banc FUT-138 · {c.nom}</p>
        <nav className="flex flex-wrap gap-x-4 gap-y-2 mb-10 text-[13px]">
          {CAS.map((x, k) => (
            <Link key={x.nom} href={`/dev/fut138?cas=${k}`} className={k === i ? "text-label" : "text-muted"}>{x.nom}</Link>
          ))}
        </nav>
        <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-ghost mb-2">Territoire</p>
        <QuartierAside communeName={lecture.nom} scenarios={null} georisques={null} territoire={null} vigieau={null} drought={null} prix={textePrix(lecture)} />
        <section className="mt-14">
          <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-ghost mb-2">Autour</p>
          {autour === undefined && <p className="text-[13px] text-muted">Lecture non activée : lancer le serveur local de recette (voir l’en-tête de ce fichier).</p>}
          <VentesAutourBloc autour={autour} type={type} />
        </section>
        <section className="mt-14 glass rounded-xl px-5 py-4 text-[13px] leading-[1.6] text-muted">
          <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-ghost mb-2">Ligne Où vivre et comparateur</p>
          <p className="text-label/75">{lignePrixComparateur(lecture)}</p>
          <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-ghost mt-5 mb-2">Bloc donné aux modèles</p>
          <pre className="whitespace-pre-wrap text-[12px]">{blocPrixPourModele(lecture)}</pre>
        </section>
      </div>
    </div>
  );
}

/** Le vrai module Autour, monté comme par /rapport/autour (snapshot minimal : seuls les blocs indépendants du snapshot). */
function VueAutour({ c, i, panne }: { c: (typeof CAS)[number]; i: number; panne: boolean }) {
  const maintenant = "2026-11-03T12:00:00.000Z";
  const snapshot = {
    center: { lat: c.lat, lon: c.lon },
    bpe: { categories: [] },
    osm: { potentiallyNoisyInfrastructure: [], nearestMappedGreenSpace: null, bboxRadiusMeters: 1500 },
    permis: { permis: [], rayonMeters: 300, ancienneteMaxAns: 3, anneeReference: 2026, consulteLe: maintenant },
    sourceStatus: { bpe: "complete", osmInfrastructure: "complete", osmGreenSpaces: "complete" },
    sources: { bpeVersion: SOURCES_VERSION, osmFetchedAt: null, osmQueryVersion: "v1", bpeMillesime: "2025" },
    sourcesVersion: SOURCES_VERSION, computedAt: maintenant,
  } as unknown as Face3Snapshot;
  const dpe = c.dpe ? { type_batiment: c.dpe, methode_dpe: c.dpe === "immeuble" ? "dpe immeuble collectif" : `dpe ${c.dpe} individuel` } : null;
  const dossier = {
    id: `banc-fut138-${i}`, user_id: "banc", ban_id: `banc-${i}`, insee: c.insee, address_label: c.nom, city: null, postcode: null,
    latitude: c.lat, longitude: c.lon, parcel_code: null, posture: "residence", place_relation: null, place_objective: null, snapshot,
    dpe_selection_status: c.dpe ? "user_confirmed" : "pending", selected_dpe_id: null, selected_dpe_snapshot: dpe, selected_dpe_at: null,
    dpe_selection_at: maintenant, created_at: maintenant, updated_at: maintenant,
    synthesis_text: null, synthesis_fact_hash: null, synthesis_generated_at: null,
    stripe_payment_intent_id: null, amount_paid_cents: null, purchased_at: null,
    replacement_for_dossier_id: null, replacement_reason: null, access_revoked_at: null,
  } as unknown as AddressDossierRow;
  const type = typeDuLogement(dossier.dpe_selection_status, dossier.selected_dpe_snapshot);
  return (
    <>
      <nav style={{ position: "relative", zIndex: 10, padding: "12px 16px", fontSize: 12, display: "flex", flexWrap: "wrap", gap: 8, background: "var(--bg-elev)" }}>
        <strong>Banc FUT-138 · Autour</strong>
        {CAS.map((x, k) => <Link key={x.nom} href={`?vue=autour&cas=${k}`} style={{ fontWeight: k === i ? 700 : 400 }}>{x.nom}</Link>)}
        <Link href={`?vue=autour&cas=${i}&etat=panne`}>lecture en panne</Link>
      </nav>
      <AutourModule
        dossier={dossier} defaultCommune={null} initialCarOwnership={{ kind: "unknown" }}
        blocVentes={panne ? <VentesAutourBloc autour={null} type={type} /> : (
          <Suspense fallback={null}>
            <VentesAutourServeur lat={c.lat} lon={c.lon} insee={c.insee} type={type} />
          </Suspense>
        )}
      />
    </>
  );
}
