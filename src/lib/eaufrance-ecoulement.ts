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
// visible », « Ecoulement visible », « Observation impossible ». Seules les deux premières formes
// ci-dessous signalent un cours d'eau effectivement à sec.
//
// « Observation impossible » n'est PAS un assec : c'est une absence de mesure, et la traiter comme une
// bonne ou une mauvaise nouvelle inventerait un état que la source ne donne pas.
export function estACec(libelle: string | null | undefined): boolean {
  const obs = (libelle ?? "").toLowerCase();
  return obs.includes("assec") || obs.includes("non visible");
}
