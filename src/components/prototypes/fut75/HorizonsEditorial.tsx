"use client";

// FUT-75 (2e itération) · B1 · HORIZONS, DIRECTION ÉDITORIALE. DEV UNIQUEMENT.
//
// Un chiffre, très grand, à la teinte de la chaleur (`--red`, « incompatibilité, chaleur », DESIGN.md
// § 5.2) : on sait ce qu'on regarde avant de lire. À côté, l'écart à 1976-2005 en toutes lettres. En
// dessous, une GRILLE D'UNITÉS : un carré vaut un jour (ou une nuit). La référence en carrés pleins
// gris, l'horizon choisi en rouge, le seuil de signalement en trait fin. On compte, on ne déduit pas.
//
// CE QUI BOUGE QUAND ON CHANGE D'HORIZON. Le chiffre BASCULE d'un bloc (flou court, fondu, léger
// recadrage) : il ne défile pas, il ne passe par aucune valeur intermédiaire. Les carrés changent
// TOUS EN MÊME TEMPS, et ceux qui ont changé reçoivent un bref liseré : l'écart se voit, sans
// compter un à un. La grille garde sa taille d'un horizon à l'autre (capacité = la plus grande des
// trois valeurs) : rien ne saute.
import { useState, type CSSProperties } from "react";
import { HORIZON } from "@/lib/horizons";
import { casesGrille, jalonsHorizons, ORDRE_HORIZONS, type CleHorizon, type ModeMouvement } from "./motion";
import { SelecteurElastique } from "./SelecteurElastique";
import type { MesureHorizon } from "./RegleDesHorizons";
import m from "./motion.module.css";

const DOSSIER: CleHorizon = "gwl20";
const r = (v: number) => Math.round(v);
const ecart = (v: number, ref: number) => { const d = r(v) - r(ref); return d === 0 ? "autant qu'en 1976-2005" : `${d > 0 ? "+" : "−"}${Math.abs(d)} par rapport à 1976-2005`; };

/** La grille : `capacite` carrés, dont `ref` de référence et `valeur` à l'horizon. */
function Grille({ valeur, precedente, reference, seuil, capacite, parLigne, nom, compte, tour }: {
  valeur: number; precedente: number | null; reference: number; seuil: number; capacite: number; parLigne: number; nom: string; compte: string;
  /** Le nombre de changements d'horizon : sa parité alterne le nom de l'animation du liseré. */
  tour: number;
}) {
  const v = r(valeur); const ref = r(reference);
  return (
    <div className={m.grille} style={{ "--par-ligne": parLigne } as CSSProperties} role="img"
      aria-label={`${nom} : ${v} ${compte} par an à cet horizon, contre ${ref} sur 1976-2005 ; seuil de signalement : ${seuil}.`}>
      {casesGrille(valeur, reference, precedente, capacite).map((c, i) => (
        // Les carrés ne sont jamais remontés (clé stable) : le liseré se rejoue en alternant deux noms
        // d'animation identiques (`a` / `b`), ce qui coûte un changement d'attribut, pas un nœud.
        <span key={i} className={m.case} data-etat={c.etat} data-change={c.change ? (tour % 2 ? "a" : "b") : undefined} data-seuil={i === seuil ? true : undefined} />
      ))}
    </div>
  );
}

export function NoteHorizons({ commune }: { commune: string }) {
  return (
    <div className={m.noteHorizons}>
      <p><strong>Un horizon est un niveau de réchauffement.</strong>{" "}Les projections sont calculées pour une France
        à +2 °C, +2,7 °C et +4 °C ; l&apos;année (2030, 2050, 2100) indique quand la trajectoire de référence
        française (TRACC) prévoit de l&apos;atteindre. Chaque horizon est une projection distincte : rien
        n&apos;est connu entre deux.</p>
      <p><strong>Le seuil de signalement</strong>{" "}est une convention de futur•e, pas une limite officielle de
        danger : au-delà, le dossier signale l&apos;exposition. Le dossier de {commune} se prononce à 2050.</p>
      <p>Médiane de 17 modèles climatiques régionaux DRIAS-TRACC, grille de 8 km, valeurs arrondies à
        l&apos;unité ; l&apos;écart entre modèles n&apos;est pas représenté ici.</p>
    </div>
  );
}

export function HorizonsEditorial({ commune, mesures, mode, initial = DOSSIER }: {
  commune: string; mesures: MesureHorizon[]; mode: ModeMouvement; initial?: CleHorizon;
}) {
  const [h, setH] = useState<CleHorizon>(initial);
  const [avant, setAvant] = useState<CleHorizon | null>(null);
  const [tour, setTour] = useState(0);
  const choisir = (k: CleHorizon) => { if (k !== h) { setAvant(h); setH(k); setTour((n) => n + 1); } };
  const [principale, secondaire] = mesures;
  // La capacité de la grille : la plus grande valeur des trois horizons, arrondie à la ligne complète.
  // Elle ne change pas d'un horizon à l'autre : la grille garde sa taille, rien ne saute.
  const lire = (ms: MesureHorizon, parLigne: number) => {
    const j = jalonsHorizons(ms.valeurs, ms.seuil);
    const v = j.find((x) => x.cle === h)!; const p = avant ? j.find((x) => x.cle === avant)! : null;
    const plus = Math.max(1, ...j.map((x) => r(x.valeur ?? 0)), r(ms.reference ?? 0), ms.seuil + 1);
    return { v, p, capacite: Math.ceil(plus / parLigne) * parLigne };
  };
  if (!principale) return null;
  const P = lire(principale, 10);

  return (
    <div className={m.editorial} data-mode={mode}>
      <SelecteurElastique etiquette="Horizon de projection" valeur={h} choisir={choisir} mode={mode} teinte="var(--red)"
        options={ORDRE_HORIZONS.map((k) => ({ cle: k, libelle: HORIZON[k].annee, sous: `${HORIZON[k].france} en France`, aria: `${HORIZON[k].annee}, ${HORIZON[k].france} en France` }))} />

      <div className={m.heros}>
        <div className={m.herosChiffre} aria-live="polite">
          <span key={`c-${h}`} className={`${m.chiffreGeant} ${m.bascule}`}>{P.v.valeur == null ? "n.d." : r(P.v.valeur)}</span>
        </div>
        <div className={m.herosTexte}>
          <p className={m.herosUnite}>{principale.compte} par an au-dessus de 35&nbsp;°C</p>
          <p key={`l-${h}`} className={`${m.herosContexte} ${m.bascule}`}>
            à {commune}, horizon {HORIZON[h].annee} <span className={m.chaleur}>({HORIZON[h].france} en France)</span>
          </p>
          {principale.reference != null && P.v.valeur != null ? (
            <p key={`e-${h}`} className={`${m.herosEcart} ${m.bascule}`}>
              <strong>{ecart(P.v.valeur, principale.reference)}</strong> <span>({r(principale.reference)} {principale.compte} par an)</span>
            </p>
          ) : null}
          {h === DOSSIER ? <p className={m.herosDossier}>L&apos;horizon où le dossier se prononce</p> : null}
        </div>
      </div>

      {principale.reference != null && P.v.valeur != null ? (
        <figure className={m.figureGrille}>
          <Grille valeur={P.v.valeur} precedente={P.p?.valeur ?? null} reference={principale.reference} seuil={principale.seuil}
            capacite={P.capacite} parLigne={10} nom={principale.nom} compte={principale.compte} tour={tour} />
          <figcaption className={m.legendeGrille}>
            <span><i data-etat="reference" className={m.case} /> 1976-2005</span>
            <span><i data-etat="horizon" className={m.case} /> en plus, horizon {HORIZON[h].annee}</span>
            <span><i className={m.legendeSeuil} /> seuil de signalement futur•e : {principale.seuil}</span>
            <span className={m.legendeUnite}>un carré = un {principale.compte === "nuits" ? "nuit" : "jour"} par an</span>
          </figcaption>
        </figure>
      ) : null}

      {secondaire ? (() => {
        const S = lire(secondaire, 20);
        return S.v.valeur != null && secondaire.reference != null ? (
          <div className={m.secondaire}>
            <div className={m.secondaireTete}>
              <span key={`s-${h}`} className={`${m.chiffreMoyen} ${m.bascule}`}>{r(S.v.valeur)}</span>
              <span className={m.secondaireTexte}>
                <span className={m.herosUnite}>nuits tropicales par an</span>
                <span key={`se-${h}`} className={m.bascule}>{ecart(S.v.valeur, secondaire.reference)} ({r(secondaire.reference)})</span>
              </span>
            </div>
            <Grille valeur={S.v.valeur} precedente={S.p?.valeur ?? null} reference={secondaire.reference} seuil={secondaire.seuil}
              capacite={S.capacite} parLigne={20} nom={secondaire.nom} compte={secondaire.compte} tour={tour} />
          </div>
        ) : null;
      })() : null}

      <NoteHorizons commune={commune} />
    </div>
  );
}
