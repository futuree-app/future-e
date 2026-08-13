// Gabarit pur des e-mails transactionnels. Le fournisseur et les secrets restent cote serveur,
// mais le rendu est volontairement testable sans Resend ni navigateur.

export const TRANSACTIONAL_EMAIL_FROM = "futur•e <hello@futur-e.fr>";
export const TRANSACTIONAL_EMAIL_REPLY_TO = "hello@futur-e.fr";

/**
 * LA MENTION DE RÉTRACTATION, ET CE QU'ELLE DIT DEPUIS LE 13/08/2026.
 *
 * Elle affirmait que l'acheteur avait demandé la mise à disposition immédiate et reconnu perdre son
 * droit de rétractation, ce qui valait confirmation sur support durable, troisième condition de
 * l'article L221-28 13°. La case du paiement ne recueille plus ces deux accords (décision porteur) :
 * l'exception ne joue donc pas, et l'affirmer dans un message serait une déclaration du vendeur sur
 * un droit du client que rien n'a recueilli.
 *
 * Elle dit maintenant l'inverse, et c'est la vérité : les quatorze jours courent. Le nom de la
 * constante reste juste (une mention de rétractation), seul son contenu a changé de sens.
 */
export const DIGITAL_CONTENT_WITHDRAWAL_NOTICE =
  "Vous disposez de quatorze jours à compter de votre achat pour vous rétracter, sans avoir à " +
  "vous justifier : écrivez à hello@futur-e.fr depuis l'adresse de votre compte, en indiquant " +
  "votre commande. Et si le dossier ne contient pas ce qui était annoncé, le remboursement est " +
  "accordé sans discuter, quelle que soit la date.";

type TransactionalEmailInput = {
  preheader: string;
  eyebrow: string;
  title: string;
  paragraphs: readonly string[];
  cta?: { label: string; href: string };
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
    ...(input.notice ? [input.notice, ""] : []),
    `futur•e - ${SITE_URL} - ${TRANSACTIONAL_EMAIL_REPLY_TO}`,
  ].join("\n");

  return { html, text };
}
