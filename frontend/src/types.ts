export type TabId = "journey" | "skin" | "fashion" | "triage";

export interface SkinCondition {
  name: string;
  score: number;
  severity: string;
}

export interface SkinAnalysis {
  conditions: SkinCondition[];
  overall_score: number;
  summary: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price_usd: number;
  for_conditions?: string[];
  region?: string;
  why?: string;
}

export interface JourneyRoutine {
  am: Product[];
  pm: Product[];
}

export interface JourneyStep {
  id: string;
  label: string;
  done: boolean;
}

export interface JourneyPlan {
  region: string;
  conditions: string[];
  products: Product[];
  routine: JourneyRoutine;
  suggested_garment_id: string;
  suggested_garment: {
    id: string;
    name: string;
    price_usd: number;
    category?: string;
  } | null;
  steps: JourneyStep[];
}

export interface SkinAnalyzeResponse {
  source: string;
  analysis: SkinAnalysis;
  recommendations: Product[];
  journey?: JourneyPlan;
  fallback_chain: string[];
  confidence: number;
  message: string;
}

export interface TryOnResponse {
  source: string;
  result: {
    status: string;
    garment_id: string;
    preview_url?: string | null;
    message?: string;
  };
  fallback_chain: string[];
  garment?: { id: string; name: string; price_usd: number } | null;
  live?: boolean;
}

export interface SavedRoutine {
  saved_at: string;
  region: string;
  analysis: SkinAnalysis;
  products: Product[];
  routine: JourneyRoutine;
  suggested_garment_id: string;
}

export interface TriageMessage {
  role: "user" | "assistant";
  content: string;
  source?: string;
  fallback_chain?: string[];
}

export interface ChaosState {
  enabled: boolean;
  kill_perfect_corp: boolean;
  kill_primary_llm: boolean;
}

export interface RegionOption {
  id: string;
  label: string;
}
