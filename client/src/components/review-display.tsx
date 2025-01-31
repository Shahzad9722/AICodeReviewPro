import { Card } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";

interface ReviewDisplayProps {
  title: string;
  content: string[];
}

export default function ReviewDisplay({ title, content }: ReviewDisplayProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">{title}</h3>
      <div className="space-y-2">
        {content.map((item, index) => (
          <Card key={index} className="p-4">
            <ReactMarkdown
              className="prose prose-sm max-w-none dark:prose-invert"
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
          </Card>
        ))}
      </div>
    </div>
  );
}
