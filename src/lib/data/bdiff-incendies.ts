// ════════════════════════════════════════════════════════════════════════════════════════════
// LA MÉMOIRE DES INCENDIES DE FORÊT ENREGISTRÉS (BDIFF, FUT-147, 28/10/2026). PUR.
//
// ── CE QUE LA SOURCE DIT, ET SEULEMENT CELA ──────────────────────────────────────────────────
// La Base de données des incendies de forêt en France (ministère de l'Agriculture, IGN) recense les
// feux PASSÉS, une fiche par feu, depuis 2006 sur tout le territoire. Deux définitions du producteur
// gouvernent tout ce module (bdiff.agriculture.gouv.fr/aide/recherche, lu le 28/10/2026) :
//   « Commune correspondant à la commune de départ du feu »
//   « Surface indiquant la surface totale parcourue par le feu »
// Un feu est donc rattaché à UNE commune, celle de son départ, avec la surface de TOUT le feu. Le feu
// de Gonfaron (16/08/2021, 6 832 ha) est entièrement compté à Gonfaron ; La Garde-Freinet, qu'il a
// aussi parcourue, n'a pour plus grand feu recensé que 2,95 ha. D'où les deux interdits de texte :
//   - jamais « X hectares ont brûlé dans la commune » : la source ne dit pas où la surface se trouve ;
//   - jamais « aucun incendie dans la commune » : un feu parti d'une voisine n'y est pas compté.
//
// ── CE QUE LA SOURCE NE GARANTIT PAS ─────────────────────────────────────────────────────────
// L'exhaustivité. Le producteur : « la base de données peut contenir des imprécisions et manquer
// d'exhaustivité […]. Les données incendies sont donc à analyser avec prudence, en particulier pour les
// feux antérieurs à 2020 pour les départements en dehors de l'aire Méditerranéenne »
// (/aide/generalites). Il publie aussi, campagne par campagne, les départements « avec un nombre
// d'incendie inconnu » (2024 et 2025 : Paris, Hauts-de-Seine, Seine-Saint-Denis, Val-de-Marne, et la
// Martinique en 2025). Ces campagnes sont gardées dans la table : une commune de ces départements
// sans feu enregistré n'est pas « sans feu », elle est « non renseignée ».
//
// ── CE QUE CE N'EST PAS ──────────────────────────────────────────────────────────────────────
// Ni un risque, ni une probabilité, ni une mesure à l'adresse. Le danger météorologique projeté
// (DRIAS, indice forêt-météo) est une autre grandeur : les deux se juxtaposent, ne se corrigent pas.
// Aucun score, palier ni classement du comparateur ne lit cette table.
//
// Module PUR : aucun réseau, aucun fichier. `scripts/bdiff/telecharger.mjs` collecte les exports,
// `scripts/bdiff/construire.mts` écrit `data/bdiff-incendies.json`, le serveur le lit par
// `src/lib/bdiff-incendies-commune.ts`.
// ════════════════════════════════════════════════════════════════════════════════════════════
import { communeParent } from "../plm.ts";

/** Version de la CONVENTION de la table (périmètre, rattachement, seuils de liste). À relever si elle change. */
export const BDIFF_CONVENTION = "bdiff-incendies-1";

/** La première campagne nationale : avant 2006, la base ne couvre que certains départements méditerranéens. */
export const PREMIERE_CAMPAGNE = 2006;

/** Un feu est listé nommément à partir d'un hectare parcouru ; en dessous, il n'est que compté. */
export const SEUIL_LISTE_M2 = 10_000;
/** Les plus grands feux gardés par commune, par surface décroissante. */
export const FEUX_LISTES_MAX = 3;

/** Les départements où le producteur signale un découpage particulier des surfaces (aire méditerranéenne). */
export const AIRE_MEDITERRANEENNE = ["04", "05", "06", "07", "11", "13", "2A", "2B", "26", "30", "34", "48", "66", "83", "84"] as const;

/** Un feu listé : sa fiche (`/incendie/{annee}/{numero}`), sa surface totale, ce que la source en dit. */
export type FeuRecense = {
  annee: number;
  numero: number;
  /** Date de première alerte, `AAAA-MM-JJ`. */
  date: string;
  /** Surface totale parcourue par le feu, en hectares (m² de la source / 10 000, non arrondie). */
  hectares: number;
  /** « Mesurées » (terrain ou SIG) ; sinon estimées ou non précisées. */
  mesuree: boolean;
  /** La fiche est signalée « Données partielles ou non valides » par la source. */
  fichePartielle: boolean;
  /** Le feu est enregistré sous le code d'une commune fusionnée depuis : son nom d'alors. */
  ancienneCommune?: string;
};

export type EntreeIncendies = {
  /** Feux dont le départ est enregistré sur la commune, de toutes tailles. */
  nombre: number;
  /** Dont au moins un hectare parcouru. */
  nombre1ha: number;
  /** Les plus grands feux d'au moins un hectare (au plus `FEUX_LISTES_MAX`), du plus étendu au moins étendu. */
  feux: FeuRecense[];
};

export type CampagneLue = {
  /** Nombre d'incendies annoncé par l'export ; la construction refuse un écart avec les lignes lues. */
  annonce: number;
  /** Départements que la source signale « avec un nombre d'incendie inconnu » pour la campagne. */
  departementsInconnus: string[];
  /** Empreinte du CSV brut, pour retrouver l'export exact. */
  sha256: string;
  /** Date de lecture du portail (ISO). */
  luLe: string;
};

export type TableIncendies = {
  meta: {
    source: string;
    convention: string;
    /** `2006-2025` : la période réellement lue. */
    periode: string;
    /** Le référentiel communal des codes (`COG 2025`) et l'empreinte du fichier de mouvements Insee. */
    cog: { millesime: string; mouvementsSha256: string };
    campagnes: Record<string, CampagneLue>;
    /** Départements absents de TOUTES les campagnes lues (aucune fiche) : non renseignés, jamais « sans feu ». */
    departementsSansFiche: string[];
    /** Fiches sans commune rattachable (code inconnu de la source, de l'Insee) : comptées, jamais attribuées. */
    nonRattachees: { code: string; nom: string; feux: number }[];
    /** Lignes strictement identiques présentes deux fois dans un export, retirées. */
    doublonsRetires: number;
    licence: { ficheDataGouv: string; mentionExport: string; decision: string };
  };
  communes: Record<string, EntreeIncendies>;
};

// ── LECTURE D'UN EXPORT ─────────────────────────────────────────────────────────────────────

/** Les colonnes lues, VERBATIM. Un export qui en perd une est refusé. */
export const COLONNES = {
  annee: "Année",
  numero: "Numéro",
  departement: "Département",
  insee: "Code INSEE",
  nom: "Nom de la commune",
  alerte: "Date de première alerte",
  surface: "Surface parcourue (m2)",
  precisionSurfaces: "Précision des surfaces",
  precisionDonnee: "Précision de la donnée",
} as const;

export type LigneBdiff = Record<string, string>;

export type ExportLu = { annonce: number; criteres: string; lignes: LigneBdiff[] };

/**
 * CSV à point-virgule, champs entre guillemets. Avant la campagne 2023, une ligne d'avertissement
 * (« ancienne version du formulaire incendie ») précède le compte : on cherche les lignes par leur
 * contenu, jamais par leur position.
 */
export function lireExportBdiff(texte: string): ExportLu {
  const lignes = texte.replace(/^﻿/, "").split(/\r?\n/);
  const annonce = Number(/Nombre d'incendies suivant les critères de sélection : (\d+)/.exec(texte)?.[1]);
  const criteres = (lignes.find((l) => l.includes("Critères de sélection")) ?? "").replace(/"/g, "");
  const iEntete = lignes.findIndex((l) => l.startsWith("Année;"));
  if (iEntete < 0 || !Number.isFinite(annonce)) throw new Error("export BDIFF illisible : en-tête ou compte annoncé introuvable");
  const entete = decouper(lignes[iEntete]!);
  for (const c of Object.values(COLONNES)) {
    if (!entete.includes(c)) throw new Error(`export BDIFF : colonne « ${c} » absente`);
  }
  const out: LigneBdiff[] = [];
  for (const l of lignes.slice(iEntete + 1)) {
    if (!l.trim()) continue;
    const v = decouper(l);
    if (v.length !== entete.length) throw new Error(`export BDIFF : ${v.length} champs au lieu de ${entete.length} (« ${l.slice(0, 80)} »)`);
    out.push(Object.fromEntries(entete.map((c, k) => [c, v[k]!])));
  }
  return { annonce, criteres, lignes: out };
}

/** Une ligne, sans retour à la ligne dans les champs (jamais observé dans les exports 2006-2025). */
function decouper(l: string): string[] {
  const out: string[] = [];
  let champ = "", guillemets = false;
  for (let i = 0; i < l.length; i++) {
    const c = l[i]!;
    if (guillemets) {
      if (c === '"' && l[i + 1] === '"') { champ += '"'; i++; }
      else if (c === '"') guillemets = false;
      else champ += c;
    } else if (c === '"') guillemets = true;
    else if (c === ";") { out.push(champ); champ = ""; }
    else champ += c;
  }
  out.push(champ);
  return out;
}

// ── LE RATTACHEMENT AU RÉFÉRENTIEL COMMUNAL ─────────────────────────────────────────────────

/** Un mouvement du COG Insee (`v_mvt_commune_AAAA.csv`), réduit aux colonnes lues. */
export type MouvementCog = { MOD: string; DATE_EFF: string; TYPECOM_AV: string; COM_AV: string; TYPECOM_AP: string; COM_AP: string };

// Fusions (31 simple, 32 commune nouvelle, 33 association, 34 association devenue simple) et changements
// de code (41 changement de département, 50 transfert de chef-lieu). Les rétablissements (21) ne
// déplacent rien : la commune rétablie retrouve son propre code, et ses feux d'avant restent sous le
// code de la commune qui les portait alors. Ordre de grandeur : une dizaine de fiches au plus sur
// 2006-2025 (23 ou 24 rétablissements ; 7 à 10 fiches selon la méthode de comptage, recompté le 28/10/2026).
const MOUVEMENTS_RATTACHANTS = new Set(["31", "32", "33", "34", "41", "50"]);

/**
 * Le code ACTUEL (COG du référentiel) d'un code de fiche. Suit la chaîne des mouvements jusqu'à une
 * commune existante ; `null` quand le code n'y mène pas (« 83999 Commune inconnue »).
 */
export function resolveurCog(communes: ReadonlySet<string>, mouvements: MouvementCog[]): (code: string) => string | null {
  const suivant = new Map<string, { date: string; ap: string }>();
  for (const m of mouvements) {
    if (m.TYPECOM_AV !== "COM" || m.TYPECOM_AP !== "COM" || m.COM_AV === m.COM_AP || !MOUVEMENTS_RATTACHANTS.has(m.MOD)) continue;
    const deja = suivant.get(m.COM_AV);
    if (!deja || m.DATE_EFF > deja.date) suivant.set(m.COM_AV, { date: m.DATE_EFF, ap: m.COM_AP });
  }
  return (code) => {
    let c = code;
    for (let pas = 0; pas < 20; pas++) {
      if (communes.has(c)) return c;
      const s = suivant.get(c);
      if (!s) return null;
      c = s.ap;
    }
    return null;
  };
}

const cle = (n: string): string => n.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
/** `false` seulement quand les deux noms sont connus et diffèrent ; sans libellé actuel, on garde le nom de la fiche. */
const memeNom = (fiche: string, actuel: string | undefined): boolean => (fiche !== "" && actuel !== undefined && cle(fiche) === cle(actuel));

// ── LA CONSTRUCTION ─────────────────────────────────────────────────────────────────────────

export type CampagneAConstruire = { annee: number; texte: string; departementsInconnus: string[]; sha256: string; luLe: string };

/**
 * La table, depuis les exports bruts. REFUSE (lève) plutôt que d'écrire une table fausse : export d'une
 * autre année, nombre de lignes différent du nombre annoncé, surface illisible ou négative, même fiche
 * (année, numéro) avec deux contenus différents.
 */
export function construireTableIncendies(o: {
  campagnes: CampagneAConstruire[];
  resoudre: (code: string) => string | null;
  /** Le libellé ACTUEL d'une commune (COG). Un code rattaché sous le même nom (changement de chef-lieu,
   *  de département) n'est pas une « ancienne commune » : le lecteur lirait « X, aujourd'hui rattachée à X ». */
  nomActuel?: (insee: string) => string | undefined;
  meta: Pick<TableIncendies["meta"], "source" | "cog" | "licence">;
}): TableIncendies {
  const fiches = new Map<string, string>();
  const parCommune = new Map<string, { nombre: number; nombre1ha: number; feux: FeuRecense[] }>();
  const nonRattachees = new Map<string, { code: string; nom: string; feux: number }>();
  const departementsVus = new Set<string>();
  const campagnes: Record<string, CampagneLue> = {};
  let doublons = 0;
  const annees = o.campagnes.map((c) => c.annee).sort((a, b) => a - b);

  for (const camp of [...o.campagnes].sort((a, b) => a.annee - b.annee)) {
    const lu = lireExportBdiff(camp.texte);
    if (!lu.criteres.includes(`${camp.annee}-01-01`) || !lu.criteres.includes(`${camp.annee}-12-31`)) {
      throw new Error(`${camp.annee} : l'export ne porte pas sur cette campagne (${lu.criteres})`);
    }
    if (!lu.criteres.includes("Type de feu : F")) throw new Error(`${camp.annee} : l'export n'est pas limité aux feux de forêt (${lu.criteres})`);
    if (lu.lignes.length !== lu.annonce) throw new Error(`${camp.annee} : ${lu.lignes.length} lignes pour ${lu.annonce} annoncées`);
    campagnes[camp.annee] = { annonce: lu.annonce, departementsInconnus: [...camp.departementsInconnus].sort(), sha256: camp.sha256, luLe: camp.luLe };

    for (const l of lu.lignes) {
      const annee = Number(l[COLONNES.annee]);
      const numero = Number(l[COLONNES.numero]);
      if (annee !== camp.annee || !Number.isInteger(numero)) throw new Error(`${camp.annee} : fiche ${l[COLONNES.annee]}-${l[COLONNES.numero]} hors campagne`);
      const cle = `${annee}-${numero}`;
      const contenu = JSON.stringify(l);
      const deja = fiches.get(cle);
      if (deja !== undefined) {
        if (deja !== contenu) throw new Error(`fiche ${cle} présente deux fois avec des contenus différents`);
        doublons++;
        continue;
      }
      fiches.set(cle, contenu);
      departementsVus.add(l[COLONNES.departement]!);

      const m2 = Number(l[COLONNES.surface]);
      if (!Number.isFinite(m2) || m2 < 0 || l[COLONNES.surface] === "") throw new Error(`fiche ${cle} : surface illisible « ${l[COLONNES.surface]} »`);
      const code = l[COLONNES.insee]!.trim();
      const actuel = o.resoudre(code);
      if (!actuel) {
        const nr = nonRattachees.get(code) ?? { code, nom: l[COLONNES.nom]!.trim(), feux: 0 };
        nr.feux++;
        nonRattachees.set(code, nr);
        continue;
      }
      const e = parCommune.get(actuel) ?? { nombre: 0, nombre1ha: 0, feux: [] };
      e.nombre++;
      if (m2 >= SEUIL_LISTE_M2) {
        e.nombre1ha++;
        const nom = l[COLONNES.nom]!.trim();
        e.feux.push({
          annee, numero,
          date: l[COLONNES.alerte]!.slice(0, 10),
          hectares: m2 / 10_000,
          mesuree: l[COLONNES.precisionSurfaces] === "Mesurées",
          fichePartielle: l[COLONNES.precisionDonnee]!.trim() !== "",
          ...(actuel !== code && !memeNom(nom, o.nomActuel?.(actuel)) ? { ancienneCommune: nom || code } : {}),
        });
      }
      parCommune.set(actuel, e);
    }
  }

  const communes: Record<string, EntreeIncendies> = {};
  for (const insee of [...parCommune.keys()].sort()) {
    const e = parCommune.get(insee)!;
    communes[insee] = {
      nombre: e.nombre,
      nombre1ha: e.nombre1ha,
      feux: e.feux
        .sort((a, b) => b.hectares - a.hectares || a.annee - b.annee || a.numero - b.numero)
        .slice(0, FEUX_LISTES_MAX),
    };
  }
  return {
    meta: {
      ...o.meta,
      convention: BDIFF_CONVENTION,
      periode: `${annees[0]}-${annees[annees.length - 1]}`,
      campagnes,
      departementsSansFiche: departementsAttendus().filter((d) => !departementsVus.has(d)),
      nonRattachees: [...nonRattachees.values()].sort((a, b) => a.code.localeCompare(b.code)),
      doublonsRetires: doublons,
    },
    communes,
  };
}

/** Les 101 départements (Corse en 2A/2B), outre-mer compris : la BDIFF couvre « Hexagone, Corse et départements d'Outre-Mer ». */
export function departementsAttendus(): string[] {
  const out: string[] = [];
  for (let d = 1; d <= 95; d++) {
    if (d === 20) out.push("2A", "2B");
    else out.push(String(d).padStart(2, "0"));
  }
  return [...out, "971", "972", "973", "974", "976"];
}

/** Le département d'un code commune (`2A004` → `2A`, `97411` → `974`). */
export function departementDe(insee: string): string {
  return insee.startsWith("97") ? insee.slice(0, 3) : insee.slice(0, 2);
}

// ── LA LECTURE POUR UNE COMMUNE ─────────────────────────────────────────────────────────────

/** Le rattachement de la mémoire au lieu demandé. */
export type EchelleIncendies =
  /** La commune elle-même. */
  | { type: "commune" }
  /** Un arrondissement de Paris, Lyon ou Marseille : la source ne connaît que la ville. */
  | { type: "ville"; code: string };

/**
 * TROIS SITUATIONS QUE LE TEXTE NE CONFOND JAMAIS (arbitrage du porteur, 28/10/2026) :
 *   - une campagne que la source DÉCLARE inconnue pour le département (`campagnesNonRenseignees`) ;
 *   - la limite GÉNÉRALE de couverture que le producteur signale avant 2020 hors aire méditerranéenne
 *     (`mediterranee: false`) ;
 *   - un résultat simplement vide (`aucun`), qui ne prouve ni une lacune ni l'absence de feu.
 * Une année sans aucune fiche pour un département (75 départements en ont au moins une) n'est PAS
 * traitée comme une lacune déclarée : la source ne le dit pas.
 */
export type MemoireIncendies =
  /** Au moins un feu dont le départ est enregistré sur la commune. */
  | {
      etat: "recense";
      echelle: EchelleIncendies;
      periode: string;
      mediterranee: boolean;
      entree: EntreeIncendies;
      /** Campagnes que la source signale non renseignées pour le département (le compte peut être incomplet). */
      campagnesNonRenseignees: number[];
    }
  /** Aucune fiche, et toutes les campagnes du département sont renseignées : une absence d'ENREGISTREMENT. */
  | { etat: "aucun"; echelle: EchelleIncendies; periode: string; mediterranee: boolean }
  /** Aucune fiche, et une partie au moins des campagnes du département n'est pas renseignée. */
  | { etat: "incomplet"; echelle: EchelleIncendies; periode: string; mediterranee: boolean; campagnesNonRenseignees: number[]; departementSansFiche: boolean }
  /** La table n'a pas pu être lue. On ne dit rien. */
  | { etat: "indisponible" };

export function memoireIncendiesDeLaCommune(table: TableIncendies | null | undefined, insee: string): MemoireIncendies {
  if (!table) return { etat: "indisponible" };
  const ville = communeParent(insee);
  const echelle: EchelleIncendies = ville !== insee ? { type: "ville", code: ville } : { type: "commune" };
  const dep = departementDe(ville);
  const sansFiche = table.meta.departementsSansFiche.includes(dep);
  const nonRenseignees = Object.entries(table.meta.campagnes)
    .filter(([, c]) => sansFiche || c.departementsInconnus.includes(dep))
    .map(([a]) => Number(a))
    .sort((a, b) => a - b);
  const periode = table.meta.periode;
  const mediterranee = (AIRE_MEDITERRANEENNE as readonly string[]).includes(dep);
  const entree = table.communes[ville];
  if (entree && entree.nombre > 0) return { etat: "recense", echelle, periode, mediterranee, entree, campagnesNonRenseignees: nonRenseignees };
  if (nonRenseignees.length > 0) return { etat: "incomplet", echelle, periode, mediterranee, campagnesNonRenseignees: nonRenseignees, departementSansFiche: sansFiche };
  return { etat: "aucun", echelle, periode, mediterranee };
}

/** L'adresse publique de la fiche d'un feu, pour la preuve. */
export function lienFiche(f: Pick<FeuRecense, "annee" | "numero">): string {
  return `https://bdiff.agriculture.gouv.fr/incendie/${f.annee}/${f.numero}`;
}
