// LA BOUCLE DE VÉRIFICATION du dossier « En une minute ».
//
// Pourquoi elle existe : en une heure de travail sur le dossier de Lège-Cap-Ferret, QUATRE défauts ont
// été trouvés — une donnée jamais détectée, un antécédent ambigu, une barre trop haute, une carte dans
// la mauvaise section. Aucun n'a été vu par les ~800 tests, tous par un écran. Les tests valident ce
// qu'on a DÉCIDÉ ; quand la décision est mauvaise, ils la confirment fidèlement.
//
// Le parcours réel (compte payant -> commune -> projet -> analyse d'adresse) coûte plusieurs minutes et
// ne montre qu'un dossier à la fois, celui du compte connecté. Ici : un code INSEE, des priorités, et le
// VRAI dossier apparaît — même socle de données (index, DRIAS, Géorisques), mêmes règles, même composant
// de rendu que la production.
//
// LA TABLE DES ÉVALUATIONS est le cœur de l'outil, pas le rendu. C'est elle qui aurait montré en deux
// secondes ce que quatre heures d'enquête ont mis au jour : `territoire.climat-feu -> satisfied, danger
// météorologique sous le seuil`, sur un projet qui demandait d'être à l'abri des incendies.
//
// Aucun appel LLM : le dossier est rendu en mode déterministe (`logementStatus="pending"`), qui est
// exactement ce que voit un lecteur avant que la narration n'arrive.
//
// DEV UNIQUEMENT : 404 en production.
import { notFound } from "next/navigation";
import { buildCommuneDossier } from "@/lib/decision/territory-facts";
import { DossierDecisionSection } from "@/components/report/DossierDecisionSection";
import { PREFERENCE_LABELS } from "@/lib/comparateur-labels";
import type { UserProject } from "@/lib/user-project";

export const dynamic = "force-dynamic";

const DEFAUT_INSEE = "33236"; // Lège-Cap-Ferret : le dossier qui a révélé les quatre défauts
const DEFAUT_PREFS = "faible_risque_feu:3,vie_locale:2";

// « cle:poids,cle:poids » -> les préférences du projet. Une clé inconnue est SIGNALÉE plutôt qu'ignorée :
// une faute de frappe qui produit un dossier silencieusement différent est exactement le genre de piège
// que cet outil existe pour supprimer.
function parsePrefs(raw: string): { prefs: { key: string; weight: number }[]; inconnues: string[] } {
  const prefs: { key: string; weight: number }[] = [];
  const inconnues: string[] = [];
  for (const morceau of raw.split(",").map((x) => x.trim()).filter(Boolean)) {
    const [key, poids] = morceau.split(":").map((x) => x.trim());
    if (!key) continue;
    if (!(key in PREFERENCE_LABELS)) { inconnues.push(key); continue; }
    const weight = Number(poids ?? 3);
    prefs.push({ key, weight: Number.isFinite(weight) ? weight : 3 });
  }
  return { prefs, inconnues };
}

const OUTCOME_COLOR: Record<string, string> = {
  mismatch: "var(--orange)",
  incompatible: "var(--red)",
  verification: "var(--info)",
  satisfied: "var(--green)",
  uncertain: "var(--amethyst)",
  unknown: "var(--amethyst)",
  compromise: "var(--orange)",
  not_applicable: "var(--ghost)",
};

export default async function DevDossierPage({
  searchParams,
}: {
  searchParams: Promise<{ insee?: string; prefs?: string; adresse?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();

  const sp = await searchParams;
  const insee = (sp.insee ?? DEFAUT_INSEE).trim();
  const prefsRaw = sp.prefs ?? DEFAUT_PREFS;
  const hasAddress = sp.adresse === "1";
  const { prefs, inconnues } = parsePrefs(prefsRaw);

  const project = {
    posture: "recherche", intent: null, rawText: null, updatedAt: "1970-01-01T00:00:00.000Z",
    parsed: { reformulation: "projet de test", hardConstraints: {}, preferences: prefs },
  } as unknown as UserProject;

  const result = await buildCommuneDossier(insee, project, { hasAddress }).catch((e: unknown) => {
    return { erreur: e instanceof Error ? e.message : String(e) } as const;
  });

  return (
    <main className="max-w-[1100px] mx-auto px-5 py-10">
      <h1 className="text-2xl font-semibold text-label mb-1">Harnais — dossier « En une minute »</h1>
      <p className="text-sm text-muted mb-6">
        Vraies données (index, DRIAS, Géorisques), vraies règles, vrai composant.{" "}
        <strong>Aucun appel LLM</strong> : le dossier est rendu en mode déterministe, ce qui fait
        apparaître le bandeau « analyse du logement en cours » — c’est un artefact du harnais, pas un
        état du dossier.
      </p>

      <form className="glass rounded-xl p-4 mb-8 flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1">
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ghost">code INSEE</span>
          <input name="insee" defaultValue={insee} className="bg-[var(--bg-elev-2)] rounded-md px-3 py-2 text-[14px] text-label w-[120px]" />
        </label>
        <label className="flex flex-col gap-1 grow">
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ghost">priorités — cle:poids, séparées par des virgules</span>
          <input name="prefs" defaultValue={prefsRaw} className="bg-[var(--bg-elev-2)] rounded-md px-3 py-2 text-[14px] text-label w-full" />
        </label>
        <label className="flex items-center gap-2 pb-2">
          <input type="checkbox" name="adresse" value="1" defaultChecked={hasAddress} />
          <span className="text-[13px] text-muted">adresse renseignée</span>
        </label>
        <button type="submit" className="rounded-md px-4 py-2 text-[14px] font-semibold bg-[var(--bg-elev-3)] text-label">
          Voir le dossier
        </button>
      </form>

      {inconnues.length > 0 ? (
        <p className="mb-6 text-[13px]" style={{ color: "var(--red)" }}>
          Clés inconnues, ignorées : {inconnues.join(", ")}
        </p>
      ) : null}

      {result == null ? (
        <p className="text-[14px] text-muted">Aucune commune pour l’INSEE « {insee} ».</p>
      ) : "erreur" in result ? (
        <p className="text-[14px]" style={{ color: "var(--red)" }}>Erreur : {result.erreur}</p>
      ) : (
        <>
          {/* CE QUE CHAQUE RÈGLE A CONCLU. La partie la plus utile de la page : un critère qui ne dit rien
              à l'écran a forcément un outcome et une raison ici. */}
          <section className="mb-10">
            <h2 className="text-[15px] font-semibold text-label mb-2">Ce que chaque règle a conclu</h2>
            <p className="text-[13px] text-muted mb-3">
              Couverture <strong>{result.dossier.criteria.coverage}</strong> · orientation{" "}
              <strong>{result.dossier.criteria.orientation}</strong> · {result.dossier.narrativePlan.verdictLabel}
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-[12px] font-mono">
                <thead className="text-ghost">
                  <tr className="text-left">
                    <th className="py-1 pr-4">critère déclaré</th>
                    <th className="py-1 pr-4">outcome</th>
                    <th className="py-1 pr-4">couverture</th>
                    <th className="py-1">règles consultées</th>
                  </tr>
                </thead>
                <tbody className="text-muted">
                  {[...result.dossier.criteria.registry].map((c) => (
                    <tr key={c.criterionKey} className="border-t border-[var(--border-1)]">
                      <td className="py-1 pr-4 text-label">{c.criterionKey}</td>
                      <td className="py-1 pr-4" style={{ color: OUTCOME_COLOR[c.outcome] ?? "var(--ghost)" }}>{c.outcome}</td>
                      <td className="py-1 pr-4">{c.coverage}</td>
                      <td className="py-1">{c.ruleIds.join(", ") || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* LE DOSSIER, rendu par le composant de production. */}
          <DossierDecisionSection
            dossier={result.dossier}
            insee={insee}
            scopeKey="commune"
            logementStatus="pending"
          />
        </>
      )}
    </main>
  );
}
