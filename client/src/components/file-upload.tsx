import { useState, useCallback, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, File, Folder, X } from "lucide-react";
import type { FileContent } from "@/lib/openai";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

interface FileUploadProps {
  onFilesSelected: (files: FileContent[]) => void;
  allowDirectories?: boolean;
}

// Maximum file size in bytes (5MB per file)
const MAX_FILE_SIZE = 5 * 1024 * 1024;
// Maximum total upload size in bytes (50MB)
const MAX_TOTAL_SIZE = 50 * 1024 * 1024;

// File extensions to accept
const ACCEPTED_EXTENSIONS = [
  'js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c',
  'h', 'cs', 'php', 'rb', 'swift', 'go', 'rs', 'html',
  'css', 'scss', 'json', 'yml', 'yaml', 'md', 'txt'
];

// Directories to exclude
const EXCLUDED_DIRS = ['node_modules', 'dist', 'build', '.git'];

export default function FileUpload({ onFilesSelected, allowDirectories = false }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();
  const [selectedFiles, setSelectedFiles] = useState<{ [key: string]: FileContent }>({});
  const [totalSize, setTotalSize] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedFiles, setProcessedFiles] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);

  // Cleanup function to remove files
  const cleanupFiles = () => {
    setSelectedFiles({});
    setTotalSize(0);
    setProgress(0);
    setProcessedFiles(0);
    setTotalFiles(0);
    onFilesSelected([]);
  };

  // Effect to cleanup files when component unmounts
  useEffect(() => {
    return () => {
      cleanupFiles();
    };
  }, []);

  const isValidFile = (filePath: string): boolean => {
    // Check if file is in excluded directory
    if (EXCLUDED_DIRS.some(dir => filePath.includes(`/${dir}/`))) {
      return false;
    }

    // Check file extension
    const ext = filePath.split('.').pop()?.toLowerCase();
    return ext ? ACCEPTED_EXTENSIONS.includes(ext) : false;
  };

  const handleFiles = useCallback(async (items: DataTransferItemList | FileList) => {
    const filePromises: Promise<void>[] = [];
    const newFiles: { [key: string]: FileContent } = {};
    let newTotalSize = 0;
    let fileCount = 0;
    let hasShownSizeError = false;

    const processFile = async (file: File, path = '') => {
      try {
        const filePath = path ? `${path}/${file.name}` : file.name;

        // Skip files in excluded directories or with invalid extensions
        if (!isValidFile(filePath)) {
          return;
        }

        // Check individual file size
        if (file.size > MAX_FILE_SIZE) {
          if (!hasShownSizeError) {
            hasShownSizeError = true;
            throw new Error(`File ${file.name} exceeds the 5MB size limit`);
          }
          return;
        }

        // Check if adding this file would exceed total size limit
        if (newTotalSize + file.size > MAX_TOTAL_SIZE) {
          if (!hasShownSizeError) {
            hasShownSizeError = true;
            throw new Error('Total upload size exceeds 50MB limit');
          }
          return;
        }

        const content = await file.text();
        newFiles[filePath] = { path: filePath, content };
        newTotalSize += file.size;
        fileCount++;

        setProcessedFiles(prev => {
          const newCount = prev + 1;
          setProgress((newCount / totalFiles) * 100);
          return newCount;
        });
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        if (!hasShownSizeError) {
          toast({
            variant: "destructive",
            title: "Error",
            description: (error as Error).message || `Failed to process file ${file.name}`,
          });
        }
      }
    };

    const processEntry = async (entry: FileSystemEntry, path = '') => {
      if (entry.isFile) {
        const fileEntry = entry as FileSystemFileEntry;
        await new Promise<void>((resolve) => {
          fileEntry.file(async (file) => {
            await processFile(file, path);
            resolve();
          });
        });
      } else if (entry.isDirectory && allowDirectories) {
        const dirEntry = entry as FileSystemDirectoryEntry;
        // Skip excluded directories
        if (EXCLUDED_DIRS.includes(dirEntry.name)) {
          return;
        }
        const dirReader = dirEntry.createReader();
        await new Promise<void>((resolve) => {
          dirReader.readEntries(async (entries) => {
            for (const entry of entries) {
              await processEntry(entry, path ? `${path}/${dirEntry.name}` : dirEntry.name);
            }
            resolve();
          });
        });
      }
    };

    try {
      setIsProcessing(true);
      // Clear previous files before processing new ones
      cleanupFiles();

      // Count total files first for progress tracking
      let totalFilesCount = 0;
      if (items instanceof DataTransferItemList) {
        totalFilesCount = Array.from(items).length;
      } else {
        totalFilesCount = items.length;
      }
      setTotalFiles(totalFilesCount);

      if (items instanceof DataTransferItemList) {
        for (const item of Array.from(items)) {
          if (item.webkitGetAsEntry) {
            const entry = item.webkitGetAsEntry();
            if (entry) {
              await processEntry(entry);
            }
          }
        }
      } else {
        for (const file of Array.from(items)) {
          await processFile(file);
        }
      }

      await Promise.all(filePromises);

      if (Object.keys(newFiles).length > 0) {
        setSelectedFiles(newFiles);
        setTotalSize(newTotalSize);
        onFilesSelected(Object.values(newFiles));

        toast({
          title: "Success",
          description: `${Object.keys(newFiles).length} file(s) uploaded successfully`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Warning",
          description: "No valid files were found to upload. Make sure your files are supported and not in excluded directories (like node_modules).",
        });
      }
    } catch (error) {
      console.error("Error handling files:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: (error as Error).message || "Failed to process files",
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  }, [onFilesSelected, allowDirectories, toast]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.items) {
      await handleFiles(e.dataTransfer.items);
    } else {
      await handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      await handleFiles(e.target.files);
    }
  };

  const removeFile = (path: string) => {
    const newFiles = { ...selectedFiles };
    delete newFiles[path];
    setSelectedFiles(newFiles);
    onFilesSelected(Object.values(newFiles));
  };

  const renderFileTree = () => {
    const tree: { [key: string]: string[] } = {};
    Object.keys(selectedFiles).forEach(path => {
      const parts = path.split('/');
      const dir = parts.slice(0, -1).join('/');
      if (dir === '') {
        if (!tree['root']) tree['root'] = [];
        tree['root'].push(path);
      } else {
        if (!tree[dir]) tree[dir] = [];
        tree[dir].push(path);
      }
    });

    const renderNode = (path: string, indent = 0) => {
      const files = tree[path === 'root' ? 'root' : path] || [];
      return (
        <div key={path} style={{ marginLeft: `${indent * 20}px` }}>
          {path !== 'root' && (
            <div className="flex items-center gap-2 py-1">
              <Folder className="h-4 w-4" />
              <span>{path.split('/').pop()}</span>
            </div>
          )}
          {files.map(file => (
            <div key={file} className="flex items-center gap-2 py-1">
              <File className="h-4 w-4" />
              <span>{file.split('/').pop()}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 ml-auto"
                onClick={() => removeFile(file)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      );
    };

    return (
      <div className="mt-4">
        {renderNode('root')}
        {Object.keys(tree)
          .filter(k => k !== 'root')
          .sort()
          .map(path => renderNode(path, path.split('/').length))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Card
        className={`
          border-2 border-dashed transition-colors duration-200
          ${dragActive ? 'border-primary/50 bg-primary/5' : 'border-zinc-700'}
          ${Object.keys(selectedFiles).length > 0 ? 'border-solid' : ''}
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <CardContent className="flex flex-col items-center justify-center p-10 text-center">
          <input
            type="file"
            multiple
            {...(allowDirectories ? { webkitdirectory: "", directory: "" } : {})}
            className="hidden"
            onChange={handleChange}
            id="file-upload"
          />
          <Upload className={`h-10 w-10 mb-4 ${dragActive ? 'text-primary' : 'text-zinc-500'}`} />
          <label
            htmlFor="file-upload"
            className="text-lg font-medium mb-2 cursor-pointer hover:text-primary transition-colors"
          >
            {Object.keys(selectedFiles).length === 0
              ? allowDirectories
                ? 'Drop project folder here, or click to select'
                : 'Drop files here, or click to select'
              : allowDirectories
              ? 'Drop more folders or click to select'
              : 'Drop more files or click to select'}
          </label>
          <p className="text-sm text-zinc-500">
            {allowDirectories
              ? 'Maximum 50MB total, 5MB per file. node_modules and build folders are excluded.'
              : 'Maximum 50MB total, 5MB per file. Supports common code file types.'}
          </p>

          {isProcessing && (
            <div className="w-full mt-4 space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-zinc-400">
                Processing files: {processedFiles}/{totalFiles} ({Math.round(progress)}%)
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {Object.keys(selectedFiles).length > 0 && (
        <Card className="border-zinc-800">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Selected Files</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={cleanupFiles}
                className="border-zinc-700 hover:border-red-500/40 hover:text-red-400 transition-colors"
              >
                <X className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </div>
            {renderFileTree()}
            <p className="text-sm text-zinc-500 mt-4">
              Total size: {(totalSize / (1024 * 1024)).toFixed(2)}MB
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}