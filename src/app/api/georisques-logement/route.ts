import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/user-account";
import { getDossier } from "@/lib/address-dossier-store";
import { findCadastreParcelByPoint } from "@/lib/cadastre";
import {
  getGeorisquesAddressSummary,
  getGeorisquesParcelSummary,
  getGeorisquesSummary,
  fetchCavitesNearPoint,
  fetchMvtNearPoint,
} from "@/lib/georisques";
import { buildPointHazards, communalResidualFromLabels, isMvtFlagged } from "@/lib/point-hazards";
import { getAltitude } from "@/lib/ign";
import { fetchHeritageProtections } from "@/lib/gpu";
import { getDpeCandidatesByBanId, getDpeByCoordinates } from "@/lib/dpe";
import { validateSelectedBanAddress } from "@/lib/selected-ban-address";
import { getZfeForPoint } from "@/lib/zfe";
import { getAuditByBanId, getAuditByCoordinates } from "@/lib/audit";
import { getCartofrichesNearPoint, CARTOFRICHES_RAYON_RECHERCHE_M } from "@/lib/cartofriches";
import { getCommuneFullData } from "@/lib/commune-data";
import { getOnrnSinistralite } from "@/lib/onrn-sinistralite";
import { deriveLogementCoverage } from "@/lib/decision/logement-coverage";
import type { LogementReport } from "@/lib/logement-report-types";

// Cœur commun : construit le rapport à partir d'une adresse déjà résolue (géocodée en GET,
// sélectionnée en POST). Renvoie la LISTE des DPE candidats (pas un « plus récent » arbitraire)
// et le type de feature BAN, pour que le client décide l'attribution.
type ResolvedAddress = {
  id: string | null; label: string; city: string | null; citycode: string | null;
  postcode: string | null; latitude: number; longitude: number;
};

async function buildReport(address: ResolvedAddress, banFeatureType: string | null) {
    const parcel = await findCadastreParcelByPoint(
      address.longitude,
      address.latitude,
    ).catch(() => null);

    const [dpeCandidates, audit] = await Promise.all([
      address.id
        ? getDpeCandidatesByBanId(address.id).catch(() => [])
        : getDpeByCoordinates(address.latitude, address.longitude).then((d) => (d ? [d] : [])).catch(() => []),
      address.id
        ? getAuditByBanId(address.id).catch(() => null)
        : getAuditByCoordinates(address.latitude, address.longitude).catch(() => null),
    ]);

    const [georisquesCommune, altitude, zfe, cartofriches, communeData, sinistralite, cavites, mvt, heritage] = await Promise.all([
      address.citycode ? getGeorisquesSummary(address.citycode).catch(() => null) : null,
      getAltitude(address.latitude, address.longitude).catch(() => null),
      getZfeForPoint(address.latitude, address.longitude).catch(() => null),
      // AUTOUR DE L'ADRESSE, PLUS AUTOUR DE LA COMMUNE (29/07/2026). L'appel communal rendait
      // cinquante friches situées n'importe où dans la commune, SANS distance : « une friche
      // polluée quelque part à Nantes » n'est pas une information sur un logement nantais.
      //
      // Le rayon est une convention nommée et versionnée : cf. `CARTOFRICHES_RAYON_RECHERCHE_M`,
      // qui dit ce qu'il est (un périmètre de recherche) et ce qu'il n'est pas (un seuil sanitaire).
      getCartofrichesNearPoint(address.latitude, address.longitude, CARTOFRICHES_RAYON_RECHERCHE_M).catch(() => null),
      // AVEC LE POINT : les indicateurs IRIS décrivent alors le SECTEUR de l'adresse, pas la moyenne
      // de la commune. L'écart n'est pas cosmétique — La Rochelle centre affiche 7,3 % de HLM là où
      // la commune entière en affiche 31,1 %. `irisScope` dit toujours à quelle échelle lire.
      address.citycode
        ? getCommuneFullData(address.citycode, { lat: address.latitude, lon: address.longitude }).catch(() => null)
        : null,
      getOnrnSinistralite(address.citycode).catch(() => null),
      // Inventaires géolocalisés au point, en parallèle (jamais en série). Panne -> null.
      fetchCavitesNearPoint(address.latitude, address.longitude).catch(() => null),
      fetchMvtNearPoint(address.latitude, address.longitude).catch(() => null),
      // En parallèle, jamais en série : le GPU coûte ~641 ms et se fond dans le plus lent.
      fetchHeritageProtections(address.latitude, address.longitude).catch(
        () => ({ items: [], sourceStatus: "unavailable" as const }),
      ),
    ]);

    const georisquesAddress = process.env.GEORISQUES_API_TOKEN
      ? await getGeorisquesAddressSummary(address.latitude, address.longitude).catch(
          () => null,
        )
      : null;
    const georisquesParcel =
      process.env.GEORISQUES_API_TOKEN && parcel?.parcelCode
        ? await getGeorisquesParcelSummary(parcel.parcelCode).catch(() => null)
        : null;

    // Risques du bâti au grain point : cavités + mouvements de terrain géolocalisés, plus le résidu
    // communal (aléas GASPAR sans source fine). Les labels GASPAR au point donnent le signalement
    // communal MVT et le résidu ; la structuration vit dans la lib pure.
    const gasparLabels = georisquesAddress?.risks?.labels ?? [];
    const pointHazards = buildPointHazards({
      point: { lat: address.latitude, lon: address.longitude },
      radiusM: 500,
      cavites,
      mvt,
      communeFlaggedMvt: isMvtFlagged(gasparLabels),
      communalResidual: communalResidualFromLabels(gasparLabels),
    });

    // Typé par le contrat partagé : toute dérive route ↔ client casse ici, pas en silence.
    const report: LogementReport = {
      address,
      parcel,
      altitude,
      dpeCandidates,
      banFeatureType,
      audit,
      zfe,
      // IREP DÉBRANCHÉ LE 29/07/2026 — l'appel, pas la source. Les rejets industriels déclarés
      // étaient fetchés à chaque dossier, transportés dans le payload, et lus par AUCUN composant ni
      // aucune règle. Un appel réseau par dossier, une dépendance qui peut tomber, et surtout
      // l'impression que la dimension est couverte alors qu'elle ne s'affiche nulle part.
      //
      // RIEN N'EST PERDU : `src/lib/irep.ts` est intact et vivant — `/api/proxy/irep` s'en sert, et
      // `PollutionLookup` l'affiche sur /agir/pollutions-invisibles. Pour le rebrancher ici le jour
      // où un fait le lit, il suffit de rétablir `getIrepNearPoint(lat, lon)` dans le Promise.all
      // ci-dessus et le champ `irep` ici. Cf. le registre des sources dormantes du cadrage.
      cartofriches,
      communeData,
      sinistralite,
      georisques: {
        address: georisquesAddress,
        parcel: georisquesParcel,
        commune: georisquesCommune,
      },
      heritage,
      pointHazards,
      // LA COUVERTURE PAR FAMILLE, dérivée par la MÊME fonction que le moteur de décision. Le
      // module en tire les gestes « à vérifier » en évaluant les règles du dossier, au lieu d'en
      // tenir une copie qui divergeait (cf. `decision/logement-coverage.ts`).
      decision: deriveLogementCoverage({
        georisquesAddress,
        georisquesParcel,
        cavites,
        heritage,
        sinistralite,
      }),
      granularity: {
        geocoding: "address",
        cadastre: parcel ? "parcel" : null,
        georisques_address: georisquesAddress ? "point" : null,
        georisques_parcel: georisquesParcel ? "parcel" : null,
        georisques_commune: georisquesCommune ? "commune" : null,
      },
      caveat:
        georisquesParcel
          ? "Ce résultat combine une adresse géocodée BAN, une parcelle cadastrale issue d'API Carto, une lecture Géorisques v2 par parcelle, une lecture v2 au point géocodé et un résumé communal. Ce n'est pas encore un rapport ERRIAL complet, mais c'est la base serveur pour le module logement."
          : georisquesAddress
            ? "Ce résultat combine une adresse géocodée BAN, une lecture Géorisques v2 au point géocodé et un résumé communal. La lecture parcellaire complète n'est pas encore disponible pour cette adresse dans l'application."
            : "Ce résultat combine une adresse géocodée BAN et un résumé Géorisques communal. Pour activer la lecture Géorisques v2 au point géocodé et par parcelle, configurez GEORISQUES_API_TOKEN côté serveur.",
    };
    return NextResponse.json(report, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
}

// POST : adresse BAN sélectionnée avec précision (objet atomique validé). Chemin principal.
// (L'ancien GET `?q=` de repli géocodage libre a été retiré : non utilisé par le client, et il
// exposait le fan-out ~10 API externes sans authentification.)
export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { body = null; }
  const sel = validateSelectedBanAddress((body as { address?: unknown })?.address);
  if (!sel) {
    return NextResponse.json({ error: "Invalid selected address." }, { status: 400 });
  }

  // ROUTE LA PLUS COÛTEUSE DU PRODUIT (fan-out ~10 API externes dont le token Géorisques). Elle
  // était réservée au « rapport complet », un flag de plan global. Ce flag disparaissant, il faut
  // un droit d'un grain au moins aussi fin, sinon la route s'ouvre à tout compte connecté.
  //
  // Le droit exigé est le DOSSIER, et l'adresse analysée doit être CELLE du dossier : sans cette
  // seconde condition, un seul dossier payé servirait de laissez-passer pour analyser toutes les
  // adresses de France.
  const dossierId = (body as { dossierId?: unknown })?.dossierId;
  if (typeof dossierId !== "string" || !dossierId) {
    return NextResponse.json({ error: "dossierId requis" }, { status: 400 });
  }
  const { supabase, user } = await requireCurrentUser();
  const dossier = await getDossier(supabase, user.id, dossierId);
  if (!dossier) {
    return NextResponse.json({ error: "DOSSIER_NOT_ACCESSIBLE" }, { status: 403 });
  }
  if (dossier.ban_id !== sel.banId) {
    return NextResponse.json(
      { error: "ADDRESS_NOT_IN_DOSSIER", code: "ADDRESS_NOT_IN_DOSSIER" },
      { status: 403 },
    );
  }
  try {
    const address: ResolvedAddress = {
      id: sel.banId, label: sel.label, city: sel.city, citycode: sel.citycode,
      postcode: sel.postcode, latitude: sel.latitude, longitude: sel.longitude,
    };
    return await buildReport(address, sel.type);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to resolve Géorisques logement preview.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
