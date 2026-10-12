"use client";

// FUT-75 · LE BANC DES TROIS PROTOTYPES. DEV UNIQUEMENT.
//
// Pour chaque prototype : ses variantes, trois modes (animé, mouvement réduit, sans animation), un état
// imposable (initial ou final d'une interaction) et un bouton pour rejouer. L'état de départ peut venir
// de l'URL (`?a=reticule&am=reduit…`), pour que chaque capture et chaque vidéo soient reproductibles.
import { memo, useState, useSyncExternalStore, type ReactNode } from "react";
import { RepereAnime as RepereAnimeBrut, type VarianteRepere } from "./RepereAnime";
import { RegleDesHorizons as RegleDesHorizonsBrut, type MesureHorizon, type VarianteHorizons } from "./RegleDesHorizons";
import { CheminDeLaDecision as CheminDeLaDecisionBrut, type DonneesChemin, type VarianteChemin } from "./CheminDeLaDecision";

// Chaque prototype ne se recalcule que si SES réglages changent : rejouer A ne refait ni B ni C.
const RepereAnime = memo(RepereAnimeBrut);
const RegleDesHorizons = memo(RegleDesHorizonsBrut);
const CheminDeLaDecision = memo(CheminDeLaDecisionBrut);
const HREFS = { territoire: "/rapport/quartier", autour: "/rapport/autour?dossierId=exemple", logement: "/rapport/logement?dossierId=exemple" } as const;
const SOURCE_DRIAS = "Source : DRIAS-TRACC, médiane de 17 modèles climatiques régionaux, grille de 8 km ; référence 1976-2005 reconstruite depuis les écarts publiés.";
import { resoudreMode, type CleHorizon, type EtatForme, type FormeEchelle, type ModeMouvement } from "./motion";
import m from "./motion.module.css";

export type ReglagesBanc = {
  a?: string; am?: string; ae?: string; ap?: string;
  b?: string; bm?: string; bc?: string; bh?: string;
  c?: string; cm?: string; ce?: string;
};

type ChoixMode = "systeme" | ModeMouvement;
const MODES: { cle: ChoixMode; nom: string }[] = [
  { cle: "systeme", nom: "selon le système" }, { cle: "anime", nom: "animé" }, { cle: "reduit", nom: "mouvement réduit" }, { cle: "aucun", nom: "sans animation" },
];
const LISTE_MODES = ["systeme", "anime", "reduit", "aucun"] as const;

// LA PRÉFÉRENCE DU SYSTÈME, lue en direct (`prefers-reduced-motion`). Côté serveur : aucune préférence
// connue, donc le langage complet ; le client corrige au premier rendu.
const REQUETE = "(prefers-reduced-motion: reduce)";
function usePrefereReduit(): boolean {
  return useSyncExternalStore(
    (rappel) => { const q = window.matchMedia(REQUETE); q.addEventListener("change", rappel); return () => q.removeEventListener("change", rappel); },
    () => window.matchMedia(REQUETE).matches,
    () => false,
  );
}
const un = <T extends string>(v: string | undefined, permis: readonly T[], defaut: T): T => (permis as readonly string[]).includes(v ?? "") ? v as T : defaut;

function Choix<T extends string>({ legende, valeurs, courant, choisir }: { legende: string; valeurs: { cle: T; nom: string }[]; courant: T; choisir: (v: T) => void }) {
  return (
    <fieldset>
      <legend>{legende}</legend>
      {valeurs.map((v) => (
        <button key={v.cle} type="button" className={m.choix} aria-pressed={v.cle === courant} onClick={() => choisir(v.cle)}>{v.nom}</button>
      ))}
    </fieldset>
  );
}

function Prototype({ id, lettre, titre, intro, reglages, scene, notes, mode }: {
  id: string; lettre: string; titre: string; intro: ReactNode; reglages: ReactNode; scene: ReactNode; notes: ReactNode; mode: ModeMouvement;
}) {
  return (
    <section id={id} className={`${m.prototype} ${m.atelier}`} data-mouvement={mode} aria-labelledby={`${id}-titre`}>
      <div className="grid gap-2">
        <p className="font-mono text-[11.5px] text-ghost">Prototype {lettre}</p>
        <h2 id={`${id}-titre`} className="text-[26px] leading-[1.15] text-label" style={{ fontVariationSettings: '"wdth" 108', fontWeight: 600 }}>{titre}</h2>
        <div className="text-[15px] leading-[1.6] text-muted">{intro}</div>
      </div>
      <div className={m.reglages}>{reglages}</div>
      <div className={m.scene}>
        <div>{scene}</div>
        <div className={m.notes}>{notes}</div>
      </div>
    </section>
  );
}

export function Banc({ initial, repere, horizons, chemin }: {
  initial: ReglagesBanc;
  repere: { adresse: Record<FormeEchelle, EtatForme> | null; commune: Record<FormeEchelle, EtatForme> | null };
  horizons: { insee: string; nom: string; mesures: MesureHorizon[] | null }[];
  chemin: DonneesChemin | null;
}) {
  const [a, setA] = useState<VarianteRepere>(un(initial.a, ["production", "reticule", "recul"] as const, "reticule"));
  const [am, setAm] = useState<ChoixMode>(un(initial.am, LISTE_MODES, "systeme"));
  const [ae, setAe] = useState<"repos" | FormeEchelle>(un(initial.ae, ["repos", "territoire", "autour", "logement"] as const, "repos"));
  const [ap, setAp] = useState<"adresse" | "commune">(un(initial.ap, ["adresse", "commune"] as const, "adresse"));
  const [rejeuA, setRejeuA] = useState(0);
  const [b, setB] = useState<VarianteHorizons>(un(initial.b, ["regle", "trace"] as const, "trace"));
  const [bm, setBm] = useState<ChoixMode>(un(initial.bm, LISTE_MODES, "systeme"));
  const [bc, setBc] = useState(horizons.some((h) => h.insee === initial.bc) ? initial.bc! : horizons[0]?.insee ?? "");
  const bh = un(initial.bh, ["gwl15", "gwl20", "gwl30"] as const, "gwl20") as CleHorizon;
  const [c, setC] = useState<VarianteChemin>(un(initial.c, ["trait", "pas", "statique"] as const, "pas"));
  const [cm, setCm] = useState<ChoixMode>(un(initial.cm, LISTE_MODES, "systeme"));
  const [ce, setCe] = useState<number | null>(initial.ce != null && /^-?\d$/.test(initial.ce) ? Number(initial.ce) : null);
  const reduit = usePrefereReduit();
  const effectif = (c: ChoixMode): ModeMouvement => resoudreMode(c === "systeme" ? null : c, reduit);
  const etats = repere[ap];
  const commune = horizons.find((h) => h.insee === bc);

  return (
    <>
      <Prototype
        id="prototype-a" lettre="A" titre="Le lieu qui se révèle" mode={effectif(am)}
        intro={<>Le repère « Explorer le dossier », avec ses vraies destinations. À l&apos;arrivée, le dessin se trace du logement au territoire, et seules les échelles que la lecture a examinées se tracent. Au pointage ou au focus d&apos;une destination, un geste désigne son périmètre.</>}
        reglages={<>
          <Choix legende="Variante" courant={a} choisir={setA} valeurs={[{ cle: "production", nom: "A0 · production" }, { cle: "reticule", nom: "A1 · réticule" }, { cle: "recul", nom: "A2 · recul" }]} />
          <Choix legende="Mouvement" courant={am} choisir={setAm} valeurs={MODES} />
          <Choix legende="Dossier" courant={ap} choisir={setAp} valeurs={[{ cle: "adresse", nom: "d'adresse" }, { cle: "commune", nom: "communal" }]} />
          <Choix legende="État" courant={ae} choisir={setAe} valeurs={[{ cle: "repos", nom: "repos" }, { cle: "territoire", nom: "territoire" }, { cle: "autour", nom: "autour" }, { cle: "logement", nom: "logement" }]} />
          <button type="button" className={m.choix} onClick={() => setRejeuA((n) => n + 1)}>Rejouer l&apos;ouverture</button>
        </>}
        scene={etats ? (
          <div style={{ maxWidth: 300 }}>
            <RepereAnime key={`${ap}-${a}`} etats={etats} variante={a} mode={effectif(am)} rejeu={rejeuA} forceActif={ae === "repos" ? null : ae}
              hrefs={HREFS} />
          </div>
        ) : <p className="text-muted">Dossier de test indisponible (sources publiques injoignables).</p>}
        notes={<>
          <p><strong>Ce que le mouvement dit.</strong> Le dossier part d&apos;un point précis et s&apos;élargit ; le cadre nomme exactement le périmètre d&apos;une échelle, calculé depuis la géométrie de production.</p>
          <p><strong>Ce qu&apos;il ne dit pas.</strong> Aucune distance ni aucun lieu réel : ni carte, ni zoom géographique. Le recul (A2) est un schéma qui s&apos;agrandit, dit comme tel.</p>
          <p><strong>Ce qu&apos;il n&apos;empêche pas.</strong> Les trois liens existent dès le premier rendu ; un pointage, une touche ou une pression terminent l&apos;ouverture.</p>
          <p>Dossier communal : Autour et Logement, non examinés, se posent en pointillé sans être tracés.</p>
        </>}
      />

      <Prototype
        id="prototype-b" lettre="B" titre="Explorer le temps" mode={effectif(bm)}
        intro={<>Les trois horizons documentés de deux mesures de chaleur, sur les médianes DRIAS-TRACC d&apos;une commune publique. Choisir un horizon déplace le repère ; aucune valeur ne défile, aucun trait ne relie deux horizons.</>}
        reglages={<>
          <Choix legende="Variante" courant={b} choisir={setB} valeurs={[{ cle: "regle", nom: "B1 · curseur" }, { cle: "trace", nom: "B2 · curseur et trace" }]} />
          <Choix legende="Mouvement" courant={bm} choisir={setBm} valeurs={MODES} />
          <Choix legende="Commune" courant={bc} choisir={setBc} valeurs={horizons.map((h) => ({ cle: h.insee, nom: h.nom }))} />
        </>}
        scene={commune?.mesures ? (
          <RegleDesHorizons key={`${bc}-${b}-${bh}`} commune={commune.nom} mesures={commune.mesures} variante={b} mode={effectif(bm)} force={bh === "gwl20" ? undefined : bh}
            source={SOURCE_DRIAS} />
        ) : <p className="text-muted">Données DRIAS indisponibles pour cette commune.</p>}
        notes={<>
          <p><strong>Ce que le mouvement dit.</strong> On se déplace dans le temps, et la distance parcourue est honnête : 2030 et 2050 sont proches, 2100 est loin.</p>
          <p><strong>Ce qu&apos;il ne dit pas.</strong> Rien entre deux jalons : pendant le trajet, le curseur ne lit aucune valeur, et la lecture change d&apos;un bloc, par un fondu de 120 ms.</p>
          <p><strong>B2.</strong> L&apos;horizon quitté laisse un repère pâle, et la lecture le cite en toutes lettres, avec sa propre valeur : on compare sans tracer de pente.</p>
          <p>Clavier : flèches, Début et Fin dans le groupe d&apos;horizons.</p>
        </>}
      />

      <Prototype
        id="prototype-c" lettre="C" titre="Du fait à la décision" mode={effectif(cm)}
        intro={<>Le chemin réel d&apos;un constat du moteur (composition « confort d&apos;été »), sur un dossier d&apos;adresse public. Trois fondements convergent vers la conclusion, puis s&apos;en séparent vers ce que la donnée ne dit pas et ce qu&apos;il reste à vérifier.</>}
        reglages={<>
          <Choix legende="Variante" courant={c} choisir={(v) => { setC(v); setCe(null); }} valeurs={[{ cle: "pas", nom: "C1 · pas à pas" }, { cle: "trait", nom: "C2 · d'un trait" }, { cle: "statique", nom: "C3 · statique" }]} />
          <Choix legende="Mouvement" courant={cm} choisir={setCm} valeurs={MODES} />
          <Choix legende="État" courant={ce == null ? "libre" : String(ce)} choisir={(v) => setCe(v === "libre" ? null : Number(v))}
            valeurs={[{ cle: "libre", nom: "libre" }, { cle: "-1", nom: "initial" }, { cle: "5", nom: "final" }]} />
        </>}
        scene={chemin ? <CheminDeLaDecision key={c} donnees={chemin} variante={c} mode={effectif(cm)} forceEtape={ce} /> : <p className="text-muted">Le dossier de test ne porte pas de composition « confort d&apos;été ».</p>}
        notes={<>
          <p><strong>Ce que le mouvement dit.</strong> Pourquoi ces informations sont rapprochées : une priorité déclarée, une projection et une convention mènent ensemble à la conclusion.</p>
          <p><strong>Ce qu&apos;il ne dit pas.</strong> La conclusion n&apos;est pas calculée sous vos yeux : elle est en tête, lisible avant tout geste. Le rail retrace un chemin qui existe déjà.</p>
          <p><strong>Le bâtiment.</strong> Le moteur ne relie aucune donnée du logement à la chaleur : le bâtiment n&apos;apparaît qu&apos;à l&apos;étape 6, comme ce qu&apos;il reste à vérifier.</p>
          <p>Clavier (C1) : flèches haut et bas pour parcourir ; le focus suit l&apos;étape.</p>
        </>}
      />
    </>
  );
}
