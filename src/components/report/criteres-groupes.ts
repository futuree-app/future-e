// FUT-125 · LES CRITÈRES DU PROJET, RANGÉS PAR ORIGINE POUR LE RELEVÉ. Fonction pure, testée
// (`autour-du-releve.test.ts`) : chaque critère tombe dans UN groupe et un seul, aucun ne se perd, et
// l'ordre du serveur (`vueCriteres`) est gardé à l'intérieur de chaque groupe.
//
//   demandes   ce que le lecteur a écrit ou gardé (compris, condition, à revoir)
//   inspires   les suggestions d'une commune-ancre qu'il n'a pas encore tranchées
//   ecartes    les suggestions qu'il a écartées, pour pouvoir les reprendre
import type { CritereVue } from "../../lib/decision/projet-criteres-vue.ts";

export type GroupeDeCriteres = {
  cle: "demandes" | "inspires" | "ecartes";
  titre: string;
  note: string | null;
  criteres: CritereVue[];
  /** L'origine est dite par le titre du groupe : chaque ligne montre le critère seul (`court`). */
  sansOrigine: boolean;
};

export function groupesDeCriteres(criteres: CritereVue[]): GroupeDeCriteres[] {
  const inspires = criteres.filter((c) => c.etat === "inspire");
  const ancre = inspires[0]?.ancre ?? null;
  // Une seule ancre nomme le groupe ; si deux suggestions venaient d'ancres différentes, chaque ligne
  // garderait la sienne (aucune origine n'est attribuée à tort).
  const ancreUnique = ancre !== null && inspires.every((c) => c.ancre === ancre);
  const groupes: GroupeDeCriteres[] = [
    { cle: "demandes", titre: "Ce que vous demandez", note: null, criteres: criteres.filter((c) => c.etat !== "inspire" && c.etat !== "rejete"), sansOrigine: false },
    { cle: "inspires", titre: ancreUnique ? `Inspirés de ${ancre}` : "Inspirés d'autres communes", note: "À garder ou à écarter, un par un.", criteres: inspires, sansOrigine: ancreUnique },
    { cle: "ecartes", titre: "Écartés de votre projet", note: null, criteres: criteres.filter((c) => c.etat === "rejete"), sansOrigine: false },
  ];
  return groupes.filter((g) => g.criteres.length > 0);
}
