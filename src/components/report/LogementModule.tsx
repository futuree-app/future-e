"use client";

import { useEffect, useRef, useState } from "react";
import { usePostHog } from "posthog-js/react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import type { Face3Snapshot, Posture } from "@/lib/logement-autour-types";
import type { SynthesisData } from "@/lib/logement-synthesis-cache";
import type { LogementReport as ApiResponse } from "@/lib/logement-report-types";
import { ReportSection, GlassCard } from "@/components/report/kit";
import { AddressAutocomplete } from "@/components/report/AddressAutocomplete";
import { ThermalComfortSection } from "@/components/report/ThermalComfortSection";
import { LogementSynthesis } from "@/components/report/LogementSynthesis";
import { deriveThermalEvidence } from "@/lib/thermal-evidence";
import { dpeAttributionStatus, type DpeRecord } from "@/lib/dpe-attribution";
import type { BanAddressResult } from "@/lib/ban";
// Faces extraites (board étape 4 : une face = un fichier ; gabarit ThermalComfortSection).
import { Block } from "@/components/report/logement/kit";
import { POSTURE_FOR_PROJET } from "@/components/report/logement/posture";
import { PropertyPassport } from "@/components/report/logement/PropertyPassport";
import { ProjectProbe } from "@/components/report/logement/ProjectProbe";
import { EnergieSection } from "@/components/report/logement/EnergieSection";
import { SinistraliteBlock } from "@/components/report/logement/SinistraliteSection";
import { RegulatoryStatusBlock, Face2Implication } from "@/components/report/logement/RegulatorySection";
import { Face3Block } from "@/components/report/logement/AutourSection";

// Le contrat de réponse (ApiResponse) vit dans @/lib/logement-report-types (LogementReport),
// partagé avec la route qui le produit. Importé en alias ci-dessus.

// Jeton d'adresse non réversible pour l'analytics : distingue deux adresses sans stocker l'adresse
// (djb2 -> base36). Sert à compter les adresses DISTINCTES analysées par commune, sans PII.
function addressToken(banId: string): string {
  let h = 5381;
  for (let i = 0; i < banId.length; i++) h = ((h << 5) + h + banId.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

export default function LogementModule({ defaultCommune }: { defaultCommune?: string | null }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Commune de l'adresse tapée non débloquée par le rapport de l'utilisateur (étape 4.5) : on
  // affiche un upsell honnête, jamais les données Logement.
  const [lockedCommune, setLockedCommune] = useState<{ commune: string | null; insee: string | null } | null>(null);
  // Remonte AddressAutocomplete pour repartir d'un champ vide (« Modifier l'adresse »).
  const [addressResetKey, setAddressResetKey] = useState(0);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [projet, setProjet] = useState<string | null>(null);
  const [autour, setAutour] = useState<Face3Snapshot | null>(null);
  // Complétude de l'« autour » pour le gate de synthèse (board critique 2a). "terminal" = un
  // snapshot non-pending est arrivé, OU le retry OSM est épuisé, OU la requête a échoué : dans
  // les trois cas on ne l'attend plus. La synthèse ne se génère jamais avant ce point (sinon elle
  // se fige sans la section « autour »).
  const [autourPhase, setAutourPhase] = useState<"pending" | "terminal">("pending");
  // Attribution du DPE au logement (cf. spec §2). Aucun DPE affiché comme « le vôtre » tant
  // qu'il n'est pas confirmé (auto ou par l'utilisateur).
  const [dpeStatus, setDpeStatus] = useState<
    "loading" | "not_found" | "selection_required" | "auto_confirmed" | "confirmed" | "rejected" | "error"
  >("loading");
  const [selectedDpe, setSelectedDpe] = useState<DpeRecord | null>(null);
  const [dpeCandidates, setDpeCandidates] = useState<DpeRecord[]>([]);
  const autourRetriedRef = useRef(false);
  // Instrumentation « artefact adresse » : adresses DISTINCTES analysées par commune dans la
  // session. Un même utilisateur comparant plusieurs biens d'une même ville est le cas d'usage
  // payant que la clé actuelle (user, insee) ne sait pas encore porter : ce compteur est le
  // signal de re-key (cf. board 2026-07-07). Reset au remontage (≈ par session).
  const analyzedByInseeRef = useRef<Map<string, Set<string>>>(new Map());
  const posthog = usePostHog();

  // Face 3 : génère (ou relit, figé) le snapshot « autour de l'adresse ». La donnée
  // OSM vient du cache de tuile côté serveur ; l'affichage ne touche jamais Overpass.
  async function requestAutour(payload: ApiResponse, posture: Posture) {
    const a = payload.address;
    // Adresse sans coordonnées : rien à récupérer, l'« autour » est terminal (la synthèse n'attend pas).
    if (!a?.id || !a.citycode || a.latitude == null || a.longitude == null) { setAutourPhase("terminal"); return; }
    try {
      const res = await fetch("/api/logement-autour", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logement_id: a.id,
          insee: a.citycode,
          latitude: a.latitude,
          longitude: a.longitude,
          address_label: a.label,
          parcel_code: payload.parcel?.parcelCode ?? null,
          posture,
        }),
      });
      if (!res.ok) { setAutourPhase("terminal"); return; }
      const { snapshot } = (await res.json()) as { snapshot: Face3Snapshot };
      setAutour(snapshot);
      // Terminal sauf si l'OSM est revenu `pending` ET qu'on n'a pas encore fait le retry unique
      // (le retry est gaté sur osmInfrastructure, comme l'effet ci-dessous : on aligne dessus).
      const willRetry = snapshot.sourceStatus.osmInfrastructure === "pending" && !autourRetriedRef.current;
      setAutourPhase(willRetry ? "pending" : "terminal");
      // Observabilité de complétude, SANS donnée localisante fine (pas de tile_key/coords).
      posthog?.capture("logement_autour", {
        insee: a.citycode,
        posture,
        status_bpe: snapshot?.sourceStatus?.bpe,
        status_osm_infra: snapshot?.sourceStatus?.osmInfrastructure,
        status_osm_green: snapshot?.sourceStatus?.osmGreenSpaces,
      });
    } catch {
      /* échec silencieux à l'UI ; l'observabilité vit dans le snapshot/serveur */
      setAutourPhase("terminal");
    }
  }

  // Remplissage asynchrone minimal : si l'OSM est revenu `pending` (tuile froide,
  // Overpass lent), on re-demande UNE fois après un court délai (la tuile est alors
  // chaude grâce au after() serveur). Au-delà = incrément futur.
  useEffect(() => {
    if (!result || !autour || autourRetriedRef.current) return;
    if (autour.sourceStatus.osmInfrastructure !== "pending") return;
    autourRetriedRef.current = true;
    const t = setTimeout(() => {
      void requestAutour(result, POSTURE_FOR_PROJET[projet ?? "reside"] ?? "residence");
    }, 4500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autour, result]);

  // Déclenchée par la sélection d'une suggestion BAN (le texte libre n'analyse jamais). On
  // envoie l'adresse ATOMIQUE au serveur ; on dérive ensuite l'état d'attribution du DPE.
  async function analyzeSelected(a: BanAddressResult) {
    if (!a.id) { setError("Adresse sans identifiant BAN."); return; }
    // Événement d'ENTRÉE (une sélection BAN, jamais le texte libre) : mesure le débit d'adresses.
    const token = addressToken(a.id);
    posthog?.capture("logement_address_selected", { insee: a.citycode ?? null, address_token: token });
    setLoading(true);
    setError(null);
    setLockedCommune(null);
    setAutour(null);
    setAutourPhase("pending");
    autourRetriedRef.current = false;
    setDpeStatus("loading");
    setSelectedDpe(null);
    setDpeCandidates([]);
    try {
      const res = await fetch("/api/georisques-logement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: {
          banId: a.id, label: a.label, postcode: a.postcode ?? "", city: a.city ?? "",
          citycode: a.citycode ?? "", latitude: a.latitude, longitude: a.longitude, type: a.type,
        } }),
      });
      const payload = (await res.json()) as ApiResponse & { code?: string; commune?: string | null; insee?: string | null };
      // Frontière de monétisation (étape 4.5) : commune non débloquée -> upsell, pas une erreur.
      if (res.status === 403 && payload.code === "COMMUNE_NOT_UNLOCKED") {
        setResult(null);
        setLockedCommune({ commune: payload.commune ?? a.city ?? null, insee: payload.insee ?? a.citycode ?? null });
        posthog?.capture("logement_commune_locked", { insee: payload.insee ?? a.citycode ?? null });
        return;
      }
      if (!res.ok) throw new Error(payload.error ?? `Erreur ${res.status}`);
      setResult(payload);
      setProjet(null);
      const candidates = payload.dpeCandidates ?? [];
      setDpeCandidates(candidates);
      const attribution = dpeAttributionStatus(candidates, payload.banFeatureType ?? null);
      if (attribution.status === "not_found") {
        setDpeStatus("not_found");
      } else if (attribution.status === "auto_confirmed") {
        setSelectedDpe(attribution.dpe);
        setDpeStatus("auto_confirmed");
        void persistDpe("auto_confirmed", attribution.dpe, payload);
      } else {
        setDpeStatus("selection_required");
      }
      // Signal implicite acheteur/résident : l'adresse analysée est-elle la commune déclarée ?
      const relation =
        defaultCommune && payload.address?.city
          ? payload.address.city.toLowerCase() === defaultCommune.toLowerCase()
            ? "residence"
            : "prospection"
          : "inconnue";
      const insee = payload.address?.citycode ?? null;
      // Adresses distinctes analysées dans CETTE commune cette session : au 2e bien distinct, on
      // émet le signal de re-key (comparaison de biens dans une même ville = moment payant).
      if (insee) {
        const set = analyzedByInseeRef.current.get(insee) ?? new Set<string>();
        set.add(token);
        analyzedByInseeRef.current.set(insee, set);
        if (set.size >= 2) {
          posthog?.capture("logement_same_commune_multi", { insee, distinct_addresses_in_commune: set.size });
        }
      }
      posthog?.capture("logement_analyzed", {
        relation_inferee: relation,
        in_declared_commune: relation === "residence",
        dpe_attribution: attribution.status,
        insee,
        address_token: token,
      });
      void requestAutour(payload, "residence");
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  }

  // Persiste le choix DPE dans l'artefact logement (échec silencieux à l'UI ; cohérence rétablie
  // au prochain chargement). `payload` fournit l'adresse quand `result` n'est pas encore posé.
  async function persistDpe(
    status: "auto_confirmed" | "user_confirmed" | "not_in_list",
    dpe: DpeRecord | null,
    payload?: ApiResponse,
  ) {
    const a = (payload ?? result)?.address;
    if (!a?.id) return;
    try {
      await fetch("/api/logement-dpe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logement_id: a.id, status, dpe }),
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
  // La synthèse artefact attend AUSSI que l'« autour » soit terminal (board critique 2a) : sinon
  // elle se génère sans la section « autour » et se fige incomplète.
  const synthesisReady = Boolean(result) && dpeTerminal && autourPhase === "terminal";
  const synthesisData: SynthesisData = {
    address: result?.address,
    altitude: result?.altitude,
    dpeSelectionStatus: dpeStatus === "confirmed" ? "user_confirmed" : dpeStatus,
    selectedDpe: dpe,
    georisques: result?.georisques,
    sinistralite: result?.sinistralite,
    // Le snapshot Face 3 (bpe.categories) est ramené à la forme attendue par buildSynthesisPayload
    // (bpe = tableau de proximités). Sans ce mapping, `.filter` sur `bpe.categories` casse dès que
    // l'« autour » est présent (jusqu'ici masqué par la course désormais fermée par le gate 3a).
    autour: autour ? { bpe: autour.bpe.categories, osm: autour.osm } : null,
    communeData: result?.communeData,
  };
  const georisques = result?.georisques?.parcel ?? result?.georisques?.address;
  // Les libellés PPRN ne sont plus aplatis ici : ils sont portés, structurés (régime + zone +
  // plan), par le bloc « Statut réglementaire à cette adresse ». On garde les autres risques.
  const allRisks = (georisques?.risks?.labels ?? []).filter((v, i, a) => a.indexOf(v) === i);

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
              Une adresse suffit. Vous y lisez la performance énergétique du bien, son exposition aux risques naturels, ce que les sinistres ont déjà coûté à assurer dans la commune, et ce qui entoure la porte.
            </p>
            <div className="flex gap-3 flex-wrap">
              <Link href="/rapport" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/[0.05] text-muted text-[14px] no-underline border border-white/[0.08]">
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
            <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-ghost mb-2">Lecture par défaut</p>
            <h2 className="font-normal text-[clamp(24px,2.8vw,36px)] leading-[1.18] tracking-[-0.5px] text-label" style={{ fontFamily: "'Instrument Serif', serif" }}>
              Analyser un logement précis.
            </h2>
            <p className="text-[15px] text-muted leading-[1.65] mt-3 max-w-[640px]">
              Entrez une adresse pour lire ce logement précis : sa performance énergétique, les risques du bâti, ce que le passé a coûté à assurer, et ce qui se trouve autour.
            </p>
          </div>

          <div className="glass rounded-xl p-8 border-t-2 border-t-accent" style={{ maxWidth: 760 }}>
            <AddressAutocomplete
              key={addressResetKey}
              placeholder={`Ex. : 12 rue des Minimes${defaultCommune ? `, ${defaultCommune}` : ""}`}
              onSelect={(a) => void analyzeSelected(a)}
              showModify={!lockedCommune}
            />
            {loading && (
              <div style={{ marginTop: 14, fontSize: 12.5, color: "var(--fg-4)", fontFamily: "var(--font-mono)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Analyse en cours…
              </div>
            )}

            {error && (
              <div style={{ marginTop: 16, padding: "12px 16px", background: "rgba(168,74,58,0.08)", border: "1px solid rgba(168,74,58,0.25)", borderRadius: 10, color: "var(--red, #f87171)", fontSize: 13, fontFamily: "var(--font-mono)" }}>
                {error}
              </div>
            )}

            {lockedCommune && (
              <div style={{ marginTop: 16, padding: "16px 18px", background: "var(--bg-elev)", border: "1px solid var(--border-2)", borderRadius: 12, display: "grid", gap: 12 }}>
                <p style={{ margin: 0, fontSize: 14.5, color: "var(--fg-1)", lineHeight: 1.6 }}>
                  Cette adresse est située à <strong style={{ color: "var(--fg-hi)" }}>{lockedCommune.commune ?? "une autre commune"}</strong>.
                </p>
                <p style={{ margin: 0, fontSize: 13.5, color: "var(--fg-3)", lineHeight: 1.6 }}>
                  Votre rapport actuel ne donne pas accès à l&apos;analyse Logement de cette commune. Débloquez {lockedCommune.commune ?? "cette commune"} pour analyser ce bien.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 14 }}>
                  {lockedCommune.insee && (
                    <Link
                      href={`/territoire/${lockedCommune.insee}/debloquer?${new URLSearchParams({ ...(lockedCommune.commune ? { nom: lockedCommune.commune } : {}), source: "logement" }).toString()}`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent/[0.12] text-accent text-[13.5px] no-underline border border-accent/[0.25] w-fit"
                    >
                      Débloquer cette commune
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => { setLockedCommune(null); setAddressResetKey((k) => k + 1); }}
                    style={{ fontSize: 12.5, color: "var(--fg-4)", textDecoration: "underline", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  >
                    Modifier l&apos;adresse
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

      {/* ── RÉSULTATS ── */}
      {result && (
        <section style={{ padding: "24px 0 96px", display: "grid", gap: 40 }}>

          {/* Passeport du bien : identité au grain adresse, DPE en sceau. */}
          <PropertyPassport
            address={result.address}
            parcel={result.parcel}
            dpe={dpe}
            altitude={result.altitude}
          />

          {/* Face 1 — lecture thermique « faire face à la chaleur » (DPE attribué uniquement). */}
          <ThermalComfortSection
            evidence={thermalEvidence}
            communeName={communeName}
            dpeYear={dpeYear}
          />

          {/* Note (pas un avertissement) si l'adresse est dans une commune différente de la
              résidence. Depuis l'étape 4.5, atteindre ce point implique que la commune est
              débloquée (résidence OU commune achetée) : le ton est informatif, pas un problème. */}
          {defaultCommune && result.address?.city &&
            result.address.city.toLowerCase() !== defaultCommune.toLowerCase() && (
            <div style={{
              marginBottom: 20, padding: "12px 16px",
              background: "var(--bg-elev)", border: "1px solid var(--border-1)",
              borderRadius: 10,
              fontSize: 13, color: "var(--fg-2)", lineHeight: 1.65,
            }}>
              <strong style={{ color: "var(--fg-4)", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Analyse d&apos;un bien à {result.address.city}
              </strong>
              <br />
              Cette analyse porte sur ce bien à <strong>{result.address.city}</strong>. Les modules Territoire et Santé peuvent rester calés sur votre commune principale, <strong>{defaultCommune}</strong>.
            </div>
          )}

          {/* Sonde projet : mesure explicite acheteur/résident, non bloquante. */}
          <ProjectProbe
            answered={projet}
            onAnswer={(v) => {
              setProjet(v);
              posthog?.capture("logement_projet_declare", { projet: v, insee: result.address?.citycode ?? null });
              // La posture déclarée met à jour le logement sauvegardé (persistée, non prédictive).
              void requestAutour(result, POSTURE_FOR_PROJET[v] ?? "residence");
            }}
          />

          {/* ═════════════════════ LECTURE ═════════════════════ */}
          {/* Verdict composite retiré (ADR-0001). Synthèse artefact : prose streamée,
              régénérée seulement quand un fait du logement change (spec 1a). */}
          <LogementSynthesis
            ready={synthesisReady}
            data={synthesisData}
            logementId={result.address?.id ?? ""}
            insee={result.address?.citycode ?? ""}
          />

          {/* ═════════════════════ DIMENSIONS RÉELLES ═════════════════════ */}
          {(
            <div style={{ display: "grid", gap: 36 }}>

              {/* Énergie — attribution du DPE au logement (sélecteur / absence / rejet / confirmé) */}
              <EnergieSection
                dpeStatus={dpeStatus}
                dpe={dpe}
                dpeCandidates={dpeCandidates}
                audit={result.audit}
                onPick={(d) => { setSelectedDpe(d); setDpeStatus("confirmed"); void persistDpe("user_confirmed", d); }}
                onNotInList={() => { setSelectedDpe(null); setDpeStatus("rejected"); void persistDpe("not_in_list", null); }}
                onReselect={() => setDpeStatus("selection_required")}
              />

              {/* Risques */}
              {(allRisks.length > 0 || georisques?.seismic || georisques?.rga) && (
                <ReportSection eyebrow="Risques du bâti" tone="red">
                  <GlassCard>
                  <div style={{ display: "grid", gap: 16 }}>
                    {allRisks.length > 0 && (
                      <div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-4)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
                          Risques référencés
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {allRisks.map((r, i) => (
                            <span key={i} style={{ fontFamily: "var(--font-mono)", fontSize: 12, padding: "5px 11px", background: "rgba(168,74,58,0.08)", border: "1px solid rgba(168,74,58,0.25)", color: "var(--red, #f87171)" }}>
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px,1fr))", gap: 14 }}>
                      {georisques?.seismic?.label && <Block label="Sismicité" value={georisques.seismic.label} />}
                      {georisques?.rga?.label && <Block label="Retrait-gonflement argiles" value={georisques.rga.label} />}
                    </div>
                  </div>
                  </GlassCard>
                </ReportSection>
              )}

              {/* Statut réglementaire au point (PPRN) — entre l'exposition et la sinistralité communale */}
              {result.georisques && <RegulatoryStatusBlock georisques={result.georisques} />}

              {/* Face 2 — matérialité assurantielle passée (ONRN) */}
              {result.sinistralite && <SinistraliteBlock sinistralite={result.sinistralite} />}

              {/* Sortie décisionnelle Face 2 : ce que cela mérite de vérifier (posture) */}
              <Face2Implication projet={projet} georisques={result.georisques} sinistralite={result.sinistralite} />

              {/* Face 3 — autour de cette adresse (buffer local au point géocodé) */}
              {autour && <Face3Block s={autour} />}

              {/* ZFE (Crit'Air) retirée : contrainte sur le véhicule, pas sur le logement.
                  Parquée pour le futur module Mobilité. */}

            </div>
          )}

          {/* ═════════════════════ AGIR ═════════════════════ */}
          {/* Ancien bloc « Actions documentées » retiré (2026-07-07, hotfix confiance) : 4 cartes
              sur 5 pointaient vers des pages Savoir inexistantes (404 en fin de rapport payant),
              la carte assurance contredisait la sinistralité (« anticiper la prime » alors que le
              bloc dit ne rien prédire), la carte sols-pollués violait la frontière Santé, et la
              carte comparateur promettait de « mesurer » un bien face à des territoires (le
              comparateur compare des communes, sans score). La sortie du module est reconstruite
              en « À vérifier avant de décider » (déterministe, par posture) au spec 1b. */}

        </section>
      )}
      </div>
    </div>
  );
}
