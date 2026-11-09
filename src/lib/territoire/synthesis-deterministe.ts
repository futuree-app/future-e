// ════════════════════════════════════════════════════════════════════════════════════════════
// LA SYNTHÈSE DÉTERMINISTE DU TERRITOIRE (FUT-6, D9).
//
// Un premier niveau de lecture, fiable et immédiat : affiché dès l'ouverture de la page, et seul
// affiché si le modèle est indisponible ou si deux générations sont refusées. Ce n'est ni un écran de
// chargement ni une liste de cartes : trois blocs qui SÉLECTIONNENT, RELIENT et ORGANISENT des faits
// déjà sûrs, avec des patrons écrits à l'avance.
//
// CE QU'ELLE NE FAIT PAS (décision du 27/09) : elle ne déclare aucun phénomène « dominant ». Un
// percentile national compare une commune aux autres sur UN indicateur ; il ne dit pas quel phénomène
// pèse le plus dans une vie. Les évolutions climatiques suivent donc un ORDRE ÉDITORIAL FIXE (chaleur,
// nuits, températures, sols, pluie, feu), présenté comme tel, jamais comme un classement.
//
// Elle part de la MÊME projection que la synthèse IA : ses chiffres sont ceux du snapshot, et elle
// passe les mêmes contrôles (vérifié par test).
// ════════════════════════════════════════════════════════════════════════════════════════════

import { HORIZON_META, ROLE_TEXT, ROLE_TEXT_ARRONDISSEMENT, type HorizonKey } from "./synthesis-contract.ts";
import { aleaDominant } from "../georisques-flags.ts";
import { CATNAT_DEPUIS } from "../decision/catnat-evidence.ts";

type P = Record<string, unknown>;
type Metric = { valeur: number; ecart_par_rapport_a_1976_2005?: number } | null;

function at<T>(p: P, path: string): T | null {
  let cur: unknown = p;
  for (const k of path.split(".")) {
    if (cur == null || typeof cur !== "object") return null;
    cur = (cur as Record<string, unknown>)[k];
  }
  return (cur ?? null) as T | null;
}

/** Nombre en français : virgule décimale, espace fine insécable pour les milliers. */
export function frNum(n: number, decimals = 0): string {
  const r = Math.round(Math.abs(n) * 10 ** decimals) / 10 ** decimals;
  const [int, dec] = r.toFixed(decimals).split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${n < 0 ? "-" : ""}${dec && Number(dec) !== 0 ? `${grouped},${dec.replace(/0+$/, "")}` : grouped}`;
}

const signed = (n: number, decimals = 0) => `${n >= 0 ? "+" : "-"}${frNum(Math.abs(n), decimals)}`;

function joinFr(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} et ${items[items.length - 1]}`;
}

function deCommune(nom: string): string {
  return /^[aeiouyéèêàâîôûœh]/i.test(nom) ? `d'${nom}` : `de ${nom}`;
}

// ── Bloc 1 : le territoire aujourd'hui (trois informations au plus) ─────────────────────────

const DENSITY_VERB: Record<string, string> = {
  "Commune dense": "est une commune dense",
  "Densité intermédiaire": "a une densité intermédiaire",
  "Commune peu dense": "est une commune peu dense",
  // FUT-179 : le registre nomme la catégorie d'un arrondissement par son périmètre.
  "Arrondissement dense": "est un arrondissement dense",
  "Arrondissement peu dense": "est un arrondissement peu dense",
};

/** FUT-175 : en deçà, l'eau n'est pas nommée par la synthèse déterministe (la carte la dit dès 1 %). */
const EAU_NOTABLE_PCT = 10;

type LandComposition = Record<string, number> | undefined;

/**
 * FUT-177 : la phrase de chaque catégorie. Deux d'entre elles portent leur limite, parce que c'est là que la lecture
 * dérapait : « Majoritairement urbanisé » compte routes et zones d'activité autant que les bâtiments (Roissy-en-France,
 * aéroport compris) ; « Faible présence d'espaces naturels » laisse des terres partagées entre cultures et espaces
 * urbanisés, nommées dans l'ordre de leur part (Carpiquet : les cultures d'abord).
 */
const LAND_PHRASE: Record<string, (c: LandComposition) => string> = {
  "Occupation mixte": () => "Ses sols mêlent espaces urbanisés, espaces naturels et cultures",
  "Majoritairement urbanisé": () => "Ses sols sont majoritairement urbanisés (bâtiments, routes, parkings et zones d'activité confondus)",
  "Forte présence naturelle": () => "Les espaces naturels y tiennent une grande place",
  "À dominante agricole": () => "Les terres agricoles y dominent",
  "Faible présence d'espaces naturels": (c) =>
    `Les espaces naturels y sont peu présents, ses terres se partageant entre ${
      (c?.terres_agricoles ?? 0) > (c?.espaces_urbanises ?? 0) ? "cultures et espaces urbanisés" : "espaces urbanisés et cultures"
    }`,
};

function blocTerritoire(p: P): string[] {
  const nom = at<string>(p, "commune.nom") ?? "Cette commune";
  const pop = at<number>(p, "commune.population_habitants");
  const role = at<{ role: string; agglomeration: string | null; commune?: string | null }>(p, "commune.role_territorial");
  const d = at<{ habitants_par_km2: number; categorie: string | null }>(p, "commune.densite");
  const out: string[] = [];

  // FUT-176 : les rôles tels que synthesis-contract.ts les écrit (ROLE_TEXT), au statut Insee.
  const memeNom = role?.agglomeration != null && role.agglomeration.trim().toLowerCase() === nom.trim().toLowerCase();
  const dansAgglo = role?.agglomeration && !memeNom ? ` dans l'agglomération ${deCommune(role.agglomeration)}` : "";
  // Un arrondissement (Paris 20e) : le centre de l'agglomération, c'est la commune nommée, jamais l'arrondissement.
  const roleClause = role?.role === ROLE_TEXT_ARRONDISSEMENT
    ? role.commune ? `, arrondissement ${deCommune(role.commune)} (ville-centre de son agglomération)` : ""
    : role?.role === ROLE_TEXT.banlieue || role?.role === ROLE_TEXT.dans_agglomeration
      ? dansAgglo || ", dans une agglomération"
      : role?.role === ROLE_TEXT.ville_centre
        ? dansAgglo ? `, au centre de l'agglomération ${deCommune(role.agglomeration!)}` : ", au centre de son agglomération"
        : role?.role === ROLE_TEXT.ville_isolee
          ? ", seule commune de son agglomération"
          : role?.role === ROLE_TEXT.hors_uu
            ? ", hors de toute agglomération"
            : "";
  const who = pop != null ? `${nom}, ${frNum(pop)} habitants${roleClause},` : nom;
  // La densité est celle de l'arrondissement : on ne l'appelle pas « commune » (FUT-176, contre-revue).
  const estArrondissement = role?.role === ROLE_TEXT_ARRONDISSEMENT;
  const verbeDensite = (cat: string) => estArrondissement ? DENSITY_VERB[cat].replace("une commune", "un arrondissement") : DENSITY_VERB[cat];
  if (d?.categorie && DENSITY_VERB[d.categorie]) {
    out.push(`${who} ${verbeDensite(d.categorie)} (${frNum(d.habitants_par_km2)} habitants au km²).`);
  } else if (pop != null) {
    out.push(`${nom} compte ${frNum(pop)} habitants${roleClause}.`);
  }

  const land = at<{
    categorie: string | null;
    part_espaces_naturels_des_terres_pct: number | null;
    part_eau_de_la_commune_pct: number | null;
    composition_des_terres_pct: Record<string, number>;
  }>(p, "occupation_des_sols");
  if (land?.categorie && LAND_PHRASE[land.categorie]) {
    // FUT-175 : les parts portent sur les terres ; l'eau, quand elle compte, est dite dans sa propre phrase.
    // FUT-177 : les TROIS familles des terres, cultures comprises. Sans elles, « 41 % d'espaces urbanisés et 14 %
    // d'espaces naturels » laissait le lecteur deviner les 45 % restants (Carpiquet), et y lire du bâti.
    const parts: string[] = [];
    const urb = land.composition_des_terres_pct?.espaces_urbanises;
    const agri = land.composition_des_terres_pct?.terres_agricoles;
    if (urb != null) parts.push(`${frNum(urb)} % d'espaces urbanisés`);
    if (agri != null) parts.push(`${frNum(agri)} % de cultures`);
    if (land.part_espaces_naturels_des_terres_pct != null) parts.push(`${frNum(land.part_espaces_naturels_des_terres_pct)} % d'espaces naturels`);
    out.push(`${LAND_PHRASE[land.categorie](land.composition_des_terres_pct)}${parts.length ? ` : ${joinFr(parts)} sur ses terres` : ""}.`);
    const eau = land.part_eau_de_la_commune_pct;
    if (eau != null && eau >= EAU_NOTABLE_PCT) out.push(`L'eau (mer, étangs, lacs, rivières) couvre par ailleurs ${frNum(eau)} % de sa surface cartographiée.`);
  }

  // L'évolution porte sur 2015-2021 ; la part d'arrivants (une seule année) n'est pas reprise ici,
  // pour ne jamais les associer dans une même phrase.
  const demo = at<{ categorie: string; evolution_de_la_population: { pct_par_an: number | null } }>(p, "demographie");
  const e = demo?.evolution_de_la_population?.pct_par_an;
  if (demo && e != null) {
    out.push(
      demo.categorie === "Croissance récente"
        ? `Sa population a progressé de ${frNum(Math.abs(e), 2)} % par an entre 2015 et 2021.`
        : demo.categorie === "Population en recul"
          ? `Sa population a reculé de ${frNum(Math.abs(e), 2)} % par an entre 2015 et 2021.`
          : "Sa population est restée globalement stable entre 2015 et 2021.",
    );
  }
  return out;
}

// ── Bloc 2 : ce qui évolue (trois évolutions au plus, ordre éditorial fixe) ─────────────────

/** Sous 1,5 par an, un phénomène compté en jours « reste rare » : convention des cartes climat. */
const RARE_BELOW = 1.5;
const MAX_EVOLUTIONS = 3;

function evolutions(p: P): string[] {
  const c = (k: string) => at<Metric>(p, `climat_projete.${k}`);
  const items: string[] = [];
  const add = (m: Metric, text: (v: string) => string, ecartLong: boolean) => {
    if (items.length >= MAX_EVOLUTIONS || !m || m.valeur < RARE_BELOW) return;
    const ecart = m.ecart_par_rapport_a_1976_2005;
    const suffix = ecart != null && Math.round(ecart) !== 0
      ? ` (${signed(ecart)}${ecartLong ? " par rapport à 1976-2005" : ""})`
      : "";
    items.push(`${text(frNum(m.valeur))}${suffix}`);
  };
  // ORDRE ÉDITORIAL, PAS UN CLASSEMENT : chaleur du jour, chaleur de la nuit, sols, pluie, feu.
  add(c("jours_au_dessus_de_30C"), (v) => `${v} jours au-dessus de 30 °C par an`, true);
  add(c("nuits_au_dessus_de_20C"), (v) => `${v} nuits au-dessus de 20 °C`, false);
  add(c("jours_de_sols_secs_par_an"), (v) => `${v} jours de sols secs par an`, false);
  add(c("jours_de_pluie_intense_par_an"), (v) => `${v} jours de pluie intense par an`, false);
  add(c("jours_de_conditions_meteo_favorables_au_feu"), (v) => `${v} jours de conditions météo favorables au feu`, false);
  return items;
}

function blocEvolution(p: P, horizon: HorizonKey): string[] {
  const meta = HORIZON_META[horizon];
  const items = evolutions(p);
  if (!items.length) return [];
  return [
    `Parmi les évolutions projetées pour ${meta.year} (scénario France ${meta.france}) : ${joinFr(items)}.`,
    "Ces indicateurs comptent des jours sur l'année, sans dire s'ils forment une période continue.",
  ];
}

// ── Bloc 3 : ce que la commune a déjà connu (deux faits, puis le passage) ───────────────────

function blocMemoire(p: P): string[] {
  const nom = at<string>(p, "commune.nom") ?? "La commune";
  const out: string[] = [];
  const cn = at<{ nombre_arretes: number; premiere_annee: number | null; principaux_aleas: { label: string; count: number }[] }>(
    p, "catastrophes_naturelles_reconnues",
  );
  if (cn) {
    // FUT-60 : « surtout » seulement pour un aléa qui pèse au moins 55 % des reconnaissances (règle
    // partagée avec la carte) ; les trois premiers ne se présentent plus comme une dominante. La
    // période est celle du comptage (depuis 1982), la même que le compte inondation de la carte.
    const dominant = aleaDominant(cn.principaux_aleas, cn.nombre_arretes);
    out.push(
      `${nom} a été reconnue ${frNum(cn.nombre_arretes)} fois en état de catastrophe naturelle depuis ${CATNAT_DEPUIS}${dominant ? `, surtout au titre de : ${dominant.toLowerCase()}` : ""}.`,
    );
  }
  const risks = at<{ inondation: string; submersion_marine: string }>(p, "risques_recenses_echelle_communale");
  if (risks) {
    const flood = risks.inondation === "recensé";
    const sub = risks.submersion_marine === "recensé";
    if (flood && sub) out.push("Des périmètres d'inondation et de submersion marine y sont recensés.");
    else if (flood) out.push("Un périmètre d'inondation y est recensé.");
    else if (sub) out.push("Un périmètre de submersion marine y est recensé.");
    else out.push("Aucun périmètre d'inondation ni de submersion marine n'y est recensé.");
  }
  out.push("L'effet concret de ces évolutions dépend du quartier et du logement, qu'examinent les modules Autour de l'adresse et Logement.");
  return out;
}

/** Même format que la synthèse IA : un titre, puis trois blocs « ## ». */
export function deterministicSynthesis(projection: P, horizon: HorizonKey): string {
  const nom = at<string>(projection, "commune.nom") ?? "Cette commune";
  const meta = HORIZON_META[horizon];
  const blocks: [string, string[]][] = [
    ["Le territoire aujourd'hui", blocTerritoire(projection)],
    [`Ce qui évolue d'ici ${meta.year}`, blocEvolution(projection, horizon)],
    ["Ce que la commune a déjà connu", blocMemoire(projection)],
  ];
  const body = blocks
    .map(([title, sentences]) => `## ${title}\n\n${sentences.length ? sentences.join(" ") : "Les données disponibles ne permettent pas de décrire ce point pour cette commune."}`)
    .join("\n\n");
  return `${nom} à l'horizon ${meta.year}\n\n${body}`;
}
