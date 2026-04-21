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
        subtitle="futur•e se connecte uniquement par magic link. Entrez votre email et ouvrez le lien reçu."
        submitLabel="Recevoir un lien de connexion"
      />
    </AuthShell>
  );
}
