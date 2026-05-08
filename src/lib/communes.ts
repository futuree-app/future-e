// Paris 75101-75120 · Lyon 69381-69389 · Marseille 13201-13216
export function isArrondissement(code: string): boolean {
  return /^(751\d\d|6938\d|132\d\d)$/.test(code);
}
