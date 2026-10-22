// FUT-125 · LE PROJET DE LA RECETTE, REPRODUIT SANS COMPTE. DEV UNIQUEMENT.
//
// La recette du 22/10/2026 lisait un projet inspiré d'une commune-ancre : un critère écrit par le
// lecteur, cinq suggestions tirées de l'ancre, et, selon le cas, un critère gardé, un critère écarté,
// une condition sans compromis. Ce projet est fictif (aucun texte de compte), assemblé par
// `normalizeUserProject` et lu par `vueCriteres`, comme en production : la carte « Votre projet » du banc
// montre donc les mêmes états que la vraie page, sans aucune écriture.
//
//   projet=recette     cinq suggestions de l'ancre, un critère écrit
//   projet=etats       un critère gardé, un écarté, une condition, une suggestion
//   projet=sans        un projet déclaré sans priorités écrites
import { normalizeUserProject, type UserProject } from "@/lib/user-project";
import { buildConfirmation } from "@/lib/decision/conditions";

const PREFS = [
  { key: "eviter_grandes_villes", weight: 3, source: "parse" },
  { key: "mobilite_quotidienne", weight: 2, source: "ancre" },
  { key: "vie_etudiante", weight: 2, source: "ancre" },
  { key: "vie_locale", weight: 2, source: "ancre" },
  { key: "calme_sonore", weight: 2, source: "ancre" },
  { key: "proximite_mer", weight: 2, source: "ancre" },
];

const REFORMULATION = "Vous cherchez une ville dans l'esprit de Brest, de taille plutôt modeste, pour y acheter. Vous aimez de Brest son tram, sa vie étudiante, ses commerces et ses marchés, le calme loin des grandes infrastructures et la mer toute proche.";

export function projetRecette(cas: string | undefined): UserProject | null {
  if (cas === "sans") {
    return normalizeUserProject({ posture: "recherche", intent: "achat", rawText: null, updatedAt: "2026-10-01T00:00:00.000Z" });
  }
  if (cas !== "recette" && cas !== "etats") return null;
  const base = normalizeUserProject({
    posture: "recherche", intent: "achat", updatedAt: "2026-10-01T00:00:00.000Z",
    rawText: "Une ville comme Brest, plutôt petite, dans le Sud-Ouest.",
    parsed: { reformulation: REFORMULATION, hardConstraints: {}, communeAncre: [{ label: "Brest" }], preferences: PREFS },
  });
  if (!base || cas === "recette") return base;
  const le = "2026-10-01T00:00:00.000Z";
  const origin = { kind: "ancre" as const, labels: ["Brest"] };
  const avecGestes: UserProject = {
    ...base,
    adoptions: [{ criterion: { kind: "preference", key: "vie_locale" }, weight: 2, origin, adoptedAt: le, source: "user" }],
    rejets: [{ criterion: { kind: "preference", key: "vie_etudiante" }, origin, rejectedAt: le, source: "user" }],
  };
  const condition = buildConfirmation(avecGestes, { kind: "preference", key: "proximite_mer" }, le);
  return condition ? { ...avecGestes, conditions: [condition] } : avecGestes;
}
