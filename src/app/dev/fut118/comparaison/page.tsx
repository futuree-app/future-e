// FUT-118 · TÉMOIN 04 · LES OBJETS VISUELS D'UNE COMPARAISON À N POSSIBILITÉS. DEV UNIQUEMENT.
//
// Ce témoin NE CONÇOIT PAS le centre de décision (FUT-41 / FUT-22, autre chantier). Il montre
// comment ses objets (Projet, possibilités, critère qui départage, issue par possibilité, niveau
// d'examen, vérification, journal) s'écrivent dans la grammaire du Relevé, de 2 à 10 possibilités,
// SANS colonnes figées : chaque critère est une ligne, et la marge porte l'issue de chaque possibilité.
// La forme suit la direction A du cadrage FUT-41 (« dossier de décision vivant »).
//
// Règles visibles ici : aucune note, aucun total, aucun tri par mérite (ordre d'ajout, dit à
// l'écran) ; la seule couleur est le trait de registre d'une issue ÉTABLIE ; une issue non établie
// n'a pas de valence (pointillé, gris) ; la profondeur d'examen est un fait, jamais un avantage.
//
// TOUT EST FICTIF (« Commune A », « Bien B1 »). Aucun moteur, aucun modèle.
import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import Navbar from "@/components/Navbar";
import {
  releve as s, BandeauPrototype, Surtitre, Ligne, Registre, Plaque, GlypheGrain, TEINTE_REGISTRE,
} from "@/components/releve/primitives";
import t from "../temoins.module.css";
import { enonce, ETABLIE, type Mot } from "./enonce";

export const dynamic = "force-dynamic";

type Possibilite = { nom: string; adresse: boolean; etat: "en course" | "à considérer" | "écartée"; analyse: string; suite: string };

const POSSIBILITES: Possibilite[] = [
  { nom: "Commune A", adresse: false, etat: "en course", analyse: "12 sept.", suite: "Examiner une adresse" },
  { nom: "Bien B1", adresse: true, etat: "en course", analyse: "3 oct.", suite: "Visite prévue" },
  { nom: "Commune C", adresse: false, etat: "à considérer", analyse: "18 sept.", suite: "Lire le dossier" },
  { nom: "Bien D1", adresse: true, etat: "en course", analyse: "7 oct.", suite: "Demander le DPE complet" },
  { nom: "Commune E", adresse: false, etat: "écartée", analyse: "2 sept.", suite: "Motif : trajets trop longs" },
  { nom: "Commune F", adresse: false, etat: "à considérer", analyse: "20 sept.", suite: "Lire le dossier" },
  { nom: "Bien G1", adresse: true, etat: "en course", analyse: "9 oct.", suite: "Visite prévue" },
  { nom: "Commune H", adresse: false, etat: "à considérer", analyse: "21 sept.", suite: "Lire le dossier" },
  { nom: "Commune I", adresse: false, etat: "à considérer", analyse: "22 sept.", suite: "Lire le dossier" },
  { nom: "Bien J1", adresse: true, etat: "à considérer", analyse: "11 oct.", suite: "Examiner le logement" },
];

// Une ligne par critère du Projet, dans l'ordre du Projet (condition d'abord). Issues fictives.
const CRITERES: { sujet: string; condition: boolean; issues: Mot[] }[] = [
  { sujet: "Des étés supportables", condition: true, issues: ["ne tient pas", "tient", "tient", "à vérifier", "ne tient pas", "tient", "tient", "tient", "tient", "à vérifier"] },
  { sujet: "Une gare à moins de quinze minutes", condition: false, issues: ["tient", "tient", "ne tient pas", "tient", "ne tient pas", "tient", "tient", "tient", "tient", "tient"] },
  { sujet: "Le calme", condition: false, issues: ["tient", "non examiné", "tient", "non examiné", "tient", "tient", "non examiné", "tient", "tient", "non examiné"] },
  { sujet: "Un médecin généraliste accessible", condition: false, issues: ["tient", "tient", "tient", "tient", "tient", "tient", "tient", "tient", "tient", "tient"] },
];


function teinte(mot: Mot, condition: boolean): string | undefined {
  if (mot === "tient") return TEINTE_REGISTRE.alignments;
  if (mot === "ne tient pas") return condition ? TEINTE_REGISTRE.incompatibilities : TEINTE_REGISTRE.mismatches;
  return undefined;
}


function NiveauExamen({ adresse }: { adresse: boolean }) {
  // MANQUE 4 : la profondeur d'une analyse, dite par les glyphes d'échelle. Jamais une qualité.
  return (
    <span className={t.examen} aria-label={adresse ? "examinée à la commune, au secteur et au logement" : "examinée à la commune seulement"}>
      <GlypheGrain grain="commune" taille={11} />
      <span data-examinee={adresse ? "oui" : "non"}><GlypheGrain grain="secteur" taille={11} /></span>
      <span data-examinee={adresse ? "oui" : "non"}><GlypheGrain grain="batiment" taille={11} /></span>
    </span>
  );
}

export default async function TemoinComparaison({ searchParams }: { searchParams: Promise<{ n?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const sp = await searchParams;
  const n = [2, 5, 10].includes(Number(sp.n)) ? Number(sp.n) : 5;
  const poss = POSSIBILITES.slice(0, n);
  const lignes = CRITERES.map((c) => {
    const issues = poss.map((p, i) => ({ nom: p.nom, mot: c.issues[i]! }));
    return { ...c, issues, ...enonce(c.sujet, issues) };
  });
  const actives = lignes.filter((l) => l.classe !== "accord");
  const accords = lignes.filter((l) => l.classe === "accord");

  return (
    <div className={s.releve}>
      <Navbar />
      <BandeauPrototype>
        FUT-118 · témoin 04 · objets visuels d&apos;une comparaison · données fictives · ne préjuge pas de l&apos;architecture FUT-41 · <Link href="/dev/fut118">index</Link>
      </BandeauPrototype>
      <main className={`${s.feuille} ${t.page}`}>
        <header className={t.tete}>
          <Surtitre numero="Projet">Votre recherche</Surtitre>
          <h1 className={s.display}>Ce qui départage vos {n} possibilités.</h1>
          <nav aria-label="Nombre de possibilités (démonstration)" className={t.selecteur}>
            {[2, 5, 10].map((x) => (
              <Link key={x} href={`?n=${x}`} className={t.option} aria-current={x === n ? "page" : undefined} scroll={false}>{x} possibilités</Link>
            ))}
          </nav>
        </header>

        {/* Le Projet en phrase de lecteur : la seule plaque de l'écran. */}
        <Plaque etiquette="Votre projet">
          <div className={s.pile} style={{ gap: 14 }}>
            <p className={s.surtitre}>Votre projet · révisé le 2 octobre</p>
            <p className={s.chapo} style={{ color: "var(--r-encre)" }}>
              Une ville moyenne avec une gare proche, au calme, où les étés restent supportables, et un médecin à portée.
            </p>
            <Registre teinte={TEINTE_REGISTRE.incompatibilities} className={s.dense}>Condition sans compromis : des étés supportables.</Registre>
          </div>
        </Plaque>

        <section className={s.mouvement} aria-labelledby="c1">
          <div className={s.enTeteMouvement}>
            <Surtitre numero="01" id="c1">Ce qui les départage</Surtitre>
            <p className={s.nuance}>Un critère par ligne, dans l&apos;ordre de votre projet. La marge donne l&apos;issue de chaque possibilité.</p>
          </div>
          <ul className={s.liste}>
            {actives.map((l) => (
              <li key={l.sujet}>
                <Ligne marge={
                  <aside className={s.marge} aria-label={`Issue par possibilité : ${l.sujet}`}>
                    <ul className={t.issues}>
                      {l.issues.map((x) => (
                        <li key={x.nom} className={t.issue} data-etablie={ETABLIE[x.mot] ? "oui" : "non"} style={{ "--r-teinte": teinte(x.mot, l.condition) } as CSSProperties}>
                          <span className={t.issueTrait} aria-hidden />
                          <span className={t.issueNom}>{x.nom}</span>
                          <span className={t.issueMot}>{x.mot}</span>
                        </li>
                      ))}
                    </ul>
                  </aside>
                }>
                  <p className={s.etiquette}>{l.condition ? "Condition sans compromis" : l.classe === "departage" ? "Départage" : "Pourrait départager"}</p>
                  <p className={s.corps} style={{ color: "var(--r-encre)" }}>{l.texte}</p>
                </Ligne>
              </li>
            ))}
          </ul>
          {accords.length ? (
            <details className={s.details} style={{ marginTop: 18 }}>
              <summary>Ne départage pas ({accords.length})</summary>
              <ul className={s.liste} style={{ marginTop: 12 }}>{accords.map((l) => <li key={l.sujet} className={s.dense}>{l.texte}</li>)}</ul>
            </details>
          ) : null}
        </section>

        <section className={s.mouvement} aria-labelledby="c2">
          <div className={s.enTeteMouvement}>
            <Surtitre numero="02" id="c2">Vos possibilités</Surtitre>
            <p className={s.nuance}>Dans l&apos;ordre où vous les avez ajoutées. Aucun classement.</p>
          </div>
          <table className={t.tableau}>
            <thead>
              <tr><th scope="col">Possibilité</th><th scope="col">Examinée</th><th scope="col">État</th><th scope="col" className={t.nombre}>Analyse</th><th scope="col">Suite</th></tr>
            </thead>
            <tbody>
              {poss.map((p) => (
                <tr key={p.nom} style={p.etat === "écartée" ? { opacity: 0.72 } : undefined}>
                  <td style={{ color: "var(--r-encre)", fontWeight: 500 }}>{p.nom}</td>
                  <td><NiveauExamen adresse={p.adresse} /></td>
                  <td className={t.plein}>{p.etat}</td>
                  <td className={t.nombre}>{p.analyse}</td>
                  <td className={`${t.plein} ${s.nuance}`}>{p.suite}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className={s.mouvement} aria-labelledby="c3">
          <div className={s.enTeteMouvement}>
            <Surtitre numero="03" id="c3">Ce qui pourrait encore changer votre avis</Surtitre>
          </div>
          <ol className={s.liste}>
            {lignes.flatMap((l) => l.issues.filter((x) => x.mot === "à vérifier").map((x) => (
              <li key={`${l.sujet}-${x.nom}`}>
                <Registre teinte={TEINTE_REGISTRE.verifications}>{x.nom} · {l.sujet.toLowerCase()}</Registre>
                <p className={s.dense}>Le diagnostic du logement ne dit pas comment il tient la chaleur : demandez l&apos;orientation, les protections solaires et la ventilation.</p>
              </li>
            )))}
          </ol>
        </section>

        <section className={s.mouvementSerre} aria-label="Le chemin parcouru">
          <details className={s.details}>
            <summary>Le chemin parcouru</summary>
            <ul className={s.liste} style={{ marginTop: 14 }}>
              <li className={s.dense}><span className={s.mono} style={{ color: "var(--r-meta)" }}>2 oct.</span> · Projet révisé : « des étés supportables » devient une condition sans compromis.</li>
              <li className={s.dense}><span className={s.mono} style={{ color: "var(--r-meta)" }}>2 sept.</span> · Commune E écartée : trajets trop longs.</li>
            </ul>
          </details>
        </section>
      </main>
    </div>
  );
}
