export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";
import { fetchBanFeaturesByLabel } from "@/lib/ban";
import { pickFeatureById } from "@/lib/ban-verify";
import { isSellableAnchor } from "@/lib/dossier-qualification";
import { quoteForDossier } from "@/lib/dossier-pricing";
import { resolvePromo, promoExists } from "@/lib/promo-code";
import { hasPaidTerritory } from "@/lib/active-territory";
import { communeParent } from "@/lib/plm";
import { DossierCheckoutPanel } from "./DossierCheckoutPanel";

// ════════════════════════════════════════════════════════════════════════════
// Le checkout du dossier d'adresse.
//
// UN SEGMENT STATIQUE PRIME SUR UN SEGMENT DYNAMIQUE : cette page gagne sur `/checkout/[product]`,
// qui appelle `notFound()` pour tout slug hors `rapport-complet`. Le registre catalogue reste donc
// intact, sans thème ni copie à recevoir pour un produit qui se rend dynamiquement.
//
// L'IDENTITÉ AU DERNIER MOMENT UTILE. Le lecteur a déjà vu que son bien est analysable, ce que le
// dossier contiendra et ce qui manquera : l'authentification n'interrompt pas la découverte, elle
// sécurise l'acquisition. Une ligne `address_dossiers` appartient à un `user_id` déclaré
// `not null`, donc un encaissement anonyme produirait un paiement sans objet analysable.
// ════════════════════════════════════════════════════════════════════════════

export default async function DossierCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ banId?: string; label?: string; insee?: string; code?: string }>;
}) {
  const { banId, label, insee, code } = await searchParams;
  if (!banId || !label || !insee) redirect("/dossier");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // `getSafeNextPath` (src/app/auth/actions.ts) accepte tout chemin relatif, query comprise, donc
  // l'adresse survit à la connexion et le lecteur revient exactement ici.
  if (!user) {
    // LE CODE SURVIT À LA CRÉATION DE COMPTE, et c'est le maillon qui manquait le plus : un
    // visiteur invité par un lien avec code n'a PAS de compte par définition, il passe donc tous
    // par ici. Sans le code dans `next`, il revenait au paiement au tarif plein après s'être
    // inscrit, sans que rien n'explique la différence.
    const next = `/checkout/dossier?banId=${encodeURIComponent(banId)}&label=${encodeURIComponent(label)}&insee=${encodeURIComponent(insee)}${code ? `&code=${encodeURIComponent(code)}` : ""}`;
    redirect(`/connexion?next=${encodeURIComponent(next)}`);
  }

  // LE SERVEUR DÉCIDE DE L'ADRESSE. Le navigateur n'a transmis qu'un libellé et une commune, qui
  // suffisent à retrouver la feature canonique ; toutes les valeurs viennent ensuite d'elle.
  // Sécuriser le type en gardant les coordonnées du client analyserait un point choisi par lui.
  const features = await fetchBanFeaturesByLabel(label, insee);
  if (features === null) redirect("/dossier?erreur=verification");

  const canonical = pickFeatureById(
    features.flatMap((f) => (f.id ? [{ ...f, id: f.id }] : [])),
    banId,
  );
  // Le `citycode` est exigé ici parce qu'il gouverne le droit et le prix : une feature sans code
  // commune ne peut ni être comparée à un grant, ni porter un dossier.
  if (!canonical || !isSellableAnchor(canonical.type) || !canonical.citycode) {
    redirect("/dossier?erreur=ancrage");
  }

  const paid = await hasPaidTerritory(supabase, user.id, communeParent(canonical.citycode));

  // LE CODE EST RÉSOLU CÔTÉ SERVEUR, ici comme au moment de créer le paiement. Cette page ne fait
  // qu'AFFICHER : la route de paiement le résout à nouveau, sur la même table, donc un code
  // fabriqué dans l'URL ne changerait rien à ce qui est encaissé.
  //
  // On distingue « inconnu » d'« expiré » : un code expiré affiché comme invalide laisserait
  // croire à une faute de frappe, et la personne réessaierait indéfiniment.
  const promo = resolvePromo(code, "address-dossier", new Date());
  const promoRejected = Boolean(code?.trim()) && !promo;
  const promoExpired = promoRejected && promoExists(code);
  const quote = quoteForDossier(paid, promo);

  return (
    <div
      className="min-h-screen bg-canvas text-label relative overflow-hidden"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      <Navbar />

      <div className="relative z-[2] max-w-[920px] mx-auto px-7 pb-24 pt-14">
        <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-ghost mb-2">
          Le dossier de ce bien
        </p>
        <h1
          className="font-[var(--weight-title)] text-[length:var(--text-title)] leading-[1.15] tracking-[-0.5px] text-label mb-8"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          {canonical.label}
        </h1>

        <DossierCheckoutPanel
          address={{
            banId: canonical.id,
            label: canonical.label,
            postcode: canonical.postcode ?? "",
            city: canonical.city ?? "",
            citycode: canonical.citycode,
            latitude: canonical.latitude,
            longitude: canonical.longitude,
            type: canonical.type,
          }}
          quote={quote}
          promoCode={promo?.code ?? null}
          promoRejected={promoRejected}
          promoExpired={promoExpired}
          userEmail={user.email}
          checkoutAttemptId={crypto.randomUUID()}
        />
      </div>
    </div>
  );
}
