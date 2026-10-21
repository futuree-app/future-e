import { releve as s, Surtitre, Registre, EmblemeEchelles, type EtatTrace } from "@/components/releve/primitives";
import type { LieuAffiche, EtatEchelle, ConclusionLieu } from "@/lib/decision/vos-lieux";
import type { VerdictTone } from "@/lib/decision/conclusion-plan";
import { bindOrphans } from "@/lib/typography";
import v from "./vos-lieux.module.css";

// ════════════════════════════════════════════════════════════════════════════════════════════
// « VOS LIEUX » : la liste des lieux du compte, dans la grammaire du Relevé (FUT-118 R0).
//
// Composant de présentation PUR : il affiche ce que `assemblerVosLieux` a décidé, rien de plus. La
// conclusion est rendue telle quelle (seules les espaces insécables de `bindOrphans` s'y ajoutent).
//
// Les liens sont des <a> natifs, jamais des <Link> : leurs cibles sont des Route Handlers qui posent
// le lieu lu (`/rapport/dossiers/ouvrir`, `/rapport/territoire`, `/rapport/residence`). Un <Link> les
// préchargerait au survol, donc changerait le lieu actif sans clic ; un <a> ne précharge jamais.
// ════════════════════════════════════════════════════════════════════════════════════════════

const DATE = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });
const date = (iso: string) => DATE.format(new Date(iso));

// Le ton du verdict, porté par le trait de registre (jamais une pastille) : FUT-118 § 3.3.
const TEINTE_TON: Record<VerdictTone, string> = {
  critical: "var(--reg-incompatibilite)",
  caution: "var(--reg-compromis)",
  neutral: "var(--reg-non-su)",
  positive: "var(--reg-alignement)",
};

// Les trois états de trait de l'emblème, dans leur sens canonique (FUT-118 R0) : plein = des constats y sont
// retenus ; fin = examinée sans constat ; pointillé = non examinée. L'état « inconnu » n'a pas de trait :
// sans dossier lisible, l'emblème n'est pas dessiné du tout (on ne l'éteint ni ne l'allume à tort).
const TRACE: Record<Exclude<EtatEchelle, "inconnue">, EtatTrace> = { constats: "constats", examinee: "examinee", non_examinee: "non_examinee" };

function natureEnMots(l: LieuAffiche): string {
  if (l.type === "residence") return "Votre commune de résidence · lecture gratuite et partielle";
  const base = l.type === "commune" ? "Rapport de territoire" : l.acces === "ouvert" ? "Dossier d'adresse ouvert par futur•e" : "Dossier d'adresse";
  return l.estResidence && l.type === "commune" ? `${base} · votre commune de résidence` : base;
}

function echellesEnMots(l: LieuAffiche): string | null {
  const e = l.echelles;
  if (l.type === "residence") return null;
  if (e.territoire === "inconnue") return "Échelles examinées non connues";
  const lu = (x: EtatEchelle) => x === "constats" || x === "examinee";
  if (lu(e.autour) && lu(e.logement)) return "Commune, abords et logement examinés";
  if (l.type === "adresse") return "Commune examinée ; l'adresse n'a pas pu être lue";
  return "Commune examinée";
}

function Conclusion({ c }: { c: ConclusionLieu }) {
  if (c.etat === "disponible") {
    return (
      <div className={v.conclusion}>
        <p className={s.etiquette}>Ce que conclut votre dossier</p>
        <Registre teinte={c.ton ? TEINTE_TON[c.ton] : undefined} className={v.verdict}>{bindOrphans(c.texte)}</Registre>
        <p className={s.nuance}>{c.miseAJour ? "Analyse mise à jour le " : "Analyse réalisée le "}{date(c.generatedAt)}</p>
        {c.actualite === "projet_change" ? (
          <p className={v.ancienne}>Votre projet a changé depuis cette analyse. Cette conclusion reflète vos anciens critères.</p>
        ) : (
          <p className={s.nuance}>
            {c.actualite === "a_jour" ? "Elle correspond à votre projet actuel." : "Impossible de savoir si elle correspond à votre projet actuel."}
          </p>
        )}
        {c.tentativePlusRecente === "en_preparation" ? <p className={s.nuance}>Une nouvelle version de l&apos;analyse est en préparation.</p> : null}
      </div>
    );
  }
  const texte = {
    absente: "Aucune analyse n'est enregistrée pour ce dossier. Le dossier reste consultable.",
    en_preparation: "L'analyse de ce lieu est en préparation.",
    illisible: "L'analyse enregistrée ne peut pas être affichée ici. Le dossier reste consultable.",
    lecture_gratuite: "Une lecture gratuite ne comporte pas de conclusion de dossier.",
  }[c.etat];
  return <div className={v.conclusion}><p className={s.dense}>{texte}</p></div>;
}

export function VosLieux({ lieux }: { lieux: LieuAffiche[] }) {
  const n = lieux.filter((l) => l.type !== "residence").length;
  const anciennes = lieux.filter((l) => l.conclusion.etat === "disponible" && l.conclusion.actualite === "projet_change").length;
  return (
    <section aria-labelledby="titre-vos-lieux" className={v.page}>
      <Surtitre>Ma décision</Surtitre>
      <h1 id="titre-vos-lieux" className={s.titre}>Vos lieux</h1>
      <p className={`${s.chapo} ${v.chapo}`}>
        {n === 0 ? "Aucun dossier pour l'instant."
          : n === 1 ? "Votre lieu, et ce que conclut son dossier."
            : `Vos ${n} lieux, et ce que conclut le dossier de chacun.`}
        {anciennes > 0 ? <span className={v.chapoAncienne}> {anciennes > 1 ? `${anciennes} analyses reflètent` : "Une analyse reflète"} d&apos;anciens critères de votre projet.</span> : null}
      </p>
      {lieux.length > 0 ? (
        <ul className={s.liste}>
          {lieux.map((l) => {
            const inconnue = l.echelles.territoire === "inconnue";
            return (
              <li key={l.cle} className={v.lieu}>
                <div className={v.tete}>
                  <div className={v.emblemeCol} aria-hidden>
                    {inconnue ? null : (
                      <EmblemeEchelles
                        etiquette=""
                        etats={{
                          commune: TRACE[l.echelles.territoire as Exclude<EtatEchelle, "inconnue">],
                          secteur: TRACE[l.echelles.autour as Exclude<EtatEchelle, "inconnue">],
                          batiment: TRACE[l.echelles.logement as Exclude<EtatEchelle, "inconnue">],
                        }}
                      />
                    )}
                  </div>
                  <div className={v.identite}>
                    <h2 className={v.commune}>
                      {l.commune}
                      {l.adresse ? <span className={v.adresse}>{l.adresse}</span> : null}
                    </h2>
                    <p className={s.nuance}>{natureEnMots(l)}</p>
                    {echellesEnMots(l) ? <p className={s.nuance}>{echellesEnMots(l)}</p> : null}
                  </div>
                </div>
                <Conclusion c={l.conclusion} />
                <div className={v.gestes}>
                  <a href={l.principal.href} className={s.bouton}>{l.principal.label}</a>
                  {l.parEchelle.length > 0 ? (
                    <span className={v.parEchelle}>
                      <span className={s.nuance}>Ou une échelle :</span>
                      {l.parEchelle.map((e) => (
                        <span key={e.href} className={v.echelleLien}>
                          <a href={e.href} className={s.lien}>{e.label}</a>
                          {e.examinee === false ? <span className={s.nuance}> (non examinée)</span> : null}
                        </span>
                      ))}
                    </span>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
