// FUT-50 · LA LECTURE PUBLIQUE D'UNE PRIORITÉ DE L'ACCUEIL.
//
// GET /api/accueil/lecture?insee=17300&cle=chaleur
//   cle ∈ chaleur | hivers | taille | risques | voiture
// Aucun compte, aucune écriture, aucune génération IA, aucun paiement, aucun dossier complet : les données légères
// de l'accueil et les règles du moteur (`src/lib/accueil/lecture-accueil.ts`). L'identité vient du code, jamais
// d'un nom envoyé par le navigateur. Région : celle du projet (`vercel.json`, cdg1), requise par Géorisques.
//
// Réponses : 200 { lecture } · 400 { error: "requete_invalide" } · 404 { error: "commune_inconnue" }.
// Cache : `src/lib/accueil/cache-accueil.ts` (CDN 24 h pour une lecture durable, jamais pour une panne).
import { NextResponse } from "next/server";
import { lireAccueil } from "@/lib/accueil/lecture-accueil";
import { politiqueCache, PARAMETRES_LECTURE } from "@/lib/accueil/cache-accueil";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const r = await lireAccueil(u.searchParams.get("insee") ?? "", u.searchParams.get("cle") ?? "");
  const cache = politiqueCache(r, u.searchParams.keys(), PARAMETRES_LECTURE);
  const headers = { "Cache-Control": cache.cacheControl, "X-Accueil-Cache": cache.raison };
  if (r.statut !== 200) return NextResponse.json({ error: r.erreur }, { status: r.statut, headers });
  return NextResponse.json({ lecture: r.lecture }, { headers: { ...headers, "X-Accueil-Motif": r.motif } });
}
