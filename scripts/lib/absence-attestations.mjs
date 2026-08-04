// Jointure PURE records -> attestations d'absence, avec validation stricte. Aucune I/O : reçoit les objets
// déjà lus (SANS leur bloc meta éventuel), mute `communes` en place (champs FRÈRES, sans déformer reseauLocal),
// jette sur anomalie. La convention n'est PAS écrite par commune : elle vit dans index.meta (côté script).

// Réplique EXACTE de radius_for (populate-bpe.py) : seuils 30k/100k/500k, rural par défaut.
export function radiusFor(taille) {
  if (taille == null) return 25;
  if (taille >= 500000) return 5;
  if (taille >= 100000) return 10;
  if (taille >= 30000) return 15;
  return 25;
}
// Réplique EXACTE de taille_ville (populate-bpe.py) : uuPop si uu connu, sinon population.
export function tailleVilleFrom(uu, population, uuPop) {
  if (uu && uuPop.has(uu)) return uuPop.get(uu);
  return population ?? null;
}

export function buildAbsenceAttestations({ communes, networkRecords, bpeRecords }) {
  const uuPop = new Map();
  for (const c of communes) if (c.uu && c.population != null) uuPop.set(c.uu, (uuPop.get(c.uu) ?? 0) + c.population);

  const seen = new Set();
  let netBelow = 0, supAbsent = 0;
  for (const c of communes) {
    if (seen.has(c.insee)) throw new Error(`doublon INSEE ${c.insee}`);
    seen.add(c.insee);
    if (!(c.insee in networkRecords)) throw new Error(`INSEE ${c.insee} absent du record réseau`);
    if (!(c.insee in bpeRecords)) throw new Error(`INSEE ${c.insee} absent du record BPE`);

    // ON N'ATTESTE QUE CE QU'ON A PU CHERCHER. `measured: true` et `reseauLocalMeasured: true`
    // affirment qu'une mesure a été TENTÉE et n'a rien trouvé, ce qui est très différent de « on
    // n'a pas regardé ». Les deux mesures partent des coordonnées de la commune : sans elles, la
    // recherche ne peut pas partir, et l'attestation dirait une absence qui n'a jamais été établie.
    //
    // Aucune commune de l'index n'est dans ce cas aujourd'hui, les 34 788 étant géolocalisées.
    // C'est précisément pour cela que l'invariant s'écrit maintenant : il ne coûte rien tant qu'il
    // est vrai, et il ne se remarquerait pas le jour où il cesserait de l'être.
    //
    // `Number.isFinite` plutôt qu'un test d'existence : `lat: null` passerait un `in`, et une
    // chaîne « 46.16 » passerait un `!= null` tout en cassant le premier calcul de distance.
    if (!Number.isFinite(c.lat) || !Number.isFinite(c.lon)) {
      throw new Error(
        `INSEE ${c.insee} sans coordonnées exploitables (lat=${c.lat}, lon=${c.lon}) : ` +
        `une absence ne peut pas être attestée là où la mesure n'a pas pu être tentée`,
      );
    }

    // Champ FRÈRE : on atteste la mesure sans déformer reseauLocal (résultat du scoring, source = le cache).
    c.reseauLocalMeasured = true;
    const r = networkRecords[c.insee];
    if (r == null) {
      c.reseauLocal = null; // sous plancher, inchangé
      netBelow++;
    } else {
      if (!Number.isFinite(r.acces) || r.acces < 1 || r.acces > 100) throw new Error(`acces invalide pour ${c.insee}: ${r.acces}`);
      c.reseauLocal = r; // desservie, valeur du cache (identique à l'index enrichi d'origine)
    }

    const weightedAccess = bpeRecords[c.insee]?.etudes_acces?.count;
    if (!Number.isFinite(weightedAccess) || weightedAccess < 0) throw new Error(`weightedAccess (count) invalide pour ${c.insee}: ${weightedAccess}`);
    const radiusKm = radiusFor(tailleVilleFrom(c.uu ?? null, c.population ?? null, uuPop));
    // establishmentCount ABSENT du cache actuel : le producteur le portera (Task 8). classify retombe sur weightedAccess.
    c.etudesSup = { measured: true, weightedAccess, radiusKm };
    if (weightedAccess === 0) supAbsent++;
  }

  const N = communes.length;
  return {
    report: [
      `${N} communes jointes`,
      `${netBelow} sous le plancher réseau (${(100 * netBelow / N).toFixed(1)} %)`,
      `${supAbsent} sans établissement supérieur (${(100 * supAbsent / N).toFixed(1)} %)`,
    ].join("\n"),
    prevalence: { networkAbsent: netBelow, higherEdAbsent: supAbsent, communeCount: N },
  };
}
