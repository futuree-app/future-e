// FUT-81 · LE PLAN D'URBANISME DANS LE VRAI MODULE LOGEMENT. DEV UNIQUEMENT : 404 en production.
//
// `LogementModule`, le composant de `/rapport/logement`, reçoit une VERSION de rapport dont le champ
// `urbanisme` est lu par `lireUrbanisme` à partir des réponses RÉELLES du cadastre et du Géoportail de
// l'urbanisme relevées le 26/10/2026 (`src/lib/__fixtures__/fut81/`). Aucune source n'est appelée.
//
// `?cas=lyon|six-fours|merignac|moissy|la-rochelle|vauquois|chatelard|grandvals|panne|ancien`
// `panne` : le Géoportail n'a pas répondu. `ancien` : un rapport écrit avant FUT-81, sans le champ.
import { notFound } from "next/navigation";
import LogementModule from "@/components/report/LogementModule";
import type { AddressDossierRow } from "@/lib/address-dossier-store";
import type { LogementReport } from "@/lib/logement-report-types";
import { lireUrbanisme, urbanismeIndisponible } from "@/lib/urbanisme-parcelle";
import { casDeLogement, PROJET_TEMOIN } from "@/components/prototypes/fut87/fixture-logement";
import type { UserProject } from "@/lib/user-project";
import lyon from "@/lib/__fixtures__/fut81/lyon-croix-rousse.json";
import sixFours from "@/lib/__fixtures__/fut81/six-fours-emplacement-reserve.json";
import merignac from "@/lib/__fixtures__/fut81/merignac-deux-zones.json";
import moissy from "@/lib/__fixtures__/fut81/moissy-zone-unique.json";
import laRochelle from "@/lib/__fixtures__/fut81/la-rochelle-psmv.json";
import vauquois from "@/lib/__fixtures__/fut81/vauquois-carte-communale.json";
import chatelard from "@/lib/__fixtures__/fut81/chatelard-rnu.json";
import grandvals from "@/lib/__fixtures__/fut81/grandvals-sans-document.json";

type Feature = { properties?: Record<string, unknown> | null; geometry?: { type: string; coordinates: unknown } | null };
type Fixture = {
  capture: string; ban: { id: string; label: string; citycode: string; lon: number; lat: number };
  parcelle: { properties: { idu: string; contenance?: number; code_insee: string; section: string; numero: string; com_abs?: string; nom_com?: string }; geometry: Feature["geometry"]; rattachement: "point" | "repli" } | null;
  municipality: { features: Feature[] }; document: { features: Feature[] }; zone: { features: Feature[] }; secteur: { features: Feature[] };
  prescriptionSurf: { features: Feature[] }; prescriptionLin: { features: Feature[] }; prescriptionPct: { features: Feature[] };
  details: Record<string, Record<string, unknown>>; files: Record<string, { name?: unknown; title?: unknown }[]>;
};
const CAS: Record<string, Fixture> = {
  lyon, "six-fours": sixFours, merignac, moissy, "la-rochelle": laRochelle, vauquois, chatelard, grandvals,
  panne: moissy, ancien: moissy,
} as unknown as Record<string, Fixture>;

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const sp = await searchParams;
  const cle = sp.cas && CAS[sp.cas] ? sp.cas : "lyon";
  const f = CAS[cle];
  const base = casDeLogement("sans-dpe").rapport;
  const p = f.parcelle?.properties;
  const urbanisme = cle === "ancien"
    ? undefined
    : cle === "panne"
      ? urbanismeIndisponible()
      : lireUrbanisme({
          parcelle: f.parcelle ? { geometry: f.parcelle.geometry, contenance: p?.contenance ?? null } : null,
          municipality: f.municipality.features, documents: f.document.features, zones: f.zone.features, secteurs: f.secteur.features,
          prescriptions: { surface: f.prescriptionSurf.features, ligne: f.prescriptionLin.features, point: f.prescriptionPct.features },
          details: f.details, fichiers: f.files,
        });
  const rapport: LogementReport = {
    ...base,
    address: { ...base.address!, id: f.ban.id, label: f.ban.label, citycode: f.ban.citycode, latitude: f.ban.lat, longitude: f.ban.lon },
    parcel: p
      ? { parcelCode: `${p.code_insee}-${p.com_abs || "000"}-${p.section}-${p.numero}`, nomCommune: p.nom_com ?? null, contenance: p.contenance ?? null, rattachement: f.parcelle!.rattachement }
      : null,
    banFeatureType: "housenumber",
    ...(urbanisme ? { urbanisme } : {}),
    version: { numero: 1, collecteeLe: f.capture, sourcesAbsentes: cle === "panne" ? ["urbanisme"] : [], synthese: null, syntheseHash: null },
  };
  const maintenant = "2026-10-26T12:00:00.000Z";
  const dossier = {
    id: `banc-fut81-${cle}`, user_id: "banc", ban_id: f.ban.id, insee: f.ban.citycode,
    address_label: f.ban.label, city: null, postcode: null,
    latitude: 0, longitude: 0, parcel_code: null, posture: "residence",
    place_relation: null, place_objective: null, snapshot: null,
    dpe_selection_status: "pending", selected_dpe_id: null, selected_dpe_snapshot: null, selected_dpe_at: null,
    // Un geste daté : aucune attribution automatique ne part, donc rien ne s'écrit depuis le banc.
    dpe_selection_at: maintenant,
    created_at: maintenant, updated_at: maintenant,
    synthesis_text: null, synthesis_fact_hash: null, synthesis_generated_at: null,
    stripe_payment_intent_id: null, amount_paid_cents: null, purchased_at: null,
    replacement_for_dossier_id: null, replacement_reason: null, access_revoked_at: null,
  } as AddressDossierRow;
  return <LogementModule dossier={dossier} project={PROJET_TEMOIN as unknown as UserProject} versionInitiale={rapport} defaultCommune={null} />;
}
