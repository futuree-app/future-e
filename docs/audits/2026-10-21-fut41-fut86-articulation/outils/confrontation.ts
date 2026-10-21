// Confrontation V3.2 ↔ moteur réel (main 3da725e3). Lecture seule : aucun compte, aucune base, aucun modèle.
// Communes publiques et bâtiments publics seulement.
const R = "/private/tmp/claude-501/fut41-v33/repo/src/lib";
const { buildCommuneDossier } = await import(`${R}/decision/territory-facts.ts`);
const { projetDeTest } = await import(`${R}/decision/projet-de-test.ts`);
const { buildDecisionArtifact } = await import(`${R}/decision/decision-artifact.ts`);
const { comparerDeuxCandidats } = await import(`${R}/decision/comparaison-candidats.ts`);
const { signatureDecisionnelle, projetAChangeMateriellement } = await import(`${R}/decision/projet-materiel.ts`);
const { assembleAddressDossier } = await import(`${R}/server/assemble-address-dossier.ts`);
const { urlRechercheBan } = await import(`${R}/geocodeur-ban.ts`);
const { calculerVoisinage } = await import(`${R}/server/calcul-voisinage.ts`);
const { fetchPermisAutour } = await import(`${R}/server/sitadel-permis.ts`);
const VOISINAGE: Record<string, any> = {};

const PREFS = "faible_chaleur:3,vie_locale:2,acces_soins:2,nature:2,faible_risque_inondation:2";
const P1 = projetDeTest(PREFS).projet;
const P2 = projetDeTest(PREFS.replace("vie_locale:2", "vie_locale:3")).projet;          // un poids change
const P3 = projetDeTest(PREFS, "faible_chaleur").projet;                                 // une condition confirmée
const out: any = { projets: { P1: signatureDecisionnelle(P1), P2: signatureDecisionnelle(P2), P3: signatureDecisionnelle(P3) } };

async function geo(q: string) {
  const r = await fetch(urlRechercheBan({ q, limit: 1 })).catch(() => null);
  const f = r && r.ok ? (await r.json()).features?.[0] : null;
  if (!f) return null; const p = f.properties;
  return { id: p.id, label: p.label, city: p.city, citycode: p.citycode, postcode: p.postcode, latitude: f.geometry.coordinates[1], longitude: f.geometry.coordinates[0] };
}
async function commune(insee: string, projet: any, date: string) {
  const r = await buildCommuneDossier(insee, projet, { hasAddress: false });
  return { r, a: buildDecisionArtifact(r.dossier, projet, date, "conv-test") };
}
async function adresse(lieu: string, projet: any, date: string) {
  const ad = await geo(lieu); if (!ad) return null;
  const c = await buildCommuneDossier(ad.citycode, projet, { hasAddress: true, citycode: ad.citycode });
  // Les abords, calculés comme la route /api/logement-autour (OSM, IGN, Sitadel), sans rien écrire.
  if (!(lieu in VOISINAGE)) {
    const snap: any = await calculerVoisinage({ lat: ad.latitude, lon: ad.longitude }, ad.citycode, 20000).catch((e: any) => ({ erreur: String(e).slice(0, 120) }));
    const permis = await fetchPermisAutour(ad.latitude, ad.longitude, ad.citycode).catch(() => null);
    VOISINAGE[lieu] = snap?.erreur ? { erreur: snap.erreur } : { snap: { ...snap, permis: permis ?? snap.permis ?? null }, permis };
  }
  const v = VOISINAGE[lieu];
  const x = await assembleAddressDossier({ project: projet, address: ad, savedDpe: null, communeFacts: c.moduleFacts, communeDossier: c.dossier, hard: c.hard, scopeKey: "test", permis: v.snap?.permis ?? null, snapshotAutour: v.snap ?? null, relation: null });
  return { ad, status: x.status, voisinage: v.erreur ? `indisponible : ${v.erreur}` : `calculé (${Object.keys(v.snap).length} champs, permis ${v.permis ? "lus" : "absents"})`, a: buildDecisionArtifact(x.dossier, projet, date, "conv-test") };
}
// Ce que la fiche V3.2 voudrait afficher pour chaque condition : issue, échelle, source, dessin.
function fiche(a: any) {
  // Le lien réel : chaque condition du registre porte les `ruleIds` qui l'ont produite ; les faits portent leur `ruleId`.
  const d = a.dossier;
  const faits = [
    ...d.sections.flatMap((s: any) => s.cards ?? []).flatMap((c: any) => c.kind === "fact" ? [{ f: c.fact, ou: "carte" }] : []),
    ...(d.absorbedFacts ?? []).map((f: any) => ({ f, ou: "composition" })),
  ];
  return d.criteria.registry.map((c: any) => {
    const f = faits.filter((x: any) => c.ruleIds?.includes(x.f.ruleId));
    const ev = f.flatMap((x: any) => x.f.evidence ?? []);
    return { critere: c.criterionKey, issue: `${c.outcome}/${c.coverage}`, faits: f.map((x: any) => x.ou).join(","), grains: [...new Set(ev.map((e: any) => e.grain))].join(","), sources: [...new Set(ev.map((e: any) => e.label))].join(" | ").slice(0, 90), dessin: f.some((x: any) => x.f.basis?.kind === "relative_position") };
  });
}
const verdict = (a: any) => ({ label: a.dossier.narrativePlan.verdictLabel, titre: a.dossier.narrativePlan.verdict?.headline?.text, scope: a.dossier.scope, date: a.generatedAt, moteur: a.engineVersion });
const comp = (x: any, y: any, lx: string, ly: string) => { const c = comparerDeuxCandidats({ id: lx, label: lx, artifact: x }, { id: ly, label: ly, artifact: y }); return { memeCadre: c.comparabilite.memeCadreDAnalyse, reserves: c.comparabilite.reserves, lignes: c.lignes.map((l: any) => `${l.criterionKey}:${l.a?.outcome ?? "∅"}|${l.b?.outcome ?? "∅"}→${l.relation}`), nonPartages: c.criteresNonPartages.map((n: any) => n.criterionKey) }; };

// 1. Territoire seul (Nîmes).
const nimes = await commune("30189", P1, "2026-09-21T10:00:00.000Z");
out.s1_territoire = { verdict: verdict(nimes.a), fiche: fiche(nimes.a) };
// 2. Dossier d'adresse, trois échelles (hôtel de ville de Nîmes).
const hdv = await adresse("1 Place de l'Hôtel de Ville 30000 Nîmes", P1, "2026-10-09T10:00:00.000Z");
out.s2_adresse = hdv ? { lieu: hdv.ad.label, status: hdv.status, voisinage: hdv.voisinage, verdict: verdict(hdv.a), fiche: fiche(hdv.a) } : "géocodage impossible";
// 3. Deux adresses dans la même commune (deux bâtiments publics de Nîmes).
const mc = await adresse("Place de la Maison Carrée 30000 Nîmes", P1, "2026-10-12T10:00:00.000Z");
out.s3_deux_adresses = hdv && mc ? { b: mc.ad.label, statusB: mc.status, verdictB: verdict(mc.a), comparaison: comp(hdv.a, mc.a, "Hôtel de ville", "Maison Carrée") } : "géocodage impossible";
// 3 bis. Une adresse comparée à une commune seule (Nîmes adresse ↔ Montpellier commune).
const mtp = await commune("34172", P1, "2026-10-12T10:00:00.000Z");
out.s3b_adresse_vs_commune = hdv ? comp(hdv.a, mtp.a, "Hôtel de ville (Nîmes)", "Montpellier") : null;
// 3 ter. Deux communes, même Projet, même moteur.
out.s3c_deux_communes = comp(nimes.a, mtp.a, "Nîmes", "Montpellier");
// 5. Deux versions du Projet : poids de « vie locale » 2 → 3, puis condition confirmée.
const mtpP2 = await commune("34172", P2, "2026-10-15T10:00:00.000Z");
const mtpP3 = await commune("34172", P3, "2026-10-15T10:00:00.000Z");
out.s5_projet_change = {
  poids: comp(nimes.a, mtpP2.a, "Nîmes (P1)", "Montpellier (P2)"),
  confirmation: comp(nimes.a, mtpP3.a, "Nîmes (P1)", "Montpellier (P3)"),
  // Le même lieu sous deux Projets : quelles issues changent VRAIMENT ?
  memeLieuP1P2: fiche(mtp.a).map((x: any, i: number) => `${x.critere}:${x.issue}→${fiche(mtpP2.a)[i]?.issue}`),
  memeLieuP1P3: fiche(mtp.a).map((x: any, i: number) => `${x.critere}:${x.issue}→${fiche(mtpP3.a)[i]?.issue}`),
};
// 5 bis. Moteur différent (artefact figé sous engine-5, simulé en changeant la seule étiquette de version).
const ancienMoteur = { ...mtp.a, engineVersion: "engine-5" };
out.s5b_moteur = comp(nimes.a, ancienMoteur, "Nîmes (engine-6)", "Montpellier (engine-5)");
// 3 quater. Deux adresses de la même commune, avec des préférences lues à l'adresse (calme, transports, chaleur du logement).
const PA = projetDeTest("faible_chaleur:3,calme_sonore:3,acces_transports:2,acces_soins:2,proximite_mer:2").projet;
const a1 = await adresse("1 Place de l'Hôtel de Ville 30000 Nîmes", PA, "2026-10-09T10:00:00.000Z");
const a2 = await adresse("Place de la Maison Carrée 30000 Nîmes", PA, "2026-10-12T10:00:00.000Z");
const c1 = await commune("30189", PA, "2026-10-09T10:00:00.000Z");
out.s3d_adresses_preferences_locales = a1 && a2 ? { ficheA: fiche(a1.a), ficheB: fiche(a2.a), ficheCommune: fiche(c1.a), comparaison: comp(a1.a, a2.a, "Hôtel de ville", "Maison Carrée"), verdictA: verdict(a1.a), verdictB: verdict(a2.a) } : "géocodage impossible";
// 6. Dossier ancien, Projet modifié depuis : la fiche doit le dire, sans présenter l'ancienne conclusion comme actuelle.
out.s6_ancien = { genereLe: nimes.a.generatedAt, projetAChange_P2: projetAChangeMateriellement(nimes.a.projectSnapshot, P2), projetAChange_memeProjet: projetAChangeMateriellement(nimes.a.projectSnapshot, P1), verdictFige: verdict(nimes.a).titre };
console.log(JSON.stringify(out, null, 1));
