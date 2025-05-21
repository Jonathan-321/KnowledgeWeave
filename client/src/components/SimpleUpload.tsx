import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function SimpleUpload() {
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    setUploading(true);
    setUploadStatus("Uploading...");
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", file.name);
      formData.append("type", file.name.split('.').pop() || 'txt');
      
      const response = await fetch("/api/documents", {
        method: "POST",
        body: formData
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to upload: ${errorText}`);
      }
      
      setUploadStatus("Success! Processing document...");
      toast({
        title: "Document uploaded successfully",
        description: "Your document is being processed and will be available soon",
      });
      
      // Refresh data
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
        queryClient.invalidateQueries({ queryKey: ["/api/concepts"] });
        queryClient.invalidateQueries({ queryKey: ["/api/graph"] });
        setUploading(false);
        setUploadStatus(null);
        if (inputRef.current) inputRef.current.value = '';
      }, 3000);
      
    } catch (error) {
      setUploadStatus("Failed to upload");
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
      setUploading(false);
    }
  };

  return (
    <div className="p-6 border border-dashed rounded-lg text-center">
      <h3 className="text-lg font-medium mb-2">Upload Document</h3>
      <p className="text-sm text-gray-500 mb-4">
        Upload a PDF, text, or Word document to create concepts
      </p>
      
      <div className="flex flex-col items-center">
        <input 
          type="file" 
          className="hidden" 
          accept=".pdf,.txt,.doc,.docx,.md" 
          onChange={handleUpload} 
          ref={inputRef}
        />
        
        <Button
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="mb-2"
        >
          <Upload className="mr-2" size={16} />
          Select File
        </Button>
        
        {uploadStatus && (
          <p className={`text-sm mt-2 ${uploadStatus.includes('Success') ? 'text-green-600' : uploadStatus.includes('Failed') ? 'text-red-600' : 'text-blue-600'}`}>
            {uploadStatus}
          </p>
        )}
      </div>
    </div>
  );
}