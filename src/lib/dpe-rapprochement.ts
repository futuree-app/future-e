import { communeParent } from "./plm.ts";

// ════════════════════════════════════════════════════════════════════════════════════════════
// UN DIAGNOSTIC APPORTÉ PAR SON NUMÉRO PORTE-T-IL SUR CE LOGEMENT ?
//
// ── D'OÙ VIENT LA PREUVE, ICI ────────────────────────────────────────────────────────────────
// Le produit refuse depuis toujours d'attribuer un diagnostic par proximité géographique, et il a
// raison : mesuré sur 65 adresses le 31/07/2026, un diagnostic à 50 m était 57 fois celui d'un
// voisin et ZÉRO fois le même logement sous un autre identifiant (cf. l'avertissement en tête de
// `getDpeByCoordinates`). Là-bas, rien n'est apporté par personne, et la géographie devrait porter
// seule une preuve d'identité qu'elle ne peut pas porter.
//
// Ici, la situation est différente en nature. Quelqu'un lit un numéro à treize caractères sur SON
// document. La preuve est ce document. Le rapprochement d'adresse ne sert qu'à intercepter l'erreur
// grossière : un chiffre mal recopié, un numéro pris ailleurs.
//
// ── POURQUOI « MÊME COMMUNE » NE SUFFIT PAS ──────────────────────────────────────────────────
// Deux logements d'une même commune peuvent être à plusieurs kilomètres. Une confirmation humaine
// affichée après coup ne transforme pas cette correspondance faible en identité : elle demanderait
// au lecteur de valider ce qu'on n'a pas vérifié. La commune seule est donc REFUSÉE, en montrant
// l'adresse trouvée pour que la personne voie elle-même l'écart et corrige son numéro.
//
// Pur, sans réseau, testé sous `node --test`.
// ════════════════════════════════════════════════════════════════════════════════════════════

export type NiveauRapprochement =
  /** Même identifiant BAN : le diagnostic est rattaché à l'adresse du dossier. */
  | "adresse"
  /** Identifiant BAN différent, même numéro et même voie : le géocodage du diagnostiqueur a
   *  désigné une entrée voisine du même bâtiment, cas ordinaire et non l'exception. */
  | "batiment"
  /** Même commune, autre adresse. Refusé. */
  | "commune"
  /** Autre commune. Refusé. */
  | "ailleurs"
  /** Le diagnostic ne porte pas d'identifiant BAN exploitable : rien à comparer. Refusé. */
  | "inconnu";

export type Rapprochement = {
  niveau: NiveauRapprochement;
  /** Le rattachement est-il possible ? Vrai pour `adresse` et `batiment` seulement. */
  attachable: boolean;
  /** Le lecteur doit-il confirmer explicitement avant rattachement ? */
  confirmationRequise: boolean;
};

/**
 * LE NUMÉRO TEL QUE LA PERSONNE LE TAPE, ramené à une forme cherchable.
 *
 * Elle le recopie d'un document papier ou d'un PDF : elle y met des espaces, colle un retour à la
 * ligne, tape en minuscules. Refuser sa saisie pour cette raison serait lui reprocher la mise en
 * page de son diagnostic.
 *
 * CETTE FONCTION NE DIT RIEN DE LA VALIDITÉ DU DIAGNOSTIC, et elle a failli le prétendre. Une
 * première version rendait un booléen « forme moderne » fondé sur les treize caractères des
 * diagnostics postérieurs à juillet 2021. Vérification faite sur la base réelle le 20/08/2026 :
 * `1374V1000001B`, tiré du jeu d'avant juillet 2021, fait treize caractères lui aussi. La forme du
 * numéro ne sépare pas un diagnostic en cours de validité d'un diagnostic expiré ; seul le JEU où
 * on le retrouve le dit, et c'est `findDpeByNumero` qui tranche.
 *
 * Ne reste donc ici qu'une question de forme, posée pour éviter un appel réseau sur une saisie qui
 * n'a pas la taille d'un numéro.
 */
export function normaliserNumeroDpe(saisie: string): string | null {
  const nu = saisie.toUpperCase().replace(/[^0-9A-Z]/g, "");
  if (nu.length < 10 || nu.length > 20) return null;
  return nu;
}

/** Le code INSEE porté par un identifiant BAN (`17299_0123_00012`), ou `null`. */
export function inseeDeBanId(banId: string | null | undefined): string | null {
  if (!banId) return null;
  const tete = banId.split("_")[0];
  return /^[0-9][0-9AB][0-9]{3}$/i.test(tete) ? tete.toUpperCase() : null;
}

/**
 * La forme comparable d'un libellé d'adresse : sans accents, sans ponctuation, sans casse, et sans
 * le code postal ni la commune qui suivent la voie. Deux bases écrivent rarement une adresse de la
 * même façon, et « 12 Rue des Tilleuls » doit rencontrer « 12 rue des tilleuls ».
 */
export function voieComparable(label: string | null | undefined): string | null {
  if (!label) return null;
  const sansCommune = label
    .normalize("NFD")
    // Diacritiques combinants en ÉCHAPPEMENTS : tapés en clair, ils sont invisibles à la relecture.
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    // Le code postal ouvre la fin du libellé : tout ce qui suit décrit la commune.
    .split(/\b\d{5}\b/)[0];
  const nettoye = sansCommune.replace(/[^a-z0-9]+/g, " ").trim();
  return nettoye.length > 0 ? nettoye : null;
}

export function rapprocher(
  dpe: { id_ban: string | null; adresse: string | null },
  dossier: { ban_id: string; address_label: string; insee: string },
): Rapprochement {
  const rendre = (niveau: NiveauRapprochement): Rapprochement => ({
    niveau,
    attachable: niveau === "adresse" || niveau === "batiment",
    confirmationRequise: niveau === "batiment",
  });

  if (dpe.id_ban && dpe.id_ban === dossier.ban_id) return rendre("adresse");

  const voieDpe = voieComparable(dpe.adresse);
  const voieDossier = voieComparable(dossier.address_label);
  if (voieDpe && voieDossier && voieDpe === voieDossier) return rendre("batiment");

  // La commune du diagnostic se lit dans son identifiant BAN. Les arrondissements de Paris, Lyon
  // et Marseille passent par leur commune parente : un diagnostic du 7e n'est pas « ailleurs »
  // quand le dossier porte le code de Paris.
  const inseeDpe = communeParent(inseeDeBanId(dpe.id_ban));
  if (!inseeDpe) return rendre("inconnu");
  return rendre(inseeDpe === communeParent(dossier.insee) ? "commune" : "ailleurs");
}

/**
 * L'ÉTIQUETTE EST-ELLE UNE ÉTIQUETTE ?
 *
 * La base rend « N » quand le diagnostiqueur n'a pas pu établir la consommation, et l'écrit dans le
 * même champ qu'un « D ». Le cas est fréquent sur les diagnostics d'avant 2021 : un logement de
 * 1947 en location, dont les consommations n'ont pas pu être reconstituées, sort avec
 * `classe_consommation_energie: "N"` et `consommation_energie: 0`.
 *
 * Sans cette question, un zéro de consommation se lirait comme une performance exemplaire, et
 * l'écran annoncerait « Étiquette N » comme il annonce « Étiquette D ». Un diagnostic vierge décrit
 * le fait qu'on ne sait pas, et il doit se présenter ainsi.
 */
export function etiquetteExploitable(label: string | null | undefined): boolean {
  return typeof label === "string" && /^[A-G]$/.test(label.trim().toUpperCase());
}

