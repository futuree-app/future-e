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
export type Lot = { nom: string; conf: { objet?: string; moteur?: { outil: string } }; communes: Record<string, Commune>; depenses: number | null };

export const nomValide = (s: string) => /^[a-z0-9-]+$/i.test(s);

export async function listeLots(): Promise<string[]> {
  if (!existsSync(LOTS)) return [];
  return (await readdir(LOTS, { withFileTypes: true })).filter((d) => d.isDirectory() && nomValide(d.name)).map((d) => d.name).sort().reverse();
}

export async function lireLot(nom: string): Promise<Lot> {
  const dir = path.join(LOTS, nom);
  const conf = JSON.parse(await readFile(path.join(dir, "lot.json"), "utf8"));
  const etat = existsSync(path.join(dir, "etat.json")) ? JSON.parse(await readFile(path.join(dir, "etat.json"), "utf8")) : { communes: {} };
  // Sans depenses.jsonl (essai Codex : aucun équivalent API rapporté), la dépense est inconnue, pas nulle.
  let depenses: number | null = existsSync(path.join(dir, "depenses.jsonl")) ? 0 : null;
  if (depenses !== null)
    for (const l of (await readFile(path.join(dir, "depenses.jsonl"), "utf8")).split("\n").filter(Boolean))
      depenses = (depenses ?? 0) + (JSON.parse(l).cout_usd_equivalent ?? 0);
  return { nom, conf, communes: etat.communes, depenses };
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
