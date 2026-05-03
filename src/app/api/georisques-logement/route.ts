import { NextResponse } from "next/server";
import { geocodeBanAddress } from "@/lib/ban";
import { findCadastreParcelByPoint } from "@/lib/cadastre";
import {
  getGeorisquesAddressSummary,
  getGeorisquesParcelSummary,
  getGeorisquesSummary,
} from "@/lib/georisques";
import { getAtmoForCommune } from "@/lib/atmo";
import { getAltitude } from "@/lib/ign";
import { getEaufranceSummary } from "@/lib/eaufrance";
import { getDpeByBanId, getDpeByCoordinates } from "@/lib/dpe";
import { getZfeForPoint } from "@/lib/zfe";
import { getIrepNearPoint } from "@/lib/irep";
import { getAuditByBanId, getAuditByCoordinates } from "@/lib/audit";
import { getCartofrichesForCommune } from "@/lib/cartofriches";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json(
      { error: "Missing q parameter." },
      { status: 400 },
    );
  }

  try {
    const address = await geocodeBanAddress(query);

    if (!address) {
      return NextResponse.json(
        { error: "Address not found in BAN." },
        { status: 404 },
      );
    }

    const parcel = await findCadastreParcelByPoint(
      address.longitude,
      address.latitude,
    ).catch(() => null);

    const [dpe, audit] = await Promise.all([
      address.id
        ? getDpeByBanId(address.id).catch(() => null)
        : getDpeByCoordinates(address.latitude, address.longitude).catch(() => null),
      address.id
        ? getAuditByBanId(address.id).catch(() => null)
        : getAuditByCoordinates(address.latitude, address.longitude).catch(() => null),
    ]);

    const [georisquesCommune, atmo, altitude, eaufrance, zfe, irep, cartofriches] = await Promise.all([
      address.citycode ? getGeorisquesSummary(address.citycode).catch(() => null) : null,
      address.citycode && process.env.ATMO_USERNAME
        ? getAtmoForCommune(address.citycode).catch(() => null)
        : null,
      getAltitude(address.latitude, address.longitude).catch(() => null),
      address.citycode ? getEaufranceSummary(address.citycode).catch(() => null) : null,
      getZfeForPoint(address.latitude, address.longitude).catch(() => null),
      getIrepNearPoint(address.latitude, address.longitude).catch(() => null),
      address.citycode ? getCartofrichesForCommune(address.citycode).catch(() => null) : null,
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
        dpe,
        audit,
        zfe,
        irep,
        cartofriches,
        atmo,
        eaufrance,
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
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to resolve Géorisques logement preview.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
