import OpenAI from "openai";
import type { CodeReviewResponse, FileContent } from "../client/src/lib/openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Update the review prompts to encourage code block responses
const REVIEW_PROMPTS = {
  general: `You are an expert code reviewer analyzing code. For each point, provide specific code examples using markdown code blocks. Focus on:
1. Key code suggestions with before/after examples
2. Performance improvements with code samples
3. Security considerations with fixes
4. Dependencies recommendations
5. Architecture suggestions with implementation examples`,

  performance: `You are a performance optimization expert. For each suggestion, include code examples in markdown format. Focus on:
1. Time complexity and efficiency improvements
2. Memory usage optimization patterns
3. Async/await and Promise optimizations
4. Caching implementations
5. Bundle size reduction techniques`,

  security: `You are a security expert. For each issue, provide secure code alternatives in markdown format. Focus on:
1. Common vulnerability fixes
2. Input validation implementations
3. Authentication and authorization improvements
4. Data exposure prevention
5. Dependency security updates`,

  "clean-code": `You are a clean code expert. For each suggestion, show before/after code examples in markdown. Focus on:
1. Code organization improvements
2. Better naming conventions
3. Function responsibility separation
4. Code duplication elimination
5. Consistent coding style`,

  architecture: `You are a software architect. Provide specific implementation examples in markdown format. Focus on:
1. Application architecture improvements
2. Code modularity enhancements
3. Data flow optimization
4. API design best practices
5. Scalability implementations`
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
      return `File: ${file.path}\n\`\`\`\n${file.content}\n\`\`\`\n`;
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

    const systemMessage = `${prompt}

Analyze the code and respond with a JSON object containing arrays of markdown-formatted suggestions:

{
  "suggestions": [
    "Suggestion 1 with code blocks",
    "Suggestion 2 with code blocks"
  ],
  "improvements": [
    "Improvement 1 with code blocks",
    "Improvement 2 with code blocks"
  ],
  "security": [
    "Security issue 1 with code blocks",
    "Security issue 2 with code blocks"
  ],
  "dependencies": [
    "Dependency recommendation 1",
    "Dependency recommendation 2"
  ],
  "architecture": [
    "Architecture suggestion 1 with code blocks",
    "Architecture suggestion 2 with code blocks"
  ]
}

Guidelines for suggestions:
- Include file paths in quotes (e.g. "src/app.ts")
- Use markdown code blocks (\`\`\`) for code examples
- Show both original and improved code when suggesting changes
- Mention if suggesting full file replacements
- Keep each suggestion under 150 words
- Focus on the most important issues

Language: ${language}
Files to analyze: ${files.length}

${fileContext}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "system", content: systemMessage }],
      response_format: { type: "json_object" },
      max_tokens: 4000,
      temperature: 0.5
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