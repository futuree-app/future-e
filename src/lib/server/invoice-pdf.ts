import "server-only";
import PDFDocument from "pdfkit";
import { formatEuro, formatDateFr, type Invoice } from "@/lib/invoice";

// ════════════════════════════════════════════════════════════════════════════════════════════
// LE RENDU PDF DE LA FACTURE.
//
// Sobre à dessein : une facture se lit, se classe et s'archive. Aucun dégradé, aucune couleur de
// marque, aucun élément décoratif. Le seul style qui compte ici est la lisibilité d'un document
// imprimé en noir et blanc et relu dans dix ans.
//
// POLICES STANDARD, AUCUN FICHIER EMBARQUÉ. pdfkit sait dessiner les quatorze polices PDF de base
// sans embarquer de fichier ; leur jeu de caractères est WinAnsi (cp1252), qui couvre les accents
// français et le symbole euro. En contrepartie il NE couvre PAS l'espace fine insécable U+202F,
// que `formatEuro` utilise comme séparateur de milliers parce que c'est la typographie juste à
// l'écran. `toWinAnsi` la ramène donc à l'espace insécable ordinaire U+00A0, qui appartient bien
// au jeu et qui reste insécable, donc le montant ne se coupe pas en fin de ligne.
//
// La sanitisation vit ICI et pas dans `formatEuro` : c'est une contrainte du support, elle n'a
// rien à faire dans la règle typographique.
// ════════════════════════════════════════════════════════════════════════════════════════════

/**
 * Ramène au jeu WinAnsi les caractères que les polices standard ne portent pas.
 * ÉCHAPPEMENTS EXPLICITES : taper ces caractères au clavier rendrait la table illisible et
 * indébogable, puisque plusieurs d'entre eux sont des espaces qu'aucune relecture ne distingue.
 */
function toWinAnsi(s: string): string {
  return s
    .replace(/\u202f/g, "\u00a0") // fine insécable -> insécable (hors WinAnsi)
    .replace(/\u2009/g, "\u00a0") // fine -> insécable
    .replace(/\u2011/g, "-") // trait d'union insécable
    .replace(/\u2019/g, "'") // apostrophe typographique -> droite (WinAnsi la porte, mais la
                             //  droite reste plus sûre pour un copier-coller comptable)
    .replace(/\u2014|\u2013/g, "-"); // cadratin et demi-cadratin
  // La PUCE U+2022 n'est PAS remplacée : WinAnsi la porte (0x95). Elle l'était dans une première
  // version, ce qui écrivait « futur-e » sur toutes les factures et abîmait le nom commercial.
}

const MARGIN = 56;
const GREY = "#555555";
const INK = "#111111";
const RULE = "#cccccc";

export function renderInvoicePdf(invoice: Invoice): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: MARGIN,
      info: {
        Title: `Facture ${invoice.number}`,
        Author: invoice.seller.legalName,
        Subject: invoice.designation,
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const W = doc.page.width - MARGIN * 2;
    const t = (s: string) => toWinAnsi(s);

    // ── En-tête : qui vend, et quel document ──────────────────────────────────────────────
    doc.fillColor(INK).font("Helvetica-Bold").fontSize(18).text(t(invoice.seller.tradeName), MARGIN, MARGIN);
    doc.font("Helvetica").fontSize(9).fillColor(GREY);
    doc.text(t(invoice.seller.nameWithForm));
    doc.text(t(invoice.seller.address));
    doc.text(`SIRET ${t(invoice.seller.siret)} - APE ${t(invoice.seller.apeCode)}`);
    doc.text(t(invoice.seller.email));

    // Le titre et le numéro, alignés à droite sur la même bande que l'en-tête vendeur.
    doc.font("Helvetica-Bold").fontSize(16).fillColor(INK)
      .text("FACTURE", MARGIN, MARGIN, { width: W, align: "right" });
    doc.font("Helvetica").fontSize(10).fillColor(GREY)
      .text(t(`N\u00b0 ${invoice.number}`), MARGIN, MARGIN + 22, { width: W, align: "right" })
      .text(t(`Émise le ${formatDateFr(invoice.issuedAt)}`), MARGIN, MARGIN + 36, { width: W, align: "right" });

    // ── Le client ─────────────────────────────────────────────────────────────────────────
    let y = MARGIN + 96;
    doc.font("Helvetica").fontSize(8).fillColor(GREY).text("FACTURÉ À", MARGIN, y);
    y += 14;
    doc.font("Helvetica-Bold").fontSize(11).fillColor(INK).text(t(invoice.buyerName), MARGIN, y);
    y += 15;
    doc.font("Helvetica").fontSize(9.5).fillColor(GREY).text(t(invoice.buyerEmail), MARGIN, y);

    // ── La prestation ─────────────────────────────────────────────────────────────────────
    y += 44;
    doc.moveTo(MARGIN, y).lineTo(MARGIN + W, y).strokeColor(RULE).lineWidth(0.75).stroke();
    y += 12;
    doc.font("Helvetica").fontSize(8).fillColor(GREY);
    doc.text("DÉSIGNATION", MARGIN, y);
    doc.text("MONTANT", MARGIN, y, { width: W, align: "right" });
    y += 16;

    // La désignation peut wrapper : on lui laisse la largeur moins la colonne du montant, et on
    // relit la hauteur réellement occupée plutôt que de la supposer.
    const AMOUNT_COL = 110;
    doc.font("Helvetica").fontSize(10.5).fillColor(INK);
    const designationHeight = doc.heightOfString(t(invoice.designation), { width: W - AMOUNT_COL - 16 });
    doc.text(t(invoice.designation), MARGIN, y, { width: W - AMOUNT_COL - 16 });
    doc.text(t(formatEuro(invoice.amountCents)), MARGIN, y, { width: W, align: "right" });
    y += Math.max(designationHeight, 14) + 12;

    doc.moveTo(MARGIN, y).lineTo(MARGIN + W, y).strokeColor(RULE).stroke();
    y += 14;

    // ── Le total ──────────────────────────────────────────────────────────────────────────
    // Un seul montant, et il est celui que Stripe a encaissé. Pas de ligne « HT » puis « TTC » :
    // en franchise en base il n'y a pas de TVA à distinguer, et afficher les deux laisserait
    // croire à une taxe collectée.
    doc.font("Helvetica-Bold").fontSize(12).fillColor(INK)
      .text(t(`Total : ${formatEuro(invoice.amountCents)}`), MARGIN, y, { width: W, align: "right" });
    y += 24;
    doc.font("Helvetica").fontSize(9).fillColor(GREY)
      .text(t(invoice.vatMention), MARGIN, y, { width: W, align: "right" });

    // ── Pied : les mentions qui font la conformité ────────────────────────────────────────
    const footY = doc.page.height - MARGIN - 54;
    doc.moveTo(MARGIN, footY - 14).lineTo(MARGIN + W, footY - 14).strokeColor(RULE).stroke();
    doc.font("Helvetica").fontSize(8).fillColor(GREY);
    // La DATE D'EXÉCUTION doit figurer sur une note de prestation de service (arrêté du 3 octobre
    // 1983). Elle se confond ici avec la date de paiement : l'accès au rapport est ouvert par le
    // webhook, dans la seconde qui suit l'encaissement. Le jour où une prestation s'étalerait dans
    // le temps, cette ligne devrait porter deux dates distinctes.
    doc.text(
      t(
        `Facture acquittée. Paiement reçu le ${formatDateFr(invoice.issuedAt)} par carte bancaire. ` +
        `Prestation exécutée le ${formatDateFr(invoice.issuedAt)}, accès ouvert au client à cette date. ` +
        `${invoice.vatMention}.`,
      ),
      MARGIN, footY, { width: W },
    );
    doc.text(
      t(`${invoice.seller.nameWithForm} - SIRET ${invoice.seller.siret} - ${invoice.seller.address}`),
      MARGIN, footY + 22, { width: W },
    );

    doc.end();
  });
}
