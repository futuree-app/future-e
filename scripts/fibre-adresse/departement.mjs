/**
 * La construction d'UN département de l'index de la fibre à l'adresse (FUT-156).
 *
 * Entrées, toutes du même trimestre sauf la BAN (instantané du jour) :
 *   - l'extrait départemental du fichier cartefibre `Immeuble` (`imb_id <tab> imb_etat`) ;
 *   - `base_imb_<dép>.csv.gz` (immeubles, clés BAN, coordonnées) ;
 *   - `actuel_<dép>.csv.gz` (offres déclarées, par immeuble, opérateur et technologie) ;
 *   - `adresses-<dép>.csv.gz` (BAN : les adresses à indexer, leur point, leur libellé).
 *
 * Sortie : pour chaque adresse BAN rattachée, le code de `classerAdresse` (`src/lib/fibre-adresse.ts`),
 * rangé par commune. Rien d'autre n'est conservé : ni opérateur nommé, ni débit, ni coordonnée.
 *
 * Toute valeur inconnue d'une colonne qui gouverne le résultat (source d'immeuble, technologie, état)
 * arrête la construction : un schéma qui bouge doit se voir, pas se taire.
 */
import { enregistrements, lignes } from "./sources.mjs";
import {
  classerAdresse, communeDeCle, distanceM, FORMAT_INDEX_FIBRE, LETTRE_ETAT, lotDe, normaliserVoie, PSEUDO_OPERATEURS, webMercatorVersWgs84,
} from "../../src/lib/fibre-adresse.ts";

export const ENTETE_BASE_IMB = "imb_id;imb_x;imb_y;imb_code;imb_code_insee;imb_nbr_logloc;imb_source;imb_type;addr_code;imb_num;addr_numero;addr_rep;addr_nom_voie;addr_nom_ld;addr_code_insee;addr_nom_commune;addr_id_fantoir;addr_source";
export const ENTETE_ACTUEL = "imb_id;addr_code;imb_code;code_operateur;code_techno;classe_debit_montant;classe_debit_descendant;limitation;saturation";
/** `fo` (IPE), `ban`, `cada` sont documentés (v2025T4) ; `fpb` et `fpban` sont observés, sans donnée fibre. */
export const SOURCES_IMMEUBLE = new Set(["fo", "ban", "cada", "fpb", "fpban"]);
/** Les technologies de la documentation MCI v2025T4. Une nouvelle technologie (un « FO » renommé) doit arrêter. */
export const TECHNOLOGIES = new Set(["FO", "CU", "COAX", "4GF", "5GF", "THDR", "WMX", "SAT"]);
/** Les positions BAN préférées quand une adresse en porte plusieurs (celle du géocodeur en premier). */
const POSITIONS = ["entrée", "bâtiment", "logement", "délivrance postale", "parcelle", "segment", "service technique"];

const cleLibelle = (insee, numero, rep, voie) => `${insee}|${numero}|${(rep ?? "").toUpperCase()}|${normaliserVoie(voie)}`;

/** Les états cartefibre du département : `imb_id` -> lettre, `""` (état vide), ou `null` (deux états publiés). */
async function lireEtats(extrait, stats) {
  const etats = new Map();
  for await (const l of lignes(extrait)) {
    if (!l) continue;
    const [id, etat] = l.split("\t");
    const lettre = etat ? LETTRE_ETAT[etat] : "";
    if (lettre === undefined) throw new Error(`Immeuble : état inconnu « ${etat} »`);
    if (etats.has(id)) {
      stats.immeubleDoublons++;
      if (etats.get(id) !== lettre) { etats.set(id, null); stats.immeubleConflits++; }
    } else etats.set(id, lettre);
  }
  return etats;
}

/** `base_imb` : les immeubles, par clé BAN et (pour les immeubles fibre sans clé BAN) par libellé. */
async function lireBaseImb(fichier, etats, stats) {
  const imm = []; // { source, imbId, etat, lon, lat }
  const parCle = new Map();
  const parLibelle = new Map();
  let entete = true;
  for await (const p of enregistrements(fichier, ";")) {
    if (entete) {
      if (p.join(";") !== ENTETE_BASE_IMB) throw new Error(`base_imb : en-tête inattendu « ${p.join(";").slice(0, 200)} »`);
      entete = false;
      continue;
    }
    if (p.length === 1 && !p[0]) continue;
    if (p.length !== 18) throw new Error(`base_imb : ${p.length} colonnes « ${p.join(";").slice(0, 200)} »`);
    const [imbId, x, y, imbCode, , , source, , addrCode, , numero, rep, voie, , addrInsee, , , addrSource] = p;
    if (!SOURCES_IMMEUBLE.has(source)) throw new Error(`base_imb : source d'immeuble inconnue « ${source} »`);
    stats.immeubles++;
    let etat;
    if (source === "fo") {
      stats.immeublesFibre++;
      const e = etats.get(imbCode);
      if (e === undefined) stats.immeublesFibreSansEtat++;
      // `""` (état vide) et `undefined` (absent) : aucun état publié. `null` : deux états.
      etat = e === "" ? undefined : e;
    }
    const [lon, lat] = x && y ? webMercatorVersWgs84(Number(x), Number(y)) : [NaN, NaN];
    const i = imm.push({ source, imbId, etat, lon, lat }) - 1;
    if (addrCode) {
      let a = parCle.get(addrCode);
      if (!a) parCle.set(addrCode, (a = []));
      a.push(i);
    }
    if (source === "fo" && addrSource !== "ban") {
      const k = cleLibelle(addrInsee, numero, rep, voie);
      let a = parLibelle.get(k);
      if (!a) parLibelle.set(k, (a = []));
      a.push(i);
    }
  }
  return { imm, parCle, parLibelle };
}

/** `actuel` : les immeubles présents dans la table (toute technologie), et leurs opérateurs fibre distincts. */
async function lireActuel(fichier, referentiel, stats) {
  const presents = new Set();
  const fibre = new Map();
  let entete = true;
  for await (const p of enregistrements(fichier, ";")) {
    if (entete) {
      if (p.join(";") !== ENTETE_ACTUEL) throw new Error(`actuel : en-tête inattendu « ${p.join(";").slice(0, 200)} »`);
      entete = false;
      continue;
    }
    if (p.length === 1 && !p[0]) continue;
    if (p.length !== 9) throw new Error(`actuel : ${p.length} colonnes « ${p.join(";").slice(0, 200)} »`);
    const [imbId, , , op, techno] = p;
    if (!TECHNOLOGIES.has(techno)) throw new Error(`actuel : technologie inconnue « ${techno} »`);
    stats.lignesActuel++;
    presents.add(imbId);
    if (techno !== "FO") continue;
    stats.lignesFibre++;
    let s = fibre.get(imbId);
    if (!s) fibre.set(imbId, (s = new Set()));
    // Plusieurs lignes FO d'un même opérateur (débits, offres) ne comptent qu'une fois.
    if (s.has(op)) stats.lignesFibreEnDouble++;
    s.add(op);
    if (PSEUDO_OPERATEURS.has(op)) stats.pseudoOperateurs[op] = (stats.pseudoOperateurs[op] ?? 0) + 1;
    else if (!referentiel.has(op)) stats.operateursHorsReferentiel[op] = (stats.operateursHorsReferentiel[op] ?? 0) + 1;
  }
  return { presents, fibre };
}

/** La BAN du département : une position par identifiant, la plus proche du bâtiment. */
async function lireBan(fichier, stats) {
  const adresses = new Map();
  let col = null;
  let largeur = 0;
  for await (const p of enregistrements(fichier, ";")) {
    if (!col) {
      largeur = p.length;
      col = Object.fromEntries(p.map((c, i) => [c, i]));
      for (const c of ["id", "numero", "rep", "nom_voie", "code_insee", "lon", "lat", "type_position"]) {
        if (!(c in col)) throw new Error(`BAN : colonne « ${c} » absente`);
      }
      continue;
    }
    if (p.length === 1 && !p[0]) continue;
    if (p.length !== largeur) throw new Error(`BAN : ${p.length} colonnes au lieu de ${largeur} « ${p.join(";").slice(0, 200)} »`);
    stats.lignesBan++;
    const id = p[col.id];
    const rang = POSITIONS.indexOf(p[col.type_position]);
    const deja = adresses.get(id);
    if (deja && (rang < 0 || (deja.rang >= 0 && deja.rang <= rang))) continue;
    adresses.set(id, {
      rang, insee: p[col.code_insee], numero: p[col.numero], rep: p[col.rep], voie: p[col.nom_voie],
      lon: Number(p[col.lon]), lat: Number(p[col.lat]),
    });
  }
  return adresses;
}

export function statsVides() {
  return {
    immeubleDoublons: 0, immeubleConflits: 0, immeubles: 0, immeublesFibre: 0, immeublesFibreSansEtat: 0,
    lignesActuel: 0, lignesFibre: 0, lignesFibreEnDouble: 0, pseudoOperateurs: {}, operateursHorsReferentiel: {},
    lignesBan: 0, adresses: 0, adressesSansCommune: 0, parRattachement: { cle_ban: 0, libelle: 0, aucun: 0 },
    parCode: {}, operateurs: {}, clesMciHorsBan: 0,
  };
}

/** La lettre (ou classe) d'un code, pour les statistiques. */
function classe(code) {
  const m = /^~?(A|[A-Z])/.exec(code);
  return m ? m[1] : "?";
}

/**
 * Construit un département. Rend `{ communes, stats }` ; `communes` : INSEE -> suffixe de clé -> code.
 */
export async function construireDepartement({ extraitImmeuble, baseImb, actuel, ban, referentiel }) {
  const stats = statsVides();
  const etats = await lireEtats(extraitImmeuble, stats);
  const { imm, parCle, parLibelle } = await lireBaseImb(baseImb, etats, stats);
  etats.clear();
  const { presents, fibre } = await lireActuel(actuel, referentiel, stats);
  const adresses = await lireBan(ban, stats);

  const communes = {};
  for (const [id, a] of adresses) {
    stats.adresses++;
    const commune = communeDeCle(id);
    if (!commune) { stats.adressesSansCommune++; continue; }
    let idx = parCle.get(id);
    let parLib = false;
    if (!idx) {
      idx = parLibelle.get(cleLibelle(a.insee, a.numero, a.rep, a.voie));
      parLib = !!idx;
    }
    if (!idx) { stats.parRattachement.aucun++; continue; }
    stats.parRattachement[parLib ? "libelle" : "cle_ban"]++;
    const immeubles = idx.map((i) => {
      const r = imm[i];
      return {
        source: r.source,
        etat: r.etat,
        distanceM: Number.isFinite(r.lon) && Number.isFinite(a.lon) ? distanceM(r.lon, r.lat, a.lon, a.lat) : null,
        operateursFibre: presents.has(r.imbId) ? fibre.get(r.imbId) ?? new Set() : undefined,
      };
    });
    const code = classerAdresse(immeubles, parLib);
    if (code === null) continue;
    const k = classe(code);
    stats.parCode[k] = (stats.parCode[k] ?? 0) + 1;
    const ops = /^~?[DRQECS](\d+(?:-\d+)?)/.exec(code)?.[1] ?? (/^~?[DRQECS]/.test(code) ? "non_etabli" : null);
    if (ops) stats.operateurs[ops] = (stats.operateurs[ops] ?? 0) + 1;
    (communes[commune] ??= {})[id.slice(commune.length + 1)] = code;
  }
  for (const cle of parCle.keys()) if (!adresses.has(cle)) stats.clesMciHorsBan++;
  return { communes, stats };
}

/** Les lots d'un département : chaque commune va dans `lotDe(insee, n)`, n choisi pour viser `LOT_BRUT`. */
export function decouper(communes, dep, millesime, lotBrut) {
  const brut = Buffer.byteLength(JSON.stringify(communes));
  const n = Math.max(1, Math.ceil(brut / lotBrut));
  const lots = Array.from({ length: n }, (_, lot) => ({ format: FORMAT_INDEX_FIBRE, millesime, departement: dep, lot, communes: {} }));
  for (const insee of Object.keys(communes).sort()) lots[lotDe(insee, n)].communes[insee] = communes[insee];
  return lots;
}
