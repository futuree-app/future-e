"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { PaymentWrapper } from "@/components/PaymentWrapper";
import type { UserProject } from "@/lib/user-project";
import { isAddressObjective, type AddressObjective } from "@/lib/relation-au-lieu";
import { recapitulatif, relationDuChoix, type ChoixRelation } from "@/lib/dossier-contexte-ecran";
import { enregistrerProjet } from "@/lib/projet-sauvegarde-client";
import { ContexteDuDossier, type ChoixProjet } from "./ContexteDuDossier";

// ════════════════════════════════════════════════════════════════════════════════════════════
// DEUX ÉTAPES, ET L'ORDRE EST LE CŒUR DE FUT-10.
//
// `PaymentWrapper` crée le PaymentIntent DÈS SON MONTAGE. Des questions posées à côté du formulaire
// arriveraient donc après la création, et le dossier serait préparé sans elles. Le formulaire n'est
// monté qu'à l'étape « paiement », une fois les réponses connues (et le projet enregistré s'il a été
// écrit ou modifié). Les réponses voyagent avec la création du PaymentIntent ; le serveur les range
// dans `dossier_intents` avant de rendre le formulaire, ou refuse de le rendre.
//
// CORRIGER UNE RÉPONSE démonte le formulaire. Repasser au paiement renvoie la même clé d'idempotence
// avec les mêmes paramètres Stripe (les réponses n'y figurent pas) : Stripe rend le MÊME PaymentIntent,
// et seule l'intention est mise à jour. Aucun paiement superflu.
//
// RIEN N'EST OBLIGATOIRE. « Continuer sans répondre » est un choix affiché, et l'étape de paiement dit
// alors ce que le dossier ne pourra pas faire.
// ════════════════════════════════════════════════════════════════════════════════════════════

// Les deux réponses FERMÉES survivent à un rechargement, par adresse et dans cet onglet seulement.
// Jamais le texte libre : un projet ne vit qu'au compte, une fois enregistré par un geste explicite.
const cleBrouillon = (banId: string) => `futuree:checkout-dossier:${banId}`;
const RELATIONS_CHOIX: readonly ChoixRelation[] = ["lives_here", "studying", "sans_reponse"];

type Address = {
  banId: string;
  label: string;
  postcode: string;
  city: string;
  citycode: string;
  latitude: number;
  longitude: number;
  type: string | null;
};

export function DossierCheckoutPanel({
  address,
  quote,
  promoCode,
  promoRejected,
  promoExpired,
  userEmail,
  checkoutAttemptId,
  projet,
}: {
  address: Address;
  quote: {
    basePriceCents: number; territoryDeductionCents: number; amountDueCents: number;
    promoLabel: string | null;
  };
  /** Le code VALIDÉ par le serveur, jamais ce que le lecteur a tapé. */
  promoCode: string | null;
  promoRejected: boolean;
  promoExpired: boolean;
  userEmail: string | null | undefined;
  checkoutAttemptId: string;
  /** Le projet du compte, lu par la page serveur. `null` : aucun projet. */
  projet: UserProject | null;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [saisie, setSaisie] = useState("");
  const eur = (cents: number) => `${Math.round(cents / 100)} €`;

  // ── Le contexte de ce dossier ──
  const [etape, setEtape] = useState<"questions" | "paiement">("questions");
  const [objectif, setObjectif] = useState<AddressObjective | null>(null);
  const [relation, setRelation] = useState<ChoixRelation | null>(null);
  // Le projet CONFIRMÉ par le serveur : celui de la page, puis celui que renvoie un enregistrement.
  const [projetCourant, setProjetCourant] = useState<UserProject | null>(projet);
  const reformulation = projetCourant?.parsed?.reformulation ?? projetCourant?.rawText ?? null;
  const [choixProjet, setChoixProjet] = useState<ChoixProjet>("garder");
  const [texte, setTexte] = useState(projet?.rawText ?? "");
  const [enregistrement, setEnregistrement] = useState(false);
  const [erreurProjet, setErreurProjet] = useState<string | null>(null);
  const [prioritesIncomprises, setPrioritesIncomprises] = useState(false);

  // Le brouillon est relu APRÈS le montage : la page est rendue côté serveur, où `sessionStorage`
  // n'existe pas, et le lire pendant le rendu ferait diverger l'hydratation.
  useEffect(() => {
    try {
      const brut = window.sessionStorage.getItem(cleBrouillon(address.banId));
      if (!brut) return;
      const b = JSON.parse(brut) as { objectif?: unknown; relation?: unknown };
      // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture ponctuelle d'un store externe au montage
      if (isAddressObjective(b.objectif)) setObjectif(b.objectif);
      if (RELATIONS_CHOIX.includes(b.relation as ChoixRelation)) setRelation(b.relation as ChoixRelation);
    } catch {
      // Stockage indisponible (navigation privée, données bloquées) : on repart des questions vides.
    }
  }, [address.banId]);

  function memoriser(next: { objectif: AddressObjective | null; relation: ChoixRelation | null }) {
    try {
      window.sessionStorage.setItem(cleBrouillon(address.banId), JSON.stringify(next));
    } catch {
      // Sans stockage, le parcours fonctionne : seul le rechargement oubliera les réponses.
    }
  }

  // LE PROJET NE S'ÉCRIT QUE SUR UN GESTE : texte saisi alors qu'il n'y en avait pas, ou « Le
  // modifier » choisi. Un champ laissé vide n'efface jamais un projet existant, ni ses critères.
  async function continuer() {
    setErreurProjet(null);
    const brut = texte.trim();
    const ecrire = reformulation
      ? choixProjet === "modifier" && brut.length > 0 && brut !== (projetCourant?.rawText ?? "").trim()
      : brut.length > 0;
    if (ecrire) {
      setEnregistrement(true);
      const r = await enregistrerProjet({
        texte: brut,
        // Un projet NOUVEAU naît par la porte de l'adresse : « J'étudie ce lieu ». C'est le défaut de
        // cette porte, comme « Je cherche où vivre » l'est de la reprise d'une recherche ; il ne règle
        // que le vocabulaire et se change dans « Votre projet ». L'intention globale n'est jamais
        // déduite de l'objectif de CE bien : elle reste celle du projet, ou rien.
        posture: projetCourant?.posture ?? "adresse",
        intent: projetCourant?.intent ?? null,
        projet: projetCourant,
      });
      setEnregistrement(false);
      if (!r.ok) {
        setErreurProjet(r.conflit
          ? "Votre projet a changé entre-temps, dans un autre onglet. Rechargez la page pour le relire."
          : "Votre projet n'a pas pu être enregistré. Réessayez, ou continuez sans le modifier.");
        return;
      }
      setProjetCourant(r.project);
      setPrioritesIncomprises(r.avertir);
      setChoixProjet("garder");
    }
    passerAuPaiement(objectif, relation);
  }

  function passerAuPaiement(o: AddressObjective | null, r: ChoixRelation | null) {
    memoriser({ objectif: o, relation: r });
    // SI le lecteur a répondu, jamais CE qu'il a répondu : aucun texte, aucun projet dans la mesure.
    posthog.capture("address_checkout_context_set", {
      objective_declared: o != null,
      relation_declared: r === "lives_here" || r === "studying",
      project_present: Boolean(projetCourant),
    });
    setEtape("paiement");
  }

  function continuerSansRepondre() {
    setObjectif(null);
    setRelation(null);
    setErreurProjet(null);
    passerAuPaiement(null, null);
  }

  const recap = recapitulatif({
    objectif, relation,
    priorites: projetCourant?.parsed?.reformulation ?? projetCourant?.rawText ?? null,
    projetExiste: Boolean(projetCourant), prioritesIncomprises,
  });

  // Le code passe par l'URL : la page est un composant serveur, c'est elle qui le résout, et un
  // rechargement conserve donc le tarif. Un état local ferait diverger l'affichage du montant
  // réellement facturé, qui est recalculé serveur.
  function appliquer(valeur: string) {
    const next = new URLSearchParams(params.toString());
    const v = valeur.trim();
    if (v) next.set("code", v);
    else next.delete("code");
    router.replace(`?${next.toString()}`);
  }

  return (
    <div className="glass rounded-xl p-6">
      <p className="text-[19px] text-label mb-1">
        {eur(quote.amountDueCents)}
        {quote.promoLabel && (
          <span className="ml-2.5 text-[14px] text-ghost line-through">
            {eur(quote.basePriceCents)}
          </span>
        )}
      </p>

      {quote.promoLabel && (
        <p className="font-mono text-[12px] text-ghost mb-5">
          {quote.promoLabel} · code {promoCode}
        </p>
      )}

      {!quote.promoLabel && quote.territoryDeductionCents > 0 && (
        <p className="font-mono text-[12px] text-ghost mb-5">
          Vous avez déjà la lecture de {address.city} : {eur(quote.territoryDeductionCents)} déduits
          des {eur(quote.basePriceCents)}.
        </p>
      )}

      <p className="text-[14px] text-muted leading-relaxed mb-6">
        Paiement rattaché à <span className="text-label">{userEmail}</span>. TVA non applicable,
        art. 293 B du CGI.
      </p>

      {/* LA SAISIE DU CODE. Repliée tant qu'aucun code n'est appliqué : la très grande majorité des
          acheteurs n'en a pas, et un champ ouvert leur ferait croire qu'ils ratent quelque chose
          juste avant de payer. */}
      {!quote.promoLabel && (
        <details className="mb-6">
          <summary className="cursor-pointer list-none font-mono text-[11px] tracking-[0.08em] uppercase text-ghost">
            J&apos;ai un code
          </summary>
          <div className="mt-3 flex flex-wrap gap-2.5">
            <input
              type="text"
              value={saisie}
              onChange={(e) => setSaisie(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") appliquer(saisie); }}
              placeholder="Votre code"
              aria-label="Code de lancement"
              className="flex-1 min-w-[160px] rounded-lg border border-[var(--border-2)] bg-[var(--bg-deep,#0f1424)] px-3.5 py-2.5 text-[14px] text-label outline-none focus:border-accent/60"
            />
            <button
              type="button"
              onClick={() => appliquer(saisie)}
              className="rounded-lg border border-[var(--border-2)] bg-[var(--bg-elev-2)] px-4 py-2.5 text-[length:var(--text-dense)] text-muted"
            >
              Appliquer
            </button>
          </div>
          {promoRejected && (
            <p className="mt-2.5 text-[13px] text-red-300">
              {promoExpired
                ? "Ce code n'est plus valable."
                : "Ce code ne correspond à rien. Vérifiez la saisie."}
            </p>
          )}
        </details>
      )}

      {etape === "questions" ? (
        <section aria-labelledby="contexte-titre" className="border-t border-[var(--border-1)] pt-6">
          <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-ghost mb-2">
            Avant le paiement
          </p>
          <h2 id="contexte-titre" className="text-[19px] text-label leading-snug mb-2" style={{ fontFamily: "var(--font-serif)" }}>
            Ce qui compte pour votre décision
          </h2>
          <p className="text-[14px] text-muted leading-relaxed mb-7">
            Vos réponses permettent de distinguer ce que les données disent du logement de ce qui
            compte réellement pour votre décision. Aucune n&apos;est obligatoire.
          </p>

          <ContexteDuDossier
            objectif={objectif} setObjectif={setObjectif}
            relation={relation} setRelation={setRelation}
            reformulation={reformulation}
            choixProjet={choixProjet} setChoixProjet={setChoixProjet}
            texte={texte} setTexte={setTexte}
            projetSansTexte={Boolean(projetCourant) && !reformulation}
          />

          {erreurProjet && (
            <p className="mt-5 text-[13.5px] text-red-300" role="alert">{erreurProjet}</p>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            <button
              type="button"
              onClick={continuer}
              disabled={enregistrement}
              className="rounded-lg bg-accent px-6 py-3 text-[14px] font-medium text-[#12172a] disabled:opacity-60"
            >
              {enregistrement ? "Enregistrement de votre projet…" : "Continuer vers le paiement"}
            </button>
            <button
              type="button"
              onClick={continuerSansRepondre}
              disabled={enregistrement}
              className="text-[13.5px] text-muted underline underline-offset-2 decoration-[var(--border-2)] hover:text-label disabled:opacity-60"
            >
              Continuer sans répondre
            </button>
          </div>
        </section>
      ) : (
        <>
          {/* CE QUE LE DOSSIER UTILISERA, juste au-dessus du paiement, et corrigeable. */}
          <div className="mb-6 rounded-xl border border-[var(--border-2)] bg-[var(--bg-elev)] px-5 py-4">
            <div className="flex flex-wrap items-baseline justify-between gap-3 mb-3">
              <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-ghost">Votre dossier</p>
              <button
                type="button"
                onClick={() => setEtape("questions")}
                className="text-[13px] text-accent underline underline-offset-2 decoration-accent/40"
              >
                Modifier mes réponses
              </button>
            </div>
            <dl className="m-0" style={{ display: "grid", gap: 8 }}>
              {recap.lignes.map((l) => (
                <div key={l.libelle} className="flex flex-wrap gap-x-3 gap-y-0.5">
                  <dt className="text-[13px] text-ghost min-w-[110px]">{l.libelle}</dt>
                  <dd className="m-0 text-[13.5px] text-label leading-relaxed flex-1 min-w-[200px] line-clamp-3">{l.valeur}</dd>
                </div>
              ))}
            </dl>
            {recap.limite && (
              <p className="mt-4 text-[13.5px] text-muted leading-relaxed">{recap.limite}</p>
            )}
          </div>

      <PaymentWrapper
        // `amount` n'est qu'un AFFICHAGE : le montant facturé est recalculé côté serveur par
        // `quoteForDossier`, donc un client qui modifierait cette valeur ne changerait rien.
        amount={quote.amountDueCents / 100}
        productType="address-dossier"
        address={address}
        // Généré à chaque rendu de la page serveur : un double clic réutilise la même valeur,
        // puisqu'elle vit dans les props, tandis qu'un retour explicite sur cette page ouvre une
        // tentative neuve. C'est la frontière voulue entre doublon technique et second achat
        // légitime, le produit autorisant plusieurs dossiers à la même adresse.
        checkoutAttemptId={checkoutAttemptId}
        // Le serveur le RÉSOUT à nouveau : ce qui voyage ici n'est qu'une intention.
        promoCode={promoCode}
        returnUrl="/dossier/merci"
        onSuccess={() => router.push("/dossier/merci")}
        // FUT-10 : les réponses, et la version du projet que l'écran a montrée. Le serveur relit le
        // projet en base, refuse s'il a changé, et range le tout dans `dossier_intents`.
        dossierContext={{
          objectif,
          relation: relationDuChoix(relation),
          projetVu: { existe: Boolean(projetCourant), updatedAt: projetCourant?.updatedAt ?? null },
        }}
      />
        </>
      )}
    </div>
  );
}
