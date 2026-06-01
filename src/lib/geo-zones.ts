// ════════════════════════════════════════════════════════════════════════════
// Ancres géographiques — table jeton → départements (V1).
//
// Principe (cf. ANCRES_GEOGRAPHIQUES.md) : le moteur POSSÈDE la géographie, le
// LLM la NOMME. Le parse choisit un jeton de zone dans une liste fermée ; le
// moteur détient la table jeton → départements. Le LLM n'invente jamais de liste
// de départements (même discipline que nearPlace : il donne le label, le moteur
// géolocalise).
//
// Une ancre n'est PAS une préférence de plus à pondérer : elle change le PÉRIMÈTRE
// de recherche. « L'ancre définit l'espace de recherche ; les préférences
// ordonnent dedans. » Composition de plusieurs ancres positives = INTERSECTION
// (« le Sud-Ouest, près des Pyrénées » = SO ∩ Pyrénées).
//
// Les frontières sont des CONVENTIONS assumées, pas des vérités : chaque zone
// porte un texte `convention` affiché honnêtement à l'utilisateur.
//
// Module PUR (aucun fs, aucune dépendance à l'index) : sûr à importer côté client
// comme côté serveur. Les départements sont des codes INSEE à 2 caractères
// (Corse : 2A / 2B), cohérents avec le champ `dept` de l'index.
// ════════════════════════════════════════════════════════════════════════════

export type ZoneDef = {
  label: string;        // libellé humain affichable (ex. « le Sud »)
  convention: string;   // périmètre assumé, affiché honnêtement
  departements: string[];
};

// ── Registre des ancres POSITIVES (macro-zones, façades, massifs) ─────────────
// Toutes intersectables entre elles. Un même département peut appartenir à
// plusieurs zones (le Gard est à la fois « sud », « sud_est » et « mediterranee »).
export const ZONE_TABLE: Record<string, ZoneDef> = {
  // — Macro-zones vernaculaires —
  sud: {
    label: "le Sud",
    convention:
      "PACA, l'Occitanie et le sud de la Nouvelle-Aquitaine (Landes, Pays basque, Béarn, Dordogne, Gironde)",
    departements: [
      "04", "05", "06", "13", "83", "84", // PACA
      "09", "11", "12", "30", "31", "32", "34", "46", "48", "65", "66", "81", "82", // Occitanie
      "24", "33", "40", "47", "64", // sud Nouvelle-Aquitaine
    ],
  },
  sud_ouest: {
    label: "le Sud-Ouest",
    convention: "de la Gironde aux Pyrénées (ancienne Aquitaine et Midi-Pyrénées)",
    departements: [
      "24", "33", "40", "47", "64", // ex-Aquitaine
      "09", "12", "31", "32", "46", "65", "81", "82", // ex-Midi-Pyrénées
    ],
  },
  sud_est: {
    label: "le Sud-Est",
    convention: "PACA, la vallée du Rhône (Drôme, Ardèche) et le Gard",
    departements: ["04", "05", "06", "13", "83", "84", "26", "07", "30"],
  },
  nord: {
    label: "le Nord",
    convention: "les Hauts-de-France (Nord, Pas-de-Calais, Picardie)",
    departements: ["02", "59", "60", "62", "80"],
  },
  est: {
    label: "l'Est",
    convention: "le Grand Est (Alsace, Lorraine, Champagne-Ardenne)",
    departements: ["08", "10", "51", "52", "54", "55", "57", "67", "68", "88"],
  },
  grand_ouest: {
    label: "le Grand Ouest",
    convention: "la Bretagne, les Pays de la Loire, la Normandie et le Poitou",
    departements: [
      "22", "29", "35", "56", // Bretagne
      "44", "49", "53", "72", "85", // Pays de la Loire
      "14", "27", "50", "61", "76", // Normandie
      "17", "79", "86", // Poitou
    ],
  },
  centre: {
    label: "le Centre",
    convention: "le Centre-Val de Loire",
    departements: ["18", "28", "36", "37", "41", "45"],
  },

  // — Régions administratives (jetons de zone à part entière) —
  // Mêmes machinerie et gradient de force que les macro-zones. Certaines régions
  // recoupent exactement une macro-zone (le Nord ≈ Hauts-de-France) : on garde les
  // deux jetons pour un libellé juste selon ce que dit l'utilisateur.
  bretagne: {
    label: "la Bretagne",
    convention: "la région Bretagne",
    departements: ["22", "29", "35", "56"],
  },
  normandie: {
    label: "la Normandie",
    convention: "la région Normandie",
    departements: ["14", "27", "50", "61", "76"],
  },
  pays_de_la_loire: {
    label: "les Pays de la Loire",
    convention: "la région Pays de la Loire",
    departements: ["44", "49", "53", "72", "85"],
  },
  nouvelle_aquitaine: {
    label: "la Nouvelle-Aquitaine",
    convention: "la région Nouvelle-Aquitaine",
    departements: ["16", "17", "19", "23", "24", "33", "40", "47", "64", "79", "86", "87"],
  },
  occitanie: {
    label: "l'Occitanie",
    convention: "la région Occitanie",
    departements: ["09", "11", "12", "30", "31", "32", "34", "46", "48", "65", "66", "81", "82"],
  },
  provence_alpes_cote_d_azur: {
    label: "Provence-Alpes-Côte d'Azur",
    convention: "la région Provence-Alpes-Côte d'Azur",
    departements: ["04", "05", "06", "13", "83", "84"],
  },
  auvergne_rhone_alpes: {
    label: "l'Auvergne-Rhône-Alpes",
    convention: "la région Auvergne-Rhône-Alpes",
    departements: ["01", "03", "07", "15", "26", "38", "42", "43", "63", "69", "73", "74"],
  },
  bourgogne_franche_comte: {
    label: "la Bourgogne-Franche-Comté",
    convention: "la région Bourgogne-Franche-Comté",
    departements: ["21", "25", "39", "58", "70", "71", "89", "90"],
  },
  grand_est: {
    label: "le Grand Est",
    convention: "la région Grand Est",
    departements: ["08", "10", "51", "52", "54", "55", "57", "67", "68", "88"],
  },
  hauts_de_france: {
    label: "les Hauts-de-France",
    convention: "la région Hauts-de-France",
    departements: ["02", "59", "60", "62", "80"],
  },
  centre_val_de_loire: {
    label: "le Centre-Val de Loire",
    convention: "la région Centre-Val de Loire",
    departements: ["18", "28", "36", "37", "41", "45"],
  },
  ile_de_france: {
    label: "l'Île-de-France",
    convention: "la région Île-de-France",
    departements: ["75", "77", "78", "91", "92", "93", "94", "95"],
  },

  // — Façades maritimes nommées —
  atlantique: {
    label: "la façade atlantique",
    convention: "les départements côtiers de l'Atlantique, du Pays basque au Finistère",
    departements: ["64", "40", "33", "17", "85", "44", "56", "29"],
  },
  manche: {
    label: "la Manche",
    convention: "les départements côtiers de la Manche, du Finistère au Nord",
    departements: ["29", "22", "35", "50", "14", "76", "80", "62", "59"],
  },
  mediterranee: {
    label: "la côte méditerranéenne",
    convention:
      "les départements côtiers de la Méditerranée, des Pyrénées-Orientales à la Côte d'Azur, Corse incluse",
    departements: ["66", "11", "34", "30", "13", "83", "06", "2A", "2B"],
  },
  cote_basque: {
    label: "la côte basque",
    convention: "le littoral des Pyrénées-Atlantiques",
    departements: ["64"],
  },

  // — Massifs nommés (pas d'altitude dans l'index → approximation par département) —
  alpes: {
    label: "les Alpes",
    convention: "le massif alpin (Savoie, Dauphiné, Alpes du Sud)",
    departements: ["04", "05", "06", "26", "38", "73", "74"],
  },
  pyrenees: {
    label: "les Pyrénées",
    convention: "les départements pyrénéens, de l'Atlantique à la Méditerranée",
    departements: ["09", "31", "64", "65", "66"],
  },
  massif_central: {
    label: "le Massif central",
    convention: "le Massif central (Auvergne, Limousin, Cévennes, Aubrac)",
    departements: ["03", "07", "12", "15", "19", "23", "42", "43", "46", "48", "63"],
  },
  vosges: {
    label: "les Vosges",
    convention: "le massif vosgien",
    departements: ["67", "68", "70", "88"],
  },
  jura: {
    label: "le Jura",
    convention: "le massif jurassien",
    departements: ["01", "25", "39"],
  },
  corse: {
    label: "la Corse",
    convention: "la Corse (Corse-du-Sud et Haute-Corse)",
    departements: ["2A", "2B"],
  },
};

// ── Exclusions spéciales (au-delà des zones du registre) ──────────────────────
// « quitter Paris » : exclure Paris et sa proche banlieue, pas toute l'Île-de-France.
// « la région parisienne » : exclure toute l'Île-de-France.
const EXCLUSION_EXTRA: Record<string, ZoneDef> = {
  paris: {
    label: "Paris et sa proche banlieue",
    convention: "Paris et la petite couronne (Hauts-de-Seine, Seine-Saint-Denis, Val-de-Marne)",
    departements: ["75", "92", "93", "94"],
  },
  idf: {
    label: "l'Île-de-France",
    convention: "toute l'Île-de-France",
    departements: ["75", "77", "78", "91", "92", "93", "94", "95"],
  },
};

// Jetons valides exposés au parse (enums du schéma).
export const ANCHOR_ZONE_TOKENS = Object.keys(ZONE_TABLE);
export const EXCLUSION_ZONE_TOKENS = [...Object.keys(ZONE_TABLE), ...Object.keys(EXCLUSION_EXTRA)];

// Force d'une ancre (gradient, cf. ANCRES_GEOGRAPHIQUES.md).
//   hard        = filtre, définit l'espace de recherche ;
//   preferred   = bonus fort de score, sans exclusion ;
//   inspiration = bonus faible + signal éditorial.
export type ZoneStrength = "hard" | "preferred" | "inspiration";
export type ZoneAnchor = { zone: string; strength: ZoneStrength };
export type AppliedZone = { label: string; convention: string; strength: ZoneStrength };

// Libellés + force des ancres (côté UI, avant le match : on n'a alors que les
// jetons du parse). Ignore les jetons inconnus. Pur, client-safe.
export function anchorsToLabeled(
  anchors: ZoneAnchor[] | undefined | null,
): { label: string; strength: ZoneStrength }[] {
  const out: { label: string; strength: ZoneStrength }[] = [];
  for (const a of anchors ?? []) {
    const def = ZONE_TABLE[a?.zone];
    if (def) out.push({ label: def.label, strength: a.strength });
  }
  return out;
}
export function exclusionsToLabels(tokens: string[] | undefined | null): string[] {
  return (tokens ?? [])
    .map((t) => (ZONE_TABLE[t] ?? EXCLUSION_EXTRA[t])?.label)
    .filter((l): l is string => Boolean(l));
}

// ── Résolution des ancres avec force ──────────────────────────────────────────
// Les ancres DURES s'intersectent et définissent le périmètre (« le Sud-Ouest près
// des Pyrénées »). Les ancres SOUPLES (preferred / inspiration) ne filtrent pas :
// elles renvoient des ensembles de départements à bonifier au scoring. Les jetons
// inconnus sont ignorés et signalés (robustesse face à un LLM qui dérive).
export type SoftZone = { departements: Set<string>; strength: ZoneStrength; label: string };

export function resolveZoneAnchors(anchors: ZoneAnchor[] | undefined | null): {
  hardDepartements: Set<string> | null; // intersection des ancres dures, null si aucune
  soft: SoftZone[];
  applied: AppliedZone[];
  unknown: string[];
} {
  const applied: AppliedZone[] = [];
  const soft: SoftZone[] = [];
  const unknown: string[] = [];
  let hard: Set<string> | null = null;

  for (const a of anchors ?? []) {
    const def = ZONE_TABLE[a?.zone];
    if (!def) {
      unknown.push(a?.zone);
      continue;
    }
    applied.push({ label: def.label, convention: def.convention, strength: a.strength });
    const set = new Set<string>(def.departements);
    if (a.strength === "hard") {
      if (hard === null) {
        hard = set;
      } else {
        const prev = hard;
        const next = new Set<string>();
        for (const d of prev) if (set.has(d)) next.add(d);
        hard = next;
      }
    } else {
      soft.push({ departements: set, strength: a.strength, label: def.label });
    }
  }

  return { hardDepartements: hard, soft, applied, unknown };
}

// ── Résolution des exclusions → union des départements à retirer ──────────────
export function resolveExclusions(tokens: string[] | undefined | null): {
  departements: Set<string>;
  applied: AppliedZone[];
  unknown: string[];
} {
  const departements = new Set<string>();
  const applied: AppliedZone[] = [];
  const unknown: string[] = [];

  for (const t of tokens ?? []) {
    const def = ZONE_TABLE[t] ?? EXCLUSION_EXTRA[t];
    if (!def) {
      unknown.push(t);
      continue;
    }
    applied.push({ label: def.label, convention: def.convention, strength: "hard" });
    for (const d of def.departements) departements.add(d);
  }

  return { departements, applied, unknown };
}
