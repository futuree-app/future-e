import Link from "next/link";
import type { Metadata } from "next";
import { LEGAL_ENTITY, legalAddressLine, legalNameWithForm } from "@/lib/legal-entity";
import { LegalShell, Section, InfoBlock, InfoRow } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Conditions générales de vente · futur•e",
  description:
    "Ce que futur•e vend, à quel prix, ce que l'achat donne, et ce qu'il advient du droit de rétractation.",
};

const LAST_UPDATED = "4 août 2026";

/* LES PRIX SONT ÉCRITS ICI EN TOUTES LETTRES, ET C'EST UN CHOIX.
   Ils vivent aussi dans `create-payment-intent/route.ts` (la carte serveur, seule autorité sur ce
   qui est encaissé) et dans `dossier-pricing.ts`. Les importer ici ferait dépendre une page
   publique d'un module serveur, et surtout : des CGV décrivent l'offre TELLE QU'ELLE ÉTAIT À LA
   DATE DE MISE À JOUR ci-dessus. Un prix qui changerait dans le code changerait silencieusement le
   contrat déjà accepté par des acheteurs. La divergence doit être visible et datée, pas absorbée.

   Corollaire : tout changement de prix se répercute ICI, à la main, avec une nouvelle date. */
const PRODUITS = [
  {
    nom: "Dossier de territoire",
    prix: "14 €",
    objet:
      "L'analyse d'une commune : sa trajectoire climatique, ses risques déclarés et ce que les " +
      "sources publiques en disent, lues depuis votre projet. Trois questions à AskFuture. " +
      "Régénérable une fois par an.",
  },
  {
    nom: "Dossier d'adresse",
    prix: "39 €",
    objet:
      "L'analyse d'une adresse précise et de ses abords, en plus du territoire de sa commune. " +
      "Le montant du dossier de territoire de la même commune, s'il a déjà été payé, est déduit : " +
      "le dossier revient alors à 25 €. Un tarif de lancement, quand il s'applique, remplace ce " +
      "calcul et devient le prix payé.",
  },
  {
    nom: "Comparaison complète",
    prix: "39 €",
    objet:
      "La mise en regard de plusieurs communes sur l'ensemble des thèmes, pour arbitrer entre " +
      "elles.",
  },
];

/* LE MÉDIATEUR DE LA CONSOMMATION N'EST PAS ENCORE DÉSIGNÉ, et cette page le dit.
   ════════════════════════════════════════════════════════════════════════════════════════════
   L'article L612-1 du code de la consommation impose à tout professionnel vendant à des
   consommateurs de garantir un recours effectif à un médiateur, et l'article L616-1 impose d'en
   communiquer les coordonnées. L'adhésion se fait auprès d'un médiateur référencé par la CECMC et
   se paie à l'année.

   Écrire ici le nom d'un médiateur auquel futur•e n'a pas adhéré serait pire que le silence : le
   consommateur qui le saisirait verrait sa demande rejetée, après avoir cru disposer d'un recours.
   Tant que la valeur est `null`, la page annonce la voie réellement ouverte, et l'obligation reste
   VISIBLE dans le code plutôt que masquée par une phrase creuse.

   Dès l'adhésion : renseigner les trois champs, la section se réécrit seule. */
const MEDIATEUR: { nom: string; site: string; adresse: string } | null = null;

const lien = { color: "var(--orange-ink)", textDecoration: "underline" } as const;

export default function ConditionsGeneralesDeVentePage() {
  return (
    <LegalShell
      lastUpdated={LAST_UPDATED}
      title="Conditions générales de vente"
      intro={
        <>
          Ce que futur•e vend, à quel prix, ce que l&apos;achat vous donne, et ce qu&apos;il advient
          de votre droit de rétractation quand vous demandez à lire votre dossier tout de suite.
        </>
      }
    >
      <Section title="1. Qui vend, et à qui">
        <p>
          Le vendeur est {LEGAL_ENTITY.legalName}, {LEGAL_ENTITY.legalForm}, qui édite le service
          sous le nom {LEGAL_ENTITY.tradeName}.
        </p>
        <InfoBlock>
          <InfoRow label="Vendeur" value={legalNameWithForm()} />
          <InfoRow label="SIRET" value={LEGAL_ENTITY.siret} />
          <InfoRow label="Adresse" value={legalAddressLine()} />
          <InfoRow label="Contact" value={LEGAL_ENTITY.contactEmail} />
        </InfoBlock>
        <p style={{ marginTop: 16 }}>
          Ces conditions s&apos;appliquent à toute personne qui achète un dossier sur futur•e. Elles
          sont acceptées au moment du paiement, et la version qui vous engage est celle affichée ce
          jour-là. Les informations complètes sur l&apos;éditeur figurent dans les{" "}
          <Link href="/mentions-legales" style={lien}>mentions légales</Link>.
        </p>
      </Section>

      <Section title="2. Ce qui est vendu">
        <p>
          futur•e vend des <strong>contenus numériques</strong>, livrés en ligne, sans support
          matériel. Chaque achat est un paiement unique. Il n&apos;y a aucun abonnement, aucune
          reconduction et aucun prélèvement automatique.
        </p>
        {PRODUITS.map((p) => (
          <div key={p.nom} style={{ marginTop: 20 }}>
            <p style={{ margin: "0 0 6px", color: "var(--fg-1)" }}>
              <strong>{p.nom}</strong> · {p.prix}
            </p>
            <p style={{ margin: 0, fontSize: 14, color: "var(--fg-2)" }}>{p.objet}</p>
          </div>
        ))}
        <p style={{ marginTop: 20 }}>
          Un achat ouvre un droit d&apos;accès rattaché à votre compte. Il ne transfère aucune
          propriété sur les analyses, les méthodes ou l&apos;interface.
        </p>
      </Section>

      <Section title="3. Les prix">
        <p>
          Les prix sont indiqués en euros et sont les prix définitivement dus.{" "}
          <strong>{LEGAL_ENTITY.vatMention}.</strong>{" "}
          Aucune taxe n&apos;est collectée et aucun
          montant ne s&apos;ajoute au prix affiché.
        </p>
        <p style={{ marginTop: 16 }}>
          Le prix qui vous engage est celui affiché sur l&apos;écran de paiement au moment où vous
          validez. Un changement de tarif ultérieur ne s&apos;applique jamais à un achat déjà réglé.
        </p>
      </Section>

      <Section title="4. Commande et paiement">
        <p>
          Le paiement se fait par carte bancaire, par l&apos;intermédiaire de Stripe. futur•e ne voit
          ni ne conserve votre numéro de carte : il est transmis directement à Stripe, qui traite
          l&apos;opération.
        </p>
        <p style={{ marginTop: 16 }}>
          Le montant encaissé est décidé par le serveur de futur•e à partir du produit choisi, et
          jamais à partir d&apos;une valeur transmise par votre navigateur.
        </p>
        <p style={{ marginTop: 16 }}>
          Une <strong>facture</strong>{" "}
          est émise automatiquement dès l&apos;encaissement confirmé.
          Elle porte le détail de la prestation, son montant et l&apos;identité du vendeur, et
          reste disponible depuis votre compte.
        </p>
      </Section>

      <Section title="5. Mise à disposition">
        <p>
          Le dossier acheté est mis à disposition <strong>immédiatement</strong>{" "}
          après confirmation
          du paiement, dans votre compte. Il n&apos;y a ni délai de livraison, ni envoi postal.
        </p>
        <p style={{ marginTop: 16 }}>
          Si le paiement est confirmé sans que l&apos;accès s&apos;ouvre, écrivez à{" "}
          <a href={`mailto:${LEGAL_ENTITY.contactEmail}`} style={lien}>
            {LEGAL_ENTITY.contactEmail}
          </a>{" "}
          : l&apos;accès est rétabli, ou le paiement remboursé.
        </p>
      </Section>

      <Section title="6. Droit de rétractation, et ce que vous en faites">
        <p>
          Un achat à distance ouvre normalement un droit de rétractation de{" "}
          <strong>quatorze jours</strong>, sans motif à donner.
        </p>
        <p style={{ marginTop: 16 }}>
          Ce droit connaît une exception pour les contenus numériques fournis immédiatement. Pour
          que vous puissiez lire votre dossier tout de suite plutôt que dans quatorze jours,
          futur•e vous demande, <strong>avant le paiement</strong>, deux choses distinctes :
        </p>
        <ul style={{ paddingLeft: 20, lineHeight: 1.9, color: "var(--fg-2)", margin: "16px 0 0" }}>
          <li>que vous demandiez expressément l&apos;exécution immédiate du contrat ;</li>
          <li>
            que vous reconnaissiez qu&apos;en le faisant, vous{" "}
            <strong>renoncez à votre droit de rétractation</strong> dès que le dossier vous est
            ouvert.
          </li>
        </ul>
        <p style={{ marginTop: 16 }}>
          Sans ces deux accords, l&apos;achat ne peut pas être finalisé. Ils vous sont confirmés par
          écrit avec votre facture. C&apos;est ce que prévoit l&apos;article L221-28 du code de la
          consommation, et c&apos;est la contrepartie honnête d&apos;un accès immédiat : un dossier
          lu ne se rend pas.
        </p>
        <p style={{ marginTop: 16 }}>
          <strong>Ce que futur•e fait quand même.</strong>{" "}
          Si le dossier acheté ne contient pas ce
          qui était annoncé, ou si un problème technique vous empêche de le lire, écrivez. Le
          remboursement est accordé sans discuter. Le droit auquel vous renoncez est celui de
          changer d&apos;avis, jamais celui d&apos;obtenir ce pour quoi vous avez payé.
        </p>
      </Section>

      <Section title="7. Durée d'accès et disponibilité">
        <p>
          Un dossier acheté reste accessible depuis votre compte tant que le service existe. Le
          dossier de territoire est régénérable une fois par an, pour tenir compte des mises à jour
          des sources publiques.
        </p>
        <p style={{ marginTop: 16 }}>
          futur•e s&apos;efforce de maintenir le service accessible en permanence, sans le garantir :
          une interruption peut venir d&apos;une maintenance, d&apos;un hébergeur ou d&apos;une
          source publique indisponible. Une interruption qui vous priverait durablement d&apos;un
          dossier payé ouvre droit au remboursement.
        </p>
      </Section>

      <Section title="8. Ce que le dossier n'est pas">
        <p>
          futur•e produit des projections à partir de données publiques. Elles éclairent une
          décision, elles ne la remplacent pas, et elles ne constituent{" "}
          <strong>ni un diagnostic réglementaire, ni un conseil juridique, financier ou
          immobilier</strong>. Un état des risques réglementaire, un diagnostic technique ou une
          expertise de bien restent à demander aux professionnels habilités.
        </p>
        <p style={{ marginTop: 16 }}>
          Les sources publiques utilisées peuvent comporter des erreurs, des retards de mise à jour
          ou des lacunes. Chaque dossier nomme ce qu&apos;il sait, ce qu&apos;il ne sait pas et à
          quelle date il l&apos;a lu. La responsabilité de futur•e ne peut être engagée pour une
          décision prise sur la seule foi d&apos;un dossier, ni au-delà du montant payé pour lui.
        </p>
      </Section>

      <Section title="9. Garantie légale de conformité">
        <p>
          Vous bénéficiez de la garantie légale de conformité des contenus numériques, prévue aux
          articles L224-25-12 et suivants du code de la consommation. Elle s&apos;applique
          indépendamment des présentes conditions et sans frais. Un contenu qui ne correspond pas à
          ce qui était décrit doit être mis en conformité, ou le prix réduit, ou le contrat résolu.
        </p>
      </Section>

      <Section title="10. Données personnelles">
        <p>
          Les données collectées, leur durée de conservation, les sous-traitants mobilisés et les
          moyens d&apos;exercer vos droits sont décrits dans la{" "}
          <Link href="/politique-confidentialite" style={lien}>politique de confidentialité</Link>.
        </p>
      </Section>

      <Section title="11. Réclamation et médiation">
        <p>
          Toute réclamation s&apos;adresse d&apos;abord à{" "}
          <a href={`mailto:${LEGAL_ENTITY.contactEmail}`} style={lien}>
            {LEGAL_ENTITY.contactEmail}
          </a>
          . Une réponse est apportée dans les meilleurs délais.
        </p>
        {MEDIATEUR ? (
          <>
            <p style={{ marginTop: 16 }}>
              Si la réponse ne vous satisfait pas, vous pouvez saisir gratuitement le médiateur de
              la consommation dont futur•e relève, dans un délai d&apos;un an à compter de votre
              réclamation écrite.
            </p>
            <InfoBlock>
              <InfoRow label="Médiateur" value={MEDIATEUR.nom} />
              <InfoRow label="Adresse" value={MEDIATEUR.adresse} />
              <InfoRow label="Site" value={MEDIATEUR.site} />
            </InfoBlock>
          </>
        ) : (
          <p style={{ marginTop: 16 }}>
            La désignation d&apos;un médiateur de la consommation est en cours. Tant qu&apos;elle
            n&apos;est pas effective, aucune procédure de médiation ne peut être annoncée ici, et la
            voie ouverte est la réclamation directe ci-dessus, puis les juridictions compétentes.
          </p>
        )}
      </Section>

      <Section title="12. Droit applicable">
        <p>
          Ces conditions sont soumises au droit français. En cas de litige, les tribunaux français
          sont compétents, et un consommateur peut toujours saisir la juridiction du lieu où il
          demeurait au moment de l&apos;achat.
        </p>
      </Section>
    </LegalShell>
  );
}
