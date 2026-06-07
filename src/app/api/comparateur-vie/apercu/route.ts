// ════════════════════════════════════════════════════════════════════════════
// Comparateur de vie · APERÇU (teaser Pack Décision)
// POST { parsed } → comparaison complète TRONQUÉE (2 thèmes). Jamais le complet :
// la matrice intégrale n'a aucun endpoint d'API, elle n'est rendue que côté
// serveur pour un acheteur vérifié (cf. page pack-decision).
// ════════════════════════════════════════════════════════════════════════════

import { NextResponse, type NextRequest } from "next/server";
import { matchProjects, truncateComparaison, type ParsedProject } from "@/lib/comparateur-vie";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let parsed: ParsedProject;
  try {
    ({ parsed } = await request.json());
  } catch {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }
  if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.preferences)) {
    return NextResponse.json({ error: "Projet structuré manquant ou invalide." }, { status: 400 });
  }
  if (!parsed.hardConstraints || typeof parsed.hardConstraints !== "object") {
    parsed.hardConstraints = {};
  }

  try {
    const outcome = await matchProjects(parsed);
    return NextResponse.json({
      apercu: truncateComparaison(outcome.comparaisonComplete),
      trio: outcome.results.slice(0, 3).map((r) => ({ insee: r.insee, nom: r.nom })),
    });
  } catch (error) {
    console.error("[comparateur-vie/apercu]", error);
    return NextResponse.json({ error: "Erreur lors du calcul de l'aperçu." }, { status: 500 });
  }
}
