// FUT-118 R0 · Régénère la référence du test-cliquet (`src/components/releve/heritage-reference.json`).
// À lancer SEULEMENT après un lot qui RETIRE des marqueurs historiques. Le script refuse d'écrire une
// référence où un fichier aurait plus de marqueurs qu'avant : le cliquet ne se desserre pas en douce.
// Usage : node scripts/fut118/heritage-reference.ts [--initialiser]
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { releverHeritage } from "../../src/components/releve/heritage.ts";

const CHEMIN = "src/components/releve/heritage-reference.json";
const nouvelle = releverHeritage();
if (existsSync(CHEMIN) && !process.argv.includes("--initialiser")) {
  const ancienne: Record<string, Record<string, number>> = JSON.parse(readFileSync(CHEMIN, "utf8"));
  const hausses: string[] = [];
  for (const [f, c] of Object.entries(nouvelle)) {
    for (const [m, n] of Object.entries(c)) {
      const avant = ancienne[f]?.[m] ?? 0;
      if (n > avant) hausses.push(`${f} · ${m} : ${avant} → ${n}`);
    }
  }
  if (hausses.length) {
    console.error(`Référence non écrite : des marqueurs augmentent.\n${hausses.join("\n")}`);
    process.exit(1);
  }
}
writeFileSync(CHEMIN, `${JSON.stringify(nouvelle, null, 2)}\n`);
const total = Object.values(nouvelle).reduce((s, c) => s + Object.values(c).reduce((a, b) => a + b, 0), 0);
console.log(`${CHEMIN} : ${Object.keys(nouvelle).length} fichiers, ${total} marqueurs`);
