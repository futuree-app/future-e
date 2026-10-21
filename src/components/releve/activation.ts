// FUT-91 · FUT-118 · L'ACTIVATION DU RELEVÉ DANS « MA DÉCISION ».
//
// La nouvelle présentation est LIVRÉE ÉTEINTE. Deux bascules, et seulement deux, côté serveur :
//
//   DECISION_RELEVE=true            tout le monde (la bascule générale, inchangée depuis FUT-91) ;
//   DECISION_RELEVE_COMPTES=<uuid>…  quelques comptes seulement, avant la bascule générale (palier 1 du
//                                   protocole, rapport FUT-118 § 6.3 et 6.4).
//
// LA LISTE DE COMPTES N'EST PAS UN DROIT. Elle ne lit ni `FUTUREE_ADMIN_EMAILS` ni les achats : y
// ajouter un compte de test ne lui donne aucun pouvoir, retirer un administrateur ne lui en retire
// aucun. Elle identifie par l'UUID Supabase, jamais par l'e-mail (aucune donnée personnelle de plus
// dans les variables). Un identifiant mal formé est ignoré, jamais interprété : une faute de frappe
// ne peut pas ouvrir la présentation à quelqu'un d'autre.
//
// RÉSOLUE UNE FOIS PAR REQUÊTE. `/rapport` monte la présentation en quatre points (la racine de la
// page, qui règle le débordement pour la colonne collante, puis `DossierDecisionSection`,
// `ControlesDuDossier` et `DossierAvecLogement`). Avec une bascule globale ils étaient d'accord par
// construction ; avec une bascule par compte, une racine et une section pourraient diverger. La page
// appelle donc `presentationPour` UNE fois et passe le résultat à chacun ; aucun composant ne la
// résout seul (test `decision-releve.test.ts`, A2).
//
// RETOUR À L'INTERFACE CLASSIQUE : retirer l'identifiant (ou la variable) et redéployer, ou, en
// secondes, Instant Rollback vers le déploiement précédent. Le rendu est sans état : basculer dans un
// sens ou dans l'autre ne touche ni les artefacts, ni les lectures enrichies (même empreinte), ni les
// droits.
export type PresentationDossier = "classique" | "releve";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Les comptes du palier : identifiants Supabase séparés par des virgules ou des espaces. */
export function comptesDuReleve(env: Record<string, string | undefined> = process.env): ReadonlySet<string> {
  return new Set(
    (env.DECISION_RELEVE_COMPTES ?? "")
      .split(/[\s,;]+/)
      .map((s) => s.trim().toLowerCase())
      .filter((s) => UUID.test(s)),
  );
}

/** LA présentation de Ma décision pour ce compte, à résoudre une fois par requête. */
export function presentationPour(
  userId: string | null | undefined,
  env: Record<string, string | undefined> = process.env,
): PresentationDossier {
  if (env.DECISION_RELEVE === "true") return "releve";
  if (userId && comptesDuReleve(env).has(userId.toLowerCase())) return "releve";
  return "classique";
}
