// FUT-143 · CE QUE LA QUALIFICATION DIT DES DIAGNOSTICS DU MÊME BÂTIMENT, AVANT ACHAT.
//
// Villeurbanne, 2 rue des Alliés : « Diagnostic énergétique : aucun à cette adresse », puis « Ce dossier ne
// pourra donc qualifier ni la performance énergétique de ce logement… ». Le dossier payé proposait ensuite
// 18 diagnostics de logements enregistrés à d'autres adresses du même bâtiment. Les deux premières phrases
// étaient vraies à l'adresse ; la seconde sous-estimait ce que le dossier présente.
//
// Les réponses RNB et ADEME sont celles relevées par FUT-80 (`src/lib/__fixtures__/fut80/`), lues par les
// fonctions de production. Aucun appel réseau.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { etatMemeBatiment, sonderMemeBatiment, type RechercheMemeBatiment } from "./qualification-meme-batiment.ts";
import { expectedCoverage } from "./dossier-couverture-attendue.ts";
import { identiteDepuisRnb, type IdentiteBatiment } from "./batiment-rnb.ts";
import { memeBatimentSeulement } from "./dpe-meme-batiment.ts";
import type { DpeRecord } from "./dpe-attribution.ts";

const LE = "2026-10-26T12:00:00.000Z";
type Fixture = { ban: string; rnb: unknown; ademe_batiment: Array<Record<string, unknown>> };
const fx = (nom: string): Fixture =>
  JSON.parse(fs.readFileSync(path.join(process.cwd(), "src/lib/__fixtures__/fut80", `${nom}.json`), "utf8"));

// La forme de `toRecord` (dpe.ts, `server-only`) pour les seuls champs que lit le tri : grain et adresse.
const enregistrement = (l: Record<string, unknown>): DpeRecord => ({
  id_dpe: String(l.numero_dpe), id_ban: (l.identifiant_ban as string) ?? null, adresse: null,
  type_batiment: (l.type_batiment as string) ?? null, methode_dpe: (l.methode_application_dpe as string) ?? null,
  date_dpe: (l.date_etablissement_dpe as string) ?? null,
} as unknown as DpeRecord);

function recherche(f: Fixture, over: Partial<RechercheMemeBatiment> = {}): RechercheMemeBatiment {
  return { status: "present", candidates: memeBatimentSeulement(f.ademe_batiment.map(enregistrement), f.ban), tronque: false, ...over };
}

const villeurbanne = fx("villeurbanne_angle");
const identiteVilleurbanne = identiteDepuisRnb(villeurbanne.rnb, LE);

// ── L'état, établi ou non ──────────────────────────────────────────────────────────────────

test("Villeurbanne : un bâtiment, des diagnostics DE LOGEMENT à d'autres adresses → candidats", () => {
  assert.equal(identiteVilleurbanne.statut, "confirme");
  assert.equal(etatMemeBatiment(identiteVilleurbanne, recherche(villeurbanne)), "candidats");
});

test("un DPE d'immeuble seul n'est pas un candidat pour le logement", () => {
  const immeubles = recherche(villeurbanne);
  immeubles.candidates = immeubles.candidates.filter((c) => /immeuble/i.test(String(c.type_batiment)));
  assert.ok(immeubles.candidates.length >= 1, "la fixture porte la fiche d'immeuble");
  assert.equal(etatMemeBatiment(identiteVilleurbanne, immeubles), "aucun");
});

test("aucun candidat, les deux jeux ADEME ont répondu → aucun (établi)", () => {
  assert.equal(etatMemeBatiment(identiteVilleurbanne, { status: "absent", candidates: [], tronque: false }), "aucun");
});

test("ADEME partiellement indisponible : des candidats lus restent établis ; zéro n'est pas une absence", () => {
  assert.equal(etatMemeBatiment(identiteVilleurbanne, recherche(villeurbanne, { status: "unavailable" })), "candidats");
  assert.equal(etatMemeBatiment(identiteVilleurbanne, { status: "unavailable", candidates: [], tronque: false }), "non_verifie");
});

test("réponse tronquée sans DPE de logement lu (immeuble seul) : non vérifié, jamais « aucun »", () => {
  // La page non lue peut porter des diagnostics de logement : une liste partielle ne prouve pas leur absence.
  const immeubles = recherche(villeurbanne, { status: "present", tronque: true });
  immeubles.candidates = immeubles.candidates.filter((c) => /immeuble/i.test(String(c.type_batiment)));
  assert.ok(immeubles.candidates.length >= 1);
  assert.equal(etatMemeBatiment(identiteVilleurbanne, immeubles), "non_verifie");
  assert.equal(etatMemeBatiment(identiteVilleurbanne, { status: "absent", candidates: [], tronque: true }), "non_verifie");
  // Complète, la même liste établit l'absence.
  assert.equal(etatMemeBatiment(identiteVilleurbanne, { ...immeubles, tronque: false }), "aucun");
});

test("réponse tronquée : un candidat lu suffit à l'établir, sans en promettre le nombre", () => {
  assert.equal(etatMemeBatiment(identiteVilleurbanne, recherche(villeurbanne, { tronque: true })), "candidats");
});

test("plusieurs bâtiments à l'adresse : le dossier ne cherche pas au bâtiment, rien n'est annoncé", () => {
  const puyravault = identiteDepuisRnb(fx("puyravault_ambigu").rnb, LE);
  assert.equal(puyravault.statut, "ambigu");
  assert.equal(etatMemeBatiment(puyravault, undefined), "sans_objet");
});

test("RNB sans bâtiment pour l'adresse : rien n'est annoncé", () => {
  const bordeaux = identiteDepuisRnb(fx("bordeaux_aucun").rnb, LE);
  assert.equal(bordeaux.statut, "non_trouve");
  assert.equal(etatMemeBatiment(bordeaux, undefined), "sans_objet");
});

test("RNB indisponible : non vérifié, jamais « aucun »", () => {
  assert.equal(etatMemeBatiment({ statut: "indisponible" }, undefined), "non_verifie");
  assert.equal(etatMemeBatiment(undefined, undefined), "non_verifie");
});

test("bâtiment confirmé sans recherche aboutie (délai) : non vérifié", () => {
  assert.equal(etatMemeBatiment(identiteVilleurbanne, undefined), "non_verifie");
});

// ── La sonde : bornée, jamais bloquante, jamais lancée sans raison ─────────────────────────

test("sonde : la recherche ADEME par bâtiment ne part que pour un bâtiment unique", async () => {
  const appels: string[] = [];
  const chercher = async (rnb: string) => { appels.push(rnb); return recherche(villeurbanne); };
  assert.equal(await sonderMemeBatiment({ identite: Promise.resolve(identiteVilleurbanne), banId: villeurbanne.ban, chercher }), "candidats");
  assert.deepEqual(appels, ["ETRZP8JQ3DNK"]);
  const puyravault = identiteDepuisRnb(fx("puyravault_ambigu").rnb, LE);
  assert.equal(await sonderMemeBatiment({ identite: Promise.resolve(puyravault), banId: "x", chercher }), "sans_objet");
  assert.equal(appels.length, 1, "aucune recherche pour un bâtiment ambigu");
});

test("sonde : au-delà du délai, elle rend « non vérifié » sans attendre la source", async () => {
  const lente = new Promise<IdentiteBatiment>(() => {});
  const t = Date.now();
  const etat = await sonderMemeBatiment({ identite: lente, banId: "x", chercher: async () => recherche(villeurbanne), delaiMs: 30 });
  assert.equal(etat, "non_verifie");
  assert.ok(Date.now() - t < 1000);
});

test("sonde : une exception de la source devient « non vérifié », jamais une erreur de la route", async () => {
  const etat = await sonderMemeBatiment({
    identite: Promise.resolve(identiteVilleurbanne), banId: villeurbanne.ban,
    chercher: async () => { throw new Error("ADEME"); },
  });
  assert.equal(etat, "non_verifie");
  assert.equal(await sonderMemeBatiment({ identite: Promise.reject(new Error("RNB")), banId: "x", chercher: async () => recherche(villeurbanne) }), "non_verifie");
});

// ── Ce que l'écran en dit ──────────────────────────────────────────────────────────────────

test("Villeurbanne : le texte dit l'absence À L'ADRESSE, puis les candidats du bâtiment, à vérifier", () => {
  const c = expectedCoverage({ dpe: "none", parcel: "found", memeBatiment: "candidats" });
  assert.equal(c.profile, "candidats_a_verifier");
  assert.match(c.manque ?? "", /^Aucun diagnostic de performance énergétique n'est enregistré à cette adresse/);
  assert.match(c.manque ?? "", /d'autres adresses du même bâtiment/);
  assert.match(c.manque ?? "", /vérifi/);
  // Ni la conclusion d'absence qui faisait le défaut, ni une promesse d'attribution.
  assert.doesNotMatch(c.manque ?? "", /ne pourra donc qualifier/);
  assert.doesNotMatch(`${c.manque} ${c.reste}`, /diagnostic (énergétique )?(de|rattaché à) ce logement|sera rattaché|la classe de ce logement/i);
  assert.doesNotMatch(c.reste, /S'y ajoute la lecture du diagnostic/, "aucun diagnostic n'est promis au logement");
  assert.doesNotMatch(c.manque ?? "", /la plupart des adresses/, "ce cas-là n'est pas le cas courant");
});

test("le texte des candidats ne naît que d'un état ÉTABLI à l'adresse ET au bâtiment", () => {
  const candidatsCite = /autres adresses du même bâtiment/;
  // DPE à l'adresse : la question ne se pose pas.
  assert.doesNotMatch(String(expectedCoverage({ dpe: "found", parcel: "found", memeBatiment: "candidats" }).manque), candidatsCite);
  // ADEME muette à l'adresse : on ne sait pas qu'il n'y a « aucun » DPE, on ne dit donc pas « néanmoins ».
  const panne = expectedCoverage({ dpe: "unavailable", parcel: "found", memeBatiment: "candidats" });
  assert.equal(panne.profile, "a_reverifier");
  assert.doesNotMatch(String(panne.manque), /aucun diagnostic/i);
  for (const etat of ["aucun", "sans_objet", "non_verifie", undefined] as const) {
    assert.doesNotMatch(String(expectedCoverage({ dpe: "none", parcel: "found", memeBatiment: etat }).manque), /néanmoins/, String(etat));
  }
});

test("bâtiment non vérifié : l'absence à l'adresse est dite, sans conclure pour tout le dossier ni promettre", () => {
  const c = expectedCoverage({ dpe: "none", parcel: "found", memeBatiment: "non_verifie" });
  assert.equal(c.profile, "a_reverifier");
  assert.match(c.manque ?? "", /^Aucun diagnostic de performance énergétique n'est enregistré à cette adresse/);
  assert.doesNotMatch(c.manque ?? "", /ne pourra donc qualifier/);
  assert.match(c.manque ?? "", /sans garantie/);
});

test("aucun candidat établi, ou pas de recherche au bâtiment : l'absence reste dite, et elle est conditionnelle", () => {
  for (const etat of ["aucun", "sans_objet", undefined] as const) {
    const c = expectedCoverage({ dpe: "none", parcel: "found", memeBatiment: etat });
    assert.equal(c.profile, "sans_diagnostic", String(etat));
    assert.match(c.manque ?? "", /Sans diagnostic, ce dossier ne pourra qualifier ni la performance énergétique de ce logement, ni son comportement en été/);
    assert.match(c.manque ?? "", /la plupart des adresses/);
  }
});

test("candidats : aucune valeur, aucun nombre (la qualification n'est pas le dossier gratuit)", () => {
  const c = expectedCoverage({ dpe: "none", parcel: "found", memeBatiment: "candidats" });
  const tout = `${c.manque ?? ""} ${c.reste}`;
  assert.equal(/(classe|étiquette)\s+[A-G]\b/i.test(tout), false);
  assert.equal(/\d/.test(tout), false);
});
