// FUT-27 · Un Projet durable, des recherches libres, des changements volontaires.
//
// Le contrat Recherche → Projet, cas par cas. Le défaut d'origine : la reprise de /rapport attendait une
// session v3 quand « Où vivre » écrivait la v5 ; ses tests fabriquaient une v3 et passaient. Ici, chaque session
// est écrite par le sérialiseur d'« Où vivre » et relue par le lecteur de la reprise : l'aller-retour EST le test.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  SESSION_OUVIVRE_KEY, SESSION_OUVIVRE_TTL_MS, SESSION_OUVIVRE_VERSION, SCRIPT_RETOUR_ARRIERE_OUVIVRE,
  lireSessionOuVivre, serialiserSessionOuVivre,
} from "./comparateur/session-ou-vivre.ts";
import { SESSION_RECHERCHE_KEY, lireRechercheSession, libelleReprise, phraseAbandon } from "./reprise-recherche.ts";
import { apercuComplet, decisionReprise, parsedPourLeProjet, projetDepuisRecherche } from "./decision/recherche-vers-projet.ts";
import { normalizeUserProject, type UserProject } from "./user-project.ts";
import type { ParsedProject } from "./comparateur-vie.ts";

const MAINTENANT = Date.parse("2026-11-08T10:00:00.000Z");
const resoudre = () => null;
const lire = (chemin: string) => readFileSync(new URL(chemin, import.meta.url), "utf8");

const outcome = (insee: string) => ({ couverture: "complete", results: [{ insee, couverture: { etat: "complete", nonMesurees: [] } }] });
const parsedDe = (zone: string, over: Partial<ParsedProject> = {}) => ({
  reformulation: `Vivre près de ${zone}`, hardConstraints: { zones: [] }, preferences: [{ key: "cadre_calme", weight: 2 }],
  ...over,
} as unknown as ParsedProject);

/** Exactement ce qu'« Où vivre » dépose (saveSession), à `il_y_a` millisecondes. */
function sessionOuVivre(texte: string, parsed: ParsedProject, il_y_a = 60_000) {
  return serialiserSessionOuVivre(
    { submittedText: texte, parsed, outcome: outcome("44109"), synthesis: "", askMessages: [], askRemaining: 2, askLimit: false },
    MAINTENANT - il_y_a,
  );
}

const PROJET: UserProject = normalizeUserProject({
  posture: "recherche", intent: "achat", rawText: "Près de Nantes, au calme", updatedAt: "2026-11-01T08:00:00.000Z",
  parsed: { reformulation: "Près de Nantes", hardConstraints: { zones: [{ zone: "pays_de_la_loire", strength: "hard" }] }, preferences: [{ key: "cadre_calme", weight: 3 }] },
  conditions: [{ criterion: { kind: "hard", key: "zones" }, fingerprint: "f", confirmedAt: "2026-11-01T08:00:00.000Z", source: "user" }],
})!;

// ── Le défaut d'origine ─────────────────────────────────────────────────────────────────────────────

test("session : ce qu'« Où vivre » écrit, /rapport le relit (le défaut v5 ≠ v3)", () => {
  const parsed = parsedDe("Rennes");
  const r = lireRechercheSession(sessionOuVivre("Une ville comme Rennes", parsed), MAINTENANT);
  assert.deepEqual(r, { parsed, rawText: "Une ville comme Rennes" });
  assert.equal(SESSION_RECHERCHE_KEY, SESSION_OUVIVRE_KEY, "une seule clé");
});

test("session : versions anciennes, expirées, datées du futur, illisibles ou non reconstituables → rien n'est proposé", () => {
  const ok = JSON.parse(sessionOuVivre("x", parsedDe("Nantes")));
  const variante = (over: Record<string, unknown>) => JSON.stringify({ ...ok, ...over });
  for (let v = 2; v < SESSION_OUVIVRE_VERSION; v++) assert.equal(lireRechercheSession(variante({ v }), MAINTENANT), null, `v${v}`);
  assert.equal(lireRechercheSession(variante({ v: SESSION_OUVIVRE_VERSION + 1 }), MAINTENANT), null, "version inconnue");
  assert.equal(lireRechercheSession(variante({ savedAt: MAINTENANT - SESSION_OUVIVRE_TTL_MS - 1 }), MAINTENANT), null, "expirée");
  assert.ok(lireRechercheSession(variante({ savedAt: MAINTENANT - SESSION_OUVIVRE_TTL_MS }), MAINTENANT), "à la limite du délai");
  assert.equal(lireRechercheSession(variante({ savedAt: MAINTENANT + 60_000 }), MAINTENANT), null, "datée du futur");
  assert.equal(lireRechercheSession(variante({ savedAt: "hier" }), MAINTENANT), null);
  assert.equal(lireRechercheSession(variante({ submittedText: 42 }), MAINTENANT), null);
  assert.equal(lireRechercheSession(variante({ parsed: null }), MAINTENANT), null);
  assert.equal(lireRechercheSession(variante({ outcome: { results: [] } }), MAINTENANT), null, "sans résultat");
  assert.equal(lireRechercheSession(variante({ outcome: { results: [{ insee: "1" }] } }), MAINTENANT), null, "sans couverture (FUT-139)");
  for (const brut of [null, "", "{", "null", "[]", "42"]) assert.equal(lireRechercheSession(brut, MAINTENANT), null, String(brut));
});

test("session : la restauration d'« Où vivre » et la reprise de /rapport acceptent et refusent les mêmes sessions", () => {
  const ok = JSON.parse(sessionOuVivre("x", parsedDe("Nantes")));
  const cas = [ok, { ...ok, v: 3 }, { ...ok, v: 4 }, { ...ok, savedAt: 0 }, { ...ok, outcome: null }, { ...ok, parsed: null }];
  for (const s of cas) {
    const brut = JSON.stringify(s);
    assert.equal(lireSessionOuVivre(brut, MAINTENANT) != null, lireRechercheSession(brut, MAINTENANT) != null, JSON.stringify(s).slice(0, 60));
  }
});

test("session : la clé, la version et le délai ne sont écrits qu'à un seul endroit du code", () => {
  const racine = new URL("../", import.meta.url).pathname;
  const fichiers: string[] = [];
  const parcourir = (d: string) => {
    for (const n of readdirSync(d)) {
      const p = join(d, n);
      if (statSync(p).isDirectory()) parcourir(p);
      else if (/\.tsx?$/.test(n) && !/\.test\.ts$/.test(n)) fichiers.push(p);
    }
  };
  parcourir(racine);
  const avecCle = fichiers.filter((f) => readFileSync(f, "utf8").includes(SESSION_OUVIVRE_KEY));
  assert.deepEqual(avecCle.map((f) => f.slice(racine.length)), ["lib/comparateur/session-ou-vivre.ts"]);
  assert.doesNotMatch(lire("../app/(public)/ou-vivre/OuVivreClient.tsx"), /const SESSION_(VERSION|KEY|TTL_MS)\b/);
  assert.doesNotMatch(lire("./reprise-recherche.ts"), /SESSION_RECHERCHE_(VERSION|TTL_MS)\s*=/);
  // Le script de retour arrière teste la même clé.
  assert.ok(SCRIPT_RETOUR_ARRIERE_OUVIVRE.includes(JSON.stringify(SESSION_OUVIVRE_KEY)));
  assert.match(lire("../app/(public)/ou-vivre/page.tsx"), /__html: SCRIPT_RETOUR_ARRIERE_OUVIVRE/);
});

// ── Cas A et C : chercher n'écrit jamais le Projet ──────────────────────────────────────────────────

test("cas A/C : « Où vivre » n'a aucun chemin d'écriture du Projet ; seul le geste explicite y mène", () => {
  const client = lire("../app/(public)/ou-vivre/OuVivreClient.tsx");
  assert.doesNotMatch(client, /\/api\/profile|\/api\/project|user_project/, "aucune écriture directe du projet");
  // Ses seuls appels réseau sont ceux du moteur de recherche.
  const appels = [...client.matchAll(/fetch\("([^"]+)"/g)].map((m) => m[1]).sort();
  assert.deepEqual(appels, ["/api/comparateur-vie/ask", "/api/comparateur-vie/match", "/api/comparateur-vie/parse", "/api/comparateur-vie/synthesize"]);
  // La seule porte vers le projet : le composant de reprise, qui n'envoie « enregistrer » que sur le bouton.
  const reprise = lire("../components/report/RepriseRecherche.tsx");
  assert.equal(reprise.match(/mode: "enregistrer"/g)?.length, 1);
  assert.match(reprise, /mode: "apercu"/);
});

test("cas C : Nantes, puis Rennes, puis Bordeaux : chaque recherche remplace la précédente, le projet ne bouge pas", () => {
  // Chaque nouvelle recherche efface la session restaurable avant de parser (une seule recherche en cours).
  const client = lire("../app/(public)/ou-vivre/OuVivreClient.tsx");
  assert.match(client, /const runParse = useCallback\(async \(input: string\) => \{[\s\S]{0,300}clearSession\(\);/);
  // La reprise est remontée à chaque recherche (key = texte) : une nouvelle recherche redevient transférable.
  assert.equal(client.match(/<RepriseRecherche key=\{submittedText\} recherche=\{rechercheCourante\}/g)?.length, 2);
  // /rapport ne propose que la dernière ; l'aperçu de chacune laisse le projet intact.
  let stockage: string | null = null;
  for (const ville of ["Nantes", "Rennes", "Bordeaux"]) {
    stockage = sessionOuVivre(`Une ville comme ${ville}`, parsedDe(ville));
    const r = lireRechercheSession(stockage, MAINTENANT)!;
    const parsed = parsedPourLeProjet(r.parsed as ParsedProject, r.rawText, resoudre);
    const avant = JSON.stringify(PROJET);
    apercuComplet(PROJET, parsed, r.parsed as ParsedProject, r.rawText);
    assert.equal(decisionReprise("apercu", PROJET, null), "apercu");
    assert.equal(JSON.stringify(PROJET), avant, `${ville} : l'aperçu ne touche pas le projet`);
  }
  assert.equal(lireRechercheSession(stockage, MAINTENANT)!.rawText, "Une ville comme Bordeaux");
});

// ── Cas B : reprise volontaire, ce qui change, ce qui reste, ce qui part ────────────────────────────

test("cas B : l'aperçu dit ce qui est retenu, gardé sans mesure, propre à la recherche, remplacé, abandonné, conservé", () => {
  const recherche = parsedDe("Brest", {
    communeAncre: [{ label: "Brest" }],
    horsMesure: [{ term: "l'eau du robinet", kind: "autre", raison: "manque_produit" }],
  } as Partial<ParsedProject>);
  const texte = "Une ville comme Brest, au calme, avec une eau du robinet de qualité";
  const parsed = parsedPourLeProjet(recherche, texte, resoudre);
  const a = apercuComplet(PROJET, parsed, recherche, texte);
  assert.ok(a.retenus.length > 0, "critères retenus");
  assert.deepEqual(a.nonMesures, ["l'eau du robinet"], "la demande non mesurée passe dans le projet, et l'aperçu le dit");
  assert.ok(a.propresALaRecherche.includes("ne pas vous reproposer Brest"));
  assert.deepEqual(a.remplace, { texte: "Près de Nantes, au calme", updatedAt: "2026-11-01T08:00:00.000Z" });
  assert.deepEqual(a.abandonnes, { conditions: 1, precisions: 0, adoptions: 0 });
  assert.equal(a.intentionConservee, "achat");
  assert.equal(libelleReprise({ connecte: true, recherche: { parsed: recherche, rawText: texte }, apercu: a, transfertFait: false }), "Utiliser cette recherche pour mon projet");
});

test("cas B : la phrase d'abandon compte ce que le projet porte vraiment", () => {
  assert.equal(phraseAbandon(null), null);
  assert.equal(phraseAbandon({ conditions: 0, precisions: 0, adoptions: 0 }), null);
  assert.equal(phraseAbandon({ conditions: 1, precisions: 0, adoptions: 0 }), "Votre projet actuel porte une condition sans compromis, que le nouveau projet ne reprendra pas.");
  assert.equal(phraseAbandon({ conditions: 0, precisions: 0, adoptions: 1 }), "Votre projet actuel porte un choix sur un critère proposé, que le nouveau projet ne reprendra pas.");
  assert.equal(phraseAbandon({ conditions: 2, precisions: 1, adoptions: 3 }), "Votre projet actuel porte 2 conditions sans compromis, une précision et 3 choix sur des critères proposés, que le nouveau projet ne reprendra pas.");
  // L'ancienne phrase disait « ses conditions et précisions » pour un seul choix : elle n'existe plus.
  assert.doesNotMatch(lire("../components/report/RepriseRecherche.tsx"), /Ses conditions et précisions/);
});

test("cas B : le projet écrit est neuf ; aucune condition sans compromis ne naît d'une recherche", () => {
  // Une session forgée qui glisse des gestes dans le `parsed` n'en fait pas passer un seul.
  const forge = { ...parsedDe("Rennes"), conditions: PROJET.conditions, definitions: [{ x: 1 }], adoptions: [{ y: 1 }] } as unknown as ParsedProject;
  const parsed = parsedPourLeProjet(forge, "Rennes", resoudre);
  const p = projetDepuisRecherche(PROJET, parsed, "Rennes", "2026-11-08T10:00:00.000Z")!;
  assert.equal(p.conditions, undefined, "les conditions de l'ancien projet ne sont pas reportées");
  assert.equal(p.definitions, undefined);
  assert.equal(p.adoptions, undefined);
  assert.equal(p.rejets, undefined);
  // `coerceParsed` garde les clés inconnues d'un `parsed` (ici comme dans PATCH /api/profile) : une clé forgée
  // y survit, mais elle est inerte, aucun code ne lit de geste dans `parsed`. Le jour où un lecteur le ferait,
  // ce test le signale.
  const racine = new URL("../", import.meta.url).pathname;
  const sources: string[] = [];
  const parcourir = (d: string) => {
    for (const n of readdirSync(d)) {
      const f = join(d, n);
      if (statSync(f).isDirectory()) parcourir(f);
      else if (/\.tsx?$/.test(n) && !/\.test\.ts$/.test(n)) sources.push(f);
    }
  };
  parcourir(racine);
  const lecteurs = sources.filter((f) => /parsed\??\.(conditions|definitions|adoptions|rejets)\b/.test(readFileSync(f, "utf8")));
  assert.deepEqual(lecteurs, [], "aucun geste n'est lu dans parsed");
  assert.equal(p.posture, "recherche");
  assert.equal(p.intent, "achat", "l'intention du lecteur est gardée");
  assert.equal(p.rawText, "Rennes");
  assert.equal(p.updatedAt, "2026-11-08T10:00:00.000Z");
  // Sans projet : un projet neuf, posture de recherche, sans intention inventée.
  const neuf = projetDepuisRecherche(null, parsed, "Rennes", "2026-11-08T10:00:00.000Z")!;
  assert.equal(neuf.posture, "recherche");
  assert.equal(neuf.intent, null);
});

test("cas B : abandonner la reprise n'écrit rien", () => {
  const reprise = lire("../components/report/RepriseRecherche.tsx");
  assert.match(reprise, /onClick=\{\(\) => \{ setOuvert\(false\); setErreur\(null\); \}\}[\s\S]{0,200}Annuler/);
  assert.equal(decisionReprise(undefined, PROJET, PROJET.updatedAt), "mode_inconnu");
  assert.equal(decisionReprise("ecrire", PROJET, PROJET.updatedAt), "mode_inconnu", "seul « enregistrer » écrit");
});

// ── Cas D : projet modifié entre l'aperçu et l'enregistrement ───────────────────────────────────────

test("cas D : l'écriture n'a lieu que sur le projet vu dans l'aperçu", () => {
  assert.equal(decisionReprise("enregistrer", PROJET, PROJET.updatedAt), "ecrire");
  assert.equal(decisionReprise("enregistrer", PROJET, "2026-10-01T00:00:00.000Z"), "conflit", "modifié depuis l'aperçu");
  assert.equal(decisionReprise("enregistrer", PROJET, null), "conflit", "un projet est apparu depuis l'aperçu (autre onglet)");
  assert.equal(decisionReprise("enregistrer", null, PROJET.updatedAt), "conflit", "le projet vu a disparu");
  assert.equal(decisionReprise("enregistrer", null, null), "ecrire", "aucun projet, ni avant ni maintenant");
  assert.equal(decisionReprise("enregistrer", PROJET, 42), "conflit", "valeur illisible : jamais d'écriture à l'aveugle");
  // Et la garde SQL reste derrière la garde applicative : la route écrit par `ecrireProjetSiInchange`.
  const route = lire("../app/api/project/from-search/route.ts");
  assert.match(route, /ecrireProjetSiInchange\(supabase, user\.id, project, \{ existe: actuel != null, updatedAt: actuel\?\.updatedAt \?\? null \}\)/);
  assert.match(route, /r === "conflit"\) return NextResponse\.json\([^)]*\{ status: 409 \}/);
  const ecriture = lire("./server/projet-ecriture.ts");
  assert.match(ecriture, /q = q\.is\("user_project", null\)/);
  assert.match(ecriture, /q\.filter\("user_project->>updatedAt", "eq", lu\.updatedAt\)/);
});

// ── Cas E et droits : anonyme puis connecté, un seul projet, le sien ────────────────────────────────

test("cas E : la recherche faite sans compte reste reprenable après connexion, sans transfert automatique", () => {
  // La session ne porte aucun compte : celle d'avant la connexion se relit telle quelle après.
  const stockage = sessionOuVivre("Une ville comme Nantes", parsedDe("Nantes"));
  assert.equal(JSON.parse(stockage).userId, undefined);
  assert.ok(lireRechercheSession(stockage, MAINTENANT));
  // Anonyme : ni aperçu ni geste. Le composant ne demande l'aperçu qu'avec une session Supabase.
  assert.equal(libelleReprise({ connecte: false, recherche: lireRechercheSession(stockage, MAINTENANT), apercu: null, transfertFait: false }), null);
  const reprise = lire("../components/report/RepriseRecherche.tsx");
  assert.match(reprise, /if \(annule \|\| !data\.session\) return;\s*const res = await demander\(r, \{ mode: "apercu" \}\)/);
  // Aucun code de connexion ne touche la recherche ni le projet.
  for (const f of ["../app/auth/actions.ts", "../app/auth/callback/route.ts"]) {
    assert.doesNotMatch(lire(f), /ouvivre|from-search|user_project/, f);
  }
});

test("droits : la route ne connaît que le compte de la session ; elle ne crée jamais de second projet", () => {
  const route = lire("../app/api/project/from-search/route.ts");
  assert.match(route, /if \(!user\) return NextResponse\.json\(\{ error: "Connexion requise\." \}, \{ status: 401 \}\)/);
  assert.match(route, /\.eq\("user_id", user\.id\)/);
  assert.doesNotMatch(route, /body\.(user|userId|user_id)/, "aucun identifiant de compte lu dans le corps");
  // Un projet par compte : une colonne de `user_profiles`, mise à jour, jamais insérée.
  const ecriture = lire("./server/projet-ecriture.ts");
  assert.match(ecriture, /\.update\(\{ user_project: project/);
  assert.match(ecriture, /\.eq\("user_id", userId\)/);
  assert.doesNotMatch(ecriture, /\.insert\(|\.upsert\(/);
});
