#!/usr/bin/env node
/**
 * icpe-a-half-crawl.mjs
 *
 * Spike de recherche pour la couche A1/2 du Fil futur-e.
 *
 * Mesure, par commune, les evenements ICPE exposes par l'API Georisques
 * installations_classees. Cette v1 ne lit jamais les PDF : elle conserve les
 * URL disponibles, mais ne classe les evenements qu'a partir des metadonnees JSON.
 *
 * Usage :
 *   node scripts/research/icpe-a-half-crawl.mjs --file scripts/research/communes-icpe-spike-100.csv --since 2025-07-09 --out tmp/icpe-a-half-100.json
 */

import fs from "node:fs/promises";
import path from "node:path";

const GEORISQUES_URL = "https://www.georisques.gouv.fr/api/v1/installations_classees";
const PAGE_SIZE = 1000;
const MAX_RETRIES = 4;
const USER_AGENT = "futuree/icpe-a-half-crawl";
const FORMAL_NEARBY_WINDOW_DAYS = 90;

const REVIEW_KEYWORDS = [
  "mise en demeure",
  "pollution",
  "odeur",
  "nuisance",
  "plainte",
  "sols pollues",
  "incident",
  "non-conformite",
  "sanction",
  "suspension",
  "astreinte",
  "depassement",
  "rejet",
  "incendie",
  "fuite",
  "riverain",
];

const FORMAL_KEYWORDS = [
  "mise en demeure",
  "arrete",
  "arrete prefectoral",
  "prescriptions complementaires",
  "ap prescriptions",
  "ap d'autorisation",
  "ap enregistrement",
  "apc",
  "ape",
  "sanction",
  "suspension",
  "astreinte",
  "consignation",
  "amende",
];

const STRICT_MISE_EN_DEMEURE_KEYWORDS = [
  "mise en demeure",
  "ap mise en demeure",
  "ap_med",
  "apmed",
];

const HIGH_PRIORITY_KEYWORDS = [
  "mise en demeure",
  "ap_med",
  "apmed",
  "sanction",
  "suspension",
  "astreinte",
  "consignation",
  "amende",
];

const MEDIUM_PRIORITY_KEYWORDS = [
  "pollution",
  "odeur",
  "nuisance",
  "plainte",
  "sols pollues",
  "incident",
  "non-conformite",
  "depassement",
  "rejet",
  "incendie",
  "fuite",
  "riverain",
  "prescriptions complementaires",
  "ap prescriptions",
  "arrete",
  "apc",
  "ape",
];

function usage() {
  return `Usage:
  node scripts/research/icpe-a-half-crawl.mjs --insee 17300,31555 --since YYYY-MM-DD --out tmp/icpe-a-half.json
  node scripts/research/icpe-a-half-crawl.mjs --file communes.csv --since YYYY-MM-DD --out tmp/icpe-a-half-100.json

Options:
  --insee 17300,31555,...       Codes INSEE separes par des virgules
  --file path/to/communes.csv   CSV/TXT avec colonnes insee,nom,segment optionnel
  --since YYYY-MM-DD            Date plancher des evenements recents
  --out path/to/output.json     JSON detaille
  --limit N                     Limite optionnelle de communes a traiter
  --concurrency N               Nombre d'appels communes simultanes (defaut 3)
  --resume                      Reprend depuis le JSON --out si present
  --review-dir path             Dossier Markdown de revue humaine
  --help                        Affiche cette aide`;
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      args.help = true;
      continue;
    }
    if (arg === "--resume") {
      args.resume = true;
      continue;
    }
    if (!arg.startsWith("--")) throw new Error(`Option inattendue: ${arg}`);
    const key = arg.slice(2);
    const value = argv[i + 1];
    if (!value || value.startsWith("--")) throw new Error(`Valeur manquante pour --${key}`);
    args[key] = value;
    i++;
  }
  return args;
}

function normalizeInsee(value) {
  const code = String(value ?? "").trim().toUpperCase();
  if (/^\d{1,5}$/.test(code)) return code.padStart(5, "0");
  if (/^2[AB]\d{3}$/.test(code)) return code;
  return null;
}

function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' && quoted && line[i + 1] === '"') {
      current += '"';
      i++;
      continue;
    }
    if (char === '"') {
      quoted = !quoted;
      continue;
    }
    if (char === "," && !quoted) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(current.trim());
  return cells;
}

async function readCommunes(args) {
  const rows = [];
  if (args.insee) {
    for (const insee of args.insee.split(",").map(normalizeInsee).filter(Boolean)) {
      rows.push({ insee, nom: "", segment: "" });
    }
  }

  if (args.file) {
    const text = await fs.readFile(args.file, "utf8");
    const lines = text.split(/\r?\n/).filter((line) => line.trim() && !line.trim().startsWith("#"));
    if (lines.length > 0) {
      const first = parseCsvLine(lines[0]);
      const header = first.map((cell) => normalizeText(cell));
      const hasHeader = header.includes("insee");
      const indexes = hasHeader
        ? {
            insee: header.indexOf("insee"),
            nom: header.indexOf("nom"),
            segment: header.indexOf("segment"),
          }
        : { insee: 0, nom: 1, segment: 2 };

      for (const line of lines.slice(hasHeader ? 1 : 0)) {
        const cells = parseCsvLine(line);
        const insee = normalizeInsee(cells[indexes.insee]);
        if (!insee) continue;
        rows.push({
          insee,
          nom: cells[indexes.nom] ?? "",
          segment: cells[indexes.segment] ?? "",
        });
      }
    }
  }

  const seen = new Set();
  return rows.filter((row) => {
    if (seen.has(row.insee)) return false;
    seen.add(row.insee);
    return true;
  });
}

function parseSince(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("--since doit etre au format YYYY-MM-DD");
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) throw new Error(`Date invalide: ${value}`);
  return date;
}

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function extractDate(value) {
  if (value == null) return null;
  if (typeof value === "string") {
    const match = value.match(/\d{4}-\d{2}-\d{2}/);
    if (match) return match[0];
    const alt = value.match(/\d{2}\/\d{2}\/\d{4}/);
    if (alt) {
      const [dd, mm, yyyy] = alt[0].split("/");
      return `${yyyy}-${mm}-${dd}`;
    }
  }
  return null;
}

function isOnOrAfter(dateText, since) {
  if (!dateText) return false;
  const date = new Date(`${dateText}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date >= since;
}

function yearOf(dateText) {
  return dateText?.slice(0, 4) ?? "unknown";
}

function daysBetween(a, b) {
  const da = new Date(`${a}T00:00:00.000Z`);
  const db = new Date(`${b}T00:00:00.000Z`);
  if (Number.isNaN(da.getTime()) || Number.isNaN(db.getTime())) return Infinity;
  return Math.abs(da.getTime() - db.getTime()) / 86400000;
}

function collectStrings(value, out = []) {
  if (value == null) return out;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    out.push(String(value));
    return out;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectStrings(item, out);
    return out;
  }
  if (typeof value === "object") {
    for (const [key, item] of Object.entries(value)) {
      if (/^url|url$|href|lien|path|identifiant/i.test(key)) continue;
      collectStrings(item, out);
    }
  }
  return out;
}

function searchableText(value) {
  return normalizeText(collectStrings(value).join(" "));
}

function keywordHits(value, keywords) {
  const haystack = searchableText(value);
  return keywords.filter((keyword) => haystack.includes(normalizeText(keyword)));
}

function hasStrictMiseEnDemeure(value) {
  const haystack = searchableText(value);
  if (haystack.includes("levee")) return false;
  return STRICT_MISE_EN_DEMEURE_KEYWORDS.some((keyword) => haystack.includes(normalizeText(keyword)));
}

function pickFirst(obj, keys) {
  for (const key of keys) {
    if (obj?.[key] != null && obj[key] !== "") return obj[key];
  }
  return null;
}

function compactInstallation(site) {
  return {
    code_aiot: site.codeAIOT ?? site.codeAiot ?? site.code_aiot ?? null,
    raison_sociale: site.raisonSociale ?? site.raison_sociale ?? null,
    commune: site.commune ?? null,
    code_insee: site.codeInsee ?? site.code_insee ?? null,
    regime: site.regime ?? null,
    statut_seveso: site.statutSeveso ?? site.statut_seveso ?? null,
    ied: site.ied ?? null,
    priorite_nationale: site.prioriteNationale ?? null,
    etat_activite: site.etatActivite ?? site.etat_activite ?? null,
  };
}

function fileMeta(obj) {
  const file = obj?.fichierInspection ?? obj ?? {};
  return {
    identifiant_fichier: file.identifiantFichier ?? null,
    nom_fichier: file.nomFichier ?? null,
    type_fichier: file.typeFichier ?? null,
    date_fichier: file.dateFichier ?? null,
    url_pdf: file.urlFichier ?? null,
  };
}

function priorityHint(event) {
  const text = searchableText(event.structured);
  const hasAny = (keywords) => keywords.some((keyword) => text.includes(normalizeText(keyword)));

  if (event.mise_en_demeure_hint || hasAny(HIGH_PRIORITY_KEYWORDS)) return "P0";
  if (event.formal_doc_hint || event.formal_followup_hint || hasAny(MEDIUM_PRIORITY_KEYWORDS)) return "P1";
  if (event.kind === "inspection" && event.url_pdf) return "P2";
  if (event.kind === "document_hors_inspection") return "P2";
  return "";
}

function needsHumanReview(event) {
  return event.priority_hint === "P0" || event.priority_hint === "P1";
}

function extractInspection(site, inspection) {
  const date = extractDate(
    pickFirst(inspection, ["dateInspection", "date_inspection", "date", "dateDocument", "date_document"]),
  );
  const meta = fileMeta(inspection);
  const reviewHits = keywordHits(inspection, REVIEW_KEYWORDS);
  const event = {
    kind: "inspection",
    date,
    year: yearOf(date),
    review_hint: reviewHits.length > 0,
    review_keywords: reviewHits,
    formal_followup_hint: keywordHits(inspection, FORMAL_KEYWORDS).length > 0,
    formal_doc_hint: false,
    mise_en_demeure_hint: false,
    ...meta,
    installation: compactInstallation(site),
    structured: inspection,
  };
  event.priority_hint = priorityHint(event);
  event.human_review = needsHumanReview(event);
  return event;
}

function extractDocument(site, document) {
  const date = extractDate(
    pickFirst(document, [
      "dateDocument",
      "date_document",
      "dateFichier",
      "date_fichier",
      "date",
      "dateSignature",
      "date_signature",
      "datePublication",
      "date_publication",
    ]),
  );
  const reviewHits = keywordHits(document, REVIEW_KEYWORDS);
  const formalHits = keywordHits(document, FORMAL_KEYWORDS);
  const event = {
    kind: "document_hors_inspection",
    date,
    year: yearOf(date),
    review_hint: reviewHits.length > 0,
    review_keywords: reviewHits,
    formal_doc_hint: formalHits.length > 0,
    formal_keywords: formalHits,
    formal_followup_hint: false,
    mise_en_demeure_hint: hasStrictMiseEnDemeure(document),
    ...fileMeta(document),
    installation: compactInstallation(site),
    structured: document,
  };
  event.priority_hint = priorityHint(event);
  event.human_review = needsHumanReview(event);
  return event;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url) {
  let lastError = null;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": USER_AGENT,
        },
      });
      if (response.status === 429 || response.status >= 500) {
        const retryAfter = Number(response.headers.get("retry-after"));
        const waitMs = Number.isFinite(retryAfter) ? retryAfter * 1000 : attempt * 1500;
        lastError = new Error(`HTTP ${response.status} ${response.statusText}`);
        await sleep(waitMs);
        continue;
      }
      if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
      return { ok: true, json: await response.json() };
    } catch (error) {
      lastError = error;
      if (attempt < MAX_RETRIES) await sleep(attempt * 1000);
    }
  }
  return { ok: false, error: lastError?.message ?? "fetch failed" };
}

async function fetchCommune(insee) {
  const installations = [];
  const errors = [];
  let page = 1;
  let totalPages = null;

  while (totalPages == null || page <= totalPages) {
    const url = new URL(GEORISQUES_URL);
    url.searchParams.set("code_insee", insee);
    url.searchParams.set("page", String(page));
    url.searchParams.set("page_size", String(PAGE_SIZE));

    const result = await fetchJson(url.toString());
    if (!result.ok) {
      errors.push({ page, url: url.toString(), error: result.error });
      break;
    }

    const json = result.json;
    const batch = Array.isArray(json.data) ? json.data : [];
    installations.push(...batch);
    totalPages = Number(json.total_pages ?? 1);
    if (!Number.isFinite(totalPages) || totalPages < 1) totalPages = 1;
    if (batch.length === 0) break;
    page++;
  }

  return { installations, errors };
}

function summarizeCommune(commune, fetched, since) {
  const recentInspections = [];
  const recentDocs = [];
  const eventsByYear = {};

  for (const site of fetched.installations) {
    const inspections = Array.isArray(site.inspections) ? site.inspections : [];
    const documents = Array.isArray(site.documentsHorsInspection) ? site.documentsHorsInspection : [];

    for (const inspection of inspections) {
      const event = extractInspection(site, inspection);
      if (!isOnOrAfter(event.date, since)) continue;
      recentInspections.push(event);
      eventsByYear[event.year] = (eventsByYear[event.year] ?? 0) + 1;
    }

    for (const document of documents) {
      const event = extractDocument(site, document);
      if (!isOnOrAfter(event.date, since)) continue;
      recentDocs.push(event);
      eventsByYear[event.year] = (eventsByYear[event.year] ?? 0) + 1;
    }
  }

  const events = [...recentInspections, ...recentDocs].sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const formalDocs = recentDocs.filter((doc) => doc.formal_doc_hint);
  const miseEnDemeureDocs = recentDocs.filter((doc) => doc.mise_en_demeure_hint);
  const reviewHintEvents = events.filter((event) => event.review_hint);
  const inspectionsWithFormalFollowupHint = recentInspections.filter((event) => event.formal_followup_hint);
  const eventsToReview = events.filter((event) => event.human_review);

  let formalDocFoundNearby = 0;
  let formalDocMissingOrAmbiguous = 0;
  for (const inspection of inspectionsWithFormalFollowupHint) {
    const sameAiot = inspection.installation.code_aiot;
    const nearby = formalDocs.some((doc) => {
      if (sameAiot && doc.installation.code_aiot && sameAiot !== doc.installation.code_aiot) return false;
      return inspection.date && doc.date && daysBetween(inspection.date, doc.date) <= FORMAL_NEARBY_WINDOW_DAYS;
    });
    if (nearby) formalDocFoundNearby++;
    else formalDocMissingOrAmbiguous++;
  }

  const networkOk = fetched.errors.length === 0;
  const priorityCounts = { P0: 0, P1: 0, P2: 0 };
  for (const event of events) {
    if (event.priority_hint) priorityCounts[event.priority_hint]++;
  }

  return {
    insee: commune.insee,
    nom: commune.nom,
    segment: commune.segment,
    nb_installations: networkOk ? fetched.installations.length : null,
    inspections_12m: networkOk ? recentInspections.length : null,
    documents_hors_inspection_12m: networkOk ? recentDocs.length : null,
    documents_mise_en_demeure_12m: networkOk ? miseEnDemeureDocs.length : null,
    documents_formels_12m: networkOk ? formalDocs.length : null,
    documents_arretes_prescriptions_12m: networkOk ? formalDocs.length : null,
    review_hint_count: networkOk ? reviewHintEvents.length : null,
    inspections_with_formal_followup_hint: networkOk ? inspectionsWithFormalFollowupHint.length : null,
    formal_doc_found_nearby: networkOk ? formalDocFoundNearby : null,
    formal_doc_missing_or_ambiguous: networkOk ? formalDocMissingOrAmbiguous : null,
    raw_event_count: networkOk ? events.length : null,
    human_review_event_count: networkOk ? eventsToReview.length : null,
    priority_p0: networkOk ? priorityCounts.P0 : null,
    priority_p1: networkOk ? priorityCounts.P1 : null,
    priority_p2: networkOk ? priorityCounts.P2 : null,
    potential_fil_dossier_count: networkOk ? priorityCounts.P0 + priorityCounts.P1 : null,
    events_by_year: networkOk ? eventsByYear : null,
    fetch_status: networkOk ? "ok" : "partial_or_failed",
    errors: fetched.errors,
    recent_events: {
      inspections: networkOk ? recentInspections : [],
      documents_hors_inspection: networkOk ? recentDocs : [],
      all: networkOk ? events : [],
    },
  };
}

function csvEscape(value) {
  if (value == null) return "";
  const text = typeof value === "object" ? JSON.stringify(value) : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function rowsToCsv(rows, columns) {
  return [
    columns.join(","),
    ...rows.map((row) => columns.map((column) => csvEscape(row[column])).join(",")),
  ].join("\n");
}

function eventRows(communes) {
  const rows = [];
  for (const commune of communes) {
    for (const event of commune.recent_events.all) {
      rows.push({
        insee: commune.insee,
        nom: commune.nom,
        segment: commune.segment,
        date: event.date,
        year: event.year,
        kind: event.kind,
        priority_hint: event.priority_hint,
        human_review: event.human_review,
        review_keywords: event.review_keywords,
        formal_keywords: event.formal_keywords ?? [],
        mise_en_demeure_hint: event.mise_en_demeure_hint,
        formal_doc_hint: event.formal_doc_hint,
        formal_followup_hint: event.formal_followup_hint,
        installation_code_aiot: event.installation.code_aiot,
        installation_raison_sociale: event.installation.raison_sociale,
        installation_regime: event.installation.regime,
        installation_seveso: event.installation.statut_seveso,
        installation_ied: event.installation.ied,
        nom_fichier: event.nom_fichier,
        type_fichier: event.type_fichier,
        url_pdf: event.url_pdf,
      });
    }
  }
  return rows;
}

function outputPaths(outPath) {
  const parsed = path.parse(outPath);
  return {
    json: outPath,
    summaryCsv: path.join(parsed.dir, `${parsed.name}.summary.csv`),
    eventsCsv: path.join(parsed.dir, `${parsed.name}.events.csv`),
    statsJson: path.join(parsed.dir, `${parsed.name}.stats.json`),
    analyticsMd: path.join(parsed.dir, `${parsed.name}.analytics.md`),
    reviewDir: path.join(parsed.dir, "icpe-review"),
  };
}

function percentile(sortedValues, pct) {
  if (sortedValues.length === 0) return 0;
  const index = Math.ceil((pct / 100) * sortedValues.length) - 1;
  return sortedValues[Math.max(0, Math.min(sortedValues.length - 1, index))];
}

function computeStats(communes) {
  const successful = communes.filter((commune) => commune.fetch_status === "ok");
  const values = successful
    .map((commune) => commune.potential_fil_dossier_count ?? 0)
    .sort((a, b) => a - b);
  const totalEvents = successful.reduce((sum, commune) => sum + (commune.raw_event_count ?? 0), 0);
  const totalP0 = successful.reduce((sum, commune) => sum + (commune.priority_p0 ?? 0), 0);
  const totalP1 = successful.reduce((sum, commune) => sum + (commune.priority_p1 ?? 0), 0);
  const totalP0P1 = totalP0 + totalP1;

  return {
    communes_total: communes.length,
    communes_success: successful.length,
    communes_failed: communes.length - successful.length,
    total_events: totalEvents,
    total_p0: totalP0,
    total_p1: totalP1,
    total_p0p1: totalP0P1,
    median_p0p1_per_commune: percentile(values, 50),
    p75_p0p1_per_commune: percentile(values, 75),
    p90_p0p1_per_commune: percentile(values, 90),
    share_communes_with_zero_p0p1: successful.length
      ? successful.filter((commune) => (commune.potential_fil_dossier_count ?? 0) === 0).length / successful.length
      : null,
    share_communes_with_at_least_one_p0: successful.length
      ? successful.filter((commune) => (commune.priority_p0 ?? 0) > 0).length / successful.length
      : null,
    top_20_communes_by_p0p1: [...successful]
      .sort((a, b) => (b.potential_fil_dossier_count ?? 0) - (a.potential_fil_dossier_count ?? 0))
      .slice(0, 20)
      .map((commune) => ({
        insee: commune.insee,
        nom: commune.nom,
        segment: commune.segment,
        p0p1: commune.potential_fil_dossier_count ?? 0,
        p0: commune.priority_p0 ?? 0,
        p1: commune.priority_p1 ?? 0,
        raw_events: commune.raw_event_count ?? 0,
      })),
    ratio_p0p1_over_raw_events: totalEvents > 0 ? totalP0P1 / totalEvents : null,
  };
}

function average(values) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function percent(value) {
  if (value == null || Number.isNaN(value)) return "n/a";
  return `${(value * 100).toFixed(1)} %`;
}

function number(value) {
  if (value == null || Number.isNaN(value)) return "n/a";
  return new Intl.NumberFormat("fr-FR").format(value);
}

function decimal(value, digits = 2) {
  if (value == null || Number.isNaN(value)) return "n/a";
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

function docType(event) {
  if (event.kind === "inspection") return "inspection";
  const text = searchableText({
    type: event.type_fichier,
    nom: event.nom_fichier,
    structured: event.structured,
  });
  if (event.mise_en_demeure_hint || text.includes("ap_med") || text.includes("apmed")) return "AP_MED";
  if (text.includes("levee") && text.includes("mise en demeure")) return "AP_levee_MED";
  if (text.includes("apc") || text.includes("prescriptions complementaires")) return "APC";
  if (text.includes("autorisation")) return "AP_autorisation";
  if (text.includes("enregistrement") || text.includes("ape")) return "AP_enregistrement";
  if (text.includes("arrete") || text.includes(" ap ")) return "AP";
  return event.type_fichier || "document_hors_inspection";
}

function histogramP0P1(values) {
  return {
    "0": values.filter((value) => value === 0).length,
    "1": values.filter((value) => value === 1).length,
    "2": values.filter((value) => value === 2).length,
    "3": values.filter((value) => value === 3).length,
    "4": values.filter((value) => value === 4).length,
    "5": values.filter((value) => value === 5).length,
    ">5": values.filter((value) => value > 5).length,
    ">10": values.filter((value) => value > 10).length,
    ">20": values.filter((value) => value > 20).length,
  };
}

function concentration(rows, field, share) {
  const sorted = [...rows].sort((a, b) => (b[field] ?? 0) - (a[field] ?? 0));
  const take = Math.max(1, Math.ceil(sorted.length * share));
  const top = sorted.slice(0, take).reduce((sum, row) => sum + (row[field] ?? 0), 0);
  const total = sorted.reduce((sum, row) => sum + (row[field] ?? 0), 0);
  return {
    communes: take,
    events: top,
    share: total > 0 ? top / total : null,
  };
}

function markdownTable(headers, rows) {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.join(" | ")} |`),
  ].join("\n");
}

function computeAnalytics(communes) {
  const successful = communes.filter((commune) => commune.fetch_status === "ok");
  const events = successful.flatMap((commune) => commune.recent_events.all);
  const values = successful
    .map((commune) => commune.potential_fil_dossier_count ?? 0)
    .sort((a, b) => a - b);
  const stats = computeStats(communes);
  const p0p1Rows = successful.map((commune) => ({
    insee: commune.insee,
    nom: commune.nom,
    segment: commune.segment,
    nb_installations: commune.nb_installations ?? 0,
    raw: commune.raw_event_count ?? 0,
    p0: commune.priority_p0 ?? 0,
    p1: commune.priority_p1 ?? 0,
    p0p1: commune.potential_fil_dossier_count ?? 0,
  }));

  const docTypes = {};
  for (const event of events) {
    const type = docType(event);
    docTypes[type] = (docTypes[type] ?? 0) + 1;
  }

  const top100 = [...p0p1Rows]
    .sort((a, b) => b.p0p1 - a.p0p1 || b.raw - a.raw)
    .slice(0, 100);

  const factor = successful.length > 0 ? 34945 / successful.length : null;
  const communesWithEvent = successful.filter((commune) => (commune.raw_event_count ?? 0) > 0).length;
  const communesSilent = successful.filter((commune) => (commune.raw_event_count ?? 0) === 0).length;

  return {
    stats,
    values,
    mean: average(values),
    p95: percentile(values, 95),
    p99: percentile(values, 99),
    histogram: histogramP0P1(values),
    concentration: {
      "1pct": concentration(p0p1Rows, "p0p1", 0.01),
      "5pct": concentration(p0p1Rows, "p0p1", 0.05),
      "10pct": concentration(p0p1Rows, "p0p1", 0.1),
      "20pct": concentration(p0p1Rows, "p0p1", 0.2),
    },
    docTypes: Object.entries(docTypes).sort((a, b) => b[1] - a[1]),
    top100,
    reviewCost: [30, 60, 120].map((seconds) => ({
      seconds,
      hours: (stats.total_p0p1 * seconds) / 3600,
      days: (stats.total_p0p1 * seconds) / 3600 / 7,
    })),
    extrapolation: factor
      ? {
          factor,
          national_communes: 34945,
          raw_events: stats.total_events * factor,
          p0p1: stats.total_p0p1 * factor,
          communes_with_at_least_one_event: communesWithEvent * factor,
          communes_silent: communesSilent * factor,
        }
      : null,
  };
}

function analyticsMarkdown(payload) {
  const analytics = computeAnalytics(payload.communes);
  const { stats } = analytics;
  const lines = [
    "# ICPE A1/2 - analytics 10000",
    "",
    "> Rapport de mesure uniquement. Ne pas publier ni conclure automatiquement. Les PDF ne sont pas lus; les calculs utilisent les metadonnees JSON Georisques.",
    "",
    "## Volume",
    "",
    markdownTable(
      ["Mesure", "Valeur"],
      [
        ["Communes analysees", number(stats.communes_total)],
        ["Taux de succes", percent(stats.communes_total ? stats.communes_success / stats.communes_total : null)],
        ["Evenements bruts", number(stats.total_events)],
        ["Evenements P0", number(stats.total_p0)],
        ["Evenements P1", number(stats.total_p1)],
        ["P0+P1", number(stats.total_p0p1)],
        ["Ratio P0+P1 / brut", percent(stats.ratio_p0p1_over_raw_events)],
      ],
    ),
    "",
    "## Distribution",
    "",
    markdownTable(
      ["Mesure", "P0+P1 par commune"],
      [
        ["Mediane", number(stats.median_p0p1_per_commune)],
        ["Moyenne", decimal(analytics.mean, 2)],
        ["p75", number(stats.p75_p0p1_per_commune)],
        ["p90", number(stats.p90_p0p1_per_commune)],
        ["p95", number(analytics.p95)],
        ["p99", number(analytics.p99)],
      ],
    ),
    "",
    "### Histogramme P0/P1 par commune",
    "",
    markdownTable(
      ["Bucket", "Communes"],
      Object.entries(analytics.histogram).map(([bucket, count]) => [bucket, number(count)]),
    ),
    "",
    "## Concentration",
    "",
    "Indice de Pareto territorial: part des P0/P1 concentree dans les communes les plus productives.",
    "",
    markdownTable(
      ["Top communes", "Nb communes", "P0+P1 captes", "Part des P0+P1"],
      [
        ["1 %", number(analytics.concentration["1pct"].communes), number(analytics.concentration["1pct"].events), percent(analytics.concentration["1pct"].share)],
        ["5 %", number(analytics.concentration["5pct"].communes), number(analytics.concentration["5pct"].events), percent(analytics.concentration["5pct"].share)],
        ["10 %", number(analytics.concentration["10pct"].communes), number(analytics.concentration["10pct"].events), percent(analytics.concentration["10pct"].share)],
        ["20 %", number(analytics.concentration["20pct"].communes), number(analytics.concentration["20pct"].events), percent(analytics.concentration["20pct"].share)],
      ],
    ),
    "",
    "## Typologie",
    "",
    markdownTable(
      ["Type", "Evenements"],
      analytics.docTypes.slice(0, 30).map(([type, count]) => [type, number(count)]),
    ),
    "",
    "## Top 100 communes",
    "",
    markdownTable(
      ["Rang", "INSEE", "Commune", "Segment", "ICPE", "Evenements", "P0", "P1", "P0+P1"],
      analytics.top100.map((row, index) => [
        number(index + 1),
        row.insee,
        row.nom,
        row.segment,
        number(row.nb_installations),
        number(row.raw),
        number(row.p0),
        number(row.p1),
        number(row.p0p1),
      ]),
    ),
    "",
    "## Temps estime de revue humaine",
    "",
    markdownTable(
      ["Temps par P0/P1", "Heures/an", "Jours de 7 h/an"],
      analytics.reviewCost.map((row) => [`${row.seconds} s`, decimal(row.hours, 1), decimal(row.days, 1)]),
    ),
    "",
    "## Extrapolation prudente nationale",
    "",
    "Hypothese simple: l'echantillon est traite comme un proxy national, puis multiplie vers 34 945 communes. Ce n'est pas une verite statistique; c'est un ordre de grandeur pour dimensionner le probleme.",
    "",
  ];

  if (analytics.extrapolation) {
    lines.push(
      markdownTable(
        ["Mesure extrapolee", "Ordre de grandeur"],
        [
          ["Evenements bruts/an", number(Math.round(analytics.extrapolation.raw_events))],
          ["P0/P1/an", number(Math.round(analytics.extrapolation.p0p1))],
          ["Communes avec au moins un evenement", number(Math.round(analytics.extrapolation.communes_with_at_least_one_event))],
          ["Communes silencieuses", number(Math.round(analytics.extrapolation.communes_silent))],
          ["Facteur applique", decimal(analytics.extrapolation.factor, 2)],
        ],
      ),
    );
  } else {
    lines.push("_Extrapolation impossible: aucune commune fiable._");
  }

  lines.push("");
  return `${lines.join("\n")}\n`;
}

function reviewMarkdown(commune) {
  const title = `${commune.insee}${commune.nom ? ` - ${commune.nom}` : ""}`;
  const events = commune.recent_events.all.filter((event) => event.human_review);
  const lines = [
    `# ICPE A1/2 review - ${title}`,
    "",
    `Segment: ${commune.segment || ""}`,
    `Fetch: ${commune.fetch_status}`,
    `Installations: ${commune.nb_installations ?? "unknown"}`,
    `Evenements bruts 12m: ${commune.raw_event_count ?? "unknown"}`,
    `A relire humainement P0/P1: ${commune.human_review_event_count ?? "unknown"}`,
    `Potentiel dossiers Le Fil (proxy P0+P1): ${commune.potential_fil_dossier_count ?? "unknown"}`,
    "",
    "> Note: revue humaine uniquement. Ne pas publier ni conclure depuis ce fichier. Les PDF ne sont pas lus par le script.",
    "",
  ];

  if (commune.errors.length > 0) {
    lines.push("## Erreurs API", "");
    for (const error of commune.errors) lines.push(`- page ${error.page}: ${error.error}`);
    lines.push("");
  }

  lines.push("## Evenements a relire", "");
  if (events.length === 0) {
    lines.push("_Aucun evenement P0/P1 detecte dans les metadonnees JSON._", "");
  } else {
    for (const event of events) {
      lines.push(`### ${event.priority_hint} - ${event.date ?? "date inconnue"} - ${event.kind}`);
      lines.push(`- Installation: ${event.installation.raison_sociale ?? ""} (${event.installation.code_aiot ?? ""})`);
      lines.push(`- Fichier: ${event.type_fichier ?? ""} / ${event.nom_fichier ?? ""}`);
      lines.push(`- Signaux: ${[...(event.review_keywords ?? []), ...(event.formal_keywords ?? [])].join(", ")}`);
      if (event.url_pdf) lines.push(`- URL PDF: ${event.url_pdf}`);
      lines.push("");
    }
  }

  lines.push("## Tous les evenements 12m", "");
  for (const event of commune.recent_events.all) {
    lines.push(
      `- ${event.date ?? "date inconnue"} | ${event.priority_hint || "-"} | ${event.kind} | ${event.installation.raison_sociale ?? ""} | ${event.type_fichier ?? ""} | ${event.nom_fichier ?? ""}`,
    );
  }
  lines.push("");
  return lines.join("\n");
}

function safeFilePart(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function writeReviewMarkdown(reviewDir, communes) {
  await fs.mkdir(reviewDir, { recursive: true });
  const existing = await fs.readdir(reviewDir);
  await Promise.all(
    existing
      .filter((name) => name.endsWith(".md"))
      .map((name) => fs.unlink(path.join(reviewDir, name))),
  );
  await Promise.all(
    communes.map((commune) => {
      const name = `${commune.insee}-${safeFilePart(commune.nom || "commune")}.md`;
      return fs.writeFile(path.join(reviewDir, name), `${reviewMarkdown(commune)}\n`, "utf8");
    }),
  );
}

async function writeOutputs(outPath, payload, options = {}) {
  const paths = outputPaths(outPath);
  if (options.reviewDir) paths.reviewDir = path.resolve(options.reviewDir);
  await fs.mkdir(path.dirname(paths.json), { recursive: true });
  await fs.writeFile(paths.json, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  const summaryColumns = [
    "insee",
    "nom",
    "segment",
    "nb_installations",
    "inspections_12m",
    "documents_hors_inspection_12m",
    "documents_mise_en_demeure_12m",
    "documents_formels_12m",
    "documents_arretes_prescriptions_12m",
    "review_hint_count",
    "inspections_with_formal_followup_hint",
    "formal_doc_found_nearby",
    "formal_doc_missing_or_ambiguous",
    "raw_event_count",
    "human_review_event_count",
    "priority_p0",
    "priority_p1",
    "priority_p2",
    "potential_fil_dossier_count",
    "events_by_year",
    "fetch_status",
  ];
  await fs.writeFile(paths.summaryCsv, `${rowsToCsv(payload.communes, summaryColumns)}\n`, "utf8");

  const eventColumns = [
    "insee",
    "nom",
    "segment",
    "date",
    "year",
    "kind",
    "priority_hint",
    "human_review",
    "review_keywords",
    "formal_keywords",
    "mise_en_demeure_hint",
    "formal_doc_hint",
    "formal_followup_hint",
    "installation_code_aiot",
    "installation_raison_sociale",
    "installation_regime",
    "installation_seveso",
    "installation_ied",
    "nom_fichier",
    "type_fichier",
    "url_pdf",
  ];
  await fs.writeFile(paths.eventsCsv, `${rowsToCsv(eventRows(payload.communes), eventColumns)}\n`, "utf8");
  await writeReviewMarkdown(paths.reviewDir, payload.communes);
  await fs.writeFile(paths.statsJson, `${JSON.stringify(computeStats(payload.communes), null, 2)}\n`, "utf8");
  await fs.writeFile(paths.analyticsMd, analyticsMarkdown(payload), "utf8");

  return paths;
}

async function writeResumeJson(outPath, payload) {
  await fs.mkdir(path.dirname(outPath), { recursive: true });
  await fs.writeFile(outPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

async function readResumePayload(outPath) {
  try {
    const payload = JSON.parse(await fs.readFile(outPath, "utf8"));
    if (!Array.isArray(payload.communes)) return null;
    return payload;
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

async function runConcurrent(items, concurrency, worker) {
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    for (;;) {
      const index = cursor++;
      if (index >= items.length) return;
      await worker(items[index], index);
    }
  });
  await Promise.all(workers);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(usage());
    return;
  }
  if (!args.out) throw new Error("--out est obligatoire");

  const since = parseSince(args.since);
  const concurrency = Number(args.concurrency ?? 3);
  if (!Number.isInteger(concurrency) || concurrency < 1) throw new Error("--concurrency doit etre un entier positif");
  let communesInput = await readCommunes(args);
  if (communesInput.length === 0) throw new Error("Aucun code INSEE fourni (--insee ou --file)");

  if (args.limit) {
    const limit = Number(args.limit);
    if (!Number.isInteger(limit) || limit < 1) throw new Error("--limit doit etre un entier positif");
    communesInput = communesInput.slice(0, limit);
  }

  const payload = {
    meta: {
      generated_at: new Date().toISOString(),
      source: GEORISQUES_URL,
      since: args.since,
      window_label: "12m",
      doctrine:
        "Spike de rendement editorial. Ne jamais publier ni conclure depuis ces sorties. Les PDF ne sont jamais lus; les URL sont conservees pour revue humaine.",
      review_keywords: REVIEW_KEYWORDS,
      formal_keywords: FORMAL_KEYWORDS,
      priority_hint:
        "P0/P1/P2 calcules uniquement depuis les metadonnees JSON. P0 = mise en demeure/sanction/suspension/astreinte; P1 = arrete/prescriptions ou metadonnees a relire; P2 = evenement brut faible signal.",
      formal_nearby_window_days: FORMAL_NEARBY_WINDOW_DAYS,
      concurrency,
      resume: Boolean(args.resume),
    },
    communes: [],
  };

  const outPath = path.resolve(args.out);
  const resumePayload = args.resume ? await readResumePayload(outPath) : null;
  const existingByInsee = new Map();
  if (resumePayload) {
    for (const commune of resumePayload.communes) {
      if (commune?.insee && commune.fetch_status === "ok") existingByInsee.set(commune.insee, commune);
    }
    payload.meta.resumed_from = outPath;
    payload.meta.previous_generated_at = resumePayload.meta?.generated_at ?? null;
  }

  const results = new Array(communesInput.length);
  let reused = 0;
  const toFetch = [];
  for (const [index, commune] of communesInput.entries()) {
    const existing = existingByInsee.get(commune.insee);
    if (existing) {
      results[index] = { ...existing, nom: commune.nom || existing.nom, segment: commune.segment || existing.segment };
      reused++;
    } else {
      toFetch.push({ commune, index });
    }
  }

  let completed = reused;
  console.error(
    `ICPE A1/2: ${communesInput.length} commune(s), depuis ${args.since}, concurrency=${concurrency}, resume=${args.resume ? "on" : "off"}`,
  );
  if (reused > 0) console.error(`  reprise: ${reused} commune(s) deja presentes et fiables`);

  const checkpoint = async () => {
    payload.meta.generated_at = new Date().toISOString();
    payload.communes = results.filter(Boolean);
    await writeResumeJson(outPath, payload);
  };
  let checkpointChain = Promise.resolve();
  const queueCheckpoint = () => {
    checkpointChain = checkpointChain.then(checkpoint, checkpoint);
    return checkpointChain;
  };

  await runConcurrent(toFetch, concurrency, async ({ commune, index }) => {
    try {
      const fetched = await fetchCommune(commune.insee);
      results[index] = summarizeCommune(commune, fetched, since);
    } catch (error) {
      results[index] = summarizeCommune(
        commune,
        { installations: [], errors: [{ page: null, url: null, error: error.message }] },
        since,
      );
    }

    completed++;
    if (completed % 25 === 0 || completed === communesInput.length) {
      const failed = results.filter((commune) => commune?.fetch_status && commune.fetch_status !== "ok").length;
      console.error(`  progression ${completed}/${communesInput.length} (echecs/partiels: ${failed})`);
    }
    if (completed % 100 === 0 || completed === communesInput.length) {
      await queueCheckpoint();
    }
  });

  await queueCheckpoint();
  await writeOutputs(outPath, payload, { reviewDir: args["review-dir"] });

  const paths = outputPaths(outPath);
  if (args["review-dir"]) paths.reviewDir = path.resolve(args["review-dir"]);
  const failed = payload.communes.filter((commune) => commune.fetch_status !== "ok").length;
  console.error(`JSON:    ${paths.json}`);
  console.error(`Summary: ${paths.summaryCsv}`);
  console.error(`Events:  ${paths.eventsCsv}`);
  console.error(`Stats:   ${paths.statsJson}`);
  console.error(`Analytics: ${paths.analyticsMd}`);
  console.error(`Review:  ${paths.reviewDir}`);
  if (failed > 0) console.error(`Attention: ${failed} commune(s) avec fetch partiel/echec.`);
}

main().catch((error) => {
  console.error(`Echec: ${error.message}`);
  process.exit(1);
});
