// Faux GoTrue local (FUT-40) : sessions fictives au format Supabase, rotation des refresh tokens,
// journal de chaque appel. Aucune donnée réelle.
import http from "node:http";
const PORT = Number(process.env.MOCK_PORT || 54399);
const REUSE = process.env.REUSE || "allow10s"; // allow10s | reject
const b64u = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const USER = { id: "00000000-0000-4000-8000-000000000040", aud: "authenticated", role: "authenticated", email: "fut40-test@example.invalid", app_metadata: {}, user_metadata: {} };
const tokens = new Map(); // refresh -> { state: 'active'|'used', usedAt, child }
const access = new Map(); // access -> exp
let n = 0;
const INST = (process.env.INST || "x") + "-";
export function issue(expInSec) {
  n++;
  const exp = Math.floor(Date.now() / 1000) + expInSec;
  const at = `${b64u({ alg: "HS256", typ: "JWT" })}.${b64u({ sub: USER.id, exp, role: "authenticated", aud: "authenticated", session_id: "s1" })}.${INST}sig${n}`;
  const rt = `${INST}rt${n}`;
  tokens.set(rt, { state: "active" });
  access.set(at, exp);
  return { access_token: at, token_type: "bearer", expires_in: expInSec, expires_at: exp, refresh_token: rt, user: USER };
}
const log = (...a) => console.log(new Date().toISOString().slice(11, 23), ...a);
http.createServer(async (req, res) => {
  let body = ""; for await (const c of req) body += c;
  const url = new URL(req.url, "http://x");
  const cors = { "access-control-allow-origin": req.headers.origin || "*", "access-control-allow-credentials": "true", "access-control-allow-headers": req.headers["access-control-request-headers"] || "*", "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS" };
  const send = (code, obj) => { res.writeHead(code, { "content-type": "application/json", ...cors }); res.end(JSON.stringify(obj)); };
  if (req.method === "OPTIONS") { res.writeHead(204, cors); return res.end(); }
  const origine = req.headers.origin ? "NAVIGATEUR" : "SERVEUR";
  if (url.pathname === "/__seed") { const s = issue(Number(url.searchParams.get("exp") || 3600)); log("SEED", s.refresh_token, "exp", s.expires_in); return send(200, s); }
  if (url.pathname === "/auth/v1/token" && url.searchParams.get("grant_type") === "refresh_token") {
    const { refresh_token } = JSON.parse(body || "{}");
    const t = tokens.get(refresh_token);
    if (!t) { log(origine, "REFRESH", refresh_token, "-> 400 inconnu"); return send(400, { code: 400, error_code: "refresh_token_not_found", msg: "Invalid Refresh Token: Refresh Token Not Found" }); }
    if (t.state === "used") {
      const age = (Date.now() - t.usedAt) / 1000;
      if (REUSE === "allow10s" && age < 10) { log(origine, "REFRESH", refresh_token, `-> REUTILISATION (${age.toFixed(2)} s) acceptée, session enfant`, t.child.refresh_token); return send(200, t.child); }
      log(origine, "REFRESH", refresh_token, `-> 400 DÉJÀ UTILISÉ (${age.toFixed(2)} s)`); return send(400, { code: 400, error_code: "refresh_token_already_used", msg: "Invalid Refresh Token: Already Used" });
    }
    const child = issue(3600); t.state = "used"; t.usedAt = Date.now(); t.child = child;
    log(origine, "REFRESH", refresh_token, "-> 200 rotation vers", child.refresh_token); return send(200, child);
  }
  if (url.pathname === "/auth/v1/user") {
    const at = (req.headers.authorization || "").replace(/^Bearer /, "");
    const exp = access.get(at);
    const ok = exp && exp > Date.now() / 1000;
    log(origine, "GET /user", ok ? "-> 200" : "-> 401", at ? at.slice(-6) : "(sans jeton)");
    return ok ? send(200, USER) : send(401, { code: 401, error_code: "bad_jwt", msg: "invalid JWT" });
  }
  if (url.pathname.startsWith("/rest/v1/")) { log("REST", req.method, url.pathname); res.writeHead(200, { "content-type": "application/json", ...cors }); return res.end(req.headers.accept?.includes("vnd.pgrst.object") ? "null" : "[]"); }
  log("AUTRE", req.method, url.pathname); send(404, {});
}).listen(PORT, () => log("mock GoTrue sur", PORT, "REUSE=", REUSE));
