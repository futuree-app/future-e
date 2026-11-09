import "server-only";
import { getCurrentSessionUser } from "@/lib/user-account";
import { getDossier } from "@/lib/address-dossier-store";
import { loadTerritoryClaims } from "@/lib/active-territory";
import { decideTerritoryAccess } from "@/lib/territory-claims";
import { readLatestArtifact } from "@/lib/server/decision-artifact-store";
import { ecrireRetourUtilite } from "@/lib/server/retour-utilite-store";
import { enregistrerRetourUtilite } from "@/lib/retour-utilite";

export const dynamic = "force-dynamic";

// ════════════════════════════════════════════════════════════════════════════════════════════
// LE RETOUR D'UTILITÉ EN FIN DE DOSSIER (FUT-94).
//
// POST { insee, dossierId?: uuid | null, answer: "oui" | "pas_vraiment" | "pas_encore_lu",
//        comment?: string | null, presentation?: "classique" | "releve" }
//
// Une réponse par compte et par dossier, remplacée à chaque envoi. La logique (validation,
// rattachement, remplacement) vit dans `enregistrerRetourUtilite`, testée avec un stockage simulé ;
// la route branche le vrai stockage, sous l'identité du lecteur pour TOUT ce qui touche aux droits :
//   · la commune doit être ouverte à ce compte (`loadTerritoryClaims`, RLS) ;
//   · un dossier d'adresse doit être le sien et non révoqué (`getDossier`, RLS) ;
//   · la version servie se lit ICI, jamais dans le corps (la présentation, elle, est celle que l'écran
//     a reçue de `/rapport`, seul point qui la résout : voir `enregistrerRetourUtilite`).
// Seule l'écriture finale passe par le service role (`retour-utilite-store.ts`).
//
// 401 sans session (plutôt qu'une redirection vers une page HTML, qu'un `fetch` prendrait pour un
// succès illisible).
// ════════════════════════════════════════════════════════════════════════════════════════════

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const { supabase, user } = await getCurrentSessionUser();
  if (!user) return Response.json({ error: "Session requise.", code: "session_requise" }, { status: 401 });

  const r = await enregistrerRetourUtilite(body, {
    now: new Date(),
    userId: user.id,
    lireDossier: (id) => getDossier(supabase, user.id, id).catch(() => null),
    communeOuverte: async (insee) => {
      const claims = await loadTerritoryClaims(supabase, user.id).catch(() => null);
      return Boolean(claims && decideTerritoryAccess(claims, insee));
    },
    versionServie: async (insee, scopeKey) =>
      (await readLatestArtifact(supabase, user.id, insee, scopeKey))?.servedVersion ?? null,
    ecrire: ecrireRetourUtilite,
  });
  return Response.json(r.body, { status: r.status });
}
