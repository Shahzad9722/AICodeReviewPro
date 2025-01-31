import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import { Check } from "lucide-react";
import { motion } from "framer-motion";

interface ReviewDisplayProps {
  title: string;
  content: string[];
  onApplyChange?: (suggestion: string) => void;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function ReviewDisplay({ title, content, onApplyChange }: ReviewDisplayProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-xl text-primary/90 mb-2">{title}</h3>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-4"
      >
        {content.map((suggestion, index) => (
          <motion.div key={index} variants={item}>
            <Card className="p-4 hover:shadow-lg transition-all duration-200 border-primary/10">
              <div className="flex justify-between items-start gap-4">
                <ReactMarkdown
                  className="prose prose-sm max-w-none dark:prose-invert flex-1 prose-pre:bg-primary/5 prose-pre:border prose-pre:border-primary/10 prose-code:text-primary"
                  components={{
                    code: ({ children }) => (
                      <code className="bg-primary/5 px-1.5 py-0.5 rounded text-sm font-mono text-primary">
                        {children}
                      </code>
                    ),
                  }}
                >
                  {suggestion}
                </ReactMarkdown>
                {onApplyChange && (
                  <Button
                    onClick={() => onApplyChange(suggestion)}
                    variant="outline"
                    size="sm"
                    className="shrink-0 hover:bg-primary/10 hover:text-primary border-primary/20 transition-all duration-200"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Apply
                  </Button>
                )}
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}