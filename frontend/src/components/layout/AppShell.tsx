import { useState, type ReactNode } from "react";
import { NAV_TOOLTIPS, UI_TOOLTIPS } from "../../lib/tooltips";
import { ChaosPanel } from "../ChaosPanel";
import {
  IconChat,
  IconHome,
  IconScan,
  IconSettings,
  IconShirt,
} from "../ui/Icons";
import { Tooltip } from "../ui/Tooltip";
import type { ChaosState, TabId } from "../../types";

const NAV: { id: TabId; label: string; Icon: typeof IconHome }[] = [
  { id: "journey", label: "Home", Icon: IconHome },
  { id: "skin", label: "Scan", Icon: IconScan },
  { id: "fashion", label: "Style", Icon: IconShirt },
  { id: "triage", label: "Care", Icon: IconChat },
];

interface Props {
  tab: TabId;
  onTabChange: (tab: TabId) => void;
  chaos: ChaosState;
  onChaosChange: (c: ChaosState) => void;
  skinScore?: number | null;
  children: ReactNode;
}

export function AppShell({
  tab,
  onTabChange,
  chaos,
  onChaosChange,
  skinScore,
  children,
}: Props) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__brand">
          <span className="app-logo" aria-hidden>
            R
          </span>
          <div>
            <h1 className="app-title">ResiliAR</h1>
            <p className="app-subtitle">Beauty that works anywhere</p>
          </div>
        </div>
        <div className="app-header__actions">
          {skinScore != null && (
            <Tooltip content={UI_TOOLTIPS.skinScore} position="bottom">
              <span className="score-pill score-pill--tip">
                Score <strong>{skinScore}</strong>
              </span>
            </Tooltip>
          )}
          <Tooltip content={UI_TOOLTIPS.settings} position="bottom">
            <button
              type="button"
              className="icon-btn"
              aria-label="Settings"
              onClick={() => setSettingsOpen(true)}
            >
              <IconSettings className="icon-btn__svg" />
            </button>
          </Tooltip>
        </div>
      </header>

      <main className="app-main">{children}</main>

      <nav className="bottom-nav" aria-label="Main">
        {NAV.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            className={`bottom-nav__item ${tab === id ? "active" : ""}`}
            onClick={() => onTabChange(id)}
            title={NAV_TOOLTIPS[id]}
            aria-label={`${label}. ${NAV_TOOLTIPS[id]}`}
          >
            <Icon className="bottom-nav__icon" />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {settingsOpen && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-title"
          onClick={() => setSettingsOpen(false)}
        >
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="modal-sheet__head">
              <h2 id="settings-title">Settings</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setSettingsOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <p className="modal-sheet__hint">
              Demo tools for hackathon judges — simulates bad network or API
              outages.
            </p>
            <ChaosPanel chaos={chaos} onChange={onChaosChange} />
          </div>
        </div>
      )}
    </div>
  );
}
