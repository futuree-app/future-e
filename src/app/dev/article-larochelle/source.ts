import path from "node:path";

// L'étude reste la source de vérité : la page relit l'article et les visuels là où ils sont versionnés.
export const ETUDE = path.join(process.cwd(), "docs/etudes/2026-10-13-larochelle-mobilite");
export const ARTICLE = path.join(ETUDE, "article/article-v3.md");
export const VISUELS = path.join(ETUDE, "visuels");
