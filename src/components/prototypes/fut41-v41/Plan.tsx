"use client";
// LE PLAN DES PISTES · où sont les communes envisagées les unes par rapport aux autres, et combien de
// logements chacune porte. Positions fictives mais proportionnées (km) ; distances à vol d'oiseau,
// arrondies. Il répond à « est-ce loin l'un de l'autre ? », pas à un trajet réel (que seule une
// analyse d'adresse mesure). Aucun fond de carte : rien n'est dessiné qui ne soit su.
import { GlypheGrain } from "@/components/releve/primitives";
import { logementsDe } from "./modele41";
import type { Api41 } from "./CentreDecision41";
import v from "./v41.module.css";

export function Plan({ api }: { api: Api41 }) {
  const { etat, aller } = api;
  const cs = etat.communes.filter((c) => c.statut !== "ecartee");
  if (!cs.length) return null;
  const xs = cs.map((c) => c.position.x); const ys = cs.map((c) => c.position.y);
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const L = 280, H = 170, m = 34;
  const echelle = Math.min((L - 2 * m) / Math.max(1, maxX - minX), (H - 2 * m) / Math.max(1, maxY - minY));
  const px = (x: number) => Math.round(m + (x - minX) * echelle + ((L - 2 * m) - (maxX - minX) * echelle) / 2);
  const py = (y: number) => Math.round(m + (y - minY) * echelle + ((H - 2 * m) - (maxY - minY) * echelle) / 2);
  const paires: [typeof cs[number], typeof cs[number]][] = [];
  for (let i = 0; i < cs.length; i++) for (let j = i + 1; j < cs.length; j++) paires.push([cs[i]!, cs[j]!]);
  const km = (a: typeof cs[number], b: typeof cs[number]) => Math.round(Math.hypot(a.position.x - b.position.x, a.position.y - b.position.y) / 5) * 5;
  return (
    <figure className={v.plan} aria-label="Plan schématique de vos communes">
      <figcaption className={v.planTitre}>Vos communes sur le plan</figcaption>
      {cs.length > 1 ? (
        <svg viewBox={`0 0 ${L} ${H}`} className={v.planSvg} role="img" aria-label={paires.map(([a, b]) => `${a.nom} – ${b.nom} : environ ${km(a, b)} km`).join(" ; ")}>
          {paires.map(([a, b]) => (
            <g key={a.insee + b.insee}>
              <line x1={px(a.position.x)} y1={py(a.position.y)} x2={px(b.position.x)} y2={py(b.position.y)} className={v.planLien} />
              <text x={(px(a.position.x) + px(b.position.x)) / 2} y={(py(a.position.y) + py(b.position.y)) / 2 - 5} className={v.planKm} textAnchor="middle">{km(a, b)} km</text>
            </g>
          ))}
          {cs.map((c) => (
            <g key={c.insee}>
              <circle cx={px(c.position.x)} cy={py(c.position.y)} r={c.lecture === "rapport" ? 7 : 6} className={c.lecture === "rapport" ? v.planCommune : v.planCommuneLegere} />
              <text x={px(c.position.x)} y={py(c.position.y) + 20} className={v.planNom} textAnchor="middle">{c.nom}</text>
            </g>
          ))}
        </svg>
      ) : null}
      <ul className={v.planListe}>
        {cs.map((c) => {
          const n = logementsDe(etat, c).filter((l) => l.statut !== "ecarte");
          return (
            <li key={c.insee}>
              <GlypheGrain grain="commune" taille={10} />
              <button type="button" className={v.lien} onClick={() => aller({ ecran: "commune", id: `c:${c.insee}` })}>{c.nom}</button>
              <span>{n.length ? `${n.length} logement${n.length > 1 ? "s" : ""}` : "aucun logement"}{n.some((l) => !l.adresse) ? ` dont ${n.filter((l) => !l.adresse).length} sans adresse` : ""}</span>
            </li>
          );
        })}
      </ul>
      <p className={v.planNote}>Distances à vol d&apos;oiseau, arrondies. Le trajet réel se mesure depuis une adresse analysée.</p>
    </figure>
  );
}
