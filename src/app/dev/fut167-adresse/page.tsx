// FUT-167 (D2) · LES RISQUES INDUSTRIELS À L'ADRESSE DANS LE VRAI MODULE LOGEMENT. DEV UNIQUEMENT : 404 en production.
//
// Lecture RÉELLE (index Seveso local, PPRT Géorisques au point et sur la commune) aux coordonnées d'adresses
// géocodées par la Base adresse nationale, rendue par les composants de production. Deux cas sans appel :
// `cas=panne` (Géorisques muet au point) et `cas=ancien` (rapport écrit avant FUT-167, sans le champ).
// `?vue=logement|section&cas=…`.
import Link from "next/link";
import { notFound } from "next/navigation";
import LogementModule from "@/components/report/LogementModule";
import { IndustrieAdresseSection } from "@/components/report/logement/IndustrieAdresseSection";
import type { AddressDossierRow } from "@/lib/address-dossier-store";
import type { LogementReport } from "@/lib/logement-report-types";
import type { LectureIndustrieAdresse } from "@/lib/industrie-adresse";
import { getIndustrieAdresse } from "@/lib/server/industrie-adresse";
import { casDeLogement, PROJET_TEMOIN } from "@/components/prototypes/fut87/fixture-logement";
import type { UserProject } from "@/lib/user-project";

export const dynamic = "force-dynamic";

type Cas = { id: string; libelle: string; insee: string; lat: number; lon: number; precision: "numero" | "rue" };
const CAS: Cas[] = [
  { id: "feyzin", libelle: "1 Avenue Albert Ramboz 69320 Feyzin", insee: "69276", lat: 45.68035, lon: 4.84605, precision: "numero" },
  { id: "fos", libelle: "Domaine de la Mériquette 13270 Fos-sur-Mer", insee: "13039", lat: 43.46846, lon: 4.93503, precision: "rue" },
  { id: "lyon", libelle: "Rue de la République 69002 Lyon", insee: "69382", lat: 45.76131, lon: 4.83539, precision: "rue" },
  { id: "paris", libelle: "Rue de Rivoli 75001 Paris", insee: "75101", lat: 48.86244, lon: 2.3362, precision: "rue" },
  { id: "rural", libelle: "Commune 16016", insee: "16016", lat: 45.5, lon: 0.4, precision: "numero" },
];

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const sp = await searchParams;
  const cle = sp.cas ?? CAS[0]!.id;
  const vue = sp.vue === "logement" ? "logement" : "section";
  const c = CAS.find((x) => x.id === cle) ?? CAS[0]!;
  const reelle = cle === "ancien" ? undefined : await getIndustrieAdresse({ lat: c.lat, lon: c.lon, citycode: c.insee, precision: c.precision });
  const lecture: LectureIndustrieAdresse | undefined = cle === "panne" && reelle
    ? { ...reelle, pprtPoint: { etat: "indisponible" } }
    : reelle;
  const maintenant = "2026-10-30T16:00:00.000Z";

  const menu = (
    <nav style={{ position: "relative", zIndex: 10, padding: "12px 16px", fontSize: 12, display: "flex", flexWrap: "wrap", gap: 8, background: "var(--bg-elev)" }}>
      <strong>Banc FUT-167 D2 · {vue} · {cle === "ancien" || cle === "panne" ? `${cle} (${c.libelle})` : c.libelle}</strong>
      {["section", "logement"].map((v) => <Link key={v} href={`?vue=${v}&cas=${cle}`}>{v}</Link>)}
      {[...CAS.map((x) => x.id), "panne", "ancien"].map((x) => <Link key={x} href={`?vue=${vue}&cas=${x}`} style={{ fontWeight: x === cle ? 700 : 400 }}>{x}</Link>)}
    </nav>
  );

  if (vue === "section") {
    return (
      <>
        {menu}
        <div id="fut167-section" className="max-w-[920px] mx-auto px-5 sm:px-7 py-10">
          <IndustrieAdresseSection lecture={lecture} collecteeLe={maintenant} />
        </div>
      </>
    );
  }

  const dossier = {
    id: `banc-fut167-${cle}`, user_id: "banc", ban_id: `banc-${cle}`, insee: c.insee,
    address_label: c.libelle, city: c.libelle, postcode: null,
    latitude: c.lat, longitude: c.lon, parcel_code: null, posture: "residence",
    place_relation: null, place_objective: null, snapshot: null,
    dpe_selection_status: "pending", selected_dpe_id: null, selected_dpe_snapshot: null, selected_dpe_at: null,
    dpe_selection_at: maintenant, created_at: maintenant, updated_at: maintenant,
    synthesis_text: null, synthesis_fact_hash: null, synthesis_generated_at: null,
    stripe_payment_intent_id: null, amount_paid_cents: null, purchased_at: null,
    replacement_for_dossier_id: null, replacement_reason: null, access_revoked_at: null,
  } as AddressDossierRow;
  const base = casDeLogement("sans-dpe").rapport;
  const rapport: LogementReport = {
    ...base,
    address: { ...base.address!, label: c.libelle, citycode: c.insee, latitude: c.lat, longitude: c.lon },
    ...(lecture ? { industrieAdresse: lecture } : {}),
    version: { numero: 1, collecteeLe: maintenant, synthese: null, syntheseHash: null, sourcesAbsentes: cle === "panne" ? ["pprt_point"] : [] },
  };
  return (
    <>
      {menu}
      <LogementModule dossier={dossier} project={PROJET_TEMOIN as unknown as UserProject} versionInitiale={rapport} defaultCommune={null} />
    </>
  );
}
