// FUT-62 · L'AUDIT DANS LE VRAI MODULE LOGEMENT. DEV UNIQUEMENT : 404 en production.
//
// Le banc voisin (`/dev/audit-energetique`) monte la section Énergie seule. Ici, c'est `LogementModule`
// lui-même, le composant de `/rapport/logement`, qui reçoit une VERSION de rapport (FUT-13) : il l'affiche
// telle quelle et n'appelle aucune source. Le dossier porte un diagnostic déjà retenu par le lecteur, donc
// aucune écriture de sélection. La relation déclarée et l'intention se règlent par l'URL, pour vérifier
// le câblage réel de la voix (`voixAudit(project?.intent, relationDeLAdresse(dossier))`).
//
// Aucune génération : la synthèse n'a pas de texte enregistré, et le serveur de dev de ce banc n'a ni
// clé de modèle ni base réelle. Elle s'affiche donc en échec, ce qui est attendu ici.
//
// `?cas=immeuble|logement|plusieurs|sans-dpe&relation=lives_here|studying&objectif=buy|rent|understand|other&intent=achat|location`
import { notFound } from "next/navigation";
import LogementModule from "@/components/report/LogementModule";
import type { AddressDossierRow } from "@/lib/address-dossier-store";
import type { DpeRecord } from "@/lib/dpe-attribution";
import type { LogementReport } from "@/lib/logement-report-types";
import { lectureAudit, type AuditApiRow } from "@/lib/audit-record";
import { isAddressObjective, isAddressRelation } from "@/lib/relation-au-lieu";
import { casDeLogement, PROJET_TEMOIN } from "@/components/prototypes/fut87/fixture-logement";
import { BAN_FIXTURE, DPE_MAISON, IMMEUBLE, LOGEMENT, PLUSIEURS } from "@/lib/audit-lecture.fixtures";
import type { UserProject } from "@/lib/user-project";

const CAS: Record<string, { lignes: AuditApiRow[]; maison: boolean; dpeRetenu: boolean }> = {
  immeuble: { lignes: IMMEUBLE, maison: false, dpeRetenu: true },
  logement: { lignes: LOGEMENT, maison: true, dpeRetenu: true },
  plusieurs: { lignes: PLUSIEURS, maison: false, dpeRetenu: true },
  "sans-dpe": { lignes: IMMEUBLE, maison: false, dpeRetenu: false },
};

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const sp = await searchParams;
  const cas = CAS[sp.cas ?? "immeuble"] ?? CAS.immeuble;
  const base = casDeLogement(cas.maison ? "temoin" : "immeuble");
  const dpe: DpeRecord = cas.maison ? { ...base.dpe!, id_dpe: DPE_MAISON } : base.dpe!;
  const lu = lectureAudit(cas.lignes, BAN_FIXTURE);
  const rapport: LogementReport = {
    ...base.rapport,
    dpeCandidates: cas.dpeRetenu ? [dpe] : [dpe, { ...dpe, id_dpe: "2575E0000BANC2", surface_m2: 61, etage: "2" }],
    audit: lu.status === "present" ? lu.audit : null,
    auditStatus: lu.status,
    ...(lu.status === "present" && lu.autres?.length ? { autresAudits: lu.autres, autresAuditsIncomplets: false } : {}),
    version: { numero: 1, collecteeLe: "2026-10-15T09:00:00.000Z", sourcesAbsentes: [], synthese: null, syntheseHash: null },
  };
  const maintenant = "2026-10-15T09:00:00.000Z";
  const dossier = {
    id: "banc-fut62", user_id: "banc", ban_id: BAN_FIXTURE, insee: "00000",
    address_label: rapport.address?.label ?? "Adresse témoin", city: rapport.address?.city ?? null, postcode: "00000",
    latitude: 0, longitude: 0, parcel_code: null, posture: "residence",
    place_relation: isAddressRelation(sp.relation) ? sp.relation : null,
    place_objective: isAddressObjective(sp.objectif) ? sp.objectif : null,
    snapshot: null,
    dpe_selection_status: cas.dpeRetenu ? "user_confirmed" : "pending",
    selected_dpe_id: cas.dpeRetenu ? dpe.id_dpe : null,
    selected_dpe_snapshot: cas.dpeRetenu ? dpe : null,
    selected_dpe_at: cas.dpeRetenu ? maintenant : null,
    // Une date de geste : un dossier « pending » daté ne s'attribue rien tout seul (donc n'écrit rien).
    dpe_selection_at: maintenant,
    created_at: maintenant, updated_at: maintenant,
    synthesis_text: null, synthesis_fact_hash: null, synthesis_generated_at: null,
    stripe_payment_intent_id: null, amount_paid_cents: null, purchased_at: null,
    replacement_for_dossier_id: null, replacement_reason: null, access_revoked_at: null,
  } as AddressDossierRow;
  const project = { ...PROJET_TEMOIN, intent: sp.intent === "achat" || sp.intent === "location" ? sp.intent : null } as unknown as UserProject;
  return <LogementModule dossier={dossier} project={project} versionInitiale={rapport} defaultCommune={null} />;
}
