"use client";

import Link from "next/link";
import type { DpeRecord } from "@/lib/dpe-attribution";
import { lectureAudit, type AuditApiRow, type AuditLookup, type AuditStatus } from "@/lib/audit-record";
import type { VoixAudit } from "@/lib/audit-lecture";
import {
  BAN_FIXTURE, DPE_APPARTEMENT, DPE_MAISON, IMMEUBLE, IMMEUBLE_COPRO, INCOMPLET, LOGEMENT, PLUSIEURS,
} from "@/lib/audit-lecture.fixtures";
import { EnergieSection, type DpeUiStatus } from "@/components/report/logement/EnergieSection";

function dpe(over: Partial<DpeRecord>): DpeRecord {
  return {
    id_dpe: "2575E0000BANC", date_dpe: "2025-07-04", id_ban: BAN_FIXTURE, adresse: null,
    etiquette_dpe: "F", etiquette_ges: "C", conso_ep_m2: 418.3, emission_ges_m2: 9.7,
    surface_m2: 194.7, annee_construction: 1900, type_batiment: "appartement",
    etage: "0", complement: null,
    confort_ete: null, traversant: null, protection_solaire: null, ventilation: null,
    inertie: null, isolation_toiture: null, brasseur_air: null,
    isolation_murs: null, isolation_menuiseries: null, methode_dpe: "dpe appartement individuel",
    ...over,
  } as DpeRecord;
}

const APPARTEMENT = dpe({});
const APPARTEMENT_LIE = dpe({ id_dpe: DPE_APPARTEMENT });
const MAISON = dpe({ id_dpe: DPE_MAISON, etiquette_dpe: "F", conso_ep_m2: 386, surface_m2: 112, type_batiment: "maison", methode_dpe: "dpe maison individuelle" });

type Cas = { titre: string; lignes: AuditApiRow[] | null; statut?: AuditStatus; dpeStatut: DpeUiStatus; retenu: DpeRecord | null; candidats?: DpeRecord[]; voix: VoixAudit };
const CAS: Record<string, Cas> = {
  logement: { titre: "Logement (maison, audit rattaché au DPE)", lignes: LOGEMENT, dpeStatut: "auto_confirmed", retenu: MAISON, voix: "achat" },
  immeuble: { titre: "Immeuble (appartement, DPE retenu)", lignes: IMMEUBLE, dpeStatut: "confirmed", retenu: APPARTEMENT, voix: "achat" },
  copro: { titre: "Immeuble en copropriété immatriculée", lignes: IMMEUBLE_COPRO, dpeStatut: "confirmed", retenu: APPARTEMENT, voix: "achat" },
  incomplet: { titre: "Information incomplète", lignes: INCOMPLET, dpeStatut: "confirmed", retenu: APPARTEMENT, voix: "achat" },
  plusieurs: { titre: "Trois audits à l'adresse", lignes: PLUSIEURS, dpeStatut: "confirmed", retenu: APPARTEMENT, voix: "achat" },
  "plusieurs-lie": { titre: "Trois audits, l'un rattaché au DPE retenu", lignes: PLUSIEURS, dpeStatut: "confirmed", retenu: APPARTEMENT_LIE, voix: "achat" },
  "sans-dpe": { titre: "Immeuble, diagnostic pas encore choisi", lignes: IMMEUBLE, dpeStatut: "selection_required", retenu: null, candidats: [APPARTEMENT, dpe({ id_dpe: "2575E0000BANC2", surface_m2: 61, etage: "2", etiquette_dpe: "E", conso_ep_m2: 309.6 })], voix: "neutre" },
  habitant: { titre: "Immeuble, lu par un habitant", lignes: IMMEUBLE, dpeStatut: "confirmed", retenu: APPARTEMENT, voix: "habitant" },
  panne: { titre: "Base des audits muette", lignes: null, statut: "unavailable", dpeStatut: "confirmed", retenu: APPARTEMENT, voix: "achat" },
};

function Section({ cas, ouvert }: { cas: Cas; ouvert: boolean }) {
  const lu: AuditLookup = cas.lignes ? lectureAudit(cas.lignes, BAN_FIXTURE) : { status: cas.statut === "unavailable" ? "unavailable" : "absent" };
  const present = lu.status === "present" ? lu : null;
  return (
    <EnergieSection
      dpeStatus={cas.dpeStatut}
      dpe={cas.retenu}
      audit={present?.audit ?? null}
      auditStatus={lu.status}
      autresAudits={present?.autres ?? []}
      autresAuditsIncomplets={present?.autresIncomplets ?? false}
      voixAudit={cas.voix}
      auditDetailsOuverts={ouvert}
      candidates={cas.candidats ?? (cas.retenu ? [cas.retenu] : [])}
      dossierId="banc"
      onPick={() => {}}
      onPickParNumero={() => {}}
      onNotInList={() => {}}
      onReselect={() => {}}
    />
  );
}

export function BancAudit({ cas, ouvert }: { cas: string | null; ouvert: boolean }) {
  const choisi = cas ? CAS[cas] : null;
  return (
    <main style={{ maxWidth: 920, margin: "0 auto", padding: "32px 16px 80px", display: "grid", gap: 20 }}>
      <nav style={{ display: "flex", flexWrap: "wrap", gap: 10, fontSize: 13 }}>
        {Object.entries(CAS).map(([k, c]) => (
          <Link key={k} href={`/dev/audit-energetique?cas=${k}${ouvert ? "&ouvert=1" : ""}`} style={{ color: k === cas ? "var(--fg-hi)" : "var(--fg-3)" }}>
            {c.titre}
          </Link>
        ))}
      </nav>
      {choisi ? <Section key={`${cas}-${ouvert}`} cas={choisi} ouvert={ouvert} /> : <p style={{ color: "var(--fg-3)" }}>Choisissez un cas.</p>}
    </main>
  );
}
