"use client";

import { useState } from "react";
import { useHorizon, HORIZON_META, type HorizonKey } from "@/hooks/useHorizon";
import { MetricDrawer, type CardDetail } from "@/components/MetricDrawer";
import { MetricTooltip } from "@/components/MetricTooltip";
import type { GeorisquesSummary, GasparCatnatSummary } from "@/lib/georisques";
import type { EaufranceSummary } from "@/lib/eaufrance";
import type { VigieauSummary, DroughtLevel } from "@/lib/vigieau";
import type { LittoralSummary, LittoralFacade } from "@/lib/littoral";

// Façade maritime → libellé (le composant est client : on duplique le libellé
// plutôt que d'importer une valeur depuis littoral.ts, server-only).
const FACADE_LABEL: Record<LittoralFacade, string> = {
  manche: "façade Manche",
  atlantique: "façade atlantique",
  bretagne: "littoral breton",
  mediterranee: "façade méditerranéenne",
  outre_mer: "littoral ultramarin",
};

// Libellé FR d'un niveau VigiEau. Dupliqué ici (et non importé depuis lib/vigieau)
// car ce composant est client et vigieau.ts est server-only.
function levelLabel(level: DroughtLevel | "pas_de_restrictions" | null | undefined): string {
  switch (level) {
    case "crise": return "Crise";
    case "alerte_renforcee": return "Alerte renforcée";
    case "alerte": return "Alerte";
    case "vigilance": return "Vigilance";
    default: return "Aucune restriction";
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

type GwlScenarios = Record<string, { h: string; v: Record<string, number> }>;
type Factor = {
  label: string;
  val: string;
  col: string;
  src: string;
  missing: boolean;
  /** Carte cliquable → drawer éditorial (la carte raconte une histoire). */
  detail?: CardDetail;
  /** Glose courte au survol/focus (seuil ou sens à expliquer, mais pas d'histoire). */
  tip?: string;
};

type Drought = NonNullable<EaufranceSummary["drought"]>;
type Territoire = {
  densite: number | null;
  incendies: number | null;
  taux_boisement: number | null;
};

type SharedProps = {
  communeName: string;
  scenarios: GwlScenarios | null;
  georisques: GeorisquesSummary | null;
  drought: Drought | null;
  territoire: Territoire | null;
  vigieau: VigieauSummary | null;
  catnat?: GasparCatnatSummary | null;
  littoral?: LittoralSummary | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function r(v: number | undefined | null) {
  return v != null ? Math.round(v) : null;
}

function buildFactors(
  scenarios: GwlScenarios | null,
  horizonKey: HorizonKey,
  georisques: GeorisquesSummary | null,
  territoire: Territoire | null,
  vigieau: VigieauSummary | null,
  drought: Drought | null,
  communeName: string,
  catnat?: GasparCatnatSummary | null,
  littoral?: LittoralSummary | null,
): Factor[] {
  const meta = HORIZON_META[horizonKey] ?? HORIZON_META.gwl20;
  const gwlData = scenarios?.[horizonKey]?.v ?? null;
  const heatDays = r(gwlData?.["NORTX35D_yr"]);
  const hotDays = r(gwlData?.["NORTX30D_yr"]);
  const tropicalNights = r(gwlData?.["NORTR_yr"]);
  const fireDays = r(gwlData?.["NORIFM40_yr"]);
  const drySoilDays = r(gwlData?.["NORSWI04_yr"]);

  const boisementPct = territoire?.taux_boisement != null
    ? Math.round(territoire.taux_boisement)
    : null;

  // ── Carte « Jours chauds » → drawer : la chaleur qui s'installe ───────────────
  // On lit les trois horizons et on les rend comme une montée VISIBLE (barres),
  // pas comme un tableau. Le récit prime ; les sources passent en pied de drawer.
  const hotAt = (k: HorizonKey) => r(scenarios?.[k]?.v?.["NORTX30D_yr"]);
  const hotTraj = (["gwl15", "gwl20", "gwl30"] as HorizonKey[])
    .map((k) => ({ k, v: hotAt(k) }))
    .filter((x) => x.v != null) as { k: HorizonKey; v: number }[];
  const hot2030 = hotAt("gwl15");
  const hot2100 = hotAt("gwl30");
  const hotMax = Math.max(...hotTraj.map((x) => x.v), 1);
  const heatDetail: CardDetail | undefined = hotDays != null
    ? {
        eyebrow: "Des étés qui s'intensifient",
        title: "Jours chauds (> 30°C)",
        headline:
          hot2030 != null && hot2100 != null && hot2100 > hot2030
            ? `${hot2030} → ${hot2100} jours par an`
            : `${hotDays} jours par an en ${meta.year}`,
        subhead: "Les fortes chaleurs gagnent du terrain, année après année.",
        accent: "var(--orange)",
        breakdownLabel: "Jours chauds par an",
        breakdown: hotTraj.map((x) => ({
          label: `À l'horizon ${HORIZON_META[x.k].year}`,
          value: `${x.v} jours`,
          bar: x.v / hotMax,
        })),
        facts: heatDays != null ? [{ label: "dont chaleur extrême", value: `${heatDays} jours` }] : undefined,
        why: "Quelques journées de forte chaleur, on les traverse. Quand elles se multiplient, c'est l'été qui change de visage : des nuits qui ne rafraîchissent plus, des logements et des écoles qui surchauffent, le travail dehors plus pénible, les personnes âgées et les enfants plus exposés. Et la courbe ne fait pas que monter, elle s'accélère.",
        askPrefill: `Comment la chaleur va-t-elle évoluer dans ma commune d'ici ${HORIZON_META.gwl30.year} ?`,
        sources: "Projections DRIAS, Météo-France · scénarios France +2°C à +4°C",
      }
    : undefined;

  // ── Carte « Sécheresse des sols » → drawer : un territoire qui s'assèche ──────
  // Trois temps (présent, terrain, futur) racontés en langage utilisateur ; les
  // noms de bases (VigiEau, ONDE, DRIAS) descendent en pied de drawer.
  const hasDroughtStory = drySoilDays != null || !!vigieau?.maxLevel || !!drought?.isDry;
  const droughtActive = !!vigieau?.maxLevel || !!drought?.isDry;
  const droughtRows: { label: string; value: string }[] = [
    {
      label: "Aujourd'hui",
      value: vigieau?.maxLevel
        ? `Restriction « ${levelLabel(vigieau.maxLevel).toLowerCase()} » en cours`
        : "Aucune restriction en cours",
    },
    {
      label: "Sur le terrain",
      value: drought
        ? drought.isDry
          ? "Cours d'eau à sec par endroits"
          : "Pas de cours d'eau à sec"
        : "Aucun signal observé localement",
    },
    ...(drySoilDays != null
      ? [{ label: `À l'horizon ${meta.year}`, value: `Environ ${drySoilDays} jours secs par an` }]
      : []),
  ];
  const droughtFacts =
    vigieau?.maxLevel && vigieau.topZone
      ? [
          ...(vigieau.topZone.label ? [{ label: "Zone concernée", value: vigieau.topZone.label }] : []),
          ...(vigieau.topZone.endDate ? [{ label: "Jusqu'au", value: formatFrDate(vigieau.topZone.endDate) }] : []),
        ]
      : undefined;
  const droughtDetail: CardDetail | undefined = hasDroughtStory
    ? {
        eyebrow: "Un territoire qui s'assèche",
        title: "Sécheresse des sols",
        headline:
          drySoilDays != null
            ? `Environ ${drySoilDays} jours secs par an d'ici ${meta.year}`
            : vigieau?.maxLevel
              ? `Restriction « ${levelLabel(vigieau.maxLevel).toLowerCase()} » en cours`
              : "Cours d'eau à sec observé",
        subhead: droughtActive
          ? "Les premiers signes sont déjà là, et le climat les amplifie."
          : "Le territoire s'assèche peu à peu, et les étés pèsent de plus en plus sur l'eau.",
        accent: "var(--orange)",
        breakdownLabel: "Trois temps",
        breakdown: droughtRows,
        facts: droughtFacts && droughtFacts.length > 0 ? droughtFacts : undefined,
        why: "La sécheresse ne se voit pas d'un coup, elle s'installe. L'eau qu'on restreint l'été, les cours d'eau qui faiblissent, la terre qui se rétracte et fragilise les fondations des maisons sur sol argileux : trois signes d'un même mouvement, du présent vers l'avenir. C'est un changement de fond du territoire, pas un épisode isolé.",
        askPrefill: "Ma commune est-elle exposée à la sécheresse ?",
        sources: "VigiEau (arrêtés préfectoraux) · réseau ONDE, Hub'Eau (cours d'eau) · projections DRIAS, Météo-France",
      }
    : undefined;

  const factors: Factor[] = [
    {
      label: "Jours chauds (> 30°C)",
      val: hotDays != null ? `${hotDays} jours/an en ${meta.year}` : "—",
      col: "var(--orange)",
      src: `DRIAS / Météo-France · France ${meta.france}`,
      missing: hotDays == null,
      detail: heatDetail,
    },
    {
      label: "Jours de chaleur extrême (> 35°C)",
      val: heatDays != null ? `${heatDays} jours/an en ${meta.year}` : "—",
      col: "var(--red)",
      src: `DRIAS / Météo-France · France ${meta.france}`,
      missing: heatDays == null,
      tip: "Plus ces journées sont nombreuses, plus les étés deviennent éprouvants, surtout pour les enfants, les personnes âgées et celles qui vivent ou travaillent dehors.",
    },
    {
      label: "Nuits tropicales (> 20°C)",
      val: tropicalNights != null ? `${tropicalNights} nuits/an en ${meta.year}` : "—",
      col: "var(--orange)",
      src: "DRIAS / Météo-France · Tmin > 20°C",
      missing: tropicalNights == null,
      tip: "Quand la chaleur ne retombe pas la nuit, on dort moins bien et on récupère mal. C'est l'un des signes les plus parlants d'un climat qui change près de chez soi.",
    },
    {
      label: "Conditions météo favorables au feu",
      val: fireDays != null ? `${fireDays} jours/an en ${meta.year}` : "—",
      col: "var(--orange)",
      src: "DRIAS · IFM > 40 · indice météo, pas risque réel",
      missing: fireDays == null,
      tip: "Plus ces journées se multiplient, plus le risque qu'un feu démarre et se propage augmente, surtout près des espaces naturels et des forêts.",
    },
    {
      label: "Sécheresse des sols",
      val:
        drySoilDays != null
          ? `${drySoilDays} jours/an en ${meta.year}`
          : vigieau?.maxLevel
            ? levelLabel(vigieau.maxLevel)
            : drought?.isDry
              ? "Cours d'eau à sec"
              : "—",
      col: "var(--orange)",
      src: `DRIAS · indice SWI < 0,4 · France ${meta.france}`,
      missing: !hasDroughtStory,
      detail: droughtDetail,
    },
    {
      label: "Inondation fluviale",
      val: georisques ? (georisques.flags.flood ? "Zone exposée recensée" : "Aucun périmètre recensé") : "—",
      col: "var(--blue)",
      src: "Géorisques · échelle communale",
      missing: !georisques?.flags.flood,
      tip: "Savoir qu'une partie de la commune peut être atteinte par une crue aide à comprendre ce qui peut être touché. Détail à votre adresse dans le module Logement.",
    },
    {
      label: "Submersion marine",
      val: georisques ? (georisques.flags.marineSubmersion ? "Côte exposée recensée" : "Aucun périmètre recensé") : "—",
      col: "var(--blue)",
      src: "Géorisques · échelle communale",
      missing: !georisques?.flags.marineSubmersion,
      tip: "Sur le littoral, savoir si la mer peut atteindre la commune aide à comprendre ce qui est exposé aux tempêtes. Détail à votre adresse dans le module Logement.",
    },
    {
      label: "Taux de boisement",
      val: boisementPct != null ? `${boisementPct}%` : "—",
      col: "var(--green)",
      src: "ADEME · données communales",
      missing: boisementPct == null,
      tip: "Les arbres rafraîchissent la commune l'été et abritent la vie. Leur place en dit long sur le confort par fortes chaleurs et sur le quotidien qu'on y trouve.",
    },
  ];

  // Carte CatNat (GASPAR) — ajoutée seulement quand l'appelant fournit la donnée
  // (QuartierAside). Histoire vécue : nombre de reconnaissances depuis l'origine.
  if (catnat !== undefined) {
    const hasCatnat = !!catnat && catnat.total > 0;
    const headline = hasCatnat
      ? `${catnat!.total} arrêté${catnat!.total > 1 ? "s" : ""}${catnat!.firstYear ? ` depuis ${catnat!.firstYear}` : ""}`
      : "—";
    const detail: CardDetail | undefined = hasCatnat
      ? {
          eyebrow: "Histoire du territoire",
          title: "Catastrophes naturelles reconnues",
          headline,
          subhead: catnat!.summary ?? undefined,
          accent: "var(--blue)",
          breakdown: catnat!.byRisk.map((rk) => ({ label: rk.label, value: String(rk.count) })),
          facts: [
            ...(catnat!.firstYear ? [{ label: "Première reconnaissance", value: String(catnat!.firstYear) }] : []),
            ...(catnat!.lastYear ? [{ label: "Dernière reconnaissance", value: String(catnat!.lastYear) }] : []),
          ],
          why: "Les arrêtés de catastrophe naturelle racontent l'histoire vécue du territoire : ils montrent quels aléas ont déjà marqué la commune, et à quelle fréquence.",
          whyLabel: "Ce que cela raconte",
          askPrefill: "Que racontent les arrêtés de catastrophe naturelle de ma commune ?",
          sources: "Géorisques · base GASPAR (arrêtés de catastrophe naturelle)",
        }
      : undefined;
    factors.push({
      label: "Catastrophes naturelles reconnues",
      val: headline,
      col: "var(--blue)",
      src: hasCatnat && catnat!.topRisk
        ? `Géorisques · GASPAR · surtout ${catnat!.topRisk.toLowerCase()}`
        : "Géorisques · GASPAR · arrêtés CatNat",
      missing: !hasCatnat,
      detail,
    });
  }

  // Carte Littoral (recul du trait de côte) — Niveau 4 de la doctrine littoral :
  // c'est ICI que vit l'intensité (le rapport démontre), pas sur les cartes du
  // comparateur. Affichée si la commune a une donnée d'érosion (Cerema, couverture
  // nationale) OU est inscrite loi Climat et Résilience. Le drawer mène par les
  // OBSERVATIONS (ampleur, recul max, période) puis les IMPLICATIONS projet de vie.
  if (littoral && (littoral.erosion || littoral.traitDeCote.concernee)) {
    const e = littoral.erosion;
    const CLASSE_LABEL: Record<string, string> = {
      faible: "Érosion faible",
      "modéré": "Érosion modérée",
      "marqué": "Érosion marquée",
      "très marqué": "Érosion très marquée",
    };
    const CLASSE_FEM: Record<string, string> = {
      faible: "faible",
      "modéré": "modérée",
      "marqué": "marquée",
      "très marqué": "très marquée",
    };
    const fr1 = (n: number) => Math.abs(n).toLocaleString("fr-FR", { maximumFractionDigits: 1 });
    const decretDate = littoral.traitDeCote.decret?.debut
      ? formatFrDate(littoral.traitDeCote.decret.debut)
      : null;

    // Label de carte + headline du drawer
    let cardVal: string;
    let headline: string;
    if (e && e.amenage) {
      cardVal = "Littoral aménagé";
      headline = "Littoral fortement aménagé";
    } else if (e && e.classe) {
      cardVal = CLASSE_LABEL[e.classe];
      headline = CLASSE_LABEL[e.classe];
    } else {
      cardVal = "Exposée à l'érosion";
      headline = "Exposée à l'érosion du littoral";
    }

    // « Ce que montrent les observations » (seulement si donnée d'érosion)
    const obs: { label: string; value: string }[] = [];
    if (e) {
      // % d'ampleur seulement hors garde-fou (sur côte aménagée, trop peu de
      // segments valides pour un pourcentage honnête).
      if (e.pctRecul != null && !e.amenage)
        obs.push({ label: "Part du littoral qui recule", value: `${e.pctRecul} %` });
      if (e.reculMaxMpan != null && e.reculMaxMpan < 0)
        obs.push({ label: "Recul max observé", value: `jusqu'à ${fr1(e.reculMaxMpan)} m/an` });
      if (e.periode)
        obs.push({ label: "Période observée", value: `${e.periode[0]}–${e.periode[1]}` });
    }

    const facts = littoral.traitDeCote.concernee
      ? [
          { label: "Statut", value: "Inscrite (loi Climat et Résilience)" },
          ...(decretDate ? [{ label: "Depuis", value: decretDate }] : []),
        ]
      : undefined;

    const amenageStrong = !!e?.amenage && (e.classe === "marqué" || e.classe === "très marqué");
    const amenageNote = e?.amenage
      ? `Le littoral est fortement aménagé (digues, port) : l'érosion y est partiellement mesurable.${amenageStrong && e.classe ? ` Sur les rares secteurs mesurables, une érosion ${CLASSE_FEM[e.classe]} est observée.` : ""} `
      : "";
    // Récit PILOTÉ PAR LA CLASSE : l'intensité du texte suit l'intensité de la donnée
    // (sinon La Rochelle « faible » sonnerait comme un avertissement fort). Le cadre
    // assurantiel sort du récit (encart « À savoir » fixe, même ton pour tous).
    const CLASSE_NARRATIVE: Record<string, string> = {
      faible:
        "Les observations disponibles montrent que le littoral évolue localement, mais à un rythme faible. Cela ne signifie pas qu'un projet immobilier est aujourd'hui remis en question : pour la plupart des habitants, le recul du trait de côte restera un sujet lointain et très dépendant de la localisation précise du bien. Comme partout sur le littoral, il reste utile de comprendre ces dynamiques avant d'acheter ou de transmettre un bien.",
      "modéré":
        "Les observations montrent un recul mesurable sur certains secteurs du littoral. Cela ne remet pas en cause la vie quotidienne, mais peut devenir un élément à prendre en compte dans un projet immobilier de long terme, notamment pour la valeur future ou les possibilités d'aménagement.",
      "marqué":
        "Le recul observé est significatif sur une partie du littoral. Pour un projet immobilier, il devient pertinent de s'intéresser à la localisation exacte du bien, aux documents d'urbanisme et aux perspectives d'évolution du trait de côte sur plusieurs décennies.",
      "très marqué":
        "Le recul observé figure parmi les plus importants du littoral français. Pour un projet de vie ou d'investissement, la question ne se limite plus au cadre de vie : l'évolution future du littoral peut avoir des conséquences concrètes sur la valeur, la constructibilité et la transmission des biens situés dans les secteurs les plus exposés.",
    };
    const narrFallback =
      "Le littoral de la commune est concerné par le recul du trait de côte. Comme partout sur le littoral, il reste utile de comprendre ces dynamiques avant d'acheter ou de transmettre un bien.";
    const classNarrative = e?.classe ? CLASSE_NARRATIVE[e.classe] : null;

    const littoralDetail: CardDetail = {
      eyebrow: `Littoral · ${FACADE_LABEL[littoral.facade]}`,
      title: "Érosion du littoral",
      headline,
      subhead:
        e && !e.amenage && e.pctRecul != null
          ? `${e.pctRecul} % du littoral communal montrent une érosion observée : la côte y recule.`
          : `${communeName} est exposée à l'érosion du littoral.`,
      accent: "var(--blue)",
      breakdownLabel: obs.length ? "Ce que montrent les observations" : undefined,
      breakdown: obs.length ? obs : undefined,
      facts,
      whyLabel: "Ce que cela implique pour un projet de vie",
      why: e
        ? `${amenageNote}Ce sont des observations passées, pas une prévision. ${classNarrative ?? narrFallback}`
        : narrFallback,
      note: "Contrairement à la submersion marine, le recul du trait de côte n'est pas couvert par le régime catastrophes naturelles, car il est considéré comme un phénomène prévisible.",
      askPrefill: "Qu'est-ce que l'érosion du littoral change pour ma commune ?",
      sources:
        "Cerema, indicateur national de l'érosion côtière (Géolittoral) · Liste des communes, loi Climat et Résilience (data.gouv.fr) · CCR, régime catastrophes naturelles",
    };

    factors.push({
      label: "Littoral",
      val: cardVal,
      col: "var(--blue)",
      src: e ? "Cerema · indicateur d'érosion côtière" : "Cerema · Loi Climat et Résilience",
      missing: false,
      detail: littoralDetail,
    });
  }

  return factors;
}

function buildParagraphs(
  communeName: string,
  gwlData: Record<string, number> | null | undefined,
  horizonKey: string,
  georisques: GeorisquesSummary | null,
  drought: Drought | null,
  vigieau: VigieauSummary | null,
): string[] {
  const meta = HORIZON_META[horizonKey as keyof typeof HORIZON_META] ?? HORIZON_META.gwl20;
  const heatDays = r(gwlData?.["NORTX35D_yr"]);
  const hotDays = r(gwlData?.["NORTX30D_yr"]);
  const tropicalNights = r(gwlData?.["NORTR_yr"]);
  const fireDays = r(gwlData?.["NORIFM40_yr"]);
  const drySoilDays = r(gwlData?.["NORSWI04_yr"]);

  const paragraphs: string[] = [];

  if (heatDays != null || hotDays != null) {
    let p = `À l'horizon ${meta.year}, ${communeName} atteindrait`;
    if (hotDays != null) p += ` ${hotDays} jour${hotDays > 1 ? "s" : ""} par an au-dessus de 30°C`;
    if (hotDays != null && heatDays != null) p += `, dont`;
    if (heatDays != null) p += ` ${heatDays} jour${heatDays > 1 ? "s" : ""} de chaleur extrême dépassant 35°C`;
    p += `.`;
    if (tropicalNights != null) {
      p += ` Les nuits ne rafraîchissent plus : ${tropicalNights} nuit${tropicalNights > 1 ? "s" : ""} par an resteraient au-dessus de 20°C.`;
    }
    p += " Ce n'est pas un basculement abstrait. Ce sont des étés qui deviennent plus lourds et plus difficiles à traverser.";
    paragraphs.push(p);
  } else if (!gwlData) {
    paragraphs.push(
      `Les projections climatiques pour ${communeName} ne sont pas encore disponibles dans notre base de données. Cette commune sera intégrée lors de la prochaine mise à jour.`,
    );
  }

  if (fireDays != null) {
    paragraphs.push(
      `Les projections indiquent ${fireDays} jour${fireDays > 1 ? "s" : ""} par an en ${meta.year} avec des conditions météo favorables aux incendies. Cet indice reflète la météo, pas la probabilité réelle : le risque effectif dépend aussi de la végétation et de l'humidité des sols.`,
    );
  }

  if (georisques) {
    const risks: string[] = [];
    if (georisques.flags.flood) risks.push("inondation fluviale");
    if (georisques.flags.marineSubmersion) risks.push("submersion marine");
    if (risks.length > 0) {
      paragraphs.push(
        `${communeName} est classée en zone à risque ${risks.join(" et ")}. Ces risques sont identifiés à l'échelle de la commune. L'exposition précise de votre adresse est accessible dans le module Logement.`,
      );
    }
  }

  // Sécheresse : arc temporel à 3 signaux quand ils sont disponibles.
  //   VigiEau     → présent administratif (100% France)
  //   ONDE        → présent observation terrain (rural seulement)
  //   DRIAS SWI04 → futur modélisé (100% France, dépend de l'horizon)
  const droughtSentences: string[] = [];

  if (vigieau?.maxLevel) {
    const niveau = levelLabel(vigieau.maxLevel).toLowerCase();
    const bassin = vigieau.topZone?.label ? ` sur le bassin ${vigieau.topZone.label}` : "";
    const fin = vigieau.topZone?.endDate
      ? ` jusqu'au ${formatFrDate(vigieau.topZone.endDate)}`
      : "";
    droughtSentences.push(
      `${communeName} est actuellement en ${niveau} sécheresse${bassin}${fin}, selon l'arrêté préfectoral en vigueur (VigiEau, Propluvia).`,
    );
  }

  if (drought?.isDry) {
    const cours = drought.riverName ? `le ${drought.riverName}` : "le cours d'eau local";
    const lead = droughtSentences.length === 0
      ? `${cours.charAt(0).toUpperCase()}${cours.slice(1)} a été observé`
      : `Localement, ${cours} a été observé`;
    droughtSentences.push(
      `${lead} à sec dans une observation récente du réseau ONDE (Hub'Eau, OFB).`,
    );
  }

  if (drySoilDays != null) {
    droughtSentences.push(
      `À l'horizon ${meta.year}, le sol de la commune serait sec environ ${drySoilDays} jours par an dans le scénario France ${meta.france} (DRIAS, indice SWI < 0,4).`,
    );
  }

  if (droughtSentences.length > 0) {
    paragraphs.push(droughtSentences.join(" "));
  }

  return paragraphs;
}

function formatFrDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

// ─── FactorGrid (grille horizontale de cartes) ────────────────────────────────

export function QuartierAside({ communeName, scenarios, georisques, territoire, vigieau, drought, catnat, littoral }: SharedProps) {
  const [horizon] = useHorizon();
  const [openDetail, setOpenDetail] = useState<CardDetail | null>(null);
  const factors = buildFactors(scenarios, horizon, georisques, territoire, vigieau ?? null, drought ?? null, communeName, catnat ?? null, littoral ?? null);

  return (
    <div>
      <div className="grid grid-cols-4 gap-2.5">
        {factors.map((f) => {
          const clickable = !!f.detail;
          return (
            <div
              key={f.label}
              className={`glass rounded-xl px-4 py-3.5${clickable ? " metric-card-clickable" : ""}`}
              style={{
                position: "relative",
                borderTop: `2px solid ${f.missing ? "var(--ghost)" : f.col}`,
                opacity: f.missing ? 0.45 : 1,
                cursor: clickable ? "pointer" : undefined,
              }}
              role={clickable ? "button" : undefined}
              tabIndex={clickable ? 0 : undefined}
              onClick={clickable ? () => setOpenDetail(f.detail!) : undefined}
              onKeyDown={
                clickable
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setOpenDetail(f.detail!);
                      }
                    }
                  : undefined
              }
            >
              <div className="text-[12px] font-medium text-label mb-2 leading-[1.3]">{f.label}</div>
              <div className="font-mono text-[11px] tracking-[0.02em] mb-0.5" style={{ color: f.missing ? "var(--ghost)" : f.col }}>{f.val}</div>
              <div className="font-mono text-[10px] text-ghost tracking-[0.02em] leading-[1.4]">{f.src}</div>
              {clickable && (
                <div className="font-mono text-[10px] tracking-[0.06em] mt-2" style={{ color: f.col }}>
                  Détail →
                </div>
              )}
              {!clickable && f.tip && (
                <span style={{ position: "absolute", top: 10, right: 10 }}>
                  <MetricTooltip text={f.tip} accent={f.missing ? undefined : f.col} />
                </span>
              )}
            </div>
          );
        })}
      </div>

      <MetricDrawer detail={openDetail} onClose={() => setOpenDetail(null)} />

      <style>{`
        .metric-card-clickable { transition: transform 0.15s ease, background 0.15s ease; }
        .metric-card-clickable:hover { transform: translateY(-2px); background: rgba(255,255,255,0.05); }
        .metric-card-clickable:focus-visible { outline: 2px solid var(--blue); outline-offset: 2px; }
      `}</style>
    </div>
  );
}

// ─── SectionTitle (titre dynamique horizon-aware) ─────────────────────────────

export function QuartierSectionTitle({ communeName, scenarios, georisques }: Pick<SharedProps, "communeName" | "scenarios" | "georisques">) {
  const [horizon] = useHorizon();
  const meta = HORIZON_META[horizon];
  const gwlData = scenarios?.[horizon]?.v ?? null;
  const hotDays = r(gwlData?.["NORTX30D_yr"]);
  const tropicalNights = r(gwlData?.["NORTR_yr"]);
  const flood = georisques?.flags.flood ?? false;
  const submersion = georisques?.flags.marineSubmersion ?? false;

  let title = "";

  if (hotDays != null && (flood || submersion)) {
    const risks = [flood && "inondations", submersion && "submersion marine"].filter(Boolean).join(" et ");
    title = `${hotDays} jours de chaleur en ${meta.year}, ${communeName} exposée aux ${risks}.`;
  } else if (hotDays != null && tropicalNights != null) {
    title = `${hotDays} jours chauds et ${tropicalNights} nuits tropicales attendus en ${meta.year}.`;
  } else if (hotDays != null) {
    title = `${hotDays} jours au-dessus de 30°C attendus à l'horizon ${meta.year}.`;
  } else if (flood || submersion) {
    const risks = [flood && "inondations", submersion && "submersion marine"].filter(Boolean).join(" et ");
    title = `${communeName} exposée aux ${risks} selon les données de risques naturels.`;
  } else {
    title = `Les signaux climatiques pour ${communeName} à l'horizon ${meta.year}.`;
  }

  return (
    <div>
      <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-ghost mb-2">Synthèse territoriale</p>
      <h2 className="font-normal text-[clamp(24px,2.8vw,36px)] leading-[1.18] tracking-[-0.5px] text-label" style={{ fontFamily: "'Instrument Serif', serif" }}>
        {title}
      </h2>
    </div>
  );
}

// ─── DataBody (bloc principal de données) ─────────────────────────────────────

export function QuartierDataBody({ communeName, scenarios, georisques, drought, vigieau }: SharedProps) {
  const [horizon] = useHorizon();
  const meta = HORIZON_META[horizon];
  const gwlData = scenarios?.[horizon]?.v ?? null;
  const paragraphs = communeName ? buildParagraphs(communeName, gwlData, horizon, georisques, drought, vigieau) : [];

  return (
    <div className="glass rounded-xl p-8 border-t-2 border-t-info">
      <h3 className="font-normal text-[26px] text-label mb-3 tracking-[-0.3px]" style={{ fontFamily: "'Instrument Serif', serif" }}>
        {communeName}, à l&apos;horizon {meta.year}, scénario France {meta.france}.
      </h3>
      {paragraphs.length > 0 ? (
        paragraphs.map((p, i) => (
          <p key={i} className="text-[16px] leading-[1.75] text-muted mb-4">{p}</p>
        ))
      ) : (
        <p className="text-[16px] leading-[1.75] text-muted mb-4">
          Renseignez votre commune dans votre profil pour accéder aux projections climatiques de votre territoire.
        </p>
      )}
    </div>
  );
}
