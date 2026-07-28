// « À vérifier avant de décider » (beat 5, spec 5a). Lib PURE : à partir des faits déjà montrés
// (état normalisé) et du PROJET, produit des points de vérification déterministes. La synthèse
// décrit le logement ; cette checklist décrit la RELATION (personne × projet).
//
// LES TEXTES NE VIVENT PLUS ICI (29/07/2026). Ils viennent de `decision/logement-gestes.ts`, que le
// MOTEUR lit aussi. Cette liste portait sa propre copie des mêmes gestes, restée à la première
// génération : elle disait encore « Vérifier le diagnostic énergétique complet et sa date » là où le
// dossier dit « Regardez le détail du diagnostic et sa date ». Deux formulations du même geste selon
// l'endroit de l'écran où le lecteur regardait.
//
// Ce fichier ne garde donc que ce qui lui est PROPRE : quels gestes s'activent, et pour quelles
// postures. Ajouter un geste = une entrée dans la table partagée, plus une ligne ici.

import { gesteEnPhrase, type Bucket, type GesteKey } from "./decision/logement-gestes.ts";

export type { Bucket };

export type ChecklistFacts = {
  dpe: "passoire" | "energivore" | "correct" | "absent";
  confortEteInsuffisant: boolean;
  expositionBati: boolean; // RGA/argile à exposition notable
  zoneReglementee: boolean; // au moins un zonage PPRN au point
  sinistraliteActive: boolean; // un péril indemnisé lisible à l'échelle commune
  caviteProche: boolean; // une cavité souterraine recensée à proximité du point
  perimetrePatrimonial: boolean; // AC1/AC2/AC4 au point : l'avis de l'ABF entre en jeu
};

export type ChecklistItem = { id: string; text: string };

export function energyState(etiquette: string | null): ChecklistFacts["dpe"] {
  if (!etiquette) return "absent";
  const e = etiquette.toUpperCase();
  if (e === "F" || e === "G") return "passoire";
  if (e === "E") return "energivore";
  return "correct";
}

export function projetBucket(projet: string | null): Bucket {
  return projet === "achat" ? "achat"
    : projet === "location" ? "location"
    : projet === "reside" ? "reside"
    : "neutre";
}

// Une règle par geste. `active` gate sur le fait ; le TEXTE vient de la table partagée.
// L'ordre du tableau = l'ordre des preuves (énergie -> chaleur -> bâti -> réglementaire -> sinistralité).
const RULES: {
  id: GesteKey;
  active: (f: ChecklistFacts) => boolean;
  buckets?: Bucket[]; // par défaut : tous. Restreint le geste aux projets où il a un sens.
}[] = [
  { id: "energie", active: (f) => f.dpe === "passoire" || f.dpe === "energivore" },
  { id: "confort", active: (f) => f.confortEteInsuffisant },
  { id: "bati", active: (f) => f.expositionBati },
  { id: "reglementaire", active: (f) => f.zoneReglementee },
  { id: "sinistralite", active: (f) => f.sinistraliteActive },
  { id: "cavite", active: (f) => f.caviteProche },
  // Un locataire ne fait pas ces travaux.
  { id: "patrimoine", active: (f) => f.perimetrePatrimonial, buckets: ["neutre", "achat", "reside"] },
];

export function buildDecisionChecklist(facts: ChecklistFacts, projet: string | null): ChecklistItem[] {
  const b = projetBucket(projet);
  return RULES.filter((r) => r.active(facts))
    .filter((r) => r.buckets === undefined || r.buckets.includes(b))
    .map((r) => ({ id: r.id, text: gesteEnPhrase(r.id, b) }))
    // Un geste sans texte pour cette posture ne s'affiche pas (cf. `patrimoine` / location).
    .filter((it) => it.text.length > 0);
}

export function checklistIntro(projet: string | null): string {
  return projetBucket(projet) === "neutre"
    ? "Ces points viennent de la lecture du logement. Votre projet permettra de les rendre plus précis."
    : "Voici les points que la lecture de ce logement fait remonter, à documenter selon votre projet.";
}
