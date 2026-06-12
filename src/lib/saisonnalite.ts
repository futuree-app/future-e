import "server-only";
import fs from "node:fs/promises";
import path from "node:path";

// Saisonnalité / pression touristique = part de résidences secondaires et
// logements occasionnels (INSEE base communale logement 2022, cf.
// scripts/populate-saisonnalite.py). Fichier latéral, indépendant de l'index
// du comparateur. Repli silencieux si le fichier n'a pas encore été généré.

let cache: Record<string, number> | null = null;

async function load(): Promise<Record<string, number>> {
  if (cache) return cache;
  try {
    const p = path.join(process.cwd(), "data", "residences-secondaires.json");
    cache = JSON.parse(await fs.readFile(p, "utf8")) as Record<string, number>;
  } catch {
    cache = {};
  }
  return cache;
}

export async function getResidencesSecondairesPct(insee: string): Promise<number | null> {
  const m = await load();
  const v = m[insee.trim()];
  return typeof v === "number" ? v : null;
}

export type SaisonnaliteLevel = "marquee" | "forte" | null;

// Seuils descriptifs : moyenne nationale ~10 %. « marquée » dès 20 %, « forte »
// au-delà de 40 % (communes très touristiques). En dessous : rien à signaler.
export function saisonnaliteLevel(pct: number | null): SaisonnaliteLevel {
  if (pct == null) return null;
  if (pct >= 40) return "forte";
  if (pct >= 20) return "marquee";
  return null;
}

export function saisonnaliteLabel(level: SaisonnaliteLevel): string | null {
  switch (level) {
    case "forte":
      return "Forte présence de résidences secondaires";
    case "marquee":
      return "Présence marquée de résidences secondaires";
    default:
      return null;
  }
}
