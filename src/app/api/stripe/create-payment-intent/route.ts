import { NextResponse } from "next/server";
import { cardinalPackValide } from "@/lib/comparaison-cardinal";
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
import { colonnesIntention, lireContexteCheckout, projetVuEstACour } from "@/lib/dossier-contexte-checkout";
import { enregistrerIntention, statutStripeModifiable } from "@/lib/verrou-intention-dossier";
import { storeIntentionsSupabase } from "@/lib/server/intention-dossier-store";
import { normalizeUserProject, type UserProject } from "@/lib/user-project";
import {
  communeIdentifiee, communeVendable, ensembleVendable, REFUS_NON_IDENTIFIE,
} from "@/lib/commerce/eligibilite-territoriale";
import { communeDuReferentiel, nomDuReferentiel } from "@/lib/commerce/referentiel-communes";
import { PACK_DECISION_AMOUNT_CENTS } from "@/lib/commerce/preuve-paiement-pack";

export const runtime = "nodejs";

// Server-side price map — client-provided amounts are never trusted
const PRODUCT_PRICES: Record<string, { amountEur: number; stripePriceId: string }> = {
  "one-shot":      { amountEur: 14, stripePriceId: process.env.STRIPE_RAPPORT_PRICE_ID ?? "" },
  // FUT-115 : le montant vient de la constante que l'octroi vérifie : un changement de prix ne peut pas
  // rendre un comparatif payé impossible à ouvrir.
  "pack-decision": { amountEur: PACK_DECISION_AMOUNT_CENTS / 100, stripePriceId: process.env.STRIPE_PACK_PRICE_ID    ?? "" },
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
      productType, targetInsee, source, rank, pack,
      phDistinctId: phDistinctIdRaw, address, checkoutAttemptId, promoCode, dossierContext,
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

    // ════════════════════════════════════════════════════════════════════════════════════════════
    // FUT-114 · LA COMMUNE VENDUE EST VÉRIFIÉE ICI, AVANT TOUT EFFET DE BORD.
    //
    // La V1 ne vend qu'en métropole, Corse comprise. Le dossier de territoire (14 €) porte sur la commune
    // `targetInsee`, qui devient le `report_grant` au webhook : elle est OBLIGATOIRE et doit figurer dans le
    // référentiel. Le parcours « sans commune » (achat sur la résidence) ne posait aucun droit territorial :
    // il encaissait 14 € sans rien ouvrir, il est refusé. Le Pack et le dossier d'adresse sont gardés plus
    // bas, sur leurs propres communes. Aucun de ces refus n'a besoin d'un compte : un appel direct est
    // refusé de la même façon, avant même la lecture de la session.
    // ════════════════════════════════════════════════════════════════════════════════════════════
    //
    // FUT-119 : le NOM de la commune est celui du référentiel, jamais `targetCommune`. Il part dans les
    // métadonnées, donc dans le grant, le territoire actif, la facture et le courriel : un nom contradictoire
    // reçu du client y aurait décrit une autre commune que celle payée.
    let cleanInsee = "";
    let cleanCommune = "";
    if (productType.trim() === "one-shot") {
      const territoire = communeIdentifiee(targetInsee, communeDuReferentiel, nomDuReferentiel);
      if (!territoire.ok) {
        return NextResponse.json({ error: territoire.error, code: territoire.code }, { status: 422 });
      }
      cleanInsee = territoire.insee;
      cleanCommune = territoire.nom;
    }
    // Le comparatif : TOUTES ses communes, une seule refusée refuse l'ensemble. Les codes vérifiés
    // remplacent ceux du client dans la suite (forme du COG, Corse comprise).
    let packInseesVerifies: string[] = [];
    if (productType.trim() === "pack-decision") {
      const brut: unknown[] = Array.isArray(pack?.trio) ? pack.trio : [];
      const ensemble = ensembleVendable(
        brut.map((t) => (t && typeof t === "object" ? (t as { insee?: unknown }).insee : t)),
        communeDuReferentiel,
      );
      if (!ensemble.ok) {
        return NextResponse.json({ error: ensemble.error, code: ensemble.code }, { status: 422 });
      }
      packInseesVerifies = ensemble.insees;
      // FUT-119 : chaque commune du comparatif est nommée par le référentiel, comme le 14 €.
      if (packInseesVerifies.some((insee) => !nomDuReferentiel(insee))) {
        return NextResponse.json({ error: REFUS_NON_IDENTIFIE.error, code: REFUS_NON_IDENTIFIE.code }, { status: 422 });
      }
    }
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
    // FUT-10 : les colonnes de contexte de l'intention (relation, objectif, date serveur, projet figé).
    let colonnesContexte: ReturnType<typeof colonnesIntention> | null = null;

    if (isDossier) {
      const sel = validateSelectedBanAddress(address);
      if (!sel) {
        return NextResponse.json({ error: "Adresse invalide." }, { status: 400 });
      }

      // ══════════════════════════════════════════════════════════════════════════════════════
      // LE CONTEXTE DÉCLARÉ (FUT-10), VALIDÉ AVANT TOUT PAIEMENT.
      //
      // Une valeur hors liste est un refus, pas un `null` : le lecteur paierait un dossier dont sa
      // réponse aurait disparu. Le PROJET est relu ici, en base, jamais reçu du navigateur ; et il
      // doit être celui que l'écran a montré. S'il a changé entre-temps (autre onglet), on refuse :
      // le lecteur ne confirme jamais un projet qu'il n'a pas vu. Rien de tout cela ne part dans les
      // métadonnées Stripe : il ne vit que dans `dossier_intents`, réservée au service role.
      // ══════════════════════════════════════════════════════════════════════════════════════
      const contexte = lireContexteCheckout(dossierContext);
      if (!contexte.ok) {
        return NextResponse.json({ error: "Réponses invalides." }, { status: 400 });
      }
      let projetCanonique: UserProject | null = null;
      if (contexte.value.projetVu) {
        const { data: profil, error: profilError } = await supabase
          .from("user_profiles")
          .select("user_project")
          .eq("user_id", user.id)
          .maybeSingle();
        if (profilError) {
          console.error("[create-payment-intent] lecture du projet impossible");
          return NextResponse.json({ error: "Préparation du dossier impossible." }, { status: 500 });
        }
        projetCanonique = normalizeUserProject((profil as { user_project?: unknown } | null)?.user_project ?? null);
        if (!projetVuEstACour(contexte.value.projetVu, projetCanonique)) {
          return NextResponse.json(
            { error: "Votre projet a changé entre-temps. Rechargez la page pour le relire.", code: "PROJECT_CHANGED" },
            { status: 409 },
          );
        }
      }
      colonnesContexte = colonnesIntention(contexte.value, projetCanonique, new Date());

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
      // FUT-114 : la commune du bien, celle que la BAN a rendue (arrondissement pour Paris, Lyon, Marseille),
      // jamais celle que le client a déclarée. Avant le tarif, avant Stripe, avant l'intention.
      const communeDuBien = communeVendable(canonical.citycode, communeDuReferentiel);
      if (!communeDuBien.ok) {
        return NextResponse.json({ error: communeDuBien.error, code: communeDuBien.code }, { status: 422 });
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
      // Chaque code a déjà passé `ensembleVendable` (FUT-114) : on reprend sa forme vérifiée.
      packTrio = raw
        .map((_: unknown, i: number) => ({
          insee: packInseesVerifies[i] ?? "",
          commune: nomDuReferentiel(packInseesVerifies[i] ?? "") ?? "",
        }))
        .filter((t: { insee: string }) => t.insee)
        .slice(0, 3);
      // choix : 2 ou 3 communes ; replay : exactement 3 (règle testée dans comparaison-cardinal.test.ts).
      const okCount = cardinalPackValide(packMode, packTrio.length);
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
      // LE REÇU STRIPE, FILET DE DERNIER RECOURS (13/08/2026).
      //
      // Il manquait, et son absence s'est vue à la première vente réelle : notre message de
      // confirmation n'est jamais arrivé, et l'acheteuse n'a RIEN reçu du tout, pas même une
      // preuve de paiement. Avec ce champ, Stripe envoie son propre reçu, par une infrastructure
      // qui n'est pas la nôtre et qui tombe donc pour d'autres raisons que la nôtre.
      //
      // C'EST L'ADRESSE DU COMPTE, jamais celle de la carte : le dossier est rattaché au compte,
      // et c'est là que le lecteur ira le lire. Payer avec la carte d'un proche est un cas
      // ordinaire, et le reçu doit suivre l'acheteur, pas le porteur de la carte.
      //
      // Ce reçu ne remplace PAS la facture : il ne porte ni la mention de l'article 293 B, ni le
      // numéro de la séquence légale. Il prouve seulement qu'un paiement a eu lieu.
      ...(user.email ? { receipt_email: user.email } : {}),
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
      // ══════════════════════════════════════════════════════════════════════════════════════
      // L'INTENTION ET SON CONTEXTE, SOUS VERROU (revue FUT-10).
      //
      // Première demande pour ce PaymentIntent : l'intention est créée. Demande suivante (réponses
      // corrigées, même clé d'idempotence, donc même PaymentIntent) : elle est mise à jour SEULEMENT si
      // la confirmation n'est pas engagée, condition portée par la requête SQL elle-même
      // (`context_locked_at is null`) et vérifiée d'abord auprès de Stripe. Sinon RIEN n'est écrit et
      // le formulaire n'est pas rendu : on ne paie jamais avec des réponses qui ne seraient pas celles
      // livrées. Cf. `verrou-intention-dossier.ts`.
      // ══════════════════════════════════════════════════════════════════════════════════════
      let resultat: Awaited<ReturnType<typeof enregistrerIntention>>;
      try {
        resultat = await enregistrerIntention(storeIntentionsSupabase(), {
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
          // FUT-10 : relation, objectif, date de déclaration, état et snapshot du projet. Dans la MÊME
          // écriture que l'adresse : une intention n'existe jamais sans son contexte.
          ...colonnesContexte,
        }, {
          // La réponse idempotente de Stripe rejoue l'objet du jour de la CRÉATION, statut compris :
          // seul un `retrieve` dit où en est vraiment le paiement.
          paiementEncoreModifiable: async () =>
            statutStripeModifiable((await stripe.paymentIntents.retrieve(paymentIntent.id)).status),
        });
      } catch (intentError) {
        // SANS INTENTION, LE WEBHOOK NE POURRA PAS CRÉER LE DOSSIER. Rendre le `clientSecret` ici
        // reviendrait à ouvrir un paiement dont la livraison est déjà impossible. On échoue avant
        // que la carte ne soit débitée. Le message seul : jamais la ligne, qui porte le projet.
        console.error("[create-payment-intent] dossier_intents", intentError instanceof Error ? intentError.message : "échec");
        return NextResponse.json(
          { error: "Préparation du dossier impossible." },
          { status: 500 },
        );
      }
      if (resultat === "verrouillee") {
        return NextResponse.json(
          {
            error: "Un paiement est déjà engagé avec vos réponses précédentes. Rechargez la page pour recommencer avec les nouvelles.",
            code: "CONTEXT_LOCKED",
          },
          { status: 409 },
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
      const { error: snapshotError } = await admin.from("pack_snapshots").upsert(
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
      // FUT-115 : SANS INSTANTANÉ, LE COMPARATIF NE POURRA JAMAIS ÊTRE OUVERT (l'octroi exige l'instantané qui
      // concorde avec le paiement). L'erreur était ignorée : le `clientSecret` partait, la carte était débitée,
      // et rien ne pouvait être livré. On échoue avant que la carte ne le soit.
      if (snapshotError) {
        console.error("[create-payment-intent] pack_snapshots", snapshotError.message);
        return NextResponse.json({ error: "Préparation du comparatif impossible." }, { status: 500 });
      }
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
        // FUT-10 : SI le lecteur a répondu, jamais CE qu'il a répondu (ni texte, ni projet).
        ...(colonnesContexte
          ? {
              context_relation_declared: colonnesContexte.place_relation != null,
              context_objective_declared: colonnesContexte.place_objective != null,
              context_project_confirmed: colonnesContexte.project_snapshot != null,
            }
          : {}),
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
    // UNE TENTATIVE DÉPASSÉE N'EST PAS UNE PANNE (FUT-10, constaté en test de bout en bout). La clé
    // d'idempotence d'une tentative n'accepte que les paramètres de sa première requête. Quand le montant
    // a changé depuis (le dossier acheté entre-temps ouvre la déduction territoire, un code a expiré),
    // Stripe refuse : rien n'a été écrit, ni chez Stripe ni dans `dossier_intents`. Le lecteur doit
    // recommencer avec une tentative neuve, ce que fait un rechargement de la page.
    if ((error as { type?: string } | null)?.type === "StripeIdempotencyError") {
      return NextResponse.json(
        {
          error: "Cette tentative de paiement n'est plus valable. Rechargez la page pour recommencer.",
          code: "CHECKOUT_STALE",
        },
        { status: 409 },
      );
    }
    console.error("[stripe/create-payment-intent]", error);

    return NextResponse.json(
      { error: "Erreur lors de la création du paiement." },
      { status: 500 },
    );
  }
}
