"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { attendreTerritoire } from "@/lib/commerce/attendre-territoire";

export function OuvertureTerritoire({ insee, commune }: { insee: string; commune: string }) {
  const router = useRouter();
  const [tentative, setTentative] = useState(0);
  const [etat, setEtat] = useState("verification");

  useEffect(() => {
    const controller = new AbortController();
    void attendreTerritoire(insee, controller.signal).then((resultat) => {
      if (controller.signal.aborted) return;
      if (resultat === "ouvert") {
        // Navigation complète : évite de réutiliser un rapport préchargé avant le paiement.
        window.location.replace("/rapport");
      } else if (resultat === "connexion") {
        router.replace(`/connexion?next=${encodeURIComponent(`/territoire/${insee}/ouvrir`)}`);
      } else {
        setEtat(resultat);
      }
    });
    return () => controller.abort();
  }, [insee, tentative, router]);

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <section className="w-full max-w-[640px]" aria-live="polite">
        <h1 className="font-serif text-3xl mb-5">Votre rapport : {commune}</h1>
        <p className="text-[var(--fg-3)] leading-relaxed mb-6">
          {etat === "verification"
            ? "Nous vérifions votre accès. Si vous venez de payer, l’ouverture peut prendre quelques secondes."
            : "Votre accès n’a pas encore pu être confirmé. Si vous venez de payer, ne payez pas de nouveau : réessayez dans quelques instants. Si l’attente persiste, contactez-nous."}
        </p>
        {etat !== "verification" && (
          <>
            <button className="rounded-lg bg-accent px-5 py-3 text-[#12172a] mb-6" onClick={() => {
              setEtat("verification");
              setTentative((n) => n + 1);
            }}>Vérifier de nouveau</button>
            <p className="mb-6"><a href="mailto:hello@futur-e.fr" className="underline">Contacter futur•e</a></p>
          </>
        )}
        <Link href="/compte" className="underline text-[var(--fg-3)]">Revenir à mon compte</Link>
      </section>
    </main>
  );
}
