#!/usr/bin/env -S npx tsx
// FUT-129 : porte dans l'index du comparateur les deux faits d'inondation qu'il affiche ou classe :
//
//   c.historiqueInondation = { frequence: "Entre 5 et 10 ‰", representativite: "> 50%" }   ou   null
//     l'historique des sinistres indemnisés (ONRN / CCR, millésime 2025, 1995-2021), labels VERBATIM ;
//   c.plansInondation = [{ statut: "approuve", aleas: ["Par submersion marine"] }]   ([] = aucun plan)
//     les plans de prévention des inondations de la commune (export GASPAR du 05/10/2026, table
//     `data/gaspar-pprn-inondation.json` reprise à l'identique de FUT-127). Affichés, jamais classés.
//
// Source : `data/onrn-inondation.json`, déjà embarqué pour le module Logement (consolidé depuis
// `files.georisques.fr/onrn/2025/ONRN_Frequence_INON_9521.xlsx` ; la représentativité y est la même dans
// les deux fichiers ONRN, vérifié le 23/10/2026 sur les 34 839 communes). Le classement ne lit QUE l'index :
// aucun fichier de plus à embarquer dans les routes du comparateur.
//
// Il LIT et RÉÉCRIT la copie de travail en place, n'ajoute que ce champ, et REFUSE (exit 1) si un autre
// champ d'une commune change, si la couverture s'effondre ou si un label est inconnu.
//
// Lancer : npm run index:unpack && node scripts/populate-inondation-comparateur.mts && npm run index:pack
import fs from "node:fs/promises";
import path from "node:path";
import { CLASSES_FREQUENCE, CLASSES_REPRESENTATIVITE } from "../src/lib/comparateur/inondation-historique.ts";
import { plansInondationDeLaCommune, type TablePlansInondation } from "../src/lib/data/gaspar-pprn-inondation.ts";
import { assertIndexWorktree } from "./lib/require-index-worktree.mjs";

assertIndexWorktree();

const die = (msg: string): never => {
  console.error(`REFUS: ${msg}`);
  process.exit(1);
};

const idxPath = path.join(process.cwd(), "data", "comparateur-index.json");
const brut = await fs.readFile(idxPath, "utf8");
const idx = JSON.parse(brut) as { communes: Record<string, unknown>[] };
const onrn = JSON.parse(await fs.readFile(path.join(process.cwd(), "data", "onrn-inondation.json"), "utf8")) as
  Record<string, { c: string; f: string; r: string }>;
const plans = JSON.parse(await fs.readFile(path.join(process.cwd(), "data", "gaspar-pprn-inondation.json"), "utf8")) as TablePlansInondation;

/** La commune sans le champ ajouté : ce qui doit rester identique, octet pour octet. */
const sansLeChamp = (c: Record<string, unknown>) =>
  JSON.stringify(c, (k, v) => (k === "historiqueInondation" || k === "plansInondation" ? undefined : v));
const avant = new Map(idx.communes.map((c) => [c.insee as string, sansLeChamp(c)]));

let couvertes = 0;
let avecPlan = 0;
for (const c of idx.communes) {
  const ps = plansInondationDeLaCommune(plans, c.insee as string)!.plans;
  c.plansInondation = ps.map((p) => ({ statut: p.statut, aleas: p.aleas }));
  if (ps.length > 0) avecPlan++;
  const o = onrn[c.insee as string];
  if (!o) { c.historiqueInondation = null; continue; }
  if (!(CLASSES_FREQUENCE as readonly string[]).includes(o.f)) die(`${c.insee} : classe de fréquence inconnue « ${o.f} »`);
  if (!(CLASSES_REPRESENTATIVITE as readonly string[]).includes(o.r)) die(`${c.insee} : représentativité inconnue « ${o.r} »`);
  c.historiqueInondation = { frequence: o.f, representativite: o.r };
  couvertes++;
}

// Rien d'autre ne bouge.
for (const c of idx.communes) {
  if (avant.get(c.insee as string) !== sansLeChamp(c)) die(`${c.insee} : un autre champ a changé`);
}
if (couvertes < idx.communes.length * 0.95) die(`couverture trop basse : ${couvertes}/${idx.communes.length}`);

const tmp = `${idxPath}.${process.pid}.tmp`;
await fs.writeFile(tmp, JSON.stringify(idx));
await fs.rename(tmp, idxPath);
console.log(`historiqueInondation : ${couvertes}/${idx.communes.length} communes couvertes (absentes : null).`);
console.log(`plansInondation : ${avecPlan} communes avec au moins un plan (export GASPAR du ${plans.meta.export}).`);
