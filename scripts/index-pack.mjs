#!/usr/bin/env node
import { packFile, INDEX_JSON_PATH, INDEX_GZ_PATH } from "./lib/index-io.mjs";
try {
  packFile(INDEX_JSON_PATH, INDEX_GZ_PATH);
  console.log("Index packé : data/comparateur-index.json.gz");
} catch (e) {
  console.error(`REFUS: ${e.message}`);
  process.exit(1);
}
