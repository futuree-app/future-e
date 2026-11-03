#!/usr/bin/env node
/**
 * serveur-local.mjs (FUT-138) : RECETTE LOCALE SEULEMENT. Imite l'API Supabase Storage du bucket `prix-autour` en
 * servant une édition construite par `construire.mjs` (pointeur, manifeste, tuiles), pour lire les ventes à proximité
 * dans `next dev` sans rien publier :
 *
 *   node scripts/dvf-autour/serveur-local.mjs [édition] [port]          (par défaut 2026-10-20, 54138)
 *   PRIX_AUTOUR_BUCKET=prix-autour PRIX_AUTOUR_STORAGE_URL=http://localhost:54138 npm run dev
 */
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { CACHE } from "../lib/logement-index.mjs";
import { FORMAT_PRIX_AUTOUR } from "../../src/lib/prix-autour.ts";

const edition = process.argv[2] ?? "2026-10-20";
const port = Number(process.argv[3] ?? 54138);
const racine = path.join(CACHE, "dvf-autour");
const manifeste = fs.readFileSync(path.join(racine, edition, "manifest.json"));
const pointeur = JSON.stringify({ format: FORMAT_PRIX_AUTOUR, edition, manifeste: createHash("sha256").update(manifeste).digest("hex") });

http.createServer((req, res) => {
  const chemin = decodeURIComponent(new URL(req.url, "http://x").pathname).replace(/^\/storage\/v1\/object\/prix-autour\//, "");
  if (chemin === "courant.json") return res.end(pointeur);
  const f = path.resolve(racine, chemin);
  if (!f.startsWith(racine + path.sep) || !fs.existsSync(f)) { res.statusCode = 400; return res.end("absent"); }
  res.end(fs.readFileSync(f));
}).listen(port, "127.0.0.1", () => console.log(`prix-autour local : http://localhost:${port} (édition ${edition})`));
