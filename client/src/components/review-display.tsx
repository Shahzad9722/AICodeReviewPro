import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useState } from "react";
import InlineCodeReview from "./inline-code-review";

interface ReviewDisplayProps {
  title: string;
  content: string[];
  originalCode?: string;
  onApplyChange?: (suggestion: string) => void;
}

interface Suggestion {
  description: string;
  lineStart: number;
  lineEnd: number;
  suggestedCode: string;
}

function parseSuggestions(content: string[]): Suggestion[] {
  return content.map(suggestion => {
    // Parse line numbers from suggestion text
    const lineMatch = suggestion.match(/lines? (\d+)(?:-(\d+))?/i);
    const lineStart = lineMatch ? parseInt(lineMatch[1]) : 1;
    const lineEnd = lineMatch && lineMatch[2] ? parseInt(lineMatch[2]) : lineStart;

    // Extract code blocks
    const codeBlockRegex = /```(?:\w+)?\s*([\s\S]*?)```/g;
    const codeBlocks = [...suggestion.matchAll(codeBlockRegex)].map(match => match[1].trim());

    // Get description by removing code blocks
    const description = suggestion
      .replace(/```[\s\S]*?```/g, '')
      .replace(/lines? \d+(?:-\d+)?/i, '')
      .trim();

    return {
      description,
      lineStart,
      lineEnd,
      suggestedCode: codeBlocks[codeBlocks.length - 1] || '', // Use last code block as suggestion
    };
  });
}

export default function ReviewDisplay({ title, content, originalCode = "", onApplyChange }: ReviewDisplayProps) {
  const [appliedChanges, setAppliedChanges] = useState<Set<number>>(new Set());
  const suggestions = parseSuggestions(content);

  const handleApplyChange = (suggestion: Suggestion, index: number) => {
    if (!onApplyChange) return;

    onApplyChange(content[index]); // Use original suggestion for backward compatibility
    setAppliedChanges(prev => new Set(prev).add(index));
  };

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-zinc-100">{title}</h3>
      {suggestions.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <InlineCodeReview
            code={originalCode}
            suggestions={suggestions}
            onApplyChange={(suggestion) => {
              const index = suggestions.indexOf(suggestion);
              if (index !== -1) {
                handleApplyChange(suggestion, index);
              }
            }}
            appliedChanges={appliedChanges}
          />
        </motion.div>
      ) : (
        <Card className="p-4 border-zinc-800">
          <p className="text-zinc-400">No suggestions available.</p>
        </Card>
      )}
    </div>
  );
}