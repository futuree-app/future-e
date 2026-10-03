// FUT-40 : le proxy propage la session rafraîchie à la requête aval ET à la réponse, et garde
// `x-futuree-url`. Test sur la vraie fonction `proxy`, contre un faux GoTrue local (sessions fictives au
// format Supabase, rotation des refresh tokens, réutilisation tolérée 10 s ou refusée).
import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { register } from "node:module";

// `next/server` n'a pas de carte `exports` : sous Node pur (hors bundler Next), l'import sans extension
// échoue. Ce crochet, limité à ce test, le résout vers `next/server.js` (le fichier que charge Next).
register(
  "data:text/javascript," +
    encodeURIComponent(
      'export async function resolve(s, c, next) { return next(s === "next/server" ? "next/server.js" : s, c); }',
    ),
);
const { NextRequest } = await import("next/server.js");

const b64u = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
const USER = { id: "00000000-0000-4000-8000-000000000040", aud: "authenticated", role: "authenticated", email: "fut40@example.invalid", app_metadata: {}, user_metadata: {} };
let n = 0;
let REUSE: "allow10s" | "reject" = "allow10s";
const refresh = new Map<string, { usedAt?: number; child?: Session }>();
const access = new Map<string, number>();
const journal: string[] = [];
type Session = ReturnType<typeof emettre>;
function emettre(expDans: number) {
  n += 1;
  const exp = Math.floor(Date.now() / 1000) + expDans;
  const at = `${b64u({ alg: "HS256" })}.${b64u({ sub: USER.id, exp })}.sig${n}`;
  refresh.set(`rt${n}`, {});
  access.set(at, exp);
  return { access_token: at, token_type: "bearer", expires_in: expDans, expires_at: exp, refresh_token: `rt${n}`, user: USER };
}
let serveur: http.Server;
before(async () => {
  serveur = http.createServer(async (req, res) => {
    let corps = ""; for await (const c of req) corps += c;
    const url = new URL(req.url!, "http://x");
    const json = (code: number, o: unknown) => { res.writeHead(code, { "content-type": "application/json" }); res.end(JSON.stringify(o)); };
    if (url.pathname === "/auth/v1/token") {
      const rt = JSON.parse(corps).refresh_token as string;
      const t = refresh.get(rt);
      if (!t) return json(400, { error_code: "refresh_token_not_found", msg: "not found" });
      if (t.usedAt != null) {
        if (REUSE === "allow10s" && Date.now() - t.usedAt < 10_000) { journal.push(`reutilisation ${rt} acceptee`); return json(200, t.child); }
        journal.push(`reutilisation ${rt} refusee`); return json(400, { error_code: "refresh_token_already_used", msg: "Invalid Refresh Token: Already Used" });
      }
      t.usedAt = Date.now(); t.child = emettre(3600); journal.push(`refresh ${rt} -> ${t.child.refresh_token}`);
      return json(200, t.child);
    }
    if (url.pathname === "/auth/v1/user") {
      const at = (req.headers.authorization ?? "").replace("Bearer ", "");
      const ok = (access.get(at) ?? 0) > Date.now() / 1000;
      return ok ? json(200, USER) : json(401, { error_code: "bad_jwt" });
    }
    json(404, {});
  }).listen(0);
  await new Promise((r) => serveur.once("listening", r));
  process.env.NEXT_PUBLIC_SUPABASE_URL = `http://127.0.0.1:${(serveur.address() as AddressInfo).port}`;
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "cle-de-test";
});
after(() => serveur.close());

const NOM = "sb-127-auth-token";
const cookieDe = (s: Session) => `${NOM}=base64-${b64u(s)}`;
const decoder = (valeur: string) => JSON.parse(Buffer.from(valeur.replace(/^base64-/, ""), "base64url").toString());
async function passer(chemin: string, s: Session) {
  const { proxy, HEADER_URL } = await import("./proxy.ts");
  const res = await proxy(new NextRequest(`http://localhost${chemin}`, { headers: { cookie: cookieDe(s) } }));
  const aval = res.headers.get("x-middleware-request-cookie") ?? "";
  const avalSession = aval.match(new RegExp(`${NOM}=([^;]+)`))?.[1];
  return {
    res,
    url: res.headers.get(`x-middleware-request-${HEADER_URL}`),
    setCookie: res.cookies.get(NOM)?.value,
    avalRefresh: avalSession ? decoder(avalSession).refresh_token : null,
  };
}

test("T9 : rotation → la requête aval porte le NOUVEAU cookie, jamais l'ancien ; le navigateur le reçoit", async () => {
  REUSE = "allow10s";
  const s = emettre(-60); // jeton expiré
  const r = await passer("/rapport", s);
  assert.ok(r.setCookie, "le navigateur reçoit un Set-Cookie de session");
  const nouveau = decoder(r.setCookie!).refresh_token;
  assert.notEqual(nouveau, s.refresh_token);
  assert.equal(r.avalRefresh, nouveau, "les Server Components voient la session rafraîchie");
  assert.notEqual(r.avalRefresh, s.refresh_token, "l'ancien cookie n'est pas transmis en aval");
  // Une réponse qui pose un cookie de session n'est pas cacheable (en-têtes fournis par @supabase/ssr).
  assert.match(r.res.headers.get("cache-control") ?? "", /private.*no-store/);
});

test("T9 : sans refresh, ni Set-Cookie ni en-tête anti-cache ajouté ; le cookie d'origine passe tel quel", async () => {
  const s = emettre(3600);
  const r = await passer("/pourquoi", s);
  assert.equal(r.setCookie, undefined);
  assert.equal(r.avalRefresh, s.refresh_token);
});

test("T10 : x-futuree-url porte le chemin ET la query, avec ou sans refresh", async () => {
  for (const exp of [-60, 3600]) {
    const r = await passer("/rapport/logement?dossierId=abc", emettre(exp));
    assert.equal(r.url, "/rapport/logement?dossierId=abc", `exp ${exp}`);
  }
});

test("T12 : course de refresh (navigateur puis proxy, même jeton) — tolérance normale : aucune perte", async () => {
  REUSE = "allow10s";
  const s = emettre(-60);
  await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, { method: "POST", body: JSON.stringify({ refresh_token: s.refresh_token }) });
  const r = await passer("/rapport", s);
  assert.ok(r.setCookie, "le proxy obtient la session enfant et la pose");
  assert.ok(journal.includes(`reutilisation ${s.refresh_token} acceptee`));
  assert.equal(r.avalRefresh, decoder(r.setCookie!).refresh_token);
});

test("T12 (témoin) : réutilisation refusée → le banc détecte bien la perte (cookie effacé)", async () => {
  REUSE = "reject";
  const s = emettre(-60);
  await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, { method: "POST", body: JSON.stringify({ refresh_token: s.refresh_token }) });
  const r = await passer("/rapport", s);
  assert.equal(r.setCookie, "", "le cookie de session est effacé : c'est la perte que le test doit savoir voir");
  REUSE = "allow10s";
});
