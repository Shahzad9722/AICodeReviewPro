// Types for OpenAI API integration
export type ReviewMode = "general" | "performance" | "security" | "clean-code" | "architecture";

export interface FileContent {
  path: string;
  content: string;
}

export interface CodeReviewResponse {
  suggestions: string[];
  improvements: string[];
  security: string[];
  dependencies: string[];
  architecture: string[];
}

export interface CodeReviewRequest {
  files: FileContent[];
  name: string;
  description?: string;
  mode?: ReviewMode;
  language?: string;
  save?: boolean;
}

export interface SavedReview {
  id: number;
  name: string;
  description?: string;
  language: string;
  mode: ReviewMode;
  createdAt: string;
  files: SavedReviewFile[];
  results: SavedReviewResult;
}

export interface SavedReviewFile {
  id: number;
  path: string;
  content: string;
  createdAt: string;
}

export interface SavedReviewResult {
  id: number;
  suggestions: string[];
  improvements: string[];
  security: string[];
  dependencies: string[];
  architecture: string[];
  createdAt: string;
}

export interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTreeNode[];
}