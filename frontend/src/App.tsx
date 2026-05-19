import { useEffect, useState } from "react";
import { ChaosPanel } from "./components/ChaosPanel";
import { FashionTryOn } from "./components/FashionTryOn";
import { SkinAdvisor } from "./components/SkinAdvisor";
import { TelePharmacy } from "./components/TelePharmacy";
import { getChaos } from "./lib/api";
import type { ChaosState, SkinAnalyzeResponse, TabId } from "./types";

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "skin", label: "Skin Health", icon: "✨" },
  { id: "fashion", label: "Fashion Try-On", icon: "👗" },
  { id: "triage", label: "Tele-Pharmacy", icon: "💊" },
];

export default function App() {
  const [tab, setTab] = useState<TabId>("skin");
  const [chaos, setChaos] = useState<ChaosState>({
    enabled: false,
    kill_perfect_corp: false,
    kill_primary_llm: false,
  });
  const [skinContext, setSkinContext] = useState<SkinAnalyzeResponse | null>(
    null
  );

  useEffect(() => {
    getChaos().then(setChaos).catch(() => {});
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return (
    <div className="app">
      <header className="site-header">
        <div className="brand">
          <span className="logo">R</span>
          <div>
            <h1>ResiliAR</h1>
            <p>Resilient AI commerce for emerging markets</p>
          </div>
        </div>
        <p className="tagline">
          Built for Lagos with 2G — skin analysis, AR try-on & tele-pharmacy
          that keep working when APIs fail.
        </p>
      </header>

      <ChaosPanel chaos={chaos} onChange={setChaos} />

      <nav className="tabs" aria-label="Features">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={tab === t.id ? "active" : ""}
            onClick={() => setTab(t.id)}
          >
            <span aria-hidden>{t.icon}</span> {t.label}
          </button>
        ))}
      </nav>

      <main>
        {tab === "skin" && (
          <SkinAdvisor onAnalysis={setSkinContext} />
        )}
        {tab === "fashion" && <FashionTryOn />}
        {tab === "triage" && <TelePharmacy skinContext={skinContext} />}
      </main>

      <footer>
        <p>
          DevNetwork AI+ML Hackathon 2026 · Perfect Corp + TrueFoundry ·{" "}
          <em>Chaos mode ready for live judging</em>
        </p>
      </footer>
    </div>
  );
}
