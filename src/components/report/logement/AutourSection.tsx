import React from "react";
import { BPE_WALK_RADIUS_M, type Face3Snapshot, type GreenKind } from "@/lib/logement-autour-types";
import { ReportSection, GlassCard } from "@/components/report/kit";
import { lireChaleurEtVegetal } from "@/lib/logement-autour-chaleur";
import { ecartAuCommune, partSansVoiture, type CarOwnership } from "@/lib/iris-logement";

// « Autour de cette adresse » (buffer local au point géocodé) — le corps du module 02 depuis le
// 29/07/2026, où il n'était jusque-là que la « Face 3 » du module Logement. Hiérarchie : vie
// quotidienne (BPE, socle) > verts (repère). L'infrastructure de transport, elle, se lit depuis le
// 01/08/2026 dans son propre bloc du module (« Les abords de l'adresse ») : ce qui manquait n'était
// pas le grain, c'était la limite qui rend la distance dicible sans la faire passer pour un niveau
// sonore. Voir `decision/autour-infrastructures.ts`.
// Distances brutes à vol d'oiseau, aucun adjectif de proximité, aucune note.
const FACE3_CAT_LABEL: Record<string, string> = {
  sante: "Santé",
  alimentation: "Alimentation quotidienne",
  education: "Éducation",
  transports: "Transports",
  services: "Services du quotidien",
};
// Nature de l'espace vert le plus proche : on nomme précisément ce que OSM a cartographié
// (parc / bois / …) plutôt qu'un « espace vert » générique. Repli générique si le tag manque
// (snapshot antérieur au greenKind).
const GREEN_LABEL: Record<GreenKind, string> = {
  park: "Parc",
  wood: "Bois",
  forest: "Forêt",
  grass: "Pelouse",
  recreation_ground: "Terrain de plein air",
};
function greenSpaceLabel(kind: GreenKind | undefined): string {
  return kind ? GREEN_LABEL[kind] : "Espace vert";
}
// Sous-titre de brique (vie quotidienne / repère) et libellé de famille (métadonnée secondaire
// au-dessus du type précis). Rendent visible la hiérarchie éditoriale.
const FACE3_SUBHEAD: React.CSSProperties = {
  fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.1em",
  textTransform: "uppercase", color: "var(--accent-dim, #7a6e60)",
};
const FACE3_FAMILY: React.CSSProperties = {
  fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.08em",
  textTransform: "uppercase", color: "var(--fg-4)",
};
/** Pourcentage en typographie française : virgule décimale, espace insécable avant le %. */
function pct(v: number, sansUnite = false): string {
  const n = Math.round(v * 10) / 10;
  const txt = (Number.isInteger(n) ? String(n) : n.toFixed(1)).replace(".", ",");
  return sansUnite ? `${txt} points` : `${txt}\u00a0%`;
}

function fmtDist(m: number): string {
  return m >= 1000 ? `${(m / 1000).toFixed(1).replace(".", ",")} km` : `${m} m`;
}
// Une ligne « type précis — env. distance ». Le type est en évidence, la distance à droite,
// alignée sur la même ligne de base que le type (chiffres tabulaires pour l'alignement).
function Face3Line({ label, meters }: { label: string; meters: number }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16 }}>
      <span style={{ fontSize: 15, color: "var(--fg-1)", fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: 15, color: "var(--fg-hi)", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>env. {fmtDist(meters)}</span>
    </div>
  );
}

// ── Équipement automobile des ménages (INSEE, recensement 2022, au secteur de l'adresse) ─────────
//
// QUATRE ÉTATS, ET AUCUN N'EST « PAS DE DONNÉE ». Un IRIS d'activité ou une commune non découpée ne
// sont pas des trous : ce sont des réponses, et les taire ferait croire à un oubli. Le chiffre nu ne
// dit rien non plus — 46 % n'est ni bas ni haut tant qu'on ne sait pas ce que fait la commune : la
// comparaison EST l'information.
//
// LE MOT « MOTORISATION » EST BANNI. On dit ce que la donnée mesure : des ménages qui DISPOSENT d'une
// voiture. Ni leur dépendance, ni leur besoin, ni la possibilité de vivre sans.
function CarOwnershipBlock({ car }: { car: CarOwnership }) {
  if (car.kind === "unknown") return null;

  const ecart = ecartAuCommune(car);
  return (
    <div style={{ paddingTop: 16, borderTop: "1px solid var(--border-1)", display: "grid", gap: 8 }}>
      <div style={FACE3_SUBHEAD}>Ménages et voiture</div>

      {car.kind === "secteur" && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16 }}>
            <span style={{ fontSize: 15, color: "var(--fg-1)", fontWeight: 500 }}>
              Ménages disposant d’au moins une voiture
            </span>
            <span style={{ fontSize: 15, color: "var(--fg-hi)", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
              {pct(car.share)}
            </span>
          </div>
          <p style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.6, margin: 0 }}>
            {ecart != null && Math.abs(ecart) >= 1
              ? `Soit ${pct(Math.abs(ecart), true)} ${ecart < 0 ? "de moins" : "de plus"} que dans l’ensemble de la commune. `
              : ecart != null
                ? "C’est le niveau de l’ensemble de la commune. "
                : ""}
            {`À l’inverse, ${pct(partSansVoiture(car.share))} des ménages de ce secteur n’en ont aucune.`}
          </p>
        </>
      )}

      {car.kind === "commune_entiere" && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16 }}>
            <span style={{ fontSize: 15, color: "var(--fg-1)", fontWeight: 500 }}>
              Ménages disposant d’au moins une voiture
            </span>
            <span style={{ fontSize: 15, color: "var(--fg-hi)", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
              {pct(car.share)}
            </span>
          </div>
          <p style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.6, margin: 0 }}>
            Cette commune n’est pas découpée en secteurs : la valeur porte sur la commune entière,
            et aucune variation locale ne peut être établie.
          </p>
        </>
      )}

      {car.kind === "secteur_non_residentiel" && (
        <p style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.6, margin: 0 }}>
          Cette adresse se situe dans un secteur principalement consacré à l’activité. Le profil
          automobile des ménages n’y est pas établissable.
          {car.communeShare != null
            ? ` Sur l’ensemble de la commune, ${pct(car.communeShare)} des ménages disposent d’au moins une voiture.`
            : ""}
        </p>
      )}

      <p style={{ ...FACE3_FAMILY, margin: 0 }}>
        Insee, recensement 2022 · estimation
      </p>
    </div>
  );
}

export function Face3Block({ s, car }: { s: Face3Snapshot; car?: CarOwnership | null }) {
  return (
    <ReportSection eyebrow="Autour de cette adresse" tone="accent">
      <GlassCard>
        <div style={{ display: "grid", gap: 22 }}>
          <p style={{ fontSize: 14, color: "var(--fg-3)", lineHeight: 1.6, margin: 0 }}>
            Les équipements et repères cartographiés les plus proches du logement.
          </p>

          {/* Brique 1 — vie quotidienne (socle) : famille en métadonnée, type précis en
              information principale, distance alignée sur la ligne de base du type. */}
          <div style={{ display: "grid", gap: 12 }}>
            <div style={FACE3_SUBHEAD}>Vie quotidienne</div>
            <div style={{ display: "grid", gap: 10 }}>
              {s.bpe.categories.map((c) => (
                <div key={c.category} style={{ display: "grid", gap: 2 }}>
                  <span style={FACE3_FAMILY}>{FACE3_CAT_LABEL[c.category]}</span>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16 }}>
                    <span style={{ fontSize: 15, color: c.nearest ? "var(--fg-1)" : "var(--fg-4)", fontWeight: 500 }}>
                      {c.nearest ? (c.nearest.typeLabel ?? FACE3_CAT_LABEL[c.category]) : "Aucun recensé"}
                    </span>
                    <span style={{ fontSize: 15, color: c.nearest ? "var(--fg-hi)" : "var(--fg-4)", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>
                      {c.nearest ? `env. ${fmtDist(c.nearest.distanceMeters)}` : `dans les ${c.searchCapMeters / 1000} km analysés`}
                    </span>
                  </div>
                  {/* LE COMPTE, SEULEMENT QUAND IL APPREND QUELQUE CHOSE. « 1 à moins de 500 m »
                      ne dit rien de plus que la ligne au-dessus, qui donne déjà la distance du
                      plus proche. À partir de deux, il dit autre chose : la différence entre
                      avoir un commerce et avoir le choix.
                      `undefined` veut dire NON COMPTÉ, jamais « aucun » : les snapshots figés
                      avant le 01/08/2026 ne portent pas ce champ, et un dossier ancien ne doit
                      pas afficher un zéro qui serait faux. */}
                  {typeof c.withinWalkCount === "number" && c.withinWalkCount > 1 && (
                    <span style={{ fontSize: 12.5, color: "var(--fg-4)" }}>
                      {c.withinWalkCount} à moins de {BPE_WALK_RADIUS_M} m
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Brique 2 bis — équipement automobile du secteur (INSEE). */}
          {car ? <CarOwnershipBlock car={car} /> : null}

          {/* Brique 2 — espace vert (repère). L'infrastructure de transport a quitté ce silence le
              01/08/2026 : elle se lit dans son propre bloc du module Autour. */}
          {/* CHALEUR DU SECTEUR ET ACCÈS AU VÉGÉTAL, LUS ENSEMBLE (03/08/2026).
              Les deux faits étaient là, dans deux blocs qui ne se parlaient pas, et le lecteur
              devait faire le rapprochement lui-même. La lecture composée REMPLACE la ligne d'espace
              vert quand l'îlot de chaleur est mesuré : l'ajouter en plus donnerait deux fois le même
              fait et ferait peser la chaleur par simple répétition. Sans îlot mesuré, la ligne
              d'origine reste, elle se lit très bien seule. Rédaction et limites : lib/logement-autour-chaleur.ts. */}
          <div style={{ paddingTop: 16, borderTop: "1px solid var(--border-1)", display: "grid", gap: 8 }}>
            {(() => {
              const lecture = s.sourceStatus.osmGreenSpaces === "complete" ? lireChaleurEtVegetal(s.icu ?? null, s.osm) : null;
              if (lecture) {
                return (
                  <>
                    <div style={FACE3_SUBHEAD}>Chaleur du secteur et accès au végétal</div>
                    <p style={{ fontSize: 15, color: "var(--fg-1)", lineHeight: 1.65, margin: 0 }}>{lecture.texte}</p>
                    <p style={{ fontSize: 13, color: "var(--fg-3)", lineHeight: 1.6, margin: 0 }}>{lecture.limite}</p>
                  </>
                );
              }
              return (
                <>
                  <div style={FACE3_SUBHEAD}>Espace vert</div>
                  {s.sourceStatus.osmGreenSpaces === "pending" ? (
                    <em style={{ color: "var(--fg-4)", fontSize: 14 }}>Environnement en cours de récupération…</em>
                  ) : s.sourceStatus.osmGreenSpaces === "failed" ? (
                    <span style={{ color: "var(--fg-4)", fontSize: 14 }}>Espaces verts : donnée momentanément indisponible.</span>
                  ) : s.osm.nearestMappedGreenSpace ? (
                    <Face3Line label={greenSpaceLabel(s.osm.nearestMappedGreenSpace.kind)} meters={s.osm.nearestMappedGreenSpace.distanceMeters} />
                  ) : (
                    <span style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.6 }}>
                      Aucun espace vert correspondant aux catégories recherchées dans l’emprise cartographiée.
                    </span>
                  )}
                </>
              );
            })()}
          </div>

          {/* L'îlot de chaleur est rendu par AutourModule, juste sous ce bloc (composant
              IcuExposure, alimenté par `snapshot.icu`). Il est SORTI de cette carte pour ne pas
              mêler ce qui rend un lieu agréable et ce qui l'expose ; il est resté hors du module
              Logement parce qu'il décrit un quartier, pas des murs. */}

          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.06em", color: "var(--fg-4)", opacity: 0.85 }}>
            Sources : INSEE, BPE 2024 · © les contributeurs OpenStreetMap (ODbL) · distances approximatives à vol d’oiseau
          </div>
        </div>
      </GlassCard>
    </ReportSection>
  );
}
