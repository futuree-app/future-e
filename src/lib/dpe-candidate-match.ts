// ════════════════════════════════════════════════════════════════════════════════════════════
// RECONNAÎTRE SON LOGEMENT PARMI LES DIAGNOSTICS D'UNE ADRESSE.
//
// CE QUE LA BASE PORTE VRAIMENT, mesuré le 31/07/2026 sur six immeubles (La Rochelle, Toulouse,
// Lille, Strasbourg, Caen, Lyon) :
//
//   - `numero_etage_appartement` est du BRUIT. Il vaut « 0 » dans l'écrasante majorité des cas,
//     et ce zéro est une valeur par défaut de saisie, pas un rez-de-chaussée. Utile dans 4 % des
//     lignes au Capitole, 10 % rue Saint-Dominique. Il était pourtant affiché, donc le sélecteur
//     montrait « · 0 » sur des lignes qui ne disaient rien.
//   - `complement_adresse_logement` est LE discriminant, présent dans 57 à 87 % des lignes des
//     gros immeubles, et presque toujours distinct. C'est là que vivent « C04 », « A13 »,
//     « Escalier D -1er étage Appartement B09 », « Esc. A ; Etage 2 ; Porte C02 ». Du texte
//     libre, saisi par le diagnostiqueur, jamais normalisé.
//   - `surface_habitable_logement` est presque toujours renseignée (24/24 au Capitole), et c'est
//     une chose que l'habitant CONNAÎT.
//
// D'où les deux gestes que ce module rend possibles : filtrer sur ce que la personne sait (un
// identifiant de porte, une surface, une année, ou le numéro du diagnostic), et voir d'un coup
// d'œil quelles lignes ne portent aucun identifiant, donc lesquelles ne pourront jamais être
// reconnues.
//
// Pur, testé sous `node --test`.
// ════════════════════════════════════════════════════════════════════════════════════════════

import type { DpeRecord } from "./dpe-attribution.ts";

/**
 * LE TEXTE D'UN CHAMP QUI PEUT ARRIVER EN NOMBRE.
 *
 * L'API ADEME rend `numero_etage_appartement` en NOMBRE, alors que le type le déclarait en texte,
 * et des snapshots de DPE figés en base portent déjà cette valeur numérique : ils ne repasseront
 * jamais par la frontière de l'API, donc normaliser à l'entrée n'aurait rien réparé pour eux. Le
 * sélecteur tombait ici même, en `(raw ?? "").trim is not a function`, et le module Logement
 * entier devenait illisible pour l'adresse concernée.
 */
function asText(raw: string | number | null | undefined): string {
  return raw == null ? "" : String(raw).trim();
}

/**
 * L'étage, quand il veut dire quelque chose.
 *
 * « 0 » est rejeté : c'est le défaut du formulaire de saisie, et l'afficher ferait passer une
 * absence de renseignement pour un rez-de-chaussée. Le zéro NUMÉRIQUE est le même défaut de
 * saisie ; il ne devient pas un rez-de-chaussée en changeant de type.
 */
export function meaningfulFloor(raw: string | number | null | undefined): string | null {
  const s = asText(raw);
  if (!s || s === "0") return null;
  return s;
}

/** L'identifiant de logement saisi par le diagnostiqueur, nettoyé de ses espaces multiples. */
export function candidateIdentifier(c: DpeRecord): string | null {
  const s = asText(c.complement).replace(/\s+/g, " ");
  return s.length > 0 ? s : null;
}

/** Une ligne ne portant NI identifiant NI étage exploitable ne peut pas être reconnue. */
export function isUnidentifiable(c: DpeRecord): boolean {
  return candidateIdentifier(c) === null && meaningfulFloor(c.etage) === null;
}

/** Insensible à la casse, aux accents et aux espaces : « esc. a » trouve « Esc. A ». */
function fold(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // diacritiques combinants, en ÉCHAPPEMENTS : tapés, ils sont invisibles
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * La ligne correspond-elle à ce que la personne a tapé ?
 *
 * Cherche dans TOUT ce qui peut l'identifier : l'identifiant de logement, l'étage, la surface,
 * l'année du diagnostic et le numéro du diagnostic. Un seul champ de saisie, parce que le lecteur
 * ne sait pas d'avance dans laquelle de ces cases se trouve ce qu'il connaît.
 *
 * LE NUMÉRO À TREIZE CARACTÈRES est le cas le plus fort : c'est celui que la checklist demande de
 * réclamer au vendeur, et le coller ici doit réduire la liste à une seule ligne.
 *
 * LIMITE CONNUE : la recherche porte sur les diagnostics DE CETTE ADRESSE. Un numéro valide dont
 * l'identifiant BAN pointe sur une adresse voisine ne sera pas trouvé ici. C'est délibéré : aller
 * le chercher ailleurs reviendrait à rattacher au dossier un diagnostic dont rien ne prouve qu'il
 * porte sur ce bien.
 */
export function matchesQuery(c: DpeRecord, query: string): boolean {
  const q = fold(query);
  if (!q) return true;

  const haystack: string[] = [];
  const ident = candidateIdentifier(c);
  if (ident) haystack.push(fold(ident));
  const floor = meaningfulFloor(c.etage);
  if (floor) haystack.push(fold(floor));
  if (c.surface_m2 != null) {
    // La surface se cherche aussi bien en « 43 » qu'en « 43,2 » ou « 43.2 ».
    haystack.push(String(c.surface_m2), String(c.surface_m2).replace(".", ","));
  }
  if (c.date_dpe) haystack.push(c.date_dpe.slice(0, 4));
  haystack.push(fold(c.id_dpe));

  return haystack.some((h) => h.includes(q));
}

/**
 * L'ordre de lecture : les lignes IDENTIFIABLES d'abord, puis par surface croissante.
 *
 * Une personne qui cherche son logement le cherche par ce qui l'identifie ; les lignes muettes ne
 * lui serviront jamais et n'ont pas à occuper le haut de la liste. À identifiabilité égale, la
 * surface est le repère le plus sûr, et un ordre croissant se parcourt.
 *
 * L'ordre chronologique de la base ne veut rien dire pour le lecteur : c'est l'ordre dans lequel
 * les diagnostiqueurs sont passés.
 */
export function sortCandidates(candidates: DpeRecord[]): DpeRecord[] {
  return [...candidates].sort((a, b) => {
    const ia = isUnidentifiable(a) ? 1 : 0;
    const ib = isUnidentifiable(b) ? 1 : 0;
    if (ia !== ib) return ia - ib;
    const sa = a.surface_m2 ?? Number.POSITIVE_INFINITY;
    const sb = b.surface_m2 ?? Number.POSITIVE_INFINITY;
    return sa - sb;
  });
}
