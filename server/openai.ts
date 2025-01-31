import OpenAI from "openai";
import type { CodeReviewResponse, FileContent } from "../client/src/lib/openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const REVIEW_PROMPTS = {
  general: `You are an expert code reviewer analyzing a complete application codebase. Provide a comprehensive review including:
1. Code suggestions for improving readability and maintainability across files
2. Potential improvements for performance and best practices
3. Security considerations and potential vulnerabilities
4. Dependencies and package management recommendations
5. Architecture and code organization suggestions`,

  performance: `You are a performance optimization expert analyzing a complete codebase. Focus on:
1. Time complexity and algorithmic efficiency across the application
2. Memory usage and resource management patterns
3. Async/await and Promise optimizations
4. Caching opportunities and data structure choices
5. Bundle size and code splitting recommendations`,

  security: `You are a security expert analyzing a complete codebase. Focus on:
1. Common security vulnerabilities (XSS, CSRF, injection) across the application
2. Input validation and sanitization practices
3. Authentication and authorization implementation
4. Data exposure risks and secure coding practices
5. Dependency vulnerabilities and secure configuration`,

  "clean-code": `You are a clean code expert analyzing a complete codebase. Focus on:
1. Code organization and architecture patterns
2. Naming conventions and clarity across files
3. Function length and responsibility separation
4. DRY principles and code duplication
5. Consistent coding style and best practices`,

  architecture: `You are a software architect analyzing a complete codebase. Focus on:
1. Overall application architecture and design patterns
2. Code modularity and component relationships
3. Data flow and state management
4. API design and integration patterns
5. Scalability and maintainability considerations`,
};

export type ReviewMode = keyof typeof REVIEW_PROMPTS;

function createFileContext(files: FileContent[]): string {
  return files.map(file => 
    `File: ${file.path}\n\`\`\`\n${file.content}\n\`\`\`\n`
  ).join('\n\n');
}

export async function analyzeCode(
  files: FileContent[],
  mode: ReviewMode = "general",
  language = "javascript"
): Promise<CodeReviewResponse> {
  try {
    const prompt = REVIEW_PROMPTS[mode];
    const fileContext = createFileContext(files);

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
  "security": string[],
  "dependencies": string[],
  "architecture": string[]
}

Each suggestion should include:
1. A clear explanation of what to change
2. Code examples in markdown code blocks when applicable
3. A brief explanation of why this improves the codebase

Language being analyzed: ${language}
Number of files: ${files.length}

Here are the files to analyze:

${fileContext}`
        }
      ],
      response_format: { type: "json_object" }
    });

    if (!response.choices[0].message.content) {
      throw new Error("No response content received from OpenAI");
    }

    const result = JSON.parse(response.choices[0].message.content);
    return result as CodeReviewResponse;
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to analyze code: " + (error as Error).message);
  }
}