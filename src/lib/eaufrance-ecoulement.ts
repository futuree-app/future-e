// LA LECTURE DES ÉCOULEMENTS ONDE, isolée de la couche d'accès (eaufrance.ts est `server-only`).
//
// Elle vivait dans une fonction d'I/O, donc intestable — et elle a lu un champ INEXISTANT pendant tout
// ce temps : `libelle_observation` au lieu de `libelle_ecoulement`. La valeur était toujours
// `undefined`, donc `isDry` toujours faux : un cours d'eau à sec n'a jamais pu être signalé. Même
// signature que le bug « feux de forêt » de Géorisques — une chaîne d'API jamais confrontée à la source.
//
// Le corpus des valeurs réelles vit dans fixtures-sources-externes.ts, et les tests dans
// eaufrance.test.ts.
// LE COURS D'EAU EST-IL À SEC ? Fonction PURE et exportée : la logique vivait dans une fonction d'I/O,
// donc intestable — et elle a porté une lecture de champ inexistante sans que rien ne le signale.
//
// ONDE renvoie six valeurs distinctes, SANS accent sur le E initial (vérifié le 25/07/2026) :
// « Assec », « Ecoulement visible faible », « Ecoulement visible acceptable », « Ecoulement non
// visible », « Ecoulement visible », « Observation impossible ». SEULE « Assec » dit un cours d'eau à sec.
//
// FUT-163 (31/10/2026) : « Ecoulement non visible » N'EST PAS un assec. Dans la typologie ONDE, l'eau est
// encore présente au point observé, mais elle ne s'écoule plus visiblement. Cette fonction le comptait
// comme sec, et `isDry` nourrit `cours_eau_a_sec_observe` dans la projection de synthèse : le modèle
// aurait affirmé un assec que l'OFB n'a pas publié. L'état reste conservé tel quel (`status`) et se lit
// par `lireEcoulement` (« ecoulement_interrompu ») : il n'est pas perdu, il n'est plus confondu.
//
// « Observation impossible » n'est PAS un assec : c'est une absence de mesure, et la traiter comme une
// bonne ou une mauvaise nouvelle inventerait un état que la source ne donne pas.
export function estACec(libelle: string | null | undefined): boolean {
  return (libelle ?? "").toLowerCase().includes("assec");
}

// ── FUT-165 (30/10/2026) : LE CHAMP ÉTAIT LU, JAMAIS DEMANDÉ ─────────────────────────────────────
//
// Le correctif du 25/07 a changé la LECTURE (`libelle_ecoulement`) sans changer la REQUÊTE : `fields`
// demandait toujours `libelle_observation`. Hub'Eau ne renvoie que les champs demandés, donc l'état
// n'arrivait jamais : `status` valait `null`, `isDry` faux, et la carte disait « Pas de cours d'eau à
// sec ». Commune 16016, 28/10/2026 : la source disait « Assec ». Le test d'alors vérifiait la lecture
// d'une réponse fabriquée, jamais la requête. La liste des champs vit donc ICI, à côté de la lecture, et
// un test fait tourner la vraie requête contre un Hub'Eau simulé qui ne rend que les champs demandés.
export const CHAMPS_ECOULEMENT = ["date_observation", "libelle_ecoulement", "libelle_cours_eau"] as const;

export type EcoulementLu = {
  lastObservationDate: string | null;
  riverName: string | null;
  status: string | null;
  isDry: boolean;
};

export type EtatEcoulement =
  | "assec"
  | "ecoulement_interrompu"
  | "ecoulement"
  | "observation_impossible"
  /** Un relevé daté SANS état : la signature exacte du défaut, dans les dossiers enregistrés avant FUT-165. */
  | "non_verifiable";

/** L'état à dire, et sa phrase. L'état brut de la source reste la référence ; rien n'est déduit au-delà. */
//
// La lecture se fait sur l'ÉTAT BRUT (`status`), jamais sur `isDry` : un booléen enregistré dans un dossier
// porte la sémantique du jour où il a été calculé, l'état de la source, lui, ne change pas de sens.
export function lireEcoulement(d: Pick<EcoulementLu, "status">): { etat: EtatEcoulement; texte: string } {
  const s = (d.status ?? "").trim().toLowerCase();
  if (!s) return { etat: "non_verifiable", texte: "État du cours d'eau non vérifiable à la date de ce dossier" };
  if (s.includes("assec")) return { etat: "assec", texte: "Cours d'eau à sec (assec)" };
  if (s.includes("non visible")) return { etat: "ecoulement_interrompu", texte: "Écoulement interrompu, plus visible" };
  if (s.includes("impossible")) return { etat: "observation_impossible", texte: "Observation impossible ce jour-là" };
  if (s.includes("visible")) return { etat: "ecoulement", texte: "Écoulement visible au point observé" };
  // Une valeur que la source n'avait pas en juillet : on la rend telle quelle, sans l'interpréter.
  return { etat: "ecoulement", texte: d.status!.trim() };
}
