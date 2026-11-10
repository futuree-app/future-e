// ════════════════════════════════════════════════════════════════════════════════════════════
// LA PROVENANCE DES FAITS TERRITOIRE (FUT-12, 04/11/2026).
//
// À CÔTÉ DU REGISTRE, PAS DEDANS. `facts.ts` est gardé ligne à ligne (fut147-non-regression) : sa
// provenance s'y ajoute par une seule application (`avecProvenances`), sans toucher un fait. Chaque
// entrée dit, pour une clé de fait, ce que les cartes affichent : producteur, jeu, diffuseur,
// nature, période réellement mesurée. Les valeurs qui varient (millésime de population, date de
// consultation VigiEau, jour du dernier relevé ONDE) viennent des entrées lues, jamais d'une constante.
//
// HORS DE L'EMPREINTE (cf. `Fact.provenance`) : la synthèse ne lit pas la provenance.
//
// Ce qu'on ne sait pas n'y est pas : le taux de boisement ADEME n'a ni définition ni millésime
// documentés, l'érosion côtière (Cerema) n'a pas d'édition établie dans nos fichiers, les arrêtés
// CatNat n'ont pas de date de consultation fiable (cache de 24 h, puis cache de process).
// ════════════════════════════════════════════════════════════════════════════════════════════
import type { Fact } from "../facts/contract.ts";
import { provenance, type Provenance } from "../facts/provenance.ts";
import { millesimePopulation } from "../population-millesime.ts";
import { densiteInseeRetenue } from "./plm-densite.ts";
import type { TerritoireInputs } from "./facts.ts";

/** OSO : une classification satellitaire annuelle (raster 10 m) du CESBIO. */
const OSO = provenance({ producer: "CESBIO", dataset: "OSO, occupation des sols (raster 10 m)", nature: "observation", period: "2023" });
const GASPAR = (dataset: string) => provenance({ producer: "Ministère de la Transition écologique", dataset, distributor: "Géorisques", nature: "reglementaire" });

export const PROVENANCES_TERRITOIRE: Record<string, (i: TerritoireInputs) => Provenance> = {
  "place.population": (i) => provenance({ producer: "Insee", dataset: "Recensement de la population", distributor: "ADEME", nature: "observation", period: String(millesimePopulation(i.insee)) }),
  // FUT-179 : Paris, Lyon, Marseille et leurs arrondissements, sans densité ADEME, lisent celle de l'Insee (population
  // 2022 / superficie), sur le périmètre lu. La provenance suit la valeur réellement retenue par le registre.
  "place.density": (i) => {
    const plm = densiteInseeRetenue(i);
    return plm
      ? provenance({
          producer: "Insee", dataset: "Populations légales 2022 et superficie (base du comparateur de territoires)", nature: "derive", period: "2022",
          sourceUrl: "https://www.insee.fr/fr/statistiques/2521169",
          limits: plm.perimetre === "commune"
            ? `Moyenne de toute la commune de ${plm.ville} : elle ne décrit aucun arrondissement en particulier.`
            : `Moyenne de l'arrondissement, parcs et bois compris ; celle de ${plm.ville} entière est différente.`,
        })
      : provenance({ producer: "Insee", dataset: "Recensement de la population, densité", distributor: "ADEME", nature: "derive", period: "2022" });
  },
  // FUT-184 : la classe est calculée sur le recensement 2021 carroyé ; l'édition est la grille 2025 (géographie 2025).
  "place.density_grid": (i) => provenance({
    producer: "Insee", dataset: "Grille communale de densité, 7 niveaux", version: "Grille 2025", nature: "derive", period: "2021",
    sourceUrl: "https://www.insee.fr/fr/information/8571524",
    limits: i.grilleDensite?.perimetre === "commune_parente" && i.grilleDensite.ville
      ? `Classe de ${i.grilleDensite.ville} entière : la grille ne classe pas les arrondissements.`
      : "Classe de la commune entière : elle ne décrit ni un quartier, ni une adresse.",
  }),
  "place.urban_role": () => provenance({ producer: "Insee", dataset: "Zonage en unités urbaines", version: "Zonage 2020" }),
  "land.composition": () => OSO,
  "land.natural_share": () => OSO,
  "land.water_share": () => OSO,
  "land.natural_share_15km": () => OSO,
  "land.forest_ademe": () => provenance({ producer: "ADEME", dataset: "Données communales, taux de boisement" }),
  "demography.trend": () => provenance({ producer: "Insee", dataset: "Recensement de la population, évolution de la population", nature: "observation", period: "2015-2021" }),
  "housing.secondary_share": () => provenance({ producer: "Insee", dataset: "Recensement de la population, base communale logement 2022", nature: "observation", period: "2022", sourceUrl: "https://www.insee.fr/fr/statistiques/8581474" }),
  "housing.vacancy_share": () => provenance({ producer: "Insee", dataset: "Recensement de la population, logements vacants", distributor: "ADEME", nature: "observation", period: "2022" }),
  "climate.scenarios": () => provenance({ producer: "Météo-France", dataset: "DRIAS, trajectoire de réchauffement de référence (TRACC)", nature: "projection", period: "1976-2005" }),
  "climate.era5_trend": (i) => provenance({
    producer: "Copernicus", dataset: "ERA5-Land, réanalyse", nature: "estimation",
    period: i.era5 ? `1961-${i.era5.data_through_year}` : null,
    limits: "Une réanalyse est un modèle contraint par les observations, pas le relevé d'une station.",
  }),
  "water.restrictions": (i) => provenance({
    producer: "Ministère de la Transition écologique", dataset: "VigiEau, arrêtés de restriction d'eau", nature: "reglementaire",
    // Une source muette n'a pas été consultée avec succès : aucune date (la carte date la tentative).
    consultedAt: i.vigieau?.status === "ok" ? i.vigieau.consultedAt : null,
  }),
  "water.river_drought": (i) => provenance({
    producer: "OFB", dataset: "ONDE, observations de l'écoulement des cours d'eau", distributor: "Hub'Eau", nature: "observation",
    period: i.drought?.lastObservationDate?.slice(0, 10) ?? null,
  }),
  "risk.georisques": () => GASPAR("Base GASPAR, risques recensés sur la commune"),
  "risk.catnat": () => GASPAR("Base GASPAR, arrêtés de catastrophe naturelle"),
  "coast.littoral": () => provenance({ producer: "Cerema", dataset: "Indicateur national de l'érosion côtière" }),
};

/** Pose la provenance sur chaque fait qui en a une ; ne touche à rien d'autre. */
export function avecProvenances(facts: Fact[], i: TerritoireInputs): Fact[] {
  return facts.map((f) => {
    const p = PROVENANCES_TERRITOIRE[f.key]?.(i);
    return p && Object.keys(p).length ? { ...f, provenance: p } : f;
  });
}
