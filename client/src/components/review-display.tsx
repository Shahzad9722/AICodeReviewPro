import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import FileDiffView from "./file-diff-view";

interface ReviewDisplayProps {
  title: string;
  content: string[];
  originalCode?: string;
  onApplyChange?: (suggestion: string) => void;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
};

interface ParsedChange {
  filePath: string;
  originalCode: string;
  suggestedCode: string;
  description: string;
}

function parseSuggestion(suggestion: string): ParsedChange | null {
  // Look for file paths in various formats
  const filePathMatch = suggestion.match(/(?:['"`])([^'"`]+\.[a-zA-Z]+)(?:['"`])/);
  if (!filePathMatch) return null;

  const filePath = filePathMatch[1];
  const codeBlockRegex = /```(?:\w+)?\s*([\s\S]*?)```/g;
  const codeBlocks = [...suggestion.matchAll(codeBlockRegex)].map(match => match[1].trim());

  // Get description by removing code blocks and file paths
  let description = suggestion
    .replace(/```[\s\S]*?```/g, '')
    .replace(/['"`][^'"`]+\.[a-zA-Z]+['"`]/g, '')
    .trim();

  if (codeBlocks.length >= 2) {
    return {
      filePath,
      originalCode: codeBlocks[0],
      suggestedCode: codeBlocks[1],
      description
    };
  } else if (codeBlocks.length === 1) {
    return {
      filePath,
      originalCode: '',
      suggestedCode: codeBlocks[0],
      description
    };
  }

  return null;
}

function organizeChangesByFile(suggestions: string[]): { [filePath: string]: ParsedChange[] } {
  const fileChanges: { [filePath: string]: ParsedChange[] } = {};

  suggestions.forEach(suggestion => {
    const parsedChange = parseSuggestion(suggestion);
    if (parsedChange) {
      if (!fileChanges[parsedChange.filePath]) {
        fileChanges[parsedChange.filePath] = [];
      }
      fileChanges[parsedChange.filePath].push(parsedChange);
    }
  });

  return fileChanges;
}

export default function ReviewDisplay({ title, content, originalCode, onApplyChange }: ReviewDisplayProps) {
  const [appliedChanges, setAppliedChanges] = useState<Set<string>>(new Set());
  const fileChanges = organizeChangesByFile(content);

  const handleApplyChange = (filePath: string, index: number) => {
    if (!onApplyChange) return;

    const changes = fileChanges[filePath];
    if (changes && changes[index]) {
      const changeKey = `${filePath}:${index}`;
      if (!appliedChanges.has(changeKey)) {
        onApplyChange(content[index]); // Use original suggestion for backward compatibility
        setAppliedChanges(prev => new Set(prev).add(changeKey));
      }
    }
  };

  // If there are no file-specific changes, fall back to the original display
  if (Object.keys(fileChanges).length === 0) {
    return (
      <div className="space-y-6">
        <h3 className="text-2xl font-bold text-zinc-100">{title}</h3>
        <div className="space-y-4">
          {content.map((item, index) => (
            <Card key={index} className="p-4 border-zinc-800">
              <div className="prose prose-invert max-w-none">
                {item}
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-zinc-100">{title}</h3>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
      >
        <FileDiffView
          files={fileChanges}
          onApplyChange={handleApplyChange}
          appliedChanges={appliedChanges}
        />
      </motion.div>
    </div>
  );
}