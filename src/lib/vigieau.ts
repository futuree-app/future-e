import "server-only";

// ─── VigiEau / Propluvia ──────────────────────────────────────────────────────
// API publique du ministère qui surface les arrêtés sécheresse préfectoraux.
// Une commune peut être couverte par plusieurs zones (eaux superficielles SUP,
// eaux souterraines SOU). Chaque zone a son niveau de gravité courant.
// On retient le niveau maximum atteint sur la commune comme indicateur principal.

const VIGIEAU_BASE = "https://api.vigieau.gouv.fr/api";
const REQUEST_TIMEOUT_MS = 8000;

type VigieauZoneRaw = {
  id?: number;
  code?: string;
  nom?: string | null;
  type?: string | null;
  niveauGravite?: string | null;
  departement?: string | null;
  arrete?: {
    id?: number;
    dateDebutValidite?: string | null;
    dateFinValidite?: string | null;
  } | null;
};

export type DroughtLevel = "vigilance" | "alerte" | "alerte_renforcee" | "crise";

export type VigieauZone = {
  label: string;
  resourceType: "surface" | "souterrain" | "autre";
  level: DroughtLevel | "pas_de_restrictions";
  startDate: string | null;
  endDate: string | null;
};

export type VigieauSummary = {
  inseeCode: string;
  maxLevel: DroughtLevel | null;
  topZone: VigieauZone | null;
  zones: VigieauZone[];
  /**
   * L'ÉTAT DE LA CONSULTATION, ajouté le 05/08/2026, et il manquait cruellement.
   *
   * ── CE QUE LE CODE FAISAIT ───────────────────────────────────────────────────────────────
   * En cas de panne de l'API, le `catch` rendait `{ maxLevel: null, topZone: null, zones: [] }`,
   * c'est-à-dire un objet STRICTEMENT INDISTINGUABLE d'une consultation réussie sans restriction.
   * L'écran affichait donc « Aucune restriction en cours » alors que personne n'avait pu demander.
   *
   * C'est le patron que ce dépôt combat partout ailleurs : un registre non consulté n'est pas un
   * registre vide, une absence non mesurée n'est pas une absence attestée. Il manquait ici, sur la
   * donnée la plus sensible du produit, celle qui dit ce qui est INTERDIT en ce moment.
   *
   * `unavailable` ne veut pas dire « pas de restriction » : il veut dire qu'on ne sait pas.
   */
  status: "ok" | "unavailable";
  /** ISO 8601. Quand cette réponse a été obtenue, pour que l'écran puisse la dater. */
  consultedAt: string;
};

// Ordre croissant de gravité. Sert au calcul du niveau maximum sur la commune.
const LEVEL_ORDER: Array<DroughtLevel | "pas_de_restrictions"> = [
  "pas_de_restrictions",
  "vigilance",
  "alerte",
  "alerte_renforcee",
  "crise",
];

function normalizeLevel(raw: string | null | undefined): VigieauZone["level"] | null {
  if (!raw) return null;
  const v = raw.toLowerCase().trim().replace(/[\s-]+/g, "_");
  if (v === "pas_de_restrictions" || v === "pas_de_restriction") return "pas_de_restrictions";
  if (v === "vigilance") return "vigilance";
  if (v === "alerte") return "alerte";
  if (v === "alerte_renforcee" || v === "alerte_renforcée") return "alerte_renforcee";
  if (v === "crise") return "crise";
  return null;
}

function normalizeType(raw: string | null | undefined): VigieauZone["resourceType"] {
  if (!raw) return "autre";
  const v = raw.toUpperCase();
  if (v === "SUP") return "surface";
  if (v === "SOU") return "souterrain";
  return "autre";
}

const cache = new Map<string, Promise<VigieauSummary>>();

async function fetchVigieau(inseeCode: string): Promise<VigieauSummary> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(
      `${VIGIEAU_BASE}/zones?commune=${encodeURIComponent(inseeCode)}`,
      {
        headers: { accept: "application/json" },
        signal: controller.signal,
        next: { revalidate: 3600 },
      },
    );

    if (!res.ok) throw new Error(`VigiEau failed: ${res.status}`);

    const json = (await res.json()) as VigieauZoneRaw[] | { data?: VigieauZoneRaw[] };
    const raw = Array.isArray(json) ? json : json.data ?? [];

    const zones: VigieauZone[] = raw
      .map((z) => {
        const level = normalizeLevel(z.niveauGravite);
        if (!level) return null;
        return {
          label: z.nom?.trim() || "Zone d'alerte sécheresse",
          resourceType: normalizeType(z.type),
          level,
          startDate: z.arrete?.dateDebutValidite ?? null,
          endDate: z.arrete?.dateFinValidite ?? null,
        };
      })
      .filter((z): z is VigieauZone => z !== null);

    // Détermine la zone la plus contraignante : on l'utilise pour le titre.
    let topZone: VigieauZone | null = null;
    let topIdx = -1;
    for (const z of zones) {
      const idx = LEVEL_ORDER.indexOf(z.level);
      if (idx > topIdx) {
        topIdx = idx;
        topZone = z;
      }
    }

    const maxLevel: DroughtLevel | null =
      topZone && topZone.level !== "pas_de_restrictions" ? topZone.level : null;

    return { inseeCode, maxLevel, topZone, zones, status: "ok", consultedAt: new Date().toISOString() };
  } finally {
    clearTimeout(timeout);
  }
}

export function getVigieauSummary(inseeCode: string): Promise<VigieauSummary> {
  const key = inseeCode.trim();
  if (!cache.has(key)) {
    cache.set(
      key,
      // LA PANNE SE DIT, elle ne se déguise pas en absence de restriction. Voir `status` sur le
      // type : c'est la correction du 05/08/2026.
      fetchVigieau(key).catch(
        (): VigieauSummary => ({
          inseeCode: key, maxLevel: null, topZone: null, zones: [],
          status: "unavailable", consultedAt: new Date().toISOString(),
        }),
      ),
    );
  }
  return cache.get(key)!;
}

// ─── Présentation ─────────────────────────────────────────────────────────────

const LEVEL_LABEL: Record<DroughtLevel | "pas_de_restrictions", string> = {
  pas_de_restrictions: "Aucune restriction",
  vigilance: "Vigilance",
  alerte: "Alerte",
  alerte_renforcee: "Alerte renforcée",
  crise: "Crise",
};

export function levelLabel(level: VigieauZone["level"] | null | undefined): string {
  if (!level) return "Aucune restriction";
  return LEVEL_LABEL[level];
}
