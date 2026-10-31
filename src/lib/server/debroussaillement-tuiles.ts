import "server-only";
import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import {
  cleTuile, debroussaillementIndisponible, EDITION, lireDebroussaillement, manifesteValide, tuileValide, tuilesALire,
  FORMAT_TUILES_DEBROUSSAILLEMENT,
  type EntreeDebroussaillement, type LectureDebroussaillement, type ManifesteDebroussaillement, type TuileDebroussaillement,
} from "@/lib/debroussaillement";

// LE ZONAGE DU DÉBROUSSAILLEMENT OBLIGATOIRE (FUT-149), lu dans les tuiles publiées sur Supabase Storage
// (bucket privé, `scripts/debroussaillement/publier.mjs`). Même patron que la fibre à l'adresse (FUT-156).
//
// Une analyse lit une à quatre tuiles (9 Ko compressés en médiane). Ce que l'instance garde en mémoire, et
// pourquoi (contre-revue du 30/10/2026) :
//  - le POINTEUR `courant.json` (une centaine d'octets) est relu à l'origine toutes les dix minutes : c'est le
//    délai maximal pour qu'une bascule, ou un retour arrière, soit vu par une instance déjà démarrée ;
//  - le MANIFESTE (270 Ko pour l'édition nationale) n'est téléchargé que lorsque le pointeur en désigne un autre :
//    le pointeur porte son SHA-256, et la mémoire est indexée par cette empreinte. Avant, il était relu avec le
//    pointeur, toutes les dix minutes, par chaque instance ;
//  - les TUILES, immuables, sont gardées tant qu'il y a de la place, indexées par leur SHA-256 (celui du
//    manifeste) : une tuile mémorisée ne peut jamais servir un manifeste qui en attend une autre.
// Cette mémoire est celle d'UNE instance : chaque instance qui démarre (et chaque fonction : Autour, Logement)
// relit le pointeur et le manifeste une fois. Rien n'est partagé entre instances.
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
 * `frais` : le pointeur est réécrit à chaque bascule ; le CDN de Supabase peut servir l'ancienne version jusqu'à son
 * expiration. Un paramètre unique force la lecture à l'origine (doc Supabase, « Bypassing cache »). Le manifeste,
 * lu une fois par instance et par édition, l'est aussi à l'origine : une copie en cache d'un manifeste effacé puis
 * republié ferait échouer son empreinte. Les tuiles, immuables et vérifiées, gardent le cache.
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

const sha256 = (b: Buffer) => createHash("sha256").update(b).digest("hex");

/** Le pointeur écrit par `publier.mjs basculer` : l'édition, et l'empreinte de son manifeste. */
let pointeur: { edition: string; manifeste: string; jusqua: number } | null = null;
/** Le manifeste, indexé par son empreinte ; une promesse, pour que deux lectures simultanées ne le chargent qu'une fois. */
let manifeste: { sha256: string; promesse: Promise<ManifesteDebroussaillement> } | null = null;
const tuiles = new Map<string, TuileDebroussaillement>();

async function manifesteCourant(lire: Lecteur): Promise<ManifesteDebroussaillement> {
  if (!pointeur || pointeur.jusqua <= Date.now()) {
    const p = JSON.parse((await lire("courant.json", true)).toString("utf8")) as { format?: string; edition?: string; manifeste?: string };
    if (p?.format !== FORMAT_TUILES_DEBROUSSAILLEMENT || !EDITION.test(p.edition ?? "") || !/^[a-f0-9]{64}$/.test(p.manifeste ?? "")) throw new Error("pointeur illisible");
    pointeur = { edition: p.edition!, manifeste: p.manifeste!, jusqua: Date.now() + DUREE_POINTEUR_MS };
  }
  const { edition, manifeste: attendu } = pointeur;
  if (manifeste?.sha256 !== attendu) {
    const promesse = (async () => {
      const octets = await lire(`${edition}/manifest.json`, true);
      // L'empreinte vient de la bascule : un manifeste qui n'est pas celui que le pointeur désigne est une panne.
      if (sha256(octets) !== attendu) throw new Error("manifeste : empreinte différente du pointeur");
      const m: unknown = JSON.parse(octets.toString("utf8"));
      if (!manifesteValide(m) || m.edition !== edition) throw new Error("manifeste illisible");
      return m;
    })();
    manifeste = { sha256: attendu, promesse };
    // Un échec n'est pas gardé : la lecture suivante réessaie.
    promesse.catch(() => { if (manifeste?.promesse === promesse) manifeste = null; });
  }
  return manifeste!.promesse;
}

async function tuile(lire: Lecteur, m: ManifesteDebroussaillement, cle: string): Promise<TuileDebroussaillement> {
  const attendu = m.tuiles[cle];
  if (!attendu || "plein" in attendu) throw new Error(`${cle} : tuile absente du manifeste`);
  const memo = tuiles.get(`${cle}/${attendu.sha256}`);
  if (memo) return memo;
  const octets = await lire(`${m.edition}/t/${cle}.json.gz`);
  // L'empreinte vient de la construction : une tuile tronquée ou d'une autre édition est une panne.
  if (octets.length !== attendu.octets || sha256(octets) !== attendu.sha256) throw new Error(`${cle} : empreinte différente`);
  const [ix, iy] = cle.split("_").map(Number);
  const t: unknown = JSON.parse(gunzipSync(octets).toString("utf8"));
  if (!tuileValide(t, { edition: m.edition, ix, iy, profils: m.profils.length })) throw new Error(`${cle} : tuile illisible`);
  if (tuiles.size >= TUILES_EN_MEMOIRE) tuiles.delete(tuiles.keys().next().value!);
  tuiles.set(`${cle}/${attendu.sha256}`, t);
  return t;
}

/** Pour les tests : oublie le pointeur, le manifeste et les tuiles gardés en mémoire. */
export function oublierDebroussaillement() { pointeur = null; manifeste = null; tuiles.clear(); }

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
