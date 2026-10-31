import "server-only";
import { getCommuneEntry, type IndexCommune } from "@/lib/comparateur-vie";
import { buildSanteFacts } from "@/lib/decision/sante-facts";
import { getRadonPotentiel } from "@/lib/radon";
import { arrondissementsDe, communeParent } from "@/lib/plm";
import { SEVESO_RAYON_KM } from "@/lib/data/installations-seveso";
import { getSevesoAutour, getSevesoExtraitLe } from "@/lib/server/installations-seveso";
import { lireSanteEnvironnementale, type CarteSante, type LectureLocale } from "@/lib/sante-environnementale";

// LA CARTE « SANTÉ ENVIRONNEMENTALE » DU MODULE TERRITOIRE (FUT-167, D1), assemblée à l'ouverture de la page.
//
// LUE À CÔTÉ DU SNAPSHOT, JAMAIS DEDANS, comme les incendies (FUT-147) et la fibre (FUT-148). Le snapshot sert
// d'empreinte au cache de la synthèse rédigée ; ces lectures n'y entrent pas (la synthèse ne les reçoit pas), et
// un dossier déjà vendu garde ses constats tels quels : la carte est un complément DATÉ, qui le dit.
//
// COÛT. L'air, le calcul d'exposition industrielle et le bruit sont dans l'index déjà chargé par la page ; les
// sites Seveso dans un fichier local lu une fois par instance. Seul le radon est un appel (Géorisques, cache de
// 30 jours, déjà fait par le moteur de décision pour la même commune). Paris : 20 appels radon la première fois,
// un par arrondissement, puis aucun pendant 30 jours. Une panne ne casse rien : la ligne dit « non lu ».

/** « 1er arrondissement », « 13e arrondissement ». */
export function libelleArrondissement(code: string): string {
  const n = Number(code) - (code.startsWith("75") ? 75100 : code.startsWith("69") ? 69380 : 13200);
  return `${n}${n === 1 ? "er" : "e"} arrondissement`;
}

async function lecture(entry: IndexCommune, libelle: string, radonCommune: string, radonCode: string | null): Promise<LectureLocale> {
  const estArrondissement = radonCode != null;
  const s = buildSanteFacts(entry);
  const [seveso, radon] = await Promise.all([
    getSevesoAutour(entry.lat, entry.lon, SEVESO_RAYON_KM),
    getRadonPotentiel(radonCommune, radonCode),
  ]);
  return {
    code: entry.insee,
    libelle,
    estArrondissement,
    air: s.air.pm25 != null || s.air.no2 != null ? { pm25: s.air.pm25, no2: s.air.no2 } : null,
    industrie: s.industrie.lu ? { classeRetenue: s.industrie.classe, notable: s.industrie.notable } : null,
    seveso: seveso.etat === "lu" ? seveso.sites : "indisponible",
    bruit: s.bruit.lu ? { source: s.bruit.source, distanceKm: s.bruit.distanceKm, notable: s.bruit.notable } : null,
    radon: radon?.classe ?? null,
  };
}

/**
 * La carte d'une commune (ou d'un arrondissement). Paris, Lyon, Marseille au grain de la ville : une lecture par
 * arrondissement, agrégée en fourchettes, jamais une moyenne ni un arrondissement choisi au hasard.
 * `null` : la commune n'est pas dans l'index (aucune des quatre lectures n'a de point de référence).
 */
export async function getSanteEnvironnementale(
  insee: string,
  communeName: string,
  opts: { adresseConnue: boolean; maintenant?: Date },
): Promise<CarteSante | null> {
  const luLe = (opts.maintenant ?? new Date()).toISOString();
  const entry = await getCommuneEntry(insee).catch(() => null);
  let lectures: LectureLocale[];
  if (entry) {
    const parent = communeParent(insee);
    const estArrondissement = parent !== insee;
    lectures = [await lecture(entry, estArrondissement ? libelleArrondissement(insee) : communeName, parent, estArrondissement ? insee : null)];
  } else {
    const codes = arrondissementsDe(insee);
    if (codes.length === 0) return null;
    const entrees = await Promise.all(codes.map((c) => getCommuneEntry(c).catch(() => null)));
    lectures = await Promise.all(
      entrees.flatMap((e, k) => (e ? [lecture(e, libelleArrondissement(codes[k]!), insee, codes[k]!)] : [])),
    );
    if (lectures.length === 0) return null;
  }
  const extraitLe = lectures.every((l) => l.seveso !== "indisponible") ? await getSevesoExtraitLe() : null;
  return lireSanteEnvironnementale({ communeName, lectures, adresseConnue: opts.adresseConnue, luLe, sevesoExtraitLe: extraitLe });
}
