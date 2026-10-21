// FUT-118 · TÉMOIN 05 · DE LA QUALIFICATION AU DOSSIER, DANS LA GRAMMAIRE DU DOSSIER. DEV UNIQUEMENT.
//
// Aujourd'hui le lecteur passe de l'accueil (Relevé) à une qualification sobre mais en capitales
// mono, puis à une connexion en verre et halos, puis à une page de déblocage en italique orange et
// cartes arrondies, puis au dossier. Ce témoin montre le même tunnel sans changer d'univers :
// qualification, paiement, attente, refus confirmé, état inconnu, confirmation, retour au contenu.
//
// TOUT EST FICTIF : adresse témoin, aucun appel à Stripe (l'emplacement du formulaire est un cadre
// vide), aucune écriture. Le prix affiché est celui de la page publique, il n'est pas modifié ici.
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import {
  releve as s, BandeauPrototype, Surtitre, Ligne, Marge, Plaque, EmblemeEchelles, Registre, Grain,
} from "@/components/releve/primitives";
import t from "../temoins.module.css";

export const dynamic = "force-dynamic";

const ETAPES = [
  { cle: "qualification", nom: "L'adresse" },
  { cle: "paiement", nom: "Le paiement" },
  { cle: "attente", nom: "La préparation" },
  { cle: "confirme", nom: "Votre dossier" },
] as const;
type Cle = (typeof ETAPES)[number]["cle"] | "refuse" | "inconnu";

export default async function TemoinPaiement({ searchParams }: { searchParams: Promise<{ etape?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const sp = await searchParams;
  const etape: Cle = (["qualification", "paiement", "attente", "refuse", "inconnu", "confirme"] as const).find((x) => x === sp.etape) ?? "qualification";
  const courante = etape === "refuse" || etape === "inconnu" ? "paiement" : etape;

  return (
    <div className={s.releve}>
      <Navbar />
      <BandeauPrototype>
        FUT-118 · témoin 05 · tunnel d&apos;achat · adresse fictive · aucun appel Stripe · états :{" "}
        {(["qualification", "paiement", "attente", "refuse", "inconnu", "confirme"] as const).map((x) => (
          <span key={x}><Link href={`?etape=${x}`} aria-current={x === etape ? "page" : undefined}>{x}</Link>{" "}</span>
        ))}
        · <Link href="/dev/fut118">index</Link>
      </BandeauPrototype>
      <main className={`${s.feuille} ${t.page}`}>
        <header className={t.tete}>
          {/* MANQUE 6 : le parcours. */}
          <ol className={t.parcours} aria-label="Étapes">
            {ETAPES.map((e, i) => (
              <li key={e.cle} aria-current={e.cle === courante ? "step" : undefined}>
                <span className={t.parcoursNumero}>0{i + 1}</span>{e.nom}
              </li>
            ))}
          </ol>
          <h1 className={s.display}>
            {etape === "qualification" ? "Quel bien voulez-vous faire examiner ?"
              : etape === "confirme" ? "Votre dossier est prêt."
                : "Dossier d'adresse"}
          </h1>
        </header>

        <div className={t.colonnes}>
          <div className={s.pile} style={{ gap: 32 }}>
            {etape === "qualification" ? (
              <>
                {/* MANQUE 5 : le champ. */}
                <label className={t.champ}>
                  <span className={t.champLibelle}>Adresse du bien</span>
                  <input className={t.champSaisie} defaultValue="1 rue Témoin, 00000 Commune témoin" />
                  <span className={t.champAide}>Une adresse précise : le dossier lit le bâtiment, son secteur et sa commune.</span>
                </label>
                <section aria-labelledby="q1">
                  <Surtitre numero="01" id="q1">Ce que nous pouvons lire à cette adresse</Surtitre>
                  <ul className={s.liste} style={{ marginTop: 18 }}>
                    <li><Ligne marge={<Marge elements={[{ type: "grain", grain: "commune" }]} />}><p className={s.corps}>La commune : climat projeté, risques recensés, services, population.</p></Ligne></li>
                    <li><Ligne marge={<Marge elements={[{ type: "grain", grain: "secteur" }]} />}><p className={s.corps}>Le secteur : ce qui est à portée de pas, la chaleur du quartier, les projets autorisés.</p></Ligne></li>
                    <li><Ligne marge={<Marge elements={[{ type: "grain", grain: "batiment" }, { type: "source", texte: "1 diagnostic rattaché · ADEME" }]} />}><p className={s.corps}>Le logement : un diagnostic de performance énergétique est rattaché à cette adresse.</p></Ligne></li>
                  </ul>
                </section>
                <div><Link href="?etape=paiement" className={`${s.bouton} ${s.boutonMarque}`}>Continuer</Link></div>
              </>
            ) : null}

            {etape === "paiement" || etape === "refuse" || etape === "inconnu" ? (
              <>
                {/* MANQUE 7 : la ligne d'état n'affirme QUE ce que le serveur a confirmé, sans teinte de registre.
                    `refuse` suppose un statut de paiement relu côté serveur auprès de Stripe (refus établi) :
                    c'est seulement alors que « il n'a pas été prélevé » peut s'écrire. `inconnu` couvre
                    l'erreur générique, le délai, la réponse perdue : rien n'y est garanti, l'écran le dit et
                    protège contre un second paiement. */}
                {etape === "refuse" ? (
                  <p className={t.etat} data-etat="echec" role="status">
                    <span className={t.etatRepere} aria-hidden />
                    <span className={s.dense}>Votre banque a refusé le paiement : il n&apos;a pas été prélevé. Votre adresse est conservée.</span>
                  </p>
                ) : null}
                {etape === "inconnu" ? (
                  <p className={t.etat} data-etat="attente" role="status" aria-live="polite">
                    <span className={t.etatRepere} aria-hidden />
                    <span className={s.dense}>Nous n&apos;avons pas encore la confirmation de votre paiement. Ne le relancez pas : cette page se mettra à jour dès que la réponse arrivera.</span>
                  </p>
                ) : null}
                {/* Tant que l'issue d'un paiement est inconnue, aucun moyen de payer à nouveau n'est montré :
                    la page ne demanderait pas « ne le relancez pas » au-dessus d'un bouton « Payer ». */}
                {etape !== "inconnu" ? (
                  <>
                    <section aria-labelledby="p1" className={s.pile} style={{ gap: 16 }}>
                      <Surtitre numero="02" id="p1">Le paiement</Surtitre>
                      {/* MANQUE 8 : ce qui n'appartient pas à futur•e se pose dans un cadre neutre, sans coins de plaque. */}
                      <div className={t.emplacement}>Emplacement du formulaire de paiement Stripe. Il n&apos;est pas chargé dans ce prototype.</div>
                      <p className={s.nuance}>Paiement unique, accès immédiat. TVA non applicable, art. 293 B du CGI.</p>
                    </section>
                    <div className={s.rangee}>
                      <Link href="?etape=attente" className={`${s.bouton} ${s.boutonMarque}`}>Payer 39 €</Link>
                      <Link href="?etape=qualification" className={s.lien}>Modifier l&apos;adresse</Link>
                    </div>
                  </>
                ) : null}
              </>
            ) : null}

            {etape === "attente" ? (
              // « Paiement confirmé » suppose l'état serveur établi (webhook reçu ou statut relu), jamais le
              // seul retour du formulaire.
              <p className={t.etat} data-etat="attente" role="status" aria-live="polite">
                <span className={t.etatRepere} aria-hidden />
                <span className={s.dense}>Paiement confirmé. Le dossier lit la commune, puis l&apos;adresse : la première lecture s&apos;affichera dès qu&apos;elle sera prête, sans attendre la suite.</span>
              </p>
            ) : null}

            {etape === "confirme" ? (
              <>
                <p className={t.etat} data-etat="confirme" role="status">
                  <span className={t.etatRepere} aria-hidden />
                  <span className={s.dense}>Dossier daté du 20 octobre 2026. Il reste lisible tel quel, même si votre projet change.</span>
                </p>
                <Link href="/dev/fut91?vue=releve&pane=1&artefact=1" className={s.porte}>
                  <span style={{ color: "var(--r-encre)", paddingTop: 4 }}><Grain grain="batiment">{""}</Grain></span>
                  <span className={s.pileSerree}>
                    <span className={s.sousTitre}>Ouvrir Ma décision</span>
                    <span className={s.dense}>La conclusion, ce qui correspond, ce qui reste à contrôler.</span>
                  </span>
                  <span aria-hidden className={s.mono} style={{ color: "var(--r-encre)" }}>→</span>
                </Link>
              </>
            ) : null}
          </div>

          {/* La plaque de l'achat : ce que la personne achète, dit comme le dossier le dira. */}
          <Plaque etiquette="Ce que vous achetez">
            <div className={s.pile} style={{ gap: 18 }}>
              <p className={s.surtitre}>Dossier d&apos;adresse</p>
              <p className={s.chiffre}>39 €</p>
              <EmblemeEchelles etiquette="Les trois échelles examinées par le dossier d'adresse" etats={{ commune: "constats", secteur: "constats", batiment: "constats" }} />
              <Registre className={s.dense}>Un dossier daté, sourcé, qui dit ce qui reste à vérifier.</Registre>
              <p className={s.nuance}>1 rue Témoin, 00000 Commune témoin</p>
            </div>
          </Plaque>
        </div>
      </main>
    </div>
  );
}
