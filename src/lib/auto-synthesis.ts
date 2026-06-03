// Auto-déclenchement des synthèses Claude (comparateur + quartier). Par défaut OFF :
// le défaut sûr pendant la phase de test (plateforme non indexée) est « ne dépense pas ».
// L'auto ne s'active que si NEXT_PUBLIC_AUTO_SYNTHESIS vaut explicitement "true" (à poser
// au lancement, côté Vercel, par environnement). NEXT_PUBLIC_ = lisible client, inliné au build.
export const AUTO_SYNTHESIS = process.env.NEXT_PUBLIC_AUTO_SYNTHESIS === "true";
