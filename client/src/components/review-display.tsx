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

export default function ReviewDisplay({ title, content, onApplyChange }: ReviewDisplayProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-primary/90 mb-4">{title}</h3>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-4"
      >
        {content.map((suggestion, index) => (
          <motion.div key={index} variants={item}>
            <Card className="p-6 hover:shadow-xl transition-all duration-300 border-primary/20 hover:border-primary/30 bg-background/95">
              <div className="flex justify-between items-start gap-6">
                <ReactMarkdown
                  className="prose prose-sm max-w-none dark:prose-invert flex-1 
                    prose-pre:bg-primary/5 prose-pre:border prose-pre:border-primary/20 
                    prose-code:text-primary prose-headings:text-primary/90
                    prose-a:text-primary hover:prose-a:text-primary/90
                    prose-strong:text-primary/90"
                  components={{
                    code: ({ children }) => (
                      <code className="bg-primary/5 px-2 py-0.5 rounded-md text-sm font-mono text-primary">
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
                    className="shrink-0 hover:bg-primary/15 hover:text-primary border-primary/30 
                      hover:border-primary/50 transition-all duration-200 shadow hover:shadow-md"
                  >
                    <Check className="h-4 w-4 mr-2" />
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