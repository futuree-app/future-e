// Gabarit pur des e-mails transactionnels. Le fournisseur et les secrets restent cote serveur,
// mais le rendu est volontairement testable sans Resend ni navigateur.

export const TRANSACTIONAL_EMAIL_FROM = "futur•e <hello@futur-e.fr>";
export const TRANSACTIONAL_EMAIL_REPLY_TO = "hello@futur-e.fr";

export const DIGITAL_CONTENT_WITHDRAWAL_NOTICE =
  "Vous avez demandé la mise à disposition immédiate de votre dossier et reconnu perdre votre " +
  "droit de rétractation de quatorze jours dès cette mise à disposition, comme le prévoit " +
  "l'article L221-28 du code de la consommation. Ce message vaut confirmation de cet accord sur " +
  "support durable. Si le dossier ne contient pas ce qui était annoncé, écrivez-nous : le " +
  "remboursement est accordé.";

type TransactionalEmailInput = {
  preheader: string;
  eyebrow: string;
  title: string;
  paragraphs: readonly string[];
  cta?: { label: string; href: string };
  /** Information utile mais secondaire, par exemple la disponibilite de la facture. */
  supportingText?: string;
  notice?: string;
};

const LOGO_URL = "https://futur-e.fr/logo/futur-e-email.png";
const SITE_URL = "https://futur-e.fr";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderParagraphs(paragraphs: readonly string[]): string {
  return paragraphs
    .map(
      (paragraph) =>
        `<p style="margin:0 0 16px;color:#343744;font-family:Arial,Helvetica,sans-serif;` +
        `font-size:16px;line-height:1.65;">${escapeHtml(paragraph)}</p>`,
    )
    .join("");
}

/**
 * Les tableaux et styles inline sont intentionnels : Outlook et plusieurs webmails reinterpretent
 * encore le CSS moderne. Le logo est un PNG, le SVG restant inegalement pris en charge.
 */
export function renderTransactionalEmail(input: TransactionalEmailInput): {
  html: string;
  text: string;
} {
  const preheader = escapeHtml(input.preheader);
  const eyebrow = escapeHtml(input.eyebrow);
  const title = escapeHtml(input.title);
  const paragraphs = renderParagraphs(input.paragraphs);
  const cta = input.cta
    ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:26px 0 8px;">` +
      `<tr><td bgcolor="#060812" style="border-radius:6px;">` +
      `<a href="${escapeHtml(input.cta.href)}" style="display:inline-block;padding:13px 20px;` +
      `color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;` +
      `line-height:1.2;text-decoration:none;">${escapeHtml(input.cta.label)}</a>` +
      `</td></tr></table>`
    : "";
  const supportingText = input.supportingText
    ? `<p style="margin:18px 0 0;color:#686b76;font-family:Arial,Helvetica,sans-serif;` +
      `font-size:13px;line-height:1.55;">${escapeHtml(input.supportingText)}</p>`
    : "";
  const notice = input.notice
    ? `<tr><td style="padding:0 34px 30px;">` +
      `<div style="border-top:1px solid #dedfe4;padding-top:20px;color:#686b76;` +
      `font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;">` +
      `${escapeHtml(input.notice)}</div></td></tr>`
    : "";

  const html = `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <meta name="color-scheme" content="light">
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f3ef;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f4f3ef">
      <tr>
        <td align="center" style="padding:28px 12px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
            style="width:100%;max-width:600px;background:#ffffff;border-collapse:separate;border-spacing:0;` +
            `border-top:4px solid #E8823A;">
            <tr>
              <td style="padding:28px 34px 24px;">
                <a href="${SITE_URL}" style="display:inline-block;text-decoration:none;">
                  <img src="${LOGO_URL}" width="145" height="36" alt="futur•e"
                    style="display:block;width:145px;height:36px;border:0;outline:none;">
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 34px 30px;">
                <div style="margin:0 0 12px;color:#994000;font-family:Arial,Helvetica,sans-serif;` +
                  `font-size:11px;font-weight:700;line-height:1.3;text-transform:uppercase;">${eyebrow}</div>
                <h1 style="margin:0 0 22px;color:#060812;font-family:Arial,Helvetica,sans-serif;` +
                  `font-size:28px;font-weight:700;line-height:1.2;">${title}</h1>
                ${paragraphs}
                ${cta}
                ${supportingText}
              </td>
            </tr>
            ${notice}
            <tr>
              <td style="padding:22px 34px;background:#060812;color:#c8cad1;` +
                `font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;">
                <strong style="color:#ffffff;">futur<span style="color:#E8823A;">•</span>e</strong><br>
                <a href="${SITE_URL}" style="color:#ffffff;text-decoration:none;">futur-e.fr</a>
                &nbsp;·&nbsp;
                <a href="mailto:${TRANSACTIONAL_EMAIL_REPLY_TO}" style="color:#ffffff;` +
                  `text-decoration:none;">${TRANSACTIONAL_EMAIL_REPLY_TO}</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    input.eyebrow,
    input.title,
    "",
    ...input.paragraphs.flatMap((paragraph) => [paragraph, ""]),
    ...(input.cta ? [`${input.cta.label} : ${input.cta.href}`, ""] : []),
    ...(input.supportingText ? [input.supportingText, ""] : []),
    ...(input.notice ? [input.notice, ""] : []),
    `futur•e - ${SITE_URL} - ${TRANSACTIONAL_EMAIL_REPLY_TO}`,
  ].join("\n");

  return { html, text };
}

type PurchaseConfirmationInput =
  | { kind: "address"; addressLabel: string; invoiceAttached: boolean }
  | { kind: "pack"; invoiceAttached: boolean }
  | { kind: "territory"; commune: string | null; invoiceAttached: boolean };

/**
 * LE MESSAGE POST-ACHAT EST UN MODELE, pas trois textes libres disperses dans le webhook.
 * Le produit achete change la phrase d'ouverture et le CTA ; le remerciement, la promesse d'aide
 * a la decision, l'invitation a repondre et la place secondaire de la facture restent identiques.
 */
export function renderPurchaseConfirmationEmail(input: PurchaseConfirmationInput): {
  html: string;
  text: string;
} {
  let preheader: string;
  let opening: string;
  let decisionHelp: string;
  let cta: { label: string; href: string };

  if (input.kind === "address") {
    preheader = `Merci pour votre commande. Le dossier de ${input.addressLabel} vous attend.`;
    opening = `Votre dossier de ${input.addressLabel} est maintenant ouvert.`;
    decisionHelp =
      "Nous espérons que futur•e vous aidera à regarder ce lieu avec plus de recul, à repérer " +
      "ce qui mérite une vérification et à avancer dans votre décision.";
    cta = { label: "Ouvrir mon dossier", href: "https://futur-e.fr/rapport" };
  } else if (input.kind === "pack") {
    preheader = "Merci pour votre commande. Votre comparaison et vos rapports vous attendent.";
    opening = "Votre comparaison complète et vos trois rapports sont maintenant ouverts.";
    decisionHelp =
      "Nous espérons que futur•e vous aidera à comparer les lieux avec plus de recul, à " +
      "conserver leurs différences et à avancer dans votre décision.";
    cta = { label: "Ouvrir ma comparaison", href: "https://futur-e.fr/rapport" };
  } else {
    const lieu = input.commune ? ` de ${input.commune}` : "";
    preheader = `Merci pour votre commande. Votre rapport${lieu} vous attend.`;
    opening = `Votre rapport${lieu} est maintenant ouvert.`;
    decisionHelp =
      "Nous espérons que futur•e vous aidera à mieux comprendre ce territoire, à repérer les " +
      "points qui comptent pour votre projet et à avancer dans votre décision.";
    cta = { label: "Ouvrir mon rapport", href: "https://futur-e.fr/rapport" };
  }

  return renderTransactionalEmail({
    preheader,
    eyebrow: "Votre commande",
    title: "Merci beaucoup pour votre commande",
    paragraphs: [
      opening,
      decisionHelp,
      "Si quelque chose n'est pas clair ou si vous avez une question, nous restons disponibles. " +
        "Répondez simplement à cet e-mail.",
    ],
    cta,
    supportingText: input.invoiceAttached
      ? "Pour vos archives, votre facture est jointe à ce message et reste disponible dans votre compte."
      : undefined,
    notice: input.invoiceAttached ? undefined : DIGITAL_CONTENT_WITHDRAWAL_NOTICE,
  });
}
