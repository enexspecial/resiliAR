export type TabId = "skin" | "fashion" | "triage";

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
}

export interface ApiResponse<T> {
  source: string;
  fallback_chain: string[];
  [key: string]: T | string | string[] | unknown;
}

export interface SkinAnalyzeResponse {
  source: string;
  analysis: SkinAnalysis;
  recommendations: Product[];
  fallback_chain: string[];
  confidence: number;
  message: string;
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
