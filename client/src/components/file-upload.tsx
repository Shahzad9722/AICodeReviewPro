import { useState, useCallback, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, File, Folder, X } from "lucide-react";
import type { FileContent } from "@/lib/openai";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onFilesSelected: (files: FileContent[]) => void;
  allowDirectories?: boolean;
}

// Maximum file size in bytes (5MB per file)
const MAX_FILE_SIZE = 5 * 1024 * 1024;
// Maximum total upload size in bytes (50MB)
const MAX_TOTAL_SIZE = 50 * 1024 * 1024;

export default function FileUpload({ onFilesSelected, allowDirectories = false }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();
  const [selectedFiles, setSelectedFiles] = useState<{ [key: string]: FileContent }>({});
  const [totalSize, setTotalSize] = useState(0);

  // Cleanup function to remove files
  const cleanupFiles = () => {
    setSelectedFiles({});
    setTotalSize(0);
    onFilesSelected([]);
  };

  // Effect to cleanup files when component unmounts
  useEffect(() => {
    return () => {
      cleanupFiles();
    };
  }, []);

  const handleFiles = useCallback(async (items: DataTransferItemList | FileList) => {
    const filePromises: Promise<void>[] = [];
    const newFiles: { [key: string]: FileContent } = {};
    let newTotalSize = 0;

    const processFile = async (file: File, path = '') => {
      try {
        // Check individual file size
        if (file.size > MAX_FILE_SIZE) {
          throw new Error(`File ${file.name} exceeds the 5MB size limit`);
        }

        // Check if adding this file would exceed total size limit
        if (newTotalSize + file.size > MAX_TOTAL_SIZE) {
          throw new Error('Total upload size exceeds 50MB limit');
        }

        const content = await file.text();
        const filePath = path ? `${path}/${file.name}` : file.name;
        newFiles[filePath] = { path: filePath, content };
        newTotalSize += file.size;
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        toast({
          variant: "destructive",
          title: "Error",
          description: (error as Error).message || `Failed to process file ${file.name}`,
        });
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
      // Clear previous files before processing new ones
      cleanupFiles();

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
      }
    } catch (error) {
      console.error("Error handling files:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: (error as Error).message || "Failed to process files",
      });
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
              ? 'Maximum 50MB total, 5MB per file'
              : 'Maximum 50MB total, 5MB per file'}
          </p>
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