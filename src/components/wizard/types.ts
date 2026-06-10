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

// Vrai si l'utilisateur a réellement renseigné quelque chose dans le wizard.
// Sert à décider si on persiste / affiche une « première lecture ».
export function hasWizardContent(a: WizardAnswers | null | undefined): boolean {
  if (!a) return false;
  return Boolean(
    a.quartier || a.logement || a.metier || (a.sante && a.sante.length > 0) || a.mobilite || a.projets,
  );
}

// Lit les réponses du wizard depuis le sessionStorage (client uniquement).
// Retourne null si rien d'exploitable.
export function readWizardAnswersFromStorage(): WizardAnswers | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(WIZARD_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<WizardState>;
    const answers = parsed.answers
      ? { ...WIZARD_INITIAL_ANSWERS, ...parsed.answers }
      : null;
    return hasWizardContent(answers) ? answers : null;
  } catch {
    return null;
  }
}
