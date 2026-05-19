import { useState } from "react";
import {
  analyzeSkin,
  cacheSkinAnalysis,
  loadCachedSkin,
} from "../lib/api";
import type { SkinAnalyzeResponse } from "../types";
import { CameraCapture } from "./CameraCapture";
import { FallbackChain } from "./FallbackChain";

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
        setError("Network issue — showing last cached analysis.");
      } else {
        setError(e instanceof Error ? e.message : "Analysis failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="feature-panel">
      <header>
        <h2>Skin Health Advisor</h2>
        <p>
          Live analysis via Perfect Corp — falls back to offline cache when APIs
          fail.
        </p>
      </header>

      <CameraCapture onCapture={runAnalysis} label="Open camera for skin scan" />

      {preview && (
        <img src={preview} alt="Your capture" className="preview-img" />
      )}

      {loading && <p className="status">Analyzing skin…</p>}
      {error && <p className="error">{error}</p>}

      {result && (
        <div className="results">
          <div className="score-card">
            <span className="score">{result.analysis.overall_score}</span>
            <span>Skin score</span>
          </div>
          <p>{result.message}</p>
          <h3>Detected conditions</h3>
          <ul className="condition-list">
            {result.analysis.conditions.map((c) => (
              <li key={c.name}>
                <strong>{c.name}</strong>
                <span className={`severity ${c.severity}`}>{c.severity}</span>
                <span className="bar">
                  <span style={{ width: `${c.score * 100}%` }} />
                </span>
              </li>
            ))}
          </ul>
          <h3>Recommended products</h3>
          <div className="product-grid">
            {result.recommendations.map((p) => (
              <article key={p.id} className="product-card">
                <h4>{p.name}</h4>
                <p>{p.category}</p>
                <span>${p.price_usd}</span>
              </article>
            ))}
          </div>
          <FallbackChain chain={result.fallback_chain} source={result.source} />
        </div>
      )}
    </section>
  );
}
