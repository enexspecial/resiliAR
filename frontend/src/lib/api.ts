import type {
  ChaosState,
  JourneyPlan,
  Product,
  RegionOption,
  SavedRoutine,
  SkinAnalyzeResponse,
  TriageMessage,
  TryOnResponse,
} from "../types";

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

export async function fetchJourneyPlan(
  conditions: { name: string; score?: number; severity?: string }[],
  recommendations: Product[],
  region: string
): Promise<JourneyPlan> {
  const res = await request<{ plan: JourneyPlan }>("/api/journey/plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conditions, recommendations, region }),
  });
  return res.plan;
}

export async function getJourneyRegions(): Promise<RegionOption[]> {
  const res = await request<{ regions: RegionOption[] }>("/api/journey/regions");
  return res.regions;
}

export async function fashionTryOn(
  file: File,
  garmentId: string
): Promise<TryOnResponse> {
  const form = new FormData();
  form.append("file", file);
  return request<TryOnResponse>(
    `/api/fashion/try-on?garment_id=${encodeURIComponent(garmentId)}`,
    { method: "POST", body: form }
  );
}

export async function fashionTryOnLive(
  file: File,
  garmentId: string
): Promise<TryOnResponse> {
  const form = new FormData();
  form.append("file", file);
  return request<TryOnResponse>(
    `/api/fashion/try-on-live?garment_id=${encodeURIComponent(garmentId)}`,
    { method: "POST", body: form }
  );
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
  return request<{
    products: {
      id: string;
      name: string;
      category: string;
      price_usd: number;
      garment_category?: string;
    }[];
  }>("/api/products/fashion");
}

const CACHE_KEY = "resiliar_last_skin";
const ROUTINE_KEY = "resiliar_saved_routine";

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

export function saveRoutine(data: SavedRoutine) {
  try {
    localStorage.setItem(ROUTINE_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

export function loadSavedRoutine(): SavedRoutine | null {
  try {
    const raw = localStorage.getItem(ROUTINE_KEY);
    return raw ? (JSON.parse(raw) as SavedRoutine) : null;
  } catch {
    return null;
  }
}

export function buildShareSummary(
  scan: SkinAnalyzeResponse,
  plan: JourneyPlan
): string {
  const products = plan.products.map((p) => p.name).join(", ");
  return (
    `ResiliAR Skin Score: ${scan.analysis.overall_score}/100\n` +
    `Conditions: ${plan.conditions.join(", ") || "—"}\n` +
    `Routine: ${products}\n` +
    `Try-on pick: ${plan.suggested_garment?.name ?? plan.suggested_garment_id}`
  );
}
