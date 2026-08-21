// ════════════════════════════════════════════════════════════════════════════════════════════
// CE QUE L'ÉCRAN DIT D'UN ÉQUIPEMENT RECENSÉ, ET CE QU'IL SE REFUSE À EN DIRE.
//
// ── LE DÉFAUT QUE CE MODULE FERME (premier test réel, 16/08/2026) ─────────────────────────────
// L'écran affichait « Boulangerie · env. 903 m » et « École primaire · env. 729 m ». Julien, qui
// connaît le lieu, a répondu qu'il n'y avait « pas de boulangerie ni d'école ». Les deux points
// existent bien, et la BPE 2025 les redonne aux mêmes distances. Ce qui manquait n'était pas la
// donnée : c'était de quoi RECONNAÎTRE le lieu compté. Le snapshot ne gardait ni nom, ni adresse,
// ni identifiant, et la BPE porte au 6 Grande Rue DEUX boulangeries, l'ancienne enseigne et la
// nouvelle. Le produit affirmait donc un type et une distance sans preuve reconnaissable, et sans
// savoir laquelle des deux il comptait.
//
// ── CE QUE CE MODULE GARANTIT ────────────────────────────────────────────────────────────────
//  1. Un nom n'est affiché que si UN SEUL établissement est recensé sur le lieu. Sinon, l'adresse
//     et une réserve explicite : le produit ne choisit pas entre deux enseignes concurrentes.
//  2. Le millésime vient de la donnée. Aucune année n'est écrite en dur ici.
//  3. Aucune phrase ne promet l'ouverture, les horaires, la qualité ou l'accessibilité, et la
//     distance est toujours dite à vol d'oiseau.
//
// Pur, testé sous `node --test`.
// ════════════════════════════════════════════════════════════════════════════════════════════

import type { BpeNearestIdentity } from "./logement-autour-types.ts";

// Les petits mots qui restent en minuscule au milieu d'un nom (jamais en tête).
const PETITS_MOTS = new Set([
  "de", "du", "des", "d", "le", "la", "les", "l", "et", "a", "au", "aux", "en", "sur",
  "sous", "par", "pour", "lez", "les-",
]);

// Les sigles qu'une voyelle rend indétectables par la règle ci-dessous. Liste COURTE et assumée :
// elle ne prétend pas couvrir la langue, elle évite les « Chu de Nantes » les plus visibles.
const SIGLES_CONNUS = new Set(["CHU", "CHR", "CHS", "EHPAD", "SNCF", "RATP", "CPAM", "CAF", "CCAS", "SNC"]);

/** Un sigle reste un sigle : pas de voyelle et court (BP, SNCF, CHR), ou connu. */
function estSigle(mot: string): boolean {
  if (mot !== mot.toUpperCase()) return false;
  return SIGLES_CONNUS.has(mot) || (mot.length <= 5 && !/[AEIOUY]/.test(mot));
}

function capitalise(mot: string): string {
  return mot.charAt(0).toUpperCase() + mot.slice(1).toLowerCase();
}

/**
 * La casse lisible d'un libellé BPE, qui arrive TOUT EN CAPITALES.
 *
 * Ne restaure aucun accent absent de la source (« CIRE D AUNIS » reste sans accent) : deviner
 * serait inventer, et le lecteur doit pouvoir retrouver la chaîne d'origine dans le fichier
 * officiel. On ne fait que la casse, et on laisse les sigles tranquilles.
 */
export function libelleBpeLisible(brut: string): string {
  const mots = brut.trim().split(/\s+/);
  return mots
    .map((mot, i) =>
      mot
        // Les séparateurs internes sont conservés : « CIRÉ-D'AUNIS » -> « Ciré-d'Aunis ».
        .split(/([-'’])/)
        .map((part, j) => {
          if (part === "" || /[-'’]/.test(part)) return part;
          const bas = part.toLowerCase();
          const premier = i === 0 && j === 0;
          // Le petit mot passe AVANT le sigle : « D » de « D'AUNIS » n'a pas de voyelle, il
          // ressemble donc à un sigle, et il n'en est pas un.
          if (!premier && PETITS_MOTS.has(bas)) return bas;
          return estSigle(part) ? part : capitalise(part);
        })
        .join(""),
    )
    .join(" ");
}

export type PreuveEquipement = {
  /** Le nom du lieu, ou `null` quand le produit ne peut pas le désigner honnêtement. */
  nom: string | null;
  adresse: string | null;
  /** Ce qui empêche de nommer, dit au lecteur. `null` quand il n'y a rien à réserver. */
  reserve: string | null;
};

/**
 * LA PREUVE AFFICHABLE d'un équipement, à partir de ce que le snapshot a figé.
 *
 * Trois situations, et une seule autorise un nom :
 *  • un exploitant recensé  -> nom + adresse ;
 *  • plusieurs              -> adresse + réserve, JAMAIS un nom tiré au sort ;
 *  • snapshot ancien        -> rien, comme avant (le dossier reste lisible).
 */
export function preuveEquipement(
  identite: BpeNearestIdentity | null | undefined,
  millesime: string | null | undefined,
): PreuveEquipement {
  const adresse = identite?.adresse ? libelleBpeLisible(identite.adresse) : null;
  const plusieurs = typeof identite?.exploitants === "number" && identite.exploitants > 1;
  if (plusieurs) {
    return {
      nom: null,
      adresse,
      // UNE SEULE IDÉE, CELLE QUI COMPTE. Une version plus longue disait aussi le millésime et
      // énumérait les causes possibles (« locaux partagés ou changement d'exploitant ») : le
      // millésime est déjà sur la ligne de source du bloc, et la cause n'aide pas le lecteur, qui
      // doit surtout savoir qu'il ne peut pas se fier au nom. Ce qui reste est le fait et sa limite.
      //
      // « lesquels » et non « lequel » : quatre médecins dans un cabinet partagé exercent tous, une
      // enseigne remplacée par une autre n'en laisse qu'une. La donnée ne distingue pas les deux
      // cas, la phrase ne doit donc pas en supposer un.
      reserve: `${identite!.exploitants} établissements recensés ici : la BPE ne dit pas lesquels sont ouverts.`,
    };
  }
  return { nom: identite?.nom ? libelleBpeLisible(identite.nom) : null, adresse, reserve: null };
}

/**
 * LA LIGNE DE SOURCE DU BLOC, millésime compris.
 *
 * Elle remplace le « Sources : INSEE, BPE 2024 » qui vivait en dur dans le composant : cette
 * année-là ne bougeait que si quelqu'un pensait à éditer le JSX, et elle est restée affichée douze
 * jours après la publication de la BPE 2025.
 */
export function sourceBpe(millesime: string | null | undefined): string {
  return millesime
    ? `Équipements recensés par la BPE ${millesime} (Insee)`
    : "Équipements recensés par la BPE (Insee), millésime non enregistré dans ce dossier";
}

/**
 * CE QUE LE RECENSEMENT NE DIT PAS. Une présence à l'inventaire n'est ni une ouverture, ni un
 * horaire, ni un accès : la distance elle-même est à vol d'oiseau, donc le trajet réel est plus
 * long. Écrit une fois, affiché sous le bloc.
 */
export const LIMITE_BPE =
  "Distances à vol d'oiseau, depuis le point de l'adresse. Une présence à l'inventaire ne dit ni l'ouverture aujourd'hui, ni les horaires, ni l'accès à pied ou en voiture.";
