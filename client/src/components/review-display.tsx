import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import { Check } from "lucide-react";
import { motion } from "framer-motion";
import CodeComparison from "./code-comparison";
import { useState } from "react";

interface ReviewDisplayProps {
  title: string;
  content: string[];
  originalCode: string;
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

export default function ReviewDisplay({ title, content, originalCode, onApplyChange }: ReviewDisplayProps) {
  const [appliedChanges, setAppliedChanges] = useState<Set<number>>(new Set());

  const handleApplyChange = (index: number, suggestion: string) => {
    if (onApplyChange) {
      onApplyChange(suggestion);
      setAppliedChanges(prev => new Set(prev).add(index));
    }
  };

  const handleApplyAll = () => {
    if (!onApplyChange) return;

    content.forEach((suggestion, index) => {
      if (!appliedChanges.has(index)) {
        onApplyChange(suggestion);
        setAppliedChanges(prev => new Set(prev).add(index));
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold text-zinc-100">{title}</h3>
        {onApplyChange && content.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleApplyAll}
            disabled={appliedChanges.size === content.length}
            className="border-zinc-700 hover:border-primary/40 transition-colors"
          >
            <Check className="h-4 w-4 mr-2" />
            Apply All Changes
          </Button>
        )}
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-6"
      >
        {content.map((suggestion, index) => (
          <motion.div key={index} variants={item}>
            <CodeComparison
              originalCode={originalCode}
              suggestedCode={suggestion}
              suggestion={suggestion}
              onApplyChange={() => handleApplyChange(index, suggestion)}
              isApplied={appliedChanges.has(index)}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}