// Sert les PNG de Niort (docs/etudes/…/visuels/79191) à la prévisualisation, sans les copier dans `public/`
// (ce qui les publierait). DEV UNIQUEMENT : 404 en production.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { VISUELS } from "../../source";

export async function GET(_req: Request, { params }: { params: Promise<{ fichier: string }> }) {
  if (process.env.NODE_ENV === "production") return new Response(null, { status: 404 });
  const { fichier } = await params;
  // Liste blanche par motif : un nom de fichier de l'étude, jamais un chemin.
  if (!/^[a-z0-9_]+\.png$/.test(fichier)) return new Response(null, { status: 404 });
  try {
    const png = await readFile(path.join(VISUELS, fichier));
    return new Response(new Uint8Array(png), { headers: { "content-type": "image/png", "cache-control": "no-store" } });
  } catch {
    return new Response(null, { status: 404 });
  }
}
