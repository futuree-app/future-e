import "server-only";
import fs from "node:fs/promises";
import path from "node:path";

export type LittoralFacade =
  | "manche"
  | "atlantique"
  | "bretagne"
  | "mediterranee"
  | "outre_mer";


export type LittoralDecret = { numero: string | null; url: string | null; debut: string | null };

export type LittoralErosionClass = "faible" | "modéré" | "marqué" | "très marqué";

// Recul du trait de côte (Cerema, indicateur national, observé sur ~50 ans).
// classe = intensité (médiane m/an) ; pctRecul = ampleur ; reculMax = détail ;
// amenage = garde-fou « littoral fortement aménagé » (peu de segments calculés).
export type LittoralErosion = {
  classe: LittoralErosionClass | null;
  amenage: boolean;
  pctRecul: number | null;
  medianeMpan: number | null;
  reculMaxMpan: number | null;
  nbValid: number;
  periode: [number, number] | null;
};

export type LittoralSummary = {
  insee: string;
  // FUT-33 : la façade de la liste officielle (loi Climat et Résilience), ou null : jamais devinée du département.
  facade: LittoralFacade | null;
  // Inscription au titre du recul du trait de côte (loi Climat et Résilience, L321-15).
  traitDeCote: { concernee: boolean; decret: LittoralDecret | null };
  // Recul observé (Cerema), null si la commune n'a pas de donnée d'érosion.
  erosion: LittoralErosion | null;
};

type CrRecord = {
  insee: string;
  nom: string;
  departement: string;
  region: string;
  facade: LittoralFacade;
  concernee: boolean;
  decret: LittoralDecret | null;
};

type ErosionRecord = {
  insee: string;
  nom: string;
  littoral: boolean;
  amenage: boolean;
  classe: LittoralErosionClass | null;
  pctRecul: number | null;
  medianeMpan: number | null;
  reculMaxMpan: number | null;
  nbValid: number;
  periode: [number, number] | null;
};

let crCache: Map<string, CrRecord> | null = null;
let erosionCache: Map<string, ErosionRecord> | null = null;

async function loadCr(): Promise<Map<string, CrRecord>> {
  if (crCache) return crCache;
  const file = path.join(process.cwd(), "data", "littoral-trait-de-cote.json");
  const rows = JSON.parse(await fs.readFile(file, "utf8")) as CrRecord[];
  crCache = new Map(rows.map((r) => [String(r.insee).padStart(5, "0"), r]));
  return crCache;
}

// L'érosion peut ne pas être encore générée (build national en cours) : on dégrade
// proprement vers une map vide plutôt que de planter le rapport.
async function loadErosion(): Promise<Map<string, ErosionRecord>> {
  if (erosionCache) return erosionCache;
  const file = path.join(process.cwd(), "data", "littoral-erosion.json");
  try {
    const obj = JSON.parse(await fs.readFile(file, "utf8")) as Record<string, ErosionRecord>;
    erosionCache = new Map(Object.entries(obj).map(([k, v]) => [String(k).padStart(5, "0"), v]));
  } catch {
    erosionCache = new Map();
  }
  return erosionCache;
}

function build(insee: string, cr: CrRecord | undefined, er: ErosionRecord | undefined): LittoralSummary {
  return {
    insee,
    facade: cr?.facade ?? null,
    traitDeCote: { concernee: !!cr?.concernee, decret: cr?.decret ?? null },
    erosion:
      er && er.littoral
        ? {
            classe: er.classe,
            amenage: er.amenage,
            pctRecul: er.pctRecul,
            medianeMpan: er.medianeMpan,
            reculMaxMpan: er.reculMaxMpan,
            nbValid: er.nbValid,
            periode: er.periode,
          }
        : null,
  };
}

// Résumé littoral d'une commune, ou null si elle n'a NI inscription loi C&R NI
// donnée d'érosion (V1 : on ne parle que là où une base existe).
export async function getLittoralSummary(inseeCode: string): Promise<LittoralSummary | null> {
  const insee = String(inseeCode).padStart(5, "0");
  const [cr, er] = await Promise.all([loadCr(), loadErosion()]);
  const crRec = cr.get(insee);
  const erRec = er.get(insee);
  if (!crRec && !(erRec && erRec.littoral)) return null;
  return build(insee, crRec, erRec);
}

// Index complet (union des deux sources) pour les consommateurs faisant de
// nombreux lookups après un seul chargement (ex. le moteur du comparateur).
export async function getLittoralIndex(): Promise<Map<string, LittoralSummary>> {
  const [cr, er] = await Promise.all([loadCr(), loadErosion()]);
  const keys = new Set<string>([...cr.keys(), ...er.keys()]);
  const out = new Map<string, LittoralSummary>();
  for (const insee of keys) {
    const erRec = er.get(insee);
    if (!cr.get(insee) && !(erRec && erRec.littoral)) continue;
    out.set(insee, build(insee, cr.get(insee), erRec));
  }
  return out;
}
