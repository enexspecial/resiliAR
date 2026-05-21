import { useState } from "react";
import {
  analyzeSkin,
  cacheSkinAnalysis,
  loadCachedSkin,
} from "../lib/api";
import type { SkinAnalyzeResponse } from "../types";
import { UI_TOOLTIPS } from "../lib/tooltips";
import { CameraCapture } from "./CameraCapture";
import { FallbackChain } from "./FallbackChain";
import { InfoTip } from "./ui/InfoTip";
import { LoadingSpinner } from "./ui/LoadingSpinner";

interface Props {
  onAnalysis?: (data: SkinAnalyzeResponse) => void;
}

export function SkinAdvisor({ onAnalysis }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SkinAnalyzeResponse | null>(
    () => loadCachedSkin()
  );
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async (file: File) => {
    setPreview(URL.createObjectURL(file));
    setLoading(true);
    setError(null);
    try {
      const data = await analyzeSkin(file);
      setResult(data);
      cacheSkinAnalysis(data);
      onAnalysis?.(data);
    } catch (e) {
      const cached = loadCachedSkin();
      if (cached) {
        setResult(cached);
        onAnalysis?.(cached);
        setError("Offline — showing your last results.");
      } else {
        setError(e instanceof Error ? e.message : "Analysis failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-intro">
        <div className="page-intro__row">
          <div>
            <h2>Skin analysis</h2>
            <p>Professional-grade AI scan with instant product matches.</p>
          </div>
          <InfoTip content={UI_TOOLTIPS.scoreRing} label="About skin analysis" />
        </div>
      </div>

      <div className="page-card">
        <CameraCapture
          onCapture={runAnalysis}
          title="Scan your face"
          hint="Best results in daylight, no heavy filters"
        />

        {preview && (
          <div className="media-frame">
            <img src={preview} alt="Your selfie" />
          </div>
        )}

        {loading && <LoadingSpinner label="Analyzing your skin…" />}
        {error && <div className="alert alert--error">{error}</div>}

        {result && !loading && (
          <>
            <div className="score-ring">
              <span className="score-ring__value">
                {result.analysis.overall_score}
              </span>
              <span className="score-ring__label">Your skin score</span>
            </div>

            <p style={{ color: "var(--text-secondary)", marginBottom: "1rem" }}>
              {result.message}
            </p>

            <h3 style={{ margin: "0 0 0.75rem", fontSize: "1rem" }}>
              What we noticed
            </h3>
            <div className="condition-cards">
              {result.analysis.conditions.map((c) => (
                <div key={c.name} className="condition-card">
                  <div className="condition-card__top">
                    <span className="condition-card__name">{c.name}</span>
                    <span className={`badge badge--${c.severity}`}>
                      {c.severity}
                    </span>
                  </div>
                  <div className="progress-bar">
                    <span style={{ width: `${c.score * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <h3 style={{ margin: "0 0 0.75rem", fontSize: "1rem" }}>
              Recommended for you
            </h3>
            <div className="product-list">
              {(result.journey?.products ?? result.recommendations).map((p) => (
                <article key={p.id} className="product-row">
                  <div className="product-row__thumb" aria-hidden>
                    ✨
                  </div>
                  <div className="product-row__body">
                    <h4>{p.name}</h4>
                    <p className="product-row__why">{p.why ?? p.category}</p>
                    <span className="product-row__price">${p.price_usd}</span>
                  </div>
                </article>
              ))}
            </div>

            {result.journey?.suggested_garment && (
              <div className="hint-strip">
                Also try:{" "}
                <strong>{result.journey.suggested_garment.name}</strong> in Style
              </div>
            )}

            <FallbackChain
              chain={result.fallback_chain}
              source={result.source}
            />
          </>
        )}
      </div>
    </div>
  );
}
