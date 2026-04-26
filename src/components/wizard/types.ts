export type WizardAnswers = {
  quartier: string | null;
  logement: { type: "maison" | "appartement"; year: number } | null;
  metier: string | null;
  sante: string[];
  mobilite: "voiture" | "transport" | "velo" | "mixte" | null;
  projets: "achat" | "retraite" | "demenagement" | "autre" | null;
};

export type WizardState = {
  step: number;           // 0–5 = questions, 6 = teaser
  context: string | null; // slug module initial (ex : "logement")
  inseeCode: string | null; // code INSEE de la commune (5 chiffres)
  answers: WizardAnswers;
};

export const WIZARD_INITIAL_ANSWERS: WizardAnswers = {
  quartier: null,
  logement: null,
  metier: null,
  sante: [],
  mobilite: null,
  projets: null,
};

export const WIZARD_STORAGE_KEY = "futur-e:wizard";
