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
import { getGeorisquesSummary } from "@/lib/georisques";
import { getClimatDataCommune } from "@/lib/drias-json";
import { summerComfortAction } from "@/lib/decision/climat-facts";
import { classifyAgglomerationSize, categoryStatementFragment } from "@/lib/decision/agglomeration-facts";
import { carteCompte, CHALEUR } from "@/lib/accueil/recits";
import { indicatorsDepuisScenarios } from "@/lib/accueil/faits";
import { aCommune } from "@/lib/typography";
import { projetDeTest } from "@/app/dev/fut87/projet-de-test";
import { lireChaleur, lireTaille, lireRisques, lireAdresse, type CleePastille, type Lieu, type EntreesChaleur, type EntreesTaille } from "@/components/prototypes/fut50/c/pastilles";

export const dynamic = "force-dynamic";

const CLES: CleePastille[] = ["chaleur", "taille", "voiture", "risques"];

async function entreesChaleur(insee: string): Promise<{ nom: string | null; e: EntreesChaleur }> {
  const simple = projetDeTest("faible_chaleur:2").projet;
  const condition = projetDeTest("faible_chaleur:2", "faible_chaleur").projet;
  const [d1, d2, climat] = await Promise.all([
    buildCommuneDossier(insee, simple, { hasAddress: false }).catch(() => null),
    buildCommuneDossier(insee, condition, { hasAddress: false }).catch(() => null),
    getClimatDataCommune(insee).catch(() => null),
  ]);
  const gesteSansAdresse = summerComfortAction(false).label;
  if (!d1) return { nom: null, e: { issue: "absent", ecart: null, phraseCondition: null, faitDrias: null, gesteSansAdresse } };
  // `indeterminate` couvre deux cas : examiné sans signal net, ou NON examiné (donnée absente). Seul le
  // premier est une lecture ; le second est une absence, jamais une bonne nouvelle.
  const critere = d1.dossier.criteria.registry.find((c) => c.criterionKey === "faible_chaleur");
  const issue = critere?.coverage === "examined" ? critere.outcome : undefined;
  const cartes = d1.dossier.sections.flatMap((s) => s.cards);
  const compo = cartes.flatMap((c) => (c.kind === "composition" ? [c.composition] : []))
    .find((c) => c.referencedRuleIds.some((r) => r.includes("chaleur")));
  const ecart = compo && "summary" in compo
    ? {
        constat: compo.summary,
        titre: compo.title,
        limite: "limitation" in compo ? (compo.limitation ?? null) : null,
        geste: "action" in compo && compo.action ? compo.action.label : null,
      }
    : null;
  const conditionCarte = d2?.dossier.sections.flatMap((s) => s.cards)
    .flatMap((c) => (c.kind === "fact" && c.fact.role === "condition_check" ? [c.fact] : []))[0];
  const faitDrias = climat ? carteCompte(CHALEUR, indicatorsDepuisScenarios(climat.commune.s), "2050")?.fait ?? null : null;
  return {
    nom: d1.moduleFacts.nom,
    e: {
      issue: issue === "favorable" || issue === "mismatch" || issue === "indeterminate" ? issue : "absent",
      ecart,
      phraseCondition: conditionCarte?.statement ?? null,
      faitDrias,
      gesteSansAdresse,
    },
  };
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
    const { nom, e } = await entreesChaleur(insee);
    lecture = lireChaleur({ ...lieu, commune: nom ?? lieu.commune }, e);
  } else if (cle === "taille") {
    const { nom, e } = await entreesTaille(insee);
    lecture = lireTaille({ ...lieu, commune: nom ?? lieu.commune }, e);
  } else if (cle === "risques") {
    const g = await getGeorisquesSummary(insee).catch(() => null);
    lecture = lireRisques(lieu, g ? g.riskLabels : null);
  } else {
    lecture = lireAdresse("voiture", lieu, aCommune);
  }
  return NextResponse.json({ lecture, duree: Date.now() - debut }, { headers: { "Cache-Control": "no-store" } });
}
