import { useRef, useState } from "react";
import { triageChat } from "../lib/api";
import type { SkinAnalyzeResponse, TriageMessage } from "../types";
import { FallbackChain } from "./FallbackChain";

interface Props {
  skinContext?: SkinAnalyzeResponse | null;
}

export function TelePharmacy({ skinContext }: Props) {
  const [messages, setMessages] = useState<TriageMessage[]>([
    {
      role: "assistant",
      content:
        "Hello! I'm your ResiliAR tele-pharmacy assistant. Ask about skin concerns or OTC products — I route through TrueFoundry's AI Gateway with automatic fallbacks.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastChain, setLastChain] = useState<string[]>([]);
  const [lastSource, setLastSource] = useState<string>();
  const bottomRef = useRef<HTMLDivElement>(null);

  const send = async () => {
    const text = input.trim();
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
        skinContext?.analysis ?? null
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
            "Connection lost — here's cached guidance: gentle cleanser, SPF, moisturizer. See a clinic if symptoms worsen.",
          source: "offline_cache",
        },
      ]);
      setLastSource("offline_cache");
      setLastChain(["network: failed", "fallback: offline cached triage"]);
    } finally {
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  };

  return (
    <section className="feature-panel triage-panel">
      <header>
        <h2>Tele-Pharmacy Triage</h2>
        <p>
          Multi-LLM agent via TrueFoundry — Claude → GPT-4o → Gemini → offline
          cache.
        </p>
      </header>

      <div className="chat-window">
        {messages.map((m, i) => (
          <div key={`${m.role}-${i}`} className={`chat-bubble ${m.role}`}>
            <p>{m.content}</p>
            {m.source && (
              <span className="bubble-source">{m.source.replace(/_/g, " ")}</span>
            )}
          </div>
        ))}
        {loading && <p className="status">Routing through AI Gateway…</p>}
        <div ref={bottomRef} />
      </div>

      <div className="chat-input-row">
        <input
          type="text"
          placeholder="e.g. What OTC cream helps mild acne in humid climates?"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button type="button" className="btn primary" onClick={send} disabled={loading}>
          Send
        </button>
      </div>

      <FallbackChain chain={lastChain} source={lastSource} />
    </section>
  );
}
