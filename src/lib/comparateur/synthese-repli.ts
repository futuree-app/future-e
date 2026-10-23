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
