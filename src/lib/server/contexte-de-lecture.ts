import "server-only";
import { headers } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getDossier } from "@/lib/address-dossier-store";
import { communeParent } from "@/lib/plm";
import { HEADER_URL } from "@/proxy";
import { dossierIdDeLaPage } from "@/lib/dossier-de-la-page";

// ════════════════════════════════════════════════════════════════════════════════════════════
// CE QUE LE LECTEUR EST EN TRAIN DE LIRE, DÈS LE PREMIER RENDU.
//
// ── LE DÉFAUT QUE CE MODULE FERME ────────────────────────────────────────────────────────────
// Le contexte affiché (AskFuture, les traceurs) venait du PROFIL, donc du dernier bien persisté.
// Sur une ouverture directe, la page montrait le logement nantais sous « Une question sur La
// Rochelle ? », et la question partait vers le mauvais territoire. Persister après montage ne
// corrige pas un arbre déjà rendu : il fallait que le contexte vienne de la PAGE.
//
// ── LA RÈGLE ─────────────────────────────────────────────────────────────────────────────────
// Sur une page d'adresse, le dossier chargé EST la source du contexte affiché. Le profil ne sert
// qu'à retenir ce contexte pour les navigations futures. Les deux ne se contredisent plus, parce
// qu'ils ne répondent plus à la même question.
//
// ── POURQUOI L'URL PASSE PAR UN EN-TÊTE ──────────────────────────────────────────────────────
// Un layout ne reçoit ni `params` ni `searchParams` de la page qu'il enveloppe, et `AskFutureMount`
// vit dans le layout du compte. Le proxy pose donc le chemin demandé dans un en-tête de requête
// (`HEADER_URL`), lisible par n'importe quel Server Component de l'arbre.
//
// ── CE QU'IL NE FAIT PAS ─────────────────────────────────────────────────────────────────────
// Aucune écriture, aucun droit accordé : `getDossier` filtre par `user_id` et par la RLS, donc un
// identifiant fabriqué dans l'URL ne donne accès à rien. Rend `null` hors des pages d'adresse, et
// l'appelant retombe alors sur le territoire du profil, qui est le bon repère ailleurs.
// ════════════════════════════════════════════════════════════════════════════════════════════

export type ContexteDeLecture = {
  inseeCode: string;
  communeName: string | null;
  dossierId: string;
};

export async function contexteDeLecture(
  sb: SupabaseClient, userId: string,
): Promise<ContexteDeLecture | null> {
  const brut = (await headers()).get(HEADER_URL);
  const dossierId = dossierIdDeLaPage(brut);
  if (!dossierId) return null;

  const dossier = await getDossier(sb, userId, dossierId).catch(() => null);
  if (!dossier) return null;

  // Grain COMMUNE, comme partout : `dossier.insee` est le code local, donc l'arrondissement pour
  // PLM, et poser 75107 ferait lire « Paris 7e » aux écrans de commune.
  return {
    inseeCode: communeParent(dossier.insee),
    communeName: dossier.city,
    dossierId: dossier.id,
  };
}
