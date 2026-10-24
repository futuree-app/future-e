"use client";

import { useState } from "react";
import Link from "next/link";
import type { DpeRecord } from "@/lib/dpe-attribution";
import { EnergieSection, type DpeUiStatus } from "@/components/report/logement/EnergieSection";
import { dpeDuLogement } from "@/lib/dpe-grain";
import {
  GENERES_SEULS, IMMEUBLE_ET_GENERES_SANS_COMPLEMENT, IMMEUBLE_ET_INDIVIDUELS, IMMEUBLE_SEUL, dpe as dpeFut74,
} from "@/lib/dpe-grain.fixtures";

function dpe(over: Partial<DpeRecord>): DpeRecord {
  return {
    id_dpe: "2517E0000000A", date_dpe: "2025-03-12", id_ban: null, adresse: null,
    etiquette_dpe: "C", etiquette_ges: "B", conso_ep_m2: 142, emission_ges_m2: 21,
    surface_m2: 29.5, annee_construction: 1972, type_batiment: "appartement",
    etage: "0", complement: null,
    confort_ete: null, traversant: null, protection_solaire: null, ventilation: null,
    inertie: null, isolation_toiture: null, brasseur_air: null,
    isolation_murs: null, isolation_menuiseries: null, methode_dpe: "dpe appartement individuel",
    ...over,
  } as DpeRecord;
}

// L'adresse du ticket : 34 diagnostics, 31 identifiés (« Bâtiment B B105 »), classes C à F, 2023 à 2025.
const CLASSES = ["C", "D", "E", "F"] as const;
const TRENTE_QUATRE = Array.from({ length: 34 }, (_, i) => dpe({
  id_dpe: `25${String(i).padStart(2, "0")}E00000${i}X`,
  complement: i < 31 ? `Bâtiment B B${100 + i}` : null,
  surface_m2: 20 + ((i * 7) % 60) + 0.5,
  etiquette_dpe: CLASSES[i % 4],
  date_dpe: `${2023 + (i % 3)}-06-01`,
}));
const TROIS = [
  dpe({ id_dpe: "2417E1", complement: "Appartement 12", surface_m2: 63, etage: "2", etiquette_dpe: "C" }),
  dpe({ id_dpe: "2417E2", complement: "Appartement 14", surface_m2: 48.2, etage: "3", etiquette_dpe: "D", date_dpe: "2023-11-02" }),
  dpe({ id_dpe: "2417E3", complement: null, surface_m2: 71, etiquette_dpe: "E", date_dpe: "2022-01-20" }),
];
const UN = [dpe({ id_dpe: "2417E9", complement: "Porte C04", surface_m2: 27.3, etiquette_dpe: "D" })];
const MAISON = dpe({ id_dpe: "2417M1", type_batiment: "maison", surface_m2: 112, etiquette_dpe: "D", complement: null });
const AVEC_IMMEUBLE = [
  ...TRENTE_QUATRE.slice(0, 9),
  dpe({ id_dpe: "2417IM", complement: null, etage: null, surface_m2: 2140, type_batiment: "immeuble", methode_dpe: "dpe immeuble collectif", etiquette_dpe: "D" }),
];

// FUT-74 : les formes relevées sur la base réelle le 24/10/2026 (identifiants inventés).
const IMMEUBLE_DATE = { ...IMMEUBLE_SEUL[0], date_dpe: "2026-10-19", nombre_appartements: 10, surface_immeuble_m2: 374.3 };
const GENERE_NON_VISITE = dpeFut74({
  id_dpe: "FUT74GEN00099", methode_dpe: "dpe appartement généré à partir des données DPE immeuble",
  appartement_non_visite: true, etiquette_dpe: "D", complement: "Lot : 900009 - Porte : 21",
});

type Cas = { titre: string; statut: DpeUiStatus; candidats: DpeRecord[]; retenu?: DpeRecord; baseMuette?: boolean; partielle?: boolean };
const CAS: Record<string, Cas> = {
  "1": { titre: "Un diagnostic, à confirmer", statut: "selection_required", candidats: UN },
  "3": { titre: "Trois diagnostics", statut: "selection_required", candidats: TROIS },
  "34": { titre: "34 diagnostics (le cas du ticket)", statut: "selection_required", candidats: TRENTE_QUATRE },
  immeuble: { titre: "Dix diagnostics dont un d'immeuble", statut: "selection_required", candidats: AVEC_IMMEUBLE },
  partielle: { titre: "Liste partielle (un jeu ADEME tombé)", statut: "selection_required", candidats: TROIS, partielle: true },
  refus: { titre: "« Aucun ne correspond » (not_in_list)", statut: "rejected", candidats: TRENTE_QUATRE },
  aucun: { titre: "Aucun diagnostic à l'adresse (not_found)", statut: "not_found", candidats: [] },
  panne: { titre: "Base ADEME muette", statut: "not_found", candidats: [], baseMuette: true },
  auto: { titre: "Retenu automatiquement (maison)", statut: "auto_confirmed", candidats: [MAISON], retenu: MAISON },
  choisi: { titre: "Choisi par le lecteur", statut: "confirmed", candidats: TRENTE_QUATRE, retenu: TRENTE_QUATRE[5] },
  "fut74-generes": { titre: "FUT-74 · L'immeuble et six appartements générés", statut: "selection_required", candidats: IMMEUBLE_ET_GENERES_SANS_COMPLEMENT },
  "fut74-generes-lots": { titre: "FUT-74 · Trois appartements générés, sans immeuble", statut: "selection_required", candidats: GENERES_SEULS },
  "fut74-individuels": { titre: "FUT-74 · L'immeuble et trois appartements individuels", statut: "selection_required", candidats: IMMEUBLE_ET_INDIVIDUELS },
  "fut74-immeuble-seul": { titre: "FUT-74 · Le DPE de l'immeuble, seul", statut: "selection_required", candidats: [IMMEUBLE_DATE] },
  "fut74-ancien-choix": { titre: "FUT-74 · Un DPE d'immeuble retenu avant le correctif", statut: "confirmed", candidats: [IMMEUBLE_DATE, ...GENERES_SEULS], retenu: IMMEUBLE_DATE },
  "fut74-genere-retenu": { titre: "FUT-74 · Un appartement généré, non visité, retenu", statut: "confirmed", candidats: [GENERE_NON_VISITE], retenu: GENERE_NON_VISITE },
};

function Section({ cas }: { cas: Cas }) {
  const [statut, setStatut] = useState<DpeUiStatus>(cas.statut);
  const [retenu, setRetenu] = useState<DpeRecord | null>(cas.retenu ?? null);
  // La même lecture que `LogementModule` : un DPE retenu qui ne porte pas sur un logement est écarté.
  const dpeConfirme = statut === "auto_confirmed" || statut === "confirmed" ? retenu : null;
  const dpeAffiche = dpeDuLogement(dpeConfirme);
  return (
    <EnergieSection
      dpeStatus={statut}
      dpe={dpeAffiche}
      dpeEcarte={dpeConfirme && !dpeAffiche ? dpeConfirme : null}
      audit={null}
      candidates={cas.candidats}
      dpeNonVerifiable={cas.baseMuette ?? false}
      listeDpeIncomplete={cas.partielle ?? false}
      dossierId="banc"
      onPick={(d) => { setRetenu(d); setStatut("confirmed"); }}
      onPickParNumero={(d) => { setRetenu(d); setStatut("confirmed"); }}
      onNotInList={() => { setRetenu(null); setStatut("rejected"); }}
      onReselect={() => { setRetenu(null); setStatut("selection_required"); }}
    />
  );
}

export function BancDpe({ cas }: { cas: string | null }) {
  const choisi = cas ? CAS[cas] : null;
  return (
    <main style={{ maxWidth: 920, margin: "0 auto", padding: "32px 16px 80px", display: "grid", gap: 20 }}>
      <nav style={{ display: "flex", flexWrap: "wrap", gap: 10, fontSize: 13 }}>
        {Object.entries(CAS).map(([k, c]) => (
          <Link key={k} href={`/dev/dpe-selection?cas=${k}`} style={{ color: k === cas ? "var(--fg-hi)" : "var(--fg-3)" }}>
            {c.titre}
          </Link>
        ))}
      </nav>
      {choisi ? <Section key={cas} cas={choisi} /> : <p style={{ color: "var(--fg-3)" }}>Choisissez un cas.</p>}
    </main>
  );
}
