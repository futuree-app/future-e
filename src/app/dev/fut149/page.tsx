// FUT-149 · LE ZONAGE DU DÉBROUSSAILLEMENT OBLIGATOIRE DANS LES VRAIS MODULES. DEV UNIQUEMENT : 404 en production.
//
// Les adresses de recette (`src/lib/__fixtures__/fut149/adresses/`, réponses BAN et cadastre du 28/10/2026) passent
// par `lireDebroussaillement` sur les tuiles de l'édition IGN du 01/03/2026 qui les couvrent
// (`src/lib/__fixtures__/fut149/tuiles/`), puis par les composants de production : la section « Statut
// réglementaire » du module Logement et `AutourModule`. Aucune source appelée.
//
// `?vue=section|autour|logement&cas=<fixture>`, et deux cas sans fixture : `cas=panne` (Storage injoignable) et
// `cas=ancien` (rapport écrit avant FUT-149, sans le champ). Exemples :
//   /dev/fut149?vue=section&cas=la-teste-pyla-en-zone       /dev/fut149?vue=autour&cas=oleron-boudet-855
import { readFileSync, readdirSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import path from "node:path";
import Link from "next/link";
import { notFound } from "next/navigation";
import LogementModule from "@/components/report/LogementModule";
import AutourModule from "@/components/report/AutourModule";
import { RegulatoryStatusBlock } from "@/components/report/logement/RegulatorySection";
import { SOURCES_VERSION, type AddressDossierRow } from "@/lib/address-dossier-store";
import type { LogementReport } from "@/lib/logement-report-types";
import type { Face3Snapshot } from "@/lib/logement-autour-types";
import { debroussaillementIndisponible, lireDebroussaillement, type EntreeDebroussaillement, type TuileDebroussaillement } from "@/lib/debroussaillement";
import { casDeLogement, PROJET_TEMOIN } from "@/components/prototypes/fut87/fixture-logement";
import type { UserProject } from "@/lib/user-project";

export const dynamic = "force-dynamic";

type Fixture = {
  capture: string; q: string;
  ban: { id: string; label: string; type: string; citycode: string; lon: number; lat: number };
  parcelle: { geometry: { type: string; coordinates: unknown }; rattachement: "point" | "repli"; candidatsAuPoint?: number } | null;
};

const DOSSIER = path.join(process.cwd(), "src/lib/__fixtures__/fut149");
const PAR_DEFAUT = "la-teste-pyla-en-zone";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const sp = await searchParams;
  const cas = readdirSync(path.join(DOSSIER, "adresses")).map((f) => f.replace(/\.json$/, "")).sort();
  const cle = sp.cas ?? PAR_DEFAUT;
  const vue = sp.vue === "autour" ? "autour" : sp.vue === "logement" ? "logement" : "section";
  const f: Fixture = JSON.parse(readFileSync(path.join(DOSSIER, "adresses", `${cas.includes(cle) ? cle : PAR_DEFAUT}.json`), "utf8"));
  const manifeste = JSON.parse(readFileSync(path.join(DOSSIER, "tuiles/manifest.json"), "utf8"));
  const tuiles = new Map<string, TuileDebroussaillement>(
    readdirSync(path.join(DOSSIER, "tuiles/t")).map((n) => [n.replace(/\.json\.gz$/, ""), JSON.parse(gunzipSync(readFileSync(path.join(DOSSIER, "tuiles/t", n))).toString("utf8"))]),
  );
  const entree: EntreeDebroussaillement = {
    point: [f.ban.lon, f.ban.lat], geocodage: f.ban.type, insee: f.ban.citycode,
    parcelle: f.parcelle ? { geometry: f.parcelle.geometry, rattachement: f.parcelle.rattachement, candidatsAuPoint: f.parcelle.candidatsAuPoint } : null,
  };
  const lire = (e: EntreeDebroussaillement) => (cle === "panne" ? debroussaillementIndisponible(e) : lireDebroussaillement(manifeste, tuiles, e));

  const maintenant = "2026-10-28T12:00:00.000Z";
  const dossier = {
    id: `banc-fut149-${cle}`, user_id: "banc", ban_id: f.ban.id, insee: f.ban.citycode,
    address_label: f.ban.label, city: null, postcode: null,
    latitude: f.ban.lat, longitude: f.ban.lon, parcel_code: null, posture: "residence",
    place_relation: null, place_objective: null, snapshot: null,
    dpe_selection_status: "pending", selected_dpe_id: null, selected_dpe_snapshot: null, selected_dpe_at: null,
    dpe_selection_at: maintenant, created_at: maintenant, updated_at: maintenant,
    synthesis_text: null, synthesis_fact_hash: null, synthesis_generated_at: null,
    stripe_payment_intent_id: null, amount_paid_cents: null, purchased_at: null,
    replacement_for_dossier_id: null, replacement_reason: null, access_revoked_at: null,
  } as AddressDossierRow;

  const menu = (
    <nav style={{ position: "relative", zIndex: 10, padding: "12px 16px", fontSize: 12, display: "flex", flexWrap: "wrap", gap: 8, background: "var(--bg-elev)" }}>
      <strong>Banc FUT-149 · {vue}</strong>
      {["section", "autour", "logement"].map((v) => <Link key={v} href={`?vue=${v}&cas=${cle}`}>{v}</Link>)}
      {[...cas, "panne", "ancien"].map((c) => <Link key={c} href={`?vue=${vue}&cas=${c}`} style={{ fontWeight: c === cle ? 700 : 400 }}>{c}</Link>)}
    </nav>
  );

  if (vue === "autour") {
    const snapshot = {
      center: { lat: f.ban.lat, lon: f.ban.lon },
      bpe: { categories: [] },
      osm: { potentiallyNoisyInfrastructure: [], nearestMappedGreenSpace: null, bboxRadiusMeters: 1500 },
      permis: { permis: [], rayonMeters: 300, ancienneteMaxAns: 3, anneeReference: 2026, consulteLe: maintenant },
      sourceStatus: { bpe: "complete", osmInfrastructure: "complete", osmGreenSpaces: "complete" },
      sources: { bpeVersion: SOURCES_VERSION, osmFetchedAt: null, osmQueryVersion: "v1", bpeMillesime: "2025" },
      sourcesVersion: SOURCES_VERSION, computedAt: maintenant,
    } as unknown as Face3Snapshot;
    // Autour lit le point seul, sans la précision du géocodage ni la parcelle : comme `buildAutourResponse`.
    const lecture = cle === "ancien" ? null : lire({ ...entree, geocodage: null, parcelle: null });
    return (
      <>
        {menu}
        <AutourModule dossier={{ ...dossier, snapshot }} defaultCommune={null} initialCarOwnership={{ kind: "unknown" }} initialDebroussaillement={lecture} />
      </>
    );
  }

  const lecture = cle === "ancien" ? undefined : lire(entree);
  // `vue=section` : la section « Statut réglementaire » de production seule, dans le conteneur de page.
  if (vue === "section") {
    return (
      <>
        {menu}
        <div className="max-w-[920px] mx-auto px-5 sm:px-7 py-10">
          <RegulatoryStatusBlock
            georisques={{ address: { risks: { labels: [] }, pprn: { labels: [] }, regulatoryPlans: [], rga: null, seismic: null } }}
            heritage={{ items: [], sourceStatus: "ok" }}
            debroussaillement={lecture}
          />
        </div>
      </>
    );
  }

  const base = casDeLogement("sans-dpe").rapport;
  const rapport: LogementReport = {
    ...base,
    address: { ...base.address!, id: f.ban.id, label: f.ban.label, citycode: f.ban.citycode, latitude: f.ban.lat, longitude: f.ban.lon },
    banFeatureType: f.ban.type,
    ...(lecture ? { debroussaillement: lecture } : {}),
    version: {
      numero: 1, collecteeLe: f.capture, synthese: null, syntheseHash: null,
      sourcesAbsentes: cle === "panne" ? ["debroussaillement"] : [],
    },
  };
  return (
    <>
      {menu}
      <LogementModule dossier={dossier} project={PROJET_TEMOIN as unknown as UserProject} versionInitiale={rapport} defaultCommune={null} />
    </>
  );
}
