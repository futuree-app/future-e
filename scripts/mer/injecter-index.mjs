#!/usr/bin/env node
// FUT-33, phase 2A : injecte la vérité littorale dans l'index versionné SANS le reconstruire.
// Reconstruire tout l'index ferait dépendre ce changement de toutes les autres sources locales ; ici on ajoute
// cinq champs et une entrée de métadonnées, et on prouve que tout le reste est identique octet pour octet.
// Usage (racine du dépôt) : node scripts/mer/injecter-index.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { unpackGz, packFile, INDEX_JSON_PATH, INDEX_GZ_PATH } from "../lib/index-io.mjs";
import { lireMer, ajouterMer, MER_CHAMPS } from "../lib/mer-index.mjs";

const empreinte = (o) => createHash("sha256").update(JSON.stringify(o)).digest("hex");
const index = JSON.parse(unpackGz(readFileSync(INDEX_GZ_PATH)).toString("utf8"));
const sansMer = (idx) => ({ ...idx, meta: { ...idx.meta, mer: undefined }, communes: idx.communes.map((c) => Object.fromEntries(Object.entries(c).filter(([k]) => !MER_CHAMPS.includes(k)))) });
const avant = empreinte(sansMer(index));
index.meta.mer = ajouterMer(index.communes, lireMer());
if (empreinte(sansMer(index)) !== avant) throw new Error("Un champ existant de l'index a changé : refus.");
writeFileSync(INDEX_JSON_PATH, JSON.stringify(index));
packFile(INDEX_JSON_PATH, INDEX_GZ_PATH);
console.log(`Index : ${index.communes.length} communes enrichies (${MER_CHAMPS.join(", ")}) ; champs existants inchangés.`);
