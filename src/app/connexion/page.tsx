import { AuthShell, MagicLinkForm } from "@/components/AuthForms";
import { continueWithEmailAction } from "@/app/auth/actions";

export default function ConnexionPage() {
  return (
    <AuthShell>
      <MagicLinkForm
        action={continueWithEmailAction}
        title="Continuer avec votre email"
        subtitle="Entrez votre email. futur•e vous envoie un lien pour entrer dans votre espace. Si c'est votre premiere visite, votre acces sera cree automatiquement."
        submitLabel="Recevoir mon lien"
      />
    </AuthShell>
  );
}
