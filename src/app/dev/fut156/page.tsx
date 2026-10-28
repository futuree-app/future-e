// FUT-156 · LA FIBRE À L'ADRESSE DANS LE VRAI MODULE LOGEMENT. DEV UNIQUEMENT : 404 en production.
//
// Les adresses de recette (`src/lib/__fixtures__/fut156/17.json`, lignes officielles du T2 2026) portent le
// code publié par la construction ; il est décodé par `lectureDepuisCode`, comme le fait la route, puis rendu
// par les composants de production. Aucune source appelée, aucun bucket lu.
//
// `?vue=logement|section&cas=<id BAN>`, et deux cas sans fixture : `cas=panne` (index illisible) et
// `cas=ancien` (rapport écrit avant FUT-156, sans le champ). Exemples :
//   /dev/fut156?cas=17415_0510_00011   (11 place Blair, déployé, 5 opérateurs)
//   /dev/fut156?cas=17415_0510_00010   (10 place Blair, raccordable sur demande)
//   /dev/fut156?cas=17385_9eyuk6_00003 (3 allée de l'Albatros, à vérifier)
import { readFileSync } from "node:fs";
import path from "node:path";
import Link from "next/link";
import { notFound } from "next/navigation";
import LogementModule from "@/components/report/LogementModule";
import { FibreAdresseSection } from "@/components/report/logement/FibreAdresseSection";
import type { AddressDossierRow } from "@/lib/address-dossier-store";
import type { LogementReport } from "@/lib/logement-report-types";
import { fibreIndisponible, lectureDepuisCode, type LectureFibre } from "@/lib/fibre-adresse";
import { casDeLogement, PROJET_TEMOIN } from "@/components/prototypes/fut87/fixture-logement";
import type { UserProject } from "@/lib/user-project";

export const dynamic = "force-dynamic";

type Cas = { id: string; ban: Array<Record<string, string>>; codePublie: string | null };
const META = { millesime: "2026T2", donneesAu: "2026-06-30" };
/** Les cas montrés dans le menu : un par état, et les contre-épreuves. */
const MENU = [
  "17415_0510_00011", "17415_0510_00010", "17415_1052_00035", "17300_4105_00020", "17022_0011_00020", "17306_0052_00014",
  "17017_0121_00003", "17240_1060_00009_b", "17300_1120_00001", "17385_9eyuk6_00003", "17415_3692_00001", "17159_0346_00004",
  "17299_0810_00049_bis",
];

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const sp = await searchParams;
  const tous: Cas[] = JSON.parse(readFileSync(path.join(process.cwd(), "src/lib/__fixtures__/fut156/17.json"), "utf8")).cas;
  const cle = sp.cas ?? MENU[0];
  const vue = sp.vue === "section" ? "section" : "logement";
  const c = tous.find((x) => x.id === cle) ?? tous.find((x) => x.id === MENU[0])!;
  const b = c.ban[0];
  const lecture: LectureFibre | undefined = cle === "ancien" ? undefined
    : cle === "panne" ? fibreIndisponible(META)
    : lectureDepuisCode(c.codePublie ?? undefined, META);
  const libelle = `${b.numero}${b.rep ? ` ${b.rep}` : ""} ${b.nom_voie} ${b.nom_commune}`;

  const menu = (
    <nav style={{ position: "relative", zIndex: 10, padding: "12px 16px", fontSize: 12, display: "flex", flexWrap: "wrap", gap: 8, background: "var(--bg-elev)" }}>
      <strong>Banc FUT-156 · {vue} · {cle === "panne" || cle === "ancien" ? cle : `${libelle} (${c.codePublie ?? "non rattachée"})`}</strong>
      {["logement", "section"].map((v) => <Link key={v} href={`?vue=${v}&cas=${cle}`}>{v}</Link>)}
      {[...MENU, "panne", "ancien"].map((x) => <Link key={x} href={`?vue=${vue}&cas=${x}`} style={{ fontWeight: x === cle ? 700 : 400 }}>{x}</Link>)}
    </nav>
  );

  if (vue === "section") {
    return (
      <>
        {menu}
        <div className="max-w-[920px] mx-auto px-5 sm:px-7 py-10">
          <FibreAdresseSection lecture={lecture} />
        </div>
      </>
    );
  }

  const maintenant = "2026-10-28T12:00:00.000Z";
  const dossier = {
    id: `banc-fut156-${cle}`, user_id: "banc", ban_id: c.id, insee: b.code_insee,
    address_label: libelle, city: b.nom_commune, postcode: null,
    latitude: Number(b.lat), longitude: Number(b.lon), parcel_code: null, posture: "residence",
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
    address: { ...base.address!, id: c.id, label: libelle, citycode: b.code_insee, latitude: Number(b.lat), longitude: Number(b.lon) },
    ...(lecture ? { fibre: lecture } : {}),
    version: { numero: 1, collecteeLe: maintenant, synthese: null, syntheseHash: null, sourcesAbsentes: cle === "panne" ? ["fibre"] : [] },
  };
  return (
    <>
      {menu}
      <LogementModule dossier={dossier} project={PROJET_TEMOIN as unknown as UserProject} versionInitiale={rapport} defaultCommune={null} />
    </>
  );
}
