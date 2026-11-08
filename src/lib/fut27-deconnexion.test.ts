// FUT-27 · Réserve de la contre-revue : une déconnexion explicite efface les recherches temporaires.
//
// Le défaut : la recherche « Où vivre » vivait 2 h dans le localStorage, déconnexion ou pas. Après le départ
// du compte A, elle restait affichée en anonyme et le compte B, connecté sur le même navigateur, se la voyait
// proposer comme projet. Ces tests rejouent le navigateur avec de vrais stockages (un localStorage partagé
// par les onglets, un sessionStorage par onglet) et les fonctions qu'appellent les écrans. Sans la purge,
// les cas A, B et C échouent : la recherche de A se relit.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  CLE_PACK_LABEL, CLE_PACK_PARSED, CLE_PAYWALL_LABELS, PURGE_RECHERCHE_KEY, SESSION_OUVIVRE_KEY, SESSION_OUVIVRE_TTL_MS,
  anterieurALaPurge, lirePurgeRecherche, lireSessionOuVivre, serialiserSessionOuVivre,
} from "./comparateur/session-ou-vivre.ts";
import {
  CLES_RECHERCHE_NAVIGATEUR, CLES_RECHERCHE_ONGLET, CLE_LANDING_COMMUNE, COOKIE_PURGE_DIFFEREE, PURGE_PAR_LE_NAVIGATEUR,
  appliquerPurgeDiffereeSur, jetonPurgeDifferee, purgeFaiteParLeNavigateur, purgerOnglet, purgerRecherchesTemporaires,
} from "./purge-recherche.ts";
import { lireRechercheSession } from "./reprise-recherche.ts";
import { WIZARD_STORAGE_KEY } from "../components/wizard/types.ts";

const T0 = Date.parse("2026-11-08T10:00:00.000Z");
const lire = (chemin: string) => readFileSync(new URL(chemin, import.meta.url), "utf8");

class Stockage {
  m = new Map<string, string>();
  getItem(k: string) { return this.m.has(k) ? this.m.get(k)! : null; }
  setItem(k: string, v: string) { this.m.set(k, String(v)); }
  removeItem(k: string) { this.m.delete(k); }
  clear() { throw new Error("clear() interdit : la purge ne vise que les recherches"); }
}

const outcome = { couverture: "complete", results: [{ insee: "33063", couverture: { etat: "complete", nonMesurees: [] } }] };
const parsed = (ville: string) => ({ reformulation: `Près de ${ville}`, hardConstraints: { zones: [] }, preferences: [{ key: "cadre_calme", weight: 2 }] });

/** Un onglet « Où vivre » : il écrit comme saveSession / onExplore / onPackDecision, sous la même garde. */
class OngletOuVivre {
  origine: number;
  local: Stockage;
  enMemoire: string | null = null;
  constructor(local: Stockage, maintenant: number) { this.local = local; this.origine = maintenant; }
  chercher(ville: string, maintenant: number) {
    this.origine = maintenant; // runParse : une recherche voulue maintenant
    this.enMemoire = ville;
    this.enregistrer(maintenant);
  }
  /** Ce que fait l'effet de sauvegarde à chaque changement d'état en résultats. */
  enregistrer(maintenant: number) {
    if (!this.enMemoire) return false;
    if (anterieurALaPurge(this.origine, lirePurgeRecherche(this.local.getItem(PURGE_RECHERCHE_KEY)))) return false;
    const texte = `Une ville près de ${this.enMemoire}`;
    this.local.setItem(SESSION_OUVIVRE_KEY, serialiserSessionOuVivre(
      { submittedText: texte, parsed: parsed(this.enMemoire), outcome, synthesis: "", askMessages: [], askRemaining: 2, askLimit: false },
      maintenant,
    ));
    this.local.setItem(CLE_PACK_PARSED, JSON.stringify(parsed(this.enMemoire)));
    this.local.setItem(CLE_PACK_LABEL, texte);
    this.local.setItem(CLE_PAYWALL_LABELS, JSON.stringify(["Calme"]));
    return true;
  }
  /** Le rappel de useOubliALaPurge : il oublie sa mémoire si elle date d'avant la purge, sans toucher au stockage. */
  apprendrePurge(maintenant: number) {
    if (!anterieurALaPurge(this.origine, lirePurgeRecherche(this.local.getItem(PURGE_RECHERCHE_KEY)))) return;
    this.origine = maintenant;
    this.enMemoire = null;
  }
  /** Ce que relisent « Où vivre » (loadSession) et /rapport (RepriseRecherche) au montage. */
  relire(maintenant: number) {
    const purge = lirePurgeRecherche(this.local.getItem(PURGE_RECHERCHE_KEY));
    return {
      ouVivre: lireSessionOuVivre(this.local.getItem(SESSION_OUVIVRE_KEY), maintenant, purge)?.submittedText ?? null,
      reprise: lireRechercheSession(this.local.getItem(SESSION_OUVIVRE_KEY), maintenant, purge)?.rawText ?? null,
    };
  }
}

const deconnexion = (local: Stockage, onglet: Stockage, maintenant: number) => purgerRecherchesTemporaires(local, onglet, maintenant);

// ── A · déconnexion simple ──────────────────────────────────────────────────────────────────────────

test("A : après la déconnexion, Bordeaux n'est plus ni dans le stockage, ni réaffiché, ni proposé", () => {
  const local = new Stockage();
  const onglet = new Stockage();
  local.setItem("futuree-theme", "dark");
  local.setItem("futuree-consent", "denied");
  local.setItem("futuree:horizon", "2050");
  onglet.setItem("futuree:landing-qna-count", "1");
  onglet.setItem(WIZARD_STORAGE_KEY, JSON.stringify({ answers: { metier: "sante" } }));
  onglet.setItem(CLE_LANDING_COMMUNE, JSON.stringify({ name: "Bordeaux" }));
  const a = new OngletOuVivre(local, T0);
  a.chercher("Bordeaux", T0);
  assert.equal(a.relire(T0 + 1).reprise, "Une ville près de Bordeaux", "avant : la recherche se relit");

  deconnexion(local, onglet, T0 + 10);

  for (const k of CLES_RECHERCHE_NAVIGATEUR) assert.equal(local.getItem(k), null, k);
  for (const k of CLES_RECHERCHE_ONGLET) assert.equal(onglet.getItem(k), null, k);
  assert.deepEqual(a.relire(T0 + 20), { ouVivre: null, reprise: null });
  // Le reste du site n'est pas touché.
  assert.equal(local.getItem("futuree-theme"), "dark");
  assert.equal(local.getItem("futuree-consent"), "denied");
  assert.equal(local.getItem("futuree:horizon"), "2050");
  assert.equal(onglet.getItem("futuree:landing-qna-count"), "1");
  assert.equal(lirePurgeRecherche(local.getItem(PURGE_RECHERCHE_KEY)), T0 + 10);
});

// ── B · navigateur partagé ──────────────────────────────────────────────────────────────────────────

test("B : le compte B, connecté après le départ de A, ne retrouve aucune recherche de A, même réinjectée", () => {
  const local = new Stockage();
  const a = new OngletOuVivre(local, T0);
  a.chercher("Bordeaux", T0);
  const ecriteParA = local.getItem(SESSION_OUVIVRE_KEY);
  deconnexion(local, new Stockage(), T0 + 10);
  // B se connecte : la reprise de /rapport relit le stockage, rien à proposer, donc ni aperçu ni écriture.
  assert.equal(new OngletOuVivre(local, T0 + 20).relire(T0 + 20).reprise, null);
  // Même remise en place (copie, onglet en retard), la session de A date d'avant la purge : refusée.
  local.setItem(SESSION_OUVIVRE_KEY, ecriteParA!);
  assert.deepEqual(new OngletOuVivre(local, T0 + 30).relire(T0 + 30), { ouVivre: null, reprise: null });
  // Sans purge (le comportement d'avant), elle se relisait : c'est bien la purge qui protège.
  assert.equal(lireRechercheSession(ecriteParA, T0 + 30, null)?.rawText, "Une ville près de Bordeaux");
});

// ── C · plusieurs onglets ───────────────────────────────────────────────────────────────────────────

test("C : les onglets ouverts oublient la recherche ; un onglet en retard ne la réécrit pas", () => {
  const local = new Stockage();
  const ouVivre = new OngletOuVivre(local, T0);
  ouVivre.chercher("Bordeaux", T0);
  const rapport = new OngletOuVivre(local, T0 + 1); // /rapport : il a lu Bordeaux au montage
  rapport.enMemoire = "Bordeaux";
  const endormi = new OngletOuVivre(local, T0 + 2); // un onglet qui ne reçoit pas l'événement à temps
  endormi.enMemoire = "Bordeaux";

  deconnexion(local, new Stockage(), T0 + 10); // depuis un troisième onglet

  ouVivre.apprendrePurge(T0 + 11);
  rapport.apprendrePurge(T0 + 11);
  assert.equal(ouVivre.enMemoire, null);
  assert.equal(rapport.enMemoire, null);
  // L'onglet endormi garde Bordeaux en mémoire et veut l'enregistrer (une question AskFuture, un clic Pack) :
  // sa mémoire date d'avant la purge, l'écriture est refusée et le stockage reste vide.
  assert.equal(endormi.enregistrer(T0 + 12), false);
  for (const k of CLES_RECHERCHE_NAVIGATEUR) assert.equal(local.getItem(k), null, k);
  // Il se réveille (visibilité, retour arrière) : il oublie à son tour.
  endormi.apprendrePurge(T0 + 13);
  assert.equal(endormi.enMemoire, null);
});

test("C : le sessionStorage des autres onglets est effacé à la purge (questionnaire, commune de l'accueil)", () => {
  const autreOnglet = new Stockage();
  autreOnglet.setItem(WIZARD_STORAGE_KEY, JSON.stringify({ answers: { projets: "achat" } }));
  autreOnglet.setItem(CLE_LANDING_COMMUNE, JSON.stringify({ name: "Bordeaux" }));
  autreOnglet.setItem("futuree:landing-qna-count", "1");
  purgerOnglet(autreOnglet); // ce que fait EcoutePurgeRecherche dans chaque onglet qui apprend la purge
  assert.equal(autreOnglet.getItem(WIZARD_STORAGE_KEY), null);
  assert.equal(autreOnglet.getItem(CLE_LANDING_COMMUNE), null);
  assert.equal(autreOnglet.getItem("futuree:landing-qna-count"), "1");
});

// ── D · anonyme puis connecté ───────────────────────────────────────────────────────────────────────

test("D : la recherche Nantes faite sans compte se relit après connexion (rien n'est purgé à la connexion)", () => {
  const local = new Stockage();
  const anonyme = new OngletOuVivre(local, T0);
  anonyme.chercher("Nantes", T0);
  // La connexion ne purge pas : seule la déconnexion le fait (vérifié dans le code plus bas).
  assert.equal(new OngletOuVivre(local, T0 + 60_000).relire(T0 + 60_000).reprise, "Une ville près de Nantes");
  // Même après une déconnexion plus ancienne, une recherche faite depuis reste reprenable.
  const local2 = new Stockage();
  deconnexion(local2, new Stockage(), T0 - 1000);
  const anonyme2 = new OngletOuVivre(local2, T0 - 500);
  anonyme2.chercher("Nantes", T0);
  assert.equal(new OngletOuVivre(local2, T0 + 1).relire(T0 + 1).reprise, "Une ville près de Nantes");
});

// ── E · nouvelle recherche après la déconnexion ─────────────────────────────────────────────────────

test("E : Rennes, cherchée après la purge, reste disponible, et l'ancien onglet ne l'efface pas", () => {
  const local = new Stockage();
  const ancien = new OngletOuVivre(local, T0);
  ancien.chercher("Bordeaux", T0);
  deconnexion(local, new Stockage(), T0 + 10);
  const nouveau = new OngletOuVivre(local, T0 + 20);
  nouveau.chercher("Rennes", T0 + 30);
  // L'ancien onglet apprend la purge APRÈS que Rennes a été écrite (événement en retard) : il oublie
  // Bordeaux, il n'efface pas le stockage, Rennes reste.
  ancien.apprendrePurge(T0 + 40);
  assert.equal(ancien.enMemoire, null);
  assert.deepEqual(new OngletOuVivre(local, T0 + 50).relire(T0 + 50), {
    ouVivre: "Une ville près de Rennes", reprise: "Une ville près de Rennes",
  });
  // Rennes elle-même, cherchée dans l'ancien onglet, s'y enregistre : la purge ne bloque que l'avant.
  ancien.chercher("Rennes", T0 + 60);
  assert.equal(lireRechercheSession(local.getItem(SESSION_OUVIVRE_KEY), T0 + 61, T0 + 10)?.rawText, "Une ville près de Rennes");
  // Et le délai de 2 h vaut toujours.
  assert.equal(lireRechercheSession(local.getItem(SESSION_OUVIVRE_KEY), T0 + 60 + SESSION_OUVIVRE_TTL_MS + 1, T0 + 10), null);
});

test("barrière : la date de purge illisible ne bloque rien, une session écrite à la même milliseconde est refusée", () => {
  for (const brut of [null, "", "abc", "-5", "0", "NaN"]) assert.equal(lirePurgeRecherche(brut), null, String(brut));
  assert.equal(lirePurgeRecherche(String(T0)), T0);
  assert.equal(anterieurALaPurge(T0, T0), true);
  assert.equal(anterieurALaPurge(T0 + 1, T0), false);
  assert.equal(anterieurALaPurge(T0, null), false);
});

// ── Le branchement dans le code : où la purge part, où elle est écoutée, où elle garde les écritures ────

const tousLesFichiers = (dir: string): string[] => readdirSync(dir).flatMap((n) => {
  const p = join(dir, n);
  return statSync(p).isDirectory() ? tousLesFichiers(p) : /\.(ts|tsx)$/.test(n) && !/\.test\./.test(n) ? [p] : [];
});
const src = new URL("..", import.meta.url).pathname;

test("code : la purge part du seul formulaire de déconnexion, jamais de la connexion ni de l'inscription", () => {
  const appelants = tousLesFichiers(src).filter((f) => /purgerRecherchesDuNavigateur\(/.test(readFileSync(f, "utf8")));
  assert.deepEqual(appelants.map((f) => f.slice(src.length)).sort(), [
    "app/(account)/compte/FormulaireDeconnexion.tsx",
    "components/interaction/purge-recherche-navigateur.ts",
  ]);
  const formulaire = lire("../app/(account)/compte/FormulaireDeconnexion.tsx");
  assert.match(formulaire, /<form action=\{signOutAction\} onSubmit=\{\(\) => purgerRecherchesDuNavigateur\(\)\}/);
  // Plus aucun formulaire de déconnexion qui partirait sans purger.
  const sansPurge = tousLesFichiers(src).filter((f) => /action=\{signOutAction\}/.test(readFileSync(f, "utf8")));
  assert.deepEqual(sansPurge.map((f) => f.slice(src.length)), ["app/(account)/compte/FormulaireDeconnexion.tsx"]);
  assert.match(lire("../app/(account)/compte/page.tsx"), /<FormulaireDeconnexion /);
  // La Server Action ferme toujours la session et redirige.
  const actions = lire("../app/auth/actions.ts");
  assert.match(actions, /export async function signOutAction\(formData\?: FormData\) \{[\s\S]*?await supabase\.auth\.signOut\(\);[\s\S]*?redirect\("\/"\);/);
  // Le serveur n'efface rien lui-même ; la connexion ne purge pas.
  assert.doesNotMatch(actions, /removeItem|localStorage|sessionStorage/);
  assert.doesNotMatch(lire("../app/auth/callback/route.ts"), /purge|removeItem|localStorage/);
  for (const nom of ["signInWithPasswordAction", "signUpWithPasswordAction"]) {
    const debut = actions.indexOf(`export async function ${nom}`);
    const corps = actions.slice(debut, actions.indexOf("\nexport ", debut + 1));
    assert.doesNotMatch(corps, /PURGE|purge/, nom);
  }
});

test("code : jamais de clear(), et les clés de recherche ne vivent qu'à un endroit", () => {
  for (const f of tousLesFichiers(src)) {
    assert.doesNotMatch(readFileSync(f, "utf8"), /(localStorage|sessionStorage)\.clear\(/, f);
  }
  const avecLitteral = tousLesFichiers(src).filter((f) => /["']futuree:(projet:|ouvivre:session|recherche:purgee|landing-commune)/.test(readFileSync(f, "utf8")));
  assert.deepEqual(avecLitteral.map((f) => f.slice(src.length)).sort(), ["lib/comparateur/session-ou-vivre.ts", "lib/purge-recherche.ts"]);
});

test("code : chaque écriture d'« Où vivre » passe par la garde de purge", () => {
  const client = lire("../app/(public)/ou-vivre/OuVivreClient.tsx");
  const lignes = client.split("\n");
  const ecritures = lignes
    .map((l, i) => ({ l, i }))
    .filter(({ l }) => /localStorage\.setItem\(|(?<!function )saveSession\(/.test(l) && !/function saveSession/.test(l));
  // saveSession (définition exclue), les priorités du paywall, la lecture et le texte du Pack.
  const appels = ecritures.filter(({ l }) => !/serialiserSessionOuVivre/.test(l));
  assert.equal(appels.length, 4, appels.map(({ l }) => l.trim()).join("\n"));
  for (const { l, i } of appels) {
    const avant = lignes.slice(Math.max(0, i - 3), i + 1).join("\n");
    assert.match(avant, /peutEcrireRecherche\(origineRecherche\.current\)/, l.trim());
  }
  // Une nouvelle recherche avance l'origine : elle s'enregistre même après une purge.
  assert.equal((client.match(/origineRecherche\.current = Date\.now\(\)/g) ?? []).length, 2, "runParse et launchFromAnchor");
  // L'oubli efface la mémoire de l'écran, jamais le stockage : il ne peut pas supprimer une recherche postérieure.
  const oubli = client.slice(client.indexOf("useOubliALaPurge(() => {"), client.indexOf("});", client.indexOf("useOubliALaPurge(() => {")));
  assert.match(oubli, /runSeq\.current\+\+/);
  assert.match(oubli, /setParsed\(null\)/);
  assert.match(oubli, /setText\(""\)/);
  assert.doesNotMatch(oubli, /clearSession|removeItem/);
  // Les réponses AskFuture encore en route sont abandonnées.
  assert.ok((client.match(/if \(seq !== runSeq\.current\) return;/g) ?? []).length >= 6);
});

test("code : la reprise oublie recherche et aperçu, et abandonne les aperçus encore en route", () => {
  const reprise = lire("../components/report/RepriseRecherche.tsx");
  assert.match(reprise, /const purge = purgeRechercheConnue\(\);\s*return lireRechercheSession\(window\.localStorage\.getItem\(SESSION_RECHERCHE_KEY\), Date\.now\(\), purge\)/);
  const oubli = reprise.slice(reprise.indexOf("useOubliALaPurge(() => {"), reprise.indexOf("});", reprise.indexOf("useOubliALaPurge(() => {")));
  for (const m of [/generation\.current\+\+/, /setRecherche\(null\)/, /setApercu\(null\)/, /setOuvert\(false\)/]) assert.match(oubli, m);
  assert.equal((reprise.match(/if \(perime\(\)/g) ?? []).length, 3, "après la session, après l'aperçu, après sa lecture");
  assert.match(reprise, /if \(!peutEcrireRecherche\(origine\.current\)\) return;[^\n]*\s*setEtat\("envoi"\)/);
});

test("code : la purge est écoutée partout où une recherche est affichée, et sur toutes les pages", () => {
  for (const f of [
    "../app/(public)/comparateur/pack-decision/PackConvictionView.tsx",
    "../app/(public)/territoire/[insee]/debloquer/PersonalTouch.tsx",
  ]) assert.match(lire(f), /useOubliALaPurge\(/, f);
  assert.match(lire("../app/layout.tsx"), /<EcoutePurgeRecherche \/>/);
  const nav = lire("../components/interaction/purge-recherche-navigateur.ts");
  for (const m of [/"storage"/, /EVENEMENT_PURGE_RECHERCHE/, /"pageshow"/, /e\.persisted/, /"visibilitychange"/]) assert.match(nav, m);
});

// ── Déconnexion envoyée avant l'hydratation, ou sans JavaScript : la purge différée ───────────────────

test("différée : seul un formulaire qui dit avoir purgé évite le cookie ; tout le reste le demande", () => {
  assert.equal(purgeFaiteParLeNavigateur(PURGE_PAR_LE_NAVIGATEUR), true);
  for (const v of [undefined, null, "", "serveur", "NAVIGATEUR", 1, {}]) assert.equal(purgeFaiteParLeNavigateur(v), false, String(v));
  assert.equal(jetonPurgeDifferee(`a=1; ${COOKIE_PURGE_DIFFEREE}=ab12cd; b=2`), "ab12cd");
  assert.equal(jetonPurgeDifferee("a=1"), null);
  assert.equal(jetonPurgeDifferee(`${COOKIE_PURGE_DIFFEREE}=`), null);
  assert.equal(jetonPurgeDifferee(`${COOKIE_PURGE_DIFFEREE}=<script>`), null);
});

test("différée : clic avant l'hydratation, puis la page suivante purge avant de lire ; B ne retrouve rien", () => {
  const local = new Stockage();
  const onglet = new Stockage();
  const a = new OngletOuVivre(local, T0);
  a.chercher("Bordeaux", T0);
  onglet.setItem(WIZARD_STORAGE_KEY, JSON.stringify({ answers: { projets: "achat" } }));
  // La Server Action a fermé la session sans purge du navigateur, et a déposé le cookie.
  const cookies = `futuree-consent=denied; ${COOKIE_PURGE_DIFFEREE}=jeton1`;
  assert.equal(new OngletOuVivre(local, T0 + 5).relire(T0 + 5).reprise, "Une ville près de Bordeaux", "avant la page suivante");
  // La page de redirection (ou toute page) applique la purge avant sa première lecture.
  assert.equal(appliquerPurgeDiffereeSur(cookies, local, onglet, T0 + 10), true);
  for (const k of CLES_RECHERCHE_NAVIGATEUR) assert.equal(local.getItem(k), null, k);
  assert.equal(onglet.getItem(WIZARD_STORAGE_KEY), null);
  // Le compte B se connecte : rien à reprendre, et l'onglet resté ouvert sur Bordeaux n'écrit plus.
  assert.equal(new OngletOuVivre(local, T0 + 20).relire(T0 + 20).reprise, null);
  assert.equal(a.enregistrer(T0 + 21), false);
});

test("différée : le cookie resté en place ne purge qu'une fois ; Rennes, cherchée ensuite, reste", () => {
  const local = new Stockage();
  const cookies = `${COOKIE_PURGE_DIFFEREE}=jeton1`;
  appliquerPurgeDiffereeSur(cookies, local, new Stockage(), T0);
  const anonyme = new OngletOuVivre(local, T0 + 10);
  anonyme.chercher("Rennes", T0 + 20);
  // Le cookie n'a pas pu être effacé : le même jeton ne repurge pas.
  assert.equal(appliquerPurgeDiffereeSur(cookies, local, new Stockage(), T0 + 30), false);
  assert.equal(new OngletOuVivre(local, T0 + 40).relire(T0 + 40).reprise, "Une ville près de Rennes");
  // Une nouvelle déconnexion (nouveau jeton) purge de nouveau.
  assert.equal(appliquerPurgeDiffereeSur(`${COOKIE_PURGE_DIFFEREE}=jeton2`, local, new Stockage(), T0 + 50), true);
  assert.equal(new OngletOuVivre(local, T0 + 60).relire(T0 + 60).reprise, null);
  // Sans cookie, rien ne se passe : la continuité anonyme → connexion est intacte.
  const local2 = new Stockage();
  new OngletOuVivre(local2, T0).chercher("Nantes", T0);
  assert.equal(appliquerPurgeDiffereeSur("futuree-consent=denied", local2, new Stockage(), T0 + 1), false);
  assert.equal(new OngletOuVivre(local2, T0 + 2).relire(T0 + 2).reprise, "Une ville près de Nantes");
});

test("code différée : le formulaire dit s'il a purgé, la Server Action dépose le cookie sinon, les lecteurs l'appliquent", () => {
  const formulaire = lire("../app/(account)/compte/FormulaireDeconnexion.tsx");
  assert.match(formulaire, /<input type="hidden" name=\{CHAMP_PURGE\} value=\{hydrate \? PURGE_PAR_LE_NAVIGATEUR : "serveur"\} \/>/);
  assert.doesNotMatch(formulaire, /disabled/, "le bouton reste actif : sans JavaScript, la déconnexion doit rester possible");
  const actions = lire("../app/auth/actions.ts");
  const sortie = actions.slice(actions.indexOf("export async function signOutAction"));
  assert.match(sortie, /await supabase\.auth\.signOut\(\);[\s\S]*if \(!purgeFaiteParLeNavigateur\(formData\?\.get\(CHAMP_PURGE\)\)\) \{\s*\(await cookies\(\)\)\.set\(COOKIE_PURGE_DIFFEREE,/);
  assert.match(sortie, /httpOnly: false/);
  assert.match(sortie, /redirect\("\/"\);/);
  const nav = lire("../components/interaction/purge-recherche-navigateur.ts");
  assert.match(nav, /export function purgeRechercheConnue\(\): number \| null \{\s*appliquerPurgeDifferee\(\);/);
  // Les lecteurs qui ne passent pas par la date de purge l'appliquent eux-mêmes, avant de lire.
  const lecteurs: [string, RegExp][] = [
    ["../app/(public)/comparateur/pack-decision/PackConvictionView.tsx", /appliquerPurgeDifferee\(\);[^\n]*\n\s*try \{\n\s*const raw = window\.localStorage\.getItem\(CLE_PACK_PARSED\)/],
    ["../app/(public)/territoire/[insee]/debloquer/PersonalTouch.tsx", /appliquerPurgeDifferee\(\);[^\n]*\n\s*try \{\n\s*const raw = window\.localStorage\.getItem\(CLE_PAYWALL_LABELS\)/],
    ["../components/wizard/WizardAnswersSync.tsx", /appliquerPurgeDifferee\(\);\s*const answers = readWizardAnswersFromStorage\(\)/],
    ["../components/wizard/RapportPremiereLecture.tsx", /appliquerPurgeDifferee\(\);[^\n]*\n\s*const stored = readWizardAnswersFromStorage\(\)/],
    ["../components/wizard/ReportWizard.tsx", /function loadFromStorage\(\): Partial<WizardState> \{\s*appliquerPurgeDifferee\(\);/],
    ["../components/FutureELanding.tsx", /appliquerPurgeDifferee\(\);[^\n]*\n\s*try \{\n\s*const raw = window\.sessionStorage\.getItem\(LANDING_COMMUNE_STORAGE_KEY\)/],
  ];
  for (const [f, m] of lecteurs) assert.match(lire(f), m, f);
  // Toute autre lecture des clés purgées passe par l'un de ces chemins.
  const lectures = tousLesFichiers(src).filter((f) => /getItem\((SESSION_OUVIVRE_KEY|SESSION_RECHERCHE_KEY|CLE_PACK_PARSED|CLE_PACK_LABEL|CLE_PAYWALL_LABELS|WIZARD_STORAGE_KEY|LANDING_COMMUNE_STORAGE_KEY)\)/.test(readFileSync(f, "utf8")));
  assert.deepEqual(lectures.map((f) => f.slice(src.length)).sort(), [
    "app/(public)/comparateur/pack-decision/PackConvictionView.tsx",
    "app/(public)/ou-vivre/OuVivreClient.tsx",
    "app/(public)/territoire/[insee]/debloquer/PersonalTouch.tsx",
    "components/FutureELanding.tsx",
    "components/report/RepriseRecherche.tsx",
    "components/wizard/ReportWizard.tsx",
    "components/wizard/types.ts",
  ]);
});
