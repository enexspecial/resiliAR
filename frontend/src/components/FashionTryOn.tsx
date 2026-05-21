import { useEffect, useState } from "react";
import {
  fashionTryOn,
  fashionTryOnLive,
  getFashionProducts,
} from "../lib/api";
import type { TryOnResponse } from "../types";
import { UI_TOOLTIPS } from "../lib/tooltips";
import { CameraCapture } from "./CameraCapture";
import { FallbackChain } from "./FallbackChain";
import { InfoTip } from "./ui/InfoTip";
import { LoadingSpinner } from "./ui/LoadingSpinner";

interface Props {
  initialGarmentId?: string;
  preferLive?: boolean;
}

export function FashionTryOn({
  initialGarmentId = "dress-01",
  preferLive = true,
}: Props) {
  const [garments, setGarments] = useState<
    { id: string; name: string; price_usd: number }[]
  >([]);
  const [selected, setSelected] = useState(initialGarmentId);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TryOnResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSelected(initialGarmentId);
  }, [initialGarmentId]);

  useEffect(() => {
    getFashionProducts()
      .then((r) => setGarments(r.products))
      .catch(() =>
        setGarments([
          { id: "dress-01", name: "Ankara Wrap Dress", price_usd: 45 },
          { id: "shirt-02", name: "Kente Print Shirt", price_usd: 32 },
          { id: "acc-03", name: "Beaded Necklace", price_usd: 28 },
        ])
      );
  }, []);

  const runTryOn = async (file: File) => {
    setPreview(URL.createObjectURL(file));
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      let data: TryOnResponse;
      if (preferLive) {
        try {
          data = await fashionTryOnLive(file, selected);
        } catch {
          data = await fashionTryOn(file, selected);
        }
      } else {
        data = await fashionTryOn(file, selected);
      }
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Try-on failed.");
    } finally {
      setLoading(false);
    }
  };

  const resultUrl = result?.result?.preview_url;
  const suggestedName = garments.find((g) => g.id === initialGarmentId)?.name;

  return (
    <div>
      <div className="page-intro">
        <div className="page-intro__row">
          <div>
            <h2>Virtual fitting room</h2>
            <p>See outfits on you before you order — no changing room needed.</p>
          </div>
          <InfoTip
            content={UI_TOOLTIPS.virtualTryOn}
            wide
            label="About virtual try-on"
          />
        </div>
      </div>

      {initialGarmentId !== "dress-01" && suggestedName && (
        <div className="hint-strip">
          From your scan: <strong>{suggestedName}</strong>
        </div>
      )}

      <div className="page-card">
        <p
          style={{
            margin: "0 0 0.75rem",
            fontSize: "0.85rem",
            fontWeight: 600,
            color: "var(--text-secondary)",
          }}
        >
          Choose an item
        </p>
        <div className="garment-scroll">
          {garments.map((g) => (
            <button
              key={g.id}
              type="button"
              className={`garment-card ${selected === g.id ? "selected" : ""}`}
              onClick={() => setSelected(g.id)}
            >
              <span className="garment-card__name">{g.name}</span>
              <span className="garment-card__price">${g.price_usd}</span>
            </button>
          ))}
        </div>

        <CameraCapture
          onCapture={runTryOn}
          title="Your photo"
          hint="Full body or chest-up, facing the camera"
        />

        {preview && !resultUrl && (
          <div className="media-frame">
            <img src={preview} alt="Your photo" />
          </div>
        )}

        {loading && <LoadingSpinner label="Creating your look…" />}
        {error && <div className="alert alert--error">{error}</div>}

        {result && (
          <>
            {resultUrl && (
              <div className="media-frame media-frame--result">
                <img src={resultUrl} alt="Try-on result" />
              </div>
            )}
            {!resultUrl && (
              <div className="alert alert--info">
                {String(result.result.message ?? "Processing your try-on…")}
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
