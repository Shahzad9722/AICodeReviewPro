// Types for OpenAI API integration
export type ReviewMode = "general" | "performance" | "security" | "clean-code";

export interface CodeReviewResponse {
  suggestions: string[];
  improvements: string[];
  security: string[];
}

export interface CodeReviewRequest {
  code: string;
  mode?: ReviewMode;
  language?: string;
  save?: boolean;
}

export interface SavedReview {
  id: number;
  code: string;
  language: string;
  mode: ReviewMode;
  createdAt: string;
  results: SavedReviewResult;
}

export interface SavedReviewResult {
  id: number;
  suggestions: string[];
  improvements: string[];
  security: string[];
  createdAt: string;
}