import { releve as s, Surtitre, Ligne, Marge, Registre, EmblemeEchelles, type EtatTrace, type ElementDeMarge } from "@/components/releve/primitives";
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
const date = (iso: string | null) => (iso ? DATE.format(new Date(iso)) : null);

// Le ton du verdict, porté par le trait de registre (jamais une pastille) : FUT-118 § 3.3.
const TEINTE_TON: Record<VerdictTone, string> = {
  critical: "var(--reg-incompatibilite)",
  caution: "var(--reg-compromis)",
  neutral: "var(--reg-non-su)",
  positive: "var(--reg-alignement)",
};

const TRACE: Record<EtatEchelle, EtatTrace> = { examinee: "constats", non_examinee: "non_examinee", inconnue: "non_examinee" };

function echellesEnMots(l: LieuAffiche): string {
  const e = l.echelles;
  if (l.type === "residence") return "Lecture gratuite et partielle de la commune";
  if (e.territoire === "inconnue") return "Échelles examinées : non connues, faute de conclusion enregistrée";
  if (e.autour === "examinee" && e.logement === "examinee") return "Commune, abords de l'adresse et logement examinés";
  if (l.type === "adresse") return "Commune examinée ; l'adresse n'a pas pu être lue";
  return "Commune examinée";
}

function accesEnMots(l: LieuAffiche): string {
  const depuis = date(l.depuis);
  const base = l.acces === "achete" ? (depuis ? `Acheté le ${depuis}` : "Acheté")
    : l.acces === "ouvert" ? (depuis ? `Ouvert par futur•e le ${depuis}` : "Ouvert par futur•e")
      : "Votre commune de résidence";
  return l.estResidence && l.type !== "residence" ? `${base} · votre commune de résidence` : base;
}

function Conclusion({ c }: { c: ConclusionLieu }) {
  if (c.etat === "disponible") {
    return (
      <div className={v.conclusion}>
        <p className={s.etiquette}>Ce que conclut votre dossier</p>
        <Registre teinte={c.ton ? TEINTE_TON[c.ton] : undefined} className={v.verdict}>{bindOrphans(c.texte)}</Registre>
        <p className={s.nuance}>
          {c.actualite === "a_jour" ? "Cette conclusion répond à votre Projet actuel."
            : c.actualite === "projet_change" ? "Votre Projet a changé depuis : cette conclusion répond à votre Projet d'alors. Le dossier permet de la mettre à jour."
              : "Ce dossier ne dit pas à quel Projet il répondait : impossible de vérifier s'il est à jour."}
          {c.tentativePlusRecente === "en_preparation" ? " Une nouvelle version est en préparation." : ""}
        </p>
      </div>
    );
  }
  const texte = {
    absente: "Aucune conclusion n'est enregistrée pour ce dossier. Rien n'est généré depuis cette page ; le dossier reste consultable.",
    en_preparation: "La conclusion de ce dossier est en préparation.",
    illisible: "La conclusion enregistrée de ce dossier ne peut pas être affichée ici. Le dossier, lui, reste consultable.",
    lecture_gratuite: "Lecture gratuite : elle ne comporte pas de conclusion de dossier.",
  }[c.etat];
  return <div className={v.conclusion}><p className={s.dense}>{texte}</p></div>;
}

function margeDe(l: LieuAffiche): ElementDeMarge[] {
  const c = l.conclusion;
  const out: ElementDeMarge[] = [{ type: "grain", grain: l.type === "adresse" ? "adresse" : "commune", libelle: l.type === "adresse" ? "une adresse" : "une commune" }];
  if (c.etat === "disponible") {
    out.push({ type: "valeur", libelle: "Conclusion", valeur: `version ${c.version}`, date: date(c.generatedAt) ?? undefined });
  }
  return out;
}

export function VosLieux({ lieux }: { lieux: LieuAffiche[] }) {
  const n = lieux.filter((l) => l.type !== "residence").length;
  return (
    <section aria-labelledby="titre-vos-lieux" className={v.page}>
      <Surtitre>Ma décision</Surtitre>
      <h1 id="titre-vos-lieux" className={s.titre}>Vos lieux</h1>
      <p className={`${s.chapo} ${v.chapo}`}>
        {n === 0 ? "Aucun dossier pour l'instant."
          : n === 1 ? "Votre lieu, et ce que conclut son dossier."
            : `Vos ${n} lieux, et ce que conclut le dossier de chacun.`}
      </p>
      {lieux.length > 0 ? (
        <ul className={s.liste}>
          {lieux.map((l) => (
            <li key={l.cle} className={v.lieu}>
              <Ligne marge={<Marge elements={margeDe(l)} etiquette="D'où vient cette conclusion" />}>
                <div className={v.tete}>
                  <div className={v.emblemeCol} aria-hidden>
                    <EmblemeEchelles
                      etiquette=""
                      etats={{ commune: TRACE[l.echelles.territoire], secteur: TRACE[l.echelles.autour], batiment: TRACE[l.echelles.logement] }}
                    />
                  </div>
                  <div className={v.identite}>
                    {l.commune ? <p className={s.etiquette}>{l.commune}</p> : null}
                    <h2 className={`${s.sousTitre} ${v.nom}`}>{l.titre}</h2>
                    <p className={s.nuance}>{accesEnMots(l)}</p>
                    <p className={`${s.nuance} ${v.echelles}`}>{echellesEnMots(l)}</p>
                  </div>
                </div>
                <Conclusion c={l.conclusion} />
                <div className={v.gestes}>
                  <a href={l.principal.href} className={s.bouton}>{l.principal.label}</a>
                  {l.parEchelle.length > 0 ? (
                    <span className={v.parEchelle}>
                      <span className={s.nuance}>Ou une échelle :</span>
                      {l.parEchelle.map((e) => <a key={e.href} href={e.href} className={s.lien}>{e.label}</a>)}
                    </span>
                  ) : null}
                </div>
              </Ligne>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
