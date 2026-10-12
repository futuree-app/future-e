// FUT-50 · CE QUE LES DEUX DIRECTIONS PARTAGENT. DEV UNIQUEMENT.
//
// Les portes d'entrée (destinations RÉELLES, vérifiées pour un visiteur non connecté : `/ou-vivre` et
// `/dossier` sont publiques, sans compte), la chaîne d'un fait, la provenance du cas réel et la descente
// d'échelle. Les deux directions diffèrent par l'ordre, le cadre et la démonstration, pas par ces briques.
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import { GlypheGrain, type GrainCle } from "@/components/releve/primitives";
import { CAS_SETE } from "./cas-sete";
import f from "./fut50.module.css";

/**
 * TYPOGRAPHIE FRANÇAISE À L'AFFICHAGE. Les phrases du moteur portent des espaces ordinaires avant « : »,
 * « ? », « ; » et dans les guillemets : sur un écran étroit, le signe se retrouvait seul en début de ligne.
 * L'espace devient insécable, le texte ne change pas (cf. `bindOrphans`, OuVivreClient.tsx).
 */
export function fr(texte: string): string {
  return texte
    .replace(/ ([:;?»])/g, "\u00a0$1")
    .replace(/« /g, "«\u00a0")
    .replace(/ (\d+) (par|nuits|jours|habitants|%)/g, " $1\u00a0$2")
    .replace(/(?<=^|[\s«(\u00a0])(le|la|les|l'|de|des|du|d'|à|au|aux|et|un|une|en|ce|sa|son|ses|sur|par|pas|ni|y) /giu, "$1\u00a0");
}

export type Porte = { situation: string; action: string; href: string; grain: GrainCle; marque?: boolean };

/** Les deux situations du lecteur, et ce que le clic déclenche. Jamais un nom de produit interne. */
export const PORTE_OU_VIVRE: Omit<Porte, "marque"> = {
  situation: "Je cherche où vivre",
  action: "Décrire mon projet et voir les territoires qui y répondent",
  href: "/ou-vivre",
  grain: "commune",
};
export const PORTE_ADRESSE: Omit<Porte, "marque"> = {
  situation: "J'ai déjà une adresse en tête",
  action: "Faire examiner ce lieu, de la commune jusqu'au logement",
  href: "/dossier",
  grain: "batiment",
};

export function Portes({ portes, etiquette }: { portes: Porte[]; etiquette: string }) {
  return (
    <nav aria-label={etiquette} className={f.portes}>
      {portes.map((p) => (
        <Link key={p.href} href={p.href} className={`${f.porte} ${p.marque ? f.porteMarque : ""}`}>
          <span aria-hidden style={{ color: "var(--r-encre)" }}><GlypheGrain grain={p.grain} taille={16} /></span>
          <span style={{ display: "grid", gap: 4 }}>
            <span className={f.porteSituation}>{fr(p.situation)}</span>
            <span className={f.porteAction}>{fr(p.action)}</span>
          </span>
          <span aria-hidden className={f.porteFleche}>→</span>
        </Link>
      ))}
    </nav>
  );
}

/** La voie secondaire : la comparaison n'est plus une porte, elle arrive quand des candidats existent. */
export function VoieComparer() {
  return (
    <p className={f.voieSecondaire}>
      Vous hésitez déjà entre plusieurs communes ? <Link href="/comparateur" style={{ color: "var(--r-encre)", textDecoration: "underline", textUnderlineOffset: 4 }}>Les comparer</Link>
    </p>
  );
}

/** La signature de futur•e, en quatre rôles : ce qui est établi, ce que cela change, ce que cela ne dit pas, la suite. */
export function Chaine({ maillons }: { maillons: { role: string; texte: ReactNode; fort?: boolean }[] }) {
  return (
    <dl className={f.chaine}>
      {maillons.map((m) => (
        <div key={m.role} className={f.maillon}>
          <dt className={f.maillonRole}>{m.role}</dt>
          <dd className={`${f.maillonTexte} ${m.fort ? f.maillonFort : ""}`} style={{ margin: 0 }}>{typeof m.texte === "string" ? fr(m.texte) : m.texte}</dd>
        </div>
      ))}
    </dl>
  );
}

/** D'où vient la démonstration, dit sans détour : une commune réelle, une lecture datée, un projet d'exemple. */
export function ProvenanceSete() {
  return (
    <p className={f.provenance}>
      Exemple réel : {CAS_SETE.commune} ({CAS_SETE.insee}), lecture du moteur de futur•e relevée le {CAS_SETE.releveLe}.
      Le projet est un exemple, les phrases sont celles du dossier. Sources : DRIAS · Météo-France (projections au palier
      de réchauffement, maille communale), Géorisques, INSEE (trajets domicile-travail).
    </p>
  );
}

type Echelle = { cle: string; nom: string; grain: GrainCle; grainNom: string; question: string; exemple: ReactNode };

/**
 * LA DESCENTE D'ÉCHELLE. Trois questions d'une même décision, puis la décision elle-même. Les questions
 * viennent du cadrage FUT-50 (« un même Projet, lu à trois échelles, puis suivi jusqu'à la décision ») ;
 * les exemples Autour et Logement reprennent les contenus que l'accueil actuel annonce déjà, sans
 * résultat inventé pour Sète.
 */
export const ECHELLES_DECISION: Echelle[] = [
  {
    cle: "territoire", nom: "Territoire", grain: "commune", grainNom: "la commune",
    question: "Dans quel environnement allez-vous vivre, sur le long terme ?",
    exemple: <>À Sète : les nuits tropicales passeraient de 42 à 80 par an à l&apos;horizon 2050. Lu à la commune, donc pas encore pour un logement.</>,
  },
  {
    cle: "autour", nom: "Autour", grain: "secteur", grainNom: "le secteur",
    question: "Qu'est-ce que cette adresse change à votre quotidien ?",
    exemple: "Commerces, école, santé et gare à portée de pas, l'espace vert le plus proche, l'îlot de chaleur du quartier.",
  },
  {
    cle: "logement", nom: "Logement", grain: "batiment", grainNom: "le bâtiment",
    question: "Ce bâtiment atténue-t-il ou aggrave-t-il ce contexte ?",
    exemple: "Le diagnostic et le confort d'été, le sol de la parcelle, la zone réglementée, ce qu'il reste à demander avant de signer.",
  },
];

export function DescenteEchelles({ titre, intro, avecDecision = true, numerote = false }: { titre: string; intro: ReactNode; avecDecision?: boolean; numerote?: boolean }) {
  return (
    <section className={f.echelles} aria-labelledby="echelles-titre">
      <div className={f.demoEntete}>
        <h2 id="echelles-titre" style={{ fontVariationSettings: '"wdth" 108', fontWeight: 600, fontSize: "clamp(25px, 2.6vw, 34px)", lineHeight: 1.15, color: "var(--r-encre)", margin: 0 }}>{titre}</h2>
        <div style={{ fontSize: 17, lineHeight: 1.6, color: "var(--r-texte)" }}>{intro}</div>
      </div>
      <ol className={f.echelleListe}>
        {ECHELLES_DECISION.map((e, i) => (
          <li key={e.cle} className={f.echelle}>
            <span className={f.echelleNom}>
              <span aria-hidden><GlypheGrain grain={e.grain} taille={15} /></span>
              <span>{numerote ? `${i + 1}. ` : ""}{e.nom} <span className={f.echelleGrain}>{e.grainNom}</span></span>
            </span>
            <p className={f.echelleQuestion}>{fr(e.question)}</p>
            <p className={f.echelleExemple}>{typeof e.exemple === "string" ? fr(e.exemple) : e.exemple}</p>
          </li>
        ))}
        {avecDecision ? (
          <li className={`${f.echelle} ${f.decision}`}>
            <span className={f.echelleNom}>
              <span aria-hidden style={{ width: 15, height: 15, display: "inline-grid", placeItems: "center" }}>
                <span style={{ width: 7, height: 7, background: "var(--r-encre)", borderRadius: "50%" }} />
              </span>
              <span>{numerote ? "4. " : ""}Ma décision</span>
            </span>
            <p className={f.echelleQuestion}>Qu&apos;est-ce qui tient, qu&apos;est-ce qui coince, et qu&apos;est-ce qu&apos;il faut encore apprendre ?</p>
            <p className={f.echelleExemple}>Les trois lectures réunies autour de votre projet, avec les vérifications à faire avant de vous engager. Aucune note globale.</p>
          </li>
        ) : null}
      </ol>
    </section>
  );
}

export const teinte = (v: string): CSSProperties => ({ "--r-teinte": v } as CSSProperties);
