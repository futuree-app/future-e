#!/usr/bin/env node
/**
 * FUT-149 — Recette du chemin serveur réel : `lireDebroussaillementAdresse` (fetch, empreintes, cache) contre une
 * imitation locale de l'API Supabase Storage qui sert une édition construite (pointeur, manifeste, 2 453 tuiles).
 * Compare chaque lecture à celle de la lib pure sur les tuiles de test, et mesure la latence.
 *
 *   node scripts/research/fut149-storage-local.mjs <sortie>/<édition>
 */
import http from "node:http";
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import path from "node:path";
import { createHash } from "node:crypto";

// `server-only` et l'alias `@/` sont résolus par Next ; hors de Next, un crochet de chargement les résout.
const racine = pathToFileURL(`${process.cwd()}/`).href;
register(`data:text/javascript,${encodeURIComponent(`export async function resolve(s, c, n) {
  if (s === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
  if (s.startsWith("@/")) return n(${JSON.stringify(racine)} + "src/" + s.slice(2) + ".ts", c);
  return n(s, c);
}`)}`);
const ED = process.argv[2];
const edition = path.basename(ED);
// Le pointeur porte l'empreinte du manifeste, comme celui qu'écrit `publier.mjs basculer`.
const empreinteManifeste = createHash("sha256").update(readFileSync(path.join(ED, "manifest.json"))).digest("hex");
const serveur = http.createServer((req, res) => {
  const chemin = decodeURIComponent(new URL(req.url, "http://x").pathname).replace(/^\/storage\/v1\/object\/debroussaillement\//, "");
  if (chemin === "courant.json") return res.end(JSON.stringify({ format: "debroussaillement-1", edition, manifeste: empreinteManifeste }));
  const f = path.join(path.dirname(ED), chemin);
  if (!f.startsWith(path.dirname(ED)) || !existsSync(f)) { res.statusCode = 400; return res.end("absent"); }
  res.end(readFileSync(f));
});
await new Promise((r) => serveur.listen(0, r));
const env = { DEBROUSSAILLEMENT_BUCKET: "debroussaillement", DEBROUSSAILLEMENT_STORAGE_URL: `http://localhost:${serveur.address().port}`, SUPABASE_SERVICE_ROLE_KEY: "recette" };
const { lireDebroussaillementAdresse, oublierDebroussaillement } = await import("../../src/lib/server/debroussaillement-tuiles.ts");
const { lireDebroussaillement } = await import("../../src/lib/debroussaillement.ts");
const D = "src/lib/__fixtures__/fut149";
const m = JSON.parse(readFileSync(`${D}/tuiles/manifest.json`, "utf8"));
const t = new Map(Object.keys(m.tuiles).filter((k) => !("plein" in m.tuiles[k])).map((k) => [k, JSON.parse(gunzipSync(readFileSync(`${D}/tuiles/t/${k}.json.gz`)).toString())]));
let ok = 0, n = 0; const ms = [];
oublierDebroussaillement();
for (const f of readdirSync(`${D}/adresses`).sort()) {
  const x = JSON.parse(readFileSync(`${D}/adresses/${f}`, "utf8"));
  for (const e of [
    { point: [x.ban.lon, x.ban.lat], geocodage: x.ban.type, insee: x.ban.citycode, parcelle: x.parcelle ? { geometry: x.parcelle.geometry, rattachement: x.parcelle.rattachement, candidatsAuPoint: x.parcelle.candidatsAuPoint } : null },
    { point: [x.ban.lon, x.ban.lat], geocodage: null, insee: x.ban.citycode, parcelle: null },
  ]) {
    const t0 = performance.now();
    const l = await lireDebroussaillementAdresse(e, env);
    ms.push(performance.now() - t0);
    n++;
    const attendu = lireDebroussaillement(m, t, e);
    if (JSON.stringify(l) === JSON.stringify(attendu)) ok++; else console.log("ÉCART", f, l?.etat, attendu.etat);
  }
}
serveur.close();
ms.sort((a, b) => a - b);
console.log(JSON.stringify({ lectures: n, identiques: ok, premiereMs: Math.round(ms.at(-1)), medianeMs: Math.round(ms[ms.length >> 1]) }));
