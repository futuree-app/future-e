#!/usr/bin/env node
// Installe un hook git pre-commit natif (pas de husky) qui lance index:verify.
// Dissuasif seulement (contournable par --no-verify). Non destructif : refuse
// d'écraser un hook existant non géré par futur•e.
import { readFileSync, writeFileSync, chmodSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";

const MARKER = "# futur-e-managed-index-hook";
const BODY = `#!/bin/sh\n${MARKER}\nnpm run index:verify\n`;

// git rev-parse gère worktrees et configs particulières (plutôt que supposer .git/hooks).
const hooksDir = execSync("git rev-parse --git-path hooks").toString().trim();
const hookPath = path.join(path.resolve(hooksDir), "pre-commit");

if (existsSync(hookPath) && !readFileSync(hookPath, "utf8").includes(MARKER)) {
  console.error("Un hook pre-commit existe déjà sans marqueur futur•e. Intégrez `npm run index:verify` manuellement, ou supprimez le hook puis relancez `npm run hooks:install`.");
  process.exit(1);
}
writeFileSync(hookPath, BODY);
chmodSync(hookPath, 0o755);
console.log("Hook pre-commit installé (futur•e-managed) : npm run index:verify");
