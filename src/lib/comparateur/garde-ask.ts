// FUT-142 · Le garde de sortie d'AskFuture comparateur : une réponse ne proclame pas un gagnant que le
// résultat n'a pas établi.
//
// Ce n'est pas un analyseur de langue : quelques tournures ciblées, celles qui transforment un ordre
// d'affichage en palmarès. Deux familles.
//   - JAMAIS ÉTABLIES, quel que soit le mode : « le meilleur choix », « correspond parfaitement », une
//     recommandation, une commune « moins risquée » face aux inondations (FUT-129 : aucune donnée communale
//     ne désigne une commune sans risque).
//   - DE CLASSEMENT, établies seulement en mode « classe » : « la meilleure », « devant », « correspond le
//     mieux », « la plus adaptée ».
// Une tournure n'est retenue que si la proposition qui la porte l'AFFIRME : une négation placée avant elle
// (« on ne peut pas conclure que X est le meilleur choix ») ou une question en fait une mise en garde.
// Une réponse retenue est remplacée par un repli déterministe (`reponseDeRepli`), sans rien inventer.
import type { ModeQuestions } from "./questions-ask.ts";
import type { LectureAsk } from "./lecture-ask.ts";

// Bornes de mot qui connaissent les accents (`\b` ignore « é », « à »).
const mot = (source: string) => new RegExp(`(?<![\\p{L}])(?:${source})(?![\\p{L}])`, "u");
const adj = (racine: string) => `${racine}|${racine}e|${racine}s|${racine}es`; // accords

const JAMAIS: RegExp[] = [
  "meilleurs? choix",
  `(bon|choix|lieu|territoire|endroit|commune) (choix )?(${adj("idéal")}|${adj("parfait")})`,
  "correspond\\p{L}*\\s+(parfaitement|totalement|pleinement|exactement)",
  `(parfaitement|idéalement) (${adj("adapté")})`,
  "(je|nous) (vous )?(recommande|recommandons|conseille|conseillons)",
  // L'inondation : des sinistres passés, jamais une sécurité (FUT-129).
  `moins (${adj("risqué")}|${adj("exposé")}|vulnérables?)\\s+(aux|à l'|à la|face aux|face à l'|aux risques d')\\s*(inondations?|crues?|submersions?)`,
  // Un prédicat, pour ne pas confondre l'affirmation avec la reprise du critère (« un faible risque d'inondation »).
  "(présente|offre|a|affiche|bénéficie d'|connaît|garantit|assure)\\s+(un |d'un )?(faible|moindre) risque d'(inondation|être inondé)",
  "risque d'inondation (est |reste |semble )?(faible|limité|moindre|réduit|nul)",
  `(à l'abri|${adj("épargné")}|${adj("protégé")}|${adj("préservé")}|en sécurité)[^.;:]{0,30}(inondations?|crues?|submersions?)`,
  "plus sûre?s?|sans risque",
].map(mot);
const CLASSEMENT: RegExp[] = [
  "(le|la|les|l')\\s*meilleure?s?",
  "meilleure?s? (option|correspondance|candidate?|compromis|équilibre|réponse)",
  "(correspond|répond|convient|satisfait|colle)\\p{L}*\\s+(le )?(mieux|davantage|plus)",
  `mieux (${adj("placé")}|${adj("classé")}|${adj("adapté")})`,
  `(arrive|passe|se place|se classe|ressort|${adj("classé")}|est)(-t)?(-elles?|-ils?)?\\s+devant`,
  `(le|la|les) plus (${adj("adapté")}|favorables?|${adj("pertinent")}|${adj("indiqué")}|${adj("recommandé")}|${adj("intéressant")})`,
  "l'emporte|gagnante?s?",
].map(mot);
// Avant la tournure, dans la même proposition : ce qui en fait une mise en garde.
// « n' » se colle au verbe suivant (« n'établit ») : il n'a pas de borne à droite.
const NEGATION = new RegExp(`(?<![\\p{L}])(?:n['’]|(?:ne|pas|aucune?|rien|jamais|ni|sans|impossible|trompeuse?|hâtive?|prématurée?|abusive?|abusif)(?![\\p{L}]))`, "u");
// …sauf ces tournures, qui renforcent au lieu de nier.
const FAUSSE_NEGATION = mot("pas (un hasard|seulement|uniquement|surprenant|étonnant)|non seulement|sans (aucun )?doute|sans conteste|sans surprise|sans hésit\\p{L}*|ne fait (aucun|pas de) doute|n'est que");

export type Affirmation = { tournure: string; proposition: string };

/** Les propositions qui affirment un classement ou une sécurité que le mode courant n'établit pas. */
export function affirmationsNonEtablies(texte: string, mode: ModeQuestions): Affirmation[] {
  const motifs = mode === "classe" ? JAMAIS : [...JAMAIS, ...CLASSEMENT];
  const out: Affirmation[] = [];
  // Propositions : coupées aux ponctuations fortes, aux virgules et aux « mais ». Le « ? » est gardé.
  const props = texte.toLowerCase().replace(/\s+/g, " ").split(/(?<=[.;:!?])|,|\bmais\b|\bor\b|\bcependant\b|\btoutefois\b/);
  for (const brute of props) {
    const p = brute.trim();
    if (!p || p.endsWith("?")) continue; // une question n'affirme rien
    for (const m of motifs) {
      const r = m.exec(p);
      if (!r) continue;
      const avant = p.slice(0, r.index);
      if (NEGATION.test(avant) && !FAUSSE_NEGATION.test(avant)) continue;
      out.push({ tournure: r[0], proposition: p });
      break;
    }
  }
  return out;
}

/**
 * La question présuppose-t-elle ce que le résultat n'établit pas ? Ici la forme interrogative compte :
 * « pourquoi X est-elle le meilleur choix ? » porte la prémisse, même terminée par « ? ».
 */
export function premisseNonEtablie(question: string, mode: ModeQuestions): string | null {
  const q = question.toLowerCase().replace(/\s+/g, " ").replace(/\?/g, ".");
  // « Laquelle est la plus exposée à la chaleur ? » reste une question légitime sur les signaux : seules les
  // tournures de victoire ou de sécurité portent une prémisse.
  return affirmationsNonEtablies(q, mode)[0]?.tournure ?? null;
}

// ── Le repli : ce que le résultat établit, dit sans modèle ───────────────────────────────────────────

const liste = (noms: string[]) => (noms.length <= 1 ? noms[0] ?? "" : `${noms.slice(0, -1).join(", ")} et ${noms.at(-1)}`);

/** Réponse sûre, construite sur le seul contexte courant : aucune donnée, aucun chiffre, aucun gagnant. */
export function reponseDeRepli(l: LectureAsk): string {
  const noms = l.communes.map((c) => c.nom).filter(Boolean);
  const un = noms.length <= 1;
  const sujet = un ? `La commune de ${noms[0] ?? "ce territoire"}` : `Les communes de ${liste(noms)}`;
  if (l.mode === "exploration_inondation") {
    return `${sujet} ${un ? "est proposée pour être examinée" : "sont proposées pour être examinées"}, pas classée${un ? "" : "s"} : `
      + "cette recherche n'établit pas laquelle serait le meilleur choix face aux inondations, et l'ordre d'affichage n'en est pas la preuve. "
      + "Les faits présentés portent sur les inondations passées et ne disent pas la probabilité d'une inondation à venir. "
      + "Le rapport lit cette question à l'adresse.";
  }
  if (l.mode === "couverture_incomplete") {
    const nonMesurees = [...new Set(l.communes.flatMap((c) => c.nonMesurees))].slice(0, 3);
    const pourquoi = nonMesurees.length
      ? `certaines priorités ne sont pas mesurées ici (${liste(nonMesurees)})`
      : `la mesure de vos priorités n'est pas connue pour ${un ? "cette commune" : "chaque commune"}`;
    return `${un ? `L'affichage de ${noms[0] ?? "ce territoire"}` : `L'ordre de ${liste(noms)}`} ne vaut pas classement sur toutes vos priorités : ${pourquoi}. `
      + `Cette recherche n'établit donc pas ${un ? "qu'elle répond à toute votre demande" : "laquelle vous correspond le mieux"}. `
      + "Les raisons de chaque carte décrivent ce qui est mesuré, et le rapport permet de vérifier ce qui compte pour votre situation.";
  }
  return `${un ? `${noms[0] ?? "Ce territoire"} ressort` : "Ces territoires ressortent"} sur les priorités que vous avez déclarées, `
    + `mais ${un ? "il n'est pas" : "aucun n'est"} pour autant un choix parfait ni sans compromis. `
    + "Les raisons et le compromis de chaque carte disent ce qui a pesé. "
    + "Le rapport permet ensuite de vérifier si ce compromis correspond à votre situation.";
}
