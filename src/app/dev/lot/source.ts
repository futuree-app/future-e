import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

// Lots de production des articles mobilité (docs/etudes/…/lots/<lot>/). La page relit l'état écrit par `outil/lot.py` :
// rien n'est recopié ici. DEV UNIQUEMENT.
export const LOTS = path.join(process.cwd(), "docs/etudes/2026-10-13-larochelle-mobilite/lots");

export type Etape = { ok: boolean; duree_s?: number; erreur?: string; fin?: string };
export type Commune = {
  nom: string;
  insee: string | null;
  demande: string;
  statut: string;
  motif?: string;
  etapes: Record<string, Etape>;
  manuel?: string[];
  notes?: string[];
  duree_preparation_s?: number;
  article?: string;
  anomalies_restantes?: { type?: string; categorie?: string; detail?: string; probleme?: string }[];
  versions?: Record<string, unknown>;
};
export type Lot = { nom: string; conf: { objet?: string; moteur?: { outil: string } }; communes: Record<string, Commune>; depenses: number | null; appelsNonMesures: number };

export const nomValide = (s: string) => /^[a-z0-9-]+$/i.test(s);

// Campagne 20 → 100 communes : sélection, mesures et bilan cumulatif écrits par `outil/campagne.py`, hors de lots/.
export const CAMPAGNE = path.join(process.cwd(), "docs/etudes/2026-10-13-larochelle-mobilite/campagne-100");
export const FICHIERS_CAMPAGNE = new Set(["BILAN.md", "mesures.csv", "candidats.csv"]);
// Articles préparés hors des lots (pilotes) : même liste que PILOTES dans outil/campagne.py.
const PILOTES = ["17300", "79191"];

// Communes distinctes dont un article est préparé : pilotes + toute commune d'un lot qui a un article retenu (Angers,
// présente dans le lot 01 et dans l'essai Codex, compte une fois).
export async function communesDistinctes(): Promise<number> {
  const vu = new Set(PILOTES);
  for (const nom of await listeLots()) {
    const p = path.join(LOTS, nom, "etat.json");
    if (!existsSync(p)) continue;
    for (const [k, c] of Object.entries(JSON.parse(await readFile(p, "utf8")).communes as Record<string, Commune>))
      if (c.article && existsSync(path.join(LOTS, nom, k, "generation", c.article))) vu.add(k);
  }
  return vu.size;
}

export async function listeLots(): Promise<string[]> {
  if (!existsSync(LOTS)) return [];
  return (await readdir(LOTS, { withFileTypes: true })).filter((d) => d.isDirectory() && nomValide(d.name)).map((d) => d.name).sort().reverse();
}

export async function lireLot(nom: string): Promise<Lot> {
  const dir = path.join(LOTS, nom);
  const conf = JSON.parse(await readFile(path.join(dir, "lot.json"), "utf8"));
  const etat = existsSync(path.join(dir, "etat.json")) ? JSON.parse(await readFile(path.join(dir, "etat.json"), "utf8")) : { communes: {} };
  // Sans depenses.jsonl (essai Codex : aucun équivalent API rapporté), la dépense est inconnue, pas nulle.
  // Un appel Codex ne rapporte aucun équivalent API : il est compté à part, jamais pour zéro.
  let depenses: number | null = existsSync(path.join(dir, "depenses.jsonl")) ? 0 : null;
  let appelsNonMesures = 0;
  if (depenses !== null)
    for (const l of (await readFile(path.join(dir, "depenses.jsonl"), "utf8")).split("\n").filter(Boolean)) {
      const cout = JSON.parse(l).cout_usd_equivalent;
      if (cout == null) appelsNonMesures++;
      else depenses = (depenses ?? 0) + cout;
    }
  return { nom, conf, communes: etat.communes, depenses, appelsNonMesures };
}

// Section B (l'article) d'un rendu de rédaction, sans les sections A, C, D, E.
export function sectionArticle(rendu: string): string | null {
  const m = rendu.match(/^##\s+B\.[^\n]*\n([\s\S]*?)(?=^##\s+[C-E]\.|$(?![\s\S]))/m);
  return m ? m[1].trim() : null;
}

export async function articleDe(lot: string, insee: string, c: Commune): Promise<string | null> {
  const f = path.join(LOTS, lot, insee, "generation", c.article ?? "redaction.md");
  return existsSync(f) ? sectionArticle(await readFile(f, "utf8")) : null;
}
