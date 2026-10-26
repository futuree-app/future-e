// FUT-139 · Les questions suggérées et les placeholders d'AskFuture (page « Où vivre »).
// Une question suggérée est une affirmation déguisée : « Pourquoi Paris plutôt que Lyon ? » dit que Paris
// a gagné. Elle ne se propose donc que si le résultat est un vrai classement sur la demande : priorités
// toutes mesurées sur les communes affichées, hors exploration (FUT-129). Sinon, les questions portent sur
// les faits de chaque commune, sans meilleur choix, sans correspondance, sans superlatif.
// Elles ne s'appuient que sur ce que la route /ask reçoit (synthèse, raisons, signaux, littoral).
import type { CouverturePriorites, CouvertureResultats } from "../comparateur-vie.ts";

// `couverture_incomplete` couvre aussi la couverture INCONNUE : une absence de preuve n'est pas un classement.
export type ModeQuestions = "classe" | "exploration_inondation" | "couverture_incomplete";

type Commune = { nom: string; littoral?: string | null; couverture?: { etat: CouverturePriorites["etat"] } | null };

/**
 * Classé seulement si la couverture complète est ÉTABLIE : l'agrégat le dit explicitement ET chaque commune
 * affichée aussi. Un champ absent, null ou inconnu ne vaut jamais « complete ».
 */
export function modeQuestions(
  outcome: { couverture?: CouvertureResultats | null; inondation?: { exploration: boolean } | null } | null | undefined,
  communes: readonly Commune[],
): ModeQuestions {
  if (outcome?.inondation?.exploration) return "exploration_inondation";
  const toutesMesurees = communes.length > 0 && communes.every((c) => c.couverture?.etat === "complete");
  if (outcome?.couverture !== "complete" || !toutesMesurees) return "couverture_incomplete";
  return "classe";
}

/** Chips suggérées (MAX 3, une seule ligne), ancrées sur les vraies communes. */
export function questionsSuggerees(communes: readonly Commune[], mode: ModeQuestions, exclusion?: string | null): string[] {
  if (!communes.length) return [];
  const c0 = communes[0].nom;
  const c1 = communes[1]?.nom;
  const plusieurs = communes.length > 1;
  const ces = plusieurs ? "ces communes" : c0;
  const littoral = communes.find((r) => r.littoral)?.nom;
  const out: string[] = [];

  if (mode === "classe") {
    out.push(c1 ? `Pourquoi ${c0} plutôt que ${c1} ?` : `Pourquoi ${c0} ressort pour mon projet ?`);
    if (littoral) out.push(`Le littoral est-il un sujet à ${littoral} ?`);
    else if (exclusion) out.push(`Que vais-je gagner en quittant ${exclusion} ?`);
    else out.push(plusieurs ? "Quels risques climatiques les séparent ?" : `Quels risques climatiques pèsent sur ${c0} ?`);
    out.push("Qu'est-ce qui a vraiment pesé ?");
    return out.slice(0, 3);
  }

  out.push(
    mode === "exploration_inondation"
      ? `Que disent les inondations passées de ${ces} ?`
      : `Que montrent les données disponibles sur ${ces} ?`,
  );
  if (littoral) out.push(`Le littoral est-il un sujet à ${littoral} ?`);
  else if (exclusion) out.push(`Qu'est-ce qui change en quittant ${exclusion} ?`);
  else out.push(`Quels risques climatiques pèsent sur ${ces} ?`);
  out.push(plusieurs ? "Quelles priorités préciser pour comparer ces communes ?" : "Quelles priorités préciser pour affiner la recherche ?");
  return out.slice(0, 3);
}

/**
 * Pool du placeholder « machine à écrire » : montre l'étendue du moteur (climat, littoral, nature/emploi,
 * retraite, canicule…), templaté sur les communes réelles. Hors classement, ni « devant », ni « la plus ».
 */
export function placeholdersAsk(communes: readonly Commune[], mode: ModeQuestions, preferences: readonly string[] = []): string[] {
  if (!communes.length) return [];
  const c0 = communes[0].nom;
  const c1 = communes[1]?.nom;
  const plusieurs = communes.length > 1;
  const litt = communes.find((r) => r.littoral)?.nom;
  const keys = new Set(preferences);
  const pool: string[] = [];

  if (mode === "classe") {
    if (c1) pool.push(`Pourquoi ${c0} ressort devant ${c1} ?`);
    pool.push("Que va changer le climat ici d'ici 2050 ?");
    if (litt) pool.push(`L'érosion du littoral est-elle un sujet à ${litt} ?`);
    if (keys.has("nature") && keys.has("viabilite_emploi"))
      pool.push("Où trouver plus de nature sans perdre l'accès à l'emploi ?");
    pool.push(plusieurs ? "Laquelle est la plus adaptée pour une retraite dans 20 ans ?" : `${c0} est-elle adaptée à une retraite dans 20 ans ?`);
    pool.push(plusieurs ? "Quelle commune restera la plus vivable pendant les canicules ?" : `Comment ${c0} vivra-t-elle les canicules ?`);
    pool.push("Pourquoi futur•e écarte des communes que j'avais en tête ?");
    pool.push("Que montrent les données que je ne vois pas encore ?");
    return pool;
  }

  if (mode === "exploration_inondation") pool.push(`Que disent les inondations passées de ${plusieurs ? "ces communes" : c0} ?`);
  pool.push("Que va changer le climat ici d'ici 2050 ?");
  if (litt) pool.push(`L'érosion du littoral est-elle un sujet à ${litt} ?`);
  pool.push(plusieurs ? "Comment ces communes vivront-elles les canicules ?" : `Comment ${c0} vivra-t-elle les canicules ?`);
  pool.push("Que montrent les données que je ne vois pas encore ?");
  pool.push(plusieurs ? "Quelles priorités préciser pour comparer ces communes ?" : "Quelles priorités préciser pour affiner la recherche ?");
  return pool;
}

/**
 * L'en-tête du bloc AskFuture. « Pourquoi ces territoires ressortent ? » suppose un classement sur la demande :
 * hors classement, le bloc parle des faits ; en exploration, les cartes n'affichent aucun compromis.
 */
export function enteteAsk(mode: ModeQuestions, nombre: number): { surtitre: string; titre: string; invite: string } {
  const un = nombre === 1;
  const territoires = un ? "le territoire proposé" : "les territoires proposés";
  const evolution = un ? "son évolution future" : "leur évolution future";
  if (mode === "classe") {
    return {
      surtitre: "Lire les arbitrages",
      titre: un ? "Pourquoi ce territoire ressort ?" : "Pourquoi ces territoires ressortent ?",
      invite: `Posez une question sur ${territoires}, les compromis identifiés ou ${evolution}.`,
    };
  }
  return {
    surtitre: "Lire les faits",
    titre: un ? "Que disent les données de ce territoire ?" : "Que disent les données de ces territoires ?",
    invite: `Posez une question sur ${territoires}, les faits qui ${un ? "le" : "les"} décrivent ou ${evolution}.`,
  };
}
