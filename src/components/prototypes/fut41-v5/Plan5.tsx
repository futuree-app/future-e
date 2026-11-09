"use client";
// LA CARTE CONTEXTUELLE · où sont les communes comparées les unes par rapport aux autres. Positions
// approchées des vraies villes (km, nord en haut), distances à vol d'oiseau arrondies, une échelle.
// Aucun fond de carte : rien n'est dessiné qui ne soit su. Un logement n'a jamais de point tant que
// son adresse n'est pas connue ; à cette échelle, les logements se comptent sous leur commune.
import { GlypheGrain } from "@/components/releve/primitives";
import { logementsDe, type Commune } from "./modele5";
import type { Api5 } from "./CentreDecision5";
import v from "./v5.module.css";

export function Plan5({ api, communes }: { api: Api5; communes: Commune[] }) {
  const { etat, aller } = api;
  const cs = communes;
  if (cs.length < 2) return null;
  const xs = cs.map((c) => c.position.x); const ys = cs.map((c) => c.position.y);
  const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const L = 320, H = 190, m = 40;
  const ech = Math.min((L - 2 * m) / Math.max(1, maxX - minX), (H - 2 * m) / Math.max(1, maxY - minY));
  const px = (x: number) => Math.round(m + (x - minX) * ech + ((L - 2 * m) - (maxX - minX) * ech) / 2);
  const py = (y: number) => Math.round(m + (y - minY) * ech + ((H - 2 * m) - (maxY - minY) * ech) / 2);
  const paires: [Commune, Commune][] = [];
  for (let i = 0; i < cs.length; i++) for (let j = i + 1; j < cs.length; j++) paires.push([cs[i]!, cs[j]!]);
  const km = (a: Commune, b: Commune) => Math.round(Math.hypot(a.position.x - b.position.x, a.position.y - b.position.y) / 5) * 5;
  const barre = Math.round(50 * ech);
  return (
    <figure className={v.plan}>
      <svg viewBox={`0 0 ${L} ${H}`} className={v.planSvg} role="img" aria-label={`Carte schématique : ${paires.map(([a, b]) => `${a.nom} et ${b.nom}, environ ${km(a, b)} km à vol d'oiseau`).join(" ; ")}.`}>
        {paires.map(([a, b]) => (
          <g key={a.insee + b.insee}>
            <line x1={px(a.position.x)} y1={py(a.position.y)} x2={px(b.position.x)} y2={py(b.position.y)} className={v.planLien} />
            <text x={(px(a.position.x) + px(b.position.x)) / 2 + 6} y={(py(a.position.y) + py(b.position.y)) / 2 - 4} className={v.planKm}>{km(a, b)} km</text>
          </g>
        ))}
        {cs.map((c) => (
          <g key={c.insee}>
            <circle cx={px(c.position.x)} cy={py(c.position.y)} r={c.lecture === "rapport" ? 7 : 6} className={c.lecture === "rapport" ? v.planCommune : v.planCommuneLegere} />
            <text x={px(c.position.x)} y={py(c.position.y) + 21} className={v.planNom} textAnchor="middle">{c.nom}</text>
          </g>
        ))}
        <g aria-hidden>
          <line x1={L - 12 - barre} y1={H - 12} x2={L - 12} y2={H - 12} className={v.planEchelle} />
          <text x={L - 12 - barre / 2} y={H - 17} className={v.planKm} textAnchor="middle">50 km</text>
          <text x={14} y={20} className={v.planKm}>N ↑</text>
        </g>
      </svg>
      <figcaption>
        <ul className={v.planListe}>
          {cs.map((c) => {
            const n = logementsDe(etat, c).filter((l) => l.statut !== "ecarte");
            const sans = n.filter((l) => !l.adresse).length;
            return (
              <li key={c.insee}>
                <GlypheGrain grain="commune" taille={10} />
                <button type="button" className={v.lien} onClick={() => aller({ ecran: "commune", id: `c:${c.insee}` })}>{c.nom}</button>
                <span>{c.lecture === "rapport" ? "étudiée pour votre Projet" : "lecture gratuite"} · {n.length ? `${n.length} logement${n.length > 1 ? "s" : ""}${sans ? `, dont ${sans} sans adresse` : ""}` : "aucun logement"}</span>
              </li>
            );
          })}
        </ul>
        <p className={v.planNote}>Cercle continu : commune étudiée pour votre Projet ; en pointillé : lecture gratuite. Distances à vol d&apos;oiseau, arrondies.</p>
      </figcaption>
    </figure>
  );
}
