import OpenAI from "openai";
import type { CodeReviewResponse } from "../client/src/lib/openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function analyzeCode(code: string): Promise<CodeReviewResponse> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert code reviewer. Analyze the provided code and provide:
1. Code suggestions for improving readability and maintainability
2. Potential improvements for performance and best practices
3. Security considerations and potential vulnerabilities

Respond with a JSON object containing arrays of markdown-formatted strings for each category:
{
  "suggestions": string[],
  "improvements": string[],
  "security": string[]
}`
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
    throw new Error("Failed to analyze code: " + error.message);
  }
}
