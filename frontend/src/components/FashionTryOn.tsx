import { useEffect, useState } from "react";
import { fashionTryOn, getFashionProducts } from "../lib/api";
import { CameraCapture } from "./CameraCapture";
import { FallbackChain } from "./FallbackChain";

export function FashionTryOn() {
  const [garments, setGarments] = useState<
    { id: string; name: string; price_usd: number }[]
  >([]);
  const [selected, setSelected] = useState("dress-01");
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    source: string;
    result: Record<string, unknown>;
    fallback_chain: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getFashionProducts()
      .then((r) => setGarments(r.products))
      .catch(() =>
        setGarments([
          { id: "dress-01", name: "Ankara Wrap Dress", price_usd: 45 },
          { id: "shirt-02", name: "Kente Print Shirt", price_usd: 32 },
        ])
      );
  }, []);

  const runTryOn = async (file: File) => {
    setPreview(URL.createObjectURL(file));
    setLoading(true);
    setError(null);
    try {
      const data = await fashionTryOn(file, selected);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Try-on failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="feature-panel">
      <header>
        <h2>Fashion Try-On</h2>
        <p>
          AR virtual try-on via Perfect Corp — sessions queue when connectivity
          drops.
        </p>
      </header>

      <div className="garment-picker">
        {garments.map((g) => (
          <button
            key={g.id}
            type="button"
            className={`garment-chip ${selected === g.id ? "selected" : ""}`}
            onClick={() => setSelected(g.id)}
          >
            {g.name} · ${g.price_usd}
          </button>
        ))}
      </div>

      <CameraCapture onCapture={runTryOn} label="Photo for try-on" />

      {preview && (
        <img src={preview} alt="Try-on input" className="preview-img" />
      )}
      {loading && <p className="status">Processing try-on…</p>}
      {error && <p className="error">{error}</p>}

      {result && (
        <div className="results">
          <p className="tryon-message">{String(result.result.message ?? "")}</p>
          <p className="status-tag">Status: {String(result.result.status)}</p>
          <FallbackChain chain={result.fallback_chain} source={result.source} />
        </div>
      )}
    </section>
  );
}
