// Paris 75101-75120 · Lyon 69381-69389 · Marseille 13201-13216
export function isArrondissement(code: string): boolean {
  return /^(751\d\d|6938\d|132\d\d)$/.test(code);
}

// Pour Paris, Lyon, Marseille : les données DRIAS sont indexées par arrondissement.
// On utilise le 1er arrondissement comme proxy pour la ville entière.
export const DRIAS_CITY_FALLBACK: Record<string, string> = {
  '75056': '75101', // Paris → Paris 1er
  '69123': '69381', // Lyon → Lyon 1er
  '13055': '13201', // Marseille → Marseille 1er
};
