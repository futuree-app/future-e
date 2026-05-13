"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { LogementAge, WizardAnswers } from "./types";
import type { WizardPreviewData } from "@/app/api/wizard-preview/route";

type SignalContent = {
  icon: string;
  headline: string;   // ce que ça change (humain, conversationnel)
  stat: string;       // chiffre principal
  precision?: string; // précision concrète (chiffre/contexte secondaire)
  source: string;     // source / méthode (micro-ligne)
};

/* ── Estimation DPE par tranche d'âge ── */
function dpeFromAge(age: LogementAge | null): { headline: string; classe: string; ageLabel: string } {
  switch (age) {
    case "recent":
      return {
        headline: "Votre logement est probablement bien isolé selon les normes récentes.",
        classe: "A–B",
        ageLabel: "construit après 2016",
      };
    case "middle":
      return {
        headline: "Votre logement a une performance énergétique moyenne, des travaux peuvent être utiles.",
        classe: "C–D",
        ageLabel: "âge entre 10 et 50 ans",
      };
    case "old":
      return {
        headline: "Votre logement est probablement énergivore et difficile à chauffer ou rafraîchir.",
        classe: "E–G",
        ageLabel: "construit avant 1976",
      };
    default:
      return {
        headline: "Sans l'âge de votre logement, on s'appuie sur la moyenne du parc français.",
        classe: "D–E",
        ageLabel: "âge non renseigné",
      };
  }
}

const SLUG_LABELS: Record<string, string> = {
  canicule: "Canicule",
  submersion: "Submersion marine",
  feux: "Feux de forêt",
  cadmium: "Pollution agricole",
  "dependance-auto": "Dépendance automobile",
  secheresse: "Sécheresse",
};

const SLUG_HEADLINES_FORT: Record<string, string> = {
  canicule: "Les vagues de chaleur deviendront un risque récurrent ici.",
  submersion: "Votre commune est nettement exposée à la submersion marine.",
  feux: "Le risque d'incendie de forêt est élevé dans votre territoire.",
  cadmium: "Les sols agricoles autour de chez vous présentent une pollution notable.",
  "dependance-auto": "Votre territoire dépend fortement de la voiture pour vivre au quotidien.",
  secheresse: "La ressource en eau locale est sous tension croissante.",
};

const SLUG_HEADLINES_MODERE: Record<string, string> = {
  canicule: "Les épisodes de chaleur devraient s'intensifier ici dans les prochaines décennies.",
  submersion: "Une partie de votre commune est exposée à la submersion marine.",
  feux: "Votre territoire connaîtra ponctuellement un risque d'incendie à surveiller.",
  cadmium: "Quelques sols agricoles autour de chez vous montrent une pollution mesurable.",
  "dependance-auto": "Votre territoire reste assez dépendant de la voiture pour les trajets du quotidien.",
  secheresse: "La ressource en eau locale connaît des tensions saisonnières.",
};

const SLUG_SOURCES: Record<string, string> = {
  canicule: "Projections DRIAS · Météo-France",
  submersion: "IGN (côtier) · Géorisques (fluvial)",
  feux: "Base Prométhée · DREAL",
  cadmium: "GisSol · RMQS (qualité des sols agricoles)",
  "dependance-auto": "ADEME · INSEE RP (taux de motorisation)",
  secheresse: "BRGM · Agences de l'eau",
};

/* Seuils d'intensité d'exposition (sur le score 0–100) */
const SCORE_FORT = 65;
const SCORE_MODERE = 40;

/* ── Signal card — 4 lignes : headline / stat / precision / source ── */
function Signal({ icon, headline, stat, precision, source }: SignalContent) {
  return (
    <div className="rounded-[1.7rem] bg-white/[0.03] border border-white/[0.07]" style={{ padding: "1.75rem 2rem" }}>
      <div className="flex items-start gap-4">
        <span
          className="shrink-0 text-[20px] leading-none"
          style={{ marginTop: "0.15rem" }}
          aria-hidden
        >
          {icon}
        </span>
        <div className="min-w-0 flex flex-col gap-1.5">
          {/* Ligne 1 — ce que ça change */}
          <p className="text-[16px] text-label leading-[1.4] font-medium text-balance">
            {headline}
          </p>
          {/* Ligne 2 — chiffre principal */}
          <p className="text-[15px] text-accent font-semibold leading-[1.4]">
            {stat}
          </p>
          {/* Ligne 3 — précision concrète */}
          {precision && (
            <p className="text-[14px] text-muted leading-[1.4]">
              {precision}
            </p>
          )}
          {/* Micro-ligne — source / méthode */}
          <p className="font-mono text-[11px] text-ghost/75 tracking-[0.06em] leading-[1.4]" style={{ marginTop: "0.4rem" }}>
            {source}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Calcul des signaux ── */
function computeSignals(
  data: WizardPreviewData | null,
  answers: WizardAnswers,
  ville: string,
): SignalContent[] {
  const signals: SignalContent[] = [];

  /* Canicule (DRIAS) */
  if (data?.drias?.canicule_gwl20 !== null && data?.drias?.canicule_gwl20 !== undefined) {
    const d = data.drias!;
    const tropicales = d.nuits_tropicales_gwl20;
    signals.push({
      icon: "🌡",
      headline: `Les étés deviendraient nettement plus difficiles à ${ville} d'ici 2050.`,
      stat: `${d.canicule_gwl20} jours très chauds par an`,
      precision: tropicales !== null && tropicales > 0
        ? `et environ ${tropicales} nuits tropicales`
        : (d.delta_canicule !== null && d.delta_canicule > 0
          ? `soit +${d.delta_canicule} jours par rapport à un scénario climatique modéré`
          : undefined),
      source: "Projection DRIAS · horizon +2°C (2050)",
    });
  } else if (answers.sante.includes("Sensibilité à la chaleur") || answers.sante.includes("Asthme / Troubles respiratoires")) {
    signals.push({
      icon: "🌡",
      headline: "Votre profil de santé est plus exposé aux extrêmes climatiques.",
      stat: "Vagues de chaleur et air dégradé à surveiller",
      precision: "L'augmentation des canicules pèsera davantage sur votre quotidien.",
      source: "Estimation basée sur vos sensibilités déclarées",
    });
  }

  /* Signal territorial — uniquement si exposition au moins modérée (≥ 40/100) */
  if (data?.tensions && data.tensions.length > 0) {
    const top = data.tensions[0];
    const score = top.ind_exposition !== null ? Math.round(top.ind_exposition) : top.score;

    if (score >= SCORE_MODERE) {
      const isFort = score >= SCORE_FORT;
      const slugLabel = SLUG_LABELS[top.slug] ?? top.slug;
      const headline = isFort
        ? (SLUG_HEADLINES_FORT[top.slug] ?? `Exposition élevée à ${slugLabel.toLowerCase()} sur votre commune.`)
        : (SLUG_HEADLINES_MODERE[top.slug] ?? `Exposition modérée à ${slugLabel.toLowerCase()} à surveiller.`);
      const intensityLabel = isFort ? "exposition élevée" : "exposition modérée";

      signals.push({
        icon: "📍",
        headline,
        stat: `Score ${score}/100 — ${intensityLabel}`,
        precision: data.tensions.length > 1
          ? `${data.tensions.length} signaux climatiques référencés pour ${ville}.`
          : (isFort ? "Signal officiellement recensé dans votre territoire." : "Signal à surveiller dans votre territoire."),
        source: SLUG_SOURCES[top.slug] ?? "Données publiques françaises",
      });
    }
  }

  /* Logement / DPE */
  if (answers.logement) {
    const dpe = dpeFromAge(answers.logement.age);
    const typeLabel =
      answers.logement.type === "maison" ? "Maison"
      : answers.logement.type === "appartement" ? "Appartement"
      : "Logement atypique";
    signals.push({
      icon: "🏠",
      headline: dpe.headline,
      stat: `DPE estimé ${dpe.classe}`,
      precision: `${typeLabel} · ${dpe.ageLabel}`,
      source: answers.logement.age === "old"
        ? "Estimation issue du parc français · Loi Climat 2034"
        : "Estimation issue du parc français (ADEME)",
    });
  }

  /* Mobilité */
  if (answers.mobilite === "voiture") {
    signals.push({
      icon: "🚗",
      headline: "Votre dépendance à la voiture pèsera de plus en plus dans votre budget.",
      stat: "Forte exposition aux coûts du carburant et au carbone",
      precision: "ZFE, malus écologique et tarification carbone à anticiper.",
      source: "Méthode futur·e · données ADEME",
    });
  } else if (answers.sante.length > 0 && !answers.sante.includes("Aucune sensibilité particulière")) {
    const filtered = answers.sante.filter((s) => s !== "Aucune sensibilité particulière");
    signals.push({
      icon: "🫁",
      headline: "Plusieurs sensibilités de santé à surveiller dans votre environnement.",
      stat: `${filtered.length} sensibilité${filtered.length > 1 ? "s" : ""} identifiée${filtered.length > 1 ? "s" : ""}`,
      precision: filtered.slice(0, 3).join(" · "),
      source: "Sur la base de vos réponses",
    });
  } else if (answers.projets === "achat") {
    signals.push({
      icon: "🏗",
      headline: "Acheter aujourd'hui demande d'anticiper le climat pour ne pas se tromper.",
      stat: "Achat à risque climatique",
      precision: "Assurabilité, décote DPE, exposition territoriale à évaluer avant signature.",
      source: "Méthode futur·e",
    });
  }

  /* Fallback si aucun signal */
  if (signals.length === 0) {
    signals.push({
      icon: "📊",
      headline: `Pour activer vos signaux locaux, renseignez votre commune dans la liste de l'étape 1.`,
      stat: `Profil de ${ville} en attente`,
      precision: "Données DRIAS, risques officiels et qualité de l'air seront chargés automatiquement.",
      source: "Sources publiques françaises",
    });
  }

  return signals.slice(0, 4);
}

export function WizardTeaser({
  answers,
  context: _context,
  inseeCode,
  onRestart,
}: {
  answers: WizardAnswers;
  context: string | null;
  inseeCode: string | null;
  onRestart: () => void;
}) {
  const ville = answers.quartier || "votre commune";

  const [data, setData] = useState<WizardPreviewData | null>(null);
  const [loadedInsee, setLoadedInsee] = useState<string | null>(null);

  useEffect(() => {
    if (!inseeCode) return;
    fetch(`/api/wizard-preview?insee=${inseeCode}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json: WizardPreviewData | null) => {
        setData(json);
        setLoadedInsee(inseeCode);
      })
      .catch(() => {})
  }, [inseeCode]);

  const loading = Boolean(inseeCode) && loadedInsee !== inseeCode;
  const signals = computeSignals(data, answers, ville);
  // Affiche 2 signaux dévoilés si on en a au moins 3, sinon 1 seul
  const visibleCount = signals.length >= 3 ? 2 : 1;
  const visibleSignals = signals.slice(0, visibleCount);
  const lockedSignals = signals.slice(visibleCount);
  const hasMultipleSignals = signals.length > 1;

  return (
    <div className="wizard-step flex flex-col gap-10 md:gap-12">

      {/* Headline — état chargement OU résultat */}
      <div className="max-w-[56rem] flex flex-col gap-6">
        <p className="font-mono text-[11px] tracking-[0.16em] uppercase text-accent">
          Aperçu personnalisé · {ville}
        </p>
        {loading ? (
          <>
            <h2
              className="font-semibold text-[clamp(2rem,4.2vw,3.8rem)] leading-[1.04] tracking-[-0.03em] text-label text-balance"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              Analyse de{" "}
              <span className="italic text-accent">votre exposition</span>{" "}
              en cours…
            </h2>
            <div className="relative h-[3px] max-w-[24rem] rounded-full bg-white/[0.06] overflow-hidden mt-2">
              <div
                className="absolute top-0 h-full bg-accent rounded-full"
                style={{ animation: "wizard-loading-bar 1.5s ease-in-out infinite" }}
              />
            </div>
            <p className="text-[14px] text-muted/70 leading-relaxed mt-1">
              Nous croisons vos réponses avec les données DRIAS et les risques officiels.
            </p>
          </>
        ) : (
          <h2
            className="font-semibold text-[clamp(2rem,4.2vw,3.8rem)] leading-[1.04] tracking-[-0.03em] text-label text-balance"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Votre profil présente{" "}
            <span className="italic text-accent">
              {hasMultipleSignals ? `${signals.length} signaux d'exposition` : "un signal d'exposition"}
            </span>{" "}
            {hasMultipleSignals ? "identifiés." : "identifié."}
          </h2>
        )}
      </div>

      {/* Signals — 1 ou 2 visibles selon le nombre total, reste flouté */}
      {!loading && (
        <div className="flex flex-col gap-4">
          {/* Signaux dévoilés */}
          {visibleSignals.map((s, i) => (
            <Signal key={`v-${i}`} {...s} />
          ))}

          {/* Signaux suivants — floutés avec verrou */}
          {lockedSignals.length > 0 && (
            <div className="relative mt-1 rounded-2xl overflow-hidden">
              <div
                className="flex flex-col gap-3 select-none pointer-events-none"
                style={{ filter: "blur(5px)", opacity: 0.7 }}
                aria-hidden
              >
                {lockedSignals.map((s, i) => (
                  <Signal key={i} {...s} />
                ))}
              </div>
              <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(6,8,18,0.45)" }}>
                <span className="font-mono text-[11px] tracking-[0.12em] uppercase text-muted border border-white/[0.12] rounded-full bg-canvas/85" style={{ padding: "0.75rem 1.5rem" }}>
                  {lockedSignals.length} signa{lockedSignals.length > 1 ? "ux" : "l"} verrouillé{lockedSignals.length > 1 ? "s" : ""}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Paywall */}
      <div
        className="wizard-panel-lg rounded-3xl border border-accent/[0.16] relative overflow-hidden"
        style={{ background: "rgba(251,146,60,0.03)" }}
      >
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-accent/[0.07] blur-3xl pointer-events-none" />
        <div className="flex flex-col gap-7 md:gap-8">
          <div className="flex flex-col gap-4 md:gap-5">
            <p className="font-mono text-[11px] tracking-[0.16em] uppercase text-accent">
              Rapport complet
            </p>
            <p
              className="max-w-[20ch] text-[clamp(1.85rem,3.4vw,2.45rem)] font-normal text-label leading-[1.08] tracking-[-0.025em] text-balance"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              Accédez à votre analyse complète, vos 6 modules et votre guide d&apos;action personnalisé.
            </p>
            <p className="max-w-[42rem] text-[15px] text-muted leading-7">
              Sourcé sur les données publiques françaises. Personnalisé sur votre profil. Sans publicité.
            </p>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-end md:gap-6">
            <div className="flex items-end gap-1.5">
              <span
                className="text-[56px] text-label leading-none tracking-[-0.03em]"
                style={{ fontFamily: "'Instrument Serif', serif" }}
              >
                14
              </span>
              <span className="mb-2 text-[24px] text-ghost">€</span>
            </div>
            <div className="flex flex-col gap-1 pb-1">
              <p className="font-mono text-[11px] text-ghost tracking-[0.04em] leading-relaxed">paiement unique</p>
              <p className="font-mono text-[11px] text-ghost tracking-[0.04em] leading-relaxed">ou 9 €/mois en Suivi</p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <Link
              href="/paiement"
              className="wizard-cta flex w-full gap-2 rounded-xl bg-accent text-canvas text-[15px] no-underline transition-all duration-300 hover:bg-accent/90 hover:shadow-lg hover:shadow-accent/20 active:scale-[0.98]"
            >
              Débloquer mon rapport complet — 14€
            </Link>
            <p className="text-center font-mono text-[11px] text-ghost tracking-[0.04em] leading-relaxed">
              Les 14 € sont déductibles si vous passez en Suivi mensuel
            </p>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onRestart}
        className="text-center font-mono text-[11px] tracking-[0.08em] uppercase text-ghost hover:text-muted transition-colors duration-200 py-2"
      >
        Recommencer depuis le début
      </button>

    </div>
  );
}
