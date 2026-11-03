import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { gzipSync } from "node:zlib";
import { createHash } from "node:crypto";
import { basculer, client, envoyer, verifierCible } from "./publier.mjs";
import { caseDe, classeDe, cleCase, cleTuileDe, FORMAT_PRIX_AUTOUR } from "../../src/lib/prix-autour.ts";

// FUT-138 · La publication des tuiles des ventes à proximité, contre un Storage imité en mémoire : rien ne s'écrase,
// le manifeste vient en dernier, le pointeur porte l'empreinte du manifeste, une autre édition sous le même nom est
// refusée. Aucun réseau.

const sha = (b) => createHash("sha256").update(b).digest("hex");

function storage() {
  const objets = new Map();
  const f = async (url, init = {}) => {
    const u = new URL(url);
    const chemin = decodeURIComponent(u.pathname).replace("/storage/v1/object/prix-autour/", "");
    if ((init.method ?? "GET") === "GET") return objets.has(chemin) ? new Response(new Uint8Array(objets.get(chemin))) : new Response("", { status: 400 });
    if (objets.has(chemin) && init.headers["x-upsert"] !== "true") return new Response("Duplicate", { status: 409 });
    objets.set(chemin, Buffer.from(init.body));
    return new Response("{}");
  };
  return { objets, c: client("https://atvknbgahcuovcyqapfx.supabase.co", "cle", f) };
}

function edition(dir, prix = 5000) {
  const c = caseDe({ lat: 46.158, lon: -1.153 });
  const kt = cleTuileDe(c);
  fs.mkdirSync(path.join(dir, "t"), { recursive: true });
  const tuile = gzipSync(Buffer.from(JSON.stringify({ format: FORMAT_PRIX_AUTOUR, edition: "2026-10-20", tuile: kt, cases: { [cleCase(c)]: { a: [classeDe(prix), 12] } } })));
  const communes = gzipSync(Buffer.from(JSON.stringify({ format: FORMAT_PRIX_AUTOUR, edition: "2026-10-20", meta: { achat: { periode: { debut: "2022-01-01", fin: "2025-12-31" } } }, communes: {} })));
  fs.writeFileSync(path.join(dir, "t", `${kt}.json.gz`), tuile);
  fs.writeFileSync(path.join(dir, "communes.json.gz"), communes);
  fs.writeFileSync(path.join(dir, "manifest.json"), JSON.stringify({
    format: FORMAT_PRIX_AUTOUR, edition: "2026-10-20", livraison: "2026-10-20", periode: { debut: "2022-01-01", fin: "2025-12-31" },
    case_m: 100, tuile_cases: 50, pas_classe: 1.02,
    tuiles: { [kt]: { octets: tuile.length, sha256: sha(tuile), ventes: 12 } },
    communes: { octets: communes.length, sha256: sha(communes), nombre: 0 },
  }));
}

test("la garde : cible obligatoire, URL du bon projet, production confirmée deux fois", () => {
  assert.throws(() => verifierCible(undefined, "https://atvknbgahcuovcyqapfx.supabase.co"), /--cible/);
  assert.throws(() => verifierCible("test", "https://xkewgsccadjmondzmjxj.supabase.co"), /n'est pas celle du projet test/);
  assert.throws(() => verifierCible("production", "https://xkewgsccadjmondzmjxj.supabase.co", false), /confirmer-production/);
  assert.doesNotThrow(() => verifierCible("production", "https://xkewgsccadjmondzmjxj.supabase.co", true));
});

test("envoyer puis basculer : tuiles, référence communale, manifeste, pointeur ; reprise idempotente", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "prix-autour-"));
  edition(dir);
  const { objets, c } = storage();
  await envoyer(c, dir);
  assert.ok(objets.has("2026-10-20/manifest.json"));
  assert.ok(objets.has("2026-10-20/communes.json.gz"));
  assert.ok(!objets.has("courant.json"), "l'envoi ne bascule pas");
  await envoyer(c, dir); // reprise : rien n'est réécrit, tout est relu
  await basculer(c, "2026-10-20");
  const p = JSON.parse(objets.get("courant.json").toString());
  assert.equal(p.manifeste, sha(objets.get("2026-10-20/manifest.json")));
});

test("un autre contenu sous la même édition est refusé avant toute écriture", async () => {
  const a = fs.mkdtempSync(path.join(os.tmpdir(), "prix-autour-"));
  const b = fs.mkdtempSync(path.join(os.tmpdir(), "prix-autour-"));
  edition(a, 5000);
  edition(b, 6000);
  const { objets, c } = storage();
  await envoyer(c, a);
  const avant = new Map(objets);
  await assert.rejects(envoyer(c, b), /reconstruire sous une révision/);
  assert.deepEqual([...objets.keys()], [...avant.keys()]);
});
