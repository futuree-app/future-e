// Sert un fichier d'un lot (dossier, complément, rendu, contrôle, visuel) à l'index local. DEV UNIQUEMENT : 404 en production.
// Liste blanche : lot, code INSEE et chemin relatif contrôlés par motif ; aucune remontée de répertoire.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { LOTS, nomValide } from "../source";

const TYPES: Record<string, string> = {
  ".md": "text/plain; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".log": "text/plain; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
};

export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production") return new Response(null, { status: 404 });
  const u = new URL(req.url);
  const lot = u.searchParams.get("lot") ?? "";
  const f = u.searchParams.get("f") ?? "";
  if (!nomValide(lot) || !/^(?:\d[\dAB]\d{3}\/)?[a-z_]+(?:\/[a-z0-9_.-]+)?$/i.test(f) || f.includes("..")) return new Response(null, { status: 404 });
  const type = TYPES[path.extname(f)];
  if (!type) return new Response(null, { status: 404 });
  try {
    const data = await readFile(path.join(LOTS, lot, f));
    return new Response(new Uint8Array(data), { headers: { "content-type": type, "cache-control": "no-store" } });
  } catch {
    return new Response(null, { status: 404 });
  }
}
