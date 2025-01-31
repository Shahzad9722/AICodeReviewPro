import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import CodeEditor from "@/components/code-editor";
import ReviewDisplay from "@/components/review-display";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

const extractCodeFromMarkdown = (markdown: string): string | null => {
  const codeBlockRegex = /```(?:javascript|typescript|js|ts)?\n([\s\S]*?)```/;
  const match = markdown.match(codeBlockRegex);
  return match ? match[1].trim() : null;
};

export default function Home() {
  const [code, setCode] = useState("");
  const { toast } = useToast();

  const reviewMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest("POST", "/api/review", { code });
      return response.json();
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
    <div className="container mx-auto p-4 max-w-6xl">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
          AI Code Reviewer
        </h1>
        <p className="text-muted-foreground">
          Get instant code reviews and suggestions powered by AI
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Code Input</CardTitle>
          </CardHeader>
          <CardContent>
            <CodeEditor code={code} onChange={setCode} />
            <div className="mt-4 flex justify-end">
              <Button
                onClick={handleReview}
                disabled={reviewMutation.isPending || !code.trim()}
              >
                {reviewMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Reviewing...
                  </>
                ) : (
                  "Review Code"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {reviewMutation.data && (
          <Card>
            <CardHeader>
              <CardTitle>Review Results</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="suggestions">
                <TabsList className="mb-4">
                  <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
                  <TabsTrigger value="improvements">Improvements</TabsTrigger>
                  <TabsTrigger value="security">Security</TabsTrigger>
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
        )}

        {reviewMutation.isError && (
          <Alert variant="destructive">
            <AlertDescription>
              {reviewMutation.error?.message ||
                "An error occurred while reviewing the code"}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}