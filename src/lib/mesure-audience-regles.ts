// ════════════════════════════════════════════════════════════════════════════════════════════
// FUT-181 · LES RÈGLES DE LA MESURE D'AUDIENCE, SANS POSTHOG (fonctions pures, testées sous node).
//
// UNE SEULE SOURCE DE VÉRITÉ : `localStorage["futuree-consent"]`, écrit par `ConsentBanner`
// ("granted" ou "denied"). Ce module ne fait que la LIRE. Seule la valeur exacte "granted" vaut
// consentement : absente, "denied", autre chose, stockage illisible (navigation privée, stockage
// bloqué) ou rendu serveur, la réponse est non. Un test lie la clé et les valeurs à la bannière.
//
// Le pilotage de PostHog lui-même (initialisation, retrait, identité) est dans `mesure-audience.ts`.
// Ici : ce qui décide (le consentement), ce qui réduit (les URLs et les textes qui partiraient avec
// un événement) et ce qui efface (les traces que PostHog laisse dans le navigateur).
// ════════════════════════════════════════════════════════════════════════════════════════════

export const CLE_CONSENTEMENT_MESURE = "futuree-consent";

// La bannière prévient de chaque changement de choix dans CET onglet. Les autres onglets l'apprennent
// par l'événement `storage`, que le navigateur émet seul.
export const EVENEMENT_CHANGEMENT_CONSENTEMENT = "futuree:consent-change";

export type ConsentementMesure = "granted" | "denied" | null;

export function lireConsentementMesure(stockage?: Pick<Storage, "getItem"> | null): ConsentementMesure {
  try {
    const s = stockage ?? (typeof window !== "undefined" ? window.localStorage : null);
    const v = s?.getItem(CLE_CONSENTEMENT_MESURE);
    return v === "granted" || v === "denied" ? v : null;
  } catch {
    return null;
  }
}

export function mesureConsentie(stockage?: Pick<Storage, "getItem"> | null): boolean {
  return lireConsentementMesure(stockage) === "granted";
}

// ── Les URLs ──────────────────────────────────────────────────────────────────────────────────
//
// Une URL de futur•e peut porter une adresse (`/checkout/dossier?label=…&banId=…`), un identifiant
// de dossier (`?dossierId=`), le retour de Stripe (`?payment_intent=…&payment_intent_client_secret=…`)
// ou un jeton d'authentification. posthog-js joint l'URL courante à CHAQUE événement, le référent, les
// liens cliqués (`attr__href`, que le masquage des attributs ne retire pas) et les clés des heatmaps.
//
// Règle : on garde le chemin et SEULEMENT les paramètres listés ici, qui décrivent une commune ou une
// campagne, jamais une personne. Le fragment (`#…`) part toujours. Un paramètre nouveau est donc
// retiré tant qu'on ne l'a pas ajouté exprès.
export const PARAMETRES_URL_CONSERVES: ReadonlySet<string> = new Set([
  "insee",
  "communes",
  "mode",
  "source",
  "rank",
  "horizon",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
]);

const SCHEMA = /^[a-z][a-z0-9+.-]*:/i;

export function nettoyerUrl(brute: string): string {
  if (!/[?#]/.test(brute)) return brute;
  const absolue = SCHEMA.test(brute);
  let u: URL;
  try {
    u = new URL(brute, "https://base.invalid");
  } catch {
    return brute.split(/[?#]/)[0];
  }
  const gardes = new URLSearchParams();
  for (const [k, v] of u.searchParams) if (PARAMETRES_URL_CONSERVES.has(k)) gardes.append(k, v);
  const q = gardes.toString();
  let base: string;
  if (!absolue) base = u.pathname;
  else if (u.protocol === "http:" || u.protocol === "https:") base = `${u.origin}${u.pathname}`;
  else base = `${u.protocol}${u.pathname}`; // mailto:, tel: : la requête (sujet, corps) part aussi
  return q ? `${base}?${q}` : base;
}

// Une URL au milieu d'un texte : chaîne d'éléments de l'autocapture, message d'exception.
const URL_DANS_TEXTE = /(?:[a-z][a-z0-9+.-]*:\/\/|\/)[^\s"'<>`]*[?#][^\s"'<>`]*/gi;

export function nettoyerUrlsDansTexte(texte: string): string {
  if (!/[?#]/.test(texte)) return texte;
  return texte.replace(URL_DANS_TEXTE, (m) => nettoyerUrl(m));
}

const RESSEMBLE_A_UNE_URL = /^(?:[a-z][a-z0-9+.-]*:|\/)/i;

type Proprietes = Record<string, unknown>;

function nettoyerProprietes(p: Proprietes | undefined): Proprietes | undefined {
  if (!p || typeof p !== "object") return p;
  const sortie: Proprietes = {};
  for (const [k, v] of Object.entries(p)) {
    if (typeof v === "string") {
      sortie[k] = k === "$elements_chain" ? nettoyerUrlsDansTexte(v) : RESSEMBLE_A_UNE_URL.test(v) ? nettoyerUrl(v) : v;
    } else if (k === "$elements" && Array.isArray(v)) {
      sortie[k] = v.map((el) => {
        if (!el || typeof el !== "object") return el;
        const e = { ...(el as Proprietes) };
        for (const a of ["attr__href", "href"]) if (typeof e[a] === "string") e[a] = nettoyerUrl(e[a] as string);
        return e;
      });
    } else if (k === "$heatmap_data" && v && typeof v === "object" && !Array.isArray(v)) {
      const h: Proprietes = {};
      for (const [url, points] of Object.entries(v as Proprietes)) {
        const cle = nettoyerUrl(url);
        h[cle] = Array.isArray(h[cle]) && Array.isArray(points) ? [...(h[cle] as unknown[]), ...points] : points;
      }
      sortie[k] = h;
    } else if (k === "$exception_list" && Array.isArray(v)) {
      sortie[k] = v.map((ex) => {
        if (!ex || typeof ex !== "object") return ex;
        const e = { ...(ex as Proprietes) };
        if (typeof e.value === "string") e.value = nettoyerUrlsDansTexte(e.value);
        return e;
      });
    } else {
      sortie[k] = v;
    }
  }
  return sortie;
}

// Forme minimale d'un événement posthog-js (`CaptureResult`), pour rester testable sans le SDK.
export type EvenementMesure = { event: string; properties: Proprietes; $set?: Proprietes; $set_once?: Proprietes };

export function nettoyerEvenement<E extends EvenementMesure>(e: E): E {
  const sortie = { ...e, properties: nettoyerProprietes(e.properties) ?? {} };
  if (e.$set) sortie.$set = nettoyerProprietes(e.$set);
  if (e.$set_once) sortie.$set_once = nettoyerProprietes(e.$set_once);
  return sortie;
}

// ── Les traces de PostHog dans le navigateur ─────────────────────────────────────────────────
//
// posthog-js écrit : le cookie et l'entrée locale `ph_<jeton>_posthog` (identifiant anonyme, session,
// propriétés), des entrées de session `ph_<jeton>_window_id`…, et son propre marqueur de consentement
// `__ph_opt_in_out_<jeton>`. Aucune clé de futur•e ne commence par ces préfixes (vérifié par un test).
// Elles sont effacées dès que la mesure n'est pas consentie : au retrait, au refus, et à chaque page
// sans consentement, ce qui retire aussi les identifiants déposés avant FUT-181, quand PostHog
// démarrait sans condition.
export const PREFIXES_STOCKAGE_POSTHOG = ["ph_", "__ph_opt_in_out_"] as const;

export function estCleStockagePostHog(cle: string): boolean {
  return PREFIXES_STOCKAGE_POSTHOG.some((p) => cle.startsWith(p));
}

// Les domaines sur lesquels un cookie a pu être posé : l'hôte, puis chaque domaine parent
// (posthog-js pose son cookie sur le domaine le plus large qui l'accepte, `.futur-e.fr`).
export function domainesDeCookie(hote: string): string[] {
  const parties = hote.split(".");
  const domaines: string[] = [];
  for (let i = 0; i < parties.length - 1; i++) domaines.push(parties.slice(i).join("."));
  return domaines;
}

type Environnement = {
  local?: Pick<Storage, "key" | "length" | "removeItem"> | null;
  session?: Pick<Storage, "key" | "length" | "removeItem"> | null;
  document?: { cookie: string } | null;
  hote?: string;
};

function viderStockage(s: Pick<Storage, "key" | "length" | "removeItem"> | null | undefined): void {
  if (!s) return;
  const cles: string[] = [];
  for (let i = 0; i < s.length; i++) {
    const k = s.key(i);
    if (k && estCleStockagePostHog(k)) cles.push(k);
  }
  for (const k of cles) s.removeItem(k);
}

export function purgerTracesPostHog(env?: Environnement): void {
  const navigateur = typeof window !== "undefined";
  const e: Environnement = env ?? {
    local: navigateur ? safe(() => window.localStorage) : null,
    session: navigateur ? safe(() => window.sessionStorage) : null,
    document: typeof document !== "undefined" ? document : null,
    hote: navigateur ? window.location.hostname : "",
  };
  try { viderStockage(e.local); } catch { /* stockage bloqué : rien à effacer */ }
  try { viderStockage(e.session); } catch { /* idem */ }
  try {
    if (!e.document) return;
    const noms = e.document.cookie.split(";").map((c) => c.split("=")[0].trim()).filter((n) => n && estCleStockagePostHog(n));
    for (const nom of noms) {
      e.document.cookie = `${nom}=; Max-Age=0; path=/`;
      for (const d of domainesDeCookie(e.hote ?? "")) e.document.cookie = `${nom}=; Max-Age=0; path=/; domain=${d}`;
    }
  } catch { /* cookies inaccessibles */ }
}

function safe<T>(f: () => T): T | null {
  try { return f(); } catch { return null; }
}
