import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import { getResend } from "@/lib/resend";
import { ouvrirEnvoi, fermerEnvoi, type EmailKind } from "@/lib/server/email-log";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getStripe } from "@/lib/stripe";
import { getPostHogClient } from "@/lib/posthog-server";
import { sanitizeDistinctId } from "@/lib/posthog-identity";
import { grantDecisionPackFromSnapshot } from "@/lib/decision-packs";
import { communeParent } from "@/lib/plm";
import { issueInvoice } from "@/lib/server/invoice-store";
import { renderInvoicePdf } from "@/lib/server/invoice-pdf";
import { invoiceFileName, type InvoiceProductType } from "@/lib/invoice";
import { after } from "next/server";
import { generateDecisionArtifact } from "@/lib/server/generate-decision-artifact";
import { normalizeUserProject } from "@/lib/user-project";
import {
  DIGITAL_CONTENT_WITHDRAWAL_NOTICE,
  renderTransactionalEmail,
  TRANSACTIONAL_EMAIL_FROM,
  TRANSACTIONAL_EMAIL_REPLY_TO,
} from "@/lib/transactional-email";

export const runtime = "nodejs";

/**
 * LA GÉNÉRATION DE L'ARTEFACT DE DÉCISION, APRÈS LA RÉPONSE À STRIPE.
 *
 * ── POURQUOI `after` ─────────────────────────────────────────────────────────────────────────
 * Assembler un dossier demande huit lectures externes et le moteur complet. Le faire pendant le
 * webhook retarderait l'accusé de réception, et Stripe rejouerait l'événement en croyant à une
 * panne. `after` répond d'abord, puis travaille (`waitUntil` sur Vercel, dans la limite du
 * `maxDuration` de la route).
 *
 * ── POURQUOI ELLE NE PEUT PAS FAIRE ÉCHOUER LE WEBHOOK ───────────────────────────────────────
 * Le client a payé, son droit est déjà posé, et il peut lire son dossier même sans artefact : la
 * page retombe alors sur l'assemblage vivant, exactement comme avant ce lot. Une génération ratée
 * est donc un défaut à rattraper, jamais une raison de refuser une livraison encaissée.
 *
 * ── LE PROJET VIENT DE LA BASE, PAS DES MÉTADONNÉES STRIPE ───────────────────────────────────
 * C'est le projet TEL QU'IL EST À LA DÉLIVRANCE qui a produit la lecture achetée. Le recopier dans
 * les métadonnées à la création du PaymentIntent le figerait une minute trop tôt, avant un dernier
 * ajustement du wizard.
 */
function planifierArtefact(
  userId: string,
  cible: Parameters<typeof generateDecisionArtifact>[3],
): void {
  after(async () => {
    try {
      const { data: profile } = await supabaseAdmin
        .from("user_profiles")
        .select("user_project")
        .eq("user_id", userId)
        .maybeSingle();
      const project = normalizeUserProject(
        (profile as { user_project?: unknown } | null)?.user_project ?? null,
      );
      // SANS PROJET, PAS D'ARTEFACT. Le dossier de décision se construit à partir du projet : le
      // figer sans lui produirait une version vide, qui vaudrait moins que l'assemblage vivant du
      // jour où le lecteur aura enfin renseigné son projet.
      if (!project) return;
      const r = await generateDecisionArtifact(supabaseAdmin, userId, project, cible);
      if (r.status === "failed") console.error("[artefact] génération échouée", { userId, cible, r });
    } catch (error) {
      console.error("[artefact] planification échouée", { userId, error });
    }
  });
}

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// UN SEUL JEU DE DROITS DE COMPTE, parce qu'il n'existe qu'un seul produit qui en pose (30/07/2026).
// La branche `suivi-foyer` posait plan `foyer` + mode foyer + dashboard interactif : trois notions
// qu'aucun parcours ne vendait et qu'aucun écran ne lisait. Le paramètre `productType` a disparu
// avec elle ; le jour où un second produit pose des droits de compte, c'est ici qu'il se distingue.
//
// CE QUI OUVRE UNE COMMUNE N'EST PAS ICI : c'est le report_grant écrit plus bas, et le dossier
// d'adresse. `report_access` dit seulement que le compte a payé quelque chose.
function getEntitlements() {
  return {
    plan: "one_shot",
    status: "active",
    report_access: "complete",
    newsletter_enabled: false,
    notifications_enabled: false,
  };
}

/**
 * LA CONFIRMATION DU RENONCEMENT, DANS LE CORPS DE L'E-MAIL (04/08/2026).
 *
 * L'article L221-28 13° du code de la consommation dispense de rétractation un contenu numérique
 * fourni immédiatement, à trois conditions cumulatives : accord exprès pour l'exécution immédiate,
 * renoncement exprès, et CONFIRMATION de cet accord sur support durable. Les deux premières sont
 * recueillies avant le paiement (`PaymentForm.tsx`), la facture PDF porte la troisième.
 *
 * ── POURQUOI AUSSI DANS L'E-MAIL, ET PAS SEULEMENT SUR LA FACTURE ────────────────────────────
 * `buildInvoiceAttachment` rend un tableau VIDE quand la facture ne peut pas être émise : nom de
 * facturation absent (comptes anciens, certains comptes Google), ou n'importe quelle erreur, qu'il
 * avale volontairement pour ne jamais faire échouer un webhook. L'e-mail part quand même. Dans ce
 * cas, la case avait été cochée et AUCUNE confirmation ne parvenait au client : la troisième
 * condition manquait, donc l'exception ne jouait pas, alors même que l'écran l'avait annoncée.
 *
 * L'e-mail, lui, part dans tous les cas, et il qualifie comme support durable : le client peut le
 * stocker, s'y reporter et le reproduire à l'identique. La mention vit donc aux deux endroits.
 */
// ════════════════════════════════════════════════════════════════════════════
// LA FACTURE, ÉMISE À L'ENCAISSEMENT ET JOINTE À L'E-MAIL DE CONFIRMATION.
//
// NE LÈVE JAMAIS. Un échec d'émission ne doit pas empêcher la livraison ni provoquer un rejeu
// Stripe : le client a payé, il garde son accès. Une facture manquante se rattrape à la main,
// un accès refusé après encaissement ne se rattrape pas. L'échec est journalisé, et il se voit
// dans la base par une facture absente pour un paiement présent.
//
// LE NOM VIENT DES MÉTADONNÉES, jamais d'une relecture du compte : il a été figé au moment de
// l'achat, et un client qui change son nom ensuite ne doit pas changer la facture émise.


/**
 * ENVOYER, ET REGARDER SI C'EST PARTI (13/08/2026).
 *
 * Le SDK Resend NE LÈVE JAMAIS : il rend `{ data, error }`, y compris quand le domaine n'est pas
 * vérifié, quand la clé est invalide, quand le destinataire est refusé ou quand la requête n'aboutit
 * pas. Les trois envois de ce webhook faisaient `await resend.emails.send(...)` sans jamais lire ce
 * retour : un échec passait donc inaperçu, le webhook répondait 200 à Stripe, et rien nulle part ne
 * gardait trace de l'e-mail perdu.
 *
 * Constaté sur la PREMIÈRE VENTE RÉELLE (12/08/2026, dossier de Magné) : paiement encaissé, dossier
 * créé, facture FE-2026-0001 émise, et aucun message reçu. Faute de journal, on ne peut même pas
 * dire, après coup, si l'envoi a échoué ou si le message a été filtré à l'arrivée.
 *
 * ON NE LÈVE PAS POUR AUTANT. Lever ferait répondre 500 à Stripe, qui rejouerait l'événement ; or
 * `created` vaut alors faux et le rejeu n'enverrait rien de plus, tout en laissant l'achat marqué
 * en échec côté Stripe. Ce qui manquait n'est pas une exception, c'est une TRACE.
 *
 * ELLE EST EN BASE, ET PLUS SEULEMENT DANS LES JOURNAUX (13/08/2026, second temps). Un journal ne
 * se requête pas, expire, et ne permet aucune relance : `email_deliveries` porte l'état de chaque
 * message, l'identifiant rendu par Resend et l'erreur du fournisseur. C'est ce qui rend possible de
 * retrouver les envois manqués et de les rejouer. La trace ne fait jamais échouer l'envoi qu'elle
 * observe : ses propres pannes sont avalées dans `email-log.ts`.
 */
async function envoyerEmail(
  resend: ReturnType<typeof getResend>,
  message: Parameters<ReturnType<typeof getResend>["emails"]["send"]>[0],
  contexte: { pi: string; quoi: string; kind: EmailKind; supabase: SupabaseClient },
): Promise<void> {
  const destinataire = Array.isArray(message.to) ? message.to.join(", ") : String(message.to);
  const journal = { pi: contexte.pi, quoi: contexte.quoi, destinataire };
  const trace = await ouvrirEnvoi(contexte.supabase, {
    paymentIntentId: contexte.pi, kind: contexte.kind, toEmail: destinataire,
  });
  try {
    const { data, error } = await resend.emails.send(message);
    if (error) {
      console.error("[email] ENVOI REFUSÉ", { ...journal, error });
      await fermerEnvoi(contexte.supabase, trace, { erreur: `${error.name}: ${error.message}` });
      return;
    }
    console.log("[email] envoyé", { ...journal, id: data?.id ?? null });
    await fermerEnvoi(contexte.supabase, trace, { providerId: data?.id ?? null });
  } catch (error) {
    // Le SDK ne lève pas, mais le rendu d'une pièce jointe ou une panne inattendue le peuvent.
    console.error("[email] ENVOI EN ÉCHEC", { ...journal, error });
    await fermerEnvoi(contexte.supabase, trace, {
      erreur: error instanceof Error ? error.message : "échec inattendu",
    });
  }
}

async function buildInvoiceAttachment(
  paymentIntent: Stripe.PaymentIntent,
  productType: InvoiceProductType,
  subject: string | null,
): Promise<{ filename: string; content: Buffer }[]> {
  try {
    const { userId, userEmail, buyerName, promoLabel } = paymentIntent.metadata;
    if (!userEmail) return [];

    const result = await issueInvoice({
      userId: userId && userId !== "anonymous" ? userId : null,
      buyerNameRaw: buyerName,
      buyerEmail: userEmail,
      productType,
      subject,
      // Ce que STRIPE déclare avoir encaissé, jamais un tarif catalogue.
      amountCents: paymentIntent.amount,
      // Figé dans les métadonnées à l'achat : la facture dit à quel tarif la vente s'est faite.
      tariffLabel: promoLabel || null,
      paymentIntentId: paymentIntent.id,
    });

    if (result.status !== "issued") {
      console.error("[facture] non émise", { pi: paymentIntent.id, result });
      return [];
    }
    const pdf = await renderInvoicePdf(result.invoice);
    return [{ filename: invoiceFileName(result.invoice.number), content: pdf }];
  } catch (error) {
    console.error("[facture] échec d'émission", { pi: paymentIntent.id, error });
    return [];
  }
}

async function handleSucceededPayment(paymentIntent: Stripe.PaymentIntent) {
  const {
    userId, userEmail, productType, targetInsee, targetCommune, grantSource, grantRank,
    phDistinctId,
  } = paymentIntent.metadata;

  // LE SEUL POINT DU PARCOURS SANS NAVIGATEUR : l'identité de mesure voyage par les métadonnées
  // Stripe. Sans elle, `payment_completed` créait une personne distincte de celle qui a cliqué,
  // parce que le navigateur identifie sur l'UUID Supabase et qu'on émettait sur l'e-mail.
  const distinctId = sanitizeDistinctId(phDistinctId, userId || paymentIntent.id);

  // Territoire ciblé (parcours comparateur). Vide = achat sur la résidence.
  const insee = typeof targetInsee === "string" ? targetInsee.trim() : "";
  const commune = typeof targetCommune === "string" ? targetCommune.trim() : "";
  const source = grantSource || "direct";
  const rank = grantRank ? Number.parseInt(grantRank, 10) : null;
  const resend = getResend();

  // ════════════════════════════════════════════════════════════════════════════
  // Dossier d'adresse : l'adresse vient de l'INTENTION, jamais des métadonnées Stripe, qui ne la
  // portent pas. Le droit d'ouvrir ce dossier EST l'existence de la ligne créée ici.
  // ════════════════════════════════════════════════════════════════════════════
  if (productType === "address-dossier") {
    const { data: intent } = await supabaseAdmin
      .from("dossier_intents")
      .select("*")
      .eq("stripe_payment_intent_id", paymentIntent.id)
      .maybeSingle();

    if (!intent) {
      // Une intention absente est une ERREUR, pas un cas dégradé : inventer une adresse depuis un
      // paiement produirait un dossier sur un bien inconnu.
      //
      // ON LÈVE, ON NE RETOURNE PAS. `POST` répond `{ received: true }` juste après cet appel :
      // un `return` ferait croire à Stripe que l'événement est traité, donc il ne le rejouerait
      // JAMAIS, et le paiement resterait encaissé sans dossier, définitivement. En levant, la
      // route répond 500 et Stripe réessaie pendant trois jours, ce qui laisse le temps de
      // réparer.
      throw new Error(`dossier_intents introuvable pour ${paymentIntent.id}`);
    }

    // Le rang du dossier dans le compte, AVANT l'insertion. C'est la seule valeur d'historique de
    // l'instrumentation, et elle a une source réelle : la base la connaît, personne ne l'invente.
    const { count: paidBefore } = await supabaseAdmin
      .from("address_dossiers")
      .select("id", { count: "exact", head: true })
      .eq("user_id", intent.user_id)
      .not("stripe_payment_intent_id", "is", null);

    // `upsert` avec `ignoreDuplicates`, JAMAIS `insert`. Un `insert` sur une clé déjà prise lève
    // une erreur, donc un webhook rejoué échouerait à chaque fois.
    //
    // LES DEUX OPTIONS SONT OBLIGATOIRES. Sans `onConflict`, Postgres arbitre sur la clé primaire
    // (`id`, un uuid neuf), donc le conflit réel n'est jamais vu. Sans `ignoreDuplicates`,
    // l'upsert ÉCRASE la ligne existante, ce qui réécrirait le montant et la date d'achat d'un
    // dossier déjà payé à chaque rejeu.
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("address_dossiers")
      .upsert(
        {
          user_id: intent.user_id,
          ban_id: intent.ban_id,
          insee: intent.insee,
          address_label: intent.address_label,
          city: intent.city,
          postcode: intent.postcode,
          latitude: intent.latitude,
          longitude: intent.longitude,
          stripe_payment_intent_id: paymentIntent.id,
          // La seule vérité de ce qui a été encaissé est ce que STRIPE déclare avoir encaissé.
          // Recopier le montant préparé ferait dire à la base un prix que la caisse n'a pas
          // confirmé.
          amount_paid_cents: paymentIntent.amount,
          purchased_at: new Date().toISOString(),
        },
        { onConflict: "stripe_payment_intent_id", ignoreDuplicates: true },
      )
      .select("id");

    if (insertError) throw insertError;

    // `ignoreDuplicates` rend une liste VIDE quand la ligne existait déjà : c'est ainsi qu'on
    // distingue une création d'un rejeu, et cette distinction gouverne les effets de bord.
    const created = (inserted?.length ?? 0) > 0;

    const { data: dossier } = await supabaseAdmin
      .from("address_dossiers")
      .select("id")
      .eq("stripe_payment_intent_id", paymentIntent.id)
      .maybeSingle();

    // Un dossier introuvable APRÈS l'insertion signale une base incohérente : même traitement que
    // l'intention absente, on laisse Stripe rejouer plutôt que d'accuser réception dans le vide.
    if (!dossier) throw new Error(`dossier introuvable après insertion ${paymentIntent.id}`);

    // À LA CRÉATION SEULEMENT. Sur un rejeu, la place de l'artefact est déjà réservée et la
    // génération s'arrêterait d'elle-même sur la contrainte unique ; ne pas la lancer évite un
    // aller-retour inutile en base à chaque rejeu Stripe.
    if (created) {
      planifierArtefact(intent.user_id, {
        kind: "adresse",
        insee: intent.insee,
        dossierId: dossier.id as string,
        address: {
          id: intent.ban_id,
          label: intent.address_label,
          city: intent.city,
          citycode: intent.insee,
          postcode: intent.postcode,
          latitude: intent.latitude,
          longitude: intent.longitude,
        },
        // LE DPE N'EST PAS ENCORE CHOISI À CET INSTANT : le parcours le propose après l'achat. Le
        // dossier figé porte donc l'état du bien SANS diagnostic sélectionné, ce qui est exact au
        // moment de la vente. Le jour où le choix du DPE précédera le paiement, il entrera ici.
        savedDpe: null,
      });
    }

    await supabaseAdmin.from("payments").upsert(
      {
        user_id: intent.user_id,
        stripe_payment_intent_id: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        product_type: productType,
        status: "succeeded",
        email: userEmail || null,
        target_insee: intent.insee,
      },
      { onConflict: "stripe_payment_intent_id" },
    );

    // AUCUN report_grant dérivé : le droit territorial se déduit de l'existence du dossier, donc
    // `access_revoked_at` le retire sans laisser un grant orphelin. On pose le territoire ACTIF de
    // lecture, au grain commune (PLM ferait lire « Paris 1er »), ET le bien qu'on vient d'acheter.
    //
    // LE BIEN ACTIF EST ÉCRIT ICI DEPUIS LE 11/08/2026, et l'oublier serait une régression née du
    // lot précédent : le hub sert désormais `active_dossier_id` en priorité, donc un client qui
    // achète un SECOND bien dans une commune où il en possède déjà un se verrait rouvrir l'ancien,
    // juste après avoir payé le nouveau.
    //
    // `created` GOUVERNE CETTE BASCULE, comme il gouverne l'e-mail et l'événement d'achat (revue du
    // 11/08/2026). Sans lui, un `payment_intent.succeeded` rejoué par Stripe des jours plus tard
    // remettrait un ancien dossier au premier plan, alors que le lecteur en a ouvert un autre
    // depuis : le contrat « dernier bien effectivement ouvert » tomberait sur un événement que
    // personne n'a provoqué. Le retour de paiement passe de toute façon par
    // `/rapport/dossiers/ouvrir`, qui repose le contexte exact.
    if (created) {
      const { error: bascule } = await supabaseAdmin
        .from("user_profiles")
        .update({
          active_insee_code: communeParent(intent.insee),
          active_commune: intent.city,
          active_dossier_id: dossier.id as string,
        })
        .eq("user_id", intent.user_id);
      // Journalisé, jamais tu : son symptôme serait un acheteur qui retrouve un autre bien que
      // celui qu'il vient de payer, sans que rien ne l'explique.
      if (bascule) {
        console.error("[webhook] bascule vers le bien acheté échouée", {
          userId: intent.user_id, dossierId: dossier.id, error: bascule,
        });
      }
    }

    // `created` GOUVERNE L'E-MAIL, comme il gouverne déjà l'événement d'achat plus bas. Il ne le
    // gouvernait pas jusqu'au 31/07/2026 : un rejeu du webhook renvoyait le message à l'acheteur,
    // et le code provoque délibérément des rejeux quand l'intention manque.
    if (userEmail && created) {
      const attachments = await buildInvoiceAttachment(
        paymentIntent, "address-dossier", intent.address_label,
      );
      const email = renderTransactionalEmail({
        preheader: `Le dossier de ${intent.address_label} est disponible dans votre espace.`,
        eyebrow: "Dossier d'adresse",
        title: "Votre dossier est ouvert",
        paragraphs: [
          "Merci pour votre confiance.",
          `Le dossier de ${intent.address_label} est ouvert. Vous y retrouverez le territoire, ` +
            "ce qui entoure l'adresse et ce que dit le logement.",
          ...(attachments.length
            ? ["Votre facture est jointe à ce message et reste disponible dans votre compte."]
            : []),
        ],
        cta: { label: "Ouvrir mon dossier", href: "https://futur-e.fr/rapport" },
        notice: DIGITAL_CONTENT_WITHDRAWAL_NOTICE,
      });
      await envoyerEmail(resend, {
        from: TRANSACTIONAL_EMAIL_FROM,
        replyTo: TRANSACTIONAL_EMAIL_REPLY_TO,
        to: userEmail,
        subject: "Votre dossier futur•e est ouvert",
        ...email,
        attachments,
      }, { pi: paymentIntent.id, quoi: "dossier d'adresse", kind: "dossier", supabase: supabaseAdmin });
    }

    // ÉMIS À LA CRÉATION SEULEMENT. Un rejeu compterait un second achat, et son
    // `rank_in_dossiers` serait faux puisque le dossier existe déjà au moment du décompte.
    // `$insert_id` ajoute une déduplication côté PostHog si deux instances traitaient l'événement.
    if (created) {
      const posthog = getPostHogClient();
      posthog.capture({
        distinctId,
        event: "address_dossier_purchased",
        properties: {
          $insert_id: `address_dossier_purchased_${paymentIntent.id}`,
          amount_paid_cents: paymentIntent.amount,
          deducted: (intent.territory_deduction_cents ?? 0) > 0,
          insee: intent.insee,
          dossier_id: dossier.id,
          rank_in_dossiers: (paidBefore ?? 0) + 1,
        },
      });
      await posthog.shutdown();
    }
    return;
  }

  // Pack Décision : crée le pack + 3 grants + entitlements one_shot (report_access
  // complete) depuis le snapshot en staging, via la fonction partagée (l'email pose
  // les entitlements, sans quoi l'acheteur ne pourrait ni lire les rapports ni
  // utiliser AskFuture). Puis mail de confirmation, et on s'arrête (pas de
  // territoire actif, le pack gère son propre déblocage).
  if (productType === "pack-decision") {
    await grantDecisionPackFromSnapshot(supabaseAdmin, paymentIntent.id, undefined, userEmail || undefined);
    await supabaseAdmin.from("payments").upsert(
      {
        user_id: userId && userId !== "anonymous" ? userId : null,
        stripe_payment_intent_id: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        product_type: productType,
        status: "succeeded",
        email: userEmail || null,
      },
      { onConflict: "stripe_payment_intent_id" },
    );
    if (userEmail) {
      const attachments = await buildInvoiceAttachment(paymentIntent, "pack-decision", null);
      const email = renderTransactionalEmail({
        preheader: "Votre comparaison et vos trois rapports sont disponibles.",
        eyebrow: "Pack Décision",
        title: "Votre comparaison est ouverte",
        paragraphs: [
          "Merci pour votre confiance.",
          "Votre comparaison complète et vos trois rapports sont accessibles depuis votre espace.",
          ...(attachments.length
            ? ["Votre facture est jointe à ce message et reste disponible dans votre compte."]
            : []),
        ],
        cta: { label: "Ouvrir ma comparaison", href: "https://futur-e.fr/rapport" },
        notice: DIGITAL_CONTENT_WITHDRAWAL_NOTICE,
      });
      await envoyerEmail(resend, {
        from: TRANSACTIONAL_EMAIL_FROM,
        replyTo: TRANSACTIONAL_EMAIL_REPLY_TO,
        to: userEmail,
        subject: "Votre Pack Décision futur•e est débloqué",
        ...email,
        attachments,
      }, { pi: paymentIntent.id, quoi: "pack décision", kind: "pack", supabase: supabaseAdmin });
    }
    const posthog = getPostHogClient();
    posthog.capture({
      distinctId,
      event: "payment_completed",
      properties: { product_type: productType, amount: paymentIntent.amount / 100 },
    });
    await posthog.shutdown();
    return;
  }

  await supabaseAdmin.from("payments").upsert(
    {
      user_id: userId && userId !== "anonymous" ? userId : null,
      stripe_payment_intent_id: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      product_type: productType,
      status: "succeeded",
      email: userEmail || null,
      target_insee: insee || null,
    },
    { onConflict: "stripe_payment_intent_id" },
  );

  if (userId && userId !== "anonymous") {
    const entitlements = getEntitlements();

    await supabaseAdmin.from("user_accounts").upsert(
      {
        user_id: userId,
        email: userEmail || "",
        ...entitlements,
      },
      { onConflict: "user_id" },
    );

    // Profil : on n'écrase JAMAIS la résidence. Si un territoire a été ciblé
    // (comparateur), on le trace comme grant et on le pose en territoire actif
    // de lecture. Sinon, comportement historique (rapport sur la résidence).
    //
    // `household_mode_enabled` a quitté cet objet avec le mode foyer (30/07/2026), ce qui le laisse
    // VIDE quand aucun territoire n'est ciblé. D'où la garde plus bas : un `.update({})` ne veut
    // rien dire, et écrirait au mieux une ligne inchangée.
    const profileUpdate: Record<string, unknown> = {};

    if (insee) {
      await supabaseAdmin.from("report_grants").upsert(
        {
          user_id: userId,
          insee,
          commune: commune || null,
          source,
          rank: rank && rank >= 1 && rank <= 3 ? rank : null,
          stripe_payment_intent_id: paymentIntent.id,
        },
        { onConflict: "user_id,insee" },
      );

      profileUpdate.active_insee_code = insee;
      profileUpdate.active_commune = commune || null;

      // LE DOSSIER DE TERRITOIRE EST FIGÉ LUI AUSSI. Il est vendu 14 €, il porte une conclusion et
      // des contrôles, et il se réécrivait exactement comme celui d'adresse. Le `pack-decision`
      // passe aussi par ici, une commune à la fois, ce qui est juste : ce qui est figé est la
      // lecture d'un territoire, pas l'emballage commercial qui l'a vendue.
      planifierArtefact(userId, { kind: "commune", insee });
    }

    if (Object.keys(profileUpdate).length > 0) {
      await supabaseAdmin
        .from("user_profiles")
        .update(profileUpdate)
        .eq("user_id", userId);
    }
  }

  if (userEmail) {
    // LA PROMESSE ÉTAIT FAUSSE. Ce message annonçait « votre rapport interactif est en
    // préparation, vous le recevrez dans les prochaines minutes » : rien n'a jamais été envoyé,
    // le rapport se lit sur le site et il est ouvert dès cet instant. Un acheteur qui attend un
    // document et ne reçoit rien demande un remboursement, et il a raison.
    const attachments = await buildInvoiceAttachment(
      paymentIntent, "one-shot", commune || null,
    );
    const lieu = commune ? ` de ${commune}` : "";
    const email = renderTransactionalEmail({
      preheader: `Votre rapport${lieu} est disponible dans votre espace.`,
      eyebrow: "Rapport Territoire",
      title: "Votre rapport est ouvert",
      paragraphs: [
        "Merci pour votre confiance.",
        `Votre rapport${lieu} est ouvert dès maintenant dans votre espace.`,
        ...(attachments.length
          ? ["Votre facture est jointe à ce message et reste disponible dans votre compte."]
          : []),
      ],
      cta: { label: "Ouvrir mon rapport", href: "https://futur-e.fr/rapport" },
      notice: DIGITAL_CONTENT_WITHDRAWAL_NOTICE,
    });
    await envoyerEmail(resend, {
      from: TRANSACTIONAL_EMAIL_FROM,
      replyTo: TRANSACTIONAL_EMAIL_REPLY_TO,
      to: userEmail,
      subject: "Votre rapport futur•e est ouvert",
      ...email,
      attachments,
    }, { pi: paymentIntent.id, quoi: `territoire ${commune || insee || "?"}`, kind: "territoire", supabase: supabaseAdmin });
  }

  const posthog = getPostHogClient();
  posthog.capture({
    distinctId,
    event: "payment_completed",
    properties: {
      product_type: productType,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      payment_intent_id: paymentIntent.id,
      user_id: userId && userId !== "anonymous" ? userId : null,
    },
  });
  await posthog.shutdown();
}

export async function POST(request: Request) {
  const body = await request.text();
  const signature = (await headers()).get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Signature Stripe manquante." },
      { status: 400 },
    );
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (error) {
    console.error("[stripe/webhook] invalid signature", error);

    return NextResponse.json(
      { error: "Webhook invalide." },
      { status: 400 },
    );
  }

  if (event.type === "payment_intent.succeeded") {
    await handleSucceededPayment(event.data.object as Stripe.PaymentIntent);
  }

  return NextResponse.json({ received: true });
}
