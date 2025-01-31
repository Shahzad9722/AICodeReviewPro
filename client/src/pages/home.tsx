import { useState, useId } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import CodeEditor from "@/components/code-editor";
import ReviewDisplay from "@/components/review-display";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Save } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ReviewMode } from "@/lib/openai";

const extractCodeFromMarkdown = (markdown: string): string | null => {
  const codeBlockRegex = /```(?:javascript|typescript|js|ts)?\n([\s\S]*?)```/;
  const match = markdown.match(codeBlockRegex);
  return match ? match[1].trim() : null;
};

const LANGUAGES = [
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
];

const REVIEW_MODES: { value: ReviewMode; label: string }[] = [
  { value: "general", label: "General Review" },
  { value: "performance", label: "Performance" },
  { value: "security", label: "Security" },
  { value: "clean-code", label: "Clean Code" },
];

export default function Home() {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [mode, setMode] = useState<ReviewMode>("general");
  const [saveReview, setSaveReview] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const formId = useId();

  const reviewMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest("POST", "/api/review", {
        code,
        mode,
        language,
        save: saveReview,
      });
      return response.json();
    },
    onSuccess: () => {
      if (saveReview) {
        queryClient.invalidateQueries({ queryKey: ["/api/reviews"] });
        toast({
          title: "Success",
          description: "Review saved successfully",
        });
      }
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to get code review",
      });
    },
  });

  const handleReview = async () => {
    if (!code.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter some code to review",
      });
      return;
    }
    reviewMutation.mutate(code);
  };

  const handleApplyChange = (suggestion: string) => {
    const codeSnippet = extractCodeFromMarkdown(suggestion);
    if (codeSnippet) {
      setCode(codeSnippet);
      toast({
        title: "Success",
        description: "Applied suggested changes to the code",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No code found in the suggestion",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto p-4 max-w-6xl space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4 pt-8"
        >
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent">
            AI Code Reviewer
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Get instant code reviews and suggestions powered by AI. Choose a review mode and let our AI
            help you write better code.
          </p>
        </motion.div>

        <div className="grid gap-6">
          <Card className="border-primary/10 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl font-semibold text-primary">Code Input</CardTitle>
              <div className="flex flex-wrap gap-4 mt-4">
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="w-[180px] border-primary/20">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={mode} onValueChange={(value) => setMode(value as ReviewMode)}>
                  <SelectTrigger className="w-[180px] border-primary/20">
                    <SelectValue placeholder="Select review mode" />
                  </SelectTrigger>
                  <SelectContent>
                    {REVIEW_MODES.map((mode) => (
                      <SelectItem key={mode.value} value={mode.value}>
                        {mode.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <CodeEditor code={code} onChange={setCode} />
              <div className="flex justify-between items-center pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSaveReview(!saveReview)}
                  className={`${saveReview ? "bg-primary/10 border-primary/30" : "border-primary/20"} transition-colors duration-200`}
                >
                  <Save className={`h-4 w-4 mr-2 ${saveReview ? "text-primary" : ""}`} />
                  {saveReview ? "Will save review" : "Save review"}
                </Button>
                <Button
                  onClick={handleReview}
                  disabled={reviewMutation.isPending || !code.trim()}
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all duration-200"
                >
                  {reviewMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    "Review Code"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <AnimatePresence>
            {reviewMutation.data && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="transition-shadow duration-200"
              >
                <Card className="border-primary/10 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-2xl font-semibold text-primary">Review Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="suggestions" className="w-full">
                      <TabsList className="w-full justify-start mb-4 bg-primary/5 p-1">
                        <TabsTrigger value="suggestions" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                          Suggestions
                        </TabsTrigger>
                        <TabsTrigger value="improvements" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                          Improvements
                        </TabsTrigger>
                        <TabsTrigger value="security" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                          Security
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="suggestions">
                        <ReviewDisplay
                          title="Code Suggestions"
                          content={reviewMutation.data.suggestions}
                          onApplyChange={handleApplyChange}
                        />
                      </TabsContent>
                      <TabsContent value="improvements">
                        <ReviewDisplay
                          title="Possible Improvements"
                          content={reviewMutation.data.improvements}
                          onApplyChange={handleApplyChange}
                        />
                      </TabsContent>
                      <TabsContent value="security">
                        <ReviewDisplay
                          title="Security Considerations"
                          content={reviewMutation.data.security}
                          onApplyChange={handleApplyChange}
                        />
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {reviewMutation.isError && (
            <Alert variant="destructive" className="border-red-500/50 bg-red-500/10">
              <AlertDescription className="text-red-700 dark:text-red-300">
                {reviewMutation.error?.message || "An error occurred while reviewing the code"}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}