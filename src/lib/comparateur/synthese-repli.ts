// Repli limité à FUT-129, sans modèle ni tentative de déduire une sélection.
// Ce texte n'est pas un validateur sémantique des réponses IA reçues avec succès.
export function repliInondation(
  preferences: readonly { key: string }[],
  communes: readonly { nom: string }[],
  exploration: boolean,
): string | null {
  if (!preferences.some((p) => p.key === "faible_risque_inondation")) return null;
  const noms = communes.map((c) => c.nom).join(", ");
  const cadre = exploration
    ? `${noms} sont des communes à explorer, sans classement favorable sur votre demande d'inondation. Précisez d'autres priorités pour poursuivre la recherche.`
    : `${noms} sont les communes proposées. Les raisons de sélection indiquées sur les cartes portent sur vos autres critères. L'inondation ne favorise aucune commune ; elle peut seulement entraîner un recul documenté.`;
  return `${cadre} Les cartes décrivent les sinistres passés et les plans de prévention recensés. Ces faits ne démontrent pas un faible risque. Une même classe historique ne signifie pas une exposition équivalente. La situation d'un bien se vérifie à son adresse.`;
}

/** FUT-155 : sans état lisible, le repli ne raconte ni arbitrage ni correspondance. */
export const REPLI_ETAT_INCONNU = "Ces territoires sont à explorer : ouvrez celui qui vous parle pour voir ce qui y est mesuré.";

// Repli déterministe de la page « Où vivre » quand la synthèse rédigée est indisponible (502). Qualitatif, il ne
// reprend que ce que le moteur a produit. FUT-155 : un état absent n'est jamais lu comme favorable (exploration
// inconnue : pas de classement d'exploration annoncé ; couverture inconnue : pas d'arbitrage raconté).
export function repliSynthese(
  parsed: { reformulation: string; preferences: readonly { key: string }[] },
  results: readonly { nom: string; reasons: string[]; sansPrioriteFavorable?: true }[],
  exploration: boolean | null | undefined,
  couverture: { etat: string | null | undefined; message: string | null },
): string {
  const inondation = repliInondation(parsed.preferences, results, exploration === true);
  if (inondation) return inondation;
  // FUT-109 : sans priorité mesurée partout, le repli ne raconte ni arbitrage ni correspondance : il dit l'exploration.
  if (couverture.etat !== "complete") return `${parsed.reformulation} ${couverture.message ?? REPLI_ETAT_INCONNU}`;
  // FUT-151 : sans priorité favorable sur aucune carte, pas d'« arbitrage » à raconter : le message du moteur le dit.
  if (couverture.message && results.length > 0 && results.every((r) => r.sansPrioriteFavorable)) return `${parsed.reformulation} ${couverture.message}`;
  const reasons = Array.from(
    new Set(results.flatMap((r) => r.reasons).filter(Boolean)),
  ).slice(0, 3);
  const reasonPart = reasons.length
    ? ` Les territoires qui ressortent se distinguent notamment par ${reasons.join(", ")}.`
    : "";
  return `${parsed.reformulation}${reasonPart} Aucun ne réunit tout, chacun représente un arbitrage différent. Ouvrez celui qui vous parle pour comprendre ce qu'il implique vraiment.`;
}
