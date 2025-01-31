import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, File, Folder, X } from "lucide-react";
import type { FileContent } from "@/lib/openai";
import { useToast } from "@/hooks/use-toast";

interface FileUploadProps {
  onFilesSelected: (files: FileContent[]) => void;
}

export default function FileUpload({ onFilesSelected }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();
  const [selectedFiles, setSelectedFiles] = useState<{ [key: string]: FileContent }>({});

  const handleFiles = useCallback(async (items: DataTransferItemList | FileList) => {
    const filePromises: Promise<void>[] = [];
    const newFiles: { [key: string]: FileContent } = {};

    const processFile = async (file: File, path = '') => {
      const content = await file.text();
      const filePath = path ? `${path}/${file.name}` : file.name;
      newFiles[filePath] = { path: filePath, content };
    };

    const processEntry = async (entry: FileSystemEntry, path = '') => {
      if (entry.isFile) {
        const fileEntry = entry as FileSystemFileEntry;
        fileEntry.file(file => {
          filePromises.push(processFile(file, path));
        });
      } else if (entry.isDirectory) {
        const dirEntry = entry as FileSystemDirectoryEntry;
        const dirReader = dirEntry.createReader();
        await new Promise<void>(resolve => {
          dirReader.readEntries(async entries => {
            for (const entry of entries) {
              await processEntry(entry, path ? `${path}/${dirEntry.name}` : dirEntry.name);
            }
            resolve();
          });
        });
      }
    };

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
    setSelectedFiles(prev => ({ ...prev, ...newFiles }));
    onFilesSelected(Object.values(newFiles));
  }, [onFilesSelected]);

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
    if (e.target.files) {
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
              ? 'Drop files or folders here, or click to select'
              : 'Drop more files or click to select'}
          </label>
          <p className="text-sm text-zinc-500">
            Drag and drop files or entire folders to review
          </p>
        </CardContent>
      </Card>

      {Object.keys(selectedFiles).length > 0 && (
        <Card className="border-zinc-800">
          <CardContent className="pt-6">
            <h3 className="text-lg font-medium mb-4">Selected Files</h3>
            {renderFileTree()}
          </CardContent>
        </Card>
      )}
    </div>
  );
}