"use client";

import { useEffect, useState } from "react";
import posthog from "posthog-js";
import { AddressAutocomplete } from "@/components/report/AddressAutocomplete";
import type { BanAddressResult } from "@/lib/ban";
import { expectedCoverage } from "@/lib/dossier-couverture-attendue";

type Candidate = {
  banId: string;
  label: string;
  city: string | null;
  postcode: string | null;
  latitude: number;
  longitude: number;
  distanceM: number;
};

type MatterState = "found" | "none" | "unavailable";

type Outcome =
  | {
      status: "qualified";
      matter: { dpe: MatterState; parcel: MatterState };
      quote: {
        status: "final" | "provisional";
        basePriceCents: number;
        amountDueCents: number;
        territoryDeductionCents?: number;
      };
    }
  | { status: "needs_precision"; candidates: Candidate[] }
  | { status: "unsupported_at_launch" };

// ════════════════════════════════════════════════════════════════════════════
// CE QUE CET ÉCRAN DIT, ET CE QU'IL NE DIT JAMAIS.
//
// Il nomme la MATIÈRE : ce qui sera examiné à cette adresse, et ce qui manque à cette adresse-là.
// Aucune valeur, aucun état, aucun verdict : la classe d'un diagnostic et le numéro d'une parcelle
// appartiennent au dossier payé. Sinon la qualification deviendrait le produit gratuit qui rend le
// payant inutile.
//
// LE STATUT SE PORTE PAR L'INTERFACE, jamais par une phrase qui énumère des absences (doctrine de
// marque). D'où une ligne par élément, avec sa pastille et son état en deux mots, plutôt que des
// paragraphes de regret.
// ════════════════════════════════════════════════════════════════════════════

const EUR = (cents: number) => `${Math.round(cents / 100)} €`;

// Les trois échelles du dossier. Elles décrivent ce que le lecteur obtient, dans son ordre de
// lecture : le territoire d'abord, puis ce qui l'entoure, puis le bâtiment.
const SCALES = [
  {
    key: "commune",
    title: "La commune",
    body: "Ce qu'elle devient face au climat, ce à quoi elle est exposée, ce qui la transforme.",
  },
  {
    key: "autour",
    title: "Autour de l'adresse",
    body: "Ce qui l'entoure à quelques centaines de mètres, et ce que ce voisinage change au quotidien.",
  },
  {
    key: "logement",
    title: "Le logement",
    body: "Ce que le bâtiment et sa parcelle révèlent de leur exposition.",
  },
] as const;

const MATTER_LABEL: Record<MatterState, { text: string; tone: "found" | "absent" | "unknown" }> = {
  found: { text: "disponible", tone: "found" },
  none: { text: "aucun à cette adresse", tone: "absent" },
  unavailable: { text: "non vérifiable à l'instant", tone: "unknown" },
};

const TONE_COLOR: Record<"found" | "absent" | "unknown", string> = {
  found: "var(--color-success)",
  absent: "var(--color-ghost)",
  unknown: "var(--color-accent)",
};

function MatterLine({ label, state }: { label: string; state: MatterState }) {
  const { text, tone } = MATTER_LABEL[state];
  return (
    <li className="flex items-baseline gap-2.5 flex-wrap">
      <span
        aria-hidden
        style={{
          width: 5,
          height: 5,
          borderRadius: 999,
          background: TONE_COLOR[tone],
          opacity: tone === "found" ? 0.9 : 0.55,
          transform: "translateY(-2px)",
          flex: "0 0 auto",
        }}
      />
      <span className="text-[length:var(--text-dense)] text-muted">{label}</span>
      <span
        className="font-mono text-[11px] tracking-[0.08em] uppercase"
        style={{ color: TONE_COLOR[tone], opacity: tone === "found" ? 0.85 : 0.7 }}
      >
        {text}
      </span>
    </li>
  );
}

export function DossierQualificationClient() {
  const [address, setAddress] = useState<BanAddressResult | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Le dénominateur de tout le parcours. Émis au montage, une seule fois : le tableau de
  // dépendances vide est le contrat, sinon un rendu de plus double le volume mesuré.
  useEffect(() => {
    posthog.capture("address_qualification_viewed");
  }, []);

  async function qualify(a: BanAddressResult) {
    if (!a.id || !a.citycode || a.latitude == null || a.longitude == null) {
      setError("Adresse sans coordonnées exploitables.");
      return;
    }
    setBusy(true);
    setError(null);
    setOutcome(null);
    setAddress(a);
    try {
      const res = await fetch("/api/dossier/qualification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: {
            banId: a.id,
            label: a.label,
            postcode: a.postcode ?? "",
            city: a.city ?? "",
            citycode: a.citycode,
            latitude: a.latitude,
            longitude: a.longitude,
            type: a.type,
          },
        }),
      });
      if (res.status === 503) {
        setError("Vérification indisponible pour l'instant. Réessayez dans un moment.");
        return;
      }
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const payload = (await res.json()) as Outcome;
      setOutcome(payload);
      posthog.capture("address_qualification_result", {
        status: payload.status,
        insee: a.citycode,
        ban_feature_type: a.type,
        matter: payload.status === "qualified" ? payload.matter : null,
      });
    } catch {
      setError("Qualification impossible pour l'instant.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <AddressAutocomplete
        placeholder="Saisissez une adresse"
        onSelect={qualify}
        onModify={() => {
          setOutcome(null);
          setError(null);
        }}
      />

      {busy && (
        <p className="text-[14px] text-muted mt-7" aria-live="polite">
          Nous vérifions ce que nous savons de cette adresse.
        </p>
      )}

      {error && (
        <p className="text-[14px] text-muted mt-7" aria-live="polite">
          {error}
        </p>
      )}

      {outcome?.status === "qualified" && address && (
        <div className="card-answer rounded-2xl p-7 md:p-9 mt-8">
          <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-ghost mb-6">
            Ce que nous examinerons ici
          </p>

          <div style={{ display: "grid", gap: 26 }}>
            {SCALES.map((scale) => (
              <div key={scale.key}>
                <p className="text-[16px] text-label leading-snug mb-1.5">
                  {scale.key === "commune" && address.city ? `${scale.title} : ${address.city}` : scale.title}
                </p>
                <p className="text-[14px] text-muted leading-relaxed">{scale.body}</p>

                {scale.key === "logement" && (
                  <ul
                    className="list-none p-0 mt-3.5"
                    style={{ display: "grid", gap: 9 }}
                  >
                    <MatterLine label="Diagnostic énergétique" state={outcome.matter.dpe} />
                    <MatterLine label="Parcelle cadastrale" state={outcome.matter.parcel} />
                  </ul>
                )}
              </div>
            ))}
          </div>

          {/* CE QUE CETTE ADRESSE PERMETTRA DE LIRE. Les lignes ci-dessus nomment la MATIÈRE ; ce
              bloc en dit la CONSÉQUENCE, et ce n'est pas la même chose. « Diagnostic énergétique :
              aucun à cette adresse » est un fait technique ; « ce dossier ne pourra pas qualifier
              la performance énergétique de ce logement » est une décision d'achat. Le manque se
              lit AVANT ce qui reste : l'ordre inverse minimiserait le manque. 75 à 86 % des
              adresses sont dans ce cas (mesure du 31/07/2026). */}
          {(() => {
            const cov = expectedCoverage(outcome.matter);
            return (
              <div className="mt-7 rounded-xl border border-[var(--border-2)] bg-[var(--bg-elev)] px-5 py-4">
                <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-ghost mb-2.5">
                  Ce que cette adresse permettra de lire
                </p>
                {cov.manque && (
                  <p className="text-[length:var(--text-dense)] text-label leading-relaxed mb-2.5">{cov.manque}</p>
                )}
                <p className="text-[14px] text-muted leading-relaxed">{cov.reste}</p>
              </div>
            );
          })()}

          <div
            className="mt-8 pt-7"
            style={{ borderTop: "1px solid var(--border-1)" }}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 18,
              }}
            >
              <div>
                <p
                  className="text-[26px] text-label leading-none mb-2"
                  style={{ fontFamily: "var(--font-serif)" }}
                >
                  {EUR(outcome.quote.amountDueCents)}
                </p>
                {outcome.quote.status === "provisional" && (
                  <p className="text-[13px] text-ghost">
                    14 € de moins si vous avez déjà la lecture de cette commune.
                  </p>
                )}
                {outcome.quote.status === "final" &&
                  (outcome.quote.territoryDeductionCents ?? 0) > 0 && (
                    <p className="text-[13px] text-ghost">
                      Vous avez déjà la lecture de {address.city}, 14 € sont déduits.
                    </p>
                  )}
                {outcome.quote.status === "final" &&
                  (outcome.quote.territoryDeductionCents ?? 0) === 0 && (
                    <p className="text-[13px] text-ghost">
                      Une fois, pour ce bien. TVA non applicable, art. 293 B du CGI.
                    </p>
                  )}
              </div>

              <a
                href={`/checkout/dossier?banId=${encodeURIComponent(address.id!)}&label=${encodeURIComponent(address.label)}&insee=${encodeURIComponent(address.citycode!)}`}
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg bg-accent/[0.14] text-accent text-[length:var(--text-dense)] no-underline border border-accent/[0.28]"
                onClick={() =>
                  posthog.capture("address_checkout_viewed", {
                    insee: address.citycode,
                    amount_due_cents: outcome.quote.amountDueCents,
                  })
                }
              >
                Créer mon dossier
              </a>
            </div>
          </div>
        </div>
      )}

      {outcome?.status === "needs_precision" && (
        <div className="card-answer rounded-2xl p-7 md:p-9 mt-8">
          <p className="text-[17px] text-label leading-snug mb-2">
            Nous n&apos;avons pas encore identifié le bien avec assez de précision.
          </p>
          <p className="text-[14px] text-muted leading-relaxed mb-6">
            {outcome.candidates.length > 0
              ? "Cette adresse désigne une voie. Voici les adresses numérotées les plus proches."
              : "Saisissez une adresse précise dans cette commune, avec son numéro."}
          </p>

          {outcome.candidates.length > 0 && (
            <div style={{ display: "grid", gap: 10 }}>
              {outcome.candidates.map((c) => (
                <button
                  key={c.banId}
                  type="button"
                  className="text-left px-5 py-3.5 rounded-lg bg-[var(--bg-elev-2)] text-label text-[14px] border border-[var(--border-1)] cursor-pointer"
                  onClick={() =>
                    qualify({
                      id: c.banId,
                      label: c.label,
                      city: c.city ?? address?.city ?? null,
                      citycode: address?.citycode ?? null,
                      postcode: c.postcode ?? address?.postcode ?? null,
                      type: "housenumber",
                      // LES COORDONNÉES DU CANDIDAT, jamais celles de la feature grossière.
                      // Reprendre le point de la voie sonderait le cadastre au centroïde tout en
                      // affichant l'adresse d'un numéro précis.
                      latitude: c.latitude,
                      longitude: c.longitude,
                    })
                  }
                >
                  {c.label}
                  <span className="font-mono text-[11px] tracking-[0.06em] text-ghost">
                    {" "}
                    · à {Math.round(c.distanceM)} m
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {outcome?.status === "unsupported_at_launch" && address && (
        <div className="card-answer rounded-2xl p-7 md:p-9 mt-8">
          <p className="text-[17px] text-label leading-snug mb-3">
            Nous ne pouvons pas encore identifier ce bien assez précisément.
          </p>
          <p className="text-[14px] text-muted leading-relaxed mb-6">
            Cette adresse ne porte pas de point de bâtiment fiable. Pour éviter d&apos;analyser la
            mauvaise parcelle ou de mesurer les alentours depuis un point approximatif, nous
            préférons ne pas vous vendre ce dossier.
          </p>
          {/* Offert comme une INFORMATION, jamais comme le bouton dominant : un refus qui débouche
              sur une vente mise en avant devient une technique commerciale, et il perd exactement
              ce qui le rendait crédible. */}
          {address.citycode && (
            <a
              href={`/territoire/${address.citycode}`}
              className="text-[14px] text-muted underline"
              onClick={() =>
                posthog.capture("address_qualification_exit", { choice: "territory_14" })
              }
            >
              Lire ce que devient {address.city ?? "cette commune"}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
