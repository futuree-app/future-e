"use client";

import { useEffect, useRef, useState } from "react";
import { usePostHog } from "posthog-js/react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import type { SynthesisData } from "@/lib/logement-synthesis-cache";
import type { LogementReport as ApiResponse } from "@/lib/logement-report-types";
import type { LogementRow, DpeSelectionStatus } from "@/lib/logement-store";
import { ReportSection, GlassCard } from "@/components/report/kit";
import { AddressAutocomplete } from "@/components/report/AddressAutocomplete";
import { ThermalComfortSection } from "@/components/report/ThermalComfortSection";
import { LogementSynthesis } from "@/components/report/LogementSynthesis";
import { deriveThermalEvidence } from "@/lib/thermal-evidence";
import { dpeAttributionStatus, type DpeRecord } from "@/lib/dpe-attribution";
import type { BanAddressResult } from "@/lib/ban";
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
export default function LogementModule({
  defaultCommune,
  initialRow = null,
  rehydrateSource = "auto",
}: {
  defaultCommune?: string | null;
  initialRow?: LogementRow | null;
  rehydrateSource?: "auto" | "deeplink";
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Commune de l'adresse tapée non débloquée par le rapport de l'utilisateur (étape 4.5) : on
  // affiche un upsell honnête, jamais les données Logement.
  const [lockedCommune, setLockedCommune] = useState<{ commune: string | null; insee: string | null } | null>(null);
  // Remonte AddressAutocomplete pour repartir d'un champ vide (« Modifier l'adresse »).
  const [addressResetKey, setAddressResetKey] = useState(0);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [projet, setProjet] = useState<string | null>(null);
  // Attribution du DPE au logement (cf. spec §2). Aucun DPE affiché comme « le vôtre » tant
  // qu'il n'est pas confirmé (auto ou par l'utilisateur).
  const [dpeStatus, setDpeStatus] = useState<
    "loading" | "not_found" | "selection_required" | "auto_confirmed" | "confirmed" | "rejected" | "error"
  >("loading");
  const [selectedDpe, setSelectedDpe] = useState<DpeRecord | null>(null);
  const [dpeCandidates, setDpeCandidates] = useState<DpeRecord[]>([]);
  // Instrumentation « artefact adresse » : adresses DISTINCTES analysées par commune dans la
  // session. Un même utilisateur comparant plusieurs biens d'une même ville est le cas d'usage
  // payant que la clé actuelle (user, insee) ne sait pas encore porter : ce compteur est le
  // signal de re-key (cf. board 2026-07-07). Reset au remontage (≈ par session).
  const analyzedByInseeRef = useRef<Map<string, Set<string>>>(new Map());
  // Rehydratation au montage : ne s'exécute qu'une fois (sinon boucle sur re-render).
  const rehydratedRef = useRef(false);
  const posthog = usePostHog();

  // Enregistre l'identité de l'adresse analysée (voir /api/logement-artefact). Échec silencieux à
  // l'UI : la lecture à l'écran reste complète, seule la sauvegarde manque, et la prochaine
  // analyse de la même adresse la repose.
  async function persistArtefact(payload: ApiResponse) {
    const a = payload.address;
    if (!a?.id || !a.citycode || a.latitude == null || a.longitude == null) return;
    try {
      await fetch("/api/logement-artefact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logement_id: a.id,
          insee: a.citycode,
          address_label: a.label,
          city: a.city ?? null,
          postcode: a.postcode ?? null,
          latitude: a.latitude,
          longitude: a.longitude,
          parcel_code: payload.parcel?.parcelCode ?? null,
        }),
      });
    } catch { /* échec silencieux */ }
  }

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
      // POSE L'ARTEFACT AVANT TOUTE ÉCRITURE QUI LE SUPPOSE, et c'est un `await`, pas un `void` :
      // la persistance du DPE juste en dessous est un UPDATE ciblé, sans effet ni erreur si la
      // ligne n'existe pas encore. Les lancer en concurrence rendrait la sauvegarde du diagnostic
      // dépendante de l'ordre d'arrivée de deux requêtes.
      await persistArtefact(payload);
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
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  }

  // Rehydratation d'un logement sauvegardé (spec 2026-07-07). On re-fetch UNIQUEMENT l'exposition
  // Géorisques (le risque doit rester frais) ; le DPE figé est RESTAURÉ depuis la ligne, jamais
  // recalculé. La cohérence de la synthèse est gérée par le cache serveur par hash de faits : si
  // les faits re-fetchés n'ont pas bougé, la synthèse figée est renvoyée telle quelle ; s'ils ont
  // dérivé, elle est régénérée. Aucune génération mélangée.
  async function rehydrateFromRow(row: LogementRow) {
    // Sans city/postcode, l'adresse ne passe pas le validateur du re-fetch : retour à la saisie.
    // LE SNAPSHOT N'EST PLUS EXIGÉ (29/07/2026) : il n'appartient plus à ce module, et une adresse
    // analysée ici n'en a pas. L'exiger rendrait tout bien analysé depuis Logement non rouvrable.
    if (!row.city || !row.postcode) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/georisques-logement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: {
          banId: row.logement_id, label: row.address_label, postcode: row.postcode, city: row.city,
          citycode: row.insee, latitude: row.latitude, longitude: row.longitude, type: null,
        } }),
      });
      const payload = (await res.json()) as ApiResponse & { code?: string; commune?: string | null; insee?: string | null };
      // Commune redevenue inaccessible depuis l'analyse : upsell honnête, jamais les données.
      if (res.status === 403 && payload.code === "COMMUNE_NOT_UNLOCKED") {
        setResult(null);
        setLockedCommune({ commune: payload.commune ?? row.city, insee: payload.insee ?? row.insee });
        return;
      }
      if (!res.ok) throw new Error(payload.error ?? `Erreur ${res.status}`);
      setResult(payload);
      setDpeCandidates(payload.dpeCandidates ?? []);
      // Restaure le choix DPE figé + son statut (jamais de re-dérivation d'attribution).
      setSelectedDpe(row.selected_dpe_snapshot);
      setDpeStatus(RUNTIME_DPE_STATUS[row.dpe_selection_status] ?? "not_found");
      // La posture est stockée, pas le projet fin : la sonde réapparaît non répondue (ton défaut).
      setProjet(null);
      posthog?.capture("logement_restored", {
        insee: row.insee,
        source: rehydrateSource,
        address_token: addressToken(row.logement_id),
      });
    } catch {
      // Rehydratation ratée -> retour silencieux à la saisie (aucune régression).
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  // Au montage : si la page serveur a résolu un logement rehydratable, on le restaure une fois.
  // Déféré en microtask : la rehydratation est un chargement de données (elle setState après un
  // fetch), on évite un setState synchrone dans le corps de l'effet (cascading renders).
  useEffect(() => {
    if (rehydratedRef.current || !initialRow) return;
    rehydratedRef.current = true;
    const row = initialRow;
    void Promise.resolve().then(() => rehydrateFromRow(row));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // Retour à l'état de recherche vierge (« Modifier l'adresse ») : on efface le rapport précédent
  // AVANT de rééditer, sinon l'ancien Passeport reste affiché sous le champ et le menu de
  // suggestions se superpose dessus. Remonte aussi AddressAutocomplete (champ vide).
  function resetToSearch() {
    setResult(null);
    setError(null);
    setLockedCommune(null);
    setProjet(null);
    setAddressResetKey((k) => k + 1);
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
            <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-ghost mb-2">Lecture par défaut</p>
            <h2 className="font-normal text-[clamp(24px,2.8vw,36px)] leading-[1.18] tracking-[-0.5px] text-label" style={{ fontFamily: "'Instrument Serif', serif" }}>
              Analyser un logement précis.
            </h2>
          </div>

          <div className="glass rounded-xl p-8 border-t-2 border-t-accent" style={{ maxWidth: 760 }}>
            <AddressAutocomplete
              key={addressResetKey}
              placeholder={`Ex. : 12 rue des Minimes${defaultCommune ? `, ${defaultCommune}` : ""}`}
              onSelect={(a) => void analyzeSelected(a)}
              showModify={!lockedCommune}
              onModify={resetToSearch}
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
                    onClick={resetToSearch}
                    style={{ fontSize: 12.5, color: "var(--fg-4)", textDecoration: "underline", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  >
                    Modifier l&apos;adresse
                  </button>
                </div>
              </div>
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
            logementId={result.address?.id ?? ""}
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
