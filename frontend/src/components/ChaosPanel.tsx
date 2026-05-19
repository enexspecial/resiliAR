import { useState } from "react";
import { setChaos } from "../lib/api";
import type { ChaosState } from "../types";

interface Props {
  chaos: ChaosState;
  onChange: (c: ChaosState) => void;
}

export function ChaosPanel({ chaos, onChange }: Props) {
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    try {
      const next = await setChaos(!chaos.enabled);
      onChange(next);
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside className={`chaos-panel ${chaos.enabled ? "active" : ""}`}>
      <div className="chaos-header">
        <span className="chaos-icon" aria-hidden>
          ⚡
        </span>
        <div>
          <h3>Chaos Mode</h3>
          <p>For judges: simulate API & LLM failures live</p>
        </div>
      </div>
      <button
        type="button"
        className={`btn chaos-btn ${chaos.enabled ? "danger" : "warning"}`}
        onClick={toggle}
        disabled={loading}
      >
        {loading
          ? "Switching…"
          : chaos.enabled
            ? "Restore primary APIs"
            : "Kill primary API"}
      </button>
      {chaos.enabled && (
        <ul className="chaos-status">
          <li>Perfect Corp: blocked → offline cache</li>
          <li>Primary LLM: blocked → gateway fallback</li>
        </ul>
      )}
    </aside>
  );
}
