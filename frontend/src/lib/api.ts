import type { ChaosState, SkinAnalyzeResponse, TriageMessage } from "../types";

const BASE = import.meta.env.VITE_API_URL || "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init);
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function getHealth() {
  return request<{ status: string; chaos: ChaosState }>("/health");
}

export async function getChaos(): Promise<ChaosState> {
  return request<ChaosState>("/api/chaos");
}

export async function setChaos(enabled: boolean): Promise<ChaosState> {
  return request<ChaosState>("/api/chaos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      enabled,
      kill_perfect_corp: true,
      kill_primary_llm: true,
    }),
  });
}

export async function analyzeSkin(file: File): Promise<SkinAnalyzeResponse> {
  const form = new FormData();
  form.append("file", file);
  return request<SkinAnalyzeResponse>("/api/skin/analyze", {
    method: "POST",
    body: form,
  });
}

export async function fashionTryOn(
  file: File,
  garmentId: string
): Promise<{ source: string; result: Record<string, unknown>; fallback_chain: string[] }> {
  const form = new FormData();
  form.append("file", file);
  return request(`/api/fashion/try-on?garment_id=${encodeURIComponent(garmentId)}`, {
    method: "POST",
    body: form,
  });
}

export async function triageChat(
  message: string,
  history: TriageMessage[],
  skinContext?: unknown
) {
  return request<{
    source: string;
    reply: string;
    fallback_chain: string[];
  }>("/api/triage", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history, skin_context: skinContext }),
  });
}

export async function getFashionProducts() {
  return request<{ products: { id: string; name: string; category: string; price_usd: number }[] }>(
    "/api/products/fashion"
  );
}

const CACHE_KEY = "resiliar_last_skin";

export function cacheSkinAnalysis(data: SkinAnalyzeResponse) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

export function loadCachedSkin(): SkinAnalyzeResponse | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as SkinAnalyzeResponse) : null;
  } catch {
    return null;
  }
}
