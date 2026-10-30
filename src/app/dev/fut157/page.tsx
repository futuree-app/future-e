// FUT-157 · LES SOLS POLLUÉS AU TERRAIN DANS LE VRAI MODULE LOGEMENT. DEV UNIQUEMENT : 404 en production.
//
// Les adresses de recette (`src/lib/__fixtures__/fut157/cas.json`, réponses brutes de Géorisques, du cadastre et
// de la BAN figées le 30/10/2026) sont relues par les MÊMES fonctions que la route (`lireCategorieGeo`,
// `lireSitesSolsTerrain`), puis rendues par les composants de production. Aucune source appelée.
//
// `?vue=logement|section&cas=<id BAN>`, et trois cas sans réponse : `cas=panne` (les trois inventaires en panne),
// `cas=partiel` (servitudes et instructions en panne, à Paris) et `cas=ancien` (rapport écrit avant FUT-157).
import { readFileSync } from "node:fs";
import path from "node:path";
import Link from "next/link";
import { notFound } from "next/navigation";
import LogementModule from "@/components/report/LogementModule";
import { SitesSolsSection } from "@/components/report/logement/SitesSolsSection";
import type { AddressDossierRow } from "@/lib/address-dossier-store";
import type { LogementReport } from "@/lib/logement-report-types";
import { sourcesAbsentes } from "@/lib/logement-report-version";
import { PAGES_MAX, lireCategorieGeo, lotIncomplet, type PageSsp } from "@/lib/sites-sols";
import {
  etatSitesSols, lireSitesSolsTerrain, sitesSolsIndisponible, type EntreeSitesSols, type InventaireTerrain, type LectureSitesSols,
  type ReponsesSitesSols,
} from "@/lib/sites-sols-terrain";
import { casDeLogement, PROJET_TEMOIN } from "@/components/prototypes/fut87/fixture-logement";
import type { UserProject } from "@/lib/user-project";

export const dynamic = "force-dynamic";

type Cas = {
  adresse: string; ban: string; insee: string; entree: EntreeSitesSols;
  reponses: Record<InventaireTerrain, PageSsp[]>; sansEmprise: ReponsesSitesSols["sansEmprise"];
};
const CONSULTE = "2026-10-30T12:00:00.000Z";

function lecture(c: Cas, panne: InventaireTerrain[] = []): LectureSitesSols {
  const categories = Object.fromEntries(Object.entries(c.reponses).map(([k, p]) => [
    k, panne.includes(k as InventaireTerrain) ? lireCategorieGeo([null]) : lireCategorieGeo(p, lotIncomplet(p, PAGES_MAX)),
  ])) as ReponsesSitesSols["categories"];
  return lireSitesSolsTerrain(c.entree, { categories, sansEmprise: panne.length ? null : c.sansEmprise });
}

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const sp = await searchParams;
  const tous: Cas[] = JSON.parse(readFileSync(path.join(process.cwd(), "src/lib/__fixtures__/fut157/cas.json"), "utf8")).cas;
  const cle = sp.cas ?? tous[0].ban;
  const vue = sp.vue === "section" ? "section" : "logement";
  const paris = tous.find((x) => x.adresse.startsWith("64 Rue de Grenelle"))!;
  const c = cle === "panne" || cle === "partiel" ? paris : tous.find((x) => x.ban === cle) ?? tous[0];
  const lu: LectureSitesSols | undefined = cle === "ancien" ? undefined
    : cle === "panne" ? sitesSolsIndisponible(c.entree)
    : cle === "partiel" ? lecture(c, ["sup", "instructions"])
    : lecture(c);

  const menu = (
    <nav style={{ position: "relative", zIndex: 10, padding: "12px 16px", fontSize: 12, display: "flex", flexWrap: "wrap", gap: 8, background: "var(--bg-elev)" }}>
      <strong>Banc FUT-157 · {vue} · {cle === "panne" || cle === "partiel" || cle === "ancien" ? cle : c.adresse} · {lu ? etatSitesSols(lu) : "rapport antérieur"}</strong>
      {["logement", "section"].map((v) => <Link key={v} href={`?vue=${v}&cas=${cle}`}>{v}</Link>)}
      {[...tous.map((x) => x.ban), "panne", "partiel", "ancien"].map((x) => <Link key={x} href={`?vue=${vue}&cas=${x}`} style={{ fontWeight: x === cle ? 700 : 400 }}>{x}</Link>)}
    </nav>
  );

  if (vue === "section") {
    return (
      <>
        {menu}
        <div className="max-w-[920px] mx-auto px-5 sm:px-7 py-10">
          <SitesSolsSection lecture={lu} />
        </div>
      </>
    );
  }

  const [lon, lat] = c.entree.point;
  const maintenant = "2026-10-30T12:00:00.000Z";
  const dossier = {
    id: `banc-fut157-${cle}`, user_id: "banc", ban_id: c.ban, insee: c.insee,
    address_label: c.adresse, city: null, postcode: null,
    latitude: lat, longitude: lon, parcel_code: null, posture: "residence",
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
    address: { ...base.address!, id: c.ban, label: c.adresse, citycode: c.insee, latitude: lat, longitude: lon },
    ...(lu ? { sitesSols: lu } : {}),
  };
  rapport.version = { numero: 1, collecteeLe: maintenant, synthese: null, syntheseHash: null, sourcesAbsentes: sourcesAbsentes(rapport) };
  return (
    <>
      {menu}
      <LogementModule dossier={dossier} project={PROJET_TEMOIN as unknown as UserProject} versionInitiale={rapport} defaultCommune={null} />
    </>
  );
}
