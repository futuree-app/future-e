import { test, before } from "node:test";
import assert from "node:assert/strict";
import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { readFileSync } from "node:fs";
import {
  lireUrbanisme, partsDansParcelle, reglementDeZone, approbationDepuisNom, urbanismeIndisponible, couvre,
  FAMILLES, PART_MIN, type EntreeUrbanisme, type GpuFeature, type UrbanismeParcelle,
} from "./urbanisme-parcelle.ts";
import { sourcesAbsentes, consulterOuActualiser, jsonCanonique, type VersionLogement } from "./logement-report-version.ts";
import type { LogementReport } from "./logement-report-types.ts";

// ════════════════════════════════════════════════════════════════════════════════════════════
// FUT-81 (26/10/2026) : LE PLAN D'URBANISME DE LA PARCELLE, LU SANS DÉPASSER LA PREUVE.
//
// Les cas réels viennent des réponses BRUTES du cadastre et du Géoportail de l'urbanisme relevées le
// 26/10/2026 (`__fixtures__/fut81/`, cf. `scripts/research/fut81-capture-fixtures.mjs`), passées par
// la fonction de production `lireUrbanisme`, puis par le composant de production. Aucun réseau.
//
// « Le bloc apparaît » et « le bloc dit vrai » sont deux assertions distinctes (AGENTS.md) : la seconde
// est faite sur le TEXTE rendu, et elle cherche aussi ce qu'il ne doit jamais dire.
// ════════════════════════════════════════════════════════════════════════════════════════════

const racine = pathToFileURL(`${process.cwd()}/`).href;
const hook = `
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
const ts = createRequire(${JSON.stringify(racine)} + "package.json")("typescript");
async function premier(candidats, ctx, next) {
  for (const c of candidats.slice(0, -1)) { try { return await next(c, ctx); } catch {} }
  return next(candidats[candidats.length - 1], ctx);
}
export async function resolve(spec, ctx, next) {
  if (spec === "server-only") return { url: "data:text/javascript,export{}", shortCircuit: true };
  if (spec.startsWith("@/")) {
    const b = ${JSON.stringify(racine)} + "src/" + spec.slice(2);
    return premier([b + ".ts", b + ".tsx", b], ctx, next);
  }
  if ((spec.startsWith("./") || spec.startsWith("../")) && !/\\.[cm]?[jt]sx?$|\\.json$/.test(spec)) {
    return premier([spec + ".ts", spec + ".tsx", spec], ctx, next);
  }
  return next(spec, ctx);
}
export async function load(url, ctx, next) {
  if (!url.endsWith(".tsx")) return next(url, ctx);
  const fichier = fileURLToPath(url);
  const { outputText } = ts.transpileModule(readFileSync(fichier, "utf8"), {
    fileName: fichier,
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  return { format: "module", source: outputText, shortCircuit: true };
}`;

type M = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
let rendreBloc: (props: unknown) => string;
let rendreSection: (props: unknown) => string;
let fetchUrbanismeParcelle: (lat: number, lon: number, p: unknown) => Promise<UrbanismeParcelle>;

before(async () => {
  register(`data:text/javascript,${encodeURIComponent(hook)}`);
  const { renderToStaticMarkup } = await import("react-dom/server");
  const { createElement } = await import("react");
  const { UrbanismeBlock } = await import("../components/report/logement/UrbanismeBlock.tsx");
  const { RegulatoryStatusBlock } = await import("../components/report/logement/RegulatorySection.tsx");
  rendreBloc = (p) => renderToStaticMarkup(createElement(UrbanismeBlock, p as never));
  rendreSection = (p) => renderToStaticMarkup(createElement(RegulatoryStatusBlock, p as never));
  ({ fetchUrbanismeParcelle } = await import("./gpu.ts") as never);
});

/** Le texte que lit le lecteur : balises retirées, entités décodées, espaces insécables normalisées. */
function texte(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;|&apos;/g, "'").replace(/&quot;/g, "\"").replace(/&amp;/g, "&").replace(/&nbsp;| /g, " ")
    .replace(/’/g, "'").replace(/\s+/g, " ").trim();
}

// ── Les relevés réels, passés par la fonction de production ───────────────────────────────────
const CAS = [
  "lyon-croix-rousse", "six-fours-emplacement-reserve", "merignac-deux-zones", "moissy-zone-unique",
  "la-rochelle-psmv", "vauquois-carte-communale", "chatelard-rnu", "grandvals-sans-document",
] as const;
type Cas = (typeof CAS)[number];
const fixture = (c: Cas): M => JSON.parse(readFileSync(`src/lib/__fixtures__/fut81/${c}.json`, "utf8"));
function entree(c: Cas): EntreeUrbanisme {
  const x = fixture(c);
  return {
    parcelle: x.parcelle ? { geometry: x.parcelle.geometry, contenance: x.parcelle.properties.contenance ?? null } : null,
    municipality: x.municipality.features, documents: x.document.features, zones: x.zone.features, secteurs: x.secteur.features,
    prescriptions: { surface: x.prescriptionSurf.features, ligne: x.prescriptionLin.features, point: x.prescriptionPct.features },
    details: x.details, fichiers: x.files,
  };
}
const lire = (c: Cas) => lireUrbanisme(entree(c));
const rendu = (u: UrbanismeParcelle | undefined, o: { parcelCode?: string | null; repli?: boolean } = {}) =>
  texte(rendreBloc({ urbanisme: u, parcelCode: o.parcelCode ?? "69384000AV0059", parcelleParRepli: o.repli ?? false, withDivider: false }));

// ── Géométries synthétiques (degrés, à l'échelle d'une parcelle) ──────────────────────────────
const carre = (x0: number, y0: number, x1: number, y1: number) => ({ type: "Polygon", coordinates: [[[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]]] });
const DOC = "0123456789abcdef0123456789abcdef";
const DOC2 = "fedcba9876543210fedcba9876543210";
const zone = (libelle: string, geometry: unknown, extra: M = {}): GpuFeature =>
  ({ properties: { libelle, typezone: "U", gpu_doc_id: DOC, nomfic: "X_reglement_20250101.pdf", ...extra }, geometry: geometry as never });
const documentPlu = (id = DOC, type = "PLU", name = "12345_PLU_20250101"): GpuFeature => ({ properties: { gpu_doc_id: id, du_type: type, name } });
const DETAILS_OK = { effectiveStatus: "EN_VIGUEUR", legalStatus: "APPROVED", title: "Plan Local d'Urbanisme (PLU) TEST", publicationDate: "02/02/2025 10:00:00" };
const FICHIERS_OK = [{ name: "X_reglement_20250101.pdf", title: "Règlement écrit" }];
function synthetique(o: Partial<EntreeUrbanisme> = {}): EntreeUrbanisme {
  return {
    parcelle: { geometry: carre(0, 0, 0.001, 0.001), contenance: 8000 },
    municipality: [{ properties: { is_rnu: false } }],
    documents: [documentPlu()],
    zones: [zone("UA", carre(-0.01, -0.01, 0.01, 0.01))],
    secteurs: [],
    prescriptions: { surface: [], ligne: [], point: [] },
    details: { [DOC]: DETAILS_OK },
    fichiers: { [DOC]: FICHIERS_OK },
    ...o,
  };
}

// Ce que le texte ne doit JAMAIS affirmer : un droit, une autorisation, une constructibilité.
const ABUS = [
  /(?<!in)constructible/i, /droit à construire/i, /\bvous pouvez (construire|agrandir|étendre|bâtir)/i,
  /\b(est|sera|seront) autorisée?s?\b/i, /aucune (règle|contrainte)/i, /futur•e (vaut|est un) certificat/i,
];
function sansAbus(t: string, ou: string) {
  for (const r of ABUS) assert.doesNotMatch(t, r, `${ou} : « ${t.match(r)?.[0]} »`);
}

// ═══════════════════════════════════ 1. LA LECTURE ═════════════════════════════════════════════

test("Parcelle en zone unique (Moissy-Cramayel) : document, zone, règlement du Géoportail, dates", () => {
  const u = lire("moissy-zone-unique");
  assert.equal(u.statut, "confirme");
  assert.equal(u.regime, "document");
  assert.equal(u.grain, "parcelle");
  assert.deepEqual(u.zones.map((z) => [z.libelle, z.typezone, z.part]), [["UC", "U", 1]]);
  assert.equal(u.zones[0].reglement.statut, "publie");
  assert.match((u.zones[0].reglement as { url: string }).url, /^https:\/\/www\.geoportail-urbanisme\.gouv\.fr\/api\/document\/[0-9a-f]{32}\/files\/77296_reglement_20251215\.pdf$/);
  assert.equal(u.documents[0].type, "PLU");
  assert.equal(u.documents[0].approbation, "2025-12-15");
  assert.equal(u.documents[0].enVigueur, true);
});

test("Parcelle partagée entre deux zones (Mérignac) : les deux, avec leur part, et un seul règlement", () => {
  const u = lire("merignac-deux-zones");
  assert.deepEqual(u.zones.map((z) => z.libelle), ["US7", "US9"]);
  const [a, b] = u.zones.map((z) => z.part!);
  assert.ok(a > 0.55 && a < 0.67 && b > 0.33 && b < 0.45, `parts ${a} / ${b}`);
  assert.ok(Math.abs(a + b - 1) < 0.01);
  const t = rendu(u);
  assert.match(t, /partagée entre 2 zones du plan local d'urbanisme intercommunal \(PLUi\) : US7 \(environ 6\d % de la parcelle\), US9 \(environ 3\d % de la parcelle\)/);
  assert.equal(t.match(/Lire le règlement/g)?.length, 1, "un même fichier : un seul lien");
  assert.match(t, /D'autres prescriptions s'appliquent aussi à la parcelle \(conditions de desserte, stationnement\)/);
  assert.doesNotMatch(t, /autre prescription/, "le code 99 se compte, il ne se nomme pas");
  assert.match(t, /Lire le règlement des zones US7, US9/);
});

test("Une zone voisine qui touche la limite n'est pas une zone de la parcelle (Lyon, Six-Fours)", () => {
  const lyon = lire("lyon-croix-rousse");
  assert.deepEqual(lyon.zones.map((z) => z.libelle), ["UCe1a"]);
  assert.deepEqual(lyon.zonesEnLimite, ["UCe3-p"]);
  const sixFours = lire("six-fours-emplacement-reserve");
  assert.deepEqual(sixFours.zones.map((z) => z.libelle), ["UE"]);
  assert.deepEqual(sixFours.zonesEnLimite, ["UF"]);
  const t = rendu(lyon);
  assert.match(t, /Cette parcelle est en zone UCe1a du plan local d'urbanisme intercommunal \(PLUi\)\./);
  assert.match(t, /La zone UCe3-p touche la limite de la parcelle sans la couvrir de façon significative \(moins de 2 % et de 25 m² estimés\)/);
});

test("Prescription applicable (Six-Fours) : emplacement réservé nommé, avec sa part et la vérification à faire", () => {
  const u = lire("six-fours-emplacement-reserve");
  const er = u.prescriptions.find((p) => p.famille === "05")!;
  assert.ok(er, "l'emplacement réservé est retenu");
  assert.ok(er.part! > 0.1 && er.part! < 0.16, `part ${er.part}`);
  const t = rendu(u);
  assert.match(t, /Emplacement réservé · sur environ 1[34] % de la parcelle/);
  assert.match(t, /Demandez en mairie son objet et son bénéficiaire/);
});

test("Une prescription qui ne fait que border la parcelle concerne le voisin : elle n'est pas retenue (Lyon)", () => {
  const u = lire("lyon-croix-rousse");
  const brut = entree("lyon-croix-rousse").prescriptions.surface!.map((f) => String(f.properties?.libelle));
  assert.ok(brut.includes("Element Bati a preserver-13"), "le GPU la rend bien pour cette parcelle");
  assert.ok(!u.prescriptions.some((p) => p.libelle === "Element Bati a preserver-13"), "elle n'est pas lue comme celle de la parcelle");
  assert.deepEqual(u.prescriptions.map((p) => p.famille).sort(), ["02", "07"]);
  assert.ok(u.autresPrescriptions.includes("hauteur") && u.autresPrescriptions.includes("stationnement"));
});

test("Carte communale (Vauquois) : le secteur, sans règlement propre, sans conclure sur le projet", () => {
  const u = lire("vauquois-carte-communale");
  assert.equal(u.statut, "confirme");
  assert.deepEqual(u.secteurs.map((s) => [s.libelle, s.typesect]), [["C", "01"]]);
  const t = rendu(u);
  assert.match(t, /dans un secteur ouvert à la construction de la carte communale \(secteur « C »\)/);
  assert.match(t, /n'a pas de règlement propre/);
  assert.match(t, /seule l'instruction d'une demande dit s'il est autorisé/);
  sansAbus(t, "carte communale");
});

test("RNU (Châtelard) : le régime national, affirmé comme tel, jamais « aucune règle »", () => {
  const u = lire("chatelard-rnu");
  assert.deepEqual([u.statut, u.regime, u.communeRnu], ["confirme", "rnu", true]);
  const t = rendu(u);
  assert.match(t, /le règlement national d'urbanisme s'applique/);
  sansAbus(t, "RNU");
});

test("Document manquant (Grandvals) : hors RNU, rien de publié, on le dit et on renvoie à la mairie", () => {
  const u = lire("grandvals-sans-document");
  assert.deepEqual([u.statut, u.regime, u.communeRnu], ["non_trouve", "inconnu", false]);
  const t = rendu(u);
  assert.match(t, /Nous n'avons pas pu identifier de règle d'urbanisme à cette parcelle/);
  assert.match(t, /elle n'y est pas recensée au règlement national d'urbanisme\. Des règles s'appliquent pourtant/);
  // Sans réponse sur le régime de la commune, on ne prétend pas qu'elle est hors RNU.
  const muet = lireUrbanisme({ ...entree("grandvals-sans-document"), municipality: null });
  assert.equal(muet.communeRnu, null);
  assert.doesNotMatch(rendu(muet), /pas recensée/);
  sansAbus(t, "sans document");
});

test("Règlement : celui de la zone, jamais remplacé par le règlement général (La Rochelle, secteur sauvegardé)", () => {
  const u = lire("la-rochelle-psmv");
  assert.deepEqual(u.zones.map((z) => z.libelle), ["PSMV"]);
  assert.deepEqual(u.zones[0].reglement, { statut: "non_publie" }, "le PDF du PSMV n'est pas parmi les pièces du PLUi");
  assert.ok(fixture("la-rochelle-psmv").files[u.documents[0].id].some((f: M) => f.title === "Règlement écrit"), "le règlement du PLUi existe, et n'est pas pris");
  const t = rendu(u);
  assert.match(t, /Le règlement de la zone PSMV n'est pas publié avec le document au Géoportail : demandez-le au service urbanisme/);
  assert.doesNotMatch(t, /Lire le règlement/);
});

test("Règlement indisponible : les pièces n'ont pas répondu, le lien n'est pas inventé", () => {
  assert.deepEqual(reglementDeZone(DOC, null, "X_reglement.pdf", null), { statut: "indisponible" });
  const u = lireUrbanisme(synthetique({ fichiers: { [DOC]: null }, details: { [DOC]: null } }));
  assert.equal(u.statut, "confirme", "la zone reste établie");
  assert.equal(u.zones[0].reglement.statut, "indisponible");
  assert.equal(u.documents[0].enVigueur, null, "statut non vérifié, pas « hors vigueur »");
  assert.match(rendu(u), /Le lien vers le règlement de la zone UA n'a pas pu être vérifié/);
  // Une URL de producteur n'entre que si c'est du http(s).
  const piege = lireUrbanisme(synthetique({ fichiers: { [DOC]: [] }, zones: [zone("UA", carre(-1, -1, 1, 1), { urlfic: "javascript:alert(1)" })] }));
  assert.deepEqual(piege.zones[0].reglement, { statut: "non_publie" });
});

test("Données ambiguës : plusieurs documents, document hors vigueur, document sans zone lue", () => {
  const deux = lireUrbanisme(synthetique({
    documents: [documentPlu(), documentPlu(DOC2, "PSMV", "12345_PSMV_20200101")],
    zones: [zone("UA", carre(-1, -1, 0.0005, 1)), zone("US", carre(0.0005, -1, 1, 1), { gpu_doc_id: DOC2 })],
    details: { [DOC]: DETAILS_OK, [DOC2]: DETAILS_OK }, fichiers: { [DOC]: FICHIERS_OK, [DOC2]: [] },
  }));
  assert.equal(deux.statut, "ambigu");
  assert.deepEqual(deux.ambiguites, ["plusieurs_documents"]);
  assert.match(rendu(deux), /Plusieurs documents d'urbanisme se superposent sur cette parcelle/);

  const horsVigueur = lireUrbanisme(synthetique({ details: { [DOC]: { ...DETAILS_OK, effectiveStatus: "ANNULE" } } }));
  assert.deepEqual([horsVigueur.statut, horsVigueur.ambiguites], ["ambigu", ["document_hors_vigueur"]]);
  assert.match(rendu(horsVigueur), /Le Géoportail ne le donne pas comme en vigueur : vérifiez en mairie la version applicable/);

  const sansZone = lireUrbanisme(synthetique({ zones: [] }));
  assert.deepEqual([sansZone.statut, sansZone.ambiguites], ["ambigu", ["zone_non_lue"]]);
  assert.match(rendu(sansZone), /aucune zone n'a pu être lue à cette parcelle/);
});

test("Plusieurs parcelles à une adresse : la lecture porte sur la parcelle rattachée, et le dit", () => {
  // Deux parcelles voisines de la même adresse, de part et d'autre d'une limite de zone.
  const zones = [zone("UA", carre(-1, -1, 0.001, 1)), zone("N", carre(0.001, -1, 1, 1), { typezone: "N" })];
  const maison = lireUrbanisme(synthetique({ zones, parcelle: { geometry: carre(0, 0, 0.001, 0.001), contenance: 8000 } }));
  const jardin = lireUrbanisme(synthetique({ zones, parcelle: { geometry: carre(0.001, 0, 0.002, 0.001), contenance: 8000 } }));
  assert.deepEqual(maison.zones.map((z) => z.libelle), ["UA"]);
  assert.deepEqual(jardin.zones.map((z) => z.libelle), ["N"]);
  const t = rendu(maison, { parcelCode: "17300000EN0010" });
  assert.match(t, /parcelle cadastrale 17300000EN0010 rattachée à l'adresse\. Une adresse peut couvrir plusieurs parcelles \(jardin, dépendance\) : cette lecture porte sur celle-ci seulement/);
  assert.match(rendu(maison, { repli: true }), /la plus proche a été retenue\. Elle peut être celle d'un voisin/);
  assert.match(rendu(jardin), /En zone agricole ou naturelle, les constructions nouvelles sont strictement encadrées/);
});

test("Sans parcelle, lecture au point : grain dit, aucune part inventée", () => {
  const u = lireUrbanisme(synthetique({ parcelle: null }));
  assert.equal(u.grain, "point");
  assert.equal(u.zones[0].part, null);
  const t = rendu(u);
  assert.match(t, /^Plan d'urbanisme de la parcelle Cette adresse est en zone UA/);
  assert.match(t, /Grain : point géocodé de l'adresse/);
  assert.doesNotMatch(t, /environ \d+ %/);
});

// ═══════════════════════════════════ 2. LES PANNES ═════════════════════════════════════════════

test("Source GPU en panne : `indisponible`, jamais « aucune règle » ; panne partielle des prescriptions dite", () => {
  assert.equal(lireUrbanisme(synthetique({ documents: null })).statut, "indisponible");
  assert.equal(lireUrbanisme(synthetique({ zones: null, secteurs: null })).statut, "indisponible");
  const partielle = lireUrbanisme(synthetique({ prescriptions: { surface: null, ligne: [], point: [] } }));
  assert.equal(partielle.statut, "confirme");
  assert.equal(partielle.prescriptionsStatut, "indisponible");
  assert.match(rendu(partielle), /Les prescriptions cartographiées n'ont pas pu être toutes lues/);
  const t = rendu(urbanismeIndisponible());
  assert.match(t, /Plan d'urbanisme non lu/);
  assert.match(t, /Cela ne veut pas dire qu'aucune règle ne s'applique/);
});

test("La collecte ne lève jamais : réseau coupé, réponses en erreur, JSON invalide", async () => {
  const avant = globalThis.fetch;
  try {
    globalThis.fetch = (async () => { throw new Error("réseau coupé"); }) as typeof fetch;
    assert.equal((await fetchUrbanismeParcelle(46.15, -1.15, null)).statut, "indisponible");
    globalThis.fetch = (async () => new Response("erreur", { status: 503 })) as typeof fetch;
    assert.equal((await fetchUrbanismeParcelle(46.15, -1.15, null)).statut, "indisponible");
    globalThis.fetch = (async () => new Response("{pas du json", { status: 200 })) as typeof fetch;
    assert.equal((await fetchUrbanismeParcelle(46.15, -1.15, null)).statut, "indisponible");
  } finally {
    globalThis.fetch = avant;
  }
});

test("La collecte rejoue une réponse réelle par les mêmes appels (Mérignac) : POST, géométrie de la parcelle", async () => {
  const x = fixture("merignac-deux-zones");
  const couches: Record<string, M> = {
    municipality: x.municipality, document: x.document, "zone-urba": x.zone, "secteur-cc": x.secteur,
    "prescription-surf": x.prescriptionSurf, "prescription-lin": x.prescriptionLin, "prescription-pct": x.prescriptionPct,
  };
  const vus: string[] = [];
  const avant = globalThis.fetch;
  try {
    globalThis.fetch = (async (url: string | URL, init?: RequestInit) => {
      const u = String(url);
      const couche = u.match(/api\/gpu\/([a-z-]+)$/)?.[1];
      if (couche) {
        assert.equal(init?.method, "POST");
        const geom = JSON.parse(String(init?.body)).geom;
        if (couche !== "municipality") assert.equal(geom.type, x.parcelle.geometry.type, `${couche} lit la parcelle`);
        vus.push(couche);
        return new Response(JSON.stringify(couches[couche]));
      }
      const doc = u.match(/document\/([0-9a-f]{32})\/(details|files)$/);
      if (doc) return new Response(JSON.stringify(doc[2] === "details" ? x.details[doc[1]] : x.files[doc[1]]));
      throw new Error(`appel inattendu ${u}`);
    }) as typeof fetch;
    const u = await fetchUrbanismeParcelle(x.ban.lat, x.ban.lon, { geometry: x.parcelle.geometry, contenance: x.parcelle.properties.contenance });
    assert.deepEqual(u, lire("merignac-deux-zones"));
    assert.equal(vus.length, 7);
  } finally {
    globalThis.fetch = avant;
  }
});

// ═══════════════════════════════════ 3. CE QUE LE TEXTE NE DIT JAMAIS ══════════════════════════

test("Aucune conclusion abusive sur la constructibilité, sur tous les cas réels et toutes les familles", () => {
  for (const c of CAS) {
    const u = lire(c);
    const t = rendu(u);
    sansAbus(t, c);
    if (u.regime === "document" && u.zones.length > 0) {
      assert.match(t, /Ce zonage ne dit pas, à lui seul, ce qui est autorisé/, `${c} : la limite du zonage est dite`);
      assert.match(t, /faites confirmer le projet par le service urbanisme de la mairie/, `${c} : la vérification est dite`);
    }
    if (u.statut !== "indisponible" && u.regime !== "rnu" && u.statut !== "non_trouve") {
      assert.match(t, /D'après le Géoportail de l'urbanisme/, `${c} : la source est dite`);
    }
  }
  for (const [code, f] of Object.entries(FAMILLES)) sansAbus(`${f.titre} ${f.note}`, `famille ${code}`);
});

test("Seuils de couverture : nommés, et une bande réelle sur une grande parcelle reste retenue", () => {
  assert.equal(PART_MIN, 0.02);
  assert.equal(couvre(0.001, 600), false, "0,1 % d'une petite parcelle : la limite");
  assert.equal(couvre(0.009, 4979), true, "45 m² d'emplacement réservé de voirie sur 5 000 m²");
  assert.equal(couvre(0.025, null), true);
  assert.equal(couvre(null, null), true, "lecture au point : la zone contient le point");
  const [moitie, rien] = partsDansParcelle(carre(0, 0, 0.001, 0.001), [carre(0, -1, 0.0005, 1), carre(5, 5, 6, 6)]);
  assert.ok(Math.abs(moitie! - 0.5) < 0.02);
  assert.equal(rien, 0);
  assert.equal(approbationDepuisNom("200046977_PLUi_20260326"), "2026-03-26");
  assert.equal(approbationDepuisNom("123456789_PLUI_20170915_A"), "2017-09-15");
  assert.equal(approbationDepuisNom("DU_241700434"), null);
});

// ═══════════════════════════════════ 4. LES DOSSIERS ET LEURS VERSIONS ═════════════════════════

const rapport = (o: Partial<LogementReport> = {}): LogementReport => ({
  address: { id: "17300_x", label: "12 rue du Palais 17000 La Rochelle", city: "La Rochelle", citycode: "17300", postcode: "17000", latitude: 46.16, longitude: -1.15 },
  parcel: { parcelCode: "17300-000-EN-0010", nomCommune: "La Rochelle", contenance: 120 },
  altitude: 5, zfe: { inZfe: false, zones: [] }, cartofriches: { count: 0, tronque: false, sansCoordonnees: 0, friches: [] },
  communeData: null, sinistralite: null, heritage: { items: [], sourceStatus: "ok" },
  georisques: { address: null, parcel: null, commune: null },
  ...o,
});
function version(r: LogementReport, numero = 1): VersionLogement {
  return { numero, collecteeLe: "2026-09-01T10:00:00.000Z", sourcesAbsentes: sourcesAbsentes(r), synthese: null, syntheseHash: null, report: r, reportHash: jsonCanonique(r), syntheseDpe: null };
}

test("Dossier historique sans champ urbanisme : ni panne inventée, ni empreinte changée, et l'écran le dit", () => {
  const ancien = rapport();
  assert.ok(!sourcesAbsentes(ancien).includes("urbanisme"));
  assert.ok(!jsonCanonique(ancien).includes("urbanisme"), "l'empreinte d'un rapport antérieur ne bouge pas");
  const t = texte(rendreSection({
    georisques: ancien.georisques, heritage: ancien.heritage,
    urbanisme: { lecture: ancien.urbanisme, parcelCode: ancien.parcel!.parcelCode, parcelleParRepli: false },
  }));
  assert.match(t, /Ce dossier a été collecté avant la lecture du plan d'urbanisme\. Une actualisation des données l'ajoutera/);
  // Un appelant qui ne connaît pas l'urbanisme (bancs antérieurs) n'affiche rien de plus.
  assert.doesNotMatch(texte(rendreSection({ georisques: ancien.georisques, heritage: ancien.heritage })), /urbanisme/);
});

test("Le bloc réglementaire ne dit plus « aucune règle de construction » à côté d'un plan d'urbanisme", () => {
  const point = { risks: { labels: [] }, pprn: { labels: [] }, regulatoryPlans: [], rga: null, seismic: null };
  const t = texte(rendreSection({
    georisques: { address: point, parcel: null, commune: null }, heritage: { items: [], sourceStatus: "ok" },
    urbanisme: { lecture: lire("moissy-zone-unique"), parcelCode: null, parcelleParRepli: false },
  }));
  assert.match(t, /Ni plan de prévention des risques ni périmètre patrimonial à cette adresse/);
  assert.match(t, /Cette parcelle est en zone UC/);
  assert.doesNotMatch(t, /Aucune règle de construction/);
  assert.doesNotMatch(t, /aucune contrainte de construction/);
});

test("Actualisation explicite : N+1 porte l'urbanisme, N reste intacte ; une panne GPU ne remplace pas une lecture", async () => {
  const ancienne = version(rapport());
  const figee = JSON.stringify(ancienne);
  const ecrites: LogementReport[] = [];
  const deps = (nouveau: LogementReport, v: VersionLogement) => ({
    lire: async () => v,
    construire: async () => nouveau,
    empreinte: jsonCanonique,
    enregistrer: async (r: LogementReport, h: string) => { ecrites.push(r); return { ...version(r, v.numero + 1), reportHash: h }; },
  });

  // Sans demande d'actualisation, la version est rendue telle quelle : aucune collecte.
  const sansDemande = await consulterOuActualiser(false, { ...deps(rapport(), ancienne), construire: async () => { throw new Error("aucune source ne doit être appelée"); } });
  assert.equal(sansDemande.urbanisme, undefined);

  const avecUrba = rapport({ urbanisme: lire("moissy-zone-unique") });
  const r1 = await consulterOuActualiser(true, deps(avecUrba, ancienne));
  assert.equal(r1.actualisation, "nouvelle_version");
  assert.equal(r1.version?.numero, 2);
  assert.equal(r1.urbanisme?.zones[0].libelle, "UC");
  assert.equal(JSON.stringify(ancienne), figee, "la version 1 n'a pas bougé");

  // La version 2 avait l'urbanisme ; une collecte où le Géoportail est en panne ne la remplace pas.
  const v2 = version(avecUrba, 2);
  const r2 = await consulterOuActualiser(true, deps(rapport({ urbanisme: urbanismeIndisponible() }), v2));
  assert.equal(r2.actualisation, "refusee");
  assert.ok(r2.sourcesNonActualisees?.includes("urbanisme"));
  assert.ok(!v2.sourcesAbsentes.includes("urbanisme"), "c'est bien l'urbanisme, perdu, qui refuse");
  assert.equal(r2.urbanisme?.zones[0].libelle, "UC", "la lecture de la version 2 reste affichée");
  assert.equal(ecrites.length, 1, "seule la version 2 a été écrite");

  // Deux collectes identiques donnent la même empreinte : pas de version fantôme.
  assert.equal(jsonCanonique(rapport({ urbanisme: lire("lyon-croix-rousse") })), jsonCanonique(rapport({ urbanisme: lire("lyon-croix-rousse") })));
});
