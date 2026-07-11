// Paris, Lyon, Marseille (PLM) : une adresse est géocodée sur son ARRONDISSEMENT (ex. 75101 pour
// Paris 1er), mais la commune est stockée sur son code INSEE de commune (75056). Comparer les deux
// bruts échoue toujours, d'où le bug « un Parisien ne peut analyser aucune adresse de Paris ».
// `communeParent` ramène un arrondissement à sa commune. Lib PURE, testable.

export function communeParent<T extends string | null | undefined>(insee: T): T {
  if (!insee) return insee;
  if (insee >= "75101" && insee <= "75120") return "75056" as T; // Paris
  if (insee >= "69381" && insee <= "69389") return "69123" as T; // Lyon
  if (insee >= "13201" && insee <= "13216") return "13055" as T; // Marseille
  return insee;
}
