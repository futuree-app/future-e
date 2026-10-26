// FUT-72 : LE CONTRÔLE DE CAUSALITÉ DÉMOGRAPHIQUE DE /qna. Module PUR : aucune I/O, aucun appel IA.
//
// Une croissance et une part d'arrivants récents décrivent ce que le recensement observe, jamais POURQUOI
// des habitants s'installent. Ce contrôle refuse une réponse qui prête à la commune une attraction ou aux
// arrivants un motif.
//
// Pourquoi pas le moteur générique (`checkRegles`) : sa négation « au sens large » est réglée pour une
// autre question. Un « sans » n'importe où dans la proposition l'annule (« La commune attire des familles
// sans difficulté » passait), et une MISE EN GARDE (« Il faut éviter de parler de commune attractive »)
// était refusée. Ici, une affirmation n'est écartée que par :
//   - une négation PORTÉE PAR SON VERBE : « n'attire pas », « ne les attirera plus » (pas « n'attire que »,
//     qui affirme) ;
//   - un CADRE de réserve qui la précède dans la même proposition : « rien ne prouve que », « les données ne
//     disent pas si », « on ne peut pas conclure à », « il faut éviter de parler de »…
//
// Limites assumées d'un contrôle déterministe (documentées par les tests) :
//   - « attirer » n'est refusé que selon la place des mots AUTOUR du verbe, sans analyse grammaticale :
//     le groupe sujet qui le précède est le territoire (« la commune attire », « elle pourrait attirer »),
//     le groupe objet qui le suit désigne des personnes (« attire de jeunes actifs »), ou le participe se
//     rapporte à des personnes (« des familles attirées par »). Un mot de personne AILLEURS ne compte pas :
//     « le dossier attire votre attention sur les risques pour les familles » et « les eaux stagnantes
//     attirent les moustiques près des habitants » passent. Le groupe objet s'arrête à la première
//     préposition de lieu ou de but (près, sur, pour, chez…) ou après six mots. Conséquences assumées :
//     « les eaux stagnantes de la commune attirent les moustiques » est refusé à tort (le territoire est le
//     groupe qui précède le verbe) ; « le bruit attire les plaintes des habitants » aussi (le complément
//     du nom reste dans le groupe objet) ; « ces emplois les attirent » passe (le pronom n'est pas résolu) ;
//   - un cadre de réserve placé APRÈS l'affirmation ne la rattrape pas (« Elle attire des familles, rien ne
//     le prouve » est refusé) ; une réserve dans une autre proposition (« … ne disent pas tout, mais elle
//     attire », « rien ne prouve le contraire et la commune attire ») non plus. Un « et » suivi d'un sujet
//     ouvre une nouvelle proposition, même quand c'est un sujet coordonné sous la réserve (refus à tort) ;
//   - les motifs sont reconnus par des tournures (« choisissent … pour sa qualité de vie », « grâce à son
//     cadre de vie », « prisée », « séduit ») : une paraphrase hors de ces familles passe. Le prompt reste
//     la première barrière ; ce contrôle est le filet.
import { normalizeText, sentencesOf, type Violation } from "../garde-fous/assertions.ts";

// `\b` ne voit pas les lettres accentuées (« éviter », « attractivité ») : bornes en lookaround.
const L = "[a-zàâäçéèêëîïôöûùüÿœ]";
const D = `(?<!${L})`;
const finDeMot = `(?!${L})`;

// Les personnes et le territoire dont une attraction parlerait.
const PERSONNES = new RegExp(
  `${D}(habitants?|familles?|ménages?|personnes?|gens|monde|actifs?|jeunes|retraités?|seniors?|étudiants?|résidents?|arrivants?|nouveaux venus|population|citadins?|parisiens?|néo-\\w+|investisseurs?|entreprises?|touristes?|vous)${finDeMot}`,
);
const TERRITOIRE = new RegExp(`${D}(commune|ville|village|territoire|bourg|agglomération|région)${finDeMot}`);
// « elle », « il » : le territoire seulement s'ils SONT le groupe sujet (« elle attire »), pas l'impersonnel
// « il faut attirer l'attention ».
const PRONOMS_SUJETS = new Set(["elle", "il"]);

/** Une affirmation candidate : sa famille, et la règle qu'elle viole. */
type Famille = { rule: string; re: RegExp; porteSurPersonnes?: boolean };

const FAMILLES: Famille[] = [
  // attirer, à tous les temps et modes (attire, attirera, attirerait, attira, attiré·e·s, attirant…).
  { rule: "interdit:attractivite", re: new RegExp(`${D}attir${L}*`, "g"), porteSurPersonnes: true },
  { rule: "interdit:attractivite", re: new RegExp(`${D}(attractif|attractifs|attractive|attractives|attractivités?|attraits?)${finDeMot}`, "g") },
  { rule: "interdit:attractivite", re: new RegExp(`${D}(séduis${L}*|séduit|séduire|séduira${L}*|plébiscit${L}*|prisée?s?|convoitée?s?|courue?s?|recherchée?s? par)${finDeMot}`, "g") },
  // Un motif prêté aux arrivants : « choisissent cette commune pour sa qualité de vie ».
  {
    rule: "interdit:cause-demographique",
    re: new RegExp(`${D}(choisi${L}*|choisir|préf[éè]r${L}*|vien${L}*|venir|s'install${L}*|arriv${L}*|emménag${L}*)${finDeMot}[^.;:]*?\\bpour (sa|son|ses|la|le|les|l'|leur)\\s*${L}+`, "g"),
  },
  // Une croissance ou des arrivées expliquées : « grâce à », « en raison de », « s'explique par »…
  {
    rule: "interdit:cause-demographique",
    re: new RegExp(`${D}(croissance|population|habitants|arrivées|arrivants|installations?)${finDeMot}[^.;:]*?${D}(grâce à|en raison de|du fait de|s'expliqu${L}* par|tient à|tiennent à|due? à|dues à|portée? par)`, "g"),
  },
  // Une mesure démographique présentée comme la preuve d'un choix : « la croissance prouve que les familles
  // choisissent », « la hausse reflète la qualité de vie ».
  {
    rule: "interdit:cause-demographique",
    re: new RegExp(`${D}(croissance|population|hausse|augmentation|habitants|arrivées|arrivants|installations?)${finDeMot}[^.;:]*?${D}(prouv|démontr|montr|témoign|trahi|reflèt|reflét|tradui|confirm|signe|illustr)${L}*[^.;:]*?${D}(choisi${L}*|choix|préf[éè]r${L}*|envie|désir${L}*|succès|attraits?|qualité de vie|cadre de vie)${finDeMot}`, "g"),
  },
];

// La proposition qui contient l'affirmation : on coupe aux points-virgules, deux-points et aux
// conjonctions d'opposition, pas aux virgules (« Rien ne permet de dire, à ce stade, que… »).
const COUPURE = /;|:|\b(mais|pourtant|cependant|toutefois|néanmoins|or)\b/g;

function debutDeProposition(phrase: string, index: number): number {
  let debut = 0;
  COUPURE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = COUPURE.exec(phrase)) && m.index < index) debut = m.index + m[0].length;
  return debut;
}

// Négation portée par le verbe : « ne / n' » juste avant (pronoms compris), « pas, plus, jamais… » juste
// après. « n'attire que » n'est pas une négation : c'est une restriction qui affirme.
const NE_AVANT = /\bn(e\s+|')((les?|la|l'|leur|lui|en|y|se|s'|vous|nous)\s*){0,2}$/;
const PAS_APRES = new RegExp(`^${L}*(-\\w+)?\\s+((les?|la|l'|leur|en|y|vous)\\s+)?(pas|plus|jamais|guère|nullement|aucunement|point)${finDeMot}`);

// Les cadres de réserve : ce qui suit n'est pas affirmé, mais déclaré non établi ou à éviter.
const VERBES_DE_PREUVE = `(permet${L}*|prouv${L}*|montr${L}*|di[st]${L}*|disent|indiqu${L}*|établi${L}*|expliqu${L}*|garanti${L}*|peu[tx]${L}*|pouv${L}*|sai[st]|sav${L}*|mesur${L}*|renseign${L}*|suffi${L}*|autoris${L}*|signifi${L}*|veu[tl]${L}*|démontr${L}*|attest${L}*|apprend${L}*|apprenn${L}*)`;
const DIRE = "(parler|dire|conclure|affirmer|écrire|présenter|qualifier|déduire|en déduire|supposer|prêter|attribuer|prétendre|voir|lire|interpréter)";
const CADRES = [
  new RegExp(`${D}n(e\\s+|')((l'|le|les|nous|vous|se|s'|en|y)\\s*)?${VERBES_DE_PREUVE}\\s+(pas|rien|aucunement|nullement|jamais|guère)${finDeMot}`),
  new RegExp(`${D}(rien|personne|aucun${L}*(\\s+${L}+){0,2})\\s+n(e\\s+|')((l'|le|les|nous|vous|en)\\s*)?${VERBES_DE_PREUVE}`),
  // « Il serait hâtif d'en déduire », « il faut éviter de parler de », « gardez-vous de conclure » : la
  // réserve exige un verbe de discours, sinon « difficile de se loger, la commune attire » passerait.
  new RegExp(`${D}(impossible|difficile|abusif|hâtif|faux|trompeur|imprudent|exagéré|prématuré|excessif) d(e\\s+|')(en\\s+)?${DIRE}`),
  new RegExp(`${D}(évit${L}*|gardez-vous|garder|s'abstenir|abstenez-vous|attention à ne pas|méfiez-vous|se méfier)\\s+(de\\s+|d')?(en\\s+)?${DIRE}`),
  new RegExp(`${D}ne pas (en\\s+)?${DIRE}`),
  /\bsans (pouvoir|qu'on puisse|que (les|ces) (données|chiffres|recensements|mesures))\b/,
  /\b(on ignore|on ne sait|nul ne sait|reste à (établir|démontrer|prouver)|n'est pas (établi|démontré|prouvé|mesuré))\b/,
];

// ── « attirer » : qui attire, et qui est attiré ─────────────────────────────────────────────────
//
// Un repérage par position, volontairement borné (ce n'est pas un analyseur) :
//   - SUJET : le groupe nominal juste avant le verbe, après avoir retiré les auxiliaires, semi-auxiliaires,
//     négations, pronoms compléments et adverbes qui s'intercalent (« elle pourrait déjà les attirer ») ;
//     il remonte jusqu'à son déterminant (« la commune de Belley ») ou quatre mots ;
//   - OBJET : les mots qui suivent le verbe, jusqu'à une préposition de lieu ou de but, une conjonction,
//     une virgule, ou six mots. « attire votre attention sur les risques pour les familles » : l'objet est
//     « votre attention » ;
//   - PARTICIPE (« attirées ») : le groupe sujet est ce qui est attiré.
const INTERCALES = new Set([
  "a", "ont", "avait", "avaient", "aura", "auront", "aurait", "auraient", "eu",
  "est", "sont", "était", "étaient", "sera", "seront", "serait", "seraient", "été",
  "va", "vont", "allait", "allaient", "ira", "iront",
  "peut", "peuvent", "pourra", "pourront", "pourrait", "pourraient", "pouvait", "pouvaient",
  "doit", "doivent", "devrait", "devraient", "devait", "devaient",
  "continue", "continuent", "continuait", "continuera", "semble", "semblent", "risque", "risquent",
  "commence", "commencent", "finit", "finissent", "parvient", "parviennent", "réussit", "réussissent",
  "à", "d'", "de", "ne", "n'", "le", "la", "les", "l'", "leur", "lui", "y", "en", "se", "s'", "vous", "nous",
  "déjà", "toujours", "encore", "aussi", "davantage", "plus", "beaucoup", "surtout", "notamment",
  "également", "bien", "très", "fortement", "désormais", "longtemps", "peu", "même", "particulièrement",
]);
const DETERMINANTS = new Set([
  "le", "la", "les", "l'", "un", "une", "des", "du", "ce", "cet", "cette", "ces",
  "son", "sa", "ses", "leur", "leurs", "notre", "nos", "votre", "vos", "mon", "ma", "mes",
]);
const FIN_DE_GROUPE_SUJET = new Set(["que", "qu'", "qui", "car", "si", "et", "ou", "où", "dont", "lorsque", "quand", "puisque", ","]);
const FIN_D_OBJET = new Set([
  "près", "auprès", "chez", "sur", "sous", "vers", "dans", "autour", "à", "au", "aux", "pour", "par", "avec",
  "sans", "entre", "contre", "depuis", "malgré", "comme", "lors", "que", "qu'", "qui", "dont", "où", "et", "ou",
  "car", "mais", "si", ",",
]);
const MOTS = /[a-zàâäçéèêëîïôöûùüÿœ-]+'?|,/g;
const PARTICIPE = /^attir(é|ée|és|ées)$/;
// « attirant » adjectif (« un cadre attirant pour les familles ») : sans objet direct, il qualifie.
const ATTIRANT = /^attirant(e|s|es)?$/;

const mots = (texte: string): string[] => texte.match(MOTS) ?? [];

/** Le groupe sujet : le groupe nominal juste avant le verbe, intercalés retirés. */
function groupeSujet(avant: string): string {
  const m = mots(avant);
  while (m.length && INTERCALES.has(m[m.length - 1])) m.pop();
  const groupe: string[] = [];
  while (m.length && groupe.length < 4) {
    const w = m.pop()!;
    if (FIN_DE_GROUPE_SUJET.has(w)) break;
    groupe.unshift(w);
    if (DETERMINANTS.has(w)) break;
  }
  return groupe.join(" ");
}

/** Le groupe objet : les mots qui suivent le verbe, jusqu'à une préposition, une conjonction ou six mots. */
function groupeObjet(apres: string): string[] {
  const objet: string[] = [];
  for (const w of mots(apres)) {
    if (FIN_D_OBJET.has(w) || objet.length >= 6) break;
    objet.push(w);
  }
  return objet;
}

/** « attirer » porte-t-il sur des habitants ou sur le territoire (et non sur l'attention, un moustique…) ? */
function attractionResidentielle(proposition: string, index: number, forme: string, commune: string | null): boolean {
  const sujet = groupeSujet(proposition.slice(0, index));
  if (TERRITOIRE.test(sujet) || PRONOMS_SUJETS.has(sujet) || (!!commune && sujet.includes(commune))) return true;
  if (PARTICIPE.test(forme) && PERSONNES.test(sujet)) return true;
  const objet = groupeObjet(proposition.slice(index + forme.length));
  if (ATTIRANT.test(forme) && (objet.length === 0 || !DETERMINANTS.has(objet[0]))) return true;
  return PERSONNES.test(objet.join(" "));
}

// Un « et » suivi d'un nouveau sujet ouvre une proposition indépendante : la réserve qui précède ne la couvre
// pas (« Rien ne prouve le contraire et la commune attire des familles »). Un « et » suivi d'un verbe
// (« rien ne prouve que la commune attire et séduise… ») ou de « que », « si » (« … et que la commune
// attire… ») reste sous la réserve. Limite : un sujet coordonné sous la réserve (« rien ne prouve que les
// jeunes et les familles sont attirés ») est lu comme une nouvelle proposition et refusé à tort.
const SUJETS_APRES_ET = new Set([...DETERMINANTS, "il", "elle", "ils", "elles", "on", "cela", "ça", "c'"]);
const ET = new RegExp(`${D}et\\s+`, "g");

/** Le début de la proposition indépendante qui porte l'affirmation, après un « et » suivi d'un sujet. */
function debutApresEt(phrase: string, debut: number, index: number, commune: string | null): number {
  const avant = phrase.slice(0, index);
  ET.lastIndex = debut;
  let m: RegExpExecArray | null;
  let coupure = debut;
  while ((m = ET.exec(avant))) {
    const suite = avant.slice(m.index + m[0].length);
    const premier = mots(suite)[0] ?? "";
    if (SUJETS_APRES_ET.has(premier) || (!!commune && suite.startsWith(commune))) coupure = m.index + m[0].length;
  }
  return coupure;
}

// Une réserve avant l'affirmation, ou DANS elle quand elle s'étend sur plusieurs mots (« la croissance ne
// prouve pas que les familles choisissent… »).
function estReservee(phrase: string, debut: number, index: number, longueur: number, commune: string | null): boolean {
  if (NE_AVANT.test(phrase.slice(debut, index)) && PAS_APRES.test(phrase.slice(index, index + longueur + 40))) return true;
  const portee = phrase.slice(debutApresEt(phrase, debut, index, commune), index + longueur);
  return CADRES.some((re) => re.test(portee));
}

/** Les affirmations d'attraction ou de motif démographique d'un texte. */
export function checkCausaliteDemographique(texte: string, commune: string | null = null): Violation[] {
  const out: Violation[] = [];
  const nom = commune ? normalizeText(commune).trim() : null;
  for (const phrase of sentencesOf(normalizeText(texte))) {
    for (const f of FAMILLES) {
      f.re.lastIndex = 0;
      let m: RegExpExecArray | null;
      let refusee = false;
      while (!refusee && (m = f.re.exec(phrase))) {
        const debut = debutDeProposition(phrase, m.index);
        const proposition = phrase.slice(debut);
        if (f.porteSurPersonnes && !attractionResidentielle(proposition, m.index - debut, m[0], nom)) continue;
        if (estReservee(phrase, debut, m.index, m[0].length, nom)) continue;
        out.push({ rule: f.rule, excerpt: phrase });
        refusee = true;
      }
    }
  }
  return out;
}
