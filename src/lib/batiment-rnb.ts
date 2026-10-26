// ════════════════════════════════════════════════════════════════════════════════════════════
// LE BÂTIMENT DE L'ADRESSE, SELON LE RÉFÉRENTIEL NATIONAL DES BÂTIMENTS (FUT-80, 26/10/2026).
//
// ── CE QUE LE RNB DIT, ET CE QU'IL NE DIT PAS ────────────────────────────────────────────────
// Le RNB publie, pour une adresse BAN (`cle_interop_ban`), le ou les bâtiments auxquels il la
// rattache, chacun avec un identifiant stable (ID-RNB) et ses autres adresses. Mesuré le 26/10/2026
// sur 800 adresses tirées uniformément dans la BAN (`docs/audits/2026-10-26-fut80-rnb-bdnb.md`) :
// un bâtiment pour 66,6 %, plusieurs pour 22,3 % (29,5 % en rural), aucun pour 11,1 %. Plusieurs
// bâtiments ne veut pas dire « une maison et ses annexes » : seules 49 des 178 adresses concernées
// montrent un grand bâtiment et de petits, et 55 en portent deux d'usage résidentiel.
//
// Il dit QUEL BÂTIMENT. Il ne dit rien du logement : un immeuble porte des dizaines d'appartements,
// et le référentiel compte parfois deux maisons mitoyennes comme un seul bâtiment. Rien, dans ce
// fichier, n'accorde à un diagnostic une certitude supplémentaire parce qu'un bâtiment est trouvé.
//
// ── LES ÉTATS, ET POURQUOI « CONFIRMÉ » ICI ──────────────────────────────────────────────────
//   - `confirme`    : le référentiel rattache l'adresse à UN seul bâtiment existant ;
//   - `ambigu`      : il la rattache à plusieurs ; aucun n'est choisi à la place du lecteur ;
//   - `non_trouve`  : le référentiel a répondu, sans bâtiment pour cette adresse ;
//   - `indisponible`: il n'a pas répondu, ce qui ne prouve rien.
// « Confirmé » qualifie le rattachement PUBLIÉ PAR LE RÉFÉRENTIEL, pas une vérification de
// futur•e. L'état « candidat à confirmer » existe, mais au grain du DIAGNOSTIC : un DPE du même
// bâtiment enregistré à une autre adresse (cf. `dpe-rapprochement.ts`, niveau `meme_batiment`).
//
// ── CE QUI N'EST PAS GARDÉ ───────────────────────────────────────────────────────────────────
// Ni l'empreinte, ni le point : la mesure a montré que le point d'un DPE EST celui de son adresse
// BAN, souvent sur la rue, à 47 m d'une résidence en retrait. Le test « point dans l'empreinte »
// proposé le 30/07 n'apporte donc aucune preuve indépendante, et l'empreinte alourdirait chaque
// version du rapport sans servir à rien d'affiché.
//
// Pur, sans `server-only` : lu côté client par le module Logement, testé sous `node --test`.
// ════════════════════════════════════════════════════════════════════════════════════════════

export type AdresseRnb = {
  /** Clé d'interopérabilité BAN (`44109_7500_00007`). */
  cle: string;
  /** « 7 Place Royale, Nantes » : de quoi la reconnaître, sans code postal. */
  libelle: string;
};

export type BatimentRnb = {
  rnb_id: string;
  adresses: AdresseRnb[];
  /**
   * Revue indépendante du 26/10/2026 : posé SEULEMENT pour un bâtiment que le référentiel dit « en ruine »
   * (`notUsable`, lexique RNB). Il existe, il est bien celui de l'adresse, mais le passeport ne peut pas
   * le présenter comme un bâtiment ordinaire, ni l'attribution automatique s'y fier. Absent sinon : un
   * bâtiment `constructed` garde exactement la forme d'avant.
   */
  etat?: "notUsable";
};

export type IdentiteBatiment =
  | { statut: "confirme"; batiment: BatimentRnb; consulteLe: string }
  | { statut: "ambigu"; batiments: BatimentRnb[]; consulteLe: string }
  | { statut: "non_trouve"; consulteLe: string }
  /**
   * Le référentiel rattache l'adresse à des bâtiments, mais AUCUN d'eux n'est un bâtiment existant :
   * démoli, identifiant désactivé, projet. Ce n'est pas une absence : un diagnostic peut désigner l'un
   * d'eux, et l'adresse a bien un passé bâti. Distinct de `non_trouve` pour que ce veto ne se perde pas.
   */
  | { statut: "exclu"; exclus: string[]; consulteLe: string }
  /**
   * Il n'a pas répondu, ou sa réponse n'est pas vérifiable : illisible, élément mal formé, statut
   * inconnu, page incomplète (`next`). Rien n'en est conclu, ni absence, ni unicité.
   */
  | { statut: "indisponible" };

/**
 * LES STATUTS DU RÉFÉRENTIEL, ET CE QU'ON EN FAIT (lexique RNB, relu le 26/10/2026 : `constructed`,
 * `notUsable`, `demolished` ; les anciens états de projet restent possibles dans les données).
 *   - existant ordinaire : `constructed`, `ongoingChange` (en travaux, toujours debout) ;
 *   - existant « en ruine » : `notUsable`, gardé, signalé, jamais attribué automatiquement ;
 *   - exclu : `demolished`, `constructionProject`, `canceledConstructionProject`, et tout identifiant
 *     désactivé (`is_active: false`, créé par erreur ou fusionné).
 * Un statut hors de ces listes rend la réponse NON VÉRIFIABLE : le référentiel aurait changé de
 * vocabulaire, et deviner serait affirmer.
 */
const EXISTANTS = new Set(["constructed", "ongoingChange"]);
const EN_RUINE = "notUsable";
const EXCLUS = new Set(["demolished", "constructionProject", "canceledConstructionProject"]);
const ID_RNB = /^[0-9A-Z]{12}$/;

type RnbAdresseBrute = {
  id?: unknown; street_number?: unknown; street_rep?: unknown; street?: unknown; city_name?: unknown;
};
type RnbBatimentBrut = { rnb_id?: unknown; status?: unknown; is_active?: unknown; addresses?: unknown };

function texte(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

function adresse(a: RnbAdresseBrute): AdresseRnb | null {
  const cle = texte(a.id);
  if (!cle) return null;
  const numero = [texte(a.street_number), texte(a.street_rep)].filter(Boolean).join(" ");
  const voie = [numero, texte(a.street)].filter(Boolean).join(" ");
  const ville = texte(a.city_name);
  return { cle, libelle: [voie || cle, ville].filter(Boolean).join(", ") };
}

/**
 * La réponse de `GET /api/alpha/buildings/?cle_interop_ban=…`, lue. Une réponse illisible n'est pas
 * une absence : elle rend `indisponible`, jamais `non_trouve`.
 *
 * TOUT ÉLÉMENT DOIT ÊTRE LISIBLE, ET LA PAGE COMPLÈTE (revue indépendante du 26/10/2026). Un élément sans
 * identifiant RNB bien formé, sans `is_active` booléen ou d'un statut inconnu rend toute la réponse non
 * vérifiable : l'écarter en silence pouvait faire d'une adresse à deux bâtiments une adresse à un seul.
 * Un `next` non nul dit qu'une autre page existe : une première page à un bâtiment ne prouve pas
 * l'unicité. `rnb.ts` suit les pages et ne passe ici qu'une réponse complète.
 */
export function identiteDepuisRnb(corps: unknown, consulteLe: string): IdentiteBatiment {
  const c = corps as { results?: unknown; next?: unknown } | null;
  const resultats = c?.results;
  if (!Array.isArray(resultats)) return { statut: "indisponible" };
  if (c?.next != null) return { statut: "indisponible" };
  const batiments: BatimentRnb[] = [];
  const exclus: string[] = [];
  for (const brut of resultats as RnbBatimentBrut[]) {
    if (!brut || typeof brut !== "object") return { statut: "indisponible" };
    const id = texte(brut.rnb_id);
    const statut = texte(brut.status);
    if (!id || !ID_RNB.test(id) || typeof brut.is_active !== "boolean" || !statut) return { statut: "indisponible" };
    const connu = EXISTANTS.has(statut) || statut === EN_RUINE || EXCLUS.has(statut);
    if (!connu) return { statut: "indisponible" };
    if (!brut.is_active || EXCLUS.has(statut)) {
      if (!exclus.includes(id)) exclus.push(id);
      continue;
    }
    const adresses = Array.isArray(brut.addresses)
      ? (brut.addresses as RnbAdresseBrute[]).map(adresse).filter((a): a is AdresseRnb => a != null)
      : [];
    if (!batiments.some((b) => b.rnb_id === id)) {
      batiments.push({ rnb_id: id, adresses, ...(statut === EN_RUINE ? { etat: EN_RUINE } : {}) });
    }
  }
  if (batiments.length === 0) {
    return exclus.length > 0 ? { statut: "exclu", exclus, consulteLe } : { statut: "non_trouve", consulteLe };
  }
  if (batiments.length === 1) return { statut: "confirme", batiment: batiments[0], consulteLe };
  return { statut: "ambigu", batiments, consulteLe };
}

/** Les identifiants des bâtiments EXISTANTS de l'adresse, quel que soit leur nombre. Vide sinon. */
export function idsDesBatiments(identite: IdentiteBatiment | null | undefined): string[] {
  if (identite?.statut === "confirme") return [identite.batiment.rnb_id];
  if (identite?.statut === "ambigu") return identite.batiments.map((b) => b.rnb_id);
  return [];
}

/**
 * LE BÂTIMENT INTERDIT-IL L'ATTRIBUTION AUTOMATIQUE ? `null` : il ne s'y oppose pas.
 *
 * Revue indépendante du 26/10/2026. La règle ne recevait qu'une LISTE d'identifiants : trois bâtiments à
 * l'adresse (La Rochelle, 27 rue des Brandes) et un diagnostic sans `id_rnb` passaient, alors que le
 * passeport disait au même moment « 3 bâtiments rattachés à cette adresse ». Une adresse BAN précise ne
 * désigne pas un bâtiment quand le référentiel en compte plusieurs : laquelle des maisons est celle du
 * diagnostic, rien ne le dit.
 *
 *   - `undefined` : rapport antérieur à FUT-80, côté écran seulement. Le serveur, lui, relit toujours le
 *     référentiel avant d'enregistrer : il ne reçoit jamais `undefined`.
 *   - `non_trouve` : le référentiel a répondu sans bâtiment (11 % des adresses). Rien ne contredit,
 *     règle d'avant FUT-80.
 *   - tout le reste demande le lecteur : référentiel muet ou réponse non vérifiable (une panne ne prouve
 *     pas l'absence de contradiction), plusieurs bâtiments, aucun bâtiment existant, bâtiment en ruine,
 *     diagnostic qui désigne un autre bâtiment.
 */
export type VetoBatiment = "indisponible" | "ambigu" | "exclu" | "en_ruine" | "contredit";

export function vetoBatiment(
  dpe: { id_rnb?: string | null },
  identite: IdentiteBatiment | null | undefined,
): VetoBatiment | null {
  if (identite === undefined || identite === null) return null;
  switch (identite.statut) {
    case "indisponible": return "indisponible";
    case "ambigu": return "ambigu";
    case "exclu": return "exclu";
    case "non_trouve": return null;
    case "confirme":
      if (identite.batiment.etat === EN_RUINE) return "en_ruine";
      return contreditParLeBatiment(dpe, [identite.batiment.rnb_id]) ? "contredit" : null;
  }
}

/** Les AUTRES adresses du bâtiment, celle du dossier exclue. Seulement pour un bâtiment unique. */
export function autresAdresses(identite: IdentiteBatiment | null | undefined, banId: string | null | undefined): AdresseRnb[] {
  if (identite?.statut !== "confirme") return [];
  return identite.batiment.adresses.filter((a) => a.cle !== banId);
}

/** `74SQZQX5GJQ2` → `74SQ-ZQX5-GJQ2`, la forme que le RNB affiche et qu'on recopie sans erreur. */
export function formatRnbId(id: string): string {
  return /^[0-9A-Z]{12}$/.test(id) ? `${id.slice(0, 4)}-${id.slice(4, 8)}-${id.slice(8)}` : id;
}

/** Le bâtiment sur la carte du RNB : son empreinte et ses adresses, vérifiables par le lecteur. */
export function lienCarteRnb(id: string): string {
  return `https://rnb.beta.gouv.fr/carte?q=${encodeURIComponent(id)}`;
}

/**
 * LE DIAGNOSTIC DÉSIGNE-T-IL UN AUTRE BÂTIMENT QUE CEUX DE SON ADRESSE ?
 *
 * Toutes provenances. « Logiciel » : le diagnostiqueur a saisi lui-même l'identifiant, et il contredit
 * l'adresse dans 28 des 200 DPE tirés le 26/10/2026 (bâtiment voisin, autre bâtiment d'une résidence).
 * « Reprise RNB » : dérivé de l'adresse à la date de la reprise, il ne contredit presque jamais (1 sur
 * 200) ; quand il le fait, c'est que le référentiel a changé depuis (Monchaux-sur-Écaillon : bâtiment à
 * 78 m). Dans les deux cas, l'adresse et l'identifiant ne disent plus la même chose, et rien ne dit
 * lequel se trompe. Un identifiant devenu inactif par fusion se lit ici comme « autre » : l'erreur va
 * dans le sens prudent, une attribution automatique de moins.
 *
 * Sans bâtiment connu pour l'adresse (référentiel muet, aucun bâtiment, rapport antérieur), on ne sait
 * pas : rien n'est contredit.
 */
export function contreditParLeBatiment(
  dpe: { id_rnb?: string | null },
  batiments: readonly string[] | null | undefined,
): boolean {
  if (!dpe.id_rnb || !batiments || batiments.length === 0) return false;
  return !batiments.includes(dpe.id_rnb);
}

/** Ce que la ligne d'un diagnostic contredit en dit, selon QUI a posé l'identifiant. */
export function mentionContradiction(dpe: { provenance_id_rnb?: string | null }): string {
  return dpe.provenance_id_rnb === "Logiciel"
    ? "rattaché par son diagnostiqueur à un autre bâtiment"
    : "rattaché par la base ADEME à un autre bâtiment";
}

/**
 * La partie « voie » d'un libellé ADEME (`7 Place Royale 44000 Nantes` → `7 Place Royale`), pour dire
 * où un diagnostic est enregistré sans répéter la commune du dossier.
 */
export function voieDuLibelle(libelle: string | null | undefined): string | null {
  if (!libelle) return null;
  const voie = libelle.split(/\s\d{5}\b/)[0].trim();
  return voie || null;
}

/**
 * FAUT-IL DIRE, SUR CHAQUE LIGNE, OÙ LE DIAGNOSTIC EST ENREGISTRÉ ?
 *
 * Même règle que les champs du sélecteur (`champsVariables`) : ne montrer que ce qui distingue. Quand le
 * bâtiment n'a qu'une autre adresse et que tous les diagnostics y sont, l'introduction du bloc la nomme
 * déjà ; la répéter sur dix-huit lignes (Villeurbanne, 26/10/2026) n'aide à en reconnaître aucune.
 * Dès que deux adresses sont possibles, chaque ligne dit la sienne.
 */
export function adresseParLigne(candidats: Array<{ id_ban: string | null }>, autres: AdresseRnb[]): boolean {
  const adresses = new Set(candidats.map((c) => c.id_ban ?? ""));
  return !(autres.length === 1 && adresses.size === 1 && adresses.has(autres[0].cle));
}

// ── LES PHRASES ──────────────────────────────────────────────────────────────────────────────
// Les petits mots sont liés au suivant par une espace insécable (U+00A0) dans les phrases qui
// portent la prudence : sur un téléphone, « à » ou « de » seul en fin de ligne casse la lecture.

const NB = " ";

/** « 7 Place Royale », « 7 Place Royale et 9 Place Royale », « …, et 3 autres adresses ». */
export function listeAdresses(adresses: AdresseRnb[], max = 3): string {
  const noms = adresses.map((a) => a.libelle.split(",")[0]);
  if (noms.length <= max) {
    return noms.length <= 1 ? (noms[0] ?? "") : `${noms.slice(0, -1).join(", ")} et${NB}${noms[noms.length - 1]}`;
  }
  const reste = noms.length - max;
  return `${noms.slice(0, max).join(", ")} et${NB}${reste}${NB}autre${reste > 1 ? "s" : ""} adresse${reste > 1 ? "s" : ""}`;
}

export const PHRASES_MEME_BATIMENT = {
  titre(n: number): string {
    return n === 1
      ? `Un diagnostic de logement est enregistré à${NB}une autre adresse du${NB}même bâtiment.`
      : `${n}${NB}diagnostics de logement sont enregistrés à${NB}d'autres adresses du${NB}même bâtiment.`;
  },
  /** De quel bâtiment on parle, et d'où vient le rattachement. */
  batiment(autres: AdresseRnb[]): string {
    return autres.length > 0
      ? `Le Référentiel national des bâtiments rattache cette adresse à${NB}un bâtiment qui porte aussi ${listeAdresses(autres)}.`
      : `Le Référentiel national des bâtiments rattache cette adresse et${NB}ces diagnostics au${NB}même bâtiment.`;
  },
  /** La prudence, avant le geste. */
  prudence:
    `Ils ne sont pas enregistrés à${NB}cette adresse. L'un d'eux peut être celui de${NB}ce logement si le diagnostiqueur a saisi une autre entrée ; ils peuvent aussi être ceux de${NB}voisins, ou d'une maison mitoyenne que le référentiel compte dans le${NB}même bâtiment. N'en retenez un que si vous le reconnaissez.`,
  bouton(n: number): string {
    return n === 1 ? "Voir ce diagnostic" : "Voir ces diagnostics";
  },
  tronque: "La base en compte davantage : seuls les plus récents sont montrés.",
  indisponible:
    "Les diagnostics enregistrés aux autres adresses de ce bâtiment n'ont pas pu être vérifiés lors de cette collecte.",
} as const;

/** Ce que le passeport du logement dit du bâtiment. `null` : il n'en dit rien. */
export function ligneBatimentPasseport(
  identite: IdentiteBatiment | null | undefined,
  banId: string | null | undefined,
): { valeur: string; lien: string | null; complement: string | null } | null {
  if (identite?.statut === "confirme") {
    const autres = autresAdresses(identite, banId);
    const aussi = autres.length > 0 ? `Il porte aussi ${listeAdresses(autres, 2)}.` : null;
    // « En ruine » (`notUsable`) : le dire, et avant le reste. Une ligne ordinaire laissait croire à un
    // bâtiment en état d'être habité.
    const ruine = identite.batiment.etat === EN_RUINE
      ? `Le référentiel le signale en${NB}mauvais état ou en${NB}ruine.`
      : null;
    return {
      valeur: formatRnbId(identite.batiment.rnb_id),
      lien: lienCarteRnb(identite.batiment.rnb_id),
      complement: [ruine, aussi].filter(Boolean).join(" ") || null,
    };
  }
  if (identite?.statut === "exclu") {
    return {
      valeur: `Aucun bâtiment existant rattaché à${NB}cette adresse`,
      lien: null,
      complement: "Le référentiel n'y rattache qu'un bâtiment démoli ou un identifiant retiré.",
    };
  }
  if (identite?.statut === "ambigu") {
    return {
      valeur: `${identite.batiments.length} bâtiments rattachés à${NB}cette adresse`,
      lien: null,
      complement: "Le référentiel ne dit pas lequel abrite le logement.",
    };
  }
  return null;
}
