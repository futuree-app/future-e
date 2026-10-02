// LE PROMPT SYSTÈME D'ASKFUTURE, EN FONCTIONS PURES (FUT-16).
//
// Extrait de src/app/api/ask/route.ts pour qu'un test puisse inspecter le `system` EXACTEMENT passé à
// `anthropic.messages.create()`. Le prompt de base, les blocs d'enrichissement et le profil ont été
// déplacés sans changer un mot ; seuls le référentiel interne et l'assemblage ont changé, pour retirer
// `communes_tension` (FUT-16). La route ne garde que les accès (Supabase, enrichissement, Anthropic) ;
// tout ce qui devient texte pour le modèle passe par `construireSystemPrompt`.
//
// Module PUR : aucune I/O, imports de types seulement, chemins relatifs (testable sous `node --test`).
import type { CommuneFullData } from "../commune-data.ts";
import type { EaufranceSummary } from "../eaufrance.ts";
import type { VigieauSummary } from "../vigieau.ts";
import type { GeorisquesSummary, GasparCatnatSummary } from "../georisques.ts";
import type { BaignadeSummary } from "../baignade.ts";
import type { ClimatData, EnrichmentResult } from "../commune-enrichment.ts";

// ─── System prompt ─────────────────────────────────────────────────────────
export const SYSTEM_PROMPT_BASE = `Vous êtes l'assistant de futur•e. Votre rôle : interpréter les données territoriales publiques (DRIAS, Géorisques, GASPAR, VigiEau, ATMO, ANSES, INSEE, Hub'Eau) pour aider l'utilisateur à comprendre ce qu'elles impliquent concrètement pour sa vie dans sa commune.

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

// ─── Référentiel interne (texte) ───────────────────────────────────────────
// FUT-16 : le référentiel ne porte plus que l'identité de la commune et ses catégories territoriales.
// Il recevait aussi les lignes de `communes_tension` (« score », « exposition », « vulnérabilité »,
// « adaptation », « occurrence » sur 100) : des colonnes DRIAS ou ADEME normalisées et rebaptisées, dont
// 99 lignes climat sur 267 contredisaient la mesure transmise dans le même prompt, et que le modèle
// citait comme « référentiel interne futur•e ». Les mesures elles-mêmes restent, en clair, dans les
// blocs DRIAS et ADEME. Aucun adjectif ne remplace les notes retirées.
//
// LE CONTRAT EST FERMÉ : une clé inattendue est refusée. On ne réinjecte pas une couche de notation en
// l'ajoutant discrètement à un argument existant.
const CLES_REFERENTIEL = ["insee", "nomCommune", "categories"] as const;

export type EntreeReferentiel = { insee: string; nomCommune: string | null; categories: string[] };

function refuserClesInattendues(objet: object, permises: readonly string[], contexte: string) {
  const inattendues = Object.keys(objet).filter((k) => !permises.includes(k));
  if (inattendues.length > 0) {
    throw new Error(`${contexte} : clé(s) non prévue(s) par le contrat : ${inattendues.join(", ")}`);
  }
}

export function construireReferentiel(args: EntreeReferentiel): string {
  refuserClesInattendues(args, CLES_REFERENTIEL, "construireReferentiel");
  const lines: string[] = [`INSEE : ${args.insee}`];
  if (args.nomCommune) {
    lines.push(`Nom commune (référentiel interne) : ${args.nomCommune}`);
  }
  if (args.categories.length > 0) {
    lines.push(`Catégories territoriales : ${args.categories.join(", ")}`);
  }
  return lines.join("\n");
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

export function formatEnrichmentBlock(enr: EnrichmentResult): string {
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
export type ProfileRow = Record<string, unknown> | null;

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

// ─── Le system prompt complet, tel qu'il part chez Anthropic ───────────────
const CLES_SYSTEM = ["communeName", "communeInsee", "referentiel", "enrichment", "profile"] as const;

export type EntreeSystemPrompt = {
  communeName: string;
  communeInsee: string;
  /** Le texte de `construireReferentiel`. */
  referentiel: string;
  enrichment: EnrichmentResult;
  profile: ProfileRow;
};

/** Y a-t-il au moins une source détaillée ? Seules les vraies sources comptent. */
export function aDesDonneesDetaillees(enrichment: EnrichmentResult): boolean {
  return (
    enrichment.ademe !== null ||
    enrichment.drias !== null ||
    enrichment.eau !== null ||
    enrichment.georisques !== null ||
    enrichment.catnat !== null ||
    enrichment.vigieau !== null ||
    enrichment.baignade !== null
  );
}

export function construireSystemPrompt(args: EntreeSystemPrompt): string {
  refuserClesInattendues(args, CLES_SYSTEM, "construireSystemPrompt");
  const { communeName, communeInsee, referentiel, enrichment } = args;
  const profileText = buildUserProfileText(args.profile);
  const enrichmentText = formatEnrichmentBlock(enrichment);

  return `${SYSTEM_PROMPT_BASE}

DONNÉES TERRITORIALES DISPONIBLES — ${communeName} (INSEE ${communeInsee})

[Référentiel interne futur•e]
${referentiel}

${enrichmentText}
${
  aDesDonneesDetaillees(enrichment)
    ? ""
    : "\nIndication : aucune donnée détaillée disponible dans futur•e pour cette commune. Si l'utilisateur demande des chiffres précis, dites-le explicitement plutôt que d'extrapoler."
}

PROFIL UTILISATEUR CONNU
${profileText}`;
}
