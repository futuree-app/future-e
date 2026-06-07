import "server-only";
import { gatherCommuneEnrichment } from "@/lib/commune-enrichment";
import { deriveQuartierSources } from "@/lib/quartier-signals";

export type QuartierPreviewCard = { titre: string; constat: string };
export type QuartierPreview = { cards: QuartierPreviewCard[]; sources: string[] };

// Garde-fou latence : une paywall doit rester rapide. L'enrichissement fait des appels
// externes (DRIAS, Géorisques…) ; on plafonne l'attente et, au-delà, on rend null (la page
// masque le bloc aperçu). Jamais d'erreur bloquante, jamais de rendu retardé au-delà du cap.
const PREVIEW_TIMEOUT_MS = 1200;

// Aperçu RÉEL du module Quartier pour un INSEE. Cartes déterministes gatées sur la présence
// de la donnée (pas de fabrication, pas de chiffre). null = pas d'aperçu exploitable OU trop
// lent -> la page masque le bloc. cf. spec 2026-06-07-paywall-territoire.
export async function getQuartierPreview(insee: string): Promise<QuartierPreview | null> {
  const enrichment = await Promise.race([
    gatherCommuneEnrichment(insee).catch(() => null),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), PREVIEW_TIMEOUT_MS)),
  ]);
  if (!enrichment) return null;

  const georisques = enrichment.georisques ?? null;
  const catnat = enrichment.catnat ?? null;
  const sources = deriveQuartierSources(enrichment, georisques, catnat, "gwl30");

  const cards: QuartierPreviewCard[] = [];

  if (enrichment.drias?.commune?.s) {
    cards.push({
      titre: "Le climat à venir",
      constat:
        "La trajectoire climatique de cette commune est projetée à plusieurs horizons : étés plus chauds, saisons qui se déforment.",
    });
  }
  if (georisques?.flags?.flood || georisques?.flags?.marineSubmersion || (catnat && catnat.total > 0)) {
    cards.push({
      titre: "Inondation et catastrophes naturelles",
      constat:
        "Le territoire porte un historique de catastrophes naturelles reconnues, que le rapport replace dans son contexte.",
    });
  }
  if (enrichment.vigieau?.maxLevel || enrichment.eau?.drought) {
    cards.push({
      titre: "Sécheresse et ressource en eau",
      constat:
        "La ressource en eau et les sols connaissent des tensions, suivies par les restrictions et l'état des nappes.",
    });
  }
  if (georisques) {
    cards.push({
      titre: "Les risques du secteur",
      constat:
        "Les risques naturels et technologiques recensés autour de l'adresse sont passés en revue, un par un.",
    });
  }

  if (cards.length === 0) return null;
  return { cards: cards.slice(0, 4), sources };
}
