import type { UserProject } from "../user-project.ts";

// ════════════════════════════════════════════════════════════════════════════════════════════
// QUEL CONTENU PORTE LE HAUT DE PAGE.
//
// ── POURQUOI QUATRE ÉTATS ET NON TROIS ───────────────────────────────────────────────────────
// « Projet présent mais non structuré » et « aucun projet » se ressemblent à l'écran et ne se
// ressemblent pas dans le code. Le premier est un état du PLAN (`project_not_structured`), donc un
// texte que le moteur produit et que le bloc verdict affiche déjà. Le second est l'absence de tout
// plan : sans `userProject`, la page n'appelle même pas `buildCommuneDossier`, le dossier vaut
// `null`, et chercher un headline dedans déréférencerait un objet nul.
//
// PUR, sans I/O : c'est la seule façon de tester les quatre états sans monter une page.
// ════════════════════════════════════════════════════════════════════════════════════════════

/** L'ancre de l'éditeur de projet. Toute invitation à préciser son cadrage mène ICI. */
export const ANCRE_PROJET = "projet";

export type Geste = { label: string; href: string };

export type ContenuHero =
  // Le bloc verdict streamé porte le titre. `geste` n'est posé que si le plan invite à préciser.
  | { kind: "verdict"; geste: Geste | null }
  // Aucun plan n'existe : la page porte elle-même le titre.
  | { kind: "invite"; titre: string; geste: Geste }
  // Non payant : le hero commercial, inchangé.
  | { kind: "commercial" };

const DECRIRE: Geste = { label: "Décrire mon projet", href: `/rapport#${ANCRE_PROJET}` };

/**
 * LE GESTE NOMME CE QUI MANQUE, ET RIEN D'AUTRE (20/08/2026).
 *
 * Les deux états sans structure recevaient le même « Décrire mon projet ». Il est juste quand rien
 * n'est déclaré. Il devient absurde dès que le texte libre est facultatif : quelqu'un qui vient de
 * choisir son objectif et son intention se verrait redemander de décrire un projet qu'il a décrit,
 * et le hub tournerait en boucle sur une invitation à laquelle il a déjà répondu.
 *
 * Ce qui manque alors, ce sont ses PRIORITÉS, la matière que le moteur confronte au territoire.
 */
const PRIORITES: Geste = { label: "Ajouter mes priorités", href: `/rapport#${ANCRE_PROJET}` };

export function contenuDuHero(input: {
  fullReport: boolean;
  project: UserProject | null;
  commune: string | null;
}): ContenuHero {
  if (!input.fullReport) return { kind: "commercial" };
  if (!input.project) {
    // Le lieu se nomme s'il est connu. « Ce territoire » vaut mieux qu'un nom inventé ou qu'un
    // trou dans la phrase. La capitale est portée par le repli : le lieu OUVRE la phrase, et un nom
    // de commune la porte déjà.
    const lieu = input.commune ?? "Ce territoire";
    // LA PHRASE POSE UNE CONSÉQUENCE, ELLE NE DEMANDE PAS UN SERVICE (13/08/2026). La première
    // version disait « Dites ce que vous cherchez, et {commune} se lira à cette aune » : « à cette
    // aune » appartient à un registre que personne n'emploie en parlant, et « se lira » mettait le
    // produit en sujet là où le lecteur doit l'être. Ce qui donne envie de répondre est de savoir
    // ce que la réponse change ; le bouton, juste dessous, dit quoi faire.
    return { kind: "invite", titre: `${lieu} ne se lit pas pareil selon ce que vous cherchez.`, geste: DECRIRE };
  }
  // `parsed` nul est exactement ce que lit `isStructured`, donc ce qui produit
  // `project_not_structured` dans le plan. On ne recalcule pas l'état, on lit la même chose.
  return { kind: "verdict", geste: input.project.parsed == null ? PRIORITES : null };
}
