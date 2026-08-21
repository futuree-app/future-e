// CE QUE LA TABLE DES GESTES RACONTE, pas seulement ce qu'elle contient. Les contrôles de forme
// (libellé non vide, 70 caractères, pas d'ouverture par « Vérifi ») vivent déjà dans
// `logement-rules.test.ts` et `logement-verifications.test.ts` : ils vérifient qu'une action EXISTE.
// Ce fichier vérifie ce qu'elle DIT — et d'abord son invariant le plus fragile :
//
//     Une action `location` ne présuppose jamais qu'un bail est déjà en cours.
//
// La posture `location` est celle de quelqu'un qui envisage de louer. Celui qui loue déjà relève de
// `reside` (`bucketDuProjet` teste l'intention avant la posture). Trois variantes l'avaient oublié et
// s'adressaient à un locataire en place, donc à personne : le candidat locataire ne peut que
// REGARDER pendant la visite et DEMANDER à celui qui détient l'information.
//
// Le test ne repose pas sur une liste de mots interdits seule : chaque famille concernée est
// contrôlée sur la formulation attendue (ce qu'on observe, à qui on demande, quoi), et l'invariant
// transverse porte sur le VERBE D'OUVERTURE, qui est structurellement ce qui trahit la posture.
import test from "node:test";
import assert from "node:assert/strict";
import { GESTES, bucketDuProjet, type Bucket } from "./logement-gestes.ts";

/** Les variantes `location` réellement rendues (patrimoine est exclu par la règle : chaîne vide). */
const LOCATION = Object.entries(GESTES)
  .map(([key, g]) => [key, g.location] as const)
  .filter(([, copy]) => copy.label.length > 0);

// ── L'invariant transverse ────────────────────────────────────────────────────────────────────

test("bucketDuProjet : `location` est une INTENTION, l'occupant en place est `reside`", () => {
  // L'invariant de ce fichier n'a de sens que si le bucket sépare bien les deux situations.
  assert.equal(bucketDuProjet({ intent: "location" }), "location");
  assert.equal(bucketDuProjet({ posture: "habitant" }), "reside");
  assert.equal(bucketDuProjet({ intent: "location", posture: "habitant" }), "location");
  assert.equal(bucketDuProjet({}), "neutre");
});

test("UNE ACTION `location` NE PRÉSUPPOSE JAMAIS UN BAIL EN COURS", () => {
  // Le verbe d'ouverture est le porteur de la posture. « Signalez », « Suivez », « Surveillez »,
  // « Notez », « Gardez », « Retrouvez » décrivent un geste qui suppose déjà l'accès au logement et
  // une relation ouverte avec le bailleur. Avant l'engagement, il reste deux gestes possibles.
  const OUVERTURES_AVANT_ENGAGEMENT = /^(Demandez|Regardez|Consultez|Renseignez-vous)\b/;
  for (const [key, copy] of LOCATION) {
    assert.match(copy.label, OUVERTURES_AVANT_ENGAGEMENT, `${key}.location : « ${copy.label} » n'est pas un geste possible avant de s'engager`);
  }
  // Et le détail ne raccroche pas non plus la personne à une occupation déjà commencée.
  const BAIL_EN_COURS = /pendant le bail|votre bail|en cours de bail|depuis votre entrée|vous habitez|votre logement|votre entrée dans les lieux/i;
  for (const [key, copy] of LOCATION) {
    assert.doesNotMatch(copy.detail, BAIL_EN_COURS, `${key}.location : le détail parle à quelqu'un qui loue déjà`);
    assert.doesNotMatch(copy.label, BAIL_EN_COURS, `${key}.location : le libellé parle à quelqu'un qui loue déjà`);
  }
});

test("`location` : le geste nomme ce qu'on demande, ou l'endroit où l'on regarde", () => {
  // Avant l'engagement, une action n'est faisable que si elle dit à QUI s'adresser ou QUOI regarder.
  // « Renseignez-vous » sans objet renverrait le candidat locataire à une démarche qu'il ne sait pas
  // commencer.
  const OBJET_OU_INTERLOCUTEUR = /bailleur|visite|sur place|mairie|document|diagnostic|factures?|état des risques|règlement|prescriptions/i;
  for (const [key, copy] of LOCATION) {
    const texte = `${copy.label} ${copy.detail}`;
    assert.match(texte, OBJET_OU_INTERLOCUTEUR, `${key}.location : ni interlocuteur ni objet nommé`);
  }
});

// ── Les trois familles corrigées, sur leur formulation attendue ───────────────────────────────

test("BÂTI · location : on observe les fissures, et on demande ce qui en est documenté", () => {
  const { label, detail } = GESTES.bati.location;
  const texte = `${label} ${detail}`;
  assert.match(label, /^Demandez au bailleur/);
  assert.match(texte, /fissures/i);
  // Le geste d'observation à la visite, qui est ce que le candidat locataire peut réellement faire.
  assert.match(detail, /Regardez/);
  assert.match(detail, /visite/i);
  // Ce qu'on demande : l'origine ou l'évolution DOCUMENTÉE, pas un jugement du bailleur.
  assert.match(detail, /origine|évolution/i);
  assert.match(detail, /documentée?/i);
  // Le geste de locataire en place a disparu : plus de signalement écrit d'un désordre constaté chez soi.
  assert.doesNotMatch(texte, /Signalez|par écrit/i);
});

test("BÂTI · location : aucune cause n'est attribuée aux fissures", () => {
  // Une fissure peut venir du retrait des argiles, d'un tassement, d'un défaut d'exécution ou d'un
  // mouvement ancien stabilisé. Le produit n'a pas de quoi trancher, et le geste ne doit pas le faire.
  const texte = `${GESTES.bati.location.label} ${GESTES.bati.location.detail}`;
  assert.doesNotMatch(texte, /à cause de|dû à|due à|en raison de|provoqu|argile|tassement|affaissement du bâti/i);
});

test("CAVITÉ · location : on cherche des signes, et on demande ce qui a été documenté", () => {
  const { label, detail } = GESTES.cavite.location;
  assert.match(label, /^Demandez au bailleur/);
  assert.match(`${label} ${detail}`, /sol|affaisse/i);
  assert.match(detail, /Regardez|visite/i);
  // Ce qu'on demande est NOMMÉ : des désordres, des études du sol, et le fait qu'ils aient été
  // documentés. « Demandez ce qui en est su » laissait le candidat locataire sans question à poser.
  assert.match(detail, /désordres/i);
  assert.match(detail, /études du sol/i);
  assert.match(detail, /documentés?/i);
  assert.doesNotMatch(`${label} ${detail}`, /Signalez|par écrit/i);
});

test("SINISTRALITÉ · location : l'état des risques se demande AVANT de s'engager", () => {
  const { label, detail } = GESTES.sinistralite.location;
  assert.match(label, /état des risques/i);
  // Le moment est nommé, et c'est celui où l'on peut encore renoncer.
  assert.match(detail, /avant de vous engager|avant de signer/i);
  // Le détail mélangeait un document « remis à la signature » et un sinistre « survenu pendant le
  // bail » : deux moments incompatibles dans le même geste, dont le second est déjà passé.
  assert.doesNotMatch(detail, /pendant le bail|survenu pendant/i);
  assert.doesNotMatch(detail, /remis à la signature/i);
});

test("RÉGLEMENTAIRE · location : le document est demandé, pas annoncé comme un dû", () => {
  // Même correction de cohérence : « L'état des risques remis à la signature » énonçait une
  // obligation juridique que le produit ne source pas (précaution 1 de la table).
  const { detail } = GESTES.reglementaire.location;
  assert.doesNotMatch(detail, /remis à la signature/i);
  assert.match(detail, /avant de signer|avant de vous engager/i);
});

// ── Les précautions de la table, sur la seule colonne `location` ──────────────────────────────

test("`location` : aucun geste ne promet qu'un document lèvera le doute", () => {
  for (const [key, copy] of LOCATION) {
    const texte = `${copy.label} ${copy.detail}`;
    assert.doesNotMatch(texte, /lève(ra)? le doute|garanti|assure que|prouve que|permet d'écarter|met fin au doute/i, `${key}.location promet un résultat`);
  }
});

test("`location` : aucun geste ne prescrit de travaux ni n'invente un délai", () => {
  for (const [key, copy] of LOCATION) {
    const texte = `${copy.label} ${copy.detail}`;
    assert.doesNotMatch(texte, /faites réaliser des travaux|engagez des travaux|obligation de|sous \d+ jours|dans un délai/i, `${key}.location prescrit ou date`);
  }
});

test("FORME : la colonne `location` respecte le gabarit de la table", () => {
  for (const [key, copy] of LOCATION) {
    assert.ok(copy.label.length <= 70, `${key}.location : ${copy.label.length} caractères`);
    assert.doesNotMatch(copy.label, /[.!?]$/, `${key}.location : le libellé se termine comme une phrase`);
    assert.match(copy.detail, /[.!?]$/, `${key}.location : le détail n'est pas ponctué`);
  }
});

test("les quatre postures existent pour chaque geste, et une seule variante vide est tolérée", () => {
  const BUCKETS: Bucket[] = ["neutre", "achat", "reside", "location"];
  for (const [key, geste] of Object.entries(GESTES)) {
    for (const b of BUCKETS) assert.ok(geste[b], `${key}.${b} manquant`);
  }
  // `patrimoine.location` est exclue par la règle ET par la checklist : un locataire ne fait pas ces
  // travaux. C'est la seule chaîne vide de la table ; toute autre serait un trou de rendu.
  const vides = Object.entries(GESTES).flatMap(([key, g]) =>
    BUCKETS.filter((b) => !g[b].label).map((b) => `${key}.${b}`),
  );
  assert.deepEqual(vides, ["patrimoine.location"]);
});
