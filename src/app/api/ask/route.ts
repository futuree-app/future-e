// ════════════════════════════════════════════════════════════════════════════
// AskFuture · barre conversationnelle territoriale
// — POST  : envoie une question, reçoit une réponse structurée (tool use)
// — PATCH : enregistre une réponse à une question de profil
//
// Schéma de sortie strict via Anthropic tool use → pas de parsing texte fragile.
// Périmètre strict : on s'appuie uniquement sur les données futur•e disponibles
// (communes_categorization, communes_tension, user_profiles). Si une donnée
// manque, Claude doit le dire explicitement, jamais inventer.
// ════════════════════════════════════════════════════════════════════════════

import Anthropic from "@anthropic-ai/sdk";
import { canAccessTerritory, loadTerritoryClaims } from "@/lib/active-territory";
import { quotaQuestions } from "@/lib/territory-claims";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deriveCategories } from "@/lib/commune-categories";
import { type CommuneFullData } from "@/lib/commune-data";
import { type EaufranceSummary } from "@/lib/eaufrance";
import { type VigieauSummary } from "@/lib/vigieau";
import { type GeorisquesSummary, type GasparCatnatSummary } from "@/lib/georisques";
import { type BaignadeSummary } from "@/lib/baignade";
import {
  gatherCommuneEnrichment,
  type ClimatData,
  type EnrichmentResult,
} from "@/lib/commune-enrichment";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ─── Colonnes user_profiles ouvertes à l'enrichissement par la conversation ─
// Les valeurs réelles correspondent à des colonnes existantes du schéma
// user_profiles (cf. supabase/04_init_accounts.sql et 09_init_ask_conversations.sql).
const PROFILE_FIELDS = {
  housing_type:        { type: "text" as const },
  logement_chauffage:  { type: "text" as const },
  logement_isolation:  { type: "text" as const },
  presence_enfants:    { type: "boolean" as const },
  age_enfants:         { type: "text" as const },
  travail_exterieur:   { type: "boolean" as const },
  vehicule_type:       { type: "text" as const },
  health_flags:        { type: "array" as const },
  life_projects:       { type: "array" as const },
};

type ProfileField = keyof typeof PROFILE_FIELDS;

const PROFILE_FIELD_KEYS = Object.keys(PROFILE_FIELDS) as ProfileField[];

// ─── Schéma d'entrée du tool (sortie structurée garantie) ──────────────────
const TOOL_INPUT_SCHEMA = {
  type: "object" as const,
  properties: {
    answer: {
      type: "string",
      description:
        "Réponse à la question, 2 à 4 paragraphes maximum. Vouvoiement strict. Aucun tiret cadratin. Aucun point d'exclamation. Sources citées entre parenthèses en fin de paragraphe concerné (ex : 'Source : DRIAS' ou 'Source : Géorisques, ATMO').",
    },
    out_of_scope: {
      type: "boolean",
      description:
        "true si la question dépasse le périmètre futur•e (logement, santé environnementale, climat local, mobilité, risques, assurance, qualité de vie territoriale). Si true, answer doit suivre exactement le format de refus indiqué dans le system prompt.",
    },
    profile_question: {
      type: "object",
      description:
        "Question optionnelle pour enrichir le profil utilisateur. À n'inclure QUE si l'information manquante améliorerait significativement la prochaine réponse. UNE SEULE par message. Si rien d'utile à collecter, ne pas inclure ce champ du tout.",
      properties: {
        field: {
          type: "string",
          enum: PROFILE_FIELD_KEYS,
          description: "Champ du profil utilisateur à renseigner.",
        },
        contextualization: {
          type: "string",
          description:
            "Phrase courte qui explique pourquoi cette information est demandée. Obligatoire : la collecte doit toujours être transparente.",
        },
        question: {
          type: "string",
          description: "La question elle-même, courte, neutre, vouvoyée.",
        },
        options: {
          type: "array",
          items: { type: "string" },
          description: "Options de réponse rapides proposées à l'utilisateur.",
        },
      },
      required: ["field", "contextualization", "question", "options"],
    },
  },
  required: ["answer", "out_of_scope"],
};

type ProfileQuestion = {
  field: ProfileField;
  contextualization: string;
  question: string;
  options: string[];
};

type ToolInput = {
  answer: string;
  out_of_scope: boolean;
  profile_question?: ProfileQuestion;
};

// ─── System prompt ─────────────────────────────────────────────────────────
const SYSTEM_PROMPT_BASE = `Vous êtes l'assistant de futur•e. Votre rôle : interpréter les données territoriales publiques (DRIAS, Géorisques, GASPAR, VigiEau, ATMO, ANSES, INSEE, Hub'Eau) pour aider l'utilisateur à comprendre ce qu'elles impliquent concrètement pour sa vie dans sa commune.

PÉRIMÈTRE STRICT
Vous répondez uniquement sur :
- Le logement (risques, valeur, assurabilité, rénovation).
- La santé environnementale (qualité de l'air, eau potable, sols, bruit).
- Le climat local (canicule, inondation, submersion, sécheresse).
- La mobilité et la dépendance automobile du territoire.
- Les risques naturels et technologiques.
- L'assurance habitation et les catastrophes naturelles.
- La qualité de vie territoriale à moyen et long terme.

Si la question sort de ce périmètre, mettez out_of_scope=true et écrivez dans answer exactement :
"Cette question dépasse le périmètre de futur•e. Je peux vous aider à comprendre ce que les données climatiques, sanitaires et territoriales impliquent concrètement pour votre vie à {commune}. Reformulez votre question dans cette direction."
(Remplacez {commune} par le nom réel de la commune.)

RÈGLES ABSOLUES
- Vouvoiement systématique.
- Aucun tiret cadratin (—).
- Aucun point d'exclamation.
- Pas de catastrophisme, pas de minimisation.
- Pas de prescriptions de comportements individuels.
- Pas de politique partisane.
- Pas d'invention. Si une donnée précise n'apparaît pas dans le bloc DONNÉES TERRITORIALES DISPONIBLES ci-dessous, dites-le explicitement : "Les données futur•e ne couvrent pas encore ce point pour cette commune." Ne comblez jamais par vos connaissances générales sur la ville.
- Distinguez ce qui est mesuré, ce qui est projeté, ce qui est modélisé.
- Utilisez "les projections indiquent" plutôt que "il fera".
- Chaque chiffre cité doit mentionner sa source entre parenthèses.
- Le trio de communes et le périmètre géographique retenus par futur•e FONT AUTORITÉ. Ne contestez jamais qu'une commune du trio appartienne au périmètre demandé, ne la décrivez jamais comme « à l'écart », « hors zone » ou « en marge » du périmètre, et ne laissez jamais entendre qu'elle aurait été proposée par erreur. Ces communes ont été sélectionnées dans le périmètre voulu : tenez-le pour acquis et raisonnez à l'intérieur de ce cadre.

RÉFÉRENTIEL DE RÉCHAUFFEMENT (TRACC)
La France se réchauffe environ 1,7 fois plus vite que la moyenne mondiale. La trajectoire de référence française (TRACC 2023) et les écrans futur•e parlent en réchauffement EN FRANCE : +2 °C vers 2030, +2,7 °C vers 2050, +4 °C vers 2100. Ces trois jalons correspondent exactement aux scénarios DRIAS +1,5 °C, +2 °C et +3 °C GLOBAL du bloc DONNÉES TERRITORIALES DISPONIBLES. Quand l'utilisateur mentionne « +4 °C », il parle du réchauffement en France : répondez avec les données du scénario +3 °C global (horizon 2100) et explicitez l'équivalence en une phrase (« +4 °C en France vers 2100, soit +3 °C de réchauffement global »). Même logique pour +2 °C et +2,7 °C. Ces scénarios SONT couverts par les données : ne répondez jamais qu'ils manquent.

FORMAT DE answer
- 2 à 4 paragraphes maximum.
- Sources en fin de paragraphe pertinent : (Source : DRIAS) ou (Source : Géorisques, ATMO).
- Ton sobre, calme, informatif, comme un expert qui partage une lecture.

QUESTION DE PROFIL
N'incluez profile_question QUE si l'information manquante améliorerait substantiellement votre prochaine réponse, et UNE SEULE par message. Le champ "contextualization" est obligatoire et doit dire en une phrase pourquoi vous demandez. Choisissez "field" dans la liste autorisée du schéma.`;

// ─── Contexte territorial à partir des tables Supabase ─────────────────────
type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

async function buildCommuneContext(
  insee: string,
  supabase: SupabaseServer,
): Promise<{ text: string; hasTensionData: boolean }> {
  const { data: catRow } = await supabase
    .from("communes_categorization")
    .select("commune_name, insee_code, categories")
    .eq("insee_code", insee)
    .maybeSingle();

  const { data: tensions } = await supabase
    .from("communes_tension")
    .select(
      "slug, score, ind_exposition, ind_vulnerabilite, ind_adaptation, ind_occurrence",
    )
    .eq("insee_code", insee);

  const categories =
    catRow?.categories && catRow.categories.length > 0
      ? catRow.categories
      : deriveCategories(insee);

  const lines: string[] = [`INSEE : ${insee}`];
  if (catRow?.commune_name) {
    lines.push(`Nom commune (référentiel interne) : ${catRow.commune_name}`);
  }
  if (categories.length > 0) {
    lines.push(`Catégories territoriales : ${categories.join(", ")}`);
  }

  const hasTensionData = Array.isArray(tensions) && tensions.length > 0;

  if (hasTensionData) {
    lines.push("");
    lines.push(
      "Tensions territoriales (table communes_tension, scores et indicateurs sur 100) :",
    );
    for (const t of tensions) {
      const detail: string[] = [];
      if (t.ind_exposition != null) detail.push(`exposition ${t.ind_exposition}`);
      if (t.ind_vulnerabilite != null) detail.push(`vulnérabilité ${t.ind_vulnerabilite}`);
      if (t.ind_adaptation != null) detail.push(`adaptation ${t.ind_adaptation}`);
      if (t.ind_occurrence != null) detail.push(`occurrence ${t.ind_occurrence}`);
      const detailStr = detail.length > 0 ? ` (${detail.join(", ")})` : "";
      lines.push(`- ${t.slug} : score ${t.score}${detailStr}`);
    }
  } else {
    lines.push("");
    lines.push(
      "Pas de scores de tension détaillés disponibles dans futur•e pour cette commune.",
    );
  }

  return { text: lines.join("\n"), hasTensionData };
}

// ─── Formatage des blocs d'enrichissement pour le system prompt ────────────
// gatherCommuneEnrichment vit dans @/lib/commune-enrichment (réutilisé par le
// pré-warm GET /api/ask/context). Ici on met seulement en forme son résultat.

function pct(v: number | null | undefined, digits = 1): string | null {
  if (v == null) return null;
  return `${v.toFixed(digits)} %`;
}
function num(v: number | null | undefined, suffix = ""): string | null {
  if (v == null) return null;
  return `${v}${suffix}`;
}
function fnum(v: number | null | undefined, digits = 1, suffix = ""): string | null {
  if (v == null) return null;
  return `${v.toFixed(digits)}${suffix}`;
}

function formatAdemeBlock(data: CommuneFullData | null): string {
  if (!data) {
    return "[ADEME] Pas de données ADEME disponibles pour cette commune.";
  }
  const { commune, iris } = data;
  const out: string[] = ["[ADEME — données socio-environnementales]"];
  const push = (label: string, v: string | null) => {
    if (v !== null) out.push(`- ${label} : ${v}`);
  };

  push("Population (2021)", num(commune.population));
  push("Densité (hab/km²)", num(commune.territoire.densite));
  push("Vieillissement annuel 65+ (%)", pct(commune.vieillissement_pct, 2));

  const air = commune.qualite_air;
  const airLine = [
    air.pm25 != null ? `PM2.5 ${air.pm25} µg/m³` : null,
    air.pm10 != null ? `PM10 ${air.pm10} µg/m³` : null,
    air.no2 != null ? `NO₂ ${air.no2} µg/m³` : null,
    air.o3 != null ? `O₃ ${air.o3} µg/m³` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  if (airLine) out.push(`- Qualité de l'air (moyennes annuelles) : ${airLine}`);

  push("Logements vacants (%)", pct(commune.logements.vacants_pct));
  push("Logements sociaux (%)", pct(commune.logements.sociaux_pct));
  if (iris) {
    // L'ÉCHELLE EST DITE AU MODÈLE. Ces indicateurs valent soit pour le secteur de l'adresse, soit
    // pour la commune entière — et l'écart est massif (HLM : 0,3 % à 85,1 % entre IRIS de La
    // Rochelle). Les annoncer « IRIS » quand c'est une moyenne communale ferait raconter du local.
    const echelle =
      data.irisScope.kind === "point"
        ? `secteur de l'adresse, IRIS ${data.irisScope.irisCode}`
        : `moyenne des ${iris.iris_count} IRIS de la commune`;
    out.push(`- Profil résidentiel (${echelle}) :`);
    push("Passoires thermiques (%)", pct(iris.passoires_taux));
    push("Précarité énergétique logement (%)", pct(iris.preca_energetique_pct));
    push("Taux propriété (%)", pct(iris.taux_propriete));
    push("Taux HLM (%)", pct(iris.taux_hlm));
    push("Taux suroccupation (%)", pct(iris.taux_suroccupation));
    push("Actifs utilisant un mode motorisé pour aller travailler (%)", pct(iris.part_deplacements_motorises));
    push("Usage transports en commun (%)", pct(iris.taux_transports_communs));
  }
  push("Revenu médian (€)", num(commune.economie.revenu_median));
  push(
    "Écart à la médiane nationale (%, + = sous la médiane)",
    pct(commune.economie.inferiorite_nationale_pct),
  );
  push("APL médecins généralistes", fnum(commune.sante.acces_medecins, 2));
  // La ligne « Population à plus de 20 min d'un service » a été retirée le 04/08/2026 : l'ADEME ne
  // documente pas ce champ, et le seul indicateur homonyme de l'ANCT porte sur les services de
  // SANTÉ. Donnée au modèle sous ce libellé, elle lui faisait produire des phrases sur l'accès aux
  // commerces à partir d'un chiffre qui compte peut-être des médecins. Un contexte qu'on ne sait
  // pas nommer ne se donne pas à un modèle : il ne se tait pas, il extrapole.
  push("Taux boisement (%)", pct(commune.territoire.taux_boisement));
  push("Incendies récents (nombre)", num(commune.territoire.incendies));

  return out.join("\n");
}

function formatDriasBlock(data: ClimatData): string {
  if (!data) {
    return "[DRIAS] Pas de projections climatiques DRIAS disponibles pour cette commune.";
  }
  const out: string[] = [
    "[DRIAS-TRACC — projections climatiques par niveau de réchauffement]",
  ];
  // Double référentiel : niveau GLOBAL (clés gwl) et son équivalent TRACC
  // EN FRANCE (celui des écrans futur•e et du langage courant). Cf. règle
  // RÉFÉRENTIEL DE RÉCHAUFFEMENT du prompt système.
  const scenarioLabels: Record<string, string> = {
    gwl15: "+1,5 °C global (= +2 °C en France, horizon 2030)",
    gwl20: "+2,0 °C global (= +2,7 °C en France, horizon 2050)",
    gwl30: "+3,0 °C global (= +4 °C en France, horizon 2100)",
  };
  const indicatorOrder: Array<[string, string, string]> = [
    ["NORTMm_yr", "Température moyenne annuelle", " °C"],
    ["NORTXm_seas_JJA", "Température max été (JJA)", " °C"],
    ["NORTX30D_yr", "Jours > 30 °C / an", " j"],
    ["NORTX35D_yr", "Jours > 35 °C / an", " j"],
    ["NORTR_yr", "Nuits tropicales (Tmin > 20 °C)", " /an"],
    ["NORRR_yr", "Précipitations annuelles", " mm"],
    ["NORRR_seas_JJA", "Précipitations été", " mm"],
    ["NORIFM40_yr", "Jours risque feu (IFM > 40)", " j"],
    ["NORSWI04_yr", "Jours sécheresse sol (SWI < 0.4)", " j"],
  ];

  for (const [scenarioId, scenarioData] of Object.entries(data.commune.s)) {
    const label = scenarioLabels[scenarioId] ?? scenarioId;
    out.push(`\nScénario ${label} :`);
    for (const [code, lbl, suffix] of indicatorOrder) {
      const value = scenarioData.v[code];
      if (value != null) {
        out.push(`- ${lbl} : ${value}${suffix}`);
      }
    }
  }
  return out.join("\n");
}

function formatEauBlock(data: EaufranceSummary | null): string {
  if (!data) {
    return "[Hub'Eau] Pas de données Hub'Eau disponibles pour cette commune.";
  }
  const out: string[] = ["[Hub'Eau — eau potable et hydrologie]"];
  const dw = data.drinkingWater;
  if (dw) {
    if (dw.lastSampleDate) out.push(`- Dernier prélèvement eau potable : ${dw.lastSampleDate}`);
    if (dw.conformBacterio !== null) {
      out.push(
        `- Conformité bactériologique : ${dw.conformBacterio ? "oui" : "non"}`,
      );
    }
    if (dw.conformPhysicoChem !== null) {
      out.push(
        `- Conformité physico-chimique : ${dw.conformPhysicoChem ? "oui" : "non"}`,
      );
    }
    if (dw.nitrates != null) out.push(`- Nitrates : ${dw.nitrates} mg/L`);
    if (dw.nitrites != null) out.push(`- Nitrites : ${dw.nitrites} mg/L`);
  } else {
    out.push("- Pas de relevé eau potable récent disponible.");
  }
  const drought = data.drought;
  if (drought) {
    if (drought.lastObservationDate) {
      out.push(
        `- Observation cours d'eau (${drought.riverName ?? "inconnu"}) le ${drought.lastObservationDate} : ${drought.status ?? "n/a"}${drought.isDry ? " (assec)" : ""}`,
      );
    }
  }
  return out.join("\n");
}

function formatGeorisquesBlock(g: GeorisquesSummary | null): string {
  if (!g) {
    return "[Géorisques] Pas de données de risques naturels Géorisques disponibles pour cette commune.";
  }
  const f = g.flags;
  const present = [
    f.flood && "inondation fluviale",
    f.marineSubmersion && "submersion marine",
    f.landslide && "mouvement de terrain",
    f.clay && "retrait-gonflement des argiles",
    f.wildfire && "feux de forêt",
    f.storm && "tempête",
    f.seismic && "sismicité",
  ].filter(Boolean) as string[];
  const out: string[] = ["[Géorisques — risques naturels recensés à l'échelle de la commune]"];
  out.push(
    present.length > 0
      ? `- Risques recensés : ${present.join(", ")}.`
      : "- Aucun périmètre de risque naturel majeur recensé à l'échelle communale.",
  );
  if (g.seismic?.label) out.push(`- Zone sismique : ${g.seismic.label}.`);
  out.push("- Échelle commune. L'exposition précise d'une adresse relève des modules Autour de l'adresse et Logement.");
  return out.join("\n");
}

function formatGasparBlock(c: GasparCatnatSummary | null): string {
  if (!c || c.total === 0) {
    return "[GASPAR] Aucune reconnaissance de catastrophe naturelle recensée (ou donnée indisponible) pour cette commune.";
  }
  const out: string[] = ["[GASPAR — historique des arrêtés de catastrophe naturelle (CatNat)]"];
  out.push(
    `- ${c.total} reconnaissance${c.total > 1 ? "s" : ""} de l'état de catastrophe naturelle${c.firstYear ? ` depuis ${c.firstYear}` : ""}${c.lastYear ? `, la plus récente en ${c.lastYear}` : ""}.`,
  );
  if (c.byRisk.length > 0) {
    out.push(`- Par aléa : ${c.byRisk.map((rk) => `${rk.label} (${rk.count})`).join(", ")}.`);
  }
  return out.join("\n");
}

function formatVigieauBlock(v: VigieauSummary | null): string {
  if (!v || !v.maxLevel) {
    return "[VigiEau] Aucune restriction sécheresse en cours (ou donnée indisponible) pour cette commune.";
  }
  const labels: Record<string, string> = {
    crise: "crise",
    alerte_renforcee: "alerte renforcée",
    alerte: "alerte",
    vigilance: "vigilance",
  };
  const lvl = labels[v.maxLevel] ?? v.maxLevel;
  const bassin = v.topZone?.label ? ` sur le bassin ${v.topZone.label}` : "";
  const fin = v.topZone?.endDate ? ` (jusqu'au ${v.topZone.endDate})` : "";
  return `[VigiEau — arrêté sécheresse préfectoral en cours]\n- Niveau ${lvl}${bassin}${fin}.`;
}

function formatBaignadeBlock(b: BaignadeSummary): string {
  if (!b) {
    return "[Baignade] Pas de site de baignade déclaré pour cette commune (non littorale/lacustre, ou donnée indisponible).";
  }
  const dist = Object.entries(b.classements)
    .map(([label, n]) => `${label} (${n})`)
    .join(", ");
  const out: string[] = [
    "[Baignade — qualité des eaux de baignade (classement ARS, directive 2006/7/CE)]",
    `- ${b.nSites} site(s) de baignade (${b.types.join(", ")})${b.saison ? ` — saison ${b.saison}` : ""}.`,
    `- Classement des sites : ${dist}.`,
    "- Classement PLURIANNUEL (4 saisons) : qualité habituelle, pas la baignabilité du jour J (fermetures ponctuelles possibles après pluie). N'inclut PAS les algues vertes.",
  ];
  return out.join("\n");
}

function formatEnrichmentBlock(enr: EnrichmentResult): string {
  return [
    formatAdemeBlock(enr.ademe),
    formatDriasBlock(enr.drias),
    formatGeorisquesBlock(enr.georisques),
    formatGasparBlock(enr.catnat),
    formatVigieauBlock(enr.vigieau),
    formatEauBlock(enr.eau),
    formatBaignadeBlock(enr.baignade),
  ].join("\n\n");
}

// ─── Profil utilisateur connu ──────────────────────────────────────────────
type ProfileRow = Record<string, unknown> | null;

function buildUserProfileText(profile: ProfileRow): string {
  if (!profile) return "Profil non renseigné.";

  const lines: string[] = [];
  const text = (label: string, key: string) => {
    const v = profile[key];
    if (typeof v === "string" && v.length > 0) lines.push(`${label} : ${v}`);
  };
  const bool = (label: string, key: string) => {
    const v = profile[key];
    if (v === true || v === false) lines.push(`${label} : ${v ? "oui" : "non"}`);
  };

  text("Commune de résidence", "home_commune");
  text("INSEE", "home_insee_code");
  text("Tranche d'âge", "age_band");
  text("Statut logement", "housing_status");
  text("Type de logement", "housing_type");
  text("Catégorie professionnelle", "job_category");
  text("Profil mobilité", "mobility_profile");
  text("Chauffage", "logement_chauffage");
  text("Isolation", "logement_isolation");
  bool("Présence d'enfants", "presence_enfants");
  text("Âge des enfants", "age_enfants");
  bool("Travail extérieur", "travail_exterieur");
  text("Véhicule", "vehicule_type");

  const flags = profile.health_flags;
  if (Array.isArray(flags) && flags.length > 0) {
    lines.push(`Sensibilités environnementales : ${flags.join(", ")}`);
  }
  const projects = profile.life_projects;
  if (Array.isArray(projects) && projects.length > 0) {
    lines.push(`Projets de vie : ${projects.join(", ")}`);
  }

  const HEAT_LABELS: Record<string, string> = {
    supportable: "l'été reste supportable",
    fragile: "l'été commence à peser",
    difficile: "l'été est déjà difficile",
  };
  const WATER_LABELS: Record<string, string> = {
    loin: "non exposé",
    ponctuel: "tensions ponctuelles observées",
    present: "sujet déjà concret",
  };
  const SHELTER_LABELS: Record<string, string> = {
    resilient: "le territoire absorbe encore bien",
    tendu: "le cadre de vie se tend l'été",
    fragilise: "le territoire montre déjà ses limites",
  };
  const CHANGE_LABELS: Record<string, string> = {
    faible: "peu de changement perçu ces dernières années",
    visible: "quelques évolutions visibles ces dernières années",
    fort: "beaucoup de changements perçus ces dernières années",
  };
  const workbook = profile.workbook_quartier as Record<string, string> | null | undefined;
  if (workbook && typeof workbook === "object" && !Array.isArray(workbook)) {
    const obs: string[] = [];
    if (workbook.heat) obs.push(`- Vécu estival : ${HEAT_LABELS[workbook.heat] ?? workbook.heat}`);
    if (workbook.water) obs.push(`- Rapport à l'eau : ${WATER_LABELS[workbook.water] ?? workbook.water}`);
    if (workbook.shelter) obs.push(`- Cadre de vie estival : ${SHELTER_LABELS[workbook.shelter] ?? workbook.shelter}`);
    if (workbook.change) obs.push(`- Changements perçus : ${CHANGE_LABELS[workbook.change] ?? workbook.change}`);
    if (typeof workbook.note === "string" && workbook.note.trim()) {
      obs.push(`- Note terrain libre : ${workbook.note.trim()}`);
    }
    if (obs.length > 0) {
      lines.push("Observations terrain (module Territoire) :");
      lines.push(...obs);
    }
  }

  return lines.length > 0 ? lines.join("\n") : "Profil non renseigné.";
}

// ─── POST : génération d'une réponse ───────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      messages,
      communeInsee,
      communeName,
      sessionId,
    } = body as {
      messages?: Array<{ role: "user" | "assistant"; content: string }>;
      communeInsee?: string;
      communeName?: string;
      sessionId?: string;
    };

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages requis." }, { status: 400 });
    }
    if (!communeInsee || !communeName) {
      return NextResponse.json({ error: "Commune requise." }, { status: 400 });
    }
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId requis." }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const { data: account } = await supabase
      .from("user_accounts")
      .select("plan")
      .eq("user_id", user.id)
      .maybeSingle();

    const plan = account?.plan ?? "free";

    if (plan === "free") {
      return NextResponse.json(
        { error: "AskFuture est réservé aux détenteurs d'un rapport." },
        { status: 403 },
      );
    }

    if (plan === "one_shot") {
      // Pool unique proportionnel aux droits : trois questions par TERRITOIRE débloqué, comptées
      // globalement. Le calcul vit dans `territory-claims`, avec ses tests, et il est partagé par
      // cette route ET par les deux points de montage d'AskFuture : un quota calculé à deux
      // endroits est un quota qui diverge, ce qui venait justement d'arriver (l'API en autorisait
      // six pendant que l'écran masquait le formulaire au bout de trois).
      const quota = quotaQuestions(await loadTerritoryClaims(supabase, user.id));
      const { count: askedCount } = await supabase
        .from("ask_conversations")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("role", "user");
      if ((askedCount ?? 0) >= quota) {
        return NextResponse.json(
          { error: `Quota de ${quota} questions atteint. Passez au Fil pour un accès illimité.` },
          { status: 403 },
        );
      }
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    // Gating territoire-aware (cf. resolveReadableTerritory / GATING_TERRITOIRE.md).
    // Le communeInsee vient du client : on n'accepte de répondre que sur la résidence ou un
    // territoire réellement ouvert. Sinon 403 : l'API ne doit pas devenir une porte dérobée vers un
    // rapport jamais acheté.
    //
    // ── LE DROIT VIENT D'UN GRANT *OU* D'UN DOSSIER (revue du 11/08/2026) ────────────────────
    // Ce garde n'acceptait qu'un `report_grant`. Or l'achat d'un dossier d'adresse n'en crée AUCUN :
    // le droit territorial se déduit de l'existence du dossier lui-même (cf. le webhook, et
    // `canAccessTerritory`). Un acheteur à 39 € dont le seul droit sur Nantes vient de son dossier
    // voyait donc AskFuture lui proposer Nantes, puis répondre 403 à sa question. L'interface et
    // l'API appliquaient deux contrats différents pour le même produit.
    //
    // `canAccessTerritory` est le contrat unique, celui que tous les écrans utilisent déjà. La
    // résidence garde son traitement propre : elle ouvre le gratuit sans rien avoir acheté.
    const askInsee = communeInsee.trim().toUpperCase();
    const rawResidence = (profile as Record<string, unknown> | null)?.home_insee_code;
    const residenceInsee =
      typeof rawResidence === "string" ? rawResidence.trim().toUpperCase() : "";
    if (askInsee !== residenceInsee && !(await canAccessTerritory(supabase, user.id, askInsee))) {
      return NextResponse.json(
        { error: "Ce territoire n'est pas débloqué sur votre compte." },
        { status: 403 },
      );
    }

    // Les 4 sources tournent en parallèle. Supabase (rapide, déjà ouvert)
    // + ADEME/DRIAS/Hub'Eau (caches framework côté lib).
    const [{ text: communeContext, hasTensionData }, enrichment] =
      await Promise.all([
        buildCommuneContext(communeInsee, supabase),
        gatherCommuneEnrichment(communeInsee),
      ]);
    const profileText = buildUserProfileText(profile as ProfileRow);
    const enrichmentText = formatEnrichmentBlock(enrichment);
    const anyEnrichmentData =
      enrichment.ademe !== null ||
      enrichment.drias !== null ||
      enrichment.eau !== null ||
      enrichment.georisques !== null ||
      enrichment.catnat !== null ||
      enrichment.vigieau !== null;

    const systemPrompt = `${SYSTEM_PROMPT_BASE}

DONNÉES TERRITORIALES DISPONIBLES — ${communeName} (INSEE ${communeInsee})

[Référentiel interne futur•e]
${communeContext}
${
  hasTensionData
    ? ""
    : "\n(Pas de scores de tension détaillés en base interne pour cette commune.)"
}

${enrichmentText}
${
  !anyEnrichmentData && !hasTensionData
    ? "\nIndication : aucune donnée détaillée disponible dans futur•e pour cette commune. Si l'utilisateur demande des chiffres précis, dites-le explicitement plutôt que d'extrapoler."
    : ""
}

PROFIL UTILISATEUR CONNU
${profileText}`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      // Synthèse longue et payante : on vise la qualité sans subir l'effort
      // "high" par défaut de Sonnet 4.6 (trop lent). effort medium + thinking
      // coupé = compromis qualité/latence pour le contenu payant.
      output_config: { effort: "medium" },
      thinking: { type: "disabled" },
      system: systemPrompt,
      tools: [
        {
          name: "futuree_reply",
          description:
            "Renvoie la réponse structurée de futur•e à la question de l'utilisateur.",
          input_schema: TOOL_INPUT_SCHEMA,
        },
      ],
      tool_choice: { type: "tool", name: "futuree_reply" },
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const toolBlock = response.content.find((b) => b.type === "tool_use");
    if (!toolBlock || toolBlock.type !== "tool_use") {
      return NextResponse.json(
        { error: "Réponse Claude invalide (tool_use manquant)." },
        { status: 500 },
      );
    }

    const parsed = toolBlock.input as ToolInput;

    const lastUserMessage = messages[messages.length - 1];
    const { error: insertError } = await supabase
      .from("ask_conversations")
      .insert([
        {
          user_id: user.id,
          session_id: sessionId,
          role: "user",
          content: lastUserMessage.content,
          commune_insee: communeInsee,
        },
        {
          user_id: user.id,
          session_id: sessionId,
          role: "assistant",
          content: parsed.answer,
          commune_insee: communeInsee,
        },
      ]);

    if (insertError) {
      // On loggue mais on n'échoue pas la réponse à l'utilisateur — la réponse
      // de Claude reste valable même si l'historique n'a pas pu être persisté.
      console.error("[ask] conversation insert error:", insertError);
    }

    return NextResponse.json({
      answer: parsed.answer,
      outOfScope: parsed.out_of_scope,
      profileQuestion: parsed.profile_question ?? null,
    });
  } catch (error) {
    console.error("[ask] POST error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération de la réponse." },
      { status: 500 },
    );
  }
}

// ─── PATCH : enregistre une réponse à une question de profil ───────────────
const CHAUFFAGE_VALUES = ["gaz", "electrique", "pompe_chaleur", "fioul", "bois", "autre"] as const;
const VEHICULE_VALUES = ["thermique", "hybride", "electrique", "aucun"] as const;
const ISOLATION_VALUES = ["bonne", "moyenne", "mauvaise", "inconnue"] as const;

function normalizeText(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "_");
}

function coerceChauffage(raw: string): string | null {
  const n = normalizeText(raw);
  if (n.includes("pompe")) return "pompe_chaleur";
  if (CHAUFFAGE_VALUES.includes(n as (typeof CHAUFFAGE_VALUES)[number])) return n;
  if (n === "electricite") return "electrique";
  return null;
}

function coerceVehicule(raw: string): string | null {
  const n = normalizeText(raw);
  return VEHICULE_VALUES.includes(n as (typeof VEHICULE_VALUES)[number]) ? n : null;
}

function coerceIsolation(raw: string): string | null {
  const n = normalizeText(raw);
  return ISOLATION_VALUES.includes(n as (typeof ISOLATION_VALUES)[number]) ? n : null;
}

function coerceBoolean(raw: unknown): boolean | null {
  if (typeof raw === "boolean") return raw;
  if (typeof raw !== "string") return null;
  const n = raw.trim().toLowerCase();
  if (["oui", "true", "yes", "1"].includes(n)) return true;
  if (["non", "false", "no", "0"].includes(n)) return false;
  return null;
}

export async function PATCH(request: NextRequest) {
  try {
    const { field, value } = (await request.json()) as {
      field?: string;
      value?: unknown;
    };

    if (typeof field !== "string" || !(field in PROFILE_FIELDS)) {
      return NextResponse.json({ error: "Champ non autorisé." }, { status: 400 });
    }
    const config = PROFILE_FIELDS[field as ProfileField];

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    let normalized: unknown = null;

    if (config.type === "boolean") {
      const v = coerceBoolean(value);
      if (v === null) {
        return NextResponse.json({ error: "Valeur booléenne invalide." }, { status: 400 });
      }
      normalized = v;
    } else if (config.type === "array") {
      // Pour les jsonb arrays (health_flags, life_projects) : on fusionne
      // avec la valeur existante pour ne jamais écraser silencieusement.
      const incoming = Array.isArray(value)
        ? value.map(String)
        : typeof value === "string" && value.trim().length > 0
          ? [value]
          : null;
      if (!incoming) {
        return NextResponse.json({ error: "Tableau ou chaîne attendue." }, { status: 400 });
      }
      const { data: existing } = await supabase
        .from("user_profiles")
        .select(field)
        .eq("user_id", user.id)
        .maybeSingle();
      const currentRaw = (existing as Record<string, unknown> | null)?.[field];
      const current = Array.isArray(currentRaw) ? (currentRaw as string[]) : [];
      normalized = Array.from(new Set([...current, ...incoming]));
    } else {
      if (typeof value !== "string" || value.trim().length === 0) {
        return NextResponse.json({ error: "Chaîne attendue." }, { status: 400 });
      }
      if (field === "logement_chauffage") {
        const coerced = coerceChauffage(value);
        if (!coerced) {
          return NextResponse.json({ error: "Valeur de chauffage invalide." }, { status: 400 });
        }
        normalized = coerced;
      } else if (field === "vehicule_type") {
        const coerced = coerceVehicule(value);
        if (!coerced) {
          return NextResponse.json({ error: "Valeur de véhicule invalide." }, { status: 400 });
        }
        normalized = coerced;
      } else if (field === "logement_isolation") {
        const coerced = coerceIsolation(value);
        if (!coerced) {
          return NextResponse.json({ error: "Valeur d'isolation invalide." }, { status: 400 });
        }
        normalized = coerced;
      } else {
        normalized = value.trim();
      }
    }

    const { error } = await supabase
      .from("user_profiles")
      .update({ [field]: normalized, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);

    if (error) {
      console.error("[ask] PATCH update error:", error);
      return NextResponse.json({ error: "Erreur de sauvegarde." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ask] PATCH error:", error);
    return NextResponse.json({ error: "Erreur de sauvegarde." }, { status: 500 });
  }
}
