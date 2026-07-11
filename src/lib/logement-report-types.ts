// Contrat de la réponse de POST /api/georisques-logement, PARTAGÉ route ↔ client (source unique).
// Motif (board 2026-07-07, critique 5) : le type était recopié À LA MAIN dans LogementModule.tsx ;
// toute évolution de la route dérivait en silence. Ici, la route annote son payload avec ce type
// (dérive = erreur tsc) et le client le lit. Les sous-formes Géorisques/ONRN sont volontairement
// un SOUS-ENSEMBLE de ce que les libs renvoient : le client ne consomme que ces champs.

import type { DpeRecord } from "./dpe-attribution.ts";
import type { RegulatoryPlan } from "./pprn-zonage.ts";
import type { HeritageStatus } from "./gpu-servitudes.ts";
import type { OnrnSinistralite } from "./onrn-sinistralite.ts";
import type { PointHazards } from "./point-hazards.ts";

export type LogementReport = {
  error?: string;
  address?: { id: string | null; label: string; city: string | null; citycode: string | null; postcode: string | null; latitude: number; longitude: number; };
  altitude?: number | null;
  parcel?: { parcelCode: string; nomCommune: string | null; contenance: number | null; } | null;
  dpeCandidates?: DpeRecord[];
  banFeatureType?: string | null;
  audit?: {
    n_audit: string; date_audit: string | null; classe_dpe_actuel: string | null;
    scenarios: Array<{ categorie: string | null; etape: string | null; travaux: string | null; conso_ep: number | null; emission_ges: number | null; }>;
  } | null;
  zfe?: { inZfe: boolean; zones: Array<{ id: string; nom: string; vp_critair: string | null; deux_rm_critair: string | null; date_debut: string | null; date_fin: string | null; }>; } | null;
  irep?: { count: number; installations: Array<{ id: number; nom: string; distanceM: number; nombre_polluants: number; milieu_emission: string | null; }>; } | null;
  cartofriches?: { count: number; friches: Array<{ id: string; nom: string; type: string | null; statut: string | null; sol_pollue: boolean; activite: string | null; distanceM: number | null; }>; } | null;
  communeData?: {
    commune: {
      inseeCode: string; nom: string; population: number | null; vieillissement_pct: number | null;
      logements: { vacants_2022: number | null; vacants_pct: number | null; sociaux_2023: number | null; sociaux_pct: number | null; };
      qualite_air: { pm25: number | null; pm10: number | null; no2: number | null; o3: number | null; };
      economie: { revenu_median: number | null; inferiorite_nationale_pct: number | null; };
      sante: { acces_medecins: number | null; eloignement_services_pct: number | null; };
      territoire: { densite: number | null; incendies: number | null; taux_boisement: number | null; };
    };
    iris: {
      iris_count: number; passoires_taux: number | null; preca_energetique_pct: number | null;
      taux_propriete: number | null; taux_location: number | null; taux_hlm: number | null;
      taux_suroccupation: number | null; taux_motorisation: number | null; taux_transports_communs: number | null;
    } | null;
  } | null;
  georisques?: {
    address?: { risks: { labels: string[] }; pprn: { labels: string[] }; regulatoryPlans?: RegulatoryPlan[]; rga: { code: string | null; label: string | null } | null; seismic: { code: string | null; label: string | null } | null; } | null;
    parcel?: { parcelCode: string; risks: { labels: string[] }; pprn: { labels: string[]; zones: string[] }; regulatoryPlans?: RegulatoryPlan[]; rga: { code: string | null; label: string | null } | null; seismic: { code: string | null; label: string | null } | null; } | null;
    commune?: { communeName: string | null; riskLabels: string[]; seismic: { code: string | null; label: string | null } | null; } | null;
  };
  // Protections patrimoniales au point (AC1/AC2/AC4). Statut réglementaire, comme le PPRN :
  // re-fetché à chaque rendu, jamais snapshoté. `null` = non interrogé.
  heritage?: HeritageStatus | null;
  sinistralite?: OnrnSinistralite | null;
  // Risques du bâti au grain point (cavités, mouvements de terrain) + résidu communal. Comme le
  // reste de Géorisques : re-fetché à chaque rendu, jamais snapshoté. `null` = non interrogé.
  pointHazards?: PointHazards | null;
  // Métadonnées serveur portées sur le fil, non lues par le client (diagnostic / futur usage).
  granularity?: {
    geocoding: string; cadastre: string | null; georisques_address: string | null;
    georisques_parcel: string | null; georisques_commune: string | null;
  };
  caveat?: string;
};
