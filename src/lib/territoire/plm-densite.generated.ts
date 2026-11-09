// GÉNÉRÉ par scripts/fut179/densite-plm.mjs — ne pas éditer à la main.
// FUT-179 : densité de Paris, Lyon, Marseille (commune entière) et de leurs 45 arrondissements, chacune sur SON
// périmètre. Méthode et preuve : docs/audits/2026-11-09-fut179-plm-densite-occupation-sols.md.

export type DensitePLM = {
  perimetre: "commune" | "arrondissement";
  ville: string;
  population2022: number;
  superficieKm2: number;
  habitantsParKm2: number;
};

export const DENSITE_PLM_META = {
  "methode": "population municipale 2022 / superficie Insee, celle d'ADEME pour toutes les autres communes",
  "population": {
    "producteur": "Insee",
    "jeu": "Populations légales 2022 (géographie au 01/01/2024), PMUN",
    "url": "https://www.insee.fr/fr/statistiques/8290591",
    "sha256": "bd3a4b802d58cdbca989383e244cda5f66d80200169dd3feb6e5b5fbc648e4e0"
  },
  "superficie": {
    "producteur": "Insee",
    "jeu": "Base du comparateur de territoires (géographie 2026), SUP 2023",
    "url": "https://www.insee.fr/fr/statistiques/2521169",
    "sha256": "f0a04a8c744d4ea884f9d43402ab7a495de478bb78b8fdfbba81680989cbe6a8"
  },
  "validation": {
    "communes": 34728,
    "ecartMedianPct": 0.2,
    "ecartP90Pct": 0.7,
    "partSousUnPct": 95.5
  }
} as const;

export const DENSITE_PLM: Readonly<Record<string, DensitePLM>> = {
  "13055": {
    "perimetre": "commune",
    "ville": "Marseille",
    "population2022": 877215,
    "superficieKm2": 240.62,
    "habitantsParKm2": 3645.64
  },
  "13201": {
    "perimetre": "arrondissement",
    "ville": "Marseille",
    "population2022": 38482,
    "superficieKm2": 1.8,
    "habitantsParKm2": 21378.89
  },
  "13202": {
    "perimetre": "arrondissement",
    "ville": "Marseille",
    "population2022": 24153,
    "superficieKm2": 5.04,
    "habitantsParKm2": 4792.26
  },
  "13203": {
    "perimetre": "arrondissement",
    "ville": "Marseille",
    "population2022": 55653,
    "superficieKm2": 2.6,
    "habitantsParKm2": 21405
  },
  "13204": {
    "perimetre": "arrondissement",
    "ville": "Marseille",
    "population2022": 49744,
    "superficieKm2": 2.9,
    "habitantsParKm2": 17153.1
  },
  "13205": {
    "perimetre": "arrondissement",
    "ville": "Marseille",
    "population2022": 45020,
    "superficieKm2": 2.24,
    "habitantsParKm2": 20098.21
  },
  "13206": {
    "perimetre": "arrondissement",
    "ville": "Marseille",
    "population2022": 38804,
    "superficieKm2": 2.1,
    "habitantsParKm2": 18478.1
  },
  "13207": {
    "perimetre": "arrondissement",
    "ville": "Marseille",
    "population2022": 34866,
    "superficieKm2": 5.8,
    "habitantsParKm2": 6011.38
  },
  "13208": {
    "perimetre": "arrondissement",
    "ville": "Marseille",
    "population2022": 83414,
    "superficieKm2": 18.55,
    "habitantsParKm2": 4496.71
  },
  "13209": {
    "perimetre": "arrondissement",
    "ville": "Marseille",
    "population2022": 76347,
    "superficieKm2": 63.27,
    "habitantsParKm2": 1206.69
  },
  "13210": {
    "perimetre": "arrondissement",
    "ville": "Marseille",
    "population2022": 59852,
    "superficieKm2": 10.84,
    "habitantsParKm2": 5521.4
  },
  "13211": {
    "perimetre": "arrondissement",
    "ville": "Marseille",
    "population2022": 59033,
    "superficieKm2": 33.6,
    "habitantsParKm2": 1756.93
  },
  "13212": {
    "perimetre": "arrondissement",
    "ville": "Marseille",
    "population2022": 64276,
    "superficieKm2": 14.1,
    "habitantsParKm2": 4558.58
  },
  "13213": {
    "perimetre": "arrondissement",
    "ville": "Marseille",
    "population2022": 93425,
    "superficieKm2": 28.14,
    "habitantsParKm2": 3320.01
  },
  "13214": {
    "perimetre": "arrondissement",
    "ville": "Marseille",
    "population2022": 59230,
    "superficieKm2": 16.44,
    "habitantsParKm2": 3602.8
  },
  "13215": {
    "perimetre": "arrondissement",
    "ville": "Marseille",
    "population2022": 79501,
    "superficieKm2": 16.9,
    "habitantsParKm2": 4704.2
  },
  "13216": {
    "perimetre": "arrondissement",
    "ville": "Marseille",
    "population2022": 15415,
    "superficieKm2": 16.3,
    "habitantsParKm2": 945.71
  },
  "69123": {
    "perimetre": "commune",
    "ville": "Lyon",
    "population2022": 520774,
    "superficieKm2": 47.87,
    "habitantsParKm2": 10878.92
  },
  "69381": {
    "perimetre": "arrondissement",
    "ville": "Lyon",
    "population2022": 29040,
    "superficieKm2": 1.51,
    "habitantsParKm2": 19231.79
  },
  "69382": {
    "perimetre": "arrondissement",
    "ville": "Lyon",
    "population2022": 29880,
    "superficieKm2": 3.41,
    "habitantsParKm2": 8762.46
  },
  "69383": {
    "perimetre": "arrondissement",
    "ville": "Lyon",
    "population2022": 101523,
    "superficieKm2": 6.35,
    "habitantsParKm2": 15987.87
  },
  "69384": {
    "perimetre": "arrondissement",
    "ville": "Lyon",
    "population2022": 35232,
    "superficieKm2": 2.93,
    "habitantsParKm2": 12024.57
  },
  "69385": {
    "perimetre": "arrondissement",
    "ville": "Lyon",
    "population2022": 48277,
    "superficieKm2": 6.23,
    "habitantsParKm2": 7749.12
  },
  "69386": {
    "perimetre": "arrondissement",
    "ville": "Lyon",
    "population2022": 50718,
    "superficieKm2": 3.77,
    "habitantsParKm2": 13453.05
  },
  "69387": {
    "perimetre": "arrondissement",
    "ville": "Lyon",
    "population2022": 87491,
    "superficieKm2": 9.75,
    "habitantsParKm2": 8973.44
  },
  "69388": {
    "perimetre": "arrondissement",
    "ville": "Lyon",
    "population2022": 84956,
    "superficieKm2": 6.67,
    "habitantsParKm2": 12737.03
  },
  "69389": {
    "perimetre": "arrondissement",
    "ville": "Lyon",
    "population2022": 53657,
    "superficieKm2": 7.25,
    "habitantsParKm2": 7400.97
  },
  "75056": {
    "perimetre": "commune",
    "ville": "Paris",
    "population2022": 2113705,
    "superficieKm2": 105.4,
    "habitantsParKm2": 20054.13
  },
  "75101": {
    "perimetre": "arrondissement",
    "ville": "Paris",
    "population2022": 15475,
    "superficieKm2": 1.83,
    "habitantsParKm2": 8456.28
  },
  "75102": {
    "perimetre": "arrondissement",
    "ville": "Paris",
    "population2022": 20433,
    "superficieKm2": 0.99,
    "habitantsParKm2": 20639.39
  },
  "75103": {
    "perimetre": "arrondissement",
    "ville": "Paris",
    "population2022": 32772,
    "superficieKm2": 1.17,
    "habitantsParKm2": 28010.26
  },
  "75104": {
    "perimetre": "arrondissement",
    "ville": "Paris",
    "population2022": 28039,
    "superficieKm2": 1.6,
    "habitantsParKm2": 17524.38
  },
  "75105": {
    "perimetre": "arrondissement",
    "ville": "Paris",
    "population2022": 55925,
    "superficieKm2": 2.54,
    "habitantsParKm2": 22017.72
  },
  "75106": {
    "perimetre": "arrondissement",
    "ville": "Paris",
    "population2022": 40432,
    "superficieKm2": 2.15,
    "habitantsParKm2": 18805.58
  },
  "75107": {
    "perimetre": "arrondissement",
    "ville": "Paris",
    "population2022": 48196,
    "superficieKm2": 4.09,
    "habitantsParKm2": 11783.86
  },
  "75108": {
    "perimetre": "arrondissement",
    "ville": "Paris",
    "population2022": 35418,
    "superficieKm2": 3.88,
    "habitantsParKm2": 9128.35
  },
  "75109": {
    "perimetre": "arrondissement",
    "ville": "Paris",
    "population2022": 58419,
    "superficieKm2": 2.18,
    "habitantsParKm2": 26797.71
  },
  "75110": {
    "perimetre": "arrondissement",
    "ville": "Paris",
    "population2022": 81926,
    "superficieKm2": 2.89,
    "habitantsParKm2": 28348.1
  },
  "75111": {
    "perimetre": "arrondissement",
    "ville": "Paris",
    "population2022": 139983,
    "superficieKm2": 3.67,
    "habitantsParKm2": 38142.51
  },
  "75112": {
    "perimetre": "arrondissement",
    "ville": "Paris",
    "population2022": 139788,
    "superficieKm2": 16.32,
    "habitantsParKm2": 8565.44
  },
  "75113": {
    "perimetre": "arrondissement",
    "ville": "Paris",
    "population2022": 177735,
    "superficieKm2": 7.15,
    "habitantsParKm2": 24858.04
  },
  "75114": {
    "perimetre": "arrondissement",
    "ville": "Paris",
    "population2022": 137581,
    "superficieKm2": 5.64,
    "habitantsParKm2": 24393.79
  },
  "75115": {
    "perimetre": "arrondissement",
    "ville": "Paris",
    "population2022": 228754,
    "superficieKm2": 8.48,
    "habitantsParKm2": 26975.71
  },
  "75116": {
    "perimetre": "arrondissement",
    "ville": "Paris",
    "population2022": 159733,
    "superficieKm2": 16.37,
    "habitantsParKm2": 9757.67
  },
  "75117": {
    "perimetre": "arrondissement",
    "ville": "Paris",
    "population2022": 161206,
    "superficieKm2": 5.67,
    "habitantsParKm2": 28431.39
  },
  "75118": {
    "perimetre": "arrondissement",
    "ville": "Paris",
    "population2022": 185825,
    "superficieKm2": 6.01,
    "habitantsParKm2": 30919.3
  },
  "75119": {
    "perimetre": "arrondissement",
    "ville": "Paris",
    "population2022": 178371,
    "superficieKm2": 6.79,
    "habitantsParKm2": 26269.66
  },
  "75120": {
    "perimetre": "arrondissement",
    "ville": "Paris",
    "population2022": 187694,
    "superficieKm2": 5.98,
    "habitantsParKm2": 31386.96
  }
};
