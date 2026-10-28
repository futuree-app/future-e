import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import ts from "typescript";
import nft from "next/dist/compiled/@vercel/nft/index.js";

test("ONRN : le traceur ne prend que les deux tables runtime, qui suffisent à une lecture isolée", async () => {
  const source = path.resolve("src/lib/onrn-sinistralite.ts");
  const code = ts.transpileModule(await fs.readFile(source, "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  }).outputText;
  // Le même traceur que Next.js, avec le TS compilé en mémoire. Aucun build ni déploiement.
  const { fileList, warnings } = await nft.nodeFileTrace([source], {
    base: process.cwd(),
    readFile: (file) => file === source ? Promise.resolve(code) : fs.readFile(file),
  });
  assert.deepEqual([...warnings], []);
  const data = [...fileList].filter((file) => file.startsWith("data/")).sort();
  assert.deepEqual(data, ["data/onrn-inondation.json", "data/onrn-secheresse.json"]);

  // Recette du paquet minimal : pas d'accès possible aux autres fichiers du dépôt.
  const dir = await fs.mkdtemp(path.join(tmpdir(), "future-onrn-"));
  try {
    await fs.mkdir(path.join(dir, "data"));
    await fs.writeFile(path.join(dir, "onrn.mjs"), code);
    for (const file of data) await fs.copyFile(file, path.join(dir, file));
    const script = `
      import assert from 'node:assert/strict';
      import fs from 'node:fs';
      import { classify, getOnrnSinistralite } from './onrn.mjs';
      const sech = JSON.parse(fs.readFileSync('data/onrn-secheresse.json', 'utf8'));
      const inon = JSON.parse(fs.readFileSync('data/onrn-inondation.json', 'utf8'));
      const codes = new Set([...Object.keys(sech), ...Object.keys(inon), 'inconnu']);
      for (const code of codes) assert.deepEqual(await getOnrnSinistralite(code), {
        secheresse: classify(sech[code]), inondation: classify(inon[code]),
      }, code);
      assert.deepEqual(await getOnrnSinistralite(null), {
        secheresse: {kind:'indispo'}, inondation: {kind:'indispo'},
      });
    `;
    execFileSync(process.execPath, ["--input-type=module", "-e", script], {
      cwd: dir, stdio: "pipe", timeout: 30_000,
    });
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
});
