// ════════════════════════════════════════════════════════════════════════════
// Comparateur de vie · ANCHOR (Phase B — entrée guidée « partez d'une commune »)
// POST { insee, removedKeys? } -> dérivation d'ancre assemblée en ParsedProject
// (préférences gardées + reformulation honnête + exclusion de l'ancre), prête pour
// /match. Toute la phraséologie et l'assemblage restent serveur (pas de duplication
// client). ANCRAGE, pas similarité ; moteur inchangé. cf. spec Phase B.
// ════════════════════════════════════════════════════════════════════════════

import { NextResponse, type NextRequest } from "next/server";
import {
  getCommuneEntry,
  deriveAnchorPreferences,
  anchorReformulationSuffix,
  type ParsedProject,
} from "@/lib/comparateur-vie";
import { isArrondissement } from "@/lib/communes";

export const runtime = "nodejs";

const SIZE_KEY = "__size";

// Réponse « ancre illisible » : PLM (par arrondissement, ou code commune hors index) ou
// commune inconnue. On ne propose rien plutôt qu'une ancre fausse (cf. spec Phase B / A.5).
const NOT_FOUND = {
  found: false,
  nom: "",
  chips: [] as { key: string; text: string }[],
  parsed: { reformulation: "", hardConstraints: {}, preferences: [] } as ParsedProject,
};

export async function POST(request: NextRequest) {
  let insee: string;
  let removedKeys: string[];
  try {
    const body = await request.json();
    insee = String(body?.insee ?? "");
    removedKeys = Array.isArray(body?.removedKeys) ? body.removedKeys.map(String) : [];
  } catch {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }
  if (!insee.trim()) {
    return NextResponse.json({ error: "Commune manquante." }, { status: 400 });
  }

  // Arrondissement PLM en direct (l'autocomplete les filtre déjà, défense en profondeur) :
  // la taille/identité d'un arrondissement n'est pas une ancre honnête -> illisible.
  if (isArrondissement(insee.trim())) {
    return NextResponse.json(NOT_FOUND);
  }

  // Code commune hors index (dont Paris/Lyon/Marseille en code commune) : ancre illisible.
  const entry = await getCommuneEntry(insee.trim());
  if (!entry) {
    return NextResponse.json(NOT_FOUND);
  }

  const removed = new Set(removedKeys);
  const deriv = deriveAnchorPreferences([entry]);

  const preferences = deriv.preferences.filter((p) => !removed.has(p.key));
  const traits = deriv.traits.filter((t) => !removed.has(t.key));
  const keepSize = deriv.communeSize != null && !removed.has(SIZE_KEY);
  // Préférences RETIRÉES (hors sentinel taille) : à ne pas re-surfacer en récit (découverte/
  // signaux), sinon un trait que l'utilisateur a décoché réapparaît dans les cartes.
  const suppressNarrativeKeys = deriv.preferences.filter((p) => removed.has(p.key)).map((p) => p.key);

  // chips affichées : traits gardés (keyés) + puce taille en dernier si gardée.
  const chips: { key: string; text: string }[] = traits.map((t) => ({ key: t.key, text: t.text }));
  if (keepSize) chips.push({ key: SIZE_KEY, text: `~ taille de ${entry.nom}` });

  const parsed: ParsedProject = {
    reformulation: anchorReformulationSuffix([entry.nom], traits.map((t) => t.text)),
    hardConstraints: {
      excludePlace: [{ label: entry.nom }],
      ...(keepSize ? { communeSize: deriv.communeSize } : {}),
    },
    preferences,
    communeAncre: [{ label: entry.nom }],
    ...(suppressNarrativeKeys.length ? { suppressNarrativeKeys } : {}),
  };

  return NextResponse.json({ found: true, nom: entry.nom, chips, parsed });
}
