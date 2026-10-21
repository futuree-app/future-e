import type { SupabaseClient } from "@supabase/supabase-js";
import { listDossiers } from "../address-dossier-store.ts";
import { etatArtefact, type ArtifactRow, type ArtifactStatus, type StoredArtifact } from "./decision-artifact.ts";
import { normalizeUserProject } from "../user-project.ts";
import {
  assemblerVosLieux, cleArtefact, clesALire,
  type LieuAffiche, type TerritoirePossede,
} from "./vos-lieux.ts";

// ════════════════════════════════════════════════════════════════════════════════════════════
// LE CHARGEMENT DE « VOS LIEUX ». Lectures seules, toutes filtrées par `user_id` (et par la RLS).
//
// ── QUATRE LECTURES, QUEL QUE SOIT LE NOMBRE DE LIEUX ────────────────────────────────────────
// 1. le profil (résidence, Projet actuel), les biens (révoqués exclus), les droits : en parallèle ;
// 2. les TÊTES des artefacts des scopes affichés, sans leur contenu : numéro, statut, dates ;
// 3. le CONTENU de la seule version candidate de chaque scope (la plus haute version `ready`), en une
//    requête ;
// 4. seulement si ce contenu ne se relit pas (rare), le repli par scope sur `readLatestArtifact`, qui
//    pagine les versions prêtes : la règle « une version prête et relisible se sert toujours » reste
//    celle du hub, et la décision finale passe par la même fonction pure, `etatArtefact`.
//
// ── CE QUI NE SE FAIT JAMAIS ICI ─────────────────────────────────────────────────────────────
// Aucune génération, aucune écriture, aucune mise à jour du lieu actif. Une visite de la page ne
// change rien au compte.
// ════════════════════════════════════════════════════════════════════════════════════════════

type Tete = { insee_code: string; scope_key: string; version: number; status: ArtifactStatus; generated_at: string | null; created_at: string | null };

/** Une valeur de filtre PostgREST entre guillemets : `logement:<uuid>` contient un deux-points. */
const q = (v: string) => `"${v.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

/** La relecture d'un scope quand sa version candidate ne se relit pas : `readLatestArtifact` en production. */
export type LireDernierArtefact = (sb: SupabaseClient, userId: string, insee: string, scopeKey: string) => Promise<StoredArtifact | null>;

export async function lireVosLieux(sb: SupabaseClient, userId: string, lireDernier: LireDernierArtefact): Promise<LieuAffiche[]> {
  const [profil, biens, droits] = await Promise.all([
    sb.from("user_profiles").select("home_insee_code, home_commune, user_project").eq("user_id", userId).maybeSingle(),
    listDossiers(sb, userId),
    sb.from("report_grants").select("insee, commune, created_at").eq("user_id", userId),
  ]);
  // Une panne n'est pas une absence de droit : on lève, comme `loadTerritoryClaims`.
  if (profil.error) throw new Error(`user_profiles a échoué : ${profil.error.message}`);
  if (droits.error) throw new Error(`report_grants a échoué : ${droits.error.message}`);

  const territoires: TerritoirePossede[] = ((droits.data ?? []) as { insee: string; commune: string | null; created_at: string }[])
    .map((g) => ({ insee: g.insee, commune: g.commune, createdAt: g.created_at }));
  const p = profil.data as { home_insee_code?: string | null; home_commune?: string | null; user_project?: unknown } | null;

  const cles = clesALire(biens, territoires);
  const artefacts = new Map<string, StoredArtifact>();
  if (cles.length > 0) {
    const scopes = [...new Set(cles.map((c) => c.scopeKey))];
    const attendues = new Set(cles.map((c) => cleArtefact(c.insee, c.scopeKey)));
    const tetes = await sb
      .from("decision_artifact")
      .select("insee_code, scope_key, version, status, generated_at, created_at")
      .eq("user_id", userId)
      .in("scope_key", scopes);
    if (tetes.error) throw new Error(`decision_artifact a échoué : ${tetes.error.message}`);

    // Les lignes par scope affiché ; une commune lue sous un autre scope (le dossier communal d'une
    // commune portée par un bien, par exemple) n'est pas un lieu de cette page.
    const parCle = new Map<string, Tete[]>();
    for (const t of (tetes.data ?? []) as Tete[]) {
      const cle = cleArtefact(t.insee_code, t.scope_key);
      if (!attendues.has(cle)) continue;
      parCle.set(cle, [...(parCle.get(cle) ?? []), t]);
    }

    // La candidate de chaque scope : la plus haute version prête.
    const candidates = [...parCle.values()].flatMap((lignes) => {
      const pretes = lignes.filter((l) => l.status === "ready").sort((a, b) => b.version - a.version);
      return pretes[0] ? [pretes[0]] : [];
    });
    const contenus = new Map<string, unknown>();
    if (candidates.length > 0) {
      const filtre = candidates
        .map((c) => `and(insee_code.eq.${q(c.insee_code)},scope_key.eq.${q(c.scope_key)},version.eq.${c.version})`)
        .join(",");
      const lus = await sb
        .from("decision_artifact")
        .select("insee_code, scope_key, version, payload")
        .eq("user_id", userId)
        .eq("status", "ready")
        .or(filtre);
      if (lus.error) throw new Error(`decision_artifact (contenus) a échoué : ${lus.error.message}`);
      for (const l of (lus.data ?? []) as { insee_code: string; scope_key: string; version: number; payload: unknown }[]) {
        contenus.set(`${cleArtefact(l.insee_code, l.scope_key)}#${l.version}`, l.payload);
      }
    }

    const replis: Promise<void>[] = [];
    for (const [cle, lignes] of parCle) {
      const enLignes: ArtifactRow[] = lignes.map((l) => ({
        version: l.version, status: l.status, generatedAt: l.generated_at, createdAt: l.created_at,
        payload: contenus.get(`${cle}#${l.version}`),
      }));
      const etat = etatArtefact(enLignes);
      if (!etat) continue;
      const aDesPretes = lignes.some((l) => l.status === "ready");
      if (etat.artifact || !aDesPretes) { artefacts.set(cle, etat); continue; }
      // La candidate ne se relit pas : une version prête plus ancienne peut l'être. Même règle que le hub.
      const [insee, scopeKey] = [lignes[0]!.insee_code, lignes[0]!.scope_key];
      replis.push(lireDernier(sb, userId, insee, scopeKey).then((r) => { if (r) artefacts.set(cle, r); }));
    }
    await Promise.all(replis);
  }

  return assemblerVosLieux({
    biens,
    territoires,
    residence: { insee: p?.home_insee_code ?? null, commune: p?.home_commune ?? null },
    artefacts,
    projetActuel: normalizeUserProject(p?.user_project ?? null),
  });
}
