export const PRODUCT_MODULES = [
  {
    id: "quartier",
    name: "Quartier",
    summary: "Ce que le territoire devient autour de vous.",
    signals: ["Canicule", "Submersion", "Feux", "Cadre de vie"],
  },
  {
    id: "logement",
    name: "Logement",
    summary: "Ce que votre habitat absorbe, perd ou protège.",
    signals: ["DPE", "Assurance", "Confort d'ete", "Valeur"],
  },
  {
    id: "metier",
    name: "Metier",
    summary: "Ce que le climat fait a votre secteur et a votre travail.",
    signals: ["Chaleur", "Resilience sectorielle", "Transition", "Exposition"],
  },
  {
    id: "sante",
    name: "Sante",
    summary: "Ce que votre environnement fait a votre corps.",
    signals: ["Cadmium", "Pollens", "Air", "Canicule"],
  },
  {
    id: "mobilite",
    name: "Mobilite",
    summary: "Ce que votre mode de vie quotidien peut encore tenir.",
    signals: ["Voiture", "Transports", "Budget", "Alternatives"],
  },
  {
    id: "projets",
    name: "Projets",
    summary: "Ce que vos decisions de vie doivent anticiper.",
    signals: ["Achat", "Deménagement", "Enfants", "Retraite"],
  },
] as const;
