import path from "node:path";

// L'étude reste la source de vérité : la page relit l'article édité et les visuels là où ils sont versionnés.
export const ETUDE = path.join(process.cwd(), "docs/etudes/2026-10-13-larochelle-mobilite");
export const ARTICLE = path.join(ETUDE, "redaction/79191/article.md");
export const VISUELS = path.join(ETUDE, "visuels/79191");
