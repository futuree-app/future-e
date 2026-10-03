// FUT-45 : quels termes hors mesure le VRAI parseur produit, et quelle raison le classement leur donne.
// Lecture seule. Usage (racine du dépôt) : node scripts/fut45/sonder-raisons.mjs <.env>
import { createJiti } from "jiti";
const racine = process.cwd() + "/";
const jiti = createJiti(racine, { alias: { "server-only": racine + "scripts/mer/etude-courbe/vide.mjs", "@/": racine + "src/" } });
const { parserReel } = await jiti.import(racine + "scripts/fut45/parseur-reel.mts");
const { classerNonMesuree } = await jiti.import(racine + "src/lib/decision/criteria-registry.ts");
const PHRASES = [
  "Une eau du robinet de bonne qualité et pas de moustiques tigres.",
  "Une vie culturelle animée et des concerts.",
  "Je veux pouvoir trouver un médecin traitant facilement.",
  "Un bon réseau de fibre et de 4G pour télétravailler.",
  "Des commerces de qualité et un bon marché le dimanche.",
  "Peu d'ondes électromagnétiques et pas d'antenne relais.",
  "Je veux être à 30 minutes de mon travail à Nantes.",
  "Une ville où je me sentirai bien, avec du charme.",
  "Pas trop de touristes l'été.",
  "Une mairie dynamique et des impôts locaux raisonnables.",
  "Des voisins sympas et une bonne ambiance de quartier.",
  "Un loyer pas trop cher et des places en crèche.",
  "Des pistes cyclables sécurisées et peu d'embouteillages.",
  "Une ville propre, sans tags.",
  "Des pollens supportables pour mes allergies.",
  "Une bonne mentalité, des gens ouverts d'esprit.",
  "Un club de foot pour mon fils et un conservatoire.",
  "Pas de cas sociaux dans le quartier.",
  "budget 250 000 € et air sain",
  "Je veux de bonnes écoles réputées et un quartier sûr.",
];
for (const t of PHRASES) {
  const p = await parserReel(t, process.argv[2]);
  const hm = (p.horsMesure ?? []).map((h) => `${h.term} [${h.kind}] · modèle : ${h.raison ?? "—"} → ${classerNonMesuree(h.kind, h.term, h.raison).raison}`);
  console.log(`« ${t} »\n   préférences ${JSON.stringify(p.preferences.map((x) => x.key))}\n   ${hm.join("\n   ") || "(aucun hors mesure)"}`);
}
