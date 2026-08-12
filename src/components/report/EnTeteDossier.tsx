import Link from "next/link";
import type { ContenuHero } from "@/lib/decision/premier-ecran";
import { ANCRE_PROJET } from "@/lib/decision/premier-ecran";

// ════════════════════════════════════════════════════════════════════════════════════════════
// L'IDENTITÉ DE CE QUI EST LU, AU-DESSUS DE LA RÉPONSE.
//
// ── CE QUI EST ICI, ET POURQUOI ELLES SEULES ─────────────────────────────────────────────────
// Le lieu lu, le bien lu, et le projet ACTUEL du compte. Ces trois valeurs ne dépendent d'AUCUN
// artefact : elles sont connues sans attendre la moindre lecture externe, donc elles se rendent
// immédiatement et ne clignotent pas quand l'augmentation Adresse arrive.
//
// ── CE QUI N'EST PAS ICI, ET SURTOUT PAS ─────────────────────────────────────────────────────
// La date de l'analyse, son grain, son obsolescence. Elles qualifient la version SERVIE, connue
// seulement après la lecture de l'artefact du scope. La page ne connaît que l'artefact communal :
// les afficher ici daterait un verdict d'adresse avec la date d'un autre artefact.
//
// ── « VOTRE PROJET AUJOURD'HUI » EST DATÉ DU PRÉSENT, ET C'EST LE MOT QUI COMPTE ──────────────
// Cette ligne décrit le projet du compte à l'instant. Le verdict, lui, répond au projet figé dans
// l'artefact acheté. Sans cette précision, le lecteur lirait le projet d'aujourd'hui comme le
// cadrage de la réponse d'hier, ce que le bandeau d'obsolescence existe précisément pour éviter.
// ════════════════════════════════════════════════════════════════════════════════════════════

const INTENT_LABEL: Record<string, string> = { achat: "achat", location: "location" };

/**
 * LE LIEU NE SE RÉPÈTE PAS QUAND L'ADRESSE LE PORTE DÉJÀ (12/08/2026). Le hub affichait
 * « 2 Rue Crébillon 44000 Nantes, Nantes » : l'étiquette de la BAN contient le code postal ET la
 * commune, et on y recollait la commune. Comparaison sur une forme repliée (sans accents, sans
 * casse) : « NANTES » et « Nantes » sont le même lieu.
 */
function replie(v: string): string {
  return v.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}
function adresseAvecLieu(bienLabel: string | null, lieu: string): string {
  if (!bienLabel) return lieu;
  return replie(bienLabel).includes(replie(lieu)) ? bienLabel : `${bienLabel}, ${lieu}`;
}

export function EnTeteDossier({
  lieu, bienLabel, bienAlternatif, choixParDefaut, intent, nbPriorites, projetRenseigne, contenu,
}: {
  lieu: string;
  /** L'adresse du bien lu, ou `null` quand la lecture est communale. */
  bienLabel: string | null;
  /** Vrai s'il existe un autre bien à ouvrir : sans alternative, le lien n'apprend rien. */
  bienAlternatif: boolean;
  /**
   * Le bien affiché a été DEVINÉ (`choixDossier.raison === "repli_plus_recent"`), non ouvert par le
   * lecteur. La distinction décide s'il doit aller vérifier, et elle n'existe nulle part ailleurs
   * dans le produit : `/rapport/dossiers` ne la montre pas.
   */
  choixParDefaut: boolean;
  intent: string | null;
  /**
   * LE PROJET SE RÉSUME, IL NE SE RECOPIE PAS. La reformulation entière tenait sur trois lignes
   * juste au-dessus du verdict, et repoussait la réponse achetée hors du premier écran. La ligne
   * dit ce qui cadre l'analyse (l'intention, le nombre de priorités) et mène au texte complet, qui
   * se lit dans l'éditeur.
   */
  nbPriorites: number | null;
  /** Vrai dès qu'un projet est renseigné, même sans structure. Sans lui, aucune ligne de projet. */
  projetRenseigne: boolean;
  contenu: ContenuHero;
}) {
  const priorites = nbPriorites && nbPriorites > 0
    ? `${nbPriorites} ${nbPriorites === 1 ? "priorité" : "priorités"}`
    : null;

  return (
    // L'AIR AU-DESSUS EST COMPTÉ (12/08/2026) : 56 px en mobile et 80 px en desktop séparaient la
    // navigation du dossier, et cet espace repoussait la réponse d'autant.
    <div className="pt-7">
      <div className="flex items-center gap-2.5 font-mono text-[11px] tracking-[0.12em] uppercase text-accent mb-4">
        <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
        Dossier
      </div>

      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[15px] mb-1.5">
        <span className="text-label">{adresseAvecLieu(bienLabel, lieu)}</span>
        {choixParDefaut && bienAlternatif ? (
          <span className="text-[13px] text-ghost">À défaut de choix, le bien le plus récent</span>
        ) : null}
        {bienAlternatif ? (
          <Link
            href="/rapport/dossiers"
            className="text-[13.5px] text-accent underline underline-offset-2 decoration-[var(--border-2)] hover:decoration-current"
          >
            Changer de bien
          </Link>
        ) : null}
      </div>

      {projetRenseigne ? (
        <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[13.5px] text-muted">
          <span>
            Votre projet aujourd&apos;hui
            {intent && INTENT_LABEL[intent] ? ` · ${INTENT_LABEL[intent]}` : ""}
            {priorites ? ` · ${priorites}` : ""}
          </span>
          <Link
            href={`#${ANCRE_PROJET}`}
            className="text-accent underline underline-offset-2 decoration-[var(--border-2)] hover:decoration-current"
          >
            Voir et modifier
          </Link>
        </p>
      ) : null}

      {/* LE GESTE N'EST RENDU ICI QUE POUR L'INVITE. Dans l'état « projet présent mais non
          structuré », le titre est porté par le bloc verdict, qui est rendu PLUS BAS par le
          composant streamé : son bouton doit donc le suivre, pas le précéder. La page s'en charge
          (cf. `heroContenu.kind === "verdict" && heroContenu.geste`). */}
      {contenu.kind === "invite" ? (
        <>
          {/* MÊME ÉCHELLE QUE LE VERDICT (cf. `TITRE_VERDICT` dans `rapport/page.tsx`) : dans cet
              état, cette phrase EST le titre de l'écran, et deux titres de page à deux tailles
              selon l'état du projet donneraient deux hiérarchies pour un même rôle. */}
          <h1
            className="mt-6 font-[var(--weight-display)] text-[length:clamp(23px,2.9vw,36px)] leading-[1.12] tracking-[-0.8px] text-label max-w-[540px]"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            {contenu.titre}
          </h1>
          <Link
            href={contenu.geste.href}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-canvas font-semibold text-[14px] no-underline"
          >
            {contenu.geste.label}
          </Link>
        </>
      ) : null}
    </div>
  );
}
