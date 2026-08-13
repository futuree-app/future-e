import "server-only";
import PDFDocument from "pdfkit/js/pdfkit.standalone.js";
import { formatEuro, formatDateFr, type Invoice } from "@/lib/invoice";
import { MOT, POINT, HAUTEUR_MOT_IMPRIME_PT } from "@/lib/brand-mark";

// ════════════════════════════════════════════════════════════════════════════════════════════
// LE RENDU PDF DE LA FACTURE.
//
// Sobre à dessein : une facture se lit, se classe et s'archive. Aucun dégradé, aucune couleur de
// marque, aucun élément décoratif. Le seul style qui compte ici est la lisibilité d'un document
// imprimé en noir et blanc et relu dans dix ans.
//
// LA VARIANTE `pdfkit.standalone.js`, PAS LE POINT D'ENTRÉE PAR DÉFAUT. Celui-ci lit les
// métriques des polices (.afm) sur le disque au moment de dessiner, par un chemin construit à
// l'exécution : le traceur de Next ne le voit pas, et la production répond
// `ENOENT ... pdfkit/js/data/Helvetica.afm` là où le rendu local est parfait. Constaté le
// 31/07/2026, en production, après un build vert. `outputFileTracingIncludes` a été essayé sur
// les deux routes concernées et n'a rien changé. La variante autonome embarque ces métriques dans
// un système de fichiers virtuel et ne touche jamais au disque, ce qui supprime la classe
// entière de problème plutôt que de la configurer.
//
// POLICES STANDARD, AUCUN FICHIER DE POLICE À NOUS. pdfkit dessine les quatorze polices PDF de
// base ; leur jeu de caractères est WinAnsi (cp1252), qui couvre les accents
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


/**
 * Dessine le mot-symbole à (x, y), à la hauteur voulue, dans une seule couleur.
 *
 * pdfkit travaille en points avec l'origine en haut à gauche, comme un viewBox SVG : il suffit
 * donc de mettre à l'échelle puis de translater du coin du viewBox, sans miroir ni rotation.
 * `save`/`restore` encadrent la transformation pour que le reste du document ne la subisse pas.
 *
 * Le `e` se remplit en `even-odd` : sa contre-forme est un second sous-chemin, et la règle par
 * défaut (`non-zero`) la remplirait, ce qui transformerait la lettre en pâté.
 */
function dessineMotSymbole(
  doc: PDFKit.PDFDocument, x: number, y: number, hauteur: number, couleur: string,
): void {
  const echelle = hauteur / MOT.box.height;
  doc.save();
  doc.translate(x, y).scale(echelle).translate(-MOT.box.x, -MOT.box.y);
  doc.fillColor(couleur);
  for (const d of MOT.paths) doc.path(d).fill();
  doc.path(MOT.pathEvenOdd).fill("even-odd");
  // Le point prend la même encre que le lettrage : c'est la variante monochrome de la charte.
  doc.circle(POINT.cx, POINT.cy, POINT.r).fill();
  doc.restore();
}

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
    //
    // LE LOGO EST DESSINÉ, PLUS COMPOSÉ (04/08/2026). L'en-tête écrivait « futur•e » en
    // Helvetica-Bold 18, c'est-à-dire dans une police système qui n'est ni le mot-symbole de la
    // charte ni même Archivo. La facture est la seule pièce que l'acheteur conserve, et elle
    // portait la marque sous une forme qui n'existe nulle part ailleurs dans le produit.
    //
    // EN ENCRE, PAS EN ORANGE, et c'est la doctrine de ce fichier : « aucune couleur de marque,
    // aucun élément décoratif », parce qu'une facture se relit imprimée en noir et blanc, où
    // l'orange du point deviendrait un gris sale à côté d'un lettrage noir. La charte prévoit
    // exactement cet emploi avec ses variantes monochromes.
    dessineMotSymbole(doc, MARGIN, MARGIN, HAUTEUR_MOT_IMPRIME_PT, INK);

    doc.font("Helvetica").fontSize(9).fillColor(GREY);
    doc.text(t(invoice.seller.nameWithForm), MARGIN, MARGIN + HAUTEUR_MOT_IMPRIME_PT + 10);
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
    //
    // LA HAUTEUR DU PIED EST MESURÉE, PLUS DEVINÉE (04/08/2026). Elle valait 54 points pour deux
    // blocs posés à des décalages fixes. L'ajout de la mention de renoncement à la rétractation a
    // montré la fragilité du procédé : un bloc qui gagne une ligne passe sous le suivant, sans que
    // rien n'échoue, et la facture part quand même. Les trois blocs sont désormais empilés à partir
    // de leur hauteur réelle.
    doc.font("Helvetica").fontSize(8).fillColor(GREY);
    const piedBlocs = [
      // La DATE D'EXÉCUTION doit figurer sur une note de prestation de service (arrêté du 3 octobre
      // 1983). Elle se confond ici avec la date de paiement : l'accès au rapport est ouvert par le
      // webhook, dans la seconde qui suit l'encaissement. Le jour où une prestation s'étalerait
      // dans le temps, cette ligne devrait porter deux dates distinctes.
      t(
        `Facture acquittée. Paiement reçu le ${formatDateFr(invoice.issuedAt)} par carte bancaire. ` +
        `Prestation exécutée le ${formatDateFr(invoice.issuedAt)}, accès ouvert au client à cette date. ` +
        `${invoice.vatMention}.`,
      ),
      // LA TROISIÈME CONDITION DE L'ARTICLE L221-28 13°.
      // ════════════════════════════════════════════════════════════════════════════════════════
      // L'exception au droit de rétractation pour un contenu numérique fourni immédiatement demande
      // TROIS choses : l'accord exprès à l'exécution immédiate, le renoncement exprès à la
      // rétractation, et la CONFIRMATION de cet accord sur un support durable. Les deux premières
      // sont recueillies avant le paiement (`PaymentForm.tsx`) ; sans cette ligne, la troisième
      // manquait, et l'exception ne jouait donc pas, quoi qu'ait coché l'acheteur.
      //
      // La facture est le support durable : produite à l'encaissement, remise au client, conservée.
      // Le libellé reprend les deux accords tels qu'ils lui ont été présentés, sans les reformuler :
      // une confirmation qui dirait autre chose que la case ne confirmerait rien.
      t(
        "Le client a demandé l'exécution immédiate de la prestation et a reconnu perdre son " +
        "droit de rétractation dès la mise à disposition du contenu, conformément à l'article " +
        "L221-28 13° du code de la consommation. " +
        "La présente facture vaut confirmation de cet accord sur support durable.",
      ),
      t(`${invoice.seller.nameWithForm} - SIRET ${invoice.seller.siret} - ${invoice.seller.address}`),
    ];
    const ESPACE_ENTRE_BLOCS = 6;
    const hauteurPied = piedBlocs.reduce(
      (h, bloc) => h + doc.heightOfString(bloc, { width: W }) + ESPACE_ENTRE_BLOCS,
      0,
    );
    const footY = doc.page.height - MARGIN - hauteurPied;
    doc.moveTo(MARGIN, footY - 14).lineTo(MARGIN + W, footY - 14).strokeColor(RULE).stroke();
    let piedY = footY;
    for (const bloc of piedBlocs) {
      doc.text(bloc, MARGIN, piedY, { width: W });
      piedY += doc.heightOfString(bloc, { width: W }) + ESPACE_ENTRE_BLOCS;
    }

    doc.end();
  });
}
