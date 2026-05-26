"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import "./ask-future.css";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type ProfileQuestion = {
  field: string;
  contextualization: string;
  question: string;
  options: string[];
};

type AskResponse = {
  answer: string;
  outOfScope: boolean;
  profileQuestion: ProfileQuestion | null;
  error?: string;
};

interface AskFutureProps {
  communeInsee: string;
  communeName: string;
  placeholder?: string;
}

export function AskFuture({ communeInsee, communeName, placeholder }: AskFutureProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [profileQuestion, setProfileQuestion] = useState<ProfileQuestion | null>(null);
  const [profileSavingOption, setProfileSavingOption] = useState<string | null>(null);
  const [sessionId] = useState(
    () => `session_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const warmedRef = useRef(false);

  // Scroll vers le bas à chaque nouveau message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, profileQuestion, loading]);

  // Focus l'input à l'ouverture + pré-warm du contexte territorial (fire-and-forget).
  // Au premier open de la session, déclenche le pré-fetch ADEME + DRIAS + Hub'Eau
  // pour que la première vraie question bénéficie déjà du cache framework.
  useEffect(() => {
    if (!isOpen) return;
    inputRef.current?.focus();
    if (warmedRef.current) return;
    warmedRef.current = true;
    fetch(`/api/ask/context?insee=${encodeURIComponent(communeInsee)}`, {
      method: "GET",
      credentials: "same-origin",
    }).catch(() => {
      // Pré-warm silencieux : si ça échoue, la vraie POST refera les fetches.
      warmedRef.current = false;
    });
  }, [isOpen, communeInsee]);

  // Raccourcis clavier : ⌘K pour ouvrir, Esc pour fermer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const sendMessage = useCallback(
    async (userMessage: string) => {
      const trimmed = userMessage.trim();
      if (!trimmed || loading) return;

      const nextMessages: Message[] = [...messages, { role: "user", content: trimmed }];
      setMessages(nextMessages);
      setInput("");
      setLoading(true);
      setProfileQuestion(null);

      try {
        const response = await fetch("/api/ask", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: nextMessages,
            communeInsee,
            communeName,
            sessionId,
          }),
        });

        const data = (await response.json()) as AskResponse;

        if (!response.ok || data.error) {
          throw new Error(data.error ?? "Erreur réseau.");
        }

        setMessages((prev) => [...prev, { role: "assistant", content: data.answer }]);
        if (data.profileQuestion) {
          setProfileQuestion(data.profileQuestion);
        }
      } catch (error) {
        console.error("[AskFuture] sendMessage:", error);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "Une erreur est survenue. Vous pouvez reformuler votre question.",
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [messages, loading, communeInsee, communeName, sessionId],
  );

  const handleProfileAnswer = async (answer: string) => {
    if (!profileQuestion || profileSavingOption) return;
    setProfileSavingOption(answer);

    try {
      await fetch("/api/ask", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field: profileQuestion.field,
          value: answer,
        }),
      });
    } catch (error) {
      console.error("[AskFuture] PATCH:", error);
    }

    // Inscrire la réponse comme un message utilisateur pour garder l'historique,
    // et déclencher une nouvelle requête pour que Claude poursuive avec
    // l'info nouvellement connue.
    const echo = `${profileQuestion.question} ${answer}`;
    setProfileQuestion(null);
    setProfileSavingOption(null);
    await sendMessage(echo);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void sendMessage(input);
  };

  return (
    <div className="ask-future-container" data-open={isOpen ? "true" : "false"}>
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="ask-trigger"
          aria-label={`Poser une question sur ${communeName}`}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M11 11L14.5 14.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <span>Une question sur {communeName} ?</span>
          <kbd>⌘K</kbd>
        </button>
      )}

      {isOpen && (
        <div className="ask-panel" role="dialog" aria-label="AskFuture">
          <div className="ask-header">
            <div className="ask-header-left">
              <div className="ask-dot" aria-hidden="true" />
              <span className="ask-commune">{communeName}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="ask-close"
              aria-label="Fermer"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path
                  d="M1 1L13 13M13 1L1 13"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          <div className="ask-messages">
            {messages.length === 0 && (
              <div className="ask-empty">
                <p className="ask-empty-title">Posez votre question sur {communeName}.</p>
                <p className="ask-empty-hint">
                  Exemples : « Est-ce risqué d&apos;acheter ici ? » · « Quelle sera la qualité de l&apos;air dans 20 ans ? » · « Mon logement est-il bien situé ? »
                </p>
              </div>
            )}

            {messages.map((message, i) => (
              <div key={i} className={`ask-message ask-message--${message.role}`}>
                <div className="ask-message-content">
                  {message.content.split("\n").map((line, j) =>
                    line.length > 0 ? (
                      <p key={j}>{line}</p>
                    ) : (
                      <p key={j} className="ask-message-break" />
                    ),
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="ask-message ask-message--assistant">
                <div className="ask-loading" aria-label="Chargement">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}

            {profileQuestion && !loading && (
              <div className="ask-profile-question" role="group">
                <p className="ask-profile-question-why">
                  {profileQuestion.contextualization}
                </p>
                <p className="ask-profile-question-text">{profileQuestion.question}</p>
                <div className="ask-profile-quick-answers">
                  {profileQuestion.options.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleProfileAnswer(option)}
                      className="ask-profile-answer-btn"
                      disabled={profileSavingOption !== null}
                      data-saving={profileSavingOption === option ? "true" : undefined}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="ask-form">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={placeholder ?? "Votre question sur ce territoire…"}
              className="ask-input"
              disabled={loading}
              autoComplete="off"
              aria-label="Question"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="ask-submit"
              aria-label="Envoyer"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M2 8L14 8M9 3L14 8L9 13"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </form>

          <div className="ask-footer">
            Données DRIAS · Géorisques · ANSES · INSEE · Hub&apos;Eau · ATMO
          </div>
        </div>
      )}
    </div>
  );
}
