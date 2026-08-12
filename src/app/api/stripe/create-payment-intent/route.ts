import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { getPostHogClient } from "@/lib/posthog-server";
import { sanitizeDistinctId } from "@/lib/posthog-identity";
import { validateSelectedBanAddress } from "@/lib/selected-ban-address";
import { fetchBanFeaturesByLabel } from "@/lib/ban";
import { pickFeatureById } from "@/lib/ban-verify";
import { isSellableAnchor } from "@/lib/dossier-qualification";
import { quoteForDossier } from "@/lib/dossier-pricing";
import { resolvePromo } from "@/lib/promo-code";
import { normalizeBuyerName } from "@/lib/invoice";
import { hasPaidTerritory } from "@/lib/active-territory";
import { communeParent } from "@/lib/plm";

export const runtime = "nodejs";

// Server-side price map — client-provided amounts are never trusted
const PRODUCT_PRICES: Record<string, { amountEur: number; stripePriceId: string }> = {
  "one-shot":      { amountEur: 14, stripePriceId: process.env.STRIPE_RAPPORT_PRICE_ID ?? "" },
  "pack-decision": { amountEur: 39, stripePriceId: process.env.STRIPE_PACK_PRICE_ID    ?? "" },
  // Le montant réel est calculé par `quoteForDossier` (39 € ou 25 € selon le territoire déjà
  // payé) : cette entrée sert à RECONNAÎTRE le produit, son `amountEur` n'est jamais facturé.
  //
  // `STRIPE_DOSSIER_PRICE_ID` N'EXISTE PAS ET N'A PAS À EXISTER, ce n'est pas un oubli de
  // configuration. Un Price Stripe porte un montant fixe, or ce produit en a deux, décidés côté
  // serveur : un Price unique mentirait, deux Prices dupliqueraient `quoteForDossier`. Le champ
  // n'est d'ailleurs lu par personne, il est seulement recopié dans les métadonnées ;
  // `STRIPE_PACK_PRICE_ID` est absente pour la même raison et le Pack fonctionne.
  "address-dossier": { amountEur: 39, stripePriceId: process.env.STRIPE_DOSSIER_PRICE_ID ?? "" },
};

export async function POST(request: Request) {
  try {
    const {
      productType, targetInsee, targetCommune, source, rank, pack,
      phDistinctId: phDistinctIdRaw, address, checkoutAttemptId, promoCode,
    } = await request.json();

    if (typeof productType !== "string" || productType.trim().length === 0) {
      return NextResponse.json(
        { error: "Produit invalide." },
        { status: 400 },
      );
    }

    const priceConfig = PRODUCT_PRICES[productType.trim()];
    if (!priceConfig) {
      return NextResponse.json(
        { error: "Produit inconnu." },
        { status: 400 },
      );
    }

    // Territoire ciblé (parcours comparateur). Optionnel : sans lui, achat sur
    // la commune de résidence (comportement historique). On valide un vrai code
    // INSEE à 5 caractères pour ne jamais propager un code postal (piège connu).
    const cleanInsee =
      typeof targetInsee === "string" && /^[0-9AB][0-9]{4}$/i.test(targetInsee.trim())
        ? targetInsee.trim().toUpperCase()
        : "";
    const cleanCommune =
      typeof targetCommune === "string" ? targetCommune.trim().slice(0, 120) : "";
    const cleanSource =
      source === "comparateur_vie" || source === "pack_decision" ? source : "direct";
    const cleanRank =
      Number.isInteger(rank) && rank >= 1 && rank <= 3 ? String(rank) : "";

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // AUCUN PAIEMENT ANONYME, POUR AUCUN DES TROIS PRODUITS. Chacun livre un droit rattaché à un
    // compte : le 14 € pose un report_grant sur un user_id, le Pack en pose trois, le dossier crée
    // une ligne address_dossiers dont la colonne user_id est `not null`. Sans utilisateur, le
    // webhook encaissait et ne livrait rien (il garde `if (userId && userId !== "anonymous")`),
    // donc l'acheteur recevait un e-mail de confirmation et zéro accès.
    if (!user) {
      return NextResponse.json(
        { error: "Connexion requise pour finaliser un achat.", code: "AUTH_REQUIRED" },
        { status: 401 },
      );
    }

    // ════════════════════════════════════════════════════════════════════════════
    // LE NOM DE FACTURATION EST EXIGÉ AVANT LE PAIEMENT, pas après.
    //
    // Une note de prestation à un particulier doit nommer son client. Émettre la facture après
    // l'encaissement avec un nom manquant produirait une pièce non conforme, donc inutile là où
    // une facture sert ; et redemander le nom après coup suppose que l'acheteur revienne.
    // Le nom est DÉCLARÉ par le client (métadonnées de son compte) : c'est la règle normale, le
    // vendeur ne certifie pas l'identité de l'acheteur.
    //
    // Le refus porte un code distinct : l'écran de paiement demande le nom, l'enregistre sur le
    // compte, puis rejoue. Concerne les comptes créés avant que l'inscription ne demande le nom,
    // et les comptes Google dont le profil n'en porte pas.
    // ════════════════════════════════════════════════════════════════════════════
    const buyerName = normalizeBuyerName(
      (user.user_metadata as Record<string, unknown> | null)?.full_name,
    );
    if (!buyerName) {
      return NextResponse.json(
        {
          error: "Nous avons besoin de votre nom pour établir votre facture.",
          code: "BILLING_NAME_REQUIRED",
        },
        { status: 422 },
      );
    }

    // L'IDENTITÉ DE MESURE, transmise par le navigateur. Le repli est l'UUID Supabase, celui-là
    // même que `PostHogProvider` passe à `identify()`, donc un client qui n'envoie rien reste
    // rattaché à la bonne personne.
    const phDistinctId = sanitizeDistinctId(phDistinctIdRaw, user.id);

    const stripe = getStripe();

    // ════════════════════════════════════════════════════════════════════════════
    // Dossier d'adresse : revalidation de l'adresse contre la BAN, puis prix serveur.
    // ════════════════════════════════════════════════════════════════════════════
    const isDossier = productType.trim() === "address-dossier";
    let dossierAmountCents = 0;
    // Écrit sur la facture à côté de la prestation : c'est ce qui explique, à un comptable comme
    // à l'acheteur, pourquoi le montant diffère du prix affiché publiquement.
    let dossierPromoLabel: string | null = null;
    let dossierIntent: {
      banId: string; insee: string; label: string; city: string | null;
      postcode: string | null; latitude: number; longitude: number; deductionCents: number;
    } | null = null;

    if (isDossier) {
      const sel = validateSelectedBanAddress(address);
      if (!sel) {
        return NextResponse.json({ error: "Adresse invalide." }, { status: 400 });
      }

      // LA BAN A LE DERNIER MOT sur le type ET sur les coordonnées. Le checkout est rare et c'est
      // là que l'argent bouge : la qualification, à haut volume et sans conséquence financière,
      // fait confiance au client, celle-ci jamais.
      const features = await fetchBanFeaturesByLabel(sel.label, sel.citycode);
      if (features === null) {
        return NextResponse.json(
          { error: "Vérification indisponible.", code: "BAN_VERIFICATION_FAILED" },
          { status: 503 },
        );
      }
      const canonical = pickFeatureById(
        features.flatMap((f) => (f.id ? [{ ...f, id: f.id }] : [])),
        sel.banId,
      );
      // Le `citycode` est exigé parce qu'il gouverne le droit et le prix : une feature sans code
      // commune ne peut ni être comparée à un grant, ni porter un dossier.
      if (!canonical || !isSellableAnchor(canonical.type) || !canonical.citycode) {
        return NextResponse.json(
          { error: "Ce bien n'est pas identifié assez précisément.", code: "ANCHOR_REFUSED" },
          { status: 422 },
        );
      }

      // TOUTES les valeurs viennent de la feature canonique. Sécuriser le type en gardant les
      // coordonnées du client analyserait un point choisi par le client.
      const paid = await hasPaidTerritory(supabase, user.id, communeParent(canonical.citycode));

      // LE CODE EST RÉSOLU ICI, C'EST LE SEUL ENDROIT QUI COMPTE. La page de checkout le résout
      // aussi, mais pour AFFICHER : un code fabriqué dans l'URL, ou un montant modifié dans le
      // corps de la requête, ne changent rien à ce qui est encaissé. Un code expiré entre le
      // moment où l'écran s'est rendu et celui du paiement fait donc payer le plein tarif, ce qui
      // est le bon sens de l'erreur.
      const promo = resolvePromo(promoCode, "address-dossier", new Date());
      const quote = quoteForDossier(paid, promo);
      dossierAmountCents = quote.amountDueCents;
      dossierPromoLabel = quote.promoLabel;
      dossierIntent = {
        banId: canonical.id, insee: canonical.citycode, label: canonical.label,
        city: canonical.city, postcode: canonical.postcode,
        latitude: canonical.latitude, longitude: canonical.longitude,
        deductionCents: quote.territoryDeductionCents,
      };
    }

    // Clé d'idempotence de la TENTATIVE, générée par la page de checkout. Rien ne dépend de la
    // confiance qu'on lui accorde : le prix est recalculé à chaque requête, donc ce jeton n'est
    // qu'une clé. Un identifiant absent ou biscornu produit une tentative neuve plutôt qu'un
    // refus, parce qu'une clé illisible ne doit jamais empêcher un achat légitime.
    const attemptId =
      typeof checkoutAttemptId === "string" && /^[A-Za-z0-9_-]{8,100}$/.test(checkoutAttemptId)
        ? checkoutAttemptId
        : crypto.randomUUID();

    // Pack Décision : 2-3 INSEE valides. Mode 'replay' (trio /ou-vivre, snapshot du
    // projet requis) ou 'choix' (communes nommées sur /comparateur, sans projet,
    // reconstruites via seedComparaison). Le snapshot replay est persisté en base
    // (pack_snapshots) ; les metadata Stripe ne portent que le petit (INSEE, communes,
    // libellé/mode).
    const isPack = productType.trim() === "pack-decision";
    const packMode = pack?.mode === "choix" ? "choix" : "replay";
    let packTrio: { insee: string; commune: string }[] = [];
    let packProjetLabel = "";
    if (isPack) {
      const raw = Array.isArray(pack?.trio) ? pack.trio : [];
      packTrio = raw
        .map((t: { insee?: string; commune?: string }) => ({
          insee: typeof t?.insee === "string" && /^[0-9AB][0-9]{4}$/i.test(t.insee.trim())
            ? t.insee.trim().toUpperCase() : "",
          commune: typeof t?.commune === "string" ? t.commune.trim().slice(0, 120) : "",
        }))
        .filter((t: { insee: string }) => t.insee)
        .slice(0, 3);
      // choix : 2 ou 3 communes ; replay : exactement 3.
      const okCount = packMode === "choix" ? packTrio.length >= 2 : packTrio.length === 3;
      if (!okCount) {
        return NextResponse.json(
          { error: packMode === "choix" ? "2 à 3 communes requises." : "Trio de 3 communes requis." },
          { status: 400 },
        );
      }
      // replay seul exige le snapshot du projet ; choix n'en a pas.
      if (packMode === "replay" && (!pack?.parsedSnapshot || typeof pack.parsedSnapshot !== "object")) {
        return NextResponse.json({ error: "Projet manquant." }, { status: 400 });
      }
      packProjetLabel = typeof pack?.projetLabel === "string" ? pack.projetLabel.trim().slice(0, 200) : "";
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: isDossier ? dossierAmountCents : Math.round(priceConfig.amountEur * 100),
      currency: "eur",
      payment_method_types: ["card"],
      metadata: {
        userId: user.id,
        userEmail: user.email ?? "",
        productType: productType.trim(),
        stripePriceId: priceConfig.stripePriceId,
        targetInsee: cleanInsee,
        targetCommune: cleanCommune,
        grantSource: cleanSource,
        grantRank: cleanRank,
        packMode: isPack ? packMode : "",
        packInsee1: isPack ? packTrio[0].insee : "",
        packInsee2: isPack ? packTrio[1].insee : "",
        packInsee3: isPack ? (packTrio[2]?.insee ?? "") : "",
        packCommune1: isPack ? packTrio[0].commune : "",
        packCommune2: isPack ? packTrio[1].commune : "",
        packCommune3: isPack ? (packTrio[2]?.commune ?? "") : "",
        packProjetLabel,
        // Voyage jusqu'au webhook, seul point du parcours sans navigateur.
        phDistinctId,
        // Le tarif appliqué, figé lui aussi : la facture le porte, et il ne se recalcule pas.
        promoLabel: dossierPromoLabel ?? "",
        // Le nom de facturation, FIGÉ AU MOMENT DE L'ACHAT. Le webhook ne relit pas le compte :
        // un client qui change son nom entre le paiement et le rejeu du webhook ne doit pas
        // changer le nom porté par la facture de cet encaissement-là.
        buyerName,
        checkoutAttemptId: isDossier ? attemptId : "",
      },
    },
      // IDEMPOTENCE TECHNIQUE SEULE, et bornée par l'utilisateur. Elle ne dérive PAS du `ban_id` :
      // le produit autorise délibérément plusieurs dossiers à la même adresse (deux appartements
      // d'un immeuble), et une clé fondée sur l'adresse rendrait à l'acheteur du second bien le
      // PaymentIntent du premier. Un double clic réutilise la tentative ; « créer un autre
      // dossier » repasse par la page de checkout, donc par une clé neuve.
      isDossier ? { idempotencyKey: `dossier_${user.id}_${attemptId}` } : undefined,
    );

    if (isDossier && dossierIntent) {
      const { createClient: createAdminClient } = await import("@supabase/supabase-js");
      const admin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
      );
      const { error: intentError } = await admin.from("dossier_intents").upsert(
        {
          stripe_payment_intent_id: paymentIntent.id,
          user_id: user.id,
          ban_id: dossierIntent.banId,
          insee: dossierIntent.insee,
          address_label: dossierIntent.label,
          city: dossierIntent.city,
          postcode: dossierIntent.postcode,
          latitude: dossierIntent.latitude,
          longitude: dossierIntent.longitude,
          amount_due_cents: dossierAmountCents,
          territory_deduction_cents: dossierIntent.deductionCents,
        },
        { onConflict: "stripe_payment_intent_id" },
      );

      // SANS INTENTION, LE WEBHOOK NE POURRA PAS CRÉER LE DOSSIER. Rendre le `clientSecret` ici
      // reviendrait à ouvrir un paiement dont la livraison est déjà impossible. On échoue avant
      // que la carte ne soit débitée.
      if (intentError) {
        console.error("[create-payment-intent] dossier_intents", intentError.message);
        return NextResponse.json(
          { error: "Préparation du dossier impossible." },
          { status: 500 },
        );
      }
    }

    if (isPack) {
      const { createClient: createAdminClient } = await import("@supabase/supabase-js");
      const { trioKey } = await import("@/lib/decision-packs");
      const admin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
      );
      await admin.from("pack_snapshots").upsert(
        {
          stripe_payment_intent_id: paymentIntent.id,
          user_id: user.id,
          mode: packMode,
          trio_key: trioKey(packTrio.map((t) => t.insee)),
          insee_1: packTrio[0].insee,
          insee_2: packTrio[1].insee,
          insee_3: packTrio[2]?.insee ?? null,
          commune_1: packTrio[0].commune || null,
          commune_2: packTrio[1].commune || null,
          commune_3: packTrio[2]?.commune || null,
          projet_label: packProjetLabel || null,
          // choix : aucun ParsedProject (la matrice se reconstruit via seedComparaison).
          parsed_snapshot: packMode === "choix" ? null : pack.parsedSnapshot,
        },
        { onConflict: "stripe_payment_intent_id" },
      );
    }

    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: phDistinctId,
      event: "payment_intent_created",
      properties: {
        product_type: productType.trim(),
        amount: isDossier ? dossierAmountCents / 100 : priceConfig.amountEur,
        currency: "eur",
        user_id: user.id,
      },
    });
    await posthog.shutdown();

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      // CE QUE LE COMPTE SAIT DÉJÀ, RENVOYÉ POUR NE PAS LE REDEMANDER (13/08/2026). L'acheteur
      // venait de créer son compte avec son nom et son e-mail, et l'écran de paiement les
      // redemandait à l'identique : Stripe ne connaît pas notre session, et personne ne les lui
      // avait passés. Ils préremplissent les champs de facturation ; le serveur reste seul maître
      // de ce qui part sur la facture (`buyerName` ci-dessus), le navigateur ne fixe rien.
      billing: { name: buyerName, email: user.email ?? null },
    });
  } catch (error) {
    console.error("[stripe/create-payment-intent]", error);

    return NextResponse.json(
      { error: "Erreur lors de la création du paiement." },
      { status: 500 },
    );
  }
}
