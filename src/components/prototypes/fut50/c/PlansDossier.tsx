// FUT-50 · LE STORYBOARD DU MINI-FILM « DOSSIER ADRESSE ». DEV UNIQUEMENT.
//
// AUCUNE DONNÉE ICI. Chaque cadre est un repère de conception : des formes à la place des valeurs, les
// glyphes et les intitulés réels du dossier (« Ce qui correspond à votre projet », « Ce qui correspond moins
// bien », « À contrôler »), et la mention « maquette ». Le film définitif sera tourné sur le dossier exemple
// réel, anonymisé et versionné de FUT-56 (décision du 14/10/2026) ; FUT-14 réutilisera la même fixture.
//
// `PLANS` décrit chaque plan : durée, ce que le spectateur comprend, transition (grammaire FUT-75), et les
// champs exacts à lire dans la fixture FUT-56. C'est le contrat du futur film.
import type { CSSProperties, ReactNode } from "react";
import { GlypheGrain, EmblemeEchelles, TEINTE_REGISTRE } from "@/components/releve/primitives";
import c from "./c.module.css";

export type Plan = {
  id: string;
  debut: number;
  fin: number;
  titre: string;
  /** Ce que le spectateur doit comprendre, en une phrase : c'est aussi le sous-titre et le texte alternatif. */
  message: string;
  transition: string;
  /** Les champs à lire dans le dossier exemple FUT-56. Jamais une valeur écrite pour le film. */
  donnees: string[];
};

export const PLANS: Plan[] = [
  {
    id: "adresse", debut: 0, fin: 4,
    titre: "Une adresse, un projet",
    message: "Le dossier porte sur une adresse précise et sur les priorités d'un projet.",
    transition: "Arrivée sans déplacement (fondu, flou de 2 px, 180 ms) ; les priorités se posent une à une, 40 ms d'écart.",
    donnees: ["commune de démonstration (adresse précise masquée)", "2 à 4 priorités du Projet, avec leur libellé lecteur", "relation au lieu et objectif (FUT-10), si renseignés"],
  },
  {
    id: "echelles", debut: 4, fin: 9,
    titre: "Trois échelles",
    message: "futur•e lit la commune, puis le voisinage de l'adresse, puis le logement.",
    transition: "L'emblème se resserre du cercle au carré puis au losange (changement d'échelle, 240 ms par palier) ; un fait par échelle arrive à côté de son glyphe.",
    donnees: ["1 fait Territoire avec source et horizon", "1 fait Autour (distance mesurée depuis l'adresse)", "1 fait Logement (diagnostic ou risque du bâti), avec sa date", "les grains réels de chaque preuve (EvidenceRef.grain)"],
  },
  {
    id: "lecture", debut: 9, fin: 16,
    titre: "Des faits à une lecture",
    message: "Les faits se rangent face au projet : ce qui correspond, ce qui correspond moins bien, l'arbitrage.",
    transition: "Les trois faits glissent vers leur section (repère qui bouge, donnée qui reste) ; le verdict n'apparaît qu'ensuite, sans effet de révélation magique.",
    donnees: ["les sections réelles du dossier et leur ordre", "le libellé de verdict et sa phrase titre (narrativePlan.verdict)", "au moins un compromis ou un écart, avec sa limite"],
  },
  {
    id: "verifier", debut: 16, fin: 20,
    titre: "Ce qu'il reste à vérifier",
    message: "Le dossier se termine par les vérifications à faire avant de signer.",
    transition: "Les gestes s'inscrivent ligne à ligne (coche tracée en 260 ms à la fin).",
    donnees: ["1 ou 2 gestes prioritaires (DecisionAction.label)", "1 limite ou inconnue visible"],
  },
  {
    id: "fin", debut: 20, fin: 22,
    titre: "Le dossier d'adresse",
    message: "Un dossier d'adresse : 39 €, ou 25 € après un dossier de territoire.",
    transition: "Plan fixe ; le film s'arrête sur ce cadre, avec « Revoir ».",
    donnees: ["prix en vigueur (DOSSIER_PRICE)", "lien vers l'exemple complet quand FUT-56 et FUT-14 seront livrés"],
  },
];

export const DUREE_FILM = PLANS[PLANS.length - 1]!.fin;

// ── Les cadres ─────────────────────────────────────────────────────────────────────────────────

function Barre({ l, h = 10, fort = false }: { l: string; h?: number; fort?: boolean }) {
  return <span aria-hidden style={{ display: "block", width: l, height: h, borderRadius: 2, background: fort ? "var(--r-filet-fort)" : "var(--r-filet)" }} />;
}

function Ligne({ grain, teinte, largeur }: { grain?: "commune" | "secteur" | "batiment"; teinte?: string; largeur: string }) {
  return (
    <span style={{ display: "grid", gridTemplateColumns: "16px minmax(0, 1fr)", gap: 10, alignItems: "center" }}>
      <span style={{ color: teinte ?? "var(--r-discret)" }}>{grain ? <GlypheGrain grain={grain} taille={12} /> : <span style={{ display: "block", width: 3, height: 12, background: teinte }} />}</span>
      <span style={{ display: "grid", gap: 6 }}><Barre l={largeur} fort /><Barre l="55%" h={7} /></span>
    </span>
  );
}

const CADRES: Record<string, () => ReactNode> = {
  adresse: () => (
    <div className={c.cadreCorps}>
      <span style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--r-encre)" }}><GlypheGrain grain="batiment" taille={14} /><Barre l="58%" h={12} fort /></span>
      <span className={c.cadreLegende}>commune de démonstration · adresse masquée</span>
      <span style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
        {["44%", "36%", "40%"].map((l) => <span key={l} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 10px", borderRadius: 999, border: "1px solid var(--r-filet-fort)", width: l }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--r-encre)" }} /><Barre l="70%" h={7} /></span>)}
      </span>
      <span className={c.cadreLegende}>priorités du projet</span>
    </div>
  ),
  echelles: () => (
    <div className={c.cadreCorps} style={{ gridTemplateColumns: "minmax(0, 0.8fr) minmax(0, 1fr)", alignItems: "center" }}>
      <div style={{ maxWidth: 170 }}><EmblemeEchelles etiquette="Les trois échelles" /></div>
      <div style={{ display: "grid", gap: 14 }}>
        <Ligne grain="commune" largeur="80%" />
        <Ligne grain="secteur" largeur="68%" />
        <Ligne grain="batiment" largeur="74%" />
      </div>
    </div>
  ),
  lecture: () => (
    <div className={c.cadreCorps}>
      {([["Ce qui correspond à votre projet", TEINTE_REGISTRE.alignments], ["Ce qui correspond moins bien", TEINTE_REGISTRE.mismatches], ["À contrôler", TEINTE_REGISTRE.verifications]] as const).map(([t, teinte]) => (
        <div key={t} style={{ display: "grid", gap: 8 }}>
          <span className={c.cadreSection} style={{ "--r-teinte": teinte } as CSSProperties}>{t}</span>
          <Ligne teinte={teinte} largeur="72%" />
        </div>
      ))}
      <span className={c.cadreVerdict}><Barre l="40%" h={9} fort /><Barre l="86%" h={14} fort /></span>
    </div>
  ),
  verifier: () => (
    <div className={c.cadreCorps}>
      <span className={c.cadreSection}>Avant de signer</span>
      {["78%", "64%"].map((l) => (
        <span key={l} style={{ display: "grid", gridTemplateColumns: "18px minmax(0, 1fr)", gap: 10, alignItems: "center" }}>
          <svg width="16" height="16" viewBox="0 0 20 20" aria-hidden><path d="M4 10.5 L8.2 14.5 L16 6" fill="none" stroke="var(--reg-alignement)" strokeWidth="2" strokeLinecap="round" /></svg>
          <Barre l={l} h={10} fort />
        </span>
      ))}
      <span className={c.cadreLegende}>une limite ou une inconnue reste visible</span>
    </div>
  ),
  fin: () => (
    <div className={c.cadreCorps} style={{ alignContent: "center", justifyItems: "start" }}>
      <span style={{ fontWeight: 600, fontSize: 20, color: "var(--r-encre)" }}>Dossier d&apos;adresse</span>
      <span style={{ fontVariationSettings: '"wdth" 120', fontSize: 34, color: "var(--r-encre)" }}>39 €</span>
      <span className={c.cadreLegende}>ou 25 € après un dossier de territoire</span>
    </div>
  ),
};

/** Un cadre du storyboard, marqué comme maquette. */
export function Cadre({ plan, numero, avecTexte = true }: { plan: Plan; numero: number; avecTexte?: boolean }) {
  return (
    <figure className={c.cadre} aria-label={`Plan ${numero} · ${plan.titre} (maquette, sans données)`}>
      <div className={c.cadreEcran}>
        <span className={c.cadreMaquette}>maquette · sans données</span>
        {CADRES[plan.id]!()}
      </div>
      {avecTexte ? (
        <figcaption className={c.cadreTexte}>
          <span className={c.cadreTemps}>{plan.debut}–{plan.fin} s · plan {numero}</span>
          <strong>{plan.titre}</strong>
          <span>{plan.message}</span>
        </figcaption>
      ) : null}
    </figure>
  );
}
