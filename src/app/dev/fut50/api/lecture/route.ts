// FUT-50 · VERSION C · LA LECTURE D'UNE PASTILLE, SUR LE VRAI MOTEUR. DEV UNIQUEMENT : 404 en production.
//
// GET ?insee=34301&cle=chaleur&type=commune&libelle=Sète
// Aucune écriture, aucun compte, aucune génération IA : le moteur déterministe (`buildCommuneDossier`) pour
// la chaleur, Géorisques pour les risques, rien pour les questions qui se lisent à l'adresse. Le texte est
// mis en forme par `pastilles.ts`, module pur et testé.
//
// À l'intégration, cette route devra devenir une route publique légère et mise en cache par commune ; elle
// n'appelle que des sources déjà lues par l'accueil ou par le dossier (cf. compte rendu FUT-50 C).
import { NextResponse } from "next/server";
import { buildCommuneDossier } from "@/lib/decision/territory-facts";
import { codeGaspar } from "@/lib/georisques-flags";
import { getClimatDataCommune } from "@/lib/drias-json";
import { summerComfortAction, buildClimatFacts, classifyClimateComfort, reconstructReference, CLIMAT_METRICS, CLIMAT_HORIZON } from "@/lib/decision/climat-facts";
import { classifyAgglomerationSize, categoryStatementFragment } from "@/lib/decision/agglomeration-facts";
import { formatTemperature, formatCompte } from "@/lib/accueil/recits";
import { indicatorsDepuisScenarios, construireFaitsCommune } from "@/lib/accueil/faits";
import { CLIMAT_REFERENCE_LABEL } from "@/lib/decision/climat-facts";
import { aCommune } from "@/lib/typography";
import { projetDeTest } from "@/app/dev/fut87/projet-de-test";
import { lireChaleur, lireTaille, lireHivers, lireRisques, lireAdresse, type RisqueGaspar, type CleePastille, type Lieu, type EntreesChaleur, type EntreesTaille, type EntreesHivers } from "@/components/prototypes/fut50/c/pastilles";

export const dynamic = "force-dynamic";

const CLES: CleePastille[] = ["chaleur", "hivers", "taille", "voiture", "risques"];

// LA LIMITE CLIMATIQUE DU MOTEUR, mot pour mot (`LIMITATION_CLIMAT`, materiality-rules.ts ; vérifiée par la
// fixture Sète). Non exportée par le moteur : recopiée ici plutôt que de toucher au moteur dans FUT-50.
const LIMITE_CLIMAT = "Cette trajectoire est lue à l'échelle de la commune, pas de l'adresse ni du logement.";

/**
 * LA CHALEUR SANS RELANCER TOUT LE DOSSIER : les données (`buildClimatFacts`) et la classification
 * (`classifyClimateComfort`) sont les fonctions mêmes que la règle `territoire.climat-chaleur` du moteur appelle.
 * Même source, même seuils, même verdict ; la formulation seule est propre à l'accueil (`lireChaleur`).
 */
async function entreesChaleur(insee: string): Promise<EntreesChaleur> {
  const climat = await getClimatDataCommune(insee).catch(() => null);
  const f = buildClimatFacts(climat?.commune.s ?? null);
  const seuils = { jours: CLIMAT_METRICS.joursTresChauds.threshold, nuits: CLIMAT_METRICS.nuitsTropicales.threshold };
  const referenceTexte = (v: number, nuits: boolean) => formatCompte(v, nuits ? { singulier: "nuit", pluriel: "nuits", feminin: true } : undefined);
  const gesteSansAdresse = summerComfortAction(false).label;
  if (!f) {
    return { verdict: "absent", jours: { projete: null, reference: null, seuil: seuils.jours }, nuits: { projete: null, reference: null, seuil: seuils.nuits }, referenceTexte, limite: LIMITE_CLIMAT, gesteSansAdresse };
  }
  return {
    verdict: classifyClimateComfort(f).verdict,
    jours: { projete: f.joursTresChauds.projete, reference: f.joursTresChauds.reference, seuil: f.joursTresChauds.threshold },
    nuits: { projete: f.nuitsTropicales.projete, reference: f.nuitsTropicales.reference, seuil: f.nuitsTropicales.threshold },
    // Les journées au-dessus de 30 °C viennent du MÊME chargement (aucune requête au basculement), au même
    // horizon, avec la reconstruction de référence du moteur. Elles ne passent pas par le classifieur.
    jours30: (() => {
      const sc = climat?.commune.s;
      const v = sc?.[CLIMAT_HORIZON]?.v?.NORTX30D_yr;
      return { projete: typeof v === "number" && Number.isFinite(v) ? v : null, reference: reconstructReference(sc, "NORTX30D_yr", "ATX30D_yr") };
    })(),
    referenceTexte, limite: LIMITE_CLIMAT, gesteSansAdresse,
  };
}

/**
 * LES RISQUES AVEC LEUR CODE. `getGeorisquesSummary` (production) ne garde que les libellés : c'est ce qui rendait
 * l'ancien inventaire à plat. Le prototype lit la MÊME ressource (GASPAR v1, même grain communal, même repli
 * Paris/Lyon/Marseille via `codeGaspar`) en gardant `num_risque`, sans toucher à la bibliothèque de production.
 * `null` : pas de réponse exploitable (jamais « aucun risque ») ; `[]` : la base répond sans rien recenser.
 */
async function risquesGaspar(insee: string): Promise<RisqueGaspar[] | null> {
  const controle = new AbortController();
  const delai = setTimeout(() => controle.abort(), 8000);
  try {
    const r = await fetch(`https://georisques.gouv.fr/api/v1/gaspar/risques?code_insee=${encodeURIComponent(codeGaspar(insee))}`, {
      headers: { accept: "application/json" }, next: { revalidate: 86400 }, signal: controle.signal,
    });
    if (!r.ok) return null;
    const json = (await r.json()) as { data?: { risques_detail?: { num_risque?: string | null; libelle_risque_long?: string | null }[] | null }[] | null };
    if (!Array.isArray(json.data)) return null;
    return (json.data[0]?.risques_detail ?? [])
      .map((d) => ({ code: String(d.num_risque ?? "").trim(), libelle: String(d.libelle_risque_long ?? "").trim() }))
      .filter((d) => d.code && d.libelle);
  } catch {
    return null;
  } finally {
    clearTimeout(delai);
  }
}

async function entreesTaille(insee: string): Promise<{ nom: string | null; e: EntreesTaille }> {
  const d = await buildCommuneDossier(insee, projetDeTest("eviter_grandes_villes:2").projet, { hasAddress: false }).catch(() => null);
  if (!d) return { nom: null, e: { issue: "absent", phraseTaille: null, population: null, source: null } };
  const critere = d.dossier.criteria.registry.find((c) => c.criterionKey === "eviter_grandes_villes");
  const issue = critere?.coverage === "examined" ? critere.outcome : undefined;
  const cat = classifyAgglomerationSize(d.moduleFacts.tailleVille);
  const source = d.moduleFacts.tailleVilleSource;
  return {
    nom: d.moduleFacts.nom,
    e: {
      issue: issue === "favorable" || issue === "mismatch" || issue === "indeterminate" ? issue : "absent",
      phraseTaille: cat !== "uncertain" && source ? categoryStatementFragment(d.moduleFacts.nom, cat, source) : null,
      population: d.moduleFacts.tailleVille,
      source,
    },
  };
}

async function entreesHivers(insee: string): Promise<{ nom: string | null; e: EntreesHivers }> {
  const [d, climat] = await Promise.all([
    buildCommuneDossier(insee, projetDeTest("douceur_climat:2").projet, { hasAddress: false }).catch(() => null),
    getClimatDataCommune(insee).catch(() => null),
  ]);
  if (!d) return { nom: null, e: { issue: "absent", position: null, limite: null, temperatureReference: null } };
  const critere = d.dossier.criteria.registry.find((c) => c.criterionKey === "douceur_climat");
  const issue = critere?.coverage === "examined" ? critere.outcome : undefined;
  const carte = d.dossier.sections.flatMap((s) => s.cards)
    .flatMap((c) => (c.kind === "fact" && (c.fact.role === "alignment" || c.fact.role === "mismatch") && c.fact.projectKey === "douceur_climat" ? [c.fact] : []))[0];
  const ref = climat
    ? construireFaitsCommune(d.moduleFacts.nom, indicatorsDepuisScenarios(climat.commune.s), null).climat?.temperature_moyenne_hiver_C.reference ?? null
    : null;
  return {
    nom: d.moduleFacts.nom,
    e: {
      issue: issue === "favorable" || issue === "mismatch" || issue === "indeterminate" ? issue : "absent",
      // Le préambule d'un écart (« Vous avez placé … parmi vos priorités. ») n'a pas de sens ici : une pastille
      // n'est pas un projet déclaré. Même règle que les conditions (`condition-rules.ts`, sansPreambule).
      position: carte ? carte.statement.replace(/^Vous avez placé [^.]*\. /, "") : null,
      limite: carte && "limitation" in carte ? (carte.limitation ?? null) : null,
      temperatureReference: ref != null ? `Température moyenne de l'hiver : ${formatTemperature(ref)} ${CLIMAT_REFERENCE_LABEL}.` : null,
      temperatureValeur: ref != null ? formatTemperature(ref) : null,
    },
  };
}

export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production") return new NextResponse(null, { status: 404 });
  const u = new URL(req.url);
  const insee = (u.searchParams.get("insee") ?? "").trim();
  const cle = u.searchParams.get("cle") as CleePastille;
  if (!/^\d[0-9AB]\d{3}$/.test(insee) || !CLES.includes(cle)) return NextResponse.json({ error: "requête invalide" }, { status: 400 });
  const lieu: Lieu = {
    type: u.searchParams.get("type") === "adresse" ? "adresse" : "commune",
    libelle: u.searchParams.get("libelle") ?? "",
    commune: u.searchParams.get("commune") ?? "",
    insee,
  };
  const debut = Date.now();
  let lecture;
  if (cle === "chaleur") {
    lecture = lireChaleur(lieu, await entreesChaleur(insee));
  } else if (cle === "hivers") {
    const { nom, e } = await entreesHivers(insee);
    lecture = lireHivers({ ...lieu, commune: nom ?? lieu.commune }, e);
  } else if (cle === "taille") {
    const { nom, e } = await entreesTaille(insee);
    lecture = lireTaille({ ...lieu, commune: nom ?? lieu.commune }, e);
  } else if (cle === "risques") {
    lecture = lireRisques(lieu, await risquesGaspar(insee));
  } else {
    lecture = lireAdresse("voiture", lieu, aCommune);
  }
  return NextResponse.json({ lecture, duree: Date.now() - debut }, { headers: { "Cache-Control": "no-store" } });
}
