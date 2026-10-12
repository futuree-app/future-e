// ════════════════════════════════════════════════════════════════════════════════════════════
// ENREGISTRER LE PROJET DEPUIS UN ÉCRAN : la seule séquence navigateur, partagée par « Votre projet »
// (ProjectSummaryCard) et par le checkout du dossier (FUT-10).
//
// Elle n'invente rien : reparse seulement si le texte a changé (`doitReparser`), choisit le `parsed`
// à écrire (`parsedASauvegarder`), puis passe par l'unique route d'écriture (`PATCH /api/profile`,
// champ `user_project`), qui reporte les gestes du lecteur et garde l'écriture contre une course.
// Aucune condition sans compromis ne peut naître ici : la route ignore `conditions` (FUT-25).
//
// Deux écrans qui recopiaient cette séquence l'auraient fait diverger à la première correction.
// ════════════════════════════════════════════════════════════════════════════════════════════
import type { UserProject, ProjectPosture, ProjectIntent } from "./user-project.ts";
import { doitReparser, parsedASauvegarder } from "./decision/projet-edition.ts";

export type ResultatSauvegarde =
  | { ok: true; project: UserProject; avertir: boolean }
  | { ok: false; conflit: boolean };

export async function enregistrerProjet(input: {
  texte: string;
  posture: ProjectPosture;
  intent: ProjectIntent | null;
  projet: UserProject | null;
}): Promise<ResultatSauvegarde> {
  const raw = input.texte.trim();
  // Un texte vide n'a rien à faire parser : on épargne l'appel, et un retrait volontaire n'est pas un échec.
  const reparse = raw.length > 0 && doitReparser(raw, input.projet);
  let parsedRecu: UserProject["parsed"] | null = null;
  if (reparse) {
    try {
      const r = await fetch("/api/comparateur-vie/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: raw }),
      });
      const data = r.ok ? ((await r.json()) as { parsed?: unknown }) : null;
      parsedRecu = data?.parsed && typeof data.parsed === "object"
        ? (data.parsed as UserProject["parsed"])
        : null;
    } catch {
      parsedRecu = null;
    }
  }
  const { parsed, avertir } = parsedASauvegarder({
    reparse, parsedRecu, projet: input.projet, texteVide: raw.length === 0,
  });
  try {
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        field: "user_project",
        value: { posture: input.posture, intent: input.intent, rawText: raw.length > 0 ? raw : null, parsed },
      }),
    });
    if (!res.ok) return { ok: false, conflit: res.status === 409 };
    const data = (await res.json()) as { project?: UserProject };
    // Uniquement le projet confirmé par le serveur.
    if (!data.project) return { ok: false, conflit: false };
    return { ok: true, project: data.project, avertir };
  } catch {
    return { ok: false, conflit: false };
  }
}
