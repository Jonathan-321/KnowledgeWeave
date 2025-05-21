import { useState, useRef, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, FileText, Check, AlertCircle, File, FileType } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

export default function FileDropZone() {
  const [isHovering, setIsHovering] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", file.name);
      formData.append("type", getDocumentType(file.name));
      
      // Use direct fetch to bypass any middleware issues
      const response = await fetch("/api/documents", {
        method: "POST",
        body: formData,
        credentials: "include"
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} ${errorText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate queries to refresh the document list
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      
      toast({
        title: "Document uploaded successfully",
        description: "Your document is being processed and concepts are being extracted",
      });
      
      // Invalidate concepts and graph after a delay to allow processing time
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/concepts"] });
        queryClient.invalidateQueries({ queryKey: ["/api/graph"] });
      }, 3000);
    },
    onError: (error) => {
      setUploadProgress(0);
      setSelectedFile(null);
      
      toast({
        title: "Failed to upload document",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Simulate upload progress
  useEffect(() => {
    if (uploadMutation.isPending && selectedFile && uploadProgress < 90) {
      const interval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 300);
      
      return () => clearInterval(interval);
    }
    
    if (!uploadMutation.isPending && uploadProgress > 0) {
      setUploadProgress(100);
      const timeout = setTimeout(() => {
        setUploadProgress(0);
        setSelectedFile(null);
      }, 2000);
      
      return () => clearTimeout(timeout);
    }
  }, [uploadMutation.isPending, selectedFile, uploadProgress]);

  const getDocumentType = (filename: string): string => {
    const extension = filename.split(".").pop()?.toLowerCase() || "";
    
    if (extension === "pdf") return "pdf";
    if (["doc", "docx"].includes(extension)) return "document";
    if (["txt", "md"].includes(extension)) return "note";
    return "article";
  };

  const getFileIcon = (filename: string) => {
    const extension = filename.split(".").pop()?.toLowerCase() || "";
    
    switch (extension) {
      case "pdf":
        return <FileText className="text-red-500" size={24} />;
      case "doc":
      case "docx":
        return <FileText className="text-blue-500" size={24} />;
      case "txt":
      case "md":
        return <File className="text-gray-500" size={24} />;
      default:
        return <FileType className="text-gray-500" size={24} />;
    }
  };

  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedFile(file);
      setUploadProgress(0);
      uploadMutation.mutate(file);
    }
  };

  const { getRootProps, getInputProps, isDragReject } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
      "text/markdown": [".md"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxSize: 10485760, // 10MB
    multiple: false,
    onDragEnter: () => setIsHovering(true),
    onDragLeave: () => setIsHovering(false),
    onDropAccepted: () => setIsHovering(false),
    onDropRejected: () => {
      setIsHovering(false);
      toast({
        title: "File not accepted",
        description: "Please upload a PDF, Word document, or text file (max 10MB)",
        variant: "destructive",
      });
    },
  });

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div
      {...getRootProps()}
      className={`file-drop-area p-4 text-center border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200 ${
        isHovering ? "border-primary bg-blue-50 dark:bg-blue-950/20" : 
        isDragReject ? "border-red-400 bg-red-50 dark:bg-red-950/20" : 
        "border-neutral-200 dark:border-gray-700"
      } ${uploadMutation.isPending ? "opacity-95" : ""}`}
    >
      <input {...getInputProps()} ref={fileInputRef} />
      
      {selectedFile && uploadProgress > 0 ? (
        <div className="py-2">
          <div className="flex items-center justify-center mb-2">
            {getFileIcon(selectedFile.name)}
            <div className="ml-2 text-left">
              <p className="text-sm font-medium truncate max-w-[200px]">{selectedFile.name}</p>
              <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
            </div>
          </div>
          
          <Progress value={uploadProgress} className="h-2 my-2" />
          
          <div className="flex justify-center items-center text-xs mt-1">
            {uploadProgress === 100 ? (
              <div className="flex items-center text-green-600">
                <Check size={14} className="mr-1" />
                <span>Upload complete!</span>
              </div>
            ) : uploadMutation.isPending ? (
              <span className="text-blue-600">Uploading... {uploadProgress}%</span>
            ) : (
              <span className="text-red-500 flex items-center">
                <AlertCircle size={14} className="mr-1" />
                Upload failed
              </span>
            )}
          </div>
        </div>
      ) : (
        <>
          <Upload className="mx-auto h-8 w-8 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Upload Documents</h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Drag and drop files or click to browse
          </p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            Supported formats: PDF, Word, Text (Max: 10MB)
          </p>
        </>
      )}
      
      <Button
        size="sm"
        className="mt-3"
        disabled={uploadMutation.isPending}
        onClick={handleButtonClick}
      >
        <Upload className="mr-1" size={14} />
        <span>{uploadMutation.isPending ? "Uploading..." : "Select File"}</span>
      </Button>
    </div>
  );
}
