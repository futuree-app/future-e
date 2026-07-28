// LES TROIS MODULES DU RAPPORT (bascule 6 -> 3, 29/07/2026).
//
// Le produit se lit désormais à TROIS ÉCHELLES emboîtées, et une seule idée les ordonne : on part
// de la commune, on resserre sur le secteur, on finit sur le bâti.
//
//   Territoire          -> la commune : ce qu'elle est, ce qu'elle devient.
//   Autour de l'adresse -> le voisinage : ce qui se trouve et se mesure à proximité du point.
//   Logement            -> le bâti : ce que ce logement-là absorbe, perd ou protège.
//
// « AUTOUR » N'EST PAS UNE GÉOMÉTRIE, C'EST UNE ÉCHELLE DE LECTURE. Ne promettez nulle part un
// périmètre unique (« à portée de pas », « à 10 minutes ») : ce module agrège des méthodes
// spatiales différentes — équipements dans un rayon de 3 km à vol d'oiseau (BPE), îlot de chaleur
// au grand-IRIS, équipement automobile au secteur IRIS avec repli sur la commune entière quand
// elle n'est pas découpée. Une promesse de distance serait fausse pour la moitié des faits. Le
// grain se dit AU NIVEAU DE CHAQUE FAIT, là où il s'affiche (« env. 2,4 km », « ce secteur »,
// « cette commune n'est pas découpée en secteurs »), jamais dans le titre du module.
//
// Les anciens modules Métier, Santé, Mobilité et Projets ne sont plus des modules. Leurs sujets
// n'ont pas disparu : la chaleur et l'air se lisent dans Territoire, la dépendance à la voiture et
// les services dans Autour de l'adresse, le projet d'achat dans Logement. Ce qui disparaît, c'est
// la promesse d'UN MODULE PAR DOMAINE DE VIE — elle annonçait six lectures là où le produit en
// tient trois, et affichait quatre cartes verrouillées derrière un tiret en guise de lien.
//
// PIÈGE D'IDENTIFIANT, à lire avant de toucher à `id` : l'id historique du module Territoire est
// `quartier`. Il est ANTÉRIEUR à l'existence d'un module « Autour de l'adresse » et désigne
// l'échelle COMMUNALE, jamais le voisinage. Il est conservé tel quel parce qu'il est écrit en base
// (`terrain_observations.module`), dans les URLs (/rapport/quartier) et dans l'analytics déjà
// collectée : le renommer casserait des données réelles pour un gain purement cosmétique.
export const PRODUCT_MODULES = [
  {
    id: "quartier",
    name: "Territoire",
    summary: "Ce que la commune devient autour de vous.",
    signals: ["Canicule", "Eau", "Feux", "Trajectoire"],
  },
  {
    id: "autour",
    name: "Autour de l'adresse",
    summary: "Ce qui se trouve et se mesure à proximité.",
    signals: ["Services", "Nature", "Îlot de chaleur", "Ménages et voiture"],
  },
  {
    id: "logement",
    name: "Logement",
    summary: "Ce que ce logement absorbe, perd ou protège.",
    signals: ["DPE", "Confort d'été", "Risques du bâti", "Sinistralité"],
  },
] as const;

export type ProductModuleId = (typeof PRODUCT_MODULES)[number]["id"];

// Route de lecture d'un module. Les trois existent et sont ouvertes au payant : aucune carte
// n'annonce plus un module qu'on ne peut pas ouvrir.
export const MODULE_HREF: Record<ProductModuleId, string> = {
  quartier: "/rapport/quartier",
  autour: "/rapport/autour",
  logement: "/rapport/logement",
};
