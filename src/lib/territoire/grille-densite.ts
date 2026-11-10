// ════════════════════════════════════════════════════════════════════════════════════════════
// LA GRILLE COMMUNALE DE DENSITÉ DE L'INSEE, À SEPT NIVEAUX (FUT-184). Lib PURE.
//
// Source : Insee, grille de densité 2025 (recensement 2021 carroyé à 1 km), code officiel `DENS7`, table générée
// par scripts/fut184/construire_grille_densite.py (empreintes vérifiées, éditions 2025 et 2026 identiques).
//
// CE QUE LA CLASSE MESURE. L'Insee classe d'abord des carreaux de 1 km², regroupés en taches ; la commune prend la
// classe du type de tache où vit la plus grande part de SA population. C'est une classe de la COMMUNE ENTIÈRE :
//   - elle ne décrit ni un quartier, ni une adresse, ni la forme d'un bourg (Mont-Dauphin, place forte compacte de
//     162 habitants, est « rural à habitat dispersé » : ses habitants ne forment pas une tache de 500 personnes) ;
//   - ses seuils (50 000, 5 000, 500 habitants) portent sur la TACHE, jamais sur la commune : 611 « petites villes »
//     ont moins de 5 000 habitants. Aucun libellé d'ici ne suggère une taille de commune ;
//   - elle n'est pas la densité moyenne en hab/km², qui reste un fait à part (`place.density`).
//
// TROIS INTERDITS, tenus ici :
//   1. Aucune classe n'est déduite. Ni des parts P1/P2/P3 (80 communes ne s'y retrouvent pas, FUT-180 §3.2), ni
//      d'une densité moyenne. Un code absent de la table est une ABSENCE : aucune classe, aucun texte.
//   2. Paris, Lyon et Marseille sont classées à la commune (75056, 69123, 13055). Un arrondissement n'a PAS de classe
//      propre : il lit celle de sa commune, et le dit (`perimetre: "commune_parente"`).
//   3. La grille n'est pas l'unité urbaine. Une commune peut être « bourg rural » ET au centre de son agglomération
//      (Sèvremoine) : deux zonages, deux faits, aucun ne corrige l'autre.
// ════════════════════════════════════════════════════════════════════════════════════════════
import { communeParent } from "../plm.ts";
import { GRILLE_DENSITE_CODES, GRILLE_DENSITE_SOURCE } from "./grille-densite.generated.ts";

export { GRILLE_DENSITE_SOURCE };

export type ClasseGrille = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const CLASSES_GRILLE: readonly ClasseGrille[] = [1, 2, 3, 4, 5, 6, 7];

/** Les libellés officiels du fichier (`LIBDENS7`), pour la source et la traçabilité ; jamais montrés tels quels. */
export const LIBELLE_INSEE_GRILLE: Record<ClasseGrille, string> = {
  1: "Grands centres urbains",
  2: "Centres urbains intermédiaires",
  3: "Petites villes",
  4: "Ceintures urbaines",
  5: "Bourgs ruraux",
  6: "Rural à habitat dispersé",
  7: "Rural à habitat très dispersé",
};

/**
 * LE LIBELLÉ LECTEUR (contrat de présentation FUT-184). « Habitat dispersé » n'est jamais écrit : il se lirait comme
 * la forme du village ou d'une adresse. « Petite ville » porte sa nature de classement, faute de quoi il se lirait
 * comme une taille de commune.
 */
export const LIBELLE_GRILLE: Record<ClasseGrille, string> = {
  1: "Grand centre urbain",
  2: "Centre urbain intermédiaire",
  3: "Petite ville — classification Insee",
  4: "Ceinture urbaine",
  5: "Bourg rural",
  6: "Commune rurale de faible densité",
  7: "Commune rurale de très faible densité",
};

/** Le même libellé, dans une phrase qui nomme déjà l'Insee (« relève de la catégorie « Petite ville » de la grille… »). */
export const LIBELLE_GRILLE_PHRASE: Record<ClasseGrille, string> = { ...LIBELLE_GRILLE, 3: "Petite ville" };

/** Urbain au sens de l'Insee : classes 1 à 4 (agrégation officielle de la grille, pas un seuil d'ici). */
export function grilleUrbaine(c: ClasseGrille): boolean {
  return c <= 4;
}

export type GrilleDensite = {
  classe: ClasseGrille;
  /** `commune` : la classe de la commune lue. `commune_parente` : un arrondissement, qui lit celle de sa ville. */
  perimetre: "commune" | "commune_parente";
  /** La ville dont la classe est lue, pour un arrondissement (« Paris ») ; absent sinon. */
  ville?: string;
};

const VILLES_PLM: Record<string, string> = { "75056": "Paris", "69123": "Lyon", "13055": "Marseille" };

let index: Map<string, ClasseGrille> | null = null;
function table(): Map<string, ClasseGrille> {
  if (index) return index;
  const m = new Map<string, ClasseGrille>();
  for (const c of CLASSES_GRILLE) for (const code of GRILLE_DENSITE_CODES[c].split(" ")) if (code) m.set(code, c);
  index = m;
  return m;
}

/** Le code officiel d'une commune, tel que la table le porte (sans remontée PLM). `null` : absent de la grille. */
export function classeGrilleOfficielle(insee: string): ClasseGrille | null {
  return table().get(insee.trim()) ?? null;
}

/**
 * La grille du périmètre lu. Un arrondissement de Paris, Lyon ou Marseille lit la classe de sa commune, marquée
 * `commune_parente`. Tout autre code absent de la table rend `null` : on ne sait pas, on ne dit rien.
 */
export function grilleDensiteDe(insee: string | null | undefined): GrilleDensite | null {
  if (!insee) return null;
  const code = insee.trim();
  const parent = communeParent(code);
  if (parent !== code) {
    const classe = classeGrilleOfficielle(parent);
    return classe ? { classe, perimetre: "commune_parente", ville: VILLES_PLM[parent] } : null;
  }
  const classe = classeGrilleOfficielle(code);
  return classe ? { classe, perimetre: "commune" } : null;
}

/** Le libellé affiché, avec sa portée quand la classe est celle de la ville (« Grand centre urbain, à l'échelle de Paris »). */
export function libelleGrille(g: GrilleDensite): string {
  return g.perimetre === "commune_parente" && g.ville ? `${LIBELLE_GRILLE[g.classe]}, à l'échelle de ${g.ville}` : LIBELLE_GRILLE[g.classe];
}

export function estGrilleDensite(v: unknown): v is GrilleDensite {
  if (v == null || typeof v !== "object") return false;
  const g = v as Partial<GrilleDensite>;
  return CLASSES_GRILLE.includes(g.classe as ClasseGrille) && (g.perimetre === "commune" || g.perimetre === "commune_parente");
}

/** La limite de lecture, portée par le fait et transmise à la synthèse. */
export function limiteGrille(g: GrilleDensite): string {
  const base = "Classe de la commune entière, calculée par l'Insee sur la répartition de ses habitants dans des carreaux de 1 km² (recensement 2021) : elle ne décrit ni un quartier, ni une adresse, ni la forme du bâti, et ses seuils de population portent sur des groupes de carreaux, pas sur la commune.";
  return g.perimetre === "commune_parente" && g.ville
    ? `${base} La grille ne classe pas les arrondissements : c'est la classe de ${g.ville} entière.`
    : base;
}
