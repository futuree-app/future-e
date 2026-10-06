// FUT-68 — la présentation des diagnostics d'une adresse : compacte, sans rien retirer ni réordonner.
import test from "node:test";
import assert from "node:assert/strict";
import {
  APERCU_CANDIDATS, PHRASE_DPE_IMMEUBLE, champsVariables, compterIdentifiables, decouperListe, ligneCandidat, listeRepliee,
  phraseAttribution, phraseIdentifiables, phrasesOuvertureRepliee, SAISIE_NUMERO, vueSectionDpe,
} from "./dpe-selection-vue.ts";
import { dpeAttributionStatus, type DpeRecord } from "./dpe-attribution.ts";
import { sortCandidates } from "./dpe-candidate-match.ts";

function dpe(over: Partial<DpeRecord> = {}): DpeRecord {
  return {
    id_dpe: "2517E0000000A", date_dpe: "2025-03-12", id_ban: null, adresse: null,
    etiquette_dpe: "C", etiquette_ges: "B", conso_ep_m2: null, emission_ges_m2: null,
    surface_m2: 29.5, annee_construction: 1972, type_batiment: "appartement",
    etage: "0", complement: "Bâtiment B B105",
    confort_ete: null, traversant: null, protection_solaire: null, ventilation: null,
    inertie: null, isolation_toiture: null, brasseur_air: null,
    isolation_murs: null, isolation_menuiseries: null, methode_dpe: "dpe appartement individuel",
    ...over,
  } as DpeRecord;
}

// L'adresse du ticket : 34 diagnostics, dont 31 identifiés, classes C à F, de 2023 à 2025.
const CLASSES = ["C", "D", "E", "F"] as const;
const IMMEUBLE_34: DpeRecord[] = Array.from({ length: 34 }, (_, i) => dpe({
  id_dpe: `25${String(i).padStart(2, "0")}E00000${i}X`,
  complement: i < 31 ? `Bâtiment B B${100 + i}` : null,
  surface_m2: 20 + ((i * 7) % 60) + 0.5,
  etiquette_dpe: CLASSES[i % 4],
  date_dpe: `${2023 + (i % 3)}-06-01`,
}));

// ── Seuil d'écran ────────────────────────────────────────────────────────────────────────────────

test("seuil : jusqu'à six, la liste reste la question ; au-delà, elle se replie", () => {
  assert.equal(APERCU_CANDIDATS, 6);
  for (const n of [1, 2, 3, 6]) assert.equal(listeRepliee(n), false, `${n} candidats`);
  for (const n of [7, 34]) assert.equal(listeRepliee(n), true, `${n} candidats`);
});

// ── Découpage de la liste ────────────────────────────────────────────────────────────────────────

test("1 candidat : il est visible, rien n'est masqué", () => {
  const r = decouperListe([dpe()], "", false);
  assert.equal(r.visibles.length, 1);
  assert.equal(r.masques, 0);
});

test("2 à 3 candidats : tous visibles d'emblée", () => {
  const trois = [dpe({ id_dpe: "a" }), dpe({ id_dpe: "b" }), dpe({ id_dpe: "c" })];
  const r = decouperListe(trois, "", false);
  assert.deepEqual(r.visibles.map((c) => c.id_dpe), ["a", "b", "c"]);
  assert.equal(r.masques, 0);
});

test("beaucoup de candidats : six d'abord, les 28 autres derrière un geste, aucun perdu", () => {
  const ordered = sortCandidates(IMMEUBLE_34);
  const replie = decouperListe(ordered, "", false);
  assert.equal(replie.visibles.length, 6);
  assert.equal(replie.masques, 28);
  const deplie = decouperListe(ordered, "", true);
  assert.equal(deplie.visibles.length, 34);
  assert.equal(deplie.masques, 0);
  assert.deepEqual(new Set(deplie.visibles.map((c) => c.id_dpe)), new Set(IMMEUBLE_34.map((c) => c.id_dpe)));
});

test("l'ordre est celui du moteur, sans réordonnancement d'affichage", () => {
  const ordered = sortCandidates(IMMEUBLE_34);
  const ids = ordered.map((c) => c.id_dpe);
  assert.deepEqual(decouperListe(ordered, "", false).visibles.map((c) => c.id_dpe), ids.slice(0, 6));
  assert.deepEqual(decouperListe(ordered, "", true).visibles.map((c) => c.id_dpe), ids);
  // Les trois lignes sans identifiant restent en fin de liste, comme le veut `sortCandidates`.
  assert.deepEqual(ordered.slice(-3).map((c) => c.complement), [null, null, null]);
});

test("une recherche montre TOUTES ses correspondances, sans second geste", () => {
  const ordered = sortCandidates(IMMEUBLE_34);
  const parPorte = decouperListe(ordered, "b105", false);
  assert.deepEqual(parPorte.visibles.map((c) => c.complement), ["Bâtiment B B105"]);
  const parBatiment = decouperListe(ordered, "bâtiment b", false);
  assert.equal(parBatiment.visibles.length, 31);
  assert.equal(parBatiment.masques, 0);
  const parNumero = decouperListe(ordered, IMMEUBLE_34[12].id_dpe, false);
  assert.equal(parNumero.visibles.length, 1);
  assert.equal(decouperListe(ordered, "zzz", false).correspondances, 0);
});

// ── Une ligne ────────────────────────────────────────────────────────────────────────────────────

test("une ligne : identification, puis repères, puis résultat posé à part", () => {
  const champs = champsVariables(IMMEUBLE_34);
  const l = ligneCandidat(dpe({ etage: "2" }), champs);
  assert.equal(l.titre, "Bâtiment B B105");
  assert.deepEqual(l.details, ["29,5 m²", "étage 2", "DPE 2025"]);
  assert.equal(l.classe, "C");
  assert.ok(!l.details.some((d) => /classe/.test(d)), "la classe n'est pas un repère de reconnaissance");
});

test("aucune information distinctive n'est perdue par rapport à l'ancienne ligne", () => {
  // L'ancienne ligne montrait : identifiant, surface, étage significatif, année du DPE, classe.
  const c = dpe({ etage: 3, surface_m2: 43.2, date_dpe: "2024-01-02", etiquette_dpe: "E" });
  const l = ligneCandidat(c, champsVariables([c]));
  assert.equal(l.titre, "Bâtiment B B105");
  assert.ok(l.details.includes("43,2 m²"));
  assert.ok(l.details.includes("étage 3"));
  assert.ok(l.details.includes("DPE 2024"));
  assert.equal(l.classe, "E");
});

test("l'étage « 0 » reste masqué ; une ligne muette le dit", () => {
  const l = ligneCandidat(dpe({ complement: null, etage: "0" }), champsVariables([dpe()]));
  assert.equal(l.titre, "Sans identifiant de logement");
  assert.equal(l.identifie, false);
  assert.ok(!l.details.some((d) => d.startsWith("étage")));
});

test("type et année de construction n'apparaissent que s'ils distinguent", () => {
  const meme = [dpe({ id_dpe: "a" }), dpe({ id_dpe: "b" })];
  assert.deepEqual(champsVariables(meme), { type: false, construction: false });
  assert.ok(!ligneCandidat(meme[0], champsVariables(meme)).details.some((d) => /appartement|construit/.test(d)));

  const mixte = [dpe({ id_dpe: "a" }), dpe({ id_dpe: "b", type_batiment: "maison", annee_construction: 2005 })];
  const champs = champsVariables(mixte);
  assert.deepEqual(champs, { type: true, construction: true });
  assert.deepEqual(ligneCandidat(mixte[1], champs).details.slice(0, 2), ["maison", "29,5 m²"]);
  assert.ok(ligneCandidat(mixte[1], champs).details.includes("construit en 2005"));
});

test("le diagnostic d'immeuble ne se présente jamais comme celui d'un logement", () => {
  const immeuble = dpe({ complement: null, etage: null, methode_dpe: "dpe immeuble collectif" });
  const l = ligneCandidat(immeuble, champsVariables([immeuble, dpe()]));
  assert.equal(l.titre, "Immeuble entier");
  assert.equal(l.details[0], "diagnostic de l'immeuble");
  assert.equal(l.immeuble, true);
  // Le type « immeuble », quand les types varient, ne se répète pas après le marqueur.
  const typé = dpe({ complement: null, etage: null, type_batiment: "immeuble", methode_dpe: "dpe immeuble collectif" });
  const l2 = ligneCandidat(typé, champsVariables([typé, dpe()]));
  assert.equal(l2.details.filter((d) => /immeuble/.test(d)).length, 1);
});

test("le libellé accessible dit le geste ET la ligne", () => {
  const l = ligneCandidat(dpe(), champsVariables([dpe()]));
  assert.match(l.libelleAccessible, /^Retenir ce diagnostic pour ce logement : Bâtiment B B105, 29,5 m², DPE 2025, classe C$/);
});

// ── Premier niveau d'une liste repliée ───────────────────────────────────────────────────────────

test("le compte des diagnostics reconnaissables, dit dans la liste ouverte", () => {
  assert.equal(compterIdentifiables(IMMEUBLE_34), 31);
  assert.equal(phraseIdentifiables(31, 34), "31 sur 34 portent un identifiant de logement ou un étage.");
  assert.equal(phraseIdentifiables(34, 34), "Chacun porte un identifiant de logement ou un étage.");
  assert.match(phraseIdentifiables(0, 34), /ne peuvent pas être reconnus/);
  assert.match(phraseIdentifiables(0, 1), /^Il ne porte/);
});

test("ouverture d'une liste repliée : combien, et pourquoi le lecteur doit aider ; ni classes, ni années, ni ratio", () => {
  const o = phrasesOuvertureRepliee(34);
  assert.equal(o.titre, "34 diagnostics sont enregistrés à cette adresse.");
  assert.equal(o.aide, "futur•e ne peut pas savoir lequel correspond à ce logement sans votre aide.");
  const tout = `${o.titre} ${o.aide}`;
  assert.doesNotMatch(tout, /classe|20\d\d|sur 34|31/);
});

test("saisie par numéro : une question, une consigne, et le cas de l'entrée voisine dans l'aide seulement", () => {
  assert.equal(SAISIE_NUMERO.question, "Vous avez le numéro du DPE ?");
  assert.equal(SAISIE_NUMERO.consigne, "Saisissez-le pour retrouver précisément le diagnostic.");
  assert.match(SAISIE_NUMERO.aide, /autre entrée du même bâtiment/);
  assert.doesNotMatch(`${SAISIE_NUMERO.question} ${SAISIE_NUMERO.consigne}`, /entrée|voisin|^Il /);
});

// ── Ce que l'écran affirme ───────────────────────────────────────────────────────────────────────

test("auto-confirmé : le critère est nommé, au passé, et rien n'affirme que c'est le logement", () => {
  const p = phraseAttribution("auto_confirmed");
  assert.match(p, /retenu automatiquement/);
  assert.match(p, /c'était le seul diagnostic enregistré à cette adresse/);
  assert.match(p, /maison/);
  assert.doesNotMatch(p, /votre|vôtre|c'est le diagnostic de ce logement|correspond à ce logement/i);
});

test("choix manuel : la phrase dit qui a choisi", () => {
  assert.equal(phraseAttribution("confirmed"), "Vous avez désigné ce diagnostic parmi ceux de cette adresse. ");
});

test("aucune phrase de présentation n'affirme une correspondance certaine", () => {
  const o = phrasesOuvertureRepliee(34);
  const textes = [
    phraseAttribution("auto_confirmed"), phraseAttribution("confirmed"),
    phraseIdentifiables(31, 34), o.titre, o.aide, SAISIE_NUMERO.consigne, SAISIE_NUMERO.aide,
    ...IMMEUBLE_34.map((c) => ligneCandidat(c, champsVariables(IMMEUBLE_34)).libelleAccessible),
  ];
  for (const t of textes) {
    assert.doesNotMatch(t, /votre (logement|diagnostic|DPE)|le vôtre|probablement|sans doute/i, t);
  }
});

// ── Les cinq vues de la section, qui ne se confondent jamais (FUT-65) ────────────────────────────

test("vues : attribué automatiquement ou par le lecteur", () => {
  assert.equal(vueSectionDpe({ statut: "auto_confirmed", dpeRetenu: true, candidats: 1, baseMuette: false }), "attribue");
  assert.equal(vueSectionDpe({ statut: "confirmed", dpeRetenu: true, candidats: 34, baseMuette: false }), "attribue");
});

test("vues : not_in_list reste un refus, même avec 34 candidats", () => {
  assert.equal(vueSectionDpe({ statut: "rejected", dpeRetenu: false, candidats: 34, baseMuette: false }), "refuse");
  assert.equal(vueSectionDpe({ statut: "rejected", dpeRetenu: false, candidats: 0, baseMuette: false }), "refuse");
});

test("vues : pending (rien de retenu) rouvre la liste, y compris une liste partielle", () => {
  assert.equal(vueSectionDpe({ statut: "selection_required", dpeRetenu: false, candidats: 34, baseMuette: false }), "a_choisir");
  assert.equal(vueSectionDpe({ statut: "selection_required", dpeRetenu: false, candidats: 2, baseMuette: true }), "a_choisir");
});

test("vues : not_found et base muette ne se confondent pas", () => {
  assert.equal(vueSectionDpe({ statut: "not_found", dpeRetenu: false, candidats: 0, baseMuette: false }), "aucun");
  assert.equal(vueSectionDpe({ statut: "not_found", dpeRetenu: false, candidats: 0, baseMuette: true }), "non_verifie");
});

test("vues : un statut attribué sans fiche retenue n'affiche jamais une étiquette", () => {
  assert.equal(vueSectionDpe({ statut: "confirmed", dpeRetenu: false, candidats: 3, baseMuette: false }), "a_choisir");
});

// ── Le moteur n'a pas bougé ──────────────────────────────────────────────────────────────────────

test("moteur inchangé : 34 candidats demandent une sélection, la liste reçue est intacte", () => {
  const a = dpeAttributionStatus(IMMEUBLE_34, "housenumber");
  assert.equal(a.status, "selection_required");
  assert.equal(a.status === "selection_required" && a.candidates.length, 34);
  const maison = dpe({ type_batiment: "maison", complement: null });
  assert.equal(dpeAttributionStatus([maison], "housenumber").status, "auto_confirmed");
  assert.equal(dpeAttributionStatus([maison], "housenumber", false).status, "selection_required");
});

test("DPE d'immeuble : une information sur le bâtiment, qui ne remplace pas celui du logement", () => {
  assert.equal(
    PHRASE_DPE_IMMEUBLE,
    "Un diagnostic concerne l'immeuble entier. Il donne une indication sur la performance du bâtiment, mais ne remplace pas le DPE de ce logement.",
  );
  assert.doesNotMatch(PHRASE_DPE_IMMEUBLE, /à défaut|faute de|en l'absence|à la place|utilis/i);
});
