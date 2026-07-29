"use client";

import { useEffect, useRef, useState } from "react";
import { usePostHog } from "posthog-js/react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import type { SynthesisData } from "@/lib/logement-synthesis-cache";
import type { LogementReport as ApiResponse } from "@/lib/logement-report-types";
import type { AddressDossierRow, DpeSelectionStatus } from "@/lib/address-dossier-store";
import { ReportSection, GlassCard } from "@/components/report/kit";
import { ThermalComfortSection } from "@/components/report/ThermalComfortSection";
import { LogementSynthesis } from "@/components/report/LogementSynthesis";
import { deriveThermalEvidence } from "@/lib/thermal-evidence";
import { dpeAttributionStatus, type DpeRecord } from "@/lib/dpe-attribution";
// Faces extraites (board étape 4 : une face = un fichier ; gabarit ThermalComfortSection).
import { Block, FamilyHeading } from "@/components/report/logement/kit";
import { IconSeismic, IconStrata, IconCavity, IconLandslide } from "@/components/report/logement/icons";
import { PropertyPassport } from "@/components/report/logement/PropertyPassport";
import { ProjectProbe } from "@/components/report/logement/ProjectProbe";
import { EnergieSection } from "@/components/report/logement/EnergieSection";
import { SinistraliteBlock } from "@/components/report/logement/SinistraliteSection";
import { RegulatoryStatusBlock } from "@/components/report/logement/RegulatorySection";
import { DecisionChecklist } from "@/components/report/logement/DecisionChecklist";
import { PreciseLogementStep } from "@/components/report/logement/PreciseLogementStep";
import { energyState, type ChecklistFacts } from "@/lib/logement-checklist";
import { evidenceAnchorId } from "@/lib/decision/evidence-targets";

// Le contrat de réponse (ApiResponse) vit dans @/lib/logement-report-types (LogementReport),
// partagé avec la route qui le produit. Importé en alias ci-dessus.

// Jeton d'adresse non réversible pour l'analytics : distingue deux adresses sans stocker l'adresse
// (djb2 -> base36). Sert à compter les adresses DISTINCTES analysées par commune, sans PII.
function addressToken(banId: string): string {
  let h = 5381;
  for (let i = 0; i < banId.length; i++) h = ((h << 5) + h + banId.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

// Statut DPE persisté (colonne) -> état runtime du module. Restauré tel quel à la rehydratation
// (on ne re-dérive JAMAIS l'attribution : le choix figé de l'utilisateur fait autorité).
const RUNTIME_DPE_STATUS: Record<DpeSelectionStatus, "auto_confirmed" | "confirmed" | "rejected" | "not_found" | "selection_required"> = {
  auto_confirmed: "auto_confirmed",
  user_confirmed: "confirmed",
  not_in_list: "rejected",
  not_found: "not_found",
  pending: "selection_required",
};

// Harmonise le NIVEAU sismique (source « 1 - TRES FAIBLE », tout capitale) avec le style du RGA
// (« Exposition moyenne ») : on rétablit la casse de phrase et les accents via le code de zone (1-5).
const SEISMIC_LEVEL: Record<string, string> = { "1": "Très faible", "2": "Faible", "3": "Modérée", "4": "Moyenne", "5": "Forte" };
function seismicValue(label: string, code: string | null | undefined): string {
  if (code && SEISMIC_LEVEL[code]) return SEISMIC_LEVEL[code];
  const lvl = label.replace(/^\s*\d+\s*[-–]\s*/, "").trim().toLowerCase();
  return lvl ? lvl.charAt(0).toUpperCase() + lvl.slice(1) : label;
}

// CE MODULE S'ARRÊTE AUX MURS (bascule 6 -> 3 modules, 29/07/2026). L'entourage de l'adresse — les
// équipements du quotidien, l'espace vert le plus proche, l'équipement automobile du secteur,
// l'îlot de chaleur du quartier — était le « beat 4 » de cette page et son snapshot conditionnait
// même la synthèse. Il vit désormais dans son propre module (/rapport/autour), à l'échelle qui est
// la sienne : le secteur. Ce qui a disparu d'ici : l'état `autour`, le gate `autourPhase` qui
// retardait la synthèse, l'appel à /api/logement-autour, et le bloc îlot de chaleur.
// L'adresse ne se SAISIT plus ici : elle est fixée à la création du dossier, sur une ligne que
// seul le serveur écrit. `georisques-logement` refuse d'ailleurs toute adresse qui n'est pas celle
// du dossier, donc une saisie libre ne mènerait qu'à un refus. Analyser un autre bien, y compris
// dans le même immeuble, passe par un autre dossier.
export default function LogementModule({
  defaultCommune,
  dossier,
  rehydrateSource = "auto",
}: {
  defaultCommune?: string | null;
  dossier: AddressDossierRow | null;
  rehydrateSource?: "auto" | "deeplink";
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [projet, setProjet] = useState<string | null>(null);
  // Attribution du DPE au logement (cf. spec §2). Aucun DPE affiché comme « le vôtre » tant
  // qu'il n'est pas confirmé (auto ou par l'utilisateur).
  const [dpeStatus, setDpeStatus] = useState<
    "loading" | "not_found" | "selection_required" | "auto_confirmed" | "confirmed" | "rejected" | "error"
  >("loading");
  const [selectedDpe, setSelectedDpe] = useState<DpeRecord | null>(null);
  const [dpeCandidates, setDpeCandidates] = useState<DpeRecord[]>([]);
  // `logement_same_commune_multi` VIVAIT ICI, et il a été retiré. Il comptait les adresses
  // distinctes via un useRef (donc par SESSION) et une Map par INSEE (donc par COMMUNE) : il
  // ratait exactement les deux façons dont un projet réel compare des adresses, le multi-session
  // et le multi-commune. Sa mesure sera reprise à l'échelle du PARCOURS DE DÉCISION, avec la
  // qualification, qui est la seule surface capable de la produire avant tout paiement.
  // Rehydratation au montage : ne s'exécute qu'une fois (sinon boucle sur re-render).
  const rehydratedRef = useRef(false);
  const posthog = usePostHog();

  // CHEMIN UNIQUE : on charge le bien du dossier. Le re-fetch Géorisques est systématique (le
  // risque doit rester frais, jamais figé) ; le DPE déjà attribué est RESTAURÉ depuis la ligne,
  // jamais re-dérivé. La cohérence de la synthèse est tenue par le cache serveur à hash de faits.
  //
  // Il y avait deux chemins ici, `analyzeSelected` (saisie libre) et `rehydrateFromRow`. Le premier
  // n'a plus d'objet : l'adresse est celle du dossier, et le serveur refuse toute autre.
  async function loadDossier(row: AddressDossierRow) {
    // Sans city/postcode, l'adresse ne passe pas `validateSelectedBanAddress` : rien à charger.
    if (!row.city || !row.postcode) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/georisques-logement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dossierId: row.id,
          address: {
            banId: row.ban_id, label: row.address_label, postcode: row.postcode, city: row.city,
            citycode: row.insee, latitude: row.latitude, longitude: row.longitude, type: null,
          },
        }),
      });
      const payload = (await res.json()) as ApiResponse & { code?: string };
      if (!res.ok) throw new Error(payload.error ?? `Erreur ${res.status}`);

      setResult(payload);
      setProjet(null);
      const candidates = payload.dpeCandidates ?? [];
      setDpeCandidates(candidates);

      // Un dossier dont le diagnostic est déjà attribué le RESTAURE. Un dossier neuf (statut
      // `pending`) dérive l'attribution pour la première fois, ce qui est le seul moment où elle
      // se calcule.
      if (row.dpe_selection_status !== "pending") {
        setSelectedDpe(row.selected_dpe_snapshot);
        setDpeStatus(RUNTIME_DPE_STATUS[row.dpe_selection_status] ?? "not_found");
      } else {
        const attribution = dpeAttributionStatus(candidates, payload.banFeatureType ?? null);
        if (attribution.status === "not_found") {
          setDpeStatus("not_found");
        } else if (attribution.status === "auto_confirmed") {
          setSelectedDpe(attribution.dpe);
          setDpeStatus("auto_confirmed");
          void persistDpe("auto_confirmed", attribution.dpe);
        } else {
          setDpeStatus("selection_required");
        }
      }

      // Signal implicite acheteur/résident : l'adresse du dossier est-elle la commune déclarée ?
      const relation =
        defaultCommune && payload.address?.city
          ? payload.address.city.toLowerCase() === defaultCommune.toLowerCase()
            ? "residence"
            : "prospection"
          : "inconnue";
      posthog?.capture("logement_opened", {
        relation_inferee: relation,
        in_declared_commune: relation === "residence",
        dpe_selection_status: row.dpe_selection_status,
        insee: row.insee,
        source: rehydrateSource,
        address_token: addressToken(row.ban_id),
      });
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  }

  // Au montage : le dossier ouvert. Une seule fois (sinon boucle sur re-render).
  useEffect(() => {
    if (rehydratedRef.current || !dossier) return;
    rehydratedRef.current = true;
    const row = dossier;
    void Promise.resolve().then(() => loadDossier(row));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persiste le choix DPE dans le dossier (échec silencieux à l'UI ; cohérence rétablie au
  // prochain chargement). Le serveur vérifie que le diagnostic appartient bien à cette adresse.
  async function persistDpe(
    status: "auto_confirmed" | "user_confirmed" | "not_in_list",
    dpe: DpeRecord | null,
  ) {
    if (!dossier) return;
    try {
      await fetch("/api/logement-dpe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dossierId: dossier.id, status, dpe }),
      });
    } catch { /* échec silencieux */ }
  }

  // Le DPE « du logement » = uniquement le choix attribué (jamais un candidat non confirmé).
  const dpe = (dpeStatus === "auto_confirmed" || dpeStatus === "confirmed") ? selectedDpe : null;
  // Lecture thermique (Face 1) : dérivée du DPE attribué uniquement (sinon C_NO_DATA).
  const thermalEvidence = deriveThermalEvidence(dpe);
  const communeName = result?.address?.city ?? defaultCommune ?? "cette commune";
  const dpeYear = dpe?.date_dpe ? dpe.date_dpe.slice(0, 4) : null;
  // Synthèse artefact : prête quand l'analyse est là ET le DPE dans un état terminal
  // (auto_confirmed / confirmed / not_found). On attend tant que l'utilisateur choisit.
  const dpeTerminal = dpeStatus === "auto_confirmed" || dpeStatus === "confirmed" || dpeStatus === "not_found";
  // Le gate « attendre que l'autour soit terminal » (board critique 2a) A DISPARU avec l'autour :
  // il existait parce qu'une synthèse générée trop tôt se figeait sans la section entourage. Ce
  // fait n'entrant plus dans le payload, la synthèse ne dépend plus que de l'analyse et du DPE.
  const synthesisReady = Boolean(result) && dpeTerminal;
  const synthesisData: SynthesisData = {
    address: result?.address,
    altitude: result?.altitude,
    dpeSelectionStatus: dpeStatus === "confirmed" ? "user_confirmed" : dpeStatus,
    selectedDpe: dpe,
    georisques: result?.georisques,
    sinistralite: result?.sinistralite,
    communeData: result?.communeData,
  };
  const georisques = result?.georisques?.parcel ?? result?.georisques?.address;
  // Les risques du bâti au grain point (cavités, mouvements de terrain) et le résidu communal sont
  // désormais structurés côté serveur (`pointHazards`), plus l'ancienne ligne « autres risques »
  // aplatie ici. Les libellés PPRN sont portés par « Statut réglementaire à cette adresse ».
  const pointHazards = result?.pointHazards ?? null;
  // Faits normalisés pour la checklist « À vérifier » (beat 5). expositionBati gate sur une
  // exposition RGA notable (moyen/fort) pour ne pas se déclencher partout.
  const sini = result?.sinistralite ?? null;
  const checklistFacts: ChecklistFacts = {
    dpe: energyState(dpe?.etiquette_dpe ?? null),
    confortEteInsuffisant: thermalEvidence.indicator === "insuffisant",
    expositionBati: Boolean(georisques?.rga?.label && /moyen|fort|élev/i.test(georisques.rga.label)),
    zoneReglementee: (georisques?.regulatoryPlans?.length ?? 0) > 0,
    sinistraliteActive:
      sini != null &&
      [sini.secheresse.kind, sini.inondation.kind].some((k) => k === "lecture" || k === "faible_repr"),
    caviteProche: (pointHazards?.cavites?.count ?? 0) > 0,
    perimetrePatrimonial: (result?.heritage?.items?.length ?? 0) > 0,
  };

  return (
    <div className="min-h-screen bg-canvas text-label relative overflow-hidden" style={{ fontFamily: "'Instrument Sans', sans-serif" }}>
      <div className="fixed top-[-160px] left-[-130px] w-[520px] h-[520px] rounded-full bg-accent/[0.10] blur-[100px] opacity-32 pointer-events-none z-0" />
      <div className="fixed bottom-[-100px] right-[-80px] w-[400px] h-[400px] rounded-full bg-orange/[0.08] blur-[88px] opacity-24 pointer-events-none z-0" />

      <Navbar ctas={{ secondary: { href: "/rapport", label: "Mon rapport" }, primary: { href: "/dashboard", label: "Dashboard" } }} />

      <div className="relative z-[2] max-w-[1100px] mx-auto px-7 pb-24">
        <section className="py-20">
          <div className="max-w-[720px]">
            <div className="flex items-center gap-2.5 font-mono text-[11px] tracking-[0.12em] uppercase text-accent mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
              Module 02 · Logement
            </div>
            <h1 className="font-normal text-[clamp(36px,4vw,54px)] leading-[1.08] tracking-[-1.2px] mb-6 text-label" style={{ fontFamily: "'Instrument Serif', serif" }}>
              Ce logement, lu à son adresse.<br />
              <span className="italic text-accent">Énergie, risques, entourage.</span>
            </h1>
            <p className="text-[17px] leading-[1.72] text-muted mb-9 max-w-[560px]">
              Une adresse suffit. Vous lisez ce qui pèse vraiment sur ce logement : sa performance énergétique, ce à quoi son adresse est exposée, et ce qui l&apos;entoure.
            </p>
            <div className="flex gap-3 flex-wrap">
              <Link href="/rapport" prefetch={false} className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/[0.05] text-muted text-[14px] no-underline border border-white/[0.08]">
                Retour au hub
              </Link>
              <Link href="/rapport/quartier" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/[0.05] text-muted text-[14px] no-underline border border-white/[0.08]">
                Voir le module Territoire
              </Link>
            </div>
          </div>
        </section>

        <div className="border-t border-white/[0.08]" />

        <section className="pt-14">
          <div className="mb-8">
            <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-ghost mb-2">Le bien de ce dossier</p>
            <h2 className="font-normal text-[clamp(24px,2.8vw,36px)] leading-[1.18] tracking-[-0.5px] text-label" style={{ fontFamily: "'Instrument Serif', serif" }}>
              {dossier?.address_label ?? "Aucun dossier ouvert."}
            </h2>
          </div>

          <div className="glass rounded-xl p-8 border-t-2 border-t-accent">
            {loading && (
              <div style={{ fontSize: 12.5, color: "var(--fg-4)", fontFamily: "var(--font-mono)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Analyse en cours…
              </div>
            )}

            {error && (
              <div style={{ marginTop: 16, padding: "12px 16px", background: "rgba(168,74,58,0.08)", border: "1px solid rgba(168,74,58,0.25)", borderRadius: 10, color: "var(--red, #f87171)", fontSize: 13, fontFamily: "var(--font-mono)" }}>
                {error}
              </div>
            )}

            {!loading && !error && (
              <Link
                href="/rapport/dossiers"
                className="inline-flex items-center gap-2 text-[13.5px] text-muted no-underline"
              >
                Analyser un autre bien
              </Link>
            )}
          </div>
        </section>

      {/* Précisez votre logement : quand plusieurs diagnostics existent, on choisit AVANT le
          rapport pour que le Passeport s'affiche rempli (retour porteur, 5a). */}
      {result && dpeStatus === "selection_required" && (
        <PreciseLogementStep
          addressLabel={result.address?.label ?? null}
          candidates={dpeCandidates}
          onPick={(d) => { setSelectedDpe(d); setDpeStatus("confirmed"); void persistDpe("user_confirmed", d); }}
          onNotInList={() => { setSelectedDpe(null); setDpeStatus("rejected"); void persistDpe("not_in_list", null); }}
        />
      )}

      {/* ── RÉSULTATS : lecture en 5 beats (spec 5a) ── */}
      {result && dpeStatus !== "selection_required" && (
        <section style={{ padding: "24px 0 96px", display: "grid", gap: 40 }}>

          {/* Beat 1 — Identité : quel logement ? (passeport compacté, tilt conservé) */}
          <PropertyPassport
            address={result.address}
            parcel={result.parcel}
            dpe={dpe}
          />

          {/* Note informative si l'adresse est dans une commune ≠ résidence (commune débloquée, cf. 4.5). */}
          {defaultCommune && result.address?.city &&
            result.address.city.toLowerCase() !== defaultCommune.toLowerCase() && (
            <div style={{
              padding: "12px 16px",
              background: "var(--bg-elev)", border: "1px solid var(--border-1)",
              borderRadius: 10,
              fontSize: 13, color: "var(--fg-2)", lineHeight: 1.65,
            }}>
              <strong style={{ color: "var(--fg-4)", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Analyse d&apos;un bien à {result.address.city}
              </strong>
              <br />
              Cette analyse porte sur ce bien à <strong>{result.address.city}</strong>. Votre commune principale reste <strong>{defaultCommune}</strong>.
            </div>
          )}

          {/* Beat 2 — Synthèse : qu'est-ce que je retiens ? (posture-neutre) */}
          <LogementSynthesis
            ready={synthesisReady}
            data={synthesisData}
            dossierId={dossier?.id ?? ""}
            insee={result.address?.citycode ?? ""}
          />

          {/* Beat 3 — Les preuves : pourquoi ? (2 sous-familles) */}
          <div style={{ display: "grid", gap: 36 }}>

            <FamilyHeading color="var(--accent)">Le logement lui-même</FamilyHeading>

            {/* Ancre de phénomène : une preuve « Preuve · DPE F » du dossier renvoie ici (cf.
                evidence-targets.ts). Posée sur un conteneur, pas dans la section : celle-ci est
                partagée et n'a pas à connaître le vocabulaire de navigation. */}
            <div id={evidenceAnchorId("housing.energy_label")} className="scroll-mt-24">
            <EnergieSection
              dpeStatus={dpeStatus}
              dpe={dpe}
              audit={result.audit}
              onReselect={() => setDpeStatus("selection_required")}
            />
            </div>

            <ThermalComfortSection
              evidence={thermalEvidence}
              communeName={communeName}
              dpeYear={dpeYear}
            />

            <FamilyHeading color="var(--blue)">Ce à quoi cette adresse est exposée</FamilyHeading>

            {/* Risques du bâti — registre sobre (dé-dramatisé). Sismicité/RGA en gradé (couleur de
                famille bleue), + cavités/mouvements de terrain au grain point, + résidu communal.
                L'îlot de chaleur a QUITTÉ ce bloc le 29/07/2026 : il y avait atterri faute de
                place ailleurs, mais il décrit le quartier, pas le bâti. Il se lit maintenant dans
                le module Autour de l'adresse, à son échelle. */}
            {(georisques?.seismic?.label || georisques?.rga?.label || pointHazards?.cavites || pointHazards?.mvt || (pointHazards?.communalResidual?.length ?? 0) > 0) && (
              <ReportSection eyebrow="Risques du bâti">
                <GlassCard>
                  <div style={{ display: "grid", gap: 16 }}>
                    <p style={{ fontSize: 14, color: "var(--fg-2)", lineHeight: 1.65, margin: 0 }}>
                      Ce que les bases publiques recensent sur l&apos;exposition du bâti à cette adresse.
                    </p>
                    {(georisques?.seismic?.label || georisques?.rga?.label || pointHazards?.cavites || (pointHazards?.mvt?.kind === "events")) && (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px,1fr))", gap: 14 }}>
                        {georisques?.seismic?.label && <Block label="Sismicité" value={seismicValue(georisques.seismic.label, georisques.seismic.code)} icon={<span style={{ color: "var(--blue)" }}><IconSeismic /></span>} tip="Le classement réglementaire du risque sismique de la zone, de très faible à fort. Il indique le niveau de précaution attendu pour construire, pas qu'un séisme va survenir." />}
                        {georisques?.rga?.label && <div id={evidenceAnchorId("housing.clay_shrink_swell")} className="scroll-mt-24"><Block label="Retrait-gonflement des argiles" value={georisques.rga.label} icon={<span style={{ color: "var(--blue)" }}><IconStrata /></span>} tip="Un sol argileux qui gonfle avec l'humidité puis se rétracte en période sèche ; ces mouvements répétés peuvent fissurer les murs et les fondations." /></div>}
                        {pointHazards?.cavites && <Block label="Cavités souterraines" value={`${pointHazards.cavites.count} à moins de 500 m`} icon={<span style={{ color: "var(--blue)" }}><IconCavity /></span>} tip="Un vide dans le sous-sol, comme une ancienne carrière ou galerie, peut fragiliser les fondations et provoquer un affaissement. À proximité, il justifie une étude de sol avant d'engager des travaux." />}
                        {pointHazards?.mvt?.kind === "events" && <Block label="Mouvements de terrain" value={`${pointHazards.mvt.count} à moins de 500 m`} icon={<span style={{ color: "var(--blue)" }}><IconLandslide /></span>} tip="Glissements, chutes de blocs ou effondrements déjà survenus tout près : ils signalent un terrain qui a bougé, ce qui peut affecter la stabilité du bâti." />}
                      </div>
                    )}
                    {(pointHazards?.communalResidual?.length ?? 0) > 0 && (
                      <p style={{ fontSize: 13.5, color: "var(--fg-3)", lineHeight: 1.6, margin: 0 }}>
                        La commune est aussi recensée pour d&apos;autres aléas pouvant concerner le logement ({pointHazards!.communalResidual.map((l) => l.toLowerCase()).join(", ")}), sur de larges périmètres et sans détail disponible à cette adresse.
                      </p>
                    )}
                    {(pointHazards?.cavites || pointHazards?.mvt?.kind === "events") && (
                      <p style={{ fontSize: 12.5, color: "var(--fg-4)", lineHeight: 1.55, margin: 0 }}>
                        Cavités et mouvements de terrain recensés par le BRGM via Géorisques.
                      </p>
                    )}
                  </div>
                </GlassCard>
              </ReportSection>
            )}

            {result.georisques && (
              <div id={evidenceAnchorId("housing.regulated_zone")} className="scroll-mt-24">
                <RegulatoryStatusBlock georisques={result.georisques} heritage={result.heritage ?? null} />
              </div>
            )}

            {result.sinistralite && <SinistraliteBlock sinistralite={result.sinistralite} commune={result.address?.city ?? null} />}
          </div>

          {/* Beat 4 — Le relais vers l'échelle du dessus. L'entourage de l'adresse était rendu ici
              (Face3Block) ; il a son module depuis le 29/07/2026. On ne le résume pas et on n'en
              donne aucun avant-goût : un aperçu ferait de ce renvoi un teaser, alors que c'est une
              frontière de lecture. */}
          <ReportSection eyebrow="Changer d'échelle" tone="green">
            <GlassCard>
              <div style={{ display: "grid", gap: 14 }}>
                <p style={{ fontSize: 14.5, color: "var(--fg-2)", lineHeight: 1.65, margin: 0 }}>
                  Cette lecture s&apos;arrête aux murs. Ce qu&apos;il y a autour de cette adresse,
                  les commerces et services les plus proches, l&apos;espace vert le plus proche et la
                  chaleur du quartier se lisent dans le module Autour de l&apos;adresse.
                </p>
                <Link href="/rapport/autour" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg no-underline text-[13.5px] w-fit" style={{ color: "var(--green)", border: "1px solid color-mix(in srgb, var(--green) 25%, transparent)", background: "color-mix(in srgb, var(--green) 8%, transparent)" }}>
                  Ouvrir Autour de l&apos;adresse →
                </Link>
              </div>
            </GlassCard>
          </ReportSection>

          {/* Beat 5 — À vérifier avant de décider : et moi, je fais quoi ? */}
          <div style={{ display: "grid", gap: 16 }}>
            {/* La sonde ne déclenche plus de recalcul d'entourage (il a son module) : elle ne sert
                plus qu'à ce à quoi elle sert vraiment ici, orienter la checklist par posture. */}
            <ProjectProbe
              answered={projet}
              onAnswer={(v) => {
                setProjet(v);
                posthog?.capture("logement_projet_declare", { projet: v, insee: result.address?.citycode ?? null });
              }}
            />
            <DecisionChecklist facts={checklistFacts} projet={projet} />
          </div>

          {/* La sortie d'engagement du module = le beat 5 « À vérifier avant de décider »
              (DecisionChecklist, déterministe par posture) ci-dessus. Il a remplacé l'ancien bloc
              « Actions documentées » (retiré 2026-07-07, hotfix confiance : 4 cartes /savoir sur 5
              en 404, carte assurance contredisant la sinistralité, carte sols-pollués violant la
              frontière Santé, carte comparateur à promesse fausse). */}

        </section>
      )}
      </div>
    </div>
  );
}
