import "server-only";
import { gunzipSync } from "node:zlib";
import {
  cheminLot, communeDeCle, departementDe, fibreIndisponible, lectureDepuisCode, lotDe, lotValide, manifesteValide,
  type LectureFibre, type ManifesteFibre, type PointeurFibre, FORMAT_INDEX_FIBRE,
} from "@/lib/fibre-adresse";

// LA FIBRE À L'ADRESSE (FUT-156), lue dans l'index trimestriel publié sur Supabase Storage (bucket privé).
//
// Une analyse d'adresse fait UNE lecture : le lot de sa commune (quelques dizaines de Ko compressés). Le
// pointeur `courant.json` et le manifeste du millésime qu'il désigne sont gardés en mémoire de l'instance
// quelques minutes : publier un nouveau millésime, ou revenir au précédent, ne demande qu'une réécriture du
// pointeur, sans redéploiement. Le résultat est enregistré dans le rapport : rouvrir un dossier ne relit rien.
//
// Accès serveur seulement, par la clé de service déjà présente côté serveur ; rien n'est exposé au navigateur.
// Désactivé tant que `FIBRE_ADRESSE_BUCKET` n'est pas défini : la route n'écrit alors aucune lecture, et
// l'écran n'affiche rien (comme pour un rapport antérieur à FUT-156).
//
// Ne lève jamais. Une panne (réseau, fichier manquant, contenu illisible) rend `indisponible`, que l'écran
// dit comme telle et qui empêche une actualisation de remplacer une version qui avait la lecture.

const DELAI_MS = 4_000;
const DUREE_POINTEUR_MS = 10 * 60_000;

type Config = { url: string; cle: string; bucket: string };

export function configFibre(env: NodeJS.ProcessEnv = process.env): Config | null {
  const bucket = env.FIBRE_ADRESSE_BUCKET;
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const cle = env.SUPABASE_SERVICE_ROLE_KEY;
  return bucket && url && cle ? { url: url.replace(/\/$/, ""), cle, bucket } : null;
}

/**
 * `frais` : le pointeur et le manifeste sont réécrits en place lors d'une bascule ; le CDN de Supabase peut
 * servir l'ancienne version jusqu'à son expiration. Un paramètre unique force la lecture à l'origine (doc
 * Supabase, « Bypassing cache »). Les lots, immuables, gardent le cache.
 */
async function lireObjet(c: Config, chemin: string, frais = false): Promise<Buffer> {
  const nonce = frais ? `?cacheNonce=${Date.now()}` : "";
  const res = await fetch(`${c.url}/storage/v1/object/${encodeURIComponent(c.bucket)}/${chemin}${nonce}`, {
    headers: { Authorization: `Bearer ${c.cle}`, apikey: c.cle },
    signal: AbortSignal.timeout(DELAI_MS),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`${chemin} : HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

let courant: { manifeste: ManifesteFibre; jusqua: number } | null = null;

async function manifesteCourant(c: Config): Promise<ManifesteFibre> {
  if (courant && courant.jusqua > Date.now()) return courant.manifeste;
  const pointeur = JSON.parse((await lireObjet(c, "courant.json", true)).toString("utf8")) as PointeurFibre;
  if (pointeur?.format !== FORMAT_INDEX_FIBRE || !/^\d{4}T[1-4]$/.test(pointeur.millesime ?? "")) throw new Error("pointeur illisible");
  const m: unknown = JSON.parse((await lireObjet(c, `${pointeur.millesime}/manifest.json`, true)).toString("utf8"));
  if (!manifesteValide(m) || m.millesime !== pointeur.millesime) throw new Error("manifeste illisible");
  courant = { manifeste: m, jusqua: Date.now() + DUREE_POINTEUR_MS };
  return m;
}

/** Pour les tests : oublie le pointeur gardé en mémoire. */
export function oublierPointeurFibre() { courant = null; }

/**
 * La lecture de la fibre pour une adresse BAN. `undefined` : la lecture n'est pas activée (aucune variable
 * `FIBRE_ADRESSE_BUCKET`), rien n'est écrit dans le rapport.
 */
export async function lireFibreAdresse(banId: string | null, env: NodeJS.ProcessEnv = process.env): Promise<LectureFibre | undefined> {
  const c = configFibre(env);
  if (!c) return undefined;
  if (!banId) return undefined; // sans identifiant BAN, aucun rattachement n'est possible : rien n'est conclu
  const insee = communeDeCle(banId);
  if (!insee) return undefined;
  let meta: { millesime: string; donneesAu: string } | undefined;
  try {
    const m = await manifesteCourant(c);
    meta = { millesime: m.millesime, donneesAu: m.donneesAu };
    const dep = departementDe(insee);
    const n = m.lots[dep];
    // Un département que le millésime ne couvre pas : la lecture n'a pas pu se faire, ce n'est pas une absence.
    if (!n) return fibreIndisponible(meta);
    const lot = lotDe(insee, n);
    const brut = gunzipSync(await lireObjet(c, cheminLot(m.millesime, dep, lot)));
    const contenu: unknown = JSON.parse(brut.toString("utf8"));
    if (!lotValide(contenu, { millesime: m.millesime, departement: dep, lot })) throw new Error("lot illisible");
    return lectureDepuisCode(contenu.communes[insee]?.[banId.slice(insee.length + 1)], meta);
  } catch (e) {
    console.error("[fibre-adresse] lecture échouée", String(e).slice(0, 160));
    return fibreIndisponible(meta);
  }
}
