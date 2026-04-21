import { AuthShell, MagicLinkForm } from "@/components/AuthForms";
import { sendMagicLinkAction } from "@/app/auth/actions";

export default function ConnexionPage() {
  return (
    <AuthShell
      alternateHref="/inscription"
      alternateLabel="Creer un compte"
      alternateText="Pas encore de compte ?"
    >
      <MagicLinkForm
        action={sendMagicLinkAction}
        title="Connexion"
        subtitle="Entrez l'email d'un compte existant. futur•e vous envoie un lien de connexion sans mot de passe."
        submitLabel="Recevoir un lien de connexion"
      />
    </AuthShell>
  );
}
