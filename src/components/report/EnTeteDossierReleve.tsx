import Link from "next/link";
import type { ContenuHero } from "@/lib/decision/premier-ecran";
import { ANCRE_PROJET } from "@/lib/decision/premier-ecran";
import { releve as s } from "@/components/releve/primitives";
import { adresseAvecLieu, INTENT_LABEL } from "./EnTeteDossier";
import d from "./autour-du-releve.module.css";

// ════════════════════════════════════════════════════════════════════════════════════════════
// FUT-125 · L'EN-TÊTE DU DOSSIER SOUS LE RELEVÉ : UN RETOUR, UN LIEU, CE QUI CADRE LA LECTURE.
//
// La recette du 22/10/2026 lisait, au-dessus du verdict : « Vous consultez La Rochelle · 6 autres
// communes vous sont ouvertes », un surtitre orange « ● DOSSIER », l'adresse complète, puis « Changer de
// bien ». Le lieu y était nommé deux fois, et deux liens menaient à la même page (`/rapport/dossiers`).
//
// Ce qui reste, et pourquoi chaque ligne :
//   · « ← Vos lieux » : la seule navigation, vers la liste qui nomme déjà chaque lieu et son dossier.
//     Le compteur de communes n'y figure plus : la liste est à un clic, et elle les compte mieux.
//   · le lieu lu, une fois : l'adresse du dossier actif (elle porte la commune), ou la commune seule.
//   · la résidence, SEULEMENT quand elle diffère du lieu lu : c'est la distinction utile (« Vous
//     consultez Nantes, vous habitez Lorient »), avec son retour. Le lien vise une Route Handler qui
//     change le territoire actif : un <a>, jamais un <Link>, qui ne naviguerait pas et pourrait la
//     précharger (`/rapport/page.tsx`).
//   · le projet DU JOUR (modifiable), et rien de l'artefact : sa date et son grain qualifient la version
//     servie, et se lisent au-dessus du verdict (`DossierDecisionReleve`), jamais ici (cf. `EnTeteDossier`).
//
// Les mêmes données que l'en-tête classique, aucune nouvelle lecture : la présentation classique, elle,
// garde `EnTeteDossier` et la ligne « Vous consultez » de la page, inchangées.
// ════════════════════════════════════════════════════════════════════════════════════════════

export function EnTeteDossierReleve({
  lieu, bienLabel, choixParDefaut, residence, intent, nbPriorites, projetRenseigne, contenu,
}: {
  lieu: string;
  /** L'adresse du bien lu, ou `null` quand la lecture est communale. */
  bienLabel: string | null;
  /**
   * Le bien a été DEVINÉ (`repli_plus_recent`) ET un autre existe : le lecteur doit pouvoir le savoir.
   * Sans alternative, il n'y a rien à deviner (même règle que l'en-tête classique).
   */
  choixParDefaut: boolean;
  /** La commune de résidence, quand elle DIFFÈRE du lieu lu ; `null` sinon (rien à distinguer). */
  residence: string | null;
  intent: string | null;
  nbPriorites: number | null;
  projetRenseigne: boolean;
  contenu: ContenuHero;
}) {
  const priorites = nbPriorites && nbPriorites > 0
    ? `${nbPriorites} ${nbPriorites === 1 ? "priorité" : "priorités"}`
    : null;
  return (
    <header className={`${s.releveSection} ${d.entete}`}>
      <Link href="/rapport/dossiers" className={d.retour}>
        <span aria-hidden>←</span>
        <span>Vos lieux</span>
      </Link>
      <p className={d.lieu}>{adresseAvecLieu(bienLabel, lieu)}</p>
      {choixParDefaut || residence ? (
        <p className={`${s.nuance} ${d.contexte}`}>
          {choixParDefaut ? <span>À défaut de choix, le bien le plus récent.</span> : null}
          {residence ? (
            <span>
              Votre résidence est {residence}.{" "}
              <a href="/rapport/residence" className={s.lien}>Y revenir</a>
            </span>
          ) : null}
        </p>
      ) : null}
      {projetRenseigne ? (
        <p className={`${s.nuance} ${d.contexte}`}>
          <span>
            Votre projet aujourd&apos;hui
            {intent && INTENT_LABEL[intent] ? ` · ${INTENT_LABEL[intent]}` : ""}
            {priorites ? ` · ${priorites}` : ""}
          </span>
          <a href={`#${ANCRE_PROJET}`} className={s.lien}>Voir et modifier</a>
        </p>
      ) : null}
      {/* Le titre de l'état « invite » (payant, aucun projet) : même rôle que le verdict, qu'il remplace. */}
      {contenu.kind === "invite" ? <h1 className={s.titre} style={{ marginTop: 18 }}>{contenu.titre}</h1> : null}
    </header>
  );
}
