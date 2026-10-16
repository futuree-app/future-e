// FUT-50 × FUT-104 · LES PASTILLES D'UNE COMMUNE ULTRAMARINE : des faits SocleOM, sans verdict.
//
// La chaleur se lit avec les indicateurs que Météo-France retient pour CE territoire (`TERRITOIRES_OUTREMER[…].reperes`),
// sa référence 1991-2020 et son niveau de réchauffement régional à l'horizon 2050. Jamais avec les conventions de
// l'Hexagone : ni 35 °C ou nuits > 20 °C comme seuils de signalement, ni `classifyClimateComfort`, ni rang national,
// ni 1976-2005, ni « +2,7 °C en France ». Le signal est « information » (« À savoir ») : un fait important n'a pas
// besoin d'une qualification favorable ou défavorable, et aucune règle ultramarine n'est encore validée.
//
// Aucun chiffre ni seuil n'est écrit ici : tout vient de la lecture (`lireClimatOutremer`) et de la définition de
// l'indicateur (`seuilDe`). Module pur, testé dans `outremer.test.ts`.
import { indicateurOutremer, seuilDe, type EntiteOutremer, type IndicateurOutremer, type LectureClimatOutremer, type TerritoireOutremer } from "../../../../lib/outremer/climat-outremer.ts";
import type { LecturePastille, Lieu, MesureChaleur } from "./pastilles.ts";

const SUITE = (lieu: Lieu) => ({
  libelle: lieu.type === "adresse" ? "Faire examiner cette adresse" : `Examiner une adresse à ${lieu.commune}`,
  href: "/dossier",
});

/** 5,4 · 47 · 0,1 : une décimale sous 10 (sauf si elle est nulle), l'entier au-delà. */
export function nombre(v: number): string {
  const arrondi = v < 10 ? Math.round(v * 10) / 10 : Math.round(v);
  return arrondi.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
}
const degres = (v: number) => `${v.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} °C`;
const pluriel = (v: number, un: string, plusieurs: string) => (Math.round(v * 10) / 10 >= 2 ? plusieurs : un);

/** Ce que mesure un indicateur de chaleur, en mots, avec son comparateur exact. */
function phenomene(i: IndicateurOutremer): { unite: (v: number) => string; condition: string } | null {
  const s = seuilDe(i);
  if (!s) return null;
  const t = `${s.valeurC} °C`;
  if (s.grandeur === "maximale") {
    return { unite: (v) => `${pluriel(v, "journée", "journées")} par an`, condition: s.comparateur === "≥" ? `à au moins ${t}` : `au-dessus de ${t}` };
  }
  return { unite: (v) => `${pluriel(v, "nuit", "nuits")} par an`, condition: s.comparateur === "≥" ? `sans descendre sous ${t}` : `en restant au-dessus de ${t}` };
}

type Axe = { i: IndicateurOutremer; p: NonNullable<ReturnType<typeof phenomene>>; projete: number; reference: number | null };
function axe(l: Extract<LectureClimatOutremer, { statut: "integree" }>, code: string | undefined): Axe | null {
  const i = code ? indicateurOutremer(l, code) : null;
  const p = i ? phenomene(i) : null;
  const projete = i?.horizons["2050"].valeur?.mediane;
  if (!i || !p || projete == null || !Number.isFinite(projete)) return null;
  return { i, p, projete, reference: i.reference.mediane };
}

const indisponible = (lieu: Lieu, cle: LecturePastille["cle"], texte: string, aVerifier: string): LecturePastille => ({
  cle, commune: lieu.commune, fait: null, pourVous: { signal: "indisponible", texte }, aVerifier, suite: SUITE(lieu),
});

/** La chaleur d'une commune ultramarine. `lecture` : celle de `lireClimatOutremer` pour son code. */
export function lireChaleurOutremer(lieu: Lieu, lecture: LectureClimatOutremer): LecturePastille {
  if (lecture.statut !== "integree") {
    return indisponible(lieu, "chaleur", `${lecture.raison} Aucun chiffre n'est affiché à sa place.`,
      "Les projections propres aux territoires d'outre-mer sont publiées par Météo-France ; elles ne couvrent pas encore ce lieu de façon fiable.");
  }
  const t = lecture.territoire;
  const jours = axe(lecture, t.reperes?.chaleurJour);
  const nuits = axe(lecture, t.reperes?.chaleurNuit);
  if (!jours) {
    return indisponible(lieu, "chaleur", "L'indicateur de chaleur retenu pour ce territoire n'est pas publié ici : nous n'en tirons rien.",
      "Le dossier de la commune présentera les projections disponibles.");
  }
  const niveau = degres(lecture.niveaux["2050"]);
  const ref = (a: Axe) => (a.reference != null ? `contre ${nombre(a.reference)} sur 1991-2020` : "sans valeur publiée pour 1991-2020");
  const mesure = (a: Axe): MesureChaleur => ({
    valeur: nombre(a.projete), unite: a.p.unite(a.projete),
    legende: `${a.p.condition} à l'horizon 2050, ${ref(a)}`,
    texte: `À l'horizon 2050 : ${nombre(a.projete)} ${a.p.unite(a.projete)} ${a.p.condition}, ${ref(a)}.`,
  });
  const mesures = [mesure(jours), ...(nuits ? [mesure(nuits)] : [])];

  const texte = `À l'horizon 2050 (+${niveau} pour ${t.designation}, par rapport à 1850-1900) : ${nombre(jours.projete)} ${jours.p.unite(jours.projete)} ${jours.p.condition} (${ref(jours)})`
    + (nuits ? `, et ${nombre(nuits.projete)} ${nuits.p.unite(nuits.projete)} ${nuits.p.condition} (${ref(nuits)}).` : ".");

  // Deux plages distinctes, jamais réunies : la dispersion des simulations (q17-q83, un même réchauffement) et la
  // variation géographique dans la commune (d'un point de grille à l'autre).
  const q = jours.i.horizons["2050"].valeur!;
  const etendue = jours.i.etendueCommunale2050;
  const methode = [
    `Météo-France mesure la chaleur de chaque territoire d'outre-mer avec ses propres seuils. Pour ${t.designation} : les journées ${jours.p.condition}${nuits ? ` et les nuits ${nuits.p.condition}` : ""}. Ces seuils ne se comparent pas à ceux de l'Hexagone (35 °C le jour, 20 °C la nuit).`,
    `L'horizon 2050 correspond ici à un réchauffement de +${niveau} dans la région, par rapport à 1850-1900. La référence est la moyenne de 1991-2020.`,
    ...(q.q17 != null && q.q83 != null
      ? [`Selon les modèles climatiques, entre ${nombre(q.q17)} et ${nombre(q.q83)} ${jours.p.unite(q.q83).replace(" par an", "")} en 2050 : c'est la plage centrale de l'ensemble des simulations, pour un même réchauffement, pas trois scénarios.`]
      : []),
    `La mesure est celle du point de grille (environ ${lecture.pixel.pasDeg >= 0.03 ? "3" : "2,5"} km de côté) le plus proche de la mairie, situé à ${nombre(lecture.pixel.distanceKm)} km.`
      + (etendue && etendue[1] - etendue[0] >= 1
        ? ` Ailleurs dans la commune, de ${nombre(etendue[0])} à ${nombre(etendue[1])} ${jours.p.unite(etendue[1]).replace(" par an", "")} en 2050 : l'altitude et l'exposition changent beaucoup la chaleur.`
        : ""),
  ];
  // Les limites du contrat, sans redire l'horizon (déjà dans la méthode).
  const limites = lecture.limites.filter((x) => !/^Horizons définis/.test(x));
  return {
    cle: "chaleur", commune: lieu.commune,
    fait: { texte, source: `Météo-France · SocleOM-Climat-2025, référence 1991-2020, horizon 2050 (+${niveau} pour ${t.designation})`, grain: "secteur", mesures },
    pourVous: {
      signal: "information",
      texte: `Ces chiffres décrivent l'évolution projetée de la chaleur à ${lieu.commune}. futur•e ne les classe pas encore en favorable ou défavorable : les règles de lecture propres à ${t.designation} restent à établir.`,
    },
    methode,
    aVerifier: `${limites.join(" ")} La chaleur ressentie dépend aussi du quartier et du logement : orientation, étage, isolation, possibilité d'aérer la nuit.`,
    suite: SUITE(lieu),
  };
}

/** Les hivers doux : un critère défini pour l'Hexagone, sans lecture validée outre-mer. */
export function lireHiversOutremer(lieu: Lieu, t: TerritoireOutremer): LecturePastille {
  return indisponible(lieu, "hivers",
    `Ce critère est défini pour l'Hexagone : la température moyenne de décembre à février, sur 1976-2005. Pour ${t.designation}, futur•e n'a pas encore de lecture validée de la saison fraîche : aucun chiffre n'est affiché.`,
    "Le dossier de la commune présentera les températures disponibles pour ce territoire, avec leur période de référence.");
}

/**
 * La taille : le critère de l'accueil porte sur l'AGGLOMÉRATION (unité urbaine), que futur•e ne lit pas encore outre-mer.
 * La population communale du COG est un fait ; elle n'est pas classée selon les seuils du critère.
 */
export function lireTailleOutremer(lieu: Lieu, entite: EntiteOutremer, t: TerritoireOutremer): LecturePastille {
  if (entite.population == null) {
    return indisponible(lieu, "taille", "La population de ce lieu n'est pas publiée dans le référentiel officiel : nous n'en tirons rien.",
      "Le dossier de la commune présentera les données disponibles.");
  }
  const unite = t.uniteGeographique === "commune" ? "La commune" : `La ${t.uniteGeographique}`;
  return {
    cle: "taille", commune: lieu.commune,
    fait: {
      texte: `${unite} compte ${entite.population.toLocaleString("fr-FR")} habitants.`,
      source: "Code officiel géographique (INSEE, via geo.api.gouv.fr), population de la commune",
      grain: "commune",
      mesure: { valeur: entite.population.toLocaleString("fr-FR"), unite: "habitants", legende: "dans la commune, selon le référentiel officiel" },
    },
    pourVous: {
      signal: "information",
      texte: "Ce critère se lit à l'échelle de l'agglomération, que futur•e ne mesure pas encore pour l'outre-mer : la population de la commune seule ne suffit pas à dire si elle correspond à une petite ville.",
    },
    aVerifier: "Le bassin de vie peut être bien plus large que la commune : services, emplois et trajets se lisent autour de l'adresse.",
    suite: SUITE(lieu),
  };
}

/** Les risques hors du périmètre de GASPAR (Polynésie, Nouvelle-Calédonie, Wallis-et-Futuna). */
export function lireRisquesHorsGaspar(lieu: Lieu, t: TerritoireOutremer): LecturePastille {
  return indisponible(lieu, "risques",
    `La base nationale des risques (GASPAR) ne couvre pas ${t.designation} : son édition officielle n'y recense aucune commune. Cette absence ne dit rien des risques du lieu : nous n'en tirons aucune conclusion.`,
    "Les risques naturels de ce territoire se consultent auprès de ses autorités et de ses services de prévention.");
}

/** GASPAR couvre les DROM, Saint-Pierre-et-Miquelon, Saint-Barthélemy et Saint-Martin, et pas les collectivités du
 *  Pacifique (codes 98). Preuve DOCUMENTAIRE, pas seulement une réponse vide de l'API : l'édition officielle de la base
 *  (files.georisques.fr/GASPAR/gaspar.zip, publiée sur data.gouv.fr, millésime 2026-10-05) contient des communes 971 à
 *  976, 975, 977 et 978 dans ses tables, et AUCUN code 98 dans aucune de ses huit tables (risques recensés, arrêtés
 *  CatNat, AZI, DICRIM, TIM, PPRN, PPRM, PPRT). L'API concorde : 98735, 98818, 98613, 98736 répondent 0 résultat.
 *  Vérifié le 16/10/2026. La raison de cette absence (compétence propre de ces collectivités) n'est pas affirmée. */
export function gasparCouvre(code: string): boolean {
  return !/^98/.test(code);
}
