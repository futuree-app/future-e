import { NextResponse } from "next/server";
import { geocodeBanAddress } from "@/lib/ban";
import { findCadastreParcelByPoint } from "@/lib/cadastre";
import {
  getGeorisquesAddressSummary,
  getGeorisquesParcelSummary,
  getGeorisquesSummary,
} from "@/lib/georisques";
import { getAtmoForCommune } from "@/lib/atmo";

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

    const [georisquesCommune, atmo] = await Promise.all([
      address.citycode ? getGeorisquesSummary(address.citycode).catch(() => null) : null,
      address.citycode && process.env.ATMO_USERNAME
        ? getAtmoForCommune(address.citycode).catch(() => null)
        : null,
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
        atmo,
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
