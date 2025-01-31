import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, CheckCircle } from "lucide-react";
import { EditorView, basicSetup } from "codemirror";
import { javascript } from "@codemirror/lang-javascript";

interface Suggestion {
  description: string;
  lineStart: number;
  lineEnd: number;
  suggestedCode: string;
}

interface InlineCodeReviewProps {
  code: string;
  suggestions: Suggestion[];
  onApplyChange: (suggestion: Suggestion) => void;
  appliedChanges: Set<number>;
}

export default function InlineCodeReview({
  code,
  suggestions,
  onApplyChange,
  appliedChanges
}: InlineCodeReviewProps) {
  const editorRef = useRef<EditorView>();
  const editorContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editorContainerRef.current) return;

    const view = new EditorView({
      doc: code,
      extensions: [basicSetup, javascript()],
      parent: editorContainerRef.current,
    });

    editorRef.current = view;

    return () => {
      view.destroy();
    };
  }, [code]);

  return (
    <Card className="border-2 border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
      <div className="p-4 border-b border-zinc-800">
        <h3 className="text-lg font-semibold text-zinc-100">Code Review Suggestions</h3>
      </div>
      <div className="relative">
        <div
          ref={editorContainerRef}
          className="min-h-[300px] [&_.cm-editor]:min-h-[300px]"
        />
        <div className="absolute right-0 top-0 bottom-0 w-[300px] border-l border-zinc-800 bg-zinc-900/80 backdrop-blur-sm overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="p-4 border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors"
            >
              <p className="text-sm text-zinc-300 mb-2">{suggestion.description}</p>
              <Button
                onClick={() => onApplyChange(suggestion)}
                disabled={appliedChanges.has(index)}
                variant="outline"
                size="sm"
                className={`
                  ${appliedChanges.has(index)
                    ? 'bg-green-500/10 border-green-500/40 text-green-400'
                    : 'border-zinc-700 hover:border-primary/40'}
                  transition-all duration-200 w-full
                `}
              >
                {appliedChanges.has(index) ? (
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
          ))}
        </div>
      </div>
    </Card>
  );
}
