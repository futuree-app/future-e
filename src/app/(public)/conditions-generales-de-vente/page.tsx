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
      "sources publiques en disent, lues depuis votre projet. Trois questions à AskFuture.",
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
    // LE NOM EST CELUI QUE LE LECTEUR VOIT AU MOMENT DE PAYER. Trois noms coexistaient au
    // 05/08/2026 : « Pack Décision » dans toute l'interface d'achat, « Comparaison complète de
    // plusieurs communes » sur la facture, et « Comparaison complète » ici. Des conditions de vente
    // qui nomment autrement que l'écran de paiement obligent l'acheteur à deviner qu'il s'agit du
    // même produit. C'est le nom de l'interface qui gagne, et la facture reste plus descriptive
    // parce qu'elle s'adresse aussi à un tiers qui ne connaît pas le produit.
    nom: "Pack Décision",
    prix: "39 €",
    objet:
      "La mise en regard de plusieurs communes sur l'ensemble des thèmes, pour arbitrer entre " +
      "elles. La facture le désigne comme « comparaison complète de plusieurs communes ».",
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

/* L'ENCADRÉ DE LA GARANTIE LÉGALE, REPRODUIT MOT POUR MOT.
   ════════════════════════════════════════════════════════════════════════════════════════════
   L'article D211-3 du code de la consommation impose que les conditions générales portant sur un
   contenu numérique comportent un encadré informant le consommateur des modalités de mise en œuvre
   des garanties légales, « conformément au modèle annexé au présent code ». Le modèle est
   l'annexe à l'article D. 211-3, et son texte est IMPOSÉ.

   NE PAS LE RÉÉCRIRE, NE PAS L'ABRÉGER, NE PAS LE « METTRE DANS LA VOIX DE futur•e ». Un résumé,
   même fidèle et mieux écrit, ne satisfait pas l'obligation : c'est la seule partie de cette page
   dont la rédaction n'appartient pas à futur•e. La version précédente en donnait trois phrases de
   synthèse, ce qui était le plus gros manque de la page.

   Découpé en paragraphes plutôt qu'en un bloc unique, uniquement pour le rendu : le texte est
   identique, dans le même ordre, et l'énumération de 1° à 5° garde sa numérotation.

   Source : Légifrance, annexe à l'article D. 211-3 du code de la consommation. */
const ENCADRE_GARANTIE: string[] = [
  "Le consommateur dispose d'un délai de deux ans à compter de la fourniture du contenu numérique ou du service numérique pour obtenir la mise en œuvre de la garantie légale de conformité en cas d'apparition d'un défaut de conformité. Durant un délai d'un an à compter de la date de fourniture, le consommateur n'est tenu d'établir que l'existence du défaut de conformité et non la date d'apparition de celui-ci.",
  "La garantie légale de conformité emporte obligation de fournir toutes les mises à jour nécessaires au maintien de la conformité du contenu numérique ou du service numérique.",
  "La garantie légale de conformité donne au consommateur droit à la mise en conformité du contenu numérique ou du service numérique sans retard injustifié suivant sa demande, sans frais et sans inconvénient majeur pour lui.",
  "Le consommateur peut obtenir une réduction du prix en conservant le contenu numérique ou le service numérique ou il peut mettre fin au contrat en se faisant rembourser intégralement contre renoncement au contenu numérique ou au service numérique, si :",
  "1° Le professionnel refuse de mettre le contenu numérique ou le service numérique en conformité ;",
  "2° La mise en conformité du contenu numérique ou du service numérique est retardée de manière injustifiée ;",
  "3° La mise en conformité du contenu numérique ou du service numérique ne peut intervenir sans frais imposés au consommateur ;",
  "4° La mise en conformité du contenu numérique ou du service numérique occasionne un inconvénient majeur pour le consommateur ;",
  "5° La non-conformité du contenu numérique ou du service numérique persiste en dépit de la tentative de mise en conformité du professionnel restée infructueuse.",
  "Le consommateur a également droit à une réduction du prix ou à la résolution du contrat lorsque le défaut de conformité est si grave qu'il justifie que la réduction du prix ou la résolution du contrat soit immédiate. Le consommateur n'est alors pas tenu de demander la mise en conformité du contenu numérique ou du service numérique au préalable.",
  "Dans les cas où le défaut de conformité est mineur, le consommateur n'a droit à l'annulation du contrat que si le contrat ne prévoit pas le paiement d'un prix.",
  "Toute période d'indisponibilité du contenu numérique ou du service numérique en vue de sa remise en conformité suspend la garantie qui restait à courir jusqu'à la fourniture du contenu numérique ou du service numérique de nouveau conforme.",
  "Les droits mentionnés ci-dessus résultent de l'application des articles L. 224-25-1 à L. 224-25-31 du code de la consommation.",
  "Le professionnel qui fait obstacle de mauvaise foi à la mise en œuvre de la garantie légale de conformité encourt une amende civile d'un montant maximal de 300 000 euros, qui peut être porté jusqu'à 10 % du chiffre d'affaires moyen annuel (article L. 242-18-1 du code de la consommation).",
  "Le consommateur bénéficie, en outre, de la garantie légale des vices cachés en application des articles 1641 à 1649 du code civil, pendant une durée de deux ans à compter de la découverte du défaut. Cette garantie donne droit à une réduction de prix si le contenu numérique ou le service numérique est conservé ou à un remboursement intégral contre renonciation au contenu numérique ou au service numérique.",
];

const lien = { color: "var(--orange-ink)", textDecoration: "underline" } as const;

/** Un vrai encadré, parce que la réglementation en demande un et pas un paragraphe de plus. */
function Encadre({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        marginTop: 20,
        padding: "20px 22px",
        borderRadius: 12,
        border: "1px solid var(--border-2)",
        background: "var(--bg-elev)",
        fontSize: 13.5,
        lineHeight: 1.7,
        color: "var(--fg-2)",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--fg-3)",
          margin: "0 0 14px",
        }}
      >
        {titre}
      </p>
      {children}
    </div>
  );
}

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
          <InfoRow label="Téléphone" value={LEGAL_ENTITY.phone} />
        </InfoBlock>
        {/* LE PUBLIC EST DÉFINI, ET IL EST ÉTROIT (05/08/2026).
            « Toute personne qui achète » couvrait aussi un acheteur professionnel, qui ne relève
            pas du même régime : les garanties et le droit de rétractation décrits plus bas sont
            ceux du consommateur. Le jour où futur•e vend à des professionnels, ce sera par des
            conditions distinctes, pas par extension de celles-ci. */}
        <p style={{ marginTop: 16 }}>
          Ces conditions s&apos;appliquent aux <strong>consommateurs</strong>, c&apos;est-à-dire aux
          personnes physiques qui achètent à des fins n&apos;entrant pas dans le cadre de leur
          activité professionnelle. Elles sont acceptées au moment du paiement, et la version qui
          vous engage est celle affichée ce jour-là. Les informations complètes sur l&apos;éditeur
          figurent dans les{" "}
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
        {/* CE QUI EST PROMIS ICI DOIT ÊTRE VRAI DANS TOUS LES CAS (05/08/2026).
            La rédaction précédente promettait une facture « émise automatiquement ». Le webhook
            n'en émet pas quand le nom de facturation manque au compte, et il avale volontairement
            l'échec pour ne jamais bloquer la livraison. Promettre sans condition ce que le code
            fait sous condition, dans un document contractuel, crée l'écart le plus banal et le plus
            coûteux : celui entre ce qui est écrit et ce qui se passe.
            La condition est donc dite, et le recours avec. */}
        <p style={{ marginTop: 16 }}>
          Un <strong>e-mail de confirmation</strong> vous est envoyé dès l&apos;encaissement. Une{" "}
          <strong>facture</strong> y est jointe dès lors que votre compte porte un nom de
          facturation, et vous la retrouvez alors dans votre espace. Si elle manque, écrivez-nous :
          elle est émise sans délai.
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
          {/* « DÈS QUE LA FOURNITURE COMMENCE », ET NON « DÈS QUE LE DOSSIER EST LU » (05/08/2026).
              La perte du droit ne dépend pas de ce que le client a effectivement consulté : elle
              tient au COMMENCEMENT DE LA FOURNITURE, c'est-à-dire à la mise à disposition. Un
              dossier ouvert et jamais ouvert par son acheteur n'est déjà plus rétractable. Écrire
              l'inverse promettait un droit qui n'existe pas, et la formule « un dossier lu ne se
              rend pas », meilleure à l'oreille, disait précisément la chose fausse. */}
          <li>
            que vous reconnaissiez qu&apos;en le faisant, vous{" "}
            <strong>perdez votre droit de rétractation</strong>{" "}
            dès que la fourniture commence, c&apos;est-à-dire dès la mise à disposition du dossier
            dans votre compte, que vous le consultiez ou non.
          </li>
        </ul>
        <p style={{ marginTop: 16 }}>
          Sans ces deux accords, l&apos;achat ne peut pas être finalisé. Ils vous sont confirmés{" "}
          <strong>dans l&apos;e-mail de confirmation de commande</strong> et, lorsqu&apos;une
          facture est émise, sur celle-ci. C&apos;est ce que prévoit l&apos;article L221-28 du code
          de la consommation, et c&apos;est la contrepartie d&apos;un accès immédiat : un contenu
          numérique dont la fourniture a commencé ne se rétracte plus.
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
        {/* UNE DURÉE CHIFFRÉE, PARCE QUE C'EST UN ENGAGEMENT (05/08/2026).
            « Tant que le service existe » se comprend humainement et ne s'exécute pas : la durée
            dépendait alors d'un événement que futur•e décide seule. Trois ans est un engagement
            tenable, au-dessus de la durée d'usage réelle d'un dossier de décision. */}
        <p>
          Un dossier acheté reste accessible depuis votre compte pendant{" "}
          <strong>au moins trois ans à compter de l&apos;achat</strong>. Le paiement est unique, il
          n&apos;y a pas d&apos;abonnement.
        </p>
        {/* CE PARAGRAPHE DIT CE QUE LE CODE FAIT, ET C'EST INCONFORTABLE (05/08/2026).
            ══════════════════════════════════════════════════════════════════════════════════════
            La version précédente promettait une « régénération une fois tous les douze mois ». Rien
            dans le dépôt ne régénère quoi que ce soit : `/rapport` et `/rapport/quartier` sont en
            `force-dynamic` et `buildCommuneDossier` réassemble le dossier À CHAQUE CONSULTATION,
            avec le moteur du jour. La phrase décrivait un modèle d'artefact figé que futur•e n'a
            jamais eu, et je l'avais reprise des textes de vente sans la vérifier.

            CE QU'IL FAUT DIRE, ET QUI EST PLUS DÉLICAT : le lecteur qui revient ne retrouve pas
            exactement le dossier qu'il a acheté. Les sources d'adresse restent celles du jour de
            l'analyse (elles sont gelées dans le snapshot), pendant que les règles, les seuils et
            les formulations, eux, sont ceux du moteur courant. Le taire serait une omission sur la
            chose même que futur•e vend, la vérifiabilité.

            CE N'EST PAS UN ÉTAT SOUHAITABLE, et le dire ici ne le rend pas souhaitable. Le chantier
            qui le referme est le dossier DATÉ ET VERSIONNÉ : une amélioration du moteur créerait
            une nouvelle version, sans réécrire la précédente. Tant qu'il n'est pas fait, la page
            décrit la réalité plutôt qu'une intention. */}
        <p style={{ marginTop: 16 }}>
          <strong>Votre dossier se consulte en ligne et il est recalculé à chaque ouverture</strong>,
          avec les méthodes et les données disponibles à ce moment-là. Les analyses peuvent donc
          évoluer entre deux consultations, à mesure que futur•e améliore ses sources et ses
          méthodes. Les données propres à une adresse, elles, restent celles relevées au moment de
          l&apos;analyse, et chaque constat porte la date à laquelle sa source a été lue.
        </p>
        <p style={{ marginTop: 16 }}>
          Il en découle une limite que nous préférons écrire : futur•e ne conserve pas aujourd&apos;hui
          une copie figée du dossier tel qu&apos;il se présentait le jour de votre achat. Si une
          analyse a compté dans une décision, gardez-en une trace de votre côté.
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
          quelle date il l&apos;a lu. Un dossier se croise avec les documents réglementaires et les
          vérifications adaptées à votre projet : une décision prise sur sa seule foi ignorerait ce
          qu&apos;il dit lui-même de ses limites.
        </p>
        {/* CE PARAGRAPHE A REMPLACÉ UN PLAFOND DE RESPONSABILITÉ (05/08/2026).
            La version précédente finissait par « ni au-delà du montant payé pour lui ». L'article
            R212-1 du code de la consommation répute irréfragablement abusive, dans un contrat entre
            un professionnel et un consommateur, la clause qui supprime ou réduit le droit à
            réparation du consommateur en cas de manquement du professionnel à l'une quelconque de
            ses obligations. Un plafond égal au prix payé tombe exactement là.
            Décrire la PORTÉE du service reste légitime, et c'est ce que fait le paragraphe
            ci-dessus. Limiter la réparation ne l'est pas. */}
        <p style={{ marginTop: 16 }}>
          Ces limites décrivent la portée du service. Elles ne réduisent ni les garanties légales
          dont vous bénéficiez, ni la responsabilité de futur•e en cas de manquement à ses
          obligations.
        </p>
      </Section>

      <Section title="9. Garantie légale de conformité">
        <p>
          Vous bénéficiez de la garantie légale de conformité des contenus numériques. Elle
          s&apos;applique indépendamment des présentes conditions, sans frais, et rien ici ne peut
          la réduire. Le texte ci-dessous est celui que la réglementation impose de reproduire.
        </p>
        <Encadre titre="Garantie légale de conformité des contenus numériques et services numériques">
          {ENCADRE_GARANTIE.map((paragraphe, i) => (
            <p key={i} style={{ margin: i === 0 ? 0 : "12px 0 0" }}>{paragraphe}</p>
          ))}
        </Encadre>
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
          Ces conditions sont soumises au droit français, sous réserve des dispositions impératives
          qui protègent le consommateur.
        </p>
        {/* LES DEUX MOMENTS, ET PAS UN SEUL (05/08/2026). La rédaction précédente ne retenait que
            le lieu où le consommateur demeurait « au moment de l'achat ». L'article R631-3 du code
            de la consommation lui ouvre aussi la juridiction du lieu où il demeurait au moment de
            la SURVENANCE DU FAIT DOMMAGEABLE, ce qui compte précisément pour quelqu'un qui a
            déménagé entre les deux, c'est-à-dire pour le lecteur type de futur•e. */}
        <p style={{ marginTop: 16 }}>
          En cas de litige, vous pouvez saisir soit une juridiction compétente selon les règles
          ordinaires, soit la juridiction du lieu où vous demeuriez au moment de la conclusion du
          contrat, soit celle du lieu où vous demeuriez lors de la survenance du fait dommageable.
        </p>
      </Section>
    </LegalShell>
  );
}
