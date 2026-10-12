"use client";

// FUT-75 (2e itération) · B2 · HORIZONS, DIRECTION INSTRUMENT. DEV UNIQUEMENT.
//
// Une règle du temps linéaire (2100 est loin, et la règle le montre) où chaque horizon est une
// BARRE ISOLÉE posée à son année, et la référence 1976-2005 une bande large (une moyenne sur trente
// ans, pas un point). Rien ne relie deux barres. L'horizon choisi est rouge, les autres restent
// lisibles en gris avec leur valeur.
//
// L'INSTRUMENT. Une COTE d'architecte mesure, sur la barre choisie, l'écart à la référence (« +11 »).
// Le sélecteur élastique, sous le graphique, est relié à chaque barre par une ligne de rappel : la
// ligne de l'horizon choisi passe au rouge. Changer d'horizon déplace l'indicateur du sélecteur (micro-
// ressort, c'est une commande) ; sur le graphique, rien ne grandit ni ne glisse : la teinte passe d'une
// barre à l'autre et la cote réapparaît à sa nouvelle place par une bascule.
import { useState } from "react";
import { HORIZON } from "@/lib/horizons";
import { jalonsHorizons, ORDRE_HORIZONS, type CleHorizon, type ModeMouvement } from "./motion";
import { SelecteurElastique } from "./SelecteurElastique";
import { useLargeur, type MesureHorizon } from "./RegleDesHorizons";
import { NoteHorizons } from "./HorizonsEditorial";
import m from "./motion.module.css";

const ANNEE: Record<CleHorizon, number> = { gwl15: 2030, gwl20: 2050, gwl30: 2100 };
const DOSSIER: CleHorizon = "gwl20";
const r = (v: number) => Math.round(v);

export function HorizonsInstrument({ commune, mesures, mode, initial = DOSSIER }: {
  commune: string; mesures: MesureHorizon[]; mode: ModeMouvement; initial?: CleHorizon;
}) {
  const [h, setH] = useState<CleHorizon>(initial);
  const [cle, setCle] = useState(mesures[0]?.cle ?? "");
  const [cadre, largeur] = useLargeur<HTMLDivElement>();
  const ms = mesures.find((x) => x.cle === cle) ?? mesures[0];
  if (!ms) return null;
  const jalons = jalonsHorizons(ms.valeurs, ms.seuil);
  const v = jalons.find((x) => x.cle === h)!;
  const ref = ms.reference;
  const etroit = largeur < 520;

  // Le graphique, en pixels réels : les textes gardent leur taille à toute largeur.
  const H = etroit ? 230 : 280;
  const BAS = H - 58; // l'axe ; dessous, les lignes de rappel vers le sélecteur
  const G = 6; const D = etroit ? 46 : 112;
  const x = (a: number) => G + ((a - 1970) / (2106 - 1970)) * (largeur - G - D);
  const max = Math.max(ms.seuil, ref ?? 0, ...jalons.map((j) => j.valeur ?? 0)) * 1.15 || 1;
  const y = (val: number) => BAS - (val / max) * (BAS - 30);
  const LB = etroit ? 22 : 34; // largeur d'une barre
  const centreOption = (i: number) => ((i + 0.5) / ORDRE_HORIZONS.length) * largeur;

  return (
    <div className={m.instrument} data-mode={mode}>
      <div className={m.instrumentTete}>
        <SelecteurElastique etiquette="Mesure" valeur={cle} choisir={setCle} mode={mode} taille="compact"
          options={mesures.map((x) => ({ cle: x.cle, libelle: x.cle === "joursTresChauds" ? "Jours au-dessus de 35 °C" : "Nuits tropicales" }))} />
      </div>

      <div className={m.lectureInstrument} aria-live="polite">
        <span key={`v-${h}-${cle}`} className={`${m.chiffreInstrument} ${m.bascule}`}>{v.valeur == null ? "n.d." : r(v.valeur)}</span>
        <div className={m.lectureInstrumentTexte}>
          <p className={m.herosUnite}>{ms.compte} par an{ms.cle === "joursTresChauds" ? " au-dessus de 35 °C" : " au-dessus de 20 °C la nuit"}</p>
          <p key={`c-${h}-${cle}`} className={`${m.herosContexte} ${m.bascule}`}>
            horizon {HORIZON[h].annee}, <span className={m.chaleur}>{HORIZON[h].france} en France</span>
            {ref != null && v.valeur != null ? <> · <strong className={m.ecartFort}>{r(v.valeur) - r(ref) >= 0 ? "+" : "−"}{Math.abs(r(v.valeur) - r(ref))}</strong> par rapport à 1976-2005 ({r(ref)})</> : null}
          </p>
          <p className={m.herosDossier}>{v.auDessus == null ? "valeur indisponible" : v.auDessus ? `au-dessus du seuil de signalement futur•e (${ms.seuil})` : `sous le seuil de signalement futur•e (${ms.seuil})`}{h === DOSSIER ? " · l'horizon où le dossier se prononce" : ""}</p>
        </div>
      </div>

      <div ref={cadre} className={m.instrumentGraphique}>
        <svg width={largeur} height={H} viewBox={`0 0 ${largeur} ${H}`} role="img"
          aria-label={`${ms.nom}, ${commune} : 1976-2005, ${ref == null ? "n.d." : r(ref)} ; ${jalons.map((j) => `${HORIZON[j.cle].annee}, ${j.valeur == null ? "n.d." : r(j.valeur)}`).join(" ; ")}. Seuil de signalement : ${ms.seuil}.`}>
          {[1980, 2000, 2020, 2040, 2060, 2080, 2100].map((a) => (
            <g key={a}>
              <line className={m.axe} x1={x(a)} x2={x(a)} y1={BAS} y2={BAS + 5} />
              {!etroit || a % 40 === 20 || a === 2100 ? <text className={m.etiquetteSvg} x={x(a)} y={BAS + 17} textAnchor="middle">{a}</text> : null}
            </g>
          ))}
          <line className={m.axe} x1={G} x2={largeur - D} y1={BAS} y2={BAS} />
          <line className={m.axe} x1={x(2026)} x2={x(2026)} y1={14} y2={BAS} strokeDasharray="2 4" />
          <text className={m.etiquetteSvg} x={x(2026) + 5} y={22}>aujourd&apos;hui</text>
          {ref != null ? (
            <g>
              <rect x={x(1976)} width={x(2005) - x(1976)} y={y(ref)} height={BAS - y(ref)} className={m.barreReference} />
              <text className={m.valeurBarre} x={(x(1976) + x(2005)) / 2} y={y(ref) - 7} textAnchor="middle">{r(ref)}</text>
            </g>
          ) : null}
          <line className={m.seuilInstrument} x1={G} x2={largeur - D} y1={y(ms.seuil)} y2={y(ms.seuil)} />
          <text className={m.etiquetteSvg} x={largeur - D + 6} y={y(ms.seuil) + 4}>{etroit ? `seuil ${ms.seuil}` : `seuil futur•e ${ms.seuil}`}</text>
          {jalons.map((j, i) => {
            const c = j.cle === h;
            const cx = x(ANNEE[j.cle]);
            return (
              <g key={j.cle}>
                {/* La ligne de rappel, de la barre à son bouton : l'instrument se lit d'un trait. */}
                <path className={m.rappel} data-choisi={c} d={`M${cx} ${BAS + 22} L${cx} ${BAS + 30} L${centreOption(i)} ${H - 2}`} />
                {j.valeur == null ? <text className={m.etiquetteSvg} x={cx} y={BAS - 6} textAnchor="middle">n.d.</text> : (
                  <>
                    <rect className={m.barreHorizon} data-choisi={c} x={cx - LB / 2} width={LB} y={y(j.valeur)} height={BAS - y(j.valeur)} />
                    <text className={m.valeurBarre} data-choisi={c} x={cx} y={y(j.valeur) - 8} textAnchor="middle">{r(j.valeur)}</text>
                  </>
                )}
              </g>
            );
          })}
          {/* LA COTE : de la référence à la valeur choisie, sur le flanc de la barre. Elle bascule, elle ne s'étire pas. */}
          {ref != null && v.valeur != null && r(v.valeur) !== r(ref) ? (() => {
            const cx = x(ANNEE[h]) + LB / 2 + 10; const y1 = y(ref); const y2 = y(v.valeur);
            const d = r(v.valeur) - r(ref);
            return (
              <g key={`cote-${h}-${cle}`} className={m.bascule}>
                <line className={m.cote} x1={cx} x2={cx} y1={y1} y2={y2} />
                <line className={m.cote} x1={cx - 4} x2={cx + 4} y1={y1} y2={y1} />
                <line className={m.cote} x1={cx - 4} x2={cx + 4} y1={y2} y2={y2} />
                <line className={m.coteRappel} x1={x(2005)} x2={cx} y1={y1} y2={y1} />
                <text className={m.coteTexte} x={cx + 7} y={(y1 + y2) / 2 + 4}>{d > 0 ? "+" : "−"}{Math.abs(d)}</text>
              </g>
            );
          })() : null}
        </svg>
        <div className={m.instrumentSelecteur}>
          <SelecteurElastique etiquette="Horizon de projection" valeur={h} choisir={setH} mode={mode} teinte="var(--red)"
            options={ORDRE_HORIZONS.map((k) => ({ cle: k, libelle: HORIZON[k].annee, sous: `${HORIZON[k].france} en France`, aria: `${HORIZON[k].annee}, ${HORIZON[k].france} en France` }))} />
        </div>
      </div>

      <NoteHorizons commune={commune} />
    </div>
  );
}
