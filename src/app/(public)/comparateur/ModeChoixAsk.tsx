"use client";

import { useCallback, useState } from "react";
import posthog from "posthog-js";
import { bindOrphans } from "@/lib/typography";

// AskFuture en MODE CHOIX : réutilise l'endpoint borné de /ou-vivre
// (`/api/comparateur-vie/ask`, 2 questions gratuites via cookie serveur partagé). Le contexte
// est construit ici depuis les communes NOMMÉES (pas de projet/préférences) : on passe une
// reformulation qui dit au LLM que le lecteur les a choisies, et le qualitatif scellé de chaque
// commune (firewall préservé : aucun score, aucun chiffre brut). Suggestions propres au départage.

type AskCommune = {
  insee: string;
  nom: string;
  identite: string;
  compromis: string;
  distinctive: string | null;
  signaux: Record<string, string>;
  logement: string | null;
  littoral: string | null;
  heritageIndustriel: string | null;
};

type AskMessage = { role: "user" | "assistant"; content: string };

const FREE_ASK = 2;

function distinctId(): string {
  try {
    return posthog.get_distinct_id?.() ?? "anon";
  } catch {
    return "anon";
  }
}

export function ModeChoixAsk({ trio }: { trio: AskCommune[] }) {
  const [messages, setMessages] = useState<AskMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState(FREE_ASK);
  const [limit, setLimit] = useState(false);

  const noms = trio.map((t) => t.nom);
  const c1 = noms[1];
  const litt = trio.find((t) => t.littoral)?.nom;

  // Suggestions de départage : comparatives / risque / horizon, templatées sur les communes.
  const chips: string[] = (() => {
    const out: string[] = [];
    if (c1) out.push("Pour un achat sur 20 ans, laquelle est le pari le plus sûr ?");
    out.push("Laquelle vieillira le mieux face au climat de 2050 ?");
    if (litt) out.push(`L'érosion du littoral est-elle un sujet à ${litt} ?`);
    else out.push("Laquelle reste la plus vivable pendant les canicules ?");
    return out.slice(0, 3);
  })();

  const sendAsk = useCallback(
    async (preset?: string) => {
      const question = (preset ?? input).trim();
      if (question.length < 3 || loading || limit) return;

      const userMsg: AskMessage = { role: "user", content: question };
      const history = messages.slice(-6);
      setMessages((m) => [...m, userMsg]);
      setInput("");
      setLoading(true);

      try {
        const res = await fetch("/api/comparateur-vie/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question,
            context: {
              // Cadre le LLM : ce ne sont pas des territoires PROPOSÉS, le lecteur les a nommés.
              reformulation: `Le lecteur compare des communes qu'il a lui-même nommées : ${
                noms.length > 1 ? `${noms.slice(0, -1).join(", ")} et ${noms[noms.length - 1]}` : noms[0]
              }. Il cherche à les départager.`,
              criteres: [],
              perimetre: [],
              orientation: [],
              synthese: "",
              aucun_territoire_parfait: false,
              territoires: trio.map((r, i) => ({
                rang: i + 1,
                nom: r.nom,
                region: null,
                raisons: [],
                compromis: r.compromis,
                pression_eco: null,
                logement: r.logement,
                littoral: r.littoral,
                distinctive: r.distinctive,
                signaux: r.signaux,
                heritage_industriel: r.heritageIndustriel ?? null,
              })),
            },
            focus: null,
            history,
            distinctId: distinctId(),
          }),
        });

        if (res.status === 402) {
          setLimit(true);
          setMessages((m) => m.slice(0, -1)); // retire la question non répondue
          setInput(question);
          return;
        }

        const data = await res.json();
        if (!res.ok || typeof data.answer !== "string") throw new Error(data.error ?? "ask");

        setMessages((m) => [...m, { role: "assistant", content: data.answer }]);
        setRemaining(typeof data.remaining === "number" ? data.remaining : Math.max(0, remaining - 1));
      } catch {
        setMessages((m) => [
          ...m,
          { role: "assistant", content: "Cette réponse n'a pas pu être générée. Réessayez dans un instant." },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [input, loading, limit, messages, noms, trio, remaining],
  );

  return (
    <section className="mt-12">
      <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-accent mb-2">Une question sur ces communes ?</p>
      <h2 className="font-normal text-[24px] text-label mb-1.5" style={{ fontFamily: "var(--font-serif)" }}>
        Demandez à futur•e
      </h2>
      <p className={`text-[length:var(--text-body)] text-muted leading-[1.65] ${remaining > 0 ? "mb-1.5" : "mb-5"}`}>
        {remaining > 0
          ? bindOrphans("Posez une question pour départager vos communes : un risque, un compromis, leur évolution future.")
          : bindOrphans("Pour aller plus loin, débloquez la comparaison complète.")}
      </p>
      {remaining > 0 && (
        <p className="text-[12px] text-ghost mb-5">
          {remaining} question{remaining > 1 ? "s" : ""} {remaining > 1 ? "gratuites" : "gratuite"}.
        </p>
      )}

      {!limit && chips.length > 0 && messages.length === 0 && (
        <div className="flex flex-nowrap gap-2 mb-5 overflow-x-auto">
          {chips.map((q) => (
            <button
              key={q}
              onClick={() => sendAsk(q)}
              disabled={loading}
              className="shrink-0 whitespace-nowrap text-left text-[14px] leading-snug text-muted hover:text-label border border-[var(--border-2)] hover:border-accent/[0.4] rounded-full px-3.5 py-1.5 transition-colors disabled:opacity-40"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {messages.length > 0 && (
        <div className="flex flex-col gap-3 mb-5">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={
                m.role === "user"
                  ? "self-end max-w-[85%] rounded-xl bg-accent/[0.1] border border-accent/[0.18] px-4 py-2.5 text-[length:var(--text-body)] text-label"
                  : "self-start max-w-[92%] rounded-xl bg-[var(--bg-elev)] border border-[var(--border-1)] px-4 py-3 text-[length:var(--text-body)] leading-[1.7] text-label"
              }
            >
              {m.content}
            </div>
          ))}
          {loading && (
            <div className="self-start flex items-center gap-2 text-ghost text-[length:var(--text-dense)]">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              futur•e réfléchit…
            </div>
          )}
        </div>
      )}

      {limit ? (
        <div className="rounded-xl border border-accent/[0.25] bg-accent/[0.05] px-5 py-4">
          <p className="text-[length:var(--text-body)] leading-[1.6] text-label">
            {bindOrphans(`Vous avez utilisé vos ${FREE_ASK} questions gratuites. La comparaison complète prend le relais pour passer d'une intuition à une décision éclairée.`)}
          </p>
        </div>
      ) : (
        <div className="flex items-end gap-2.5">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendAsk();
              }
            }}
            rows={1}
            placeholder="Posez votre question sur ces communes…"
            className="flex-1 resize-none bg-[var(--bg-elev)] border border-[var(--border-2)] rounded-lg px-4 py-3 text-[length:var(--text-body)] text-label placeholder:text-ghost outline-none focus:border-accent/[0.4]"
            style={{ fontFamily: "var(--font-sans)" }}
          />
          <button
            onClick={() => sendAsk()}
            disabled={loading || input.trim().length < 3}
            className="shrink-0 px-5 py-3 rounded-lg bg-accent text-canvas font-semibold text-[length:var(--text-dense)] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Demander
          </button>
        </div>
      )}
    </section>
  );
}
