import top1000 from "@/data/top1000-communes.json";

// ════════════════════════════════════════════════════════════════════════════════════════════
// COMBIEN DE COMMUNES SONT FABRIQUÉES PENDANT LE BUILD.
//
// Les gabarits `/chaleur/[insee_code]` et `/inondation/[insee_code]` prégénéraient les mille
// communes les plus peuplées, chacun de son côté. Deux mille pages, et chacune interroge Supabase :
// mesuré le 20/08/2026 sur un déploiement réel, la génération statique tenait 78 secondes d'un
// build de cinq minutes et demie, avec un seul worker, et son résultat pesait ensuite dans la
// phase d'envoi des sorties.
//
// Ces pages ne DISPARAISSENT pas de la liste : `revalidate` vaut 24 h et `dynamicParams` reste à
// son défaut, donc toute commune hors de cette liste est fabriquée à sa première visite, puis
// servie depuis le cache. Le nombre ci-dessous décide seulement de ce qui est prêt AVANT la
// première visite, ce qui ne se justifie que pour les pages assez vues pour que quelqu'un attende
// vraiment devant.
//
// UNE SEULE SOURCE POUR LES DEUX GABARITS. Écrite deux fois, la borne aurait fini par différer, et
// le coût de build serait redevenu invisible.
// ════════════════════════════════════════════════════════════════════════════════════════════

/**
 * Le plafond, tant que l'usage réel de ces deux gabarits n'est pas tranché. Cent pages coûtent
 * quelques secondes de build ; deux mille en coûtaient quatre-vingts, pour un trafic qu'on ne
 * mesure pas encore.
 */
export const PREGENEREES_MAX = 100;

/** Les communes fabriquées pendant le build, dans l'ordre de population décroissante. */
export function communesAPregenerer(): string[] {
  return (top1000 as string[]).slice(0, PREGENEREES_MAX);
}
