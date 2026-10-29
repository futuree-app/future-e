import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { envoyer, basculer } from "./publier.mjs";
import { FORMAT_INDEX_FIBRE } from "../../src/lib/fibre-adresse.ts";

const chemin = "2026T2/17-00.json.gz";
const bon = Buffer.from("lot attendu");
const mauvais = Buffer.from("lot CORROMP");
const empreinte = (b) => ({ octets: b.length, sha256: createHash("sha256").update(b).digest("hex") });
const manifeste = () => ({ format: FORMAT_INDEX_FIBRE, millesime: "2026T2", donneesAu: "2026-06-30", lots: { 17: 1 }, empreintes: { [chemin]: empreinte(bon) } });
function stockage(objets = {}) {
  const contenu = new Map(Object.entries(objets));
  const ecritures = [];
  return {
    contenu, ecritures,
    lire: async (p) => contenu.get(p) ?? null,
    lister: async (prefixe) => [...contenu].filter(([p]) => p.startsWith(prefixe)).map(([p, b]) => ({ nom: path.basename(p), octets: b.length })),
    deposer: async (p, b, _type, remplacer = false) => {
      assert.ok(remplacer || !contenu.has(p), "un lot existant reste immuable");
      ecritures.push(p); contenu.set(p, b);
    },
  };
}
async function source(f) {
  const d = await fs.mkdtemp(path.join(os.tmpdir(), "fut156-publication-"));
  const s = path.join(d, "2026T2");
  await fs.mkdir(s);
  await fs.writeFile(path.join(s, "manifest.json"), JSON.stringify(manifeste()));
  await fs.writeFile(path.join(d, chemin), bon);
  try { await f(s); } finally { await fs.rm(d, { recursive: true, force: true }); }
}
test("reprise : un lot corrompu de même taille est refusé avant publication du manifeste", async () => {
  assert.equal(bon.length, mauvais.length);
  await source(async (s) => {
    const c = stockage({ [chemin]: mauvais });
    await assert.rejects(envoyer(c, s), /intégrité/);
    assert.deepEqual(c.ecritures, []);
  });
});
test("bascule : un lot corrompu de même taille ne change jamais le pointeur", async () => {
  const avant = Buffer.from('{"millesime":"2026T1"}');
  const c = stockage({ [chemin]: mauvais, "2026T2/manifest.json": Buffer.from(JSON.stringify(manifeste())), "courant.json": avant });
  await assert.rejects(basculer(c, "2026T2"), /intégrité/);
  assert.equal(c.contenu.get("courant.json"), avant);
  assert.deepEqual(c.ecritures, []);
});
test("envoi puis reprise et bascule : seuls les octets vérifiés deviennent courants", async () => {
  await source(async (s) => {
    const c = stockage();
    await envoyer(c, s);
    await envoyer(c, s);
    assert.equal(c.ecritures.filter((p) => p === chemin).length, 1);
    await basculer(c, "2026T2");
    assert.equal(JSON.parse(c.contenu.get("courant.json")).millesime, "2026T2");
  });
});
test("bascule : manifeste sans empreintes ou lot absent refusé sans écriture", async () => {
  for (const ancien of [true, false]) {
    const m = manifeste();
    if (ancien) delete m.empreintes;
    const c = stockage({ "2026T2/manifest.json": Buffer.from(JSON.stringify(m)) });
    await assert.rejects(basculer(c, "2026T2"));
    assert.deepEqual(c.ecritures, []);
  }
});

test("index antérieur : les empreintes des bilans sont réutilisées sans reconstruire les adresses", async () => {
  await source(async (s) => {
    const m = manifeste();
    delete m.empreintes;
    await fs.writeFile(path.join(s, "manifest.json"), JSON.stringify(m));
    await fs.mkdir(path.join(s, "_departements"));
    await fs.writeFile(path.join(s, "_departements/17.json"), JSON.stringify({
      millesime: "2026T2", departement: "17", lots: [{ chemin, ...empreinte(bon) }],
    }));
    const c = stockage({ [chemin]: bon });
    await envoyer(c, s);
    assert.deepEqual(JSON.parse(c.contenu.get("2026T2/manifest.json")).empreintes, manifeste().empreintes);
    assert.ok(!c.ecritures.includes(chemin));
  });
});

test("lot local altéré : refus avant tout envoi", async () => {
  await source(async (s) => {
    await fs.writeFile(path.join(s, "17-00.json.gz"), mauvais);
    const c = stockage();
    await assert.rejects(envoyer(c, s), /intégrité/);
    assert.deepEqual(c.ecritures, []);
  });
});

test("nouvel upload altéré : la relecture empêche de publier le manifeste", async () => {
  await source(async (s) => {
    const c = stockage();
    const deposer = c.deposer;
    c.deposer = async (p, b, type, remplacer) => deposer(p, p === chemin ? mauvais : b, type, remplacer);
    await assert.rejects(envoyer(c, s), /intégrité/);
    assert.deepEqual(c.ecritures, [chemin]);
  });
});
