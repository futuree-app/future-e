import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { readLatestArtifact } from "@/lib/server/decision-artifact-store";
import { lireVosLieux } from "@/lib/decision/vos-lieux-lecture";
import type { LieuAffiche } from "@/lib/decision/vos-lieux";

// Le chargement de « Vos lieux » côté serveur. La logique vit dans `lib/decision/vos-lieux-lecture.ts`,
// testable sans `server-only` ; ici, seulement le branchement sur la relecture paginée du hub.
export function chargerVosLieux(sb: SupabaseClient, userId: string): Promise<LieuAffiche[]> {
  return lireVosLieux(sb, userId, readLatestArtifact);
}
