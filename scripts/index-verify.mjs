#!/usr/bin/env node
import { verifyIndex, INDEX_JSON_PATH, INDEX_GZ_PATH } from "./lib/index-io.mjs";
try {
  verifyIndex(INDEX_JSON_PATH, INDEX_GZ_PATH);
  console.log("Index vérifié.");
} catch (e) {
  console.error(`REFUS: ${e.message}`);
  process.exit(1);
}
