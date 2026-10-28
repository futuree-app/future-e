import "server-only";
import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import {
  cleTuile, debroussaillementIndisponible, lireDebroussaillement, manifesteValide, tuileValide, tuilesALire,
  FORMAT_TUILES_DEBROUSSAILLEMENT,
  type EntreeDebroussaillement, type LectureDebroussaillement, type ManifesteDebroussaillement, type TuileDebroussaillement,
} from "@/lib/debroussaillement";

// LE ZONAGE DU DÉBROUSSAILLEMENT OBLIGATOIRE (FUT-149), lu dans les tuiles publiées sur Supabase Storage
// (bucket privé, `scripts/debroussaillement/publier.mjs`). Même patron que la fibre à l'adresse (FUT-156).
//
// Une analyse lit une à quatre tuiles (9 Ko compressés en médiane). Le pointeur `courant.json` et le manifeste de
// l'édition qu'il désigne sont gardés en mémoire de l'instance dix minutes ; les tuiles, immuables, sont gardées
// tant qu'il y a de la place (le module Autour et le module Logement d'un même dossier lisent la même).
// Publier une nouvelle édition, ou revenir à la précédente, ne demande qu'une réécriture du pointeur.
//
// Accès serveur seulement, par la clé de service déjà présente côté serveur ; rien n'est exposé au navigateur.
// Désactivé tant que `DEBROUSSAILLEMENT_BUCKET` n'est pas défini : rien n'est lu, rien n'est écrit dans le
// rapport, et l'écran n'affiche rien (comme pour un rapport antérieur à FUT-149).
//
// Ne lève jamais. Une panne (réseau, fichier manquant, contenu illisible, empreinte fausse) rend `indisponible`,
// que l'écran dit comme telle, et qui empêche une actualisation de remplacer une version qui avait la lecture.

const DELAI_MS = 4_000;
const DUREE_POINTEUR_MS = 10 * 60_000;
const TUILES_EN_MEMOIRE = 64;

type Config = { url: string; cle: string; bucket: string };

/**
 * `DEBROUSSAILLEMENT_STORAGE_URL` remplace l'URL du projet Supabase pour la recette locale (un serveur de
 * fichiers qui imite l'API Storage) ; elle n'est pas définie en production.
 */
export function configDebroussaillement(env: NodeJS.ProcessEnv = process.env): Config | null {
  const bucket = env.DEBROUSSAILLEMENT_BUCKET;
  const url = env.DEBROUSSAILLEMENT_STORAGE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
  const cle = env.SUPABASE_SERVICE_ROLE_KEY;
  return bucket && url && cle ? { url: url.replace(/\/$/, ""), cle, bucket } : null;
}

type Lecteur = (chemin: string, frais?: boolean) => Promise<Buffer>;

/**
 * `frais` : le pointeur et le manifeste peuvent être réécrits lors d'une bascule ; le CDN de Supabase peut servir
 * l'ancienne version jusqu'à son expiration. Un paramètre unique force la lecture à l'origine (doc Supabase,
 * « Bypassing cache »). Les tuiles, immuables, gardent le cache.
 */
function lecteurStorage(c: Config, f: typeof fetch): Lecteur {
  return async (chemin, frais = false) => {
    const nonce = frais ? `?cacheNonce=${Date.now()}` : "";
    const res = await f(`${c.url}/storage/v1/object/${encodeURIComponent(c.bucket)}/${chemin}${nonce}`, {
      headers: { Authorization: `Bearer ${c.cle}`, apikey: c.cle },
      signal: AbortSignal.timeout(DELAI_MS),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`${chemin} : HTTP ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  };
}

let courant: { manifeste: ManifesteDebroussaillement; jusqua: number } | null = null;
const tuiles = new Map<string, TuileDebroussaillement>();

async function manifesteCourant(lire: Lecteur): Promise<ManifesteDebroussaillement> {
  if (courant && courant.jusqua > Date.now()) return courant.manifeste;
  const pointeur = JSON.parse((await lire("courant.json", true)).toString("utf8")) as { format?: string; edition?: string };
  if (pointeur?.format !== FORMAT_TUILES_DEBROUSSAILLEMENT || !/^\d{4}-\d{2}-\d{2}$/.test(pointeur.edition ?? "")) throw new Error("pointeur illisible");
  const m: unknown = JSON.parse((await lire(`${pointeur.edition}/manifest.json`, true)).toString("utf8"));
  if (!manifesteValide(m) || m.edition !== pointeur.edition) throw new Error("manifeste illisible");
  courant = { manifeste: m, jusqua: Date.now() + DUREE_POINTEUR_MS };
  return m;
}

async function tuile(lire: Lecteur, m: ManifesteDebroussaillement, cle: string): Promise<TuileDebroussaillement> {
  const memo = tuiles.get(`${m.edition}/${cle}`);
  if (memo) return memo;
  const attendu = m.tuiles[cle];
  if (!attendu || "plein" in attendu) throw new Error(`${cle} : tuile absente du manifeste`);
  const octets = await lire(`${m.edition}/t/${cle}.json.gz`);
  // L'empreinte vient de la construction : une tuile tronquée ou d'une autre édition est une panne.
  if (octets.length !== attendu.octets || createHash("sha256").update(octets).digest("hex") !== attendu.sha256) throw new Error(`${cle} : empreinte différente`);
  const [ix, iy] = cle.split("_").map(Number);
  const t: unknown = JSON.parse(gunzipSync(octets).toString("utf8"));
  if (!tuileValide(t, { edition: m.edition, ix, iy, profils: m.profils.length })) throw new Error(`${cle} : tuile illisible`);
  if (tuiles.size >= TUILES_EN_MEMOIRE) tuiles.delete(tuiles.keys().next().value!);
  tuiles.set(`${m.edition}/${cle}`, t);
  return t;
}

/** Pour les tests : oublie le pointeur et les tuiles gardés en mémoire. */
export function oublierDebroussaillement() { courant = null; tuiles.clear(); }

/**
 * La lecture du zonage pour une adresse. `undefined` : la lecture n'est pas activée (aucune variable
 * `DEBROUSSAILLEMENT_BUCKET`), rien n'est écrit dans le rapport.
 */
export async function lireDebroussaillementAdresse(
  e: EntreeDebroussaillement, env: NodeJS.ProcessEnv = process.env, f: typeof fetch = fetch,
): Promise<LectureDebroussaillement | undefined> {
  const c = configDebroussaillement(env);
  if (!c) return undefined;
  const lire = lecteurStorage(c, f);
  let m: ManifesteDebroussaillement | null = null;
  try {
    m = await manifesteCourant(lire);
    const cles = tuilesALire(m, e);
    const chargees = new Map<string, TuileDebroussaillement>();
    await Promise.all(cles.map(async (k) => { chargees.set(k, await tuile(lire, m!, k)); }));
    return lireDebroussaillement(m, chargees, e);
  } catch (err) {
    console.error("[debroussaillement] lecture échouée", String(err).slice(0, 160));
    return debroussaillementIndisponible(e, m);
  }
}

export { cleTuile };
