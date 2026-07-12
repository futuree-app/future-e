# Le déterministe sélectionne, l'IA formule (dossier de décision)

**Date** : 2026-07-11 · **Statut** : arbitré (porteur). Slice 1 = déterministe seul.

Le déterministe (registre de règles) décide : pertinence, section, condition de matérialité, preuve,
limite, action, état de conclusion. Le type impose la doctrine (union discriminée) et des invariants
runtime (`assertFactValid`) jettent en cas de violation.

L'IA (slice 2) formule seulement : elle reçoit des sections déjà résolues, peut fusionner, reformuler,
adapter à la posture, fluidifier. Elle ne peut jamais changer un rôle, inventer une incompatibilité,
masquer une inconnue, modifier un niveau de preuve, introduire une priorité absente, ni supprimer un
lien de preuve. La sortie déterministe reste le fallback permanent.

Registre, jamais un score : on ne calcule jamais importance × gravité × confiance. L'absence de donnée
reste `null` (jamais une valeur inventée), une erreur inattendue explose (jamais maquillée en « donnée
indisponible »). Spec : `docs/superpowers/specs/2026-07-11-dossier-decision-materialite-design.md`.
