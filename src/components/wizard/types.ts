export type LogementAge = "recent" | "middle" | "old";

export type WizardAnswers = {
  quartier: string | null;
  logement: { type: "maison" | "appartement" | "autre"; age: LogementAge | null } | null;
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
  unknownAnswers: (keyof WizardAnswers)[]; // étapes répondues "je ne sais pas"
};

export const WIZARD_INITIAL_ANSWERS: WizardAnswers = {
  quartier: null,
  logement: null,
  metier: null,
  sante: [],
  mobilite: null,
  projets: null,
};

export const WIZARD_SKIP_DEFAULTS: Partial<WizardAnswers> = {
  logement: { type: "appartement", age: "middle" },
  metier: "Services / Numérique",
  sante: [],
  mobilite: "mixte",
  projets: "autre",
};

export const WIZARD_STORAGE_KEY = "futur-e:wizard";
