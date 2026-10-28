// FUT-156 : le pipeline de l'index de la fibre à l'adresse, sur des fichiers construits pour l'occasion.
// Les cas réels (rejoués depuis les lignes officielles) sont dans `src/lib/fut156-fibre-adresse.test.ts` ;
// ici, ce que les fichiers réels du T2 2026 ne contiennent pas (encore) : doublons de lignes, pseudo-opérateurs,
// valeurs inconnues, états contradictoires, et le refus de construire sur un schéma qui a bougé.
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { gzipSync } from "node:zlib";
import { ENTETE_ACTUEL, ENTETE_BASE_IMB, construireDepartement, decouper } from "./departement.mjs";
import { ENTETE_IMMEUBLE, lireLigneImmeuble } from "./immeuble.mjs";
import { champs, enregistrements } from "./sources.mjs";
import { lotDe } from "../../src/lib/fibre-adresse.ts";

const BAN_ENTETE = "id;id_fantoir;numero;rep;nom_voie;code_postal;code_insee;nom_commune;code_insee_ancienne_commune;nom_ancienne_commune;x;y;lon;lat;type_position;alias;nom_ld;libelle_acheminement;nom_afnor;source_position;source_nom_voie;certification_commune;cad_parcelles";
// Un point à La Rochelle, en EPSG:3857 (base_imb) et en WGS84 (BAN), et un autre à 300 m à l'est.
const X = -128_000, Y = 5_800_000;
const [LON, LAT] = [X / 6378137 * 180 / Math.PI, (2 * Math.atan(Math.exp(Y / 6378137)) - Math.PI / 2) * 180 / Math.PI];

const imb = (o) => [o.id, o.x ?? X, o.y ?? Y, o.code ?? `IMB/${o.id}`, "17300", "1", o.source ?? "fo", "PA", o.cle ?? "", "", o.num ?? "", o.rep ?? "", o.voie ?? "", "", "17300", "La Rochelle", "", o.addrSource ?? (o.cle ? "ban" : "fo")].join(";");
const ban = (id, o = {}) => [id, "", o.num ?? "1", o.rep ?? "", o.voie ?? "Rue X", "17000", "17300", "La Rochelle", "", "", "", "", o.lon ?? LON, o.lat ?? LAT, o.pos ?? "entrée", "", "", "", "", "", "", "", ""].join(";");
const elig = (id, op, techno = "FO") => [id, "", "", op, techno, "THD1G", "THD1G", "", ""].join(";");

async function construire({ immeubles, actuel, adresses, etats, referentiel = new Map([["A", "A"], ["B", "B"], ["C", "C"]]) }) {
  const d = await fs.mkdtemp(path.join(os.tmpdir(), "fut156-"));
  const ecrire = (n, lignes) => fs.writeFile(path.join(d, n), gzipSync(lignes.join("\n") + "\n"));
  await ecrire("imm.tsv.gz", Object.entries(etats).flatMap(([id, e]) => (Array.isArray(e) ? e : [e]).map((x) => `IMB/${id}\t${x}`)));
  await ecrire("base.csv.gz", [ENTETE_BASE_IMB, ...immeubles]);
  await ecrire("actuel.csv.gz", [ENTETE_ACTUEL, ...actuel]);
  await ecrire("ban.csv.gz", [BAN_ENTETE, ...adresses]);
  try {
    return await construireDepartement({
      extraitImmeuble: path.join(d, "imm.tsv.gz"), baseImb: path.join(d, "base.csv.gz"),
      actuel: path.join(d, "actuel.csv.gz"), ban: path.join(d, "ban.csv.gz"), referentiel,
    });
  } finally {
    await fs.rm(d, { recursive: true, force: true });
  }
}

describe("construireDepartement", () => {
  test("les lignes FO d'un même opérateur (débits, offres) ne comptent qu'une fois", async () => {
    const { communes, stats } = await construire({
      immeubles: [imb({ id: "1", cle: "17300_0001_00001" })],
      actuel: [elig("1", "A"), elig("1", "A"), elig("1", "B"), elig("1", "C", "CU"), elig("1", "C", "4GF")],
      adresses: [ban("17300_0001_00001")],
      etats: { 1: "deploye" },
    });
    assert.equal(communes["17300"]["0001_00001"], "D2");
    assert.equal(stats.lignesFibreEnDouble, 1);
  });

  test("un pseudo-opérateur rend le nombre non établi, un code hors référentiel est compté et signalé", async () => {
    const { communes, stats } = await construire({
      immeubles: [imb({ id: "1", cle: "17300_0001_00001" }), imb({ id: "2", cle: "17300_0001_00002" })],
      actuel: [elig("1", "A"), elig("1", "CCC"), elig("2", "A"), elig("2", "NOUV")],
      adresses: [ban("17300_0001_00001"), ban("17300_0001_00002")],
      etats: { 1: "deploye", 2: "deploye" },
    });
    assert.equal(communes["17300"]["0001_00001"], "D");
    assert.equal(communes["17300"]["0001_00002"], "D2");
    assert.deepEqual(stats.pseudoOperateurs, { CCC: 1 });
    assert.deepEqual(stats.operateursHorsReferentiel, { NOUV: 1 });
  });

  test("absent de la table : non établi ; présent sans FO : zéro prouvé", async () => {
    const { communes } = await construire({
      immeubles: [imb({ id: "1", cle: "17300_0001_00001" }), imb({ id: "2", cle: "17300_0001_00002" })],
      actuel: [elig("2", "A", "CU")],
      adresses: [ban("17300_0001_00001"), ban("17300_0001_00002")],
      etats: { 1: "deploye", 2: "raccordable demande" },
    });
    assert.equal(communes["17300"]["0001_00001"], "D");
    assert.equal(communes["17300"]["0001_00002"], "R0");
  });

  test("un code IPE publié deux fois avec deux états : aucun état ; deux fois le même : sans effet", async () => {
    const { communes, stats } = await construire({
      immeubles: [imb({ id: "1", cle: "17300_0001_00001" }), imb({ id: "2", cle: "17300_0001_00002" })],
      actuel: [elig("1", "A"), elig("2", "A")],
      adresses: [ban("17300_0001_00001"), ban("17300_0001_00002")],
      etats: { 1: ["deploye", "cible"], 2: ["deploye", "deploye"] },
    });
    assert.equal(communes["17300"]["0001_00001"], "U");
    assert.equal(communes["17300"]["0001_00002"], "D1");
    assert.equal(stats.immeubleConflits, 1);
  });

  test("le libellé exact rattache un immeuble fibre sans clé BAN, jamais un immeuble qui a une clé", async () => {
    const { communes, stats } = await construire({
      immeubles: [
        imb({ id: "1", num: "3", voie: "Rue de l'Hospice" }),
        imb({ id: "2", cle: "17300_0009_00007", num: "7", voie: "Rue Y" }),
      ],
      actuel: [elig("1", "A"), elig("2", "A")],
      adresses: [ban("17300_0001_00003", { num: "3", voie: "Rue de l’Hospice" }), ban("17300_0001_00007", { num: "7", voie: "Rue Y" })],
      etats: { 1: "deploye", 2: "deploye" },
    });
    assert.equal(communes["17300"]["0001_00003"], "~D1");
    assert.equal(communes["17300"]["0001_00007"], undefined);
    assert.deepEqual(stats.parRattachement, { cle_ban: 0, libelle: 1, aucun: 1 });
  });

  test("un bâtiment à 300 m du point de l'adresse : rien n'est conclu", async () => {
    const { communes } = await construire({
      immeubles: [imb({ id: "1", cle: "17300_0001_00001" }), imb({ id: "2", cle: "17300_0001_00001", x: X + 300 / Math.cos(LAT * Math.PI / 180) })],
      actuel: [elig("1", "A"), elig("2", "A")],
      adresses: [ban("17300_0001_00001")],
      etats: { 1: "deploye", 2: "deploye" },
    });
    assert.equal(communes["17300"]["0001_00001"], "G/2");
  });

  test("plusieurs positions BAN : la position d'entrée est retenue", async () => {
    const loin = LON + 0.01;
    const { communes } = await construire({
      immeubles: [imb({ id: "1", cle: "17300_0001_00001" })],
      actuel: [elig("1", "A")],
      adresses: [ban("17300_0001_00001", { pos: "segment", lon: loin }), ban("17300_0001_00001")],
      etats: { 1: "deploye" },
    });
    assert.equal(communes["17300"]["0001_00001"], "D1");
  });

  test("un schéma qui bouge arrête la construction : technologie, source, état, en-tête", async () => {
    const base = { immeubles: [imb({ id: "1", cle: "17300_0001_00001" })], actuel: [elig("1", "A")], adresses: [ban("17300_0001_00001")], etats: { 1: "deploye" } };
    await assert.rejects(construire({ ...base, actuel: [elig("1", "A", "FTTH")] }), /technologie inconnue « FTTH »/);
    await assert.rejects(construire({ ...base, immeubles: [imb({ id: "1", cle: "17300_0001_00001", source: "osm" })] }), /source d'immeuble inconnue « osm »/);
    await assert.rejects(construire({ ...base, etats: { 1: "raccorde" } }), /état inconnu « raccorde »/);
    await assert.rejects(construire({ ...base, immeubles: [imb({ id: "1", cle: "17300_0001_00001" }) + ";colonne"] }), /19 colonnes/);
  });
});

describe("CSV entre guillemets (RFC 4180)", () => {
  test("un séparateur, un guillemet doublé ou un saut de ligne dans un champ ne décalent aucune colonne", async () => {
    assert.deepEqual(champs('a;"Mortessagne;Le Favet";c', ";"), ["a", "Mortessagne;Le Favet", "c"]);
    assert.deepEqual(champs('a;"Résidence ""Les Aigrettes""";', ";"), ["a", 'Résidence "Les Aigrettes"', ""]);
    assert.deepEqual(champs("a;;b", ";"), ["a", "", "b"]);
    assert.throws(() => champs('a;"ouvert', ";"), /guillemet non fermé/);
    const d = await fs.mkdtemp(path.join(os.tmpdir(), "fut156-csv-"));
    try {
      await fs.writeFile(path.join(d, "f.csv.gz"), gzipSync('x;y\n1;"deux\nlignes"\n3;"a;b"\n'));
      const out = [];
      for await (const r of enregistrements(path.join(d, "f.csv.gz"), ";")) out.push(r);
      assert.deepEqual(out, [["x", "y"], ["1", "deux\nlignes"], ["3", "a;b"]]);
    } finally {
      await fs.rm(d, { recursive: true, force: true });
    }
  });

  test("une adresse BAN et un immeuble aux libellés protégés se lisent et se rattachent", async () => {
    const { communes } = await construire({
      immeubles: [imb({ id: "1", cle: "17300_0001_00001" }).replace(";;17300;La Rochelle;", ';"Mortessagne;Le Favet";17300;La Rochelle;')],
      actuel: [elig("1", "A")],
      adresses: [ban("17300_0001_00001", { voie: '"Lotissement ""Le Clos"""' }).replace(";;;;;;;;", ';;;;"a;b";;;;')],
      etats: { 1: "deploye" },
    });
    assert.equal(communes["17300"]["0001_00001"], "D1");
  });
});

describe("Immeuble (cartefibre)", () => {
  test("une virgule dans un libellé : la ligne est relue par la droite, sans perdre son état", () => {
    assert.equal(ENTETE_IMMEUBLE.split(",").length, 20);
    const normale = "-0.98,46.06,IMB/17032/X/0001,22,,CHEMIN,DES HENRYS,,17032,17290,Ballon,individuel,cible,SRO,deploye,2019-10-21,ALRT,PA,2019-03-01,f";
    assert.deepEqual(lireLigneImmeuble(normale), { imbId: "IMB/17032/X/0001", insee: "17032", etat: "cible" });
    const virgule = "-0.98,46.06,IMB/17032/X/0002,22,,CHEMIN,DES HENRYS, LE BOURG,,17032,17290,Ballon,individuel,deploye,SRO,deploye,2019-10-21,ALRT,PA,2019-03-01,f";
    assert.deepEqual(lireLigneImmeuble(virgule), { imbId: "IMB/17032/X/0002", insee: "17032", etat: "deploye" });
    assert.equal(lireLigneImmeuble("trop,court"), null);
  });
});

describe("decouper", () => {
  test("chaque commune est dans le lot que la lecture calculera, et aucune n'est perdue", () => {
    const communes = Object.fromEntries(Array.from({ length: 60 }, (_, i) => [`17${String(i).padStart(3, "0")}`, { "0001_00001": "D5".repeat(400) }]));
    const lots = decouper(communes, "17", "2026T2", 20_000);
    assert.ok(lots.length > 1);
    for (const l of lots) for (const insee of Object.keys(l.communes)) assert.equal(lotDe(insee, lots.length), l.lot);
    assert.equal(lots.reduce((s, l) => s + Object.keys(l.communes).length, 0), 60);
  });
});
