// FUT-50 · Rejoue la chaîne complète du moteur pour Sète et compare chaque phrase à la fixture des
// prototypes d'accueil. Lecture seule : aucune base, aucun compte. Géorisques n'accepte que les IP françaises.
// Usage (racine du dépôt) : node scripts/fut50/verifier-cas-sete.mjs
import { createJiti } from "jiti";
const racine = process.cwd() + "/";
const jiti = createJiti(racine, { alias: { "server-only": racine + "scripts/mer/etude-courbe/vide.mjs", "@/": racine + "src/" } });
const tf = await jiti.import(racine + "src/lib/decision/territory-facts.ts");
const { projetDeTest } = await jiti.import(racine + "src/app/dev/fut87/projet-de-test.ts");
const { CAS_SETE: C } = await jiti.import(racine + "src/components/prototypes/fut50/cas-sete.ts");

const LECTURES = {
  avecChaleur: ["proximite_mer:3,faible_dependance_auto:3,faible_chaleur:3,eviter_grandes_villes:2", ""],
  sansChaleur: ["proximite_mer:3,faible_dependance_auto:3,eviter_grandes_villes:2", ""],
  merConfirmee: ["proximite_mer:3,faible_dependance_auto:3,faible_chaleur:3,eviter_grandes_villes:2", "proximite_mer"],
  merConfirmeeSansChaleur: ["proximite_mer:3,faible_dependance_auto:3,eviter_grandes_villes:2", "proximite_mer"],
};
const sansChaleur = (nom) => nom === "sansChaleur" || nom === "merConfirmeeSansChaleur";
const merConfirmee = (nom) => nom.startsWith("merConfirmee");

let ecarts = 0;
const verifier = (quoi, attendu, obtenu) => {
  if (attendu === obtenu) return;
  ecarts++;
  console.log(`ÉCART ${quoi}\n  fixture : ${attendu}\n  moteur  : ${obtenu}`);
};

for (const [nom, [prefs, conf]] of Object.entries(LECTURES)) {
  const { projet } = projetDeTest(prefs, conf);
  const r = await tf.buildCommuneDossier(C.insee, projet, { hasAddress: false });
  const d = r.dossier;
  const v = d.narrativePlan.verdict;
  verifier(`${nom} verdict`, C.lectures[nom].verdict, d.narrativePlan.verdictLabel);
  verifier(`${nom} titre`, C.lectures[nom].titre, v.headline.text);
  verifier(`${nom} détail`, C.lectures[nom].detail, v.detail);
  const cartes = d.sections.flatMap((s) => s.cards.map((c) => ({ section: s, ...(c.kind === "fact" ? c.fact : c.composition) })));
  const voiture = cartes.find((c) => c.role === "alignment" && c.projectKey === "faible_dependance_auto");
  verifier(`${nom} voiture`, C.faits.voiture.constat, voiture?.statement);
  verifier(`${nom} section correspond`, C.sections.alignments, voiture?.section.title);
  const nuits = cartes.find((c) => (c.statement ?? c.summary ?? "").startsWith("Les nuits tropicales"));
  verifier(`${nom} nuits`, C.faits.nuits.constat, nuits?.statement ?? nuits?.summary);
  verifier(`${nom} nuits limite`, C.faits.nuits.limite, nuits?.limitation);
  verifier(`${nom} nuits geste`, C.faits.nuits.geste, nuits?.action?.label);
  if (sansChaleur(nom)) {
    verifier(`${nom} nuits section`, C.sections.verifications, nuits?.section.title);
    verifier(`${nom} nuits convention`, C.faits.nuits.conventionHorsPriorite, nuits?.signalConvention);
  } else {
    verifier(`${nom} nuits section`, C.sections.mismatches, nuits?.section.title);
    verifier(`${nom} nuits titre`, C.faits.nuits.titreSiPriorite, nuits?.title);
  }
  const feu = cartes.find((c) => c.role === "verification" && c.statement?.includes("feu de forêt"));
  verifier(`${nom} feu`, C.faits.feu.constat, feu?.statement);
  verifier(`${nom} feu limite`, C.faits.feu.limite, feu?.limitation);
  if (merConfirmee(nom)) {
    const mer = cartes.find((c) => c.role === "condition_check");
    verifier(`${nom} mer constat`, C.faits.mer.constat, mer?.statement);
    verifier(`${nom} mer pourquoi`, C.faits.mer.pourquoi, mer?.whyNotDecided);
    verifier(`${nom} mer conséquence`, C.faits.mer.consequence, mer?.consequence);
    verifier(`${nom} mer section`, C.sections.conditions, mer?.section.title);
  }
  const taille = d.criteria.registry.find((c) => c.criterionKey === "eviter_grandes_villes");
  verifier(`${nom} taille`, "indeterminate/examined", `${taille?.outcome}/${taille?.coverage}`);
  console.log(`${nom} : vérifié`);
}
console.log(ecarts === 0 ? "Aucun écart : la fixture dit ce que dit le moteur." : `${ecarts} écart(s).`);
process.exit(ecarts === 0 ? 0 : 1);
