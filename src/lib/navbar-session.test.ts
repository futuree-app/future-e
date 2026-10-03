// FUT-40 : la Navbar ne présente plus un utilisateur connecté comme déconnecté.
import test from "node:test";
import assert from "node:assert/strict";
import { abonnerEtatSession, boutonsNavbar, etatApresEvenement, type AuthNavigateur, type EtatSession } from "./navbar-session.ts";

test("T5 : anonyme → « Se connecter » et « Commencer », visibles", () => {
  const b = boutonsNavbar("anonymous");
  assert.deepEqual([b.secondary, b.primary, b.masques], [{ href: "/connexion", label: "Se connecter" }, { href: "/inscription", label: "Commencer" }, false]);
});

test("T6 : connecté → l'espace (« Mon compte », « Mon rapport »), plus jamais « Se connecter »", () => {
  const b = boutonsNavbar("authenticated");
  assert.deepEqual([b.secondary, b.primary, b.masques], [{ href: "/compte", label: "Mon compte" }, { href: "/rapport", label: "Mon rapport" }, false]);
  assert.doesNotMatch(JSON.stringify(b), /connecter|Commencer|inscription|connexion/);
});

test("T7 : état inconnu → place réservée et MASQUÉE (pas de faux « Se connecter » visible)", () => {
  assert.equal(boutonsNavbar("unknown").masques, true);
});

test("une page qui fournit ses boutons (pages du compte) les garde, quel que soit l'état", () => {
  const ctas = { secondary: { href: "/dossier", label: "Analyser une adresse" }, primary: { href: "/rapport/dossiers", label: "Mes biens" } };
  for (const e of ["unknown", "authenticated", "anonymous"] as EtatSession[]) {
    const b = boutonsNavbar(e, ctas);
    assert.deepEqual([b.secondary, b.primary, b.masques], [ctas.secondary, ctas.primary, false]);
  }
});

function fauxClient(sessionInitiale: unknown) {
  let cb: ((e: string, s: unknown) => void) | null = null;
  let desabonne = false;
  const auth: AuthNavigateur = {
    getSession: async () => ({ data: { session: sessionInitiale } }),
    onAuthStateChange(f) { cb = f; return { data: { subscription: { unsubscribe() { desabonne = true; } } } }; },
  };
  return { auth, emettre: (e: string, s: unknown) => cb?.(e, s), desabonne: () => desabonne };
}
const tick = () => new Promise((r) => setTimeout(r, 0));

test("T8 : l'état se résout au montage, puis suit SIGNED_IN et SIGNED_OUT ; désabonnement au démontage", async () => {
  const f = fauxClient(null);
  const etats: EtatSession[] = [];
  const stop = abonnerEtatSession(f.auth, (e) => etats.push(e));
  await tick();
  assert.deepEqual(etats, ["anonymous"]);
  f.emettre("SIGNED_IN", { user: { id: "u" } });
  f.emettre("SIGNED_OUT", null);
  f.emettre("TOKEN_REFRESHED", { user: { id: "u" } });
  assert.deepEqual(etats, ["anonymous", "authenticated", "anonymous", "authenticated"]);
  stop();
  assert.equal(f.desabonne(), true);
  f.emettre("SIGNED_OUT", null);
  assert.equal(etats.length, 4, "plus aucune mise à jour après démontage");
  assert.equal(etatApresEvenement("SIGNED_OUT", { user: {} }), "anonymous");
});

test("T8 : un événement reçu avant la première lecture l'emporte sur elle", async () => {
  const f = fauxClient(null); // la lecture initiale dirait « anonyme »
  const etats: EtatSession[] = [];
  abonnerEtatSession(f.auth, (e) => etats.push(e));
  f.emettre("SIGNED_IN", { user: { id: "u" } });
  await tick();
  assert.deepEqual(etats, ["authenticated"]);
});
