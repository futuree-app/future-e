import type { WizardAnswers } from "./types";
import type { WizardPreviewData } from "@/app/api/wizard-preview/route";

// LES SIGNAUX DU TEASER D'ACCUEIL, sans React : la logique de `WizardTeaser` vit ici pour que les tests
// éprouvent ce que les cartes DISENT, pas seulement le texte de la source (FUT-61).

export type SignalContent = {
  icon: string;
  headline: string;   // ce que ça change (humain, conversationnel)
  stat: string;       // chiffre principal
  precision?: string; // précision concrète (chiffre/contexte secondaire)
  source: string;     // source / méthode (micro-ligne)
};

/* ── Calcul des signaux ── */
export function computeSignals(
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

  /* SIGNAL TERRITORIAL RETIRÉ (FUT-61, 06/10/2026). La carte `communes_tension` n'existait que par le
     score composite legacy : il décidait si elle s'affichait (≥ 40/100), choisissait sa phrase
     (« fort » au-delà de 65, « modéré » en dessous) et s'affichait lui-même (« Score X/100 ·
     exposition élevée »). Aucun de ces seuils n'est une convention du produit. Sans le score, rien ne
     dit quoi écrire : la carte est retirée plutôt que reconstruite (la refonte du teaser est FUT-28). */

  /* Logement — CE QUE LE DOSSIER POURRA ÉTABLIR, JAMAIS UNE CLASSE DÉDUITE (19/09/2026).
     Ce bloc affichait « DPE estimé A–B » à partir du seul âge déclaré, sous une source ADEME.
     Le module Logement refuse cette déduction depuis toujours : sans diagnostic ATTRIBUÉ, il ne
     qualifie ni la performance ni le confort d'été. L'accueil offrait donc gratuitement ce que le
     produit payé s'interdit, et sur un logement que personne n'avait examiné. */
  if (answers.logement) {
    const typeLabel =
      answers.logement.type === "maison" ? "Maison"
      : answers.logement.type === "appartement" ? "Appartement"
      : "Logement atypique";
    signals.push({
      icon: "🏠",
      headline: "La performance de ce logement se lit sur son diagnostic, pas sur son âge.",
      stat: "À établir sur le document",
      precision: `${typeLabel} · votre dossier cherchera le diagnostic rattaché à cette adresse, et dira ce qu'il permet ou non de conclure.`,
      source: "Diagnostics de performance énergétique (ADEME)",
    });
  }

  /* Mobilité */
  if (answers.mobilite === "voiture") {
    signals.push({
      icon: "🚗",
      headline: "Vos trajets dépendent de la voiture : reste à savoir ce que ce territoire permet.",
      stat: "À mesurer sur la commune",
      precision: "Votre dossier lit la part des trajets faits autrement, la desserte en transports et l'accès aux gares.",
      source: "Mobilités INSEE, arrêts et gares recensés",
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
      headline: "Avant de signer, plusieurs points se vérifient et personne ne les rassemble pour vous.",
      stat: "Ce que votre dossier examinera",
      precision: "Exposition du sol au point précis, zonages applicables, diagnostics rattachés à l'adresse, trajectoire du climat.",
      source: "Géorisques, BRGM, ADEME, Météo-France",
    });
  }

  /* Repli si aucun signal. Il ne conclut RIEN sur l'exposition : il se déclenche quand cette première
     lecture n'a pas de donnée à montrer (pas de projection DRIAS, peu de réponses). L'ancienne phrase,
     « Aucune exposition majeure n'est ressortie… », traduisait en absence de risque le simple fait
     qu'aucun score legacy n'avait franchi un seuil (FUT-61). */
  if (signals.length === 0) {
    signals.push({
      icon: "📊",
      headline: "Cette première lecture ne fait pas ressortir de donnée spécifique à afficher ici.",
      stat: "Ce que votre dossier examinera",
      precision: "Le dossier examine ensuite le territoire et l'adresse plus en détail : la trajectoire du climat à 2050 et 2100, les risques recensés, la qualité de l'air, et ce que ces sources ne permettent pas d'établir.",
      source: "Météo-France, Géorisques, sources publiques",
    });
  }

  return signals.slice(0, 4);
}
