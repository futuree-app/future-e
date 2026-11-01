// FUT-157 · LES SOLS POLLUÉS AU TERRAIN DANS LE VRAI MODULE LOGEMENT. DEV UNIQUEMENT : 404 en production.
//
// Les adresses de recette (`src/lib/__fixtures__/fut157/cas.json`, réponses brutes de Géorisques, du cadastre et
// de la BAN figées le 30/10/2026) sont relues par les MÊMES fonctions que la route (`lireCategorieGeo`,
// `lireSitesSolsTerrain`), puis rendues par les composants de production. Aucune source appelée.
//
// `?vue=logement|section&cas=<id BAN>`, et trois cas sans réponse : `cas=panne` (les trois inventaires en panne),
// `cas=partiel` (servitudes et instructions en panne, à Paris) et `cas=ancien` (rapport écrit avant FUT-157).
// Contre-revue du 31/10/2026, quatre cas construits (géométries en mètres autour d'un point de Paris) :
// `cas=voie-dans-sis` (le point sur la voie dans un SIS, la parcelle voisine hors du SIS), `cas=infime` (une
// intersection de 0,02 m²), `cas=communal-partiel` (SIS de la commune en panne, une instruction publiée à
// l'adresse) et `cas=incomplet` (Metz 98 : servitudes en panne, rien trouvé ailleurs).
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
  assemblerSansEmprise, etatSitesSols, lireSitesSolsTerrain, sitesSolsIndisponible, type EntreeSitesSols, type InventaireTerrain, type LectureSitesSols,
  type ReponsesSitesSols,
} from "@/lib/sites-sols-terrain";
import { casDeLogement, PROJET_TEMOIN } from "@/components/prototypes/fut87/fixture-logement";
import type { UserProject } from "@/lib/user-project";

export const dynamic = "force-dynamic";

type Cas = {
  adresse: string; ban: string; insee: string; entree: EntreeSitesSols;
  reponses: Record<InventaireTerrain, PageSsp[]>; sansEmprise: ReponsesSitesSols["sansEmprise"];
};

function lectureCategories(c: Cas): ReponsesSitesSols["categories"] {
  return Object.fromEntries(Object.entries(c.reponses).map(([k, p]) => [k, lireCategorieGeo(p, lotIncomplet(p, PAGES_MAX))])) as ReponsesSitesSols["categories"];
}

function lecture(c: Cas, panne: InventaireTerrain[] = []): LectureSitesSols {
  const categories = Object.fromEntries(Object.entries(c.reponses).map(([k, p]) => [
    k, panne.includes(k as InventaireTerrain) ? lireCategorieGeo([null]) : lireCategorieGeo(p, lotIncomplet(p, PAGES_MAX)),
  ])) as ReponsesSitesSols["categories"];
  return lireSitesSolsTerrain(c.entree, { categories, sansEmprise: panne.length ? null : c.sansEmprise });
}

// ── Les cas construits de la contre-revue ──────────────────────────────────────────────────────
const LAT0 = 48.85;
const LON0 = 2.35;
const pt = (x: number, y: number): [number, number] => [LON0 + x / (111_320 * Math.cos((LAT0 * Math.PI) / 180)), LAT0 + y / 111_132];
const rect = (x0: number, y0: number, x1: number, y1: number) => ({
  type: "Polygon", coordinates: [[pt(x0, y0), pt(x1, y0), pt(x1, y1), pt(x0, y1), pt(x0, y0)]],
});
const ligne = (id: string, nom: string, geom: unknown, extra: Record<string, unknown> = {}) => ({
  identifiant_ssp: id, nom, adresse: null, nom_commune: "PARIS", date_maj: "2020-09-30",
  fiche_risque: `https://fiches-risques.brgm.fr/georisques/infosols/classification/${id}`, geom, ...extra,
});
const pageDe = (data: unknown[]): PageSsp => ({ results: data.length, total_pages: data.length ? 1 : 0, data });
const VIDE = { sis: lireCategorieGeo([pageDe([])]), sup: lireCategorieGeo([pageDe([])]), instructions: lireCategorieGeo([pageDe([])]) };
const ENTREE: EntreeSitesSols = {
  point: pt(0, 0), geocodage: "housenumber", adresse: { numero: "12", voie: "RUE DU BANC" },
  parcelle: { geometry: rect(-10, -10, 10, 10), code: "75056-000-AB-0012", rattachement: "point" },
};
const SANS_EMPRISE_VIDE = { etat: "complet" as const, fiches: [] };
const CONSTRUITS: Record<string, { libelle: string; lecture: () => LectureSitesSols }> = {
  "voie-dans-sis": {
    libelle: "12 rue du Banc (construit) · point sur la voie dans un SIS, parcelle voisine hors du SIS",
    lecture: () => lireSitesSolsTerrain(
      { ...ENTREE, parcelle: { geometry: rect(3, -10, 23, 10), code: "75056-000-AB-0013", rattachement: "repli", distanceRepliM: 3 } },
      { categories: { ...VIDE, sis: lireCategorieGeo([pageDe([ligne("SSPBANC1", "Site du banc (SIS)", rect(-20, -50, 2.5, 50))])]) }, sansEmprise: SANS_EMPRISE_VIDE },
    ),
  },
  infime: {
    libelle: "12 rue du Banc (construit) · intersection de 0,02 m² avec un SIS",
    lecture: () => lireSitesSolsTerrain(ENTREE, {
      categories: { ...VIDE, sis: lireCategorieGeo([pageDe([ligne("SSPBANC2", "Site du banc (SIS voisin)", rect(9.999, -10, 40, 10))])]) },
      sansEmprise: SANS_EMPRISE_VIDE,
    }),
  },
  "communal-partiel": {
    libelle: "12 rue du Banc (construit) · SIS de la commune en panne, une instruction publiée à l'adresse",
    lecture: () => lireSitesSolsTerrain(ENTREE, {
      categories: VIDE,
      sansEmprise: assemblerSansEmprise({
        sis: lireCategorieGeo([null]),
        sup: lireCategorieGeo([pageDe([])]),
        instructions: lireCategorieGeo([pageDe([ligne("SSPBANC3", "Ancien atelier du banc", null, { adresse: "12 RUE DU BANC", statut_instruction: "En cours" })])]),
      }),
    }),
  },
};

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const sp = await searchParams;
  const tous: Cas[] = JSON.parse(readFileSync(path.join(process.cwd(), "src/lib/__fixtures__/fut157/cas.json"), "utf8")).cas;
  const cle = sp.cas ?? tous[0].ban;
  const vue = sp.vue === "section" ? "section" : "logement";
  const paris = tous.find((x) => x.adresse.startsWith("64 Rue de Grenelle"))!;
  const metz98 = tous.find((x) => x.ban === "57463_6453_00098")!;
  const construit = CONSTRUITS[cle];
  const c = cle === "panne" || cle === "partiel" || construit ? paris : cle === "incomplet" ? metz98 : tous.find((x) => x.ban === cle) ?? tous[0];
  const lu: LectureSitesSols | undefined = cle === "ancien" ? undefined
    : construit ? construit.lecture()
    : cle === "panne" ? sitesSolsIndisponible(c.entree)
    : cle === "partiel" ? lecture(c, ["sup", "instructions"])
    : cle === "incomplet" ? lireSitesSolsTerrain(c.entree, { categories: { ...lectureCategories(c), sup: lireCategorieGeo([null]) }, sansEmprise: c.sansEmprise })
    : lecture(c);
  const speciaux = ["panne", "partiel", "ancien", "incomplet", ...Object.keys(CONSTRUITS)];

  const menu = (
    <nav style={{ position: "relative", zIndex: 10, padding: "12px 16px", fontSize: 12, display: "flex", flexWrap: "wrap", gap: 8, background: "var(--bg-elev)" }}>
      <strong>Banc FUT-157 · {vue} · {construit ? construit.libelle : speciaux.includes(cle) ? cle : c.adresse} · {lu ? etatSitesSols(lu) : "rapport antérieur"}</strong>
      {["logement", "section"].map((v) => <Link key={v} href={`?vue=${v}&cas=${cle}`}>{v}</Link>)}
      {[...tous.map((x) => x.ban), ...speciaux].map((x) => <Link key={x} href={`?vue=${vue}&cas=${x}`} style={{ fontWeight: x === cle ? 700 : 400 }}>{x}</Link>)}
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
    address: construit
      ? { ...base.address!, id: "75056_banc_00012", label: "12 Rue du Banc 75007 Paris", citycode: "75056", latitude: ENTREE.point[1], longitude: ENTREE.point[0] }
      : { ...base.address!, id: c.ban, label: c.adresse, citycode: c.insee, latitude: lat, longitude: lon },
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
