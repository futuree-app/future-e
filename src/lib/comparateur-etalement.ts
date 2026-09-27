// L'ÉTALEMENT DES RÉSULTATS de « Où vivre » : quelles communes, dans quel ordre, parmi celles qui ont
// DÉJÀ passé les contraintes dures. Pur, testable sans l'index (extrait de matchProjects, FUT-5).
//
// L'INVARIANT (FUT-5) : l'étalement ne fabrique aucun candidat. Il ORDONNE et PLAFONNE le vivier qu'on
// lui donne, et ce vivier est celui des communes éligibles. Trois territoires affichés est un MAXIMUM,
// jamais un quota : si les conditions du lecteur n'en laissent qu'un ou deux, on en montre un ou deux.
// Aucune contrainte géographique n'est relâchée pour compléter un trio.
//
// L'« ouverture hors zone » de l'étalement échelonné ne concerne que les ancres PRÉFÉRÉES (« j'aimerais
// bien la Bretagne ») : elles ne filtrent rien, la commune ouverte est donc éligible au même titre que
// les autres (cf. ANCRES_GEOGRAPHIQUES.md). Sous une ancre DURE, aucune commune hors zone n'est dans le
// vivier, et aucune ne peut apparaître.

export type EtalementCandidat<T> = {
  result: T;
  // La commune est dans l'ancre PRÉFÉRÉE (zone et/ou montagne). Sans ancre préférée, ignoré.
  pref: boolean;
};

export type EtalementCommune = { dept: string; region?: string | null };

export function etalerResultats<T extends EtalementCommune>(
  unique: EtalementCandidat<T>[],
  opts: { anyPreferred: boolean; target: number; display: number },
): T[] {
  const { anyPreferred, target, display } = opts;
  const seenRegion = new Set<string>();
  const seenDept = new Set<string>();
  const deduped: T[] = [];
  const pushPick = (r: T) => {
    seenRegion.add(r.region ?? r.dept);
    seenDept.add(r.dept);
    deduped.push(r);
  };

  if (anyPreferred) {
    // Étalement ÉCHELONNÉ (ancre préférée : zone OU montagne) : la zone préférée
    // domine, avec UNE seule ouverture hors zone, au dernier rang affiché pour
    // rester visible sans la noyer. Distingue preferred (2 in-zone + 1 ouverture sur
    // 3 cartes) de hard (3 in-zone) et d'inspiration (diversité). cf. ANCRES.
    const zSeen = new Set<string>();
    const zonePicks: T[] = [];
    for (const s of unique) {
      if (!s.pref || zSeen.has(s.result.dept)) continue;
      zSeen.add(s.result.dept);
      zonePicks.push(s.result);
    }
    const alt = unique.find((s) => !s.pref && !zSeen.has(s.result.dept))?.result ?? null;
    for (const r of zonePicks.slice(0, display - 1)) pushPick(r);
    if (alt) pushPick(alt);
    for (const r of zonePicks) {
      if (deduped.length >= target) break;
      if (!deduped.includes(r)) pushPick(r);
    }
    for (const s of unique) {
      if (deduped.length >= target) break;
      if (!deduped.includes(s.result)) pushPick(s.result);
    }
  } else {
    // Étalement géographique standard (dégel diversité, 2026-05-31) : meilleure par
    // région, puis départements encore absents, puis sans contrainte. Le n°1 reste le
    // meilleur score (bonus inspiration inclus) ; les suivants favorisent des
    // territoires réellement différents (cf. OU_VIVRE_ROADMAP.md).
    for (const s of unique) {
      if (deduped.length >= target) break;
      if (seenRegion.has(s.result.region ?? s.result.dept)) continue;
      pushPick(s.result);
    }
    for (const s of unique) {
      if (deduped.length >= target) break;
      if (deduped.includes(s.result) || seenDept.has(s.result.dept)) continue;
      pushPick(s.result);
    }
    for (const s of unique) {
      if (deduped.length >= target) break;
      if (deduped.includes(s.result)) continue;
      pushPick(s.result);
    }
  }
  return deduped;
}
