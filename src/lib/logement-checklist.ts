// « À vérifier avant de décider » (beat 5, spec 5a). Lib PURE : à partir des faits déjà montrés
// (état normalisé) et du PROJET, produit des points de vérification déterministes. La synthèse
// décrit le logement ; cette checklist décrit la RELATION (personne × projet). Extensible :
// ajouter un axe de personnalisation = ajouter une règle, jamais toucher au prompt IA.

export type Bucket = "neutre" | "achat" | "reside" | "location";

export type ChecklistFacts = {
  dpe: "passoire" | "energivore" | "correct" | "absent";
  confortEteInsuffisant: boolean;
  expositionBati: boolean; // RGA/argile à exposition notable
  zoneReglementee: boolean; // au moins un zonage PPRN au point
  sinistraliteActive: boolean; // un péril indemnisé lisible à l'échelle commune
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

// Une règle par face. `active` gate sur le fait ; `text` porte la formulation par bucket.
// L'ordre du tableau = l'ordre des preuves (énergie -> chaleur -> bâti -> réglementaire -> sinistralité).
const RULES: {
  id: string;
  active: (f: ChecklistFacts) => boolean;
  buckets?: Bucket[]; // par défaut : tous. Restreint l'item aux projets où le geste a un sens.
  text: Record<Bucket, string>;
}[] = [
  {
    id: "energie",
    active: (f) => f.dpe === "passoire" || f.dpe === "energivore",
    text: {
      neutre: "Vérifier le diagnostic énergétique complet et sa date.",
      achat: "Demandez le diagnostic énergétique complet et faites chiffrer les travaux d'amélioration avant de vous engager.",
      reside: "Conservez le diagnostic énergétique et documentez tout travail d'amélioration engagé.",
      location: "Demandez le diagnostic énergétique complet au bailleur et vérifiez sa date avant signature.",
    },
  },
  {
    id: "confort",
    active: (f) => f.confortEteInsuffisant,
    text: {
      neutre: "Se renseigner sur le confort du logement en période de forte chaleur.",
      achat: "Demandez comment le logement se comporte l'été et faites vérifier l'isolation et la ventilation.",
      reside: "Suivez le confort du logement lors des épisodes de chaleur et notez les pièces les plus exposées.",
      location: "Observez comment le logement se comporte l'été et demandez au bailleur les protections existantes.",
    },
  },
  {
    id: "bati",
    active: (f) => f.expositionBati,
    text: {
      neutre: "Regarder les signes visibles sur le bâti, l'exposition au retrait-gonflement des argiles étant relevée à cette adresse.",
      achat: "Demandez l'historique des fissures et des sinistres, et faites vérifier les fondations avant de vous engager.",
      reside: "Surveillez et photographiez d'éventuelles fissures dans le temps, et conservez les justificatifs de travaux.",
      location: "Observez l'état des murs et signalez au bailleur toute fissure apparente.",
    },
  },
  {
    id: "reglementaire",
    active: (f) => f.zoneReglementee,
    text: {
      neutre: "Lire le règlement de la zone, cette adresse relevant d'un plan de prévention.",
      achat: "Consultez le règlement de la zone en mairie avant tout projet de travaux ou d'extension : lui seul dit ce qui est autorisé à cette adresse.",
      reside: "Vérifiez le règlement de la zone avant d'engager une extension ou une rénovation lourde.",
      location: "Demandez au bailleur si le logement est concerné par des prescriptions particulières.",
    },
  },
  {
    id: "sinistralite",
    active: (f) => f.sinistraliteActive,
    text: {
      neutre: "Garder en tête que les sinistres indemnisés sont lus à l'échelle de la commune, pas du logement.",
      achat: "Demandez au vendeur l'état des risques et l'historique des sinistres du bien : la commune en a connu, sans que cela concerne forcément ce logement.",
      reside: "Conservez les déclarations de sinistres et d'indemnisation : elles documentent l'exposition réelle du bien, au-delà de la statistique communale.",
      location: "Demandez au bailleur l'état des risques et signalez tout sinistre survenu pendant la location.",
    },
  },
  {
    id: "patrimoine",
    active: (f) => f.perimetrePatrimonial,
    // Un locataire ne fait pas ces travaux.
    buckets: ["neutre", "achat", "reside"],
    text: {
      neutre: "Se renseigner en mairie sur ce que le périmètre patrimonial autorise, avant tout projet de travaux extérieurs.",
      achat: "Si vous envisagez des travaux extérieurs, isolation, menuiseries ou toiture, faites vérifier en mairie ce que le périmètre patrimonial autorise, avant tout devis.",
      reside: "Avant d'engager des travaux extérieurs, faites vérifier en mairie ce que le périmètre patrimonial autorise : l'avis de l'Architecte des Bâtiments de France peut être requis.",
      location: "",
    },
  },
];

export function buildDecisionChecklist(facts: ChecklistFacts, projet: string | null): ChecklistItem[] {
  const b = projetBucket(projet);
  return RULES.filter((r) => r.active(facts))
    .filter((r) => r.buckets === undefined || r.buckets.includes(b))
    .map((r) => ({ id: r.id, text: r.text[b] }));
}

export function checklistIntro(projet: string | null): string {
  return projetBucket(projet) === "neutre"
    ? "Ces points viennent de la lecture du logement. Votre projet permettra de les rendre plus précis."
    : "Voici les points que la lecture de ce logement fait remonter, à documenter selon votre projet.";
}
