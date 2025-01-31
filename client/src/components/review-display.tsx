import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import { Check } from "lucide-react";

interface ReviewDisplayProps {
  title: string;
  content: string[];
  onApplyChange?: (suggestion: string) => void;
}

export default function ReviewDisplay({ title, content, onApplyChange }: ReviewDisplayProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">{title}</h3>
      <div className="space-y-2">
        {content.map((item, index) => (
          <Card key={index} className="p-4">
            <div className="flex justify-between items-start gap-4">
              <ReactMarkdown
                className="prose prose-sm max-w-none dark:prose-invert flex-1"
                components={{
                  code: ({ children }) => (
                    <code className="bg-muted px-1 py-0.5 rounded text-sm">
                      {children}
                    </code>
                  ),
                }}
              >
                {item}
              </ReactMarkdown>
              {onApplyChange && (
                <Button
                  onClick={() => onApplyChange(item)}
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Apply
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}