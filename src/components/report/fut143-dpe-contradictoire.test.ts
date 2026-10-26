// FUT-143 · UN DIAGNOSTIC QUE LE BÂTIMENT CONTREDIT NE SE RETIENT PLUS D'UN CLIC DANS LA LISTE DE L'ADRESSE.
//
// Recette du 26/10/2026 (Monchaux-sur-Écaillon, 55 rue du Chaufour) : la ligne portait une mention grise,
// « rattaché par la base ADEME à un autre bâtiment », et un clic l'enregistrait. Le même diagnostic, cherché
// par son numéro, montrait avant confirmation « L'une des deux bases se trompe… ». Deux chemins, deux règles.
//
// Banc : les VRAIS `AddressDiagnosticsBlock`, `DpeSelector` et `SaisieNumeroDpe` sous React 19 et
// `react-test-renderer`, lisant la fixture RNB/ADEME relevée par FUT-80. Seuls les badges (`./kit`) sont
// doublés. Le geste qui écrit est `onPick` (dans `LogementModule`, il déclenche le POST `/api/logement-dpe`) :
// le compter, c'est compter les écritures.
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
type Mod = { exports: Record<string, unknown> };
const cache = new Map<string, Mod>();

function charger(fichier: string): Record<string, unknown> {
  let f = path.resolve(fichier);
  if (!fs.existsSync(f)) for (const ext of [".ts", ".tsx", ".js"]) if (fs.existsSync(f + ext)) { f += ext; break; }
  const deja = cache.get(f);
  if (deja) return deja.exports;
  const m: Mod = { exports: {} };
  cache.set(f, m);
  const req = (spec: string): unknown => {
    if (spec === "react") return React;
    if (spec === "server-only") return {};
    if (spec === "react/jsx-runtime") return require("react/jsx-runtime");
    if (spec === "./kit") return { DpeBadge: () => null };
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

const { AddressDiagnosticsBlock } = charger(`${RACINE}/src/components/report/logement/AddressDiagnosticsBlock.tsx`) as { AddressDiagnosticsBlock: (p: unknown) => unknown };
const { SaisieNumeroDpe } = charger(`${RACINE}/src/components/report/logement/SaisieNumeroDpe.tsx`) as { SaisieNumeroDpe: (p: unknown) => unknown };
const { toRecord } = charger(`${RACINE}/src/lib/dpe.ts`) as { toRecord: (l: unknown) => Record<string, unknown> };
const { identiteDepuisRnb, idsDesBatiments } = charger(`${RACINE}/src/lib/batiment-rnb.ts`) as {
  identiteDepuisRnb: (c: unknown, le: string) => unknown;
  idsDesBatiments: (i: unknown) => string[];
};

type Fixture = { rnb: unknown; ademe_adresse: unknown[] };
const fx = (nom: string): Fixture => JSON.parse(fs.readFileSync(path.join(RACINE, "src/lib/__fixtures__/fut80", `${nom}.json`), "utf8"));
const LE = "2026-10-26T12:00:00.000Z";

type Noeud = { type: string; props: Record<string, unknown>; children: Array<Noeud | string> | null };
type Rendu = { root: { findAll: (p: (n: Noeud) => boolean) => Noeud[] }; toJSON: () => unknown; unmount: () => void };

function texte(r: Rendu): string {
  const parties: string[] = [];
  const parcourir = (n: unknown) => {
    if (n == null) return;
    if (typeof n === "string") { parties.push(n); return; }
    if (Array.isArray(n)) { n.forEach(parcourir); return; }
    const j = n as { children?: unknown[] };
    (j.children ?? []).forEach(parcourir);
  };
  parcourir(r.toJSON());
  return parties.join(" ").replace(/ /g, " ").replace(/\s+/g, " ");
}

const boutons = (r: Rendu) => r.root.findAll((n) => n.type === "button");
const bouton = (r: Rendu, re: RegExp): Noeud => {
  const b = boutons(r).find((n) => re.test(String(n.props["aria-label"] ?? "")) || re.test(textOf(n)));
  assert.ok(b, `aucun bouton ${re}`);
  return b;
};
function textOf(n: Noeud | string): string {
  if (typeof n === "string") return n;
  return (n.children ?? []).map(textOf).join(" ");
}
const cliquer = async (b: Noeud) => { await act(async () => { (b.props.onClick as () => void)(); }); };

async function monter(candidats: unknown[], batiments: readonly string[], extra: Record<string, unknown> = {}) {
  const prises: unknown[] = [];
  const refus: unknown[] = [];
  let r!: Rendu;
  await act(async () => {
    r = create(React.createElement(AddressDiagnosticsBlock, {
      candidates: candidats, dossierId: "banc-fut143", batiments,
      onPick: (d: unknown) => prises.push(d), onNotInList: () => refus.push(true), onPickParNumero: () => assert.fail("numéro"),
      ...extra,
    })) as Rendu;
  });
  return { r, prises, refus };
}

// ── Monchaux-sur-Écaillon : une maison, un diagnostic, un `id_rnb` (« Reprise RNB ») à 78 m du bâtiment ──
const monchaux = fx("monchaux_auto");
const candidatsMonchaux = monchaux.ademe_adresse.map((l) => toRecord(l));
const batimentsMonchaux = idsDesBatiments(identiteDepuisRnb(monchaux.rnb, LE));

test("FUT-143 · Monchaux : le diagnostic contredit est bien contredit par la fixture (prémisse)", () => {
  assert.deepEqual(batimentsMonchaux, ["JHR966BZVKDA"]);
  assert.equal(candidatsMonchaux.length, 1);
  assert.equal(candidatsMonchaux[0].id_rnb, "Z4ZCPFA4P9P2");
});

test("FUT-143 · Monchaux : un clic sur la ligne contredite N'ÉCRIT RIEN et ouvre l'explication", async () => {
  const { r, prises } = await monter(candidatsMonchaux, batimentsMonchaux);
  const avant = texte(r);
  assert.match(avant, /rattaché par la base ADEME à un autre bâtiment/);
  assert.doesNotMatch(avant, /L'une des deux bases se trompe/, "l'explication n'est pas imposée avant le geste");

  await cliquer(bouton(r, /Retenir ce diagnostic|appartement|maison|Sans identifiant/i));
  assert.equal(prises.length, 0, "aucune écriture avant la confirmation");
  const apres = texte(r);
  assert.match(apres, /L'une des deux bases se trompe, et rien ne dit laquelle/);
  assert.match(apres, /Retenir quand même ce diagnostic/);
  r.unmount();
});

test("FUT-143 · Monchaux : la confirmation explicite écrit une fois, et une seule", async () => {
  const { r, prises } = await monter(candidatsMonchaux, batimentsMonchaux);
  await cliquer(bouton(r, /Retenir ce diagnostic/));
  const confirmer = bouton(r, /Retenir quand même ce diagnostic/);
  await cliquer(confirmer);
  assert.equal(prises.length, 1);
  assert.equal((prises[0] as { id_dpe: string }).id_dpe, candidatsMonchaux[0].id_dpe);
  // Le panneau se referme : un second clic sur l'ancienne référence ne doit rien ajouter de visible.
  assert.doesNotMatch(texte(r), /Retenir quand même ce diagnostic/);
  r.unmount();
});

test("FUT-143 · Monchaux : annuler referme sans écrire, et la ligne reste à choisir", async () => {
  const { r, prises, refus } = await monter(candidatsMonchaux, batimentsMonchaux);
  await cliquer(bouton(r, /Retenir ce diagnostic/));
  await cliquer(bouton(r, /^\s*Annuler\s*$/));
  assert.equal(prises.length, 0);
  assert.equal(refus.length, 0, "annuler n'est pas « ce n'est pas mon logement »");
  assert.doesNotMatch(texte(r), /L'une des deux bases se trompe/);
  assert.ok(bouton(r, /Retenir ce diagnostic/), "la ligne est toujours là");
  r.unmount();
});

test("FUT-143 · occupé : la confirmation ne part pas pendant une écriture en cours", async () => {
  const { r, prises } = await monter(candidatsMonchaux, batimentsMonchaux);
  await cliquer(bouton(r, /Retenir ce diagnostic/));
  await act(async () => {
    (r as unknown as { update: (e: unknown) => void }).update(React.createElement(AddressDiagnosticsBlock, {
      candidates: candidatsMonchaux, dossierId: "banc-fut143", batiments: batimentsMonchaux, busy: true,
      onPick: (d: unknown) => prises.push(d), onNotInList: () => {}, onPickParNumero: () => {},
    }));
  });
  const confirmer = bouton(r, /Retenir quand même ce diagnostic/);
  assert.equal(confirmer.props.disabled, true);
  r.unmount();
});

// ── Ce qui ne change pas ──

test("FUT-143 · un diagnostic cohérent avec le bâtiment se retient toujours d'un clic", async () => {
  const thenac = fx("thenac_contradiction");
  const batiments = idsDesBatiments(identiteDepuisRnb(thenac.rnb, LE));
  const coherent = thenac.ademe_adresse.map((l) => toRecord(l)).filter((c) => c.id_rnb === batiments[0]).slice(0, 3);
  assert.ok(coherent.length >= 2);
  const { r, prises } = await monter(coherent, batiments);
  assert.doesNotMatch(texte(r), /autre bâtiment/);
  await cliquer(boutons(r).find((b) => /^Retenir ce diagnostic/.test(String(b.props["aria-label"])))!);
  assert.equal(prises.length, 1);
  r.unmount();
});

test("FUT-143 · sans bâtiment connu (RNB absent, indisponible ou rapport antérieur), aucune contradiction n'est inventée", async () => {
  for (const batiments of [[], undefined]) {
    const { r, prises } = await monter(candidatsMonchaux, batiments as unknown as string[]);
    assert.doesNotMatch(texte(r), /autre bâtiment|se trompe/);
    await cliquer(bouton(r, /Retenir ce diagnostic/));
    assert.equal(prises.length, 1);
    r.unmount();
  }
});

test("FUT-143 · un diagnostic sans `id_rnb` n'est jamais contredit", async () => {
  const sansId = candidatsMonchaux.map((c) => ({ ...c, id_rnb: null, provenance_id_rnb: null }));
  const { r, prises } = await monter(sansId, batimentsMonchaux);
  assert.doesNotMatch(texte(r), /autre bâtiment/);
  await cliquer(bouton(r, /Retenir ce diagnostic/));
  assert.equal(prises.length, 1);
  r.unmount();
});

test("FUT-143 · plusieurs bâtiments à l'adresse : un `id_rnb` qui en désigne un n'est pas une contradiction", async () => {
  const puyravault = fx("puyravault_ambigu");
  const batiments = idsDesBatiments(identiteDepuisRnb(puyravault.rnb, LE));
  assert.equal(batiments.length, 7);
  const dansUnDesBatiments = candidatsMonchaux.map((c) => ({ ...c, id_rnb: batiments[3] }));
  const { r, prises } = await monter(dansUnDesBatiments, batiments);
  assert.doesNotMatch(texte(r), /autre bâtiment/);
  await cliquer(bouton(r, /Retenir ce diagnostic/));
  assert.equal(prises.length, 1);
  r.unmount();
});

test("FUT-143 · liste repliée (Thénac, 44 diagnostics) : la ligne contredite demande aussi confirmation", async () => {
  const thenac = fx("thenac_contradiction");
  const batiments = idsDesBatiments(identiteDepuisRnb(thenac.rnb, LE));
  const candidats = thenac.ademe_adresse.map((l) => toRecord(l));
  const { r, prises } = await monter(candidats, batiments);
  await cliquer(bouton(r, /^Identifier mon logement$/));
  // Rendre visibles toutes les lignes, puis cliquer la première ligne contredite.
  const voir = boutons(r).find((b) => /Voir les \d+ autres/.test(textOf(b)));
  if (voir) await cliquer(voir);
  const contredite = boutons(r).find((b) => /autre bâtiment/.test(String(b.props["aria-label"])));
  assert.ok(contredite, "au moins une ligne contredite à Thénac");
  await cliquer(contredite);
  assert.equal(prises.length, 0);
  assert.match(texte(r), /L'une des deux bases se trompe/);
  await cliquer(bouton(r, /Retenir quand même ce diagnostic/));
  assert.equal(prises.length, 1);
  r.unmount();
});

test("FUT-143 · le refus « aucun de ces diagnostics » n'est pas retenu derrière une confirmation", async () => {
  const { r, refus, prises } = await monter(candidatsMonchaux, batimentsMonchaux);
  await cliquer(bouton(r, /n'est pas celui de ce logement/));
  assert.equal(refus.length, 1);
  assert.equal(prises.length, 0);
  r.unmount();
});

// ── Une seule doctrine éditoriale pour les deux chemins ──

test("FUT-143 · la recherche par numéro et la liste disent la contradiction avec la même explication", async () => {
  const { EXPLICATION_CONTRADICTION } = charger(`${RACINE}/src/lib/batiment-rnb.ts`) as { EXPLICATION_CONTRADICTION?: string };
  assert.equal(typeof EXPLICATION_CONTRADICTION, "string");

  const dpe = candidatsMonchaux[0];
  const fetchAvant = globalThis.fetch;
  globalThis.fetch = (async () => new Response(JSON.stringify({
    status: "trouve", niveau: "adresse", grain: "logement", attachable: true, confirmationRequise: true, contredit: true,
    adresse: dpe.adresse, dpe,
  }), { status: 200 })) as typeof fetch;
  try {
    let r!: Rendu;
    const confirmes: unknown[] = [];
    await act(async () => { r = create(React.createElement(SaisieNumeroDpe, { dossierId: "banc-fut143", onConfirm: (d: unknown) => confirmes.push(d) })) as Rendu; });
    const champ = r.root.findAll((n) => n.type === "input")[0];
    await act(async () => { (champ.props.onChange as (e: unknown) => void)({ target: { value: String(dpe.id_dpe) } }); });
    await cliquer(bouton(r, /^\s*Chercher\s*$/));
    const numero = texte(r);
    assert.ok(numero.includes(EXPLICATION_CONTRADICTION!.replace(/ /g, " ")), "le numéro dit l'explication partagée");
    assert.equal(confirmes.length, 0);
    r.unmount();

    const { r: r2 } = await monter(candidatsMonchaux, batimentsMonchaux);
    await cliquer(bouton(r2, /Retenir ce diagnostic/));
    assert.ok(texte(r2).includes(EXPLICATION_CONTRADICTION!.replace(/ /g, " ")), "la liste dit la même explication");
    // Chaque chemin conclut par son geste, sans perdre l'espace avant les deux-points (recette du 26/10).
    assert.match(numero, /laquelle : ne le rattachez que si le numéro est bien celui de votre document\./);
    assert.match(texte(r2), /laquelle : ne le retenez que si vous savez qu'il s'agit bien de ce logement/);
    r2.unmount();
  } finally {
    globalThis.fetch = fetchAvant;
  }
});
