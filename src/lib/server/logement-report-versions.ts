import "server-only";
import { createHash } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { LogementReport } from "@/lib/logement-report-types";
import { jsonCanonique, ligneVersionSuivanteSynthese, lireLigneVersion, rangementSynthese, sourcesAbsentes, type VersionLogement } from "@/lib/logement-report-version";

// LE STOCKAGE DES VERSIONS DU RAPPORT LOGEMENT (FUT-13, lot B). Lecture par le client de session du
// lecteur (la RLS ne lui montre que ses dossiers non révoqués) ; écriture par le service role, comme
// toutes les écritures d'un dossier payant (`address-dossier-write.ts`).
//
// AUCUNE DE CES FONCTIONS NE LÈVE. Sans la table (migration pas encore appliquée), ou en panne de base,
// la lecture rend `null` et l'écriture rend `null` : le module retombe sur la construction live, le
// comportement d'avant ce lot.

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

const COLONNES = "version, report, report_hash, sources_absentes, collected_at, synthesis_text, synthesis_fact_hash, synthesis_dpe_numero";

export function empreinteRapport(report: LogementReport): string {
  return createHash("sha256").update(jsonCanonique(report)).digest("hex");
}

/** La dernière version valide d'un dossier, ou `null`. */
export async function lireDerniereVersion(sb: SupabaseClient, dossierId: string): Promise<VersionLogement | null> {
  const { data, error } = await sb
    .from("logement_report_versions")
    .select(COLONNES)
    .eq("dossier_id", dossierId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error("[logement-report-versions] lecture impossible", error.message);
    return null;
  }
  return lireLigneVersion(data);
}

/**
 * Insère la version suivante d'un rapport DÉJÀ construit et validé par l'appelant. Le numéro est le
 * suivant du dernier ; une collision (deux actualisations simultanées) se retente une fois.
 */
export async function enregistrerVersion(
  userId: string, dossierId: string, report: LogementReport, reportHash: string,
): Promise<VersionLogement | null> {
  for (let essai = 0; essai < 2; essai++) {
    const { data: derniere } = await admin
      .from("logement_report_versions")
      .select("version")
      .eq("dossier_id", dossierId)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    const numero = ((derniere as { version?: number } | null)?.version ?? 0) + 1;
    const { data, error } = await admin
      .from("logement_report_versions")
      .insert({
        dossier_id: dossierId, user_id: userId, version: numero,
        report, report_hash: reportHash, sources_absentes: sourcesAbsentes(report),
      })
      .select(COLONNES)
      .single();
    if (!error) return lireLigneVersion(data);
    if (error.code !== "23505") {
      console.error("[logement-report-versions] écriture impossible", error.message);
      return null;
    }
  }
  return null;
}

/**
 * Range une synthèse dans la version qui correspond à ses faits (cf. `rangementSynthese`) : l'attache à
 * la dernière version si elle n'en a pas (écriture conditionnelle, une seule fois), ou crée une version
 * suivante qui porte le même rapport et cette synthèse. Ne modifie jamais une synthèse existante.
 */
export async function rangerSynthese(
  userId: string, dossierId: string, texte: string, hash: string, dpeNumero: string | null, versionLue: number | null,
): Promise<void> {
  const { data } = await admin
    .from("logement_report_versions").select(COLONNES)
    .eq("dossier_id", dossierId).order("version", { ascending: false }).limit(1).maybeSingle();
  const derniere = lireLigneVersion(data);
  const decision = rangementSynthese(derniere, hash, versionLue);
  if (!derniere || decision === "aucune_version" || decision === "version_depassee" || decision === "deja_la") return;
  const synthese = {
    synthesis_text: texte, synthesis_fact_hash: hash,
    synthesis_generated_at: new Date().toISOString(), synthesis_dpe_numero: dpeNumero,
  };
  if (decision === "attacher") {
    const { error } = await admin.from("logement_report_versions").update(synthese)
      .eq("dossier_id", dossierId).eq("version", derniere.numero).is("synthesis_text", null);
    if (error) console.error("[logement-report-versions] synthèse non attachée", error.message);
    return;
  }
  const { error } = await admin.from("logement_report_versions").insert(
    ligneVersionSuivanteSynthese(derniere, userId, dossierId, synthese),
  );
  if (error) console.error("[logement-report-versions] version de synthèse non créée", error.message);
}
