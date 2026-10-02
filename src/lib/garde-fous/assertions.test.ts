// FUT-37 : les règles des récits publics détectent les phrases RÉELLEMENT produites par l'accueil avant
// correction (audit du 02/10/2026), et laissent passer les formulations justes, y compris niées. On teste
// les deux côtés : une règle trop large punirait une phrase vraie et ferait tomber /qna en repli.
import test from "node:test";
import assert from "node:assert/strict";
import { checkRecitPublic, REGLES_UNIVERSELLES } from "./assertions.ts";

const regles = (t: string) => [...new Set(checkRecitPublic(t).map((v) => v.rule))];

test("les phrases fautives de l'ancien accueil sont toutes détectées", () => {
  const fautives: [string, string][] = [
    ["L'accès à l'eau pourrait devenir plus tendu pendant les étés.", "interdit:tension-eau"],
    ["Les chaleurs extrêmes pourraient durer plusieurs semaines par an.", "interdit:duree-continue"],
    ["Les périodes à risque élevé pourraient durer une grande partie de l'été.", "interdit:duree-continue"],
    ["Les conditions propices aux feux occuperont une grande partie de l'été.", "interdit:duree-continue"],
    ["À votre adresse, le risque d'inondation est élevé.", "grain:logement-depuis-commune"],
    ["Le risque d'incendie pourrait fortement progresser autour de Briançon.", "interdit:occurrence-feu"],
    ["Le manteau neigeux à Chamonix pourrait se réduire significativement d'ici 2050.", "interdit:neige-sans-donnee"],
    ["L'enneigement à Chamonix pourrait devenir moins fiable d'ici 2030.", "interdit:neige-sans-donnee"],
    ["L'économie montagnarde autour de Chamonix pourrait être fragilisée par des hivers trop doux.", "interdit:neige-sans-donnee"],
    ["La neige pourrait devenir rare et imprévisible à Chamonix d'ici 2050.", "interdit:neige-sans-donnee"],
    ["La submersion marine à La Rochelle pourrait s'étendre à de nouvelles zones d'ici 2050.", "interdit:projection-risque-recense"],
    ["En fin de siècle, des quartiers de La Rochelle pourraient être régulièrement submergés par la mer.", "interdit:projection-risque-recense"],
    ["Les inondations à Nantes pourraient toucher des zones aujourd'hui épargnées d'ici 2100.", "interdit:projection-risque-recense"],
    ["La montée des eaux pourrait aggraver le risque de submersion marine à Brest d'ici 2030.", "interdit:projection-risque-recense"],
    ["Les pluies extrêmes pourraient accentuer les risques de crue.", "interdit:crue-depuis-pluie"],
    ["Le risque d'inondation à Nantes pourrait s'intensifier avec des pluies plus violentes.", "interdit:crue-depuis-pluie"],
    ["Les épisodes de crues à Nantes pourraient devenir plus fréquents d'ici 2030.", "interdit:projection-risque-recense"],
    ["Les biens exposés aux risques climatiques à Vannes pourraient perdre significativement de leur valeur d'ici 2050.", "interdit:prediction-immobiliere"],
    ["D'ici 2030, les biens en zone à risque à Vannes pourraient connaître une première décote.", "interdit:prediction-immobiliere"],
    ["Certains biens immobiliers à Vannes pourraient devenir difficiles à assurer ou à revendre d'ici 2100.", "interdit:prediction-immobiliere"],
    ["À Vannes, les risques climatiques et les normes énergétiques vont peser sur les prix.", "interdit:prediction-immobiliere"],
    ["Les obligations de rénovation rendront certains biens quasi invendables sans travaux.", "interdit:prediction-immobiliere"],
    ["Les coûts d'assurance habitation progressent de 8 à 12 % par an sur le littoral.", "interdit:prediction-immobiliere"],
    ["Les projections placent Lyon parmi les communes les plus exposées aux étés futurs.", "interdit:classement-national"],
    ["Votre logement sera exposé aux inondations.", "grain:logement-depuis-commune"],
    ["Les nappes de la commune vont baisser.", "interdit:ressource-eau-affirmee"],
    ["Les habitants feront face à des pénuries d'eau.", "interdit:ressource-eau-affirmee"],
  ];
  for (const [phrase, regle] of fautives) assert.ok(regles(phrase).includes(regle), `${regle} manqué : ${phrase}`);
});

test("les formulations justes, y compris niées, passent", () => {
  const justes = [
    "14 jours par an à l'horizon 2050, contre 3 sur 1976-2005.",
    "Moins d'une journée par an à l'horizon 2050, comme sur 1976-2005.",
    "Cet indice décrit des conditions météorologiques favorables aux feux ; il ne mesure ni la végétation ni la probabilité qu'un incendie se déclare.",
    "Indice d'humidité des sols (SWI) inférieur à 0,4 : il décrit l'eau disponible pour la végétation. Il ne mesure ni les nappes, ni les rivières, ni l'eau du robinet.",
    "L'État recense un risque de submersion marine sur la commune.",
    "Ce recensement ne dit pas quelle partie de la commune est concernée ni comment elle évoluera. L'exposition d'une adresse se vérifie dans le dossier Logement.",
    "futur•e ne prédit pas les prix futurs.",
    "futur•e ne mesure pas l'enneigement.",
    "Ces indicateurs comptent un nombre de jours sur l'année ; ils ne permettent pas, à eux seuls, de déduire la durée d'une période.",
    "Des restrictions d'eau de niveau crise sont en vigueur sur le bassin de Charente-aval.",
    "Température moyenne de l'hiver : −1,8 °C à l'horizon 2100, contre −5,1 °C sur 1976-2005.",
    "L'État recense un risque d'inondation sur la commune.",
    "Ce sont des nuits sans fraîcheur, où le corps récupère mal de la chaleur du jour.",
  ];
  for (const p of justes) assert.deepEqual(regles(p), [], p);
});

test("les quatre règles universelles sont exactement celles que le dossier applique aussi", () => {
  assert.deepEqual(REGLES_UNIVERSELLES.map((r) => r.id), [
    "interdit:tension-eau",
    "raccord:non-autorise",
    "interdit:marche-logement",
    "interdit:classement-national",
  ]);
});
