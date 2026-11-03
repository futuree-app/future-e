import "server-only";
import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import {
  communesValides, FORMAT_PRIX_AUTOUR, lecturePrixDe, lireAutour, manifesteValide, tuilesPour, tuileValide,
  type CommunesPrixAutour, type ManifestePrixAutour, type TuilePrixAutour, type VentesAutour,
} from "@/lib/prix-autour";
import type { LngLat } from "@/lib/geo-distance";

// LES VENTES AUTOUR D'UNE ADRESSE (FUT-138), lues dans les tuiles publiées sur Supabase Storage (bucket privé,
// `scripts/dvf-autour/publier.mjs`). Même patron que le débroussaillement (FUT-149) et la fibre (FUT-156).
//
// LE JEU NATIONAL N'ENTRE DANS AUCUNE FONCTION. Aucun fichier de ventes n'est inclus dans le déploiement
// (`outputFileTracingIncludes` n'en cite aucun, et ce module ne lit pas le disque) : une lecture télécharge une à
// quatre tuiles de quelques kilo-octets (médiane 312 octets compressés, maximum 32 Ko, édition du 20/10/2026).
//
// LA RÉFÉRENCE COMMUNALE VOYAGE AVEC LES TUILES (`communes.json.gz`, 572 Ko, recopiée de l'index à la construction) :
// lire l'index national ici aurait ajouté 14 Mo à la fonction Autour (mesuré le 03/11/2026) pour deux nombres.
//
// Ce que l'instance garde en mémoire : le pointeur `courant.json` (relu à l'origine toutes les dix minutes), le
// manifeste et la référence communale désignés par leur empreinte, et au plus 256 tuiles immuables.
//
// Accès serveur seulement, par la clé de service ; rien n'est exposé au navigateur sauf le résultat agrégé.
// Désactivé tant que `PRIX_AUTOUR_BUCKET` n'est pas défini : `undefined`, et l'écran garde la référence communale.
// Ne lève jamais : une panne rend `null` (« indisponible »), jamais « trop peu de ventes ».

const DELAI_MS = 4_000;
const DUREE_POINTEUR_MS = 10 * 60_000;
const TUILES_EN_MEMOIRE = 256;

type Config = { url: string; cle: string; bucket: string };

/** `PRIX_AUTOUR_STORAGE_URL` remplace l'URL du projet pour la recette locale (`scripts/dvf-autour/serveur-local.mjs`). */
export function configPrixAutour(env: NodeJS.ProcessEnv = process.env): Config | null {
  const bucket = env.PRIX_AUTOUR_BUCKET;
  const url = env.PRIX_AUTOUR_STORAGE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
  const cle = env.SUPABASE_SERVICE_ROLE_KEY;
  return bucket && url && cle ? { url: url.replace(/\/$/, ""), cle, bucket } : null;
}

type Lecteur = (chemin: string, frais?: boolean) => Promise<Buffer>;

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
const EDITION = /^\d{4}-\d{2}-\d{2}(\.\d+)?$/;

let pointeur: { edition: string; manifeste: string; jusqua: number } | null = null;
let manifeste: { sha256: string; promesse: Promise<ManifestePrixAutour> } | null = null;
let communes: { sha256: string; promesse: Promise<CommunesPrixAutour> } | null = null;
const tuiles = new Map<string, TuilePrixAutour>();

async function manifesteCourant(lire: Lecteur): Promise<ManifestePrixAutour> {
  if (!pointeur || pointeur.jusqua <= Date.now()) {
    const p = JSON.parse((await lire("courant.json", true)).toString("utf8")) as { format?: string; edition?: string; manifeste?: string };
    if (p?.format !== FORMAT_PRIX_AUTOUR || !EDITION.test(p.edition ?? "") || !/^[a-f0-9]{64}$/.test(p.manifeste ?? "")) throw new Error("pointeur illisible");
    pointeur = { edition: p.edition!, manifeste: p.manifeste!, jusqua: Date.now() + DUREE_POINTEUR_MS };
  }
  const { edition, manifeste: attendu } = pointeur;
  if (manifeste?.sha256 !== attendu) {
    const promesse = (async () => {
      const octets = await lire(`${edition}/manifest.json`, true);
      if (sha256(octets) !== attendu) throw new Error("manifeste : empreinte différente du pointeur");
      const m: unknown = JSON.parse(octets.toString("utf8"));
      if (!manifesteValide(m) || m.edition !== edition) throw new Error("manifeste illisible");
      return m;
    })();
    manifeste = { sha256: attendu, promesse };
    promesse.catch(() => { if (manifeste?.promesse === promesse) manifeste = null; });
  }
  return manifeste!.promesse;
}

async function tuile(lire: Lecteur, m: ManifestePrixAutour, cle: string): Promise<TuilePrixAutour | null> {
  const attendu = m.tuiles[cle];
  // Une tuile absente du manifeste est une zone SANS AUCUNE VENTE : ce n'est pas une panne.
  if (!attendu) return null;
  const memo = tuiles.get(`${cle}/${attendu.sha256}`);
  if (memo) return memo;
  const octets = await lire(`${m.edition}/t/${cle}.json.gz`);
  if (octets.length !== attendu.octets || sha256(octets) !== attendu.sha256) throw new Error(`${cle} : empreinte différente`);
  const t: unknown = JSON.parse(gunzipSync(octets).toString("utf8"));
  if (!tuileValide(t, { edition: m.edition, tuile: cle })) throw new Error(`${cle} : tuile illisible`);
  if (tuiles.size >= TUILES_EN_MEMOIRE) tuiles.delete(tuiles.keys().next().value!);
  tuiles.set(`${cle}/${attendu.sha256}`, t);
  return t;
}

function referenceCommunale(lire: Lecteur, m: ManifestePrixAutour): Promise<CommunesPrixAutour> {
  if (communes?.sha256 !== m.communes.sha256) {
    const promesse = (async () => {
      const octets = await lire(`${m.edition}/communes.json.gz`);
      if (octets.length !== m.communes.octets || sha256(octets) !== m.communes.sha256) throw new Error("communes : empreinte différente");
      const c: unknown = JSON.parse(gunzipSync(octets).toString("utf8"));
      if (!communesValides(c, m.edition)) throw new Error("communes illisibles");
      return c;
    })();
    communes = { sha256: m.communes.sha256, promesse };
    promesse.catch(() => { if (communes?.promesse === promesse) communes = null; });
  }
  return communes!.promesse;
}

/** Pour les tests : oublie le pointeur, le manifeste, la référence communale et les tuiles gardés en mémoire. */
export function oublierPrixAutour() { pointeur = null; manifeste = null; communes = null; tuiles.clear(); }

/**
 * Les ventes des deux types autour de la position ENREGISTRÉE d'un dossier, et la commune de l'adresse (`insee`, code
 * local : l'arrondissement à Paris, Lyon, Marseille). `undefined` : la lecture n'est pas activée. `null` : elle a
 * échoué (réseau, fichier, empreinte), et l'écran le dit comme une indisponibilité.
 */
export async function lireVentesAutour(
  p: LngLat, insee: string, env: NodeJS.ProcessEnv = process.env, f: typeof fetch = fetch,
): Promise<VentesAutour | null | undefined> {
  const c = configPrixAutour(env);
  if (!c) return undefined;
  if (!Number.isFinite(p.lat) || !Number.isFinite(p.lon)) return null;
  const lire = lecteurStorage(c, f);
  try {
    const m = await manifesteCourant(lire);
    const chargees = new Map<string, TuilePrixAutour>();
    const [ref] = await Promise.all([
      referenceCommunale(lire, m),
      ...tuilesPour(p).map(async (k) => {
        const t = await tuile(lire, m, k);
        if (t) chargees.set(k, t);
      }),
    ]);
    return {
      edition: m.edition,
      livraison: m.livraison,
      periode: m.periode,
      appart: lireAutour(chargees, p, "appart"),
      maison: lireAutour(chargees, p, "maison"),
      commune: lecturePrixDe(ref, insee.trim()),
    };
  } catch (err) {
    console.error("[prix-autour] lecture échouée", String(err).slice(0, 160));
    return null;
  }
}
