// LES LIBELLÉS HUMAINS D'UN CRITÈRE (FUT-8, §9). Lib PURE, utilisable côté navigateur.
//
// Trois couches de langage, jamais mélangées :
//   - le langage du lecteur (`titre`, `court`) : « Vivre en Bretagne », « la Bretagne » ;
//   - l'interprétation de futur•e (`interpretation`), montrée seulement quand elle compte : au moment de
//     confirmer, dans « Données et limites » ;
//   - le moteur (jetons, seuils, unités), jamais affiché tel quel.
// `question` n'existe que lorsqu'une précision manque pour trancher : elle se pose au moment de
// confirmer, ou quand le lecteur affine lui-même. Jamais en questionnaire.
//
// Le projet passé ici est la VALEUR EFFECTIVE (parsed ⊕ définitions) : une précision acceptée change
// donc le libellé.
import type { UserProject, CriterionRef } from "../user-project.ts";
import type { PreferenceKey } from "../comparateur-vie.ts";
import { ZONE_TABLE } from "../geo-zones.ts";
import { departmentName } from "../regions-fr.ts";
import { PREFERENCE_LABELS } from "../comparateur-labels.ts";
import { conventionPar } from "./conventions.ts";

export type CriterionPresentation = {
  titre: string;
  court: string;
  question?: string;
  interpretation?: string;
};

const REGIONS = new Set([
  "bretagne", "normandie", "pays_de_la_loire", "nouvelle_aquitaine", "occitanie", "provence_alpes_cote_d_azur",
  "auvergne_rhone_alpes", "bourgogne_franche_comte", "grand_est", "hauts_de_france", "centre_val_de_loire", "ile_de_france", "corse",
]);
const nombre = (n: number) => n.toLocaleString("fr-FR").replace(/ /g, " ");
const capitale = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** « la Bretagne » → « en Bretagne » ; « le Sud-Ouest » → « dans le Sud-Ouest » ; « les Alpes » → « dans les Alpes ». */
export function enLieuFr(label: string): string {
  if (/^la /i.test(label)) return `en ${label.slice(3)}`;
  if (/^l'/i.test(label)) return `en ${label.slice(2)}`;
  if (/^(le |les )/i.test(label)) return `dans ${label}`;
  return `en ${label}`;
}
/** « Lyon » → « de Lyon » ; « Annecy » → « d'Annecy ». */
const de = (nom: string) => (/^[aeiouyhâéèêîôûAEIOUYHÂÉÈÊÎÔÛ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

const PERIMETRES: Record<string, { court: string; interpretation: string }> = {
  paris: { court: "Paris", interpretation: "Paris intra-muros." },
  petite_couronne: { court: "Paris et la petite couronne", interpretation: "Paris, les Hauts-de-Seine, la Seine-Saint-Denis et le Val-de-Marne." },
  agglomeration: { court: "l'agglomération parisienne", interpretation: "Toute l'agglomération parisienne, telle que l'Insee la délimite." },
  ile_de_france: { court: "l'Île-de-France", interpretation: "Toute l'Île-de-France, ses huit départements." },
};

function bornes(min: number | null | undefined, max: number | null | undefined): string {
  if (min != null && max != null) return `de ${nombre(min)} à ${nombre(max)} habitants`;
  if (max != null) return `de moins de ${nombre(max)} habitants`;
  return `de plus de ${nombre(min!)} habitants`;
}

export function presenterCritere(project: UserProject, ref: CriterionRef): CriterionPresentation | null {
  const parsed = project.parsed;
  if (!parsed) return null;
  if (ref.kind === "preference") return presenterPreference(project, ref.key);
  const hc = parsed.hardConstraints ?? {};
  switch (ref.key) {
    case "zones": {
      const ancres = (hc.zones ?? []).filter((z) => z.strength === "hard");
      if (ancres.length === 0) return null;
      const labels = ancres.map((z) => ZONE_TABLE[z.zone]?.label ?? z.zone);
      const lien = hc.zonesMatch === "any" ? " ou " : " et ";
      const court = labels.join(lien);
      const titre = `Vivre ${labels.map(enLieuFr).join(lien)}`;
      const macro = ancres.filter((z) => !REGIONS.has(z.zone));
      const acceptees = hc.zonesConventions ?? [];
      const interpretation = macro.length === 0
        ? `Pour cette analyse, futur•e considère ici ${court} dans ${ancres.length > 1 ? "leurs" : "ses"} limites régionales actuelles.`
        : macro.map((z) => {
            const c = acceptees.find((a) => a.token === z.zone);
            const conv = c ? conventionPar(c.conventionId, c.conventionVersion) : null;
            return conv?.explication ?? `Voici le périmètre que futur•e utilise pour ${ZONE_TABLE[z.zone]?.label ?? z.zone} : ${ZONE_TABLE[z.zone]?.convention ?? "à préciser"}.`;
          }).join(" ");
      return { titre, court, interpretation };
    }
    case "departements": {
      const noms = (hc.departements ?? []).map((d) => departmentName(d) ?? d);
      if (noms.length === 0) return null;
      const court = noms.join(hc.zonesMatch === "any" ? " ou " : " et ");
      return { titre: `Vivre ${noms.length > 1 ? "dans les départements" : "dans le département"} ${court}`, court };
    }
    case "excludeZones": {
      const tokens = ref.instance ? [ref.instance] : hc.excludeZones ?? [];
      if (tokens.length === 0) return null;
      const dit = (t: string) => hc.excludeZonesDits?.find((d) => d.token === t)?.said ?? ZONE_TABLE[t]?.label ?? t;
      const court = tokens.map(dit).join(" et ");
      const perimetre = ref.instance ? hc.excludeZonesPerimetres?.[ref.instance] : undefined;
      const parisien = ref.instance === "paris" || ref.instance === "idf";
      return {
        titre: `Éviter ${court}`, court,
        ...(perimetre ? { interpretation: PERIMETRES[perimetre]!.interpretation } : {}),
        ...(parisien && !perimetre ? { question: `Par « ${court} », vous pensez à Paris, à la petite couronne, à l'agglomération ou à toute l'Île-de-France ?` } : {}),
      };
    }
    case "excludePlace": {
      const villes = (hc.excludePlace ?? []).filter((e) => e?.label);
      const cible = ref.instance ? villes.filter((e) => identiteDeVille(e.label) === ref.instance) : villes;
      if (cible.length === 0) return null;
      const court = cible.map((e) => e.label).join(" et ");
      const seule = cible.length === 1 ? cible[0]! : null;
      return {
        titre: `Quitter ${court}`, court,
        ...(seule?.scope === "commune" ? { interpretation: `La commune ${de(seule.label)} elle-même${["Paris", "Lyon", "Marseille"].includes(seule.label) ? ", tous ses arrondissements" : ""}.` } : {}),
        ...(seule?.scope === "unite_urbaine" ? { interpretation: `Toute l'agglomération ${de(seule.label)}.` } : {}),
        ...(seule && !seule.scope ? { question: `Quitter la commune ${de(seule.label)}, ou toute son agglomération ?` } : {}),
      };
    }
    case "nearPlace": {
      const np = hc.nearPlace;
      if (!np?.label) return null;
      const court = `la distance à ${np.label}`;
      if (np.maxMinutes != null) {
        const mode = np.mode === "car" ? " en voiture" : np.mode === "walk" ? " à pied" : np.mode === "bike" ? " à vélo" : "";
        return {
          titre: `Être à moins de ${np.maxMinutes} minutes ${de(np.label)}${mode}`, court: `le trajet vers ${np.label}`,
          ...(np.mode === "car" || np.mode === "walk" ? { interpretation: "Temps estimé sans trafic, depuis votre logement." } : {}),
          ...(!np.mode ? { question: `Vos ${np.maxMinutes} minutes ${de(np.label)} : à pied ou en voiture ?` } : {}),
        };
      }
      if (np.maxKm != null) {
        return {
          titre: `Être à moins de ${np.maxKm} km ${de(np.label)}`, court,
          ...(np.metric === "vol_oiseau" ? { interpretation: "À vol d'oiseau, depuis votre logement." } : {}),
          ...(np.metric === "route" ? { interpretation: "Par la route." } : {}),
          ...(!np.metric ? { question: `Par ${np.maxKm} km, vous pensez à vol d'oiseau ou par la route ?` } : {}),
        };
      }
      return { titre: `Être près ${de(np.label)}`, court, question: `À combien ${de(np.label)}, au plus ?` };
    }
    case "communeSize": {
      const cs = hc.communeSize;
      if (!cs || (cs.min == null && cs.max == null)) return null;
      const qui = cs.unit === "commune" ? "Une commune" : cs.unit === "unite_urbaine" ? "Une agglomération" : "Une ville";
      return {
        titre: `${qui} ${bornes(cs.min, cs.max)}`, court: "la taille de la ville",
        ...(cs.unit === "commune" ? { interpretation: "Population de la commune elle-même." } : {}),
        ...(cs.unit === "unite_urbaine" ? { interpretation: "Population de l'agglomération." } : {}),
        ...(!cs.unit ? { question: "Ces habitants : ceux de la commune, ou de toute l'agglomération ?" } : {}),
      };
    }
    case "sizeRelativeTo": {
      const s = hc.sizeRelativeTo;
      if (!s?.label) return null;
      const sens = s.direction === "smaller" ? "plus petite" : "plus grande";
      return {
        titre: `Une ville ${sens} que ${s.label}`, court: `la taille comparée à ${s.label}`,
        ...(s.unit === "unite_urbaine" ? { interpretation: `Comparée à la taille de l'agglomération ${de(s.label)}.` } : {}),
        ...(!s.unit ? { question: `${capitale(sens)} que la commune ${de(s.label)}, ou que son agglomération ?` } : {}),
      };
    }
    case "montagne":
      return {
        titre: "Vivre à la montagne", court: "la montagne",
        interpretation: "futur•e s'appuie aujourd'hui sur l'altitude du centre de la commune ; elle ne dit pas l'altitude de votre logement.",
      };
    case "reliefProche":
      return { titre: "Être près de la montagne", court: "la montagne à proximité" };
    case "nearSea":
      return { titre: "Être près de la mer", court: "la mer", interpretation: "futur•e estime la distance depuis le centre de la commune." };
    case "excludeSea":
      return { titre: "Ne pas habiter près du littoral", court: "l'éloignement du littoral", interpretation: "futur•e estime la distance depuis le centre de la commune." };
  }
}

function presenterPreference(project: UserProject, key: PreferenceKey): CriterionPresentation {
  const parsed = project.parsed!;
  const label = PREFERENCE_LABELS[key] ?? String(key);
  const court = label.charAt(0).toLowerCase() + label.slice(1);
  const pref = parsed.preferences?.find((p) => p.key === key);
  const adoption = project.adoptions?.find((a) => a.criterion.key === key);
  const ancre = pref?.source === "ancre" ? parsed.communeAncre?.[0]?.label : adoption?.origin.label;
  if (key === "eviter_grandes_villes" && parsed.sizeWord === "petite") return { titre: "Une petite ville", court: "la taille de la ville" };
  if (key === "eviter_grandes_villes" && parsed.sizeWord === "moyenne") return { titre: "Une ville moyenne", court: "la taille de la ville" };
  if (key === "prefere_grande_ville" && parsed.sizeWord === "grande") return { titre: "Une grande ville", court: "la taille de la ville" };
  const interpretation = key === "cadre_calme" ? "futur•e lit la densité de la commune, pas le bruit de votre rue." : undefined;
  return {
    titre: ancre ? `Inspiré ${de(ancre)} : ${court}` : capitale(label), court,
    ...(interpretation ? { interpretation } : {}),
  };
}


// L'identité d'une ville, MÊME algorithme que `normalizeName` (hard-constraints-resolve.ts), recopié
// ici parce que ce module-là importe node:crypto et ne peut pas aller dans le navigateur. Le test
// fut8-libelles vérifie que les deux restent identiques.
export function identiteDeVille(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
