// This file is for type definitions and interfaces used with the OpenAI API

export interface CodeReviewResponse {
  suggestions: string[];
  improvements: string[];
  security: string[];
}

export interface CodeReviewRequest {
  code: string;
}
