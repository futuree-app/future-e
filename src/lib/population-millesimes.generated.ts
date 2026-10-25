// GÉNÉRÉ par scripts/population/construire-referentiel.mjs à partir de data/population-referentiel-cog2025.json.
// Ne pas éditer : relancer le script. Règle et raisons : scripts/lib/population-grain.mjs (FUT-109).

/** Millésime et géographie de la population de l'index pour toutes les communes absentes de la table. */
export const SOURCE_POPULATION = { millesime: 2021, geographie: "2024-01-01" } as const;

/**
 * Les communes dont la population de la source n'est pas au grain du COG 2025-01-01 : population de référence
 * Insee 2023 au bon grain, date du dernier mouvement (fusion, rétablissement, changement de code) et unité
 * urbaine. `retablissement` : un territoire partagé, qu'aucune donnée rangée par code ne répartit d'elle-même.
 */
export const POPULATIONS_HORS_GRAIN: Readonly<Record<string, {
  population: number | null; millesime: number | null; retablissement: boolean; mouvement: string; uu: string | null;
}>> = {
  "12218": { population: 1540, millesime: 2023, retablissement: false, mouvement: "2024-03-04", uu: null }, // Conques-en-Rouergue
  "14408": { population: 4529, millesime: 2023, retablissement: false, mouvement: "2025-01-01", uu: "14206" }, // Saint-Martin-de-May
  "14581": { population: 1896, millesime: 2023, retablissement: false, mouvement: "2024-04-24", uu: null }, // Aurseulles
  "14743": { population: 145, millesime: 2023, retablissement: false, mouvement: "2025-01-01", uu: null }, // Victot-en-Auge
  "15031": { population: 217, millesime: 2023, retablissement: true, mouvement: "2025-01-01", uu: null }, // Celles
  "15035": { population: 304, millesime: 2023, retablissement: true, mouvement: "2025-01-01", uu: null }, // Chalinargues
  "15047": { population: 88, millesime: 2023, retablissement: true, mouvement: "2025-01-01", uu: null }, // Chavagnac
  "15141": { population: 824, millesime: 2023, retablissement: true, mouvement: "2025-01-01", uu: null }, // Neussargues-Moissac
  "15171": { population: 122, millesime: 2023, retablissement: true, mouvement: "2025-01-01", uu: null }, // Sainte-Anastasie
  "16023": { population: 647, millesime: 2023, retablissement: false, mouvement: "2025-01-01", uu: null }, // Aunac-sur-Charente
  "16198": { population: 741, millesime: 2023, retablissement: false, mouvement: "2025-01-01", uu: null }, // Magnac-lès-Gardes
  "16393": { population: 2841, millesime: 2023, retablissement: false, mouvement: "2025-01-01", uu: null }, // La Boixe
  "17268": { population: 419, millesime: 2023, retablissement: false, mouvement: "2025-01-01", uu: null }, // Rives-de-Boutonne
  "19248": { population: 1388, millesime: 2023, retablissement: false, mouvement: "2025-01-01", uu: null }, // Les Trois-Saints
  "22147": { population: 3139, millesime: 2023, retablissement: false, mouvement: "2025-01-01", uu: "22103" }, // Merdrignac
  "22237": { population: 2844, millesime: 2023, retablissement: false, mouvement: "2025-01-01", uu: "22201" }, // Val-d'Arguenon
  "22241": { population: 1678, millesime: 2023, retablissement: false, mouvement: "2025-01-01", uu: null }, // Plumieux
  "23149": { population: 825, millesime: 2023, retablissement: false, mouvement: "2025-01-01", uu: null }, // Parsac
  "25223": { population: 343, millesime: 2023, retablissement: false, mouvement: "2025-01-01", uu: null }, // Éternoz-Vallée-du-Lison
  "25364": { population: 1988, millesime: 2023, retablissement: false, mouvement: "2025-01-01", uu: null }, // Mamirolle
  "25390": { population: 1923, millesime: 2023, retablissement: false, mouvement: "2025-01-01", uu: null }, // Pays-de-Montbenoît
  "26289": { population: 1460, millesime: 2023, retablissement: false, mouvement: "2025-01-01", uu: null }, // Saillans
  "28319": { population: 647, millesime: 2023, retablissement: false, mouvement: "2025-01-01", uu: null }, // Neuville Saint Denis
  "30329": { population: 607, millesime: 2023, retablissement: false, mouvement: "2025-01-01", uu: null }, // Thoiras-Corbès
  "32365": { population: 460, millesime: 2023, retablissement: false, mouvement: "2025-01-01", uu: null }, // Cap d'Astarac
  "33008": { population: 602, millesime: 2023, retablissement: false, mouvement: "2025-01-01", uu: null }, // Porte-de-Benauge
  "34144": { population: 832, millesime: 2023, retablissement: false, mouvement: "2025-01-01", uu: null }, // Lunas-les-Châteaux
  "39434": { population: 3976, millesime: 2023, retablissement: false, mouvement: "2025-01-01", uu: "39108" }, // Poligny
  "39576": { population: 1318, millesime: 2023, retablissement: false, mouvement: "2025-01-01", uu: null }, // Val-Sonnette
  "42084": { population: 507, millesime: 2023, retablissement: false, mouvement: "2025-01-01", uu: null }, // Solore-en-Forez
  "42217": { population: 520, millesime: 2023, retablissement: false, mouvement: "2025-01-01", uu: null }, // La Côte-Saint-Didier
  "46172": { population: 925, millesime: 2023, retablissement: false, mouvement: "2025-01-01", uu: null }, // Pern-Lhospitalet
  "49126": { population: 17162, millesime: 2023, retablissement: false, mouvement: "2025-01-01", uu: null }, // Orée d'Anjou
  "51485": { population: 579, millesime: 2023, retablissement: false, mouvement: "2025-01-01", uu: null }, // La Neuville-au-Temple
  "59006": { population: 619, millesime: 2023, retablissement: false, mouvement: "2025-01-01", uu: null }, // L'Orée de Mormal
  "60054": { population: 339, millesime: 2023, retablissement: true, mouvement: "2024-01-01", uu: null }, // Beaumont-les-Nonains
  "60694": { population: 542, millesime: 2023, retablissement: true, mouvement: "2024-01-01", uu: null }, // Les Hauts-Talican
  "61275": { population: 1429, millesime: 2023, retablissement: false, mouvement: "2025-01-01", uu: null }, // Merlerault-le-Pin
  "62447": { population: 4480, millesime: 2023, retablissement: false, mouvement: "2025-01-01", uu: "62204" }, // Hesdin-la-Forêt
  "63109": { population: 825, millesime: 2023, retablissement: false, mouvement: "2025-01-01", uu: null }, // Les Deux-Rives
  "69114": { population: 4185, millesime: 2023, retablissement: false, mouvement: "2024-03-15", uu: null }, // Porte des Pierres Dorées
  "70152": { population: 605, millesime: 2023, retablissement: false, mouvement: "2025-01-01", uu: null }, // Colombine
  "70180": { population: 600, millesime: 2023, retablissement: false, mouvement: "2025-01-01", uu: null }, // Belles-Fontaines
  "71566": { population: 1811, millesime: 2023, retablissement: false, mouvement: "2025-01-01", uu: "71105" }, // Verdun-Ciel
  "72155": { population: 4252, millesime: 2023, retablissement: false, mouvement: "2025-01-01", uu: "72701" }, // Laigné-Saint-Gervais
  "72382": { population: 1521, millesime: 2023, retablissement: false, mouvement: "2025-01-01", uu: null }, // Val-de-la-Hune
  "76455": { population: 538, millesime: 2023, retablissement: false, mouvement: "2025-01-01", uu: null }, // Morville-le-Héron
  "79307": { population: 2271, millesime: 2023, retablissement: false, mouvement: "2025-01-01", uu: null }, // Sauzé-entre-Bois
  "80155": { population: 556, millesime: 2023, retablissement: false, mouvement: "2025-01-01", uu: null }, // Bussus-lès-Yaucourt
  "85076": { population: 5711, millesime: 2023, retablissement: false, mouvement: "2025-01-01", uu: "00362" }, // Cugand-la-Bernardière
  "85084": { population: 6851, millesime: 2023, retablissement: true, mouvement: "2024-01-01", uu: "85213" }, // Essarts-en-Bocage
  "85165": { population: 1250, millesime: 2023, retablissement: true, mouvement: "2024-01-01", uu: null }, // L'Oie
  "85212": { population: 1359, millesime: 2023, retablissement: true, mouvement: "2024-01-01", uu: null }, // Sainte-Florence
  "85223": { population: 3611, millesime: 2023, retablissement: false, mouvement: "2025-01-01", uu: "85113" }, // Saint-Jean-d'Hermine
  "88321": { population: 6732, millesime: 2023, retablissement: false, mouvement: "2025-01-01", uu: "88204" }, // Neufchâteau
  "93066": { population: 149077, millesime: 2023, retablissement: false, mouvement: "2025-01-01", uu: "00851" }, // Saint-Denis
  "01187": { population: 801, millesime: 2023, retablissement: false, mouvement: "2025-01-01", uu: null }, // Haut Valromey
  "02589": { population: 367, millesime: 2023, retablissement: false, mouvement: "2025-01-01", uu: null }, // Pargny-et-Filain
  "08439": { population: 163, millesime: 2023, retablissement: false, mouvement: "2025-01-01", uu: null }, // Tannay-le-Mont-Dieu
  "09088": { population: 20, millesime: 2023, retablissement: false, mouvement: "2025-01-01", uu: null }, // Caychax-et-Senconac
};

/** Millésimes réunis dans la population des unités urbaines qui comptent une commune de la table. */
export const MILLESIMES_UNITES_URBAINES: Readonly<Record<string, readonly number[]>> = {
  "00362": [2021, 2023],
  "00851": [2021, 2023],
  "14206": [2021, 2023],
  "22103": [2023],
  "22201": [2021, 2023],
  "39108": [2023],
  "62204": [2021, 2023],
  "71105": [2021, 2023],
  "72701": [2021, 2023],
  "85113": [2023],
  "85213": [2023],
  "88204": [2023],
};
