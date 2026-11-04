// LA CARTOGRAPHIE OSM D'AUTOUR, QUAND OVERPASS TARDE OU TOMBE (04/11/2026). DEV UNIQUEMENT : 404 en production.
//
// Rend le vrai `AutourModule` et simule seulement les réponses de `/api/logement-autour`, appel après appel. Aucun
// dossier de production n'est lu ni écrit, aucune source n'est appelée. `?cas=` :
//   disponible   la cartographie est dans le dossier ;
//   froide       dossier neuf, tuile froide : `pending`, puis `complete` à la première reprise ;
//   panne        le serveur a constaté la panne (échec mémorisé) : `failed` d'emblée, puis « Vérifier à nouveau » ;
//   delai        Overpass ne répond jamais dans les temps : `pending` à chaque reprise, puis indisponibilité explicite ;
//                « Vérifier à nouveau » rend alors `complete` (la source est revenue) ;
//   rouvert      dossier enregistré `pending` puis rouvert : la reprise le complète.
import Link from "next/link";
import { notFound } from "next/navigation";
import Banc from "./Banc";
import { SOURCES_VERSION, type AddressDossierRow } from "@/lib/address-dossier-store";
import type { Face3Snapshot } from "@/lib/logement-autour-types";

export const dynamic = "force-dynamic";

const CAS = {
  disponible: { initial: "complete", reponses: ["complete"] },
  froide: { initial: null, reponses: ["pending", "complete"] },
  panne: { initial: null, reponses: ["failed", "complete"] },
  delai: { initial: null, reponses: ["pending", "pending", "pending", "pending", "complete"] },
  rouvert: { initial: "pending", reponses: ["complete"] },
} as const;

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const sp = await searchParams;
  const cle = (sp.cas && sp.cas in CAS ? sp.cas : "delai") as keyof typeof CAS;
  const cas = CAS[cle];
  const maintenant = new Date().toISOString();
  const centre = { lat: 46.1591, lon: -1.1520 };
  const complet = {
    center: centre,
    bpe: { categories: [] },
    osm: {
      potentiallyNoisyInfrastructure: [{ type: "railway", distanceMeters: 640 }],
      nearestMappedGreenSpace: { distanceMeters: 180, kind: "park", areaM2: 12_400, name: "Square de banc" },
      bboxRadiusMeters: 1500,
    },
    icu: null,
    // Présent, sinon le rattrapage des permis ferait un appel au montage et masquerait la reprise étudiée ici.
    permis: { permis: [], rayonMeters: 300, ancienneteMaxAns: 3, anneeReference: 2026, consulteLe: maintenant },
    sourceStatus: { bpe: "complete", osmInfrastructure: "complete", osmGreenSpaces: "complete" },
    sources: { bpeVersion: SOURCES_VERSION, osmFetchedAt: maintenant, osmQueryVersion: "osm-v4-2026-10-06", bpeMillesime: "2025" },
    sourcesVersion: SOURCES_VERSION, computedAt: maintenant,
  } as unknown as Face3Snapshot;
  const enAttente = {
    ...complet,
    osm: { potentiallyNoisyInfrastructure: [], nearestMappedGreenSpace: null, bboxRadiusMeters: 1500 },
    sourceStatus: { bpe: "complete", osmInfrastructure: "pending", osmGreenSpaces: "pending" },
  } as Face3Snapshot;
  const dossier = {
    id: `banc-autour-osm-${cle}`, user_id: "banc", ban_id: "17300_banc", insee: "17300",
    address_label: "Adresse de banc, 17000 La Rochelle", city: "La Rochelle", postcode: "17000",
    latitude: centre.lat, longitude: centre.lon, parcel_code: null, posture: "residence",
    place_relation: null, place_objective: null, snapshot: null,
    dpe_selection_status: "pending", selected_dpe_id: null, selected_dpe_snapshot: null, selected_dpe_at: null,
    dpe_selection_at: maintenant, created_at: maintenant, updated_at: maintenant,
    synthesis_text: null, synthesis_fact_hash: null, synthesis_generated_at: null,
    stripe_payment_intent_id: null, amount_paid_cents: null, purchased_at: null,
    replacement_for_dossier_id: null, replacement_reason: null, access_revoked_at: null,
  } as AddressDossierRow;
  const initial = cas.initial === "complete" ? complet : cas.initial === "pending" ? enAttente : null;
  return (
    <>
      <nav style={{ position: "relative", zIndex: 10, padding: "12px 16px", fontSize: 12, display: "flex", flexWrap: "wrap", gap: 8, background: "var(--bg-elev)" }}>
        <strong>Banc Autour · OSM · {cle}</strong>
        {Object.keys(CAS).map((c) => <Link key={c} href={`?cas=${c}`} style={{ fontWeight: c === cle ? 700 : 400 }}>{c}</Link>)}
      </nav>
      <Banc key={cle} dossier={dossier} initial={initial} reponses={[...cas.reponses]} complet={complet} />
    </>
  );
}
