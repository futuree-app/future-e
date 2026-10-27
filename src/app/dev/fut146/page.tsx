// FUT-146 · LES PLANS DE BRUIT AÉRIEN DANS LES VRAIS MODULES. DEV UNIQUEMENT : 404 en production.
//
// Les adresses de recette (`src/lib/__fixtures__/fut146/`, réponses BAN et cadastre du 27/10/2026) passent
// par `lireBruitAerien` sur la copie officielle `data/bruit-aerien.json`, puis par les composants de
// production : `LogementModule` (section « Statut réglementaire ») et `AutourModule`. Aucune source appelée.
//
// `?vue=logement|section|autour&cas=<fixture>`, et deux cas sans fixture : `cas=panne` (jeu illisible) et
// `cas=ancien` (rapport écrit avant FUT-146, sans le champ). Exemples :
//   /dev/fut146?vue=autour&cas=marignane-zone-c-pgs     /dev/fut146?vue=autour&cas=marignane-hors-zone
//   /dev/fut146?vue=logement&cas=marignane-zone-a       /dev/fut146?vue=logement&cas=la-rochelle-limite-c-d
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import Link from "next/link";
import { notFound } from "next/navigation";
import LogementModule from "@/components/report/LogementModule";
import AutourModule from "@/components/report/AutourModule";
import { RegulatoryStatusBlock } from "@/components/report/logement/RegulatorySection";
import { SOURCES_VERSION, type AddressDossierRow } from "@/lib/address-dossier-store";
import type { LogementReport } from "@/lib/logement-report-types";
import type { Face3Snapshot } from "@/lib/logement-autour-types";
import { lireBruitAerien, type EntreeBruitAerien } from "@/lib/bruit-aerien";
import { casDeLogement, PROJET_TEMOIN } from "@/components/prototypes/fut87/fixture-logement";
import type { UserProject } from "@/lib/user-project";

export const dynamic = "force-dynamic";

type Fixture = {
  capture: string; q: string;
  ban: { id: string; label: string; type: string; citycode: string; lon: number; lat: number };
  parcelle: { properties: { idu: string; contenance?: number }; geometry: { type: string; coordinates: unknown }; rattachement: "point" | "repli"; candidatsAuPoint?: number; distanceM?: number } | null;
};

const DOSSIER_FIXTURES = path.join(process.cwd(), "src/lib/__fixtures__/fut146");

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const sp = await searchParams;
  const cas = readdirSync(DOSSIER_FIXTURES).map((f) => f.replace(/\.json$/, ""));
  const cle = sp.cas ?? "marignane-zone-c-pgs";
  const vue = sp.vue === "autour" ? "autour" : sp.vue === "section" ? "section" : "logement";
  const f: Fixture = JSON.parse(readFileSync(path.join(DOSSIER_FIXTURES, `${cas.includes(cle) ? cle : "marignane-zone-c-pgs"}.json`), "utf8"));
  const jeu: unknown = cle === "panne" ? null : JSON.parse(readFileSync(path.join(process.cwd(), "data/bruit-aerien.json"), "utf8"));
  const entree: EntreeBruitAerien = {
    point: [f.ban.lon, f.ban.lat], geocodage: f.ban.type,
    parcelle: f.parcelle ? { geometry: f.parcelle.geometry, rattachement: f.parcelle.rattachement, candidatsAuPoint: f.parcelle.candidatsAuPoint } : null,
  };

  const maintenant = "2026-10-27T12:00:00.000Z";
  const dossier = {
    id: `banc-fut146-${cle}`, user_id: "banc", ban_id: f.ban.id, insee: f.ban.citycode,
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
      <strong>Banc FUT-146 · {vue}</strong>
      {["logement", "section", "autour"].map((v) => <Link key={v} href={`?vue=${v}&cas=${cle}`}>{v}</Link>)}
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
    // Autour lit le point seul, sans la précision du géocodage : comme `buildAutourResponse`.
    const bruit = cle === "ancien" ? null : lireBruitAerien(jeu, { point: entree.point, geocodage: null, parcelle: null });
    return (
      <>
        {menu}
        <AutourModule dossier={{ ...dossier, snapshot }} defaultCommune={null} initialCarOwnership={{ kind: "unknown" }} initialBruitAerien={bruit} />
      </>
    );
  }

  // `vue=section` : la section « Statut réglementaire » de production seule, dans le conteneur de page
  // (le module Logement complet est élargi dans les bancs par son passeport, défaut antérieur à FUT-146).
  if (vue === "section") {
    const lecture = cle === "ancien" ? undefined : lireBruitAerien(jeu, entree);
    return (
      <>
        {menu}
        <div className="max-w-[920px] mx-auto px-5 sm:px-7 py-10">
          <RegulatoryStatusBlock
            georisques={{ address: { risks: { labels: [] }, pprn: { labels: [] }, regulatoryPlans: [], rga: null, seismic: null } }}
            heritage={{ items: [], sourceStatus: "ok" }}
            bruitAerien={lecture}
          />
        </div>
      </>
    );
  }

  const base = casDeLogement("sans-dpe").rapport;
  const bruitAerien = cle === "ancien" ? undefined : lireBruitAerien(jeu, entree);
  const rapport: LogementReport = {
    ...base,
    address: { ...base.address!, id: f.ban.id, label: f.ban.label, citycode: f.ban.citycode, latitude: f.ban.lat, longitude: f.ban.lon },
    banFeatureType: f.ban.type,
    ...(bruitAerien ? { bruitAerien } : {}),
    version: {
      numero: 1, collecteeLe: f.capture, synthese: null, syntheseHash: null,
      sourcesAbsentes: cle === "panne" ? ["bruit_aerien"] : [],
    },
  };
  return (
    <>
      {menu}
      <LogementModule dossier={dossier} project={PROJET_TEMOIN as unknown as UserProject} versionInitiale={rapport} defaultCommune={null} />
    </>
  );
}
