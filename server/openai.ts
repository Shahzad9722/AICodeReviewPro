import OpenAI from "openai";
import type { CodeReviewResponse, FileContent } from "../client/src/lib/openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const REVIEW_PROMPTS = {
  general: `You are an expert code reviewer analyzing code. Provide a concise review including:
1. Key code suggestions
2. Performance improvements
3. Security considerations
4. Dependencies recommendations
5. Architecture suggestions`,

  performance: `You are a performance optimization expert. Focus on:
1. Time complexity and efficiency
2. Memory usage patterns
3. Async/await optimizations
4. Caching opportunities
5. Bundle optimization`,

  security: `You are a security expert. Focus on:
1. Common vulnerabilities
2. Input validation
3. Authentication issues
4. Data exposure risks
5. Dependencies security`,

  "clean-code": `You are a clean code expert. Focus on:
1. Code organization
2. Naming conventions
3. Function responsibilities
4. Code duplication
5. Coding style`,

  architecture: `You are a software architect. Focus on:
1. Application architecture
2. Code modularity
3. Data flow
4. API design
5. Scalability`,
};

export type ReviewMode = keyof typeof REVIEW_PROMPTS;

function createFileContext(files: FileContent[]): string {
  // Only include relevant file content - skip binary files, limit size
  return files
    .filter(file => {
      const ext = file.path.split('.').pop()?.toLowerCase();
      const isTextFile = !ext || [
        'js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c',
        'h', 'cs', 'php', 'rb', 'swift', 'go', 'rs', 'html',
        'css', 'scss', 'json', 'yml', 'yaml', 'md', 'txt'
      ].includes(ext);
      return isTextFile;
    })
    .map(file => {
      // Limit content size to 5KB per file for faster processing
      const content = file.content.slice(0, 5000);
      return `File: ${file.path}\n\`\`\`\n${content}${
        content.length === 5000 ? '\n... (truncated)' : ''
      }\n\`\`\`\n`;
    })
    .join('\n\n');
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
Respond with a JSON object containing arrays of concise, actionable markdown-formatted suggestions:
{
  "suggestions": string[],
  "improvements": string[],
  "security": string[],
  "dependencies": string[],
  "architecture": string[]
}

Keep each suggestion under 150 words and focus on the most important issues.

Language: ${language}
Files: ${files.length}

${fileContext}`
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 1500,
      temperature: 0.5 // Lower temperature for more focused responses
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