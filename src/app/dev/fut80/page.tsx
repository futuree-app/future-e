// FUT-80 · LE BÂTIMENT DANS LE VRAI MODULE LOGEMENT. DEV UNIQUEMENT : 404 en production.
//
// `LogementModule`, le composant de `/rapport/logement`, reçoit une VERSION de rapport construite à partir
// des réponses RÉELLES du RNB et de l'ADEME relevées le 26/10/2026 (`src/lib/__fixtures__/fut80/`), lues par
// les fonctions de production (`identiteDepuisRnb`, `toRecord`, `memeBatimentSeulement`). Il l'affiche telle
// quelle : aucune source appelée. Le dossier porte un geste daté, sauf `monchaux` où l'attribution
// automatique doit être REFUSÉE par le bâtiment, donc sans écriture non plus.
//
// `?cas=villeurbanne|la-couarde|thenac|monchaux|puyravault|bordeaux|ancien|la-rochelle|tronque`
// Revue indépendante du 26/10/2026 : `la-rochelle` (trois bâtiments, maison seule, dossier vierge : aucune
// attribution automatique ne doit partir) et `tronque` (Thénac, listes de l'adresse et du bâtiment tronquées).
import { notFound } from "next/navigation";
import LogementModule from "@/components/report/LogementModule";
import type { AddressDossierRow } from "@/lib/address-dossier-store";
import type { LogementReport } from "@/lib/logement-report-types";
import { toRecord } from "@/lib/dpe";
import { identiteDepuisRnb } from "@/lib/batiment-rnb";
import { memeBatimentHorsAdresse, memeBatimentSeulement } from "@/lib/dpe-meme-batiment";
import { casDeLogement, PROJET_TEMOIN } from "@/components/prototypes/fut87/fixture-logement";
import type { UserProject } from "@/lib/user-project";
import villeurbanne from "@/lib/__fixtures__/fut80/villeurbanne_angle.json";
import laCouarde from "@/lib/__fixtures__/fut80/la_couarde_maison.json";
import thenac from "@/lib/__fixtures__/fut80/thenac_contradiction.json";
import monchaux from "@/lib/__fixtures__/fut80/monchaux_auto.json";
import puyravault from "@/lib/__fixtures__/fut80/puyravault_ambigu.json";
import bordeaux from "@/lib/__fixtures__/fut80/bordeaux_aucun.json";
import laRochelle from "@/lib/__fixtures__/fut80/la_rochelle_trois_batiments.json";

type Fixture = { capture: string; ban: string; label: string; insee: string; rnb: unknown; ademe_adresse: unknown[]; ademe_batiment: unknown[] };
const CAS: Record<string, Fixture> = {
  villeurbanne, "la-couarde": laCouarde, thenac, monchaux, puyravault, bordeaux, ancien: villeurbanne,
  "la-rochelle": laRochelle, tronque: villeurbanne,
} as unknown as Record<string, Fixture>;

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const sp = await searchParams;
  const cle = sp.cas && CAS[sp.cas] ? sp.cas : "villeurbanne";
  const f = CAS[cle];
  const base = casDeLogement("sans-dpe").rapport;
  const lire = (lignes: unknown[]) => lignes.map((l) => toRecord(l as Parameters<typeof toRecord>[0]));
  const adresse = lire(f.ademe_adresse);
  const batiment = identiteDepuisRnb(f.rnb, f.capture);
  const tronque = cle === "tronque";
  const memeBatiment = batiment.statut === "confirme"
    ? memeBatimentHorsAdresse({ status: "present", candidates: memeBatimentSeulement(lire(f.ademe_batiment), f.ban), tronque }, adresse)
    : undefined;
  const ancien = cle === "ancien";
  // `tronque` : la liste de l'adresse est celle de Thénac, annoncée incomplète.
  const listeAdresse = tronque ? lire(thenac.ademe_adresse as unknown[]).slice(0, 12) : adresse;
  const rapport: LogementReport = {
    ...base,
    address: { ...base.address!, id: f.ban, label: f.label, citycode: f.insee },
    banFeatureType: "housenumber",
    dpeCandidates: listeAdresse,
    dpeCandidatesStatus: listeAdresse.length > 0 ? "present" : "absent",
    ...(tronque ? { dpeCandidatesTronque: true as const } : {}),
    // `ancien` : un rapport écrit avant FUT-80, sans aucun des deux champs.
    ...(ancien ? {} : { batiment, ...(memeBatiment ? { dpeMemeBatiment: memeBatiment } : {}) }),
    version: { numero: 1, collecteeLe: f.capture, sourcesAbsentes: [], synthese: null, syntheseHash: null },
  };
  const maintenant = "2026-10-26T12:00:00.000Z";
  const dossier = {
    id: `banc-fut80-${cle}`, user_id: "banc", ban_id: f.ban, insee: f.insee,
    address_label: f.label, city: null, postcode: null,
    latitude: 0, longitude: 0, parcel_code: null, posture: "residence",
    place_relation: null, place_objective: null, snapshot: null,
    dpe_selection_status: "pending", selected_dpe_id: null, selected_dpe_snapshot: null, selected_dpe_at: null,
    // Un geste daté : rien ne s'attribue seul, donc rien ne s'écrit. Sauf `monchaux`, dont la maison seule
    // serait retenue d'office sans le bâtiment : c'est la règle même qu'on veut voir refuser.
    // `la-rochelle` de même : trois bâtiments, la maison seule ne doit pas non plus être retenue.
    dpe_selection_at: cle === "monchaux" || cle === "la-rochelle" ? null : maintenant,
    created_at: maintenant, updated_at: maintenant,
    synthesis_text: null, synthesis_fact_hash: null, synthesis_generated_at: null,
    stripe_payment_intent_id: null, amount_paid_cents: null, purchased_at: null,
    replacement_for_dossier_id: null, replacement_reason: null, access_revoked_at: null,
  } as AddressDossierRow;
  return <LogementModule dossier={dossier} project={PROJET_TEMOIN as unknown as UserProject} versionInitiale={rapport} defaultCommune={null} />;
}
