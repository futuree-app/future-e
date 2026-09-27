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

import { HORIZON_META, type HorizonKey } from "./synthesis-contract.ts";

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

// ── Bloc 1 : le territoire aujourd'hui ──────────────────────────────────────────────────────

const LAND_PHRASE: Record<string, string> = {
  "Occupation mixte": "ses sols mêlent espaces urbanisés, espaces naturels et cultures",
  "Majoritairement urbanisé": "ses sols sont majoritairement urbanisés",
  "Forte présence naturelle": "les espaces naturels y tiennent une grande place",
  "À dominante agricole": "les terres agricoles y dominent",
  "Faible présence d'espaces naturels": "les espaces naturels y sont peu présents",
};

const COMPOSITION_TEXT: Record<string, string> = {
  espaces_urbanises: "d'espaces urbanisés",
  terres_agricoles: "de terres agricoles",
  forets: "de forêts",
  prairies: "de prairies",
  landes_et_pelouses: "de landes et pelouses",
  roche_et_dunes: "de roche et de dunes",
  eau: "d'eau",
};

const DENSITY_PHRASE: Record<string, string> = {
  "Commune dense": "la classe parmi les communes denses",
  "Densité intermédiaire": "correspond à une densité intermédiaire",
  "Commune peu dense": "correspond à une commune peu dense",
};

function blocTerritoire(p: P): string[] {
  const nom = at<string>(p, "commune.nom") ?? "Cette commune";
  const pop = at<number>(p, "commune.population_habitants");
  const role = at<{ role: string; agglomeration: string | null }>(p, "commune.role_territorial");
  const out: string[] = [];

  if (pop != null) {
    const roleClause =
      role?.role === "commune d'une agglomération" && role.agglomeration
        ? `, dans l'agglomération ${deCommune(role.agglomeration)}`
        : role?.role === "principal pôle de son agglomération"
          ? `, principal pôle de son agglomération`
          : role?.role === "commune isolée, hors agglomération"
            ? `, hors de toute agglomération`
            : "";
    out.push(`${nom} compte ${frNum(pop)} habitants${roleClause}.`);
  }

  const d = at<{ habitants_par_km2: number; categorie: string | null }>(p, "commune.densite");
  const land = at<{ categorie: string | null; composition_pct: Record<string, number> }>(p, "occupation_des_sols");
  const parts: string[] = [];
  if (d?.categorie && DENSITY_PHRASE[d.categorie]) {
    parts.push(`Sa densité, de ${frNum(d.habitants_par_km2)} habitants au km², ${DENSITY_PHRASE[d.categorie]}`);
  }
  if (land?.categorie && LAND_PHRASE[land.categorie]) {
    const top = Object.entries(land.composition_pct ?? {})
      .slice(0, 3)
      .map(([k, v]) => `${frNum(v)} % ${COMPOSITION_TEXT[k] ?? k}`);
    const landSentence = `${LAND_PHRASE[land.categorie]}${top.length ? ` : ${joinFr(top)}` : ""}`;
    parts.push(parts.length ? landSentence : landSentence.charAt(0).toUpperCase() + landSentence.slice(1));
  }
  if (parts.length) out.push(`${parts.join(", et ")}.`);

  const demo = at<{ categorie: string; evolution_annuelle_pct: number | null; part_arrivants_recents_pct: number | null }>(p, "demographie");
  if (demo && demo.evolution_annuelle_pct != null) {
    const e = demo.evolution_annuelle_pct;
    const evo =
      demo.categorie === "Croissance récente"
        ? `sa population a progressé de ${frNum(Math.abs(e), 2)} % par an`
        : demo.categorie === "Population en recul"
          ? `sa population a reculé de ${frNum(Math.abs(e), 2)} % par an`
          : `sa population est restée globalement stable`;
    const arrivals = demo.part_arrivants_recents_pct != null
      ? `, et ${frNum(demo.part_arrivants_recents_pct, 1)} % de ses habitants vivaient ailleurs un an plus tôt`
      : "";
    out.push(`Entre 2015 et 2021, ${evo}${arrivals}.`);
  }

  const rs = at<{ part_pct: number; categorie: string | null }>(p, "residences_secondaires");
  if (rs && (rs.categorie === "Forte" || rs.categorie === "Marquée")) {
    out.push(`Les résidences secondaires représentent ${frNum(rs.part_pct)} % des logements, une part ${rs.categorie.toLowerCase()}.`);
  }
  return out;
}

// ── Bloc 2 : ce qui évolue ───────────────────────────────────────────────────────────────────

/** Sous 1,5 par an, un phénomène compté en jours « reste rare » : convention des cartes climat. */
const RARE_BELOW = 1.5;

function evolutions(p: P): string[] {
  const c = (k: string) => at<Metric>(p, `climat_projete.${k}`);
  const items: string[] = [];
  const counted = (m: Metric, text: (v: string) => string) => {
    if (m && m.valeur >= RARE_BELOW) {
      const ecart = m.ecart_par_rapport_a_1976_2005;
      items.push(`${text(frNum(m.valeur))}${ecart != null && Math.round(ecart) !== 0 ? ` (${signed(ecart)} par rapport à 1976-2005)` : ""}`);
    }
  };
  counted(c("jours_au_dessus_de_30C"), (v) => `${v} jours au-dessus de 30 °C par an`);
  counted(c("nuits_au_dessus_de_20C"), (v) => `${v} nuits au-dessus de 20 °C`);
  const ete = c("temperature_moyenne_ete_C");
  if (ete?.ecart_par_rapport_a_1976_2005 != null) {
    items.push(`un été moyen à ${frNum(ete.valeur, 1)} °C (${signed(ete.ecart_par_rapport_a_1976_2005, 1)} °C)`);
  }
  counted(c("jours_de_sols_secs_par_an"), (v) => `${v} jours de sols secs par an`);
  counted(c("jours_de_pluie_intense_par_an"), (v) => `${v} jours de pluie intense par an`);
  counted(c("jours_de_conditions_meteo_favorables_au_feu"), (v) => `${v} jours de conditions météo favorables au feu`);
  return items;
}

function blocEvolution(p: P, horizon: HorizonKey): string[] {
  const meta = HORIZON_META[horizon];
  const out: string[] = [];
  const items = evolutions(p);
  if (items.length) {
    out.push(`Dans le scénario France ${meta.france}, les projections pour ${meta.year} décrivent, parmi les évolutions visibles, ${joinFr(items)}.`);
    out.push("Ces jours sont répartis dans l'année : ils ne forment pas une saison continue.");
  }
  const era5 = at<{ rechauffement_observe_C: number; periode: string }>(p, "tendance_observee");
  if (era5) {
    out.push(`Le réchauffement a déjà commencé : ${signed(era5.rechauffement_observe_C, 1)} °C observés ${era5.periode}.`);
  }
  const r = at<{ niveau: string; bassin: string | null }>(p, "restrictions_eau_en_vigueur");
  if (r) {
    const niveau = r.niveau.replace(/_/g, " ").replace("renforcee", "renforcée");
    out.push(`Aujourd'hui, des restrictions d'eau de niveau « ${niveau} » s'appliquent${r.bassin ? ` sur le territoire de gestion « ${r.bassin} »` : ""}.`);
  }
  return out;
}

// ── Bloc 3 : ce que la commune a déjà connu ──────────────────────────────────────────────────

function blocMemoire(p: P): string[] {
  const nom = at<string>(p, "commune.nom") ?? "La commune";
  const out: string[] = [];
  const cn = at<{ nombre_arretes: number; premiere_annee: number | null; principaux_aleas: { label: string; count: number }[] }>(
    p, "catastrophes_naturelles_reconnues",
  );
  if (cn) {
    const aleas = cn.principaux_aleas.map((a) => a.label.toLowerCase());
    out.push(
      `${nom} a été reconnue ${frNum(cn.nombre_arretes)} fois en état de catastrophe naturelle${cn.premiere_annee ? ` depuis ${cn.premiere_annee}` : ""}${aleas.length ? `, surtout au titre de : ${joinFr(aleas)}` : ""}.`,
    );
    // RELIER sans hiérarchiser : un aléa déjà reconnu qui figure aussi dans les évolutions projetées.
    const secheresse = cn.principaux_aleas.find((a) => /sécheresse/i.test(a.label));
    const sols = at<Metric>(p, "climat_projete.jours_de_sols_secs_par_an");
    if (secheresse && sols && sols.valeur >= RARE_BELOW) {
      out.push(`La sécheresse des sols, déjà reconnue ${frNum(secheresse.count)} fois, fait aussi partie des évolutions projetées.`);
    }
  }
  const risks = at<{ inondation: string; submersion_marine: string }>(p, "risques_recenses_echelle_communale");
  if (risks) {
    const flood = risks.inondation === "recensé";
    const sub = risks.submersion_marine === "recensé";
    if (flood && sub) out.push("À l'échelle de la commune, des périmètres d'inondation et de submersion marine sont recensés.");
    else if (flood) out.push("À l'échelle de la commune, un périmètre d'inondation est recensé.");
    else if (sub) out.push("À l'échelle de la commune, un périmètre de submersion marine est recensé.");
    else out.push("Aucun périmètre d'inondation ni de submersion marine n'est recensé à l'échelle de la commune.");
  }
  const lit = at<{
    inscrit_recul_trait_de_cote: boolean; littoral_amenage: boolean; erosion_classe: string | null;
    erosion_part_du_littoral_qui_recule_pct: number | null; periode_observee: string | null;
  }>(p, "littoral");
  if (lit) {
    const periode = lit.periode_observee ? ` (observations ${lit.periode_observee})` : "";
    if (lit.littoral_amenage) {
      out.push(`Le littoral est largement aménagé : l'érosion n'y est que partiellement mesurable${lit.erosion_classe ? `, et classée « ${lit.erosion_classe} » là où elle l'est${periode}` : ""}.`);
    } else if (lit.erosion_part_du_littoral_qui_recule_pct && lit.erosion_classe) {
      out.push(`Le littoral recule sur ${frNum(lit.erosion_part_du_littoral_qui_recule_pct)} % de sa longueur, une érosion de classe « ${lit.erosion_classe} »${periode}.`);
    }
    if (lit.inscrit_recul_trait_de_cote) {
      out.push("Elle est inscrite sur la liste nationale des communes concernées par le recul du trait de côte (loi Climat et Résilience).");
    }
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
