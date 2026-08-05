// ════════════════════════════════════════════════════════════════════════════════════════════
// L'IDENTITÉ LÉGALE DU VENDEUR, EN UN SEUL ENDROIT.
//
// Ces valeurs viennent de l'attestation d'immatriculation au Registre national des entreprises
// (RNE), mise à jour le 18/05/2026. NE RIEN ÉCRIRE ICI QUI NE FIGURE PAS SUR UN DOCUMENT
// OFFICIEL : ce module alimente à la fois les mentions légales du site et les factures émises.
//
// POURQUOI UN MODULE ET PAS DEUX LISTES. Cette identité était écrite en dur dans la page des
// mentions légales. La facture avait besoin des mêmes champs. Deux copies d'une identité légale
// finissent toujours par diverger, et la divergence se découvre le jour où un tiers compare une
// facture avec la page publique, donc au pire moment. Un déménagement, un changement de forme
// juridique ou une radiation ne doivent se saisir qu'une fois.
//
// PAS DE VARIABLE D'ENVIRONNEMENT. Ces informations sont publiques par obligation (LCEN pour le
// site, code de commerce pour la facture) et elles figurent déjà en clair sur une page indexable.
// Les cacher dans Vercel ajouterait un secret à gérer sans rien protéger, et exposerait à émettre
// une facture muette si la variable manquait au build.
//
// Pas de `server-only` : la page des mentions légales est un composant serveur, mais rien ici
// n'est sensible et un rendu client resterait légitime.
// ════════════════════════════════════════════════════════════════════════════════════════════

export const LEGAL_ENTITY = {
  /** Nom de l'entrepreneur individuel. C'est LUI qui contracte, pas le nom commercial. */
  legalName: "Quentin Brache",
  /** Nom sous lequel le service est connu du public. N'a aucune valeur juridique seul. */
  tradeName: "futur•e",
  /**
   * OBLIGATOIRE SUR LES FACTURES depuis le 15/05/2022 (loi du 14/02/2022 en faveur de l'activité
   * professionnelle indépendante) : le nom de l'entrepreneur individuel doit être accompagné de
   * « EI » ou « Entrepreneur individuel ». Souvent oublié, et c'est une non-conformité.
   */
  legalForm: "Entrepreneur individuel",
  siren: "105 109 557",
  siret: "10510955700014",
  apeCode: "5829C",
  apeLabel: "Édition de logiciels applicatifs",
  registeredOn: "18 mai 2026",
  address: {
    street: "1 rue Saint-Dominique, Apt B04",
    postcode: "17000",
    city: "La Rochelle",
    country: "France",
  },
  contactEmail: "hello@futur-e.fr",
  /**
   * LE TÉLÉPHONE FAIT PARTIE DE L'INFORMATION PRÉCONTRACTUELLE (ajouté le 05/08/2026).
   *
   * L'article L111-1 du code de la consommation, auquel renvoie L221-5 pour la vente à distance,
   * demande les coordonnées permettant d'entrer effectivement en contact avec le professionnel, ce
   * qui inclut un numéro de téléphone. Le site n'en publiait aucun : le `1007` des mentions légales
   * est celui d'OVH, l'hébergeur du domaine, et il ne joint personne chez futur•e.
   *
   * Deux écritures parce qu'elles servent deux usages : `phone` s'affiche, `phoneHref` compose. Un
   * `tel:` avec des espaces ne se compose pas sur tous les téléphones.
   */
  phone: "06 69 41 08 44",
  phoneHref: "tel:+33669410844",
  /**
   * FRANCHISE EN BASE. La mention exacte est imposée par l'article 293 B du CGI ; écrire
   * « TVA incluse » ou « TTC » sur ces factures serait faux et laisserait croire à une taxe
   * collectée. Voir la doctrine de projet sur ce point.
   */
  vatMention: "TVA non applicable, article 293 B du CGI",
} as const;

/** Adresse postale sur une ligne, pour un pied de facture ou une ligne d'en-tête. */
export function legalAddressLine(): string {
  const a = LEGAL_ENTITY.address;
  return `${a.street}, ${a.postcode} ${a.city}, ${a.country}`;
}

/** Le nom tel qu'il DOIT apparaître sur une facture : nom légal accompagné de la forme. */
export function legalNameWithForm(): string {
  return `${LEGAL_ENTITY.legalName} — ${LEGAL_ENTITY.legalForm}`;
}

/**
 * Les couples libellé / valeur affichés sur la page des mentions légales, dans l'ordre attendu.
 * Vit ici pour que la page et la facture ne puissent pas décrire deux entreprises différentes.
 */
export function legalEntityRows(): { label: string; value: string }[] {
  return [
    { label: "Éditeur", value: LEGAL_ENTITY.legalName },
    { label: "Nom commercial", value: LEGAL_ENTITY.tradeName },
    { label: "Forme", value: LEGAL_ENTITY.legalForm },
    { label: "SIREN", value: LEGAL_ENTITY.siren },
    { label: "SIRET", value: LEGAL_ENTITY.siret },
    { label: "Code APE", value: `${LEGAL_ENTITY.apeCode} — ${LEGAL_ENTITY.apeLabel}` },
    { label: "RNE", value: `Immatriculé le ${LEGAL_ENTITY.registeredOn}` },
    { label: "Adresse", value: legalAddressLine() },
    { label: "Contact", value: LEGAL_ENTITY.contactEmail },
    { label: "Téléphone", value: LEGAL_ENTITY.phone },
    { label: "TVA", value: LEGAL_ENTITY.vatMention },
  ];
}
