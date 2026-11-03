import "server-only";
import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import {
  blocValide, cleBlocDe, communesValides, departementDe, FORMAT_PRIX_AUTOUR, lecturePrixDe, lireAutour, manifesteValide,
  tuilesPour, tuileValide,
  type BlocPrixAutour, type CommunesPrixAutour, type Empreinte, type ManifestePrixAutour, type TuilePrixAutour, type VentesAutour,
} from "@/lib/prix-autour";
import type { LngLat } from "@/lib/geo-distance";

// LES VENTES À PROXIMITÉ D'UNE ADRESSE (FUT-138), lues sur Supabase Storage (bucket privé, `scripts/dvf-autour/publier.mjs`).
// Même patron que le débroussaillement (FUT-149) et la fibre (FUT-156).
//
// LE JEU NATIONAL N'ENTRE DANS AUCUNE FONCTION. Aucun fichier de ventes n'est inclus dans le déploiement (ce module ne lit
// pas le disque) ; la référence communale voyage avec les tuiles (lire l'index national ici ajoutait 14 Mo à la fonction).
//
// CE QU'UNE LECTURE TÉLÉCHARGE (édition du 20/10/2026, mesuré le 03/11/2026, voir docs/audits) :
//   - à froid : le pointeur, le manifeste (blocs et départements), un à quatre index de bloc, le fichier communal du
//     département, une à quatre tuiles ; quelques dizaines de Ko, et non plus 3 Mo (manifeste national + communes) ;
//   - à chaud : seulement les tuiles et index jamais vus par l'instance ; le pointeur est relu toutes les dix minutes.
// Tout objet autre que le pointeur est immuable et vérifié par son empreinte (taille et SHA-256) avant usage ; la
// mémoire est indexée par l'empreinte, jamais par le seul chemin.
//
// Accès serveur seulement, par la clé de service ; rien n'est exposé au navigateur sauf le résultat agrégé.
// Désactivé tant que `PRIX_AUTOUR_BUCKET` n'est pas défini : `undefined`, et le bloc ne s'affiche pas.
// Ne lève jamais : une panne rend `null` (« indisponible »), jamais « pas de médiane locale ».

const DELAI_MS = 4_000;
const DUREE_POINTEUR_MS = 10 * 60_000;
const OBJETS_EN_MEMOIRE = 512;

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
/** Les objets immuables (manifeste, index de bloc, fichiers communaux, tuiles), par chemin ET empreinte. */
const memoire = new Map<string, Promise<unknown>>();

/** Lit, vérifie, décode et garde un objet immuable. Un échec n'est pas gardé : la lecture suivante réessaie. */
function objet<T>(lire: Lecteur, chemin: string, attendu: Empreinte | { sha256: string }, decoder: (b: Buffer) => T, frais = false): Promise<T> {
  const cle = `${chemin}#${attendu.sha256}`;
  const deja = memoire.get(cle);
  if (deja) return deja as Promise<T>;
  const promesse = (async () => {
    const octets = await lire(chemin, frais);
    if (("octets" in attendu && octets.length !== attendu.octets) || sha256(octets) !== attendu.sha256) throw new Error(`${chemin} : empreinte différente`);
    return decoder(octets);
  })();
  if (memoire.size >= OBJETS_EN_MEMOIRE) memoire.delete(memoire.keys().next().value!);
  memoire.set(cle, promesse);
  promesse.catch(() => { if (memoire.get(cle) === promesse) memoire.delete(cle); });
  return promesse;
}

const json = (b: Buffer): unknown => JSON.parse(b.toString("utf8"));
const jsonGz = (b: Buffer): unknown => JSON.parse(gunzipSync(b).toString("utf8"));

async function manifesteCourant(lire: Lecteur): Promise<ManifestePrixAutour> {
  if (!pointeur || pointeur.jusqua <= Date.now()) {
    const p = JSON.parse((await lire("courant.json", true)).toString("utf8")) as { format?: string; edition?: string; manifeste?: string };
    if (p?.format !== FORMAT_PRIX_AUTOUR || !EDITION.test(p.edition ?? "") || !/^[a-f0-9]{64}$/.test(p.manifeste ?? "")) throw new Error("pointeur illisible");
    pointeur = { edition: p.edition!, manifeste: p.manifeste!, jusqua: Date.now() + DUREE_POINTEUR_MS };
  }
  const { edition, manifeste } = pointeur;
  // Le manifeste est relu à l'origine (frais) : une copie en cache d'un manifeste republié ferait échouer l'empreinte.
  return objet(lire, `${edition}/manifest.json`, { sha256: manifeste }, (b) => {
    const m = json(b);
    if (!manifesteValide(m) || m.edition !== edition) throw new Error("manifeste illisible");
    return m;
  }, true);
}

async function tuile(lire: Lecteur, m: ManifestePrixAutour, cle: string): Promise<TuilePrixAutour | null> {
  const b = cleBlocDe(cle);
  const eb = m.blocs[b];
  // Un bloc ou une tuile absents du manifeste sont des zones SANS AUCUNE VENTE : ce n'est pas une panne.
  if (!eb) return null;
  const bloc = await objet<BlocPrixAutour>(lire, `${m.edition}/b/${b}.json`, eb, (o) => {
    const x = json(o);
    if (!blocValide(x, { edition: m.edition, bloc: b })) throw new Error(`bloc ${b} illisible`);
    return x;
  });
  const et = bloc.tuiles[cle];
  if (!et) return null;
  return objet<TuilePrixAutour>(lire, `${m.edition}/t/${cle}.json.gz`, et, (o) => {
    const x = jsonGz(o);
    if (!tuileValide(x, { edition: m.edition, tuile: cle })) throw new Error(`${cle} : tuile illisible`);
    return x;
  });
}

async function communes(lire: Lecteur, m: ManifestePrixAutour, insee: string): Promise<CommunesPrixAutour | null> {
  const dep = departementDe(insee);
  const e = m.communes[dep];
  if (!e) return null;
  return objet<CommunesPrixAutour>(lire, `${m.edition}/c/${dep}.json.gz`, e, (o) => {
    const x = jsonGz(o);
    if (!communesValides(x, { edition: m.edition, departement: dep })) throw new Error(`communes ${dep} illisibles`);
    return x;
  });
}

/** Pour les tests et la mesure : oublie le pointeur et tous les objets gardés en mémoire (une instance à froid). */
export function oublierPrixAutour() { pointeur = null; memoire.clear(); }

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
      communes(lire, m, insee.trim()),
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
      commune: ref ? lecturePrixDe(ref, insee.trim()) : null,
    };
  } catch (err) {
    console.error("[prix-autour] lecture échouée", String(err).slice(0, 160));
    return null;
  }
}
