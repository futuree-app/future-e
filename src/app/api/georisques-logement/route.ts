import { NextResponse } from "next/server";
import { geocodeBanAddress } from "@/lib/ban";
import { findCadastreParcelByPoint } from "@/lib/cadastre";
import {
  getGeorisquesAddressSummary,
  getGeorisquesParcelSummary,
  getGeorisquesSummary,
} from "@/lib/georisques";
import { getAltitude } from "@/lib/ign";
import { getDpeCandidatesByBanId, getDpeByCoordinates } from "@/lib/dpe";
import { validateSelectedBanAddress } from "@/lib/selected-ban-address";
import { getZfeForPoint } from "@/lib/zfe";
import { getIrepNearPoint } from "@/lib/irep";
import { getAuditByBanId, getAuditByCoordinates } from "@/lib/audit";
import { getCartofrichesForCommune } from "@/lib/cartofriches";
import { getCommuneFullData } from "@/lib/commune-data";
import { getOnrnSinistralite } from "@/lib/onrn-sinistralite";

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

    const [georisquesCommune, altitude, zfe, irep, cartofriches, communeData, sinistralite] = await Promise.all([
      address.citycode ? getGeorisquesSummary(address.citycode).catch(() => null) : null,
      getAltitude(address.latitude, address.longitude).catch(() => null),
      getZfeForPoint(address.latitude, address.longitude).catch(() => null),
      getIrepNearPoint(address.latitude, address.longitude).catch(() => null),
      address.citycode ? getCartofrichesForCommune(address.citycode).catch(() => null) : null,
      address.citycode ? getCommuneFullData(address.citycode).catch(() => null) : null,
      getOnrnSinistralite(address.citycode).catch(() => null),
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

    return NextResponse.json(
      {
        address,
        parcel,
        altitude,
        dpeCandidates,
        banFeatureType,
        audit,
        zfe,
        irep,
        cartofriches,
        communeData,
        sinistralite,
        georisques: {
          address: georisquesAddress,
          parcel: georisquesParcel,
          commune: georisquesCommune,
        },
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
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      },
    );
}

// GET (repli) : géocodage libre `?q=`. Ne doit plus écraser une sélection BAN explicite (POST).
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  if (!query) {
    return NextResponse.json({ error: "Missing q parameter." }, { status: 400 });
  }
  try {
    const address = await geocodeBanAddress(query);
    if (!address) {
      return NextResponse.json({ error: "Address not found in BAN." }, { status: 404 });
    }
    return await buildReport(address, address.type);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to resolve Géorisques logement preview.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST : adresse BAN sélectionnée avec précision (objet atomique validé). Chemin principal.
export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { body = null; }
  const sel = validateSelectedBanAddress((body as { address?: unknown })?.address);
  if (!sel) {
    return NextResponse.json({ error: "Invalid selected address." }, { status: 400 });
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
