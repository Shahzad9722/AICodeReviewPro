import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, File, Check, CheckCircle } from "lucide-react";
import CodeComparison from "./code-comparison";
import { cn } from "@/lib/utils";

interface FileChange {
  filePath: string;
  originalCode: string;
  suggestedCode: string;
  description: string;
}

interface FileDiffViewProps {
  files: {
    [filePath: string]: FileChange[];
  };
  onApplyChange: (filePath: string, index: number) => void;
  appliedChanges: Set<string>; // Format: "filepath:index"
}

export default function FileDiffView({ files, onApplyChange, appliedChanges }: FileDiffViewProps) {
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

  const toggleFile = (filePath: string) => {
    const newExpanded = new Set(expandedFiles);
    if (newExpanded.has(filePath)) {
      newExpanded.delete(filePath);
    } else {
      newExpanded.add(filePath);
    }
    setExpandedFiles(newExpanded);
  };

  const handleApplyAllInFile = (filePath: string) => {
    const changes = files[filePath];
    changes.forEach((_, index) => {
      if (!appliedChanges.has(`${filePath}:${index}`)) {
        onApplyChange(filePath, index);
      }
    });
  };

  return (
    <div className="space-y-4">
      {Object.entries(files).map(([filePath, changes]) => {
        const isExpanded = expandedFiles.has(filePath);
        const allChangesApplied = changes.every((_, index) => 
          appliedChanges.has(`${filePath}:${index}`)
        );

        return (
          <Card key={filePath} className="border-zinc-800">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => toggleFile(filePath)}
                  className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <File className="h-4 w-4" />
                  <span className="font-medium">{filePath}</span>
                  <span className="text-zinc-500 ml-2">
                    ({changes.length} change{changes.length !== 1 ? 's' : ''})
                  </span>
                </button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleApplyAllInFile(filePath)}
                  disabled={allChangesApplied}
                  className={cn(
                    "transition-all duration-200",
                    allChangesApplied 
                      ? "bg-green-500/10 border-green-500/40 text-green-400" 
                      : "border-zinc-700 hover:border-primary/40"
                  )}
                >
                  {allChangesApplied ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      All Applied
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Apply All Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
            {isExpanded && (
              <div className="border-t border-zinc-800 p-4 space-y-4">
                {changes.map((change, index) => (
                  <CodeComparison
                    key={`${filePath}:${index}`}
                    originalCode={change.originalCode}
                    suggestedCode={change.suggestedCode}
                    suggestion={change.description}
                    onApplyChange={() => onApplyChange(filePath, index)}
                    isApplied={appliedChanges.has(`${filePath}:${index}`)}
                  />
                ))}
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
