#!/usr/bin/env node
import { unpackFile, INDEX_JSON_PATH, INDEX_GZ_PATH } from "./lib/index-io.mjs";
try {
  unpackFile(INDEX_GZ_PATH, INDEX_JSON_PATH);
  console.log("Copie de travail écrite : data/comparateur-index.json");
} catch (e) {
  console.error(`REFUS: ${e.message}`);
  process.exit(1);
}
