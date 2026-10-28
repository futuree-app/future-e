// ════════════════════════════════════════════════════════════════════════════════════════════
// LA PART DES LOCAUX RACCORDABLES À LA FIBRE, PAR COMMUNE (ARCEP, FUT-148, 28/10/2026). PUR.
//
// ── CE QUE LA SOURCE DIT, ET SEULEMENT CELA ──────────────────────────────────────────────────
// L'Arcep publie chaque trimestre, pour chaque commune, deux effectifs déclarés par les opérateurs :
//   - `ftth`   les locaux RACCORDABLES : « il existe une continuité optique entre le point de
//              mutualisation et le point de branchement optique » (définition de l'observatoire) ;
//   - `Locaux` la « meilleure estimation » du nombre de locaux de la commune (logements et locaux
//              professionnels) : les fichiers IPE des opérateurs, ou l'Insee quand ils sont moins
//              complets (logements + établissements d'au moins un salarié ; d'où des valeurs non
//              entières, 4 201 communes au T2 2026).
// La part est `ftth / Locaux`. C'est la règle de cartefibre.arcep.fr, et elle se vérifie : la classe
// `couv` que l'Arcep publie à côté concorde avec ce rapport pour les 34 919 lignes du T2 2026, et la
// somme nationale redonne les « 4,7 % de locaux restant à rendre raccordables » de l'observatoire.
//
// ── LES « RACCORDABLES SUR DEMANDE » NE SONT PAS COMPTÉS ─────────────────────────────────────
// Un local RAD est un local « pour lequel la pose du point de branchement optique est différée […],
// subordonnée à une demande effective de raccordement » ; sa mise à disposition « ne devrait pas
// excéder 6 mois » après la commande d'un opérateur. L'observatoire T2 2026 (§ 3.2) les range parmi
// les locaux RESTANT À RENDRE raccordables (0,3 % + 0,1 % en cours). Ils ne sont pas dans `ftth`.
//
// ── CE QUE CE N'EST PAS ──────────────────────────────────────────────────────────────────────
// Ni l'éligibilité d'une adresse (seule la carte de l'Arcep, puis l'opérateur, la disent), ni un
// abonnement, ni une offre commerciale disponible chez tous les opérateurs, ni un débit, ni l'accès à
// Internet : un local non raccordable à la fibre peut être servi par le cuivre, le câble, la 4G ou 5G
// fixe, le satellite. Haucourt-Moulaine (54) : 0 local raccordable FttH, 3 483 habitants, desservie
// par un réseau câblé. Aucun score, palier ni classement du comparateur ne lit cette table.
//
// ── LES ÉTATS D'UNE LECTURE, ET POURQUOI AUCUN NE DEVIENT 0 % ────────────────────────────────
//   `null`         la table n'est pas chargée : on ne sait pas ;
//   « absente »    la commune n'est pas dans le fichier de l'Arcep ;
//   « sans_locaux » l'Arcep ne recense aucun local (Beaumont-en-Verdunois, village détruit en 1916) ;
//   « discordante » les deux publications du même trimestre (fichier par commune et classeur de
//                  l'observatoire) donnent des effectifs qui changent la part affichée : Thumeréville
//                  (54), 472 locaux d'un côté (10 %), 52 de l'autre (94 %). On n'en choisit aucune ;
//   « mesuree »    la part, avec ses effectifs bruts.
//
// Module PUR : aucun réseau, aucun fichier. `scripts/arcep/telecharger.mjs` collecte les fichiers,
// `scripts/arcep/construire.mts` écrit `data/arcep-fibre.json`, le serveur le lit par
// `src/lib/fibre-commune.ts`, les phrases vivent dans `src/lib/fibre-texte.ts`.
// ════════════════════════════════════════════════════════════════════════════════════════════
import { arrondissementsDe } from "../plm.ts";

/** Version de la CONVENTION de la table (définitions, contrôles, états). À relever si elle change. */
export const ARCEP_FIBRE_CONVENTION = "arcep-fibre-1";

/** La carte officielle, où une adresse se vérifie. */
export const CARTE_FIBRE_URL = "https://cartefibre.arcep.fr/";

/** Le jeu de données data.gouv.fr qui porte les fichiers trimestriels. */
export const JEU_ARCEP = "le-marche-du-haut-et-tres-haut-debit-fixe-deploiements";

/** D'où vient le dénominateur d'une commune (colonne « Source retenue » de l'observatoire). */
export type Denominateur = "ipe" | "insee";

/** `[locaux, raccordables, dénominateur]`, tels que la source les publie (locaux non arrondis). */
export type LigneFibre = [number, number, Denominateur];

export type RessourceLue = { titre: string; url: string; sha256: string; octets: number; modifieLe: string | null };

export type MetaFibre = {
  producteur: string;
  jeu: string;
  licence: string;
  /** Le trimestre, tel que l'Arcep le titre (« 2026T2 »). */
  trimestre: string;
  /** La date d'arrêt des données (`AAAA-MM-JJ`). */
  arrete: string;
  /** La source primaire (fichier par commune) et le classeur qui sert au contrôle de concordance. */
  fichierCommune: RessourceLue;
  observatoire: RessourceLue;
  /** Date de lecture des fichiers (`AAAA-MM-JJ`). */
  extraitLe: string;
  convention: string;
  /** Ce que la table couvre, en clair. */
  couverture: string;
  /** La somme nationale des deux effectifs, toutes communes du fichier comprises (outre-mer compris). */
  national: { locaux: number; raccordables: number };
};

export type TableFibre = {
  meta: MetaFibre;
  champs: ["locaux", "raccordables", "denominateur"];
  communes: Record<string, LigneFibre>;
  /** Les communes dont les deux publications se contredisent sur la part affichée. */
  discordantes: Record<string, { fichierCommune: [number, number]; observatoire: [number, number] }>;
};

/** Ce que toute lecture porte : le code lu, le trimestre, la date d'arrêt, la part nationale du même fichier. */
type BaseLecture = { code: string; trimestre: string; arrete: string; partNationale: number | null };

export type LectureFibre =
  | ({ etat: "absente" } & BaseLecture)
  | ({ etat: "sans_locaux" } & BaseLecture)
  | ({ etat: "discordante" } & BaseLecture)
  | ({
      etat: "mesuree";
      locaux: number;
      raccordables: number;
      /** Au moins un dénominateur estimé par l'Insee (pour Paris, Lyon, Marseille : un arrondissement suffit). */
      denominateurInsee: boolean;
      /** Le code est une commune à arrondissements, et la lecture somme ses arrondissements. */
      agrege: boolean;
    } & BaseLecture);

/**
 * LA PART AFFICHÉE, en pour cent entier, à l'arrondi usuel (Job : 22 sur 765,06, soit 2,88 %, s'affiche
 * 3 %), avec deux bornes qui empêchent l'arrondi de mentir : jamais 100 % tant qu'un local n'est pas
 * raccordable (99,6 % s'affiche 99 %), jamais 0 % dès qu'un local l'est (0,4 % s'affiche 1 % ; le texte
 * dit alors « moins de 1 % », cf. `fibre-texte.ts`). `null` sans locaux.
 */
export function partEntiere(locaux: number, raccordables: number): number | null {
  if (!(locaux > 0) || !(raccordables >= 0)) return null;
  if (raccordables >= locaux) return 100;
  if (raccordables === 0) return 0;
  // Le produit d'abord, la division ensuite : 0,29 * 100 vaut 28,999… en flottant.
  return Math.min(99, Math.max(1, Math.round((raccordables * 100) / locaux)));
}

/**
 * LA LECTURE D'UNE COMMUNE. `null` quand la table n'est pas chargée : on ne sait pas, et l'écran le
 * dit, jamais « 0 % ». Paris, Lyon et Marseille n'existent dans la source que par arrondissements : à
 * leur code communal, la lecture SOMME les effectifs (la part d'une somme, pas la moyenne des parts),
 * et refuse de conclure si un seul arrondissement manque ou se contredit.
 */
export function fibreDeLaCommune(table: TableFibre | null | undefined, insee: string): LectureFibre | null {
  if (!table) return null;
  const base: BaseLecture = {
    code: insee, trimestre: table.meta.trimestre, arrete: table.meta.arrete,
    partNationale: partEntiere(table.meta.national.locaux, table.meta.national.raccordables),
  };
  const arrondissements = table.communes[insee] ? [] : arrondissementsDe(insee);
  const codes = arrondissements.length > 0 ? arrondissements : [insee];
  let locaux = 0;
  let raccordables = 0;
  let denominateurInsee = false;
  for (const code of codes) {
    if (Object.hasOwn(table.discordantes, code)) return { etat: "discordante", ...base };
    const ligne = Object.hasOwn(table.communes, code) ? table.communes[code] : undefined;
    if (!ligne) return { etat: "absente", ...base };
    locaux += ligne[0];
    raccordables += ligne[1];
    denominateurInsee ||= ligne[2] === "insee";
  }
  if (!(locaux > 0)) return { etat: "sans_locaux", ...base };
  return { etat: "mesuree", ...base, locaux, raccordables, denominateurInsee, agrege: arrondissements.length > 0 };
}

// ── CONSTRUCTION (appelée par scripts/arcep/construire.mts, testée ici) ────────────────────────

/** Une ligne du fichier par commune (`communes_AAAATn.dbf`), réduite aux colonnes lues. */
export type LigneFichierCommune = { insee: string; locaux: number; ftth: number; couv: number | null };
/** Une ligne des onglets « Communes » et « Arrondissements » du classeur de l'observatoire. */
export type LigneObservatoire = { insee: string; locaux: number; ftth: number; source: string };

/** La classe de cartefibre (onglet « Sommaire » de l'observatoire) que la part doit retrouver. */
export function classeArcep(locaux: number, ftth: number): number | null {
  if (!(locaux > 0)) return null;
  if (ftth <= 0) return 0;
  const p = (ftth * 100) / locaux;
  return p < 10 ? 5 : p < 25 ? 10 : p < 50 ? 25 : p < 80 ? 50 : p < 95 ? 80 : 95;
}

export type RapportConstruction = {
  lignesFichierCommune: number;
  lignesObservatoire: number;
  /** Codes du référentiel futur•e absents de la source : ils seront lus « absente ». */
  referentielAbsents: string[];
  /** Codes de la source hors du référentiel (outre-mer) : gardés, sans usage dans le produit. */
  horsReferentiel: number;
  sansLocaux: string[];
  /** Écarts entre les deux publications qui NE changent PAS la part affichée (gardés, signalés). */
  ecartsSansEffet: { insee: string; fichierCommune: [number, number]; observatoire: [number, number] }[];
  discordantes: string[];
  /** Lignes dont la classe `couv` publiée contredit `ftth / Locaux`. Attendu : aucune. */
  classesContredites: string[];
  denominateursInsee: number;
};

/**
 * ASSEMBLE LA TABLE et la contrôle. Lève sur ce qui rendrait la table fausse en silence : un code en
 * double, un effectif négatif ou non numérique, des raccordables au-delà des locaux, une classe publiée
 * qui contredit le rapport. Le reste (communes absentes, écarts entre publications) est porté par la
 * table et rendu dans le rapport.
 */
export function construireTableFibre(
  fichierCommune: LigneFichierCommune[],
  observatoire: LigneObservatoire[],
  referentiel: Iterable<string>,
  meta: Omit<MetaFibre, "national" | "convention">,
): { table: TableFibre; rapport: RapportConstruction } {
  const obs = new Map<string, LigneObservatoire>();
  for (const l of observatoire) obs.set(l.insee, l);
  const communes: Record<string, LigneFibre> = {};
  const discordantes: TableFibre["discordantes"] = {};
  const rapport: RapportConstruction = {
    lignesFichierCommune: fichierCommune.length, lignesObservatoire: observatoire.length,
    referentielAbsents: [], horsReferentiel: 0, sansLocaux: [], ecartsSansEffet: [], discordantes: [],
    classesContredites: [], denominateursInsee: 0,
  };
  let natLocaux = 0;
  let natRacc = 0;
  const vus = new Set<string>();
  for (const l of [...fichierCommune].sort((a, b) => a.insee.localeCompare(b.insee))) {
    if (!/^(\d{5}|2[AB]\d{3})$/.test(l.insee)) throw new Error(`code commune illisible : « ${l.insee} »`);
    if (vus.has(l.insee)) throw new Error(`code en double dans le fichier par commune : ${l.insee}`);
    vus.add(l.insee);
    if (!Number.isFinite(l.locaux) || !Number.isFinite(l.ftth) || l.locaux < 0 || l.ftth < 0) {
      throw new Error(`effectifs invalides pour ${l.insee} : locaux=${l.locaux}, ftth=${l.ftth}`);
    }
    if (l.ftth > l.locaux) throw new Error(`plus de raccordables que de locaux pour ${l.insee} : ${l.ftth} > ${l.locaux}`);
    if (l.couv != null && classeArcep(l.locaux, l.ftth) != null && classeArcep(l.locaux, l.ftth) !== l.couv) {
      rapport.classesContredites.push(l.insee);
    }
    natLocaux += l.locaux;
    natRacc += l.ftth;
    const o = obs.get(l.insee);
    const denominateur: Denominateur = o?.source.trim().toUpperCase() === "INSEE" ? "insee" : "ipe";
    if (o && (Math.abs(o.locaux - l.locaux) > 0.5 || o.ftth !== l.ftth)) {
      const ecart = { fichierCommune: [l.locaux, l.ftth] as [number, number], observatoire: [o.locaux, o.ftth] as [number, number] };
      if (partEntiere(l.locaux, l.ftth) !== partEntiere(o.locaux, o.ftth)) {
        discordantes[l.insee] = ecart;
        rapport.discordantes.push(l.insee);
        continue;
      }
      rapport.ecartsSansEffet.push({ insee: l.insee, ...ecart });
    }
    if (!(l.locaux > 0)) rapport.sansLocaux.push(l.insee);
    if (denominateur === "insee") rapport.denominateursInsee += 1;
    // Quatre décimales suffisent à une estimation Insee (1577,2693) et retirent le bruit flottant du DBF.
    communes[l.insee] = [Math.round(l.locaux * 1e4) / 1e4, l.ftth, denominateur];
  }
  if (rapport.classesContredites.length > 0) {
    throw new Error(`classe publiée contredite par ftth/Locaux : ${rapport.classesContredites.slice(0, 10).join(", ")}`);
  }
  const ref = new Set(referentiel);
  rapport.referentielAbsents = [...ref].filter((c) => !vus.has(c)).sort();
  rapport.horsReferentiel = [...vus].filter((c) => !ref.has(c)).length;
  return {
    table: {
      meta: { ...meta, convention: ARCEP_FIBRE_CONVENTION, national: { locaux: Math.round(natLocaux), raccordables: Math.round(natRacc) } },
      champs: ["locaux", "raccordables", "denominateur"],
      communes,
      discordantes,
    },
    rapport,
  };
}

/**
 * LECTEUR dBase III MINIMAL, pour les seules colonnes texte et numériques du fichier de l'Arcep. Les
 * enregistrements marqués supprimés (`*`) sont ignorés. Les noms de champs sont lus en latin-1 (le
 * `.cpg` annonce UTF-8, mais le champ « ZMD_privé » est encodé en latin-1) ; les valeurs lues ici sont
 * des codes et des nombres, que l'encodage ne touche pas.
 */
export function lireDbf(buf: Uint8Array): Record<string, string>[] {
  const vue = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const n = vue.getUint32(4, true);
  const entete = vue.getUint16(8, true);
  const longueur = vue.getUint16(10, true);
  const latin1 = new TextDecoder("latin1");
  const champs: { nom: string; long: number }[] = [];
  for (let o = 32; buf[o] !== 0x0d; o += 32) {
    champs.push({ nom: latin1.decode(buf.subarray(o, o + 11)).replace(/\0[\s\S]*$/, ""), long: buf[o + 16]! });
  }
  const lignes: Record<string, string>[] = [];
  for (let i = 0; i < n; i++) {
    let pos = entete + i * longueur;
    if (buf[pos] === 0x2a) continue; // enregistrement supprimé
    pos += 1;
    const l: Record<string, string> = {};
    for (const c of champs) {
      l[c.nom] = latin1.decode(buf.subarray(pos, pos + c.long)).trim();
      pos += c.long;
    }
    lignes.push(l);
  }
  return lignes;
}
