// FUT-148 : la fibre par commune (Arcep), du fichier à la phrase.
//
// LES VALEURS ATTENDUES DE LA RECETTE NE VIENNENT PAS DE LA TABLE. Elles ont été relevées le 28/10/2026 dans
// le CLASSEUR de l'observatoire T2 2026 (onglets « Communes » et « Arrondissements »), une publication de
// l'Arcep distincte du fichier par commune dont la table est tirée. Une table qui dériverait de sa source
// échoue ici, au lieu de se recopier elle-même.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  classeArcep, construireTableFibre, fibreDeLaCommune, lireDbf, partEntiere,
  type LectureFibre, type LigneFichierCommune, type TableFibre,
} from "./data/arcep-fibre.ts";
import { ligneComparateur, partEnMots, projetEvoqueLaConnexion, termeDeConnexion, texteFibre } from "./fibre-texte.ts";
import { horsMesureToLignes } from "./comparateur-labels.ts";
import { classerNonMesuree } from "./decision/criteria-registry.ts";
import { phrasesNonMesurees } from "./decision/conclusion-plan.ts";

const table = JSON.parse(readFileSync("data/arcep-fibre.json", "utf8")) as TableFibre;
const referentiel = Object.keys((JSON.parse(readFileSync("src/data/accueil-communes.json", "utf8")) as { communes: Record<string, unknown> }).communes);
const lire = (insee: string) => fibreDeLaCommune(table, insee);
/** Les espaces insécables (`bindOrphans`, « 3 % ») ramenées à des espaces, pour comparer le texte lu. */
const sp = (s: string) => s.replace(/ /g, " ");
const mesuree = (insee: string) => {
  const l = lire(insee);
  assert.equal(l?.etat, "mesuree", `${insee} : ${l?.etat}`);
  return l as Extract<LectureFibre, { etat: "mesuree" }>;
};
/** Toutes les phrases qu'une lecture peut faire afficher, réunies. */
const toutLeTexte = (l: LectureFibre | null) => {
  const t = texteFibre(l);
  return [t.valeur, t.sousTitre, t.titreVolet, t.phrase, t.limite, t.verification, t.methode, ligneComparateur(l)].join(" ");
};

// ── 1. La table publiée ────────────────────────────────────────────────────────────────────

test("la table porte sa source : producteur, trimestre, date d'arrêt, licence, empreintes", () => {
  const m = table.meta;
  assert.match(m.producteur, /ARCEP/);
  assert.equal(m.trimestre, "2026T2");
  assert.equal(m.arrete, "2026-06-30");
  assert.match(m.licence, /Licence Ouverte/);
  assert.equal(m.fichierCommune.titre, "2026T2-Commune");
  assert.equal(m.fichierCommune.sha256, "267604f9684d2cd04eba1f2b038ce2bda8c6077daed37f2a176e383d099eb468");
  assert.equal(m.observatoire.titre, "2026T2-obs-hd-thd-deploiement");
  assert.match(m.fichierCommune.url, /^https:\/\/static\.data\.gouv\.fr\//);
  assert.equal(m.convention, "arcep-fibre-1");
  assert.ok(!/immeuble/i.test(m.fichierCommune.url), "jamais le fichier par immeuble");
});

test("chaque commune du référentiel futur•e a une ligne ou une discordance déclarée, jamais un trou silencieux", () => {
  const manquantes = referentiel.filter((c) => !table.communes[c] && !table.discordantes[c]);
  assert.deepEqual(manquantes, []);
});

test("bornes : effectifs finis, positifs, raccordables jamais au-delà des locaux", () => {
  for (const [c, [locaux, racc, den]] of Object.entries(table.communes)) {
    assert.ok(Number.isFinite(locaux) && locaux >= 0, c);
    assert.ok(Number.isInteger(racc) && racc >= 0, c);
    assert.ok(racc <= locaux, `${c} : ${racc} > ${locaux}`);
    assert.ok(den === "ipe" || den === "insee", c);
    const p = partEntiere(locaux, racc);
    if (p != null) assert.ok(p >= 0 && p <= 100, c);
  }
});

test("la somme nationale redonne le chiffre de l'observatoire : 4,7 % de locaux restant à rendre raccordables", () => {
  const { locaux, raccordables } = table.meta.national;
  assert.equal(Math.round((1 - raccordables / locaux) * 1000) / 10, 4.7);
});

// ── 2. Recette : la table contre le classeur de l'observatoire ───────────────────────────────

// [insee, locaux (meilleure estimation), raccordables T2 2026, part affichée attendue]
const RECETTE: [string, string, number, number, number][] = [
  ["63072", "Chabreloche (63)", 742.10112, 0, 0],
  ["63163", "Gelles (63)", 828, 0, 0],
  ["63179", "Job (63)", 765.06062, 22, 3],
  ["03191", "Murat (03)", 207.05814, 0, 0],
  ["15138", "Murat (15)", 1650, 1579, 96],
  ["29016", "Brasparts (29)", 904, 878, 97],
  ["2A004", "Ajaccio", 46475, 45852, 99],
  ["33063", "Bordeaux", 213381, 206036, 97],
  ["35238", "Rennes", 163969, 158500, 97],
  ["67482", "Strasbourg", 194462, 180662, 93],
  ["26274", "Rochefourchat (26), 1 habitant", 7.66667, 7, 91],
  ["54254", "Haucourt-Moulaine (54)", 1686, 0, 0], // dénominateur 1 577,27 dans le fichier par commune : même part
  ["75101", "Paris 1er", 24814, 22660, 91],
  ["69389", "Lyon 9e", 36786, 34817, 95],
  ["13216", "Marseille 16e", 11261, 9601, 85],
  ["97101", "Les Abymes (971)", 39166, 36997, 94],
  ["97411", "Saint-Denis (974)", 93177, 90721, 97],
  ["97611", "Mamoudzou (976)", 21315.01, 5745, 27],
];

for (const [insee, nom, locaux, racc, part] of RECETTE) {
  test(`recette ${nom} : ${racc} raccordables, ${part} % affichés`, () => {
    const l = mesuree(insee);
    assert.equal(l.raccordables, racc);
    if (insee !== "54254") assert.ok(Math.abs(l.locaux - locaux) < 0.01, `${l.locaux} ≠ ${locaux}`);
    assert.equal(partEntiere(l.locaux, l.raccordables), part);
  });
}

test("Paris, Lyon, Marseille : la somme des arrondissements redonne la ligne communale de l'observatoire", () => {
  for (const [ville, locaux, racc, part, n] of [
    ["75056", 1811579, 1744131, 96, 20], ["69123", 389332, 381720, 98, 9], ["13055", 544863, 489661, 90, 16],
  ] as const) {
    const l = mesuree(ville);
    assert.equal(l.agrege, true);
    assert.equal(l.raccordables, racc);
    assert.ok(Math.abs(l.locaux - locaux) < 0.5);
    assert.equal(partEntiere(l.locaux, l.raccordables), part);
    assert.match(sp(texteFibre(l).phrase), /de la commune/, `${ville} : ${n} arrondissements, une commune`);
  }
  assert.match(sp(texteFibre(mesuree("75101")).phrase), /de l'arrondissement/);
});

test("Thumeréville : les deux publications se contredisent (10 % ou 94 %), aucun taux n'est affiché", () => {
  assert.deepEqual(table.discordantes["54524"], { fichierCommune: [472, 49], observatoire: [52, 49] });
  const l = lire("54524");
  assert.equal(l?.etat, "discordante");
  const t = texteFibre(l);
  assert.equal(t.manquant, true);
  assert.doesNotMatch(toutLeTexte(l), /\d\s?%/);
});

test("Beaumont-en-Verdunois, sans aucun local : pas de part, pas de 0 %", () => {
  const l = lire("55039");
  assert.equal(l?.etat, "sans_locaux");
  assert.doesNotMatch(toutLeTexte(l), /\d\s?%/);
});

// ── 3. Jamais d'absence convertie en 0 % ───────────────────────────────────────────────────────

test("table illisible, commune inconnue : « indisponible » ou « absente », jamais 0 %", () => {
  assert.equal(fibreDeLaCommune(null, "63072"), null);
  for (const l of [null, fibreDeLaCommune(table, "99999"), lire("97502")]) {
    const t = texteFibre(l);
    assert.equal(t.manquant, true);
    assert.equal(t.valeur, "—");
    assert.doesNotMatch(toutLeTexte(l), /\d\s?%|aucun local (?:de la commune )?n'est raccordable/);
    assert.match(t.phrase + t.sousTitre, /indisponible|absente|n'apparaît pas|Non publiée/i);
  }
  assert.equal(fibreDeLaCommune(table, "99999")?.etat, "absente");
});

test("une commune PLM dont un arrondissement manque n'est pas lue comme une somme partielle", () => {
  const amputee: TableFibre = { ...table, communes: { ...table.communes } };
  delete amputee.communes["75120"];
  assert.equal(fibreDeLaCommune(amputee, "75056")?.etat, "absente");
});

// ── 4. Ce que les phrases disent, et ce qu'elles ne disent jamais ───────────────────────────────

test("la phrase : le niveau, la date, l'Arcep ; puis la limite ; puis où vérifier", () => {
  const t = texteFibre(mesuree("63179"));
  assert.equal(sp(t.phrase), "Au 30 juin 2026, 3 % des locaux de la commune sont raccordables à la fibre, selon l'Arcep.");
  assert.match(t.limite.replace(/ /g, " "), /^Ce taux concerne l'ensemble de la commune\. Il ne garantit pas que le logement qui vous intéresse est raccordable\./);
  assert.match(t.verification.replace(/ /g, " "), /carte de l'Arcep/);
  assert.equal(t.valeur, "3 % des locaux");
  assert.match(t.methode, /raccordables sur demande/);
  assert.match(t.methode, /22 sur environ 765/);
  assert.match(t.methode, /Insee/);
});

test("0 % : la phrase dit « aucun local », et dit aussi que ce n'est pas l'absence d'Internet", () => {
  for (const insee of ["63072", "63163", "54254"]) {
    const t = texteFibre(mesuree(insee));
    assert.match(t.phrase.replace(/ /g, " "), /aucun local de la commune n'est raccordable à la fibre/);
    assert.match(t.limite.replace(/ /g, " "), /n'est pas privé d'Internet/);
    assert.match(ligneComparateur(mesuree(insee)), /d'autres accès à Internet peuvent exister/);
  }
});

test("interdits : aucune affirmation à l'adresse, aucun « sans Internet », aucun jugement", () => {
  const lectures: (LectureFibre | null)[] = [null, ...["63072", "63179", "15138", "75056", "75101", "54524", "55039", "99999", "2A004"].map(lire)];
  for (const l of lectures) {
    const txt = toutLeTexte(l).replace(/ /g, " ");
    assert.doesNotMatch(txt, /votre (logement|adresse|maison) (est|sera) raccordable/i);
    assert.doesNotMatch(txt, /(?<!pas privé d')(?<!n'est pas )sans (accès à )?internet/i);
    assert.doesNotMatch(txt, /\b(faible|mauvaise?|insuffisante?|zone blanche|bonne couverture|bien couverte?)\b/i);
    assert.doesNotMatch(txt, /éligible/i, "l'éligibilité est celle de l'adresse, chez l'opérateur");
  }
});

test("partEntiere : arrondi usuel, jamais 100 % s'il reste un local, jamais 0 % s'il y en a un", () => {
  assert.equal(partEntiere(765.06062, 22), 3);
  assert.equal(partEntiere(1000, 996), 99);
  assert.equal(partEntiere(1000, 1000), 100);
  assert.equal(partEntiere(1000, 4), 1);
  assert.equal(partEnMots(1000, 4), "moins de 1 %");
  assert.equal(partEntiere(1000, 0), 0);
  assert.equal(partEntiere(0, 0), null);
  assert.equal(partEntiere(100, 29), 29);
});

test("les classes de cartefibre (onglet « Sommaire ») se retrouvent depuis ftth / Locaux", () => {
  assert.equal(classeArcep(100, 0), 0);
  assert.equal(classeArcep(100, 9), 5);
  assert.equal(classeArcep(100, 94.9), 80);
  assert.equal(classeArcep(100, 95), 95);
  assert.equal(classeArcep(0, 0), null);
});

// ── 5. La construction refuse ce qui la rendrait fausse ────────────────────────────────────────

const META = {
  producteur: "ARCEP", jeu: "j", licence: "Licence Ouverte", trimestre: "2026T2", arrete: "2026-06-30",
  fichierCommune: { titre: "c", url: "u", sha256: "s", octets: 1, modifieLe: null },
  observatoire: { titre: "o", url: "u", sha256: "s", octets: 1, modifieLe: null },
  extraitLe: "2026-10-28", couverture: "test",
};
const ligne = (insee: string, locaux: number, ftth: number, couv: number | null = classeArcep(locaux, ftth)): LigneFichierCommune => ({ insee, locaux, ftth, couv });

test("construction : un double, un excès de raccordables, une classe contredite font échouer", () => {
  assert.throws(() => construireTableFibre([ligne("01001", 10, 5), ligne("01001", 10, 5)], [], [], META), /double/);
  assert.throws(() => construireTableFibre([ligne("01001", 10, 11, 95)], [], [], META), /plus de raccordables/);
  assert.throws(() => construireTableFibre([ligne("01001", 10, 5, 95)], [], [], META), /classe publiée/);
  assert.throws(() => construireTableFibre([ligne("01001", Number.NaN, 5, null)], [], [], META), /invalides/);
});

test("construction : un écart entre publications qui change la part est déclaré discordant ; sinon gardé et signalé", () => {
  const { table: t, rapport } = construireTableFibre(
    [ligne("54524", 472, 49), ligne("54254", 1577.2693, 0), ligne("01001", 432, 423)],
    [
      { insee: "54524", locaux: 52, ftth: 49, source: "IPE" },
      { insee: "54254", locaux: 1686, ftth: 0, source: "IPE" },
      { insee: "01001", locaux: 432, ftth: 423, source: "INSEE" },
    ],
    ["54524", "54254", "01001", "01002"], META,
  );
  assert.deepEqual(rapport.discordantes, ["54524"]);
  assert.equal(t.communes["54524"], undefined);
  assert.deepEqual(rapport.ecartsSansEffet.map((e) => e.insee), ["54254"]);
  assert.deepEqual(t.communes["01001"], [432, 423, "insee"]);
  assert.deepEqual(rapport.referentielAbsents, ["01002"]);
  assert.equal(fibreDeLaCommune(t, "01002")?.etat, "absente");
});

test("lireDbf : en-tête dBase III, champs texte et numériques, enregistrement supprimé ignoré", () => {
  const champs = [["INSEE_COM", 5], ["ftth", 6]] as const;
  const entete = 32 + 32 * champs.length + 1;
  const longueur = 1 + 5 + 6;
  const enregistrements = [[" ", "63072", "     0"], ["*", "99999", "    12"], [" ", "2A004", " 45852"]];
  const buf = new Uint8Array(entete + longueur * enregistrements.length);
  const v = new DataView(buf.buffer);
  v.setUint32(4, enregistrements.length, true);
  v.setUint16(8, entete, true);
  v.setUint16(10, longueur, true);
  champs.forEach(([nom, long], i) => {
    buf.set(new TextEncoder().encode(nom), 32 + 32 * i);
    buf[32 + 32 * i + 16] = long;
  });
  buf[32 + 32 * champs.length] = 0x0d;
  enregistrements.forEach((e, i) => buf.set(new TextEncoder().encode(e.join("")), entete + i * longueur));
  assert.deepEqual(lireDbf(buf), [{ INSEE_COM: "63072", ftth: "0" }, { INSEE_COM: "2A004", ftth: "45852" }]);
});

// ── 6. Le besoin du lecteur : ses mots, rien d'autre ─────────────────────────────────────────

test("le besoin se lit dans les mots du lecteur : fibre, Internet, télétravail ; pas la 4G ni une « connexion » de transport", () => {
  for (const oui of ["fibre", "la fibre optique", "bonne connexion internet", "télétravail", "je télétravaille", "travailler à distance", "très haut débit", "Full remote"]) {
    assert.ok(termeDeConnexion(oui), oui);
  }
  for (const non of ["bonne connexion avec Paris", "réseau 4G", "couverture mobile", "fibres naturelles du sol"]) {
    assert.ok(!termeDeConnexion(non), non);
  }
  assert.equal(projetEvoqueLaConnexion({ horsMesure: [{ term: "eau du robinet" }, { term: "la fibre" }] }), true);
  assert.equal(projetEvoqueLaConnexion({ horsMesure: [] }), false);
  // « Télétravail total » ne pose que `emploiHorsSujet`, qui réunit aussi retraite et sans activité : pas un signal.
  assert.equal(projetEvoqueLaConnexion({ emploiHorsSujet: true, horsMesure: [] } as never), false);
  assert.equal(projetEvoqueLaConnexion(null), false);
});

test("la carte rappelle la question du projet sans changer le fond", () => {
  const l = mesuree("63072");
  const sans = texteFibre(l);
  const avec = texteFibre(l, { pourLeProjet: true });
  assert.match(avec.sousTitre, /une question de votre projet/);
  assert.equal(avec.phrase, sans.phrase);
  assert.equal(avec.valeur, sans.valeur);
  assert.doesNotMatch(sans.sousTitre, /projet/);
});

// ── 7. Les phrases qui disaient « non mesuré » ne se contredisent plus ─────────────────────────

test("Où vivre : « fibre » ne reçoit plus « futur•e ne mesure pas ce sujet », les autres sujets si", () => {
  const lignes = horsMesureToLignes([
    { term: "fibre", kind: "autre" }, { term: "télétravail", kind: "affectif" }, { term: "eau du robinet", kind: "autre" },
  ]);
  assert.equal(lignes.length, 3);
  assert.match(lignes[0]!.phrase, /n'a pas classé les communes sur ce point ; la part des locaux raccordables à la fibre est indiquée/);
  assert.equal(lignes[1]!.terme, "Télétravail");
  assert.equal(lignes[1]!.phrase, lignes[0]!.phrase);
  assert.match(lignes[2]!.phrase, /ne mesure pas ce sujet/);
});

test("dossier : « fibre » n'est plus « sans réponse » mais renvoie au module Territoire, sans promesse à l'adresse", () => {
  assert.deepEqual(classerNonMesuree("autre", "fibre", "manque_produit"), { raison: "manque_produit", theme: "connexion" });
  assert.deepEqual(classerNonMesuree("autre", "télétravail", "ressenti"), { raison: "manque_produit", theme: "connexion" });
  const phrases = phrasesNonMesurees([
    { terme: "fibre", raison: "manque_produit", theme: "connexion" },
    { terme: "eau du robinet", raison: "manque_produit", theme: null },
  ]);
  assert.equal(phrases.length, 2);
  assert.match(phrases[0]!, /^« fibre » : futur•e n'en fait pas un critère de ce dossier\. Le module Territoire donne la part des locaux de la commune raccordables à la fibre ; elle ne garantit rien pour une adresse précise\.$/);
  assert.doesNotMatch(phrases.join(" "), /« fibre »[^.]*ne sait pas encore/);
  assert.match(phrases[1]!, /« eau du robinet »/);
});

// ── 8. Aucun score, aucune synthèse, aucun appel modèle ne bouge ──────────────────────────────

const source = (p: string) => readFileSync(p, "utf8");

test("le classement n'importe pas la fibre : scores, paliers et ordre restent ceux d'avant", () => {
  assert.doesNotMatch(source("src/lib/comparateur-vie.ts"), /from ["'][^"']*fibre/);
  const route = source("src/app/api/comparateur-vie/match/route.ts");
  // La ligne est posée APRÈS matchProjects et la coupe à trois, sans retri.
  assert.ok(route.indexOf("matchProjects(parsed)") < route.indexOf("getFibreCommunes("));
  assert.doesNotMatch(route, /\.sort\(/);
});

test("la synthèse rédigée d'Où vivre ne reçoit pas la fibre", () => {
  const client = source("src/app/(public)/ou-vivre/OuVivreClient.tsx");
  const corps = client.slice(client.indexOf('fetch("/api/comparateur-vie/synthesize"'), client.indexOf("if (!res.ok || !res.body)"));
  assert.ok(corps.length > 100);
  assert.doesNotMatch(corps, /fibre/);
});

test("le snapshot Territoire, empreinte des synthèses rédigées, ne contient pas la fibre", () => {
  for (const p of ["src/lib/server/territoire-snapshot.ts", "src/lib/territoire/facts.ts", "src/lib/territoire/synthesis-contract.ts", "src/lib/territoire/synthesis-cache.ts"]) {
    assert.doesNotMatch(source(p), /fibre|arcep/i, p);
  }
  const page = source("src/app/(account)/rapport/quartier/page.tsx");
  assert.match(page, /getFibreCommune\(inseeCode\)/);
  assert.doesNotMatch(page.slice(page.indexOf("loadTerritoireSnapshot(inseeCode"), page.indexOf("const screen =")), /fibre/i);
});

test("aucun appel au modèle dans la chaîne fibre", () => {
  for (const p of ["src/lib/fibre-texte.ts", "src/lib/fibre-commune.ts", "src/lib/data/arcep-fibre.ts", "scripts/arcep/construire.mts", "scripts/arcep/telecharger.mjs"]) {
    assert.doesNotMatch(source(p), /anthropic|generateText|streamText|@ai-sdk/i, p);
  }
});
