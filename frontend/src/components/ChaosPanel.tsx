import { useState } from "react";
import { setChaos } from "../lib/api";
import { UI_TOOLTIPS } from "../lib/tooltips";
import type { ChaosState } from "../types";
import { InfoTip } from "./ui/InfoTip";

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
          <h3 className="label-with-tip">
            Resilience demo
            <InfoTip
              content={UI_TOOLTIPS.resilienceDemo}
              wide
              label="About resilience demo"
            />
          </h3>
          <p>Simulate API failures for live judging</p>
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
            ? "Restore normal mode"
            : "Simulate network failure"}
      </button>
      {chaos.enabled && (
        <ul className="chaos-status">
          <li>Beauty AI → offline backup</li>
          <li>Care chat → backup assistant</li>
        </ul>
      )}
    </aside>
  );
}
