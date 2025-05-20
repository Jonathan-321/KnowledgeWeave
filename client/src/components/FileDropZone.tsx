import { useState, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function FileDropZone() {
  const [isHovering, setIsHovering] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", file.name);
      formData.append("type", getDocumentType(file.name));
      
      const response = await apiRequest("POST", "/api/documents", formData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Document uploaded successfully",
        description: "Your document is being processed",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to upload document",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getDocumentType = (filename: string): string => {
    const extension = filename.split(".").pop()?.toLowerCase() || "";
    
    if (extension === "pdf") return "pdf";
    if (["doc", "docx"].includes(extension)) return "document";
    if (["txt", "md"].includes(extension)) return "note";
    return "article";
  };

  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
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
    onDropRejected: () => setIsHovering(false),
  });

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div
      {...getRootProps()}
      className={`file-drop-area p-4 text-center border-2 border-dashed rounded-lg cursor-pointer ${
        isHovering ? "border-primary bg-blue-50 dark:bg-blue-950/20" : "border-neutral-200 dark:border-gray-700"
      } ${uploadMutation.isPending ? "opacity-75 pointer-events-none" : ""}`}
    >
      <input {...getInputProps()} ref={fileInputRef} />
      <Upload className="mx-auto h-8 w-8 text-gray-400" />
      <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Upload Documents</h3>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Drag and drop files or click to browse
      </p>
      <Button
        size="sm"
        className="mt-2"
        disabled={uploadMutation.isPending}
        onClick={handleButtonClick}
      >
        <Upload className="mr-1" size={14} />
        <span>{uploadMutation.isPending ? "Uploading..." : "Select Files"}</span>
      </Button>
    </div>
  );
}
