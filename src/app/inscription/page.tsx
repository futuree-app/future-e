import { AuthShell, MagicLinkForm } from "@/components/AuthForms";
import { createAccountAction } from "@/app/auth/actions";

export default function InscriptionPage() {
  return (
    <AuthShell
      alternateHref="/connexion"
      alternateLabel="Se connecter"
      alternateText="Vous avez deja un compte ?"
    >
      <MagicLinkForm
        action={createAccountAction}
        title="Creer un compte"
        subtitle="Entrez votre email pour ouvrir votre espace. futur•e cree le compte si besoin puis vous envoie un lien pour confirmer et entrer."
        submitLabel="Creer mon acces"
      />
    </AuthShell>
  );
}
