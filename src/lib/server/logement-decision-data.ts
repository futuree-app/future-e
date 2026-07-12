// Données de décision Logement (lean) : appelle les fetchers BAS NIVEAU directement, ce qui donne le
// STATUT par famille (present / none / unavailable) — la donnée le porte déjà (heritage.sourceStatus,
// 4 kinds sinistralité, null/[] cavités).
// Fraîcheur (honnête) : on re-fetch depuis la source vivante, JAMAIS on ne persiste/fige en base
// (doctrine « jamais snapshoté »). Deux caches EXISTENT en amont, délibérés et PARTAGÉS avec le
// module, qu'on conserve pour ne pas diverger : un cache mémoire de process (getGeorisquesAddressSummary)
// et un cache Next 24h sur le fetch Géorisques (limites de débit). Donc « re-fetché, cache ≤ 24h »,
// pas « frais à chaque rendu ». Aucun cache CDN de route (appel direct).
import { findCadastreParcelByPoint } from "@/lib/cadastre";
import { getGeorisquesAddressSummary, getGeorisquesParcelSummary, fetchCavitesNearPoint } from "@/lib/georisques";
import { fetchHeritageProtections } from "@/lib/gpu";
import { getOnrnSinistralite } from "@/lib/onrn-sinistralite";

export type ResolvedAddress = {
  id: string | null; label: string; city: string | null; citycode: string | null;
  postcode: string | null; latitude: number; longitude: number;
};
export type SourceCoverage = "present" | "none" | "unavailable"; // none = source a répondu, rien trouvé

export type LogementDecisionData = {
  rga: { coverage: SourceCoverage; label: string | null };
  pprn: { coverage: SourceCoverage; count: number; label: string | null };
  cavites: { coverage: SourceCoverage; count: number };
  patrimoine: { coverage: SourceCoverage; count: number };
  sinistralite: { coverage: SourceCoverage; active: boolean };
  fetchedAt: string;
};

export class LogementDataUnavailableError extends Error {
  constructor(public readonly reason: "timeout" | "upstream_error" | "insufficient_address") {
    super(`logement-data-unavailable:${reason}`);
    this.name = "LogementDataUnavailableError";
  }
}

export async function fetchLogementDecisionData(address: ResolvedAddress): Promise<LogementDecisionData> {
  if (address.latitude == null || address.longitude == null) throw new LogementDataUnavailableError("insufficient_address");
  const token = process.env.GEORISQUES_API_TOKEN;
  const parcel = await findCadastreParcelByPoint(address.longitude, address.latitude).catch(() => null);
  const [gAddr, gParcel, cavites, heritage, sini] = await Promise.all([
    token ? getGeorisquesAddressSummary(address.latitude, address.longitude).catch(() => null) : Promise.resolve(null),
    token && parcel?.parcelCode ? getGeorisquesParcelSummary(parcel.parcelCode).catch(() => null) : Promise.resolve(null),
    fetchCavitesNearPoint(address.latitude, address.longitude), // [] vide | [...] | null (panne)
    fetchHeritageProtections(address.latitude, address.longitude).catch(() => ({ items: [], sourceStatus: "unavailable" as const })),
    address.citycode ? getOnrnSinistralite(address.citycode).catch(() => null) : Promise.resolve(null),
  ]);

  const rgaLabel = gParcel?.rga?.label ?? gAddr?.rga?.label ?? null; // champ par champ : parcelle puis adresse
  const plans = gParcel?.regulatoryPlans ?? gAddr?.regulatoryPlans ?? [];
  const topPlan = plans.length ? plans.reduce((a, b) => (a.topRegimeRank <= b.topRegimeRank ? a : b)) : null; // le plus contraignant
  const georisquesDown = gAddr == null && gParcel == null; // résumé indisponible (token absent ou panne)

  const siniActive = sini != null && [sini.secheresse.kind, sini.inondation.kind].some((k) => k === "lecture" || k === "faible_repr");
  const siniDown = sini == null || (sini.secheresse.kind === "indispo" && sini.inondation.kind === "indispo");

  return {
    rga: { coverage: georisquesDown ? "unavailable" : rgaLabel ? "present" : "none", label: rgaLabel },
    pprn: { coverage: georisquesDown ? "unavailable" : plans.length > 0 ? "present" : "none", count: plans.length, label: topPlan?.plan ?? null },
    cavites: { coverage: cavites == null ? "unavailable" : cavites.length > 0 ? "present" : "none", count: cavites?.length ?? 0 },
    patrimoine: { coverage: heritage.sourceStatus === "unavailable" ? "unavailable" : heritage.items.length > 0 ? "present" : "none", count: heritage.items.length },
    sinistralite: { coverage: siniDown ? "unavailable" : siniActive ? "present" : "none", active: siniActive },
    fetchedAt: new Date().toISOString(),
  };
}

// Timeout d'AFFICHAGE (Promise.race) : les appels sous-jacents continuent (annulation par AbortSignal
// = suite documentée). Rejette avec une erreur typée, seule captée par l'augmentation.
// 10 s : généreux car l'augmentation est STREAMÉE (non bloquante, le dossier commune est déjà lisible) ;
// en prod le cache Géorisques 24h rend les appels rapides. Au-delà -> repli "unavailable".
export function fetchLogementDecisionDataWithTimeout(address: ResolvedAddress, ms = 10000): Promise<LogementDecisionData> {
  return Promise.race([
    fetchLogementDecisionData(address).catch((e) => {
      if (e instanceof LogementDataUnavailableError) throw e;
      throw new LogementDataUnavailableError("upstream_error");
    }),
    new Promise<never>((_, reject) => setTimeout(() => reject(new LogementDataUnavailableError("timeout")), ms)),
  ]);
}
