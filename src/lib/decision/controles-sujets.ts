// FUT-91 · Sujet des groupes de contrôle, indépendant des composants de présentation.
// Partagé par l'interface classique et « Le relevé » pour éviter toute dépendance circulaire.
import type { DossierCard } from "./decision-fact.ts";

function sujetDeCarte(card: DossierCard): string {
  if (card.kind === "fact") return card.fact.topic;
  if ("headlineSubject" in card.composition) return card.composition.headlineSubject;
  return card.composition.title;
}

export function sujetsDuGroupe(cards: DossierCard[]): string {
  const vus = new Set<string>();
  const sujets: string[] = [];

  for (const card of cards) {
    const sujet = sujetDeCarte(card).trim();
    const cle = sujet.toLocaleLowerCase("fr");
    if (!sujet || vus.has(cle)) continue;
    vus.add(cle);
    sujets.push(sujet);
  }

  const apercu = sujets.slice(0, 2).join(" · ");
  if (!apercu) return "Contrôles établis par nos sources";
  const libelle = sujets.length > 2 ? `${apercu} · …` : apercu;
  return libelle.charAt(0).toLocaleUpperCase("fr") + libelle.slice(1);
}
