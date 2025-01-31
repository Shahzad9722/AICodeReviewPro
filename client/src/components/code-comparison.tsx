import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, CheckCircle } from "lucide-react";
import CodeEditor from "./code-editor";
import { useState } from "react";

interface CodeComparisonProps {
  originalCode: string;
  suggestedCode: string;
  suggestion: string;
  onApplyChange: () => void;
  isApplied?: boolean;
}

export default function CodeComparison({
  originalCode,
  suggestedCode,
  suggestion,
  onApplyChange,
  isApplied = false
}: CodeComparisonProps) {
  return (
    <Card className="border-2 border-zinc-800 bg-zinc-900/50 backdrop-blur-sm p-6 space-y-4">
      <div className="flex justify-between items-start">
        <p className="text-sm text-zinc-300 whitespace-pre-wrap">{suggestion}</p>
        <Button
          onClick={onApplyChange}
          disabled={isApplied}
          variant="outline"
          size="sm"
          className={`
            ${isApplied ? 'bg-green-500/10 border-green-500/40 text-green-400' : 'border-zinc-700 hover:border-primary/40'}
            transition-all duration-200
          `}
        >
          {isApplied ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Applied
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              Apply Change
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-medium text-zinc-400 mb-2">Original Code</p>
          <div className="bg-zinc-800/60 rounded-lg p-1">
            <CodeEditor code={originalCode} onChange={() => {}} />
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-zinc-400 mb-2">Suggested Changes</p>
          <div className="bg-zinc-800/60 rounded-lg p-1">
            <CodeEditor code={suggestedCode} onChange={() => {}} />
          </div>
        </div>
      </div>
    </Card>
  );
}
