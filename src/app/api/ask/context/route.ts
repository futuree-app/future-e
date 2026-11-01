// GET /api/ask/context?insee=XXXXX
// Pré-warm fire-and-forget : déclenche les fetches ADEME + DRIAS + Hub'Eau
// pour que la première vraie question de la session bénéficie déjà du cache
// framework. Renvoie seulement une indication d'availability, pas les données.
//
// FUT-163 (contre-revue de la PR #124, 01/11/2026) : le pré-warm déclenche aussi la lecture de l'eau potable,
// une à plusieurs dizaines d'appels Hub'Eau par commune (16 réseaux à Marseille). Il applique donc les MÊMES
// gardes que la question elle-même (`/api/ask`) : limite par adresse réseau (sur ses propres compteurs, pour
// ne pas entamer ceux des questions), code INSEE bien formé, et territoire ouvert sur le compte (résidence ou
// `canAccessTerritory`). Sans elles, un compte connecté pouvait faire lire n'importe quelle commune en boucle.

import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { canAccessTerritory } from "@/lib/active-territory";
import { gatherCommuneEnrichment } from "@/lib/commune-enrichment";
import { limiteParAdresse } from "@/lib/server/garde-appels-modele";

const CODE_INSEE = /^(\d{5}|2[AB]\d{3})$/;

export async function GET(request: NextRequest) {
  const tropVite = limiteParAdresse(request, "ask-context:");
  if (tropVite) return tropVite;

  const { searchParams } = new URL(request.url);
  const insee = searchParams.get("insee")?.trim().toUpperCase();
  if (!insee) {
    return NextResponse.json({ error: "insee requis." }, { status: 400 });
  }
  if (!CODE_INSEE.test(insee)) {
    return NextResponse.json({ error: "insee invalide." }, { status: 400 });
  }

  // Auth check (on ne veut pas qu'un anonyme déclenche des fetches ADEME en boucle)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  // Le même contrat que `/api/ask` : la résidence, ou un territoire réellement ouvert sur le compte.
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("home_insee_code")
    .eq("user_id", user.id)
    .maybeSingle();
  const rawResidence = (profile as Record<string, unknown> | null)?.home_insee_code;
  const residenceInsee = typeof rawResidence === "string" ? rawResidence.trim().toUpperCase() : "";
  if (insee !== residenceInsee && !(await canAccessTerritory(supabase, user.id, insee))) {
    return NextResponse.json({ error: "Ce territoire n'est pas débloqué sur votre compte." }, { status: 403 });
  }

  const enrichment = await gatherCommuneEnrichment(insee, { avecEauPotable: true });

  return NextResponse.json({
    ok: true,
    has: {
      ademe: enrichment.ademe !== null,
      drias: enrichment.drias !== null,
      eau: enrichment.eau !== null,
      eauPotable: enrichment.eauPotable != null && enrichment.eauPotable.etat !== "indisponible",
    },
  });
}
