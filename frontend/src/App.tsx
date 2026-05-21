import { useEffect, useState } from "react";
import { AppShell } from "./components/layout/AppShell";
import { FashionTryOn } from "./components/FashionTryOn";
import { RetailJourney } from "./components/RetailJourney";
import { SkinAdvisor } from "./components/SkinAdvisor";
import { TelePharmacy } from "./components/TelePharmacy";
import { getChaos, loadCachedSkin } from "./lib/api";
import type { ChaosState, SkinAnalyzeResponse, TabId } from "./types";

export default function App() {
  const [tab, setTab] = useState<TabId>("journey");
  const [chaos, setChaos] = useState<ChaosState>({
    enabled: false,
    kill_perfect_corp: false,
    kill_primary_llm: false,
  });
  const [skinContext, setSkinContext] = useState<SkinAnalyzeResponse | null>(
    () => loadCachedSkin()
  );
  const [suggestedGarmentId, setSuggestedGarmentId] = useState(
    () => loadCachedSkin()?.journey?.suggested_garment_id ?? "dress-01"
  );

  useEffect(() => {
    getChaos().then(setChaos).catch(() => {});
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  const handleAnalysis = (data: SkinAnalyzeResponse) => {
    setSkinContext(data);
    if (data.journey?.suggested_garment_id) {
      setSuggestedGarmentId(data.journey.suggested_garment_id);
    }
  };

  const triageContext = skinContext
    ? {
        ...skinContext.analysis,
        recommendations: skinContext.recommendations,
        overall_score: skinContext.analysis.overall_score,
      }
    : null;

  return (
    <AppShell
      tab={tab}
      onTabChange={setTab}
      chaos={chaos}
      onChaosChange={setChaos}
      skinScore={skinContext?.analysis.overall_score ?? null}
    >
      {tab === "journey" && (
        <RetailJourney
          onAnalysis={handleAnalysis}
          onGarmentSuggestion={setSuggestedGarmentId}
          onGoToTab={setTab}
        />
      )}
      {tab === "skin" && <SkinAdvisor onAnalysis={handleAnalysis} />}
      {tab === "fashion" && (
        <FashionTryOn initialGarmentId={suggestedGarmentId} preferLive />
      )}
      {tab === "triage" && <TelePharmacy skinContext={triageContext} />}
    </AppShell>
  );
}
