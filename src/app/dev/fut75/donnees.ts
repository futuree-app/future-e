// FUT-75 · LES DONNÉES DES TROIS PROTOTYPES. Serveur uniquement, lecture seule, données publiques.
//
// Rien n'est inventé ici : le périmètre et les décomptes viennent d'un vrai dossier du moteur (même
// calcul que `DossierDecisionReleve`), les horizons des médianes DRIAS-TRACC d'une commune publique, le
// chemin du constat d'une vraie composition (« confort d'été ») d'un dossier d'adresse public.
import "server-only";
import { controlesParEchelle } from "@/lib/decision/dossier-view";
import { getClimatDataCommune } from "@/lib/drias-json";
import { CLIMAT_METRICS, reconstructReference } from "@/lib/decision/climat-facts";
import { PREFERENCE_LABELS } from "@/lib/comparateur-labels";
import { lireDossier, lireCarteDuDossier, lectureDesEchelles, type EntreeLue } from "@/components/releve/lecture-dossier";
import type { EtatForme, FormeEchelle } from "@/components/prototypes/fut75/motion";
import type { MesureHorizon } from "@/components/prototypes/fut75/RegleDesHorizons";
import type { DonneesChemin } from "@/components/prototypes/fut75/CheminDeLaDecision";
import { dossierDeTest } from "../fut87/dossier-de-test";
import { DEFAUT } from "../fut87/projet-de-test";

export const LIEU_PUBLIC = "1 Place de l'Hôtel de Ville 30000 Nîmes";
export const COMMUNES_HORIZONS: { insee: string; nom: string }[] = [
  { insee: "30189", nom: "Nîmes" },
  { insee: "35238", nom: "Rennes" },
  { insee: "67482", nom: "Strasbourg" },
];

/** Le périmètre et les décomptes, comme le hub les calcule (minute + liste complète, sans doublon). */
export async function etatsDuRepere(perimetre: "adresse" | "commune"): Promise<Record<FormeEchelle, EtatForme> | null> {
  const t = await dossierDeTest(perimetre === "adresse" ? { lieu: LIEU_PUBLIC, prefs: DEFAUT.prefs } : { insee: DEFAUT.insee, prefs: DEFAUT.prefs });
  if (!t) return null;
  const lecture = lireDossier(t.dossier);
  const echelles = lectureDesEchelles(lecture, controlesParEchelle(t.dossier).flatMap((g) => g.cards.map((c) => lireCarteDuDossier(t.dossier, c))));
  const etat = (i: number): EtatForme => { const e = echelles[i]!; return e.etat === "non_examinee" ? "non_examinee" : e.constats > 0 ? "constats" : "examinee"; };
  return { territoire: etat(0), autour: etat(1), logement: etat(2) };
}

/** Les deux mesures de chaleur du dossier, aux trois horizons, avec leur référence reconstruite. */
export async function mesuresHorizons(insee: string): Promise<MesureHorizon[] | null> {
  const data = await getClimatDataCommune(insee);
  const sc = data?.commune.s;
  if (!sc) return null;
  const mesure = (cle: "joursTresChauds" | "nuitsTropicales", nom: string, compte: string): MesureHorizon => {
    const def = CLIMAT_METRICS[cle];
    const v = (h: "gwl15" | "gwl20" | "gwl30") => { const x = sc[h]?.v?.[def.absoluteKey]; return typeof x === "number" && Number.isFinite(x) ? x : null; };
    return { cle, nom, compte, reference: reconstructReference(sc, def.absoluteKey, def.anomalyKey, def.anomalyKind), valeurs: { gwl15: v("gwl15"), gwl20: v("gwl20"), gwl30: v("gwl30") }, seuil: def.threshold };
  };
  return [
    mesure("joursTresChauds", "Jours au-dessus de 35 °C", "jours"),
    mesure("nuitsTropicales", "Nuits tropicales (au-dessus de 20 °C)", "nuits"),
  ];
}

const NOM_MESURE: Record<string, { nom: string; unite: string }> = {
  days_over_35: { nom: "Jours au-dessus de 35 °C", unite: "jours par an" },
  tropical_nights: { nom: "Nuits tropicales", unite: "nuits par an" },
  fire_weather_days: { nom: "Jours de danger météorologique de feu", unite: "jours par an" },
};

/** Le chemin réel de la composition « confort d'été », sur le dossier d'adresse public. */
export async function cheminConfortEte(): Promise<DonneesChemin | null> {
  const t = await dossierDeTest({ lieu: LIEU_PUBLIC, prefs: DEFAUT.prefs });
  if (!t) return null;
  const lecture = lireDossier(t.dossier);
  const toutes: EntreeLue[] = lecture.sections.flatMap((s) => s.entrees.flatMap((e) => [e, ...e.detailles]));
  const e = toutes.find((x) => x.ancre.includes("confort-ete"));
  if (!e || e.fondement?.type !== "seuils") return null;
  const section = lecture.sections.find((s) => s.entrees.some((x) => x.ancre === e.ancre));
  const pref = t.projet.parsed?.preferences?.find((p) => p.key === "faible_chaleur");
  return {
    commune: lecture.commune,
    verdict: { etiquette: lecture.verdict.etiquette, titre: lecture.verdict.titre },
    constat: { sujet: e.sujet ?? "", enonce: section ? `Rangé dans « ${section.titre} ».` : "" },
    projet: { libelle: PREFERENCE_LABELS.faible_chaleur ?? "faible_chaleur", poids: pref?.weight ?? 0, poidsMax: 3 },
    fait: {
      enonce: e.enonce,
      grain: "à l'échelle de la commune",
      preuves: [...e.preuves, ...e.sources].map((p) => ({ libelle: p.libelle, ...(p.valeur ? { valeur: p.valeur } : {}), ...(p.href ? { href: p.href } : {}), ...(p.date ? { date: p.date } : {}) })),
    },
    convention: {
      horizon: e.fondement.horizon,
      mesures: e.fondement.mesures.map((ms) => ({ nom: NOM_MESURE[ms.cle]?.nom ?? ms.cle, unite: NOM_MESURE[ms.cle]?.unite ?? "", valeur: ms.valeur, seuil: ms.seuil, franchi: ms.defavorable })),
      methode: e.methode,
    },
    limite: e.nuance ?? "",
    geste: { libelle: e.geste?.libelle ?? "", aVerifier: e.aVerifier },
  };
}
