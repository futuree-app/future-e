// FUT-184 · Fige les lignes que ce ticket change dans le contrat de synthèse et le registre des faits Territoire, au
// format `git diff -U0` (en-têtes « @@ » compris), dans src/lib/__fixtures__/fut184-lignes-admises.json. La garde de
// fut147-non-regression.test.ts les annule (`avantFut184`) avant de vérifier les tickets précédents.
// Usage : node scripts/fut184/figer-lignes-admises.mjs [base, défaut 6972d5a4 = main après FUT-185]
// À relancer après toute retouche de ces deux fichiers, et après un rebase (avec la nouvelle base).
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const base = process.argv[2] ?? "6972d5a4";
const FICHIERS = ["src/lib/territoire/synthesis-contract.ts", "src/lib/territoire/facts.ts"];
const sortie = {};
for (const f of FICHIERS) {
  const diff = execFileSync("git", ["diff", "--no-color", "-U0", base, "--", f], { encoding: "utf8", maxBuffer: 1 << 26 });
  sortie[f] = diff.split("\n").filter((l) => /^(@@|[+-])/.test(l) && !/^(\+\+\+|---) /.test(l)).map((l) => (l.startsWith("@@") ? l.replace(/ @@.*$/, " @@") : l));
  if (sortie[f].some((l) => /bdiff|incendi|feux? de for|MemoireIncendies/i.test(l))) throw new Error(`${f} : une ligne parle des feux`);
}
writeFileSync("src/lib/__fixtures__/fut184-lignes-admises.json", JSON.stringify(sortie, null, 2) + "\n");
console.log(Object.entries(sortie).map(([f, l]) => `${f} : ${l.filter((x) => !x.startsWith("@@")).length} lignes`).join("\n"));
