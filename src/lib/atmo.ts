import "server-only";

const ATMO_BASE = "https://admindata.atmo-france.org/api";
const REQUEST_TIMEOUT_MS = 8000;

// ── Raw API types ────────────────────────────────────────────────────────────
type AtmoRawRecord = {
  code_zone?: string | null;
  date_ech?: string | null;
  code_qual?: string | number | null;
  code_pm25?: string | number | null;
  code_pm10?: string | number | null;
  code_no2?: string | number | null;
  code_o3?: string | number | null;
  source?: string | null;
};

// ── Public types ─────────────────────────────────────────────────────────────
export type AtmoLevel = {
  value: number;
  label: string;
  color: string;
};

export type AtmoAirQuality = {
  inseeCode: string;
  date: string;
  /** L'association agréée qui publie l'indice (« Atmo Grand Est », « Airparif »). */
  source: string | null;
  index: AtmoLevel;
  pollutants: {
    pm25: AtmoLevel | null;
    pm10: AtmoLevel | null;
    no2: AtmoLevel | null;
    o3: AtmoLevel | null;
  };
};

// ── Index scale ──────────────────────────────────────────────────────────────
const INDEX: Record<number, { label: string; color: string }> = {
  1: { label: "Bon", color: "#4ade80" },
  2: { label: "Moyen", color: "#a3e635" },
  3: { label: "Dégradé", color: "#facc15" },
  4: { label: "Mauvais", color: "#f97316" },
  5: { label: "Très mauvais", color: "#ef4444" },
  6: { label: "Extrêmement mauvais", color: "#991b1b" },
};

function toLevel(code: string | number | null | undefined): AtmoLevel | null {
  const n = Number(code);
  if (!n || !INDEX[n]) return null;
  return { value: n, ...INDEX[n] };
}

// ── Appels à ATMO : jeton, nouvelle tentative, journal (FUT-152, 29/10/2026) ──
// L'INCIDENT. Le 29/10/2026, deux 502 sans trace en production, en 150 ms sur une instance chaude. Mesuré le même
// jour : `admindata.atmo-france.org` répond par moments 500 (« Internal Server Error »), au login comme à la
// lecture, puis 200 quinze secondes plus tard avec le même jeton. Ce n'est ni un quota (pas de 429) ni un
// timeout. D'où trois règles :
//   - UNE seule nouvelle tentative, après 500 ms, sur un 5xx seulement. Jamais sur 401, 429, timeout, réseau ou
//     réponse illisible : ce ne sont pas des pannes passagères mesurées, et deux appels au plus par étape ;
//   - un jeton refusé (401) est oublié, sauf si un plus récent l'a déjà remplacé ; l'appel suivant se reconnecte ;
//   - une ligne de journal par incident (`atmo_incident`), sans identifiant, jeton, en-tête ni corps de réponse.
//     Une étape réussie du premier coup n'écrit rien.
// Le jeton ATMO vit 24 h (champ `exp`, relevé le 29/10/2026) ; il est gardé une heure, par prudence.
const PAUSE_AVANT_NOUVELLE_TENTATIVE_MS = 500;

type EtapeAtmo = "login" | "lecture" | "validation";
type CategorieAtmo = "http_5xx" | "http_401" | "http_429" | "http_4xx" | "timeout" | "reseau" | "forme_inattendue" | "configuration" | "interne";

/** Un échec qualifié d'une étape ATMO : ce que le journal en retient, rien de plus. */
class EchecAtmo extends Error {
  /** 2 quand l'échec suit une nouvelle tentative. */
  tentatives = 1;
  readonly etape: EtapeAtmo;
  readonly categorie: CategorieAtmo;
  readonly statut: number | null;
  constructor(etape: EtapeAtmo, categorie: CategorieAtmo, statut: number | null = null) {
    super(`ATMO ${etape} : ${categorie}${statut ? ` (${statut})` : ""}`);
    this.etape = etape;
    this.categorie = categorie;
    this.statut = statut;
  }
}

function categorieHttp(statut: number): CategorieAtmo {
  if (statut === 401) return "http_401";
  if (statut === 429) return "http_429";
  return statut >= 500 ? "http_5xx" : "http_4xx";
}

/** La trace d'un incident ATMO : une ligne JSON. Les champs sont fixes ; aucun ne vient d'un secret. */
function tracerIncidentAtmo(e: EchecAtmo, issue: "echec" | "retabli", dureeMs: number, tentatives: number): void {
  const ligne = JSON.stringify({
    evenement: "atmo_incident",
    etape: e.etape,
    statut: e.statut,
    categorie: e.categorie,
    duree_ms: Math.round(dureeMs),
    tentatives,
    issue,
  });
  if (issue === "echec") console.error(ligne);
  else console.warn(ligne);
}

/**
 * UN APPEL HTTP À ATMO, BORNÉ À 8 S, qualifié en cas d'échec. `lire` reçoit la réponse 2xx et rend la valeur ;
 * une erreur qu'il lève (JSON illisible, forme inattendue) est une réponse inattendue de cette étape.
 */
async function appelAtmo<T>(etape: "login" | "lecture", requete: (signal: AbortSignal) => Promise<Response>, lire: (res: Response) => Promise<T>): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    let res: Response;
    try {
      res = await requete(controller.signal);
    } catch {
      throw new EchecAtmo(etape, controller.signal.aborted ? "timeout" : "reseau");
    }
    if (!res.ok) throw new EchecAtmo(etape, categorieHttp(res.status), res.status);
    try {
      return await lire(res);
    } catch (e) {
      if (controller.signal.aborted) throw new EchecAtmo(etape, "timeout");
      if (e instanceof EchecAtmo) throw e;
      throw new EchecAtmo(etape === "lecture" ? "validation" : etape, "forme_inattendue");
    }
  } finally {
    clearTimeout(timeout);
  }
}

/** L'appel, puis au plus UNE nouvelle tentative après un 5xx. Une reprise réussie laisse une trace « retabli ». */
async function avecUneNouvelleTentative<T>(appel: () => Promise<T>): Promise<T> {
  const debut = performance.now();
  try {
    return await appel();
  } catch (e) {
    if (!(e instanceof EchecAtmo) || e.categorie !== "http_5xx") throw e;
    await new Promise((r) => setTimeout(r, PAUSE_AVANT_NOUVELLE_TENTATIVE_MS));
    try {
      const valeur = await appel();
      tracerIncidentAtmo(e, "retabli", performance.now() - debut, 2);
      return valeur;
    } catch (e2) {
      if (e2 instanceof EchecAtmo) e2.tentatives = 2;
      throw e2;
    }
  }
}

// ── Token cache (module-level, per serverless instance) ──────────────────────
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

async function getToken(): Promise<string> {
  const username = process.env.ATMO_USERNAME;
  const password = process.env.ATMO_PASSWORD;

  if (!username || !password) {
    throw new EchecAtmo("login", "configuration");
  }

  if (cachedToken && Date.now() < tokenExpiresAt - 60_000) {
    return cachedToken;
  }

  const token = await avecUneNouvelleTentative(() =>
    appelAtmo(
      "login",
      (signal) => fetch(`${ATMO_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        signal,
        cache: "no-store",
      }),
      async (res) => {
        const json = (await res.json()) as { token?: unknown; value?: unknown };
        const t = json.token ?? json.value;
        if (typeof t !== "string" || !t) throw new Error("jeton absent");
        return t;
      },
    ),
  );
  cachedToken = token;
  tokenExpiresAt = Date.now() + 60 * 60 * 1000;
  return token;
}

/** Oublie un jeton refusé, sauf si une autre requête l'a déjà remplacé par un plus récent. */
function oublierJeton(token: string): void {
  if (cachedToken !== token) return;
  cachedToken = null;
  tokenExpiresAt = 0;
}

// ── Fetch ────────────────────────────────────────────────────────────────────
async function fetchRecords(inseeCode: string, date: string): Promise<AtmoRawRecord[]> {
  const token = await getToken();

  const filter = JSON.stringify({
    code_zone: { operator: "=", value: inseeCode },
    date_ech: { operator: "=", value: date },
  });

  try {
    return await avecUneNouvelleTentative(() =>
      appelAtmo(
        "lecture",
        (signal) => fetch(
          `${ATMO_BASE}/data/112/${encodeURIComponent(filter)}?withGeom=false`,
          {
            headers: {
              accept: "application/json",
              authorization: `Bearer ${token}`,
            },
            signal,
            // Pas de cache de données Next : il garderait une heure une réponse 200 au contenu inattendu, que
            // `enregistrementsAtmo` refuse. Seule une lecture réussie est gardée, par la route.
            cache: "no-store",
          },
        ),
        async (res) => enregistrementsAtmo(await res.json()),
      ),
    );
  } catch (e) {
    if (e instanceof EchecAtmo && e.categorie === "http_401") oublierJeton(token);
    throw e;
  }
}

/** Une réponse ATMO dont la forme n'est pas celle documentée : une panne, jamais une absence d'indice. */
export class ReponseAtmoInattendue extends Error {}

const estObjet = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * LES ENREGISTREMENTS D'UNE RÉPONSE ATMO, OU UNE ERREUR (revue du 29/10/2026). Deux formes sont documentées : un
 * tableau d'enregistrements, ou un GeoJSON dont chaque `feature` porte ses `properties`. Tout le reste (objet
 * d'erreur, `features` absent, élément qui n'est pas un objet) LÈVE : avant, `json.features ?? []` en faisait
 * une liste vide, donc « aucun indice publié », gardée en cache comme un résultat valide.
 */
export function enregistrementsAtmo(json: unknown): AtmoRawRecord[] {
  if (Array.isArray(json) && json.every(estObjet)) return json as AtmoRawRecord[];
  if (estObjet(json) && Array.isArray(json.features) && json.features.every((f) => estObjet(f) && estObjet(f.properties))) {
    return (json.features as { properties: AtmoRawRecord }[]).map((f) => f.properties);
  }
  throw new ReponseAtmoInattendue("ATMO : réponse de forme inattendue");
}

/**
 * Un enregistrement → l'indice. `null` pour `code_qual` 0, que la nomenclature ATMO réserve à un indice
 * absent ; toute autre valeur hors de l'échelle 1 à 6 est une réponse inattendue, et LÈVE.
 */
export function parseRecord(raw: AtmoRawRecord, inseeCode: string, jourDemande?: string): AtmoAirQuality | null {
  if (raw.code_qual === 0 || raw.code_qual === "0") return null;
  const index = toLevel(raw.code_qual);
  if (!index) throw new ReponseAtmoInattendue(`ATMO : code_qual inattendu (${String(raw.code_qual)})`);
  // La date affichée est celle de l'indice. Un indice d'un autre jour que celui demandé est une réponse
  // inattendue : il ne doit jamais être présenté sous la date du jour.
  const date = typeof raw.date_ech === "string" ? raw.date_ech.slice(0, 10) : "";
  if (jourDemande && date !== jourDemande) throw new ReponseAtmoInattendue(`ATMO : indice du ${date || "?"} pour le ${jourDemande}`);

  return {
    inseeCode,
    date,
    source: typeof raw.source === "string" && raw.source.trim() ? raw.source.trim() : null,
    index,
    pollutants: {
      pm25: toLevel(raw.code_pm25),
      pm10: toLevel(raw.code_pm10),
      no2: toLevel(raw.code_no2),
      o3: toLevel(raw.code_o3),
    },
  };
}

// ── Load (with yesterday fallback) ─────────────────────────────────────────────
// FUT-152 : une panne LÈVE, une absence d'indice rend `null`. L'API couvre toutes les communes testées le
// 28/10/2026 (village de l'Ain, Corse, Réunion, Martinique) : un indice manquant n'est pas un « trou de
// couverture régional », et une panne ne doit jamais être présentée comme tel.
//
// LE JOUR EST CELUI DE PARIS (revue du 29/10/2026). `date_ech` est une date civile française (« 2026-10-29 ») ;
// le jour UTC retardait d'un jour entre minuit et 1 h (2 h en été), et servait alors l'indice de la veille.
// Relevé le 29/10/2026 : l'indice du 29 était publié dès le 28 à 15 h 44, celui du 30 pas encore.

/** La date civile à Paris, au format `AAAA-MM-JJ`. */
export function jourParis(t: number = Date.now()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(t);
}

// LA VEILLE EST LE JOUR CIVIL PRÉCÉDENT (contre-revue du 29/10/2026). Retirer 24 h à l'instant se trompait les
// soirs de changement d'heure, où deux jours français sont séparés de 23 ou 25 heures : le 30/03/2026 entre 0 h
// et 1 h, la « veille » tombait le 28 ; le 25/10/2026 entre 23 h et minuit, elle restait le 25. Le calcul se fait
// sur la date elle-même, sans durée.

/** Le jour civil qui précède `jour` (`AAAA-MM-JJ`), quelle que soit la durée de ce jour à Paris. */
export function veilleCivile(jour: string): string {
  const [a, m, j] = jour.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, j - 1)).toISOString().slice(0, 10);
}

async function load(inseeCode: string): Promise<AtmoAirQuality | null> {
  const today = jourParis();
  const records = await fetchRecords(inseeCode, today);
  const indice = records.length ? parseRecord(records[0], inseeCode, today) : null;
  if (indice) return indice;

  const yesterday = veilleCivile(today);
  const fallback = await fetchRecords(inseeCode, yesterday);
  return fallback.length ? parseRecord(fallback[0], inseeCode, yesterday) : null;
}

export type LectureAtmo =
  | { etat: "disponible"; indice: AtmoAirQuality }
  | { etat: "absent_dans_source" }
  | { etat: "indisponible" };

// ── Public API ─────────────────────────────────────────────────────────────────
// AUCUN RÉSULTAT N'EST MÉMORISÉ (revue du 29/10/2026). L'ancien cache gardait toute la journée la promesse
// résolue : une absence restait 404 après la publication d'ATMO, un indice de la veille restait servi après
// celui du jour. Seule reste la DÉDUPLICATION des lectures simultanées : une même commune demandée deux fois
// en même temps partage un seul appel, et l'entrée disparaît dès que cet appel aboutit ou échoue. La durée
// de conservation est celle, courte et bornée, de la route (`/api/atmo/[insee]`).
const enCours = new Map<string, Promise<AtmoAirQuality | null>>();

function lire(inseeCode: string): Promise<AtmoAirQuality | null> {
  const insee = inseeCode.trim();
  const deja = enCours.get(insee);
  if (deja) return deja;
  // L'échec définitif est tracé ICI, une fois par lecture partagée : deux demandes simultanées, une seule ligne.
  const debut = performance.now();
  const lecture = load(insee)
    .catch((e: unknown) => {
      const echec = e instanceof EchecAtmo ? e
        : new EchecAtmo("validation", e instanceof ReponseAtmoInattendue ? "forme_inattendue" : "interne");
      tracerIncidentAtmo(echec, "echec", performance.now() - debut, echec.tentatives);
      throw e;
    })
    .finally(() => enCours.delete(insee));
  enCours.set(insee, lecture);
  return lecture;
}

/** La lecture à trois états. Ne lève jamais. */
export async function lireAtmoCommune(inseeCode: string): Promise<LectureAtmo> {
  try {
    const indice = await lire(inseeCode);
    return indice ? { etat: "disponible", indice } : { etat: "absent_dans_source" };
  } catch {
    return { etat: "indisponible" };
  }
}

/** Contrat historique (page chaleur, aperçu du wizard) : `null` pour une absence comme pour une panne. */
export async function getAtmoForCommune(inseeCode: string): Promise<AtmoAirQuality | null> {
  return lire(inseeCode).catch(() => null);
}
