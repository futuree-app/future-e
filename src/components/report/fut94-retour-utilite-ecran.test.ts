// FUT-94 · L'ÉCRAN DU RETOUR D'UTILITÉ : un geste suffit, l'échec garde le texte, un double clic
// n'envoie qu'une requête, une réponse enregistrée ne se redemande pas, le commentaire ne part jamais
// vers PostHog. Les deux présentations (classique, Relevé) disent la même chose, avec la même structure.
//
// Le vrai composant, rendu par react-test-renderer avec un `fetch` simulé (dispositif de FUT-155).
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const React = require("react");
const { act, create } = require("react-test-renderer");
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

const RACINE = process.cwd();
// Le consentement de la bannière (`localStorage["futuree-consent"]`), réglé par chaque test.
let consentement: string | null = "granted";
(globalThis as Record<string, unknown>).window = {
  localStorage: { getItem: (k: string) => (k === "futuree-consent" ? consentement : null) },
};
type Mod = { exports: Record<string, unknown> };
const cache = new Map<string, Mod>();
const captures: { evenement: string; proprietes: Record<string, unknown> }[] = [];
const posthog = { __esModule: true, default: { capture: (evenement: string, proprietes: Record<string, unknown>) => { captures.push({ evenement, proprietes }); } } };

function charger(fichier: string): Record<string, unknown> {
  let f = path.resolve(fichier);
  if (!fs.existsSync(f)) for (const ext of [".ts", ".tsx", ".js"]) if (fs.existsSync(f + ext)) { f += ext; break; }
  const deja = cache.get(f);
  if (deja) return deja.exports;
  const m: Mod = { exports: {} };
  cache.set(f, m);
  const req = (spec: string): unknown => {
    if (spec === "react") return React;
    if (spec === "react/jsx-runtime") return require("react/jsx-runtime");
    if (spec === "posthog-js") return posthog;
    if (spec.endsWith(".css")) return { __esModule: true, default: new Proxy({}, { get: (_, k) => String(k) }) };
    if (spec === "next/link") return { default: (p: Record<string, unknown>) => React.createElement("a", p) };
    if (spec.startsWith("@/")) return charger(path.join(RACINE, "src", spec.slice(2)));
    if (spec.startsWith(".")) return charger(path.join(path.dirname(f), spec));
    return require(spec);
  };
  const code = ts.transpileModule(fs.readFileSync(f, "utf8"), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  vm.runInThisContext(`(function(require,module,exports){${code}\n})`, { filename: f })(req, m, m.exports);
  return m.exports;
}

const { RetourUtilite } = charger(`${RACINE}/src/components/report/RetourUtilite.tsx`) as { RetourUtilite: (p: unknown) => unknown };

type Noeud = { type: string; props: Record<string, unknown>; children: Array<Noeud | string> | null };
type Rendu = { root: { findAll: (p: (n: Noeud) => boolean) => Noeud[] }; toJSON: () => unknown; unmount: () => void };

function texte(r: Rendu): string {
  const parties: string[] = [];
  const parcourir = (n: unknown) => {
    if (n == null) return;
    if (typeof n === "string") { parties.push(n); return; }
    if (Array.isArray(n)) { n.forEach(parcourir); return; }
    ((n as { children?: unknown[] }).children ?? []).forEach(parcourir);
  };
  parcourir(r.toJSON());
  return parties.join(" ").replace(/[  ]/g, " ").replace(/\s+/g, " ");
}
const contenu = (n: Noeud) => JSON.stringify(n.children).replace(/\\u00a0| /g, " ");
const boutons = (r: Rendu) => r.root.findAll((n) => n.type === "button");
const bouton = (r: Rendu, libelle: RegExp) => {
  const b = boutons(r).find((n) => libelle.test(contenu(n)));
  assert.ok(b, `bouton ${libelle} introuvable dans : ${texte(r)}`);
  return b!;
};
const champ = (r: Rendu) => r.root.findAll((n) => n.type === "textarea")[0];

type Reponse = { status: number; json?: unknown };
let appels: { url: string; corps: Record<string, unknown> }[] = [];
let file: Array<Reponse | (() => Promise<Reponse>)> = [];
/** Le serveur simulé rend la réponse demandée, ou à défaut, un succès qui reflète le corps envoyé. */
function simulerFetch(reponses: Array<Reponse | (() => Promise<Reponse>)> = []) {
  appels = [];
  file = [...reponses];
  let commentaire: string | null = initialServeur?.comment ?? null;
  (globalThis as Record<string, unknown>).fetch = async (url: string, init: { body: string }) => {
    const corps = JSON.parse(init.body) as Record<string, unknown>;
    appels.push({ url, corps });
    const prevue = file.shift();
    const r = typeof prevue === "function" ? await prevue() : prevue;
    if (r) return { status: r.status, ok: r.status < 300, json: async () => { if (r.json === undefined) throw new Error("pas de JSON"); return r.json; } };
    if (corps.answer === "pas_encore_lu") commentaire = null; // la règle de la route
    else if ("comment" in corps) commentaire = typeof corps.comment === "string" && corps.comment.trim() ? corps.comment.trim() : null;
    return { status: 200, ok: true, json: async () => ({ ok: true, retour: { answer: corps.answer, comment: commentaire } }) };
  };
}

let initialServeur: { answer: string; comment: string | null } | null = null;
async function ecran(props: Record<string, unknown> = {}): Promise<Rendu> {
  let r!: Rendu;
  await act(async () => {
    r = create(React.createElement(RetourUtilite, { insee: "44109", dossierId: null, initial: null, ...props }), {
      createNodeMock: () => ({ focus: () => {} }),
    });
  });
  return r;
}
async function cliquer(n: Noeud) { await act(async () => { (n.props.onClick as () => void)(); }); }
async function saisir(r: Rendu, v: string) { await act(async () => { (champ(r).props.onChange as (e: unknown) => void)({ target: { value: v } }); }); }

for (const presentation of ["classique", "releve"] as const) {
  test(`${presentation} · la question exacte, trois réponses, aucun commentaire demandé avant la réponse`, async () => {
    simulerFetch();
    const r = await ecran({ presentation });
    assert.match(texte(r), /Cette analyse vous a-t-elle appris quelque chose d'utile pour votre recherche \?/);
    const options = boutons(r);
    assert.deepEqual(options.map((o) => texte({ toJSON: () => o } as unknown as Rendu)), ["Oui", "Pas vraiment", "Pas encore lu"]);
    for (const o of options) {
      assert.equal(o.props.type, "button");
      assert.equal(o.props["aria-pressed"], false);
    }
    assert.equal(champ(r), undefined);
    // Un groupe nommé par sa question, pour le lecteur d'écran ; la question est un titre de section.
    const groupe = r.root.findAll((n) => n.props.role === "group")[0];
    const titre = r.root.findAll((n) => n.type === "h2")[0];
    assert.equal(groupe.props["aria-labelledby"], titre.props.id);
    assert.equal(r.root.findAll((n) => n.type === "section")[0].props["aria-labelledby"], titre.props.id);
    assert.equal(appels.length, 0, "rien ne part à l'affichage");
  });

  test(`${presentation} · chacune des trois réponses s'enregistre d'un geste, et le dit`, async () => {
    for (const [libelle, valeur] of [[/^\["Oui"\]$/, "oui"], [/Pas vraiment/, "pas_vraiment"], [/Pas encore lu/, "pas_encore_lu"]] as const) {
      simulerFetch();
      captures.length = 0;
      const r = await ecran({ presentation, dossierId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" });
      await cliquer(bouton(r, libelle));
      assert.equal(appels.length, 1);
      assert.equal(appels[0].url, "/api/dossier/retour-utilite");
      assert.deepEqual(appels[0].corps, { insee: "44109", dossierId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", presentation, answer: valeur });
      assert.equal(bouton(r, libelle).props["aria-pressed"], true, "confirmé par le serveur, donc marqué");
      const statut = r.root.findAll((n) => n.props.role === "status")[0];
      assert.match(texte({ toJSON: () => statut } as unknown as Rendu), /Merci/);
      // Le commentaire est proposé après « Oui » et « Pas vraiment », pas après « Pas encore lu ».
      assert.equal(Boolean(champ(r)), valeur !== "pas_encore_lu");
      assert.deepEqual(captures, [{
        evenement: "dossier_utility_feedback_submitted",
        proprietes: { answer: valeur, has_comment: false, step: "reponse", is_change: false, scope: "adresse", presentation },
      }]);
    }
  });

  test(`${presentation} · commentaire facultatif : envoyé avec la réponse en vigueur, puis le bloc se replie`, async () => {
    simulerFetch();
    captures.length = 0;
    const r = await ecran({ presentation });
    await cliquer(bouton(r, /Pas vraiment/));
    assert.match(texte(r), /Quoi, ou qu'est-ce qui vous a manqué \? \(facultatif\)/);
    assert.match(texte(r), /jamais publié/);
    // Vide, l'envoi ne part pas.
    assert.equal(bouton(r, /Envoyer/).props["aria-disabled"], true);
    await cliquer(bouton(r, /Envoyer/));
    assert.equal(appels.length, 1);
    await saisir(r, "Rien sur le bruit de la rocade.");
    await cliquer(bouton(r, /Envoyer/));
    assert.equal(appels.length, 2);
    assert.deepEqual(appels[1].corps, { insee: "44109", dossierId: null, presentation, answer: "pas_vraiment", comment: "Rien sur le bruit de la rocade." });
    assert.equal(champ(r), undefined, "replié");
    assert.match(texte(r), /Votre retour sur cette analyse : Pas vraiment, avec un commentaire\. Merci\./);
    assert.match(texte(r), /Merci, votre commentaire est enregistré\./);
    // LE TEXTE NE PART JAMAIS VERS POSTHOG.
    assert.ok(captures.length === 2);
    assert.doesNotMatch(JSON.stringify(captures), /rocade/);
    assert.deepEqual(captures[1].proprietes, { answer: "pas_vraiment", has_comment: true, step: "commentaire", is_change: true, scope: "commune", presentation });
  });

  test(`${presentation} · double clic : une seule requête, et les boutons gardent le focus (jamais disabled)`, async () => {
    let relacher!: () => void;
    const attente = new Promise<void>((ok) => { relacher = ok; });
    simulerFetch([async () => { await attente; return { status: 200, json: { ok: true, retour: { answer: "oui", comment: null } } }; }]);
    const r = await ecran({ presentation });
    const oui = bouton(r, /^\["Oui"\]$/);
    await act(async () => {
      (oui.props.onClick as () => void)();
      (oui.props.onClick as () => void)();
      (bouton(r, /Pas vraiment/).props.onClick as () => void)();
    });
    assert.equal(appels.length, 1, "le verrou est synchrone, pas un état React");
    for (const b of boutons(r)) {
      assert.equal(b.props.disabled, undefined, "un bouton désactivé perdrait le focus clavier");
      assert.equal(b.props["aria-disabled"], true);
    }
    await act(async () => { relacher(); await attente; });
    assert.equal(bouton(r, /^\["Oui"\]$/).props["aria-pressed"], true);
    assert.equal(bouton(r, /^\["Oui"\]$/).props["aria-disabled"], undefined);
  });

  test(`${presentation} · panne serveur : rien n'est marqué enregistré, le texte est conservé, le réessai réussit`, async () => {
    // 1. La réponse échoue (500 avec JSON, puis 502 sans JSON, puis une coupure réseau).
    for (const panne of [{ status: 500, json: { error: "x" } }, { status: 502 }, async () => { throw new Error("réseau"); }] as const) {
      simulerFetch([panne as Reponse]);
      const r = await ecran({ presentation });
      await cliquer(bouton(r, /^\["Oui"\]$/));
      assert.equal(bouton(r, /^\["Oui"\]$/).props["aria-pressed"], false, "un échec n'est jamais montré comme un succès");
      assert.match(texte(r), /Votre réponse n'a pas pu être enregistrée\. Réessayez\./);
      await cliquer(bouton(r, /^\["Oui"\]$/));
      assert.equal(bouton(r, /^\["Oui"\]$/).props["aria-pressed"], true);
      assert.doesNotMatch(texte(r), /pas pu être enregistrée/);
    }
    // 2. Le commentaire échoue : il reste dans le champ, mot pour mot, et repart au réessai.
    simulerFetch([{ status: 200, json: { ok: true, retour: { answer: "oui", comment: null } } }, { status: 503, json: { error: "x", code: "enregistrement_impossible" } }]);
    const r = await ecran({ presentation });
    await cliquer(bouton(r, /^\["Oui"\]$/));
    const long = "Les temps à vélo vers la gare.\nEt l'école du quartier.";
    await saisir(r, long);
    await cliquer(bouton(r, /Envoyer/));
    assert.equal(champ(r).props.value, long, "aucune perte du texte");
    assert.match(texte(r), /Votre commentaire n'a pas pu être envoyé\. Il est conservé dans le champ : réessayez\./);
    await cliquer(bouton(r, /Réessayer l'envoi/));
    assert.equal(appels.length, 3);
    assert.equal(appels[2].corps.comment, long);
    assert.equal(champ(r), undefined);
    assert.match(texte(r), /Oui, avec un commentaire/);
  });

  test(`${presentation} · réponse déjà enregistrée : la question n'est pas reposée, une ligne la rappelle`, async () => {
    simulerFetch();
    const r = await ecran({ presentation, initial: { answer: "pas_encore_lu", comment: null } });
    assert.doesNotMatch(texte(r), /Cette analyse vous a-t-elle appris/);
    assert.match(texte(r), /Votre retour sur cette analyse : Pas encore lu\. Merci\./);
    assert.equal(boutons(r).length, 1);
    // « Modifier » rouvre, avec la réponse marquée et le commentaire enregistré dans le champ. Le faux
    // serveur part du même état que l'écran (il garde le commentaire, comme le vrai).
    initialServeur = { answer: "oui", comment: "La carte des écoles." };
    simulerFetch();
    const r2 = await ecran({ presentation, initial: initialServeur });
    await cliquer(bouton(r2, /Modifier/));
    assert.equal(bouton(r2, /^\["Oui"\]$/).props["aria-pressed"], true);
    assert.equal(champ(r2).props.value, "La carte des écoles.");
    // Changer la réponse n'envoie pas le commentaire : le serveur garde celui qui est enregistré.
    await cliquer(bouton(r2, /Pas vraiment/));
    assert.deepEqual(appels.at(-1)!.corps, { insee: "44109", dossierId: null, presentation, answer: "pas_vraiment" });
    assert.equal(champ(r2).props.value, "La carte des écoles.");
    assert.equal(appels.length, 1);
    initialServeur = null;
  });

  test(`${presentation} · au-delà de 2 000 caractères : compte affiché, envoi bloqué, rien n'est coupé`, async () => {
    simulerFetch();
    const r = await ecran({ presentation });
    await cliquer(bouton(r, /^\["Oui"\]$/));
    const trop = "a".repeat(2001);
    await saisir(r, trop);
    assert.equal(champ(r).props.value, trop);
    assert.equal(champ(r).props.maxLength, undefined, "aucune coupe silencieuse du navigateur");
    assert.match(texte(r), /2 001 \/ 2 000 caractères : raccourcissez votre commentaire\./);
    await cliquer(bouton(r, /Envoyer/));
    assert.equal(appels.length, 1);
    await saisir(r, "court");
    assert.doesNotMatch(texte(r), /caractères/, "en deçà du seuil, aucun compte");
  });
}

test("consentement : sans « granted », l'enregistrement marche et RIEN ne part vers PostHog", async () => {
  for (const valeur of [null, "denied", "n'importe quoi"]) {
    consentement = valeur;
    simulerFetch();
    captures.length = 0;
    const r = await ecran({ presentation: "releve" });
    await cliquer(bouton(r, /Pas vraiment/));
    await saisir(r, "Rien sur le bruit.");
    await cliquer(bouton(r, /Envoyer/));
    assert.equal(appels.length, 2, "les deux envois sont faits");
    assert.match(texte(r), /Pas vraiment, avec un commentaire/);
    assert.deepEqual(captures, [], `consentement ${valeur} : aucun événement`);
  }
  consentement = "granted";
  simulerFetch();
  captures.length = 0;
  const r = await ecran({ presentation: "releve" });
  await cliquer(bouton(r, /Pas vraiment/));
  assert.equal(captures.length, 1, "avec consentement : l'événement agrégé");
});

test("le bloc entier est exclu de l'autocapture et des enregistrements de session (ph-no-capture)", async () => {
  for (const presentation of ["classique", "releve"]) {
    simulerFetch();
    const r = await ecran({ presentation });
    const section = r.root.findAll((n) => n.type === "section")[0];
    assert.match(String(section.props.className), /(^| )ph-no-capture( |$)/);
  }
  // Et le seul appel à PostHog du composant passe par la garde de consentement.
  const source = fs.readFileSync(`${RACINE}/src/components/report/RetourUtilite.tsx`, "utf8");
  assert.equal(source.match(/posthog\./g)?.length, 1);
  assert.match(source, /if \(mesureAutorisee\(\)\) posthog\.capture\(/);
});

for (const presentation of ["classique", "releve"] as const) {
  test(`${presentation} · « Pas encore lu » après un commentaire : retiré, et l'écran le dit`, async () => {
    initialServeur = { answer: "pas_vraiment", comment: "Rien sur les écoles." };
    simulerFetch();
    const r = await ecran({ presentation, initial: initialServeur });
    await cliquer(bouton(r, /Modifier/));
    await cliquer(bouton(r, /Pas encore lu/));
    assert.deepEqual(appels.at(-1)!.corps, { insee: "44109", dossierId: null, presentation, answer: "pas_encore_lu" });
    assert.match(texte(r), /Merci, c'est noté\. Votre commentaire précédent a été retiré\./);
    assert.equal(champ(r), undefined);
    // Retour à « Oui » : le champ revient VIDE. Le texte retiré n'y est plus, Envoyer ne peut pas le
    // ressusciter (défaut trouvé par la recette réelle du 09/11/2026).
    await cliquer(bouton(r, /^\["Oui"\]$/));
    assert.equal(champ(r).props.value, "");
    assert.doesNotMatch(texte(r), /Rien sur les écoles/);
    // Oui ↔ Pas vraiment, lui, garde le commentaire et n'annonce aucun retrait.
    initialServeur = { answer: "oui", comment: "La carte des écoles." };
    simulerFetch();
    const r2 = await ecran({ presentation, initial: initialServeur });
    await cliquer(bouton(r2, /Modifier/));
    await cliquer(bouton(r2, /Pas vraiment/));
    await cliquer(bouton(r2, /^\["Oui"\]$/));
    assert.doesNotMatch(texte(r2), /retiré/);
    assert.equal(champ(r2).props.value, "La carte des écoles.");
    initialServeur = null;
  });

  test(`${presentation} · effacer son commentaire depuis l'écran : champ vidé, envoi permis, plus de commentaire`, async () => {
    initialServeur = { answer: "oui", comment: "La carte des écoles." };
    simulerFetch();
    const r = await ecran({ presentation, initial: initialServeur });
    await cliquer(bouton(r, /Modifier/));
    await saisir(r, "");
    assert.equal(bouton(r, /Envoyer/).props["aria-disabled"], undefined, "vider efface : l'envoi est permis");
    await cliquer(bouton(r, /Envoyer/));
    assert.deepEqual(appels.at(-1)!.corps, { insee: "44109", dossierId: null, presentation, answer: "oui", comment: "" });
    assert.match(texte(r), /Votre retour sur cette analyse : Oui\. Merci\./);
    initialServeur = null;
  });
}

test("les deux présentations disent exactement la même chose", async () => {
  simulerFetch();
  const a = await ecran({ presentation: "classique" });
  const b = await ecran({ presentation: "releve" });
  assert.equal(texte(a), texte(b));
  await cliquer(bouton(a, /^\["Oui"\]$/));
  await cliquer(bouton(b, /^\["Oui"\]$/));
  assert.equal(texte(a), texte(b));
});

test("sous le Relevé, le bloc est fait des primitives du Relevé, sans couleur propre", async () => {
  simulerFetch();
  const r = await ecran({ presentation: "releve" });
  const section = r.root.findAll((n) => n.type === "section")[0];
  assert.match(String(section.props.className), /releveSection/);
  for (const o of boutons(r)) assert.equal(o.props.className, "option");
  await cliquer(bouton(r, /^\["Oui"\]$/));
  assert.equal(champ(r).props.className, "texte");
  assert.match(String(bouton(r, /Envoyer/).props.className), /^bouton$/);
  const source = fs.readFileSync(`${RACINE}/src/components/report/RetourUtilite.tsx`, "utf8");
  assert.doesNotMatch(source, /#[0-9a-f]{3,6}\b|rgb\(/i, "aucune couleur en dur");
  assert.doesNotMatch(source, /posthog\.capture\([^)]*brouillon|comment: brouillon[^}]*posthog/s);
});
