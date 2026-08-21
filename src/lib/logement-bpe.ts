import fs from "node:fs/promises";
import path from "node:path";
import { haversineM, type LngLat } from "./geo-distance.ts";
import { neighborKeys } from "./geo-grid.ts";
import { FACE3_CATS, BPE_CAP_M, BPE_WALK_RADIUS_M, TYPEQU_LABEL, type BpePoint, type BpeNearest, type Face3Cat } from "./logement-autour-types.ts";

const DIR = path.join(process.cwd(), "data", "bpe-points");

/**
 * L'IDENTITÉ QUI DESCEND DANS LE SNAPSHOT, et celle qui n'y descend pas.
 *
 * Le nom n'est repris que si le lieu n'a qu'un exploitant recensé (`x` absent) : la liste `s` des
 * enregistrements sources reste dans `data/bpe-points`, pour l'audit, et ne voyage pas dans un
 * dossier qu'elle ne sert pas à afficher.
 */
function identiteDe(p: BpePoint) {
  const plusieurs = typeof p.x === "number" && p.x > 1;
  return {
    ...(p.a ? { adresse: p.a } : {}),
    ...(plusieurs ? { exploitants: p.x } : {}),
    ...(!plusieurs && p.n ? { nom: p.n } : {}),
    ...(!plusieurs && p.i ? { identifiant: p.i } : {}),
  };
}

export function nearestByCategory(center: LngLat, points: BpePoint[], capM: number = BPE_CAP_M): BpeNearest[] {
  // On retient le point le plus proche ET son code TYPEQU, pour restituer le type précis
  // (« Pharmacie » plutôt que « Santé ») dans le snapshot lu par le rapport. Depuis le 17/08/2026,
  // on retient aussi de QUOI il s'agit : nom, adresse, identifiant source, ou le fait que plusieurs
  // exploitants y sont recensés. Sans ça, l'écran affirmait « Boulangerie · env. 903 m » sans que
  // le lecteur puisse reconnaître le lieu compté ni contrôler ce qu'il en sait (JL-11).
  const best = new Map<Face3Cat, { d: number; p: BpePoint }>();
  // LE COMPTAGE À PORTÉE DE PAS, gratuit : la boucle parcourt déjà chaque point et calcule sa
  // distance. Il distingue un secteur où une boulangerie est à 400 m d'un secteur où il y en a
  // quatre, ce que « la plus proche » efface complètement, alors que c'est la différence entre
  // avoir un commerce et avoir le choix. Il compte des LIEUX : les shards ont déjà regroupé les
  // établissements successifs ou partagés d'un même point.
  const proches = new Map<Face3Cat, number>();
  for (const p of points) {
    const d = haversineM(center, { lat: p.lat, lon: p.lon });
    if (d > capM) continue;
    const cur = best.get(p.c);
    if (cur === undefined || d < cur.d) best.set(p.c, { d, p });
    if (d <= BPE_WALK_RADIUS_M) proches.set(p.c, (proches.get(p.c) ?? 0) + 1);
  }
  return FACE3_CATS.map((category) => {
    const b = best.get(category);
    return {
      category,
      nearest: b === undefined
        ? null
        : { distanceMeters: Math.round(b.d), typeLabel: TYPEQU_LABEL[b.p.t] ?? null, ...identiteDe(b.p) },
      searchCapMeters: capM,
      withinWalkCount: proches.get(category) ?? 0,
    };
  });
}

/**
 * Les lieux des cellules voisines, ET le millésime des shards lus.
 *
 * Le millésime vient de la DONNÉE, jamais d'une constante du code : c'est ce qui a manqué le
 * 16/08/2026, où l'écran annonçait « BPE 2024 » douze jours après la publication de la BPE 2025,
 * parce que le millésime était écrit en dur dans le composant. `null` = shards antérieurs au
 * 17/08/2026, qui ne le portaient pas.
 */
export async function loadBpePointsAround(
  center: LngLat,
): Promise<{ points: BpePoint[]; millesime: string | null }> {
  const keys = neighborKeys(center.lat, center.lon);
  const chunks = await Promise.all(
    keys.map(async (k) => {
      try {
        const raw = await fs.readFile(path.join(DIR, `${k}.json`), "utf8");
        return JSON.parse(raw) as { points: BpePoint[]; millesime?: string };
      } catch {
        return null; // cellule vide/absente = pas d'équipement (honnête)
      }
    }),
  );
  const lus = chunks.filter((c): c is { points: BpePoint[]; millesime?: string } => c !== null);
  return {
    points: lus.flatMap((c) => c.points),
    millesime: lus.find((c) => c.millesime)?.millesime ?? null,
  };
}
