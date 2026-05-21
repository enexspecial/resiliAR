import { useRef, useState } from "react";
import { triageChat } from "../lib/api";
import type { TriageMessage } from "../types";
import { UI_TOOLTIPS } from "../lib/tooltips";
import { FallbackChain } from "./FallbackChain";
import { InfoTip } from "./ui/InfoTip";
import { LoadingSpinner } from "./ui/LoadingSpinner";
import { Tooltip } from "./ui/Tooltip";

const QUICK_PROMPTS = [
  "What SPF fits my routine?",
  "Can I combine these products?",
  "When should I see a doctor?",
];

interface Props {
  skinContext?: Record<string, unknown> | null;
}

export function TelePharmacy({ skinContext }: Props) {
  const [messages, setMessages] = useState<TriageMessage[]>([
    {
      role: "assistant",
      content: skinContext
        ? "Hi! I've reviewed your skin scan — ask me anything about your routine or OTC products."
        : "Hi! I'm your beauty care assistant. Ask about skin care or products — start with a scan on Home for personalized answers.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastChain, setLastChain] = useState<string[]>([]);
  const [lastSource, setLastSource] = useState<string>();
  const bottomRef = useRef<HTMLDivElement>(null);

  const send = async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || loading) return;

    const userMsg: TriageMessage = { role: "user", content: text };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setLoading(true);

    try {
      const res = await triageChat(
        text,
        history.filter((m) => m.role === "user" || m.role === "assistant"),
        skinContext ?? null
      );
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.reply,
          source: res.source,
          fallback_chain: res.fallback_chain,
        },
      ]);
      setLastChain(res.fallback_chain);
      setLastSource(res.source);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "You're offline — gentle cleanser, SPF 30+, and moisturizer are a safe baseline. See a clinic if symptoms worsen.",
          source: "offline_cache",
        },
      ]);
      setLastSource("offline_cache");
      setLastChain(["network: failed", "fallback: offline"]);
    } finally {
      setLoading(false);
      setTimeout(
        () => bottomRef.current?.scrollIntoView({ behavior: "smooth" }),
        50
      );
    }
  };

  return (
    <div className="chat-panel">
      <div className="page-intro">
        <div className="page-intro__row">
          <div>
            <h2>Care assistant</h2>
            <p>Friendly guidance on products and everyday skin questions.</p>
          </div>
          <InfoTip
            content={UI_TOOLTIPS.careAssistant}
            wide
            label="About care assistant"
          />
        </div>
      </div>

      {skinContext && (
        <div className="chat-banner">
          ✓ Personalized to your scan
          {typeof skinContext.overall_score === "number" && (
            <> · Score {String(skinContext.overall_score)}</>
          )}
        </div>
      )}

      {!skinContext && (
        <div className="alert alert--info">
          Tip: complete a skin scan on Home for answers tailored to you.
        </div>
      )}

      <div className="chat-suggestions">
        {QUICK_PROMPTS.map((q) => (
          <Tooltip key={q} content="Tap to send this question" position="top">
            <button type="button" onClick={() => send(q)}>
              {q}
            </button>
          </Tooltip>
        ))}
      </div>

      <div className="chat-window">
        {messages.map((m, i) => (
          <div key={`${m.role}-${i}`} className={`chat-bubble ${m.role}`}>
            <p>{m.content}</p>
            {m.source && m.role === "assistant" && (
              <span className="bubble-meta">{m.source.replace(/_/g, " ")}</span>
            )}
          </div>
        ))}
        {loading && <LoadingSpinner label="Thinking…" />}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-bar">
        <input
          type="text"
          placeholder="Ask about your skin or products…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          aria-label="Message"
        />
        <button
          type="button"
          className="btn btn--primary btn--sm"
          onClick={() => send()}
          disabled={loading || !input.trim()}
        >
          Send
        </button>
      </div>

      <FallbackChain chain={lastChain} source={lastSource} />
    </div>
  );
}
