// ════════════════════════════════════════════════════════════════════════════
// Comparateur de vie · MATCH
// POST { parsed } → territoires compatibles (déterministe, 0 IA, 0 appel externe).
//
// Lit l'index national pré-calculé et applique filtre dur + scoring pondéré.
// Toujours instantané et gratuit : aucun LLM, aucune API par commune.
// ════════════════════════════════════════════════════════════════════════════

import { NextResponse, type NextRequest } from "next/server";
import { matchProjects, type ParsedProject } from "@/lib/comparateur-vie";

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
    // VERROU : la matrice complète et les pistes sont payantes (Pack Décision).
    // On ne les expose jamais dans la réponse gratuite, et on borne les résultats
    // au top 3 (la CompareView gratuite n'affiche que le trio).
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { comparaisonComplete: _cc, pistes: _p, ...safe } = outcome;
    return NextResponse.json({ ...safe, results: outcome.results.slice(0, 3) });
  } catch (error) {
    console.error("[comparateur-vie/match]", error);
    return NextResponse.json({ error: "Erreur lors du calcul des territoires." }, { status: 500 });
  }
}
