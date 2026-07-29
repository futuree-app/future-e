import "server-only";

// Deux verrous indépendants, partagés par la route d'administration et par la surface qui affiche
// son bouton. `ENABLE_ADMIN_DOSSIER_CREATION` est absent en production par défaut : la porte y est
// fermée quelle que soit la liste d'e-mails.
//
// Ce prédicat ne gouverne QUE la création. Aucun contrôle d'accès en lecture ne le consulte, et
// c'est ce qui borne son pire effet : quelqu'un se crée des dossiers vides à lui-même.
export function isAdminDossierCreator(email: string | null | undefined): boolean {
  if (process.env.ENABLE_ADMIN_DOSSIER_CREATION !== "true") return false;
  const allowed = (process.env.FUTUREE_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return Boolean(email && allowed.includes(email.toLowerCase()));
}
