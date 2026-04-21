import { AuthShell, MagicLinkForm } from "@/components/AuthForms";
import { sendMagicLinkAction } from "@/app/auth/actions";

export default function InscriptionPage() {
  return (
    <AuthShell
      alternateHref="/connexion"
      alternateLabel="Se connecter"
      alternateText="Vous avez deja un compte ?"
    >
      <MagicLinkForm
        action={sendMagicLinkAction}
        title="Creer un compte"
        subtitle="Entrez votre email. futur•e cree le compte et vous envoie un magic link pour l'ouvrir."
        submitLabel="Recevoir mon lien magique"
      />
    </AuthShell>
  );
}
