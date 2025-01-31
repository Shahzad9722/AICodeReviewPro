import OpenAI from "openai";
import type { CodeReviewResponse } from "../client/src/lib/openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const REVIEW_PROMPTS = {
  general: `You are an expert code reviewer. Analyze the provided code and provide:
1. Code suggestions for improving readability and maintainability
2. Potential improvements for performance and best practices
3. Security considerations and potential vulnerabilities`,

  performance: `You are a performance optimization expert. Analyze the code focusing on:
1. Time complexity and algorithmic efficiency
2. Memory usage and resource management
3. Async/await and Promise optimizations
4. Caching opportunities and data structure choices`,

  security: `You are a security expert. Analyze the code focusing on:
1. Common security vulnerabilities (XSS, CSRF, injection)
2. Input validation and sanitization
3. Authentication and authorization issues
4. Data exposure risks and secure coding practices`,

  "clean-code": `You are a clean code expert. Analyze the code focusing on:
1. Code organization and structure
2. Naming conventions and clarity
3. Function length and responsibility
4. DRY principles and code duplication`,
};

export type ReviewMode = keyof typeof REVIEW_PROMPTS;

export async function analyzeCode(code: string, mode: ReviewMode = "general", language = "javascript"): Promise<CodeReviewResponse> {
  try {
    const prompt = REVIEW_PROMPTS[mode];
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `${prompt}

Respond with a JSON object containing arrays of markdown-formatted strings for each category:
{
  "suggestions": string[],
  "improvements": string[],
  "security": string[]
}

Each suggestion should include:
1. A clear explanation of what to change
2. A code example in a markdown code block
3. A brief explanation of why this improves the code

Language being analyzed: ${language}`
        },
        {
          role: "user",
          content: code
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result as CodeReviewResponse;
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to analyze code: " + (error as Error).message);
  }
}