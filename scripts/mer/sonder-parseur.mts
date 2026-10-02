// FUT-33 (2B.2, A) : passe de VRAIES phrases dans le VRAI prompt du parseur, puis dans l'assainissement.
// Usage : node scripts/mer/sonder-parseur.mts <fichier .env contenant ANTHROPIC_API_KEY> > sortie.json
import { parserReel } from "./parseur-reel.mts";

const PHRASES = [
  "Je ne veux pas vivre sur le littoral, une petite ville calme.",
  "Hors littoral, avec une gare.",
  "Pas une commune littorale s'il vous plaît.",
  "Je veux être à au moins 30 km de la mer.",
  "Pas à moins de 20 km de la côte, une ville moyenne.",
  "On veut vivre loin de la mer.",
  "Plutôt dans les terres, au calme.",
  "Je n'aime pas la mer, je préfère la campagne.",
  "Je veux être proche de la mer.",
  "Il nous faut absolument la mer, à moins de 10 km.",
  "Pas forcément près de la mer, mais pas trop chaud.",
  "Surtout pas au bord de la mer.",
  "Pas sur le littoral, et au moins 20 km de la mer.",
  "Je ne veux pas être près de la mer.",
  "Une ville comme Brest mais loin de la mer.",
];

const sortie = [];
for (const texte of PHRASES) {
  let p;
  try { p = await parserReel(texte, process.argv[2]); } catch (e) { sortie.push({ texte, erreur: String(e) }); continue; }
  const hc = p.hardConstraints ?? {};
  sortie.push({
    texte,
    nearSea: hc.nearSea ?? null, excludeSea: hc.excludeSea ?? null, farFromSea: hc.farFromSea ?? null,
    proximite_mer: (p.preferences ?? []).find((x) => x.key === "proximite_mer")?.weight ?? null,
    communeAncre: p.communeAncre ?? null,
  });
}
console.log(JSON.stringify(sortie, null, 1));
