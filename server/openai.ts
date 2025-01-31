import OpenAI from "openai";
import "dotenv/config";
import type {CodeReviewResponse, FileContent} from "../client/src/lib/openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const openai = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

const REVIEW_PROMPTS = {
  general: `You are an expert code reviewer analyzing code. For each suggestion:
1. Specify the line numbers affected (e.g., "On line 42" or "Lines 15-20")
2. Provide a clear description of what should be changed
3. Include the suggested code in a markdown code block
4. Focus on the most important improvements first`,

  performance: `You are a performance optimization expert. For each suggestion:
1. Identify specific lines where performance can be improved
2. Explain the performance impact
3. Provide optimized code in a markdown code block
4. Focus on the most significant performance gains`,

  security: `You are a security expert. For each suggestion:
1. Identify lines containing security vulnerabilities
2. Explain the security risk
3. Provide secure code alternatives in a markdown code block
4. Prioritize critical security issues`,

  "clean-code": `You are a clean code expert. For each suggestion:
1. Point out specific lines that could be more readable
2. Explain how the code can be cleaner
3. Show the improved code in a markdown code block
4. Focus on maintainability and clarity`,

  architecture: `You are a software architect. For each suggestion:
1. Identify specific code sections that could be better architected
2. Explain the architectural improvement
3. Provide implementation examples in markdown code blocks
4. Focus on scalability and maintainability`
};

export type ReviewMode = keyof typeof REVIEW_PROMPTS;

function createFileContext (files: FileContent[]): string {
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

export async function analyzeCode (
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
    "On line 42: Use const instead of let for immutable values\n\`\`\`javascript\nconst user = fetchUser();\n\`\`\`"
  ],
  "improvements": [
    "Lines 15-20: Simplify this loop using Array.map\n\`\`\`javascript\nconst results = items.map(item => transform(item));\n\`\`\`"
  ],
  "security": [
    "On line 67: Sanitize user input to prevent XSS\n\`\`\`javascript\nconst sanitizedInput = DOMPurify.sanitize(userInput);\n\`\`\`"
  ],
  "dependencies": [
    "Consider using lodash for consistent array manipulation"
  ],
  "architecture": [
    "Lines 90-120: Extract this logic into a separate service\n\`\`\`javascript\nclass UserService {\n  async fetchUser() {\n    // ...\n  }\n}\n\`\`\`"
  ]
}

Guidelines for suggestions:
- Always specify line numbers for code changes
- Include clear explanations before code blocks
- Show only the relevant code that needs to change
- Keep suggestions focused and actionable
- Limit each suggestion to 150 words

Language: ${language}
Files to analyze: ${files.length}

${fileContext}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{role: "system", content: systemMessage}],
      response_format: {type: "json_object"},
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