import { pathToFileURL } from "node:url"; import fs from "node:fs"; import path from "node:path";
const SRC = "/private/tmp/claude-501/fut41-v33/repo/src";
const fichier = (p) => fs.existsSync(p) && fs.statSync(p).isFile();
export async function resolve(spec, ctx, next) {
  if (spec === "server-only" || spec === "client-only") return { url: "data:text/javascript,export {}", shortCircuit: true };
  if (spec === "next/server" || spec === "next/headers" || spec === "next/cache") return next(spec + ".js", ctx);
  if (spec.startsWith("@/")) {
    const b = path.join(SRC, spec.slice(2));
    for (const c of [b, b + ".ts", b + ".tsx", b + "/index.ts"]) if (fichier(c)) return { url: pathToFileURL(c).href, shortCircuit: true };
  }
  try { return await next(spec, ctx); } catch (e) {
    if (spec.startsWith(".") && ctx.parentURL) { const b = new URL(spec, ctx.parentURL).pathname; for (const c of [b + ".ts", b + ".tsx", b + "/index.ts"]) if (fichier(c)) return { url: pathToFileURL(c).href, shortCircuit: true }; }
    throw e;
  }
}
