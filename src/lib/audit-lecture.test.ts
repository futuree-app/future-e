// FUT-62 : L'AUDIT ÉNERGÉTIQUE LU POUR DÉCIDER.
//
// Ce que ces tests verrouillent : les travaux de chaque étape viennent de SA ligne (jamais d'une autre
// étape ni d'un autre parcours), la lecture de premier niveau ne dit que ce que la source établit, le
// grain (logement, immeuble, inconnu) commande chaque phrase, plusieurs audits d'une même adresse sont
// dits, et aucune sortie ne surinterprète (classe future, coût, aide, vote, date, garantie).
// Les dix cas obligatoires du ticket sont numérotés C1 à C10.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  arriveeAudit, choisirAudit, departAudit, lireAuditPourDecision, lireTravaux, parcoursLus, phrasePostes,
  phraseTravaux, voixAudit, type LectureDecisionAudit, type VoixAudit,
} from "./audit-lecture.ts";
import { lectureAudit, parcoursAudit, toAuditRecord, toAuditRecords, type AuditApiRow, type AuditRecord } from "./audit-record.ts";
import {
  BAN_FIXTURE, DEUX_ETATS_INITIAUX, DPE_APPARTEMENT, DPE_MAISON, IMMEUBLE, IMMEUBLE_COPRO, INCOMPLET, LOGEMENT, PLUSIEURS,
} from "./audit-lecture.fixtures.ts";

const rec = (rows: AuditApiRow[]): AuditRecord => toAuditRecord(rows, BAN_FIXTURE)!;
const texteDe = (l: LectureDecisionAudit) => [
  l.titre, l.portee, l.date, l.phraseParcours, l.lienDpe, l.autresAudits, l.titreVerifications, ...l.verifications,
  ...l.parcours.flatMap((p) => [p.titre, p.travaux, ...p.etapes.map((e) => `${e.libelle} ${phraseTravaux(e.travaux) ?? ""}`)]),
].filter(Boolean).join("\n");

// ── Les travaux d'une étape ────────────────────────────────────────────────────────────────────────

test("W1. travaux_realises : catégories de la source, rangées, dédoublonnées, sans perte", () => {
  const t = lireTravaux("Remplacement du système de production d’eau chaude sanitaire, autre, Isolation des murs, Isolation des murs, Remplacement des menuiseries extérieures");
  assert.equal(t.statut, "detaille");
  if (t.statut !== "detaille") return;
  // L'ordre de lecture est fixe (l'enveloppe, puis les équipements), pas l'ordre quelconque de la source.
  assert.deepEqual(t.postes.map((p) => p.cle), ["murs", "menuiseries", "eau_chaude"]);
  assert.equal(t.autres, true);
  assert.equal(phraseTravaux(t), "Isolation des murs · Remplacement des fenêtres et portes extérieures · Remplacement de la production d'eau chaude · Autres travaux, non détaillés par la source");
  // Les apostrophes droite et typographique sont la même catégorie.
  assert.deepEqual(lireTravaux("Remplacement du système de production d'eau chaude sanitaire"), lireTravaux("Remplacement du système de production d’eau chaude sanitaire"));
});

test("W2. absent, vide, « autre » seul, libellé inconnu : chacun dit ce que la source dit, rien de plus", () => {
  assert.deepEqual(lireTravaux(null), { statut: "non_renseigne" });
  assert.deepEqual(lireTravaux(""), { statut: "non_renseigne" });
  assert.deepEqual(lireTravaux(" , "), { statut: "non_renseigne" });
  assert.deepEqual(lireTravaux("autre"), { statut: "non_detaille" });
  assert.equal(phraseTravaux(lireTravaux("autre")), "Travaux non détaillés par la source");
  assert.equal(phraseTravaux(lireTravaux(null)), null);
  // Un libellé hors vocabulaire n'est jamais perdu : il est rendu tel quel, après les catégories connues.
  const t = lireTravaux("Pose d'un récupérateur de chaleur, Isolation de la toiture");
  assert.equal(phraseTravaux(t), "Isolation de la toiture · Pose d'un récupérateur de chaleur");
});

test("W3. les isolations se lisent en une phrase", () => {
  const t = lireTravaux("Isolation des planchers bas, Remplacement du système de chauffage, Isolation des murs, Isolation de la toiture");
  assert.equal(phraseTravaux(t), "Isolation des murs, de la toiture et des planchers bas · Remplacement du chauffage");
  assert.equal(phrasePostes([]), "");
});

// ── C2, C3, C4 : un immeuble, un parcours par étapes, un parcours en une fois ────────────────────────

test("C3/C4. chaque étape porte les travaux de SA ligne, dans le bon parcours", () => {
  const audit = rec(IMMEUBLE);
  const parcours = parcoursLus(parcoursAudit(audit.scenarios));
  assert.deepEqual(parcours.map((p) => p.titre), ["Rénovation par étapes", "Rénovation en une seule fois"]);
  // Le rattachement se vérifie contre la ligne source elle-même : même catégorie, même étape.
  for (const p of parcours) {
    for (const e of p.etapes) {
      const source = IMMEUBLE.find((r) => r.categorie_scenario === p.cle && r.ep_conso_5_usages_m2 === e.conso_ep_m2
        && (e.libelle === "Après travaux" || e.libelle === "Étape finale" ? r.etape_travaux === "étape finale" : r.etape_travaux !== "étape finale"))!;
      assert.ok(source, `${p.titre} / ${e.libelle}`);
      assert.deepEqual(e.travaux, lireTravaux(source.travaux_realises), `${p.titre} / ${e.libelle}`);
    }
  }
  const [etapes, uneFois] = parcours;
  assert.deepEqual(etapes.etapes.map((e) => [e.libelle, e.conso_ep_m2, phraseTravaux(e.travaux)]), [
    ["Étape 1", 167.3, "Isolation des murs, de la toiture et des planchers bas · Remplacement du chauffage"],
    ["Étape 2", 115.1, "Remplacement des fenêtres et portes extérieures · Remplacement de la ventilation · Autres travaux, non détaillés par la source"],
    ["Étape finale", 53, "Remplacement du chauffage"],
  ]);
  assert.deepEqual(uneFois.etapes.map((e) => e.libelle), ["Après travaux"]);
  // La réunion d'un parcours ne cite que les travaux de ses propres étapes.
  assert.equal(etapes.travaux, "Isolation des murs, de la toiture et des planchers bas · Remplacement des fenêtres et portes extérieures · Remplacement du chauffage · Remplacement de la ventilation · Autres travaux, non détaillés par la source");
  // Aucun travail n'est jamais prêté à l'état initial : il n'est pas un parcours.
  assert.equal(parcours.some((p) => p.etapes.some((e) => e.conso_ep_m2 === 503.5)), false);
});

test("C2. audit d'immeuble : le fait, sa portée, et ce qu'il ne dit pas du logement", () => {
  const l = lireAuditPourDecision({ audit: rec(IMMEUBLE), dpe: { numero: "2500E0000AUTRE", conso_ep_m2: 418.3 }, voix: "achat" });
  assert.equal(l.titre, "Un audit énergétique existe pour cet immeuble.");
  assert.equal(l.portee, "Il porte sur l'immeuble entier (4 logements, 434 m² habitables), pas sur ce seul logement.");
  assert.equal(l.date, "Établi le 30 mai 2025");
  assert.deepEqual(l.depart, { statut: "unique", valeur: 503.5 });
  assert.deepEqual(l.arrivee, { statut: "unique", valeur: 53 });
  assert.equal(l.phraseParcours, "Deux parcours de travaux sont documentés : rénovation par étapes (3 étapes) et rénovation en une seule fois.");
  // Le lien avec le DPE du logement, attendu depuis FUT-67, sans jamais en tirer une étiquette future.
  assert.match(l.lienDpe!, /^Ces valeurs décrivent l'immeuble entier\. Pour ce logement, le diagnostic retenu indique 418,3\skWh EP\/m²\/an : l'audit ne le remplace pas/);
  assert.match(l.lienDpe!, /ne dit pas quelle étiquette ce logement aurait après travaux/);
  assert.equal(l.titreVerifications, "À vérifier avant d'acheter");
  // Sans immatriculation publiée, la copropriété reste une hypothèse : la phrase est conditionnelle.
  assert.deepEqual(l.verifications, [
    "L'audit propose des travaux pour l'immeuble entier. Si l'immeuble est en copropriété, leur réalisation dépend de décisions collectives : demandez au vendeur ou au syndic lesquels ont été votés, financés ou planifiés.",
  ]);
  assert.equal(l.rattacheAuDpe, false);
});

test("C2b. immeuble immatriculé comme copropriété : le fait publié remplace l'hypothèse", () => {
  const l = lireAuditPourDecision({ audit: rec(IMMEUBLE_COPRO), voix: "achat" });
  assert.equal(l.verifications.length, 1);
  assert.match(l.verifications[0], /^L'immeuble est immatriculé comme copropriété \(n° AA0000000\) : les travaux que propose l'audit s'y décident en assemblée générale\. Demandez au vendeur ou au syndic lesquels ont été votés, financés ou planifiés/);
  assert.doesNotMatch(l.verifications[0], /Si l'immeuble est en copropriété/);
  // Sans DPE retenu, l'immeuble n'est rapproché d'aucune valeur du logement.
  assert.match(l.lienDpe!, /elles ne disent ni la consommation de ce logement, ni l'étiquette qu'il aurait après travaux/);
});

// ── C1, C5 : un logement, des parcours qui finissent différemment ─────────────────────────────────────

test("C1. audit de logement rattaché par la source au DPE retenu : « ce logement », et pas de copropriété inventée", () => {
  const l = lireAuditPourDecision({ audit: rec(LOGEMENT), dpe: { numero: DPE_MAISON, conso_ep_m2: 380 }, voix: "achat" });
  assert.equal(l.rattacheAuDpe, true);
  assert.equal(l.titre, "Un audit énergétique existe pour ce logement.");
  assert.equal(l.portee, `Il porte sur un logement de 112 m², et a été établi à partir du diagnostic retenu pour ce logement (n° ${DPE_MAISON}).`);
  assert.equal(l.lienDpe, null, "même logement : rien à rapprocher");
  assert.deepEqual(l.verifications, ["Demandez au vendeur lesquels de ces travaux ont déjà été réalisés depuis le 11 février 2025, et leurs factures."]);
  assert.doesNotMatch(texteDe(l), /copropri|syndic|assemblée|collectiv/i);
});

test("C1b. audit de logement NON rattaché : un logement de l'adresse, et la question à poser", () => {
  const sansLien = rec(LOGEMENT.map((r) => ({ ...r, numero_dpe: null })));
  const l = lireAuditPourDecision({ audit: sansLien, dpe: { numero: "2500E0000AUTRE", conso_ep_m2: 380 }, voix: "achat" });
  assert.equal(l.titre, "Un audit énergétique existe pour un logement de cette adresse.");
  assert.match(l.portee, /La source ne le rattache pas au diagnostic de ce bien : il peut s'agir d'un autre logement de l'adresse\.$/);
  assert.equal(l.lienDpe, "Pour comparaison, le diagnostic retenu pour ce bien indique 380\u00a0kWh EP/m²/an.");
  assert.equal(l.verifications[0], "Demandez au vendeur si cet audit porte bien sur ce bien : il concerne un logement de 112 m².");
  // Rattaché à un AUTRE diagnostic : la source le dit, l'écran aussi.
  const autre = lireAuditPourDecision({ audit: rec(LOGEMENT), dpe: { numero: "2500E0000AUTRE", conso_ep_m2: 380 } });
  assert.match(autre.portee, new RegExp(`établi à partir d'un autre diagnostic \\(n° ${DPE_MAISON}\\) que celui retenu ici`));
  assert.equal(autre.rattacheAuDpe, false);
});

test("C5. deux parcours qui finissent différemment : une plage, jamais une moyenne ni un choix", () => {
  const l = lireAuditPourDecision({ audit: rec(LOGEMENT) });
  assert.deepEqual(l.arrivee, { statut: "plage", min: 68, max: 72 });
  assert.deepEqual(l.parcours.map((p) => [p.titre, p.arrivee]), [["Rénovation par étapes", 72], ["Rénovation en une seule fois", 68]]);
  // Des étapes aux performances différentes gardent chacune la leur, dans l'ordre de la source.
  assert.deepEqual(l.parcours[0].etapes.map((e) => [e.libelle, e.conso_ep_m2]), [["Étape 1", 206], ["Étape 2", 141], ["Étape finale", 72]]);
  assert.equal(phraseTravaux(l.parcours[0].etapes[1].travaux), "Travaux non détaillés par la source");
});

// ── C6, C7 : information incomplète ──────────────────────────────────────────────────────────────────

test("C6. travaux absents ou partiels, objet audité inconnu : rien n'est attribué ni complété", () => {
  const l = lireAuditPourDecision({ audit: rec(INCOMPLET), dpe: { numero: "X", conso_ep_m2: 300 }, voix: "achat" });
  assert.equal(l.titre, "Un audit énergétique est publié pour cette adresse.");
  assert.match(l.portee, /ne sont attribués ni à ce logement, ni à l'immeuble\.$/);
  assert.doesNotMatch(`${l.titre} ${l.portee}`, /cet immeuble|ce logement existe|pour ce logement/);
  assert.equal(l.lienDpe, null, "objet inconnu : aucun rapprochement avec le DPE du logement");
  assert.deepEqual(l.verifications, ["Demandez au vendeur le rapport d'audit complet : lui seul dit s'il porte sur ce logement ou sur l'immeuble entier."]);
  const [etapes, complementaire] = l.parcours;
  assert.equal(etapes.travauxIncomplets, true);
  assert.equal(phraseTravaux(etapes.etapes[0].travaux), null, "étape sans travaux : la source n'en dit rien");
  assert.equal(phraseTravaux(etapes.etapes[1].travaux), "Remplacement des fenêtres et portes extérieures · Pose d'un récupérateur de chaleur");
  // Un parcours sans étape finale ne dit pas où mène la rénovation complète. Le complémentaire finit à
  // 150, mais « la » rénovation complète n'est plus établie sans ambiguïté : rien au premier niveau.
  assert.equal(etapes.arrivee, null);
  assert.equal(complementaire.titre, "Parcours complémentaire 1");
  assert.equal(complementaire.arrivee, 150);
  assert.deepEqual(l.arrivee, { statut: "non_etablie" });
});

test("C7. état initial absent, ou multiple", () => {
  assert.deepEqual(lireAuditPourDecision({ audit: rec(INCOMPLET) }).depart, { statut: "absent" });
  const l = lireAuditPourDecision({ audit: rec(DEUX_ETATS_INITIAUX) });
  assert.deepEqual(l.depart, { statut: "multiple", valeurs: [500, 480] });
  assert.equal(l.parcours.length, 1, "un second état initial n'est jamais un parcours");
  // Deux lignes égales au dixième ne sont pas deux états.
  const egaux = parcoursAudit([
    { categorie: "état initial", etape: "état initial", travaux: null, conso_ep_m2: 500.04, emission_ges_m2: null },
    { categorie: "état initial", etape: "état initial", travaux: null, conso_ep_m2: 500, emission_ges_m2: null },
  ]);
  assert.deepEqual(departAudit(egaux), { statut: "unique", valeur: 500 });
  assert.deepEqual(arriveeAudit([]), { statut: "non_etablie" });
});

// ── C8 : plusieurs audits à la même adresse ──────────────────────────────────────────────────────────

test("C8. plusieurs audits : un ordre écrit, les autres dits, le DPE rattaché l'emporte", () => {
  const tous = toAuditRecords(PLUSIEURS, BAN_FIXTURE);
  // Même jour : l'immeuble avant le logement, la plus grande surface d'abord, quel que soit l'ordre de l'API.
  assert.deepEqual(tous.map((a) => a.n_audit), ["A00FUT62PLU02", "A00FUT62PLU01", "A00FUT62PLU03"]);
  assert.deepEqual(toAuditRecords([...PLUSIEURS].reverse(), BAN_FIXTURE).map((a) => a.n_audit), tous.map((a) => a.n_audit));
  const lu = lectureAudit(PLUSIEURS, BAN_FIXTURE);
  assert.equal(lu.status, "present");
  if (lu.status !== "present") return;
  assert.equal(lu.audit.n_audit, "A00FUT62PLU02");

  // Sans DPE rattaché : l'immeuble, et les deux autres audits nommés, attribués à personne.
  const l = lireAuditPourDecision({ audit: lu.audit, autres: lu.autres, dpe: { numero: "2500E0000AUTRE", conso_ep_m2: 418.3 }, voix: "achat" });
  assert.equal(l.titre, "Un audit énergétique existe pour cet immeuble.");
  assert.equal(l.autresAudits, "Cette adresse porte aussi 2 autres audits : un audit d'immeuble (55 m², établi le 30 mai 2025) et un audit de logement (195 m², établi le 30 mai 2025). Aucun n'est attribué à ce bien.");
  assert.ok(l.verifications.includes("Plusieurs audits sont publiés pour cette adresse : demandez au vendeur lequel concerne ce bien."));

  // Avec le DPE de l'appartement : la source rattache l'audit de logement à ce diagnostic, il est retenu.
  const lie = lireAuditPourDecision({ audit: lu.audit, autres: lu.autres, dpe: { numero: DPE_APPARTEMENT, conso_ep_m2: 418.3 } });
  assert.equal(lie.rattacheAuDpe, true);
  assert.equal(lie.titre, "Un audit énergétique existe pour ce logement.");
  assert.deepEqual(lie.depart, { statut: "unique", valeur: 418.4 });
  assert.match(lie.autresAudits!, /^Cette adresse porte aussi 2 autres audits : un audit d'immeuble \(434 m²/);
  // Une consommation ou une surface voisines ne sont pas une preuve : sans numéro publié, pas de rattachement.
  const sansNumero = lu.autres.map((a) => ({ ...a, numero_dpe: null }));
  assert.equal(choisirAudit(lu.audit, sansNumero, DPE_APPARTEMENT).rattacheAuDpe, false);
});

test("C8c. un audit qui ne publie ni DPE rattaché, ni copropriété, ni nombre de logements garde la forme d'avant", () => {
  const a = toAuditRecord([{ n_audit: "A00FUT62SEUL", identifiant_ban: BAN_FIXTURE, categorie_scenario: "état initial", etape_travaux: "état initial", ep_conso_5_usages_m2: 300, surface_habitable_logement: 50 }], BAN_FIXTURE)!;
  // Mêmes clés qu'avant FUT-62 : l'empreinte des rapports existants ne bouge pas.
  assert.deepEqual(Object.keys(a).sort(), ["adresse", "classe_dpe_actuel", "correspondance", "date_audit", "n_audit", "objet", "scenarios"]);
  assert.equal(rec(IMMEUBLE_COPRO).copropriete, "AA0000000");
  assert.equal(rec(IMMEUBLE).nb_logements, 4);
});

test("C8b. une liste coupée par la source : le dernier audit (peut-être tronqué) est écarté, et c'est dit", () => {
  const lu = lectureAudit(PLUSIEURS, BAN_FIXTURE, true);
  assert.equal(lu.status, "present");
  if (lu.status !== "present") return;
  // Le dernier groupe de la page (PLU03) peut manquer d'étapes : il n'est pas lu.
  assert.deepEqual([lu.audit, ...lu.autres!].map((a) => a.n_audit).sort(), ["A00FUT62PLU01", "A00FUT62PLU02"]);
  assert.equal(lu.autresIncomplets, true);
  const l = lireAuditPourDecision({ audit: lu.audit, autres: lu.autres, autresIncomplets: true });
  assert.match(l.autresAudits!, /^Cette adresse porte au moins un autre audit : /);
  // Un audit que la source dit remplacé par un autre audit présent n'est plus compté.
  const remplace = toAuditRecords([...IMMEUBLE, ...LOGEMENT.map((r) => ({ ...r, n_audit_remplace: "A00FUT62IMM01" }))], BAN_FIXTURE);
  assert.deepEqual(remplace.map((a) => a.n_audit), ["A00FUT62LOG01"]);
});

// ── C9, C10 : voisin et source muette ────────────────────────────────────────────────────────────────

test("C9. un audit voisin n'atteint jamais la lecture, ni l'écran", () => {
  // Les lignes d'une autre adresse sont écartées, même mêlées à celles de l'adresse.
  const voisin = IMMEUBLE.map((r) => ({ ...r, n_audit: "A00FUT62VOI01", identifiant_ban: "99999_fut62_00099" }));
  assert.equal(toAuditRecord(voisin, BAN_FIXTURE), null);
  assert.deepEqual(toAuditRecords([...voisin, ...LOGEMENT], BAN_FIXTURE).map((a) => a.n_audit), ["A00FUT62LOG01"]);
  const bloc = readFileSync("src/components/report/logement/AuditEnergetiqueBlock.tsx", "utf8");
  assert.doesNotMatch(bloc, /auditProche|nearby_candidate/);
  assert.match(bloc, /audit\.correspondance !== "exact_address"/);
});

test("C10. audit non vérifiable : une phrase, dans tous les états de la section, jamais une absence", () => {
  const bloc = readFileSync("src/components/report/logement/AuditEnergetiqueBlock.tsx", "utf8");
  assert.match(bloc, /if \(auditStatus === "unavailable"\) \{[\s\S]*?Audit énergétique non vérifiable pour le moment/);
  const section = readFileSync("src/components/report/logement/EnergieSection.tsx", "utf8");
  // Le bloc est monté dans la branche « diagnostic à choisir / refusé / absent » ET dans la branche attribuée.
  assert.equal(section.match(/\{blocAudit\}/g)?.length, 2);
  assert.match(section, /const auditVisible = auditStatus === "unavailable"/);
});

// ── Garde-fous : aucune surinterprétation, quelle que soit la voix ───────────────────────────────────

test("G1. aucune sortie n'affirme une classe future, un coût, une aide, une date, un vote ou une garantie", () => {
  const voix: VoixAudit[] = ["achat", "habitant", "neutre"];
  const cas = [IMMEUBLE, IMMEUBLE_COPRO, LOGEMENT, INCOMPLET, DEUX_ETATS_INITIAUX];
  for (const rows of cas) for (const v of voix) for (const dpe of [null, { numero: DPE_MAISON, conso_ep_m2: 380 }]) {
    const t = texteDe(lireAuditPourDecision({ audit: rec(rows), dpe, voix: v }));
    assert.doesNotMatch(t, /\b(étiquette|classe) [A-G]\b/, "classe future");
    assert.doesNotMatch(t, /€|euros?\b|coût|prix|aide|subvention|MaPrimeRénov|reste à charge/i, "argent");
    assert.doesNotMatch(t, /garanti|certain(e|ement)?\b|assuré/i, "garantie");
    assert.doesNotMatch(t, /\b20[3-9]\d\b|d'ici|prévus? (en|pour)/, "date de réalisation");
    // « votés, financés ou planifiés » n'apparaît que dans une QUESTION à poser.
    for (const ligne of t.split("\n")) {
      if (/votés|financés|planifiés/.test(ligne)) assert.match(ligne, /[Dd]emandez [^.]*lesquels ont été votés, financés ou planifiés/, ligne);
    }
    // `travaux_realises` décrit des travaux PROPOSÉS : « réalisés » n'apparaît que dans une question.
    for (const ligne of t.split("\n")) {
      if (/réalisé/.test(ligne)) assert.match(ligne, /[Dd]emandez au vendeur lesquels de ces travaux ont déjà été réalisés|les travaux réalisés depuis n'y figurent pas/, ligne);
    }
  }
});

test("G2. un audit d'immeuble ne devient jamais celui de l'appartement, même rattaché au DPE retenu", () => {
  const imm = rec(IMMEUBLE.map((r) => ({ ...r, numero_dpe: "2500E0000IMM" })));
  for (const v of ["achat", "habitant", "neutre"] as VoixAudit[]) {
    const l = lireAuditPourDecision({ audit: imm, dpe: { numero: "2500E0000IMM", conso_ep_m2: 300 }, voix: v });
    assert.equal(l.titre, "Un audit énergétique existe pour cet immeuble.");
    assert.match(l.portee, /pas sur ce seul logement/);
    assert.doesNotMatch(texteDe(l), /pour ce logement\./);
  }
});

test("G3. la voix suit la relation DÉCLARÉE au bien, jamais devinée", () => {
  assert.equal(voixAudit({ relation: "studying", objectif: "buy" }), "achat");
  assert.equal(voixAudit({ relation: "lives_here", objectif: null }), "habitant");
  assert.equal(voixAudit({ relation: null, objectif: "understand" }), "habitant");
  assert.equal(voixAudit({ relation: "studying", objectif: "rent" }), "neutre");
  assert.equal(voixAudit({ relation: null, objectif: null }), "neutre");
  assert.equal(voixAudit(null), "neutre");
  const habitant = lireAuditPourDecision({ audit: rec(IMMEUBLE), voix: "habitant" });
  assert.equal(habitant.titreVerifications, "À suivre");
  assert.doesNotMatch(texteDe(habitant), /vendeur|acheter/);
  assert.match(habitant.verifications[0], /demandez au syndic lesquels/);
  assert.equal(lireAuditPourDecision({ audit: rec(IMMEUBLE) }).titreVerifications, "À vérifier avant de vous engager");
  // L'écran lit la relation du dossier, par la même fonction.
  assert.match(readFileSync("src/components/report/LogementModule.tsx", "utf8"), /voixAudit=\{voixAudit\(relationDeLAdresse\(dossier\)\)\}/);
});

test("G4. les valeurs restent en kWh EP/m²/an, par le formatter commun", () => {
  const l = lireAuditPourDecision({ audit: rec(IMMEUBLE), dpe: { numero: null, conso_ep_m2: 418.3 } });
  assert.match(l.lienDpe!, /418,3\skWh EP\/m²\/an/);
  const bloc = readFileSync("src/components/report/logement/AuditEnergetiqueBlock.tsx", "utf8");
  // Le nombre seul de l'écran (l'unité à part) retire bien l'unité écrite avec une espace insécable.
  assert.match(bloc, /replace\(\/\\s\*kWh EP/);
  assert.match(bloc, /kWh EP\/m²\/an/);
  assert.doesNotMatch(bloc, /kWh\/m²|kWh EP\/an\b/);
});
