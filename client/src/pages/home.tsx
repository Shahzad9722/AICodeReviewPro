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
import FileUpload from "@/components/file-upload";
import type { FileContent } from "@/lib/openai";

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
  { value: "architecture", label: "Architecture" },
];

export default function Home() {
  const [inputMode, setInputMode] = useState<"paste" | "files" | "project">("paste");
  const [files, setFiles] = useState<FileContent[]>([]);
  const [pastedCode, setPastedCode] = useState("");
  const [reviewName, setReviewName] = useState("");
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [mode, setMode] = useState<ReviewMode>("general");
  const [saveReview, setSaveReview] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const formId = useId();

  const reviewMutation = useMutation({
    mutationFn: async (data: { files: FileContent[]; name: string; description: string }) => {
      const response = await apiRequest("POST", "/api/review", {
        files: data.files,
        name: data.name,
        description: data.description,
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
    if (inputMode === "paste" && !pastedCode.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter some code to review",
      });
      return;
    }

    if ((inputMode === "files" || inputMode === "project") && files.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select some files to review",
      });
      return;
    }

    if (!reviewName.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a name for this review",
      });
      return;
    }

    const reviewFiles = inputMode === "paste" 
      ? [{ path: "code.txt", content: pastedCode }]
      : files;

    reviewMutation.mutate({ files: reviewFiles, name: reviewName, description });
  };

  const handleApplyChange = (suggestion: string) => {
    const codeSnippet = extractCodeFromMarkdown(suggestion);
    if (codeSnippet) {
      if (inputMode === "paste") {
        setPastedCode(codeSnippet);
      } else if (files.length === 1) {
        setFiles([{ ...files[0], content: codeSnippet }]);
      }
      toast({
        title: "Success",
        description: "Applied suggested changes to the code",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: inputMode === "paste" 
          ? "No code found in the suggestion"
          : "Cannot apply changes to multiple files",
      });
    }
  };

  const handleInputModeChange = (mode: string) => {
    setInputMode(mode as "paste" | "files" | "project");
    // Reset state when switching modes
    setPastedCode("");
    setFiles([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-900/95 to-black">
      <div className="container mx-auto p-6 max-w-6xl space-y-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6 pt-12"
        >
          <h1 className="text-6xl font-bold bg-gradient-to-r from-primary via-primary/90 to-violet-400 bg-clip-text text-transparent tracking-tight">
            AI Code Reviewer
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Get instant code reviews and suggestions powered by AI. Paste code, upload files, or analyze
            entire projects with our intelligent code review system.
          </p>
        </motion.div>

        <div className="grid gap-8">
          <Card className="border-2 border-zinc-800 shadow-2xl bg-zinc-900/50 backdrop-blur-sm">
            <CardHeader className="pb-4 space-y-6">
              <CardTitle className="text-3xl font-bold text-zinc-100">Code Review</CardTitle>
              <div className="grid gap-4">
                <div className="flex flex-col space-y-2">
                  <label htmlFor="review-name" className="text-sm font-medium text-zinc-400">
                    Review Name
                  </label>
                  <input
                    id="review-name"
                    type="text"
                    value={reviewName}
                    onChange={(e) => setReviewName(e.target.value)}
                    className="rounded-md bg-zinc-800/80 border-zinc-700 focus:border-primary/40 transition-colors"
                    placeholder="Enter a name for this review"
                  />
                </div>

                <div className="flex flex-col space-y-2">
                  <label htmlFor="description" className="text-sm font-medium text-zinc-400">
                    Description (Optional)
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="rounded-md bg-zinc-800/80 border-zinc-700 focus:border-primary/40 transition-colors"
                    placeholder="Add a description for this review"
                    rows={3}
                  />
                </div>

                <div className="flex flex-wrap gap-4">
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="w-[180px] bg-zinc-800/80 border-zinc-700 hover:border-primary/40 transition-colors">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value} className="cursor-pointer">
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={mode} onValueChange={(value) => setMode(value as ReviewMode)}>
                    <SelectTrigger className="w-[180px] bg-zinc-800/80 border-zinc-700 hover:border-primary/40 transition-colors">
                      <SelectValue placeholder="Select review mode" />
                    </SelectTrigger>
                    <SelectContent>
                      {REVIEW_MODES.map((mode) => (
                        <SelectItem key={mode.value} value={mode.value} className="cursor-pointer">
                          {mode.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs value={inputMode} onValueChange={handleInputModeChange} className="w-full">
                <TabsList className="w-full justify-start mb-6 bg-zinc-800/80 rounded-lg p-1">
                  <TabsTrigger 
                    value="paste"
                    className="data-[state=active]:bg-primary data-[state=active]:text-white 
                      data-[state=active]:shadow-lg transition-all duration-200 px-6"
                  >
                    Paste Code
                  </TabsTrigger>
                  <TabsTrigger 
                    value="files"
                    className="data-[state=active]:bg-primary data-[state=active]:text-white 
                      data-[state=active]:shadow-lg transition-all duration-200 px-6"
                  >
                    Upload Files
                  </TabsTrigger>
                  <TabsTrigger 
                    value="project"
                    className="data-[state=active]:bg-primary data-[state=active]:text-white 
                      data-[state=active]:shadow-lg transition-all duration-200 px-6"
                  >
                    Upload Project
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="paste">
                  <div className="bg-zinc-800/60 rounded-lg p-1">
                    <CodeEditor code={pastedCode} onChange={setPastedCode} />
                  </div>
                </TabsContent>

                <TabsContent value="files">
                  <div className="bg-zinc-800/60 rounded-lg p-1">
                    <FileUpload onFilesSelected={setFiles} allowDirectories={false} />
                  </div>
                </TabsContent>

                <TabsContent value="project">
                  <div className="bg-zinc-800/60 rounded-lg p-1">
                    <FileUpload onFilesSelected={setFiles} allowDirectories={true} />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-between items-center pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSaveReview(!saveReview)}
                  className={`
                    ${saveReview ? "bg-primary/10 border-primary/40" : "border-zinc-700"}
                    hover:bg-primary/15 hover:border-primary/50 transition-all duration-200
                    text-zinc-300
                  `}
                >
                  <Save className={`h-4 w-4 mr-2 ${saveReview ? "text-primary" : ""}`} />
                  {saveReview ? "Will save review" : "Save review"}
                </Button>
                <Button
                  onClick={handleReview}
                  disabled={
                    reviewMutation.isPending || 
                    !reviewName.trim() || 
                    (inputMode === "paste" ? !pastedCode.trim() : files.length === 0)
                  }
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-white font-semibold shadow-xl 
                    hover:shadow-2xl transition-all duration-200 px-8 py-6 disabled:opacity-50"
                >
                  {reviewMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
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
                className="transition-all duration-300"
              >
                <Card className="border-2 border-zinc-800 shadow-2xl bg-zinc-900/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-3xl font-bold text-zinc-100">Review Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="suggestions" className="w-full">
                      <TabsList className="w-full justify-start mb-6 bg-zinc-800/80 rounded-lg p-1">
                        <TabsTrigger 
                          value="suggestions"
                          className="data-[state=active]:bg-primary data-[state=active]:text-white 
                            data-[state=active]:shadow-lg transition-all duration-200 px-6"
                        >
                          Suggestions
                        </TabsTrigger>
                        <TabsTrigger 
                          value="improvements"
                          className="data-[state=active]:bg-primary data-[state=active]:text-white 
                            data-[state=active]:shadow-lg transition-all duration-200 px-6"
                        >
                          Improvements
                        </TabsTrigger>
                        <TabsTrigger 
                          value="architecture"
                          className="data-[state=active]:bg-primary data-[state=active]:text-white 
                            data-[state=active]:shadow-lg transition-all duration-200 px-6"
                        >
                          Architecture
                        </TabsTrigger>
                        <TabsTrigger 
                          value="security"
                          className="data-[state=active]:bg-primary data-[state=active]:text-white 
                            data-[state=active]:shadow-lg transition-all duration-200 px-6"
                        >
                          Security
                        </TabsTrigger>
                        <TabsTrigger 
                          value="dependencies"
                          className="data-[state=active]:bg-primary data-[state=active]:text-white 
                            data-[state=active]:shadow-lg transition-all duration-200 px-6"
                        >
                          Dependencies
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="suggestions">
                        <ReviewDisplay
                          title="Code Suggestions"
                          content={reviewMutation.data.suggestions}
                          onApplyChange={
                            inputMode === "paste" || 
                            (inputMode === "files" && files.length === 1)
                              ? handleApplyChange
                              : undefined
                          }
                        />
                      </TabsContent>
                      <TabsContent value="improvements">
                        <ReviewDisplay
                          title="Possible Improvements"
                          content={reviewMutation.data.improvements}
                          onApplyChange={
                            inputMode === "paste" || 
                            (inputMode === "files" && files.length === 1)
                              ? handleApplyChange
                              : undefined
                          }
                        />
                      </TabsContent>
                      <TabsContent value="architecture">
                        <ReviewDisplay
                          title="Architecture Review"
                          content={reviewMutation.data.architecture}
                        />
                      </TabsContent>
                      <TabsContent value="security">
                        <ReviewDisplay
                          title="Security Considerations"
                          content={reviewMutation.data.security}
                        />
                      </TabsContent>
                      <TabsContent value="dependencies">
                        <ReviewDisplay
                          title="Dependencies Analysis"
                          content={reviewMutation.data.dependencies}
                        />
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {reviewMutation.isError && (
            <Alert variant="destructive" className="border-red-500/20 bg-red-500/10">
              <AlertDescription className="text-red-400 font-medium">
                {reviewMutation.error?.message || "An error occurred while reviewing the code"}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
}