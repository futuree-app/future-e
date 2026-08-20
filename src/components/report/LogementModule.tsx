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
import { EnergieSection } from "@/components/report/logement/EnergieSection";
import { SinistraliteBlock } from "@/components/report/logement/SinistraliteSection";
import { InondationLectureBlock } from "@/components/report/logement/InondationSection";
import { RegulatoryStatusBlock } from "@/components/report/logement/RegulatorySection";
import { construireLectureInondation, zonageInondationDepuisPlans } from "@/lib/decision/inondation-lecture";
import type { CatnatInondation } from "@/lib/decision/catnat-evidence";
import { DecisionChecklist } from "@/components/report/logement/DecisionChecklist";
import type { UserProject } from "@/lib/user-project";
import { energyState, expositionArgileNotable } from "@/lib/decision/logement-coverage";
import type { LogementFacts } from "@/lib/decision/decision-fact";
import { evidenceAnchorId } from "@/lib/decision/evidence-targets";
import { EchelleVisual } from "@/components/report/EchelleVisual";
import { bindOrphans } from "@/lib/typography";

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
  project,
  catnatInondation = null,
}: {
  defaultCommune?: string | null;
  dossier: AddressDossierRow | null;
  rehydrateSource?: "auto" | "deeplink";
  /**
   * LE COMPTE D'ARRÊTÉS INONDATION DE LA COMMUNE, résolu par la page (artefact figé du dossier
   * d'abord, index courant en repli). Il n'est pas fetché ici et ne transite pas par
   * `/api/georisques-logement` : la route la plus coûteuse du produit n'a pas à embarquer l'index
   * national pour un entier, et surtout ce compte doit être CELUI QUI A ÉTÉ VENDU, donc celui de
   * l'artefact. `null` = non résolu ; la carte de réconciliation se replie alors sur deux lectures.
   */
  catnatInondation?: CatnatInondation | null;
  /**
   * LE PROJET DU COMPTE, transmis sans conversion (12/08/2026). Le module posait sa propre sonde
   * (« Que comptez-vous faire de ce logement ? ») à chaque visite, sans jamais persister la réponse,
   * alors que le compte la connaissait. Une seule fonction dérive la posture, `bucketDuProjet`, et
   * elle est appelée par les règles : ce composant ne convertit rien.
   */
  project: UserProject | null;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiResponse | null>(null);
  // Attribution du DPE au logement (cf. spec §2). Aucun DPE affiché comme « le vôtre » tant
  // qu'il n'est pas confirmé (auto ou par l'utilisateur).
  const [dpeStatus, setDpeStatus] = useState<
    "loading" | "not_found" | "selection_required" | "auto_confirmed" | "confirmed" | "rejected" | "error"
  >("loading");
  const [selectedDpe, setSelectedDpe] = useState<DpeRecord | null>(null);
  const [dpeCandidates, setDpeCandidates] = useState<DpeRecord[]>([]);
  // L'ÉCHEC D'UN GESTE DU LECTEUR SE VOIT. La sélection partait en `void persistDpe(...)`, sans
  // attente et sans lecture du résultat : l'écran affichait un diagnostic attribué que la base
  // n'avait pas reçu, et le rechargement suivant rendait l'ancien état sans explication.
  const [dpeBusy, setDpeBusy] = useState(false);
  const [dpeError, setDpeError] = useState<string | null>(null);
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
      const candidates = payload.dpeCandidates ?? [];
      setDpeCandidates(candidates);

      // Un dossier dont le diagnostic est déjà attribué le RESTAURE. Un dossier neuf dérive
      // l'attribution pour la première fois, ce qui est le seul moment où elle se calcule.
      //
      // « NEUF » SE LIT SUR `dpe_selection_at`, JAMAIS SUR LE SEUL STATUT `pending` (19/08/2026).
      // Le retour arrière ramène la ligne à `pending`, qui est bien l'état « rien n'est attribué ».
      // Mais `dpeAttributionStatus` rend `auto_confirmed` pour une maison à candidat unique : sans
      // cette condition, quelqu'un qui vient de dire « ce n'est pas le bon diagnostic » se voyait
      // réattribuer le même au rechargement suivant, sans un mot. Le geste du lecteur n'est pas
      // une absence de donnée à combler, et la date du geste est ce qui les distingue.
      if (row.dpe_selection_status !== "pending" || row.dpe_selection_at != null) {
        setSelectedDpe(row.selected_dpe_snapshot);
        setDpeStatus(RUNTIME_DPE_STATUS[row.dpe_selection_status] ?? "not_found");
        // `pending` restauré (donc un retrait volontaire) rouvre la sélection sans rien attribuer :
        // `RUNTIME_DPE_STATUS` le rend déjà en `selection_required`.
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

  /**
   * Persiste une sélection de diagnostic. Le corps ne porte QUE le numéro : le serveur relit la
   * fiche à la source et fige la sienne, si bien qu'aucune valeur venue du navigateur n'entre dans
   * un dossier payant.
   *
   * Rend `true` seulement sur confirmation du serveur.
   */
  async function persistDpe(
    status: "auto_confirmed" | "user_confirmed" | "not_in_list" | "pending",
    dpe: DpeRecord | null,
    source: "liste" | "numero" = "liste",
  ): Promise<boolean> {
    if (!dossier) return false;
    try {
      const res = await fetch("/api/logement-dpe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // LA PROVENANCE VOYAGE AVEC LE NUMÉRO, parce qu'elle décide de la VÉRIFICATION que le
        // serveur applique : appartenance à la liste de l'adresse, ou rapprochement d'adresse pour
        // un diagnostic apporté par son numéro. Elle n'assouplit rien, elle dit quoi contrôler.
        body: JSON.stringify({ dossierId: dossier.id, status, dpeId: dpe?.id_dpe ?? null, source }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * LE GESTE DU LECTEUR SUR SON DIAGNOSTIC, dans les deux sens : désigner, corriger, retirer.
   *
   * Optimiste à l'affichage, honnête à l'échec. L'état antérieur est gardé et rétabli si le serveur
   * refuse, avec un message : le diagnostic gouverne l'étiquette, les coûts et les échéances d'un
   * rapport acheté, et laisser croire qu'il est enregistré quand il ne l'est pas est le seul défaut
   * qu'on ne peut pas rattraper au chargement suivant.
   */
  async function appliquerSelection(
    status: "user_confirmed" | "not_in_list" | "pending",
    dpe: DpeRecord | null,
    source: "liste" | "numero" = "liste",
  ) {
    const statutAvant = dpeStatus;
    const dpeAvant = selectedDpe;
    setDpeBusy(true);
    setDpeError(null);
    setSelectedDpe(dpe);
    setDpeStatus(RUNTIME_DPE_STATUS[status]);
    const ok = await persistDpe(status, dpe, source);
    if (!ok) {
      setSelectedDpe(dpeAvant);
      setDpeStatus(statutAvant);
      setDpeError("Ce choix n'a pas pu être enregistré. Vérifiez votre connexion et réessayez.");
    }
    setDpeBusy(false);
  }

  // Le DPE « du logement » = uniquement le choix attribué (jamais un candidat non confirmé).
  const dpe = (dpeStatus === "auto_confirmed" || dpeStatus === "confirmed") ? selectedDpe : null;
  // Lecture thermique (Face 1) : dérivée du DPE attribué uniquement (sinon C_NO_DATA).
  const thermalEvidence = deriveThermalEvidence(dpe);
  const communeName = result?.address?.city ?? defaultCommune ?? "cette commune";
  const dpeYear = dpe?.date_dpe ? dpe.date_dpe.slice(0, 4) : null;
  // Synthèse artefact : prête dès que l'analyse est là et que l'attribution a un RÉSULTAT, quel
  // qu'il soit.
  //
  // ÉLARGI LE 31/07/2026. La liste excluait `selection_required` et `rejected`, parce que le
  // rapport ne se rendait pas dans ces états : on attendait le choix du lecteur. Depuis que le
  // rapport s'affiche sans attribution, cette exclusion aurait privé de lecture rédigée exactement
  // le cas le plus fréquent en ville, celui où l'adresse porte plusieurs diagnostics et où
  // personne ne peut désigner le sien. « Non attribué » est un résultat, pas une attente.
  //
  // Seuls `loading` et `error` restent non terminaux : là, on ne sait pas encore.
  const dpeTerminal = dpeStatus !== "loading" && dpeStatus !== "error";
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
    // Ne sert qu'à SITUER une absence de sinistre indemnisé (cf. `sinistralitePourRecit`) : sans
    // absence, il n'entre pas dans le payload et ne change donc aucun cache existant.
    catnatInondationCount: catnatInondation?.count ?? null,
    communeData: result?.communeData,
    // Le payload ne les retient QUE si rien n'est attribué (cf. `buildSynthesisPayload`) : dès
    // qu'un diagnostic est confirmé, il devient le sujet et les autres n'ont plus rien à dire.
    dpeCandidates,
  };
  const georisques = result?.georisques?.parcel ?? result?.georisques?.address;
  // Les risques du bâti au grain point (cavités, mouvements de terrain) et le résidu communal sont
  // désormais structurés côté serveur (`pointHazards`), plus l'ancienne ligne « autres risques »
  // aplatie ici. Les libellés PPRN sont portés par « Statut réglementaire à cette adresse ».
  const pointHazards = result?.pointHazards ?? null;
  // LES FAITS DE DÉCISION DU LOGEMENT, tels que le dossier les lit.
  //
  // Ce bloc dérivait ses propres booléens des mêmes sources (`/moyen|fort|élev/i` recopié ici, un
  // `.length > 0` là), en parallèle de l'adaptateur du moteur : deux établissements du même fait,
  // dont rien n'aurait dit lequel avait raison. La couverture par famille est désormais dérivée
  // UNE fois, côté serveur, par la fonction que le moteur emploie (`result.decision`), et le
  // module ne fait plus que la lire.
  //
  // Ce qui reste calculé ici est ce que le serveur ne peut pas savoir : le DPE ATTRIBUÉ (le choix
  // du lecteur, persisté sur le dossier) et ce qui s'en déduit.
  // LA LECTURE DE L'INONDATION, composée des trois sources DÉJÀ présentes à l'écran.
  //
  // Le zonage est lu sur `regulatoryPlans`, c'est-à-dire sur la MÊME liste que le bloc « Statut
  // réglementaire à cette adresse » juste au-dessus : les deux ne peuvent pas dire deux choses
  // différentes du même point. `undefined` (route en erreur, ou champ absent d'une réponse
  // ancienne) devient « indisponible », jamais « aucun zonage ».
  const lectureInondation = result?.sinistralite
    ? construireLectureInondation({
        zonage: zonageInondationDepuisPlans(georisques ? (georisques.regulatoryPlans ?? []) : null),
        catnat: catnatInondation,
        onrn: result.sinistralite.inondation,
      })
    : null;
  const coverage = result?.decision ?? null;
  const logementFacts: LogementFacts | null = coverage
    ? {
        dpe: energyState(dpe?.etiquette_dpe ?? null),
        dpeLabel: dpe?.etiquette_dpe ?? null,
        confortEteInsuffisant: thermalEvidence.indicator === "insuffisant",
        // L'adresse porte des diagnostics et aucun n'est attribué : il y a un document à réclamer.
        // Distinct de « aucun diagnostic à cette adresse », où il n'y a rien à demander.
        diagnosticNonAttribue: !dpe && dpeCandidates.length > 0,
        rga: coverage.rga.coverage, expositionBati: expositionArgileNotable(coverage.rga.label),
        pprn: coverage.pprn.coverage, zoneReglementee: coverage.pprn.count > 0, pprnLabel: coverage.pprn.label,
        cavites: coverage.cavites.coverage, caviteProche: coverage.cavites.count > 0,
        patrimoine: coverage.patrimoine.coverage, perimetrePatrimonial: coverage.patrimoine.count > 0,
        sinistralite: coverage.sinistralite.coverage, sinistraliteActive: coverage.sinistralite.active,
        addressLabel: result?.address?.label ?? "cette adresse",
      }
    : null;

  return (
    <div className="min-h-screen bg-canvas text-label relative overflow-hidden" style={{ fontFamily: "var(--font-sans)" }}>
      <div className="fixed top-[-160px] left-[-130px] w-[520px] h-[520px] rounded-full bg-accent/[0.10] blur-[100px] opacity-32 pointer-events-none z-0" />
      <div className="fixed bottom-[-100px] right-[-80px] w-[400px] h-[400px] rounded-full bg-orange/[0.08] blur-[88px] opacity-24 pointer-events-none z-0" />

      {/* « Mes biens » vit dans la navigation globale depuis le 13/08/2026 : le répéter en bouton
          d'action, à quelques centimètres, était un doublon visible. Le CTA porte l'action que cet
          écran n'offre pas ailleurs. */}
      <Navbar ctas={{ secondary: { href: "/rapport", label: "Mon rapport" }, primary: { href: "/dossier", label: "Analyser une adresse" } }} />

      <div className="relative z-[2] max-w-[1100px] mx-auto px-5 sm:px-7 pb-24">
        <section className="py-20 grid lg:grid-cols-[minmax(0,1fr)_280px] lg:grid-rows-[auto_1fr] lg:gap-x-8 lg:items-start">
          <div className="lg:col-start-1 lg:row-start-1">
            <div className="flex items-center gap-2.5 font-mono text-[11px] tracking-[0.12em] uppercase text-accent mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
              {/* RANG 03, ET NON 02 (12/08/2026) : « Autour de l'adresse » porte le 02, et les deux
                  modules affichaient le même numéro. L'ordre canonique est celui de `PRODUCT_MODULES`
                  (Territoire, Autour, Logement), et le rang porte l'identité de l'échelle depuis que
                  la couleur et l'icône ont été retirées : deux 02 rendaient cette identité fausse. */}
              Module 03 · Logement
            </div>
            <h1 className="font-[var(--weight-display)] text-[length:var(--text-display)] leading-[1.08] tracking-[-1.2px] mb-6 text-label" style={{ fontFamily: "var(--font-serif)" }}>
              Ce logement, lu à son adresse.<br />
              {/* « ENTOURAGE » A QUITTÉ LA PROMESSE (12/08/2026) : ce module s'arrête aux murs
                  depuis la bascule 6 -> 3 modules, et l'entourage vit dans `/rapport/autour`. Le
                  hero promettait donc ce que la page déclare ensuite ne pas faire. */}
              <span className="italic text-accent">Énergie, risques, bâti.</span>
            </h1>
            <p className="text-[17px] leading-[1.72] text-muted mb-0">
              {bindOrphans("Une adresse suffit. Vous lisez ce qui pèse vraiment sur ce logement : sa performance énergétique, ce à quoi son adresse l'expose, et ce qu'il reste à demander avant de décider. Le secteur autour de l'adresse a son propre module.")}
            </p>
          </div>
          <EchelleVisual
            active="logement"
            className="hidden lg:block lg:w-full lg:mt-7 lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:justify-self-end"
          />
          <div className="mt-8 lg:col-start-1 lg:row-start-2">
            <div className="flex gap-3 flex-wrap">
              <Link href="/rapport" prefetch={false} className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[var(--bg-elev-2)] text-muted text-[14px] no-underline border border-[var(--border-1)]">
                Retour au hub
              </Link>
              <Link href="/rapport/quartier" className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[var(--bg-elev-2)] text-muted text-[14px] no-underline border border-[var(--border-1)]">
                Voir le module Territoire
              </Link>
            </div>
          </div>
        </section>

        <div className="border-t border-[var(--border-1)]" />

        <section className="pt-14">
          <div className="mb-8">
            <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-ghost mb-2">Le bien de ce dossier</p>
            <h2 className="font-[var(--weight-title)] text-[length:var(--text-title)] leading-[1.18] tracking-[-0.5px] text-label" style={{ fontFamily: "var(--font-serif)" }}>
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
                className="inline-flex items-center gap-2 text-[length:var(--text-dense)] text-muted no-underline"
              >
                Analyser un autre bien
              </Link>
            )}
          </div>
        </section>

      {/* ── RÉSULTATS : lecture en 5 beats (spec 5a) ──
          LE RAPPORT NE SE MASQUE PLUS DERRIÈRE LA SÉLECTION DU DIAGNOSTIC (31/07/2026). Un écran
          « Précisez votre logement » s'interposait ici quand plusieurs diagnostics existaient à
          l'adresse, pour que le Passeport s'affiche rempli (décision porteur, 5a). Renversé :
          l'usage réel montre que l'exigence empêche l'acheteur d'atteindre la valeur, puisqu'il
          ignore l'étage et le numéro de porte du bien qu'il visite. La reconnaissance vit
          désormais DANS la section Énergie, repliée, à côté de ce que la base dit de l'adresse. */}
      {result && (
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
              candidates={dpeCandidates}
              dossierId={dossier?.id ?? ""}
              busy={dpeBusy}
              erreur={dpeError}
              onPick={(d) => { void appliquerSelection("user_confirmed", d); }}
              onPickParNumero={(d) => { void appliquerSelection("user_confirmed", d, "numero"); }}
              onNotInList={() => { void appliquerSelection("not_in_list", null); }}
              // LE RETOUR EN ARRIÈRE S'ÉCRIT, LUI AUSSI. Il ne faisait que remettre l'état local :
              // la ligne gardait son ancien statut, et le diagnostic corrigé revenait au
              // rechargement. `pending` est le seul statut qui rouvre vraiment la sélection.
              onReselect={() => { void appliquerSelection("pending", null); }}
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

            {/* LA RÉCONCILIATION SE LIT ENTRE LES DEUX BLOCS QUI LA RENDAIENT NÉCESSAIRE : le
                statut réglementaire au point vient d'être lu, les sinistres indemnisés viennent
                juste après. C'est à cet endroit précis que le lecteur fabriquait la contradiction
                (premier test réel, 16/08/2026, JL-13). */}
            {lectureInondation && <InondationLectureBlock lecture={lectureInondation} />}

            {result.sinistralite && (
              <SinistraliteBlock
                sinistralite={result.sinistralite}
                commune={result.address?.city ?? null}
                lectureInondationRendue={Boolean(lectureInondation)}
              />
            )}
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
                {/* LE LIEN PORTE LE BIEN LU (revue du 11/08/2026). Sans lui, un compte à plusieurs biens
                    atterrissait sur le sélecteur : le lecteur venait de lire CE logement, et on lui
                    redemandait lequel il voulait. */}
                <Link href={dossier?.id ? `/rapport/autour?dossierId=${encodeURIComponent(dossier.id)}` : "/rapport/autour"} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg no-underline text-[length:var(--text-dense)] w-fit" style={{ color: "var(--green)", border: "1px solid color-mix(in srgb, var(--green) 25%, transparent)", background: "color-mix(in srgb, var(--green) 8%, transparent)" }}>
                  Ouvrir Autour de l&apos;adresse →
                </Link>
              </div>
            </GlassCard>
          </ReportSection>

          {/* Beat 5 — À vérifier avant de décider : et moi, je fais quoi ? */}
          <div style={{ display: "grid", gap: 16 }}>
            {/* LA SONDE A DISPARU (12/08/2026) : elle redemandait à chaque visite une réponse que le
                compte porte déjà, et ne la persistait jamais. L'objectif et l'intention se déclarent
                au seul endroit qui édite le cadrage, `/rapport#projet`. L'événement PostHog
                `logement_projet_declare` disparaît avec elle. */}
            {/* Sans la couverture par famille (réponse d'erreur de la route), il n'y a pas de
                faits à évaluer : le bloc disparaît, plutôt que d'annoncer « aucun point à
                vérifier » sur la foi d'une absence de données. */}
            {logementFacts && <DecisionChecklist facts={logementFacts} project={project} />}
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
