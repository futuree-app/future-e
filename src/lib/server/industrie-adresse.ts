import "server-only";
import { EN_TETES_GEORISQUES, tracerEchecGeorisques } from "@/lib/georisques-http";
import { communeParent } from "@/lib/plm";
import { SEVESO_RAYON_KM } from "@/lib/data/installations-seveso";
import { getSevesoAutour } from "@/lib/server/installations-seveso";
import { lirePagePprt, type LectureIndustrieAdresse, type PrecisionPoint } from "@/lib/industrie-adresse";

// LES RISQUES INDUSTRIELS À L'ADRESSE (FUT-167, D2), collectés avec le reste du module Logement.
//
// APPELS : deux, en parallèle, plus un fichier local.
//   - `/api/v2/gaspar/pprt?latitude&longitude` (jeton Géorisques) : les plans dont le zonage couvre le point ;
//   - `/api/v1/gaspar/pprt?codeInsee` : les plans de la commune. Paris, Lyon, Marseille : le code de la VILLE
//     (vérifié le 30/10/2026 : 69123 rend « Vallée de la chimie », 69387 ne rend rien) ;
//   - les sites Seveso de l'index local (`data/installations-seveso.json`), sans réseau.
// Délai : 8 s par appel, une reprise après échec, sous le plus lent des appels déjà faits par la route. Aucune mise en cache partagée de
// la lecture au point (elle porte une adresse) ; la liste communale est mise en cache une journée.
// PANNE : chaque lecture a son état ; une panne n'est jamais une absence (`industrie-adresse.ts`).

const BASE = "https://www.georisques.gouv.fr";
const DELAI_MS = 8000;

/** Une seconde tentative après une coupure : Géorisques réinitialise parfois la connexion (ECONNRESET, 30/10/2026). */
async function lireAvecReprise(url: string, init: RequestInit): Promise<unknown | null> {
  return (await lire(url, init)) ?? (await lire(url, init));
}

async function lire(url: string, init: RequestInit): Promise<unknown | null> {
  try {
    const r = await fetch(url, { ...init, signal: AbortSignal.timeout(DELAI_MS) });
    if (!r.ok) { tracerEchecGeorisques(url, { statut: r.status }); return null; }
    return await r.json();
  } catch (e) {
    tracerEchecGeorisques(url, { erreur: e });
    return null;
  }
}

export async function getIndustrieAdresse(o: {
  lat: number; lon: number; citycode: string | null; precision: PrecisionPoint;
}): Promise<LectureIndustrieAdresse> {
  const jeton = process.env.GEORISQUES_API_TOKEN;
  const commune = o.citycode ? communeParent(o.citycode) : null;
  const point = new URLSearchParams({ latitude: String(o.lat), longitude: String(o.lon), pageSize: "50", pageNumber: "0" });
  const [seveso, auPoint, surCommune] = await Promise.all([
    getSevesoAutour(o.lat, o.lon, SEVESO_RAYON_KM),
    jeton
      ? lireAvecReprise(`${BASE}/api/v2/gaspar/pprt?${point}`, { headers: { ...EN_TETES_GEORISQUES, authorization: `Bearer ${jeton}` }, cache: "no-store" })
      : Promise.resolve(null),
    commune
      ? lireAvecReprise(`${BASE}/api/v1/gaspar/pprt?codeInsee=${encodeURIComponent(commune)}&page_size=100`, { headers: EN_TETES_GEORISQUES, next: { revalidate: 86_400 } })
      : Promise.resolve(null),
  ]);
  const pointLu = lirePagePprt(auPoint);
  const communeLue = lirePagePprt(surCommune);
  return {
    precision: o.precision,
    seveso: seveso.etat === "lu"
      ? {
        etat: "lu", extraitLe: seveso.extraitLe, rayonKm: seveso.rayonKm,
        sites: seveso.sites.map((s) => ({
          code: s.code, nom: s.nom, seuil: s.seuil, etat: s.etat, commune: s.commune,
          // Au mètre près, une distance à un point publié laisserait croire à une mesure : arrondie à 10 m.
          distanceKm: Math.round(s.distanceKm * 100) / 100, approchee: s.approchee, decimales: s.decimales,
        })),
      }
      : { etat: "indisponible" },
    // FUT-163 (31/10/2026) : une page au point INCOMPLÈTE (moins de plans lus que `totalElements`) était lue
    // comme complète : zéro plan lu y devenait « aucun PPRT à cette adresse ». Elle porte désormais le total
    // annoncé (`annonces`) : sans plan lu, la réponse est « non déterminable » ; avec un plan lu, il est dit,
    // sans prétendre que la liste est complète. Même exigence que la lecture communale ci-dessous.
    pprtPoint: !pointLu
      ? { etat: "indisponible" }
      : pointLu.complete
        ? { etat: "lu", plans: pointLu.plans }
        : { etat: "lu", plans: pointLu.plans, annonces: pointLu.total },
    pprtCommune: communeLue && communeLue.complete
      ? { etat: "lu", plans: communeLue.plans.map((p) => ({ id: p.id, nom: p.nom })) }
      : { etat: "indisponible" },
  };
}
