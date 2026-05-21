import { useCallback, useEffect, useState } from "react";
import {
  analyzeSkin,
  buildShareSummary,
  cacheSkinAnalysis,
  fetchJourneyPlan,
  fashionTryOnLive,
  getJourneyRegions,
  loadCachedSkin,
  loadSavedRoutine,
  saveRoutine,
} from "../lib/api";
import type {
  JourneyPlan,
  RegionOption,
  SkinAnalyzeResponse,
  TabId,
} from "../types";
import { STEP_TOOLTIPS, UI_TOOLTIPS } from "../lib/tooltips";
import { StepIndicator } from "./layout/StepIndicator";
import { CameraCapture } from "./CameraCapture";
import { FallbackChain } from "./FallbackChain";
import { InfoTip } from "./ui/InfoTip";
import { LoadingSpinner } from "./ui/LoadingSpinner";

type JourneyUiStep = "scan" | "routine" | "tryon" | "save";

interface Props {
  onAnalysis: (data: SkinAnalyzeResponse) => void;
  onGarmentSuggestion: (garmentId: string) => void;
  onGoToTab: (tab: TabId) => void;
}

const STEP_META: Record<JourneyUiStep, { title: string; subtitle: string }> = {
  scan: {
    title: "Scan your skin",
    subtitle: "Get a personalized score and product routine in seconds.",
  },
  routine: {
    title: "Your daily routine",
    subtitle: "Morning and evening picks matched to your skin.",
  },
  tryon: {
    title: "Try it on",
    subtitle: "See how our suggested outfit looks on you before you buy.",
  },
  save: {
    title: "You're all set",
    subtitle: "Save your routine, share it, or ask our care assistant.",
  },
};

export function RetailJourney({
  onAnalysis,
  onGarmentSuggestion,
  onGoToTab,
}: Props) {
  const [step, setStep] = useState<JourneyUiStep>("scan");
  const [regions, setRegions] = useState<RegionOption[]>([]);
  const [region, setRegion] = useState("pan-africa");
  const [scan, setScan] = useState<SkinAnalyzeResponse | null>(() =>
    loadCachedSkin()
  );
  const [plan, setPlan] = useState<JourneyPlan | null>(
    () => loadCachedSkin()?.journey ?? null
  );
  const [preview, setPreview] = useState<string | null>(null);
  const [tryonPreview, setTryonPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tryonResult, setTryonResult] = useState<{
    source: string;
    chain: string[];
  } | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(
    () => (loadSavedRoutine() ? "Your routine is saved on this device." : null)
  );

  useEffect(() => {
    getJourneyRegions().then(setRegions).catch(() => {
      setRegions([
        { id: "pan-africa", label: "Pan-Africa" },
        { id: "west-africa", label: "West Africa" },
        { id: "south-asia", label: "South Asia" },
        { id: "latin-america", label: "Latin America" },
      ]);
    });
  }, []);

  const refreshPlan = useCallback(
    async (data: SkinAnalyzeResponse, reg: string) => {
      const journey =
        data.journey ??
        (await fetchJourneyPlan(
          data.analysis.conditions,
          data.recommendations,
          reg
        ));
      setPlan(journey);
      onGarmentSuggestion(journey.suggested_garment_id);
      return journey;
    },
    [onGarmentSuggestion]
  );

  const runScan = async (file: File) => {
    setPreview(URL.createObjectURL(file));
    setLoading(true);
    setError(null);
    try {
      const data = await analyzeSkin(file);
      setScan(data);
      cacheSkinAnalysis(data);
      onAnalysis(data);
      await refreshPlan(data, region);
      setStep("routine");
    } catch (e) {
      const cached = loadCachedSkin();
      if (cached) {
        setScan(cached);
        onAnalysis(cached);
        await refreshPlan(cached, region).catch(() => null);
        setStep("routine");
        setError("You're offline — showing your last scan.");
      } else {
        setError(e instanceof Error ? e.message : "Scan failed. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const onRegionChange = async (reg: string) => {
    setRegion(reg);
    if (!scan) return;
    setLoading(true);
    try {
      const journey = await fetchJourneyPlan(
        scan.analysis.conditions,
        scan.recommendations,
        reg
      );
      setPlan(journey);
      onGarmentSuggestion(journey.suggested_garment_id);
    } finally {
      setLoading(false);
    }
  };

  const runTryOn = async (file: File) => {
    if (!plan) return;
    setLoading(true);
    setError(null);
    setTryonResult(null);
    try {
      const data = await fashionTryOnLive(file, plan.suggested_garment_id);
      const url = data.result.preview_url;
      if (url) setTryonPreview(url);
      setTryonResult({ source: data.source, chain: data.fallback_chain });
      setStep("save");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Try-on failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!scan || !plan) return;
    saveRoutine({
      saved_at: new Date().toISOString(),
      region,
      analysis: scan.analysis,
      products: plan.products,
      routine: plan.routine,
      suggested_garment_id: plan.suggested_garment_id,
    });
    setSavedMsg("Your routine is saved on this device.");
  };

  const handleShare = async () => {
    if (!scan || !plan) return;
    const text = buildShareSummary(scan, plan);
    if (navigator.share) {
      try {
        await navigator.share({ title: "My ResiliAR routine", text });
        return;
      } catch {
        /* clipboard */
      }
    }
    await navigator.clipboard.writeText(text);
    setSavedMsg("Copied to clipboard — paste anywhere to share.");
  };

  const stepOrder: JourneyUiStep[] = ["scan", "routine", "tryon", "save"];
  const stepLabels = ["Scan", "Routine", "Try-on", "Done"];
  const currentIdx = stepOrder.indexOf(step);

  const indicatorSteps = stepOrder.map((id, i) => ({
    id,
    label: stepLabels[i],
    tooltip: STEP_TOOLTIPS[id],
    active: step === id,
    done:
      (id === "scan" && !!scan) ||
      (id === "routine" && !!plan && currentIdx > 0) ||
      (id === "tryon" && !!tryonPreview) ||
      (id === "save" && !!savedMsg),
  }));

  const meta = STEP_META[step];

  return (
    <div>
      <section className="page-hero">
        <h2>Your beauty journey</h2>
        <p>
          Scan, shop smarter, and try before you buy — even on slow networks.
        </p>
      </section>

      <StepIndicator
        steps={indicatorSteps}
        onSelect={(id) => setStep(id as JourneyUiStep)}
      />

      {regions.length > 0 && (
        <div className="field-row">
          <label htmlFor="region-select" className="label-with-tip">
            Shop for
            <InfoTip content={UI_TOOLTIPS.shopFor} label="About regional products" />
          </label>
          <select
            id="region-select"
            value={region}
            onChange={(e) => onRegionChange(e.target.value)}
          >
            {regions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="page-intro">
        <div className="page-intro__row">
          <div>
            <h2>{meta.title}</h2>
            <p>{meta.subtitle}</p>
          </div>
          <InfoTip content={STEP_TOOLTIPS[step]} wide label={`About step: ${meta.title}`} />
        </div>
      </div>

      {loading && <LoadingSpinner />}
      {error && <div className="alert alert--error">{error}</div>}
      {savedMsg && step === "save" && (
        <div className="alert alert--success">{savedMsg}</div>
      )}

      {step === "scan" && (
        <div className="page-card">
          <CameraCapture
            onCapture={runScan}
            title="Start with a selfie"
            hint="Remove glasses, use natural light, face the camera"
          />
          {preview && (
            <div className="media-frame">
              <img src={preview} alt="Your photo" />
            </div>
          )}
          {scan && !loading && (
            <div className="hint-strip">
              Last score: <strong>{scan.analysis.overall_score}</strong> — tap
              Routine above to continue
            </div>
          )}
        </div>
      )}

      {step === "routine" && plan && scan && (
        <div className="page-card">
          <div className="score-ring">
            <span className="score-ring__value">{scan.analysis.overall_score}</span>
            <span className="score-ring__label label-with-tip">
              Skin health score
              <InfoTip content={UI_TOOLTIPS.scoreRing} label="About skin score" />
            </span>
          </div>

          <div className="routine-grid">
            <div className="routine-block">
              <h4 className="label-with-tip">
                Morning
                <InfoTip content={UI_TOOLTIPS.morningRoutine} label="Morning routine" />
              </h4>
              <ul>
                {plan.routine.am.map((p) => (
                  <li key={`am-${p.id}`}>{p.name}</li>
                ))}
              </ul>
            </div>
            <div className="routine-block">
              <h4 className="label-with-tip">
                Evening
                <InfoTip content={UI_TOOLTIPS.eveningRoutine} label="Evening routine" />
              </h4>
              <ul>
                {plan.routine.pm.map((p) => (
                  <li key={`pm-${p.id}`}>{p.name}</li>
                ))}
              </ul>
            </div>
          </div>

          <h3
            className="label-with-tip"
            style={{ margin: "0 0 0.75rem", fontSize: "1rem" }}
          >
            Picked for you
            <InfoTip content={UI_TOOLTIPS.pickedForYou} label="Product recommendations" />
          </h3>
          <div className="product-list">
            {plan.products.map((p) => (
              <article key={p.id} className="product-row">
                <div className="product-row__thumb" aria-hidden>
                  ✨
                </div>
                <div className="product-row__body">
                  <h4>{p.name}</h4>
                  <p className="product-row__why">{p.why}</p>
                  <span className="product-row__price">${p.price_usd}</span>
                </div>
              </article>
            ))}
          </div>

          {plan.suggested_garment && (
            <div className="hint-strip">
              Next: try on <strong>{plan.suggested_garment.name}</strong>
            </div>
          )}

          <div className="btn-row">
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => setStep("tryon")}
            >
              Continue to try-on
            </button>
          </div>

          <FallbackChain chain={scan.fallback_chain} source={scan.source} />
        </div>
      )}

      {step === "routine" && !plan && (
        <div className="alert alert--info">Complete a skin scan to see your routine.</div>
      )}

      {step === "tryon" && plan && (
        <div className="page-card">
          <div className="hint-strip">
            Outfit: <strong>{plan.suggested_garment?.name}</strong>
          </div>
          <CameraCapture
            onCapture={runTryOn}
            title="Add a full-body or upper-body photo"
            hint="Stand facing forward, arms relaxed at your sides"
          />
          {tryonPreview && (
            <div className="media-frame media-frame--result">
              <img src={tryonPreview} alt="Virtual try-on result" />
            </div>
          )}
          {tryonResult && (
            <FallbackChain chain={tryonResult.chain} source={tryonResult.source} />
          )}
          {tryonPreview && (
            <div className="btn-row">
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => setStep("save")}
              >
                Finish
              </button>
            </div>
          )}
        </div>
      )}

      {step === "save" && (
        <div className="page-card">
          <div className="btn-row">
            <button type="button" className="btn btn--primary" onClick={handleSave}>
              Save my routine
            </button>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={handleShare}
              title={UI_TOOLTIPS.shareRoutine}
            >
              Share summary
            </button>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => onGoToTab("triage")}
            >
              Ask care assistant
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => onGoToTab("fashion")}
            >
              Browse more styles
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
